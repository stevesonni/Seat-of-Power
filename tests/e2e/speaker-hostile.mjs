/* A hostile Speaker (owner, 23 Nov 2026: "first I lose majority in the House, so I have to deal with the Speaker to
   get my bills and programmes through. The Speaker has his own programmes that he wants done"). His price comes every
   year: fund one of his programmes and the House is yours that year; refuse and you stay without a majority.
   Run: npm run build:game, then node tests/e2e/speaker-hostile.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
for (const pay of [true, false]) {
  const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80 };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  // The other side's man won last year without your backing: you have lost the House.
  await g.page.evaluate(() => window.SOP.stcTest(p => { const L = p.leg || { members: [{ id: "m1", name: "Hon. Uzo Agbo", bloc: "swing", interest: "money", rel: 40 }], promises: [], asked: [] }; const w = (L.members.find(m => m.bloc !== "ours") || L.members[0]);
    return { ...p, house: { seats: 24, loyal: 10 }, leg: { ...L, speaker: { winner: w.id, kind: "fixer", owes: false, crossed: true, hostile: true, at: 0, done: [], asks: [{ id: "empower", l: "An empowerment scheme run through members' offices", costB: .5, fx: { cor: .02 } }, { id: "hospital", l: "A specialist hospital in the Speaker's home town", costB: .9, fx: { app: 1 } }] } } }; })); await g.wait(500);
  const r = await playUntil(g, t => /wants his programmes first/.test(t), { max: 400, prefer: [/^Later$/] });
  check(r.ok, "the hostile Speaker's price arrives");
  const t = await g.txt();
  check(/no majority/i.test(t) && /bills stay off the floor/i.test(t) && /empowerment scheme/i.test(t), "it says: no majority, bills blocked, and his own programmes");
  if (pay) {
    await g.click(/^Fund it: an empowerment scheme/i); await g.wait(800);
    const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, d: window.SOP.stc.speakerDeal, t: window.SOP.turn, sp: window.SOP.stc.leg.speaker }));
    check(st.h.loyal >= 13 && st.d === st.t, "paying his price wins the House back this year (" + st.h.loyal + "/24)");
    check(st.sp.hostile === true && st.sp.done.includes("empower"), "one of his two programmes is done; he still wants the other");
  } else {
    await g.click(/^Refuse: govern without him/); await g.wait(800);
    const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, d: window.SOP.stc.speakerDeal, t: window.SOP.turn }));
    check(st.h.loyal < 13 && st.d !== st.t, "refusing leaves you without a majority (" + st.h.loyal + "/24)");
  }
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
