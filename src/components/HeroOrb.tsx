import { lazy, Suspense, useEffect, useRef, useState } from "react";

// The WebGL cloud lives in its own chunk — only fetched on capable desktops,
// after hydration, and only while the hero is on screen. On everything else the
// existing maroon .hero-circle is the (unchanged, zero-cost) backdrop, so this
// component simply renders nothing.
const OrbR3F = lazy(() => import("./HeroOrb.r3f"));

function capable(): boolean {
  if (typeof window === "undefined") return false;
  // dev/QA override so the WebGL scene can be screenshotted in headless browsers
  // (which report no fine pointer). Harmless in prod — only fires with the flag.
  if (window.location.search.includes("orb=force")) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.innerWidth < 900) return false;
  if (!window.matchMedia("(pointer: fine)").matches) return false;

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem > 0 && mem < 4) return false;

  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroOrb() {
  const [on, setOn] = useState(false);
  const [inView, setInView] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  // shared cursor state: x/y are normalized (-1..1), active ramps up on move
  const pointer = useRef({ x: 0, y: 0, active: 0 });

  useEffect(() => {
    setOn(capable());
  }, []);

  // Track the cursor across the whole hero (the canvas itself is
  // pointer-events:none so it never blocks the portrait's spotlight).
  useEffect(() => {
    if (!on) return;
    const box = boxRef.current;
    if (!box) return;
    const host = box.closest(".hero") ?? box;
    const clamp = (v: number) => Math.max(-1.6, Math.min(1.6, v));
    const onMove = (e: PointerEvent) => {
      // normalize against the orb's own disc (the canvas), not the whole hero,
      // so the repulsion lands exactly under the cursor inside the sphere
      const r = box.getBoundingClientRect();
      pointer.current.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
      pointer.current.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1));
      pointer.current.active = 1;
    };
    host.addEventListener("pointermove", onMove as EventListener, { passive: true });
    return () => host.removeEventListener("pointermove", onMove as EventListener);
  }, [on]);

  // Free the GPU when the hero scrolls away.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "160px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="hero-orb" aria-hidden="true">
      {on && inView ? (
        <Suspense fallback={null}>
          <OrbR3F pointer={pointer} />
        </Suspense>
      ) : null}
    </div>
  );
}
