import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

// Counts a numeric stat up from 0 when it scrolls into view.
// SSR + first client render show the final value (SEO-safe); on the client it
// resets to 0, then animates once the stat enters the viewport.
function StatNumber({ value }: { value: string }) {
  // Parse ONCE per value. A fresh array on every render would be an unstable
  // effect dependency and restart the animation each frame (the count would
  // never advance past 0) — this was the "numbers not animating" bug.
  const parsed = useMemo(() => {
    const m = value.match(/^(\D*)(\d+)(\D*)$/);
    return m ? { prefix: m[1], target: parseInt(m[2], 10), suffix: m[3] } : null;
  }, [value]);

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -12% 0px", amount: 0.3 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState<number | null>(
    parsed ? parsed.target : null,
  );

  useEffect(() => {
    // Only animate while in view. When out of view we DON'T force 0 — the number
    // just holds its last value (off-screen, so invisible). animate() sets ~0 on
    // its first frame, so scrolling back in still replays the count from zero;
    // and if the observer never fires, the stat rests at its real target rather
    // than advertising "0 clients".
    if (!parsed || reduce || !inView) return;
    const controls = animate(0, parsed.target, {
      duration: 1.5,
      ease: [0.22, 0.8, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, parsed, reduce]);

  if (!parsed) return <>{value}</>;
  return (
    <span ref={ref}>
      {parsed.prefix}
      {display ?? parsed.target}
      {parsed.suffix}
    </span>
  );
}

export default function AnimatedStats({
  stats,
}: {
  stats: { n: string; label: string }[];
}) {
  return (
    <dl className="stats-row">
      {stats.map((st, i) => (
        <div key={i}>
          <dt>
            <StatNumber value={st.n} />
          </dt>
          <dd>{st.label}</dd>
        </div>
      ))}
    </dl>
  );
}
