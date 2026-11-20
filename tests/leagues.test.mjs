import test from "node:test";
import assert from "node:assert/strict";
import { LEAGUES, cuts, settleWeek, standing } from "../server/leagues.mjs";
const best = (o) => Object.fromEntries(Object.entries(o).map(([k, v], i) => [k, { score: v, at: i }]));

test("five leagues, the first without a perk and each later one with more", () => {
  assert.equal(LEAGUES.length, 5); assert.equal(LEAGUES[0].perk, null);
  for (let i = 2; i < 5; i++) assert.ok(LEAGUES[i].perk.cash > LEAGUES[i - 1].perk.cash);
});
test("cuts: top 30% up (at least one), bottom 20% down from 5 players, none down from the first league", () => {
  assert.deepEqual(cuts(1, 0), { up: 1, down: 0 });
  assert.deepEqual(cuts(10, 2), { up: 3, down: 2 });
  assert.deepEqual(cuts(4, 2), { up: 2, down: 0 });
  assert.deepEqual(cuts(10, 4), { up: 0, down: 2 });
});
test("a week settles: the best go up, the worst go down, the absent drop one", () => {
  const L = { p: { a: { lg: 1, moves: [] }, b: { lg: 1, moves: [] }, c: { lg: 1, moves: [] }, d: { lg: 1, moves: [] }, e: { lg: 1, moves: [] }, gone: { lg: 3, moves: [] } } };
  settleWeek(L, 40, best({ a: 900, b: 800, c: 700, d: 600, e: 500, newbie: 650 }));
  assert.equal(L.p.a.lg, 2); assert.equal(L.p.b.lg, 2); assert.equal(L.p.c.lg, 1); assert.equal(L.p.e.lg, 0);
  assert.equal(L.p.gone.lg, 2); assert.equal(L.p.gone.moves.at(-1).dir, "away");
  assert.equal(L.p.newbie.lg, 1, "a new player starts in the first league and the best of it goes up");
  assert.equal(L.settled, 40);
});
test("website players and Lagos Life players are ranked apart", () => {
  const L = { p: {} };
  settleWeek(L, 1, best({ w_one: 100, lagos1: 900, lagos2: 800, lagos3: 700 }));
  assert.equal(L.p.w_one.lg, 1, "the only website player goes up, even with a low score");
  const s = standing(L, "w_one", best({ w_one: 100, lagos1: 900 }));
  assert.equal(s.players, 1); assert.equal(s.rank, 1);
});
test("standing names the zone", () => {
  const L = { p: { a: { lg: 1 }, b: { lg: 1 }, c: { lg: 1 }, d: { lg: 1 }, e: { lg: 1 } } };
  const B = best({ a: 9, b: 8, c: 7, d: 6, e: 5 });
  assert.equal(standing(L, "a", B).zone, "up"); assert.equal(standing(L, "c", B).zone, "stay"); assert.equal(standing(L, "e", B).zone, "down");
  assert.equal(standing(L, "zz", B).zone, "none");
});
