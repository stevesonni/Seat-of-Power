import { test } from "node:test";
import assert from "node:assert/strict";
import { openCase, meetLines, recordMeeting, gatherEvidence, gradeOf, decideCase, dueLater, addCommitment, transferCommitments, reviewCommitments, commitmentOutcome, findingsReady } from "../game/systems/cases.js";

const base = (id, hon = 50) => openCase({ id, year: 2, ministryId: "health", ministryName: "Health", officer: "Ada Eze", hon, amountM: 900, source: "press" });

test("the same case id always has the same hidden truth (no reroll on reload)", () => {
  assert.equal(base("c1").truth, base("c1").truth);
  assert.equal(JSON.stringify(gatherEvidence(base("c1"), "audit", 2).c), JSON.stringify(gatherEvidence(base("c1"), "audit", 2).c));
});
test("not every accused official is guilty", () => {
  const truths = new Set(); for (let i = 0; i < 200; i++) truths.add(base("x" + i, 55).truth);
  assert.ok(truths.has("false") && truths.has("misconduct") && truths.has("supplier") && truths.has("negligence"));
});
test("honest officials are more often falsely accused than corrupt ones", () => {
  const share = (hon) => { let f = 0; for (let i = 0; i < 400; i++) if (base("h" + hon + "_" + i, hon).truth === "false") f++; return f / 400; };
  assert.ok(share(90) > share(10));
});
test("a press story starts as a rumour; grades never name the hidden truth", () => {
  const c = base("c2"); assert.equal(c.stage, "allegation"); assert.equal(c.grade, "rumour");
  for (let i = 0; i < 50; i++) { let k = base("g" + i); k = gatherEvidence(k, "audit", 2).c; k = gatherEvidence(k, "agf", 2).c; assert.ok(["rumour", "credible", "documented", "substantiated", "unsupported"].includes(k.grade)); }
});
test("each method is used once per case", () => {
  let c = gatherEvidence(base("c3"), "site", 2).c; const n = c.evidence.length;
  c = gatherEvidence(c, "site", 3).c; assert.equal(c.evidence.length, n);
});
test("evidence usually points the right way, but not always", () => {
  let right = 0, total = 0;
  for (let i = 0; i < 300; i++) { let c = base("e" + i); c = gatherEvidence(c, "agf", 2).c; c = gatherEvidence(c, "audit", 2).c; if (!findingsReady(c)) continue; total++;
    const guiltyFinding = c.grade === "documented" || c.grade === "substantiated"; const guilty = c.truth === "misconduct";
    if (guiltyFinding === guilty || (c.truth === "negligence")) right++; }
  assert.ok(right / total > .6 && right / total < 1, "accuracy " + right / total);
});
test("meetings: inherited cases are acknowledged; replies do not label guilt", () => {
  const c = base("c4"); const m = meetLines(c, "explain", "Tunde Bello", 3);
  assert.ok(m.inherited); assert.match(m.lines[0].text, /predecessor, Hon\. Ada Eze/);
  const k = recordMeeting(c, { approach: "explain", who: "Tunde Bello", year: 3, lines: m.lines });
  assert.equal(k.stage, "meeting"); assert.equal(k.meetings.length, 1);
  for (const t of ["misconduct", "negligence", "supplier", "false"]) for (const ln of meetLines({ ...c, truth: t }, "confront", "Ada Eze", 3).lines) assert.doesNotMatch(ln.text, /guilty|innocent|misconduct/i);
});
test("dismissal does not erase the missing money", () => {
  let c = base("c5"); c = { ...c, truth: "misconduct", grade: "substantiated" };
  const r = decideCase(c, "prosecute", 3);
  assert.ok(r.removes); assert.ok(r.c.outstandingM > 0); assert.equal(r.c.outstandingM + r.c.recoveredM, 900);
});
test("sacking someone innocent comes back the next year, once", () => {
  let c = { ...base("c6"), truth: "false", grade: "documented" };
  c = decideCase(c, "prosecute", 3).c;
  let d = dueLater([c], 3); assert.equal(d.events.length, 0);
  d = dueLater(d.cases, 4); assert.equal(d.events.length, 1); assert.match(d.events[0].text, /acquits/);
  d = dueLater(d.cases, 5); assert.equal(d.events.length, 0);
});
test("commitments: institutional ones pass to the successor, personal ones stay", () => {
  let l = addCommitment([], { id: "a", who: "Ada Eze", ministryId: "health", action: "Hand over the file", reviewYear: 3, year: 2 });
  l = addCommitment(l, { id: "b", who: "Ada Eze", ministryId: "health", action: "Repay the per diems", reviewYear: 3, personal: true, year: 2 });
  l = addCommitment(l, { id: "a", who: "x", ministryId: "health", action: "dup", reviewYear: 3, year: 2 });
  assert.equal(l.length, 2);
  l = transferCommitments(l, "health", "Ada Eze", "Tunde Bello", 3);
  assert.equal(l.find(x => x.id === "a").who, "Tunde Bello"); assert.equal(l.find(x => x.id === "b").who, "Ada Eze");
  const r = reviewCommitments(l, 3, (x) => x.id === "a");
  assert.equal(r.list.find(x => x.id === "a").status, "kept"); assert.equal(r.list.find(x => x.id === "b").status, "broken");
  assert.equal(reviewCommitments(r.list, 4, () => true).due.length, 0); // reviewed once
});
test("not delivering a promised file is evidence, not proof", () => {
  let broken = 0; for (let i = 0; i < 200; i++) { const c = { ...base("k" + i), truth: "misconduct" }; const o = commitmentOutcome(c, 20); if (!o.kept) { broken++; assert.ok(o.evidence.w > 0 && o.evidence.w < 3); } }
  assert.ok(broken > 0);
});
