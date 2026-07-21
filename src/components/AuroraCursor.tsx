import { useEffect, useRef, useState } from "react";
import type { AuroraController } from "./AuroraCursor.webgl";
import { useCursorFxReduced } from "./cursorFx";

/* AuroraCursor — the SSR-safe gate + lazy loader for the site-wide warm aurora
 * cursor light. Mirrors the HeroField gate pattern: every window/document/canvas
 * touch is inside an effect, the heavy WebGL lives in a separate module that is
 * only dynamically imported once ALL of these hard gates pass, and the component
 * renders null on the server (and on any device that doesn't qualify):
 *
 *   • prefers-reduced-motion: reduce  → never mounts (live 'change' listener
 *     tears it down / brings it back).
 *   • pointer: fine && !coarse        → never mounts on touch/mobile. A cursor
 *     effect is dead content without a cursor, and NOT mounting on mobile means
 *     NO second WebGL context there — protecting the hero field from context
 *     eviction under memory pressure.
 *   • WebGL2 probe                    → bail if unavailable (before the import).
 *
 * Hero suppression: an IntersectionObserver on #home flips a ref the WebGL loop
 * reads each frame, easing the master opacity to ~0 while the hero is in view
 * (the hero already has its own particle field + cursor ring + portrait loupe)
 * and back up once scrolled past it. */
export default function AuroraCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mount, setMount] = useState(false);
  // The hero's "calm the cursor" button flips this; when true the effect never
  // mounts (and tears down live if it was on).
  const reduced = useCursorFxReduced();
  // Live-read by the WebGL loop. Starts true (suppressed) — the page loads on
  // the hero, so the aurora should be silent until the user scrolls past it.
  const heroVisible = useRef(true);

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
        controller = m.createAurora(canvasRef.current, { heroVisible });
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

  // ── hero suppression: drive the master uniform from #home visibility ──
  useEffect(() => {
    if (!mount) return;
    const home = document.getElementById("home");
    if (!home || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        heroVisible.current = entry.isIntersecting;
      },
      { threshold: 0.01 },
    );
    io.observe(home);
    return () => io.disconnect();
  }, [mount]);

  if (!mount) return null;
  return <canvas ref={canvasRef} className="aurora-cursor" aria-hidden="true" />;
}
