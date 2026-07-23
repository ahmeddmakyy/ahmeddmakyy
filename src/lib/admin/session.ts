// Admin session state.
//
// Signing in is not the same as being an admin: the account also has to be in
// public.admins. That check is a real query against a table whose RLS only
// returns your own row — so it cannot be faked from the client. Even if it
// could, every write policy re-checks membership server-side.
import { useCallback, useEffect, useState } from "react";
import { browserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type SessionStatus =
  | "loading" // still resolving the stored session
  | "unconfigured" // env vars missing
  | "anon" // not signed in
  | "not-admin" // signed in, but not in public.admins
  | "ready";

export function useAdminSession() {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    const sb = browserClient();
    if (!sb) {
      setStatus(isSupabaseConfigured ? "loading" : "unconfigured");
      return;
    }

    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setEmail(null);
      setStatus("anon");
      return;
    }

    setEmail(user.email ?? null);

    const { data, error } = await sb.from("admins").select("user_id").limit(1);
    setStatus(!error && data && data.length > 0 ? "ready" : "not-admin");
  }, []);

  useEffect(() => {
    void resolve();

    const sb = browserClient();
    if (!sb) return;

    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void resolve();
    });
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  const signIn = useCallback(async (mail: string, password: string) => {
    const sb = browserClient();
    if (!sb) throw new Error("Supabase is not configured.");

    const { error } = await sb.auth.signInWithPassword({ email: mail, password });
    if (error) {
      // Supabase returns the same message for a wrong password and an unknown
      // account, deliberately. Don't dress it up as something more specific.
      throw new Error(
        error.message === "Invalid login credentials" ? "Wrong email or password." : error.message,
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    await browserClient()?.auth.signOut();
  }, []);

  return { status, email, signIn, signOut, refresh: resolve };
}
