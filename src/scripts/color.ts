// A helper for the scripts of the page that read a color of the palette.

/** The red, the green, and the blue channel of a color, each from 0 to 255. */
export type Rgb = readonly [number, number, number];

/** Reads a color in the form #RRGGBB. The name tells which color is wrong when the form does not match. */
export function parseHexColor(hex: string | undefined, name: string): Rgb {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? "");
  if (match === null) {
    throw new Error(`The color "${name}" needs the form #RRGGBB.`);
  }
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}
