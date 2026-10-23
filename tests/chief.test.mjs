import { test } from "node:test";
import assert from "node:assert/strict";
import { COS_ROSTER, cosById, cosOdds, cosHint, delegate, letterKind, cosFinishProject, SEALS } from "../game/systems/chief.js";

const tech = cosById("technocrat"), fixer = cosById("fixer");
test("four fictional Chiefs of Staff, each with a seal-able speciality", () => {
  assert.equal(COS_ROSTER.length, 4);
  COS_ROSTER.forEach(c => [...c.good, ...c.bad].forEach(k => assert.ok(SEALS[k], k)));
});
test("every letter kind has a seal; the agenda and the budget need the governor most", () => {
  ["flagship", "budget", "gold", "shock", "godfather", "house_bill", "media", "stall:p1", "desk:0", "sc#crisis_flood", "sc#lg_x"].forEach(k => assert.ok(SEALS[letterKind(k)[0]], k));
  assert.deepEqual(letterKind("flagship"), ["agenda", 3]);
  assert.deepEqual(letterKind("budget"), ["budget", 3]);
});
test("who you appoint decides what is safe to delegate", () => {
  assert.ok(cosOdds(tech, "budget", 3) > cosOdds(fixer, "budget", 3));
  assert.ok(cosOdds(fixer, "party", 2) > cosOdds(tech, "party", 2));
  assert.ok(cosOdds(tech, "press", 1) > cosOdds(tech, "crisis", 3), "routine letters are safer than crises");
  assert.match(cosHint(fixer, "budget", 3), /needs you/);
});
test("a botched serious letter costs approval now and comes back next year", () => {
  const r = delegate(fixer, "budget", 3, "the budget", () => .99);
  assert.equal(r.ok, false); assert.ok(r.fx.app < 0); assert.ok(r.later && r.later.fx.app < 0);
  const ok = delegate(tech, "press", 1, "a press request", () => .01);
  assert.equal(ok.ok, true); assert.equal(ok.later, null);
});
test("a greedy Chief of Staff can put a friend in the deal", () => {
  const seq = [.01, .01]; let i = 0;
  const r = delegate(fixer, "party", 2, "the ward chairmen", () => seq[i++]);
  assert.equal(r.crooked, true); assert.ok(r.fx.cor > 0);
});
test("a stubborn project handed over is finished at a premium, or half the money is lost", () => {
  const p = { estimateM: 1000, builtM: 600, spentM: 600, approvedM: 600, status: "stalled", decisions: [] };
  const won = cosFinishProject(tech, p, 3, () => .01);
  assert.equal(won.ok, true); assert.equal(won.p.status, "delivered"); assert.equal(won.p.progress, 100); assert.ok(won.costM > 400);
  const lost = cosFinishProject(fixer, p, 3, () => .99);
  assert.equal(lost.ok, false); assert.equal(lost.p.status, "stalled"); assert.ok(lost.costM < won.costM);
});
