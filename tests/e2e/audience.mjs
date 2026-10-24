/* A commissioner's request to see you can be handed to the Chief of Staff, who chooses in character.
   Run: npm run build:game, then node tests/e2e/audience.mjs */
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve(); const g = await open(srv.port, { test: { win: true }, seed: 3 });
await campaign(g); await takeOffice(g);
const has = () => g.page.evaluate(() => [...document.querySelectorAll("button")].some(b => b.offsetParent && /A request to see you/.test(b.textContent)));
const r = await playUntil(g, () => false, { max: 1 });
let found = false;
for (let i = 0; i < 700 && !found; i++) { found = await has(); if (found) break; await playUntil(g, () => false, { max: 1 }); const t = await g.txt(); if (/2nd Term|End of First Term/.test(t)) break; if (i % 40 === 0) await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^📬|Mail/.test(x.textContent.trim())); }); }
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
check(found, "a commissioner asks to see you");
if (found) {
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(b => b.offsetParent && /A request to see you/.test(b.textContent)); b.click(); }); await g.wait(700);
  for (let k = 0; k < 4; k++) { if (!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Got it|Okay|Continue)$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }))) break; await g.wait(400); }
  const ok = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(b => b.offsetParent && /^Let .+ see them/.test(b.textContent.trim())); if (b) { const t = b.textContent.trim(); b.click(); return t; } return null; });
  check(!!ok, "the letter offers to let the Chief of Staff see them (" + ok + ")"); await g.wait(900);
  for (let k = 0; k < 3; k++) { const t = await g.page.evaluate(() => document.body.innerText); if (/saw them:/.test(t)) break; await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Got it|Okay)$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(500); }
  const card = await g.page.evaluate(() => (document.body.innerText.match(/[^\n]*saw them:[^\n]*/) || [""])[0]); check(/saw them:/.test(card), "the result says who saw them and what they chose: " + card);
}
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
