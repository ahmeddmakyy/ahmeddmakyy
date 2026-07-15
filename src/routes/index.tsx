import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import easyWayAsset from "@/assets/videos/easy_way.mp4.asset.json";
import golfCityAsset from "@/assets/videos/golf_city.mp4.asset.json";
import renewStoryAsset from "@/assets/videos/renew_story.mp4.asset.json";
import renewStarAsset from "@/assets/videos/renew_star.mp4.asset.json";
import quickLoanVideo from "@/assets/videos/quick-loan-ui-animation.mp4";
import hyperframeVideo from "@/assets/videos/portfolio-hyperframe.mp4";
import abbasAppVideo from "@/assets/videos/abbas-motors-installments-app.mp4";
import abbasChatVideo from "@/assets/videos/abbas-motors-chatgpt-ad.mp4";
import textMotionVideo from "@/assets/videos/text-motion.mp4";
import letsGoBigVideo from "@/assets/videos/lets-go-big.mp4";
import ahmedHero from "@/assets/ahmed-hero-cropped.webp";
import ahmedHeroBw from "@/assets/ahmed-hero-bw.webp";
import logoMark from "@/assets/logo-mark.webp";
import easyWayPoster from "@/assets/posters/easy_way.webp";
import golfCityPoster from "@/assets/posters/golf_city.webp";
import renewStoryPoster from "@/assets/posters/renew_story.webp";
import renewStarPoster from "@/assets/posters/renew_star.webp";
import quickLoanPoster from "@/assets/posters/quick_loan.webp";
import hyperframePoster from "@/assets/posters/hyperframe.webp";
import abbasAppPoster from "@/assets/posters/abbas_app.webp";
import abbasChatPoster from "@/assets/posters/abbas_chatgpt.webp";
import textMotionPoster from "@/assets/posters/text_motion.webp";
import letsGoBigPoster from "@/assets/posters/lets_go_big.webp";
import BrandMarquee from "@/components/BrandMarquee";
import AnimatedStats from "@/components/AnimatedStats";
import MorphCards from "@/components/MorphCards";
import MorphWord from "@/components/MorphWord";
import PassportCard from "@/components/PassportCard";
import SocialLinks from "@/components/SocialLinks";
import SpotlightReveal from "@/components/SpotlightReveal";
import { useLang, LangToggle } from "@/i18n";
import type { Rich as RichText } from "@/content";

export const Route = createFileRoute("/")({
  component: Index,
});

// The four films are hosted on Lovable's CDN. Their asset URLs are root-relative
// (/__l5e/...), which only resolve on the Lovable host — on Vercel they 404.
// Prefix the Lovable origin so both deployments load them (CDN allows CORS + range).
const LOVABLE_CDN = "https://ahmeddmakyy.lovable.app";
const cdn = (u: string) => (u.startsWith("/") ? LOVABLE_CDN + u : u);

// Lower-friction contact: prefill the email draft + the WhatsApp message so the
// first click never lands on a blank compose window.
const MAILTO =
  "mailto:ahmeddmakyy@gmail.com?subject=" +
  encodeURIComponent("Project inquiry — via reelswithmaki") +
  "&body=" +
  encodeURIComponent("Brand:\nWhat you're building:\nTimeline:\n");
const WHATSAPP =
  "https://wa.me/201069989951?text=" +
  encodeURIComponent("Hi Ahmed — saw your portfolio, I'd like to talk about a project.");

// Media only — the localized title/tag/client/description come from CONTENT[lang].
// Order MUST match CONTENT[lang].videos.
const VIDEO_MEDIA = [
  { src: cdn(renewStoryAsset.url), poster: renewStoryPoster },
  { src: cdn(renewStarAsset.url), poster: renewStarPoster },
  { src: cdn(easyWayAsset.url), poster: easyWayPoster },
  { src: cdn(golfCityAsset.url), poster: golfCityPoster },
  { src: textMotionVideo, poster: textMotionPoster },
  { src: letsGoBigVideo, poster: letsGoBigPoster },
  { src: hyperframeVideo, poster: hyperframePoster },
  { src: abbasAppVideo, poster: abbasAppPoster },
  { src: abbasChatVideo, poster: abbasChatPoster },
  { src: quickLoanVideo, poster: quickLoanPoster },
];

// The single carousel is split into labelled groups by video type. Each entry is
// the list of indices (into VIDEO_MEDIA / CONTENT[lang].videos) shown in that
// group's own carousel. Order MUST match CONTENT[lang].videosSection.groups.
//   0 Renew Story · 1 Renew Star · 2 Easy Way · 3 Golf City
//   4 It's a Story Problem · 5 Let's Go Big · 6 Portfolio in Motion
//   7 Abbas App · 8 Abbas Chat · 9 Quick Loan
const VIDEO_GROUPS: number[][] = [
  [0, 1, 2, 3], // Cinematic AI Films
  [4, 5, 6],    // Motion Graphics & Type
  [7, 8, 9],    // UI Animation
];

// Render a Rich[] headline, marking the accent segments.
function Rich({ parts }: { parts: RichText }) {
  return (
    <>
      {parts.map((p, i) =>
        p.accent ? (
          <span key={i} className="accent">
            {p.t}
          </span>
        ) : (
          <Fragment key={i}>{p.t}</Fragment>
        ),
      )}
    </>
  );
}

// A pill link that gently pulls toward the cursor (magnetic). Same markup/classes
// as the plain <a>, so the visual design is unchanged — only the motion is added.
function MagneticLink({
  href,
  className,
  strength = 0.32,
  children,
}: {
  href: string;
  className?: string;
  strength?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 });
  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    // Mouse-only: a touch finger dragging over the button shouldn't drive the
    // magnetic spring (it jitters and fights scrolling on mobile).
    if (reduce || !ref.current || e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };
  return (
    <motion.a
      ref={ref}
      href={href}
      className={`${className ?? ""} btn-magnetic`.trim()}
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.a>
  );
}

// The hero H1, rising in word-by-word. Transform-only with opacity held at 1 keeps
// it LCP-safe: the glyphs paint on first frame; only their position animates.
function HeroTitle({
  pre,
  name,
  post,
  line2,
}: {
  pre: string;
  name: string;
  post: string;
  line2: string;
}) {
  let wi = 0;
  const W = (children: React.ReactNode, key: React.Key) => (
    <span className="hw" style={{ "--wi": wi++ } as React.CSSProperties} key={key}>
      {children}
    </span>
  );
  const l2 = line2.split(" ");
  return (
    <h1 className="hero-title hero-title-cascade">
      <svg className="scribble scribble-title" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <path className="draw" d="M10 44 Q26 34 42 40" stroke="#FD6F00" strokeWidth="4" strokeLinecap="round" />
        <path className="draw" d="M18 58 Q34 50 50 56" stroke="#FD6F00" strokeWidth="4" strokeLinecap="round" />
        <path className="draw" d="M40 22 Q50 16 60 20" stroke="#FD6F00" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {W(pre.trim(), "pre")}{" "}
      {W(
        <>
          <span className="accent">{name}</span>
          {post}
        </>,
        "name",
      )}
      <br />
      {l2.map((w, k) => (
        <Fragment key={"l2" + k}>
          {W(w, "l2w" + k)}
          {k < l2.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </h1>
  );
}

// Isolated so per-frame playback updates never re-render the rest of the page.
// One independent 3D carousel for a single video group. Owns all of its own
// playback state so multiple carousels on the page never fight each other.
function VideoCarousel({ indices, label }: { indices: number[]; label: string }) {
  const { content: c } = useLang();
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoDurations, setVideoDurations] = useState<Record<number, string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textHidden, setTextHidden] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const seekRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const N = indices.length;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Progress is painted imperatively — no React state per timeupdate tick.
  const updateProgressUI = (p: number, t: number) => {
    if (seekRef.current) {
      seekRef.current.value = String(p);
      seekRef.current.style.setProperty("--p", `${p}%`);
    }
    if (timeRef.current) timeRef.current.textContent = formatTime(t);
  };

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2600);
  };

  const showControls = () => {
    setControlsVisible(true);
    if (isPlaying) scheduleHide();
  };

  const goTo = (n: number) => {
    const next = ((n % N) + N) % N;
    setVideoIndex(next);
    setIsPlaying(false);
    setTextHidden(false);
    setControlsVisible(true);
    clearHideTimer();
    updateProgressUI(0, 0);
  };
  const goPrev = () => goTo(videoIndex - 1);
  const goNext = () => goTo(videoIndex + 1);

  // Pause non-active videos when index changes
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([k, v]) => {
      if (!v) return;
      if (Number(k) !== videoIndex) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [videoIndex]);

  // Auto-hide controls while playing
  useEffect(() => {
    if (isPlaying) scheduleHide();
    else {
      clearHideTimer();
      setControlsVisible(true);
    }
    return clearHideTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, videoIndex]);

  const togglePlay = () => {
    const v = videoRefs.current[videoIndex];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRefs.current[videoIndex];
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    showControls();
  };

  const enterFullscreen = () => {
    const v = videoRefs.current[videoIndex];
    if (!v) return;
    const vAny = v as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    // iOS Safari only fullscreens the <video> itself via this call
    if (vAny.webkitEnterFullscreen) {
      vAny.webkitEnterFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (v.requestFullscreen) {
      v.requestFullscreen();
    }
    showControls();
  };

  const skip = (delta: number) => {
    const v = videoRefs.current[videoIndex];
    if (!v) return;
    const d = v.duration || 0;
    v.currentTime = Math.max(0, Math.min(d, v.currentTime + delta));
    if (d) updateProgressUI((v.currentTime / d) * 100, v.currentTime);
    showControls();
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRefs.current[videoIndex];
    if (!v || !v.duration) return;
    const p = Number(e.target.value);
    v.currentTime = (p / 100) * v.duration;
    updateProgressUI(p, v.currentTime);
    showControls();
  };

  const onSlideTap = () => {
    if (!isPlaying) {
      togglePlay();
      return;
    }
    if (controlsVisible) {
      setControlsVisible(false);
      clearHideTimer();
    } else {
      showControls();
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    // Drags that start on the player controls (seek bar etc.) are not swipes
    if ((e.target as HTMLElement).closest(".slide-player")) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      // In RTL the swipe direction is mirrored
      const forward = c.dir === "rtl" ? dx > 0 : dx < 0;
      if (forward) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Distance around the circular carousel — wraps, unlike |i - videoIndex|
  const circDist = (i: number) => {
    const d = Math.abs(i - videoIndex);
    return Math.min(d, N - d);
  };

  const getSlidePos = (i: number): string => {
    let d = i - videoIndex;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    if (d === 0) return "0";
    if (d === -1 || d === 1 || d === -2 || d === 2) return String(d);
    return "hidden";
  };

  return (
    <div className="videos-group" data-reveal>
      <h3 className="videos-group-title">{label}</h3>

      {/* the 3D carousel is a symmetric visual, kept LTR in both languages */}
      <div
        className={`videos-stage${textHidden ? " text-hidden" : ""}`}
        dir="ltr"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="videos-track">
          {indices.map((gi, i) => {
              const media = VIDEO_MEDIA[gi];
              const v = c.videos[gi];
              const pos = getSlidePos(i);
              const isActive = pos === "0";
              const count = `${(i + 1).toString().padStart(2, "0")} / ${N.toString().padStart(2, "0")}`;
              return (
                <article
                  key={i}
                  className={`video-slide${isActive && isPlaying ? " is-playing" : ""}${isActive && controlsVisible ? " show-controls" : ""}`}
                  data-pos={pos}
                  aria-hidden={pos === "hidden"}
                  onClick={() => {
                    if (isActive) onSlideTap();
                    else goTo(i);
                  }}
                  onMouseMove={isActive ? showControls : undefined}
                  onMouseLeave={isActive && isPlaying ? () => { setControlsVisible(false); clearHideTimer(); } : undefined}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    // Idle slides carry a src but load nothing (preload="none");
                    // the poster covers them, so no decode until a slide is active.
                    src={circDist(i) <= 1 ? media.src : undefined}
                    poster={media.poster}
                    muted={!isActive || isMuted}
                    playsInline
                    loop
                    preload={isActive ? "metadata" : "none"}
                    onPlay={() => isActive && setIsPlaying(true)}
                    onPause={() => isActive && setIsPlaying(false)}
                    onTimeUpdate={(e) => {
                      if (!isActive) return;
                      const el = e.currentTarget;
                      if (el.duration) {
                        updateProgressUI((el.currentTime / el.duration) * 100, el.currentTime);
                      }
                    }}
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration;
                      if (!isNaN(d)) {
                        setVideoDurations((prev) =>
                          prev[i] ? prev : { ...prev, [i]: formatTime(d) },
                        );
                      }
                    }}
                  />
                  {!isActive && (
                    <button
                      type="button"
                      className="slide-clickcatch"
                      aria-label={v.title}
                      aria-hidden={pos === "hidden" || undefined}
                      tabIndex={pos === "hidden" ? -1 : undefined}
                      onClick={() => goTo(i)}
                    />
                  )}
                  <div className="slide-shade" />

                  {isActive && (
                    <div className="slide-player" onClick={(e) => e.stopPropagation()}>
                      {/* Center controls: skip -15, play/pause, skip +15 */}
                      <div className="sp-center">
                        <button
                          type="button"
                          className="sp-btn sp-skip"
                          aria-label={c.player.rewind}
                          onClick={() => skip(-15)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 5V2L7 6l5 4V7a6 6 0 11-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">15</text>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`sp-btn sp-play${isPlaying ? " playing" : ""}`}
                          aria-label={isPlaying ? c.player.pause : c.player.play}
                          onClick={togglePlay}
                        >
                          {isPlaying ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <rect x="6" y="5" width="4" height="14" rx="1.2" />
                              <rect x="14" y="5" width="4" height="14" rx="1.2" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          className="sp-btn sp-skip"
                          aria-label={c.player.forward}
                          onClick={() => skip(15)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 5V2l5 4-5 4V7a6 6 0 106 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">15</text>
                          </svg>
                        </button>
                      </div>

                      {/* Top-right: fullscreen + hide details */}
                      <div className="sp-corner-group">
                        <button
                          type="button"
                          className="sp-btn sp-corner-btn"
                          aria-label={c.player.fullscreen}
                          onClick={(e) => {
                            e.stopPropagation();
                            enterFullscreen();
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="sp-btn sp-corner-btn sp-toggle-text"
                          aria-label={textHidden ? c.player.showDetails : c.player.hideDetails}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTextHidden((t) => !t);
                            showControls();
                          }}
                        >
                          {textHidden ? (
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.8" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0112 6c6.5 0 10 7 10 7a15.3 15.3 0 01-3.4 4M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Bottom bar: mute + seek + time */}
                      <div className="sp-bar">
                        <button
                          type="button"
                          className="sp-btn sp-mini"
                          aria-label={isMuted ? c.player.unmute : c.player.mute}
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M4 9v6h4l5 4V5L8 9H4zM16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M4 9v6h4l5 4V5L8 9H4zM16 8a5 5 0 010 8M19 5a9 9 0 010 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        <input
                          ref={seekRef}
                          type="range"
                          min={0}
                          max={100}
                          step={0.1}
                          defaultValue={0}
                          onChange={onSeek}
                          className="sp-seek"
                          aria-label={c.player.seek}
                        />
                        <span className="sp-time">
                          <span ref={timeRef}>0:00</span> / {videoDurations[i] ?? "0:00"}
                        </span>
                      </div>
                    </div>
                  )}


                  <span className="slide-counter">{count}</span>
                  <div className="slide-body">
                    <span className="slide-tag">{v.tag}</span>
                    <h3 className="slide-title">{v.title}</h3>
                    <p className="slide-desc">{v.description}</p>
                    <div className="slide-foot">
                      <span>◷ {videoDurations[i] ?? "—"}</span>
                      <span className="dot">|</span>
                      <span>▤ {v.client}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="videos-controls">
          <button
            type="button"
            className="videos-arrow videos-arrow-prev"
            aria-label={c.videosSection.prev}
            onClick={goPrev}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="videos-dots" role="group" aria-label={c.videosSection.selectFilm}>
            {indices.map((gi, i) => (
              <button
                type="button"
                key={i}
                aria-label={c.videos[gi].title}
                aria-current={i === videoIndex}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="videos-arrow"
            aria-label={c.videosSection.next}
            onClick={goNext}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
  );
}

// The Videos section: the animated intro headline once, then one labelled
// carousel per video group (Cinematic AI Films / Motion Graphics & Type / UI
// Animation). The liquid-glass refraction filter lives here once so every
// group's player controls can reference url(#lg-refract).
function VideosSection() {
  const { content: c } = useLang();
  return (
    <section className="section dark" id="videos">
      {/* Liquid-glass refraction filter for the player controls (referenced by
          backdrop-filter: url(#lg-refract) in styles.css, Chromium only). */}
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <filter id="lg-refract" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves={2} seed={7} result="n" />
          <feGaussianBlur in="n" stdDeviation="1.4" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale={11} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="container">
        <div className="videos-hero" data-reveal>
          <h2>
            {c.videosSection.head[0].t}
            <MorphWord words={c.videosSection.cycle} className="accent" />
            {c.videosSection.head[2].t}
            <span className="accent">{c.videosSection.head[3].t}</span>
          </h2>
          <p>{c.videosSection.sub}</p>
        </div>

        {VIDEO_GROUPS.map((indices, gi) => (
          <VideoCarousel
            key={gi}
            indices={indices}
            label={c.videosSection.groups[gi]}
          />
        ))}
      </div>
    </section>
  );
}

function Index() {
  const { content: c } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Scroll reveal + section spy + reduced motion handling
  useEffect(() => {
    document.documentElement.classList.add("js");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");

    let revealObserver: IntersectionObserver | null = null;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("revealed"));
    } else {
      const groups = new Map<Element, number>();
      items.forEach((el) => {
        const parent = el.parentElement!;
        const index = groups.get(parent) ?? 0;
        el.style.setProperty("--d", index * 0.12 + "s");
        groups.set(parent, index + 1);
      });

      // Replay on every scroll-in: add the class when entering the viewport,
      // remove it when leaving so the CSS transition runs in reverse too.
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              el.classList.add("revealed");
            } else {
              el.classList.remove("revealed");
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      items.forEach((el) => observer.observe(el));
      revealObserver = observer;
    }

    // Section spy
    const ids = ["home", "services", "videos", "about", "work", "process", "contact"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    let spy: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveSection(entry.target.id);
          });
        },
        { rootMargin: "-40% 0px -55% 0px" },
      );
      sections.forEach((section) => spy!.observe(section));
    }

    // The short contact section can slip under the spy's mid-viewport band,
    // so watch the footer directly instead of reading layout on every scroll.
    let bottomSpy: IntersectionObserver | null = null;
    const footer = document.querySelector(".footer");
    if (footer && "IntersectionObserver" in window) {
      bottomSpy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveSection("contact");
          });
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      bottomSpy.observe(footer);
    }

    return () => {
      revealObserver?.disconnect();
      spy?.disconnect();
      bottomSpy?.disconnect();
    };
  }, []);

  const navItems = [
    { id: "home", label: c.nav.home },
    { id: "services", label: c.nav.services },
    { id: "videos", label: c.nav.videos },
    { id: "about", label: c.nav.about },
    { id: "work", label: c.nav.work },
    { id: "process", label: c.nav.process },
    { id: "contact", label: c.nav.contact },
  ];

  const navLink = (id: string, label: string, extra?: string) => (
    <a
      href={`#${id}`}
      className={`nav-link${activeSection === id ? " active" : ""}${extra ? " " + extra : ""}`}
      aria-current={activeSection === id ? "location" : undefined}
      onClick={() => setMobileOpen(false)}
    >
      {label}
    </a>
  );

  // The Contact slot renders as a prominent CTA button (drives the primary
  // action) instead of a plain nav link — no extra nav item, no crowding.
  const navCta = (
    <a
      href="#contact"
      className={`nav-cta${activeSection === "contact" ? " active" : ""}`}
      aria-current={activeSection === "contact" ? "location" : undefined}
      onClick={() => setMobileOpen(false)}
    >
      {c.nav.talk}
    </a>
  );

  return (
    <>
      <a href="#main" className="skip-link">{c.a11y.skip}</a>
      {/* ══════════ NAV ══════════ */}
      <header className={`nav-wrap${mobileOpen ? " open" : ""}`}>
        <nav className="nav container" aria-label="Main">
          <ul className="nav-links nav-left">
            {navItems.slice(0, 3).map((n) => (
              <li key={n.id}>{navLink(n.id, n.label)}</li>
            ))}
          </ul>
          <a href="#home" className="brand" aria-label="Ahmed Mekki — home">
            <img className="brand-mark" src={logoMark} alt="Ahmed Mekki logo" width={38} height={38} />
            <span className="brand-word">reelswithmaki</span>
          </a>
          <ul className="nav-links nav-right">
            {navItems.slice(3, 6).map((n) => (
              <li key={n.id}>{navLink(n.id, n.label)}</li>
            ))}
            <li className="nav-cta-item">{navCta}</li>
            <li className="nav-lang">
              <LangToggle />
            </li>
          </ul>
          <LangToggle className="lang-toggle-mobile" />
          <button
            type="button"
            className="nav-toggle"
            aria-label={c.a11y.menu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span>
            <span></span>
          </button>
        </nav>
        <div className="nav-mobile" id="mobile-menu">
          {navItems.slice(0, 6).map((n) => (
            <span key={n.id}>{navLink(n.id, n.label)}</span>
          ))}
          <span className="nav-cta-mobile">{navCta}</span>
        </div>
      </header>

      <main id="main">
        {/* ══════════ HERO ══════════ */}
        <section className="hero" id="home">
          <div className="container hero-inner">
            <div className="hello-badge load-1">
              <svg className="scribble scribble-badge-l" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path className="draw" d="M32 6 Q20 14 24 26" stroke="#171718" strokeWidth="2.5" strokeLinecap="round" />
                <path className="draw" d="M12 12 Q10 20 16 27" stroke="#171718" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {c.hero.hello}
              <svg className="scribble scribble-badge-r" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path className="draw" d="M8 6 Q20 14 16 26" stroke="#171718" strokeWidth="2.5" strokeLinecap="round" />
                <path className="draw" d="M28 12 Q30 20 24 27" stroke="#171718" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <HeroTitle
              pre={c.hero.line1Pre}
              name={c.hero.name}
              post={c.hero.line1Post}
              line2={c.hero.line2}
            />

            <div className="hero-stage">
              <div className="hero-circle load-3" aria-hidden="true"></div>
              <SpotlightReveal
                className="hero-spot load-4"
                baseSrc={ahmedHeroBw}
                revealSrc={ahmedHero}
                alt={c.hero.photoAlt}
                width={750}
                height={1690}
                priority
                radius={165}
                faceY={0.2}
              />

              <figure className="hero-note hero-quote load-5">
                <svg className="quote-icon" viewBox="0 0 32 24" fill="#171718" aria-hidden="true">
                  <path d="M0 24V14.4C0 6.6 4.8 1.4 12.6 0l1.8 4.2c-4.4 1.4-6.8 4-7.2 7.8H14V24H0zm18 0V14.4C18 6.6 22.8 1.4 30.6 0l1.4 4.2c-4.4 1.4-6.8 4-7.2 7.8H32V24H18z" />
                </svg>
                <blockquote>{c.hero.quote}</blockquote>
              </figure>

              <div className="hero-note hero-rating load-5">
                <strong>{c.hero.ratingNum}</strong>
                <span>{c.hero.ratingLabel}</span>
              </div>

              <div className="glass-cta load-6">
                <MagneticLink className="btn btn-primary" href="#videos">
                  {c.hero.ctaWork}
                  <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </MagneticLink>
                <MagneticLink className="btn btn-ghost" href={MAILTO}>
                  {c.hero.ctaHire}
                </MagneticLink>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ MARQUEE ══════════ */}
        <BrandMarquee />

        {/* ══════════ SERVICES ══════════ */}
        <section className="section dark" id="services">
          <div className="container services-wrap">
            <div className="blob blob-float blob-f1" aria-hidden="true"></div>
            <div className="section-head" data-reveal>
              <h2 className="section-title"><Rich parts={c.services.title} /></h2>
              <p className="section-lede">{c.services.lede}</p>
            </div>
            <MorphCards
              gridClassName="cards-grid services-grid"
              cardClassName="card service-card"
              closeLabel={c.a11y.close}
              items={c.services.cards.map((s, i) => ({
                id: `svc-${i}`,
                title: s.title,
                body: s.body,
              }))}
              renderBlob={(i) => <div className={`blob blob-${i + 1}`} aria-hidden="true" />}
            />
          </div>
        </section>

        {/* ══════════ VIDEOS ══════════ */}
        <VideosSection />


        {/* ══════════ ABOUT ══════════ */}
        <section className="section light" id="about">
          <div className="container about-grid">
            <div className="about-visual">
              <PassportCard />
            </div>
            <div className="about-right" data-reveal>
              <p className="eyebrow">{c.about.eyebrow}</p>
              <h2 className="section-title"><Rich parts={c.about.title} /></h2>
              <p>{c.about.p1}</p>
              <p>{c.about.p2}</p>
              <AnimatedStats stats={c.about.stats} />
              <div className="about-cta">
                <a
                  className="btn btn-dark"
                  href="/ahmed-mekki-cv.pdf"
                  download="Ahmed-Mekki-CV.pdf"
                >
                  {c.about.cv}
                  <svg className="dl-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ WORK ══════════ */}
        <section className="section dark" id="work">
          <div className="container">
            <div className="section-head" data-reveal>
              <h2 className="section-title"><Rich parts={c.work.title} /></h2>
              <p className="section-lede">{c.work.lede}</p>
            </div>
            <MorphCards
              gridClassName="cards-grid work-grid"
              cardClassName="card work-card"
              closeLabel={c.a11y.close}
              showTeaser
              items={c.work.cards.map((w, i) => ({
                id: `wrk-${i}`,
                title: w.title,
                body: w.body,
                tag: w.tag,
                period: w.period,
              }))}
            />
            <p className="work-more" data-reveal>{c.work.more}</p>
          </div>
        </section>

        {/* ══════════ MID-PAGE CTA BAND ══════════ */}
        <section className="cta-band" aria-labelledby="cta-band-text">
          <div className="container cta-band-inner" data-reveal>
            <p className="cta-band-text" id="cta-band-text">{c.midCta.text}</p>
            <a className="btn btn-cta-band" href="#contact">
              {c.midCta.button}
              <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>

        {/* ══════════ PROCESS ══════════ */}
        <section className="section light" id="process">
          <div className="container">
            <div className="section-head" data-reveal>
              <h2 className="section-title"><Rich parts={c.process.title} /></h2>
              <p className="section-lede">{c.process.lede}</p>
            </div>
            <ol className="process-grid">
              {c.process.steps.map((s) => (
                <li className="step" data-reveal key={s.n}>
                  <span className="step-num">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ══════════ CONTACT ══════════ */}
        <section className="section dark contact" id="contact">
          <div className="container contact-inner" data-reveal>
            <p className="eyebrow eyebrow-dark">{c.contact.eyebrow}</p>
            <h2 className="contact-title"><Rich parts={c.contact.title} /></h2>
            <p className="contact-lede">{c.contact.lede}</p>
            <div className="contact-cta">
              <a
                className="morph-btn morph-btn-primary"
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp — ${c.contact.whatsapp}`}
              >
                <span className="mb-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.47 14.38c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.15-.17.2-.34.22-.63.08-.3-.15-1.24-.46-2.37-1.46-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46 0 1.45 1.06 2.85 1.2 3.05.15.2 2.08 3.18 5.05 4.46.7.3 1.26.48 1.69.62.71.22 1.36.2 1.87.12.57-.09 1.74-.71 1.99-1.4.24-.69.24-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.02 3.5a8.48 8.48 0 0 0-7.22 12.96l-.95 3.47 3.55-.93a8.48 8.48 0 1 0 4.62-15.5zm0 15.55a7.06 7.06 0 0 1-3.6-.99l-.26-.15-2.66.7.71-2.6-.17-.27a7.06 7.06 0 1 1 5.98 3.31z" />
                  </svg>
                </span>
                <span className="mb-label">{c.contact.whatsapp}</span>
              </a>
              <a className="morph-btn morph-btn-outline" href={MAILTO} aria-label="ahmeddmakyy@gmail.com">
                <span className="mb-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 5.5h16a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3.4 6.6L12 12.6l8.6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="mb-label">ahmeddmakyy@gmail.com</span>
              </a>
            </div>
            <SocialLinks />
            <p className="contact-loc">{c.contact.loc}</p>
          </div>
          <footer className="footer container">
            <a href="#home" className="brand brand-footer">
              <img className="brand-mark" src={logoMark} alt="Ahmed Mekki logo" width={38} height={38} />
              <span className="brand-word">reelswithmaki</span>
            </a>
            <p>{c.footer}</p>
          </footer>
        </section>
      </main>
    </>
  );
}
