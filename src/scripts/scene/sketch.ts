// Small tools for the drawings that the script makes again in each frame: the flock and the volley.

/** A point of a drawing: across, and down. */
export type Point = readonly [number, number];

/**
 * Draws a moving source onto a small canvas, at one moment of its scene. The context maps the pixels of the
 * layer onto the grid of the layer, so that each pixel of the canvas is one cell. A painter draws in black,
 * and the share of a cell that it covers sets the width of the bar of that cell. A still scene has no
 * moment: the painter then shows the moment that its source names.
 */
export type Painter = (
  context: CanvasRenderingContext2D,
  seconds: number | undefined,
  width: number,
  height: number,
) => void;

/** Gives the part of a number after the decimal point. */
export function fract(value: number): number {
  return value - Math.floor(value);
}

export function mix(from: number, to: number, share: number): number {
  return from + (to - from) * share;
}

/** Rises from 0 to 1 between the two edges, with a smooth start and a smooth end. */
export function smoothstep(from: number, to: number, value: number): number {
  const share = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return share * share * (3 - 2 * share);
}

/** Keeps a value between the two limits. Near a limit the value slows down, so that it never stops with a jolt. */
export function softClamp(value: number, lower: number, upper: number): number {
  const middle = (lower + upper) / 2;
  const half = (upper - lower) / 2;
  return half <= 0 ? middle : middle + half * Math.tanh((value - middle) / half);
}

/** Fills one closed shape through its points. */
export function traceShape(context: CanvasRenderingContext2D, points: readonly Point[]): void {
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}
