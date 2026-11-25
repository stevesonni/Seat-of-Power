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

test("the mini-stadia reminder: a different opening each year, alternating signers, the year they first asked", async () => {
  const { miniReminder } = await import("../game/systems/sports.js");
  const C = { st: "Ogun", two: ["Abeokuta South", "Ijebu Ode"], first: 2028, youth: "Hon. Kemi Ade", comm: "Hon. Bode Bamgbose" };
  const R = [1, 2, 3, 4].map(n => miniReminder(n, C));
  assert.equal(new Set(R.map(r => r.title)).size, 4);
  assert.match(R[0].brief, /^The youths of Ogun are still asking\. In 2028 we asked you/); assert.match(R[1].brief, /^The people have not forgotten\./);
  assert.match(R[2].brief, /^The young people of Ogun are in need\./); assert.match(R[3].brief, /^I write to humbly remind you\./);
  assert.match(R[1].from, /Commissioner/); assert.match(R[0].from, /Youth Assembly/); assert.match(R[1].brief, /my ministry backed it/);
  const M = miniReminder(2, { ...C, ministry: true }); assert.match(M.title, /voice|youth|Youth/); assert.match(M.brief, /Ministry of Sports/); assert.match(M.from, /Youth Assembly/);
});
