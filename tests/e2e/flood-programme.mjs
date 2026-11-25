/* Flood & Erosion Control in the game (owner, 25 Nov 2026): Ogun's version is the towns' drains; starting it asks how.
   Run: npm run build:game, then node tests/e2e/flood-programme.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
check(await g.page.evaluate(() => window.SOP.policyTest("flood_ctrl")), "the flood programme can be started"); await g.wait(1200);
const t = (await g.txt()).replace(/\s+/g, " ");
console.log("  " + (t.match(/.{0,80}How do you fix the drains\?.{0,300}/) || [""])[0]);
check(/How do you fix the drains\?/.test(t) && /Line the drains and build culverts/.test(t) && /Stop building on the waterways/.test(t), "in Ogun it asks how to fix the town drains");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
