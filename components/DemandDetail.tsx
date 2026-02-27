
import React, { useState, useRef } from 'react';
import { TechnicalDemand, TaskStatus, TechnicalFile, User as UserType, UserRole } from '../types.ts';

import {
  ArrowLeft, Download, FileText, Trash2, Calendar,
  User, Sparkles, Loader2, CheckCircle2, Save,
  AlertCircle, ShieldAlert, FileSearch, Building2, Tag, FileCheck, AlertTriangle
} from 'lucide-react';
import { generateTechnicalSummary } from '../services/geminiService';
import html2canvas from 'html2canvas';

interface DemandDetailProps {
  demand: TechnicalDemand;
  onBack: () => void;
  onUpdate: (updated: TechnicalDemand) => Promise<void>;
  onAutoSaveFile?: (file: File, folder: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  users: UserType[];
  userRole: UserRole;
}

const DemandDetail: React.FC<DemandDetailProps> = ({
  demand,
  onBack,
  onUpdate,
  onAutoSaveFile,
  onDelete,
  users,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'technical' | 'report'>('info');
  const [aiSummary, setAiSummary] = useState(demand.technicalDetails || '');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDelete = async () => {
    if (!onDelete) return;
    if (window.confirm('TEM CERTEZA? Esta demanda será EXCLUÍDA PERMANENTEMENTE do sistema e não poderá ser recuperada.')) {
      try {
        setIsDeleting(true);
        await onDelete(demand.id);
        onBack();
      } catch (err) {
        setIsDeleting(false);
        // O erro já é alertado no App.tsx
      }
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const summary = await generateTechnicalSummary(demand);
    setAiSummary(summary || '');
    setIsGenerating(false);
    setHasChanges(true);
    setShowError(false);
  };

  const handleSave = () => {
    onUpdate({ ...demand, technicalDetails: aiSummary });
    setHasChanges(false);
    setShowError(false);
  };

  const generateReportImage = async (): Promise<string> => {
    if (!reportRef.current) return '';
    console.log('[DemandDetail] Iniciando captura do laudo com html2canvas...');
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true, // Habilitar logs para depuração
        onclone: (clonedDoc: Document) => {
          // Higienização de estilos para evitar travamentos do html2canvas com cores modernas
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const tag = styleTags[i];
            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
              tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, '#666');
              tag.innerHTML = tag.innerHTML.replace(/oklab\([^)]+\)/g, '#666');
            }
          }
          console.log("[DemandDetail] Estilos higienizados no clone do laudo.");
        }
      });
      console.log('[DemandDetail] Canvas gerado com sucesso.');
      return canvas.toDataURL("image/png");
    } catch (err) {
      console.error("[DemandDetail] Erro no html2canvas:", err);
      return '';
    }
  };

  const handleExportPDF = async () => {
    if (demand.status !== TaskStatus.CLOSED) {
      alert("A demanda precisa estar FECHADA para exportar o laudo oficial.");
      return;
    }

    setIsExporting(true);
    try {
      const dataUrl = await generateReportImage();
      const link = document.createElement('a');
      link.href = dataUrl;

      // Nome customizado conforme pedido: Parecer Tecnico Demanda: {TITULO}
      const safeTitle = demand.title.replace(/[\\/:*?"<>|]/g, '_');
      link.download = `Parecer Tecnico Demanda: ${safeTitle}.png`;

      link.click();
    } catch (err) {
      console.error("Erro ao exportar:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const finalizeDemand = async () => {
    if (!aiSummary.trim() && !demand.technicalDetails) {
      setShowError(true);
      return;
    }

    setIsFinishing(true);
    console.log('--- [INÍCIO DO PROCESSO DE FECHAMENTO] ---');

    try {
      // 1. Gera o laudo visual com timeout de segurança (20 segundos)
      console.log('[Step 1/4] Iniciando renderização do laudo (html2canvas)...');

      const imagePromise = generateReportImage();
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("A renderização do laudo técnico travou. Isso pode ocorrer se o texto for muito longo ou houver erro de memória no navegador.")), 20000)
      );

      const dataUrl = await Promise.race([imagePromise, timeoutPromise]);

      if (!dataUrl) {
        console.error('[ERRO] generateReportImage retornou vazio.');
        throw new Error("A imagem do laudo não pôde ser processada. Tente salvar como rascunho primeiro.");
      }
      console.log('[Step 1/4] Sucesso: Imagem do laudo gerada.');

      // 2. Prepara o objeto atualizado
      const updatedDemand: TechnicalDemand = {
        ...demand,
        status: TaskStatus.CLOSED,
        technicalDetails: aiSummary || demand.technicalDetails,
        updatedAt: new Date().toISOString()
      };

      // 3. Salva na Central de Arquivos
      if (onAutoSaveFile) {
        console.log('[Step 2/4] Iniciando arquivamento na nuvem...');
        try {
          const arr = dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const safeTitleForFile = demand.title.replace(/[\\/:*?"<>|]/g, '_');
          const customFileName = `Parecer Tecnico Demanda: ${safeTitleForFile}.png`;
          const file = new File([blob], customFileName, { type: 'image/png' });

          console.log(`[Step 2/4] Arquivo preparado (${(file.size / 1024).toFixed(2)} KB). Enviando...`);
          await onAutoSaveFile(file, "Pareceres_Tecnicos");
          console.log('[Step 2/4] Sucesso: Arquivo salvo na Central.');
        } catch (uploadErr: any) {
          console.error('[ERRO] Falha no upload do laudo:', uploadErr);
          // Não paramos o fechamento por erro de upload, apenas avisamos
          alert("Aviso: O laudo visual não pôde ser salvo na Central (Timeout ou Rede), mas o fechamento da demanda continuará.");
        }
      } else {
        console.warn('[Warning] onAutoSaveFile não fornecido.');
      }

      // 4. Notifica o pai e aguarda a persistência
      console.log('[Step 3/4] Atualizando status da demanda no banco de dados...');
      await onUpdate(updatedDemand);
      console.log('[Step 3/4] Sucesso: Status atualizado no Postgres.');

      setHasChanges(false);
      setJustFinished(true);
      console.log('--- [FIM DO PROCESSO DE FECHAMENTO: SUCESSO] ---');

      setTimeout(() => setJustFinished(false), 5000);

    } catch (err: any) {
      console.error("--- [FALHA CRÍTICA NO FECHAMENTO] ---");
      console.error(err);
      alert(err.message || "Falha desconhecida ao fechar demanda.");
    } finally {
      setIsFinishing(false);
    }
  };

  const reopenDemand = () => {
    onUpdate({ ...demand, status: TaskStatus.OPEN });
    setJustFinished(false);
  };

  const technician = users.find(u => u.id === demand.assignedTo);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      {/* Template Invisível para o PDF e Arquivamento */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={reportRef}
          className="w-[800px] bg-white p-12 text-gray-900 font-sans"
          style={{ minHeight: '1131px' }}
        >
          <div className="flex justify-between items-start border-b-4 border-[#000080] pb-8 mb-8">
            <img
              src="/logosite.png"
              alt="Logo"
              className="h-16"
            />
            <div className="text-right">
              <h1 className="text-2xl font-black text-[#000080] uppercase">Laudo de Atendimento Técnico</h1>
              <p className="text-sm font-bold text-gray-400 mt-1">ID: {demand.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Empresa / Cliente</p>
              <p className="text-sm font-black text-gray-900 uppercase">{demand.company}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Setor Requisitante</p>
              <p className="text-sm font-black text-gray-900">{demand.sector || 'NÃO INFORMADO'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Técnico Responsável</p>
              <p className="text-sm font-black text-gray-900">{technician?.name || 'CONSULTOR TÉCNICO'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data de Criação</p>
              <p className="text-sm font-black text-gray-900">{new Date(demand.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xs font-black text-[#000080] uppercase tracking-widest mb-4 border-l-4 border-[#000080] pl-3">Descrição da Solicitação</h2>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl text-sm leading-relaxed text-gray-700 italic">
              "{demand.description}"
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xs font-black text-[#000080] uppercase tracking-widest mb-4 border-l-4 border-[#000080] pl-3">Parecer Técnico Final</h2>
            <div className="p-8 bg-blue-50/30 border border-blue-100 rounded-3xl text-sm leading-loose text-gray-900 whitespace-pre-wrap font-medium">
              {aiSummary || demand.technicalDetails || 'Sem parecer registrado.'}
            </div>
          </div>

          <div className="mt-auto pt-20 flex flex-col items-center text-center">
            <div className="w-64 border-t-2 border-gray-300 mb-2"></div>
            <p className="text-sm font-black text-gray-900">{technician?.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Departamento de Engenharia • Similar</p>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-800 hover:text-[#000080] transition-colors group mb-4 font-bold"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar para Fila
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-black text-[#000080]">{demand.id}</span>
            {(() => {
              const hoursOpen = (new Date().getTime() - new Date(demand.createdAt).getTime()) / (1000 * 60 * 60);
              const isOverdue = demand.status === TaskStatus.OPEN && hoursOpen >= 48;
              return (
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest flex items-center gap-1.5 ${demand.status === TaskStatus.CLOSED
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : isOverdue
                    ? 'bg-red-100 text-red-600 border-red-200 animate-pulse'
                    : 'bg-blue-100 text-[#000080] border-blue-200'
                  }`}>
                  {demand.status === TaskStatus.CLOSED
                    ? 'Fechada'
                    : isOverdue
                      ? <><AlertTriangle className="w-3 h-3" /> Em Atraso</>
                      : 'Em Aberto'}
                </span>
              );
            })()}
          </div>
          <h2 className="text-3xl font-black text-gray-950 mb-2">{demand.title}</h2>
          <div className="flex gap-4 mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-tight flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {demand.company}
            </span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-tight flex items-center gap-1">
              <Tag className="w-3 h-3" /> {demand.sector || 'Vazio'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {justFinished && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-in slide-in-from-right-2">
              <CheckCircle2 className="w-4 h-4" /> Laudo Pronto!
            </div>
          )}
          <button
            disabled={demand.status !== TaskStatus.CLOSED || isExporting}
            onClick={handleExportPDF}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all text-sm uppercase tracking-widest active:scale-95 ${demand.status === TaskStatus.CLOSED
              ? 'bg-[#000080] text-white hover:bg-blue-900 shadow-xl shadow-blue-900/20'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              }`}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Processando...' : 'Exportar PDF'}
          </button>

          {userRole === UserRole.ADMIN && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Excluir Demanda"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm mb-6">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Descrição da Solicitação</h4>
        <p className="text-gray-800 text-lg leading-relaxed">{demand.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white p-8 rounded-[32px] border transition-all shadow-sm relative overflow-hidden ${showError ? 'border-red-500 ring-4 ring-red-50' : 'border-blue-50'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <FileSearch className="w-5 h-5 text-[#000080]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">Parecer Técnico <span className="text-red-500">*</span></h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Obrigatório para concluir o serviço</p>
                </div>
              </div>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || demand.status === TaskStatus.CLOSED}
                className="text-[10px] font-black text-white bg-[#000080] px-5 py-3 rounded-xl hover:bg-blue-900 transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-blue-900/20 disabled:opacity-50 active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {demand.technicalDetails ? 'Refinar com Gemini' : 'Gerar com AI'}
              </button>
            </div>

            <div className="relative">
              <textarea
                disabled={demand.status === TaskStatus.CLOSED}
                className={`w-full h-80 p-8 bg-gray-50 rounded-[28px] border outline-none text-sm text-gray-800 leading-loose resize-none transition-all font-medium ${demand.status === TaskStatus.CLOSED ? 'cursor-not-allowed opacity-80 border-gray-200' : 'focus:ring-4 focus:ring-blue-50 focus:bg-white border-dashed focus:border-solid border-gray-100'
                  }`}
                placeholder="Insira aqui os procedimentos realizados, diagnóstico e recomendações..."
                value={aiSummary}
                onChange={(e) => { setAiSummary(e.target.value); setHasChanges(true); }}
              />
              {(isGenerating || isFinishing) && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[28px] flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#000080] animate-spin" />
                    <p className="text-xs font-black text-[#000080] uppercase tracking-widest animate-pulse">
                      {isFinishing ? 'Gerando Laudo Oficial...' : 'Engenharia Digital Processando...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {showError && (
              <div className="mt-4 flex items-center gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl animate-in shake duration-300">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Atenção: O parecer é requisito para o arquivamento.</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-bold max-w-xs leading-relaxed">
                {demand.status === TaskStatus.CLOSED
                  ? 'Este parecer foi convertido em documento oficial e está disponível na Central de Arquivos.'
                  : 'O texto abaixo será formatado em um documento técnico oficial ao finalizar.'}
              </p>
              {demand.status === TaskStatus.OPEN && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isFinishing}
                  className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${hasChanges && !isFinishing
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  Salvar Rascunho
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Governança</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#000080]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registro</p>
                  <p className="text-sm font-bold text-gray-950">{new Date(demand.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Técnico</p>
                  <p className="text-sm font-bold text-gray-950">
                    {technician?.name || 'Consultor'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={demand.status === TaskStatus.OPEN ? finalizeDemand : reopenDemand}
            disabled={isFinishing}
            className={`w-full p-8 rounded-[32px] shadow-xl transition-all flex flex-col items-center justify-center gap-2 font-black uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50 ${demand.status === TaskStatus.OPEN
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20 ring-4 ring-emerald-50'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20'
              }`}
          >
            {isFinishing ? <Loader2 className="w-8 h-8 animate-spin" /> : (demand.status === TaskStatus.OPEN ? <FileCheck className="w-8 h-8" /> : <ArrowLeft className="w-8 h-8" />)}
            <span>
              {isFinishing
                ? 'Processando...'
                : (demand.status === TaskStatus.OPEN ? 'Concluir Atendimento' : 'Reabrir para Ajustes')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemandDetail;
