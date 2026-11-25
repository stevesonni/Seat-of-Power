/* The agenda letter reads as one letter (owner, 25 Nov 2026: "Look at this cut and join too": "This year's share is
   due. This year's share of your promise is due."). It says the promise, this year's part, the cost and the
   question, once each. Run: npm run build:game, then node tests/e2e/agenda-letter.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.setup = { ...sv.setup, agenda: "security" };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7 });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const has = () => g.page.evaluate(() => (window.SOP.lettersTest() || []).some(x => x.key === "flagship"));
if (!(await has())) await playUntil(g, t => /YOUR AGENDA|Your agenda: Peace/i.test(t), { max: 400 });
check(await has(), "the agenda letter arrives");
check(await g.page.evaluate(() => window.SOP.openLetterTest("flagship")), "it opens"); await g.wait(900);
const t = await g.txt(), m = /Your Excellency,([\s\S]*?)Yours faithfully/.exec(t), body = m ? m[1].replace(/\s+/g, " ").trim() : "";
console.log("  " + body);
check(/When you took office, you promised to equip 2,000 community guards, a part of it every year\./.test(body), "it states the promise once");
check(/This year's part is [\d,]+ community guards trained and equipped in /.test(body), "it says what this year's part is");
check(/It will cost about ₦[\d.]+B\./.test(body) && /Will you see to it yourself, or leave it to your Chief of Staff\?/.test(body), "it gives the cost and asks the question");
check(!/share is due/i.test(body) && (body.match(/promise/g) || []).length === 1, "nothing is said twice");
check(!/\b(\w{3,}), \1\b/.test(body), "no town is named twice");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
