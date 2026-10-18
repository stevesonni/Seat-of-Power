/* The gold deposits: an eight-year storyline.

   Built only from what the game already establishes: Northstar Mining
   (Canada) has found gold; artisanal miners will be displaced; mercury,
   lead poisoning from illegal pits run by foreign buyers with local
   protectors; deforestation; environmental groups in court; and mining
   licences are federal (the state cannot grant or revoke them).

   Fixed spine: discovery in Year 1 (no later than its end), escalation
   from Year 2. Everything else responds to choices, through six measures
   the player can see (as words, not secrets):
     harm      – lead, mercury, cut forest (0–100, high is bad)
     pits      – illegal mining activity (0–100, high is bad)
     grievance – what the host communities hold against everyone (high is bad)
     trust     – host communities' trust in your government (high is good)
     readiness – your government's ability to monitor and enforce (high is good)
     leverage  – your hand with Northstar and Abuja (high is good)
   plus exposure (₦M the state has committed) and flags (an agreement, and
   whether it shares benefits).

   Stages: tension → escalation → containment → settlement (temporary) →
   resolved (durable), or entrenched (failure). A settlement is not a
   resolution: if grievance or pits climb again, it escalates again.

   Durable resolution needs every measure in good shape, a benefit-sharing
   agreement, and two years without relapse. By Year 4 that is almost
   impossible by construction (settlement cannot come before Year 2); a
   first-term resolution also needs unusually favourable outside conditions
   (`fortune`, seeded once at discovery, about one game in a million).
   That frequency is a balancing target to check by simulation
   (tests/deposits.test.mjs), not a measured probability.

   All variation is seeded from the game seed and year (rng.js): reloading
   never rerolls a year. */
import { seeded } from "./rng.js";
import { fmtM } from "./money.js";

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
export const GOLD_STAGE = { tension: "Emerging tension", escalation: "Escalation", containment: "Contained", settlement: "Temporary settlement", resolved: "Durably resolved", entrenched: "Entrenched: out of control" };
export const MEASURE_NAME = { harm: "Harm to people and land", pits: "Illegal pits", grievance: "Community grievance", trust: "Community trust", readiness: "Government readiness", leverage: "Your negotiating hand" };
export const GOOD_HIGH = { trust: true, readiness: true, leverage: true };
export const word = (k, v) => { const good = GOOD_HIGH[k] ? v : 100 - v; return good >= 75 ? "good" : good >= 55 ? "fair" : good >= 35 ? "poor" : "dire"; };
export const FORTUNE_FIRST_TERM = 0.999999; // ≈ 1 in a million

export const discover = (seed, year, lga) => {
  const r = seeded("gold", seed, "discovery");
  return { stage: "tension", lga, discoveredYear: year, fortune: r(), m: { harm: 20, pits: 30, grievance: 25, trust: 50, readiness: 25, leverage: 40 },
    exposureM: 0, agreement: null, settledYear: null, goodYears: 0, direYears: 0, decided: {}, history: [{ year, text: "Gold confirmed under farmland in " + lga + ". Northstar Mining (Canada) holds the federal exploration licence; artisanal miners are already digging." }] };
};

/* This year's situation and choices. Year of discovery: the discovery.
   The next year: the escalation anchor. After that: the measure in the
   worst shape decides what the year is about. */
export const beat = (D, year) => {
  if (!D) return null;
  if (year === D.discoveredYear) return { id: "discovery", title: "Gold in " + D.lga,
    text: "Geologists working with Northstar Mining confirm gold under farmland in " + D.lga + ". The mining licence is federal; the land, the water and the people are yours to protect. Artisanal miners are already digging.",
    known: "The deposit is real. Northstar has the licence. Miners are on the land.", unknown: "How big the rush will be, and what Northstar will offer.",
    options: [
      { id: "inform", label: "Tell the communities first and map the site", note: "Slower deal with Northstar; people hear it from you.", costM: 200, d: { trust: 15, readiness: 10, pits: 5, leverage: -5 } },
      { id: "quiet", label: "Keep it quiet while you negotiate with Northstar", note: "A stronger hand now. If it leaks, it looks like a deal behind their backs.", costM: 0, d: { leverage: 10, trust: -8, pits: 15 } },
      { id: "boom", label: "Announce a gold boom for the state", note: "Popular today. Every speculator in the region will come.", costM: 0, d: { pits: 25, harm: 10, leverage: -10, grievance: 10 }, fx: { app: 3 } },
    ] };
  if (year === D.discoveredYear + 1) return { id: "escalation", title: "The rush around " + D.lga,
    text: "Illegal pits have spread around " + D.lga + ". The clinic reports children with lead poisoning. The pit owners have local protectors. Northstar wants the land cleared for its survey.",
    known: "Children are sick. The pits are spreading.", unknown: "Who protects the pits, and how far they will go.",
    options: [
      { id: "health", label: "Shut the worst pits and fund lead treatment", note: "Lives saved. The protectors take it personally.", costM: 800, d: { harm: -20, pits: -15, trust: 5 }, fx: { pStab: -2 } },
      { id: "coop", label: "Register the artisanal miners in a cooperative", note: "Brings miners into the law and the tax net. Slow to bite.", costM: 600, d: { pits: -10, grievance: -10, readiness: 10, leverage: 5, harm: -5 } },
      { id: "clear", label: "Clear the land for Northstar", note: "The company is pleased. The villages are not.", costM: 0, d: { leverage: 5, grievance: 20, trust: -20, harm: -5 }, fx: { app: -2, sec: -.02 } },
      { id: "federal", label: "Say it is a federal matter", note: "Legally true. Morally hollow.", costM: 0, d: { harm: 10, pits: 10, trust: -10 }, fx: { app: -2 } },
    ] };
  const m = D.m;
  if (D.stage === "resolved") return null;
  const canSettle = m.harm < 50 && m.pits < 50 && !D.agreement;
  const bad = Object.keys(m).map(k => [k, GOOD_HIGH[k] ? 100 - m[k] : m[k]]).sort((a, b) => b[1] - a[1])[0][0];
  const B = {
    harm: { id: "harm", title: "Mercury in the river", text: "Fish are dying downstream of the pits. A health survey finds mercury in the river that " + D.lga + " drinks from. Environmental groups are back in court.",
      options: [{ id: "cleanup", label: "Pay for a clean-up and safe water", note: "Expensive and slow; the river recovers over years.", costM: 1500, d: { harm: -25, trust: 8 } },
        { id: "sue", label: "Join the court case against the polluters", note: "Puts pressure on Northstar and the buyers. Lawyers cost money.", costM: 300, d: { harm: -8, leverage: 8, readiness: 4 } },
        { id: "relocate", label: "Move the worst-hit families", note: "Removes them from the poison; takes them from their land.", costM: 700, d: { harm: -12, grievance: 15, trust: -6 } }] },
    pits: { id: "pits", title: "More pits, better armed", text: "The illegal pits have spread into the forest reserve. The protectors now carry guns; two forest guards were beaten.",
      options: [{ id: "raid", label: "Joint raids with the police", note: "Fewer pits for a while. Confrontations, and the buyers come back.", costM: 400, d: { pits: -20, trust: -6, harm: -5 }, fx: { sec: .01 } },
        { id: "license", label: "Push Abuja to license the cooperative's pits", note: "Legal mining replaces some illegal mining, if Abuja agrees.", costM: 200, d: { pits: -12, leverage: 6, grievance: -6 } },
        { id: "wait", label: "Leave it to the federal mines officers", note: "There are three of them for the whole state.", costM: 0, d: { pits: 10, harm: 6 } }] },
    grievance: { id: "grievance", title: "Roadblocks at the site", text: "Youths from the host communities have blocked the road to the Northstar site. They want jobs, compensation and the land back.",
      options: [{ id: "talk", label: "Go there and negotiate", note: "You hear it to your face. People notice that you came.", costM: 300, d: { grievance: -12, trust: 12 } },
        { id: "compensate", label: "Set up a compensation fund", note: "Money for lost farms. A commitment that grows.", costM: 1000, d: { grievance: -18, trust: 6 }, exposure: 1000 },
        { id: "police", label: "Send the police to clear the road", note: "The road opens. Somebody gets hurt.", costM: 0, d: { grievance: 15, trust: -15, leverage: 4 }, fx: { app: -3 } }] },
    trust: { id: "trust", title: "Nobody believes the government", text: "In " + D.lga + " they say the state sold the land and the river. Your officials are turned away from community meetings.",
      options: [{ id: "townhall", label: "Publish every agreement and hold town halls", note: "Openness: slow, uncomfortable, durable.", costM: 150, d: { trust: 15, grievance: -6 } },
        { id: "chiefs", label: "Work through the traditional rulers", note: "Quick; only as trusted as the rulers are.", costM: 100, d: { trust: 8, grievance: -3 } },
        { id: "pr", label: "Run a media campaign", note: "Changes the headlines, not the facts on the ground.", costM: 250, d: { trust: 3 }, fx: { app: 1 } }] },
    readiness: { id: "readiness", title: "Who is watching the mine?", text: "Your ministries have no geologists, no water testers and no inspectors. Northstar's reports are the only data anyone has.",
      options: [{ id: "unit", label: "Build a state mining and environment unit", note: "Staff, labs, inspectors. Pays off in later years.", costM: 500, d: { readiness: 22, leverage: 6 } },
        { id: "consult", label: "Hire independent consultants", note: "Quicker, and they leave when the contract ends.", costM: 300, d: { readiness: 12, leverage: 4 } },
        { id: "trust_co", label: "Rely on Northstar's own reporting", note: "Free. You will know what they choose to tell you.", costM: 0, d: { readiness: -4, leverage: -6 } }] },
    leverage: { id: "leverage", title: "Northstar's offer", text: "Northstar offers the state a community development fund if it backs the company's federal mining licence, on the company's terms.",
      options: [{ id: "take", label: "Take the offer as it stands", note: "Money now, on their terms. The communities were not asked.", costM: 0, d: { leverage: -10, grievance: 12 }, exposure: -500, agreement: { benefitSharing: false } },
        { id: "bargain", label: "Hold out for benefit-sharing and community seats", note: "Works only if the communities stand with you and your officials know the numbers.", costM: 100, bargain: true },
        { id: "refuse", label: "Refuse and lobby Abuja", note: "Keeps your options open; nothing changes on the ground this year.", costM: 50, d: { leverage: 6 } }] },
  }[bad];
  const opts = [...B.options];
  if (canSettle) opts.push({ id: "settle", label: "Sign a host-community agreement now", note: "Calms things while it holds. It holds only if the grievances behind it are dealt with.", costM: 300, settle: true });
  return { ...B, known: "Harm " + word("harm", m.harm) + ", pits " + word("pits", m.pits) + ", trust " + word("trust", m.trust) + ".", unknown: "How the protectors, Northstar and Abuja will respond.", options: opts };
};

// Apply a choice once per year; seeded variance.
export const choose = (D, year, optId, seed) => {
  if (!D || D.decided[year]) return { D, fx: {}, costM: 0, text: "" };
  const b = beat(D, year); const o = b && b.options.find(x => x.id === optId); if (!o) return { D, fx: {}, costM: 0, text: "" };
  const r = seeded("gold", seed, year, optId);
  const m = { ...D.m };
  let text = o.label + ".", agreement = D.agreement, settledYear = D.settledYear;
  Object.entries(o.d || {}).forEach(([k, v]) => { m[k] = clamp(m[k] + v * (.8 + r() * .4)); });
  if (o.bargain) {
    const ok = m.trust > 55 && m.readiness > 50 && r() < .3 + (m.leverage / 100) * .6;
    if (ok) { agreement = { benefitSharing: true, year }; settledYear = settledYear || year; m.grievance = clamp(m.grievance - 20); m.leverage = clamp(m.leverage + 10); text = "Northstar agreed to share benefits and give the communities seats on the fund's board."; }
    else { m.leverage = clamp(m.leverage + 3); text = "Northstar walked away from the table for now. " + (m.trust <= 55 ? "The communities did not stand with you." : m.readiness <= 50 ? "Your officials could not answer the company's numbers." : "Their lawyers held out."); }
  }
  if (o.agreement) { agreement = { ...o.agreement, year }; settledYear = settledYear || year; }
  if (o.settle) { agreement = agreement || { benefitSharing: m.trust > 60 && m.leverage > 50, year }; settledYear = year; m.grievance = clamp(m.grievance - 10); text = "A host-community agreement is signed" + (agreement.benefitSharing ? ", with a share of the benefits." : ", without benefit-sharing."); }
  const exposureM = D.exposureM + (o.exposure || 0);
  // The second year is when it escalates, whatever was decided in the first.
  const stage = year === D.discoveredYear + 1 && D.stage === "tension" ? "escalation" : D.stage;
  return { D: { ...D, stage, m, agreement, settledYear, exposureM, decided: { ...D.decided, [year]: optId }, history: [...D.history, { year, text: b.title + ": " + text }] }, fx: o.fx || {}, costM: o.costM || 0, text };
};

/* Year end: drift, then the stage. Called once per year (the caller guards). */
export const yearEnd = (D, year, seed, ctx = {}) => {
  if (!D || D.stage === "resolved") return { D, events: [] };
  const r = seeded("gold", seed, year, "drift");
  const m = { ...D.m }, events = [];
  const noise = () => (r() - .5) * 6;
  // Without enforcement the pits grow; harm follows the pits; grievance follows harm.
  const shared = D.agreement && D.agreement.benefitSharing;
  // Legal, shared mining and a government that inspects pull people out of the illegal pits.
  m.pits = clamp(m.pits + 7 - m.readiness * .08 - (shared ? 5 : 0) - (m.readiness >= 60 ? 3 : 0) + noise());
  m.harm = clamp(m.harm + m.pits * .14 - m.readiness * .06 - 2 + noise());
  m.grievance = clamp(m.grievance + (m.harm - 40) * .12 - (D.agreement && D.agreement.benefitSharing ? 6 : 0) + noise());
  m.trust = clamp(m.trust + (50 - m.trust) * .06 + (shared ? 3 : 0) - (m.grievance > 60 ? 4 : 0) + (ctx.cor > .5 ? -3 : 0) + noise() * .5);
  m.readiness = clamp(m.readiness - 2);
  m.leverage = clamp(m.leverage + (ctx.fgRelation != null ? (ctx.fgRelation - 50) * .04 : 0));
  let stage = D.stage, goodYears = D.goodYears, direYears = D.direYears, settledYear = D.settledYear;
  const good = m.harm < 25 && m.pits < 20 && m.trust > 65 && m.readiness > 65 && m.grievance < 25 && D.agreement && D.agreement.benefitSharing;
  goodYears = good ? goodYears + 1 : 0;
  direYears = m.harm > 85 ? direYears + 1 : 0;
  const relapse = settledYear && (m.grievance > 55 || m.pits > 50);
  if (direYears >= 2) stage = "entrenched";
  else if (good && goodYears >= 2 && (year > 4 || D.fortune >= FORTUNE_FIRST_TERM)) stage = "resolved";
  else if (relapse && (stage === "settlement" || stage === "containment")) { stage = "escalation"; events.push("The agreement has not held: " + (m.pits > 50 ? "the pits are back." : "the communities say they were cheated.")); settledYear = null; }
  else if (settledYear) stage = "settlement";
  else if (year <= D.discoveredYear) stage = "tension";
  else if (m.harm < 45 && m.pits < 45) stage = "containment";
  else stage = "escalation";
  if (stage !== D.stage) events.push(GOLD_STAGE[stage] + ".");
  return { D: { ...D, m, stage, goodYears, direYears, settledYear, history: [...D.history, { year, text: "End of year: " + GOLD_STAGE[stage].toLowerCase() + ". Harm " + word("harm", m.harm) + ", pits " + word("pits", m.pits) + ", trust " + word("trust", m.trust) + "." }] }, events };
};

/* Losing the re-election: the successor inherits the real state of things.
   Their own style is seeded; the epilogue says what was yours and what was
   theirs. Outcome types, not fixed endings. */
export const successorEpilogue = (D, seed, ctx = {}) => {
  if (!D) return null;
  const r = seeded("gold", seed, "successor");
  const style = r() < .34 ? "reformer" : r() < .5 ? "dealmaker" : "caretaker";
  let S = { ...D, m: { ...D.m }, decided: { ...D.decided } };
  const plan = { reformer: ["readiness", "harm", "trust", "grievance"], dealmaker: ["leverage", "pits", "leverage", "trust"], caretaker: ["trust", "pits", "trust", "trust"] }[style];
  const pick = { reformer: { readiness: "unit", harm: "cleanup", trust: "townhall", grievance: "talk", pits: "license", leverage: "bargain" }, dealmaker: { leverage: "take", pits: "raid", trust: "pr", grievance: "compensate", harm: "sue", readiness: "consult" }, caretaker: { trust: "pr", pits: "wait", grievance: "police", harm: "relocate", readiness: "trust_co", leverage: "refuse" } }[style];
  for (let y = 5; y <= 8; y++) { const b = beat(S, y); if (b) { const o = b.options.find(x => x.id === pick[b.id]) || b.options[0]; S = choose(S, y, o.id, seed + ":succ").D; } S = yearEnd(S, y, seed + ":succ", ctx).D; }
  const yours = [];
  if (D.agreement) yours.push(D.agreement.benefitSharing ? "a benefit-sharing agreement with Northstar" : "an agreement with Northstar that shares nothing with the communities");
  if (D.m.readiness >= 60) yours.push("a government that can monitor the mine"); else yours.push("a government with almost no capacity to watch the mine");
  if (D.m.trust >= 60) yours.push("communities that still trusted the state"); else if (D.m.trust < 40) yours.push("communities that no longer believed the state");
  if (D.exposureM > 0) yours.push(fmtM(D.exposureM) + " of commitments to the host communities");
  if (ctx.openCases) yours.push(ctx.openCases + " unfinished corruption file" + (ctx.openCases > 1 ? "s" : ""));
  if (ctx.debtB != null) yours.push("state debt of ₦" + Math.round(ctx.debtB * 10) / 10 + "B");
  const type = S.stage === "resolved" ? (D.m.readiness >= 60 || D.agreement ? "foundations" : "successor_win") : S.stage === "entrenched" || (S.m.harm > 65) ? "worsening" : "manageable";
  const label = { foundations: "Your foundations, their finish", successor_win: "They did what you could not", worsening: "It got worse", manageable: "A problem still being managed" }[type];
  const theirs = { reformer: "Your successor built on the evidence and the institutions", dealmaker: "Your successor did deals with Northstar and Abuja", caretaker: "Your successor kept their head down" }[style];
  return { type, label, style, stageAtHandover: D.stage, stageAt8: S.stage, yours, theirs: theirs + "; by 2034 the crisis was " + GOLD_STAGE[S.stage].toLowerCase() + ".", final: S };
};

// Year 8: what actually happened.
export const finalAssessment = (D) => {
  if (!D) return null;
  const m = D.m;
  const verdict = D.stage === "resolved" ? "Durably resolved: the communities share in the gold, the river is recovering and the pits are gone."
    : D.stage === "settlement" ? "Settled, not solved: an agreement holds, but " + (m.grievance > 40 ? "the grievances behind it remain." : "it has not yet been tested by time.")
    : D.stage === "containment" ? "Contained: the harm is limited, but there is no lasting agreement."
    : D.stage === "entrenched" ? "Out of control: poison and guns rule the goldfields."
    : "Still escalating at the end of your time.";
  return { stage: D.stage, verdict, measures: Object.fromEntries(Object.keys(m).map(k => [k, word(k, m[k])])) };
};
