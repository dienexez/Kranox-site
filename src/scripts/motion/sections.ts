// The motion of the sections that follow the scroll: the sunrise and the footer, and the parts with parallax.
// Sunrise.astro and Footer.astro hold the markup and mark the parts with data attributes. hero.ts moves the hero.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { queryRequired } from "../dom.ts";
import { supportsScenes } from "../scene/support.ts";
import { EASES } from "./settings.ts";

gsap.registerPlugin(ScrollTrigger);

/** A part with parallax moves by this share of its height, in percent, before and after its place of rest. */
const PARALLAX_PERCENT = 10;

const FOOTER = {
  /** The frame starts at this scale, and the scene inside it at this scale. Both shrink around this point. */
  frameScale: 2,
  sceneScale: 0.75,
  origin: "center 10%",
} as const;

/** Lets the title of the sunrise grow from nothing to its size while the view moves into the sun. */
export function growSunriseTitle(): void {
  // Without the scene there is no sun, and a title that waits to grow would leave the screen empty.
  if (!supportsScenes()) return;
  const sunrise = queryRequired(document, "[data-sunrise]");
  gsap.fromTo(
    queryRequired(sunrise, "[data-sunrise-heading]"),
    { scale: 0 },
    {
      scale: 1,
      ease: EASES.inOut,
      scrollTrigger: {
        trigger: queryRequired(sunrise, "[data-sunrise-run]"),
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
      },
    },
  );
}

/**
 * The sign to keep scrolling leaves when the next content of the page enters: the top of the part marked
 * data-sunrise-next reaches this height of the screen. The owner asked on 5 Oct 2026 that the sign stays until then.
 */
const SUNRISE_HINT_END = "top 90%";

/** Shows the sign to keep scrolling while the view moves into the sun, so that the long still screen does not read as the end of the page. */
export function showSunriseHint(): void {
  const sunrise = queryRequired(document, "[data-sunrise]");
  const hint = queryRequired(sunrise, "[data-sunrise-hint]");
  ScrollTrigger.create({
    trigger: queryRequired(sunrise, "[data-sunrise-run]"),
    start: "top bottom",
    endTrigger: queryRequired(sunrise, "[data-sunrise-next]"),
    end: SUNRISE_HINT_END,
    onToggle: ({ isActive }) => hint.toggleAttribute("data-visible", isActive),
  });
}

/**
 * Lets the footer shrink from a close view to the whole picture while it scrolls into view, so that the page ends
 * on the whole picture. The footer is one screen high: the zoom starts when its top enters the viewport.
 */
export function zoomFooter(): void {
  const footer = queryRequired(document, "[data-footer]");
  gsap
    .timeline({ scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: true } })
    .fromTo(
      queryRequired(footer, "[data-footer-frame]"),
      { scale: FOOTER.frameScale, transformOrigin: FOOTER.origin },
      { scale: 1, ease: "none" },
    )
    .fromTo(
      queryRequired(footer, "[data-footer-scene]"),
      { scale: FOOTER.sceneScale, transformOrigin: FOOTER.origin },
      { scale: 1, ease: "none" },
      "<",
    );
}

/** Moves each marked part a little against the page while it crosses the viewport, so that it seems to lie deeper. */
export function addParallax(): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
    const direction = element.dataset.parallax === "up" ? -1 : 1;
    gsap.fromTo(
      element,
      { yPercent: -PARALLAX_PERCENT * direction },
      {
        yPercent: PARALLAX_PERCENT * direction,
        ease: "none",
        scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  }
}
