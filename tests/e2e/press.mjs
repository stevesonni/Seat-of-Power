/* The press below and above 50% (owner, 25 Nov 2026: "If your approval is below 50% the newspaper headlines should be
   hostile even if you did a good job… After you climb past 50% they continue reporting balanced"). The same good news
   at 45% and at 55%; a gain while hostile is halved; the buffer: hostile again at 51% once it has turned.
   Run: npm run build:game, then node tests/e2e/press.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const setApp = async (v) => { await g.page.evaluate((v) => window.SOP.setS(p => ({ ...p, app: v })), v); await g.wait(400); };
const front = () => g.page.evaluate(() => window.SOP.paperTest("NIGERIA SECURES THE HAGUE DEAL", "The court backs Nigeria's claim to the islands", true));

await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: 55 }))); await g.wait(400);
const B = await front(); console.log("  55%: " + B.headline + " · " + B.sub);
check(B && B.good && /HAGUE DEAL/.test(B.headline) && !/PAPER|GIVES AWAY|BENEFITS|PHOTO-OP/.test(B.headline), "at 55% the paper reports the good news as good");

// Down to 45%: a direct set is a loaded record, so step down instead.
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: 45 }))); await g.wait(400);
check((await g.page.evaluate(() => window.SOP.pressNow())).hostile, "at 45% the press is hostile");
const H = await front(); console.log("  45%: " + H.headline + " · " + H.sub);
check(H && !H.good && /PAPER|GIVES AWAY|BENEFITS|PHOTO-OP/.test(H.headline) && /court backs Nigeria/i.test(H.sub), "at 45% the same deal reads as a failure, the facts kept beneath");

await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: p.app + 4 }))); await g.wait(400);
const a1 = (await g.page.evaluate(() => window.SOP.pressNow())).app;
check(a1 === 47, "a +4 gain while hostile counts as +2 (" + a1 + ")");

await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: 47 + 8 }))); await g.wait(400); // +8 halved: 51
const P51 = await g.page.evaluate(() => window.SOP.pressNow());
check(P51.app === 51 && P51.hostile, "at 51%, climbing back, the press is still hostile (" + P51.app + ")");
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: 53 }))); await g.wait(400); // +2 halved: 52
const P52 = await g.page.evaluate(() => window.SOP.pressNow());
check(P52.app === 52 && !P52.hostile, "from 52% it is balanced again (" + P52.app + ")");
const B2 = await front(); check(B2 && B2.good, "and the paper reports the deal as good again");

check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close();

// ── The President: The Daily Impact, the same rule (owner: "Same for the President").
{ const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
  const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
    opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
    week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
  const p = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { noStrikes: true } });
  await p.click(/Road to Aso Rock/); await p.wait(900); await p.click(/Take the oath of office/); await p.wait(1500); await p.click(/^✋ Take the oath$/); await p.wait(600);
  for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await p.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await p.wait(150); }
  await p.click(/^Next: the address$/); await p.wait(2500);
  const fr = () => p.page.evaluate(() => window.SOP.paperTest("NIGERIA SECURES THE HAGUE DEAL", "The court backs Nigeria's claim to the islands", true));
  await p.page.evaluate(() => window.SOP.setS(q => ({ ...q, app: 55 }))); await p.wait(400);
  const PB = await fr(); console.log("  President 55%: " + PB.masthead + " · " + PB.headline);
  check(PB && PB.good && /The Daily Impact/.test(PB.masthead) && !/BENEFITS|PAPER|GIVES AWAY|PHOTO-OP/.test(PB.headline), "President at 55%: The Daily Impact reports the deal as good");
  await p.page.evaluate(() => window.SOP.setS(q => ({ ...q, app: 45 }))); await p.wait(400);
  const PH = await fr(); console.log("  President 45%: " + PH.headline + " · " + PH.sub);
  check(PH && !PH.good && /BENEFITS|PAPER|GIVES AWAY|PHOTO-OP/.test(PH.headline), "President at 45%: the same deal reads as a failure");
  await p.page.evaluate(() => window.SOP.setS(q => ({ ...q, app: q.app + 4 }))); await p.wait(400);
  check((await p.page.evaluate(() => window.SOP.pressNow())).app === 47, "President: a +4 gain while hostile counts as +2");
  await p.page.evaluate(() => window.SOP.setS(q => ({ ...q, app: 55 }))); await p.wait(400); // +8 halved: 51
  check((await p.page.evaluate(() => window.SOP.pressNow())).hostile, "President at 51%: still hostile");
  await p.page.evaluate(() => window.SOP.setS(q => ({ ...q, app: 53 }))); await p.wait(400);
  check(!(await p.page.evaluate(() => window.SOP.pressNow())).hostile, "President at 52%: balanced again");
  check(!p.errors.length, "President: no page errors (" + p.errors.join(" | ") + ")");
  await p.browser.close(); }
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
