// Form primitives for the dashboard.
//
// Bilingual by construction: there is no way to render a content field that
// edits only one language, because a row with an empty _ar is a broken Arabic
// site. Missing translations are flagged inline rather than silently allowed.
import type { ReactNode } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {children}
      {hint && <span className="adm-missing">{hint}</span>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className="adm-input"
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * One label, two inputs — English and Arabic side by side, so a translation
 * can never be forgotten by accident. The Arabic box renders RTL in the real
 * Arabic face, which is how the copy will ship.
 */
export function Bilingual({
  label,
  en,
  ar,
  onEn,
  onAr,
  multiline = false,
  placeholder,
}: {
  label: string;
  en: string;
  ar: string;
  onEn: (v: string) => void;
  onAr: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const missing = en.trim() && !ar.trim() ? "ar" : !en.trim() && ar.trim() ? "en" : null;

  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <div className="adm-bi">
        <div>
          <div className="adm-bi-lang">EN</div>
          {multiline ? (
            <textarea
              className="adm-textarea"
              value={en}
              placeholder={placeholder}
              onChange={(e) => onEn(e.target.value)}
            />
          ) : (
            <input
              className="adm-input"
              value={en}
              placeholder={placeholder}
              onChange={(e) => onEn(e.target.value)}
            />
          )}
        </div>

        <div>
          <div className="adm-bi-lang">عربي</div>
          {multiline ? (
            <textarea
              className="adm-textarea adm-textarea--ar"
              value={ar}
              onChange={(e) => onAr(e.target.value)}
            />
          ) : (
            <input
              className="adm-input adm-input--ar"
              value={ar}
              onChange={(e) => onAr(e.target.value)}
            />
          )}
        </div>
      </div>

      {missing === "ar" && (
        <span className="adm-missing">
          ⚠ Arabic is empty — the Arabic site will show the English text here.
        </span>
      )}
      {missing === "en" && (
        <span className="adm-missing">⚠ English is empty — this will render blank in English.</span>
      )}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="adm-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
