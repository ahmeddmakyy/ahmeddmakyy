import { useEffect, useRef } from "react";
import Zdog from "zdog";

// The lightweight fallback: the same "play" motif as pseudo-3D vector on Canvas
// (no WebGL, ~10KB). Used on tablets / non-fine-pointer / lower-memory devices
// so they still get a spinning 3D-ish brand mark without shipping three.js.
export default function HeroMarkZdog() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const illo = new Zdog.Illustration({ element: el, zoom: 4.2, resize: false });

    const play = new Zdog.Group({ addTo: illo });
    // filled triangle with a fat rounded stroke → reads as a solid, bevelled
    // play button when it turns
    new Zdog.Shape({
      addTo: play,
      path: [
        { x: 26, y: 0 },
        { x: -18, y: -24 },
        { x: -18, y: 24 },
      ],
      stroke: 18,
      color: "#FD6F00",
      fill: true,
      closed: true,
    });
    illo.rotate.x = -0.22;

    let rot = 0;
    const animate = () => {
      rot += 0.02;
      illo.rotate.y = rot;
      illo.updateRenderGraph();
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} className="hero-mark3d-canvas" width={300} height={300} />
  );
}
