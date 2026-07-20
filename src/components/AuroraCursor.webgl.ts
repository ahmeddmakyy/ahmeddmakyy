/* ────────────────────────────────────────────────────────────────────────────
 * AuroraCursor.webgl — the heavy, client-only WebGL2 core of the site-wide warm
 * "aurora" cursor light. Dynamically imported by AuroraCursor.tsx AFTER every
 * perf/support gate has passed, so it never enters the entry bundle and never
 * runs on the server or on mobile.
 *
 * PROVENANCE — this is a PORT + MERGE of two selected prototypes, not a rewrite:
 *   • BASE  = prototype B  — a single fixed fullscreen quad, premultiplied-alpha
 *     normal blend, momentum-smoothed pointer, and a single uOnDark uniform
 *     (driven by document.elementFromPoint → background luminance, eased ~0.06/
 *     frame) that switches the warm emission between a bright additive-reading
 *     bloom on DARK and a restrained deeper tint on LIGHT. That adaptive
 *     light/dark crossfade is the whole point and is preserved verbatim.
 *   • STREAK GRAFT = prototype C — its velocity-raked comet/curtain that streams
 *     BEHIND the pointer. B's weakness was a round "sun-like" core; here C's
 *     velocity-biased rake is grafted onto the core itself (it now elongates
 *     into a comet along the smoothed velocity) and C's flow-field striations
 *     rake the curtain. Done PROCEDURALLY in the ONE fragment shader — no second
 *     context, no ping-pong feedback buffer.
 *
 * All the look/feel knobs live in TUNING at the top so they are trivially
 * tunable without reading the shader.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface AuroraController {
  destroy(): void;
}

export interface AuroraOptions {
  /** Live-read flag: while #home (the hero) is on screen the master opacity is
   *  eased to ~0 so the aurora doesn't fight the hero's own particle field +
   *  cursor ring + portrait loupe. Owned by the React component's IO. */
  heroVisible: { current: boolean };
}

/* ══════════════════════ TUNING — the only knobs you need ══════════════════════
 * Colours are kept as exact normalized float triples (not hex) so they match the
 * chosen prototype pixel-for-pixel. Brand hex noted alongside for reference. */
const TUNING = {
  // — global feel —
  MASTER_INTENSITY: 0.9, //  overall opacity ceiling of the whole effect (subtle by default)
  RENDER_SCALE: 0.55, //     backing-store scale vs CSS px (soft blurry effect → cheap upscale)
  DPR_CAP: 1, //             device-pixel-ratio ceiling (integrated GPU friendly)
  OCTAVES: 4, //             fbm noise octaves (few = cheap; effect is soft anyway)

  // — comet / core shape —
  CORE_SIZE: 90, //          core tightness (higher = smaller, tighter hot point)
  CORE_RAKE: 0.8, //         how far the core elongates BEHIND the pointer (0 = round, 1 = long comet)
  STREAK_LENGTH: 1.0, //     multiplier on the velocity-raked tail of the body envelope
  STRIAE_MIX: 0.5, //        how strongly C's flow-field striations rake the curtain (0..1)

  // — motion smoothing —
  POINTER_SMOOTH: 0.14, //   momentum lag of the pointer (lower = more trailing lag = longer read)
  VEL_SMOOTH: 0.18, //       velocity smoothing (streak "decay"; lower = longer-lived streak)
  ONDARK_EASE: 0.06, //      light↔dark crossfade speed (~0.25s, no pop)
  MASTER_EASE: 0.045, //     hero-suppression ramp speed (ease master in/out of the hero)

  // — housekeeping —
  LUM_EVERY: 4, //           run elementFromPoint luminance probe every N frames (cheap)

  // — DARK palette: bright additive-reading warm bloom (amber core → orange → warm rose edge) —
  DARK_ROSE: [0.62, 0.14, 0.22], //   warm rose edge (barely magenta, no blue push)
  DARK_ORANGE: [0.992, 0.435, 0.0], // #FD6F00
  DARK_AMBER: [1.0, 0.8, 0.48], //    warm bright core
  DARK_GOLD: [1.0, 0.94, 0.76], //    hottest point blooms to warm gold-white

  // — LIGHT palette: restrained deeper warm tint (deep-orange → maroon) —
  LIGHT_MAROON: [0.51, 0.082, 0.075], // #821513
  LIGHT_DEEPO: [0.89, 0.388, 0.0], //   #E36300
} as const;

/* ── shaders (GLSL ES 3.00 / WebGL2) ──────────────────────────────────────── */

// Fullscreen triangle with no attribute buffer — gl_VertexID does the work.
const VERT = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.,-1.), vec2(3.,-1.), vec2(-1.,3.));
void main(){ gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;        // backing-store resolution (px)
uniform vec2  uMouse;      // aspect-corrected smoothed pointer (y up)
uniform vec2  uVel;        // aspect-corrected smoothed velocity
uniform float uTime;
uniform float uOnDark;     // 0 = over light paper, 1 = over dark ink (eased)
uniform float uSpeed;      // smoothed speed magnitude
uniform float uMaster;     // master opacity (hero suppression * MASTER_INTENSITY)

uniform float uCoreSize;   // TUNING.CORE_SIZE
uniform float uCoreRake;   // TUNING.CORE_RAKE
uniform float uStreak;     // TUNING.STREAK_LENGTH
uniform float uStriae;     // TUNING.STRIAE_MIX

uniform vec3  uRose;
uniform vec3  uOrange;
uniform vec3  uAmber;
uniform vec3  uGold;
uniform vec3  uMaroon;
uniform vec3  uDeepO;

// ---- value noise + fbm (from B) ----
float hash(vec2 p){
  p = fract(p*vec2(123.34, 345.45));
  p += dot(p, p+34.345);
  return fract(p.x*p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash(i);
  float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0));
  float d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, amp = 0.55;
  mat2 m = mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<${TUNING.OCTAVES};i++){
    v += amp*vnoise(p);
    p = m*p;
    amp *= 0.5;
  }
  return v;
}

void main(){
  vec2 st = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;   // aspect space, y up
  vec2 p  = st - uMouse;

  // travel direction (fallback drifts slowly so the light "lives" at rest)
  float sp = uSpeed;
  vec2 driftDir = vec2(cos(uTime*0.15), sin(uTime*0.11));
  vec2 dir = (sp > 0.0006) ? uVel/max(length(uVel),1e-4) : normalize(driftDir);

  // comet body envelope: short ahead, long rake behind; faster => longer tail
  float along  = dot(p, dir);                       // + ahead, - behind
  float across = dot(p, vec2(-dir.y, dir.x));
  float tail   = 1.0 + clamp(sp*55.0, 0.0, 3.2) * uStreak;
  float alongS = (along >= 0.0) ? along*2.6 : along/tail;
  float dd = alongS*alongS*1.0 + across*across*2.7;
  float env = exp(-dd*6.5);

  // aurora curtain: striations run across travel, flow along it + drift in time
  vec2 fc = vec2(across*4.2, along*1.8 - uTime*0.35 - sp*26.0);
  fc += 0.6*vec2(fbm(fc*0.8 + uTime*0.12), fbm(fc*0.8 + 7.0 - uTime*0.09)); // domain warp
  float curtain = fbm(fc + vec2(0.0, uTime*0.18));
  curtain = smoothstep(0.08, 0.92, curtain);

  // GRAFT (prototype C): flow-field striations that rake the curtain so it reads
  // as a raked comet-curtain streaming BEHIND the pointer, not a round wash.
  float fld = sin(across*7.0 + along*2.0 - uTime*0.9 - sp*30.0)
            + 0.5*sin(across*13.0 - uTime*0.6);
  float striae = 0.5 + 0.5*fld;
  curtain *= mix(1.0, striae, uStriae);

  // soft halo bleed, and a RAKED bright core (comet — elongated behind, not a sun)
  float r    = length(p);
  float halo = exp(-r*r*16.0);
  float alongC = (along >= 0.0) ? along : along/(1.0 + (tail-1.0)*uCoreRake);
  float ddC  = alongC*alongC*1.0 + across*across*1.7;   // tighter across => rakes along travel
  float core = exp(-ddC*uCoreSize);

  // ambient breathing so the light lives even at rest
  float ambient = 0.10 * halo * (0.5 + 0.5*sin(uTime*0.6 + across*4.0));

  // curtains carry the striated body, core adds the bright point, halo a soft bleed
  float I = env*(0.30 + 1.05*curtain) + halo*0.20 + core*0.95 + ambient;
  I *= 1.0 + sp*4.5;                 // motion brightens the streak
  I = clamp(I, 0.0, 1.9);

  // ---------- warm identity, two treatments (from B, preserved) ----------
  // DARK: amber core -> orange -> warm rose edge, blooming to gold at the hot point
  vec3 darkCol = mix(uRose, uOrange, smoothstep(0.10, 0.60, I));
  darkCol      = mix(darkCol, uAmber, smoothstep(0.65, 1.00, I));
  darkCol      = mix(darkCol, uGold,  smoothstep(1.05, 1.65, I));

  // LIGHT: maroon edge -> deep-orange -> orange core (darkens the paper, restrained)
  vec3 lightCol= mix(uMaroon, uDeepO, smoothstep(0.10, 0.80, I));
  lightCol     = mix(lightCol, uOrange, smoothstep(0.90, 1.6, I));

  vec3 col = mix(lightCol, darkCol, uOnDark);

  // alpha: dark gets an extra core boost so the hot point blooms over black; light
  // keeps a low ceiling so the tint never blows out the paper.
  float aDark  = clamp(I*0.52 + core*0.34, 0.0, 0.90);
  float aLight = clamp(I*0.44, 0.0, 0.46);
  float alpha  = mix(aLight, aDark, uOnDark) * uMaster;

  // premultiplied output — color+alpha alone carry the contrast (canvas blend:normal)
  fragColor = vec4(col*alpha, alpha);
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

  // Should never happen — the component probes WebGL2 before importing us — but
  // fail safe (normal blend means "nothing" just shows nothing, no white-out).
  if (!gl) {
    return { destroy() {} };
  }

  type GLObjects = {
    prog: WebGLProgram;
    vao: WebGLVertexArrayObject;
    u: Record<string, WebGLUniformLocation | null>;
  };
  let glo: GLObjects | null = null;

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

  function buildGL(): GLObjects {
    const vs = compile(gl!.VERTEX_SHADER, VERT);
    const fs = compile(gl!.FRAGMENT_SHADER, FRAG);
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
    // Empty VAO — the fullscreen triangle is generated from gl_VertexID, no buffers.
    const vao = gl!.createVertexArray()!;

    const names = [
      "uRes", "uMouse", "uVel", "uTime", "uOnDark", "uSpeed", "uMaster",
      "uCoreSize", "uCoreRake", "uStreak", "uStriae",
      "uRose", "uOrange", "uAmber", "uGold", "uMaroon", "uDeepO",
    ];
    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const n of names) u[n] = gl!.getUniformLocation(prog, n);

    // Static colour + shape uniforms only need to be set once per program.
    gl!.useProgram(prog);
    gl!.uniform1f(u.uCoreSize, TUNING.CORE_SIZE);
    gl!.uniform1f(u.uCoreRake, TUNING.CORE_RAKE);
    gl!.uniform1f(u.uStreak, TUNING.STREAK_LENGTH);
    gl!.uniform1f(u.uStriae, TUNING.STRIAE_MIX);
    gl!.uniform3fv(u.uRose, TUNING.DARK_ROSE);
    gl!.uniform3fv(u.uOrange, TUNING.DARK_ORANGE);
    gl!.uniform3fv(u.uAmber, TUNING.DARK_AMBER);
    gl!.uniform3fv(u.uGold, TUNING.DARK_GOLD);
    gl!.uniform3fv(u.uMaroon, TUNING.LIGHT_MAROON);
    gl!.uniform3fv(u.uDeepO, TUNING.LIGHT_DEEPO);

    return { prog, vao, u };
  }

  /* ── sizing (reduced-resolution backing store, DPR-capped) ── */
  let W = 0, H = 0, scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, TUNING.DPR_CAP);
    scale = dpr * TUNING.RENDER_SCALE; // maps CSS px -> backing px
    W = Math.max(1, Math.floor(window.innerWidth * scale));
    H = Math.max(1, Math.floor(window.innerHeight * scale));
    canvas.width = W;
    canvas.height = H;
    gl!.viewport(0, 0, W, H);
  }

  /* ── pointer state (client px) ── */
  let tx = window.innerWidth * 0.5, ty = window.innerHeight * 0.5; // raw target
  let sx = tx, sy = ty; // smoothed
  let psx = sx, psy = sy; // previous smoothed
  let vx = 0, vy = 0; // smoothed velocity (aspect/frame)

  const onPointer = (e: PointerEvent | MouseEvent) => {
    tx = e.clientX;
    ty = e.clientY;
  };

  /* ── luminance detection -> uOnDark target ── */
  let onDark = 0, onDarkTarget = 0;
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

  /* ── master (hero suppression) ── */
  let master = 0; // start suppressed; eases up once past the hero

  /* ── loop ── */
  let rafId = 0;
  let running = false;
  let lost = false;
  let t0 = performance.now();
  let last = t0;
  let frameNo = 0;
  let lastLum = 1;

  function renderFrame(now: number) {
    rafId = requestAnimationFrame(renderFrame);
    if (!glo) return;

    // clamp dt so the first frame after a tab-resume / scroll pause doesn't jump
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 1 / 30);
    const t = (now - t0) / 1000;
    const f = dt * 60; // frame-rate normalisation factor

    // momentum smoothing (lag => trailing read)
    const kp = 1 - Math.pow(1 - TUNING.POINTER_SMOOTH, f);
    sx += (tx - sx) * kp;
    sy += (ty - sy) * kp;

    // velocity in aspect space (divide by height), smoothed
    const ivx = (sx - psx) / window.innerHeight;
    const ivy = -(sy - psy) / window.innerHeight;
    const kv = 1 - Math.pow(1 - TUNING.VEL_SMOOTH, f);
    vx += (ivx - vx) * kv;
    vy += (ivy - vy) * kv;
    psx = sx;
    psy = sy;
    const speed = Math.hypot(vx, vy);

    // background luminance under the SMOOTHED pointer (throttled) -> crossfade
    if (frameNo % TUNING.LUM_EVERY === 0) {
      lastLum = bgLumAt(
        Math.max(0, Math.min(window.innerWidth - 1, sx)),
        Math.max(0, Math.min(window.innerHeight - 1, sy)),
      );
    }
    frameNo++;
    onDarkTarget = lastLum < 0.5 ? 1 : 0;
    onDark += (onDarkTarget - onDark) * (1 - Math.pow(1 - TUNING.ONDARK_EASE, f));

    // hero suppression: master eases to 0 over #home, to MASTER_INTENSITY past it
    const masterTarget = opts.heroVisible.current ? 0 : TUNING.MASTER_INTENSITY;
    master += (masterTarget - master) * (1 - Math.pow(1 - TUNING.MASTER_EASE, f));

    // aspect-space pointer (y up), in backing px
    const mx = (sx * scale - 0.5 * W) / H;
    const my = (0.5 * H - sy * scale) / H;

    const u = glo.u;
    gl!.useProgram(glo.prog);
    gl!.bindVertexArray(glo.vao);
    gl!.uniform2f(u.uRes, W, H);
    gl!.uniform2f(u.uMouse, mx, my);
    gl!.uniform2f(u.uVel, vx, vy);
    gl!.uniform1f(u.uTime, t);
    gl!.uniform1f(u.uOnDark, onDark);
    gl!.uniform1f(u.uSpeed, speed);
    gl!.uniform1f(u.uMaster, master);

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
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
    if (glo) {
      // GL objects are invalid after loss; drop references, recreate on restore.
      glo = null;
    }
  };
  const onRestored = () => {
    lost = false;
    try {
      glo = buildGL();
      resize();
      if (!document.hidden) startLoop();
    } catch {
      /* leave dark — nothing renders, which is safe under normal blend */
    }
  };

  /* ── boot ── */
  try {
    glo = buildGL();
  } catch {
    return { destroy() {} };
  }
  resize();

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onPointer, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
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
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
      if (glo) {
        gl!.deleteProgram(glo.prog);
        gl!.deleteVertexArray(glo.vao);
        glo = null;
      }
      // free the GPU context deterministically
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
