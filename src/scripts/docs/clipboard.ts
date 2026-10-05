// The copy buttons of the docs. A click puts the value of the button on the clipboard, and the button shows for a
// moment whether that worked: CopyButton.astro shows the label of the state, "Copied" or "Copy failed".
import { queryRequired } from "../dom.ts";

const BUTTON = "[data-copy]";
const LABEL = "[data-copy-label]";

// The button shows the outcome of a click this long, then turns back.
const OUTCOME_MS = 1600;

type CopyState = "idle" | "copied" | "failed";

// The attribute of the button that holds the label of each state, as the dataset names it.
const LABEL_KEYS: Record<CopyState, string> = { idle: "labelIdle", copied: "labelCopied", failed: "labelFailed" };

export function startCopyButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(BUTTON)) {
    let timer = 0;
    button.addEventListener("click", () => {
      window.clearTimeout(timer);
      void copy(button).then((state) => {
        show(button, state);
        timer = window.setTimeout(() => show(button, "idle"), OUTCOME_MS);
      });
    });
  }
}

async function copy(button: HTMLButtonElement): Promise<CopyState> {
  try {
    await navigator.clipboard.writeText(dataOf(button, "copy"));
    return "copied";
  } catch (error) {
    console.error("The browser did not copy the value.", error);
    return "failed";
  }
}

/** Gives the button the look and the label of a state. Assistive technology reads the new label. */
function show(button: HTMLButtonElement, state: CopyState): void {
  button.dataset.state = state;
  queryRequired(button, LABEL).textContent = dataOf(button, LABEL_KEYS[state]);
}

function dataOf(button: HTMLButtonElement, key: string): string {
  const value = button.dataset[key];
  if (value === undefined) {
    throw new Error(`A copy button needs the data attribute "${key}".`);
  }
  return value;
}
