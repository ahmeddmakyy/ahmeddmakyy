import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Counts a numeric stat up from 0 when it scrolls into view.
// SSR + first client render show the final value (SEO-safe); the client then
// resets to 0 and animates. Non-numeric strings render unchanged.
function StatNumber({ value }: { value: string }) {
  const parts = value.match(/^(\D*)(\d+)(\D*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(parts ? parts[2] : value);

  // On client mount, drop to 0 so the count-up has somewhere to start.
  useEffect(() => {
    if (parts && !reduce) setDisplay("0");
  }, [parts, reduce]);

  useEffect(() => {
    if (!parts || reduce || !inView) return;
    const target = parseInt(parts[2], 10);
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.22, 0.8, 0.3, 1],
      onUpdate: (v) => setDisplay(String(Math.round(v))),
    });
    return () => controls.stop();
  }, [inView, parts, reduce]);

  if (!parts) return <>{value}</>;
  return (
    <span ref={ref}>
      {parts[1]}
      {display}
      {parts[3]}
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
