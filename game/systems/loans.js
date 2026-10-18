/* Borrowing for a project: application → assessment → offer → acceptance
   → disbursement → servicing.

   Applying creates no debt. The lender's assessment is seeded from the
   project and lender (rng.js), so asking again after a reload gets the
   same answer. An offer states the amount, rate, years and yearly payment
   before you accept. Only acceptance disburses, once per offer key. */
import { seeded } from "./rng.js";
import { fmtM } from "./money.js";

export const LENDERS = {
  bank: { nm: "Commercial bank loan", lender: "A syndicate of three commercial banks", rate: .22, years: 4, base: .9 },
  bond: { nm: "State bond", lender: "Investors, via the SEC and the DMO", rate: .15, years: 7, base: .8, minIgrM: 3000 },
  dfi: { nm: "AfDB / World Bank loan", lender: "The African Development Bank and World Bank", rate: .05, years: 15, base: .85 },
  pre: { nm: "Contractor pre-financing", lender: "The contractor", rate: .3, years: 3, base: 1 },
};
export const annualServiceM = (principalM, rate, years) => Math.round(principalM / years + principalM * rate * .6); // average over the life of the loan
export const totalRepayM = (principalM, rate, years) => annualServiceM(principalM, rate, years) * years;

// ctx: { debtM, revenueM, cor (0–1), fgRelation (0–100), eia, rateCut }
export const assessLoan = (lenderId, { projectId, amountM, year }, ctx) => {
  const L = LENDERS[lenderId]; if (!L) return { ok: false, reasons: ["No such lender."] };
  const dsr = (ctx.debtM * .08) / Math.max(1, ctx.revenueM), reasons = [];
  let p = L.base;
  if (lenderId !== "pre") { p -= Math.max(0, dsr - .2) * 1.8; reasons.push((dsr < .3 ? "✓" : "✗") + " Debt service takes " + Math.round(dsr * 100) + "% of revenue."); }
  if (lenderId !== "pre" && ctx.cor > .4) { p -= (ctx.cor - .4) * 1.5; reasons.push("✗ Your corruption record makes them nervous."); }
  if (lenderId === "bond" && ctx.revenueIgrM < L.minIgrM) { p = 0; reasons.push("✗ Own revenue is below " + fmtM(L.minIgrM) + "; a bond cannot be rated."); }
  if (lenderId === "dfi" && ctx.fgRelation < 45) { p -= .35; reasons.push("✗ Abuja will not sign the federal guarantee."); }
  if (lenderId === "dfi" && ctx.eia === false) { p -= .25; reasons.push("✗ No environmental assessment: safeguards fail."); }
  const ok = seeded("loan", projectId, lenderId)() < Math.max(.03, Math.min(.97, p));
  if (!ok) return { ok: false, odds: p, reasons };
  const rate = Math.max(.02, L.rate - (ctx.rateCut || 0) + Math.max(0, ctx.cor - .35) * .1);
  const amt = Math.round(amountM);
  return { ok: true, odds: p, reasons, offer: { key: "loan:" + projectId + ":" + lenderId, lenderId, lender: L.lender, nm: L.nm, principalM: amt, rate: Math.round(rate * 1000) / 1000, years: L.years,
    serviceM: annualServiceM(amt, rate, L.years), repayM: totalRepayM(amt, rate, L.years), conditions: lenderId === "dfi" ? "Disbursed against verified milestones; safeguard reviews." : lenderId === "pre" ? "Repaid from the state's FAAC; the contractor keeps the margin." : "Repaid by deduction from FAAC.", year } };
};

// Accepting: the only moment debt is created. Same key twice → recorded once.
export const acceptOffer = (loans, offer, year) => (loans || []).some(l => l.key === offer.key) ? loans
  : [...(loans || []), { ...offer, disbursedYear: year, outstandingM: offer.principalM }];

// Each year: principal falls by principal/years; returns the year's payment.
export const serviceLoans = (loans, year) => {
  let paid = 0;
  const next = (loans || []).map(l => {
    if (l.outstandingM <= 0 || year <= l.disbursedYear || l.servicedYear >= year) return l;
    const princ = Math.min(l.outstandingM, Math.round(l.principalM / l.years));
    const interest = Math.round(l.outstandingM * l.rate);
    paid += princ + interest;
    return { ...l, outstandingM: l.outstandingM - princ, servicedYear: year, paidM: (l.paidM || 0) + princ + interest };
  });
  return { loans: next, paidM: paid };
};
