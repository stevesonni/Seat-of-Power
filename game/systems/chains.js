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
// "⭐ The Coastal Highway" → "Coastal Highway", to read after "the".
export const bare = (nm) => String(nm || "").replace(/^⭐\s*/, "").replace(/^(The|A|An)\s+/, "");
export const siteCrisis = ({ nm, place, zone, nat = false }) => {
  const N = bare(nm), U = N.toUpperCase(), g = GROUPS[zone] || "armed men", k = nat ? 1 : .12; // costs in ₦B: a governor's are smaller
  const c = (v) => Math.round(v * k * 10) / 10;
  const wait = { id: "wait", l: "Leave it for now", cost: 0, fx: { app: -2 }, zone: -1, resume: false, line: "The site stays shut and the contractor's equipment rusts. The project is stalled until you act.", paper: ["THE " + U + " IS STALLED", "Armed men hold the site", false] };
  const Z = {
    NW: { title: "Bandits have kidnapped three foreign engineers from the " + N, d: "Half the " + N + " near " + place + " is built. Last night bandits raided the camp and took three Chinese engineers into the forest. They want ₦" + (nat ? "2 billion" : "300 million") + ". The contractor has stopped work.",
      opts: [
        { id: "pay", l: "Pay the ransom quietly", cost: c(10), fx: { cor: .02 }, zone: 1, resume: true, paid: true, line: "The engineers walk out of the forest a week later. Work resumes. Every gang in the North-West now knows your price.", paper: ["KIDNAPPED ENGINEERS FREED: WAS A RANSOM PAID?", "Work resumes on the " + N, false] },
        { id: "clear", l: "Launch a military rescue", cost: c(8), fx: { app: 2, sec: .01 }, zone: -1, resume: true, line: "Special forces go in at dawn and bring all three home. The army's name rises; work resumes.", paper: ["SPECIAL FORCES RESCUE KIDNAPPED ENGINEERS", "All three freed; work on the " + N + " resumes", true],
          fail: { p: .3, fx: { app: -4 }, line: "The rescue goes wrong: two engineers are killed in the crossfire. Beijing protests; the site is secured, but at a terrible price.", paper: ["RESCUE BID ENDS IN TRAGEDY", "Two foreign engineers killed; Beijing protests", false] } },
        { id: "local", l: "Replace them with Nigerian contractors", cost: 0, fx: { app: 1 }, zone: 0, resume: true, delay: 2, line: "A Nigerian firm takes over. The work restarts, slower: two more years before it is done.", paper: ["LOCAL FIRM TAKES OVER " + U, "Completion pushed back two years", true] },
        wait] },
    NE: { title: "Insurgents have raided the " + N + " site", d: "Insurgents overran the camp at the " + N + " near " + place + " at night, burnt the machines and killed two guards. No worker will go back without soldiers.",
      opts: [
        { id: "clear", l: "Deploy the army to guard the site", cost: c(12), fx: { app: 1, sec: .01 }, zone: 0, resume: true, line: "A battalion moves in and stays. Work resumes behind sandbags, at the army's pace.", paper: ["ARMY TAKES OVER " + U + " SITE", "Soldiers guard the works around the clock", true] },
        { id: "pay", l: "Pay the local vigilantes from the security vote", cost: c(4), fx: { cor: .02 }, zone: 1, resume: true, paid: true, line: "The vigilantes take the money and the night watch. Nobody audits the security vote.", paper: ["VIGILANTES GUARD " + U, "Paid from the security vote", false],
          fail: { p: .25, fx: { app: -3 }, line: "The vigilantes were overrun within a month; the site is shut again.", paper: ["INSURGENTS OVERRUN VIGILANTES AT " + U, "The site is shut again", false], resume: false } },
        wait] },
    NC: { title: "Armed herders and farmers are fighting over the " + N + " land", d: "The " + N + " near " + place + " cuts across grazing routes. Farmers and armed herders have clashed at the site; three villages are burning and the crews have fled.",
      opts: [
        { id: "clear", l: "Send the army to separate them", cost: c(8), fx: { sec: .01 }, zone: -2, resume: true, line: "The army imposes a curfew and the crews return. Both sides say the soldiers took the other side.", paper: ["CURFEW AS TROOPS END CLASHES AT " + U, "Work resumes under guard", true] },
        { id: "palace", l: "Ask the royal fathers to broker peace, and pay compensation", cost: c(3), fx: { app: 1 }, zone: 2, resume: true, delay: 1, line: "The palaces bring both sides to one mat. Compensation is paid; the route is redrawn. A year lost, but the peace holds.", paper: ["ROYAL FATHERS BROKER PEACE AT " + U, "Compensation paid; the route redrawn", true] },
        wait] },
    SE: { title: "The sit-at-home is stopping the " + N, d: "Every Monday the separatists enforce a sit-at-home; any worker on the " + N + " site near " + place + " on a Monday risks his life. Last Monday \"unknown gunmen\" burnt a bulldozer.",
      opts: [
        { id: "local", l: "Work six days, never on Mondays", cost: 0, fx: { app: 1 }, zone: 1, resume: true, delay: 1, line: "The crews never work Mondays. Nobody is hurt; the project loses a year.", paper: ["NO MONDAY WORK ON " + U, "The government bows to the sit-at-home", false] },
        { id: "clear", l: "Work Mondays under army escort", cost: c(6), fx: { app: 1, sec: .01 }, zone: -1, resume: true, line: "Soldiers stand at the gates every Monday. Work goes on; the sit-at-home is broken here.", paper: ["TROOPS DEFY SIT-AT-HOME ORDER AT " + U, "Monday work resumes under guard", true],
          fail: { p: .35, fx: { app: -3 }, line: "On the third Monday gunmen attack the escort: four workers are killed. The crews will not come back on Mondays.", paper: ["GUNMEN ATTACK MONDAY CREW AT " + U, "Four workers killed", false], delay: 1 } },
        { id: "pay", l: "Talk to the community leaders and the youth: jobs and \"settlement\"", cost: c(2), fx: { cor: .01 }, zone: 1, resume: true, paid: true, line: "The youth get jobs on the site and the elders get their envelope. The enforcers look the other way.", paper: ["COMMUNITY DEAL REOPENS " + U, "Local youths hired", true] },
        wait] },
    SS: { title: "Ex-militants threaten to blow up the " + N, d: "A message from the creeks: give the boys the surveillance contracts on the " + N + " near " + place + ", or it goes up in smoke. Two pipelines nearby were bombed last year.",
      opts: [
        { id: "pay", l: "Give the ex-militants pipeline surveillance contracts", cost: c(8), fx: { cor: .02 }, zone: 2, resume: true, paid: true, line: "The ex-generals sign the contracts and the creeks go quiet. The money is the price of peace, every year.", paper: ["EX-MILITANTS GET SURVEILLANCE DEAL ON " + U, "Peace in the creeks, at a price", false] },
        { id: "clear", l: "Send in the Joint Task Force", cost: c(8), fx: { sec: .01 }, zone: -2, resume: true, line: "Gunboats patrol the creeks. Work resumes, guarded from the water.", paper: ["JTF SECURES " + U + " SITE", "Gunboats patrol the creeks", true],
          fail: { p: .3, fx: { app: -3, infra: -.02 }, line: "They made good on the threat: a section was blown up before the JTF arrived. Work resumes after a year of repairs.", paper: ["MILITANTS BOMB " + U, "A year of repairs before work resumes", false], delay: 1 } },
        wait] },
    SW: { title: "Omo onile are blocking the " + N, d: "Land grabbers who call themselves the land's \"owners\" have blocked the " + N + " site near " + place + ". They want their \"deve\" fee before a single block is laid, and they have beaten up the surveyor.",
      opts: [
        { id: "pay", l: "Pay them their \"deve\"", cost: c(2), fx: { cor: .01 }, zone: 0, resume: true, paid: true, line: "The money is paid; the thugs disappear. Next door, another family of \"owners\" is preparing its own claim.", paper: ["GOVERNMENT PAYS 'DEVE' TO LAND GRABBERS", "Work resumes on the " + N, false] },
        { id: "clear", l: "Send the police to clear them", cost: c(1), fx: {}, zone: -1, resume: true, line: "The police make arrests; the site reopens. The families go to court.", paper: ["POLICE CLEAR LAND GRABBERS FROM " + U, "Arrests made; work resumes", true] },
        { id: "palace", l: "Ask the Oba to call them to order", cost: 0, fx: { app: 1 }, zone: 1, resume: true, line: "One word from the palace and the omo onile vanish. The Oba will remember the favour.", paper: ["OBA ORDERS LAND GRABBERS OFF " + U, "The palace backs the project", true],
          fail: { p: .3, fx: {}, line: "The Oba's word was not enough: the thugs say the palace has no say on their land. The site stays shut.", paper: ["LAND GRABBERS DEFY THE PALACE", "The " + N + " stays shut", false], resume: false } },
        wait] },
  };
  const z = Z[zone] || Z.NC;
  return { title: z.title, group: g, d: z.d, opts: z.opts };
};
// Pick an option's outcome: the risky ones can go wrong.
export const crisisOutcome = (o, r = Math.random) => o.fail && r() < o.fail.p
  ? { ...o, fx: { ...o.fx, ...o.fail.fx }, line: o.fail.line, paper: o.fail.paper, resume: o.fail.resume != null ? o.fail.resume : o.resume, delay: o.fail.delay != null ? o.fail.delay : o.delay, failed: true }
  : o;

/* Getting a big programme moving in Nigeria: the legislature, the cabal,
   the palace and the contractor. Each is a beat due the year after it starts.
   ctx: { nat, houseRatio (the share of the legislature with you), blessed
   (the palace's blessing for that zone), north (a northern zone) }. */
export const startBeats = ({ id, nm, place, zone, sector, nat = false, turn, houseRatio = .6, blessed = false }) => {
  const out = [], N = bare(nm);
  if (houseRatio < .55) out.push({ id: "nass_" + id, kind: "nass", due: turn + 1, polId: id, nm: N, place });
  out.push({ id: "cabal_" + id, kind: "cabal", due: turn + 1, polId: id, nm: N, place });
  const north = ["NW", "NE", "NC"].includes(zone);
  if (!blessed && ((north && sector === "agriculture") || (zone === "SW" && sector === "infrastructure"))) out.push({ id: "palace_" + id, kind: "palace", due: turn + 1, polId: id, nm: N, place, zone, north });
  return out;
};
// Who the cabal's man is, and the TV stations that turn on you (fictional).
export const CABAL = { nat: "Alhaji Sule Danjuma-Okeke, a retired general with oil blocks", gov: "Chief Adekunle Bamgbose-Eze, the party's biggest financier in the state", tv: "Apex Television and the Daily Sentinel" };
// The contractor who takes the mobilisation fee and flees: the chance a year, for a project under way.
export const japaRisk = ({ cor = .3, soleSource = false } = {}) => Math.min(.35, .04 + cor * .15 + (soleSource ? .08 : 0));
export const JAPA_TO = ["London", "Toronto", "Houston", "Dubai"];

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
