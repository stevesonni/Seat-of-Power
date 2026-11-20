/* Public complaints in the browser, and the bigger agenda. A governor whose
   workers are owed (the year-one fixture, arrears added): the street lists
   the complaint, a tap opens it, a visit answers it and is remembered. The
   Desk shows the big moves (8 on Medium, more for a strong team) with bills
   and orders outside the count.
   node tests/e2e/complaints.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const saved = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv0 = JSON.parse(YEAR1.sop_save); sv0.stc = { ...(sv0.stc || {}), arrears: 2 }; sv0.s = { ...(sv0.s || {}), cor: .62 };
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(sv0) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /tagged you/.test(t), { max: 120, prefer: [/^Later$/] });
check(r.ok, "the Desk's Tori row says people tagged the governor");
const openStreet = () => g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); b && b.scrollIntoView({ block: "center" }); b && b.click(); });
const answerBtn = (re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("[data-testid=tori] button")].find(x => new RegExp(src).test(x.textContent) && /never pay us/.test(x.parentElement.textContent)); b && b.click(); return !!b; }, re.source);
for (let i = 0; i < 3 && await g.click(/^(Continue|Okay|Got it)$/); i++) await g.wait(500);
await openStreet(); await g.wait(900);
const t = await g.page.evaluate(() => { const e = document.querySelector("[data-testid=tori]"); return e ? e.innerText : ""; });
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/street-chat.png" });
check(/tori/.test(t) && /Na 2 months now dem never pay us/.test(t) && /@OgunGov/.test(t), "a tap opens Tori: the unpaid workers' complaint is a tweet tagging @OgunGov");
check(await answerBtn(/↩ Reply/), "each complaint tweet has a Reply button"); await g.wait(700);
const card = await g.txt();
check(/A complaint/.test(card) && /What they want: pay the salaries owed/.test(card), "a tap opens the complaint: who, and what would fix it");
check(/Fix it: pay the salaries owed/.test(card), "the real fix is on the card");
const picked = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option, button.opt")].find(x => /Answer them on the radio/.test(x.textContent)); b && b.click(); return !!b; }); await g.wait(900);
check(picked, "answer it on the radio");
for (let i = 0; i < 4 && await g.click(/^(Continue|Okay|Got it|Close)$/); i++) await g.wait(400);
await g.wait(2600);
const sv = await saved(g);
check(sv.stc && sv.stc.complaints && sv.stc.complaints.arrears && sv.stc.complaints.arrears.how === "talk", "the answer is remembered");
await openStreet(); await g.wait(700);
check(await answerBtn(/✓ You replied/), "the tweet shows you replied"); await g.wait(700);
const again = await g.txt();
check(/already answered with words/.test(again) && !/Answer them on the radio/.test(again), "words only once: after that, only the fix");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option, button.opt")].find(x => /^Fix it/.test(x.textContent.trim())); b && b.click(); }); await g.wait(900);
check(/Treasury|treasury|In the bank|bank/.test(await g.txt()), "the fix opens the treasury");
// Tori's other tabs, and posting.
for (let i = 0; i < 3 && await g.click(/^(Continue|Okay|Got it|Close)$/); i++) await g.wait(400);
await g.click(/^Desk\d*$/); await g.wait(500); await g.click(/^Today$/); await g.wait(500);
await openStreet(); await g.wait(800);
const tabT = async (re) => { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[data-testid=tori] [role=tab]")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(400); return g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText); };
const tr = await tabT(/^Trending$/);
check(/Trending in Ogun/.test(tr) && /#PayOurSalariesOgun/.test(tr), "Trending: the salary hashtag trends while workers are owed");
const op = await tabT(/^Opposition$/);
check(/months of unpaid salaries/.test(op), "Opposition: the opposition candidate attacks on unpaid salaries");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-compose]").click()); await g.wait(400);
const ops = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-tori-opt]")].map(b => b.getAttribute("data-sop-tori-opt")));
check(ops.includes("salaries_claim"), "with salaries owed, the governor can only claim they are paid (" + ops.join(", ") + ")");
const app0 = await g.page.evaluate(() => window.SOP.s.app);
await g.page.evaluate(() => document.querySelector("[data-sop-tori-opt=salaries_claim]").click()); await g.wait(800);
const meT = await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText), app1 = await g.page.evaluate(() => window.SOP.s.app);
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/tori-me.png" });
check(/Salaries are being paid/.test(meT) && /Screenshot this tweet|Ratio|Which one be this/.test(meT) && app1 < app0, "a false claim is posted, ratioed in the replies, and costs approval (" + app0 + " → " + app1 + ")");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
