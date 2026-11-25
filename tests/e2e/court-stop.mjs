/* Obeying a court order stops the programme and the work it started (owner, 25 Nov 2026: "if I comply and the court
   strikes down the project… the project is still going on, which means this is for fancy??? Also it still reads like
   raw strings"). Run: npm run build:game, then node tests/e2e/court-stop.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
// A programme with two sites under way, then the court's order against it.
check(await g.page.evaluate(() => window.SOP.policyTest("classrooms")), "a classroom programme is started"); await g.wait(1500);
for (let i = 0; i < 6 && await g.click(/^(Okay|Got it|Continue|Close|Later)$/); i++) await g.wait(500);
const nm = await g.page.evaluate(() => window.SOP.injunctionTest(null, 2)); await g.wait(1200);
console.log("  before: " + JSON.stringify(await g.page.evaluate(() => window.SOP.worksNow())));
check(!!nm, "the court halts " + nm);
const t = (await g.txt()).replace(/\s+/g, " ");
const tn = String(nm).replace(/^⭐\s*/, "");
check(t.includes("has sued to stop the " + tn + ", saying the law was not followed. The High Court has ordered the work to stop until the case is heard."), "the case says who sued, why, and what the court ordered");
check(t.includes("Stop the " + tn + " now: work ends at 2 sites and the contractors leave."), "obeying says what stops: the programme and its 2 sites");
check(!/Comply Fully|Affected policy|judiciary trust|Media \+5|Triggers constitutional crisis path|S\.287 breach/.test(t), "no raw notes left on the card");
await g.page.evaluate(() => { const d = [...document.querySelectorAll("div")].filter(x => /^✅ Obey the court$/.test(x.textContent.trim())).pop(); d && d.parentElement.click(); }); await g.wait(1500);
const out = (await g.txt()).replace(/\s+/g, " ");
console.log("  right after: " + JSON.stringify(await g.page.evaluate(() => window.SOP.worksNow())));
check(/The .* has stopped\. Work has ended at 2 sites; the contractors have left\./.test(out), "the result says the programme stopped and the sites closed");
for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(500);
await g.wait(2500);
const sv = await g.page.evaluate(() => window.SOP.worksNow());
const sites = (sv.projects || []).filter(p => /^p_court_/.test(p.id));
check(sites.length === 2 && sites.every(p => p.status === "abandoned" && p.courtStopped), "both sites are closed (" + sites.map(p => p.status).join(",") + ")");
check(!(sv.pol || []).includes(nm), "the programme is gone from the active list");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
