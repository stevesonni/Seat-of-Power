/* A project shows its expected build time in months (a player asked how long projects should take; owner, 27 Nov
   2026: "just show Expected: 18 months"), and speeding it up halves it. Run: npm run build:game, then node tests/e2e/build-time.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
await g.page.evaluate(() => window.SOP.navTest("gov")); await g.wait(500);
const ok = await g.page.evaluate(() => window.SOP.policyTest("roads")); await g.wait(1200);
const t = (await g.txt()).replace(/\s+/g, " "), m = t.match(/Expected (\d+) months/i);
console.log("  " + (m ? m[0] : t.slice(0, 300)));
check(ok && m && +m[1] > 0 && +m[1] <= 48, "the road proposal shows the expected build time in months");
check(!/Takes about \d+ year/i.test(t), "and not \"Takes about 2 years\"");
await g.page.evaluate(() => document.querySelector("[data-sop-speed]").click()); await g.wait(500);
const t2 = (await g.txt()).replace(/\s+/g, " "), m2 = t2.match(/Expected (\d+) months/i);
console.log("  sped up: " + (m2 ? m2[0] : "?"));
check(m && m2 && +m2[1] === Math.ceil(+m[1] / 2) && /Sped up/.test(t2) && /\+25% on the cost/.test(t2), "Speed it up halves the time, for 25% more");
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + "/build-time.png" });
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
