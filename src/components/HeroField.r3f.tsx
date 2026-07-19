import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mulberry32, poissonDisk } from "@/lib/poisson";

export type Ptr = { x: number; y: number; active: number };

/* ── geometry of the field ──────────────────────────────────────────────────
 * Everything below lives in "local" units: the Points mesh is scaled by 5 under
 * a 40deg camera at z = 3.1, which puts exactly 0.2257 local units between the
 * centre of the banner and its top edge. That number is load-bearing — the ring
 * radius, the noise frequencies and the drift amplitudes are all tuned against
 * it, so keeping the camera means every constant transfers unchanged. */
const FOV = 40;
const CAM_Z = 3.1;
const MESH_SCALE = 5;
const HALF_H = (Math.tan((FOV * Math.PI) / 360) * CAM_Z) / MESH_SCALE;

/** 250 raw sampling units == 1 local unit, so minDistance keeps its meaning. */
const UNITS_PER_LOCAL = 250;

/* The sim feeds its own output back at a gain of 0.8 * 0.25, so a particle
 * settles at 1.25x its home position. That expansion is free margin: sampling
 * the visible rect alone already spills a quarter of the field past the edges,
 * which is why nothing ever ends in a visible seam. */
const EXPANSION = 1.25;
/** a little slack on top, mostly for the far depth layer which projects inward */
const SPREAD = 1.1;

const RING_WIDTH = 0.107;
const RING_WIDTH2 = 0.05;
const RING_DISPLACEMENT = 0.15;
const PARTICLE_SCALE = 1.5;
/** local units of z either side of the plane — small on purpose, the parallax
 *  should be felt rather than noticed */
const DEPTH_SPREAD = 0.09;

/* Brand palette on paper. progress skews low, so uColor1 is what the field
 * mostly reads as: orange, with maroon scattered through it and ink only on the
 * rare spikes. Same shape as the original's blue / red / yellow. */
const COLOR_1 = "#FD6F00";
const COLOR_2 = "#821513";
const COLOR_3 = "#171718";
const HAZE_FROM = "#E36300";
const PAPER = "#F5F5F5";

const TMP_COLOR = new THREE.Color();

/* Ashima / Stefan Gustavson's textureless simplex noise (webgl-noise, MIT).
 * Shared verbatim by both passes. */
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/* The sim quad bypasses the matrices entirely — position is already clip space. */
const SIM_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* One texel per particle, RGBA = (x, y, scale, velocity). Home positions live in
 * a separate static texture so nothing has to be re-uploaded per frame. */
const SIM_FRAG = /* glsl */ `
uniform sampler2D uPosition;
uniform sampler2D uPosRefs;
uniform float uTime;
uniform vec2  uRingPos;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uRingWidth2;
uniform float uRingDisplacement;
uniform vec2  uFieldExtent;
varying vec2 vUv;

${SNOISE}

void main() {
  vec4 pFrame = texture2D(uPosition, vUv);
  vec4 refs   = texture2D(uPosRefs, vUv);

  float scale = pFrame.z;
  float velocity = pFrame.w;
  vec2 refPos = refs.xy;
  float near = refs.z;

  float time = uTime * .5;
  vec2 curentPos = refPos;
  vec2 pos = pFrame.xy;
  pos *= .8;

  // ring mask around the cursor: a thin bright core, a wider soft band, and a
  // gentle fill inside
  float dist = distance(curentPos.xy, uRingPos);
  float noise0 = snoise(vec3(curentPos.xy * .2 + vec2(18.4924, 72.9744), time * 0.5));
  float dist1 = distance(curentPos.xy + (noise0 * .005), uRingPos);

  float t  = smoothstep(uRingRadius - (uRingWidth * 2.), uRingRadius, dist)
           - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
  float t2 = smoothstep(uRingRadius - (uRingWidth2 * 2.), uRingRadius, dist)
           - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
  float t3 = smoothstep(uRingRadius + uRingWidth2, uRingRadius, dist);

  // pow() of a negative is undefined, and one NaN here would sit in the
  // feedback texture forever — clamp before every exponent
  t = pow(max(t, 0.), 2.);
  t2 = pow(max(t2, 0.), 3.);
  t += t2 * 3.;
  t += t3 * .4;
  t += snoise(vec3(curentPos.xy * 30. + vec2(11.4924, 12.9744), time * .5)) * t3 * .5;
  t = max(t, 0.);

  // every particle is always there; this slow field is what decides which ones
  // are big enough to see, so the clusters drift, appear and dissolve
  float nS = snoise(vec3(curentPos.xy * 2. + vec2(18.4924, 72.9744), time * 0.5));
  float ambient = pow(max((nS + 1.5) * .5, 0.), 2.) * .6;

  float noise1 = snoise(vec3(curentPos.xy *  4. + vec2(88.494,   32.4397), time * 0.35));
  float noise2 = snoise(vec3(curentPos.xy *  4. + vec2(50.904,  120.947 ), time * 0.35));
  float noise3 = snoise(vec3(curentPos.xy * 20. + vec2(18.4924,  72.9744), time * .5));
  float noise4 = snoise(vec3(curentPos.xy * 20. + vec2(50.904,  120.947 ), time * .5));

  vec2 disp  = vec2(noise1, noise2) * .03;
       disp += vec2(noise3, noise4) * .005;
  disp.x += sin((refPos.x * 20.) + (time * 4.)) * .02 * clamp(dist, 0., 1.);
  disp.y += cos((refPos.y * 20.) + (time * 3.)) * .02 * clamp(dist, 0., 1.);
  // depth, cheaply: near marks drift further and part harder than far ones
  disp *= .78 + near * .44;

  pos -= (uRingPos - (curentPos + disp)) * pow(t2, .75) * uRingDisplacement * (.55 + near * .8);

  // the headline and the portrait own the middle of the banner, so the resting
  // field thins out of it instead of crawling over the type. Squashed on x so
  // the quiet patch is as wide as the title rather than round. The ring keeps
  // most of its punch through the middle — that sweep is the interaction.
  vec2 e = curentPos / uFieldExtent;
  float clear = .42 + smoothstep(.1, .55, sqrt(e.x * e.x * .6 + e.y * e.y)) * .58;

  scale += ((t * mix(clear, 1., .55) + ambient * clear) - scale) * .2;
  vec2 finalPos = curentPos + disp + (pos * .25);
  velocity = velocity * .5 + scale * .25;

  gl_FragColor = vec4(finalPos, scale, velocity);
}
`;

/* Colour, rotation and alpha are constant across a point sprite, so they are all
 * resolved here rather than per fragment — same picture, two orders of magnitude
 * fewer noise evaluations. */
const DRAW_VERT = /* glsl */ `
uniform sampler2D uPosition;
uniform float uTime;
uniform float uPixelRatio;
uniform float uParticleScale;
uniform float uDepthSpread;
uniform float uCamZ;
uniform vec2  uRingPos;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uHaze;

attribute vec4 seeds;

varying vec3  vColor;
varying vec2  vRotSC;
varying float vAlphaBase;

${SNOISE}

void main() {
  vec4 pos = texture2D(uPosition, uv);
  vec2 localPos = pos.xy;
  float scale = pos.z;
  float near = seeds.w;

  float z = (near - .5) * 2. * uDepthSpread;
  vec4 viewSpace = modelViewMatrix * vec4(vec3(localPos, z), 1.0);
  gl_Position = projectionMatrix * viewSpace;

  // perspective attenuation normalised so a mark sitting on z = 0 keeps exactly
  // the size it would have had in a flat field
  float att = uCamZ / max(-viewSpace.z, .001);
  gl_PointSize = clamp(
    scale * 7. * (uPixelRatio * .5) * uParticleScale * (.85 + seeds.y * .3) * att,
    0., 96.);

  // dashes lie across the ring, not with it
  float noiseAngle = snoise(vec3(localPos * 10. + vec2(18.4924, 72.9744), uTime * .85));
  float angle = atan(localPos.y - uRingPos.y, localPos.x - uRingPos.x);
  float rot = -angle + (noiseAngle * .5) + (seeds.x - .5) * .7;
  vRotSC = vec2(cos(rot), sin(rot));

  float noiseColor = snoise(vec3(localPos * 2. + vec2(74.664, 91.556), uTime * .5));
  noiseColor = (noiseColor + 1.) * .5;
  float h = 0.8;
  float progress = smoothstep(0., .75, pow(noiseColor, 2.));
  // a per-particle nudge so the accents scatter instead of arriving in patches
  progress = clamp(progress + (seeds.z - .5) * .22, 0., 1.);
  vec3 color = mix(mix(uColor1, uColor2, progress / h),
                   mix(uColor2, uColor3, (progress - h) / (1. - h)),
                   step(h, progress));

  // far marks sink toward a washed brand orange, so the field reads as layers
  // rather than one flat sheet of stickers
  vColor = mix(uHaze, color, .5 + near * .5);
  vAlphaBase = smoothstep(0.1, 0.2, scale) * (.6 + near * .4);
}
`;

const DRAW_FRAG = /* glsl */ `
uniform float uAlpha;

varying vec3  vColor;
varying vec2  vRotSC;
varying float vAlphaBase;

float sdRoundBox(vec2 p, vec2 b, vec4 r) {
  r.xy = (p.x > 0.) ? r.xy : r.zw;
  r.x  = (p.y > 0.) ? r.x  : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r.x;
}

void main() {
  vec2 uv = gl_PointCoord.xy - vec2(0.5);
  uv.y *= -1.;
  uv = mat2(vRotSC.x, -vRotSC.y, vRotSC.y, vRotSC.x) * uv;

  // a 1 : 0.4 capsule — the dash. Inset just far enough that the soft edge
  // survives rotation instead of getting chopped by the sprite quad.
  float rounded = sdRoundBox(uv, vec2(0.38, 0.155), vec4(.19));
  rounded = smoothstep(.1, 0., rounded);

  float a = uAlpha * rounded * vAlphaBase;
  if (a < 0.01) discard;

  gl_FragColor = vec4(vColor, clamp(a, 0., 1.));
  #include <colorspace_fragment>
}
`;

/** 1D value noise, 0..1 — drives the ring's idle wander. */
function hash1(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}
function wander(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i) * (1 - u) + hash1(i + 1) * u;
}

type Bundle = {
  rtA: THREE.WebGLRenderTarget;
  rtB: THREE.WebGLRenderTarget;
  refs: THREE.DataTexture;
  simMaterial: THREE.ShaderMaterial;
  simGeometry: THREE.PlaneGeometry;
  simScene: THREE.Scene;
  simCamera: THREE.OrthographicCamera;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  points: THREE.Points;
  ring: THREE.Vector2;
  cursor: THREE.Vector2;
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  time: number;
  age: number;
  cleared: boolean;
};

function buildBundle(
  gl: THREE.WebGLRenderer,
  density: number,
  maxSize: number,
  aspect: number,
): Bundle | null {
  // the sim reads and writes a float texture every frame; without a renderable
  // float format there is nothing to fall back to, so draw nothing at all
  const float = gl.extensions.has("EXT_color_buffer_float");
  const half = float || gl.extensions.has("EXT_color_buffer_half_float");
  if (!half) return null;

  const halfH = HALF_H * SPREAD;
  const halfW = halfH * aspect;
  // the reference samples a 500-unit square; this samples only the rect the
  // camera can actually see, at the same minDistance, so the density matches
  // while the off-screen 90% of the field simply never exists
  const width = halfW * 2 * UNITS_PER_LOCAL;
  const height = halfH * 2 * UNITS_PER_LOCAL;
  const d = Math.max(0, Math.min(300, density));
  const minDistance = 10 - (d / 300) * 8;

  const raw = poissonDisk({
    width,
    height,
    minDistance,
    maxDistance: minDistance + 1,
    tries: 20,
    seed: 0x5eed1e,
    limit: maxSize * maxSize * 2,
  });

  const found = raw.length / 2;
  if (found < 8) return null;
  // capacity is size * size; if the fill overshoots, stride through it rather
  // than truncating — Bridson grows outward, so the first N would be a blob
  const count = Math.min(found, maxSize * maxSize);
  const stride = found / count;
  const size = Math.max(2, Math.ceil(Math.sqrt(count)));

  const refsData = new Float32Array(size * size * 4);
  const uvs = new Float32Array(count * 2);
  const seeds = new Float32Array(count * 4);
  const rand = mulberry32(0xc0ffee);

  for (let i = 0; i < count; i++) {
    const src = Math.min(found - 1, Math.floor(i * stride)) * 2;
    const x = raw[src] / UNITS_PER_LOCAL - halfW;
    const y = raw[src + 1] / UNITS_PER_LOCAL - halfH;
    const near = rand();

    refsData[i * 4] = x;
    refsData[i * 4 + 1] = y;
    refsData[i * 4 + 2] = near;
    refsData[i * 4 + 3] = rand();

    // sample the texel centre, otherwise nearest filtering can land on a
    // neighbour at some device pixel ratios
    uvs[i * 2] = ((i % size) + 0.5) / size;
    uvs[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size;

    seeds[i * 4] = rand();
    seeds[i * 4 + 1] = rand();
    seeds[i * 4 + 2] = rand();
    seeds[i * 4 + 3] = near;
  }

  const refs = new THREE.DataTexture(refsData, size, size, THREE.RGBAFormat, THREE.FloatType);
  refs.minFilter = THREE.NearestFilter;
  refs.magFilter = THREE.NearestFilter;
  refs.wrapS = THREE.ClampToEdgeWrapping;
  refs.wrapT = THREE.ClampToEdgeWrapping;
  refs.generateMipmaps = false;
  refs.needsUpdate = true;

  const rtOpts: THREE.RenderTargetOptions = {
    format: THREE.RGBAFormat,
    // linear filtering on float textures needs an extension we do not need;
    // a GPGPU sim addresses exact texels anyway
    type: float ? THREE.FloatType : THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  };
  const rtA = new THREE.WebGLRenderTarget(size, size, rtOpts);
  const rtB = new THREE.WebGLRenderTarget(size, size, rtOpts);

  const simMaterial = new THREE.ShaderMaterial({
    vertexShader: SIM_VERT,
    fragmentShader: SIM_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uPosition: { value: rtA.texture },
      uPosRefs: { value: refs },
      uTime: { value: 0 },
      uRingPos: { value: new THREE.Vector2() },
      uRingRadius: { value: 0.175 },
      uRingWidth: { value: RING_WIDTH },
      uRingWidth2: { value: RING_WIDTH2 },
      uRingDisplacement: { value: RING_DISPLACEMENT },
      uFieldExtent: { value: new THREE.Vector2(HALF_H * aspect, HALF_H) },
    },
  });

  const simGeometry = new THREE.PlaneGeometry(2, 2);
  const simScene = new THREE.Scene();
  const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const simQuad = new THREE.Mesh(simGeometry, simMaterial);
  simQuad.frustumCulled = false;
  simScene.add(simQuad);

  const geometry = new THREE.BufferGeometry();
  // position is never read — it only tells three how many points to draw
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("seeds", new THREE.BufferAttribute(seeds, 4));

  const haze = new THREE.Color(HAZE_FROM).lerp(new THREE.Color(PAPER), 0.5);
  const material = new THREE.ShaderMaterial({
    vertexShader: DRAW_VERT,
    fragmentShader: DRAW_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uPosition: { value: rtA.texture },
      uTime: { value: 0 },
      uPixelRatio: { value: gl.getPixelRatio() },
      uParticleScale: { value: 1 },
      uDepthSpread: { value: DEPTH_SPREAD },
      uCamZ: { value: CAM_Z },
      uRingPos: { value: new THREE.Vector2() },
      uAlpha: { value: 0 },
      uColor1: { value: new THREE.Color(COLOR_1) },
      uColor2: { value: new THREE.Color(COLOR_2) },
      uColor3: { value: new THREE.Color(COLOR_3) },
      uHaze: { value: haze },
    },
  });

  const points = new THREE.Points(geometry, material);
  points.scale.setScalar(MESH_SCALE);
  points.frustumCulled = false;

  return {
    rtA,
    rtB,
    refs,
    simMaterial,
    simGeometry,
    simScene,
    simCamera,
    geometry,
    material,
    points,
    ring: new THREE.Vector2(),
    cursor: new THREE.Vector2(),
    read: rtA,
    write: rtB,
    time: 0,
    age: 0,
    cleared: false,
  };
}

function disposeBundle(b: Bundle) {
  b.rtA.dispose();
  b.rtB.dispose();
  b.refs.dispose();
  b.simMaterial.dispose();
  b.simGeometry.dispose();
  b.geometry.dispose();
  b.material.dispose();
  b.simScene.clear();
}

function Field({ pointer, density, maxSize }: { pointer: React.RefObject<Ptr>; density: number; maxSize: number }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  // the Poisson set is cut for one aspect ratio; quantising means a drag-resize
  // rebuilds a handful of times instead of on every frame
  const aspectKey = Math.max(0.4, Math.min(3.2, Math.round((size.width / Math.max(1, size.height)) * 4) / 4));

  const bundle = useMemo(
    () => buildBundle(gl, density, maxSize, aspectKey),
    [gl, density, maxSize, aspectKey],
  );

  useEffect(() => {
    if (!bundle) return;
    return () => disposeBundle(bundle);
  }, [bundle]);

  useFrame((state, delta) => {
    const b = bundle;
    if (!b) return;

    // a fresh render target holds undefined floats, which would poison the whole
    // feedback loop on frame one
    if (!b.cleared) {
      const prevColor = gl.getClearColor(TMP_COLOR).getHex();
      const prevAlpha = gl.getClearAlpha();
      const prevTarget = gl.getRenderTarget();
      gl.setClearColor(0x000000, 0);
      gl.setRenderTarget(b.rtA);
      gl.clear(true, false, false);
      gl.setRenderTarget(b.rtB);
      gl.clear(true, false, false);
      gl.setRenderTarget(prevTarget);
      gl.setClearColor(prevColor, prevAlpha);
      b.cleared = true;
    }

    // own clock: clamped so scrolling the hero out of view and back does not
    // teleport the noise field on the frame the loop restarts
    const dt = Math.min(delta, 1 / 30);
    b.time += dt;
    b.age += dt;
    const t = b.time;

    const aspect = state.size.width / Math.max(1, state.size.height);
    const hy = HALF_H;
    const hx = hy * aspect;
    // a portrait banner is narrower than the ring is wide, so shrink the ring
    // with the short axis instead of letting it swallow the whole field
    const ringScale = Math.min(1, hx / hy);

    const nx = (wander(t * 0.66 + 94.234) - 0.5) * 2;
    const ny = (wander(t * 0.75 + 21.028) - 0.5) * 2;
    const ptr = pointer.current;

    let k: number;
    if (ptr.active > 0.01) {
      b.cursor.set(ptr.x * hx * 0.875 + nx * hy * 0.44, ptr.y * hy * 0.875 + ny * hy * 0.44);
      k = 0.02;
    } else {
      // no cursor: the ring goes for a slow walk of its own
      b.cursor.set(nx * hx * 0.5, ny * hy * 0.44);
      k = 0.01;
    }
    // the lag is the whole character of the thing — keep it identical on a
    // 120 Hz panel instead of letting the ring chase twice as fast
    b.ring.lerp(b.cursor, 1 - Math.pow(1 - k, dt * 60));

    const radius = (0.175 + Math.sin(t) * 0.03 + Math.cos(t * 3) * 0.02) * ringScale;

    const su = b.simMaterial.uniforms;
    su.uTime.value = t;
    su.uPosition.value = b.read.texture;
    su.uRingPos.value.copy(b.ring);
    su.uRingRadius.value = radius;
    su.uRingWidth.value = RING_WIDTH * ringScale;
    su.uRingWidth2.value = RING_WIDTH2 * ringScale;
    su.uFieldExtent.value.set(hx / EXPANSION, hy / EXPANSION);

    const prevTarget = gl.getRenderTarget();
    gl.setRenderTarget(b.write);
    gl.render(b.simScene, b.simCamera);
    gl.setRenderTarget(prevTarget);

    const swap = b.read;
    b.read = b.write;
    b.write = swap;

    const du = b.material.uniforms;
    du.uPosition.value = b.read.texture;
    du.uTime.value = t;
    du.uRingPos.value.copy(b.ring);
    du.uPixelRatio.value = gl.getPixelRatio();
    // dashes track the banner width, with a floor so they do not disappear on a
    // phone; the CSS fade can finish before the chunk lands, so ramp in here too
    du.uParticleScale.value = Math.max(0.55, state.size.width / 2000) * PARTICLE_SCALE;
    du.uAlpha.value = Math.min(1, b.age / 1.1);
  });

  if (!bundle) return null;
  // the bundle owns every GPU resource and frees them together on unmount
  return <primitive object={bundle.points} dispose={null} />;
}

export default function HeroFieldR3F({
  pointer,
  density,
  maxSize,
  live,
}: {
  pointer: React.RefObject<Ptr>;
  density: number;
  maxSize: number;
  live: boolean;
}) {
  return (
    <Canvas
      className="hero-field-canvas"
      frameloop={live ? "always" : "never"}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      // the dashes are SDF-antialiased in the shader, so MSAA buys nothing and
      // costs a full-screen resolve every frame
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
    >
      <Field pointer={pointer} density={density} maxSize={maxSize} />
    </Canvas>
  );
}
