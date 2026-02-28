import React, { useState, useMemo } from 'react';
import { TechnicalDemand, TaskStatus, User as UserType, ServiceRequest, UserRole } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Clock, CheckCircle2, LayoutDashboard, Users, XCircle, Filter, X, Info, Calendar as CalendarIcon, Tag, Plus, AlertTriangle, CalendarClock } from 'lucide-react';
import CalendarModule from './CalendarModule.tsx';

interface DashboardProps {
  demands: TechnicalDemand[];
  serviceRequests: ServiceRequest[];
  users: UserType[];
  onAddDemand?: () => void;
  onViewDemand?: (demand: TechnicalDemand) => void;
}

type FilterType = {
  type: 'status' | 'collaborator' | 'all' | 'open' | 'closed';
  value: string | TaskStatus;
  label: string;
};

// ==========================================
// SUB-COMPONENTES INTERNOS
// ==========================================

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, value, icon: Icon, color, bg, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 md:p-6 rounded-[16px] md:rounded-[24px] border transition-all text-left group ${isActive
      ? 'border-[#000080] bg-white ring-2 ring-[#000080]/10'
      : 'border-gray-200 bg-white hover:shadow-md shadow-sm'
      }`}
  >
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
      <div>
        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 line-clamp-1">{label}</p>
        <h3 className="text-xl md:text-3xl font-black text-gray-950">{value}</h3>
      </div>
      <div className={`${bg} p-2 md:p-3 rounded-xl w-fit group-hover:scale-110 transition-transform`}>
        <Icon className={`w-4 h-4 md:w-6 md:h-6 ${color}`} />
      </div>
    </div>
  </button>
);

const StatusChart: React.FC<{
  data: any[];
  onClick: (data: any) => void;
}> = ({ data, onClick }) => (
  <div className="p-4 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-xs md:text-lg font-black text-gray-950 mb-4 md:mb-8 uppercase tracking-tight text-left">Status dos Chamados</h3>
    <div className="h-[200px] md:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 8, fontWeight: 'bold' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 8 }} />
          <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} onClick={onClick} className="cursor-pointer">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const TechnicianLoad: React.FC<{
  data: any[];
  colors: string[];
  onClick: (data: any) => void;
}> = ({ data, colors, onClick }) => (
  <div className="p-4 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-xs md:text-lg font-black text-gray-950 mb-4 md:mb-8 uppercase tracking-tight text-left">Carga por Técnico</h3>
    <div className="flex flex-col xl:flex-row lg:flex-col xl:items-center gap-4 md:gap-8 h-fit lg:h-full">
      <div className="w-full h-[150px] md:h-[220px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={150} minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={5}
              dataKey="value"
              onClick={onClick}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 w-full space-y-1 md:space-y-2 overflow-y-auto max-h-[150px] pr-1 md:pr-2 custom-scrollbar">
        {data.map((collab, index) => (
          <div key={index} className="flex items-center justify-between p-1.5 md:p-2.5 hover:bg-gray-50 rounded-lg md:rounded-xl transition-colors">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={collab.avatar} className="w-8 h-8 md:w-12 md:h-12 rounded-lg object-cover shadow-sm" alt="" />
              <span className="text-[10px] md:text-xs font-bold text-gray-700 truncate max-w-[60px] md:max-w-none">{collab.fullName}</span>
            </div>
            <span className="text-[10px] md:text-xs font-black text-[#000080] bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg">{collab.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DemandTable: React.FC<{
  demands: TechnicalDemand[];
  users: UserType[];
  activeFilter: FilterType | null;
  selectedDate: Date | null;
  onViewDemand: (demand: TechnicalDemand) => void;
}> = ({ demands, users, activeFilter, selectedDate, onViewDemand }) => (
  <div className="p-8 rounded-[40px] border border-gray-200 bg-white shadow-xl overflow-hidden">
    <div className="flex items-center justify-between mb-8">
      <p className="text-[10px] font-bold text-gray-400 uppercase">Prioridade: Em Atraso → Do Dia → Em Aberto</p>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">Código / Cliente</th>
            <th className="pb-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável</th>
            <th className="pb-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Entrada</th>
            <th className="pb-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Prioridade</th>
            <th className="pb-6 text-right pr-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {demands.length > 0 ? (
            demands.map((demand) => {
              const assignedUser = users.find(u => u.id === demand.assignedTo);
              const isHighPriority = demand.status === TaskStatus.OPEN; // Simplificação para o exemplo

              return (
                <tr key={demand.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-6 pl-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-[#000080] group-hover:bg-white transition-colors text-[10px]">
                        {demand.code}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{demand.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{demand.company}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    {assignedUser ? (
                      <div className="flex items-center gap-3">
                        {assignedUser.avatar ? (
                          <img src={assignedUser.avatar} className="w-8 h-8 rounded-xl object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[10px] font-black text-[#000080]">
                            {assignedUser.name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-gray-700">{assignedUser.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase italic">Não atribuído</span>
                    )}
                  </td>
                  <td className="py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#000080]" />
                        <span className="text-[11px] font-bold text-gray-600">
                          {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {demand.expectedDate && (
                        <div className="flex items-center gap-2 bg-blue-50 w-fit px-1.5 py-0.5 rounded-md border border-blue-100">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Prev: {new Date(demand.expectedDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${demand.status === TaskStatus.CLOSED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {demand.status === TaskStatus.CLOSED ? 'Concluído' : 'Em Aberto'}
                      </div>
                      {isHighPriority && (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <AlertTriangle className="w-3.5 h-3.5 fill-rose-50" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Urgente</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 text-right pr-4">
                    <button
                      onClick={() => onViewDemand(demand)}
                      className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-[#000080] hover:shadow-lg transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="py-20 text-center">
                <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                  <Clock className="w-12 h-12 text-gray-300" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Nenhum chamado encontrado</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const TaskDetailModal: React.FC<{
  demand: TechnicalDemand | null;
  onClose: () => void;
}> = ({ demand, onClose }) => {
  if (!demand) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-[#000080] text-[10px]">
              {demand.code}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-950 tracking-tight uppercase">{demand.title}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{demand.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-950 transition-all active:scale-95 shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Atual</p>
              <div className={`w-fit px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${demand.status === TaskStatus.CLOSED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                {demand.status === TaskStatus.CLOSED ? 'Concluído' : 'Em Aberto'}
              </div>
            </div>
            <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#000080]" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Criado em</p>
                  <p className="text-sm font-bold text-gray-950">{new Date(demand.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição da Demanda</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {demand.description || "Nenhuma descrição detalhada fornecida para esta demanda."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-gray-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-950/20"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ demands, serviceRequests, users, onAddDemand, onViewDemand }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [selectedDemandDetail, setSelectedDemandDetail] = useState<TechnicalDemand | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const stats = useMemo(() => {
    const now = new Date();

    // Demandas em atraso (> 48h)
    const demandOverdueCount = demands.filter(d => {
      if (d.status !== TaskStatus.OPEN) return false;
      const hoursOpen = (now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursOpen >= 48;
    }).length;

    // Solicitações em atraso (Status explícito ou > 7 dias)
    const serviceOverdueCount = serviceRequests.filter(s =>
      s.status === 'EM_ATRASO'
    ).length;

    // Solicitações pendentes (novo card)
    const pendingCount = serviceRequests.filter(s => s.status === 'PENDENTE').length;

    return {
      total: demands.length + pendingCount,
      open: demands.filter(d => d.status === TaskStatus.OPEN).length,
      closed: demands.filter(d => d.status === TaskStatus.CLOSED).length,
      overdue: demandOverdueCount + serviceOverdueCount,
      pending: pendingCount
    };
  }, [demands, serviceRequests]);

  const statusChartData = [
    { name: 'Pendentes de Aceite', value: stats.pending, status: 'PENDING', color: '#f59e0b' },
    { name: 'Em Execução', value: stats.open - (stats.overdue - serviceRequests.filter(s => s.status === 'EM_ATRASO').length), status: TaskStatus.OPEN, color: '#000080' },
    { name: 'Em Atraso', value: stats.overdue, status: 'OVERDUE', color: '#ef4444' },
    { name: 'Finalizadas', value: stats.closed, status: TaskStatus.CLOSED, color: '#10b981' },
  ];

  const collaboratorData = useMemo(() => users
    .filter(u => u.role === UserRole.ADMIN || u.role === UserRole.CONTRIBUTOR)
    .map(user => {
      const count = demands.filter(d => d.assignedTo === user.id).length;
      return {
        id: user.id,
        name: user.name.split(' ')[0],
        fullName: user.name,
        value: count,
        avatar: user.avatar
      };
    }).filter(item => item.value > 0), [demands, users]);

  const COLORS = ['#000080', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const cards = [
    { id: 'pending', label: 'OS Pendentes', value: stats.pending, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50', filter: null },
    { id: 'open', label: 'Demandas em Aberto', value: stats.open, icon: Clock, color: 'text-[#000080]', bg: 'bg-blue-50', filter: { type: 'status', value: TaskStatus.OPEN, label: 'Visualizando em Aberto' } },
    { id: 'overdue', label: 'Total em Atraso', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', filter: { type: 'status', value: TaskStatus.OPEN, label: 'Visualizando em Atraso' } },
    { id: 'closed', label: 'Finalizadas', value: stats.closed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', filter: { type: 'status', value: TaskStatus.CLOSED, label: 'Visualizando Fechadas' } },
  ];

  // Classificar demanda em grupo de prioridade: 0 = Em Atraso (>48h), 1 = Do Dia, 2 = Em Aberto genérica
  const getDemandPriorityGroup = (demand: TechnicalDemand): number => {
    if (demand.status !== TaskStatus.OPEN) return 2;
    const now = new Date();
    const createdDate = new Date(demand.createdAt);
    const hoursOpen = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    if (hoursOpen >= 48) return 0; // Em Atraso (mais de 48h)
    return 1; // Dentro do prazo
  };

  const getDemandBadge = (demand: TechnicalDemand): { label: string; className: string; icon: typeof AlertTriangle } => {
    const group = getDemandPriorityGroup(demand);
    if (demand.status === TaskStatus.CLOSED) {
      return { label: 'Fechada', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 };
    }
    if (group === 0) {
      return { label: 'Em Atraso', className: 'bg-red-50 text-red-600 border-red-100 animate-pulse', icon: AlertTriangle };
    }
    if (group === 1) {
      return { label: 'Do Dia', className: 'bg-amber-50 text-amber-700 border-amber-100', icon: CalendarClock };
    }
    return { label: 'Em Aberto', className: 'bg-blue-50 text-[#000080] border-blue-100', icon: Clock };
  };

  const filteredDemands = useMemo(() => {
    let baseList = [...demands];

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      baseList = baseList.filter(d => {
        const dateToUse = d.expectedDate ? d.expectedDate : d.createdAt;
        return dateToUse.split('T')[0] === dateStr;
      });
    }

    if (activeFilter) {
      if (activeFilter.type === 'status') {
        baseList = baseList.filter(d => d.status === activeFilter.value);
      } else if (activeFilter.type === 'collaborator') {
        baseList = baseList.filter(d => d.assignedTo === activeFilter.value);
      }
    } else if (!selectedDate) {
      // Por padrão, mostrar as abertas no dashboard (se não houver filtro de data)
      baseList = baseList.filter(d => d.status === TaskStatus.OPEN);
    }

    // Ordenação por prioridade: Em Atraso > Do Dia > Em Aberto, depois FIFO dentro de cada grupo
    return baseList.sort((a, b) => {
      const groupA = getDemandPriorityGroup(a);
      const groupB = getDemandPriorityGroup(b);
      if (groupA !== groupB) return groupA - groupB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [demands, activeFilter, selectedDate]);

  const toggleFilter = (newFilter: FilterType) => {
    if (activeFilter && activeFilter.type === newFilter.type && activeFilter.value === newFilter.value && activeFilter.label === newFilter.label) {
      setActiveFilter(null);
    } else {
      setActiveFilter(newFilter);
    }
  };

  const handleChartClick = (data: any, type: 'status' | 'collab') => {
    if (!data) return;
    let filter: FilterType;
    if (type === 'status') {
      if (data.status === 'PENDING') return; // Não há filtro para pendentes na lista de demandas
      filter = {
        type: 'status',
        value: data.status === 'OVERDUE' ? TaskStatus.OPEN : data.status,
        label: `Fila: ${data.name}`
      };
    } else {
      filter = {
        type: 'collaborator',
        value: data.id,
        label: `Técnico: ${data.fullName}`
      };
    }
    toggleFilter(filter);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 items-start">
        <div>
          <h2 className="text-2xl font-black text-[#000080]">Controle Operacional</h2>
          <p className="text-[#000080] text-sm opacity-80 font-medium text-left">Monitoramento simplificado de atividades.</p>
        </div>

        <div className="flex items-center gap-4">
          {selectedDate && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl animate-in slide-in-from-right-4">
              <span className="text-sm font-bold text-amber-700">Data: {selectedDate.toLocaleDateString('pt-BR')}</span>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 hover:bg-amber-100 rounded-lg text-amber-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          {activeFilter && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl animate-in slide-in-from-right-4">
              <span className="text-sm font-bold text-[#000080]">{activeFilter.label}</span>
              <button
                onClick={() => setActiveFilter(null)}
                className="p-1 hover:bg-blue-100 rounded-lg text-[#000080]"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {cards.map((card, i) => (
          <StatCard
            key={i}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            isActive={activeFilter?.value === card.filter?.value}
            onClick={() => card.filter && toggleFilter(card.filter as FilterType)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart
          data={statusChartData}
          onClick={(data) => handleChartClick(data, 'status')}
        />

        <TechnicianLoad
          data={collaboratorData}
          colors={COLORS}
          onClick={(data) => handleChartClick(data, 'collab')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <DemandTable
            demands={filteredDemands}
            users={users}
            activeFilter={activeFilter}
            selectedDate={selectedDate}
            onViewDemand={(demand) => onViewDemand ? onViewDemand(demand) : setSelectedDemandDetail(demand)}
          />
        </div>

        <div className="lg:col-span-1">
          <CalendarModule
            demands={demands}
            serviceRequests={serviceRequests}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>
      </div>

      <TaskDetailModal
        demand={selectedDemandDetail}
        onClose={() => setSelectedDemandDetail(null)}
      />
    </div>
  );
};

export default Dashboard;
