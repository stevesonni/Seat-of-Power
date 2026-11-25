// Year one's inherited budget (owner, 25 Nov 2026): the predecessor's budget, and how far a supplementary budget moves it.
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
test("inherited budget: the predecessor's budget adds up, and a supplementary budget moves at most 20 of every 100", () => {
  Object.values(SYS.PREDECESSORS).forEach(P => assert.equal(Object.values(P.bud).reduce((a, b) => a + b, 0), 100));
  const P = SYS.predecessorBudget("seed", false);
  assert.ok(SYS.PREDECESSORS[P.kind] && P.lines.length);
  const moved = { ...P.bud, infrastructure: P.bud.infrastructure - 10, health: P.bud.health + 10 };
  assert.equal(SYS.movedOf(P.bud, moved), 10); assert.ok(SYS.suppOk(P.bud, moved));
  assert.ok(!SYS.suppOk(P.bud, { ...P.bud, infrastructure: P.bud.infrastructure - 21, health: P.bud.health + 21 }));
  assert.equal(SYS.JAPA_FG_MIN, 50); assert.equal(SYS.JAPA_ABROAD_MIN, 51);
});
