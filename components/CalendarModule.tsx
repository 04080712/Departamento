import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Info } from 'lucide-react';
import { TechnicalDemand, ServiceRequest } from '../types';

interface CalendarModuleProps {
    demands: TechnicalDemand[];
    serviceRequests: ServiceRequest[];
    selectedDate: Date | null;
    onDateSelect: (date: Date | null) => void;
}

const CalendarModule: React.FC<CalendarModuleProps> = ({
    demands,
    serviceRequests,
    selectedDate,
    onDateSelect
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // Preencher dias vazios antes do início do mês
        const startPadding = firstDay.getDay();
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Dias do mês
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentMonth]);

    const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const getEventsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];

        const dayDemands = demands.filter(d =>
            new Date(d.createdAt).toISOString().split('T')[0] === dateStr
        );

        const dayRequests = serviceRequests.filter(s =>
            new Date(s.createdAt).toISOString().split('T')[0] === dateStr
        );

        return { demands: dayDemands, requests: dayRequests };
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        if (!selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[32px] border border-white/40 shadow-xl shadow-blue-900/5 transition-all hover:shadow-2xl hover:shadow-blue-900/10 group/cal overflow-hidden relative">
            {/* Decoração de fundo sutil */}
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl group-hover/cal:bg-blue-100/50 transition-colors duration-700" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#000080] rounded-2xl shadow-lg shadow-blue-900/20">
                            <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-950 uppercase tracking-tighter capitalize">{monthName}</h3>
                            <p className="text-[10px] font-bold text-gray-400">Escala de Atividades</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                        <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-[#000080] transition-all active:scale-90">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                onDateSelect(null);
                                setCurrentMonth(new Date());
                            }}
                            className="text-[9px] font-black uppercase text-gray-400 hover:text-[#000080] tracking-widest px-3 transition-colors"
                        >
                            Hoje
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-[#000080] transition-all active:scale-90">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest text-center py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;

                        const { demands: dCount, requests: rCount } = getEventsForDay(date);
                        const hasEvents = dCount.length > 0 || rCount.length > 0;
                        const today = isToday(date);
                        const selected = isSelected(date);

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => onDateSelect(selected ? null : date)}
                                className={`group/day relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 ${selected
                                    ? 'bg-[#000080] text-white shadow-2xl shadow-blue-900/40 scale-110 z-20'
                                    : today
                                        ? 'bg-blue-50 text-[#000080] border border-blue-100'
                                        : 'hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 text-gray-600'
                                    }`}
                            >
                                <span className={`text-xs font-black mb-0.5 ${selected ? 'text-white' : today ? 'text-[#000080]' : 'text-gray-950'}`}>
                                    {date.getDate()}
                                </span>

                                {hasEvents && !selected && (
                                    <div className="flex gap-1">
                                        {dCount.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#000080] shadow-sm" />}
                                        {rCount.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />}
                                    </div>
                                )}

                                {selected && (
                                    <div className="absolute bottom-2 w-1 h-1 bg-white/50 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#000080] shadow-sm" />
                            <span className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-tighter">Demandas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                            <span className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-tighter">Serviços</span>
                        </div>
                    </div>

                    {selectedDate ? (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 animate-in zoom-in-95">
                            <Clock className="w-3.5 h-3.5 text-[#000080]" />
                            <span className="text-[10px] font-black text-[#000080] uppercase tracking-tighter">
                                {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 opacity-30">
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Clique em um dia</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarModule;
