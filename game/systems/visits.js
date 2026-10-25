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

/* The President's visits to the states: up to two a year, unannounced if
   you like. Pick a state and a purpose; the zone remembers. ctx: { state
   (label), zone, sec (0–1), issue (what the people raise), north }. */
export const STATE_VISITS_A_YEAR = 2;
export const STATE_VISIT_PURPOSES = [
  { id: "town", l: "A town hall with the people", d: "Hear them out in the open square, cameras rolling." },
  { id: "inspect", l: "A surprise inspection of federal projects", d: "Nobody is told. See what the contractors are really doing." },
  { id: "security", l: "Visit the troops and the displaced", d: "Stand with the soldiers and the families in the camps." },
  { id: "rulers", l: "Meet the governor and the traditional rulers", d: "Palace protocol, a closed-door meeting, the politics." },
];
export const stateVisitOutcome = (purposeId, ctx = {}, r = Math.random) => {
  const S = String(ctx.state || "the state"), U = S.toUpperCase(), issue = ctx.issue || "jobs";
  if (purposeId === "town") return { title: "A town hall in " + S, line: "Thousands turn out. They tell you about " + issue + ", loudly. You promise to come back with answers.", fx: { app: 1 }, zone: 3,
    paper: ["PRESIDENT IN " + U + ": “I HEAR YOU”", "A town hall on " + issue + " draws thousands", true], img: "backgrounds/village-square" };
  if (purposeId === "inspect") return r() < .5
    ? { title: "Caught napping", line: "The federal road site in " + S + " is empty: no workers, no machines, the money long paid. You sack the contractor on the spot.", fx: { app: 2, cor: -.01 }, zone: 2, found: true,
      paper: ["PRESIDENT CATCHES CONTRACTOR NAPPING IN " + U, "An abandoned federal site; the contract is cancelled on the spot", true], img: "backgrounds/project-site-stalled" }
    : { title: "Work on schedule", line: "The surprise finds the federal site in " + S + " busy and on schedule. The engineers did not know you were coming.", fx: { app: 1 }, zone: 1,
      paper: ["SURPRISE VISIT: WORK ON SCHEDULE IN " + U, "The President finds federal projects moving", true], img: "backgrounds/road-construction-site" };
  if (purposeId === "security") { const hot = (ctx.sec == null ? .5 : ctx.sec) < .45;
    return { title: "With the troops in " + S, line: hot ? "In the camps, families who fled the attacks crowd around you. The soldiers stand taller for it." : "A quiet barracks and a short visit to the camps. The commanders brief you on what they need.", fx: { app: hot ? 2 : 1, sec: hot ? .006 : .002 }, zone: hot ? 3 : 1,
      paper: [hot ? "PRESIDENT VISITS THE FRONT IN " + U : "PRESIDENT VISITS THE TROOPS IN " + U, hot ? "Soldiers and the displaced see their Commander-in-Chief" : "A morale visit to the barracks", true], img: "backgrounds/idp-camp" }; }
  return { title: "At the palace in " + S, line: "The traditional rulers receive you in full regalia; the governor sits beside you. Behind closed doors they ask for roads, and for respect.", fx: { pStab: 2 }, zone: 2,
    paper: ["PRESIDENT RECEIVED BY " + U + " ROYAL FATHERS", "A closed-door meeting with the governor and the traditional rulers", true], img: ctx.north ? "backgrounds/emirs-palace-courtyard" : "backgrounds/government-house" };
};
