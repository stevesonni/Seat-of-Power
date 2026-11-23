/* The last month in office (owner, 23 Nov 2026: "now if i finish, next thing i see is see results and i am out…
   how best to give closure"). A governor who finishes the term goes through six beats before the record: the
   commissioning rush, the last Executive Council, the midnight files, the farewell broadcast, and 29 May. Run: npm run build:game, then node tests/e2e/farewell.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80, app: 62 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
let n = 0; await playUntil(g, () => n > 2, { max: 150, prefer: [/^Later$/], onStep: async () => { n = await g.page.evaluate(() => (window.SOP.ministries || []).filter(m => m.minister).length); } });
// A delivered project and a half-built one, and a crooked commissioner, then the term ends.
await g.page.evaluate(() => {
  const ms = window.SOP.ministries.filter(m => m.minister), crook = ms[0];
  window.SOP.setMinistries(x => x.map(m => m.id === crook.id ? { ...m, cor: 70 } : m));
  const P = (id, title, status, progress) => ({ id, title, type: "road", sector: "roads", ministryId: ms[1].id, qty: 5, unit: "km", lgas: [], estimateM: 1000, approvedM: 1000, spentM: 600, builtM: 600, progress, status, alloc: {}, decisions: [], events: [], startYear: 1, years: 2 });
  window.SOP.setProjects(ps => [...(ps || []), P("fw_done", "Abeokuta Ring Road", "delivered", 100), P("fw_half", "Ijebu-Ode Stadium", "in_progress", 70)]);
}); await g.wait(500);
await g.page.evaluate(() => window.SOP.endTest("complete")); await g.wait(1200);
await g.page.evaluate(() => document.querySelectorAll("[data-ach]").forEach(e => e.remove()));
// Taps by selector, even under an achievement badge that pops up when the term ends.
const tap = (sel) => g.page.evaluate((sel) => { const e = document.querySelector(sel); e && e.click(); }, sel);
const tapText = (re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].filter(x => new RegExp(src).test(x.textContent.trim())).pop(); if (b) { b.click(); return true; } return false; }, re.source);
const beat = () => g.page.evaluate(() => (document.querySelector("[data-sop-farewell]") || {}).getAttribute?.("data-sop-farewell") || "");
check(await beat() === "commission", "the term ends with the commissioning rush, not the results (" + (await beat()) + ")");
const picks = await g.page.$$eval("[data-sop-farewell-pick]", e => e.map(x => x.innerText.replace(/\n/g, " ")));
check(picks.some(t => /Abeokuta Ring Road/.test(t) && /Finished/.test(t)) && picks.some(t => /Ijebu-Ode Stadium/.test(t) && /70% built/.test(t)), "finished projects to open, and a half-built one that tempts");
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/fw-1.png" });
await tap("[data-sop-farewell-pick=fw_done]"); await tap("[data-sop-farewell-pick=fw_half]"); await g.wait(200);
await tapText(/^Cut the ribbons/); await g.wait(600);
check(await beat() === "exco", "then the last Executive Council");
const ask = await g.page.$eval("[data-sop-farewell-ask]", e => e.innerText).catch(() => "");
check(/one last approval|one small thing/i.test(ask) || /last approval/.test(ask), "the crooked commissioner asks for one last approval (" + ask.slice(0, 60) + ")");
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/fw-2.png" });
await tapText(/^Sign it$/); await g.wait(500);
check(await beat() === "midnight", "then the midnight files");
await tap("[data-sop-farewell-midnight=contract]"); await g.wait(200);
await tapText(/^Sign 1 file/); await g.wait(500);
check(await beat() === "broadcast", "then the farewell broadcast");
await tap("[data-sop-farewell-tone=humble]"); await g.wait(900);
for (let i = 0; i < 3 && await tapText(/^(Okay|Got it|Continue)$/); i++) await g.wait(300);
check(await beat() === "handover", "then 29 May");
const t5 = await g.page.evaluate(() => document.querySelector("[data-sop-farewell]").innerText);
check(/takes the oath/.test(t5) && /immunity ends/i.test(t5) && /You are home/.test(t5), "the oath, the end of immunity, and home");
check(!!(await g.page.$("[data-sop-farewell-speech]")), "the successor's speech: warm, polite or a snub");
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/fw-5.png", fullPage: true });
await tapText(/^See your record/); await g.wait(1500);
check(!(await g.page.$("[data-sop-farewell]")), "then the record");
const sv2 = await g.page.evaluate(() => window.SOP.stc.farewell);
check(sv2 && sv2.done && sv2.efcc >= .15, "the midnight choices feed the EFCC (" + (sv2 && sv2.efcc) + ")");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
