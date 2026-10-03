const hashSeed = (seed: number | string): number => {
  if (typeof seed === 'number') return seed >>> 0;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Returns a repeatable Mulberry32 generator for the supplied seed. */
export const seededRandom = (seed: number | string): (() => number) => {
  let state = hashSeed(seed);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

/** A deterministic value that does not depend on call order. */
export const seededValue = (seed: number | string, index: number): number => seededRandom(`${String(seed)}:${index}`)();
