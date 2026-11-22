import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../game/systems/index.js";

const works = { id: "works", name: "Ministry of Works", minister: "Ade Bello", perf: 40, cor: 20 };
test("a recovery plan is costed steps from the sector, with stalled projects first", () => {
  const P = S.recoveryPlan(works, { stalled: [{ id: "p1", title: "Ijebu road", shortM: 600 }], turn: 2 });
  assert.equal(P.sector, "infrastructure");
  assert.equal(P.steps[0].pid, "p1"); assert.ok(P.steps[0].restart);
  assert.ok(P.steps.length >= 4 && P.steps.every(s => s.c > 0 && s.does && s.l));
  assert.equal(P.padB, 0);
  assert.ok(Math.abs(P.total - P.steps.reduce((a, s) => a + s.c, 0)) < .02);
});
test("a crooked minister pads the plan and delivers less", () => {
  const honest = S.recoveryPlan(works, { turn: 2 }), crook = S.recoveryPlan({ ...works, cor: 80 }, { turn: 2 });
  assert.ok(crook.total > honest.total && crook.padB > 0);
  assert.ok(crook.delivery < honest.delivery);
});
test("the President's plan is ten times larger; every sector has steps", () => {
  assert.ok(S.recoveryPlan(works, { nat: true }).total > S.recoveryPlan(works, {}).total * 9);
  ["health", "educ", "agric", "sec", "budget"].forEach(id => assert.ok(S.recoveryPlan({ ...works, id, name: id }, {}).steps.length === 3, id));
});
test("approving steps gives their effects, scaled by delivery, and the restarts", () => {
  const P = S.recoveryPlan(works, { stalled: [{ id: "p1", title: "Road", shortM: 600 }] });
  const all = S.planEffect(P, P.steps.map(s => s.id)), one = S.planEffect(P, [P.steps[1].id]);
  assert.ok(all.fx.infra > one.fx.infra && all.cost > one.cost);
  assert.deepEqual(all.restarts, [{ pid: "p1", shortM: 600 }]); assert.equal(one.restarts.length, 0);
});
test("ministers post what their ministry is doing on Tori", () => {
  const cab = [
    { id: "works", name: "Ministry of Works", minister: "Ade Bello", sub: "Commissioner · Works", projects: [{ title: "Ijebu road", status: "in_progress", progress: 42 }] },
    { id: "health", name: "Ministry of Health", minister: "Dr. Kemi Ola", sub: "Commissioner · Health", plan: "Recruit 300 nurses and midwives for the empty clinics" },
    { id: "educ", name: "Ministry of Education", minister: "Musa Idris", perf: 30 },
  ];
  const out = S.toriCabinet({ st: "Ogun", turn: 3, cab });
  assert.equal(out.length, 3);
  assert.ok(out.some(x => /Ijebu road/.test(x.text) && /42%/.test(x.text)));
  assert.ok(out.some(x => /recovery plan starts today/.test(x.text) && x.name === "Dr. Kemi Ola"));
  assert.ok(out.every(x => x.kind === "cabinet" && /^@Hon/.test(x.handle)));
  assert.deepEqual(S.toriCabinet({ st: "Ogun", turn: 3, cab: [] }), []);
});
