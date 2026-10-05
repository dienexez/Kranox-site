// The scenes of the page: their layers, and the tracks that move them. Scene.astro shows one scene.
// A place or a size of a layer is a percent of its canvas. A level runs from 0 to 255.
import type { ImageMetadata } from "astro";
import { IMAGES } from "../assets/images.ts";
import type { EdgeBands, FlockSource, LayerSource, Scene, VolleySource } from "../scripts/scene/types.ts";

type Source = LayerSource<ImageMetadata>;
type PageScene = Scene<ImageMetadata>;

/** A photograph in shades of gray on a black background. The background is empty. */
function tone(picture: ImageMetadata): Source {
  return { kind: "picture", picture, empty: "black" };
}

// The width of a picture for each unit of its height. The art sets of scripts/brand-art/config.mts give these shapes.
const SHAPES = { wide: 21 / 9, tall: 4 / 5 } as const;

/** Gives the height of a layer in percent of the width of the canvas, so that the picture keeps its shape. */
function heightFor(width: number, shape: number): number {
  return width / shape;
}

// The crows of the scenes. Each flock crosses its band in rounds: a crossing, then a rest. In each round the
// birds take new places, and each bird has its own path, size, and wing beat.
const CROWS = {
  sunrise: { birds: 6, size: 0.22, crossSeconds: 6.5, roundSeconds: 11, startSeconds: 1, seed: 37 },
  faq: { birds: 7, size: 0.2, crossSeconds: 6.5, roundSeconds: 16, startSeconds: 0.5, seed: 41 },
} as const;

/** Gives a flock that flies to the right. A still scene shows it in the middle of its crossing. */
function crows(flock: (typeof CROWS)[keyof typeof CROWS]): FlockSource {
  return { kind: "flock", direction: 1, stillSeconds: flock.crossSeconds / 2, ...flock };
}

// The volley of the questions: it leaves after the crows have crossed. A still scene shows it in mid flight.
const ARROWS: VolleySource = {
  kind: "volley",
  arrows: 16,
  size: 0.24,
  crossSeconds: 2.4,
  spreadSeconds: 1.4,
  roundSeconds: CROWS.faq.roundSeconds,
  startSeconds: 8,
  stillSeconds: 1.8,
  seed: 53,
};

// A moving layer covers a band of its canvas from edge to edge. It shows its drawing, not a ground.
const BAND = { x: 0, width: 100, blackPoint: 0, whitePoint: 255, groundOpacity: 0 } as const;

// The levels of a layer that shows nothing yet: every place counts as bright, so no bar shows.
// From the first pair of levels, a picture develops into its negative. From the second pair, into itself.
const HIDDEN = { blackPoint: 256, whitePoint: 255 } as const;
const HIDDEN_BEFORE_DARK = { blackPoint: -1, whitePoint: 0 } as const;

// A slow wave for a tree, a cloud, and grass.
const BREEZE = { x: 0.5, y: 0.25, speed: 0.9 } as const;
// The flicker of a photograph, like the grain of a film.
const GRAIN = 0.06;

// The levels of a photograph that shows as a dark shape on the light ground: a bright place gets a full bar.
const SILHOUETTE = { blackPoint: 120, whitePoint: 25 } as const;

// Like the art of sondaven.com, a picture never ends in a straight edge. A figure that stands at the foot of
// its canvas dissolves there. The panorama dissolves at its top into the light section before it, and its
// bars close at its foot into the dark section after it.
const FEET: EdgeBands = { bottom: 0.3 };
const PANORAMA_FADE: EdgeBands = { top: 0.3 };
const PANORAMA_CLOSE: EdgeBands = { bottom: 0.3 };
// The olive tree behind the wallet features reaches above the top of its canvas. Since 5 Oct 2026 that canvas
// scrolls with the page, so its top edge passes through the screen; the crown dissolves there instead.
const TREE_CROWN_FADE: EdgeBands = { top: 0.35 };

// The sunrise grows by this factor while the user scrolls into it.
const SUNRISE_ZOOM = 4;

// The sun of the sunrise. Its layer is wider than its canvas, so that the glow spreads into a wide dome, and
// the glow ends inside the layer, so that the dark above the dome meets the prologue without an edge. The
// view moves into the sun by the zoom, around the middle of the canvas.
const SUN = { core: 0.035, reach: 0.48, x: -15, width: 130, height: 128, zoom: 1.48 } as const;
const MIDDLE = 50;

export const SCENES = {
  /** The title of the hero in bars. The script draws each line of the title where the page sets it. */
  heroTitle: {
    layers: [
      {
        // At the size of the title on a wide screen, two bars lie about five pixels apart.
        source: { kind: "title", target: "[data-hero-title]", pitchEm: 0.04 },
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        blackPoint: 0,
        whitePoint: 255,
        groundOpacity: 0,
      },
    ],
  },

  /** Two sentinels that stand at the sides of the prologue and face each other. */
  prologue: {
    wideOnly: true,
    layers: [
      {
        source: tone(IMAGES.toneSentinel),
        x: -12,
        y: 6,
        width: 44,
        height: heightFor(44, SHAPES.tall),
        heightOf: "width",
        blackPoint: 25,
        whitePoint: 200,
        columns: 125,
        rows: 150,
        shimmer: GRAIN,
        fade: FEET,
      },
      {
        source: tone(IMAGES.toneSentinel),
        mirror: true,
        x: 68,
        y: 6,
        width: 44,
        height: heightFor(44, SHAPES.tall),
        heightOf: "width",
        blackPoint: 25,
        whitePoint: 200,
        columns: 125,
        rows: 150,
        shimmer: GRAIN,
        fade: FEET,
      },
    ],
  },

  /**
   * A dark curtain with a sun in its middle. The curtain opens while the user scrolls into the sun. Its top
   * is fully dark, like the prologue above it, so the two sections meet without an edge.
   */
  sunriseIntro: {
    layers: [
      {
        source: { kind: "sun", core: SUN.core, reach: SUN.reach },
        x: SUN.x,
        y: 0,
        width: SUN.width,
        height: SUN.height,
        // With reduced motion the curtain is open from the start. Its top then closes into the dark, so that
        // the light ground still meets the dark prologue through bars.
        stillClose: { top: 0.25 },
        blackPoint: 10,
        whitePoint: 225,
        groundOpacity: 0,
        narrow: { height: 100 },
      },
      {
        source: tone(IMAGES.toneTemple),
        x: 44,
        y: 14,
        width: 62,
        height: heightFor(62, SHAPES.tall),
        heightOf: "width",
        blackPoint: 25,
        whitePoint: 200,
        columns: 136,
        rows: 136,
        shimmer: GRAIN,
        narrow: { x: 30 },
      },
      {
        source: tone(IMAGES.toneOlive),
        x: -10,
        y: 46,
        width: 46,
        height: heightFor(46, SHAPES.tall),
        heightOf: "width",
        blackPoint: 10,
        whitePoint: 140,
        columns: 136,
        rows: 136,
        sway: BREEZE,
      },
    ],
    tracks: [
      {
        layer: 0,
        to: {
          x: MIDDLE - (SUN.width * SUN.zoom) / 2,
          y: -30,
          width: SUN.width * SUN.zoom,
          height: SUN.height * SUN.zoom,
          blackPoint: 0,
          whitePoint: 1,
        },
        narrowTo: { height: 156 },
        start: "bottom bottom",
        end: "bottom -50%",
        ease: "inOut",
      },
      {
        layer: 1,
        to: { x: 230, y: -50, width: 62 * SUNRISE_ZOOM, height: heightFor(62 * SUNRISE_ZOOM, SHAPES.tall) },
        narrowTo: { x: 215 },
        start: "bottom bottom",
        end: "bottom -50%",
        ease: "in",
      },
      {
        layer: 2,
        to: { x: -204, y: -20, width: 46 * SUNRISE_ZOOM, height: heightFor(46 * SUNRISE_ZOOM, SHAPES.tall) },
        start: "bottom bottom",
        end: "bottom -50%",
        ease: "in",
      },
    ],
  },

  /** On the light ground after the sunrise: a phalanx, crows, and an olive tree develop out of nothing. */
  sunriseOutro: {
    wideOnly: true,
    layers: [
      {
        // The phalanx stands behind the first wallet features and scrolls with them.
        source: tone(IMAGES.tonePhalanx),
        x: -6,
        y: 62,
        width: 60,
        height: heightFor(60, SHAPES.wide),
        heightOf: "width",
        ...HIDDEN,
        columns: 150,
        rows: 70,
        groundOpacity: 0,
        // The phalanx never ends in a straight edge: its feet dissolve at the foot of the canvas.
        fade: FEET,
      },
      // A crow is black or white, so it cannot develop. The flock shows from the start.
      { source: crows(CROWS.sunrise), ...BAND, y: 4, height: 26 },
      {
        source: tone(IMAGES.toneOlive),
        x: 56,
        y: -22,
        width: 46,
        height: heightFor(46, SHAPES.tall),
        heightOf: "width",
        ...HIDDEN,
        columns: 150,
        rows: 150,
        groundOpacity: 0,
        sway: BREEZE,
        fade: TREE_CROWN_FADE,
      },
    ],
    // The scene scrolls with the wallet features, so the phalanx and the tree develop while they come into view
    // and have developed when the scene reaches the top of the screen. The owner asked on 5 Oct 2026 that this
    // background no longer stays in place.
    tracks: [
      { layer: 0, to: { blackPoint: 150, whitePoint: 0 }, start: "top bottom", end: "top top" },
      { layer: 2, to: SILHOUETTE, start: "top bottom", end: "top top" },
    ],
  },

  /**
   * One photograph that fills its canvas: a column that marches through a pass by the sea. It develops while
   * it comes into view. Its foot closes into the dark of the questions.
   */
  panorama: {
    layers: [
      {
        source: { kind: "picture", picture: IMAGES.tonePass, empty: "none" },
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        ...HIDDEN_BEFORE_DARK,
        columns: 180,
        rows: 120,
        shimmer: GRAIN,
        fade: PANORAMA_FADE,
        close: PANORAMA_CLOSE,
      },
    ],
    tracks: [
      {
        layer: 0,
        // The photograph is dark: half of its cells lie below 61. Its sea, its haze, and its far mountains are
        // bright, and a white point of 150 turned them into empty ground. The owner found the panorama too empty
        // on 5 Oct 2026, so the white point keeps thin bars in those bright parts too.
        to: { blackPoint: 10, whitePoint: 235 },
        start: "top bottom",
        end: "top 20%",
      },
    ],
  },

  /** A band of bars that grow from nothing to full: the light ground turns into the dark ground. */
  fence: {
    layers: [
      {
        source: { kind: "ridge", seed: 5, peaks: 7, relief: 0.3 },
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        blackPoint: 25,
        whitePoint: 200,
        rows: 40,
        groundOpacity: 0,
        sway: BREEZE,
      },
    ],
  },

  /** Crows cross the questions, then a volley of arrows, then the sky rests. The figures are light on the dark ground. */
  faq: {
    lightBars: true,
    layers: [
      { source: crows(CROWS.faq), ...BAND, y: 5, height: 30 },
      { source: ARROWS, ...BAND, y: 36, height: 58, narrow: { y: 42, height: 45 } },
    ],
  },

  /** The end of the page: a trophy of arms stands in a field that turns the dark ground into the light one. */
  footer: {
    layers: [
      {
        // The bars of the field show the dark ground through them, and the light ground fills the rest.
        source: { kind: "ridge", seed: 3, peaks: 9, relief: 0.16 },
        x: 0,
        y: 67.5,
        width: 100,
        height: 32.5,
        blackPoint: 240,
        whitePoint: 50,
        barOpacity: 0,
        sway: BREEZE,
      },
      {
        source: tone(IMAGES.toneTrophy),
        x: 30,
        y: 5,
        width: 40,
        height: heightFor(40, SHAPES.tall),
        heightOf: "width",
        blackPoint: 0,
        whitePoint: 170,
        columns: 150,
        rows: 125,
        shimmer: GRAIN,
      },
    ],
  },
} as const satisfies Record<string, PageScene>;
