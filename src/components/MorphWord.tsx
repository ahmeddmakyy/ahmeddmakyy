import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * A single word that morphs through a list on a timer (blur + vertical slide).
 *
 * All words are stacked in one CSS grid cell, so the box reserves the WIDEST
 * word's width — the surrounding sentence never reflows as words swap (no CLS).
 * SSR renders the first word visible (others opacity:0 via framer's initial
 * state), and reduced-motion renders a plain static word.
 */
export default function MorphWord({
  words,
  className,
  interval = 2200,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [reduce, words.length, interval]);

  if (reduce) return <span className={className}>{words[0]}</span>;

  return (
    <span className={`morph-word${className ? " " + className : ""}`}>
      {words.map((w, k) => (
        <motion.span
          key={k}
          className="mw-item"
          initial={false}
          animate={
            k === i
              ? { opacity: 1, y: "0%", filter: "blur(0px)" }
              : { opacity: 0, y: k < i ? "-55%" : "55%", filter: "blur(7px)" }
          }
          transition={{ duration: 0.5, ease: [0.22, 1, 0.3, 1] }}
          aria-hidden={k !== i}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}
