import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = (supabaseToken: string | null) => {
  if (!supabaseToken || !supabaseToken.trim()) {
    return supabase;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseToken}`,
      },
    },
  });
};

