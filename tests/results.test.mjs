import { test } from "node:test";
import assert from "node:assert/strict";
import { flagshipDeliverable, ministryResult, ministryYear, councilVote } from "../game/systems/results.js";

const D = [["Ikenne", "Sagamu", "Remo North"], ["Abeokuta North", "Odeda", "Obafemi Owode"], ["Ado-Odo/Ota", "Ipokia", "Yewa South"]];
const seq = (v) => () => v;
test("every flagship promise says what was built and where", () => {
  for (const ag of ["infrastructure", "education", "health", "security", "agriculture", "anticorruption", "youth", "women", "technology", "housing"]) {
    const t = flagshipDeliverable(ag, 1, D, seq(.3));
    assert.ok(t.length > 25, ag + ": " + t);
    assert.ok(/\d|every/.test(t), ag + " has a number: " + t);
  }
  assert.match(flagshipDeliverable("infrastructure", 1, D, seq(.1)), /trunk road in the North district \(\d+ km/);
  assert.match(flagshipDeliverable("security", 2, D, seq(.1)), /community guards trained and equipped in (Abeokuta North|Odeda|Obafemi Owode)/);
});
test("a commissioner's report names them, the money and the result", () => {
  const m = { id: "health", name: "Health", minister: "Kemi Ogunlesi", key: "hp" };
  assert.match(ministryResult(m, true, 500, "Ikenne", seq(.5)), /^Hon\. Kemi Ogunlesi \(Health\) used the ₦500M: \d+ health centres in Ikenne restocked/);
  assert.match(ministryResult(m, false, 500, "Ikenne", seq(.5)), /still have no nurses/);
  assert.match(ministryYear({ ...m, perf: 30 }, "Ikenne").line, /missed every target/);
  assert.doesNotMatch(ministryYear({ ...m, perf: 70 }, "Ikenne", seq(.5)).line, /₦0M/);
});
test("a free council vote can go against you, and close races are the ones you could steal", () => {
  const v = councilVote(D, [-6, -6, -6], seq(.4));
  assert.equal(v.all.length, 9);
  assert.ok(v.lost.length > v.won.length);
  assert.ok(v.close.every(x => x.share >= 43 && x.share < 50));
  assert.equal(councilVote(D, [8, 8, 8], seq(.5)).won.length, 9);
});
