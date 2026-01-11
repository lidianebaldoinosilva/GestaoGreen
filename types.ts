
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
  type: 'supplier' | 'customer' | 'both';
  document?: string; // CPF or CNPJ (Opcional)
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export type BatchStatus = 'raw' | 'processing' | 'finished' | 'sold' | 'extruded';

export interface Batch {
  id: string; // format: 012/002/010
  partnerId: string;
  batchSequence: string; // e.g., '002'
  materialCode: string; // e.g., '010'
  weightKg: number;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  batchId: string;
  type: 'purchase' | 'production' | 'sale' | 'extrusion' | 'loss';
  weight: number;
  originalWeight?: number; // Para transações de produção/perda
  date: string;
  description: string;
}
