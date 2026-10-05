// Scrolls the page with inertia through Lenis, and keeps the scroll positions of the animations in step with it.
// The menu stops the scroll while it is open, and asks for the scroll to a section.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const SMOOTH = {
  /** One step of the wheel takes this many seconds to come to rest. */
  seconds: 1.2,
  /** A finger moves the page by this factor of its own way. */
  touchMultiplier: 2,
} as const;

const MS_PER_SECOND = 1000;

/** The smooth scroll of the page. A user who asks for reduced motion has none, and the page keeps its own scroll. */
let lenis: Lenis | undefined;

/** The page starts fast and comes to rest slowly: an exponential curve. */
function easeToRest(progress: number): number {
  return Math.min(1, 1.001 - 2 ** (-10 * progress));
}

export function startSmoothScroll(): void {
  const smooth = new Lenis({ duration: SMOOTH.seconds, easing: easeToRest, touchMultiplier: SMOOTH.touchMultiplier });
  smooth.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => smooth.raf(time * MS_PER_SECOND));
  gsap.ticker.lagSmoothing(0);
  lenis = smooth;
}

/** Stops the scroll of the page while a layer lies over it, and starts it again. */
export function setScrollLocked(locked: boolean): void {
  if (locked) lenis?.stop();
  else lenis?.start();
}

/**
 * Scrolls with inertia to the element of a hash, such as "#faq". Returns false when the smooth scroll does
 * not run or when the element lies on another page: then the browser follows the link by itself.
 */
export function scrollToHash(hash: string): boolean {
  if (lenis === undefined || document.querySelector(hash) === null) return false;
  lenis.scrollTo(hash);
  return true;
}

/** Lets each link to a part of the same page, such as "#verify", scroll there with inertia, like the menu does. */
export function followPageAnchors(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
    link.addEventListener("click", (event) => {
      if (scrollToHash(link.hash)) event.preventDefault();
    });
  }
}
