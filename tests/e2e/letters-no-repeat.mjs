/* A letter you answer does not come back (owner, 25 Nov 2026: "This is the third time I am asking the President for
   the same army for the same site"). Letters held back by the yearly cap were kept on a carry list that was never
   emptied, so every one of them returned every year. Plays three years and checks that the carry list only ever holds
   this year's held-back letters, and that no letter key shows up in the mailbox in two different years.
   Run: npm run build:game, then node tests/e2e/letters-no-repeat.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 5 });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const seen = new Map(); let maxCarry = 0, turns = new Set();
const grab = async () => { try {
  const c = await g.page.evaluate(() => window.SOP.carryNow()); turns.add(c.turn); maxCarry = Math.max(maxCarry, c.carried.length);
  for (const L of (await g.page.evaluate(() => window.SOP.lettersTest() || []))) { if (!/^sc#/.test(L.key)) continue; const T = seen.get(L.key) || new Set(); T.add(c.turn); seen.set(L.key, T); }
} catch (e) {} };
await playUntil(g, () => turns.size >= 4, { max: 900, onStep: grab });
const again = [...seen].filter(([, T]) => T.size > 2).map(([k, T]) => k + " in " + [...T].join(","));
console.log("  years seen: " + [...turns].join(",") + " · letters: " + seen.size + " · most carried at once: " + maxCarry);
again.forEach(x => console.log("  repeats: " + x));
check(turns.size >= 3, "three years were played");
check(!again.length, "no letter comes back year after year");
check(maxCarry <= 30, "the carry list stays small");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
