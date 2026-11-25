/* They ask again every year until you approve the work (owner, 25 Nov 2026: "If I don't do the mini-stadia the year the
   letter came I should still get it every year till I approve the work… different ways to present it").
   Run: npm run build:game, then node tests/e2e/sports-remind.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 3, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
// The mini-stadia were asked for this year, and not approved.
const t0 = await g.page.evaluate(() => window.SOP.turn);
await g.page.evaluate((t) => window.SOP.stcTest(p => ({ ...p, youthAsm: { turn: t, had: true }, miniAsk: { n: 1, last: t, first: t }, ministadia: null })), t0);
const seen = {}, said = new Set(); const grab = async () => { try { for (const L of await g.page.evaluate(() => (window.SOP.lettersTest() || []).filter(x => /^sc#mini_remind_/.test(x.key)))) seen[L.key] = L;
  // Say no yourself, as the player would: open the letter, handle it, "Not this year".
  for (const k of Object.keys(seen)) if (!said.has(k) && await g.page.evaluate((k) => window.SOP.openLetterTest(k.replace(/^sc#/, "")), k)) { await g.wait(800); await g.click(/Handle it personally/); await g.wait(900);
    if (await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^Not this year/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; })) said.add(k); await g.wait(900);
    for (let i = 0; i < 3 && await g.click(/^(Okay|Got it)$/); i++) await g.wait(400); } } catch (e) {} };
await playUntil(g, () => Object.keys(seen).length >= 2, { max: 700, onStep: grab, prefer: [/^Not this year$/] });
const L = Object.values(seen).sort((a, b) => a.key.localeCompare(b.key));
L.forEach(x => console.log("  " + x.key + " · " + x.title + " · " + x.from + " · " + x.body.slice(0, 160)));
check(L.length >= 1 && L[0].key === "sc#mini_remind_" + (t0 + 1), "the next year, they ask again");
check(L[0] && /The youths of Ogun are still asking\./.test(L[0].body) && /two mini-stadia/.test(L[0].body), "the first reminder: \"The youths are still asking\"");
check(L.length >= 2 && L[1].key === "sc#mini_remind_" + (t0 + 2), "said no again: the year after, they ask again");
check(L[1] && L[1].title !== L[0].title && /The people have not forgotten\./.test(L[1].body), "worded differently: \"The people have not forgotten\"");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
