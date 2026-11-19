// An expired Lagos Life login (the server answers bad_session) must not make the game retry every five seconds
// for ever: one fresh try at once, then longer waits, and one message to the player. (Seen on 18 Nov 2026: 34
// refused saves in about a minute.)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
test("expired login: one quick retry, then backing off, and one message", async () => {
  const code = fs.readFileSync(new URL("../public/sop-vatar.js", import.meta.url), "utf8");
  const timers = [], saves = [], toasts = [];
  const win = { SOP_VATAR: true, Vatar: { init: async () => ({ player: {} }), session: async () => ({ session: "s" }), onPause() {}, onResume() {}, purchases: async () => [], onPurchase() {} },
    SOP_toast: (m) => toasts.push(m), addEventListener() {}, dispatchEvent() {} };
  win.top = {}; // framed
  const ctx = { window: win, document: { head: { appendChild() {} }, createElement: () => ({}), addEventListener() {}, visibilityState: "visible" }, localStorage: { getItem: () => null, setItem() {} },
    fetch: async (path) => { if (path === "/api/load") return { ok: true, status: 200, json: async () => ({ data: {} }) }; if (path === "/api/save") saves.push(path); return { ok: false, status: 401, json: async () => ({ error: "bad_session" }) }; },
    setTimeout: (fn, ms) => { timers.push(ms); return timers.length; }, clearTimeout() {}, console, CustomEvent: function () {}, Promise, JSON, Object };
  vm.runInNewContext(code, ctx);
  await win.storage.set("sop_save", "{}"); await new Promise(r => setImmediate(r));
  await win.SOP_storageFlush(); await new Promise(r => setImmediate(r));
  assert.equal(saves.length, 2, "the first refusal is retried once at once with a fresh session");
  assert.equal(timers.at(-1), 30000, "then the next try waits 30 seconds, not 5");
  assert.equal(toasts.length, 1, "the player is told once that the progress is safe on this phone");
  await win.SOP_storageFlush(); await new Promise(r => setImmediate(r));
  assert.equal(timers.at(-1), 120000); assert.equal(toasts.length, 1);
});
