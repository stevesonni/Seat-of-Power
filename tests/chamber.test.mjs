// The chamber, seat by seat (owner, 26 Nov 2026): the layout and a count that always agrees with the result.
import test from "node:test";
import assert from "node:assert/strict";
import { seatLayout, voteSplit, seatVotes } from "../game/systems/chamber.js";

test("one seat per member, on a semicircle, left to right", () => {
  for (const n of [24, 26, 40, 109, 360]) { const L = seatLayout(n); assert.equal(L.length, n); L.forEach(p => { assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= .5); }); assert.ok(L[0].x < .5 && L[n - 1].x > .5); }
});
test("the count always agrees with the result the game decided", () => {
  for (let i = 0; i < 300; i++) {
    const seats = 20 + (i % 21), favour = (i % 11) / 10, passed = i % 2 === 0, need = i % 3 ? "majority" : "two_thirds";
    const v = voteSplit({ seats, favour, passed, need, seed: "t" + i });
    assert.equal(v.yes + v.no + v.abst, seats); assert.ok(v.abst <= 2);
    if (need === "two_thirds") assert.equal(v.yes >= Math.ceil(seats * 2 / 3), passed, JSON.stringify({ seats, passed, v }));
    else assert.equal(v.yes > v.no, passed, JSON.stringify({ seats, passed, v }));
  }
});
test("a House against you shows red in the majority; with you, green", () => {
  const against = voteSplit({ seats: 24, favour: .3, passed: false, seed: "a" }), with_ = voteSplit({ seats: 24, favour: .7, passed: true, seed: "b" });
  assert.ok(against.no > against.yes); assert.ok(with_.yes > with_.no);
  const S = seatVotes(against, "a"); assert.equal(S.votes.length, 24); assert.equal(S.votes.filter(x => x === "no").length, against.no); assert.equal(new Set(S.order).size, 24);
});
