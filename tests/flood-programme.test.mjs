// Flood & Erosion Control, by where it is built (owner, 25 Nov 2026: "How does a mass estate solve flooding? We need a
// new programme here and it will follow the pattern of differing based on where it's being constructed").
import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
const P = { id: "flood_ctrl", nm: "Flood & Erosion Control", c: 4, t: 2, d: "Drains, channels and embankments." };
test("each kind of place gets its own flood programme, with its own choices", () => {
  const L = (st) => SYS.localProgramme(P, st);
  assert.equal(L("Anambra").nm, "Gully Erosion Control"); assert.equal(L("Anambra").art, "bill-erosion");
  assert.equal(L("Bayelsa").nm, "Flood Defences for the Creeks");
  assert.match(L("Lagos").nm, /^Storm Drains & Canals for Lagos/);
  assert.equal(L("Kogi").nm, "River Embankments & Flood Warning"); assert.equal(L("Kogi").art, "bill-flood");
  assert.equal(L("Katsina").nm, "Town Drains & Flood Channels");
  for (const st of ["Anambra", "Bayelsa", "Lagos", "Kogi", "Katsina"]) { const x = L(st); assert.ok(x.ask && x.ask.opts.length === 3, st + " asks how"); assert.ok(x.local && x.local.why && x.local.fact, st + " says why"); }
  assert.equal(new Set(["Anambra", "Bayelsa", "Lagos", "Kogi", "Katsina"].map(st => L(st).ask.q)).size >= 4, true);
});
