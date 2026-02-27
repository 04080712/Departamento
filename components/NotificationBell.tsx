import React, { useState, useMemo } from 'react';
import {
    Bell, Check, Clock, CheckCircle2, X, UserCheck,
    ChevronRight, AlertCircle
} from 'lucide-react';
import { AppNotification, User, UserRole } from '../types';

interface NotificationBellProps {
    notifications: AppNotification[];
    user: User;
    users: User[];
    onMarkAsRead: (notificationId: string) => void;
    onAcceptRequest: (serviceRequestId: string) => void;
    onViewRequest: (serviceRequestId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
    notifications, user, users, onMarkAsRead, onAcceptRequest, onViewRequest
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            // Notificações destinadas a cargos específicos
            if (n.targetRole && n.targetRole === user.role) return true;
            // Notificações destinadas ao usuário específico
            if (n.targetUserId && n.targetUserId === user.id) return true;
            // Se não tiver targetRole nem targetUserId, é global (opcional conforme lógica do App.tsx)
            return !n.targetRole && !n.targetUserId;
        });
    }, [notifications, user]);

    const unreadCount = useMemo(() => {
        return filteredNotifications.filter(n => !n.readBy.includes(user.id)).length;
    }, [filteredNotifications, user.id]);

    const sortedNotifications = useMemo(() => {
        return [...filteredNotifications].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 20);
    }, [filteredNotifications]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}min`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    };

    const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.CONTRIBUTOR;

    const handleNotificationClick = (notif: AppNotification) => {
        const isRead = notif.readBy.includes(user.id);
        if (!isRead) onMarkAsRead(notif.id);

        if (notif.type === 'SERVICE_REQUEST' && notif.serviceRequestId) {
            onViewRequest(notif.serviceRequestId);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-white border rounded-2xl text-gray-500 hover:text-[#000080] hover:bg-blue-50 transition-all"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-96 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-[90] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-sm font-black text-[#000080] uppercase tracking-widest flex items-center gap-2">
                                <Bell className="w-4 h-4" /> Notificações
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white rounded-xl text-gray-400 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                            {sortedNotifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Nenhuma notificação
                                    </p>
                                </div>
                            ) : (
                                sortedNotifications.map(notif => {
                                    const isRead = notif.readBy.includes(user.id);
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`p-4 hover:bg-blue-50/50 transition-all cursor-pointer ${!isRead ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-xl flex-shrink-0 ${!isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <AlertCircle className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-xs font-bold truncate ${!isRead ? 'text-gray-900' : 'text-gray-500'}`}>
                                                            {notif.title}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">
                                                            {formatTime(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    {notif.message && (
                                                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                                    )}
                                                    {isStaff && notif.serviceRequestId && notif.type === 'SERVICE_REQUEST' && !notif.targetUserId && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleNotificationClick(notif);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000080] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-900 transition-all shadow-md"
                                                            >
                                                                <ChevronRight className="w-3 h-3" /> Visualizar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {!isRead && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
