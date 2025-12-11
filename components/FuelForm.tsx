
import React, { useState, useEffect, useRef } from 'react';
import { FuelRecord, VehicleOption } from '../types';
import { FUEL_OPTIONS as DEFAULT_FUEL_OPTIONS, PAYMENT_OPTIONS as DEFAULT_PAYMENT_OPTIONS, APP_OPTIONS as DEFAULT_APP_OPTIONS, DEFAULT_USER } from '../constants';
import { generateUUID, saveRecord, fetchFormOptions } from '../services/sheetsService';
import { Save, RotateCcw, Loader2, Info, Edit2, Mic, StopCircle, Wand2, CheckCircle2, AlertTriangle,ThumbsUp, Tag, Car, ChevronDown, CreditCard, Banknote, QrCode, Ticket, Smartphone, X, Check, DollarSign, CircleDollarSign } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// Helper to format currency in BRL
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface FuelFormProps {
  initialData?: FuelRecord | null;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- REUSABLE CUSTOM SELECT COMPONENT ---
interface CustomSelectProps {
  id: string;
  label: string;
  value: string;
  options: string[] | { label: string, value: string }[];
  onChange: (val: string) => void;
  isLoading?: boolean;
  error?: string;
  placeholder?: string;
  renderIcon: (val: string) => React.ReactNode;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  id, label, value, options, onChange, isLoading, error, placeholder = "Selecione...", renderIcon, disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to objects
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = normalizedOptions.find(o => o.value === value)?.label || value;

  return (
    <div className="mb-0" ref={containerRef}>
      <style>{`
        .custom-select-option {
          transition: background-color 0.2s ease, padding-left 0.2s ease, color 0.2s ease;
          border: none;
          margin-bottom: 2px;
          border-radius: 0.375rem;
        }
        .custom-select-option:hover {
          background-color: rgba(var(--bs-primary-rgb), 0.08) !important;
          padding-left: 1.25rem !important; /* Efeito de indentação */
          color: var(--bs-primary);
        }
        [data-bs-theme="dark"] .custom-select-option:hover {
           background-color: rgba(255,255,255, 0.08) !important;
           color: var(--neutral-200);
        }
      `}</style>

      <label htmlFor={id} className="form-label small fw-medium">
        {label} {isLoading && <Loader2 className="animate-spin text-muted ms-1" size={12} />}
      </label>
      
      <div className="position-relative">
        <button
          type="button"
          id={id}
          className={`form-select text-start d-flex align-items-center justify-content-between ${error ? 'is-invalid' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || (isLoading && normalizedOptions.length === 0)}
        >
          {value ? (
            <span className="d-flex align-items-center text-truncate">
               <span className="me-2 flex-shrink-0 d-flex align-items-center text-muted">
                 {renderIcon(value)}
               </span>
               <span className="text-truncate">{selectedLabel}</span>
            </span>
          ) : (
            <span className="text-body text-opacity-75">{placeholder}</span>
          )}
          {/* Chevron logic is handled by form-select class usually, but we can override or keep generic */}
        </button>

        {isOpen && (
          <div className="card position-absolute w-100 mt-1 shadow-lg border-0 overflow-hidden animate-fade-in" style={{zIndex: 1050, overflowY: 'auto'}}>
             <div className="list-group list-group-flush p-1">
                {normalizedOptions.length === 0 ? (
                    <div className="p-3 text-muted small text-center">Nenhuma opção disponível</div>
                ) : (
                    normalizedOptions.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex align-items-center px-3 py-2 custom-select-option ${value === opt.value ? 'bg-primary bg-opacity-10 text-primary fw-medium' : ''}`}
                        onClick={() => {
                            onChange(opt.value);
                            setIsOpen(false);
                        }}
                    >
                        <span className="me-2 d-flex align-items-center text-muted opacity-75">
                            {renderIcon(opt.value)}
                        </span>
                        {opt.label}
                        {value === opt.value && <CheckCircle2 size={14} className="ms-auto text-primary" />}
                    </button>
                    ))
                )}
             </div>
          </div>
        )}
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};


const FuelForm: React.FC<FuelFormProps> = ({ initialData, onSaveSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useApp, setUseApp] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Dynamic Options State - Sorted Alphabetically
  const [fuelOptions, setFuelOptions] = useState<string[]>([...DEFAULT_FUEL_OPTIONS].sort((a, b) => a.localeCompare(b)));
  const [paymentOptions, setPaymentOptions] = useState<string[]>([...DEFAULT_PAYMENT_OPTIONS].sort((a, b) => a.localeCompare(b)));
  const [appOptions, setAppOptions] = useState<string[]>([...DEFAULT_APP_OPTIONS].sort((a, b) => a.localeCompare(b)));
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [veiculo, setVeiculo] = useState('');
  const [km, setKm] = useState<string>('');
  const [posto, setPosto] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [precoL, setPrecoL] = useState<string>('');
  const [precoBomba, setPrecoBomba] = useState<string>('');
  const [qtd, setQtd] = useState<string>('');
  const [formaPagto, setFormaPagto] = useState('');
  const [app, setApp] = useState('');
  const [obs, setObs] = useState('');
  const [total, setTotal] = useState<string>('0.00');

  // Dynamic Labels Logic
  const getDynamicLabels = () => {
    const c = combustivel.toLowerCase();
    if (c === 'elétrico' || c === 'eletrico' || c === 'kva' || c.includes('kva')) {
        return {
            bombaLabel: 'Preço no Carregador',
            priceLabel: 'Preço Pago/KVA',
            unit: 'KVA'
        };
    }
    if (c === 'gnv') {
        return {
            bombaLabel: 'Preço por m³',
            priceLabel: 'Preço Pago/m³',
            unit: 'm³'
        };
    }
    return {
        bombaLabel: 'Preço na Bomba',
        priceLabel: 'Preço Pago/L',
        unit: 'L'
    };
  };

  const labels = getDynamicLabels();
  const unitLabel = labels.unit;

  // --- ICON HELPERS ---
  const getFuelColorVar = (fuel: string) => {
    const lower = fuel.toLowerCase();
    if (lower.includes('aditivada')) return 'var(--fuel-gas-additive)';
    if (lower.includes('gasolina')) return 'var(--fuel-gasoline)';
    if (lower.includes('etanol') || lower.includes('alcool')) return 'var(--fuel-ethanol)';
    if (lower.includes('diesel') && lower.includes('s10')) return 'var(--fuel-diesel-s10)';
    if (lower.includes('diesel')) return 'var(--fuel-diesel)';
    if (lower.includes('gnv')) return 'var(--fuel-gnv)';
    if (lower.includes('elétrico') || lower.includes('eletrico')) return 'var(--fuel-electric)';
    return 'var(--fuel-other)';
  };

  const renderFuelIcon = (val: string) => (
     <span className="rounded-circle d-inline-block" style={{width: 12, height: 12, backgroundColor: getFuelColorVar(val)}}></span>
  );

  const renderPaymentIcon = (val: string) => {
      const lower = val.toLowerCase();
      if (lower.includes('crédito') || lower.includes('credito') || lower.includes('débito') || lower.includes('debito')) return <CreditCard size={16} />;
      if (lower.includes('dinheiro') || lower.includes('especie')|| lower.includes('cashback')) return <DollarSign size={16} />;
      if (lower.includes('pix')) return <QrCode size={16} />;
      if (lower.includes('vale') || lower.includes('ticket')|| lower.includes('outro')) return <Ticket size={16} />;
      return <CreditCard size={16} />; // Fallback
  };

  const renderAppIcon = (val: string) => {
      const lower = val.toLowerCase();
      let color = 'currentColor';
      if (lower.includes('shell')) color = 'var(--bs-warning)';
      if (lower.includes('premmia')) color = 'var(--bs-danger)';
      if (lower.includes('barat')) color = 'var(--bs-success)';
      //return <Smartphone size={16} style={{color: color === 'currentColor' ? undefined : color}} />;
      return <Smartphone size={16}/>;
  };

  const renderVehicleIcon = (val: string) => <Car size={16} />;

  // References for focus management
  const kmRef = useRef<HTMLInputElement>(null);
  const postoRef = useRef<HTMLInputElement>(null);
  const precoLRef = useRef<HTMLInputElement>(null);
  const qtdRef = useRef<HTMLInputElement>(null);
  const precoBombaRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // Ref to track successful save transition
  const justSavedRef = useRef(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showConfirmModal]);

  // Load dynamic options on mount
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      const data = await fetchFormOptions();
      if (data) {
        if (data.fuels && data.fuels.length > 0) {
            setFuelOptions([...data.fuels].sort((a, b) => a.localeCompare(b)));
        }
        if (data.payments && data.payments.length > 0) {
            setPaymentOptions([...data.payments].sort((a, b) => a.localeCompare(b)));
        }
        if (data.apps && data.apps.length > 0) {
            setAppOptions([...data.apps].sort((a, b) => a.localeCompare(b)));
        }
        
        if (data.vehicles && data.vehicles.length > 0) {
            // Sort vehicles alphabetically by name
            const sortedVehicles = [...data.vehicles].sort((a, b) => a.name.localeCompare(b.name));
            setVehicleOptions(sortedVehicles);
            if (!initialData && !veiculo) {
                const defaultCar = sortedVehicles.find(v => v.isDefault);
                if (defaultCar) setVeiculo(defaultCar.name);
                else setVeiculo(sortedVehicles[0].name);
            }
        }
      }
      setIsLoadingOptions(false);
    };
    loadOptions();
  }, []); 

  // Auto-dismiss toast and Manage Focus
  useEffect(() => {
    if (toast) {
      if (toastRef.current) {
        toastRef.current.focus();
      }
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Robust Clear Function
  const handleClear = (shouldClearToast = true) => {
    setDate(new Date().toISOString().split('T')[0]);
    const defaultCar = vehicleOptions.find(v => v.isDefault);
    if (defaultCar) setVeiculo(defaultCar.name);
    else if (vehicleOptions.length > 0) setVeiculo(vehicleOptions[0].name);
    else setVeiculo('');

    setKm('');
    setPosto('');
    setCombustivel('');
    setPrecoL('');
    setPrecoBomba('');
    setQtd('');
    setFormaPagto('');
    setApp('');
    setUseApp(false);
    setObs('');
    setTotal('0.00');

    setErrors({});
    setShowConfirmModal(false);
    
    if (shouldClearToast) {
      setToast(null);
    }

    setIsProcessingVoice(false);
    if (isRecording) {
      stopRecording();
    }
  };

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      setDate(initialData.data);
      setVeiculo(initialData.veiculo || '');
      setKm(initialData.km.toString());
      setPosto(initialData.posto);
      setCombustivel(initialData.combustivel);
      setPrecoL(formatCurrency(initialData.precoL));
      setQtd(initialData.qtd.toString());
      setFormaPagto(initialData.formaPagto);
      setTotal(initialData.total.toFixed(2));
      setObs(initialData.obs);
      
      if (initialData.app) {
        setUseApp(true);
        setApp(initialData.app);
        const pb = initialData.precoBomba || initialData.precoL;
        setPrecoBomba(formatCurrency(pb));
      } else {
        setUseApp(false);
        setApp('');
        setPrecoBomba('');
      }
      setErrors({});
      setToast(null);
    } else {
      if (justSavedRef.current) {
        handleClear(false);
        justSavedRef.current = false;
      } 
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initialData]);

  useEffect(() => {
    const priceDigits = precoL.replace(/\D/g, '');
    const p = priceDigits ? parseInt(priceDigits, 10) / 100 : 0;
    const q = parseFloat(qtd);
    
    if (!isNaN(p) && !isNaN(q) && p > 0 && q > 0) {
       const calculated = (p * q).toFixed(2);
       setTotal(calculated);
    }
  }, [precoL, qtd]);

  useEffect(() => {
    if (!useApp) {
      setApp('');
      setPrecoBomba('');
    }
  }, [useApp]);

  const formatInputCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';
    const floatValue = Number(numericValue) / 100;
    return formatCurrency(floatValue);
  };

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecoL(formatInputCurrency(e.target.value));
    if(errors.precoL) setErrors(prev => ({...prev, precoL: ''}));
  };

  const handlePrecoBombaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecoBomba(formatInputCurrency(e.target.value));
    if(errors.precoBomba) setErrors(prev => ({...prev, precoBomba: ''}));
  };

  // --- VOICE HANDLERS ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
        await processAudioWithGemini(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setErrors({});
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setErrors({ general: "Erro ao acessar o microfone. Verifique as permissões." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioWithGemini = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analise o áudio de um motorista descrevendo um abastecimento.
        Data de hoje: ${new Date().toLocaleDateString('pt-BR')}.
        Carros disponíveis: ${vehicleOptions.map(v => v.name).join(', ')}. Tente identificar o carro.

        Opções válidas (use exatamente estas):
        Combustíveis: ${fuelOptions.join(', ')}. (Álcool = Etanol).
        Pagamento: ${paymentOptions.join(', ')}.
        Apps: ${appOptions.join(', ')}.

        Extraia os dados. 
        - veiculo: Nome do carro identificado.
        - precoL: Preço final pago por litro.
        - precoBomba: Preço original na bomba.
        
        Se o usuário disser "Deu 200 reais", Total = 200.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              km: { type: Type.NUMBER, description: "Odômetro atual" },
              veiculo: { type: Type.STRING, description: "Carro abastecido" },
              posto: { type: Type.STRING, description: "Nome do posto" },
              combustivel: { type: Type.STRING, description: "Tipo de combustível" },
              qtd: { type: Type.NUMBER, description: "Quantidade" },
              total: { type: Type.NUMBER, description: "Valor total" },
              precoL: { type: Type.NUMBER, description: "Preço pago" },
              precoBomba: { type: Type.NUMBER, description: "Preço original" },
              formaPagto: { type: Type.STRING, description: "Forma de pagamento" },
              app: { type: Type.STRING, description: "App usado" },
              obs: { type: Type.STRING, description: "Observações" }
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (data.km) setKm(data.km.toString());
        if (data.posto) setPosto(data.posto);
        if (data.veiculo) {
           const matchCar = vehicleOptions.find(v => v.name.toLowerCase() === data.veiculo.toLowerCase());
           if (matchCar) setVeiculo(matchCar.name);
        }
        if (data.combustivel) {
            const match = fuelOptions.find(f => f.toLowerCase() === data.combustivel.toLowerCase()) || data.combustivel;
            setCombustivel(match);
        }
        if (data.formaPagto) {
             const match = paymentOptions.find(p => p.toLowerCase().includes(data.formaPagto.toLowerCase())) || data.formaPagto;
             setFormaPagto(match);
        }
        
        let extractedTotal = data.total;
        let extractedQtd = data.qtd;
        let extractedPrecoL = data.precoL;

        if (extractedTotal && extractedQtd && !extractedPrecoL) {
            extractedPrecoL = extractedTotal / extractedQtd;
        } else if (extractedTotal && extractedPrecoL && !extractedQtd) {
            extractedQtd = extractedTotal / extractedPrecoL;
        } else if (extractedQtd && extractedPrecoL && !extractedTotal) {
            extractedTotal = extractedQtd * extractedPrecoL;
        }

        if (extractedQtd) setQtd(extractedQtd.toString());
        if (extractedTotal) setTotal(extractedTotal.toFixed(2));
        if (extractedPrecoL) setPrecoL(formatCurrency(extractedPrecoL));

        if (data.app) {
            setUseApp(true);
            const matchApp = appOptions.find(a => a.toLowerCase() === data.app.toLowerCase()) || data.app;
            setApp(matchApp);
            if (data.precoBomba) {
                setPrecoBomba(formatCurrency(data.precoBomba));
            }
        }

        if (data.obs) setObs(data.obs);
        setToast({ type: 'success', message: "Dados preenchidos por voz!" });
      }

    } catch (error) {
      console.error("Error processing voice:", error);
      setErrors({ general: "Não foi possível entender o áudio. Tente novamente." });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // --- SUBMIT & VALIDATION ---
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    let firstErrorRef: React.RefObject<any> | null = null;
    
    const priceDigits = precoL.replace(/\D/g, '');
    const numericPrecoL = priceDigits ? parseInt(priceDigits, 10) / 100 : 0;
    
    const bombaDigits = precoBomba.replace(/\D/g, '');
    const numericPrecoBomba = bombaDigits ? parseInt(bombaDigits, 10) / 100 : 0;

    const numericKm = parseFloat(km);
    const numericQtd = parseFloat(qtd);

    if (!veiculo) { newErrors.veiculo = "Selecione o veículo."; }

    if (!km) { newErrors.km = "Informe o odômetro."; if(!firstErrorRef) firstErrorRef = kmRef; }
    else if (isNaN(numericKm) || numericKm <= 0) { newErrors.km = "Valor inválido."; if(!firstErrorRef) firstErrorRef = kmRef; }

    if (!posto.trim()) { newErrors.posto = "Informe o nome do posto."; if(!firstErrorRef) firstErrorRef = postoRef; }
    
    if (!combustivel) { newErrors.combustivel = "Selecione o combustível."; }
    
    if (!precoL) { newErrors.precoL = "Informe o preço pago."; if(!firstErrorRef) firstErrorRef = precoLRef; }
    else if (isNaN(numericPrecoL) || numericPrecoL <= 0) { newErrors.precoL = "Preço inválido."; if(!firstErrorRef) firstErrorRef = precoLRef; }
    
    if (!qtd) { newErrors.qtd = "Informe a quantidade."; if(!firstErrorRef) firstErrorRef = qtdRef; }
    else if (isNaN(numericQtd) || numericQtd <= 0) { newErrors.qtd = "Quantidade inválida."; if(!firstErrorRef) firstErrorRef = qtdRef; }

    if (!formaPagto) { newErrors.formaPagto = "Selecione o pagamento."; }

    if (useApp) {
      if (!app) { newErrors.app = "Selecione o aplicativo."; }
      if (!precoBomba) { newErrors.precoBomba = "Informe o preço original."; if(!firstErrorRef) firstErrorRef = precoBombaRef; }
      else if (isNaN(numericPrecoBomba) || numericPrecoBomba <= 0) { newErrors.precoBomba = "Preço inválido."; if(!firstErrorRef) firstErrorRef = precoBombaRef; }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
        setToast({ type: 'error', message: "Verifique os campos destacados em vermelho." });
        if(firstErrorRef && firstErrorRef.current) {
            (firstErrorRef.current as HTMLElement).focus();
            (firstErrorRef.current as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSave = async () => {
    // DO NOT CLOSE MODAL HERE - KEEP IT OPEN FOR LOADING STATE
    setIsSubmitting(true);

    const priceDigits = precoL.replace(/\D/g, '');
    const numericPrecoL = priceDigits ? parseInt(priceDigits, 10) / 100 : 0;

    let numericPrecoBomba = numericPrecoL;
    if (useApp) {
        const bombaDigits = precoBomba.replace(/\D/g, '');
        numericPrecoBomba = bombaDigits ? parseInt(bombaDigits, 10) / 100 : numericPrecoL;
    }

    const record: FuelRecord = {
      id: initialData ? initialData.id : generateUUID(), 
      data: date,
      veiculo,
      km: parseFloat(km),
      posto,
      combustivel,
      precoL: numericPrecoL,
      precoBomba: numericPrecoBomba,
      qtd: parseFloat(qtd),
      total: parseFloat(total),
      formaPagto,
      app: useApp ? app : null,
      user: initialData ? initialData.user : DEFAULT_USER,
      obs,
      active: initialData ? initialData.active : true
    };

    try {
      const isUpdate = !!initialData;
      const success = await saveRecord(record, isUpdate);
      
      if (success) {
        setShowConfirmModal(false); // Close modal only on success
        setToast({
           type: 'success',
           message: isUpdate ? "Registro atualizado com sucesso!" : "Abastecimento registrado com sucesso!"
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (!isUpdate) {
          handleClear(false);
        } else {
          justSavedRef.current = true;
          if(onSaveSuccess) onSaveSuccess();
        }
      } else {
        setShowConfirmModal(false); 
        setToast({
           type: 'error',
           message: "Erro ao salvar o registro."
        });
      }
    } catch (error) {
      setShowConfirmModal(false);
      setToast({
         type: 'error',
         message: "Ocorreu um erro inesperado."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
          <div 
             ref={toastRef}
             className={`position-fixed top-0 start-50 translate-middle-x mt-5 p-3 rounded shadow-lg d-flex align-items-center animate-pop-alert ${toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}
             style={{ zIndex: 1100, minWidth: '300px' }}
             role="alert"
             tabIndex={-1}
          >
             {toast.type === 'success' ? <CheckCircle2 size={24} className="me-2" /> : <AlertTriangle size={24} className="me-2" />}
             <span className="fw-medium">{toast.message}</span>
             <button className="btn-close btn-close-white ms-auto" onClick={() => setToast(null)}></button>
          </div>
      )}

      <div className="card mx-auto border-0 shadow-lg" style={{maxWidth: '700px'}}>
        <div className="card-header bg-body-secondary py-3 px-3 px-md-4 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h4 mb-1 fw-bold">
              {initialData ? 'Editar Abastecimento' : 'Novo Abastecimento'}
            </h2>
            <p className="mb-0 small text-muted">
              {initialData ? 'Altere os dados abaixo e salve.' : 'Preencha os dados manualmente ou por voz.'}
            </p>
          </div>
        </div>

        <div className="card-body p-3 p-md-4">
          {errors.general && (
             <div className="alert alert-danger d-flex align-items-center mb-3 animate-fade-in" role="alert">
                <AlertTriangle size={20} className="me-2" />
                <div>{errors.general}</div>
             </div>
          )}

          {isRecording && (
              <div className="alert alert-danger py-2 d-flex align-items-center animate-fade-in mb-3">
                <div className="spinner-grow spinner-grow-sm text-danger me-2" role="status"></div>
                <small>Gravando...</small>
              </div>
          )}
          {isProcessingVoice && (
              <div className="alert alert-info py-2 d-flex align-items-center animate-fade-in mb-3">
                <div className="spinner-grow spinner-grow-sm text-info me-2" role="status"></div>
                <small>A IA está processando seu áudio...</small>
              </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            {/* Row 1: Data */}
            <div className="mb-3 row">
              <div className="col-6">
               <label htmlFor="data" className="form-label small fw-medium">Data</label>
               <input
                 type="date"
                 id="data"
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className={`form-control ${errors.data ? 'is-invalid' : ''}`}
                 required
               />
                {errors.data && <div className="invalid-feedback">{errors.data}</div>}
              </div>
            </div>

            {/* Row 2: Veiculo & Km */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                 <CustomSelect
                   id="veiculo"
                   label="Veículo"
                   value={veiculo}
                   options={vehicleOptions.length > 0 ? vehicleOptions.map(v => ({label: v.name, value: v.name})) : [{label: "Padrão", value: ""}]}
                   onChange={(val) => {
                      setVeiculo(val);
                      if(errors.veiculo) setErrors(prev => ({...prev, veiculo: ''}));
                   }}
                   isLoading={isLoadingOptions}
                   error={errors.veiculo}
                   renderIcon={renderVehicleIcon}
                   disabled={isLoadingOptions && vehicleOptions.length === 0}
                 />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="km" className="form-label small fw-medium">Odômetro</label>
                <input
                  ref={kmRef}
                  type="number"
                  id="km"
                  value={km}
                  onChange={(e) => {
                     setKm(e.target.value);
                     if(errors.km) setErrors(prev => ({...prev, km: ''}));
                  }}
                  placeholder="Km"
                  className={`form-control ${errors.km ? 'is-invalid' : ''}`}
                  min="1"
                  step="1"
                  required
                />
                {errors.km && <div className="invalid-feedback">{errors.km}</div>}
              </div>
            </div>

            {/* Row 3: Posto (Full Width) */}
            <div className="mb-3">
              <label htmlFor="posto" className="form-label small fw-medium">Posto de Combustível</label>
              <input
                ref={postoRef}
                type="text"
                id="posto"
                value={posto}
                onChange={(e) => {
                   setPosto(e.target.value);
                   if(errors.posto) setErrors(prev => ({...prev, posto: ''}));
                }}
                placeholder="Nome do posto"
                className={`form-control ${errors.posto ? 'is-invalid' : ''}`}
                required
              />
               {errors.posto && <div className="invalid-feedback">{errors.posto}</div>}
            </div>

            {/* Row 4: Combustivel e Pagamento */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <CustomSelect
                   id="combustivel"
                   label="Combustível"
                   value={combustivel}
                   options={fuelOptions}
                   onChange={(val) => {
                      setCombustivel(val);
                      if(errors.combustivel) setErrors(prev => ({...prev, combustivel: ''}));
                   }}
                   isLoading={isLoadingOptions}
                   error={errors.combustivel}
                   renderIcon={renderFuelIcon}
                />
              </div>

              <div className="col-md-6">
                <CustomSelect
                   id="formaPagto"
                   label="Forma de Pagamento"
                   value={formaPagto}
                   options={paymentOptions}
                   onChange={(val) => {
                      setFormaPagto(val);
                      if(errors.formaPagto) setErrors(prev => ({...prev, formaPagto: ''}));
                   }}
                   isLoading={isLoadingOptions}
                   error={errors.formaPagto}
                   renderIcon={renderPaymentIcon}
                />
              </div>
            </div>

            {/* Row 5: App Group */}
            <div className="row g-3 mb-3 align-items-start">
              <div className="col-12 col-md-4 mt-md-4 pt-md-2 align-self-flex-end">
                <div className="form-check p-2 rounded border bg-body-tertiary d-flex align-items-center">
                    <input
                      id="useApp"
                      type="checkbox"
                      checked={useApp}
                      onChange={(e) => setUseApp(e.target.checked)}
                      className="form-check-input ms-1 me-2"
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="useApp" className="form-check-label small fw-medium w-100 cursor-pointer">
                      Usou App de Desconto?
                    </label>
                </div>
              </div>

              {useApp && (
                <div className="col-6 col-md-4 animate-fade-in">
                  <CustomSelect
                     id="app"
                     label="Qual Aplicativo?"
                     value={app}
                     options={appOptions}
                     onChange={(val) => {
                        setApp(val);
                        if(errors.app) setErrors(prev => ({...prev, app: ''}));
                     }}
                     isLoading={isLoadingOptions}
                     error={errors.app}
                     renderIcon={renderAppIcon}
                  />
                </div>
              )}

              {useApp && (
                <div className="col-6 col-md-4 animate-fade-in">
                   <label htmlFor="precoBomba" className="form-label small fw-medium">
                      {labels.bombaLabel}
                   </label>
                   <input
                      ref={precoBombaRef}
                      type="text"
                      inputMode="numeric"
                      id="precoBomba"
                      value={precoBomba}
                      onChange={handlePrecoBombaChange}
                      placeholder="0,00"
                      className={`form-control ${errors.precoBomba ? 'is-invalid' : ''}`}
                   />
                   {errors.precoBomba && <div className="invalid-feedback">{errors.precoBomba}</div>}
                </div>
              )}
            </div>

            {/* Row 6: Calculation Block */}
            <div className="p-3 rounded bg-body-secondary mb-3 border">
              <div className="row g-3">
                <div className="col-4">
                  <label htmlFor="precoL" className="form-label small fw-medium">{labels.priceLabel}</label>
                  <input
                    ref={precoLRef}
                    type="text"
                    inputMode="numeric"
                    id="precoL"
                    value={precoL}
                    onChange={handlePrecoChange}
                    placeholder="0,00"
                    className={`form-control px-2 ${errors.precoL ? 'is-invalid' : ''}`}
                    required
                  />
                </div>
                <div className="col-4">
                  <label htmlFor="qtd" className="form-label small fw-medium">Qtd ({labels.unit})</label>
                  <input
                    ref={qtdRef}
                    type="number"
                    id="qtd"
                    value={qtd}
                    onChange={(e) => {
                        setQtd(e.target.value);
                        if(errors.qtd) setErrors(prev => ({...prev, qtd: ''}));
                    }}
                    placeholder="0.00"
                    step="0.001"
                    min="0.01"
                    className={`form-control px-2 ${errors.qtd ? 'is-invalid' : ''}`}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-bold">Total Pago</label>
                  <div className="form-control bg-primary bg-opacity-10 text-primary Bborder-primary fw-bold text-end px-2 text-truncate">
                    {formatCurrency(parseFloat(total) || 0)}
                  </div>
                </div>
                
                {(errors.precoL || errors.qtd || errors.total) && (
                    <div className="col-12 mt-1">
                        {errors.precoL && <small className="text-danger d-block">• Preço: {errors.precoL}</small>}
                        {errors.qtd && <small className="text-danger d-block">• Quantidade: {errors.qtd}</small>}
                        {errors.total && <small className="text-danger d-block">• Total: {errors.total}</small>}
                    </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="obs" className="form-label small fw-medium">Observações (Opcional)</label>
              <textarea
                id="obs"
                rows={3}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="form-control"
              ></textarea>
            </div>

            <div className="d-flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex-fill d-flex align-items-center justify-content-center py-2 fw-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin me-2" size={20} />
                    {initialData ? 'Atualizando' : 'Processando'}
                  </>
                ) : (
                  <>
                    {initialData ? <Edit2 className="me-2" size={20} /> : <Save className="me-2" size={20} />}
                    {initialData ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </button>
              
              {initialData && onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="btn btn-light flex-fill d-flex align-items-center justify-content-center py-2 fw-medium"
                >
                  <X className="me-2" size={20} />
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleClear()}
                  disabled={isSubmitting}
                  className="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center py-2 fw-medium"
                >
                  <RotateCcw className="me-2" size={20} />
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {!initialData && (
         <button
           type="button"
           onClick={isRecording ? stopRecording : startRecording}
           disabled={isProcessingVoice || showConfirmModal}
           className={`btn rounded-circle d-flex align-items-center justify-content-center shadow-lg ${isRecording ? 'btn-danger animate-pulse' : 'btn-primary'}`}
           style={{
             position: 'fixed',
             bottom: '2rem',
             right: '1.5rem',
             width: '56px',
             height: '56px',
             zIndex: 1050,
             transition: 'all 0.3s ease'
           }}
           title="Preencher por voz"
         >
           {isProcessingVoice ? (
              <Loader2 className="animate-spin" size={32} />
           ) : isRecording ? (
              <StopCircle size={32} />
           ) : (
              <Mic size={32} />
           )}
         </button>
      )}

      {showConfirmModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{zIndex: 1060}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title d-flex align-items-center fw-bold text-success-emphasis">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
                      <Save className="me" size={24} />
                    </div>
                    Confirmar Registro
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)} aria-label="Close">
                    
                  </button>
                </div>
                <div className="modal-body p-4">
                   <p className="mb-4 text-muted fw-bolder">Confira os dados</p>
                   
                   <div className="bg-success-subtle p-3 rounded mb-2">
                      <div className="row g-2">
                        <div className="col-12">
                            <small className="text-mut d-block">Data</small>
                            <span className="h5 fw-bold mb-0">{new Date(date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                        </div>
                         <div className="col-9">
                             <small className="text-muted d-block">Veículo</small>
                             <span className="fw-medium d-flex align-items-center"><Car size={14} className="me-1"/>{veiculo}</span>
                         </div>
                         <div className="col-3 text-end justify-items-end">
                             <small className="text-muted d-block">Odômetro</small>
                             <span className="fw-medium">{km}</span>
                         </div>
                         
                         <div className="col col-md-5">
                             <small className="text-muted d-block">Combustível</small>
                             <span className="fw-medium d-flex align-items-center">
                                 {combustivel && (
                                     <span className="rounded-circle me-1" style={{width: 8, height: 8, backgroundColor: getFuelColorVar(combustivel)}}></span>
                                 )}
                                 {combustivel}
                             </span>
                         </div>
                         <div className="col text-end justify-items-end">
                             <small className="text-muted d-block">Posto</small>
                             <span className="fw-medium text-truncate d-block">{posto}</span>
                         </div>
                         
                      </div>
                   </div>
                  <div className="hide">[/* --- Pagamento --- */]</div>
                   <div className="d-flex align-items-center justify-content-between bg-success-subtle p-3 rounded flex-wrap-wrap">
                      <div className="col-5">
                         <small className="text-primary fw-bold text-uppercase">Total a Pagar</small>
                         <div className="h4 fw-bold text-primary mb-0">{formatCurrency(parseFloat(total))}</div>
                      </div>
                      
                      <div className="col-7 text-end">
                         <small className="text-muted d-block">Qtd: {parseFloat(qtd).toFixed(2)} {unitLabel}</small>
                         <small className="text-muted">Preço: {formatCurrency(parseFloat(precoL.replace(/\D/g, '') || '0')/100)}/{unitLabel}</small>
                      </div>
                      <div className="row w-100 m-0 mt-2 border-top border-secondary border-opacity-25">
                        <div className="col-7 px-0 text-start pt-2 justify-items-start">
                          <small className="text-muted">Forma de Pagamento</small>
                          <div className="small text-dark">{formaPagto}</div>
                        </div>
                        
                        {useApp && (
                          <div className="col-5 px-0 text-end pt-2 justify-items-end">
                              <div className="d-flex align-items-center gap-2">
                                  <Tag size={14} className="hide text-muted" /><small className="text-muted">App</small>
                              </div>
                              <span className="small text-dark">{app}</span>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
                <div className="modal-footer border-top-0">
                  <button type="button" className="btn btn-light d-flex align-items-center" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                    <X className="me-2" size={18} />
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-success px-4 fw-medium d-flex align-items-center" onClick={handleConfirmSave} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin me-2" size={18} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="me-2" size={18} />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>
      )}
    </>
  );
};

export default FuelForm;
