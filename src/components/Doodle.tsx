// Small hand-drawn decorative marks — a deliberate, reusable set distilled from
// the Meeko reference's doodles (rotate.svg's twinkle, d3's curly arrow, the
// squiggle underlines), rebuilt in the site's own orange so they read as one
// system rather than scattered stickers. All are decorative (aria-hidden); the
// colour comes from `currentColor` so a placement can recolour if needed.
type Shape =
  | "sparkle"
  | "arrow"
  | "squiggle"
  | "star"
  | "swirl"
  | "underline"
  | "loop"
  | "burst"
  | "circle"
  | "zigzag"
  | "dots"
  | "wave";

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

  // a single-stroke loop-de-loop flourish — a line that curls once and flies on
  if (shape === "loop") {
    return (
      <svg className={cls} viewBox="0 0 84 40" fill="none" aria-hidden="true">
        <path
          d="M4 27C22 27 27 25 31 17c3-6-3-11-8-8-5 3-2 12 8 13 16 2 32-4 49-14"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // an 8-ray pop / shine — an energetic little accent near a heading
  if (shape === "burst") {
    return (
      <svg
        className={cls}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M12 2.5V7M12 17v4.5M2.5 12H7M17 12h4.5M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9" />
      </svg>
    );
  }

  // a hand-drawn oval ring that overshoots its start — for "circling" a word;
  // preserveAspectRatio:none lets a placement stretch it to wrap wider content
  if (shape === "circle") {
    return (
      <svg className={cls} viewBox="0 0 110 60" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M60 6C28 4 9 17 11 33c2 17 33 24 60 20 22-3 33-16 28-27C122 12 92 4 44 9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // a sharp zigzag — a jolt of energy as an accent or under a word
  if (shape === "zigzag") {
    return (
      <svg className={cls} viewBox="0 0 100 20" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M3 11l14-7 14 13 14-13 14 13 14-13 14 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // three trailing dots — a playful "…" accent
  if (shape === "dots") {
    return (
      <svg className={cls} viewBox="0 0 40 12" fill="currentColor" aria-hidden="true">
        <circle cx="6" cy="6" r="3.3" />
        <circle cx="20" cy="6" r="3.3" />
        <circle cx="34" cy="6" r="3.3" />
      </svg>
    );
  }

  // a gentle 3-bump wave — softer than the squiggle, for small accents
  if (shape === "wave") {
    return (
      <svg className={cls} viewBox="0 0 72 14" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M3 8c8-8 14-8 22 0s14 8 22 0 14-8 22 0"
          stroke="currentColor"
          strokeWidth="2.6"
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
