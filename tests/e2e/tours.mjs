/* Visits that become work: a governor tours an LGA (the chairman's request
   lands on the Desk); a President convenes the FEC and the National Security
   Council (never the Traditional Council), then visits Ebonyi and hears a
   request that lands on the Desk. node tests/e2e/tours.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const OUT = process.env.SHOTS || "/tmp";

// ── The governor's LGA tour.
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let g = await open(srv.port, { save: YEAR1, seed: 7 });
await g.click(/^Continue/); await g.wait(1800);
await playUntil(g, t => /Tour a local government/.test(t), { max: 60, prefer: [/^Tell the communities first/] });
check(/Tour a local government/.test(await g.txt()), "the Desk offers an LGA tour");
const needsBefore = await g.page.evaluate(() => (JSON.parse(localStorage.getItem("sop_save") || "{}").needs || []).length);
for (let i = 0; i < 6 && await g.click(/^(Continue|Okay|Got it|Close)$/); i++) await g.wait(500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /🚙 Plan it/.test(x.textContent)); b && b.click(); }); await g.wait(500);
const lga = await g.page.evaluate(() => { const s = document.getElementById("lt-lga"); const v = s && s.options[1] && s.options[1].value; return v || null; });
check(!!lga, "the tour lists the state's LGAs");
await g.page.selectOption("#lt-lga", lga); await g.wait(300);
check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option")].find(x => /council chairman/.test(x.textContent)); b && b.click(); return !!b; }), "choose to meet the chairman"); await g.wait(900);
let t = await g.txt(), heard = false;
for (let i = 0; i < 6 && !(heard = new RegExp("Chairman, " + lga, "i").test(t)); i++) { await g.click(/^Continue$/); await g.wait(700); t = await g.txt(); }
check(heard, "the chairman of " + lga + " speaks in person");
await g.page.screenshot({ path: OUT + "/tour-chairman.png" });
for (let i = 0; i < 4 && !/The request is on your Desk/.test(t); i++) { await g.click(/^(Continue|Okay|Got it)$/); await g.wait(700); t = await g.txt(); }
check(/The request is on your Desk/.test(t), "his request goes to the Desk");
for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue|Close)$/); i++) await g.wait(400);
await g.wait(2600);
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check((sv.needs || []).some(n => n.visit && n.lga), "a need for that LGA is saved (" + ((sv.needs || []).filter(n => n.visit).map(n => n.k + "@" + n.lga).join(",")) + ", before " + needsBefore + ")");
check(sv.stc && sv.stc.lgaTours && sv.stc.lgaTours.list.includes(lga), "the tour is counted for the year");
check(!g.errors.length, "no page errors (governor) " + g.errors.join(" | "));
await g.browser.close();

// ── The President's councils and a visit to Ebonyi.
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const zones = { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 };
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones,
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false,
  res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
await g.click(/Road to Aso Rock/); await g.wait(900);
await g.click(/Take the oath of office/); await g.wait(1500);
await g.click(/^✋ Take the oath$/); await g.wait(600);
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
await g.click(/^Next: the address$/); await g.wait(500);
let sawTrad = false, sawFEC = false, sawNSC = false;
await playUntil(g, t0 => { if (/Traditional Rulers Council|Traditional Council/.test(t0)) sawTrad = true; if (/Convene the Federal Executive Council/.test(t0)) sawFEC = true; if (/Convene the National Security Council/.test(t0)) sawNSC = true; return /Visit a state/.test(t0); }, { max: 120 });
check(sawFEC && sawNSC, "the President's setup: the Federal Executive Council and the National Security Council");
check(!sawTrad, "no Traditional Council for the President");
await g.wait(2600);
const pc = await g.page.evaluate(() => (JSON.parse(localStorage.getItem("sop_save") || "{}").fedCouncils) || null);
check(!!(pc && pc.fec && pc.nsc), "both councils are sitting");
for (let i = 0; i < 6 && await g.click(/^(Continue|Okay|Got it|Close)$/); i++) await g.wait(500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /🛬 Plan it/.test(x.textContent)); b && b.click(); }); await g.wait(500);
await g.page.selectOption("#sv-state", "Ebonyi").catch(() => {}); await g.wait(300);
check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option")].find(x => /town hall/.test(x.textContent)); b && b.click(); return !!b; }), "a town hall in Ebonyi"); await g.wait(1000);
let all = "";
for (let i = 0; i < 14 && !/It is on your Desk now/.test(all += await g.txt()); i++) { if (!(await g.click(/^(Continue|Got it|Okay|Noted|Go)$/))) await g.page.evaluate(() => { const f = document.querySelector(".sop-flight"); f && f.click(); }); await g.wait(1200); }
t = all + await g.txt(); console.log("  seen:", [...new Set((t.match(/[^\n]*(Ebonyi|Desk now|hear)[^\n]*/gi) || []))].slice(0, 12).join(" // "));
check(/It is on your Desk now/.test(t), "Ebonyi's request lands on the Desk");
await g.page.screenshot({ path: OUT + "/tour-ebonyi.png" });
for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue|Close)$/); i++) await g.wait(400);
await g.wait(2600);
const ps = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check((ps.needs || []).some(n => n.visit && n.lga === "Ebonyi"), "a need for Ebonyi is saved");
// The Councils tab shows the FEC and the Security Council.
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "coun" }, "*")); await g.wait(700);
t = await g.txt();
check(/The Federal Executive Council/.test(t) && /The National Security Council/.test(t), "the Councils tab shows both councils");
check(!g.errors.length, "no page errors (President) " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
