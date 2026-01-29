
import React, { useState, useMemo } from 'react';
import { Order, Partner, OrderItem } from '../types.ts';
import { Plus, Search, Filter, Calendar, DollarSign, X, Save, Trash2, Edit2, FileText, Printer, CheckCircle, Clock, ClipboardList, Sprout, UserCheck, Truck } from 'lucide-react';

interface Props {
  orders: Order[];
  partners: Partner[];
  onAdd: (o: Order) => void;
  onUpdate: (id: string, o: Partial<Order>) => void;
  onDelete: (id: string) => void;
}

const OrderManager: React.FC<Props> = ({ orders, partners, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const initialFormState: Omit<Order, 'id'> = {
    orderNumber: `PED-${new Date().getTime().toString().substr(-6)}`,
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    sellerId: '',
    commissionAmount: 0,
    isFob: false,
    cnpj: '',
    ie: '',
    address: '',
    phone: '',
    items: [],
    totalAmount: 0,
    pixKey: 'CNPJ 34.111.064/0001-81',
    status: 'pending',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [newItem, setNewItem] = useState({ description: '', quantity: '', unitPrice: '' });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const customer = partners.find(p => p.id === o.customerId);
      const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, partners, searchTerm, statusFilter]);

  const handleCustomerChange = (id: string) => {
    const customer = partners.find(p => p.id === id);
    if (customer) {
      setFormData({
        ...formData,
        customerId: id,
        cnpj: customer.document || '',
        address: customer.address || '',
        phone: customer.phone || ''
      });
    }
  };

  const addItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) return;
    
    const qty = parseFloat(newItem.quantity);
    const up = parseFloat(newItem.unitPrice);
    const item: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: newItem.description,
      quantity: qty,
      unitPrice: up,
      total: qty * up
    };

    const updatedItems = [...formData.items, item];
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: updatedItems.reduce((acc, curr) => acc + curr.total, 0)
    });
    setNewItem({ description: '', quantity: '', unitPrice: '' });
  };

  const removeItem = (id: string) => {
    const updatedItems = formData.items.filter(item => item.id !== id);
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: updatedItems.reduce((acc, curr) => acc + curr.total, 0)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.items.length === 0) {
      alert("Selecione um cliente e adicione pelo menos um item.");
      return;
    }

    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd({ ...formData, id: Math.random().toString(36).substr(2, 9) } as Order);
    }
    
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleEdit = (order: Order) => {
    setFormData(order);
    setEditingId(order.id);
    setIsFormOpen(true);
  };

  const handlePrint = (order: Order) => {
    window.print();
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-brand-50 p-3 rounded-xl text-brand-600">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Gestão de Pedidos</h3>
            <p className="text-sm text-slate-500">{orders.length} pedidos registrados</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-100 flex items-center gap-2 hover:bg-brand-700 transition"
        >
          <Plus className="w-5 h-5" /> Novo Pedido
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Pesquisar por número ou cliente..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmados</option>
            <option value="delivered">Entregues</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => {
          const customer = partners.find(p => p.id === order.customerId);
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-brand-600 tracking-widest">{order.orderNumber}</span>
                  <p className="text-xs text-slate-400">{new Date(order.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(order.status)}`}>
                        {order.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${order.isFob ? 'bg-indigo-50 text-indigo-700' : 'bg-brand-50 text-brand-700'}`}>
                        {order.isFob ? 'FOB' : 'CIF'}
                    </span>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-slate-800 truncate">{customer?.name || 'Cliente N/A'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  Vendedor: {partners.find(p => p.id === order.sellerId)?.name || 'N/D'}
                </p>
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-xl font-black text-brand-700">R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewOrder(order)}
                      className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                      title="Ver Pedido"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(order)}
                      className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { if(confirm('Excluir este pedido?')) onDelete(order.id); }}
                      className="p-2 bg-slate-50 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {viewOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-10 animate-in zoom-in duration-200 print:shadow-none print:p-0">
            <div className="flex justify-between items-center mb-10 print:hidden">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Visualização do Pedido</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => handlePrint(viewOrder)}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-700"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button onClick={() => setViewOrder(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="border-2 border-slate-800 p-8 min-h-[800px] flex flex-col relative overflow-hidden print:border-none">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                <div>
                  <h1 className="text-4xl font-black text-brand-950 flex items-center gap-2">
                    <Sprout className="w-8 h-8 text-brand-600" /> GreenPlastik
                  </h1>
                  <p className="text-xs text-brand-700 font-bold uppercase mt-1 tracking-widest">Cuidado pelo futuro</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 leading-tight">
                  <p>(11) 9.7631-3560 / (11) 9.4330-4114</p>
                  <p>adm@bs.ind.br</p>
                  <p>Caminho da Capela, 15 - Pq. Santa Tereza</p>
                  <p>Santa Isabel - SP - CEP: 07.500-000</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 bg-brand-50 p-4 border border-brand-200 rounded">
                 <div className="flex gap-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Número do Pedido</p>
                      <p className="font-black text-slate-800">{viewOrder.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Localidade / Data</p>
                      <p className="font-bold text-slate-800">Santa Isabel, {new Date(viewOrder.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="bg-white border border-slate-200 px-3 py-1 rounded text-center">
                      <p className="text-[8px] font-black uppercase text-slate-400">Frete</p>
                      <p className="text-xs font-black text-brand-700">{viewOrder.isFob ? 'FOB' : 'CIF'}</p>
                    </div>
                 </div>
                 <div className="bg-brand-950 text-white px-6 py-2 rounded font-black uppercase tracking-widest">
                   Pedido
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-10 mb-8 text-sm">
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cliente:</span>
                  <p className="font-bold text-slate-800">{partners.find(p => p.id === viewOrder.customerId)?.name || 'N/A'}</p>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CNPJ:</span>
                  <p className="font-bold text-slate-800">{viewOrder.cnpj || '---'}</p>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Endereço:</span>
                  <p className="font-bold text-slate-800">{viewOrder.address || '---'}</p>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vendedor:</span>
                  <p className="font-bold text-slate-800">{partners.find(p => p.id === viewOrder.sellerId)?.name || 'N/D'}</p>
                </div>
              </div>

              <table className="w-full border-collapse mb-auto">
                <thead>
                  <tr className="bg-brand-50">
                    <th className="border-2 border-slate-800 p-2 text-xs font-black uppercase w-20">Quantidade</th>
                    <th className="border-2 border-slate-800 p-2 text-xs font-black uppercase">Produto</th>
                    <th className="border-2 border-slate-800 p-2 text-xs font-black uppercase w-32">Unitário</th>
                    <th className="border-2 border-slate-800 p-2 text-xs font-black uppercase w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border-2 border-slate-800 p-3 text-center font-bold">{item.quantity}</td>
                      <td className="border-2 border-slate-800 p-3 font-medium uppercase">{item.description}</td>
                      <td className="border-2 border-slate-800 p-3 text-right">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="border-2 border-slate-800 p-3 text-right font-black">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - viewOrder.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border-2 border-slate-800 p-3 h-10"></td>
                      <td className="border-2 border-slate-800 p-3 h-10"></td>
                      <td className="border-2 border-slate-800 p-3 h-10"></td>
                      <td className="border-2 border-slate-800 p-3 h-10"></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="border-2 border-slate-800 p-4 text-right font-black uppercase tracking-widest text-lg">Total do Pedido</td>
                    <td className="border-2 border-slate-800 p-4 text-right font-black text-xl text-brand-700">R$ {viewOrder.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-10 flex justify-between items-end border-t-2 border-slate-800 pt-6">
                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase text-brand-600">Formas de Pagamento:</p>
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <DollarSign className="w-4 h-4" /> PIX: {viewOrder.pixKey}
                     </p>
                   </div>
                   <p className="text-[10px] italic text-slate-400 mt-4">Favor conferir a mercadoria.</p>
                </div>
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                   <p className="text-[10px] uppercase font-bold text-slate-500">Assinatura / Carimbo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-brand-950 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Pedido' : 'Novo Pedido de Venda'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Número Pedido</label>
                  <input 
                    type="text" 
                    value={formData.orderNumber} 
                    onChange={e => setFormData({...formData, orderNumber: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Data</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cliente</label>
                  <select 
                    required 
                    value={formData.customerId} 
                    onChange={e => handleCustomerChange(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="">Selecione o Cliente...</option>
                    {partners.filter(p => p.type === 'customer' || p.type === 'both').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-600 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Vendedor
                  </label>
                  <select 
                    value={formData.sellerId} 
                    onChange={e => setFormData({...formData, sellerId: e.target.value})}
                    className="w-full p-3 border border-brand-200 rounded-xl bg-white font-bold text-sm"
                  >
                    <option value="">Nenhum Vendedor</option>
                    {partners.filter(p => p.type === 'seller' || p.type === 'both').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-600 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Valor Comissão
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formData.commissionAmount || ''} 
                    onChange={e => setFormData({...formData, commissionAmount: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-brand-200 rounded-xl bg-white font-bold text-sm"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                   <div className="flex items-center gap-4 bg-white p-3 border border-brand-200 rounded-xl">
                      <label className="text-xs font-black uppercase text-brand-600 flex items-center gap-2 cursor-pointer flex-1">
                         <Truck className="w-4 h-4" /> Tipo de Frete
                      </label>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-bold ${!formData.isFob ? 'text-brand-700' : 'text-slate-400'}`}>CIF</span>
                         <div 
                           onClick={() => setFormData({...formData, isFob: !formData.isFob})}
                           className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative ${formData.isFob ? 'bg-indigo-600' : 'bg-brand-600'}`}
                         >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isFob ? 'translate-x-6' : 'translate-x-0'}`} />
                         </div>
                         <span className={`text-[10px] font-bold ${formData.isFob ? 'text-indigo-700' : 'text-slate-400'}`}>FOB</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">CNPJ / IE</label>
                  <input 
                    type="text" 
                    value={formData.cnpj} 
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Telefone</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Endereço de Entrega</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest">Itens do Pedido</h4>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição do Produto</label>
                    <input 
                      type="text" 
                      placeholder="Ex: PP RAFIA PRENSADO"
                      value={newItem.description}
                      onChange={e => setNewItem({...newItem, description: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="w-full md:w-32 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd (Kg)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newItem.quantity}
                      onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="w-full md:w-40 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">V. Unitário</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newItem.unitPrice}
                      onChange={e => setNewItem({...newItem, unitPrice: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addItem}
                    className="self-end bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                        <th className="px-4 py-2 text-left">Qtd</th>
                        <th className="px-4 py-2 text-left">Produto</th>
                        <th className="px-4 py-2 text-right">Unitário</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map(item => (
                        <tr key={item.id} className="text-sm">
                          <td className="px-4 py-3 font-bold">{item.quantity}</td>
                          <td className="px-4 py-3 uppercase">{item.description}</td>
                          <td className="px-4 py-3 text-right">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-right font-black">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100">
                        <td colSpan={3} className="px-4 py-4 text-right font-black uppercase text-slate-500">Total Geral</td>
                        <td className="px-4 py-4 text-right font-black text-brand-700 text-lg">R$ {formData.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Status do Pedido</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 transition">
                  {editingId ? 'Salvar Alterações' : 'Criar Pedido de Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
