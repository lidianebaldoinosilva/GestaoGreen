
export enum MaterialTypeID {
  PEBD = "010",
  PP = "020"
}

export interface Material {
  id: string;
  name: string;
  code: string; // 3 digits, e.g., '010'
  ncm?: string; // Nomenclatura Comum do Mercosul
}

export interface Partner {
  id: string;
  name: string;
  code: string; // 3 digits, e.g., '012'
  type: 'supplier' | 'customer' | 'service_provider' | 'both';
  document?: string; // CPF or CNPJ
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export type BatchStatus = 'raw' | 'processing' | 'finished' | 'sold' | 'extruding' | 'extruded';

export interface ShippingInfo {
  plate?: string;
  driverName?: string;
  carrier?: string;
  document?: string;
  cost?: number;
  origin?: string;
  destination?: string;
  isFobOrOwn?: boolean;
}

export interface Batch {
  id: string; // format: 012/002/010
  partnerId: string;
  serviceProviderId?: string; // ID of partner performing external extrusion
  customerId?: string; // ID of partner buying the batch
  batchSequence: string; // e.g., '002'
  materialCode: string; // e.g., '010'
  weightKg: number;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
  salePricePerKg?: number;
  purchasePricePerKg?: number;
  shipping?: ShippingInfo;
}

export interface Transaction {
  id: string;
  batchId: string;
  type: 'purchase' | 'production' | 'sale' | 'extruding' | 'extruded' | 'loss';
  weight: number;
  originalWeight?: number;
  date: string;
  description: string;
}

export interface FinancialEntry {
  id: string;
  type: 'payable' | 'receivable';
  operationType: string; // Changed from union to string to allow custom types
  partnerId: string;
  batchId: string;
  amount: number;
  date: string; // Data de Registro/Emissão
  dueDate: string; // Data de Vencimento
  paymentDate?: string; // Data do Pagamento Efetivo
  status: 'pending' | 'paid';
  description: string;
}
