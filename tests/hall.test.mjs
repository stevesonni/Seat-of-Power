import { test } from "node:test";
import assert from "node:assert/strict";
import { tierOf, hallDay, weekOfDay, daysOfWeek, weekEntries, rankBoard, playedAgain, weekOf } from "../server/hall-rules.mjs";

test("tiers are fixed score lines", () => {
  assert.equal(tierOf(1000).id, "gold"); assert.equal(tierOf(950).id, "gold");
  assert.equal(tierOf(820).id, "silver"); assert.equal(tierOf(700).id, "bronze"); assert.equal(tierOf(500), null);
});
test("days belong to Monday-start weeks", () => {
  const w = weekOfDay("2026-10-19"); // a Monday
  assert.equal(weekOfDay("2026-10-25"), w); assert.equal(weekOfDay("2026-10-26"), w + 1);
  assert.deepEqual(daysOfWeek(w)[0], "2026-10-19"); assert.equal(daysOfWeek(w).length, 7);
  assert.equal(weekOf(Date.parse("2026-10-24T12:00:00Z")), w); assert.equal(hallDay(Date.parse("2026-10-24T12:00:00Z")), "2026-10-24");
});
test("the weekly board keeps each governor's best day, ranked", () => {
  const best = weekEntries([{ day: "2026-10-19", entries: { a: { name: "Ada", score: 700, at: 1 }, b: { name: "Bo", score: 990, at: 2 } } }, { day: "2026-10-20", entries: { a: { name: "Ada", score: 880, at: 3 } } }]);
  const rows = rankBoard(best);
  assert.deepEqual(rows.map(r => [r.name, r.score, r.tier]), [["Bo", 990, "gold"], ["Ada", 880, "silver"]]);
  assert.equal(rows[1].day, "2026-10-20");
});
test("played again: the share of governors with more than one finished career", () => {
  assert.deepEqual(playedAgain({ a: 1, b: 3, c: 2, d: 1, e: 2 }), { players: 5, pct: 60 });
  assert.deepEqual(playedAgain({}), { players: 0, pct: 0 });
});
