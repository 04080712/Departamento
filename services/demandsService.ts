import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import type { TechnicalDemand, TechnicalFile } from '../types.ts';
import { TaskStatus, UserRole } from '../types.ts';

// Mapear row do banco para o tipo TechnicalDemand do frontend
const mapDemand = (row: any): TechnicalDemand => ({
    id: row.id,
    code: row.code || '',
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority,
    company: row.company,
    sector: row.sector,
    requester: row.requester,
    type: row.type,
    channel: row.channel,
    assignedTo: row.assigned_to || '',
    createdBy: row.created_by || '',
    technicalDetails: row.technical_details || '',
    expectedDate: row.expected_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    files: row.technical_files?.map((f: any): TechnicalFile => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.url,
        folder: f.folder,
        uploadDate: f.upload_date,
    })) || [],
});

// Buscar todas as demandas (Versão Otimizada: apenas dados da lista)
export const getDemands = async (): Promise<TechnicalDemand[]> => {
    const { data, error } = await supabase
        .from('technical_demands')
        .select(`
id,
    code,
    title,
    status,
    priority,
    company,
    sector,
    assigned_to,
    created_by,
    expected_date,
    created_at,
    updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(200); // Limite de segurança para performance

    if (error) throw new Error(error.message);

    // Mapeamento parcial (files será vazio inicialmente)
    return (data || []).map(row => mapDemand({
        ...row,
        technical_files: [] // Não carregamos arquivos na lista principal
    }));
};

// Buscar detalhes completos de uma única demanda (Deep Fetch)
export const getDemandById = async (id: string): Promise<TechnicalDemand> => {
    const { data, error } = await supabase
        .from('technical_demands')
        .select(`
    *,
    technical_files(*)
        `)
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return mapDemand(data);
};

// Criar nova demanda com timeout de segurança
export const createDemand = async (
    demand: Omit<TechnicalDemand, 'id' | 'createdAt' | 'updatedAt' | 'files'>,
    userId: string
): Promise<TechnicalDemand> => {
    console.log('[createDemand] Iniciando inserção...', { ...demand, created_by: userId });

    const insertData = {
        title: demand.title,
        description: demand.description,
        status: demand.status,
        priority: demand.priority,
        company: demand.company,
        sector: (demand.sector && (demand.sector as string).trim() !== '') ? demand.sector : null,
        requester: demand.requester,
        type: demand.type,
        channel: demand.channel,
        assigned_to: (demand.assignedTo && demand.assignedTo !== '') ? demand.assignedTo : null,
        created_by: userId,
        expected_date: demand.expectedDate || null,
        technical_details: (demand.technicalDetails && demand.technicalDetails !== '') ? demand.technicalDetails : null,
    };

    console.log('[createDemand] Chamando Supabase.insert com:', {
        userId,
        fields: Object.keys(insertData),
        timestamp: new Date().toISOString()
    });

    const runInsert = async () => {
        console.log('[createDemand] Iniciando inserção. Descrição len:', insertData.description?.length || 0);

        try {
            console.log('[createDemand] Tentativa 1: Supabase Client...');
            const { data, error } = await supabase
                .from('technical_demands')
                .insert(insertData)
                .select()
                .single();

            if (!error) return data;
            console.warn('[createDemand] Falha no Supabase Client, tentando Native Fetch...', error);
        } catch (e) {
            console.warn('[createDemand] Exceção no Supabase Client, tentando Native Fetch...', e);
        }

        console.log('[createDemand] Tentativa 2: Native Fetch (Bypass Library)...');
        const supabaseUrl = (supabase as any).supabaseUrl;
        const supabaseKey = (supabase as any).supabaseKey;
        const session = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl} /rest/v1 / technical_demands`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${session.data.session?.access_token} `,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(insertData)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error(Fetch): ${response.status} - ${errText} `);
        }

        const result = await response.json();
        return Array.isArray(result) ? result[0] : result;
    };

    const timeout = (ms: number) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`O servidor não respondeu à criação da demanda em ${ms / 1000} s.Verifique sua conexão.`)), ms)
    );

    try {
        console.log('[createDemand] Aguardando resposta do Supabase (Timeout 15s)...');
        const data = await Promise.race([runInsert(), timeout(15000)]) as any;

        if (!data) {
            throw new Error('O servidor retornou sucesso, mas os dados da demanda não foram recebidos (data null).');
        }

        console.log('[createDemand] SUCESSO! ID Gerado:', data.id);
        return mapDemand(data);
    } catch (err: any) {
        console.error('[createDemand] FALHA CRÍTICA:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint,
            fullError: err
        });
        throw err;
    }
};

// Atualizar demanda existente com timeout de 20s
export const updateDemand = async (
    id: string,
    updates: Partial<TechnicalDemand>
): Promise<TechnicalDemand> => {
    console.log(`[DemandsService] Solicitando atualização da demanda ${id}...`);

    const runUpdate = async () => {
        const { data, error } = await supabase
            .from('technical_demands')
            .update({
                title: updates.title,
                description: updates.description,
                status: updates.status,
                priority: updates.priority,
                company: updates.company,
                sector: (updates.sector && (updates.sector as string).trim() !== '') ? updates.sector : null,
                requester: updates.requester,
                type: updates.type,
                channel: updates.channel,
                assigned_to: (updates.assignedTo && updates.assignedTo !== '') ? updates.assignedTo : null,
                expected_date: updates.expectedDate,
                technical_details: (updates.technicalDetails && updates.technicalDetails !== '') ? updates.technicalDetails : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`*, technical_files(*)`)
            .single();

        if (error) {
            console.error('[DemandsService] Erro no update do banco:', error);
            throw new Error(error.message);
        }
        return mapDemand(data);
    };

    const timeout = (ms: number) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`O servidor não respondeu à atualização da demanda em ${ms / 1000} s.`)), ms)
    );

    try {
        return await Promise.race([runUpdate(), timeout(20000)]) as TechnicalDemand;
    } catch (err: any) {
        console.error('[DemandsService] Falha no updateDemand:', err.message);
        throw err;
    }
};
// Deletar uma demanda com timeout de 30s para resiliência de rede
export const deleteDemand = async (id: string): Promise<void> => {
    const deletePromise = supabase
        .from('technical_demands')
        .delete()
        .eq('id', id);

    const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: O servidor não respondeu à solicitação de exclusão em 30s.")), 30000)
    );

    const { error } = await Promise.race([deletePromise, timeoutPromise]) as any;
    if (error) throw new Error(error.message);
};
