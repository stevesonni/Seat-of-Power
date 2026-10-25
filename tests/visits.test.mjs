import { test } from "node:test";
import assert from "node:assert/strict";
import { contractorShort, ribbonHeadline, VISIT_ASKS, visitOdds, visitOutcome } from "../game/systems/visits.js";

test("the ribbon: the contractor that delivered gets the headline", () => {
  assert.equal(contractorShort("Kestrel Construction Nig. PLC"), "KESTREL");
  const h = ribbonHeadline({ contractor: "Kestrel Construction Nig. PLC", who: "Governor Sonni", what: "Road" });
  assert.equal(h.h, "KESTREL DELIVERS: Governor Sonni unveils new road"); assert.ok(h.good);
  const bad = ribbonHeadline({ contractor: "Kestrel Construction Nig. PLC", who: "Governor Sonni", what: "Hospital", leakage: .3 });
  assert.match(bad.h, /QUESTIONS REMAIN/); assert.equal(bad.good, false);
});
test("the visit to Aso Rock: standing with Abuja decides the answer", () => {
  assert.equal(VISIT_ASKS.length, 4);
  VISIT_ASKS.forEach(a => { assert.ok(visitOdds(a, { fg: 85 }) > visitOdds(a, { fg: 20 }), a.id); assert.ok(a.yes && a.no); });
  const road = VISIT_ASKS.find(a => a.id === "road");
  const yes = visitOutcome(road, { fg: 90 }, () => 0), no = visitOutcome(road, { fg: 10 }, () => .99);
  assert.ok(yes.ok && yes.fx.infra > 0 && yes.paper[2]); assert.ok(!no.ok && !no.fx.infra && no.fg > 0, "even a no is face time");
  const refund = visitOutcome(VISIT_ASKS.find(a => a.id === "refund"), { fg: 90, revB: 50 }, () => 0); assert.ok(refund.cashB >= 1);
});
test("the President visits a state: four purposes, each with its own front page", async () => {
  const V = await import("../game/systems/visits.js");
  assert.equal(V.STATE_VISIT_PURPOSES.length, 4); assert.equal(V.STATE_VISITS_A_YEAR, 2);
  for (const p of V.STATE_VISIT_PURPOSES) { const o = V.stateVisitOutcome(p.id, { state: "Ebonyi", zone: "SE", sec: .4, issue: "roads" }, () => .1);
    assert.ok(o.title && o.line && o.zone > 0 && o.img, p.id); assert.match(o.paper[0], /EBONYI/); }
  assert.ok(V.stateVisitOutcome("inspect", { state: "Kano" }, () => .1).found);
  assert.ok(!V.stateVisitOutcome("inspect", { state: "Kano" }, () => .9).found);
  assert.ok(V.stateVisitOutcome("security", { state: "Borno", sec: .3 }).fx.sec > V.stateVisitOutcome("security", { state: "Lagos", sec: .6 }).fx.sec, "the front matters more");
});
