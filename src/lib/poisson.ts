/* Blue-noise point placement for the hero particle field.
 *
 * Plain Math.random() scatter reads as clumps and holes; Poisson-disk keeps
 * every point at least `minDistance` from its neighbours, so the field looks
 * evenly spread yet organic — that even spacing is what makes the field feel
 * organised rather than noisy.
 *
 * Deterministic on purpose: the same seed always yields the same set, so SSR,
 * hydration and a reload all agree and the field never re-shuffles under the
 * user. */

/** Small, fast, well-distributed 32-bit PRNG. Same seed, same stream. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PoissonOptions = {
  width: number;
  height: number;
  /** no two points end up closer than this */
  minDistance: number;
  /** candidates are thrown into the [min, max] annulus. A narrow band packs
   *  tighter and more regularly than Bridson's usual [r, 2r]. */
  maxDistance?: number;
  /** candidates per active point before it is retired */
  tries?: number;
  seed?: number;
  /** hard stop so a bad minDistance can never lock up the main thread */
  limit?: number;
};

/**
 * Bridson's algorithm. Returns a flat [x0, y0, x1, y1, …] in the range
 * [0, width] x [0, height].
 */
export function poissonDisk({
  width,
  height,
  minDistance,
  maxDistance = minDistance * 2,
  tries = 20,
  seed = 0x9e3779b9,
  limit = 200000,
}: PoissonOptions): Float32Array {
  if (!(width > 0) || !(height > 0) || !(minDistance > 0)) return new Float32Array(0);

  const rand = mulberry32(seed);
  // a cell of minDistance/sqrt(2) has a diagonal of exactly minDistance, so it
  // can hold at most one point — that is what makes the neighbour test O(1)
  const cell = minDistance / Math.SQRT2;
  const gw = Math.max(1, Math.ceil(width / cell));
  const gh = Math.max(1, Math.ceil(height / cell));
  const grid = new Int32Array(gw * gh).fill(-1);

  const px: number[] = [];
  const py: number[] = [];
  const active: number[] = [];
  const min2 = minDistance * minDistance;
  const span = maxDistance - minDistance;

  const emit = (x: number, y: number) => {
    const id = px.length;
    px.push(x);
    py.push(y);
    const gx = Math.min(gw - 1, (x / cell) | 0);
    const gy = Math.min(gh - 1, (y / cell) | 0);
    grid[gy * gw + gx] = id;
    active.push(id);
  };

  const fits = (x: number, y: number) => {
    const cx = Math.min(gw - 1, (x / cell) | 0);
    const cy = Math.min(gh - 1, (y / cell) | 0);
    // minDistance spans ~1.41 cells, so anything closer lives within ±2
    const x0 = cx > 2 ? cx - 2 : 0;
    const x1 = cx + 2 < gw ? cx + 2 : gw - 1;
    const y0 = cy > 2 ? cy - 2 : 0;
    const y1 = cy + 2 < gh ? cy + 2 : gh - 1;
    for (let gy = y0; gy <= y1; gy++) {
      const row = gy * gw;
      for (let gx = x0; gx <= x1; gx++) {
        const id = grid[row + gx];
        if (id < 0) continue;
        const dx = px[id] - x;
        const dy = py[id] - y;
        if (dx * dx + dy * dy < min2) return false;
      }
    }
    return true;
  };

  emit(rand() * width, rand() * height);

  while (active.length > 0 && px.length < limit) {
    const slot = (rand() * active.length) | 0;
    const from = active[slot];
    const fx = px[from];
    const fy = py[from];
    let placed = false;

    for (let i = 0; i < tries; i++) {
      const ang = rand() * Math.PI * 2;
      const r = minDistance + rand() * span;
      const x = fx + Math.cos(ang) * r;
      const y = fy + Math.sin(ang) * r;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (!fits(x, y)) continue;
      emit(x, y);
      placed = true;
      break;
    }

    if (!placed) {
      // swap-and-pop: order does not matter, and it keeps retirement O(1)
      active[slot] = active[active.length - 1];
      active.pop();
    }
  }

  const out = new Float32Array(px.length * 2);
  for (let i = 0; i < px.length; i++) {
    out[i * 2] = px[i];
    out[i * 2 + 1] = py[i];
  }
  return out;
}
