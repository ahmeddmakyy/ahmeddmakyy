// Visitor analytics beacon — plain fetch through rest.ts, no SDK (the public
// bundle stays lean; see rest.ts). Writes go through SECURITY DEFINER RPCs:
//  - record_visit: once per browser session (sessionStorage dedupe)
//  - heartbeat: every 30s while the tab is visible → powers "live now"
// The dashboard is the only reader. Never throws; analytics must never be
// able to break the site.
import { restRpc } from "./supabase/rest";

const BEAT_MS = 30_000;
let started = false;

export function startBeacon(country: string | null): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  try {
    const p_country = country || null;

    if (!sessionStorage.getItem("mk-visited")) {
      sessionStorage.setItem("mk-visited", "1");
      void restRpc("record_visit", { p_country });
    }

    let sid = sessionStorage.getItem("mk-sid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("mk-sid", sid);
    }

    const beat = () => {
      if (document.visibilityState === "visible") {
        void restRpc("heartbeat", { p_sid: sid, p_country });
      }
    };
    beat();
    window.setInterval(beat, BEAT_MS);
    // An immediate beat when the user comes back keeps "live now" honest.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") beat();
    });
  } catch {
    /* storage blocked (private mode etc.) — skip analytics silently */
  }
}
