import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("six pillars, each on or off at random, completed and overridable", () => {
  assert.deepEqual(SYS.PILLAR_IDS, ["front", "wait", "money", "integrity", "plan", "region"]);
  const a = SYS.assignPillars(() => .2), b = SYS.assignPillars(() => .8);
  assert.ok(Object.values(a).every(v => v === true) && Object.values(b).every(v => v === false));
  assert.deepEqual(Object.keys(SYS.completeAssignment({ front: true }, () => .9)), SYS.PILLAR_IDS, "an older assignment gets the new pillars");
  assert.equal(SYS.completeAssignment({ front: true }, () => .9).front, true, "and keeps its own");
  assert.ok(Object.values(SYS.parseExpOverride("all")).every(Boolean)); assert.ok(Object.values(SYS.parseExpOverride("none")).every(v => !v));
  const o = SYS.parseExpOverride("front:1,money:0", { ...SYS.assignPillars(() => .9), money: true });
  assert.equal(o.front, true); assert.equal(o.money, false); assert.equal(o.wait, false);
  assert.equal(SYS.parseExpOverride("nonsense"), null);
});

test("the dashboard compares the two groups on early quits, finished terms and shared cards", () => {
  const S = { ev: { exp_money: { players: { a: 1, b: 1, c: 1, d: 1 }, values: { on: { p: { a: 1, b: 1 } }, off: { p: { c: 1, d: 1 } } } },
    ending: { players: { a: 1 } }, lga_end: { players: { b: 1 } }, card_share: { players: { a: 1 } } },
    play: { a: { s: 1200 }, b: { s: 400 }, c: { s: 100 }, d: { s: 90 } } };
  const X = SYS.experimentSummary(S).find(x => x.id === "money");
  assert.deepEqual(X.on, { players: 2, timed: 2, earlyPct: 0, finishedPct: 100, sharedPct: 50 });
  assert.deepEqual(X.off, { players: 2, timed: 2, earlyPct: 100, finishedPct: 0, sharedPct: 0 });
  assert.equal(SYS.experimentSummary({}).length, 6, "no data yet: six empty rows, no crash");
});
