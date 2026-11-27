/* Every adviser button does what it says (owner, 27 Nov 2026: "check the other adviser buttons too"). For each piece of
   advice the year-one save can raise: put it up (pressing Later on the ones before it), press its button, and check
   that something real happens: the right page, the project, the meeting. Run: npm run build:game, then
   node tests/e2e/adviser-buttons.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const start = async () => { const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  await g.page.evaluate(() => window.SOP.navTest("gov")); await g.wait(600); return g; };
// The adviser's line on the desk, and its buttons.
const advice = (g) => g.page.evaluate(() => { const L = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Later"); const box = L && L.parentElement && L.parentElement.parentElement; return box ? box.innerText.replace(/\s+/g, " ").slice(0, 200) : ""; });
const bring = async (g, re) => { for (let i = 0; i < 14; i++) { const a = await advice(g); if (process.env.DBG) console.log("   ·", a.slice(0, 90)); if (re.test(a)) return a; await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Got it|Okay)$/.test(x.textContent.trim())); if (b) b.click(); else { const L = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === "Later"); L && L.click(); } }); await g.wait(500); } return await advice(g); };
const press = (g, label) => g.page.evaluate((l) => { const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim().startsWith(l)); if (b) { b.click(); return true; } return false; }, label);
const navIs = (g, k) => g.page.evaluate((k) => !!document.querySelector('[data-nav="' + k + '"]') || (k === "prj" && /＋ New project/.test(document.body.innerText)), k);

{ const g = await start();
  const a = await bring(g, /Convene your ministries/); check(/Convene your ministries/.test(a), "ministries: the advice is up");
  await press(g, "Open Ministries"); await g.wait(1200); check(await navIs(g, "min"), "ministries: the button opens Ministries");
  await g.browser.close(); }
{ const g = await start();
  await g.page.evaluate(() => window.SOP.sTest({ cor: .6 })); await g.wait(400);
  const a = await bring(g, /Audit a ministry/); check(/Audit a ministry before the EFCC/.test(a), "corruption: the urgent advice shows, even with no project started (" + a.slice(0, 80) + ")");
  await press(g, "Audit a ministry"); await g.wait(1200);
  const t = await g.txt(); check(/Audit their books/.test(t) || await navIs(g, "min"), "corruption: the button opens a commissioner's meeting (or Ministries, with none appointed)");
  await g.browser.close(); }
{ const g = await start();
  await g.page.evaluate(() => { const P = window.SOP_SYS.makeProject({ id: "w_e2e", title: "Patch the potholes on the busiest road", type: "potholes", qty: 1, lga: "Abeokuta North", lgas: ["Abeokuta North"], approvedM: 450, thisYearM: 450, year: 1, decision: "Small works." });
    window.SOP.projTest({ ...P, status: "stalled", contractorId: "kestrel", spentM: 100, startYear: 1 }); }); await g.wait(400);
  const a = await bring(g, /Unblock Patch the potholes/); check(/Unblock Patch the potholes/.test(a), "stalled project: the advice is up");
  await press(g, "Open the project"); await g.wait(1200);
  const t = (await g.txt()).replace(/\s+/g, " "); check(/Replace the contractor|Restart the work|Add ₦/.test(t), "stalled project: the button opens it, with what can be done");
  await g.browser.close(); }
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
