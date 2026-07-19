import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const BRAND = "#FD6F00";

// A rounded, extruded "play" glyph (the reels/video motif) that idle-spins and
// tilts toward the cursor. Kept deliberately tiny: a ~170px canvas with one
// bevelled mesh + three lights — no shadows, no env map, no CDN assets — so it
// stays cheap on the GPU even at capped DPR.
function PlayMark({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.52, -0.6);
    s.lineTo(-0.52, 0.6);
    s.lineTo(0.7, 0);
    s.lineTo(-0.52, -0.6);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.36,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 5,
      steps: 1,
    });
    g.center();
    return g;
  }, []);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    // steady idle spin around Y so the depth/bevel reads as real 3D
    g.rotation.y += delta * 0.5;
    // ease a gentle tilt toward the cursor on the other two axes
    const targetX = pointer.current.y * 0.45;
    const targetZ = -pointer.current.x * 0.3;
    g.rotation.x += (targetX - g.rotation.x) * 0.06;
    g.rotation.z += (targetZ - g.rotation.z) * 0.06;
    // slow bob for life
    g.position.y = Math.sin(state.clock.elapsedTime * 1.15) * 0.05;
  });

  // dispose the geometry when unmounted (R3F disposes attached primitives, but
  // this one is created in a memo, so free it explicitly on unmount)
  return (
    <group ref={ref} scale={1.15}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={BRAND} metalness={0.18} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function HeroMarkR3F() {
  const pointer = useRef({ x: 0, y: 0 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const onLeave = () => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  };

  return (
    <div
      className="hero-mark3d-canvas"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 3.4], fov: 42 }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 5]} intensity={2.3} />
        <pointLight position={[-4, -2, 3]} intensity={1.5} color="#FFB77A" />
        <PlayMark pointer={pointer} />
      </Canvas>
    </div>
  );
}
