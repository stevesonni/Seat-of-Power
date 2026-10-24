/* The Senator career: pure rules (no React). A senator runs nothing and
   spends little; their power is a vote. One term is four years of two
   sessions each. Home support decides the next election; standing in
   Abuja decides what the vote can buy. Every roll is seeded from the run's
   seed and the session, so a reload replays the same Senate. */
import { seeded } from "./rng.js";

const cl = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const cl1 = (v) => Math.max(0, Math.min(1, v));
export const SENATE_SEATS = 109, SESSIONS = 8; // two sessions a year, four years
export const sessionYear = (n) => Math.ceil(n / 2);

/* Free-play starts: who you are when you did not climb here as governor. */
export const SENATE_STARTS = {
  former_gov: { nm: "Former governor", d: "Known everywhere, owed favours, and your record follows you.", home: 52, clout: 60, loyalty: 60, cor: .3, chest: 2.5 },
  activist: { nm: "Popular activist", d: "The people love you. Abuja does not know you yet, and you are broke.", home: 66, clout: 30, loyalty: 45, cor: .08, chest: .4 },
  businessman: { nm: "Godfather's candidate", d: "Deep pockets and a powerful sponsor. He will want his returns.", home: 45, clout: 50, loyalty: 70, cor: .25, chest: 4, godfather: true },
};

/* A governor's record becomes a senator's start (the story mode). */
export const senateFromGovernor = (st = {}) => ({
  home: Math.round(cl((st.app ?? 50) * .8 + 12)), clout: Math.round(cl(40 + ((st.score ?? 50) - 50) * .5)), loyalty: Math.round(cl(st.pStab ?? 55)),
  cor: Math.round(cl1(st.cor ?? .3) * 100) / 100, chest: Math.round(Math.max(.3, st.fund ?? 1) * 10) / 10,
});

/* The race for the seat: four weeks of moves in your senatorial district. */
export const RACE_MOVES = [
  { id: "rally", ic: "📣", l: "Rallies in every LGA", d: "Big crowds. Costs money.", cost: .3, you: 6 },
  { id: "elders", ic: "👴", l: "Visit the traditional rulers", d: "Slow, but the elders' word carries in the villages.", cost: .05, you: 3, sticky: 2 },
  { id: "record", ic: "📜", l: "Run on your record", d: "Strong if your record is good, a liability if it is not.", cost: 0, record: true },
  { id: "radio", ic: "📻", l: "Radio in every language", d: "Cheap and wide.", cost: .1, you: 4 },
  { id: "cash", ic: "💵", l: "“Mobilisation” on election eve", d: "Money at the polling units. Works; and it is a crime.", cost: .6, you: 8, cor: .05 },
];
export const raceStart = (S) => ({ you: Math.round(cl(38 + (S.home - 50) * .35, 25, 60)), week: 0, log: [] });
export const raceMove = (race, S, m, r) => {
  let gain = m.you || 0;
  if (m.record) gain = Math.round((S.home - 45) / 3 - S.cor * 10);
  const opp = Math.round(2 + r() * 4); // the opponent's own week
  const you = cl(race.you + gain - Math.round(opp / 2), 5, 95);
  return { race: { ...race, you, week: race.week + 1, log: [...race.log, { id: m.id, gain, opp }] }, cost: m.cost || 0, cor: m.cor || 0, gain, opp };
};
export const raceResult = (race, r) => { const swing = (r() - .5) * 8, you = cl(race.you + swing, 5, 95); return { won: you >= 50, you: Math.round(you), opp: Math.round(100 - you) }; };

/* The Senate President election in the first week. */
export const SP_CANDIDATES = [
  { id: "anointed", nm: "The President's choice", d: "The Villa wants him. Back him and doors open; the Senate is a rubber stamp.", winP: .7, ifWin: { clout: 12, home: -2 }, ifLose: { clout: -12 }, committee: "Appropriations" },
  { id: "rebel", nm: "The rebel from your own party", d: "Senators who want a Senate that says no. A gamble.", winP: .38, ifWin: { clout: 18, home: 3 }, ifLose: { clout: -18, loyalty: -10 }, committee: "Public Accounts" },
  { id: "opposition", nm: "The opposition's man", d: "He needs a few votes from your side. Crossing over is noticed.", winP: .22, ifWin: { clout: 14, loyalty: -15 }, ifLose: { clout: -10, loyalty: -12 }, committee: "Petroleum" },
];
export const spElection = (pick, r) => { const c = SP_CANDIDATES.find(x => x.id === pick) || SP_CANDIDATES[0], won = r() < c.winP; return { won, fx: won ? c.ifWin : c.ifLose, committee: won ? c.committee : null, c }; };

/* Bills. prez: the President's bill (his party whips for it). home: what your
   district feels about it (+ likes, − hates). nat: does the country gain. */
export const BILLS = [
  { id: "fuel", t: "Fuel Price Deregulation Bill", d: "Ends the subsidy for good. The Treasury breathes; every bus fare rises.", prez: true, home: -6, nat: 2, base: 56, learn: "Petrol subsidy cost Nigeria trillions of naira a year before it was removed in 2023. Ending it freed money but raised transport and food prices overnight." },
  { id: "statepolice", t: "State Police Bill", d: "Lets states run their own police. Governors cheer; the Inspector-General warns of abuse.", prez: false, home: 5, nat: 1, base: 48, learn: "Section 214 of the Constitution allows only one police force for Nigeria. State police needs a constitutional amendment: two-thirds of each chamber, then approval by at least 24 State Houses of Assembly (Section 9)." },
  { id: "loan", t: "External Loan Approval (₦", d: "", prez: true, home: -2, nat: 0, base: 62, loan: true, learn: "By law, the federal government needs the National Assembly's approval before it borrows abroad. Senators can attach conditions, but they rarely say no." },
  { id: "grazing", t: "National Grazing Routes Bill", d: "Opens cattle routes across states. Herders and farmers read it differently.", prez: true, home: -4, nat: 0, base: 45, learn: "Under the Land Use Act of 1978, land is held by the state governors, not Abuja. That is why cattle routes that cross states are so hard to agree." },
  { id: "youthjobs", t: "Youth Employment Fund Bill", d: "₦500B for training and start-up grants.", prez: false, home: 5, nat: 2, base: 58, learn: "The Nigerian Youth Investment Fund was set up in 2020 with ₦75 billion for young people's businesses. A fund is only as good as how it is paid out." },
  { id: "tax", t: "Tax Harmonisation Bill", d: "One tax collector instead of five. States lose some revenue.", prez: true, home: -2, nat: 3, base: 51, learn: "Federal, state and local governments each have their own taxes and levies, so a trader can be taxed many times over. Harmonisation tries to make one collector do it." },
  { id: "elect", t: "Electoral Act Amendment", d: "Electronic transmission of results from every polling unit, by law.", prez: false, home: 4, nat: 3, base: 50, learn: "The Electoral Act is passed by the National Assembly and signed by the President. It sets how votes are counted and how results are sent from the polling unit." },
  { id: "immunity", t: "Presidential Immunity Extension", d: "Protects the President from prosecution for five years after office.", prez: true, home: -5, nat: -3, base: 47, learn: "Section 308 protects the President, Vice-President, Governors and their deputies from prosecution only while they are in office. It ends the day they leave." },
  { id: "health", t: "Primary Health Care Bill", d: "A funded health post in every ward.", prez: false, home: 6, nat: 3, base: 63, learn: "The National Health Act of 2014 set aside at least 1% of federal revenue for basic health care through the Basic Health Care Provision Fund." },
  { id: "budget", t: "The Appropriation Bill", d: "The President's budget for the year. Every senator wants a line in it.", prez: true, home: 0, nat: 1, base: 70, budget: true, learn: "Section 81: the President lays the Appropriation Bill before the National Assembly every year. Lawmakers can change it, and most of the fights are about whose projects get in." },
  { id: "social", t: "Social Media Regulation Bill", d: "Fines for 'false news' online. Young people are furious.", prez: true, home: -6, nat: -2, base: 44, learn: "A bill against 'internet falsehoods' was introduced in the Senate in 2019. Public outcry, mostly from young people online, stopped it from passing." },
  { id: "lgauto", t: "Local Government Autonomy Bill", d: "Councils paid directly from Abuja. Governors hate it.", prez: false, home: 4, nat: 2, base: 52, learn: "In July 2024 the Supreme Court ruled that local governments' federal allocations must be paid to them directly, not through state-controlled joint accounts." },
  { id: "mining", t: "Solid Minerals Revenue Bill", d: "Host communities get 10% of mining royalties.", prez: false, home: 3, nat: 1, base: 55, learn: "The Minerals and Mining Act of 2007 requires mining companies to sign Community Development Agreements with the people who live where they dig." },
  { id: "salary", t: "Minimum Wage Review Bill", d: "Raises the minimum wage. Labour wants more; states say they cannot pay.", prez: true, home: 5, nat: 0, base: 60, learn: "The minimum wage is on the Exclusive Legislative List: only the National Assembly can set it, and every employer in the country must pay at least that." },
];
/* Bills for one session: one the President sends, one from the floor; the
   budget every second session of a year. */
export const sessionBills = (seed, n) => {
  const r = seeded(seed, "bills", n), pool = BILLS.filter(b => !b.budget), used = new Set();
  const take = (f) => { const c = pool.filter(b => f(b) && !used.has(b.id)); const b = c[Math.floor(r() * c.length)] || pool[0]; used.add(b.id); return b; };
  const out = [n % 2 === 0 ? BILLS.find(b => b.budget) : take(b => b.prez)];
  out.push(take(b => !b.prez && b.id !== out[0].id));
  return out.map(b => b.loan ? { ...b, t: "External Loan Approval (₦" + (2 + Math.floor(r() * 6)) + " trillion)", d: "The President asks to borrow abroad for railways and power. The debt service is already heavy." } : b);
};
/* How the vote goes. vote: yes | no | trade (yes for a federal project for
   your district; needs standing). yourParty: is the President's party yours. */
export const castVote = (bill, vote, S, r) => {
  const yourWeight = 1 + Math.round(S.clout / 25); // allies who follow your lead
  let ayes = Math.round(SENATE_SEATS * (bill.base / 100) + (r() - .5) * 14);
  if (vote === "yes" || vote === "trade") ayes += yourWeight; else ayes -= yourWeight;
  ayes = cl(ayes, 20, SENATE_SEATS - 10);
  const passed = ayes > SENATE_SEATS / 2;
  const fx = { home: 0, clout: 0, loyalty: 0, cor: 0 };
  const withPres = bill.prez ? (vote !== "no") : null;
  if (vote === "no" && bill.prez) { fx.clout -= S.govParty ? 6 : 1; fx.loyalty -= S.govParty ? 8 : -3; }
  if (vote !== "no" && bill.prez) { fx.clout += S.govParty ? 4 : 6; fx.loyalty += S.govParty ? 3 : -6; }
  // Your district judges your vote, not the result.
  fx.home += (vote === "no" ? -1 : 1) * Math.sign(bill.home) * Math.ceil(Math.abs(bill.home) * .7);
  let project = null;
  if (vote === "trade") {
    const ok = S.clout >= 45 || r() < S.clout / 100;
    if (ok) { project = { t: pickProject(r), year: S.year }; fx.cor += .01; } else { fx.clout -= 3; }
  }
  if (bill.budget && vote !== "no" && S.committee === "Appropriations") { project = project || { t: pickProject(r), year: S.year }; }
  // A bill the President did not want can pass and still be vetoed.
  const vetoed = passed && !bill.prez && bill.nat <= 2 && r() < .35;
  return { ayes, noes: SENATE_SEATS - ayes, passed, fx, project, withPres, vetoed };
};
const PROJECTS = ["a federal road to the district headquarters", "a federal medical centre", "a federal college of education", "rural electrification for twelve villages", "an erosion control scheme", "a skills acquisition centre"];
const pickProject = (r) => PROJECTS[Math.floor(r() * PROJECTS.length)];

/* Oversight hearings: a minister in the chair, something in the books. */
export const HEARINGS = [
  { id: "power", min: "Minister of Power", found: "₦38B paid for transformers that were never delivered." },
  { id: "aviation", min: "Minister of Aviation", found: "A national carrier that has no planes but a full payroll." },
  { id: "humanitarian", min: "Minister of Humanitarian Affairs", found: "Cash transfers paid into the bank accounts of the dead." },
  { id: "works", min: "Minister of Works", found: "A highway paid for three times and still unfinished." },
  { id: "petroleum", min: "Minister of State, Petroleum", found: "Crude oil 'lost' to theft equal to a month's exports." },
  { id: "education", min: "Minister of Education", found: "Scholarship funds sent to a firm owned by an aide." },
];
export const HEARING_OPTS = [
  { id: "grill", l: "Grill the minister on live TV", d: "The nation watches. The President will not thank you.", fx: (S) => ({ home: 7, clout: S.govParty ? -6 : 4, loyalty: S.govParty ? -6 : 2 }) },
  { id: "report", l: "Write a damning report and send it to the EFCC", d: "Slower, quieter, and it sticks.", fx: () => ({ home: 3, clout: 3, cor: -.02 }) },
  { id: "silence", l: "Accept the minister's 'appreciation' and close the file", d: "An envelope and a friend in the cabinet.", fx: () => ({ chest: .5, clout: 4, cor: .06 }), risk: .25 },
];
export const hearingFor = (seed, n) => { const r = seeded(seed, "hearing", n); return HEARINGS[Math.floor(r() * HEARINGS.length)]; };

/* The constituency fund: ₦1B a year to deliver at home, or to "manage". */
export const FUND_B = 1;
export const FUND_ITEMS = [
  { id: "boreholes", l: "Boreholes in 20 villages", b: .25, home: 4 },
  { id: "clinic", l: "A health post in each LGA", b: .35, home: 5 },
  { id: "road", l: "Grade the worst rural roads", b: .4, home: 5 },
  { id: "scholar", l: "Scholarships for 500 students", b: .2, home: 3 },
  { id: "transformers", l: "Transformers for dark communities", b: .3, home: 4 },
];
/* picks: item ids; pocket: true keeps what is left (30% of the fund at most
   is "managed" without anyone noticing at once). */
export const spendFund = (picks, pocket, r) => {
  const items = FUND_ITEMS.filter(i => picks.includes(i.id));
  const spent = items.reduce((a, i) => a + i.b, 0);
  if (spent > FUND_B + 1e-9) return { ok: false, why: "That is more than the ₦1B fund." };
  let home = items.reduce((a, i) => a + i.home, 0), cor = 0, chest = 0, exposed = false;
  if (pocket) { chest = Math.round((FUND_B - spent) * 10) / 10; cor = chest * .08; exposed = chest > 0 && r() < .2 + chest * .4; if (exposed) home -= 8; }
  return { ok: true, spent, home, cor, chest, exposed, delivered: items.map(i => i.l) };
};

/* Things that happen to a senator. */
export const SENATE_EVENTS = [
  { id: "defect", t: "The other party wants you", d: "They offer you a committee chair and the governorship ticket next time, if you cross the floor this week.", opts: [
    { id: "cross", l: "Cross the floor", fx: { clout: 8, loyalty: -40, home: -3 }, defect: true, msg: "You defect at a packed press conference. Your old party calls you a traitor." },
    { id: "stay", l: "Stay loyal", fx: { loyalty: 8 }, msg: "Your party leader thanks you publicly. Loyalty has a long memory." },
    { id: "leverage", l: "Use the offer to squeeze your own party", fx: { clout: 5, loyalty: -5 }, msg: "Your party finds you a better committee seat." }] },
  { id: "lobbyist", t: "A lobbyist with a heavy briefcase", d: "A telecoms firm wants the spectrum bill amended. The briefcase is for 'consultation'.", opts: [
    { id: "take", l: "Take it and amend the bill", fx: { chest: .8, cor: .07, clout: 2 }, risk: .3, msg: "The amendment slips through at night." },
    { id: "refuse", l: "Refuse and say so publicly", fx: { home: 4, clout: -2 }, msg: "The firm finds another senator. Your district hears you said no." },
    { id: "report", l: "Report it to the ICPC", fx: { home: 2, cor: -.02 }, msg: "The lobbyist is questioned. You make quiet enemies." }] },
  { id: "insecurity", t: "Bandits attack villages in your district", d: "Twelve dead. Your people expect their senator at home, not in Abuja.", opts: [
    { id: "go", l: "Go home and stand with them", fx: { home: 7, clout: -2 }, msg: "You walk the burnt village. It is on every channel." },
    { id: "motion", l: "Move a motion for troops", fx: { home: 3, clout: 3 }, msg: "The Senate passes your motion. Troops are promised." },
    { id: "statement", l: "Issue a statement", fx: { home: -4 }, msg: "'Our senator sent a press release,' the youths say." }] },
  { id: "padding", t: "The budget is being padded", d: "Committee members are inserting projects nobody asked for. Your share is ₦300M if you stay quiet.", opts: [
    { id: "share", l: "Take your insertions", fx: { chest: .3, cor: .05, clout: 3 }, risk: .2, msg: "Three 'projects' in your name appear in the budget." },
    { id: "blow", l: "Blow the whistle", fx: { home: 6, clout: -8 }, msg: "You are suspended for 30 days. The country cheers you." },
    { id: "quiet", l: "Stay out of it", fx: {}, msg: "You keep your head down." }] },
  { id: "strike", t: "Lecturers have been on strike for six months", d: "Students from your district are at home. A motion asks the Senate to intervene.", opts: [
    { id: "broker", l: "Broker talks between the union and the minister", fx: { home: 5, clout: 4 }, msg: "After two all-night meetings, the strike is suspended." },
    { id: "blame", l: "Blame the union", fx: { home: -3, loyalty: 3 }, msg: "The students do not forget." }] },
  { id: "godfather", t: "Your sponsor calls in his debt", d: "He wants his nephew made the board chairman of a federal agency, through you.", needs: "godfather", opts: [
    { id: "yes", l: "Lobby for the nephew", fx: { clout: -3, cor: .03, loyalty: 4 }, msg: "The nephew gets the job. The agency loses a good man." },
    { id: "no", l: "Refuse", fx: { loyalty: -10, chest: -.5 }, msg: "He withdraws his money from your next campaign." }] },
  { id: "screening", t: "Ministerial screening", d: "The President's nominee for Finance has a fake degree certificate. He asks you to 'take a bow and go'.", opts: [
    { id: "bow", l: "Let him take a bow", fx: { clout: 4, home: -2 }, msg: "He is confirmed without a question." },
    { id: "ask", l: "Ask about the certificate", fx: { home: 5, clout: -4 }, msg: "The nomination is withdrawn. The Villa is not pleased." }] },
];
export const eventFor = (seed, n, S) => {
  const r = seeded(seed, "event", n), pool = SENATE_EVENTS.filter(e => (!e.needs || S[e.needs]) && !(S.seen || []).includes(e.id) && !(e.id === "defect" && S.defected));
  return pool.length ? pool[Math.floor(r() * pool.length)] : null;
};
export const eventChoice = (ev, optId, r) => {
  const o = ev.opts.find(x => x.id === optId) || ev.opts[0];
  const caught = o.risk ? r() < o.risk : false;
  const fx = { ...o.fx }; if (caught) { fx.home = (fx.home || 0) - 8; fx.clout = (fx.clout || 0) - 5; }
  return { fx, msg: o.msg + (caught ? " A newspaper has the story by morning." : ""), caught, defect: !!o.defect };
};

/* Apply effects to the senator. */
export const applyFx = (S, fx = {}) => ({ ...S,
  home: Math.round(cl(S.home + (fx.home || 0))), clout: Math.round(cl(S.clout + (fx.clout || 0))), loyalty: Math.round(cl(S.loyalty + (fx.loyalty || 0))),
  cor: Math.round(cl1(S.cor + (fx.cor || 0)) * 100) / 100, chest: Math.round(Math.max(0, S.chest + (fx.chest || 0)) * 10) / 10 });

/* Overriding a veto: two-thirds of 109 is 73. Leading it costs standing
   with the Villa whether or not it works. */
export const OVERRIDE_NEED = 73;
export const overrideVote = (S, r) => { const ayes = cl(Math.round(58 + S.clout / 5 + (r() - .5) * 16), 30, SENATE_SEATS); return { ayes, passed: ayes >= OVERRIDE_NEED, fx: { clout: ayes >= OVERRIDE_NEED ? 6 : -4, loyalty: S.govParty ? -6 : 2, home: 2 } }; };

/* Re-election at the end of the term. The party may deny you the ticket. */
export const reElection = (S, r) => {
  const ticket = S.loyalty >= 35 || S.defected;
  if (!ticket) return { ticket: false, won: false, you: 0 };
  const you = cl(S.home * .7 + 15 + Math.min(10, S.chest * 2) - S.cor * 20 + (r() - .5) * 10, 5, 95);
  return { ticket: true, won: you >= 50, you: Math.round(you) };
};
/* The grade for the term: home (40%), standing (25%), what you delivered
   and passed (20%), clean hands (15%). */
export const senateScore = (S) => Math.round(S.home * .4 + S.clout * .25 + Math.min(100, (S.delivered || []).length * 8 + (S.sponsored || 0) * 15) * .2 + (1 - S.cor) * 100 * .15);
export const senateGrade = (score) => score >= 75 ? "A" : score >= 62 ? "B" : score >= 50 ? "C" : score >= 38 ? "D" : "F";

/* Your own bill, once a year: passes with enough standing. */
export const OWN_BILLS = [
  { id: "ruralpower", t: "Rural Electrification Fund Bill", home: 6, need: 55 },
  { id: "okada", t: "Okada and Keke Riders' Welfare Bill", home: 4, need: 40 },
  { id: "disability", t: "Disability Rights Enforcement Bill", home: 3, need: 35 },
  { id: "farm", t: "Farmers' Credit Guarantee Bill", home: 5, need: 50 },
  { id: "varsity", t: "Federal University (Your District) Establishment Bill", home: 8, need: 60 },
];
export const sponsorBill = (b, S, r) => { const p = cl(.25 + (S.clout - b.need) / 60, .08, .92), passed = r() < p; return { passed, chance: Math.round(p * 100), fx: passed ? { home: b.home, clout: 4 } : { clout: -2 } }; };

/* How it really works: notes the career teaches, collected in the Senate
   notebook. Keys: race, sp, vote, trade, hearing, fund, defect, lobbyist,
   insecurity, padding, strike, screening, recall, override, godfather. */
export const LEARN = {
  race: "The Senate has 109 seats: three for each of the 36 states, one for each senatorial district, and one for the FCT (Section 48). A senator must be at least 35 (Section 65).",
  sp: "Section 50: senators elect their own Senate President from among themselves. The President of Nigeria has no vote, but the Villa often lobbies hard.",
  vote: "A bill becomes law when both the Senate and the House pass it and the President signs (Section 58).",
  override: "If the President refuses to sign, the National Assembly can make a bill law anyway with a two-thirds vote in each chamber (Section 58(5)). It rarely happens.",
  trade: "Senators cannot spend money themselves. Constituency projects are put in the federal budget at a lawmaker's request and carried out by federal agencies.",
  hearing: "Sections 88 and 89 let the National Assembly investigate any ministry and summon anyone, including ministers, to give evidence.",
  fund: "Constituency projects are meant for things like boreholes, clinics and roads. Watchdogs regularly find projects that were paid for but never built.",
  defect: "Section 68(1)(g) says a lawmaker who defects loses the seat, unless their old party is divided. In practice the courts and the Senate rarely enforce it.",
  lobbyist: "Offering or taking money to influence a law is a crime under the Corrupt Practices Act of 2000. The ICPC was set up to investigate it.",
  insecurity: "A Senate motion is a resolution: it can urge the President to act, but it cannot command the army. Only the President commands the armed forces.",
  padding: "'Budget padding' means inserting items into the budget after it has been agreed. It has caused several scandals in the National Assembly.",
  strike: "Lecturers in public universities belong to ASUU, which has struck many times over pay and funding. Senators can mediate, but the agreement is the government's.",
  screening: "Section 147: ministers are nominated by the President and must be confirmed by the Senate. 'Take a bow and go' is a custom that lets former lawmakers skip questions.",
  recall: "Section 69: voters can recall their senator if more than half of the registered voters in the district sign a petition and then vote in a referendum.",
  godfather: "Federal board appointments are made by the President. Lawmakers lobby for their people, which is legal; selling the slots is not.",
};

/* The free first year: sessions 1 and 2 are free; then the unlock. */
export const TRIAL_SESSIONS = 2;
