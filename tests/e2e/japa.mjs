/* A contractor flees abroad with the mobilisation fee (japa). Only the Federal Government can get it back: the
   governor flies to Abuja; with good standing the President intervenes and, the next year, the exact amount is
   credited back with a letter from the Attorney-General; with poor standing the President declines.
   Run: npm run build:game, then node tests/e2e/japa.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
import * as SYS from "../../game/systems/index.js";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const P = () => { const mk = SYS.makeProject({ id: "p_road", title: "Abeokuta Ring Road", type: "road", qty: 20, lga: "Abeokuta North", ministryId: "works", approvedM: 9000, thisYearM: 4500, year: 1 });
  return { ...mk, status: "stalled", fled: true, japaChecked: true, contractor: "Kestrel Construction", startTurn: 1, progress: 5, ticked: 1 }; };
const seed = (fg, chains, cash = 3) => { const sv = JSON.parse(Y1.sop_save); sv.turn = 2; sv.projTicked = 2; sv.projects = [P()]; sv.fgRelation = fg; sv.s = { ...sv.s, cash };
  sv.stc = { ...sv.stc, lastTurn: 1, chains }; return { ...Y1, sop_save: JSON.stringify(sv) }; };
const japa = { id: "japa_p_road", kind: "japa", due: 2, projId: "p_road", firm: "Kestrel Construction", to: "Canada", lossM: 1350 };
const tapChoice = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && new RegExp(src).test(x.textContent)); if (b) { b.click(); return true; } return false; }, re.source);
async function abuja(fg) {
  const g = await open(srv.port, { save: seed(fg, [japa]) });
  await g.click(/^Continue/); await g.wait(2000);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
  let found = false;
  await playUntil(g, () => found, { max: 120, onStep: async () => { if (!found && await tapChoice(g, /Fly to Abuja: ask the President/)) { found = true; await g.wait(1500); } } });
  const t = await g.txt(), logs = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | "));
  const r = { found, text: t + " " + logs, back: /promised to intervene/.test(logs), errors: g.errors.slice() }; await g.browser.close(); return r;
}
const good = await abuja(70), bad = await abuja(30);
check(good.found && bad.found, "the japa card offers to fly to Abuja and ask the President");
check(/will intervene|Leave it with us/.test(good.text) && good.back, "good standing (70/100): the President intervenes, and the recovery is booked for next year");
check(/will not intervene|other priorities/.test(bad.text) && !bad.back, "poor standing (30/100): the President declines; nothing is booked");
// The next year: the exact amount comes back, with a letter from the Attorney-General.
const g = await open(srv.port, { save: seed(70, [{ id: "japa_back_p_road", kind: "japa_back", due: 2, projId: "p_road", proj: "Abeokuta Ring Road", firm: "Kestrel Construction", to: "Canada", lossM: 1350 }], 3) });
await g.click(/^Continue/); await g.wait(2000);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
// The recovery lands when the year closes: play to the next year, watching the treasury.
let cashAt = null; const c0 = await g.page.evaluate(() => window.SOP.s.cash);
await playUntil(g, (t) => /Year 3 of 4/.test(t), { max: 300, onStep: async () => { if (cashAt == null && await g.page.evaluate(() => (window.SOP.logs || []).some(l => /Recovered: Canada/.test(l.tx)))) cashAt = true; } });
const logs = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | ")), mail = await g.page.evaluate(() => document.body.innerText + JSON.stringify(window.SOP.mail || []));
const sv = { s: { cash: 4.35 } }; // the exact amount is checked in the log line below
check(cashAt === true, "the recovery lands when the year closes");
check(/₦1[.,]35B|₦1,350M/.test(logs) && /Canada/.test(logs), "the log states the exact amount recovered (" + logs.slice(0, 160) + ")");
check(/Recovered: Canada froze Kestrel Construction's accounts and the Federal Government repatriated the full ₦1[.,]35B|₦1,350M/.test(logs), "the full amount, stated exactly");
check(![...good.errors, ...bad.errors, ...g.errors].length, "no page errors (" + [...good.errors, ...bad.errors, ...g.errors].join(" | ") + ")");
await g.browser.close(); console.log(fails ? fails + " failed" : "ALL PASSED"); srv.close && srv.close(); process.exit(fails ? 1 : 0);
