/* The rebuild in a browser (the owner's plan after the audit, November 2026): where players
   leave, the short start, four meters and one card, a gentler first year, plain words, and
   headlines and calls. Each is a pillar of the experiment; this turns all five on.
   Run: npm run build:game, then node tests/e2e/rebuild.mjs */
import fs from "node:fs";
import { open, createPolitician, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const NEW = { start: 1, screen: 1, stagger: 1, words: 1, drama: 1 };
const g = await open(srv.port, { exp: NEW, test: { win: true } });
await g.page.evaluate(() => { window.__tracked = []; const t = window.SOP_track; window.SOP_track = (e, v) => { window.__tracked.push([e, v]); try { t && t(e, v); } catch (x) {} }; });
const seen = []; const words = () => g.page.evaluate(() => (document.body.innerText.match(/[A-Za-z₦\d'’-]+/g) || []).length);
let total = await words(); const t0 = Date.now();
await g.click(/^New game$/); await g.wait(900); await createPolitician(g); await g.wait(900);
// 2. The short start: your own choices first (owner, 22 Nov 2026): the state, the agenda, the running mate.
check(/Which state will you run in\?/.test(await g.txt()) && /\(your home state\)/.test(await g.txt()), "you choose the state (your home state first)");
check(!!(await g.page.$("[data-sop-short-map] svg path")), "the state step shows the map of Nigeria (owner, 22 Nov 2026)");
if (process.env.SHOT) await g.page.screenshot({ path: process.env.SHOT });
const home0 = await g.page.evaluate(() => document.querySelector("[data-sop-short-state]").value);
const other = home0 === "Kano" ? "Lagos" : "Kano";
await g.page.evaluate((k) => { const p = [...document.querySelectorAll("[data-sop-short-map] path")].find(x => (x.querySelector("title") || {}).textContent === k); p && p.dispatchEvent(new MouseEvent("click", { bubbles: true })); }, other); await g.wait(400);
check(await g.page.evaluate(() => document.querySelector("[data-sop-short-state]").value) === other && /Run in /.test(await g.txt()), "tapping a state on the map picks it (" + other + ")");
await g.page.evaluate((k) => { const p = [...document.querySelectorAll("[data-sop-short-map] path")].find(x => (x.querySelector("title") || {}).textContent === k.replace(/_/g, " ")); p && p.dispatchEvent(new MouseEvent("click", { bubbles: true })); }, home0); await g.wait(300);
await g.click(/^Run in /); await g.wait(500);
check(/Your agenda/.test(await g.txt()) && !!(await g.page.$("[data-sop-short-agenda=health]")), "you choose the agenda");
await g.page.evaluate(() => document.querySelector("[data-sop-short-agenda=health]").click()); await g.wait(500);
check(/Your running mate/.test(await g.txt()) && (await g.page.$$("[data-sop-short-deputy]")).length === 4, "you choose the running mate from four");
await g.page.evaluate(() => document.querySelector("[data-sop-short-deputy=technocrat]").click()); await g.wait(500);
check(/will pay for your campaign/.test(await g.txt()), "then the godfather's deal");
check(Date.now() - t0 < 60000, "a real decision within a minute of New game");
total += await words();
for (const re of [/^Take half/, /^On to the campaign/, /^The capital's biggest market$/, /^Election night/]) { check(!!(await g.click(re)), "short start: " + re.source); await g.wait(600); total += await words(); }
await g.wait(6500); const night = await g.txt();
check(/You win by/.test(night) && /✓ yours/.test(night), "election night counts district by district, then declares");
total += await words(); await g.click(/^Take the oath/); await g.wait(600); total += await words();
check(/Begin your tenure/.test(await g.txt()), "the oath");
console.log("  words from New game to the oath: " + total);
check(total < 500, "far fewer words before the oath than the 1,304 of the long path (" + total + ")");
await g.click(/^Begin your tenure/); await g.wait(3000);
{ const su = await g.page.evaluate(() => { try { return JSON.parse(localStorage.getItem("sop_save") || "{}").setup || {}; } catch (e) { return {}; } });
  check(su.agenda === "health" && su.depGov && su.depGov.kind === "technocrat", "the game keeps the agenda and running mate you chose (" + su.agenda + ", " + (su.depGov && su.depGov.kind) + ")"); }
// Round 2: the first Chief of Staff is three cards, a line each, under 80 words.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^Continue$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(500);
const cos = await g.page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Pick your Chief of Staff"]'); if (!d) return null; const box = d.closest(".sop-sheet") || d; return { cards: d.querySelectorAll("button").length, words: (box.innerText.match(/[A-Za-z₦\d'’-]+/g) || []).length }; });
check(cos && cos.cards === 3 && cos.words < 80, "the Chief of Staff: three cards, under 80 words (" + JSON.stringify(cos) + ")");
await g.page.evaluate(() => { const b = document.querySelector('[role=dialog][aria-label="Pick your Chief of Staff"] button'); b && b.click(); }); await g.wait(800);
for (let j = 0; j < 6; j++) { if (!(await g.click(/^(Okay|Got it|Continue|Close|Keep playing)$/))) break; await g.wait(300); }
check(!/Choose your Special Adviser|A unity ticket|STATE HOUSE REPORT/i.test(await g.txt()), "no adviser, running-mate or TV-report screens");
// 3. Four meters and one card.
const strip = await g.txt();
if (!(/People/.test(strip) && /Treasury/.test(strip) && /Godfather/.test(strip) && !/Corruption/.test(strip))) console.log("  strip:", strip.replace(/\n/g, " · ").slice(0, 900));
check(/People/.test(strip) && /Treasury/.test(strip) && /Godfather/.test(strip) && !/Corruption/.test(strip), "the four meters: People, Party, Treasury, Godfather");
check(/Behind you|Warm|Restless|Angry/.test(strip) && /Healthy|Steady|Tight|Empty/.test(strip), "the meters read as words");
check(!/NaN/.test(strip), "no NaN");
check(!/Big moves|🚀 FLAGSHIP|Approval below/.test(strip), "the first view: no Big moves line, no Flagship, no approval warning");
// 4. A gentler first year: the cabinet and the palaces are formed for you; a three-choice budget.
await g.wait(1500);
const d0 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check((d0.ministries || []).length > 0 && !!d0.council, "the interim cabinet and the palaces are in place (" + (d0.ministries || []).length + " ministries)");
let past1 = false, budgetSeen = false, fine = false, cards3 = 0, lawWord = false, hosWord = false, exco = false, badHead = false, heads = [], call = false, more = false;
const r = await playUntil(g, (t) => {
  if (/Year [2-4] of 4/.test(t)) past1 = true;
  if (/to share out this year/.test(t) && !past1 && cards3 < 2) { /* the first budget, year one's */ budgetSeen = true; if (/Fine-tune/.test(t)) fine = true; cards3 = Math.max(cards3, ["Balanced", "Populist", "Reformer", "Godfather's budget"].filter(x => t.includes(x)).length); }
  if (/BUDGET LAW|budget law/.test(t)) lawWord = true; if (/Head of Service|APPROPRIATION/.test(t)) hosWord = true;
  if (/State Executive Council/.test(t)) exco = true; if (/GOVERNOR: “|GOVERNOR SAYS NO/.test(t)) badHead = true; { const m = t.match(/Daily Tribune\s+\S[^\n]*\n+([^\n]+)/); if (m && !heads.includes(m[1])) heads.push(m[1]); } if (/on the phone, /i.test(t)) call = true; if (/More: what the state needs/.test(t)) more = true;
  return /Year 3 of 4/.test(t); }, { max: 700 });
check(r.ok, "played on to year 3"); if (!r.ok) console.log("  last: " + r.clicks.slice(-12).join(" | "));
check(budgetSeen && !fine && cards3 === 3, "year one's budget: three choices, nothing to fine-tune (" + cards3 + ")");
check(!exco, "no council session in year one");
check(more, "the rest of Today is behind More");
// 5. Plain words.
check(lawWord, "\"budget law\" on screen"); check(!hosWord, "no \"Head of Service\" or \"APPROPRIATION\" on screen");
// 6. Headlines and calls.
check(!badHead, "no front page quotes the button (“GOVERNOR: …”, “SAYS NO”)"); console.log("  front pages seen: " + heads.join(" | "));
check(heads.every(h => !/undefined|null|NaN|[\u{1F000}-\u{1FFFF}]/u.test(h)), "every front page is clean text"); check(call || (await g.page.evaluate(() => window.__tracked.some(([e]) => e === "gf_call"))), "the godfather calls");
// 1. Where players leave: the screen is reported.
const tr = await g.page.evaluate(() => window.__tracked.filter(([e]) => e === "at").map(([, v]) => v));
check(tr.length >= 3 && tr.some(v => /^gov · /.test(v)), "the screen a player is on is reported (" + tr.slice(0, 4).join(" / ") + ")");
// The five-line story at the end.
await g.page.evaluate(() => window.SOP.setGEnd("complete")); await g.wait(3500);
for (let i = 0; i < 8; i++) { await g.page.evaluate(() => { const b = document.querySelector("[data-ach] .ach-x"); b && b.click(); }); await g.wait(300); }
const end = await g.txt(), endWords = (end.match(/[A-Za-z₦\d'’-]+/g) || []).length;
check(/My story in five lines/i.test(end) && /Remembered as /.test(end) && /Grade [A-F]\./.test(end), "the life story in five lines");
check(!/Your term in six cards|REPORT CARD|Wikipedia Bio/.test(end), "the six cards and the bio wait behind Read the full story");
check(endWords < 200, "the ending screen is under 200 words (" + endWords + ")");
check(/Run for president with /.test(end) && await g.page.evaluate(() => !!document.querySelector("[data-testid=run-president]")), "the ending points to running for president with the same politician");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Read the full story/.test(x.textContent)); b && b.click(); }); await g.wait(800);
check(/Your term in six cards/i.test(await g.txt()) && /Your biography/.test(await g.txt()), "Read the full story opens the cards and the bio");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close();
// The control group: none of it.
const o = await open(srv.port, { exp: "none" }); await o.click(/^New game$/); await o.wait(900); await createPolitician(o); await o.wait(900);
check(!/will pay for your campaign/.test(await o.txt()), "pillars off: the usual setup");
check(!o.errors.length, "no page errors (" + o.errors.join(" | ") + ")"); await o.browser.close();
srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
