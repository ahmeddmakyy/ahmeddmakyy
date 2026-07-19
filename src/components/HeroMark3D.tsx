import { lazy, Suspense, useEffect, useRef, useState } from "react";

// The two renderers live in their own chunks so `three` / `zdog` are only
// fetched on the client, on capable devices, after hydration — never in the
// main bundle and never during SSR.
const R3FMark = lazy(() => import("./HeroMark3D.r3f"));
const ZdogMark = lazy(() => import("./HeroMark3D.zdog"));

type Mode = "webgl" | "zdog" | "static" | "off";

// Decide what (if anything) to render, from the real device — runs only on the
// client. Desktop with a fine pointer + WebGL + enough memory gets real 3D;
// tablets / coarse pointers get the cheap Zdog spin; reduced-motion gets a
// static mark; small phones get nothing (0 KB, and the stage declutters anyway).
function detectMode(): Mode {
  if (typeof window === "undefined") return "static";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const w = window.innerWidth;
  if (w < 860) return "off"; // matches the hero badge/notes hiding on mobile

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowMem = typeof mem === "number" && mem > 0 && mem < 4;

  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  if (!webgl || lowMem) return "static";

  const fine = window.matchMedia("(pointer: fine)").matches;
  if (w >= 1024 && fine) return "webgl";
  return "zdog";
}

// A flat vector mark: the SSR/first-paint placeholder, the reduced-motion mark,
// and the Suspense fallback — all in one, so there's never a blank box or a
// hydration mismatch (server + first client render both show this).
const StaticMark = (
  <svg viewBox="0 0 100 100" className="hero-mark3d-static" aria-hidden="true">
    <circle cx="50" cy="50" r="47" fill="#FD6F00" />
    <path d="M41 31 L71 50 L41 69 Z" fill="#fff" />
  </svg>
);

export default function HeroMark3D() {
  const [mode, setMode] = useState<Mode>("static");
  const [inView, setInView] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(detectMode());
  }, []);

  // Unmount the live renderer (and free the GPU / stop the rAF) once the hero
  // scrolls out of view; remount when it returns.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "140px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (mode === "off") return null;

  const live = inView && (mode === "webgl" || mode === "zdog");

  return (
    <div ref={boxRef} className="hero-mark3d" aria-hidden="true">
      {live ? (
        <Suspense fallback={StaticMark}>
          {mode === "webgl" ? <R3FMark /> : <ZdogMark />}
        </Suspense>
      ) : (
        StaticMark
      )}
    </div>
  );
}
