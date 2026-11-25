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
for (const [pay, late] of [[true, false], [true, true], [false, false]]) {
  const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, cash: 40, pStab: 80 };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  // The other side's man won last year without your backing: you have lost the House.
  await g.page.evaluate(() => window.SOP.stcTest(p => { const L = p.leg || { members: [{ id: "m1", name: "Hon. Uzo Agbo", bloc: "swing", interest: "money", rel: 40 }], promises: [], asked: [] }; const w = (L.members.find(m => m.bloc !== "ours") || L.members[0]);
    return { ...p, house: { seats: 24, loyal: 10 }, leg: { ...L, speaker: { winner: w.id, kind: "fixer", owes: false, crossed: true, hostile: true, at: 0, done: [], asks: [{ id: "empower", l: "An empowerment scheme run through members' offices", costB: .5, fx: { cor: .02 } }, { id: "hospital", l: "A specialist hospital in the Speaker's home town", costB: .9, fx: { app: 1 } }] } } }; })); await g.wait(500);
  const r = await playUntil(g, t => /wants his programmes first/.test(t), { max: 400, prefer: [/^Later$/] });
  check(r.ok, "the hostile Speaker's price arrives");
  // A sheet the bot opened (a new ministry to fill) can sit over the letter: close it, as a player would.
  for (let i = 0; i < 3 && await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^Back$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }); i++) await g.wait(500);
  const press = (re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && new RegExp(src, "i").test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }, re.source);
  const t = await g.txt();
  check(/no majority/i.test(t) && /bills stay off the floor/i.test(t) && /empowerment scheme/i.test(t), "it says: no majority, bills blocked, and his own programmes");
  if (pay) {
    // The letter was kept from last year (owner, 25 Nov 2026: "I did what the Speaker asked for, still he won't let my
    // programme pass"): the year moves on before you pay. The deal must count for the year you pay in.
    if (late) { const t0 = await g.page.evaluate(() => window.SOP.turn); await g.page.evaluate((t) => { window.SOP.turnTest(t + 1); window.SOP.stcTest(p => ({ ...p, lastTurn: t + 1 })); }, t0); await g.wait(1200); }
    check(await press(/^Fund it: an empowerment scheme/), "you pay: fund his empowerment scheme" + (late ? " (a year late)" : "")); await g.wait(800);
    const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, d: window.SOP.stc.speakerDeal, t: window.SOP.turn, sp: window.SOP.stc.leg.speaker }));
    check(st.h.loyal >= 13 && st.d === st.t, "paying his price wins the House back this year (" + st.h.loyal + "/24)");
    check(st.sp.hostile === true && st.sp.done.includes("empower"), "one of his two programmes is done; he still wants the other");
    // Owner, 25 Nov 2026: "I did what the Speaker asked for, still he won't let my programme pass." After paying, a new programme starts.
    for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(500);
    const before = (await g.page.evaluate(() => window.SOP.worksNow())).pol.length;
    await g.page.evaluate(() => window.SOP.policyTest()); await g.wait(1500);
    const tt = (await g.txt()).replace(/\s+/g, " "), after = (await g.page.evaluate(() => window.SOP.worksNow())).pol.length;
    check(!/The House will not fund it/.test(tt) && after > before, "after paying, a new programme gets its money (" + before + " → " + after + ")" + (/The House will not fund it/.test(tt) ? " BLOCKED" : ""));
  } else {
    check(await press(/^Refuse: govern without him/), "you refuse"); await g.wait(800);
    const st = await g.page.evaluate(() => ({ h: window.SOP.stc.house, d: window.SOP.stc.speakerDeal, t: window.SOP.turn }));
    check(st.h.loyal < 13 && st.d !== st.t, "refusing leaves you without a majority (" + st.h.loyal + "/24)");
  }
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
