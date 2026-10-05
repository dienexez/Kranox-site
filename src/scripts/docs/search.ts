// The search of the docs. It filters the list at the side to the sections whose title or text holds every word that
// the user types. Enter opens the first section that is left, and Escape clears the field. Command K on a Mac, or
// Control K elsewhere, focuses the field from anywhere on the page.
import { queryRequired } from "../dom.ts";

const SELECTORS = {
  input: "[data-docs-search]",
  shortcut: "[data-docs-shortcut]",
  group: "[data-docs-group]",
  link: "[data-docs-link]",
  empty: "[data-docs-empty]",
} as const;

interface Entry {
  /** The item of the list that holds the link. The search hides the item. */
  item: HTMLElement;
  link: HTMLAnchorElement;
  /** The title and the text of the section, in the form that the search compares. */
  text: string;
}

export function startSearch(): void {
  const input = queryRequired<HTMLInputElement>(document, SELECTORS.input);
  const empty = queryRequired(document, SELECTORS.empty);
  const groups = [...document.querySelectorAll<HTMLElement>(SELECTORS.group)];
  const entries = [...document.querySelectorAll<HTMLAnchorElement>(SELECTORS.link)].map(toEntry);
  const shortcutKey = requiredData(input, "shortcutKey");

  const filter = (): void => {
    const words = normalize(input.value)
      .split(" ")
      .filter((word) => word !== "");
    for (const entry of entries) {
      entry.item.hidden = !words.every((word) => entry.text.includes(word));
    }
    for (const group of groups) {
      group.hidden = [...group.querySelectorAll<HTMLElement>("li")].every((item) => item.hidden);
    }
    empty.hidden = entries.some((entry) => !entry.item.hidden);
  };

  input.addEventListener("input", filter);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = entries.find((entry) => !entry.item.hidden);
      if (first === undefined) return;
      event.preventDefault();
      first.link.click();
    } else if (event.key === "Escape") {
      input.value = "";
      filter();
      input.blur();
    }
  });
  addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === shortcutKey) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
  if (!isApple()) {
    queryRequired(document, SELECTORS.shortcut).textContent = requiredData(input, "shortcutOther");
  }
}

function toEntry(link: HTMLAnchorElement): Entry {
  const item = link.closest("li");
  const section = document.getElementById(link.hash.slice(1));
  if (item === null || section === null) {
    throw new Error(`The docs link ${link.hash} needs an item of the list and a section.`);
  }
  return { item, link, text: normalize(section.textContent ?? "") };
}

/** Lowercase, with one space between words, so that the case and the line breaks of a text do not count. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function requiredData(element: HTMLElement, name: string): string {
  const value = element.dataset[name];
  if (value === undefined || value === "") {
    throw new Error(`The search field needs the attribute data-${name}.`);
  }
  return value;
}

/** A Mac, an iPhone, or an iPad shows the Command key. */
function isApple(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.userAgent);
}
