import { test } from "node:test";
import assert from "node:assert/strict";
import { spendAgenda, agendaLeft, agendaSize, canResolveYear, agendaBonus, billsLeft, ordersThisYear, BILLS_A_YEAR } from "../game/systems/agenda.js";

test("a year allows a bounded number of major actions", () => {
  let ag = null;
  for (let i = 0; i < agendaSize("medium"); i++) { const r = spendAgenda(ag, 1, "medium", { kind: "programme", label: "p" + i }); assert.ok(r.ok); ag = r.agenda; }
  assert.equal(agendaLeft(ag, 1, "medium"), 0);
  assert.equal(spendAgenda(ag, 1, "medium", { kind: "project", label: "one more" }).ok, false);
});
test("the agenda resets when the year changes", () => {
  let ag = spendAgenda(null, 1, "hard", { kind: "programme", label: "b" }).agenda;
  assert.equal(agendaLeft(ag, 2, "hard"), agendaSize("hard"));
});
test("repeating the same action in a year costs once", () => {
  let r = spendAgenda(null, 3, "medium", { kind: "project", label: "x", key: "prj:x" });
  r = spendAgenda(r.agenda, 3, "medium", { kind: "project", label: "x", key: "prj:x" });
  assert.ok(r.repeat); assert.equal(agendaLeft(r.agenda, 3, "medium"), agendaSize("medium") - 1);
});
test("difficulty changes the size", () => { assert.ok(agendaSize("easy") > agendaSize("medium")); assert.ok(agendaSize("medium") > agendaSize("hard")); });
test("a year resolves once", () => {
  assert.equal(canResolveYear(0, 1), true);
  assert.equal(canResolveYear(1, 1), false); // second click / reload
  assert.equal(canResolveYear(1, 2), true);
});

test("eight big moves on Medium, ten on Easy, six on Hard; a strong team earns more", () => {
  assert.deepEqual([agendaSize("easy"), agendaSize("medium"), agendaSize("hard")], [10, 8, 6]);
  const b = agendaBonus({ cosComp: 82, perfs: [75, 80, 90, 72, 40], app: 64 });
  assert.equal(b.n, 5); assert.equal(agendaSize("medium", b.n), 13);
  assert.equal(agendaBonus({ cosComp: 52, perfs: [40], app: 45 }).n, 0);
});
test("bills and executive orders do not use the big moves; the House takes three bills a year", () => {
  let ag = null;
  for (let i = 0; i < BILLS_A_YEAR; i++) { const r = spendAgenda(ag, 1, "hard", { kind: "bill", label: "b" + i }); assert.ok(r.ok && r.free); ag = r.agenda; }
  assert.equal(billsLeft(ag, 1), 0);
  const no = spendAgenda(ag, 1, "hard", { kind: "bill", label: "b9" }); assert.equal(no.ok, false); assert.equal(no.why, "bills");
  for (let i = 0; i < 5; i++) { const r = spendAgenda(ag, 1, "hard", { kind: "order", label: "o" + i }); assert.ok(r.ok); ag = r.agenda; }
  assert.equal(ordersThisYear(ag, 1), 5);
  assert.equal(agendaLeft(ag, 1, "hard"), 6, "none of them used a big move");
});
