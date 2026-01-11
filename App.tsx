
import React, { useState, useEffect } from 'react';
import { Partner, Material, Batch, Transaction, BatchStatus, FinancialEntry } from './types.ts';
import { INITIAL_PARTNERS, MATERIALS, INITIAL_BATCHES } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import PartnerManager from './components/PartnerManager.tsx';
import MaterialManager from './components/MaterialManager.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import HistoryReport from './components/HistoryReport.tsx';
import FinancialLedger from './components/FinancialLedger.tsx';
import { LayoutDashboard, Boxes, Users, ArrowLeftRight, Sprout, Tags, History, WalletCards } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'partners' | 'materials' | 'transactions' | 'history' | 'financial'>('dashboard');
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [materials, setMaterials] = useState<Material[]>(MATERIALS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);

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

  const addPurchase = (partnerId: string, materialCode: string, weight: number, pricePerKg?: number) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const sequence = (batches.filter(b => b.partnerId === partnerId).length + 1).toString().padStart(3, '0');
    const newBatchId = `${partner.code}/${sequence}/${materialCode}`;
    const now = new Date().toISOString();
    
    const newBatch: Batch = {
      id: newBatchId,
      partnerId,
      batchSequence: sequence,
      materialCode,
      weightKg: weight,
      status: 'raw',
      createdAt: now,
      updatedAt: now,
      purchasePricePerKg: pricePerKg
    };

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      batchId: newBatchId,
      type: 'purchase',
      weight,
      date: now,
      description: `Compra de ${partner.name}${pricePerKg ? ` (R$ ${pricePerKg}/kg)` : ''}`
    };

    if (pricePerKg) {
      const finEntry: FinancialEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'payable',
        partnerId,
        batchId: newBatchId,
        amount: weight * pricePerKg,
        date: now,
        status: 'pending',
        description: `Pagamento Lote ${newBatchId} - ${partner.name}`
      };
      setFinancials(prev => [...prev, finEntry]);
    }

    setBatches([...batches, newBatch]);
    setTransactions(prev => [...prev, newTx]);
  };

  const updateBatchStatus = (batchId: string, newStatus: BatchStatus, config?: { weight?: number, partnerId?: string, pricePerKg?: number }) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const originalWeight = batch.weightKg;
    const now = new Date().toISOString();
    const finalWeight = config?.weight !== undefined ? config.weight : batch.weightKg;
    
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return { 
          ...b, 
          status: newStatus, 
          weightKg: finalWeight,
          serviceProviderId: config?.partnerId && newStatus === 'extruding' ? config.partnerId : b.serviceProviderId,
          customerId: config?.partnerId && newStatus === 'sold' ? config.partnerId : b.customerId,
          salePricePerKg: config?.pricePerKg || b.salePricePerKg,
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
      extruding: 'extruding',
      extruded: 'extruded'
    };

    const newTxs: Transaction[] = [];

    if ((newStatus === 'finished' || newStatus === 'extruded') && config?.weight !== undefined) {
      const loss = originalWeight - finalWeight;
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId,
        type: typeMapping[newStatus],
        weight: finalWeight,
        originalWeight: originalWeight,
        date: now,
        description: `${newStatus === 'finished' ? 'Finalização processo' : 'Retorno extrusão'}. Peso final: ${finalWeight}kg`
      });

      if (loss > 0) {
        newTxs.push({
          id: Math.random().toString(36).substr(2, 9),
          batchId,
          type: 'loss',
          weight: loss,
          date: now,
          description: `Perda registrada no processo (${newStatus})`
        });
      }
    } else if (newStatus === 'sold' && config?.pricePerKg) {
      const partner = partners.find(p => p.id === config.partnerId);
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId,
        type: 'sale',
        weight: batch.weightKg,
        date: now,
        description: `Venda para ${partner?.name || 'Cliente'} (R$ ${config.pricePerKg}/kg)`
      });

      const finEntry: FinancialEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'receivable',
        partnerId: config.partnerId || '',
        batchId,
        amount: batch.weightKg * config.pricePerKg,
        date: now,
        status: 'pending',
        description: `Venda Lote ${batchId} - ${partner?.name}`
      };
      setFinancials(prev => [...prev, finEntry]);
    } else {
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId,
        type: typeMapping[newStatus],
        weight: finalWeight,
        date: now,
        description: `Alteração de status para ${newStatus}`
      });
    }

    setTransactions(prev => [...prev, ...newTxs]);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque de Lotes', icon: Boxes },
    { id: 'transactions', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'financial', label: 'Financeiro', icon: WalletCards },
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
          <p className="text-xs">v1.4.0 &copy; 2024 Green S.A.</p>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500">Controle operacional e financeiro Green.</p>
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

        {activeTab === 'dashboard' && <Dashboard batches={batches} partners={partners} materials={materials} />}
        {activeTab === 'inventory' && <InventoryTable batches={batches} partners={partners} materials={materials} onUpdateStatus={updateBatchStatus} />}
        {activeTab === 'partners' && <PartnerManager partners={partners} onAdd={(p) => setPartners([...partners, { ...p, id: Math.random().toString(36).substr(2, 9) }])} onUpdate={(id, data) => setPartners(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))} onDelete={(id) => setPartners(prev => prev.filter(p => p.id !== id))} />}
        {activeTab === 'materials' && <MaterialManager materials={materials} onAdd={(m) => setMaterials([...materials, { ...m, id: Math.random().toString(36).substr(2, 9) }])} onUpdate={(id, data) => setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))} onDelete={(id) => setMaterials(prev => prev.filter(m => m.id !== id))} />}
        {activeTab === 'transactions' && <TransactionForm partners={partners} materials={materials} batches={batches.filter(b => b.status !== 'sold')} onPurchase={addPurchase} onUpdateStatus={(id, status, w) => updateBatchStatus(id, status, { weight: w })} />}
        {activeTab === 'history' && <HistoryReport transactions={transactions} partners={partners} materials={materials} batches={batches} />}
        {activeTab === 'financial' && <FinancialLedger entries={financials} partners={partners} onStatusChange={(id, status) => setFinancials(prev => prev.map(f => f.id === id ? { ...f, status } : f))} />}
      </main>
    </div>
  );
};

export default App;
