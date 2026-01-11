
import React, { useState } from 'react';
import { Batch, Partner, Material, BatchStatus } from '../types.ts';
import { MoreHorizontal, Search, CheckCircle2, Factory, Trash2, ArrowRight, X, Scale, AlertTriangle } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
  onUpdateStatus: (id: string, status: BatchStatus, weight?: number) => void;
}

const InventoryTable: React.FC<Props> = ({ batches, partners, materials, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [finalizingBatch, setFinalizingBatch] = useState<Batch | null>(null);
  const [finalWeight, setFinalWeight] = useState('');

  const filteredBatches = batches.filter(b => {
    const partner = partners.find(p => p.id === b.partnerId);
    const material = materials.find(m => m.code === b.materialCode);
    const searchString = `${b.id} ${partner?.name} ${material?.name}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getStatusStyle = (status: BatchStatus) => {
    switch (status) {
      case 'raw': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'finished': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'sold': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'extruded': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: BatchStatus) => {
    const labels: Record<BatchStatus, string> = {
      raw: 'Sujo / Entrada',
      processing: 'Em Processo',
      finished: 'Pronto (Fardo)',
      sold: 'Vendido',
      extruded: 'Extrusão Ext.'
    };
    return labels[status];
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalizingBatch && finalWeight) {
      onUpdateStatus(finalizingBatch.id, 'finished', parseFloat(finalWeight));
      setFinalizingBatch(null);
      setFinalWeight('');
    }
  };

  const loss = finalizingBatch && finalWeight ? finalizingBatch.weightKg - parseFloat(finalWeight) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrar por lote, parceiro ou material..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Lote</th>
              <th className="px-6 py-4">Material</th>
              <th className="px-6 py-4">Fornecedor/Cliente</th>
              <th className="px-6 py-4">Peso (kg)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBatches.map((batch) => {
              const partner = partners.find(p => p.id === batch.partnerId);
              const material = materials.find(m => m.code === batch.materialCode);
              return (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-700">{batch.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{material?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{partner?.name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{batch.weightKg.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(batch.status)}`}>
                      {getStatusLabel(batch.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {batch.status === 'raw' && (
                        <button 
                          onClick={() => onUpdateStatus(batch.id, 'processing')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Mover para Processamento"
                        >
                          <Factory className="w-4 h-4" />
                        </button>
                      )}
                      {batch.status === 'processing' && (
                        <button 
                          onClick={() => {
                            setFinalizingBatch(batch);
                            setFinalWeight(batch.weightKg.toString());
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Finalizar e Prensagem"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      {(batch.status === 'finished') && (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => onUpdateStatus(batch.id, 'sold')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Vender <ArrowRight className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(batch.id, 'extruded')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition"
                          >
                            Extrusão
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredBatches.length === 0 && (
        <div className="p-12 text-center text-slate-400 italic">
          Nenhum lote encontrado.
        </div>
      )}

      {/* Modal de Finalização de Peso */}
      {finalizingBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6" />
                <h3 className="text-xl font-bold">Finalizar Lote {finalizingBatch.id}</h3>
              </div>
              <button onClick={() => setFinalizingBatch(null)} className="p-1 hover:bg-white/20 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleFinalize} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Peso Original</p>
                  <p className="text-2xl font-bold text-slate-800">{finalizingBatch.weightKg.toLocaleString()} kg</p>
                </div>
                <div className={`p-4 rounded-2xl border ${loss > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <p className="text-xs font-bold uppercase mb-1">Perda Calculada</p>
                  <p className="text-2xl font-bold">{loss > 0 ? `${loss.toLocaleString()} kg` : '0 kg'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Peso Final do Produto Acabado (Kg)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  autoFocus
                  value={finalWeight}
                  onChange={e => setFinalWeight(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl text-2xl font-bold text-emerald-700 focus:border-emerald-500 outline-none transition"
                  placeholder="Insira o peso final..."
                />
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> A diferença será registrada automaticamente como perda de processo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setFinalizingBatch(null)}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition"
                >
                  Confirmar e Finalizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
