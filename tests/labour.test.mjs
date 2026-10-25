import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../game/systems/labour.js";

test("a VAT rise: the 14-day ultimatum names the cause", () => {
  const u = L.ultimatum("vat", true, 2);
  assert.match(u.line, /VAT rise from 7\.5% to 10%/); assert.match(u.line, /15th day/); assert.match(u.paper[0], /VAT/);
});

test("the NLC climbs the ladder each year without talks: airports, grid, fuel", () => {
  let st = L.startStrike("nlc", "vat", 3);
  let T = L.yearlyToll(st, { nat: true, turn: 3 });
  assert.match(T.t, /NUATE/); assert.ok(T.grounded); assert.equal(T.fx.app, -2);
  st = L.escalate(st, 4); T = L.yearlyToll(st, { nat: true, turn: 4 });
  assert.equal(st.stage, 2); assert.match(T.t, /grid/); assert.ok(T.igrPct <= -.2); assert.ok(T.letter);
  st = L.escalate(st, 5); assert.equal(st.stage, 3); assert.match(L.yearlyToll(st, { nat: true, turn: 5 }).t, /NUPENG/);
  assert.equal(L.escalate(st, 6).stage, 3);
  // Talks last year hold the line.
  assert.equal(L.escalate({ ...L.startStrike("nlc", "vat", 3), lastSession: 3 }, 4).stage, 1);
  // A governor's ladder: the secretariat, the schools, the hospitals.
  const g = L.stagesFor(false); assert.match(g[0].t, /secretariat/); assert.match(g[1].who, /NUT/); assert.match(g[2].who, /JOHESU/);
});

test("they want everything in the bank, or what they are owed if that is more", () => {
  const st = L.startStrike("nlc", "vat", 2);
  assert.equal(L.demandOf(st, { cash: 450, rev: 600 }), 450);
  assert.equal(L.demandOf(st, { cash: 0, rev: 600 }), 72);
  const rt = L.roundtable(st, { nat: true, cash: 450, rev: 600, cor: .3, minister: 60, turn: 2, divert: [{ id: "f_coastal", nm: "⭐ The Coastal Highway", kind: "pol", place: "Bayelsa" }] });
  assert.equal(rt.demand, 450);
  for (const id of ["pay", "mou", "offer", "refuse", "force", "divert", "print"]) assert.ok(rt.options.some(o => o.id === id), id);
  assert.ok(!L.roundtable(st, { nat: false, cash: 4, rev: 20, turn: 2 }).options.some(o => o.id === "print"), "a governor cannot print money");
});

test("paying everything ends it, and the bill comes next year; printing brings inflation in two", () => {
  const st = L.startStrike("nlc", "vat", 2), ctx = { nat: true, cash: 450, rev: 600, turn: 2 };
  const P = L.resolve(st, { id: "pay" }, ctx);
  assert.ok(P.end); assert.equal(P.spend, 450); assert.equal(P.later[0].kind, "labour_broke"); assert.equal(P.later[0].due, 3);
  const W = L.resolve(st, { id: "print" }, ctx);
  assert.ok(W.end); assert.ok(!W.spend); assert.equal(W.later[0].kind, "labour_print"); assert.equal(W.later[0].due, 4);
  const F = L.resolve(st, { id: "force" }, ctx, () => .95); // the rare case: the strike breaks and goes underground
  assert.ok(F.end); assert.equal(F.st.underground, 3);
  const R = L.resolve(st, { id: "refuse" }, ctx);
  assert.ok(!R.end); assert.equal(R.st.trust, st.trust - 10); assert.ok(R.st.on);
});

test("ASUU: the first offer is an insult, no MoU in the first year, and a missed instalment brings them back", () => {
  const st = L.startStrike("asuu", null, 2), ctx = { nat: true, cash: 300, rev: 600, cor: .3, minister: 80, turn: 2 };
  assert.equal(L.offerOdds(st, ctx), 0);
  const O = L.resolve(st, { id: "offer" }, ctx, () => 0);
  assert.ok(!O.end); assert.match(O.say, /insult/);
  assert.ok(!L.mouOk(st, 2)); assert.ok(L.resolve(st, { id: "mou" }, ctx).st.on);
  assert.ok(L.mouOk(st, 3));
  const M = L.resolve({ ...st, sessions: 3 }, { id: "mou" }, { ...ctx, turn: 3 });
  assert.ok(M.suspend); assert.equal(M.st.mou.due, 4); assert.ok(!M.st.on);
  const miss = L.mouDue(M.st, { cash: 1 }); assert.ok(!miss.paid); assert.ok(miss.st.on);
  const pay = L.mouDue(M.st, { cash: 9999 }); assert.ok(pay.paid); assert.ok(!pay.st.on);
  // Corruption makes them harden: "hypocrites".
  const s2 = { ...L.startStrike("nlc", "vat", 2), sessions: 1 };
  assert.ok(L.offerOdds(s2, { cor: .8, minister: 60, turn: 3 }) < L.offerOdds(s2, { cor: .2, minister: 60, turn: 3 }));
  assert.ok(L.offerOdds(s2, { cor: .3, minister: null, turn: 3 }) < L.offerOdds(s2, { cor: .3, minister: 80, turn: 3 }));
  // The NUEE year costs jobs; ASUU's second year brings the student protests.
  assert.ok(L.yearlyToll({ ...st, start: 2 }, { nat: true, turn: 3 }).protest);
});
