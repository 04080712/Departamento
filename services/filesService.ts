import { supabase } from './supabaseClient';
import type { TechnicalFile } from '../types.ts';


const BUCKET = 'technical-files';

// Helper para normalizar caminhos (remover acentos e espaços)
const sanitizePath = (path: string): string => {
    return path
        .normalize('NFD') // Decompõe caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
        .replace(/\s+/g, '_') // Substitui espaços por underscores
        .replace(/[^\w\-\.]/g, ''); // Remove qualquer outro caractere especial (exceto letras, números, _, -, .)
};

// Mapear row do banco para TechnicalFile
const mapFile = (row: any): TechnicalFile => ({
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    url: row.url,
    folder: row.folder,
    uploadDate: row.upload_date,
});

// Buscar todos os arquivos (filtrado por RLS automaticamente)
export const getFiles = async (): Promise<TechnicalFile[]> => {
    const { data, error } = await supabase
        .from('technical_files')
        .select('*')
        .order('upload_date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapFile);
};

// Upload de arquivo para o Supabase Storage + registro no banco (Com timeout de 30s)
export const uploadFile = async (
    file: File,
    folder: string,
    userId: string,
    demandId?: string
): Promise<TechnicalFile> => {
    const runUpload = async () => {
        // Gerar caminho único no storage
        const fileExt = file.name.split('.').pop();
        const cleanFileName = sanitizePath(file.name.replace(`.${fileExt}`, ''));
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const sanitizedFolder = sanitizePath(folder);
        const storagePath = `${userId}/${sanitizedFolder}/${uniqueFileName}`;

        console.log(`[UploadService] Preparando upload: Original[${file.name}] -> StoragePath[${storagePath}]`);
        console.log(`[UploadService] Iniciando upload: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        const uploadViaNativeFetch = async () => {
            console.log('[UploadService] [Nativo] Iniciando upload via Fetch nativo...');
            const url = `${(supabase as any).supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`;
            const key = (supabase as any).supabaseKey;

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || key;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': key,
                    'Content-Type': file.type || 'application/octet-stream',
                    'x-upsert': 'false'
                },
                body: file
            });

            const result = await response.json();
            if (!response.ok) {
                console.error('[UploadService] [Nativo] ERRO NO SERVIDOR:', result);
                throw new Error(result.error || result.message || 'Erro desconhecido no servidor');
            }
            return result;
        };

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                });

            if (uploadError) {
                console.warn('[UploadService] Cliente Supabase falhou, tentando Fetch nativo...', uploadError.message);
                await uploadViaNativeFetch();
            }
        } catch (err: any) {
            console.warn('[UploadService] Exceção no cliente Supabase, tentando Fetch nativo...', err.message);
            await uploadViaNativeFetch();
        }

        console.log('[UploadService] Upload finalizado no Storage. Gerando URL...');

        const { data: urlData } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

        const fileUrl = urlData?.signedUrl || '';

        console.log('[UploadService] Registrando metadados no Postgres...');
        const { data, error: dbError } = await supabase
            .from('technical_files')
            .insert({
                name: file.name,
                type: file.type,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                url: fileUrl,
                storage_path: storagePath,
                folder,
                uploaded_by: userId,
                demand_id: demandId || null,
            })
            .select()
            .single();

        if (dbError) {
            await supabase.storage.from(BUCKET).remove([storagePath]);
            throw new Error(`Arquivo enviado, mas erro ao registrar no banco: ${dbError.message}`);
        }

        console.log('[UploadService] Registro concluído com sucesso.');
        return mapFile(data);
    };

    const timeout = (ms: number) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`O upload do arquivo '${file.name}' excedeu o tempo limite de ${ms / 1000}s.`)), ms)
    );

    try {
        return await Promise.race([runUpload(), timeout(30000)]) as TechnicalFile;
    } catch (err: any) {
        console.error('[UploadService] Falha crítica no uploadFile:', err.message);
        throw err;
    }
};

// Deletar arquivo do banco e do storage
export const deleteFile = async (fileId: string): Promise<void> => {
    // 1. Buscar o storage_path antes de deletar
    const { data: fileData, error: fetchError } = await supabase
        .from('technical_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    // 2. Deletar do banco
    const { error: dbError } = await supabase
        .from('technical_files')
        .delete()
        .eq('id', fileId);

    if (dbError) throw new Error(dbError.message);

    // 3. Deletar do storage
    if (fileData?.storage_path) {
        await supabase.storage.from(BUCKET).remove([fileData.storage_path]);
    }
};

// Gerar URL assinada para download
export const getSignedUrl = async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 3600); // 1 hora

    if (error) throw new Error(error.message);
    return data.signedUrl;
};
