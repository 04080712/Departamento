

import React, { useState, useMemo } from 'react';
import { TechnicalDemand, TaskStatus, User as UserType, UserRole } from '../types';
import { Search, Plus, Filter, Building2, User, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DemandsListProps {
  demands: TechnicalDemand[];
  users: UserType[];
  currentUser: UserType;
  onAddDemand: () => void;
  onViewDemand: (demand: TechnicalDemand) => void;
}

const DemandsList: React.FC<DemandsListProps> = ({ demands, users, currentUser, onAddDemand, onViewDemand }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');

  // Todos começam vendo 'ALL' (todas as demandas) por padrão, conforme solicitado
  const [assignedToFilter, setAssignedToFilter] = useState<string>('ALL');

  const processedDemands = useMemo(() => {
    let list = [...demands];

    if (searchTerm) {
      list = list.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeFilter === 'OPEN') {
      list = list.filter(d => d.status === TaskStatus.OPEN);
    } else if (activeFilter === 'CLOSED') {
      list = list.filter(d => d.status === TaskStatus.CLOSED);
    }

    if (assignedToFilter !== 'ALL') {
      list = list.filter(d => d.assignedTo === assignedToFilter);
    }

    return list.sort((a, b) => {
      const aIsOpen = a.status === TaskStatus.OPEN;
      const bIsOpen = b.status === TaskStatus.OPEN;

      if (aIsOpen && !bIsOpen) return -1;
      if (!aIsOpen && bIsOpen) return 1;

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [demands, searchTerm, activeFilter, assignedToFilter]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 items-start">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-[#000080]">Fila de Atendimento</h2>
            <p className="text-[#000080] text-sm opacity-80 font-medium">Controle binário de chamados técnicos.</p>
          </div>

          <button
            onClick={onAddDemand}
            className="bg-[#000080] text-white px-8 py-4 rounded-[20px] font-black flex items-center gap-2 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 text-sm uppercase tracking-widest h-fit"
          >
            <Plus className="w-5 h-5" />
            Nova Demanda
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#000080] text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-transparent focus-within:bg-white focus-within:border-[#000080] transition-all">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="bg-transparent w-full py-3 text-sm font-bold text-gray-700 outline-none cursor-pointer"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
          >
            <option value="OPEN">Chamados em Aberto</option>
            <option value="CLOSED">Demandas Fechadas</option>
            <option value="ALL">Todas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-transparent focus-within:bg-white focus-within:border-[#000080] transition-all">
          <User className="w-4 h-4 text-gray-400" />
          <select
            className="bg-transparent w-full py-3 text-sm font-bold text-gray-700 outline-none cursor-pointer"
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
          >
            <option value="ALL">Responsável Técnico</option>
            {users
              .filter(u => u.role === UserRole.ADMIN || u.role === UserRole.CONTRIBUTOR)
              .map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </select>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
          <span className="text-xs font-black text-[#000080] uppercase tracking-widest">{processedDemands.length} Itens</span>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-200 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Fila</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Solicitação / Empresa</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Setor</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Responsável</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Abertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedDemands.map((demand, index) => {
                const assigned = users.find(u => u.id === demand.assignedTo);
                const isClosed = demand.status === TaskStatus.CLOSED;
                const hoursOpen = (new Date().getTime() - new Date(demand.createdAt).getTime()) / (1000 * 60 * 60);
                const isOverdue = !isClosed && hoursOpen >= 48;

                return (
                  <tr
                    key={demand.id}
                    onClick={() => onViewDemand(demand)}
                    className={`group transition-all cursor-pointer hover:bg-blue-50/30 ${isClosed ? 'bg-gray-50/50 opacity-60' : ''} ${isOverdue ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${isClosed ? 'bg-gray-200 text-gray-400' : isOverdue ? 'bg-red-600 text-white' : 'bg-[#000080] text-white'
                        }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-950 group-hover:text-[#000080] transition-colors">{demand.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{demand.company}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${demand.sector ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-gray-50 text-gray-300 border-dashed border-gray-100'
                        }`}>
                        {demand.sector || 'Vazio'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {assigned ? (
                          <>
                            <img src={assigned.avatar} className="w-8 h-8 rounded-xl object-cover border border-gray-100" alt="" />
                            <span className="text-xs font-bold text-gray-700">{assigned.name.split(' ')[0]}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-400">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 italic">Pendente</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest flex items-center gap-2 w-fit ${isClosed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : isOverdue
                          ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                          : 'bg-blue-50 text-[#000080] border-blue-100'
                        }`}>
                        {isClosed ? <CheckCircle2 className="w-3 h-3" /> : isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isClosed ? 'Fechada' : isOverdue ? 'Em Atraso' : 'Em Aberto'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-xs font-black text-gray-400">
                        {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {processedDemands.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">Nenhum chamado encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandsList;
