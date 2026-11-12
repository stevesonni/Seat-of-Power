import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("the five round-three pillars are in the experiment", () => {
  ["juice", "why", "reach", "capital", "purse"].forEach(id => assert.ok(SYS.PILLAR_IDS.includes(id), id));
});

test("because you…: each earlier decision named, with its year and what it did", () => {
  const C = SYS.becauseCard([{ from: "funded Free Primary Education", made: 1, desc: "📈 Free Primary Education is showing results.", fx: { lit: .03, app: 5 } }], 2027);
  assert.equal(C.kicker, "Because you…"); assert.equal(C.title, "Free Primary Education is showing results.");
  assert.deepEqual(C.rows[0], { l: "2027 · You funded Free Primary Education", v: "Schools up, People up", good: true });
  assert.equal(C.tone, "good");
  const B = SYS.becauseCard([{ from: "left the workers' arrears unpaid", made: 2, fx: { app: -3 } }, { from: "adopted a biometric payroll audit", made: 1, revIGR: .4 }, { from: "chose “Say no”", made: 1, fx: { app: -2 } }], 2027);
  assert.equal(B.title, "Earlier decisions came back"); assert.equal(B.rows.length, 3); assert.equal(B.tone, "bad");
  assert.equal(B.rows[1].v, "Treasury up"); assert.equal(B.rows[0].l, "2028 · You left the workers' arrears unpaid");
  assert.equal(SYS.becauseCard([{ desc: "no source" }]), null, "an effect with no decision behind it gets no card");
  assert.deepEqual(SYS.fxWords({ cor: .02 }), { text: "Corruption up", good: false });
});
