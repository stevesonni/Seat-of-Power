import { test } from "node:test";
import assert from "node:assert/strict";
import { toM, toB, fmtM, addLoan, loanTotalM, migrateCampaignLoans } from "../game/systems/money.js";

test("declining every loan leaves no godfather debt", () => {
  assert.equal(loanTotalM([], "godfather"), 0);
});
test("an accepted loan is recorded once, at the agreed amount", () => {
  let l = addLoan([], { key: "campaign", amountM: toM(0.8), reason: "x" });
  l = addLoan(l, { key: "campaign", amountM: toM(0.8), reason: "x" }); // double click
  assert.equal(l.length, 1);
  assert.equal(loanTotalM(l), 800);
  assert.equal(toB(loanTotalM(l)), 0.8);
});
test("separate loans add up exactly", () => {
  let l = addLoan([], { key: "ticket", amountM: 1000 });
  l = addLoan(l, { key: "bailout", amountM: 600 });
  l = addLoan(l, { key: "petition0", amountM: 2000 });
  assert.equal(loanTotalM(l), 3600);
});
test("zero or negative amounts never create a loan", () => {
  assert.equal(addLoan([], { key: "a", amountM: 0 }).length, 0);
  assert.equal(addLoan([], { key: "a", amountM: -5 }).length, 0);
});
test("old saves: ghost patronage amounts are dropped, real loans kept", () => {
  assert.deepEqual(migrateCampaignLoans({ gfDebt: 0.03 }).gfLoans, []);
  assert.equal(migrateCampaignLoans({ gfDebt: 0.03 }).gfDebt, 0);
  assert.equal(migrateCampaignLoans({ gfDebt: 0.83 }).gfDebt, 0.8);
  assert.equal(migrateCampaignLoans({ gfDebt: 1.8 + 0.09 }).gfDebt, 1.8);
  assert.equal(migrateCampaignLoans({ gfDebt: 0 }).gfLoans.length, 0);
  const keep = { gfLoans: [{ key: "ticket", amountM: 1000 }], gfDebt: 1 };
  assert.equal(migrateCampaignLoans(keep), keep); // already migrated: untouched
});
test("money formats in one unit", () => {
  assert.equal(fmtM(850), "₦850M");
  assert.equal(fmtM(1200), "₦1.2B");
  assert.equal(fmtM(15000), "₦15B");
  assert.equal(toM(0.1 + 0.2), 300);
});
