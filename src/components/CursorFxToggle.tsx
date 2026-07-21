import { useCursorFxReduced, toggleCursorFxReduced } from "./cursorFx";
import { useLang } from "@/i18n";

/* A small, standalone glass button pinned in the hero's top-left — beside the
 * floating nav bar. It calms JUST the cursor effects (liquid ripple + click
 * fire + frame-wrap fire); every other animation on the site stays. The choice
 * persists (localStorage) via the shared cursorFx store.
 *
 * Desktop-only (`display:none` under the tab-bar breakpoint) because the effects
 * it controls are themselves desktop-only — there's nothing to calm on touch. */
export default function CursorFxToggle() {
  const reduced = useCursorFxReduced();
  const { lang } = useLang();

  const label = reduced
    ? lang === "ar"
      ? "شغّل تأثيرات الماوس (نار + سائل)"
      : "Turn cursor effects back on"
    : lang === "ar"
      ? "هدّي تأثيرات الماوس (نار + سائل)"
      : "Calm the cursor effects";

  return (
    <button
      type="button"
      className={`fx-toggle${reduced ? " is-reduced" : ""}`}
      onClick={() => toggleCursorFxReduced()}
      aria-pressed={reduced}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* a 4-point spark + two small sparks = "cursor magic" */}
        <path
          className="fx-spark-main"
          d="M12 4.5c.5 2.7 1.3 3.5 4 4-2.7.5-3.5 1.3-4 4-.5-2.7-1.3-3.5-4-4 2.7-.5 3.5-1.3 4-4z"
          fill="currentColor"
        />
        <path className="fx-spark-a" d="M18.5 13c.25 1.2.6 1.55 1.8 1.8-1.2.25-1.55.6-1.8 1.8-.25-1.2-.6-1.55-1.8-1.8 1.2-.25 1.55-.6 1.8-1.8z" fill="currentColor" />
        <path className="fx-spark-b" d="M6.5 14c.2.95.5 1.25 1.45 1.45-.95.2-1.25.5-1.45 1.45-.2-.95-.5-1.25-1.45-1.45.95-.2 1.25-.5 1.45-1.45z" fill="currentColor" />
        {/* slash shown when reduced */}
        <line className="fx-slash" x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </button>
  );
}
