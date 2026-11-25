/* The court names the project, stops it, and its bank calls in the loan (owner, 25 Nov 2026: "which road… if I named
   it Ikwo Road it should appear as such… if the court says the project should be stopped it's stopped, and the
   syndicates or banks send a letter asking for repayment, otherwise they escalate…"). Run: npm run build:game, then
   node tests/e2e/court-loan.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
check(await g.page.evaluate(() => window.SOP.policyTest("roads")), "a road programme is started"); await g.wait(1500);
for (let i = 0; i < 6 && await g.click(/^(Okay|Got it|Continue|Close|Later)$/); i++) await g.wait(500);
check(await g.page.evaluate(() => window.SOP.injunctionTest(null, 0, "Ikwo Road")) === "Ikwo Road", "the court halts a road you named"); await g.wait(1200);
const t = (await g.txt()).replace(/\s+/g, " ");
check(/The court halts the Ikwo Road/.test(t) && /sued to stop the Ikwo Road/.test(t), "it names Ikwo Road, not the programme");
await g.page.evaluate(() => { const d = [...document.querySelectorAll("div")].filter(x => /^✅ Obey the court$/.test(x.textContent.trim())).pop(); d && d.parentElement.click(); }); await g.wait(1500);
const w = await g.page.evaluate(() => window.SOP.worksNow());
check(w.projects.some(p => p.id === "p_ikwo" && p.status === "abandoned" && p.courtStopped), "Ikwo Road is stopped");
check(w.recalls.some(r => r.key === "loan:p_ikwo:bank" && r.stage === "due"), "its loan falls due");
for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(500);
// Next year: the bank's letter.
let L = null; const grab = async () => { if (L) return; try { L = await g.page.evaluate(() => (window.SOP.lettersTest() || []).find(x => /^sc#recall_/.test(x.key))) || null; } catch (e) {} };
await playUntil(g, () => !!L, { max: 300, onStep: grab });
check(!!L, "the bank writes the next year");
console.log("  " + (L && L.title) + " · " + (L && L.body));
check(L && /The court stopped Ikwo Road: repay what was drawn/.test(L.title) && /You drew ₦[\d.]+[MB]; with ₦[1-9][\d.]*[MB] of interest, ₦[\d.]+[MB] is owed now\./.test(L.body), "it asks for what was drawn plus interest");
check(L && /Federal Ministry of Finance/.test(L.body), "and says it will go to the Federal Ministry of Finance if you do not pay");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
