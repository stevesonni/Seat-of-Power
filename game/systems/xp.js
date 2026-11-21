/* XP, levels, a daily goal, daily quests and Ballots (owner, 21 Nov 2026: "levels, XP… leagues on the Hall of
   Governors… things to win… let's go full Duolingo on them"). Pure rules; the store lives in the browser (sop_xp,
   synced with the web account) and the week's XP goes to the server for the leagues (server/leagues.mjs).
   Everything here is won inside the game. */

// What earns XP: the game's own tracked events (track/trk), so every career counts.
const XP_EVENTS = {
  letters: 10, tori_reply: 5, tori_post: 5, tori_space: 15, trip: 10, visit_president: 10, hall: 20,
  senate_vote: 8, senate_hearing: 10, senate_screen: 10, senate_tt: 10, senate_home: 8, senate_own_bill: 15, senate_fund: 10, senate_event: 8, senate_arc: 10,
  lga_tray: 8, lga_road: 10, lga_promise: 8, lga_alloc: 8, lga_arc: 10, amb_arc: 10,
  daily: 20, year: 50, session: 30, career_end: 100,
};
// Events whose name starts with one of these earn a little too (most decisions in the governorship).
const XP_PREFIX = [["pil_", 5], ["leg_", 6], ["dipl_", 8], ["bill_", 8], ["gf_", 6], ["lga_", 5], ["amb_", 5], ["wildcard_", 6]];
const GRADE_BONUS = { A: 100, B: 60, C: 30, D: 10, F: 0 };
export const xpFor = (e, v) => {
  if (!e) return 0;
  if (/_grade$/.test(e)) return GRADE_BONUS[String(v || "").toUpperCase()] || 0;
  if (/^(senate|lga|amb)_end$/.test(e)) return XP_EVENTS.career_end;
  if (XP_EVENTS[e] != null) return XP_EVENTS[e];
  const p = XP_PREFIX.find(([k]) => e.startsWith(k)); return p ? p[1] : 0;
};

// Levels: each needs a little more than the last. Titles climb the Nigerian ladder.
export const LEVEL_TITLES = [[1, "Ward Volunteer"], [3, "Party Agent"], [5, "Ward Councillor"], [8, "LGA Chairman"], [11, "Commissioner"], [15, "Honourable Member"], [19, "Senator"], [23, "Governor"], [27, "Minister"], [30, "Elder Statesman"]];
export const xpToReach = (lv) => lv <= 1 ? 0 : Math.round(60 * (lv - 1) + 20 * (lv - 1) * (lv - 1)); // 80, 200, 360, 560…
export const levelOf = (xp) => { let lv = 1; while (lv < 60 && xp >= xpToReach(lv + 1)) lv++; return lv; };
export const titleOf = (lv) => LEVEL_TITLES.filter(([n]) => lv >= n).pop()[1];
export const levelView = (xp) => { const lv = levelOf(xp), a = xpToReach(lv), b = xpToReach(lv + 1); return { lv, title: titleOf(lv), into: xp - a, need: b - a, next: b }; };

// The daily goal, like Duolingo's: pick a size; meeting it keeps the streak.
export const GOALS = [{ id: 30, l: "Casual", d: "30 XP a day" }, { id: 50, l: "Regular", d: "50 XP a day" }, { id: 100, l: "Serious", d: "100 XP a day" }, { id: 150, l: "Intense", d: "150 XP a day" }];

// Daily quests: three a day, picked by the day's number so everyone gets the same three.
export const QUESTS = [
  { id: "xp60", t: "Earn 60 XP", m: "xp", n: 60, b: 10 },
  { id: "xp120", t: "Earn 120 XP", m: "xp", n: 120, b: 20 },
  { id: "letters5", t: "Answer 5 letters", m: "letters", n: 5, b: 15 },
  { id: "tori3", t: "Reply or post on Tori 3 times", m: "tori", n: 3, b: 10 },
  { id: "daily", t: "Make today's decision", m: "daily", n: 1, b: 10 },
  { id: "year1", t: "Finish a year in office", m: "year", n: 1, b: 20 },
  { id: "senate4", t: "Cast 4 votes in the Senate", m: "senate", n: 4, b: 15 },
  { id: "goal", t: "Meet your daily goal", m: "goal", n: 1, b: 15 },
];
export const questsFor = (day) => { const pick = [], pool = QUESTS.slice(); let h = (day * 2654435761) >>> 0; while (pick.length < 3 && pool.length) { h = (h * 1103515245 + 12345) >>> 0; const q = pool.splice(h % pool.length, 1)[0]; if (!pick.some(x => x.m === q.m)) pick.push(q); } return pick; }; // three different kinds
const metricOf = (e) => e === "letters" ? "letters" : /^tori_(reply|post)$/.test(e) ? "tori" : e === "daily" ? "daily" : e === "year" ? "year" : e === "senate_vote" ? "senate" : null;

// Ballots: the game's currency, earned by quests, levels and leagues, spent in the Ballot shop.
export const BALLOT_SHOP = [
  { id: "freeze", l: "Streak Freeze", d: "Miss a day without losing your streak. Hold up to 2.", cost: 200, ic: "🧊" },
  { id: "boost", l: "Double XP for 15 minutes", d: "Everything earns twice as much while it lasts.", cost: 100, ic: "⚡" },
  { id: "frame_green", l: "Green & white portrait frame", d: "For your face on the boards.", cost: 300, ic: "🖼️" },
  { id: "title_chief", l: "Title: 'Chief'", d: "Shown before your name in the Hall.", cost: 500, ic: "🎖️" },
];
export const LEAGUE_PRIZES = [50, 30, 20]; // Ballots for 1st, 2nd and 3rd in your league when the week closes
export const LEVEL_BALLOTS = 20;

/* The store: { total, day: { n, xp }, week: { w, xp }, goal, quests: { n, prog: {}, done: [] }, ballots, boostUntil,
   freezes, owned: [], goalDays: [], claimed: [] }. award() returns the new store and what happened (level-ups,
   quests completed, goal met) so the screen can celebrate. */
export const xpBlank = () => ({ total: 0, day: { n: 0, xp: 0 }, week: { w: 0, xp: 0 }, goal: 50, quests: { n: 0, prog: {}, done: [] }, ballots: 0, boostUntil: 0, freezes: 0, owned: [], goalDays: [], claimed: [] });
export function award(X0, e, v, now, day, week) {
  const X = { ...xpBlank(), ...(X0 || {}) }, base = xpFor(e, v); if (!base && !metricOf(e)) return { X, gained: 0 };
  const boost = (X.boostUntil || 0) > now ? 2 : 1, gained = base * boost;
  const lv0 = levelOf(X.total);
  X.total += gained;
  X.day = X.day && X.day.n === day ? { n: day, xp: X.day.xp + gained } : { n: day, xp: gained };
  X.week = X.week && X.week.w === week ? { w: week, xp: X.week.xp + gained } : { w: week, xp: gained };
  const out = { gained, boost: boost > 1, levelUp: null, quests: [], goalMet: false };
  const lv1 = levelOf(X.total); if (lv1 > lv0) { out.levelUp = { lv: lv1, title: titleOf(lv1), newTitle: titleOf(lv1) !== titleOf(lv0) }; X.ballots += LEVEL_BALLOTS * (lv1 - lv0); }
  const goalMet = X.day.xp >= X.goal && !(X.goalDays || []).includes(day); if (goalMet) { X.goalDays = [...(X.goalDays || []), day].slice(-400); out.goalMet = true; }
  // Quests for today.
  const Q = X.quests && X.quests.n === day ? { ...X.quests, prog: { ...X.quests.prog } } : { n: day, prog: {}, done: [] };
  const m = metricOf(e);
  questsFor(day).forEach(q => {
    if (Q.done.includes(q.id)) return;
    const p = q.m === "xp" ? X.day.xp : q.m === "goal" ? (X.goalDays.includes(day) ? 1 : 0) : (Q.prog[q.m] || 0) + (q.m === m ? 1 : 0);
    if (q.m !== "xp" && q.m !== "goal") Q.prog[q.m] = p;
    if (p >= q.n) { Q.done = [...Q.done, q.id]; X.ballots += q.b; out.quests.push(q); }
  });
  if (m && !questsFor(day).some(q => q.m === m)) Q.prog[m] = (Q.prog[m] || 0) + 1;
  X.quests = Q;
  return { X, ...out };
}
export const questProgress = (X, day) => questsFor(day).map(q => { const Q = X.quests && X.quests.n === day ? X.quests : { prog: {}, done: [] }, done = (Q.done || []).includes(q.id);
  const p = q.m === "xp" ? (X.day && X.day.n === day ? X.day.xp : 0) : q.m === "goal" ? ((X.goalDays || []).includes(day) ? 1 : 0) : (Q.prog || {})[q.m] || 0; return { ...q, p: Math.min(q.n, p), done }; });
export function buy(X0, id, now) {
  const X = { ...xpBlank(), ...(X0 || {}) }, it = BALLOT_SHOP.find(x => x.id === id); if (!it) return { X, ok: false, why: "Not in the shop." };
  if (X.ballots < it.cost) return { X, ok: false, why: "You need " + (it.cost - X.ballots) + " more Ballots." };
  if (id === "freeze" && X.freezes >= 2) return { X, ok: false, why: "You already hold 2 Streak Freezes." };
  if (/^(frame|title)_/.test(id) && (X.owned || []).includes(id)) return { X, ok: false, why: "You already own it." };
  X.ballots -= it.cost;
  if (id === "freeze") X.freezes += 1; else if (id === "boost") X.boostUntil = Math.max(now, X.boostUntil || 0) + 15 * 60000; else X.owned = [...(X.owned || []), id];
  return { X, ok: true };
}
// The league's prize for a finished week, once.
export function claimLeague(X0, w, rank) {
  const X = { ...xpBlank(), ...(X0 || {}) }; if (!rank || rank > LEAGUE_PRIZES.length || (X.claimed || []).includes(w)) return { X, prize: 0 };
  const prize = LEAGUE_PRIZES[rank - 1]; X.ballots += prize; X.claimed = [...(X.claimed || []), w].slice(-60); return { X, prize };
}
