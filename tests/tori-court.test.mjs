/* The petitioner answers the court on Tori (owner, 25 Nov 2026: "The Supreme Court dismissed his petition but I
   didn't see him tweet about it saying he won't give up on fighting for the people and will be back"). */
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
const base = { st: "Borno", turn: 2, app: 60, appPrev: 58, cor: .2, oppName: "Goni Kyari", oppParty: "OPP" };
const say = (court) => SYS.toriOpposition({ ...base, court }).map(p => p.text).join(" || ");

test("after the Supreme Court dismisses his petition, the petitioner accepts it and promises to be back", () => {
  const t = say({ court: "Supreme Court", won: true, final: true, opp: "Goni Kyari" });
  assert.match(t, /The Supreme Court has spoken/); assert.match(t, /we will be back/i);
});
test("a lower-court loss: he is going to the next court", () => assert.match(say({ court: "Governorship Election Tribunal", won: true, final: false }), /going to the next court/));
test("a withdrawn petition reads as withdrawn, not as a Supreme Court ruling", () => { const t = say({ court: "Court of Appeal", won: true, final: true, quit: true }); assert.match(t, /withdrawn my petition/); assert.doesNotMatch(t, /Supreme Court has spoken/); });
test("when the governor loses, he celebrates", () => assert.match(say({ court: "Governorship Election Tribunal", won: false, final: false }), /nullified/));
test("no ruling this year, no petition post", () => assert.doesNotMatch(say(null), /petition|court/i));
test("the governor's own post about the win makes sense", () => {
  const o = SYS.toriOptions({ ...base, events: [{ text: "The Supreme Court dismissed Goni Kyari's petition. The matter is closed for good.", good: true }] });
  const t = o.map(x => x.text).join(" || ");
  assert.match(t, /upheld the mandate you gave us/); assert.doesNotMatch(t, /That is what we promised/);
});
