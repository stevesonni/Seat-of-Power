/* The House remembers (owner, 23 Nov 2026): a new House and a new Speaker race in the second term, shaped by how you
   treated the House; a plot to remove a friendly Speaker (once a term); a hostile Speaker who impeaches at the
   slightest approval dip. Run: npm run build:game, then node tests/e2e/house-memory.mjs [race|plot|imp] */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const which = process.argv[2] || "all", SH = process.env.SHOTS;
const MEMBERS = [{ id: "m1", name: "Hon. Ada Okoro", bloc: "ours", interest: "ambition", rel: 60 }, { id: "m2", name: "Hon. Bayo Lawal", bloc: "ours", interest: "constituency", rel: 60 }, { id: "m3", name: "Hon. Uzo Agbo", bloc: "opp", interest: "policy", rel: 35 }, { id: "m4", name: "Hon. Idris Bello", bloc: "opp", interest: "money", rel: 35 }, { id: "m5", name: "Hon. Femi Adeyemi", bloc: "swing", interest: "committee", rel: 50 }, { id: "m6", name: "Hon. Chika Eze", bloc: "swing", interest: "discipline", rel: 50 }];
const start = async (turn, stc, s = {}, test = {}) => {
  const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80, ...s }; sv.turn = turn;
  sv.stc = { ...(sv.stc || {}), lastTurn: turn - 1, ...stc };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true, ...test } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  return g;
};

if (which === "all" || which === "race") {
  // A first term spent crossing the House: the new House puts up an avenger.
  const g = await start(5, { reMargin: 3, houseRec: { score: -7, n: { broke: 1, refused: 2 } }, house: { seats: 24, loyal: 13 },
    leg: { members: MEMBERS, promises: [], asked: [], speaker: { winner: "m1", kind: "fixer", hostile: false, at: 1, asks: [], done: [] } } });
  const r = await playUntil(g, t => /The new House elects its Speaker/.test(t), { max: 300, prefer: [/^Later$/] });
  check(r.ok, "the new House elects its Speaker in the second term");
  const t = await g.txt();
  if (SH) await g.page.screenshot({ path: SH + "/house-race2.png" });
  check(/crossed the House too often/.test(t) && /an avenger/.test(t) && /Back Rt\. Hon\. Ada Okoro for a second term/.test(t), "it says what the House thinks of your first term, and who it puts up");
  await g.click(/^Stay out of it$/); await g.wait(900);
  const st = await g.page.evaluate(() => ({ sp: window.SOP.stc.leg.speaker, h: window.SOP.stc.house, nh: window.SOP.stc.newHouse }));
  check(st.sp && st.sp.term === 2 && st.sp.k2 === "avenger", "the race is decided (" + (st.sp && st.sp.winner) + ", hostile " + (st.sp && st.sp.hostile) + ")");
  check(!st.sp.hostile || st.h.loyal < 13, "a hostile winner takes the House (" + st.h.loyal + "/24)");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
}

if (which === "all" || which === "plot") {
  // A friendly Speaker, late money, a scandal, a broken godfather and an ambitious Speaker: the members move.
  const g = await start(2, { arrears: 3, gf: "freed", house: { seats: 24, loyal: 15 },
    leg: { members: MEMBERS, promises: [], asked: [], speaker: { winner: "m1", kind: "ambitious", hostile: false, owes: true, at: 1, asks: [], done: [] } } }, { cor: .5 }, { plotNow: true });
  let seenAt = ""; const r = await playUntil(g, t => { const m = t.match(/[^\n]*collecting signatures to remove[^\n]*/); if (m) seenAt = m[0]; return !!m || /Year 4 of 4/.test(t); }, { max: 500, prefer: [/^Later$/] });
  if (process.env.DBG) await g.page.screenshot({ path: SH + "/plot-seen.png" });
  if (process.env.DBG) console.log("  seen in:", seenAt, "| clicks:", r.clicks.slice(-6).join(" | "));
  const t = await g.txt();
  check(r.ok && /collecting signatures to remove/.test(t), "a plot against the friendly Speaker, in year 2 or 3");
  if (SH) await g.page.screenshot({ path: SH + "/house-plot.png" });
  check(/signatures needed \(two-thirds/.test(t) && /Get a court order/.test(t) && /Let him fall/.test(t), "it says how many signatures and what you can do");
  for (let i = 0; i < 3; i++) { if (!(await g.click(/^(Okay|Got it|Continue|Noted)$/))) break; await g.wait(600); }
  const ol = true;
  if (process.env.DBG) console.log("  open:", ol, JSON.stringify(await g.page.evaluate(() => window.SOP.lettersTest().map(l => l.key))), "| before:", t.slice(0, 300).replace(/\n/g, " / "));
  const clk = await g.click(/^Let him fall/); await g.wait(1000); if (process.env.DBG) console.log("  clicked:", clk, "| after:", (await g.txt()).slice(0, 400).replace(/\n/g, " / "));
  const st = await g.page.evaluate(() => ({ sp: window.SOP.stc.leg.speaker, term: window.SOP.stc.spPlotTerm }));
  check(st.sp.removed === "m1" && st.sp.winner !== "m1" && st.term === 1, "he falls, a new Speaker takes the chair, and it cannot happen again this term (" + st.sp.kind + ")");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
}

if (which === "all" || which === "imp") {
  // A hostile Speaker, approval down from last year, his price refused: impeachment at year end.
  const g = await start(2, { appMark: 70, house: { seats: 24, loyal: 11 },
    leg: { members: MEMBERS, promises: [], asked: [], speaker: { winner: "m3", kind: "principled", hostile: true, at: 1, asks: [{ id: "empower", l: "An empowerment scheme run through members' offices", costB: .5, fx: { cor: .02 } }], done: [] } } }, { app: 52 });
  const r = await playUntil(g, t => /IMPEACHMENT PROCEEDINGS/.test(t) || /Year 3 of 4/.test(t), { max: 500, prefer: [/^Refuse: govern without him/, /^Later$/] });
  const t = await g.txt();
  if (SH) { await g.wait(1500); await g.page.screenshot({ path: SH + "/house-imp.png" }); }
  if (process.env.DBG) console.log("  phase:", await g.page.evaluate(() => window.SOP.phase), await g.page.evaluate(() => { const el = [...document.querySelectorAll("h3")].find(h => /IMPEACHMENT PROCEEDINGS/.test(h.textContent)); if (!el) return "no h3"; const r = el.getBoundingClientRect(); let p = el, chain = []; for (let i = 0; i < 8 && p; i++) { const cs = getComputedStyle(p); chain.push(p.tagName + "." + String(p.className || "").slice(0, 30) + " d=" + cs.display + " v=" + cs.visibility + " o=" + cs.opacity + " z=" + cs.zIndex + " pos=" + cs.position); p = p.parentElement; } return JSON.stringify(r) + " | " + chain.join(" | "); }));
  check(r.ok && /IMPEACHMENT PROCEEDINGS/.test(t), "the hostile Speaker moves to impeach when approval slips");
  check(/moved it the moment your approval slipped, from 70%/.test(t), "and it says why");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
}
if (which === "all" || which === "split") {
  // Two Speakers since last year: the court rules, or you settle.
  const g = await start(2, { house: { seats: 24, loyal: 14 },
    leg: { members: [...MEMBERS, { id: "m_spx_1", name: "Hon. Musa Danjuma", bloc: "opp", interest: "policy", rel: 30 }], promises: [], asked: [], speaker: { winner: "m1", kind: "fixer", hostile: false, at: 0, asks: [], done: [], split: { at: 1, rival: "m_spx_1" } } } });
  for (let i = 0; i < 4; i++) { if (!(await g.click(/^(Okay|Got it|Continue|Noted)$/))) break; await g.wait(600); }
  const blocked = await g.page.evaluate(() => window.SOP.policyTest()); await g.wait(900);
  const tb = await g.txt(); if (process.env.DBG) console.log("  after policy:", blocked, tb.slice(0, 400).replace(/\n/g, " / "));
  check(blocked && /The House is frozen/.test(tb), "while there are two Speakers, nothing new gets money");
  await g.click(/^Okay$/); await g.wait(500);
  const r = await playUntil(g, t => /The court rules on the two Speakers/.test(t), { max: 300, prefer: [/^Later$/] });
  check(r.ok, "the court rules the year after");
  for (let i = 0; i < 3; i++) { if (!(await g.click(/^(Okay|Got it|Continue|Noted)$/))) break; await g.wait(600); }
  await g.page.evaluate(() => window.SOP.openLetterTest("leg_split_")); await g.wait(600);
  check(!!(await g.click(/^Settle before judgment/)), "settle"); await g.wait(900);
  const st = await g.page.evaluate(() => window.SOP.stc.leg.speaker);
  check(st.winner === "m1" && !st.split, "your Speaker keeps the mace and the House sits as one");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
