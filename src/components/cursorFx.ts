/* cursorFx — a tiny shared, persisted toggle for the CURSOR effects only:
 *   • the media liquid water surface (LiquidMedia)
 *   • the frame-wrap "portal" fire   (FireFrame)
 *
 * (The site-wide click-fire burst was removed per request; the toggle now calms
 * just these two.) When "reduced", they don't mount — nothing else on the site
 * changes (the hero particle field, morph/stacking animations, scroll reveals,
 * marquee, spotlight loupe, etc. all stay). This is the switch behind the hero's
 * little "calm the cursor" button; the preference persists in localStorage.
 *
 * It's a minimal external store consumed via useSyncExternalStore so the two
 * gate components re-render (mount/unmount their WebGL) the instant it flips. */
import { useSyncExternalStore } from "react";

const KEY = "reelswithmaki:cursor-fx-reduced";

let reduced = false;
let hydrated = false;
const listeners = new Set<() => void>();

// Read the stored preference once, lazily, on the client. SSR stays `false`.
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    reduced = window.localStorage.getItem(KEY) === "1";
  } catch {
    /* storage blocked (private mode) — default to effects on */
  }
}

export function getCursorFxReduced(): boolean {
  ensureHydrated();
  return reduced;
}

export function setCursorFxReduced(next: boolean) {
  ensureHydrated();
  if (next === reduced) return;
  reduced = next;
  try {
    window.localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function toggleCursorFxReduced() {
  setCursorFxReduced(!getCursorFxReduced());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Live boolean: true = the cursor effects should stay OFF. */
export function useCursorFxReduced(): boolean {
  return useSyncExternalStore(subscribe, getCursorFxReduced, () => false);
}
