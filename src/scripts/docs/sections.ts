// The list at the side of the docs marks the section in view, as the reference does. When the list scrolls on its
// own, it keeps the marked link in view. A click on a link puts the anchor of the section into the address, so that
// the address can be shared.
import { queryRequired } from "../dom.ts";

const SELECTORS = {
  nav: "[data-docs-nav]",
  link: "[data-docs-link]",
  section: "[data-docs-section]",
} as const;

// A section counts as the one in view once its top has passed this share of the height of the screen.
const READ_LINE = 0.3;

// The page counts as scrolled to its end within this many pixels of it. There the last section is in view, even
// when it is too short for its top to reach the read line.
const END_SLACK_PX = 2;

// The marked link keeps this much room to the edge of the list when the list scrolls to it.
const LINK_ROOM_PX = 24;

// The value of aria-current for a link to a part of the same page.
const CURRENT = "location";

export function followSections(): void {
  const nav = queryRequired(document, SELECTORS.nav);
  const links = new Map(
    [...nav.querySelectorAll<HTMLAnchorElement>(SELECTORS.link)].map((link) => [link.hash.slice(1), link]),
  );
  const sections = [...document.querySelectorAll<HTMLElement>(SELECTORS.section)];
  if (sections.length === 0) {
    throw new Error("The docs page has no section.");
  }
  let marked: HTMLAnchorElement | undefined;
  let frame = 0;

  const update = (): void => {
    frame = 0;
    const link = links.get(sectionInView(sections).id);
    if (link === marked) return;
    marked?.removeAttribute("aria-current");
    link?.setAttribute("aria-current", CURRENT);
    marked = link;
    if (link !== undefined) keepInView(nav, link);
  };
  const request = (): void => {
    if (frame === 0) frame = requestAnimationFrame(update);
  };

  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  for (const link of links.values()) {
    link.addEventListener("click", () => history.replaceState(null, "", link.hash));
  }
  update();
}

function sectionInView(sections: readonly HTMLElement[]): HTMLElement {
  const root = document.documentElement;
  const last = sections[sections.length - 1];
  if (innerHeight + scrollY >= root.scrollHeight - END_SLACK_PX) return last;
  const line = innerHeight * READ_LINE;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top > line) break;
    current = section;
  }
  return current;
}

/** Scrolls the list, and only the list, so that the link shows in it. */
function keepInView(list: HTMLElement, link: HTMLElement): void {
  if (list.scrollHeight <= list.clientHeight) return;
  const listBox = list.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  if (linkBox.top < listBox.top + LINK_ROOM_PX) {
    list.scrollTop -= listBox.top + LINK_ROOM_PX - linkBox.top;
  } else if (linkBox.bottom > listBox.bottom - LINK_ROOM_PX) {
    list.scrollTop += linkBox.bottom - (listBox.bottom - LINK_ROOM_PX);
  }
}
