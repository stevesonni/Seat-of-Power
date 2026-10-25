import { test } from "node:test";
import assert from "node:assert/strict";
import { bakundaInit, bakundaCards, bakundaAfter, bakundaLegacy, BAKUNDA_LEARN, BAKUNDA_MISSIONS, BAKUNDA_FORCES, BAKUNDA_DIPLOMACY } from "../game/systems/bakunda.js";
import { TRIP_LETTERS } from "../game/systems/trips.js";

const card = (B, turn, id, ctx) => bakundaCards(B, turn, ctx).find(c => c.id === id || c.id.startsWith(id));
const pick = (B, c, oid) => bakundaAfter(B, c.opts.find(o => o.id === oid));

test("the iCivics way: news, the coup, the Assembly's resolution, missions, diplomacy, surrender, the treaty", () => {
  let B = bakundaInit("s1");
  const c1 = card(B, 1, "bk1"); assert.equal(c1.kind, "letter"); assert.ok(c1.alarm && TRIP_LETTERS[c1.letter]);
  B = pick(B, c1, "envoy"); assert.equal(B.warned, true);
  B = pick(B, card(B, 2, "bk2"), "airlift");
  const c3 = card(B, 3, "bk3"); assert.equal(c3.kind, "document"); assert.match(c3.d, /5\(4\)\(a\)/);
  B = pick(B, c3, "assent"); assert.equal(B.atWar, 1); assert.equal(B.resolution, "passed");
  // Year 4: two missions from Defence Headquarters, a diplomacy letter and the army chief's tip.
  let y = bakundaCards({ ...B, dipl: [] }, 4);
  assert.equal(y.filter(c => c.kind === "mission").length, 2);
  assert.ok(y.some(c => c.id.startsWith("bkd_") && c.kind === "letter"));
  assert.ok(y.some(c => c.kind === "tip"));
  for (let turn = 4; turn <= 8 && B.progress < 100; turn++) {
    for (const c of bakundaCards(B, turn)) {
      if (c.kind === "mission") B = pick(B, c, c.need);
      else if (c.id.startsWith("bkd_")) B = pick(B, c, "go");
      else if (c.kind === "tip") B = bakundaAfter(B, c);
      else if (c.id === "bk6") B = pick(B, c, "address");
    }
  }
  assert.ok(B.progress >= 100, String(B.progress));
  const s = card(B, 7, "bk7"); assert.equal(TRIP_LETTERS[s.letter].where, "Geneva, Switzerland");
  B = pick(B, s, "go"); assert.equal(B.stage, 4);
  const t = card(B, 7, "bk8", { nass: 60 }); assert.equal(t.kind, "document");
  B = pick(B, t, "senate"); assert.equal(B.done, true);
  assert.equal(bakundaCards(B, 8).length, 0);
  assert.match(bakundaLegacy(B), /peace treaty/);
});
test("each mission names its ground, and only the right service wins the front page", () => {
  BAKUNDA_MISSIONS.forEach(m => assert.ok(BAKUNDA_FORCES[m.need], m.id));
  const B = { ...bakundaInit("s2"), stage: 3, atWar: 1 };
  const m = bakundaCards(B, 4).find(c => c.kind === "mission");
  const right = m.opts.find(o => o.id === m.need), wrong = m.opts.find(o => ["army", "navy", "air"].includes(o.id) && o.id !== m.need), stay = m.opts.find(o => o.id === "stay");
  assert.ok(bakundaAfter(B, right).progress > bakundaAfter(B, wrong).progress);
  assert.equal(right.paper[2], true); assert.equal(wrong.paper[2], false); assert.equal(stay.paper[0], "NIGERIA STANDS ASIDE");
  assert.ok(m.opts.every(o => o.id === "stay" || o.note), "every service comes with the army chief's advice");
});
test("veto the war: diplomacy alone, slower but possible", () => {
  let B = { ...bakundaInit("s3"), stage: 2 };
  B = pick(B, card(B, 3, "bk3"), "veto"); assert.equal(B.atWar, 0);
  assert.equal(bakundaCards(B, 4).filter(c => c.kind === "mission").length, 0);
  const d = bakundaCards(B, 4).find(c => c.id.startsWith("bkd_"));
  assert.ok(bakundaAfter(B, d.opts.find(o => o.id === "go")).progress > bakundaAfter(B, d.opts.find(o => o.id === "send")).progress);
  assert.match(bakundaLegacy({ ...B, stage: 3 }), /sanctions and diplomacy/);
});
test("ignoring the warning costs more when the coup comes", () => {
  const cold = bakundaCards({ ...bakundaInit("s4"), stage: 1, warned: false }, 2)[0], warm = bakundaCards({ ...bakundaInit("s4"), stage: 1, warned: true }, 2)[0];
  assert.ok(cold.spill > warm.spill);
});
test("a cool Senate stalls the treaty until you deal or go public", () => {
  let B = { ...bakundaInit("s5"), stage: 4 };
  B = pick(B, card(B, 6, "bk8", { nass: 20 }), "senate");
  assert.equal(B.treaty, "stalled"); assert.equal(B.done, false);
  assert.equal(bakundaCards(B, 6)[0].id, "bk7b");
});
test("every card teaches the law behind it, and every diplomacy letter exists", () => {
  let B = bakundaInit("s6"); for (const t of [1, 2, 3]) { const c = bakundaCards(B, t)[0]; assert.ok(BAKUNDA_LEARN[c.learn], c.id); B = bakundaAfter(B, c.opts[0]); }
  BAKUNDA_DIPLOMACY.forEach(d => assert.ok(TRIP_LETTERS[d.letter], d.id));
  BAKUNDA_DIPLOMACY.forEach(d => assert.ok(!/Abuja/.test(TRIP_LETTERS[d.letter].where), d.id + " is abroad, so going in person flies the jet"));
});
test("Washington: going in person makes the Oval Office front page", () => {
  const B = { ...bakundaInit("s7"), stage: 3, atWar: 1, progress: 30, dipl: ["ecowas", "chad", "london", "geneva"], sits: [] };
  assert.ok(true);
  const c = bakundaCards(B, 5).find(x => x.id === "bkd_washington"); const go = c.opts.find(o => o.id === "go");
  assert.match(go.paper[1], /Oval Office/); assert.equal(bakundaAfter(B, go).washington, "went");
});
test("old saves (the earlier storyline) still play", () => {
  const old = { stage: 3, warned: true, terrain: "air", force: "air", progress: 40, atWar: 1, summits: 1, senate: null, treaty: null, done: false, washington: null };
  assert.ok(bakundaCards(old, 5).length > 0);
});
test("every Bakunda decision makes the front page", () => {
  const states = [[bakundaInit("p"), 1], [{ ...bakundaInit("p"), stage: 1 }, 2], [{ ...bakundaInit("p"), stage: 2 }, 3], [{ ...bakundaInit("p"), stage: 3, atWar: 2 }, 5], [{ ...bakundaInit("p"), stage: 3, progress: 100 }, 6], [{ ...bakundaInit("p"), stage: 4 }, 7], [{ ...bakundaInit("p"), stage: 4, treaty: "stalled" }, 7]];
  for (const [B, t] of states) for (const c of bakundaCards(B, t, { nass: 20 })) for (const o of c.opts || []) assert.ok(o.paper && o.paper[0], c.id + " / " + o.id);
});

test("the weight of command: two decisions and one trip every year until it is resolved", () => {
  for (const veto of [false, true]) {
    let B = bakundaInit(veto ? "w2" : "w1"), turn = 1;
    for (; turn <= 8 && !B.done; turn++) {
      const cs = bakundaCards(B, turn, { nass: 60 }).filter(c => c.kind !== "tip"), trips = cs.filter(c => c.id.startsWith("bkd_") || c.id === "bk7"), dec = cs.filter(c => !trips.includes(c));
      assert.ok(trips.length <= 1, "one trip at most, year " + turn);
      if (B.stage < 3 || (B.stage === 3 && B.progress < 100)) { assert.equal(dec.length, 2, (veto ? "veto" : "war") + " year " + turn + ": " + cs.map(c => c.id)); assert.equal(trips.length, turn <= 5 ? 1 : trips.length); }
      if (cs.length) assert.ok(cs.some(c => c.alarm), "the army chief raises it first, year " + turn);
      cs.forEach(c => { if (c.kind !== "mission" && c.kind !== "letter" && c.id !== "bk3") assert.ok(c.advice, "his advice: " + c.id); });
      for (const c of bakundaCards(B, turn, { nass: 60 })) {
        if (c.kind === "tip") B = bakundaAfter(B, c);
        else if (c.kind === "mission") B = pick(B, c, c.need);
        else if (c.id === "bk3") B = pick(B, c, veto ? "veto" : "assent");
        else B = bakundaAfter(B, c.opts[0]);
      }
    }
    assert.ok(B.done, (veto ? "veto" : "war") + " is resolved within the two terms");
    assert.ok(turn >= 7, "a war that lasts long enough to feel");
  }
});
test("the Special Boat Service: the Navy's commandos have their own missions", () => {
  assert.ok(BAKUNDA_FORCES.sbs && BAKUNDA_MISSIONS.filter(m => m.need === "sbs").length >= 3);
  const m = bakundaCards({ ...bakundaInit("s"), stage: 3, atWar: 1, sits: BAKUNDA_MISSIONS.filter(x => x.need !== "sbs").map(x => x.id) }, 4).find(c => c.kind === "mission");
  assert.equal(m.need, "sbs"); assert.ok(m.opts.some(o => o.id === "sbs" && o.paper[2]));
});
test("veto the war and the National Assembly overrides you: a document stamped OVERRIDDEN", () => {
  let B = { ...bakundaInit("o1"), stage: 2 };
  B = pick(B, card(B, 3, "bk3"), "veto"); assert.equal(B.override, "pending");
  const o = card(B, 4, "bk3o"); assert.equal(o.kind, "document"); assert.equal(o.stamp, "OVERRIDDEN"); assert.ok(o.news && o.alarm && o.advice);
  assert.equal(bakundaCards(B, 4).filter(c => c.kind !== "tip" && !c.id.startsWith("bkd_")).length, 2, "the override and one more decision");
  o.opts.forEach(x => assert.ok(x.paper && x.paper[0], x.id));
  const war = pick(B, o, "comply"); assert.equal(war.atWar, 1); assert.equal(war.resolution, "overridden");
  assert.ok(bakundaCards(war, 5).some(c => c.kind === "mission"), "missions follow");
  const defy = pick(B, o, "defy"); assert.equal(defy.atWar, 0); assert.ok(!bakundaCards(defy, 5).some(c => c.id === "bk3o"), "the override comes once");
});
