// The particle figure of the hero. HeroFigure.astro holds the markup and the styles.
// The script reads the picture of the figure and draws it as dots on a canvas. The pointer pushes the dots
// away, and a spring pulls each dot back to its place.
import { parseHexColor, type Rgb } from "./color.ts";
import { queryRequired } from "./dom.ts";

interface FigureElements {
  root: HTMLElement;
  picture: HTMLImageElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

/** The size of the canvas in CSS pixels, and the grid of the dots on it. */
interface Layout {
  width: number;
  height: number;
  /** The distance between two dots. */
  pitch: number;
  columns: number;
  rows: number;
}

/** The dots of one shade. The arrays of the dots hold the dots in the order of their shade. */
interface ShadeRun {
  color: string;
  start: number;
  end: number;
}

/** The dots. Each array holds one value for each dot. */
interface Dots {
  count: number;
  x: Float32Array;
  y: Float32Array;
  /** The place where the dot rests. */
  homeX: Float32Array;
  homeY: Float32Array;
  speedX: Float32Array;
  speedY: Float32Array;
  runs: ShadeRun[];
}

/** The shade of each cell of the grid, and the number of cells with each shade. */
interface ShadeMap {
  shadeOfCell: Int8Array;
  cellsPerShade: Uint32Array;
}

interface Pointer {
  x: number;
  y: number;
  isOnFigure: boolean;
}

interface Figure {
  elements: FigureElements;
  /** The colors of the shades, from the dark color to the light color. */
  colors: string[];
  layout: Layout;
  dots: Dots;
  pointer: Pointer;
  /** The id of the next frame, or 0 when the figure is at rest. */
  frame: number;
  /** The time of the last frame, in milliseconds. */
  lastTime: number;
  /** The time that the simulation still has to run, in milliseconds. */
  lag: number;
  isInView: boolean;
  /** A figure that stands still shows the dots at their places. The user asked for reduced motion. */
  standsStill: boolean;
}

const FIGURE = {
  /** The figure has this many dots from its left edge to its right edge, on every screen. */
  columns: 88,
  /** The radius of a dot, as a share of the distance between two dots. */
  radiusShare: 0.36,
  /** A cell of the picture becomes a dot when the picture covers at least this share of the cell. */
  minCover: 0.5,
  /** The dots take one of this many shades between the dark color and the light color. */
  shades: 16,
  /**
   * The lightest shade lies this share of the way from the dark color to the light color.
   * A dot in the full light color does not show on the light ground of the hero.
   */
  lightestShare: 0.82,
  /** The canvas has at most this many pixels for each CSS pixel. */
  maxPixelRatio: 2,
} as const;

/** The motion of the dots. A distance is a number of dot distances, so the motion looks the same at every size. */
const PHYSICS = {
  /** The simulation runs in steps of this length, in milliseconds, at every frame rate. */
  stepMs: 1000 / 60,
  /** After a pause, a frame runs at most this many steps. */
  maxStepsPerFrame: 4,
  /** The pointer pushes the dots within this distance. */
  reach: 17,
  /** The speed that the pointer adds to a dot at its position, in each step. */
  push: 0.7,
  /** The share of the way home that the spring adds to the speed of a dot, in each step. */
  spring: 0.08,
  /** The share of its speed that a dot keeps, in each step. */
  drag: 0.85,
  /** At the start, each dot lies away from its place by up to this distance. Then the dots come together. */
  scatter: 6,
  /** A dot is at rest when its speed and its distance from home are below this value, in pixels. */
  rest: 0.05,
} as const;

const SELECTORS = {
  root: "[data-figure]",
  picture: "[data-figure-picture]",
  canvas: "[data-figure-canvas]",
} as const;

// HeroFigure.astro reads this attribute in its styles.
const READY_ATTRIBUTE = "data-figure-ready";

const RGBA_CHANNELS = 4;
const CHANNEL_MAX = 255;
const FULL_TURN = Math.PI * 2;
const NO_DOT = -1;

function findElements(): FigureElements {
  const root = queryRequired<HTMLElement>(document, SELECTORS.root);
  const canvas = queryRequired<HTMLCanvasElement>(root, SELECTORS.canvas);
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("The browser gives no 2D context for the particle figure.");
  }
  return { root, canvas, context, picture: queryRequired<HTMLImageElement>(root, SELECTORS.picture) };
}

/** Gives the colors of the shades, in even steps from the dark color to the light color. */
function buildShadeColors(dark: Rgb, light: Rgb): string[] {
  return Array.from({ length: FIGURE.shades }, (_, shade) => {
    const share = (shade / (FIGURE.shades - 1)) * FIGURE.lightestShare;
    const channels = dark.map((value, channel) => Math.round(value + (light[channel] - value) * share));
    return `rgb(${channels.join(" ")})`;
  });
}

function measure(canvas: HTMLCanvasElement): Layout {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pitch = width / FIGURE.columns;
  return { width, height, pitch, columns: FIGURE.columns, rows: Math.round(height / pitch) };
}

/** Gives the canvas enough pixels for a sharp drawing. After this, the context draws in CSS pixels. */
function resizeCanvas(elements: FigureElements, layout: Layout): void {
  const ratio = Math.min(window.devicePixelRatio, FIGURE.maxPixelRatio);
  elements.canvas.width = Math.round(layout.width * ratio);
  elements.canvas.height = Math.round(layout.height * ratio);
  elements.context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

/** Reads the picture at the size of the grid: one pixel for each cell. The browser averages the pixels of a cell. */
function readCells(picture: HTMLImageElement, layout: Layout): ImageData {
  const sampler = document.createElement("canvas");
  sampler.width = layout.columns;
  sampler.height = layout.rows;
  const context = sampler.getContext("2d", { willReadFrequently: true });
  if (context === null) {
    throw new Error("The browser gives no 2D context to read the picture of the figure.");
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(picture, 0, 0, layout.columns, layout.rows);
  return context.getImageData(0, 0, layout.columns, layout.rows);
}

/** Finds the shade of each cell from its brightness. A cell that the picture does not cover gets no dot. */
function mapShades(cells: ImageData, shadeCount: number): ShadeMap {
  const cellCount = cells.width * cells.height;
  const shadeOfCell = new Int8Array(cellCount).fill(NO_DOT);
  const cellsPerShade = new Uint32Array(shadeCount);
  for (let cell = 0; cell < cellCount; cell++) {
    const cover = cells.data[cell * RGBA_CHANNELS + 3] / CHANNEL_MAX;
    if (cover < FIGURE.minCover) continue;
    // The picture is gray, so its red channel is its brightness.
    const brightness = cells.data[cell * RGBA_CHANNELS] / CHANNEL_MAX;
    const shade = Math.round(brightness * (shadeCount - 1));
    shadeOfCell[cell] = shade;
    cellsPerShade[shade]++;
  }
  return { shadeOfCell, cellsPerShade };
}

/** The parts of the dot arrays: one run for each shade that has dots. */
interface RunPlan {
  runs: ShadeRun[];
  /** The index of the first dot of each shade. */
  firstIndex: Uint32Array;
  /** The number of all dots. */
  count: number;
}

/** Gives each shade its part of the dot arrays. */
function planRuns(cellsPerShade: Uint32Array, colors: string[]): RunPlan {
  const runs: ShadeRun[] = [];
  const firstIndex = new Uint32Array(colors.length);
  let count = 0;
  colors.forEach((color, shade) => {
    firstIndex[shade] = count;
    if (cellsPerShade[shade] > 0) runs.push({ color, start: count, end: count + cellsPerShade[shade] });
    count += cellsPerShade[shade];
  });
  return { runs, firstIndex, count };
}

function createEmptyDots(count: number, runs: ShadeRun[]): Dots {
  const values = (): Float32Array => new Float32Array(count);
  return {
    count,
    runs,
    x: values(),
    y: values(),
    homeX: values(),
    homeY: values(),
    speedX: values(),
    speedY: values(),
  };
}

/** Builds the dots of the picture. With scatter, the dots start away from their places and then come together. */
function createDots(cells: ImageData, layout: Layout, colors: string[], scatter: boolean): Dots {
  const { shadeOfCell, cellsPerShade } = mapShades(cells, colors.length);
  const { runs, firstIndex: nextIndex, count } = planRuns(cellsPerShade, colors);
  const dots = createEmptyDots(count, runs);
  const scatterPx = scatter ? PHYSICS.scatter * layout.pitch : 0;
  const offset = (): number => (Math.random() * 2 - 1) * scatterPx;
  shadeOfCell.forEach((shade, cell) => {
    if (shade === NO_DOT) return;
    const dot = nextIndex[shade]++;
    const column = cell % layout.columns;
    const row = (cell - column) / layout.columns;
    dots.homeX[dot] = (column + 0.5) * layout.pitch;
    dots.homeY[dot] = (row + 0.5) * layout.pitch;
    dots.x[dot] = dots.homeX[dot] + offset();
    dots.y[dot] = dots.homeY[dot] + offset();
  });
  return dots;
}

/** Draws the dots. All dots of one shade go into one path, so the canvas fills each shade one time. */
function drawDots(context: CanvasRenderingContext2D, dots: Dots, layout: Layout): void {
  const radius = layout.pitch * FIGURE.radiusShare;
  context.clearRect(0, 0, layout.width, layout.height);
  for (const run of dots.runs) {
    context.fillStyle = run.color;
    context.beginPath();
    for (let dot = run.start; dot < run.end; dot++) {
      context.moveTo(dots.x[dot] + radius, dots.y[dot]);
      context.arc(dots.x[dot], dots.y[dot], radius, 0, FULL_TURN);
    }
    context.fill();
  }
}

/** Moves every dot by one step. Returns true while at least one dot is not at rest. */
function stepDots(dots: Dots, pointer: Pointer, pitch: number): boolean {
  const reach = PHYSICS.reach * pitch;
  const push = PHYSICS.push * pitch;
  let isMoving = false;
  for (let dot = 0; dot < dots.count; dot++) {
    let speedX = dots.speedX[dot];
    let speedY = dots.speedY[dot];
    if (pointer.isOnFigure) {
      const awayX = dots.x[dot] - pointer.x;
      const awayY = dots.y[dot] - pointer.y;
      const distance = Math.hypot(awayX, awayY);
      if (distance < reach && distance > 0) {
        // The push is strongest at the pointer and ends at the reach.
        const force = ((reach - distance) / reach) * push;
        speedX += (awayX / distance) * force;
        speedY += (awayY / distance) * force;
      }
    }
    speedX = (speedX + (dots.homeX[dot] - dots.x[dot]) * PHYSICS.spring) * PHYSICS.drag;
    speedY = (speedY + (dots.homeY[dot] - dots.y[dot]) * PHYSICS.spring) * PHYSICS.drag;
    dots.x[dot] += speedX;
    dots.y[dot] += speedY;
    dots.speedX[dot] = speedX;
    dots.speedY[dot] = speedY;
    isMoving ||=
      Math.abs(speedX) > PHYSICS.rest ||
      Math.abs(speedY) > PHYSICS.rest ||
      Math.abs(dots.homeX[dot] - dots.x[dot]) > PHYSICS.rest ||
      Math.abs(dots.homeY[dot] - dots.y[dot]) > PHYSICS.rest;
  }
  return isMoving;
}

/** Puts every dot at its place. The dots are then at rest, and the figure looks the same after each motion. */
function settleDots(dots: Dots): void {
  dots.x.set(dots.homeX);
  dots.y.set(dots.homeY);
  dots.speedX.fill(0);
  dots.speedY.fill(0);
}

/** Measures the canvas, builds the dots for its size, and draws them. */
function rebuild(figure: Figure, scatter: boolean): void {
  const { elements } = figure;
  figure.layout = measure(elements.canvas);
  resizeCanvas(elements, figure.layout);
  const cells = readCells(elements.picture, figure.layout);
  figure.dots = createDots(cells, figure.layout, figure.colors, scatter);
  drawDots(elements.context, figure.dots, figure.layout);
}

/** Runs the steps that are due, draws the dots, and asks for the next frame while the dots move. */
function runFrame(figure: Figure, time: number): void {
  figure.frame = 0;
  figure.lag += Math.min(time - figure.lastTime, PHYSICS.stepMs * PHYSICS.maxStepsPerFrame);
  figure.lastTime = time;
  let isMoving = true;
  while (figure.lag >= PHYSICS.stepMs) {
    isMoving = stepDots(figure.dots, figure.pointer, figure.layout.pitch);
    figure.lag -= PHYSICS.stepMs;
  }
  const isAtRest = !isMoving && !figure.pointer.isOnFigure;
  if (isAtRest) settleDots(figure.dots);
  drawDots(figure.elements.context, figure.dots, figure.layout);
  if (!isAtRest) wake(figure);
}

/** Starts the frames, unless they run already. A figure out of view, or a figure that stands still, has no frames. */
function wake(figure: Figure): void {
  if (figure.frame !== 0 || !figure.isInView || figure.standsStill) return;
  figure.frame = requestAnimationFrame((time) => runFrame(figure, time));
}

function watchPointer(figure: Figure): void {
  const { canvas } = figure.elements;
  const follow = (event: PointerEvent): void => {
    const box = canvas.getBoundingClientRect();
    figure.pointer = { x: event.clientX - box.left, y: event.clientY - box.top, isOnFigure: true };
    wake(figure);
  };
  const release = (): void => {
    if (!figure.pointer.isOnFigure) return;
    figure.pointer.isOnFigure = false;
    wake(figure);
  };
  const options = { passive: true } as const;
  canvas.addEventListener("pointermove", follow, options);
  canvas.addEventListener("pointerdown", follow, options);
  canvas.addEventListener("pointerleave", release, options);
  canvas.addEventListener("pointercancel", release, options);
  // A finger that lifts from the screen leaves the figure. A mouse stays on it.
  const lift = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse") release();
  };
  canvas.addEventListener("pointerup", lift, options);
  // The page moves under a pointer that stands still, so its last position is no longer true.
  window.addEventListener("scroll", release, options);
}

/** Stops the frames while the figure is out of view. */
function watchView(figure: Figure): void {
  const observer = new IntersectionObserver(([entry]) => {
    figure.isInView = entry.isIntersecting;
    wake(figure);
  });
  observer.observe(figure.elements.canvas);
}

/** Builds the dots again when the size of the canvas changes. */
function watchSize(figure: Figure): void {
  const { canvas } = figure.elements;
  const observer = new ResizeObserver(() => {
    if (canvas.clientWidth === figure.layout.width && canvas.clientHeight === figure.layout.height) return;
    rebuild(figure, false);
    wake(figure);
  });
  observer.observe(canvas);
}

export async function initParticleFigure(): Promise<void> {
  const elements = findElements();
  const { dataset } = elements.root;
  // The canvas needs the pixels of the picture, so the picture must be ready first.
  await elements.picture.decode();
  const figure: Figure = {
    elements,
    colors: buildShadeColors(parseHexColor(dataset.figureDark, "dark"), parseHexColor(dataset.figureLight, "light")),
    layout: measure(elements.canvas),
    dots: createEmptyDots(0, []),
    pointer: { x: 0, y: 0, isOnFigure: false },
    frame: 0,
    lastTime: 0,
    lag: 0,
    isInView: true,
    standsStill: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
  rebuild(figure, !figure.standsStill);
  elements.root.setAttribute(READY_ATTRIBUTE, "");
  watchSize(figure);
  if (figure.standsStill) return;
  watchPointer(figure);
  watchView(figure);
  wake(figure);
}
