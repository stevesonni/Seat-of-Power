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
   minutes, finished a term (reached any career's ending) and shared a card. */
export const ENDING_EVENTS = ["ending", "lga_end", "senate_end", "amb_end"];
export const experimentSummary = (S) => {
  const ev = (S && S.ev) || {}, play = (S && S.play) || {};
  const finished = new Set(ENDING_EVENTS.flatMap(e => Object.keys((ev[e] || {}).players || {})));
  const shared = new Set(Object.keys((ev.card_share || {}).players || {}));
  const group = (who) => { const n = who.length, timed = who.filter(w => play[w]), early = timed.filter(w => (play[w].s || 0) < 300).length, fin = who.filter(w => finished.has(w)).length, sh = who.filter(w => shared.has(w)).length;
    const pc = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
    return { players: n, timed: timed.length, earlyPct: pc(early, timed.length), finishedPct: pc(fin, n), sharedPct: pc(sh, n) }; };
  return PILLARS.map(p => { const E = ev["exp_" + p.id] || { values: {} }, ids = (g) => Object.keys((E.values[g] || {}).p || {});
    return { id: p.id, nm: p.nm, on: group(ids("on")), off: group(ids("off")) }; });
};
