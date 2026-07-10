import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CONTENT, type Lang, type SiteContent } from "@/content";

type LangCtx = {
  lang: Lang;
  content: SiteContent;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR + first client render must agree → always start "en", then adopt the
  // stored preference in an effect (avoids hydration mismatch).
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("lang");
    if (stored === "ar" || stored === "en") setLang(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = CONTENT[lang].dir;
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  const value: LangCtx = {
    lang,
    content: CONTENT[lang],
    setLang,
    toggle: () => setLang((l) => (l === "en" ? "ar" : "en")),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

// Bilingual toggle: shows both scripts, highlights the active one.
export function LangToggle({ className }: { className?: string }) {
  const { lang, toggle } = useLang();
  return (
    <button
      type="button"
      className={`lang-toggle${className ? " " + className : ""}`}
      onClick={toggle}
      aria-label={lang === "en" ? "التبديل إلى العربية" : "Switch to English"}
      title={lang === "en" ? "العربية" : "English"}
    >
      <span className={lang === "en" ? "is-active" : ""}>EN</span>
      <span className="lang-sep" aria-hidden="true">|</span>
      <span className={lang === "ar" ? "is-active" : ""}>ع</span>
    </button>
  );
}
