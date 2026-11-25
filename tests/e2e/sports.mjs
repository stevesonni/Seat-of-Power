/* Sport and stadiums (owner, 25 Nov 2026). A governor without a sports ministry hears from the State Youth Assembly,
   Tori buzzes about it, and saying yes opens the new ministry. A President hears from FIFA or CAF in year two.
   Run: npm run build:game, then node tests/e2e/sports.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));

// ── The governor ──
{ const sv = JSON.parse(Y1.sop_save); sv.ministries = (sv.ministries || []).filter(m => m.id !== "sports");
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 3, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  let L = null; const grab = async () => { if (L) return; try { L = await g.page.evaluate(() => (window.SOP.lettersTest() || []).find(x => /^sc#youth_asm/.test(x.key))) || null; } catch (e) {} };
  await playUntil(g, () => !!L, { max: 400, onStep: grab });
  check(!!L, "the State Youth Assembly writes");
  console.log("  " + (L && L.body));
  check(L && /there is no commissioner for youth or sport, no programme for us and nowhere to play\. The Youth Assembly asks you to create a Ministry of Sports & Youth Development/.test(L.body), "it asks for a voice: the ministry");
  const feed = await g.page.evaluate(() => { try { return JSON.stringify(window.SOP.stc && window.SOP.stc.buzz || []); } catch (e) { return ""; } });
  check(/youth_ask/.test(feed), "Tori is buzzing about the request");
  await g.page.evaluate(() => window.SOP.openLetterTest("youth_asm")); await g.wait(900);
  await g.click(/Handle it personally/); await g.wait(900);
  await g.click(/^Create the Ministry of Sports & Youth Development/); await g.wait(2600);
  for (let i = 0; i < 3 && !/Sports & Youth/.test(await g.txt()); i++) { await g.click(/^(Okay|Got it|Continue)$/).catch(() => {}); await g.wait(800); }
  check(/Sports & Youth Development/.test(await g.txt()), "saying yes opens the new ministry, to choose its commissioner");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── The President ──
{ const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
  const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
    opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
    week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
  const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
  await g.click(/Road to Aso Rock/); await g.wait(900); await g.click(/Take the oath of office/); await g.wait(1500); await g.click(/^✋ Take the oath$/); await g.wait(600);
  for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
  await g.click(/^Next: the address$/); await g.wait(500);
  let L = null; const grab = async () => { if (L) return; try { L = await g.page.evaluate(() => (window.SOP.lettersTest() || []).find(x => /^sc#caf_/.test(x.key))) || null; } catch (e) {} };
  await playUntil(g, () => !!L, { max: 700, onStep: grab });
  check(!!L, "FIFA or CAF writes to the President");
  console.log("  " + (L && L.title) + " · " + (L && L.body));
  check(L && /(FIFA|CAF) wants Nigeria to host/.test(L.title) && /inspectors have failed every Nigerian stadium/.test(L.body) && /the match will be played abroad/.test(L.body), "it says what, why there is no stadium, and what happens otherwise");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
