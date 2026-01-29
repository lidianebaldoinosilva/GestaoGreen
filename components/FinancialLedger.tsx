
import React, { useState, useMemo } from 'react';
import { FinancialEntry, Partner } from '../types.ts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Calendar, X, Tag, Plus, Filter, Search, PlusCircle, Edit, Trash2, UserCheck } from 'lucide-react';

interface Props {
  entries: FinancialEntry[];
  partners: Partner[];
  onStatusChange: (id: string, status: FinancialEntry['status'], paymentDate?: string) => void;
  onUpdateEntry: (id: string, updates: Partial<FinancialEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onAddEntry: (entry: Omit<FinancialEntry, 'id' | 'status'>) => void;
}

const FinancialLedger: React.FC<Props> = ({ entries, partners, onStatusChange, onUpdateEntry, onDeleteEntry, onAddEntry }) => {
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable' | 'commission'>('all');
  const [paymentModal, setPaymentModal] = useState<{ id: string, type: string } | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [editModalEntry, setEditModalEntry] = useState<FinancialEntry | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [operationTypes, setOperationTypes] = useState<string[]>([
    'Compra de Matéria Prima',
    'Venda de Produto Acabado',
    'Frete',
    'Comissão de Vendedor',
    'Prestação de Serviço',
    'Outros'
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntryData, setNewEntryData] = useState({
    type: 'payable' as FinancialEntry['type'],
    operationType: 'Compra de Matéria Prima',
    partnerId: '',
    batchId: 'MANUAL',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const [filterColumn, setFilterColumn] = useState<'all' | 'date' | 'dueDate' | 'partner' | 'operation' | 'batch' | 'value' | 'description'>('all');
  const [filterSearch, setFilterSearch] = useState('');

  const filtered = useMemo(() => {
    let result = entries;
    if (filterType === 'payable') result = result.filter(e => e.type === 'payable' && e.operationType !== 'Comissão de Vendedor');
    if (filterType === 'receivable') result = result.filter(e => e.type === 'receivable');
    if (filterType === 'commission') result = result.filter(e => e.operationType === 'Comissão de Vendedor');
    
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      result = result.filter(e => {
        const partnerName = partners.find(p => p.id === e.partnerId)?.name?.toLowerCase() || '';
        const opLabel = e.operationType.toLowerCase();
        
        switch (filterColumn) {
          case 'date': return e.date?.includes(search);
          case 'dueDate': return e.dueDate?.includes(search);
          case 'partner': return partnerName.includes(search);
          case 'operation': return opLabel.includes(search);
          case 'batch': return e.batchId?.toLowerCase().includes(search);
          case 'value': return e.amount.toString().includes(search);
          case 'description': return e.description?.toLowerCase().includes(search);
          default: return (
            e.date?.includes(search) ||
            e.dueDate?.includes(search) ||
            partnerName.includes(search) ||
            opLabel.includes(search) ||
            e.batchId?.toLowerCase().includes(search) ||
            e.amount.toString().includes(search) ||
            e.description?.toLowerCase().includes(search)
          );
        }
      });
    }
    
    return result;
  }, [entries, filterType, filterColumn, filterSearch, partners]);
  
  const totals = useMemo(() => {
    return {
      payable: entries
        .filter(e => e.type === 'payable' && e.status === 'pending' && e.operationType !== 'Comissão de Vendedor')
        .reduce((acc, curr) => acc + curr.amount, 0),
      receivable: entries
        .filter(e => e.type === 'receivable' && e.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0),
      commissions: entries
        .filter(e => e.operationType === 'Comissão de Vendedor' && e.status === 'pending')
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModalEntry) {
      onUpdateEntry(editModalEntry.id, {
        dueDate: new Date(editDueDate).toISOString(),
        description: editDescription
      });
      setEditModalEntry(null);
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
      date: new Date(newEntryData.date).toISOString(),
      dueDate: new Date(newEntryData.dueDate).toISOString()
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
      dueDate: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const openEditModal = (entry: FinancialEntry) => {
    setEditModalEntry(entry);
    setEditDueDate(entry.dueDate ? new Date(entry.dueDate).toISOString().split('T')[0] : '');
    setEditDescription(entry.description);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '---';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-slate-100 p-3 rounded-full text-slate-500"><ArrowUpCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contas a Pagar</p>
              <h3 className="text-2xl font-black text-slate-800">R$ {totals.payable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-brand-50 p-3 rounded-full text-brand-600"><ArrowDownCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contas a Receber</p>
              <h3 className="text-2xl font-black text-brand-800">R$ {totals.receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600"><UserCheck className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comissões a Pagar</p>
              <h3 className="text-2xl font-black text-indigo-800">R$ {totals.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-brand-700 transition shadow-lg shadow-brand-100"
        >
          <Plus className="w-5 h-5" /> Novo Registro
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
              <option value="partner">Parceiro</option>
              <option value="operation">Operação</option>
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
          <button onClick={() => setFilterType('all')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${filterType === 'all' ? 'bg-brand-950 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>Tudo</button>
          <button onClick={() => setFilterType('payable')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${filterType === 'payable' ? 'bg-slate-600 text-white' : 'bg-slate-50 text-slate-500'}`}>Pagar</button>
          <button onClick={() => setFilterType('receivable')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${filterType === 'receivable' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>Receber</button>
          <button onClick={() => setFilterType('commission')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${filterType === 'commission' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-400'}`}>Comissões</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Parceiro</th>
                <th className="px-6 py-4">Operação</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-6 py-4 text-[10px] text-slate-500">{formatDate(entry.date)}</td>
                  <td className={`px-6 py-4 text-xs font-bold ${entry.type === 'receivable' ? 'text-emerald-700' : 'text-slate-700'}`}>{formatDate(entry.dueDate)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">
                        {partners.find(p => p.id === entry.partnerId)?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.operationType === 'Comissão de Vendedor' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {entry.operationType}
                      </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${entry.type === 'payable' ? 'text-red-600' : 'text-emerald-600'}`}>
                    R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1 ${entry.status === 'paid' ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {entry.status === 'paid' ? (entry.type === 'payable' ? 'Pago' : 'Recebido') : 'Pendente'}
                      </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(entry)} className="p-2 text-slate-300 hover:text-brand-600 transition"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDeleteEntry(entry.id)} className="p-2 text-slate-200 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                      {entry.status === 'pending' && (
                        <button 
                          onClick={() => { setPaymentModal({ id: entry.id, type: entry.type }); setPaymentDate(new Date().toISOString().split('T')[0]); }}
                          className="text-[10px] font-black text-brand-600 hover:bg-brand-50 px-3 py-1 border border-brand-100 rounded-lg transition"
                        >
                          LIQUIDAR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-brand-950 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Liquidar Registro</h3>
              <button onClick={() => setPaymentModal(null)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePay} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data da Operação</label>
                <input 
                  type="date" 
                  required 
                  value={paymentDate} 
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500"
                />
              </div>
              <p className="text-sm text-slate-500">
                Confirmar que este valor foi liquidado integralmente?
              </p>
              <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 transition">
                Confirmar Liquidação
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-brand-950 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Novo Registro Financeiro</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <select 
                    value={newEntryData.type}
                    onChange={e => setNewEntryData({ ...newEntryData, type: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="payable">Conta a Pagar</option>
                    <option value="receivable">Conta a Receber</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                  {!isAddingNewType ? (
                    <div className="flex gap-2">
                      <select 
                        value={newEntryData.operationType}
                        onChange={e => setNewEntryData({ ...newEntryData, operationType: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {operationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsAddingNewType(true)} className="p-3 bg-slate-100 rounded-xl text-slate-500"><PlusCircle className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTypeName} 
                        onChange={e => setNewTypeName(e.target.value)}
                        placeholder="Novo tipo..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <button type="button" onClick={() => setIsAddingNewType(false)} className="p-3 bg-slate-100 rounded-xl text-red-500"><X className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Parceiro</label>
                <select 
                  required
                  value={newEntryData.partnerId}
                  onChange={e => setNewEntryData({ ...newEntryData, partnerId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Selecione...</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={newEntryData.amount}
                    onChange={e => setNewEntryData({ ...newEntryData, amount: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vencimento</label>
                  <input 
                    required 
                    type="date" 
                    value={newEntryData.dueDate}
                    onChange={e => setNewEntryData({ ...newEntryData, dueDate: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <textarea 
                  value={newEntryData.description}
                  onChange={e => setNewEntryData({ ...newEntryData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-20"
                />
              </div>

              <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 transition">
                Criar Registro
              </button>
            </form>
          </div>
        </div>
      )}

      {editModalEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-brand-950 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Editar Registro</h3>
              <button onClick={() => setEditModalEntry(null)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Novo Vencimento</label>
                <input 
                  type="date" 
                  required 
                  value={editDueDate} 
                  onChange={e => setEditDueDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nova Descrição</label>
                <textarea 
                  required 
                  value={editDescription} 
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 h-24"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 transition">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialLedger;
