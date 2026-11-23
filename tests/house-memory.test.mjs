// The House remembers (owner, 23 Nov 2026): the second-term Speaker, the plot against a friendly Speaker, two Speakers,
// and a hostile Speaker's impeachment at the slightest approval dip.
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../game/systems/legislature.js";

test("house memory: the record decides who the new House puts up", () => {
  let r = {}; ["kept", "paid", "deal"].forEach(k => { r = L.houseNote(r, k); });
  assert.equal(L.houseKind(r), "loyalist");
  let b = {}; ["broke", "refused", "late"].forEach(k => { b = L.houseNote(b, k); });
  assert.equal(L.houseKind(b), "avenger");
  let o = {}; ["overheads", "overheads", "kept"].forEach(k => { o = L.houseNote(o, k); });
  assert.equal(L.houseKind(o), "reformer");
  assert.equal(L.houseKind({}), "dealer");
  assert.equal(L.houseKind(r, { gfFreed: true }), "godfather");
});

test("house memory: a landslide brings your members back; a tribunal win thins them", () => {
  assert.ok(L.newHouseLoyal(24, { margin: 15 }) > L.newHouseLoyal(24, { margin: 1 }));
  assert.ok(L.newHouseLoyal(24, { margin: 5, wonInCourt: true }) < L.newHouseLoyal(24, { margin: 5 }));
});

test("house memory: an avenger usually takes the chair; your loyalist is never hostile", () => {
  let avengers = 0; for (let i = 0; i < 60; i++) { const R = L.speakerRace2(i, { kind: "avenger", oldFriendly: true, backed: null, ratio: .45 }); if (R.winner === "new") { avengers++; assert.equal(R.hostile, true); } }
  assert.ok(avengers > 30, avengers);
  for (let i = 0; i < 30; i++) assert.equal(L.speakerRace2(i, { kind: "loyalist", oldFriendly: true, backed: "new" }).hostile, false);
});

test("house memory: a hostile Speaker impeaches at the slightest dip, unless his price was met", () => {
  assert.equal(L.speakerImpeaches({ hostile: true, dealThisYear: false, app: 54, appMark: 55 }), true);
  assert.equal(L.speakerImpeaches({ hostile: true, dealThisYear: true, app: 40, appMark: 55 }), false);
  assert.equal(L.speakerImpeaches({ hostile: true, dealThisYear: false, app: 56, appMark: 55 }), false);
  assert.equal(L.speakerImpeaches({ hostile: false, dealThisYear: false, app: 30, appMark: 55 }), false);
  assert.equal(L.speakerImpeaches({ hostile: true, dealThisYear: false, app: 70, appMark: 75 }), false); // too popular to touch
});

test("house memory: a plot needs a reason, and money troubles make it likelier", () => {
  assert.equal(L.speakerPlot(1, 2, {}).p, 0);
  const P = L.speakerPlot(1, 2, { arrears: 3, cor: .5, gfFreed: true });
  assert.deepEqual(P.why, ["money", "gf", "scandal"]);
  assert.ok(P.p > L.speakerPlot(1, 2, { arrears: 3 }).p);
  const rel = L.PLOT_MOVES.find(m => m.id === "release");
  assert.ok(L.plotOdds(rel, { why: ["money"] }) > L.plotOdds(rel, { why: ["gf"] }));
  assert.ok(["ours", "theirs"].includes(L.splitRuling(3, 6, .5)));
});
