/* "It comes back": the consequence engine shared by every career (rules
   only, no React). A notable choice plants a SEED; a few turns later the
   seed comes due and the career's callback table turns it into a card
   with a named person, which can plant new seeds. Named PEOPLE carry a
   relationship (0–100) that options move. The PLAYER RECORD carries a
   life across offices: what you did, who you met, how it ended. */
import { seeded } from "./rng.js";

const cl = (v) => Math.max(0, Math.min(100, Math.round(v)));

/* Plant a seed: it comes due between delay[0] and delay[1] turns from n. */
export const plant = (S, key, n, data = {}, delay = [1, 3]) => {
  const r = seeded(S.seed || 1, "plant", key, n);
  const due = n + delay[0] + Math.floor(r() * (delay[1] - delay[0] + 1));
  return { ...S, seeds: [...(S.seeds || []).filter(x => x.key !== key), { key, due, at: n, data, fired: false }] };
};
/* Seeds whose time has come, oldest first. */
export const dueSeeds = (S, n) => (S.seeds || []).filter(x => !x.fired && x.due <= n).sort((a, b) => a.at - b.at);
export const markFired = (S, key) => ({ ...S, seeds: (S.seeds || []).map(x => x.key === key ? { ...x, fired: true } : x) });
export const hasSeed = (S, key) => (S.seeds || []).some(x => x.key === key);

/* Named people live in S.npcs: { id: { name, role, rel } }. */
export const moveRel = (S, deltas = {}) => ({ ...S, npcs: Object.fromEntries(Object.entries(S.npcs || {}).map(([k, p]) => [k, { ...p, rel: cl(p.rel + (deltas[k] || 0)) }])) });
export const mood = (rel) => rel >= 65 ? "pleased" : rel < 35 ? "angry" : "neutral";
export const relWord = (rel) => rel >= 80 ? "a firm ally" : rel >= 65 ? "on your side" : rel >= 45 ? "watching you" : rel >= 25 ? "cold" : "your enemy";

/* Put due callbacks at the front of a turn's queue. table: { key: card }. */
export const withCallbacks = (S, n, items, table) => [...dueSeeds(S, n).filter(x => table[x.key]).map(x => ({ k: "callback", id: x.key })), ...items];

/* ── The Player Record: one life across offices ── */
export const RECORD_KEY = "sop_record";
export const emptyRecord = () => ({ v: 1, offices: [], tags: [], people: [], lifetimeCor: 0 });
/* At the end of a career: what happened, the seeds still alive or fired
   (as tags the next office can call back), and the people met. */
export const recordCareer = (rec, { office, ending, grade, cor, S, keepTags = [] }) => {
  const R = rec || emptyRecord();
  const tags = [...new Set([...(R.tags || []), ...(S.seeds || []).map(x => x.key).filter(k => keepTags.includes(k))])].slice(-40);
  const people = [...(R.people || []).filter(p => p.office !== office), ...Object.entries(S.npcs || {}).map(([id, p]) => ({ id, name: p.name, role: p.role, rel: p.rel, office }))].slice(-30);
  const n = (R.offices || []).length;
  return { ...R, offices: [...(R.offices || []), { office, ending, grade, at: Date.now() }].slice(-30), tags, people, lifetimeCor: Math.round(((R.lifetimeCor || 0) * n + (cor || 0) * 100) / (n + 1)) };
};
/* Enemies and allies from earlier offices, for the next one to call back. */
export const formerEnemy = (rec, office) => (rec && rec.people || []).filter(p => p.office !== office && p.rel < 35).slice(-1)[0] || null;
export const formerAlly = (rec, office) => (rec && rec.people || []).filter(p => p.office !== office && p.rel >= 70).slice(-1)[0] || null;
