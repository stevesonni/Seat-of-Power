/* Printed money is felt (owner, 22 Nov 2026: "there has to be a stronger consequence; the consequence has to be felt").
   A President with inflation at 34%: the budget says every programme and project costs more, the Treasury shows the
   inflation tile, programmes cost more, and at the year's end approval drains and the Central Bank asks to raise rates.
   Run: npm run build:game, then node tests/e2e/inflation.mjs */
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { noStrikes: true } });
await g.click(/Road to Aso Rock/); await g.wait(900); await g.click(/Take the oath of office/); await g.wait(1500);
await g.click(/^✋ Take the oath$/); await g.wait(600);
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
await g.click(/^Next: the address$/); await g.wait(500); await g.click(/Deliver the address/); await g.wait(1200);
await g.page.evaluate(() => window.SOP.stcTest(p => ({ ...p, inflation: { rate: 34, printed: 78, lastPrint: 1 } }))); await g.wait(600);
const r0 = await playUntil(g, t => /to share out this year/.test(t), { max: 200 });
check(r0.ok && /Inflation 34%: every programme and project costs 19% more/.test(await g.txt()), "the budget says inflation makes everything cost more");
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "tre" }, "*")); await g.wait(800);
check(/Inflation: 34%/.test(await g.txt()), "the Treasury shows the inflation tile");
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "gov" }, "*")); await g.wait(500);
const app0 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}").s.app);
const r = await playUntil(g, t => /The Central Bank wants to raise interest rates/.test(t), { max: 500, prefer: [/^Later$/] });
check(r.ok, "the Central Bank asks to raise rates");
const t = await g.txt();
check(/Back the Central Bank: raise rates/.test(t) && /Overrule it/.test(t), "back the Central Bank or overrule it");
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check(sv.stc.inflation.rate < 34, "inflation falls slowly on its own (" + sv.stc.inflation.rate + "%)");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
