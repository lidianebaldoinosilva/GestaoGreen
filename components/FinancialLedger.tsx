
import React, { useState, useMemo } from 'react';
import { FinancialEntry, Partner } from '../types.ts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Calendar, X } from 'lucide-react';

interface Props {
  entries: FinancialEntry[];
  partners: Partner[];
  onStatusChange: (id: string, status: FinancialEntry['status'], paymentDate?: string) => void;
}

const FinancialLedger: React.FC<Props> = ({ entries, partners, onStatusChange }) => {
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [paymentModal, setPaymentModal] = useState<{ id: string, type: string } | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType);
  
  const totals = useMemo(() => {
    return {
      payable: entries
        .filter(e => e.type === 'payable' && e.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0),
      receivable: entries
        .filter(e => e.type === 'receivable' && e.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0)
    };
  }, [entries]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentModal) {
      onStatusChange(paymentModal.id, 'paid', paymentDate);
      setPaymentModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-red-100 p-3 rounded-full text-red-600"><ArrowUpCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Total Contas a Pagar (Em Aberto)</p>
              <h3 className="text-2xl font-black text-slate-800">R$ {totals.payable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><ArrowDownCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Total Contas a Receber (Em Aberto)</p>
              <h3 className="text-2xl font-black text-slate-800">R$ {totals.receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-4 overflow-x-auto">
          <button onClick={() => setFilterType('all')} className={`px-5 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${filterType === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Ver Tudo</button>
          <button onClick={() => setFilterType('payable')} className={`px-5 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${filterType === 'payable' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>Contas a Pagar</button>
          <button onClick={() => setFilterType('receivable')} className={`px-5 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${filterType === 'receivable' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>Contas a Receber</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Data Registro</th>
                <th className="px-6 py-4">Beneficiário/Pagador</th>
                <th className="px-6 py-4">Lote Ref.</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status / Pagamento</th>
                <th className="px-6 py-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{partners.find(p => p.id === entry.partnerId)?.name || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{entry.description}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600">{entry.batchId}</td>
                  <td className={`px-6 py-4 font-black ${entry.type === 'payable' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {entry.type === 'payable' ? '-' : '+'} R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 w-fit ${entry.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                        {entry.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {entry.status === 'paid' ? (entry.type === 'payable' ? 'Pago' : 'Recebido') : 'Em Aberto'}
                      </span>
                      {entry.status === 'paid' && entry.paymentDate && (
                        <span className="text-[10px] font-medium text-slate-400">
                          em {new Date(entry.paymentDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {entry.status === 'pending' && (
                      <button 
                        onClick={() => {
                          setPaymentModal({ id: entry.id, type: entry.type });
                          setPaymentDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:underline px-3 py-1 border border-emerald-200 rounded-lg bg-emerald-50"
                      >
                        Liquidar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Liquidar Título</h3>
              <button onClick={() => setPaymentModal(null)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePay} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Data do {paymentModal.type === 'payable' ? 'Pagamento' : 'Recebimento'}
                </label>
                <input 
                  type="date" 
                  required 
                  value={paymentDate} 
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg transition">
                Confirmar Liquidação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialLedger;
