/* The House of Assembly votes, seat by seat (owner, 26 Nov 2026): all grey, the vote is called, seats light up green
   (yes) and red (no) in real time, abstainers stay grey; a House against you shows red in the majority; a tap skips;
   then the verdict and the count. Also: a real bill sent to the House plays it.
   Run: npm run build:game, then node tests/e2e/chamber.mjs (SH=<folder> saves screenshots) */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true, chamber: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const colours = () => g.page.evaluate(() => { const c = [...document.querySelectorAll("[data-sop-chamber] circle")].map(x => x.getAttribute("fill")); return { n: c.length, grey: c.filter(x => x === "#c9c3b4").length, green: c.filter(x => x === "#1f8a4c").length, red: c.filter(x => x === "#c62828").length }; });

// A House against you.
await g.page.evaluate(() => window.SOP.chamberTest({ title: "The Grazing Reserves Bill", seats: 24, favour: .3, passed: false, seed: "e2e1" }));
await g.wait(200);
const c0 = await colours(); check(c0.n === 24 && c0.grey === 24, "24 seats, all grey before the vote (" + JSON.stringify(c0) + ")");
await g.wait(1900); const c1 = await colours();
check(c1.green + c1.red > 0 && c1.grey > 0, "half way, some seats have voted and some have not (" + JSON.stringify(c1) + ")");
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + "/chamber-mid.png" });
await g.wait(2600); const c2 = await colours(), t2 = (await g.txt()).replace(/\s+/g, " ");
check(c2.red > c2.green && c2.grey <= 2, "the House is against you: red is the majority (" + JSON.stringify(c2) + ")");
check(/Rejected/.test(t2) && new RegExp(c2.green + " for, " + c2.red + " against").test(t2), "the verdict and the count: " + (t2.match(/Rejected[^.]*\./) || [""])[0] + " " + (t2.match(/\d+ for, \d+ against[^.]*\./) || [""])[0]);
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + "/chamber-against.png" });
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-chamber] button")].find(x => /Continue/.test(x.textContent)); b && b.click(); }); await g.wait(400);
check(!(await g.page.$("[data-sop-chamber]")), "Continue closes it");

// With you; a tap skips to the end.
await g.page.evaluate(() => window.SOP.chamberTest({ title: "The Appropriation Bill", seats: 24, favour: .7, passed: true, seed: "e2e2" }));
await g.wait(1000); await g.page.evaluate(() => document.querySelector("[data-sop-chamber]").click()); await g.wait(300);
const c3 = await colours(), t3 = (await g.txt()).replace(/\s+/g, " ");
check(c3.green > c3.red && /Passed/.test(t3), "with you: green is the majority, and a tap skips to the verdict (" + JSON.stringify(c3) + ")");
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + "/chamber-with.png" });
await g.page.evaluate(() => document.querySelector("[data-sop-chamber]").click()); await g.wait(300);
check(!(await g.page.$("[data-sop-chamber]")), "a second tap closes it");

// Impeachment needs two-thirds.
await g.page.evaluate(() => window.SOP.chamberTest({ title: "Impeachment of the Governor", seats: 24, need: "two_thirds", favour: .5, passed: false, seed: "e2e3", noWord: "The motion fails: you survive" }));
await g.wait(200); await g.page.evaluate(() => document.querySelector("[data-sop-chamber]").click()); await g.wait(300);
const t4 = (await g.txt()).replace(/\s+/g, " ");
check(/The motion fails: you survive/.test(t4) && /Two-thirds of the 24 members needed: 16\./.test(t4), "impeachment: two-thirds needed, and it says so");
await g.page.evaluate(() => document.querySelector("[data-sop-chamber]").click()); await g.wait(300);

check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close();

// In play: the year's budget goes to the House, and its vote is counted seat by seat.
{ const p = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
  await p.click(/^Continue/); await p.wait(1800);
  await p.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await p.wait(800);
  let V = null; await playUntil(p, () => !!V, { max: 120, onStep: async () => { try { V = await p.page.evaluate(() => (window.SOP_votes || []).find(v => /Appropriation/.test(v.title)) || null); } catch (e) {} } });
  console.log("  " + JSON.stringify(V));
  const seats = await p.page.evaluate(() => (window.SOP.stc.house || {}).seats);
  check(V && V.yes + V.no + V.abst === seats && (V.yes > V.no) === V.passed, "in play, the budget's vote is counted over the House's " + seats + " seats and agrees with the result");
  await p.browser.close(); } srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
