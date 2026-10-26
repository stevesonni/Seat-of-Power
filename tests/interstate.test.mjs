import { test } from "node:test";
import assert from "node:assert/strict";
import { NEIGHBOURS, neighboursOf, interInit, mission, missionOdds, signDeal, interYear, interApply, INTER_STORIES, MEDIATION, routeState, DEAL_KINDS, mediationPair, activeDeals } from "../game/systems/interstate.js";
import { storyCheck, storyCard, storyAfter, storyTurn } from "../game/systems/storylines.js";
import { SENATE_DISTRICTS } from "../game/systems/districts.js";

test("every state has its real neighbours, and borders run both ways", () => {
  Object.keys(SENATE_DISTRICTS).forEach(s => assert.ok(neighboursOf(s).length >= 1, s));
  Object.entries(NEIGHBOURS).forEach(([a, ns]) => ns.forEach(b => assert.ok(NEIGHBOURS[b] && NEIGHBOURS[b].includes(a), a + " / " + b)));
  assert.deepEqual(neighboursOf("Lagos"), ["Ogun"]);
  assert.deepEqual([...neighboursOf("Ogun")].sort(), ["Lagos", "Ondo", "Osun", "Oyo"]);
});
test("going yourself and a friendly governor make a yes likelier", () => {
  const I = interInit("Ogun", "x"), G = { rel: 60, party: "same" }, O = { rel: 40, party: "opp" };
  assert.ok(missionOdds(G, "supply", { go: true }) > missionOdds(G, "supply", { go: false }));
  assert.ok(missionOdds(G, "supply") > missionOdds(O, "supply"));
  const no = mission(I, "Oyo", "supply", { r: () => .99 }), yes = mission(I, "Oyo", "supply", { r: () => .01 });
  assert.ok(!no.ok && no.ask && no.ask.l, "a no comes with their price"); assert.ok(yes.ok);
});
test("a deal earns every year; a joint project only once it is built", () => {
  let I = signDeal(interInit("Ogun", "x"), "Oyo", "market", 1);
  I = signDeal(I, "Osun", "joint", 1);
  assert.equal(activeDeals(I).length, 2); assert.equal(I.last, 1);
  const y2 = interYear(I, { turn: 2, state: "Ogun", r: () => .99 });
  assert.equal(y2.cash, DEAL_KINDS.market.cash, "the joint project is still being built");
  const y3 = interYear(I, { turn: 3, state: "Ogun", r: () => .99 });
  assert.equal(y3.cash, DEAL_KINDS.market.cash + DEAL_KINDS.joint.cash);
  const lev = interYear(interApply(I, I.deals[0].id, { mod: { levy: true } }), { turn: 3, state: "Ogun", r: () => .99 });
  assert.ok(lev.cash < y3.cash, "toll gates halve the earnings");
  assert.equal(interYear(interApply(I, I.deals[0].id, { end: true }), { turn: 3, state: "Ogun", r: () => .99 }).cash, DEAL_KINDS.joint.cash, "an ended deal earns nothing");
});
test("a deal can turn into a storyline", () => {
  const I = signDeal(interInit("Ogun", "x"), "Oyo", "supply", 1);
  const Y = interYear(I, { turn: 3, state: "Ogun", r: () => .1 });
  assert.ok(Y.open && INTER_STORIES[Y.open.id]); assert.ok(Object.keys(Y.I.stories).length === 1);
  assert.ok(routeState("Ogun", "Oyo") && routeState("Ogun", "Oyo") !== "Ogun");
});
test("every interstate storyline is well formed and plays to the end", () => {
  Object.entries({ ...INTER_STORIES, mediation: MEDIATION }).forEach(([id, d]) => {
    assert.deepEqual(storyCheck(d), [], id);
    let S = { beat: d.start, heat: d.heat0, hist: [], seen: [], laws: [], orders: [] };
    for (let t = 1; t < 8 && S && !S.closed && S.beat; t++) { const c = storyCard(d, S, {}); if (!c) break; const R = storyAfter(d, S, c.opts[0], t, {}, () => .5); S = storyTurn(d, R.S, t + 1, { house: 70 }, () => .5); }
  });
  const [a, b] = mediationPair("seed"); assert.ok(NEIGHBOURS[a].includes(b));
});
