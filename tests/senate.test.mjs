import { test } from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
import { seeded } from "../game/systems/rng.js";

const S0 = { home: 55, clout: 50, loyalty: 60, cor: .2, chest: 1, govParty: true, year: 1 };
test("every bill teaches something, and every learning key the career uses exists", () => {
  SYS.BILLS.forEach(b => assert.ok(b.learn && b.learn.length > 60, b.id));
  ["race", "sp", "vote", "override", "trade", "hearing", "fund", "defect", "recall"].forEach(k => assert.ok(SYS.LEARN[k], k));
  SYS.SENATE_EVENTS.forEach(e => assert.ok(SYS.LEARN[e.id], "event " + e.id + " has a note"));
});
test("each session has two different bills, and the budget in every second session", () => {
  for (let n = 1; n <= SYS.SESSIONS; n++) { const b = SYS.sessionBills("seed", n); assert.equal(b.length, 2); assert.notEqual(b[0].id, b[1].id); assert.equal(b[0].budget === true, n % 2 === 0, "session " + n); }
  assert.deepEqual(SYS.sessionBills("seed", 3).map(b => b.id), SYS.sessionBills("seed", 3).map(b => b.id), "seeded");
});
test("your district judges your vote; voting against the President costs a loyal senator", () => {
  const fuel = SYS.BILLS.find(b => b.id === "fuel");
  const yes = SYS.castVote(fuel, "yes", S0, seeded(1)), no = SYS.castVote(fuel, "no", S0, seeded(1));
  assert.ok(yes.fx.home < 0 && no.fx.home > 0);
  assert.ok(no.fx.loyalty < 0 && no.fx.clout < 0);
  assert.equal(yes.ayes + yes.noes, SYS.SENATE_SEATS);
});
test("trading a vote needs standing", () => {
  const b = SYS.BILLS.find(x => x.id === "tax");
  let got = 0; for (let i = 0; i < 50; i++) if (SYS.castVote(b, "trade", { ...S0, clout: 15 }, seeded("t", i)).project) got++;
  let gotHi = 0; for (let i = 0; i < 50; i++) if (SYS.castVote(b, "trade", { ...S0, clout: 70 }, seeded("t", i)).project) gotHi++;
  assert.equal(gotHi, 50); assert.ok(got < 25);
});
test("the constituency fund cannot be overspent; pocketing it adds money and corruption", () => {
  assert.equal(SYS.spendFund(["boreholes", "clinic", "road", "scholar"], false, seeded(2)).ok, false);
  const r = SYS.spendFund(["boreholes", "clinic"], true, seeded(3));
  assert.ok(r.ok && r.chest === .4 && r.cor > 0);
  assert.equal(SYS.spendFund(["road", "clinic", "boreholes"], false, seeded(4)).home, 14);
});
test("a disloyal senator loses the ticket unless they defected; corruption costs votes", () => {
  assert.equal(SYS.reElection({ ...S0, loyalty: 20 }, seeded(5)).ticket, false);
  assert.equal(SYS.reElection({ ...S0, loyalty: 20, defected: true }, seeded(5)).ticket, true);
  const clean = SYS.reElection({ ...S0, home: 70, cor: 0 }, seeded(6)).you, dirty = SYS.reElection({ ...S0, home: 70, cor: .8 }, seeded(6)).you;
  assert.ok(clean > dirty);
});
test("a veto override needs 73 of 109", () => { assert.equal(SYS.OVERRIDE_NEED, Math.ceil(SYS.SENATE_SEATS * 2 / 3)); });
test("grades run A to F", () => { assert.equal(SYS.senateGrade(SYS.senateScore({ home: 90, clout: 90, cor: 0, delivered: Array(12), sponsored: 2 })), "A"); assert.equal(SYS.senateGrade(SYS.senateScore({ home: 15, clout: 10, cor: .9 })), "F"); });

test("the enriched Senate: recall can succeed, it is hard, and going home matters", () => {
  const reg = SYS.districtRegister(5); assert.ok(reg >= 400000 && reg <= 700000);
  const run = (home) => { let S = { seed: 5, n: 3, home, register: reg }, last = null;
    for (let i = 0; i < 6; i++) { const x = SYS.recallStep(S, () => .5); if (!x) return last || "none"; last = x.note; if (!x.recall) return last; if (x.note === "recalled") return "recalled"; S = { ...S, recall: x.recall, n: S.n + 1 }; } return last; };
  assert.equal(run(15), "recalled", "a district that has turned on its senator can recall them");
  assert.notEqual(run(32), "recalled", "a merely unhappy district usually fails at verification");
  assert.equal(run(50), "none", "a content district starts no petition");
  // Going home: the injunction freezes it; the palaces slow the signatures.
  const S0 = { seed: 5, n: 4, home: 30, chest: 1, register: reg, recall: { stage: "petition", sigs: 200000 } };
  const inj = SYS.homeAct(S0, SYS.HOME_ACTS.find(a => a.id === "injunction"), () => .9);
  assert.equal(inj.recall.stallUntil, 5); assert.equal(SYS.recallStep({ ...S0, recall: inj.recall }, () => .5).note, "stalled");
  assert.ok(SYS.homeAct(S0, SYS.HOME_ACTS.find(a => a.id === "rulers"), () => .9).recall.sigs < 200000);
});
test("the third-term amendment can be killed on the floor; screening can stop a bad nominee; the best become Senate President", () => {
  const S = { seed: 1, n: 5, home: 60, clout: 65, cor: .1, govParty: true };
  const kill = SYS.ttChoose({ ...S, tt: { stage: "debate", debate: "against", hotel: "expose" } }, "vote", "nay", () => .5);
  assert.equal(kill.passed, false); assert.ok(kill.ayes < SYS.OVERRIDE_NEED);
  const pass = SYS.ttChoose({ ...S, clout: 40, tt: { stage: "debate", debate: "for", hotel: "take" } }, "vote", "aye", () => .5);
  assert.equal(pass.passed, true);
  const fake = SYS.NOMINEES.find(n => n.flaw === "certificate"), g = SYS.screenChoice(fake, "grill", S, () => .1);
  assert.ok(g.withdrawn && /does not exist/.test(g.msg));
  const star = { home: 75, clout: 72, cor: .08, delivered: Array(8).fill("x"), projects: [1, 2, 3], sponsored: 2 };
  assert.ok(SYS.spEligible(star)); assert.ok(!SYS.spEligible({ ...star, cor: .5 }));
  assert.equal(SYS.spBid(star, ["zone", "record"], () => .5).won, true);
  assert.ok(SYS.aideNotes({ ...S, home: 30, recall: { stage: "petition", sigs: 100000 }, register: 500000, items: [] }, 5).some(x => /The recall/.test(x.t)));
});
