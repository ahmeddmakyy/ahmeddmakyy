// Small hand-drawn decorative marks — a deliberate, reusable set distilled from
// the Meeko reference's doodles (rotate.svg's twinkle, d3's curly arrow, the
// squiggle underlines), rebuilt in the site's own orange so they read as one
// system rather than scattered stickers. All are decorative (aria-hidden); the
// colour comes from `currentColor` so a placement can recolour if needed.
type Shape = "sparkle" | "arrow" | "squiggle" | "star" | "swirl" | "underline";

export default function Doodle({ shape, className }: { shape: Shape; className?: string }) {
  const cls = `doodle doodle-${shape}${className ? " " + className : ""}`;

  if (shape === "sparkle") {
    return (
      <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.4c.5 5.9 2.3 7.7 8.2 8.2-5.9.5-7.7 2.3-8.2 8.2-.5-5.9-2.3-7.7-8.2-8.2 5.9-.5 7.7-2.3 8.2-8.2Z" />
      </svg>
    );
  }

  // crisp four-point star — a sharper accent than the rounded twinkle above
  if (shape === "star") {
    return (
      <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1l2.1 8.9L23 12l-8.9 2.1L12 23l-2.1-8.9L1 12l8.9-2.1L12 1Z" />
      </svg>
    );
  }

  if (shape === "arrow") {
    // a hand-drawn curly arrow, echoing the reference's d3 doodle
    return (
      <svg className={cls} viewBox="0 0 72 48" fill="none" aria-hidden="true">
        <path
          d="M4 10c14-7 30-3 40 8 3 3 5 8 3 12-1 3-5 4-7 1-2-3 0-8 4-9 8-3 15 2 19 8"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M55 24l8 4 1-9"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // a small hand-drawn spiral curl — for empty corners; mirrors the star's weight
  if (shape === "swirl") {
    return (
      <svg className={cls} viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <path
          d="M5 19C4 11 11 5 18 7c5.6 1.6 8 8 4.6 12-2.7 3.2-8 2.4-9.4-1.4-1-2.9 1-6.2 4.2-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // a confident single-stroke underline that flicks up at the tail (for accenting
  // a word); the wavy multi-bump `squiggle` below stays the softer rule variant
  if (shape === "underline") {
    return (
      <svg className={cls} viewBox="0 0 120 16" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M4 10C34 4 74 4 104 9c7 1.2 12 1.6 12-3"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // squiggle underline (soft multi-bump rule)
  return (
    <svg className={cls} viewBox="0 0 96 12" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path
        d="M2 7C11 1 19 1 28 7s17 5 26 0 17-5 26 0"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
