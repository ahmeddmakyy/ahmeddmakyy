import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import easyWayAsset from "@/assets/videos/easy_way.mp4.asset.json";
import golfCityAsset from "@/assets/videos/golf_city.mp4.asset.json";
import renewStoryAsset from "@/assets/videos/renew_story.mp4.asset.json";
import renewStarAsset from "@/assets/videos/renew_star.mp4.asset.json";
import demoStarVideo from "@/assets/videos/demo-star-ui-animation.mp4";
import quickLoanVideo from "@/assets/videos/quick-loan-ui-animation.mp4";
import ahmedHero from "@/assets/ahmed-hero-cropped.webp";
import logoMark from "@/assets/logo-mark.webp";
import easyWayPoster from "@/assets/posters/easy_way.webp";
import golfCityPoster from "@/assets/posters/golf_city.webp";
import renewStoryPoster from "@/assets/posters/renew_story.webp";
import renewStarPoster from "@/assets/posters/renew_star.webp";
import demoStarPoster from "@/assets/posters/demo_star.webp";
import quickLoanPoster from "@/assets/posters/quick_loan.webp";

export const Route = createFileRoute("/")({
  component: Index,
});

// ────────────────────────────────────────────────────────────
// Videos — replace the `src` values with your uploaded MP4 URLs.
// Set `orientation: "vertical"` for reels (9:16), otherwise 16:9.
// ────────────────────────────────────────────────────────────
type Video = {
  title: string;
  tag: string;
  client: string;
  description: string;
  src?: string;
  poster?: string;
  orientation?: "horizontal" | "vertical";
};

const VIDEOS: Video[] = [
  {
    title: "Easy Way — The Thief Who Stole the Name",
    tag: "AI Film",
    client: "Legal / IP",
    description:
      "Cinematic AI reel produced end to end: script, character sheets, Veo shots, Arabic voice-over, final edit.",
    src: easyWayAsset.url,
    poster: easyWayPoster,
    orientation: "vertical",
  },
  {
    title: "Golf City Club — All Sports in One Place",
    tag: "AI Film",
    client: "Sports Club",
    description:
      "Vertical cinematic sports film cut from Veo 3.1 clips with morph transitions for a club with 188K followers.",
    src: golfCityAsset.url,
    poster: golfCityPoster,
    orientation: "vertical",
  },
  {
    title: "Renew Media — The Story You Remember",
    tag: "Stop-Motion",
    client: "Agency · Egypt",
    description:
      "AI stop-motion film for the agency's own 2026 slate — nostalgic Egyptian storytelling, hand-directed shot by shot.",
    src: renewStoryAsset.url,
    poster: renewStoryPoster,
    orientation: "vertical",
  },
  {
    title: "Renew Media — Star of the Party",
    tag: "Stop-Motion",
    client: "Agency · KSA",
    description:
      "AI stop-motion film written in Saudi dialect, cut to a VO-first edit — the same system, a new voice.",
    src: renewStarAsset.url,
    poster: renewStarPoster,
    orientation: "vertical",
  },
  {
    title: "Demo Star — Men's Fashion Experience",
    tag: "UI Animation",
    client: "Menswear",
    description:
      "A product showcase animated entirely in code — HTML, CSS and JS directed with AI, rendered as a vertical fashion reel for the menswear brand.",
    src: demoStarVideo,
    poster: demoStarPoster,
    orientation: "vertical",
  },
  {
    title: "Quick Loan — Cars & Financing",
    tag: "UI Animation",
    client: "Automotive · Finance",
    description:
      "A UI animation reel for a car showroom and financing brand — designed and animated entirely in code from the brand's own assets.",
    src: quickLoanVideo,
    poster: quickLoanPoster,
    orientation: "vertical",
  },
];

// Isolated so per-frame playback updates never re-render the rest of the page.
function VideosSection() {
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
    const len = VIDEOS.length;
    const next = ((n % len) + len) % len;
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
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Distance around the circular carousel — wraps, unlike |i - videoIndex|
  const circDist = (i: number) => {
    const n = VIDEOS.length;
    const d = Math.abs(i - videoIndex);
    return Math.min(d, n - d);
  };

  const getSlidePos = (i: number): string => {
    const n = VIDEOS.length;
    let d = i - videoIndex;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    if (d === 0) return "0";
    if (d === -1 || d === 1 || d === -2 || d === 2) return String(d);
    return "hidden";
  };

  return (
    <section className="section dark" id="videos">
      <div className="container">
        <div className="videos-hero" data-reveal>
          <h2>
            Every <span className="accent">film</span> starts with an <span className="accent">idea.</span>
          </h2>
          <p>Script, direction, AI production, edit.</p>
        </div>

        <div
          className={`videos-stage${textHidden ? " text-hidden" : ""}`}
          data-reveal
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="videos-track">
            {VIDEOS.map((v, i) => {
              const pos = getSlidePos(i);
              const isActive = pos === "0";
              const count = `${(i + 1).toString().padStart(2, "0")} / ${VIDEOS.length.toString().padStart(2, "0")}`;
              return (
                <article
                  key={v.title}
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
                  {v.src && (
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el;
                      }}
                      // Idle slides carry a src but load nothing (preload="none");
                      // the poster covers them, so no decode until a slide is active.
                      src={circDist(i) <= 1 ? v.src : undefined}
                      poster={v.poster}
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
                  )}
                  {!isActive && (
                    <button
                      type="button"
                      className="slide-clickcatch"
                      aria-label={`Show ${v.title}`}
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
                          aria-label="Rewind 15 seconds"
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
                          aria-label={isPlaying ? "Pause" : "Play"}
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
                          aria-label="Forward 15 seconds"
                          onClick={() => skip(15)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 5V2l5 4-5 4V7a6 6 0 106 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">15</text>
                          </svg>
                        </button>
                      </div>

                      {/* Top-right: hide details */}
                      <button
                        type="button"
                        className="sp-btn sp-corner sp-toggle-text"
                        aria-label={textHidden ? "Show details" : "Hide details"}
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

                      {/* Bottom bar: mute + seek + time */}
                      <div className="sp-bar">
                        <button
                          type="button"
                          className="sp-btn sp-mini"
                          aria-label={isMuted ? "Unmute" : "Mute"}
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
                          aria-label="Seek"
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
            aria-label="Previous film"
            onClick={goPrev}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="videos-dots" role="group" aria-label="Select film">
            {VIDEOS.map((v, i) => (
              <button
                type="button"
                key={v.title}
                aria-label={v.title}
                aria-current={i === videoIndex}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="videos-arrow"
            aria-label="Next film"
            onClick={goNext}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function Index() {
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

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              el.classList.add("revealed");
              observer.unobserve(el);
              const delay = parseFloat(el.style.getPropertyValue("--d")) || 0;
              window.setTimeout(() => {
                el.removeAttribute("data-reveal");
                el.style.removeProperty("--d");
              }, delay * 1000 + 850);
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
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "videos", label: "Videos" },
    { id: "about", label: "About" },
    { id: "work", label: "Work" },
    { id: "process", label: "Process" },
    { id: "contact", label: "Contact" },
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

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
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
            <span className="brand-word">MEKKI</span>
          </a>
          <ul className="nav-links nav-right">
            {navItems.slice(3).map((n) => (
              <li key={n.id}>{navLink(n.id, n.label)}</li>
            ))}
          </ul>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span>
            <span></span>
          </button>
        </nav>
        <div className="nav-mobile" id="mobile-menu">
          {navItems.map((n) => (
            <span key={n.id}>{navLink(n.id, n.label)}</span>
          ))}
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
              Hello!
              <svg className="scribble scribble-badge-r" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path className="draw" d="M8 6 Q20 14 16 26" stroke="#171718" strokeWidth="2.5" strokeLinecap="round" />
                <path className="draw" d="M28 12 Q30 20 24 27" stroke="#171718" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="hero-title load-2">
              <svg className="scribble scribble-title" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                <path className="draw" d="M10 44 Q26 34 42 40" stroke="#FD6F00" strokeWidth="4" strokeLinecap="round" />
                <path className="draw" d="M18 58 Q34 50 50 56" stroke="#FD6F00" strokeWidth="4" strokeLinecap="round" />
                <path className="draw" d="M40 22 Q50 16 60 20" stroke="#FD6F00" strokeWidth="4" strokeLinecap="round" />
              </svg>
              I'm <span className="accent">Ahmed</span>,<br />AI-Native Content Creator
            </h1>

            <div className="hero-stage">
              <div className="hero-circle load-3" aria-hidden="true"></div>
              <img
                className="hero-photo load-4"
                src={ahmedHero}
                alt="Ahmed Mekki, AI-native content creator and AI video director"
                width={750}
                height={1690}
                fetchPriority="high"
              />

              <figure className="hero-note hero-quote load-5">
                <svg className="quote-icon" viewBox="0 0 32 24" fill="#171718" aria-hidden="true">
                  <path d="M0 24V14.4C0 6.6 4.8 1.4 12.6 0l1.8 4.2c-4.4 1.4-6.8 4-7.2 7.8H14V24H0zm18 0V14.4C18 6.6 22.8 1.4 30.6 0l1.4 4.2c-4.4 1.4-6.8 4-7.2 7.8H32V24H18z" />
                </svg>
                <blockquote>
                  The idea, the brief, the taste, and the final call — that part is mine. AI does the heavy lifting.
                </blockquote>
              </figure>

              <div className="hero-note hero-rating load-5">
                <div className="stars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} viewBox="0 0 24 24">
                      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                    </svg>
                  ))}
                </div>
                <strong>15+</strong>
                <span>Clients Served</span>
              </div>

              <div className="glass-cta load-6">
                <a className="btn btn-primary" href="#videos">
                  See My Work
                  <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className="btn btn-ghost" href="mailto:ahmeddmakyy@gmail.com">
                  Hire Me
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ MARQUEE ══════════ */}
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <div className="marquee-group" key={k} aria-hidden={k === 1 || undefined}>
                <span>Veo 3.1</span><i>✦</i><span>Google Flow</span><i>✦</i><span>CapCut</span><i>✦</i><span>Gemini</span><i>✦</i><span>FLUX</span><i>✦</i><span>Midjourney</span><i>✦</i><span>Ideogram</span><i>✦</i><span>ElevenLabs</span><i>✦</i><span>Claude</span><i>✦</i><span>ChatGPT</span><i>✦</i>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ SERVICES ══════════ */}
        <section className="section dark" id="services">
          <div className="container services-wrap">
            <div className="blob blob-float blob-f1" aria-hidden="true"></div>
            <div className="blob blob-float blob-f2" aria-hidden="true"></div>
            <div className="section-head" data-reveal>
              <h2 className="section-title"><span className="accent">Services</span></h2>
              <p className="section-lede">
                Research first, then the idea, then production. Every brand gets a voice built for it — not a template reused fifteen times.
              </p>
            </div>
            <div className="cards-grid services-grid">
              {[
                {
                  title: "Brand Strategy & Content Planning",
                  body: "Competitor teardowns, one owned proposition per brand, weighted content pillars, and 3-month plans with 60–150 fully specified ideas.",
                  blob: "blob-1",
                },
                {
                  title: "AI Video Production",
                  body: "End to end: idea → storyboard → character sheets → Veo prompts → Arabic voice-over → final cut. Consistent characters, shot to shot.",
                  blob: "blob-2",
                },
                {
                  title: "Copywriting & Brand Voice",
                  body: "A distinct voice per client in real Egyptian Arabic — written how people actually talk, reviewed until no AI flavor is left.",
                  blob: "blob-3",
                },
              ].map((s) => (
                <article className="card service-card" data-reveal key={s.title}>
                  <span className="card-arrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <div className={`blob ${s.blob}`} aria-hidden="true"></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ VIDEOS ══════════ */}
        <VideosSection />


        {/* ══════════ ABOUT ══════════ */}
        <section className="section light" id="about">
          <div className="container about-grid">
            <div className="about-left" data-reveal>
              <p className="eyebrow">About Me</p>
              <h2 className="section-title">Law grad turned <span className="accent">creative</span></h2>
            </div>
            <div className="about-right" data-reveal>
              <p>
                I studied law at Ain Shams, then went where the ideas were. At Renew Media I'm the creative mind behind 15+ brands: I do the research, find the one line a brand can own, and turn it into content plans, campaigns, and films.
              </p>
              <p>
                I don't operate cameras or write code. I direct AI tools (Veo, FLUX, Gemini, Claude) the way a director runs a set: the idea, the brief, and the final call are mine. And every word ships in real Egyptian Arabic, reviewed until nothing reads as machine-made.
              </p>
              <dl className="stats-row">
                <div><dt>15+</dt><dd>Clients</dd></div>
                <div><dt>10</dt><dd>Industries</dd></div>
                <div><dt>2</dt><dd>Markets · Egypt &amp; KSA</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ══════════ WORK ══════════ */}
        <section className="section dark" id="work">
          <div className="container">
            <div className="section-head" data-reveal>
              <h2 className="section-title">Selected <span className="accent">Work</span></h2>
              <p className="section-lede">
                Real briefs, real clients, real deliverables: strategy, idea catalogs, and AI films that shipped.
              </p>
            </div>
            <div className="cards-grid work-grid">
              {[
                { tag: "Rebranding", period: "Menswear", title: "Demo Star", body: "Repositioned a 1998 garment factory into a consumer menswear brand: a teardown of six local labels, the campaign line “Present For Your Day. Ready For Every Day.”, and a 150-idea content catalog." },
                { tag: "AI Film", period: "Legal / IP", title: "Easy Way", body: "“The Thief Who Stole the Name” — a cinematic AI reel produced end to end: script, character sheets, Veo shots, voice-over, final edit. Plus a 24-idea post bank covering all eight services." },
                { tag: "AI Film", period: "Sports Club", title: "Golf City Club", body: "“All Sports in One Place” — a vertical cinematic sports film cut from Veo 3.1 clips with morph transitions, plus 20 scripted reel concepts for a club with 188K followers." },
                { tag: "Brand Foundation", period: "Manufacturing", title: "Como Tech", body: "Full foundation for a new wiring-devices maker: identity, tone of voice, a teardown of a 57-year incumbent, a 3-month content strategy, and a 60-idea catalog in consumer and B2B editions." },
                { tag: "Insight & Ideas", period: "Automotive", title: "M.A. Motors", body: "One insight carried the account: buyers fear the “how much do you earn?” question more than the price. Twenty scored concepts built on “no employment check”, plus a 15-second AI reel." },
                { tag: "Content Engine", period: "Agency · Egypt & KSA", title: "Renew Media", body: "The agency's own engine: a 150-idea catalog for 2026 and two AI stop-motion films, “The Story You Remember” for Egypt and “Star of the Party” written in Saudi dialect." },
              ].map((w) => (
                <article className="card work-card" data-reveal key={w.title}>
                  <div className="work-meta">
                    <span className="tag">{w.tag}</span>
                    <span className="period">{w.period}</span>
                  </div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </article>
              ))}
            </div>
            <p className="work-more" data-reveal>
              …plus Geroland, Quick Loan, Trust Motors, Access Laptop, and more across 10 industries.
            </p>
          </div>
        </section>

        {/* ══════════ PROCESS ══════════ */}
        <section className="section light" id="process">
          <div className="container">
            <div className="section-head" data-reveal>
              <h2 className="section-title">How I <span className="accent">Work</span></h2>
              <p className="section-lede">The same system, every client, so quality is a habit, not an accident.</p>
            </div>
            <ol className="process-grid">
              {[
                { n: "01", t: "Context first", b: "A brand knowledge file before any content, sometimes written specifically to brief the AI." },
                { n: "02", t: "Research before creative", b: "Market, competitors, and page audits. Facts kept separate from estimates." },
                { n: "03", t: "Reference-locking", b: "Character sheets and reference images reused across every shot, so faces never drift." },
                { n: "04", t: "Voice-over first", b: "Record and measure the VO, then cut every scene to the audio, not the other way around." },
                { n: "05", t: "Humanize & QA", b: "Review passes until nothing reads as AI: copy, pronunciation, and Arabic letter by letter." },
                { n: "06", t: "Staged delivery", b: "Stage 1 → 2 → 3 client revisions, organized folders, and nothing ever deleted." },
              ].map((s) => (
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
            <p className="eyebrow eyebrow-dark">Contact</p>
            <h2 className="contact-title">
              Got a brand that needs a <span className="accent">voice</span>?
            </h2>
            <p className="contact-lede">Tell me what you're building — I'll tell you how it should sound.</p>
            <div className="contact-cta">
              <a className="btn btn-primary" href="mailto:ahmeddmakyy@gmail.com">
                ahmeddmakyy@gmail.com
                <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                className="btn btn-outline btn-whatsapp"
                href="https://wa.me/201069989951"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message Ahmed on WhatsApp"
              >
                <svg className="wa-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.15-.17.2-.34.22-.63.08-.3-.15-1.24-.46-2.37-1.46-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46 0 1.45 1.06 2.85 1.2 3.05.15.2 2.08 3.18 5.05 4.46.7.3 1.26.48 1.69.62.71.22 1.36.2 1.87.12.57-.09 1.74-.71 1.99-1.4.24-.69.24-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.02 3.5a8.48 8.48 0 0 0-7.22 12.96l-.95 3.47 3.55-.93a8.48 8.48 0 1 0 4.62-15.5zm0 15.55a7.06 7.06 0 0 1-3.6-.99l-.26-.15-2.66.7.71-2.6-.17-.27a7.06 7.06 0 1 1 5.98 3.31z" />
                </svg>
                WhatsApp
              </a>
            </div>
            <p className="contact-loc">Cairo, Egypt · Working across Egypt &amp; KSA</p>
          </div>
          <footer className="footer container">
            <a href="#home" className="brand brand-footer">
              <img className="brand-mark" src={logoMark} alt="Ahmed Mekki logo" width={38} height={38} />
              <span className="brand-word">MEKKI</span>
            </a>
            <p>© 2026 Ahmed Mekki — built by directing the same tools I use for clients.</p>
          </footer>
        </section>
      </main>
    </>
  );
}
