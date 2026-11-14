/* Pillar "look": the richer look. The same game, only the paint changes.
   The decision card (costs on the right, effects as pictures), gauges for the meters, a wax seal on results,
   picture tiles for the Governor's powers. The words and the buttons are the same as with the look off. */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const SHOT = process.env.SHOTS || null;
async function run(look) {
  const g = await open(srv.port, { save: Y1, exp: { reach: 1, look: look ? 1 : 0 } });
  await g.click(/^Continue/); await g.wait(2500);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
  for (let i = 0; i < 10; i++) { if (!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Continue|Okay|Got it|Noted|Thanks)$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }))) break; await g.wait(700); }
  await g.click(/^Today$/); await g.wait(1200);
  const desk = await g.page.evaluate(() => ({ gauges: document.querySelectorAll("[data-sop-gauge]").length, tiles: document.querySelectorAll("[data-sop-powers] button").length, txt: document.body.innerText }));
  if (SHOT) await g.page.screenshot({ path: SHOT + (look ? "/look-on" : "/look-off") + "-desk.png" });
  let card = null;
  await playUntil(g, () => !!card, { max: 260, onStep: async () => {
    if (card) return;
    card = await g.page.evaluate(() => { const d = document.querySelector(".lv-dec[role=dialog]"); if (!d || !d.querySelector(".opt")) return null;
      return { look: d.classList.contains("look"), title: (d.querySelector(".h-title") || {}).textContent, opts: [...d.querySelectorAll(".opt")].map(o => o.innerText.replace(/\s+/g, " ").trim()), labels: [...d.querySelectorAll(".opt .lab")].map(l => (l.querySelector("span") || l).textContent.trim()), cost: d.querySelectorAll(".look-cost").length, chips: d.querySelectorAll(".look-chip").length }; });
    if (card && SHOT) await g.page.screenshot({ path: SHOT + (look ? "/look-on" : "/look-off") + "-decision.png" });
  } });
  await g.page.evaluate(() => window.SOP_outcome({ icon: "💰", title: "Programme started", text: "The clinics open next month.", tone: "good", rows: [{ l: "Approval", v: "+3", good: true }, { l: "In the bank", v: "−₦1.2B", good: false }] }));
  await g.wait(1200);
  const res = await g.page.evaluate(() => ({ seal: !!document.querySelector(".result.look .look-seal"), title: (document.querySelector(".result .h-title") || {}).textContent }));
  if (SHOT) await g.page.screenshot({ path: SHOT + (look ? "/look-on" : "/look-off") + "-result.png" });
  const errors = g.errors.slice(); await g.browser.close();
  return { desk, card, res, errors };
}
const on = await run(true), off = await run(false);
check(on.desk.gauges >= 3, "the meters are gauges with the look on (" + on.desk.gauges + ")");
check(off.desk.gauges === 0, "no gauges with the look off");
check(on.desk.tiles >= 4 && off.desk.tiles >= 4 && /Hire or fire commissioners/.test(off.desk.txt), "the Governor's powers are tiles with the look on, same buttons (" + on.desk.tiles + " and " + off.desk.tiles + ")");
check(!!on.card && on.card.look, "a decision card is drawn in the richer look (" + (on.card && on.card.title) + ")");
check(!!off.card && !off.card.look, "the same card is plain with the look off");
if (on.card && off.card && on.card.title === off.card.title) check(JSON.stringify(on.card.labels) === JSON.stringify(off.card.labels), "same choices, same words, same order: " + on.card.labels.join(" / "));
check(on.res.seal && on.res.title === "Programme started", "the result card has a wax seal and the same title");
check(!off.res.seal && off.res.title === "Programme started", "no seal with the look off");
check(!on.errors.length && !off.errors.length, "no page errors (" + [...on.errors, ...off.errors].join(" | ") + ")");
console.log(fails ? fails + " failed" : "all passed");
srv.close && srv.close(); process.exit(fails ? 1 : 0);
