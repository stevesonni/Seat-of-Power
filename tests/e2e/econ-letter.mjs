/* The economic letter reads as a whole letter (owner, 25 Nov 2026: "This letter makes no sense": "Your Excellency,"
   twice, then two sentences that never said what the plan was). Run: npm run build:game, then node tests/e2e/econ-letter.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 7 });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const has = () => g.page.evaluate(() => (window.SOP.lettersTest() || []).some(x => /econ_econ_/.test(x.key)));
if (!(await has())) await playUntil(g, t => /to the world/i.test(t), { max: 400 });
check(await has(), "the economic letter arrives");
check(await g.page.evaluate(() => window.SOP.openLetterTest("econ_econ_")), "it opens"); await g.wait(900);
const t = await g.txt(), m = /Your Excellency,([\s\S]*?)Yours faithfully/.exec(t), body = m ? m[1].replace(/\s+/g, " ").trim() : "";
console.log("  " + body);
check((t.match(/Your Excellency,/g) || []).length === 1, "\"Your Excellency,\" comes once");
check(/can be sold abroad, for dollars, every year\. Buyers overseas want our /.test(body), "it says what the idea is");
check(/If you call the State Economic Council, your commissioners and the state's business people will sit today and draw up a plan to sell it abroad/.test(body), "it says what the Council would do");
check(/Today, taxes and fees bring in only ₦[\d.]+B a year\./.test(body), "the whole letter is there, figures intact");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
