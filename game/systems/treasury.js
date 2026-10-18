/* The state's bank account. One rule for every naira the governor spends:
     1. pay from the bank (money the state has);
     2. if the bank runs out, borrow the rest, up to what lenders will carry;
     3. if lenders will carry no more, the state is broke and it does not happen.
   Each year, when the budget is settled, the year's revenue arrives. Salaries,
   running the offices and debt repayments (the budget's own lines) come off
   the top; the rest goes into the bank for the year's work. Money not spent
   stays in the bank. Units: ₦ billions, like the other state stats. */

const r2 = (x) => Math.round(x * 100) / 100;
export const DEBT_CAP = { easy: 2, medium: 1.6, hard: 1.3 }; // times a year's revenue

export const revenueB = (s) => Math.max(0, (s.igr || 0) + (s.faac || 0));
// What lenders will still lend: debt may reach DEBT_CAP × a year's revenue.
export const borrowRoomB = (s, level = "medium") => Math.max(0, r2(revenueB(s) * (DEBT_CAP[level] || 1.2) - (s.debt || 0)));

// Debt costs interest every year. Repayments come off the top of the year's money,
// before anything is left for work: at least the interest, the year's instalment on the
// debt the last government left (oldDueB), and a slice of any other debt.
export const DEBT_RATE = .08;
export const OTHER_PRINCIPAL = .06; // share of other debt repaid each year
// The year's money: what comes in, what salaries and offices take, what debt takes,
// and what is left in the bank for work. The budget's debt line can pay more than is due.
export const yearAccounts = (s, bud, { oldDueB = 0, oldLeftB = 0 } = {}) => {
  const tot = Object.values(bud || {}).reduce((a, b) => a + b, 0) || 100;
  const inB = r2(revenueB(s)), debt = Math.max(0, s.debt || 0);
  const runB = r2(inB * ((bud.salaries || 0) + (bud.administration || 0)) / tot);
  const interestB = r2(debt * DEBT_RATE);
  const dueB = r2(interestB + Math.min(oldLeftB, oldDueB) + Math.max(0, debt - oldLeftB) * OTHER_PRINCIPAL);
  const lineB = r2(inB * (bud.debt || 0) / tot);
  const debtB = r2(Math.min(debt + interestB, Math.max(dueB, lineB)));
  return { inB, runB, interestB, dueB, debtB, workB: r2(Math.max(0, inB - runB - debtB)), debtAfter: r2(Math.max(0, debt + interestB - debtB)) };
};

// The debt the last government left: about a year's revenue.
export const inheritedDebtB = (s) => Math.max(2, Math.round(revenueB(s) * 1.05 * 10) / 10);
/* How to deal with it. "now": pay what the bank holds today, spread the rest over 4 years.
   "four" / "eight": spread it all; eight years is lighter each year and costs more interest. */
export const oldDebtPlan = (kind, debtB, bankB = 0) => {
  const payNowB = kind === "now" ? r2(Math.min(bankB, debtB)) : 0, leftB = r2(debtB - payNowB), years = kind === "eight" ? 8 : 4;
  return { kind, payNowB, leftB, years, perYearB: r2(leftB / years) };
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

/* Money that commissioners bring in, or waste. A commissioner who delivers
   earns the state money their sector can really earn; one who misses every
   target wastes part of what their ministry was given. Amounts scale with the
   state's revenue. r is a seeded random function (0–1). Names are fictional. */
const WINDFALL = {
  agr: (who, a) => ({ icon: "🌾", head: "Agric exports", text: "Hon. " + who + "'s export push paid off: cooperatives shipped sesame, cashew and ginger abroad, and the state's levies and share came to " + a + "." }),
  hp: (who, a) => ({ icon: "💉", head: "Health grant", text: "The Meridian Health Foundation awarded " + a + " for polio and measles vaccination after Hon. " + who + "'s immunisation results." }),
  lit: (who, a) => ({ icon: "📚", head: "Education grant", text: "A basic-education partnership released " + a + " because Hon. " + who + "'s schools hit their enrolment and exam targets." }),
  infra: (who, a) => ({ icon: "🛣️", head: "Tolls and levies", text: "Tolls and property levies along roads Hon. " + who + "'s ministry finished brought in " + a + "." }),
  sec: (who, a) => ({ icon: "🛡️", head: "Markets reopened", text: "With Hon. " + who + "'s security plan holding, night markets reopened and market levies recovered by " + a + "." }),
  igr: (who, a) => ({ icon: "🧾", head: "Revenue drive", text: "Hon. " + who + "'s revenue drive collected " + a + " more than budgeted." }),
  any: (who, a) => ({ icon: "💼", head: "Savings returned", text: "Hon. " + who + "'s ministry delivered under budget and returned " + a + " to the treasury." }),
};
const fmtB = (b) => b >= 1 ? "₦" + (Math.round(b * 10) / 10) + "B" : "₦" + Math.round(b * 1000) + "M";
export const ministryWindfall = (m, revB, r) => {
  const amtB = Math.max(.1, r2(revB * (.025 + r() * .045)));
  const f = WINDFALL[m.key] || WINDFALL.any;
  return { ...f(m.minister, fmtB(amtB)), amtB, who: m.minister, ministry: m.name };
};
export const ministryWaste = (m, revB, r) => {
  const amtB = Math.max(.1, r2(revB * (.015 + r() * .03)));
  return { icon: "🕳️", head: "Money wasted", text: "The " + m.name + " ministry under Hon. " + m.minister + " missed every target: " + fmtB(amtB) + " of its money went on work that stalled and must be redone.", amtB: -amtB, who: m.minister, ministry: m.name };
};
