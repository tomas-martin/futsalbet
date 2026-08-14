import { createClient } from '@supabase/supabase-js';

const meta: any = import.meta;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will not work until these are provided.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
