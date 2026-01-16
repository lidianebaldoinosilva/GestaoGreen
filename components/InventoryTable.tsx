
import React, { useState } from 'react';
import { Batch, Partner, Material, BatchStatus, ShippingInfo } from '../types.ts';
import { Search, CheckCircle2, Factory, ArrowRight, X, Scale, AlertTriangle, Truck, ShoppingCart, RefreshCw, Filter, Calendar, Trash2, Edit2, Info } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
  onUpdateStatus: (id: string, status: BatchStatus, config?: { weight?: number, partnerId?: string, pricePerKg?: number, materialCode?: string, date?: string, shipping?: ShippingInfo, dueDate?: string }) => void;
  onDeleteBatch: (id: string) => void;
  onEditBatch: (id: string, updates: { weightKg: number, partnerId: string, materialCode: string }) => void;
}

const InventoryTable: React.FC<Props> = ({ batches, partners, materials, onUpdateStatus, onDeleteBatch, onEditBatch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartnerId, setFilterPartnerId] = useState('all');
  const [filterMaterialCode, setFilterMaterialCode] = useState('all');
  
  const [modalType, setModalType] = useState<'finalize' | 'extrude_send' | 'extrude_return' | 'sell' | 'edit' | null>(null);
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  
  const [formWeight, setFormWeight] = useState('');
  const [formPartnerId, setFormPartnerId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMaterialCode, setFormMaterialCode] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [sPlate, setSPlate] = useState('');
  const [sDriver, setSDriver] = useState('');
  const [sCarrier, setSCarrier] = useState('');
  const [sDoc, setSDoc] = useState('');
  const [sCost, setSCost] = useState('');
  const [sOrigin, setSOrigin] = useState('');
  const [sDest, setSDest] = useState('');
  const [sIsFobOrOwn, setSIsFobOrOwn] = useState(false);

  const filteredBatches = batches.filter(b => {
    const partner = partners.find(p => p.id === b.partnerId);
    const material = materials.find(m => m.code === b.materialCode);
    
    const matchesSearch = `${b.id} ${partner?.name} ${material?.name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartner = filterPartnerId === 'all' || b.partnerId === filterPartnerId;
    const matchesMaterial = filterMaterialCode === 'all' || b.materialCode === filterMaterialCode;
    
    return matchesSearch && matchesPartner && matchesMaterial;
  });

  const getStatusLabel = (status: BatchStatus) => {
    const labels: Record<BatchStatus, string> = {
      raw: 'Sujo / Entrada',
      processing: 'Em Processo',
      finished: 'Pronto (Fardo)',
      sold: 'Vendido',
      extruding: 'Extrusão (Saída)',
      extruded: 'Extrudado (Retorno)'
    };
    return labels[status];
  };

  const getStatusStyle = (status: BatchStatus) => {
    switch (status) {
      case 'raw': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'processing': return 'bg-brand-50 text-brand-700 border-brand-100';
      case 'finished': return 'bg-brand-600 text-white border-brand-600';
      case 'sold': return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'extruding': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'extruded': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;

    if (modalType === 'edit') {
      onEditBatch(activeBatch.id, {
        weightKg: parseFloat(formWeight),
        partnerId: formPartnerId,
        materialCode: formMaterialCode
      });
      resetModal();
      return;
    }

    const weightToUse = parseFloat(formWeight);
    if (isNaN(weightToUse) || weightToUse <= 0) {
        alert("O peso deve ser um valor positivo.");
        return;
    }

    if ((modalType === 'sell' || modalType === 'extrude_send') && weightToUse > activeBatch.weightKg) {
        alert(`O peso informado (${weightToUse}kg) excede o saldo disponível em estoque (${activeBatch.weightKg.toLocaleString()}kg).`);
        return;
    }

    const shipping: ShippingInfo = (modalType === 'sell' || modalType === 'extrude_send') ? {
      plate: sPlate,
      driverName: sDriver,
      carrier: sCarrier,
      document: sDoc,
      cost: parseFloat(sCost) || 0,
      origin: sOrigin,
      destination: sDest,
      isFobOrOwn: sIsFobOrOwn
    } : undefined;

    const config = { 
      date: formDate,
      dueDate: formDueDate,
      weight: weightToUse,
      materialCode: formMaterialCode,
      partnerId: formPartnerId,
      pricePerKg: parseFloat(formPrice),
      shipping
    };

    const nextStatusMap: Record<string, BatchStatus> = {
      finalize: 'finished',
      extrude_send: 'extruding',
      extrude_return: 'extruded',
      sell: 'sold'
    };

    onUpdateStatus(activeBatch.id, nextStatusMap[modalType!] || activeBatch.status, config);
    resetModal();
  };

  const openModal = (type: typeof modalType, batch: Batch) => {
    setActiveBatch(batch);
    setModalType(type);
    setFormWeight(batch.weightKg.toString());
    setFormMaterialCode(batch.materialCode);
    setFormPartnerId(''); 
    setFormPrice('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDueDate(new Date().toISOString().split('T')[0]);
    
    setSPlate('');
    setSDriver('');
    setSCarrier('');
    setSDoc('');
    setSCost('');
    setSOrigin('');
    setSDest('');
    setSIsFobOrOwn(false);
  };

  const resetModal = () => {
    setModalType(null);
    setActiveBatch(null);
  };

  const isPartialOutput = activeBatch && (modalType === 'sell' || modalType === 'extrude_send') && parseFloat(formWeight) < activeBatch.weightKg;
  
  // Cálculo de Perda para o modal de finalização ou retorno de extrusão
  const isLossCalculation = activeBatch && (modalType === 'finalize' || modalType === 'extrude_return');
  const currentLoss = activeBatch && isLossCalculation ? activeBatch.weightKg - parseFloat(formWeight || '0') : 0;
  const lossPercentage = activeBatch && isLossCalculation ? (currentLoss / activeBatch.weightKg) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar lote..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterPartnerId} 
              onChange={e => setFilterPartnerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-48"
            >
              <option value="all">Todos Fornecedores</option>
              {partners.filter(p => p.type !== 'customer').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={filterMaterialCode} 
              onChange={e => setFilterMaterialCode(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-48"
            >
              <option value="all">Todos Materiais</option>
              {materials.map(m => (
                <option key={m.code} value={m.code}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <th className="px-6 py-4">Lote</th>
              <th className="px-6 py-4">Material</th>
              <th className="px-6 py-4">Fornecedor/Origem</th>
              <th className="px-6 py-4">Peso (kg)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBatches.filter(b => b.status !== 'sold').map((batch) => {
              const partner = partners.find(p => p.id === (batch.status === 'extruding' ? batch.serviceProviderId : batch.partnerId));
              const material = materials.find(m => m.code === batch.materialCode);
              return (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-6 py-4 font-mono font-bold text-brand-700">{batch.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{material?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{partner?.name}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">{batch.weightKg.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(batch.status)}`}>
                      {getStatusLabel(batch.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal('edit', batch)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition" title="Editar Informações"><Edit2 className="w-4 h-4" /></button>
                      {batch.status === 'raw' && (
                        <button onClick={() => onUpdateStatus(batch.id, 'processing')} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition" title="Moer/Lavar"><Factory className="w-4 h-4" /></button>
                      )}
                      {batch.status === 'processing' && (
                        <button onClick={() => openModal('finalize', batch)} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition" title="Finalizar e Prensagem"><CheckCircle2 className="w-5 h-5" /></button>
                      )}
                      {(batch.status === 'finished' || batch.status === 'extruded') && (
                        <>
                          <button onClick={() => openModal('sell', batch)} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition" title="Registrar Venda"><ShoppingCart className="w-4 h-4" /></button>
                          {batch.status === 'finished' && (
                            <button onClick={() => openModal('extrude_send', batch)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition" title="Saída para Extrusão Externa"><Truck className="w-4 h-4" /></button>
                          )}
                        </>
                      )}
                      {batch.status === 'extruding' && (
                        <button onClick={() => openModal('extrude_return', batch)} className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-lg transition" title="Retorno de Extrusão"><RefreshCw className="w-4 h-4" /></button>
                      )}
                      <button 
                        onClick={() => { if(confirm(`Deseja excluir o lote ${batch.id} permanentemente?`)) onDeleteBatch(batch.id); }} 
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition" 
                        title="Excluir Lote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalType && activeBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
            <div className="bg-[#000814] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {modalType === 'sell' && <ShoppingCart className="w-5 h-5 text-brand-400" />}
                {modalType === 'finalize' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {modalType === 'extrude_send' && <Truck className="w-5 h-5 text-indigo-400" />}
                {modalType === 'extrude_return' && <RefreshCw className="w-5 h-5 text-cyan-400" />}
                
                {modalType === 'sell' && 'Venda de Material'}
                {modalType === 'finalize' && 'Finalizar e Prensagem'}
                {modalType === 'extrude_send' && 'Saída para Extrusão'}
                {modalType === 'extrude_return' && 'Retorno de Extrusora'}
                {modalType === 'edit' && 'Editar Lote'}
                
                <span className="text-slate-500 font-mono text-sm ml-2">{activeBatch.id}</span>
              </h3>
              <button onClick={resetModal} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data Registro
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={formDate} 
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 focus:border-brand-500 outline-none transition"
                  />
                </div>
                {(modalType === 'sell' || modalType === 'extrude_send') && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Vencimento
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={formDueDate} 
                      onChange={e => setFormDueDate(e.target.value)}
                      className="w-full p-3 border border-brand-100 rounded-xl bg-brand-50 text-brand-700 font-bold focus:border-brand-500 outline-none transition"
                    />
                  </div>
                )}
              </div>

              {/* Seção de Seleção de Parceiro (Cliente ou Prestador) */}
              {(modalType === 'sell' || modalType === 'extrude_send') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {modalType === 'sell' ? 'Nome do Cliente' : 'Prestador de Serviço'}
                  </label>
                  <select 
                    required 
                    value={formPartnerId} 
                    onChange={e => setFormPartnerId(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:border-brand-500 outline-none transition"
                  >
                    <option value="">Selecione o Parceiro...</option>
                    {partners.filter(p => 
                      modalType === 'sell' 
                        ? (p.type === 'customer' || p.type === 'both') 
                        : (p.type === 'service_provider' || p.type === 'both' || p.type === 'supplier')
                    ).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seção de Peso para Saídas (Venda ou Envio Extrusão) */}
              {(modalType === 'sell' || modalType === 'extrude_send') && (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso a Sair (Kg)</label>
                        <div className="relative">
                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                required 
                                type="number" 
                                step="0.01" 
                                value={formWeight} 
                                max={activeBatch.weightKg}
                                onChange={e => setFormWeight(e.target.value)} 
                                className={`w-full p-4 pl-10 border rounded-2xl text-2xl font-black outline-none transition ${isPartialOutput ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-brand-700'}`} 
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Estoque: {activeBatch.weightKg.toLocaleString()} kg</span>
                            {isPartialOutput ? (
                                <div className="flex items-center gap-1 text-amber-600 text-[10px] font-black uppercase">
                                    <AlertTriangle className="w-3 h-3" /> Saída Parcial
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-brand-600 text-[10px] font-black uppercase">
                                    <CheckCircle2 className="w-3 h-3" /> Saída Total
                                </div>
                            )}
                        </div>
                        {isPartialOutput && (
                            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100 text-[10px] text-amber-800 font-medium italic mt-2">
                                Nota: Lote original permanecerá no estoque com {(activeBatch.weightKg - parseFloat(formWeight)).toLocaleString()} kg.
                            </div>
                        )}
                    </div>

                    {modalType === 'sell' && (
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preço de Venda (R$/Kg)</label>
                          <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <input 
                                  required 
                                  type="number" 
                                  step="0.01" 
                                  value={formPrice} 
                                  onChange={e => setFormPrice(e.target.value)} 
                                  className="w-full p-4 pl-10 border border-slate-200 rounded-2xl font-black text-slate-800 focus:border-brand-500 outline-none transition" 
                                  placeholder="0,00" 
                              />
                          </div>
                          {formPrice && formWeight && (
                              <div className="bg-brand-50 p-3 rounded-xl border border-brand-100 flex justify-between items-center mt-2">
                                  <span className="text-[10px] font-bold text-brand-600 uppercase">Total do Pedido</span>
                                  <span className="text-lg font-black text-brand-800">R$ {(parseFloat(formWeight) * parseFloat(formPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                          )}
                      </div>
                    )}
                </div>
              )}

              {/* Seção de Retorno / Finalização (Cálculo de Perda) */}
              {isLossCalculation && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Peso Enviado</span>
                      <span className="text-lg font-black text-slate-700">{activeBatch.weightKg.toLocaleString()} kg</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status</span>
                      <span className="text-xs font-black text-brand-600 uppercase">{getStatusLabel(activeBatch.status)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso de Retorno / Final (Kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 w-5 h-5" />
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={formWeight} 
                        onChange={e => setFormWeight(e.target.value)} 
                        className="w-full p-4 pl-10 border border-brand-200 rounded-2xl text-3xl font-black text-brand-800 bg-brand-50/30 focus:border-brand-600 outline-none transition" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {formWeight && parseFloat(formWeight) > 0 && (
                    <div className={`p-4 rounded-2xl border flex flex-col gap-1 transition-all ${currentLoss >= 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {currentLoss >= 0 ? 'Perda Identificada' : 'Ganho Identificado'}
                        </span>
                        <span className={`text-sm font-black ${currentLoss >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {Math.abs(currentLoss).toLocaleString()} kg ({Math.abs(lossPercentage).toFixed(2)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full transition-all duration-500 ${currentLoss >= 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(Math.abs(lossPercentage), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Material</label>
                    <select value={formMaterialCode} onChange={e => setFormMaterialCode(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50">
                      {materials.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Peso (Kg)</label>
                    <input disabled type="number" value={formWeight} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-bold" />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className={`w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition active:scale-95 ${
                  modalType === 'finalize' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 
                  modalType === 'extrude_return' ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-100' :
                  modalType === 'extrude_send' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' :
                  'bg-brand-600 hover:bg-brand-700 shadow-brand-100'
                }`}
              >
                Confirmar Operação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
