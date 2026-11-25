/* The election-petition letter reads as a whole letter (owner, 25 Nov 2026: "What sort of cut and join letter is
   this? Why doesn't it make sense?"). It says who went to court, what they want, what they claim in plain words,
   what losing means, and asks the question. Run: npm run build:game, then node tests/e2e/petition-letter.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save);
sv.stc = { ...(sv.stc || {}), pet1: true, petition: { term: 1, stage: 0, margin: 3.9, opp: "Goni Kyari", oppParty: "OPP", start: 0, lostBelow: false } };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7 });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const find = () => g.page.evaluate(() => (window.SOP.lettersTest() || []).find(x => /petition/.test(x.key)));
let L = await find();
if (!L) { await playUntil(g, t => /Goni Kyari v\. You/.test(t), { max: 400 }); L = await find(); }
check(!!L, "the petition letter arrives");
const b = (L && L.body) || "";
console.log("  " + b);
check(/Goni Kyari \(OPP\), who lost the governorship election to you, has asked the Governorship Election Tribunal to cancel your win\./.test(b), "it says who went to court and what they want");
check(/They say the election was not run the way the Electoral Act requires\.|They say you bought votes|They say more votes were cast/.test(b), "the claim is in plain words");
check(/You won by 3\.9% of the vote/.test(b), "it gives the margin as a sentence");
check(/If we lose here, you stay in office while we appeal\./.test(b) && /How do you want us to defend the case\?/.test(b), "it says what losing means and asks the question");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
