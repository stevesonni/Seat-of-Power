/* The LGA Chairman career: pure rules (no React). The chairman is the man in
   between: the people bring every small problem to the council, and the
   governor controls the money on its way down. One term is three years of
   two half-years each. Every roll is seeded, so a reload replays it. */
import { seeded } from "./rng.js";
import { withCallbacks } from "./consequence.js";

const cl = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const cl1 = (v) => Math.max(0, Math.min(1, v));
export const LGA_HALVES = 6, LGA_TRIAL = 2; // three years; the first year is free
export const halfYear = (n) => Math.ceil(n / 2);

/* How you got the ticket. */
export const LGA_STARTS = {
  anointed: { nm: "The governor's choice", d: "He picked you. The money will come, and so will his requests.", people: 45, gov: 72, council: 70, cor: .2, purse: 60 },
  grassroots: { nm: "The people's favourite", d: "You won the primary on your own. The governor did not want you.", people: 66, gov: 42, council: 50, cor: .05, purse: 20 },
  returnee: { nm: "The wealthy returnee", d: "Back from abroad with savings and ideas. Nobody owes you, and you owe nobody.", people: 52, gov: 50, council: 45, cor: .08, purse: 120 },
};

/* Each half-year the federal allocation comes down through the state. The
   governor's deduction depends on his favour; salaries come off first. */
export const ALLOCATION_M = 520, SALARIES_M = 260;
export const allocation = (S, r) => {
  const cut = S.gov >= 65 ? .1 : S.gov >= 45 ? .25 : S.gov >= 25 ? .4 : .55;
  const deducted = Math.round(ALLOCATION_M * (cut + (r() - .5) * .06));
  return { gross: ALLOCATION_M, deducted, net: ALLOCATION_M - deducted - SALARIES_M, salaries: SALARIES_M };
};
export const ALLOC_OPTS = [
  { id: "accept", l: "Accept it quietly", d: "Keep the peace with the governor.", fx: { gov: 4, people: -2 } },
  { id: "protest", l: "Protest to the governor in person", d: "Ask for the deduction back, politely.", fx: { gov: -6, people: 2 }, refund: .4, chance: .45 },
  { id: "court", l: "Go to court: the Supreme Court says it is your money", d: "Cite the 2024 judgment. The governor will never forgive you.", fx: { gov: -14, people: 6 }, refund: 1, chance: .7, slow: true, seed: "sued_governor" },
];

/* Problems with faces: the council's daily work. cost in ₦M. */
export const LGA_PROBLEMS = [
  { id: "nurse", t: "No nurse at the Ward 4 health centre", who: "health-worker", bg: "rural-health-centre", d: "Mama Ijeoma, the only health worker, has not been paid in four months. Mothers are giving birth on the floor.", learn: "phc",
    opts: [{ id: "hire", l: "Hire two nurses and buy drugs", cost: 60, fx: { people: 7 }, seed: "clinic_staffed" }, { id: "pay", l: "Pay her arrears only", cost: 15, fx: { people: 2 } }, { id: "state", l: "Write to the state ministry of health", cost: 0, fx: { people: -3 } }] },
  { id: "road", t: "The road to Umuchi market is cut", bg: "rural-road-mud", d: "Rain has washed away the only road out. Farmers cannot get their yams to market.", learn: "functions",
    opts: [{ id: "grade", l: "Grade it and lay culverts", cost: 120, fx: { people: 8 }, seed: "road_graded" }, { id: "patch", l: "Fill the worst holes with laterite", cost: 30, fx: { people: 2 } }, { id: "wait", l: "Wait for the dry season", cost: 0, fx: { people: -5 } }] },
  { id: "fire", t: "Fire at the main market", scene: "market-fire-aftermath", d: "Two hundred stalls are ash. Traders are sifting through what is left.", learn: "levy",
    opts: [{ id: "relief", l: "Relief grants and rebuild the stalls", cost: 150, fx: { people: 9 }, seed: "market_rebuilt" }, { id: "waive", l: "Waive this year's market levies", cost: 40, fx: { people: 5 } }, { id: "visit", l: "Visit, sympathise, promise to act", cost: 0, fx: { people: -2 } }] },
  { id: "dispute", t: "Two villages are fighting over farmland", who: "village-head", bg: "village-square", d: "The village head of Amaeke says the boundary stone was moved in the night. Young men are gathering machetes.", learn: "rulers",
    opts: [{ id: "panel", l: "Set up a peace panel with both royal fathers", cost: 10, fx: { people: 5 }, seed: "peace_made" }, { id: "police", l: "Call the police", cost: 0, fx: { people: -2 }, risk: .3 }, { id: "side", l: "Back the bigger village", cost: 0, fx: { people: 1, council: 3 }, risk: .35, seed: "took_side" }] },
  { id: "births", t: "Hundreds of children have no birth certificate", bg: "lga-secretariat", d: "Parents cannot enrol them in school or get them vaccinated without one.", learn: "births",
    opts: [{ id: "drive", l: "Run a free registration drive in every ward", cost: 25, fx: { people: 5 } }, { id: "fee", l: "Charge ₦2,000 a certificate", cost: -10, fx: { people: -3, cor: .02 }, seed: "cert_fee" }] },
  { id: "refuse", t: "The refuse heap is taller than the motor park", bg: "lga-secretariat", d: "The smell reaches the secretariat. Cholera season is coming.", learn: "functions",
    opts: [{ id: "trucks", l: "Hire trucks and clear it weekly", cost: 70, fx: { people: 6 } }, { id: "sanitation", l: "Monthly sanitation day, by order", cost: 5, fx: { people: 2 } }] },
  { id: "teachers", t: "Primary school teachers are on strike", bg: "village-square", d: "Their salaries were deducted from the council allocation, but the money never reached them.", learn: "teachers",
    opts: [{ id: "pay", l: "Pay them from the council purse", cost: 90, fx: { people: 7, gov: -2 }, seed: "teachers_paid" }, { id: "demand", l: "Demand the money back from the state", cost: 0, fx: { people: 3, gov: -6 } }] },
];

/* The council chamber: councillors want things, and can remove you. */
export const LGA_MOTIONS = [
  { id: "allowance", t: "Councillors want a 'constituency allowance'", d: "₦5M each, every quarter, for 'ward projects'. Most of it will never reach a ward.", learn: "councillors",
    opts: [{ id: "pay", l: "Approve it", cost: 50, fx: { council: 12, cor: .05, people: -3 }, npc: { cllr: 10 }, seed: "allowances_paid" }, { id: "projects", l: "Offer ward projects instead, built by the council", cost: 30, fx: { council: 2, people: 3 } }, { id: "refuse", l: "Refuse", cost: 0, fx: { council: -12 }, npc: { cllr: -15 }, seed: "allowance_refused" }] },
  { id: "okada", t: "A bye-law to ban okadas from the town centre", d: "The traders want it; thousands of young men live on it.", learn: "byelaw",
    opts: [{ id: "ban", l: "Pass the ban", cost: 0, fx: { people: -4, council: 4 } }, { id: "lanes", l: "Licence riders and mark okada routes", cost: 15, fx: { people: 4 } }, { id: "drop", l: "Drop it", cost: 0, fx: { council: -3 } }] },
  { id: "levy", t: "A motion to double the market levy", d: "It would fill the purse. Traders say they are already paying three different collectors.", learn: "levy",
    opts: [{ id: "double", l: "Double it", cost: -60, fx: { people: -6 } }, { id: "one", l: "One collector, one receipt, same rate", cost: -20, fx: { people: 4 } }, { id: "no", l: "Leave it", cost: 0, fx: {} }] },
  { id: "jobs", t: "{party} wants jobs for party members", d: "The party chairman sends a list of forty names for council jobs. Most have never been to the secretariat.", learn: "councillors",
    opts: [{ id: "hire", l: "Hire them all", cost: 40, fx: { people: -3, cor: .03 }, npc: { party: 14 }, seed: "payroll_padded" }, { id: "some", l: "Take ten who can actually work", cost: 10, fx: {}, npc: { party: 3 } }, { id: "merit", l: "Advertise the jobs and hire on merit", cost: 0, fx: { people: 4 }, npc: { party: -12 } }] },
  { id: "impeach", t: "Councillors whisper about impeachment", d: "Some of them say you ignore the council. They need two-thirds.", learn: "impeach", needsLow: "council",
    opts: [{ id: "woo", l: "Meet them one by one", cost: 20, fx: { council: 12 }, npc: { cllr: 8 } }, { id: "dare", l: "Dare them to try", cost: 0, fx: { council: -6, people: 2 }, npc: { cllr: -12 } }] },
];

/* What the governor asks of his chairman. */
export const GOV_ASKS = [
  { id: "crowd", t: "The governor wants a crowd", d: "He is commissioning a road in the next LGA. He expects five buses of supporters from you, fed and paid.", learn: "siec",
    opts: [{ id: "yes", l: "Fill the buses", cost: 30, fx: { gov: 8 }, npc: { party: 5 } }, { id: "few", l: "Send one bus", cost: 6, fx: { gov: -2 } }, { id: "no", l: "Excuse yourself", cost: 0, fx: { gov: -8, people: 1 }, npc: { party: -4 }, seed: "snubbed_rally" }] },
  { id: "land", t: "The governor wants council land", d: "Ten plots by the motor park, for 'a friend of the government'.", learn: "land",
    opts: [{ id: "yes", l: "Sign it over", cost: 0, fx: { gov: 10, people: -5, cor: .05 }, seed: "land_given" }, { id: "no", l: "Refuse: it is the market extension", cost: 0, fx: { gov: -10, people: 4 }, npc: { party: -3 } }] },
  { id: "contract", t: "The governor's man wants the drainage contract", d: "His company has never built a drain. The price is double.", learn: "functions",
    opts: [{ id: "yes", l: "Award it", cost: 80, fx: { gov: 9, cor: .06, people: -2 }, seed: "drain_crony" }, { id: "tender", l: "Put it out to tender", cost: 40, fx: { gov: -6, people: 4 } }] },
];

/* Pick this half-year's agenda: the allocation, a problem, a council motion
   or a request from the governor, in turn. */
export const lgaAgenda = (seed, n, S) => {
  const r = seeded(seed, "lga", n), seen = S.seen || [];
  const pick = (list) => { const c = list.filter(x => !seen.includes(x.id) && (!x.needsLow || S[x.needsLow] < 40)); return c.length ? c[Math.floor(r() * c.length)] : null; };
  const items = [{ k: "alloc" }];
  const p = pick(LGA_PROBLEMS); if (p) items.push({ k: "problem", id: p.id });
  const m = n % 2 === 1 ? pick(LGA_MOTIONS) : null; if (m) items.push({ k: "motion", id: m.id });
  const g = n % 2 === 0 ? pick(GOV_ASKS) : null; if (g) items.push({ k: "gov", id: g.id });
  if (n % 2 === 0) { const p2 = pick(LGA_PROBLEMS.filter(x => !p || x.id !== p.id)); if (p2) items.push({ k: "problem", id: p2.id }); }
  const rd = S.road || {};
  if (n === 1 && !rd.builder) items.push({ k: "road", id: "award" });
  if (n === 2 && rd.builder && !rd.warned) items.push({ k: "road", id: "warn" });
  return items;
};

/* The half-year's queue: callbacks that have come due go first. */
export const lgaCallback = (key) => LGA_CALLBACKS[key] || (key.startsWith("neglect:") ? (() => { const x = LGA_PROBLEMS.find(p => p.id === key.slice(8)); return x ? neglectCard(x) : null; })() : null);
export const lgaTurn = (seed, n, S) => { const table = {}; (S.seeds || []).forEach(x => { const c = lgaCallback(x.key); if (c) table[x.key] = c; }); const items = withCallbacks(S, n, lgaAgenda(seed, n, S), table);
  // The rainy season of year 2 tests the road, whatever was decided.
  return n === 4 && S.road && S.road.builder && !S.road.tested ? [{ k: "roadtest", id: "test" }, ...items] : items; };
/* The chairman's three named people (names are made per run). */
export const LGA_NPCS = { party: { role: "Party Chairman", art: "party-chairman" }, cllr: { role: "Councillor", art: "councillor-male" } };
export const applyLga = (S, fx = {}, costM = 0) => ({ ...S,
  people: Math.round(cl(S.people + (fx.people || 0))), gov: Math.round(cl(S.gov + (fx.gov || 0))), council: Math.round(cl(S.council + (fx.council || 0))),
  cor: Math.round(cl1(S.cor + (fx.cor || 0)) * 100) / 100, purse: Math.round(S.purse - costM) });

/* A choice with a risk: things can go wrong in public. */
export const lgaChoice = (o, r) => { const bad = o.risk ? r() < o.risk : false; const fx = { ...o.fx }; if (bad) fx.people = (fx.people || 0) - 7; return { fx, bad }; };

/* Between half-years: people expect more, and a governor you defied may
   dissolve the council; councillors you ignored may impeach. */
export const LGA_DRIFT = { people: -5 };
export const lgaThreats = (S, r, n = 6) => {
  if (n >= 3 && S.gov < 12 && r() < .35) return { kind: "dissolved" };
  const cllr = S.npcs && S.npcs.cllr ? S.npcs.cllr.rel : 50;
  if ((S.council < 22 || (S.council < 40 && cllr < 15)) && r() < .4) return { kind: "impeached" };
  return null;
};

/* The council election at the end: run by the state's commission. */
/* The party chairman holds the ticket: the governor's man gets it unless the
   party has turned on him; a party that loves you can override a cold governor. */
export const lgaTicket = (S) => { const pr = (S.npcs && S.npcs.party) ? S.npcs.party.rel : 50; return (S.gov >= 25 && pr >= 25) || pr >= 70; };
export const lgaElection = (S, r) => {
  const ticket = lgaTicket(S);
  if (!ticket) return { ticket: false, won: false };
  const you = cl(S.people * .6 + S.gov * .2 + 14 - S.cor * 20 + (S.elecMod || 0) + (r() - .5) * 10, 5, 95);
  return { ticket: true, won: you >= 50, you: Math.round(you) };
};
export const lgaLegacy = (S) => Math.min(100, (S.fixed || 0) * 11);
export const lgaScore = (S) => Math.round(S.people * .4 + lgaLegacy(S) * .3 + (1 - S.cor) * 100 * .2 + Math.min(100, Math.max(0, S.purse)) * .1);
export const lgaGrade = (score) => score >= 76 ? "A" : score >= 65 ? "B" : score >= 52 ? "C" : score >= 40 ? "D" : "F";

/* ── The market road: one project you live with for the whole term ──
   Commitment (who builds it), warning (a named trader sees a problem),
   intervention (repair, inspect, or open on time), then the rainy season
   tests what you built. quality runs 0–1; every choice moves it. */
export const ROAD = {
  award: { t: "The Umuchi market road contract", who: "contractor", bg: "rural-road-mud", learn: "functions",
    d: "The one project everyone will judge you by. {party} has a contractor ready; the council engineer wants an open tender; the traders would settle for smaller access roads now.",
    opts: [{ id: "sponsor", l: "Give it to the party's contractor", cost: 90, fx: { gov: 4 }, npc: { party: 10 }, road: { builder: "sponsor", quality: .45 }, story: "gave the market road to the party's contractor" },
      { id: "tender", l: "Open tender: the best bid wins", cost: 110, fx: { people: 2 }, npc: { party: -10 }, road: { builder: "tender", quality: .8 }, story: "put the market road out to open tender" },
      { id: "small", l: "Build three small access roads instead", cost: 70, fx: { people: 4 }, road: { builder: "small", quality: .65 }, story: "built three small access roads instead of one big one" }] },
  warn: { t: "A trader sends a photograph", who: "market-trader", bg: "road-construction-site", learn: "functions",
    d: { sponsor: "Mama Chika, who sells pepper at the junction, sends a photo: the drains are barely knee-deep, half what the plan says. The contractor says fixing them will delay the opening by months.",
      tender: "The road is going well, but the contractor wants ₦30M more for 'unforeseen rock'. {party} says this is what you get for ignoring the party.",
      small: "Two of the three access roads are done. Traders on the third route say theirs has been forgotten, and they are blocking the council gate." },
    opts: [{ id: "repair", l: "Stop work and make them do it properly", cost: 0, fx: { people: 2 }, npc: { party: -6 }, road: { quality: .25 }, story: "stopped the road to fix it properly" },
      { id: "inspect", l: "Commission an independent inspection", cost: 25, fx: {}, road: { quality: .15 }, story: "paid for an independent inspection of the road" },
      { id: "open", l: "Push on and open it on schedule", cost: 0, fx: { people: 3 }, road: { quality: 0 }, story: "pushed the road through to open on schedule" }] },
};
export const roadTest = (S, r) => { const q = (S.road && S.road.quality) || 0, held = r() < q; return { held, fx: held ? { people: 9 } : { people: -10 }, elec: held ? 5 : -6, purse: held ? 40 : 0 }; };

/* Your one promise, made on day one and judged at the end. */
export const LGA_PROMISES = {
  road: { l: "The market road will last", d: "Judged in the rainy season.", kept: (S) => !!(S.road && S.road.held) },
  clinic: { l: "No mother will die for want of a nurse", d: "Staff the health centres.", kept: (S) => (S.seenOpt || []).includes("nurse:hire") },
  levy: { l: "No new levies on traders", d: "Do not raise market fees or charge for certificates.", kept: (S) => !(S.seenOpt || []).some(k => k === "levy:double" || k === "births:fee") },
};

/* The in-tray: you handle two matters yourself; the rest go to your staff,
   who do the cheapest thing. A neglected problem comes back worse. */
export const ATTENTION = 2;
export const delegated = (kind, x) => {
  if (kind === "alloc") return { id: "accept", l: "The treasurer accepted it quietly", ...ALLOC_OPTS[0] };
  if (kind === "road") return x.opts[0]; // the party's pressure wins when you are not in the room
  if (kind === "gov") return { id: "busy", l: "Your aide told the governor you were busy", cost: 0, fx: { gov: -4 } };
  if (kind === "motion") return { id: "absent", l: "The council decided without you", cost: 0, fx: { council: -3 } };
  const cheap = x.opts.filter(o => o.cost <= 0 && !(o.fx && o.fx.cor > 0)).slice(-1)[0] || x.opts[x.opts.length - 1];
  return { ...cheap, neglect: true };
};
/* A problem left to the department, half a year on. */
export const neglectCard = (x) => ({ t: "Worse: " + x.t.replace(/^./, c => c.toLowerCase()), who: x.who, bg: x.bg, scene: x.scene, learn: x.learn,
  d: "You left it to the department, and they did the least they could. Now it is worse, and people know you looked away.",
  opts: [{ id: "now", l: "Deal with it properly now", cost: Math.round(Math.max(30, (x.opts[0].cost || 30) * 1.4)), fx: { people: 3 } }, { id: "leave", l: "Leave it again", cost: 0, fx: { people: -7 }, elec: -3 }] });

/* The four-part verdict that replaces a single grade. */
export const lgaVerdict = (S, ending) => {
  const word = (v) => v >= 75 ? "Strong" : v >= 50 ? "Fair" : "Weak";
  const delivery = Math.min(100, (S.fixed || 0) * 14 + (S.road ? (S.road.held ? 30 : S.road.tested ? 0 : 10) : 0));
  const integrity = Math.round((1 - (S.cor || 0)) * 100);
  const survival = { reelected: 90, defeated: 45, no_ticket: 35, dissolved: 15, impeached: 10 }[ending] ?? 50;
  const P = S.promise && LGA_PROMISES[S.promise], kept = P ? P.kept(S) : null;
  return [["Delivery", delivery, word(delivery)], ["Integrity", integrity, word(integrity)], ["Survival", survival, word(survival)], ["Your promise", kept == null ? 50 : kept ? 100 : 0, kept == null ? "None made" : kept ? "Kept" : "Broken"]];
};

/* "It comes back": each seed's callback, a card with a named person.
   {gov}, {party} and {cllr} are filled with this run's names. elec moves
   the council election; seed plants the next link in the chain. */
export const LGA_CALLBACKS = {
  land_given: { t: "The motor park traders are evicted", who: "market-women-group-angry", bg: "busy-market-street", d: "Bulldozers arrived at dawn on the plots you signed over to {gov}'s friend. Two hundred traders have nowhere to sell. Your opponent is filming.", learn: "land",
    opts: [{ id: "compensate", l: "Find them new stalls from the council purse", cost: 60, fx: { people: 6, gov: -3 } }, { id: "blame", l: "Say the state government did it", cost: 0, fx: { people: 3, gov: -10 } }, { id: "silence", l: "Say nothing", cost: 0, fx: { people: -6 }, elec: -6 }] },
  drain_crony: { t: "The new drains collapse in the first rain", bg: "flooded-community", d: "The contractor that {gov} pushed on you used half the cement. Three streets are under water and a child is missing.", learn: "functions",
    opts: [{ id: "redo", l: "Rebuild them properly, and sue the contractor", cost: 70, fx: { people: 5, gov: -8 } }, { id: "cover", l: "Blame the rain and pay to pump the water out", cost: 20, fx: { people: -5, cor: .03 }, elec: -4 }] },
  snubbed_rally: { t: "The governor remembers", who: "governor-angry", scene: "joint-account-meeting", d: "{gov} commissions a new road in the next LGA. The one promised to yours has been 'moved to next year'.", learn: "jaac",
    opts: [{ id: "apologise", l: "Go to Government House and make peace", cost: 10, fx: { gov: 10 }, npc: { party: 4 } }, { id: "public", l: "Tell the people exactly what happened", cost: 0, fx: { people: 4, gov: -8 } }] },
  allowances_paid: { t: "The 'ward projects' are empty", who: "councillor-male", bg: "village-square", d: "A youth group visits every ward project the allowances paid for. They find nothing, and {cllr} is quoted saying the chairman knew.", learn: "councillors",
    opts: [{ id: "stop", l: "Stop the allowances and publish the accounts", cost: 0, fx: { people: 4, council: -10 }, npc: { cllr: -10 } }, { id: "deny", l: "Deny everything", cost: 0, fx: { people: -6, cor: .02 }, elec: -5 }] },
  allowance_refused: { t: "{cllr} gathers signatures", who: "councillor-male", bg: "council-chamber", d: "Angry about the allowances, {cllr} is collecting councillors' signatures for a motion against you.", learn: "impeach",
    opts: [{ id: "deal", l: "Give {cllr} a committee chair", cost: 0, fx: { council: 8 }, npc: { cllr: 15 } }, { id: "people", l: "Take your case to the wards", cost: 15, fx: { people: 4, council: 4 } }, { id: "ignore", l: "Ignore it", cost: 0, fx: { council: -8 }, npc: { cllr: -5 } }] },
  sued_governor: { t: "The state auditors arrive", scene: "joint-account-meeting", d: "Days after your lawsuit, {gov} sends state auditors to go through every council account since you took office.", learn: "supreme",
    opts: [{ id: "open", l: "Open every book", cost: 0, fx: { people: 3, cor: -.03 } }, { id: "settle", l: "Drop the case in return for peace", cost: 0, fx: { gov: 12, people: -4 } }] },
  payroll_padded: { t: "Ghost workers on the payroll", who: "lga-treasurer-worried", bg: "chairman-office", d: "The treasurer finds that half of {party}'s forty hires never come to work, but all of them are paid.", learn: "teachers",
    opts: [{ id: "purge", l: "Remove them from the payroll", cost: 0, fx: { people: 3 }, npc: { party: -15 } }, { id: "keep", l: "Keep paying: the party needs them", cost: 40, fx: { cor: .04 }, npc: { party: 5 } }] },
  cert_fee: { t: "A journalist pays ₦2,000 on camera", bg: "lga-secretariat", d: "The video of your registry charging for birth certificates is everywhere. The law says registration is free.", learn: "births",
    opts: [{ id: "refund", l: "Scrap the fee and refund parents", cost: 15, fx: { people: 4, cor: -.02 } }, { id: "defend", l: "Defend it as a 'processing charge'", cost: 0, fx: { people: -5 }, elec: -3 }] },
  took_side: { t: "The smaller village strikes back", who: "village-head", bg: "village-square", d: "The village you ruled against burns the disputed farm. Their head says the council is no longer neutral.", learn: "rulers",
    opts: [{ id: "panel", l: "Now set up the peace panel", cost: 15, fx: { people: 4 } }, { id: "police", l: "Send the police", cost: 0, fx: { people: -4 } }] },
  clinic_staffed: { t: "Cholera, and the Ward 4 clinic holds", who: "health-worker", bg: "rural-health-centre", d: "Cholera reaches the ward. Because the clinic has nurses and drugs, almost everyone who comes in survives. The papers ask who staffed it.", learn: "phc", good: true,
    opts: [{ id: "credit", l: "Let the nurses take the credit", cost: 0, fx: { people: 7 }, elec: 4 }, { id: "rally", l: "Hold a press conference", cost: 5, fx: { people: 5 }, npc: { party: 4 } }] },
  road_graded: { t: "Market day doubles", bg: "rural-road-mud", d: "Since the road was graded, trucks come from three LGAs. The market is bursting, and so are the levy collectors' bags.", learn: "levy", good: true,
    opts: [{ id: "bank", l: "Bank the extra market fees", cost: -40, fx: { people: 2 } }, { id: "expand", l: "Spend it on new stalls", cost: 0, fx: { people: 6 }, elec: 3 }] },
  market_rebuilt: { t: "The traders' union endorses you", who: "market-women-group-cheering", bg: "busy-market-street", d: "The women whose stalls you rebuilt after the fire say they will campaign for you, ward by ward.", learn: "levy", good: true,
    opts: [{ id: "accept", l: "Accept, and promise no new levies", cost: 0, fx: { people: 4 }, elec: 6 }] },
  peace_made: { t: "The two villages invite you", who: "village-head", bg: "village-square", d: "The villages you reconciled hold a joint new-yam festival and ask you to cut the first yam.", learn: "rulers", good: true,
    opts: [{ id: "go", l: "Go, and bring the royal fathers", cost: 5, fx: { people: 5 }, elec: 3 }] },
  teachers_paid: { t: "The teachers' union remembers", who: "teacher", bg: "classroom", d: "The teachers you paid when the state would not are telling every parent in the LGA.", learn: "teachers", good: true,
    opts: [{ id: "thanks", l: "Thank them, and visit the schools", cost: 0, fx: { people: 5 }, elec: 4 }] },
};

/* How it really works, for the chairman's notebook. */
export const LGA_LEARN = {
  lgas: "Nigeria has 774 local government areas, listed in the First Schedule of the Constitution. Section 7 guarantees them democratically elected councils.",
  functions: "The Fourth Schedule lists what councils do: markets, motor parks, refuse, local roads, drains, birth and death registration, and a share of primary schools and health care.",
  jaac: "Section 162(6) created the State Joint Local Government Account. Federal money for councils passed through the state first, which let governors deduct from it.",
  supreme: "In July 2024 the Supreme Court ruled that councils' allocations must be paid to them directly, and only to democratically elected councils.",
  siec: "Council elections are run by each state's own electoral commission (SIEC), not INEC. The governor's party usually wins almost every seat.",
  caretaker: "Governors have often dissolved elected councils and installed caretaker committees. The courts have repeatedly ruled this unconstitutional.",
  councillors: "Each ward elects one councillor. Together they are the council's legislature: they pass its budget and its bye-laws.",
  impeach: "Under most state local government laws, councillors can remove their chairman with a two-thirds vote.",
  levy: "Councils may collect rates, market fees and motor park dues. Traders often pay several collectors for the same stall.",
  byelaw: "Councils make bye-laws on local matters, from market hours to where okadas may ride.",
  births: "Registering births and deaths is a council duty under the Fourth Schedule. A birth certificate is needed for school, a passport and the vote.",
  teachers: "Primary teachers' salaries are often deducted from council allocations at source, before the council sees the money.",
  phc: "Primary health care is mostly a council job. Many ward health centres lack staff, power and drugs.",
  rulers: "Traditional rulers have no powers under the Constitution, but councils work through them, and their word settles many land disputes.",
  land: "Under the Land Use Act, land in towns is controlled by the governor and rural land by the council. Plots are a common political reward.",
};
