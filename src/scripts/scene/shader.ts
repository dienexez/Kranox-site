// The program that draws one layer of a scene. renderer.ts gives it its values.

/** Writes a number as a float of the shader language. */
function glsl(value: number): string {
  return value.toFixed(4);
}

/** The values of the bars. A width is a share of the width of a cell. */
const BARS = {
  /** A cell at the white point has this width, so that its bar is gone before the cell is fully bright. */
  minWidth: -0.02,
  /** A cell at the black point has this width, so that its bar closes the gap to the next bar. */
  maxWidth: 1.02,
  /** A cell counts as a part of the picture when at least this share of it holds the picture. */
  minCover: 0.5,
  /**
   * A moving layer gives the share of each cell that its drawing covers. A cell with less is empty. A fully
   * covered cell gets a bar of this share of the full width, so that a solid shape still shows its bars.
   */
  minCoverage: 0.04,
  coverageStrength: 0.82,
  /** The phase of the sway grows by these values for each row and for each column. */
  swayRow: 0.31,
  swayColumn: 0.23,
  /** The sway up and down runs at this share of the speed of the sway sideways. */
  swayRatio: 1.3,
} as const;

/**
 * The bands along the edges of a layer. A dissolve takes the cells away in clumps of this many cells across
 * and down, with this share of chance for each single cell, so that the picture ends in scattered fragments.
 * The front of a band meanders: its depth goes from this part of its set depth, deeper, to this part,
 * shallower, in waves of about this many cells.
 */
const EDGES = {
  clumpCells: 3,
  cellShare: 0.35,
  meanderDeep: 0.6,
  meanderShallow: 1.4,
  meanderCells: 12,
  /** A cell farther from every edge than this, in parts of a band, lies in no band. */
  outside: 1000,
  /** Offsets of the random numbers, so that the bands follow neither the flicker nor each other. */
  clumpSeed: 17.3,
  cellSeed: 41.7,
  meanderSeed: 5.9,
} as const;

/** The levels count on this scale. */
const LEVEL_MAX = 255;

export const VERTEX_SHADER = `
attribute vec2 a_corner;

void main() {
  gl_Position = vec4(a_corner, 0.0, 1.0);
}
`;

// A phone needs the high precision: with the medium one, the place inside a column is too coarse.
export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D u_cells;
uniform vec2 u_grid;
// The left edge, the top edge, the width, and the height of the layer, in pixels of the canvas.
uniform vec4 u_box;
// The width and the height of the canvas, in pixels.
uniform vec2 u_canvas;
// The black point and the white point.
uniform vec2 u_levels;
// A color and its opacity.
uniform vec4 u_ground;
uniform vec4 u_bar;
uniform float u_mirror;
// The share of the flicker, and a number that changes with each step of the flicker.
uniform vec2 u_shimmer;
// The sway sideways and the sway up and down, in cells, and the phase of the wave.
uniform vec3 u_sway;
// 1: the texture holds the coverage of a moving drawing in its alpha. 0: it holds the light of a picture.
uniform float u_coverage;
// For the top, the right, the bottom, and the left edge of the visible part of the layer: the share of its
// height or its width over which the layer dissolves, and over which its bars close into a full dark.
uniform vec4 u_fade;
uniform vec4 u_close;

float random(vec2 seed) {
  return fract(sin(dot(seed, vec2(127.1, 311.7))) * 43758.5453);
}

// A smooth noise: random values at the corners of a coarse grid, blended between the corners.
float smoothNoise(vec2 at) {
  vec2 corner = floor(at);
  vec2 share = fract(at);
  share = share * share * (3.0 - 2.0 * share);
  float upper = mix(random(corner), random(corner + vec2(1.0, 0.0)), share.x);
  float lower = mix(random(corner + vec2(0.0, 1.0)), random(corner + vec2(1.0, 1.0)), share.x);
  return mix(upper, lower, share.y);
}

bool hasBands(vec4 shares) {
  return max(max(shares.x, shares.y), max(shares.z, shares.w)) > 0.0;
}

// How far a cell lies inside the bands of the given edges of the visible part of the layer, the part inside
// the canvas: 0 at an edge, 1 past the inner front of the band. The front meanders, so that it never runs
// along a straight line.
float bandDepth(vec4 shares, vec2 cell) {
  vec2 middle = u_box.xy + (cell + 0.5) / u_grid * u_box.zw;
  vec2 low = max(u_box.xy, vec2(0.0));
  vec2 high = min(u_box.xy + u_box.zw, u_canvas);
  vec2 size = max(high - low, vec2(1.0));
  float depth = ${glsl(EDGES.outside)};
  if (shares.x > 0.0) depth = min(depth, (middle.y - low.y) / (shares.x * size.y));
  if (shares.y > 0.0) depth = min(depth, (high.x - middle.x) / (shares.y * size.x));
  if (shares.z > 0.0) depth = min(depth, (high.y - middle.y) / (shares.z * size.y));
  if (shares.w > 0.0) depth = min(depth, (middle.x - low.x) / (shares.w * size.x));
  float wave = smoothNoise(cell / ${glsl(EDGES.meanderCells)} + ${glsl(EDGES.meanderSeed)});
  return smoothstep(0.0, 1.0, depth * mix(${glsl(EDGES.meanderDeep)}, ${glsl(EDGES.meanderShallow)}, wave));
}

// A layer dissolves toward some edges, so that no straight line shows where a picture ends or where the
// canvas cuts it. Closer to such an edge, more cells leave, in small clumps.
bool dissolves(vec2 cell) {
  if (!hasBands(u_fade)) return false;
  float clump = random(floor(cell / ${glsl(EDGES.clumpCells)}) + ${glsl(EDGES.clumpSeed)});
  float chance = mix(clump, random(cell + ${glsl(EDGES.cellSeed)}), ${glsl(EDGES.cellShare)});
  return chance >= bandDepth(u_fade, cell);
}

void main() {
  // The canvas counts its rows from the lower edge. The layer counts from the upper edge.
  vec2 pixel = vec2(gl_FragCoord.x, u_canvas.y - gl_FragCoord.y);
  vec2 place = (pixel - u_box.xy) / u_box.zw;
  if (place.x < 0.0 || place.x >= 1.0 || place.y < 0.0 || place.y >= 1.0) discard;

  vec2 cell = floor(place * u_grid);
  if (dissolves(cell)) discard;
  vec2 wave = vec2(
    sin(u_sway.z + cell.y * ${glsl(BARS.swayRow)}),
    sin(u_sway.z * ${glsl(BARS.swayRatio)} + cell.x * ${glsl(BARS.swayColumn)})
  );
  vec2 at = (cell + 0.5 + wave * u_sway.xy) / u_grid;
  if (u_mirror > 0.5) at.x = 1.0 - at.x;
  vec4 picture = texture2D(u_cells, at);
  float light;
  if (u_coverage > 0.5) {
    if (picture.a < ${glsl(BARS.minCoverage)}) discard;
    light = 1.0 - ${glsl(BARS.coverageStrength)} * picture.a;
  } else {
    if (picture.a < ${glsl(BARS.minCover)}) discard;
    light = picture.r + (random(cell + u_shimmer.y) - 0.5) * u_shimmer.x;
  }
  float range = u_levels.y - u_levels.x;
  if (range != 0.0) light = (light * ${glsl(LEVEL_MAX)} - u_levels.x) / range;
  light = clamp(light, 0.0, 1.0);
  // Toward some edges the bars widen until they close, so that the layer meets a dark section. This comes
  // after the levels, so the bars close also where the levels make the picture bright.
  if (hasBands(u_close)) light *= bandDepth(u_close, cell);

  // The bar stands in the middle of its cell. The cover is the share of this pixel that the bar fills, so
  // that the edge of a bar is soft, and a bar that is thinner than a pixel is faint.
  float width = mix(${glsl(BARS.maxWidth)}, ${glsl(BARS.minWidth)}, light);
  float cellPixels = u_box.z / u_grid.x;
  float halfBar = max(width, 0.0) * 0.5 * cellPixels;
  float fromMiddle = abs(fract(place.x * u_grid.x) - 0.5) * cellPixels;
  float filled = min(halfBar, fromMiddle + 0.5) - max(-halfBar, fromMiddle - 0.5);
  float cover = width >= 1.0 ? 1.0 : clamp(filled, 0.0, 1.0);

  vec4 ground = vec4(u_ground.rgb * u_ground.a, u_ground.a);
  vec4 bar = vec4(u_bar.rgb * u_bar.a, u_bar.a);
  gl_FragColor = mix(ground, bar, cover);
}
`;

export const UNIFORM_NAMES = [
  "u_cells",
  "u_grid",
  "u_box",
  "u_canvas",
  "u_levels",
  "u_ground",
  "u_bar",
  "u_mirror",
  "u_shimmer",
  "u_sway",
  "u_coverage",
  "u_fade",
  "u_close",
] as const;

export type Uniforms = Record<(typeof UNIFORM_NAMES)[number], WebGLUniformLocation>;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader === null) {
    throw new Error("The browser gives no shader for the scenes.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
    throw new Error(`A shader of the scenes does not compile: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/** Builds the program, and makes it the program that the context draws with. */
export function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    throw new Error(`The program of the scenes does not link: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);
  return program;
}

export function findUniforms(gl: WebGLRenderingContext, program: WebGLProgram): Uniforms {
  const entries = UNIFORM_NAMES.map((name) => {
    const location = gl.getUniformLocation(program, name);
    if (location === null) {
      throw new Error(`The shader of the scenes has no uniform "${name}".`);
    }
    return [name, location] as const;
  });
  return Object.fromEntries(entries) as Uniforms;
}
