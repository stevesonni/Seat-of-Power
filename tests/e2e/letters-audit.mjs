/* A sweep of every letter that arrives in a long game (owner, 25 Nov 2026: one letter after another "makes no sense").
   Plays a governor (several seeds) and writes every letter's sender, title and body to a file, with flags for the
   faults the owner kept finding: fragments, "label: amount" lists, too short to say what is happening, cut off.
   Run: npm run build:game, then SEED=3 OUT=/tmp/letters.json node tests/e2e/letters-audit.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let g;
if (process.env.PRES) { // a President, from the oath (as tests/e2e/tours.mjs)
  const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
  const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
    opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
    week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
  g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: +(process.env.SEED || 3) });
  await g.click(/Road to Aso Rock/); await g.wait(900); await g.click(/Take the oath of office/); await g.wait(1500); await g.click(/^✋ Take the oath$/); await g.wait(600);
  for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
  await g.click(/^Next: the address$/); await g.wait(500);
} else {
  g = await open(srv.port, { save: Y1, seed: +(process.env.SEED || 3) });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
}
const seen = new Map();
const grab = async () => { try { for (const L of (await g.page.evaluate(() => window.SOP.lettersTest() || []))) if (!seen.has(L.key) && (L.body || L.title)) seen.set(L.key, L); } catch (e) {} };
await playUntil(g, () => false, { max: +(process.env.STEPS || 700), onStep: grab });
const flag = (L) => { const b = String(L.body || ""), w = b.split(/\s+/).filter(Boolean).length, F = [];
  if (w < 22) F.push("short(" + w + ")");
  if (/(^|\. )[A-Z][^.:]{2,60}: ₦[\d.]+[BMK]?\./.test(b)) F.push("label-amount list");
  if (!/[.!?…)"”’]$/.test(b.trim())) F.push("cut off");
  if (/^[a-z]/.test(b)) F.push("starts lowercase");
  return F; };
const out = [...seen.values()].map(L => ({ key: L.key, from: L.from, title: L.title, body: L.body, flags: flag(L) }));
fs.writeFileSync(process.env.OUT || "/tmp/letters.json", JSON.stringify(out, null, 1));
console.log("letters: " + out.length + ", flagged: " + out.filter(x => x.flags.length).length);
await g.browser.close(); srv.close(); process.exit(0);
