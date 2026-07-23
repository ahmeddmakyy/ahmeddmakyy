// Supabase connection details, with no dependency on @supabase/supabase-js —
// so the public bundle can read content and count views without shipping the
// SDK to every visitor. Only /admin imports the real client.
//
// The anon key is public by design: RLS decides what it can see, and writes
// additionally require membership in public.admins.
//
// The literals below are the FALLBACK for builds that don't inject the env
// vars (Lovable/Vercel were building without them, which silently pinned the
// live site to its hardcoded content — dashboard edits never appeared). Env
// vars still win when present, so a future project move is a two-line change.

const FALLBACK_URL = "https://dupimmnebzkvxyjydnyq.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cGltbW5lYnprdnh5anlkbnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTcwNTksImV4cCI6MjEwMDM3MzA1OX0.QubZ2m_KqMv8FYN-hbwY3MgtLg_xBabJXziav_2ssGg";

export const SUPABASE_URL = (
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL
).replace(/\/+$/, "");
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
