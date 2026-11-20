/* Salary arrears can be paid any time from the Treasury (a player: "I can't find where to pay salaries I owe").
   Run: npm run build:game, then node tests/e2e/arrears.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.stc = { ...sv.stc, arrears: 2 }; sv.s = { ...sv.s, cash: 6 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
await g.click(/^Continue/); await g.wait(2000);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1000);
for (let i = 0; i < 6 && await g.click(/^(Got it|Okay|Continue|Not now)$/); i++) await g.wait(400);
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "tre" }, "*")); await g.wait(900);
const card = await g.page.evaluate(() => (document.querySelector("[data-sop-arrears]") || {}).innerText || "");
check(/Workers are owed 2 months/.test(card) && /Pay one month/.test(card) && /Clear all arrears/.test(card), "the Treasury shows the arrears with two ways to pay");
const c0 = await g.page.evaluate(() => window.SOP.s.cash);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-arrears] button")].find(x => /Clear all/.test(x.textContent)); b.click(); }); await g.wait(900);
const after = await g.page.evaluate(() => ({ cash: window.SOP.s.cash, card: !!document.querySelector("[data-sop-arrears]"), log: (window.SOP.logs || [])[0] && window.SOP.logs[0].tx }));
check(after.cash < c0 && !after.card, "clearing them pays from the bank and the card goes (" + c0 + " → " + after.cash + ")");
check(/All salary arrears cleared/.test(after.log || ""), "the log says so");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); console.log(fails ? fails + " failed" : "ALL PASSED"); process.exit(fails ? 1 : 0);
