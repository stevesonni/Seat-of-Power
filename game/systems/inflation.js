/* Inflation: the bill for printed money (owner, 22 Nov 2026: "there has to be a stronger consequence; aside me being
   told inflation increased, the consequence has to be felt"). A President who has the Central Bank print money
   (Ways and Means) raises inflation, and while it is high:
   - prices: every programme and project costs more (priceF);
   - people: approval drains every year;
   - debt: the naira falls, so the dollar debt grows in naira;
   - labour: past 25% the NLC demands a wage rise and walks out;
   - food: past 30% there are food-price protests.
   It falls only slowly on its own; the Central Bank can raise interest rates to bring it down, at a price.
   Figures are rough and deliberately simple: Nigeria's inflation ran above 30% in 2024. */
export const INFL_BASE = 18;      // where it starts (%)
export const INFL_FLOOR = 12;     // where it settles
export const infl = (I) => Math.round((I && I.rate != null ? I.rate : INFL_BASE) * 10) / 10;
// Printing ₦X when the federal year brings in ₦R adds this many points (at least 6).
export const printImpact = (amtB, revB) => Math.round(Math.max(6, Math.min(40, (amtB || 0) / Math.max(1, revB || 1) * 60)) * 10) / 10;
export const printInfl = (I, amtB, revB, turn) => { const add = printImpact(amtB, revB), from = infl(I);
  return { I: { ...(I || {}), rate: Math.min(95, from + add), printed: (I && I.printed || 0) + (amtB || 0), lastPrint: turn }, from, to: Math.min(95, from + add), add }; };
// How much more everything costs: 1 at 15% or less, +1% per point above it.
export const priceF = (I) => Math.round((1 + Math.max(0, infl(I) - 15) / 100) * 100) / 100;
/* One year of it. ctx: { tight (the Central Bank raised rates this year), debtB }. Returns the new state, the
   year's effects and what happened, in words. */
export const inflYear = (I0, ctx = {}) => {
  const I = { ...(I0 || {}) }, r = infl(I0), notes = [];
  const fx = { app: -Math.min(8, Math.max(0, Math.round((r - 15) / 5))) || 0 };
  const debtGrowB = r > 20 && ctx.debtB ? Math.round(ctx.debtB * Math.min(.25, (r - 15) / 200) * 10) / 10 : 0;
  if (fx.app < 0) notes.push("Inflation at " + Math.round(r) + "%: food and transport cost more every week, and people blame you (approval " + fx.app + ").");
  if (debtGrowB > 0) notes.push("The naira fell with inflation, so the dollar debt grew by " + "₦" + debtGrowB.toFixed(1) + "B in naira.");
  const strike = r >= 25, food = r >= 30;
  if (strike) notes.push("The NLC says wages no longer buy food. It wants a pay rise to match prices, or it strikes.");
  if (food) notes.push("Food-price protests in the cities: market women march on the state secretariats.");
  // It comes down slowly on its own, faster when the Central Bank tightens.
  const fall = ctx.tight ? 9 : 3;
  I.rate = Math.max(INFL_FLOOR, Math.round((r - fall) * 10) / 10);
  I.hist = [...(I.hist || []), r].slice(-8);
  return { I, fx, debtGrowB, strike, food, notes, was: r, now: I.rate };
};
