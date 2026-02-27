import { supabase } from './supabaseClient';
import type { AppNotification } from '../types.ts';

const mapNotification = (row: any): AppNotification => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message || '',
    serviceRequestId: row.service_request_id || '',
    targetRole: row.target_role || '',
    targetUserId: row.target_user_id || '',
    readBy: row.read_by || [],
    createdAt: row.created_at,
});

// Buscar todas as notificações
export const getNotifications = async (): Promise<AppNotification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);
    return (data || []).map(mapNotification);
};

// Criar notificação
export const createNotification = async (
    notification: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>
): Promise<AppNotification> => {
    const insertData = {
        type: notification.type || 'SERVICE_REQUEST',
        title: notification.title,
        message: notification.message || null,
        service_request_id: notification.serviceRequestId || null,
        target_role: notification.targetRole || null,
        target_user_id: notification.targetUserId || null,
        read_by: [],
    };

    const { data, error } = await supabase
        .from('notifications')
        .insert(insertData)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapNotification(data);
};

// Marcar notificação como lida
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<void> => {
    // Primeiro buscar read_by atual
    const { data: current, error: fetchError } = await supabase
        .from('notifications')
        .select('read_by')
        .eq('id', notificationId)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const currentReadBy = current?.read_by || [];
    if (currentReadBy.includes(userId)) return; // Já lida

    const { error } = await supabase
        .from('notifications')
        .update({ read_by: [...currentReadBy, userId] })
        .eq('id', notificationId);

    if (error) throw new Error(error.message);
};

// Remover notificações relacionadas a uma solicitação (quando aceita)
export const deleteNotificationsByServiceRequestId = async (serviceRequestId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('service_request_id', serviceRequestId);

    if (error) throw new Error(error.message);
};
