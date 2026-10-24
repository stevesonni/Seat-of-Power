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
