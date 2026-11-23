// The last month in office (game/systems/farewell.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../game/systems/index.js";

const proj = (id, status, progress) => ({ id, title: "P" + id, status, progress });
test("the commissioning rush: finished projects, and half-built ones that tempt", () => {
  const C = S.commissionChoices([proj(1, "delivered", 100), proj(2, "in_progress", 70), proj(3, "in_progress", 20), proj(4, "stalled", 80)]);
  assert.deepEqual(C.map(c => [c.id, c.done]), [[1, true], [2, false]]);
});
test("the last council: varied lines, and the crooked one asks for one last approval", () => {
  const ms = [1, 2, 3, 4].map(i => ({ id: "m" + i, name: "Ministry of M" + i, minister: "Name" + i, loyalty: 80, perf: 60, cor: i === 4 ? 70 : 10 }));
  const X = S.excoLines(ms, {});
  assert.equal(new Set(X.lines.map(l => l.text)).size, X.lines.length, "no two say the same thing");
  assert.ok(X.ask && X.ask.id === "m4" && !X.lines.some(l => l.id === "m4"));
  assert.equal(S.excoLines(ms.map(m => ({ ...m, cor: 10 })), {}).ask, null);
});
test("the successor's speech follows who they are and how you left", () => {
  assert.equal(S.successorSpeech({ kind: "heir", handover: "full", broadcast: "humble" }).tone, "warm");
  assert.equal(S.successorSpeech({ kind: "opposition", midnight: ["contract", "land"], handover: "none" }).tone, "snub");
  assert.equal(S.successorSpeech({ kind: "rival" }).tone, "polite");
});
test("the midnight files feed the EFCC and the record", () => {
  const E = S.farewellEffect({ commission: [{ title: "Stadium", done: false }], ask: "yes", midnight: ["contract", "pardon"], broadcast: "humble" });
  assert.ok(E.efcc >= .17 && E.fund === 150 && E.fx.app >= 2 && E.wiki.length === 4);
});
test("the ceremony is for those who leave on their own feet; every beat has a picture with a stand-in", () => {
  assert.deepEqual(S.FAREWELL_ENDS, ["complete", "stepped_down", "defeated"]);
  for (const k of ["commission", "exco", "midnight", "broadcast", "oath", "depart", "home"]) for (const nat of [false, true]) { const [a, b] = S.farewellArt(k, nat); assert.match(a, /^farewell\//); assert.ok(b && !/^farewell\//.test(b)); }
});
