/* Autosave: progress made during the year survives closing the game
   (a reload), not only what was there at the year's start; and New game
   warns before it replaces a career. Run after npm run build:game. */
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { test: { win: true } });
const saved = () => g.page.evaluate(() => { try { return JSON.parse(localStorage.getItem("sop_save") || "null"); } catch (e) { return null; } });
check(await campaign(g) === "won", "campaign won");
await takeOffice(g);
// Play until the cabinet is in place mid-year, then give the autosave a moment.
const r = await playUntil(g, t => false, { max: 1 });
for (let i = 0; i < 120; i++) { const sv = await saved(); if (sv && (sv.ministries || []).filter(m => m.minister).length >= 2 && sv.turn === 1) break; await playUntil(g, () => false, { max: 3 }); }
await g.wait(3000);
const before = await saved();
const nMin = ((before && before.ministries) || []).filter(m => m.minister).length;
check(nMin >= 2 && before.turn === 1, "the year-one cabinet is saved mid-year (" + nMin + " ministries, resume at " + (before && before.resume) + ")");
await g.page.reload(); await g.wait(1800);
const t0 = await g.page.evaluate(() => document.body.innerText);
check(/Continue/.test(t0), "the title offers Continue after closing");
await g.click(/^New game$/); await g.wait(500);
check(/governorship in progress/i.test(await g.page.evaluate(() => document.body.innerText)), "New game warns before replacing the career");
await g.click(/^Keep my career$/); await g.wait(400);
await g.click(/^Continue/); await g.wait(2000);
const after = await saved();
check(((after && after.ministries) || []).filter(m => m.minister).length === nMin, "Continue restores the cabinet appointed mid-year");
check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
await g.browser.close(); srv.close(); process.exit(fails ? 1 : 0);
