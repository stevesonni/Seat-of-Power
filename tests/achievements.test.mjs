import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("each card is earned by what it says, once, with the player's own number", () => {
  const e = (ctx, have) => SYS.cardsEarned(ctx, have).map(c => c.id);
  assert.deepEqual(e({ trips: 3 }), []);
  const j = SYS.cardsEarned({ trips: 5 }); assert.equal(j[0].id, "junketer"); assert.equal(j[0].big, "5 trips abroad");
  assert.deepEqual(e({ trips: 5 }, { junketer: {} }), [], "only once");
  assert.ok(e({ office: "governor", termDone: true, trips: 0, arrearsMax: 0, cor: .1 }).join() === "stay_home,salary_day,clean_hands");
  assert.deepEqual(e({ office: "president", termDone: true, trips: 0, arrearsMax: 2 }), [], "Stay-at-home is a governor's card");
  assert.deepEqual(e({ rivalUs: 3, rivalThem: 1 }), [], "3-0, not 3-1");
  assert.equal(SYS.cardsEarned({ rivalUs: 3, rivalThem: 0, state: "Ogun", nb: "Oyo" })[0].big, "Ogun 3 – 0 Oyo");
  assert.equal(SYS.cardsEarned({ gEnd: "complete", oldDebt: 12, debt: 7.5 })[0].big, "₦12B → ₦7.5B");
  assert.deepEqual(e({ gEnd: "complete", oldDebt: 12, debt: 14 }), []);
  assert.deepEqual(e({ turn: 2, leakPct: 2 }), [], "not before year 3");
  assert.deepEqual(e({ turn: 3, leakPct: 2 }), ["leak_plumber"]);
  assert.match(SYS.cardsEarned({ ambitionMet: true, ambition: "Not one naira missing" })[0].line, /Not one naira missing/);
  ["streak", "favourite", "ward_to_aso", "every_family", "lawmaker", "road_held", "trade_war", "diplomat", "peacemaker", "whistle", "supreme_court", "survivor", "ghostbuster", "quick_fix", "ribbon", "combo"].forEach(id => assert.ok(SYS.ACH_IDS.includes(id)));
  const all = { streak: 9, app: 80, ladder: true, evacDone: true, lawsBacked: 4, roadHeld: true, twEnd: "good", presTrips: 4, peace: true, whistleTrue: 1, petitionWon: true, impSurv: true, plugYears: 3, quickWins: 5, delivered: 8, combos: 3 };
  assert.equal(SYS.cardsEarned(all).length, 16);
  SYS.ACHIEVEMENTS.forEach(a => { assert.ok(a.t.length <= 24, a.t); assert.ok(!/\b(purchase|initiate|utilise)\b/i.test(a.t + a.line(5, {})), "plain words"); });
});
