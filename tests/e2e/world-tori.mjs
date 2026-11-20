/* The President's Tori hears the world: foreign powers and, in the war, its leaders. node tests/e2e/world-tori.mjs */
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
await playUntil(g, t => /Tori @NGRPresident/.test(t.replace(/\u2060/g, "")) && !/Pick your Chief of Staff/.test(t), { max: 120 });
for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue|Close|Not now)$/); i++) await g.wait(400);
await g.page.evaluate(() => window.SOP.stcTest(p => ({ ...p, bakunda: { ...(p.bakunda || {}), country: "kasongo", stage: 3, atWar: true, progress: 20, dipl: [] } })));
await g.wait(500);
console.log("  screen: " + (await g.txt()).slice(0, 300).replace(/\n/g, " / "));
const opened = await g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); b && b.click(); return !!b; });
check(opened, "the President's Desk has the Tori row"); await g.wait(800);
await shot("world-feed");
const t = await g.page.evaluate(() => (document.querySelector("[data-testid=tori]") || document.body).innerText);
check(/General Kalembe/.test(t) && /@GenKalembe/.test(t), "the war country's general posts on the President's feed");
check(/The Kasongo war/.test(t), "war posts are labelled as the war");
check(/@KingOfOstrava|@ECOWAS_Commission/.test(t), "the Axis ally or ECOWAS speaks too");
await g.page.evaluate(() => document.querySelector("[data-testid=tori] [data-sop-tweet=foreign] [data-sop-tori-act=reply]").click()); await g.wait(400);
const opts = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-tori-comment]")].map(b => b.getAttribute("data-sop-tori-comment") + ":" + b.textContent));
console.log("  options: " + opts.join(" | "));
check(opts.some(o => /^threat:.*jets/.test(o)) && opts.some(o => /^talks:.*Geneva/.test(o)), "the President's replies answer the general, not generic lines");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-comment=threat]").click()); await g.wait(500);
const t2 = await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText);
check(/Let them come/.test(t2), "the general answers back");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-testid=tori] [role=tab]")].find(x => /Explore/i.test(x.getAttribute("aria-label") || "")); b && b.click(); }); await g.wait(400);
check(/#KasongoWar/.test(await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText)), "#KasongoWar trends");
await shot("world-tori");
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.slice(0, 3).join(" | ") : ""));
await g.browser.close(); srv.close();
console.log(fails ? fails + " check(s) failed" : "all checks passed"); process.exit(fails ? 1 : 0);
