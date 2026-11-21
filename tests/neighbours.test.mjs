import test from "node:test";
import assert from "node:assert/strict";
import { toriNeighbours } from "../game/systems/tori.js";
import { tradeCoverage, interInit, signDeal, neighboursOf } from "../game/systems/interstate.js";

test("a deal with every neighbour counts, even one that ended", () => {
  const ns = neighboursOf("Ogun"); let I = interInit("Ogun", "x");
  assert.equal(tradeCoverage(I, "Ogun").done, false);
  ns.forEach((n, i) => { I = signDeal(I, n, "market", i + 1); });
  I = { ...I, deals: I.deals.map((d, i) => i === 0 ? { ...d, status: "ended" } : d) };
  const C = tradeCoverage(I, "Ogun");
  assert.equal(C.done, true); assert.deepEqual(C.left, []); assert.equal(C.signed.length, ns.length);
});

test("the neighbouring governors post on Tori: their work, the deal with you, a jab, a salute", () => {
  const nbrs = [{ st: "Lagos", name: "Gov. Ade Bello", art: "neighbour-governor-male", party: "same", rel: 70, produce: "fish", deals: ["Supply pact"] },
    { st: "Oyo", name: "Gov. Kemi Ojo", art: "neighbour-governor-female", party: "opp", rel: 30, produce: "cassava", deals: [] }];
  const P = toriNeighbours({ st: "Ogun", turn: 3, app: 40, arrears: 2, nbrs, tradeAll: true });
  assert.ok(P.length >= 3);
  assert.ok(P.every(p => p.kind === "neighbour" && /^@\w+Gov$/.test(p.handle) && /Governor of/.test(p.sub)));
  assert.ok(P.some(p => /@OgunGov/.test(p.text) && /every border/.test(p.text)), "the salute for a deal with every neighbour");
  assert.equal(toriNeighbours({ st: "Nigeria", nat: true, nbrs }).length, 0);
});
