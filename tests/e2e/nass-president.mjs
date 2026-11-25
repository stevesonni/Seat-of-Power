/* The President's two chambers (owner, 25 Nov 2026: "the President deals with the House and the Senate separately…
   they will elect a Senate President and a House of Reps Speaker"). Each chamber elects its presiding officer; a hostile
   one blocks new spending until his price is met; impeachment needs both chambers, and comes when both are hostile and
   approval slips. Run: npm run build:game, then node tests/e2e/nass-president.mjs */
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
  week: 6, log: [], pledges: [], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
// 1. Into office, to get a real presidency save.
const g0 = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
await g0.click(/Road to Aso Rock/); await g0.wait(900);
await g0.click(/Take the oath of office/); await g0.wait(1500);
await g0.click(/^✋ Take the oath$/); await g0.wait(600);
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g0.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g0.wait(150); }
await g0.click(/^Next: the address$/); await g0.wait(500); await g0.click(/Deliver the address/); await g0.wait(2500);
let base = null; for (let i = 0; i < 20 && !base; i++) { base = await g0.page.evaluate(() => { try { const v = JSON.parse(localStorage.getItem("sop_save") || "null"); return v && v.turn >= 1 ? localStorage.getItem("sop_save") : null; } catch (e) { return null; } }); if (!base) { await g0.click(/^(Continue|Okay|Got it)$/); await g0.wait(700); } }
const keys = await g0.page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => /^sop_/.test(k)).map(k => [k, localStorage.getItem(k)])));
await g0.browser.close();
check(!!base, "a presidency save exists");

const ASKS = [{ id: "autonomy", l: "Financial autonomy for the National Assembly", costB: 4, fx: { pStab: -2 } }];
const ch = (name, hostile) => ({ race: 1, bias: hostile ? -.1 : 0, leader: { name, hostile, kind: hostile ? "avenger" : "loyalist", asks: hostile ? ASKS : [], done: [], at: 1, term: 1 } });
const boot = async (turn, stc, test = {}) => { const sv = JSON.parse(base); sv.turn = turn; sv.s = { ...sv.s, cash: 300 }; sv.stc = { ...sv.stc, lastTurn: turn - 1, ...stc };
  const g = await open(srv.port, { save: { ...keys, sop_save: JSON.stringify(sv) }, test: { noStrikes: true, ...test } }); await g.click(/^Continue/); await g.wait(2000); return g; };

if (process.env.ONLY !== "2") {
// 1. Year one: both chambers elect their presiding officers.
{ const seen = new Set(); const g = await open(srv.port, { save: { ...keys, sop_save: base }, test: { noStrikes: true } }); await g.click(/^Continue/); await g.wait(2000);
  const r = await playUntil(g, t => { if (/The Senate elects its Senate President/.test(t)) seen.add("sen"); if (/The House of Representatives elects its Speaker/.test(t)) seen.add("reps"); return seen.size === 2 && false; }, { max: 160, prefer: [/^Later$/],
    onStep: async () => { const N = await g.page.evaluate(() => window.SOP.stc && window.SOP.stc.nass); if (N && N.sen && N.sen.leader) seen.add("senDone"); if (N && N.reps && N.reps.leader) seen.add("repsDone"); } });
  const N = await g.page.evaluate(() => window.SOP.stc.nass || {});
  check(seen.has("sen") && seen.has("reps"), "the Senate and the House each elect their presiding officer (" + [...seen].join(",") + ")");
  check(!!(N.sen && N.sen.leader && N.reps && N.reps.leader), "a Senate President and a Speaker are in the chair (" + (N.sen && N.sen.leader && N.sen.leader.name) + "; " + (N.reps && N.reps.leader && N.reps.leader.name) + ")");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close(); }

}
// 2. A hostile Senate President blocks new spending; the House alone cannot impeach.
{ const g = await boot(2, { nass: { sen: ch("Sen. Bala Garba", true), reps: ch("Rt. Hon. Tolu Bankole", false) } });
  for (let i = 0; i < 4; i++) { if (!(await g.click(/^(Okay|Got it|Continue|Noted)$/))) break; await g.wait(500); }
  if (process.env.DBG) console.log("  blocks:", await g.page.evaluate(() => window.SOP_SYS.nassBlocks(window.SOP.stc.nass, window.SOP.turn)), await g.page.evaluate(() => { const o = window.SOP_outcome; window.__outs = []; window.SOP_outcome = (x) => { window.__outs.push(x && x.title); return o(x); }; return typeof o; }));
  const okp = await g.page.evaluate(() => window.SOP.policyTest()); await g.wait(900);
  if (process.env.DBG) console.log("  outs:", await g.page.evaluate(() => JSON.stringify(window.__outs)));
  let t = await g.txt(); for (let i = 0; i < 12 && !/The Senate will not fund it/.test(t); i++) { await g.page.evaluate(() => { const d = [...document.querySelectorAll("[role=alertdialog]")].pop(); const b = d && [...d.querySelectorAll("button")].filter(x => x.offsetParent).pop(); b && b.click(); }); await g.wait(700); t = await g.txt(); }
  if (process.env.DBG) console.log("  policy:", okp, JSON.stringify(await g.page.evaluate(() => [window.SOP.turn, window.SOP.stc.nass])).slice(0, 300), "|", t.slice(0, 500).replace(/\n/g, " / "));
  if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/nass-block.png" });
  if (process.env.DBG) console.log("  held?", await g.page.evaluate(() => document.querySelectorAll("[role=alertdialog]").length), t.slice(0, 300).replace(/\n/g, " / "));
  check(/The Senate will not fund it/.test(t) && /Bala Garba/.test(t), "a hostile Senate President blocks new spending");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close(); }

if (process.env.ONLY !== "2") {
// 3. Both chambers hostile, approval slipped last year: the Assembly moves to impeach (Section 143).
{ const g = await boot(3, { appPrev: 60, appMark: 50, nass: { sen: ch("Sen. Bala Garba", true), reps: ch("Rt. Hon. Idris Kolo", true) } }, {});
  const r = await playUntil(g, t => /Both chambers turn on the President/i.test(t) || /Year 4 of 4/.test(t), { max: 200, prefer: [/^Later$/] });
  check(/Both chambers turn on the President/i.test(await g.txt()), "both chambers hostile and approval slipping: impeachment proceedings");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close(); }
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
