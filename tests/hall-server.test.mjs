/* The Hall's endpoints on the real server, with a stand-in for Vatar's
   session check: one entry a day, ranked with tiers, the week locked until
   it ends, and the played-again share. */
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mock = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { const s = JSON.parse(b || "{}").session; res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ playerId: "p_" + s, username: "user_" + s, exp: Date.now() + 6e5 })); }); });
await new Promise(r => mock.listen(0, r));
const port = 18000 + Math.floor(Math.random() * 1000), data = fs.mkdtempSync(path.join(os.tmpdir(), "hall-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, FREE_CAREERS: "1", VATAR_SECRET: "vtr_test_x", VATAR_API: "http://127.0.0.1:" + mock.address().port }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const call = (p, session, body = {}) => fetch("http://127.0.0.1:" + port + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session, ...body }) }).then(r => r.json());

test("one entry a day, ranked, with tiers", async () => {
  assert.equal((await call("/api/hall/enter", "ada", { score: 990, grade: "A", state: "Enugu", title: "Two terms" })).ok, true);
  const again = await call("/api/hall/enter", "ada", { score: 1200 });
  assert.equal(again.ok, false); assert.equal(again.already, true); assert.equal(again.entry.score, 990);
  const bo = await call("/api/hall/enter", "bo", { score: 700 });
  assert.equal(bo.rank, 2); assert.equal(bo.tier, "bronze");
  const t = await call("/api/hall/today", "bo");
  assert.deepEqual(t.top.map(e => [e.name, e.score, e.tier, e.me]), [["user_ada", 990, "gold", false], ["user_bo", 700, "bronze", true]]);
  assert.equal(t.entered, true); assert.equal(t.you.rank, 2);
});
test("this week's board is locked; last week's opens", async () => {
  const now = await call("/api/hall/week", "ada", { week: 99999 });
  assert.equal(now.locked, true);
  const last = await call("/api/hall/week", "ada");
  assert.equal(last.locked, false); assert.ok(Array.isArray(last.top));
});
test("finished careers give the played-again share", async () => {
  await call("/api/hall/finish", "ada"); await call("/api/hall/finish", "ada"); await call("/api/hall/finish", "bo");
  const r = await call("/api/hall/finish", "cy");
  assert.equal(r.players, 3); assert.equal(r.pct, 33);
});
test("a player's company is seen by others, and the owner hears how often it was used", async () => {
  const reg = await call("/api/company/register", "ada", { name: "Adaora Clinic Builders", sector: "health" });
  assert.equal(reg.ok, true, JSON.stringify(reg));
  const seen = await call("/api/company/list", "bo");
  assert.ok(seen.list.some(c => c.name === reg.company.name), "another player sees it");
  await call("/api/company/hire", "bo", { id: reg.company.id }); await call("/api/company/hire", "cy", { id: reg.company.id });
  const mine = (await call("/api/company/list", "ada")).mine;
  assert.equal(mine.uses, 2); assert.equal(mine.hires, 2); assert.equal(mine.told, 0);
  await call("/api/company/told", "ada");
  assert.equal((await call("/api/company/list", "ada")).mine.told, 2);
});
test.after(() => { srv.kill(); mock.close(); fs.rmSync(data, { recursive: true, force: true }); });
