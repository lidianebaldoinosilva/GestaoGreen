
import React, { useState, useEffect, useRef } from 'react';
import { Partner, Material, Batch, Transaction, BatchStatus, FinancialEntry } from './types.ts';
import { INITIAL_PARTNERS, MATERIALS, INITIAL_BATCHES } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import PartnerManager from './components/PartnerManager.tsx';
import MaterialManager from './components/MaterialManager.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import HistoryReport from './components/HistoryReport.tsx';
import FinancialLedger from './components/FinancialLedger.tsx';
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  ArrowLeftRight, 
  Sprout, 
  Tags, 
  History, 
  WalletCards,
  Download,
  Upload
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'partners' | 'materials' | 'transactions' | 'history' | 'financial'>('dashboard');
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [materials, setMaterials] = useState<Material[]>(MATERIALS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const saveData = () => {
    const data = {
      partners,
      materials,
      batches,
      transactions,
      financials,
      version: '1.4.2',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `green_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Validação básica
        if (!json.partners || !json.batches) {
          throw new Error("Arquivo inválido");
        }

        if (confirm("Isso substituirá todos os dados atuais. Deseja continuar?")) {
          setPartners(json.partners);
          setMaterials(json.materials || MATERIALS);
          setBatches(json.batches);
          setTransactions(json.transactions || []);
          setFinancials(json.financials || []);
          alert('Dados carregados com sucesso!');
        }
      } catch (err) {
        alert('Erro ao carregar arquivo. Certifique-se que é um backup válido da Green Reciclagem.');
      }
    };
    reader.readAsText(file);
    // Limpar o input para permitir carregar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const updateBatchStatus = (batchId: string, newStatus: BatchStatus, config?: { weight?: number, partnerId?: string, pricePerKg?: number, materialCode?: string }) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const originalWeight = batch.weightKg;
    const now = new Date().toISOString();
    const finalWeight = config?.weight !== undefined ? config.weight : batch.weightKg;
    const finalMaterialCode = config?.materialCode || batch.materialCode;
    
    let finalBatchId = batchId;
    if (config?.materialCode && config.materialCode !== batch.materialCode) {
      const parts = batchId.split('/');
      if (parts.length === 3) {
        finalBatchId = `${parts[0]}/${parts[1]}/${config.materialCode}`;
      }
    }

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return { 
          ...b, 
          id: finalBatchId,
          status: newStatus, 
          weightKg: finalWeight,
          materialCode: finalMaterialCode,
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
      const matName = materials.find(m => m.code === finalMaterialCode)?.name || 'Material';
      
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId: finalBatchId,
        type: typeMapping[newStatus],
        weight: finalWeight,
        originalWeight: originalWeight,
        date: now,
        description: `${newStatus === 'finished' ? 'Finalização processo' : 'Retorno extrusão'} como ${matName}. Peso final: ${finalWeight}kg`
      });

      if (loss > 0) {
        newTxs.push({
          id: Math.random().toString(36).substr(2, 9),
          batchId: finalBatchId,
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
        batchId: finalBatchId,
        type: 'sale',
        weight: batch.weightKg,
        date: now,
        description: `Venda para ${partner?.name || 'Cliente'} (R$ ${config.pricePerKg}/kg)`
      });

      const finEntry: FinancialEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'receivable',
        partnerId: config.partnerId || '',
        batchId: finalBatchId,
        amount: batch.weightKg * config.pricePerKg,
        date: now,
        status: 'pending',
        description: `Venda Lote ${finalBatchId} - ${partner?.name}`
      };
      setFinancials(prev => [...prev, finEntry]);
    } else {
      newTxs.push({
        id: Math.random().toString(36).substr(2, 9),
        batchId: finalBatchId,
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

        {/* Botões de Salvar/Carregar */}
        <div className="p-4 border-t border-emerald-800 space-y-2">
          <button 
            onClick={saveData}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors border border-emerald-700"
          >
            <Download className="w-4 h-4" /> Salvar Dados
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors border border-emerald-700"
          >
            <Upload className="w-4 h-4" /> Carregar Dados
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLoadFile} 
            accept=".json" 
            className="hidden" 
          />
        </div>

        <div className="p-4 border-t border-emerald-800 opacity-60">
          <p className="text-[10px] text-center uppercase tracking-widest font-bold">v1.4.2 &copy; 2024 Green S.A.</p>
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
