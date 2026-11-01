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
  assert.deepEqual(X.on, { players: 2, timed: 2, earlyPct: 0, finishedPct: 100, fullPct: 0, endedEarlyPct: 100, sharedPct: 50 });
  assert.deepEqual(X.off, { players: 2, timed: 2, earlyPct: 100, finishedPct: 0, fullPct: 0, endedEarlyPct: 0, sharedPct: 0 });
  assert.equal(SYS.experimentSummary({}).length, 6, "no data yet: six empty rows, no crash");
});

test("a full term is told apart from an early ending, and the front door is judged on first-timers", () => {
  const S = { ev: {
      exp_front: { values: { on: { p: { a: 1, b: 1, c: 1 } }, off: { p: { d: 1, e: 1 } } } },
      ending: { players: { a: 1, d: 1 }, values: { "Served two terms": { p: { a: 1 } }, Impeached: { p: { d: 1 } } } },
      lga_end: { players: { b: 1, e: 1 }, values: { dissolved: { p: { b: 1 } }, reelected: { p: { e: 1 } } } },
      amb_end: { players: { c: 1 }, values: { promoted: { p: { c: 1 } } } },
      first_visit: { players: { a: 1, d: 1 } } },
    play: { a: { s: 900 }, b: { s: 900 }, c: { s: 900 }, d: { s: 120 }, e: { s: 900 } } };
  const F = SYS.experimentSummary(S).find(x => x.id === "front");
  assert.equal(F.on.finishedPct, 100); assert.equal(F.on.fullPct, 66.7); assert.equal(F.on.endedEarlyPct, 33.3);
  assert.equal(F.off.fullPct, 50); assert.equal(F.off.endedEarlyPct, 50);
  assert.equal(F.onNew.players, 1); assert.equal(F.onNew.fullPct, 100);
  assert.equal(F.offNew.players, 1); assert.equal(F.offNew.earlyPct, 100); assert.equal(F.offNew.endedEarlyPct, 100);
  assert.equal(SYS.experimentSummary(S).find(x => x.id === "money").onNew, undefined, "only the front door has first-timer rows");
  // Every ending the game sends is classed.
  ["Served two terms", "Stepped down", "Voted out", "Ran for President"].forEach(v => assert.ok(SYS.FULL_TERM.ending.includes(v)));
  assert.ok(!SYS.FULL_TERM.ending.includes("Impeached") && !SYS.FULL_TERM.lga_end.includes("dissolved") && !SYS.FULL_TERM.amb_end.includes("expelled"));
});
