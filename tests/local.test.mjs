// Neighbourhood jobs (pillar "local"): six a year, each kind once per place per year, the place's mood rises,
// and a job of the right kind eases an open problem there.
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
test("neighbourhood jobs: six a year, once per kind per place, mood and problems", () => {
  let stc = {}; const needs = [{ id: "n1", lga: "Odeda", k: "water", status: "open" }, { id: "n2", lga: "Odeda", k: "road", status: "done" }];
  assert.equal(SYS.localLeft(stc, 1), 6);
  let R = SYS.localDo(stc, 1, "Odeda", "water", needs); stc = { ...stc, ...R.stc };
  assert.equal(R.eased, "n1", "a borehole eases the open water problem there"); assert.match(R.text, /borehole in Odeda/);
  assert.equal(SYS.placeMood(stc, "Odeda"), 5); assert.equal(SYS.localLeft(stc, 1), 5);
  assert.equal(SYS.localCan(stc, 1, "Odeda", "water").ok, false, "not twice in one place in a year");
  assert.equal(SYS.localCan(stc, 1, "Ifo", "water").ok, true, "but yes somewhere else");
  assert.equal(SYS.localDo(stc, 1, "Odeda", "road", needs).eased, null, "a problem already dealt with is not eased again");
  for (const L of ["A", "B", "C", "D", "E"]) stc = { ...stc, ...SYS.localDo(stc, 1, L, "visit", needs).stc };
  assert.equal(SYS.localLeft(stc, 1), 0); assert.match(SYS.localCan(stc, 1, "Ifo", "market").why, /No more/);
  assert.equal(SYS.localLeft(stc, 2), 6, "a new year, six new jobs"); assert.equal(SYS.placeMood(stc, "Odeda"), 5, "the mood stays");
  for (let i = 0; i < 9; i++) stc = { ...stc, ...SYS.localDo(stc, 10 + i, "Ifo", "water", []).stc };
  assert.equal(SYS.placeMood(stc, "Ifo"), 20, "a place's own mood is capped");
});
