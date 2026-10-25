import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PRES_STORIES, FRONT_STORIES, AGENDA_IDS, agendaStory, storyStart, storyTurn, storyCard, storyAfter, storyCheck, pastOf } from "../game/systems/storylines.js";
import { nassCake } from "../game/systems/federal.js";
import { STATE_STORIES, placeText } from "../game/systems/statestories.js";
import { rulerMatter, rulerPick } from "../game/systems/rulers.js";

const ALL = [...Object.values(PRES_STORIES), ...Object.values(FRONT_STORIES), ...AGENDA_IDS.map(agendaStory), ...Object.values(STATE_STORIES)];
const T = (x) => String(x).replace(/\u2060/g, ""); // the presidency's invisible word guards
const seeded = (n) => { let x = n * 2654435761 % 4294967296 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };

test("every storyline is whole: each answer leads somewhere real, and every picture exists", () => {
  ALL.forEach(d => {
    assert.deepEqual(storyCheck(d), [], d.id);
    Object.values(d.beats).forEach(b => [b.who && "characters/" + b.who, b.bg && "backgrounds/" + b.bg, b.scene && "scenes/" + b.scene].filter(Boolean).forEach(a => assert.ok(fs.existsSync("public/art/" + a + ".webp"), d.id + ": " + a)));
  });
});

test("answers come as programmes, bills and executive orders", () => {
  Object.values(PRES_STORIES).forEach(d => {
    const kinds = new Set(Object.values(d.beats).flatMap(b => b.opts.map(o => o.kind)));
    ["programme", "bill", "order"].forEach(k => assert.ok(kinds.has(k), d.id + " has a " + k));
    assert.ok(Object.values(d.beats).filter(b => b.opts.some(o => o.kind === "bill") && b.opts.some(o => o.kind === "order")).length >= 4, d.id + ": several beats offer both a bill and an order");
  });
  AGENDA_IDS.forEach(a => Object.entries(agendaStory(a).beats).filter(([k]) => /^y/.test(k)).forEach(([k, b]) => assert.deepEqual(b.opts.map(o => o.kind).slice(0, 3), ["programme", "bill", "order"], a + " " + k)));
});

test("no card repeats in a term, whatever the player picks", () => {
  ALL.forEach(d => {
    for (let g = 0; g < 400; g++) {
      const r = seeded(g + 1); let S = storyStart(d, "t" + g); const seen = [];
      for (let t = 1; t <= 8; t++) {
        S = storyTurn(d, S, t, { house: 20 + (g % 7) * 12, nat: true }, r);
        const c = storyCard(d, S, { nat: true }); if (!c) break;
        assert.ok(!seen.includes(c.t), d.id + " repeated “" + c.t + "” after " + seen.join(" / "));
        seen.push(c.t);
        S = storyAfter(d, S, c.opts[Math.floor(r() * c.opts.length)], t, { nat: true }, r).S;
      }
    }
  });
});

test("the queues are back, and what you did decides what comes next", () => {
  const d = PRES_STORIES.fuel; let S = storyTurn(d, storyStart(d, "q", () => 0), 1, {}, () => .99);
  let c = storyCard(d, S, { nat: true }); assert.equal(T(c.t), "The queues are back");
  // Concession: Atlas and its terms. A subsidy: the bill doubles. An order: the cap, and maybe the court.
  const after = (oid) => { const R = storyAfter(d, S, c.opts.find(o => o.id === oid), 1, {}, () => .99); const k = storyCard(d, storyTurn(d, R.S, 2, { house: 90 }, () => .99), { nat: true }); return { t: T(k.t), d: T(k.d) }; };
  assert.equal(after("subsidy").t, "The subsidy bill has doubled");
  assert.match(after("subsidy").d, /^Last year you paid the subsidy/);
  assert.equal(after("cap").t, "Your price cap: half the stations shut");
  // A bill: passes with a friendly Assembly, stalls with a hostile one.
  const billed = storyAfter(d, S, c.opts.find(o => o.id === "dereg"), 1, {}, () => .5).S;
  assert.equal(T(storyCard(d, storyTurn(d, billed, 2, { house: 95 }, () => .1), {}).t), "Deregulation is law: prices find their level");
  const stuck = storyCard(d, storyTurn(d, billed, 2, { house: 5 }, () => .99), { nat: true }); assert.match(T(stuck.t), /is stuck in the National Assembly/);
  assert.deepEqual(stuck.opts.map(o => o.id), ["bargain", "public", "drop"]);
  // An order can be struck down by a court the next year.
  const ordered = storyAfter(d, S, c.opts.find(o => o.id === "cap"), 1, {}, () => .5).S;
  assert.match(T(storyCard(d, storyTurn(d, ordered, 2, {}, () => .1), {}).t), /A court is asked to strike down the Pump Price Order/);
});

test("three weak answers and it boils over: NUPENG parks the tankers", () => {
  const d = PRES_STORIES.fuel; let S = storyTurn(d, storyStart(d, "w", () => 0), 1, {}, () => .99);
  // Weak, weak, weak: each weak answer adds one, a good one takes one back.
  S = { ...S, weak: 2 }; S = storyAfter(d, S, storyCard(d, S, {}).opts.find(o => o.id === "blame"), 1, {}, () => .99).S;
  assert.equal(S.weak, 3);
  assert.equal(T(storyCard(d, storyTurn(d, { ...S, beat: "new_importers" }, 2, {}, () => .99), {}).t), "NUPENG parks the tankers");
  assert.equal(storyAfter(d, { ...S, weak: 2 }, d.beats.atlas.opts[1], 2, {}, () => .99).S.weak, 1);
  assert.equal(d.beats.nupeng.hook, "nupeng");
});

test("the insurgency answered by force splits: a new faction", () => {
  const d = PRES_STORIES.insurgency; let S = storyTurn(d, storyStart(d, "i", () => 0), 1, {}, () => .99);
  S = storyAfter(d, S, storyCard(d, S, {}).opts.find(o => o.id === "surge"), 1, {}, () => .99).S;
  assert.equal(T(storyCard(d, storyTurn(d, S, 2, {}, () => .99), {}).t), "A splinter group has formed");
});

test("the agenda changes every year, and corner-cutting comes back", () => {
  const d = agendaStory("infrastructure"); let S = storyTurn(d, storyStart(d, "a", () => 0), 1, {}, () => .99);
  assert.equal(storyCard(d, S, {}).t, "The land along the route");
  S = storyAfter(d, S, storyCard(d, S, {}).opts.find(o => o.id === "corners"), 1, {}, () => .99).S;
  const c2 = storyCard(d, storyTurn(d, S, 2, {}, () => .99), {});
  assert.equal(c2.t, "The cheap work shows"); assert.match(c2.d, /^Last year you paid the loudest claimants and started digging/);
  assert.equal(pastOf("Pay full compensation, verified and published"), "paid full compensation, verified and published");
});

test("the national cake remembers last year", () => {
  const titles = new Set([nassCake(600, []).title || "first"]);
  [["insert"], ["insert", "insert"], ["refuse"], ["refuse", "refuse"], ["half"], ["half", "half"]].forEach(h => { const K = nassCake(600, h); assert.ok(K.title && !titles.has(K.title), h.join(",")); titles.add(K.title); assert.equal(K.opts.length, 3); });
});

test("a ruler you promised comes back to collect", () => {
  const ruler = { id: "r1", name: "Oba Adeyemi", rel: 60, promise: { what: "a borehole", due: 3, times: 0 } };
  assert.equal(rulerPick({ rulers: [{ id: "r0", name: "X", rel: 70 }, ruler] }, 3), ruler);
  const M = rulerMatter(ruler, { turn: 3, lga: "Iseyin" }, () => .1);
  assert.equal(M.kind, "promise"); assert.match(M.brief, /Last year you promised a borehole/);
  const again = rulerMatter({ ...ruler, promise: { ...ruler.promise, times: 1 } }, { turn: 4, lga: "Iseyin" }, () => .1);
  assert.match(again.title, /run out of patience/);
});

test("a governor's crisis is a story in its LGA, not a one-off", () => {
  assert.equal(Object.keys(STATE_STORIES).length, 14);
  Object.values(STATE_STORIES).forEach(d => {
    const kinds = new Set(Object.values(d.beats).flatMap(b => b.opts.map(o => o.kind)));
    ["programme", "act"].forEach(k => assert.ok(kinds.has(k), d.id + " " + k));
    assert.ok(kinds.has("bill") || kinds.has("order"), d.id + " can be answered by law or order");
    assert.ok(Object.keys(d.beats).length >= 5, d.id);
  });
  const d = STATE_STORIES.flood; let S = storyTurn(d, storyStart(d, "f", () => 0), 2, {}, () => .99);
  const c1 = placeText(storyCard(d, S, {}), "Lokoja"); assert.equal(c1.t, "The river overflows: Lokoja under water");
  S = storyAfter(d, S, c1.opts.find(o => o.id === "relief"), 2, {}, () => .99).S;
  const c2 = placeText(storyCard(d, storyTurn(d, S, 3, {}, () => .99), {}), "Lokoja");
  assert.equal(c2.t, "Cholera in the flood camps"); assert.match(c2.d, /^Last year you set up relief camps and sent boats to Lokoja/);
});

test("a crisis does not open the same way in every game", () => {
  [...Object.values(PRES_STORIES), ...Object.values(FRONT_STORIES), ...Object.values(STATE_STORIES)].forEach(d => {
    assert.ok((d.starts || []).length >= 2, d.id + " has several openings");
    const opens = new Set(); for (let i = 0; i < 40; i++) opens.add(storyStart(d, "g", seeded(i + 3)).beat);
    assert.equal(opens.size, d.starts.length, d.id);
    const S = storyStart(d, "g", () => 0); assert.ok(d.starts.filter(b => b !== S.beat).every(b => S.seen.includes(b)), d.id + ": the other openings never come back mid-story");
  });
});
