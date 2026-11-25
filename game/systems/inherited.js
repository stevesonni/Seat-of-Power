/* The budget you inherit (owner, 25 Nov 2026: "there shouldn't be a first budget submitted: either finish the budget your
   predecessor left, and the next year you submit yours. You can make amendments to the budget too… not a lesson, too many
   technical words… the President inherits one too"). The year runs January to December; you are sworn in on 29 May,
   so this year's budget is already law. Keep it, or change part of it with a supplementary budget the House (or both
   chambers of the National Assembly) must pass. Your own budget comes next year. Rules only, no React. */
import { seeded } from "./rng.js";

export const SUPP_LIMIT = 20; // a supplementary budget moves at most this many of every 100 naira

/* Your predecessor's habits, and the budget they made. */
export const PREDECESSORS = {
  election: { nm: "an election-year budget", bud: { salaries: 16, debt: 6, administration: 11, health: 11, education: 11, security: 11, infrastructure: 25, agriculture: 9 },
    lines: ["It was written to win an election: roads and contracts first, schools and clinics last.", "Some of the roads in it are in places that voted the right way."] },
  spender: { nm: "a big spender's budget", bud: { salaries: 23, debt: 4, administration: 13, health: 13, education: 13, security: 10, infrastructure: 15, agriculture: 9 },
    lines: ["It pays everyone and saves nothing: wages and offices take a big share.", "Very little is set aside for debts, so the lenders will be calling."] },
  hopeful: { nm: "a hopeful budget", bud: { salaries: 17, debt: 8, administration: 8, health: 15, education: 15, security: 11, infrastructure: 16, agriculture: 10 },
    lines: ["The plan is sensible, but it counts on money that will not all come in.", "Expect some of it to stay on paper."] },
};
export const predecessorBudget = (seed, nat = false) => {
  const ks = Object.keys(PREDECESSORS), k = ks[Math.floor(seeded(seed, "pred_budget")() * ks.length)], P = PREDECESSORS[k];
  return { kind: k, nm: P.nm, bud: { ...P.bud }, lines: P.lines.map(l => nat ? l.replace("schools and clinics", "the universities and hospitals") : l) };
};
// How much a change moves, out of 100: half the sum of the differences (what leaves one line lands in another).
export const movedOf = (a = {}, b = {}) => Math.round(Object.keys({ ...a, ...b }).reduce((t, k) => t + Math.abs((a[k] || 0) - (b[k] || 0)), 0) / 2);
export const suppOk = (from, to) => movedOf(from, to) <= SUPP_LIMIT;
