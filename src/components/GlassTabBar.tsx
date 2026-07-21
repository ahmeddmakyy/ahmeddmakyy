// iOS-style floating tab bar for the mobile/app experience (≤980px, see CSS).
// It replaces the hamburger menu: the five destinations that matter on a phone
// (Home / Services / Videos / Work / Let's talk) sit in the thumb zone inside a
// liquid-glass capsule — frosted blur + refraction (url(#lg-refract), Chromium)
// + specular highlight, matching the video player's glass controls.
// About/Process stay reachable by scroll; while they're on screen no tab lights.
// Icons are bespoke stroke SVGs to match the site's hand-drawn icon language.
//
// App-feel details: a SINGLE shared highlight pill (framer layoutId) SLIDES
// between tabs instead of blinking; the tapped tab lights up OPTIMISTICALLY on
// touchdown (before the scroll resolves) so the selection never lags the finger;
// and a subtle haptic tick fires on tap where supported.
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
  contact: () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.5c-4.7 0-8 3.1-8 7 0 2.2 1.1 4.1 2.9 5.4-.1.9-.5 2-1.4 2.9 1.7.1 3.1-.5 4.1-1.2.8.2 1.6.3 2.4.3 4.7 0 8-3.1 8-7s-3.3-7.4-8-7.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
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
  const tabs: { id: keyof typeof TabIcons; label: string; cta?: boolean }[] = [
    { id: "home", label: labels.home },
    { id: "services", label: labels.services },
    { id: "videos", label: labels.videos },
    { id: "work", label: labels.work },
    { id: "contact", label: labels.talk, cta: true },
  ];

  const reduce = useReducedMotion();
  // Optimistic selection: light the tapped tab immediately, then let the parent's
  // scroll-spy `active` reconcile (and clear the override once it agrees).
  const [optimistic, setOptimistic] = useState<string | null>(null);
  useEffect(() => {
    if (optimistic && active === optimistic) setOptimistic(null);
  }, [active, optimistic]);
  const current = optimistic ?? active;

  const onTap = (id: string) => {
    setOptimistic(id);
    // subtle native-style tick (Android/Chrome honour it; iOS Safari no-ops)
    try {
      navigator.vibrate?.(id === "contact" ? 12 : 8);
    } catch {
      /* ignore */
    }
  };

  return (
    <nav className="glass-tabbar" aria-label={ariaLabel}>
      {tabs.map((t) => {
        const Icon = TabIcons[t.id];
        const isActive = current === t.id;
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={`gt-item${t.cta ? " gt-cta" : ""}${isActive ? " active" : ""}`}
            aria-current={isActive ? "location" : undefined}
            onClick={() => onTap(t.id)}
          >
            {isActive && (
              <motion.span
                className="gt-active-pill"
                layoutId="gt-active-pill"
                aria-hidden="true"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 520, damping: 40 }
                }
              />
            )}
            <Icon />
            <span className="gt-label">{t.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
