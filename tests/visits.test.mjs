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
