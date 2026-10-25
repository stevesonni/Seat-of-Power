/* Consequence chains for a governor: the harvest letter, the investor, armed
   men on a state road site, and the court on the business order. Same beats
   as chains.mjs, from a Year 1 governorship save. node tests/e2e/chains-gov.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { save: YEAR1, seed: 5, test: { chains: true } });
await g.click(/^Continue/); await g.wait(1800);
const seen = new Set();
await playUntil(g, t0 => { const t = t0.replace(/⁠/g, "");
  if (/bumper harvest of tomatoes in Plateau/.test(t)) seen.add("harvest");
  if (/Lusitana Agro-Industrial wants to build in Plateau/.test(t)) seen.add("investor");
  if (/Armed militants have stopped work/.test(t)) seen.add("crisis");
  if (/struck down your Ease of Doing Business order/.test(t)) seen.add("court");
  if (/Appeal granted|Appeal dismissed|The investors are leaving/.test(t)) seen.add("appeal");
  return seen.size >= 5; }, { max: 200, prefer: [/Lusitana|Armed militants|struck down your Ease|bumper harvest/, /^Tell the communities first/, /^Welcome them/, /^Clear them out/, /^Appeal to the higher court/, /^Noted$/] });
console.log("  chain beats seen: " + [...seen].join(", "));
for (const [k, w] of [["harvest", "the Commissioner's harvest letter"], ["investor", "the investor card"], ["crisis", "armed men stop the site"], ["court", "the court strikes down the order"], ["appeal", "the appeal is decided"]]) check(seen.has(k), w);
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
