// The layers that the script draws again in each frame: a flock, a volley, and a title. A small canvas
// holds the drawing of a layer at the size of its grid, one pixel for each cell, and the renderer takes that
// canvas as the texture of the layer. The grid follows the size of the layer on the screen, so that the bars
// keep the same width on every screen.
import { queryRequired } from "../dom.ts";
import { createFlockPainter } from "./flock.ts";
import type { Painter } from "./sketch.ts";
import { createTitlePainter } from "./title.ts";
import type { AnimatedSource, LayerSource } from "./types.ts";
import { createVolleyPainter } from "./volley.ts";

export interface AnimatedLayer {
  source: AnimatedSource;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  paint: Painter;
  /** Gives the distance between two bars, in CSS pixels. */
  pitch: () => number;
}

/**
 * The grid of a moving layer: two bars lie this many CSS pixels apart, and a row has this share of that
 * distance. The bars lie as close as the bars of the pictures of the scenes, so that a bird keeps its shape.
 * A title sets its distance by its font size.
 */
const GRID = { pitchPx: 4.5, rowShare: 0.6 } as const;

/** The color of the drawing. Only the share that it covers counts, so any color works. */
const INK = "#000";

export function isAnimated(source: LayerSource<string>): source is AnimatedSource {
  return source.kind === "flock" || source.kind === "volley" || source.kind === "title";
}

/** Gives the distance between two bars. A title reads its font size each time, because the size follows the screen. */
function createPitch(source: AnimatedSource): () => number {
  if (source.kind !== "title") return () => GRID.pitchPx;
  const target = queryRequired(document, source.target);
  return () => parseFloat(getComputedStyle(target).fontSize) * source.pitchEm;
}

function createPainter(source: AnimatedSource): Painter {
  switch (source.kind) {
    case "flock":
      return createFlockPainter(source);
    case "volley":
      return createVolleyPainter(source);
    case "title":
      return createTitlePainter(source);
  }
}

export function createAnimatedLayer(source: AnimatedSource): AnimatedLayer {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("The browser gives no 2D context to draw the moving layers of the scenes.");
  }
  return { source, canvas, context, paint: createPainter(source), pitch: createPitch(source) };
}

/** Draws a layer at one moment of its scene, for a box of the given size in CSS pixels, and gives the grid. */
export function paintAnimatedLayer(
  layer: AnimatedLayer,
  sceneSeconds: number | undefined,
  width: number,
  height: number,
): { columns: number; rows: number } {
  const { canvas, context } = layer;
  const pitch = layer.pitch();
  const columns = Math.max(1, Math.round(width / pitch));
  const rows = Math.max(1, Math.round(height / (pitch * GRID.rowShare)));
  if (canvas.width !== columns || canvas.height !== rows) {
    canvas.width = columns;
    canvas.height = rows;
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, columns, rows);
  context.setTransform(columns / width, 0, 0, rows / height, 0, 0);
  context.fillStyle = INK;
  context.globalAlpha = 1;
  layer.paint(context, sceneSeconds, width, height);
  return { columns, rows };
}
