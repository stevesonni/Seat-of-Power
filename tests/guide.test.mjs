// The guide (game/systems/guide.js) and its public pages (server/wiki.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { QUICK, TOPICS, HOWTO, glossaryList, searchGuide, GUIDE_UPDATED } from "../game/systems/guide.js";
import { wikiPage } from "../server/wiki.mjs";

test("how to play in 5 minutes, topics with sections, quick answers that point at real topics", () => {
  assert.equal(QUICK.length, 5);
  assert.ok(TOPICS.length >= 10 && TOPICS.every(t => t.id && t.icon && t.t && t.d && t.s.length >= 3 && t.s.every(x => x.h && (x.p || (x.l && x.l.length)))));
  const ids = new Set([...TOPICS.map(t => t.id), "glossary"]);
  assert.ok(HOWTO.length >= 35 && HOWTO.every(h => h.q.endsWith("?") && h.a && ids.has(h.topic)), "every quick answer points at a real topic");
  assert.equal(new Set(TOPICS.map(t => t.id)).size, TOPICS.length);
  assert.match(GUIDE_UPDATED, /\d{1,2} [A-Z][a-z]{2} 20\d\d/);
});
test("plain words: no builder's names and none of the old guide's stale facts", () => {
  const all = JSON.stringify({ QUICK, TOPICS, HOWTO });
  for (const bad of [/Engine/, /Permanent Secretaries/, /20 projects in 3 tiers/, /Twitter|\bX\.com/, /—/]) assert.ok(!bad.test(all), "found " + bad);
});
test("the glossary lists each meaning once; search finds topics, answers and words", () => {
  const G = glossaryList(); assert.ok(G.length > 50); assert.equal(new Set(G.map(g => g.mean)).size, G.length);
  assert.ok(searchGuide("stalled project").some(r => r.kind === "topic" && r.topic === "projects"));
  assert.ok(searchGuide("faac").some(r => r.kind === "glossary"));
  assert.ok(searchGuide("supreme court").some(r => r.topic === "courts"));
  assert.deepEqual(searchGuide(""), []); assert.deepEqual(searchGuide("zzzzqqq"), []);
});
test("every wiki page renders, and every link inside the guide goes to a real page", () => {
  const pages = ["/wiki", "/wiki/how-to", "/wiki/glossary", "/wiki/search", ...TOPICS.map(t => "/wiki/" + t.id)];
  for (const p of pages) { const h = wikiPage(p, new URLSearchParams("q=budget")); assert.ok(h && h.startsWith("<!doctype html>"), p);
    for (const [, href] of h.matchAll(/href="(\/wiki[^"]*)"/g)) assert.ok(wikiPage(href.split("?")[0], new URLSearchParams()), p + " links to " + href); }
  assert.equal(wikiPage("/wiki/nope"), null); assert.equal(wikiPage("/wikipedia"), null);
  assert.match(wikiPage("/wiki/search", new URLSearchParams("q=<script>")), /&lt;script&gt;/, "the query is escaped");
});
test("the server serves /wiki and counts helpful votes", async () => {
  const port = 19500 + Math.floor(Math.random() * 400), data = fs.mkdtempSync(path.join(os.tmpdir(), "wiki-"));
  const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "" }, stdio: "ignore" });
  try {
    for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
    const u = (p) => "http://127.0.0.1:" + port + p;
    const r = await fetch(u("/wiki")); assert.equal(r.status, 200); assert.match(await r.text(), /How to play in 5 minutes/);
    assert.equal((await fetch(u("/wiki/courts"))).status, 200); assert.equal((await fetch(u("/wiki/nope"))).status, 404);
    const vote = (b) => fetch(u("/api/guide-vote"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
    assert.equal((await vote({ page: "money", yes: true })).status, 200); assert.equal((await vote({ page: "hack", yes: true })).status, 400);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(data, "guide-votes.json"), "utf8")).money, { yes: 1, no: 0 });
  } finally { srv.kill(); fs.rmSync(data, { recursive: true, force: true }); }
});
