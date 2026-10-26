/* Trade between neighbouring states (rules only, no React). A governor visits
   a neighbour (or sends the Commissioner for Commerce) and signs a deal: a
   supply pact, market access, a joint project or a security pact. Deals earn
   or cost every year, and each one can turn into a storyline: toll gates on
   the route, a partner in trouble, a new governor who tears the deal up, a
   boundary quarrel, goods leaking across the border, or success. When two
   governors fall out, it reaches the President's desk. Neighbours are the
   real ones; the governors are fictional. */
import { storyStart } from "./storylines.js";
import { produceOf } from "./trade.js";

// Who borders whom (land borders between states; symmetric, checked in tests).
export const NEIGHBOURS = {
  Abia: ["Imo", "Rivers", "Akwa_Ibom", "Cross_River", "Ebonyi", "Enugu"],
  Adamawa: ["Borno", "Gombe", "Taraba"],
  Akwa_Ibom: ["Cross_River", "Abia", "Rivers"],
  Anambra: ["Delta", "Kogi", "Enugu", "Imo", "Rivers"],
  Bauchi: ["Kano", "Jigawa", "Yobe", "Gombe", "Taraba", "Plateau", "Kaduna"],
  Bayelsa: ["Delta", "Rivers"],
  Benue: ["Nassarawa", "Taraba", "Cross_River", "Ebonyi", "Enugu", "Kogi"],
  Borno: ["Yobe", "Gombe", "Adamawa"],
  Cross_River: ["Benue", "Ebonyi", "Abia", "Akwa_Ibom"],
  Delta: ["Edo", "Ondo", "Anambra", "Rivers", "Bayelsa"],
  Ebonyi: ["Benue", "Enugu", "Abia", "Cross_River"],
  Edo: ["Kogi", "Ondo", "Delta"],
  Ekiti: ["Kwara", "Kogi", "Ondo", "Osun"],
  Enugu: ["Kogi", "Benue", "Ebonyi", "Abia", "Anambra"],
  FCT: ["Niger", "Kaduna", "Nassarawa", "Kogi"],
  Gombe: ["Bauchi", "Yobe", "Borno", "Adamawa", "Taraba"],
  Imo: ["Anambra", "Rivers", "Abia"],
  Jigawa: ["Kano", "Katsina", "Bauchi", "Yobe"],
  Kaduna: ["Katsina", "Kano", "Bauchi", "Plateau", "Nassarawa", "FCT", "Niger", "Zamfara"],
  Kano: ["Katsina", "Jigawa", "Bauchi", "Kaduna"],
  Katsina: ["Zamfara", "Kaduna", "Kano", "Jigawa"],
  Kebbi: ["Sokoto", "Zamfara", "Niger"],
  Kogi: ["Niger", "FCT", "Nassarawa", "Benue", "Enugu", "Anambra", "Edo", "Ondo", "Ekiti", "Kwara"],
  Kwara: ["Niger", "Kogi", "Ekiti", "Osun", "Oyo"],
  Lagos: ["Ogun"],
  Nassarawa: ["Kaduna", "Plateau", "Taraba", "Benue", "Kogi", "FCT"],
  Niger: ["Kebbi", "Zamfara", "Kaduna", "FCT", "Kogi", "Kwara"],
  Ogun: ["Lagos", "Oyo", "Osun", "Ondo"],
  Ondo: ["Ogun", "Osun", "Ekiti", "Kogi", "Edo", "Delta"],
  Osun: ["Oyo", "Ogun", "Ondo", "Ekiti", "Kwara"],
  Oyo: ["Ogun", "Osun", "Kwara"],
  Plateau: ["Bauchi", "Kaduna", "Nassarawa", "Taraba"],
  Rivers: ["Imo", "Abia", "Akwa_Ibom", "Bayelsa", "Delta", "Anambra"],
  Sokoto: ["Zamfara", "Kebbi"],
  Taraba: ["Adamawa", "Gombe", "Bauchi", "Plateau", "Nassarawa", "Benue"],
  Yobe: ["Borno", "Gombe", "Bauchi", "Jigawa"],
  Zamfara: ["Sokoto", "Kebbi", "Niger", "Kaduna", "Katsina"],
};
export const neighboursOf = (state) => NEIGHBOURS[state] || [];
export const stateLabel = (s) => String(s || "").replace(/_/g, " ");
const h = (s) => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
// A state on the road between two neighbours' markets (shares a border with the partner, not with you), for the toll-gate storyline.
export const routeState = (from, to) => neighboursOf(to).find(x => x !== from && !neighboursOf(from).includes(x)) || neighboursOf(to).find(x => x !== from) || null;

/* The four kinds of deal. {p} the partner state, {c} their crop, {y} your crop.
   cost: your share, ₦B, paid on signing. Each year: cash (₦B), app, sec. */
export const DEAL_KINDS = {
  supply: { nm: "Supply pact", icon: "🧺", ico: "icon-deal-supply", l: "Their {c} to our markets and factories, at an agreed price", cost: .5, cash: .4, app: 1, d: "Food is cheaper at home and your factories have raw materials." },
  market: { nm: "Market access", icon: "🚚", ico: "icon-deal-market", l: "Our {y} into {p}'s markets, without their levies", cost: .3, cash: 1, app: 0, d: "A new market for what your state grows or makes: money every year." },
  joint: { nm: "Joint project", icon: "🛣️", ico: "icon-deal-joint", l: "A joint road and border market with {p}, half each", cost: 2.5, cash: 1.6, app: 1, years: 2, d: "Two years to build, half the cost each. Both states earn when it opens." },
  security: { nm: "Security pact", icon: "🛡️", ico: "icon-deal-security", l: "Joint patrols on the {p} highway against kidnappers", cost: 1, cash: 0, app: 1, sec: .01, d: "The border district is safer; traders and farmers move again." },
};
export const fillText = (x, m) => typeof x === "string" ? x.replace(/\{(\w)\}/g, (a, k) => m[k] != null ? m[k] : a) : Array.isArray(x) ? x.map(v => fillText(v, m)) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, fillText(v, m)])) : x;

// The neighbours' governors: a party and how they feel about you, drawn once a game.
export const interInit = (state, seed = "", party = null) => {
  const gov = {};
  neighboursOf(state).forEach(n => { const x = h(seed + ":" + n); gov[n] = { party: x % 3 === 0 ? "opp" : "same", rel: 40 + (x % 31), seed: x }; if (party) gov[n].partyNm = gov[n].party === "same" ? party : null; });
  return { gov, deals: [], stories: {}, last: null };
};

/* Will they sign? go: you went yourself. Returns { ok, odds, ask } where ask is
   their price for a yes when the answer is no (an opposition governor asks more). */
export const ASKS = [
  { id: "share", l: "A tenth of the deal's earnings goes to {p}", fx: { cash: -.1 } },
  { id: "forum", l: "Back {p}'s Governor for chairman of the zone's Governors' Forum", fx: { pStab: -2 } },
  { id: "boundary", l: "Settle the old boundary quarrel in {p}'s favour", fx: { app: -2 } },
];
export const missionOdds = (G, kind, { go = false, sec = .5, fit = false } = {}) => {
  let o = .35 + (G.rel - 50) / 120 + (G.party === "same" ? .15 : -.05) + (go ? .15 : 0) + (fit ? .1 : 0) - (kind === "joint" ? .1 : 0) + (kind === "security" && sec < .45 ? .1 : 0);
  return Math.max(.1, Math.min(.9, Math.round(o * 100) / 100));
};
export const mission = (I, partner, kind, { go = false, sec = .5, turn = 0, r = Math.random, fit = false } = {}) => {
  const G = I.gov[partner], odds = missionOdds(G, kind, { go, sec, fit }), ok = r() < odds;
  return { ok, odds, ask: ok ? null : ASKS[(G.seed + turn) % ASKS.length] };
};
export const signDeal = (I, partner, kind, turn, ask = null) => {
  const K = DEAL_KINDS[kind], id = kind + ":" + partner + ":" + turn;
  const deal = { id, partner, kind, t0: turn, opens: turn + (K.years || 0), status: "active", ask: ask ? ask.id : null, mods: {} };
  const gov = { ...I.gov, [partner]: { ...I.gov[partner], rel: Math.min(100, I.gov[partner].rel + 8) } };
  return { ...I, gov, deals: [...I.deals, deal], last: turn };
};
export const ACTIVE_MAX = 3;
export const activeDeals = (I) => (I && I.deals || []).filter(d => d.status === "active");

/* The year's deals: what they earn, and which storyline opens.
   Returns { I, cash, app, sec, lines, open: { id, deal } | null }. */
export const interYear = (I0, { turn, state, r = Math.random } = {}) => {
  const I = { ...I0, deals: (I0.deals || []).map(d => ({ ...d, mods: { ...d.mods } })), stories: { ...(I0.stories || {}) } };
  let cash = 0, app = 0, sec = 0; const lines = [];
  I.deals.filter(d => d.status === "active").forEach(d => {
    const K = DEAL_KINDS[d.kind], P = stateLabel(d.partner);
    if (turn < d.opens) { lines.push("🛣️ The joint project with " + P + ": " + (d.mods.frozen ? "frozen, " + P + " has stopped paying." : (d.opens - turn) + " more year" + (d.opens - turn === 1 ? "" : "s") + " to build.")); return; }
    const mul = (d.mods.levy ? .5 : 1) * (d.mods.boost ? 1.5 : 1) * (d.ask === "share" ? .9 : 1) * (d.mods.leak ? .7 : 1);
    const c = Math.round(K.cash * mul * 10) / 10;
    cash += c; app += K.app; sec += K.sec || 0;
    if (c > 0) lines.push("🤝 " + K.nm + " with " + P + ": ₦" + c.toFixed(1) + "B this year" + (d.mods.levy ? " (the toll gates take half)" : "") + ".");
    else lines.push("🤝 " + K.nm + " with " + P + ": in force.");
    d.mods.leak = false;
  });
  // One storyline at a time, about one of your deals.
  const busy = Object.values(I.stories).some(x => x && x.S && !x.S.closed);
  const live = I.deals.filter(d => d.status === "active");
  let open = null;
  if (!busy && live.length && r() < .6) {
    const d = live[Math.floor(r() * live.length)], age = turn - d.t0;
    const pool = Object.keys(INTER_STORIES).filter(id => !I.stories[id + ":" + d.id] && INTER_STORIES[id].when(d, { turn, age, state }));
    if (pool.length) { const id = pool[Math.floor(r() * pool.length)]; open = { id, deal: d }; I.stories[id + ":" + d.id] = { S: storyStart(INTER_STORIES[id], id + d.id, r), deal: d.id, partner: d.partner, third: routeState(state, d.partner) }; }
  }
  return { I, cash: Math.round(cash * 10) / 10, app, sec, lines, open };
};
// Apply a storyline option's changes to the deal (mod) and the partner governor (rel).
export const interApply = (I0, dealId, { mod = null, rel = 0, end = false } = {}) => {
  const I = { ...I0, deals: I0.deals.map(d => d.id === dealId ? { ...d, mods: { ...d.mods, ...(mod || {}) }, status: end ? "ended" : d.status } : d) };
  const d = I.deals.find(x => x.id === dealId);
  if (d && rel) I.gov = { ...I.gov, [d.partner]: { ...I.gov[d.partner], rel: Math.max(0, Math.min(100, I.gov[d.partner].rel + rel)) } };
  return I;
};

/* The storylines, on the storyline engine. {p} the partner, {t} the state on
   the route, {g} the partner's governor, {k} the deal. Option extras: mod
   (on the deal), rel (the partner governor), end (the deal ends). */
const P = (id, l, x) => ({ id, kind: "programme", l, ...x });
const A = (id, l, x) => ({ id, kind: "act", l, ...x });
const O = (id, l, nm, next, risk, struck, x) => ({ id, kind: "order", l, next, order: { nm, risk, struck }, cost: .1, ...x });
const st = (id, nm, beats, boil, when, extra = {}) => ({ id: "inter_" + id, nm, start: "a", starts: beats.a2 ? ["a", "a2"] : undefined, boil, heat0: 40, drift: 0, scale: .05, beats, when, ...extra });
export const INTER_STORIES = {
  levies: st("levies", "The toll gates", {
    a: { t: "{t} stops our trucks", startOnly: true, who: "truckers-union-leader-angry", bg: "busy-market-street", scene: "interstate-checkpoint", d: "Our trucks on the {p} route are stuck at checkpoints in {t}. Its revenue service charges an 'interstate transit levy' on every vehicle, and has seized twenty trucks that would not pay.",
      opts: [A("call", "Call the Governor of {t}", { odds: .6, win: { say: "He clears the checkpoints within a week. He will remember the favour." }, lose: { mod: { levy: true }, say: "He wants a cut of the trade before the gates come down." }, next: "b", past: "called the Governor of {t} about the toll gates" }),
        P("bypass", "Pay for a rail and river route around {t}", { cost: 1.5, mod: { levy: false }, next: "c", past: "built a route around {t}'s toll gates", say: "Slower to build, but no one can stop the trucks again." }),
        O("retaliate", "Executive order: a levy on every {t}-registered vehicle", "the Reciprocal Levy Order", "d", .3, "b", { fx: { app: 1 }, mod: { levy: true }, past: "put a levy on {t}'s vehicles", say: "Popular at home. {t} doubles its gates." })] },
    b: { t: "The gates come back", who: "truckers-union-leader", bg: "busy-market-street", scene: "interstate-checkpoint", d: "Three months later the gates in {t} are back, now run by 'task force' youths who answer to nobody. The truckers' union threatens to stop the route.",
      opts: [P("bypass", "Build the route around {t}", { cost: 1.5, mod: { levy: false }, next: "c", past: "built a route around {t}", say: "The trucks go round." }),
        A("forum", "Take it to the Governors' Forum", { mod: { levy: false }, next: "c", past: "took the toll gates to the Governors' Forum", say: "The Forum condemns the gates. {t} backs down, for now." })] },
    c: { t: "The route is open", endOnly: true, who: "truckers-union-leader", bg: "busy-market-street", scene: "interstate-highway", d: "The trucks between here and {p} move freely again, and traders on both sides say the deal is finally working.",
      opts: [A("hold", "Keep it that way", { mod: { levy: false, boost: true }, rel: 4, close: true, past: "kept the {p} route open", say: "More trucks every month." })] },
    d: { t: "A trade war", who: "neighbour-governor-male-angry", bg: "government-house", scene: "interstate-checkpoint", d: "{t} has answered your levy by blocking food trucks to your markets. Prices are rising, and the President's office has asked both governors to Abuja.",
      opts: [A("abuja", "Go to Abuja and make peace", { fx: { app: -1 }, mod: { levy: false }, next: "c", past: "made peace with {t} in Abuja", say: "Both levies are lifted. Both governors claim victory." }),
        A("hold", "Hold out", { weak: true, fx: { app: -2 }, next: "c", past: "held out in the trade war with {t}", say: "Weeks of empty market stalls, then a truce." })] },
  }, "d", (d) => d.kind === "supply" || d.kind === "market"),
  freeze: st("freeze", "The half-built road", {
    a: { t: "{p} stops paying", startOnly: true, who: "contractor", bg: "project-site-stalled", scene: "joint-project-site", d: "A strike in {p} has emptied its treasury. Its half of the joint project has not been paid for four months; the contractor is leaving the site, and your half is sunk in the ground.",
      opts: [P("pay", "Pay their half to finish it", { cost: 1.2, mod: { frozen: false }, next: "b", past: "paid {p}'s half of the joint project", say: "The road is finished on your money. {p} owes you." }),
        A("wait", "Wait for {p} to recover", { mod: { frozen: true }, next: "c", past: "waited for {p} to pay its half", say: "The site waits. So do you." }),
        A("walk", "Walk away from the project", { weak: true, end: true, close: true, past: "walked away from the joint project with {p}", say: "Half a road, and your half of the money in it." })] },
    b: { t: "The road opens", endOnly: true, who: "neighbour-governor-male-pleased", bg: "project-ribbon-cutting", scene: "interstate-highway", d: "The joint road and border market with {p} are open. {g} came to the ribbon-cutting and thanked you in front of the cameras.",
      opts: [A("open", "Cut the ribbon together", { fx: { app: 2 }, mod: { frozen: false, boost: true }, rel: 10, close: true, past: "opened the joint road with {p}", say: "Traders on both sides fill the new market." })] },
    c: { t: "Still frozen", who: "contractor", bg: "project-site-stalled", scene: "joint-project-site", d: "A year on, {p} still has not paid. The grass is growing over the half-built road, and the press calls it a white elephant.",
      opts: [P("pay", "Pay their half after all", { cost: 1.4, mod: { frozen: false }, next: "b", past: "finally paid {p}'s half of the road", say: "Work restarts." }),
        A("walk", "Write it off", { weak: true, end: true, close: true, past: "wrote off the joint project with {p}", say: "A white elephant on the border." })] },
  }, "c", (d, { turn }) => d.kind === "joint" && turn < d.opens),
  election: st("election", "A new governor in {p}", {
    a: { t: "{p}'s new governor tears up the deal", startOnly: true, who: "neighbour-governor-female-angry", bg: "neighbour-government-house", d: "The opposition won the governorship in {p}. The new Governor says your {k} was 'a bad deal signed by a failed government', and has suspended it.",
      opts: [A("visit", "Visit the new Governor in person", { odds: .55, win: { rel: 10, say: "Over dinner, the deal survives, with their name on it now." }, lose: { end: true, say: "Polite, firm, and over." }, close: true, past: "visited {p}'s new Governor to save the deal" }),
        A("better", "Offer better terms", { fx: {}, mod: { boost: false }, rel: 6, close: true, past: "renegotiated the deal with {p}'s new Governor", say: "The deal survives, worth a little less." }),
        A("let", "Let it go", { end: true, close: true, past: "let {p}'s new Governor end the deal", say: "The deal is over." })] },
  }, "a", (d, { turn }) => d.kind !== "joint" && turn % 4 === 0),
  boundary: st("boundary", "The boundary quarrel", {
    a: { t: "Two villages fight over farmland", startOnly: true, who: "village-head", bg: "northern-farmland", scene: "boundary-clash", d: "Farmers from your side and from {p} clashed over a stretch of farmland both states claim. Two people are dead, and youths on both sides are arming. The pact with {p} is on hold until it is settled.",
      opts: [A("panel", "A joint peace panel with {g}", { fx: { app: 1 }, rel: 6, next: "b", past: "set up a joint peace panel with {p}", say: "Elders from both sides sit together." }),
        P("police", "Deploy police between the villages", { cost: .3, fx: { sec: .01 }, next: "b", past: "sent police to the boundary with {p}", say: "Quiet, for now." }),
        A("commission", "Refer it to the National Boundary Commission", { next: "b", past: "referred the boundary with {p} to the National Boundary Commission", say: "Surveyors come. A ruling will take years." })] },
    b: { t: "Peace on the boundary", endOnly: true, who: "village-head", bg: "village-square", scene: "border-market", d: "The two villages have agreed to farm the disputed land in turns, and traders cross again.",
      opts: [A("hold", "Mark it with a joint market", { fx: { app: 1 }, rel: 4, close: true, past: "made peace on the boundary with {p}", say: "A market day on the boundary, every week." })] },
  }, "a", () => true),
  leak: st("leak", "Goods across the border", {
    a: { t: "Our cheap goods are leaking to {p}", startOnly: true, who: "market-trader", bg: "busy-market-street", scene: "interstate-highway", d: "Traders buy the goods your pact made cheap, truck them over the border and sell them in {p} at a profit. Your own markets are running short.",
      opts: [O("checks", "Executive order: quotas at the border markets", "the Border Markets Order", "b", .2, "b", { mod: { leak: false }, past: "put quotas on the border markets", say: "Shelves fill again at home." }),
        A("talk", "Agree a shared price with {g}", { rel: 4, mod: { leak: false }, next: "b", past: "agreed a shared price with {p}", say: "The profit in smuggling is gone." }),
        A("ignore", "Let traders trade", { weak: true, mod: { leak: true }, next: "b", past: "let the leakage to {p} go on", say: "The traders are happy. Your markets are not." })] },
    b: { t: "The border markets settle", endOnly: true, who: "market-trader", bg: "busy-market-street", scene: "border-market", d: "Prices on both sides of the border have evened out, and the border markets are busy with honest trade.",
      opts: [A("hold", "Keep watching them", { close: true, past: "settled the border markets with {p}", say: "Trade without tricks." })] },
  }, "a", (d) => d.kind === "supply"),
  success: st("success", "It works", {
    a: { t: "The deal with {p} is a success", startOnly: true, who: "neighbour-governor-male-pleased", bg: "neighbour-government-house", scene: "mou-signing-governors", d: "Two years on, the {k} with {p} has made money on both sides of the border. {g} proposes to go further: a joint processing plant, owned by both states.",
      opts: [P("plant", "Build the joint plant, half each", { cost: 2, mod: { boost: true }, rel: 8, close: true, past: "built a joint processing plant with {p}", say: "A plant on the border, owned by both states." }),
        A("enough", "Keep the deal as it is", { close: true, past: "kept the deal with {p} as it was", say: "Steady earnings." })] },
  }, "a", (d, { age }) => age >= 2),
};

/* The President's side: two governors in a trade war over levies, and the
   President to settle it. Opens at most once a term. */
export const MEDIATION = st("mediation", "The governors' trade war", {
  a: { t: "{a} and {b} are at war over levies", startOnly: true, who: "governors-forum-chair", bg: "villa-office", scene: "interstate-checkpoint", d: "The Governors of {a} and {b} have put levies on each other's trucks. Food is rotting at the checkpoints, prices are rising in both states, and both governors want you on their side.",
    opts: [A("mediate", "Bring both to the Villa and mediate", { fx: { app: 2 }, next: "b", past: "mediated a trade war between {a} and {b}", say: "Both levies are lifted on the steps of the Villa." }),
      A("side", "Back the governor from your party", { fx: { app: -1, pStab: 3 }, next: "b", past: "took sides in the trade war between {a} and {b}", say: "Your party is pleased. The other state is not." }),
      O("order", "Executive order: no state may tax interstate trade", "the Interstate Trade Order", "b", .4, "b", { fx: { app: 2 }, past: "banned state levies on interstate trade", say: "The levies are illegal now. Governors say the President has overstepped." })] },
  b: { t: "The trucks move again", endOnly: true, who: "governors-forum-chair", bg: "villa-office", d: "Trade between {a} and {b} has resumed. The Governors' Forum asks for one national rule on interstate levies.",
    opts: [A("rule", "Send a bill: one national rule for interstate levies", { fx: { app: 1 }, close: true, past: "proposed one national rule on interstate levies", say: "The bill goes to the National Assembly." }),
      A("leave", "Leave it to the governors", { close: true, past: "left interstate levies to the governors", say: "Until next time." })] },
}, "a", () => true);
// Two neighbouring states for the President's mediation, drawn from the seed.
export const mediationPair = (seed = "") => { const ks = Object.keys(NEIGHBOURS), a = ks[h(seed) % ks.length], b = NEIGHBOURS[a][h(seed + "b") % NEIGHBOURS[a].length]; return [a, b]; };
// Does the partner grow what we lack? (Their first crop is not one of ours.)
export const dealFit = (state, partner) => !produceOf(state).includes(produceOf(partner)[0]);
