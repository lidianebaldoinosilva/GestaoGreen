
import React, { useState, useEffect } from 'react';
import { Partner } from '../types';
import { Plus, Building2, UserCircle, Phone, Mail, MapPin, Trash2, Edit2, X, Save, Users } from 'lucide-react';

interface Props {
  partners: Partner[];
  onAdd: (p: Omit<Partner, 'id'>) => void;
  onUpdate: (id: string, p: Partial<Partner>) => void;
  onDelete: (id: string) => void;
}

const PartnerManager: React.FC<Props> = ({ partners, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState = {
    name: '',
    code: '',
    type: 'supplier' as Partner['type'],
    document: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.code.length !== 3) {
      alert("O Código deve ter exatamente 3 dígitos (ex: 012).");
      return;
    }

    if (editingId) {
      // Verifica se o novo código já está em uso por OUTRO parceiro
      if (partners.some(p => p.code === formData.code && p.id !== editingId)) {
        alert("Este código de parceiro já está em uso por outra empresa.");
        return;
      }
      onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      // Check if code already exists
      if (partners.some(p => p.code === formData.code)) {
        alert("Este código de parceiro já está em uso.");
        return;
      }
      onAdd(formData);
    }
    
    setFormData(initialFormState);
    setIsFormOpen(false);
  };

  const handleEdit = (partner: Partner) => {
    setFormData({
      name: partner.name,
      code: partner.code,
      type: partner.type,
      document: partner.document || '',
      email: partner.email || '',
      phone: partner.phone || '',
      address: partner.address || '',
      contactPerson: partner.contactPerson || ''
    });
    setEditingId(partner.id);
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
        <h3 className="text-lg font-bold text-slate-700">Gestão de Parceiros</h3>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" /> Novo Parceiro
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-2xl border-2 border-emerald-100 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-slate-800">
              {editingId ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}
            </h4>
            <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Razão Social / Nome <span className="text-red-500">*</span></label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="Nome da empresa ou pessoa"
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
                  placeholder="012"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="supplier">Fornecedor</option>
                  <option value="customer">Cliente</option>
                  <option value="both">Ambos (Fornecedor e Cliente)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">CPF / CNPJ (Opcional)</label>
                <input 
                  value={formData.document}
                  onChange={e => setFormData({ ...formData, document: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail (Opcional)</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone (Opcional)</label>
                <input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Pessoa de Contato</label>
                <input 
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Nome do contato"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
              <input 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
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
                <Save className="w-5 h-5" /> {editingId ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${
                  p.type === 'supplier' ? 'bg-amber-50 text-amber-600' : 
                  p.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => handleEdit(p)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {p.code}</span>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                  p.type === 'supplier' ? 'bg-amber-100 text-amber-700' : 
                  p.type === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {p.type === 'supplier' ? 'Fornecedor' : p.type === 'customer' ? 'Cliente' : 'Ambos'}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-lg leading-tight">{p.name}</h4>
              <p className="text-slate-400 text-xs mt-1">{p.document || 'Nenhum documento informado'}</p>
            </div>
            
            <div className="p-5 space-y-3 bg-slate-50/50">
              {p.contactPerson && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <UserCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="font-medium">{p.contactPerson}</span>
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{p.phone}</span>
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-3 text-sm text-slate-600 truncate">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{p.email}</span>
                </div>
              )}
              {p.address && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{p.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {partners.length === 0 && (
        <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-slate-300">
           <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-500 font-medium">Nenhum parceiro cadastrado.</p>
           <button onClick={() => setIsFormOpen(true)} className="text-emerald-600 font-bold mt-2 hover:underline">
             Cadastrar o primeiro agora
           </button>
        </div>
      )}
    </div>
  );
};

export default PartnerManager;
