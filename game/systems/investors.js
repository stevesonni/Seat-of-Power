/* Investors follow good governance (rules only, no React). When a project
   that business needs is finished (an industrial park, power, a road, a
   tourist site), two foreign firms write to say it brought them, and what
   they will build. How much they commit depends on how the state is run:
   low corruption, public support, security and a well-built project bring
   more; a project where money went missing, or a state known for graft,
   brings less, and one firm may hold back. Every firm is fictional. */
import { seeded } from "./rng.js";

// How strongly each kind of project draws investors (0 = not at all).
export const ATTRACTS = { rail: .8, seaport: .95, refinery: .9, pipeline: .85, airport: .7, industrial: 1, power: .9, dam: .6, road: .55, bridge: .45, tourist: .7, esports: .5, stadium: .4, housing: .5, market: .5, water: .35, vehicles: .3, hospital: .3, school: .2 };

export const FIRMS = [
  { id: "jinhai", flag: "🇨🇳", country: "China", nm: "Jinhai Morning Star Industries", head: "Zhou Wenhai, Chairman", kinds: ["rail", "seaport", "pipeline", "industrial", "power", "dam", "road", "bridge", "housing"] },
  { id: "huaxin", flag: "🇨🇳", country: "China", nm: "Huaxin Pearl River Machinery", head: "Liang Meiyu, Managing Director", kinds: ["rail", "airport", "industrial", "road", "bridge", "market", "vehicles"] },
  { id: "larkspur", flag: "🇺🇸", country: "the United States", nm: "Larkspur Hill Capital", head: "Dana Whitfield, Partner", kinds: ["refinery", "airport", "industrial", "power", "esports", "housing", "hospital"] },
  { id: "bluemesa", flag: "🇺🇸", country: "the United States", nm: "Blue Mesa Agri-Foods Inc.", head: "Marcus Ellery, President", kinds: ["industrial", "dam", "road", "market", "water"] },
  { id: "nordvik", flag: "🇸🇪", country: "Sweden", nm: "Nordvik Energi AB", head: "Ingrid Lindqvist, Chief Executive", kinds: ["pipeline", "refinery", "power", "dam", "industrial", "water", "school"] },
  { id: "holmgren", flag: "🇸🇪", country: "Sweden", nm: "Holmgren & Berg Components AB", head: "Erik Holmgren, Chairman", kinds: ["seaport", "rail", "industrial", "vehicles", "road", "bridge", "hospital"] },
  { id: "rheinfeld", flag: "🇩🇪", country: "Germany", nm: "Rheinfeld Werke GmbH", head: "Klaus Brenner, Managing Director", kinds: ["refinery", "pipeline", "industrial", "power", "vehicles"] },
  { id: "sakuradelta", flag: "🇯🇵", country: "Japan", nm: "Sakura Delta Motors", head: "Hiroshi Tanabe, President", kinds: ["industrial", "road", "vehicles"] },
  { id: "alwaha", flag: "🇦🇪", country: "the United Arab Emirates", nm: "Al Waha Hospitality Group", head: "Omar Al Suwaidi, Chairman", kinds: ["airport", "seaport", "tourist", "stadium", "esports", "housing", "market"] },
  { id: "coastlight", flag: "🇬🇧", country: "the United Kingdom", nm: "Coastlight Leisure plc", head: "Fiona Marsh, Chief Executive", kinds: ["tourist", "stadium", "esports", "hospital"] },
];

// What each firm builds, by the kind of project that drew it.
const WHAT = {
  industrial: ["a factory in the park", "an assembly plant in the park", "a processing plant in the park"],
  power: ["a factory that runs on the new power", "a cold-storage hub on the new supply"],
  dam: ["an irrigated farm estate below the dam", "a food-processing plant on the irrigated land"],
  road: ["a logistics depot along the new road", "a distribution centre on the new road"],
  bridge: ["a warehouse at the new crossing", "a trucking depot by the bridge"],
  tourist: ["a hotel beside the site", "a resort and conference centre"],
  esports: ["a gaming studio in the arena", "a broadcast centre for tournaments"],
  stadium: ["a sports academy at the stadium", "a hotel by the stadium"],
  housing: ["a building-materials plant near the estate", "a mortgage company for the estate's buyers"],
  market: ["a cold chain for the market's traders", "a wholesale centre beside the market"],
  water: ["a bottling plant on the new supply"],
  vehicles: ["a bus assembly line for the new fleet"],
  hospital: ["a diagnostic centre beside the hospital"],
  school: ["a technical college partnership"],
  rail: ["a dry port and freight terminal on the line", "a rolling-stock assembly plant"],
  seaport: ["a container terminal at the port", "a shipping and logistics hub"],
  refinery: ["a petrochemical plant beside the refinery", "a fuel distribution network"],
  pipeline: ["a gas-fired power plant on the pipeline", "a fertiliser plant on the gas line"],
  airport: ["a cargo terminal for perishable exports", "an airport hotel and maintenance hangar"],
};

/* The governance score the firms read (0–1): corruption weighs most, then
   approval, security and how well this project was built. */
export const investorClimate = ({ cor = .3, app = 50, sec = .4, quality = 1, leakage = 0 } = {}) =>
  Math.max(0, Math.min(1, .55 - cor * .9 + (app - 50) / 120 + (sec - .4) * .5 + (quality - .8) * .4 - leakage * .8 + .25));

/* Two letters for a finished project, or none if business does not need it.
   Each: { firm, ok, jobs, igrB, usdM, what, lines }. */
export const projectInvestors = (p, ctx = {}) => {
  const pull = ATTRACTS[p.type]; if (!pull) return [];
  const r = seeded("investors", p.id || p.title || "p", ctx.seed || 0);
  const pool = FIRMS.filter(f => f.kinds.includes(p.type));
  const firms = []; while (firms.length < 2 && pool.length) firms.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const clim = investorClimate({ cor: ctx.cor, app: ctx.app, sec: ctx.sec, quality: p.quality == null ? 1 : p.quality, leakage: p.leakage || 0 });
  const size = Math.max(1, Math.min(4, (p.estimateM || (p.baseCost || 1) * 1000) / 1500));
  const place = p.lga ? p.lga : ctx.stName || "the state";
  return firms.map((f, i) => {
    const what = (WHAT[p.type] || ["a new business"])[Math.floor(r() * (WHAT[p.type] || [1]).length)];
    // The second firm needs more convincing: in a state known for graft it holds back.
    const ok = i === 0 ? clim >= .25 : clim >= .45;
    const k = pull * size * (.6 + clim) * (.85 + r() * .3);
    const jobs = ok ? Math.round(k * 420 / 10) * 10 : 0, igrB = ok ? Math.round(k * .14 * 100) / 100 : 0, usdM = ok ? Math.round(k * 18) : 0;
    const lines = ok ? [
      { ok: true, line: "We saw " + p.title + " finished in " + place + ", on time and working. That is why we are here." },
      { ok: true, line: f.nm + " will build " + what + ": $" + usdM + "M, " + jobs.toLocaleString("en-US") + " jobs." },
      { ok: true, line: "Revenue +₦" + igrB + "B a year to the state; approval +1." },
    ] : [
      { ok: false, line: "We visited " + p.title + " in " + place + ". The project is there; the confidence is not." },
      { ok: false, line: clim < .3 ? "Our board reads the stories of missing money. We will not invest while they continue." : "We will wait another year and watch how the state is run before we commit." },
      { ok: false, line: "Clean books and a safe state bring us back. Nothing committed yet." },
    ];
    return { firm: f, ok, jobs, igrB, usdM, what, climate: Math.round(clim * 100) / 100, lines };
  });
};
