/* Small works go through the contractors (owner, 23 Nov 2026: "let projects needing contractors go through contractors.
   We have many click and click"). A quick win opens the tender; you award it; it pays off when it is finished, as well
   as the contractor did it. Run: npm run build:game, then node tests/e2e/works.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const SH = process.env.SHOTS;
const WORKS = /^(Fix the streetlights|Repaint and restock|Clear the blocked drains|Repair 20 broken|Patch the potholes)/;
const g = await open(srv.port, { exp: { wait: 1 }, save: Y1 });
await g.click(/^Continue/); await g.wait(2000);
const r = await playUntil(g, t => /Three jobs you can finish this year/.test(t) && WORKS.test((t.match(/\n(Fix the streetlights|Repaint and restock|Clear the blocked drains|Repair 20 broken|Patch the potholes)[^\n]*/) || [""])[0].trim()), { max: 400, prefer: [/^Later$/] });
check(r.ok, "the quick wins arrive, with a building job among them");
const cash0 = await g.page.evaluate(() => window.SOP.s && window.SOP.s.cash);
check(!!(await g.click(WORKS)), "pick a building job"); await g.wait(1500);
for (let i = 0; i < 3 && !/Award the contract/.test(await g.txt()); i++) { await g.click(/^(Okay|Got it|Continue|Noted)$/); await g.wait(700); }
const t = await g.txt();
if (SH) await g.page.screenshot({ path: SH + "/works-tender.png" });
check(/Award the contract/.test(t) && /Bidders/i.test(t), "it opens the tender, with the bidders");
const cash1 = await g.page.evaluate(() => window.SOP.s && window.SOP.s.cash);
check(cash1 === cash0, "nothing is paid until it is built (" + cash0 + " → " + cash1 + ")");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Award contract$/.test(x.textContent.trim()) && !x.disabled); b && b.click(); }); await g.wait(1200);
const P = await g.page.evaluate(() => (window.SOP.projects || []).find(p => p.works));
check(P && P.status === "in_progress" && P.contractorId && P.years === 1, "awarded: a one-year job with its contractor (" + (P && P.contractor) + ")");
// The year ends and it is finished: what it promised lands, as well as it was done.
await g.page.evaluate((p) => window.SOP.onDelivered({ ...p, status: "delivered", effective: .9, spentM: p.approvedM, cost: p.approvedM / 1000 }), P); await g.wait(900);
const t2 = await g.txt();
if (SH) await g.page.screenshot({ path: SH + "/works-done.png" });
check(/Finished: /.test(t2) && /How well it was done/.test(t2), "when it is finished, it says so and how well it was done");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
