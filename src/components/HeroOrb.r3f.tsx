import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// A soft radial glow sprite, generated on a tiny canvas (no external asset), so
// every particle reads as a glowing mote instead of a hard dot.
function makeGlowTexture() {
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.25, "rgba(255,236,205,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

type P = { r: number; theta: number; phi: number; spin: number; tw: number; drift: number };

const COUNT = 3400;

const VERT = /* glsl */ `
  attribute float size;
  attribute vec3 acolor;
  varying vec3 vColor;
  void main() {
    vColor = acolor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (150.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, 1.0) * tex.a;
  }
`;

function EnergyCloud({
  pointer,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number; active: number }>;
}) {
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(makeGlowTexture, []);

  const { geometry, material, params } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const acolor = new Float32Array(COUNT * 3);
    const size = new Float32Array(COUNT);
    const params: P[] = new Array(COUNT);

    // luminous warm palette — gold/orange only (red reads as blood spots on
    // the maroon disc, so the rim stays bright orange, never ember)
    const white = new THREE.Color("#FFF9EF");
    const gold = new THREE.Color("#FFCE73");
    const orange = new THREE.Color("#FF8A1E");
    const ember = new THREE.Color("#FF5A0D");

    for (let i = 0; i < COUNT; i++) {
      const r = Math.pow(Math.random(), 0.8) * 2.6; // fills the disc evenly
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      params[i] = {
        r,
        theta,
        phi,
        spin: 0.06 + Math.random() * 0.14,
        tw: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 1.0,
      };

      const t = r / 2.6;
      // white-gold core → orange body → ember rim
      const col =
        t < 0.35
          ? white.clone().lerp(gold, t / 0.35)
          : t < 0.7
            ? gold.clone().lerp(orange, (t - 0.35) / 0.35)
            : orange.clone().lerp(ember, (t - 0.7) / 0.3);
      acolor[i * 3] = col.r;
      acolor[i * 3 + 1] = col.g;
      acolor[i * 3 + 2] = col.b;

      // soft motes in the core, fine sparks at the rim — biased bigger/softer
      // so the field reads as a creamy nebula, not grainy sand
      size[i] = Math.pow(1 - t, 1.4) * 2.2 + 0.6 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("acolor", new THREE.BufferAttribute(acolor, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(size, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, material, params };
  }, [tex]);

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const t = state.clock.elapsedTime;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    const d = Math.min(delta, 0.05);

    const px = pointer.current.x * 2.8;
    const py = pointer.current.y * 2.2;
    const pull = pointer.current.active;

    for (let i = 0; i < COUNT; i++) {
      const p = params[i];
      p.theta += p.spin * d;
      const rr = p.r + Math.sin(t * 0.5 + p.tw) * 0.14 * p.drift;
      let x = rr * Math.sin(p.phi) * Math.cos(p.theta);
      let y = rr * Math.sin(p.phi) * Math.sin(p.theta) * 0.86;
      const z = rr * Math.cos(p.phi);

      if (pull > 0.001) {
        const dx = x - px;
        const dy = y - py;
        const dist2 = dx * dx + dy * dy + 0.4;
        const f = (pull * 2.1) / dist2;
        x += dx * f;
        y += dy * f;
      }

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    pts.geometry.attributes.position.needsUpdate = true;

    pts.rotation.y = t * 0.07;
    pts.rotation.z = Math.sin(t * 0.15) * 0.09;
    pointer.current.active += (0 - pointer.current.active) * d * 1.1;
  });

  // lifted so the glow halos the head/shoulders — the portrait covers the
  // lower half of the disc anyway
  return (
    <points
      ref={ref}
      geometry={geometry}
      material={material}
      rotation={[-0.32, 0, 0]}
      position={[0, 1.4, 0]}
    />
  );
}

// A big soft additive core — the glowing "idea" heart, pulsing slowly.
function Core() {
  const ref = useRef<THREE.Sprite>(null);
  const tex = useMemo(makeGlowTexture, []);
  useFrame((state) => {
    const s = ref.current;
    if (!s) return;
    const k = 2.5 + Math.sin(state.clock.elapsedTime * 0.9) * 0.22;
    s.scale.set(k, k, k);
  });
  return (
    <sprite ref={ref} position={[0, 1.55, -0.4]}>
      <spriteMaterial
        map={tex}
        color="#FF8C2A"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.55}
      />
    </sprite>
  );
}

export default function HeroOrbR3F({
  pointer,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number; active: number }>;
}) {
  return (
    <Canvas
      className="hero-orb-canvas"
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6.4], fov: 46 }}
    >
      <Core />
      <EnergyCloud pointer={pointer} />
    </Canvas>
  );
}
