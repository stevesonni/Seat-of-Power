/* Sport and stadiums (owner, 25 Nov 2026). */
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("FIFA or CAF: one fixture a game, rotating between games", () => {
  const seen = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map(s => SYS.fixtureFor("Ada Okafor" + s).id));
  assert.ok(seen.size >= 3, "different games, different fixtures"); assert.equal(SYS.fixtureFor("x").id, SYS.fixtureFor("x").id, "the same game, the same fixture");
});
test("the President's stadium plans: two can be ready by match day, Lagos cannot", () => {
  assert.deepEqual(SYS.STADIUM_PLANS.map(p => [p.id, p.years]), [["abuja", 1], ["lagos", 2], ["uyo", 1]]);
});
test("a rush job costs half again and may crack", () => {
  assert.equal(SYS.RUSH_X, 1.5);
  assert.ok(SYS.rushOutcome(() => .1).crack); assert.ok(!SYS.rushOutcome(() => .9).crack);
});
test("Tori buzzes at every step", () => {
  for (const st of ["caf_ask", "caf_plan", "caf_abroad", "caf_hosted", "caf_rushed", "caf_crack", "caf_moved", "youth_ask", "mini_ask", "mini_yes", "mini_no"])
    assert.ok(SYS.sportsBuzz(st, { st: "Ogun", fix: SYS.FIXTURES[1], plan: "Renovate the National Stadium in Abuja", place: "Abuja" }).length > 0, st);
  const t = SYS.toriFeed({ st: "Ogun", turn: 2, app: 55, buzz: SYS.sportsBuzz("youth_ask", { st: "Ogun" }) }).map(p => p.text).join(" ");
  assert.match(t, /Zero commissioners for youth/);
});
test("a stadium answers a sports need, for the President too", () => {
  assert.ok(SYS.FED_NEEDS.sports && /stadium/.test(SYS.FED_NEEDS.sports.title("Nigeria")));
});
