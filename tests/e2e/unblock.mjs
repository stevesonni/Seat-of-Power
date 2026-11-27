/* The adviser's "Unblock…" works (owner, 27 Nov 2026: "Unblock Patch the potholes on the busiest road… many times I
   click on it, it doesn't work"). A suspended site: the adviser says Resume, the button opens that project, and the
   project has a Resume button that restarts the work. Run: npm run build:game, then node tests/e2e/unblock.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
// A real small-works project, suspended part way.
await g.page.evaluate(() => { const P = window.SOP_SYS.makeProject({ id: "w_e2e", title: "Patch the potholes on the busiest road", type: "potholes", qty: 1, lga: "Abeokuta North", lgas: ["Abeokuta North"], approvedM: 450, thisYearM: 450, year: 1, decision: "Small works." });
  window.SOP.projTest({ ...P, status: "suspended", contractorId: "kestrel", spentM: 100, startYear: 1, decisions: [...(P.decisions || []), { year: 1, text: "Suspended." }] }); });
await g.page.evaluate(() => window.SOP.navTest("gov")); await g.wait(800);
for (let i = 0; i < 6; i++) { if (/Resume Patch the potholes/.test(await g.txt())) break; await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Got it|Okay|Later)$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(600); }
check(/Resume Patch the potholes on the busiest road/.test(await g.txt()), "the adviser asks you to resume the suspended project");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Open the project/.test(x.textContent.trim())); b && b.click(); }); await g.wait(1200);
check(!!(await g.page.$("[data-sop-resume]")), "the button opens that project, with Resume the work");
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + "/unblock.png" });
await g.page.evaluate(() => document.querySelector("[data-sop-resume]").click()); await g.wait(1200);
const t2 = (await g.txt()).replace(/\s+/g, " ");
check(/UNDER CONSTRUCTION Patch the potholes/.test(t2) && !(await g.page.$("[data-sop-resume]")), "Resume restarts the work: under construction again");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
