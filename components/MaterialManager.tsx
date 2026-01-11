
import React, { useState } from 'react';
import { Material } from '../types';
import { Plus, Tag, Trash2, Edit2, X, Save, Package } from 'lucide-react';

interface Props {
  materials: Material[];
  onAdd: (m: Omit<Material, 'id'>) => void;
  onUpdate: (id: string, m: Partial<Material>) => void;
  onDelete: (id: string) => void;
}

const MaterialManager: React.FC<Props> = ({ materials, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState = {
    name: '',
    code: '',
    ncm: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.code.length !== 3) {
      alert("O Código do material deve ter exatamente 3 dígitos (ex: 010).");
      return;
    }

    if (editingId) {
      if (materials.some(m => m.code === formData.code && m.id !== editingId)) {
        alert("Este código de material já está em uso.");
        return;
      }
      onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      if (materials.some(m => m.code === formData.code)) {
        alert("Este código de material já está em uso.");
        return;
      }
      onAdd(formData);
    }
    
    setFormData(initialFormState);
    setIsFormOpen(false);
  };

  const handleEdit = (material: Material) => {
    setFormData({
      name: material.name,
      code: material.code,
      ncm: material.ncm || ''
    });
    setEditingId(material.id);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-700">Gestão de Materiais</h3>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" /> Novo Material
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-2xl border-2 border-emerald-100 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-slate-800">
              {editingId ? 'Editar Material' : 'Cadastrar Novo Material'}
            </h4>
            <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Material <span className="text-red-500">*</span></label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="Ex: PEBD Cristal Moído"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Código (3 dígitos) <span className="text-red-500">*</span></label>
                <input 
                  required
                  maxLength={3}
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="010"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">NCM (Opcional)</label>
                <input 
                  value={formData.ncm}
                  onChange={e => setFormData({ ...formData, ncm: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="3915.10.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Descartar
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition"
              >
                <Save className="w-5 h-5" /> {editingId ? 'Salvar Alterações' : 'Cadastrar Material'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(m => (
          <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => handleEdit(m)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(m.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">COD: {m.code}</span>
                {m.ncm && <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">NCM: {m.ncm}</span>}
              </div>
              
              <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{m.name}</h4>
              <p className="text-slate-400 text-xs italic">
                Rastreabilidade final do lote: XXX/XXX/{m.code}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {materials.length === 0 && (
        <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-slate-300">
           <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-500 font-medium">Nenhum material cadastrado.</p>
           <button onClick={() => setIsFormOpen(true)} className="text-emerald-600 font-bold mt-2 hover:underline">
             Cadastrar o primeiro material
           </button>
        </div>
      )}
    </div>
  );
};

export default MaterialManager;
