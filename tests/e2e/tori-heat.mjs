/* Tori as the fourth estate: a failing governor feels the heat. The feed says why it is trending, the institutions
   post, the governor can respond (paid influencers can be exposed), and at the year's end a "must go" hashtag
   forces the choice: resign or fight. Run: npm run build:game, then node tests/e2e/tori-heat.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, app: 30, cor: .62 }; sv.stc = { ...(sv.stc || {}), arrears: 3, tori: { heat: 88 } };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 4, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1000);
let rowOn = false;
await playUntil(g, () => rowOn, { max: 80, onStep: async () => { rowOn = await g.page.evaluate(() => !!document.querySelector("[data-sop-street]")); } });
for (let i = 0; i < 3 && await g.click(/^(Continue|Okay|Got it|Later)$/); i++) await g.wait(400);
const row = await g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); return b ? b.innerText : ""; });
check(/🔥/.test(row) && /trending across Nigeria/.test(row), "the Desk's Tori row says how far it has spread (" + row.replace(/\n/g, " ").slice(0, 90) + ")");
await g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); b.scrollIntoView(); b.click(); }); await g.wait(900);
const why = await g.page.evaluate(() => { const e = document.querySelector("[data-sop-tori-why]"); return e ? e.innerText : ""; });
check(/Why this is trending/.test(why) && /#PayOurSalariesOgun/.test(why) && /3 months of salaries unpaid/.test(why), "the feed says why it is trending, with the cause and the demand");
check(!(await g.page.$("[role=progressbar], progress")), "no progress bar: the heat is read in the feed");
const t = await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText);
check(/@NLC_Ogun/.test(t) && /@BudgetWatchNG/.test(t) && /@StateHouseNG/.test(t), "the institutions post: the NLC, the budget watchdog, Abuja");
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/tori-heat.png" });
await g.page.evaluate(() => document.querySelector("[data-sop-tori-respond]").click()); await g.wait(300);
const tools = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-tori-tool]")].map(b => b.getAttribute("data-sop-tori-tool")));
check(["fix", "presser", "apology", "bots", "crackdown", "silent"].every(x => tools.includes(x)), "the governor can respond: fix it, press, apology, influencers, crackdown, silence (" + tools.join(", ") + ")");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-tool=presser]").click()); await g.wait(500);
const logs = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | "));
check(/Tori: Hold a press conference\. The clips went viral for the wrong reasons\./.test(logs), "a press conference with no record to show backfires");
// Close the year: the "must go" finale.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-testid=tori] button")].find(x => x.getAttribute("aria-label") === "Back"); b && b.click(); }); await g.wait(400);
let seen = false;
await playUntil(g, () => seen, { max: 160, onStep: async () => { if (!seen) seen = await g.page.evaluate(() => !!document.querySelector("[data-testid=must-go]")); } });
const mg = await g.page.evaluate(() => { const e = document.querySelector("[data-testid=must-go]"); return e ? e.innerText : ""; });
check(seen && /#OgunGovMustGo/.test(mg) && /resign/i.test(mg), "the year ends with #OgunGovMustGo trending nationwide: resign or fight");
if (process.env.SHOTS && seen) await g.page.screenshot({ path: process.env.SHOTS + "/tori-mustgo.png" });
if (seen) { await g.click(/^Resign with a statement$/); await g.wait(1500); }
const L2 = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | "));
check(/You resigned as #OgunGovMustGo trended/.test(L2), "resigning ends the governorship, and the record says why");
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
