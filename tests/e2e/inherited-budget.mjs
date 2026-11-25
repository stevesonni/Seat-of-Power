/* Year one: the budget you inherit (owner, 25 Nov 2026: "there shouldn't be a first budget submitted: either finish the
   budget your predecessor left, and next year you submit yours. You can make amendments to the budget too"). Keep it,
   or change up to 20 of every 100 naira and send it to the House. Run: npm run build:game, then node tests/e2e/inherited-budget.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const SH = process.env.SHOTS;
for (const how of ["keep", "change"]) {
  const g = await open(srv.port, { save: Y1, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  const r = await playUntil(g, t => /Your predecessor's budget is already law/.test(t), { max: 200, prefer: [/^Later$/] });
  check(r.ok, "year one opens on the budget you inherit");
  for (let i = 0; i < 4; i++) { if (!(await g.click(/^(Continue|Okay|Got it)$/))) break; await g.wait(600); }
  const t = await g.txt();
  if (SH && how === "keep") await g.page.screenshot({ path: SH + "/inherited.png" });
  check(/runs until December/.test(t) && /Your own budget comes next year/.test(t), "it says plainly whose budget it is and when yours comes");
  if (how === "keep") {
    await g.click(/^Keep it as it is/); await g.wait(900);
    const st = await g.page.evaluate(() => ({ inh: window.SOP.stc.inh, phase: window.SOP.phase }));
    check(st.inh && st.inh.kept === 1 && st.phase === "policy", "keeping it: the year goes on, no vote (" + st.phase + ")");
  } else {
    await g.click(/^Change part of it/); await g.wait(900);
    let t2 = await g.txt();
    if (SH) await g.page.screenshot({ path: SH + "/inherited-change.png" });
    check(/Moved so far: 0 of 20/.test(t2) && /Send the changes to the House of Assembly/.test(t2), "changing it: up to 20 of every 100, then the House");
  }
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
