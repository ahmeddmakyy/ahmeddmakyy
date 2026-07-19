import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Ptr } from "./HeroField.r3f";

const FieldR3F = lazy(() => import("./HeroField.r3f"));

export default function HeroField() {
  const [count, setCount] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<Ptr>({ x: 0, y: 0, active: 0 });

  // Client-only: decide density from the viewport after hydration. Reduced
  // motion opts out entirely (the field is pure decoration).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
    } catch {
      return;
    }
    // keep the visual density even, not the raw count — a phone shows the same
    // dash size in a fraction of the area, so it needs far fewer marks
    const w = window.innerWidth;
    setCount(w < 640 ? 110 : w < 1100 ? 260 : 580);
  }, []);

  // Cursor drives the repulsion. Tracked on the hero section so the field
  // reacts across the whole banner, not just where the canvas sits.
  useEffect(() => {
    if (!count) return;
    const box = boxRef.current;
    if (!box) return;
    const host = (box.closest(".hero") as HTMLElement) ?? box;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.current.active = 1;
    };
    const onLeave = () => {
      pointer.current.active = 0;
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [count]);

  return (
    <div ref={boxRef} className="hero-field" aria-hidden="true">
      {count > 0 ? (
        <Suspense fallback={null}>
          <FieldR3F pointer={pointer} count={count} />
        </Suspense>
      ) : null}
    </div>
  );
}
