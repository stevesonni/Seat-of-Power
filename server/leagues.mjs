/* Leagues, like Duolingo's (owner, 20 Nov 2026). Five leagues; each Monday the week is settled:
   - the top 30% of a league's players that week go up (at least one, if anyone played);
   - in a league of 5 or more players that week, the bottom 20% go down;
   - a player above the first league who did not play at all that week goes down one.
   Each league gives a head start in every new governorship; going down loses it.
   Lagos Life players and website players (ids "w_…") are settled and ranked apart: the two services never mix. */
export const LEAGUES = [
  { id: "ward", nm: "Ward League", icon: "🏘️", perk: null, d: "Where every career starts." },
  { id: "council", nm: "Council League", icon: "🏛️", perk: { cash: 1 }, d: "₦1B more in the bank when a governorship starts." },
  { id: "assembly", nm: "Assembly League", icon: "📜", perk: { cash: 2, app: 2 }, d: "₦2B more in the bank and +2 approval when a governorship starts." },
  { id: "senate", nm: "Senate League", icon: "⚖️", perk: { cash: 3, app: 3, pStab: 3 }, d: "₦3B more, +3 approval and +3 party support when a governorship starts." },
  { id: "villa", nm: "Villa League", icon: "🦅", perk: { cash: 4, app: 5, pStab: 5, frame: "gold" }, d: "₦4B more, +5 approval, +5 party support and the gold portrait frame." },
];
export const UP = 0.3, DOWN = 0.2, DOWN_MIN = 5;
export const svcOf = (id) => (String(id).startsWith("w_") ? "web" : "vatar");

// How many go up and down in a league of n players this week.
export const cuts = (n, lg) => ({ up: lg >= LEAGUES.length - 1 || n < 1 ? 0 : Math.max(1, Math.ceil(n * UP)), down: lg <= 0 || n < DOWN_MIN ? 0 : Math.floor(n * DOWN) });

/* Settle one finished week. L: { settled, p: { id: { lg, moves: [{ w, dir, from, to }] } } }; best: { id: { score, at } }
   for that week (every player's best result). Returns L, changed in place. */
export function settleWeek(L, w, best) {
  L.p = L.p || {};
  const played = Object.keys(best || {});
  played.forEach(id => { if (!L.p[id]) L.p[id] = { lg: 0, moves: [] }; });
  const move = (id, to, dir) => { const P = L.p[id], from = P.lg; if (to === from) return; P.lg = to; P.moves = [...(P.moves || []), { w, dir, from, to }].slice(-8); };
  const start = Object.fromEntries(played.map(id => [id, L.p[id].lg])); // each player's league as the week began
  for (const svc of ["vatar", "web"]) {
    for (let lg = 0; lg < LEAGUES.length; lg++) {
      const ids = played.filter(id => svcOf(id) === svc && start[id] === lg)
        .sort((a, b) => best[b].score - best[a].score || (best[a].at || 0) - (best[b].at || 0));
      const c = cuts(ids.length, lg);
      ids.slice(0, c.up).forEach(id => move(id, lg + 1, "up"));
      if (c.down) ids.slice(ids.length - c.down).forEach(id => move(id, lg - 1, "down"));
    }
  }
  // Away all week: down one (never below the first league).
  Object.keys(L.p).forEach(id => { if (!best[id] && L.p[id].lg > 0) move(id, L.p[id].lg - 1, "away"); });
  L.settled = w;
  return L;
}

// Where a player stands this week so far, inside their league: rank, players, and the zone they are in.
export function standing(L, id, best) {
  const lg = (L.p && L.p[id] && L.p[id].lg) || 0, svc = svcOf(id);
  const ids = Object.keys(best || {}).filter(k => svcOf(k) === svc && (((L.p || {})[k] || {}).lg || 0) === lg)
    .sort((a, b) => best[b].score - best[a].score || (best[a].at || 0) - (best[b].at || 0));
  const i = ids.indexOf(id), c = cuts(ids.length, lg);
  if (i < 0) return { lg, rank: null, players: ids.length, zone: lg > 0 ? "away" : "none", up: c.up, down: c.down };
  return { lg, rank: i + 1, players: ids.length, zone: i < c.up ? "up" : c.down && i >= ids.length - c.down ? "down" : "stay", up: c.up, down: c.down };
}
