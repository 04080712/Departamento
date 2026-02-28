
import React, { useState } from 'react';
import { User as UserType, DemandSector, DemandRequester, DemandType, DemandChannel, TaskStatus, UserRole } from '../types.ts';

import { ClipboardCheck, X, Building2, User, Tag, Edit3, Send, Briefcase, Info, XCircle, Calendar as CalendarIcon } from 'lucide-react';



interface NewDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  users: UserType[];
}

const NewDemandModal: React.FC<NewDemandModalProps> = ({ isOpen, onClose, onSubmit, users }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    company: '',
    sector: 'VE' as DemandSector,
    requester: 'ALEX BRUNO' as DemandRequester,
    otherRequester: '',
    type: 'CONSERTO' as DemandType,
    otherType: '',
    title: '',
    description: '',
    channel: 'WHATSAPP' as DemandChannel,
    assignedTo: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    expectedDate: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.title) return;


    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const finalData = {
        ...formData,
        status: TaskStatus.OPEN,
        requester: formData.requester === 'OUTRO' ? formData.otherRequester : formData.requester,
        type: formData.type === 'OUTROS' ? formData.otherType : formData.type
      };

      await onSubmit(finalData);
      onClose();
    } catch (err: any) {
      console.error("Erro ao abrir chamado:", err);
      setErrorMsg(err.message || 'Falha ao conectar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000033]/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-[#000080] p-3 rounded-2xl shadow-lg shadow-blue-900/20">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#000080] tracking-tight">Abertura de Chamado</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Preencha os dados do atendimento técnico</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-2xl text-gray-400 transition-all shadow-sm hover:text-red-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Empresa e Setor */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <Building2 className="w-3 h-3" /> Nome - Empresa
              </label>
              <input
                required
                type="text"
                placeholder="Ex: NIDEC - Joinville"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-bold"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Setor Solicitante</label>
              <div className="flex gap-2">
                {['VE', 'VI', 'ADM', 'PJ', 'CLIENTE', ''].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setFormData({ ...formData, sector: sec as DemandSector })}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all border ${formData.sector === sec ? 'bg-[#000080] text-white border-[#000080] shadow-lg shadow-blue-900/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                      }`}
                  >
                    {sec === '' ? 'Vazio' : sec === 'CLIENTE' ? 'CLIENTE' : sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Solicitante */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <User className="w-3 h-3" /> Solicitante
              </label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] outline-none text-sm font-bold appearance-none cursor-pointer"
                value={formData.requester}
                onChange={(e) => setFormData({ ...formData, requester: e.target.value as DemandRequester })}
              >
                {['ALEX BRUNO', 'JOGE ISAKA', 'VANESSA', 'ALBERTO RITER', 'GABRIEL RITER', 'LUCAS RITER', 'OUTRO'].map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {formData.requester === 'OUTRO' && (
                <input
                  type="text"
                  placeholder="Especifique o nome..."
                  className="w-full mt-2 px-5 py-3 bg-white border border-blue-200 rounded-[20px] outline-none text-sm font-bold animate-in slide-in-from-top-2 focus:ring-2 focus:ring-blue-100"
                  value={formData.otherRequester}
                  onChange={(e) => setFormData({ ...formData, otherRequester: e.target.value })}
                />
              )}
            </div>

            {/* Tipo de Demanda */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <Tag className="w-3 h-3" /> Tipo de Demanda
              </label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] outline-none text-sm font-bold appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DemandType })}
              >
                {[
                  { val: 'CONSERTO', label: 'Conserto' },
                  { val: 'TESTE', label: 'Teste' },
                  { val: 'ATENDIMENTO', label: 'Atendimento' },
                  { val: 'VISITA', label: 'Visita' },
                  { val: 'PROJETOS', label: 'Projetos' },
                  { val: 'CONVERSAO', label: 'Conversão' },
                  { val: 'TREINAMENTO', label: 'Treinamento' },
                  { val: 'PARAMETRIZACAO', label: 'Parametrização' },
                  { val: '5S', label: '5s' },
                  { val: 'MELHORIAS', label: 'Melhorias' },
                  { val: 'DESCRICAO_ITENS', label: 'Descrição de itens' },
                  { val: 'OUTROS', label: 'Outros' }
                ].map(type => (
                  <option key={type.val} value={type.val}>{type.label}</option>
                ))}
              </select>
              {formData.type === 'OUTROS' && (
                <div className="relative mt-2 animate-in slide-in-from-top-2">
                  <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Qual é a demanda?"
                    className="w-full pl-11 pr-5 py-3 bg-white border border-blue-200 rounded-[20px] outline-none text-sm font-bold focus:ring-2 focus:ring-blue-100"
                    value={formData.otherType}
                    onChange={(e) => setFormData({ ...formData, otherType: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Titulo e Canal */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Demanda</label>
              <input
                required
                type="text"
                placeholder="Ex: Falha no inversor de frequência motor principal"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-bold"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
              <textarea
                rows={4}
                placeholder="Detalhes da solicitação técnica..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[30px] focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <Send className="w-3 h-3" /> Canal de Solicitação
              </label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] outline-none text-sm font-bold cursor-pointer"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as DemandChannel })}
              >
                {['WHATSAPP', 'BLIP', 'EMAIL', 'WA VE', 'REUNIAO'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <Briefcase className="w-3 h-3" /> Responsável Técnico
              </label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] outline-none text-sm font-bold cursor-pointer"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Selecione um técnico...</option>
                {users
                  .filter(u => u.role === UserRole.ADMIN || u.role === UserRole.CONTRIBUTOR)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
              </select>
            </div>

            {/* Data de Previsão */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <CalendarIcon className="w-3 h-3 text-blue-500" /> Previsão de Fechamento
              </label>
              <input
                type="date"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                value={formData.expectedDate}
                onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100 flex items-start gap-4 text-blue-800">
            <Info className="w-6 h-6 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">A demanda Já será criada com o status de Em Andamento
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 p-6 rounded-[30px] border border-red-100 flex items-start gap-4 text-red-700 animate-in shake duration-500">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 flex items-center justify-end gap-4 bg-gray-50/50">
          <button type="button" onClick={onClose} className="px-8 py-3 text-sm font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-4 bg-[#000080] text-white text-sm font-black rounded-[20px] hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 uppercase tracking-widest flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Processando...
              </>
            ) : 'Abrir Chamado'}
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
};

export default NewDemandModal;
