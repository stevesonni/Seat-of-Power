import { test } from "node:test";
import assert from "node:assert/strict";
import { pay, payFrom, yearAccounts, borrowRoomB, oldDebtPlan } from "../game/systems/treasury.js";

const S = { igr: 8.5, faac: 10.2, debt: 0, cash: 5 };
test("money in the bank is spent first; nothing is borrowed while it lasts", () => {
  const r = pay(S, 3);
  assert.equal(r.ok, true); assert.equal(r.s.cash, 2); assert.equal(r.s.debt, 0); assert.equal(r.borrowedB, 0);
  assert.equal(payFrom(S, 3), "bank");
});
test("only the shortfall is borrowed when the bank runs out", () => {
  const r = pay(S, 8);
  assert.equal(r.s.cash, 0); assert.equal(r.s.debt, 3); assert.equal(r.fromBankB, 5); assert.equal(r.borrowedB, 3);
  assert.equal(payFrom(S, 8), "loan");
});
test("past what lenders will carry, the state is broke and nothing is paid", () => {
  const s = { ...S, cash: 0, debt: 30 };
  assert.ok(borrowRoomB(s) < 1);
  const r = pay(s, 2);
  assert.equal(r.ok, false); assert.equal(r.s, s); assert.equal(payFrom(s, 2), "broke");
  assert.equal(pay(s, 2, { force: true }).s.debt, 32, "obligations are still met");
});
const BUD = { salaries: 18, administration: 7, debt: 8, health: 15, education: 15, security: 11, infrastructure: 16, agriculture: 10 };
test("with no debt, the work money is revenue less salaries and offices", () => {
  const a = yearAccounts(S, BUD);
  assert.equal(a.inB, 18.7); assert.equal(a.runB, 4.68); assert.equal(a.debtB, 0); assert.equal(a.workB, 14.02);
});
test("debt costs interest, and repayments come off the top before work money", () => {
  const s = { ...S, debt: 20 };
  const plan = oldDebtPlan("four", 20);
  const a = yearAccounts(s, BUD, { oldDueB: plan.perYearB, oldLeftB: plan.leftB });
  assert.equal(a.interestB, 1.6); assert.equal(a.dueB, 6.6); assert.equal(a.debtB, 6.6);
  assert.equal(a.workB, 7.42); assert.equal(a.debtAfter, 15);
  const b = yearAccounts(s, BUD, { oldDueB: oldDebtPlan("eight", 20).perYearB, oldLeftB: 20 });
  assert.ok(b.workB > a.workB, "spreading over eight years leaves more each year");
});
test("paying the old debt now uses the bank and spreads only the rest", () => {
  const p = oldDebtPlan("now", 19.6, 10);
  assert.equal(p.payNowB, 10); assert.equal(p.leftB, 9.6); assert.equal(p.perYearB, 2.4);
});
test("a harder level lets you borrow less", () => {
  assert.ok(borrowRoomB(S, "hard") < borrowRoomB(S, "easy"));
});
import { ministryWindfall, ministryWaste } from "../game/systems/treasury.js";
test("a commissioner who delivers brings in money their sector can earn, scaled to revenue", () => {
  const r = () => .5;
  const w = ministryWindfall({ key: "agr", minister: "Ada Okon", name: "Agriculture" }, 20, r);
  assert.ok(w.amtB > .5 && w.amtB < 2); assert.match(w.text, /Ada Okon/); assert.match(w.text, /export/);
  assert.match(ministryWindfall({ key: "hp", minister: "B", name: "Health" }, 20, r).text, /vaccination/);
  const x = ministryWaste({ key: "infra", minister: "C", name: "Works" }, 20, r);
  assert.ok(x.amtB < 0); assert.match(x.text, /missed every target/);
});
