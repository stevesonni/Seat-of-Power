import { test } from "node:test";
import assert from "node:assert/strict";
import { pay, payFrom, yearAccounts, borrowRoomB } from "../game/systems/treasury.js";

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
  const s = { ...S, cash: 0, debt: 22 };
  assert.ok(borrowRoomB(s) < 1);
  const r = pay(s, 2);
  assert.equal(r.ok, false); assert.equal(r.s, s); assert.equal(payFrom(s, 2), "broke");
  assert.equal(pay(s, 2, { force: true }).s.debt, 24, "obligations are still met");
});
test("the year's work money is revenue less the budget's running lines", () => {
  const a = yearAccounts(S, { salaries: 18, administration: 7, debt: 8, health: 15, education: 15, security: 11, infrastructure: 16, agriculture: 10 });
  assert.equal(a.inB, 18.7); assert.equal(a.runB, 6.17); assert.equal(a.workB, 12.53);
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
