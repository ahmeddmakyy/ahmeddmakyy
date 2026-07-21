/* ────────────────────────────────────────────────────────────────────────────
 * AuroraCursor.webgl — the client-only WebGL2 core of the site-wide CLICK FIRE.
 * Dynamically imported by AuroraCursor.tsx AFTER every perf/support gate has
 * passed, so it never enters the entry bundle and never runs on the server or on
 * mobile.
 *
 * It used to also carry a site-wide warm LIQUID ripple; per request the liquid
 * moved OFF the whole browser and onto media only (see LiquidMedia.*), so this
 * module is now just the fire:
 *   CLICK FIRE BURST — a short blue anime-fire burst on left-mousedown anywhere,
 *   drawn from the shared fire GLSL (fire.glsl.ts) on one canvas / one WebGL2
 *   context, plus a synthesized WebAudio "fwoosh". Never hero-suppressed (a click
 *   should always fire); self-lit so it reads on light and dark. The flame SHAPE
 *   is chosen by WHAT was clicked (pickProfile). A background-luminance probe
 *   feeds uOnDark so the ink outline sits right on light vs dark sections.
 *
 * All look/feel knobs live in TUNING at the top.
 * ──────────────────────────────────────────────────────────────────────────── */

import {
  FIRE_VERT,
  FIRE_MAX_BURSTS,
  FIRE_TUNING,
  FIRE_PROFILE,
  buildBurstFragment,
} from "./fire.glsl";

export interface AuroraController {
  destroy(): void;
}

/* ══════════════════════ TUNING — the only knobs you need ══════════════════════ */
const TUNING = {
  RENDER_SCALE: 0.9, //       backing-store scale vs CSS px (keeps flame edges crisp)
  DPR_CAP: 1, //              device-pixel-ratio ceiling (integrated GPU friendly)
  POINTER_SMOOTH: 0.25, //    smoothed pointer (stabilises the luminance probe)
  ONDARK_EASE: 0.15, //       light↔dark crossfade speed at the pointer
  LUM_EVERY: 8, //            elementFromPoint luminance probe every N frames (it
  //                          forces a hit-test/style flush, so keep it sparse).
  MASTER_VOLUME: 0.5, //      tasteful trim on the fwoosh (fires on EVERY click)
} as const;

/* ── the controller ───────────────────────────────────────────────────────── */

export function createAurora(canvas: HTMLCanvasElement): AuroraController {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  }) as WebGL2RenderingContext | null;

  if (!gl) {
    return { destroy() {} };
  }

  type FireGL = {
    prog: WebGLProgram;
    u: Record<string, WebGLUniformLocation | null>;
  };
  let fire: FireGL | null = null;
  let vao: WebGLVertexArrayObject | null = null;

  function compile(type: number, src: string): WebGLShader {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(s);
      gl!.deleteShader(s);
      throw new Error("aurora shader compile failed: " + log);
    }
    return s;
  }

  function link(vsSrc: string, fsSrc: string): WebGLProgram {
    const vs = compile(gl!.VERTEX_SHADER, vsSrc);
    const fs = compile(gl!.FRAGMENT_SHADER, fsSrc);
    const prog = gl!.createProgram()!;
    gl!.attachShader(prog, vs);
    gl!.attachShader(prog, fs);
    gl!.linkProgram(prog);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) {
      const log = gl!.getProgramInfoLog(prog);
      gl!.deleteProgram(prog);
      throw new Error("aurora link failed: " + log);
    }
    return prog;
  }

  function buildGL() {
    const fprog = link(FIRE_VERT, buildBurstFragment());
    const fNames = ["uScale", "uTime", "uOnDark", "uBursts", "uBurstProf"];
    const fu: Record<string, WebGLUniformLocation | null> = {};
    for (const n of fNames) fu[n] = gl!.getUniformLocation(fprog, n);
    fire = { prog: fprog, u: fu };

    // Empty VAO — the fullscreen triangle is generated from gl_VertexID.
    vao = gl!.createVertexArray()!;

    // premultiplied-alpha compositing.
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
  }

  /* ── sizing (reduced-resolution backing store, DPR-capped) ── */
  let W = 0, H = 0, scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, TUNING.DPR_CAP);
    scale = dpr * TUNING.RENDER_SCALE;
    W = Math.max(1, Math.floor(window.innerWidth * scale));
    H = Math.max(1, Math.floor(window.innerHeight * scale));
    canvas.width = W;
    canvas.height = H;
    gl!.viewport(0, 0, W, H);
  }

  /* ── pointer state (css px) ── */
  let px = window.innerWidth * 0.5, py = window.innerHeight * 0.5; // raw target
  let sx = px, sy = py; // smoothed (feeds the luminance probe)

  const onPointer = (e: PointerEvent | MouseEvent) => {
    px = e.clientX;
    py = e.clientY;
  };

  /* ── click fire bursts (css px, y-UP; matches the burst shader) ── */
  const bursts = new Float32Array(FIRE_MAX_BURSTS * 4);
  const burstProf = new Float32Array(FIRE_MAX_BURSTS); // per-burst silhouette
  for (let i = 0; i < FIRE_MAX_BURSTS; i++) bursts[i * 4 + 2] = -999.0; // inactive
  let bhead = 0;
  let activeBursts = false;

  function spawnBurst(clientX: number, clientY: number, tSec: number, profile: number) {
    const slot = bhead++ % FIRE_MAX_BURSTS;
    const i = slot * 4;
    bursts[i + 0] = clientX;
    bursts[i + 1] = window.innerHeight - clientY; // y-up css px
    bursts[i + 2] = tSec;
    bursts[i + 3] = Math.random() * 10.0;
    burstProf[slot] = profile;
    activeBursts = true;
  }

  /* Which flame shape a click carries, chosen by WHAT was clicked. The user asked
   * for a distinct fire per context; order matters (the CTA lives inside the nav,
   * so it must be tested before the nav). */
  function pickProfile(target: HTMLElement | null): number {
    if (!target) return FIRE_PROFILE.BLOOM;
    if (target.closest(".nav-cta")) return FIRE_PROFILE.HEART; // "Let's talk" in the bar
    if (target.closest("#contact")) return FIRE_PROFILE.HEART; // whole contact section
    if (target.closest(".btn-primary, .btn-ghost, .btn-cta-band"))
      return FIRE_PROFILE.COLUMN; // hero + mid-band marketing CTAs
    if (target.closest("#videos")) return FIRE_PROFILE.RING; // films = portal ring
    if (target.closest(".nav-wrap")) return FIRE_PROFILE.SLASH; // rest of the top bar
    return FIRE_PROFILE.BLOOM;
  }

  /* ── luminance detection -> uOnDark target ── */
  function bgLumAt(x: number, y: number): number {
    let el = document.elementFromPoint(x, y) as HTMLElement | null;
    while (el) {
      const c = getComputedStyle(el).backgroundColor;
      const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (m) {
        const a = m[4] === undefined ? 1 : parseFloat(m[4]);
        if (a > 0.01) {
          const r = +m[1] / 255, g = +m[2] / 255, b = +m[3] / 255;
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
      }
      el = el.parentElement;
    }
    return 1; // assume light
  }

  /* ── eased state ── */
  let onDark = 0, onDarkTarget = 0;

  /* ── WebAudio "fwoosh" (lazy, ported verbatim from the fire prototype) ── */
  let AC: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;

  function initAudio() {
    if (AC) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    AC = new Ctor();
    // graph: gain(0.9) -> compressor -> MASTER_VOLUME trim -> destination
    masterGain = AC.createGain();
    masterGain.gain.value = 0.9;
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.002;
    comp.release.value = 0.18;
    const trim = AC.createGain();
    trim.gain.value = TUNING.MASTER_VOLUME;
    masterGain.connect(comp);
    comp.connect(trim);
    trim.connect(AC.destination);
  }
  function getNoise(ac: AudioContext): AudioBuffer {
    if (noiseBuf) return noiseBuf;
    const len = Math.floor(ac.sampleRate * 0.4);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function fwoosh() {
    if (!AC || !masterGain) return;
    if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime;

    // 1) filtered noise burst, downward-swept bandpass
    const src = AC.createBufferSource(); src.buffer = getNoise(AC);
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(3200, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.26);
    const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 170;
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.85, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(masterGain);
    src.start(t); src.stop(t + 0.34);

    // 2) soft low thump
    const osc = AC.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.17);
    const og = AC.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.55, t + 0.014);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(og); og.connect(masterGain);
    osc.start(t); osc.stop(t + 0.24);

    // 3) crackle transient (very short highpassed noise)
    const cs = AC.createBufferSource(); cs.buffer = getNoise(AC);
    const cf = AC.createBiquadFilter(); cf.type = "highpass"; cf.frequency.value = 2200;
    const cg = AC.createGain();
    cg.gain.setValueAtTime(0.5, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    cs.connect(cf); cf.connect(cg); cg.connect(masterGain);
    cs.start(t); cs.stop(t + 0.1);
  }

  // reduced-motion is already gated by the component, but re-check so a live
  // toggle between mount and first click never plays sound.
  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // left button only, never right-click
    const target = e.target as HTMLElement | null;
    if (target && target.closest("input, textarea, select")) return;
    if (prefersReduced()) return;
    const t = (performance.now() - t0) / 1000;
    // Spawn the flame FIRST so a throwing/blocked AudioContext (some headless /
    // autoplay-restricted contexts) can never swallow the visual burst.
    spawnBurst(e.clientX, e.clientY, t, pickProfile(target));
    try {
      initAudio();
      fwoosh();
    } catch {
      /* sound is optional; the flame already fired */
    }
  };

  /* ── loop ── */
  let rafId = 0;
  let running = false;
  let lost = false;
  const t0 = performance.now();
  let frameNo = 0;
  let lastLum = 1;

  function renderFrame(now: number) {
    rafId = requestAnimationFrame(renderFrame);
    if (!fire || !vao) return;

    const t = (now - t0) / 1000;

    // smooth pointer (only to stabilise the luminance probe)
    sx += (px - sx) * TUNING.POINTER_SMOOTH;
    sy += (py - sy) * TUNING.POINTER_SMOOTH;

    // background luminance under the smoothed pointer (throttled) -> fire onDark
    if (frameNo % TUNING.LUM_EVERY === 0) {
      lastLum = bgLumAt(
        Math.max(0, Math.min(window.innerWidth - 1, sx)),
        Math.max(0, Math.min(window.innerHeight - 1, sy)),
      );
    }
    frameNo++;
    onDarkTarget = lastLum < 0.5 ? 1 : 0;
    onDark += (onDarkTarget - onDark) * TUNING.ONDARK_EASE;

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.bindVertexArray(vao);

    // click fire bursts (only while any are alive)
    if (activeBursts) {
      let anyAlive = false;
      for (let i = 0; i < FIRE_MAX_BURSTS; i++) {
        const st = bursts[i * 4 + 2];
        if (st >= 0 && t - st <= FIRE_TUNING.BURST_LIFE) { anyAlive = true; break; }
      }
      if (anyAlive) {
        const fu = fire.u;
        gl!.useProgram(fire.prog);
        gl!.uniform1f(fu.uScale, scale);
        gl!.uniform1f(fu.uTime, t);
        gl!.uniform1f(fu.uOnDark, onDark);
        gl!.uniform4fv(fu.uBursts, bursts);
        gl!.uniform1fv(fu.uBurstProf, burstProf);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      } else {
        activeBursts = false;
      }
    }
  }

  function startLoop() {
    if (running || lost) return;
    running = true;
    rafId = requestAnimationFrame(renderFrame);
  }
  function stopLoop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ── visibility: pause the loop when the tab is hidden ── */
  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else startLoop();
  };

  /* ── context loss / restore ── */
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    stopLoop();
    fire = null;
    vao = null;
  };
  const onRestored = () => {
    lost = false;
    try {
      buildGL();
      resize();
      if (!document.hidden) startLoop();
    } catch {
      /* leave dark — nothing renders, which is safe under premultiplied blend */
    }
  };

  /* ── boot ── */
  try {
    buildGL();
  } catch {
    return { destroy() {} };
  }
  resize();

  window.addEventListener("resize", resize);
  // pointermove alone covers mouse (pointer:fine gated) — binding mousemove too
  // would double the handler rate for every move on a real mouse.
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("mousedown", onMouseDown);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost, false);
  canvas.addEventListener("webglcontextrestored", onRestored, false);

  if (!document.hidden) startLoop();

  return {
    destroy() {
      stopLoop();
      lost = true;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
      if (fire) { gl!.deleteProgram(fire.prog); fire = null; }
      if (vao) { gl!.deleteVertexArray(vao); vao = null; }
      if (AC) { AC.close().catch(() => {}); AC = null; masterGain = null; noiseBuf = null; }
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
