import { test } from "node:test";
import assert from "node:assert/strict";
import { scheduleLoan, drawTranche, nextTrancheM, undrawnM, skipCostM, lenderWatch, loanLine, imfApply, imfApprove, imfReview, imfDrag, imfCanRepay, imfOn, imfActive, IMF_TRANCHES, TRANCHE_RULES, roundtable, startStrike } from "../game/systems/index.js";

const offer = (lenderId, principalM = 9000) => ({ key: "loan:p1:" + lenderId, lenderId, lender: "x", nm: "x", principalM, rate: .2, years: 4, serviceM: 1, repayM: 1 });
test("accepting a loan draws only the first tranche; debt is only what is drawn", () => {
  const L = scheduleLoan(offer("bank"), "p1", 2);
  assert.equal(L.tranches, 3); assert.equal(L.drawn, 1); assert.equal(L.drawnM, 3000); assert.equal(L.outstandingM, 3000); assert.equal(undrawnM(L), 6000);
  const R = drawTranche(L, 3); assert.equal(R.m, 3000); assert.equal(R.L.drawn, 2); assert.equal(R.L.outstandingM, 6000);
  const R2 = drawTranche(R.L, 4); assert.equal(R2.m, 3000); assert.equal(undrawnM(R2.L), 0); assert.equal(nextTrancheM(R2.L), 0);
  assert.equal(drawTranche(R2.L, 5).m, 0, "nothing left to draw");
  assert.equal(TRANCHE_RULES.bond.n, 4); assert.equal(TRANCHE_RULES.dfi.n, 4);
});
test("the last tranche takes what is left, never more", () => {
  let L = scheduleLoan(offer("dfi", 1001), "p1", 1); let total = L.drawnM;
  while (nextTrancheM(L)) { const R = drawTranche(L, 1); total += R.m; L = R.L; }
  assert.equal(total, 1001);
});
test("contractor pre-financing: no debt now, the whole bill at handover", () => {
  const L = scheduleLoan(offer("pre"), "p1", 2);
  assert.ok(L.pre); assert.equal(L.outstandingM, 0); assert.equal(L.drawnM, 0); assert.ok(L.billM > 9000);
  assert.match(loanLine(L), /due at handover/);
});
test("not signing costs a penalty on the undrawn money plus the idle crew", () => {
  const L = scheduleLoan(offer("bank"), "p1", 2);
  assert.equal(skipCostM(L, 2000), Math.round(6000 * .02 + 2000 * .05));
});
test("the lender's watch: attacks and strikes stop the money at once; insecurity warns, then suspends; it lifts when cleared", () => {
  const L = scheduleLoan(offer("bank"), "p1", 2);
  assert.equal(lenderWatch(L, { attack: true, year: 3 }).act, "hold");
  assert.equal(lenderWatch(L, { strike: true, year: 3 }).act, "hold");
  assert.equal(lenderWatch(L, { fled: true, year: 3 }).act, "hold");
  const w = lenderWatch(L, { insecure: true, year: 3 }); assert.equal(w.act, "warn");
  const s = lenderWatch(w.L, { insecure: true, year: 4 }); assert.equal(s.act, "suspend"); assert.ok(s.L.suspended);
  assert.equal(lenderWatch(s.L, { insecure: true, year: 5 }).act, "suspend", "still suspended while it lasts");
  const l = lenderWatch(s.L, { year: 5 }); assert.equal(l.act, "lift"); assert.equal(l.L.suspended, null);
  assert.equal(lenderWatch(w.L, { insecure: true, peace: true, year: 4 }).act, "ok", "a closed Peace Plan reassures them");
  assert.equal(lenderWatch(L, { cor: .6, year: 3 }).act, "ok", "a bank does not mind corruption");
  assert.equal(lenderWatch(scheduleLoan(offer("dfi"), "p1", 2), { cor: .6, year: 3 }).act, "warn", "the development banks do");
});
test("the IMF: apply, approve, reviews release tranches or cut the rating, repay", () => {
  let I = imfApply(3, 2000); assert.equal(I.stage, "applied"); assert.ok(imfOn(I)); assert.ok(!imfActive(I));
  I = imfApprove(I, 3, 500); assert.equal(I.stage, "active"); assert.equal(I.drawn, 1); assert.equal(I.outstandingB, I.trancheB);
  const ok = imfReview(I, { debtB: 540 }, 4); assert.ok(ok.pass); assert.equal(ok.tranche, I.trancheB); assert.equal(ok.I.drawn, 2);
  const bad = imfReview(ok.I, { printed: true, debtB: 540 }, 5); assert.ok(!bad.pass); assert.equal(bad.tranche, 0); assert.equal(bad.I.rating, -1); assert.match(bad.misses[0], /printed/);
  assert.ok(!imfReview(ok.I, { debtB: 700 }, 5).pass, "borrowing past the ceiling fails");
  const third = imfReview(ok.I, { debtB: 560 }, 5); assert.equal(third.I.drawn, IMF_TRANCHES);
  assert.equal(imfReview(third.I, { debtB: 560 }, 6).tranche, 0, "never more than three tranches");
  assert.ok(!imfCanRepay(third.I, third.I.outstandingB - 1)); assert.ok(imfCanRepay(third.I, third.I.outstandingB));
  assert.equal(imfDrag(I, 4).app, -3); assert.ok(imfDrag(I, 5).probe);
});
test("under the IMF ceiling the roundtable cannot print money", () => {
  const st = startStrike("nlc", "imf", 3);
  assert.ok(roundtable(st, { nat: true, turn: 3, rev: 2000 }).options.some(o => o.id === "print"));
  assert.ok(!roundtable(st, { nat: true, turn: 3, rev: 2000, noPrint: true }).options.some(o => o.id === "print"));
});
