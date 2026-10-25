import { test } from "node:test";
import assert from "node:assert/strict";
import { DAILY, dailyFor, dayNo, DAILY_EPOCH, dailyShare, streakOf } from "../game/systems/daily.js";

test("one dilemma a day, the same for everyone, and every day has one", () => {
  assert.equal(dayNo(DAILY_EPOCH), 1);
  assert.equal(dayNo(DAILY_EPOCH + 864e5 * 3 + 5), 4);
  const seen = new Set();
  for (let n = 1; n <= DAILY.length; n++) { const d = dailyFor(n); assert.ok(d && d.options.length >= 2, n); seen.add(d.id); }
  assert.equal(seen.size, DAILY.length, "every dilemma comes up once per cycle");
  DAILY.forEach(d => d.options.forEach(o => { assert.ok(o.out && o.fx, d.id); }));
});
test("the share card gives nothing away", () => {
  const t = dailyShare(12, { label: "Pay the union", fx: { app: 4, cash: -1, party: 0 } }, 71);
  assert.match(t, /Daily #12/); assert.match(t, /🟩🟥⬜/); assert.match(t, /71%/);
  assert.doesNotMatch(t, /Pay the union/);
});
test("streaks count days in a row; a freeze saves one missed day", () => {
  assert.equal(streakOf([8, 9, 10], 10).streak, 3);
  assert.equal(streakOf([8, 9], 10).streak, 2, "yesterday still counts until today ends");
  assert.equal(streakOf([7, 8], 10).streak, 0);
  const f = streakOf([6, 7, 8, 10], 10, 1);
  assert.equal(f.streak, 5); assert.deepEqual(f.bridged, [9]);
  assert.equal(streakOf([7, 8], 10, 1).streak, 3, "a freeze covers yesterday");
  assert.equal(streakOf([1, 2, 3, 9], 9).best, 3);
});

test("days already played keep their dilemma; a new one never comes back within sixty days", () => {
  assert.equal(DAILY.length, 60);
  const first = Array.from({ length: 30 }, (_, i) => dailyFor(i + 1).id);
  assert.deepEqual(first.slice(0, 2), [dailyFor(1).id, dailyFor(2).id]);
  for (let n = 1; n <= 400; n++) { const id = dailyFor(n).id; for (let m = n + 1; m < n + 60 && m <= 400; m++) assert.notEqual(dailyFor(m).id, id, "day " + n + " and day " + m); }
});
