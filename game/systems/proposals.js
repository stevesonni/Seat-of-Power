/* Custom projects: from the player's words to a structured proposal.

   Works offline, without a paid AI service: keywords map the text onto the
   project types the simulation supports, numbers with units set the scope,
   and LGA names set the place. The result is shown for confirmation. Vague
   text gets one focused question; things a state government cannot build
   get an explanation instead of invented benefits. */
import { UNIT, FACILITY, SECTORS, TYPE_SECTOR, estimate } from "./projects.js";
const FED_ONLY = ["rail", "pipeline", "refinery", "seaport", "airport"];

const TYPE_WORDS = [
  ["rail", /\b(rail(way)?s?|trains?|standard[- ]gauge|metro line)\b/i],
  ["pipeline", /\b(pipelines?|gas lines?)\b/i],
  ["refinery", /\b(refiner(y|ies))\b/i],
  ["seaport", /\b(seaports?|deep ?sea ports?|ports?|berths?|jett(y|ies))\b/i],
  ["airport", /\b(airports?|terminals?|runways?)\b/i],
  ["esports", /\b(e-?sports?|gaming (arena|cent(re|er)|hub))\b/i],
  ["tourist", /\b(tourists?|tourism|resorts?|heritage sites?|museums?|beach(es)?|attractions?)\b/i],
  ["hospital", /\b(hospital|clinic|health ?cent(re|er)s?|phc|maternity|medical cent(re|er)|wards?|beds?)\b/i],
  ["school", /\b(schools?|classrooms?|college|secondary|primary school|laborator(y|ies)|hostels?)\b/i],
  ["bridge", /\b(bridges?|flyovers?|overpass)\b/i],
  ["road", /\b(roads?|highways?|km|kilomet(re|er)s?|dualisation|dual carriageway|asphalt|tarring)\b/i],
  ["dam", /\b(dams?|irrigation|reservoirs?)\b/i],
  ["water", /\b(boreholes?|water|pipe-?borne|taps?|sanitation|toilets?)\b/i],
  ["power", /\b(power|solar|electric(ity)?|mw|megawatts?|transformers?|mini-?grids?|street ?lights?)\b/i],
  ["market", /\b(markets?|stalls?|shops?)\b/i],
  ["housing", /\b(hous(es|ing)|homes?|estates?|flats|apartments?)\b/i],
  ["cctv", /\b(cctv|cameras?|surveillance)\b/i],
  ["vehicles", /\b(patrol|vehicles?|vans?|security fleet|ambulances?)\b/i],
  ["landfill", /\b(landfills?|waste|refuse|dump(site)?s?|recycling)\b/i],
  ["industrial", /\b(industrial|factor(y|ies)|industry park|economic zone|agro-?processing)\b/i],
  ["stadium", /\b(stadium|sports|arena)\b/i],
];
// Not within a state government's power, or not a capital project.
const UNSUPPORTED = [
  [/\b(army|military|soldiers?|navy|air ?force)\b/i, "The armed forces are federal (Exclusive List). A state can fund vigilance groups or equipment for the police, not an army."],
  [/\b(seaports?|ports? authority|deep ?sea ports?)\b/i, "Seaports are under federal control. A state can build roads to a port, not the port.", "gov"],
  [/\b(railways?|standard[- ]gauge)\b/i, "Railways are on the Exclusive List: the Federal Government builds them. A state can fund a light rail only with federal approval.", "gov"],
  [/\b(nuclear|reactor)\b/i, "Nuclear power is federal and far beyond a state budget."],
  [/\b(print(ing)? money|currency)\b/i, "Only the Central Bank issues currency."],
  [/\b(refiner(y|ies)|oil wells?|gas pipelines?)\b/i, "Refineries need federal licences and private investors; look out for investor proposals on the Desk.", "gov"],
  [/\b(boreholes?|street ?lights?|motor parks?|market stalls?)\b/i, "That is a state or local government's job. The Federal Government can fund it through the states, but not build it itself.", "fed"],
];
const UNIT_WORDS = { rail: /(\d[\d,.]*)\s*(km|kilomet(?:re|er)s?)\s*(of )?(rail|railway|track)/i, pipeline: /(\d[\d,.]*)\s*(km|kilomet(?:re|er)s?)\s*(of )?(gas )?pipe/i, seaport: /(\d+)\s*(berths?)/i, hospital: /(\d[\d,]*)\s*(beds?)/i, school: /(\d[\d,]*)\s*(classrooms?|blocks?)/i, road: /(\d[\d,.]*)\s*(km|kilomet(?:re|er)s?)/i, bridge: /(\d+)\s*(bridges?)/i,
  water: /(\d[\d,]*)\s*(boreholes?|schemes?)/i, dam: /(\d+)\s*(dams?)/i, power: /(\d[\d,.]*)\s*(mw|megawatts?)/i, market: /(\d[\d,]*)\s*(stalls?|shops?)/i, housing: /(\d[\d,]*)\s*(homes?|houses|units|flats)/i,
  cctv: /(\d[\d,]*)\s*(cameras?)/i, vehicles: /(\d[\d,]*)\s*(vehicles?|vans?|ambulances?)/i, landfill: /(\d+)\s*(sites?|landfills?)/i, industrial: /(\d[\d,]*)\s*(hectares?|ha)\b/i, stadium: /(\d[\d,]*)\s*(seats?|capacity)/i };

const BENEFIT = {
  hospital: (q) => "Care for about " + Math.round(q * 800).toLocaleString() + " people a year once equipped and staffed; fewer deaths in childbirth.",
  school: (q) => "Places for about " + Math.round(q * 45).toLocaleString() + " pupils once furnished and staffed.",
  road: (q) => q + " km of usable road: cheaper trips for farmers and traders, fewer accidents.",
  bridge: () => "Joins communities the river cuts off; trade crosses all year.",
  water: (q) => "Clean water for about " + Math.round(q * 2500).toLocaleString() + " people once pumps and operators are in place.",
  dam: () => "Water through the dry season; irrigated farms.",
  power: (q) => q + " MW for homes and businesses once connected and run.",
  market: (q) => q + " stalls; traders pay levies to the state.",
  housing: (q) => q + " homes for workers; rents ease nearby.",
  cctv: (q) => q + " cameras watched from a control room; some crime moves elsewhere.",
  vehicles: (q) => q + " vehicles for patrols or emergencies.",
  landfill: () => "Refuse collected and buried properly; fewer floods from blocked drains.",
  industrial: (q) => q + " hectares serviced for factories; jobs if investors come.",
  stadium: (q) => q.toLocaleString() + " seats; events bring visitors and some revenue.",
  esports: (q) => q.toLocaleString() + " gaming seats; tournaments draw young people and sponsors.",
  tourist: () => "A site that brings visitors, hotels and spending, if someone manages the tourists.",
  rail: (q) => q + " km of railway: freight off the roads, cheaper food from the north, and passengers in hours, not days.",
  pipeline: (q) => q + " km of gas pipeline: gas for power plants and factories along the route.",
  refinery: (q) => (q * 1000).toLocaleString() + " barrels a day refined at home: fewer fuel imports, fewer queues.",
  seaport: (q) => q + " deep-water berths: big ships dock here, and the Lagos ports breathe.",
  airport: () => "A new terminal: more flights, more visitors, and cargo for exporters.",
};

export const parseProposal = (text, { lgas = [], federal = false } = {}) => {
  const t = String(text || "").trim();
  if (t.length < 4) return { status: "clarify", question: "What do you want to build, and where?", choices: Object.keys(UNIT).slice(0, 8) };
  for (const [re, why, who] of UNSUPPORTED) if ((!who || who === (federal ? "fed" : "gov")) && re.test(t)) return { status: "unsupported", why };
  const hits = TYPE_WORDS.filter(([k, re]) => (federal || !FED_ONLY.includes(k)) && re.test(t)).map(([k]) => k);
  if (!hits.length) return { status: "clarify", question: "Which of these is it closest to? The state can build these kinds of projects.", choices: ["road", "hospital", "school", "water", "power", "market", "housing", "cctv"] };
  // "beds" alone is a hospital, "road to the hospital" is a road: prefer the type named with a number, then the first match.
  const numbered = hits.find(k => UNIT_WORDS[k] && UNIT_WORDS[k].test(t));
  const type = numbered || hits[0];
  const assumptions = [];
  let qty = null;
  const m = UNIT_WORDS[type] && t.match(UNIT_WORDS[type]);
  if (m) qty = Number(String(m[1]).replace(/,/g, ""));
  if (!qty || !isFinite(qty) || qty <= 0) { qty = UNIT[type].def; assumptions.push("No size given: assumed " + qty + " " + UNIT[type].unit + (qty === 1 ? "" : "s") + ". Change it below."); }
  const cap = UNIT[type].def * 20; if (qty > cap) { assumptions.push("Scaled down from " + qty + " to " + cap + " " + UNIT[type].unit + "s, the most one project can carry."); qty = cap; }
  const lga = lgas.find(l => new RegExp("\\b" + l.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", "i").test(t)) || null;
  if (!lga) assumptions.push("No local government named: you can pick one below.");
  if (hits.length > 1 && !numbered) assumptions.push("Read as a " + UNIT[type].nm.toLowerCase() + " project (it also mentions " + hits.filter(h => h !== type).map(h => UNIT[h].nm.toLowerCase()).join(", ") + ").");
  const e = estimate(type, qty);
  return {
    status: "ok",
    proposal: {
      name: (UNIT[type].nm + (lga ? " in " + lga : "")).trim(), description: t, type, sector: TYPE_SECTOR[type], sectorName: SECTORS[TYPE_SECTOR[type]],
      lga, qty: e.qty, unit: e.unit, estimateM: e.buildM, equipM: e.equipM, opsPerYearM: e.opsPerYearM, years: e.years, facility: e.facility,
      needs: SECTORS[TYPE_SECTOR[type]] + " contractor" + (FACILITY[type] ? "; then " + FACILITY[type].what : ""),
      benefit: BENEFIT[type](e.qty), assumptions,
    },
  };
};
