import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
test("Tori's AI posts: no key means the game keeps its own posts; bad requests are refused", async () => {
  const key = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  const { makeToriAI } = await import("../server/tori-ai.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "toriai-")), ai = makeToriAI({ dataDir: dir });
  assert.equal((await ai({}, "1.1.1.1"))._code, 400);
  const r = await ai({ career: "c1", ctx: { turn: 1, st: "Ogun" } }, "1.1.1.1");
  assert.equal(r._code, 503); assert.equal(r.error, "not_configured");
  if (key) process.env.ANTHROPIC_API_KEY = key;
});
