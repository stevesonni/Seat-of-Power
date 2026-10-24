import { test } from "node:test";
import assert from "node:assert/strict";
import { rulerPick, rulerMatter, councilDrift, rulerZone } from "../game/systems/rulers.js";

const council = { rulers: [0, 1, 2, 3, 4, 5].map(i => ({ id: "trad_" + i, name: "Oba Ruler" + i, rel: 55, domain: "Central" })), dissolved: false };
test("the coldest ruler writes first; otherwise they take turns", () => {
  const c = { ...council, rulers: council.rulers.map((r, i) => i === 4 ? { ...r, rel: 20 } : r) };
  assert.equal(rulerPick(c, 2).id, "trad_4");
  assert.ok(rulerPick(council, 3));
  assert.equal(rulerPick({ ...council, dissolved: true }, 3), null);
});
test("every matter has options that move the ruler and his zone", () => {
  for (const [rel, ey] of [[20, false], [60, true], [30, true], [55, false]]) for (let t = 2; t < 8; t++) {
    const m = rulerMatter({ ...council.rulers[0], rel }, { turn: t, electionYear: ey, lga: "Ikenne" }, () => .4);
    assert.ok(m.title && m.brief && m.options.length >= 2, m.kind);
    m.options.forEach(o => { assert.ok(typeof o.rel === "number" && o.res.length === 3 && o.log, o.label); });
  }
  assert.equal(rulerMatter({ ...council.rulers[0], rel: 20 }, { turn: 3 }).kind, "criticism");
});
test("warm rulers lift their zone, cold ones pull it down", () => {
  const c = { rulers: [{ id: "trad_0", rel: 80 }, { id: "trad_1", rel: 20 }, { id: "trad_2", rel: 50 }] };
  const d = councilDrift(c);
  assert.equal(d[rulerZone(c.rulers[0], 0)], 1);
  assert.equal(d[rulerZone(c.rulers[1], 1)], -2);
});
