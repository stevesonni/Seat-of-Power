import { test } from "node:test";
import assert from "node:assert/strict";
import { rivalryStart, rivalryCard, rivalryAfter, rivalryLegacy, RIVALRY_LEARN } from "../game/systems/rivalry.js";

const play = (pickOf, office = "governor") => { let R = rivalryStart(2), seen = []; for (let t = 2; t <= 8; t++) { const c = rivalryCard(R, t, { office, dep: "Hon. Tunde Bello" }); if (!c) continue; seen.push(c.id); R = rivalryAfter(R, c.opts.find(o => o.id === pickOf(c)) || c.opts[0], t); } return { R, seen }; };

test("the feud: one beat a year from the year after the refusal, all the way to the courts", () => {
  assert.equal(rivalryCard(rivalryStart(2), 2), null, "nothing in the year of the refusal");
  const { R, seen } = play(c => ({ whispers: "confront", primary: "kneel", wings: "strip", coalition: "drop", report: "release", defect: "vacant" })[c.id]);
  assert.deepEqual(seen, ["whispers", "primary", "wings", "coalition", "report", "defect"]);
  assert.ok(R.over && R.flags.includes("kneeled") && R.flags.includes("stripped") && R.flags.includes("court"));
  assert.match(rivalryLegacy(R, "Hon. Tunde Bello"), /Supreme Court/);
});
test("a truce ends it, at any of the first beats", () => {
  for (const at of ["whispers", "primary", "wings"]) { const { R, seen } = play(c => c.id === at ? "truce" : c.opts[0].id); assert.ok(R.over && R.truce, at); assert.equal(seen[seen.length - 1], at); assert.match(rivalryLegacy(R, "X"), /made peace/); }
});
test("the President's version speaks of the Vice-President and the National Assembly; the law is taught", () => {
  const c = rivalryCard(rivalryStart(1), 2, { office: "president", dep: "Ibrahim Danladi" });
  assert.match(c.kicker, /Vice-President/); assert.match(c.d, /National Assembly/); assert.match(c.d, /Ibrahim Danladi/);
  assert.ok(!/\{D\}/.test(JSON.stringify(c)));
  Object.values(RIVALRY_LEARN).forEach(t => assert.ok(t.length > 40));
  const all = []; let R = rivalryStart(1); for (let t = 2; t <= 7; t++) { const k = rivalryCard(R, t, { office: "president", dep: "D" }); all.push(JSON.stringify(k)); k.opts.forEach(o => assert.ok(o.paper && o.paper[0] && o.say, k.id + "/" + o.id)); R = rivalryAfter(R, k.opts.find(o => !o.truce), t); }
  assert.ok(!/Governor|House of Assembly/.test(all.join(" ")), "no governor words for the President");
  assert.ok(!/Obasanjo|Atiku/.test(all.join(" ")), "no real people");
});
