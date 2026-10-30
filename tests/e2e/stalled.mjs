/* A stalled project gets going again (a player on X: "I have 3bn in the bank but
   still can't find a way to resume construction... they remain stalled").
   Three ways a project stalls, each with the fix on its card:
   the bank could not pay the year's share (restart: the bank pays at the year's end),
   the approved money ran out (add the money, or cut the scope to what is left),
   the contractor fled (replace the contractor).
   Run: npm run build:game, then node tests/e2e/stalled.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
import * as SYS from "../../game/systems/index.js";

const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const clear = async (g) => { for (let i = 0; i < 6 && await g.click(/^(Got it|Okay|Understood|Continue|On to the next.*|Not now|Later)$/); i++) await g.wait(350); };
const toTab = async (g, tab) => { await g.page.evaluate((t) => window.postMessage({ type: "sop-nav", payload: t }, "*"), tab); await g.wait(700); };
const save = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && new RegExp(src).test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }, re.source);
// A road whose bank was empty at the last year's end: ₦3B in the bank now.
const road = (o = {}) => { const mk = SYS.makeProject({ id: "p_road", title: "Abeokuta Ring Road", type: "road", qty: 20, lga: "Abeokuta North", ministryId: "works", approvedM: 9000, thisYearM: 4500, year: 1 });
  return { ...mk, approvedM: Math.ceil(mk.estimateM * 1.2), spentM: 0, builtM: 0, progress: 0, status: "stalled", contractorId: "kestrel", contractor: "Kestrel Construction", startTurn: 1, startYear: 1, years: 3, japaChecked: true, ticked: 1,
    events: ["Year 1: no money released this year: the bank could not pay this year's share, so work stopped."], ...o }; };
const withProject = (P) => { const sv = JSON.parse(Y1.sop_save); sv.turn = 2; sv.projTicked = 2; sv.projects = [P]; sv.s = { ...sv.s, cash: 3 }; sv.stc = { ...sv.stc, lastTurn: 1 }; return { ...Y1, sop_save: JSON.stringify(sv) }; };
const run = async (P, what, button, after) => {
  const g = await open(srv.port, { save: withProject(P) });
  await g.click(/^Continue/); await g.wait(1800); await clear(g);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde/.test(x.textContent)); b && b.click(); }); await g.wait(400); await clear(g);
  await toTab(g, "prj"); await clear(g);
  const t = await g.txt();
  check(what.test(t), "the card says why it stalled (" + what.source.slice(0, 50) + ")");
  check(!/approved money is spent/.test(t) || /Add .* and restart/.test(t), "it does not blame money that was never spent");
  check(await tap(g, button), "the fix is on the card: " + button.source); await g.wait(1200);
  const card = await g.txt(); if (process.env.DBG) console.log("CARD:", card.replace(/\s+/g, " ").slice(-400)); await clear(g);
  const p = ((await save(g)).projects || [])[0] || {};
  after(p, card);
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
};

// 1. The money is approved; the bank could not pay last year. ₦3B now: restart.
await run(road(), /the money is approved, but the bank could not pay/, /^Restart the work$/, (p, card) => {
  check(p.status === "in_progress", "restarted: under construction again");
  check((p.alloc || {})[2] > 0, "this year's share is set to be paid from the bank (" + ((p.alloc || {})[2]) + "M)");
  check(/Work restarts/.test(card), "the result says the work restarts and when the bank pays");
});
// 2. The approved money is spent: add it, and the work restarts.
{ const P = road(); const short = { ...P, approvedM: Math.round(P.estimateM * .4), spentM: Math.round(P.estimateM * .4), builtM: Math.round(P.estimateM * .38), progress: 38 };
  await run(short, /the approved money is spent/, /^Add .* and restart$/, (p) => check(p.status === "in_progress" && p.approvedM > short.approvedM, "money added, and the work restarts")); }
// 3. Cutting the scope restarts it too: the scope shrinks to what the unspent money can finish.
{ const P = road(); const short = { ...P, approvedM: Math.round(P.estimateM * .6), spentM: Math.round(P.estimateM * .55), builtM: Math.round(P.estimateM * .45), progress: 45 };
  await run(short, /approved money is spent/, /^Cut the scope$/, (p, card) => { check(p.status === "in_progress", "the scope is cut and the work restarts"); check(/Work restarts/.test(card), "the result says so"); }); }
// 4. The contractor fled: replace them.
await run(road({ fled: true, decisions: [{ year: 1, text: "The contractor took the mobilisation fee (₦1.4B) and fled to Dubai." }] }), /the contractor fled/, /^Replace the contractor$/, (p) => check(p.status === "in_progress" && p.contractorId !== "kestrel", "a new contractor restarts it"));

srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
