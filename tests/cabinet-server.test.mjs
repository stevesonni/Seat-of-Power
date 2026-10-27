/* The Cabinet's endpoints on the real server: forming a government, a friend
   accepting the invite, advice routed by seat, the Governor following or
   overruling it, absences when a year closes, the budget council and a sacking. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const port = 19000 + Math.floor(Math.random() * 900), data = fs.mkdtempSync(path.join(os.tmpdir(), "cab-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "" }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const cab = (op, body) => fetch("http://127.0.0.1:" + port + "/api/cab/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, ...(await r.json()) }));
test.after(() => srv.kill());

test("a government with friends, from the invite to the end of a year", async () => {
  const g = await cab("create", { hostName: "Ada Obi", govName: "Ada Obi", state: "Enugu", startYear: 2027 });
  assert.equal(g.ok, true); assert.match(g.code, /^[A-Z2-9]{6}$/); assert.equal(Object.keys(g.invites).length, 5);
  const H = { code: g.code, key: g.hostKey };
  // The invite shows the nomination; a wrong invite does not.
  assert.equal((await cab("invite", { code: g.code, seat: "finance", invite: g.invites.finance })).seat, "finance");
  assert.equal((await cab("invite", { code: g.code, seat: "finance", invite: "nope" })).status, 403);
  const fin = await cab("join", { code: g.code, seat: "finance", invite: g.invites.finance, name: "Chinaza" });
  assert.equal(fin.ok, true);
  assert.equal((await cab("join", { code: g.code, seat: "finance", invite: g.invites.finance, name: "Someone" })).status, 403, "an invite is used once");
  const F = { code: g.code, key: fin.key };
  // Year 1: two letters, one for Finance, one for Works (no one holds Works).
  await cab("publish", { ...H, year: 1, snap: { app: 55 }, letters: [
    { id: "sc#econ_1@1", seat: "finance", kind: "econ", title: "The economy", opts: [{ id: "a", label: "Borrow" }, { id: "b", label: "Cut spending" }] },
    { id: "stall:p1@1", seat: "works", kind: "projects", title: "A stalled road", opts: [{ id: "bold", label: "Act now" }], stance: true }] });
  assert.equal((await cab("advise", { ...F, letterId: "stall:p1@1", pick: "Act now" })).status, 404, "only your own portfolio");
  assert.equal((await cab("advise", { ...F, letterId: "sc#econ_1@1", pick: "Cut spending", note: "We can't carry more debt" })).ok, true);
  let v = (await cab("view", F)).cab;
  assert.equal(v.me.seat, "finance"); assert.equal(v.letters[0].advice.by, "Chinaza"); assert.equal(v.snap.app, 55);
  assert.equal((await cab("decide", { ...H, letterId: "sc#econ_1@1", pick: "Borrow" })).followed, false);
  v = (await cab("view", H)).cab;
  assert.equal(v.seats.finance.rec.overruled, 1); assert.equal(v.seats.finance.rec.loyalty, 64);
  assert.equal((await cab("advise", { ...F, letterId: "sc#econ_1@1", pick: "Borrow" })).status, 409, "too late once signed");
  // The budget council: Finance's split must add to 100; the Governor takes it.
  assert.equal((await cab("bid", { ...F, split: { education: 50 } })).status, 400);
  assert.equal((await cab("bid", { ...F, split: { education: 15, health: 12, infrastructure: 18, security: 12, agriculture: 10, administration: 8, salaries: 18, debt: 7 } })).ok, true);
  await cab("usesplit", H);
  // Year 2: a letter for Finance left unanswered counts as absent when year 3 opens.
  await cab("publish", { ...H, year: 2, letters: [{ id: "budget@2", seat: "finance", kind: "budget", title: "The budget", opts: [{ id: "bold", label: "Act now" }], stance: true }] });
  v = (await cab("view", H)).cab; assert.equal(v.split, null, "a new year's budget starts fresh");
  await cab("publish", { ...H, year: 3, letters: [] });
  v = (await cab("view", H)).cab;
  assert.deepEqual([v.seats.finance.rec.followed, v.seats.finance.rec.absent], [1, 1]);
  // Sacked: the old key stops working and the seat has a new invite.
  const sk = await cab("sack", { ...H, seat: "finance" });
  assert.ok(sk.invite);
  assert.equal((await cab("view", F)).status, 403);
  v = (await cab("view", H)).cab; assert.equal(v.seats.finance.former[0].name, "Chinaza");
  assert.equal((await cab("publish", { ...F, year: 4 })).status, 403, "only the Governor's phone runs the year");
});
