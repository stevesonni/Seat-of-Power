/* The President minds your trade plan (owner, 25 Nov 2026: "Build it"). */
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("a plan Abuja's policy hurts annoys the President, once and then every year", () => {
  const R = SYS.fedFriction("raw", "open", false);
  assert.equal(R.once, -4); assert.equal(R.yearly, -1); assert.ok(R.against); assert.match(R.why, /opened the borders/);
});
test("a plan in step with Abuja pleases him", () => { const R = SYS.fedFriction("zone", "open", false); assert.equal(R.once, 2); assert.equal(R.yearly, 0); });
test("a border state under an import ban: smuggling through its markets costs standing every year", () => {
  assert.equal(SYS.fedFriction("hub", "protect", true).yearly, -2); assert.ok(SYS.fedFriction("hub", "protect", true).smuggle);
  assert.equal(SYS.fedFriction("hub", "protect", false).yearly, 0, "no border, no smuggling");
  assert.equal(SYS.fedFriction("zone", "protect", true).yearly, -3, "against the policy and smuggling");
});
test("a targeted policy minds nothing", () => ["raw", "hub", "zone"].forEach(p => { const R = SYS.fedFriction(p, "targeted", true); assert.equal(R.once, 0); assert.equal(R.yearly, 0); }));
