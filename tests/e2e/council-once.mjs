/* The State Economic Council remembers (owner, 22 Nov 2026, the debt question and the first sitting came back after
   being answered): from the calendar letter, answer the debt and pick an export plan; the next sitting asks neither
   again. Run: npm run build:game, then node tests/e2e/council-once.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv0 = JSON.parse(YEAR1.sop_save); sv0.s = { ...(sv0.s || {}), cash: 40 };
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(sv0) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /On this year's calendar/.test(t), { max: 260, prefer: [/^Later$/] });
check(r.ok, "the calendar letter arrives");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /On this year's calendar/.test(x.textContent)); b && b.click(); }); await g.wait(900);
await g.click(/^Convene the State Economic Council/); await g.wait(1500);
const council = () => g.page.evaluate(() => (document.querySelector(".lv-council") || {}).innerText || "");
const veil = async () => { for (let i = 0; i < 5; i++) { if (!(await g.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; }))) break; await g.wait(500); } };
let t = await council();
if (/How do we pay the debt/.test(t)) {
  await g.page.evaluate(() => { const b = [...document.querySelectorAll(".lv-council button")].find(x => /^Spread it over 4 years/.test(x.textContent.trim())); b && b.click(); }); await g.wait(900); await veil(); await g.wait(900);
  t = await council();
}
check(/First sitting/.test(t) || /How will .* sell/.test(t), "the Council's first sitting: how to sell the state's produce");
await g.page.evaluate(() => { const b = [...document.querySelectorAll(".lv-council button.opt, .lv-council button")].find(x => /^Aggregate and ship/.test(x.textContent.trim())); b && b.click(); }); await g.wait(1200); await veil();
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check(sv.stc && sv.stc.exports && sv.stc.exports.plan, "the export plan is saved (" + (sv.stc && sv.stc.exports && sv.stc.exports.plan) + ")");
// Sit again, as the State tab's button would.
await g.page.evaluate(() => { const c = document.querySelector(".lv-council"); if (c) { const b = [...c.querySelectorAll("button")].pop(); b && b.click(); } }); await g.wait(500);
await g.page.evaluate(() => window.SOP.councils.econ()); await g.wait(900);
t = await council();
check(!/How do we pay the debt/.test(t) && !/First sitting/.test(t), "the next sitting asks neither the debt nor the first-sitting question again");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
