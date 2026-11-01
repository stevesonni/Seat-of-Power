/* The six new pillars (rules only, no React). Each is switched on or off per
   player by the experiment (server/experiment.mjs); the game only calls a
   pillar's rules when it is on.

   front     the front door: a cold open on FAAC day, hints, an easier first year
   wait      never wait: quick wins, staged openings, things that happen on site
   money     money as an enemy: FAAC day leaks, reforms that plug them and decay
   integrity ministries with integrity: who your commissioners really are,
             vetting, whistleblowers
   plan      your own plan: a chairman's ambition and rival, pilot policies, combos
   region    regional influence: a President's trade war with a neighbour, a
             governor's race with the next state

   Every person and country here is fictional. Money is in billions of naira
   (governor, President) or millions (chairman), like the rest of the game. */
import { seeded, hashStr } from "./rng.js";

const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;

/* ── 1. The front door ─────────────────────────────────────────────────────
   A first-time player starts in the middle of the job: the FAAC alert lands,
   three decisions, a ribbon to cut, all inside five minutes. Then the story
   goes back six months, to the campaign. */
export const PROLOGUE_KEY = "sop_prologue";
export const PROLOGUE = [
  { id: "pay", kicker: "Day 1 · 8:02 am", title: "Your phone buzzes",
    alert: "Credit alert: ₦18.4B FAAC allocation received.",
    d: "The state's monthly share of federal money has landed. Teachers are owed two months, a contractor wants paying for the Ward 7 road, and the Commissioner for Finance is at your door.",
    opts: [
      { id: "workers", l: "Pay the teachers first", out: "Teachers are paid by noon. The road contractor slows down until next month.", fx: { app: 4, infra: -1 }, next: "Next: the contractor waits a month. Workers you pay on time do not strike." },
      { id: "road", l: "Pay the road contractor", out: "The bulldozers roll again. Teachers' unions call a press conference.", fx: { app: -3, infra: 3 }, next: "Next: the unions start counting the months. At three months owed, they threaten a strike." },
      { id: "half", l: "Split it: half each", out: "Nobody is happy, and nobody walks out.", fx: { app: 1, infra: 1 }, next: "Next: both sides come back next month for the rest." },
    ] },
  { id: "well", kicker: "Day 1 · 11:40 am", title: "Ward 7 has no water",
    d: "The only borehole in Ward 7 broke down last week. Women walk two hours to the stream. The ward councillor is outside with a delegation.",
    opts: [
      { id: "fix", l: "Repair it this week (₦40M)", out: "The engineers fix the pump in four days. The councillor tells everyone it was his idea.", fx: { app: 3, cash: -.04 }, next: "Next: small, quick jobs like this are how people learn you deliver." },
      { id: "new", l: "Drill two new boreholes (₦150M)", out: "Two rigs arrive next month. Until then, water tankers.", fx: { app: 5, cash: -.15 }, next: "Next: the rigs take a month. Bigger jobs take longer, and people wait." },
      { id: "later", l: "Put it in next year's budget", out: "The delegation leaves angry. A video of the stream goes round WhatsApp.", fx: { app: -4 }, next: "Next: what you put off comes back, usually louder." },
    ] },
  { id: "leak", kicker: "Day 1 · 4:15 pm", title: "Something does not add up",
    d: "An auditor slips you a note: 1,200 names on the state payroll have the same three bank accounts. Ghost workers. Someone in the civil service is collecting their pay.",
    opts: [
      { id: "audit", l: "Order a payroll audit", out: "The ghosts are struck off. ₦600M a year stops leaking.", fx: { cash: .6, cor: -2 }, next: "Next: money that stops leaking is money you can spend. Leaks come back if nobody watches." },
      { id: "quiet", l: "Deal with it quietly", out: "The names go. So do two senior officials, quietly, to other posts.", fx: { cash: .3 }, next: "Next: quiet fixes save face, and the people who did it stay in government." },
      { id: "leave", l: "Leave it: not on day one", out: "The ghosts keep getting paid. The auditor stops sending notes.", fx: { cor: 3 }, next: "Next: leaks you leave alone grow." },
    ] },
];
export const PROLOGUE_RIBBON = { kicker: "Day 1 · 6:00 pm", title: "Cut the ribbon",
  d: "Ward 7's borehole is running again. The crowd is waiting, the cameras are on, and the councillor is standing a little too close.",
  l: "✂️ Cut the ribbon", out: "Water runs. The crowd cheers. A photo of you with a jerrycan is everywhere by evening." };
export const PROLOGUE_FLASH = { title: "Six months earlier…", d: "Before the credit alerts and the ribbons, you had to win. Every governor starts as a candidate with a party, a godfather and a long road to Government House.",
  go: "Begin your campaign", skip: "Skip" };
/* The day's effect on the cold open's little scoreboard (it does not carry into the game). */
export const prologueScore = (picks) => picks.reduce((a, p) => { const st = PROLOGUE.find(x => x.id === p.step), o = st && st.opts.find(x => x.id === p.opt);
  Object.entries((o && o.fx) || {}).forEach(([k, v]) => { a[k] = r2((a[k] || 0) + v); }); return a; }, { app: 0, cash: 0, cor: 0, infra: 0 });

/* What each number on a result card means, the first time a player sees it. */
export const ROW_HELP = [
  [/^approval/i, "Approval: how many people back you. Below 40% you will struggle to win again."],
  [/^(in the )?bank|^cash/i, "Bank: money the state has now. Spend more than this and you borrow."],
  [/^debt/i, "Debt: what the state owes. Lenders stop lending when it gets too big."],
  [/^party/i, "Party: how united your party is. Low, and they may drop you as candidate."],
  [/^corruption/i, "Corruption: how much money goes missing. High corruption brings the EFCC."],
  [/^security/i, "Security: how safe people feel. Low security means kidnappings and clashes."],
  [/^(health|hospitals)/i, "Health: clinics, doctors and medicine. It moves slowly."],
  [/^(education|literacy|schools)/i, "Education: schools and teachers. Results take years to show."],
  [/^(roads|infrastructure|infra)/i, "Infrastructure: roads, power and water. People see it first."],
  [/^(farms|agriculture)/i, "Farms: harvests and food prices."],
  [/^(own revenue|igr|taxes)/i, "Own revenue: taxes and fees the state collects itself."],
];
export const rowHelp = (label, seen = []) => { const h = ROW_HELP.find(([rx]) => rx.test(String(label || "").trim())); if (!h) return null; const k = h[0].source; return seen.includes(k) ? null : { key: k, text: h[1] }; };

/* The adviser's hint: what to do now, in one plain sentence. */
export const HINTS = {
  "Set up your government": "Open the People tab and appoint your commissioners. Ministries do nothing until someone runs them.",
  "Pass this year's budget": "Share the money between ministries on the Desk. Salaries come first, or workers go unpaid.",
  "Take the budget to the House": "Send the budget to the House of Assembly. If members are unhappy, they may ask for something first.",
  "Sign programmes and orders": "Pick one or two programmes you can pay for. Each one says what it does and what it costs a year.",
  "Review the year": "Read what happened, then start the next year. The decisions you made come back.",
  mail: "Open your letters on the Desk. Each one needs a decision, or your staff decide for you.",
};
export const TAB_HINT = { desk: "Letters and decisions", map: "Money and projects", people: "Cabinet and the public" };
/* The first year is for learning: a little money in the bank from the outgoing government. */
export const firstYearCushion = (faacB) => r1(Math.max(1, (faacB || 10) * .15));

/* ── 2. Never wait ─────────────────────────────────────────────────────────
   Quick wins finish inside the year; a big project opens in stages; and
   things happen on site while it is being built. */
export const QUICK_WINS = [
  { id: "lights", l: "Fix the streetlights on the market road", cost: .3, fx: { app: 2, sec: .01 }, out: "The market stays open after dark. Traders say they feel safer.", art: "streetlights" },
  { id: "clinic", l: "Repaint and restock a busy clinic", cost: .4, fx: { app: 2, hp: .01 }, out: "New drugs, clean walls, a working fridge for vaccines. The queue is shorter by Friday.", art: "clinic" },
  { id: "drain", l: "Clear the blocked drains before the rains", cost: .25, fx: { app: 1, infra: .01 }, out: "The first heavy rain runs off instead of flooding the motor park.", art: "drain" },
  { id: "desks", l: "Desks for 50 classrooms", cost: .35, fx: { app: 2, lit: .01 }, out: "Pupils who sat on the floor now sit at desks. Parents notice.", art: "desks" },
  { id: "pump", l: "Repair 20 broken hand pumps", cost: .3, fx: { app: 2, hp: .01 }, out: "Twenty villages get their water back within the month.", art: "pump" },
  { id: "potholes", l: "Patch the potholes on the busiest road", cost: .45, fx: { app: 2, infra: .01 }, out: "Okada riders and bus drivers stop complaining, for now.", art: "potholes" },
];
export const quickWinsFor = (seed, turn, done = []) => { const r = seeded(seed, "qw", turn), pool = QUICK_WINS.filter(q => !done.includes(q.id)); const out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); return out; };
/* A big project opens in stages: the first section at half way. */
export const STAGE_AT = 50;
export const stageOpening = (p, opened = {}) => p && p.status !== "stalled" && (p.progress || 0) >= STAGE_AT && (p.progress || 0) < 100 && !opened[p.id];
export const STAGE_TEXT = { road: "The first section opens to traffic", hospital: "The outpatients' wing opens", water: "The first estates get water", housing: "The first keys are handed over", university: "The first faculty takes students", market: "The first row of stalls opens", power: "The first communities are switched on", dam: "The first fields get water", industrial: "The first factory shed is let" };
export const stageLine = (p) => (STAGE_TEXT[p.type] || "The first part opens") + ": " + (p.title || "the project") + ".";
export const SITE_EVENTS = [
  { id: "youths", t: "Youths block the gate at {site}", d: "Local young men say the contractor brought workers from outside. Nobody gets in until they are hired.",
    opts: [{ id: "hire", l: "Make the contractor hire locals", cost: .1, fx: { app: 2 }, out: "Forty local hires. The gate opens and the work goes on." },
      { id: "police", l: "Send the police to clear the gate", fx: { app: -2, sec: -.01 }, out: "The gate is cleared. A video of the arrests goes round." },
      { id: "pay", l: "Pay the area boys to go away", cost: .05, fx: { cor: .01 }, out: "They go. They will be back next month." }] },
  { id: "rain", t: "The rain washed out the works at {site}", d: "A week of rain filled the foundations with mud. The engineer wants money to pump and redo it.",
    opts: [{ id: "redo", l: "Pay to redo it properly", cost: .2, fx: { infra: .01 }, out: "It is done again, properly, with drains this time." },
      { id: "dry", l: "Wait for it to dry and carry on", fx: { infra: -.01 }, out: "Work goes on. Engineers mutter about cracks later." }] },
  { id: "find", t: "Workers dug up old pots at {site}", d: "The digging found clay pots and beads. The museum wants to look; the contractor wants to keep digging.",
    opts: [{ id: "museum", l: "Stop for a month and call the museum", fx: { app: 1, infra: -.01 }, out: "The finds go to the state museum. Schoolchildren visit." },
      { id: "dig", l: "Keep digging", fx: { app: -1 }, out: "The pots go into a skip. Someone took photos." }] },
  { id: "steal", t: "Cement is going missing at {site}", d: "The site engineer says forty bags a week are walking out at night, in the watchmen's own wheelbarrows.",
    opts: [{ id: "watch", l: "Hire new watchmen and count every bag", cost: .05, fx: { cor: -.01 }, out: "The bags stop walking. The old watchmen go." },
      { id: "ignore", l: "It's the contractor's problem", fx: { cor: .01, infra: -.01 }, out: "The walls go up thinner than they should." }] },
];
export const siteEventFor = (seed, turn, projects = []) => { const live = projects.filter(p => p.status === "in_progress"); if (!live.length) return null;
  const r = seeded(seed, "site", turn); if (r() > .7) return null; const p = live[Math.floor(r() * live.length)], e = SITE_EVENTS[Math.floor(r() * SITE_EVENTS.length)];
  return { ...e, pid: p.id, site: p.title || "the site" }; };

/* ── 3. Money as an enemy ──────────────────────────────────────────────────
   Every FAAC day some of the money leaks before it does any good. Reforms
   plug a leak, and a plug left without upkeep wears out. */
export const LEAKS = {
  payroll: { nm: "Ghost workers on the payroll", share: .035, fix: "Biometric payroll check", cost: .5, upkeep: .1 },
  contracts: { nm: "Padded contracts", share: .03, fix: "Open e-procurement", cost: .6, upkeep: .15 },
  accounts: { nm: "Money parked in private bank accounts", share: .02, fix: "One Treasury Single Account", cost: .4, upkeep: .05 },
  levies: { nm: "Levies collected in cash, never banked", share: .015, fix: "Cashless levy collection", cost: .3, upkeep: .05 },
};
export const LEAK_IDS = Object.keys(LEAKS);
/* A plug's strength: 1 when new or kept up; it loses a third each year without upkeep. */
export const PLUG_DECAY = 1 / 3;
export const plugStrength = (P) => !P ? 0 : Math.max(0, Math.min(1, P.str == null ? 1 : P.str));
export const leakOf = (plugs = {}, faacB = 10) => { const parts = LEAK_IDS.map(id => ({ id, nm: LEAKS[id].nm, b: r2(faacB * LEAKS[id].share * (1 - plugStrength(plugs[id]))) }));
  return { parts, total: r2(parts.reduce((a, x) => a + x.b, 0)), pct: Math.round(parts.reduce((a, x) => a + x.b, 0) / Math.max(.1, faacB) * 100) }; };
/* A year passes: kept-up plugs stay strong, the rest wear out. */
export const plugsAge = (plugs = {}, kept = []) => Object.fromEntries(Object.entries(plugs).map(([id, P]) => [id, { ...P, str: kept.includes(id) ? 1 : (x => x < .05 ? 0 : x)(r2(plugStrength(P) - PLUG_DECAY)) }]));
export const upkeepOf = (plugs = {}) => r2(Object.entries(plugs).filter(([, P]) => plugStrength(P) > 0).reduce((a, [id]) => a + LEAKS[id].upkeep, 0));
export const worstLeak = (plugs = {}, faacB = 10) => leakOf(plugs, faacB).parts.slice().sort((a, b) => b.b - a.b)[0];

/* ── 4. Ministries with integrity ──────────────────────────────────────────
   Every commissioner is one of four kinds. You do not know which until you
   vet them, or until a whistleblower tells you. */
export const ARCHETYPES = {
  tech: { nm: "Technocrat", d: "Knows the work and does it. Not good at politics.", perf: 8, leak: 0 },
  loyal: { nm: "Loyalist", d: "Does what you ask, nothing more. Safe, slow.", perf: 0, leak: 0 },
  hustler: { nm: "Hustler", d: "Gets things moving, and takes a cut of everything.", perf: 4, leak: 1 },
  crusader: { nm: "Crusader", d: "Fights waste in the ministry. Makes enemies.", perf: 3, leak: -1 },
};
export const archetypeOf = (name, seed = "") => { const ks = ["tech", "loyal", "hustler", "crusader", "loyal", "tech", "hustler"]; return ks[hashStr(seed + "|arch|" + name) % ks.length]; };
export const VET_COST = .3;
export const whistleFor = (seed, turn, ministries = [], handled = {}) => {
  const ms = ministries.filter(m => m.minister && !handled[m.id]); if (!ms.length) return null;
  const r = seeded(seed, "whistle", turn); if (turn < 2 || r() > .6) return null;
  const hustlers = ms.filter(m => archetypeOf(m.minister, seed) === "hustler");
  const m = hustlers.length && r() < .75 ? hustlers[Math.floor(r() * hustlers.length)] : ms[Math.floor(r() * ms.length)];
  return { mid: m.id, ministry: m.name, minister: m.minister, truth: archetypeOf(m.minister, seed) === "hustler", amt: r1(.4 + r() * 1.2) };
};

/* ── 5. Your own plan ──────────────────────────────────────────────────────
   A chairman picks one ambition for the term and meets a rival who wants the
   seat. A governor can pilot a programme in one place first, and some
   programmes work better together. */
export const AMBITIONS = {
  clean: { l: "The cleanest market town in the state", d: "Markets swept, drains clear, refuse collected every week.", test: (S) => (S.fixed || 0) >= 3 && S.people >= 55 },
  school: { l: "Every child in a classroom", d: "No child of school age hawking in the market.", test: (S) => S.people >= 60 && (S.cor || 0) <= .25 },
  roads: { l: "A road to every ward", d: "No ward cut off when the rains come.", test: (S) => !!(S.road && S.road.held) || (S.fixed || 0) >= 4 },
  honest: { l: "Not one naira missing", d: "Open books, published every quarter.", test: (S) => (S.cor || 0) <= .12 },
};
export const ambitionMet = (S) => { const A = AMBITIONS[S && S.ambition]; return A ? !!A.test(S) : null; };
export const RIVAL_MOVES = [
  { id: "rumour", t: "{rival} says you sold the market stalls", d: "Your rival tells the market women you sold their stalls to a friend. It is not true, but it is everywhere.", bg: "busy-market-street", who: "councillor-male",
    opts: [{ id: "books", l: "Publish the stall allocation list", cost: 5, fx: { people: 4 }, npc: { rival: -10 }, story: "published the market stall list to answer a rumour" },
      { id: "radio", l: "Answer on the radio", fx: { people: 1 }, story: "answered a rival's rumour on the radio" },
      { id: "ignore", l: "Ignore it", fx: { people: -4 }, story: "let a rival's rumour run" }] },
  { id: "walkout", t: "{rival} leads a council walkout", d: "Half the councillors walk out with your rival before the budget vote. Nothing can pass without them.", bg: "council-chamber", who: "councillor-male",
    opts: [{ id: "share", l: "Give their wards a project each", cost: 20, fx: { council: 8 }, npc: { rival: 5 }, story: "bought back the council with ward projects" },
      { id: "wait", l: "Wait them out", fx: { council: -4, people: -1 }, story: "waited out a council walkout" },
      { id: "public", l: "Read the budget out in the market square", fx: { people: 4, council: -3 }, npc: { rival: -5 }, story: "read the budget out in the market square" }] },
  { id: "party", t: "{rival} is courting the party chairman", d: "Your rival was seen at the party chairman's house, twice. People say the ticket is moving.", bg: "party-convention-hall", who: "party-chairman",
    opts: [{ id: "visit", l: "Visit the party chairman yourself", fx: { gov: 2 }, npc: { party: 6 }, story: "visited the party chairman to keep the ticket" },
      { id: "deliver", l: "Deliver, and let the work speak", fx: { people: 2 }, npc: { party: -3 }, story: "let the work speak against a rival" }] },
  { id: "credit", t: "{rival} takes credit for your work", d: "Your rival's posters at the new drainage say 'Delivered by your councillor'. Your name is not on them.", bg: "village-square", who: "councillor-male",
    opts: [{ id: "posters", l: "Put up your own posters", cost: 8, fx: { people: 2 }, story: "matched a rival's posters with their own" },
      { id: "share", l: "Thank the councillor in public", fx: { council: 4 }, npc: { rival: 8 }, story: "shared the credit with a rival in public" }] },
];
export const rivalMoveFor = (seed, n, seen = []) => { if (n % 2) return null; const pool = RIVAL_MOVES.filter(m => !seen.includes("rival_" + m.id)); if (!pool.length) return null; return pool[Math.floor(seeded(seed, "rival", n)() * pool.length)]; };
/* Pilot a programme in one place first: a quarter of a year's cost, and you learn whether it works. */
export const PILOT_SHARE = .25;
export const pilotResult = (seed, id, turn) => seeded(seed, "pilot", id, turn)() < .7 ? "works" : "weak";
export const PILOT_ROLLOUT = { works: { costMul: .85, fxMul: 1.25 }, weak: { costMul: 1, fxMul: .7 } };
export const COMBOS = [
  { a: "school_feed", b: "farm_sub", nm: "Home-grown school feeding", d: "Farmers sell to the school kitchens.", fx: { agr: .02, app: 3 } },
  { a: "comm_pol", b: "sec_outfit", nm: "Eyes and ears", d: "The volunteers tell the security corps where to go.", fx: { sec: .03, app: 2 } },
  { a: "phc", b: "health_ins", nm: "Clinics people can pay for", d: "Insured patients fill the revived clinics.", fx: { hp: .03, app: 2 } },
  { a: "teachers", b: "free_edu", nm: "Full classrooms, with teachers", d: "Free schooling brings the pupils; new teachers teach them.", fx: { lit: .03, app: 2 } },
  { a: "digi_gov", b: "anti_cor", nm: "Nowhere to hide", d: "Every payment is online, and someone is checking.", fx: { corM: -.04, app: 2 } },
  { a: "skills", b: "tech_hub", nm: "Skills for the tech city", d: "Trainees walk into jobs at the hub.", fx: { lit: .02, app: 3 } },
  { a: "irrigation", b: "farm_sub", nm: "Two harvests a year", d: "Seeds and water: farmers plant in the dry season too.", fx: { agr: .03, app: 2 } },
  { a: "water", b: "outreach", nm: "Clean water, fewer patients", d: "Cholera cases fall where the taps run.", fx: { hp: .03, app: 1 } },
];
export const comboFor = (id, activeIds = []) => COMBOS.find(c => (c.a === id && activeIds.includes(c.b)) || (c.b === id && activeIds.includes(c.a))) || null;
export const comboPartner = (id) => COMBOS.filter(c => c.a === id || c.b === id).map(c => ({ nm: c.nm, with: c.a === id ? c.b : c.a }));

/* ── 6. Regional influence ─────────────────────────────────────────────────
   A governor races the governor next door; a President fights a trade war
   with a neighbouring country (fictional: the Republic of Lokassa). */
export const NEIGHBOUR_COUNTRY = { nm: "Lokassa", adj: "Lokassan", cap: "Port Amari", leader: "President Edem Kossou" };
export const TRADE_WAR = {
  open: { t: "Lokassa bans Nigerian cement", d: "{leader} has banned Nigerian cement and doubled the tariff on our rice mills' exports. Lokassan traders say it is about protecting their own factories. Our manufacturers want an answer.",
    opts: [{ id: "hit", l: "Close the border to Lokassan goods", fx: { app: 3, food: -2 }, next: "smuggle", out: "The border shuts. Prices of Lokassan goods in our markets jump." },
      { id: "ecowas", l: "Take it to the ECOWAS court", fx: { app: -1 }, next: "court", out: "Our lawyers file in Abuja. It will take a year." },
      { id: "talk", l: "Send the trade minister to Port Amari", fx: {}, next: "talks", out: "The minister flies out with a list of what we can offer." }] },
  smuggle: { t: "Smugglers are winning the trade war", d: "With the border shut, rice and fuel move by bush paths and canoes. Customs officers are getting rich. Lokassa says it will close its port to our goods.",
    opts: [{ id: "customs", l: "Send soldiers to the border", fx: { app: -2, sec: .02 }, end: "mixed", out: "Smuggling falls. So does trade with every neighbour." },
      { id: "reopen", l: "Reopen, if Lokassa lifts the ban", fx: { app: 1 }, end: "good", out: "Both bans are lifted on the same morning. Traders cheer." },
      { id: "hold", l: "Hold the line", fx: { app: -3 }, end: "bad", out: "Prices keep rising. The ban stays on both sides." }] },
  court: { t: "The ECOWAS court rules", d: "The court rules that Lokassa's cement ban breaks the free trade protocol. Lokassa says it will appeal and leaves the ban in place.",
    opts: [{ id: "press", l: "Ask ECOWAS leaders to enforce it", fx: { app: 2 }, end: "good", out: "Under pressure from the other leaders, Lokassa lifts the ban." },
      { id: "deal", l: "Use the ruling to make a deal", fx: { app: 1 }, end: "good", out: "Lokassa lifts the ban; we cut a tariff on their palm oil." }] },
  talks: { t: "Lokassa names its price", d: "{leader} will lift the ban if Nigeria lets Lokassan trucks use our ports at local rates.",
    opts: [{ id: "yes", l: "Accept the deal", fx: { app: 1 }, end: "good", out: "Trucks roll both ways. Our ports earn less per truck, and more trucks come." },
      { id: "no", l: "Refuse: our ports are not for sale", fx: { app: 2 }, next: "smuggle", out: "Talks end. The border war goes on." }] },
};
export const tradeWarDue = (turn) => turn >= 2;
export const RIVALRY_CONTESTS = [
  { id: "factory", t: "A factory is choosing between you and {nb}", d: "A fruit-juice company will build one factory, here or in {nb}. {rival} has offered them free land.",
    opts: [{ id: "land", l: "Offer land and a tax holiday", cost: .5, win: .7, fx: { app: 2 }, out: "win", note: "Costly, but likely." },
      { id: "road", l: "Offer a good access road", cost: .3, win: .5, fx: {}, out: "win", note: "Half a chance." },
      { id: "pass", l: "Let {nb} have it", win: 0, fx: {}, out: "lose", note: "No cost." }] },
  { id: "levy", t: "{rival} cut the market levy, and our traders are moving", d: "Traders from the border markets are taking their stalls to {nb}, where the levy is half ours.",
    opts: [{ id: "match", l: "Match the cut", cost: .3, win: .8, fx: { app: 2 }, out: "win" },
      { id: "better", l: "Fix our markets instead: roofs and toilets", cost: .4, win: .6, fx: { app: 1, infra: .01 }, out: "win" },
      { id: "let", l: "Let them go", win: 0, fx: { app: -2 }, out: "lose" }] },
  { id: "festival", t: "{nb} is hosting the regional festival", d: "{rival} won the bid for the regional arts festival. Tourists, hotels and cameras, next door.",
    opts: [{ id: "own", l: "Hold our own festival the same week", cost: .4, win: .5, fx: { app: 2 }, out: "win" },
      { id: "join", l: "Co-host: share the stage", cost: .1, win: .6, fx: { app: 1 }, out: "draw", note: "Shared credit." },
      { id: "skip", l: "Stay out of it", win: 0, fx: {}, out: "lose" }] },
  { id: "border", t: "Two villages on the border both claim the same farmland", d: "Farmers from our side and from {nb} fought over the boundary. {rival} says the land is theirs.",
    opts: [{ id: "survey", l: "Ask the boundary commission to survey it", cost: .1, win: .6, fx: { sec: .01 }, out: "win" },
      { id: "meet", l: "Meet {rival} at the border", win: .5, fx: { app: 1 }, out: "draw", note: "Peace, and a shared market." },
      { id: "push", l: "Back our farmers, whatever it takes", win: .5, fx: { sec: -.02, app: 2 }, out: "win" }] },
];
export const rivalryFor = (seed, turn, seen = []) => { if (turn < 2) return null; const pool = RIVALRY_CONTESTS.filter(c => !seen.includes(c.id)); if (!pool.length) return null; return pool[Math.floor(seeded(seed, "rivalry", turn)() * pool.length)]; };
export const rivalryRoll = (seed, turn, opt) => { if (opt.out === "draw") return "draw"; if (opt.out === "lose" || !opt.win) return "lose"; return seeded(seed, "rroll", turn, opt.id)() < opt.win ? "win" : "lose"; };

/* ── The end-of-term cards (always on; not part of the split) ──────────── */
export const WAEC = (v) => v >= .75 ? "A1" : v >= .68 ? "B2" : v >= .62 ? "B3" : v >= .56 ? "C4" : v >= .5 ? "C5" : v >= .45 ? "C6" : v >= .4 ? "D7" : v >= .33 ? "E8" : "F9";
export const reportCard = (s) => [["Education", WAEC(s.lit)], ["Health", WAEC(s.hp)], ["Roads and power", WAEC(s.infra)], ["Security", WAEC(s.sec)], ["Farming", WAEC(s.agr)], ["Honesty", WAEC(1 - (s.cor || 0))], ["Approval", WAEC((s.app || 0) / 100)]];
export const challengeLink = (base, state, seed) => base + "/?ch=" + encodeURIComponent(String(state || "Lagos")) + "-" + (Math.abs(Number(seed) || 1) % 1000000);
export const parseChallenge = (q) => { const m = /^(.+)-(\d{1,7})$/.exec(String(q || "")); return m ? { state: decodeURIComponent(m[1]), seed: +m[2] } : null; };
