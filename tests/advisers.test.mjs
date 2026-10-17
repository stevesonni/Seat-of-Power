import { test } from "node:test";
import assert from "node:assert/strict";
import { SA_LENSES, SA_SHORTLIST, lensIdOf, lensRead } from "../game/systems/advisers.js";

test("the shortlist offers four different outlooks", () => {
  const ids = SA_SHORTLIST.map(lensIdOf);
  assert.equal(new Set(ids).size, 4);
});
test("every outlook has a strength and a blind spot", () => {
  for (const L of Object.values(SA_LENSES)) { assert.ok(L.strength.length > 10); assert.ok(L.blind.length > 10); }
});
test("no outlook only helps: each has a cost or limit", () => {
  for (const [id, L] of Object.entries(SA_LENSES)) {
    const neg = Object.values(L.perYear || {}).some(v => v < 0) || id === "comms" || (L.perYear.cor || 0) > 0;
    assert.ok(neg, id + " has no downside");
  }
});
test("advisers read the same state differently", () => {
  const c = { s: { debt: 30, igr: 5, pStab: 40, app: 40, sec: .3 }, stalled: 1 };
  const reads = Object.keys(SA_LENSES).map(id => lensRead(id, c));
  assert.equal(new Set(reads).size, reads.length);
});
