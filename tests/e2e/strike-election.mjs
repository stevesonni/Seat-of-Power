/* A strike still on at election time sinks you (owner, 23 Nov 2026: "if ASUU or NLC is on strike by the time the
   election comes around, without an MoU in place or full payment, nothing can ever make your party or successor win
   the election. Nothing"). Even with the test's re-election boost, the governor loses, the reason is given, and no
   petition is offered. Run: npm run build:game, then node tests/e2e/strike-election.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80, app: 75 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { reWin: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
// ASUU out, no MoU, nothing paid; then the re-election.
await g.page.evaluate(() => window.SOP.stcTest(p => ({ ...p, labour: { ...(p.labour || {}), strikes: { ...((p.labour || {}).strikes || {}), asuu: { id: "asuu", cause: "pay", on: true, start: 1, stage: 2, trust: 20, sessions: 0, rounds: { t: 1, n: 0 }, lastSession: -9, mou: null } } } }))); await g.wait(400);
const r = await playUntil(g, t => /RE-ELECTED!|DEFEATED/.test(t), { max: 1500, prefer: [/^Later$/, /^🗳️ Run for Re-Election/, /^Go on without a loan/] });
check(r.ok, "the re-election is counted");
const t = await g.txt();
check(/DEFEATED/.test(t) && !/RE-ELECTED!/.test(t), "with ASUU still out, the governor loses even with a strong record");
check(/The ASUU strike was still on/.test(t), "the result says why");
check(!/Filed election petition|File a petition|Go to the tribunal/i.test(await g.page.evaluate(() => [...document.querySelectorAll("button")].map(b => b.textContent).join(" | "))), "no petition can save it");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
