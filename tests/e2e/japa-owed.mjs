/* Money a contractor fled with stays owed after a new contractor takes over (owner, 23 Nov 2026: "this is the second
   time money is being japaed… I got nothing in the visit to the President or even a letter on how to recover it").
   The project keeps its "Get the money back" button, the year brings a letter with the way to recover it, and the
   firm that fled never bids again. Run: npm run build:game, then node tests/e2e/japa-owed.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
let n = 0; await playUntil(g, () => n > 2, { max: 150, prefer: [/^Later$/], onStep: async () => { n = await g.page.evaluate(() => (window.SOP.ministries || []).filter(m => m.minister).length); } });
// A road whose first contractor fled to Dubai with ₦300M; a new contractor is already on site.
await g.page.evaluate(() => {
  const ms = window.SOP.ministries.filter(m => m.minister);
  window.SOP.setProjects(ps => [...(ps || []), { id: "jp1", title: "Ota–Idiroko Road", type: "road", sector: "roads", ministryId: ms[0].id, qty: 10, unit: "km", lgas: [], estimateM: 2000, approvedM: 2000, spentM: 600, builtM: 300, progress: 15, status: "in_progress", alloc: {}, startYear: 1, years: 2,
    contractor: "Second Builders", contractorId: "c_new", fled: false, fledId: "c_gone", fledFirm: "Gone Ltd", fledTo: "Dubai", fledM: 300, decisions: [{ year: 1, text: "The contractor took the mobilisation fee (₦300M) and fled to Dubai." }, { year: 1, text: "Replaced the contractor; handover adds ₦20M." }], events: [] }]);
}); await g.wait(500);
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "prj" }, "*")); await g.wait(800);
await g.page.evaluate(() => { const c = [...document.querySelectorAll("*")].find(e => e.children.length < 3 && /^Ota–Idiroko Road$/.test((e.textContent || "").trim())); c && c.click(); }); await g.wait(600);
check(!!(await g.page.$("[data-sop-japa-get]")), "after a new contractor took over, the project still offers: get the money back from Dubai");
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "gov" }, "*")); await g.wait(500);
const r = await playUntil(g, t => /₦300M is still in Dubai/.test(t), { max: 500, prefer: [/^Later$/] });
check(r.ok, "the year brings a letter: the money is still in Dubai");
const t = await g.txt();
check(/only the Federal Government can/i.test(t) && /Aso Rock/.test(t) && /Let the money go/.test(t), "the letter says how to recover it: ask the President at Aso Rock (or let it go)");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
