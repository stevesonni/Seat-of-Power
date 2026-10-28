import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SCENARIO_RULES, scenarioRules, scenarioDeadline, unoHeld, scenarioYear, scenarioCostB, scenarioMoves, scenarioProg, scenarioMet, paceAdj, PROVOKE_ORDERS, HOUSE_REVENUE } from "../game/systems/index.js";

const ctx = (o = {}) => ({ turn: 1, app: 50, pStab: 55, cor: .3, rulers: 55, fg: 50, house: { seats: 24, loyal: 9 }, arrears: 3, peace: null, sitClosed: false, flags: {}, prog: 0, base: { infra: .3, hp: .3, igr: 5, sec: .3 },
  sec: .3, hp: .3, infra: .3, agr: .3, igr: 5, reforms: 0, petition: undefined, agPerf: 0, worksPerf: 0, healthPerf: 0, pace: "standard", bar: 0, ...o });
const art = (k, f) => fs.existsSync(new URL("../public/art/" + k + "/" + f + ".webp", import.meta.url));

test("every scenario in the game has a Day One, a goal, a rule and moves from its rival", () => {
  const src = fs.readFileSync(new URL("../game/seat-of-power.jsx", import.meta.url), "utf8");
  const ids = [...src.slice(src.indexOf("const SCENARIOS = ["), src.indexOf("const scenarioStart")).matchAll(/id: "(\w+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 10); assert.equal(Object.keys(SCENARIO_RULES).length, 10);
  for (const id of ids) {
    const R = scenarioRules(id); assert.ok(R, id + " has rules");
    assert.ok(R.day1.options.length >= 3 && R.goal && R.rule, id + ": Day One, goal and rule");
    assert.ok(R.moves && R.moves.length >= (id === "narrow_win" ? 1 : 3), id + " has rival moves");
    for (const P of [R.day1, ...R.moves]) { assert.ok(art("characters", P.who), id + ": " + P.who); assert.ok(art("backgrounds", P.bg), id + ": " + P.bg); }
    if (id !== "narrow_win") { assert.ok(R.threat.count && R.doom && R.uno.length >= 1 && R.yearly, id + " has an or-else, a countdown, a yearly bite and a card"); assert.ok(scenarioDeadline(R, ctx()) >= 2); }
  }
});
test("no Day One answer ends the fight on its own", () => {
  for (const [id, R] of Object.entries(SCENARIO_RULES)) for (const o of R.day1.options) {
    const best = Math.max(o.prog || 0, (o.roll && o.roll.ok.prog) || 0);
    assert.ok(best < 100, id + ":" + o.id + " gives " + best);
    const c = ctx({ prog: best, flags: { ...(o.set || {}), ...((o.roll && o.roll.ok.set) || {}) }, arrears: 3 - (o.arrears || 0), house: { seats: 24, loyal: 9 + (o.house || 0) + ((o.roll && o.roll.ok.house) || 0) } });
    assert.ok(!scenarioMet(R, c), id + ":" + o.id + " should not break the logjam on Day One");
  }
});
test("the Hostile House: a majority breaks it; without one the motion is due at the deadline", () => {
  const R = scenarioRules("hostile_house");
  assert.equal(scenarioDeadline(R, ctx()), 3);
  assert.equal(scenarioYear(R, ctx({ turn: 2 }), {}).warn, true);
  assert.equal(scenarioYear(R, ctx({ turn: 2 }), {}).left, 1);
  assert.equal(scenarioYear(R, ctx({ turn: 3 }), { warned: 2 }).due, true);
  assert.deepEqual(scenarioYear(R, ctx({ turn: 2, house: { seats: 24, loyal: 13 } }), {}), { broken: true, fresh: true });
  assert.equal(scenarioYear(R, ctx({ turn: 2, house: { seats: 24, loyal: 12 } }), {}).broken, undefined, "half is not a majority");
  assert.deepEqual(scenarioYear(R, ctx({ turn: 4 }), { resolved: "saved:app" }), {});
  assert.equal(R.yearly(ctx()).house, -1, "the Speaker poaches a member a year");
});
test("provocations bring the motion closer; the pace moves the deadline and the cards", () => {
  const R = scenarioRules("hostile_house");
  assert.equal(scenarioDeadline(R, ctx({ flags: { provoked: 1 } })), 3);
  assert.equal(scenarioDeadline(R, ctx({ flags: { provoked: 2 } })), 2);
  assert.equal(scenarioDeadline(R, ctx({ pace: "intense" })), 2);
  assert.equal(scenarioDeadline(R, ctx({ pace: "relaxed" })), 4);
  assert.deepEqual(paceAdj("intense"), { dl: -1, bar: 5, moves: 2, mult: 1.5 });
  assert.deepEqual(unoHeld(R, ctx({ app: 62 })).map(u => u.id), ["app"]);
  assert.equal(unoHeld(R, ctx({ app: 62, bar: 5 })).length, 0, "Intense: 60% is not enough");
  assert.ok(PROVOKE_ORDERS.revoke_land && HOUSE_REVENUE.includes("property") && !HOUSE_REVENUE.includes("payroll"));
});
test("uno cards cost something to play", () => {
  const R = scenarioRules("hostile_house");
  assert.deepEqual(R.uno.find(u => u.id === "rulers").spend, { rulers: -20 });
  assert.deepEqual(scenarioRules("sit_at_home").uno.find(u => u.id === "fg").spend, { fg: -15 });
});
test("the rival's moves come one a year (two on Intense), in order, never twice", () => {
  const R = scenarioRules("hostile_house");
  assert.deepEqual(scenarioMoves(R, {}, ctx()).map(m => m.id), ["probe"]);
  assert.deepEqual(scenarioMoves(R, { moves: ["probe"] }, ctx()).map(m => m.id), ["defectors"]);
  assert.deepEqual(scenarioMoves(R, {}, ctx({ pace: "intense" })).map(m => m.id), ["probe", "defectors"]);
  const B = scenarioRules("broke");
  assert.ok(!scenarioMoves(B, { moves: ["ultimatum", "pensioners"] }, ctx()).length, "the audit's findings need an audit");
  assert.equal(scenarioMoves(B, { moves: ["ultimatum", "pensioners"] }, ctx({ flags: { audit: true } }))[0].id, "ghosts");
});
test("progress adds up from answers and from the numbers", () => {
  const F = scenarioRules("flood");
  assert.equal(scenarioProg(F, ctx({ prog: 40, infra: .4 })), 80);
  assert.ok(scenarioMet(F, ctx({ prog: 70, infra: .4 })));
  const S = scenarioRules("sit_at_home");
  assert.equal(scenarioProg(S, ctx({ prog: 30, peace: { step: 2 } })), 70);
  assert.equal(scenarioRules("school_abduction").yearly(ctx({ flags: { children: "talks" }, rulers: 65 })).prog, 25);
});
test("Day One money is a share of the year's revenue", () => {
  assert.equal(scenarioCostB({ costPct: .05 }, 40), 2);
  assert.equal(scenarioCostB({ cost: .5 }, 40), .5);
});
