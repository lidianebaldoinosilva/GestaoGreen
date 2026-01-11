
import React from 'react';
import { Batch, Partner, Material, BatchStatus } from '../types.ts';
import { MoreHorizontal, Search, CheckCircle2, Factory, Trash2, ArrowRight } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
  onUpdateStatus: (id: string, status: BatchStatus) => void;
}

const InventoryTable: React.FC<Props> = ({ batches, partners, materials, onUpdateStatus }) => {
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
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
            {batches.map((batch) => {
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
                          onClick={() => onUpdateStatus(batch.id, 'finished')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Finalizar (Prensado)"
                        >
                          <CheckCircle2 className="w-4 h-4" />
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
      
      {batches.length === 0 && (
        <div className="p-12 text-center text-slate-400 italic">
          Nenhum lote encontrado no estoque.
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
