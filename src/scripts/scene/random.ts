// Random numbers for the drawings of the scenes. The same seed gives the same numbers, so a drawing is the
// same on each visit, and a flock or a volley can differ from round to round by its seed.

/** Gives a number from 0 to 1 at each call. */
export type Random = () => number;

/** Gives random numbers from a seed, with the generator "mulberry32". */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Gives a random number between the two values. */
export function between(random: Random, min: number, max: number): number {
  return min + (max - min) * random();
}
