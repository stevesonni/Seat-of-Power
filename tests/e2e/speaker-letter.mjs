/* "The House will not fund it" → "Open the Speaker's letter" opens his letter (owner, 23 Nov 2026: "I clicked open
   the Speaker's letter and nothing happened"). Run: npm run build:game, then node tests/e2e/speaker-letter.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
await g.page.evaluate(() => window.SOP.stcTest(p => { const L = p.leg || { members: [{ id: "m1", name: "Hon. Uzo Agbo", bloc: "swing", interest: "money", rel: 40 }], promises: [], asked: [] }; const w = (L.members.find(m => m.bloc !== "ours") || L.members[0]);
  return { ...p, house: { seats: 24, loyal: 10 }, leg: { ...L, speaker: { winner: w.id, kind: "fixer", crossed: true, hostile: true, at: 0, done: [], asks: [{ id: "roads", l: "Township roads in the Speaker's constituency", costB: .6, fx: { app: 1 } }] } } }; })); await g.wait(500);
const r = await playUntil(g, t => /wants his programmes first/.test(t), { max: 400, prefer: [/^Later$/] });
check(r.ok, "the Speaker's price arrives");
// Leave it unanswered: close the letter and the mailbox, then try to start a programme.
for (let i = 0; i < 4; i++) { await g.page.keyboard.press("Escape"); await g.page.evaluate(() => history.back()); await g.wait(500); }
await g.page.evaluate(() => document.querySelectorAll("[data-ach]").forEach(x => x.remove()));
const started = await g.page.evaluate(() => window.SOP.policyTest()); await g.wait(800);
check(started, "a programme card was tapped");
check(/The House will not fund it/.test(await g.txt()), "the House blocks it");
await g.click(/^Open the Speaker's letter$/); await g.wait(1200);
const t = await g.txt();
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/speaker-letter.png" });
check(/wants his programmes first|build it: township roads/i.test(t) && !/The House will not fund it/.test(t), "the button opens the Speaker's letter");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
