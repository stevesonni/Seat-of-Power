import { test } from "node:test";
import assert from "node:assert/strict";
import { impeachCheck, indictRoll, tribunalOutcome, triggerOf, INDICT_ODDS } from "../game/systems/impeach.js";

// The President's impeachment: a fight the record starts (owner's brief, October 2026).
const ok = { turn: 3, cor: .2, nass: 60, strikeStage: 0, strikeYears: 0, worstFront: 50, defied: false, app: 55, pStab: 60 };
test("only the record starts a case: graft with a crossed Senate, a paralysed nation, defiance, collapse", () => {
  assert.equal(impeachCheck(ok), null);
  assert.equal(impeachCheck({ ...ok, cor: .55, nass: 30 }), "graft");
  assert.equal(impeachCheck({ ...ok, cor: .55, nass: 60 }), null, "graft alone, with a friendly Senate, is not enough");
  assert.equal(impeachCheck({ ...ok, strikeStage: 2, strikeYears: 1 }), "anarchy");
  assert.equal(impeachCheck({ ...ok, worstFront: 90 }), "anarchy");
  assert.equal(impeachCheck({ ...ok, defied: true }), "defiance");
  assert.equal(impeachCheck({ ...ok, app: 25, pStab: 30 }), "collapse");
  assert.equal(impeachCheck({ ...ok, defied: true }, { last: 2 }), null, "not again within three years");
  assert.equal(impeachCheck({ ...ok, defied: true }, { active: true }), null);
  assert.equal(impeachCheck(ok, { whistle: 3, exposed: true }), "exposed", "a bribe can come out");
  assert.ok(triggerOf("exposed").charge);
});
test("the vote: 50% standing, 20% with a scapegoat, 0% with a bribe", () => {
  assert.deepEqual([INDICT_ODDS.stand, INDICT_ODDS.scapegoat, INDICT_ODDS.bribe], [.5, .2, 0]);
  assert.equal(indictRoll("bribe", () => 0), false);
  assert.equal(indictRoll("stand", () => .49), true); assert.equal(indictRoll("stand", () => .51), false);
});
test("the tribunal: the deal costs the ports, the lawyer is as good as you chose, the guard needs the army", () => {
  const d = tribunalOutcome("deal"); assert.ok(d.acquit && d.ports);
  assert.ok(tribunalOutcome("defence", { ag: { perf: 85 } }, () => .5).acquit);
  assert.ok(!tribunalOutcome("defence", { ag: { perf: 40 } }, () => .5).acquit);
  assert.ok(!tribunalOutcome("defence", { ag: null }, () => .5).acquit);
  const g1 = tribunalOutcome("guard", { army: 80 }); assert.ok(g1.acquit && g1.emergency);
  const g2 = tribunalOutcome("guard", { army: 40 }); assert.ok(!g2.acquit && g2.coup);
});
