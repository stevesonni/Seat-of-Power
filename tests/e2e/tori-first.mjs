/* The first post on Tori (owner, 23 Nov 2026): thanks for being elected, or "the tribunal has restored the
   mandate", and the agenda. Posted once, in the first year. Run: npm run build:game, then node tests/e2e/tori-first.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
for (const court of [false, true]) {
  const sv = JSON.parse(Y1.sop_save); sv.setup = { ...sv.setup, wonInCourt: court, agenda: "infrastructure" }; sv.stc = { ...(sv.stc || {}), tori: {} };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  let posts = []; await playUntil(g, () => posts.length > 0, { max: 150, prefer: [/^Later$/], onStep: async () => { posts = await g.page.evaluate(() => ((window.SOP.stc.tori || {}).posts || [])); } });
  const p = posts[0] || {};
  check(posts.length >= 1 && p.id === "term_post_1" && p.turn === 1, (court ? "tribunal: " : "election: ") + "the first post goes up in year one");
  check(court ? /tribunal has restored the mandate/.test(p.text) : /happy to have been elected your Governor/.test(p.text), (court ? "it says the mandate was reclaimed" : "it says you are happy to be elected") + " (" + String(p.text).slice(0, 70) + "…)");
  check(/Build, Build, Build/.test(p.text), "it names the agenda");
  await g.wait(1500);
  const n = await g.page.evaluate(() => ((window.SOP.stc.tori || {}).posts || []).filter(x => x.id === "term_post_1").length);
  check(n === 1, "posted once");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
// The second term: re-elected, or the mandate reclaimed at the tribunal.
for (const court of [false, true]) {
  const sv = JSON.parse(Y1.sop_save); sv.turn = 5; sv.setup = { ...sv.setup, agenda: "infrastructure" }; sv.stc = { ...(sv.stc || {}), lastTurn: 4, reWonInCourt: court, tori: { firstPost: true, posts: [{ turn: 1, id: "term_post_1", text: "x" }] } };
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 7, test: { noStrikes: true } });
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
  let p = null; await playUntil(g, () => !!p, { max: 150, prefer: [/^Later$/], onStep: async () => { p = await g.page.evaluate(() => ((window.SOP.stc.tori || {}).posts || []).find(x => x.id === "term_post_2") || null); } });
  check(!!p && p.turn === 5, (court ? "tribunal: " : "re-elected: ") + "the second term's first post goes up in year five");
  check(court ? /reclaimed our mandate to continue/.test(p && p.text) : /for re-electing us/.test(p && p.text), (court ? "it says the mandate was reclaimed to continue" : "it thanks them for re-electing you") + " (" + String(p && p.text).slice(0, 60) + "…)");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
