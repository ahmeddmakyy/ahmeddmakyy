import { useEffect, useRef, useState } from "react";
import type { AuroraController } from "./AuroraCursor.webgl";
import { useCursorFxReduced } from "./cursorFx";

/* AuroraCursor — the SSR-safe gate + lazy loader for the site-wide CLICK FIRE
 * (the mouse liquid moved off the browser onto media; see LiquidMedia). Mirrors
 * the HeroField gate pattern: every window/document/canvas touch is inside an
 * effect, the heavy WebGL lives in a separate module that is only dynamically
 * imported once ALL of these hard gates pass, and the component renders null on
 * the server (and on any device that doesn't qualify):
 *
 *   • prefers-reduced-motion: reduce  → never mounts (live 'change' listener
 *     tears it down / brings it back).
 *   • pointer: fine && !coarse        → never mounts on touch/mobile. A cursor
 *     effect is dead content without a cursor, and NOT mounting on mobile means
 *     NO second WebGL context there — protecting the hero field from context
 *     eviction under memory pressure.
 *   • WebGL2 probe                    → bail if unavailable (before the import).
 *   • the shared "calm the cursor" toggle → tears down live when the user asks
 *     for less motion (fire + liquid + frame-wrap all silence together). */
export default function AuroraCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mount, setMount] = useState(false);
  // The hero's "calm the cursor" button flips this; when true the effect never
  // mounts (and tears down live if it was on).
  const reduced = useCursorFxReduced();

  // ── gate decision (client only; re-evaluated when reduced-motion / the user
  //    toggle changes) ──
  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqFine = window.matchMedia("(pointer: fine)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");

    const probeWebGL2 = () => {
      try {
        const c = document.createElement("canvas");
        const probe = c.getContext("webgl2");
        if (!probe) return false;
        probe.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
      } catch {
        return false;
      }
    };

    const decide = () => {
      const ok =
        !reduced &&
        !mqReduce.matches &&
        mqFine.matches &&
        !mqCoarse.matches &&
        probeWebGL2();
      setMount(ok);
    };

    decide();
    // Only reduced-motion is expected to toggle live; wire it so turning it on
    // tears the effect down and turning it off brings it back.
    mqReduce.addEventListener("change", decide);
    return () => mqReduce.removeEventListener("change", decide);
  }, [reduced]);

  // ── init the WebGL core once mounted (dynamic import keeps it out of entry) ──
  useEffect(() => {
    if (!mount) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let controller: AuroraController | null = null;
    let cancelled = false;

    import("./AuroraCursor.webgl")
      .then((m) => {
        if (cancelled || !canvasRef.current) return;
        controller = m.createAurora(canvasRef.current);
      })
      .catch(() => {
        /* import/init failed — nothing renders, which is safe */
      });

    return () => {
      cancelled = true;
      controller?.destroy();
      controller = null;
    };
  }, [mount]);

  if (!mount) return null;
  return <canvas ref={canvasRef} className="aurora-cursor" aria-hidden="true" />;
}
