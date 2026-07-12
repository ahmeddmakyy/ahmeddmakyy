import { useEffect, useRef } from "react";

/**
 * "The Colorist's Loupe" — two stacked, pixel-aligned images. The base is a B&W
 * twin; the top ("reveal", full colour) layer is masked by a soft circular
 * spotlight that trails the pointer, so the cursor "develops" colour wherever it
 * points.
 *
 * - Desktop: on load it self-demos with a "develop" bloom on the face, then the
 *   first cursor move hands control to the pointer. A thin orange viewfinder
 *   ring rides the loupe.
 * - Touch / no-hover: a slow Lissajous auto-drift so the effect breathes.
 * - Reduced motion: shows the warm reveal fully (best frame), no motion.
 *
 * Perf: a pure CSS radial-gradient mask driven by CSS variables on one rAF loop
 * — no per-frame canvas, no React re-renders. The base <img> keeps the original
 * width/height/fetchPriority so it stays LCP-safe with no layout shift.
 */
export default function SpotlightReveal({
  baseSrc,
  revealSrc,
  alt = "",
  radius = 240,
  faceY = 0.28,
  showRing = true,
  className,
  width,
  height,
  priority = false,
  children,
}: {
  baseSrc: string;
  revealSrc: string;
  alt?: string;
  radius?: number;
  faceY?: number;
  showRing?: boolean;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ring = ringRef.current;
    const setV = (k: string, v: string) => wrap.style.setProperty(k, v);
    const setRingO = (o: number) => ring && (ring.style.opacity = String(o));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Reduced motion OR touch/mobile (no cursor) → show the colour reveal fully.
    // The loupe is a cursor affordance; on phones the photo just stays full colour.
    if (reduce || !fine) {
      setV("--r", "9999px");
      setV("--mx", "50%");
      setV("--my", "50%");
      setRingO(0);
      return;
    }

    let r = wrap.getBoundingClientRect();
    const face = () => ({ x: r.width / 2, y: r.height * faceY });
    const t = { ...face(), rad: 0 };
    const c = { ...face(), rad: 0 };
    let raf = 0;
    let mode: "intro" | "park" | "cursor" = "intro";
    const t0 = performance.now();

    const onResize = () => (r = wrap.getBoundingClientRect());
    const take = () => {
      mode = "cursor";
      t.rad = radius;
    };
    const onEnter = () => take();
    const onLeave = () => (t.rad = 0);
    const onMove = (e: PointerEvent) => {
      mode = "cursor";
      r = wrap.getBoundingClientRect();
      t.x = e.clientX - r.left;
      t.y = e.clientY - r.top;
      t.rad = radius;
    };

    const loop = (now: number) => {
      const s = (now - t0) / 1000;
      if (mode === "intro") {
        const p = Math.min(1, s / 1.4);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic bloom
        t.x = r.width * (0.5 + 0.1 * Math.sin(now / 520));
        t.y = r.height * faceY;
        t.rad = radius * 0.82 * e;
        if (p >= 1) mode = "park";
      } else if (mode === "park") {
        t.x = r.width * (0.5 + 0.09 * Math.sin(now / 950));
        t.y = r.height * (faceY + 0.04 * Math.sin(now / 1300));
        t.rad = radius * 0.82;
      }
      c.x += (t.x - c.x) * 0.14;
      c.y += (t.y - c.y) * 0.14;
      c.rad += (t.rad - c.rad) * 0.12;
      setV("--mx", c.x.toFixed(1) + "px");
      setV("--my", c.y.toFixed(1) + "px");
      setV("--r", c.rad.toFixed(1) + "px");
      if (showRing && fine) setRingO(Math.min(1, c.rad / (radius * 0.5)) * 0.85);
      raf = requestAnimationFrame(loop);
    };

    if (fine) {
      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointerleave", onLeave);
      wrap.addEventListener("pointermove", onMove);
    }
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (fine) {
        wrap.removeEventListener("pointerenter", onEnter);
        wrap.removeEventListener("pointerleave", onLeave);
        wrap.removeEventListener("pointermove", onMove);
      }
    };
  }, [radius, showRing, faceY]);

  return (
    <div ref={wrapRef} className={`spotlight-wrap${className ? " " + className : ""}`}>
      <img
        className="spotlight-base"
        src={baseSrc}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        // fetchpriority is a valid HTML attribute; React forwards the lowercase form.
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
      <div className="spotlight-reveal" aria-hidden="true">
        <img src={revealSrc} alt="" width={width} height={height} draggable={false} />
      </div>
      {showRing && (
        <svg ref={ringRef} className="spotlight-ring" width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
          <circle cx="56" cy="56" r="54" fill="none" stroke="#FD6F00" strokeWidth="1.5" />
          {/* corner viewfinder ticks */}
          <path d="M20 8 h-12 v12 M92 8 h12 v12 M20 104 h-12 v-12 M92 104 h12 v-12"
            fill="none" stroke="#FD6F00" strokeWidth="1.5" opacity="0.9" />
        </svg>
      )}
      {children}
    </div>
  );
}
