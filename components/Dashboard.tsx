
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Batch, Partner, Material } from '../types.ts';
import { Package, Truck, Recycle } from 'lucide-react';

interface Props {
  batches: Batch[];
  partners: Partner[];
  materials: Material[];
}

const Dashboard: React.FC<Props> = ({ batches, materials }) => {
  const stats = useMemo(() => {
    const rawWeight = batches.filter(b => b.status === 'raw').reduce((acc, curr) => acc + curr.weightKg, 0);
    const finishedWeight = batches.filter(b => b.status === 'finished').reduce((acc, curr) => acc + curr.weightKg, 0);
    const processingWeight = batches.filter(b => b.status === 'processing').reduce((acc, curr) => acc + curr.weightKg, 0);
    
    return { rawWeight, finishedWeight, processingWeight };
  }, [batches]);

  const materialData = useMemo(() => {
    return materials.map(m => ({
      name: m.name,
      value: batches.filter(b => b.materialCode === m.code).reduce((acc, curr) => acc + curr.weightKg, 0)
    }));
  }, [batches, materials]);

  const COLORS = ['#0070e0', '#005bb3', '#004285', '#304050', '#607080'];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-slate-100 p-3 rounded-full text-slate-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Materia Prima (Sujo)</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.rawWeight.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-400 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-brand-50 p-3 rounded-full text-brand-600">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em Processamento</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.processingWeight.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-300 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-brand-600 p-3 rounded-full text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque Acabado</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.finishedWeight.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-600 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Volume por Tipo de Material (Kg)</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
