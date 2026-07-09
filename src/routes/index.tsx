import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import easyWayAsset from "@/assets/videos/easy_way.mp4.asset.json";
import golfCityAsset from "@/assets/videos/golf_city.mp4.asset.json";
import renewStoryAsset from "@/assets/videos/renew_story.mp4.asset.json";
import renewStarAsset from "@/assets/videos/renew_star.mp4.asset.json";

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
    orientation: "horizontal",
  },
  {
    title: "Golf City Club — All the Games in One Place",
    tag: "AI Film",
    client: "Sports Club",
    description:
      "Vertical cinematic sports film cut from Veo 3.1 clips with morph transitions for a club with 188K followers.",
    orientation: "vertical",
  },
  {
    title: "Renew Media — The Story You Remember",
    tag: "Stop-Motion",
    client: "Agency · Egypt",
    description:
      "AI stop-motion film for the agency's own 2026 slate — nostalgic Egyptian storytelling, hand-directed shot by shot.",
    orientation: "horizontal",
  },
  {
    title: "Renew Media — Star of the Party",
    tag: "Stop-Motion",
    client: "Agency · KSA",
    description:
      "AI stop-motion film written in Saudi dialect, cut to a VO-first edit — the same system, a new voice.",
    orientation: "horizontal",
  },
];

function Index() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Scroll reveal + section spy + reduced motion handling
  useEffect(() => {
    document.documentElement.classList.add("js");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");

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

    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
        setActiveSection("contact");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      spy?.disconnect();
      window.removeEventListener("scroll", onScroll);
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
      onClick={() => setMobileOpen(false)}
    >
      {label}
    </a>
  );

  return (
    <>
      {/* ══════════ NAV ══════════ */}
      <header className={`nav-wrap${mobileOpen ? " open" : ""}`}>
        <nav className="nav container" aria-label="Main">
          <ul className="nav-links nav-left">
            {navItems.slice(0, 3).map((n) => (
              <li key={n.id}>{navLink(n.id, n.label)}</li>
            ))}
          </ul>
          <a href="#home" className="brand" aria-label="Ahmed Mekki — home">
            <span className="brand-mark">AM</span>
            <span className="brand-word">MEKKI</span>
          </a>
          <ul className="nav-links nav-right">
            {navItems.slice(3).map((n) => (
              <li key={n.id}>{navLink(n.id, n.label)}</li>
            ))}
          </ul>
          <button
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

      <main>
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
                <a className="btn btn-primary" href="#work">
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
        <section className="section dark" id="videos">
          <div className="container">
            <div className="section-head" data-reveal>
              <h2 className="section-title"><span className="accent">Videos</span></h2>
              <p className="section-lede">
                Films directed end to end — script, characters, shots, VO, edit. Drop the MP4s in and they play right here.
              </p>
            </div>
            <div className="videos-grid">
              {VIDEOS.map((v) => (
                <article className="video-card" data-reveal key={v.title}>
                  <div className={`video-frame${v.orientation === "vertical" ? " vertical" : ""}`}>
                    {v.src ? (
                      <video
                        src={v.src}
                        poster={v.poster}
                        controls
                        preload="metadata"
                        playsInline
                      />
                    ) : (
                      <div className="video-empty">Video coming soon</div>
                    )}
                  </div>
                  <div className="video-meta">
                    <div className="work-meta">
                      <span className="tag">{v.tag}</span>
                      <span className="period">{v.client}</span>
                    </div>
                    <h3>{v.title}</h3>
                    <p>{v.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

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
                { tag: "Rebranding", period: "Menswear", title: "Demo Star", body: "Repositioned a 1998 garment factory into a consumer menswear brand: a teardown of six local labels, the campaign line \u201CPresent For Your Day. Ready For Every Day.\u201D, and a 150-idea content catalog." },
                { tag: "AI Film", period: "Legal / IP", title: "Easy Way", body: "\u201CThe Thief Who Stole the Name\u201D — a cinematic AI reel produced end to end: script, character sheets, Veo shots, voice-over, final edit. Plus a 24-idea post bank covering all eight services." },
                { tag: "AI Film", period: "Sports Club", title: "Golf City Club", body: "\u201CAll the Games in One Place\u201D — a vertical cinematic sports film cut from Veo 3.1 clips with morph transitions, plus 20 scripted reel concepts for a club with 188K followers." },
                { tag: "Brand Foundation", period: "Manufacturing", title: "Como Tech", body: "Full foundation for a new wiring-devices maker: identity, tone of voice, a teardown of a 57-year incumbent, a 3-month funnel strategy, and a 60-idea catalog in consumer and B2B editions." },
                { tag: "Insight & Ideas", period: "Automotive", title: "M.A. Motors", body: "One insight carried the account: buyers fear the \u201Chow much do you earn?\u201D question more than the price. Twenty scored concepts built on \u201Cno employment check\u201D, plus a 15-second AI reel." },
                { tag: "Content Engine", period: "Agency · Egypt & KSA", title: "Renew Media", body: "The agency's own engine: a 150-idea catalog for 2026 and two AI stop-motion films, \u201CThe Story You Remember\u201D for Egypt and \u201CStar of the Party\u201D written in Saudi dialect." },
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
              <a className="btn btn-outline" href="tel:+201069989951">+20 106 998 9951</a>
            </div>
            <p className="contact-loc">Cairo, Egypt · Working across Egypt &amp; KSA</p>
          </div>
          <footer className="footer container">
            <a href="#home" className="brand brand-footer">
              <span className="brand-mark">AM</span>
              <span className="brand-word">MEKKI</span>
            </a>
            <p>© 2026 Ahmed Mekki — built by directing the same tools I use for clients.</p>
          </footer>
        </section>
      </main>
    </>
  );
}
