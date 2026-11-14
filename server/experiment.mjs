/* The experiment (shared by the game and the server): each new player gets each pillar on or off at random, so
   the dashboard can compare the two groups on three numbers: who leaves in
   under five minutes, who finishes a term, and who shares a card. A pillar
   that is off leaves the game exactly as it was. Rules only, no React. */

export const PILLARS = [
  { id: "front", nm: "The front door", d: "Start in the chair: the FAAC alert, three decisions and a ribbon before the campaign; hints; clearer tabs; an easier first year." },
  { id: "wait", nm: "Never wait", d: "Quick projects that open within the year, roads that open in stages, and site events while things are built." },
  { id: "money", nm: "Money as an enemy", d: "FAAC Day with the leak shown, and reforms that plug it but fade unless maintained." },
  { id: "integrity", nm: "Ministries with integrity", d: "Commissioner types, a background check before appointing, and whistleblowers." },
  { id: "plan", nm: "Your own plan", d: "The Chairman's ambition and rival, pilot policies in one LGA, and policy combos." },
  { id: "region", nm: "Regional influence", d: "A trade war with a neighbouring country for the President, and a neighbouring state's rivalry for the governor." },
  // The rebuild (November 2026), one step each:
  { id: "start", nm: "The short start", d: "A real decision within a minute; the campaign as three big moments and a live election night; under 400 words before the oath." },
  { id: "screen", nm: "Four meters and one card", d: "People, Party, Treasury and Godfather as words and colours, and only the next decision on the main screen; the rest behind More." },
  { id: "stagger", nm: "A gentler first year", d: "Year 1 is the people, the House and a three-choice budget; the cabinet and the palaces are formed for you; the Treasury visit is optional." },
  { id: "words", nm: "Plain words", d: "At most two sentences and 25 words on a card, and everyday words for the jargon (the real term stays in the glossary)." },
  { id: "drama", nm: "Headlines and calls", d: "A front page after each big decision, calls from the godfather, and the life story as a five-line card to share." },
  // Round three (12 November 2026): "I am the Governor" (the owner's research and Grok's review).
  { id: "juice", nm: "Power you can see", d: "Meter changes show how big and whether good or bad; money flies into and out of the Treasury." },
  { id: "why", nm: "Because you…", d: "When an earlier decision pays off or bites back, a card names it and the year you made it." },
  { id: "reach", nm: "Power within reach", d: "A Next button on every tab, and the Governor's powers (fire, inspect, address the people, the godfather) one tap from the Desk." },
  { id: "capital", nm: "Political capital", d: "Big moves are political capital: a little more each year, more earned by good approval, a strong Chief of Staff and kept promises." },
  { id: "purse", nm: "A fairer purse", d: "A little more money in year one, and a clear way to refuse the godfather's loan in every start." },
  { id: "look", nm: "The richer look", d: "The same game in a richer look: a painted decision card with costs and effects as pictures, gauges for the meters, a stamp on results and picture tiles for powers." },
];
export const PILLAR_IDS = PILLARS.map(p => p.id);
export const EXP_KEY = "sop_exp";

// A fresh assignment: each pillar on or off with even odds. r: a random source.
export const assignPillars = (r = Math.random) => Object.fromEntries(PILLAR_IDS.map(id => [id, r() < .5]));

/* A test link can force the split: ?exp=all, ?exp=none, or ?exp=front:1,money:0
   (pillars not named keep their assignment). Returns the new assignment, or null. */
export const parseExpOverride = (q, cur) => {
  if (!q) return null;
  if (q === "all" || q === "none") return Object.fromEntries(PILLAR_IDS.map(id => [id, q === "all"]));
  const out = { ...(cur || assignPillars(() => 0)) }; let any = false;
  String(q).split(",").forEach(kv => { const [k, v] = kv.split(":"); if (PILLAR_IDS.includes(k) && (v === "1" || v === "0")) { out[k] = v === "1"; any = true; } });
  return any ? out : null;
};

// A stored assignment that lost a pillar (an older version) gets the new ones at random.
export const completeAssignment = (cur, r = Math.random) => { const out = { ...(cur || {}) }; PILLAR_IDS.forEach(id => { if (typeof out[id] !== "boolean") out[id] = r() < .5; }); return out; };

/* The dashboard's comparison. S: the server's stats ({ ev, play }). For each
   pillar, the players in each group and how many of them left in under five
   minutes, reached an ending, served the full term (or ended early: impeached,
   dissolved, removed, recalled, broke) and shared a card. The front door can only
   change a first-time player's game, so it is also compared on first-timers
   alone (the "first_visit" event, sent by every new player in either group). */
export const ENDING_EVENTS = ["ending", "lga_end", "senate_end", "amb_end"];
export const FULL_TERM = {
  ending: ["Served two terms", "Stepped down", "Voted out", "Ran for President"],
  lga_end: ["reelected", "defeated", "no_ticket"],
  senate_end: ["reelected", "defeated", "no_ticket"],
  amb_end: ["promoted", "completed"],
};
const playersOf = (E, vals) => Object.entries((E || {}).values || {}).filter(([v]) => !vals || vals.includes(v)).flatMap(([, x]) => Object.keys((x || {}).p || {}));
export const experimentSummary = (S) => {
  const ev = (S && S.ev) || {}, play = (S && S.play) || {};
  const finished = new Set(ENDING_EVENTS.flatMap(e => Object.keys((ev[e] || {}).players || {})));
  const full = new Set(ENDING_EVENTS.flatMap(e => playersOf(ev[e], FULL_TERM[e])));
  const early = new Set([...finished].filter(w => !full.has(w)));
  const shared = new Set(Object.keys((ev.card_share || {}).players || {}));
  const firsts = new Set(Object.keys((ev.first_visit || {}).players || {}));
  const pc = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
  const group = (who) => { const n = who.length, timed = who.filter(w => play[w]), quit = timed.filter(w => (play[w].s || 0) < 300).length;
    return { players: n, timed: timed.length, earlyPct: pc(quit, timed.length), finishedPct: pc(who.filter(w => finished.has(w)).length, n),
      fullPct: pc(who.filter(w => full.has(w)).length, n), endedEarlyPct: pc(who.filter(w => early.has(w)).length, n), sharedPct: pc(who.filter(w => shared.has(w)).length, n) }; };
  return PILLARS.map(p => { const E = ev["exp_" + p.id] || { values: {} }, ids = (g) => Object.keys((E.values[g] || {}).p || {});
    const row = { id: p.id, nm: p.nm, on: group(ids("on")), off: group(ids("off")) };
    if (p.id === "front") { row.onNew = group(ids("on").filter(w => firsts.has(w))); row.offNew = group(ids("off").filter(w => firsts.has(w))); }
    return row; });
};

/* Where players leave (counts only). The game sends "at" with the screen a player is on
   whenever it changes; the server keeps each player's last screen and when it was sent
   (S.last). A player not seen for idleMs has left, and counts on that screen. */
export const SCREEN_NAMES = { title: "Title screen", setup: "Making a politician / the campaign", gov: "Governing", senate: "Senator", chairman: "Chairman", ambassador: "Ambassador", pres: "Road to Aso Rock", cab: "Cabinet of friends" };
export const dropOff = (S, now = Date.now(), idleMs = 30 * 60e3, only = null) => {
  const L = Object.entries((S && S.last) || {}).filter(([w]) => !only || only.has(w)).map(([, x]) => x), gone = L.filter(x => x && now - (x.t || 0) > idleMs), n = gone.length;
  const by = {}; gone.forEach(x => { by[x.v] = (by[x.v] || 0) + 1; });
  return { players: L.length, left: n, here: L.length - n, screens: Object.entries(by).map(([v, k]) => ({ screen: v, n: k, pct: n ? Math.round(k / n * 1000) / 10 : 0 })).sort((a, b) => b.n - a.n) };
};
/* The same, for each half of a pillar: who had it on, who had it off (from the exp_<id> events). */
export const DROP_PILLARS = ["start", "screen", "stagger", "words", "drama", "juice", "why", "reach", "capital", "purse", "look"];
export const dropOffSplit = (S, id, now = Date.now(), idleMs = 30 * 60e3) => {
  const E = ((S && S.ev) || {})["exp_" + id] || { values: {} }, half = (g) => new Set(Object.keys((E.values[g] || {}).p || {}));
  return { id, on: dropOff(S, now, idleMs, half("on")), off: dropOff(S, now, idleMs, half("off")) };
};
