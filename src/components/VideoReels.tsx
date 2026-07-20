import { useEffect, useRef, useState } from "react";
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

// Media only — the localized title/tag/client/description come from
// CONTENT[lang].videos. Order MUST match CONTENT[lang].videos.
const VIDEO_MEDIA = [
  { src: `${CLOUD}/v1784334179/compressO-renew_media_motion_graphic_ybku0x.mp4`, poster: renewStoryPoster },
  { src: `${CLOUD}/v1784334122/compressO-RENEW_MEDIA_MOTION_KSA_kjlqd8.mp4`, poster: renewStarPoster },
  { src: `${CLOUD}/v1784335254/easy_way_iwy4h2.mp4`, poster: easyWayPoster },
  { src: `${CLOUD}/v1784334512/compressO-%D8%AC%D9%88%D9%84%D9%81_%D8%B3%D9%8A%D8%AA%D9%8A_zzudoe.mp4`, poster: golfCityPoster },
  { src: `${CLOUD}/v1784334088/elwaseef_final_hfkw8g.mp4`, poster: alwassefPoster },
  { src: `${CLOUD}/v1784335848/0625_1_1_l1vbcl.mp4`, poster: drKashefPoster },
  { src: `${CLOUD}/v1784334599/text-motion_muphmj.mp4`, poster: textMotionPoster },
  { src: `${CLOUD}/v1784334583/lets-go-big_jhm6wz.mp4`, poster: letsGoBigPoster },
  { src: `${CLOUD}/v1784336497/portfolio-hyperframe_ptwnet.mp4`, poster: hyperframePoster },
  { src: `${CLOUD}/v1784334048/compressO-%D9%85%D8%AD%D9%85%D8%AF_%D8%B9%D8%A8%D8%A7%D8%B3_ui_animation_vid_fbcazt.mp4`, poster: abbasAppPoster },
  { src: `${CLOUD}/v1784334561/abbas-motors-chatgpt-ad_kbei7j.mp4`, poster: abbasChatPoster },
  { src: `${CLOUD}/v1784334687/quick-loan-ui-animation_ebdlro.mp4`, poster: quickLoanPoster },
  { src: `${CLOUD}/v1784334649/demo-star-ui-animation_k10svm.mp4`, poster: demoStarPoster },
  { src: `${CLOUD}/v1784573775/ELWASEEF_GEELY_biqo85.mp4`, poster: alwassefGeelyPoster },
];

// Each labelled reel row shows this list of indices (into VIDEO_MEDIA /
// CONTENT[lang].videos). Order MUST match CONTENT[lang].videosSection.groups.
//   0 Renew Story · 1 Renew Star · 2 Easy Way · 3 Golf City · 4 Alwassef · 5 Dr. ElKashef
//   6 It's a Story Problem · 7 Let's Go Big · 8 Portfolio in Motion
//   9 Abbas App · 10 Abbas Chat · 11 Quick Loan · 12 Demo Star
//   13 Alwassef Geely EX2
const VIDEO_GROUPS: number[][] = [
  [0, 1, 2, 3, 4, 5, 13], // Cinematic AI Films
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
 * One 9:16 reel tile (after usefayed's reel-card): poster + gradient shade,
 * a tag pill, a gradient play button, and the title/client at the bottom.
 * It's a <button> so the whole card is one keyboard-reachable target; children
 * are spans (phrasing content, valid inside a button) styled as blocks.
 */
function ReelCard({ gi, onPlay }: { gi: number; onPlay: (gi: number) => void }) {
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
      className="reel-card"
      onClick={() => onPlay(gi)}
      aria-label={`${c.player.play}: ${v.title}`}
    >
      <span className="reel-thumb">
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
        </span>
      </span>
    </button>
  );
}

/**
 * A horizontal, snap-scrolling row of reel cards for one video group. It
 * auto-advances one card at a time (usefayed autoplays its Swiper) but only
 * while the row is on screen and not being hovered/focused/touched, and never
 * under reduced motion. Prev/next arrows scroll by one card and wrap around.
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
  // and auto-resume once the finger's been off the row for IDLE_MS. That gives
  // mobile the same "get out of the way while I'm interacting" behaviour.
  const hovering = useRef(false);
  const lastGesture = useRef(0);
  const inView = useRef(false);
  const IDLE_MS = 2800;

  // Card-to-card distance (card width + gap), read live so it stays correct
  // across the responsive width breakpoints.
  const step = () => {
    const t = trackRef.current;
    if (!t) return 0;
    const cards = t.querySelectorAll<HTMLElement>(".reel-card");
    if (cards.length < 2) return cards[0]?.offsetWidth ?? 0;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  };

  const advance = (dir: number) => {
    const t = trackRef.current;
    const s = step();
    if (!t || !s) return;
    const atEnd = t.scrollLeft + t.clientWidth >= t.scrollWidth - 8;
    const atStart = t.scrollLeft <= 8;
    let target = t.scrollLeft + dir * s;
    if (dir > 0 && atEnd) target = 0; // loop back to the first card
    if (dir < 0 && atStart) target = t.scrollWidth; // loop to the last
    t.scrollTo({ left: target, behavior: "smooth" });
  };

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
      advance(1);
    }, 3200);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Mouse hover (desktop) pauses indefinitely; touch/keyboard/wheel gestures
  // pause for IDLE_MS and then let autoplay resume.
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
        <h3 className="reels-title">{label}</h3>
        <div className="reels-arrows">
          <button
            type="button"
            className="reels-arrow"
            aria-label={c.videosSection.prev}
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

/**
 * Full-screen lightbox that plays the chosen film (Cloudinary mp4) with native
 * controls. Opens on card click, closes on backdrop click / Escape / the close
 * button, and locks body scroll while open. The mp4 only mounts here, so idle
 * cards never fetch video.
 */
function VideoLightbox({ gi, onClose }: { gi: number | null; onClose: () => void }) {
  const { content: c } = useLang();
  // Ringed by the anime-fire portal (FireFrame). Self-gates desktop + non-reduced
  // motion and only exists while the lightbox is mounted, so its transient WebGL
  // context is disposed the moment the film closes.
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gi === null) return;
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
      <FireFrame targetRef={innerRef} onDark={1} radius={16} />
      <div className="reel-lightbox-inner" ref={innerRef} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
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
          <p>{v.description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The Videos section: the animated headline once, then one labelled reel row
 * per group (Cinematic AI Films / Motion Graphics & Type / UI Animation) in the
 * usefayed reels style. A single shared lightbox plays whichever card is tapped.
 */
export default function VideoReels() {
  const { content: c } = useLang();
  const [active, setActive] = useState<number | null>(null);
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

        {VIDEO_GROUPS.map((indices, gi) => (
          <ReelsRow key={gi} indices={indices} label={c.videosSection.groups[gi]} onPlay={setActive} />
        ))}
      </div>

      <VideoLightbox gi={active} onClose={() => setActive(null)} />
    </section>
  );
}
