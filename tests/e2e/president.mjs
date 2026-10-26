/* The Presidency in a browser: a won presidential race → the oath → the
   governorship's engine at national scale (six zones, 37 states, the
   president's words). Run after npm run build:game: node tests/e2e/president.mjs */
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
const seen = new Set();
const r = await playUntil(g, t0 => { const t = t0.replace(/\u2060/g, ""); if (/(Federal Executive|National Security) Council/.test(t) && /Close the session/.test(t)) seen.add("table"); if (/^Trade · /m.test(t) || /Trade · /.test(t)) seen.add("trade"); if (/The national economy · \d+/i.test(t)) seen.add("econ"); if (/Diplomacy · The UN General Assembly/i.test(t)) seen.add("unga"); if (/Last year you /.test(t)) seen.add("recap"); if (/Answer ›/.test(t)) seen.add("complaints"); if (/Big moves \d+\/\d+/.test(t)) seen.add("bigmoves"); for (const k of ["Address to the nation", "Senate President ·", "Chair, Governors' Forum ·", "Chief of Army Staff ·", "Governor of the Central Bank ·", "National Chairman of the party ·", "The world stage", "The insurgency", "The fuel crisis", "The naira crisis", "The National Security Council", "North-East:", "North-West:", "South-East:", "Niger Delta:"]) if (t.includes(k)) seen.add(k); return /Year 3 of 4/.test(t); }, { max: 900 });
console.log("  national deck seen: " + [...seen].join(", "));
check(seen.size >= 3, "the national deck plays: crisis, power centres, the world stage");
check(seen.has("recap"), "a card opens with what you decided last year");
check(seen.has("complaints"), "the President hears complaints, and can answer them");
check(seen.has("bigmoves"), "the President's big moves are counted on the Desk");
check(seen.has("econ"), "the Special Adviser's economic letter arrives (SYS.econbrief)");
check(seen.has("unga"), "the UN General Assembly letter arrives (SYS.diplomacy)");
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check(sv.stc && sv.stc.inaugurated && sv.stc.pres && (sv.stc.pres.commits || []).length === 3, "the commitments and the power centres are saved");
{ const st = (sv.stc.pres || {}).story || {}, hist = st.hist || [], fs = sv.stc.frontStories || {};
  check(hist.length >= 1 && new Set(st.seen || []).size === (st.seen || []).length, "the national crisis is a storyline that moves on (" + hist.map(h => h.beat + ":" + h.opt).join(", ") + ")");
  check(Object.values(fs).some(x => (x.hist || []).length >= 1), "a security front moved on to its next development"); }
{ const T = sv.stc.trade || {}; check(T.stance === "targeted" && (T.hist || []).length >= 1, "the trade policy runs: reserves, food prices and exports each year (" + JSON.stringify((T.hist || []).slice(-1)) + ")"); }
check(seen.has("table"), "the FEC and the Security Council sit in their chambers");
const t = await g.txt();
await shot("year2");
check(r.ok, "the presidency plays into its third year");
check(!/\bGovernor\b(?! of the Central Bank)|House of Assembly|\bLGAs?\b|Commissioner/.test(t), "the screen speaks the president's words");
const left = (t.match(/[^\n]*(Governor|House of Assembly|Commissioner|LGA)[^\n]*/g) || []).slice(0, 6); if (left.length) console.log("  left:", left);
for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue|On to the next.*)$/); i++) await g.wait(400);
await g.click(/^Compound$/); await g.wait(1200); await shot("compound");
check(await g.page.evaluate(() => [...document.querySelectorAll("img")].some(i => /compound-villa/.test(i.src))), "the Desk shows the Villa compound");
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.slice(0, 3).join(" | ") : ""));
await g.browser.close(); srv.close();
process.exit(fails ? 1 : 0);
