/* The IMF programme in a browser (the President). Applying brings the NLC out on strike and a letter from the students; the debt panel offers to withdraw; at the year's end the board asks for its prior actions; accepting floats the naira, ends the subsidy, adds VAT, shuts the printing press at the roundtable and puts the first tranche in the bank.
   Run after npm run build:game: node tests/e2e/imf.mjs */

import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const zones = { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 };
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: ["a ministry for the North-Central caucus"], step: "sworn", zones,
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false,
  res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/pres-" + n + ".png" });

check(!!(await g.click(/Road to Aso Rock/)), "the title offers the presidential run"); await g.wait(900);
check(/President of the Federal Republic/.test(await g.txt()), "the race ends sworn in");
check(!!(await g.click(/Take the oath of office/)), "the winner takes the oath"); await g.wait(1500);
await shot("oath");
// The inauguration at Eagle Square: the oath, three commitments, the address.
check(/The oath of office/.test(await g.txt()), "the inauguration opens at Eagle Square");
await g.click(/^✋ Take the oath$/); await g.wait(600);
check(/Three commitments/.test(await g.txt()), "sworn in: choose three commitments");
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
await g.click(/^Next: the address$/); await g.wait(500);
await shot("address");
check(!!(await g.click(/Deliver the address/)), "the inaugural address is delivered"); await g.wait(1200);
// The Economic Advisory Council around its table: each member speaks, then its first sitting sets the trade policy.
await g.page.evaluate(() => window.SOP.councils.eac()); await g.wait(700);
// Its first report: what the last government left (no pop-up any more). Settle it, then the Council's business.
{ const t = await g.page.evaluate(() => (document.querySelector(".lv-council") || {}).innerText || "");
  check(/what the last government left/i.test(t) && /How do we pay the debt\?/.test(t), "the Economic Advisory Council opens with the debt the last government left"); }
await g.page.evaluate(() => { const b = [...document.querySelectorAll(".lv-council button.opt")].find(x => /^Spread it over 4 years/.test(x.textContent.trim())); b && b.click(); }); await g.wait(900);
// The result card waits its turn behind any pop-up already open (the adviser's welcome); clear them, then the Council's business opens.
for (let i = 0; i < 8 && !(await g.page.evaluate(() => { const c = document.querySelector(".lv-council"); return !!c && !/How do we pay the debt/.test(c.innerText); })); i++) {
  if (!(await g.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; }))) await g.click(/^(Continue|Got it|Okay)$/);
  await g.wait(800); }
{ const t = await g.page.evaluate(() => (document.querySelector(".lv-council") || {}).innerText || ""); check(/The Economic Advisory Council/.test(t) && /Chief Economic Adviser/.test(t) && /Central Bank, Customs/.test(t), "the Economic Advisory Council sits in its chamber"); }
for (let i = 0; i < 10; i++) { const ok = await g.page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button")].find(x => /^(Next: .*|To the decision) ›$/.test(x.textContent.trim())); b && b.click(); return !!b; }); if (!ok) break; await g.wait(200); }
await shot("eac");
check(await g.page.evaluate(() => { const b = [...document.querySelectorAll(".lv-council button.opt")].find(x => /^Targeted/.test(x.textContent.trim())); b && b.click(); return !!b; }), "its first sitting sets the trade policy"); await g.wait(1200);
for (let i = 0; i < 3 && await g.click(/^(Got it|Okay|Continue)$/); i++) await g.wait(400);
const save = () => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const okay = async () => { for (let i = 0; i < 4; i++) { const c = await g.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; }) || await g.click(/^(Got it|Okay|Continue|Close the session)( →)?$/); if (!c) break; await g.wait(400); } };
await okay();
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(600); await okay();
// The debt panel: apply to the IMF.
const openDebt = async () => { await g.click(/^Nation$/); await g.wait(600); await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /💰 Treasury/.test(x.textContent)); b && b.click(); }); await g.wait(800); for (const re of [/debt/i]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("button, summary, [role=button]")].find(x => x.offsetParent && new RegExp(src, "i").test(x.textContent) && x.textContent.length < 60); b && b.click(); }, re.source); await g.wait(500); } };
await openDebt();
const pressRow = (label) => g.page.evaluate((src) => { const rows = [...document.querySelectorAll("div")].filter(d => d.offsetParent && new RegExp(src).test((d.querySelector("b") || {}).textContent || "") && d.querySelector("button")); const r = rows[rows.length - 1]; if (!r) return false; const b = r.querySelector("button"); if (!b || b.disabled) return false; b.click(); return true; }, label);
check(/Apply to the IMF/.test(await g.txt()), "the Treasury offers the IMF as a last resort");
check(await pressRow("Apply to the IMF"), "the President applies to the IMF"); await g.wait(3000);
let sv = await save();
check(sv.stc.imf && sv.stc.imf.stage === "applied", "the application is recorded");
check(sv.stc.labour && sv.stc.labour.strikes && sv.stc.labour.strikes.nlc && sv.stc.labour.strikes.nlc.on && sv.stc.labour.strikes.nlc.cause === "imf", "the NLC is on strike over the IMF the day you apply");
await okay(); await g.wait(1200);
sv = await save();
check((sv.mail || []).some(m => /^nans_imf_/.test(m.key)), "the students' president writes: they will march");
await openDebt();
check(/Withdraw the IMF application/.test(await g.txt()), "the Treasury now offers to withdraw the application");
// To the year's end: the board's prior actions.
await g.click(/^Desk\d*$/); await g.wait(500);
const r = await playUntil(g, t => /The Fund's prior actions/.test(t), { max: 400, prefer: [/^Accept the prior actions$/] });
check(r.ok, "at the year's end the IMF board asks for its prior actions");
const before = await save();
for (let i = 0; i < 6 && !/Accept the prior actions/.test(await g.txt()); i++) { await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /The Fund's prior actions/.test(x.textContent)); b && b.click(); }); await g.wait(700); await g.page.evaluate(() => { const b = [...document.querySelectorAll("button, .opt")].find(x => x.offsetParent && /^✍️ Handle it personally$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(700); }
const t = await g.txt();
check(/Float the naira/i.test(t) && /fuel subsidy/i.test(t) && /borrowing ceiling/i.test(t) && /VAT/.test(t), "the four prior actions are spelt out");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button, .opt")].find(x => x.offsetParent && /^Accept the prior actions/.test(x.textContent.trim())); b && b.click(); }); await g.wait(3000); await okay(); await g.wait(1500);
sv = await save();
const I = sv.stc.imf || {};
check(I.stage === "active" && I.drawn === 1 && I.outstandingB > 0, "the programme is active, tranche 1 drawn (₦" + I.outstandingB + "B owed)");
check(sv.stc.trade && sv.stc.trade.floated, "the naira floats");
check(sv.stc.rev && sv.stc.rev.f_vat != null, "VAT is raised");
check((sv.stc.moneyNews || []).some(m => m.head === "The IMF's first tranche" && m.cash && m.amtB === I.trancheB), "the first tranche went into the bank (the Treasury's money record)");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
