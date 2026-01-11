
import React, { useState } from 'react';
import { Partner, Material, Batch, BatchStatus } from '../types';
import { ShoppingCart, RefreshCw, Save } from 'lucide-react';

interface Props {
  partners: Partner[];
  materials: Material[];
  batches: Batch[];
  onPurchase: (partnerId: string, materialCode: string, weight: number) => void;
  onUpdateStatus: (id: string, status: BatchStatus, weight?: number) => void;
}

const TransactionForm: React.FC<Props> = ({ partners, materials, batches, onPurchase, onUpdateStatus }) => {
  const [activeForm, setActiveForm] = useState<'purchase' | 'update'>('purchase');
  
  // Purchase form state
  const [pPartner, setPPartner] = useState('');
  const [pMaterial, setPMaterial] = useState('10');
  const [pWeight, setPWeight] = useState('');

  // Update form state
  const [uBatch, setUBatch] = useState('');
  const [uStatus, setUStatus] = useState<BatchStatus>('processing');
  const [uWeight, setUWeight] = useState('');

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pPartner && pMaterial && pWeight) {
      onPurchase(pPartner, pMaterial, parseFloat(pWeight));
      setPWeight('');
      alert("Entrada de material registrada!");
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uBatch && uStatus) {
      onUpdateStatus(uBatch, uStatus, uWeight ? parseFloat(uWeight) : undefined);
      setUWeight('');
      alert("Status do lote atualizado!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveForm('purchase')}
          className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition font-bold ${
            activeForm === 'purchase' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 bg-white'
          }`}
        >
          <ShoppingCart className="w-5 h-5" /> Registrar Compra (Entrada)
        </button>
        <button 
          onClick={() => setActiveForm('update')}
          className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition font-bold ${
            activeForm === 'update' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 bg-white'
          }`}
        >
          <RefreshCw className="w-5 h-5" /> Atualizar Processo / Venda
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        {activeForm === 'purchase' ? (
          <form onSubmit={handlePurchaseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Fornecedor</label>
                <select 
                  required
                  value={pPartner}
                  onChange={e => setPPartner(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-slate-50"
                >
                  <option value="">Selecione o Fornecedor...</option>
                  {partners.filter(p => p.type !== 'customer').map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Tipo de Material</label>
                <select 
                  required
                  value={pMaterial}
                  onChange={e => setPMaterial(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-slate-50"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.code}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Peso Total (Kg)</label>
              <input 
                required
                type="number"
                value={pWeight}
                onChange={e => setPWeight(e.target.value)}
                placeholder="Ex: 1500"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-200">
              <Save className="w-5 h-5" /> Registrar Entrada no Estoque
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Lote Disponível</label>
              <select 
                required
                value={uBatch}
                onChange={e => {
                  setUBatch(e.target.value);
                  const b = batches.find(x => x.id === e.target.value);
                  if (b) setUWeight(b.weightKg.toString());
                }}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-slate-50"
              >
                <option value="">Selecione um lote em estoque...</option>
                {batches.map(b => {
                   const mat = materials.find(m => m.code === b.materialCode);
                   return <option key={b.id} value={b.id}>{b.id} - {mat?.name} ({b.weightKg}kg)</option>
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Novo Status</label>
                <select 
                  required
                  value={uStatus}
                  onChange={e => setUStatus(e.target.value as any)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-slate-50"
                >
                  <option value="processing">Em Moagem/Lavagem</option>
                  <option value="finished">Prensado (Acabado)</option>
                  <option value="sold">Vendido (Baixa Estoque)</option>
                  <option value="extruded">Extrusão Terceirizada</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Peso Final (Ajuste Kg)</label>
                <input 
                  type="number"
                  value={uWeight}
                  onChange={e => setUWeight(e.target.value)}
                  placeholder="Peso após quebra/processo"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-200">
              <RefreshCw className="w-5 h-5" /> Atualizar Status do Lote
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;
