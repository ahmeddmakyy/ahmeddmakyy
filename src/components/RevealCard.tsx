import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// framer-motion card: staggered scroll-in entrance + a springy hover lift.
// Honors prefers-reduced-motion (renders static, no transforms).
export default function RevealCard({
  className,
  index = 0,
  children,
}: {
  className?: string;
  index?: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <article className={className}>{children}</article>;
  }

  return (
    <motion.article
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "0px 0px -8% 0px", amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.22, 0.8, 0.3, 1] }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    >
      {children}
    </motion.article>
  );
}
