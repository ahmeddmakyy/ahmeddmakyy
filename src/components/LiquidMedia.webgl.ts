/* ────────────────────────────────────────────────────────────────────────────
 * LiquidMedia.webgl — a client-only WebGL2 "water surface" that lives ONLY over
 * media. Scoped to elements tagged [data-liquid] (reel posters now, idea-images
 * later). When the pointer moves over one, the IMAGE ITSELF becomes water: a
 * slow, gentle swell that ripples across the WHOLE surface and refracts the
 * media's own pixels — no fixed colour. It does NOT follow the cursor (per
 * request): the pointer only chooses WHICH element wakes; the ripple then lives
 * on its own, calm and even, everywhere on the image. It goes silent the instant
 * a <video> starts playing (you want to watch, not warp) and eases away when the
 * pointer leaves.
 *
 * SIZE-INDEPENDENT: the wave field is computed in the element's NORMALISED space
 * (0..1) with an aspect correction, so a wide film and a small tile show the SAME
 * calm ripple density and cell shape — the effect is never pinned to a fixed
 * pixel size (a wider video no longer ripples differently from the rest).
 *
 * ONE fixed, full-viewport, pointer-events:none canvas / ONE WebGL2 context. The
 * hovered element is uploaded to a texture (re-uploaded only when the target or,
 * for video, the frame changes — so a still poster costs one upload). The surface
 * samples that texture with an object-fit:cover mapping so the refracted copy
 * lines up pixel-for-pixel with the real element, then displaces the ENTIRE rect
 * by a SMALL fraction of uv — a subtle shimmer, never a flip. Coverage feathers
 * to zero at the rect edge, so there is never a seam against the media beneath.
 *
 * SSR / perf gating (reduced-motion, pointer:fine, WebGL2, the cursor-fx toggle)
 * lives in the React component; this module is imported only once every gate
 * passes.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface LiquidMediaController {
  destroy(): void;
}

const TUNING = {
  RENDER_SCALE: 0.9, //   backing-store scale vs CSS px (crisp crest lines)
  DPR_CAP: 1, //          device-pixel-ratio ceiling (integrated-GPU friendly)
  ACTIVE_EASE: 0.09, //   presence wake/sleep (per frame @60) — gentle, no snap
  WAVES: 4.0, //          ~wave cycles across the element (NORMALISED → same on
  //                      every size); lower = larger, calmer swells
  SPEED: 0.4, //          time scale — slow so it reads as calm water, not busy
  AMBIENT: 1.0, //        surface-wave amplitude feeding the slope
  SLOPE: 15.0, //         how strongly the slope bends light (gentle)
  STRENGTH: 0.013, //     refraction as a fraction of uv — visible water, never a flip
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
uniform vec4      uRect;     // hovered element: x, y (top-left), w, h  css px y-down
uniform vec2      uCover;    // object-fit:cover uv scale (<=1 on the cropped axis)
uniform float     uActive;   // 0..1 eased presence
uniform sampler2D uTex;      // the hovered media

// The image behaves like a still pool: a slow, gentle swell that ripples across
// the WHOLE surface. Heights are computed in NORMALISED element space (q = luv,
// 0..1) with an aspect correction, so the ripple looks the same on any size or
// shape and the wave "cells" stay roughly square. It does NOT depend on the
// pointer — the pool moves on its own once woken.
float heightAt(vec2 q){
  float aspect = uRect.z / max(uRect.w, 1.0);
  vec2 sp = vec2(q.x * aspect, q.y) * ${TUNING.WAVES.toFixed(2)};
  float t = uTime * ${TUNING.SPEED.toFixed(2)};
  float h =
      sin(sp.x + t) +
      sin(sp.y * 1.13 - t * 0.86) * 0.85 +
      sin((sp.x + sp.y) * 0.63 + t * 1.27) * 0.60 +
      sin((sp.x * 0.70 - sp.y * 0.88) - t * 0.68) * 0.48;
  return h * ${TUNING.AMBIENT.toFixed(2)};
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
  float presence = rectMask * uActive;            // the WHOLE media is water
  if(presence < 0.004){ outColor = vec4(0.0); return; }

  // surface normal from the height gradient. A FIXED normalised step (not a px
  // step) keeps the slope — and thus the ripple strength — identical at any size.
  float e = 0.0035;
  float hx = heightAt(luv + vec2(e, 0.0)) - heightAt(luv - vec2(e, 0.0));
  float hy = heightAt(luv + vec2(0.0, e)) - heightAt(luv - vec2(0.0, e));
  vec2 grad = vec2(hx, hy);
  vec3 n = normalize(vec3(-grad * ${TUNING.SLOPE.toFixed(1)}, 1.0));

  // refract the media across the WHOLE surface by a SMALL fraction of uv
  vec2 baseUv = 0.5 + (luv - 0.5) * uCover;
  vec2 refr = baseUv + n.xy * ${TUNING.STRENGTH.toFixed(4)};
  // UNPACK_FLIP_Y is false AND luv is y-down, so texUv.y = refr.y is UPRIGHT.
  // A stray "1.0 - refr.y" here rendered the whole overlay UPSIDE-DOWN — that was
  // the long-standing "the image flips / looks mirrored on hover" bug: the
  // flipped copy covered the real poster, so the water never read as water.
  vec2 texUv = vec2(refr.x, refr.y);
  vec3 col = texture(uTex, clamp(texUv, 0.001, 0.999)).rgb;

  // a soft moving sheen where the surface tilts to the light — reads as light
  // gliding across water (gentle, never glare)
  vec3 L = normalize(vec3(0.35, -0.45, 0.82));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 45.0) * 0.16;
  col += spec * rectMask;

  float alpha = clamp(presence + spec * rectMask, 0.0, 1.0);
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
    for (const n of ["uRes", "uScale", "uTime", "uRect", "uCover", "uActive", "uTex"]) {
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

  /* ── hovered-target state ── the pointer ONLY selects which element wakes; the
   *    ripple never reads the pointer position. ── */
  type Media = HTMLImageElement | HTMLVideoElement;
  let target: HTMLElement | null = null;   // [data-liquid] region under the pointer
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
  // is actually playing returns false → the surface goes quiet while you watch.
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

  /* ── loop ── */
  let rafId = 0, running = false, lost = false;
  const t0 = performance.now();

  function renderFrame(now: number) {
    rafId = requestAnimationFrame(renderFrame);
    if (!prog || !vao) return;
    const t = (now - t0) / 1000;

    // ease presence toward whether we have a live, resting target
    const media = mediaOf(target);
    const want = target && resting(media) ? 1 : 0;
    active += (want - active) * TUNING.ACTIVE_EASE;

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    if (active < 0.01 || !target || !media) return;

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

    gl!.useProgram(prog);
    gl!.bindVertexArray(vao);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(u.uTex, 0);
    gl!.uniform2f(u.uRes, window.innerWidth, window.innerHeight);
    gl!.uniform1f(u.uScale, scale);
    gl!.uniform1f(u.uTime, t);
    gl!.uniform4f(u.uRect, r.left, r.top, r.width, r.height);
    gl!.uniform2f(u.uCover, cover[0], cover[1]);
    gl!.uniform1f(u.uActive, active);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
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
