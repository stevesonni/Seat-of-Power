import { test } from "node:test";
import assert from "node:assert/strict";
import { complaintsFor, complaintAnswers, complaintsYear } from "../game/systems/complaints.js";

const ctx = { nat: false, arrears: 2, needs: [{ id: "n1", lga: "Ikeja", status: "failed", zone: 1, ask: "Start the Clean Water Project.", ministry: "health" }], stalled: [{ id: "p1", title: "the ring road", lga: "Epe" }], cor: .6, house: { loyal: 30, seats: 40 }, app: 50, memo: {}, turn: 3 };

test("complaints come from real causes, name a place, and say what would fix them", () => {
  const L = complaintsFor(ctx);
  assert.deepEqual(L.map(c => c.id), ["arrears", "need:n1", "stall:p1", "cor"]);
  assert.equal(L[1].place, "Ikeja"); assert.match(L[1].want, /Clean Water Project in Ikeja/);
  assert.ok(L.length <= 5);
  assert.equal(complaintsFor({ ...ctx, arrears: 0, needs: [], stalled: [], cor: .2 }).length, 0, "no cause, no complaint");
});
test("free words once; after that only the fix", () => {
  const c = complaintsFor(ctx)[1];
  const first = complaintAnswers(c, { minister: { name: "Hon. Ada", perf: 72 } });
  assert.deepEqual(first.map(a => a.id), ["visit", "send", "fix"]); assert.equal(first[1].ok, true);
  const later = complaintsFor({ ...ctx, memo: { "need:n1": { how: "talk", t: 2 } } })[1];
  assert.ok(later.lied); assert.match(later.t, /last year/i);
  assert.deepEqual(complaintAnswers(later).map(a => a.id), ["fix"]);
});
test("the President hears the nation: the crisis and the fronts", () => {
  const L = complaintsFor({ nat: true, arrears: 0, crisis: { nm: "The fuel crisis", heat: 70 }, fronts: [{ id: "nw", zone: "North-West", sev: 80 }], app: 50, turn: 2 });
  assert.deepEqual(L.map(c => c.id), ["crisis", "front:nw"]); assert.match(L[0].t, /Fuel/);
});
test("an unanswered complaint costs; words that changed nothing cost more", () => {
  const L = complaintsFor(ctx);
  const none = complaintsYear(L, {}, 2), talked = complaintsYear(L, { arrears: { how: "talk", t: 1 } }, 2), answered = complaintsYear(L, Object.fromEntries(L.map(c => [c.id, { how: "send", t: 2 }])), 2);
  assert.ok(none.app < 0); assert.equal(answered.app, 0); assert.ok(talked.lines.some(l => /lied/.test(l)));
  assert.ok(none.app >= -4, "capped");
});
