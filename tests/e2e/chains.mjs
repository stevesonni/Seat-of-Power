/* Consequence chains in the browser: the harvest letter from Plateau, the
   Portuguese investor, armed men on the Coastal Highway, and the court that
   strikes down the business order (and the appeal). node tests/e2e/chains.mjs */
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
const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { chains: true } });
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
const seen = new Set();
const r = await playUntil(g, t0 => { const t = t0.replace(/⁠/g, "");
  if (/bumper harvest of tomatoes in Plateau/.test(t)) seen.add("harvest");
  if (/Lusitana Agro-Industrial wants to build in Plateau/.test(t)) seen.add("investor");
  if (/Ex-militants threaten to blow up the Coastal Highway/.test(t)) seen.add("crisis");
  if (/struck down your Ease of Doing Business order/.test(t)) seen.add("court");
  if (/TOMATO PROCESSING PLANT|LUSITANA AGRO-INDUSTRIAL BREAKS GROUND|LOOKS ELSEWHERE/.test(t)) seen.add("investor-paper");
  if (/Appeal granted|Appeal dismissed|The investors are leaving/.test(t)) seen.add("appeal");
  if (/SURVEILLANCE DEAL|JTF SECURES|MILITANTS BOMB|IS STALLED/.test(t)) seen.add("crisis-paper");
  return seen.size >= 7; }, { max: 260, prefer: [/Lusitana|Ex-militants|struck down your Ease|bumper harvest/, /^✍️ Handle it personally$/, /^Welcome them/, /^Send in the Joint Task Force/, /^Appeal to the higher court/, /^Noted$/] });
console.log("  chain beats seen: " + [...seen].join(", "));
check(seen.has("harvest"), "the Minister of Agriculture's harvest letter from Plateau");
check(seen.has("investor"), "Lusitana (Portugal) writes because of the harvest");
check(seen.has("investor-paper"), "the answer to the investor makes the front page");
check(seen.has("crisis"), "armed militants stop the Coastal Highway halfway");
check(seen.has("crisis-paper"), "clearing them out makes the front page");
check(seen.has("court"), "the court strikes down the Ease of Doing Business order");
check(seen.has("appeal"), "the appeal is decided");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
