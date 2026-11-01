import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as SYS from "../game/systems/index.js";

test("front door: three decisions with an outcome and a 'what happens next', a ribbon, then the campaign", () => {
  assert.equal(SYS.PROLOGUE.length, 3);
  SYS.PROLOGUE.forEach(st => { assert.ok(st.title && st.d && st.opts.length === 3);
    st.opts.forEach(o => { assert.ok(o.out && /^Next: /.test(o.next), st.id + "/" + o.id); assert.ok(o.l.split(/\s+/).length <= 8, "short label: " + o.l); }); });
  assert.match(SYS.PROLOGUE[0].alert, /FAAC/);
  const sc = SYS.prologueScore([{ step: "pay", opt: "workers" }, { step: "well", opt: "fix" }, { step: "leak", opt: "audit" }]);
  assert.equal(sc.app, 7); assert.equal(sc.cash, .56);
  assert.ok(SYS.PROLOGUE_RIBBON.l && SYS.PROLOGUE_FLASH.go);
});

test("front door: each number on a result card is explained once", () => {
  const h = SYS.rowHelp("Approval"); assert.match(h.text, /people back you/);
  assert.equal(SYS.rowHelp("Approval", [h.key]), null, "not twice");
  assert.ok(SYS.rowHelp("Bank") && SYS.rowHelp("Debt") && SYS.rowHelp("Corruption"));
  assert.equal(SYS.rowHelp("Something else"), null);
  ["Set up your government", "Pass this year's budget", "Take the budget to the House", "Sign programmes and orders", "Review the year", "mail"].forEach(k => assert.ok(SYS.HINTS[k], k));
  assert.deepEqual(Object.keys(SYS.TAB_HINT), ["desk", "map", "people"]);
  assert.ok(SYS.firstYearCushion(20) >= 1);
});

test("never wait: three quick wins a year, never the same one twice; a project opens at half way; site events", () => {
  const a = SYS.quickWinsFor(9, 2); assert.equal(a.length, 3); assert.equal(new Set(a.map(q => q.id)).size, 3);
  const b = SYS.quickWinsFor(9, 3, a.map(q => q.id)); b.forEach(q => assert.ok(!a.some(x => x.id === q.id)));
  SYS.QUICK_WINS.forEach(q => assert.ok(q.cost > 0 && q.cost < 1 && q.fx.app > 0));
  assert.ok(SYS.stageOpening({ id: "p", progress: 55, status: "in_progress" }));
  assert.ok(!SYS.stageOpening({ id: "p", progress: 55, status: "in_progress" }, { p: 2 }), "once");
  assert.ok(!SYS.stageOpening({ id: "p", progress: 30 })); assert.ok(!SYS.stageOpening({ id: "p", progress: 100 }));
  assert.match(SYS.stageLine({ type: "road", title: "Ring Road" }), /first section opens/);
  let seen = 0; for (let t = 1; t < 40; t++) { const e = SYS.siteEventFor(4, t, [{ id: "p1", title: "Ring Road", status: "in_progress" }]); if (e) { seen++; assert.equal(e.pid, "p1"); assert.ok(e.opts.length >= 2); } }
  assert.ok(seen > 5);
  assert.equal(SYS.siteEventFor(4, 2, [{ id: "p1", status: "stalled" }]), null, "no events where nothing is being built");
});

test("money as an enemy: leaks, plugs, and plugs that wear out without upkeep", () => {
  const L0 = SYS.leakOf({}, 20); assert.equal(L0.pct, 10); assert.equal(L0.parts.length, 4);
  const P = { payroll: { str: 1, since: 2 } }, L1 = SYS.leakOf(P, 20);
  assert.ok(L1.total < L0.total && L1.parts.find(x => x.id === "payroll").b === 0);
  const aged = SYS.plugsAge(P, []); assert.ok(Math.abs(aged.payroll.str - .67) < .01, "a third gone without upkeep");
  assert.equal(SYS.plugsAge(P, ["payroll"]).payroll.str, 1, "kept up");
  const gone = SYS.plugsAge(SYS.plugsAge(SYS.plugsAge(P))); assert.equal(gone.payroll.str, 0, "worn out in three years");
  assert.equal(SYS.upkeepOf(P), SYS.LEAKS.payroll.upkeep); assert.equal(SYS.upkeepOf(gone), 0);
  assert.equal(SYS.worstLeak({}, 20).id, "payroll");
});

test("integrity: four kinds of commissioner, stable per game; whistleblowers mostly point at hustlers", () => {
  assert.deepEqual(Object.keys(SYS.ARCHETYPES), ["tech", "loyal", "hustler", "crusader"]);
  assert.equal(SYS.archetypeOf("Hon. A", 5), SYS.archetypeOf("Hon. A", 5));
  const ms = Array.from({ length: 12 }, (_, i) => ({ id: "m" + i, name: "Ministry " + i, minister: "Hon. Person " + i }));
  const kinds = new Set(ms.map(m => SYS.archetypeOf(m.minister, 7))); assert.ok(kinds.size >= 3);
  let hit = 0, n = 0; for (let t = 2; t < 60; t++) { const w = SYS.whistleFor(7, t, ms); if (w) { n++; if (w.truth) hit++; assert.ok(w.amt > 0 && w.ministry); } }
  assert.ok(n > 10 && hit / n > .5, "most tips are true (" + hit + "/" + n + ")");
  assert.equal(SYS.whistleFor(7, 1, ms), null, "not in the first year");
  assert.equal(SYS.whistleFor(7, 5, ms, Object.fromEntries(ms.map(m => [m.id, "cleared"]))), null, "a handled ministry is not tipped again");
});

test("your own plan: ambitions are judged, the rival moves in even half-years, pilots and combos", () => {
  assert.equal(Object.keys(SYS.AMBITIONS).length, 4);
  assert.equal(SYS.ambitionMet({ ambition: "honest", cor: .1 }), true); assert.equal(SYS.ambitionMet({ ambition: "honest", cor: .3 }), false); assert.equal(SYS.ambitionMet({}), null);
  assert.equal(SYS.rivalMoveFor(3, 1), null); assert.ok(SYS.rivalMoveFor(3, 2));
  assert.equal(SYS.rivalMoveFor(3, 2, SYS.RIVAL_MOVES.map(m => "rival_" + m.id)), null, "each move once");
  SYS.RIVAL_MOVES.forEach(m => { assert.ok(fs.existsSync("public/art/backgrounds/" + m.bg + ".webp"), m.bg); assert.ok(fs.existsSync("public/art/characters/" + m.who + ".webp"), m.who);
    m.opts.forEach(o => Object.keys(o.fx || {}).forEach(k => assert.ok(["people", "gov", "council", "cor"].includes(k), k))); });
  const r = new Set(); for (let t = 1; t < 50; t++) r.add(SYS.pilotResult(1, "school_feed", t)); assert.deepEqual([...r].sort(), ["weak", "works"]);
  assert.equal(SYS.comboFor("farm_sub", ["school_feed"]).nm, "Home-grown school feeding");
  assert.equal(SYS.comboFor("farm_sub", []), null);
  assert.ok(SYS.comboPartner("farm_sub").length === 2);
});

test("regional influence: the neighbour race and the trade war both end", () => {
  for (let t = 2; t < 6; t++) { const c = SYS.rivalryFor(1, t); assert.ok(c); c.opts.forEach(o => assert.ok(["win", "lose", "draw"].includes(SYS.rivalryRoll(1, t, o)))); }
  assert.equal(SYS.rivalryFor(1, 1), null);
  const T = SYS.TRADE_WAR; Object.entries(T).forEach(([k, st]) => st.opts.forEach(o => assert.ok(o.end || T[o.next], k + "/" + o.id)));
  // From the opening, every path ends within three steps.
  const walk = (k, d) => { assert.ok(d < 4, "ends: " + k); T[k].opts.forEach(o => { if (!o.end) walk(o.next, d + 1); }); }; walk("open", 0);
  assert.ok(!/Benin|Cameroon|Chad|Niger\b|Ghana/.test(JSON.stringify(T)), "the neighbour is fictional");
});

test("end-of-term cards: a WAEC report card and a challenge link that opens the same state", () => {
  assert.equal(SYS.WAEC(.8), "A1"); assert.equal(SYS.WAEC(.2), "F9");
  assert.equal(SYS.reportCard({ lit: .5, hp: .5, infra: .5, sec: .5, agr: .5, cor: .3, app: 60 }).length, 7);
  const l = SYS.challengeLink("https://seatofpower.online", "Cross_River", 123456); assert.match(l, /\?ch=Cross_River-123456$/);
  assert.deepEqual(SYS.parseChallenge("Cross_River-123456"), { state: "Cross_River", seed: 123456 });
  assert.equal(SYS.parseChallenge("nonsense"), null);
});

test("languages: every phrase in Pidgin, Yoruba, Hausa and Igbo, English when missing, exact matches only", () => {
  assert.deepEqual(SYS.LANG_IDS, ["en", "pcm", "yo", "ha", "ig"]);
  Object.entries(SYS.STRINGS).forEach(([en, t]) => ["pcm", "yo", "ha", "ig"].forEach(l => assert.ok(t[l] && t[l].length > 0, l + ": " + en)));
  assert.equal(SYS.T("Desk", "yo"), "Tábìlì"); assert.equal(SYS.T("Desk", "en"), "Desk"); assert.equal(SYS.T("Not in the table", "ha"), "Not in the table");
  assert.equal(SYS.translateExact("  Approval ", "ig"), "  Nkwado "); assert.equal(SYS.translateExact("Approval rating", "ig"), null);
  assert.equal(SYS.langOf("xx"), "en");
  // The cold open and the hints are all in the table.
  SYS.PROLOGUE.forEach(st => [st.title, st.d, ...st.opts.flatMap(o => [o.l, o.out, o.next])].forEach(x => assert.ok(SYS.STRINGS[x], "translated: " + x)));
  Object.values(SYS.HINTS).forEach(h => assert.ok(SYS.STRINGS[h], "hint translated: " + h));
  Object.values(SYS.TAB_HINT).forEach(h => assert.ok(SYS.STRINGS[h]));
});
