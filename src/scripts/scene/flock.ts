// A flock of birds, drawn again in each frame. The flock crosses its layer in rounds, and in each round the
// birds take new places, so that no two crossings look the same. Each bird keeps its own place in the
// flock, drifts around that place, climbs or sinks, beats its wings at its own pace, and glides now and then.
// The drawing uses one unit: the length of the body of a bird. A bird faces to the right in its own space.
import { between, createRandom, type Random } from "./random.ts";
import type { FlockSource } from "./types.ts";
import { type Painter, type Point, fract, mix, smoothstep, softClamp, traceShape } from "./sketch.ts";

/** A slow wave: how far it reaches, how many seconds one period takes, and where it starts, in radians. */
interface Wave {
  reach: number;
  period: number;
  phase: number;
}

interface Bird {
  /** The place of the bird in the flock, in lengths of a bird: ahead of the middle, and below it. */
  ahead: number;
  below: number;
  /** The size of the bird, as a share of the full size. A smaller bird seems farther away. */
  scale: number;
  /** The bird flies at this share of the speed of the flock. */
  pace: number;
  driftAhead: Wave;
  driftBelow: Wave;
  /** The bird climbs by this many lengths of a bird in each second. A negative value sinks. */
  climb: number;
  beatsPerSecond: number;
  /** The share of a beat at which the bird starts. */
  beatOffset: number;
  /** The bird glides while this wave is near its top. */
  glide: Wave;
}

interface Flock {
  birds: Bird[];
  /** The whole flock rises and sinks on this wave. Its reach is a share of the height of the layer. */
  sway: Wave;
  /** The flock spreads over this many lengths of a bird, along its line. */
  length: number;
}

/** The shape of the wings at one moment. */
interface Pose {
  /** The lift of the wing: 1 points it straight up, 0 holds it level, and a negative value points it down. */
  lift: number;
  /** 0: a spread wing. 1: a wing that folds in the upstroke. */
  fold: number;
  /** How far the body lies below its path, in lengths of a bird. The body rises in each downstroke. */
  bob: number;
}

const FLOCK = {
  /** The flock spreads over this many lengths of a bird for each bird. */
  spreadPerBird: 1.6,
  /** The line of the flock rises by this share of its length from its last bird to its first. */
  slope: 0.4,
  /** A bird sits up to this many lengths of a bird away from its place on the line. */
  jitter: 0.7,
  scale: [0.6, 1],
  pace: [0.93, 1.07],
  /** A bird drifts around its place by up to this many lengths of a bird. A period lies between the two values, in seconds. */
  driftAhead: { reach: 0.9, period: [3, 6] },
  driftBelow: { reach: 1.1, period: [2.4, 5] },
  climb: [-0.35, 0.35],
  beatsPerSecond: [2.3, 3.3],
  glidePeriod: [3.5, 6.5],
  sway: { reach: 0.1, period: [5, 8] },
  /** The middle of a bird stays this many lengths of a bird away from the upper and the lower edge of the layer. */
  edge: 0.9,
  /** A bird leaves the canvas this many lengths of a bird beyond its edge before it stops to draw. */
  beyond: 2,
  /** The seed of a round lies this far from the seed of the round before it. */
  roundStep: 7919,
  /** The direction of a bird comes from its place now and its place this many seconds later. */
  lookAheadSeconds: 1 / 30,
} as const;

const BEAT = {
  /** The downstroke takes this share of a beat. */
  down: 0.55,
  /** The lift swings around its middle by its reach. */
  middle: 0.2,
  reach: 0.8,
  /** In the middle of the upstroke the wing folds by this share. */
  fold: 0.85,
  /** The body rises in the downstroke and sinks in the upstroke, by these lengths of a bird. */
  rise: 0.06,
  sink: 0.035,
  /** A gliding bird holds its wings at this lift. */
  glideLift: 0.3,
  /** A bird starts to glide when its glide wave passes the first value, and glides fully above the second. */
  glideFrom: 0.62,
  glideTo: 0.88,
  /** The body turns with its path by this share of the angle of the path, up to the limit, in radians. */
  pitchShare: 0.8,
  pitchLimit: 0.45,
} as const;

/** The body, from the side: the beak, a round head, the back, a thin tail, and a deep chest. A fanned tail is thin when seen from the side. */
const BODY: readonly Point[] = [
  [0.6, 0.015],
  [0.47, -0.035],
  [0.42, -0.08],
  [0.35, -0.1],
  [0.27, -0.085],
  [0.1, -0.09],
  [-0.1, -0.075],
  [-0.25, -0.045],
  [-0.55, -0.03],
  [-0.55, 0.015],
  [-0.25, 0.04],
  [-0.08, 0.1],
  [0.1, 0.115],
  [0.25, 0.085],
  [0.36, 0.045],
  [0.47, 0.025],
];

const WING = {
  /** The front and the back of the root of the wing, on the back of the bird. A crow has broad wings. */
  front: [0.14, -0.07],
  back: [-0.2, -0.06],
  /** A spread wing is this many lengths of a bird long. A folded wing loses this share of its length. */
  length: 1.05,
  foldLoss: 0.35,
  /** The tip lies behind the front of the root by the first value, more for a folded wing and for a level wing. */
  sweep: 0.08,
  foldSweep: 0.24,
  levelSweep: 0.06,
  /** The back of the tip lies this far behind the tip. The fingers of a crow split the tip in three. */
  tipWidth: 0.16,
  /** The far wing lies this far ahead of the near wing, a little shorter, and lighter. */
  farShift: 0.05,
  farLength: 0.92,
  farOpacity: 0.55,
} as const;

const FULL_TURN = Math.PI * 2;

function createWave(random: Random, reach: number, period: readonly [number, number]): Wave {
  return { reach, period: between(random, ...period), phase: random() * FULL_TURN };
}

/** Gives the value of a wave, from minus its reach to its reach. */
function waveAt(wave: Wave, seconds: number): number {
  return wave.reach * Math.sin((FULL_TURN * seconds) / wave.period + wave.phase);
}

function createBird(random: Random, ahead: number, below: number): Bird {
  return {
    ahead: ahead + between(random, -FLOCK.jitter, FLOCK.jitter),
    below: below + between(random, -FLOCK.jitter, FLOCK.jitter),
    scale: between(random, ...FLOCK.scale),
    pace: between(random, ...FLOCK.pace),
    driftAhead: createWave(random, FLOCK.driftAhead.reach, FLOCK.driftAhead.period),
    driftBelow: createWave(random, FLOCK.driftBelow.reach, FLOCK.driftBelow.period),
    climb: between(random, ...FLOCK.climb),
    beatsPerSecond: between(random, ...FLOCK.beatsPerSecond),
    beatOffset: random(),
    glide: createWave(random, 1, FLOCK.glidePeriod),
  };
}

/** Places the birds of one round along a loose line that rises toward its front or toward its back. */
function createFlock(source: FlockSource, round: number): Flock {
  const random = createRandom(source.seed + round * FLOCK.roundStep);
  const length = source.birds * FLOCK.spreadPerBird;
  const rise = random() < 0.5 ? 1 : -1;
  const birds = Array.from({ length: source.birds }, (_, index) => {
    const along = source.birds === 1 ? 0 : index / (source.birds - 1) - 0.5;
    return createBird(random, along * length, -along * length * FLOCK.slope * rise);
  });
  return { birds, sway: createWave(random, FLOCK.sway.reach, FLOCK.sway.period), length };
}

/** Gives the shape of the wings of a bird at a moment: a beat with a fast downstroke, or a glide. */
function poseAt(bird: Bird, seconds: number): Pose {
  const share = fract(seconds * bird.beatsPerSecond + bird.beatOffset);
  const isDown = share < BEAT.down;
  const progress = isDown ? share / BEAT.down : (share - BEAT.down) / (1 - BEAT.down);
  const arc = Math.sin(Math.PI * progress);
  const flap: Pose = isDown
    ? { lift: BEAT.middle + BEAT.reach * Math.cos(Math.PI * progress), fold: 0, bob: -BEAT.rise * arc }
    : { lift: BEAT.middle - BEAT.reach * Math.cos(Math.PI * progress), fold: BEAT.fold * arc, bob: BEAT.sink * arc };
  const glide = smoothstep(BEAT.glideFrom, BEAT.glideTo, 0.5 + 0.5 * waveAt(bird.glide, seconds));
  return { lift: mix(flap.lift, BEAT.glideLift, glide), fold: flap.fold * (1 - glide), bob: flap.bob * (1 - glide) };
}

/** Gives the outline of a wing, as seen from the side. A wing that points at the viewer shows almost nothing. */
function wingOutline(pose: Pose, shift: number, length: number): Point[] {
  const span = WING.length * length * (1 - WING.foldLoss * pose.fold);
  const height = span * pose.lift;
  const sweep = WING.sweep + WING.foldSweep * pose.fold + WING.levelSweep * (1 - Math.abs(pose.lift));
  const [frontX, frontY] = [WING.front[0] + shift, WING.front[1]];
  const [backX, backY] = [WING.back[0] + shift, WING.back[1]];
  const tipX = frontX - sweep;
  return [
    [frontX, frontY],
    [frontX + 0.01 - 0.08 * pose.fold, frontY - 0.5 * height],
    [tipX, frontY - height],
    [tipX - 0.3 * WING.tipWidth, frontY - 0.9 * height],
    [tipX - 0.5 * WING.tipWidth, frontY - 0.97 * height],
    [tipX - 0.7 * WING.tipWidth, frontY - 0.86 * height],
    [tipX - WING.tipWidth, frontY - 0.9 * height],
    [backX - 0.06, backY - 0.45 * height],
    [backX, backY],
  ];
}

/** Draws one bird in its own space: the far wing behind the body, then the body, then the near wing. */
function drawBird(context: CanvasRenderingContext2D, pose: Pose): void {
  const opacity = context.globalAlpha;
  context.globalAlpha = opacity * WING.farOpacity;
  traceShape(context, wingOutline(pose, WING.farShift, WING.farLength));
  context.globalAlpha = opacity;
  traceShape(context, BODY);
  traceShape(context, wingOutline(pose, 0, 1));
}

/** The frame of one drawing: the size of the layer and of a bird, in pixels, and the way across. */
interface FlockFrame {
  width: number;
  height: number;
  birdSize: number;
  /** The middle of the flock starts this far beyond the first edge, and ends as far beyond the other edge. */
  margin: number;
}

/** Gives the place of a bird at a moment of the round, in pixels of the layer, before it faces its direction. */
function placeOf(source: FlockSource, flock: Flock, bird: Bird, frame: FlockFrame, seconds: number): Point {
  const progress = (seconds / source.crossSeconds) * bird.pace;
  const travel = frame.width + 2 * frame.margin;
  const x = -frame.margin + travel * progress + frame.birdSize * (bird.ahead + waveAt(bird.driftAhead, seconds));
  const middle = frame.height * (0.5 + waveAt(flock.sway, seconds));
  const offset = bird.below + waveAt(bird.driftBelow, seconds) + bird.climb * (seconds - source.crossSeconds / 2);
  const edge = FLOCK.edge * frame.birdSize;
  const y = softClamp(middle + frame.birdSize * offset, edge, frame.height - edge);
  return [source.direction === 1 ? x : frame.width - x, y];
}

function drawFlock(
  context: CanvasRenderingContext2D,
  source: FlockSource,
  flock: Flock,
  frame: FlockFrame,
  seconds: number,
): void {
  for (const bird of flock.birds) {
    const [x, y] = placeOf(source, flock, bird, frame, seconds);
    const reach = FLOCK.beyond * frame.birdSize;
    if (x < -reach || x > frame.width + reach) continue;
    const [nextX, nextY] = placeOf(source, flock, bird, frame, seconds + FLOCK.lookAheadSeconds);
    const angle = Math.atan2(nextY - y, Math.abs(nextX - x)) * BEAT.pitchShare;
    const pitch = Math.max(-BEAT.pitchLimit, Math.min(BEAT.pitchLimit, angle));
    const pose = poseAt(bird, seconds);
    const size = frame.birdSize * bird.scale;
    context.save();
    context.translate(x, y + pose.bob * size);
    context.scale(source.direction, 1);
    context.rotate(pitch);
    context.scale(size, size);
    drawBird(context, pose);
    context.restore();
  }
}

/** Gives the painter of a flock. It keeps the birds of the current round, and makes new ones for the next round. */
export function createFlockPainter(source: FlockSource): Painter {
  let current: { round: number; flock: Flock } | undefined;
  return (context, seconds, width, height) => {
    const sinceStart = (seconds ?? source.startSeconds + source.stillSeconds) - source.startSeconds;
    if (sinceStart < 0) return;
    const round = Math.floor(sinceStart / source.roundSeconds);
    if (current?.round !== round) current = { round, flock: createFlock(source, round) };
    const birdSize = source.size * height;
    const margin = (current.flock.length / 2 + FLOCK.jitter + FLOCK.driftAhead.reach + FLOCK.beyond) * birdSize;
    drawFlock(
      context,
      source,
      current.flock,
      { width, height, birdSize, margin },
      sinceStart - round * source.roundSeconds,
    );
  };
}
