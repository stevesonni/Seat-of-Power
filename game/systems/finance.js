/* Project finance that is not a lump of cash (owner, October 2026).

   A project loan is a schedule of tranches. Accepting an offer releases the
   first tranche only; every later tranche comes as a letter from the lender
   at the year's end, and you sign it (the money is drawn and becomes debt)
   or you don't (a penalty, and no work that year). Debt exists only for the
   money drawn. The lender watches the site: an attack on it, insecurity
   around it, a strike that shuts it or a contractor who fled stop the money;
   insecurity first brings a warning, then a suspension at the next review.
   Contractor pre-financing has no tranches: the whole bill falls due at
   handover, and refusing it ends in a court order to pay.

   The IMF (the President's last resort) is one programme with a life of its
   own: applying brings the NLC and the students out; approval needs prior
   actions (float the naira, end the fuel subsidy, a borrowing ceiling, VAT);
   the money comes in tranches after yearly reviews; every year under it costs
   approval and prices; paying it back early ends the conditions.
   Rules only, no React. */


// How each lender pays out (the governor's names; the President's in PRES_NAMES).
export const TRANCHE_RULES = {
  bank: { n: 3, letter: "payment order", from: "The syndicate's relationship manager", who: "bank-relationship-manager", seal: "bank",
    ask: (k, n) => "Tranche " + k + " of " + n + " is ready. We have sent you the payment order for the next section; it needs your signature." },
  bond: { n: 4, letter: "escrow drawdown", from: "The bond trustee", who: "bond-trustee", seal: "bond",
    ask: (k, n) => "Drawdown " + k + " of " + n + " from the bond's escrow account is ready for the next stage of work. The coupon is due either way." },
  dfi: { n: 4, letter: "mission report", from: "The AfDB / World Bank task team leader", who: "mission-leader", seal: "dfi",
    ask: (k, n) => "Our supervision mission visited the site and verified the progress. We are ready to release tranche " + k + " of " + n + " on your countersignature." },
  pre: { n: 0, letter: "handover bill", from: "The contractor", who: "contractor", seal: "contractor" },
};
// The President borrows from different people, with the same rules.
export const PRES_NAMES = {
  bank: { nm: "Treasury bills and FGN bonds", from: "The Debt Management Office", who: "finance-minister", seal: "bank" },
  bond: { nm: "Eurobond", from: "The Eurobond's paying agent in London", who: "bond-trustee", seal: "bond" },
  dfi: { nm: "World Bank / African Development Bank loan", from: "The World Bank country director", who: "mission-leader", seal: "dfi" },
  pre: { nm: "China Exim Bank loan", from: "The Export-Import Bank of China", who: "exim-banker", seal: "exim" },
};
export const PENALTY_PCT = .02;   // of the money still undrawn, when you do not sign
export const STANDBY_PCT = .05;   // of the year's share of the work: the contractor's idle crew
export const PRE_COURT_COST = .05; // legal costs on top, when the court orders you to pay the contractor

/* A loan as a schedule. offer: from SYS.assessLoan. → the loan record, with the
   first tranche drawn (or nothing drawn for contractor pre-financing). */
export const scheduleLoan = (offer, projId, year) => {
  const R = TRANCHE_RULES[offer.lenderId] || TRANCHE_RULES.bank, n = R.n;
  if (!n) return { ...offer, projId, tranches: 0, drawn: 0, trancheM: 0, drawnM: 0, disbursedYear: year, outstandingM: 0, pre: true, billM: Math.round(offer.principalM * (1 + offer.rate * offer.years * .6)) };
  const trancheM = Math.round(offer.principalM / n);
  return { ...offer, projId, tranches: n, drawn: 1, trancheM, drawnM: trancheM, disbursedYear: year, outstandingM: trancheM, lastDraw: year };
};
// The money a loan still has to give.
export const undrawnM = (L) => !L || L.pre ? 0 : Math.max(0, L.principalM - (L.drawnM || 0));
export const nextTrancheM = (L) => !L || L.pre ? 0 : (L.drawn + 1 >= L.tranches ? undrawnM(L) : Math.min(undrawnM(L), L.trancheM));
// Sign the next tranche: drawn, and debt from today.
export const drawTranche = (L, year) => { const m = nextTrancheM(L); if (!m) return { L, m: 0 };
  return { L: { ...L, drawn: L.drawn + 1, drawnM: (L.drawnM || 0) + m, outstandingM: (L.outstandingM || 0) + m, lastDraw: year, warned: L.warned }, m }; };
// Not signing this year: the penalty and the contractor's standby bill.
export const skipCostM = (L, yearShareM) => Math.round(undrawnM(L) * PENALTY_PCT + Math.max(0, yearShareM || 0) * STANDBY_PCT);

/* The lender's watch over the site. sig: what the game sees this year —
   { attack (armed men on the site, or engineers kidnapped), insecure (a crisis
   in the area: sit-at-home, bandits, insurgents), strike (the workers who build
   it are out), fled (the contractor took the fee and ran), cor (0–1),
   peace (the state's Peace Plan closed) }.
   → { act: "ok" | "warn" | "suspend" | "hold" | "lift", why } and the loan's new watch state. */
export const lenderWatch = (L, sig = {}) => {
  if (!L || L.pre) return { act: "ok", L };
  const why = sig.attack ? "armed men attacked the site" : sig.fled ? "the contractor left the site with the mobilisation fee" : sig.strike ? "the site is shut by the strike" : null;
  if (why) return { act: "hold", why, L: { ...L, suspended: { why, at: sig.year } } }; // the money stops at once
  const risky = sig.insecure && !sig.peace ? "insecurity around the site" : (L.lenderId === "dfi" && sig.cor > .5) ? "the integrity checks failed" : null;
  if (risky) {
    if (L.suspended) return { act: "suspend", why: L.suspended.why, L };
    if (L.warned) return { act: "suspend", why: risky, L: { ...L, suspended: { why: risky, at: sig.year } } };
    return { act: "warn", why: risky, L: { ...L, warned: sig.year } };
  }
  if (L.suspended) return { act: "lift", why: L.suspended.why, L: { ...L, suspended: null, warned: null } };
  return { act: "ok", L: L.warned ? { ...L, warned: null } : L };
};
// A loan's line for the Projects screen.
export const loanLine = (L) => !L ? "" : L.pre ? "Contractor pre-financing: " + Math.round((L.billM || 0) / 100) / 10 + "B due at handover"
  : "Tranche " + L.drawn + " of " + L.tranches + " drawn" + (L.suspended ? " · suspended: " + L.suspended.why : L.warned ? " · the lender has warned you" : "");

/* ── The IMF programme (the President) ── */
export const IMF_TRANCHES = 3;
export const imfTrancheB = (revB) => Math.max(120, Math.round((revB || 0) * .08));
export const imfApply = (turn, revB) => ({ stage: "applied", applied: turn, trancheB: imfTrancheB(revB), drawn: 0, outstandingB: 0, fails: 0, rating: 0, reviews: [] });
export const IMF_CONDITIONS = [
  { id: "float", l: "Float the naira", d: "Stop defending it. The street rate and the official rate become one; imports and food cost more overnight." },
  { id: "subsidy", l: "End the fuel subsidy", d: "Petrol finds its real price. Transport fares follow." },
  { id: "ceiling", l: "A borrowing ceiling", d: "No printing (Ways and Means) and no more than a set amount of new borrowing a year." },
  { id: "vat", l: "VAT up to 10%", d: "More revenue; every trader pays it." },
];
// Accepting the prior actions: the programme starts and the first tranche comes.
export const imfApprove = (I, turn, debtB) => ({ ...I, stage: "active", approved: turn, drawn: 1, outstandingB: I.trancheB, debtAt: debtB, conditions: IMF_CONDITIONS.map(c => c.id) });
/* The yearly review: did you keep the conditions? ctx: { printed (this year),
   subsidyBack, debtB (now) }. Debt may grow by at most 10% a year. */
export const imfReview = (I, ctx = {}, turn) => {
  if (!I || I.stage !== "active") return { I, pass: null, misses: [] };
  const misses = [];
  if (ctx.printed) misses.push("you printed money (Ways and Means)");
  if (ctx.subsidyBack) misses.push("the fuel subsidy is back");
  if ((ctx.debtB || 0) > (I.debtAt || 0) * 1.1 + 1) misses.push("borrowing went past the ceiling");
  const pass = !misses.length, more = pass && I.drawn < IMF_TRANCHES;
  const n = { ...I, reviews: [...(I.reviews || []), { t: turn, pass, misses }], debtAt: ctx.debtB, fails: I.fails + (pass ? 0 : 1), rating: I.rating - (pass ? 0 : 1) };
  if (more) { n.drawn = I.drawn + 1; n.outstandingB = (I.outstandingB || 0) + I.trancheB; }
  return { I: n, pass, misses, tranche: more ? I.trancheB : 0 };
};
// What a year under the programme costs (inflation peaks in years 1–2, then eases).
export const imfDrag = (I, turn) => { if (!I || I.stage !== "active") return null; const y = turn - I.approved;
  return { app: y <= 2 ? -3 : -1, food: y <= 2 ? 8 : 2, protest: y <= 2, probe: y === 2 }; };
// Repaying early: possible when the bank can cover what is owed.
export const imfCanRepay = (I, cashB) => !!I && I.stage === "active" && (cashB || 0) >= (I.outstandingB || 0);
export const imfOn = (I) => !!I && (I.stage === "applied" || I.stage === "active");
export const imfActive = (I) => !!I && I.stage === "active";
