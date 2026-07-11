import type { Phase } from "./types";

// ---------------------------------------------------------------------------
// Pure math / classification utilities extracted from generators.ts.
// These have NO data dependencies — they are stateless helper functions.
// ---------------------------------------------------------------------------

/** Classify an ONI value into an ENSO phase. */
export function classifyPhase(oni: number): Phase {
  if (oni >= 0.5) return "El Niño";
  if (oni <= -0.5) return "La Niña";
  return "Neutral";
}

/** Pearson correlation coefficient between two arrays. */
export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export interface Regression {
  slope: number;
  intercept: number;
  r2: number;
}

/** Ordinary least-squares linear regression. */
export function linearRegression(points: { x: number; y: number }[]): Regression {
  const n = points.length;
  const sx = points.reduce((a, p) => a + p.x, 0);
  const sy = points.reduce((a, p) => a + p.y, 0);
  const sxx = points.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = points.reduce((a, p) => a + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const r = pearson(
    points.map((p) => p.x),
    points.map((p) => p.y),
  );
  return { slope, intercept, r2: Math.round(r * r * 1000) / 1000 };
}

/** Two-tailed p-value approximation from Pearson r and sample size n. */
export function pValue(r: number, n: number): number {
  if (n < 3) return 1;
  const rr = Math.min(0.9999, Math.abs(r));
  const t = rr * Math.sqrt((n - 2) / (1 - rr * rr));
  const z = t;
  const p = 2 * (1 - normCdf(z));
  return Math.max(0, Math.min(1, Math.round(p * 1000) / 1000));
}

function normCdf(x: number): number {
  // Abramowitz & Stegun 7.1.26
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
