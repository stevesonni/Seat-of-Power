/* The short start, lost on election night: the tribunal is there, as in the long campaign (owner, 22 Nov 2026:
   "if I lose at the start why is the tribunal removed?"). Run: npm run build:game, then node tests/e2e/short-tribunal.mjs */
import { open, createPolitician } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { exp: { start: 1, screen: 1, stagger: 1, words: 1, drama: 1 }, test: { lose: true } });
await g.click(/^New game$/); await g.wait(900); await createPolitician(g); await g.wait(900);
await g.click(/^Run in /); await g.wait(400);
await g.page.evaluate(() => document.querySelector("[data-sop-short-agenda]").click()); await g.wait(400);
await g.page.evaluate(() => document.querySelector("[data-sop-short-deputy]").click()); await g.wait(400);
for (const re of [/^Take half/, /^On to the campaign/, /^The capital's biggest market$/, /^Election night/]) { await g.click(re); await g.wait(500); }
await g.wait(6500);
const night = await g.txt();
check(/You lose by/.test(night), "election night is lost (test switch)");
check(await g.click(/^⚖️ Challenge the result at the tribunal$/), "the loss offers the tribunal"); await g.wait(800);
check(!!(await g.page.$("[data-sop-short-tribunal]")) && /Governorship Election Tribunal/.test(await g.txt()), "the tribunal opens");
// Pick a ground and argue it, until a final judgment.
let end = "";
for (let i = 0; i < 6 && !end; i++) {
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Not a majority of lawful votes/.test(x.textContent)); b && b.click(); }); await g.wait(300);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Argue it yourself/.test(x.textContent)); b && b.click(); }); await g.wait(700);
  for (let k = 0; k < 3 && await g.click(/^(Okay|Got it)$/); k++) await g.wait(300);
  const t = await g.txt(); end = /Petition upheld/.test(t) ? "won" : /Petition dismissed/.test(t) ? "lost" : "";
}
check(!!end, "the courts reach a final judgment (" + end + ")");
if (end === "won") { await g.click(/^Take the oath/); await g.wait(500); check(/Begin your tenure/.test(await g.txt()), "won in court: on to the oath"); }
else check(/Run again/.test(await g.txt()), "lost in court: run again or go home");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
