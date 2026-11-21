/* A bill you send comes back to your desk to sign or veto (owner, 21 Nov 2026). The year-one fixture: reach the
   policy step, open Bills, send one; when the House passes it, the assent desk opens; signing makes it law.
   node tests/e2e/assent.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv0 = JSON.parse(YEAR1.sop_save); sv0.s = { ...(sv0.s || {}), pStab: 80, cash: 40 };
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(sv0) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /Executive orders/.test(t) && /Programmes/.test(t), { max: 160, prefer: [/^Later$/] });
check(r.ok, "reached the policy step");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[role=tab]")].find(x => x.textContent.trim() === "Programmes"); b && b.click(); }); await g.wait(500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Show all \d+ programmes/.test(x.textContent.trim())); b && b.click(); }); await g.wait(500);
check(/Build Ultramodern Classroom Blocks/.test(await g.page.evaluate(() => document.body.innerText)), "the programmes include ultramodern classroom blocks");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[role=tab]")].find(x => x.textContent.trim() === "Bills"); b && b.click(); }); await g.wait(600);
const nm = await g.page.evaluate(() => { const c = [...document.querySelectorAll("div")].filter(d => /Likely to pass/.test(d.textContent) && d.onclick !== undefined && d.children.length > 2 && d.textContent.length < 600).pop(); if (!c) return null; const n = c.querySelector("div[style*='font-weight: 600']"); c.click(); return n ? n.textContent : c.textContent.slice(0, 40); });
check(!!nm, "sent a bill to the House (" + nm + ")"); await g.wait(1200);
for (let i = 0; i < 2 && !(await g.page.$("[data-sop-assent]")); i++) { await g.click(/^(Okay|Got it|Continue)$/); await g.wait(500); }
const desk = await g.page.evaluate(() => { const e = document.querySelector("[data-sop-assent]"); return e ? e.innerText : ""; });
check(/On your desk for assent/i.test(desk) && /not law until you sign/.test(desk), "the passed bill comes back to the desk for assent");
check(!/BILL SIGNED/.test(await g.page.evaluate(() => localStorage.getItem("sop_save") || "")), "it is not law before you sign");
await g.page.evaluate(() => document.querySelector("[data-sop-assent-sign]").click()); await g.wait(1500);
check(!(await g.page.$("[data-sop-assent]")), "signing closes the desk");
await g.wait(2500);
const t = await g.txt();
check(/Signs .* Into Law|signed into law|BILL SIGNED/i.test(t + (await g.page.evaluate(() => localStorage.getItem("sop_save") || ""))), "signed: the bill is law");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
