import { test } from "node:test";
import assert from "node:assert/strict";
import { successorKind, surviveOdds, legacyAfter, finishesAfterTerm, SUCC_KINDS } from "../game/systems/index.js";

test("who follows you, from the succession", () => {
  assert.equal(successorKind(null), "rival", "nobody anointed yet");
  assert.equal(successorKind({ kind: "deputy", loyal: .85, won: true }), "heir");
  assert.equal(successorKind({ kind: "cabinet", loyal: .8, won: true }), "heir");
  assert.equal(successorKind({ kind: "technocrat", loyal: .55, won: true }), "technocrat");
  assert.equal(successorKind({ kind: "deputy", loyal: .85, won: true, betrayed: true }), "rival", "a betrayal makes a rival");
  assert.equal(successorKind({ kind: "deputy", won: false }), "opposition", "your candidate lost");
  assert.equal(successorKind({ kind: "opposition", won: true }), "opposition");
});
test("a project's odds of surviving you", () => {
  const p = { id: "p1", status: "in_progress", progress: 40, quality: .8 };
  const heir = surviveOdds(p, { kind: "heir" }), opp = surviveOdds(p, { kind: "opposition" });
  assert.ok(heir > opp + .4, "an heir finishes far more than the opposition");
  assert.ok(surviveOdds({ ...p, progress: 80 }, { kind: "rival" }) >= .7, "nearly done survives even a rival");
  assert.ok(surviveOdds(p, { kind: "rival", handover: "full" }) > surviveOdds(p, { kind: "rival", handover: "none" }));
  assert.ok(surviveOdds(p, { kind: "rival", pledged: "p1" }) > surviveOdds(p, { kind: "rival" }));
  assert.ok(surviveOdds(p, { kind: "technocrat" }) > surviveOdds({ ...p, quality: .4 }, { kind: "technocrat" }), "a technocrat scraps poor work");
  assert.equal(surviveOdds({ status: "delivered" }, {}), 1);
  assert.equal(finishesAfterTerm(7, 3, 8), true); assert.equal(finishesAfterTerm(6, 3, 8), false);
});
test("five years later", () => {
  const projects = [{ id: "a", title: "The Ifo road", status: "in_progress", progress: 90, quality: .8 }, { id: "b", title: "The stadium", status: "stalled", progress: 10, quality: .4 }, { id: "c", title: "Done already", status: "delivered" }];
  const peace = { ne: { step: 4, closed: 5, after: "kept" }, se: { step: 2, relapses: 0 } };
  const L = legacyAfter(projects, peace, { kind: "heir", name: "Bisi", pledged: "b" }, () => .5);
  assert.equal(L.rows.length, 2, "only what was unfinished");
  assert.deepEqual(L.rows.map(x => x.finished), [true, true], "an heir with a pledge finishes both");
  assert.match(L.rows[0].text, /Bisi finished it and cut the ribbon in your name/);
  assert.equal(L.peace.find(x => x.front === "ne").held, true);
  const O = legacyAfter(projects, peace, { kind: "opposition", name: "Musa", pledged: "b" }, () => .5);
  assert.equal(O.rows.find(x => x.id === "b").finished, false);
  assert.equal(O.rows.find(x => x.id === "b").broke, true);
  assert.ok(O.pledgeBroken);
  assert.equal(Object.keys(SUCC_KINDS).length, 4);
});
