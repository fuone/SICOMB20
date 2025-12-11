export enum FuelType {
  GASOLINA = 'Gasolina',
  GASOLINA_ADITIVADA = 'Gasolina Aditivada',
  ETANOL = 'Etanol',
  DIESEL = 'Diesel',
  DIESEL_S10 = 'Diesel S10',
  GNV = 'GNV',
  ELETRICO = 'Elétrico'
}

export enum PaymentMethod {
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
  CASH = 'Dinheiro',
  PIX = 'Pix',
  VOUCHER = 'Vale Combustível'
}

export enum FuelApp {
  BARATAO = 'Baratão',
  SHELL_BOX = 'Shell Box',
  ABASTECE_AI = 'Abastece Aí',
  PREMMIA = 'Premmia',
  COMPLETA = 'Completa',
  OUTROS = 'Outros'
}

export interface VehicleOption {
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface FuelRecord {
  id: string;
  data: string; // ISO Date string YYYY-MM-DD
  veiculo: string; // Novo campo: Veículo abastecido
  km: number;
  posto: string;
  combustivel: string;
  precoL: number;
  precoBomba: number; // Preço original na bomba sem desconto
  formaPagto: string;
  app: string | null; // null if not used
  qtd: number;
  total: number;
  user: string;
  obs: string;
  active: boolean;
}

export type ViewState = 'FORM' | 'LIST' | 'DASHBOARD';
export type Theme = 'light' | 'dark';