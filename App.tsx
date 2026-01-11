
import React, { useState, useEffect, useMemo } from 'react';
import { Partner, Material, Batch, Transaction, BatchStatus } from './types.ts';
import { INITIAL_PARTNERS, MATERIALS, INITIAL_BATCHES } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import PartnerManager from './components/PartnerManager.tsx';
import MaterialManager from './components/MaterialManager.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import HistoryReport from './components/HistoryReport.tsx';
import { LayoutDashboard, Boxes, Users, ArrowLeftRight, Settings, Sprout, Tags, History } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'partners' | 'materials' | 'transactions' | 'history'>('dashboard');
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [materials, setMaterials] = useState<Material[]>(MATERIALS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Carregar transações iniciais baseadas no lote inicial
  useEffect(() => {
    if (transactions.length === 0 && batches.length > 0) {
      const initialTxs: Transaction[] = batches.map(b => ({
        id: `init-${b.id}`,
        batchId: b.id,
        type: 'purchase',
        weight: b.weightKg,
        date: b.createdAt,
        description: 'Saldo inicial / Compra registrada'
      }));
      setTransactions(initialTxs);
    }
  }, []);

  const generateBatchId = (partnerCode: string, materialCode: string) => {
    const partner = partners.find(p => p.code === partnerCode);
    const count = batches.filter(b => b.partnerId === partner?.id).length + 1;
    const seq = count.toString().padStart(3, '0');
    return `${partnerCode}/${seq}/${materialCode}`;
  };

  const addPurchase = (partnerId: string, materialCode: string, weight: number) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const newBatchId = generateBatchId(partner.code, materialCode);
    const now = new Date().toISOString();
    const newBatch: Batch = {
      id: newBatchId,
      partnerId,
      batchSequence: (batches.filter(b => b.partnerId === partnerId).length + 1).toString().padStart(3, '0'),
      materialCode,
      weightKg: weight,
      status: 'raw',
      createdAt: now,
      updatedAt: now
    };

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      batchId: newBatchId,
      type: 'purchase',
      weight,
      date: now,
      description: `Compra registrada de ${partner.name}`
    };

    setBatches([...batches, newBatch]);
    setTransactions(prev => [...prev, newTx]);
  };

  const updateBatchStatus = (batchId: string, newStatus: BatchStatus, finalWeight?: number) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const originalWeight = batch.weightKg;
    const now = new Date().toISOString();
    
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return { 
          ...b, 
          status: newStatus, 
          weightKg: finalWeight !== undefined ? finalWeight : b.weightKg,
          updatedAt: now 
        };
      }
      return b;
    }));

    const typeMapping: Record<BatchStatus, Transaction['type']> = {
      raw: 'purchase',
      processing: 'production',
      finished: 'production',
      sold: 'sale',
      extruded: 'extrusion'
    };

    const newTxs: Transaction[] = [];

    // Se estiver finalizando e houver diferença de peso, registrar perda
    if (newStatus === 'finished' && finalWeight !== undefined) {
      const loss = originalWeight - finalWeight;
      
      // Transação de Produção (Peso Final)
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId,
        type: 'production',
        weight: finalWeight,
        originalWeight: originalWeight,
        date: now,
        description: `Finalização de processo. Peso original: ${originalWeight}kg`
      });

      // Transação de Perda (Se houver)
      if (loss > 0) {
        newTxs.push({
          id: Math.random().toString(36).substr(2, 9),
          batchId,
          type: 'loss',
          weight: loss,
          date: now,
          description: `Perda identificada no processo de moagem/lavagem`
        });
      }
    } else {
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId,
        type: typeMapping[newStatus],
        weight: finalWeight !== undefined ? finalWeight : batch.weightKg,
        date: now,
        description: `Alteração de status para ${newStatus}`
      });
    }

    setTransactions(prev => [...prev, ...newTxs]);
  };

  const addPartner = (p: Omit<Partner, 'id'>) => {
    setPartners([...partners, { ...p, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const updatePartner = (id: string, data: Partial<Partner>) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deletePartner = (id: string) => {
    if (batches.some(b => b.partnerId === id)) {
      alert("Não é possível excluir este parceiro pois ele possui lotes vinculados.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este parceiro?")) {
      setPartners(prev => prev.filter(p => p.id !== id));
    }
  };

  const addMaterial = (m: Omit<Material, 'id'>) => {
    setMaterials([...materials, { ...m, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const updateMaterial = (id: string, data: Partial<Material>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const deleteMaterial = (id: string) => {
    if (batches.some(b => b.materialCode === materials.find(m => m.id === id)?.code)) {
      alert("Não é possível excluir este material pois ele possui lotes vinculados.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este material?")) {
      setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque de Lotes', icon: Boxes },
    { id: 'transactions', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'partners', label: 'Parceiros', icon: Users },
    { id: 'materials', label: 'Materiais', icon: Tags },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-emerald-900 text-emerald-50 hidden md:flex flex-col sticky top-0 h-screen shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-emerald-800">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Green Reciclagem</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-emerald-700 text-white shadow-inner' 
                : 'hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-emerald-800 opacity-60">
          <p className="text-xs">v1.2.0 &copy; 2024 Green S.A.</p>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500">Controle operacional e rastreabilidade Green.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setActiveTab('transactions')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-sm flex items-center gap-2"
             >
               <ArrowLeftRight className="w-4 h-4" /> Registrar Entrada
             </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard batches={batches} partners={partners} materials={materials} />
        )}

        {activeTab === 'inventory' && (
          <InventoryTable 
            batches={batches} 
            partners={partners} 
            materials={materials} 
            onUpdateStatus={updateBatchStatus}
          />
        )}

        {activeTab === 'partners' && (
          <PartnerManager 
            partners={partners} 
            onAdd={addPartner} 
            onUpdate={updatePartner} 
            onDelete={deletePartner}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialManager 
            materials={materials} 
            onAdd={addMaterial} 
            onUpdate={updateMaterial} 
            onDelete={deleteMaterial}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionForm 
            partners={partners} 
            materials={materials} 
            batches={batches.filter(b => !['sold', 'extruded'].includes(b.status))}
            onPurchase={addPurchase}
            onUpdateStatus={updateBatchStatus}
          />
        )}

        {activeTab === 'history' && (
          <HistoryReport 
            transactions={transactions} 
            partners={partners} 
            materials={materials}
            batches={batches}
          />
        )}
      </main>
    </div>
  );
};

export default App;
