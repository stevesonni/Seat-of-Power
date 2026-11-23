/* The money system says what it does (owner, 23 Nov 2026: "how does the state become bankrupt… the money I got didn't
   reflect in my treasury… even when the treasury has zero balance money is still being spent"). An empty Treasury
   shows what the state owes; deep debt with salaries months behind brings Abuja's bailout once, then bankruptcy.
   Run: npm run build:game, then node tests/e2e/money-honest.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 0, debt: 200, pStab: 80, app: 60 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
const toasts = []; await g.page.exposeFunction("__toast", (t) => toasts.push(t));
await g.page.evaluate(() => { window.__logs = []; window.addEventListener("sop-log", e => window.__logs.push(e.detail.tx)); });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
await g.page.evaluate(() => { const o = window.SOP_toast; window.SOP_toast = (t, k) => { window.__toast(t); o && o(t, k); }; });
// A purchase with ₦0 in the Treasury and room to borrow: it is borrowed, and the screen says so.
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, cash: 0, debt: 1 }))); await g.wait(300);
await g.page.evaluate(() => window.SOP.spendTest(.5, "The new ambulances")); await g.wait(500);
check(toasts.some(t => /Treasury was short: ₦0\.5B borrowed for the new ambulances\. Debt is now ₦1\.5B/.test(t)), "spending from an empty Treasury says it was borrowed (" + (toasts[0] || "none") + ")");
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, cash: 0, debt: 200 }))); await g.wait(300);
const strip = await g.txt();
check(/−₦\d/.test(strip), "an empty Treasury shows what the state owes, as a minus");
// Salaries four months behind on top of the debt: insolvency at the year's end.
await g.page.evaluate(() => window.SOP.stcTest(p => ({ ...p, arrears: 4 }))); await g.wait(300);
const r = await playUntil(g, t => /Bailed out by Abuja, once/.test(t), { max: 500, prefer: [/^Later$/] });
check(r.ok, "the first time, Abuja bails the state out, with conditions");
for (let i = 0; i < 3 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(300);
await g.page.evaluate(() => window.SOP.stcTest(p => ({ ...p, arrears: 4 }))); await g.wait(300);
const r2 = await playUntil(g, t => /bankrupt/i.test(t) && !/Bailed out/.test(t), { max: 500, prefer: [/^Later$/] });
if (!r2.ok) console.log("  state:", JSON.stringify(await g.page.evaluate(() => ({ t: window.SOP.turn, arr: window.SOP.stc.arrears, bo: window.SOP.stc.bailout, debt: window.SOP.s.debt, igr: window.SOP.s.igr, faac: window.SOP.s.faac }))), "| last logs:", (await g.page.evaluate(() => (window.__logs || []).slice(-6))).join(" / ").slice(0, 600));
check(r2.ok, "the second time, the state is bankrupt");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
