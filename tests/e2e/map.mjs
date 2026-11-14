/* Pillar "map": the State tab opens on a real map of the player's state. Projects are pinned where they were
   built, a tap on a place shows what happened there, and "Build something" opens Projects. */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
async function run(on) {
  const g = await open(srv.port, { save: Y1, exp: { map: on ? 1 : 0, reach: 1 } });
  await g.click(/^Continue/); await g.wait(2500);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
  for (let i = 0; i < 10; i++) { if (!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Continue|Okay|Got it|Noted|Thanks)$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }))) break; await g.wait(700); }
  await g.page.evaluate(() => window.SOP.setProjects(p => [...(p || []), { id: "t1", title: "Kuto market upgrade", type: "market", lga: "Abeokuta South", status: "delivered" }, { id: "t3", title: "Odeda water scheme", type: "water", lga: "Odeda", status: "in_progress" }])); await g.wait(400);
  await g.click(/^State$/); await g.wait(1500);
  const r = { nav: await g.page.evaluate(() => window.SOP.nav), shapes: await g.page.evaluate(() => document.querySelectorAll("[data-sop-map] path title").length) };
  if (on) {
    await g.page.evaluate(() => { const p = [...document.querySelectorAll("[data-sop-map] path")].find(x => (x.querySelector("title") || {}).textContent === "Abeokuta South"); p.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); await g.wait(500);
    r.card = await g.page.evaluate(() => document.querySelector("[data-sop-map]").innerText);
    await g.click(/^🏗️ Build something in Abeokuta South$/); await g.wait(800); r.after = await g.page.evaluate(() => window.SOP.nav);
  }
  r.errors = g.errors.slice(); await g.browser.close(); return r;
}
const on = await run(true), off = await run(false);
check(on.nav === "smap" && on.shapes === 20, "the State tab opens on the map of Ogun, all 20 local governments (" + on.nav + ", " + on.shapes + ")");
check(/Abeokuta South/.test(on.card) && /What you built here/.test(on.card) && /Kuto market upgrade/.test(on.card) && /Open/.test(on.card), "a tap on Abeokuta South shows the market built there");
check(/How people here feel\s*\d+%/.test(on.card), "and how its people feel");
check(on.after === "prj", "Build something here opens Projects");
check(off.nav !== "smap" && off.shapes === 0, "no map with the pillar off (" + off.nav + ")");
check(!on.errors.length && !off.errors.length, "no page errors (" + [...on.errors, ...off.errors].join(" | ") + ")");
console.log(fails ? fails + " failed" : "ALL PASSED"); srv.close && srv.close(); process.exit(fails ? 1 : 0);
