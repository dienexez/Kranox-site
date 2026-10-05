// A helper for the scripts of the page that look up an element.

/** Returns the first element in the parent that matches the selector. A page without that element has a fault. */
export function queryRequired<T extends Element = HTMLElement>(parent: ParentNode, selector: string): T {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`The page needs an element that matches "${selector}".`);
  }
  return element;
}
