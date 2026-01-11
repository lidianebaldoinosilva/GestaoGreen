
import React, { useState } from 'react';
import { Batch, Partner, Material, BatchStatus } from '../types.ts';
import { Search, CheckCircle2, Factory, ArrowRight, X, Scale, AlertTriangle, Truck, ShoppingCart, RefreshCw } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
  onUpdateStatus: (id: string, status: BatchStatus, config?: { weight?: number, partnerId?: string, pricePerKg?: number, materialCode?: string }) => void;
}

const InventoryTable: React.FC<Props> = ({ batches, partners, materials, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'finalize' | 'extrude_send' | 'extrude_return' | 'sell' | null>(null);
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  
  const [formWeight, setFormWeight] = useState('');
  const [formPartnerId, setFormPartnerId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMaterialCode, setFormMaterialCode] = useState('');

  const filteredBatches = batches.filter(b => {
    const partner = partners.find(p => p.id === b.partnerId);
    const material = materials.find(m => m.code === b.materialCode);
    return `${b.id} ${partner?.name} ${material?.name}`.toLowerCase().includes(searchTerm.toLowerCase());
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

    if (modalType === 'finalize') {
      onUpdateStatus(activeBatch.id, 'finished', { 
        weight: parseFloat(formWeight),
        materialCode: formMaterialCode
      });
    } else if (modalType === 'extrude_send') {
      onUpdateStatus(activeBatch.id, 'extruding', { partnerId: formPartnerId });
    } else if (modalType === 'extrude_return') {
      onUpdateStatus(activeBatch.id, 'extruded', { 
        weight: parseFloat(formWeight),
        materialCode: formMaterialCode
      });
    } else if (modalType === 'sell') {
      onUpdateStatus(activeBatch.id, 'sold', { partnerId: formPartnerId, pricePerKg: parseFloat(formPrice) });
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
  };

  const resetModal = () => {
    setModalType(null);
    setActiveBatch(null);
    setFormWeight('');
    setFormPartnerId('');
    setFormPrice('');
    setFormMaterialCode('');
  };

  const calculateLoss = () => {
    if (!activeBatch || !formWeight) return 0;
    const diff = activeBatch.weightKg - parseFloat(formWeight);
    return diff > 0 ? diff : 0;
  };

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
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
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
            
            <form onSubmit={handleModalSubmit} className="p-8 space-y-6">
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
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 uppercase">Preço de Venda por Kg (R$)</label>
                  <input required type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" placeholder="Ex: 5,50" />
                  {formPrice && (
                    <p className="text-sm font-bold text-emerald-600 mt-2">
                      Total: R$ {(activeBatch.weightKg * parseFloat(formPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
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
                    <p className="text-[10px] text-slate-400">Ao alterar o material, o ID do lote será atualizado para refletir a nova classificação.</p>
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
