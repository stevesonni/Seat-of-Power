/* Replay variety (player feedback, November 2026: "It's getting repetitive when you
   restart... make it less predictable, especially for those who've played multiple times").

   1. Card memory: cards seen in earlier runs are preferred last, never banned. The order
      is: consequences of your choices (callers keep those out of the pool), cards that fit
      the situation (callers filter first), cards you have not seen, then familiar ones.
   2. Personalities: the godfather, the Speaker and the party chairman are each one of a
      few kinds, rolled per run. Each kind has one priority, one red line, one way of
      reacting when crossed and a memory of what you promised. It shows in what they ask
      for and how they say it; the game never labels them.
   3. Starting situations: each new governorship opens with one of three conditions, on a
      front page, that change the first decisions (not the paid scenarios). */
import { seeded } from "./rng.js";

// ── 1. Card memory ──
export const SEEN_KEY = "sop_seen_cards";
/* pool: items with ids; seen: { id: timesSeen }. Unseen first; then the least seen. */
export const preferUnseen = (pool = [], seen = {}, idOf = (x) => x.id) => {
  if (!pool.length) return pool;
  const fresh = pool.filter(x => !seen[idOf(x)]);
  if (fresh.length) return fresh;
  const least = Math.min(...pool.map(x => seen[idOf(x)] || 0));
  return pool.filter(x => (seen[idOf(x)] || 0) === least);
};
export const markSeen = (seen = {}, ids = []) => { const out = { ...seen }; ids.forEach(id => { out[id] = (out[id] || 0) + 1; }); return out; };

// ── 2. Personalities ──
export const PERSONAS = {
  gf: {
    greedy: { priority: "money", redLine: "being cut out of contracts", prefer: ["gf_money", "gf_contract", "gf_revenue", "gf_land"], rejectMul: 1, skip: 0,
      tells: ["My people have been patient. Patience has a price.", "Let us talk about what is fair. I invested in you.", "Business is business, my son."] },
    power: { priority: "control", redLine: "being shut out of appointments", prefer: ["gf_appointment", "gf_assembly"], rejectMul: 1.2, skip: 0,
      tells: ["I do not need your money. I need my people where they can be useful.", "Every seat you fill is a seat I helped you win.", "A governor alone is a governor in trouble."] },
    vindictive: { priority: "respect", redLine: "being embarrassed in public", prefer: [], rejectMul: 1.8, skip: 0,
      tells: ["I have not forgotten who stood by me, or who did not.", "People who forget their friends make new enemies.", "I hear things. I hear everything."] },
    patron: { priority: "loyalty in public", redLine: "you standing with his enemies", prefer: ["gf_assembly", "gf_appointment"], rejectMul: .6, skip: .5,
      tells: ["I ask for little. Do not make me ask twice.", "Stand with me in public, and I will stand with you in private.", "We are family. Families talk."] },
  },
  speaker: {
    fixer: { priority: "projects for members", redLine: "a bill sent without warning", dealMul: .8, tells: ["Everything can be arranged, Your Excellency.", "Give me the projects and I will give you the votes."] },
    ambitious: { priority: "his own future", redLine: "being passed over for the next ticket", dealMul: 1.2, tells: ["The House remembers who respects it.", "Some of us have ambitions too, Your Excellency."] },
    principled: { priority: "the rules", redLine: "spending without appropriation", dealMul: 1.5, tells: ["Bring it properly and it will pass.", "The House is not for sale, whatever you have heard."] },
  },
  chair: {
    mercenary: { priority: "the party's financiers", redLine: "no contracts for the party's people", tells: ["The party has bills to pay, Your Excellency.", "Our financiers want to see something."] },
    reformer: { priority: "open primaries", redLine: "candidates imposed from above", tells: ["Let the members choose. That is how we keep the party.", "The young people are leaving us. Give them a reason to stay."] },
    gfman: { priority: "the godfather's wishes", redLine: "crossing the godfather", tells: ["Baba asked me to pass a message.", "You know who I answer to. So do you."] },
  },
};
export const rollPersonas = (seed, { veteran = false } = {}) => {
  const r = seeded(seed, "personas"), pickOf = (o, omit = []) => { const ks = Object.keys(o).filter(k => !omit.includes(k)); return ks[Math.floor(r() * ks.length)]; };
  return { gf: pickOf(PERSONAS.gf, veteran ? ["patron"] : []), speaker: pickOf(PERSONAS.speaker), chair: pickOf(PERSONAS.chair) };
};
export const personaTell = (role, kind, n = 0) => { const P = (PERSONAS[role] || {})[kind]; return P ? P.tells[n % P.tells.length] : ""; };
/* The godfather's next demand, by what he cares about. pool: unseen demands. */
export const gfPreferred = (pool = [], kind) => { const P = PERSONAS.gf[kind]; if (!P || !P.prefer.length) return pool; const p = pool.filter(d => P.prefer.includes(d.id)); return p.length ? p : pool; };
/* The party chairman's yearly ask, by kind. */
export const CHAIR_ASKS = {
  mercenary: { t: "The party's financiers want their share", d: "The party chairman says the people who paid for the campaign want contracts, \"nothing big, just the drainage jobs\".",
    opts: [{ id: "give", l: "Give the party's people the drainage contracts", fx: { pStab: 6, cor: .02, app: -1 } }, { id: "tender", l: "Open tender: they can bid like anyone else", fx: { pStab: -5, cor: -.01 } }] },
  reformer: { t: "The party chairman wants open primaries", d: "The chairman wants this year's Assembly primaries open to every member, not decided at Government House.",
    opts: [{ id: "open", l: "Agree: open primaries", fx: { pStab: -3, app: 3 }, house: -1 }, { id: "list", l: "Insist on your list of candidates", fx: { pStab: 4, app: -2 }, house: 1 }] },
  gfman: { t: "A message from the godfather, through the chairman", d: "The party chairman brings the godfather's list of names for local government caretaker committees.",
    opts: [{ id: "take", l: "Take the list", fx: { pStab: 5, cor: .02 }, gf: 8 }, { id: "own", l: "Name your own people", fx: { pStab: -4 }, gf: -10 }] },
};

// ── 3. Starting situations ──
export const SITUATIONS = {
  split: { head: "HOUSE SPLIT DOWN THE MIDDLE", sub: "Neither side has a majority. The new governor's first budget will need friends across the aisle.",
    note: "The House is split: half the members are with you. Your first budget needs votes from the other side.", house: .5 },
  arrears: { head: "WORKERS OWED TWO MONTHS AS NEW GOVERNOR SWORN IN", sub: "The last government left salary arrears and an empty account. The unions want a date.",
    note: "You inherit two months of unpaid salaries. The unions are counting.", arrears: 2 },
  windfall: { head: "OIL WINDFALL: STATES' SHARE JUMPS", sub: "A good year for FAAC, but economists warn the price will not hold.",
    note: "Oil is high: an extra ₦{cash}B is in the bank from the federation account. Economists say it will not last.", cashMul: .2 },
};
export const situationFor = (seed) => { const ks = Object.keys(SITUATIONS); return ks[Math.floor(seeded(seed, "situation")() * ks.length)]; };

// ── Once a run: something nobody planned for ──
export const WILDCARDS = {
  illness: { t: "You are flown abroad for treatment", art: ["governor-office", null], stakes: "The constitution says how a governor hands over. Not everyone around you wants it followed.",
    d: "A sudden illness. The doctors want you in a London hospital for at least three weeks. Your Chief of Staff suggests nobody needs to know.",
    opts: [{ id: "letter", l: "Write to the House: the deputy acts", note: "By the book. Your deputy gets a taste of the job.", fx: { app: 1, pStab: -1 }, out: "Your letter is read on the floor of the House. Your deputy chairs the Executive Council for three weeks." },
      { id: "hide", l: "Keep it quiet and govern from the hospital", note: "If it leaks, they will call it a cabal.", fx: {}, later: { fx: { app: -5 }, desc: "The papers found out you governed from a hospital bed abroad. They call your aides a cabal." }, out: "Your aides sign letters in your name. Rumours start within a week." },
      { id: "home", l: "Discharge yourself and fly home", note: "Strong for the cameras. Weak for months.", fx: { app: 2, hp: -.01 }, out: "You walk off the plane, slowly. The photos look good. The doctors are furious." }] },
  speaker: { t: "A court sacks your Speaker", art: ["courtroom", "judge"], stakes: "Whoever wins the new vote controls the floor.",
    d: "The High Court rules that the Speaker's election broke the House rules. There must be a fresh vote within two weeks.",
    opts: [{ id: "back", l: "Back the old Speaker again", note: "Loyalty, at a price.", fx: { pStab: 1 }, house: 1, out: "The old Speaker wins again, by three votes. They owe you more than before." },
      { id: "new", l: "Back a new face", note: "A fresh start with the members.", fx: { pStab: -2 }, house: 2, out: "A new Speaker. The old one sits at the back, taking notes." },
      { id: "out", l: "Stay out of it", note: "Let the House sort itself out.", fx: {}, house: -1, out: "The House sorts itself out, slowly and loudly." }] },
  viral: { t: "Your commissioner on video: “Go and die”", art: ["governor-office", "commissioner-male-agbada-worried"], stakes: "The video has two million views and counting.",
    d: "{m} was filmed telling flood victims to “go and die”. It is the most-watched video in the state.",
    opts: [{ id: "sack", l: "Sack the commissioner today", note: "Quick. The party says you threw a loyalist away.", fx: { app: 3, pStab: -2 }, out: "Sacked before the evening news. The victims' families say it is a start." },
      { id: "sorry", l: "Make them apologise on camera", note: "Half a fix.", fx: { app: -1 }, out: "The apology is read from a card. People are not impressed." },
      { id: "defend", l: "Defend them: the clip was edited", note: "Nobody believes it.", fx: { app: -4, pStab: 1 }, out: "The full clip comes out. It is worse." }] },
  heirs: { t: "The late godfather's sons go to war", art: ["veranda-night", "godfather-angry"], stakes: "His network is up for grabs.",
    d: "Your late godfather's two sons both claim his network: the ward leaders, the money and the members of the House who answered to him.",
    opts: [{ id: "elder", l: "Back the elder son", note: "Order, and a new godfather.", fx: { pStab: 3 }, house: 1, out: "The elder son takes the network, and sends his thanks, and his first request." },
      { id: "split", l: "Take his ward leaders for yourself", note: "Bold, and both sons will hate you.", fx: { pStab: -2, app: 1 }, house: 2, out: "Half the ward leaders come over to you. Both sons go to the opposition." },
      { id: "stay", l: "Stay out of it", note: "Let them tear it apart.", fx: {}, out: "The network splits three ways. None of the pieces is a threat for now." }] },
};
export const wildcardFor = (seed, turn, { gfDead = false, speaker = false, ministries = [] } = {}) => {
  const ks = ["illness", "viral"].concat(speaker ? ["speaker"] : [], gfDead ? ["heirs"] : []), k = ks[Math.floor(seeded(seed, "wild", turn)() * ks.length)];
  const W = WILDCARDS[k], m = ministries[0];
  if (k === "viral" && !m) return null;
  return { id: k, ...W, d: W.d.replace("{m}", m ? m.minister + ", Commissioner for " + m.name.replace(/^Ministry of /, "") : "") };
};
