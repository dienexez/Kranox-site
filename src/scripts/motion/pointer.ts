// The parts that answer the pointer. A component marks a part with data-magnetic: the part leans toward the
// pointer and swings back when the pointer leaves. A part with data-magnetic-inner inside it leans more slowly.
import { gsap } from "gsap";

const MAGNET = {
  /** The part moves by up to half of this many em from its place. */
  reachEm: 1.5625,
  followSeconds: 1.6,
  innerFollowSeconds: 2,
  followEase: "power4.out",
  /** The part swings back like a spring. */
  releaseEase: "elastic.out(1, 0.3)",
} as const;

const finePointer = window.matchMedia("(pointer: fine)");

/** Gives the shift for a pointer position inside a box: nothing at its center, and half of the reach at an edge. */
function shiftFor(position: number, start: number, size: number): string {
  return `${((position - start) / size - 0.5) * MAGNET.reachEm}em`;
}

/** Lets each marked part lean toward the pointer. A touch screen has no such pointer. */
export function addMagnets(): void {
  if (!finePointer.matches) return;
  for (const element of document.querySelectorAll<HTMLElement>("[data-magnetic]")) {
    const inner = element.querySelector<HTMLElement>("[data-magnetic-inner]");
    const lean = (target: HTMLElement, x: string | number, y: string | number, seconds: number, ease: string): void => {
      gsap.to(target, { x, y, duration: seconds, ease, overwrite: true });
    };
    element.addEventListener("pointermove", (event) => {
      const box = element.getBoundingClientRect();
      const x = shiftFor(event.clientX, box.left, box.width);
      const y = shiftFor(event.clientY, box.top, box.height);
      lean(element, x, y, MAGNET.followSeconds, MAGNET.followEase);
      if (inner !== null) lean(inner, x, y, MAGNET.innerFollowSeconds, MAGNET.followEase);
    });
    element.addEventListener("pointerleave", () => {
      lean(element, 0, 0, MAGNET.followSeconds, MAGNET.releaseEase);
      if (inner !== null) lean(inner, 0, 0, MAGNET.innerFollowSeconds, MAGNET.releaseEase);
    });
  }
}
