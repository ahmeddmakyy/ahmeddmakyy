import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Ptr = { x: number; y: number; active: number };

const PAPER = new THREE.Color("#F5F5F5");

// Brand confetti: mostly orange with maroon + ink for contrast, so the field
// reads as "Reels With Maki" and not as generic tech dots.
const PALETTE: [string, number][] = [
  ["#FD6F00", 34],
  ["#E36300", 16],
  ["#FEA55F", 24],
  ["#821513", 16],
  ["#171718", 10],
];

type Dash = {
  nx: number; // normalized position, -0.5..0.5
  ny: number;
  rot: number;
  len: number; // world units (1 unit = 100px at zoom 100)
  thick: number;
  ph: number; // drift phase
  sp: number; // drift speed
  amp: number; // drift amplitude
  depth: number; // 0..1 — nearer dashes react more (parallax)
  ox: number; // eased repulsion offset
  oy: number;
  orot: number;
};

function pickColor(rand: number) {
  const total = PALETTE.reduce((s, [, w]) => s + w, 0);
  let acc = rand * total;
  for (const [hex, w] of PALETTE) {
    acc -= w;
    if (acc <= 0) return hex;
  }
  return PALETTE[0][0];
}

function Field({ pointer, count }: { pointer: React.MutableRefObject<Ptr>; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const viewport = useThree((s) => s.viewport);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const dashes = useMemo<Dash[]>(() => {
    const out: Dash[] = [];
    // Density thins toward the middle so the headline and portrait sit on clean
    // paper — the field frames the content instead of fighting it.
    const accept = (nx: number, ny: number) => {
      const ex = nx / 0.5;
      const ey = ny / 0.5;
      const d = Math.sqrt(ex * ex * 0.5 + ey * ey);
      const p = Math.min(1, Math.max(0, (d - 0.3) / 0.55));
      return Math.random() < p * p * 0.92 + 0.05;
    };

    for (let i = 0; i < count; i++) {
      let nx = 0;
      let ny = 0;
      for (let tries = 0; tries < 24; tries++) {
        nx = Math.random() - 0.5;
        ny = Math.random() - 0.5;
        if (accept(nx, ny)) break;
      }
      const depth = Math.random();
      out.push({
        nx,
        ny,
        rot: Math.random() * Math.PI,
        // near dashes slightly longer/thicker than far ones
        len: 0.045 + depth * 0.075 + Math.random() * 0.02,
        thick: 0.015 + depth * 0.008,
        ph: Math.random() * Math.PI * 2,
        sp: 0.12 + Math.random() * 0.3,
        amp: 0.03 + Math.random() * 0.07,
        depth: 0.35 + depth * 0.65,
        ox: 0,
        oy: 0,
        orot: 0,
      });
    }
    return out;
  }, [count]);

  // colours are static per instance — set once
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(pickColor(Math.random()));
      // fade some toward the paper so the field has depth instead of reading
      // as one flat layer of stickers
      c.lerp(PAPER, 0.14 + Math.random() * 0.5);
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const vw = viewport.width;
    const vh = viewport.height;

    const mx = pointer.current.x * vw * 0.5;
    const my = pointer.current.y * vh * 0.5;
    const act = pointer.current.active;
    const R = Math.min(vw, vh) * 0.34; // influence radius
    const ease = Math.min(1, dt * 5);

    for (let i = 0; i < count; i++) {
      const d = dashes[i];
      // slow ambient drift so the field breathes even without a cursor
      const x = d.nx * vw + Math.sin(t * d.sp + d.ph) * d.amp;
      const y = d.ny * vh + Math.cos(t * d.sp * 0.82 + d.ph) * d.amp;

      let tx = 0;
      let ty = 0;
      let trot = 0;
      if (act > 0.01) {
        const dx = x - mx;
        const dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < R) {
          const f = 1 - dist / R;
          const push = f * f * R * 0.52 * act * d.depth;
          const inv = dist > 1e-4 ? 1 / dist : 0;
          tx = dx * inv * push;
          ty = dy * inv * push;
          trot = f * f * 1.1 * d.depth;
        }
      }
      d.ox += (tx - d.ox) * ease;
      d.oy += (ty - d.oy) * ease;
      d.orot += (trot - d.orot) * ease;

      dummy.position.set(x + d.ox, y + d.oy, 0);
      dummy.rotation.z = d.rot + d.orot;
      dummy.scale.set(d.len, d.thick, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default function HeroFieldR3F({
  pointer,
  count,
}: {
  pointer: React.MutableRefObject<Ptr>;
  count: number;
}) {
  return (
    <Canvas
      className="hero-field-canvas"
      orthographic
      camera={{ position: [0, 0, 10], zoom: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Field pointer={pointer} count={count} />
    </Canvas>
  );
}
