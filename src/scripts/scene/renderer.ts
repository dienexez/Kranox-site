// Draws the layers of one scene on its canvas. index.ts starts a renderer for each scene of the page.
import type { Rgb } from "../color.ts";
import { type AnimatedLayer, createAnimatedLayer, isAnimated, paintAnimatedLayer } from "./animated.ts";
import type { Cells } from "./cells.ts";
import { LAYER_DEFAULTS } from "./defaults.ts";
import { createProgram, findUniforms, type Uniforms } from "./shader.ts";
import type { EdgeBands, Layer, LayerState } from "./types.ts";

export interface LayerRuntime {
  layer: Layer<string>;
  /** The values that the tracks change. The renderer reads them in each frame. */
  state: LayerState;
  texture: WebGLTexture;
  /** A layer that moves by itself draws its texture again in each frame. */
  animated: AnimatedLayer | undefined;
  /** The layer shows: its cells are in its texture, or it moves by itself. */
  isReady: boolean;
}

/** The two colors of a scene. */
export interface SceneColors {
  bar: Rgb;
  ground: Rgb;
}

export interface Renderer {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  uniforms: Uniforms;
  colors: SceneColors;
  layers: LayerRuntime[];
  /** The canvas has this many pixels for each CSS pixel. */
  pixelRatio: number;
}

/**
 * One frame of a scene. A scene in motion has the time of the page, for the wave and the flicker, and its
 * own time, which runs only while the scene is in view, for the layers that move by themselves.
 * A still scene has neither.
 */
export type Frame = { seconds: number; sceneSeconds: number } | "still";

/** The place of a layer on the canvas, in pixels of the canvas. The top counts from the upper edge. */
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const RENDER = {
  /** The canvas has at most this many pixels for each CSS pixel. */
  maxPixelRatio: 1.5,
  /** The flicker of a layer changes this many times in each second. */
  shimmerStepsPerSecond: 12,
  /** The step number of the flicker starts again after this many steps, so that it stays a small number. */
  shimmerSteps: 1024,
  /** The phase of the sway starts again after this many full turns, so that it stays a small number. */
  swayTurns: 10,
} as const;

const PERCENT = 100;
const CHANNEL_MAX = 255;
const FULL_TURN = Math.PI * 2;
/** The four corners of the canvas, as a triangle strip. */
const CORNERS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

/** Makes the texture of one layer. The texture blends its cells, so that a picture can sway between two cells. */
function createTexture(gl: WebGLRenderingContext): WebGLTexture {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/** Gives the program the four corners of the canvas. Each layer then covers the part that its box leaves. */
function prepareSurface(gl: WebGLRenderingContext, program: WebGLProgram): void {
  const corner = gl.getAttribLocation(program, "a_corner");
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, CORNERS, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  // The shader gives each color times its opacity, so a layer lies over the layers below it.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
}

/** Builds the renderer of a canvas. A browser without WebGL gets no scene, and this returns nothing. */
export function createRenderer(
  canvas: HTMLCanvasElement,
  layers: readonly { layer: Layer<string>; state: LayerState }[],
  colors: SceneColors,
): Renderer | undefined {
  const gl = canvas.getContext("webgl", { antialias: false });
  if (gl === null) return undefined;
  const program = createProgram(gl);
  const uniforms = findUniforms(gl, program);
  prepareSurface(gl, program);
  gl.uniform1i(uniforms.u_cells, 0);
  return {
    canvas,
    gl,
    uniforms,
    colors,
    layers: layers.map(({ layer, state }) => ({
      layer,
      state,
      texture: createTexture(gl),
      animated: isAnimated(layer.source) ? createAnimatedLayer(layer.source) : undefined,
      isReady: false,
    })),
    pixelRatio: 1,
  };
}

/** Puts the cells of a layer into its texture. From then on the layer shows. */
export function setCells(renderer: Renderer, layer: LayerRuntime, cells: Cells): void {
  const { gl } = renderer;
  gl.bindTexture(gl.TEXTURE_2D, layer.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cells.columns, cells.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, cells.data);
  layer.isReady = true;
}

/** Gives the canvas the pixels for its size on the page. */
export function fitCanvas(renderer: Renderer): void {
  const { canvas, gl } = renderer;
  const ratio = Math.min(window.devicePixelRatio, RENDER.maxPixelRatio);
  renderer.pixelRatio = ratio;
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  // A canvas without a size is not in the layout. It gets its size when it comes back.
  if (width === 0 || height === 0 || (canvas.width === width && canvas.height === height)) return;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
}

function measureBox(canvas: HTMLCanvasElement, { layer, state }: LayerRuntime): Box {
  const heightBase = layer.heightOf === "width" ? canvas.width : canvas.height;
  return {
    left: (state.x / PERCENT) * canvas.width,
    top: (state.y / PERCENT) * canvas.height,
    width: (state.width / PERCENT) * canvas.width,
    height: (state.height / PERCENT) * heightBase,
  };
}

/** Limits the drawing to the part of the canvas that a box covers. Returns false when the box is out of the canvas. */
function setScissor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, box: Box): boolean {
  const left = Math.max(0, Math.floor(box.left));
  const right = Math.min(canvas.width, Math.ceil(box.left + box.width));
  const top = Math.max(0, Math.floor(box.top));
  const bottom = Math.min(canvas.height, Math.ceil(box.top + box.height));
  if (right <= left || bottom <= top) return false;
  // WebGL counts the rows of the canvas from its lower edge.
  gl.scissor(left, canvas.height - bottom, right - left, bottom - top);
  return true;
}

/** Gives the shares of the bands in the order of the shader: top, right, bottom, left. */
function bandShares(bands: EdgeBands | undefined): [number, number, number, number] {
  return [bands?.top ?? 0, bands?.right ?? 0, bands?.bottom ?? 0, bands?.left ?? 0];
}

function setColor(gl: WebGLRenderingContext, location: WebGLUniformLocation, color: Rgb, opacity: number): void {
  gl.uniform4f(location, color[0] / CHANNEL_MAX, color[1] / CHANNEL_MAX, color[2] / CHANNEL_MAX, opacity);
}

/**
 * Binds the texture of a layer and gives its grid. A layer that moves by itself draws its texture first, for
 * the moment of the frame, from the drawing on its small canvas.
 */
function bindLayer(renderer: Renderer, runtime: LayerRuntime, box: Box, frame: Frame): [number, number] {
  const { gl } = renderer;
  gl.bindTexture(gl.TEXTURE_2D, runtime.texture);
  const { animated, layer } = runtime;
  if (animated === undefined) return [layer.columns ?? LAYER_DEFAULTS.columns, layer.rows ?? LAYER_DEFAULTS.rows];
  const sceneSeconds = frame === "still" ? undefined : frame.sceneSeconds;
  const ratio = renderer.pixelRatio;
  const grid = paintAnimatedLayer(animated, sceneSeconds, box.width / ratio, box.height / ratio);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, animated.canvas);
  return [grid.columns, grid.rows];
}

function drawLayer(renderer: Renderer, runtime: LayerRuntime, frame: Frame): void {
  const { gl, canvas, uniforms, colors } = renderer;
  const { layer, state } = runtime;
  const box = measureBox(canvas, runtime);
  if (!setScissor(gl, canvas, box)) return;
  const timeSeconds = frame === "still" ? 0 : frame.seconds;
  const sway = frame === "still" ? undefined : layer.sway;
  const shimmer = frame === "still" ? 0 : (layer.shimmer ?? LAYER_DEFAULTS.shimmer);
  const [columns, rows] = bindLayer(renderer, runtime, box, frame);
  gl.uniform2f(uniforms.u_grid, columns, rows);
  gl.uniform1f(uniforms.u_coverage, runtime.animated === undefined ? 0 : 1);
  gl.uniform4f(uniforms.u_box, box.left, box.top, box.width, box.height);
  gl.uniform4f(uniforms.u_fade, ...bandShares(layer.fade));
  const close = frame === "still" ? (layer.stillClose ?? layer.close) : layer.close;
  gl.uniform4f(uniforms.u_close, ...bandShares(close));
  gl.uniform2f(uniforms.u_levels, state.blackPoint, state.whitePoint);
  setColor(gl, uniforms.u_ground, colors.ground, layer.groundOpacity ?? LAYER_DEFAULTS.groundOpacity);
  setColor(gl, uniforms.u_bar, colors.bar, layer.barOpacity ?? LAYER_DEFAULTS.barOpacity);
  gl.uniform1f(uniforms.u_mirror, layer.mirror === true ? 1 : 0);
  gl.uniform2f(
    uniforms.u_shimmer,
    shimmer,
    Math.floor(timeSeconds * RENDER.shimmerStepsPerSecond) % RENDER.shimmerSteps,
  );
  gl.uniform3f(
    uniforms.u_sway,
    sway?.x ?? 0,
    sway?.y ?? 0,
    (timeSeconds * (sway?.speed ?? 0)) % (FULL_TURN * RENDER.swayTurns),
  );
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, CORNERS.length / 2);
}

/** Draws every layer that is ready, in the order of the scene. A still scene has no flicker and no sway. */
export function drawScene(renderer: Renderer, frame: Frame): void {
  const { gl, canvas, uniforms } = renderer;
  gl.disable(gl.SCISSOR_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.SCISSOR_TEST);
  gl.uniform2f(uniforms.u_canvas, canvas.width, canvas.height);
  for (const layer of renderer.layers) {
    if (layer.isReady) drawLayer(renderer, layer, frame);
  }
}
