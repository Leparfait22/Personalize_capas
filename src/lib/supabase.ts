import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey;

export const isSupabaseConfigured = () => {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
};

// 🔒 Cliente Servidor (Service Role) para consultas no banco — NUNCA chamar signInWithPassword/signUp nele!
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// 🔑 Cria um cliente isolado e descartável apenas para autenticar (signInWithPassword / signUp) sem contaminar o header do Service Role
export const createSupabaseAuthClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
