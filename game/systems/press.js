/* The press turns on you below 50% (owner, 25 Nov 2026: "If your approval is below 50% the newspaper headlines should
   be hostile even if you did a good job… find a way to make even the good job, e.g. you secured The Hague deal, look
   like failure. After you climb past 50% they continue reporting balanced." With a buffer: hostile below 50, balanced
   again from 52. Good news earns half its approval while the press is hostile. Tori's press accounts follow.)
   The press never invents facts: the facts stay in the line under the headline; only the headline's angle changes. */

export const HOSTILE_BELOW = 50, BALANCED_FROM = 52, HOSTILE_GAIN = .5;

// Is the press hostile? wasHostile: what it was last time (the buffer).
export const pressHostile = (app, wasHostile = false) => app < HOSTILE_BELOW || (!!wasHostile && app < BALANCED_FROM);

// A positive approval change while the press is hostile is halved; losses are untouched.
export const pressGain = (d, hostile) => hostile && d > 0 ? d * HOSTILE_GAIN : d;

const hash = (x) => { let h = 2166136261; for (const ch of String(x)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
const pick = (arr, seed) => arr[hash(seed) % arr.length];
const cap = (t) => String(t || "").toUpperCase();
// The subject of a headline: what comes before the verb, or the first few words.
const subject0 = (h) => { const m = String(h).match(/^(.{4,40}?)\s+(IS|ARE|WAS|WERE|OPENS?|OPENED|SIGNS?|SIGNED|WINS?|WON|PASSES|PASSED|SECURES?|SECURED|DELIVERS?|DELIVERED|RELEASED|ARRIVES?|COMPLETED?|HOSTS?|HOSTED|BACKS?|APPROVES?|APPROVED|LAUNCH(ES|ED)?|BEGINS?|STARTS?|RETURNS?|REFUNDS?|HANDS?|FINISHED|READY|COMMISSIONED|RESTORED|ENDS?|FREED|RESCUED|PAID|GRANT(S|ED)?|LANDS?|LANDED|AGREED|REACHED|CLEARED)\b/i); return m ? { s: m[1].trim(), rest: String(h).slice(m.index + m[0].length).trim() } : { s: String(h).split(/\s+/).slice(0, 4).join(" "), rest: "" }; };
// When the subject is only the actor (Nigeria, the Governor, the government), name what was done instead: the deal, the road.
const ACTOR = /^(NIGERIA|ABUJA|THE (GOVERNOR|PRESIDENT|GOVERNMENT|STATE|FG|PRESIDENCY)|GOVERNOR|PRESIDENT|GOVERNMENT|GOV\.?|FG|[A-Z]+ STATE|[A-Z][A-Z-]+)$/;
const subject = (h) => { const x = subject0(h); return ACTOR.test(x.s) && x.rest ? x.rest.replace(/^(TO|FOR|IN|ON|AT)\s+/, "").split(/\s+(FOR|IN|AT|WITH|AS|AFTER|TO)\s+/)[0].trim() || x.s : x.s; };

// Each kind of good news has its own unkind angle. {S}: the subject.
const ANGLES = [
  { re: /HAGUE|ICJ|TREATY|ACCORD|AGREEMENT|DEAL|PACT|MOU|SUMMIT|ECOWAS|BILATERAL|SIGN/i, lines: [
    "{S}: A WIN ON PAPER; NOTHING CHANGES ON THE GROUND", "{S}: NIGERIA GIVES AWAY MORE THAN IT GETS", "{S}: CRITICS ASK WHO REALLY BENEFITS", "{S}: PHOTO-OP ABROAD WHILE HOME BURNS"] },
  { re: /REFUND|TRANCHE|LOAN|FAAC|ALLOCATION|BILLION|₦|DOLLARS|GRANT|FUNDS?|PAID INTO|CASH|REVENUE|BUDGET/i, lines: [
    "{S}: BUT WHERE WILL THE MONEY GO?", "{S}: MORE MONEY, SAME OLD WASTE, CRITICS SAY", "{S}: WHO WILL REPAY IT?", "{S}: A WINDFALL THE PEOPLE WILL NEVER SEE"] },
  { re: /ROAD|BRIDGE|HOSPITAL|SCHOOL|ESTATE|TERMINAL|RAIL|DAM|PROJECT|COMMISSION|OPENS?|DELIVER|BUILT|COMPLETE|FINISHED/i, lines: [
    "{S}: YEARS LATE AND OVER BUDGET", "{S}: BUILT FOR THE CAMERAS AND THE NEXT ELECTION", "{S}: ONE RIBBON, A HUNDRED UNFINISHED SITES", "{S}: TOO LITTLE, TOO LATE"] },
  { re: /COURT|RULING|TRIBUNAL|JUDGE|SUPREME|APPEAL|DISMISS/i, lines: [
    "{S}: WON ON A TECHNICALITY", "{S}: THE COURT RULES, THE QUESTIONS REMAIN", "{S}: A LEGAL WIN, A MORAL LOSS, CRITICS SAY"] },
  { re: /STADIUM|MATCH|FIFA|CAF|EAGLES|FALCONS|CUP|FOOTBALL|SPORT/i, lines: [
    "{S}: A STADIUM FOR THE CAMERAS WHILE HOSPITALS WAIT", "{S}: BREAD AND CIRCUSES, CRITICS SAY", "{S}: ONE NIGHT OF FOOTBALL, FOUR YEARS OF HUNGER"] },
  { re: /APPOINT|SWORN|NOMINAT|NAMES?\b|COMMISSIONER|MINISTER|CHIEF/i, lines: [
    "{S}: ANOTHER LOYALIST REWARDED", "{S}: JOBS FOR THE BOYS, CRITICS SAY", "{S}: THE SAME OLD FACES"] },
  { re: /PEACE|CEASEFIRE|RESCUE|FREED|RELEASED|SECURITY|TROOPS|ARMY|BANDIT|INSURG|KIDNAP/i, lines: [
    "{S}: A LULL, NOT A PEACE", "{S}: TOO LATE FOR THE ONES ALREADY LOST", "{S}: CRITICS ASK WHY IT TOOK SO LONG"] },
  { re: /BILL|LAW|ASSEMBLY|SENATE|HOUSE|PASSE?D?\b|VOTE/i, lines: [
    "{S}: A LAW NOBODY WILL ENFORCE", "{S}: PASSED IN A HURRY, CRITICS SAY", "{S}: WORDS ON PAPER"] },
];
const ANY = ["{S}: TOO LITTLE, TOO LATE", "{S}: CRITICS ASK WHY IT TOOK SO LONG", "{S}: THE OPPOSITION CALLS IT A STUNT", "{S}: THE PEOPLE ARE NOT IMPRESSED"];
// Bad news, made worse.
const WORSE = ["ANOTHER FAILURE: {H}", "{H}, AND NOBODY IS SURPRISED", "{H}: THE GOVERNMENT IS ADRIFT", "{H}: HOW MUCH LONGER?"];

/* The front page as a hostile press writes it. Returns { headline, sub, good }: good news becomes a sneer (good false),
   bad news is made worse. The original headline moves into the line beneath when it is spun, so the facts are kept. */
export const spinPaper = (headline, sub, good, seed = "") => {
  const H = cap(headline).replace(/[.!]+$/, "");
  if (!good) { const w = pick(WORSE, H + seed).replace("{H}", H); return { headline: w.length <= 84 ? w : H, sub, good: false }; }
  const A = ANGLES.find(a => a.re.test(H + " " + (sub || ""))), S = subject(H);
  let line = pick(A ? A.lines : ANY, H + seed).replace("{S}", S); if (line.length > 84) line = line.replace(/^[^:]*:\s*/, "");
  return { headline: line, sub: sub || String(headline).replace(/[.!]+$/, ""), good: false };
};

// A Tori post by a news account, as a hostile press writes it: the facts, then the sneer.
const TAILS = ["Critics say it is too little, too late.", "But who really benefits?", "The opposition calls it a stunt.", "Residents say they have heard it all before.", "Years late, and the bill keeps rising."];
export const spinPost = (text, seed = "") => { const t = String(text || "").replace(/\s+$/, ""); return /too little, too late|who really benefits|a stunt|heard it all before|bill keeps rising/i.test(t) ? t : t + (/[.!?]$/.test(t) ? " " : ". ") + pick(TAILS, t + seed); };

// The TV desk's second anchor, when the press is hostile: the facts stand; the comment turns.
const ANCHOR = ["But critics ask who really benefits, and why it took so long.", "The opposition calls it a stunt, and many viewers agree.", "Residents we spoke to say they have heard it all before.",
  "Another promise. We will believe it when we see it.", "Meanwhile, prices are up and the government's approval is down."];
export const anchorSneer = (lead, seed = "") => pick(ANCHOR, String(lead) + seed);
