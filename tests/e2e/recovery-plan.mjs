/* A recovery plan you can implement, and ministers on Tori (owner, 22 Nov 2026: "if they're asked to go and come back
   with a plan, they should actually bring up a plan which I can implement… that if implemented will be reflected";
   "ministers and commissioners should have their own Tori accounts where they tweet what they're doing").
   The Ogun fixture: the Works commissioner was asked for a plan. At the year's turn they bring costed steps, one of them
   restarting a stalled road; approving it pays for it, restarts the road, lifts the ministry, and books next year's
   results. On Tori the commissioners post about their own work. Run: npm run build:game, then node tests/e2e/recovery-plan.mjs */
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
// Wait for the cabinet to exist, then give Works a stalled road and an asked-for plan.
let nMin = 0; await playUntil(g, () => nMin > 2, { max: 150, prefer: [/^Later$/], onStep: async () => { nMin = await g.page.evaluate(() => (window.SOP.ministries || []).filter(m => m.minister).length); } });
const mid = await g.page.evaluate(() => { const m = window.SOP.ministries.find(x => x.minister && /works|infra/i.test(x.id + x.name)) || window.SOP.ministries.find(x => x.minister); return m.id; });
await g.page.evaluate((mid) => {
  const m = window.SOP.ministries.find(x => x.id === mid);
  window.SOP.setMinistries(ms => ms.map(x => x.id === mid ? { ...x, perf: 38, cor: 20 } : x));
  window.SOP.setProjects(ps => [...(ps || []), { id: "test_road", title: "Sagamu–Ikenne Road", type: "road", sector: "roads", ministryId: mid, qty: 10, unit: "km", lga: null, lgas: [], estimateM: 2000, approvedM: 1000, spentM: 1000, builtM: 900, progress: 45, status: "stalled", alloc: { 1: 1000 }, decisions: [], events: [], startYear: 1, years: 2, contractor: "Test Builders", contractorId: "c1", startTurn: 1, equipped: true, staffed: true }]);
  window.SOP.stcTest(p => ({ ...p, recPlans: [{ mid, minister: m.minister, asked: 0, due: 0 }] }));
}, mid); await g.wait(600);
const r = await playUntil(g, t => /is back with a plan/.test(t), { max: 500, prefer: [/^Later$/] });
check(r.ok, "at the year's turn the commissioner comes back with the plan");
const steps = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-plan-step]")].map(e => e.innerText.replace(/\n/g, " ")));
check(steps.length >= 4 && steps.every(t => /₦/.test(t)), "the plan is costed steps (" + steps.length + ": " + (steps[0] || "") + ")");
check(/Restart Sagamu–Ikenne Road/.test(steps[0] || ""), "its first step restarts the stalled road");
const t = await g.txt();
check(/Approve the whole plan/.test(t) && /Approve the first two steps/.test(t) && /Send it back/.test(t), "approve all, approve part, or send it back");
if (process.env.SHOT) await g.page.screenshot({ path: process.env.SHOT });
const perf0 = await g.page.evaluate((mid) => window.SOP.ministries.find(x => x.id === mid).perf, mid);
await g.page.evaluate(() => { window.__logs = []; window.addEventListener("sop-log", e => window.__logs.push(e.detail.tx)); });
await g.click(/^Approve the whole plan/); await g.wait(900);
const after = await g.page.evaluate((mid) => ({ perf: window.SOP.ministries.find(x => x.id === mid).perf, road: (window.SOP.projects || []).find(p => p.id === "test_road"), plans: window.SOP.stc.recPlans, logs: window.__logs }), mid);
check(after.road && after.road.status === "in_progress" && after.road.approvedM > 1000, "the stalled road restarts with its money (" + (after.road && after.road.status) + ", ₦" + (after.road && after.road.approvedM) + "M)");
check(after.perf > perf0, "the ministry's performance rises (" + perf0 + " → " + after.perf + ")");
check((after.plans || []).some(x => x.done === "all"), "the plan is recorded as approved");
check(after.logs.some(x => /Approved .*recovery plan/.test(x) && /restarted/.test(x)), "the record says what was approved (" + (after.logs.find(x => /recovery plan/.test(x)) || "") + ")");
const sv2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check((sv2.delayedFx || []).some(d => /recovery plan/.test(d.desc) && d.fx && d.fx.infra > 0), "next year's results are booked: infrastructure rises");
// Tori: the commissioners' own accounts.
for (let i = 0; i < 4 && await g.click(/^(Continue|Okay|Got it)( →)?$/); i++) await g.wait(400);
const feed = await g.page.evaluate(() => { try { return (window.SOP.toriFeedTest && window.SOP.toriFeedTest()) || null; } catch (e) { return String(e); } });
let posts = feed;
if (!posts) { let on = false; await playUntil(g, () => on, { max: 80, prefer: [/^Later$/], onStep: async () => { on = !!(await g.page.$("[data-sop-street]")); } }); await g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); b && b.click(); }); await g.wait(1200);
  posts = await g.page.evaluate(() => (document.querySelector("[data-testid=tori]") || {}).innerText || ""); }
console.log("  " + (Array.isArray(posts) ? posts.map(x => x.name + " " + x.handle + " (" + x.sub + "): " + x.text).join("\n  ") : String(posts).slice(0, 200)));
check(/@Hon[A-Za-z]+_/.test(typeof posts === "string" ? posts : JSON.stringify(posts)) && /Commissioner ·/.test(typeof posts === "string" ? posts : JSON.stringify(posts)) && /Sagamu–Ikenne Road|recovery plan/.test(JSON.stringify(posts)), "commissioners post on Tori from their own accounts");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
