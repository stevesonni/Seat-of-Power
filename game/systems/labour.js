/* Labour (rules only, no React). A strike is not a card: it is a state of
   emergency that costs you every year until you sit down at the roundtable
   and give something up.

   The NLC: a tax rise (VAT for the President; a levy or property charge for a
   governor) brings a 14-day ultimatum. Ignore it to the end of the year and
   the strike starts. Each year it runs without talks, another union joins:
   for the President the airports (NUATE), then the grid (NUEE), then fuel
   (NUPENG); for a governor the secretariat, then the schools (NUT), then the
   hospitals (JOHESU).

   ASUU: the universities shut, and the demands are built to be impossible:
   the whole bank for revitalisation, their own payroll (UTAS) instead of
   IPPIS, and allowances owed for years. They reject every offer in the first
   year as an insult, sign an MoU only in the second, and walk out again if an
   instalment is missed.

   At the roundtable they ask for everything in the bank, or what they are
   owed if the bank is emptier than that: "We know what is in the account."
   Union and institution names are real; every person is fictional. */

export const ROUNDS_A_YEAR = 2;

// The ladder: who joins the strike, year by year. fx are yearly; igrPct and jobsPct cut revenue and jobs.
const NAT_STAGES = [
  { id: "nuate", who: "NUATE", t: "NUATE has grounded every flight", d: "Air transport workers have shut the airports. No flights in or out; foreign investors cancel their visits.", bg: "scenes/airport-grounded", obj: "red-union-cap",
    fx: { app: -2 }, igrPct: -.05, jobsPct: 0, grounded: true, paper: ["AIRPORTS SHUT AS NUATE JOINS NLC STRIKE", "Flights grounded nationwide; investors cancel visits"] },
  { id: "nuee", who: "NUEE", t: "NUEE has pulled down the national grid", d: "Electricity workers have switched off the grid. Factories run on diesel or shut; the cities are dark and the streets are not safe.", bg: "scenes/grid-control-room-dark", obj: "diesel-jerrycan", paperImg: "scenes/national-grid-dark",
    fx: { app: -3, sec: -.02 }, igrPct: -.15, jobsPct: -.08, grounded: true, letter: ["The Manufacturers' Association of Nigeria", "We are spending 200% more on diesel. Our members are laying off workers by the thousand. End this strike.", "manufacturers-rep-angry"], paper: ["NATIONAL BLACKOUT: NUEE SHUTS THE GRID", "Factories fall silent; diesel prices soar"] },
  { id: "nupeng", who: "NUPENG", t: "NUPENG has stopped the fuel tankers", d: "Oil workers have parked the tankers. Queues stretch for miles in Lagos and Abuja; a food warehouse was looted overnight.", bg: "scenes/fuel-queue", obj: "diesel-jerrycan",
    fx: { app: -5, sec: -.02 }, igrPct: -.05, jobsPct: -.03, grounded: true, letter: ["The Manufacturers' Association of Nigeria", "Diesel is now rationed by the jerrycan. Factories that survived the blackout are closing because there is no fuel to run the generators.", "manufacturers-rep"], paper: ["FUEL QUEUES, LOOTING AS NUPENG JOINS STRIKE", "Filling stations dry in Lagos and Abuja"] },
];
const GOV_STAGES = [
  { id: "secretariat", who: "the civil service", t: "The state secretariat is shut", d: "Civil servants have locked the ministries. No revenue is collected, no files move, no contractor is paid.", bg: "scenes/nlc-march", obj: "red-union-cap",
    fx: { app: -2 }, igrPct: -.1, jobsPct: 0, paper: ["NLC SHUTS STATE SECRETARIAT", "Ministries locked; government grinds to a halt"] },
  { id: "nut", who: "NUT", t: "NUT has shut the public schools", d: "The teachers have joined. Every public school in the state is closed; parents are furious.", bg: "backgrounds/classroom", obj: "red-union-cap",
    fx: { app: -2, lit: -.02 }, igrPct: -.03, jobsPct: 0, paper: ["TEACHERS JOIN STRIKE: SCHOOLS SHUT", "NUT backs the NLC; pupils sent home"] },
  { id: "johesu", who: "JOHESU and the doctors", t: "The hospitals are shut", d: "Health workers and doctors have walked out. Only emergencies are seen, and not all of those.", bg: "scenes/labour-strike", obj: "red-union-cap",
    fx: { app: -3, hp: -.03 }, igrPct: -.02, jobsPct: 0, paper: ["HOSPITALS SHUT AS HEALTH WORKERS JOIN STRIKE", "Patients turned away across the state"] },
];
export const stagesFor = (nat) => nat ? NAT_STAGES : GOV_STAGES;

export const UNIONS = {
  nlc: { short: "NLC", nm: (nat) => nat ? "the Nigeria Labour Congress" : "the NLC State Council",
    leader: (nat) => nat ? "Comrade Musa Adebayo-Okon, President of the Nigeria Labour Congress" : "Comrade Bassey Etim-Ogar, NLC State Chairman",
    img: (nat) => nat ? "nlc-president" : "labour-leader", bg: "scenes/nlc-march", table: "scenes/labour-roundtable" },
  asuu: { short: "ASUU", nm: (nat) => nat ? "the Academic Staff Union of Universities" : "ASUU at the state university",
    leader: (nat) => nat ? "Prof. Femi Adeyanju-Bello, President of ASUU" : "Dr. Ngozi Okafor-Ude, ASUU branch chairperson",
    img: () => "asuu-president", bg: "scenes/empty-lecture-hall", table: "scenes/labour-roundtable",
    demands: ["A revitalisation fund for the universities: everything in the bank", "UTAS, the union's own payroll, instead of IPPIS", "Earned allowances owed for years, paid in full"] },
};

// Why the NLC is angry, in their words.
export const CAUSES = {
  vat: "the VAT rise from 7.5% to 10%", imf: "the IMF's conditions: the fuel subsidy gone and the naira floating",
  levy: "the new market levy", property: "the Land Use Charge", wage: "the minimum wage", fuel: "the new petrol price",
  arrears: "the salaries the state owes its workers",
};

/* The 14-day ultimatum: the letter that comes with a tax rise. */
export const ultimatum = (cause, nat, turn) => ({ id: "nlc", cause, turn,
  title: "14-day ultimatum from " + UNIONS.nlc.nm(nat),
  line: "Reverse " + (CAUSES[cause] || "the new tax") + " within 14 days, or treble the minimum wage. If not, every worker in " + (nat ? "Nigeria" : "the state") + " stays at home from the 15th day, indefinitely.",
  paper: ["NLC ISSUES 14-DAY ULTIMATUM OVER " + String(cause === "vat" ? "VAT" : cause === "imf" ? "SUBSIDY REMOVAL" : cause === "fuel" ? "PETROL PRICES" : "NEW TAXES").toUpperCase(), "Reverse it or face an indefinite strike"] });

export const startStrike = (id, cause, turn) => ({ id, cause: cause || null, start: turn, stage: 1, trust: id === "asuu" ? 20 : 35, sessions: 0, rounds: { t: turn, n: 0 }, lastSession: -9, mou: null, on: true, history: [] });
export const yearsOn = (st, turn) => Math.max(0, turn - st.start);

/* What a year of the strike costs, charged when it starts and every year after
   while it is on. The NLC climbs a rung each year you do not talk to them. */
export const yearlyToll = (st, { nat = false, turn }) => {
  if (st.id === "asuu") {
    const y = yearsOn(st, turn);
    return { fx: { app: -(2 + y), lit: -.015, sec: -.01 }, igrPct: 0, jobsPct: 0, t: "The universities are shut" + (y ? ": year " + (y + 1) : ""),
      d: "Students are at home. Idle young people drift into online fraud and the streets; parents blame you, louder each month.",
      protest: y >= 1, obj: "red-union-cap", paperImg: y >= 1 ? "scenes/endasuu-protest" : "scenes/campus-shut", paper: y >= 1 ? ["#ENDASUUSTRIKE: STUDENTS BLOCK THE " + (nat ? "AIRPORT ROAD IN ABUJA" : "ROAD TO GOVERNMENT HOUSE"), "A year at home, and no end in sight"] : ["ASUU DECLARES INDEFINITE STRIKE", "Universities shut; students sent home"], bg: y >= 1 ? "scenes/endasuu-protest" : "scenes/empty-lecture-hall" };
  }
  const S = stagesFor(nat), upTo = S.slice(0, st.stage);
  const fx = {}; upTo.forEach(x => Object.entries(x.fx).forEach(([k, v]) => { fx[k] = (fx[k] || 0) + v; }));
  const top = upTo[upTo.length - 1];
  return { fx, igrPct: upTo.reduce((a, x) => a + x.igrPct, 0), jobsPct: upTo.reduce((a, x) => a + x.jobsPct, 0), grounded: upTo.some(x => x.grounded), t: top.t, d: top.d, letter: top.letter, paper: top.paper, bg: top.bg, obj: top.obj, paperImg: top.paperImg || top.bg, who: top.who };
};
// A year with no talks: the next union joins (the NLC only; ASUU just digs in).
export const escalate = (st, turn) => st.id === "nlc" && st.lastSession < turn - 1 ? { ...st, stage: Math.min(3, st.stage + 1) } : st;

/* The demand: everything in the bank, or what is owed if that is more. rev is
   a year's revenue (₦B). */
export const demandOf = (st, { cash = 0, rev = 20 } = {}) => Math.round(Math.max(cash || 0, rev * (st.id === "asuu" ? .15 : .12)) * (1 - Math.min(.5, st.cut || 0)) * 10) / 10;

/* The chance they take an offer that is not everything. ctx: { cor (0–1),
   minister: the Labour minister's performance (0–100) or null, turn }. */
export const offerOdds = (st, ctx = {}) => {
  const y = yearsOn(st, ctx.turn || st.start);
  if (st.id === "asuu" && st.sessions === 0) return 0; // the first offer is always "an insult"
  let p = (st.id === "asuu" ? .12 : .35) + (st.trust - 30) / 150 + (ctx.minister == null ? -.1 : (ctx.minister - 50) / 200) - Math.max(0, (ctx.cor || 0) - .5) * 1.2 + y * .12;
  if (st.id === "asuu" && y < 1) p *= .3;
  return Math.max(0, Math.min(.85, p));
};
// ASUU signs an MoU only in the strike's second year; the NLC will take one any time.
export const mouOk = (st, turn) => st.id !== "asuu" || yearsOn(st, turn) >= 1;

/* The options at the table. ctx: { nat, cash, rev, cor, minister, turn,
   divert: [{ id, nm, kind }] (running work that could be cancelled) }. */
export const roundtable = (st, ctx) => {
  const D = demandOf(st, ctx), A = st.id === "asuu", nat = !!ctx.nat, odds = offerOdds(st, ctx);
  const o = [
    { id: "pay", l: A ? "Pay the whole revitalisation fund: " + "₦" + D + "B" : "Give them everything: ₦" + D + "B", note: "The strike ends today. The bank is empty tomorrow: salaries, police and hospitals next year are your problem.", cost: D, sure: true },
    { id: "mou", l: "Sign an MoU: 30% now (₦" + Math.round(D * 3) / 10 + "B), the rest next year", note: mouOk(st, ctx.turn) ? "They suspend the strike. Miss next year's instalment and they are back out without warning." : "ASUU will not sign anything in the first year.", cost: Math.round(D * 3) / 10, disabled: !mouOk(st, ctx.turn) },
    A ? { id: "offer", l: "Concede UTAS and offer a 10% raise (₦" + Math.round(D * 1.5) / 10 + "B)", note: "UTAS takes lecturers off IPPIS: your payroll checks stop working for them. Chance they take it: " + Math.round(odds * 100) + "%.", cost: Math.round(D * 1.5) / 10, odds }
      : { id: "offer", l: (st.cause && CAUSES[st.cause] ? "Reverse " + CAUSES[st.cause] + " and pay half" : "Pay half") + " (₦" + Math.round(D * 5) / 10 + "B)", note: "Chance they take it: " + Math.round(odds * 100) + "%.", cost: Math.round(D * 5) / 10, odds, reverse: !!st.cause },
    { id: "refuse", l: "Tell them the money is not there", note: "They walk out. The strike hardens.", cost: 0 },
    A ? { id: "force", l: "No work, no pay: stop the lecturers' salaries", note: "Saves money; the strike goes on, and the best lecturers leave the country.", cost: 0 }
      : { id: "force", l: nat ? "Send soldiers into the control rooms; arrest the leaders" : "Send the police in; arrest the leaders", note: "A huge escalation: every union may walk out in solidarity, a court may free them, and the world will condemn you.", cost: 0 },
  ];
  (ctx.divert || []).slice(0, 2).forEach(w => o.push({ id: "divert", w, l: "Cancel " + w.nm + " to pay them", note: "The strike ends. The contractor sues, investors there leave, and " + (w.place || "that region") + " turns against you.", cost: 0 }));
  if (nat) o.push({ id: "print", l: "Order the Central Bank to print it (Ways and Means)", note: "The strike ends and the bank is untouched. Inflation follows in two years.", cost: 0 });
  return { demand: D, options: o };
};

/* The answer at the table. Returns the strike's new state and what happens.
   end: the strike is over; suspend: an MoU; later: beats for SYS chains. */
export const resolve = (st, opt, ctx, r = Math.random) => {
  const nat = !!ctx.nat, turn = ctx.turn, U = UNIONS[st.id], A = st.id === "asuu";
  const base = { ...st, sessions: st.sessions + 1, lastSession: turn, rounds: { t: turn, n: (st.rounds && st.rounds.t === turn ? st.rounds.n : 0) + 1 } };
  const D = demandOf(st, ctx);
  if (opt.id === "pay") return { st: { ...base, on: false, over: "paid" }, end: true, spend: D, fx: { app: 3 }, say: "Comrades, the government has paid. The strike is called off.", tone: "good",
    later: [{ id: "broke_" + st.id + "_" + turn, kind: "labour_broke", due: turn + 1, paid: D }],
    paper: [U.short + " CALLS OFF STRIKE AFTER FULL PAYMENT", "The treasury is empty", true] };
  if (opt.id === "mou") {
    if (!mouOk(st, turn)) return { st: { ...base, trust: base.trust - 5 }, say: "We will not sign another piece of paper. Bring the money.", tone: "bad", paper: [U.short + " REJECTS MOU", "“We have signed MoUs before”", false] };
    const now = Math.round(D * 3) / 10, owed = Math.round((D - now) * 10) / 10;
    return { st: { ...base, on: false, mou: { due: turn + 1, owed }, trust: base.trust + 10 }, suspend: true, spend: now, fx: { app: 2 }, say: "We have signed. The strike is suspended, not called off. Pay the rest by next year, or we are back.", tone: "neutral",
      paper: [U.short + " SUSPENDS STRIKE AFTER MOU", "Government pays 30%; the rest due next year", true] };
  }
  if (opt.id === "offer") {
    const ok = r() < offerOdds(st, ctx), cost = A ? Math.round(D * 1.5) / 10 : Math.round(D * 5) / 10;
    if (!ok) return { st: { ...base, trust: base.trust - (A && st.sessions === 0 ? 10 : 4) }, say: A && st.sessions === 0 ? "This is an insult to the intellectual community of Nigeria. We are going back to our members." : "No. Our members will not accept that.", tone: "bad",
      paper: [U.short + " REJECTS GOVERNMENT OFFER", A && st.sessions === 0 ? "Union calls it “an insult”" : "The strike goes on", false] };
    return { st: { ...base, on: false, over: "deal" }, end: true, spend: cost, fx: { app: 3, cor: A ? .03 : 0 }, utas: A, reverse: !A && !!st.cause, say: A ? "The union accepts. Lecturers go back to work, on UTAS." : "We accept. Our members go back to work tomorrow.", tone: "good",
      paper: [U.short + " ACCEPTS DEAL, ENDS STRIKE", A ? "Universities reopen; lecturers move to UTAS" : "Workers return after the government concedes", true] };
  }
  if (opt.id === "refuse") return { st: { ...base, trust: base.trust - 10 }, fx: { app: -1 }, say: "Then there is nothing to discuss. The strike continues until the government finds its conscience.", tone: "bad",
    paper: [U.short + " STORMS OUT OF TALKS", "“The government says there is no money. We know there is”", false] };
  if (opt.id === "force") {
    if (A) return { st: { ...base, trust: base.trust - 25, nowork: true }, fx: { app: -3, lit: -.01 }, save: Math.round(D * 1) / 10, say: "No work, no pay? Then no work. And our best people will be in Canada by Christmas.", tone: "bad",
      paper: ["GOVERNMENT STOPS LECTURERS' SALARIES", "ASUU digs in; academics queue for visas", false] };
    /* Arresting the leaders is an escalation, never a win. Usually every
       union comes out in solidarity; sometimes a court frees them within the
       week; only rarely does the strike break, and then it goes underground. */
    const roll = r(), arrested = { ...base, arrested: turn, trust: base.trust - 30 };
    if (roll < .55) return { st: { ...arrested, on: true, stage: 3 }, escalated: true, fx: { app: -7, sec: -.02 }, say: "Arrest me and ten more take my place. From midnight every union in " + (nat ? "Nigeria" : "this state") + " is out. Everything stops.", tone: "bad",
      paper: [nat ? "NLC LEADERS ARRESTED; UNIONS SHUT DOWN THE COUNTRY" : "NLC LEADERS ARRESTED; THE WHOLE STATE STOPS", nat ? "Aviation, power and oil workers walk out in solidarity; the ILO condemns the arrests" : "Teachers and health workers join in solidarity; rights groups condemn the arrests", false] };
    if (roll < .8) return { st: { ...arrested, on: true, trust: base.trust - 35 }, fx: { app: -5 }, say: "The court has freed us, and the whole country saw you try to jail workers for asking to be paid. The strike goes on.", tone: "bad", freed: true,
      paper: ["COURT ORDERS RELEASE OF NLC LEADERS", "Judge calls the arrests unlawful; the strike goes on, angrier", false] };
    return { st: { ...arrested, on: false, over: "force", underground: 3 }, end: true, fx: { app: -6, infra: -.02 }, say: "You can arrest us. You cannot arrest the workers. They will remember this.", tone: "bad",
      paper: [nat ? "SOLDIERS SEIZE GRID CONTROL ROOMS; NLC LEADERS ARRESTED" : "POLICE ARREST NLC LEADERS; STRIKE DRIVEN UNDERGROUND", "Rights groups and foreign embassies condemn the crackdown; sabotage feared", false] };
  }
  if (opt.id === "divert") return { st: { ...base, on: false, over: "divert" }, end: true, cancel: opt.w, fx: { app: 2 }, say: "The money is found. We are going back to work.", tone: "neutral",
    paper: [String(opt.w && opt.w.nm || "PROJECT").replace(/^⭐\s*/, "").toUpperCase() + " CANCELLED TO END STRIKE", "The contractor heads to court", false] };
  if (opt.id === "print") return { st: { ...base, on: false, over: "print" }, end: true, fx: { app: 3 }, say: "The money has landed. The strike is called off.", tone: "neutral",
    later: [{ id: "print_" + st.id + "_" + turn, kind: "labour_print", due: turn + 2, amt: D }],
    paper: [U.short + " STRIKE ENDS AS CENTRAL BANK FUNDS DEAL", "Economists warn of inflation", true] };
  return { st: base, say: "", tone: "neutral" };
};

// The MoU's due date: pay the rest, or they are back out. Returns { paid, st }.
export const mouDue = (st, { cash = 0 } = {}) => {
  if (!st.mou) return { paid: true, st };
  if (cash >= st.mou.owed) return { paid: true, spend: st.mou.owed, st: { ...st, mou: null, on: false, over: "mou" } };
  return { paid: false, st: { ...st, mou: null, on: true, trust: st.trust - 20, start: st.start } };
};

// Should ASUU strike this year? From the third year, once per game unless an MoU fails; more likely when education is starved.
export const asuuStrikes = ({ turn, edu = 15, had = false }, r = Math.random) => !had && turn >= 3 && r() < (edu < 14 ? .6 : .35);

/* Twists: the same strike never runs the same way twice. Each year a strike
   is on, one development from its pool (seeded, never repeated in a game):
   students in the streets, a breakaway union, a court, an exodus, mediators,
   an audit... Options can roll (a court can order them back, or they can
   defy it). An option: cost (₦B, or costPct of the demand), fx, trust,
   stage (unions joining or leaving), cut (lowers the demand), end, odds with
   win/lose. who: [art, name] of the person who speaks. */
const STU = ["student-leader", "Adaeze Okonkwo-Bala, President of the National Association of Students"];
const LAB_MIN = ["labour-minister", "The Labour " + "Ministry"];
export const TWISTS = {
  asuu: [
    { id: "students", t: "#EndASUUStrike: students block the expressway", d: "Thousands of students have blocked the main expressway with burning tyres. Their placards name you, not the lecturers.", who: STU, bg: "scenes/endasuu-protest",
      opts: [{ id: "meet", l: "Meet the students and promise them a timeline", fx: { app: 1 }, say: "You came out to us. We will hold you to that timeline, Your Excellency.", mood: "pleased", paper: ["PRESIDENT MEETS PROTESTING STUDENTS", "Expressway reopens after a promise of a timeline", true] },
        { id: "police", l: "Send the police to clear the road", odds: .5, win: { fx: { app: -2 }, say: "Tear gas and batons. We will be back, and there will be more of us.", paper: ["POLICE CLEAR #ENDASUUSTRIKE BLOCKADE", "Tear gas on the expressway", false] },
          lose: { fx: { app: -7, sec: -.01 }, trust: -10, say: "A student is dead. Shot on the expressway for asking to go back to class. Nigeria will not forget his name.", paper: ["STUDENT KILLED AS POLICE BREAK UP PROTEST", "Nationwide outrage; ASUU vows never to call off the strike", false] } },
        { id: "bus", l: "Fund buses home and a monthly stipend", costPct: .08, fx: { app: 2 }, say: "The stipend helps. It does not give us our degrees back.", mood: "neutral", paper: ["STRANDED STUDENTS GET STIPEND", "A sweetener while the campuses stay shut", true] }] },
    { id: "conua", t: "A breakaway union offers to go back to work", d: "CONUA, the Congress of University Academics, a smaller union, says its members will return if the government registers it and pays its allowances.", who: ["asuu-president", "The ASUU President"], bg: "scenes/empty-lecture-hall",
      opts: [{ id: "register", l: "Register CONUA and pay its members: some campuses reopen", costPct: .15, fx: { app: 2 }, trust: -15, cut: .1, say: "You have paid strike-breakers. Every lecturer in this union now knows you will never negotiate in good faith.", mood: "angry", paper: ["CONUA LECTURERS RETURN; ASUU CRIES BETRAYAL", "Some lecture halls reopen as the union splits", true] },
        { id: "one", l: "Refuse: one dispute, one table", trust: 5, fx: { app: -1 }, say: "At least you did not try to break us. That is noted.", mood: "neutral", paper: ["GOVERNMENT SNUBS BREAKAWAY UNION", "The campuses stay shut", false] }] },
    { id: "court", t: "Take ASUU to the National Industrial Court?", d: "The Labour Ministry can refer the dispute to the National Industrial Court and ask for an order sending the lecturers back to work.", who: ["judge", "The National Industrial Court"], bg: "scenes/news-court-steps",
      opts: [{ id: "sue", l: "Refer the dispute to the court", odds: .55, win: { end: true, fx: { app: 2 }, trust: -10, say: "The court orders the lecturers back to work. ASUU obeys, under protest, and promises the fight is not over.", paper: ["COURT ORDERS ASUU BACK TO WORK", "Lecturers return under protest; campuses reopen", true] },
          lose: { trust: -12, fx: { app: -1 }, say: "ASUU has appealed, and until the appeal is heard the strike goes on. They are angrier than before.", paper: ["ASUU APPEALS COURT ORDER, STAYS OUT", "The strike survives the courtroom", false] } },
        { id: "talk", l: "Keep it out of court and keep talking", trust: 6, say: "No court. Good. Bring us an offer worth reading.", mood: "neutral", paper: ["NO COURT, MORE TALKS", "Government keeps the ASUU dispute at the table", false] }] },
    { id: "exodus", t: "Three hundred lecturers leave for Britain and Canada", d: "A professor of medicine resigned on live television this morning. Three hundred lecturers have left this year; whole departments are empty.", who: ["asuu-president", "The ASUU President"], bg: "scenes/japa-departure",
      opts: [{ id: "retain", l: "A retention allowance for medicine, science and engineering", costPct: .2, trust: 10, fx: { app: 1, lit: .005 }, say: "That is the first serious thing this government has done for the universities. It is not the end of the strike.", mood: "pleased", paper: ["RETENTION ALLOWANCE FOR SCIENTISTS AND DOCTORS", "A bid to stop the brain drain", true] },
        { id: "go", l: "Let them go: there are other lecturers", fx: { app: -2, lit: -.02 }, trust: -5, say: "Other lecturers? Who will train them? You are emptying the universities for a generation.", mood: "angry", paper: ["“LET THEM GO”: BRAIN DRAIN DEEPENS", "Departments empty as lecturers japa", false] }] },
    { id: "mediators", t: "Religious leaders offer to mediate", d: "The Christian Association of Nigeria and the Supreme Council for Islamic Affairs offer to bring both sides together in private.", who: ["traditional-ruler-emir", "The mediators"], bg: "scenes/labour-roundtable",
      opts: [{ id: "accept", l: "Accept the mediators", trust: 15, odds: .4, win: { end: true, fx: { app: 3 }, say: "Under the clerics' eye both sides gave ground. The lecturers go back next week, on a timetable for the rest.", paper: ["CLERICS BROKER END TO ASUU STRIKE", "Lecturers to return after secret talks", true] },
          lose: { fx: { app: 1 }, say: "The talks did not end it, but the union trusts the table more now. The next offer will land better.", paper: ["MEDIATION FAILS, BUT TALKS WARMER", "Both sides praise the clerics", true] } },
        { id: "decline", l: "Decline: government does its own talking", trust: -5, fx: { app: -1 }, say: "You turned away the clerics. That tells us everything.", mood: "angry", paper: ["GOVERNMENT TURNS DOWN MEDIATORS", "Religious leaders “disappointed”", false] }] },
    { id: "audit", t: "An audit of the last revitalisation money", d: "An audit has found that a third of the last revitalisation fund was spent on vice-chancellors' cars, guest houses and contracts to relatives.", who: ["asuu-president", "The ASUU President"], bg: "scenes/news-court-steps",
      opts: [{ id: "publish", l: "Publish the audit", cut: .25, trust: -10, fx: { app: 2, cor: -.01 }, say: "You are trying to shame us with the vice-chancellors' sins. We did not buy those cars.", mood: "angry", paper: ["AUDIT: UNIVERSITY FUNDS SPENT ON CARS AND GUEST HOUSES", "Public sympathy shifts; ASUU on the defensive", true] },
        { id: "table", l: "Keep it quiet and use it at the table", cut: .15, say: "We have seen the figures. Perhaps the fund can come with an audit clause.", mood: "neutral", paper: ["ASUU TALKS RESUME QUIETLY", "Both sides agree to tighter auditing", true] }] },
    { id: "vcs", t: "Vice-chancellors want to reopen with part-time lecturers", d: "Several vice-chancellors ask permission to reopen with part-time and retired lecturers, so final-year students can graduate.", who: ["asuu-president", "The ASUU President"], bg: "scenes/campus-shut",
      opts: [{ id: "reopen", l: "Reopen with part-time lecturers", costPct: .05, odds: .5, win: { fx: { app: 2 }, trust: -15, say: "Strike-breakers in our lecture halls. You will pay for this at the table.", paper: ["SOME CAMPUSES REOPEN WITH PART-TIME STAFF", "Final-year students sit exams", true] },
          lose: { fx: { app: -3 }, trust: -15, say: "Classes with no lecturers, exams with no marks. Even the students are laughing at you.", paper: ["“GHOST CLASSES”: REOPENING FIASCO", "Part-time lecturers fail to show", false] } },
        { id: "shut", l: "Keep the campuses shut until there is a deal", trust: 4, fx: { app: -1 }, say: "Good. No half-measures.", mood: "neutral", paper: ["CAMPUSES STAY SHUT", "No reopening without a deal", false] }] },
    { id: "jamb", t: "A year of school-leavers with nowhere to go", d: "A million school-leavers passed their entrance exams and have no university to go to. Their parents are furious.", who: STU, bg: "scenes/campus-shut",
      opts: [{ id: "poly", l: "Open more places at polytechnics and colleges", costPct: .1, fx: { app: 2, lit: .005 }, say: "Something at least. Polytechnics will take some of them.", mood: "neutral", paper: ["POLYTECHNICS OPEN EXTRA PLACES", "School-leavers get a lifeline", true] },
        { id: "wait", l: "Let them wait for the universities", fx: { app: -3, sec: -.01 }, say: "A million young people at home doing nothing. Do you know what idle hands do in this country?", mood: "angry", paper: ["A MILLION SCHOOL-LEAVERS STRANDED", "No place, no plan", false] }] },
  ],
  nlc: [
    { id: "tuc", t: "The TUC offers to break ranks", d: "The Trade Union Congress says its members will return to work if their own allowances are paid, leaving the NLC on its own.", who: ["labour-leader", "The NLC leader"], bg: "scenes/nlc-march",
      opts: [{ id: "pay", l: "Pay the TUC's members: they go back", costPct: .15, stage: -1, trust: -10, fx: { app: 1 }, say: "You bought the TUC. Fine. We are still out, and we remember who divides workers.", mood: "angry", paper: ["TUC SUSPENDS STRIKE; NLC FIGHTS ON", "One union down as the government pays", true] },
        { id: "no", l: "Refuse: one deal for all the workers", trust: 6, say: "One deal for all. That is how it should be. Come back with it.", mood: "neutral", paper: ["GOVERNMENT REJECTS SEPARATE TUC DEAL", "Unions stay united", false] }] },
    { id: "court", t: "Ask the National Industrial Court to stop the strike?", d: "Your lawyers say the National Industrial Court could order the strike suspended while the dispute is heard.", who: ["judge", "The National Industrial Court"], bg: "scenes/news-court-steps",
      opts: [{ id: "sue", l: "Go to court", odds: .55, win: { end: true, fx: { app: 1 }, trust: -8, say: "The court has ordered the strike suspended. The NLC complies, under protest.", paper: ["COURT SUSPENDS NLC STRIKE", "Workers return pending the case", true] },
          lose: { trust: -12, fx: { app: -2 }, say: "The NLC defied the order and the judge has gone quiet. The strike goes on, and now it is about pride.", paper: ["NLC DEFIES COURT ORDER", "“No court can force a worker to work hungry”", false] } },
        { id: "talk", l: "Keep it at the table", trust: 5, say: "Better. Courts do not feed families.", mood: "neutral", paper: ["NO COURT ACTION AGAINST NLC", "Talks to continue", false] }] },
    { id: "market", t: "Market women turn on the strikers", d: "Market women and transport unions say the strike is starving them. Some want to reopen the markets by force.", who: ["market-women-group-angry", "The market women's leader"], bg: "scenes/market-inflation",
      opts: [{ id: "guard", l: "Reopen the markets under police guard", trust: -10, fx: { app: 2 }, say: "Police guarding scabs. You set worker against worker.", mood: "angry", paper: ["MARKETS REOPEN UNDER GUARD", "Traders defy the strike", true] },
        { id: "neutral", l: "Stay out of it", fx: { app: -1 }, say: "You leave the market women to suffer. They will say so at the polls.", mood: "neutral", paper: ["MARKETS STAY SHUT", "Traders count their losses", false] }] },
    { id: "share", t: "A share of the bill is offered", d: "The governors (or, in the state, the local government chairmen) offer to carry part of the workers' demand, for favours later.", who: ["governors-forum-chair", "The Governors' Forum chairman"], bg: "scenes/governors-forum",
      opts: [{ id: "take", l: "Accept: they carry 30% of the demand", cut: .3, fx: { pStab: -3 }, say: "We will carry it. Remember us when the allocations are shared.", mood: "pleased", paper: ["GOVERNORS OFFER TO SHARE STRIKE BILL", "A deal for favours later", true] },
        { id: "decline", l: "Decline: no favours owed", say: "Suit yourself.", mood: "neutral", paper: ["PRESIDENCY DECLINES GOVERNORS' OFFER", "Abuja will carry the bill alone", false] }] },
    { id: "palliative", t: "Offer palliatives instead of the demand?", d: "Your economic team proposes buses, food and a temporary wage award: cheaper than the demand, and visible.", who: LAB_MIN, bg: "scenes/labour-roundtable",
      opts: [{ id: "offer", l: "Announce palliatives", costPct: .2, odds: .45, win: { end: true, fx: { app: 3 }, say: "The palliatives are real and the workers can see them. The NLC suspends the strike.", paper: ["NLC SUSPENDS STRIKE OVER PALLIATIVES", "Buses, food and a wage award", true] },
          lose: { trust: 5, fx: { app: 1 }, say: "The workers took the buses and the food, and stayed out. The NLC calls it a down payment.", paper: ["NLC: “PALLIATIVES ARE NOT A WAGE”", "The strike goes on", false] } },
        { id: "no", l: "Hold the line", trust: -4, say: "Then nothing changes.", mood: "angry", paper: ["NO PALLIATIVES AS STRIKE DRAGS ON", "Government holds firm", false] }] },
    { id: "jailed", only: "arrested", t: "The world condemns the arrests", d: "The ILO, foreign embassies and the bar association condemn the arrest of the NLC's leaders. The unions will not talk while their leaders are in court.", who: ["labour-leader", "The NLC leader"], bg: "scenes/news-court-steps",
      opts: [{ id: "release", l: "Drop the charges and invite them back to the table", trust: 15, fx: { app: 1 }, say: "You have dropped the charges. We will come to the table, but we have not forgotten.", mood: "neutral", paper: ["CHARGES AGAINST NLC LEADERS DROPPED", "Talks to resume", true] },
        { id: "treason", l: "Charge them with treasonable felony", stage: 1, trust: -20, fx: { app: -4 }, say: "Treason? For a strike? You have made us martyrs.", mood: "angry", paper: ["NLC LEADERS CHARGED WITH TREASON", "The ILO threatens to blacklist Nigeria", false] }] },
  ],
};
// This year's twist for a running strike, or null. Seeded; one per strike a year; never repeated.
export const strikeTwist = (st, { turn, seed = "" } = {}, r) => {
  if (!st || !st.on || (st.twistT || 0) >= turn) return null;
  const used = st.twists || [], pool = (TWISTS[st.id] || []).filter(x => !used.includes(x.id) && (!x.only || st[x.only]));
  if (!pool.length) return null;
  const rr = r || seededTwist(seed + "|" + st.id + "|" + turn);
  const jailed = pool.find(x => x.only === "arrested");
  if (!jailed && rr() > .8) return null; // most years
  return jailed || pool[Math.floor(rr() * pool.length)];
};
const seededTwist = (k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } let x = h >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
// The answer to a twist: the strike's new state and what happens. r rolls the odds.
export const twistAfter = (st, tw, opt, ctx = {}, r = Math.random) => {
  const won = opt.odds == null ? null : r() < opt.odds, R = won == null ? opt : { ...opt, ...(won ? opt.win : opt.lose) };
  const D = demandOf(st, ctx), cost = R.cost != null ? R.cost : R.costPct ? Math.round(D * R.costPct * 10) / 10 : 0;
  let n = { ...st, twists: [...(st.twists || []), tw.id], twistT: ctx.turn, trust: (st.trust || 0) + (R.trust || 0) };
  if (R.cut) n.cut = Math.min(.5, (n.cut || 0) + R.cut);
  if (R.stage) n.stage = Math.max(1, Math.min(3, (n.stage || 1) + R.stage));
  if (tw.id === "jailed" && opt.id === "release") n.arrested = null;
  if (R.end) n = { ...n, on: false, over: "twist_" + tw.id };
  return { st: n, won, end: !!R.end, spend: cost, fx: R.fx || {}, say: R.say, mood: R.mood || (won === false ? "angry" : won ? "pleased" : null), paper: R.paper };
};

/* What a strike stops (the owner: "when the unions down tools almost nothing
   works as planned"). For each sector: "stop" (nothing moves) or "slow" (half
   pace), and who walked out. A sector the strike touches at all cannot start a
   new programme or project; work already under way stops or slows. The
   police and the armed forces cannot strike, so security never stops. While
   the NLC is out, the airports are shut too (for a governor: the aviation
   unions join the state council), so every flight needs another way.
   L: stc.labour. */
export const STRIKE_SECTORS = { administration: "the civil service", infrastructure: "building sites", education: "schools", university: "universities", health: "hospitals", agriculture: "farm programmes", energy: "power", commerce: "markets and trade", aviation: "airports" };
export const strikeImpact = (L, nat = false) => {
  const S = (L && L.strikes) || {}, nlc = S.nlc && S.nlc.on ? S.nlc : null, asuu = !!(S.asuu && S.asuu.on);
  const status = {}, who = {};
  const set = (k, v, w) => { if (status[k] === "stop") return; status[k] = v; who[k] = w; };
  if (nlc) {
    const g = nlc.stage || 1;
    set("administration", "stop", nat ? "the federal civil service (NLC)" : "the state civil service (NLC)");
    set("infrastructure", "stop", "the construction workers' union (NUCECFWW)");
    set("aviation", "stop", nat ? "NUATE" : "the aviation unions");
    set("education", g >= 2 ? "stop" : "slow", "the teachers (NUT)");
    set("health", g >= 3 ? "stop" : "slow", "the health workers (JOHESU)");
    set("agriculture", "slow", "the agricultural workers' union");
    set("commerce", "slow", "the market and transport unions");
    set("energy", nat && g >= 2 ? "stop" : "slow", nat && g >= 2 ? "NUEE" : "the electricity workers");
    set("university", "slow", "the universities' non-teaching staff (SSANU)");
  }
  if (asuu) set("university", "stop", "ASUU");
  return { on: !!(nlc || asuu), status, who, grounded: !!nlc, stage: nlc ? nlc.stage || 1 : 0 };
};
// A programme's sector (POL "s") or a project type, as a strike sector.
const UNI = /^(uni|new_uni)$|^(university|polytechnic|coe)$/;
export const strikeSectorOf = ({ s, id, type, sector } = {}) => {
  if (UNI.test(id || "") || UNI.test(type || "")) return "university";
  if (type) { const M = { health: "health", education: "education", energy: "energy", security: null }; return sector in M ? M[sector] : "infrastructure"; }
  return s === "security" ? null : s || null;
};
// Is this blocked by the strike? Returns { status, who, label } or null.
export const strikeBlock = (I, what) => {
  const k = strikeSectorOf(what); if (!k || !I || !I.on) return null;
  const v = I.status[k];
  return v ? { status: v, who: I.who[k], label: STRIKE_SECTORS[k] || k } : null;
};
