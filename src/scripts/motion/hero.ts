// The motion of the hero of the first site. Hero.astro holds the markup and marks the parts:
//   data-hero-title   the title in bars: its bars grow from the left to the right, then its dot comes in
//   data-enter        a part that rises into view after the title
//   data-depth        a layer that moves at its own speed while the user scrolls away from the hero
// The bars of the title read the custom property --title-develop, and the dot reads --title-mark.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { queryRequired } from "../dom.ts";

gsap.registerPlugin(ScrollTrigger);

/** Delays and durations in seconds, and a distance in pixels. The parts keep the numbers of the first site. */
const INTRO = {
  delay: 0.2,
  /** The bars grow over this time, at an even pace in the middle, so that the eye can follow them. */
  developDuration: 1.3,
  developEase: "power2.inOut",
  /** The dot comes in when the bars have passed the end of the title, with a small overshoot. */
  markAt: 0.9,
  markDuration: 0.5,
  markEase: "back.out(2)",
  partDelay: 0.35,
  partDuration: 0.9,
  partStagger: 0.08,
  partOffsetPx: 28,
  partEase: "power3.out",
} as const;

const CLEAR_AFTER_ENTER = "transform,opacity,visibility";

function all<T extends Element>(selector: string, parent: ParentNode): T[] {
  return [...parent.querySelectorAll<T>(selector)];
}

/** Shows the hero: the bars of the title grow, its dot comes in, and the other parts rise one after the other. */
export function playHeroIntro(): void {
  const hero = queryRequired(document, "[data-hero]");
  const title = queryRequired(hero, "[data-hero-title]");
  const timeline = gsap.timeline({ delay: INTRO.delay });
  timeline.fromTo(
    title,
    { "--title-develop": 0 },
    { "--title-develop": 1, duration: INTRO.developDuration, ease: INTRO.developEase },
    0,
  );
  timeline.fromTo(
    title,
    { "--title-mark": 0 },
    { "--title-mark": 1, duration: INTRO.markDuration, ease: INTRO.markEase },
    INTRO.markAt,
  );
  timeline.from(
    all("[data-enter]", hero),
    {
      y: INTRO.partOffsetPx,
      autoAlpha: 0,
      duration: INTRO.partDuration,
      ease: INTRO.partEase,
      stagger: INTRO.partStagger,
      clearProps: CLEAR_AFTER_ENTER,
    },
    INTRO.partDelay,
  );
}

/** Reads how far a layer moves, in percent of its own height. A positive layer falls behind the page. */
function readDepth(layer: HTMLElement): number {
  const shift = Number(layer.dataset.depth);
  if (layer.dataset.depth === "" || Number.isNaN(shift)) {
    throw new Error(`The attribute data-depth needs a number, not "${layer.dataset.depth}".`);
  }
  return shift;
}

/** Moves the layers of the hero at their own speed while the user scrolls away from it, so that it has depth. */
export function addHeroDepth(): void {
  const hero = queryRequired(document, "[data-hero]");
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });
  for (const layer of all<HTMLElement>("[data-depth]", hero)) {
    timeline.fromTo(layer, { yPercent: 0 }, { yPercent: readDepth(layer), ease: "none" }, 0);
  }
}
