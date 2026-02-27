import { supabase } from './supabaseClient';
import type { ServiceRequest } from '../types.ts';
import { ServiceRequestStatus } from '../types.ts';

const mapServiceRequest = (row: any): ServiceRequest => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as ServiceRequestStatus,
    requesterId: row.requester_id,
    requesterEmail: row.requester_email,
    requesterRegion: row.requester_region || '',
    acceptedBy: row.accepted_by || '',
    acceptedAt: row.accepted_at || null,
    hasSample: row.has_sample || false,
    photos: row.photos || [],
    pdfUrl: row.pdf_url || null,
    category: row.category || 'Geral',
    finalizationDescription: row.finalization_description || null,
    finalReportUrl: row.final_report_url || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Buscar todas as solicitações de serviço
export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
    const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapServiceRequest);
};

// Buscar solicitação por ID
export const getServiceRequestById = async (id: string): Promise<ServiceRequest> => {
    const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return mapServiceRequest(data);
};

// Criar nova solicitação de serviço
export const createServiceRequest = async (
    request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'acceptedBy'>
): Promise<ServiceRequest> => {
    console.log('[ServiceRequests] Criando nova solicitação...');

    const insertData = {
        title: request.title,
        description: request.description,
        status: request.status || ServiceRequestStatus.PENDENTE,
        requester_id: request.requesterId,
        requester_email: request.requesterEmail,
        requester_region: request.requesterRegion || null,
        has_sample: request.hasSample || false,
        photos: request.photos || [],
        pdf_url: request.pdfUrl || null,
        category: request.category || 'Geral',
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('service_requests')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('[ServiceRequests] Erro ao criar:', error);
        throw new Error(error.message);
    }

    console.log('[ServiceRequests] Solicitação criada:', data.id);
    return mapServiceRequest(data);
};

// Aceitar uma solicitação (Admin/Contributor)
export const acceptServiceRequest = async (id: string, userId: string): Promise<ServiceRequest> => {
    console.log('[ServiceRequests] Aceitando solicitação:', id);

    const { data, error } = await supabase
        .from('service_requests')
        .update({
            status: ServiceRequestStatus.EM_ANDAMENTO,
            accepted_by: userId,
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapServiceRequest(data);
};

// Finalizar uma solicitação
export const finalizeServiceRequest = async (
    id: string,
    updates?: { finalizationDescription?: string; finalReportUrl?: string }
): Promise<ServiceRequest> => {
    console.log('[ServiceRequests] Finalizando solicitação:', id);

    const { data, error } = await supabase
        .from('service_requests')
        .update({
            status: ServiceRequestStatus.CONCLUIDA,
            finalization_description: updates?.finalizationDescription || null,
            final_report_url: updates?.finalReportUrl || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapServiceRequest(data);
};

// Atualizar solicitação genérica
export const updateServiceRequest = async (
    id: string,
    updates: Partial<ServiceRequest>
): Promise<ServiceRequest> => {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.status) updateData.status = updates.status;
    if (updates.acceptedBy) updateData.accepted_by = updates.acceptedBy;
    if (updates.acceptedAt) updateData.accepted_at = updates.acceptedAt;
    if (updates.pdfUrl) updateData.pdf_url = updates.pdfUrl;
    if (updates.finalizationDescription) updateData.finalization_description = updates.finalizationDescription;
    if (updates.finalReportUrl) updateData.final_report_url = updates.finalReportUrl;
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;

    const { data, error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapServiceRequest(data);
};

// Verificar solicitações em atraso (mais de 7 dias em andamento)
export const checkOverdueServiceRequests = async (): Promise<void> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('[ServiceRequests] Verificando demandas em atraso...');

    const { error } = await supabase
        .from('service_requests')
        .update({ status: ServiceRequestStatus.EM_ATRASO })
        .eq('status', ServiceRequestStatus.EM_ANDAMENTO)
        .lt('accepted_at', sevenDaysAgo.toISOString());

    if (error) {
        console.error('[ServiceRequests] Erro ao verificar atrasos:', error);
    }
};
