// The House of Assembly (game/systems/legislature.js).
import test from "node:test";
import assert from "node:assert/strict";

test("the new House's Speaker race reads as one letter, the sitting Speaker at its centre (owner, 27 Nov 2026)", async () => {
  const { speakerRaceLetter } = await import("../game/systems/legislature.js");
  const R = speakerRaceLetter({ kind: "godfather", rec: { score: 0 }, old: { name: "Rt. Hon. Terver Orshi", friendly: true }, rival: "Hon. Oche Edoh" });
  assert.equal(R.brief, "Some members of the House feel you walked all over Speaker Orshi and turned them into a rubber stamp. They want that to end. Rt. Hon. Terver Orshi still wants another term in the chair. But the House has found a rival: Hon. Oche Edoh, who owes you nothing and will make you fight for every bill. Your former godfather, who never forgave the break, is behind him.");
  assert.equal(R.stakes, "A Speaker you cannot control will hold your bills until you pay his price. If your approval slips, he will move to impeach.");
  assert.deepEqual(R.labels, { old: "Back Terver Orshi for another term", rival: "Back Oche Edoh and make peace with your old godfather", out: "Stay out of the race" });
  const H = speakerRaceLetter({ kind: "dealer", rec: { score: 0 }, old: { name: "Rt. Hon. Terver Orshi", friendly: false }, rival: "Hon. Oche Edoh" });
  assert.match(H.brief, /^Members say Speaker Orshi made you pay for every bill in your first term, and you paid\. Rt\. Hon\. Terver Orshi, who fought you in your first term,/);
  const N = speakerRaceLetter({ kind: "avenger", rec: { score: -5 }, old: null, rival: "Hon. Oche Edoh" });
  assert.ok(!/Speaker undefined|null/.test(N.brief) && N.labels.old === null);
  for (const x of [R, H, N]) assert.ok(!/\bhard bargainer\b|puts up Hon\.[^.]*, (a dealer|your old godfather's man)/.test(x.brief));
});
