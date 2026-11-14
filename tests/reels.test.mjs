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
  Object.keys(SYS.REELS).forEach(t => assert.ok(SYS.UNIT[t], t + " is a project type"));
});
test("reels: no film means no reel; two films alternate by project", () => {
  assert.equal(SYS.reelFor("nothing-here", "p1"), null);
  SYS.REELS.__t = 2;
  const a = new Set(["p1", "p2", "p3", "p4", "p5", "p6"].map(id => SYS.reelFor("__t", id)));
  assert.deepEqual([...a].sort(), ["./art/reels/__t-2.mp4", "./art/reels/__t.mp4"]);
  delete SYS.REELS.__t;
});
