// Shows the marked parts of the page when the user reaches them. A component marks a part with data-reveal:
//   "words"  a heading whose words fly together from above and from below
//   "lines"  a text whose lines rise one after the other
//   "rise"   a block that rises as a whole
//   "lift"   a large block that rises a short way, as soon as the part around it comes into view
// A part with data-highlight is a text whose letters light up one after the other while the user scrolls.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DURATIONS, EASES, STAGGER } from "./settings.ts";

gsap.registerPlugin(ScrollTrigger, SplitText);

type RevealKind = "words" | "lines" | "rise" | "lift";

const REVEAL = {
  /** A part starts when its top comes into the viewport. */
  start: "top bottom",
  /** The words wait at these places, in percent of their height, one place after the other. */
  wordOffsets: [-150, 75, -75, 150],
  /** The words start this share of the common stagger one after the other, in a random order. */
  wordStaggerShare: 0.25,
  /** A line waits this far below its place, in percent of its height. */
  lineOffset: 250,
  lineStaggerShare: 0.5,
  /** A block waits this far below its place, in percent of its height. */
  blockOffset: 100,
  /**
   * A large block waits this far below its place, in pixels, and starts when the top of its parent comes this far
   * into the viewport. An offset in percent of a tall block would hold it back until it reached the upper part of
   * the screen, and the screen would stay empty until then. The parent carries no offset, so it marks the true
   * place of the block.
   */
  liftOffsetPx: 48,
  liftStart: "top 92%",
} as const;

const HIGHLIGHT = {
  /** A letter that waits keeps this share of its ink. */
  waitingOpacity: 0.1,
  /** The letters take their ink between these two scroll positions. */
  start: "top 75%",
  end: "bottom 50%",
} as const;

// The styles give a piece of a split text its own box.
const SPLIT_CLASSES = { word: "split-word", line: "split-line", char: "split-char" } as const;

/** The split of each text into words and letters. A text that flies in and lights up shares one split. */
const splits = new WeakMap<HTMLElement, SplitText>();

/**
 * Splits a text into words, and each word into letters. A second split of the same text would undo the
 * first one, so every caller takes the split from here. The words stay text for assistive technology.
 */
function splitWords(element: HTMLElement): SplitText {
  const known = splits.get(element);
  if (known !== undefined) return known;
  const split = SplitText.create(element, {
    type: "words,chars",
    wordsClass: SPLIT_CLASSES.word,
    charsClass: SPLIT_CLASSES.char,
    aria: "none",
  });
  splits.set(element, split);
  return split;
}

/** Runs an animation one time, when the part comes into the viewport. */
function playOnEnter(element: HTMLElement, play: () => void): void {
  ScrollTrigger.create({ trigger: element, start: REVEAL.start, once: true, onEnter: play });
}

function revealWords(element: HTMLElement): void {
  const { words } = splitWords(element);
  gsap.set(words, { yPercent: gsap.utils.wrap([...REVEAL.wordOffsets]), scale: 0, opacity: 0 });
  playOnEnter(element, () => {
    gsap.to(words, {
      yPercent: 0,
      scale: 1,
      opacity: 1,
      duration: DURATIONS.long,
      ease: EASES.out,
      stagger: { each: STAGGER * REVEAL.wordStaggerShare, from: "random" },
    });
  });
}

function revealLines(element: HTMLElement): void {
  SplitText.create(element, {
    type: "lines",
    linesClass: SPLIT_CLASSES.line,
    aria: "none",
    // The lines change when the width or the font changes. The plugin splits again and keeps the progress.
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: REVEAL.lineOffset,
        opacity: 0,
        duration: DURATIONS.long,
        ease: EASES.out,
        stagger: STAGGER * REVEAL.lineStaggerShare,
        scrollTrigger: { trigger: element, start: REVEAL.start, once: true },
      }),
  });
}

function revealBlock(element: HTMLElement): void {
  gsap.set(element, { yPercent: REVEAL.blockOffset, opacity: 0 });
  playOnEnter(element, () => {
    gsap.to(element, { yPercent: 0, opacity: 1, duration: DURATIONS.long, ease: EASES.out });
  });
}

function revealLift(element: HTMLElement): void {
  gsap.set(element, { y: REVEAL.liftOffsetPx, opacity: 0 });
  ScrollTrigger.create({
    trigger: element.parentElement ?? element,
    start: REVEAL.liftStart,
    once: true,
    onEnter: () => {
      gsap.to(element, { y: 0, opacity: 1, duration: DURATIONS.long, ease: EASES.out });
    },
  });
}

const REVEALS: Record<RevealKind, (element: HTMLElement) => void> = {
  words: revealWords,
  lines: revealLines,
  rise: revealBlock,
  lift: revealLift,
};

function isRevealKind(kind: string | undefined): kind is RevealKind {
  return kind !== undefined && kind in REVEALS;
}

/** Prepares every marked part. The part then shows when the user reaches it. */
export function revealParts(): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
    const kind = element.dataset.reveal;
    if (!isRevealKind(kind)) {
      throw new Error(`The attribute data-reveal does not know the kind "${kind}".`);
    }
    REVEALS[kind](element);
  }
}

/** Lets the letters of each marked text take their ink one after the other while the user scrolls through the text. */
export function highlightTexts(): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-highlight]")) {
    const { chars } = splitWords(element);
    gsap
      .timeline({ scrollTrigger: { trigger: element, start: HIGHLIGHT.start, end: HIGHLIGHT.end, scrub: true } })
      .from(chars, { opacity: HIGHLIGHT.waitingOpacity, duration: DURATIONS.short, ease: EASES.out, stagger: STAGGER });
  }
}
