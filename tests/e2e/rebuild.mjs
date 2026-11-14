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
// 2. The short start: the godfather's deal is the first decision.
check(/will pay for your campaign/.test(await g.txt()), "the first decision is the godfather's deal");
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
// Round 2: the first Chief of Staff is three cards, a line each, under 80 words.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^Continue$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(500);
const cos = await g.page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Pick your Chief of Staff"]'); if (!d) return null; const box = d.closest(".sop-sheet") || d; return { cards: d.querySelectorAll("button").length, words: (box.innerText.match(/[A-Za-z₦\d'’-]+/g) || []).length }; });
check(cos && cos.cards === 3 && cos.words < 80, "the Chief of Staff: three cards, under 80 words (" + JSON.stringify(cos) + ")");
await g.page.evaluate(() => { const b = document.querySelector('[role=dialog][aria-label="Pick your Chief of Staff"] button'); b && b.click(); }); await g.wait(800);
for (let j = 0; j < 6; j++) { if (!(await g.click(/^(Okay|Got it|Continue|Close|Keep playing)$/))) break; await g.wait(300); }
check(!/Choose your Special Adviser|A unity ticket|STATE HOUSE REPORT/i.test(await g.txt()), "no adviser, running-mate or TV-report screens");
// 3. Four meters and one card.
const strip = await g.txt();
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
  if (/to split for the next six months/.test(t) && !past1 && cards3 < 2) { /* the first budget, year one's */ budgetSeen = true; if (/Fine-tune/.test(t)) fine = true; cards3 = Math.max(cards3, ["Balanced", "Populist", "Reformer", "Godfather's budget"].filter(x => t.includes(x)).length); }
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
check(/Your term in six cards/i.test(await g.txt()) && /Wikipedia Bio/.test(await g.txt()), "Read the full story opens the cards and the bio");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close();
// The control group: none of it.
const o = await open(srv.port, { exp: "none" }); await o.click(/^New game$/); await o.wait(900); await createPolitician(o); await o.wait(900);
check(!/will pay for your campaign/.test(await o.txt()), "pillars off: the usual setup");
check(!o.errors.length, "no page errors (" + o.errors.join(" | ") + ")"); await o.browser.close();
srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
