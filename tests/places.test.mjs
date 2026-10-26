import { test } from "node:test";
import assert from "node:assert/strict";
import { estimate, terrainOf, capacityOf, sizeRange, siteTrouble, makeProject, SECOND_CONTRACTOR } from "../game/systems/projects.js";

// A programme's size and places (docs/STATUS.md, "Projects: how much and where").
test("terrain: creeks and highlands cost more; the rest is plain", () => {
  assert.equal(terrainOf("Ilaje"), "riverine");
  assert.equal(terrainOf("Bayelsa"), "riverine");
  assert.equal(terrainOf("Jos North"), "rocky");
  assert.equal(terrainOf("Abeokuta South"), null);
  const plain = estimate("road", 100, { places: ["Abeokuta South"] }), wet = estimate("road", 100, { places: ["Ilaje"] });
  assert.ok(wet.buildM > plain.buildM * 1.25, "a riverine road costs about 30% more");
  assert.deepEqual(wet.hard, [{ place: "Ilaje", kind: "riverine" }]);
});
test("capacity: a big road takes longer, a second contractor speeds it for 12% more", () => {
  const one = estimate("road", 600, { perf: 70 }), two = estimate("road", 600, { perf: 70, second: true });
  assert.ok(one.overCap && one.years > two.years, one.years + " vs " + two.years);
  assert.equal(two.buildM, Math.round(one.buildM * SECOND_CONTRACTOR));
  assert.ok(capacityOf("road", { perf: 100 }) > capacityOf("road", { perf: 40 }), "a good minister manages more");
  assert.ok(capacityOf("road", { federal: true }) > capacityOf("road"), "federal ministries are bigger");
});
test("spread: more places take longer; the slider goes from a pilot to four times the start", () => {
  const P = ["A", "B", "C", "D", "E", "F", "G"];
  assert.equal(estimate("housing", 300, { places: P.slice(0, 1) }).years + 2, estimate("housing", 300, { places: P }).years);
  const r = sizeRange("road", 20);
  assert.deepEqual([r.min, r.small, r.medium, r.large], [5, 10, 20, 40]);
  assert.ok(r.max >= 200, "up to ten times the start");
});
test("a project keeps all its places; the first is its main one", () => {
  const p = makeProject({ id: "x", title: "Roads", type: "road", qty: 30, lgas: ["Ilaje", "Akure South"], ministryId: "works", approvedM: 1, thisYearM: 1, year: 1 });
  assert.deepEqual(p.lgas, ["Ilaje", "Akure South"]);
  assert.equal(p.lga, "Ilaje");
});
test("site trouble: floods only where there is water; landowners elsewhere; seeded", () => {
  let fl = 0, land = 0;
  for (let i = 0; i < 400; i++) { let s = i + 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const a = siteTrouble({ lgas: ["Ilaje"], type: "road" }, 1, r), b = siteTrouble({ lgas: ["Ota"], type: "road" }, 1, r);
    if (a) { assert.equal(a.kind, "flood"); fl++; } if (b) { assert.equal(b.kind, "land"); land++; } }
  assert.ok(fl > 40 && fl < 110, "about 18% of years flood: " + fl);
  assert.ok(land > 15 && land < 70, "about 10% of years a land dispute: " + land);
});
// A player chose to build a university and got a road: the university programmes are universities now,
// and the education choices go beyond primary schools (feedback, October 2026).
import { parseProposal } from "../game/systems/proposals.js";
import { FED_TYPES } from "../game/systems/federal.js";
test("education: universities, polytechnics, colleges of education, nursing and secondary schools", () => {
  const P = (t, o) => parseProposal(t, o).proposal;
  assert.equal(P("a state university with 6000 students").type, "university");
  assert.equal(P("university").qty, 5000);
  assert.equal(P("polytechnic").type, "polytechnic");
  assert.equal(P("college of education").type, "coe");
  assert.equal(P("school of nursing and midwifery").type, "nursing");
  assert.equal(P("secondary school").type, "secondary");
  assert.equal(P("primary school").type, "school");
  assert.equal(P("university", { federal: true }).name, "Federal university");
  assert.equal(parseProposal("a federal university").status, "unsupported", "a governor founds state institutions only");
  ["university", "polytechnic", "coe", "nursing", "secondary"].forEach(k => assert.ok(FED_TYPES.includes(k), k));
});
