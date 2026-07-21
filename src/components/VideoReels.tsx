import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLang } from "@/i18n";
import MorphWord from "@/components/MorphWord";
import Doodle from "@/components/Doodle";
import FireFrame from "@/components/FireFrame";
import renewStoryPoster from "@/assets/posters/renew_story.webp";
import renewStarPoster from "@/assets/posters/renew_star.webp";
import easyWayPoster from "@/assets/posters/easy_way.webp";
import golfCityPoster from "@/assets/posters/golf_city.webp";
import alwassefPoster from "@/assets/posters/alwassef.webp";
import alwassefGeelyPoster from "@/assets/posters/alwassef_geely.webp";
import drKashefPoster from "@/assets/posters/dr_kashef.webp";
import textMotionPoster from "@/assets/posters/text_motion.webp";
import letsGoBigPoster from "@/assets/posters/lets_go_big.webp";
import hyperframePoster from "@/assets/posters/hyperframe.webp";
import abbasAppPoster from "@/assets/posters/abbas_app.webp";
import abbasChatPoster from "@/assets/posters/abbas_chatgpt.webp";
import quickLoanPoster from "@/assets/posters/quick_loan.webp";
import demoStarPoster from "@/assets/posters/demo_star.webp";

// Every film is hosted on Cloudinary (cloud "ahmedmakyy") so the source tree
// carries no video weight. Posters stay bundled (a few KB of webp each) for an
// instant first paint of each reel card — the mp4 only loads once a card is
// opened in the lightbox.
const CLOUD = "https://res.cloudinary.com/ahmedmakyy/video/upload";

// Media + a stable, language-independent `slug` (used for shareable deep links,
// ?v=<slug>). Order MUST match CONTENT[lang].videos.
const VIDEO_MEDIA = [
  { slug: "renew-story", src: `${CLOUD}/v1784334179/compressO-renew_media_motion_graphic_ybku0x.mp4`, poster: renewStoryPoster },
  { slug: "renew-star", src: `${CLOUD}/v1784334122/compressO-RENEW_MEDIA_MOTION_KSA_kjlqd8.mp4`, poster: renewStarPoster },
  { slug: "easy-way", src: `${CLOUD}/v1784335254/easy_way_iwy4h2.mp4`, poster: easyWayPoster },
  { slug: "golf-city", src: `${CLOUD}/v1784334512/compressO-%D8%AC%D9%88%D9%84%D9%81_%D8%B3%D9%8A%D8%AA%D9%8A_zzudoe.mp4`, poster: golfCityPoster },
  { slug: "alwassef", src: `${CLOUD}/v1784334088/elwaseef_final_hfkw8g.mp4`, poster: alwassefPoster },
  { slug: "dr-elkashef", src: `${CLOUD}/v1784335848/0625_1_1_l1vbcl.mp4`, poster: drKashefPoster },
  { slug: "story-problem", src: `${CLOUD}/v1784334599/text-motion_muphmj.mp4`, poster: textMotionPoster },
  { slug: "lets-go-big", src: `${CLOUD}/v1784334583/lets-go-big_jhm6wz.mp4`, poster: letsGoBigPoster },
  { slug: "portfolio-in-motion", src: `${CLOUD}/v1784336497/portfolio-hyperframe_ptwnet.mp4`, poster: hyperframePoster },
  { slug: "abbas-app", src: `${CLOUD}/v1784334048/compressO-%D9%85%D8%AD%D9%85%D8%AF_%D8%B9%D8%A8%D8%A7%D8%B3_ui_animation_vid_fbcazt.mp4`, poster: abbasAppPoster },
  { slug: "abbas-chat", src: `${CLOUD}/v1784334561/abbas-motors-chatgpt-ad_kbei7j.mp4`, poster: abbasChatPoster },
  { slug: "quick-loan", src: `${CLOUD}/v1784334687/quick-loan-ui-animation_ebdlro.mp4`, poster: quickLoanPoster },
  { slug: "demo-star", src: `${CLOUD}/v1784334649/demo-star-ui-animation_k10svm.mp4`, poster: demoStarPoster },
  { slug: "alwassef-geely", src: `${CLOUD}/v1784573775/ELWASEEF_GEELY_biqo85.mp4`, poster: alwassefGeelyPoster },
];

// Each labelled reel group shows this list of indices (into VIDEO_MEDIA /
// CONTENT[lang].videos). Order MUST match CONTENT[lang].videosSection.groups.
//   0 Renew Story · 1 Renew Star · 2 Easy Way · 3 Golf City · 4 Alwassef · 5 Dr. ElKashef
//   6 It's a Story Problem · 7 Let's Go Big · 8 Portfolio in Motion
//   9 Abbas App · 10 Abbas Chat · 11 Quick Loan · 12 Demo Star
//   13 Alwassef Geely EX2
// Group 0 (Cinematic AI Films) leads as a FEATURED bento — its first index is
// the hero tile, so put the strongest film there.
const VIDEO_GROUPS: number[][] = [
  [0, 1, 2, 3, 4, 5, 13], // Cinematic AI Films  → featured bento
  [6, 7, 8],              // Motion Graphics & Type
  [9, 10, 11, 12],        // UI Animation
];

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * One 9:16 reel tile: poster + gradient shade, a tag pill, a gradient play
 * button, and the title/client at the bottom. The `hero` variant is the large
 * lead tile of the featured bento (bigger play button + a 2-line teaser). It's a
 * <button> so the whole card is one keyboard-reachable target; children are
 * spans (phrasing content, valid inside a button) styled as blocks. The poster
 * carries `data-liquid` so the cursor liquid-lens can refract it on hover.
 */
function ReelCard({
  gi,
  onPlay,
  variant,
}: {
  gi: number;
  onPlay: (gi: number) => void;
  variant?: "hero";
}) {
  const { content: c } = useLang();
  const media = VIDEO_MEDIA[gi];
  const v = c.videos[gi];
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // A cached poster is already `.complete` on mount and never fires onLoad —
  // without this it would sit at opacity:0 forever behind a cache hit.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <button
      type="button"
      className={`reel-card${variant === "hero" ? " reel-card--hero" : ""}`}
      onClick={() => onPlay(gi)}
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
          loading="lazy"
          decoding="async"
          className={loaded ? "is-loaded" : undefined}
          onLoad={() => setLoaded(true)}
        />
        <span className="reel-tag">{v.tag}</span>
        <span className="reel-play">
          <PlayGlyph />
        </span>
        <span className="reel-shade" />
        <span className="reel-info">
          <span className="reel-title">{v.title}</span>
          <span className="reel-client">{v.client}</span>
          {variant === "hero" && <span className="reel-hero-teaser">{v.description}</span>}
        </span>
      </span>
    </button>
  );
}

/**
 * The flagship group rendered as a FEATURED bento: a large hero tile beside a
 * 3×2 grid of smaller tiles (stacks on tablet/mobile). This breaks the "three
 * identical rows" monotony so his best work leads.
 */
function ReelsFeatured({
  indices,
  label,
  onPlay,
}: {
  indices: number[];
  label: string;
  onPlay: (gi: number) => void;
}) {
  return (
    <div className="reels-block reels-block--featured" data-reveal>
      <div className="reels-head">
        <h3 className="reels-title">
          {label}
          <span className="reels-count">{indices.length}</span>
        </h3>
      </div>
      <div className="reels-featured">
        <ReelCard gi={indices[0]} variant="hero" onPlay={onPlay} />
        <div className="reel-rest">
          {indices.slice(1).map((idx) => (
            <ReelCard key={idx} gi={idx} onPlay={onPlay} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A horizontal, snap-scrolling row of reel cards for one video group. It
 * auto-advances one card at a time (usefayed autoplays its Swiper) but only
 * while the row is on screen and not being hovered/focused/touched, and never
 * under reduced motion. Prev/next arrows move one card and CLAMP at the ends
 * (they never wrap back to the start); each disables itself at its edge.
 */
function ReelsRow({
  indices,
  label,
  onPlay,
}: {
  indices: number[];
  label: string;
  onPlay: (gi: number) => void;
}) {
  const { content: c } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Desktop pauses on mouse hover; touch devices have no hover, so instead we
  // pause for a short idle window after every user gesture (tap / swipe / arrow)
  // and auto-resume once the finger's been off the row for IDLE_MS.
  const hovering = useRef(false);
  const lastGesture = useRef(0);
  const inView = useRef(false);
  const autoDir = useRef(1); // autoplay ping-pongs instead of jumping to start
  const IDLE_MS = 2800;

  // Which arrows are usable — clamped, so each disables itself at its edge.
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  // Card-to-card distance (card width + gap), read live so it stays correct
  // across the responsive width breakpoints.
  const step = () => {
    const t = trackRef.current;
    if (!t) return 0;
    const cards = t.querySelectorAll<HTMLElement>(".reel-card");
    if (cards.length < 2) return cards[0]?.offsetWidth ?? 0;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  };

  const syncEdges = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 2);
    setCanNext(t.scrollLeft + t.clientWidth < t.scrollWidth - 2);
  }, []);

  // Move one card left/right. No wrap — the browser clamps scrollLeft at the
  // bounds, so an arrow at its edge simply does nothing.
  const advance = (dir: number) => {
    const t = trackRef.current;
    const s = step();
    if (!t || !s) return;
    t.scrollBy({ left: dir * s, behavior: "smooth" });
  };

  useEffect(() => {
    syncEdges();
    const onResize = () => syncEdges();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncEdges]);

  useEffect(() => {
    if (reduce) return;
    const t = trackRef.current;
    if (!t) return;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
      },
      { threshold: 0.2 },
    );
    io.observe(t);
    const id = window.setInterval(() => {
      if (hovering.current) return; // mouse is over the row
      if (!inView.current || document.visibilityState !== "visible") return;
      if (Date.now() - lastGesture.current < IDLE_MS) return; // user just touched it
      const tr = trackRef.current;
      if (!tr) return;
      const atEnd = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 8;
      const atStart = tr.scrollLeft <= 8;
      if (atEnd) autoDir.current = -1;
      else if (atStart) autoDir.current = 1;
      advance(autoDir.current);
    }, 3200);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") hovering.current = true;
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") hovering.current = false;
  };
  const nudge = () => {
    lastGesture.current = Date.now();
  };

  return (
    <div className="reels-block" data-reveal>
      <div className="reels-head">
        <h3 className="reels-title">
          {label}
          <span className="reels-count">{indices.length}</span>
        </h3>
        <div className="reels-arrows">
          <button
            type="button"
            className="reels-arrow"
            aria-label={c.videosSection.prev}
            disabled={!canPrev}
            onClick={() => {
              nudge();
              advance(-1);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="reels-arrow"
            aria-label={c.videosSection.next}
            disabled={!canNext}
            onClick={() => {
              nudge();
              advance(1);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div
        className="reels-track"
        ref={trackRef}
        dir="ltr"
        onScroll={syncEdges}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onFocusCapture={() => {
          hovering.current = true;
        }}
        onBlurCapture={() => {
          hovering.current = false;
        }}
        onTouchStart={nudge}
        onTouchMove={nudge}
        onWheel={nudge}
        onPointerDown={nudge}
      >
        {indices.map((idx) => (
          <ReelCard key={idx} gi={idx} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}

function CopyGlyph({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 6.5l1-1a4 4 0 015.6 5.6l-2 2a4 4 0 01-5.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 17.5l-1 1a4 4 0 01-5.6-5.6l2-2a4 4 0 015.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Full-screen lightbox that plays the chosen film (Cloudinary mp4) with native
 * controls. On ≥900px it's a 2-column layout: the film on one side and a large,
 * readable meta panel on the other — meta LEFT / video RIGHT in English, and
 * mirrored (meta RIGHT / video LEFT) in Arabic. A "copy link" button shares a
 * deep link (?v=<slug>) that reopens this exact film. Closes on backdrop click /
 * Escape / the close button, and locks body scroll while open.
 */
function VideoLightbox({ gi, onClose }: { gi: number | null; onClose: () => void }) {
  const { content: c, lang } = useLang();
  const innerRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (gi === null) return;
    setCopied(false);
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
  }, [gi, onClose]);

  const copyLink = async () => {
    if (gi === null) return;
    const url = `${window.location.origin}${window.location.pathname}?v=${VIDEO_MEDIA[gi].slug}`;
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
  const media = VIDEO_MEDIA[gi];
  const v = c.videos[gi];
  return (
    <div
      className="reel-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={v.title}
      onClick={onClose}
    >
      <button type="button" className="reel-lightbox-close" aria-label={c.a11y.close} onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {/* Fiery portal ringing the film frame. Behind the inner in DOM so the
          video paints over the inner glow and the flames lick around its edges;
          pointer-events:none, so the player controls stay clickable. */}
      <FireFrame targetRef={filmRef} onDark={1} radius={16} />
      <div
        className={`reel-lightbox-inner${lang === "ar" ? " is-ar" : ""}`}
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={filmRef}
          className="reel-lightbox-video"
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
 * The Videos section: the animated headline once, then the flagship group as a
 * featured bento, and the remaining groups as labelled reel rows. A single
 * shared lightbox plays whichever card is tapped, and reflects the open film in
 * the URL (?v=<slug>) so a specific reel can be shared and deep-linked.
 */
export default function VideoReels() {
  const { content: c } = useLang();
  const [active, setActive] = useState<number | null>(null);

  const openReel = useCallback((gi: number) => {
    setActive(gi);
    try {
      window.history.replaceState(null, "", `?v=${VIDEO_MEDIA[gi].slug}`);
    } catch {
      /* history blocked — the lightbox still opens */
    }
  }, []);

  const closeReel = useCallback(() => {
    setActive(null);
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      /* ignore */
    }
  }, []);

  // Deep link: ?v=<slug> opens that film straight away and scrolls it into view,
  // so a shared link lands on the reel instead of making the visitor hunt for it.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("v");
    if (!slug) return;
    const idx = VIDEO_MEDIA.findIndex((m) => m.slug === slug);
    if (idx < 0) return;
    setActive(idx);
    const el = document.getElementById("videos");
    if (el) requestAnimationFrame(() => el.scrollIntoView());
  }, []);

  return (
    <section className="section dark videos" id="videos">
      <div className="container">
        <div className="videos-hero" data-reveal>
          <Doodle shape="sparkle" className="videos-hero-spark" />
          <h2>
            {c.videosSection.head[0].t}
            <MorphWord words={c.videosSection.cycle} className="accent" />
            {c.videosSection.head[2].t}
            <span className="accent">{c.videosSection.head[3].t}</span>
          </h2>
          <p>{c.videosSection.sub}</p>
          <Doodle shape="squiggle" className="videos-hero-rule" />
        </div>

        {VIDEO_GROUPS.map((indices, gi) =>
          gi === 0 ? (
            <ReelsFeatured key={gi} indices={indices} label={c.videosSection.groups[gi]} onPlay={openReel} />
          ) : (
            <ReelsRow key={gi} indices={indices} label={c.videosSection.groups[gi]} onPlay={openReel} />
          ),
        )}
      </div>

      <VideoLightbox gi={active} onClose={closeReel} />
    </section>
  );
}
