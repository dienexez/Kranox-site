// The list of questions. Faq.astro holds the markup: without this script, every answer is open.
// The script closes the answers and opens one at a time. The lines of an answer rise while it opens.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { queryRequired } from "../dom.ts";
import { DURATIONS, EASES, STAGGER } from "./settings.ts";

gsap.registerPlugin(ScrollTrigger, SplitText);

interface Item {
  button: HTMLElement;
  panel: HTMLElement;
  icon: HTMLElement;
  text: HTMLElement;
  /** The lines of the answer, from the last time the answer opened. */
  split: SplitText | undefined;
}

const ACCORDION = {
  /** The upright stroke of the plus sign lies flat when the answer is open. Faq.astro reads this property. */
  iconProperty: "--item-icon-turn",
  closedTurn: "90deg",
  openTurn: "0deg",
  /** A line of the answer waits this far below its place, in percent of its height. */
  lineOffset: 250,
  lineDelay: 0.2,
  lineStaggerShare: 0.5,
} as const;

function findItem(element: HTMLElement): Item {
  return {
    button: queryRequired(element, "[data-accordion-button]"),
    panel: queryRequired(element, "[data-accordion-panel]"),
    icon: queryRequired(element, "[data-accordion-icon]"),
    text: queryRequired(element, "[data-accordion-text]"),
    split: undefined,
  };
}

function isOpen(item: Item): boolean {
  return item.button.getAttribute("aria-expanded") === "true";
}

/** Lets the lines of the answer rise into their places. The lines depend on the width, so each opening splits again. */
function raiseLines(item: Item): void {
  item.split?.revert();
  item.split = SplitText.create(item.text, { type: "lines", linesClass: "split-line", aria: "none" });
  gsap.from(item.split.lines, {
    yPercent: ACCORDION.lineOffset,
    opacity: 0,
    duration: DURATIONS.long,
    delay: ACCORDION.lineDelay,
    ease: EASES.out,
    stagger: STAGGER * ACCORDION.lineStaggerShare,
  });
}

/** Opens or closes one answer. An answer that does not move changes at once. */
function setOpen(item: Item, open: boolean, moves: boolean): void {
  if (isOpen(item) === open) return;
  item.button.setAttribute("aria-expanded", String(open));
  gsap.to(item.panel, {
    height: open ? "auto" : 0,
    duration: moves ? DURATIONS.long : 0,
    ease: EASES.out,
    overwrite: true,
    // The height of the page changed, and with it the scroll positions of the parts below the list.
    onComplete: () => ScrollTrigger.refresh(),
  });
  gsap.to(item.icon, {
    [ACCORDION.iconProperty]: open ? ACCORDION.openTurn : ACCORDION.closedTurn,
    duration: moves ? DURATIONS.medium : 0,
    ease: EASES.inOut,
    overwrite: true,
  });
  if (open && moves) raiseLines(item);
}

/** Closes every answer, and lets a click on a question open its answer and close the others. */
export function watchAccordions(moves: boolean): void {
  for (const accordion of document.querySelectorAll<HTMLElement>("[data-accordion]")) {
    const items = [...accordion.querySelectorAll<HTMLElement>("[data-accordion-item]")].map(findItem);
    for (const item of items) {
      setOpen(item, false, false);
      item.button.addEventListener("click", () => {
        const willOpen = !isOpen(item);
        for (const other of items) {
          if (other !== item) setOpen(other, false, moves);
        }
        setOpen(item, willOpen, moves);
      });
    }
  }
}
