import { test } from "node:test";
import assert from "node:assert/strict";
import { spendAgenda, agendaLeft, agendaSize, canResolveYear } from "../game/systems/agenda.js";

test("a year allows a bounded number of major actions", () => {
  let ag = null;
  for (let i = 0; i < agendaSize("medium"); i++) { const r = spendAgenda(ag, 1, "medium", { kind: "order", label: "o" + i }); assert.ok(r.ok); ag = r.agenda; }
  assert.equal(agendaLeft(ag, 1, "medium"), 0);
  assert.equal(spendAgenda(ag, 1, "medium", { kind: "order", label: "one more" }).ok, false);
});
test("the agenda resets when the year changes", () => {
  let ag = spendAgenda(null, 1, "hard", { kind: "bill", label: "b" }).agenda;
  assert.equal(agendaLeft(ag, 2, "hard"), agendaSize("hard"));
});
test("repeating the same action in a year costs once", () => {
  let r = spendAgenda(null, 3, "medium", { kind: "bill", label: "x", key: "bill:x" });
  r = spendAgenda(r.agenda, 3, "medium", { kind: "bill", label: "x", key: "bill:x" });
  assert.ok(r.repeat); assert.equal(agendaLeft(r.agenda, 3, "medium"), agendaSize("medium") - 1);
});
test("difficulty changes the size", () => { assert.ok(agendaSize("easy") > agendaSize("medium")); assert.ok(agendaSize("medium") > agendaSize("hard")); });
test("a year resolves once", () => {
  assert.equal(canResolveYear(0, 1), true);
  assert.equal(canResolveYear(1, 1), false); // second click / reload
  assert.equal(canResolveYear(1, 2), true);
});
