/* Consequence chains (rules only, no React). A programme, a bill or an
   executive order is not a slider: it lands in a place, and the place
   answers over the following years, in letters from named people.

   Programmes: a year after a programme finishes in a place, the ministry
   in charge writes with what changed there; the year after, an investor
   writes because of it. A programme that has worked in a place does not
   run there again: only in another place that needs it.

   Big works: at the halfway mark, armed groups may stop the site. Clear
   them out, pay them off (and they will be back), or leave it stalled.

   Executive orders with business at stake: the trade ministry reports new
   firms; then a court may strike the order down; an investor threatens to
   leave; an appeal succeeds only for a government the courts can trust
   (corruption under 50%).

   The Electoral Act / Law: elections afterwards are cleaner, for you and
   your opponents alike.

   Every firm and person is fictional; countries are real. */

// What the place grows, by zone: the harvest letter and the processing plant.
export const CROP = { NW: "rice", NE: "sesame", NC: "tomatoes", SW: "cassava", SE: "cassava", SS: "palm oil" };

// The ministry that writes, by sector (governor: Commissioner; President: Minister).
const MIN = { agriculture: "Agriculture", health: "Health", education: "Education", infrastructure: "Works", security: "Internal Security", administration: "Budget & Planning", water: "Water Resources", power: "Power", trade: "Trade & Investment" };

/* Payoff: what changed in the place, in the minister's words. kind: the
   need's kind (farm, clinic, school, water, power, security, road, traffic,
   housing, land, youth, jobs, poverty, digital), else the programme's sector. */
const PAYOFF = {
  farm: (P, C) => "We have recorded a bumper harvest of " + C + " in " + P + ". Farmers are back in the fields, and there is food in the markets.",
  clinic: (P) => "The clinics in " + P + " are full of people being treated, not turned away. Deaths in childbirth are down.",
  school: (P) => "Children in " + P + " are back in class, and this year's exam results are the best in a decade.",
  water: (P) => "The taps are running in " + P + ". The cholera ward at the general hospital is empty for the first time in years.",
  power: (P) => P + " has light. Welders, tailors and cold rooms have switched off their generators.",
  security: (P) => "The markets in " + P + " are open after dark again, and families who fled are coming home.",
  road: (P) => "The journey into " + P + " takes a third of the time it did. Traders' trucks are moving.",
  traffic: (P) => "The queues around " + P + " have cleared; goods are moving again.",
  housing: (P) => "Families in " + P + " have their keys. Rents have stopped climbing.",
  land: (P) => "Titles in " + P + " are now issued in weeks, without a bribe.",
  youth: (P) => "Young people in " + P + " are working: the scheme has placed thousands in jobs.",
  jobs: (P) => "Factories in " + P + " have reopened their gates and are hiring again.",
  poverty: (P) => "Families in " + P + " eat twice a day again. The traders say they feel it.",
  digital: (P) => "Pensioners in " + P + " are being paid on time, online, without the queues.",
  uni: (P) => "The first students have matriculated at the new university in " + P + ": the lecture halls are full, and the town has a bookshop again.",
};
// The investor the payoff draws, by kind: who, from where, and what they will build.
const INVESTOR = {
  farm: (C) => ({ firm: "Lusitana Agro-Industrial", country: "Portugal", flag: "🇵🇹", head: "Rui Antunes, Managing Director", what: "a " + C.replace(/es$/, "") + " processing plant", jobs: 1200, igrB: .3 }),
  clinic: () => ({ firm: "Sundaram Life Sciences", country: "India", flag: "🇮🇳", head: "Priya Raman, Chief Executive", what: "a drug and diagnostics factory", jobs: 800, igrB: .25 }),
  school: () => ({ firm: "Hanbit Skills", country: "South Korea", flag: "🇰🇷", head: "Kim Jae-won, President", what: "a technical training academy", jobs: 400, igrB: .1 }),
  water: () => ({ firm: "Fonte Clara Bebidas", country: "Brazil", flag: "🇧🇷", head: "Ana Ribeiro, Chief Executive", what: "a bottled-water and juice plant", jobs: 600, igrB: .2 }),
  power: () => ({ firm: "Rheinfeld Werke", country: "Germany", flag: "🇩🇪", head: "Klaus Brenner, Managing Director", what: "an appliance assembly plant on the new supply", jobs: 1500, igrB: .4 }),
  security: () => ({ firm: "Anatolia Foods", country: "Turkey", flag: "🇹🇷", head: "Emre Kaya, Chairman", what: "a cattle ranch and dairy", jobs: 900, igrB: .2 }),
  road: () => ({ firm: "Van der Berg Logistics", country: "the Netherlands", flag: "🇳🇱", head: "Pieter van der Berg, Chief Executive", what: "a logistics and distribution hub", jobs: 700, igrB: .25 }),
  traffic: () => ({ firm: "Van der Berg Logistics", country: "the Netherlands", flag: "🇳🇱", head: "Pieter van der Berg, Chief Executive", what: "a dry port and truck terminal", jobs: 700, igrB: .25 }),
  housing: () => ({ firm: "Al Waha Developments", country: "the United Arab Emirates", flag: "🇦🇪", head: "Omar Al Suwaidi, Chairman", what: "a building-materials plant", jobs: 900, igrB: .3 }),
  land: () => ({ firm: "Al Waha Developments", country: "the United Arab Emirates", flag: "🇦🇪", head: "Omar Al Suwaidi, Chairman", what: "a business park", jobs: 600, igrB: .3 }),
  youth: () => ({ firm: "Nordvik Digital", country: "Sweden", flag: "🇸🇪", head: "Ingrid Lindqvist, Chief Executive", what: "a software outsourcing centre", jobs: 1000, igrB: .2 }),
  jobs: () => ({ firm: "Kessler Textil", country: "Germany", flag: "🇩🇪", head: "Anja Kessler, Managing Director", what: "a garment factory", jobs: 2500, igrB: .3 }),
  poverty: () => ({ firm: "Blue Mesa Agri-Foods", country: "the United States", flag: "🇺🇸", head: "Marcus Ellery, President", what: "a food-processing plant buying from local farms", jobs: 900, igrB: .2 }),
  digital: () => ({ firm: "Nordvik Digital", country: "Sweden", flag: "🇸🇪", head: "Ingrid Lindqvist, Chief Executive", what: "a data centre", jobs: 300, igrB: .2 }),
  uni: () => ({ firm: "Maplecrest Biosciences", country: "Canada", flag: "🇨🇦", head: "Dr. Helen Ostrowski, Chief Executive", what: "a research laboratory beside the campus, hiring its graduates", jobs: 500, igrB: .15 }),
};
// Programmes that found or convert a university: their chain is the matriculation, then a research investor.
export const UNI_IDS = ["f_fed_university", "new_uni"];
/* The polytechnic conversion bill: a year after it passes, the Minister of
   Education writes from the place where the polytechnic became a university. */
export const polyUniChain = ({ place, nat = true, turn }) => ({ id: "poly_uni_" + place, kind: "payoff", due: turn, place, prog: nat ? "Federal Polytechnic (Conversion to University) Act" : "Polytechnic Conversion Law", k: "uni",
  from: (nat ? "Minister of " : "Commissioner for ") + "Education", title: "The polytechnic in " + place + " is a university",
  line: "The polytechnic in " + place + " has its university charter: degree courses in engineering and technology, and its HND holders can now top up to degrees at home." });
const SECTOR_KIND = { agriculture: "farm", health: "clinic", education: "school", infrastructure: "road", security: "security", administration: "digital" };
export const kindOf = (needKind, sector) => (needKind && PAYOFF[needKind]) ? needKind : (SECTOR_KIND[sector] || "jobs");
const MIN_OF = { farm: "agriculture", clinic: "health", school: "education", water: "water", power: "power", security: "security", road: "infrastructure", traffic: "infrastructure", housing: "infrastructure", land: "administration", youth: "education", jobs: "trade", poverty: "administration", digital: "administration", uni: "education" };

/* The chain a finished programme starts. place: the LGA (governor) or the
   state (President); zone: a zone code for the crop. Returns the two
   letters, due this year and next. */
export const programmeChain = ({ id, nm, place, zone, needKind, sector, nat = false, turn }) => {
  const k = kindOf(needKind, sector), crop = CROP[zone] || "maize";
  const minister = (nat ? "Minister of " : "Commissioner for ") + (MIN[MIN_OF[k]] || "Trade & Investment");
  const I = (INVESTOR[k] || INVESTOR.jobs)(crop);
  return [
    { id: "pay_" + id + "_" + place, kind: "payoff", due: turn, place, prog: nm, k, from: minister, line: PAYOFF[k](place, crop),
      title: (k === "farm" ? "A bumper harvest in " : "Results in ") + place },
    { id: "inv_" + id + "_" + place, kind: "investor", due: turn + 1, place, prog: nm, k, ...I,
      title: I.firm + " wants to build in " + place,
      line: "We have followed what your " + nm.replace(/^⭐\s*/, "") + " did in " + place + ". We want to build " + I.what + " there: " + I.jobs.toLocaleString() + " jobs. We need land and a fair tax regime." },
  ];
};
// The investor's two answers.
export const investorAnswer = (beat, welcome, cor = .3) => welcome
  ? { ok: true, jobs: beat.jobs, igrB: beat.igrB, costB: Math.round(beat.igrB * 2 * 10) / 10, app: 2, paper: [beat.firm.toUpperCase() + " BREAKS GROUND IN " + String(beat.place).toUpperCase(), "Because of the " + String(beat.prog).replace(/^⭐\s*/, "") + ": " + beat.what + ", " + beat.jobs.toLocaleString() + " jobs", true] }
  : { ok: false, jobs: 0, igrB: 0, costB: 0, app: -1, paper: [beat.firm.toUpperCase() + " LOOKS ELSEWHERE", "Talks on " + beat.what + " in " + beat.place + " stall over terms", false] };

/* A programme already delivered in a place runs again only in another
   place that needs it. done: { [programmeId]: [places] }. */
export const canRunAgain = (done, id, place) => !((done || {})[id] || []).includes(place);

/* Halfway on big works: an armed group stops the site. The group by zone. */
export const GROUPS = { NW: "bandits", NE: "insurgents", NC: "armed herders", SW: "land-grabbing thugs", SE: "unknown gunmen", SS: "militants" };
export const siteCrisisRisk = ({ sec = .5, paidBefore = false } = {}) => Math.max(.15, Math.min(.85, .9 - sec + (paidBefore ? .25 : 0)));
export const siteCrisis = ({ nm, place, zone, nat = false }) => {
  const g = GROUPS[zone] || "armed men";
  return { title: "Armed " + g + " have stopped work on the " + nm.replace(/^⭐\s*/, ""), group: g,
    d: "Half the work on the " + nm.replace(/^⭐\s*/, "") + " near " + place + " is done. Now " + g + " have seized the site and kidnapped two engineers. The contractor has pulled out the rest of the crew.",
    opts: [
      { id: "clear", l: "Clear them out: send in the " + (nat ? "army" : "police and the security corps"), cost: nat ? 8 : 1, fx: { app: 1, sec: .01 }, zone: -2, resume: true, line: "The site is cleared after a week of fighting; the engineers are freed. Work resumes, but the villages around the site are angry about the raids.", paper: ["TROOPS RETAKE " + nm.replace(/^⭐\s*/, "").toUpperCase() + " SITE", "Engineers freed; work resumes", true] },
      { id: "pay", l: "Negotiate: pay them to leave", cost: nat ? 12 : 1.5, fx: { app: -1, cor: .01 }, zone: 1, resume: true, paid: true, line: "The money changes hands quietly and the engineers walk free. Work resumes. Everyone with a gun in the region now knows what your sites are worth.", paper: ["ENGINEERS FREED: WAS A RANSOM PAID?", "Work resumes on the " + nm.replace(/^⭐\s*/, ""), false] },
      { id: "wait", l: "Leave it for now", cost: 0, fx: { app: -2 }, zone: -1, resume: false, line: "The site stays shut and the contractor's equipment rusts. The project is stalled until you act.", paper: ["THE " + nm.replace(/^⭐\s*/, "").toUpperCase() + " IS STALLED", "Armed men hold the site", false] },
    ] };
};

/* The executive order with business at stake: who writes, and the court. */
export const BUSINESS_ORDERS = ["ease_business", "f_eo_business"];
export const orderChain = ({ id, nat = false, turn, cor = .3 }) => [
  { id: "eo_trade_" + id, kind: "eo_trade", due: turn + 1, from: nat ? "Minister of Industry, Trade & Investment" : "Commissioner for Commerce & Industry",
    title: "New businesses are coming", line: "Since your order, permits are decided in thirty days. Firms from Portugal, India, the Netherlands and South Korea have registered " + (nat ? "across the country" : "in the state") + ": 46 new companies this year.", jobs: nat ? 25000 : 3000, igrB: nat ? 6 : .4 },
  { id: "eo_court_" + id, kind: "eo_court", due: turn + 2, struck: true },
];
// The appeal: a court trusts a clean government (corruption under 50%).
export const appealGranted = (cor) => (cor || 0) < .5;

/* The Electoral Act / Law: cleaner elections after it is signed.
   opp: what the opponent's machine still adds; petition: how much likelier
   a court challenge is; noRig: the council-election rigging option is gone. */
export const electoralEffects = (signed) => signed ? { oppPush: 0, jitter: .6, petition: .5, noRig: true } : { oppPush: 1, jitter: 1, petition: 1, noRig: false };
