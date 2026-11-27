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
import { stateKind, STATE_TERRAIN, profileOf } from "./stateprofile.js";

export const SECTORS = {
  roads: "Roads and transport", health: "Health facilities", education: "Schools and colleges", water: "Water and sanitation",
  energy: "Power", markets: "Markets and housing", security: "Security equipment", waste: "Waste", industry: "Industrial estates", sports: "Sports", tourism: "Tourism and culture",
};
export const TYPE_SECTOR = { road: "roads", bridge: "roads", hospital: "health", school: "education", secondary: "education", nursing: "health", coe: "education", polytechnic: "education", university: "education", water: "water", dam: "water", power: "energy", market: "markets", housing: "markets", vehicles: "security", cctv: "security", landfill: "waste", industrial: "industry", stadium: "sports", esports: "sports", tourist: "tourism", rail: "roads", airport: "roads", seaport: "industry", refinery: "industry", pipeline: "energy", metro: "roads", busterminal: "roads" };

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
  // Transport (owner, 25 Nov 2026: "for the presidency it is interstate; for a state it could be intra-state rail or metro").
  metro: { unit: "km", per: 900, def: 20, years: 3, nm: "Light rail / metro line" },
  busterminal: { unit: "terminal", per: 500, def: 3, years: 1, nm: "Bus terminal", fed: "Interstate bus terminal" },
};
/* Expected build time in months (owner, 27 Nov 2026: a player asked how long projects should take; "just show
   Expected: 18 months"). Each figure sits inside the project's last year in play, so a 2-year job says 13 to 24 months. */
export const BUILD_MONTHS = { road: 18, bridge: 20, hospital: 20, school: 9, secondary: 10, nursing: 18, coe: 20, polytechnic: 30, university: 32,
  water: 8, dam: 30, power: 20, market: 10, housing: 18, vehicles: 4, cctv: 8, landfill: 15, industrial: 18, stadium: 30, esports: 10, tourist: 16,
  rail: 42, pipeline: 30, refinery: 28, seaport: 44, airport: 32, metro: 32, busterminal: 10 };
export const expectedMonths = (type, years) => { const U = UNIT[type] || {}, base = BUILD_MONTHS[type] || (U.years || 1) * 12 - 4, y = years || U.years || 1;
  return Math.max((y - 1) * 12 + 1, Math.min(y * 12, base + (y - (U.years || 1)) * 12)); };
/* Small works (owner, 23 Nov 2026: "let projects needing contractors go through contractors… we have many click and
   click"): the neighbourhood jobs, the quick wins and the small repairs in letters are tendered like any project, in one
   year, and pay off when they are finished, as well as the contractor did them. art: the picture on the projects screen
   (public/art/works/, docs/LOVABLE-WORKS.md), with a stand-in until it arrives. */
export const WORKS = {
  patch: { unit: "km", per: 60, nm: "Road patching", sector: "roads", art: "works/road-patching", alt: "backgrounds/road-construction-site" },
  potholes: { unit: "km", per: 45, nm: "Pothole repairs", sector: "roads", art: "works/pothole-repairs", alt: "backgrounds/road-construction-site" },
  borehole: { unit: "borehole", per: 75, nm: "Borehole", sector: "water", art: "works/borehole-drilling", alt: "backgrounds/project-site-cleared" },
  handpump: { unit: "hand pump", per: 15, nm: "Hand pump repairs", sector: "water", art: "works/hand-pump-repair", alt: "backgrounds/project-site-cleared" },
  drains: { unit: "km of drain", per: 25, nm: "Drain clearing", sector: "water", art: "works/drain-clearing", alt: "backgrounds/project-site-cleared" },
  roof: { unit: "school", per: 50, nm: "School roof repair", sector: "education", art: "works/school-roof-repair", alt: "backgrounds/project-site-halfway" },
  marketfix: { unit: "market", per: 80, nm: "Market clean-up and lights", sector: "markets", art: "works/market-lights", alt: "backgrounds/project-site-halfway" },
  streetlights: { unit: "km of streetlights", per: 60, nm: "Streetlights", sector: "roads", art: "works/streetlights", alt: "backgrounds/project-site-halfway" },
  clinicfix: { unit: "clinic", per: 400, nm: "Clinic renovation", sector: "health", art: "works/clinic-renovation", alt: "backgrounds/project-site-halfway" },
  gully: { unit: "site", per: 600, nm: "Erosion control", sector: "water", art: "works/erosion-control", alt: "backgrounds/gully-erosion" },
  drainage: { unit: "town", per: 600, nm: "Flood drainage", sector: "water", art: "works/flood-drainage", alt: "backgrounds/project-site-cleared" },
  rebuild: { unit: "town", per: 1200, nm: "Rebuilding a town", sector: "markets", art: "works/community-rebuild", alt: "backgrounds/project-site-halfway" },
  marketbuild: { unit: "market", per: 800, nm: "Market rebuilding", sector: "markets", art: "works/market-rebuild", alt: "backgrounds/project-site-halfway" },
  grazing: { unit: "reserve", per: 1000, nm: "Grazing reserve", sector: "water", art: "works/grazing-reserve", alt: "backgrounds/project-site-cleared" },
};
export const isWorks = (type) => !!WORKS[type];
// Readable by name, but not listed: a borehole is not one of the kinds a player proposes as a project.
Object.entries(WORKS).forEach(([k, W]) => { Object.defineProperty(UNIT, k, { value: { unit: W.unit, per: W.per, def: 1, years: 1, nm: W.nm }, enumerable: false }); Object.defineProperty(TYPE_SECTOR, k, { value: W.sector, enumerable: false }); });
/* A small job as a project: { type, costM, lga, title }. The scope is sized to the money (at least one unit). */
export const worksQty = (type, costM) => Math.max(1, Math.round((costM || WORKS[type].per) / WORKS[type].per));
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
export const TERRAIN = { riverine: { f: 1.3, nm: "riverine", why: "creeks and swamp: sand-filling, bridges, boats for materials" }, rocky: { f: 1.15, nm: "rocky", why: "hills and rock: blasting and steep grades" }, ...STATE_TERRAIN };
/* A place's terrain, or else (opts.state) what the state's land does to this type of work: gullies in the South-East,
   land compensation in Lagos, strong sun for solar and a deep water table in the far north (SYS.stateKind). */
export const terrainFor = (place, state, type) => terrainOf(place) || (state ? stateKind(state, type) : null);
export const terrainOf = (place) => { const x = String(place || ""); return RIVERINE_STATES.has(x) || RIVERINE.test(x) ? "riverine" : ROCKY_STATES.has(x) || ROCKY.test(x) ? "rocky" : null; };
// How much one ministry can oversee in a year, in the project's units. A good
// minister (perf 100) manages a quarter more; a weak one (perf 40) a quarter less.
export const CAPACITY = { metro: 15, busterminal: 8, secondary: 200, nursing: 600, coe: 3000, polytechnic: 4000, university: 5000, road: 150, bridge: 2, hospital: 250, school: 200, water: 60, dam: 1, power: 15, market: 2000, housing: 1500, vehicles: 200, cctv: 2000, landfill: 2, industrial: 150, stadium: 30000, esports: 3000, tourist: 2, rail: 120, pipeline: 250, refinery: 50, seaport: 3, airport: 1 };
export const capacityOf = (type, { perf = 70, federal = false } = {}) => Math.max(1, Math.round((CAPACITY[type] || (WORKS[type] ? 1000 : 100)) * (federal ? 2.5 : 1) * (.75 + Math.max(0, Math.min(100, perf)) / 200)));
/* Speed it up (owner, 27 Nov 2026: "most projects may not be completed before I leave office. If I choose to speed it
   up, it cuts the time by half"): a second contractor on site halves the expected months, for 25% more. */
export const SECOND_CONTRACTOR = 1.25;
/* opts.places: where it goes (spread evenly); opts.perf, opts.federal: the
   ministry's capacity; opts.second: sped up, with a second contractor. */
export const estimate = (type, qty, opts = {}) => {
  const U = UNIT[type] || UNIT.road, F = FACILITY[type], q = Math.max(0, Number(qty) || U.def);
  // For the President a place is a state: its own land decides (a road in Anambra's gullies, solar in Sokoto's sun).
  const places = (opts.places || []).filter(Boolean), terr = places.map(x => terrainFor(x, opts.state || (opts.federal ? String(x).replace(/ /g, "_") : null), type));
  const tf = places.length ? terr.reduce((a, t) => a + (t ? TERRAIN[t].f : 1), 0) / places.length : 1;
  const cap = capacityOf(type, opts), capYears = Math.ceil(q / cap);
  // Spread thin, a programme takes longer: every three more places, a year more.
  const spread = places.length > 1 ? Math.floor((places.length - 1) / 3) : 0;
  // opts.costF: the answer to the programme's local question (SYS.applyLocalPick), e.g. escorts for the crews.
  const buildM = Math.round(U.per * q * tf * (opts.second ? SECOND_CONTRACTOR : 1) * (opts.costF || 1));
  const odd = places.filter((x, i) => terr[i]);
  const years0 = Math.max(U.years, capYears) + spread, months0 = expectedMonths(type, years0), months = opts.second ? Math.ceil(months0 / 2) : months0;
  return { qty: q, unit: U.unit, buildM, equipM: F ? Math.round(buildM * F.equip) : 0, opsPerYearM: F ? Math.round(F.opsPer * q) : 0, years: opts.second ? Math.max(1, Math.ceil(months / 12)) : years0, months, months0, facility: !!F,
    cap, capYears, overCap: capYears > U.years, spread, terrainF: Math.round(tf * 100) / 100, hard: odd.map((x, i) => ({ place: x, kind: terr[places.indexOf(x)] })) };
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
  // The Speaker's own firm (legislature.js SPEAKER_FIRM): offered only for the Speaker's projects, never in a tender.
  { id: "gavel", name: "Mace & Gavel Works Ltd", sectors: Object.keys(SECTORS), capacity: 9, price: 1.25, reliability: .5, speed: .55, quality: .5, integrity: .2, ties: "speaker", speakerFirm: true, note: "The Speaker's pre-approved contractor. His members' cut is in the price." },
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
  // A firm that fled with a mobilisation fee never bids again (owner, 23 Nov 2026).
  const fledIds = new Set(projects.filter(p => p.fledId).map(p => p.fledId)), fledNames = new Set(projects.filter(p => p.fledFirm).map(p => p.fledFirm));
  return shown.concat(CONTRACTORS.filter(c => !c.player && !c.speakerFirm && c.sectors.includes(sector))).filter(c => !fledIds.has(c.id) && !fledNames.has(c.name)).map(c => ({ ...c, active: busy(c.id), full: busy(c.id) >= c.capacity }));
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
export const makeProject = ({ id, title, type, qty, lga, lgas, ministryId, need, approvedM, thisYearM, year, years, decision, proposal, perf, federal, second, state, costF, pick }) => {
  const places = (lgas && lgas.length ? lgas : [lga]).filter(Boolean);
  const e = estimate(type, qty, { places, perf, federal, second, state, costF });
  const yrs = years || e.years;
  return {
    id, title, type, sector: TYPE_SECTOR[type] || "roads", qty: e.qty, unit: e.unit, lga: places[0] || null, lgas: places, second: !!second, ministryId, need: need || null,
    estimateM: e.buildM, equipM: e.equipM, opsPerYearM: e.opsPerYearM, facility: e.facility, years: yrs,
    approvedM: Math.round(approvedM), alloc: { [year]: Math.round(Math.min(approvedM, thisYearM)) }, spentM: 0, builtM: 0,
    progress: 0, quality: null, status: "pending_procurement", equipped: !e.facility, staffed: !e.facility,
    startYear: year, decisions: decision ? [{ year, text: decision }] : [], events: [], proposal: proposal || null,
    baseCost: e.buildM / 1000, // older code reads ₦B
    ...(state ? { state } : {}), ...(costF && costF !== 1 ? { costF } : {}), ...(pick ? { pick } : {}),
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
const rateOf = (p, cor = 0) => { const C = contractorById(p.contractorId); return C ? C.price * (C.integrity < .5 ? 1 + (1 - C.integrity) * .25 + cor * .15 : 1) : 1; };
export const toFinishM = (p, cor = 0) => Math.max(0, Math.round(remainingM(p) * rateOf(p, cor) - Math.max(0, p.approvedM - p.spentM)));
// The share of the scope the money left can finish: what is built, plus what the unspent money buys.
export const scopeThatFits = (p, cor = 0) => p.estimateM ? Math.min(1, (p.builtM + Math.max(0, p.approvedM - p.spentM) / rateOf(p, cor)) / p.estimateM) : 1;
export const committedM = (p) => Math.max(0, p.approvedM - p.spentM);
export const remainingM = (p) => Math.max(0, p.estimateM - p.builtM);

/* Trouble at the site, at most once a year: a riverine site floods (a quarter
   of the year's work lost); elsewhere landowners or community youths block it
   until they are paid (a third lost). Seeded, so a reload never changes it. */
export const siteTrouble = (p, year, r = Math.random) => {
  const places = (p.lgas && p.lgas.length ? p.lgas : [p.lga]).filter(Boolean); if (!places.length) return null;
  const x = places[Math.floor(r() * places.length)], t = terrainFor(x, p.state, p.type), roll = r();
  if (t === "riverine" && roll < .18) return { kind: "flood", place: x, f: .75, text: "the river rose at the " + x + " site and swept away part of the works; a quarter of the year's work was lost." };
  // The state's own trouble (SYS.profileOf): a gully opens in the rains; gunmen in bandit country (unless the crews have escorts).
  if (t === "gully" && roll < .14) return { kind: "gully", place: x, f: .75, text: "a gully opened beside the " + x + " site in the rains and took part of the works; a quarter of the year's work was lost." };
  if (p.state && roll < .12 && !["escort", "army", "walls", "quarters", "oversight"].includes(p.pick)) { const P = profileOf(p.state); if (P.bandits || P.insurgency) return { kind: "attack", place: x, f: .6, text: "gunmen attacked the " + x + " site and the crew fled; two fifths of the year's work was lost." }; }
  if (!t && roll < .1 && ["road", "housing", "market", "industrial", "dam", "school", "hospital"].includes(p.type)) return { kind: "land", place: x, f: .66, text: "landowners in " + x + " blocked the site until they were compensated; a third of the year's work was lost." };
  return null;
};

/* One year of work. alloc for the year (default: an even share of what is
   approved and unspent) is the most that can be paid. */
export const tickProject = (p, year, ctx = {}) => {
  if (p.status !== "in_progress") return { p, events: [] };
  if (p.ticked && p.ticked >= year) return { p, events: [] }; // once a year
  // A strike (ctx.halt 0 = stopped, .5 = slowed; ctx.haltWhy says who walked out): a stopped site builds nothing and is paid nothing.
  if (ctx.halt === 0) { const ev = "Year " + year + ": " + (ctx.haltWhy || "the workers are on strike") + "; nothing was built."; return { p: { ...p, ticked: year, events: [...(p.events || []), ev] }, events: [ev], paidM: 0, cashUsedM: 0 }; }
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
  const value = Math.max(0, Math.min(toBuild, pace * (site ? site.f : 1) * (ctx.halt != null ? ctx.halt : 1), affordable));
  const pay = Math.round(value * price);
  let quality = C.quality - (ctx.cor || 0) * .2 + (ctx.oversight || 0) * .08 - (crooked ? 0 : leak * .4);
  // Short of money only if it held back work the contractor could have done (not in a last, small year).
  if (affordable < Math.min(pace, toBuild) * .7) { quality -= .12; events.push("Year " + year + ": not enough money released; the contractor cut corners to keep going."); }
  if (r() > C.reliability + .1) events.push("Year " + year + ": " + C.name + " missed its milestones.");
  // The ground itself: floods on riverine sites; landowners who block a site until they are paid.
  if (site) events.push("Year " + year + ": " + site.text);
  if (ctx.halt != null && ctx.halt < 1) events.push("Year " + year + ": " + (ctx.haltWhy || "the workers are on strike") + "; work went at half pace.");
  quality = Math.max(.15, Math.min(.98, quality));
  const builtM = p.builtM + Math.round(value);
  const prevQ = p.quality == null ? quality : p.quality;
  const q = p.builtM + value > 0 ? (prevQ * p.builtM + quality * value) / (p.builtM + value) : quality;
  let status = "in_progress";
  // Within 2% of the end counts as done: the last snags are cleared at handover.
  if (builtM >= p.estimateM * .98 - 1) status = p.facility && !(p.equipped && p.staffed) ? "built" : "delivered";
  else if (p.approvedM - (p.spentM + pay) < 1 && builtM < p.estimateM - 1) { status = "stalled"; events.push("Year " + year + ": the approved money is spent and " + fmtM(p.estimateM - builtM) + " of work is not done. The contractor has left the site."); }
  // No money this year: a project with loan tranches still to come waits for them (idle); otherwise it stalls.
  else if (value < 1) { if (!ctx.moreComing) status = "stalled"; events.push("Year " + year + ": no money released this year" + (ctx.moreComing ? "; the site is idle until the next tranche." : ctx.cashM != null && ctx.cashM < 1 ? ": the bank could not pay this year's share, so work stopped." : "; work stopped.")); }
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

/* Why a stalled project stopped, which decides what restarts it:
   fled: the contractor ran off with the fee (only a new contractor restarts it);
   money: the approved money is spent (add money, or cut the scope to fit);
   cash: the money is approved but the bank could not pay the year's share
   (restart it, and the bank pays at the year's end). */
// Saves from before the flag: the record says the contractor fled, and no one replaced them since.
const fledOf = (p) => p.fled != null ? !!p.fled : (() => { const d = (p.decisions || []).map(x => x.text || ""), f = d.map(t => /fled to/.test(t)).lastIndexOf(true); return f >= 0 && f > d.map(t => /^Replaced the contractor/.test(t)).lastIndexOf(true); })();
export const stallCause = (p) => !p || p.status !== "stalled" ? null : fledOf(p) ? "fled" : toFinishM(p) > 0 ? "money" : "cash";
// A project restarts only if nothing still stops it.
const restartIf = (p) => p.status === "stalled" && !fledOf(p) && toFinishM(p) <= 0 ? { ...p, status: "in_progress" } : p;
/* Recovery. Sunk money stays sunk; nothing is charged twice. */
export const addFunding = (p, m, year) => restartIf({ ...p, approvedM: p.approvedM + Math.round(m), alloc: { ...p.alloc, [year]: (p.alloc[year] || 0) + Math.round(m) }, decisions: [...p.decisions, { year, text: "Added " + fmtM(m) + "." }] });
export const reduceScope = (p, factor, year) => {
  const f = Math.max(.2, Math.min(1, factor));
  const est = Math.max(p.builtM, Math.round(p.estimateM * f));
  return restartIf({ ...p, qty: Math.round(p.qty * f * 10) / 10, estimateM: est, equipM: Math.round(p.equipM * f), opsPerYearM: Math.round(p.opsPerYearM * f), decisions: [...p.decisions, { year, text: "Scope cut to " + Math.round(f * 100) + "%." }] }); // a stalled project that now fits its money restarts
};
/* When no lender will fund it: cut the scope to what the budget line can pay
   over the project's years. Nothing is borrowed; it goes to procurement. */
export const fitScope = (p, roomPerYearM, year) => {
  const fundable = Math.max(0, Math.round(roomPerYearM)) * Math.max(1, p.years || 1);
  const f = fundable / Math.max(1, p.estimateM);
  if (f < .2) return { ok: false, why: "The bank can pay only " + fmtM(fundable) + " over " + (p.years || 1) + " years, under a fifth of the scope. Put it off, or raise the line in next year's budget." };
  if (f >= 1) return { ok: true, p: { ...p, status: "pending_procurement", needM: 0, decisions: [...p.decisions, { year, text: "Paid from the budget line, without a loan." }] }, factor: 1 };
  const q = reduceScope(p, f, year);
  return { ok: true, factor: f, p: { ...q, approvedM: q.estimateM, needM: 0, status: "pending_procurement", alloc: { ...p.alloc, [year]: Math.min(q.estimateM, Math.round(roomPerYearM)) } } };
};
// Restart a project the bank could not pay for: this year's share is released at the year's end.
export const restartWork = (p, year) => { const left = Math.max(0, p.approvedM - p.spentM), share = Math.ceil(left / Math.max(1, (p.startYear || year) + (p.years || 1) - year));
  return { p: { ...p, status: "in_progress", alloc: { ...p.alloc, [year]: Math.max((p.alloc || {})[year] || 0, share) }, decisions: [...p.decisions, { year, text: "Restarted: " + fmtM(share) + " to be paid from the bank this year." }] }, shareM: share }; };
export const replaceContractor = (p, newId, year) => {
  const remob = Math.round(remainingM(p) * .08); // remobilisation: a new contractor prices the handover
  return { ...p, fled: false, contractorId: newId, contractor: (contractorById(newId) || {}).name, status: remainingM(p) > 0 ? "in_progress" : p.status, estimateM: p.estimateM + remob, decisions: [...p.decisions, { year, text: "Replaced the contractor; handover adds " + fmtM(remob) + "." }] };
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
/* Things bought, not built (owner, 25 Nov 2026: "How can patrol vehicles be under construction?"): their stages,
   their progress and their words are a purchase's. */
export const BUY = {
  vehicles: { steps: ["On order", "Delivered", "On patrol"], doing: "on order: the vehicles are being built at the factory and shipped. Deliveries are counted at the end of the year", stage: "On order", done: "Delivered, not on patrol", tile: "Delivered", art: "../scenes/patrol-fleet" },
  cctv: { steps: ["Being installed", "Installed", "Watching"], doing: "being installed: the cameras go up street by street. Progress is counted at the end of the year", stage: "Being installed", done: "Installed, not switched on", tile: "Installed", art: "../scenes/cctv-install" },
};
export const isBuy = (t) => !!BUY[t];
export const milestonesFor = (p) => { const B = p && BUY[p.type]; return !B ? MILESTONES : MILESTONES.map(([k, l]) => [k, k === "building" ? B.steps[0] : k === "built" ? B.steps[1] : k === "working" ? B.steps[2] : l]); };
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
    if (tried >= total) return { id: "blocked_finance", due: true, blocked: true, button: "Revise the scope", say: "Governor, every lender has turned down " + t + ". It cannot start until the scope fits what the bank can pay, or you put it off.", options: ["reduce", "defer"] };
    return { id: "finance", due: true, button: "Find the money", say: "Governor, " + t + " is approved, but the bank can't pay for it this year. The next step is to find the money: a loan offer, or a smaller scope." };
  }
  if (p.status === "pending_procurement") {
    const free = eligible(p.type, ctx.projects || []).filter(c => !c.full);
    if (!free.length) return { id: "blocked_contractor", due: true, blocked: true, button: "See the bidders", say: "Every qualified " + short(p) + " contractor is busy. One frees up when one of their projects finishes at year end." };
    return { id: "contractor", due: true, button: "Review " + short(p) + " procurement", say: "Governor, " + t + " is approved and the money is in place. The next step is to review its procurement and award the contract." };
  }
  if (p.status === "in_progress") return { id: "wait", due: false, say: BUY[p.type] ? t + " is " + BUY[p.type].doing + "." : t + " is under construction. Progress is measured at the end of the year.", when: "year end" };
  if (p.status === "stalled") { const why = stallCause(p);
    if (why === "fled") return { id: "replace", due: true, blocked: true, button: "Replace the contractor", say: t + " has stalled: the contractor fled with the mobilisation fee. Appoint a new contractor to restart the work." };
    if (why === "money") return { id: "stall_fund", due: true, blocked: true, button: "Add " + fmtM(toFinishM(p)) + " and restart", say: t + " has stalled: the approved money is spent and " + fmtM(remainingM(p)) + " of work is left. Add the money to restart it, or cut the scope to what is approved." };
    return { id: "restart", due: true, blocked: true, button: "Restart the work", say: t + " has stalled: the money is approved, but the bank could not pay this year's share. Restart it, and the bank pays at the year's end." }; }
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

/* The short film shown when a project opens (art/reels/<type>.mp4, 3–4 seconds, made with Gemini; see
   docs/GEMINI-REELS.md). REELS lists the films that exist: a type with two films alternates between them by
   project. A type with none returns null, and the ribbon picture is shown instead. */
export const REELS = {road: 1, hospital: 1, school: 1, water: 1, dam: 1, power: 1, seaport: 1, refinery: 1, vehicles: 1, market: 1, housing: 1, industrial: 1, irrigation: 1, rail: 1, metro: 1, busterminal: 1, interstatebus: 1, stadium: 1, ministadium: 1, fedroad: 1}; // stadium.mp4 and ministadium.mp4: Gemini, 25 Nov 2026 // busterminal.mp4: a town terminal, yellow buses under a steel roof (Gemini, 25 Nov 2026); it also plays for the President's terminals until interstatebus.mp4 arrives // metro.mp4: a light rail over a jammed city road at sunset (Gemini, 25 Nov 2026) // rail.mp4: the green-and-white train across the savannah into a new station (Gemini, 25 Nov 2026) // irrigation.mp4: water down the canal into green dry-season fields (Gemini, 23 Nov 2026) // housing.mp4: a new estate, families moving in; industrial.mp4: an industrial park, trucks at the gate (Gemini, 23 Nov 2026) // market.mp4: a busy covered market (Gemini, 23 Nov 2026) // power.mp4: a town lights up at night; seaport.mp4; refinery.mp4 (Gemini, 22 Nov 2026) // dam.mp4: the lights come on in a village at night (Gemini, 22 Nov 2026)
// A type without its own film borrows a close one (secondary schools use the school film).
export const REEL_SHARE = { secondary: "school", nursing: "hospital", pipeline: "refinery", markets: "market" }; // power plants, solar, gas and mini-grids have their own film now; a gas pipeline shares the refinery's
// A programme with its own film, whatever kind of project it builds (the Irrigation Network builds a dam, but its
// film shows water reaching the fields: docs/GEMINI-REELS.md, irrigation.mp4).
export const REEL_BY_POLICY = { irrigation: "irrigation", kpa_irrigation: "irrigation", rural_elec: "dam", f_bus_terminals: "interstatebus" }; // interstatebus.mp4: the President's interstate terminals; a state's town terminals play busterminal.mp4 // Rural Electrification: the village whose lights come on (dam.mp4), not the town and its market (power.mp4) (owner, 25 Nov 2026)
// A small one of a type has its own film (mini-stadia: up to 10,000 seats).
export const REEL_SMALL = { stadium: { film: "ministadium", maxQty: 10000 } };
/* The President's own films (owner, 25 Nov 2026: "There needs to be a good video of a FEDERAL road for the President;
   the President currently uses the lesser road"). Used once the file is there (the game checks for it and sets REELS). */
export const REEL_FED = { road: "fedroad", bridge: "fedroad" };
export const reelFor = (type, id, src, nat) => {
  if (nat && REEL_FED[type] && REELS[REEL_FED[type]]) type = REEL_FED[type];
  if (src && REEL_BY_POLICY[src] && REELS[REEL_BY_POLICY[src]]) type = REEL_BY_POLICY[src];
  if (!REELS[type] && REEL_SHARE[type]) type = REEL_SHARE[type];
  const n = REELS[type] || 0; if (!n) return null;
  const h = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0), k = n > 1 ? h % n + 1 : 1;
  return "./art/reels/" + type + (k > 1 ? "-" + k : "") + ".mp4";
};

/* A contractor who flees abroad (japa): only the Federal Government can get the money back. The President agrees to
   intervene when the state's standing with Abuja is at least this high (out of 100); the full amount comes back the
   next year. */
export const JAPA_FG_MIN = 50; // owner, 25 Nov 2026: "too high… at least 50/100, don't make it too hard"
/* The President's standing abroad, for asking another country to freeze a fled contractor's money (0-100).
   Countries help a President who shows up (summits and state visits), is popular at home and keeps corruption
   down. 51 or more, and the country acts: the full amount comes home the next year. */
export const JAPA_ABROAD_MIN = 51; // owner, 25 Nov 2026: "for the President maybe 51/100"
export const abroadStanding = ({ trips = 0, app = 50, cor = 0 } = {}) => Math.max(0, Math.min(100, Math.round(35 + trips * 12 + (app - 50) * 0.5 - cor * 30)));
