/* Replay variety and the living House in a browser (player feedback, November 2026).
   Plays from a year-one save to year 4 and checks: the day-one situation, the Speaker race,
   the budget battle and its promise, a member's interest, a committee hearing, a cabinet
   meeting on the flagship, the party chairman, the term wording; then the life after office.
   Run: npm run build:game, then node tests/e2e/living-house.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1 });
await g.click(/^Continue/); await g.wait(2000);
const seen = new Set(), T = { speaker: /The House elects its Speaker/i, budget: /offers the opposition's votes|wants its own projects/i, member: /House of Assembly · Hon\. .* \((your party|opposition|swing)\)/i,
  hearing: /Public Accounts Committee/i, exco: /cannot agree how to deliver/i, chair: /The party · /i, term: /re-election possible/i, situ: /HOUSE SPLIT|WORKERS OWED TWO MONTHS|OIL WINDFALL/i };
const r = await playUntil(g, (t) => { Object.entries(T).forEach(([k, re]) => { if (re.test(t)) seen.add(k); }); return /Year 4 of 4/.test(t); }, { max: 900 });
check(r.ok, "played on to year 4"); if (!r.ok) console.log("  last: " + r.clicks.slice(-12).join(" | "));
console.log("  seen: " + [...seen].join(", "));
for (const [k, what] of [["term", "the term line says re-election is possible"], ["speaker", "the Speaker race"], ["budget", "the budget battle"]]) check(seen.has(k), what);
const minN = await g.page.evaluate(() => (JSON.parse(localStorage.getItem("sop_save") || "{}").ministries || []).filter(m => m.minister).length);
check(seen.has("exco") || minN < 2, "a cabinet meeting on the flagship (" + minN + " commissioners)");
check(seen.has("member") || seen.has("hearing") || seen.has("chair"), "a House member, a hearing or the party chairman");
const d = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}")), st = d.stc || {};
check(st.persona && st.persona.gf && st.persona.speaker && st.persona.chair, "this run's people have their kinds (" + JSON.stringify(st.persona) + ")");
check(st.leg && st.leg.members && st.leg.members.length === 6 && st.leg.speaker, "six named members and an elected Speaker");
check(!!st.situ || seen.has("situ"), "a starting situation (" + st.situ + ")");
check(await g.page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("sop_seen_cards") || "{}")).length > 0), "the cards seen this run are remembered for the next");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
// Life after office: two full terms, then the successor.
await g.page.evaluate(() => window.SOP.setGEnd("complete")); await g.wait(4000);
let stay = false;
for (let i = 0; i < 12 && !stay; i++) { stay = !(await g.page.evaluate(() => !!document.querySelector("[data-ach]"))) && await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Stay in the game: your successor/.test(x.textContent)); if (b) { b.click(); return true; } return false; }); if (!stay) { if (!(await g.page.evaluate(() => { const b = document.querySelector("[data-ach] .ach-x"); if (b) { b.click(); return true; } return false; }))) await g.click(/^(Okay|Got it|Not now|Later)$/); await g.wait(600); } }
check(stay, "after two terms: stay in the game"); await g.wait(600);
check(/is sworn in/.test(await g.txt()), "the successor is sworn in");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-elder] button")].find(x => /Ask for your people/.test(x.textContent)); b && b.click(); }); await g.wait(500);
check(/cancels your flagship/.test(await g.txt()), "the successor ignores your advice");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-elder] button")].find(x => /Call your loyalists/.test(x.textContent)); b && b.click(); }); await g.wait(500);
check(/How you are remembered/i.test(await g.txt()) && /kingmaker|at war|power behind|elder|conscience/i.test(await g.txt()), "an ending for life after office");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
