import { Children, isValidElement, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

/* Stacking-deck geometry (after the Meeko/Webflow "Stacking Cards" pattern):
   each slot is position:sticky with a staggered top, so a 14px lip of every
   pinned card stays visible under the next one. */
export const STACK_TOP_BASE = 120; // px — clears the fixed nav
export const STACK_TOP_STEP = 14; // px — the visible lip of each buried card
const BOTTOM_GAP = 24; // px — kept clear under a card taller than the viewport

/* Small-viewport height via a 100svh probe: window.innerHeight changes when
   mobile-browser toolbars collapse mid-scroll, which would re-pin the deck and
   make it jump; svh stays stable through toolbar transitions (and still
   updates on rotation/real resizes). */
function stableViewportHeight(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;height:100svh;width:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const h = probe.offsetHeight || window.innerHeight;
  probe.remove();
  return h;
}

/**
 * Sticky wrapper for one card in the stack. As the container's scroll
 * progresses, already-pinned cards scale down toward the back (origin at top
 * centre, like Meeko: buried cards recede, the last card never shrinks).
 *
 * Cards taller than the viewport (the video carousels on short laptops) can't
 * pin at the nav line — their bottom controls would be forever cut off — so
 * the slot measures itself and pins bottom-aligned instead (top goes negative
 * just enough to keep the card's bottom on screen).
 */
function StackSlot({
  index,
  total,
  progress,
  topBase,
  topStep,
  scaleStep,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  topBase: number;
  topStep: number;
  scaleStep: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // SSR renders the ideal top; the effect corrects it after mount if the card
  // turns out taller than the viewport allows.
  const [pinTop, setPinTop] = useState(topBase + index * topStep);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // offsetHeight ignores the scale transform, so this never feeds back.
      const base = Math.min(topBase, stableViewportHeight() - el.offsetHeight - BOTTOM_GAP);
      setPinTop(Math.round(base + index * topStep));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [index, topBase, topStep]);

  // Deepest card rests at 0.85 (Meeko's floor); each later card sits closer to 1.
  const target = Math.max(0.85, 1 - scaleStep * (total - 1 - index));
  const scale = useTransform(progress, [index / total, 1], [1, target]);

  return (
    <motion.div ref={ref} className="stack-slot" style={{ scale, top: pinTop }}>
      {children}
    </motion.div>
  );
}

/**
 * Meeko-style stacking deck: lays its children out as a column of sticky
 * cards; each new card scrolls up over the pinned previous one, which scales
 * back. Used by the Work cards (via MorphCards) and the Videos carousels.
 *
 * - Scroll progress is container-driven (framer useScroll), like the Webflow
 *   original's "while scrolling in view" interaction.
 * - Reduced motion and phones are handled in CSS ONLY (slots go static, inline
 *   transforms neutralised) so server and client always render the same DOM —
 *   a JS branch on useReducedMotion() would flip the tree after hydration.
 */
export default function StackingCards({
  children,
  className = "stacking-cards",
  topBase = STACK_TOP_BASE,
  topStep = STACK_TOP_STEP,
  scaleStep = 0.03,
}: {
  children: ReactNode;
  className?: string;
  topBase?: number;
  topStep?: number;
  scaleStep?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const kids = Children.toArray(children);

  return (
    <div className={className} ref={ref}>
      {kids.map((child, i) => (
        <StackSlot
          key={isValidElement(child) && child.key != null ? child.key : i}
          index={i}
          total={kids.length}
          progress={scrollYProgress}
          topBase={topBase}
          topStep={topStep}
          scaleStep={scaleStep}
        >
          {child}
        </StackSlot>
      ))}
    </div>
  );
}
