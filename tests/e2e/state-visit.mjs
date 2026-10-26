/* The President visits a state: the Desk card, pick Ebonyi and a purpose,
   the flight, the landing, the visit and its front page; two a year.
   node tests/e2e/state-visit.mjs */
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
const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { early: true } });
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
const r = await playUntil(g, t => /Visit a state/.test(t) && /visits left this year/.test(t), { max: 120 });
check(r.ok, "the President's Desk offers a visit to a state");
for (let i = 0; i < 6 && await g.click(/^(Continue|Okay|Got it|Close)$/); i++) await g.wait(500); // the Security Council and the adviser speak first
await g.click(/🛬 Plan it/); await g.wait(500);
await g.page.selectOption("#sv-state", "Ebonyi"); await g.wait(400);
check(/surprise inspection of federal projects/.test(await g.txt()), "pick Ebonyi, then a purpose");
await shot("state-visit-pick");
await g.page.evaluate(() => [...document.querySelectorAll("button.ds-option, button.opt")].find(b => /town hall/.test(b.textContent)).click()); await g.wait(1000);
for (let i = 0; i < 14 && !/A town hall in Ebonyi/.test(await g.txt()); i++) { if (!(await g.click(/^(Continue|Got it|Okay|Noted|Go)$/))) await g.page.evaluate(() => { const f = document.querySelector(".sop-flight"); f && f.click(); }); await g.wait(1200); }
check(/A town hall in Ebonyi/.test(await g.txt()), "the town hall in Ebonyi");
await shot("state-visit-town");
for (let i = 0; i < 10 && !/I HEAR YOU/.test(await g.txt()); i++) { if (!(await g.click(/^(Continue|Got it|Okay)$/))) await g.page.evaluate(() => { const f = document.querySelector(".sop-flight"); f && f.click(); }); await g.wait(900); }
check(/PRESIDENT IN EBONYI/.test(await g.txt()), "the front page");
await g.wait(2500);
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check(sv.stc && sv.stc.stateVisits && sv.stc.stateVisits.list.includes("Ebonyi"), "the visit is counted (one left this year)");
check(+(await g.page.evaluate(() => localStorage.getItem("sop_trips"))) >= 1, "and counts as a trip for the career");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
