/* A contractor flees abroad under a President. The Attorney-General asks that country to freeze the money; with
   good standing abroad (summits, approval, clean hands) it acts and the full amount comes home the next year;
   with poor standing it declines. Run: npm run build:game, then node tests/e2e/japa-president.mjs */
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
import * as SYS from "../../game/systems/index.js";
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
// 2. The same save with a fled contractor, and a chosen record abroad.
const P = () => { const mk = SYS.makeProject({ id: "p_rail", title: "Kano–Kaduna Rail", type: "road", qty: 20, lga: "Kano", ministryId: "works", approvedM: 60000, thisYearM: 30000, year: 1 });
  return { ...mk, status: "stalled", fled: true, japaChecked: true, contractor: "Kestrel Construction", startTurn: 1, progress: 5, ticked: 1 }; };
const japa = { id: "japa_p_rail", kind: "japa", due: 2, projId: "p_rail", firm: "Kestrel Construction", to: "Canada", lossM: 9000 };
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && new RegExp(src).test(x.textContent)); if (b) { b.click(); return true; } return false; }, re.source);
async function run(trips, app, cor) {
  const sv = JSON.parse(base); sv.turn = 2; sv.projTicked = 2; sv.projects = [P()]; sv.s = { ...sv.s, app, cor, cash: 50 };
  const seen = SYS.PRES_WORLD.slice(0, trips).map(c => c.id);
  sv.stc = { ...sv.stc, lastTurn: 1, chains: [japa], pres: { ...(sv.stc.pres || {}), seen: [...((sv.stc.pres || {}).seen || []), ...seen] } };
  const g = await open(srv.port, { save: { ...keys, sop_save: JSON.stringify(sv) } });
  await g.click(/^Continue/); await g.wait(2000);
  let found = false;
  const r0 = await playUntil(g, () => found, { max: 200, prefer: [/Attorney-General ask Canada/], onStep: async () => { if (!found) found = await g.page.evaluate(() => (window.SOP.logs || []).some(l => /The Attorney-General asked Canada/.test(l.tx))); } });
  await g.wait(1200);
  const t = await g.txt(), logs = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | ")), cash0 = await g.page.evaluate(() => window.SOP.s && window.SOP.s.cash);
  const r = { found, text: t + " " + logs, agreed: /Canada agreed to act/.test(logs), errors: g.errors.slice(), g, cash0 };
  return r;
}
const good = await run(4, 62, .2);
check(good.found, "the President's card offers the Attorney-General's request to Canada");
check(good.agreed && /will act|has agreed/.test(good.text), "good standing abroad: the country agrees to act");
// The next year: the exact amount comes home, with a letter.
const g = good.g; let back = false;
await playUntil(g, () => back, { max: 400, onStep: async () => { if (!back) back = await g.page.evaluate(() => (window.SOP.logs || []).some(l => /Recovered: Canada froze Kestrel/.test(l.tx))); } });
const logs = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | "));
check(back && /repatriated the full ₦9(\.0)?B|repatriated the full ₦9,000M|repatriated the full/.test(logs) && /9/.test((logs.match(/repatriated the full [^ ]+/) || [""])[0]), "next year the full amount is recovered (" + ((logs.match(/repatriated the full [^ ]+/) || [""])[0]) + ")");
check(!good.errors.length, "no page errors" + (good.errors.length ? ": " + good.errors.join("; ") : ""));
await g.browser.close();
const bad = await run(0, 58, .3);
check(bad.found && !bad.agreed && /declined to act/.test(bad.text) && /standing abroad \(\d+\/100\)|weak/.test(bad.text), "poor standing abroad: the country declines and says why; nothing is booked");
console.log("  bad:", bad.found, bad.agreed, /declined to act/.test(bad.text), (bad.text.match(/standing abroad[^.]*/) || [""])[0]);
await bad.g.browser.close();
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
