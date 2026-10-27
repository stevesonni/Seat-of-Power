import { test } from "node:test";
import assert from "node:assert/strict";
import { PEACE, STATE_PEACE, peaceStep, peaceBlock, peaceChoose, peaceCanStart, peaceActive, peaceAftershockDue, frontsYear, frontsCard, FRONTS } from "../game/systems/index.js";

test("every front and the state have four steps with three ways", () => {
  for (const D of [...Object.values(PEACE), STATE_PEACE]) {
    assert.equal(D.steps.length, 4);
    D.steps.forEach(st => { assert.deepEqual(st.map(w => w.id), ["proper", "cheap", "crooked"]); assert.equal(st[0].relapse, 0); assert.ok(st[2].fx.cor > 0); });
  }
  assert.deepEqual(Object.keys(PEACE).sort(), Object.keys(FRONTS).sort(), "one plan for each front");
});
test("a plan done properly closes the front in four steps", () => {
  let P = { front: "ne", step: 0, started: 1 }, closed = false;
  for (let t = 2; t <= 5; t++) { const R = peaceChoose(P, peaceStep(P, PEACE.ne)[0], () => .9, t); P = R.plan; closed = R.closed; }
  assert.equal(P.step, 4); assert.equal(closed, true); assert.equal(P.closed, 5);
  assert.equal(peaceStep(P, PEACE.ne), null);
});
test("a shortcut can set the plan back one step, never to zero", () => {
  const P = { front: "se", step: 2, started: 1 };
  const R = peaceChoose(P, peaceStep(P, PEACE.se)[2], () => .1, 4);
  assert.equal(R.relapsed, true); assert.equal(R.plan.step, 1); assert.equal(R.plan.relapses, 1); assert.equal(R.sev, 10);
  assert.equal(peaceChoose(P, peaceStep(P, PEACE.se)[2], () => .9, 4).plan.step, 3, "lucky this time");
});
test("the front must cool before Hold, Build and Seal; two plans at a time", () => {
  assert.equal(peaceBlock({ step: 0 }, 90), null, "Clear can start anywhere");
  assert.match(peaceBlock({ step: 1 }, 70), /cool to 55/);
  assert.equal(peaceBlock({ step: 1 }, 50), null);
  const plans = { ne: { step: 1 }, nw: { step: 2 } };
  assert.equal(peaceActive(plans).length, 2); assert.equal(peaceCanStart(plans, "se"), false);
  assert.equal(peaceCanStart({ ne: { step: 4, closed: 3 } }, "se"), true, "a closed plan frees a place");
  assert.equal(peaceCanStart({ ne: { step: 1 } }, "ne"), false, "one plan per front");
});
test("a closed front never grows or reaches the council; a planned one grows slower", () => {
  const S = { ne: 60, nw: 60, se: 60, ss: 60 };
  const Y = frontsYear(S, null, { closed: ["ne"], planned: ["nw"] });
  assert.deepEqual([Y.S.ne, Y.S.nw, Y.S.se], [0, 63, 66]);
  assert.ok(!frontsCard(Y.S, ["ne"]).worst.includes("ne"));
  assert.equal(peaceAftershockDue({ closed: 3 }, 4), false); assert.equal(peaceAftershockDue({ closed: 3 }, 5), true); assert.equal(peaceAftershockDue({ closed: 3, after: "kept" }, 6), false);
});
