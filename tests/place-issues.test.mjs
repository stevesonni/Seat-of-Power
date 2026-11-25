/* Every local government raises its own issues, and the President's visits raise the state's own, by audience
   (owner, 25 Nov 2026: "I can't come to Chibok and they're saying fertiliser and it's the same in Aba"). */
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

const KINDS = ["road", "clinic", "school", "water", "security", "farm", "power", "housing", "traffic", "youth", "poverty", "land", "jobs", "digital"];

test("every one of the 774 local governments has at least two issues, each its own words", () => {
  let n = 0, lgas = 0; const seen = new Map();
  for (const st in SYS.LGA_ISSUES) for (const l in SYS.LGA_ISSUES[st]) { lgas++;
    const I = SYS.lgaIssues(st, l); assert.ok(I.length >= 2, st + "/" + l);
    for (const i of I) { n++; assert.ok(KINDS.includes(i.k), st + "/" + l + " " + i.k); assert.ok(i.t && i.d, st + "/" + l); seen.set(i.d, (seen.get(i.d) || 0) + 1); } }
  assert.equal(lgas, 774);
  const dup = [...seen].filter(([, c]) => c > 1);
  assert.deepEqual(dup, [], "no two places say the same thing");
});

test("Chibok and Aba South raise their own problems, not the same one", () => {
  const ch = SYS.lgaIssues("Borno", "Chibok").map(i => i.d).join(" "), aba = SYS.lgaIssues("Abia", "Aba South").map(i => i.d).join(" ");
  assert.match(ch, /girls were taken from the school/); assert.match(aba, /Ariaria/);
  assert.doesNotMatch(ch + aba, /fertiliser/);
});

test("the chairman, the town hall and the palace lead with different issues, and a second visit moves on", () => {
  const a = SYS.lgaIssue("Abia", "Aba South", "chairman", 0), b = SYS.lgaIssue("Abia", "Aba South", "chairman", 1);
  assert.notEqual(a.d, b.d);
  const leads = new Set(["chairman", "townhall", "palace"].map(x => SYS.lgaIssue("Lagos", "Apapa", x, 0).k));
  assert.ok(leads.size >= 2, "different audiences, different first issue");
});

test("the President's visit: each state has its own issue for the people, the royal fathers and the troops", () => {
  const seen = new Set();
  for (const st in SYS.STATE_ISSUES) for (const p of ["town", "rulers", "security"]) { const i = SYS.stateIssue(st, p, 0); assert.ok(i && KINDS.includes(i.k), st + " " + p); seen.add(i.d); }
  assert.equal(Object.keys(SYS.STATE_ISSUES).length, 37);
  assert.ok(seen.size >= 37 * 3 - 2, "nearly every line is its own");
});

test("a palace visit is one of the governor's tours", () => {
  assert.ok(SYS.LGA_TOUR_PURPOSES.some(p => p.id === "palace"));
  const R = SYS.lgaTourOutcome("palace", { lga: "Chibok", issue: SYS.lgaIssue("Borno", "Chibok", "palace", 0), north: true }, () => .5);
  assert.match(R.line, /royal father/); assert.match(R.line, /Insurgents still raid Chibok/);
});
