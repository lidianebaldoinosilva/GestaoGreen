
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
  type: 'supplier' | 'customer' | 'service_provider' | 'seller' | 'both';
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
  operationType: string; 
  partnerId: string;
  batchId: string;
  amount: number;
  date: string; 
  dueDate: string; 
  paymentDate?: string; 
  status: 'pending' | 'paid';
  description: string;
}

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  deliveredQuantity: number; // New: tracking how much was already sold/shipped
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerId: string;
  sellerId?: string;
  commissionAmount?: number;
  isFob?: boolean; // true = FOB, false = CIF
  cnpj?: string;
  ie?: string;
  address?: string;
  phone?: string;
  items: OrderItem[];
  totalAmount: number;
  pixKey: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
}
