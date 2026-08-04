import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = (supabaseToken: string | null) => {
  const options = supabaseToken
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseToken}`,
          },
        },
      }
    : undefined;
  return createClient(supabaseUrl, supabaseAnonKey, options);
};

