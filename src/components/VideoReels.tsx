import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCursorFxReduced } from "@/components/cursorFx";
import MorphWord from "@/components/MorphWord";
import Doodle from "@/components/Doodle";
import FireFrame from "@/components/FireFrame";
import { countReelView } from "@/lib/view-counter";

// ─────────────────────────────────────────────────────────────
// Category membership, ordering and the featured pick now come from the
// database (see lib/site-data.ts) and arrive through useLang(). The Videos
// section renders one bounded gallery whose FILTER CHIPS are the three
// categories, so the section height is decoupled from the library size —
// and adding a reel from the dashboard needs no edit in this file.
//   category 0 Cinematic AI Ads · 1 Motion Graphics & Type · 2 UI Animation
// ─────────────────────────────────────────────────────────────
const FILTER_KEYS = ["all", "ads", "motion", "ui"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

type ReelLayout = {
  // The one persistent editorial "featured" reel. Excluded from every filter
  // pool so it never double-renders, and always shown as the stage.
  heroIndex: number;
  // idx → category (used for deep-link chip sync and the role credit).
  groupOf: Record<number, number>;
  // Newest-first within each category, so his latest uploads land in the
  // opening view instead of buried.
  pools: Record<FilterKey, number[]>;
  // Stable full ordering for the lightbox prev/next (hero first, then
  // everything), independent of the current filter so browsing never dead-ends.
  navOrder: number[];
};

function buildLayout(groups: number[][], heroIndex: number): ReelLayout {
  const groupOf: Record<number, number> = {};
  groups.forEach((g, gi) => g.forEach((i) => (groupOf[i] = gi)));

  const poolFor = (gi: number) =>
    (groups[gi] ?? [])
      .filter((i) => i !== heroIndex)
      .slice()
      .reverse();

  const ads = poolFor(0);
  const motion = poolFor(1);
  const ui = poolFor(2);

  const pools: Record<FilterKey, number[]> = {
    all: [...ads, ...motion, ...ui],
    ads,
    motion,
    ui,
  };

  return { heroIndex, groupOf, pools, navOrder: [heroIndex, ...pools.all] };
}

function useReelLayout(): ReelLayout {
  const { groups, heroIndex } = useLang();
  return useMemo(() => buildLayout(groups, heroIndex), [groups, heroIndex]);
}

const categoryKeyForIndex = (idx: number, layout: ReelLayout): FilterKey =>
  idx === layout.heroIndex
    ? "all"
    : ((["ads", "motion", "ui"][layout.groupOf[idx]] as FilterKey) ?? "all");

// A short, language-independent "role" credit for the lightbox — derived from the
// category (not the localized tag string) so it's accurate in EN and AR without
// any per-reel data. The "case-study depth" line, minus the metrics.
function roleCredit(idx: number, lang: "en" | "ar", layout: ReelLayout): string {
  const g = layout.groupOf[idx];
  if (g === 2)
    return lang === "ar"
      ? "فكرة · إخراج واجهات · توجيه الـ AI · مونتاج"
      : "Concept · UI direction · AI direction · edit";
  if (g === 1)
    return lang === "ar" ? "فكرة · موشن ديزاين · مونتاج" : "Concept · motion design · edit";
  return lang === "ar"
    ? "إخراج إبداعي · كتابة برومبتات · ڤويس أوفر ومونتاج"
    : "Creative direction · AI prompt writing · VO & edit";
}

// ── Desktop hover-to-preview ────────────────────────────────────────────────
// Only one preview plays at a time (module-level guard), only on real hover +
// fine pointer, never under reduced-motion, and the clip is a lightweight
// low-res / short Cloudinary rendition fetched on hover intent — never the
// full-weight lightbox mp4. Touch, SSR and reduced-motion mount no <video> at
// all, so there's no hydration mismatch and no bandwidth cost off desktop.
let activePreviewVideo: HTMLVideoElement | null = null;

/**
 * Live, REACTIVE hover capability — deliberately NOT a module-level const.
 * A module const is a one-shot snapshot taken whenever the chunk happens to be
 * evaluated; if that ever ran before the browser settled (or in an odd
 * hydration order) it baked in `false` forever and the preview silently died.
 */
function useHoverCapable(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setOk(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return ok;
}

function previewSrc(src: string): string {
  // Tiny + short so it paints almost immediately on hover. The old
  // w_400/du_12 rendition was ~0.8-1.4MB (~1s), long enough that a normal
  // hover ended while the element was still showing its poster — which looks
  // exactly like "nothing happened".
  return src.replace("/upload/", "/upload/w_320,q_auto:eco,du_6/");
}

/**
 * The <video> stays MOUNTED the whole time previewing is possible (preload="none",
 * so it costs zero network until play() is called). Hover only flips play/pause
 * and opacity — there is no conditional mount, so no ref/effect ordering race can
 * swallow it, which is the class of bug that made this fail silently before.
 */
function useReelPreview(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const armTimer = useRef(0);

  const start = useCallback(() => {
    if (!enabled) return;
    window.clearTimeout(armTimer.current);
    // short intent delay so brushing past a tile never fetches a clip
    armTimer.current = window.setTimeout(() => setPlaying(true), 90);
  }, [enabled]);

  const stop = useCallback(() => {
    window.clearTimeout(armTimer.current);
    setPlaying(false);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      if (activePreviewVideo && activePreviewVideo !== v) activePreviewVideo.pause();
      activePreviewVideo = v;
      void v.play().catch(() => {
        /* a muted clip can still be refused — the poster stays, no harm */
      });
    } else {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* seeking before metadata can throw — harmless */
      }
      if (activePreviewVideo === v) activePreviewVideo = null;
    }
  }, [playing]);

  useEffect(() => () => window.clearTimeout(armTimer.current), []);

  return { videoRef, playing, start, stop };
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * One 9:16 reel tile: poster + gradient shade, a tag pill, a gradient play
 * button, and the title/client at the bottom. It's a <button> so the whole card
 * is one keyboard-reachable target; children are spans (phrasing content, valid
 * inside a button) styled as blocks. The poster carries `data-liquid` so the
 * cursor liquid-lens can refract it on hover. `eager` opts one poster (the stage)
 * out of lazy loading for a fast LCP; every grid/overlay tile stays lazy.
 */
function ReelCard({
  gi,
  onPlay,
  eager,
}: {
  gi: number;
  onPlay: (gi: number) => void;
  eager?: boolean;
}) {
  const { content: c, media: allMedia } = useLang();
  const media = allMedia[gi];
  const v = c.videos[gi];
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();
  const cursorFxReduced = useCursorFxReduced();
  // The preview rides with the fire/liquid: on by default, and it silences
  // together with them the moment the "Reduce Animations" toggle is pressed
  // (and under OS reduced-motion) — not only on the OS setting.
  const previewEnabled = useHoverCapable() && !reduce && !cursorFxReduced;
  const pv = useReelPreview(previewEnabled);

  // A cached poster is already `.complete` on mount and never fires onLoad —
  // without this it would sit at opacity:0 forever behind a cache hit.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <button
      type="button"
      className="reel-card"
      onClick={() => onPlay(gi)}
      // Don't let a mouse click focus-scroll a tall, partly-off-screen card into
      // view (it shifted the page behind the lightbox). preventDefault on
      // mousedown suppresses the focus-scroll for pointer users; keyboard
      // activation (Enter/Space) never fires mousedown, so tab-focus + its
      // focus-return on close are untouched.
      onMouseDown={(e) => e.preventDefault()}
      // Hover-preview arms on the WHOLE card, and listens to both the pointer
      // and mouse families — belt-and-braces so it can never miss a hover.
      onPointerEnter={pv.start}
      onPointerLeave={pv.stop}
      onMouseEnter={pv.start}
      onMouseLeave={pv.stop}
      aria-label={`${c.player.play}: ${v.title}`}
    >
      {/* data-liquid marks the whole tile as a liquid-lens region; the lens
          samples the poster <img> inside it (the tile's overlays sit above the
          image, so the region must be the container, not the img). */}
      <span className="reel-thumb" data-liquid="">
        <img
          ref={imgRef}
          src={media.poster}
          alt=""
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding="async"
          className={loaded ? "is-loaded" : undefined}
          onLoad={() => setLoaded(true)}
        />
        {previewEnabled && (
          <video
            ref={pv.videoRef}
            className="reel-preview"
            // Opacity is set INLINE, not via a class: this project's CSS
            // optimiser has repeatedly dropped rules (it already ate this
            // element's fade-in @keyframes), and inline style is immune.
            style={{ opacity: pv.playing ? 1 : 0 }}
            src={previewSrc(media.src)}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <span className="reel-tag">{v.tag}</span>
        <span className="reel-play">
          <PlayGlyph />
        </span>
        <span className="reel-shade" />
        <span className="reel-info">
          <span className="reel-title">{v.title}</span>
          <span className="reel-client">{v.client}</span>
        </span>
      </span>
    </button>
  );
}

/**
 * The editorial FEATURED STAGE — the strongest reel, held constant across every
 * filter as the section's wow anchor. A tall eager poster with the copy overlaid
 * (a "Featured" kicker, title, client and a 2-line teaser) plus a big play badge.
 * Reuses the whole ReelCard visual language (liquid-lens, shade, play) so it
 * reads as one system, just larger.
 */
function StageCard({ onPlay }: { onPlay: (gi: number) => void }) {
  const { content: c, media: allMedia, heroIndex } = useLang();
  const media = allMedia[heroIndex];
  const v = c.videos[heroIndex];
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();
  const cursorFxReduced = useCursorFxReduced();
  // The preview rides with the fire/liquid: on by default, and it silences
  // together with them the moment the "Reduce Animations" toggle is pressed
  // (and under OS reduced-motion) — not only on the OS setting.
  const previewEnabled = useHoverCapable() && !reduce && !cursorFxReduced;
  const pv = useReelPreview(previewEnabled);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <button
      type="button"
      className="reel-card reel-card--stage"
      onClick={() => onPlay(heroIndex)}
      onMouseDown={(e) => e.preventDefault()}
      onPointerEnter={pv.start}
      onPointerLeave={pv.stop}
      onMouseEnter={pv.start}
      onMouseLeave={pv.stop}
      aria-label={`${c.player.play}: ${v.title}`}
    >
      <span className="reel-thumb" data-liquid="">
        <img
          ref={imgRef}
          src={media.poster}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={loaded ? "is-loaded" : undefined}
          onLoad={() => setLoaded(true)}
        />
        {previewEnabled && (
          <video
            ref={pv.videoRef}
            className="reel-preview"
            // Opacity is set INLINE, not via a class: this project's CSS
            // optimiser has repeatedly dropped rules (it already ate this
            // element's fade-in @keyframes), and inline style is immune.
            style={{ opacity: pv.playing ? 1 : 0 }}
            src={previewSrc(media.src)}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <span className="reel-tag">{v.tag}</span>
        <span className="reel-play">
          <PlayGlyph />
        </span>
        <span className="reel-shade" />
        <span className="reel-info">
          <span className="reel-kicker">
            <Doodle shape="star" className="reel-kicker-star" />
            {c.videosSection.featured}
          </span>
          <span className="reel-title reel-stage-title">{v.title}</span>
          <span className="reel-client">{v.client}</span>
          <span className="reel-stage-desc">{v.description}</span>
        </span>
      </span>
      <Doodle shape="swirl" className="reel-stage-swirl" />
    </button>
  );
}

/**
 * The sticker filter chips as a real ARIA tablist: roving tabindex, Arrow/Home/
 * End keys move focus AND select (automatic activation — the panels are cheap),
 * orange = the active/action colour, a muted tnum count per chip. Reused verbatim
 * in the section and inside the Show-all overlay.
 */
function Chips({
  filter,
  onSelect,
  labels,
  counts,
  ariaLabel,
  idPrefix,
  panelId,
}: {
  filter: FilterKey;
  onSelect: (k: FilterKey) => void;
  labels: string[];
  counts: Record<FilterKey, number>;
  ariaLabel: string;
  idPrefix: string;
  panelId: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = FILTER_KEYS.indexOf(filter);
    let ni: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % FILTER_KEYS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      ni = (i - 1 + FILTER_KEYS.length) % FILTER_KEYS.length;
    else if (e.key === "Home") ni = 0;
    else if (e.key === "End") ni = FILTER_KEYS.length - 1;
    if (ni === null) return;
    e.preventDefault();
    onSelect(FILTER_KEYS[ni]);
    const btns = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    btns?.[ni]?.focus();
  };

  return (
    <div
      className="reels-tabs"
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      ref={listRef}
      onKeyDown={onKeyDown}
    >
      {FILTER_KEYS.map((key, i) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`${idPrefix}-${key}`}
          aria-selected={filter === key}
          aria-controls={panelId}
          tabIndex={filter === key ? 0 : -1}
          className={`reel-chip${filter === key ? " is-active" : ""}`}
          onClick={() => onSelect(key)}
        >
          <span className="reel-chip-label">{labels[i]}</span>
          <span className="reel-chip-count">{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The Show-all overlay: reuses the lightbox backdrop chrome (Esc / backdrop
 * close, body-scroll lock, safe-area padding) and — desktop-only, and ONLY while
 * no reel is open above it — the FireFrame, so two WebGL2 contexts never run at
 * once. Inside, the same chips filter a vertically INTERNALLY-scrolling grid of
 * every reel in the active pool; overflow lives here, never inline in the page.
 */
function ShowAllSheet({
  filter,
  onFilter,
  onPlay,
  onClose,
  labels,
  counts,
  fireOn,
}: {
  filter: FilterKey;
  onFilter: (k: FilterKey) => void;
  onPlay: (gi: number) => void;
  onClose: () => void;
  labels: string[];
  counts: Record<FilterKey, number>;
  fireOn: boolean;
}) {
  const { content: c } = useLang();
  const layout = useReelLayout();
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const pool = layout.pools[filter];

  return (
    <div
      className="reel-allsheet"
      role="dialog"
      aria-modal="true"
      aria-label={c.nav.videos}
      onClick={onClose}
    >
      <button
        type="button"
        className="reel-lightbox-close"
        aria-label={c.a11y.close}
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {/* Guarded: never runs while a reel is open above (single WebGL2 fire). */}
      {fireOn && <FireFrame targetRef={innerRef} onDark={1} radius={20} />}
      <div className="reel-allsheet-inner" ref={innerRef} onClick={(e) => e.stopPropagation()}>
        <div className="reel-allsheet-head">
          <h3 className="reel-allsheet-title">{c.nav.videos}</h3>
          <Chips
            filter={filter}
            onSelect={onFilter}
            labels={labels}
            counts={counts}
            ariaLabel={c.videosSection.filterLabel}
            idPrefix="sheettab"
            panelId="sheetpanel"
          />
        </div>
        <div
          className="reel-allsheet-grid"
          id="sheetpanel"
          role="tabpanel"
          aria-labelledby={`sheettab-${filter}`}
        >
          {pool.map((gi) => (
            <ReelCard key={gi} gi={gi} onPlay={onPlay} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyGlyph({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 6.5l1-1a4 4 0 015.6 5.6l-2 2a4 4 0 01-5.6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 17.5l-1 1a4 4 0 01-5.6-5.6l2-2a4 4 0 015.6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightboxArrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full-screen lightbox that plays the chosen film (Cloudinary mp4) with native
 * controls. On ≥900px it's a 2-column layout: the film on one side and a large,
 * readable meta panel on the other — meta LEFT / video RIGHT in English, and
 * mirrored (meta RIGHT / video LEFT) in Arabic. A "copy link" button shares a
 * deep link (?v=<slug>) that reopens this exact film. Desktop side arrows step
 * through the whole library without closing. It traps focus while open and
 * returns focus to the element that opened it. Closes on backdrop click /
 * Escape / the close button, and locks body scroll while open.
 */
function VideoLightbox({
  gi,
  onClose,
  onNav,
}: {
  gi: number | null;
  onClose: () => void;
  onNav: (gi: number) => void;
}) {
  const { content: c, lang, media: allMedia } = useLang();
  const layout = useReelLayout();
  const dialogRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openedFrom = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const pos = gi === null ? -1 : layout.navOrder.indexOf(gi);
  const hasPrev = pos > 0;
  const hasNext = pos >= 0 && pos < layout.navOrder.length - 1;
  const goPrev = () => {
    if (hasPrev) onNav(layout.navOrder[pos - 1]);
  };
  const goNext = () => {
    if (hasNext) onNav(layout.navOrder[pos + 1]);
  };

  useEffect(() => {
    if (gi === null) return;
    setCopied(false);
    // Remember what to hand focus back to — captured only on the initial open,
    // preserved across prev/next so closing always returns to the trigger.
    const justOpened = !openedFrom.current;
    if (justOpened) openedFrom.current = (document.activeElement as HTMLElement) ?? null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Simple focus trap: Tab wraps within the dialog's focusable elements.
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const f = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], video, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let raf = 0;
    if (justOpened) raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [gi, onClose]);

  // Return focus to the opener once the lightbox is fully closed.
  useEffect(() => {
    if (gi === null && openedFrom.current) {
      const el = openedFrom.current;
      openedFrom.current = null;
      requestAnimationFrame(() => el.focus?.());
    }
  }, [gi]);

  const copyLink = async () => {
    if (gi === null) return;
    const url = `${window.location.origin}${window.location.pathname}?v=${allMedia[gi].slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older / insecure contexts: fall back to a hidden textarea + execCommand.
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* clipboard blocked — nothing we can do */
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (gi === null) return null;
  const media = allMedia[gi];
  const v = c.videos[gi];
  return (
    <div
      className="reel-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={v.title}
      ref={dialogRef}
      onClick={onClose}
    >
      <button
        type="button"
        className="reel-lightbox-close"
        aria-label={c.a11y.close}
        onClick={onClose}
        ref={closeBtnRef}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {/* Desktop-only side arrows: browse the whole library without closing. */}
      <button
        type="button"
        className="reel-lightbox-arrow reel-lightbox-arrow--prev"
        aria-label={c.videosSection.prev}
        disabled={!hasPrev}
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
      >
        <LightboxArrow dir="prev" />
      </button>
      <button
        type="button"
        className="reel-lightbox-arrow reel-lightbox-arrow--next"
        aria-label={c.videosSection.next}
        disabled={!hasNext}
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
      >
        <LightboxArrow dir="next" />
      </button>
      {/* Fiery portal ringing the film frame. Behind the inner in DOM so the
          video paints over the inner glow and the flames lick around its edges;
          pointer-events:none, so the player controls stay clickable. */}
      <FireFrame targetRef={filmRef} onDark={1} radius={24} />
      <div
        className={`reel-lightbox-inner${lang === "ar" ? " is-ar" : ""}`}
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={filmRef}
          className="reel-lightbox-video"
          key={media.src}
          src={media.src}
          poster={media.poster}
          controls
          autoPlay
          playsInline
        />
        <div className="reel-lightbox-meta">
          <span className="reel-lightbox-tag">{v.tag}</span>
          <h4>{v.title}</h4>
          <p className="reel-lightbox-client">{v.client}</p>
          <p className="reel-lightbox-desc">{v.description}</p>
          <p className="reel-lightbox-role">{roleCredit(gi, lang, layout)}</p>
          <button
            type="button"
            className={`reel-copy${copied ? " is-copied" : ""}`}
            onClick={copyLink}
          >
            <CopyGlyph done={copied} />
            <span>{copied ? c.player.copied : c.player.copyLink}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The Videos section: the animated headline, then ONE bounded gallery — an
 * editorial featured stage beside sticker filter chips, a hard-capped grid
 * (6 desktop / 4 mobile, ghost-padded to a constant height) and a "Show all (N)"
 * button that opens an internally-scrolling overlay. The section's height is
 * fixed no matter how many reels exist: overflow lives in the overlay, never
 * inline. A single shared lightbox plays whichever card is tapped and reflects
 * the open film in the URL (?v=<slug>) so a specific reel can be deep-linked.
 */
export default function VideoReels() {
  const { content: c, media: allMedia } = useLang();
  const layout = useReelLayout();
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const cap = isMobile ? 4 : 6;

  const [filter, setFilter] = useState<FilterKey>("all");
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  // Open/close DELIBERATELY do NOT touch window.history. TanStack Router
  // monkey-patches window.history, so a replaceState here is read as a navigation
  // and triggers scroll restoration — which yanked the page behind the lightbox up
  // to the hero every time a reel opened. The shareable link is built on demand
  // from the slug inside copyLink() (it never reads the live URL), so dropping the
  // history write costs nothing but the ?v= in the address bar while a reel is open
  // — and the deep-link read below still lets a fresh ?v=<slug> visit open the reel.
  const openReel = useCallback(
    (gi: number) => {
      setActive(gi);
      countReelView(allMedia[gi]?.slug);
    },
    [allMedia],
  );

  const closeReel = useCallback(() => {
    setActive(null);
  }, []);

  const selectFilter = useCallback((k: FilterKey) => {
    setFilter(k);
    setShowAll(false);
  }, []);

  // Deep link: ?v=<slug> opens that film straight away, syncs the category chip,
  // reveals the Show-all overlay if the tile lives past the capped grid, and
  // scrolls the section into view — so a shared link lands on the reel and, on
  // close, on a view that actually contains it. Wrapped so the chip-sync can
  // never throw before the reel opens.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("v");
    if (!slug) return;
    const idx = allMedia.findIndex((m) => m.slug === slug);
    if (idx < 0) return;
    setActive(idx);
    // A shared ?v= link that lands on a reel is a view like any other.
    countReelView(slug);
    try {
      if (idx !== layout.heroIndex) {
        const key = categoryKeyForIndex(idx, layout);
        setFilter(key);
        // Desktop cap (6) at first paint; if the tile is past it, open the overlay
        // so closing the lightbox reveals it rather than a view that hides it.
        if (layout.pools[key].indexOf(idx) >= 6) setShowAll(true);
      }
    } catch {
      /* chip-sync is best-effort — the reel is already open */
    }
    const el = document.getElementById("videos");
    if (el) requestAnimationFrame(() => el.scrollIntoView());
    // Deep-link read runs once on mount; allMedia/layout are stable for a
    // given page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labels = [c.videosSection.all, ...c.videosSection.groups];
  const counts: Record<FilterKey, number> = {
    all: layout.pools.all.length,
    ads: layout.pools.ads.length,
    motion: layout.pools.motion.length,
    ui: layout.pools.ui.length,
  };

  const pool = layout.pools[filter];
  const shown = pool.slice(0, cap);
  const ghosts = Math.max(0, cap - shown.length);

  const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
  };
  // y-only slide (never opacity-gated): if the entrance ever fails to run — a
  // frozen rAF, a hidden tab — a tile still shows, just settled from a 16px
  // offset, instead of being stuck invisible.
  const tileVariants = reduce
    ? { hidden: {}, show: {} }
    : {
        hidden: { y: 16 },
        show: { y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
      };

  return (
    <section className="section dark videos" id="videos">
      <div className="container">
        <div className="videos-hero" data-reveal>
          <Doodle shape="star" className="videos-hero-spark" />
          <Doodle shape="swirl" className="videos-hero-swirl" />
          <h2>
            {c.videosSection.head[0].t}
            <MorphWord words={c.videosSection.cycle} className="accent" />
            {c.videosSection.head[2].t}
            <span className="accent">{c.videosSection.head[3].t}</span>
          </h2>
          <p>{c.videosSection.sub}</p>
          <Doodle shape="squiggle" className="videos-hero-rule" />
        </div>

        {/* ONE bounded gallery frame. data-reveal lives ONLY here (present at
            mount) — never on the tiles/chips, which mount later on filter change
            and would otherwise be stuck at opacity:0 by the one-shot reveal
            observer; those animate via framer instead. */}
        <div className="reels-gallery" data-reveal>
          <StageCard onPlay={openReel} />

          <Chips
            filter={filter}
            onSelect={selectFilter}
            labels={labels}
            counts={counts}
            ariaLabel={c.videosSection.filterLabel}
            idPrefix="reeltab"
            panelId="reelpanel"
          />

          <div
            className="reels-grid"
            id="reelpanel"
            role="tabpanel"
            aria-labelledby={`reeltab-${filter}`}
            tabIndex={0}
          >
            <motion.div
              className="reels-grid-inner"
              key={filter}
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {shown.map((gi) => (
                <motion.div className="reel-cell" key={gi} variants={tileVariants}>
                  <ReelCard gi={gi} onPlay={openReel} />
                </motion.div>
              ))}
              {Array.from({ length: ghosts }).map((_, i) => (
                <span className="reel-ghost" aria-hidden="true" key={`ghost-${i}`} />
              ))}
            </motion.div>
          </div>

          <div className="reels-foot">
            {pool.length > cap ? (
              <button
                type="button"
                className="btn btn-showall"
                aria-haspopup="dialog"
                onClick={() => setShowAll(true)}
              >
                <span>
                  {c.videosSection.showAll} ({pool.length})
                </span>
                <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 17L17 7M17 7H9M17 7v8"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <p className="reels-allshown">{c.videosSection.allShown}</p>
            )}
          </div>
        </div>
      </div>

      {showAll && (
        <ShowAllSheet
          filter={filter}
          onFilter={setFilter}
          onPlay={openReel}
          onClose={() => setShowAll(false)}
          labels={labels}
          counts={counts}
          fireOn={active === null}
        />
      )}

      <VideoLightbox gi={active} onClose={closeReel} onNav={setActive} />
    </section>
  );
}
