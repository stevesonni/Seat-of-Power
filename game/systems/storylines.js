/* Storylines (rules only, no React): a recurring matter that remembers.

   A storyline is a graph of beats, one a year. Every option names how it
   is done, and each way plays out differently:
     programme  money and people on the ground: works now, costs every year,
                and stops when the money stops;
     bill       a law: it must pass the House (a roll on the House's mood);
                stalled, it comes back as a fight; passed, the fix lasts;
     order      an executive order: instant and nearly free, but a court
                can strike it down the next year;
     act        anything else (talks, a speech, a decision of the moment).
   The next beat follows the answer: a good one moves the story on to a new
   problem, a weak one escalates it. Three weak answers (a good one takes one
   back) and it boils over into the storyline's worst beat. A beat is never
   shown twice; a solved storyline closes and stays closed. Every card opens
   with what was decided last year. All people are fictional. */

import { keepWord } from "./office.js";

export const KINDS = {
  programme: { tag: "💰 Programme", note: "Works now; costs money; stops when the money stops." },
  bill: { tag: "📜 Bill", note: "Must pass the House: slow, but it lasts." },
  order: { tag: "✍️ Executive order", note: "Instant and cheap; a court can strike it down." },
  act: { tag: "", note: "" },
};

const SPECIAL = new Set(["_stall", "_court", "_wait"]);
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

/* Where a storyline opens. A storyline can have several openings (starts):
   a new game draws one, so the same crisis does not begin the same way
   every time it is played. Stored once, so a reload keeps it. */
export const storyStart = (def, seed = "", r = Math.random) => { const b0 = def.starts ? def.starts[Math.floor(r() * def.starts.length) % def.starts.length] : def.start;
  // The openings not drawn are spent: they never turn up later as a "next development".
  return { id: def.id, beat: b0, seed: String(seed), heat: def.heat0 == null ? 55 : def.heat0, weak: 0, seen: (def.starts || []).filter(b => b !== b0), hist: [], laws: [], orders: [], closed: false, pendingBill: null, court: null, news: null }; };

// The first beat in the storyline's order that has not been shown, or null.
const nextFree = (def, S) => (def.order || Object.keys(def.beats)).find(b => !S.seen.includes(b) && b !== def.boil && def.beats[b] && !def.beats[b].endOnly && !def.beats[b].startOnly) || null;

/* Between years: a bill's vote, a court's ruling on an order, the heat
   rising, a boil-over after too many weak answers, and never the same beat
   twice. ctx.house: how the House feels about you (0–100). */
export const storyTurn = (def, S0, turn, ctx = {}, r = Math.random) => {
  if (!S0 || S0.closed) return S0;
  let S = { ...S0, news: null };
  const house = ctx.house == null ? 50 : ctx.house;
  if (S.pendingBill) {
    const pb = S.pendingBill, odds = clampN(.4 + (house - 50) / 80 + (pb.boost || 0), .12, .9);
    if (r() < odds) S = { ...S, beat: pb.pass, laws: [...S.laws, pb.nm], pendingBill: null, news: { kind: "passed", nm: pb.nm } };
    else if ((S.stalled || []).includes(pb.nm)) S = { ...S, beat: pb.fail, pendingBill: null, news: { kind: "rejected", nm: pb.nm } }; // a second time, the House simply throws it out
    else S = { ...S, beat: "_stall", stall: pb, stalled: [...(S.stalled || []), pb.nm], pendingBill: null, news: { kind: "stalled", nm: pb.nm } };
  } else if (S.court) {
    if (r() < S.court.risk && !(S.challenged || []).includes(S.court.nm)) S = { ...S, beat: "_court", challenged: [...(S.challenged || []), S.court.nm], news: { kind: "challenged", nm: S.court.nm } };
    else S = { ...S, court: null, news: { kind: "held", nm: S.court.nm } };
  }
  if (!SPECIAL.has(S.beat)) {
    if (S.weak >= (def.boilAt || 3) && def.boil && !S.seen.includes(def.boil)) S = { ...S, beat: def.boil, weak: 0, news: { kind: "boil" } };
    if (!S.beat || S.seen.includes(S.beat) || !def.beats[S.beat]) S = { ...S, beat: nextFree(def, S) };
    if (!S.beat) return { ...S, closed: true, legacy: def.faded || null };
  }
  return { ...S, heat: clampN(S.heat + (def.drift == null ? 4 : def.drift), 0, 100) };
};

// The card for the stall and the court: the same fight, about whichever law or order it is.
const stallBeat = (def, S, ctx) => {
  const pb = S.stall || {}, house = ctx.nat ? "the National Assembly" : "the House of Assembly";
  return { t: "The " + pb.nm + " is stuck in " + house, who: ctx.nat ? "senate-president" : "speaker-of-the-house", bg: ctx.nat ? "senate-chamber" : "assembly-chamber",
    d: "Members have sat on the " + pb.nm + " all year. Some want favours; some answer to the people the law would hurt. Until it passes, nothing changes.",
    opts: [
      { id: "bargain", kind: "act", l: "Trade constituency projects for the votes", cost: (def.scale || 1) * 12, fx: { cor: .02 }, npc: { nass: 6 }, past: "bought the votes for the " + pb.nm, say: "The projects are promised and the votes are there. The " + pb.nm + " is law.", law: true, next: pb.pass },
      { id: "public", kind: "act", l: "Go to the people: name the members blocking it", odds: .55, fx: { app: 1 }, npc: { nass: -8 },
        win: { past: "shamed " + house + " into passing the " + pb.nm, say: "The names were read on every radio station. The bill passed within the month.", law: true, next: pb.pass },
        lose: { past: "named the members blocking the " + pb.nm + ", and lost the vote", say: "They closed ranks against you. The bill is dead.", next: pb.fail, weak: true } },
      { id: "drop", kind: "act", l: "Drop the bill and try another way", weak: true, past: "dropped the " + pb.nm, say: "The bill is withdrawn. The problem is still there.", next: pb.fail },
    ] };
};
const courtBeat = (def, S, ctx) => {
  const c = S.court || {};
  return { t: "A court is asked to strike down " + c.nm, who: "judge", bg: "courtroom", scene: "news-court-steps",
    d: "The people your order hurt have gone to the Federal High Court: they say only " + (ctx.nat ? "the National Assembly" : "the House of Assembly") + " can make such a rule. Until the judge rules, everybody waits.",
    opts: [
      { id: "defend", kind: "act", l: "Defend the order in court", odds: .5, cost: (def.scale || 1) * 1,
        win: { past: "won in court: " + c.nm + " stands", say: "The judge upheld it. The order stands.", next: c.after, court: "upheld" },
        lose: { past: "lost in court when " + c.nm + " was struck down", say: "Struck down: the court says it was never yours to make. Everything it did is undone.", next: c.struck, weak: true, court: "struck" } },
      { id: "law", kind: "bill", l: "Turn it into a bill before the court rules", bill: { nm: String(c.nm || "the order").replace(/^the /, "") + " Bill", pass: c.after, fail: c.struck }, past: "turned " + c.nm + " into a bill", say: "The bill goes to the House. If it passes, no court can touch it." },
      { id: "withdraw", kind: "act", l: "Withdraw the order quietly", weak: true, past: "withdrew " + c.nm, say: "Withdrawn. Your opponents are celebrating.", next: c.struck, court: "withdrawn" },
    ] };
};

const RECAP = { passed: (n) => "The " + n.nm + " passed: it is law now. ", rejected: (n) => "The Assembly threw out the " + n.nm + " a second time. ", stalled: (n) => "", challenged: () => "", held: (n) => "Nobody has managed to overturn " + n.nm + ". ", boil: () => "Weak answers have caught up with you. " };
/* The year's card for a storyline, or null when it is closed. Its d opens
   with what you decided last year. */
export const storyCard = (def, S, ctx = {}) => {
  if (!S || S.closed || !S.beat) return null;
  const B = S.beat === "_stall" ? stallBeat(def, S, ctx) : S.beat === "_court" ? courtBeat(def, S, ctx) : def.beats[S.beat];
  if (!B) return null;
  const last = S.hist[S.hist.length - 1];
  const recap = (last && last.past ? "Last year you " + last.past + ". " : "") + (S.news && RECAP[S.news.kind] ? RECAP[S.news.kind](S.news) : "");
  return { id: def.id + ":" + S.beat, story: def.id, beat: S.beat, kicker: def.nm, t: B.t, d: recap + B.d, recap, body: B.d, who: B.who || def.who || null, bg: B.bg || def.bg || null, scene: B.scene || null, learn: B.learn || def.learn || null,
    // A law already passed is not offered again.
    opts: B.opts.filter((o, i, all) => !(o.bill && S.laws.includes(o.bill.nm) && all.length > 2)).map(o => ({ ...o, tag: (KINDS[o.kind] || KINDS.act).tag })) };
};

/* After a choice. Returns the storyline's new state and what happens now:
   { S, fx, cost, npc, say, hook, closed, won, law, order, court }. */
export const storyAfter = (def, S0, opt, turn, ctx = {}, r = Math.random) => {
  const won = opt.odds == null ? null : r() < opt.odds;
  const R = won == null ? opt : { ...opt, ...(won ? opt.win : opt.lose) };
  const beat = S0.beat;
  let S = { ...S0, seen: SPECIAL.has(beat) || S0.seen.includes(beat) ? S0.seen : [...S0.seen, beat], stall: beat === "_stall" ? null : S0.stall, court: beat === "_court" ? null : S0.court,
    hist: [...S0.hist, { t: turn, beat, opt: opt.id, kind: opt.kind, past: R.past || null }], heat: clampN(S0.heat + (R.heat || 0), 0, 100) };
  S.weak = R.weak ? S.weak + 1 : Math.max(0, S.weak - 1);
  let law = null, order = null;
  if (R.law && beat === "_stall") { law = (S0.stall || {}).nm; S.laws = [...S.laws, law]; }
  if (opt.kind === "bill" && R.bill) { S.pendingBill = { ...R.bill }; S.beat = "_wait"; }
  else {
    S.beat = R.next || null;
    if (opt.kind === "order" && R.order) { order = R.order.nm; S.orders = [...S.orders, order]; S.court = { nm: R.order.nm, risk: R.order.risk == null ? .3 : R.order.risk, after: R.next, struck: R.order.struck || R.next }; }
  }
  if (R.close) S = { ...S, closed: true, legacy: R.legacy || def.legacy || null, beat: null };
  return { S, fx: R.fx || {}, cost: R.cost || 0, npc: R.npc || {}, say: R.say || "", hook: R.hook || null, closed: !!R.close, won, law, order, court: R.court || null, decree: !!order && S.orders.length >= 3,
    delivered: R.delivered, kind: opt.kind };
};
// Every beat a storyline can reach, and every beat it names, for the tests.
export const storyCheck = (def) => {
  const bad = [];
  Object.entries(def.beats).forEach(([id, B]) => (B.opts || []).forEach(o => {
    const ns = [o.next, o.bill && o.bill.pass, o.bill && o.bill.fail, o.order && o.order.struck, o.win && o.win.next, o.lose && o.lose.next].filter(Boolean);
    ns.forEach(n => { if (!def.beats[n]) bad.push(id + "." + o.id + " → " + n); });
    if (!o.close && !ns.length && o.kind !== "bill") bad.push(id + "." + o.id + " goes nowhere");
    if (!KINDS[o.kind]) bad.push(id + "." + o.id + " has no kind");
  }));
  if (!def.beats[def.start]) bad.push("no start");
  (def.starts || []).forEach(b => { if (!def.beats[b]) bad.push("no start " + b); });
  if (def.boil && !def.beats[def.boil]) bad.push("no boil");
  return bad;
};

/* ── The President's national crises ──
   Costs are in ₦B of the federal year (about ₦620B to spend). */
const P = (id, l, x) => ({ id, kind: "programme", l, ...x });
const BL = (id, l, nm, pass, fail, x) => ({ id, kind: "bill", l, bill: { nm, pass, fail }, cost: 2, ...x });
const OR = (id, l, nm, next, risk, struck, x) => ({ id, kind: "order", l, next, order: { nm, risk, struck }, cost: 1, ...x });
const A = (id, l, x) => ({ id, kind: "act", l, ...x });

export const FUEL = { id: "fuel", nm: "The fuel crisis", who: "petroleum-minister", bg: "villa-office", start: "queues", starts: ["queues", "inferno", "refinery_fire"], boil: "nupeng", heat0: 55, drift: 4, scale: 1, learn: "subsidy",
  legacy: "Ended the fuel queues: Nigeria refines its own petrol.", faded: "The fuel crisis faded from the front pages without being solved.",
  order: ["queues", "subsidy_bill", "cap_holds", "new_importers", "atlas", "scarcity", "refined"],
  beats: {
    queues: { t: "The queues are back", scene: "fuel-queue", d: "Petrol stations are dry from Lagos to Maiduguri. Okada fares have doubled, food prices follow, and the Petroleum Minister says the importers have stopped ordering.",
      opts: [P("subsidy", "Pay the subsidy and flood the market", { cost: 100, fx: { app: 4 }, heat: -8, next: "subsidy_bill", past: "paid the subsidy to end the queues", say: "The tankers roll by Friday and the queues melt. The bill lands on your desk next month." }),
        BL("dereg", "Send a Downstream Deregulation Bill to the National Assembly", "Downstream Petroleum (Deregulation) Bill", "dereg_law", "lobby", { heat: -2, past: "sent a Downstream Deregulation Bill to the National Assembly", say: "The bill is with the Senate. The importers' lobby is already calling senators." }),
        OR("cap", "Executive order: cap the pump price and seize hoarded stock", "the Pump Price Order", "cap_holds", .6, "court_cap", { fx: { app: 3 }, heat: -4, past: "capped the pump price by executive order", say: "The regulator seized twelve depots of hoarded petrol. Pumps open at your price, for now." }),
        A("blame", "Blame the marketers and arrest a few depot owners", { fx: { app: 1 }, heat: 6, weak: true, next: "scarcity", past: "blamed the marketers and arrested a few depot owners", say: "Six depot owners are in cells. The tankers still are not moving." })] },
    inferno: { t: "A tanker inferno, and empty pumps", startOnly: true, scene: "fuel-queue", who: "labour-leader", d: "A petrol tanker overturned and exploded on the Lagos–Ibadan expressway: fifty-two dead. The tanker drivers say they will not load another litre until the roads are fixed, and the pumps are already running dry.",
      opts: [P("roads", "Emergency repairs on the tanker routes, and the drivers' safety demands met", { cost: 70, fx: { app: 3 }, heat: -8, next: "subsidy_bill", past: "repaired the tanker routes and met the drivers' safety demands", say: "The drivers are loading again. The road crews work through the night." }),
        BL("rail", "A Rail Freight Bill: move fuel by rail, not road", "Rail Freight (Petroleum Products) Bill", "new_importers", "scarcity", { past: "sent a Rail Freight Bill to move fuel by rail", say: "If it passes, the tankers come off the worst roads for good." }),
        OR("old", "Executive order: ban unsafe old tankers from the highways", "the Tanker Safety Order", "scarcity", .3, "nupeng", { fx: { app: 2 }, heat: 2, past: "banned unsafe old tankers by order", say: "A third of the tanker fleet is off the road. So is a third of the fuel." }),
        A("blame", "Blame reckless drivers", { weak: true, heat: 6, next: "nupeng", past: "blamed the tanker drivers for the inferno", say: "The drivers' union heard you." })] },
    refinery_fire: { t: "The rehabilitated refinery catches fire", startOnly: true, who: "petroleum-minister", scene: "fuel-queue", d: "The Port Harcourt refinery, rehabilitated for $1.5 billion and opened with a ribbon three months ago, is on fire. The queues are back by evening, and the repair contractor has stopped answering calls.",
      opts: [OR("audit", "Executive order: a forensic audit of the rehabilitation contract", "the Refinery Audit Order", "new_importers", .3, "cartel", { fx: { app: 3, cor: -.01 }, heat: -2, past: "ordered a forensic audit of the refinery contract", say: "The auditors are in. The contractor's lawyers are too." }),
        P("import", "Import to cover the gap while it burns", { cost: 90, fx: { app: 2 }, heat: -6, next: "subsidy_bill", past: "imported fuel to cover the burned refinery", say: "Cargoes are coming. At the subsidised price." }),
        BL("concession", "A bill to concession the state refineries to private operators", "State Refineries (Concession) Bill", "atlas", "lobby", { past: "sent a bill to concession the state refineries", say: "If it passes, the refineries leave the state's hands." }),
        A("repair", "Another repair contract, fast", { cost: 60, fx: { cor: .04 }, weak: true, heat: 4, next: "scarcity", past: "signed yet another refinery repair contract", say: "A new contractor. The old one's friends." })] },
    subsidy_bill: { t: "The subsidy bill has doubled", who: "finance-minister", bg: "finance-ministry-office", d: "Petrol is now cheaper here than anywhere in West Africa, so it leaves at night in jerrycans and tankers. The subsidy cost twice what was budgeted, and the Finance Minister cannot pay contractors.",
      opts: [P("again", "Pay it again: the queues must not return", { cost: 120, fx: { app: 2 }, heat: -3, weak: true, next: "smuggling", past: "paid the subsidy a second time", say: "Paid. The smugglers thank you." }),
        OR("border", "Executive order: close the land borders to petrol tankers", "the Border Fuel Order", "border_trade", .35, "smuggling", { fx: { app: -1 }, heat: -6, past: "closed the land borders to petrol tankers by executive order", say: "The borders are shut to tankers. Customs say the smugglers are already looking for bush paths." }),
        P("end", "End the subsidy, with cash transfers to ten million homes", { cost: 60, fx: { app: -6, igr: 30 }, npc: { cbn: 6 }, heat: -6, hook: "nlc_fuel", next: "pump_shock", past: "ended the subsidy, with cash transfers to the poorest homes", say: "The subsidy is gone. The NLC has called an emergency meeting." })] },
    cap_holds: { t: "Your price cap: half the stations shut", scene: "fuel-queue", d: "The cap holds at the pumps that still sell. The importers say they lose ₦90 on every litre and have stopped ordering; jerrycans on the black market sell at three times your price.",
      opts: [P("gap", "Pay the importers the gap under the cap", { cost: 90, fx: { app: 2 }, heat: -5, next: "subsidy_bill", past: "paid importers the gap under the price cap", say: "The importers are ordering again, on the government's money." }),
        OR("licence", "Lift the cap and license forty new importers by order", "the Import Licensing Order", "new_importers", .25, "scarcity", { fx: { app: -2 }, heat: -6, past: "lifted the cap and licensed forty new importers by order", say: "Forty new licences. The old cartel is furious." }),
        A("nnpc", "Order the national oil company to import it all", { cost: 40, fx: { cor: .02 }, heat: 4, weak: true, next: "scarcity", past: "made the national oil company import all the petrol", say: "The oil company has the job. Its last import contract is still in court." })] },
    court_cap: { t: "The court strikes down your price cap", who: "judge", bg: "courtroom", scene: "news-court-steps", endOnly: true, d: "The Federal High Court rules that only the regulator can fix prices under the Petroleum Industry Act. The marketers celebrate; the queues return the same afternoon.",
      opts: [BL("stab", "Make it law: a Fuel Price Stabilisation Bill", "Fuel Price Stabilisation Bill", "reserve", "scarcity", { past: "sent a Fuel Price Stabilisation Bill to the Assembly", say: "The bill goes to the Assembly. The marketers' lawyers are already reading it." }),
        P("reserve", "Fund the regulator to build a strategic fuel reserve", { cost: 70, heat: -8, next: "reserve", past: "funded a strategic fuel reserve", say: "Depots will hold sixty days of fuel. The next queue will meet a full tank." }),
        A("shrug", "Accept the ruling and wait", { weak: true, heat: 5, next: "scarcity", past: "accepted the court's ruling and waited", say: "You wait. The queues do not." })] },
    lobby: { t: "The importers' lobby wins a round", who: "lobbyist", bg: "senate-chamber", d: "Your deregulation bill died in committee. Three of the senators who killed it own shares in import companies; a newspaper has the documents.",
      opts: [A("expose", "Publish the names and the documents", { fx: { app: 3 }, npc: { nass: -10 }, next: "cartel", past: "published the names of the senators tied to the import cartel", say: "The documents are on every front page. The senators are not laughing." }),
        BL("again", "Rewrite it with the governors on board and send it back", "Downstream Petroleum (Deregulation) Bill, second reading", "dereg_law", "scarcity", { npc: { gov: 4 }, past: "sent the deregulation bill back, rewritten with the governors", say: "Thirty governors signed a letter backing it. The Senate will feel that." }),
        P("subsidy", "Pay the subsidy while you regroup", { cost: 100, weak: true, next: "subsidy_bill", past: "paid the subsidy while the bill was dead", say: "The queues ease. The cartel has won." })] },
    cartel: { t: "The cartel strikes back", who: "senate-president", bg: "senate-hearing-room", d: "The senators you named have opened a probe into your Petroleum Minister, and the importers have stopped ordering 'until the noise dies down'. Lagos has nine days of petrol.",
      opts: [BL("sack", "Replace the minister and send the deregulation bill again", "Downstream Petroleum (Deregulation) Bill", "dereg_law", "scarcity", { npc: { nass: 4 }, past: "replaced the Petroleum Minister and resubmitted the deregulation bill", say: "A new minister, the same bill. The Senate has lost its excuse." }),
        A("stand", "Stand by the minister and fight the probe", { odds: .5, npc: { nass: -4 }, win: { next: "new_importers", past: "faced down the Senate's probe", say: "The probe found nothing. Importers who sat it out are ordering again." }, lose: { next: "scarcity", weak: true, past: "fought the Senate's probe and lost", say: "The probe found something after all. The importers wait." } }),
        P("import", "Have the national oil company import while the fight goes on", { cost: 80, fx: { cor: .01 }, next: "new_importers", past: "had the national oil company import fuel while you fought the cartel", say: "The tankers move, at a premium." })] },
    dereg_law: { t: "Deregulation is law: prices find their level", scene: "market-inflation", d: "The Downstream Deregulation Act is law. The pump price jumped 70% overnight; importers are flooding in and the queues have vanished. Okada fares doubled, and the NLC is counting.",
      opts: [P("buses", "Cash transfers, and gas-powered buses for commuters", { cost: 70, fx: { app: 4 }, heat: -10, next: "atlas", past: "paid cash transfers and bought gas-powered buses for commuters", say: "Five thousand buses on the roads, fares halved on them. The anger cools." }),
        BL("wage", "A Minimum Wage Review Bill to match the new prices", "Minimum Wage (Review) Bill", "atlas", "nlc", { npc: { gov: -6 }, past: "sent a minimum wage review bill to the Assembly", say: "The governors say they cannot pay it. The NLC says it is a start." }),
        A("hold", "Hold the line: the market will settle", { fx: { app: -4 }, heat: 4, weak: true, next: "nlc", past: "told Nigerians the market would settle", say: "The market will settle. Nigerians cannot wait that long." })] },
    pump_shock: { t: "Petrol triples overnight", who: "labour-leader", scene: "market-inflation", d: "With the subsidy gone, the pump price has tripled. Bus fares follow, then food. The NLC has given you fourteen days.",
      opts: [P("transfers", "Double the cash transfers and pay a wage award", { cost: 60, fx: { app: 3 }, heat: -6, next: "atlas", past: "doubled the cash transfers and paid a wage award", say: "The award lands in December. The NLC suspends its ultimatum." }),
        OR("vat", "Executive order: suspend VAT on diesel, kerosene and cooking gas", "the Energy VAT Order", "new_importers", .2, "scarcity", { fx: { app: 2, igr: -10 }, past: "suspended VAT on diesel, kerosene and cooking gas by order", say: "Cooking gas is a little cheaper this week. The states want to know who will make up their share of the VAT." }),
        P("half", "Bring back half the subsidy", { cost: 60, weak: true, next: "subsidy_bill", past: "brought back half the subsidy", say: "Half back. Investors take note that you blink." })] },
    border_trade: { t: "The border towns are starving", who: "ecowas-envoy", bg: "foreign-ministry-meeting", scene: "refugees-border", d: "With the borders shut to tankers, the rice and onion trucks stopped too. Border towns say they are starving, and Benin has complained to ECOWAS.",
      opts: [P("corridor", "Open a scanned trade corridor: food in, fuel out", { cost: 40, heat: -6, next: "new_importers", past: "opened a scanned trade corridor at the border", say: "Scanners at Seme and Idiroko. Food moves; the jerrycans do not." }),
        A("ecowas", "Negotiate a regional fuel price deal at ECOWAS", { odds: .5, win: { next: "new_importers", heat: -8, past: "agreed a regional fuel price deal at ECOWAS", say: "One price across the region. There is nothing left to smuggle for." }, lose: { next: "smuggling", weak: true, past: "failed to agree a regional fuel price deal", say: "The summit split. Benin wants compensation first." } }),
        A("hold", "Keep the borders shut", { fx: { app: -2 }, weak: true, next: "smuggling", past: "kept the borders shut", say: "Shut. The smugglers find new paths." })] },
    smuggling: { t: "The smugglers' war", who: "inspector-general", bg: "situation-room", d: "Petrol smugglers travel with armed escorts now. A customs officer was shot dead at Idiroko last week. Your subsidy is paying for a criminal economy.",
      opts: [BL("offences", "A Petroleum Smuggling (Special Offences) Bill", "Petroleum Smuggling (Special Offences) Bill", "new_importers", "scarcity", { past: "sent a Petroleum Smuggling (Special Offences) Bill to the Assembly", say: "Twenty years for smuggling fuel, if it passes." }),
        P("customs", "Arm the customs and post soldiers on the border", { cost: 50, fx: { sec: 3 }, npc: { army: 3 }, heat: -6, next: "new_importers", past: "armed the customs and posted soldiers on the border", say: "The escorts are outgunned now. Three convoys seized in a week." }),
        P("end", "End the subsidy: there will be nothing to smuggle", { cost: 60, fx: { app: -6, igr: 30 }, hook: "nlc_fuel", next: "pump_shock", past: "ended the subsidy to kill the smuggling trade", say: "No subsidy, no smugglers. The NLC is meeting tonight." })] },
    new_importers: { t: "New importers, and one big refinery", who: "investor-nigerian", bg: "villa-office", d: "The new licences brought cargoes and the queues eased. Now Atlas Petroleum, a private refinery outside Lagos, says it can supply the whole country, but it has terms.",
      opts: [A("meet", "Hear Atlas Petroleum out", { next: "atlas", past: "agreed to hear Atlas Petroleum's terms", say: "Chief Atanda-Hassan will see you at the Villa next week." }),
        P("modular", "Back small modular refineries in the Delta instead", { cost: 50, heat: -6, next: "modular", past: "backed small modular refineries in the Niger Delta", say: "Twelve sites in four states. The oil-producing communities are listening." }),
        BL("compete", "A Downstream Competition Bill: no single supplier above 40%", "Downstream Competition Bill", "atlas", "monopoly", { past: "sent a Downstream Competition Bill to the Assembly", say: "Atlas's lawyers have read it. So have the senators it lunches with." })] },
    atlas: { t: "Atlas Petroleum wants its terms", who: "investor-nigerian", bg: "villa-office", d: "Atlas Petroleum's refinery can supply most of the country's petrol. Its chairman, Chief Bayo Atanda-Hassan, wants crude sold to him in naira, dollars at the official rate, and a ban on petrol imports.",
      opts: [OR("grant", "Grant it all by executive order", "the Refinery Supply Order", "monopoly", .3, "atlas_walks", { fx: { app: 2, cor: .02 }, heat: -10, past: "granted Atlas Petroleum its terms by executive order", say: "Signed. The importers are calling their lawyers." }),
        BL("refining", "A Domestic Refining Bill: crude for every local refinery, no import ban", "Domestic Refining Bill", "refined", "atlas_walks", { past: "sent a Domestic Refining Bill to the Assembly instead of granting Atlas a monopoly", say: "Every refinery gets crude on the same terms. Atlas says it is 'studying' the bill." }),
        A("refuse", "Refuse: no one company gets a monopoly", { weak: true, next: "atlas_walks", past: "refused Atlas Petroleum's terms", say: "Refused. Atlas has buyers in Ghana and Senegal." })] },
    monopoly: { t: "One refinery, one price", who: "investor-nigerian", scene: "market-inflation", d: "Atlas now supplies 80% of the country's petrol and has raised its price twice. Its chairman dines at the Villa; the newspapers call it a monopoly you created.",
      opts: [BL("compete", "A Competition Bill to break the monopoly", "Downstream Competition Bill", "refined", "scarcity", { npc: { party: -4 }, past: "sent a Competition Bill to break Atlas's monopoly", say: "Atlas's chairman did not come to dinner this week." }),
        OR("capatlas", "Order the regulator to cap Atlas's price", "the Refinery Price Order", "refined", .4, "atlas_walks", { fx: { app: 3 }, past: "ordered the regulator to cap Atlas's price", say: "Capped. Atlas says it will 'review its supply commitments'." }),
        A("accept", "Leave it: at least there are no queues", { fx: { cor: .03 }, weak: true, next: "scarcity", past: "let Atlas set its own price", say: "No queues. No competition either." })] },
    atlas_walks: { t: "Atlas walks away", who: "petroleum-minister", scene: "fuel-queue", d: "Atlas Petroleum has sold this month's cargoes to Ghana and Senegal. The depots will be empty by Friday.",
      opts: [P("import", "Emergency imports while you talk", { cost: 90, heat: -4, next: "monopoly", past: "paid for emergency imports after Atlas walked away", say: "The ships are coming. So is Atlas's chairman, with a smaller list." }),
        OR("requisition", "Emergency order: requisition Atlas's stock", "the Fuel Requisition Order", "refined", .7, "scarcity", { npc: { party: -6 }, past: "requisitioned Atlas's stock by emergency order", say: "Soldiers at the refinery gates. Investors are watching how this ends." }),
        A("wait", "Wait for Atlas to come back", { weak: true, next: "scarcity", past: "waited for Atlas to come back", say: "You wait. The queues are back first." })] },
    modular: { t: "Modular refineries in the Delta", who: "oil-community-leader", bg: "oil-creek-spill", d: "Twelve small refineries are rising near the oil fields. The host communities want jobs and a share; youths attacked one site because, they say, they were promised work.",
      opts: [P("equity", "Give the host communities 10% and the jobs", { cost: 30, heat: -8, next: "refined", past: "gave host communities a share of the modular refineries", say: "The youths are on the payroll now. The site is quiet." }),
        BL("trust", "A Host Communities Trust Bill", "Host Communities Trust Bill", "refined", "scarcity", { past: "sent a Host Communities Trust Bill to the Assembly", say: "If it passes, the communities own a share by law." }),
        OR("guard", "Order the army to guard the sites", "the Refinery Security Order", "scarcity", .2, "scarcity", { npc: { army: 2 }, fx: { app: -1 }, weak: true, past: "ordered soldiers to guard the refinery sites", say: "Soldiers at the gates. The youths are in the creeks now." })] },
    reserve: { t: "The strategic reserve, and the depot contracts", who: "party-chairman", bg: "party-convention-hall", d: "Sixty days of fuel are filling depots across the country. The depot contracts are worth billions, and the party has a list of 'competent contractors'.",
      opts: [P("tender", "Open tender, every bid published", { cost: 30, npc: { party: -6 }, next: "new_importers", past: "awarded the reserve depots by open tender", say: "The bids are online. Two of the party's contractors lost." }),
        A("party", "Give the party its contractors", { fx: { cor: .04 }, npc: { party: 8 }, weak: true, next: "scarcity", past: "gave the reserve depots to the party's contractors", say: "The party is pleased. The depots will be finished 'soon'." }),
        OR("publish", "Executive order: publish the reserve's stock every week", "the Reserve Transparency Order", "new_importers", .1, "new_importers", { fx: { app: 2 }, past: "ordered the fuel reserve's stock published every week", say: "Every Monday, the stock in every depot, online. Nobody can drain it in secret." })] },
    nlc: { t: "The NLC's ultimatum over prices", who: "nlc-president", scene: "nlc-march", d: "The Nigeria Labour Congress says the new prices have halved the value of a worker's wage. Fourteen days, or every worker stays at home.",
      opts: [P("award", "A wage award and transport allowances", { cost: 50, fx: { app: 2 }, heat: -4, next: "atlas", past: "paid a wage award to head off the NLC", say: "The award is on its way. The NLC calls it 'a start'." }),
        A("ignore", "Ignore it: they always threaten", { weak: true, hook: "nlc_fuel", next: "scarcity", past: "ignored the NLC's ultimatum over fuel prices", say: "Fourteen days. Then the strike." }),
        BL("wage", "A minimum wage bill, with a review every two years", "Minimum Wage (Review) Bill", "atlas", "scarcity", { past: "sent a minimum wage review bill to the Assembly", say: "The NLC will wait for the vote. Not for long." })] },
    scarcity: { t: "Kerosene and cooking gas run out too", scene: "fuel-queue", d: "It is not just petrol now. Kerosene costs three times last year's price, cooking-gas cylinders sit empty, and families are cutting trees for firewood. NUPENG warns its tanker drivers will stop next.",
      opts: [P("emergency", "Emergency imports of petrol, kerosene and gas", { cost: 110, fx: { app: 2 }, heat: -8, next: "new_importers", past: "paid for emergency imports of petrol, kerosene and gas", say: "The ships are coming. Nigeria is paying the highest price in Africa for them." }),
        OR("duties", "Executive order: suspend all duties on gas and kerosene", "the Household Fuels Order", "new_importers", .2, "nupeng", { fx: { app: 2, igr: -8 }, past: "suspended duties on gas and kerosene by order", say: "Duty-free from Monday. The importers have no excuse." }),
        A("wait", "Wait it out: the market will correct", { fx: { app: -4 }, heat: 8, weak: true, next: "nupeng", past: "waited for the fuel market to correct itself", say: "NUPENG has called an emergency meeting." })] },
    nupeng: { t: "NUPENG parks the tankers", who: "labour-leader", scene: "fuel-queue", hook: "nupeng", d: "The oil and gas workers' union has parked every tanker in the country. Not a litre moves. Hospitals are on their last diesel; airlines are cancelling flights.",
      opts: [P("meet", "Meet NUPENG: safety, pay and the roads they drive", { cost: 60, heat: -10, hook: "nupeng_end", next: "atlas", past: "settled with NUPENG on pay, safety and roads", say: "The tankers are moving. The roads they asked for go into next year's budget." }),
        OR("army", "Order soldiers to drive the tankers", "the Essential Supplies Order", "atlas", .5, "scarcity", { fx: { app: -3 }, npc: { army: -4 }, hook: "nupeng", past: "ordered soldiers to drive the tankers", say: "Soldiers at the wheel. The union says it will remember this." }),
        BL("essential", "An Essential Services Bill: no strikes in fuel supply", "Essential Services Bill", "atlas", "scarcity", { fx: { app: -2 }, hook: "nupeng", past: "sent an Essential Services Bill to the Assembly to ban fuel strikes", say: "The unions call it slavery. The bill goes to the Assembly." })] },
    refined: { t: "Petrol refined at home", scene: "money-investor-factory", d: "For the first time in thirty years, Nigeria refines more petrol than it imports. The depots are full and the queues are a memory. What you do now decides whether they stay one.",
      opts: [P("depots", "Commission the depots and keep the reserve full", { cost: 20, fx: { app: 5 }, close: true, past: "ended the fuel crisis", say: "Ribbons cut in Lagos, Kano and Port Harcourt. The fuel crisis is over." }),
        BL("law", "Write the reserve into law, so no successor can drain it", "Strategic Fuel Reserve Bill", "refined", "refined", { close: true, fx: { app: 3 }, past: "ended the fuel crisis and wrote the reserve into law", say: "The crisis is over. The bill makes sure it stays over." }),
        OR("export", "Order the first cargo of refined petrol exported", "the Export Order", "refined", 0, "refined", { close: true, fx: { app: 4, igr: 10 }, past: "ended the fuel crisis", say: "A Nigerian tanker leaves Lagos for Dakar, full of Nigerian petrol. The crisis is over." })] },
  } };

export const INSURGENCY = { id: "insurgency", nm: "The insurgency in the North-East", who: "national-security-adviser", bg: "situation-room", start: "base", starts: ["base", "girls", "drones"], boil: "capital", heat0: 55, drift: 4, scale: 1, learn: "armed",
  legacy: "Broke the insurgency in the North-East.", faded: "The insurgency ground on, never defeated and never decisive.",
  order: ["base", "splinter", "highway", "spread", "vigilantes", "returns", "dwindle"],
  beats: {
    base: { t: "An army base is overrun in Borno", d: "Insurgents took a forward base overnight. Forty soldiers are missing. The National Security Adviser says the fighters were paid, fed and armed by someone with money.",
      opts: [P("surge", "Reinforcements, armoured vehicles and drones", { cost: 80, fx: { sec: 5 }, npc: { army: 6 }, heat: -10, next: "splinter", past: "sent reinforcements and drones to the North-East", say: "The base is retaken in three days. The insurgents melted into the forest." }),
        BL("finance", "A Terrorism Financing Amendment Bill: follow the money", "Terrorism Financing (Amendment) Bill", "sponsors", "spread", { past: "sent a Terrorism Financing Bill to the Assembly", say: "If it passes, the EFCC can trace every naira that buys a bullet." }),
        OR("bikes", "Executive order: ban motorcycles and shut the cattle markets in three states", "the Borno Movement Order", "hunger", .3, "spread", { fx: { app: -2 }, heat: -6, past: "banned motorcycles and shut cattle markets in three states by order", say: "No motorcycles, no cattle markets. The fighters cannot move, and neither can the farmers." }),
        A("talk", "Open back-channel talks through local leaders", { npc: { army: -5 }, heat: -3, next: "ceasefire", past: "opened back-channel talks with the insurgents", say: "The elders have carried your message into the forest." }),
        A("statement", "A strong statement from the Villa", { heat: 4, weak: true, next: "spread", past: "answered the overrun base with a statement", say: "Strong words. The insurgents were not listening." })] },
    girls: { t: "Two hundred schoolgirls are taken", startOnly: true, who: "teacher", bg: "classroom", d: "Gunmen stormed a girls' boarding school in Yobe at night and took two hundred pupils. Their parents are at the gates of the state government house, and the world is watching you.",
      opts: [P("rescue", "Order a rescue mission and fly to the parents", { cost: 60, odds: .55, npc: { army: 3 }, win: { fx: { app: 6, sec: 3 }, heat: -10, next: "splinter", past: "rescued the schoolgirls", say: "Every girl is home. The commander who planned it is dead." }, lose: { fx: { app: -2 }, heat: 2, next: "highway", past: "ordered a rescue that freed only half the girls", say: "Ninety girls are home. The rest were moved before the troops arrived." } }),
        A("ransom", "Let negotiators pay, quietly", { cost: 30, fx: { app: 2, cor: .02 }, weak: true, next: "highway", past: "let negotiators pay for the schoolgirls", say: "The girls are home. The kidnappers have a price list." }),
        BL("ransom_law", "An Anti-Kidnapping Bill: paying a ransom becomes a crime", "Kidnapping and Ransom (Prohibition) Bill", "ransom_ban", "highway", { past: "sent a bill to make ransom payments a crime while the girls were held", say: "The parents are horrified. The law would end the trade." }),
        OR("emergency", "Declare a state of emergency in the state", "the Emergency Proclamation", "hunger", .35, "spread", { npc: { gov: -10 }, heat: -4, past: "declared a state of emergency after the abduction", say: "Emergency rule. The governor is furious; the army has a free hand." })] },
    drones: { t: "Insurgents strike with armed drones", startOnly: true, who: "chief-of-army-staff", scene: "air-strike", d: "Insurgents attacked a brigade headquarters with armed drones bought abroad. Twelve soldiers dead. The army says it has nothing to stop them, and the drones were paid for in dollars.",
      opts: [P("jam", "Buy jammers and counter-drone systems", { cost: 70, fx: { sec: 4 }, npc: { army: 6 }, heat: -8, next: "splinter", past: "bought counter-drone systems for the army", say: "The next drone fell out of the sky. Its pilot was found in a week." }),
        BL("finance", "A Terrorism Financing Amendment Bill: follow the dollars", "Terrorism Financing (Amendment) Bill", "sponsors", "spread", { past: "sent a Terrorism Financing Bill to follow the drone money", say: "The dollars came from somewhere. The bill would find out." }),
        OR("imports", "Executive order: licence every drone sold in Nigeria", "the Drone Licensing Order", "spread", .3, "spread", { heat: -2, past: "required a licence for every drone sold in Nigeria", say: "Licensed. The insurgents never bought theirs here." }),
        A("statement", "A strong statement from the Villa", { weak: true, heat: 5, next: "spread", past: "answered the drone attack with a statement", say: "Strong words. The drones keep flying." })] },
    splinter: { t: "A splinter group has formed", who: "defence-minister", d: "The Minister of Defence reports the offensive worked: the old commander is dead. But his deputy, a man called Ameer Bulama, has split away with three hundred fighters, and they have turned to kidnapping on the highways for money.",
      opts: [P("hunt", "Special forces and a bounty on Bulama", { cost: 50, odds: .5, npc: { army: 3 }, win: { next: "returns", heat: -12, past: "had special forces kill Ameer Bulama", say: "Bulama is dead. His men are surrendering in twos and threes." }, lose: { next: "highway", heat: -2, past: "sent special forces after Ameer Bulama, who escaped", say: "He was warned. He is on the highways now." } }),
        BL("ransom", "An Anti-Kidnapping Bill: paying a ransom becomes a crime", "Kidnapping and Ransom (Prohibition) Bill", "ransom_ban", "highway", { past: "sent a bill to make paying ransom a crime", say: "Starve them of ransom and kidnapping stops paying. Families are horrified." }),
        OR("freeze", "Executive order: freeze every account tied to ransom payments", "the Ransom Accounts Order", "sponsors", .25, "highway", { past: "froze accounts tied to ransom payments by order", say: "Two hundred accounts frozen, including a bureau de change in Kano." }),
        A("states", "Leave the highways to the state governors", { weak: true, next: "highway", past: "left the highways to the state governors", say: "The governors say they have no army." })] },
    highway: { t: "The Abuja–Kaduna highway is a hunting ground", scene: "kidnap-camp-empty", d: "Travellers are taken every week; last night gunmen stopped a bus and marched twenty passengers into the forest. The train line was attacked too. Abuja's elite now fly the forty-minute trip.",
      opts: [P("patrol", "A highway patrol force, with helicopters", { cost: 70, fx: { sec: 4 }, heat: -8, next: "vigilantes", past: "set up a highway patrol force with helicopters", say: "Patrols every ten kilometres. The buses are running full again." }),
        OR("night", "Executive order: close the highway at night", "the Highway Curfew Order", "vigilantes", .2, "capital", { fx: { app: -2 }, heat: -4, past: "closed the Abuja–Kaduna highway at night by order", say: "Closed from dusk. Traders lose a day each way." }),
        A("pay", "Let families pay quietly", { fx: { cor: .02 }, weak: true, next: "capital", past: "let families pay ransoms quietly", say: "The ransoms are paid. The kidnappers buy more guns." })] },
    sponsors: { t: "The money leads to a senator", who: "efcc-chairman", d: "The money trail runs through a bureau de change in Kano, a cattle trader, and a serving senator of your own party. The EFCC wants your go-ahead.",
      opts: [A("charge", "Let the EFCC charge them all, the senator included", { fx: { app: 4 }, npc: { nass: -10, party: -6 }, heat: -10, next: "revenge", past: "let the EFCC charge the insurgents' sponsors, a senator included", say: "Charged. The senator says it is a political witch-hunt. The evidence says otherwise." }),
        A("spare", "Charge the traders; leave the senator", { fx: { cor: .03 }, npc: { party: 4 }, weak: true, next: "spread", past: "spared the senator who funded the insurgents", say: "The traders are charged. The senator keeps his seat, and his friends." }),
        OR("register", "Executive order: a public register of every bureau de change owner", "the Bureau de Change Order", "dwindle", .3, "spread", { past: "ordered a public register of bureau de change owners", say: "Every owner named online. Half the bureaux closed overnight." })] },
    ceasefire: { t: "A ceasefire, at a price", who: "traditional-ruler-emir", bg: "emirs-palace-courtyard", d: "Through the emir and the elders, the insurgents offer a ninety-day ceasefire if forty of their fighters are freed from detention.",
      opts: [A("swap", "Free the forty for the ceasefire", { odds: .5, npc: { army: -6 }, win: { next: "amnesty", heat: -10, past: "freed forty fighters for a ceasefire that held", say: "The guns are quiet. Fighters are asking how to come in." }, lose: { next: "betrayal", heat: 6, weak: true, past: "freed forty fighters for a ceasefire that broke", say: "The forty went straight back to the forest." } }),
        BL("amnesty", "An Amnesty and Reintegration Bill, with a truth commission", "Amnesty and Reintegration Bill", "amnesty", "betrayal", { past: "sent an Amnesty and Reintegration Bill to the Assembly", say: "Victims' groups want the truth commission first. The army wants no amnesty at all." }),
        A("refuse", "Refuse: no deals with terrorists", { npc: { army: 4 }, heat: 4, next: "spread", past: "refused the insurgents' ceasefire offer", say: "Refused. The emir says you have closed the last door." })] },
    amnesty: { t: "The amnesty camps fill up", scene: "idp-return", d: "Two thousand fighters have surrendered into the deradicalisation camps. Victims' families march in Maiduguri: 'You are paying the men who killed our children.'",
      opts: [P("victims", "Fund the camps, and a compensation fund for the victims", { cost: 60, fx: { app: 2 }, heat: -8, next: "returns", past: "funded the amnesty camps and a victims' compensation fund", say: "The victims are paid first. The march ends at the compensation office." }),
        OR("release", "Release the first batch home by order", "the Reintegration Order", "returns", .4, "backtobush", { fx: { app: -2 }, heat: -4, past: "released the first batch of former fighters home by order", say: "Three hundred men go home. Their neighbours are not sure they want them." }),
        A("cut", "Cut the camp budget: it is unpopular", { weak: true, next: "backtobush", past: "cut the amnesty camps' budget", say: "The camps are half-fed now." })] },
    backtobush: { t: "Former fighters slip back to the bush", who: "national-security-adviser", d: "Three hundred 'repentant' fighters walked out of a camp near Gombe and rejoined the insurgents, with the training and the food you gave them.",
      opts: [P("hunt", "Hunt them down before they regroup", { cost: 50, fx: { sec: 3 }, heat: -6, next: "dwindle", past: "hunted down the fighters who left the amnesty camp", say: "Most are recaptured within a month." }),
        BL("tag", "A bill: electronic monitoring for every former fighter", "Reintegration Monitoring Bill", "dwindle", "spread", { past: "sent a bill to monitor every former fighter", say: "Ankle tags for the amnesty. Rights groups object." }),
        A("blame", "Blame the camp commandant", { weak: true, next: "spread", past: "blamed the camp commandant for the escape", say: "The commandant is sacked. The three hundred are still out there." })] },
    betrayal: { t: "The ceasefire is broken", scene: "market-fire-aftermath", d: "Fighters you freed led an attack on the Monday market in Konduga. Thirty dead. The army chief says 'we told you so'.",
      opts: [P("surge", "An all-out offensive", { cost: 90, fx: { sec: 5 }, npc: { army: 6 }, heat: -10, next: "splinter", past: "launched an all-out offensive after the ceasefire broke", say: "The army is in the forest. It will be a long year." }),
        BL("police", "A State Police amendment: let the states defend themselves", "Constitution (State Police) Amendment Bill", "state_police", "capital", { npc: { gov: 8, army: -4 }, past: "sent a state police amendment to the Assembly", say: "The governors cheer. The amendment needs two-thirds of both houses and 24 state assemblies." }),
        A("silence", "Say nothing: it will blow over", { weak: true, next: "capital", past: "said nothing after the ceasefire broke", say: "It does not blow over." })] },
    hunger: { t: "Hunger in the North-East", who: "village-head", bg: "northern-farmland", d: "With motorcycles banned and the cattle markets shut, farmers cannot reach their fields. Aid agencies warn of famine, and recruiters are offering young men food.",
      opts: [P("food", "Feed the displaced and pay farmers to plant", { cost: 60, fx: { app: 3 }, heat: -6, next: "returns", past: "fed the displaced and paid farmers to plant", say: "Seed and food in every camp. The recruiters have less to offer." }),
        OR("lift", "Lift the ban in the safe local government areas, by order", "the Safe Zones Order", "vigilantes", .2, "spread", { fx: { app: 2 }, past: "lifted the motorcycle ban in the safe areas", say: "Motorcycles back in six LGAs. The markets reopen under guard." }),
        A("keep", "Keep the ban: security first", { weak: true, heat: 4, next: "spread", past: "kept the motorcycle ban despite the hunger", say: "The ban holds. So does the hunger." })] },
    spread: { t: "The insurgency reaches a new state", scene: "sit-at-home-street", d: "Insurgents have struck in Kogi: a church and a mosque in the same week. They are no longer the North-East's problem. They are Nigeria's.",
      opts: [P("surge", "Move two brigades to the new front", { cost: 80, fx: { sec: 4 }, heat: -8, next: "vigilantes", past: "moved two brigades to the new front", say: "Soldiers in Kogi. The North-East is thinner now." }),
        BL("police", "A State Police amendment", "Constitution (State Police) Amendment Bill", "state_police", "capital", { npc: { gov: 8, army: -4 }, past: "sent a state police amendment to the Assembly", say: "The governors have wanted this for years." }),
        OR("emergency", "Declare a state of emergency in two states", "the Emergency Proclamation", "vigilantes", .35, "capital", { npc: { gov: -10 }, heat: -6, past: "declared a state of emergency in two states", say: "Emergency rule. The governors say you have suspended democracy." }),
        A("blame", "Blame the governors for weak policing", { weak: true, npc: { gov: -6 }, next: "capital", past: "blamed the governors for the spread", say: "The governors blame you back. The insurgents do not care." })] },
    vigilantes: { t: "The vigilantes you armed", who: "vigilante-guard", bg: "village-square", d: "Twenty-six thousand vigilantes of the Civilian Joint Task Force helped the army retake the towns. Now they want salaries, and some run their own checkpoints and tax travellers.",
      opts: [P("absorb", "Absorb the best into the police; pay the rest to disarm", { cost: 50, heat: -8, next: "returns", past: "absorbed the vigilantes into the police and paid the rest to disarm", say: "Eight thousand into police uniform. The checkpoints are coming down." }),
        BL("police", "A State Police amendment: give them a lawful home", "Constitution (State Police) Amendment Bill", "state_police", "warlords", { npc: { gov: 6 }, past: "sent a state police amendment to give the vigilantes a lawful home", say: "If it passes, the vigilantes become police under the law." }),
        A("ignore", "Ignore them: they are volunteers", { weak: true, next: "warlords", past: "ignored the vigilantes' demands", say: "They are not volunteering any more." })] },
    warlords: { t: "The vigilantes have become warlords", who: "vigilante-guard", scene: "kidnap-camp-empty", d: "Three vigilante commanders now run their own districts, collect 'security levies' and fight each other. One is accused of the same killings the insurgents were.",
      opts: [P("disarm", "Disarm them, by force where needed", { cost: 60, npc: { army: 3 }, heat: -6, next: "dwindle", past: "disarmed the vigilante warlords", say: "Two surrendered. One fought, and lost." }),
        A("deal", "Make the commanders local government chairmen", { fx: { cor: .03 }, npc: { party: 4 }, weak: true, next: "capital", past: "made the vigilante commanders local government chairmen", say: "Warlords with titles now." }),
        BL("court", "A Special Tribunal Bill for vigilante crimes", "Special Tribunal (Armed Groups) Bill", "dwindle", "capital", { past: "sent a Special Tribunal Bill to try the vigilante commanders", say: "Victims will see the commanders in court, if it passes." })] },
    state_police: { t: "State police on the streets", who: "governors-forum-chair", bg: "government-house", d: "The amendment passed: the states recruit their own police. The governors celebrate. In one state the new police arrested the opposition's campaign manager the same week.",
      opts: [BL("commission", "A Police Commission Bill to discipline state police", "Police Service Commission (Amendment) Bill", "dwindle", "warlords", { past: "sent a bill to put state police under a disciplinary commission", say: "No governor's private army, if it passes." }),
        OR("rules", "Federal guidelines by order: no state police at political events", "the State Police Guidelines", "dwindle", .3, "warlords", { npc: { gov: -4 }, past: "issued federal guidelines barring state police from politics", say: "The guidelines are out. Two governors are already in court over them." }),
        P("train", "Train and equip them properly", { cost: 50, fx: { sec: 4 }, heat: -8, next: "dwindle", past: "trained and equipped the new state police", say: "Ten thousand recruits through a federal academy. They know the law now." })] },
    revenge: { t: "The sponsors strike back", who: "efcc-investigator", scene: "market-fire-aftermath", d: "After the charges, a bomb went off at the EFCC's office in Maiduguri. Two investigators are dead. The men you charged want you to blink.",
      opts: [P("protect", "Protect the investigators and press on", { cost: 30, heat: -8, next: "dwindle", past: "protected the investigators and pressed on with the sponsors' trial", say: "The trial goes on, behind armoured glass." }),
        BL("witness", "A Witness Protection Bill", "Witness Protection Programme Bill", "dwindle", "spread", { past: "sent a Witness Protection Bill to the Assembly", say: "Witnesses will testify if they can be hidden. The bill would hide them." }),
        A("drop", "Drop the charges against the senator", { fx: { cor: .04 }, npc: { party: 6 }, weak: true, next: "spread", past: "dropped the charges after the bombing", say: "Dropped. Every sponsor in the country learned the lesson." })] },
    ransom_ban: { t: "Paying a ransom is now a crime", who: "senior-advocate", bg: "courtroom", d: "The law has passed. Families of kidnapped travellers say you have made them criminals for saving their children, and a father in Kaduna has been arrested.",
      opts: [P("rescue", "A rescue unit in every highway state", { cost: 60, fx: { sec: 4 }, heat: -8, next: "dwindle", past: "set up rescue units in every highway state", say: "Three rescues in a month. The ransom economy is drying up." }),
        OR("spare", "Order prosecutors not to charge families", "the Prosecutorial Directive", "dwindle", .2, "highway", { fx: { app: 3 }, past: "ordered prosecutors to spare kidnapped people's families", say: "The father is released. The kidnappers' sponsors are still the target." }),
        A("enforce", "Enforce it to the letter", { fx: { app: -4 }, weak: true, next: "highway", past: "enforced the ransom law against families", say: "Families pay in secret now, and more." })] },
    returns: { t: "The displaced start to go home", scene: "idp-return", d: "Two million people have lived in camps for years. Their towns are half-rebuilt, and the first families are packing. If they are attacked on the way, nobody will go home for a decade.",
      opts: [P("rebuild", "Rebuild the towns before they arrive: police posts, schools, clinics", { cost: 70, fx: { app: 3 }, heat: -10, next: "dwindle", past: "rebuilt the towns before the displaced went home", say: "The first town has a school, a clinic and a police post. Families are moving back." }),
        OR("close", "Close the camps by order: everyone home by Christmas", "the Camp Closure Order", "dwindle", .45, "backtobush", { fx: { app: -2 }, past: "ordered the displaced people's camps closed", say: "The camps close in December. Some towns are not ready." }),
        BL("ned", "A bill to fund the North-East Development Commission for ten years", "North-East Development Commission (Funding) Bill", "dwindle", "spread", { past: "sent a ten-year funding bill for the North-East Development Commission", say: "If it passes, the money survives you." })] },
    capital: { t: "A bomb in Abuja", scene: "market-fire-aftermath", d: "A car bomb has exploded beside a market in Abuja. Fourteen dead. The insurgency has reached the capital, and the world's embassies are telling their people to leave.",
      opts: [P("all", "Everything at once: soldiers, police, intelligence, money", { cost: 100, fx: { sec: 6 }, npc: { army: 6 }, heat: -14, next: "splinter", past: "threw everything at the insurgency after the Abuja bomb", say: "The cell is found in nine days. Its leaders are dead or in custody." }),
        OR("lockdown", "A lockdown and curfew in the capital", "the Abuja Curfew Order", "vigilantes", .2, "spread", { fx: { app: -3 }, heat: -6, past: "locked down Abuja after the bombing", say: "Checkpoints on every road into the capital." }),
        BL("detention", "A Terrorism Prevention Amendment: ninety days' detention without trial", "Terrorism (Prevention) Amendment Bill", "dwindle", "spread", { fx: { app: -2 }, past: "sent a bill allowing ninety days' detention without trial", say: "Rights groups call it a police state. Many Nigerians call it overdue." })] },
    dwindle: { t: "The insurgency is on its last legs", who: "national-security-adviser-pleased", d: "Attacks are down by two-thirds. The last commanders are hiding deep in the forest, short of food and men. One more push, done right, and it is over.",
      opts: [P("push", "A final push, and the towns rebuilt", { cost: 60, fx: { app: 5, sec: 4 }, close: true, past: "broke the insurgency", say: "The last camp falls. The insurgency is over." }),
        BL("law", "Put the North-East's rebuilding into law, so it outlives you", "North-East Development Commission (Funding) Bill", "dwindle", "dwindle", { close: true, fx: { app: 3 }, past: "broke the insurgency and wrote the rebuilding into law", say: "The insurgency is over, and the rebuilding is the law." }),
        OR("over", "Proclaim the emergency over", "the End of Emergency Proclamation", "dwindle", 0, "dwindle", { close: true, fx: { app: 4 }, past: "declared the insurgency over", say: "The emergency is lifted. The North-East is at peace." })] },
  } };

export const NAIRA = { id: "naira", nm: "The naira crisis", who: "cbn-governor", bg: "finance-ministry-office", start: "fall", starts: ["fall", "oilcrash", "junk"], boil: "riots", heat0: 55, drift: 4, scale: 1, learn: "cbn",
  legacy: "Steadied the naira after its worst crisis.", faded: "The naira drifted on, never quite collapsing and never recovering.",
  order: ["fall", "inflation", "reserves", "smuggle", "crunch", "remit", "steady"],
  beats: {
    fall: { t: "The naira falls through ₦2,000 to the dollar", scene: "market-inflation", d: "Importers cannot get dollars. Drug and food prices rise every week, and there are three exchange rates: the official one, the banks' one, and the real one on the street.",
      opts: [A("float", "Back the Central Bank: unify the rates and let it float", { fx: { app: -5, igr: 25 }, npc: { cbn: 8 }, heat: -6, next: "inflation", past: "let the naira float on a single rate", say: "One rate from Monday. It falls 40% and the street rate finally meets it." }),
        P("defend", "Spend the reserves defending the naira", { cost: 0, fx: { app: 3 }, npc: { cbn: -8 }, heat: -4, next: "reserves", past: "spent the reserves defending the naira", say: "The Central Bank sells dollars. The naira holds, at a price." }),
        BL("cbnact", "A Central Bank Act amendment: an inflation target, and no lending to government", "Central Bank of Nigeria (Amendment) Bill", "steady", "ways", { past: "sent a Central Bank Act amendment to the Assembly", say: "If it passes, no President can print money again, including you." }),
        OR("ban", "Executive order: no foreign exchange for 43 imported items", "the Forex Restriction Order", "smuggle", .3, "smuggle", { fx: { app: 1 }, heat: -2, past: "banned foreign exchange for 43 imported items", say: "Toothpicks to rice: 43 items cut off from dollars. The smugglers are delighted." })] },
    oilcrash: { t: "Oil falls to $40 a barrel", startOnly: true, who: "finance-minister", d: "The oil price has halved in four months. Federal revenue falls with it, the naira slides, and the Finance Minister says the budget you signed in January is fiction.",
      opts: [P("cut", "Cut capital spending and freeze new hiring", { cost: -40, fx: { app: -3 }, npc: { cbn: 6 }, heat: -6, next: "crunch", past: "cut spending when oil crashed", say: "Projects pause. The books balance, just." }),
        A("print", "Borrow from the Central Bank to fill the hole", { cost: -80, npc: { cbn: -10 }, heat: 6, weak: true, next: "ways", past: "borrowed from the Central Bank when oil crashed", say: "The hole is filled with new money." }),
        BL("savings", "A sovereign savings rule: save the windfalls, spend in the crashes", "Fiscal Responsibility (Savings Rule) Amendment Bill", "steady", "imf", { past: "sent a sovereign savings rule to the Assembly", say: "Next time, if it passes, there will be savings to spend." }),
        OR("overheads", "Executive order: halve every ministry's overheads", "the Overheads Order", "debt", .2, "riots", { cost: -30, fx: { app: 1 }, past: "halved ministries' overheads by order", say: "No more foreign trips, no new cars. The civil service sulks." })] },
    junk: { t: "Nigeria's credit rating is cut to junk", startOnly: true, who: "cbn-governor", d: "Two rating agencies have cut Nigeria to junk. Foreign investors are selling naira bonds, the dollars are leaving, and the street rate jumped 15% in a week.",
      opts: [A("float", "Back the Central Bank: one rate, let it float", { fx: { app: -5, igr: 25 }, npc: { cbn: 8 }, heat: -6, next: "inflation", past: "let the naira float after the downgrade", say: "One rate. The bonds stop falling." }),
        P("defend", "Spend the reserves to steady the naira", { fx: { app: 2 }, npc: { cbn: -8 }, heat: -4, next: "reserves", past: "spent the reserves after the downgrade", say: "The naira holds, at a price." }),
        BL("cbnact", "A Central Bank Act amendment: an inflation target and real independence", "Central Bank of Nigeria (Amendment) Bill", "steady", "ways", { past: "sent a Central Bank independence bill after the downgrade", say: "The agencies said this is what they want to see." }),
        OR("capital", "Executive order: hold foreign investors' money for 90 days", "the Capital Controls Order", "smuggle", .3, "riots", { heat: -2, past: "imposed capital controls after the downgrade", say: "The money cannot leave. The next investor will not come." })] },
    inflation: { t: "Inflation passes 30%", scene: "market-inflation", d: "Bread, rice and transport cost a third more than last year. The float has drawn investors back, but at the market a mother of four buys half of what she used to.",
      opts: [P("food", "Food support for the poorest ten million homes", { cost: 50, fx: { app: 3 }, heat: -4, next: "remit", past: "paid food support to the poorest ten million homes", say: "Transfers by phone. Fraudsters registered ghost families in two states." }),
        A("rates", "Back the Central Bank raising interest rates", { fx: { app: -2 }, npc: { cbn: 8 }, heat: -6, next: "crunch", past: "backed the Central Bank's interest rate rise", say: "Rates up four points. Inflation will slow. So will business." }),
        OR("duty", "Executive order: suspend import duties on rice, wheat and medicines for six months", "the Food Import Duty Order", "remit", .2, "riots", { fx: { app: 2, igr: -8 }, heat: -4, past: "suspended import duties on food and medicines", say: "Duty-free from Monday. Local rice farmers say you have sold them out." }),
        A("print", "Borrow from the Central Bank to pay the bills", { cost: -80, npc: { cbn: -10 }, heat: 6, weak: true, next: "ways", past: "borrowed from the Central Bank to pay the government's bills", say: "The bills are paid with new money. Prices will follow." })] },
    reserves: { t: "The reserves are draining", who: "cbn-governor", d: "Defending the naira burned $8 billion in a year. The reserves cover four months of imports, and the rating agencies have put Nigeria on watch.",
      opts: [A("keep", "Keep defending it: a falling naira hurts the poor", { weak: true, heat: 4, next: "imf", past: "kept spending the reserves on the naira", say: "Another $2 billion gone." }),
        A("float", "Stop: let it float now", { fx: { app: -6, igr: 20 }, npc: { cbn: 6 }, next: "inflation", past: "stopped defending the naira and let it float", say: "It falls hard, then it finds a floor." }),
        P("bond", "Borrow abroad with a Eurobond", { cost: -100, heat: -4, next: "debt", past: "borrowed abroad with a Eurobond", say: "Oversubscribed, at 11%. The interest will outlast you." })] },
    smuggle: { t: "Smugglers, and empty shelves", who: "market-trader", bg: "busy-market-street", d: "With 43 items cut off from dollars, rice and tomato paste come through Seme by night. Customs raid the markets; traders close their shops; prices climb anyway.",
      opts: [P("farm", "Pay farmers to grow rice and wheat in the dry season", { cost: 60, fx: { agr: 3 }, heat: -6, next: "harvest", past: "paid farmers to grow dry-season rice and wheat", say: "Irrigation in seven states. The first harvest is in March." }),
        OR("lift", "Lift the ban by order and unify the rate", "the Forex Liberalisation Order", "inflation", .15, "riots", { fx: { app: -3, igr: 15 }, past: "lifted the import restrictions by order", say: "The ban is gone. The smugglers' margins with it." }),
        A("raids", "More customs raids on the markets", { fx: { app: -3 }, weak: true, next: "riots", past: "ordered more customs raids on the markets", say: "Customs seize rice at gunpoint. The market women have had enough." })] },
    ways: { t: "The printing press", who: "cbn-governor", scene: "cbn-printing-press", d: "Central Bank lending to the government has reached ₦30 trillion. The governor tells you privately: 'We are printing your budget, Your Excellency. Inflation is the bill.'",
      opts: [BL("cap", "A bill to cap Central Bank lending to government by law", "Fiscal Responsibility (Amendment) Bill", "steady", "imf", { past: "sent a bill to cap the Central Bank's lending to government", say: "If it passes, the printing press stops, including for you." }),
        P("cut", "Cut spending: freeze new hiring and foreign travel", { cost: -40, fx: { app: -3 }, npc: { cbn: 6 }, heat: -6, next: "crunch", past: "froze government hiring and foreign travel", say: "Ministers grumble. The press stops for now." }),
        A("more", "Keep printing: the election is coming", { cost: -80, weak: true, heat: 6, next: "imf", past: "kept printing money", say: "Printed. The naira notices." })] },
    imf: { t: "The IMF is at the door", who: "foreign-head-of-state", bg: "foreign-ministry-meeting", d: "The reserves are nearly gone. The IMF offers $10 billion, with conditions: no fuel subsidy, a floating naira, higher taxes and a smaller government.",
      opts: [A("accept", "Accept the IMF programme", { cost: -120, fx: { app: -6 }, npc: { cbn: 8 }, hook: "nlc_imf", heat: -10, next: "steady", past: "accepted an IMF programme", say: "The money arrives. So does the NLC's ultimatum." }),
        BL("fiscal", "Refuse, and send a Fiscal Responsibility Bill of your own", "Fiscal Responsibility (Amendment) Bill", "steady", "riots", { past: "refused the IMF and sent your own fiscal responsibility bill", say: "Your own reforms, on your own terms, if the Assembly passes them." }),
        A("meridia", "Borrow from Meridia instead, against future oil", { cost: -100, fx: { cor: .02 }, weak: true, next: "debt", past: "borrowed from Meridia against future oil", say: "No conditions you can see. The oil is spoken for until 2040." })] },
    debt: { t: "Interest eats the revenue", who: "finance-minister", bg: "finance-ministry-office", d: "Two-thirds of federal revenue now goes on interest. There is little left for roads, schools or salaries after the creditors are paid.",
      opts: [BL("tax", "A Tax Reform Bill: fewer taxes, collected properly", "Tax Administration Reform Bill", "steady", "riots", { npc: { gov: -4 }, past: "sent a tax reform bill to the Assembly", say: "Fewer taxes, but everyone pays. The governors are counting their share." }),
        P("capex", "Cut capital spending to pay the creditors", { cost: -50, fx: { app: -3 }, next: "crunch", past: "cut capital spending to pay the creditors", say: "Roads stop half-built. The creditors are paid." }),
        OR("suspend", "Executive order: suspend all new capital releases", "the Capital Releases Order", "steady", .3, "riots", { fx: { app: -2 }, past: "suspended new capital releases by order", say: "Nothing new is funded. Contractors are lining up outside the ministry." })] },
    crunch: { t: "The factories cannot borrow", who: "manufacturers-rep", bg: "finance-ministry-office", d: "Interest rates are at 27%. Manufacturers say no factory can borrow at that; three closed this month and laid off four thousand workers.",
      opts: [P("credit", "A development bank credit line for factories at 9%", { cost: 50, fx: { igr: 10 }, heat: -6, next: "remit", past: "opened a cheap development bank credit line for factories", say: "The first loans go out in a month. A shoe factory in Aba hires two hundred." }),
        BL("export", "An Export Expansion Bill: tax credits for every dollar earned abroad", "Export Expansion Grant Bill", "exports", "riots", { past: "sent an export expansion bill to the Assembly", say: "Earn dollars, pay less tax. The manufacturers are lobbying for it." }),
        OR("lend", "Executive order: banks must lend a fifth of their loans to manufacturers", "the Credit Allocation Order", "remit", .4, "riots", { fx: { igr: 5 }, npc: { cbn: -6 }, heat: -4, past: "ordered the banks to lend to manufacturers", say: "The banks are lending, and lobbying to have the order struck down." }),
        A("wait", "Wait for rates to fall", { weak: true, next: "riots", past: "waited for interest rates to fall", say: "Two more factories close." })] },
    remit: { t: "Remittances come back", who: "citizen-trader-abroad", bg: "airport-arrivals", d: "With one exchange rate, Nigerians abroad send money through the banks again: $2 billion more this quarter. Fintech companies want licences; the big banks want them stopped.",
      opts: [OR("fintech", "License the fintechs by executive order", "the Payments Licensing Order", "exports", .3, "steady", { fx: { igr: 8 }, past: "licensed the fintech companies by executive order", say: "Twelve licences. The banks have gone to court." }),
        BL("diaspora", "A Diaspora Investment Bill", "Diaspora Investment Bill", "exports", "steady", { past: "sent a Diaspora Investment Bill to the Assembly", say: "Property, pensions and bonds for Nigerians abroad, if it passes." }),
        P("bond", "A diaspora bond for the railways", { cost: -60, fx: { app: 2 }, next: "steady", past: "sold a diaspora bond for the railways", say: "Nigerians abroad bought $1.2 billion of it in a week." })] },
    harvest: { t: "A bumper harvest, and nowhere to store it", who: "village-head", bg: "northern-farmland", d: "The dry-season rice came in at twice last year's crop. Now it is rotting by the roads: there are not enough silos, mills or trucks to get it to Lagos.",
      opts: [P("silos", "Silos, mills and a strategic grain reserve", { cost: 50, fx: { agr: 3 }, heat: -6, next: "steady", past: "built silos and a grain reserve for the harvest", say: "The grain is stored. Rice prices fall for the first time in three years." }),
        OR("buy", "Order the reserve agency to buy it all at a guaranteed price", "the Guaranteed Price Order", "steady", .2, "riots", { cost: 30, fx: { app: 2, cor: .02 }, past: "ordered the grain reserve to buy the harvest at a guaranteed price", say: "Bought. Some middlemen bought it first, at half." }),
        A("leave", "Leave it to the market", { weak: true, next: "riots", past: "left the rotting harvest to the market", say: "Half of it rots." })] },
    riots: { t: "Food riots", scene: "news-protest", d: "Warehouses have been looted in Abuja and Lagos; a crowd stopped a truck of maize on the expressway and emptied it. Food inflation is 40%.",
      opts: [P("grain", "Open the grain reserves and sell at cost", { cost: 60, fx: { app: 4 }, heat: -8, next: "harvest", past: "opened the grain reserves after the riots", say: "Trucks of grain in every state. The crowds go home." }),
        OR("controls", "Executive order: price controls on rice, beans and bread", "the Staple Prices Order", "smuggle", .35, "smuggle", { fx: { app: 3 }, past: "imposed price controls on staple foods", say: "Prices fixed. Shelves empty by Friday." }),
        A("police", "Send the police to protect the warehouses", { fx: { app: -4 }, weak: true, heat: 4, next: "crunch", past: "sent police to guard the warehouses during the food riots", say: "Tear gas at the warehouses. Nobody is fed." })] },
    steady: { t: "The naira steadies", who: "cbn-governor", d: "For three months the naira has held. Investors are cautiously back and inflation is falling. The Central Bank governor smiles for the first time this term.",
      opts: [A("hold", "Hold the course: no new tricks", { npc: { cbn: 6 }, heat: -8, next: "exports", past: "held the course while the naira steadied", say: "Steady. Boring, even. Investors love boring." }),
        P("spend", "Celebrate: a pre-election spending push", { cost: 80, fx: { app: 3 }, npc: { cbn: -8 }, weak: true, next: "inflation", past: "spent heavily before the election", say: "Money everywhere. The Central Bank governor is not smiling." }),
        BL("law", "Write the reforms into law", "Central Bank of Nigeria (Amendment) Bill", "exports", "exports", { past: "sent the currency reforms to the Assembly to make them law", say: "If it passes, your successor cannot undo it." })] },
    exports: { t: "Made in Nigeria sells abroad", scene: "trade-deal-signing", d: "A cheaper naira and steady rules have done what speeches could not: Nigerian shoes, cement, rice and software are selling across Africa. The naira's worst crisis in a generation is ending.",
      opts: [P("ports", "Modernise the ports and the export corridors", { cost: 40, fx: { app: 4, igr: 10 }, close: true, past: "ended the naira crisis", say: "The naira crisis is over." }),
        A("afcfta", "Lead the African free trade area's next round", { fx: { app: 3 }, close: true, past: "ended the naira crisis", say: "The naira crisis is over, and Nigeria leads the continent's trade talks." }),
        OR("onestop", "Executive order: one window for every exporter", "the Export Single Window Order", "exports", 0, "exports", { close: true, fx: { app: 3, igr: 8 }, past: "ended the naira crisis", say: "One form, one day. The naira crisis is over." })] },
  } };

export const PRES_STORIES = { fuel: FUEL, insurgency: INSURGENCY, naira: NAIRA };

/* The President's stories speak of governors and the Central Bank's Governor
   as themselves: protect their words from the presidency's vocabulary. */
const SKIP = new Set(["id", "kind", "next", "who", "bg", "scene", "learn", "pass", "fail", "struck", "hook", "start", "boil", "order", "seed"]);
const guard = (o) => { if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === "string") o[i] = keepWord(v); else guard(v); }); else if (o && typeof o === "object") Object.keys(o).forEach(k => { if (SKIP.has(k) && (typeof o[k] === "string" || Array.isArray(o[k]))) return; if (typeof o[k] === "string") o[k] = keepWord(o[k]); else guard(o[k]); }); };
Object.values(PRES_STORIES).forEach(d => guard(d.beats));

/* ── The agenda: an eight-year story ──
   The flagship was the same card every year (fund it, cut corners, delay).
   Now each year brings the problem that year really brings: the land, then
   the people to run it, then the test, then the ribbon; in the second term
   upkeep, the demand to spread it, the fight over who controls it, and
   whether it survives you. Every year can be answered with a programme
   (money: this year's target delivered), a bill (nothing built this year,
   but a law that lasts once it passes), an executive order (fast, and a
   court can strike it down), or by cutting corners, which comes back the
   following year as the cheap work giving way. costX multiplies the year's
   flagship budget. delivered: whether this year's target is met. */
const AG = {
  education: { n: "the rebuilt schools", who: "commissioner-female-kaftan", bg: "classroom", scene: "ribbon-school",
    defect: ["A classroom block built with half the money last year is cracking; a wall fell on pupils and six are in hospital.", "The cheap desks bought last year have collapsed; pupils sit on the floor again.", "Parents found that the 'new teachers' on the payroll are friends of the contractor who never come to class."],
    y: [
      ["Which schools go first?", "Every chief and legislator wants his village's school rebuilt first. The Commissioner's needs survey says the worst are in the riverine villages, where no politician lives.",
        ["Follow the survey: the worst schools first", "The riverine schools go first. Two legislators are sulking."], ["A School Standards Bill: every school inspected and ranked in public", "School Standards and Inspection Bill"], ["Executive order: no school contract until the survey is published", "the School Contracts Order"], ["Start with the legislators' villages", "The legislators are pleased. The worst schools wait another year."]],
      ["Classrooms, but no teachers", "The first classrooms are finished, but 3,000 teaching posts are empty and teachers refuse rural postings without housing.",
        ["Recruit 3,000 teachers, with a rural allowance and housing", "Three thousand new teachers, most of them in the villages."], ["A Teaching Service Bill: rural service before promotion", "Teaching Service (Amendment) Bill"], ["Executive order: move office-based teachers back to classrooms", "the Teacher Redeployment Order"], ["Hire volunteers on a small stipend", "Volunteers fill the classrooms. Some are good; some never come back."]],
      ["Children too hungry to learn", "Attendance has jumped, but head teachers say a third of the pupils arrive without breakfast and are gone by noon.",
        ["School meals, cooked from local farmers' produce", "Hot meals in every rebuilt school. Attendance holds after noon."], ["A School Feeding Bill, so the meals survive budget cuts", "School Feeding Programme Bill"], ["Executive order: free buses for pupils in the poorest LGAs", "the School Transport Order"], ["Biscuits once a week", "The biscuit contract went to a commissioner's cousin."]],
      ["The exam results, and a syndicate", "The first exam results since the rebuild are out: pass rates rose in the rebuilt schools. In others, a syndicate sold the papers the night before.",
        ["Expand to the next hundred schools", "The next hundred schools are on the list."], ["An Examination Malpractice Bill with jail terms", "Examination Malpractice Bill"], ["Executive order: cancel the tainted results and arrest the syndicate", "the Examination Integrity Order"], ["Celebrate the numbers and say nothing about the cheating", "The numbers are celebrated. The syndicate is already selling next year's papers."]],
    ] },
  health: { n: "the health centres", who: "doctor", bg: "rural-health-centre", scene: "ribbon-hospital",
    defect: ["The cheap generators bought for the centres have died; a woman delivered by torchlight and lost her baby.", "Volunteers sent instead of nurses gave the wrong vaccine doses in two wards.", "Half-built maternity rooms leak; the delivery beds stand in buckets."],
    y: [
      ["No nurse will go to the villages", "The reopened health centres have drugs and beds, but nurses refuse postings to villages with no housing and no light.",
        ["Staff quarters, solar power and a rural allowance", "Nurses are moving into the new quarters. Two centres have doctors for the first time."], ["A Health Workers' Service Bill: two rural years before promotion", "Health Workers' Service Bill"], ["Executive order: every new graduate nurse serves a year in a rural centre", "the Rural Posting Order"], ["Send community volunteers instead of nurses", "Volunteers with a week's training run the centres."]],
      ["The drugs go missing", "Drug deliveries reach the centres half-empty. A storekeeper at the central medical store has been selling them to private chemists.",
        ["A tracked supply chain: barcodes and a pharmacist in every centre", "Every box tracked from warehouse to patient. The chemists' supply has dried up."], ["A Drug Revolving Fund Bill", "Drug Revolving Fund Bill"], ["Executive order: publish every centre's drug stock online each week", "the Drug Stock Order"], ["Sack the storekeeper and move on", "The storekeeper is gone. His deputy took over the business."]],
      ["Cholera in the riverine wards", "Cholera has broken out in the riverine wards: 300 cases and 11 dead. The new centres are overwhelmed.",
        ["Emergency response: treatment tents, clean water and vaccines", "The outbreak is contained in three weeks."], ["A Public Health Emergency Bill", "Public Health Emergency Bill"], ["Executive order: close the markets and wells in the affected wards", "the Cholera Containment Order"], ["Wait for the federal disease agency", "The federal team arrives in nine days. Forty more die."]],
      ["Who pays for care?", "The centres work, and they are full. Patients still pay at the counter, and the poorest stay away until it is too late.",
        ["Free care for children under five and pregnant women", "No fees for mothers and children. Births in the centres double."], ["A State Health Insurance Bill: everyone covered", "State Health Insurance Bill"], ["Executive order: no fees at primary health centres", "the Free Primary Care Order"], ["Keep the fees: the centres need the money", "The fees stay. So do the poorest, at home."]],
    ] },
  infrastructure: { n: "the trunk roads", who: "contractor", bg: "road-construction-site", scene: "ribbon-road",
    defect: ["A section of last year's road washed away in the first storm; a bus overturned in the crater.", "The cheap culverts collapsed and a bridge approach caved in; the road is closed for a month.", "Engineers found the asphalt is half the thickness paid for; potholes appeared in four months."],
    y: [
      ["The land along the route", "Landowners along the first trunk road want compensation, and omo onile are demanding 'deve' from the surveyors. One family says the route crosses their ancestors' graves.",
        ["Pay full compensation, verified and published", "Every owner paid, the list online. The surveyors are back at work."], ["A Land Compensation Bill: fixed rates, paid before work starts", "Land Compensation Bill"], ["Executive order: acquire the land in the public interest", "the Right-of-Way Order"], ["Pay the loudest claimants and start digging", "The loudest are paid. The real owners are going to court."]],
      ["Cement up 40%, and the contractor wants more", "Cement and bitumen prices jumped 40% this year. The contractor wants a ₦3B contract variation, or he will slow down.",
        ["Pay the variation after an independent price review", "The review cut his claim by a third. He took it, and the bulldozers are back."], ["A Public Procurement Bill: price adjustment rules for every contract", "Public Procurement (Price Adjustment) Bill"], ["Executive order: retender the contract", "the Contract Retender Order"], ["Tell him to finish with what he has", "He will finish. Thinner."]],
      ["The rainy season test", "The rains came early. The drainage held on the first road; on the second, the culverts were too small and a stretch floods every afternoon.",
        ["Rebuild the culverts properly", "Bigger culverts, deeper drains. The road stays open through the rains."], ["A Roads Maintenance Agency Bill", "Roads Maintenance Agency Bill"], ["Executive order: no heavy trucks on the new roads during the rains", "the Axle Load Order"], ["Patch it with laterite", "Laterite, until the next storm."]],
      ["The ribbon, and the engineers' audit", "The roads are ready to commission. An engineers' audit you ordered quietly says one stretch is four centimetres thinner than you paid for.",
        ["Make the contractor redo it before the ribbon", "Redone. The ribbon is a month late, and the road will last."], ["A bill to publish every engineering audit", "Engineering Audits (Disclosure) Bill"], ["Executive order: blacklist the contractor", "the Contractor Blacklist Order"], ["Cut the ribbon and bury the audit", "The ribbon is cut. The audit is in a drawer."]],
    ] },
  security: { n: "the community guards", who: "vigilante-guard", bg: "village-square", scene: "army-convoy",
    defect: ["Guards hired cheaply last year sold their uniforms; men in them robbed travellers on the highway.", "The patrol vans bought on the cheap broke down; bandits struck a village the guards could not reach.", "Unvetted guards ran a checkpoint for bribes; traders are complaining on the radio."],
    y: [
      ["Who commands the guards?", "The community guards are trained, but the police commissioner, the emir and the local vigilantes all want to command them.",
        ["A joint command under police oversight, pay through the bank", "One command, one payroll. Nobody owns the guards but the law."], ["A Community Security Corps Bill", "Community Security Corps Bill"], ["Executive order: the guards answer to the state security adviser", "the Security Corps Order"], ["Let each LGA chairman command his own", "Each chairman has a private guard now."]],
      ["The guards want guns", "Bandits attacked a guard post with rifles; the guards had pump-action shotguns. They want automatic weapons. Federal law says only the police and the army may have them.",
        ["Radios, vehicles and armour instead of guns", "Radios and fast vehicles: the guards call in the army instead of fighting it out."], ["A Community Security (Arms Licensing) Bill", "Community Security (Arms Licensing) Bill"], ["Executive order: license pump-action rifles in the forest LGAs", "the Guard Arms Order"], ["Buy rifles quietly through a contractor", "The rifles came. So did questions about where they came from."]],
      ["A guard kills a young herder", "A guard shot a young herder at a checkpoint. Herders' groups want the corps disbanded; farmers say the guards saved their villages.",
        ["An independent inquiry, and compensation for the family", "The inquiry found the guard at fault; he is charged. The herders' leaders accept the compensation."], ["A Corps Complaints Commission Bill", "Security Corps Complaints Commission Bill"], ["Executive order: body cameras for every patrol", "the Body Camera Order"], ["Defend the guard and say nothing", "The herders say they will defend themselves now."]],
      ["The bandits move next door", "Attacks in your state are down by half. The bandits have moved into the neighbouring state, whose governor accuses you of pushing them over the border.",
        ["A joint task force with the neighbouring state", "Two states, one task force. The bandits have nowhere to run."], ["A Regional Security Compact Bill", "Regional Security Compact Bill"], ["Executive order: share intelligence with the neighbours every day", "the Intelligence Sharing Order"], ["Leave it: their problem now", "Their problem. Until they come back."]],
    ] },
  agriculture: { n: "the irrigation scheme", who: "village-head", bg: "northern-farmland", scene: "money-agric-exports",
    defect: ["The cheap canal linings cracked; water is pouring into the bush, not the fields.", "Second-hand pumps bought last year seized up in the dry season; the crop is dying.", "The fence built on the cheap is down, and cattle ate a season's rice."],
    y: [
      ["A cattle route through the scheme", "The 5,000 hectares chosen for irrigation sit across a cattle route used for a hundred years. Herders were not consulted; farmers have already cleared the land.",
        ["Build a new grazing reserve, with water points", "The herders have a reserve with water. The route moves, peacefully."], ["A Grazing and Ranching Regulation Bill", "Grazing and Ranching Regulation Bill"], ["Executive order: no grazing on the irrigation scheme", "the Irrigation Zone Order"], ["Fence it and hope", "A fence. The herders have wire cutters."]],
      ["The pumps need power", "The pumping station is built, but the grid supplies four hours a day, and diesel costs more than the rice is worth.",
        ["Solar-powered pumps", "The pumps run on the sun. Water all day."], ["A State Electricity Market Bill", "State Electricity Market Bill"], ["Executive order: the scheme goes on the priority power list", "the Priority Power Order"], ["Run it on diesel", "Diesel it is. The farmers' margins are gone."]],
      ["A bumper harvest, and no buyers", "The first harvest is twice what was expected. Middlemen offer farmers half of what it cost to grow it.",
        ["A guaranteed minimum price and state warehouses", "The state buys at a fair price. The middlemen have to match it."], ["A Commodity Exchange Bill", "Commodity Exchange Bill"], ["Executive order: no grain leaves the state until prices recover", "the Grain Movement Order"], ["Let the market decide", "The market decided: half price."]],
      ["Fertiliser for farmers who do not exist", "Fertiliser vouchers were redeemed by 'farmers' who do not exist; real farmers got half of what they were promised.",
        ["Biometric registration of every farmer", "Every farmer fingerprinted. Twelve thousand ghost farmers vanished."], ["An Agricultural Inputs Fraud Bill", "Agricultural Inputs (Fraud) Bill"], ["Executive order: publish every voucher redeemed", "the Voucher Transparency Order"], ["Recover what you can, quietly", "A little recovered. Nobody charged."]],
    ] },
  anticorruption: { n: "the open contracts", who: "efcc-investigator", bg: "state-secretariat", scene: "news-court-steps",
    defect: ["Contracts published half-complete last year hid the real prices; a newspaper found a borehole costing ₦90M.", "The cheap online portal crashed and lost a month of records; contractors say it was convenient.", "Refunds 'agreed quietly' never came; the same contractors won new jobs."],
    y: [
      ["The files are 'missing'", "Publishing every contract online needs the files. Three ministries say their records were lost in a fire.",
        ["A digital registry, and staff to rebuild the files", "Every contract for five years, rebuilt and online."], ["A Freedom of Information (State) Bill", "Freedom of Information (State) Bill"], ["Executive order: no payment on any contract that is not published", "the Contract Publication Order"], ["Publish what you have", "A third of the contracts are online. The interesting ones are not."]],
      ["The published prices are padded", "The first contracts online show boreholes at three times the market price. The contractors are party donors.",
        ["A price benchmarking unit to check every contract", "Every price is checked against the market before signing."], ["A Public Procurement Bill with jail terms", "Public Procurement (Offences) Bill"], ["Executive order: suspend every padded contract", "the Contract Suspension Order"], ["Ask the contractors to refund quietly", "They promised to refund."]],
      ["The whistleblower", "An accountant in the Ministry of Works has evidence that a commissioner, your ally, took kickbacks. She wants protection before she speaks.",
        ["Protect her and fund the investigation", "She testified. The commissioner is charged."], ["A Whistleblower Protection Bill", "Whistleblower Protection Bill"], ["Executive order: suspend the commissioner pending the probe", "the Suspension Order"], ["Transfer the accountant to a distant posting", "She is transferred. Every civil servant learned the lesson."]],
      ["The godfather's contract", "A ₦4B contract has gone to the godfather's company through a front. It is online for everyone to see.",
        ["Retender it in public", "Retendered on live radio. The godfather's front lost."], ["A Conflict of Interest Bill", "Conflict of Interest Bill"], ["Executive order: cancel it", "the Contract Cancellation Order"], ["Leave it: some fights are not worth having", "Left alone. The open contracts now have an asterisk."]],
    ] },
  youth: { n: "the jobs programme", who: "youth-group-cheering", bg: "village-square", scene: "money-investor-factory",
    defect: ["'Graduates' counted as employed last year are back on the streets; a newspaper interviewed twenty of them.", "The cheap training centres closed mid-course and kept the fees.", "Trainees on a token stipend walked out; three centres are empty."],
    y: [
      ["Employers will not take trainees", "Trained young people are graduating, but employers say they want experience, not certificates.",
        ["Pay half of each trainee's first-year wage", "Four hundred firms signed up. The first trainees start on Monday."], ["A Youth Employment Incentive Bill: tax credits for hiring", "Youth Employment Incentive Bill"], ["Executive order: every state contractor hires 20% trainees", "the Trainee Hiring Order"], ["Count trainees as 'employed' anyway", "The numbers look good. The trainees are still at home."]],
      ["Ghost training centres", "An audit found a third of the training centres exist only on paper; their owners collected fees for students who never came.",
        ["Pay centres only for graduates placed in jobs", "Paid by results. The ghost centres vanished overnight."], ["A Skills Training Standards Bill", "Skills Training Standards Bill"], ["Executive order: close the ghost centres and name the owners", "the Training Centres Order"], ["Drop them quietly from next year's list", "Dropped. The owners opened new ones under new names."]],
      ["The okada ban", "The commissioner wants to ban okada in the capital for safety. Forty thousand young men earn their living on them.",
        ["Loans to move riders into tricycles and delivery", "Ten thousand riders now run tricycles and delivery bikes."], ["A Commercial Motorcycle Regulation Bill", "Commercial Motorcycle Regulation Bill"], ["Executive order: ban okada on the highways only", "the Highway Okada Order"], ["Ban them everywhere", "Banned. Forty thousand young men are idle, and angry."]],
      ["The japa wave", "Your best trainees leave for the UK and Canada as soon as they qualify.",
        ["Retention bonuses and start-up grants", "Two thousand stayed and started businesses."], ["A Diaspora Return and Skills Bill", "Diaspora Return and Skills Bill"], ["Executive order: bond trainees to two years' service", "the Training Bond Order"], ["Let them go", "They go. Their remittances come back."]],
    ] },
  women: { n: "the girls' education scheme", who: "teacher", bg: "classroom", scene: "ribbon-school",
    defect: ["Girls 'enrolled' last year never attended; inspectors found classrooms empty.", "Toilets built only in the towns mean village girls still drop out at puberty.", "The stipend paid through cronies never reached the mothers."],
    y: [
      ["Fathers keep girls at home", "Enrolment rose in the towns, but in the villages fathers keep girls at home to hawk, or marry them at thirteen.",
        ["Pay mothers a stipend for every girl in school", "Mothers are paid by phone each month the girl attends."], ["A Child Rights Bill: no marriage under eighteen", "Child Rights (Domestication) Bill"], ["Executive order: enrolment drives in every ward", "the Girls' Enrolment Order"], ["Count enrolment, not attendance", "On paper, every girl is in school."]],
      ["No toilets, no girls", "Girls drop out at puberty: half the schools have no toilets and no water.",
        ["Toilets and water in every school", "Toilets in every school. The drop-out rate falls by half."], ["A School Sanitation Bill", "School Sanitation Bill"], ["Executive order: no school opens without toilets", "the School Sanitation Order"], ["Build them only in the towns", "Town girls stay. Village girls leave."]],
      ["Clerics preach against the scheme", "A group of clerics says the scheme corrupts girls and is preaching against it in the Friday sermons.",
        ["Bring the clerics in: Islamiyya schools join the scheme", "The clerics now run classes under the scheme. The sermons changed."], ["A bill to protect every girl's right to education", "Girl-Child Education (Protection) Bill"], ["Executive order: arrest anyone who stops a girl going to school", "the Girl-Child Protection Order"], ["Pause the scheme in their areas", "Paused. The girls in those areas wait."]],
      ["The first girls graduate", "The first cohort sit their final exams. Universities want them; some families want bride prices.",
        ["University scholarships for the top 500", "Five hundred scholarships. The first doctors and engineers of their villages."], ["A Women's Economic Empowerment Bill", "Women's Economic Empowerment Bill"], ["Executive order: 30% of state jobs for women", "the Gender Inclusion Order"], ["A photo opportunity and nothing more", "A good photograph."]],
    ] },
  technology: { n: "the school broadband", who: "commissioner-technocrat", bg: "classroom", scene: "ribbon-school",
    defect: ["The cheap fibre laid last year was cut by road works; forty schools are offline.", "Generators bought for the labs on the cheap were stolen in a month.", "Refurbished laptops bought last year are dying; half the lab is dark."],
    y: [
      ["The right-of-way fees", "Telecoms companies will lay fibre to the schools, but your own state agency charges ₦5,000 a metre to dig.",
        ["Waive the fees and pay for the trenches", "The trenches are dug. Fibre reaches the first fifty schools."], ["A Right-of-Way Bill: cheap digging for fibre", "Right-of-Way (Telecoms) Bill"], ["Executive order: cap right-of-way fees for schools", "the Fibre Fees Order"], ["Let the telecoms pay the fees", "They pay, slowly. Ten schools a year."]],
      ["The labs have no power", "The computer labs are installed, but the grid barely reaches the schools.",
        ["Solar power for every lab", "Every lab on solar. The screens stay on."], ["A State Electricity Market Bill", "State Electricity Market Bill"], ["Executive order: the labs go on the priority power list", "the Lab Power Order"], ["Run the labs on generators", "Generators. And diesel. And thieves."]],
      ["The laptops vanish", "Three hundred laptops have disappeared from the labs; some are on sale in the computer village.",
        ["Tracking, cages and a custodian in every school", "Every laptop tracked. The computer village has none of ours."], ["A Public Assets Protection Bill", "Public Assets Protection Bill"], ["Executive order: search the markets and arrest the sellers", "the Stolen Assets Order"], ["Write them off", "Written off. More will go."]],
      ["Labs, but nobody to teach coding", "The labs work, but few teachers can teach coding.",
        ["Train 2,000 teachers with a technology company", "Two thousand teachers trained. The first coding club wins a national prize."], ["A Digital Skills Bill", "Digital Skills Bill"], ["Executive order: hire graduates as digital tutors", "the Digital Tutors Order"], ["Let the pupils play games on them", "Football games, mostly."]],
    ] },
  housing: { n: "the housing estates", who: "omo-onile-leader", bg: "project-site-halfway", scene: "ribbon-market",
    defect: ["Houses finished on the cheap last year have cracked walls; one roof fell in during the rains.", "The cheap water connection failed; residents buy water from tankers.", "Plots sold through the party quota were resold at triple the price."],
    y: [
      ["Three claimants for the estate land", "The estate site has three families claiming it, each with a certificate of occupancy, and omo onile are already selling plots.",
        ["Pay the true owners after a public hearing", "The hearing found the true owner. He was paid in public."], ["A Land Registry Reform Bill", "Land Registry Reform Bill"], ["Executive order: revoke all titles on the site", "the Land Revocation Order"], ["Pay off the omo onile and start building", "They took the money. Their cousins came next week."]],
      ["Who gets the houses?", "Ten thousand people applied for 250 homes. Civil servants want them reserved; the party wants a quota.",
        ["A public lottery, on television", "Drawn live. A nurse and a mechanic won the first two."], ["A Social Housing Allocation Bill", "Social Housing Allocation Bill"], ["Executive order: half for civil servants, half by lottery", "the Allocation Order"], ["Give the party its quota", "The party is pleased. The houses are let out at market rent."]],
      ["No mortgages", "Buyers cannot get mortgages: the banks charge 25% and want a third down.",
        ["A state mortgage subsidy", "Mortgages at 9%. The first families move in."], ["A State Mortgage and Foreclosure Bill", "Mortgage and Foreclosure Bill"], ["Executive order: rent-to-own on every state estate", "the Rent-to-Own Order"], ["Sell for cash only", "Cash buyers only: civil servants with second incomes."]],
      ["Cracks in the walls", "A year after the handover, the first houses show cracks. The contractor says the residents 'modified' them.",
        ["Repair them, and sue the contractor", "Repaired. The contractor is in court."], ["A Building Code Bill", "Building Code Bill"], ["Executive order: inspect every estate", "the Estate Inspection Order"], ["Blame the residents", "The residents blamed you on the radio."]],
    ] },
};

/* A second problem for each year of the first term, and for the second
   term's four. A new game draws, year by year, which one comes (v: one digit
   a year), so the same agenda is not the same story twice. */
const AG2 = {
  education: [
    ["The contractor builds where the chairman lives", "The first rebuilt schools are going up in the LGA chairmen's home wards, not where the survey said. The contractor says he was 'advised'.",
      ["Move the work to the survey's schools, and publish the list", "The list is online. The chairmen are furious; the riverine villages are not."], ["A bill: every school project chosen by a published needs index", "School Projects (Needs Index) Bill"], ["Executive order: freeze the chairmen's projects", "the School Projects Freeze Order"], ["Let it go: the chairmen deliver votes", "The chairmen are happy. The worst schools wait."]],
    ["Teachers who cannot teach", "A test of the state's teachers shows a third cannot pass the exams their pupils sit. The union calls the test an insult.",
      ["Retrain them, with pay rises for those who pass", "Retraining in the long vacation. Most pass the second time."], ["A Teacher Registration Bill: a licence to teach", "Teachers Registration and Licensing Bill"], ["Executive order: those who fail twice leave the classroom", "the Teacher Competence Order"], ["Bury the results", "The results are buried. The pupils are not taught."]],
    ["The textbooks never arrive", "The textbook contract was paid in full; the books are in a warehouse owned by the contractor's brother, being sold to private schools.",
      ["Buy new books, delivered straight to the schools", "Books in every rebuilt school by the second term."], ["A School Supplies Procurement Bill", "School Supplies (Procurement) Bill"], ["Executive order: seize the warehouse", "the Warehouse Seizure Order"], ["Ask for the books back, politely", "Some come back. Most do not."]],
    ["The private schools want the land", "Private school owners want the land beside three rebuilt schools to open 'partner' schools that charge fees. They offer to maintain the public ones in return.",
      ["Refuse, and build more public classrooms there", "More classrooms. The private schools look elsewhere."], ["A Public-Private Schools Bill with fee limits", "Public-Private Partnership (Schools) Bill"], ["Executive order: no sale of school land", "the School Land Order"], ["Sell them the land", "Sold. The fees are high."]],
  ],
  health: [
    ["The hospital board wants the money instead", "The state hospital board says the health centres are a waste, and that the money should go to a new specialist hospital in the capital.",
      ["Keep the money in the villages", "The centres keep their money. The board sulks."], ["A Primary Health Care Bill: a fixed share for the villages", "Primary Health Care (Funding) Bill"], ["Executive order: no new capital hospital until every centre is staffed", "the Village First Order"], ["Split it", "Half and half. Neither is finished."]],
    ["Doctors on strike over allowances", "Resident doctors in the state hospitals are on strike over unpaid allowances. Patients are being sent to the new health centres, which cannot cope.",
      ["Pay the allowances", "Paid. The doctors are back on Monday."], ["A Health Workers' Remuneration Bill", "Health Workers' Remuneration Bill"], ["Executive order: no work, no pay", "the No Work No Pay Order"], ["Wait them out", "They wait you out too."]],
    ["Fake drugs in the centres", "Inspectors found fake antimalarials in four of the new centres. A child died after a fake injection.",
      ["Buy only from certified suppliers, and test every batch", "Tested and certified. The fake suppliers are blacklisted."], ["A Drugs Quality Control Bill", "Drugs Quality Control Bill"], ["Executive order: shut every unlicensed drug market in the state", "the Drug Markets Order"], ["Blame the federal regulator", "The regulator blames you."]],
    ["The centres are full of cases they cannot treat", "The centres are full: diabetes, high blood pressure, cancer. They were built for coughs and births.",
      ["Train the nurses and stock the drugs for them", "Trained and stocked. Fewer referrals to the capital."], ["A Referral Hospitals Bill: a hospital in every zone", "Zonal Referral Hospitals Bill"], ["Executive order: free transport for referrals", "the Referral Transport Order"], ["Send them home", "They go home untreated."]],
  ],
  infrastructure: [
    ["The route goes through a market", "The best route for the first trunk road runs through a market of three thousand stalls. The market women say they will lie in front of the bulldozers.",
      ["Build a new market first, then move them", "A new market, then the road. The market women cut the ribbon themselves."], ["A bill: no demolition without a new site first", "Urban Renewal (Resettlement First) Bill"], ["Executive order: demolish and compensate later", "the Market Demolition Order"], ["Move the road around it", "A kink in the road. More expensive, and slower."]],
    ["The contractor is a party financier", "The lowest bidder for the second road is a party financier with no road experience. The engineers say his bid is impossible.",
      ["Award it to the engineers' choice", "The engineers' choice wins. The financier calls the party chairman."], ["A Procurement Bill: a technical score before price", "Public Procurement (Technical Evaluation) Bill"], ["Executive order: disqualify bidders with no experience", "the Contractor Experience Order"], ["Give it to the financier", "He wins. He subcontracts it to a firm that can build it, at half the price."]],
    ["Bandits on the new road", "The new road has made the villages reachable, for traders and for bandits. Two buses were stopped on it last month.",
      ["Patrols and lights along the road", "Patrols every ten kilometres. The buses run again."], ["A Highway Security Corps Bill", "Highway Security Corps Bill"], ["Executive order: no travel at night on the new roads", "the Night Travel Order"], ["Leave it to the police", "The police have three vans for the whole road."]],
    ["The federal government claims your road", "The federal ministry says your new road is on a federal route, and that it will 'take it over'. It wants the credit, and the toll.",
      ["Agree, if they refund the state", "They refund half. The ribbon is yours."], ["A bill to keep the road under the state", "State Roads (Designation) Bill"], ["Executive order: put state tolls on it now", "the State Tolls Order"], ["Let them have it", "Abuja cuts the ribbon you paid for."]],
  ],
  security: [
    ["The guards are not paid", "The community guards have not been paid for three months; the LGAs kept the money. Some guards are now 'collecting' from travellers.",
      ["Pay them directly into their bank accounts", "Paid by the state, into the bank. The checkpoints come down."], ["A bill: the guards' pay is a first charge on the budget", "Security Corps (Remuneration) Bill"], ["Executive order: no LGA touches the guards' pay", "the Guards' Pay Order"], ["Let the LGAs sort it out", "The guards sort it out themselves."]],
    ["The guards and the police fight", "The guards arrested a police officer at a checkpoint; the police arrested ten guards. The commissioner of police says the corps is illegal.",
      ["Joint patrols and a joint command room", "Joint patrols. The two forces share a radio."], ["A bill defining what the guards can and cannot do", "Security Corps (Powers) Bill"], ["Executive order: the guards hand suspects to the police within a day", "the Suspects Handover Order"], ["Back the guards against the police", "The commissioner writes to Abuja."]],
    ["The guards recruit from one tribe", "Nine in ten new guards come from one ethnic group. The others say the corps is a militia against them.",
      ["Recruit by LGA quota", "Every LGA, every community, in the corps."], ["A bill with recruitment quotas by LGA", "Security Corps (Recruitment) Bill"], ["Executive order: freeze recruitment until it is balanced", "the Recruitment Freeze Order"], ["Ignore it", "The others form their own guards."]],
    ["Kidnapping falls, robbery rises", "Kidnappings fell by half; armed robbery in the towns doubled. The bandits have changed their business.",
      ["Guards in the towns, and street lights", "Lights and patrols. Robberies fall too."], ["A Neighbourhood Watch Bill", "Neighbourhood Watch Bill"], ["Executive order: a curfew on the worst streets", "the Street Curfew Order"], ["Say crime is down", "It is not, in the towns."]],
  ],
  agriculture: [
    ["The tractors are in a politician's yard", "The scheme's forty tractors were found in a senator's yard, hiring out to whoever pays most.",
      ["Recover them and run a tractor hire centre for farmers", "Recovered. Farmers book them by phone."], ["A Farm Mechanisation Bill: tractors owned by co-operatives", "Farm Mechanisation (Co-operatives) Bill"], ["Executive order: seize them back", "the Tractor Recovery Order"], ["Buy new ones", "New tractors. The senator keeps the old ones."]],
    ["Fall armyworm", "Fall armyworm is eating the maize on the scheme. Farmers say the pesticide they got was fake.",
      ["Real pesticide, and extension workers in every village", "Sprayed in time. Half the harvest is saved."], ["A Pesticides Quality Bill", "Pesticides Quality Control Bill"], ["Executive order: arrest the fake pesticide sellers", "the Fake Inputs Order"], ["Pray for rain", "The worms do not care."]],
    ["The youths will not farm", "The scheme wants young farmers. The young men say farming is for their fathers, and want city jobs.",
      ["Start-up packages: land, inputs and a phone app for prices", "Two thousand young farmers sign up."], ["A Youth in Agriculture Bill", "Youth in Agriculture Bill"], ["Executive order: state jobs require a year on the farm scheme", "the Farm Service Order"], ["Hire labourers instead", "Labourers. The youths stay in the city."]],
    ["The rice mill wants a monopoly", "A big rice mill offers to buy every grain from the scheme, if the state bans other buyers.",
      ["Let every mill buy, and build a co-operative mill", "Many buyers, a co-operative mill. Prices hold."], ["A bill against exclusive buying deals", "Agricultural Produce (Fair Trading) Bill"], ["Executive order: the mill buys at a published floor price", "the Floor Price Order"], ["Grant the monopoly", "One buyer. One price. Low."]],
  ],
  anticorruption: [
    ["The civil servants go slow", "Since every contract went online, the ministries are 'reviewing' files for months. The contractors say nothing is being approved.",
      ["Deadlines for every file, and a dashboard", "Every file has a deadline, and the public can see it."], ["A Service Delivery (Timelines) Bill", "Service Delivery (Timelines) Bill"], ["Executive order: any file older than 30 days goes to your desk", "the File Deadlines Order"], ["Let them slow down", "Nothing moves. The old way returns."]],
    ["Your chief of staff's brother", "The published contracts show your Chief of Staff's brother has won four. The press wants to know if you will act.",
      ["Cancel and retender them", "Cancelled. Your Chief of Staff is not speaking to you."], ["A Conflict of Interest Bill covering officials' families", "Conflict of Interest (Officials' Families) Bill"], ["Executive order: officials' relatives cannot bid", "the Relatives Order"], ["Say he won fairly", "The press publishes the bids."]],
    ["The auditor-general is threatened", "The auditor-general found ₦2B missing from the works ministry, and has received death threats.",
      ["Protect him and publish the report", "Published, with a police escort for its author."], ["An Audit Independence Bill", "Audit Service (Independence) Bill"], ["Executive order: suspend everyone named", "the Audit Suspension Order"], ["Ask him to delay the report", "Delayed. He resigns."]],
    ["The opposition uses your portal", "The opposition is mining your open contracts for scandals in your own ministries, and finding them.",
      ["Fix what they find, in public", "Fixed in public. The opposition looks petty."], ["A bill to make the portal permanent", "Open Contracting Bill"], ["Executive order: answer every query in a week", "the Open Contracting Order"], ["Take the portal down for 'maintenance'", "Down for maintenance. Forever."]],
  ],
  youth: [
    ["The trainees want stipends", "The trainees say they cannot attend without money for transport and food. Attendance is half.",
      ["A transport and food stipend, paid by attendance", "Attendance doubles."], ["A Youth Skills Fund Bill", "Youth Skills Fund Bill"], ["Executive order: free buses for trainees", "the Trainee Transport Order"], ["Refuse a stipend", "Half of them stop coming."]],
    ["The certificates are worthless", "Employers say the programme's certificates mean nothing; anybody can buy one.",
      ["Exams set by employers", "Employers set the tests. The certificates mean something now."], ["A Skills Certification Bill", "Skills Certification Bill"], ["Executive order: void every certificate issued without an exam", "the Certificate Order"], ["Print more", "More certificates. Fewer jobs."]],
    ["The tech hub wants tax holidays", "A tech hub offers to train and hire two thousand young people, for ten years without state taxes.",
      ["Agree, with hiring targets", "Signed with targets. The first cohort starts in March."], ["A Startup Bill with tax credits for every hire", "Startup (Tax Credits) Bill"], ["Executive order: five years, not ten", "the Tech Hub Order"], ["Refuse", "They go to the next state."]],
    ["The okada riders want your programme", "Forty thousand okada riders say the programme ignores them. Their union has blocked the main roads.",
      ["A riders' track: mechanics, logistics and loans", "The riders have a track. The roads open."], ["A Commercial Transport Workers Bill", "Commercial Transport Workers Bill"], ["Executive order: riders get a quota of training places", "the Riders' Quota Order"], ["Clear the roads", "Cleared. They are back tomorrow."]],
  ],
  women: [
    ["The stipend goes to the fathers", "Inspectors found the mothers' stipend is being collected by the fathers, who keep it.",
      ["Pay to the mothers' own phones, with their faces", "Paid to the mothers, by face. The fathers protest."], ["A bill making the stipend the mother's by law", "Girl-Child Stipend Bill"], ["Executive order: stop payment where fathers collect", "the Stipend Order"], ["Let it be", "The fathers keep it."]],
    ["Teachers who prey on girls", "A teacher in a scheme school was caught abusing girls. Parents are pulling their daughters out.",
      ["Prosecute, and put women teachers in every school", "Charged. Women teachers in every girls' class."], ["A Child Protection in Schools Bill", "Child Protection in Schools Bill"], ["Executive order: a sex offender register for teachers", "the Teachers' Register Order"], ["Transfer him quietly", "Transferred. To another girls' school."]],
    ["Early marriages are rising", "With the scheme paying until fifteen, some families marry their daughters at sixteen.",
      ["Extend the stipend to the end of secondary school", "Paid to eighteen. The marriages wait."], ["A Child Rights Bill raising the age of marriage", "Child Rights (Domestication) Bill"], ["Executive order: no registrar marries anyone under eighteen", "the Marriage Age Order"], ["Leave it: it is their culture", "It is now your record."]],
    ["The women's market loan scheme", "The scheme's graduates' mothers want loans to trade. The banks will not lend to them without land titles.",
      ["A state micro-loan fund for women traders", "Ten thousand loans. Repayment is 96%."], ["A Women's Land Rights Bill", "Women's Land Rights Bill"], ["Executive order: state guarantees for women's loans", "the Loan Guarantee Order"], ["Tell them to ask their husbands", "They ask. The husbands say no."]],
  ],
  technology: [
    ["The telecoms want a tower in every school", "The telecoms will connect every school for free, if they can put a mast on each roof. Parents fear radiation.",
      ["Agree, and publish the safety tests", "Masts up, tests published. The fears fade."], ["A Telecoms Masts Bill with safety rules", "Telecoms Masts (Safety) Bill"], ["Executive order: masts only on school land, not roofs", "the Masts Order"], ["Refuse", "No masts. No signal."]],
    ["Hackers take the school records", "Hackers locked the new school records system and want a ransom in crypto.",
      ["Restore from backups and hire security", "Restored. The backups were there."], ["A State Data Protection Bill", "State Data Protection Bill"], ["Executive order: every system audited for security", "the Cyber Audit Order"], ["Pay them", "Paid. They come back next month."]],
    ["Children on the wrong websites", "Parents complain the labs' internet shows everything. A video of pupils watching something they should not has gone viral.",
      ["Filters and supervised lab hours", "Filtered and supervised. The parents calm down."], ["A Child Online Protection Bill", "Child Online Protection Bill"], ["Executive order: labs closed until filtered", "the Lab Closure Order"], ["Shrug", "The parents do not shrug."]],
    ["The coding graduates have no jobs", "The first coding graduates are looking for work. The local firms want experience.",
      ["A state apprenticeship with tech firms", "Five hundred apprentices placed."], ["A Digital Economy Bill", "Digital Economy Bill"], ["Executive order: state IT jobs go to the graduates first", "the Digital Jobs Order"], ["Leave it: their problem now", "They leave for Lagos."]],
  ],
  housing: [
    ["Cement is too dear", "Cement prices doubled; the estate is half-built and the contractor wants more money.",
      ["Pay the variation after review", "Reviewed and paid. Work resumes."], ["A Local Building Materials Bill", "Local Building Materials Bill"], ["Executive order: use local bricks and laterite blocks", "the Local Materials Order"], ["Build smaller houses", "Smaller houses. The same price."]],
    ["The estate has no water", "The first estate is finished, but there is no water connection; the water board says it was never told.",
      ["Connect it now, at full cost", "Connected. The residents move in."], ["A bill: no estate without utilities first", "Housing Utilities Bill"], ["Executive order: the water board connects within 30 days", "the Utilities Order"], ["Sell them water tankers", "Tankers every week."]],
    ["Squatters move into the empty houses", "Squatters moved into the empty houses before the allocation. They say they are homeless; the allottees want them out.",
      ["Allocate some to the squatters who qualify", "The qualifying squatters stay. The rest are moved with help."], ["A Tenancy Bill", "Tenancy and Recovery of Premises Bill"], ["Executive order: evict them", "the Eviction Order"], ["Let them stay", "The allottees sue."]],
    ["The landlords' association fights back", "Landlords say cheap state houses are killing rents, and are lobbying the House to stop the next estate.",
      ["Build the next estate anyway", "The next estate starts. The landlords lose."], ["A Rent Control Bill", "Rent Control Bill"], ["Executive order: publish every landlord's rents", "the Rents Order"], ["Pause the next estate", "Paused. Rents go up."]],
  ],
};
const TERM2B = (n) => [
  ["The audit you asked for", "The audit of " + n + " is in: good work in most places, waste in some. The commissioner who wasted it is the party's favourite.",
    ["Fix the waste, and move the commissioner", "Fixed. The commissioner is moved. The party is cross."], ["A bill making the audit yearly", "Programme Audit Bill"], ["Executive order: publish the audit in full", "the Audit Publication Order"], ["Keep it in the drawer", "In the drawer. The waste goes on."]],
  ["A neighbouring state copies you", "The neighbouring governor has copied " + n + " and claims it as his idea. His version is cheaper and worse.",
    ["Share yours: a joint programme across both states", "Joint, and better. Both governors take the credit."], ["A bill to protect the programme's standards", "Programme Standards Bill"], ["Executive order: publish your results every quarter", "the Results Order"], ["Attack him in the press", "A press war. Nobody gains."]],
  ["A donor wants to fund it", "A foreign donor will double the money for " + n + ", if every naira is audited by its own accountants.",
    ["Accept, with the donor's audit", "Doubled, and audited. The work speeds up."], ["A bill for donor-funded programmes", "Development Partners (Funding) Bill"], ["Executive order: one account for all donor money", "the Donor Funds Order"], ["Refuse: no foreign accountants", "Refused. The money goes elsewhere."]],
  ["Your successor's camp wants it renamed", "Your party's likely successor wants " + n + " renamed after himself, as the price of keeping it.",
    ["Let him rename it, if he keeps it", "Renamed. It survives."], ["A bill to fix its name and its funding", "Programme Continuity Bill"], ["Executive order: a five-year plan in its own name", "the Five-Year Plan Order"], ["Refuse, and let it take its chances", "Refused. His camp sulks."]],
];
// The second term, for any agenda.
const TERM2 = (n) => [
  ["Who pays for the upkeep?", "Five years on, " + n + " need upkeep, and there is no budget line for it. The Commissioner warns: 'We build, then we abandon. Every government does it.'",
    ["A maintenance budget, ring-fenced", "Upkeep has its own money now."], ["A Maintenance Fund Bill: a fixed share of revenue by law", "Maintenance Fund Bill"], ["Executive order: 5% of every ministry's budget for upkeep", "the Upkeep Order"], ["Fix things when they break", "Things break."]],
  ["Every LGA wants its share", "Every LGA now demands its share of " + n + " before the election. The money covers half of them.",
    ["Expand to every LGA over two years", "A two-year plan for every LGA, published."], ["A bill to make the expansion plan public and binding", "Expansion Plan Bill"], ["Executive order: the next sites by need, not by politics", "the Needs-First Order"], ["The party's LGAs first", "The party's LGAs first. The others will remember at the polls."]],
  ["The agency is captured", n.charAt(0).toUpperCase() + n.slice(1) + " are big money now. The party wants its contractors, and the agency that runs them is full of the godfather's people.",
    ["Clean out the agency: open tenders, new staff", "New staff, open tenders. The godfather is furious."], ["An agency bill: a board, audits and fixed tenure", "Agency Governance Bill"], ["Executive order: publish every contract and every hire", "the Agency Transparency Order"], ["Let the party share it", "Shared. The work slows."]],
  ["Will it survive you?", "Your successor's camp has promised a 'new agenda'. Without protection, " + n + " could be abandoned like the last government's projects.",
    ["Fund it three years ahead", "Three years of money, locked in."], ["A bill to write the programme into law", "Programme Continuity Bill"], ["Executive order: a five-year plan your successor inherits", "the Five-Year Plan Order"], ["Leave it to the next government", "Left to the next government."]],
];
const PAST = { pay: "paid", follow: "followed", recruit: "recruited", start: "started", hire: "hired", send: "sent", build: "built", rebuild: "rebuilt", make: "made", expand: "expanded", protect: "protected", retender: "retendered", repair: "repaired", fund: "funded", clean: "cleaned", bring: "brought", train: "trained", waive: "waived", let: "let", give: "gave", run: "ran", keep: "kept", sell: "sold", ban: "banned", buy: "bought", defend: "defended", leave: "left", count: "counted", celebrate: "celebrated", recover: "recovered", publish: "published", ask: "asked", drop: "dropped", cut: "cut", tell: "told", patch: "patched", fence: "fenced", wait: "waited", transfer: "transferred", blame: "blamed", write: "wrote", move: "moved", cancel: "cancelled", put: "put", open: "opened", close: "closed", share: "shared", go: "went", accept: "accepted", refuse: "refused", hold: "held", order: "ordered", license: "licensed", lift: "lifted", back: "backed", borrow: "borrowed", spend: "spent", stop: "stopped", free: "freed", enforce: "enforced", absorb: "absorbed", disarm: "disarmed", ignore: "ignored", say: "said", hunt: "hunted", feed: "fed", proclaim: "proclaimed", declare: "declared", modernise: "modernised", lead: "led", sack: "sacked", pray: "prayed", clear: "cleared", award: "awarded", agree: "agreed", prosecute: "prosecuted", extend: "extended", fix: "fixed", connect: "connected", allocate: "allocated", retrain: "retrained", restore: "restored", split: "split", bury: "buried", attack: "attacked", print: "printed", shrug: "shrugged", recruit_: "recruited", pause: "paused", deadlines: "set deadlines", seize: "seized", grant: "granted", void: "voided", evict: "evicted", stop: "stopped", take: "took", set: "set", talk: "talked", visit: "visited", meet: "met", bring_: "brought" };
// "Pay the true owners" → "paid the true owners"; a label that starts with a noun → "chose …".
export const pastOf = (label) => { const s = String(label).replace(/^Executive order:\s*/, ""), m = s.match(/^(\w+)(.*)$/); if (!m) return s; const w = m[1].toLowerCase(); if (!PAST[w]) return "chose " + s.charAt(0).toLowerCase() + s.slice(1); return PAST[w] + m[2].replace(/\b(and|then) (\w+)/g, (x, c, v) => c + " " + (PAST[v.toLowerCase()] || v)); };
const THIN_O = [["Redo it properly, at the full price", "Executive order: blacklist the contractor and recover the money", "A bill: contractors answer for their own defects for five years", "Patch it and move on"],
  ["Pull it down and rebuild it right", "Executive order: freeze the contractor's payments until it is fixed", "A bill: every public work certified by an independent engineer", "Paint over it"],
  ["Bring in new engineers and finish it properly", "Executive order: refer the contractor to the anti-corruption agency", "A bill: jail terms for substandard public works", "Say it is the weather"]];
const THIN_T = ["The cheap work shows", "Another shortcut comes home", "The press finds the shortcut", "An inspection finds the gap", "The shortcut costs lives", "It falls apart, again", "Corners cut, exposed", "Built to fail"];
const agendaCache = {};
// A draw of which problem each year brings: eight digits, 0 or 1. Stored with the story.
export const agendaVariant = (r = Math.random) => Array.from({ length: 8 }, () => (r() < .5 ? "0" : "1")).join("");
export const agendaStory = (agenda, v = "00000000") => {
  const key = agenda + ":" + v;
  if (agendaCache[key]) return agendaCache[key];
  const V = AG[agenda]; if (!V) return null;
  const alt = AG2[agenda] || [], t2a = TERM2(V.n), t2b = TERM2B(V.n);
  const years = [...V.y.map((Y, i) => (v[i] === "1" && alt[i] ? alt[i] : Y)), ...t2a.map((Y, i) => (v[4 + i] === "1" && t2b[i] ? t2b[i] : Y))], beats = {};
  years.forEach((Y, i) => {
    const k = i + 1, next = k < years.length ? "y" + (k + 1) : null, end = !next;
    const [t, d, pr, bl, or, co] = Y;
    const fin = end ? { close: true } : {};
    beats["y" + k] = { t, d, who: V.who, bg: V.bg, scene: k === 4 || k === 8 ? V.scene : null,
      opts: [
        { id: "fund", kind: "programme", l: pr[0], costX: 1, fx: { app: 4 }, delivered: true, next: next || "y" + k, past: pastOf(pr[0]), say: pr[1], ...fin },
        { id: "bill", kind: "bill", l: bl[0], costX: .15, fx: { app: 1 }, delivered: false, bill: { nm: bl[1], pass: next || "y" + k, fail: next || "y" + k }, past: "sent the " + bl[1] + " to the House", say: "Nothing is built this year. If the " + bl[1] + " passes, the fix lasts beyond you.", ...fin },
        { id: "order", kind: "order", l: or[0], costX: .1, fx: { app: 3 }, delivered: true, next: next || "y" + k, order: { nm: or[1], risk: .35, struck: next || "y" + k }, past: "signed " + or[1], say: "Signed and in force today. Those it hurts are calling their lawyers.", ...fin },
        { id: "corners", kind: "programme", l: co[0], costX: .5, fx: { app: 2, cor: .04 }, delivered: true, weak: true, next: end ? null : "x" + k, past: pastOf(co[0]), say: co[1], ...fin },
      ] };
    const TO = THIN_O[i % THIN_O.length];
    if (!end) beats["x" + k] = { t: THIN_T[i % THIN_T.length], d: V.defect[i % V.defect.length], who: V.who, bg: "project-site-stalled",
      opts: [
        { id: "redo", kind: "programme", l: TO[0], costX: 1.2, fx: { app: 1 }, delivered: true, next, past: "paid to redo last year's cheap work", say: "Redone properly. It cost more than doing it right the first time." },
        { id: "sue", kind: "order", l: TO[1], costX: .1, fx: { app: 2 }, delivered: false, next, order: { nm: ["the Recovery Order", "the Payment Freeze Order", "the Referral Order"][i % 3] + " (" + t.replace(/[?.,]/g, "").toLowerCase() + ")", risk: .3, struck: next }, past: "went after the contractor behind the cheap work", say: "Signed. The contractor's lawyers are busy." },
        { id: "law", kind: "bill", l: TO[2], costX: .15, fx: {}, delivered: false, bill: { nm: ["Defects Liability Bill", "Public Works Certification Bill", "Substandard Works (Offences) Bill"][i % 3], pass: next, fail: next }, past: "sent a bill to make contractors answer for bad work", say: "If it passes, no contractor walks away from bad work again." },
        { id: "patch", kind: "act", l: TO[3], costX: .2, fx: { app: -2 }, delivered: false, weak: true, next, past: "papered over last year's cheap work", say: "It will not hold." },
      ] };
  });
  const def = { id: "agenda_" + agenda, nm: "The flagship", start: "y1", heat0: 30, drift: 0, scale: .1, boilAt: 99, order: years.map((_, i) => "y" + (i + 1)), beats,
    legacy: "Saw the flagship through both terms.", faded: "The flagship ran out before its time." };
  agendaCache[key] = def;
  return def;
};
export const AGENDA_IDS = Object.keys(AG);

/* ── The security fronts: four wars that move ──
   The National Security Council's letter puts the worst front's current
   beat on the desk. Each answer has a cost (₦B), cools the front by sev and
   leads to the next development; a front left alone takes its `ignored`
   turn for the worse. zones: the mood of each region. */
const FP = (id, l, x) => ({ id, kind: "programme", l, ...x }), FB = (id, l, nm, pass, fail, x) => ({ id, kind: "bill", l, bill: { nm, pass, fail }, cost: 2, sev: -4, ...x }), FO = (id, l, nm, next, risk, struck, x) => ({ id, kind: "order", l, next, order: { nm, risk, struck }, cost: 2, ...x }), FA = (id, l, x) => ({ id, kind: "act", l, ...x });
export const FRONT_STORIES = {
  ne: { id: "front_ne", nm: "North-East", drift: 0, boilAt: 99, starts: ["lake", "farmers"], start: "lake", order: ["lake", "faction", "returnees", "harvest", "quiet"], beats: {
    lake: { t: "The Lake Chad islands", who: "national-security-adviser", scene: "creeks-gunboat", ignored: "faction", d: "Insurgents have moved onto the reed islands of Lake Chad, where tanks cannot follow. They raid fishing towns and tax the fish trade.",
      opts: [FP("boats", "Gunboats and a riverine battalion for the lake", { cost: 45, sev: -16, zones: { NE: 1 }, npc: { army: 4 }, next: "faction", past: "sent gunboats and a riverine battalion onto Lake Chad", say: "The islands are being cleared one by one." }),
        FB("basin", "A Lake Chad Basin Security Bill: a joint force with the neighbours", "Lake Chad Basin (Joint Force) Bill", "returnees", "faction", { past: "sent a bill for a joint Lake Chad force", say: "Chad, Niger and Cameroon are ready to sign if the Assembly is." }),
        FO("fish", "Executive order: ban fishing and the fish trade on the lake", "the Lake Chad Fishing Order", "harvest", .3, "faction", { cost: 0, sev: -8, zones: { NE: -2 }, fx: { app: -1 }, past: "banned fishing on Lake Chad by order", say: "The insurgents lose their tax. So do forty thousand fishermen." })] },
    farmers: { t: "Forty rice farmers killed in their fields", startOnly: true, who: "village-head", bg: "northern-farmland", ignored: "harvest", d: "Insurgents killed forty rice farmers who had gone back to their fields outside Monguno. They had been told it was safe.",
      opts: [FP("escort", "Soldiers in the fields at planting and harvest", { cost: 40, sev: -14, zones: { NE: 2 }, next: "harvest", past: "put soldiers in the fields after the massacre", say: "The farmers plant under guard." }),
        FB("compensation", "A Farmers' Protection and Compensation Bill", "Farmers' Protection and Compensation Bill", "returnees", "faction", { past: "sent a farmers' protection bill after the massacre", say: "If it passes, the families are paid by law." }),
        FO("zones", "Executive order: farming only in army-cleared zones", "the Farming Zones Order", "faction", .2, "faction", { cost: 0, sev: -8, zones: { NE: -2 }, past: "allowed farming only in cleared zones", say: "Safer fields, fewer of them." })] },
    faction: { t: "A new faction on the lake", who: "defence-minister", ignored: "returnees", d: "The Minister of Defence reports the pressure split the insurgents. A new faction is courting the fishing towns with food and 'justice', and it is winning recruits the old one never could.",
      opts: [FP("hearts", "Food, clinics and police posts in the fishing towns", { cost: 35, sev: -12, zones: { NE: 3 }, next: "returnees", past: "sent food, clinics and police into the fishing towns", say: "The new faction's food is not the only food any more." }),
        FO("informers", "Executive order: a reward fund for informants", "the Informant Rewards Order", "returnees", .2, "harvest", { cost: 5, sev: -10, past: "set up a reward fund for informants", say: "The first tips arrived in a week." }),
        FA("strike", "Air strikes on the faction's camps", { cost: 30, sev: -8, zones: { NE: -1 }, weak: true, next: "harvest", past: "answered the new faction with air strikes", say: "The camps burned. So did a fishing village by mistake." })] },
    harvest: { t: "Insurgents tax the harvest", who: "village-head", bg: "northern-farmland", ignored: "returnees", d: "Farmers who returned to their fields must pay the insurgents a third of the harvest, or lose their hands.",
      opts: [FP("escort", "Soldiers escort the harvest and guard the markets", { cost: 40, sev: -12, zones: { NE: 2 }, next: "returnees", past: "had soldiers escort the harvest", say: "The harvest reached the markets untaxed." }),
        FB("compensation", "A Farmers' Protection and Compensation Bill", "Farmers' Protection and Compensation Bill", "returnees", "returnees", { past: "sent a farmers' protection bill to the Assembly", say: "If it passes, farmers who lose crops are paid." }),
        FA("leave", "Tell farmers to stay in the towns", { weak: true, sev: 2, zones: { NE: -2 }, next: "returnees", past: "told farmers to stay away from their fields", say: "Safe, and hungry." })] },
    returnees: { t: "Who gets to come home?", who: "traditional-ruler-emir", bg: "emirs-palace-courtyard", ignored: "quiet", d: "Fighters' wives and children want to return to their villages. The villagers say the women informed on them; the emir asks you to decide.",
      opts: [FP("rehab", "Rehabilitation, then a supervised return", { cost: 30, sev: -10, zones: { NE: 2 }, next: "quiet", past: "rehabilitated the fighters' families before they returned", say: "The first families are home, under watch." }),
        FB("justice", "A Transitional Justice Bill: truth-telling before return", "Transitional Justice Bill", "quiet", "quiet", { past: "sent a transitional justice bill to the Assembly", say: "Victims will be heard first, if it passes." }),
        FO("bar", "Executive order: no returns until the war is won", "the Returns Order", "quiet", .25, "quiet", { cost: 0, sev: -4, zones: { NE: -1 }, past: "barred the fighters' families from returning", say: "The camps stay full." })] },
    quiet: { t: "The North-East is quieter", who: "national-security-adviser", ignored: "quiet", d: "Attacks in the North-East are the lowest in ten years. The army wants to move troops elsewhere; the governors beg you not to.",
      opts: [FP("hold", "Keep the troops, and hand over slowly to the police", { cost: 30, sev: -12, zones: { NE: 2 }, close: true, past: "kept the North-East quiet", say: "A slow handover. The quiet holds." }),
        FA("move", "Move two brigades to where they are needed more", { sev: -4, close: true, past: "moved troops out of a quieter North-East", say: "Two brigades leave. The governors are nervous." })] },
  } },
  nw: { id: "front_nw", nm: "North-West", drift: 0, boilAt: 99, starts: ["villages", "train"], start: "villages", order: ["villages", "forest", "amnesty", "gold", "herders", "settled"], beats: {
    villages: { t: "Bandits empty the villages", who: "village-head", bg: "northern-farmland", scene: "kidnap-camp-empty", ignored: "forest", d: "Bandits on motorcycles raid a village a week in the North-West, kidnap for ransom and 'tax' the farmers. Whole districts are empty.",
      opts: [FP("operation", "A military operation in the forests", { cost: 40, sev: -16, zones: { NW: -1, NC: 2 }, npc: { army: 3 }, next: "forest", past: "sent the army into the bandits' forests", say: "The forests are burning. The bandits scattered." }),
        FO("network", "Executive order: shut mobile networks in the worst LGAs", "the Telecoms Shutdown Order", "amnesty", .35, "forest", { cost: 0, sev: -10, fx: { app: -2 }, past: "shut mobile networks in the bandits' LGAs", say: "No phones, no ransom calls. No business either." }),
        FA("talks", "Let the governors negotiate with the bandit leaders", { cost: 10, sev: -6, zones: { NW: 2, NC: -2 }, next: "amnesty", past: "let the governors talk to the bandit leaders", say: "Talks under a tree. The bandits want money and amnesty." })] },
    train: { t: "Bandits bomb the Abuja–Kaduna train", startOnly: true, who: "defence-minister", scene: "kidnap-camp-empty", ignored: "forest", d: "Bandits blew up the line and stopped the Abuja–Kaduna train at night. Eight dead, sixty passengers marched into the forest. Their families have formed a WhatsApp group and are talking to the press.",
      opts: [FP("rescue", "A rescue operation, and soldiers on every train", { cost: 45, sev: -14, npc: { army: 3 }, next: "forest", past: "sent the army after the train kidnappers", say: "Twenty freed in the first raid. Soldiers ride every train." }),
        FA("negotiate", "Let a cleric negotiate their release", { cost: 10, sev: -6, next: "amnesty", past: "let a cleric negotiate for the train passengers", say: "The cleric goes into the forest with a list." }),
        FO("suspend", "Executive order: suspend the train until the line is secured", "the Rail Suspension Order", "gold", .1, "forest", { cost: 0, sev: -8, fx: { app: -2 }, past: "suspended the Abuja–Kaduna train", say: "No train. The road is worse." })] },
    forest: { t: "A warlord in the forest reserve", who: "defence-minister", bg: "northern-farmland", ignored: "gold", d: "The operation broke the gangs, and one leader, Kachalla Dan Sule, gathered the survivors in a forest reserve. He now runs it like a state: courts, taxes, a hundred motorcycles.",
      opts: [FP("siege", "Encircle the forest and starve him out", { cost: 45, sev: -14, npc: { army: 3 }, next: "gold", past: "laid siege to Dan Sule's forest", say: "The ring is closing." }),
        FO("bounty", "Executive order: ₦500M on Dan Sule's head", "the Bounty Order", "settled", .1, "gold", { cost: 5, sev: -10, past: "put a bounty on Kachalla Dan Sule", say: "His own men are counting the money." }),
        FB("forests", "A Forest Reserves (Rangers) Bill: armed rangers for every reserve", "Forest Reserves (Rangers) Bill", "gold", "gold", { past: "sent a forest rangers bill to the Assembly", say: "Rangers for every reserve, if it passes." })] },
    amnesty: { t: "Repentant bandits keep their guns", who: "governors-forum-chair", bg: "government-house", ignored: "forest", d: "The governors' amnesty brought three hundred bandits out of the forest. They were paid, and they kept their guns; some are kidnapping again.",
      opts: [FP("disarm", "Buy back the guns and register every fighter", { cost: 30, sev: -12, next: "gold", past: "bought back the bandits' guns", say: "Two thousand guns collected and burned." }),
        FO("end", "Executive order: end the amnesty, arrest those who kept their guns", "the Amnesty Revocation Order", "forest", .3, "forest", { cost: 0, sev: -8, npc: { gov: -6 }, past: "ended the governors' amnesty for bandits", say: "Arrests begin. The bandits go back to the forest." }),
        FA("pay", "Keep paying them to stay quiet", { cost: 10, weak: true, fx: { cor: .02 }, next: "gold", past: "kept paying the bandits to stay quiet", say: "Quiet, for a price, for now." })] },
    gold: { t: "Gold pays for the guns", who: "national-security-adviser", bg: "artisanal-gold-pits", ignored: "herders", d: "Intelligence says the bandits are funded by illegal gold mines in the forest, and the gold goes out through Kano to Dubai.",
      opts: [FP("mines", "Take over the mines and license the miners", { cost: 35, sev: -14, next: "herders", past: "took over the illegal gold mines", say: "The pits are licensed. The bandits' money dries up." }),
        FB("mining", "A Solid Minerals (Artisanal Mining) Bill", "Artisanal Mining Regulation Bill", "herders", "herders", { past: "sent an artisanal mining bill to the Assembly", say: "Licensed miners, traced gold, if it passes." }),
        FO("ban", "Executive order: ban all mining in the North-West", "the Mining Ban Order", "herders", .3, "herders", { cost: 0, sev: -8, zones: { NW: -2 }, past: "banned mining across the North-West", say: "Banned. Ten thousand miners out of work." })] },
    herders: { t: "Farmers and herders at war", who: "village-head", bg: "village-square", ignored: "settled", d: "With the bandits weaker, the old fight is back: herders' cattle in the farms, farmers' militias in the grazing routes. Forty dead in a week in the Middle Belt.",
      opts: [FP("ranches", "Ranches and grazing reserves, with water", { cost: 40, sev: -12, zones: { NC: 2, NW: 2 }, next: "settled", past: "built ranches and grazing reserves", say: "The first ranches are open. Fewer herds on the farms." }),
        FB("grazing", "A National Grazing Reserves Bill", "National Grazing Reserves Bill", "settled", "settled", { zones: { NC: -2 }, past: "sent a grazing reserves bill to the Assembly", say: "Middle Belt senators call it a land grab." }),
        FO("open", "Executive order: ban open grazing", "the Open Grazing Order", "settled", .3, "settled", { cost: 0, sev: -8, zones: { NC: 3, NW: -3 }, past: "banned open grazing by order", say: "Herders' groups are in court by Friday." })] },
    settled: { t: "The North-West breathes", who: "traditional-ruler-emir", bg: "emirs-palace-courtyard", ignored: "settled", d: "Farmers are back in the fields and the markets are open again. The emirs say keep the pressure on, or the forests fill again.",
      opts: [FP("keep", "Keep the rangers and the pressure on", { cost: 25, sev: -10, close: true, past: "steadied the North-West", say: "The forests stay empty." }),
        FA("scale", "Scale down and move the money elsewhere", { sev: -2, close: true, past: "scaled down in the North-West", say: "Scaled down. The emirs are watching the forests." })] },
  } },
  se: { id: "front_se", nm: "South-East", drift: 0, boilAt: 99, starts: ["mondays", "reprisal"], start: "mondays", order: ["mondays", "gunmen", "dialogue", "trial", "markets"], beats: {
    mondays: { t: "Mondays at home", who: "traditional-ruler-oba-obi", scene: "sit-at-home-street", ignored: "gunmen", d: "Separatists order everyone in the South-East to stay home every Monday. Those who open their shops are burned out. The region loses a day of trade every week.",
      opts: [FP("troops", "Deploy troops to break the sit-at-home", { cost: 30, sev: -14, zones: { SE: -4 }, fx: { app: -1 }, next: "gunmen", past: "deployed troops to break the sit-at-home", say: "The markets open under guard." }),
        FA("elders", "Talk to the elders and the churches", { cost: 10, sev: -8, zones: { SE: 4 }, next: "dialogue", past: "opened talks through the South-East's elders", say: "The elders will carry the message." }),
        FO("protect", "Executive order: compensate every trader burned out on a Monday", "the Traders' Protection Order", "dialogue", .1, "gunmen", { cost: 15, sev: -10, zones: { SE: 2 }, past: "compensated traders burned out for opening on Mondays", say: "Shops open on Monday. The enforcers are outnumbered." })] },
    reprisal: { t: "Soldiers burn a town after an ambush", startOnly: true, who: "traditional-ruler-oba-obi", scene: "sit-at-home-street", ignored: "gunmen", d: "Two soldiers were killed on video by 'unknown gunmen'. Troops raided the nearest town that night and burned forty houses. The South-East is in uproar.",
      opts: [FA("inquiry", "An independent inquiry, and pay for the houses", { cost: 15, sev: -10, zones: { SE: 5 }, npc: { army: -4 }, next: "dialogue", past: "ordered an inquiry into the burned town and paid for the houses", say: "The army is unhappy. The town is rebuilding." }),
        FP("intel", "Hunt the killers with intelligence, not reprisals", { cost: 30, sev: -12, next: "gunmen", past: "hunted the soldiers' killers through intelligence", say: "Three arrested. No more towns burned." }),
        FA("back", "Back the army", { weak: true, sev: -4, zones: { SE: -5 }, npc: { army: 4 }, next: "gunmen", past: "backed the army over the burned town", say: "The army is pleased. The South-East is not." })] },
    gunmen: { t: "'Unknown gunmen'", who: "police-commissioner", scene: "sit-at-home-street", ignored: "trial", d: "Since the troops came, 'unknown gunmen' have killed thirty police officers and burned eleven stations. The police no longer go out at night.",
      opts: [FP("intel", "Intelligence-led raids, not roadblocks", { cost: 35, sev: -12, next: "trial", past: "switched to intelligence-led raids in the South-East", say: "Fewer roadblocks, more arrests of the right people." }),
        FB("police", "A State Police amendment for the South-East's governors", "Constitution (State Police) Amendment Bill", "dialogue", "trial", { npc: { gov: 6 }, past: "backed state police for the South-East", say: "The governors want it badly." }),
        FA("harder", "More troops and curfews", { cost: 30, weak: true, sev: -4, zones: { SE: -4 }, next: "trial", past: "sent more troops and curfews to the South-East", say: "Curfews at six. Resentment all day." })] },
    dialogue: { t: "The elders want the detained leader freed", who: "traditional-ruler-oba-obi", ignored: "trial", d: "The South-East's elders say the sit-at-homes will end if the detained separatist leader is released to them. The army says he is the problem.",
      opts: [FO("release", "Executive order: release him to the elders, on conditions", "the Conditional Release Order", "markets", .4, "trial", { cost: 0, sev: -14, zones: { SE: 6 }, npc: { army: -6 }, past: "released the separatist leader to the elders", say: "Released. The next Monday, the markets open." }),
        FB("amnesty", "A Political Detainees Amnesty Bill", "Political Detainees Amnesty Bill", "markets", "trial", { past: "sent a political detainees amnesty bill to the Assembly", say: "A law, not a favour, if it passes." }),
        FA("no", "Refuse: the courts will decide", { sev: 2, zones: { SE: -3 }, next: "trial", past: "refused to release the separatist leader", say: "Refused. The elders go home empty-handed." })] },
    trial: { t: "The trial everyone is watching", who: "judge", bg: "courtroom", ignored: "markets", d: "The separatist leader's trial has opened. Every adjournment brings a sit-at-home; his followers abroad stream every hearing.",
      opts: [FP("speed", "Fund the court to sit every day until it is done", { cost: 10, sev: -8, next: "markets", past: "pushed for a speedy trial", say: "Daily hearings. A verdict before the rains." }),
        FA("political", "Seek a political settlement instead", { sev: -10, zones: { SE: 4 }, npc: { army: -4 }, next: "markets", past: "sought a political settlement over the trial", say: "Back channels open." }),
        FO("ban", "Executive order: ban the group's broadcasts from abroad", "the Broadcast Ban Order", "markets", .3, "markets", { cost: 0, sev: -4, fx: { app: -1 }, past: "banned the separatists' broadcasts", say: "Blocked. VPNs are selling fast in Onitsha." })] },
    markets: { t: "The South-East's markets reopen", who: "market-trader", bg: "busy-market-street", ignored: "markets", d: "Monday trading is back in Onitsha and Aba. Investors from the diaspora are asking about the new industrial park.",
      opts: [FP("park", "Build the industrial park and the roads to it", { cost: 35, sev: -10, zones: { SE: 5 }, close: true, past: "brought trade back to the South-East", say: "Diggers on site. The Monday sit-at-homes are history." }),
        FA("leave", "Declare victory and move on", { close: true, sev: -2, past: "declared the sit-at-homes over", say: "Over, you say. The elders hope so." })] },
  } },
  ss: { id: "front_ss", nm: "Niger Delta", drift: 0, boilAt: 99, starts: ["tapping", "wellhead"], start: "tapping", order: ["tapping", "refineries", "contract", "trust", "output"], beats: {
    tapping: { t: "The pipelines are bleeding", who: "oil-community-leader", bg: "oil-creek-spill", ignored: "refineries", d: "Thieves tap the pipelines and fill barges every night. Oil output has fallen to its lowest in a decade, and the Federation Account shrinks with it.",
      opts: [FP("navy", "Send the Navy and the army into the creeks", { cost: 35, sev: -15, zones: { SS: -3 }, npc: { army: 2 }, next: "refineries", past: "sent the Navy into the creeks", say: "Illegal refineries burn every night now." }),
        FO("surveil", "Executive order: surveillance contracts for the communities", "the Pipeline Surveillance Order", "contract", .2, "refineries", { cost: 30, sev: -11, zones: { SS: 3 }, fx: { cor: .01 }, past: "gave pipeline surveillance contracts to the communities", say: "The communities guard the pipes now, for pay." }),
        FB("metering", "A Petroleum Metering Bill: every barrel measured", "Crude Oil Metering Bill", "contract", "refineries", { past: "sent a crude oil metering bill to the Assembly", say: "If it passes, every barrel stolen is a barrel counted." })] },
    wellhead: { t: "A wellhead has burned for a month", startOnly: true, who: "oil-community-leader", bg: "oil-creek-spill", ignored: "trust", d: "A wellhead blowout in the creeks has burned for a month. The company says sabotage; the community says the wellhead was old and never fixed. Soot falls on the villages like black rain.",
      opts: [FP("cap", "Fly in specialists to cap it, and care for the villages", { cost: 35, sev: -12, zones: { SS: 4 }, next: "trust", past: "had the burning wellhead capped and cared for the villages", say: "Capped in nine days. The clinics are full of coughing children." }),
        FB("liability", "A bill: oil companies pay for every spill, sabotage or not", "Oil Spill (Strict Liability) Bill", "trust", "refineries", { past: "sent a strict liability bill for oil spills", say: "The companies are lobbying hard against it." }),
        FO("shut", "Executive order: shut the company's field until it is safe", "the Field Shutdown Order", "trust", .4, "refineries", { cost: 0, sev: -8, zones: { SS: 3 }, past: "shut the oil field until the wellhead was safe", say: "The field is shut. So is a slice of the Federation Account." })] },
    refineries: { t: "The illegal refineries", who: "oil-community-leader", bg: "illegal-refinery-night", ignored: "contract", d: "Burning the illegal refineries has poisoned the creeks with soot; children are coughing and fish are dying. The young men who ran them have nothing else.",
      opts: [FP("modular", "License the operators into modular refineries", { cost: 30, sev: -12, zones: { SS: 4 }, next: "contract", past: "licensed the illegal refiners into modular refineries", say: "Outlaws become operators. The soot is clearing." }),
        FB("cleanup", "A Niger Delta Clean-up Bill", "Niger Delta Environmental Restoration Bill", "trust", "contract", { past: "sent a Niger Delta clean-up bill to the Assembly", say: "A clean-up fund, if it passes." }),
        FA("burn", "Keep burning them", { cost: 10, weak: true, sev: -4, zones: { SS: -3 }, next: "contract", past: "kept burning the illegal refineries", say: "The creeks are black." })] },
    contract: { t: "A former militant guards the pipes", who: "ex-militant-general", ignored: "trust", d: "The pipeline surveillance contract went to a former militant general. Theft is down, and so are the questions: his men patrol the creeks, and some say they decide whose oil is stolen.",
      opts: [FO("audit", "Executive order: audit the surveillance contract", "the Contract Audit Order", "trust", .3, "output", { cost: 2, sev: -6, fx: { cor: -.01 }, past: "audited the former militant's surveillance contract", say: "The audit is under way. The general is unhappy." }),
        FP("split", "Split the contract among the host communities", { cost: 20, sev: -10, zones: { SS: 3 }, next: "trust", past: "split the pipeline contract among the host communities", say: "Many guards, no warlord." }),
        FA("keep", "Keep him: it works", { fx: { cor: .02 }, weak: true, sev: -4, next: "output", past: "kept the former militant's contract", say: "It works. For him." })] },
    trust: { t: "The host communities want a share", who: "oil-community-leader", bg: "waterfront-settlement", ignored: "output", d: "The host communities say the oil companies take everything and leave them the pollution. The trust fund promised in the law has not paid a naira.",
      opts: [FP("pay", "Pay the trust fund what is owed, with audits", { cost: 30, sev: -12, zones: { SS: 5 }, next: "output", past: "paid the host communities' trust fund", say: "The first schools and clinics are funded by the trust." }),
        FO("enforce", "Executive order: oil companies pay the trust or lose their licences", "the Host Communities Order", "output", .3, "output", { cost: 0, sev: -10, zones: { SS: 3 }, past: "ordered oil companies to fund the host communities' trust", say: "The companies are paying, and suing." }),
        FA("wait", "Tell them to wait for oil prices", { weak: true, sev: 3, zones: { SS: -3 }, next: "output", past: "told the host communities to wait", say: "They will not wait quietly." })] },
    output: { t: "Oil output recovers", who: "petroleum-minister", ignored: "output", d: "Oil output is back to its best in years, and the Federation Account is fuller. The creeks are calmer than anyone remembers.",
      opts: [FP("reinvest", "Reinvest in the Delta: roads, power, clean water", { cost: 30, sev: -10, zones: { SS: 4 }, close: true, past: "brought peace to the creeks", say: "The Delta sees the oil money for once." }),
        FA("bank", "Bank the money for the federal budget", { sev: -2, close: true, past: "banked the oil recovery", say: "Banked. The Delta notices." })] },
  } },
};
