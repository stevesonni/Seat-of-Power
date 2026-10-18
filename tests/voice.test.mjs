import { test } from "node:test";
import assert from "node:assert/strict";
import { voiceFor, cacheKey, speakable, sceneLines } from "../game/systems/voice.js";
test("a recurring character always gets the same voice", () => {
  const vs = ["A", "B", "C", "D"]; assert.deepEqual(voiceFor("commissioner:health:Ada Eze", vs), voiceFor("commissioner:health:Ada Eze", vs));
});
test("cache keys change with text, voice or settings", () => {
  const k = cacheKey({ text: "x", voice: "A" }); assert.notEqual(k, cacheKey({ text: "y", voice: "A" })); assert.notEqual(k, cacheKey({ text: "x", voice: "B" })); assert.notEqual(k, cacheKey({ text: "x", voice: "A", rate: 1.1 }));
});
test("amounts, titles and acronyms are made speakable", () => {
  assert.equal(speakable("Hon. Ada paid ₦1.69B and ₦850M"), "Honourable Ada paid 1.69 billion naira and 850 million naira");
  assert.match(speakable("The EFCC in the LGA"), /E F C C in the local government/);
});
test("scene lines get stable ids", () => { const l = sceneLines("case1", "c", ["a", "", "b"]); assert.deepEqual(l.map(x => x.lineId), ["l0", "l1"]); });
