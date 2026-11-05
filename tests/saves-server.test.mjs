/* Lost careers: the save on the real server, with a stand-in for Lagos Life's session check
   that fails the way it does in the logs (500, 502, 503) before it answers. */
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { careerOf, keepBackup } from "../server/saves.mjs";

let failNext = 0; // how many verify calls fail before one succeeds
const mock = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => {
  if (failNext > 0) { failNext--; res.writeHead(500, { "Content-Type": "application/json" }); return res.end("{}"); }
  const s = JSON.parse(b || "{}").session; res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ playerId: "p_" + s, username: "user_" + s, exp: Date.now() + 6e5 })); }); });
await new Promise(r => mock.listen(0, r));
const port = 19000 + Math.floor(Math.random() * 900), data = fs.mkdtempSync(path.join(os.tmpdir(), "saves-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "vtr_test_x", VATAR_API: "http://127.0.0.1:" + mock.address().port }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const call = (p, session, body = {}) => fetch("http://127.0.0.1:" + port + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session, ...body }) }).then(r => r.json());
const game = (nm, pseed, turn) => JSON.stringify({ setup: { nm, state: "Ogun", startYear: 2027 }, stc: { pseed }, turn, savedAt: Date.now() });

test("a passing hiccup in Lagos Life's session check does not lose the save", async () => {
  failNext = 2; // two failures, then it answers: the server asks again
  assert.equal((await call("/api/save", "ada", { data: { sop_save: game("Ada", 1, 3) } })).ok, true);
  failNext = 2;
  const d = await call("/api/load", "ada");
  assert.equal(JSON.parse(d.data.sop_save).turn, 3, "the career loads");
});
test("a new game never wipes out a career: the old one is kept and can be brought back", async () => {
  await call("/api/save", "bo", { data: { sop_save: game("Bo", 1, 5) } });
  await call("/api/save", "bo", { data: { sop_save: game("Bo", 1, 6) } }); // the same career, later: no backup
  assert.equal((await call("/api/load", "bo")).bak.length, 0);
  await call("/api/save", "bo", { data: { sop_save: game("Bo", 2, 1) } }); // a new game replaces it
  const L = await call("/api/load", "bo");
  assert.equal(L.bak.length, 1); assert.match(L.bak[0].name, /^Bo · Ogun · year 6$/);
  const R = await call("/api/restore", "bo", { i: 0 });
  assert.equal(R.ok, true); assert.equal(JSON.parse(R.value).turn, 6);
  const L2 = await call("/api/load", "bo");
  assert.equal(JSON.parse(L2.data.sop_save).turn, 6, "the old career is back");
  assert.equal(L2.bak.length, 1); assert.match(L2.bak[0].name, /year 1$/, "and the new game is kept in turn");
  await call("/api/save", "bo", { data: { sop_save: "" } }); // a career that ends is kept too
  assert.equal((await call("/api/load", "bo")).bak.length, 2);
});
test("the backup rules on their own", () => {
  assert.equal(careerOf(game("A", 1, 2)), careerOf(game("A", 1, 7))); assert.notEqual(careerOf(game("A", 1, 2)), careerOf(game("A", 2, 2)));
  const p = { data: {} }; keepBackup(p, "sop_save", game("A", 1, 1)); assert.equal(p.bak, undefined, "nothing to keep yet");
  for (let i = 1; i <= 5; i++) { p.data.sop_save = game("A", i, 3); keepBackup(p, "sop_save", game("A", i + 1, 1)); }
  assert.equal(p.bak.length, 3, "the last three only");
  keepBackup(p, "sop_profile", "x"); assert.equal(p.bak.length, 3, "only the governorship save");
});
test.after(() => { srv.kill(); mock.close(); fs.rmSync(data, { recursive: true, force: true }); });
