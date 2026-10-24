import { test } from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
import { seeded } from "../game/systems/rng.js";

test("every problem, motion and request teaches something that exists", () => {
  [...SYS.LGA_PROBLEMS, ...SYS.LGA_MOTIONS, ...SYS.GOV_ASKS].forEach(x => assert.ok(SYS.LGA_LEARN[x.learn], x.id + " → " + x.learn));
  ["lgas", "jaac", "supreme", "siec", "caretaker"].forEach(k => assert.ok(SYS.LGA_LEARN[k], k));
});
test("the governor's favour decides how much of the allocation arrives", () => {
  const hi = SYS.allocation({ gov: 80 }, seeded(1)), lo = SYS.allocation({ gov: 10 }, seeded(1));
  assert.ok(hi.deducted < lo.deducted && hi.net > lo.net);
  assert.equal(hi.gross, SYS.ALLOCATION_M); assert.equal(hi.net + hi.deducted + hi.salaries, hi.gross);
});
test("each half-year starts with the allocation and alternates council and governor", () => {
  const S = { seen: [], council: 60 };
  for (let n = 1; n <= SYS.LGA_HALVES; n++) { const a = SYS.lgaAgenda("s", n, S); assert.equal(a[0].k, "alloc"); assert.ok(a.some(x => x.k === "problem")); assert.equal(a.some(x => x.k === "motion"), n % 2 === 1); assert.equal(a.some(x => x.k === "gov"), n % 2 === 0); }
});
test("impeachment whispers only come when the council is unhappy", () => {
  for (let i = 0; i < 30; i++) assert.ok(!SYS.lgaAgenda("s" + i, 1, { seen: [], council: 80 }).some(x => x.id === "impeach"));
});
test("a governor you defied can deny you the ticket", () => {
  assert.equal(SYS.lgaElection({ people: 90, gov: 10, cor: 0 }, seeded(2)).ticket, false);
  assert.equal(SYS.lgaElection({ people: 70, gov: 60, cor: .1 }, seeded(2)).ticket, true);
});
test("grades run A to F", () => { assert.equal(SYS.lgaGrade(SYS.lgaScore({ people: 95, fixed: 12, cor: 0, purse: 200 })), "A"); assert.equal(SYS.lgaGrade(SYS.lgaScore({ people: 10, fixed: 0, cor: .8, purse: -50 })), "F"); });
test("every seed an option plants has a callback, and every callback teaches", () => {
  const seeds = new Set(); [...SYS.LGA_PROBLEMS, ...SYS.LGA_MOTIONS, ...SYS.GOV_ASKS, ...SYS.ALLOC_OPTS.map(o => ({ opts: [o] })), ...Object.values(SYS.LGA_CALLBACKS)].forEach(x => (x.opts || []).forEach(o => o.seed && seeds.add(o.seed)));
  [...seeds].forEach(k => assert.ok(SYS.LGA_CALLBACKS[k], "callback for " + k));
  Object.entries(SYS.LGA_CALLBACKS).forEach(([k, c]) => { assert.ok(SYS.LGA_LEARN[c.learn], k + " teaches"); assert.ok(c.opts.length >= 1); });
});
test("a planted seed comes back 1–3 half-years later, at the front of the queue, once", () => {
  let S = SYS.plant({ seed: "z", seen: [], council: 60 }, "land_given", 1);
  const due = S.seeds[0].due; assert.ok(due >= 2 && due <= 4);
  assert.equal(SYS.lgaTurn("z", due - 1, S)[0].k, "alloc");
  const q = SYS.lgaTurn("z", due, S); assert.deepEqual(q[0], { k: "callback", id: "land_given" });
  S = SYS.markFired(S, "land_given"); assert.ok(!SYS.lgaTurn("z", due + 1, S).some(x => x.k === "callback"));
});
test("the party chairman can deny or rescue the ticket", () => {
  assert.equal(SYS.lgaTicket({ gov: 60, npcs: { party: { rel: 10 } } }), false);
  assert.equal(SYS.lgaTicket({ gov: 10, npcs: { party: { rel: 80 } } }), true);
});
test("the record carries people and tags into the next office", () => {
  const S = { seed: 1, seeds: [{ key: "land_given", due: 3, at: 1 }, { key: "peace_made", due: 4, at: 2 }], npcs: { cllr: { name: "Hon. Bayo Ade", role: "Councillor", rel: 10 } } };
  const R = SYS.recordCareer(null, { office: "chairman", ending: "reelected", grade: "B", cor: .2, S, keepTags: ["land_given"] });
  assert.deepEqual(R.tags, ["land_given"]); assert.equal(SYS.formerEnemy(R, "senator").name, "Hon. Bayo Ade"); assert.equal(R.offices.length, 1);
});
