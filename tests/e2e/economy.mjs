/* The economy page (a player's feedback, 27 Nov 2026): real GDP, the sectors in measures people know, the credit
   rating, and the industries the state can build. Run: npm run build:game, then node tests/e2e/economy.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue|Close|Later)$/); i++) await g.wait(400);
await g.page.evaluate(() => window.SOP.navTest("econ")); await g.wait(1200);
const ov = await g.page.$("[data-sop-econ-overview]"); check(!!ov, "the Economy page opens with the overview");
const t = (await g.txt()).replace(/\s+/g, " ");
console.log("  " + (t.match(/GDP, Ogun.{0,200}/) || [""])[0]);
check(/GDP, Ogun ₦\d+(\.\d)? trillion/.test(t) && /8th of 36 states/.test(t) && /BudgIT's 2021 state estimates \(this state's figure estimated from its rank\)/.test(t), "Ogun's GDP from the published figures, its rank, and the source");
check(/Credit rating \(Agusto & Co\.\) (AA|A|BBB|BB|B|CCC)/.test(t), "the credit rating");
check(await g.page.$$eval("[data-sop-sector]", x => x.length) === 6 && /Children out of school/.test(t) && /Doctors per 10,000 people/.test(t) && /Main crops cocoa, cassava/.test(t) && /Grid power a day/.test(t), "six sectors in measures people know, with Ogun's own crops");
check(/Industries Ogun can build/.test(t) && /Cassava processing plant/.test(t) && /Cocoa processing plant/.test(t) && /Cement plant/.test(t), "Ogun's industries: cassava, cocoa, cement");
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + "/economy.png", fullPage: false });
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-econ-overview] button")].find(x => /^Build/.test(x.textContent.trim())); b && b.click(); }); await g.wait(1500);
const t2 = (await g.txt()).replace(/\s+/g, " ");
check(/Who owns the (cassava processing plant|cocoa processing plant|cement plant)\?/.test(t2) && /The state builds and runs it/.test(t2) && /A partnership with an investor/.test(t2), "Build asks who owns it: the state, a partnership, or the investor");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
