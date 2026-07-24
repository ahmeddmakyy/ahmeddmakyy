// Visitor analytics beacon — plain fetch through rest.ts, no SDK (the public
// bundle stays lean; see rest.ts). Writes go through SECURITY DEFINER RPCs:
//  - record_visit: once per browser session, now with device/browser/returning
//    (parsed locally from the UA — nothing identifying leaves the browser).
//    Returns the visit id so heartbeats can keep the session duration fresh.
//  - heartbeat: every 30s while visible → "live now" + duration.
//  - record_event: contact clicks & CV downloads, detected by href — no
//    per-component wiring needed.
// The dashboard is the only reader. Never throws; analytics must never be
// able to break the site.
import { restRpc, restRpcResult } from "./supabase/rest";

const BEAT_MS = 30_000;
let started = false;

function deviceOf(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function browserOf(ua: string): string {
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("SamsungBrowser")) return "Samsung";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/")) return "Safari";
  return "Other";
}

function eventKindOf(href: string): string | null {
  const h = href.toLowerCase();
  if (h.includes("wa.me") || h.includes("whatsapp")) return "whatsapp";
  if (h.startsWith("mailto:")) return "email";
  if (h.startsWith("tel:")) return "phone";
  if (h.endsWith(".pdf") || h.includes("cv")) return "cv_download";
  if (h.includes("instagram.com")) return "instagram";
  if (h.includes("tiktok.com")) return "tiktok";
  if (h.includes("linkedin.com")) return "linkedin";
  if (h.includes("facebook.com")) return "facebook";
  return null;
}

export function startBeacon(country: string | null): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  try {
    const p_country = country || null;
    const ua = navigator.userAgent;

    // Session-scoped visit; device-scoped "returning" flag.
    let visitId: number | null = Number(sessionStorage.getItem("mk-vid")) || null;
    if (!sessionStorage.getItem("mk-visited")) {
      sessionStorage.setItem("mk-visited", "1");
      const isReturn = Boolean(localStorage.getItem("mk-seen"));
      localStorage.setItem("mk-seen", "1");
      void restRpcResult<number>("record_visit", {
        p_country,
        p_device: deviceOf(ua),
        p_browser: browserOf(ua),
        p_return: isReturn,
      }).then((id) => {
        if (typeof id === "number") {
          visitId = id;
          sessionStorage.setItem("mk-vid", String(id));
        }
      });
    }

    let sid = sessionStorage.getItem("mk-sid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("mk-sid", sid);
    }

    const beat = () => {
      if (document.visibilityState === "visible") {
        void restRpc("heartbeat", { p_sid: sid, p_country, p_visit_id: visitId });
      }
    };
    beat();
    window.setInterval(beat, BEAT_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") beat();
    });

    // Contact / download clicks — detected from the link itself.
    document.addEventListener(
      "click",
      (e) => {
        const a = (e.target as Element | null)?.closest?.("a[href]");
        const kind = a ? eventKindOf(a.getAttribute("href") ?? "") : null;
        if (kind) void restRpc("record_event", { p_kind: kind });
      },
      { capture: true, passive: true },
    );
  } catch {
    /* storage blocked (private mode etc.) — skip analytics silently */
  }
}
