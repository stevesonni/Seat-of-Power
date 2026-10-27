import { test } from "node:test";
import assert from "node:assert/strict";
import { seatFor, balance, BUDGET_LINES, shareCard, ministerWord, inviteUrl, inviteText, screeningFor, lineOwner, CAB_SEATS } from "../game/systems/cabinet.js";
import { letterKind } from "../game/systems/chief.js";

test("letters go to the right desk", () => {
  assert.equal(seatFor({ kind: "budget", title: "The 2028 budget" }), "finance");
  assert.equal(seatFor({ kind: "budget", title: "Teachers' salaries in the budget" }), "finance", "the budget stays with Finance");
  assert.equal(seatFor({ kind: "crisis", title: "Cholera in Nsukka" }), "social");
  assert.equal(seatFor({ kind: "crisis", title: "Kidnappers on the highway" }), "justice");
  assert.equal(seatFor({ kind: "house", title: "The Speaker wants a word" }), "deputy");
  assert.equal(seatFor({ kind: letterKind("stall:p9")[0], title: "A stalled bridge" }), "works");
  assert.equal(seatFor({ kind: "agenda", title: "Your agenda" }), null, "the promise is the Governor's own");
});
test("a budget always adds to 100", () => {
  for (const s of [{}, { education: 40, health: 40, infrastructure: 40 }, { education: 3, debt: 1 }, { education: 15, health: 12, infrastructure: 18, security: 12, agriculture: 10, administration: 8, salaries: 18, debt: 7 }]) {
    const b = balance(s); assert.equal(BUDGET_LINES.reduce((a, k) => a + b[k], 0), 100);
  }
  assert.ok(BUDGET_LINES.every(l => lineOwner(l)), "every line has a minister");
});
test("the end-of-term card names the star", () => {
  const cab = { year: 4, gov: { name: "Ada Obi", state: "Enugu", startYear: 2027 }, seats: { finance: { member: { name: "Chinaza" }, rec: { advised: 6, followed: 5 } }, works: { member: { name: "Tunde" }, rec: { absent: 4, advised: 1 } } } };
  const c = shareCard(cab);
  assert.equal(c.head, "The Ada Obi Government, 2027–2030");
  assert.equal(c.rows[0].name, "Chinaza"); assert.match(c.text, /Star of the cabinet: Chinaza/);
  assert.equal(ministerWord({ absent: 4, advised: 1 }), "Often absent");
});
test("invites", () => {
  const u = inviteUrl("https://x.app/seat-of-power.html?old=1", "ABC234", "finance", "k_1");
  assert.equal(u, "https://x.app/seat-of-power.html?cab=ABC234&seat=finance&inv=k_1");
  assert.match(inviteText({ gov: "Ada Obi", state: "Enugu", seat: "finance", url: u }), /Commissioner for Finance of Enugu/);
  assert.equal(screeningFor("ABC234", "finance"), screeningFor("ABC234", "finance"));
  assert.equal(CAB_SEATS.length, 5);
});
