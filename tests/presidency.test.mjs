import { test } from "node:test";
import assert from "node:assert/strict";
import { presInit, presDeck, presCard, presFx, presAfter, presDrift, presArt, PRES_LEARN, PRES_CRISES, commitKept, PRES_CARDS, PRES_CALLBACKS, PRES_WORLD } from "../game/systems/presidency.js";

const P0 = presInit("seed1", { nass: "A", gov: "B", army: "C", cbn: "D", party: "E" });
test("a presidency starts with a crisis and five named power centres", () => {
  assert.ok(PRES_CRISES[P0.crisis]);
  assert.deepEqual(Object.keys(P0.npcs).sort(), ["army", "cbn", "gov", "nass", "party"]);
  assert.equal(P0.npcs.nass.name, "A");
});
test("each year brings the crisis, two in-tray cards and the world stage every other year", () => {
  const d1 = presDeck("seed1", 1, P0), d2 = presDeck("seed1", 2, P0);
  assert.equal(d1[0].k, "story"); assert.equal(d1.filter(x => x.k === "card").length, 2); // the crisis is a storyline now (storylines.js) assert.ok(d1.some(x => x.k === "world"));
  assert.ok(!d2.some(x => x.k === "world"));
  d1.filter(it => it.k !== "story").forEach(it => { const c = presCard(P0, it); assert.ok(c && c.t && c.opts.length, JSON.stringify(it)); assert.ok(PRES_LEARN[c.learn], c.learn); assert.equal(presArt(P0, it, c).length, 4); });
});
test("choices move people and come back the next year", () => {
  const it = { k: "card", id: "efcc" }, o = presCard(P0, it).opts.find(x => x.id === "slow");
  const P1 = presAfter(P0, it, o, 0, 1);
  assert.equal(P1.npcs.party.rel, P0.npcs.party.rel + 10);
  assert.ok(P1.seen.includes("efcc"));
  assert.ok(presDeck("seed1", 2, P1).some(x => x.k === "callback" && x.id === "baron_shielded"));
});
test("an unattended crisis grows and hurts past 80; dealing with it ends it", () => {
  let P = { ...P0, story: { ...P0.story, heat: 82 } }; const d = presDrift(P); assert.ok(d.P.sev >= 80); assert.ok(d.fx.app < 0);
  const it = { k: "crisis", id: P0.crisis, i: 0 }, o = presCard(P0, it).opts[0];
  P = presAfter({ ...P0, sev: 12 }, it, { ...o, sev: -14 }, -14, 1); assert.equal(P.over, true);
});
test("commitments are kept by choices that advance them", () => {
  const P = { ...P0, commits: ["jobs"], adv: { jobs: 2 } }; assert.ok(commitKept(P, "jobs")); assert.ok(!commitKept(P, "power"));
});
test("effects map onto the engine; a risky choice can go wrong in public", () => {
  const f = presFx({ fx: { nation: 3, economy: 2, security: 5 }, cost: 100 });
  assert.deepEqual([f.fx.app, f.fx.igr, Math.round(f.fx.sec * 1000), f.costB], [3, 12, 30, 35]);
  assert.equal(presFx({ fx: { nation: 3 }, risk: 1 }, () => 0).bad, true);
});
test("every card's learn note exists", () => {
  [...PRES_CARDS, ...Object.values(PRES_CALLBACKS), ...PRES_WORLD, ...Object.values(PRES_CRISES).flatMap(c => c.cards)].forEach(c => assert.ok(PRES_LEARN[c.learn], c.t + " " + c.learn));
});
import { presidentWords } from "../game/systems/office.js";
test("the deck's governors stay governors under the president's vocabulary", async () => {
  const { PRES_NPCS } = await import("../game/systems/presidency.js");
  const role = presidentWords(PRES_NPCS.cbn.role).replace(/⁠/g, "");
  assert.equal(role, "Governor of the Central Bank");
  assert.equal(presidentWords(PRES_NPCS.gov.role).replace(/⁠/g, ""), "Chair, Governors' Forum");
  const bail = PRES_CARDS.find(c => c.id === "bailout");
  assert.match(presidentWords(bail.d).replace(/⁠/g, ""), /The governors want a bailout/);
});
test("the Villa pack's pictures are on the cards they belong to", async () => {
  const { presArt, presCard } = await import("../game/systems/presidency.js");
  const art = (it) => presArt(P0, it, presCard(P0, it));
  assert.equal(art({ k: "coup", id: "coup" })[3], "coup-night");
  assert.equal(art({ k: "world", id: "unga" })[3], "un-podium");
  assert.equal(art({ k: "card", id: "barracks" })[2], "red-phone");
  assert.equal(art({ k: "card", id: "barracks" })[1], null);
  assert.equal(art({ k: "card", id: "internal" })[1], "inspector-general");
});
