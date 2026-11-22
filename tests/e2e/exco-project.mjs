/* A building chosen at the cabinet meeting is a real project (owner, 22 Nov 2026: "the 40 classroom blocks IS a project;
   why doesn't it register and go through the normal project process"): "Build 40 new classroom blocks" opens the
   project plan (40 classrooms, run by the winning ministry) instead of spending at once.
   Run: npm run build:game, then node tests/e2e/exco-project.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40 }; sv.setup = { ...(sv.setup || {}), agenda: "education" };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /cannot agree how to deliver/i.test(t) && /Build 40 new classroom blocks/.test(t), { max: 500, prefer: [/^Later$/] });
check(r.ok, "the cabinet meeting offers 40 new classroom blocks");
const cash0 = await g.page.evaluate(() => (window.SOP && window.SOP.s && window.SOP.s.cash) ?? null);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Build 40 new classroom blocks/.test(x.textContent.trim())); b && b.click(); }); await g.wait(1500);
const t = await g.txt();
check(/project process|project plan/i.test(t), "the result says it goes through the project process");
for (let i = 0; i < 3; i++) { if (!(await g.click(/^(Okay|Got it|Continue)$/))) break; await g.wait(500); }
const plan = await g.page.evaluate(() => [...document.querySelectorAll("input")].map(i => i.value).join(" | "));
check(/40 new classroom blocks/.test(plan) || /40 new classroom blocks/.test(await g.txt()), "the project plan opens with the 40 classroom blocks (" + plan.slice(0, 120) + ")");
check(/classroom/i.test(await g.txt()), "sized in classrooms");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
