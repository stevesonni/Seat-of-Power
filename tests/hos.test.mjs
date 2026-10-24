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
import { hosFailing, hosVerdict } from "../game/systems/hos.js";
test("failing commissioners: the Head of Service recommends fire or watch", () => {
  const ms = [{ id: "a", name: "Works", minister: "Ada Eze", perf: 30, hired: 1 }, { id: "b", name: "Health", minister: "Musa Bello", perf: 70, hired: 1 }, { id: "c", name: "Trade", minister: "Ola Ade", perf: 60, sinkhole: true, hired: 1 }];
  const f = hosFailing(ms, 3);
  assert.deepEqual(f.map(m => m.id), ["a", "c"]);
  assert.equal(hosVerdict({ style: "strict" }, ms[0], 3).id, "fire");
  assert.equal(hosVerdict({ style: "generous" }, ms[0], 3).id, "watch");
  assert.equal(hosVerdict({ style: "generous" }, { ...ms[0], watch: 2 }, 3).id, "fire");
  assert.equal(hosVerdict({ style: "generous" }, ms[2], 3).id, "fire");
  assert.match(hosVerdict({ style: "careful" }, ms[0], 3).line, /^Hon\. Ada Eze \(Works\)/);
});
