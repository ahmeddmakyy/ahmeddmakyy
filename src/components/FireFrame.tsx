import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { FireFrameController } from "./FireFrame.webgl";
import { useCursorFxReduced } from "./cursorFx";

/* FireFrame — SSR-safe gate + lazy loader for the anime-fire "portal" that rings
 * an open modal frame (video lightbox / morph card). Mirrors the AuroraCursor
 * gate: reduced-motion (live) + pointer:fine + WebGL2 probe, everything touching
 * window/document/canvas/WebGL inside effects, renders null on the server and on
 * any device that doesn't qualify.
 *
 * It is mounted ONLY while its modal is open (the parent conditionally renders
 * it), so its WebGL context exists only for that window and is fully disposed on
 * unmount — extinguishing the fire when the modal closes.
 *
 * The framed effect is a MOUSE interaction (the user framed it that way), so it
 * gates desktop-only exactly like the cursor. The canvas is fixed, full-viewport,
 * pointer-events:none, and sits inside the modal DOM above the scrim. */
export default function FireFrame({
  targetRef,
  onDark = 1,
  radius = 16,
  className,
}: {
  /** Element to ring with fire (read live each frame). */
  targetRef: RefObject<HTMLElement | null>;
  /** 0 = over light bg, 1 = over dark bg. Both modals use dark scrims → 1. */
  onDark?: number;
  /** Corner radius (css px) of the framed element. */
  radius?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mount, setMount] = useState(false);
  // Shares the hero "calm the cursor" toggle with AuroraCursor — the frame-wrap
  // fire is part of the same mouse-fire family, so it goes silent together.
  const reduced = useCursorFxReduced();

  // Keep the latest onDark/radius readable by the imperative loop without
  // re-initialising the WebGL core.
  const cfg = useRef({ onDark, radius });
  cfg.current = { onDark, radius };

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

    let controller: FireFrameController | null = null;
    let cancelled = false;

    import("./FireFrame.webgl")
      .then((m) => {
        if (cancelled || !canvasRef.current) return;
        controller = m.createFireFrame(canvasRef.current, {
          onDark: cfg.current.onDark,
          getRect: () => {
            const el = targetRef.current;
            if (!el) return null;
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) return null;
            // Ring the frame with a small OUTWARD gap so the flames (and their
            // ~2px inner reach) sit JUST OUTSIDE the content, never licking over
            // the video itself — that inner lick read as "an effect on the video"
            // that then vanished when the bare <video> went native-fullscreen.
            const GAP = 7;
            return {
              left: r.left - GAP,
              top: r.top - GAP,
              width: r.width + GAP * 2,
              height: r.height + GAP * 2,
              radius: cfg.current.radius + GAP,
            };
          },
        });
      })
      .catch(() => {
        /* import/init failed — nothing renders, which is safe */
      });

    return () => {
      cancelled = true;
      controller?.destroy();
      controller = null;
    };
  }, [mount, targetRef]);

  if (!mount) return null;
  return (
    <canvas
      ref={canvasRef}
      className={className ? `fire-frame ${className}` : "fire-frame"}
      aria-hidden="true"
    />
  );
}
