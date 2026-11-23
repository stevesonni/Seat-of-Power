/* The courts reach the player (owner, 23 Nov 2026: "we used to have industrial court and other courts where we were
   sued… and we could fight it all the way to the Supreme Court. What happened to it?"). A lawsuit had the lowest
   urgency, so the yearly cap always handed it to the Chief of Staff and it never came back. Now a suit is always
   seen. A governor who forced the budget through is sued by the opposition; the case starts at the State High Court
   and can go to the Court of Appeal and the Supreme Court. Run: npm run build:game, then node tests/e2e/courts.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.forcedBudget = true; sv.courtsSeen = []; sv.s = { ...sv.s, cash: 40, pStab: 80 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 3, test: { noStrikes: true } });
await g.page.evaluate(() => { window.__logs = []; window.addEventListener("sop-log", e => window.__logs.push(e.detail.tx)); });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const r = await playUntil(g, t => /Opposition Challenges Forced Budget/.test(t) && /State High Court/.test(t), { max: 500, prefer: [/^Later$/] });
check(r.ok, "the opposition's suit over the forced budget reaches the governor");
const t = await g.txt();
check(/Fight the Case at State High Court/.test(t) && /you can appeal/i.test(t) && /Comply with the Ruling/.test(t), "fight it at the High Court (and appeal if you lose) or comply");
const logs = (await g.page.evaluate(() => window.__logs || [])).join(" | ");
console.log("  handled: " + ((logs.match(/handled [^|]*/g) || []).join(" / ") || "nothing"));
check(!/handled [^|]*(lawsuit|court case|judiciary|suit)/i.test(logs), "the Chief of Staff did not handle the case away");
if (process.env.SHOT) await g.page.screenshot({ path: process.env.SHOT });
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
