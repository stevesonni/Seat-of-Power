import { test } from "node:test";
import assert from "node:assert/strict";
import { ECON_ISSUES, econInit, econPick, econChoose, econDue, econRecall, econIssue } from "../game/systems/econbrief.js";
import { tradeInit } from "../game/systems/trade.js";

// The Special Adviser's yearly economic letter: never the same question twice, every answer acts, most come back.
const nat = (over = {}) => ({ T: { ...tradeInit("targeted"), ...(over.T || {}) }, stance: "targeted", cash: 5, debt: 20, app: 50, cor: .3, turn: 1, ...over });
const gov = (over = {}) => ({ igr: 2, faac: 6, cash: 4, debt: 10, arrears: 0, app: 50, cor: .3, turn: 1, exportsOn: true, crop: "cocoa", stName: "Ogun", ...over });
const play = (nat0, ctxOf) => { let E = econInit(); const seen = []; let s = 1;
  for (let t = 1; t <= 8; t++) { const r = () => (s = (s * 16807) % 2147483647) / 2147483647; const id = econPick(E, ctxOf(t), nat0, r); if (!id) break; seen.push(id);
    const iss = econIssue(id, nat0), real = iss.opts.filter(o => !o.act && o.id !== "wait"); E = econChoose(E, id, real[t % real.length].id, t, nat0).E; E = econDue(E, t + 1).E; }
  return seen; };
test("a full eight years: a different question every year, for both offices", () => {
  const P = play(true, (t) => nat({ turn: t, T: { food: 100 + t * 3, reserves: 33 - t * 2 } }));
  assert.equal(P.length, 8); assert.equal(new Set(P).size, 8, P.join(","));
  const G = play(false, (t) => gov({ turn: t }));
  assert.equal(G.length, 8); assert.equal(new Set(G).size, 8, G.join(","));
});
test("the figures choose the question: high food prices first; no trade policy means the council first", () => {
  assert.equal(econPick(econInit(), nat({ T: { food: 125 } }), true, () => 0), "food");
  assert.equal(econPick(econInit(), nat({ stance: null }), true, () => 0), "eac");
  assert.equal(econPick(econInit(), gov({ exportsOn: false }), false, () => 0), "econ");
  // Until the council sits, the letter asks again.
  const E = econChoose(econInit(), "eac", "convene", 1, true).E;
  assert.equal(econPick(E, nat({ stance: null, turn: 2 }), true, () => 0), "eac");
  assert.notEqual(econPick(E, nat({ turn: 2 }), true, () => 0), "eac");
});
test("an answer lands next year, and the next letter recalls it", () => {
  let E = econChoose(econInit(), "food", "dryseason", 3, true).E;
  assert.equal(econDue(E, 3).due.length, 0, "not the same year");
  const D = econDue(E, 4); E = D.E;
  assert.equal(D.due.length, 1); assert.equal(D.due[0].tr.food, -8);
  assert.match(econRecall(E, 4, D.due), /^Last year you funded dry-season farming\. The dry-season harvest is in/);
  assert.equal(econDue(E, 5).due.length, 0, "only once");
});
test("every option is real: it acts now or later, and says what you did", () => {
  [...ECON_ISSUES.nat, ...ECON_ISSUES.gov].forEach(i => { assert.ok(i.opts.length >= 2, i.id);
    i.opts.forEach(o => { assert.ok(o.past, i.id + "/" + o.id + " has a past");
      const acts = o.act || Object.values(o.fx || {}).some(v => v) || Object.keys(o.tr || {}).length || o.later;
      assert.ok(acts, i.id + "/" + o.id + " changes something"); }); });
});
