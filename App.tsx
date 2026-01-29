
import React, { useState, useEffect, useRef } from 'react';
import { Partner, Material, Batch, Transaction, BatchStatus, FinancialEntry, ShippingInfo, Order } from './types.ts';
import { INITIAL_PARTNERS, MATERIALS, INITIAL_BATCHES } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import PartnerManager from './components/PartnerManager.tsx';
import MaterialManager from './components/MaterialManager.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import HistoryReport from './components/HistoryReport.tsx';
import FinancialLedger from './components/FinancialLedger.tsx';
import OrderManager from './components/OrderManager.tsx';
import * as XLSX from 'xlsx';
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
  Upload,
  ClipboardList
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'partners' | 'materials' | 'transactions' | 'history' | 'financial' | 'orders'>('dashboard');
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [materials, setMaterials] = useState<Material[]>(MATERIALS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
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

  const saveData = async () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const ordersToSave = orders.map(o => ({
        ...o,
        items: JSON.stringify(o.items)
      }));

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(batches), "Estoque");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), "Movimentações");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(financials), "financeiro");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partners), "parceiros");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materials), "materiais");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersToSave), "Pedidos");

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: 'bancodadosgreen.xlsx',
            types: [{
              description: 'Excel Workbook',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          alert('Arquivo salvo com sucesso na pasta escolhida!');
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error("Erro ao salvar usando picker:", err);
            XLSX.writeFile(wb, "bancodadosgreen.xlsx");
          }
        }
      } else {
        XLSX.writeFile(wb, "bancodadosgreen.xlsx");
      }
    } catch (error) {
      console.error("Erro geral no processo de exportação:", error);
      alert("Houve um problema ao gerar a planilha.");
    }
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (confirm("Isso substituirá todos os dados atuais. Deseja continuar?")) {
          if (workbook.Sheets["parceiros"]) setPartners(XLSX.utils.sheet_to_json(workbook.Sheets["parceiros"]) as Partner[]);
          if (workbook.Sheets["materiais"]) setMaterials(XLSX.utils.sheet_to_json(workbook.Sheets["materiais"]) as Material[]);
          if (workbook.Sheets["Estoque"]) setBatches(XLSX.utils.sheet_to_json(workbook.Sheets["Estoque"]) as Batch[]);
          if (workbook.Sheets["Movimentações"]) setTransactions(XLSX.utils.sheet_to_json(workbook.Sheets["Movimentações"]) as Transaction[]);
          if (workbook.Sheets["financeiro"]) setFinancials(XLSX.utils.sheet_to_json(workbook.Sheets["financeiro"]) as FinancialEntry[]);
          
          if (workbook.Sheets["Pedidos"]) {
            const rawOrders: any[] = XLSX.utils.sheet_to_json(workbook.Sheets["Pedidos"]);
            const processedOrders = rawOrders.map(o => ({
              ...o,
              items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
            }));
            setOrders(processedOrders as Order[]);
          }

          alert('Dados carregados com sucesso a partir da planilha Excel!');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar o arquivo Excel. Certifique-se que as abas estão corretas conforme o backup.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addPurchase = (partnerId: string, materialCode: string, weight: number, pricePerKg?: number, customDate?: string, shipping?: ShippingInfo, dueDate?: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const sequence = (batches.filter(b => b.partnerId === partnerId).length + 1).toString().padStart(3, '0');
    const newBatchId = `${partner.code}/${sequence}/${materialCode}`;
    const dateToUse = customDate ? new Date(customDate).toISOString() : new Date().toISOString();
    const dueDateToUse = dueDate ? new Date(dueDate).toISOString() : dateToUse;
    
    const newBatch: Batch = {
      id: newBatchId,
      partnerId,
      batchSequence: sequence,
      materialCode,
      weightKg: weight,
      status: 'raw',
      createdAt: dateToUse,
      updatedAt: dateToUse,
      purchasePricePerKg: pricePerKg,
      shipping: shipping
    };

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      batchId: newBatchId,
      type: 'purchase',
      weight,
      date: dateToUse,
      description: `Compra de ${partner.name}${pricePerKg ? ` (R$ ${pricePerKg}/kg)` : ''}`
    };

    const newFinEntries: FinancialEntry[] = [];

    if (pricePerKg) {
      newFinEntries.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'payable',
        operationType: 'Compra de Matéria Prima',
        partnerId,
        batchId: newBatchId,
        amount: weight * pricePerKg,
        date: dateToUse,
        dueDate: dueDateToUse,
        status: 'pending',
        description: `Pagamento Lote ${newBatchId} - ${partner.name}`
      });
    }

    if (shipping && !shipping.isFobOrOwn && shipping.cost && shipping.cost > 0) {
        newFinEntries.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'payable',
            operationType: 'Frete',
            partnerId: 'carrier-generic',
            batchId: newBatchId,
            amount: shipping.cost,
            date: dateToUse,
            dueDate: dueDateToUse,
            status: 'pending',
            description: `Frete Lote ${newBatchId} - ${shipping.carrier || 'Transportadora'}`
        });
    }

    setFinancials(prev => [...prev, ...newFinEntries]);
    setBatches([...batches, newBatch]);
    setTransactions(prev => [...prev, newTx]);
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
    
    // Se houver vendedor e valor de comissão, gera um lançamento financeiro
    if (order.sellerId && order.commissionAmount && order.commissionAmount > 0) {
      const seller = partners.find(p => p.id === order.sellerId);
      const newCommissionEntry: FinancialEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'payable',
        operationType: 'Comissão de Vendedor',
        partnerId: order.sellerId,
        batchId: order.orderNumber, // Vinculamos ao número do pedido
        amount: order.commissionAmount,
        date: order.date,
        dueDate: order.date, // Por padrão, vencimento na data do pedido
        status: 'pending',
        description: `Comissão do Pedido ${order.orderNumber} - ${seller?.name || 'Vendedor'}`
      };
      setFinancials(prev => [...prev, newCommissionEntry]);
    }
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteBatch = (batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
  };

  const handleEditBatch = (batchId: string, updates: { weightKg: number, partnerId: string, materialCode: string }) => {
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const parts = b.id.split('/');
        if (parts.length !== 3) return { ...b, ...updates };

        const newPartner = partners.find(p => p.id === updates.partnerId);
        const partnerCode = newPartner?.code || parts[0];
        const newBatchId = `${partnerCode}/${parts[1]}/${updates.materialCode}`;

        return {
          ...b,
          ...updates,
          id: newBatchId,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    }));
    
    setTransactions(prev => prev.map(t => {
      if (t.batchId === batchId) {
        const parts = batchId.split('/');
        const newPartner = partners.find(p => p.id === updates.partnerId);
        const partnerCode = newPartner?.code || parts[0];
        const newBatchId = `${partnerCode}/${parts[1]}/${updates.materialCode}`;
        return { ...t, batchId: newBatchId };
      }
      return t;
    }));

    setFinancials(prev => prev.map(f => {
      if (f.batchId === batchId) {
        const parts = batchId.split('/');
        const newPartner = partners.find(p => p.id === updates.partnerId);
        const partnerCode = newPartner?.code || parts[0];
        const newBatchId = `${partnerCode}/${parts[1]}/${updates.materialCode}`;
        return { ...f, batchId: newBatchId, partnerId: f.operationType === 'Frete' ? f.partnerId : updates.partnerId };
      }
      return f;
    }));
  };

  const updateBatchStatus = (batchId: string, newStatus: BatchStatus, config?: { 
    weight?: number, 
    partnerId?: string, 
    pricePerKg?: number, 
    materialCode?: string, 
    date?: string, 
    shipping?: ShippingInfo, 
    dueDate?: string,
    orderId?: string,
    orderItemId?: string,
    finalizeOrder?: boolean
  }) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const originalWeight = batch.weightKg;
    const dateToUse = config?.date ? new Date(config.date).toISOString() : new Date().toISOString();
    const finalWeight = config?.weight !== undefined ? config.weight : batch.weightKg;
    const finalMaterialCode = config?.materialCode || batch.materialCode;
    const dueDateToUse = config?.dueDate ? new Date(config.dueDate).toISOString() : dateToUse;
    
    let finalBatchId = batchId;
    if (config?.materialCode && config.materialCode !== batch.materialCode) {
      const parts = batchId.split('/');
      if (parts.length === 3) {
        finalBatchId = `${parts[0]}/${parts[1]}/${config.materialCode}`;
      }
    }

    const typeMapping: Record<BatchStatus, Transaction['type']> = {
      raw: 'purchase',
      processing: 'production',
      finished: 'production',
      sold: 'sale',
      extruding: 'extruding',
      extruded: 'extruded'
    };

    const newTxs: Transaction[] = [];
    const newFinEntries: FinancialEntry[] = [];

    // Se houver vínculo com pedido, atualiza o pedido
    if (newStatus === 'sold' && config?.orderId && config?.orderItemId) {
        setOrders(prev => prev.map(o => {
            if (o.id === config.orderId) {
                const updatedItems = o.items.map(item => {
                    if (item.id === config.orderItemId) {
                        return { ...item, deliveredQuantity: (item.deliveredQuantity || 0) + finalWeight };
                    }
                    return item;
                });
                
                // Verifica se todos os itens foram atendidos ou se o usuário forçou a finalização
                const allDelivered = updatedItems.every(item => item.deliveredQuantity >= item.quantity);
                const nextStatus = (config.finalizeOrder || allDelivered) ? 'delivered' : 'confirmed';
                
                return { ...o, items: updatedItems, status: nextStatus };
            }
            return o;
        }));
    }

    setBatches(prev => {
        const isPartialStatus = (newStatus === 'sold' || newStatus === 'extruding') && finalWeight < originalWeight;
        
        const updatedList = prev.map(b => {
            if (b.id === batchId) {
                if (isPartialStatus) {
                    return { ...b, weightKg: originalWeight - finalWeight, updatedAt: dateToUse };
                }
                return { 
                    ...b, 
                    id: finalBatchId,
                    status: newStatus, 
                    weightKg: finalWeight,
                    materialCode: finalMaterialCode,
                    serviceProviderId: config?.partnerId && newStatus === 'extruding' ? config.partnerId : b.serviceProviderId,
                    customerId: config?.partnerId && newStatus === 'sold' ? config.partnerId : b.customerId,
                    salePricePerKg: config?.pricePerKg || b.salePricePerKg,
                    updatedAt: dateToUse,
                    shipping: config?.shipping || b.shipping
                };
            }
            return b;
        });

        if (isPartialStatus) {
            const suffix = newStatus === 'sold' ? 'V' : 'E';
            const newSubBatchId = `${batchId}/${suffix}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            const newSubBatch: Batch = {
                ...batch,
                id: newSubBatchId,
                weightKg: finalWeight,
                status: newStatus,
                customerId: newStatus === 'sold' ? config?.partnerId : undefined,
                serviceProviderId: newStatus === 'extruding' ? config?.partnerId : undefined,
                salePricePerKg: config?.pricePerKg,
                updatedAt: dateToUse,
                shipping: config?.shipping
            };
            return [...updatedList, newSubBatch];
        }
        return updatedList;
    });

    const partner = partners.find(p => p.id === (config?.partnerId || batch.customerId || batch.serviceProviderId));
    const isPartial = (newStatus === 'sold' || newStatus === 'extruding') && finalWeight < originalWeight;
    const effectiveBatchId = isPartial ? `${batchId}/PARTIAL` : finalBatchId;

    if (newStatus === 'sold') {
        newTxs.push({
            id: Math.random().toString(36).substr(2, 9),
            batchId: effectiveBatchId,
            type: 'sale',
            weight: finalWeight,
            date: dateToUse,
            description: `${isPartial ? 'Venda Parcial' : 'Venda'} para ${partner?.name || 'Cliente'} (R$ ${config?.pricePerKg}/kg)` + (config?.orderId ? ` - Vinculada ao Pedido` : '')
        });

        if (config?.pricePerKg) {
            newFinEntries.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'receivable',
                operationType: 'Venda de Produto Acabado',
                partnerId: config.partnerId || '',
                batchId: effectiveBatchId,
                amount: finalWeight * config.pricePerKg,
                date: dateToUse,
                dueDate: dueDateToUse,
                status: 'pending',
                description: `${isPartial ? 'Venda Parcial' : 'Venda'} Lote ${batchId} - ${partner?.name}`
            });
        }
    } else if (newStatus === 'extruding') {
        newTxs.push({
            id: Math.random().toString(36).substr(2, 9),
            batchId: effectiveBatchId,
            type: 'extruding',
            weight: finalWeight,
            date: dateToUse,
            description: `${isPartial ? 'Saída Parcial' : 'Saída'} para Extrusão com ${partner?.name || 'Prestador'}`
        });
    } else if (newStatus === 'finished' || newStatus === 'extruded') {
        const loss = originalWeight - finalWeight;
        newTxs.push({
            id: Math.random().toString(36).substr(2, 9),
            batchId: finalBatchId,
            type: typeMapping[newStatus],
            weight: finalWeight,
            date: dateToUse,
            description: `${newStatus === 'finished' ? 'Prensagem finalizada' : 'Retorno da extrusora'}. Peso final: ${finalWeight}kg`
        });
        if (loss !== 0) {
            newTxs.push({
                id: Math.random().toString(36).substr(2, 9),
                batchId: finalBatchId,
                type: 'loss',
                weight: Math.abs(loss),
                date: dateToUse,
                description: `${loss > 0 ? 'Perda' : 'Ganho'} de peso registrado no processo (${newStatus})`
            });
        }
    }

    setTransactions(prev => [...prev, ...newTxs]);
    setFinancials(prev => [...prev, ...newFinEntries]);
  };

  const handleFinancialStatusChange = (id: string, status: FinancialEntry['status'], paymentDate?: string) => {
    setFinancials(prev => prev.map(f => {
      if (f.id === id) {
        return { 
          ...f, 
          status, 
          paymentDate: status === 'paid' ? (paymentDate || new Date().toISOString()) : undefined 
        };
      }
      return f;
    }));
  };

  const handleFinancialEntryUpdate = (id: string, updates: Partial<FinancialEntry>) => {
    setFinancials(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFinancialEntry = (id: string) => {
    setFinancials(prev => prev.filter(f => f.id !== id));
  };

  const addManualFinancialEntry = (entry: Omit<FinancialEntry, 'id' | 'status'>) => {
    const newEntry: FinancialEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    };
    setFinancials(prev => [...prev, newEntry]);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque de Lotes', icon: Boxes },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'transactions', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'financial', label: 'Financeiro', icon: WalletCards },
    { id: 'partners', label: 'Parceiros', icon: Users },
    { id: 'materials', label: 'Materiais', icon: Tags },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <aside className="w-64 bg-brand-950 text-white hidden md:flex flex-col sticky top-0 h-screen shadow-xl border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-brand-600 p-2 rounded-lg shadow-lg">
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
                ? 'bg-brand-800 text-white shadow-inner' 
                : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-brand-300' : 'text-slate-500'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={saveData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" /> Salvar Excel
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <Upload className="w-4 h-4" /> Carregar Excel
          </button>
          <input type="file" ref={fileInputRef} onChange={handleLoadFile} accept=".xlsx, .xls" className="hidden" />
        </div>

        <div className="p-4 border-t border-slate-800 opacity-60 text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">v1.5.0 &copy; 2024 Green S.A.</p>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 text-sm">Controle operacional e financeiro Green.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setActiveTab('transactions')}
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-md shadow-brand-100 flex items-center gap-2"
             >
               <ArrowLeftRight className="w-4 h-4" /> Registrar Entrada
             </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard batches={batches} partners={partners} materials={materials} />}
        {activeTab === 'inventory' && <InventoryTable batches={batches} partners={partners} materials={materials} orders={orders} onUpdateStatus={updateBatchStatus} onDeleteBatch={deleteBatch} onEditBatch={handleEditBatch} />}
        {activeTab === 'partners' && <PartnerManager partners={partners} onAdd={(p) => setPartners([...partners, { ...p, id: Math.random().toString(36).substr(2, 9) }])} onUpdate={(id, data) => setPartners(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))} onDelete={(id) => setPartners(prev => prev.filter(p => p.id !== id))} />}
        {activeTab === 'materials' && <MaterialManager materials={materials} onAdd={(m) => setMaterials([...materials, { ...m, id: Math.random().toString(36).substr(2, 9) }])} onUpdate={(id, data) => setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))} onDelete={(id) => setMaterials(prev => prev.filter(m => m.id !== id))} />}
        {activeTab === 'transactions' && <TransactionForm partners={partners} materials={materials} batches={batches.filter(b => b.status !== 'sold')} onPurchase={addPurchase} onUpdateStatus={(id, status, w) => updateBatchStatus(id, status, { weight: w })} />}
        {activeTab === 'history' && <HistoryReport transactions={transactions} partners={partners} materials={materials} batches={batches} />}
        {activeTab === 'financial' && <FinancialLedger entries={financials} partners={partners} onStatusChange={handleFinancialStatusChange} onUpdateEntry={handleFinancialEntryUpdate} onDeleteEntry={deleteFinancialEntry} onAddEntry={addManualFinancialEntry} />}
        {activeTab === 'orders' && <OrderManager orders={orders} partners={partners} onAdd={addOrder} onUpdate={updateOrder} onDelete={(id) => setOrders(prev => prev.filter(o => o.id !== id))} />}
      </main>
    </div>
  );
};

export default App;
