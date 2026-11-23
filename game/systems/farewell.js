/* The last month in office (owner, 23 Nov 2026: "research how a governor or president term should end… how best to
   give closure… build it"). How Nigerian terms really end: the commissioning rush, the last Executive Council, the
   midnight approvals, the farewell broadcast, and 29 May (the handover note, the oath, the successor's speech, the
   convoy or the jet home). Five short beats, each one tap or one choice; the choices change the record and the
   EFCC's file. (No "two years later": the owner did not want it, 23 Nov 2026.) Rules only, no React. */
import { seeded } from "./rng.js";

// Pictures: Lovable's (docs/LOVABLE-FAREWELL.md) in public/art/farewell/, each with a stand-in until it arrives.
export const FAREWELL_ART = {
  commission: ["farewell/commissioning-rush", "scenes/ribbon-cut"],
  exco: ["farewell/last-exco", "scenes/exco-budget-council"],
  exco_fed: ["farewell/last-fec", "scenes/fec-meeting"],
  midnight: ["farewell/midnight-files", "scenes/midnight-visitor"],
  broadcast: ["farewell/farewell-broadcast", "scenes/national-broadcast"],
  oath: ["farewell/handover-oath", "scenes/guard-of-honour"],
  oath_fed: ["farewell/eagle-square-handover", "scenes/inauguration-eagle-square"],
  depart: ["farewell/convoy-home", "scenes/army-convoy"],
  depart_fed: ["farewell/jet-home", "scenes/presidential-jet"],
  home: ["farewell/hometown-welcome", "backgrounds/village-square"],
};
export const farewellArt = (k, nat) => FAREWELL_ART[nat && FAREWELL_ART[k + "_fed"] ? k + "_fed" : k] || FAREWELL_ART.home;

// Which endings get the ceremony: you leave on your own feet, on 29 May.
export const FAREWELL_ENDS = ["complete", "stepped_down", "defeated"];
export const BEATS = ["commission", "exco", "midnight", "broadcast", "handover"];

/* Beat 1: the commissioning rush. Finished projects to open with a ribbon (pick up to two), and unfinished ones
   that tempt (commission it anyway: a ribbon on a half-built site). */
export const commissionChoices = (projects = []) => {
  const done = projects.filter(p => p.status === "delivered" || p.status === "built").slice(-6).map(p => ({ id: p.id, title: p.title, done: true }));
  const half = projects.filter(p => p.status === "in_progress" && (p.progress || 0) >= 50).slice(0, 2).map(p => ({ id: p.id, title: p.title, done: false, progress: Math.round(p.progress || 0) }));
  return [...done.slice(0, 4), ...half];
};

/* Beat 2: the last Executive Council. Each commissioner says one line in character; the crooked one asks for one
   last approval. ms: [{ id, name (ministry), minister, perf, cor, loyalty }]. */
export const excoLines = (ms = [], { nat, boss } = {}) => {
  const who = ms.filter(m => m && m.minister && !m.acting);
  const sorted = who.slice().sort((a, b) => (b.loyalty || 50) - (a.loyalty || 50));
  const crook = who.slice().sort((a, b) => (b.cor || 0) - (a.cor || 0))[0];
  const title = nat ? "Minister" : "Commissioner", B = boss || (nat ? "Mr President" : "Your Excellency");
  // Each kind of commissioner has several lines; no two at the table say the same thing.
  const POOL = {
    loyal: [B + ", it has been the honour of my life. Whatever comes next, call me.", "I came in as your aide and leave as your friend. My door is open, " + B + ".", "When they write about these years, I hope they write my name next to yours."],
    good: ["We finished what we started. The files are in order for whoever comes next.", "Every naira in my ministry is accounted for. Let them audit; I will sleep well.", "I leave three projects for the next team. They only need to finish them."],
    weak: ["I know we did not do everything. History will be kinder than the newspapers.", "We were short of money from the first day. Still, we tried.", "Some of what I promised is still on paper. I am sorry for that."],
    cold: ["Let us hope the next government listens to its cabinet.", "Some of us said things in this room that nobody heard. Good luck to all."],
    plain: ["Thank you, " + B + ". It was not easy, but it was something.", "These years went fast. I will miss this table, if not the meetings.", "My wife says I can come home now. Thank you, " + B + "."],
  }, used = {};
  const line = (m) => { const k = (m.loyalty || 50) >= 70 ? "loyal" : (m.perf || 50) >= 70 ? "good" : (m.perf || 50) < 40 ? "weak" : (m.loyalty || 50) < 35 ? "cold" : "plain"; const i = used[k] || 0; used[k] = i + 1; return POOL[k][i % POOL[k].length]; };
  const lines = sorted.filter(m => m !== crook || (crook.cor || 0) <= 45).slice(0, 4).map(m => ({ id: m.id, who: "Hon. " + m.minister, role: title + " · " + String(m.name).replace(/^Ministry of /, ""), text: line(m) }));
  const ask = crook && (crook.cor || 0) > 45 ? { id: crook.id, who: "Hon. " + crook.minister, role: title + " · " + String(crook.name).replace(/^Ministry of /, ""),
    text: B + ", one small thing before we go. A last approval for the " + String(crook.name).replace(/^Ministry of /, "").toLowerCase() + " contract. It is all in order. It just needs your signature tonight." } : null;
  return { lines, ask };
};

/* Beat 3: midnight decisions. Each is tempting; each feeds what the EFCC and the successor do next. */
export const MIDNIGHT = [
  { id: "boards", nat: false, l: "Appoint 40 loyalists to state boards for five-year terms", gain: "Your people are looked after.", cost: "Your successor must sack them, and resents you for it.", fx: { pStab: 2 }, efcc: 0, succ: -2 },
  { id: "boards_fed", nat: true, l: "Fill 60 federal board seats with loyalists for five-year terms", gain: "Your people are looked after.", cost: "Your successor must sack them, and resents you for it.", fx: { pStab: 2 }, efcc: 0, succ: -2 },
  { id: "pardon", l: "Sign the pardon list, with a friend's name on it", gain: "Thirty prisoners go home, and so does your friend.", cost: "The papers find the name.", fx: { app: -1 }, efcc: .03, succ: 0 },
  { id: "contract", l: "Award the last big contract to a friend's company", gain: "A thank-you lands in your campaign fund.", cost: "The new government will audit it, and the EFCC will read the audit.", fx: {}, fund: 150, efcc: .07, succ: -1 },
  { id: "land", nat: false, l: "Allocate the government plots by the lagoon to friends", gain: "Your friends own the waterfront.", cost: "The new governor can revoke it, and the community will cheer.", fx: { app: -1 }, efcc: .05, succ: -1 },
];
export const midnightFor = (nat) => MIDNIGHT.filter(x => x.nat == null || x.nat === !!nat);

/* Beat 4: the farewell broadcast. The tone sets the papers' verdict and how the successor speaks of you. */
export const BROADCAST = [
  { id: "proud", l: "Proud: list what you built", line: "We met a state in debt and leave it standing. The roads, the schools, the hospitals are there for all to see.", papers: "OUTGOING GOVERNOR LISTS ACHIEVEMENTS IN FAREWELL", fx: { app: 1 }, succ: 0 },
  { id: "humble", l: "Humble: thank the people, admit what you missed", line: "We did not do everything we promised. But we never stopped trying, and we never stopped listening.", papers: "“WE DID NOT DO EVERYTHING”: GOVERNOR'S FRANK FAREWELL", fx: { app: 2 }, succ: 1 },
  { id: "attack", l: "Fighting: warn the people about your successor", line: "Guard what we built. Do not let anyone undo it for their own pocket.", papers: "FAREWELL SPEECH TURNS INTO ATTACK ON INCOMING GOVERNMENT", fx: { app: -1, pStab: 1 }, succ: -3 },
];

/* Beat 5: 29 May. The successor's speech: warm, polite or a snub, from who they are and what you did on the way
   out. ctx: { kind: "heir"|"technocrat"|"rival"|"opposition", betrayed, broadcast, midnight: [ids], handover }. */
export const successorSpeech = (ctx = {}, rand = Math.random) => {
  // kind: SYS.successorKind's heir, technocrat, rival or opposition.
  let warmth = ctx.kind === "heir" ? 2 : ctx.kind === "technocrat" ? 1 : ctx.kind === "rival" ? 0 : -1;
  if (ctx.betrayed) warmth -= 2;
  warmth += (BROADCAST.find(b => b.id === ctx.broadcast) || {}).succ || 0;
  (ctx.midnight || []).forEach(id => { warmth += (MIDNIGHT.find(m => m.id === id) || {}).succ || 0; });
  if (ctx.handover === "full") warmth += 1; else if (ctx.handover === "none") warmth -= 2;
  const n = ctx.name || "Your successor", you = ctx.you || "my predecessor";
  if (warmth >= 2) return { tone: "warm", line: n + ": “I thank " + you + " for the foundation we build on today. We will finish what was started.”" };
  if (warmth >= 0) return { tone: "polite", line: n + ": “I acknowledge " + you + ". A new day begins, and we will review everything.”" };
  return { tone: "snub", line: n + ": “We inherit empty coffers and abandoned sites. A committee will look into how we got here.”" + (rand() < .5 ? " " + you.charAt(0).toUpperCase() + you.slice(1) + " was not mentioned again." : "") };
};

/* What the farewell's choices add up to: meter changes now, EFCC exposure, the campaign fund, and wiki lines. */
export const farewellEffect = (picks = {}) => {
  const fx = { app: 0, pStab: 0 }; let efcc = 0, fund = 0; const wiki = [];
  (picks.commission || []).forEach(x => { fx.app += x.done ? 1 : 2; if (!x.done) { efcc += .02; wiki.push("Commissioned " + x.title + " while it was still under construction."); } });
  if (picks.ask === "yes") { efcc += .06; wiki.push("Signed a last-minute contract approval on the eve of the handover."); }
  (picks.midnight || []).forEach(id => { const m = MIDNIGHT.find(x => x.id === id); if (!m) return; Object.entries(m.fx || {}).forEach(([k, v]) => { fx[k] = (fx[k] || 0) + v; }); efcc += m.efcc || 0; fund += m.fund || 0; wiki.push(m.l.replace(/^./, c => c.toUpperCase()) + " in the last days in office."); });
  const B = BROADCAST.find(b => b.id === picks.broadcast); if (B) Object.entries(B.fx || {}).forEach(([k, v]) => { fx[k] = (fx[k] || 0) + v; });
  return { fx, efcc: Math.round(efcc * 100) / 100, fund, wiki };
};
