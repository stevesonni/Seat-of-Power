import { test } from "node:test";
import assert from "node:assert/strict";
import { hosCandidates, hosRecommend, hosDecide, hosLine, HOS_STYLES } from "../game/systems/hos.js";

const ask = { id: "a1", options: [{ id: "fund", label: "Give them ₦500M" }, { id: "plan", label: "No money: ask for a recovery plan" }, { id: "no", label: "Decline" }] };
const report = { id: "a2", options: [{ id: "praise", label: "Praise them in public" }, { id: "more", label: "Set a harder target for next year" }] };
test("three candidates, one of each style, each with a portrait", () => {
  const c = hosCandidates("Enugu:Ada", ["A", "B", "C"]);
  assert.deepEqual(c.map(x => x.style).sort(), ["careful", "generous", "strict"]);
  assert.ok(c.every(x => x.img && x.record));
});
test("the adviser recommends a careful one when money is tight", () => {
  const c = hosCandidates("x"); assert.equal(c.find(x => x.id === hosRecommend(c, { cash: .2 }).id).style, "careful");
});
test("each style decides in character", () => {
  assert.equal(hosDecide({ style: "careful" }, ask, 5).id, "plan");
  assert.equal(hosDecide({ style: "generous" }, ask, 5).id, "fund");
  assert.equal(hosDecide({ style: "generous" }, ask, .1).id, "plan", "no money, no release");
  assert.equal(hosDecide({ style: "strict" }, ask, 5).id, "no");
  assert.equal(hosDecide({ style: "generous" }, report, 5).id, "praise");
  assert.equal(hosDecide({ style: "careful" }, report, 5).id, "more");
});
test("the brief says who asked for what, and what was decided", () => {
  assert.equal(hosLine({ minister: "Ikechukwu Agbo", name: "Information" }, ask, ask.options[1]),
    "Hon. Ikechukwu Agbo, Commissioner for Information, asked for ₦500M to get stalled work moving. I gave a recovery plan instead.");
});
