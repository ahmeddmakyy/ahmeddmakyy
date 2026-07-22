import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import photo from "@/assets/ahmed-passport-photo.webp";
import egFlag from "@/assets/egypt-flag.svg";

/* A stylized "passport" ID card for the About section, modeled on the open-
   passport look (guilloché paper, page fold, dense rubber stamps, photo + data
   page + MRZ). Structure/text/photo are real DOM (crisp, SEO-friendly); the
   stamps are inline SVG distressed with an feTurbulence filter. On scroll each
   stamp "slams down"; the card tilts in 3D toward the pointer. All sizes are in
   cqw (1% of the card's width) so it scales fluidly. Reduced-motion safe. */

type StampProps = {
  className: string;
  rest: number;
  delay: number;
  reduce: boolean;
  children: ReactNode;
};

function Stamp({ className, rest, delay, reduce, children }: StampProps) {
  if (reduce) {
    return (
      <div className={className} style={{ transform: `rotate(${rest}deg)` }}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 1.6, rotate: rest * 0.3 }}
      whileInView={{ opacity: 0.95, scale: 1, rotate: rest }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ delay, type: "spring", stiffness: 240, damping: 13, mass: 0.7 }}
    >
      {children}
    </motion.div>
  );
}

const MRZ_1 = "P<MAKI<<AHMED<<<IS<A<<CONTENT<CREATOR<<FROM<EGYPT<<<<<";
const MRZ_2 = "SOCIAL<MEDIA<<AI<VIDEO<DIRECTOR<<REELS<WITH<MAKI<<<<<";

export default function PassportCard() {
  const reduce = useReducedMotion() ?? false;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.4 };
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), spring);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    // Mouse-only: keep touch-scrolling over the card from driving the 3D-tilt
    // springs (which re-blend 11 filtered SVG stamps per frame on mobile).
    if (e.pointerType !== "mouse") return;
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
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id="pp-grunge">
          <feTurbulence type="fractalNoise" baseFrequency="0.11 0.13" numOctaves="3" seed="6" result="n" />
          {/* lighter erosion than before so the stamps read clearly */}
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.2" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" result="e" />
          <feDisplacementMap in="e" in2="n" scale="1.7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <motion.div
        className="passport"
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        onPointerMove={reduce ? undefined : onMove}
        onPointerLeave={reduce ? undefined : onLeave}
        initial={reduce ? false : { opacity: 0, y: 30 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        whileHover={
          reduce
            ? undefined
            : { scale: 1.05, transition: { type: "spring", stiffness: 260, damping: 18 } }
        }
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 0.8, 0.3, 1] }}
      >
        <div className="pp-spine" />
        <div className="pp-fold" />

        {/* ── stamps ── */}
        <div className="pp-stamps" aria-hidden="true">
          <Stamp className="pp-stamp pp-s1 bl" rest={-3} delay={0.04} reduce={reduce}>
            <svg viewBox="0 0 160 96">
              <rect x="4" y="4" width="152" height="88" rx="12" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <g fill="currentColor"><circle cx="22" cy="20" r="1.3" /><circle cx="30" cy="17" r="1.3" /><circle cx="38" cy="16" r="1.3" /><circle cx="46" cy="17" r="1.3" /><circle cx="54" cy="20" r="1.3" /></g>
              <path d="M96 14 h44 v30 h-44 z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M104 34 l30 -14 -6 12 6 2 -30 8 z" fill="currentColor" />
              <path d="M22 58 h26 M22 58 l7 -6 M22 58 l7 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <text x="80" y="72" textAnchor="middle" fontSize="12" letterSpacing="1">MAKE REELS</text>
              <text x="80" y="85" textAnchor="middle" fontSize="8" letterSpacing="1.5">&amp; TELL STORIES</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s2 gr" rest={-6} delay={0.09} reduce={reduce}>
            <svg viewBox="0 0 120 110">
              <path d="M60 8 L112 100 L8 100 Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
              <path d="M60 20 L104 96 L16 96 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M40 50 l34 -10 -7 9 6 2 -33 8 z" fill="currentColor" />
              <text x="60" y="66" textAnchor="middle" fontSize="7.5">I HELP BRANDS</text>
              <line x1="30" y1="72" x2="90" y2="72" stroke="currentColor" strokeWidth="1" />
              <text x="60" y="88" textAnchor="middle" fontSize="9.5" letterSpacing=".5">FIND THEIR VOICE</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s3 rd" rest={3} delay={0.14} reduce={reduce}>
            <svg viewBox="0 0 132 118">
              <defs><path id="pp-hex" d="M66 6 L124 34 L124 84 L66 112 L8 84 L8 34 Z" fill="none" /></defs>
              <text fontSize="7" letterSpacing="1"><textPath href="#pp-hex" startOffset="0">012301230123012301230123012301230123</textPath></text>
              <path d="M66 14 L116 38 L116 80 L66 104 L16 80 L16 38 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <text x="66" y="42" textAnchor="middle" fontSize="14" letterSpacing="1">AI ADS</text>
              <path d="M50 50 l34 -8 -7 8 6 2 -33 7 z" fill="currentColor" />
              <text x="66" y="78" textAnchor="middle" fontSize="12">DIRECTED</text>
              <text x="66" y="92" textAnchor="middle" fontSize="8">VEO · FLUX</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s4 bl" rest={-4} delay={0.19} reduce={reduce}>
            <svg viewBox="0 0 96 130">
              <rect x="3" y="3" width="90" height="124" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <text x="48" y="24" textAnchor="middle" fontSize="12" letterSpacing="1">CONTENT</text>
              <text x="48" y="40" textAnchor="middle" fontSize="11" letterSpacing="1">PLAN</text>
              <line x1="12" y1="50" x2="84" y2="50" stroke="currentColor" strokeWidth="1" />
              <text x="48" y="72" textAnchor="middle" fontSize="10">MONTHLY+</text>
              <text x="48" y="90" textAnchor="middle" fontSize="12">150</text>
              <text x="48" y="106" textAnchor="middle" fontSize="12">IDEAS</text>
              <path d="M30 116 h36 M30 116 l6 -5 M30 116 l6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s5 gr" rest={6} delay={0.24} reduce={reduce}>
            <svg viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.5 4" />
              <defs><path id="pp-c5t" d="M18 64 A46 46 0 0 1 110 64" fill="none" /><path id="pp-c5b" d="M20 64 A44 44 0 0 0 108 64" fill="none" /></defs>
              <text fontSize="9.5" letterSpacing=".5"><textPath href="#pp-c5t" startOffset="50%" textAnchor="middle">REELS WITH MAKI</textPath></text>
              <text fontSize="8" letterSpacing="1"><textPath href="#pp-c5b" startOffset="50%" textAnchor="middle">· ARRIVED ·</textPath></text>
              <text x="64" y="60" textAnchor="middle" fontSize="12" letterSpacing="1">EST</text>
              <text x="64" y="76" textAnchor="middle" fontSize="12">2024</text>
              <path d="M40 88 l34 -8 -7 8 6 2 -33 7 z" fill="currentColor" />
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s6 rd" rest={-3} delay={0.29} reduce={reduce}>
            <svg viewBox="0 0 104 84">
              <rect x="3" y="3" width="98" height="78" fill="none" stroke="currentColor" strokeWidth="2" />
              <g fill="currentColor"><circle cx="16" cy="16" r="1.2" /><circle cx="24" cy="13" r="1.2" /><circle cx="32" cy="12" r="1.2" /><circle cx="40" cy="13" r="1.2" /><circle cx="48" cy="16" r="1.2" /></g>
              <path d="M14 44 h30 M14 44 l7 -6 M14 44 l7 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="52" y="40" textAnchor="middle" fontSize="9">AI NATIVE</text>
              <text x="52" y="60" textAnchor="middle" fontSize="11.5" letterSpacing=".5">PRODUCER</text>
              <text x="52" y="73" textAnchor="middle" fontSize="8">SINCE 2024</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s7 bl" rest={-13} delay={0.33} reduce={reduce}>
            <svg viewBox="0 0 116 116">
              <circle cx="58" cy="58" r="54" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <circle cx="58" cy="58" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
              <defs><path id="pp-c7t" d="M20 58 A38 38 0 0 1 96 58" fill="none" /><path id="pp-c7b" d="M22 58 A36 36 0 0 0 94 58" fill="none" /></defs>
              <text fontSize="11" letterSpacing="1"><textPath href="#pp-c7t" startOffset="50%" textAnchor="middle">CAIRO EGY</textPath></text>
              <text fontSize="10"><textPath href="#pp-c7b" startOffset="50%" textAnchor="middle">2024</textPath></text>
              <text x="58" y="54" textAnchor="middle" fontSize="10">JUL 22</text>
              <text x="58" y="68" textAnchor="middle" fontSize="10">11-PM</text>
              <g fill="currentColor"><path d="M34 78 l2 5 5 0 -4 3 2 5 -5 -3 -5 3 2 -5 -4 -3 5 0 z" /><path d="M76 78 l2 5 5 0 -4 3 2 5 -5 -3 -5 3 2 -5 -4 -3 5 0 z" /></g>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s8 rd" rest={2} delay={0.37} reduce={reduce}>
            <svg viewBox="0 0 100 78">
              <rect x="3" y="3" width="94" height="72" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" />
              <text x="50" y="26" textAnchor="middle" fontSize="12" letterSpacing="1">HOOKS</text>
              <text x="50" y="42" textAnchor="middle" fontSize="8">THAT STOP</text>
              <text x="50" y="58" textAnchor="middle" fontSize="9">THE SCROLL</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s9 bl" rest={-4} delay={0.41} reduce={reduce}>
            <svg viewBox="0 0 98 96">
              <path d="M49 6 L92 34 L78 90 L20 90 L6 34 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M30 40 l30 -8 -6 7 5 2 -29 7 z" fill="currentColor" />
              <text x="49" y="60" textAnchor="middle" fontSize="9.5">HUMANIZED</text>
              <text x="49" y="76" textAnchor="middle" fontSize="8">ARABIC</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s10 gr" rest={2} delay={0.45} reduce={reduce}>
            <svg viewBox="0 0 126 100">
              <path d="M10 20 Q63 4 116 20 L110 82 Q63 96 16 82 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <text x="63" y="30" textAnchor="middle" fontSize="7.5" letterSpacing="1">CONTENT SET · DEPARTED</text>
              <g fill="currentColor"><path d="M26 46 l1.6 4 4 0 -3.2 2.6 1.4 4 -3.8-2.6-3.8 2.6 1.4-4-3.2-2.6 4 0z" /><path d="M100 46 l1.6 4 4 0 -3.2 2.6 1.4 4 -3.8-2.6-3.8 2.6 1.4-4-3.2-2.6 4 0z" /></g>
              <text x="63" y="58" textAnchor="middle" fontSize="15" letterSpacing="1">ON SET</text>
              <text x="63" y="74" textAnchor="middle" fontSize="11">28-06-2024</text>
              <text x="63" y="88" textAnchor="middle" fontSize="8">PRODUCTION</text>
            </svg>
          </Stamp>

          <Stamp className="pp-stamp pp-s11 bl" rest={-2} delay={0.49} reduce={reduce}>
            <svg viewBox="0 0 112 70">
              <rect x="3" y="3" width="106" height="64" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <text x="56" y="22" textAnchor="middle" fontSize="7.5" letterSpacing="1">★ SINCE 2024 ★</text>
              <line x1="12" y1="28" x2="100" y2="28" stroke="currentColor" strokeWidth="1" />
              <text x="56" y="46" textAnchor="middle" fontSize="12.5" letterSpacing=".5">15+ BRANDS</text>
              <text x="56" y="60" textAnchor="middle" fontSize="8">10 INDUSTRIES</text>
            </svg>
          </Stamp>
        </div>

        {/* ── data page ── */}
        <div className="pp-pass-lbl">PASSPORT</div>
        {/* Egyptian flag — detailed vector artwork (crisp at any size) */}
        <img
          className="pp-flag"
          src={egFlag}
          alt=""
          width={513}
          height={357}
          loading="lazy"
          aria-hidden="true"
        />

        <div className="pp-photo">
          <img src={photo} alt="Ahmed Maki" width={150} height={206} loading="lazy" />
        </div>

        <div className="pp-fields">
          <div className="pp-lbl">NAME</div>
          <div className="pp-val">AHMED MAKI</div>
          <div className="pp-two">
            <div>
              <div className="pp-lbl">BASED IN</div>
              <div className="pp-val">CAIRO, EGY</div>
            </div>
            <div>
              <div className="pp-lbl">INDUSTRY EXPERIENCE</div>
              <div className="pp-val">15+ BRANDS</div>
            </div>
          </div>
          <div className="pp-gap">
            <div className="pp-lbl">EDUCATIONAL BACKGROUND</div>
            <div className="pp-val">LAW · LL.B</div>
            <div className="pp-indent"><span className="pp-sub">@ AIN SHAMS UNIVERSITY</span></div>
          </div>
          <div className="pp-gap">
            <div className="pp-val">AI ADS &amp; CONTENT CRAFT</div>
            <div className="pp-indent"><span className="pp-sub">@ SELF-DIRECTED</span></div>
          </div>
        </div>

        <div className="pp-dep" aria-hidden="true">
          <svg viewBox="0 0 150 90">
            <rect x="3" y="3" width="144" height="84" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="75" y="26" textAnchor="middle" fontSize="14" letterSpacing="1">CAIRO</text>
            <text x="75" y="42" textAnchor="middle" fontSize="9">EGYPT</text>
            <line x1="16" y1="50" x2="134" y2="50" stroke="currentColor" strokeWidth="1" />
            <text x="75" y="66" textAnchor="middle" fontSize="9">DEPARTED · 2024</text>
            <path d="M26 78 l30 -8 -6 7 5 2 -29 7 z" fill="currentColor" />
            <text x="120" y="80" textAnchor="middle" fontSize="8">DV340</text>
          </svg>
        </div>

        <div className="pp-mrz" aria-hidden="true">
          <span>{MRZ_1}</span>
          <br />
          <span>{MRZ_2}</span>
        </div>
      </motion.div>
    </div>
  );
}
