/* Investigations and institutional memory.

   An allegation becomes a case. A case moves through stages:
     allegation → meeting → evidence → findings → decision → closed
   What the governor KNOWS is the case's grade:
     rumour · credible · documented irregularity · substantiated misconduct · unsupported
   What actually HAPPENED (case.truth) is hidden and never shown as a label:
     misconduct · negligence · supplier failure · false accusation
   Evidence is drawn from the truth, but not perfectly: reliable methods
   point the right way more often, and some finds are ambiguous. So findings
   can be wrong, and a decision made on thin evidence can come back.

   Every roll is seeded from the case id (rng.js): reloading never rerolls.
   Dismissing an official closes their personal case only once decided; the
   missing money and any unfinished work stay on the state's books. */
import { seeded, pickW } from "./rng.js";
import { fmtM } from "./money.js";

export const GRADE_NAME = {
  rumour: "Rumour", credible: "Credible allegation", documented: "Documented irregularity",
  substantiated: "Substantiated misconduct", unsupported: "Unsupported allegation",
};
export const STAGE_NAME = { allegation: "Allegation", meeting: "Met the commissioner", evidence: "Gathering evidence", findings: "Findings ready", decided: "Decided", closed: "Closed" };

// What each kind of truth leaves behind. weight > 0 points to wrongdoing,
// weight < 0 points away from it; ambiguous items have small weights.
const TRACES = {
  misconduct: [
    { id: "voucher", label: "The payment voucher carries the commissioner's own approval, against the tender rules", w: 3 },
    { id: "front", label: "The contractor's directors include a relative of someone in the ministry", w: 3 },
    { id: "nosite", label: "No site inspection report exists for the work that was paid for", w: 2 },
    { id: "split", label: "The payment was split into smaller sums, each below the approval limit", w: 2 },
  ],
  negligence: [
    { id: "noinspect", label: "The payment was approved without anyone visiting the site", w: 1 },
    { id: "nocert", label: "The completion certificate is missing from the file", w: 1 },
    { id: "rush", label: "Year-end pressure to spend the allocation: the file was rushed through", w: 0 },
  ],
  supplier: [
    { id: "bankrupt", label: "The contractor went bankrupt weeks after the payment", w: -1 },
    { id: "claim", label: "The ministry has already filed a claim against the contractor's bond", w: -2 },
    { id: "port", label: "Equipment for the job is held at the port with unpaid duty", w: -1 },
  ],
  false: [
    { id: "onsite", label: "Inspectors find the work done; the paperwork was simply never filed", w: -3 },
    { id: "loser", label: "The complaint came from a company that lost the tender", w: -2 },
    { id: "matches", label: "The payment matches a contract delivered and signed off", w: -2 },
  ],
};
// Things any investigation turns up that prove nothing either way.
const NOISE = [
  { id: "late", label: "Several payments in the ministry that year were made late", w: 0 },
  { id: "staff", label: "The procurement officer was transferred soon after", w: 0.5 },
];

export const METHODS = {
  audit: { nm: "Internal audit", costM: 50, rel: .7, finds: 2, note: "₦50M. The ministry's own auditors: quick, not always independent." },
  agf: { nm: "The Auditor-General", costM: 0, rel: .85, finds: 2, note: "No direct cost. Independent, and the report is public: if it is bad, everyone reads it." },
  site: { nm: "Inspect the site", costM: 20, rel: .6, finds: 1, note: "₦20M. Engineers go and look at what was built." },
  efcc: { nm: "Refer to the EFCC", costM: 0, rel: .9, finds: 2, note: "Free and thorough, but out of your hands: the party hates it if it is one of yours.", party: -3 },
};

const TRUTH_W = (hon) => ({ // hon: the official's honesty 0–100 (a hidden trait)
  misconduct: Math.max(.05, (100 - hon) / 100 * .75),
  negligence: .2,
  supplier: .15,
  false: Math.max(.08, hon / 100 * .35),
});

export const openCase = ({ id, year, ministryId, ministryName, officer, hon = 50, amountM, source = "press", what }) => {
  const r = seeded("case", id, "truth");
  const truth = pickW(r, TRUTH_W(hon));
  return {
    id, year, ministryId, ministryName, officer, amountM: Math.round(amountM || 0), source,
    what: what || "Paid " + fmtM(amountM) + " for work that may never have been done",
    stage: "allegation", grade: source === "press" ? "rumour" : "credible",
    truth, evidence: [], spentM: 0, methodsUsed: [], meetings: [], decision: null, outstandingM: Math.round(amountM || 0), recoveredM: 0,
    history: [{ year, text: "Allegation: " + (what || "a payment for work that may never have been done") + " (" + ministryName + ", Hon. " + officer + ")." }],
  };
};

/* The meeting. approach: "explain" (ask for their account), "confront"
   (put the allegation to them), "notice" (a formal warning). The reply
   depends on what happened and on the person, never on a label: an honest
   commissioner with a clean file sounds like a guilty one who rehearsed. */
export const meetLines = (c, approach, who, year) => {
  const r = seeded("case", c.id, "meet", c.meetings.length, approach);
  const inherited = who !== c.officer;
  const lines = [];
  if (inherited) lines.push({ who, text: "Your Excellency, this happened under my predecessor, Hon. " + c.officer + ". I have the file, but not the whole story." });
  // The story they tell. People who did nothing wrong mostly tell the truth;
  // people who did often tell one of the innocent stories instead.
  const T = c.truth, x = r();
  const claim = T === "misconduct" ? (x < .4 ? "politics" : x < .7 ? "supplier" : "false") : (x < .85 ? T : "politics");
  const SAY = {
    politics: ["With respect, this is politics. My enemies in the party are feeding the press.", "Whoever leaked this wants my seat in cabinet, Your Excellency."],
    negligence: ["I signed it. The site officer said it was done, and I did not check. That is on me.", "Honestly, I am not sure the work was inspected. I will find out."],
    supplier: ["We paid for work the contractor never finished. We are already chasing his bond.", "The contractor took the money and stopped. We have written to his bank."],
    false: ["Go and look at the site. The work is there. The paperwork was late, that is all.", "This came from the company that lost the tender. Ask yourself who gains."],
  };
  const pool = SAY[claim] || SAY.politics;
  if (inherited) lines.push({ who, text: claim === "politics" ? "From what I can see, the file is incomplete. I would not defend it, and I would not condemn it yet." : pool[Math.floor(r() * pool.length)].replace(/^I signed it\./, "My predecessor signed it.").replace(/\bI did not\b/, "nobody did") });
  else if (approach === "notice") lines.push({ who, text: x < .5 ? "Understood, Your Excellency. It will not happen again." : "I understand. I would ask that you look at the file before you decide what I am." });
  else lines.push({ who, text: pool[Math.floor(r() * pool.length)] });
  if (approach === "confront" && !inherited) lines.push({ who, text: r() < .5 ? "You will have the file by the end of the year." : "I will cooperate with whatever review you order." });
  const commitment = { action: approach === "notice" ? "Make no further payments to this contractor without your sign-off" : "Hand over the full payment file and the site reports", reviewYear: year + 1 };
  return { lines, commitment, inherited, claim };
};
// Does the official deliver what they promised at the meeting? Seeded; people
// hiding something are likelier not to. Delivering adds what the file shows;
// failing to is itself evidence (obstruction), though not proof.
export const commitmentOutcome = (c, hon = 50) => {
  const r = seeded("case", c.id, "commitment");
  const p = c.truth === "misconduct" ? .35 + hon / 300 : .9;
  const kept = r() < p;
  const pool = kept ? (r() < .6 ? TRACES[c.truth] : NOISE) : [{ id: "obstruct", label: "The promised file did not arrive; officials say it is \u201cbeing compiled\u201d", w: 1.5 }];
  const have = new Set(c.evidence.map(e => e.id));
  const e = pool.filter(z => !have.has(z.id))[0] || null;
  return { kept, evidence: e };
};

export const recordMeeting = (c, { approach, who, year, lines }) => ({
  ...c, stage: c.stage === "allegation" ? "meeting" : c.stage,
  meetings: [...c.meetings, { year, who, approach, lines }],
  history: [...c.history, { year, text: "Met Hon. " + who + " (" + ({ explain: "asked for their account", confront: "put the allegation to them", notice: "issued a formal warning" }[approach]) + ")." }],
});

/* Gather evidence. Each method once per case. Reliable methods are more
   likely to find the true traces; the rest of the time they find noise or
   a misleading item from another explanation. */
export const gatherEvidence = (c, methodId, year) => {
  const M = METHODS[methodId];
  if (!M || c.methodsUsed.includes(methodId) || c.stage === "decided" || c.stage === "closed") return { c, found: [] };
  const r = seeded("case", c.id, "gather", methodId);
  const have = new Set(c.evidence.map(e => e.id)), found = [];
  for (let i = 0; i < M.finds; i++) {
    const x = r();
    let pool;
    if (x < M.rel) pool = TRACES[c.truth];
    else if (x < M.rel + (1 - M.rel) * .6) pool = NOISE;
    else { const others = Object.keys(TRACES).filter(k => k !== c.truth); pool = TRACES[others[Math.floor(r() * others.length)]]; }
    const cand = pool.filter(e => !have.has(e.id));
    if (!cand.length) continue;
    const e = cand[Math.floor(r() * cand.length)];
    have.add(e.id); found.push({ ...e, by: M.nm, year });
  }
  const evidence = [...c.evidence, ...found];
  const n = { ...c, evidence, methodsUsed: [...c.methodsUsed, methodId], spentM: c.spentM + M.costM, stage: "evidence",
    history: [...c.history, { year, text: M.nm + ": " + (found.length ? found.map(f => f.label.toLowerCase()).join("; ") : "nothing new") + "." }] };
  return { c: { ...n, grade: gradeOf(n) }, found };
};

// What the evidence, taken together, supports. Never reads c.truth.
export const evidenceScore = (c) => c.evidence.reduce((a, e) => a + e.w, 0);
export const gradeOf = (c) => {
  const sc = evidenceScore(c), n = c.evidence.length;
  if (!n) return c.grade;
  if (sc >= 5) return "substantiated";
  if (sc >= 2) return "documented";
  if (sc <= -3) return "unsupported";
  return c.source === "press" && n < 2 ? "rumour" : "credible";
};
export const findingsReady = (c) => c.evidence.length >= 2 || c.methodsUsed.length >= 2;

/* The decision. Its effects depend on what was known (how the public and
   the party read it) AND on what was true (what comes back later). */
export const DECISIONS = {
  prosecute: { nm: "Dismiss and refer for prosecution", needs: ["documented", "substantiated"] },
  suspend: { nm: "Suspend pending the outcome", needs: null },
  recover: { nm: "Formal warning; recover the money", needs: null },
  clear: { nm: "Clear the commissioner publicly", needs: null },
  bury: { nm: "Let it go quietly", needs: null },
};
export const decideCase = (c, dId, year) => {
  const g = c.grade, T = c.truth, fx = { app: 0, cor: 0, pStab: 0 }, later = [];
  let recoveredM = 0, removes = false;
  if (dId === "prosecute") {
    removes = true; fx.app += g === "substantiated" ? 4 : 2; fx.pStab -= 3; fx.cor -= .02;
    recoveredM = Math.round(c.amountM * (T === "misconduct" ? .4 : .1));
    if (T === "false") later.push({ year: year + 1, text: "The court acquits Hon. " + c.officer + ": the work was done all along. The papers call the sacking rash.", fx: { app: -3 } });
  } else if (dId === "suspend") {
    removes = true; fx.app += 1; fx.pStab -= 1;
  } else if (dId === "recover") {
    recoveredM = Math.round(c.amountM * (T === "misconduct" ? .3 : T === "supplier" ? .5 : T === "negligence" ? .2 : 0));
    fx.app += 0; if (T === "misconduct") later.push({ year: year + 1, text: "Another payment from the same ministry surfaces. Hon. " + c.officer + " was not deterred.", fx: { app: -2, cor: .02 } });
  } else if (dId === "clear") {
    if (T === "misconduct") { later.push({ year: year + 1, text: "The EFCC publishes what your review missed about Hon. " + c.officer + ". You cleared them.", fx: { app: -5, cor: .03 } }); }
    else fx.app += 1;
  } else if (dId === "bury") {
    fx.cor += .01; if (g === "documented" || g === "substantiated") later.push({ year: year + 1, text: "A journalist publishes the file you sat on. “The governor knew.”", fx: { app: -4, cor: .02 } });
  }
  const outstandingM = Math.max(0, c.amountM - recoveredM);
  return {
    c: { ...c, stage: "decided", decision: { id: dId, year, removes }, recoveredM, outstandingM, later,
      history: [...c.history, { year, text: DECISIONS[dId].nm + "." + (recoveredM ? " " + fmtM(recoveredM) + " recovered." : "") + (outstandingM ? " " + fmtM(outstandingM) + " still missing." : "") }] },
    fx, removes,
  };
};
// Consequences that arrive in a later year (once each).
export const dueLater = (cases, year) => {
  const out = [];
  const next = (cases || []).map(c => {
    if (!c.later || !c.later.length) return c;
    const due = c.later.filter(l => l.year <= year && !l.done);
    if (!due.length) return c;
    due.forEach(l => out.push({ caseId: c.id, ...l }));
    return { ...c, later: c.later.map(l => due.includes(l) ? { ...l, done: true } : l), stage: c.later.every(l => due.includes(l) || l.done) ? "closed" : c.stage,
      history: [...c.history, ...due.map(l => ({ year, text: l.text }))] };
  });
  return { cases: next, events: out };
};

/* Commitments: who promised what, by when. Institutional ones (a ministry's
   task) pass to the next officeholder; personal conduct stays with the
   person. Reviewed at each year's end. */
export const addCommitment = (list, { id, who, ministryId, action, resourcesM = 0, reviewYear, caseId, personal = false, year }) =>
  (list || []).some(x => x.id === id) ? list : [...(list || []), { id, who, ministryId, action, resourcesM, reviewYear, caseId, personal, status: "open", madeYear: year, notes: [] }];

export const transferCommitments = (list, ministryId, from, to, year) => (list || []).map(x =>
  x.ministryId === ministryId && x.who === from && x.status === "open" && !x.personal
    ? { ...x, who: to, notes: [...x.notes, "Year " + year + ": passed from Hon. " + from + " to Hon. " + to + "."] } : x);

// Year-end review. kept(x) decides from the game state whether it was done.
export const reviewCommitments = (list, year, kept) => {
  const due = [], next = (list || []).map(x => {
    if (x.status !== "open" || x.reviewYear > year) return x;
    const ok = !!kept(x); due.push({ ...x, status: ok ? "kept" : "broken" });
    return { ...x, status: ok ? "kept" : "broken", notes: [...x.notes, "Year " + year + ": " + (ok ? "done." : "not done.")] };
  });
  return { list: next, due };
};
