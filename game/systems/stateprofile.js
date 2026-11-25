/* Each state's own facts, and what they do to its programmes and bills (owner, 22 Nov 2026: "rural electrification in
   Abia is not the same as in Lagos"). A state profile is a few plain facts from how things really work: the land, who
   runs the power, the security corps, the laws already passed, oil money. Programmes and bills read the profile: the
   same programme gets the state's own name, cost, one local question with real trade-offs, and its own picture.

   Sources (Nov 2026): NERC's list of the 15 states that now regulate their own electricity market (Electricity Act
   2023); the Aba ring-fenced area (9 of Abia's 17 LGAs, its own gas plant); the REA's Epe solar mini-grid in Lagos;
   state anti-open grazing laws (Benue 2017, Abia 2018 …); UNICEF on the northern states yet to domesticate the Child
   Rights Act; the World Bank's NEWMAP erosion programme in the South-East; the Almajiri Commission (2023). */
import { produceOf } from "./trade.js";
import { seeded } from "./rng.js";

// ── The land ──
export const LANDS = {
  creek: { nm: "creeks and swamp", short: "the creeks" },
  lagoon: { nm: "lagoon and megacity", short: "the lagoon city" },
  gully: { nm: "red earth and gullies", short: "gully country" },
  forest: { nm: "rainforest", short: "the forest belt" },
  savannah: { nm: "savannah", short: "the savannah" },
  plateau: { nm: "highland plateau", short: "the plateau" },
  dry: { nm: "the dry far north", short: "the dry north" },
};
const LAND = {
  Bayelsa: "creek", Rivers: "creek", Delta: "creek", Akwa_Ibom: "creek", Lagos: "lagoon",
  Abia: "gully", Anambra: "gully", Imo: "gully", Enugu: "gully", Ebonyi: "gully",
  Edo: "forest", Ondo: "forest", Ogun: "forest", Osun: "forest", Ekiti: "forest", Oyo: "forest", Cross_River: "forest",
  Kwara: "savannah", Kogi: "savannah", Niger: "savannah", Nassarawa: "savannah", Benue: "savannah", FCT: "savannah", Kaduna: "savannah",
  Bauchi: "savannah", Gombe: "savannah", Adamawa: "savannah", Taraba: "savannah", Zamfara: "savannah", Plateau: "plateau",
  Kano: "dry", Katsina: "dry", Jigawa: "dry", Sokoto: "dry", Kebbi: "dry", Borno: "dry", Yobe: "dry",
};
// States that run their own electricity market (NERC, 2026). The rest are regulated by NERC until they pass a law.
export const OWN_POWER_MARKET = ["Abia", "Anambra", "Bayelsa", "Edo", "Ekiti", "Enugu", "Imo", "Kogi", "Lagos", "Nassarawa", "Niger", "Ogun", "Ondo", "Oyo", "Plateau"];
const OIL = ["Akwa_Ibom", "Bayelsa", "Delta", "Rivers", "Ondo", "Edo", "Imo", "Abia", "Anambra"];
// The twelve states that adopted Sharia criminal law from 1999; the Hisbah corps is strongest in eight of them.
const SHARIA = ["Zamfara", "Kano", "Sokoto", "Katsina", "Bauchi", "Borno", "Jigawa", "Kebbi", "Yobe", "Kaduna", "Niger", "Gombe"];
const HISBAH = ["Kano", "Zamfara", "Sokoto", "Katsina", "Jigawa", "Bauchi", "Kebbi", "Yobe"];
const ALMAJIRI = ["Kano", "Katsina", "Jigawa", "Sokoto", "Kebbi", "Zamfara", "Kaduna", "Bauchi", "Gombe", "Yobe", "Borno", "Niger"];
const BANDITS = ["Zamfara", "Katsina", "Sokoto", "Kaduna", "Niger", "Kebbi"];
const INSURGENCY = ["Borno", "Yobe", "Adamawa"];
const HERDER_CLASH = ["Benue", "Plateau", "Nassarawa", "Taraba", "Kogi", "Kwara", "Enugu", "Oyo", "Ondo"];
const FLOODS = ["Kogi", "Benue", "Bayelsa", "Rivers", "Delta", "Anambra", "Kebbi", "Jigawa", "Niger", "Adamawa", "Lagos"];
// Anti-open grazing laws already in force, and the year.
const GRAZING_LAW = { Imo: 2007, Ekiti: 2016, Benue: 2017, Taraba: 2017, Abia: 2018, Ebonyi: 2018, Oyo: 2019, Bayelsa: 2021, Ogun: 2021, Ondo: 2021, Rivers: 2021, Delta: 2021, Enugu: 2021, Akwa_Ibom: 2021 };
// Northern states yet to domesticate the 2003 Child Rights Act (UNICEF's list; Kebbi has since passed it).
const NO_CRA = ["Adamawa", "Bauchi", "Borno", "Gombe", "Jigawa", "Kano", "Katsina", "Yobe", "Sokoto", "Zamfara"];
// The Violence Against Persons (Prohibition) Act: Kano has not passed it; in Rivers and Taraba it waits for assent.
const NO_VAPP = ["Kano", "Rivers", "Taraba"];
// The community security corps each state has (or would set up).
const SEC_FORCE = {
  Ogun: "Amotekun", Oyo: "Amotekun", Osun: "Amotekun", Ondo: "Amotekun", Ekiti: "Amotekun", Lagos: "Amotekun",
  Abia: "Ebube Agu", Ebonyi: "Ebube Agu", Enugu: "Ebube Agu", Imo: "Ebube Agu", Anambra: "Anambra Vigilante Service",
  Katsina: "Community Watch Corps", Zamfara: "Community Protection Guards", Sokoto: "Community Guard Corps", Kano: "Neighbourhood Watch",
  Benue: "Community Volunteer Guards", Borno: "Civilian JTF", Yobe: "Civilian JTF",
};
const SEC_REGION = (st) => ["Ogun", "Oyo", "Osun", "Ondo", "Ekiti", "Lagos"].includes(st) ? "west" : ["Abia", "Ebonyi", "Enugu", "Imo", "Anambra"].includes(st) ? "east" : ["Borno", "Yobe"].includes(st) ? "civilian" : ["Katsina", "Zamfara", "Sokoto", "Kano", "Kebbi", "Jigawa", "Kaduna", "Niger"].includes(st) ? "north" : null;
const FOOD = { north: "tuwo, beans soup and an egg", west: "rice, beans, fish and an egg", east: "jollof rice, beans, vegetables and an egg", creek: "rice, fish and plantain", benue: "yam, egusi soup and an egg" };

const has = (list, st) => list.includes(st);
const name = (st) => String(st || "").replace(/_/g, " ");

/* The profile. ctx.ownMarket: the state passed its own electricity market law in this career. */
export const profileOf = (state, ctx = {}) => {
  const st = state || "";
  const land = LAND[st] || "savannah";
  const north = ["dry", "savannah", "plateau"].includes(land) && !["Kwara", "Kogi", "Benue", "FCT"].includes(st);
  return {
    state: st, name: name(st), land, landNm: (LANDS[land] || LANDS.savannah).nm,
    ownMarket: has(OWN_POWER_MARKET, st) || !!ctx.ownMarket, marketByLaw: !has(OWN_POWER_MARKET, st) && !!ctx.ownMarket,
    ring: st === "Abia", oil: has(OIL, st), sharia: has(SHARIA, st), hisbah: has(HISBAH, st), almajiri: has(ALMAJIRI, st),
    bandits: has(BANDITS, st), insurgency: has(INSURGENCY, st), herders: has(HERDER_CLASH, st), floods: has(FLOODS, st),
    grazingLaw: GRAZING_LAW[st] || null, cra: !has(NO_CRA, st), vapp: !has(NO_VAPP, st), vappWaiting: ["Rivers", "Taraba"].includes(st),
    secForce: SEC_FORCE[st] || null, secRegion: SEC_REGION(st),
    food: st === "Benue" ? FOOD.benue : land === "creek" ? FOOD.creek : north ? FOOD.north : ["gully"].includes(land) ? FOOD.east : FOOD.west,
    north, crops: produceOf(st),
  };
};

/* What a project's land does to its cost, by project type, when the place itself has no special terrain (an LGA in
   the creeks or the rocks already counts). Used by SYS.estimate through opts.state. */
const LAND_KIND = {
  gully: { road: "gully", power: "gully", water: "gully", housing: "gully", school: "gully", market: "gully" },
  lagoon: { road: "city", housing: "city", water: "city", market: "city", industrial: "city", hospital: "city" },
  dry: { power: "sun", water: "deep" },
  savannah: { power: "sun" },
};
export const stateKind = (state, type) => { const L = LAND[state]; if (L === "creek" && state === "Bayelsa") return "riverine"; return ((LAND_KIND[L] || {})[type]) || null; };
export const STATE_TERRAIN = {
  gully: { f: 1.2, nm: "gully country", why: "erosion: drains, gabions and gully control before the work itself" },
  city: { f: 1.2, nm: "dense city", why: "land compensation, relocation and traffic diversions" },
  sun: { f: .88, nm: "strong-sun country", why: "more hours of sun, so fewer panels for each megawatt. This one costs less" },
  deep: { f: 1.25, nm: "deep water table", why: "boreholes must go 150 metres or more, and the water table keeps falling" },
};

// ── Local questions ──
/* One question per programme, with real choices. Each option: id, l (label), d (what it means), costF (cost factor),
   tAdd (more years), fx (now), risk { p, title, fx, text } (rolled once, seeded, lands next year), good { fx, text }
   (lands next year if the risk does not). */
const opt = (id, l, d, more = {}) => ({ id, l, d, costF: 1, tAdd: 0, ...more });

const ELEC = (P) => {
  if (P.ring) return {
    head: "Rural electrification in " + P.name,
    why: "Nine of Abia's 17 local governments are inside Aba's ring-fenced power area: a private company with its own gas plant runs the power there, not the eastern grid. The other eight are still on the grid, and many villages are on nothing.",
    fact: "Aba's ring-fenced area was handed to its own operator in 2022, with a 188 MW gas plant at Osisioma. Metering its 200,000 customers is costed at ₦32 billion. In November 2025 a gas shortage blacked it out.",
    art: "rural_elec-ring", q: "Where does the money go first?",
    opts: [
      opt("ring", "Meters inside the Aba ring", "Fund prepaid meters with the ring's operator: no more estimated bills in Aba's factories and shops.", { costF: .9, fx: { app: 3 }, risk: { p: .35, title: "Aba went dark", text: "Gas ran short at the ring's plant and Aba went dark for a week. Traders blame you for the meters they paid for.", fx: { app: -4 } }, good: { text: "Aba's metered shops and factories now pay for what they use. Manufacturers say so on television.", fx: { app: 3, infra: .01 } } }),
      opt("outside", "Solar mini-grids in the eight LGAs outside the ring", "The villages the ring does not reach, and the grid forgot.", { risk: { p: .2, title: "Panels stolen", text: "Thieves took panels from two of the new mini-grids before the communities set up guards.", fx: { infra: -.01, app: -2 } }, good: { text: "Villages outside the Aba ring have light for the first time.", fx: { app: 3 } } }),
      opt("both", "Both, phased over a longer time", "Meters in Aba and mini-grids outside, one after the other. Slower and costlier, with half the risk of each.", { costF: 1.3, tAdd: 1, risk: { p: .15, title: "A rough start", text: "A gas shortfall in Aba and two stolen panels made a rough first year.", fx: { app: -2 } }, good: { text: "Aba is metered and the villages outside the ring are lit.", fx: { app: 4, infra: .01 } } }),
    ],
  };
  if (P.bandits || P.insurgency) return {
    head: "Rural electrification in " + P.name,
    why: P.name + " has more sun than the south, so solar costs less for each village. But the sites are in country where " + (P.insurgency ? "insurgents" : "bandits") + " move, and a solar farm is worth stealing.",
    fact: "Over 1,000 solar mini-grids are being built across Nigeria under the federal Rural Electrification Agency. In the North-West and North-East, contractors work with escorts.",
    art: "rural_elec-sun", q: "Who guards the sites?",
    opts: [
      opt("army", "Soldiers and police escort the crews", "Safe, slower, and it costs more.", { costF: 1.12, tAdd: 0, good: { text: "The solar sites were built without one attack.", fx: { app: 3, sec: .01 } } }),
      opt("guards", "The " + (P.secForce || "community guards") + " guard them", "Locals who know the bush. Cheaper, and the community owns it.", { risk: { p: .25, title: "Panels taken at night", text: "Gunmen took panels and batteries from a site the guards could not hold.", fx: { infra: -.02, app: -2 } }, good: { text: "The communities guarded their own solar farms, and kept them.", fx: { app: 4, sec: .01 } } }),
      opt("none", "No guards: build fast", "The cheapest. The crews take their chances.", { costF: .95, risk: { p: .45, title: "A site was attacked", text: "Gunmen attacked a solar site, kidnapped two engineers and burnt the battery house.", fx: { infra: -.03, app: -4, sec: -.02 } } }),
    ],
  };
  if (P.land === "creek") return {
    head: "Rural electrification in " + P.name,
    why: "In the creeks everything comes by boat: panels, poles, cement. The grid will not cross the swamp. But the oil companies flare gas next door that could light the villages.",
    fact: "Nigeria still flares gas at many oil fields in the Delta. Under the 2021 Petroleum Industry Act, oil companies must fund trusts for the communities that host them.",
    art: "rural_elec-creek", q: "What powers the creek villages?",
    opts: [
      opt("gas", "Gas from the oil company's flow station", "Use gas that is now flared. Cheaper, if the oil company and the youths agree.", { costF: .8, risk: { p: .3, title: "Youths shut the gas line", text: "Youths shut the gas line to the villages until the oil company paid them. The lights went out for a month.", fx: { app: -3, sec: -.02 } }, good: { text: "Gas that was burnt off now lights the creek villages.", fx: { app: 4, hp: .01 } } }),
      opt("stilts", "Solar on stilts above the flood line", "Raised platforms, by boat. Costs more to build, nothing to block.", { risk: { p: .15, title: "The flood rose higher", text: "This year's flood rose above two platforms and drowned the batteries.", fx: { infra: -.01, app: -2 } }, good: { text: "The stilted solar grids rode out the flood season.", fx: { app: 3 } } }),
    ],
  };
  if (P.ownMarket) return {
    head: "Rural electrification in " + P.name,
    why: P.name + (P.marketByLaw ? " now runs its own electricity market under the law you passed" : " regulates its own electricity market now, not NERC") + ". Your own regulator can license a mini-grid in weeks." + (P.land === "lagoon" ? " Lagos's plan is 1 GW of solar by 2030, starting with the lagoon and riverside towns the grid never reached." : ""),
    fact: P.land === "lagoon" ? "Lagos took over its power market on 4 June 2025. In Epe, a 505 kWp solar mini-grid now lights five fishing communities." : "Since the Electricity Act 2023, fifteen states regulate their own power market. " + P.name + " is one of them.",
    art: P.land === "lagoon" ? "rural_elec-lagoon" : P.land === "gully" ? "rural_elec-gully" : null, q: "Who builds and runs the mini-grids?",
    opts: [
      opt("private", "License private developers: they build, they bill", "Your regulator licenses them; their money builds it. Cheapest for the state.", { costF: .65, risk: { p: .4, title: "The tariff is too high", text: "The developers charge more than the villages can pay. People are back on kerosene, cursing you.", fx: { app: -3 } }, good: { text: "Private mini-grids, licensed by your regulator, are running and paid for.", fx: { app: 3, infra: .01 } } }),
      opt("state", "The state builds and owns them", "Fair prices; but the state must maintain them.", { risk: { p: .3, title: "Nobody fixed them", text: "Inverters failed in a third of the state's mini-grids and nobody was paid to fix them.", fx: { infra: -.02, app: -2 } }, good: { text: "The state's own mini-grids keep running.", fx: { app: 4 } } }),
      opt("rea", "Partner the federal Rural Electrification Agency", "Federal and donor money, federal pace.", { costF: .8, tAdd: 1, good: { text: "The federal agency's mini-grids are commissioned in " + P.name + ".", fx: { app: 3 } } }),
    ],
  };
  if (P.land === "gully") return {
    head: "Rural electrification in " + P.name,
    why: "In gully country a pole on the wrong side of the road ends up in the gully after one rainy season.",
    fact: "The South-East has thousands of active erosion gullies. The World Bank's NEWMAP programme has worked on them in Abia, Anambra, Enugu, Imo and Ebonyi.",
    art: "rural_elec-gully", q: "Where do the lines go?",
    opts: [
      opt("round", "Route the lines round the gullies", "Longer lines, costlier, nothing falls.", { costF: 1.15, good: { text: "The new lines stood through the rains.", fx: { app: 3 } } }),
      opt("straight", "Straight lines now, fix the gullies later", "Cheapest and fastest.", { risk: { p: .35, title: "Poles fell into a gully", text: "The rains widened a gully and took six poles with it. Two villages are dark again.", fx: { infra: -.02, app: -3 } } }),
      opt("newmap", "Do it with the erosion programme", "Gully control and the lines together, with the World Bank's NEWMAP.", { costF: 1.05, tAdd: 1, fx: { infra: .01 }, good: { text: "The gullies were closed and the lines went in beside them.", fx: { app: 3, infra: .02 } } }),
    ],
  };
  return {
    head: "Rural electrification in " + P.name,
    why: P.name + " is still regulated by NERC in Abuja: a mini-grid needs a federal licence, and that takes months. A state law can change that.",
    fact: "Since the Electricity Act 2023, fifteen states run their own power market. " + P.name + " is not one of them yet: pass the State Electricity Market Law to join them.",
    art: P.land === "savannah" || P.land === "dry" ? "rural_elec-sun" : null, q: "How do you start?",
    opts: [
      opt("nerc", "Apply to NERC for the licences", "It works, slowly.", { tAdd: 1, good: { text: "NERC's licences came through and the mini-grids are running.", fx: { app: 3 } } }),
      opt("rea", "Partner the federal Rural Electrification Agency", "Federal and donor money; they hold the licences.", { costF: .8, tAdd: 1, good: { text: "The federal agency's mini-grids are commissioned in " + P.name + ".", fx: { app: 3 } } }),
      opt("state", "The state builds them and waits for the licence", "Fast to build; they may sit idle.", { risk: { p: .4, title: "Built, but not switched on", text: "The mini-grids are built, but NERC has not licensed them. They sit idle while villagers watch.", fx: { app: -3 } } }),
    ],
  };
};

const WATER = (P) => {
  if (P.land === "dry") return { head: "Clean water in " + P.name, why: "In the dry north the water table is deep and falling. Shallow wells dry up by March.", fact: "Northern Nigeria's groundwater lies deep under the Chad and Sokoto basins; many hand-pump boreholes fail in the dry season.", art: "water-deep", q: "What kind of water scheme?",
    opts: [
      opt("deep", "Deep solar boreholes with tanks", "150 metres down, solar pumps. Costly, but they last.", { costF: 1.1, good: { text: "The deep boreholes kept running through the dry season.", fx: { hp: .01, app: 3 } } }),
      opt("shallow", "Many shallow hand-pump boreholes", "Twice as many villages, for now.", { costF: .75, risk: { p: .5, title: "The boreholes ran dry", text: "By March half the shallow boreholes were dry. Women walk for water again.", fx: { hp: -.01, app: -3 } } }),
      opt("dams", "Small earth dams for the towns", "Water for people and farms; a year more.", { costF: 1.05, tAdd: 1, fx: { agr: .02 }, good: { text: "The earth dams filled in the rains and fed the towns all year.", fx: { app: 3, agr: .01 } } }),
    ] };
  if (P.land === "creek") return { head: "Clean water in " + P.name, why: "Water everywhere and none of it safe: boreholes in the creeks come up salty, and some taste of crude oil.", fact: "Oil spills have poisoned drinking water in parts of the Niger Delta; in Ogoniland, the UN found benzene in well water.", art: "water-creek", q: "How do you make it safe?",
    opts: [
      opt("plants", "A treatment plant for each town", "Costly, but safe.", { costF: 1.15, good: { text: "Creek towns drink treated water for the first time.", fx: { hp: .02, app: 3 } } }),
      opt("rain", "Rainwater tanks on every school and clinic", "Cheap; dry in the dry season.", { costF: .7, risk: { p: .3, title: "The tanks ran dry", text: "The rains stopped early and the tanks ran dry by January.", fx: { app: -2 } }, good: { text: "Schools and clinics have their own clean water.", fx: { hp: .01, app: 2 } } }),
      opt("bore", "Boreholes anyway", "The cheapest. The water may not be safe.", { costF: .9, risk: { p: .5, title: "Salty, oily water", text: "Tests show oil in the new boreholes. Families went back to buying sachet water.", fx: { hp: -.02, app: -3 } } }),
    ] };
  if (P.land === "lagoon") return { head: "Clean water in Lagos", why: "The water corporation's old pipes lose half the water before it reaches a tap. Most Lagosians buy water from vendors.", fact: "Lagos depends on boreholes and water vendors for most of its water; the public network serves a small share of the city.", art: "water-city", q: "Where do you start?",
    opts: [
      opt("pipes", "Fix the leaking pipes first", "Half the water is lost; stop that first.", { good: { text: "Fixed pipes doubled what reaches the taps.", fx: { hp: .01, infra: .01, app: 3 } } }),
      opt("plant", "A new treatment plant", "More water, a year more, and costlier.", { costF: 1.3, tAdd: 1, good: { text: "The new waterworks is running.", fx: { hp: .02, app: 4 } } }),
      opt("private", "License private water companies", "Their money; their prices.", { costF: .7, risk: { p: .4, title: "Water prices doubled", text: "The new water companies doubled the price. Vendors and families protest at the Secretariat.", fx: { app: -4 } } }),
    ] };
  if (P.land === "gully") return { head: "Clean water in " + P.name, why: "The towns sit on hills above the gullies: water must be pumped uphill, and pipes laid near a gully are swallowed by it.", fact: "Many South-East towns rely on springs and streams in the valleys; erosion gullies have cut water mains in Anambra and Imo.", art: "water-hill", q: "How do you bring the water up?",
    opts: [
      opt("pump", "Pump to tanks on the hills", "Reliable; it needs power every day.", { costF: 1.1, good: { text: "Water flows from the new hilltop tanks.", fx: { hp: .01, app: 3 } } }),
      opt("spring", "Gravity schemes from the springs", "No pumping bills; a year more to build.", { costF: .9, tAdd: 1, good: { text: "Spring water runs downhill to the taps, free.", fx: { hp: .01, app: 3 } } }),
      opt("bore", "Boreholes beside the roads", "Quick, cheap, near the gullies.", { risk: { p: .3, title: "A gully took the pipe", text: "A gully opened in the rains and swallowed the new main.", fx: { infra: -.01, app: -2 } } }),
    ] };
  if (P.land === "plateau") return { head: "Clean water in Plateau", why: "Old tin-mining ponds hold water all year, and some of it carries lead and other metals from the mines.", fact: "Decades of tin mining around Jos left hundreds of abandoned mining ponds; tests have found heavy metals in some of them.", art: null, q: "What water do you use?",
    opts: [
      opt("treat", "Treat the mining-pond water", "Plenty of water; the treatment must be good.", { costF: 1.1, risk: { p: .2, title: "Lead in the water", text: "Tests found lead in one town's treated water. The plant is shut while it is fixed.", fx: { hp: -.01, app: -3 } } }),
      opt("dam", "A clean reservoir in the hills", "Costs more, and a year more.", { costF: 1.2, tAdd: 1, good: { text: "The new hill reservoir sends clean water to Jos.", fx: { hp: .02, app: 3 } } }),
    ] };
  return null;
};

const ROADS = (P) => {
  if (P.land === "creek") return { head: "Roads in " + P.name, why: "A road in the creeks starts with sand: the swamp must be filled before anything is built on it, and one bad flood can wash the sand away.", fact: "Delta roads are among Nigeria's costliest per kilometre: sand-filling, culverts and bridges over creeks.", art: "roads-swamp", q: "How do you cross the swamp?",
    opts: [
      opt("sand", "Sand-fill and build on the swamp", "The usual way.", { risk: { p: .3, title: "The flood took the sand", text: "The flood washed away a third of the new sand-filled road before it was paved.", fx: { infra: -.02, app: -3 } } }),
      opt("raised", "Raised roads and bridges", "Costs more; floods pass under.", { costF: 1.25, good: { text: "The raised roads stayed open through the flood.", fx: { infra: .02, app: 3 } } }),
      opt("water", "Jetties and passenger boats instead", "Use the water: cheaper, quick, fewer km of road.", { costF: .55, fx: { app: 2 }, good: { text: "New jetties and boats link the creek towns.", fx: { app: 2 } } }),
    ] };
  if (P.land === "gully") return { head: "Roads in " + P.name, why: "In this soil the drains matter more than the tar. A road without drains becomes a gully.", fact: "In the South-East, a tarred road without side drains can turn into an erosion gully within a few rainy seasons. A World Bank NEWMAP road in Abia cost over ₦238 million for 1.2 km, most of it in drains.", art: "roads-gully", q: "Drains first, or tar first?",
    opts: [
      opt("drains", "Drains and erosion control first", "Costs more; the road lasts.", { costF: 1.15, good: { text: "The roads with deep drains came through the rains whole.", fx: { infra: .02, app: 3 } } }),
      opt("tar", "Tar now, drains later", "More km now.", { costF: .9, risk: { p: .45, title: "The road washed away", text: "The rains cut a gully across the new road. It is closed.", fx: { infra: -.03, app: -4 } } }),
      opt("newmap", "With the World Bank's erosion programme", "Shared money for the drains; a year more.", { tAdd: 1, good: { text: "NEWMAP's engineers closed the gullies along the new roads.", fx: { infra: .02, app: 3 } } }),
    ] };
  if (P.land === "lagoon") return { head: "Roads in Lagos", why: "In Lagos the land costs more than the road: every widening goes through people's homes and shops, and every closure jams the city.", fact: "Lagos road projects often stall in court over demolitions and compensation.", art: "roads-city", q: "How do you clear the way?",
    opts: [
      opt("pay", "Pay full compensation before you build", "Costs more, but fair.", { costF: 1.15, good: { text: "Families paid in full moved out without a fight.", fx: { app: 3 } } }),
      opt("demolish", "Demolish now, pay later", "Faster and cheaper, now.", { costF: .9, risk: { p: .5, title: "In court over the demolitions", text: "A court stopped the work after families sued over demolitions without payment.", fx: { app: -5 } } }),
      opt("night", "Work at night, with diversions", "Costs a little more; the city keeps moving.", { costF: 1.05, fx: { app: -1 }, good: { text: "Night shifts finished the road without jamming the city.", fx: { app: 3 } } }),
    ] };
  if (P.bandits || P.insurgency) return { head: "Roads in " + P.name, why: "Remote roads here are ambush ground. Crews will not work without protection.", fact: "In the North-West and North-East, road contractors have been kidnapped on site; many projects work only with escorts.", art: "roads-savannah", q: "How do you protect the crews?",
    opts: [
      opt("escort", "Police and civil defence escort", "Costs more; the crews come back.", { costF: 1.1, good: { text: "The road was built without one attack.", fx: { app: 3, sec: .01 } } }),
      opt("clear", "Clear the bush 50 metres on each side", "Fewer places to hide; farmers lose some land.", { costF: 1.05, fx: { sec: .01 }, good: { text: "The cleared roads are safer to travel.", fx: { sec: .01, app: 2 } } }),
      opt("none", "No escort", "Cheapest.", { costF: .95, risk: { p: .4, title: "Crew kidnapped", text: "Gunmen kidnapped four of the road crew. The contractor stopped work.", fx: { app: -4, sec: -.02 } } }),
    ] };
  if (["dry", "savannah", "plateau"].includes(P.land)) return { head: "Roads in " + P.name, why: "Flat, dry country: roads are cheap to build here, and long. The question is how many and how good.", fact: "Most rural roads in the North are red laterite, cheap to grade and quick to wash out.", art: "roads-savannah", q: "What kind of roads?",
    opts: [
      opt("tar", "Tar the main roads", "The standard.", { good: { text: "The tarred roads are open.", fx: { app: 3 } } }),
      opt("laterite", "Many more km of laterite feeder roads", "Reach every village; they wash out.", { costF: .6, risk: { p: .3, title: "The rains took the feeder roads", text: "Laterite feeder roads washed out in the rains.", fx: { infra: -.02, app: -2 } }, good: { text: "Farmers' produce reaches market on the new feeder roads.", fx: { agr: .02, app: 3 } } }),
      opt("concrete", "Concrete roads that last 40 years", "Costs more now, cheap forever.", { costF: 1.25, fx: { infra: .02 }, good: { text: "The concrete roads came through without a pothole.", fx: { app: 3 } } }),
    ] };
  return null;
};

const IRRIG = (P) => {
  if (["forest", "gully"].includes(P.land)) {
    const crop = P.crops.find(c => /palm|cocoa|rice|cassava|rubber|cashew/.test(c)) || P.crops[0];
    const k = /palm/.test(crop) ? "palm" : /cocoa/.test(crop) ? "cocoa" : /rice/.test(crop) ? "ricemill" : null;
    return { head: "Farm processing in " + P.name, nm: "Farm Processing Clusters (" + crop + ")", ptype: "industrial",
      d: "Rain is not the problem in " + P.name + ": harvests rot before they reach market. Mills, dryers and cold rooms for " + crop + " instead of canals.",
      why: "In " + LANDS[P.land].nm + " farms get rain enough. They lose money after harvest.", fact: "Nigeria loses a large share of what it grows after harvest, for want of storage and processing.", art: k ? "irrigation-" + k : null, q: null };
  }
  if (P.land === "creek" || P.land === "lagoon") return { head: "Fish and rice in " + P.name, nm: "Fish Farms and Cold Rooms", ptype: "industrial", d: "Fish farms, cages in the " + (P.land === "lagoon" ? "lagoon" : "creeks") + " and solar cold rooms so the catch is not sold cheap by evening.", why: "This is water country: the money is in fish, not canals.", fact: P.land === "lagoon" ? "Lagos grows rice at Imota and has the country's biggest fish markets." : "Delta fishermen lose catch every day for want of cold storage.", art: "farm-fish", q: null };
  if (P.land === "dry") return { head: "Irrigation in " + P.name, why: "The dry season lasts seven months. River valleys (fadama) can carry a second harvest if they get water.", fact: "Kano and Jigawa grow much of Nigeria's dry-season tomatoes, onions and wheat on irrigated fadama land.", art: "irrigation-fadama", q: "Big scheme or small?",
    opts: [
      opt("pumps", "Solar pumps for farmer groups", "Quick, small, many farmers.", { good: { text: "Solar pumps gave the fadama farmers a second harvest.", fx: { agr: .02, app: 3 } } }),
      opt("dam", "A big dam and canals", "Costs more, a year more, the whole valley.", { costF: 1.4, tAdd: 1, fx: { agr: .02 }, good: { text: "The new canals water the whole valley.", fx: { agr: .03, app: 3 } } }),
      opt("revive", "Revive the old dam's silted canals", "Cheap: the dam is already there.", { costF: .7, risk: { p: .3, title: "The canals silted again", text: "The canals silted up again within a year.", fx: { agr: -.01, app: -2 } } }),
    ] };
  return null;
};

const SCHOOLS = (P, id) => {
  if (id === "classrooms" && (P.land === "creek" || P.floods)) return { head: "Classrooms in " + P.name, why: "Floods close schools here every year. A block on the ground is a block under water.", fact: "The 2022 floods closed schools across Bayelsa, Kogi, Anambra and Delta for months.", art: "classrooms-raised", q: "Build for the floods?",
    opts: [
      opt("raised", "Raise every block on pillars", "Costs more; school goes on in the flood.", { costF: 1.2, good: { text: "The raised classrooms stayed open through the flood.", fx: { lit: .01, app: 3 } } }),
      opt("ground", "Build on the ground", "More blocks for the money.", { risk: { p: .4, title: "The flood closed the new schools", text: "The flood filled the new classroom blocks. Pupils are at home again.", fx: { lit: -.01, app: -3 } } }),
    ] };
  if (id === "classrooms" && (P.bandits || P.insurgency)) return { head: "Classrooms in " + P.name, why: "Schools here have been attacked and pupils kidnapped. Parents will not send children to a school with no wall.", fact: "Since 2014, gunmen have kidnapped hundreds of pupils from schools in the North-East and North-West.", art: "classrooms-fenced", q: "How do you keep pupils safe?",
    opts: [
      opt("walls", "Perimeter walls and guards for every school", "Costs more; parents send their children.", { costF: 1.15, good: { text: "Parents send their children to the walled schools.", fx: { lit: .01, app: 3 } } }),
      opt("merge", "Fewer, bigger, safer schools in the towns", "Safer; some children walk far.", { risk: { p: .3, title: "Too far to walk", text: "Village children now walk two hours to school. Many stopped going.", fx: { lit: -.01, app: -2 } } }),
      opt("plain", "Build the blocks; security later", "The most blocks for the money.", { costF: .9, risk: { p: .3, title: "A school was attacked", text: "Gunmen attacked one of the new schools at night. Classes stopped across the area.", fx: { lit: -.02, app: -6, sec: -.02 } } }),
    ] };
  if (id === "free_edu" && P.almajiri) return { head: "Free education in " + P.name, nm: "Free Education and Almajiri Integration", d: "Abolish fees, and bring the Qur'anic schools into the system: English, maths and a meal, with the mallams, not against them.",
    why: P.name + " has many of Nigeria's almajiri children: boys sent to Qur'anic teachers, many begging on the streets. Free schools alone do not reach them.", fact: "About 10 million of Nigeria's out-of-school children are almajirai. The federal Almajiri Commission was set up in 2023; Kano reports over 13,000 Qur'anic schools.", art: "free_edu-almajiri", q: "How do you reach the almajiri children?",
    opts: [
      opt("mallams", "With the mallams: add English and maths to their schools", "They keep their pupils; the state pays teachers and meals.", { good: { text: "The mallams' schools now teach reading and sums. The clerics praise you at Friday prayers.", fx: { lit: .02, app: 3 } } }),
      opt("move", "Move the children into public schools", "Faster on paper; the clerics object.", { costF: 1.15, risk: { p: .45, title: "The clerics object", text: "Clerics preached against the plan. Many parents kept their sons with the mallams.", fx: { app: -4 } } }),
      opt("register", "Register the schools, feed the pupils and pay the mallams", "With the federal Almajiri Commission; a year more.", { costF: 1.05, tAdd: 1, good: { text: "Registered Qur'anic schools now feed and teach their pupils.", fx: { lit: .02, hp: .01, app: 3 } } }),
    ] };
  return null;
};

const HEALTH = (P, id) => {
  if (id === "phc" && P.land === "creek") return { head: "Health in " + P.name, why: "A woman in labour in the creeks needs a boat, not a road. Many health centres are a day away by water.", fact: "Maternal deaths in the riverine Delta are among the worst in the south, largely from the time it takes to reach care.", art: "phc-boat", q: "How do you reach the creek villages?",
    opts: [
      opt("boats", "Boat ambulances and a floating clinic", "Costs more; it reaches them.", { costF: 1.1, good: { text: "The boat ambulances saved mothers in labour this year.", fx: { hp: .02, app: 4 } } }),
      opt("centres", "Renovate the health centres only", "Cheaper; still far away.", { costF: .9, risk: { p: .35, title: "Too far to reach", text: "Two women died in labour on the way to a renovated centre a day away by boat.", fx: { hp: -.01, app: -3 } } }),
    ] };
  if (id === "phc" && (P.bandits || P.insurgency)) return { head: "Health in " + P.name, why: "Nurses will not stay in villages where gunmen come at night.", fact: "Health workers have been kidnapped and clinics closed across the North-West and North-East.", art: null, q: "How do you staff the clinics?",
    opts: [
      opt("quarters", "Staff quarters inside walled clinics", "Costs more; nurses stay.", { costF: 1.1, good: { text: "Nurses stayed in the walled clinics all year.", fx: { hp: .02, app: 3 } } }),
      opt("mobile", "Mobile clinics with escorts, by day", "No nights in the village.", { good: { text: "Escorted mobile clinics reached the villages every week.", fx: { hp: .01, app: 3 } } }),
      opt("plain", "Renovate and post the nurses", "The cheapest.", { costF: .9, risk: { p: .35, title: "The nurses left", text: "Gunmen kidnapped a nurse; the others left. Three clinics are shut.", fx: { hp: -.01, app: -3 } } }),
    ] };
  return null;
};

const SECURITY = (P) => {
  const F = P.secForce;
  if (!F) return null;
  const region = P.secRegion;
  const facts = {
    west: "The six South-West states set up the Western Nigeria Security Network, Amotekun, in 2020. Each state passed its own law.",
    east: "The South-East governors set up Ebube Agu in 2021. Rights groups have accused some state outfits of abuses.",
    north: P.state === "Kano" ? "Kano passed a Security Neighbourhood Watch Law in April 2025." : "Katsina, Zamfara and Sokoto set up their own community guard corps by law against bandits.",
    civilian: "The Civilian JTF of local volunteers has fought beside the army against Boko Haram since 2013.",
  };
  return { head: "The " + F, nm: "⭐ Fund the " + F, d: region === "civilian" ? "Pay, train and equip the local volunteers who fight beside the army: 3,000 of them." : "Recruit, train and equip 3,000 " + F + " guards under state law. Federal Police HQ will protest.",
    why: "In " + P.name + " the community guards are the " + F + ".", fact: facts[region] || "Many states run community security outfits under their own laws; the Constitution gives policing to the Federation.", art: region ? "amotekun-" + region : null, q: "How are they kept in line?",
    opts: [
      opt("oversight", "A complaints board and training on rights", "Slower; fewer abuses.", { costF: 1.05, good: { text: "The " + F + " patrol and the complaints board keeps them clean.", fx: { sec: .01, app: 3 } } }),
      opt("fast", "Deploy fast, train on the job", "Quick results; some will abuse their power.", { risk: { p: .35, title: "Guards accused of abuse", text: "Rights groups accuse " + F + " guards of beating and detaining people without charge.", fx: { app: -4 } }, good: { text: "The " + F + " are on the roads and the kidnappings are down.", fx: { sec: .02, app: 2 } } }),
    ] };
};

/* The local version of a programme: its own name, picture, the line that says what is different here, and the
   question. Returns p unchanged if nothing is different; null if the programme does not make sense here. */
export const localProgramme = (p, state, ctx = {}) => {
  if (!p || !state || state === "Nigeria") return p;
  const P = profileOf(state, ctx);
  // Dry-season irrigation in the rainforest makes no sense.
  if (p.id === "kpa_irrigation" && !["dry", "savannah", "plateau"].includes(P.land)) return null;
  let L = null;
  if (p.id === "rural_elec") L = ELEC(P);
  else if (p.id === "water") L = WATER(P);
  else if (p.id === "roads") L = ROADS(P);
  else if (p.id === "irrigation" || p.id === "kpa_irrigation") L = IRRIG(P);
  else if (p.id === "classrooms" || p.id === "free_edu") L = SCHOOLS(P, p.id);
  else if (p.id === "phc") L = HEALTH(P, p.id);
  else if (p.id === "amotekun") L = SECURITY(P);
  const out = { ...p };
  if (p.id === "school_feed") { out.d = "Hot meals for 500K pupils every school day: " + P.food + ", bought from " + P.name + "'s farmers." + (P.land === "creek" ? " The food goes by boat to the creek schools." : ""); if (P.land === "creek") out.c = Math.round(p.c * 1.2 * 100) / 100; out.art = P.north ? "school_feed-north" : "school_feed-south"; out.local = { why: P.land === "creek" ? "Food for the creek schools goes by boat, so it costs a fifth more." : "The menu is " + P.name + "'s own food.", fact: "The federal school feeding programme pays local cooks to buy from local farmers." }; }
  if (p.id === "farm_sub") { out.d = "Seeds, fertiliser and tools for 100K " + P.crops.join(" and ") + " farmers" + (P.bandits ? ", with escorts in the farming season." : "."); if (P.bandits) out.local = { why: "Farmers here cannot reach their farms in the bandits' season without escorts.", fact: "In Zamfara and Katsina, bandits levy farmers before they let them harvest." }; }
  if (p.id === "outreach" && P.land === "creek") { out.d = "Mobile clinics by boat to every creek LGA: eye surgery, safe deliveries, free drugs."; out.c = Math.round(p.c * 1.3 * 100) / 100; out.local = { why: "The clinics go by boat, so it costs more.", fact: "Many creek communities in the Delta have no road at all." }; }
  if (p.id === "school_voucher" && !P.almajiri) out.d = "Direct fee voucher to poor parents: keeps children in school and off the streets.";
  if (p.id === "okada_kit" && P.state === "Lagos") out.local = { why: "Lagos has already banned okadas on its highways and in several LGAs since 2022.", fact: "The 2022 ban covered six Lagos LGAs, and riders protested." };
  if (!L) return out;
  if (L.nm) out.nm = (/^⭐/.test(p.nm) && !/^⭐/.test(L.nm) ? "⭐ " : "") + L.nm;
  if (L.d) out.d = L.d;
  if (L.ptype) out.ptype = L.ptype;
  if (L.art) out.art = L.art;
  out.local = { why: L.why, fact: L.fact, head: L.head, land: P.land };
  if (L.q && L.opts && L.opts.length) out.ask = { q: L.q, opts: L.opts };
  return out;
};
export const localProgrammes = (list, state, ctx = {}) => (list || []).map(p => localProgramme(p, state, ctx)).filter(Boolean);

/* Apply the chosen answer: the cost and years change now; the risk (or the good result) is rolled once, seeded by the
   state, the programme and the year, and lands next year as a delayed effect. */
export const applyLocalPick = (p, o, { state = "", turn = 1, capital = false } = {}) => {
  if (!p || !o) return { p, later: null };
  const np = { ...p, pick: o.id, pickNm: o.l, t: (p.t || 1) + (o.tAdd || 0), fx: { ...(p.fx || {}) }, ...(o.site ? { site: o.site } : {}) };
  if (capital) np.costF = o.costF || 1; else np.c = Math.round((p.c || 0) * (o.costF || 1) * 100) / 100;
  Object.entries(o.fx || {}).forEach(([k, v]) => { np.fx[k] = Math.round(((np.fx[k] || 0) + v) * 1000) / 1000; });
  const r = seeded("local", state, p.id, o.id, turn);
  let later = null;
  if (o.risk && r() < o.risk.p) later = { turn: turn + 1, made: turn, from: "chose “" + o.l + "” for " + String(p.nm || "").replace(/^⭐\s*/, ""), fx: o.risk.fx, desc: o.risk.title + ": " + o.risk.text, bad: true };
  else if (o.good) later = { turn: turn + 1, made: turn, from: "chose “" + o.l + "” for " + String(p.nm || "").replace(/^⭐\s*/, ""), fx: o.good.fx, desc: o.good.text };
  return { p: np, later };
};

// ── Bills ──
const NEIGHBOUR_GRAZING = (st) => Object.keys(GRAZING_LAW).filter(x => x !== st).slice(0, 3).map(name);
export const localBill = (b, state, ctx = {}) => {
  if (!b || !state || state === "Nigeria") return b;
  const P = profileOf(state, ctx), out = { ...b };
  if (b.id === "open_grazing") {
    if (P.grazingLaw) return { ...out, nm: "Anti-Open Grazing Enforcement Law", d: P.name + " banned open grazing in " + P.grazingLaw + ". Most herds still roam: the law has no rangers, no ranches and no courts to make it real. This one funds all three.", fx: { sec: .05, agr: .01, app: 3 }, sk: { traditional: -2, business: 4 }, cost: 1.2, art: "bill-ranching", fact: "States from Benue (2017) to Ogun (2021) have banned open grazing; enforcement is weak in most of them." };
    if (P.sharia && P.north) return { ...out, nm: "Grazing Reserves and Ranching Law", d: "Revive " + P.name + "'s old grazing reserves: boreholes, vets and marked cattle routes away from farms. Herders get somewhere to go; farmers keep their crops.", fx: { sec: .03, agr: .02, app: 3 }, sk: { traditional: 4, religious: 2 }, cost: 1, art: "bill-grazing_reserve", fact: "Northern Nigeria has hundreds of old grazing reserves; most have no water and have been farmed over." };
    return { ...out, fact: "Neighbouring states with such a law: " + NEIGHBOUR_GRAZING(state).join(", ") + "." };
  }
  if (b.id === "child_rights") {
    if (P.cra) return { ...out, nm: "Family Courts Law", d: P.name + " has domesticated the Child Rights Act. Without family courts and child-protection officers it is a law on paper: this funds both.", fx: { lit: .01, hp: .01, app: 2 }, sk: { youth: 4, media: 4 }, cost: .5, art: "bill-family_court", fact: "Most southern states domesticated the 2003 Child Rights Act years ago, but few have working family courts in every division." };
    return { ...out, d: b.d + " " + P.name + " is one of about ten northern states yet to domesticate the 2003 Child Rights Act. The fight is over the age of marriage.", sk: { religious: -9, youth: 4, media: 6 }, fact: "UNICEF lists Adamawa, Bauchi, Borno, Gombe, Jigawa, Kano, Katsina, Sokoto, Yobe and Zamfara as yet to domesticate it." };
  }
  if (b.id === "vapp") {
    if (P.vappWaiting) return { ...out, d: b.d + " The last House passed it; it was never signed. It is on your desk again.", fact: "Rivers and Taraba passed the law in the House but it waited for the governor's assent." };
    if (!P.vapp) return { ...out, sk: { religious: -6, youth: 6, media: 6 }, d: b.d + " Kano is the one state that has not passed it.", fact: "Thirty-three states have domesticated the 2015 VAPP Act; Kano has not." };
    return { ...out, nm: "Sexual Assault Referral Centres Law", d: P.name + " has the VAPP law. This funds what makes it work: a referral centre in every senatorial district, forensic kits and a sex offenders' register.", fx: { hp: .01, app: 3 }, sk: { youth: 6, media: 6 }, cost: .6, art: "bill-sarc", fact: "Nearly every state has domesticated the 2015 VAPP Act; far fewer fund the referral centres it relies on." };
  }
  return out;
};
/* The state's own extra bills. */
export const stateBills = (state, ctx = {}) => {
  if (!state || state === "Nigeria") return [];
  const P = profileOf(state, ctx), out = [];
  if (!P.ownMarket) out.push({ id: "elec_market", nm: "State Electricity Market Law", d: "Take over " + P.name + "'s power market from NERC, as the Electricity Act 2023 allows: a state regulator that licenses mini-grids in weeks, sets fair tariffs and can fine the power company.", fx: { infra: .02, app: 2 }, sk: { business: 6 }, cost: .4, art: "bill-power_market", fact: "Fifteen states have done it since 2024, from Enugu and Ekiti first to Lagos in June 2025.", ownMarket: true });
  else out.push({ id: "elec_consumer", nm: "Electricity Consumer Protection Law", d: P.name + " regulates its own power market. This law ends estimated billing, gives every home a meter within a year and fines the company for blackouts it hides.", fx: { app: 5 }, sk: { business: -4, youth: 6 }, cost: .2, art: "bill-power_market", fact: P.ring ? "In Abia, metering the Aba ring alone is costed at ₦32 billion." : "Under the Electricity Act 2023 a state regulator sets the rules for its own market." });
  if (P.oil) out.push({ id: "host_trust", nm: "Host Communities Trust Law", d: P.name + " gets 13% of the oil money produced here. This law puts part of it in trusts run by the communities that live with the spills and the flares.", fx: { sec: .03, app: 4 }, sk: { traditional: 5, party: -4 }, cost: 1, art: "bill-host_trust", fact: "The Constitution gives oil states at least 13% of the oil revenue from their land (derivation)." });
  else out.push({ id: "revenue_law", nm: "Revenue Administration Law", d: "One state collector for every levy, paid by card or transfer with a receipt. No more touts at the motor parks and markets.", fx: { corM: -.03, app: 2 }, sk: { business: 6, unions: -2 }, cost: .3, art: "bill-revenue", fact: P.state === "Lagos" ? "Lagos raises more of its own money than any state: most of it through one revenue service." : "Most states earn little of their own money; touts take much of what is collected." });
  if (P.land === "gully") out.push({ id: "erosion_law", nm: "Erosion and Watershed Control Law", d: "No building within 100 metres of a gully head, no sand mining near gullies, and drains on every new road.", fx: { infra: .02, hp: .01, app: 2 }, sk: { business: -4, traditional: -2 }, cost: .4, art: "bill-erosion", fact: "Anambra alone has hundreds of active gullies; some have swallowed whole streets." });
  if (P.floods || P.land === "creek") out.push({ id: "flood_law", nm: "Flood Plain Setback Law", d: "No new building on the flood plain, warnings from the federal hydrology agency sent to every LGA, relief camps marked before the rains.", fx: { hp: .01, app: 2 }, sk: { business: -3 }, cost: .4, art: "bill-flood", fact: "The 2022 floods displaced over a million Nigerians in states along the Niger and Benue." });
  if (P.land === "creek" || P.land === "lagoon") out.push({ id: "waterways", nm: "Inland Waterways Safety Law", d: "Licensed boats, a life jacket for every passenger, no night sailing and no overloading.", fx: { sec: .01, hp: .01, app: 2 }, sk: { unions: -2 }, cost: .2, art: "bill-waterways", fact: "Boat accidents kill hundreds of Nigerians every year, most without life jackets." });
  if (P.bandits || P.insurgency) out.push({ id: "forest_guards", nm: "Forest Guards Law", d: "Recruit local hunters as forest guards in the forests where " + (P.insurgency ? "insurgents" : "bandits") + " camp, under state law and with the army.", fx: { sec: .04, app: 3 }, sk: { traditional: 4 }, cost: .8, art: "bill-forest_guards", fact: "Several northern states have recruited local hunters as forest guards since 2024; the forests are where kidnappers hold their victims." });
  if (P.hisbah) out.push({ id: "hisbah_board", nm: "Hisbah Board Law", d: "Set the limits of the Hisbah corps: no arrests (that is the police's job), a complaints desk, and women officers for women.", fx: { app: 2 }, sk: { religious: -3, media: 6, youth: 4 }, cost: .1, art: "bill-hisbah", fact: "Kano's Hisbah was set up in 2003 to enforce Sharia morals. It has no arrest powers and must hand offenders to the police." });
  return out;
};
export const localBills = (list, state, ctx = {}) => [...(list || []).map(b => localBill(b, state, ctx)), ...stateBills(state, ctx)];

/* House bills (the House sends them; you sign or veto). */
export const localHouseBill = (b, state, ctx = {}) => {
  if (!b || !state || state === "Nigeria") return b;
  const P = profileOf(state, ctx);
  if (b.id === "hb_almajiri" && !P.almajiri) return null;
  if (b.id === "hb_grazing" && P.grazingLaw) return { ...b, nm: "Anti-Open Grazing (Amendment) Bill", d: "Amends " + P.name + "'s " + P.grazingLaw + " anti-open grazing law: a ranching agency, impound yards and a mobile court. The old law was never enforced." };
  if (b.id === "hb_state_police" && P.secForce) return { ...b, nm: P.secForce + " Bill", d: "Puts the " + P.secForce + " on a state law under your control. Federal Police HQ will object loudly." };
  return b;
};
export const localHouseBills = (list, state, ctx = {}) => (list || []).map(b => localHouseBill(b, state, ctx)).filter(Boolean);

// Every picture a state version can ask for (docs/LOVABLE-STATES.md).
export const VARIANT_ART_ALL = ["rural_elec-ring", "rural_elec-gully", "rural_elec-lagoon", "rural_elec-sun", "rural_elec-creek", "water-deep", "water-creek", "water-city", "water-hill", "roads-swamp", "roads-gully", "roads-savannah", "roads-city", "irrigation-fadama", "irrigation-palm", "irrigation-cocoa", "irrigation-ricemill", "farm-fish", "school_feed-north", "school_feed-south", "free_edu-almajiri", "classrooms-raised", "classrooms-fenced", "phc-boat", "amotekun-west", "amotekun-east", "amotekun-north", "amotekun-civilian", "bill-ranching", "bill-grazing_reserve", "bill-family_court", "bill-sarc", "bill-power_market", "bill-host_trust", "bill-erosion", "bill-flood", "bill-waterways", "bill-forest_guards", "bill-hisbah", "bill-revenue"];

// ── The presidency: federal works go where they make sense (owner, 22 Nov 2026: "I saw a coastal road in Jigawa.
//    Which coast?"). A President's programme lands in a state; the coastal highway only on the coast, the railway only
//    on its route, the refineries in the Delta. Needs elsewhere are answered by works that fit them.
export const COAST = ["Lagos", "Ogun", "Ondo", "Delta", "Bayelsa", "Rivers", "Akwa_Ibom", "Cross_River"];
export const FED_WHERE = {
  f_coastal: { states: COAST, why: "The coastal highway runs along the Atlantic, Lagos to Calabar, through the eight coastal states." },
  f_rail: { states: ["Lagos", "Ogun", "Oyo", "Kwara", "Niger", "FCT", "Kaduna", "Kano"], why: "The Lagos–Kano line runs from the port through Ibadan, Ilorin, Minna and Kaduna to Kano." },
  f_gas: { states: ["Delta", "Edo", "Kogi", "FCT", "Niger", "Kaduna", "Kano"], why: "The north–south pipeline carries Delta gas through Ajaokuta, Abuja and Kaduna to Kano." },
  f_refinery: { states: ["Delta", "Bayelsa", "Rivers", "Akwa_Ibom", "Edo", "Imo", "Ondo"], why: "Modular refineries sit beside the oil fields of the Niger Delta." },
  f_second_bridge: { states: ["Anambra", "Delta", "Kogi", "Niger", "Kebbi", "Kwara"], why: "A bridge goes where the Niger is: Onitsha and Asaba, Lokoja, Jebba, the north." },
  f_mambilla: { states: ["Taraba"], why: "The dam is on the Mambilla Plateau in Taraba, the one highland with the rivers and the drop for 3,000 MW." },
};
const key_ = (place) => String(place || "").replace(/ /g, "_");
export const fedFits = (pid, place) => { const W = FED_WHERE[pid]; return !W || !place || W.states.includes(key_(place)); };
// Where a federal programme goes: the place asked for if it fits, else a state on its route (seeded).
export const fedPlace = (pid, wanted, seed = 1) => { const W = FED_WHERE[pid]; if (!W) return wanted || null; if (wanted && W.states.includes(key_(wanted))) return key_(wanted); return W.states[Math.abs(Number(seed) || 0) % W.states.length]; };
/* A project that cannot be where it was asked for: a seaport or a coastal road in a state with no coast. */
export const siteProblem = (type, place, text = "") => {
  const k = key_(place); if (!k || !LAND[k]) return null; // only a state we know
  const coastal = COAST.includes(k);
  if (type === "seaport" && !coastal) return name(k) + " has no coast: a seaport can only go in one of the eight coastal states (" + COAST.map(name).join(", ") + ").";
  if (/\bcoast(al)?\b/i.test(text) && !coastal) return name(k) + " has no coast. A coastal road runs only through the eight coastal states, Lagos to Calabar.";
  return null;
};

/* The President's programmes: each megaproject asks the question a President really faces about it. */
const FED_ASKS = {
  f_coastal: { q: "How do you build 700 km along the coast?", why: "The route runs along the beach from Lagos to Calabar: homes, resorts and fishing villages are in the way, and so are the creeks.", fact: "Coastal highways in Nigeria have meant demolitions on the Lekki coast, and court cases from the owners.",
    opts: [opt("lagos", "Start at the Lagos end, along the beach", "Fast where the money is. Homes and beach resorts in the way come down.", { site: "Lagos", risk: { p: .5, title: "Demolitions in court", text: "Owners of demolished homes and resorts on the Lagos coast took the government to court. The pictures went round the world.", fx: { app: -5 } }, good: { text: "The first section of the coastal highway opened from Lagos.", fx: { app: 4, infra: .02 } } }),
      opt("inland", "Re-route inland around the communities", "Costs more and takes a year more; nobody loses a home.", { costF: 1.2, tAdd: 1, good: { text: "The re-routed coastal highway opened without a demolition.", fx: { app: 4 } } }),
      opt("toll", "A toll road with a private partner", "Their money builds it; drivers pay for forty years.", { costF: .7, risk: { p: .4, title: "Tolls too high", text: "The concessionaire's tolls are the highest in West Africa. Truckers block the toll gates.", fx: { app: -4 } }, good: { text: "The tolled coastal highway is open and the Treasury paid little.", fx: { app: 2, infra: .02 } } })] },
  f_rail: { q: "How is the railway paid for?", why: "A standard-gauge line costs more than a year of the federal capital budget.", fact: "Nigeria's standard-gauge lines (Lagos–Ibadan, Abuja–Kaduna) were built largely with Chinese loans.",
    opts: [opt("loan", "A foreign loan with the lender's contractor", "Cheaper now; the loan's terms will be read in the newspapers.", { costF: .85, risk: { p: .35, title: "The loan's clauses", text: "A newspaper published the loan agreement: the lender can take assets if Nigeria defaults. The Senate wants answers.", fx: { app: -3 } }, good: { text: "The lender's contractor laid the track on time.", fx: { infra: .02, app: 3 } } }),
      opt("budget", "Budget money, phased over more years", "Nobody else's terms; a year more.", { tAdd: 1, good: { text: "The railway, paid for at home, is carrying freight.", fx: { app: 3 } } }),
      opt("ppp", "A private concession: they build it and run it", "The cheapest for the Treasury, if the investors come.", { costF: .6, risk: { p: .4, title: "The investors stalled", text: "The concessionaire could not raise the money. Work stopped for a year.", fx: { infra: -.02, app: -3 } } })] },
  f_gas: { q: "Who guards the pipeline?", why: "A pipeline through the Delta and the bandit corridors is a target the whole way.", fact: "Pipeline surveillance contracts have been given to ex-militant leaders in the Delta; critics call it paying the people who blew them up.",
    opts: [opt("army", "The police and the civil defence", "Costs more; under the state's eye.", { costF: 1.1, good: { text: "The pipeline ran a year without a breach.", fx: { app: 3, sec: .01 } } }),
      opt("militants", "Surveillance contracts with ex-militant groups", "They know the creeks. Some will call it a bribe.", { costF: .9, risk: { p: .35, title: "Paying the militants", text: "Newspapers reveal the surveillance contracts went to men who once blew up pipelines. The opposition calls it protection money.", fx: { app: -3, cor: .01 } }, good: { text: "The creeks stayed quiet and the gas flowed north.", fx: { app: 2, sec: .01 } } }),
      opt("communities", "Pay the host communities to guard it", "They gain from it staying whole.", { good: { text: "Host communities guarded the pipeline as their own.", fx: { app: 3, sec: .01 } }, risk: { p: .2, title: "A community dispute", text: "Two communities fought over who gets the guarding money; the line was cut for a week.", fx: { app: -2 } } })] },
  f_refinery: { q: "Who owns the refineries?", why: "Government refineries have run below capacity for decades; illegal refineries in the creeks make fuel and pollution every night.", fact: "Nigeria's state refineries have spent billions on repairs and run at a fraction of capacity for years.",
    opts: [opt("national", "The national oil company", "Government-owned, as before.", { risk: { p: .45, title: "Below capacity again", text: "The new refineries are running at a third of capacity. The repair contractor blames the crude supply.", fx: { app: -3 } } }),
      opt("private", "Private operators, with a share for the host communities", "Run for profit; the communities own a part.", { costF: .8, good: { text: "The modular refineries are running, and the host communities get dividends.", fx: { app: 4, sec: .01 } } }),
      opt("illegal", "License the illegal refiners and bring them in", "Turn the creek cooks into licensed operators.", { costF: .7, risk: { p: .35, title: "Still polluting", text: "The newly licensed refiners kept dumping waste in the creeks.", fx: { hp: -.01, app: -2 } }, good: { text: "Illegal refining fell as the creek refiners went legal.", fx: { sec: .02, app: 3 } } })] },
  f_second_bridge: { q: "Toll or free?", why: "Every Niger crossing carries the trade between the east, the west and the north; the queues cost billions.", fact: "The Second Niger Bridge between Asaba and Onitsha opened in 2022 after decades of promises.",
    opts: [opt("free", "Free, paid from the budget", "Everybody crosses free.", { good: { text: "Traders cross the new bridge free.", fx: { app: 4 } } }),
      opt("toll", "A tolled concession", "Cheaper for the Treasury; traders pay.", { costF: .7, risk: { p: .4, title: "Traders protest the toll", text: "Onitsha traders shut the market over the bridge toll.", fx: { app: -3 } } })] },
  f_mambilla: { q: "The old contract is in arbitration. What now?", why: "A great dam on the Mambilla Plateau has been planned since the 1980s. The last contract ended in a billion-dollar arbitration claim.", fact: "The Mambilla hydropower project has been delayed for decades by contract disputes and arbitration.",
    opts: [opt("settle", "Settle with the old contractor and go on", "Costs more; no court in Paris.", { costF: 1.1, good: { text: "Work started on the plateau at last.", fx: { app: 3, infra: .02 } } }),
      opt("restart", "Start again with a new contractor", "Clean start; the old contractor goes to arbitration.", { risk: { p: .45, title: "The arbitration award", text: "An arbitration tribunal ordered Nigeria to pay the old contractor damages.", fx: { app: -3 } } }),
      opt("bank", "With a foreign export bank's loan", "Cheaper money; a year more for the paperwork.", { costF: .85, tAdd: 1, good: { text: "The export bank's money is building the dam.", fx: { app: 3 } } })] },
  f_grid: { q: "Who builds the new lines?", why: "Power is generated but cannot reach homes: the transmission lines are the bottleneck.", fact: "Since the Electricity Act 2023, fifteen states run their own power markets; transmission is still federal.",
    opts: [opt("tcn", "The federal transmission company", "As it is done now.", { risk: { p: .3, title: "The grid collapsed anyway", text: "The grid collapsed again before the new substations were finished.", fx: { app: -3 } }, good: { text: "The new lines carry power to homes.", fx: { app: 3 } } }),
      opt("concession", "Concession the lines to private operators", "Their money; their tariffs.", { costF: .8, risk: { p: .35, title: "Tariffs up", text: "The new line operators raised tariffs. Labour threatens a strike.", fx: { app: -3 } }, good: { text: "Private operators built the lines fast.", fx: { infra: .02, app: 2 } } }),
      opt("states", "Fund the states that run their own markets to build", "The fifteen states build their own lines; slower in the rest.", { costF: .85, tAdd: 1, good: { text: "States with their own markets built lines to their towns.", fx: { app: 3 } } })] },
};
export const fedProgramme = (p) => {
  if (!p) return p;
  const A = FED_ASKS[p.id], W = FED_WHERE[p.id];
  if (!A && !W) return p;
  const out = { ...p, local: { head: String(p.nm || "").replace(/^⭐\s*/, ""), why: [W && W.why, A && A.why].filter(Boolean).join(" "), fact: A ? A.fact : null } };
  if (A) out.ask = { q: A.q, opts: A.opts };
  return out;
};
export const fedProgrammes = (list) => (list || []).map(fedProgramme);
