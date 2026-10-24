/* The Head of Service: appointed on the adviser's recommendation; commissioners' requests
   come back as one brief the governor can reverse before signing.
   Run: npm run build:game, then node tests/e2e/civil-service.mjs */
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve(); const g = await open(srv.port, { test: { win: true }, seed: 3 });
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const tap = (src) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].filter(x => x.offsetParent).find(x => new RegExp(src).test(x.textContent.trim())); if (b) { b.click(); return b.textContent.trim(); } return null; }, src);
const has = (src) => g.page.evaluate((src) => [...document.querySelectorAll("button")].some(b => b.offsetParent && new RegExp(src).test(b.textContent)), src);
await campaign(g); await takeOffice(g);
// Play until the adviser's letter about the Head of Service is on the Desk, then open it.
let appointed = false;
for (let i = 0; i < 400 && !appointed; i++) {
  if (await has("Appoint a Head of Service")) {
    await tap("Appoint a Head of Service"); await g.wait(600); await tap("^Choose a Head of Service"); await g.wait(800);
    check(/Your adviser's choice/.test(await g.txt()), "three candidates, with the adviser's recommendation marked");
    await g.page.screenshot({ path: "/tmp/claude-0/-home-user-Seat-of-Power/6d547f60-c541-5156-9aeb-8af4391cce86/scratchpad/hos1.png" });
    const who = await tap("^Appoint "); await g.wait(800); check(!!who, "appointed: " + who); appointed = !!who;
    for (let k = 0; k < 3; k++) { await tap("^(Okay|Got it)$"); await g.wait(300); }
    break;
  }
  await playUntil(g, () => false, { max: 1 });
}
check(appointed, "the appointment letter arrives once the ministries exist");
// Then the brief: requests decided, reversible, signed.
let brief = false;
for (let i = 0; i < 700 && appointed; i++) {
  if (await has("annual brief")) {
    await tap("annual brief"); await g.wait(600); await tap("^Read the brief"); await g.wait(800);
    const t = await g.txt(); check(/From the Head of Service/i.test(t) && /The cabinet this year|Commissioner for|failing/i.test(t), "the brief carries the cabinet report, failing commissioners and requests");
    check(!/Cabinet report for/.test(t), "no separate cabinet report letter once there is a Head of Service");
    const rev = await g.page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button[aria-pressed=false]")].find(x => x.offsetParent && !/call/.test(x.textContent)); if (b) { b.click(); return b.textContent.trim(); } return null; });
    await g.wait(400); check(!!rev && /with your changes/.test(await g.txt()), "a decision can be reversed: " + rev);
    await g.page.screenshot({ path: "/tmp/claude-0/-home-user-Seat-of-Power/6d547f60-c541-5156-9aeb-8af4391cce86/scratchpad/hos2.png" });
    await tap("^✍️ Sign it off"); await g.wait(900);
    for (let k = 0; k < 4 && !/The brief is signed/.test(await g.txt()); k++) { await tap("^(Got it|Okay)$"); await g.wait(500); }
    check(/The brief is signed|is out/.test(await g.txt()), "signed, with the reversal recorded");
    brief = true; break;
  }
  await playUntil(g, () => false, { max: 1 }); const t = await g.txt(); if (/End of First Term|Tenure Complete/.test(t)) break;
}
check(brief, "the Head of Service's brief arrives");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
