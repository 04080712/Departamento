import { supabase } from './supabaseClient';
import type { User } from '../types.ts';
import { UserRole } from '../types.ts';

const mapUser = (row: any): User => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    avatar: row.avatar || `https://picsum.photos/seed/${row.name}/200`,
    password_plain: row.password_plain,
    region: row.region || undefined,
});

// Buscar todos os usuários (ADMIN vê todos via RLS)
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

    if (error) throw new Error(error.message);
    return (data || []).map(mapUser);
};

// Criar usuário no Supabase Auth + inserir perfil na tabela users
// Usa a Admin API via Edge Function para criar usuários sem fazer logout
export const createUser = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    region?: string
): Promise<User> => {
    // Obter o token da sessão atual para autorizar a chamada da Edge Function
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('[usersService] Erro ao obter sessão:', sessionError);
        throw new Error(`Erro de autenticação: ${sessionError.message}`);
    }

    const token = session?.access_token;

    if (!token) {
        console.error('[usersService] Sessão não encontrada ao tentar criar usuário.');
        throw new Error('Sessão expirada ou não encontrada. Por favor, faça login novamente.');
    }

    console.log('[usersService] Chamando create-user com token presente.');

    // Chamar a Edge Function que usa a service_role key para criar usuário
    const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, name, role, region },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (error) {
        console.error('[usersService] Erro na resposta da Edge Function:', error);

        // Tenta extrair a mensagem de erro da resposta se disponível
        let errorMessage = error.message || 'Erro ao chamar função de criação de usuário.';

        // Adicionar detalhes se for um erro de rede ou status
        if ((error as any).status) {
            errorMessage += ` (Status: ${(error as any).status})`;
        }

        // Caso a resposta venha com um corpo de erro mas o fetch falhe formalmente
        if ((error as any).context?.message) {
            errorMessage += ` - ${(error as any).context.message}`;
        }

        throw new Error(errorMessage);
    }

    if (data?.error) {
        console.error('[usersService] Erro retornado pela lógica da função:', data.error);
        throw new Error(data.error);
    }

    console.log('[usersService] Usuário criado com sucesso:', data.user.id);
    return mapUser(data.user);
};

// Atualizar perfil do usuário
export const updateUserProfile = async (
    id: string,
    updates: Partial<Pick<User, 'name' | 'avatar'>>
): Promise<void> => {
    // Filtrar chaves undefined para não enviá-las ao banco
    const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase
        .from('users')
        .update(cleanUpdates)
        .eq('id', id);

    if (error) throw new Error(error.message);
};

// Buscar restrições de pasta de um usuário
export const getFolderRestrictions = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('folder_restrictions')
        .select('folder')
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return (data || []).map((r) => r.folder);
};

// Buscar todas as restrições (para o ADMIN ver tudo de uma vez)
export const getAllFolderRestrictions = async (): Promise<Record<string, string[]>> => {
    const { data, error } = await supabase
        .from('folder_restrictions')
        .select('user_id, folder');

    if (error) throw new Error(error.message);

    const result: Record<string, string[]> = {};
    (data || []).forEach((r) => {
        if (!result[r.user_id]) result[r.user_id] = [];
        result[r.user_id].push(r.folder);
    });
    return result;
};

// Adicionar ou remover restrição de pasta (toggle)
export const toggleFolderRestriction = async (
    userId: string,
    folder: string,
    currentRestrictions: string[]
): Promise<void> => {
    const isRestricted = currentRestrictions.includes(folder);

    if (isRestricted) {
        // Remover restrição
        const { error } = await supabase
            .from('folder_restrictions')
            .delete()
            .eq('user_id', userId)
            .eq('folder', folder);
        if (error) throw new Error(error.message);
    } else {
        // Adicionar restrição
        const { error } = await supabase
            .from('folder_restrictions')
            .insert({ user_id: userId, folder });
        if (error) throw new Error(error.message);
    }
};
