import { test } from "node:test";
import assert from "node:assert/strict";
import { contractorShort, ribbonHeadline, VISIT_ASKS, visitOdds, visitOutcome } from "../game/systems/visits.js";
import * as SYS from "../game/systems/visits.js";

test("the ribbon: the contractor that delivered gets the headline", () => {
  assert.equal(contractorShort("Kestrel Construction Nig. PLC"), "KESTREL");
  const h = ribbonHeadline({ contractor: "Kestrel Construction Nig. PLC", who: "Governor Sonni", what: "Road" });
  assert.equal(h.h, "KESTREL DELIVERS: Governor Sonni unveils new road"); assert.ok(h.good);
  const bad = ribbonHeadline({ contractor: "Kestrel Construction Nig. PLC", who: "Governor Sonni", what: "Hospital", leakage: .3 });
  assert.match(bad.h, /QUESTIONS REMAIN/); assert.equal(bad.good, false);
});
test("the visit to Aso Rock: standing with Abuja decides the answer", () => {
  assert.equal(VISIT_ASKS.length, 4);
  VISIT_ASKS.forEach(a => { assert.ok(visitOdds(a, { fg: 85 }) > visitOdds(a, { fg: 20 }), a.id); assert.ok(a.yes && a.no); });
  const road = VISIT_ASKS.find(a => a.id === "road");
  const yes = visitOutcome(road, { fg: 90 }, () => 0), no = visitOutcome(road, { fg: 10 }, () => .99);
  assert.ok(yes.ok && yes.fx.infra > 0 && yes.paper[2]); assert.ok(!no.ok && !no.fx.infra && no.fg > 0, "even a no is face time");
  const refund = visitOutcome(VISIT_ASKS.find(a => a.id === "refund"), { fg: 90, revB: 50 }, () => 0); assert.ok(refund.cashB >= 1);
});
test("the President visits a state: four purposes, each with its own front page", async () => {
  const V = await import("../game/systems/visits.js");
  assert.equal(V.STATE_VISIT_PURPOSES.length, 4); assert.equal(V.STATE_VISITS_A_YEAR, 2);
  for (const p of V.STATE_VISIT_PURPOSES) { const o = V.stateVisitOutcome(p.id, { state: "Ebonyi", zone: "SE", sec: .4, issue: "roads" }, () => .1);
    assert.ok(o.title && o.line && o.zone > 0 && o.img, p.id); assert.match(o.paper[0], /EBONYI/); }
  assert.ok(V.stateVisitOutcome("inspect", { state: "Kano" }, () => .1).found);
  assert.ok(!V.stateVisitOutcome("inspect", { state: "Kano" }, () => .9).found);
  assert.ok(V.stateVisitOutcome("security", { state: "Borno", sec: .3 }).fx.sec > V.stateVisitOutcome("security", { state: "Lagos", sec: .6 }).fx.sec, "the front matters more");
});

test("a visit's request is the worst thing in the place, never one already open", () => {
  const bad = { sec: .1, infra: .9, hp: .9, lit: .9, agr: .9, unemp: .05, pov: .05 };
  const n = Array.from({ length: 200 }, (_, i) => SYS.visitRequest(bad, () => (i + .5) / 200)).filter(k => k === "security").length;
  assert.ok(n > 120, "insecurity dominates: " + n);
  for (let i = 0; i < 50; i++) assert.notEqual(SYS.visitRequest(bad, () => i / 50, ["security"]), "security");
  assert.equal(SYS.visitRequest(bad, Math.random, ["security", "road", "clinic", "school", "farm", "youth", "poverty"]), null);
  for (const k of ["security", "road", "clinic", "school", "farm", "youth", "poverty"]) assert.ok(SYS.ASK_LINE[k]);
});

test("an LGA tour: the chairman's ask, or a town hall that may turn rough", () => {
  const c = SYS.lgaTourOutcome("chairman", { lga: "Jos North", chairman: "Hon. Musa Dung", ask: "clinic" });
  assert.match(c.line, /Hon\. Musa Dung/); assert.match(c.line, /hospital/); assert.equal(c.fx.pStab, 1);
  const good = SYS.lgaTourOutcome("townhall", { lga: "Jos North", app: 70, ask: "road" }, () => .1);
  assert.ok(!good.rough); assert.equal(good.fx.app, 2); assert.match(good.paper[0], /JOS NORTH/);
  const rough = SYS.lgaTourOutcome("townhall", { lga: "Jos North", app: 30, ask: "road" }, () => .1);
  assert.ok(rough.rough); assert.equal(rough.fx.app, -1);
  assert.equal(SYS.LGA_TOURS_A_YEAR, 2); assert.equal(SYS.LGA_TOUR_PURPOSES.length, 2);
});
