import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import ahmedHero from "@/assets/ahmed-hero-cropped.webp";
import ahmedHeroBw from "@/assets/ahmed-hero-bw.webp";
import logoMark from "@/assets/logo-mark.webp";
import BrandMarquee from "@/components/BrandMarquee";
import AnimatedStats from "@/components/AnimatedStats";
import MorphCards from "@/components/MorphCards";
import ServiceIcon from "@/components/ServiceIcon";
import GlassTabBar from "@/components/GlassTabBar";
import PassportCard from "@/components/PassportCard";
import SocialLinks from "@/components/SocialLinks";
import SpotlightReveal from "@/components/SpotlightReveal";
import RotatingBadge from "@/components/RotatingBadge";
import Doodle from "@/components/Doodle";
import VideoReels from "@/components/VideoReels";
import NameReveal from "@/components/NameReveal";
import { useLang, LangToggle } from "@/i18n";
import type { Rich as RichText } from "@/content";

export const Route = createFileRoute("/")({
  component: Index,
});

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

function Index() {
  const { content: c } = useLang();
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
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add("revealed");
              // Reveal once, then stop watching this element. Previously the
              // class was toggled off on exit and re-added on re-entry, so every
              // [data-reveal] near a section edge re-ran its opacity/transform
              // transition on each scroll pass — a real mobile scroll-jank
              // source. One-shot reveal removes that per-scroll churn entirely.
              observer.unobserve(entry.target);
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
    >
      {c.nav.talk}
    </a>
  );

  return (
    <>
      <a href="#main" className="skip-link">{c.a11y.skip}</a>
      {/* Liquid-glass refraction filter — referenced via
          backdrop-filter: url(#lg-refract) (Chromium only) by the video player
          controls, so it lives at page level. It is deliberately NOT applied to
          the fixed nav / tab bar: an SVG displacement backdrop-filter re-runs its
          shader every scroll frame over the moving page (the mobile scroll jank).
          Larger, lower-frequency swells + a softer blur read as a real glass lens
          bending the video behind the controls, rather than a noisy frost. */}
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <filter id="lg-refract" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves={2} seed={7} result="n" />
          <feGaussianBlur in="n" stdDeviation="2" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale={14} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* ══════════ NAV ══════════ */}
      {/* Mobile has no hamburger menu: the top bar slims down to brand + language
          (liquid glass via CSS ≤980px) and navigation moves to the app-style
          glass tab bar in the thumb zone below. */}
      <header className="nav-wrap">
        <nav className="nav container" aria-label="Main">
          <ul className="nav-links nav-left">
            {navItems.slice(0, 3).map((n) => (
              <li key={n.id}>{navLink(n.id, n.label)}</li>
            ))}
          </ul>
          <a href="#home" className="brand" aria-label="Ahmed Maki — home">
            <img className="brand-mark" src={logoMark} alt="Ahmed Maki logo" width={38} height={38} />
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
        </nav>
      </header>
      <GlassTabBar
        active={activeSection}
        labels={{
          home: c.nav.home,
          services: c.nav.services,
          videos: c.nav.videos,
          work: c.nav.work,
          talk: c.nav.talk,
        }}
        ariaLabel={c.a11y.menu}
      />

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
                <MagneticLink className="btn btn-ghost" href="#contact">
                  {c.hero.ctaHire}
                </MagneticLink>
              </div>

              {/* deliberate reference nod: a rotating in-brand sticker in the
                  otherwise-empty lower-left of the stage (desktop only) */}
              <RotatingBadge className="hero-badge" />
            </div>
          </div>
        </section>

        {/* ══════════ MARQUEE ══════════ */}
        <BrandMarquee />

        {/* ══════════ SERVICES ══════════ */}
        <section className="section dark" id="services">
          <div className="container services-wrap">
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
              renderBlob={(i) => <ServiceIcon index={i} />}
            />
          </div>
        </section>

        {/* ══════════ VIDEOS ══════════ */}
        <VideoReels />


        {/* ══════════ ABOUT ══════════ */}
        <section className="section light" id="about">
          <div className="container about-grid">
            <div className="about-visual">
              <PassportCard />
            </div>
            <div className="about-right" data-reveal>
              <p className="eyebrow"><Doodle shape="sparkle" />{c.about.eyebrow}</p>
              <NameReveal sentence="Ahmed Maki" className="about-name" pauseBetweenAnimations={2} />
              <h2 className="section-title"><Rich parts={c.about.title} /></h2>
              <p>{c.about.p1}</p>
              <p>{c.about.p2}</p>
              <AnimatedStats stats={c.about.stats} />
              <div className="about-cta">
                <a
                  className="btn btn-dark"
                  href="/ahmed-maki-cv.pdf"
                  download="Ahmed-Maki-CV.pdf"
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
              gridClassName="stacking-cards"
              cardClassName="card work-card"
              closeLabel={c.a11y.close}
              showTeaser
              stacking
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
            <Doodle shape="arrow" className="cta-band-arrow" />
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
            <p className="eyebrow eyebrow-dark"><Doodle shape="sparkle" />{c.contact.eyebrow}</p>
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
              <img className="brand-mark" src={logoMark} alt="Ahmed Maki logo" width={38} height={38} />
              <span className="brand-word">reelswithmaki</span>
            </a>
            <p>{c.footer}</p>
          </footer>
        </section>
      </main>
    </>
  );
}
