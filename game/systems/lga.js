/* The LGA Chairman career: pure rules (no React). The chairman is the man in
   between: the people bring every small problem to the council, and the
   governor controls the money on its way down. One term is three years of
   two half-years each. Every roll is seeded, so a reload replays it. */
import { seeded } from "./rng.js";

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
  { id: "court", l: "Go to court: the Supreme Court says it is your money", d: "Cite the 2024 judgment. The governor will never forgive you.", fx: { gov: -14, people: 6 }, refund: 1, chance: .7, slow: true },
];

/* Problems with faces: the council's daily work. cost in ₦M. */
export const LGA_PROBLEMS = [
  { id: "nurse", t: "No nurse at the Ward 4 health centre", who: "health-worker", bg: "rural-health-centre", d: "Mama Ijeoma, the only health worker, has not been paid in four months. Mothers are giving birth on the floor.", learn: "phc",
    opts: [{ id: "hire", l: "Hire two nurses and buy drugs", cost: 60, fx: { people: 7 } }, { id: "pay", l: "Pay her arrears only", cost: 15, fx: { people: 2 } }, { id: "state", l: "Write to the state ministry of health", cost: 0, fx: { people: -3 } }] },
  { id: "road", t: "The road to Umuchi market is cut", bg: "rural-road-mud", d: "Rain has washed away the only road out. Farmers cannot get their yams to market.", learn: "functions",
    opts: [{ id: "grade", l: "Grade it and lay culverts", cost: 120, fx: { people: 8 } }, { id: "patch", l: "Fill the worst holes with laterite", cost: 30, fx: { people: 2 } }, { id: "wait", l: "Wait for the dry season", cost: 0, fx: { people: -5 } }] },
  { id: "fire", t: "Fire at the main market", scene: "market-fire-aftermath", d: "Two hundred stalls are ash. Traders are sifting through what is left.", learn: "levy",
    opts: [{ id: "relief", l: "Relief grants and rebuild the stalls", cost: 150, fx: { people: 9 } }, { id: "waive", l: "Waive this year's market levies", cost: 40, fx: { people: 5 } }, { id: "visit", l: "Visit, sympathise, promise to act", cost: 0, fx: { people: -2 } }] },
  { id: "dispute", t: "Two villages are fighting over farmland", who: "village-head", bg: "village-square", d: "The village head of Amaeke says the boundary stone was moved in the night. Young men are gathering machetes.", learn: "rulers",
    opts: [{ id: "panel", l: "Set up a peace panel with both royal fathers", cost: 10, fx: { people: 5 } }, { id: "police", l: "Call the police", cost: 0, fx: { people: -2 }, risk: .3 }, { id: "side", l: "Back the bigger village", cost: 0, fx: { people: 1, council: 3 }, risk: .35 }] },
  { id: "births", t: "Hundreds of children have no birth certificate", bg: "lga-secretariat", d: "Parents cannot enrol them in school or get them vaccinated without one.", learn: "births",
    opts: [{ id: "drive", l: "Run a free registration drive in every ward", cost: 25, fx: { people: 5 } }, { id: "fee", l: "Charge ₦2,000 a certificate", cost: -10, fx: { people: -3, cor: .02 } }] },
  { id: "refuse", t: "The refuse heap is taller than the motor park", bg: "lga-secretariat", d: "The smell reaches the secretariat. Cholera season is coming.", learn: "functions",
    opts: [{ id: "trucks", l: "Hire trucks and clear it weekly", cost: 70, fx: { people: 6 } }, { id: "sanitation", l: "Monthly sanitation day, by order", cost: 5, fx: { people: 2 } }] },
  { id: "teachers", t: "Primary school teachers are on strike", bg: "village-square", d: "Their salaries were deducted from the council allocation, but the money never reached them.", learn: "teachers",
    opts: [{ id: "pay", l: "Pay them from the council purse", cost: 90, fx: { people: 7, gov: -2 } }, { id: "demand", l: "Demand the money back from the state", cost: 0, fx: { people: 3, gov: -6 } }] },
];

/* The council chamber: councillors want things, and can remove you. */
export const LGA_MOTIONS = [
  { id: "allowance", t: "Councillors want a 'constituency allowance'", d: "₦5M each, every quarter, for 'ward projects'. Most of it will never reach a ward.", learn: "councillors",
    opts: [{ id: "pay", l: "Approve it", cost: 50, fx: { council: 12, cor: .05, people: -3 } }, { id: "projects", l: "Offer ward projects instead, built by the council", cost: 30, fx: { council: 2, people: 3 } }, { id: "refuse", l: "Refuse", cost: 0, fx: { council: -12 } }] },
  { id: "okada", t: "A bye-law to ban okadas from the town centre", d: "The traders want it; thousands of young men live on it.", learn: "byelaw",
    opts: [{ id: "ban", l: "Pass the ban", cost: 0, fx: { people: -4, council: 4 } }, { id: "lanes", l: "Licence riders and mark okada routes", cost: 15, fx: { people: 4 } }, { id: "drop", l: "Drop it", cost: 0, fx: { council: -3 } }] },
  { id: "levy", t: "A motion to double the market levy", d: "It would fill the purse. Traders say they are already paying three different collectors.", learn: "levy",
    opts: [{ id: "double", l: "Double it", cost: -60, fx: { people: -6 } }, { id: "one", l: "One collector, one receipt, same rate", cost: -20, fx: { people: 4 } }, { id: "no", l: "Leave it", cost: 0, fx: {} }] },
  { id: "impeach", t: "Councillors whisper about impeachment", d: "Some of them say you ignore the council. They need two-thirds.", learn: "impeach", needsLow: "council",
    opts: [{ id: "woo", l: "Meet them one by one", cost: 20, fx: { council: 12 } }, { id: "dare", l: "Dare them to try", cost: 0, fx: { council: -6, people: 2 } }] },
];

/* What the governor asks of his chairman. */
export const GOV_ASKS = [
  { id: "crowd", t: "The governor wants a crowd", d: "He is commissioning a road in the next LGA. He expects five buses of supporters from you, fed and paid.", learn: "siec",
    opts: [{ id: "yes", l: "Fill the buses", cost: 30, fx: { gov: 8 } }, { id: "few", l: "Send one bus", cost: 6, fx: { gov: -2 } }, { id: "no", l: "Excuse yourself", cost: 0, fx: { gov: -8, people: 1 } }] },
  { id: "land", t: "The governor wants council land", d: "Ten plots by the motor park, for 'a friend of the government'.", learn: "land",
    opts: [{ id: "yes", l: "Sign it over", cost: 0, fx: { gov: 10, people: -5, cor: .05 } }, { id: "no", l: "Refuse: it is the market extension", cost: 0, fx: { gov: -10, people: 4 } }] },
  { id: "contract", t: "The governor's man wants the drainage contract", d: "His company has never built a drain. The price is double.", learn: "functions",
    opts: [{ id: "yes", l: "Award it", cost: 80, fx: { gov: 9, cor: .06, people: -2 } }, { id: "tender", l: "Put it out to tender", cost: 40, fx: { gov: -6, people: 4 } }] },
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
  return items;
};

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
  if (S.council < 22 && r() < .4) return { kind: "impeached" };
  return null;
};

/* The council election at the end: run by the state's commission. */
export const lgaElection = (S, r) => {
  const ticket = S.gov >= 25;
  if (!ticket) return { ticket: false, won: false };
  const you = cl(S.people * .6 + S.gov * .2 + 14 - S.cor * 20 + (r() - .5) * 10, 5, 95);
  return { ticket: true, won: you >= 50, you: Math.round(you) };
};
export const lgaLegacy = (S) => Math.min(100, (S.fixed || 0) * 11);
export const lgaScore = (S) => Math.round(S.people * .4 + lgaLegacy(S) * .3 + (1 - S.cor) * 100 * .2 + Math.min(100, Math.max(0, S.purse)) * .1);
export const lgaGrade = (score) => score >= 76 ? "A" : score >= 65 ? "B" : score >= 52 ? "C" : score >= 40 ? "D" : "F";

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
