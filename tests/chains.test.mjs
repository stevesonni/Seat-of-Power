import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../game/systems/chains.js";

test("Plateau: farmers' loans → a bumper harvest letter → a Portuguese tomato plant", () => {
  const [pay, inv] = C.programmeChain({ id: "f_anchor", nm: "Farmers' loans against the harvest", place: "Plateau", zone: "NC", needKind: "farm", nat: true, turn: 3 });
  assert.equal(pay.due, 3); assert.equal(inv.due, 4);
  assert.match(pay.line, /bumper harvest of tomatoes in Plateau/); assert.match(pay.from, /Minister of Agriculture/);
  assert.equal(inv.country, "Portugal"); assert.match(inv.what, /tomato processing plant/); assert.match(inv.line, /Plateau/);
  const yes = C.investorAnswer(inv, true), no = C.investorAnswer(inv, false);
  assert.ok(yes.ok && yes.jobs > 0 && yes.paper[2]); assert.ok(!no.ok && no.jobs === 0);
});
test("a programme that worked in a place runs again only somewhere else", () => {
  const done = { f_anchor: ["Plateau"] };
  assert.equal(C.canRunAgain(done, "f_anchor", "Plateau"), false); assert.equal(C.canRunAgain(done, "f_anchor", "Benue"), true);
});
test("every kind of need has a payoff and an investor; a governor hears from a Commissioner", () => {
  for (const k of ["farm", "clinic", "school", "water", "power", "security", "road", "traffic", "housing", "land", "youth", "jobs", "poverty", "digital"]) {
    const [p, i] = C.programmeChain({ id: "x", nm: "X", place: "Jos North", zone: "NC", needKind: k, turn: 2 });
    assert.ok(p.line.includes("Jos North") && /Commissioner/.test(p.from), k); assert.ok(i.firm && i.jobs > 0, k);
  }
});
test("halfway on big works: armed groups, and three ways to answer", () => {
  const S = C.siteCrisis({ nm: "⭐ The Coastal Highway", place: "Bayelsa", zone: "SS", nat: true });
  assert.match(S.title, /militants/); assert.equal(S.opts.length, 3);
  assert.ok(S.opts.find(o => o.id === "clear").resume && S.opts.find(o => o.id === "pay").paid && !S.opts.find(o => o.id === "wait").resume);
  assert.ok(C.siteCrisisRisk({ sec: .3 }) > C.siteCrisisRisk({ sec: .7 })); assert.ok(C.siteCrisisRisk({ sec: .5, paidBefore: true }) > C.siteCrisisRisk({ sec: .5 }), "pay once, and they come back");
});
test("ease of doing business: trade letter, then the court; the appeal turns on clean hands", () => {
  const [t, c] = C.orderChain({ id: "f_eo_business", nat: true, turn: 2 });
  assert.equal(t.due, 3); assert.equal(c.due, 4); assert.match(t.from, /Minister/);
  assert.equal(C.appealGranted(.3), true); assert.equal(C.appealGranted(.6), false);
});
test("the Electoral Act cleans up elections", () => {
  const a = C.electoralEffects(true), b = C.electoralEffects(false);
  assert.ok(a.oppPush < b.oppPush && a.petition < b.petition && a.noRig && !b.noRig);
});

test("a new university: the matriculation letter, then a research investor", () => {
  assert.deepEqual(C.UNI_IDS, ["f_fed_university", "new_uni"]);
  const [pay, inv] = C.programmeChain({ id: "f_fed_university", nm: "⭐ Establish a new federal university", place: "Ebonyi", zone: "SE", needKind: "uni", sector: "education", nat: true, turn: 5 });
  assert.match(pay.line, /matriculated at the new university in Ebonyi/); assert.equal(pay.from, "Minister of Education");
  assert.match(inv.title, /Maplecrest Biosciences wants to build in Ebonyi/);
  const gov = C.programmeChain({ id: "new_uni", nm: "⭐ Establish a new state university", place: "Ikwo", zone: "SE", needKind: "uni", sector: "education", nat: false, turn: 5 })[0];
  assert.equal(gov.from, "Commissioner for Education");
});

test("the polytechnic conversion bill: a letter from where it became a university", () => {
  const b = C.polyUniChain({ place: "Kogi", nat: true, turn: 4 });
  assert.equal(b.kind, "payoff"); assert.equal(b.due, 4); assert.match(b.title, /polytechnic in Kogi is a university/); assert.match(b.line, /HND/);
});

test("every zone has its own trouble on the site, and risky answers can go wrong", () => {
  const T = (z) => C.siteCrisis({ nm: "⭐ The Coastal Highway", place: "X", zone: z, nat: true });
  assert.match(T("NW").title, /kidnapped three foreign engineers/); assert.ok(T("NW").opts.some(o => o.id === "local" && o.delay === 2));
  assert.match(T("NE").title, /Insurgents/); assert.match(T("NC").title, /herders/);
  assert.match(T("SE").d, /sit-at-home/); assert.ok(T("SE").opts.some(o => /never on Mondays/.test(o.l)));
  assert.match(T("SS").title, /Ex-militants/); assert.ok(T("SS").opts.some(o => /surveillance contracts/.test(o.l)));
  assert.match(T("SW").title, /Omo onile/); assert.ok(T("SW").opts.some(o => /deve/.test(o.l)));
  assert.ok(!/the The /.test(T("SS").title), "no doubled article");
  const rescue = T("NW").opts.find(o => o.id === "clear");
  assert.ok(C.crisisOutcome(rescue, () => 0).failed); assert.match(C.crisisOutcome(rescue, () => 0).line, /killed/);
  assert.ok(!C.crisisOutcome(rescue, () => .99).failed);
  assert.ok(C.siteCrisis({ nm: "⭐ A second bridge over the Niger", place: "X", zone: "SE", nat: false }).opts.every(o => !o.cost || o.cost < 2), "a governor's costs are smaller");
});

test("starting a big programme: the legislature, the cabal and the palace each have a say", () => {
  const all = C.startBeats({ id: "f_anchor", nm: "⭐ Farm corridors", place: "Kano", zone: "NW", sector: "agriculture", nat: true, turn: 2, houseRatio: .4, blessed: false });
  assert.deepEqual(all.map(b => b.kind).sort(), ["cabal", "nass", "palace"]); assert.ok(all.every(b => b.due === 3));
  const calm = C.startBeats({ id: "f_coastal", nm: "⭐ The Coastal Highway", place: "Bayelsa", zone: "SS", sector: "infrastructure", nat: true, turn: 2, houseRatio: .7 });
  assert.deepEqual(calm.map(b => b.kind), ["cabal"]);
  assert.ok(!C.startBeats({ id: "x", nm: "⭐ X", place: "Kano", zone: "NW", sector: "agriculture", turn: 2, houseRatio: .7, blessed: true }).some(b => b.kind === "palace"), "the palace's blessing opens the land");
  assert.ok(C.japaRisk({ cor: .6, soleSource: true }) > C.japaRisk({ cor: .2 }));
});
