
import React, { useState } from 'react';
import { Partner, Material, Batch, BatchStatus } from '../types.ts';
import { ShoppingCart, RefreshCw, Save, DollarSign } from 'lucide-react';

interface Props {
  partners: Partner[];
  materials: Material[];
  batches: Batch[];
  onPurchase: (partnerId: string, materialCode: string, weight: number, pricePerKg?: number) => void;
  onUpdateStatus: (id: string, status: BatchStatus, weight?: number) => void;
}

const TransactionForm: React.FC<Props> = ({ partners, materials, batches, onPurchase, onUpdateStatus }) => {
  const [activeForm, setActiveForm] = useState<'purchase' | 'update'>('purchase');
  
  const [pPartner, setPPartner] = useState('');
  const [pMaterial, setPMaterial] = useState('010');
  const [pWeight, setPWeight] = useState('');
  const [pPrice, setPPrice] = useState('');

  const [uBatch, setUBatch] = useState('');
  const [uStatus, setUStatus] = useState<BatchStatus>('processing');
  const [uWeight, setUWeight] = useState('');

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pPartner && pMaterial && pWeight) {
      onPurchase(pPartner, pMaterial, parseFloat(pWeight), pPrice ? parseFloat(pPrice) : undefined);
      setPWeight('');
      setPPrice('');
      alert("Entrada de material registrada!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveForm('purchase')} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition font-bold ${activeForm === 'purchase' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 bg-white'}`}>
          <ShoppingCart className="w-5 h-5" /> Registrar Compra (Entrada)
        </button>
        <button onClick={() => setActiveForm('update')} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition font-bold ${activeForm === 'update' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 bg-white'}`}>
          <RefreshCw className="w-5 h-5" /> Atualizar Processo
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        {activeForm === 'purchase' ? (
          <form onSubmit={handlePurchaseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Fornecedor</label>
                <select required value={pPartner} onChange={e => setPPartner(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <option value="">Selecione...</option>
                  {partners.filter(p => p.type !== 'customer').map(p => (<option key={p.id} value={p.id}>{p.name} ({p.code})</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Material</label>
                <select required value={pMaterial} onChange={e => setPMaterial(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50">
                  {materials.map(m => (<option key={m.id} value={m.code}>{m.name} ({m.code})</option>))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Peso Total (Kg)</label>
                <input required type="number" value={pWeight} onChange={e => setPWeight(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" placeholder="Ex: 1500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Preço por Kg (Opcional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="number" step="0.01" value={pPrice} onChange={e => setPPrice(e.target.value)} className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50" placeholder="R$ 0,00" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition hover:bg-emerald-700">
              <Save className="w-5 h-5" /> Registrar Entrada e Gerar Contas a Pagar
            </button>
          </form>
        ) : (
          <div className="text-center p-8 text-slate-500 italic">Use a aba "Estoque de Lotes" para gerenciar o processamento detalhado de cada lote individual.</div>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;
