/* A project that needs a ministry you do not have yet (owner, 22 Nov 2026: "ask me if I want to create a ministry
   and proceed; don't make me go back and restart the process"): create it from the project, and the same plan comes
   back with the new ministry in charge. Run: npm run build:game, then node tests/e2e/project-ministry.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 60 };
sv.ministries = (sv.ministries || []).filter(m => m.id !== "power");
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(2000);
const clear = async () => { for (let i = 0; i < 6 && await g.click(/^(Got it|Okay|Understood|Continue|On to the next.*|Not now)$/); i++) await g.wait(350); };
// As tests/e2e/projects.mjs: hear the adviser out, pick a Chief of Staff, then the Projects tab.
await g.wait(900); await clear(); await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde/.test(x.textContent)); b && b.click(); }); await g.wait(500); await clear();
await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "prj" }, "*")); await g.wait(700);
await g.click(/New project/); await g.wait(500);
await g.page.fill("textarea", "A solar power plant in Abeokuta South"); await g.click(/^Read it$/); await g.wait(600);
const t1 = await g.txt();
check(/who will run it\?/i.test(t1) && /Create the Ministry of/.test(t1), "the plan asks for the missing ministry");
const title = await g.page.evaluate(() => { const i = [...document.querySelectorAll("input")].find(x => x.value && x.value.length > 3); return i ? i.value : ""; });
await g.click(/^.{0,4}Create the Ministry of/); await g.wait(900);
check(/Create and swear in/.test(await g.txt()) || /Swear in|Appoint|candidates?/i.test(await g.txt()), "the ministry sheet opens");
// Pick the first candidate, then create.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Next|Choose|Pick/.test(x.textContent) && x.offsetParent); b && b.click(); }); await g.wait(300);
await g.click(/^Create and swear in/); await g.wait(1500);
for (let i = 0; i < 3; i++) { if (!(await g.click(/^(Okay|Got it)$/))) break; await g.wait(400); }
await g.wait(800);
const t2 = await g.txt();
const back = await g.page.evaluate((tt) => [...document.querySelectorAll("input")].some(x => x.value === tt), title);
check(back && !/who will run it\?/i.test(t2), "the same project plan comes back, with the new ministry: no restart (" + title + ")");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
