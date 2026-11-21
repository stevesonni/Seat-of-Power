import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
test("XP comes from what you do in every career; levels climb the Nigerian ladder", () => {
  assert.equal(SYS.xpFor("letters"), 10); assert.equal(SYS.xpFor("senate_vote"), 8); assert.equal(SYS.xpFor("pil_whistle"), 5);
  assert.equal(SYS.xpFor("senate_grade", "A"), 100); assert.equal(SYS.xpFor("lga_end"), 100); assert.equal(SYS.xpFor("back"), 0);
  assert.equal(SYS.levelOf(0), 1); assert.equal(SYS.levelOf(SYS.xpToReach(5)), 5); assert.equal(SYS.titleOf(5), "Ward Councillor"); assert.equal(SYS.titleOf(30), "Elder Statesman");
});
test("award: the day's goal, quests and Ballots; double XP while boosted; three different quests a day", () => {
  for (let d = 1; d < 60; d++) { const q = SYS.questsFor(d); assert.equal(q.length, 3); assert.equal(new Set(q.map(x => x.m)).size, 3); }
  let X = { ...SYS.xpBlank(), goal: 30 };
  let r = SYS.award(X, "year", null, 0, 10, 2); X = r.X;
  assert.equal(r.gained, 50); assert.ok(r.goalMet); assert.equal(X.day.xp, 50); assert.equal(X.week.xp, 50);
  r = SYS.award(X, "year", null, 0, 10, 2); assert.ok(!r.goalMet, "the goal counts once a day");
  const b = SYS.buy({ ...X, ballots: 150 }, "boost", 1000); assert.ok(b.ok);
  assert.equal(SYS.award(b.X, "letters", null, 2000, 11, 3).gained, 20, "double XP while the boost lasts");
  assert.equal(SYS.award(b.X, "letters", null, 1000 + 16 * 60000, 11, 3).gained, 10);
  assert.equal(SYS.buy({ ...X, ballots: 10 }, "freeze", 0).ok, false);
  const c = SYS.claimLeague(X, 7, 1); assert.equal(c.prize, 50); assert.equal(SYS.claimLeague(c.X, 7, 1).prize, 0, "a week's prize is claimed once");
  // Reaching a level pays Ballots.
  const L = SYS.award({ ...SYS.xpBlank(), total: SYS.xpToReach(2) - 5 }, "letters", null, 0, 1, 1); assert.ok(L.levelUp && L.X.ballots >= SYS.LEVEL_BALLOTS);
});
test("leagues: each player's finishing place is kept, so the top 3 can be paid", async () => {
  const { settleWeek } = await import("../server/leagues.mjs");
  const L = settleWeek({ p: {} }, 5, { a: { score: 300 }, b: { score: 120 }, c: { score: 50 }, d: { score: 10 } });
  assert.equal(L.p.a.fin.rank, 1); assert.equal(L.p.b.fin.rank, 2); assert.equal(L.p.d.fin.rank, 4); assert.equal(L.p.a.fin.w, 5);
});
