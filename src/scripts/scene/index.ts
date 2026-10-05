// The scenes of the page. Scene.astro holds the canvas of each scene and sends its description.
// A scene draws its pictures as vertical bars, like a line halftone in print. Its tracks move the layers and
// change their levels while the user scrolls, so that a picture develops out of the bars or sinks into them.
// A flock or a volley moves by itself, on the own time of its scene, which runs only while the scene is in view.
import { gsap } from "gsap";
import { parseHexColor } from "../color.ts";
import { reducedMotion, wideScreenQuery } from "../motion/settings.ts";
import { isAnimated } from "./animated.ts";
import { createCells } from "./cells.ts";
import { LAYER_DEFAULTS } from "./defaults.ts";
import { createRenderer, drawScene, fitCanvas, setCells, type Renderer, type SceneColors } from "./renderer.ts";
import { supportsScenes } from "./support.ts";
import { addTrack, applyTrackEnd } from "./tracks.ts";
import type { Layer, LayerState, Scene } from "./types.ts";

interface SceneRuntime {
  renderer: Renderer;
  isInView: boolean;
  /** The own time of the scene, in seconds. It runs only while the scene is in view. */
  sceneSeconds: number;
}

const SELECTOR = "[data-scene]";
/** A scene moves and draws while it is within this distance of the viewport. */
const VIEW_MARGIN = "20% 0px";
const MS_PER_SECOND = 1000;
/** After a pause of the page, such as a hidden tab, the own time of a scene goes on by at most this many seconds. */
const MAX_STEP_SECONDS = 0.1;

function readScene(canvas: HTMLCanvasElement): Scene<string> {
  const { scene } = canvas.dataset;
  if (scene === undefined) {
    throw new Error("A scene canvas needs its description in the attribute data-scene.");
  }
  return JSON.parse(scene) as Scene<string>;
}

/** Scene.astro writes the two colors of the page onto the canvas. A scene with light bars swaps them. */
function readColors(canvas: HTMLCanvasElement, scene: Scene<string>): SceneColors {
  const dark = parseHexColor(canvas.dataset.sceneDark, "dark");
  const light = parseHexColor(canvas.dataset.sceneLight, "light");
  return scene.lightBars === true ? { bar: light, ground: dark } : { bar: dark, ground: light };
}

function startState(layer: Layer<string>, isWide: boolean): LayerState {
  const { x, y, width, height, blackPoint, whitePoint } = layer;
  return { x, y, width, height, blackPoint, whitePoint, ...(isWide ? {} : layer.narrow) };
}

/** Loads the cells of each layer. A layer shows as soon as its cells are there. A moving layer shows at once. */
function loadLayers(renderer: Renderer, onReady: () => void): void {
  for (const runtime of renderer.layers) {
    const { layer } = runtime;
    const { source } = layer;
    if (isAnimated(source)) {
      runtime.isReady = true;
      continue;
    }
    const columns = layer.columns ?? LAYER_DEFAULTS.columns;
    const rows = layer.rows ?? LAYER_DEFAULTS.rows;
    void createCells(source, columns, rows).then((cells) => {
      setCells(renderer, runtime, cells);
      onReady();
    });
  }
}

/** Starts the tracks of a scene. In a scene that does not move, each layer takes the end of its tracks. */
function addTracks(renderer: Renderer, scene: Scene<string>, isWide: boolean, moves: boolean): void {
  for (const track of scene.tracks ?? []) {
    const { state } = renderer.layers[track.layer];
    if (moves) addTrack(renderer.canvas, state, track, isWide);
    else applyTrackEnd(state, track, isWide);
  }
}

/** Tells the scene whether it is near the viewport. It moves and draws only then. */
function watchView(runtime: SceneRuntime): void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      runtime.isInView = entry.isIntersecting;
    },
    { rootMargin: VIEW_MARGIN },
  );
  observer.observe(runtime.renderer.canvas);
}

/**
 * Starts the scene of one canvas. A scene that does not move draws itself once, and again when its size
 * changes. When the browser gives no more WebGL contexts, the canvas stays empty, and this returns nothing.
 */
function startScene(
  canvas: HTMLCanvasElement,
  scene: Scene<string>,
  isWide: boolean,
  moves: boolean,
): SceneRuntime | undefined {
  const layers = scene.layers.map((layer) => ({ layer, state: startState(layer, isWide) }));
  const renderer = createRenderer(canvas, layers, readColors(canvas, scene));
  if (renderer === undefined) return undefined;
  const runtime: SceneRuntime = { renderer, isInView: false, sceneSeconds: 0 };
  const drawStill = (): void => {
    if (!moves) drawScene(renderer, "still");
  };
  fitCanvas(renderer);
  addTracks(renderer, scene, isWide, moves);
  loadLayers(renderer, drawStill);
  new ResizeObserver(() => {
    fitCanvas(renderer);
    drawStill();
  }).observe(canvas);
  // A title in bars waits for its font. A still scene draws again when the fonts of the page are there.
  if (!moves) void document.fonts.ready.then(drawStill);
  if (moves) watchView(runtime);
  return runtime;
}

export function initScenes(): void {
  // Without WebGL no canvas can draw. The page keeps its grounds.
  if (!supportsScenes()) return;
  const isWide = window.matchMedia(wideScreenQuery()).matches;
  // A user who asks for reduced motion gets each scene as a still picture.
  const moves = !reducedMotion.matches;
  const scenes: SceneRuntime[] = [];
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>(SELECTOR)) {
    const scene = readScene(canvas);
    if (scene.wideOnly === true && !isWide) continue;
    const runtime = startScene(canvas, scene, isWide, moves);
    if (runtime !== undefined) scenes.push(runtime);
  }
  if (!moves || scenes.length === 0) return;
  gsap.ticker.add((seconds, deltaMs) => {
    const step = Math.min(deltaMs / MS_PER_SECOND, MAX_STEP_SECONDS);
    for (const runtime of scenes) {
      if (!runtime.isInView) continue;
      runtime.sceneSeconds += step;
      drawScene(runtime.renderer, { seconds, sceneSeconds: runtime.sceneSeconds });
    }
  });
}
