import { useEffect, useRef, useState } from "react";
import type { LiquidMediaController } from "./LiquidMedia.webgl";
import { useCursorFxReduced } from "./cursorFx";

/* LiquidMedia — SSR-safe gate + lazy loader for the media-scoped "liquid lens"
 * (the mouse liquid, moved OFF the whole browser and onto media per request).
 * It only warps elements tagged [data-liquid] — the reel posters today, any
 * idea-images later — using whatever pixels sit underneath, and goes quiet while
 * a video plays.
 *
 * Same hard gates as AuroraCursor: it never mounts on the server, on touch
 * (pointer:fine && !coarse — a cursor lens is dead content without a cursor, and
 * skipping it keeps a 2nd WebGL context off mobile), under prefers-reduced-motion
 * (live), without WebGL2, or while the shared "calm the cursor" toggle is on —
 * the liquid is part of that same mouse-fx family, so it silences together with
 * the fire. The heavy WebGL core is dynamically imported only once every gate
 * passes, so it never enters the entry bundle. */
export default function LiquidMedia() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mount, setMount] = useState(false);
  const reduced = useCursorFxReduced();

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
      setMount(
        !reduced && !mqReduce.matches && mqFine.matches && !mqCoarse.matches && probeWebGL2(),
      );
    };
    decide();
    mqReduce.addEventListener("change", decide);
    return () => mqReduce.removeEventListener("change", decide);
  }, [reduced]);

  useEffect(() => {
    if (!mount) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let controller: LiquidMediaController | null = null;
    let cancelled = false;

    import("./LiquidMedia.webgl")
      .then((m) => {
        if (cancelled || !canvasRef.current) return;
        controller = m.createLiquidMedia(canvasRef.current);
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
  return <canvas ref={canvasRef} className="liquid-media" aria-hidden="true" />;
}
