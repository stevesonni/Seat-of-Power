/* Round three, "I am the Governor": the five pillars in a browser.
   juice: meter changes show their size; money flies out of the Treasury.  why: an earlier decision is named when it comes due.
   reach: Next on every tab; the Governor's powers on the Desk.  capital: political capital.  purse: a handover balance in year one. */
import fs from "node:fs";
import { open, campaign, takeOffice } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save);
// A programme funded in the first year pays off now (due this turn).
sv.delayedFx = [...(sv.delayedFx || []), { turn: sv.turn || 1, made: 1, from: "funded the Test Clinics programme", fx: { app: 3, hp: .02 }, desc: "📈 The Test Clinics programme is open in every district." }];
const ALL = { juice: 1, why: 1, reach: 1, capital: 1, purse: 1 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, exp: ALL });
await g.click(/^Continue/); await g.wait(2500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
// why
let seen = false; for (let i = 0; i < 12 && !seen; i++) { const t = await g.txt(); if (/Because you/i.test(t) && /You funded the Test Clinics programme/.test(t)) seen = true; else { await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Continue|Okay|Got it|Close the session)$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(700); } }
check(seen, "why: the payoff names the decision and its year (“Because you… · You funded the Test Clinics programme”)");
for (let i = 0; i < 8; i++) { if (!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Continue|Okay|Got it|Close the session)$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }))) break; await g.wait(600); }
const log = await g.page.evaluate(() => (window.SOP && window.SOP.logs || []).map(l => l.tx || "").join(" | "));
check(/because you funded the Test Clinics programme in \d{4}/.test(log), "why: the log line says because you… in which year");
// juice
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: Math.max(0, p.app - 12) }))); await g.wait(500);
const strip = await g.page.evaluate(() => [...document.querySelectorAll(".sop-delta")].map(e => e.textContent).join(" "));
check(/[▲▼]{2,3}|[−+]\d+ [▲▼]/.test(strip), "juice: a big change shows more than one arrow (" + strip + ")");
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, cash: (p.cash || 0) + 3 }))); await g.wait(300);
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, cash: Math.max(0, (p.cash || 0) - 2.5) }))); await g.wait(250);
const coins = await g.page.evaluate(() => document.querySelectorAll("img[src*='coin-']").length);
check(coins > 0, "juice: money leaving the Treasury sends coins out (" + coins + ")");
// capital and reach on the Desk
await g.wait(2500); const desk = await g.txt();
check(/Political capital \d+\/\d+/.test(desk), "capital: big moves read as political capital");
check(/The Governor's powers/i.test(desk) && /Hire or fire commissioners/.test(desk) && /Inspect your projects/.test(desk), "reach: the Governor's powers on the Desk");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Inspect your projects/.test(x.textContent)); b && b.click(); }); await g.wait(900);
const st = await g.page.evaluate(() => ({ next: !!document.querySelector("[data-sop-next]"), txt: (document.querySelector("[data-sop-next]") || {}).textContent || "" }));
check(st.next && /Next/.test(st.txt), "reach: away from the Desk, a Next button waits in the corner (" + st.txt + ")");
await g.page.evaluate(() => { const b = document.querySelector("[data-sop-next]"); b && b.click(); }); await g.wait(1500);
check(!(await g.page.evaluate(() => !!document.querySelector("[data-sop-next]"))) || /Yours faithfully|Desk/.test(await g.txt()), "reach: Next takes you to the next letter or step");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close();
// purse: a new governor finds a handover balance in the bank
const h = await open(srv.port, { test: { win: true }, exp: { purse: 1 } });
check(await campaign(h) === "won", "purse: campaign won"); await takeOffice(h); await h.wait(2500);
const cash = await h.page.evaluate(() => (window.SOP && window.SOP.s && window.SOP.s.cash) || 0);
check(cash >= .5, "purse: year one opens with a handover balance (₦" + cash + "B)");
check(!h.errors.length, "no page errors (" + h.errors.join(" | ") + ")");
await h.browser.close(); srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
