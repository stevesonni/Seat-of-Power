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
  // Hostile: the winner is not your party's man, and you did not back him (owner, 23 Nov 2026).
  return { winner: win.id, kind, owes: backed === win.id, crossed: !!backed && backed !== win.id, hostile: win.bloc !== "ours" && backed !== win.id };
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
  // projB: the build side is a real project (owner, 22 Nov 2026: "the 40 classroom blocks IS a project; why doesn't it go
  // through the normal project process"). Choosing it opens the project plan instead of spending at once.
  health: { a: [/health/i, "Recruit and pay 600 nurses for the clinics we have"], b: [/works|infra/i, "Build a new specialist hospital in the capital"], fxA: { hp: .02, app: 1 }, fxB: { infra: .02, app: 2 }, costA: .6, costB: .9, projB: { type: "hospital", qty: 100, title: "A new specialist hospital in the capital" } },
  education: { a: [/educ/i, "Train and pay the teachers already in the classrooms"], b: [/works|infra/i, "Build 40 new classroom blocks"], fxA: { lit: .02 }, fxB: { infra: .01, app: 2 }, costA: .5, costB: .8, projB: { type: "school", qty: 40, title: "40 new classroom blocks" } },
  infrastructure: { a: [/works|infra/i, "Finish the roads already started"], b: [/transport/i, "Start a new city bus route"], fxA: { infra: .02, app: 1 }, fxB: { app: 2 }, costA: .7, costB: .6 },
  security: { a: [/security|justice/i, "Pay and train the community guards we have"], b: [/security|justice|internal/i, "Buy 40 new patrol vehicles"], fxA: { sec: .02 }, fxB: { sec: .01, app: 2 }, costA: .4, costB: .7, projB: { type: "vehicles", qty: 40, title: "40 new patrol vehicles" } },
  agriculture: { a: [/agric/i, "Seeds and extension workers for smallholders"], b: [/water|works/i, "A big irrigation dam"], fxA: { agr: .02, app: 1 }, fxB: { agr: .01, infra: .01, app: 1 }, costA: .4, costB: 1, projB: { type: "dam", qty: 1, title: "An irrigation dam" } },
  anticorruption: { a: [/financ|budget/i, "Publish every contract online this year"], b: [/justice/i, "Prosecute last government's officials first"], fxA: { cor: -.02 }, fxB: { app: 3, pStab: -2 }, costA: .2, costB: .3 },
  youth: { a: [/youth|sports|labour/i, "Apprenticeships with local businesses"], b: [/digital|commerce/i, "A big tech-skills centre"], fxA: { app: 1 }, fxB: { app: 2 }, costA: .4, costB: .7 },
  women: { a: [/women|humanitarian/i, "Cash for girls' school attendance"], b: [/educ/i, "Girls' boarding schools"], fxA: { lit: .01, app: 1 }, fxB: { lit: .01, app: 2 }, costA: .4, costB: .8, projB: { type: "secondary", qty: 20, title: "Girls' boarding schools" } },
  technology: { a: [/digital|science/i, "Broadband for the schools we have"], b: [/commerce|budget/i, "A tech park for start-ups"], fxA: { lit: .01 }, fxB: { app: 2 }, costA: .4, costB: .8, projB: { type: "industrial", qty: 15, title: "A tech park for start-ups" } },
  housing: { a: [/housing/i, "Site-and-services plots people build on themselves"], b: [/works|lands/i, "Finished estates with our name on the gate"], fxA: { app: 1 }, fxB: { infra: .01, app: 2 }, costA: .4, costB: 1, projB: { type: "housing", qty: 200, title: "A finished housing estate" } },
};
/* The two sides: { a: { ministry, plan, fx, cost }, b: {...} } from the cabinet (ministries with ministers). */
export const debateFor = (agenda, ministries = []) => {
  const D = DEBATES[agenda]; if (!D) return null; const ms = ministries.filter(m => m.minister);
  const find = (rx, not) => ms.find(m => rx.test(m.name) && m !== not) || ms.find(m => m !== not);
  const ma = find(D.a[0]), mb = find(D.b[0], ma); if (!ma || !mb) return null;
  return { a: { ministry: ma, plan: D.a[1], fx: D.fxA, cost: D.costA }, b: { ministry: mb, plan: D.b[1], fx: D.fxB, cost: D.costB, proj: D.projB || null } };
};

/* A hostile Speaker (owner, 23 Nov 2026: "if my candidate loses, I lose my majority in the House, so I have to deal
   with the Speaker to get my bills and programmes through. The Speaker has his own programmes that he wants done").
   hostile: your candidate lost, or you stayed out and the other side won. Each Speaker wants two things of his own;
   every year the price comes due: pay it and the House works with you that year; refuse and your bills stay off the
   order paper, new programmes get no money, and you have no majority for the budget. */
export const hostileSpeaker = (R) => !!(R && R.hostile);
export const SPEAKER_ASKS = [
  { id: "hospital", l: "A specialist hospital in the Speaker's home town", costB: .9, fx: { app: 1 }, type: "hospital" },
  { id: "assembly", l: "A new Assembly complex, with offices for every member", costB: .7, fx: { app: -1, cor: .01 } },
  { id: "roads", l: "Township roads in the Speaker's constituency", costB: .6, fx: { app: 1 }, type: "road" },
  { id: "autonomy", l: "Financial autonomy for the House: its budget paid straight to it, first, every month", costB: .4, fx: { pStab: -2 } },
  { id: "empower", l: "An empowerment scheme run through members' offices", costB: .5, fx: { cor: .02 } },
  { id: "university", l: "A state university campus in the Speaker's district", costB: 1.2, fx: { app: 1 }, type: "university" },
];
/* A Speaker's building project goes through the projects screen like any other, but he names the contractor (owner,
   23 Nov 2026: "we'll use the Speaker's pre-approved contractor, which increases corruption… You can refuse, but if
   you refuse, your bill will stay blocked"). His firm is in the contractor roster (projects.js, id "gavel") and never
   bids in an open tender. */
export const SPEAKER_FIRM = "gavel", SPEAKER_FIRM_COR = .03;
// Older saves stored the asks without a type: find it by id.
export const speakerAskType = (a) => (a && (a.type || (SPEAKER_ASKS.find(x => x.id === a.id) || {}).type)) || null;
export const speakerAsks = (seed, nat) => { const r = seeded(seed, "speaker_asks"), a = SPEAKER_ASKS.slice().sort(() => r() - .5).slice(0, 2);
  return nat ? a.map(x => ({ ...x, costB: Math.round(x.costB * 10 * 10) / 10, l: x.l.replace("The House", "the National Assembly").replace("House", "National Assembly") })) : a; };

/* ── The House remembers (owner, 23 Nov 2026) ─────────────────────────────────────────────
   "Even when you're re-elected, the Speaker will also be re-elected… the way you managed the House in your first term
   will determine the kind of Speaker they elect… the House can throne a friendly Speaker in your second or third year
   and elect a new one." Answers: a hostile Speaker can block you AND impeach you at the slightest approval dip; a
   Speaker is removed at most once a term; two rival Speakers (a split House) is in. */

// The House's record of you: each way you dealt with it, and what it is worth to the members.
export const HOUSE_NOTES = {
  kept: [2, "kept your promise to the House"], broke: [-3, "broke your promise to the House"],
  paid: [1, "met the Speaker's price"], deal: [1, "shared committee chairs and contracts"], refused: [-2, "refused the Speaker's price"],
  projects: [1, "gave members constituency projects"], shared: [1, "shared appointments with the party barons"], overheads: [-2, "went over the members' heads to the people"],
  firm: [-1, "made them take the Speaker's contractor"], firmNo: [-1, "refused the Speaker's contractor"], late: [-2, "paid the Assembly late"], funded: [1, "paid the Assembly on time"],
};
export const houseNote = (rec = {}, k) => { const N = HOUSE_NOTES[k]; if (!N) return rec; return { score: (rec.score || 0) + N[0], n: { ...(rec.n || {}), [k]: ((rec.n || {})[k] || 0) + 1 } }; };

/* Who the new House puts up for Speaker after the election, from that record. gfFreed: you broke with your godfather. */
export const SPEAKER_KINDS = {
  loyalist: { nm: "your loyalist", bloc: "ours", line: "He has stood with you for four years. The House trusts you, so it trusts him." },
  dealer: { nm: "a dealer", bloc: "swing", line: "He knows you pay when you are pushed. He will push." },
  reformer: { nm: "a reformer", bloc: "swing", line: "You went over the members' heads too often. He promises hearings on every naira you spend." },
  avenger: { nm: "an avenger", bloc: "opp", line: "The members you crossed have found their man. He talks about impeachment in the canteen." },
  godfather: { nm: "your old godfather's man", bloc: "ours", line: "Your old godfather never forgave the break. His man answers to him, not to you." },
};
export const houseKind = (rec = {}, { gfFreed = false } = {}) => {
  const sc = rec.score || 0, n = rec.n || {};
  if (gfFreed) return "godfather";
  if (sc <= -4) return "avenger";
  if ((n.overheads || 0) >= 2 && sc < 3) return "reformer";
  if (sc >= 3) return "loyalist";
  return "dealer";
};
/* How many members are with you in the new House: your share of the vote carries them (margin in points; a win in
   court instead of at the polls thins them out), and the record decides how the rest lean. */
export const newHouseLoyal = (seats, { margin = 5, wonInCourt = false, score = 0 } = {}) => {
  const share = .5 + Math.max(-.12, Math.min(.18, margin / 100)) - (wonInCourt ? .08 : 0) + Math.max(-.08, Math.min(.08, score / 50));
  return Math.max(Math.round(seats * .3), Math.min(seats - 2, Math.round(seats * share)));
};
/* The second-term race: the old Speaker (if he was friendly and is still there) against the House's choice.
   backed: "old" | "new" | null. Returns { winner: "old"|"new", hostile, kind }. */
export const speakerRace2 = (seed, { kind, oldFriendly, backed, ratio = .5 }) => {
  const r = seeded(seed, "speaker2", backed || "none")(), K = SPEAKER_KINDS[kind] || SPEAKER_KINDS.dealer;
  // How strong the House's own choice is: an avenger or the godfather's man has the members; your loyalist is yours anyway.
  let pNew = kind === "loyalist" ? .7 : kind === "avenger" ? .55 + (1 - ratio) * .4 : kind === "godfather" ? .6 : .45 + (1 - ratio) * .2;
  if (!oldFriendly) pNew = Math.max(pNew, .85);
  if (backed === "old") pNew -= .2 * ratio + .05; if (backed === "new") pNew += .1;
  const win = r < Math.max(.05, Math.min(.95, pNew)) ? "new" : "old";
  const hostile = win === "new" ? kind !== "loyalist" && !(kind === "dealer" && backed === "new") : false;
  return { winner: win, hostile, kind: win === "new" ? kind : "incumbent", owes: !!backed && backed === win, crossed: !!backed && backed !== win, line: K.line };
};

/* The impeachment threat of a hostile Speaker: at the slightest dip in approval since last year, unless you met his
   price this year. */
export const speakerImpeaches = ({ hostile, dealThisYear, app, appMark }) => !!hostile && !dealThisYear && appMark != null && app < appMark && app < 62;

/* A plot against a friendly Speaker (years 2 and 3 of a term, at most once a term). Returns the reasons the members
   give and the odds it starts. ctx: { arrears, app, cor, gfFreed, kind, termYear, sameZone, oppState, rubber } */
export const PLOT_WHY = {
  money: "Members' allowances and constituency money are months late, and they blame the Speaker for not fighting for them.",
  rubber: "He passed everything you sent, even the unpopular bills. Members fear their voters, and call him the governor's errand boy.",
  gf: "Your old godfather is paying members to remove your Speaker and put in his own.",
  scandal: "A contract scandal around the Speaker is trending. Members want to be rid of it.",
  succession: "The men who want your job need their own Speaker before the primaries.",
  zone: "You and the Speaker come from the same senatorial district. The other two districts want their turn.",
  ambition: "The Speaker has grown too big: he talks like a governor-in-waiting, and his own members want him cut down.",
  abuja: "The President's party wants this House, and it has money for members who switch.",
};
export const speakerPlot = (seed, turn, ctx = {}) => {
  const why = [];
  if ((ctx.arrears || 0) >= 2) why.push("money");
  if (ctx.rubber && (ctx.app || 50) < 48) why.push("rubber");
  if (ctx.gfFreed) why.push("gf");
  if ((ctx.cor || 0) > .45) why.push("scandal");
  if (ctx.termYear === 3 && ctx.term === 2) why.push("succession");
  if (ctx.sameZone) why.push("zone");
  if (ctx.kind === "ambitious") why.push("ambition");
  if (ctx.oppState) why.push("abuja");
  const p = why.length ? Math.min(.75, .2 + .15 * why.length) : 0;
  return { go: seeded(seed, "plot", turn)() < p, why, p };
};
// The ways to save him, and how likely each is to work. fg: standing with Abuja; money: whether late money is the cause.
export const PLOT_MOVES = [
  { id: "pay", l: "Pay the members: projects and envelopes", note: "It usually works. It costs money, and the papers call it what it is.", odds: .85, costPerSeat: .04, fx: { cor: .02 } },
  { id: "release", l: "Release the Assembly's money now, in full", note: "Takes away their best reason. Works if money is what this is about.", odds: .5, oddsIf: { money: .85 }, cost: .5, fx: {} },
  { id: "chairs", l: "Give the plotters' leaders committee chairs", note: "They get what they wanted from the new Speaker, without a new Speaker.", odds: .65, fx: { pStab: -2, cor: .01 } },
  { id: "abuja", l: "Ask the President and the party to step in", note: "Works if Abuja likes you.", odds: .35, oddsFg: .8, fx: {} },
  { id: "court", l: "Get a court order stopping the sitting", note: "Sometimes the court says yes. If it says no, they sit anyway, and you may end up with two Speakers.", odds: .4, fx: {}, split: .6 },
  { id: "police", l: "Have the police seal the Assembly", note: "They cannot sit if they cannot get in. The papers will show the locked gates for a week.", odds: .9, fx: { app: -4, pStab: -1 } },
  { id: "let", l: "Let him fall, and back your own man in the new race", note: "No money and no fight. Who replaces him depends on how you treated the House.", odds: 0, fx: {} },
];
export const plotOdds = (m, { why = [], fg = 50 } = {}) => m.id === "release" && why.includes("money") ? m.oddsIf.money : m.id === "abuja" && fg >= 60 ? m.oddsFg : m.odds;
/* Two Speakers: when the court ruling comes the next year. yourSide: how strong your faction is (0–1). */
export const splitRuling = (seed, turn, yourSide = .5) => seeded(seed, "split", turn)() < .35 + yourSide * .3 ? "ours" : "theirs";

/* The new House's Speaker race, as one letter (owner, 27 Nov 2026, with a rewrite: "Some members of the House feel you
   walked all over Speaker Orshi and turned them into a rubber stamp. They want that to end…"). The sitting Speaker is
   at its centre; the opening follows how the first term went with him; the rival is named with what he will do; the
   godfather, if he is behind the rival, is said once. kind: houseKind (the rival's kind); rec: the first term's record;
   old: { name, friendly } or null (no sitting Speaker); rival: his name. Returns { brief, stakes, labels }. */
export const speakerRaceLetter = ({ kind, rec = {}, old = null, rival }) => {
  const mood = houseKind(rec), O = old && old.name, sp = O ? "Speaker " + String(O).replace(/^(Rt\. )?Hon\. /, "").split(" ").pop() : null;
  const open = mood === "loyalist" ? "The House believes you kept faith with it in your first term" + (sp ? ", and with " + sp + "." : ".")
    : mood === "avenger" ? "You crossed the House too often in your first term, and the members have not forgotten."
    : old && old.friendly ? "Some members of the House feel you walked all over " + sp + " and turned them into a rubber stamp. They want that to end."
    : mood === "reformer" ? "Some members feel you went over their heads too often in your first term. They want that to end."
    : sp ? "Members say " + sp + " made you pay for every bill in your first term, and you paid." : "Members say you drove a hard bargain with the House in your first term.";
  const oldLine = O ? (old.friendly ? "Rt. Hon. " + String(O).replace(/^(Rt\. )?Hon\. /, "") + " still wants another term in the chair." : "Rt. Hon. " + String(O).replace(/^(Rt\. )?Hon\. /, "") + ", who fought you in your first term, still wants another term in the chair.") : "";
  const rivalLine = kind === "loyalist" ? "The House puts up " + rival + ", one of your own, to keep it that way."
    : kind === "avenger" ? (O ? "But the House has found a rival: " : "The House puts up ") + rival + ", who talks about impeachment in the canteen."
    : kind === "reformer" ? (O ? "But the House has found a rival: " : "The House puts up ") + rival + ", who owes you nothing and promises hearings on every naira you spend."
    : kind === "godfather" ? (O ? "But the House has found a rival: " : "The House puts up ") + rival + ", who owes you nothing and will make you fight for every bill. Your former godfather, who never forgave the break, is behind him."
    : (O ? "But the House has found a rival: " : "The House puts up ") + rival + ", who owes you nothing and will make you fight for every bill.";
  const brief = [open, oldLine, rivalLine].filter(Boolean).join(" ");
  const stakes = "A Speaker you cannot control will hold your bills until you pay his price. If your approval slips, he will move to impeach.";
  const nm = String(rival).replace(/^Hon\. /, "");
  const labels = {
    old: O ? "Back " + String(O).replace(/^(Rt\. )?Hon\. /, "") + " for another term" : null,
    rival: "Back " + nm + (kind === "godfather" ? " and make peace with your old godfather" : kind === "avenger" ? " and try to win him over" : kind === "loyalist" ? "" : kind === "reformer" || (old && old.friendly && mood !== "loyalist") ? " and give the House its voice" : " and do business with him"),
    out: "Stay out of the race",
  };
  return { brief, stakes, labels };
};
