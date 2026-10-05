// The motion of the pages. The home page starts initHomeMotion, a page of text starts initTextMotion, and the
// downloads page and the docs page start initPageMotion.
// Each module holds one kind of motion:
//   smooth-scroll.ts  the page scrolls with inertia
//   reveal.ts         texts and blocks show when the user reaches them, and a text lights up letter by letter
//   hero.ts           the hero enters when the page loads, and its layers move at their own speed on scroll
//   sections.ts       the sunrise and the footer follow the scroll
//   pointer.ts        a part leans toward the pointer
//   accordion.ts      the answers of the questions open and close
// Menu.astro starts menu.ts, and Scene.astro starts the scenes in scene/index.ts.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { watchAccordions } from "./accordion.ts";
import { addHeroDepth, playHeroIntro } from "./hero.ts";
import { addMagnets } from "./pointer.ts";
import { highlightTexts, revealParts } from "./reveal.ts";
import { addParallax, growSunriseTitle, showSunriseHint, zoomFooter } from "./sections.ts";
import { reducedMotion, wideScreenQuery } from "./settings.ts";
import { followPageAnchors, startSmoothScroll } from "./smooth-scroll.ts";

gsap.registerPlugin(ScrollTrigger);

// The styles read this attribute.
const MOTION_ATTRIBUTE = "data-motion";

export function initHomeMotion(): void {
  const root = document.documentElement;
  const moves = !reducedMotion.matches;
  if (!moves) {
    // The page stays without motion. The styles then show every part at once.
    watchAccordions(false);
    root.setAttribute(MOTION_ATTRIBUTE, "reduced");
    return;
  }
  startSmoothScroll();
  playHeroIntro();
  addHeroDepth();
  revealParts();
  highlightTexts();
  growSunriseTitle();
  showSunriseHint();
  addParallax();
  addMagnets();
  watchAccordions(true);
  zoomFooterOnWideScreens();
  root.setAttribute(MOTION_ATTRIBUTE, "on");
  // A font that loads late changes the height of the text, and with it the scroll positions.
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/** On a narrow screen the footer stays at rest. GSAP reverts its motion when the screen gets narrow. */
function zoomFooterOnWideScreens(): void {
  gsap.matchMedia().add(wideScreenQuery(), () => {
    zoomFooter();
  });
}

/**
 * A page of its own under the menu, such as the downloads page or the docs page: its parts show when the user
 * reaches them, a link to a part of the same page scrolls there, and the footer zooms out as on the home page.
 */
export function initPageMotion(): void {
  const root = document.documentElement;
  if (reducedMotion.matches) {
    root.setAttribute(MOTION_ATTRIBUTE, "reduced");
    return;
  }
  startSmoothScroll();
  followPageAnchors();
  revealParts();
  zoomFooterOnWideScreens();
  root.setAttribute(MOTION_ATTRIBUTE, "on");
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/** A page of text, such as a legal page, has the smooth scroll only. */
export function initTextMotion(): void {
  const root = document.documentElement;
  if (reducedMotion.matches) {
    root.setAttribute(MOTION_ATTRIBUTE, "reduced");
    return;
  }
  startSmoothScroll();
  root.setAttribute(MOTION_ATTRIBUTE, "on");
}
