/* Scenarios that deliver what they promise, in a browser. The Hostile House:
   once the commissioners are named, Day One brings the Speaker to your office;
   the Desk shows the goal, the deadline, what the House is doing to you and the
   cards you could hold; the opposition majority blocks the budget; at the year's
   end the Speaker makes a move; at the deadline the impeachment motion lands
   full-screen, and the traditional rulers' card saves you, at a price.
   Run: npm run build:game, then node tests/e2e/scenarios.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";

const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const okay = async (g) => { for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue|Later)( →)?$/); i++) await g.wait(300); };
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button, .opt")].find(x => x.offsetParent && new RegExp(src).test(x.textContent.trim())); if (!b) return false; b.click(); return true; }, re.source);
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
// To the year's tray: play the year, settle the Treasury, end it.
const toTray = async (g) => {
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(500); await okay(g);
  const r = await playUntil(g, tx => /Done: end the year/.test(tx), { max: 80 });
  await g.wait(400); await okay(g); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g);
  await g.click(/^Done: end the year/); await g.wait(1500); await okay(g);
  if (await g.click(/^Open the Treasury$/)) { await g.wait(800); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g); await g.click(/^Desk\d*$/); await g.wait(400); await g.click(/^Today$/); await g.wait(400); await g.click(/^Done: end the year/); await g.wait(1500); await okay(g); }
  await g.click(/^(CONTINUE|Continue)$/); await g.wait(3500); await okay(g);
  return r.ok;
};
const openLetter = async (g, re) => { for (let i = 0; i < 6; i++) { const ok = await g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && new RegExp(src).test(x.textContent)); if (!b) return false; b.click(); return true; }, re.source); if (ok) return true; await okay(g); await g.wait(700); } return false; };

// ── 1. The plan's last step ──
const mode = { kind: "scenario", id: "hostile_house" };

// ── 1. Day One, and the logjam on the Desk ──
{ const sv = JSON.parse(Y1.sop_save); sv.setup = { ...sv.setup, mode }; sv.stc = { ...sv.stc, modeShown: true, house: { seats: 24, loyal: 9 } };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
  await g.click(/^Continue/); await g.wait(2500);
  let t = await g.txt();
  check(!/Day One:/.test(t), "the Speaker waits until the commissioners are named");
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(500); await okay(g);
  check(!!(await g.click(/^Convene the ministries$/)), "the Governor convenes the ministries"); await g.wait(1200);
  for (let i = 0; i < 12 && !/Day One:/.test(t); i++) { await g.click(/^(Close the session|Got it|Okay|Continue)( →)?$/); await g.wait(1000); t = await g.txt(); }
  check(/Day One: The House will not work with you/i.test(t) && /rejected every commissioner you just named/.test(t), "then Day One: the Speaker walks in");
  check(/Cut a deal with the Speaker/.test(t) && /Go over their heads to the people/.test(t) && /Drop your campaign promise/.test(t), "four answers, each with its price");
  check(await tap(g, /^Go over their heads to the people/), "the Governor answers");
  await g.wait(1500); t = await g.txt();
  for (let i = 0; i < 6 && !/The wards are listening/.test(t); i++) { await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(500); t = await g.txt(); if (!/The wards are listening/.test(t)) { await g.click(/^(Got it|Okay|Continue)( →)?$/); await g.wait(400); t = await g.txt(); } }
  check(/The wards are listening/.test(t) && /Your goal: a majority in the House, by the end of/i.test(t), "the answer lands, with the goal and its deadline");
  for (let i = 0; i < 4; i++) { await okay(g); await g.click(/^Close the session$/); await g.wait(400); }
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(500); await okay(g);
  await g.click(/^Desk\d*$/); await g.wait(600);
  const strip = await g.page.evaluate(() => { const e = document.querySelector("[data-testid=scen-strip]"); return e ? e.innerText : ""; });
  check(/Get a majority in the House by the end of \d{4}/i.test(strip) && /members with you/.test(strip), "the Desk shows the logjam and its deadline (" + strip.split("\n")[0] + ")");
  check(/Or else:.*impeach/i.test(strip) && /traditional rulers/i.test(strip) && /Attorney-General/.test(strip), "…the threat, and the uno cards that could save you");
  check(/While it lasts:.*votes down your bills, your budget/i.test(strip), "…and what the House is doing to you while it lasts");
  const s2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
  check(s2.stc && s2.stc.scen && s2.stc.scen.day1 === "people", "the answer is in the save");
  const r1 = await playUntil(g, tx => /opposition majority under/i.test(tx), { max: 40 });
  check(r1.ok && /BLOCKED/.test(await g.txt()), "the opposition majority blocks the budget in the House");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 2. The year's end: the Speaker's move ──
{ const sv = JSON.parse(Y1.sop_save); sv.setup = { ...sv.setup, mode };
  sv.stc = { ...sv.stc, modeShown: true, house: { seats: 24, loyal: 9 }, scen: { id: "hostile_house", day1: "people", flags: {}, prog: 0, base: {} } };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
  check(await toTray(g), "the Governor reaches the end of year 1");
  check(await openLetter(g, /The House probes your contracts/), "the Speaker makes his move: the House probes your contracts");
  await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(1000);
  check(/Send every file/.test(await g.txt()) && /Offer the committee chairmen projects/.test(await g.txt()), "three answers, with their odds and prices");
  await tap(g, /^Offer the committee chairmen projects/); await g.wait(1500);
  check(/The probe is adjourned/.test(await g.txt()), "the answer lands");
  for (let i = 0; i < 4; i++) { await okay(g); await g.wait(300); }
  const s2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
  check(s2.stc.scen.moves && s2.stc.scen.moves.includes("probe"), "the move is not played twice");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 3. The deadline, full-screen: the impeachment motion, and the rulers' card ──
{ const sv = JSON.parse(Y1.sop_save); sv.setup = { ...sv.setup, mode }; sv.turn = 3;
  sv.stc = { ...sv.stc, lastTurn: 2, modeShown: true, house: { seats: 24, loyal: 9 }, scen: { id: "hostile_house", day1: "people", flags: {}, prog: 0, warned: 2, moves: ["probe", "defectors"], base: {} } };
  sv.skApp = { ...(sv.skApp || {}), traditional: 80 };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
  check(await toTray(g), "the Governor reaches the end of year 3");
  let t = ""; for (let i = 0; i < 12 && !/How do you survive the vote\?/.test(t); i++) { await g.wait(800); t = await g.txt(); if (!/How do you survive the vote\?/.test(t)) await okay(g); }
  check(/The House moves to impeach you/.test(t) && /How do you survive the vote\?/.test(t), "the deadline: the impeachment motion, full-screen");
  check(/Play your card: The traditional rulers/i.test(t) && /Face the vote/.test(t) && /Buy the votes on the floor/.test(t) && /the rulers' favour −20/.test(t), "the rulers' card (and what it costs), the vote and the bribe");
  await tap(g, /^🃏 Play your card: The traditional rulers/); await g.wait(1800);
  t = await g.txt(); for (let i = 0; i < 6 && !/You played your card|GOVERNOR SURVIVES/i.test(t); i++) { await okay(g); await g.wait(600); t = await g.txt(); }
  check(/You played your card/i.test(t) || /GOVERNOR SURVIVES/i.test(t), "the card saves the Governor");
  for (let i = 0; i < 4; i++) { await okay(g); await g.wait(300); }
  const s2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
  check(s2.stc && s2.stc.scen && s2.stc.scen.resolved === "saved:rulers", "the save records how you survived");
  check(s2.skApp && s2.skApp.traditional <= 62, "playing the card spent the rulers' favour (" + (s2.skApp && s2.skApp.traditional) + ")");
  check(!s2.gEnd, "still in office");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }
srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
