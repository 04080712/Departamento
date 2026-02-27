import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

console.log('Inicializando Supabase Client...');
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Variáveis de ambiente do Supabase não encontradas!');
    console.log('Database URL Presente:', !!supabaseUrl);
    console.log('Anon Key Presente:', !!supabaseAnonKey);
} else {
    console.log('Variáveis Supabase carregadas corretamente.');
    console.log('URL:', supabaseUrl);
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
