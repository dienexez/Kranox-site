// The shapes of a scene. data/scenes.ts describes the scenes with these shapes, Scene.astro sends them to
// the page, and the scene scripts draw them.
//
// A scene is one canvas with layers. Each layer shows one picture as vertical bars: a dark place of the
// picture gets a wide bar, and a bright place gets a thin bar or none. A track changes the values of a
// layer while the user scrolls. A flock or a volley moves by itself: the script draws it again in each frame.

/** The values of a layer that a track can change. */
export interface LayerState {
  /** The left edge and the top edge of the layer, in percent of the width and of the height of the canvas. */
  x: number;
  y: number;
  /** The width of the layer, in percent of the width of the canvas. */
  width: number;
  /** The height of the layer, in percent. The property heightOf tells of which size. */
  height: number;
  /**
   * The levels of the picture, on the scale from 0 to 255. A place as dark as the black point gets a full
   * bar, and a place as bright as the white point gets no bar. A black point above the white point turns
   * the picture into its negative.
   */
  blackPoint: number;
  whitePoint: number;
}

/** Which tone of a picture counts as empty. An empty place shows nothing of the layer. */
export type EmptyTone = "black" | "white" | "none";

/** A picture, or a drawing that the script makes one time. */
export type StaticSource<Picture> =
  /** A picture from a file. A place of its empty tone shows nothing. */
  | { kind: "picture"; picture: Picture; empty: EmptyTone }
  /** A mountain range that the script draws: bright at its ridge, and dark toward its foot. */
  | { kind: "ridge"; seed: number; peaks: number; relief: number }
  /** A sun that the script draws: a bright core, and a glow that fades into the dark. */
  | { kind: "sun"; core: number; reach: number };

/** The timing of a source that moves by itself. It moves in rounds: a crossing, then a rest until the next round. */
interface Rounds {
  /** One round takes this many seconds. */
  roundSeconds: number;
  /** The first round starts this many seconds after the scene first comes into view. */
  startSeconds: number;
  /** In a still scene, the drawing shows the moment that lies this many seconds after the start of a round. */
  stillSeconds: number;
  /** The seed of the random numbers. Each round adds its number to it, so that no two rounds look the same. */
  seed: number;
}

/**
 * A flock of birds. Each bird keeps its own place in the flock, drifts around that place, climbs or sinks,
 * beats its wings at its own pace, and glides now and then.
 */
export interface FlockSource extends Rounds {
  kind: "flock";
  birds: number;
  /** The length of the body of a bird, as a share of the height of the layer. */
  size: number;
  /** The flock crosses the layer in this many seconds. */
  crossSeconds: number;
  /** 1: the flock flies to the right. -1: to the left. */
  direction: 1 | -1;
}

/** A volley of arrows. The arrows leave one after the other, and each one flies its own arc and turns along it. */
export interface VolleySource extends Rounds {
  kind: "volley";
  arrows: number;
  /** The length of an arrow, as a share of the height of the layer. */
  size: number;
  /** An arrow crosses the layer in about this many seconds. */
  crossSeconds: number;
  /** The arrows leave over this many seconds. */
  spreadSeconds: number;
}

/**
 * The text of an element of the page, in bars. The script draws each line of the text where the page sets
 * it, in the font of the page, so that the bars stand exactly over the text. The element carries the
 * custom property --title-develop, from 0 to 1, and the bars grow from the left to the right with it.
 */
export interface TitleSource {
  kind: "title";
  /** A selector of the element. Each child with the attribute data-title-line holds one line. */
  target: string;
  /** Two bars lie this share of the font size apart, so that a small title on a phone keeps its letters. */
  pitchEm: number;
}

/** A drawing that the script makes again in each frame. */
export type AnimatedSource = FlockSource | VolleySource | TitleSource;

export type LayerSource<Picture> = StaticSource<Picture> | AnimatedSource;

/**
 * Bands along some edges of the visible part of a layer: for each edge, the share of the height or of the
 * width of that part that its band covers. The visible part is the part inside the canvas, so a band also
 * lies where the canvas cuts a picture.
 */
export type EdgeBands = Partial<Record<"top" | "right" | "bottom" | "left", number>>;

/** A slow wave that moves the picture inside its layer, so that a still picture seems to live. */
export interface Sway {
  /** How far the picture moves, in cells: sideways, and up and down. */
  x: number;
  y: number;
  /** The phase of the wave grows by this value in each second. */
  speed: number;
}

export interface Layer<Picture> extends LayerState {
  source: LayerSource<Picture>;
  /** "width": the height counts in percent of the width of the canvas, so the layer keeps its shape. */
  heightOf?: "height" | "width";
  /** The number of bars across the layer, and the number of steps in which a bar changes its width. */
  columns?: number;
  rows?: number;
  /** How much of the ground color shows between the bars, and how much of the bar color, from 0 to 1. */
  groundOpacity?: number;
  barOpacity?: number;
  /** Shows the picture as in a mirror. */
  mirror?: boolean;
  /** The brightness of each cell flickers by up to this share, like the grain of a film. */
  shimmer?: number;
  sway?: Sway;
  /** Toward these edges the layer dissolves into scattered fragments, so that it ends in no straight line. */
  fade?: EdgeBands;
  /** Toward these edges the bars of the layer close into a full dark, so that it meets a dark section. */
  close?: EdgeBands;
  /**
   * The bands that close in a still scene, for example with reduced motion. A still scene shows the end of
   * its tracks, so an edge that was dark at the start can be bright there. These bands replace close then.
   */
  stillClose?: EdgeBands;
  /** Values that replace the values above on a narrow screen. */
  narrow?: Partial<LayerState>;
}

export type EaseName = "none" | "in" | "out" | "inOut";

/** Changes a layer while the canvas of the scene crosses the viewport. */
export interface Track {
  /** The position of the layer in the list of the scene. */
  layer: number;
  to: Partial<LayerState>;
  /** Values that replace the values of "to" on a narrow screen. */
  narrowTo?: Partial<LayerState>;
  /** The scroll positions of ScrollTrigger: a place on the element, then a place in the viewport. */
  start: string;
  end: string;
  ease?: EaseName;
}

export interface Scene<Picture> {
  layers: readonly Layer<Picture>[];
  tracks?: readonly Track[];
  /** The scene shows on a wide screen only. */
  wideOnly?: boolean;
  /** The bars take the light color of the page, and the ground takes the dark color. */
  lightBars?: boolean;
}
