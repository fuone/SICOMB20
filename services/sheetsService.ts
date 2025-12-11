import { FuelRecord, VehicleOption } from '../types';
import { GOOGLE_SCRIPT_URL, DEFAULT_USER } from '../constants';

/**
 * Generates a UUID v4
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

/**
 * MOCK STORAGE for demo purposes
 */
const LOCAL_STORAGE_KEY = 'fuel_tracker_local_data';

const getLocalRecords = (): FuelRecord[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalRecord = (record: FuelRecord, isUpdate: boolean = false): void => {
  const current = getLocalRecords();
  let updated = [];
  
  if (isUpdate) {
    updated = current.map(r => r.id === record.id ? record : r);
  } else {
    updated = [...current, record];
  }
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
};

/**
 * API FUNCTIONS
 */

export const saveRecord = async (record: FuelRecord, isUpdate: boolean = false): Promise<boolean> => {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      saveLocalRecord(record, isUpdate);
      return true;
    }

    const action = isUpdate ? 'update' : 'create';
    
    // Send to Google Apps Script
    // Adapter: Convert precoBomba to precoB (backend key)
    const payload: any = { ...record, action };
    if (record.precoBomba !== undefined) {
       payload.precoB = record.precoBomba;
       delete payload.precoBomba;
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result.status === 'success';

  } catch (error) {
    console.error("Error saving record:", error);
    // Fallback to local
    saveLocalRecord(record, isUpdate);
    return true; 
  }
};

export const fetchRecords = async (): Promise<FuelRecord[]> => {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return getLocalRecords();
    }

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=read`);
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
      // SANITIZATION: Force types to prevent "Object as Child" React errors
      // Note: The object properties here must match what is returned by the GAS script
      return result.data.map((r: any) => ({
        id: String(r.id),
        data: String(r.data),
        veiculo: String(r.veiculo || ''), 
        km: Number(r.km) || 0,
        posto: String(r.posto || ''),
        combustivel: String(r.combustivel || ''),
        precoL: Number(r.precoL) || 0,
        precoBomba: Number(r.precoBomba || r.precoL) || 0,
        formaPagto: String(r.formaPagto || ''),
        app: r.app ? String(r.app) : null,
        qtd: Number(r.qtd) || 0,
        total: Number(r.total) || 0,
        obs: String(r.obs || ''),
        user: String(r.user || ''),
        active: Boolean(r.active)
      }));
    }
    return [];

  } catch (error) {
    console.error("Error fetching records:", error);
    return getLocalRecords();
  }
};

export interface FormOptions {
  fuels: string[];
  payments: string[];
  apps: string[];
  vehicles: VehicleOption[];
}

export const fetchFormOptions = async (): Promise<FormOptions | null> => {
  try {
    if (!GOOGLE_SCRIPT_URL) {
        // Mock options
        return {
            fuels: ['Gasolina', 'Etanol'],
            payments: ['Crédito', 'Débito'],
            apps: ['Shell Box'],
            vehicles: [{ name: 'Meu Carro', isDefault: true, isActive: true }]
        };
    }

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=config`);
    const result = await response.json();

    if (result.status === 'success' && result.data) {
      const data = result.data;
      return {
        fuels: Array.isArray(data.fuels) ? data.fuels.map(String) : [],
        payments: Array.isArray(data.payments) ? data.payments.map(String) : [],
        apps: Array.isArray(data.apps) ? data.apps.map(String) : [],
        vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching options:", error);
    return null;
  }
};