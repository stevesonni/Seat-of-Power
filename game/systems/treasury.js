/* The state's bank account. One rule for every naira the governor spends:
     1. pay from the bank (money the state has);
     2. if the bank runs out, borrow the rest, up to what lenders will carry;
     3. if lenders will carry no more, the state is broke and it does not happen.
   Each year, when the budget is settled, the year's revenue arrives. Salaries,
   running the offices and debt repayments (the budget's own lines) come off
   the top; the rest goes into the bank for the year's work. Money not spent
   stays in the bank. Units: ₦ billions, like the other state stats. */

const r2 = (x) => Math.round(x * 100) / 100;
export const DEBT_CAP = { easy: 1.5, medium: 1.2, hard: 1 }; // times a year's revenue

export const revenueB = (s) => Math.max(0, (s.igr || 0) + (s.faac || 0));
// What lenders will still lend: debt may reach DEBT_CAP × a year's revenue.
export const borrowRoomB = (s, level = "medium") => Math.max(0, r2(revenueB(s) * (DEBT_CAP[level] || 1.2) - (s.debt || 0)));

// The year's money: what comes in, what the budget's running lines take, what is left for work.
export const yearAccounts = (s, bud) => {
  const tot = Object.values(bud || {}).reduce((a, b) => a + b, 0) || 100;
  const runShare = ((bud.salaries || 0) + (bud.administration || 0) + (bud.debt || 0)) / tot;
  const inB = r2(revenueB(s));
  const runB = r2(inB * runShare);
  return { inB, runB, workB: r2(Math.max(0, inB - runB)) };
};

/* Pay costB. Returns { ok, s, fromBankB, borrowedB, short }.
   force: an obligation the state cannot refuse (wages owed, running costs):
   borrowed even past the lenders' limit. */
export const pay = (s, costB, { level = "medium", force = false } = {}) => {
  const cost = r2(Math.max(0, costB || 0)), cash = Math.max(0, s.cash || 0);
  if (!cost) return { ok: true, s, fromBankB: 0, borrowedB: 0 };
  const fromBankB = r2(Math.min(cash, cost)), need = r2(cost - fromBankB);
  if (!need) return { ok: true, s: { ...s, cash: r2(cash - cost) }, fromBankB, borrowedB: 0 };
  if (!force && need > borrowRoomB(s, level)) return { ok: false, s, fromBankB: 0, borrowedB: 0, short: need };
  return { ok: true, s: { ...s, cash: r2(cash - fromBankB), debt: r2((s.debt || 0) + need) }, fromBankB, borrowedB: need };
};

// Where a cost would come from, before you commit: "bank", "loan" or "broke".
export const payFrom = (s, costB, level = "medium") => {
  const cost = Math.max(0, costB || 0), cash = Math.max(0, s.cash || 0);
  if (cost <= cash) return "bank";
  return cost - cash <= borrowRoomB(s, level) ? "loan" : "broke";
};
