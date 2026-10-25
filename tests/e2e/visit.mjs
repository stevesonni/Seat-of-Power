/* The governor visits the President at Aso Rock: the card on the Desk, one
   request, the flight, the Villa, the answer, the flight home, the front
   page; once a year. Run after npm run build:game: node tests/e2e/visit.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { save: YEAR1 });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/visit-" + n + ".png" });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /Visit the President at Aso Rock/.test(t), { max: 60 });
check(r.ok, "the Desk offers a visit to the President");
await g.click(/✈️ Plan it/); await g.wait(600);
check(/To Aso Rock/.test(await g.txt()) && /Troops for the state/.test(await g.txt()), "four requests, with the odds");
await shot("pick");
await g.page.evaluate(() => [...document.querySelectorAll("button.ds-option")].find(b => /federal road/.test(b.textContent)).click()); await g.wait(9000); // the flight out
for (let i = 0; i < 12 && !/welcome to the Villa/.test(await g.txt()); i++) { if (!(await g.click(/^(Continue|Got it|Okay|Noted)$/))) await g.page.evaluate(() => { const f = document.querySelector(".sop-flight"); f && f.click(); }); await g.wait(1200); }
check(/welcome to the Villa/.test(await g.txt()), "the President receives you at the Villa");
await shot("villa");
check(!!(await g.click(/^Ask for a federal road/)), "ask"); await g.wait(1000);
check(/(the road goes into next year's federal budget|The federal budget is tight)/.test(await g.txt()), "the President answers");
await shot("answer");
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
await g.wait(2500);
const sv2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check((sv2.stc || sv.stc || {}).visitYear === 1, "once a year: the visit is recorded");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
