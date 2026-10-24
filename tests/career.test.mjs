import { test } from "node:test";
import assert from "node:assert/strict";
import { STATE_TILES, careerMap, careerBadges } from "../game/systems/career.js";

test("the tile map has all 36 states and the FCT, no two on the same tile", () => {
  const ks = Object.keys(STATE_TILES); assert.equal(ks.length, 37);
  assert.equal(new Set(Object.values(STATE_TILES).map(String)).size, 37);
});
test("the map keeps your best grade in each state; badges follow endings", () => {
  const list = [{ state: "Ogun", grade: "C", ending: "defeated", cor: .3 }, { state: "Ogun", grade: "A", ending: "complete", cor: .15, flagAll: true }, { state: "Kano", grade: "D", ending: "impeached", cor: .5 }];
  const m = careerMap(list); assert.equal(m.Ogun.grade, "A"); assert.equal(m.Ogun.times, 2); assert.equal(m.Kano.grade, "D");
  const got = careerBadges(list).filter(b => b.got).map(b => b.id);
  for (const id of ["first", "two", "gradeA", "clean", "builder", "fallen"]) assert.ok(got.includes(id), id);
  assert.ok(!got.includes("ten"));
});
import { BADGE_PERKS } from "../game/systems/career.js";
test("every badge is worth something: a perk to carry into a campaign", () => {
  careerBadges([]).forEach(b => { const p = BADGE_PERKS[b.id]; assert.ok(p && p.text && Object.keys(p.fx).length, b.id); });
});
