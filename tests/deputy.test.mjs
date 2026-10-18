import { test } from "node:test";
import assert from "node:assert/strict";
import { genDeputies, balanceRisk, campaignEffects, PARTY_REACTION, PARTY_ACCEPTED, deputyYear } from "../game/systems/deputy.js";
const names = ["Ada Okoro", "Bola Ige", "Chika Obi", "Dayo Ade"];
const deps = (pd = 2, st = "Edo") => genDeputies({ stateId: st, playerDistrict: pd, names });

test("four candidates, one of each kind, one of them the party's choice", () => {
  const d = deps(); assert.equal(new Set(d.map(x => x.kind)).size, 4); assert.equal(d.filter(x => x.partyFav).length, 1);
});
test("no candidate is best at everything", () => {
  for (const st of ["Edo", "Kano", "Lagos", "Ogun", "Benue"]) for (const pd of [0, 1, 2]) {
    const d = deps(pd, st);
    for (const c of d) assert.ok(!d.every(o => o === c || (c.co >= o.co && c.pu >= o.pu && c.lo >= o.lo && c.hidden <= o.hidden)), st + " " + c.kind + " dominates");
  }
});
test("at least one candidate shares the governor's district, at least two do not", () => {
  for (const pd of [0, 1, 2]) { const d = deps(pd); assert.ok(d.some(c => c.district === pd)); assert.ok(d.filter(c => c.district !== pd).length >= 2); }
});
test("Edo South governor with an Edo South deputy: warned, allowed, costs the other districts", () => {
  const d = deps(2, "Edo"), same = d.find(c => c.district === 2);
  const r = balanceRisk(2, same); assert.ok(r.same); assert.match(r.text, /allowed/);
  const fx = campaignEffects(2, same, null); assert.ok(fx[0] < 0 && fx[1] < 0);
});
test("rejecting the party's choice is a negotiation, not one fixed deduction", () => {
  const vals = PARTY_REACTION.map(o => o.pStab); assert.equal(new Set(vals).size, PARTY_REACTION.length);
  assert.ok(PARTY_REACTION.every(o => o.note.length > 20)); assert.ok(PARTY_ACCEPTED.pStab >= Math.max(...vals));
  assert.ok(PARTY_REACTION.some(o => o.mandate) && PARTY_REACTION.some(o => o.promise));
});
test("known facts, allegations and hidden traits are separate", () => {
  const m = deps().find(c => c.kind === "mobiliser"); assert.ok(m.known.length && m.allegation && typeof m.hidden === "number");
});
test("in office: the demand comes in Year 2; later surprises are seeded, not scripted", () => {
  const m = deps().find(c => c.kind === "mobiliser");
  assert.equal(deputyYear(m, 2).type, "demand");
  assert.deepEqual(deputyYear(m, 3), deputyYear(m, 3)); // same on reload
  const scandals = [];
  for (const n of ["A B", "C D", "E F", "G H", "I J", "K L", "M N", "O P", "Q R", "S T", "U V", "W X"]) for (let y = 3; y <= 8; y++) { const e = deputyYear({ ...m, nm: n }, y); if (e && e.type === "scandal") scandals.push(n + y); }
  assert.ok(scandals.length > 0 && scandals.length < 12 * 6 / 2, "scandals: " + scandals.length);
});
