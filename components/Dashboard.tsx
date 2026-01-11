
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Batch, Partner, Material } from '../types.ts';
import { getInventoryInsights } from '../services/geminiService.ts';
import { Brain, TrendingUp, Package, Truck, Recycle } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
}

const Dashboard: React.FC<Props> = ({ batches, partners, materials }) => {
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const stats = useMemo(() => {
    const rawWeight = batches.filter(b => b.status === 'raw').reduce((acc, curr) => acc + curr.weightKg, 0);
    const finishedWeight = batches.filter(b => b.status === 'finished').reduce((acc, curr) => acc + curr.weightKg, 0);
    const finishedWeightCount = batches.filter(b => b.status === 'finished').length;
    const processingWeight = batches.filter(b => b.status === 'processing').reduce((acc, curr) => acc + curr.weightKg, 0);
    
    return { rawWeight, finishedWeight, processingWeight };
  }, [batches]);

  const materialData = useMemo(() => {
    return materials.map(m => ({
      name: m.name,
      value: batches.filter(b => b.materialCode === m.code).reduce((acc, curr) => acc + curr.weightKg, 0)
    }));
  }, [batches, materials]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const text = await getInventoryInsights(batches, partners, materials);
    setInsights(text || "Sem dados suficientes.");
    setLoadingInsights(false);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Materia Prima (Sujo)</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.rawWeight.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Em Processamento</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.processingWeight.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: '30%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Estoque Acabado</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.finishedWeight.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-700">Volume por Tipo de Material (Kg)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl shadow-sm border border-emerald-200 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-emerald-800">
              <Brain className="w-6 h-6" />
              <h3 className="text-lg font-bold">Analista de IA Green</h3>
            </div>
            <button
              onClick={handleGetInsights}
              disabled={loadingInsights}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              {loadingInsights ? 'Analisando...' : 'Gerar Insights'}
            </button>
          </div>
          
          <div className="flex-1 bg-white/50 rounded-xl p-4 border border-white/50 text-slate-700 whitespace-pre-wrap min-h-[200px]">
            {insights ? insights : (
              <div className="flex flex-col items-center justify-center h-full text-emerald-600/50 italic text-center p-8">
                Clique em "Gerar Insights" para receber uma análise profunda baseada no seu estoque atual.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
