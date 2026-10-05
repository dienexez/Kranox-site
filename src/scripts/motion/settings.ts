// The values that every motion script of the page shares: the easings, the durations, and the two media queries.
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

/** The easings of the page. "out" starts fast and settles. "in" starts slow. "inOut" starts slow and ends slow. */
export const EASES = { out: "page-out", in: "page-in", inOut: "page-in-out" } as const;

CustomEase.create(EASES.out, "0.25, 1, 0.5, 1");
CustomEase.create(EASES.in, "0.5, 0, 0.75, 0");
CustomEase.create(EASES.inOut, "0.76, 0, 0.24, 1");

/** Durations in seconds. */
export const DURATIONS = { short: 0.4, medium: 0.8, long: 1.2 } as const;

/** The pieces of a group start this many seconds one after the other. */
export const STAGGER = 0.1;

// The token that holds the width at which the wide layout starts.
const WIDE_BREAKPOINT_TOKEN = "--breakpoint-wide";

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Gives the media query of the wide layout. tokens.css holds the width. */
export function wideScreenQuery(): string {
  const width = getComputedStyle(document.documentElement).getPropertyValue(WIDE_BREAKPOINT_TOKEN).trim();
  if (width === "") {
    throw new Error(`The token ${WIDE_BREAKPOINT_TOKEN} is missing.`);
  }
  return `(min-width: ${width})`;
}
