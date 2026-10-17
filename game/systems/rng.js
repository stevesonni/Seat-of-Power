/* Seeded randomness. Every chance roll that decides a stored outcome takes
   its seed from stable ids (the game's seed, a case id, a year, a step), so
   reloading a save or refreshing the page replays the same result instead
   of rolling again. */
export const hashStr = (s) => { let h = 2166136261; const t = String(s); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const seeded = (...parts) => {
  let x = hashStr(parts.join("|")) || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
};
export const pickW = (r, weights) => { // weights: { key: weight }
  const tot = Object.values(weights).reduce((a, b) => a + Math.max(0, b), 0) || 1;
  let x = r() * tot;
  for (const [k, w] of Object.entries(weights)) { x -= Math.max(0, w); if (x <= 0) return k; }
  return Object.keys(weights)[0];
};
