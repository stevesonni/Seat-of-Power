/* The Federal Government's own content (rules only, no React). The presidency
   runs on the governorship's engine, but a President does not run a state:
   the ministries, programmes, bills, executive orders, the National Assembly's
   bills, revenue measures, the country's needs and the projects are federal.
   The game swaps these in while the player is President.

   Money is in ₦B, against a federal year of about ₦620B (roughly ten times a
   large state's), so costs are larger than a governor's for the same effect.
   Every programme, company and person named here is fictional. */

// ── Ministries the President can create (the cabinet starts with the core ten).
export const FED_MINISTRIES = [
  { id: "fct", name: "Federal Capital Territory (FCT Minister)", icon: "🏙️", key: "infra", cost: 9, staff: 2400, unlock: ["housing", "market"], why: "Runs Abuja: land, roads, the city's estates and markets. The FCT Minister signs every plot in the capital, so honesty here matters more than anywhere." },
  { id: "budget", name: "Budget & National Planning", icon: "📊", key: "igr", cost: 5, staff: 900, unlock: [], why: "Drafts the Appropriation Bill and the national development plan. Without it, Finance drafts alone and padding creeps in." },
  { id: "petroleum", name: "Petroleum Resources", icon: "🛢️", key: "igr", cost: 8, staff: 1100, unlock: ["refinery", "pipeline"], why: "Licences, the refineries and the gas pipelines. Oil money is most of the Federation Account." },
  { id: "power", name: "Power", icon: "⚡", key: "infra", cost: 8, staff: 1300, unlock: ["power", "dam"], why: "The national grid, the transmission company and the hydro dams." },
  { id: "transport", name: "Transportation", icon: "🚆", key: "infra", cost: 8, staff: 1500, unlock: ["rail", "vehicles"], why: "Standard-gauge rail and the national bus and truck corridors." },
  { id: "aviation", name: "Aviation & Aerospace", icon: "✈️", key: "igr", cost: 6, staff: 800, unlock: ["airport"], why: "Airports, air traffic control and the national carrier question." },
  { id: "marine", name: "Marine & Blue Economy", icon: "⚓", key: "igr", cost: 6, staff: 900, unlock: ["seaport"], why: "Seaports, the waterways and fisheries. Port delays cost importers billions." },
  { id: "commerce", name: "Industry, Trade & Investment", icon: "🏭", key: "igr", cost: 7, staff: 1200, unlock: ["industrial"], why: "Special economic zones and investors. A good minister brings factories." },
  { id: "foreign", name: "Foreign Affairs", icon: "🌍", key: "app", cost: 6, staff: 1600, unlock: [], why: "Embassies, ECOWAS and the world stage. Nigerians stranded abroad call here first." },
  { id: "police", name: "Police Affairs", icon: "🚓", key: "sec", cost: 6, staff: 600, unlock: ["cctv"], why: "Oversees the Nigeria Police Force: funding, welfare and reform." },
  { id: "humanitarian", name: "Humanitarian Affairs & Poverty Reduction", icon: "🤲", key: "app", cost: 6, staff: 900, unlock: [], why: "The National Social Register, cash transfers and the displaced. Popular, if the money reaches the poor." },
  { id: "water", name: "Water Resources & Sanitation", icon: "🚰", key: "hp", cost: 6, staff: 1400, unlock: ["water", "dam"], why: "River basins, irrigation dams and the national water programme." },
  { id: "digital", name: "Communications, Innovation & Digital Economy", icon: "💻", key: "lit", cost: 6, staff: 700, unlock: [], why: "Broadband, national ID and e-government." },
  { id: "minerals", name: "Solid Minerals Development", icon: "⛏️", key: "igr", cost: 5, staff: 600, unlock: [], why: "Mining licences and the fight against illegal mining that funds bandits." },
  { id: "sports", name: "Youth & Sports Development", icon: "🏟️", key: "app", cost: 6, staff: 1000, unlock: ["stadium", "esports"], why: "The national teams, youth service and young people's jobs." },
  { id: "nigerdelta", name: "Niger Delta Development", icon: "🌊", key: "app", cost: 6, staff: 800, unlock: [], why: "The oil-producing communities. Neglect them and the pipelines are cut." },
  { id: "tourism", name: "Arts, Culture & Tourism", icon: "🎭", key: "igr", cost: 4, staff: 500, unlock: ["tourist"], why: "Nollywood, festivals and the national heritage sites." },
  { id: "env", name: "Environment", icon: "🌳", key: "hp", cost: 4, staff: 900, unlock: ["landfill"], why: "Erosion, desertification and oil spills." },
  // Part of the first cabinet; here so a President without one can create it.
  { id: "sec", name: "Defence", icon: "🎖️", key: "sec", cost: 10, staff: 2200, unlock: [], why: "Funds the armed forces and runs their procurement: jets, drones, ships. The service chiefs command; the ministry buys." },
];
// The ministry a national need must have before it can be answered.
export const FED_NEED_MINISTRY = { water: "water", power: "power", housing: "fct", traffic: "transport", youth: "sports", poverty: "humanitarian", land: "fct", jobs: "commerce", digital: "digital" };
// The ministry a federal project type must have.
export const FED_PROJECT_MINISTRY = { rail: "transport", refinery: "petroleum", pipeline: "petroleum", seaport: "marine", airport: "aviation", power: "power", dam: "water", housing: "fct", industrial: "commerce", stadium: "sports", tourist: "tourism" };
// The cabinet the President starts with (ids match the governor's, names are federal).
export const FED_CORE = {
  works: "Works", health: "Health & Social Welfare", educ: "Education", agric: "Agriculture & Food Security", sec: "Defence",
  fin: "Finance & the Economy", just: "Justice (Attorney-General of the Federation)", info: "Information & National Orientation", lg: "Interior", wom: "Women Affairs",
};

// ── Federal project types the President can build (the governor's list minus local ones).
export const FED_TYPES = ["road", "bridge", "rail", "pipeline", "refinery", "power", "dam", "seaport", "airport", "hospital", "school", "housing", "industrial", "water"];
export const FED_ONLY = ["rail", "pipeline", "refinery", "seaport", "airport"];

// ── Programmes (same shape as the governor's POLICIES).
const P = (id, nm, s, c, t, fx, d, cr, ecoSec, ecoBoost, jobsAdd, compDesc) => ({ id, nm, s, c, t, fx, d, cr, ecoSec, ecoBoost, jobsAdd, compDesc, federal: true });
export const FED_POLICIES = [
  // One year
  P("f_school_feed", "National Home-Grown School Feeding", "education", 30, 1, { lit: .02, hp: .01, agr: .01, app: 6 }, "A hot meal a day for 10 million pupils, cooked by local women from local farms.", .15, "agriculture", .02, 90000, "School meals for 10 million pupils"),
  P("f_cash", "National Social Register cash transfers", "administration", 45, 1, { app: 6, hp: .01 }, "₦25,000 a month to 15 million poor households, paid to verified bank accounts.", .12, "services", .01, 0, "Cash transfers reaching 15 million households"),
  P("f_student_loans", "Student Loans Fund", "education", 25, 1, { lit: .03, app: 4 }, "Interest-free loans for university fees, repaid after national service and two years of work.", .06, "services", .01, 2000, "Student loans for 400,000 undergraduates"),
  P("f_nhia", "Health insurance for the poorest", "health", 35, 1, { hp: .03, app: 5 }, "The federal government pays health insurance premiums for 20 million of the poorest.", .08, "services", .02, 12000, "Health cover for 20 million of the poorest"),
  P("f_ippis", "Biometric federal payroll (no more ghost workers)", "administration", 6, 1, { corM: -.05, app: 2 }, "Every federal worker verified by fingerprint and BVN. Ghost names come off the payroll.", 0, null, 0, 0, "A verified federal payroll"),
  P("f_police_recruit", "Recruit 30,000 police officers", "security", 40, 1, { sec: .05, app: 4 }, "Trained in Kaduna and Ikeja, posted to their own states, paid on time.", .05, null, 0, 30000, "30,000 new police officers on the streets"),
  // Two years
  P("f_jobs_corps", "National Youth Jobs Corps", "education", 60, 2, { lit: .02, app: 7 }, "Two-year paid placements for 500,000 graduates in schools, clinics and farms.", .15, "services", .03, 500000, "500,000 young graduates in paid placements"),
  P("f_grid", "Grid rescue: transmission lines and substations", "infrastructure", 120, 2, { infra: .06, app: 6 }, "New transmission lines and substations so the power we generate reaches homes.", .1, "manufacturing", .05, 25000, "4,000 MW more reaching homes and factories"),
  P("f_anchor", "Farmers' loans against the harvest", "agriculture", 50, 2, { agr: .07, app: 5 }, "Seeds and fertiliser on credit for 2 million farmers, repaid in grain to the strategic reserve.", .18, "agriculture", .05, 60000, "Farm loans for 2 million farmers"),
  P("f_state_police", "State police pilot in six states", "security", 45, 2, { sec: .06, app: 3 }, "Six states, one per zone, run their own police under federal standards. Governors cheer; the IGP does not.", .08, null, 0, 18000, "State police running in six states"),
  P("f_national_id", "A national ID for every Nigerian", "administration", 25, 2, { corM: -.03, lit: .01, app: 3 }, "Every citizen enrolled; banks, SIM cards and benefits linked to one number.", .05, "tech", .03, 15000, "100 million Nigerians enrolled"),
  P("f_primary_health", "Revive 10,000 primary health centres", "health", 80, 2, { hp: .07, app: 6 }, "One working clinic per ward: a midwife, drugs, solar power and clean water.", .1, "services", .02, 40000, "10,000 primary health centres working again"),
  // Megaprojects
  P("f_coastal", "⭐ The Coastal Highway", "infrastructure", 260, 4, { infra: .12, app: 10 }, "700 km of highway along the coast from Lagos to Calabar. Ports, resorts and estates follow.", .2, "trade", .07, 80000, "The coastal highway, Lagos to Calabar"),
  P("f_rail", "⭐ The Lagos–Kano standard-gauge railway", "infrastructure", 300, 4, { infra: .14, app: 12 }, "Fast freight and passenger trains from the ports to the north.", .18, "trade", .08, 60000, "The Lagos–Kano railway carrying freight"),
  P("f_gas", "⭐ The north–south gas pipeline", "infrastructure", 220, 3, { infra: .08, app: 6 }, "Gas from the delta to power plants and factories in the north.", .15, "manufacturing", .07, 30000, "Gas flowing north to power plants and factories"),
  P("f_refinery", "⭐ Modular refineries in the Niger Delta", "infrastructure", 160, 3, { infra: .05, app: 8 }, "Six small refineries run with the oil communities. Fewer imports, fewer illegal refineries.", .15, "manufacturing", .06, 20000, "Six modular refineries producing fuel"),
  P("f_second_bridge", "⭐ A second bridge over the Niger", "infrastructure", 150, 3, { infra: .08, app: 9 }, "A second crossing between the east and the west. Trade stops queuing at the old bridge.", .15, "trade", .05, 15000, "A second bridge over the Niger"),
  P("f_mambilla", "⭐ A 3,000 MW hydropower dam", "infrastructure", 280, 4, { infra: .12, app: 8 }, "A great dam on a highland river. The biggest single addition to the grid in a generation.", .2, "manufacturing", .08, 50000, "A 3,000 MW hydro dam feeding the grid"),
];
// The national needs each federal programme answers.
const FED_FIX = {
  road: ["f_coastal", "f_second_bridge", "f_rail"], clinic: ["f_primary_health", "f_nhia"], school: ["f_school_feed", "f_student_loans"],
  water: ["f_primary_health"], security: ["f_police_recruit", "f_state_police"], farm: ["f_anchor"], power: ["f_grid", "f_mambilla", "f_gas"],
  housing: [], traffic: ["f_rail"], youth: ["f_jobs_corps"], poverty: ["f_cash"], land: [], jobs: ["f_gas", "f_refinery"], digital: ["f_national_id", "f_ippis"],
};

/* The country's needs, in a President's terms: l is a state. Each overrides
   the governor's text for the same need. */
export const FED_NEEDS = {
  road: { fix: FED_FIX.road, title: (l) => "The federal highway through " + l + " has collapsed", why: (l) => "Trucks queue for two days at the washed-out stretch in " + l + ". Food from the north rots before it reaches the south.", ask: "Start the coastal highway, the second Niger bridge or the railway.", fail: (l) => "A fuel tanker overturned on the federal highway in " + l + ". Dozens dead. The governor blames Abuja.", abandon: (l) => "The federal road contractor in " + l + " has gone. The road is worse than before.", win: (l) => "The federal highway through " + l + " is open again. Food prices in the south ease." },
  clinic: { fix: FED_FIX.clinic, title: (l) => "The federal medical centre in " + l + " is on strike", why: (l) => "Resident doctors have not been paid for three months. Many have left for Britain.", ask: "Revive the primary health centres or fund health insurance for the poorest.", fail: (l) => "Patients died at the federal medical centre in " + l + " during the strike.", abandon: (l) => "The new federal hospital wing in " + l + " has no equipment.", win: (l) => "Doctors are back at work in " + l + ". The waiting lists are shrinking." },
  school: { pic: "scenes/campus-shut", fix: FED_FIX.school, title: (l) => "Universities in " + l + " are shut", why: (l) => "Lecturers' union strike: eight months and counting. Students sell phones to eat.", ask: "Fund school feeding or the Student Loans Fund, and settle with the unions.", fail: (l) => "Students in " + l + " block the federal highway in protest.", abandon: (l) => "The federal university hostels in " + l + " stand roofless.", win: (l) => "Lectures resume across " + l + ". The class of this year will graduate on time." },
  water: { fix: FED_FIX.water, title: (l) => "Cholera outbreak in " + l, why: (l) => "The NCDC counts 2,000 cases. The river basin authority's dam has not delivered water in years.", ask: "Revive the primary health centres; create the Ministry of Water Resources.", fail: (l) => "The cholera outbreak in " + l + " has spread to three neighbouring states.", abandon: (l) => "The federal water project in " + l + " was paid for and never finished.", win: (l) => "The outbreak in " + l + " is over. Clean water flows from the dam." },
  security: { fix: FED_FIX.security, title: (l) => "Bandits are kidnapping on the highways in " + l, why: (l) => "Travellers are taken in dozens. The police are outnumbered and the army is stretched.", ask: "Recruit police officers or pilot state police.", fail: (l) => "Forty passengers kidnapped from a bus in " + l + ". The governor asks why Abuja is silent.", abandon: (l) => "The new police barracks in " + l + " was never manned.", win: (l) => "The highways in " + l + " are patrolled. Traffic moves at night again." },
  farm: { fix: FED_FIX.farm, title: (l) => "Farmers in " + l + " cannot plant", why: (l) => "Fertiliser costs four times last year's price, and bandits tax the farms.", ask: "Lend farmers seeds and fertiliser against the harvest.", fail: (l) => "The harvest in " + l + " failed. Food inflation hits 40%.", abandon: (l) => "The fertiliser for " + l + " was diverted and sold in Niger.", win: (l) => "A bumper harvest in " + l + ". The strategic grain reserve is filling." },
  power: { fix: FED_FIX.power, title: (l) => "The national grid has collapsed again", why: () => "The fifth collapse this year. Hospitals run on diesel; factories shut.", ask: "Rescue the grid, build the gas pipeline or the hydro dam.", fail: (l) => "The grid collapsed for a week. In " + l + ", a hospital lost patients on ventilators.", abandon: () => "The new substations were never connected.", win: () => "The grid has held for a year. Factories are working night shifts." },
  housing: { fix: FED_FIX.housing, title: (l) => "Abuja's workers live two hours away", why: () => "Rents in the capital have doubled. Civil servants sleep in their offices on weekdays.", ask: "Appoint an FCT Minister and build federal housing estates.", fail: () => "A shanty town in Abuja was demolished; thousands homeless. The pictures go round the world.", abandon: () => "The federal estate outside Abuja is half-built and occupied by squatters.", win: () => "Federal workers move into the new estates. Rents ease." },
  traffic: { pic: "scenes/port-congestion", fix: FED_FIX.traffic, title: (l) => "The ports are choked: trucks back up into " + l, why: () => "Containers wait a month. Importers pay demurrage, and prices rise.", ask: "Create the Ministry of Transportation and build the railway.", fail: () => "A truck fire on the port road. Ten dead, and a week of gridlock.", abandon: () => "The rail spur to the port stops a mile short.", win: () => "Freight leaves the port by train. The trucks are gone." },
  youth: { fix: FED_FIX.youth, title: (l) => "Young graduates in " + l + " are leaving the country", why: () => "Doctors, engineers and coders queue for visas. Those who stay have no jobs.", ask: "Create the Ministry of Youth, then start the National Youth Jobs Corps.", fail: (l) => "A protest by young people in " + l + " turns violent.", abandon: () => "The jobs corps paid ghost names for a year.", win: (l) => "Graduates in " + l + " are in paid placements. Fewer are leaving." },
  poverty: { fix: FED_FIX.poverty, title: (l) => "Hunger in " + l, why: () => "Food inflation is at a record. Families eat once a day.", ask: "Create the Ministry of Humanitarian Affairs, then pay cash transfers from the Social Register.", fail: (l) => "Stampede at a food distribution in " + l + ". The world sees it.", abandon: () => "The Social Register was stuffed with ghost names.", win: (l) => "Cash reaches the poorest homes in " + l + ". The markets are busy again." },
  land: { pic: "scenes/abuja-skyline", fix: FED_FIX.land, title: () => "Land racketeering in Abuja", why: () => "The same plot in the capital is sold three times. Embassies and investors can't get titles.", ask: "Appoint an FCT Minister and clean up the land registry.", fail: () => "An investor walks away from a ₦200B Abuja project over a land dispute.", abandon: () => "The Abuja land registry computers sit in their boxes.", win: () => "Abuja's land titles are online. Investors are back." },
  jobs: { fix: FED_FIX.jobs, title: (l) => "Factories are closing in " + l, why: () => "No gas, no power, and the naira is falling. Manufacturers import their own generators.", ask: "Create the Ministry of Industry, then build the gas pipeline or the refineries.", fail: (l) => "The biggest factory in " + l + " shuts. Five thousand jobs gone.", abandon: () => "The special economic zone has a gate and no factories.", win: (l) => "Gas reaches the factories in " + l + ". They are hiring again." },
  digital: { pic: "objects/national-id-card", fix: FED_FIX.digital, title: () => "Federal pensions take a year to pay", why: () => "Files go missing in the ministries. Retired soldiers protest at the Ministry of Finance.", ask: "Create the Ministry of Digital Economy, then the national ID or the biometric payroll.", fail: () => "Retired soldiers block the Ministry of Finance for three days.", abandon: () => "The new federal e-government platform never went live.", win: () => "Pensions are paid in a month. Files are online." },
};

// ── Bills the President sends to the National Assembly (shape of the governor's BILLS).
export const FED_BILLS = [
  { id: "f_electoral", nm: "Electoral Act (Amendment) Bill", d: "Results sent electronically from every polling unit, in real time. Rigging gets harder, including for your own party.", fx: { corM: -.04, app: 5 }, sk: { media: 10, youth: 10, party: -8 }, cost: 2 },
  { id: "f_pib", nm: "Petroleum Industry Bill", d: "Splits the national oil company into a commercial company and a regulator; 3% of oil profits to the host communities.", fx: { corM: -.03, app: 3 }, sk: { business: 10, party: -4 }, cost: 0 },
  { id: "f_state_police_amend", nm: "Constitution Alteration: state police", d: "Moves police from the Exclusive List so states can have their own. Needs two-thirds of both chambers and 24 State Houses of Assembly.", fx: { sec: .04, app: 4 }, sk: { traditional: 4, party: -5 }, cost: 0 },
  { id: "f_tax", nm: "Tax Reform Bill", d: "One revenue service, fewer taxes, and VAT shared more by where it is consumed. Lagos gains; the north protests.", fx: { app: 2, corM: -.02 }, sk: { business: 10, religious: -4 }, cost: 0 },
  { id: "f_whistle", nm: "Whistleblower Protection Bill", d: "Protection and a reward of up to 5% for reporting stolen public money.", fx: { corM: -.04, app: 3 }, sk: { media: 8, party: -4 }, cost: 0 },
  { id: "f_lg_autonomy", nm: "Local Government Autonomy Bill", d: "Councils get their Federation Account share directly. Governors lose control of it; they will lobby their senators.", fx: { app: 4, corM: -.02 }, sk: { youth: 6, traditional: 4, party: -8 }, cost: 0 },
  { id: "f_min_wage", nm: "National Minimum Wage Act", d: "A new national minimum wage of ₦70,000. Labour is happy; many states say they cannot pay.", fx: { app: 6 }, sk: { unions: 15, business: -6 }, cost: 30 },
  { id: "f_poca", nm: "Proceeds of Crime Bill", d: "Assets that cannot be explained are forfeited, even without a conviction.", fx: { corM: -.05, app: 3 }, sk: { media: 6, party: -6 }, cost: 0 },
  { id: "f_electricity", nm: "Electricity Act", d: "States may generate, sell and regulate their own power. The national monopoly ends.", fx: { infra: .03, app: 3 }, sk: { business: 8 }, cost: 0 },
  { id: "f_mining", nm: "Mining (Enforcement) Bill", d: "Mining marshals and stiff fines for illegal mining that funds bandits.", fx: { sec: .02, app: 2 }, sk: { traditional: -3 }, cost: 4 },
  { id: "f_disability", nm: "Disability Rights Act (enforcement)", d: "Ramps, quotas and penalties: the 2019 law with teeth.", fx: { app: 2, hp: .01 }, sk: { media: 4 }, cost: 2 },
  { id: "f_not_too_young", nm: "Youth in Office Bill", d: "Lowers the age to run for the National Assembly and the presidency.", fx: { app: 3 }, sk: { youth: 12, party: -4 }, cost: 0 },
];

// ── Executive orders (shape of the governor's ORDERS). A President's are federal and can be challenged.
export const FED_ORDERS = [
  { id: "f_eo_business", i: "📈", nm: "Ease of doing business order", d: "Every agency must decide permits in 30 days or they are approved by default.", fx: { app: 1 }, rev: 4, sk: { business: 10 } },
  { id: "f_eo_tsa", i: "🏦", nm: "Treasury Single Account", d: "Every agency's money in one account at the Central Bank. Hidden accounts close.", fx: { corM: -.04 }, rev: 20, sk: { party: -4, business: 2 } },
  { id: "f_eo_local", i: "🇳🇬", nm: "Buy Nigerian: local content in federal contracts", d: "Federal contracts go first to Nigerian firms and Nigerian-made goods.", fx: { app: 3 }, sk: { business: 6 }, risk: { p: .25, fx: { app: -1 }, log: "Foreign partners complained; two contracts were delayed." } },
  { id: "f_eo_medical", i: "🏥", nm: "No foreign medical trips for officials at public cost", d: "Ministers and heads of agencies are treated at home or pay their own way.", fx: { app: 4, hp: .01 }, sk: { media: 8, party: -4 } },
  { id: "f_eo_visa", i: "🛂", nm: "Visa on arrival for Africans", d: "Every African passport holder gets a visa at the airport.", fx: { app: 1 }, rev: 3, sk: { business: 6 }, risk: { p: .2, fx: { app: -1 }, log: "Security agencies warned about porous borders." } },
  { id: "f_eo_border", i: "🚧", nm: "Close the land borders to smuggled rice", d: "Customs and the army shut the land borders to food imports for six months.", fx: { agr: .03, app: -3 }, sk: { business: -6, traditional: 2 }, risk: { p: .35, fx: { app: -2 }, log: "Food prices jumped and ECOWAS neighbours protested." } },
  { id: "f_eo_food", i: "🌾", nm: "Food security emergency", d: "Release grain from the strategic reserve and suspend duties on food imports for 150 days.", fx: { app: 5, agr: -.01 }, rev: -15, sk: { unions: 6 } },
  { id: "f_eo_assets", i: "🔍", nm: "Freeze assets under investigation", d: "Assets linked to corruption cases are frozen until the courts rule.", fx: { corM: -.03, app: 3 }, sk: { media: 6, party: -6 }, risk: { p: .3, fx: { app: -1 }, log: "A court ruled the order overreached; the SAN community applauded." } },
  { id: "f_eo_merge", i: "✂️", nm: "Merge overlapping federal agencies", d: "Hundreds of agencies doing the same job are merged or closed. Billions saved; thousands of jobs gone.", fx: { app: -2 }, rev: 25, sk: { unions: -10, business: 4 } },
  { id: "f_eo_lg_funds", i: "🏘️", nm: "Pay local governments directly", d: "The Federation Account pays councils straight into their own accounts.", fx: { app: 4, corM: -.02 }, sk: { party: -8, traditional: 3 }, risk: { p: .4, fx: { app: -2 }, log: "Governors went to the Supreme Court over the order." } },
  { id: "f_eo_curfew", i: "🌙", nm: "Deploy the army to the bandit corridors", d: "Under S.217 the armed forces support the police in the worst-hit states.", fx: { sec: .04, app: 1 }, sk: { traditional: 3, religious: -2 }, need: "security" },
  { id: "f_eo_power", i: "⚡", nm: "Emergency on power", d: "Fast-track transmission contracts and gas supply, skipping normal procurement.", fx: { infra: .02, app: 2, corM: .01 }, sk: { business: 6 }, need: "power" },
];

/* The National Assembly's own bills that reach your desk (shape of the
   governor's HOUSE_BILLS): sign or veto, and read the clauses. */
export const FED_HOUSE_BILLS = [
  { id: "nb_constituency", nm: "Constituency Projects Bill", d: "Each of the 469 members gets ₦1B a year for projects in their constituency.", signFx: { app: 2, corM: .04 }, signCost: 40, vetoFx: { app: 1 }, sk: { party: 10 }, vetoSk: { party: -12, media: 6 }, civic: "Constituency projects are popular with lawmakers, but the money is spent by the executive and often vanishes. Under S.58, a vetoed bill can be passed again by two-thirds of both chambers.",
    clauses: [
      { t: "Section 2: ₦1B a year for each member's constituency projects.", ok: true },
      { t: "Section 5: Members choose the contractors for their projects.", ok: false, flag: "Lawmakers choosing contractors for money the executive spends: a conflict of interest, and the route by which this money disappears." },
      { t: "Section 8: Every project published online with its location and contractor.", ok: true },
    ] },
  { id: "nb_nddc", nm: "Niger Delta Commission (Amendment) Bill", d: "A bigger budget for the commission, run by a board from the oil states.", signFx: { app: 3 }, signCost: 25, vetoFx: { app: -3 }, sk: { traditional: 5 }, vetoSk: { traditional: -6 }, civic: "The Niger Delta commission was created to develop the oil-producing region; forensic audits found thousands of abandoned projects.",
    clauses: [
      { t: "Section 1: The commission's share of oil company contributions rises to 4%.", ok: true },
      { t: "Section 6: Board members serve for life.", ok: false, flag: "Board members for life cannot be removed for failure or fraud. Every reform of the commission has failed on this." },
      { t: "Section 9: A yearly forensic audit, published.", ok: true },
    ] },
  { id: "nb_pensions", nm: "Lawmakers' Pensions Bill", d: "Lifetime pensions for former senators and representatives after one term.", signFx: { app: -6 }, signCost: 10, vetoFx: { app: 4 }, sk: { party: 8, media: -10 }, vetoSk: { party: -8, media: 8 }, civic: "Several states repealed pension laws for former governors after public anger. The National Assembly can override a veto with two-thirds.",
    clauses: [
      { t: "Section 2: A pension of 100% of salary for life after a single term.", ok: false, flag: "A lifetime pension after four years is more than any civil servant earns after thirty-five." },
      { t: "Section 4: Medical care abroad for former members and their families.", ok: false, flag: "This sends public money abroad for officials' care while federal hospitals strike." },
    ] },
  { id: "nb_peace_corps", nm: "Peace Corps Establishment Bill", d: "A new uniformed youth corps of 50,000, funded federally.", signFx: { app: 5 }, signCost: 35, vetoFx: { app: -3 }, sk: { youth: 12 }, vetoSk: { youth: -10 }, civic: "Nigeria has many overlapping security agencies. A new uniformed corps adds jobs, and costs, every year.",
    clauses: [
      { t: "Section 1: A Peace Corps of 50,000 for schools and communities.", ok: true },
      { t: "Section 7: The corps may carry arms.", ok: false, flag: "Another armed agency outside the police chain of command: the Constitution gives the police that role (S.214)." },
      { t: "Section 10: Recruitment published by state and zone.", ok: true },
    ] },
  { id: "nb_social_media", nm: "Protection from Internet Falsehoods Bill", d: "Fines and jail for 'false statements' online; the government can shut down websites.", signFx: { app: -4, corM: .02 }, signCost: 0, vetoFx: { app: 5 }, sk: { party: 6, media: -14, youth: -12 }, vetoSk: { media: 12, youth: 10 }, civic: "Section 39 of the Constitution protects freedom of expression. Courts have struck down laws like this elsewhere.",
    clauses: [
      { t: "Section 3: A minister may order any website blocked.", ok: false, flag: "No court, no appeal: a minister alone deciding what Nigerians may read." },
      { t: "Section 6: Up to three years in prison for 'false statements'.", ok: false, flag: "'False' is not defined. Journalists and critics will be the first charged." },
    ] },
  { id: "nb_disabilities", nm: "Federal Universities (Fees Waiver) Bill", d: "No tuition at federal universities for students from the poorest homes.", signFx: { app: 5, lit: .02 }, signCost: 20, vetoFx: { app: -4 }, sk: { youth: 10 }, vetoSk: { youth: -10 }, civic: "Education is on the Concurrent List; the federal government funds its own universities.",
    clauses: [
      { t: "Section 1: A fees waiver for students on the National Social Register.", ok: true },
      { t: "Section 4: The waiver is administered by each university's governing council.", ok: true },
    ] },
];

// ── Revenue measures for the Federal Government (shape of REVENUE_MEASURES).
export const FED_REVENUE = [
  { id: "f_customs", icon: "🛃", t: "Modernise Customs: scanners and a single window",
    what: "Every container scanned, every duty paid online. Smuggling and 'settlement' at the ports fall.",
    cost: "₦8B this year; the clearing agents' cartel protests (party −2)",
    gain: () => "Customs revenue +25% over three years (about +₦20B a year)",
    adopt: () => ({ fx: { pStab: -2 }, sched: [{ k: 0, revIGR: -8 }, { k: 1, revIGR: 8, taxEff: .08 }, { k: 2, taxEff: .08 }, { k: 3, taxEff: .08 }], log: "modernised the Customs Service with scanners and a single window", wiki: "Modernised the Customs Service: scanners at every port and a single online window for duties." }) },
  { id: "f_oil_theft", icon: "🛢️", t: "End oil theft: metering and pipeline surveillance",
    what: "Meters at every flow station and community surveillance contracts. Nigeria loses hundreds of thousands of barrels a day to theft.",
    cost: "₦12B this year; the networks behind the theft will fight back (security −1%)",
    gain: () => "Oil output up; about +₦35B a year to the Federation Account",
    adopt: () => ({ fx: { sec: -.01 }, sched: [{ k: 0, revIGR: -12 }, { k: 1, revIGR: 35 }], log: "metered every flow station and put the pipelines under surveillance", wiki: "Cut oil theft with meters at every flow station and pipeline surveillance." }) },
  { id: "f_vat", icon: "🧾", t: "Raise VAT from 7.5% to 10%",
    what: "VAT is shared with the states and councils. Food and medicine stay exempt.",
    cost: "Approval −4; labour threatens a strike",
    gain: () => "About +₦40B a year to the federal share",
    adopt: () => ({ fx: { app: -4 }, sched: [{ k: 0, revIGR: 40 }], log: "raised VAT to 10%", wiki: "Raised VAT from 7.5% to 10%, exempting food and medicine." }) },
  { id: "f_assets", icon: "🏦", t: "Sell idle federal assets",
    what: "Unused federal buildings, stakes in hotels and steel plants sold by open auction.",
    cost: "Unions protest (approval −1); the risk of cronies buying cheap",
    gain: () => "About ₦60B once, in the bank this year",
    adopt: () => ({ fx: { app: -1, cor: .01 }, sched: [], cashNow: 60, log: "sold idle federal assets by open auction", wiki: "Sold idle federal assets by open auction." }) },
];

// The President's cabinet titles for the governor's roles.
export const FED_CROLES = [
  { k: "cos", t: "Chief of Staff to the President", s: "administration" }, { k: "fin", t: "Minister of Finance", s: "administration" },
  { k: "edu", t: "Minister of Education", s: "education" }, { k: "hlt", t: "Minister of Health", s: "health" },
  { k: "wrk", t: "Minister of Works", s: "infrastructure" }, { k: "sec", t: "National Security Adviser", s: "security" },
  { k: "agr", t: "Minister of Agriculture", s: "agriculture" }, { k: "inf", t: "Minister of Information", s: "administration" },
  { k: "env", t: "Minister of the FCT", s: "infrastructure" }, { k: "wom", t: "Minister of Women Affairs", s: "health" },
];

/* The President's debt is the nation's: there is no Abuja to ask. Relief comes
   from the creditors. share: the part of the debt each holds; cut: the part
   of that share forgiven. ctx: { cor, reforms (revenue measures adopted),
   washington ("went" | "sent" | ...), app }. */
export const FED_CREDITORS = [
  { id: "paris", icon: "🏛️", nm: "Ask the Paris Club to forgive its loans", who: "the Paris Club of creditor nations", share: .3, cut: .6,
    note: "Rich creditor nations wrote off 60% of Nigeria's debt to them in 2005, for clean books and reform. Success: approval +4.",
    odds: (c) => Math.max(.05, Math.min(.75, .15 + (c.cor < .35 ? .2 : c.cor < .45 ? .05 : -.1) + (c.reforms >= 2 ? .2 : 0) + (c.app >= 55 ? .05 : 0))),
    why: (c) => [c.cor >= .35 ? "your corruption is too high" : null, c.reforms < 2 ? "you have not reformed revenue (2+ measures help)" : null].filter(Boolean),
    fx: { app: 4 }, failFx: { app: -1 } },
  { id: "imf", icon: "🌐", nm: "Take an IMF programme for debt relief", who: "the International Monetary Fund", share: .25, cut: .5,
    note: "Likely to succeed, but the conditions bite: end the fuel subsidy and let the naira float. Approval −5, labour angry.",
    odds: (c) => Math.max(.3, Math.min(.85, .65 - (c.cor >= .5 ? .2 : 0))),
    why: (c) => [c.cor >= .5 ? "the Fund doubts your books" : null].filter(Boolean),
    fx: { app: -5, igr: 6 }, failFx: { app: -1 } },
  { id: "usa", icon: "🇺🇸", nm: "Ask Washington to forgive its loans", who: "the United States", share: .1, cut: 1,
    note: "Better if you went to Washington in person. Success: approval +2 and closer ties.",
    odds: (c) => Math.max(.05, Math.min(.8, .2 + (c.washington === "went" ? .4 : c.washington === "sent" ? .15 : 0) + (c.cor < .4 ? .1 : 0))),
    why: (c) => [c.washington !== "went" ? "you have not met the US President in person" : null, c.cor >= .4 ? "Congress reads the corruption stories" : null].filter(Boolean),
    fx: { app: 2 }, failFx: { app: -1 } },
];

/* Who answers a President's decision in person (Pack 18 portraits): the
   labour leader, an oil-community chief. on: sign (a bill or an order),
   veto, adopt (a revenue measure or relief). */
const LABOUR = "Comrade Musa Adebayo-Okon, President of the National Labour Union", DELTA = "Chief Tamuno Ebiware, for the oil-producing communities";
export const FED_VOICES = {
  f_min_wage: { on: "sign", img: "labour-leader-pleased", name: LABOUR, text: "Your Excellency, the workers of Nigeria thank you. A living wage, in law. We will remember it." },
  f_eo_merge: { on: "sign", img: "labour-leader-angry", name: LABOUR, text: "Thousands of our members lose their jobs with one signature. We will not take this lying down." },
  f_vat: { on: "adopt", img: "labour-leader-angry", name: LABOUR, text: "Every market woman pays this tax, Your Excellency. If prices rise, we will call our members out." },
  imf: { on: "adopt", img: "labour-leader-angry", name: LABOUR, text: "The Fund's conditions fall on the poor: the subsidy gone, the naira floating. The unions will march." },
  f_pib: { on: "sign", img: "oil-community-leader-pleased", name: DELTA, text: "For the first time, our communities have a share of the oil in law. The creeks will be calmer." },
  nb_nddc: { on: "veto", img: "oil-community-leader-angry", name: DELTA, text: "You vetoed the commission our people waited for. The youths in the creeks will hear of it." },
  f_oil_theft: { on: "adopt", img: "oil-community-leader", name: DELTA, text: "We will watch the pipelines with you, if our boys get the surveillance contracts and not outsiders." },
};

/* Where the President builds a national project is a North–South fight
   (a refinery, a railway, a seaport, a pipeline, an airport, a dam or a
   power plant). zone: the state's zone (NW, NE, NC, SW, SE, SS).
   - In the South: northern lawmakers say the North is starved and slow the
     budget (Senate relations fall).
   - In the North: the Niger Delta says the South makes the money and the
     North spends it; pipelines are cut and oil revenue falls for a year
     (less if there is a Ministry of Niger Delta Development to talk to them).
   - In the Middle Belt: a compromise. Nobody cheers, nobody marches. */
export const SITED = ["rail", "refinery", "seaport", "pipeline", "airport", "dam", "power"];
export const siteReaction = (type, zone, { delta = false } = {}) => {
  if (!SITED.includes(type) || !zone) return null;
  const south = ["SW", "SE", "SS"].includes(zone), north = ["NW", "NE"].includes(zone);
  const z = (n, s) => ({ NW: n, NE: n, NC: 0, SW: s, SE: s, SS: s });
  if (south) return { region: "South", zones: z(-3, 3), nass: -6, faacPct: 0, head: "The North cries foul",
    text: "Northern senators say the North is being starved of national projects. They will slow the budget, and the northern zones cool on you." };
  if (north) return { region: "North", zones: z(3, -3), nass: 0, faacPct: delta ? -.04 : -.1, head: "The creeks answer",
    text: "Niger Delta militants say the South makes the money and the North spends it. Pipelines are cut: oil revenue falls " + (delta ? "4% this year (the Niger Delta ministry calmed some of it)." : "10% this year.") };
  return { region: "the Middle Belt", zones: { NC: 2 }, nass: 2, faacPct: 0, head: "A compromise site",
    text: "Building in the Middle Belt is a compromise: nobody cheers, nobody marches." };
};

/* ── Security fronts: one Commander-in-Chief, four different wars ──
   Each front has a severity (0–100). Every year the National Security
   Council puts the two worst on the President's desk: a military crackdown
   or talks and development. Each choice cools that front, and each angers
   someone. Fronts left alone grow; above 70 they cost the country. */
export const FRONTS = {
  ne: { nm: "North-East: the insurgency", short: "the insurgency in the North-East", zones: ["NE"], start: 55,
    military: { l: "Air strikes and a ground offensive on the insurgents' camps", cost: 45, sev: -18, zones: { NE: 1 }, npc: { army: 4 }, img: "scenes/air-strike", note: "The camps burn; some villages are caught in the fire." },
    talks: { l: "Deradicalise defectors and rebuild the towns", cost: 30, sev: -10, zones: { NE: 3 }, npc: { army: -3 }, img: "scenes/idp-return", note: "Families go home; critics say you are rewarding terrorists." },
    toll: { app: -2, sec: -.02, why: "Insurgents overran another town." } },
  nw: { nm: "North-West & North-Central: bandits and farmer–herder clashes", short: "banditry and the farmer–herder clashes", zones: ["NW", "NC"], start: 60,
    military: { l: "Crack down on the bandits and armed herders", cost: 40, sev: -16, zones: { NW: -2, NC: 2 }, npc: { army: 3 }, img: "decisions/f_eo_curfew", note: "Northern groups accuse you of targeting herders." },
    talks: { l: "Ranches, grazing reserves and peace committees", cost: 35, sev: -10, zones: { NW: 2, NC: -2 }, img: "decisions/herder", note: "Middle Belt groups accuse you of complicity with the killers." },
    toll: { app: -2, agr: -.02, why: "Kidnappers emptied another village, and farmers left the fields." } },
  se: { nm: "South-East: separatist sit-at-home orders", short: "the separatist sit-at-homes in the South-East", zones: ["SE"], start: 45,
    military: { l: "Deploy troops to break the sit-at-home", cost: 30, sev: -14, zones: { SE: -4 }, fx: { app: -1 }, img: "scenes/army-convoy", note: "Markets reopen under guard; human-rights groups protest the arrests." },
    talks: { l: "Dialogue with community leaders, and projects for the South-East", cost: 25, sev: -9, zones: { SE: 4 }, npc: { army: -2 }, note: "Elders welcome it; the hard core keep calling the sit-at-homes." },
    toll: { app: -1, igr: -6, why: "Monday sit-at-homes shut the markets of the South-East: trade and taxes are lost." } },
  ss: { nm: "South-South: oil theft and pipeline vandalism", short: "oil theft in the Niger Delta", zones: ["SS"], start: 50,
    military: { l: "Send the Navy and the army into the creeks", cost: 35, sev: -15, zones: { SS: -3 }, npc: { army: 2 }, img: "scenes/navy-patrol", note: "Illegal refineries burn; the communities say they are treated as criminals." },
    talks: { l: "An amnesty, and surveillance contracts for the communities", cost: 30, sev: -11, zones: { SS: 3 }, fx: { cor: .01 }, img: "characters/oil-community-leader-pleased", note: "The pipelines are quiet, and some of the money goes to the wrong pockets." },
    toll: { faacPct: -.06, why: "Thieves tapped the pipelines: oil output and the Federation Account fell." } },
};
export const frontsInit = () => Object.fromEntries(Object.entries(FRONTS).map(([k, f]) => [k, f.start]));
// The year's council: the two worst fronts, each with its two approaches.
export const frontsCard = (S) => {
  const worst = Object.entries(S || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  return { id: "nsc", t: "The National Security Council: two fronts need you", worst,
    d: worst.map(k => FRONTS[k].nm + " (" + Math.round(S[k]) + "/100)").join("; ") + ". The army cannot be everywhere. Choose where, and how.",
    opts: worst.flatMap(k => ["military", "talks"].map(a => ({ id: k + ":" + a, front: k, how: a, ...FRONTS[k][a], l: FRONTS[k].short.replace(/^./, c => c.toUpperCase()) + ": " + FRONTS[k][a].l.replace(/^./, c => c.toLowerCase()) }))) };
};
// After the year: the front you worked on cools; the others grow; above 70 they bite.
export const frontsYear = (S, chosen) => {
  const next = { ...S }, tolls = [];
  Object.keys(FRONTS).forEach(k => {
    if (chosen && chosen.front === k) next[k] = Math.max(0, next[k] + chosen.sev);
    else next[k] = Math.min(100, next[k] + 6);
    if (next[k] >= 70) tolls.push({ front: k, ...FRONTS[k].toll });
  });
  return { S: next, tolls };
};

/* ── The national cake ──
   Before the National Assembly passes the President's budget, members want
   constituency projects inserted: contracts in their constituencies, often
   through their own companies. revB: the year's federal revenue (₦B). */
export const nassCake = (revB) => {
  const ask = Math.max(10, Math.round((revB || 600) * .05));
  return { ask, opts: [
    { id: "insert", l: "Insert the constituency projects", cost: ask, fx: { cor: .02 }, nass: 6, pStab: 3, note: "The budget sails through. Many of the projects will never be finished." },
    { id: "half", l: "Insert half, and publish every project online", cost: Math.round(ask / 2), fx: { cor: .01 }, nass: -2, pStab: 0, note: "A compromise: members grumble, and the press can check the projects." },
    { id: "refuse", l: "Refuse: no padding in this budget", cost: 0, fx: { app: -2 }, nass: -10, pStab: -4, note: "Members open probes into federal agencies, and scandals leak to the press. The vote gets harder." },
  ] };
};

/* Military procurement: the army's jets and drones, once approved, are
   bought by the Ministry of Defence. Without the ministry the order waits.
   The minister's honesty (0–100) and the route (open tender or direct
   award) decide what arrives. sec is the gain in security (0–1 scale). */
export const defenceDelivery = (proc, hon = 50, r = Math.random) => {
  const x = r();
  if (proc.mode === "buy") return x < hon / 200
    ? { ok: true, sec: .025, cor: 0, app: 1, army: 4, title: "The jets and drones are here", line: "The direct award delivered: the aircraft arrived, a little dear, but they fly." }
    : { ok: false, sec: .015, cor: .02, app: -2, army: 2, title: "Refurbished jets, new prices", line: "The supplier sent refurbished jets at new prices. The ministry signed for them anyway." };
  return x < .55 + hon / 250
    ? { ok: true, sec: .03, cor: -.005, app: 2, army: 5, title: "Delivered on time and on budget", line: "Open tender worked: every jet and drone arrived on time, on budget, with spares and training." }
    : { ok: false, sec: .02, cor: .01, app: -1, army: 2, title: "Late, and lighter than promised", line: "Six months late, with fewer drones than ordered. Money went to 'logistics' the ministry cannot explain." };
};
