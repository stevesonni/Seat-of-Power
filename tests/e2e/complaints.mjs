/* Public complaints in the browser, and the bigger agenda. A governor whose
   workers are owed (the year-one fixture, arrears added): the street lists
   the complaint, a tap opens it, a visit answers it and is remembered. The
   Desk shows the big moves (8 on Medium, more for a strong team) with bills
   and orders outside the count.
   node tests/e2e/complaints.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const saved = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv0 = JSON.parse(YEAR1.sop_save); sv0.stc = { ...(sv0.stc || {}), arrears: 2 }; sv0.s = { ...(sv0.s || {}), cor: .62 };
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(sv0) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /Answer ›/.test(t) && /Big moves \d+\/\d+/.test(t), { max: 120, prefer: [/^Later$/] });
check(r.ok, "the street lists complaints with Answer, and the Desk counts big moves");
const t = await g.txt();
const m = t.match(/Big moves (\d+)\/(\d+)/); check(m && +m[2] >= 8, "at least 8 big moves on Medium (" + (m && m[0]) + ")");
check(/programmes, bills & orders separate/.test(t), "programmes, bills and orders are outside the count");
check(/“Na 2 months now dem never pay us/.test(t), "the unpaid workers' complaint is on the street");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Answer ›/.test(x.textContent) && /never pay us/.test(x.textContent)); b && b.scrollIntoView({ block: "center" }); b && b.click(); }); await g.wait(700);
const card = await g.txt();
check(/A complaint/.test(card) && /What they want: pay the salaries owed/.test(card), "a tap opens the complaint: who, and what would fix it");
check(/Fix it: pay the salaries owed/.test(card), "the real fix is on the card");
const picked = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option, button.opt")].find(x => /Answer them on the radio/.test(x.textContent)); b && b.click(); return !!b; }); await g.wait(900);
check(picked, "answer it on the radio");
for (let i = 0; i < 4 && await g.click(/^(Continue|Okay|Got it|Close)$/); i++) await g.wait(400);
await g.wait(2600);
const sv = await saved(g);
check(sv.stc && sv.stc.complaints && sv.stc.complaints.arrears && sv.stc.complaints.arrears.how === "talk", "the answer is remembered");
check(/✓ Answered/.test(await g.txt()), "the street shows it answered");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /✓ Answered/.test(x.textContent) && /never pay us/.test(x.textContent)); b && b.scrollIntoView({ block: "center" }); b && b.click(); }); await g.wait(700);
const again = await g.txt();
check(/already answered with words/.test(again) && !/Answer them on the radio/.test(again), "words only once: after that, only the fix");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option, button.opt")].find(x => /^Fix it/.test(x.textContent.trim())); b && b.click(); }); await g.wait(900);
check(/Treasury|treasury|In the bank|bank/.test(await g.txt()), "the fix opens the treasury");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
