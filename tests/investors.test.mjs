import { test } from "node:test";
import assert from "node:assert/strict";
import { projectInvestors, investorClimate, FIRMS } from "../game/systems/investors.js";

const park = { id: "p1", type: "industrial", title: "Ota Industrial Park", lga: "Ado-Odo/Ota", estimateM: 3000, quality: .95, leakage: 0 };
test("a finished industrial park brings two foreign firms", () => {
  const v = projectInvestors(park, { cor: .2, app: 60, sec: .55 });
  assert.equal(v.length, 2);
  assert.notEqual(v[0].firm.id, v[1].firm.id);
  assert.ok(v.every(x => x.ok && x.jobs > 0 && x.igrB > 0), JSON.stringify(v.map(x => [x.ok, x.jobs])));
  assert.match(v[0].lines[0].line, /Ota Industrial Park/);
});
test("good governance attracts more than bad", () => {
  const good = projectInvestors(park, { cor: .15, app: 65, sec: .6 }), bad = projectInvestors(park, { cor: .6, app: 40, sec: .3 });
  const sum = (v) => v.reduce((a, x) => a + x.jobs, 0);
  assert.ok(sum(good) > sum(bad));
  assert.ok(bad.some(x => !x.ok), "a state known for graft loses at least one investor");
  assert.ok(investorClimate({ cor: .1, app: 70 }) > investorClimate({ cor: .6, app: 40 }));
});
test("money that went missing on the project costs investment", () => {
  const clean = projectInvestors(park, { cor: .3, app: 55, sec: .5 }), leaky = projectInvestors({ ...park, leakage: .35, quality: .6 }, { cor: .3, app: 55, sec: .5 });
  assert.ok(leaky.reduce((a, x) => a + x.jobs, 0) < clean.reduce((a, x) => a + x.jobs, 0));
});
test("a project business does not need brings no letters; firms are named", () => {
  assert.equal(projectInvestors({ ...park, type: "cctv" }, {}).length, 0);
  assert.ok(FIRMS.some(f => f.country === "China") && FIRMS.some(f => f.country === "Sweden") && FIRMS.some(f => f.country === "the United States"));
});
