/* ────────────────────────────────────────────────────────────────────────────
 * AuroraCursor.webgl — the heavy, client-only WebGL2 core of the site-wide warm
 * cursor. Dynamically imported by AuroraCursor.tsx AFTER every perf/support gate
 * has passed, so it never enters the entry bundle and never runs on the server
 * or on mobile.
 *
 * TWO effects share this ONE canvas / ONE WebGL2 context (no extra contexts):
 *   1. LIQUID RIPPLE cursor — ported from prototype liquidA. Procedural
 *      concentric ripples spawned along the smoothed pointer path (radially
 *      symmetric → STABLE, never flips direction), warm molten palette, per-pixel
 *      surface-normal + specular/caustic shade, small & localized (~200–260px),
 *      settling to nothing at rest. The uOnDark light/dark luminance adaptation,
 *      hero suppression (uMaster), premultiplied blend, render scale, DPR cap,
 *      context-loss handling and teardown are all preserved.
 *      ART-DIRECTOR FIX: on LIGHT it now ETCHES rather than hazes — deep maroon
 *      trough banding + thin bright gold specular crest lines = engraved grooves.
 *   2. CLICK FIRE BURST — a short anime-fire burst on left-mousedown anywhere,
 *      drawn as a SECOND program (shared fire GLSL, see fire.glsl.ts) on this
 *      same canvas, plus a synthesized WebAudio "fwoosh". Not hero-suppressed
 *      (a click should always fire); self-lit so it reads on light and dark.
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

export interface AuroraOptions {
  /** Live-read flag: while #home (the hero) is on screen the master opacity is
   *  eased to ~0 so the liquid doesn't fight the hero's own particle field +
   *  cursor ring + portrait loupe. Owned by the React component's IO. Only the
   *  LIQUID is suppressed — click bursts fire everywhere. */
  heroVisible: { current: boolean };
}

/* ══════════════════════ TUNING — the only knobs you need ══════════════════════ */
const TUNING = {
  // — global feel —
  MASTER_INTENSITY: 0.95, //  opacity ceiling of the LIQUID (bursts are always full)
  RENDER_SCALE: 0.9, //       backing-store scale vs CSS px (near-native keeps the
  //                          etched crest lines crisp; the effect early-outs on
  //                          most pixels so full-ish res stays cheap)
  DPR_CAP: 1, //              device-pixel-ratio ceiling (integrated GPU friendly)

  // — liquid ripple field (finer + smaller per feedback: tighter footprint,
  //   shorter wavelength, thinner crest lines) —
  MAX_RIPPLES: 28, //         ripple sources held in the uniform array
  RIPPLE_STEP: 12, //         px between ripple seeds spawned along the path
  RIPPLE_LIFE: 1.15, //       seconds a ripple lives before it is culled (was 1.5)
  POINTER_SMOOTH: 0.25, //    smoothed-pointer follow (per frame @60)
  ONDARK_EASE: 0.15, //       light↔dark crossfade speed at the pointer
  MASTER_EASE: 0.05, //       hero-suppression ramp speed

  // — housekeeping —
  LUM_EVERY: 3, //            run the elementFromPoint luminance probe every N frames

  // — click fire —
  MASTER_VOLUME: 0.5, //      tasteful trim on the fwoosh (fires on EVERY click)
} as const;

/* ── LIQUID shaders (GLSL ES 3.00 / WebGL2) ───────────────────────────────── */

// Fullscreen triangle, no attribute buffer — shared vertex shader.
const VERT = FIRE_VERT;

const LIQUID_FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2  uResCss;   // viewport size in CSS px
uniform float uScale;    // css px -> backing px (gl_FragCoord / uScale = css px)
uniform float uTime;
uniform int   uCount;
uniform vec3  uRip[${TUNING.MAX_RIPPLES}];  // x, y (css px, y down), birth time
uniform float uOnDark;   // 0 = light bg, 1 = dark bg (smoothed at pointer)
uniform float uMaster;   // hero suppression * MASTER_INTENSITY

// palette
const vec3 ORANGE      = vec3(0.992,0.435,0.000); // FD6F00
const vec3 ORANGE_DEEP = vec3(0.890,0.388,0.000); // E36300
const vec3 ORANGE_SOFT = vec3(0.996,0.647,0.373); // FEA55F
const vec3 MAROON      = vec3(0.510,0.082,0.075); // 821513
const vec3 GOLD        = vec3(1.000,0.820,0.420);
const vec3 AMBER       = vec3(1.000,0.620,0.180);

// single ripple wave-height contribution at pixel p (css px)
float rippleH(vec2 p, vec3 rip){
  float age = uTime - rip.z;
  if(age < 0.0 || age > 1.15) return 0.0;
  vec2 d2 = p - rip.xy;
  float d = length(d2);
  float speed = 72.0;              // px/sec expansion (smaller = tighter rings)
  float R = 10.0 + age * speed;    // current ring radius
  float ringW = 17.0;              // gaussian band width (finer band)
  float env  = exp(-pow((d - R)/ringW, 2.0));
  float wave = sin((d - R) * 0.23);// shorter wavelength ~27px -> finer rings
  float life = exp(-age * 1.85);   // fade ripple faster (smaller footprint)
  float loc  = exp(-d / 48.0);     // keep it tight around cursor
  return wave * env * life * loc;
}

// sum height + presence mask
float heightAt(vec2 p, out float mask){
  float h = 0.0; float m = 0.0;
  for(int i=0;i<${TUNING.MAX_RIPPLES};i++){
    if(i>=uCount) break;
    vec3 rip = uRip[i];
    float age = uTime - rip.z;
    if(age < 0.0 || age > 1.15) continue;
    float hi = rippleH(p, rip);
    h += hi;
    vec2 d2 = p - rip.xy; float d = length(d2);
    float R = 10.0 + age*72.0;
    float env = exp(-pow((d - R)/22.0,2.0));
    float life = exp(-age*1.85);
    float loc = exp(-d/48.0);
    m = max(m, env*life*loc);
  }
  mask = m;
  return h;
}

void main(){
  vec2 fragCss = gl_FragCoord.xy / uScale;
  vec2 p = vec2(fragCss.x, uResCss.y - fragCss.y); // flip to y-down css space

  float mask;
  float h = heightAt(p, mask);

  if(mask < 0.004){ outColor = vec4(0.0); return; }

  // finite-difference gradient of height -> surface normal
  float e = 1.4;
  float md;
  float hx1 = heightAt(p + vec2(e,0.0), md);
  float hx0 = heightAt(p - vec2(e,0.0), md);
  float hy1 = heightAt(p + vec2(0.0,e), md);
  float hy0 = heightAt(p - vec2(0.0,e), md);
  vec2 grad = vec2(hx1-hx0, hy1-hy0) / (2.0*e);
  float amp = 20.0;                   // gentler relief -> finer, less bulgy
  vec3 n = normalize(vec3(-grad.x*amp, -grad.y*amp, 1.0));

  // lighting
  vec3 L = normalize(vec3(0.35, -0.55, 0.75));
  vec3 V = vec3(0.0,0.0,1.0);
  vec3 H = normalize(L + V);
  float ndh = max(dot(n,H),0.0);
  float spec     = pow(ndh, 95.0);    // sharp specular glint (finer)
  float specThin = pow(ndh, 230.0);   // razor-thin crest LINE (engraving, finer)
  float caustic  = pow(ndh, 12.0);    // broader warm sheen
  float diff = max(dot(n,L),0.0);

  // height -> crest(+) vs trough(-)
  float crest = clamp(h*7.0, -1.0, 1.0);

  float signal = mask;

  // ── LIGHT: engraved grooves on pale paper (deep maroon troughs, thin gold lines) ──
  vec3 troughLight = MAROON * 0.5;                                   // darker maroon between rings
  vec3 lc = mix(troughLight, ORANGE_DEEP, smoothstep(-0.70, 0.05, crest));
  lc = mix(lc, ORANGE, smoothstep(0.05, 0.55, crest));
  lc += caustic * AMBER * 0.22;
  lc += specThin * GOLD * 2.4;                                       // thin bright crest line
  lc *= (1.0 - 0.42 * smoothstep(0.0, -0.55, crest));               // deepen the trough banding
  float glintL = specThin*2.0 + spec*0.55 + caustic*0.25;
  float aLight = signal*(0.46 + 0.72*abs(crest)) + glintL*0.40;

  // ── DARK: molten glints on the void (brighter, more glint) ──
  vec3 troughDark = mix(MAROON, ORANGE_DEEP, 0.45);
  vec3 dc = mix(troughDark, ORANGE, smoothstep(-0.6,0.2,crest));
  dc = mix(dc, ORANGE_SOFT, smoothstep(0.1,0.9,crest));
  dc += caustic * AMBER * 0.55;
  dc += spec * GOLD * 1.6;
  dc = dc*(0.9 + 0.6*diff) + (spec*1.6 + caustic*0.5)*GOLD*0.4;
  float glintD = spec*1.6 + caustic*0.5;
  float aDark = signal*(0.30 + 0.45*abs(crest)) + glintD*0.6;

  vec3 finalCol = mix(lc, dc, uOnDark);
  float alpha   = mix(aLight, aDark, uOnDark);
  alpha *= smoothstep(0.0, 0.05, mask);   // soft outer feather
  alpha = clamp(alpha, 0.0, 0.92) * uMaster;

  outColor = vec4(finalCol * alpha, alpha);
}
`;

/* ── the controller ───────────────────────────────────────────────────────── */

export function createAurora(canvas: HTMLCanvasElement, opts: AuroraOptions): AuroraController {
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

  type LiquidGL = {
    prog: WebGLProgram;
    u: Record<string, WebGLUniformLocation | null>;
  };
  type FireGL = {
    prog: WebGLProgram;
    u: Record<string, WebGLUniformLocation | null>;
  };
  let liquid: LiquidGL | null = null;
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
    const lprog = link(VERT, LIQUID_FRAG);
    const lNames = ["uResCss", "uScale", "uTime", "uCount", "uRip", "uOnDark", "uMaster"];
    const lu: Record<string, WebGLUniformLocation | null> = {};
    for (const n of lNames) lu[n] = gl!.getUniformLocation(lprog, n);
    liquid = { prog: lprog, u: lu };

    const fprog = link(VERT, buildBurstFragment());
    const fNames = ["uScale", "uTime", "uOnDark", "uBursts", "uBurstProf"];
    const fu: Record<string, WebGLUniformLocation | null> = {};
    for (const n of fNames) fu[n] = gl!.getUniformLocation(fprog, n);
    fire = { prog: fprog, u: fu };

    // Empty VAO — the fullscreen triangle is generated from gl_VertexID.
    vao = gl!.createVertexArray()!;

    // premultiplied-alpha compositing for BOTH passes on the one canvas.
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
  let sx = px, sy = py; // smoothed

  const onPointer = (e: PointerEvent | MouseEvent) => {
    px = e.clientX;
    py = e.clientY;
  };

  /* ── ripple field (css px, y-down) ── */
  type Ripple = { x: number; y: number; t: number };
  const ripples: Ripple[] = [];
  const ripFlat = new Float32Array(TUNING.MAX_RIPPLES * 3);
  let lastSpawnX = sx, lastSpawnY = sy, lastSpawnMs = 0;

  function spawnAlong(nowMs: number, tSec: number) {
    const dx = sx - lastSpawnX, dy = sy - lastSpawnY;
    const dist = Math.hypot(dx, dy);
    if (dist >= TUNING.RIPPLE_STEP && nowMs - lastSpawnMs > 16) {
      const n = Math.min(Math.floor(dist / TUNING.RIPPLE_STEP), 3);
      for (let i = 1; i <= n; i++) {
        const f = i / n;
        ripples.push({ x: lastSpawnX + dx * f, y: lastSpawnY + dy * f, t: tSec });
        if (ripples.length > TUNING.MAX_RIPPLES) ripples.shift();
      }
      lastSpawnX = sx;
      lastSpawnY = sy;
      lastSpawnMs = nowMs;
    }
    // No idle spawning — a resting pointer settles back to glass (stable).
  }

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
  let master = 0; // start suppressed; eases up once past the hero

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
  let last = t0;
  let frameNo = 0;
  let lastLum = 1;

  function renderFrame(now: number) {
    rafId = requestAnimationFrame(renderFrame);
    if (!liquid || !fire || !vao) return;

    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 1 / 30);
    const t = (now - t0) / 1000;
    const f = dt * 60; // frame-rate normalisation

    // smooth pointer
    const kp = 1 - Math.pow(1 - TUNING.POINTER_SMOOTH, f);
    sx += (px - sx) * kp;
    sy += (py - sy) * kp;

    // spawn ripples along the smoothed path, cull expired
    spawnAlong(now, t);
    while (ripples.length && t - ripples[0].t > TUNING.RIPPLE_LIFE) ripples.shift();

    // background luminance under the smoothed pointer (throttled) -> crossfade
    if (frameNo % TUNING.LUM_EVERY === 0) {
      lastLum = bgLumAt(
        Math.max(0, Math.min(window.innerWidth - 1, sx)),
        Math.max(0, Math.min(window.innerHeight - 1, sy)),
      );
    }
    frameNo++;
    onDarkTarget = lastLum < 0.5 ? 1 : 0;
    onDark += (onDarkTarget - onDark) * (1 - Math.pow(1 - TUNING.ONDARK_EASE, f));

    // hero suppression (liquid only)
    const masterTarget = opts.heroVisible.current ? 0 : TUNING.MASTER_INTENSITY;
    master += (masterTarget - master) * (1 - Math.pow(1 - TUNING.MASTER_EASE, f));

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.bindVertexArray(vao);

    // ── pass 1: liquid ripple cursor ──
    const cnt = Math.min(ripples.length, TUNING.MAX_RIPPLES);
    for (let i = 0; i < cnt; i++) {
      const r = ripples[ripples.length - cnt + i];
      ripFlat[i * 3] = r.x;
      ripFlat[i * 3 + 1] = r.y;
      ripFlat[i * 3 + 2] = r.t;
    }
    const lu = liquid.u;
    gl!.useProgram(liquid.prog);
    gl!.uniform2f(lu.uResCss, window.innerWidth, window.innerHeight);
    gl!.uniform1f(lu.uScale, scale);
    gl!.uniform1f(lu.uTime, t);
    gl!.uniform1i(lu.uCount, cnt);
    gl!.uniform3fv(lu.uRip, ripFlat);
    gl!.uniform1f(lu.uOnDark, onDark);
    gl!.uniform1f(lu.uMaster, master);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    // ── pass 2: click fire bursts (only while any are alive) ──
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
    last = performance.now();
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
    liquid = null;
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
  window.addEventListener("mousemove", onPointer, { passive: true });
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
      window.removeEventListener("mousemove", onPointer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
      if (liquid) { gl!.deleteProgram(liquid.prog); liquid = null; }
      if (fire) { gl!.deleteProgram(fire.prog); fire = null; }
      if (vao) { gl!.deleteVertexArray(vao); vao = null; }
      if (AC) { AC.close().catch(() => {}); AC = null; masterGain = null; noiseBuf = null; }
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
