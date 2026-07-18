// A slow-spinning circular "sticker" badge — a deliberate nod to the Meeko
// reference's rotating seal, rebuilt in the site's own orange with Ahmed's words
// and a hand-drawn sparkle at the centre (the same twinkle motif the reference
// scatters through its doodles). Purely decorative: aria-hidden, positioned and
// shown on desktop only via CSS, and frozen under reduced motion.
export default function RotatingBadge({
  text = "REELS WITH MAKI · AI CONTENT · ",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`rot-badge${className ? " " + className : ""}`} aria-hidden="true">
      <svg className="rot-badge-ring" viewBox="0 0 120 120">
        <defs>
          {/* full circle, r=46, starting at 12 o'clock */}
          <path id="rotBadgePath" fill="none" d="M60 14 a46 46 0 1 1 -0.01 0" />
        </defs>
        <text>
          <textPath href="#rotBadgePath" startOffset="0">{text}</textPath>
        </text>
      </svg>
      <svg className="rot-badge-spark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.5c.5 5.7 2.3 7.5 8 8-5.7.5-7.5 2.3-8 8-.5-5.7-2.3-7.5-8-8 5.7-.5 7.5-2.3 8-8Z" />
      </svg>
    </div>
  );
}
