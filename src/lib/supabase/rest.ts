// A ~30-line PostgREST client over plain fetch.
//
// Supabase's REST API is ordinary HTTP, and the public site only ever does
// three reads and one counter bump — not worth ~40KB of SDK on a portfolio
// that is otherwise tuned for first paint.
//
// Everything here is read-only or the SECURITY DEFINER view counter. Anything
// that needs a session (all of /admin) uses the real SDK instead.
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

const TIMEOUT_MS = 5_000;

function headers(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
  };
}

/** GET a table. `query` is a raw PostgREST query string. Returns null on any failure. */
export async function restSelect<T>(table: string, query: string): Promise<T[] | null> {
  if (!isSupabaseConfigured) return null;

  // An unreachable database must not hang server rendering.
  const abort = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: headers(),
      signal: abort,
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

/** POST to an RPC. Fire-and-forget: the caller never waits on the result. */
export async function restRpc(fn: string, args: Record<string, unknown>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** POST to an RPC and return its JSON result (null on any failure). */
export async function restRpcResult<T>(
  fn: string,
  args: Record<string, unknown>,
): Promise<T | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
