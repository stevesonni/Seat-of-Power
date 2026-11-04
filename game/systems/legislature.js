/* The living House (rules only, no React). Player feedback, November 2026: "expand the
   senate and house of assembly challenges... more interactions with godfathers, rivals,
   ministers/commissioners, party members and councils".

   Six named members of the House, each with an interest (not a price: only some can be
   bought), in three blocs: your party, the opposition and the swing members. The year
   brings one connected storyline before anything else:
     year 1  the Speaker race: back a candidate, or stay out
     each    the budget battle: an opposition member offers votes for a promise
     next    the promise comes due: your party wants its own projects instead
     each    one member comes with their interest
     year 2+ a committee hearing summons a commissioner, and you choose who answers
     year 2+ a cabinet meeting: two commissioners argue over how to deliver your flagship
   All people are fictional. Money in billions of naira. */
import { seeded } from "./rng.js";

export const INTERESTS = ["constituency", "policy", "committee", "discipline", "ambition", "money"];
export const BLOCS = ["ours", "ours", "opp", "opp", "swing", "swing"];
/* names: six fictional names made by the game. */
export const makeMembers = (seed, names = []) => {
  const r = seeded(seed, "members"), ints = INTERESTS.slice().sort(() => r() - .5);
  return BLOCS.map((bloc, i) => ({ id: "m" + (i + 1), name: "Hon. " + (names[i] || "Member " + (i + 1)), bloc, interest: bloc === "opp" && i === 2 ? "policy" : ints[i] === "policy" && bloc !== "opp" ? "constituency" : ints[i], rel: bloc === "ours" ? 60 : bloc === "opp" ? 35 : 50 }));
};
export const memberOf = (L, id) => ((L && L.members) || []).find(m => m.id === id) || null;
export const moveMember = (L, id, d) => ({ ...L, members: L.members.map(m => m.id === id ? { ...m, rel: Math.max(0, Math.min(100, m.rel + d)) } : m) });

// ── The Speaker race (year 1) ──
export const speakerCandidates = (L) => { const ours = L.members.find(m => m.bloc === "ours"), swing = L.members.find(m => m.bloc === "swing"); return [ours, swing].filter(Boolean); };
/* backed: a candidate's id, or null to stay out. ratio: your share of the House. */
export const speakerRace = (seed, L, backed, ratio = .5) => {
  const [a, b] = speakerCandidates(L), r = seeded(seed, "speaker", backed || "none")();
  let pa = .35 + ratio * .4; if (backed === a.id) pa += .15; if (backed === b.id) pa -= .15;
  const win = r < pa ? a : b, kind = win.bloc === "ours" ? (win.interest === "ambition" ? "ambitious" : "fixer") : (win.interest === "money" ? "fixer" : "principled");
  return { winner: win.id, kind, owes: backed === win.id, crossed: !!backed && backed !== win.id };
};

// ── The budget battle and the promise that comes due ──
export const FORMULA = "a published allocation formula: every district's share of capital projects set in law";
export const budgetOffer = (L) => L.members.find(m => m.bloc === "opp" && m.interest === "policy") || L.members.find(m => m.bloc === "opp");

// ── One member, one interest, each year ──
export const MEMBER_ASKS = {
  constituency: { t: "{m} wants a road in their constituency", d: "{m} has been asking for the same 6 km road for three years. They will vote with you if it starts this year.",
    yes: { l: "Start the road", cost: .3, rel: 20, house: 1 }, no: { l: "Not this year", rel: -15 } },
  committee: { t: "{m} wants to chair the Finance committee", d: "{m} wants the Finance committee chair. Older members of your party expected it.",
    yes: { l: "Back {m} for the chair", fx: { pStab: -2 }, rel: 25, house: 1 }, no: { l: "Leave it to the House", rel: -10 } },
  discipline: { t: "{m}, your whip, wants a defector punished", d: "A member of your party voted with the opposition. {m}, the whip, wants his constituency projects withdrawn as a warning.",
    yes: { l: "Withdraw the defector's projects", fx: { pStab: 3, app: -1 }, rel: 15, house: 1 }, no: { l: "Let it go", fx: { pStab: -2 }, rel: -15 } },
  ambition: { t: "{m} wants your blessing for the Senate", d: "{m} wants you to endorse them for next year's Senate ticket. Two other loyalists want it too.",
    yes: { l: "Endorse {m}", fx: { pStab: -3 }, rel: 30, house: 1 }, no: { l: "Stay neutral", rel: -10 } },
  money: { t: "{m} says members expect something before the vote", d: "{m} says the members expect “the usual” before the next vote. An envelope each, quietly.",
    yes: { l: "Pay it quietly", cost: .2, fx: { cor: .02 }, rel: 15, house: 2 }, no: { l: "No envelopes", fx: { app: 1 }, rel: -20, house: -1 } },
  policy: { t: "{m} wants your support for their bill", d: "{m} has a bill for free maternal care. It is popular, and badly costed.",
    yes: { l: "Support it, and fix the costing", cost: .2, fx: { app: 2 }, rel: 25, house: 1 }, no: { l: "Oppose it", fx: { app: -1 }, rel: -15 } },
};
export const memberAskFor = (seed, turn, L, done = []) => { const ms = L.members.filter(m => !done.includes(m.id)); if (!ms.length) return null; const m = ms[Math.floor(seeded(seed, "mask", turn)() * ms.length)]; return { m, A: MEMBER_ASKS[m.interest] }; };
export const fillM = (t, m) => String(t || "").replace(/\{m\}/g, m ? m.name : "the member");

// ── The hearing ──
/* Who answers the Public Accounts Committee: the commissioner, the permanent secretary, or nobody.
   kind: the commissioner's integrity kind if known (SYS.archetypeOf), perf: 0–100. */
export const hearing = (seed, turn, who, { perf = 50, kind = null } = {}) => {
  const r = seeded(seed, "hearing", turn, who)();
  if (who === "nobody") return { out: "snub", fx: { app: -1 }, house: -1, line: "The committee reads out an empty chair. The papers print a photo of it." };
  if (who === "perm") return { out: "safe", fx: {}, house: 0, line: "The permanent secretary reads the figures slowly and answers nothing. Nobody learns anything, and nobody is hurt." };
  const shaky = kind === "hustler" ? .7 : kind === "tech" ? .1 : .5 - (perf - 50) / 100;
  return r < shaky ? { out: "bad", fx: { app: -3, cor: .01 }, house: -1, line: "The commissioner cannot explain ₦400M of payments. The clip is everywhere by evening." }
    : { out: "good", fx: { app: 2 }, house: 1, line: "The commissioner walks the committee through every payment. Even the opposition is impressed." };
};

// ── The cabinet meeting: two commissioners, one flagship ──
export const DEBATES = {
  health: { a: [/health/i, "Recruit and pay 600 nurses for the clinics we have"], b: [/works|infra/i, "Build a new specialist hospital in the capital"], fxA: { hp: .02, app: 1 }, fxB: { infra: .02, app: 2 }, costA: .6, costB: .9 },
  education: { a: [/educ/i, "Train and pay the teachers already in the classrooms"], b: [/works|infra/i, "Build 40 new classroom blocks"], fxA: { lit: .02 }, fxB: { infra: .01, app: 2 }, costA: .5, costB: .8 },
  infrastructure: { a: [/works|infra/i, "Finish the roads already started"], b: [/transport/i, "Start a new city bus route"], fxA: { infra: .02, app: 1 }, fxB: { app: 2 }, costA: .7, costB: .6 },
  security: { a: [/security|justice/i, "Pay and train the community guards we have"], b: [/works|infra|transport/i, "Buy 40 new patrol vehicles"], fxA: { sec: .02 }, fxB: { sec: .01, app: 2 }, costA: .4, costB: .7 },
  agriculture: { a: [/agric/i, "Seeds and extension workers for smallholders"], b: [/water|works/i, "A big irrigation dam"], fxA: { agr: .02, app: 1 }, fxB: { agr: .01, infra: .01, app: 1 }, costA: .4, costB: 1 },
  anticorruption: { a: [/financ|budget/i, "Publish every contract online this year"], b: [/justice/i, "Prosecute last government's officials first"], fxA: { cor: -.02 }, fxB: { app: 3, pStab: -2 }, costA: .2, costB: .3 },
  youth: { a: [/youth|sports|labour/i, "Apprenticeships with local businesses"], b: [/digital|commerce/i, "A big tech-skills centre"], fxA: { app: 1 }, fxB: { app: 2 }, costA: .4, costB: .7 },
  women: { a: [/women|humanitarian/i, "Cash for girls' school attendance"], b: [/educ/i, "Girls' boarding schools"], fxA: { lit: .01, app: 1 }, fxB: { lit: .01, app: 2 }, costA: .4, costB: .8 },
  technology: { a: [/digital|science/i, "Broadband for the schools we have"], b: [/commerce|budget/i, "A tech park for start-ups"], fxA: { lit: .01 }, fxB: { app: 2 }, costA: .4, costB: .8 },
  housing: { a: [/housing/i, "Site-and-services plots people build on themselves"], b: [/works|lands/i, "Finished estates with our name on the gate"], fxA: { app: 1 }, fxB: { infra: .01, app: 2 }, costA: .4, costB: 1 },
};
/* The two sides: { a: { ministry, plan, fx, cost }, b: {...} } from the cabinet (ministries with ministers). */
export const debateFor = (agenda, ministries = []) => {
  const D = DEBATES[agenda]; if (!D) return null; const ms = ministries.filter(m => m.minister);
  const find = (rx, not) => ms.find(m => rx.test(m.name) && m !== not) || ms.find(m => m !== not);
  const ma = find(D.a[0]), mb = find(D.b[0], ma); if (!ma || !mb) return null;
  return { a: { ministry: ma, plan: D.a[1], fx: D.fxA, cost: D.costA }, b: { ministry: mb, plan: D.b[1], fx: D.fxB, cost: D.costB } };
};
