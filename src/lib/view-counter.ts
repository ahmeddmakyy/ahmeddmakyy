// Counts a reel as watched when a visitor actually opens it — not when the
// grid renders, which would just count page views seventeen times over.
//
// Deduped per browser tab session, so scrubbing back and forth in one reel is
// one view. No cookie, no id, no IP: the RPC receives a slug and nothing else.
import { restRpc } from "@/lib/supabase/rest";

const KEY = "maki-counted-reels";

function alreadyCounted(slug: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(slug)) return true;
    window.sessionStorage.setItem(KEY, JSON.stringify([...seen, slug]));
    return false;
  } catch {
    // Private mode, disabled storage, corrupt JSON — count it rather than
    // silently drop the signal. An over-count is better than a blind spot.
    return false;
  }
}

export function countReelView(slug: string | undefined): void {
  if (typeof window === "undefined" || !slug) return;
  if (alreadyCounted(slug)) return;

  // Fire and forget: the counter must never delay opening the reel, and a
  // failed count is not worth surfacing to a visitor.
  void restRpc("increment_reel_view", { p_slug: slug });
}
