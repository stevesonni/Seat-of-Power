import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
import { assessLoan } from "../game/systems/loans.js";

test("GDP: Nigeria at ₦372.8 trillion; Lagos first; published states keep their figures; all 36 ranked", () => {
  assert.equal(SYS.startGdpTn("Nigeria"), 372.8);
  assert.equal(SYS.gdpRank("Lagos"), 1); assert.equal(SYS.gdpRank("Rivers"), 2);
  assert.equal(SYS.STATE_GDP_2021.Kano, 4.2); assert.equal(SYS.gdpEstimated("Kano"), false); assert.equal(SYS.gdpEstimated("Ogun"), true);
  const ranks = Object.keys(SYS.STATE_GDP_2021).map(SYS.gdpRank).sort((a, b) => a - b);
  assert.equal(ranks.length, 36); assert.equal(ranks[35], 36);
  const sum = Object.keys(SYS.STATE_GDP_2021).reduce((a, s) => a + SYS.startGdpTn(s), 0) + SYS.startGdpTn("FCT");
  assert.ok(sum < 372.8 * 1.001 && sum > 372.8 * .95, "the states and the FCT add up to about the national figure (" + sum + ")");
  assert.ok(SYS.startGdpTn("Lagos") > SYS.startGdpTn("Yobe") * 20);
});
test("GDP moves with the game's economy, and prints in trillions or billions", () => {
  const g = SYS.startGdpTn("Ogun");
  assert.equal(SYS.gdpNowTn("Ogun", 110, 100), g * 1.1); assert.equal(SYS.gdpNowTn("Ogun", 0, 100), g);
  assert.equal(SYS.fmtTn(10.66), "₦10.7 trillion"); assert.equal(SYS.fmtTn(.85), "₦850 billion");
});
test("six sector cards, in measures people know", () => {
  const c = SYS.sectorCards({ edu: 50, health: 50, infra: 50, sec: 50, econ: 50 }, { popM: 6, crops: ["cocoa", "cassava"] });
  assert.equal(c.length, 6);
  assert.ok(c.every(x => x.rows && x.rows.length && x.moves));
  assert.ok(JSON.stringify(c).includes("cocoa"));
});
test("credit rating: low debt and clean books rate high; defaults and arrears pull it down", () => {
  const good = SYS.creditRating({ debtB: 20, revB: 100, cor: .1 }), bad = SYS.creditRating({ debtB: 400, revB: 50, arrears: 3, defaults: 2, cor: .7, budgetLate: true });
  assert.ok(SYS.GRADES.indexOf(good.grade) < SYS.GRADES.indexOf(bad.grade), good.grade + " vs " + bad.grade);
  assert.ok(SYS.investmentGrade(good.grade)); assert.ok(!SYS.investmentGrade(bad.grade));
  assert.ok(bad.why.length > 0);
  assert.ok(SYS.ratingRateAdj("AA") < 0 && SYS.ratingRateAdj("CCC") > 0 && SYS.ratingRateAdj("BBB") === 0);
  assert.deepEqual(SYS.creditRating({ debtB: 20, revB: 100 }), SYS.creditRating({ debtB: 20, revB: 100 }), "the same books, the same grade");
});
test("loans: a bond needs BBB or better; the grade prices the interest", () => {
  const ctx = { debtM: 5000, revenueM: 20000, cor: .3, fgRelation: 60, eia: true, revenueIgrM: 8000 };
  const bb = assessLoan("bond", { projectId: "p1", amountM: 2000, year: 2 }, { ...ctx, grade: "BB", ratingAdj: .02 });
  assert.ok(bb.reasons.some(r => /BBB or better/.test(r))); assert.equal(bb.ok, false);
  const a = assessLoan("bank", { projectId: "p1", amountM: 2000, year: 2 }, { ...ctx, grade: "A", ratingAdj: -.02 });
  const c = assessLoan("bank", { projectId: "p1", amountM: 2000, year: 2 }, { ...ctx, grade: "CCC", ratingAdj: .07 });
  if (a.offer && c.offer) assert.ok(a.offer.rate < c.offer.rate);
  assert.ok(a.reasons.some(r => /Credit rating: A\./.test(r)));
});
test("industries come from what the state grows and digs, and ask who owns them", () => {
  const og = SYS.industriesFor("Ogun"), ids = og.map(x => x.id);
  assert.ok(ids.includes("ind_cement") && ids.some(i => /cassava|cocoa/.test(i)), ids.join());
  assert.ok(og.length <= 4);
  assert.ok(SYS.industriesFor("Nassarawa").some(x => x.id === "ind_lithium"));
  assert.deepEqual(SYS.industriesFor("Nigeria"), []);
  for (const st of Object.keys(SYS.STATE_GDP_2021)) for (const p of SYS.industriesFor(st)) {
    assert.ok(["agriculture", "infrastructure"].includes(p.s), st + " " + p.id);
    assert.ok(p.local && p.local.head && p.local.why, "the question card has its heading: " + p.id);
    assert.deepEqual(p.ask.opts.map(o => o.id), ["state", "ppp", "private"]);
    assert.ok(!/dearer/i.test(JSON.stringify(p)));
  }
});
test("Nigeria is rated on the global scale: B at the start, as S&P and Fitch rate it", () => {
  const n = SYS.creditRating({ debtB: 20, revB: 100, cor: .3, sovereign: true });
  assert.ok(["BB", "B"].includes(n.grade), n.grade);
  assert.ok(!SYS.investmentGrade(SYS.creditRating({ debtB: 140000, revB: 30000, cor: .4, sovereign: true }).grade));
});
