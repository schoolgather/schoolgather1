import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);

const SIGN_IN_UNAVAILABLE = "Sign-in is not available right now. Please try again later.";

export const getSupabase = () => {
  if (!supabase) throw new Error(SIGN_IN_UNAVAILABLE);
  return supabase;
};

export const signInWithGoogle = async (returnTo = "/") => {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + returnTo },
  });
  if (error) throw error;
};
