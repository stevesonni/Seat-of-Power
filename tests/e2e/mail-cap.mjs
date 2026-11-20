/* At most 8 letters a year (owner, 20 Nov 2026): letters on a broadly similar subject are combined into one
   envelope; past the year's 8 envelopes, a letter carries over to next year. Nothing is lost.
   Run: npm run build:game, then node tests/e2e/mail-cap.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, test: { mailcap: 1 } });
await g.click(/^Continue/); await g.wait(2000);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
const kinds = ["budget", "investment", "crisis", "house", "community", "diplomacy", "agenda", "briefing", "party", "labour", "econ", "travel"];
const note = (i) => ({ key: "test_note_" + i, live: true, kind: kinds[i % kinds.length], stakes: 1, lines: [{ ok: true, line: "News item " + i }], tip: ["Sender " + i, "./art/characters/market-trader.webp", "Note " + i, "Line " + i] });
await g.page.evaluate((ls) => window.SOP.postTest(ls), Array.from({ length: 12 }, (_, i) => note(i))); await g.wait(800);
const dec = Array.from({ length: 10 }, (_, i) => ({ key: "test_dec_" + i, live: true, kind: ["security", "money", "power", "nothing_" + i][i % 4], stakes: 2 }));
await g.page.evaluate((ls) => window.SOP.postTest(ls), dec); await g.wait(800);
const Y = await g.page.evaluate(() => window.SOP.mailYearNow()), box = await g.page.evaluate(() => window.SOP.mailNow().map(l => l.key)), wait = await g.page.evaluate(() => window.SOP.mailWaitNow());
console.log("  this year: " + Y.used + " envelopes used, " + Y.envelopes + " in the mailbox; " + box.length + " letters in them; " + wait.length + " carried to next year");
check(Y.used <= 8 && Y.envelopes <= 8, "no more than 8 letters (envelopes) this year");
check(box.length > Y.envelopes, "letters on a similar subject are combined into one envelope");
const all = [...Array.from({ length: 12 }, (_, i) => "test_note_" + i), ...dec.map(d => d.key)];
check(all.every(k => box.includes(k) || wait.includes(k)), "nothing is lost: every letter is in an envelope or carried over");
// Answer everything, then more letters arrive: one more envelope fits (8), then the year is full.
await g.page.evaluate(() => window.SOP.clearMailTest()); await g.wait(400);
await g.page.evaluate(() => window.SOP.postTest([{ key: "late_a", live: true, kind: "crisis", stakes: 2 }])); await g.wait(500);
await g.page.evaluate(() => window.SOP.clearMailTest()); await g.wait(400);
await g.page.evaluate(() => window.SOP.postTest([{ key: "late_b", live: true, kind: "house", stakes: 2 }, { key: "late_c", live: true, kind: "travel", stakes: 1 }])); await g.wait(600);
const Y2 = await g.page.evaluate(() => window.SOP.mailYearNow()), box2 = await g.page.evaluate(() => window.SOP.mailNow().map(l => l.key)), wait2 = await g.page.evaluate(() => window.SOP.mailWaitNow());
console.log("  later: " + Y2.used + " used; mailbox " + box2.join(",") + "; carried " + wait2.join(","));
check(Y2.used === 8 && wait2.includes("late_b") && wait2.includes("late_c") && !box2.includes("late_b"), "once the year's 8 are used, new letters carry over to next year");
const env = await g.page.evaluate(() => { window.SOP.openLetterTest("Note 0"); return 1; }); await g.wait(500);
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
