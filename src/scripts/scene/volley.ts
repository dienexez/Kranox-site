// A volley of arrows, drawn again in each frame. In each round the arrows leave one after the other. Each
// arrow flies its own arc: it enters at the left edge a little upward or level, gravity bends its path down,
// and the arrow turns along its path. A far arrow is smaller, slower, and fainter. In each round the arrows
// take new paths, so that no two volleys look the same.
import { between, createRandom, type Random } from "./random.ts";
import type { VolleySource } from "./types.ts";
import { type Painter, type Point, traceShape } from "./sketch.ts";

interface Arrow {
  /** The arrow leaves this many seconds after the start of the round. */
  delay: number;
  /** The size of the arrow, as a share of the full size. A smaller arrow seems farther away. */
  scale: number;
  /** The arrow crosses the layer in this many seconds. */
  flight: number;
  /** The angle of the path when the arrow enters, upward, and when it leaves, downward, in radians. */
  rise: number;
  fall: number;
  /** The share of the free height at which the arrow enters, from the top. */
  entry: number;
  /** The arrow quivers a little after it leaves the bow. This is where its quiver starts, in radians. */
  quiverPhase: number;
}

const VOLLEY = {
  scale: [0.6, 1],
  /** The flight of a far arrow takes up to this share longer than the flight of a near arrow. */
  farSlower: 0.35,
  pace: [0.94, 1.06],
  rise: [-0.06, 0.26],
  fall: [0.4, 0.7],
  /** An arrow keeps this share of its length away from the upper and the lower edge of the layer. */
  edge: 0.35,
  /** The quiver turns the arrow by up to this angle in radians, this many times in each second, and fades at this rate. */
  quiver: { reach: 0.035, perSecond: 8, fade: 2 },
  /** A far arrow draws at this share of the strength of a near arrow. */
  farOpacity: 0.6,
  /** The seed of a round lies this far from the seed of the round before it. */
  roundStep: 104729,
} as const;

/**
 * One arrow in its own space: one unit long, the tip at the right. A broad head, a shaft, and two long
 * feathers. The shaft is thicker than a real one, so that the bars draw it as a line and not as dots.
 */
const ARROW: readonly Point[] = [
  [0.5, 0],
  [0.33, -0.075],
  [0.36, -0.024],
  [-0.3, -0.024],
  [-0.42, -0.09],
  [-0.53, -0.09],
  [-0.45, -0.024],
  [-0.5, -0.024],
  [-0.5, 0.024],
  [-0.45, 0.024],
  [-0.53, 0.09],
  [-0.42, 0.09],
  [-0.3, 0.024],
  [0.36, 0.024],
  [0.33, 0.075],
];

const FULL_TURN = Math.PI * 2;

function createArrow(random: Random, source: VolleySource): Arrow {
  const scale = between(random, ...VOLLEY.scale);
  const slower = 1 + VOLLEY.farSlower * (1 - scale);
  return {
    delay: random() * source.spreadSeconds,
    scale,
    flight: source.crossSeconds * slower * between(random, ...VOLLEY.pace),
    rise: between(random, ...VOLLEY.rise),
    fall: between(random, ...VOLLEY.fall),
    entry: random(),
    quiverPhase: random() * FULL_TURN,
  };
}

function createVolley(source: VolleySource, round: number): Arrow[] {
  const random = createRandom(source.seed + round * VOLLEY.roundStep);
  return Array.from({ length: source.arrows }, () => createArrow(random, source));
}

/** The path of one arrow in pixels of the layer: where it enters, and its speed across, its speed down, and its gravity. */
interface Path {
  startX: number;
  startY: number;
  speedX: number;
  speedY: number;
  gravity: number;
}

/**
 * Gives the path of an arrow. The arrow enters beyond the left edge and leaves beyond the right edge. Its arc
 * stays inside the layer: the entry height leaves room for the climb at the start and for the drop at the end.
 */
function pathOf(arrow: Arrow, length: number, width: number, height: number): Path {
  const speedX = (width + 2 * length) / arrow.flight;
  const speedY = -speedX * Math.tan(arrow.rise);
  const endSpeedY = speedX * Math.tan(arrow.fall);
  const gravity = (endSpeedY - speedY) / arrow.flight;
  const climb = speedY < 0 ? (speedY * speedY) / (2 * gravity) : 0;
  const drop = (arrow.flight * (speedY + endSpeedY)) / 2;
  const edge = VOLLEY.edge * length;
  const highest = edge + climb;
  const lowest = height - edge - drop;
  const startY = lowest > highest ? highest + arrow.entry * (lowest - highest) : (highest + lowest) / 2;
  return { startX: -length, startY, speedX, speedY, gravity };
}

function drawArrow(context: CanvasRenderingContext2D, arrow: Arrow, size: number, frame: Point, seconds: number): void {
  const [width, height] = frame;
  const flown = seconds - arrow.delay;
  if (flown < 0 || flown > arrow.flight) return;
  const length = size * arrow.scale;
  const path = pathOf(arrow, length, width, height);
  const x = path.startX + path.speedX * flown;
  const y = path.startY + path.speedY * flown + (path.gravity * flown * flown) / 2;
  const { reach, perSecond, fade } = VOLLEY.quiver;
  const quiver = reach * Math.sin(FULL_TURN * perSecond * flown + arrow.quiverPhase) * Math.exp(-fade * flown);
  context.save();
  context.globalAlpha = VOLLEY.farOpacity + (1 - VOLLEY.farOpacity) * arrow.scale;
  context.translate(x, y);
  context.rotate(Math.atan2(path.speedY + path.gravity * flown, path.speedX) + quiver);
  context.scale(length, length);
  traceShape(context, ARROW);
  context.restore();
}

/** Gives the painter of a volley. It keeps the arrows of the current round, and makes new ones for the next round. */
export function createVolleyPainter(source: VolleySource): Painter {
  let current: { round: number; arrows: Arrow[] } | undefined;
  return (context, seconds, width, height) => {
    const sinceStart = (seconds ?? source.startSeconds + source.stillSeconds) - source.startSeconds;
    if (sinceStart < 0) return;
    const round = Math.floor(sinceStart / source.roundSeconds);
    if (current?.round !== round) current = { round, arrows: createVolley(source, round) };
    const roundSeconds = sinceStart - round * source.roundSeconds;
    for (const arrow of current.arrows) {
      drawArrow(context, arrow, source.size * height, [width, height], roundSeconds);
    }
  };
}
