// The menu of the page. Menu.astro holds the markup and the styles; the styles move every part when the
// root has data-open. The script opens and closes the menu, keeps the focus in a sensible place, stops the
// scroll of the page while the menu is open, scrolls to a section, and rolls the letters of the main action.
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { queryRequired } from "../dom.ts";
import { reducedMotion } from "./settings.ts";
import { scrollToHash, setScrollLocked } from "./smooth-scroll.ts";

gsap.registerPlugin(CustomEase, SplitText);

interface MenuParts {
  root: HTMLElement;
  toggle: HTMLButtonElement;
  panel: HTMLElement;
  icon: HTMLElement;
  /** The links of the sections, in the card. The first one takes the focus when the menu opens. */
  sections: HTMLAnchorElement[];
}

/** Where the focus goes after the menu opens or closes. */
type FocusTarget = "card" | "toggle" | "stay";

// The styles read this attribute on the root.
const OPEN_ATTRIBUTE = "data-open";

/** The roll of the letters of the main action: a wait, a duration, and a delay from one letter to the next, in seconds. */
const ROLL = { wait: 0.1, duration: 0.5, stagger: 0.01, ease: "menu-roll" } as const;
CustomEase.create(ROLL.ease, "M0,0 C0.65,0 0,1.04 1,1");

/**
 * The letters of the copy wait this far below their places, in percent of their height, and the letters
 * of the words leave as far upward. The window of the words has room for the edges of the letters, so the
 * distance is more than one height: a letter that waits shows no part of itself.
 */
const BELOW_PERCENT = 130;

const finePointer = window.matchMedia("(pointer: fine)");

function findParts(): MenuParts {
  const root = queryRequired(document, "[data-menu]");
  const panel = queryRequired(root, "[data-menu-panel]");
  return {
    root,
    toggle: queryRequired<HTMLButtonElement>(root, "[data-menu-toggle]"),
    panel,
    icon: queryRequired(root, "[data-menu-icon]"),
    sections: [...panel.querySelectorAll<HTMLAnchorElement>("[data-menu-link]")],
  };
}

function isOpen({ root }: MenuParts): boolean {
  return root.hasAttribute(OPEN_ATTRIBUTE);
}

/**
 * Opens or closes the menu. A closed card is inert, so that its links take no focus. An open menu hides the
 * icon from the focus, because the icon shrinks to nothing.
 */
function setOpen(parts: MenuParts, open: boolean, focus: FocusTarget): void {
  if (isOpen(parts) === open) return;
  parts.root.toggleAttribute(OPEN_ATTRIBUTE, open);
  parts.toggle.setAttribute("aria-expanded", String(open));
  parts.panel.inert = !open;
  parts.icon.inert = open;
  setScrollLocked(open);
  if (focus === "card") parts.sections[0]?.focus();
  if (focus === "toggle") parts.toggle.focus();
}

/**
 * A click on a section closes the menu and scrolls there. Without the smooth scroll, the browser jumps by itself.
 * On a page without the section, such as a legal page, the browser opens the home page at the section.
 */
function followSection(parts: MenuParts, link: HTMLAnchorElement, event: MouseEvent): void {
  setOpen(parts, false, "stay");
  if (scrollToHash(link.hash)) event.preventDefault();
}

function watchMenu(parts: MenuParts): void {
  const { root, toggle } = parts;
  toggle.addEventListener("click", () => setOpen(parts, !isOpen(parts), isOpen(parts) ? "stay" : "card"));
  queryRequired(root, "[data-menu-close]").addEventListener("click", () => setOpen(parts, false, "stay"));
  for (const link of root.querySelectorAll<HTMLAnchorElement>("[data-menu-link]")) {
    link.addEventListener("click", (event) => followSection(parts, link, event));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen(parts)) setOpen(parts, false, "toggle");
  });
  // The menu closes when the focus leaves it, for example with the Tab key after the last link.
  root.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !root.contains(next)) setOpen(parts, false, "stay");
  });
}

/**
 * Rolls the letters of the main action under the pointer: they leave upward one after the other, and the
 * letters of the copy come up from below. When the pointer leaves, both sets of letters return to their
 * places at once: the copy shows the same words, so the jump does not show. A roll in progress ends first.
 */
function rollAction(root: HTMLElement): void {
  if (!finePointer.matches || reducedMotion.matches) return;
  const action = queryRequired(root, "[data-menu-action]");
  const front = SplitText.create(queryRequired(action, "[data-menu-action-text]"), { type: "chars" });
  const back = SplitText.create(queryRequired(action, "[data-menu-action-copy]"), { type: "chars", aria: "none" });
  gsap.set(back.chars, { yPercent: BELOW_PERCENT });
  const state = { rolled: false, rolling: false, returnWaits: false };
  let wait: gsap.core.Tween | undefined;
  const settle = (): void => {
    gsap.set(front.chars, { yPercent: 0 });
    gsap.set(back.chars, { yPercent: BELOW_PERCENT });
    Object.assign(state, { rolled: false, returnWaits: false });
  };
  const roll = (): void => {
    Object.assign(state, { rolled: true, rolling: true, returnWaits: false });
    const motion = { duration: ROLL.duration, ease: ROLL.ease, stagger: ROLL.stagger, overwrite: true };
    gsap.to(front.chars, { ...motion, yPercent: -BELOW_PERCENT });
    gsap.to(back.chars, {
      ...motion,
      yPercent: 0,
      onComplete: () => {
        state.rolling = false;
        if (state.returnWaits) settle();
      },
    });
  };
  action.addEventListener("pointerenter", () => {
    wait = gsap.delayedCall(ROLL.wait, roll);
  });
  action.addEventListener("pointerleave", () => {
    wait?.kill();
    if (!state.rolled) return;
    if (state.rolling) state.returnWaits = true;
    else settle();
  });
}

export function initMenu(): void {
  const parts = findParts();
  watchMenu(parts);
  rollAction(parts.root);
}
