
import React, { useState, useMemo } from 'react';
import { Transaction, Partner, Material, Batch } from '../types.ts';
import { Search, Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, Trash2, Scissors } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  partners: Partner[];
  materials: Material[];
  batches: Batch[];
}

const HistoryReport: React.FC<Props> = ({ transactions, partners, materials, batches }) => {
  const [filter, setFilter] = useState('');

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const filteredTransactions = sortedTransactions.filter(tx => {
    const batch = batches.find(b => b.id === tx.batchId);
    const partner = partners.find(p => p.id === batch?.partnerId);
    const material = materials.find(m => m.code === batch?.materialCode);
    const searchStr = `${tx.batchId} ${tx.description} ${partner?.name} ${material?.name}`.toLowerCase();
    return searchStr.includes(filter.toLowerCase());
  });

  const getTxIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase': return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
      case 'sale': return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case 'production': return <RefreshCw className="w-4 h-4 text-indigo-500" />;
      // Fix: updated 'extrusion' to 'extruding' to match Transaction['type']
      case 'extruding': return <ArrowUpRight className="w-4 h-4 text-purple-500" />;
      // Added missing 'extruded' type
      case 'extruded': return <RefreshCw className="w-4 h-4 text-cyan-500" />;
      case 'loss': return <Scissors className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  const getTxLabel = (type: Transaction['type']) => {
    const labels: Record<Transaction['type'], string> = {
      purchase: 'Entrada / Compra',
      sale: 'Saída / Venda',
      production: 'Processamento',
      // Fix: updated 'extrusion' to 'extruding' and added 'extruded' to satisfy Record<Transaction['type'], string>
      extruding: 'Envio Extrusão',
      extruded: 'Retorno Extrusão',
      loss: 'Perda de Processo'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Pesquisar histórico..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Lote</th>
                <th className="px-6 py-4">Operação</th>
                <th className="px-6 py-4">Material / Parceiro</th>
                <th className="px-6 py-4 text-right">Peso (Kg)</th>
                <th className="px-6 py-4">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const batch = batches.find(b => b.id === tx.batchId);
                const partner = partners.find(p => p.id === batch?.partnerId);
                const material = materials.find(m => m.code === batch?.materialCode);
                
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-emerald-700">{tx.batchId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTxIcon(tx.type)}
                        <span className="text-xs font-bold text-slate-700">{getTxLabel(tx.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{material?.name || 'Material'}</span>
                        <span className="text-[10px] text-slate-500">{partner?.name || 'Parceiro'}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-black ${
                      tx.type === 'loss' ? 'text-amber-600' : 
                      tx.type === 'purchase' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'loss' ? `-${tx.weight.toLocaleString()}` : tx.weight.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                      {tx.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">
            Nenhuma movimentação registrada até o momento.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryReport;
