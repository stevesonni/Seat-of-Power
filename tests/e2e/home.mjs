/* Home and Start over: mid-game the menu leads home (the game saved, Continue offered),
   and Start over deletes the politician and the records, then starts clean.
   Run: npm run build:game, then node tests/e2e/home.mjs */
import { open, campaign, takeOffice } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve(); let fails = 0;
const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { test: { win: true } });
check((await campaign(g)) === "won", "first election won (test switch)");
await takeOffice(g);
const yes = () => g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(x => x.offsetParent).find(x => /^(Delete and start over|Go to the home screen)$/.test(x.textContent.trim())); b && b.click(); return !!b; });
await g.page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Menu"]')].find(x => x.offsetParent); b && b.click(); }); await g.wait(500);
const tap = (src) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].filter(x => x.offsetParent).find(x => new RegExp(src).test(x.textContent.trim())); b && b.click(); return !!b; }, src);
check(!(await g.buttons()).some(b => /Wiki page|The Constitution|^📊 Standing/.test(b)), "no Wiki page, Constitution or Standing in the menu");
check(await tap("^🏠 Home screen"), "the governor's menu has Home screen"); await g.wait(1200);
check(/Continue/.test(await g.txt()), "home screen offers Continue: the game was saved");
await g.page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Menu"]')].find(x => x.offsetParent); b && b.click(); }); await g.wait(500);
check(await tap("^Start over"), "the title menu has Start over"); await g.wait(500);
check(await yes(), "Start over asks first"); await g.wait(2500);
const left = await g.page.evaluate(() => ["sop_save", "sop_profile", "sop_record"].map(k => localStorage.getItem(k)).filter(v => v));
check(left.length === 0, "the save, the politician and the record are gone (" + left.length + " left)");
const t = await g.txt();
check(!/Continue/.test(t), "no Continue after starting over");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
