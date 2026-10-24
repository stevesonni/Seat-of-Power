import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../game/systems/projects.js";

// A fully funded project with an honest contractor must finish; a padded contract must not.
const runOne = (cid, type, cor, i) => {
  const e = P.estimate(type);
  let p = P.makeProject({ id: "t" + i + cid, title: "x", type, approvedM: e.buildM, thisYearM: e.buildM / e.years, year: 1 });
  const cov = P.contractCover(p, P.contractorById(cid), "open");
  p = { ...p, contractorId: cid, estimateM: Math.round(p.estimateM * P.PROCUREMENT.open.price), approvedM: Math.max(p.approvedM, cov.approvedM), status: "in_progress" };
  for (let y = 1; y <= 8 && p.status === "in_progress"; y++) p = P.tickProject(p, y, { cashM: 1e9, cor, oversight: .3 }).p;
  return p;
};
test("honest contractors finish fully funded projects, even with some corruption", () => {
  for (const [cid, type] of [["kestrel", "road"], ["riverside", "road"], ["medibuild", "hospital"], ["cranfield", "school"], ["aquaplus", "water"], ["sunline", "power"], ["danbala", "road"]])
    for (let i = 0; i < 60; i++) { const p = runOne(cid, type, .35, i); assert.ok(["delivered", "built"].includes(p.status), cid + " " + type + " ended " + p.status + " at " + p.progress + "%"); }
});
test("padded contracts run out of money before the work is done", () => {
  for (const cid of ["rainbow", "muhammad"]) for (let i = 0; i < 30; i++) assert.equal(runOne(cid, "road", .2, i).status, "stalled");
});
test("the contingency covers up to 10% over budget, not more", () => {
  const p = P.makeProject({ id: "c", title: "x", type: "road", approvedM: 9000, thisYearM: 4500, year: 1 });
  assert.equal(P.contractCover(p, P.contractorById("kestrel"), "open").covered, true);
  assert.equal(P.contractCover(p, P.contractorById("rainbow"), "open").covered, false);
});
