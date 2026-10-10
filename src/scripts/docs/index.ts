// The scripts of the docs page. Each module holds one job:
//   ../section-list.ts  the list at the side marks the section in view, and a link to a section changes the address
//   search.ts           the search filters the list at the side
//   clipboard.ts        the copy buttons
// The page moves like the downloads page: the smooth scroll, a link to a section that scrolls there, the parts that
// show when the user reaches them, and the footer of the home page.
import { initPageMotion } from "../motion/index.ts";
import { followSections } from "../section-list.ts";
import { startCopyButtons } from "./clipboard.ts";
import { startSearch } from "./search.ts";

// The side list and the sections of the docs, as DocsSidebar.astro and DocsSection.astro mark them.
const DOCS_SECTIONS = {
  nav: "[data-docs-nav]",
  link: "[data-docs-link]",
  section: "[data-docs-section]",
} as const;

export function initDocs(): void {
  initPageMotion();
  followSections(DOCS_SECTIONS);
  startSearch();
  startCopyButtons();
}
