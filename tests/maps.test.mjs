// The state maps (pillar "map", tools/build-maps.mjs): every state the game plays has a map, and every local
// government the game names is on it, spelt the same way, so projects and problems land in the right place.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../game/seat-of-power.jsx", import.meta.url), "utf8"), i = src.indexOf("const STATE_LGAS = {"), j = src.indexOf("\n};", i);
const GAME = eval("(" + src.slice(i + 19, j + 2) + ")");
test("every state has a map with all its local governments", () => {
  for (const [st, lgas] of Object.entries(GAME)) {
    const f = new URL("../public/art/maps/" + st.replace(/ /g, "_") + ".json", import.meta.url);
    assert.ok(fs.existsSync(f), st + " has a map");
    const M = JSON.parse(fs.readFileSync(f)), on = new Set(M.lgas.map(l => l.n));
    const missing = lgas.filter(n => !on.has(n)); assert.deepEqual(missing, [], st + ": every local government is on the map");
    M.lgas.forEach(l => { assert.match(l.d, /^M[\d.,L]+Z/, st + " " + l.n + " has a shape"); assert.equal(l.c.length, 2); });
  }
});
