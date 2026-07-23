import { useCursorFxReduced, toggleCursorFxReduced } from "./cursorFx";
import { useLang } from "@/i18n";

/* A small, standalone CREAM STICKER button pinned in the hero's top-left —
 * beside the floating nav bar. It calms JUST the cursor effects (media liquid
 * water + frame-wrap fire); every other animation on the site stays. The choice
 * persists (localStorage) via the shared cursorFx store.
 *
 * At rest it's a sticker circle (icon only); on hover/focus it MORPHS open into a
 * pill that reveals its label ("Reduce Animations" / "Enable Animations"). The
 * whole grow-from-circle motion is CSS (see .fx-toggle in styles.css).
 *
 * Desktop-only (`display:none` under the tab-bar breakpoint) because the effects
 * it controls are themselves desktop-only — there's nothing to calm on touch. */
export default function CursorFxToggle() {
  const reduced = useCursorFxReduced();
  const { lang } = useLang();

  // Visible morph label = the ACTION the click performs. Ahmed asked for the
  // "Reduce Animations" wording; localise it but keep his exact English string.
  const label = reduced
    ? lang === "ar"
      ? "رجّع الأنيميشن"
      : "Enable Animations"
    : lang === "ar"
      ? "قلّل الأنيميشن"
      : "Reduce Animations";

  return (
    <button
      type="button"
      className={`fx-toggle${reduced ? " is-reduced" : ""}`}
      onClick={() => toggleCursorFxReduced()}
      aria-pressed={reduced}
      aria-label={label}
      title={label}
    >
      {/* ico colour + the slash reveal are set inline (not via a .is-reduced CSS
          rule) because the CSS optimiser was dropping those single-selector
          reduced rules; inline style is immune to that. */}
      <span
        className="fx-toggle-ico"
        style={{ color: reduced ? "var(--heading)" : "var(--orange)" }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none">
          {/* a bold 4-point sparkle + two smaller companions on a clean diagonal —
              a tidier "cursor magic" cluster than the old scattered one. Coloured
              live orange when effects are ON, muted + slashed when reduced. */}
          <path
            className="fx-spark-main"
            d="M11 3.4c.68 4.1 1.82 5.24 5.92 5.92-4.1.68-5.24 1.82-5.92 5.92-.68-4.1-1.82-5.24-5.92-5.92 4.1-.68 5.24-1.82 5.92-5.92Z"
            fill="currentColor"
          />
          <path className="fx-spark-a" d="M18 13.2c.32 1.9.86 2.44 2.76 2.76-1.9.32-2.44.86-2.76 2.76-.32-1.9-.86-2.44-2.76-2.76 1.9-.32 2.44-.86 2.76-2.76Z" fill="currentColor" />
          <path className="fx-spark-b" d="M19.2 3.3c.16 1 .46 1.3 1.46 1.46-1 .16-1.3.46-1.46 1.46-.16-1-.46-1.3-1.46-1.46 1-.16 1.3-.46 1.46-1.46Z" fill="currentColor" />
          {/* slash shown when reduced (opacity/scale inline — see note above) */}
          <line
            className="fx-slash"
            style={{ opacity: reduced ? 0.95 : 0, transform: reduced ? "scale(1)" : "scale(0.4)" }}
            x1="4.4"
            y1="4.4"
            x2="19.6"
            y2="19.6"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="fx-toggle-label">{label}</span>
    </button>
  );
}
