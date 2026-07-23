import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Lang, type SiteContent } from "@/content";
import {
  contentFor,
  fallbackData,
  groupsOf,
  heroIndexOf,
  mediaOf,
  type SiteData,
} from "@/lib/site-data";
import type { VideoMedia } from "@/video-media";

type LangCtx = {
  lang: Lang;
  content: SiteContent;
  setLang: (l: Lang) => void;
  toggle: () => void;
  // Language-independent reel data, derived from the same source as `content`
  // so the two can never disagree about how many reels there are or their order.
  media: VideoMedia[];
  groups: number[][];
  heroIndex: number;
};

const Ctx = createContext<LangCtx | null>(null);

// The hardcoded site, built once. Used when the root loader passed nothing
// (Supabase unconfigured, unreachable, or not migrated yet).
const FALLBACK = fallbackData();

export function LanguageProvider({
  children,
  data,
}: {
  children: ReactNode;
  /** Loaded from Supabase by the root route. Omitted → hardcoded content. */
  data?: SiteData;
}) {
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
    // Layout stays LTR in both languages by request — only the copy swaps.
    // Arabic glyphs still shape/read right-to-left within each element via the
    // Unicode bidi algorithm; the page structure is never mirrored.
    root.dir = "ltr";
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  const siteData = data ?? FALLBACK;

  // Reel order/grouping only changes when the data does, not on every toggle.
  const derived = useMemo(
    () => ({
      media: mediaOf(siteData),
      groups: groupsOf(siteData),
      heroIndex: heroIndexOf(siteData),
    }),
    [siteData],
  );

  const value: LangCtx = useMemo(
    () => ({
      lang,
      content: contentFor(lang, siteData),
      setLang,
      toggle: () => setLang((l) => (l === "en" ? "ar" : "en")),
      ...derived,
    }),
    [lang, siteData, derived],
  );

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
      aria-label={lang === "en" ? "حوّل للعربي" : "Switch to English"}
      title={lang === "en" ? "عربي" : "English"}
    >
      <span className={lang === "en" ? "is-active" : ""}>EN</span>
      <span className="lang-sep" aria-hidden="true">
        |
      </span>
      <span className={lang === "ar" ? "is-active" : ""}>ع</span>
    </button>
  );
}
