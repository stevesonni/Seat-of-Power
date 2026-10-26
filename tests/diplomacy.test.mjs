import { test } from "node:test";
import assert from "node:assert/strict";
import { UNGA_THEMES, ungaFor, DIPLO_INVITES, inviteFor, smaller } from "../game/systems/diplomacy.js";
import { SEALS, letterKind } from "../game/systems/chief.js";

// The President's diplomacy: the UN every year with a fresh theme; a festival invitation every other year.
test("the UN: eight years, eight different themes; go or send the Vice-President", () => {
  const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(t => ungaFor(t, 12345).id));
  assert.equal(seen.size, 8);
  UNGA_THEMES.forEach(T => { assert.equal(T.deals.length, 2, T.id); assert.ok(T.vp && T.vp.past, T.id); });
});
test("an invitation: never the same country twice; every deal does something real", () => {
  const used = []; for (let i = 0; i < DIPLO_INVITES.length; i++) { const X = inviteFor(used, () => .5); used.push(X.id); }
  assert.equal(new Set(used).size, DIPLO_INVITES.length); assert.equal(inviteFor(used), null);
  [...DIPLO_INVITES, ...UNGA_THEMES].flatMap(X => X.deals).forEach(d => {
    const acts = Object.entries(d.fx).some(([k, v]) => k !== "cost" && v) || d.tr || d.jobs; assert.ok(acts, d.id); assert.ok(d.past, d.id); });
  const s = smaller(DIPLO_INVITES[0].deals[0]); assert.ok(s.fx.igr < DIPLO_INVITES[0].deals[0].fx.igr); assert.equal(s.later, undefined);
});
test("the letter is sky blue and called Diplomacy", () => {
  assert.deepEqual(letterKind("sc#dipl_unga_climate_3"), ["diplomacy", 2]);
  assert.equal(SEALS.diplomacy.nm, "Diplomacy"); assert.equal(SEALS.diplomacy.c, "#3a9ad9");
});
