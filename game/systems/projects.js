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
  energy: "Power", markets: "Markets and housing", security: "Security equipment", waste: "Waste", industry: "Industrial estates", sports: "Sports",
};
export const TYPE_SECTOR = { road: "roads", bridge: "roads", hospital: "health", school: "education", water: "water", dam: "water", power: "energy", market: "markets", housing: "markets", vehicles: "security", cctv: "security", landfill: "waste", industrial: "industry", stadium: "sports" };

// Simulation unit costs (₦M) and typical duration. Assumptions for play, not
// real tender prices.
export const UNIT = {
  road: { unit: "km", per: 900, def: 10, years: 2, nm: "Road" }, bridge: { unit: "bridge", per: 3500, def: 1, years: 2, nm: "Bridge" },
  hospital: { unit: "bed", per: 25, def: 100, years: 2, nm: "Hospital" }, school: { unit: "classroom", per: 35, def: 40, years: 1, nm: "School" },
  water: { unit: "borehole scheme", per: 120, def: 20, years: 1, nm: "Water scheme" }, dam: { unit: "dam", per: 6000, def: 1, years: 3, nm: "Dam" },
  power: { unit: "MW", per: 700, def: 5, years: 2, nm: "Power plant" }, market: { unit: "stall", per: 2, def: 500, years: 1, nm: "Market" },
  housing: { unit: "home", per: 18, def: 200, years: 2, nm: "Housing estate" }, vehicles: { unit: "patrol vehicle", per: 45, def: 40, years: 1, nm: "Patrol fleet" },
  cctv: { unit: "camera", per: 3, def: 400, years: 1, nm: "CCTV network" }, landfill: { unit: "site", per: 2500, def: 1, years: 2, nm: "Landfill" },
  industrial: { unit: "hectare", per: 60, def: 50, years: 2, nm: "Industrial park" }, stadium: { unit: "seat", per: .4, def: 10000, years: 3, nm: "Stadium" },
};
// Facilities that must be equipped and staffed to work.
export const FACILITY = {
  hospital: { equip: .25, opsPer: 4, what: "beds, theatres and oxygen; doctors and nurses" },   // opsPer: ₦M a year per unit
  school: { equip: .15, opsPer: 6, what: "desks, books and laboratories; teachers" },
  water: { equip: .1, opsPer: 4, what: "pumps and treatment; operators" },
  power: { equip: .2, opsPer: 24, what: "turbines and lines; engineers" },
  market: { equip: .04, opsPer: .08, what: "stalls fitted; a market management board" },
};

export const estimate = (type, qty) => {
  const U = UNIT[type] || UNIT.road, F = FACILITY[type], q = Math.max(0, Number(qty) || U.def);
  const buildM = Math.round(U.per * q);
  return { qty: q, unit: U.unit, buildM, equipM: F ? Math.round(buildM * F.equip) : 0, opsPerYearM: F ? Math.round(F.opsPer * q) : 0, years: U.years, facility: !!F };
};

/* A small reusable roster. Capabilities decide who can bid: a hospital
   surfaces hospital builders, not road gangs. */
export const CONTRACTORS = [
  { id: "kestrel", name: "Kestrel Construction Nig. PLC", sectors: ["roads", "health", "education", "markets", "industry"], capacity: 3, price: 1.08, reliability: .9, speed: .8, quality: .9, integrity: .9, ties: null, note: "Delivers to standard; costs more." },
  { id: "greatwall", name: "Great Wall Road & Rail (Nig.) Ltd", sectors: ["roads", "energy"], capacity: 4, price: .92, reliability: .75, speed: .95, quality: .65, integrity: .65, ties: "federal", note: "Fast and cheap; quality varies; comes with loan strings." },
  { id: "riverside", name: "Riverside Construction Co.", sectors: ["roads", "water", "markets"], capacity: 2, price: 1, reliability: .85, speed: .7, quality: .8, integrity: .85, ties: null, note: "Old, reliable, Nigerian-owned. Small." },
  { id: "medibuild", name: "Medibuild Health Facilities Ltd", sectors: ["health"], capacity: 2, price: 1.05, reliability: .85, speed: .7, quality: .88, integrity: .85, ties: null, note: "Hospital specialist: theatres, oxygen plants, wards built to standard." },
  { id: "cranfield", name: "Cranfield Builders", sectors: ["education", "markets", "health", "sports"], capacity: 3, price: .98, reliability: .75, speed: .8, quality: .72, integrity: .75, ties: null, note: "Good on schools and urban work; stretched on big jobs." },
  { id: "aquaplus", name: "AquaPlus Water Engineering", sectors: ["water", "waste"], capacity: 3, price: 1, reliability: .8, speed: .75, quality: .8, integrity: .8, ties: null, note: "Boreholes, treatment plants, landfills." },
  { id: "sunline", name: "Sunline Power Systems", sectors: ["energy"], capacity: 2, price: 1.1, reliability: .85, speed: .7, quality: .86, integrity: .85, ties: null, note: "Solar and grid work, development-bank approved." },
  { id: "danbala", name: "Danbala & Partners", sectors: ["roads", "education", "water", "markets"], capacity: 3, price: 1.03, reliability: .7, speed: .75, quality: .7, integrity: .7, ties: "local", note: "Decent execution; well connected in the local governments." },
  { id: "sentry", name: "Sentry Security Systems", sectors: ["security"], capacity: 3, price: 1, reliability: .85, speed: .9, quality: .8, integrity: .8, ties: null, note: "Vehicles, cameras and control rooms." },
  { id: "bastion", name: "Bastion Construction", sectors: ["roads", "education", "health", "markets", "sports", "water"], capacity: 5, price: 1.12, reliability: .55, speed: .6, quality: .55, integrity: .4, ties: "party", note: "The party's favourite contractor. Will take any job." },
  { id: "rainbow", name: "Rainbow Ventures Ltd", sectors: Object.keys(SECTORS), capacity: 9, price: 1.4, reliability: .35, speed: .5, quality: .4, integrity: .1, ties: "family", nepotism: true, note: "Owned by your spouse's cousin." },
  { id: "muhammad", name: "Alhaji Muhammad & Sons Ltd", sectors: Object.keys(SECTORS), capacity: 9, price: 1.3, reliability: .45, speed: .55, quality: .45, integrity: .15, ties: "godfather", nepotism: true, note: "The godfather's front company." },
];
export const contractorById = (id) => CONTRACTORS.find(c => c.id === id);

// Who can bid for this project, and who cannot (and why).
export const eligible = (type, projects = []) => {
  const sector = TYPE_SECTOR[type] || "roads";
  const busy = (id) => projects.filter(p => p.contractorId === id && p.status === "in_progress").length;
  return CONTRACTORS.filter(c => c.sectors.includes(sector)).map(c => ({ ...c, active: busy(c.id), full: busy(c.id) >= c.capacity }));
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
export const makeProject = ({ id, title, type, qty, lga, ministryId, need, approvedM, thisYearM, year, years, decision, proposal }) => {
  const e = estimate(type, qty);
  const yrs = years || e.years;
  return {
    id, title, type, sector: TYPE_SECTOR[type] || "roads", qty: e.qty, unit: e.unit, lga: lga || null, ministryId, need: need || null,
    estimateM: e.buildM, equipM: e.equipM, opsPerYearM: e.opsPerYearM, facility: e.facility, years: yrs,
    approvedM: Math.round(approvedM), alloc: { [year]: Math.round(Math.min(approvedM, thisYearM)) }, spentM: 0, builtM: 0,
    progress: 0, quality: null, status: "pending_procurement", equipped: !e.facility, staffed: !e.facility,
    startYear: year, decisions: decision ? [{ year, text: decision }] : [], events: [], proposal: proposal || null,
    baseCost: e.buildM / 1000, // older code reads ₦B
  };
};
export const committedM = (p) => Math.max(0, p.approvedM - p.spentM);
export const remainingM = (p) => Math.max(0, p.estimateM - p.builtM);

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
  // ctx.cashM: what the sector's capital budget can pay this year; loan money
  // already disbursed for this project (p.loanLeftM) can top it up.
  if (ctx.cashM != null) avail = Math.min(avail, Math.max(0, ctx.cashM) + (p.loanLeftM || 0));
  const toBuild = remainingM(p);
  // What the contractor would do this year with enough money:
  const pace = (p.estimateM / p.years) * C.speed * (1 + (ctx.boost || 0)) * (.75 + r() * .5) * (r() < C.reliability ? 1 : .55);
  const leak = (1 - C.integrity) * .25 + (ctx.cor || 0) * .15; // money that buys nothing
  const price = C.price * (1 + leak);
  const affordable = avail / price;
  const value = Math.max(0, Math.min(toBuild, pace, affordable));
  const pay = Math.round(value * price);
  let quality = C.quality - (ctx.cor || 0) * .2 + (ctx.oversight || 0) * .08;
  if (affordable < pace * .7) { quality -= .12; events.push("Year " + year + ": not enough money released; the contractor cut corners to keep going."); }
  if (r() > C.reliability + .1) events.push("Year " + year + ": " + C.name + " missed its milestones.");
  quality = Math.max(.15, Math.min(.98, quality));
  const builtM = p.builtM + Math.round(value);
  const prevQ = p.quality == null ? quality : p.quality;
  const q = p.builtM + value > 0 ? (prevQ * p.builtM + quality * value) / (p.builtM + value) : quality;
  let status = "in_progress";
  if (builtM >= p.estimateM - 1) status = p.facility && !(p.equipped && p.staffed) ? "built" : "delivered";
  else if (p.approvedM - (p.spentM + pay) < 1 && builtM < p.estimateM - 1) { status = "stalled"; events.push("Year " + year + ": the approved money is spent and " + fmtM(p.estimateM - builtM) + " of work is not done. The contractor has left the site."); }
  else if (value < 1) { status = "stalled"; events.push("Year " + year + ": no money released this year; work stopped."); }
  const fromLoan = ctx.cashM != null ? Math.min(p.loanLeftM || 0, Math.max(0, pay - Math.max(0, ctx.cashM))) : 0;
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
