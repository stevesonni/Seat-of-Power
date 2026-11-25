/* Refusing to repay a loan on a project the court stopped (owner, 25 Nov 2026: "otherwise they escalate to the
   federal government and have the international community force payment, so you pay back what they have spent plus
   interest"; "test the refuse to pay path too"). A governor: the Federal Ministry of Finance takes it from the FAAC
   allocation. A President: the creditors abroad force it. Either way a quarter more is taken the next year.
   Run: npm run build:game, then node tests/e2e/court-loan-refuse.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };

const run = async (g, who) => {
  for (let i = 0; i < 6 && await g.click(/^(Okay|Got it|Continue|Close|Later)$/); i++) await g.wait(500);
  check(await g.page.evaluate(() => window.SOP.injunctionTest(null, 0, "Ikwo Road")) === "Ikwo Road", who + ": the court halts Ikwo Road"); await g.wait(1200);
  await g.page.evaluate(() => { const d = [...document.querySelectorAll("div")].filter(x => /^✅ Obey the court$/.test(x.textContent.trim())).pop(); d && d.parentElement.click(); }); await g.wait(1500);
  check((await g.page.evaluate(() => window.SOP.worksNow())).recalls.some(r => r.stage === "due"), who + ": its loan falls due");
  for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(500);
  // The bank's letter, the next year.
  let L = null; const grab = async () => { if (L) return; try { L = await g.page.evaluate(() => (window.SOP.lettersTest() || []).find(x => /^sc#recall_/.test(x.key))) || null; } catch (e) {} };
  await playUntil(g, () => !!L, { max: 300, onStep: grab });
  check(!!L, who + ": the lender writes");
  if (!L) return;
  console.log("  " + L.body);
  check(await g.page.evaluate(() => window.SOP.openLetterTest("recall_")), who + ": the letter opens"); await g.wait(900);
  const head = await g.page.evaluate(() => { const t = (document.querySelector(".sop-letter") || {}).innerText || ""; return t.replace(/\s+/g, " ").trim(); });
  await g.click(/Handle it personally/); await g.wait(1200);
  check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^Refuse to pay/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }), who + ": you refuse to pay");
  check(/^(A SYNDICATE|THE WORLD BANK|AFRICAN DEVELOPMENT|[A-Z ]*BANK)/i.test(head) && !/PARTY SECRETARIAT/.test(head), who + ": the letter is on the lender's letterhead (" + head.slice(0, 60) + ")"); await g.wait(1500);
  for (let i = 0; i < 3 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(500);
  const w1 = await g.page.evaluate(() => window.SOP.worksNow());
  check(w1.recalls.some(r => r.stage === "refused"), who + ": the refusal is recorded");
  const before = w1.loans.find(x => /ikwo/.test(x.key)) || {};
  // The year after: it is taken anyway.
  let seen = "", forced = false;
  await playUntil(g, (t) => { const s = t.replace(/\s+/g, " "); if (/a quarter more than you were asked for|NIGERIA FORCED TO PAY|ABUJA DEDUCTS STATE/i.test(s)) seen += " " + (s.match(/[^.]{0,220}(a quarter more than you were asked for|NIGERIA FORCED TO PAY|ABUJA DEDUCTS STATE'S UNPAID LOAN)[^.]{0,120}/i) || [""])[0]; return forced; },
    { max: 300, onStep: async () => { try { forced = (await g.page.evaluate(() => window.SOP.worksNow())).recalls.some(r => r.stage === "forced"); } catch (e) {} } });
  await g.wait(2500); seen += " " + (await g.txt()).replace(/\s+/g, " ");
  const w2 = await g.page.evaluate(() => window.SOP.worksNow()), after = w2.loans.find(x => /ikwo/.test(x.key)) || {};
  check(forced, who + ": the next year the money is taken anyway");
  check(after.recalled && after.out === 0 && before.out > 0, who + ": the loan is closed (" + before.out + "M owed before; after " + JSON.stringify(after) + ")");
  const wiki = await g.page.evaluate(() => JSON.stringify(localStorage.getItem("sop_save") || "")).catch(() => "");
  const said = seen + " " + wiki;
  if (who === "governor") check(/Federal Ministry of Finance/.test(said) && /FAAC|allocation/.test(said), who + ": Abuja takes it from the state's allocation");
  else check(/World Bank|foreign court|court abroad|creditors|lenders/i.test(said), who + ": the creditors abroad force it");
  check(/a quarter more than you were asked for|Refused to repay the loan for Ikwo Road/.test(said), who + ": a quarter more is taken, and it is on the record");
  check(!g.errors.length, who + ": no page errors (" + g.errors.join(" | ") + ")");
};

// ── The governor ──
{ const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
  const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  await run(g, "governor"); await g.browser.close(); }

// ── The President ──
{ const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
  const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
    opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
    week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
  const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { noStrikes: true } });
  await g.click(/Road to Aso Rock/); await g.wait(900); await g.click(/Take the oath of office/); await g.wait(1500); await g.click(/^✋ Take the oath$/); await g.wait(600);
  for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
  await g.click(/^Next: the address$/); await g.wait(500);
  await playUntil(g, (t) => /Visit a state|Mailbox|mailbox/.test(t), { max: 120 }); await g.wait(1500);
  await run(g, "President"); await g.browser.close(); }

srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
