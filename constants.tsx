
import { Partner, Material, Batch } from './types';

export const INITIAL_PARTNERS: Partner[] = [
  { id: '1', name: 'Fornecedor Exemplo Silva', code: '012', type: 'supplier', document: '12.345.678/0001-90' },
  { id: '2', name: 'Plásticos Nordeste', code: '045', type: 'customer', document: '98.765.432/0001-21' },
];

export const MATERIALS: Material[] = [
  { id: 'm1', name: 'PEBD (Aparas de Sacolas)', code: '010', ncm: '3915.10.00' },
  { id: 'm2', name: 'PP (Rafia/Big Bags)', code: '020', ncm: '3915.90.00' },
];

export const INITIAL_BATCHES: Batch[] = [
  { 
    id: '012/001/010', 
    partnerId: '1', 
    batchSequence: '001', 
    materialCode: '010', 
    weightKg: 1250, 
    status: 'raw', 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
