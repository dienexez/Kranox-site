// A title in bars. The page keeps the text of the title in its markup, for assistive technology and for
// search, and makes the letters clear when the bars show. The painter draws each line of the text in the
// font of the page, at the place where the page sets it, so that the bars stand exactly over the letters.
import { queryRequired } from "../dom.ts";
import type { Painter } from "./sketch.ts";
import type { TitleSource } from "./types.ts";

interface TitleLine {
  /** The text node of the line. A mark after the text, such as the dot of the title, is not part of it. */
  text: Text;
  element: HTMLElement;
}

const TITLE = {
  /** The custom property on the element that tells how far the bars have grown, from 0 to 1. */
  developProperty: "--title-develop",
  /** The front of the bars is soft over this share of the width of the title. */
  softShare: 0.22,
} as const;

// The styles of the page read this attribute. It tells that the bars show, so that the letters can be clear.
const READY_ATTRIBUTE = "data-title-ready";

const OPAQUE = "rgb(0 0 0 / 1)";
const CLEAR = "rgb(0 0 0 / 0)";

function findLines(target: HTMLElement): TitleLine[] {
  return [...target.querySelectorAll<HTMLElement>("[data-title-line]")].map((element) => {
    const text = element.firstChild;
    if (!(text instanceof Text)) {
      throw new Error("A line of a title in bars needs its text as its first child.");
    }
    return { text, element };
  });
}

/** Reads how far the bars have grown. An element without the property shows the whole title, as a still page does. */
function readDevelop(target: HTMLElement): number {
  const value = parseFloat(getComputedStyle(target).getPropertyValue(TITLE.developProperty));
  return Number.isNaN(value) ? 1 : Math.min(1, Math.max(0, value));
}

/** Gives the font of a line in the form that a canvas takes: weight, size, and family. */
function fontOf(element: HTMLElement): string {
  const style = getComputedStyle(element);
  return `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

/**
 * Draws one line where the page sets it. The box of the text gives its left edge, its top, and its width;
 * the font gives the distance from the top to the baseline. The canvas has no letter spacing of its own, so
 * the line stretches to the width that the page gives it.
 */
function drawLine(context: CanvasRenderingContext2D, line: TitleLine, origin: DOMRect): void {
  const range = document.createRange();
  range.selectNodeContents(line.text);
  const box = range.getBoundingClientRect();
  const content = line.text.data;
  const metrics = context.measureText(content);
  if (metrics.width === 0) return;
  context.save();
  context.translate(box.left - origin.left, box.top - origin.top + metrics.fontBoundingBoxAscent);
  context.scale(box.width / metrics.width, 1);
  context.fillText(content, 0, 0);
  context.restore();
}

/**
 * Gives the painter of a title. It draws nothing until the font of the title has loaded, so that the bars
 * never show the shapes of a fallback font. After its first drawing it marks the element as ready.
 */
export function createTitlePainter(source: TitleSource): Painter {
  const target = queryRequired(document, source.target);
  const canvas = queryRequired<HTMLCanvasElement>(target, "canvas");
  const lines = findLines(target);
  return (context, _seconds, width) => {
    const [first] = lines;
    if (first === undefined) return;
    const font = fontOf(first.element);
    if (!document.fonts.check(font, first.text.data)) return;
    const origin = canvas.getBoundingClientRect();
    const soft = TITLE.softShare * width;
    const front = readDevelop(target) * (width + soft);
    const sweep = context.createLinearGradient(front - soft, 0, front, 0);
    sweep.addColorStop(0, OPAQUE);
    sweep.addColorStop(1, CLEAR);
    context.font = font;
    context.textBaseline = "alphabetic";
    context.fillStyle = sweep;
    for (const line of lines) drawLine(context, line, origin);
    target.setAttribute(READY_ATTRIBUTE, "");
  };
}
