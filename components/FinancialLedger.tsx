
import React, { useState, useMemo } from 'react';
import { FinancialEntry, Partner } from '../types.ts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Calendar, X, Tag, Plus, Filter, Search, PlusCircle } from 'lucide-react';

interface Props {
  entries: FinancialEntry[];
  partners: Partner[];
  onStatusChange: (id: string, status: FinancialEntry['status'], paymentDate?: string) => void;
  onAddEntry: (entry: Omit<FinancialEntry, 'id' | 'status'>) => void;
}

const FinancialLedger: React.FC<Props> = ({ entries, partners, onStatusChange, onAddEntry }) => {
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [paymentModal, setPaymentModal] = useState<{ id: string, type: string } | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom Operation Types State
  const [operationTypes, setOperationTypes] = useState<string[]>([
    'Compra de Matéria Prima',
    'Venda de Produto Acabado',
    'Frete',
    'Prestação de Serviço',
    'Outros'
  ]);

  // New Manual Entry State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntryData, setNewEntryData] = useState({
    type: 'payable' as FinancialEntry['type'],
    operationType: 'Compra de Matéria Prima',
    partnerId: '',
    batchId: 'MANUAL',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // Column Filtering State
  const [filterColumn, setFilterColumn] = useState<'all' | 'date' | 'partner' | 'operation' | 'batch' | 'value' | 'description'>('all');
  const [filterSearch, setFilterSearch] = useState('');

  const filtered = useMemo(() => {
    let result = entries.filter(e => filterType === 'all' || e.type === filterType);
    
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      result = result.filter(e => {
        const partnerName = partners.find(p => p.id === e.partnerId)?.name?.toLowerCase() || '';
        const opLabel = e.operationType.toLowerCase();
        
        switch (filterColumn) {
          case 'date': return e.date.includes(search);
          case 'partner': return partnerName.includes(search);
          case 'operation': return opLabel.includes(search);
          case 'batch': return e.batchId.toLowerCase().includes(search);
          case 'value': return e.amount.toString().includes(search);
          case 'description': return e.description.toLowerCase().includes(search);
          default: return (
            e.date.includes(search) ||
            partnerName.includes(search) ||
            opLabel.includes(search) ||
            e.batchId.toLowerCase().includes(search) ||
            e.amount.toString().includes(search) ||
            e.description.toLowerCase().includes(search)
          );
        }
      });
    }
    
    return result;
  }, [entries, filterType, filterColumn, filterSearch, partners]);
  
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalOpType = newEntryData.operationType;
    if (isAddingNewType && newTypeName.trim()) {
      finalOpType = newTypeName.trim();
      if (!operationTypes.includes(finalOpType)) {
        setOperationTypes(prev => [...prev, finalOpType]);
      }
    }

    onAddEntry({
      ...newEntryData,
      operationType: finalOpType,
      amount: parseFloat(newEntryData.amount) || 0,
      date: new Date(newEntryData.date).toISOString()
    });

    setIsAddModalOpen(false);
    setIsAddingNewType(false);
    setNewTypeName('');
    setNewEntryData({
      type: 'payable',
      operationType: 'Compra de Matéria Prima',
      partnerId: '',
      batchId: 'MANUAL',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const getOperationTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('compra')) return 'bg-amber-50 text-amber-600 border-amber-200';
    if (t.includes('venda')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (t.includes('frete')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (t.includes('servico') || t.includes('serviço')) return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
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

      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" /> Novo Registro Financeiro
        </button>

        <div className="flex-1 flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 border-r border-slate-100 pr-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterColumn} 
              onChange={e => setFilterColumn(e.target.value as any)}
              className="text-xs font-bold text-slate-600 bg-transparent outline-none"
            >
              <option value="all">Filtrar por...</option>
              <option value="date">Data Registro</option>
              <option value="partner">Beneficiário/Pagador</option>
              <option value="description">Descrição</option>
              <option value="operation">Tipo Operação</option>
              <option value="batch">Lote Ref.</option>
              <option value="value">Valor</option>
            </select>
          </div>
          <div className="flex-1 flex items-center gap-2 px-2">
            <Search className="w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="w-full text-sm bg-transparent outline-none text-slate-600"
            />
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
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Tipo de Operação</th>
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
                    <div className="text-sm font-bold text-slate-800">
                        {entry.operationType.toLowerCase() === 'frete' 
                            ? entry.description.split('-')[1]?.trim() || partners.find(p => p.id === entry.partnerId)?.name 
                            : (partners.find(p => p.id === entry.partnerId)?.name || 'N/A')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] text-slate-500 italic max-w-[200px] line-clamp-2">{entry.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border uppercase ${getOperationTypeBadge(entry.operationType)}`}>
                        {entry.operationType}
                    </span>
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

      {/* Manual Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Novo Registro Financeiro</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Natureza</label>
                  <select 
                    value={newEntryData.type} 
                    onChange={e => setNewEntryData({...newEntryData, type: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  >
                    <option value="payable">Contas a Pagar (Saída)</option>
                    <option value="receivable">Contas a Receber (Entrada)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Operação</label>
                  {!isAddingNewType ? (
                    <div className="flex gap-1">
                        <select 
                            value={newEntryData.operationType} 
                            onChange={e => {
                                if (e.target.value === 'NEW') {
                                    setIsAddingNewType(true);
                                } else {
                                    setNewEntryData({...newEntryData, operationType: e.target.value});
                                }
                            }}
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                        >
                            {operationTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                            <option value="NEW" className="font-bold text-emerald-600">+ Adicionar Novo Tipo...</option>
                        </select>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                        <input 
                            autoFocus
                            type="text"
                            placeholder="Nome do tipo..."
                            value={newTypeName}
                            onChange={e => setNewTypeName(e.target.value)}
                            className="flex-1 p-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none text-sm font-bold"
                        />
                        <button 
                            type="button" 
                            onClick={() => { setIsAddingNewType(false); setNewTypeName(''); }}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Parceiro (Fornecedor/Cliente/Prestador)</label>
                <select 
                  required
                  value={newEntryData.partnerId} 
                  onChange={e => setNewEntryData({...newEntryData, partnerId: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                >
                  <option value="">Selecione um parceiro...</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Data Vencimento/Registro</label>
                  <input 
                    type="date" 
                    required 
                    value={newEntryData.date} 
                    onChange={e => setNewEntryData({...newEntryData, date: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    value={newEntryData.amount} 
                    onChange={e => setNewEntryData({...newEntryData, amount: e.target.value})}
                    placeholder="0,00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição</label>
                <textarea 
                  required
                  rows={3}
                  value={newEntryData.description} 
                  onChange={e => setNewEntryData({...newEntryData, description: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  placeholder="Descreva detalhes do registro financeiro..."
                />
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg transition">
                Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Liquidation Modal */}
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
