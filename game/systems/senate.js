/* The Senator career: pure rules (no React). A senator runs nothing and
   spends little; their power is a vote. One term is four years of two
   sessions each. Home support decides the next election; standing in
   Abuja decides what the vote can buy. Every roll is seeded from the run's
   seed and the session, so a reload replays the same Senate. */
import { seeded } from "./rng.js";
import { arcNotes } from "./crises.js";

const cl = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const cl1 = (v) => Math.max(0, Math.min(1, v));
export const SENATE_SEATS = 109, SESSIONS = 8; // two sessions a year, four years
export const sessionYear = (n) => Math.ceil(n / 2);

/* Free-play starts: who you are when you did not climb here as governor. */
export const SENATE_STARTS = {
  former_gov: { nm: "Former governor", d: "Known everywhere, owed favours, and your record follows you.", home: 52, clout: 60, loyalty: 60, cor: .3, chest: 2.5 },
  activist: { nm: "Popular activist", d: "The people love you. Abuja does not know you yet, and you are broke.", home: 60, clout: 30, loyalty: 45, cor: .08, chest: .4 },
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
export const raceStart = (S) => ({ you: Math.round(cl(43 + (S.home - 50) * .2, 30, 56)), week: 0, log: [] });
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
/* The grade for the term: home (35%), standing (20%), what you delivered,
   won and passed (25%), clean hands (20%). */
export const senateLegacy = (S) => Math.min(100, (S.delivered || []).length * 3 + (S.projects || []).length * 7 + (S.sponsored || 0) * 15);
export const senateScore = (S) => Math.round(S.home * .35 + S.clout * .2 + senateLegacy(S) * .25 + (1 - S.cor) * 100 * .2);
export const senateGrade = (score) => score >= 78 ? "A" : score >= 65 ? "B" : score >= 52 ? "C" : score >= 40 ? "D" : "F";
/* Between sessions: the district asks what you have done lately, and Abuja
   moves on to the next senator with something to trade. */
export const SESSION_DRIFT = { home: -7, clout: -3 };

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

// The headscratchers' notebook pages: the lesson, and where it really happened.
Object.assign(LEARN, arcNotes("senate"));

/* ══ The Senate, enriched (owner, 21 Nov 2026) ═══════════════════════════════════════════════════════════════════
   Confirmations, Section 68 defection cases, a Section 69 recall that can really happen, going home to the district,
   the third-term amendment, the legislative aide who runs your mail, and the Senate Presidency for the best. All
   people are fictional; the Constitution and the procedures are real. */

// The district's register (for the recall arithmetic): 400,000 to 700,000 voters, fixed per career.
export const districtRegister = (seed) => 400000 + Math.round(seeded(seed, "register")() * 300) * 1000;

// ── Confirmations: the President's nominees come to the Senate (Section 147 ministers, 171 ambassadors, 231 judges,
// and the boards of federal agencies). Each nominee has a secret the screening can bring out.
export const NOMINEES = [
  { id: "min_fin", post: "Minister of Finance", who: "Dr. Halima Sadiq-Okon", flaw: null, d: "A former central bank director. Clean record, sharp answers." },
  { id: "min_works", post: "Minister of Works", who: "Engr. Bode Fashanu", flaw: "contracts", d: "His construction firm won ₦40B in federal contracts last year. He says he has 'resigned from the board'." },
  { id: "amb_valdoria", post: "Ambassador to Valdoria", who: "Chief Emeka Duru", flaw: "bow", d: "A former senator. His friends in the chamber want him to 'take a bow and go'." },
  { id: "judge_appeal", post: "Justice of the Court of Appeal", who: "Justice Aisha Bello", flaw: null, d: "Twenty years on the bench. The bar association backs her." },
  { id: "efcc_chair", post: "Chairman of the anti-graft agency", who: "Mr. Tunde Alao", flaw: "loyal", d: "The President's former aide-de-camp. Critics say he will only chase the President's enemies." },
  { id: "min_health", post: "Minister of Health", who: "Prof. Ngozi Ibe", flaw: "certificate", d: "Her CV lists a PhD from a university nobody can find." },
  { id: "board_ports", post: "Chairman, Ports Authority board", who: "Alhaji Sule Danjuma", flaw: "godfather", d: "A party financier. No shipping experience." },
];
export const nomineeFor = (seed, n, S) => { const pool = NOMINEES.filter(x => !(S.screened || []).includes(x.id)); if (!pool.length) return null; return pool[Math.floor(seeded(seed, "nominee", n)() * pool.length)]; };
export const SCREEN_OPTS = [
  { id: "confirm", l: "Confirm", d: "Let the nomination through." },
  { id: "grill", l: "Grill the nominee", d: "Ask the hard questions, on camera." },
  { id: "reject", l: "Vote to reject", d: "Lead the no votes." },
];
export const screenChoice = (nom, opt, S, r) => {
  const flawed = !!nom.flaw;
  if (opt === "confirm") return flawed ? { fx: { clout: 4, loyalty: 3, home: nom.flaw === "bow" ? 0 : -3 }, msg: nom.flaw === "bow" ? "He takes a bow and goes. Nobody asks him anything." : nom.who + " is confirmed. The questions nobody asked will be asked later, in the papers.", later: nom.flaw !== "bow" } : { fx: { clout: 3 }, msg: nom.who + " is confirmed. A good appointment." };
  if (opt === "grill") return flawed ? (r() < .65 ? { fx: { home: 5, clout: S.govParty ? -3 : 3 }, msg: "Under your questions the story falls apart: " + ({ contracts: "his firm is still bidding", certificate: "the university does not exist", loyal: "he admits he has never investigated anyone close to the President", godfather: "he cannot name one port", bow: "he cannot say what Valdoria buys from Nigeria" })[nom.flaw] + ". The nomination is withdrawn.", withdrawn: true } : { fx: { clout: -2 }, msg: "The nominee survives your questions with practised answers. Confirmed." })
    : { fx: { home: 1, clout: 1 }, msg: "Tough questions, good answers. " + nom.who + " is confirmed with your respect." };
  return flawed ? { fx: { home: 4, clout: S.govParty ? -5 : 2, loyalty: S.govParty ? -6 : 0 }, msg: "You lead the no votes. " + (r() < .5 ? "The Senate rejects " + nom.who + "." : "You lose the vote, but the country heard why."), withdrawn: true } : { fx: { clout: -4, home: -1 }, msg: "You voted against a qualified nominee. Colleagues wonder what you were paid." };
};

// ── Section 68: defecting loses the seat unless the old party is divided. The old party sues.
export const DEFECT_CASE_OPTS = [
  { id: "faction", l: "Tell the court your old party is divided", d: "The usual defence. Lawyers are expensive; courts are slow.", chest: -.3 },
  { id: "settle", l: "Go back to your old party", d: "The case is dropped. You lose face in both parties.", chest: 0 },
  { id: "ignore", l: "Ignore the case", d: "Courts rarely enforce Section 68. Rarely.", chest: 0 },
];
export const defectCase = (S, opt, r) => {
  if (opt === "settle") return { kept: true, back: true, fx: { clout: -6, loyalty: 20, home: -2 }, msg: "You return to your old party. The suit is withdrawn. Both parties now call you unreliable." };
  const p = opt === "faction" ? .8 : .55, kept = r() < p;
  return kept ? { kept: true, fx: { chest: opt === "faction" ? -.3 : 0, clout: 2 }, msg: opt === "faction" ? "The court accepts that your old party is split into factions. You keep your seat." : "The case drifts from adjournment to adjournment. Your seat is safe, for now." }
    : { kept: false, fx: {}, msg: "The court rules that there was no division in your old party. Under Section 68 your seat is declared vacant." };
};

// ── Section 69: recall. Petition (more than half of the register sign), INEC verification (BVAS), referendum within
// 90 days (more than half of the whole register vote yes), certificate to the Senate President. It is hard. It can happen.
// R: { stage: "petition" | "verify" | "referendum", sigs, verified, at, stalls }.
export const RECALL_START = 35; // a district this angry starts collecting signatures
export const recallStep = (S, r) => {
  const reg = S.register || 500000, R0 = S.recall, anger = Math.max(0, 50 - S.home) / 50; // 0..1
  if (!R0) return S.home < RECALL_START ? { recall: { stage: "petition", sigs: Math.round(reg * (.12 + anger * .25)), at: S.n, stalls: 0 }, note: "petition_start" } : null;
  if ((R0.stallUntil || 0) >= S.n) return { recall: R0, note: "stalled" };
  if (R0.stage === "petition") {
    const sigs = Math.max(0, Math.round(R0.sigs + reg * (anger * .35 - (S.home >= 45 ? .15 : 0)) + reg * (r() - .5) * .06));
    if (sigs <= reg * .05 && S.home >= 45) return { recall: null, note: "petition_dies" };
    if (sigs > reg * .58) return { recall: { ...R0, stage: "verify", sigs }, note: "petition_submitted" }; // organisers collect a cushion: some names never verify
    return { recall: { ...R0, sigs }, note: "petition_grows" };
  }
  if (R0.stage === "verify") {
    const verified = Math.round(R0.sigs * Math.min(1, .62 + anger * .45 + (r() - .5) * .1));
    return verified > reg / 2 ? { recall: { ...R0, stage: "referendum", verified }, note: "verified" } : { recall: null, note: "verification_fails", verified };
  }
  if (R0.stage === "referendum") {
    const turnout = Math.min(.92, .38 + anger * .5 + (r() - .5) * .08), yesShare = Math.min(.98, .5 + anger * .5), yes = Math.round(reg * turnout * yesShare);
    return yes > reg / 2 ? { recall: { ...R0, yes }, note: "recalled", yes } : { recall: null, note: "referendum_fails", yes };
  }
  return null;
};
export const recallView = (S) => { const R0 = S.recall; if (!R0) return null; const reg = S.register || 500000, need = Math.floor(reg / 2) + 1;
  return { stage: R0.stage, reg, need, sigs: R0.sigs, verified: R0.verified, pct: Math.round((R0.sigs || 0) * 100 / reg) }; };

// ── Going home: one visit a session. What you can do there.
export const HOME_ACTS = [
  { id: "townhall", ic: "🗣️", l: "Hold a town hall", d: "Face your people. Answer for your votes.", fx: { home: 5 } },
  { id: "commission", ic: "✂️", l: "Commission what you built", d: "Ribbons, cameras, a crowd. Only works if you built something.", needs: "delivered", fx: { home: 7 } },
  { id: "rulers", ic: "👑", l: "Visit the traditional rulers", d: "Slow, but the palaces quiet a petition in the villages.", fx: { home: 3 }, calm: .08 },
  { id: "empower", ic: "🎁", l: "Share 'empowerment' items", d: "Grinding machines, motorcycles, cash. People take them; some remember.", fx: { home: 4, chest: -.3, cor: .02 }, cost: .3 },
  { id: "injunction", ic: "⚖️", l: "Get a court injunction against the recall", d: "Stalls the recall for a session. It looks like fear.", needs: "recall", fx: { home: -3, chest: -.2 }, cost: .2, stall: true },
  { id: "withdraw", ic: "✍️", l: "Pay agents to get signatures withdrawn", d: "Cash for names. If it comes out, the petition grows.", needs: "petition", fx: { chest: -.4, cor: .06 }, cost: .4, calm: .12, risk: .35 },
];
export const homeAct = (S, a, r) => {
  const fx = { ...a.fx }; let R0 = S.recall ? { ...S.recall } : null, msg = a.l + ".", caught = false;
  if (a.id === "commission") { const k = (S.delivered || []).length - (S.commissioned || 0); if (k <= 0) { fx.home = 1; msg = "There is nothing new to commission. People notice the empty ribbon."; } else msg = "You commission " + Math.min(k, 3) + " project" + (Math.min(k, 3) === 1 ? "" : "s") + " in the district. The crowd is real."; }
  if (a.calm && R0 && R0.stage === "petition") R0.sigs = Math.max(0, Math.round(R0.sigs - (S.register || 500000) * a.calm));
  if (a.risk && r() < a.risk) { caught = true; fx.home = (fx.home || 0) - 8; if (R0 && R0.stage === "petition") R0.sigs = Math.round(R0.sigs + (S.register || 500000) * .1); msg = "A video of your agents paying people to withdraw signatures goes round. The petition grows."; }
  if (a.stall && R0) { R0.stallUntil = S.n + 1; R0.stalls = (R0.stalls || 0) + 1; msg = "The court grants an injunction. The recall is frozen until the next session."; }
  return { fx, recall: R0, msg, caught, commissioned: a.id === "commission" ? Math.min((S.delivered || []).length, (S.commissioned || 0) + 3) : S.commissioned };
};

// ── The third-term amendment (fictional): the President's allies want three terms. Four beats over two sessions.
export const TT_START = 3;
export const TT_BEATS = {
  caucus: { t: "A quiet meeting at the Villa", d: "The President's allies are gathering signatures for a Constitution Amendment Bill. Buried on page 40: presidents and governors may serve three terms. They want your name on the list.", opts: [
    { id: "sign", l: "Sign on", fx: { clout: 6, loyalty: 8, home: -3 }, pos: "yes" },
    { id: "refuse", l: "Refuse, and say why", fx: { clout: -5, home: 5, loyalty: -6 }, pos: "no" },
    { id: "quiet", l: "Say nothing yet", fx: {}, pos: "open" }] },
  hotel: { t: "Room 412, a hotel in Abuja", d: "A man you have never met slides a black bag across the table. ₦50M, 'for your district'. Another ₦50M after the vote.", opts: [
    { id: "take", l: "Take it, and vote yes", fx: { chest: .05, cor: .08, clout: 3 }, pos: "yes", risk: .3, cash: true },
    { id: "takeno", l: "Take it, and vote no anyway", fx: { chest: .05, cor: .06 }, pos: "no", risk: .4, cash: true },
    { id: "expose", l: "Walk out, and tell the press", fx: { home: 7, clout: -4 }, pos: "no", expose: true },
    { id: "refuse", l: "Refuse quietly", fx: { cor: -.01 }, pos: "open" }] },
  debate: { t: "The debate, live on television", d: "The Senate President has allowed the cameras in. The whole country is watching the chamber. You have the floor for five minutes.", opts: [
    { id: "against", l: "Speak against the bill", fx: { home: 6, clout: 2 }, pos: "no", sway: -6 },
    { id: "for", l: "Speak for the bill", fx: { home: -5, clout: 3 }, pos: "yes", sway: 5 },
    { id: "skip", l: "Let others speak", fx: {}, pos: "open", sway: 0 }] },
  vote: { t: "The vote on the Constitution Amendment Bill", d: "Amending the Constitution needs two-thirds of the Senate: 73 of 109. Then two-thirds of the House, and two-thirds of the state Houses of Assembly.", opts: [
    { id: "aye", l: "Vote aye", pos: "yes" }, { id: "nay", l: "Vote nay", pos: "no" }] },
};
export const ttNext = (T) => !T ? "caucus" : T.stage === "caucus" ? "hotel" : T.stage === "hotel" ? "debate" : T.stage === "debate" ? "vote" : null;
export const ttChoose = (S, beat, optId, r) => {
  const B = TT_BEATS[beat], o = B.opts.find(x => x.id === optId) || B.opts[0], T = { ...(S.tt || {}), stage: beat, [beat]: o.id };
  const fx = { ...(o.fx || {}) }; let msg = "", caught = false;
  if (o.cash && r() < o.risk) { caught = true; fx.home = (fx.home || 0) - 9; msg = "Someone filmed the bag. The video is on every phone by morning. "; }
  if (beat === "caucus") msg += o.id === "sign" ? "Your name is on the list. The Villa remembers its friends." : o.id === "refuse" ? "You tell reporters you will not sign. The Villa's chief of staff stops returning your calls." : "You keep your counsel. Both sides start courting you.";
  if (beat === "hotel") msg += o.id === "expose" ? "Your press conference names the hotel and the room. Other senators come forward." : o.id === "refuse" ? "You leave the bag on the table." : "The bag goes home with you.";
  if (beat === "debate") msg += o.id === "against" ? "Your speech is clipped and shared: 'Nigeria is bigger than one man.'" : o.id === "for" ? "You argue for 'continuity'. The gallery boos." : "You listen. Others make history.";
  if (beat !== "vote") return { T, fx, msg, caught };
  // The vote: how many ayes, from the chamber's mood and what you did.
  const sway = (T.debate === "against" ? -6 : T.debate === "for" ? 5 : 0) + (T.hotel === "expose" ? -10 : 0) + (S.clout >= 60 ? (o.pos === "no" ? -4 : 4) : 0);
  const ayes = Math.max(30, Math.min(100, Math.round(70 + sway + (r() - .5) * 10))), passed = ayes >= OVERRIDE_NEED;
  T.vote = o.id; T.ayes = ayes; T.passed = passed;
  const fxV = o.pos === "no" ? (passed ? { home: 4, clout: -6, loyalty: -8 } : { home: 9, clout: 5 }) : (passed ? { clout: 6, home: -8 } : { clout: -6, home: -6 });
  return { T, fx: fxV, ayes, passed, msg: passed ? "The bill passes the Senate " + ayes + " to " + (SENATE_SEATS - ayes) + ". It goes to the House and the states." : "The bill dies on the floor: " + ayes + " ayes, " + OVERRIDE_NEED + " were needed. The third term is over before it began." };
};

// ── Your legislative aide: the mail and the notifications, a few lines each session.
export const aideNotes = (S, n) => {
  const out = [], R0 = recallView(S), T = S.tt || {};
  out.push({ ic: "📋", t: "Order paper", d: "This session: " + ((S.items || []).length || "no") + " item" + ((S.items || []).length === 1 ? "" : "s") + ". " + ((S.items || []).some(i => i.k === "screen") ? "A nominee comes for screening." : "No screening this session.") });
  if (R0) out.push({ ic: "🚨", t: "The recall", d: R0.stage === "petition" ? R0.pct + "% of the " + R0.reg.toLocaleString() + " registered voters have signed. The law needs more than " + R0.need.toLocaleString() + "; organisers want a cushion before they go to INEC. You should go home." : R0.stage === "verify" ? "The petition is at INEC. Officials with BVAS machines will check every signature at the polling units." : "INEC has fixed the referendum. If more than " + R0.need.toLocaleString() + " vote yes, you lose your seat.", urgent: true });
  else if (S.home < RECALL_START + 8) out.push({ ic: "⚠️", t: "Home is restless", d: "Support at home is " + S.home + "%. Below " + RECALL_START + "% your opponents will start a recall petition. A visit home would help.", urgent: true });
  if (n >= TT_START - 1 && !T.vote) out.push({ ic: "🤫", t: "Rumours in the lobby", d: T.stage ? "The third-term bill is moving. Senators are being invited to hotels." : "There is talk that the President's allies want to change the Constitution. Watch who is being invited to the Villa." });
  if (S.defectCase && S.defectCase.status === "open") out.push({ ic: "⚖️", t: "Your court case", d: "Your old party's suit under Section 68 is listed for hearing.", urgent: true });
  if ((S.delivered || []).length > (S.commissioned || 0)) out.push({ ic: "✂️", t: "Ready to commission", d: ((S.delivered || []).length - (S.commissioned || 0)) + " project" + ((S.delivered || []).length - (S.commissioned || 0) === 1 ? "" : "s") + " at home finished. Go home and cut the ribbon." });
  if (S.homeVisit !== n) out.push({ ic: "🏠", t: "Your district", d: "You have not been home this session. People notice an absent senator." });
  return out;
};

// ── The Senate Presidency: at the end of a strong term, re-elected senators may run for the chair of the next Senate.
export const spEligible = (S) => senateScore(S) >= 65 && S.clout >= 55 && S.cor <= .35;
export const SP_BID_MOVES = [
  { id: "zone", ic: "🗺️", l: "Win the zoning argument", d: "Persuade the party that the seat should go to your zone.", fx: { loyalty: 4 }, votes: 8 },
  { id: "villa", ic: "🏛️", l: "Get the Villa's blessing", d: "The President's support brings the ruling party's votes, and his strings.", fx: { clout: 3, home: -2 }, votes: 12, need: "govParty" },
  { id: "caucus", ic: "🤝", l: "Work the opposition caucus", d: "Promise them committee chairs.", fx: { loyalty: -4 }, votes: 10 },
  { id: "record", ic: "📜", l: "Run on your record", d: "Your laws, your hearings, your clean hands.", fx: {}, votes: 0, record: true },
  { id: "dollars", ic: "💵", l: "'Appreciate' your colleagues", d: "Dollars in envelopes. It works, and it is a crime.", fx: { cor: .08, chest: -.6 }, votes: 14, cost: .6 },
];
export const spBid = (S, picks, r) => {
  const base = 38 + Math.round((S.clout - 50) * .6) + Math.round((senateScore(S) - 60) * .5);
  const votes = picks.reduce((a, id) => { const m = SP_BID_MOVES.find(x => x.id === id); if (!m) return a; return a + (m.record ? Math.round((senateLegacy(S) - 30) / 4 + (1 - S.cor) * 6) : m.votes); }, base);
  const rival = 40 + Math.round(r() * 14), you = Math.max(10, Math.min(SENATE_SEATS - 10, votes + Math.round((r() - .5) * 8)));
  return { you, rival: Math.min(SENATE_SEATS - you, rival), won: you >= 55 };
};
Object.assign(LEARN, {
  screen: "The Senate confirms the President's nominees: ministers (Section 147), ambassadors (Section 171), senior judges (Section 231) and the boards of many federal agencies. 'Take a bow and go' lets former lawmakers skip questions; it is a custom, not a law.",
  defect_case: "Section 68(1)(g): a lawmaker who joins another party before the end of the term loses the seat, unless the old party is divided or merging. Defectors usually claim a division, and the cases can run for years.",
  recall_steps: "Recall under Section 69: a petition signed by more than half of the district's registered voters goes to INEC; INEC verifies the signatures at the polling units; within 90 days it holds a referendum, and more than half of all registered voters must vote yes. Then INEC sends a certificate to the Senate President. No federal lawmaker has been recalled since 1999.",
  third_term: "Amending the Constitution (Section 9) needs two-thirds of each chamber of the National Assembly and the approval of two-thirds of the state Houses of Assembly. In 2006 the Senate threw out an amendment bill that would have allowed a third term, after a debate broadcast live.",
  senate_president: "Section 50: the Senate President is elected by the senators from among themselves, at the first sitting of a new Senate. Parties argue about 'zoning' the office to a region; the Villa often lobbies, but it has no vote.",
  home: "Senators are elected to represent their district; there is no rule that they must visit, but voters judge them on it. Constituency offices and regular town halls are how most stay in touch.",
});
