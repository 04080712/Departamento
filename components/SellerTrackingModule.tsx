import React, { useState, useMemo } from 'react';
import {
    ClipboardList, Plus, Clock, CheckCircle2, Loader2,
    ChevronRight, Search, Filter, UserCheck, Eye,
    FileDown, Calendar, Mail, MapPin, X, ArrowLeft,
    User as UserIcon, MessageSquare, TestTube, AlertCircle,
    Camera as CameraIcon
} from 'lucide-react';
import { User, UserRole, ServiceRequest, ServiceRequestStatus } from '../types';
import ServiceRequestForm from './ServiceRequestForm';
import ServiceFinalizationForm from './ServiceFinalizationForm';

interface SellerTrackingModuleProps {
    user: User;
    users: User[];
    serviceRequests: ServiceRequest[];
    selectedRequest: ServiceRequest | null;
    onSelectRequest: (request: ServiceRequest | null) => void;
    onCreateRequest: (data: any) => Promise<void>;
    onAcceptRequest: (id: string) => Promise<void>;
    onFinalizeRequest: (id: string, updates?: { technicalActions: string; file: File | null }) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDENTE: {
        label: 'Pendente',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5" />,
    },
    EM_ANDAMENTO: {
        label: 'Em Andamento',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    CONCLUIDA: {
        label: 'Concluída',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    EM_ATRASO: {
        label: 'Em Atraso',
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
};

const SellerTrackingModule: React.FC<SellerTrackingModuleProps> = ({
    user, users, serviceRequests, selectedRequest, onSelectRequest, onCreateRequest, onAcceptRequest, onFinalizeRequest
}) => {
    const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.CONTRIBUTOR;
    const isRegionalAdmin = user.role === UserRole.REGIONAL_ADMIN || user.role === UserRole.REGIONAL_ADMIN_LS;

    const [view, setView] = useState<'CHOICE' | 'CATEGORIES' | 'LIST'>(isStaff ? 'LIST' : 'CHOICE');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [requestToFinalize, setRequestToFinalize] = useState<ServiceRequest | null>(null);

    // Filter requests
    const filteredRequests = useMemo(() => {
        let requests = serviceRequests;
        if (!isStaff && !isRegionalAdmin) {
            requests = requests.filter(r => r.requesterId === user.id);
        } else if (isRegionalAdmin && user.region) {
            requests = requests.filter(r => r.requesterRegion === user.region);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            requests = requests.filter(r =>
                r.title.toLowerCase().includes(term) ||
                r.requesterEmail.toLowerCase().includes(term) ||
                r.description.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'ALL') {
            requests = requests.filter(r => r.status === statusFilter);
        }

        return requests;
    }, [serviceRequests, user, isStaff, isRegionalAdmin, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const relevant = isStaff ? serviceRequests :
            isRegionalAdmin ? serviceRequests.filter(r => r.requesterRegion === user.region) :
                serviceRequests.filter(r => r.requesterId === user.id);

        return {
            total: relevant.length,
            pending: relevant.filter(r => r.status === 'PENDENTE').length,
            inProgress: relevant.filter(r => r.status === 'EM_ANDAMENTO').length,
            overdue: relevant.filter(r => r.status === 'EM_ATRASO').length,
            done: relevant.filter(r => r.status === 'CONCLUIDA').length,
        };
    }, [serviceRequests, user, isStaff, isRegionalAdmin]);

    const getUserName = (userId: string) => {
        const u = users.find(u => u.id === userId);
        return u?.name || 'Não atribuído';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const renderChoice = () => (
        <div className="p-8 animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-black text-[#000080] tracking-tight mb-2">Central de Serviços</h1>
                <p className="text-gray-500 font-medium">Selecione uma opção para continuar</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <button
                    onClick={() => setView('CATEGORIES')}
                    className="group bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-[#000080] transition-all duration-500 text-center flex flex-col items-center gap-6"
                >
                    <div className="bg-blue-50 p-8 rounded-[32px] group-hover:bg-[#000080] transition-colors duration-500">
                        <Plus className="w-12 h-12 text-[#000080] group-hover:text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-[#000080] transition-colors">Solicitar Serviço</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Criar nova requisição</p>
                    </div>
                </button>
                <button
                    onClick={() => setView('LIST')}
                    className="group bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-[#000080] transition-all duration-500 text-center flex flex-col items-center gap-6"
                >
                    <div className="bg-blue-50 p-8 rounded-[32px] group-hover:bg-[#000080] transition-colors duration-500">
                        <Search className="w-12 h-12 text-[#000080] group-hover:text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-[#000080] transition-colors">Consulta de Serviço</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Acompanhar solicitações</p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderCategories = () => (
        <div className="p-8 animate-in fade-in duration-500">
            <button
                onClick={() => setView('CHOICE')}
                className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-[#000080] transition-all mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="text-center mb-12">
                <h1 className="text-3xl font-black text-[#000080] tracking-tight mb-2">Classe de Serviços</h1>
                <p className="text-gray-500 font-medium">Selecione o tipo de serviço que deseja solicitar</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <button
                    onClick={() => {
                        setSelectedCategory('Teste');
                        setShowForm(true);
                    }}
                    className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#000080] transition-all duration-500 text-center flex flex-col items-center gap-4"
                >
                    <div className="bg-amber-50 p-6 rounded-[24px] group-hover:bg-amber-500 transition-colors duration-500">
                        <TestTube className="w-10 h-10 text-amber-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-[#000080] transition-colors">Teste</h3>
                </button>
                {['Assistência', 'Orçamento', 'Outros'].map(cat => (
                    <div key={cat} className="group bg-gray-50/50 p-8 rounded-[32px] border border-dashed border-gray-200 text-center flex flex-col items-center gap-4 opacity-50 cursor-not-allowed">
                        <div className="bg-gray-100 p-6 rounded-[24px]">
                            <ClipboardList className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-300">{cat}</h3>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Em Breve</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDetail = () => {
        const req = selectedRequest!;
        const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDENTE;
        return (
            <div className="p-8 animate-in fade-in duration-300">
                <button
                    onClick={() => onSelectRequest(null)}
                    className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-[#000080] transition-all mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 ${cfg.bg} border ${cfg.color} text-[10px] font-black uppercase tracking-widest rounded-full mb-3`}>
                                {cfg.icon} {cfg.label}
                            </div>
                            <h2 className="text-xl font-black text-[#000080]">{req.title}</h2>
                        </div>
                        <div className="flex gap-2">
                            {req.pdfUrl && (
                                <a
                                    href={req.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#000080] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <FileDown className="w-4 h-4" /> Ver PDF
                                </a>
                            )}
                            {isStaff && req.status === 'PENDENTE' && (
                                <button
                                    onClick={async () => {
                                        await onAcceptRequest(req.id);
                                        onSelectRequest(null);
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 bg-[#000080] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 transition-all shadow-lg"
                                >
                                    <UserCheck className="w-4 h-4" /> Aceitar
                                </button>
                            )}
                            {isStaff && req.status === 'EM_ANDAMENTO' && (
                                <button
                                    onClick={() => setRequestToFinalize(req)}
                                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-lg"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Finalizar
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <UserIcon className="w-3 h-3" /> Solicitante
                                </span>
                                <p className="text-sm font-bold text-gray-800 mt-1">{getUserName(req.requesterId)}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> E-mail
                                </span>
                                <p className="text-sm text-gray-600 mt-1">{req.requesterEmail}</p>
                            </div>
                            {req.requesterRegion && (
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3" /> Região
                                    </span>
                                    <p className="text-sm text-gray-600 mt-1">{req.requesterRegion}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Criado em
                                </span>
                                <p className="text-sm text-gray-600 mt-1">{formatDate(req.createdAt)}</p>
                            </div>
                            {req.acceptedBy && (
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <UserCheck className="w-3 h-3" /> Aceito por
                                    </span>
                                    <p className="text-sm font-bold text-gray-800 mt-1">{getUserName(req.acceptedBy)}</p>
                                </div>
                            )}
                            {/* Amostra Status */}
                            <div className={`p-4 rounded-2xl border ${req.hasSample ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${req.hasSample ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                        <TestTube className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#000080] uppercase tracking-widest">Amostra Física</p>
                                        <p className="text-xs font-bold text-gray-600">
                                            {req.hasSample ? 'Sim - Aguardando no Departamento Técnico' : 'Não se aplica'}
                                        </p>
                                    </div>
                                </div>
                                {req.hasSample && (
                                    <p className="mt-2 text-[10px] font-bold text-amber-700 leading-tight uppercase tracking-wider bg-white/50 p-2 rounded-xl">
                                        a solicitação de teste só será aceita se a amostra estiver no departamento tecnico/
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                    <MessageSquare className="w-3 h-3" /> Descrição
                                </span>
                                <div className="p-5 bg-gray-50 rounded-2xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {req.description}
                                </div>
                            </div>

                            {/* Galeria de Fotos */}
                            {req.photos && req.photos.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                        <CameraIcon className="w-3 h-3" /> Fotos Anexadas
                                    </span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {req.photos.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative"
                                            >
                                                <img src={url} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Ver Foto</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Actions Section */}
                    {(req.finalizationDescription || req.finalReportUrl) && (
                        <div className="p-8 border-t border-gray-100 bg-emerald-50/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-700">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-[#000080] uppercase tracking-wider">Ações Técnicas Realizadas</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                        DESCRIÇÃO TÉCNICA
                                    </span>
                                    <div className="p-6 bg-white border border-gray-100 rounded-3xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                                        {req.finalizationDescription || 'Nenhuma descrição técnica informada.'}
                                    </div>
                                </div>
                                {req.finalReportUrl && (
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                            DOCUMENTO ANEXO
                                        </span>
                                        <a
                                            href={req.finalReportUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-3xl hover:border-emerald-500 hover:shadow-lg transition-all text-center"
                                        >
                                            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all mb-3">
                                                <FileDown className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs font-black text-[#000080] uppercase tracking-wider">Ver Relatório</p>
                                            <p className="text-[10px] text-gray-400 mt-1 font-bold">PDF / PPTX</p>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (selectedRequest) return renderDetail();
    if (!isStaff && view === 'CHOICE') return (
        <>
            {renderChoice()}
            {showForm && (
                <ServiceRequestForm
                    user={user}
                    category={selectedCategory}
                    onSubmit={async (data) => {
                        await onCreateRequest(data);
                        setView('LIST');
                        setShowForm(false);
                    }}
                    onClose={() => setShowForm(false)}
                />
            )}
        </>
    );
    if (!isStaff && view === 'CATEGORIES') return (
        <>
            {renderCategories()}
            {showForm && (
                <ServiceRequestForm
                    user={user}
                    category={selectedCategory}
                    onSubmit={async (data) => {
                        await onCreateRequest(data);
                        setView('LIST');
                        setShowForm(false);
                    }}
                    onClose={() => setShowForm(false)}
                />
            )}
        </>
    );

    return (
        <div className="p-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {!isStaff && (
                        <button
                            onClick={() => setView('CHOICE')}
                            className="p-3 bg-white border border-gray-200 rounded-2xl text-[#000080] hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div className="p-4 bg-gradient-to-br from-[#000080] to-blue-600 rounded-3xl shadow-xl shadow-blue-900/20">
                        <ClipboardList className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#000080] tracking-tight">
                            {isStaff ? 'Gestão de Solicitações' : 'Minhas Solicitações'}
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isStaff ? 'Acompanhe e gerencie solicitações de vendedores' : 'Acompanhe suas solicitações de serviço'}
                        </p>
                    </div>
                </div>
                {!isStaff && (
                    <button
                        onClick={() => setView('CATEGORIES')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#000080] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20"
                    >
                        <Plus className="w-4 h-4" /> Nova Solicitação
                    </button>
                )}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total', value: stats.total, color: 'from-gray-50 to-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-200' },
                    { label: 'Pendentes', value: stats.pending, color: 'from-amber-50 to-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
                    { label: 'Em Andamento', value: stats.inProgress, color: 'from-blue-50 to-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
                    { label: 'Em Atraso', value: stats.overdue, color: 'from-red-50 to-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
                    { label: 'Concluídas', value: stats.done, color: 'from-emerald-50 to-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
                ].map((stat) => (
                    <div key={stat.label} className={`p-5 bg-gradient-to-br ${stat.color} border ${stat.borderColor} rounded-[24px]`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por título, e-mail..."
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1">
                    {['ALL', 'PENDENTE', 'EM_ANDAMENTO', 'EM_ATRASO', 'CONCLUIDA'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === status
                                ? 'bg-white shadow-md text-[#000080]'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : STATUS_CONFIG[status]?.label || status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-100 overflow-hidden shadow-xl">
                {filteredRequests.length === 0 ? (
                    <div className="p-16 text-center">
                        <ClipboardList className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Título</th>
                                {isStaff && <th className="text-left p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Solicitante</th>}
                                <th className="text-left p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="text-left p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                <th className="text-left p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.map((req) => {
                                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDENTE;
                                return (
                                    <tr key={req.id} className="hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => onSelectRequest(req)}>
                                        <td className="p-5">
                                            <p className="text-sm font-bold text-gray-800 truncate max-w-xs">{req.title}</p>
                                        </td>
                                        {isStaff && (
                                            <td className="p-5">
                                                <p className="text-xs font-bold text-gray-600">{getUserName(req.requesterId)}</p>
                                            </td>
                                        )}
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${cfg.bg} border ${cfg.color} text-[10px] font-black uppercase tracking-widest rounded-full`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => onSelectRequest(req)} className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-blue-100 hover:text-[#000080]" title="Ver detalhes">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {isStaff && req.status === 'EM_ANDAMENTO' && (
                                                    <button onClick={() => setRequestToFinalize(req)} className="p-2 bg-emerald-100 rounded-xl text-emerald-700 hover:bg-emerald-200" title="Finalizar">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <ServiceRequestForm
                    user={user}
                    category={selectedCategory}
                    onSubmit={async (data) => {
                        await onCreateRequest(data);
                        setView('LIST');
                        setShowForm(false);
                    }}
                    onClose={() => setShowForm(false)}
                />
            )}

            {requestToFinalize && (
                <ServiceFinalizationForm
                    user={user}
                    onSubmit={async (data) => {
                        await onFinalizeRequest(requestToFinalize.id, data);
                        setRequestToFinalize(null);
                        onSelectRequest(null);
                    }}
                    onClose={() => setRequestToFinalize(null)}
                />
            )}
        </div>
    );
};

export default SellerTrackingModule;
