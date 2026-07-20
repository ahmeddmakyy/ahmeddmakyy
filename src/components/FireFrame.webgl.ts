/* ────────────────────────────────────────────────────────────────────────────
 * FireFrame.webgl — the client-only WebGL2 core that RINGS a modal frame with
 * anime fire (the "portal of flame" around an opened video lightbox / morph
 * card). Dynamically imported by FireFrame.tsx once its gate passes.
 *
 * It uses its OWN WebGL2 context but ONLY exists while the modal is open — the
 * transient canvas is fully disposed on unmount (programs deleted, context lost).
 * The fire LOOK is the shared anime-fire GLSL (fire.glsl.ts), so this portal and
 * the click-burst are pixel-for-pixel the same fire.
 *
 * The card rect is read live each frame (getRect) so the flames track the frame
 * even if it resizes / the page reflows while open.
 * ──────────────────────────────────────────────────────────────────────────── */

import { FIRE_VERT, FIRE_TUNING, buildFrameFragment } from "./fire.glsl";

export interface FireFrameRect {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

export interface FireFrameOptions {
  /** Live rect of the element to ring, in CSS px (viewport coords). null = not
   *  ready yet (skip drawing this frame). */
  getRect: () => FireFrameRect | null;
  /** 0 = ring sits over light bg, 1 = over dark bg (both modals use dark scrims). */
  onDark: number;
}

export interface FireFrameController {
  destroy(): void;
}

const TUNING = {
  RENDER_SCALE: 0.9,
  DPR_CAP: 1,
} as const;

export function createFireFrame(
  canvas: HTMLCanvasElement,
  opts: FireFrameOptions,
): FireFrameController {
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
  let u: Record<string, WebGLUniformLocation | null> = {};

  function compile(type: number, src: string): WebGLShader {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(s);
      gl!.deleteShader(s);
      throw new Error("fireframe compile failed: " + log);
    }
    return s;
  }

  function buildGL() {
    const vs = compile(gl!.VERTEX_SHADER, FIRE_VERT);
    const fs = compile(gl!.FRAGMENT_SHADER, buildFrameFragment());
    const p = gl!.createProgram()!;
    gl!.attachShader(p, vs);
    gl!.attachShader(p, fs);
    gl!.linkProgram(p);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
      const log = gl!.getProgramInfoLog(p);
      gl!.deleteProgram(p);
      throw new Error("fireframe link failed: " + log);
    }
    prog = p;
    vao = gl!.createVertexArray()!;
    u = {};
    for (const n of ["uScale", "uTime", "uOnDark", "uCard", "uCardR", "uCardIg"]) {
      u[n] = gl!.getUniformLocation(p, n);
    }
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
  }

  let W = 0, H = 0, scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, TUNING.DPR_CAP);
    scale = dpr * TUNING.RENDER_SCALE;
    W = Math.max(1, Math.floor(window.innerWidth * scale));
    H = Math.max(1, Math.floor(window.innerHeight * scale));
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    gl!.viewport(0, 0, W, H);
  }

  let rafId = 0;
  let running = false;
  let lost = false;
  const t0 = performance.now();

  function renderFrame() {
    rafId = requestAnimationFrame(renderFrame);
    if (!prog || !vao) return;
    const t = (performance.now() - t0) / 1000;

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    const rect = opts.getRect();
    if (!rect) return;

    const cx = (rect.left + rect.width / 2);
    const cyDown = rect.top + rect.height / 2;
    const cy = window.innerHeight - cyDown; // y-up css px
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    const rad = Math.min(rect.radius, hw, hh);
    const ig = Math.min(1, t / FIRE_TUNING.IGNITE_RAMP);

    gl!.useProgram(prog);
    gl!.bindVertexArray(vao);
    gl!.uniform1f(u.uScale, scale);
    gl!.uniform1f(u.uTime, t);
    gl!.uniform1f(u.uOnDark, opts.onDark);
    gl!.uniform4f(u.uCard, cx, cy, hw, hh);
    gl!.uniform1f(u.uCardR, rad);
    gl!.uniform1f(u.uCardIg, ig);
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

  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else startLoop();
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    stopLoop();
    prog = null;
    vao = null;
  };
  const onRestored = () => {
    lost = false;
    try {
      buildGL();
      resize();
      if (!document.hidden) startLoop();
    } catch {
      /* safe: nothing renders */
    }
  };

  try {
    buildGL();
  } catch {
    return { destroy() {} };
  }
  resize();

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost, false);
  canvas.addEventListener("webglcontextrestored", onRestored, false);
  if (!document.hidden) startLoop();

  return {
    destroy() {
      stopLoop();
      lost = true;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
      if (prog) { gl!.deleteProgram(prog); prog = null; }
      if (vao) { gl!.deleteVertexArray(vao); vao = null; }
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
