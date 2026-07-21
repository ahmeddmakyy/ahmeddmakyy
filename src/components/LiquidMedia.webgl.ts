/* ────────────────────────────────────────────────────────────────────────────
 * LiquidMedia.webgl — a client-only WebGL2 "liquid surface" that lives ONLY over
 * media. Scoped to elements tagged [data-liquid] (reel posters now, idea-images
 * later): when the pointer moves over one, the WHOLE media becomes a still body
 * of water — a gentle ambient swell everywhere — and the cursor is a HAND touching
 * it: a soft push under the pointer plus expanding ripple rings left along its
 * path. It REFRACTS the media itself (no fixed colour, the distortion is whatever
 * image or video frame sits underneath), goes silent the instant a <video> starts
 * playing (you want to watch, not warp), and eases away when the pointer leaves.
 *
 * ONE fixed, full-viewport, pointer-events:none canvas / ONE WebGL2 context. The
 * hovered element is uploaded to a texture (re-uploaded only when the target or,
 * for video, the frame changes — so a still poster costs one upload). The surface
 * samples that texture with an object-fit:cover mapping so the refracted copy
 * lines up pixel-for-pixel with the real element, then displaces the ENTIRE rect
 * by the surface normal and adds a soft specular that brightens near the cursor.
 * Because coverage feathers to zero at the rect edge there is never a seam against
 * the untouched media beneath.
 *
 * SSR/'perf gating (reduced-motion, pointer:fine, WebGL2, the cursor-fx toggle)
 * lives in the React component; this module is imported only once every gate
 * passes.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface LiquidMediaController {
  destroy(): void;
}

const TUNING = {
  RENDER_SCALE: 0.9, //   backing-store scale vs CSS px (crisp crest lines)
  DPR_CAP: 1, //          device-pixel-ratio ceiling (integrated-GPU friendly)
  TOUCH_RADIUS: 85, //    how far the cursor "hand" pushes the WHOLE liquid surface
  MAX_RIPPLES: 8, //      trailing ripple seeds held in the uniform array
  RIPPLE_STEP: 18, //     px between ripple seeds spawned along the path
  RIPPLE_LIFE: 1.2, //    seconds a ripple lives
  POINTER_SMOOTH: 0.32, //smoothed-pointer follow (per frame @60)
  ACTIVE_EASE: 0.14, //   presence fade in/out (per frame @60)
  STRENGTH: 0.03, //      whole-surface refraction, fraction of UV — subtle, like
  //                      real water (the effect now covers the ENTIRE media)
  AMBIENT: 0.5, //        ambient surface-wave amplitude (the media always breathes)
} as const;

const VERT = `#version 300 es
void main(){
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2      uRes;      // viewport size, css px
uniform float     uScale;    // css px -> backing px
uniform float     uTime;
uniform vec2      uPointer;  // css px, y-down
uniform vec4      uRect;     // hovered element: x, y (top-left), w, h  css px y-down
uniform vec2      uCover;    // object-fit:cover uv scale (<=1 on the cropped axis)
uniform float     uTouchR;   // cursor "hand" push radius, css px
uniform float     uActive;   // 0..1 eased presence
uniform int       uCount;    // live ripple count
uniform vec3      uRip[${TUNING.MAX_RIPPLES}]; // x, y (css px y-down), birth time
uniform sampler2D uTex;      // the hovered media

// height contribution of one expanding ripple ring at pixel p
float ripH(vec2 p, vec3 rip){
  float age = uTime - rip.z;
  if(age < 0.0 || age > ${TUNING.RIPPLE_LIFE.toFixed(1)}) return 0.0;
  float d = distance(p, rip.xy);
  float R = 6.0 + age * 130.0;          // ring expands outward across the surface
  float band = exp(-pow((d - R) / 16.0, 2.0));
  float wave = sin((d - R) * 0.28);
  float life = exp(-age * 1.9);
  return wave * band * life;
}

// The liquid SURFACE height across the whole media (css px). The media behaves
// like a still body of water: a gentle ambient swell everywhere, plus the cursor
// acting as a HAND touching it — a soft local push under the pointer and the
// expanding ripple rings it leaves along its path.
float heightAt(vec2 p){
  float amb =
      sin(p.x * 0.021 + uTime * 0.90) +
      sin(p.y * 0.027 - uTime * 0.72) +
      sin((p.x * 0.6 + p.y * 0.8) * 0.02 + uTime * 1.25) * 0.7;
  amb *= ${(TUNING.AMBIENT).toFixed(2)} * 0.33;
  float d = distance(p, uPointer);
  float touch = exp(-d * d / (2.0 * uTouchR * uTouchR));   // the hand pressing the water
  float rip = 0.0;
  for(int i = 0; i < ${TUNING.MAX_RIPPLES}; i++){
    if(i >= uCount) break;
    rip += ripH(p, uRip[i]);
  }
  return amb + touch * 1.15 + rip * 0.9;
}

void main(){
  vec2 fragCss = gl_FragCoord.xy / uScale;
  vec2 p = vec2(fragCss.x, uRes.y - fragCss.y);   // to y-down css

  // local uv inside the element (0..1, y-down)
  vec2 luv = (p - uRect.xy) / uRect.zw;
  // feathered rect mask so the surface fades into the untouched media at the edge
  vec2 fw = vec2(7.0) / uRect.zw;
  float rectMask =
      smoothstep(0.0, fw.x, luv.x) * smoothstep(1.0, 1.0 - fw.x, luv.x) *
      smoothstep(0.0, fw.y, luv.y) * smoothstep(1.0, 1.0 - fw.y, luv.y);
  float presence = rectMask * uActive;            // the WHOLE media is liquid now
  if(presence < 0.004){ outColor = vec4(0.0); return; }

  // surface normal from the height gradient (finite differences)
  float e = 1.6;
  float hx = heightAt(p + vec2(e, 0.0)) - heightAt(p - vec2(e, 0.0));
  float hy = heightAt(p + vec2(0.0, e)) - heightAt(p - vec2(0.0, e));
  vec2 grad = vec2(hx, hy) / (2.0 * e);
  vec3 n = normalize(vec3(-grad * 42.0, 1.0));

  // refract the media across the WHOLE surface (subtle, like water)
  vec2 baseUv = 0.5 + (luv - 0.5) * uCover;
  vec2 refr = baseUv + n.xy * ${TUNING.STRENGTH.toFixed(3)};
  vec2 texUv = vec2(refr.x, 1.0 - refr.y);           // DOM texture is y-flipped
  vec3 col = texture(uTex, clamp(texUv, 0.001, 0.999)).rgb;

  // soft specular where the surface tilts to the light, lifted near the cursor so
  // the "hand on water" reads (a bright touch that follows the pointer)
  vec3 L = normalize(vec3(0.3, -0.5, 0.8));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float ndh = max(dot(n, H), 0.0);
  float dC = distance(p, uPointer);
  float near = exp(-dC * dC / (2.0 * (uTouchR * 1.6) * (uTouchR * 1.6)));
  float spec = pow(ndh, 42.0) * (0.32 + 0.5 * near);
  col += spec * rectMask * vec3(1.0);
  col *= 1.0 + 0.03 * near;

  float alpha = clamp(presence + spec * rectMask * 0.4, 0.0, 1.0);
  outColor = vec4(col * alpha, alpha);                 // premultiplied
}`;

export function createLiquidMedia(canvas: HTMLCanvasElement): LiquidMediaController {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  }) as WebGL2RenderingContext | null;
  if (!gl) return { destroy() {} };

  let prog: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let tex: WebGLTexture | null = null;
  let u: Record<string, WebGLUniformLocation | null> = {};

  function compile(type: number, src: string): WebGLShader {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(s);
      gl!.deleteShader(s);
      throw new Error("liquidmedia compile failed: " + log);
    }
    return s;
  }

  function buildGL() {
    const vs = compile(gl!.VERTEX_SHADER, VERT);
    const fs = compile(gl!.FRAGMENT_SHADER, FRAG);
    const p = gl!.createProgram()!;
    gl!.attachShader(p, vs);
    gl!.attachShader(p, fs);
    gl!.linkProgram(p);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
      const log = gl!.getProgramInfoLog(p);
      gl!.deleteProgram(p);
      throw new Error("liquidmedia link failed: " + log);
    }
    prog = p;
    vao = gl!.createVertexArray()!;
    u = {};
    for (const n of ["uRes", "uScale", "uTime", "uPointer", "uRect", "uCover", "uTouchR", "uActive", "uCount", "uRip", "uTex"]) {
      u[n] = gl!.getUniformLocation(p, n);
    }
    tex = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
  }

  /* ── sizing ── */
  let scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, TUNING.DPR_CAP);
    scale = dpr * TUNING.RENDER_SCALE;
    canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  /* ── pointer + hovered-target state (css px, y-down) ── */
  type Media = HTMLImageElement | HTMLVideoElement;
  let px = -1, py = -1, sx = -1, sy = -1;
  let target: HTMLElement | null = null;   // [data-liquid] region under the pointer (drives the rect)
  let uploaded: Media | null = null;       // element whose pixels are in `tex`
  let tainted = false;                     // CORS upload failed for `uploaded`
  let active = 0;                          // eased presence

  // The samplable media for a [data-liquid] region: the element itself if it's
  // an <img>/<video>, else the first one inside it (e.g. the poster in a tile
  // whose shade/play/title overlays would otherwise be the topmost hit).
  function mediaOf(el: HTMLElement | null): Media | null {
    if (!el) return null;
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) return el;
    return el.querySelector<Media>("img, video");
  }
  // "resting" = a loaded image, or a paused / not-yet-playing video. A video that
  // is actually playing returns false → the lens goes quiet while you watch.
  function resting(m: Media | null): boolean {
    if (m instanceof HTMLVideoElement) return m.paused || m.readyState < 2;
    if (m instanceof HTMLImageElement) return m.complete && m.naturalWidth > 0;
    return false;
  }
  function natural(m: Media): [number, number] {
    if (m instanceof HTMLVideoElement) return [m.videoWidth || 1, m.videoHeight || 1];
    return [m.naturalWidth || 1, m.naturalHeight || 1];
  }

  const onPointerMove = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
    if (sx < 0) { sx = px; sy = py; }
    // the canvas is pointer-events:none, so e.target is the real element beneath
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-liquid]") ?? null;
    target = el && resting(mediaOf(el)) ? el : null;
  };
  const onPointerLeaveWin = () => { target = null; };

  function uploadTexture(m: Media) {
    try {
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, m as TexImageSource);
      tainted = false;
    } catch {
      // cross-origin without CORS taints the canvas — skip this element quietly
      tainted = true;
    }
    uploaded = m;
  }

  /* ── ripple field (css px, y-down) ── */
  type Ripple = { x: number; y: number; t: number };
  const ripples: Ripple[] = [];
  const ripFlat = new Float32Array(TUNING.MAX_RIPPLES * 3);
  let lastSpawnX = sx, lastSpawnY = sy;

  function spawnAlong(tSec: number) {
    const dx = sx - lastSpawnX, dy = sy - lastSpawnY;
    const dist = Math.hypot(dx, dy);
    if (dist >= TUNING.RIPPLE_STEP) {
      const n = Math.min(Math.floor(dist / TUNING.RIPPLE_STEP), 3);
      for (let i = 1; i <= n; i++) {
        const f = i / n;
        ripples.push({ x: lastSpawnX + dx * f, y: lastSpawnY + dy * f, t: tSec });
        if (ripples.length > TUNING.MAX_RIPPLES) ripples.shift();
      }
      lastSpawnX = sx;
      lastSpawnY = sy;
    }
  }

  /* ── loop ── */
  let rafId = 0, running = false, lost = false;
  const t0 = performance.now();
  let last = t0;

  function renderFrame(now: number) {
    rafId = requestAnimationFrame(renderFrame);
    if (!prog || !vao) return;
    let dt = (now - last) / 1000; last = now; dt = Math.min(dt, 1 / 30);
    const t = (now - t0) / 1000;
    const f = dt * 60;

    // ease presence toward whether we have a live, resting target
    const media = mediaOf(target);
    const want = target && resting(media) ? 1 : 0;
    active += (want - active) * (1 - Math.pow(1 - TUNING.ACTIVE_EASE, f));

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    if (active < 0.01 || !target || !media) {
      // nothing to draw — let ripples die and re-anchor the spawn cursor
      if (sx < 0) { sx = px; sy = py; }
      lastSpawnX = sx; lastSpawnY = sy;
      while (ripples.length && t - ripples[0].t > TUNING.RIPPLE_LIFE) ripples.shift();
      return;
    }

    // smooth the pointer + spawn trailing ripples along the path
    const kp = 1 - Math.pow(1 - TUNING.POINTER_SMOOTH, f);
    sx += (px - sx) * kp;
    sy += (py - sy) * kp;
    spawnAlong(t);
    while (ripples.length && t - ripples[0].t > TUNING.RIPPLE_LIFE) ripples.shift();

    // (re)upload the media only when the sampled element changes; refresh a
    // paused-but-live video frame each frame it is the target (cheap, one draw)
    if (media !== uploaded || media instanceof HTMLVideoElement) uploadTexture(media);
    if (tainted) return; // couldn't sample it — draw nothing rather than garbage

    const r = target.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const [tw, th] = natural(media);
    const boxA = r.width / r.height, texA = tw / th;
    const cover: [number, number] =
      texA > boxA ? [boxA / texA, 1] : [1, texA / boxA];

    const cnt = Math.min(ripples.length, TUNING.MAX_RIPPLES);
    for (let i = 0; i < cnt; i++) {
      const rp = ripples[ripples.length - cnt + i];
      ripFlat[i * 3] = rp.x; ripFlat[i * 3 + 1] = rp.y; ripFlat[i * 3 + 2] = rp.t;
    }

    gl!.useProgram(prog);
    gl!.bindVertexArray(vao);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(u.uTex, 0);
    gl!.uniform2f(u.uRes, window.innerWidth, window.innerHeight);
    gl!.uniform1f(u.uScale, scale);
    gl!.uniform1f(u.uTime, t);
    gl!.uniform2f(u.uPointer, sx, sy);
    gl!.uniform4f(u.uRect, r.left, r.top, r.width, r.height);
    gl!.uniform2f(u.uCover, cover[0], cover[1]);
    gl!.uniform1f(u.uTouchR, TUNING.TOUCH_RADIUS);
    gl!.uniform1f(u.uActive, active);
    gl!.uniform1i(u.uCount, cnt);
    gl!.uniform3fv(u.uRip, ripFlat);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function startLoop() {
    if (running || lost) return;
    running = true; last = performance.now();
    rafId = requestAnimationFrame(renderFrame);
  }
  function stopLoop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  const onVisibility = () => { if (document.hidden) stopLoop(); else startLoop(); };
  const onLost = (e: Event) => { e.preventDefault(); lost = true; stopLoop(); prog = null; vao = null; tex = null; };
  const onRestored = () => {
    lost = false;
    try { buildGL(); resize(); uploaded = null; if (!document.hidden) startLoop(); } catch { /* safe: nothing renders */ }
  };

  try { buildGL(); } catch { return { destroy() {} }; }
  resize();

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", onPointerLeaveWin);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost, false);
  canvas.addEventListener("webglcontextrestored", onRestored, false);
  if (!document.hidden) startLoop();

  return {
    destroy() {
      stopLoop();
      lost = true;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeaveWin);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
      if (prog) { gl!.deleteProgram(prog); prog = null; }
      if (vao) { gl!.deleteVertexArray(vao); vao = null; }
      if (tex) { gl!.deleteTexture(tex); tex = null; }
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
