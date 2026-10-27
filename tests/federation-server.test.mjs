/* Linked governments on the real server: a President invites friends'
   governorships; grants and federal projects reach one state each year;
   a governor asks and the President answers; the Governors' Forum votes
   on the President's proposal and closes with the year; a dropped state
   can look but not act. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const port = 19100 + Math.floor(Math.random() * 800), data = fs.mkdtempSync(path.join(os.tmpdir(), "fed-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "" }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const fed = (op, body) => fetch("http://127.0.0.1:" + port + "/api/fed/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, ...(await r.json()) }));
test.after(() => srv.kill());

test("a President and friends' governorships", async () => {
  const F = await fed("create", { presName: "Ada Okafor", startYear: 2031 });
  const P = { code: F.code, key: F.presKey };
  assert.equal((await fed("invite", { code: F.code, invite: F.invite })).pres, "Ada Okafor");
  const o = await fed("join", { code: F.code, invite: F.invite, name: "Wale Adegoke", state: "Ogun" });
  const k = await fed("join", { code: F.code, invite: F.invite, name: "Musa Bello", state: "Kano" });
  assert.equal((await fed("join", { code: F.code, invite: F.invite, name: "Someone", state: "Ogun" })).status, 409, "one governor per state");
  const O = { code: F.code, key: o.key }, K = { code: F.code, key: k.key };
  let pv = (await fed("view", P)).fed;
  assert.deepEqual(pv.events.map(e => [e.kind, e.state]), [["joined", "Ogun"], ["joined", "Kano"]]);
  await fed("seen", { ...P, ids: pv.events.map(e => e.id) });
  // Year 1: the forum opens; a grant to Ogun, once a year.
  await fed("publish", { ...P, year: 1, snap: { app: 55 } });
  assert.equal((await fed("grant", { ...P, state: "Ogun", amountB: 3 })).amountB, 3);
  assert.equal((await fed("grant", { ...P, state: "Ogun" })).status, 409);
  let ov = (await fed("view", O)).fed;
  assert.equal(ov.events[0].kind, "grant"); assert.equal(ov.events[0].amountB, 3);
  assert.equal(ov.govs.find(g => g.state === "Ogun").fg, 55);
  assert.equal((await fed("view", K)).fed.events.length, 0, "Kano sees nothing of Ogun's grant");
  // Kano asks for a road; the President agrees and pays.
  await fed("ask", { ...K, kind: "road", note: "The Kano–Maiduguri road" });
  assert.equal((await fed("ask", { ...K, kind: "grant" })).status, 409, "one open request at a time");
  pv = (await fed("view", P)).fed;
  const ask = pv.events.find(e => e.kind === "ask");
  assert.equal(ask.state, "Kano");
  assert.equal((await fed("answer", { ...P, id: ask.rid, yes: true })).costB, 3);
  assert.equal((await fed("view", K)).fed.events.find(e => e.kind === "project").project, "road");
  // The forum: Ogun for, Kano against, a tie fails; it closes when the President's year turns.
  await fed("vote", { ...O, pos: "for" }); await fed("vote", { ...K, pos: "against" });
  await fed("publish", { ...P, year: 2 });
  pv = (await fed("view", P)).fed;
  const fr = pv.events.find(e => e.kind === "forum");
  assert.deepEqual([fr.yes, fr.no, fr.passed], [1, 1, false]);
  assert.ok(pv.forum && pv.forum.year === 2, "next year's proposal is open");
  ov = (await fed("view", O)).fed;
  assert.equal(ov.events.find(e => e.kind === "forum").pos, "for");
  // Ogun is dropped: it can look, but not act.
  await fed("remove", { ...P, state: "Ogun" });
  ov = (await fed("view", O)).fed;
  assert.equal(ov.me.left, true); assert.ok(ov.events.some(e => e.kind === "removed"));
  assert.equal((await fed("vote", { ...O, pos: "for" })).status, 403);
  assert.equal((await fed("join", { code: F.code, invite: F.invite, name: "New", state: "Ogun" })).ok, true, "the state is free again");
  assert.equal((await fed("grant", { ...O, state: "Kano" })).status, 403, "only the President pays");
});
