/* At most 8 letters a year: past that, news is merged into the nearest similar letter, and a decision makes room by
   merging two news letters. Nothing is lost. Run: npm run build:game, then node tests/e2e/mail-cap.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, test: { mailcap: 1 } });
await g.click(/^Continue/); await g.wait(2000);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
const before = await g.page.evaluate(() => window.SOP.mailNow().length);
const note = (i, kind) => ({ key: "test_note_" + i, live: true, kind, stakes: 1, lines: [{ ok: true, line: "News item " + i }], tip: ["Sender " + i, "./art/characters/market-trader.webp", "Note " + i, "Line " + i] });
await g.page.evaluate((ls) => window.SOP.postTest(ls), Array.from({ length: 12 }, (_, i) => note(i, i % 2 ? "investment" : "budget"))); await g.wait(600);
const box = await g.page.evaluate(() => window.SOP.mailNow());
const notes = box.filter(l => /^test_note_/.test(l.key)), total = notes.reduce((a, l) => a + Math.max(1, l.lines), 0);
check(box.length <= Math.max(8, before), "the mailbox holds at most 8 letters this year (" + box.length + ", " + before + " were already there)");
check(total >= 12 && notes.some(l => l.merged > 0), "the extra news is merged into similar letters: all 12 items are kept (" + total + " lines)");
await g.page.evaluate(() => window.SOP.postTest([{ key: "test_decision", live: true, kind: "budget", stakes: 3 }])); await g.wait(600);
const box2 = await g.page.evaluate(() => window.SOP.mailNow());
check(box2.some(l => l.key === "test_decision") && box2.length <= box.length, "a decision over the cap still arrives, and two news letters merge to make room");
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
