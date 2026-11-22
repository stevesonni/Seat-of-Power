/* Every letter in the mailbox says what it is about (owner, 22 Nov 2026: "see these half done letters": one read only
   "Hon.", the White House and UN letters had no text at all). Plays a governor and a President and reads every letter
   that arrives. Run: npm run build:game, then node tests/e2e/letters-full.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const seen = new Map();
const read = async (g) => { const L = await g.page.evaluate(() => (window.SOP && window.SOP.lettersTest) ? window.SOP.lettersTest() : []); L.forEach(l => { if (!seen.has(l.key)) seen.set(l.key, l); }); };
const short = () => [...seen.values()].filter(l => l.err || String(l.body || "").replace(/\s+/g, " ").trim().length < 30 || /^(Hon|Dr|Rt|Prof)\.$/.test(String(l.body).trim()));
// A governor, two years.
{ const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
  const g = await open(srv.port, { save: Y1, seed: 9, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await playUntil(g, t => /Year 3 of 4/.test(t), { max: 500, onStep: () => read(g) });
  await g.browser.close(); }
const nGov = seen.size;
// A President, two years (the war letters: the White House, the UN in Geneva).
{ const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
  const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
    opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
    week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
  const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
  await g.click(/Road to Aso Rock/); await g.wait(900); await g.click(/Take the oath of office/); await g.wait(1500);
  await g.click(/^✋ Take the oath$/); await g.wait(600);
  for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
  await g.click(/^Next: the address$/); await g.wait(500); await g.click(/Deliver the address/); await g.wait(1200);
  await playUntil(g, t => /Year 4 of/.test(t), { max: 700, onStep: () => read(g) });
  await g.browser.close(); }
console.log("  letters read: " + nGov + " as governor, " + (seen.size - nGov) + " as President");
const bad = short(); bad.forEach(l => console.log("  short:", l.key, "|", l.title, "|", JSON.stringify(l.body || l.err)));
check(seen.size > 20, "many letters were read (" + seen.size + ")");
check(!bad.length, "every letter has a real body (" + bad.length + " short)");
const war = [...seen.values()].filter(l => /pres_bk/.test(l.key) && /White House|Geneva|United Nations/.test(l.title + l.body));
if (war.length) check(war.every(l => l.body.length > 80), "the war letters (White House, Geneva) read in full");
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
