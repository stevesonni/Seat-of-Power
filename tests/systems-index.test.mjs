import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// `export *` silently drops a name two modules both export: forbid that.
test("no two system modules export the same name, and the index exposes them all", async () => {
  const dir = new URL("../game/systems/", import.meta.url), seen = {};
  const idx = await import(new URL("index.js", dir));
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".js") && f !== "index.js")) {
    const m = await import(new URL(f, dir));
    for (const k of Object.keys(m)) { assert.ok(!seen[k], k + " exported by both " + seen[k] + " and " + f); seen[k] = f; assert.ok(k in idx, k + " (" + f + ") missing from index.js"); }
  }
});
