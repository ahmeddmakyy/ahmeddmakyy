// "LUMEN DOCK" — the mobile/app navigation (≤980px, see CSS). A dark liquid-glass
// dock that holds FOUR icon-only nav glyphs (Home / Services / Videos / Work) and,
// past a hairline divider, ONE always-on orange "ember" CTA (Let's talk). It
// replaces the hamburger and lives in the thumb zone.
//
// The idea that makes it feel native, not web: selection is a BRIGHT CREAM LENS
// that rises out of the dark glass and SLIDES between the four equal nav slots
// (framer layoutId → pure translateX, the cheapest possible), carrying the ONLY
// visible label. Because the label always rides its own near-opaque cream tile,
// its contrast (ink-on-cream ≈ 15:1) is guaranteed no matter what scrolls behind —
// which lets the glass itself stay light/translucent. Orange means exactly ONE
// thing here: the action. Navigation never turns orange.
//
// App-feel + perf: the tapped tab lights OPTIMISTICALLY on touchdown (before the
// scroll resolves) with a subtle haptic tick; the active glyph lifts and its
// outline fills in (the native "seats on select" moment); only transform/opacity
// ever animate and there is exactly ONE backdrop-filter (the capsule) — smooth on
// low-end Android. About/Process stay reachable by scroll; while they're on screen
// no tab lights. Idle glyphs are icon-only, so each carries an aria-label.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const TabIcons = {
  home: () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4V15h-5v5.5h-4A1.5 1.5 0 0 1 4 19v-8.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  services: () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  videos: () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10.5 9.5v5l4.2-2.5-4.2-2.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  work: () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3.5 12.5h17" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  // CTA glyph: a paper-plane ("start the conversation / send") — more action-forward
  // than a chat bubble, reinforcing that the orange ember is a DIFFERENT job.
  contact: () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.5 3.5 3.8 10.2c-.8.3-.8 1.5.05 1.7l6.35 1.7 1.7 6.35c.25.85 1.45.85 1.75.05L20.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20.5 3.5 10.2 13.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function GlassTabBar({
  active,
  labels,
  ariaLabel,
}: {
  active: string;
  labels: { home: string; services: string; videos: string; work: string; talk: string };
  ariaLabel: string;
}) {
  const navTabs: { id: keyof typeof TabIcons; label: string }[] = [
    { id: "home", label: labels.home },
    { id: "services", label: labels.services },
    { id: "videos", label: labels.videos },
    { id: "work", label: labels.work },
  ];

  const reduce = useReducedMotion();
  // Optimistic selection: light the tapped tab immediately, then let the parent's
  // scroll-spy `active` reconcile (and clear the override once it agrees).
  const [optimistic, setOptimistic] = useState<string | null>(null);
  useEffect(() => {
    if (optimistic && active === optimistic) setOptimistic(null);
  }, [active, optimistic]);
  const current = optimistic ?? active;
  const ctaActive = current === "contact";

  // Fire on POINTERDOWN, not click: the lens slide + haptic land on touchdown
  // (<100ms, native feel) instead of after the synthetic click. The <a href> still
  // handles the real navigation on click.
  const onDown = (id: string) => {
    setOptimistic(id);
    try {
      navigator.vibrate?.(id === "contact" ? 12 : 8);
    } catch {
      /* ignore */
    }
  };

  return (
    <nav className="glass-tabbar" aria-label={ariaLabel}>
      <div className="gt-nav">
        {navTabs.map((t) => {
          const Icon = TabIcons[t.id];
          const isActive = current === t.id;
          return (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={`gt-item${isActive ? " active" : ""}`}
              aria-label={t.label}
              aria-current={isActive ? "location" : undefined}
              onPointerDown={() => onDown(t.id)}
            >
              {isActive && (
                <motion.span
                  className="gt-lens"
                  layoutId="gt-lens"
                  aria-hidden="true"
                  style={{ willChange: "transform" }}
                  transition={
                    reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38, mass: 0.9 }
                  }
                />
              )}
              <span className="gt-icon">
                <Icon />
              </span>
              <span className="gt-label">{t.label}</span>
            </a>
          );
        })}
      </div>

      <span className="gt-divider" aria-hidden="true" />

      <a
        href="#contact"
        className={`gt-cta${ctaActive ? " active" : ""}`}
        aria-current={ctaActive ? "location" : undefined}
        onPointerDown={() => onDown("contact")}
      >
        <span className="gt-icon">
          <TabIcons.contact />
        </span>
        <span className="gt-label">{labels.talk}</span>
      </a>
    </nav>
  );
}
