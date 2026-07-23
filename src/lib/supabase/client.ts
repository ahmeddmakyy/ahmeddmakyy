// The full Supabase SDK — session handling and storage uploads.
//
// Imported ONLY from /admin routes, which are code-split, so visitors to the
// portfolio never download it. The public site reads content through
// ./rest.ts instead.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

let singleton: SupabaseClient | null = null;

/** Browser-only. Returns null during SSR or when env vars are missing. */
export function browserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;

  singleton ??= createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "maki-admin-auth",
    },
  });
  return singleton;
}

export { isSupabaseConfigured };
