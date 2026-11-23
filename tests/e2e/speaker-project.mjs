/* The Speaker's road goes through the projects screen with his own contractor (owner, 23 Nov 2026: "it should open
   the project screen where I give it to a contractor… we'll use the Speaker's pre-approved contractor, which
   increases corruption… You can refuse, but if you refuse, your bill will stay blocked").
   Run: npm run build:game, then node tests/e2e/speaker-project.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const SH = process.env.SHOTS;
for (const yes of [true, false]) {
  const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80 };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  await g.page.evaluate(() => window.SOP.stcTest(p => { const L = p.leg || { members: [{ id: "m1", name: "Hon. Uzo Agbo", bloc: "swing", interest: "money", rel: 40 }], promises: [], asked: [] }; const w = (L.members.find(m => m.bloc !== "ours") || L.members[0]);
    return { ...p, house: { seats: 24, loyal: 10 }, leg: { ...L, speaker: { winner: w.id, kind: "fixer", crossed: true, hostile: true, at: 0, done: [], asks: [{ id: "roads", l: "Township roads in the Speaker's constituency", costB: .6, fx: { app: 1 } }, { id: "autonomy", l: "Financial autonomy for the House", costB: .4, fx: { pStab: -2 } }] } } }; })); await g.wait(500);
  const r = await playUntil(g, t => /wants his programmes first/.test(t), { max: 400, prefer: [/^Later$/] });
  check(r.ok, "the Speaker's price arrives");
  check(!!(await g.click(/^Build it: township roads/i)), "his road is a project to build"); await g.wait(1500);
  for (let i = 0; i < 4 && !/The Speaker has his own contractor/.test(await g.txt()); i++) { await g.click(/^(Okay|Got it|Continue|Noted)$/); await g.wait(700); }
  const t = await g.txt();
  if (SH) await g.page.screenshot({ path: SH + "/speaker-project.png" });
  check(/The Speaker has his own contractor/.test(t) && /Mace & Gavel Works/.test(t) && /Corruption \+3%/.test(t), "the projects screen offers only his contractor, with the corruption");
  const cor0 = await g.page.evaluate(() => window.SOP.s && window.SOP.s.cor);
  if (yes) {
    await g.click(/^Award to Mace & Gavel/); await g.wait(1500);
    const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, d: window.SOP.stc.speakerDeal, t: window.SOP.turn, sp: window.SOP.stc.leg.speaker, p: (window.SOP.projects || []).find(x => x.speakerAsk === "roads") }));
    check(st.p && st.p.status === "in_progress" && st.p.contractorId === "gavel", "the road is awarded to his firm and work starts");
    check(st.h.loyal >= 13 && st.d === st.t, "his bloc votes with you this year (" + st.h.loyal + "/24)");
    check(st.sp.done.includes("roads") && st.sp.hostile === true, "one of his asks is done; he still wants the other");
  } else {
    await g.click(/^Refuse his contractor$/); await g.wait(1200);
    const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, d: window.SOP.stc.speakerDeal, ref: window.SOP.stc.speakerRefused, t: window.SOP.turn, p: (window.SOP.projects || []).find(x => x.speakerAsk === "roads") }));
    check(!st.p && st.d !== st.t && st.ref === st.t && st.h.loyal < 13, "refusing: no project, no deal, the House stays blocked (" + st.h.loyal + "/24)");
    check(/Your bills stay blocked/.test(await g.txt()), "it says your bills stay blocked");
  }
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
