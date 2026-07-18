import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * "TrueFocus" name reveal (faithful React + framer-motion port of the reactbits
 * effect, retuned to the site's tokens).
 *
 * The name is split into words; a 4-corner bracket box sits over exactly ONE
 * word which stays SHARP (`blur(0)`) while every other word is BLURRED. Each
 * cycle advances to the next word, the blur swaps, and the box glides to the
 * new word's position/size.
 *
 * Non-obvious bits:
 * - Measuring: the box is absolutely positioned inside the container, so after
 *   every `current` change we read the active word's `getBoundingClientRect()`
 *   RELATIVE to the container and feed x/y/width/height into framer. We defer
 *   that read to the next animation frame (rAF) so it runs AFTER the browser
 *   has re-laid-out — critical for the web-font swap below.
 * - Font swap: Bricolage loads async; when it replaces the fallback the word
 *   widths change, so a stale box would be misaligned. A `ResizeObserver` on the
 *   container plus `document.fonts.ready` re-measure once the real font is in.
 * - SSR/hydration: `current` starts at 0 and the interval only starts in a
 *   client effect, so server and first-client HTML match. Reduced-motion is
 *   gated behind a post-mount flag for the same reason (see `reduce` below).
 */
export default function NameReveal({
  sentence = "Ahmed Maki",
  blurAmount = 5,
  borderColor = "#FD6F00",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.2,
  className,
  manualMode = false,
}: {
  sentence?: string;
  blurAmount?: number;
  borderColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
  manualMode?: boolean;
}) {
  const prefersReduced = useReducedMotion();

  // Hydration guard: server and the first client render share the animated
  // tree (reduced-motion off), then reduced-motion takes effect after mount so
  // the initial HTML always matches. No motion actually plays pre-mount (the
  // box is unmeasured/opacity 0 and the interval hasn't started).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && prefersReduced;

  // Collapse runs of whitespace so a stray double-space can't create empty words.
  const words = sentence.trim().split(/\s+/).filter(Boolean);

  const [current, setCurrent] = useState(0);
  const [lastActive, setLastActive] = useState(0); // manualMode: word to restore on mouse-leave

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rafRef = useRef(0);

  // Box geometry in container-local px. width 0 until first measure → box hidden.
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Latest active index in a ref so `measure` can stay identity-stable ([] deps)
  // and be reused by the resize/font observers without re-subscribing.
  const currentRef = useRef(0);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const active = wordRefs.current[currentRef.current];
    if (!container || !active) return;
    const parent = container.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    setRect({
      x: box.left - parent.left,
      y: box.top - parent.top,
      width: box.width,
      height: box.height,
    });
  }, []);

  // Defer the read to the next frame so layout (new active word / font swap) is settled.
  const scheduleMeasure = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(measure);
  }, [measure]);

  // Re-measure whenever the active word changes (or when motion is re-enabled).
  useEffect(() => {
    if (reduce) return;
    scheduleMeasure();
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, reduce, scheduleMeasure]);

  // Keep the box aligned across viewport resize AND the async Bricolage swap.
  useEffect(() => {
    if (reduce) return;
    const container = containerRef.current;
    if (!container) return;

    const onResize = () => scheduleMeasure();
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(container);

    // Recompute once the real web-font has swapped in (widths change).
    if ("fonts" in document) document.fonts.ready.then(scheduleMeasure);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [reduce, scheduleMeasure]);

  // Auto-cycle: advance to the next word on a fixed interval (client-only).
  useEffect(() => {
    if (reduce || manualMode || words.length < 2) return;
    const id = window.setInterval(
      () => setCurrent((v) => (v + 1) % words.length),
      (animationDuration + pauseBetweenAnimations) * 1000,
    );
    return () => window.clearInterval(id);
  }, [reduce, manualMode, words.length, animationDuration, pauseBetweenAnimations]);

  // manualMode: hover focuses a word; leaving restores the last focused one.
  const handleMouseEnter = (index: number) => {
    if (!manualMode) return;
    setLastActive(index);
    setCurrent(index);
  };
  const handleMouseLeave = () => {
    if (!manualMode) return;
    setCurrent(lastActive);
  };

  return (
    <div ref={containerRef} className={`name-reveal${className ? " " + className : ""}`}>
      {words.map((word, index) => {
        const active = index === current;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className={`nr-word${active ? " active" : ""}`}
            // Blur is visual only — every word stays readable in the DOM for AT.
            style={
              {
                filter: reduce || active ? "blur(0px)" : `blur(${blurAmount}px)`,
                "--dur": `${animationDuration}s`,
              } as React.CSSProperties
            }
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      {/* Decorative bracket frame — omitted entirely under reduced motion. */}
      {!reduce && (
        <motion.div
          className="nr-frame"
          aria-hidden="true"
          style={{ "--nr-border": borderColor } as React.CSSProperties}
          initial={false}
          animate={{
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            opacity: rect.width > 0 ? 1 : 0, // stay hidden until first measure
          }}
          transition={{ duration: animationDuration, ease: [0.22, 0.8, 0.3, 1] }}
        >
          <span className="nr-corner nr-tl" />
          <span className="nr-corner nr-tr" />
          <span className="nr-corner nr-bl" />
          <span className="nr-corner nr-br" />
        </motion.div>
      )}
    </div>
  );
}
