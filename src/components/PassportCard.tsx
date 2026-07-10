import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import photo from "@/assets/ahmed-passport-photo.webp";

/* A stylized "passport" ID card for the About section.
   - Structure, text, photo and MRZ are all real DOM (SEO-friendly, crisp).
   - The rubber stamps are inline SVG distressed with an feTurbulence filter.
   - On scroll each stamp "slams down" (scale overshoot); the whole card tilts
     in 3D toward the pointer. Everything is disabled under reduced-motion. */

type StampProps = {
  className: string;
  rest: number; // resting rotation in deg (baked into the animation)
  delay: number;
  reduce: boolean;
  children: ReactNode;
};

function Stamp({ className, rest, delay, reduce, children }: StampProps) {
  if (reduce) {
    return (
      <div className={`pp-stamp ${className}`} style={{ transform: `rotate(${rest}deg)` }}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={`pp-stamp ${className}`}
      initial={{ opacity: 0, scale: 1.7, rotate: rest * 0.3 }}
      whileInView={{ opacity: 0.82, scale: 1, rotate: rest }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ delay, type: "spring", stiffness: 240, damping: 13, mass: 0.7 }}
    >
      {children}
    </motion.div>
  );
}

export default function PassportCard() {
  const reduce = useReducedMotion() ?? false;

  // Pointer-driven 3D tilt.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.4 };
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), spring);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), spring);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div className="passport-wrap">
      {/* grunge filter for the stamps (defined once) */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id="pp-grunge">
          <feTurbulence type="fractalNoise" baseFrequency="0.11 0.13" numOctaves="3" seed="6" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.15"
            result="mask"
          />
          <feComposite in="SourceGraphic" in2="mask" operator="in" result="eroded" />
          <feDisplacementMap in="eroded" in2="n" scale="1.7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <motion.div
        className="passport"
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        onPointerMove={reduce ? undefined : onMove}
        onPointerLeave={reduce ? undefined : onLeave}
        initial={reduce ? false : { opacity: 0, y: 30 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 0.8, 0.3, 1] }}
      >
        <div className="pp-perf" />

        {/* ── stamps ── */}
        <div className="pp-stamps" aria-hidden="true">
          <Stamp className="pp-s1 ink-indigo" rest={-9} delay={0.05} reduce={reduce}>
            <svg viewBox="0 0 100 100">
              <defs>
                <path id="pp-t1top" d="M14 50 A36 36 0 0 1 86 50" fill="none" />
                <path id="pp-t1bot" d="M16 50 A34 34 0 0 0 84 50" fill="none" />
              </defs>
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.6" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.1" />
              <text fontSize="9" letterSpacing="1.2">
                <textPath href="#pp-t1top" startOffset="50%" textAnchor="middle">CONTENT CREATOR</textPath>
              </text>
              <text fontSize="7.5" letterSpacing="1">
                <textPath href="#pp-t1bot" startOffset="50%" textAnchor="middle">EST · 2024</textPath>
              </text>
              <path d="M43 40 L43 60 L61 50 Z" fill="currentColor" />
            </svg>
          </Stamp>

          <Stamp className="pp-s2 ink-green" rest={11} delay={0.14} reduce={reduce}>
            <svg viewBox="0 0 100 100">
              <path d="M50 12 L86 82 L14 82 Z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
              <rect x="41" y="36" width="18" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="42" r="3" fill="currentColor" />
              <text x="50" y="63" textAnchor="middle" fontSize="11">REELS</text>
              <text x="50" y="75" textAnchor="middle" fontSize="7.5" letterSpacing="1">WITH MAKI</text>
            </svg>
          </Stamp>

          <Stamp className="pp-s3 ink-red" rest={-4} delay={0.22} reduce={reduce}>
            <svg viewBox="0 0 100 100">
              <polygon points="50,8 88,29 88,71 50,92 12,71 12,29" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
              <text x="50" y="46" textAnchor="middle" fontSize="12" letterSpacing=".5">AI VIDEO</text>
              <text x="50" y="60" textAnchor="middle" fontSize="8" letterSpacing="1.5">DIRECTOR</text>
            </svg>
          </Stamp>

          <Stamp className="pp-s4 ink-indigo" rest={7} delay={0.3} reduce={reduce}>
            <svg viewBox="0 0 140 64">
              <rect x="4" y="4" width="132" height="56" rx="9" fill="none" stroke="currentColor" strokeWidth="3" />
              <rect x="11" y="11" width="118" height="42" rx="5" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M22 32 l7 8 l13 -16" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              <text x="84" y="31" textAnchor="middle" fontSize="16" letterSpacing="1">APPROVED</text>
              <text x="84" y="46" textAnchor="middle" fontSize="7.5" letterSpacing="2">10 JUL 2026</text>
            </svg>
          </Stamp>

          <Stamp className="pp-s5 ink-teal" rest={-13} delay={0.38} reduce={reduce}>
            <svg viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="31" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="35" cy="35" r="24" fill="none" stroke="currentColor" strokeWidth="1" />
              <text x="35" y="31" textAnchor="middle" fontSize="8.5">EGYPT</text>
              <text x="35" y="47" textAnchor="middle" fontSize="8.5">KSA</text>
              <circle cx="35" cy="38" r="1.5" fill="currentColor" />
            </svg>
          </Stamp>
        </div>

        {/* ── data page ── */}
        <div className="pp-flag" aria-hidden="true">
          <i style={{ background: "#ce1126" }} />
          <i style={{ background: "#fff" }} />
          <i style={{ background: "#111" }} />
        </div>

        <div className="pp-page">
          <div className="pp-photo">
            <img src={photo} alt="Ahmed Mekki" width={118} height={158} loading="lazy" />
          </div>
          <div className="pp-fields">
            <div className="pp-field"><span className="pp-lbl">Name</span><span className="pp-mono">AHMED MEKKI</span></div>
            <div className="pp-field"><span className="pp-lbl">Known as</span><span className="pp-mono">REELS WITH MAKI</span></div>
            <div className="pp-field"><span className="pp-lbl">Occupation</span><span className="pp-mono">CONTENT CREATOR</span></div>
            <div className="pp-field"><span className="pp-lbl">Specialty</span><span className="pp-mono">SOCIAL · AI VIDEO</span></div>
          </div>
        </div>

        <div className="pp-row2">
          <div className="pp-field"><span className="pp-lbl">Nationality</span><span className="pp-mono">EGYPTIAN</span></div>
          <div className="pp-field"><span className="pp-lbl">Status</span><span className="pp-mono">OPEN TO WORK</span></div>
        </div>

        <div className="pp-mrz" aria-hidden="true">
          P&lt;EGYMEKKI&lt;&lt;AHMED&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
          <br />
          REELSWITHMAKI&lt;&lt;CONTENTCREATOR&lt;&lt;&lt;&lt;&lt;&lt;9
        </div>
      </motion.div>
    </div>
  );
}
