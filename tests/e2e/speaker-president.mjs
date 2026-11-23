/* The President's backing breaks a hostile Speaker (owner, 23 Nov 2026: "If the president agrees to stand with me it
   puts me in majority back with one member over the speaker of the house so I am no more held hostage. If the
   president refuses then status quo continues").
   Run: npm run build:game, then node tests/e2e/speaker-president.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const seen = { yes: 0, no: 0 };
for (const fg of [100, 0]) {
  const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80 }; sv.fgRelation = fg;
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, test: { early: true } });
  await g.click(/^Continue/); await g.wait(1800);
  const r = await playUntil(g, t => /Visit the President\s*Once a year/.test(t), { max: 60 });
  check(r.ok, "the Desk offers a visit to the President");
  await g.wait(900);
  if (await g.page.evaluate(() => { const d = [...document.querySelectorAll("[role=alertdialog]")].find(x => /Special Adviser/i.test(x.textContent)); const b = d && d.querySelector("button"); if (b) { b.click(); return true; } return false; })) { await g.wait(700); await g.page.evaluate(() => window.postMessage({ type: "sop-nav", payload: "hub" }, "*")); await g.wait(700); await g.click(/^Today$/); await g.wait(500); }
  // The other side's man won the Speaker race: you have lost the House.
  await g.page.evaluate(() => window.SOP.stcTest(p => { const L = p.leg || { members: [{ id: "m1", name: "Hon. Uzo Agbo", bloc: "swing", interest: "money", rel: 40 }], promises: [], asked: [] }; const w = (L.members.find(m => m.bloc !== "ours") || L.members[0]);
    return { ...p, house: { seats: 24, loyal: 10 }, leg: { ...L, speaker: { winner: w.id, kind: "fixer", crossed: true, hostile: true, at: 0, done: [], asks: [{ id: "roads", l: "Township roads in the Speaker's constituency", costB: .6, fx: { app: 1 } }] } } }; })); await g.wait(500);
  await g.click(/✈️ Plan it/); await g.wait(600);
  const t0 = await g.txt();
  check(/gives? you the House by one/i.test(t0), "the Aso Rock list says what the President's backing would do to the Speaker");
  await g.page.evaluate(() => [...document.querySelectorAll("button.ds-option, button.opt")].find(b => /backing at the party/.test(b.textContent)).click()); await g.wait(9000);
  for (let i = 0; i < 12 && !/welcome to the Villa/.test(await g.txt()); i++) { if (!(await g.click(/^(Continue|Got it|Okay|Noted|Go in)$/))) await g.page.evaluate(() => { const f = document.querySelector(".sop-flight"); f && f.click(); }); await g.wait(1200); }
  await g.click(/^Ask for the President/); await g.wait(1000);
  const text = await g.txt();
  if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/backing-" + fg + ".png" });
  await g.click(/^Fly home$/); await g.wait(1200);
  const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, sp: window.SOP.stc.leg.speaker }));
  if (st.sp.hostile === false) { seen.yes++;
    check(st.h.loyal === 13, "a yes gives you the House by one (" + st.h.loyal + "/24)");
    check(/majority of one/.test(text) && /no longer hold your bills hostage/.test(text), "the President's answer says so");
  } else { seen.no++;
    check(st.h.loyal === 10, "a no changes nothing (" + st.h.loyal + "/24)");
    check(/still holds the House/.test(text), "the answer says the Speaker still holds the House");
  }
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
console.log("yes runs: " + seen.yes + ", no runs: " + seen.no);
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
