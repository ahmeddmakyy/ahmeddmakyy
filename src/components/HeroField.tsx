import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Ptr } from "./HeroField.r3f";

const FieldR3F = lazy(() => import("./HeroField.r3f"));

type Quality = { density: number; maxSize: number };

export default function HeroField() {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [live, setLive] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<Ptr>({ x: 0, y: 0, active: 0 });

  // Client-only: decide density from the viewport after hydration. Reduced
  // motion opts out entirely (the field is pure decoration).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      // three r185 is WebGL2-only, and the field simulates itself in a float
      // render target — probe both here so an unsupported device never pays for
      // the three chunk at all
      const c = document.createElement("canvas");
      const probe = c.getContext("webgl2");
      if (!probe) return;
      const floatRT =
        !!probe.getExtension("EXT_color_buffer_float") ||
        !!probe.getExtension("EXT_color_buffer_half_float");
      probe.getExtension("WEBGL_lose_context")?.loseContext();
      if (!floatRT) return;
    } catch {
      return;
    }
    // density is points-per-area, not a raw count — a phone shows the same dash
    // size in a fraction of the area, so the same number would read as clutter
    const w = window.innerWidth;
    setQuality(
      w < 640 ? { density: 150, maxSize: 128 } : w < 1100 ? { density: 180, maxSize: 192 } : { density: 200, maxSize: 256 },
    );
  }, []);

  // Cursor drives the ring. Tracked on the hero section so the field reacts
  // across the whole banner, not just where the canvas sits.
  useEffect(() => {
    if (!quality) return;
    const box = boxRef.current;
    if (!box) return;
    const host = (box.closest(".hero") as HTMLElement) ?? box;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.current.active = 1;
    };
    const onLeave = () => {
      pointer.current.active = 0;
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    host.addEventListener("pointercancel", onLeave, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
    };
  }, [quality]);

  // The hero scrolls away within one screen; a GPGPU field nobody can see is
  // pure battery drain, so park the render loop once it leaves the viewport.
  useEffect(() => {
    if (!quality) return;
    const box = boxRef.current;
    if (!box || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(box);
    return () => io.disconnect();
  }, [quality]);

  return (
    <div ref={boxRef} className="hero-field" aria-hidden="true">
      {quality ? (
        <Suspense fallback={null}>
          <FieldR3F
            pointer={pointer}
            density={quality.density}
            maxSize={quality.maxSize}
            live={live}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
