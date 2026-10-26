import { test } from "node:test";
import assert from "node:assert/strict";
import { STANCES, tradeInit, tradeYear, tradeApply, tradeOpen, TRADE_STORIES, localSupply, STATE_PRODUCE, exportInit, stateExportYear, STATE_TRADE_STORIES, cropText } from "../game/systems/trade.js";
import { storyCheck, storyCard, storyAfter, storyTurn } from "../game/systems/storylines.js";
import { SENATE_DISTRICTS } from "../game/systems/districts.js";

const run = (stance, fronts, years = 4, extra = {}) => { let T = tradeInit(stance); const out = []; for (let t = 1; t <= years; t++) { const Y = tradeYear(T, { fronts, turn: t, ...extra }); T = Y.T; out.push(Y); } return { T, out }; };

test("protection with empty farms is the trap: food prices explode", () => {
  const unsafe = { nw: 90, ne: 85 }, safe = { nw: 20, ne: 20 };
  assert.ok(localSupply(unsafe) < localSupply(safe));
  const trap = run("protect", unsafe).T, fed = run("protect", safe).T;
  assert.ok(trap.food >= 140, "food " + trap.food);
  assert.ok(fed.food < trap.food);
  assert.ok(trap.factories > 50, "protection still helps factories");
});
test("open borders keep food cheap but drain the reserves and the factories", () => {
  const o = run("open", { nw: 50, ne: 50 }, 4).T, p = run("protect", { nw: 50, ne: 50 }, 4).T;
  assert.ok(o.food < 100);
  assert.ok(o.reserves < p.reserves);
  assert.ok(o.factories < 50);
});
test("triggers open storylines from the state of trade", () => {
  const { out } = run("open", { nw: 80, ne: 80 }, 6);
  const all = out.flatMap(y => y.triggers);
  assert.ok(all.includes("fx"), "low reserves open the dollar shortage");
  assert.ok(all.includes("ports"));
  const prot = run("protect", { nw: 50, ne: 50 }, 5).out.flatMap(y => y.triggers);
  assert.ok(prot.includes("border"), "protection breeds smuggling");
  assert.ok(out.every(y => y.fx.cash > 0), "Customs and exports earn every year");
});
test("infrastructure opens after its years and raises exports", () => {
  let T = tradeApply(tradeInit("targeted"), { build: "seaport" }, 2);
  assert.equal(T.infra.seaport, 5);
  T = tradeApply(T, { build: "seaport" }, 3); assert.equal(T.infra.seaport, 5, "built once");
  const before = tradeYear(T, { fronts: {}, turn: 4 }).T.exports, after = tradeYear(T, { fronts: {}, turn: 5 }).T.exports;
  assert.ok(after > before);
  assert.equal(tradeApply(tradeInit(), { reserves: 10, floated: true }, 1).reserves, 43);
});
test("every trade storyline is well formed and can be played through", () => {
  Object.entries({ ...TRADE_STORIES, ...STATE_TRADE_STORIES }).forEach(([id, d]) => {
    assert.deepEqual(storyCheck(d), [], id);
    let S = tradeOpen(tradeInit("open"), id in TRADE_STORIES ? id : "fx", () => .3).stories[id in TRADE_STORIES ? id : "fx"];
    if (!(id in TRADE_STORIES)) S = { ...S, ...storyTurn(d, { beat: d.start, heat: d.heat0, hist: [], seen: [] }, 1, {}, () => .5) };
    for (let t = 1; t < 8 && S && !S.closed && S.beat; t++) { const c = storyCard(d, S, {}); if (!c) break; const R = storyAfter(d, S, c.opts[0], t, {}, () => .5); S = storyTurn(d, R.S, t + 1, { house: 70 }, () => .5); }
  });
});
test("every state grows something to export", () => {
  Object.keys(SENATE_DISTRICTS).forEach(st => assert.ok(STATE_PRODUCE[st] && STATE_PRODUCE[st].length >= 2, st));
  assert.equal(cropText({ t: "Our {c}" }, "cocoa").t, "Our cocoa");
});
test("a state's exports earn money, shaped by Abuja's stance", () => {
  let E = exportInit("Ondo", "zone", 1);
  assert.equal(stateExportYear(E, { turn: 2, agr: .5, stance: "targeted" }).cash, 0, "the zone takes two years to build");
  const open = stateExportYear(E, { turn: 3, agr: .5, stance: "open" }).cash, prot = stateExportYear(E, { turn: 3, agr: .5, stance: "protect" }).cash;
  assert.ok(open > prot, "cheap machines help processing");
  const raw = exportInit("Kano", "raw", 1), rp = stateExportYear(raw, { turn: 1, agr: .5, stance: "protect" }).cash, ro = stateExportYear(raw, { turn: 1, agr: .5, stance: "open" }).cash;
  assert.ok(rp > ro, "high local prices help raw farmers");
  const banned = stateExportYear({ ...raw, mods: { banned: true } }, { turn: 1, agr: .5 }).cash;
  assert.ok(banned < stateExportYear(raw, { turn: 1, agr: .5 }).cash);
  const Y = stateExportYear(stateExportYear(raw, { turn: 1, agr: .5 }, () => .1).E, { turn: 2, agr: .5 }, () => .1);
  assert.ok(Y.open && STATE_TRADE_STORIES[Y.open], "a storyline opens once the exports are flowing");
  assert.ok(Y.E.earned > 0);
});
test("every trade stance explains its trade-off", () => Object.values(STANCES).forEach(s => assert.ok(s.d.length > 40 && s.l)));
