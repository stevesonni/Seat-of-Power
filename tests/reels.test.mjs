// The project reels (docs/GEMINI-REELS.md): every film listed in REELS exists, every film on disk is listed,
// and a type with no film yet gets null (the card then shows the ribbon picture).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as SYS from "../game/systems/index.js";
const DIR = new URL("../public/art/reels/", import.meta.url);
test("reels: listed films exist and every film is listed", () => {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith(".mp4")) : [];
  const want = Object.entries(SYS.REELS).flatMap(([t, n]) => Array.from({ length: n }, (_, i) => t + (i ? "-" + (i + 1) : "") + ".mp4"));
  want.forEach(f => assert.ok(files.includes(f), f + " is listed but missing"));
  files.forEach(f => assert.ok(want.includes(f), f + " is on disk but not listed in REELS"));
  const byPolicy = new Set(Object.values(SYS.REEL_BY_POLICY || {}));
  Object.keys(SYS.REELS).forEach(t => assert.ok(SYS.UNIT[t] || byPolicy.has(t), t + " is a project type, or a programme's own film"));
  // The Irrigation Network builds a dam, but shows water reaching the fields (owner, 23 Nov 2026).
  assert.equal(SYS.reelFor("dam", "p1", "irrigation"), "./art/reels/irrigation.mp4");
  assert.equal(SYS.reelFor("dam", "p1", "f_mambilla"), "./art/reels/dam.mp4");
});
test("reels: no film means no reel; two films alternate by project", () => {
  assert.equal(SYS.reelFor("nothing-here", "p1"), null);
  if (SYS.REELS.school && !SYS.REELS.secondary) assert.equal(SYS.reelFor("secondary", "p1"), "./art/reels/school.mp4", "a secondary school borrows the school film");
  // The lights-on film (dam.mp4) also plays for power plants and rural electrification (owner, 22 Nov 2026).
  assert.equal(SYS.reelFor("dam", "p1"), "./art/reels/dam.mp4");
  assert.equal(SYS.reelFor("power", "p1"), "./art/reels/power.mp4", "power plants, solar and rural electrification have their own film");
  assert.equal(SYS.reelFor("seaport", "p1"), "./art/reels/seaport.mp4");
  assert.equal(SYS.reelFor("refinery", "p1"), "./art/reels/refinery.mp4");
  assert.equal(SYS.reelFor("pipeline", "p1"), "./art/reels/refinery.mp4", "a gas pipeline borrows the refinery film");
  assert.equal(SYS.reelFor("vehicles", "p1"), "./art/reels/vehicles.mp4", "the patrol fleet (installed at the owner's request, 22 Nov 2026)");
  SYS.REELS.__t = 2;
  const a = new Set(["p1", "p2", "p3", "p4", "p5", "p6"].map(id => SYS.reelFor("__t", id)));
  assert.deepEqual([...a].sort(), ["./art/reels/__t-2.mp4", "./art/reels/__t.mp4"]);
  delete SYS.REELS.__t;
});
