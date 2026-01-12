
import React, { useState } from 'react';
import { Batch, Partner, Material, BatchStatus, ShippingInfo } from '../types.ts';
import { Search, CheckCircle2, Factory, ArrowRight, X, Scale, AlertTriangle, Truck, ShoppingCart, RefreshCw, Filter, Calendar, Trash2 } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
  onUpdateStatus: (id: string, status: BatchStatus, config?: { weight?: number, partnerId?: string, pricePerKg?: number, materialCode?: string, date?: string, shipping?: ShippingInfo, dueDate?: string }) => void;
  onDeleteBatch: (id: string) => void;
}

const InventoryTable: React.FC<Props> = ({ batches, partners, materials, onUpdateStatus, onDeleteBatch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartnerId, setFilterPartnerId] = useState('all');
  const [filterMaterialCode, setFilterMaterialCode] = useState('all');
  
  const [modalType, setModalType] = useState<'finalize' | 'extrude_send' | 'extrude_return' | 'sell' | null>(null);
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  
  const [formWeight, setFormWeight] = useState('');
  const [formPartnerId, setFormPartnerId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMaterialCode, setFormMaterialCode] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Shipping Info States (Local to modal)
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
      case 'raw': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'finished': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'sold': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'extruding': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'extruded': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;

    const shipping: ShippingInfo = modalType === 'sell' ? {
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
      weight: parseFloat(formWeight),
      materialCode: formMaterialCode,
      partnerId: formPartnerId,
      pricePerKg: parseFloat(formPrice),
      shipping
    };

    if (modalType === 'finalize') {
      onUpdateStatus(activeBatch.id, 'finished', config);
    } else if (modalType === 'extrude_send') {
      onUpdateStatus(activeBatch.id, 'extruding', config);
    } else if (modalType === 'extrude_return') {
      onUpdateStatus(activeBatch.id, 'extruded', config);
    } else if (modalType === 'sell') {
      onUpdateStatus(activeBatch.id, 'sold', config);
    }

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
    
    // Clear shipping
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

  const calculateLoss = () => {
    if (!activeBatch || !formWeight) return 0;
    const diff = activeBatch.weightKg - parseFloat(formWeight);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Barra de Filtros */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar lote..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterPartnerId} 
              onChange={e => setFilterPartnerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-48"
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
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-48"
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
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Lote</th>
              <th className="px-6 py-4">Material</th>
              <th className="px-6 py-4">Fornecedor/Origem</th>
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
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(batch.status)}`}>
                      {getStatusLabel(batch.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {batch.status === 'raw' && (
                        <button onClick={() => onUpdateStatus(batch.id, 'processing')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Moer/Lavar"><Factory className="w-4 h-4" /></button>
                      )}
                      {batch.status === 'processing' && (
                        <button onClick={() => openModal('finalize', batch)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Finalizar e Prensagem"><CheckCircle2 className="w-5 h-5" /></button>
                      )}
                      {(batch.status === 'finished' || batch.status === 'extruded') && (
                        <>
                          <button onClick={() => openModal('sell', batch)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Registrar Venda"><ShoppingCart className="w-4 h-4" /></button>
                          {batch.status === 'finished' && (
                            <button onClick={() => openModal('extrude_send', batch)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Saída para Extrusão Externa"><Truck className="w-4 h-4" /></button>
                          )}
                        </>
                      )}
                      {batch.status === 'extruding' && (
                        <button onClick={() => openModal('extrude_return', batch)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition" title="Retorno de Extrusão"><RefreshCw className="w-4 h-4" /></button>
                      )}
                      <button 
                        onClick={() => { if(confirm(`Deseja excluir o lote ${batch.id} permanentemente?`)) onDeleteBatch(batch.id); }} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
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
          <div className={`bg-white rounded-3xl shadow-2xl w-full ${modalType === 'sell' ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden animate-in zoom-in duration-200`}>
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {modalType === 'finalize' && 'Finalizar Processo'}
                {modalType === 'extrude_send' && 'Enviar para Extrusora'}
                {modalType === 'extrude_return' && 'Retorno de Extrusora'}
                {modalType === 'sell' && 'Venda de Material'}
                {` - Lote ${activeBatch.id}`}
              </h3>
              <button onClick={resetModal} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Data Registro
                    </label>
                    <input 
                    type="date" 
                    required 
                    value={formDate} 
                    onChange={e => {
                        setFormDate(e.target.value);
                        setFormDueDate(e.target.value);
                    }}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none"
                    />
                </div>
                {modalType === 'sell' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Recebimento (Vencimento)
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={formDueDate} 
                      onChange={e => setFormDueDate(e.target.value)}
                      className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl outline-none font-bold"
                    />
                  </div>
                )}
              </div>

              {(modalType === 'extrude_send' || modalType === 'sell') && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 uppercase">
                    {modalType === 'sell' ? 'Nome do Cliente' : 'Prestador de Serviço de Extrusão'}
                  </label>
                  <select 
                    required 
                    value={formPartnerId} 
                    onChange={e => setFormPartnerId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none"
                  >
                    <option value="">Selecione...</option>
                    {partners.filter(p => 
                      modalType === 'sell' ? (p.type === 'customer' || p.type === 'both') : (p.type === 'service_provider' || p.type === 'both' || p.type === 'supplier')
                    ).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === 'sell' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase">Preço de Venda por Kg (R$)</label>
                    <input required type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" placeholder="Ex: 5,50" />
                    {formPrice && (
                      <p className="text-sm font-bold text-emerald-600 mt-2">
                        Total Receita: R$ {(activeBatch.weightKg * parseFloat(formPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Shipping Section for Sell */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-bold text-slate-700 flex items-center gap-2 uppercase">
                        <Truck className="w-4 h-4 text-blue-500" /> Informações de Frete
                      </h4>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                        <input type="checkbox" checked={sIsFobOrOwn} onChange={e => setSIsFobOrOwn(e.target.checked)} className="w-3 h-3 text-emerald-600" />
                        Próprio / FOB
                      </label>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 transition-opacity ${sIsFobOrOwn ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Placa</label>
                        <input type="text" value={sPlate} onChange={e => setSPlate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 uppercase text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Motorista</label>
                        <input type="text" value={sDriver} onChange={e => setSDriver(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Transportadora</label>
                        <input type="text" value={sCarrier} onChange={e => setSCarrier(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Frete (R$)</label>
                        <input type="number" value={sCost} onChange={e => setSCost(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(modalType === 'finalize' || modalType === 'extrude_return') && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase">Material de Reentrada</label>
                    <select 
                      required 
                      value={formMaterialCode} 
                      onChange={e => setFormMaterialCode(e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.code}>{m.name} ({m.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 uppercase">Peso Final Verificado (Kg)</label>
                      <input required type="number" step="0.01" value={formWeight} onChange={e => setFormWeight(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl text-2xl font-bold text-emerald-700 outline-none" placeholder="Ex: 1200" />
                    </div>
                    
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${calculateLoss() > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Perda Calculada:</span>
                      </div>
                      <span className="font-bold">{calculateLoss().toLocaleString()} kg</span>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">
                Confirmar e Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
