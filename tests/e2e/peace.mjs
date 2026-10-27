/* Peace Plans and the handover in a browser. A Governor whose plan to make
   the state safe is at its last step: Seal, done properly, closes it for
   good with a front page. In the last year (7 of 8) the Transition
   Committee asks what to hand over. Run: npm run build:game, then node tests/e2e/peace.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";

const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const okay = async (g) => { for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue|Later)( →)?$/); i++) await g.wait(300); };
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button, .opt")].find(x => x.offsetParent && new RegExp(src).test(x.textContent.trim())); if (!b) return false; b.click(); return true; }, re.source);
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
// To the year's tray: play the year, settle the Treasury, end it.
const toTray = async (g) => {
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(500); await okay(g);
  const r = await playUntil(g, tx => /Done: end the year/.test(tx), { max: 80 });
  await g.wait(400); await okay(g); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g);
  await g.click(/^Done: end the year/); await g.wait(1500); await okay(g);
  if (await g.click(/^Open the Treasury$/)) { await g.wait(800); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g); await g.click(/^Desk\d*$/); await g.wait(400); await g.click(/^Today$/); await g.wait(400); await g.click(/^Done: end the year/); await g.wait(1500); await okay(g); }
  await g.click(/^(CONTINUE|Continue)$/); await g.wait(3500); await okay(g);
  return r.ok;
};
const openLetter = async (g, re) => { for (let i = 0; i < 6; i++) { const ok = await g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && new RegExp(src).test(x.textContent)); if (!b) return false; b.click(); return true; }, re.source); if (ok) return true; await okay(g); await g.wait(700); } return false; };

// ── 1. The plan's last step ──
{ const sv = JSON.parse(Y1.sop_save); sv.turn = 5; sv.stc = { ...sv.stc, lastTurn: 4, peace: { state: { front: "state", step: 3, started: 1, relapses: 0 } } };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
  check(await toTray(g), "the Governor reaches the end of year 5");
  check(await openLetter(g, /Ending insecurity: Seal/), "the plan's last step arrives as a letter");
  await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(1000);
  let t = await g.txt();
  check(/Peace Plan · Ogun · Step 4 of 4: Seal/i.test(t) && /Risk 25%/.test(t) && /Risk 45%/.test(t), "three ways, with the risk of a setback shown");
  check(!/End insecurity in Ogun for good/.test(t), "no new offer while a plan runs");
  await tap(g, /^Peace committees, forest guards and a law to keep them/); await g.wait(2500);
  let safe = false; for (let i = 0; i < 6 && !safe; i++) { safe = /OGUN IS SAFE AGAIN/i.test(await g.txt()); if (!safe) { await okay(g); await g.wait(500); } }
  check(safe, "done properly, Ogun is safe again: the front page");
  await okay(g); await g.wait(800);
  const s2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
  check(s2.stc && s2.stc.peace && s2.stc.peace.state && s2.stc.peace.state.closed, "the plan is closed for good in the save");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 2. The last year: the handover ──
{ const sv = JSON.parse(Y1.sop_save); sv.turn = 7; sv.stc = { ...sv.stc, lastTurn: 6, successor: null, successionAsked: false };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
  check(await toTray(g), "the Governor reaches the end of year 7");
  check(await openLetter(g, /What do you hand over\?/), "the Transition Committee's letter arrives");
  await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(1000);
  check(/A full handover dossier for every project/.test(await g.txt()), "it offers a full dossier, a briefing or nothing");
  await tap(g, /^A full handover dossier for every project/); await g.wait(1500); await okay(g);
  const s2 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
  check(s2.stc && s2.stc.handover === "full", "the handover is recorded");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }
srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
