import { test } from "node:test";
import assert from "node:assert/strict";
import { strikeImpact, strikeBlock } from "../game/systems/labour.js";
import { tickProject, makeProject, CONTRACTORS } from "../game/systems/projects.js";

// When the unions down tools, almost nothing works as planned (the owner's rule, October 2026).
const nlc = (stage) => ({ strikes: { nlc: { on: true, stage } } });
test("a general strike stops the civil service, the sites and the airports; security never stops", () => {
  const I = strikeImpact(nlc(1), true);
  assert.ok(I.grounded);
  assert.equal(strikeBlock(I, { type: "road", sector: "roads" }).status, "stop");
  assert.equal(strikeBlock(I, { s: "administration" }).status, "stop");
  assert.equal(strikeBlock(I, { s: "health" }).status, "slow", "the hospitals at stage 1: a go-slow, still enough to block a new programme");
  assert.equal(strikeBlock(I, { s: "security" }), null);
  assert.equal(strikeImpact(nlc(3), true).status.health, "stop", "the health workers join at stage 3");
  assert.ok(strikeImpact(nlc(1), false).grounded, "a governor is grounded too");
});
test("ASUU alone stops the universities, nothing else", () => {
  const I = strikeImpact({ strikes: { asuu: { on: true } } }, true);
  assert.ok(!I.grounded);
  assert.equal(strikeBlock(I, { id: "new_uni", s: "education" }).status, "stop");
  assert.equal(strikeBlock(I, { type: "university", sector: "education" }).status, "stop");
  assert.equal(strikeBlock(I, { s: "health" }), null);
  assert.equal(strikeImpact({ strikes: {} }, true).on, false);
});
test("a stopped site builds nothing and is paid nothing; a go-slow builds at half pace", () => {
  const p = { ...makeProject({ id: "s1", title: "Road", type: "road", qty: 10, lga: "Ota", ministryId: "works", approvedM: 9000, thisYearM: 4500, year: 1 }), status: "in_progress", contractorId: CONTRACTORS[0].id };
  const stop = tickProject(p, 2, { cashM: 99999, halt: 0, haltWhy: "the construction workers' union are on strike" });
  assert.equal(stop.paidM, 0); assert.equal(stop.p.builtM, 0); assert.equal(stop.p.status, "in_progress");
  assert.match(stop.events[0], /on strike; nothing was built/);
  const slow = tickProject(p, 2, { cashM: 99999, halt: .5 }), full = tickProject(p, 2, { cashM: 99999 });
  assert.ok(slow.p.builtM < full.p.builtM, slow.p.builtM + " < " + full.p.builtM);
});
