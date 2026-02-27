import { supabase } from './supabaseClient';
import type { User } from '../types.ts';
import { UserRole } from '../types.ts';

// Login com email e senha
export const signIn = async (email: string, password: string): Promise<User> => {
    console.log('[AuthService] Iniciando tentativa de login para:', email);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('[AuthService] Falha na autenticação Supabase Auth:', error.message);
        throw new Error(error.message);
    }

    if (!data.user) {
        console.error('[AuthService] Login ok, mas data.user está nulo.');
        throw new Error('Usuário não retornado pelo servidor.');
    }

    console.log('[AuthService] Login bem-sucedido. Buscando perfil:', data.user.id);

    // Buscar perfil completo na tabela users
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) {
        console.error('[AuthService] Erro ao buscar perfil na tabela public.users:', profileError.message);
        throw new Error('Seu login foi validado, mas seu perfil de sistema não foi encontrado.');
    }

    if (!profile) {
        console.error('[AuthService] Perfil não encontrado para o ID:', data.user.id);
        throw new Error('Perfil de usuário inexistente no banco de dados.');
    }

    console.log('[AuthService] Perfil carregado com sucesso:', profile.name);

    return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatar: profile.avatar || `https://picsum.photos/seed/${profile.name}/200`,
        password_plain: (profile as any).password_plain,
        region: (profile as any).region || undefined,
    };
};

// Logout
export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

// Recuperar sessão ativa e perfil do usuário
export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (!profile) return null;

    return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatar: profile.avatar || `https://picsum.photos/seed/${profile.name}/200`,
        password_plain: (profile as any).password_plain,
        region: (profile as any).region || undefined,
    };
};

// Listener de mudança de estado de autenticação
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                callback({
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: profile.role as UserRole,
                    avatar: profile.avatar || `https://picsum.photos/seed/${profile.name}/200`,
                    password_plain: (profile as any).password_plain,
                    region: (profile as any).region || undefined,
                });
            }
        } else {
            callback(null);
        }
    });
};

// Helper para timeout
const timeout = (ms: number) => new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tempo limite de resposta excedido (Timeout). Verifique sua conexão.')), ms)
);

// Atualizar senha do usuário logado via Edge Function (evita hangs do cliente)
export const updatePassword = async (newPassword: string): Promise<void> => {
    console.log('[AuthService] Iniciando atualização de senha via Edge Function...');

    const runInvoke = async () => {
        // Obter token e dados do usuário antes da atualização
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!user || !token) {
            console.error('[AuthService] Usuário ou Token não encontrado.');
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        console.log('[AuthService] Usuário:', user.email, '. Invocando função...');

        const { data, error } = await supabase.functions.invoke('update-user-password', {
            body: { password: newPassword },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (error) {
            console.error('[AuthService] Erro na invocação da Edge Function:', error);
            throw new Error(`Falha na comunicação com o servidor: ${error.message}`);
        }

        if (data?.error) {
            console.error('[AuthService] Erro retornado pela função:', data.error);
            throw new Error(data.error);
        }

        console.log('[AuthService] Senha alterada com sucesso. Renovando sessão local...');

        // RE-AUTENTICAÇÃO SILENCIOSA: O JWT antigo foi invalidado. 
        // Precisamos de um novo para que as próximas chamadas funcionem sem logout involuntário.
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: newPassword
        });

        if (loginError) {
            console.error('[AuthService] Erro ao renovar sessão:', loginError.message);
            // Se falhar a re-autenticação, o usuário terá que logar manualmente, 
            // mas a senha JÁ FOI alterada no banco.
            throw new Error('Senha alterada, mas sua sessão expirou. Por favor, entre novamente com a nova senha.');
        }

        console.log('[AuthService] Sessão renovada com sucesso.');
    };

    try {
        await Promise.race([runInvoke(), timeout(20000)]);
    } catch (err: any) {
        console.error('[AuthService] Erro crítico no updatePassword:', err);
        throw err;
    }
};

// Atualizar perfil do usuário
export const updateUserProfile = async (id: string, updates: any): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

    if (error) throw new Error(error.message);
};
