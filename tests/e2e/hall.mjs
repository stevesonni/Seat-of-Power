/* The Hall of Governors at a career's end (Lagos Life calls stubbed): the
   player is asked whether to enter the result, sees the tier and the
   one-a-day rule, and either way sees today's board, with Play again. */
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { test: { win: true, reLose: true } });
await g.page.evaluate(() => {
  window.__hall = { entered: [], finished: 0 };
  window.SOP_hallFinish = () => { window.__hall.finished++; return Promise.resolve({ ok: true, pct: 60, players: 40 }); };
  window.SOP_hallEnter = (c) => { window.__hall.entered.push(c); return Promise.resolve({ ok: true, rank: 3, players: 12, tier: null }); };
  window.SOP_hallToday = () => Promise.resolve({ day: "2026-10-24", top: [{ rank: 1, name: "ada_gov", title: "Two terms", state: "Enugu", grade: "A", score: 1010, tier: "gold" }, { rank: 2, name: "bo", title: "Two terms", state: "Kano", grade: "B", score: 830, tier: "silver" }, { rank: 3, name: "you", title: "Voted out", state: "Ogun", grade: "C", score: 600, me: true }], you: { rank: 3, score: 600 }, players: 12, entered: true, pct: 60 });
  window.SOP_hallWeek = () => Promise.resolve({ week: 1, locked: false, top: [], players: 0, opensAt: Date.now() + 2 * 86400000 });
});
check(await campaign(g) === "won", "campaign won");
await takeOffice(g);
const r = await playUntil(g, t => /Enter this governorship on today's board/i.test(t), { max: 1300, prefer: [/^Go on without a loan/, /^🗳️ Run for Re-Election/] });
check(r.ok, "at the career's end, the Hall asks whether to enter the result");
const t = await g.txt();
check(/one result a day/i.test(t) && /Gold|Silver|Bronze|No medal yet/.test(t), "the sheet shows the tier and the one-a-day rule");
await g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/hall-ask.png" });
check(!!(await g.click(/Enter this result/)), "enter the result"); await g.wait(1200);
const t2 = await g.txt();
await g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/hall-board.png" });
check(/Entered: #3 of 12 today/.test(t2) && /ada_gov/.test(t2), "entered, then today's board with the leaders");
check(/60% of governors played again/.test(t2), "the played-again share is shown");
check(await g.page.evaluate(() => window.__hall.entered.length === 1 && window.__hall.finished === 1), "one entry sent, the finish counted once");
check(!!(await g.click(/^Last week$/)), "the weekly tab opens"); await g.wait(600);
check(/opens in 2 days/.test(await g.txt()), "this week's board says when it opens");
check(!!(await g.click(/^🔁 Play again$/)), "play again"); await g.wait(1200);
check(!/Enter this governorship/.test(await g.txt()), "play again starts a new game");
check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
await g.browser.close(); srv.close(); process.exit(fails ? 1 : 0);
