/* The councils at the table, and the governor's exports. From the year-one
   fixture: the Executive Council and the Traditional Rulers Council each sit
   around a table when first formed (members speak in turn, the seal at the
   centre); then the State Economic Council chooses how to sell the state's
   crop, and the next year's end pays for it.
   node tests/e2e/councils.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const saved = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: YEAR1, seed: 11, test: { noStrikes: true } });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/councils-" + n + ".png" });
await g.click(/^Continue/); await g.wait(1800);
const seen = new Set();
const r = await playUntil(g, t => { if (/You, presiding/.test(t)) { if (/State Executive Council/.test(t)) seen.add("exco"); if (/Traditional Rulers Council/.test(t)) seen.add("rulers"); if (/“/.test(t)) seen.add("speaks"); }
  return seen.has("exco") && seen.has("rulers") && !/You, presiding/.test(t); }, { max: 160, prefer: [/^Later$/], onStep: async () => { if (await g.page.evaluate(() => /You, presiding/.test(document.body.innerText))) await shot("table-" + seen.size); } });
check(seen.has("exco"), "the Executive Council sits around a table when first formed");
check(seen.has("rulers"), "so does the Traditional Rulers Council");
check(seen.has("speaks"), "each member speaks in turn");
// The State Economic Council: first sitting, how to sell the state's crop.
const before = (await saved(g)).s || {};
await g.page.evaluate(() => window.SOP.councils.econ()); await g.wait(700);
{ const t = await g.txt(); check(/The State Economic Council/.test(t) && /You, presiding/.test(t) && /Farmers/.test(t) && /Exporters/.test(t) && /Customs/.test(t), "the State Economic Council sits: farmers, exporters, Customs"); }
let abuja = false;
for (let i = 0; i < 8; i++) { if (/Abuja's policy is (protect|open|targeted)/.test(await g.txt())) abuja = true; if (!(await g.click(/^(Next: .*|To the decision) ›$/))) break; await g.wait(200); }
check(abuja, "Customs says what Abuja's trade policy does to the state");
await shot("econ");
const opts = await g.page.evaluate(() => [...document.querySelectorAll("button.ds-option")].map(b => b.textContent.trim()));
check(opts.length === 3 && opts.some(o => /processing zone/.test(o)) && opts.some(o => /container depot/.test(o)), "three ways to sell: raw, a depot and road, a processing zone (" + opts.length + ")");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option")].find(x => /^Aggregate and ship raw/.test(x.textContent.trim())); b && b.click(); }); await g.wait(1200);
for (let i = 0; i < 3 && await g.click(/^(Got it|Okay|Continue)$/); i++) await g.wait(400);
await g.wait(2500);
let sv = await saved(g);
check(sv.stc && sv.stc.exports && sv.stc.exports.plan === "raw", "the export plan is set (" + JSON.stringify(sv.stc && sv.stc.exports && { plan: sv.stc.exports.plan, crop: sv.stc.exports.crop }) + ")");
const y0 = sv.turn;
const r3 = await playUntil(g, t => { const m = t.match(/Year (\d) of 4/); return m && +m[1] > y0; }, { max: 400, prefer: [/^Later$/] });
check(r3.ok, "on to the next year");
await g.wait(2500); sv = await saved(g);
const E = (sv.stc || {}).exports || {};
check((E.earned || 0) > 0 && (E.hist || []).length >= 1, "the exports earned the state money at the year's end (₦" + E.earned + "B)");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
