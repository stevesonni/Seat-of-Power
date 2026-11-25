/* Commissioners on Tori show their own faces (owner, 25 Nov 2026: "Where are their photos?"). The new faces live in
   art/people/, and Tori looked for them in art/characters/, so every commissioner showed a blank silhouette.
   Every picture in the feed must load. Run: npm run build:game, then node tests/e2e/tori-faces.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 4, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1000);
// Play into year two, so the commissioners have something to post about.
await playUntil(g, t => /Turn 2|Year 2|2028/.test(t) && /Tori/.test(t), { max: 200 });
let rowOn = false;
await playUntil(g, () => rowOn, { max: 80, onStep: async () => { rowOn = await g.page.evaluate(() => !!document.querySelector("[data-sop-street]")); } });
for (let i = 0; i < 3 && await g.click(/^(Continue|Okay|Got it|Later)$/); i++) await g.wait(400);
await g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); b.scrollIntoView(); b.click(); }); await g.wait(1500);
// Scroll the feed so every picture loads.
for (let i = 0; i < 12; i++) { await g.page.mouse.wheel(0, 900); await g.wait(250); }
await g.wait(1200);
const imgs = await g.page.evaluate(() => [...document.querySelectorAll("img")].filter(i => /\/art\//.test(i.src)).map(i => ({ src: i.src.replace(/^.*\/art\//, ""), ok: i.complete && i.naturalWidth > 0 })));
const people = imgs.filter(i => /^people\/official-/.test(i.src)), broken = imgs.filter(i => !i.ok);
console.log("  " + imgs.length + " pictures, " + people.length + " commissioner faces from art/people");
broken.forEach(b => console.log("  broken: " + b.src));
check(people.length > 0, "commissioners on Tori use their own faces");
check(!broken.length, "every picture in the feed loads");
check(!(await g.txt()).match(/: 0% done/), "no commissioner boasts of 0% done");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
