import { createClient, SupabaseClient } from '@supabase/supabase-js';

const meta: any = import.meta;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will not work until these are provided.');
}

// Only create the client when both env vars exist. createClient('') throws at
// import time and would crash the whole app, so fall back to null otherwise.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
