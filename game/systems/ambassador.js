/* The Ambassador career: pure rules (no React). Far from home, with three
   masters: the President's instructions from Abuja, the host government
   that can expel you, and the Nigerians abroad who come to the embassy
   when things go wrong. The countries are invented. One posting is three
   years of two halves each. Every roll is seeded. */
import { seeded } from "./rng.js";
import { arcItems, arcNotes } from "./crises.js";

const cl = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const cl1 = (v) => Math.max(0, Math.min(1, v));
export const AMB_HALVES = 6, AMB_TRIAL = 2;

/* Invented countries: no real flags, cities or governments. */
export const POSTINGS = {
  valdoria: { nm: "the Republic of Valdoria", city: "Port Asterin", d: "Twelve thousand Nigerian students, strict police, and a government that buys Nigerian gas.", host: 55, diaspora: 50 },
  ostrava: { nm: "the Kingdom of Ostrava", city: "Kessenburg", d: "A big community of Nigerian traders, tough immigration rules, and a king who likes ceremony.", host: 45, diaspora: 45 },
  meridia: { nm: "the Federation of Meridia", city: "Solenne", d: "Rich, far away and eager to invest, if Abuja's paperwork can keep up.", host: 60, diaspora: 55 },
};
/* Who you are when the President sends you. */
export const AMB_STARTS = {
  career: { nm: "Career diplomat", d: "Twenty years in the Foreign Service. You know the rules; Abuja barely knows your name.", abuja: 45, hostAdj: 8, diasporaAdj: 0, cor: .05 },
  appointee: { nm: "Political appointee", d: "A reward for loyalty. The President takes your calls; the host government is not impressed.", abuja: 72, hostAdj: -8, diasporaAdj: -3, cor: .2 },
  champion: { nm: "Diaspora champion", d: "You lived abroad for years. Nigerians abroad trust you; Abuja is not sure whose side you are on.", abuja: 40, hostAdj: 0, diasporaAdj: 15, cor: .05 },
};

/* Cables from Abuja: the President's instructions. */
export const CABLES = [
  { id: "unvote", t: "Cable: win their vote for our UN seat", d: "Nigeria wants a seat on a UN council. Abuja expects this country's vote within the month.", learn: "un",
    opts: [{ id: "lobby", l: "Lobby the foreign ministry hard", fx: { abuja: 6, host: -2 } }, { id: "trade", l: "Offer them our support for their candidate in return", fx: { abuja: 8, host: 4 }, risk: .2 }, { id: "report", l: "Report honestly that they will vote against us", fx: { abuja: -4, host: 2 } }] },
  { id: "deal", t: "Cable: the trade deal must be signed by Friday", d: "The President is announcing it at home on Saturday. The draft still has problems.", learn: "trade",
    opts: [{ id: "sign", l: "Sign it as it is", fx: { abuja: 8, trade: 1, host: 2 }, risk: .25 }, { id: "fix", l: "Ask for a week to fix the bad clauses", fx: { abuja: -6, trade: 1, host: 4 } }] },
  { id: "deny", t: "Cable: deny the story", d: "A newspaper here reports that a Nigerian minister's son was caught with forged visas. Abuja wants a firm denial.", learn: "mfa",
    opts: [{ id: "deny", l: "Issue the denial", fx: { abuja: 6, host: -4 }, risk: .35 }, { id: "nocomment", l: "Say the matter is with the courts", fx: { abuja: -3, host: 2 } }] },
  { id: "loan", t: "Cable: ask them for a loan", d: "The Finance Ministry wants a soft loan for a railway. The host wants guarantees.", learn: "trade",
    opts: [{ id: "push", l: "Push hard: promise what they ask", fx: { abuja: 7, host: 2, trade: 1 }, risk: .2 }, { id: "honest", l: "Tell Abuja the terms are bad", fx: { abuja: -4, host: 3 } }] },
  { id: "visit", t: "Cable: the President is coming", d: "A state visit in three weeks: forty people in the delegation and a list of demands for hotels and cars.", learn: "credence",
    opts: [{ id: "lavish", l: "Arrange everything, whatever it costs", fx: { abuja: 9, cor: .04, diaspora: -3 } }, { id: "modest", l: "Arrange it properly, within the budget", fx: { abuja: 2, host: 3 } }] },
  { id: "budget", t: "Cable: the mission's budget is cut by a third", d: "Abuja is broke. Local staff salaries are already two months late.", learn: "mfa",
    opts: [{ id: "allowances", l: "Cut your own allowances and the official cars first", fx: { abuja: 2, diaspora: 3, cor: -.02 } }, { id: "consular", l: "Close the consular section on Fridays", fx: { diaspora: -6, abuja: 3 } }, { id: "fees", l: "Add 'processing fees' to passports", fx: { diaspora: -5, cor: .04 } }] },
];

/* Nigerians in trouble: the embassy's real work. */
export const CASES = [
  { id: "detained", t: "A Nigerian is held without charge", bg: "detention-visiting-room", who: "detained-citizen", d: "Emeka, a mechanic, was arrested at a checkpoint nine days ago. Nobody has told the embassy why.", learn: "consular",
    opts: [{ id: "visit", l: "Visit him and demand consular access", fx: { diaspora: 7, host: -2 } }, { id: "lawyer", l: "Hire him a lawyer from the mission's welfare fund", fx: { diaspora: 5 } }, { id: "wait", l: "Wait for the police report", fx: { diaspora: -6 } }] },
  { id: "students", t: "Students are stranded", bg: "consular-hall", who: "citizen-student-abroad", d: "Their state scholarship has not been paid for a year. Universities are expelling them.", learn: "nidcom",
    opts: [{ id: "abuja", l: "Press Abuja and the states to pay", fx: { diaspora: 5, abuja: -3 } }, { id: "loan", l: "Negotiate a payment pause with the universities", fx: { diaspora: 6, host: 3 } }, { id: "nothing", l: "It is the states' problem", fx: { diaspora: -7 } }] },
  { id: "traders", t: "Traders' goods seized at the port", bg: "embassy-exterior", who: "citizen-trader-abroad", d: "Customs here have held forty containers belonging to Nigerian traders for two months, over a paperwork rule.", learn: "remit",
    opts: [{ id: "minister", l: "Take it to the trade minister personally", fx: { diaspora: 6, host: -1, trade: 1 } }, { id: "lawyers", l: "Help the traders' association hire lawyers", fx: { diaspora: 4 } }] },
  { id: "passports", t: "The passport queue goes round the block", bg: "consular-hall", who: "consular-officer", d: "The booklet machine broke in March. Families have waited months to renew passports.", learn: "passport",
    opts: [{ id: "weekend", l: "Open on weekends until the backlog is cleared", fx: { diaspora: 7, cor: -.01 } }, { id: "fixer", l: "Let 'agents' sell fast-track slots", fx: { diaspora: -4, cor: .05 } }, { id: "abuja", l: "Ask Abuja for a new machine", fx: { diaspora: 1 } }] },
  { id: "evacuate", t: "Riots: Nigerians are being attacked", bg: "evacuation-airport", d: "Mobs in two cities are targeting foreign shops. Hundreds of Nigerians are hiding in churches and mosques.", learn: "evac",
    opts: [{ id: "fly", l: "Charter flights home for everyone who wants to leave", fx: { diaspora: 10, abuja: 3, host: -3 } }, { id: "shelter", l: "Shelter them at the embassy and press the police", fx: { diaspora: 6, host: -1 } }, { id: "quiet", l: "Quiet diplomacy only", fx: { diaspora: -8, host: 3 } }] },
  { id: "deathrow", t: "A Nigerian faces execution", bg: "detention-visiting-room", who: "detained-citizen", d: "Convicted of carrying drugs for someone else. His mother has written to you every week.", learn: "deathrow",
    opts: [{ id: "clemency", l: "Ask the head of state for clemency", fx: { diaspora: 6, host: -2 } }, { id: "appeal", l: "Fund a final appeal", fx: { diaspora: 4 } }, { id: "nothing", l: "Respect their courts", fx: { diaspora: -6, host: 2 } }] },
];

/* The host country and the community. */
export const HOST_ITEMS = [
  { id: "minister", t: "The host minister has a complaint", bg: "foreign-ministry-meeting", who: "host-minister", d: "She says Nigerian fraudsters are targeting her citizens online, and her parliament wants visas tightened for all Nigerians.", learn: "visa",
    opts: [{ id: "cooperate", l: "Offer joint police work against the fraud gangs", fx: { host: 7, diaspora: 2 } }, { id: "reciprocity", l: "Warn that Nigeria will tighten visas too", fx: { host: -6, abuja: 3 } }, { id: "accept", l: "Accept the new rules", fx: { host: 3, diaspora: -6 } }] },
  { id: "fair", t: "A trade fair: Nigerian cocoa, sesame and fashion", scene: "trade-deal-signing", d: "Buyers from across the country are coming. A deal is within reach if you work the room.", learn: "trade",
    opts: [{ id: "work", l: "Work the room for three days", fx: { trade: 2, host: 3 } }, { id: "speech", l: "Give the opening speech and leave", fx: { trade: 1 } }] },
  { id: "townhall", t: "The diaspora wants a town hall", scene: "diaspora-town-hall", d: "Five hundred Nigerians have booked a hall. They want to talk about passports, votes from abroad and police harassment.", learn: "diasporavote",
    opts: [{ id: "listen", l: "Go, listen and answer every question", fx: { diaspora: 8 } }, { id: "deputy", l: "Send your deputy", fx: { diaspora: -4 } }] },
  { id: "gala", t: "Independence Day reception", bg: "embassy-office", d: "The host's ministers, the diaspora and the business community, all in one room.", learn: "credence",
    opts: [{ id: "big", l: "A grand reception for everyone", fx: { host: 5, diaspora: 4, abuja: 2 } }, { id: "small", l: "A modest one for officials", fx: { host: 2, diaspora: -2 } }] },
  { id: "investor", t: "A host company wants to build a factory in Nigeria", bg: "foreign-ministry-meeting", who: "host-minister", d: "A fertiliser maker is ready to invest $300 million, if someone in Abuja will answer their letters.", learn: "trade",
    opts: [{ id: "abuja", l: "Take them to Abuja yourself and open doors", fx: { trade: 2, abuja: 3, host: 2 } }, { id: "honest", l: "Warn them honestly about the red tape", fx: { trade: 1, host: 4 } }] },
  { id: "match", t: "The Super Eagles are playing here", bg: "embassy-exterior", d: "Three thousand fans want visas for the qualifier, and the host police are nervous about crowds.", learn: "visa",
    opts: [{ id: "group", l: "Negotiate group visas and a fan zone", fx: { diaspora: 6, host: 3 } }, { id: "warn", l: "Warn fans not to come without papers", fx: { diaspora: -3, host: 2 } }] },
];

/* This half-year: a cable, a case, and something from the host or the community. */
export const ambAgenda = (seed, n, S) => {
  const r = seeded(seed, "amb", n), seen = S.seen || [];
  const pick = (list) => { const c = list.filter(x => !seen.includes(x.id)); return c.length ? c[Math.floor(r() * c.length)] : null; };
  return [["cable", CABLES], ["case", CASES], ["host", HOST_ITEMS]].map(([k, list]) => { const x = pick(list); return x && { k, id: x.id }; }).filter(Boolean).concat(arcItems(S, n, "amb"));
};

export const applyAmb = (S, fx = {}) => ({ ...S,
  abuja: Math.round(cl(S.abuja + (fx.abuja || 0))), host: Math.round(cl(S.host + (fx.host || 0))), diaspora: Math.round(cl(S.diaspora + (fx.diaspora || 0))),
  trade: (S.trade || 0) + (fx.trade || 0), cor: Math.round(cl1(S.cor + (fx.cor || 0)) * 100) / 100 });
export const ambChoice = (o, r) => { const bad = o.risk ? r() < o.risk : false; const fx = { ...o.fx }; if (bad) { fx.abuja = (fx.abuja || 0) - 6; fx.host = (fx.host || 0) - 4; } return { fx, bad }; };

/* Between halves: new arrivals with new troubles; Abuja forgets you. */
export const AMB_DRIFT = { diaspora: -6, abuja: -4, host: -2 };
export const ambThreats = (S, r) => {
  if (S.abuja < 15 && r() < .5) return { kind: "recalled" };
  if (S.host < 12 && r() < .5) return { kind: "expelled" };
  return null;
};
export const ambScore = (S) => Math.round(S.diaspora * .35 + S.abuja * .2 + S.host * .2 + Math.min(100, (S.trade || 0) * 15) * .15 + (1 - S.cor) * 100 * .1);
export const ambGrade = (score) => score >= 76 ? "A" : score >= 64 ? "B" : score >= 52 ? "C" : score >= 40 ? "D" : "F";
export const ambEnding = (S) => { const sc = ambScore(S); return sc >= 70 && S.abuja >= 45 ? "promoted" : "completed"; };

/* How diplomacy really works. */
export const AMB_LEARN = {
  appoint: "Section 171: ambassadors are appointed by the President, and the Senate must confirm them before they go.",
  credence: "An ambassador starts work by presenting a 'letter of credence' from the President to the host country's head of state.",
  vienna: "The Vienna Convention on Diplomatic Relations (1961) protects embassies and diplomats. A host can expel any diplomat by declaring them 'persona non grata', without giving a reason.",
  consular: "Under the Vienna Convention on Consular Relations (1963), an arrested foreigner can ask for their embassy to be told without delay, and consuls have the right to visit them.",
  passport: "Nigerian passports are issued by the Nigeria Immigration Service. Abroad, embassies and high commissions take the applications and capture biometrics.",
  evac: "Nigeria has flown its citizens home from crises abroad many times, on special flights paid for by the government and sometimes by private airlines and businessmen.",
  nidcom: "The Nigerians in Diaspora Commission (NiDCOM), set up in 2019, works with embassies on the welfare of Nigerians abroad.",
  remit: "Nigerians abroad send home around $20 billion a year, more than the country receives in foreign investment.",
  mfa: "The Ministry of Foreign Affairs instructs embassies by 'cable'. An ambassador serves at the President's pleasure and can be recalled at any time.",
  trade: "Crude oil still earns most of Nigeria's export income. Non-oil exports such as cocoa, sesame, cashew and fashion are a small but growing share.",
  un: "Countries trade votes for seats on UN councils and committees, and embassies spend months lobbying host governments for them.",
  visa: "Visa rules usually follow reciprocity: when one country tightens visas for another's citizens, the other often does the same.",
  deathrow: "Some countries execute foreigners convicted of drug trafficking. Nigerian missions plead for clemency but cannot overturn a foreign court.",
  diasporavote: "Nigerians abroad cannot vote in Nigerian elections from where they live. Allowing it needs changes to the Constitution and the Electoral Act.",
};

// The headscratchers' notebook pages: the lesson, and where it really happened.
Object.assign(AMB_LEARN, arcNotes("amb"));
