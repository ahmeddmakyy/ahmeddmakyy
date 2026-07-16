import { useEffect, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import StackingCards from "./StackingCards";

export type MorphCardItem = {
  id: string;
  title: string;
  body: string;
  tag?: string;
  period?: string;
};

const CardArrow = () => (
  <span className="card-arrow" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

/**
 * A grid of cards that morph open into a focused panel (framer shared-layout).
 * The collapsed card and the open panel share a `layoutId`, so the box + title
 * physically travel between the two states.
 *
 * - `showTeaser`: Work keeps a clamped body preview (scannable + in the DOM for
 *   SEO); Services collapse to the title only, revealing the body on open.
 * - Accessibility: cards are real buttons; the panel is an aria-modal dialog,
 *   closes on Esc / scrim click, and returns focus to the card it came from.
 * - Reduced motion: renders plain, fully-expanded cards — no morph, all content
 *   visible.
 * - `stacking`: sticky deck layout — cards pin under the nav and each new card
 *   scrolls up to cover the previous one, which scales back (Meeko pattern).
 */
export default function MorphCards({
  items,
  gridClassName,
  cardClassName,
  closeLabel,
  showTeaser = false,
  stacking = false,
  renderBlob,
}: {
  items: MorphCardItem[];
  gridClassName: string;
  cardClassName: string;
  closeLabel: string;
  showTeaser?: boolean;
  stacking?: boolean;
  renderBlob?: (i: number) => ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = items.find((it) => it.id === openId) ?? null;

  const close = () => {
    const id = openId;
    setOpenId(null);
    if (id) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-mc-trigger="${id}"]`)?.focus();
      });
    }
  };

  // aria-modal="true" promises a focus trap; keep Tab/Shift+Tab cycling inside
  // the panel instead of escaping to the still-present page behind the scrim.
  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusables = e.currentTarget.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!openId) return;
    closeRef.current?.focus();
    // Lock background scroll so the page can't drift/scroll behind the panel on
    // mobile while the dialog is open. Locked on <html>, not just <body>: html
    // carries overflow-x:clip (for the sticky decks), which stops body overflow
    // from propagating to the viewport — a body-only lock no longer locks.
    const prevBodyOverflow = document.body.style.overflow;
    const prevRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevRootOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const meta = (it: MorphCardItem) =>
    it.tag ? (
      <div className="work-meta">
        <span className="tag">{it.tag}</span>
        {it.period ? <span className="period">{it.period}</span> : null}
      </div>
    ) : null;

  // Reduced motion → plain fully-expanded cards, no morph.
  if (reduce) {
    return (
      <div className={gridClassName}>
        {items.map((it, i) => (
          <article className={cardClassName} key={it.id}>
            {meta(it)}
            <h3>{it.title}</h3>
            <p>{it.body}</p>
            {renderBlob?.(i)}
          </article>
        ))}
      </div>
    );
  }

  const cards = items.map((it, i) => (
    <motion.button
      type="button"
      key={it.id}
      layoutId={`mc-${it.id}`}
      data-mc-trigger={it.id}
      className={`${cardClassName} mc-trigger`}
      onClick={() => setOpenId(it.id)}
      aria-haspopup="dialog"
      aria-expanded={openId === it.id}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.985 }}
    >
      {/* the corner arrow is the Services affordance; Work already has a
          tag/period row up top, so it would collide there */}
      {!it.tag && <CardArrow />}
      {meta(it)}
      <motion.h3 layoutId={`mct-${it.id}`}>{it.title}</motion.h3>
      {showTeaser ? <p className="mc-teaser">{it.body}</p> : null}
      {renderBlob?.(i)}
    </motion.button>
  ));

  return (
    <>
      {stacking ? (
        <StackingCards className={gridClassName}>{cards}</StackingCards>
      ) : (
        <div className={gridClassName}>{cards}</div>
      )}

      {/* A fixed, viewport-centred layer owns positioning and WRAPS
          AnimatePresence (so scrim + panel stay its two direct children and the
          morph/exit animations are untouched). The panel inside carries no CSS
          transform, leaving framer free to own the panel's transform for the
          shared-layout morph — the previous `translate(-50%,-50%)` centering was
          clobbered by framer and pushed the panel off-screen on mobile. */}
      <div className="morph-layer">
        <AnimatePresence>
          {active && (
            <>
              <motion.div
                className="morph-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                layoutId={`mc-${active.id}`}
                className={`${cardClassName} morph-open`}
                role="dialog"
                aria-modal="true"
                aria-label={active.title}
                onKeyDown={onDialogKeyDown}
              >
                {meta(active)}
                <motion.h3 layoutId={`mct-${active.id}`}>{active.title}</motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.12, duration: 0.34 } }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                >
                  {active.body}
                </motion.p>
                <motion.button
                  ref={closeRef}
                  type="button"
                  className="morph-close"
                  onClick={close}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.14 } }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                >
                  {closeLabel}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
