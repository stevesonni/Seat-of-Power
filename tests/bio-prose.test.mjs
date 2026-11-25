// The biography reads as history, not a log (owner's brief, 25 Nov 2026): no choice labels after colons, past tense,
// each fact once, the President's own words.
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
const base = (o = {}) => ({ name: "Ada Okafor", stateName: "Ondo", partyName: "People's Front Party", startYear: 2027, endYear: 2035, turn: 8, ended: true, exit: "", appH: [55, 60, 58], app: 61, cor: .3,
  election: { marginPct: 7, zonesWon: 3, opp: "Musa Bello", oppParty: "UCP" }, flag: { nm: "Roads to Prosperity", goal: "rebuild every trunk road" }, flagMilestones: [{ delivered: true }],
  debtStart: 14.5, debt: 0, debtTxt: "₦0", debtStartTxt: "₦14.5B", igrTxt: "₦6.0B", projects: { delivered: 0, building: 2, stalled: 0 }, needs: { met: 1, failed: 0, open: 0 }, ministries: 9, bills: 1, laws: [], programmes: [],
  events: [
    { turn: 3, section: "Governorship", txt: "Ended the ASUU strike: pay the whole revitalisation fund: ₦368.3B." },
    { turn: 4, section: "Controversies", txt: "Bandits have kidnapped three foreign engineers from the Mass Housing Estate: launch a military rescue. The rescue goes wrong: two engineers are killed in the crossfire. Beijing protests." },
    { turn: 1, section: "Governorship", txt: "Inherited ₦14.5B of debt from the previous administration and spread its repayment over 4 years." },
    { turn: 1, section: "Governorship", txt: "Inherited ₦14.5B of debt from the previous administration and spread its repayment over 4 years." },
  ], ...o });
const text = (B) => B.sections.map(S => S.h + ". ").join("") + [B.lead, ...B.sections.flatMap(S => [...(S.paras || []), ...(S.subs || []).flatMap(x => x.paras)])].flat().filter(x => typeof x === "string").join("");
test("biography: choices become outcomes, headlines become history, facts are told once", () => {
  const t = text(SYS.writeBio(base()));
  assert.ok(!/: pay\b|: launch\b/.test(t), "no choice label after a colon");
  assert.ok(/ended the ASUU strike by paying the whole revitalisation fund \(₦368\.3B\)/.test(t), t.match(/[^.]*ASUU[^.]*\./));
  assert.ok(/kidnapped three foreign engineers/.test(t) && !/have kidnapped/.test(t) && /went wrong/.test(t), "past tense");
  assert.equal((t.match(/inherited (a debt of )?₦14\.5B/gi) || []).length, 1, "the inherited debt is told once");
  assert.ok(!/one of its one/.test(t));
  assert.ok(/no capital project was finished/.test(t), "a met target beside no finished project is explained");
});
test("biography: the President's page uses the President's words", () => {
  const t = text(SYS.writeBio(base({ nat: true, stateName: "Nigeria", slogan: "Building Ondo Together", election: { marginPct: 5, zonesWon: 5, opp: "Musa Bello" } })));
  assert.ok(/presidential election/.test(t) && !/gubernatorial/.test(t));
  assert.ok(/carrying five of the six geopolitical zones/.test(t) && !/of the three/.test(t));
  assert.ok(/Presidents Nigeria has had/.test(t) && !/governors/i.test(t), (t.match(/[^.]*governors[^.]*\./i) || [""])[0]);
  assert.ok(!/Building Ondo Together/.test(t) && !/Nigeria, Nigeria/.test(t) && !/House of Assembly/.test(t));
});
test("prose: labels become actions", () => {
  assert.equal(SYS.byDoing("Pay the whole revitalisation fund: ₦368.3B"), "paying the whole revitalisation fund (₦368.3B)");
  assert.equal(SYS.didOf("Launch a military rescue"), "launched a military rescue");
  assert.equal(SYS.toPast("Bandits have kidnapped three engineers"), "Bandits kidnapped three engineers");
});
