/* The last government's debt is asked about once (owner, 22 Nov 2026: "this is the second time in one year that I am
   seeing this"): closing the question without an answer keeps the four-year plan, and the Council never asks again.
   Run: npm run build:game, then node tests/e2e/debt-once.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: YEAR1, seed: 11, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(2000);
const council = () => g.page.evaluate(() => (document.querySelector(".lv-council") || {}).innerText || "");
await g.page.evaluate(() => window.SOP.councils.econ()); await g.wait(800);
check(/How do we pay the debt\?/.test(await council()), "the first sitting asks how to pay the last government's debt");
// Answer it, close the result, then sit again.
await g.page.evaluate(() => { const b = [...document.querySelectorAll(".lv-council button")].find(x => /^Spread it over 4 years/.test(x.textContent.trim())); b && b.click(); }); await g.wait(900);
for (let i = 0; i < 6 && await g.page.evaluate(() => !!document.querySelector(".lv-council") && /How do we pay the debt/.test(document.querySelector(".lv-council").innerText)); i++) await g.wait(300);
for (let i = 0; i < 4; i++) { if (!(await g.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; }))) break; await g.wait(500); }
await g.page.evaluate(() => { const c = document.querySelector(".lv-council"); if (c) { const b = [...c.querySelectorAll("button")].pop(); b && b.click(); } }); await g.wait(600);
// The first budget sets up the year's accounts after you answered (the case that asked twice): it must keep the answer.
console.log("  phase:", await g.page.evaluate(() => window.SOP.phase));
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, cash: null }))); await g.wait(800);
await g.page.evaluate(() => window.SOP.councils.econ()); await g.wait(800);
const t = await council();
check(!!t && !/How do we pay the debt\?/.test(t), "the next sitting goes straight to the Council's business: the debt is not asked again");
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check(sv.stc && sv.stc.oldDebt && sv.stc.oldDebt.decided === true, "the answer is kept: the debt plan is settled");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
