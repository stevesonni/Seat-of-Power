/* XP, levels, the daily goal, quests, Ballots and the league (game/systems/xp.js). Run: npm run build:game, then
   node tests/e2e/xp.mjs */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const g = await open(srv.port, { save: { sop_profile: profile, sop_xp: JSON.stringify({ total: 70, ballots: 180, goal: 50 }) }, seed: 3 });
await g.wait(1200);
check(!!(await g.page.$("[data-sop-xp-chip]")), "the title screen shows your level and Ballots");
await g.page.evaluate(() => document.querySelector("[data-sop-xp-chip]").click()); await g.wait(500);
const t = await g.txt();
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/xp-sheet.png" });
check(/Level 1 · Ward Volunteer/.test(t) && /Daily goal: 0 \/ 50 XP/.test(t), "the sheet shows the level, its title and the daily goal");
check(await g.page.evaluate(() => document.querySelectorAll("[data-sop-xp-quest]").length) === 3, "three quests for today");
await g.page.evaluate(() => document.querySelector("[data-sop-xp-goal='30']").click()); await g.wait(300);
check(/Daily goal: 0 \/ 30 XP/.test(await g.txt()), "you can choose a smaller daily goal");
await g.page.evaluate(() => document.querySelector("[data-sop-xp-buy=boost]").click()); await g.wait(300);
check(/Double XP for 1[45] more minutes/.test(await g.txt()) && /🗳️ 80/.test(await g.txt()), "Ballots buy a Double XP boost");
await g.page.keyboard.press("Escape"); await g.wait(300);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /✕|Close/.test(x.textContent + (x.getAttribute("aria-label") || ""))); b && b.click(); }); await g.wait(300);
// Today's decision earns XP (doubled by the boost): the pop-up, the goal and a level.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Today's decision/.test(x.textContent)); b && b.click(); }); await g.wait(700);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button")].find(x => x.offsetParent && !x.disabled && x.getAttribute("aria-label") !== "Close" && x.textContent.trim().length > 8); b && b.click(); }); await g.wait(400);
const pop = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-xp-pop]")].map(e => e.textContent).join(" "));
check(pop === "", "no XP pop-ups on screen (the owner removed them)");
const X = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_xp")));
check(X.total === 110 && X.day.xp === 40 && (X.goalDays || []).length === 1, "the store counts it: total, today, and the goal met");
check(X.ballots >= 80 + 20, "reaching level 2 pays Ballots (" + X.ballots + ")");
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.join(" | ") : ""));
// Ballots buy the green frame, which goes straight onto the portrait.
await g.page.evaluate(() => { const X = JSON.parse(localStorage.getItem("sop_xp")); X.ballots = 400; localStorage.setItem("sop_xp", JSON.stringify(X)); window.dispatchEvent(new Event("sop-xp")); });
await g.page.evaluate(() => document.querySelector("[data-sop-xp-chip]") && document.querySelector("[data-sop-xp-chip]").click()); await g.wait(400);
await g.page.evaluate(() => document.querySelector("[data-sop-xp-buy=frame_green]").click()); await g.wait(500);
check(/Ballot Green frame/.test(await g.txt()) && await g.page.evaluate(() => window.SOP_FRAME === "ballot"), "Ballots buy the Ballot Green frame and it is worn at once");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
