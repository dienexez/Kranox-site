// The values that a layer takes when its scene does not state them. Scene.astro and the scene scripts share them.

export const LAYER_DEFAULTS = {
  columns: 100,
  rows: 100,
  groundOpacity: 1,
  barOpacity: 1,
  shimmer: 0,
} as const;

/** Scene.astro sends each picture with this many pixels for each cell, so that the browser can scale it down well. */
export const PICTURE_SAMPLES_PER_CELL = 2;
