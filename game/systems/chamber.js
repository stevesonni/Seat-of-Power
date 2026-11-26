/* The chamber, seat by seat (owner, 26 Nov 2026: "In the House of Assembly… instead of it just being passed, let each
   circle light up green and the people against red, so you see it in real time. When the House is against you, you see
   the red in majority and green in minority. It all starts grey, and they call the vote and you see." Random order,
   3 to 4 seconds, tap to skip; abstentions stay grey; no party colours).
   Rules only: where each seat sits, and a count that always agrees with the result the game has already decided. */

const hash = (x) => { let h = 2166136261; for (const ch of String(x)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
const rnd = (seed) => { let a = hash(seed) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/* Seats on a semicircle, as a parliament diagram draws them: rows from the inside out, more seats on the longer outer
   rows. Returns [{ x, y }] in a box 0..1 wide and 0..0.5 high (y down), ordered left to right across the chamber, so
   the first seats are the left wing. */
export const seatLayout = (n) => {
  n = Math.max(1, Math.round(n || 1));
  const rows = n <= 12 ? 2 : n <= 30 ? 3 : n <= 50 ? 4 : n <= 90 ? 5 : n <= 160 ? 7 : n <= 260 ? 9 : 12;
  const r0 = .38, r1 = .95, radii = Array.from({ length: rows }, (_, i) => r0 + (r1 - r0) * (rows === 1 ? 1 : i / (rows - 1)));
  const tot = radii.reduce((a, b) => a + b, 0);
  const per = radii.map(r => Math.floor(n * r / tot)); let left = n - per.reduce((a, b) => a + b, 0);
  for (let i = rows - 1; left > 0; i = (i - 1 + rows) % rows) { per[i]++; left--; }
  const out = [];
  radii.forEach((r, i) => { const k = per[i]; for (let j = 0; j < k; j++) { const a = Math.PI * (k === 1 ? .5 : j / (k - 1)); out.push({ x: .5 - Math.cos(a) * r * .5, y: .5 - Math.sin(a) * r * .5, a }); } });
  return out.sort((p, q) => p.a - q.a || p.y - q.y).map(({ x, y }) => ({ x, y }));
};
// The dot size that fits: the seats on the outer row nearly touch.
export const seatRadius = (n) => Math.max(.006, Math.min(.042, .8 / Math.sqrt(Math.max(1, n)) / 4.2));

/* The count. seats; favour: the share expected to vote yes (0..1); passed: what the game decided; need: "majority"
   (more yes than no) or "two_thirds" (two-thirds of all members, as impeachment and a veto override need). A few may
   abstain. The count always agrees with passed. Returns { yes, no, abst }. */
export const voteSplit = ({ seats, favour = .5, passed, need = "majority", seed = "" }) => {
  const N = Math.max(1, Math.round(seats || 1)), r = rnd("split|" + seed + "|" + N);
  let abst = Math.min(Math.floor(N * .08), Math.floor(r() * 3)); // 0–2 sit it out
  let present = N - abst, yes = Math.round(present * Math.max(0, Math.min(1, favour)));
  const twoThirds = Math.ceil(N * 2 / 3);
  if (need === "two_thirds") {
    if (passed && yes < twoThirds) yes = Math.min(present, twoThirds + Math.floor(r() * 2));
    if (!passed && yes >= twoThirds) yes = twoThirds - 1 - Math.floor(r() * 3);
  } else {
    const no0 = present - yes;
    if (passed && yes <= no0) yes = Math.floor(present / 2) + 1 + Math.floor(r() * 2);
    if (!passed && yes > no0) yes = Math.floor((present - 1) / 2) - Math.floor(r() * 2);
  }
  yes = Math.max(0, Math.min(present, yes));
  return { yes, no: present - yes, abst };
};

/* Which seat votes how: the ayes on one side, the noes on the other (yes on the left when passed, so the winning
   colour sweeps in), the abstainers between; and the order they light up in, at random. */
export const seatVotes = ({ yes, no, abst }, seed = "") => {
  const v = [...Array(yes).fill("yes"), ...Array(abst).fill("abst"), ...Array(no).fill("no")];
  // A little mixing at the border, so the chamber looks like people, not a bar chart.
  const r = rnd("mix|" + seed); for (let i = 0; i < v.length * .12; i++) { const a = Math.floor(r() * v.length), b = Math.max(0, Math.min(v.length - 1, a + Math.round((r() - .5) * 6))); [v[a], v[b]] = [v[b], v[a]]; }
  const order = v.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { votes: v, order };
};
export const VOTE_MS = 3400; // the whole vote, first seat to last
