/* The Hall of Governors' rules. Shared by the server, which keeps the boards,
   and the game, which shows them.

   - A finished governorship can be entered once a day, so a player chooses:
     enter this result, or play again for a better one.
   - Tiers are fixed score lines, so everyone knows what to aim for:
     Gold 950+ (an A-grade record over two full terms), Silver 800+, Bronze 650+.
   - The weekly board stays locked until the week ends (Monday 00:00 UTC);
     then it opens with each governor's best daily entry of that week. */

export const TIERS = [
  { id: "gold", nm: "Gold", min: 950, icon: "🥇", how: "an A-grade record over two full terms" },
  { id: "silver", nm: "Silver", min: 800, icon: "🥈", how: "a strong record over two terms" },
  { id: "bronze", nm: "Bronze", min: 650, icon: "🥉", how: "a solid record" },
];
export const tierOf = (score) => TIERS.find(t => (+score || 0) >= t.min) || null;

const WEEK0 = Date.UTC(2026, 0, 5); // a Monday
export const hallDay = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
export const weekOf = (t = Date.now()) => Math.floor((t - WEEK0) / 604800000);
export const weekOfDay = (day) => weekOf(Date.parse(day + "T00:00:00Z"));
export const daysOfWeek = (w) => Array.from({ length: 7 }, (_, i) => hallDay(WEEK0 + w * 604800000 + i * 86400000));
export const weekOpensAt = (w) => WEEK0 + (w + 1) * 604800000;

// Ranked rows of one board: { id: entry } → [{ id, rank, ...entry, tier }].
export const rankBoard = (entries, n = 20) => Object.entries(entries || {})
  .sort((a, b) => b[1].score - a[1].score || a[1].at - b[1].at).slice(0, n)
  .map(([id, e], i) => ({ id, rank: i + 1, ...e, tier: (tierOf(e.score) || {}).id || null }));

// A week's board: every governor's best daily entry in it.
export const weekEntries = (days) => {
  const best = {};
  (days || []).forEach(d => Object.entries((d && d.entries) || {}).forEach(([id, e]) => { if (!best[id] || e.score > best[id].score) best[id] = { ...e, day: d.day }; }));
  return best;
};

// How many governors finished more than one career: "N% played again for a better result".
export const playedAgain = (counts) => {
  const v = Object.values(counts || {}), n = v.filter(c => c >= 1).length;
  return { players: n, pct: n ? Math.round(100 * v.filter(c => c >= 2).length / n) : 0 };
};
