/* Each state's own programmes and bills (owner, 22 Nov 2026: "rural electrification in Abia is not the same as in
   Lagos"). The year-one fixture is Ogun, which runs its own power market: rural electrification asks who builds and
   runs the mini-grids; the answer carries into the project plan. Ogun's bills are its own: the grazing law it already
   has becomes the law that enforces it. Run: npm run build:game, then node tests/e2e/local-state.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv0 = JSON.parse(YEAR1.sop_save); sv0.s = { ...(sv0.s || {}), pStab: 80, cash: 60 };
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(sv0) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /Executive orders/.test(t) && /Programmes/.test(t), { max: 160, prefer: [/^Later$/] });
check(r.ok, "reached the policy step");
const tab = (nm) => g.page.evaluate((nm) => { const b = [...document.querySelectorAll("button[role=tab]")].find(x => x.textContent.trim() === nm); b && b.click(); }, nm);
await tab("Programmes"); await g.wait(500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Show all \d+ programmes/.test(x.textContent.trim())); b && b.click(); }); await g.wait(500);
const local = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-local]")].map(e => e.innerText));
check(local.some(t => /In Ogun:/.test(t) && /regulates its own electricity market/.test(t)), "the electrification card says what is different in Ogun (" + (local[0] || "none") + ")");
check(local.some(t => /Amotekun/.test(t)), "the security corps is Ogun's own: Amotekun");
// Bills: Ogun's own.
await tab("Bills"); await g.wait(600);
const bills = await g.txt();
await tab("Programmes"); await g.wait(500);
check(/Anti-Open Grazing Enforcement Law/.test(bills) && /2021/.test(bills), "Ogun banned open grazing in 2021: the bill now enforces it");
check(/Family Courts Law/.test(bills) && /Sexual Assault Referral Centres Law/.test(bills), "laws Ogun has: the bills fund them");
check(/Electricity Consumer Protection Law/.test(bills) && !/State Electricity Market Law/.test(bills), "Ogun already runs its power market: a consumer law, not a market law");
check(/Revenue Administration Law/.test(bills) && !/Host Communities Trust Law/.test(bills), "no oil trust in Ogun");
// Open rural electrification: the local question comes first.
await g.page.evaluate(() => { const c = [...document.querySelectorAll("[data-sop-local]")].find(e => /electricity market/.test(e.innerText)); c && c.closest("div[style*='padding']").click(); }); await g.wait(800);
const ask = await g.page.evaluate(() => (document.querySelector("[data-sop-local-ask]") || {}).innerText || "");
if (process.env.SHOT) { for (let i = 0; i < 4; i++) { if (!(await g.click(/^(Got it|Okay|Continue)$/))) break; await g.wait(400); } await g.page.screenshot({ path: process.env.SHOT }); }
check(/Who builds and runs the mini-grids\?/.test(ask) && /License private developers/.test(ask) && /cheaper/i.test(ask), "the question: who builds and runs them, with the cost of each answer");
await g.page.evaluate(() => { window.__logs = []; window.addEventListener("sop-log", e => window.__logs.push(e.detail.tx)); document.querySelector("[data-sop-local-opt=private]").click(); }); await g.wait(1200);
check(!(await g.page.$("[data-sop-local-ask]")), "answering closes the question");
const t2 = await g.txt();
check(/Rural Electrification|mini-grid|power/i.test(t2) && /Read it|plan|proposal|How big|Where/i.test(t2), "the project plan opens, prefilled");
const rec = (await g.page.evaluate(() => window.__logs || [])).join(" | ");
check(/you chose to license private developers/.test(rec), "the choice is in the record");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
