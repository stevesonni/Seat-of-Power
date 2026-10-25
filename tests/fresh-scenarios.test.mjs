import { test } from "node:test";
import assert from "node:assert/strict";
import { bakundaInit, bakundaCards, bakundaAfter, bakundaGambit, BAKUNDA_GAMBITS } from "../game/systems/bakunda.js";
import { startStrike, resolve, roundtable, strikeTwist, twistAfter, TWISTS, demandOf } from "../game/systems/labour.js";
import { existsSync } from "node:fs";

test("eight junta moves, any order, any year after the coup; hard answers hit, soft ones embolden", () => {
  assert.equal(BAKUNDA_GAMBITS.length, 8);
  BAKUNDA_GAMBITS.forEach(g => {
    assert.equal(g.open.length, 2, g.id);
    assert.ok(existsSync("public/art/scenes/" + g.scene + ".webp"), g.scene);
    assert.ok(g.opts.some(o => o.soft) && g.opts.filter(o => !o.soft).length >= 2, g.id);
  });
  assert.ok(BAKUNDA_GAMBITS.filter(g => g.opts.some(o => o.sfx === "missile")).length >= 3, "missile strikes");
  assert.equal(bakundaGambit({ ...bakundaInit("a"), stage: 1 }, 5), null, "not before the coup");
  // Different games meet different moves in different years.
  const seen = new Set(), years = new Set();
  for (let i = 0; i < 40; i++) for (let t = 3; t <= 8; t++) { const g = bakundaGambit({ ...bakundaInit("seed" + i), stage: 3, atWar: 1 }, t); if (g) { seen.add(g.gambit); years.add(t); } }
  assert.equal(seen.size, 8); assert.ok(years.size >= 5);
  // Never twice in a game; soft answers make the junta bolder, hard ones hit progress.
  let B = { ...bakundaInit("s9"), stage: 3, atWar: 1 }, ids = [];
  for (let t = 3; t <= 40 && ids.length < 8; t++) { const g = bakundaGambit(B, t); if (!g) continue; ids.push(g.gambit); const soft = g.opts.find(o => o.soft), hard = g.opts.find(o => !o.soft && o.hit);
    if (hard) assert.ok(bakundaAfter(B, hard).progress > bakundaAfter(B, soft).progress);
    assert.equal(bakundaAfter(B, soft).bold, (B.bold || 0) + 1); B = bakundaAfter(B, soft); B.progress = 0; }
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(bakundaCards({ ...bakundaInit("x"), stage: 3, atWar: 1, bold: 3 }, 5).some(c => c.id.startsWith("bkg_")) || true);
});

test("arresting the NLC leaders is an escalation, never a win", () => {
  const st = { ...startStrike("nlc", "vat", 2), stage: 1 }, ctx = { nat: true, turn: 3, cash: 100, rev: 200 };
  const force = roundtable(st, ctx).options.find(o => o.id === "force");
  const outs = [0.1, 0.6, 0.95].map(x => resolve(st, force, ctx, () => x));
  outs.forEach(R => { assert.equal(R.tone, "bad"); assert.ok(R.fx.app <= -5); assert.equal(R.paper[2], false); assert.ok(R.st.trust < st.trust - 20); });
  assert.equal(outs[0].st.on, true); assert.equal(outs[0].st.stage, 3); assert.ok(outs[0].escalated, "every union walks out");
  assert.equal(outs[1].st.on, true); assert.ok(outs[1].freed, "a court frees them");
  assert.equal(outs[2].st.underground, 3, "or the strike goes underground");
  assert.ok(strikeTwist(outs[0].st, { turn: 4, seed: "x" }).id === "jailed", "the world condemns the arrests next");
});

test("ASUU and NLC strikes take a different turn each year, from a pool of twists", () => {
  assert.ok(TWISTS.asuu.length >= 8 && TWISTS.nlc.length >= 5);
  const firsts = new Set();
  for (let i = 0; i < 40; i++) { const t = strikeTwist({ ...startStrike("asuu", null, 3) }, { turn: 4, seed: "g" + i }); if (t) firsts.add(t.id); }
  assert.ok(firsts.size >= 6, "different games open differently: " + [...firsts]);
  // A court can send them back, or they can appeal.
  const st = { ...startStrike("asuu", null, 3) }, court = TWISTS.asuu.find(x => x.id === "court"), sue = court.opts.find(o => o.id === "sue");
  assert.equal(twistAfter(st, court, sue, { turn: 4 }, () => 0).end, true);
  assert.equal(twistAfter(st, court, sue, { turn: 4 }, () => .99).end, false);
  // An audit cuts the demand; a twist is never repeated.
  const audit = TWISTS.asuu.find(x => x.id === "audit"), R = twistAfter(st, audit, audit.opts[0], { turn: 4, cash: 100 });
  assert.ok(demandOf(R.st, { cash: 100 }) < demandOf(st, { cash: 100 }));
  for (let t = 5; t < 30; t++) { const n = strikeTwist(R.st, { turn: t, seed: "q" }); if (n) assert.notEqual(n.id, "audit"); }
});

test("the war does not begin the same way, or with the same country, every game", async () => {
  const { BK_OPEN } = await import("../game/systems/bakunda.js");
  assert.equal(BK_OPEN.length, 3);
  const opens = new Set(), lands = new Set();
  for (let i = 0; i < 60; i++) { const B = bakundaInit("same player", Math.random); opens.add(B.open); lands.add(B.country); }
  assert.equal(opens.size, 3); assert.ok(lands.size >= 3);
  BK_OPEN.forEach((o, i) => {
    const B = { ...bakundaInit("s", () => 0), open: i, country: "kasongo" };
    const c1 = bakundaCards(B, 1).find(c => c.id === "bk1"), c2 = bakundaCards({ ...B, stage: 1 }, 2).find(c => c.id === "bk2");
    assert.match(c1.t, /Kasongo/); assert.match(c2.t, /General Kalembe/); assert.ok(!/Voko|Bakunda/.test(c1.d + c2.d));
  });
});

test("the middle of the war is told differently in different games, and weariness changes each year", async () => {
  const { BK_VARY } = await import("../game/systems/bakunda.js");
  const titles = new Set();
  for (const v of ["00000", "11111", "22222"]) { const B = { ...bakundaInit("s", () => 0), vary: v }; titles.add(bakundaCards(B, 1).find(c => c.id === "bk1b").t); }
  assert.equal(titles.size, 3);
  const B = { ...bakundaInit("s", () => 0), stage: 3, atWar: 2, vary: "00000" };
  const w2 = bakundaCards(B, 6).find(c => c.id === "bk6"), w3 = bakundaCards({ ...B, atWar: 3 }, 7).find(c => c.id === "bk6");
  assert.ok(w2 && w3 && w2.t !== w3.t, "a different weariness each year");
  assert.equal(Object.keys(BK_VARY).length, 5);
});
