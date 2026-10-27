import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SCENARIO_RULES, scenarioRules, scenarioDeadline, unoHeld, scenarioYear, scenarioCostB } from "../game/systems/index.js";

const ctx = (o = {}) => ({ turn: 1, app: 50, pStab: 55, cor: .3, rulers: 55, fg: 50, house: { seats: 24, loyal: 9 }, arrears: 3, peace: null, sitClosed: false, flags: {}, base: { infra: .3, hp: .3, igr: 5 },
  sec: .3, hp: .3, infra: .3, agr: .3, igr: 5, reforms: 0, petition: undefined, agPerf: 0, worksPerf: 0, healthPerf: 0, ...o });

test("every scenario in the game has rules: a Day One with options and a goal", () => {
  const src = fs.readFileSync(new URL("../game/seat-of-power.jsx", import.meta.url), "utf8");
  const ids = [...src.slice(src.indexOf("const SCENARIOS = ["), src.indexOf("const scenarioStart")).matchAll(/id: "(\w+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 10);
  for (const id of ids) {
    const R = scenarioRules(id); assert.ok(R, id + " has rules");
    assert.ok(R.day1 && R.day1.options.length >= 3, id + " has a Day One with choices");
    assert.ok(R.goal && typeof R.goal.met === "function" && typeof R.goal.progress === "function", id + " has a goal");
    assert.ok(fs.existsSync(new URL("../public/art/characters/" + R.day1.who + ".webp", import.meta.url)), id + ": " + R.day1.who);
    assert.ok(fs.existsSync(new URL("../public/art/backgrounds/" + R.day1.bg + ".webp", import.meta.url)), id + ": " + R.day1.bg);
    if (id !== "narrow_win") { assert.ok(R.threat && R.doom && R.uno.length >= 1, id + " has an or-else and at least one uno card"); assert.ok(scenarioDeadline(R, ctx()) >= 2, id + " gives at least two years"); }
  }
  assert.equal(Object.keys(SCENARIO_RULES).length, 10);
});
test("the Hostile House: a majority breaks the logjam, otherwise the impeachment is due at the deadline", () => {
  const R = scenarioRules("hostile_house");
  assert.deepEqual(scenarioYear(R, ctx({ turn: 1 }), {}), { warn: true, due: false, held: [] });
  assert.equal(scenarioYear(R, ctx({ turn: 1 }), { warned: 1 }).warn, false);
  const due = scenarioYear(R, ctx({ turn: 2 }), { warned: 1 });
  assert.equal(due.due, true); assert.equal(due.held.length, 0);
  assert.deepEqual(scenarioYear(R, ctx({ turn: 2, house: { seats: 24, loyal: 12 } }), {}), { broken: true, fresh: true });
  assert.deepEqual(scenarioYear(R, ctx({ turn: 3 }), { broken: 2 }), { broken: true, fresh: false });
  assert.deepEqual(scenarioYear(R, ctx({ turn: 3 }), { resolved: "saved:app" }), {});
});
test("uno cards: approval, the rulers and a strong Attorney-General each save you", () => {
  const R = scenarioRules("hostile_house");
  assert.deepEqual(unoHeld(R, ctx({ app: 61 })).map(u => u.id), ["app"]);
  assert.deepEqual(unoHeld(R, ctx({ rulers: 72, agPerf: 75 })).map(u => u.id), ["rulers", "court"]);
  const G = scenarioRules("godfather_candidate");
  assert.equal(unoHeld(G, ctx({ app: 65, rulers: 60 })).length, 0, "the popular card needs both");
  assert.deepEqual(unoHeld(G, ctx({ app: 65, rulers: 75 })).map(u => u.id), ["popular"]);
});
test("deadlines follow the Day One answer where the scenario says so", () => {
  const G = scenarioRules("godfather_candidate");
  assert.equal(scenarioDeadline(G, ctx({ flags: { gf: "signed" } })), 4);
  assert.equal(scenarioDeadline(G, ctx({ flags: { gf: "bond" } })), 3);
  assert.equal(scenarioDeadline(G, ctx({ flags: { gf: "refused" } })), 2);
  assert.equal(scenarioYear(G, ctx({ turn: 2, flags: { gf: "signed" } }), {}).due, false);
  assert.equal(scenarioYear(G, ctx({ turn: 2, flags: { freed: true } }), {}).broken, true);
});
test("each goal is met the way its card says", () => {
  assert.ok(scenarioRules("broke").goal.met(ctx({ arrears: 0 })));
  assert.ok(!scenarioRules("broke").goal.met(ctx({ arrears: 1 })));
  assert.ok(scenarioRules("school_abduction").goal.met(ctx({ flags: { children: "home" } })));
  assert.ok(scenarioRules("sit_at_home").goal.met(ctx({ peace: { step: 2 } })));
  assert.ok(scenarioRules("bandit_corridor").goal.met(ctx({ sec: .56 })));
  assert.ok(scenarioRules("flood").goal.met(ctx({ infra: .37 })) && !scenarioRules("flood").goal.met(ctx({ infra: .35 })));
  assert.ok(scenarioRules("cholera").goal.met(ctx({ flags: { contained: true } })));
  assert.ok(scenarioRules("oil_crash").goal.met(ctx({ igr: 6 })));
  assert.ok(scenarioRules("narrow_win").goal.met(ctx({ petition: "won" })));
  assert.equal(scenarioYear(scenarioRules("narrow_win"), ctx({ turn: 5 }), {}).due, false, "the petition is its own or-else");
});
test("Day One money is a share of the year's revenue", () => {
  assert.equal(scenarioCostB({ costPct: .05 }, 40), 2);
  assert.equal(scenarioCostB({ cost: .5 }, 40), .5);
  assert.equal(scenarioCostB({}, 40), 0);
});
