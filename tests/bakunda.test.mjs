import { test } from "node:test";
import assert from "node:assert/strict";
import { bakundaInit, bakundaCards, bakundaAfter, bakundaLegacy, BAKUNDA_LEARN } from "../game/systems/bakunda.js";

const pick = (B, turn, id, ctx) => { const c = bakundaCards(B, turn, ctx)[0]; return bakundaAfter(B, c.opts.find(o => o.id === id)); };
test("seven phases over the term: warning, coup, the Axis and the Commander-in-Chief, summits, weariness, the treaty", () => {
  let B = bakundaInit("s1");
  assert.equal(bakundaCards(B, 1)[0].id, "bk1");
  B = pick(B, 1, "envoy"); assert.equal(B.warned, true);
  assert.equal(bakundaCards(B, 2)[0].id, "bk2");
  B = pick(B, 2, "airlift");
  const c3 = bakundaCards(B, 3)[0]; assert.equal(c3.id, "bk3"); assert.ok(c3.paper && /AXIS PACT/.test(c3.paper[0]));
  B = bakundaAfter(B, c3.opts.find(o => o.id === B.terrain)); assert.equal(B.progress, 40);
  const y4 = bakundaCards(B, 4).map(c => c.id); assert.deepEqual(y4, ["bk4", "bk6"]);
  B = bakundaAfter(B, bakundaCards(B, 4)[0].opts.find(o => o.id === "attend")); B = bakundaAfter(B, bakundaCards(B, 4).find(c => c.id === "bk6").opts.find(o => o.id === "offensive"));
  assert.ok(B.progress >= 70, String(B.progress));
  const peace = bakundaCards(B, 5, { nass: 60 }).find(c => c.id === "bk7");
  B = bakundaAfter(B, peace.opts.find(o => o.id === "senate")); assert.equal(B.treaty, "enacted"); assert.equal(B.done, true);
  assert.equal(bakundaCards(B, 6).length, 0);
  assert.match(bakundaLegacy(B), /peace accord/);
});
test("the wrong force for the ground is slower", () => {
  let B = { ...bakundaInit("s2"), stage: 2 }; const c = bakundaCards(B, 3)[0];
  const wrong = c.opts.find(o => ["army", "air", "navy"].includes(o.id) && o.id !== B.terrain);
  assert.equal(bakundaAfter(B, wrong).progress, 15);
});
test("ignoring the warning costs more when the coup comes", () => {
  const cold = bakundaCards({ ...bakundaInit("s3"), stage: 1, warned: false }, 2)[0], warm = bakundaCards({ ...bakundaInit("s3"), stage: 1, warned: true }, 2)[0];
  assert.ok(cold.spill > warm.spill);
});
test("a cool Senate stalls the treaty until you deal or go public", () => {
  let B = { ...bakundaInit("s4"), stage: 3, progress: 80, atWar: 2 };
  B = bakundaAfter(B, bakundaCards(B, 5, { nass: 20 }).find(c => c.id === "bk7").opts.find(o => o.id === "senate"));
  assert.equal(B.treaty, "stalled"); assert.equal(B.done, false);
  assert.equal(bakundaCards(B, 6)[0].id, "bk7b");
});
test("every card teaches the law behind it", () => {
  let B = bakundaInit("s5"); for (const t of [1, 2, 3]) { const c = bakundaCards(B, t)[0]; assert.ok(BAKUNDA_LEARN[c.learn], c.id); B = bakundaAfter(B, c.opts[0]); }
});
test("the wrong force stalls the war: each push counts for less, and the army chief says so", () => {
  const B = { ...bakundaInit("s6"), stage: 3, atWar: 1, progress: 20, washington: "went" };
  const wrongF = ["army", "air", "navy"].find(k => k !== B.terrain);
  const right = bakundaCards({ ...B, force: B.terrain }, 4).find(c => c.id === "bk6"), wrong = bakundaCards({ ...B, force: wrongF }, 4).find(c => c.id === "bk6");
  assert.equal(wrong.stall, true); assert.match(wrong.t.replace(/\u2060/g, ""), /stalling/);
  const gain = (c, f) => bakundaAfter({ ...B, force: f }, c.opts.find(o => o.id === "offensive")).progress - B.progress;
  assert.ok(gain(right, B.terrain) > gain(wrong, wrongF));
  assert.ok(wrong.opts.some(o => o.id === "switch") && !right.opts.some(o => o.id === "switch"));
});
test("Washington: the Oval Office meeting makes the front page and shortens the war", () => {
  const B = { ...bakundaInit("s7"), stage: 3, atWar: 1, progress: 30, summits: 1 };
  const c = bakundaCards(B, 5).find(x => x.id === "bk5"); const go = c.opts.find(o => o.id === "go");
  assert.match(go.paper[1], /Oval Office/); assert.equal(bakundaAfter(B, go).progress, 45);
});
