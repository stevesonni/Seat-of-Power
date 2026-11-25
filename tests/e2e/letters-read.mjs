/* Every letter reads as a letter (owner, 25 Nov 2026: "This letter makes no sense. Remember what Perplexity's guide
   was this morning": whole sentences, each fact once, no fragments glued together). Plays two years and reads every
   letter that arrives: the Speaker race letter in full, and for all of them no doubled greeting, no sentence said
   twice, no sentence cut off. Run: npm run build:game, then node tests/e2e/letters-read.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 7 });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const seen = new Map();
const grab = async () => { for (const L of (await g.page.evaluate(() => window.SOP.lettersTest() || []))) if (!seen.has(L.key) && L.body) seen.set(L.key, L); };
await playUntil(g, () => false, { max: 260, onStep: grab });
console.log("  read " + seen.size + " letters");
const sp = [...seen.values()].find(L => L.key === "sc#leg_speaker");
if (sp) { console.log("  " + sp.body);
  check(/^The new House of Assembly elects its Speaker this week, and the Speaker decides which of your bills reach the floor\. Two members are standing: Hon\. .+, your party's candidate, and Hon\. .+, a swing member liked on both sides\. If your party's candidate wins, the House is yours\./.test(sp.body), "the Speaker letter says what is happening, who is standing and what is at stake");
  check(/Whom do you back\?$/.test(sp.body), "and asks the question"); }
else check(false, "the Speaker race letter arrived");
const bu = [...seen.values()].find(L => L.key === "budget");
if (bu) { console.log("  " + bu.body);
  check(/budget is drafted|drafted the \d{4} budget alone/.test(bu.body) && /We expect about ₦[\d.]+B this year: ₦[\d.]+B from .+ and ₦[\d.]+B from /.test(bu.body) && /send the bill to the House of Assembly\. Nothing new can be paid for until it passes\./.test(bu.body), "the budget letter gives the money, who decides and what the House does"); }
else console.log("  (no budget letter in this run)");
const ho = [...seen.values()].find(L => /hosappoint/.test(L.key));
if (ho) { console.log("  " + ho.body);
  check(/civil service has no head\. The Head of Service runs it: .+ Until you appoint one, those requests land on your own desk, .+ Will you choose one now\?$/.test(ho.body), "the top civil servant letter says what the office does and why now"); }
const bad = [];
for (const L of seen.values()) {
  const b = L.body, S = (b.match(/(?:\b(?:Hon|Rt|Dr|Mr|Mrs|Prof|St|No)\.|\d\.\d|[^.!?])+(?:[.!?]+["”’]?|$)/g) || []).map(x => x.trim().toLowerCase()).filter(Boolean);
  if (/Your Excellency,/.test(b)) bad.push(L.key + ": a second greeting");
  { const nm = String(L.from || "").split(/[,·]/)[0].replace(/^(Hon\.|Prof\.|Dr\.|Rt\. Hon\.|Gen\.|Vice-President|Deputy Governor|The)\s*/g, "").trim(), last = nm.split(" ").pop();
    if (last && last.length > 3 && /^[A-Z]/.test(last) && new RegExp("\\b" + last + "\\b").test(b)) bad.push(L.key + ": the sender (" + nm + ") is named in the third person: " + b.slice(0, 120)); }
  if (new Set(S).size !== S.length) bad.push(L.key + ": a sentence twice: " + b);
  if (!/[.!?…)"”’]$/.test(b.trim())) bad.push(L.key + ": ends mid-sentence: " + b);
}
bad.forEach(x => console.log("  " + x));
check(!bad.length, "every letter: one greeting, each sentence once, whole sentences (" + bad.length + " bad)");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
