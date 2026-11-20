/* The end-of-year screen's "Full year review" opens a sheet with the year's events and meters, and the phone's
   Back closes it instead of leaving the game (a player lost their place here, 20 Nov 2026).
   Run: npm run build:game, then node tests/e2e/year-review.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1 });
await g.click(/^Continue/); await g.wait(2000);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
const r = await playUntil(g, t => /The year is done/.test(t) && /Full year review/.test(t), { max: 200 });
check(r.ok, "the year ends on the year-end screen");
await g.page.evaluate(() => window.scrollTo(0, 99999)); await g.wait(300);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Full year review/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const sheet = await g.page.evaluate(() => { const e = document.querySelector("[data-testid=year-full]"); if (!e) return null; const r = e.getBoundingClientRect(); return { text: e.innerText, onScreen: r.bottom > 0 && r.top < innerHeight }; });
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/year-full.png" });
check(!!sheet && sheet.onScreen, "the review opens on screen, even after scrolling down");
check(!!sheet && /Approval/.test(sheet.text) && /Corruption/.test(sheet.text) && sheet.text.split("\n").length > 8, "it lists the meters and the year's events");
const url0 = g.page.url();
await g.page.goBack(); await g.wait(800);
const after = await g.page.evaluate(() => ({ sheet: !!document.querySelector("[data-testid=year-full]"), done: /The year is done/.test(document.body.innerText) }));
check(g.page.url() === url0 && !after.sheet && after.done, "Back closes the review and stays on the year-end screen");
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
await g.browser.close(); srv.close(); console.log(fails ? fails + " failed" : "all passed"); process.exit(fails ? 1 : 0);
