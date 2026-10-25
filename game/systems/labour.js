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
  levy: "the new market levy", property: "the Land Use Charge", wage: "the minimum wage",
};

/* The 14-day ultimatum: the letter that comes with a tax rise. */
export const ultimatum = (cause, nat, turn) => ({ id: "nlc", cause, turn,
  title: "14-day ultimatum from " + UNIONS.nlc.nm(nat),
  line: "Reverse " + (CAUSES[cause] || "the new tax") + " within 14 days, or treble the minimum wage. If not, every worker in " + (nat ? "Nigeria" : "the state") + " stays at home from the 15th day, indefinitely.",
  paper: ["NLC ISSUES 14-DAY ULTIMATUM OVER " + String(cause === "vat" ? "VAT" : cause === "imf" ? "SUBSIDY REMOVAL" : "NEW TAXES").toUpperCase(), "Reverse it or face an indefinite strike"] });

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
export const demandOf = (st, { cash = 0, rev = 20 } = {}) => Math.round(Math.max(cash || 0, rev * (st.id === "asuu" ? .15 : .12)) * 10) / 10;

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
      : { id: "force", l: nat ? "Send soldiers into the control rooms; arrest the leaders" : "Send the police in; arrest the leaders", note: "The strike breaks, then goes underground: sabotage for years, and the world condemns you.", cost: 0 },
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
    return { st: { ...base, on: false, over: "force", underground: 2 }, end: true, fx: { app: -5, infra: -.02 }, say: "You can arrest us. You cannot arrest the workers. They will remember this.", tone: "bad",
      paper: [nat ? "SOLDIERS SEIZE GRID CONTROL ROOMS; NLC LEADERS ARRESTED" : "POLICE ARREST NLC LEADERS; STRIKE BROKEN", "Rights groups and foreign embassies condemn the crackdown", false] };
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
