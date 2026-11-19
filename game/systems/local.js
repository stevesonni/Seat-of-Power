/* Neighbourhood jobs (pillar "local"): small things a governor can do in one local government, chosen on the map.
   They cost a little money, do not use the year's big moves, and lift that place's mood, so the map shows the
   player's hand. Six a year; each kind once per place per year. A job of the right kind eases an open problem
   there (one year more before it gets worse). Rules only, no React. */
export const LOCAL_PER_YEAR = 6;
export const LOCAL_JOBS = [
  { k: "road", icon: "🚧", l: "Patch the worst road", costB: .12, mood: 4, fx: { infra: .003 }, eases: "road", done: "The worst stretch in {L} is patched. Okadas and buses move again." },
  { k: "water", icon: "🚰", l: "Sink a borehole", costB: .15, mood: 5, fx: { hp: .002 }, eases: "water", done: "A new borehole in {L}. Women queue with buckets, laughing." },
  { k: "market", icon: "🛒", l: "Clean up and light the market", costB: .08, mood: 3, fx: { igr: .02 }, eases: null, done: "{L}'s market is swept, drained and lit. Traders stay open after dark." },
  { k: "school", icon: "🏫", l: "Fix a leaking school roof", costB: .1, mood: 3, fx: { lit: .002 }, eases: "school", done: "The school roof in {L} no longer leaks. Classes go on when it rains." },
  { k: "visit", icon: "📣", l: "Visit and listen", costB: 0, mood: 2, fx: {}, eases: null, done: "You walked {L}'s market and listened. People talk about it for days." },
];
/* This year's jobs so far: [{ lga, k }]. */
export const localUsed = (stc, turn) => ((stc && stc.local && stc.local.turn === turn) ? stc.local.done : []) || [];
export const localLeft = (stc, turn) => Math.max(0, LOCAL_PER_YEAR - localUsed(stc, turn).length);
/* Can this job be done here this year? { ok, why } */
export const localCan = (stc, turn, lga, k) => {
  if (!localLeft(stc, turn)) return { ok: false, why: "No more neighbourhood jobs this year" };
  if (localUsed(stc, turn).some(d => d.lga === lga && d.k === k)) return { ok: false, why: "Done here this year" };
  return { ok: true };
};
/* The place's own mood: the sum of what was done there (kept for the whole term). */
export const placeMood = (stc, lga) => ((stc && stc.lgaMood) || {})[lga] || 0;
/* Doing a job: the new stc fields, and the open problem it eases (if any). */
export const localDo = (stc, turn, lga, k, needs) => {
  const J = LOCAL_JOBS.find(j => j.k === k), used = localUsed(stc, turn);
  const lgaMood = { ...((stc && stc.lgaMood) || {}) }; lgaMood[lga] = Math.min(20, (lgaMood[lga] || 0) + J.mood);
  // A problem is eased once: a borehole buys a year, it does not put the water shortage off for ever.
  const eased = J.eases ? (needs || []).find(n => n.lga === lga && n.k === J.eases && n.status === "open" && !n.eased) : null;
  return { stc: { local: { turn, done: [...used, { lga, k }] }, lgaMood }, eased: eased ? eased.id : null, text: J.done.replace(/\{L\}/g, lga) };
};
