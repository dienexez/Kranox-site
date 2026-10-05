// Turns the source of a layer into cells: one value of light for each cell of the grid of the layer.
// A picture comes from a file. A ridge and a sun are drawings that the script makes itself.
import { createRandom, type Random } from "./random.ts";
import type { EmptyTone, StaticSource } from "./types.ts";

/** The cells of a layer. Each cell has four bytes: its light three times, then 255 when the cell holds a part of the picture. */
export interface Cells {
  columns: number;
  rows: number;
  data: Uint8Array;
}

/** One cell: its light from 0, dark, to 1, bright, and whether it holds a part of the picture. */
interface Sample {
  light: number;
  present: boolean;
}

const BYTES_PER_CELL = 4;
const CHANNEL_MAX = 255;
/** The weights of red, green, and blue in the brightness of a pixel, after the standard Rec. 709. */
const LUMA = { red: 0.2126, green: 0.7152, blue: 0.0722 } as const;

/** A place of a picture counts as empty beyond these values of its channels, from 0 to 255. */
const EMPTY = { blackBelow: 10, whiteAbove: 245, alphaBelow: 128 } as const;

const NO_SAMPLE: Sample = { light: 0, present: false };

/** The hills of a ridge: the number of layers of detail, and the number of random heights that repeat. */
const HILLS = { octaves: 4, heights: 256 } as const;

const RIDGE = {
  /** The light at the ridge line. Below the line, the light falls with this power of the depth, down to the floor. */
  top: 0.72,
  falloff: 2.2,
  floor: 0.035,
  /** The light of a cell differs by up to this share from its neighbor, like the grain of a print. */
  grain: 0.12,
  /** This share of the columns carries a dark cap at the ridge line, with this light. */
  capShare: 0.18,
  capLight: 0.2,
} as const;

const SUN = {
  /** The light falls with this power of the distance from the core, down to the floor. */
  falloff: 1.25,
  floor: 0.04,
  grain: 0.3,
} as const;

function clampShare(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Builds the cells of a grid from a function that gives the sample at a place. The place runs from 0 to 1. */
function fillCells(columns: number, rows: number, sample: (u: number, v: number) => Sample): Cells {
  const data = new Uint8Array(columns * rows * BYTES_PER_CELL);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const { light, present } = sample((column + 0.5) / columns, (row + 0.5) / rows);
      const offset = (row * columns + column) * BYTES_PER_CELL;
      data.fill(Math.round(clampShare(light) * CHANNEL_MAX), offset, offset + BYTES_PER_CELL - 1);
      data[offset + BYTES_PER_CELL - 1] = present ? CHANNEL_MAX : 0;
    }
  }
  return { columns, rows, data };
}

function createContext(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) {
    throw new Error("The browser gives no 2D context to read the pictures of the scenes.");
  }
  return context;
}

function isEmpty(pixel: Uint8ClampedArray, empty: EmptyTone): boolean {
  const [red, green, blue, alpha] = pixel;
  if (alpha < EMPTY.alphaBelow) return true;
  if (empty === "black") return Math.max(red, green, blue) < EMPTY.blackBelow;
  if (empty === "white") return Math.min(red, green, blue) > EMPTY.whiteAbove;
  return false;
}

/** Reads a picture at the size of the grid. The browser takes the mean of the pixels of each cell. */
async function readPicture(
  source: Extract<StaticSource<string>, { kind: "picture" }>,
  columns: number,
  rows: number,
): Promise<Cells> {
  const picture = new Image();
  picture.src = source.picture;
  await picture.decode();
  const context = createContext(columns, rows);
  context.imageSmoothingQuality = "high";
  context.drawImage(picture, 0, 0, columns, rows);
  const pixels = context.getImageData(0, 0, columns, rows).data;
  return fillCells(columns, rows, (u, v) => {
    const offset = (Math.floor(v * rows) * columns + Math.floor(u * columns)) * BYTES_PER_CELL;
    const pixel = pixels.subarray(offset, offset + BYTES_PER_CELL);
    return {
      light: (LUMA.red * pixel[0] + LUMA.green * pixel[1] + LUMA.blue * pixel[2]) / CHANNEL_MAX,
      present: !isEmpty(pixel, source.empty),
    };
  });
}

/** Gives a line of smooth hills: a height from 0 to 1 for each position. Large hills carry smaller ones. */
function createHills(random: Random): (position: number) => number {
  const heights = Array.from({ length: HILLS.heights }, random);
  const wave = (position: number): number => {
    const index = Math.floor(position);
    const share = position - index;
    const eased = share * share * (3 - 2 * share);
    const from = heights[index % HILLS.heights];
    const to = heights[(index + 1) % HILLS.heights];
    return from + (to - from) * eased;
  };
  return (position) => {
    let height = 0;
    let weight = 0;
    for (let octave = 0; octave < HILLS.octaves; octave++) {
      const share = 0.5 ** octave;
      height += wave(position * 2 ** octave + octave * HILLS.octaves) * share;
      weight += share;
    }
    return height / weight;
  };
}

/** Draws a mountain range: empty above its ridge line, bright at the line, and dark toward its foot. */
function drawRidge(source: Extract<StaticSource<string>, { kind: "ridge" }>, columns: number, rows: number): Cells {
  const random = createRandom(source.seed);
  const hills = createHills(random);
  // Each column decides once whether it carries a cap.
  const caps = Array.from({ length: columns }, () => random() < RIDGE.capShare);
  return fillCells(columns, rows, (u, v) => {
    const line = source.relief * (1 - hills(u * source.peaks));
    if (v < line) return NO_SAMPLE;
    const isCap = v - line < 1 / rows && caps[Math.floor(u * columns)];
    const depth = (v - line) / (1 - line);
    const light = Math.max(RIDGE.floor, RIDGE.top * (1 - depth) ** RIDGE.falloff);
    const grain = 1 + (random() - 0.5) * RIDGE.grain;
    return { light: isCap ? RIDGE.capLight : light * grain, present: true };
  });
}

/** Draws a sun in the middle of the layer: a bright core, and a glow that fades into the dark. */
function drawSun(source: Extract<StaticSource<string>, { kind: "sun" }>, columns: number, rows: number): Cells {
  // The same seed for every sun: the grain is a texture, not a shape.
  const random = createRandom(columns * rows);
  return fillCells(columns, rows, (u, v) => {
    const distance = Math.hypot(u - 0.5, v - 0.5);
    const glow = clampShare((source.reach - distance) / (source.reach - source.core));
    const grain = 1 + (random() - 0.5) * SUN.grain;
    return { light: Math.max(SUN.floor, glow ** SUN.falloff * grain), present: true };
  });
}

/** Builds the cells of a layer from its source. */
export async function createCells(source: StaticSource<string>, columns: number, rows: number): Promise<Cells> {
  switch (source.kind) {
    case "picture":
      return readPicture(source, columns, rows);
    case "ridge":
      return drawRidge(source, columns, rows);
    case "sun":
      return drawSun(source, columns, rows);
  }
}
