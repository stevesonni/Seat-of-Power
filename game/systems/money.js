/* Money: one internal unit for every record the game keeps.

   Records (loans, project budgets, allocations, payments) are kept in whole
   naira millions (integers), so sums never drift (0.1 + 0.2 problems, the
   ₦0.03bn ghost loan). The older parts of the simulation still hold their
   running totals in ₦ billions as decimals (state stats like s.debt, s.igr);
   they meet these records only through toB / toM, rounded once at the edge. */

export const toM = (b) => Math.round((Number(b) || 0) * 1000); // ₦ billions → whole ₦ millions
export const toB = (m) => (Math.round(Number(m) || 0)) / 1000; // ₦ millions → ₦ billions

// "₦850M", "₦1.2B", "₦15B": the right unit for the size, never mixed in sums.
export const fmtM = (m) => {
  const v = Math.round(Number(m) || 0), a = Math.abs(v), sg = v < 0 ? "−" : "";
  if (a < 1000) return sg + "₦" + a + "M";
  const b = a / 1000;
  return sg + "₦" + (b >= 10 ? Math.round(b * 10) / 10 : Math.round(b * 100) / 100) + "B";
};
export const fmtB = (b) => fmtM(toM(b));

/* ── Personal campaign loans (from the godfather) ──
   A loan exists only when the player accepts one. Each acceptance has a
   key, so pressing the same button twice records it once. These are the
   candidate's personal debts, never the state's. */
export const addLoan = (loans, { key, lender = "godfather", amountM, reason, at = 0 }) => {
  const list = Array.isArray(loans) ? loans : [];
  const amt = Math.round(Number(amountM) || 0);
  if (!key || amt <= 0 || list.some(l => l.key === key)) return list;
  return [...list, { key, lender, amountM: amt, reason: reason || "", at }];
};
export const loanTotalM = (loans, lender) => (Array.isArray(loans) ? loans : [])
  .filter(l => !lender || l.lender === lender).reduce((a, l) => a + (l.amountM || 0), 0);

/* Saves made before the loan record existed hold only a decimal total, and
   that total could include the ghost amounts that patronage moves added
   (0.01–0.03 each, a few per campaign, always under ₦0.2B in all). Every
   real loan was a multiple of ₦0.2B (1.0, 0.8, 0.6, 2.0), so the real part
   is the total rounded down to ₦0.2B. Nothing is invented: a save with no
   real loan comes back with none. */
export const migrateCampaignLoans = (setup) => {
  if (!setup || Array.isArray(setup.gfLoans)) return setup;
  const old = Number(setup.gfDebt) || 0;
  const realM = Math.floor((toM(old) + 1) / 200) * 200;
  const gfLoans = realM > 0 ? [{ key: "migrated", lender: "godfather", amountM: realM, reason: "Campaign loan (from an earlier save)", at: 0 }] : [];
  return { ...setup, gfLoans, gfDebt: toB(realM), loanMigratedFrom: old !== toB(realM) ? old : undefined };
};
