/* The economy, made real (a player's feedback, 27 Nov 2026: "It should reflect the real GDP of a state and the country,
   more information on the different sectors of the economy (education, health, economy, agriculture etc), can be able
   to build industries at state level, credit rating"). Rules only.

   GDP. The country: ₦372.8 trillion in 2024 (NBS, rebased to 2019 prices, released 21 July 2025). The states: BudgIT's
   2021 estimates ("State of States 2022"), as their share of the 36; the game starts each state at that share of the
   2024 national figure, at 2024 prices. BudgIT figures are given for 13 states; the other 23 are estimated from their
   rank between those figures (EST), and the screen says so. */

import { produceOf } from "./trade.js";

export const NATIONAL_GDP_TN = 372.8, GDP_YEAR = 2024;
// ₦ trillion, 2021 (BudgIT). EST: estimated from the state's rank between the published figures.
export const STATE_GDP_2021 = {
  Lagos: 41.17, Rivers: 7.96, Akwa_Ibom: 7.77, Imo: 7.68, Delta: 6.19, Anambra: 5.6, Ondo: 5.2, Ogun: 4.9, Bayelsa: 4.63, Niger: 4.5, Kaduna: 4.4, Benue: 4.3,
  Kano: 4.2, Cross_River: 4.07, Edo: 3.99, Kogi: 3.69, Oyo: 3.65, Abia: 3.52, Katsina: 3.39, Sokoto: 3.25, Adamawa: 3.12, Bauchi: 2.99, Ekiti: 2.86, Osun: 2.73,
  Ebonyi: 2.59, Jigawa: 2.46, Gombe: 2.33, Taraba: 2.2, Borno: 2.07, Nassarawa: 1.93, Kebbi: 1.8, Zamfara: 1.66, Plateau: 1.52, Enugu: 1.37, Kwara: 1.23, Yobe: 1.09,
};
export const GDP_PUBLISHED = ["Lagos", "Rivers", "Akwa_Ibom", "Imo", "Delta", "Bayelsa", "Kano", "Cross_River", "Edo", "Kogi", "Oyo", "Kebbi", "Yobe"];
const SUM36 = Object.values(STATE_GDP_2021).reduce((a, b) => a + b, 0);
// The FCT is not in BudgIT's 36; it is put at the size of a mid-table state (an estimate).
const FCT_SHARE = 3.0 / (SUM36 + 3.0);
export const gdpShare = (state) => state === "FCT" ? FCT_SHARE : STATE_GDP_2021[state] ? STATE_GDP_2021[state] / (SUM36 + 3.0) : null;
// The starting GDP in ₦ trillion (2024 prices). The country: the NBS figure.
export const startGdpTn = (state) => !state || state === "Nigeria" ? NATIONAL_GDP_TN : (gdpShare(state) || .02) * NATIONAL_GDP_TN;
export const gdpRank = (state) => { if (!STATE_GDP_2021[state]) return null; return 1 + Object.values(STATE_GDP_2021).filter(v => v > STATE_GDP_2021[state]).length; };
export const gdpEstimated = (state) => state === "FCT" || !GDP_PUBLISHED.includes(state);
// Today's GDP: the start, moved by the game's own economy (its output now against its output at the start).
export const gdpNowTn = (state, gameNow, gameStart) => startGdpTn(state) * (gameStart > 0 && gameNow > 0 ? gameNow / gameStart : 1);
export const fmtTn = (tn) => tn >= 1 ? "₦" + (Math.round(tn * 10) / 10) + " trillion" : "₦" + Math.round(tn * 1000) + " billion";

/* The sectors, in measures people know. s: the game's state of things (lit, hp, infra, sec, agr: 0–1); popM: millions;
   crops: the state's produce. Anchors: Nigeria's out-of-school children (about 18 million, UNICEF), doctors (about 4 per
   10,000 people), births in a health facility (about half, NDHS 2023–24), roughly 4–8 hours of grid power a day. */
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
export const sectorCards = (s = {}, { popM = 5, crops = [], igrB = null, nat = false } = {}) => {
  const lit = cl(s.lit ?? .5, 0, 1), hp = cl(s.hp ?? .5, 0, 1), infra = cl(s.infra ?? .4, 0, 1), sec = cl(s.sec ?? .5, 0, 1), agr = cl(s.agr ?? .5, 0, 1);
  const kids = popM * .22 * cl(1 - lit * 1.05, .03, .9), M = (x) => x >= 1 ? (Math.round(x * 10) / 10) + " million" : Math.round(x * 1000) + ",000";
  return [
    { id: "education", icon: "🏫", nm: "Education", score: lit, rows: [["Children out of school", M(kids)], ["Pupils per teacher", String(Math.round(25 + (1 - lit) * 60))]], moves: "Classrooms, teachers, school feeding, free education." },
    { id: "health", icon: "🏥", nm: "Health", score: hp, rows: [["Doctors per 10,000 people", String(Math.round(hp * 8 * 10) / 10)], ["Births in a health facility", Math.round(cl(hp * 95, 10, 97)) + "%"]], moves: "Primary health centres, free caesareans, hospitals, outreach." },
    { id: "agriculture", icon: "🌾", nm: "Agriculture", score: agr, rows: [["Main crops", crops.slice(0, 2).join(", ") || "food crops"], ["Harvest against last year's best", Math.round(60 + agr * 50) + "%"]], moves: "Farm inputs, irrigation, security on the farms, processing industries." },
    { id: "economy", icon: "💼", nm: "Economy", score: cl((infra + agr + sec) / 3, 0, 1), rows: [[nat ? "Independent revenue" : "Internally generated revenue", igrB == null ? "—" : "₦" + (Math.round(igrB * 10) / 10) + "B a year"], ["Business confidence", Math.round(cl((infra * .5 + sec * .5) * 100, 5, 95)) + "%"]], moves: "Industries, roads and power, security, low corruption." },
    { id: "infrastructure", icon: "🛣️", nm: "Infrastructure", score: infra, rows: [["Roads in good condition", Math.round(cl(infra * 100, 5, 95)) + "%"], ["Grid power a day", Math.round(cl(2 + infra * 18, 2, 22)) + " hours"]], moves: "Roads, power, water and drainage, and maintaining them." },
    { id: "security", icon: "🛡️", nm: "Security", score: sec, rows: [["People who feel safe at night", Math.round(cl(sec * 100, 5, 95)) + "%"], ["Farms safe to work", Math.round(cl(sec * 100 + 5, 5, 98)) + "%"]], moves: "Community policing, a state security corps, the army where you can ask for it." },
  ];
};

/* The credit rating (states: like Agusto & Co. and GCR's ratings; the country: the international agencies). From the
   debt against a year's revenue, salary arrears, a refused or forced loan, corruption and a late budget. Returns
   { grade, score, why }. Grades, best first. */
export const GRADES = ["AA", "A", "BBB", "BB", "B", "CCC"];
export const creditRating = ({ debtB = 0, revB = 1, arrears = 0, defaults = 0, cor = .3, budgetLate = false, imfFails = 0, sovereign = false } = {}) => {
  const ratio = debtB / Math.max(.1, revB);
  let sc = 100 - Math.min(55, ratio * 22) - arrears * 8 - defaults * 25 - Math.max(0, cor - .3) * 60 - (budgetLate ? 6 : 0) - imfFails * 10
    // Nigeria on the global scale, as S&P and Fitch rate it: B at the start (2024: B-/B), BB or better only with years of reform.
    - (sovereign ? 40 : 0);
  sc = Math.round(cl(sc, 0, 100));
  const grade = sc >= 85 ? "AA" : sc >= 72 ? "A" : sc >= 58 ? "BBB" : sc >= 44 ? "BB" : sc >= 28 ? "B" : "CCC";
  const why = [ratio > 1.5 ? "debt is " + (Math.round(ratio * 10) / 10) + " times a year's revenue" : ratio < .5 ? "debt is low against revenue" : null, arrears ? arrears + " month" + (arrears === 1 ? "" : "s") + " of salary arrears" : null, defaults ? "a loan not repaid" : null, cor > .5 ? "corruption" : null, budgetLate ? "a late budget" : null].filter(Boolean);
  return { grade, score: sc, why };
};
export const investmentGrade = (g) => GRADES.indexOf(g) <= GRADES.indexOf("BBB");
// What a grade does to a loan's interest, in percentage points (BBB is the base).
export const ratingRateAdj = (g) => ({ AA: -.04, A: -.02, BBB: 0, BB: .02, B: .04, CCC: .07 })[g] || 0;

/* Industries for a state, from what it grows and digs (produceOf, and the limestone, lithium and bitumen states). Each is
   a programme: who owns it is asked (state-owned, a partnership, or the investor's own), and a factory without power or
   roads may become a white elephant. Returns programme objects like the game's own. */
const LIMESTONE = ["Ogun", "Kogi", "Benue", "Sokoto", "Gombe", "Edo", "Cross_River", "Ebonyi", "Niger"];
const IND = [
  { re: /rice/, id: "rice", nm: "Rice mill", d: "An integrated rice mill: paddy bought from the state's farmers, parboiled, milled and bagged.", c: 3, jobs: 2500, sec: "agriculture" },
  { re: /cassava/, id: "cassava", nm: "Cassava processing plant", d: "Garri, high-quality cassava flour, starch and ethanol from the state's cassava.", c: 3, jobs: 2000, sec: "manufacturing" },
  { re: /palm/, id: "palm", nm: "Palm oil refinery", d: "A refinery for crude palm oil and kernels: vegetable oil, soap and feed.", c: 3.5, jobs: 1800, sec: "manufacturing" },
  { re: /cocoa/, id: "cocoa", nm: "Cocoa processing plant", d: "Cocoa butter, powder and liquor made here, not sold raw.", c: 4, jobs: 1500, sec: "manufacturing" },
  { re: /cashew/, id: "cashew", nm: "Cashew processing plant", d: "Shelled, roasted and packed cashew for export.", c: 2.5, jobs: 2200, sec: "manufacturing" },
  { re: /sesame/, id: "sesame", nm: "Sesame hulling plant", d: "Hulled, cleaned sesame for export at three times the raw price.", c: 2, jobs: 1200, sec: "agriculture" },
  { re: /tomato/, id: "tomato", nm: "Tomato processing plant", d: "Tomato paste made from the state's harvest, so less of it rots.", c: 2.5, jobs: 1500, sec: "manufacturing" },
  { re: /ginger/, id: "ginger", nm: "Ginger drying and processing", d: "Dried, split and powdered ginger for export.", c: 1.5, jobs: 1000, sec: "agriculture" },
  { re: /potato/, id: "potato", nm: "Potato processing and cold store", d: "A cold store and a crisps and chips line for the potato harvest.", c: 2, jobs: 900, sec: "manufacturing" },
  { re: /groundnut/, id: "groundnut", nm: "Groundnut oil mill", d: "Groundnut oil and cake, from the state's harvest.", c: 2, jobs: 1200, sec: "manufacturing" },
  { re: /cotton/, id: "cotton", nm: "Ginnery and textile mill", d: "Cotton ginned, spun and woven in the state.", c: 5, jobs: 4000, sec: "manufacturing" },
  { re: /hides|leather/, id: "leather", nm: "Tannery and leather hub", d: "A modern tannery and workshops for shoes, bags and belts.", c: 2.5, jobs: 3000, sec: "manufacturing" },
  { re: /fish|seafood/, id: "fish", nm: "Fish processing and cold chain", d: "Cold rooms, smoking kilns and a processing plant for the catch.", c: 2, jobs: 1500, sec: "agriculture" },
  { re: /cattle|beef/, id: "abattoir", nm: "Modern abattoir and meat processing", d: "A clean abattoir, cold chain and meat packing.", c: 2.5, jobs: 1200, sec: "agriculture" },
  { re: /yam/, id: "yam", nm: "Yam flour factory", d: "Yam flour and chips, so the harvest keeps.", c: 1.5, jobs: 900, sec: "manufacturing" },
  { re: /soy/, id: "soy", nm: "Soybean crushing plant", d: "Soy oil and meal for feed mills.", c: 2.5, jobs: 1000, sec: "manufacturing" },
  { re: /maize|sorghum|millet/, id: "feed", nm: "Feed mill", d: "Poultry and fish feed from the state's grain.", c: 2, jobs: 900, sec: "manufacturing" },
  { re: /gum arabic/, id: "gum", nm: "Gum arabic processing plant", d: "Cleaned, graded gum arabic for export.", c: 1.5, jobs: 800, sec: "agriculture" },
  { re: /hibiscus/, id: "hibiscus", nm: "Hibiscus (zobo) processing", d: "Dried, cleaned hibiscus for export and drinks.", c: 1.2, jobs: 700, sec: "agriculture" },
];
const MINERAL = { Nassarawa: { id: "lithium", nm: "Lithium processing plant", d: "Process the lithium ore mined here, instead of watching it leave illegally.", c: 6, jobs: 2000 }, Ondo: { id: "bitumen", nm: "Bitumen processing plant", d: "Asphalt from Ondo's bitumen belt, for the state's own roads.", c: 6, jobs: 1800 } };
export const industriesFor = (state) => {
  if (!state || state === "Nigeria") return [];
  const crops = produceOf(state).map(x => String(x).toLowerCase()), out = [], seen = new Set();
  const mk = (x, sec) => ({ id: "ind_" + x.id, nm: x.nm, s: sec === "agriculture" ? "agriculture" : "infrastructure", c: x.c, t: 2, fx: { infra: .01, app: 5 }, d: x.d, cr: .1, ecoSec: sec || "manufacturing", ecoBoost: .04, jobsAdd: x.jobs, compDesc: x.nm + " running", industry: true, ptype: "industrial", // the state's or a partnership's plant is a project: budget, contractor, build (owner, 28 Nov 2026)
    local: { head: x.nm, why: x.d + " About " + Number(x.jobs).toLocaleString("en-US") + " jobs once it runs.", fact: null },
    ask: { q: "Who owns the " + x.nm.toLowerCase() + "?", opts: [
      { id: "state", l: "The state builds and runs it", d: "All the profit is the state's, and all the risk. State factories often stall.", costF: 1, tAdd: 0, risk: { p: .35, title: "A white elephant", text: "The " + x.nm.toLowerCase() + " stands idle half the year: no power, no working capital, a board of party men.", fx: { app: -3 } }, good: { text: "The " + x.nm.toLowerCase() + " is running, and its profits go to the state.", fx: { app: 3 } } },
      { id: "ppp", l: "A partnership with an investor", d: "The state brings the land and the road; the investor builds and runs it. The state takes a share.", costF: .55, tAdd: 0, risk: { p: .15, title: "The partner wants more", text: "The investor says the state's share of the road and power is late, and asks for more tax holidays.", fx: { app: -1 } }, good: { text: "The " + x.nm.toLowerCase() + " runs at full capacity; the partner is already talking about a second line.", fx: { app: 3 } } },
      { id: "private", l: "The investor's own, with tax holidays", d: "Almost free for the state; it earns only from taxes, later.", costF: .2, tAdd: 0, risk: { p: .25, title: "The investor walked away", text: "The investor took the tax holidays and the land, and never built the plant.", fx: { app: -2 } } },
    ] } });
  for (const I of IND) if (!seen.has(I.id) && crops.some(c => I.re.test(c))) { seen.add(I.id); out.push(mk(I, I.sec)); }
  if (LIMESTONE.includes(state)) out.push(mk({ id: "cement", nm: "Cement plant", d: "A cement plant on the state's limestone: cheaper building for every project.", c: 8, jobs: 2500 }));
  if (MINERAL[state]) out.push(mk(MINERAL[state]));
  if (state === "Abia" && !seen.has("leather")) out.push(mk({ id: "garment", nm: "Aba garment and leather hub", d: "Power, sheds and machines for Aba's shoemakers and tailors.", c: 2.5, jobs: 5000 }));
  return out.slice(0, 4);
};
