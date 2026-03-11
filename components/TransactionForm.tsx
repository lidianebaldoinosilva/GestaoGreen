
import React, { useState } from 'react';
import { Partner, Material, Batch, BatchStatus, ShippingInfo } from '../types.ts';
import { ShoppingCart, RefreshCw, Save, DollarSign, Calendar, Truck, Trash2, Plus, X } from 'lucide-react';

interface PurchaseItem {
  id: string;
  materialCode: string;
  weight: number;
  pricePerKg?: number;
}

interface Props {
  partners: Partner[];
  materials: Material[];
  batches: Batch[];
  onPurchase: (partnerId: string, items: { materialCode: string, weight: number, pricePerKg?: number }[], date?: string, shipping?: ShippingInfo, dueDate?: string) => void;
  onUpdateStatus: (id: string, status: BatchStatus, weight?: number) => void;
}

const TransactionForm: React.FC<Props> = ({ partners, materials, batches, onPurchase, onUpdateStatus }) => {
  const [pPartner, setPPartner] = useState('');
  const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);
  const [pDueDate, setPDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [newItem, setNewItem] = useState({ materialCode: '010', weight: '', pricePerKg: '' });

  // Shipping Info States
  const [sPlate, setSPlate] = useState('');
  const [sDriver, setSDriver] = useState('');
  const [sCarrier, setSCarrier] = useState('');
  const [sDoc, setSDoc] = useState('');
  const [sCost, setSCost] = useState('');
  const [sOrigin, setSOrigin] = useState('');
  const [sDest, setSDest] = useState('');
  const [sIsFobOrOwn, setSIsFobOrOwn] = useState(false);

  const addPurchaseItem = () => {
    if (newItem.materialCode && newItem.weight) {
      const item: PurchaseItem = {
        id: Math.random().toString(36).substr(2, 9),
        materialCode: newItem.materialCode,
        weight: parseFloat(newItem.weight),
        pricePerKg: newItem.pricePerKg ? parseFloat(newItem.pricePerKg) : undefined
      };
      setPurchaseItems([...purchaseItems, item]);
      setNewItem({ materialCode: '010', weight: '', pricePerKg: '' });
    }
  };

  const removePurchaseItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter(i => i.id !== id));
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pPartner && purchaseItems.length > 0) {
      const shipping: ShippingInfo = {
        plate: sPlate,
        driverName: sDriver,
        carrier: sCarrier,
        document: sDoc,
        cost: parseFloat(sCost) || 0,
        origin: sOrigin,
        destination: sDest,
        isFobOrOwn: sIsFobOrOwn
      };

      onPurchase(
        pPartner, 
        purchaseItems.map(i => ({ materialCode: i.materialCode, weight: i.weight, pricePerKg: i.pricePerKg })), 
        pDate, 
        shipping, 
        pDueDate
      );
      
      // Reset
      setPurchaseItems([]);
      setPDate(new Date().toISOString().split('T')[0]);
      setPDueDate(new Date().toISOString().split('T')[0]);
      setSPlate('');
      setSDriver('');
      setSCarrier('');
      setSDoc('');
      setSCost('');
      setSOrigin('');
      setSDest('');
      setSIsFobOrOwn(false);
      
      alert("Entrada de material registrada!");
    } else {
      alert("Selecione um fornecedor e adicione pelo menos um material.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-4 mb-8">
        <div className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold transition">
          <ShoppingCart className="w-5 h-5" /> Registrar Compra (Entrada)
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <form onSubmit={handlePurchaseSubmit} className="space-y-8">
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-500" /> Dados da Mercadoria
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Data da Compra</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    required 
                    type="date" 
                    value={pDate} 
                    onChange={e => {
                        setPDate(e.target.value);
                        setPDueDate(e.target.value); // Default due date to purchase date
                    }} 
                    className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase text-emerald-600">Pagamento (Vencimento)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 w-4 h-4" />
                  <input 
                    required 
                    type="date" 
                    value={pDueDate} 
                    onChange={e => setPDueDate(e.target.value)} 
                    className="w-full p-3 pl-10 border border-emerald-200 rounded-xl bg-emerald-50 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase">Fornecedor</label>
                <select required value={pPartner} onChange={e => setPPartner(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <option value="">Selecione...</option>
                  {partners.filter(p => p.type !== 'customer').map(p => (<option key={p.id} value={p.id}>{p.name} ({p.code})</option>))}
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h5 className="text-xs font-black uppercase text-slate-500 tracking-widest">Adicionar Materiais</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Material</label>
                  <select 
                    value={newItem.materialCode} 
                    onChange={e => setNewItem({...newItem, materialCode: e.target.value})} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    {materials.map(m => (<option key={m.id} value={m.code}>{m.name} ({m.code})</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Peso (Kg)</label>
                  <input 
                    type="number" 
                    value={newItem.weight} 
                    onChange={e => setNewItem({...newItem, weight: e.target.value})} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white" 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Preço/Kg (Opcional)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newItem.pricePerKg} 
                    onChange={e => setNewItem({...newItem, pricePerKg: e.target.value})} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white" 
                    placeholder="0.00" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={addPurchaseItem}
                  className="bg-brand-600 text-white p-2.5 rounded-lg font-bold hover:bg-brand-700 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Adicionar Material
                </button>
              </div>

              {purchaseItems.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-400">
                        <th className="text-left py-2">Material</th>
                        <th className="text-right py-2">Peso</th>
                        <th className="text-right py-2">Preço/Kg</th>
                        <th className="text-right py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseItems.map(item => {
                        const material = materials.find(m => m.code === item.materialCode);
                        return (
                          <tr key={item.id}>
                            <td className="py-2 font-medium">{material?.name} ({item.materialCode})</td>
                            <td className="py-2 text-right font-bold">{item.weight} Kg</td>
                            <td className="py-2 text-right">{item.pricePerKg ? `R$ ${item.pricePerKg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}</td>
                            <td className="py-2 text-right">
                              <button type="button" onClick={() => removePurchaseItem(item.id)} className="text-red-400 hover:text-red-600 transition p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" /> Dados do Frete
              </h4>
              <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={sIsFobOrOwn} onChange={e => setSIsFobOrOwn(e.target.checked)} className="w-4 h-4 text-emerald-600" />
                      Frete Próprio / FOB (Isento)
                  </label>
              </div>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 transition-opacity ${sIsFobOrOwn ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Placa Caminhão</label>
                <input type="text" value={sPlate} onChange={e => setSPlate(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 uppercase" placeholder="ABC-1234" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Motorista</label>
                <input type="text" value={sDriver} onChange={e => setSDriver(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Transportadora</label>
                <input type="text" value={sCarrier} onChange={e => setSCarrier(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="Nome da empresa" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">CPF/CNPJ Transport.</label>
                <input type="text" value={sDoc} onChange={e => setSDoc(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Frete (R$)</label>
                <input type="number" value={sCost} onChange={e => setSCost(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Local Partida</label>
                <input type="text" value={sOrigin} onChange={e => setSOrigin(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="Cidade - UF" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Local Chegada</label>
                <input type="text" value={sDest} onChange={e => setSDest(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="Cidade - UF" />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition hover:bg-emerald-700">
            <Save className="w-5 h-5" /> Registrar Entrada e Gerar Operações Financeiras
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
