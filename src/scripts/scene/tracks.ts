// Turns the tracks of a scene into animations. A track follows the scroll.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASES } from "../motion/settings.ts";
import type { EaseName, LayerState, Track } from "./types.ts";

gsap.registerPlugin(ScrollTrigger);

const EASE_NAMES: Record<EaseName, string> = { none: "none", in: EASES.in, out: EASES.out, inOut: EASES.inOut };

/** Gives the values that a track ends on, for the width of the screen. */
function trackTarget(track: Track, isWide: boolean): Partial<LayerState> {
  return { ...track.to, ...(isWide ? {} : track.narrowTo) };
}

/**
 * Puts a layer at the end of a track at once. A scene that does not move shows this state: a picture that
 * the scroll would develop is there, and a curtain that the scroll would open is open.
 */
export function applyTrackEnd(state: LayerState, track: Track, isWide: boolean): void {
  Object.assign(state, trackTarget(track, isWide));
}

/** Lets a layer follow the scroll while the canvas of its scene crosses the viewport. */
export function addTrack(canvas: HTMLCanvasElement, state: LayerState, track: Track, isWide: boolean): void {
  gsap.to(state, {
    ...trackTarget(track, isWide),
    ease: EASE_NAMES[track.ease ?? "none"],
    scrollTrigger: {
      trigger: canvas,
      start: track.start,
      end: track.end,
      scrub: true,
    },
  });
}
