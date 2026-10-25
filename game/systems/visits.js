/* Two ceremonies of office (rules only, no React).

   The ribbon: when a project is finished, the governor (or President) cuts
   the ribbon; the front page credits the contractor that delivered it, or
   asks where the money went.

   The visit: once a year a governor may fly to Abuja and see the President
   at Aso Rock with one request. The answer depends on the governor's
   standing with the federal government (fg, 0–100) and on their record.
   Every name is fictional or an office. */

// "Kestrel Construction Nig. PLC" → "KESTREL"
export const contractorShort = (name) => String(name || "The contractor").replace(/^(The|Messrs\.?)\s+/i, "").split(/\s+/)[0].toUpperCase();

/* The front page for a ribbon-cutting. who: "Governor Sonni" or
   "President Okafor"; what: the thing built ("road", "general hospital"). */
export const ribbonHeadline = ({ contractor, who, what, leakage = 0 }) => {
  const thing = String(what || "project").toLowerCase();
  return leakage > .2
    ? { h: "RIBBON CUT, QUESTIONS REMAIN: " + who.toUpperCase() + " OPENS NEW " + thing.toUpperCase(), sub: "Money went missing on the way", good: false }
    : { h: contractorShort(contractor) + " DELIVERS: " + who + " unveils new " + thing, sub: "Built by " + (contractor || "the contractor") + ", on the ground for all to see", good: true };
};

// What a governor can ask the President for, one request a visit.
export const VISIT_ASKS = [
  { id: "road", l: "A federal road through the state", d: "The federal highway is a death trap. Ask the President to put it in the federal budget.", base: .45, grant: { infra: .02, app: 2 }, yes: "The President calls the Minister of Works in front of you: the road goes into next year's federal budget.", no: "“The federal budget is tight this year, Governor. Next year.”" },
  { id: "refund", l: "Refunds for federal roads the state repaired", d: "The state fixed federal roads with its own money. Ask for the refund.", base: .4, grantCash: true, yes: "The President signs the approval: the refund is paid into the state's account.", no: "“The Finance Minister will look into it.” Nobody believes that." },
  { id: "troops", l: "Troops for the state's worst trouble spot", d: "The police cannot hold it alone. Ask for the army.", base: .5, grant: { sec: .02 }, yes: "The President orders a battalion to the state. The Chief of Army Staff confirms by evening.", no: "“The army is stretched on every front, Governor.”" },
  { id: "backing", l: "The President's backing at the party", d: "Ask the President to stand with you against your rivals in the party.", base: .4, grant: { pStab: 5 }, yes: "The President's chief of staff calls the party chairman that afternoon. Your rivals go quiet.", no: "“I do not take sides in party matters,” the President says. Everyone knows that is not true." },
];

// The chance the President says yes: standing with Abuja first, then the record.
export const visitOdds = (ask, { fg = 50, app = 50, cor = .3 } = {}) =>
  Math.max(.08, Math.min(.92, ask.base + (fg - 50) / 90 + (app - 50) / 300 - Math.max(0, cor - .4) * .6));

export const visitOutcome = (ask, ctx, r = Math.random) => {
  const p = visitOdds(ask, ctx), ok = r() < p;
  const cashB = ask.grantCash && ok ? Math.max(1, Math.round((ctx.revB || 20) * .08 * 10) / 10) : 0;
  return { ok, p, cashB, fx: ok ? (ask.grant || {}) : {}, fg: ok ? 3 : 1, line: ok ? ask.yes : ask.no,
    paper: ok ? ["GOVERNOR WINS THE PRESIDENT'S EAR", "Aso Rock grants " + ask.l.charAt(0).toLowerCase() + ask.l.slice(1), true] : ["GOVERNOR RETURNS FROM ASO ROCK EMPTY-HANDED", "The President promises to “look into” " + ask.l.charAt(0).toLowerCase() + ask.l.slice(1), false] };
};
