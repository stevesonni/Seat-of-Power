/* Capital projects: scope, money, contractors and delivery.

   Money is whole ₦ millions (money.js). A project keeps, separately:
     estimateM   – what the intended scope costs (simulation unit costs)
     approvedM   – the total budget you approved for it
     alloc       – { year: ₦M } allocated year by year (phasing)
     spentM      – actually paid to the contractor so far
     committedM  – approved but not yet spent (approvedM − spentM)
     remainingM  – still needed to finish the scope (estimateM − value built)
   Funding the whole scope over several years is PHASING (fine). Approving
   less than the scope costs is a SHORTFALL: you are warned, and if you go
   ahead anyway the money runs out before the work does.

   Building a facility is not running it: a hospital or school also needs
   equipping (one-off) and staff (every year) before it gives full benefit.

   Delivery each year is seeded from the project id and year (rng.js), so a
   reload does not reroll it. Spending more does not guarantee success:
   contractor reliability, quality and integrity, and your oversight, still
   decide what you get for the money. */
import { seeded } from "./rng.js";
import { fmtM } from "./money.js";

export const SECTORS = {
  roads: "Roads and transport", health: "Health facilities", education: "Schools and colleges", water: "Water and sanitation",
  energy: "Power", markets: "Markets and housing", security: "Security equipment", waste: "Waste", industry: "Industrial estates", sports: "Sports", tourism: "Tourism and culture",
};
export const TYPE_SECTOR = { road: "roads", bridge: "roads", hospital: "health", school: "education", secondary: "education", nursing: "health", coe: "education", polytechnic: "education", university: "education", water: "water", dam: "water", power: "energy", market: "markets", housing: "markets", vehicles: "security", cctv: "security", landfill: "waste", industrial: "industry", stadium: "sports", esports: "sports", tourist: "tourism", rail: "roads", airport: "roads", seaport: "industry", refinery: "industry", pipeline: "energy" };

// Simulation unit costs (₦M) and typical duration. Assumptions for play, not
// real tender prices.
export const UNIT = {
  road: { unit: "km", per: 900, def: 10, years: 2, nm: "Road" }, bridge: { unit: "bridge", per: 3500, def: 1, years: 2, nm: "Bridge" },
  hospital: { unit: "bed", per: 25, def: 100, years: 2, nm: "Hospital" }, school: { unit: "classroom", per: 35, def: 40, years: 1, nm: "Primary school" },
  // Education beyond primary (a player asked): sized in student places. For the President, the federal version (fed).
  secondary: { unit: "classroom", per: 40, def: 36, years: 1, nm: "Secondary school", fed: "Federal Government College" },
  nursing: { unit: "student place", per: 2.2, def: 300, years: 2, nm: "School of nursing", fed: "Federal college of nursing" },
  coe: { unit: "student place", per: 1.8, def: 1500, years: 2, nm: "College of education", fed: "Federal college of education" },
  polytechnic: { unit: "student place", per: 2.5, def: 3000, years: 3, nm: "Polytechnic", fed: "Federal polytechnic" },
  university: { unit: "student place", per: 3, def: 5000, years: 3, nm: "University", fed: "Federal university" },
  water: { unit: "borehole scheme", per: 120, def: 20, years: 1, nm: "Water scheme" }, dam: { unit: "dam", per: 6000, def: 1, years: 3, nm: "Dam" },
  power: { unit: "MW", per: 700, def: 5, years: 2, nm: "Power plant" }, market: { unit: "stall", per: 2, def: 500, years: 1, nm: "Market" },
  housing: { unit: "home", per: 18, def: 200, years: 2, nm: "Housing estate" }, vehicles: { unit: "patrol vehicle", per: 45, def: 40, years: 1, nm: "Patrol fleet" },
  cctv: { unit: "camera", per: 3, def: 400, years: 1, nm: "CCTV network" }, landfill: { unit: "site", per: 2500, def: 1, years: 2, nm: "Landfill" },
  industrial: { unit: "hectare", per: 60, def: 50, years: 2, nm: "Industrial park" }, stadium: { unit: "seat", per: .4, def: 10000, years: 3, nm: "Stadium" },
  esports: { unit: "gaming seat", per: 2.5, def: 800, years: 1, nm: "Esports arena" }, tourist: { unit: "site", per: 1800, def: 1, years: 2, nm: "Tourist attraction" },
  // Federal only: the President builds these (game/systems/federal.js).
  rail: { unit: "km", per: 6500, def: 120, years: 4, nm: "Standard-gauge railway" }, pipeline: { unit: "km", per: 900, def: 200, years: 3, nm: "Gas pipeline" },
  refinery: { unit: "thousand-barrel capacity", per: 3200, def: 30, years: 3, nm: "Modular refinery" }, seaport: { unit: "berth", per: 22000, def: 4, years: 4, nm: "Deep seaport" },
  airport: { unit: "terminal", per: 45000, def: 1, years: 3, nm: "Airport terminal" },
};
// Facilities that must be equipped and staffed to work.
export const FACILITY = {
  hospital: { equip: .25, opsPer: 4, what: "beds, theatres and oxygen; doctors and nurses" },   // opsPer: ₦M a year per unit
  school: { equip: .15, opsPer: 6, what: "desks, books and laboratories; teachers" },
  secondary: { equip: .18, opsPer: 7, what: "desks, laboratories and a library; teachers" },
  nursing: { equip: .25, opsPer: .5, what: "skills labs and a teaching ward; nurse tutors" },
  coe: { equip: .15, opsPer: .3, what: "lecture halls, a library and a demonstration school; lecturers" },
  polytechnic: { equip: .25, opsPer: .4, what: "workshops and laboratories; lecturers and technologists" },
  university: { equip: .2, opsPer: .45, what: "laboratories, a library and hostels; lecturers" },
  water: { equip: .1, opsPer: 4, what: "pumps and treatment; operators" },
  power: { equip: .2, opsPer: 24, what: "turbines and lines; engineers" },
  market: { equip: .04, opsPer: .08, what: "stalls fitted; a market management board" },
};

/* Where a project goes changes what it costs. Creeks and swamps (bridges,
   sand-filling, boats for materials) and rocky highlands (blasting) cost more
   per unit. For the President a place is a state; for a governor, an LGA. */
const RIVERINE = /Island|Bonny|Brass|Nembe|Ijaw|Ekeremor|Sagbama|Burutu|Bomadi|Warri|Ilaje|Ese Odo|Epe|Ibeju|Andoni|Opobo|Akuku|Asari|Degema|Okrika|Ogbia|Kolokuma|Yenagoa|Mbo$|Ibeno|Bakassi|Patani|Ogu\/Bolo|Ndokwa East|Anambra West|Ogbaru|Ogun Waterside|Ibaji|Amuwo|Eti-Osa|Badagry|Oguta/;
const ROCKY = /^Jos |Bokkos|Mangu|Barkin Ladi|Riyom|Obudu|Sardauna|Kanam|Wase/;
const RIVERINE_STATES = new Set(["Bayelsa", "Rivers", "Delta"]), ROCKY_STATES = new Set(["Plateau"]);
export const TERRAIN = { riverine: { f: 1.3, nm: "riverine", why: "creeks and swamp: sand-filling, bridges, boats for materials" }, rocky: { f: 1.15, nm: "rocky", why: "hills and rock: blasting and steep grades" } };
export const terrainOf = (place) => { const x = String(place || ""); return RIVERINE_STATES.has(x) || RIVERINE.test(x) ? "riverine" : ROCKY_STATES.has(x) || ROCKY.test(x) ? "rocky" : null; };
// How much one ministry can oversee in a year, in the project's units. A good
// minister (perf 100) manages a quarter more; a weak one (perf 40) a quarter less.
export const CAPACITY = { secondary: 200, nursing: 600, coe: 3000, polytechnic: 4000, university: 5000, road: 150, bridge: 2, hospital: 250, school: 200, water: 60, dam: 1, power: 15, market: 2000, housing: 1500, vehicles: 200, cctv: 2000, landfill: 2, industrial: 150, stadium: 30000, esports: 3000, tourist: 2, rail: 120, pipeline: 250, refinery: 50, seaport: 3, airport: 1 };
export const capacityOf = (type, { perf = 70, federal = false } = {}) => Math.max(1, Math.round((CAPACITY[type] || 100) * (federal ? 2.5 : 1) * (.75 + Math.max(0, Math.min(100, perf)) / 200)));
// A second contractor doubles what can be built in a year, for 12% more.
export const SECOND_CONTRACTOR = 1.12;
/* opts.places: where it goes (spread evenly); opts.perf, opts.federal: the
   ministry's capacity; opts.second: a second contractor. */
export const estimate = (type, qty, opts = {}) => {
  const U = UNIT[type] || UNIT.road, F = FACILITY[type], q = Math.max(0, Number(qty) || U.def);
  const places = (opts.places || []).filter(Boolean), terr = places.map(terrainOf);
  const tf = places.length ? terr.reduce((a, t) => a + (t ? TERRAIN[t].f : 1), 0) / places.length : 1;
  const cap = capacityOf(type, opts) * (opts.second ? 2 : 1), capYears = Math.ceil(q / cap);
  // Spread thin, a programme takes longer: every three more places, a year more.
  const spread = places.length > 1 ? Math.floor((places.length - 1) / 3) : 0;
  const buildM = Math.round(U.per * q * tf * (opts.second ? SECOND_CONTRACTOR : 1));
  const odd = places.filter((x, i) => terr[i]);
  return { qty: q, unit: U.unit, buildM, equipM: F ? Math.round(buildM * F.equip) : 0, opsPerYearM: F ? Math.round(F.opsPer * q) : 0, years: Math.max(U.years, capYears) + spread, facility: !!F,
    cap, capYears, overCap: capYears > U.years, spread, terrainF: Math.round(tf * 100) / 100, hard: odd.map(x => ({ place: x, kind: terrainOf(x) })) };
};
// The size a slider offers: from a small pilot to ten times the starting size.
// A unit's name for n of them: 1 bed, 40 beds, 18 km, 5 MW.
export const unitsOf = (unit, n) => unit + (n === 1 || /^(km|MW)$/.test(unit) ? "" : "s");
export const sizeRange = (type, start) => { const U = UNIT[type] || UNIT.road, b = Math.max(1, Math.round(start || U.def)); return { min: Math.max(1, Math.round(b / 4)), max: Math.max(b * 10, U.def * 10), small: Math.max(1, Math.round(b / 2)), medium: b, large: b * 2 }; };

/* A small reusable roster. Capabilities decide who can bid: a hospital
   surfaces hospital builders, not road gangs. */
export const CONTRACTORS = [
  { id: "kestrel", name: "Kestrel Construction Nig. PLC", sectors: ["roads", "health", "education", "markets", "industry"], capacity: 3, price: 1.08, reliability: .9, speed: .8, quality: .9, integrity: .9, ties: null, note: "Delivers to standard; costs more." },
  { id: "greatwall", name: "Great Wall Road & Rail (Nig.) Ltd", sectors: ["roads", "energy"], capacity: 4, price: .92, reliability: .75, speed: .95, quality: .65, integrity: .65, ties: "federal", note: "Fast and cheap; quality varies; comes with loan strings." },
  { id: "riverside", name: "Riverside Construction Co.", sectors: ["roads", "water", "markets"], capacity: 2, price: 1, reliability: .85, speed: .7, quality: .8, integrity: .85, ties: null, note: "Old, reliable, Nigerian-owned. Small." },
  { id: "medibuild", name: "Medibuild Health Facilities Ltd", sectors: ["health"], capacity: 2, price: 1.05, reliability: .85, speed: .7, quality: .88, integrity: .85, ties: null, note: "Hospital specialist: theatres, oxygen plants, wards built to standard." },
  { id: "cranfield", name: "Cranfield Builders", sectors: ["education", "markets", "health", "sports", "tourism"], capacity: 3, price: .98, reliability: .75, speed: .8, quality: .72, integrity: .75, ties: null, note: "Good on schools and urban work; stretched on big jobs." },
  { id: "aquaplus", name: "AquaPlus Water Engineering", sectors: ["water", "waste"], capacity: 3, price: 1, reliability: .8, speed: .75, quality: .8, integrity: .8, ties: null, note: "Boreholes, treatment plants, landfills." },
  { id: "sunline", name: "Sunline Power Systems", sectors: ["energy"], capacity: 2, price: 1.1, reliability: .85, speed: .7, quality: .86, integrity: .85, ties: null, note: "Solar and grid work, development-bank approved." },
  { id: "danbala", name: "Danbala & Partners", sectors: ["roads", "education", "water", "markets"], capacity: 3, price: 1.03, reliability: .7, speed: .75, quality: .7, integrity: .7, ties: "local", note: "Decent execution; well connected in the local governments." },
  { id: "sentry", name: "Sentry Security Systems", sectors: ["security"], capacity: 3, price: 1, reliability: .85, speed: .9, quality: .8, integrity: .8, ties: null, note: "Vehicles, cameras and control rooms." },
  { id: "bastion", name: "Bastion Construction", sectors: ["roads", "education", "health", "markets", "sports", "water", "tourism"], capacity: 5, price: 1.12, reliability: .55, speed: .6, quality: .55, integrity: .4, ties: "party", note: "The party's favourite contractor. Will take any job." },
  { id: "rainbow", name: "Rainbow Ventures Ltd", sectors: Object.keys(SECTORS), capacity: 9, price: 1.4, reliability: .35, speed: .5, quality: .4, integrity: .1, ties: "family", nepotism: true, note: "Owned by your spouse's cousin." },
  { id: "atlantic", name: "Atlantic Rail & Marine Consortium", sectors: ["roads", "energy", "industry"], capacity: 3, price: 1.1, reliability: .82, speed: .75, quality: .85, integrity: .75, ties: "federal", note: "Rail, ports and pipelines: the heavy federal work, with foreign partners." },
  { id: "muhammad", name: "Alhaji Muhammad & Sons Ltd", sectors: Object.keys(SECTORS), capacity: 9, price: 1.3, reliability: .45, speed: .55, quality: .45, integrity: .15, ties: "godfather", nepotism: true, note: "The godfather's front company." },
];
export const contractorById = (id) => CONTRACTORS.find(c => c.id === id);

/* Companies registered by players (the company_registration product): top
   contractors in their one sector, seen by every player. mineId marks the
   player's own, which they may hire but which is a conflict of interest.
   Called again whenever the list is refreshed; ids stay stable so saves
   that awarded work to a player company keep their contractor. */
export const PLAYER_CO = { price: 1.05, reliability: .92, speed: .88, quality: .92, integrity: .9, capacity: 3 };
export const registerCompanies = (list = [], mineId = null) => {
  (list || []).forEach(x => {
    if (!x || !/^pc_[A-Za-z0-9_-]{4,40}$/.test(x.id || "") || !SECTORS[x.sector]) return;
    const mine = x.id === mineId, prev = CONTRACTORS.find(c => c.id === x.id);
    const c = { id: x.id, name: String(x.name || "").slice(0, 40), sectors: [x.sector], ...PLAYER_CO, ties: mine ? "self" : null, player: true, mine, hires: x.hires || 0, hidden: !!x.hidden,
      note: mine ? "Your own company: 15% comes back to your campaign fund, but corruption rises with every deal and the EFCC is watching." : "★ Player-owned · hired by " + (x.hires || 0) + " governor" + (x.hires === 1 ? "" : "s") + "." };
    if (prev) Object.assign(prev, c); else CONTRACTORS.push(c);
  });
  return CONTRACTORS.filter(c => c.player).length;
};

// Who can bid for this project, and who cannot (and why).
/* Every player's company gets seen (our promise): each tender shows your own,
   the two most hired in the sector, and three more in rotation, so a new
   company with no hires yet comes up in other players' tenders too. key (the
   project's id) keeps one tender's list steady while it is open. */
const hashStr = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
export const rotatePick = (list, n, key) => list.map(c => [hashStr(key + ":" + c.id), c]).sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
export const eligible = (type, projects = [], key = "") => {
  const sector = TYPE_SECTOR[type] || "roads";
  const busy = (id) => projects.filter(p => p.contractorId === id && p.status === "in_progress").length;
  const pc = CONTRACTORS.filter(c => c.player && !c.hidden && c.sectors.includes(sector)).sort((a, b) => (b.mine - a.mine) || (b.hires - a.hires));
  const others = pc.filter(c => !c.mine), top = others.slice(0, 2);
  const shown = pc.filter(c => c.mine).concat(top, rotatePick(others.filter(c => !top.includes(c)), 3, String(key)));
  return shown.concat(CONTRACTORS.filter(c => !c.player && c.sectors.includes(sector))).map(c => ({ ...c, active: busy(c.id), full: busy(c.id) >= c.capacity }));
};

/* The funding check. needM is the full cost of the scope you set. */
export const assessFunding = ({ needM, approvedM, thisYearM, years }) => {
  const short = Math.max(0, needM - approvedM);
  if (short > needM * .05) return {
    kind: "short", shortM: short,
    text: "The budget covers " + Math.round(approvedM / Math.max(1, needM) * 100) + "% of what this scope costs. " + fmtM(short) + " is missing: if you go ahead, the money runs out before the work does.",
    options: ["increase", "reduce", "finance", "defer", "proceed"],
  };
  const perYear = needM / Math.max(1, years);
  if (thisYearM < needM * .95) return { kind: "phased", shortM: 0, text: "Phased: " + fmtM(thisYearM) + " this year against " + fmtM(needM) + " in all over " + years + " year" + (years > 1 ? "s" : "") + ". Fine, as long as each year's money is found." + (thisYearM < perYear * .6 ? " This year's share is light; expect slow progress." : ""), options: [] };
  return { kind: "full", shortM: 0, text: "Fully funded this year.", options: [] };
};

// Make a project record (after the player confirms the proposal and plan).
export const makeProject = ({ id, title, type, qty, lga, lgas, ministryId, need, approvedM, thisYearM, year, years, decision, proposal, perf, federal, second }) => {
  const places = (lgas && lgas.length ? lgas : [lga]).filter(Boolean);
  const e = estimate(type, qty, { places, perf, federal, second });
  const yrs = years || e.years;
  return {
    id, title, type, sector: TYPE_SECTOR[type] || "roads", qty: e.qty, unit: e.unit, lga: places[0] || null, lgas: places, second: !!second, ministryId, need: need || null,
    estimateM: e.buildM, equipM: e.equipM, opsPerYearM: e.opsPerYearM, facility: e.facility, years: yrs,
    approvedM: Math.round(approvedM), alloc: { [year]: Math.round(Math.min(approvedM, thisYearM)) }, spentM: 0, builtM: 0,
    progress: 0, quality: null, status: "pending_procurement", equipped: !e.facility, staffed: !e.facility,
    startYear: year, decisions: decision ? [{ year, text: decision }] : [], events: [], proposal: proposal || null,
    baseCost: e.buildM / 1000, // older code reads ₦B
  };
};
/* The contract sum: the work at the tender's price, times the contractor's rate.
   Budgets carry a 10% contingency, so a contract up to 10% above what was
   approved is covered when it is awarded; anything more stays a shortfall
   (expensive or padded contracts run out of money before the work is done). */
export const CONTINGENCY = .1;
export const contractSum = (p, C, method) => Math.round(p.estimateM * ((PROCUREMENT[method] || PROCUREMENT.open).price) * ((C && C.price) || 1));
export const contractCover = (p, C, method) => {
  const sum = contractSum(p, C, method), over = sum - p.approvedM;
  return { sum, over: Math.max(0, over), covered: over <= p.approvedM * CONTINGENCY, approvedM: over > 0 && over <= p.approvedM * CONTINGENCY ? sum : p.approvedM };
};
// The money still needed to finish: the work left at this contractor's rate (a crooked
// one pads it), less what is approved and unspent.
export const toFinishM = (p, cor = 0) => { const C = contractorById(p.contractorId); const rate = C ? C.price * (C.integrity < .5 ? 1 + (1 - C.integrity) * .25 + cor * .15 : 1) : 1; return Math.max(0, Math.round(remainingM(p) * rate - Math.max(0, p.approvedM - p.spentM))); };
export const committedM = (p) => Math.max(0, p.approvedM - p.spentM);
export const remainingM = (p) => Math.max(0, p.estimateM - p.builtM);

/* Trouble at the site, at most once a year: a riverine site floods (a quarter
   of the year's work lost); elsewhere landowners or community youths block it
   until they are paid (a third lost). Seeded, so a reload never changes it. */
export const siteTrouble = (p, year, r = Math.random) => {
  const places = (p.lgas && p.lgas.length ? p.lgas : [p.lga]).filter(Boolean); if (!places.length) return null;
  const x = places[Math.floor(r() * places.length)], t = terrainOf(x), roll = r();
  if (t === "riverine" && roll < .18) return { kind: "flood", place: x, f: .75, text: "the river rose at the " + x + " site and swept away part of the works; a quarter of the year's work was lost." };
  if (!t && roll < .1 && ["road", "housing", "market", "industrial", "dam", "school", "hospital"].includes(p.type)) return { kind: "land", place: x, f: .66, text: "landowners in " + x + " blocked the site until they were compensated; a third of the year's work was lost." };
  return null;
};

/* One year of work. alloc for the year (default: an even share of what is
   approved and unspent) is the most that can be paid. */
export const tickProject = (p, year, ctx = {}) => {
  if (p.status !== "in_progress") return { p, events: [] };
  if (p.ticked && p.ticked >= year) return { p, events: [] }; // once a year
  const C = contractorById(p.contractorId) || CONTRACTORS[0];
  const r = seeded("project", p.id, year);
  const events = [];
  const left = Math.max(0, p.approvedM - p.spentM);
  const yearsLeft = Math.max(1, p.startYear + p.years - year);
  let avail = Math.min(left, p.alloc && p.alloc[year] != null ? p.alloc[year] : Math.ceil(left / yearsLeft));
  // ctx.cashM: what the state's bank can pay this year; loan money already
  // disbursed for this project (p.loanLeftM) is used first.
  if (ctx.cashM != null) avail = Math.min(avail, Math.max(0, ctx.cashM) + (p.loanLeftM || 0));
  const toBuild = remainingM(p);
  // What the contractor would do this year with enough money. A good firm keeps
  // close to plan (speed .8 → on schedule); slow or unreliable ones fall behind.
  const pace = (p.estimateM / p.years) * (.6 + .5 * C.speed) * (1 + (ctx.boost || 0)) * (.8 + r() * .4) * (r() < C.reliability ? 1 : .55);
  // Skimming. An honest firm (integrity .5 and up) skims by building worse, not by
  // over-billing, so a project funded at its contract sum always has the money to finish.
  // A crooked one pads the bill: money that buys nothing, and the budget runs dry.
  const site = siteTrouble(p, year, r);
  const leak = (1 - C.integrity) * .25 + (ctx.cor || 0) * .15;
  const crooked = C.integrity < .5;
  const price = C.price * (1 + (crooked ? leak : 0));
  const affordable = avail / price;
  const value = Math.max(0, Math.min(toBuild, pace * (site ? site.f : 1), affordable));
  const pay = Math.round(value * price);
  let quality = C.quality - (ctx.cor || 0) * .2 + (ctx.oversight || 0) * .08 - (crooked ? 0 : leak * .4);
  // Short of money only if it held back work the contractor could have done (not in a last, small year).
  if (affordable < Math.min(pace, toBuild) * .7) { quality -= .12; events.push("Year " + year + ": not enough money released; the contractor cut corners to keep going."); }
  if (r() > C.reliability + .1) events.push("Year " + year + ": " + C.name + " missed its milestones.");
  // The ground itself: floods on riverine sites; landowners who block a site until they are paid.
  if (site) events.push("Year " + year + ": " + site.text);
  quality = Math.max(.15, Math.min(.98, quality));
  const builtM = p.builtM + Math.round(value);
  const prevQ = p.quality == null ? quality : p.quality;
  const q = p.builtM + value > 0 ? (prevQ * p.builtM + quality * value) / (p.builtM + value) : quality;
  let status = "in_progress";
  // Within 2% of the end counts as done: the last snags are cleared at handover.
  if (builtM >= p.estimateM * .98 - 1) status = p.facility && !(p.equipped && p.staffed) ? "built" : "delivered";
  else if (p.approvedM - (p.spentM + pay) < 1 && builtM < p.estimateM - 1) { status = "stalled"; events.push("Year " + year + ": the approved money is spent and " + fmtM(p.estimateM - builtM) + " of work is not done. The contractor has left the site."); }
  else if (value < 1) { status = "stalled"; events.push("Year " + year + ": no money released this year; work stopped."); }
  // Money borrowed for this project is spent first; the rest comes from ctx.cashM (the state's bank).
  const fromLoan = Math.min(p.loanLeftM || 0, pay);
  const n = { ...p, loanLeftM: Math.max(0, (p.loanLeftM || 0) - fromLoan), spentM: p.spentM + pay, builtM, progress: Math.min(100, Math.round(builtM / p.estimateM * 100)), quality: Math.round(q * 100) / 100, status, ticked: year,
    events: [...(p.events || []), ...events], cost: (p.spentM + pay) / 1000 };
  return { p: n, events, paidM: pay, cashUsedM: pay - fromLoan };
};

// What the finished project is worth, 0–1: quality × scope built × whether it works.
export const benefitFactor = (p) => {
  const built = p.estimateM ? Math.min(1, p.builtM / p.estimateM) : 0;
  const working = p.facility ? (p.equipped ? (p.staffed ? 1 : .55) : .25) : 1;
  return Math.round((p.quality == null ? .7 : p.quality) * built * working * 100) / 100;
};

/* Recovery. Sunk money stays sunk; nothing is charged twice. */
export const addFunding = (p, m, year) => ({ ...p, approvedM: p.approvedM + Math.round(m), alloc: { ...p.alloc, [year]: (p.alloc[year] || 0) + Math.round(m) }, status: p.status === "stalled" ? "in_progress" : p.status, decisions: [...p.decisions, { year, text: "Added " + fmtM(m) + "." }] });
export const reduceScope = (p, factor, year) => {
  const f = Math.max(.2, Math.min(1, factor));
  const est = Math.max(p.builtM, Math.round(p.estimateM * f));
  return { ...p, qty: Math.round(p.qty * f * 10) / 10, estimateM: est, equipM: Math.round(p.equipM * f), opsPerYearM: Math.round(p.opsPerYearM * f), decisions: [...p.decisions, { year, text: "Scope cut to " + Math.round(f * 100) + "%." }] };
};
/* When no lender will fund it: cut the scope to what the budget line can pay
   over the project's years. Nothing is borrowed; it goes to procurement. */
export const fitScope = (p, roomPerYearM, year) => {
  const fundable = Math.max(0, Math.round(roomPerYearM)) * Math.max(1, p.years || 1);
  const f = fundable / Math.max(1, p.estimateM);
  if (f < .2) return { ok: false, why: "The bank can pay only " + fmtM(fundable) + " over " + (p.years || 1) + " years, under a fifth of the scope. Defer it, or raise the line in next year's budget." };
  if (f >= 1) return { ok: true, p: { ...p, status: "pending_procurement", needM: 0, decisions: [...p.decisions, { year, text: "Paid from the budget line, without a loan." }] }, factor: 1 };
  const q = reduceScope(p, f, year);
  return { ok: true, factor: f, p: { ...q, approvedM: q.estimateM, needM: 0, status: "pending_procurement", alloc: { ...p.alloc, [year]: Math.min(q.estimateM, Math.round(roomPerYearM)) } } };
};
export const replaceContractor = (p, newId, year) => {
  const remob = Math.round(remainingM(p) * .08); // remobilisation: a new contractor prices the handover
  return { ...p, contractorId: newId, contractor: (contractorById(newId) || {}).name, status: remainingM(p) > 0 ? "in_progress" : p.status, estimateM: p.estimateM + remob, decisions: [...p.decisions, { year, text: "Replaced the contractor; handover adds " + fmtM(remob) + "." }] };
};
export const repairCostM = (p) => Math.round(p.builtM * Math.max(0, .7 - (p.quality || .7)) * .5);
export const repair = (p, year) => ({ ...p, quality: Math.max(p.quality || 0, .72), approvedM: p.approvedM + repairCostM(p), spentM: p.spentM + repairCostM(p), decisions: [...p.decisions, { year, text: "Repaired defects for " + fmtM(repairCostM(p)) + "." }] });
export const equip = (p, year) => ({ ...p, equipped: true, spentM: p.spentM + p.equipM, approvedM: p.approvedM + p.equipM, status: p.status === "built" && p.staffed ? "delivered" : p.status, decisions: [...p.decisions, { year, text: "Equipped for " + fmtM(p.equipM) + "." }] });
export const staff = (p, year) => ({ ...p, staffed: true, status: p.status === "built" && p.equipped ? "delivered" : p.status, decisions: [...p.decisions, { year, text: "Staffed: " + fmtM(p.opsPerYearM) + " a year from now on." }] });
export const suspend = (p, year) => ({ ...p, status: "suspended", decisions: [...p.decisions, { year, text: "Suspended. " + fmtM(p.spentM) + " spent so far." }] });
export const abandon = (p, year) => ({ ...p, status: "abandoned", decisions: [...p.decisions, { year, text: "Abandoned. " + fmtM(p.spentM) + " sunk; " + fmtM(remainingM(p)) + " of work never done." }] });

// How the contract is let.
export const PROCUREMENT = {
  open: { nm: "Open competitive tender", price: .95, cor: -.01, note: "Advertised and opened in public. Cheapest and cleanest; the contractor you can pick must still be qualified." },
  selective: { nm: "Selective tender", price: 1, cor: 0, note: "Pre-qualified firms only. Normal for specialist work." },
  sole: { nm: "Direct award", price: 1.15, cor: .04, note: "No competition. Fast; costs more; the Bureau of Public Procurement will ask questions." },
};
// Which budget line pays for which sector's capital work.
export const BUDGET_LINE = { roads: "infrastructure", markets: "infrastructure", industry: "infrastructure", energy: "infrastructure", waste: "infrastructure", sports: "infrastructure", water: "infrastructure", health: "health", education: "education", security: "security" };

/* ── The next step: ONE answer used by the adviser, the project card and the
   hub, so they can never disagree. Returns what to do now, what blocks it,
   or that nothing is due yet and when it will be. ── */
export const MILESTONES = [
  ["proposed", "Proposed"], ["approved", "Budget approved"], ["financed", "Money found"], ["contracted", "Contract signed"],
  ["building", "Under construction"], ["built", "Built"], ["working", "Open and working"],
];
export const milestoneOf = (p) => {
  if (!p) return 0;
  if (p.status === "delivered") return 6;
  if (p.status === "built") return 5;
  if (["in_progress", "stalled", "suspended", "abandoned"].includes(p.status)) return 4;
  if (p.status === "pending_procurement") return 2;
  if (p.status === "pending_finance") return 1;
  return 0;
};
const short = (p) => (UNIT[p.type] ? UNIT[p.type].nm.toLowerCase() : "project");
export const nextStep = (p, ctx = {}) => {
  if (!p) return { id: "none", due: false, say: "" };
  const t = p.title;
  if (p.status === "pending_finance") {
    const tried = (ctx.tried || []).length, total = Object.keys(ctx.lenders || {}).length || 4;
    if (tried >= total) return { id: "blocked_finance", due: true, blocked: true, button: "Revise the scope", say: "Governor, every lender has turned down " + t + ". It cannot start until the scope fits what the bank can pay, or you defer it.", options: ["reduce", "defer"] };
    return { id: "finance", due: true, button: "Find the money", say: "Governor, " + t + " is approved, but the bank can't pay for it this year. The next step is to find the money: a loan offer, or a smaller scope." };
  }
  if (p.status === "pending_procurement") {
    const free = eligible(p.type, ctx.projects || []).filter(c => !c.full);
    if (!free.length) return { id: "blocked_contractor", due: true, blocked: true, button: "See the bidders", say: "Every qualified " + short(p) + " contractor is busy. One frees up when one of their projects finishes at year end." };
    return { id: "contractor", due: true, button: "Review " + short(p) + " procurement", say: "Governor, " + t + " is approved and the money is in place. The next step is to review its procurement and award the contract." };
  }
  if (p.status === "in_progress") return { id: "wait", due: false, say: t + " is under construction. Progress is measured at the end of the year.", when: "year end" };
  if (p.status === "stalled") return { id: "stalled", due: true, blocked: true, button: "Fix the funding", say: t + " has stalled: " + fmtM(remainingM(p)) + " of work is left and the approved money is spent. Add funding, cut the scope or change the contractor." };
  if (p.status === "built") return { id: !p.equipped ? "equip" : "staff", due: true, button: !p.equipped ? "Equip it (" + fmtM(p.equipM) + ")" : "Staff it (" + fmtM(p.opsPerYearM) + " a year)", say: t + " is built but empty. It needs " + (FACILITY[p.type] || {}).what + " before it serves anyone." };
  if (p.status === "suspended") return { id: "resume", due: false, button: "Resume", say: t + " is suspended by your order." };
  if (p.status === "delivered" && (p.quality || 1) < .6) return { id: "repair", due: true, button: "Repair defects", say: t + " is open, but badly built. Repairs cost " + fmtM(repairCostM(p)) + "." };
  return { id: "none", due: false, say: t + (p.status === "delivered" ? " is open and working." : p.status === "abandoned" ? " was abandoned." : "") };
};

/* Saves made before this model held projects with only baseCost/progress
   (and the "Resume procurement" ones stuck waiting for a screen that no
   longer exists). Convert them; nothing is charged again. */
const OLD_NAME_ID = { kestrel: "kestrel", great: "greatwall", riverside: "riverside", danbala: "danbala", bastion: "bastion", rainbow: "rainbow", alhaji: "muhammad", sentinel: "kestrel", levant: "cranfield", cranfield: "cranfield", continental: "rainbow", best: "bastion" };
export const migrateOldProject = (p, year) => {
  if (!p || p.estimateM != null) return p;
  const type = UNIT[p.type] ? p.type : "road";
  const est = Math.max(100, Math.round(((p.cost || p.baseCost || 1) * 1) * 1000));
  const built = Math.round(est * Math.min(100, p.progress || 0) / 100);
  const status = p.status === "pending_procurement" ? (p.fin ? "pending_procurement" : "pending_finance")
    : ["in_progress", "delivered", "suspended", "abandoned"].includes(p.status) ? p.status : "pending_finance";
  const key = String(p.contractor || "").toLowerCase().split(/\s+/)[0];
  const facility = !!FACILITY[type];
  return {
    ...p, type, sector: TYPE_SECTOR[type], qty: p.qty || Math.max(1, Math.round(est / UNIT[type].per)), unit: UNIT[type].unit,
    estimateM: est, equipM: facility ? Math.round(est * FACILITY[type].equip) : 0, opsPerYearM: 0, facility, years: UNIT[type].years,
    approvedM: est, alloc: {}, spentM: built, builtM: built, progress: Math.round(built / est * 100), quality: typeof p.effective === "number" ? Math.round(p.effective * 100) / 100 : null,
    status, equipped: true, staffed: true, startYear: p.startTurn || year, contractorId: p.contractor ? (OLD_NAME_ID[key] || "kestrel") : null,
    decisions: [...(p.decisions || []), { year, text: "Carried over from an earlier save." }], events: p.events || [], migrated: true,
  };
};
