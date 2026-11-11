/* The Governor's mailbox in a browser: the Chief of Staff is picked first;
   the year's matters arrive as letters; a letter handed to the Chief of Staff
   resolves without its card; the tray must be clear before the year moves on;
   the next budget arrives as a letter, from Finance when there is no Budget &
   Planning commissioner. Run: npm run build:game, then node tests/e2e/mail.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";

const srv = await serve(), port = srv.port;
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const okay = async (g) => { for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue)( →)?$/); i++) await g.wait(300); };
// The mailbox (Pack 31): "Next message" opens the most urgent letter; "Next letter" moves on to one the Chief of Staff can take.
const SKIP = /no ministry to fix it|A REQUEST TO SEE YOU|A request to see you|A FILE ON |A file on |APPOINT A HEAD OF SERVICE|Appoint a Head of Service|ANNUAL BRIEF|annual brief|EFCC:|ICPC:/;
const firstLetter = async (g) => {
  const opened = await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-mailbox] button")].find(x => /^Next message$/.test(x.textContent.trim())); if (!b) return false; b.click(); return true; });
  if (!opened) return false; await g.wait(600);
  for (let i = 0; i < 10; i++) { const t = await g.txt(); if (/(Hand it to|Insist:|Noted)/.test(t) && !SKIP.test(t.slice(0, 600))) return true; if (!(await g.click(/^Next letter →$/))) break; await g.wait(400); }
  await g.click(/^← Close the letter$/); return false;
};
// Open the mailbox and turn the letters until one matches.
const findLetter = async (g, re) => {
  if (!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-mailbox] button")].find(x => /^Next message$/.test(x.textContent.trim())); if (!b) return false; b.click(); return true; }))) return false;
  await g.wait(600); for (let i = 0; i < 12; i++) { if (re.test(await g.txt())) return true; if (!(await g.click(/^Next letter →$/))) break; await g.wait(400); } return false;
};

const g = await open(port, { save: YEAR1 });
await g.click(/^Continue/); await g.wait(1800);
let t = await g.txt();
check(/Pick your Chief of Staff/.test(t), "the Chief of Staff is picked on arrival");
check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); return !!b; }), "appointed the Technocrat");
await g.wait(500);
check(!/Pick your Chief of Staff/.test(await g.txt()), "the picker closes");
const r = await playUntil(g, tx => /Done: end the year/.test(tx), { max: 60 });
check(r.ok, "reached the end of Year 1");
await g.wait(400); await okay(g); await g.click(/^Spread it over 4 years/); await g.wait(500); await okay(g);
await g.click(/^Done: end the year/); await g.wait(1500); await okay(g);
await g.click(/^(CONTINUE|Continue)$/); await g.wait(1400);
const presented = /Your Excellency, .*needs you/.test(await g.txt());
await okay(g); // the adviser announces urgent mail in person
t = await g.txt();
await g.wait(1000); t = await g.txt(); // the mailbox comes back a moment after the adviser's pop-up closes
if (/Yours faithfully/.test(t)) { await g.click(/^← Close the letter$/); await g.wait(800); t = await g.txt(); } // the adviser opened the urgent letter: close it to see the mailbox
check(/\d+ unread/.test(t) && /letters? waits? in the mailbox/.test(t) && await g.page.evaluate(() => document.querySelectorAll("[data-sop-mailbox] button[aria-label^=Open]").length > 0), "the year's matters arrive as letters in the mailbox (" + ((t.match(/(\d+) unread/) || [])[1]) + " unread)");
check(!/The tray is clear/.test(t), "the year cannot move on while letters wait");
check(presented, "the adviser steps in to announce the urgent letter");
let handed = 0;
for (let i = 0; i < 8; i++) {
  let hit = await firstLetter(g); if (!hit) { await g.wait(1500); await okay(g); hit = await firstLetter(g); } if (!hit) break;
  await g.wait(400);
  const tt = await g.txt();
  if (i === 0) check(/Handle it personally/.test(tt) && /(Hand it to|Insist:)/.test(tt) && /(I can handle this|I can try|needs you)/.test(tt), "a letter offers both choices and the Chief of Staff's warning");
  if (!(await g.click(/^(Hand it to|Insist:|Noted)/))) break;
  handed++; await g.wait(2800); await okay(g); await g.wait(400); await okay(g);
}
check(handed >= 1, "handed " + handed + " letters to the Chief of Staff");
for (let i = 0; i < 10 && !/The tray is clear/.test(await g.txt()); i++) { await okay(g); await g.wait(500); }
t = await g.txt();
if (!/The tray is clear/.test(t)) { console.log("  screen:", t.slice(0, 1400).replace(/\n/g, " · "), "| handed", handed); await g.page.screenshot({ path: "/tmp/claude-0/-home-user-Seat-of-Power/6d547f60-c541-5156-9aeb-8af4391cce86/scratchpad/audit/mailfail.png" }); }
check(/The tray is clear/.test(t), "with the tray clear, the year can move on");
await g.click(/^The tray is clear/); await g.wait(1500); await okay(g); await g.wait(1000);
t = await g.txt();
check(/drafted by Finance alone/i.test(t) || await findLetter(g, /drafted by Finance alone/i), "next year's budget arrives as a letter, from Finance (no Budget & Planning commissioner)");
if (!/drafted by Finance alone/i.test(await g.txt())) await findLetter(g, /drafted by Finance alone/i);
await g.wait(300); await g.click(/^(Hand it to|Insist:|Noted)/); await g.wait(800); await okay(g);
const d = await g.page.evaluate(() => { try { return { log: document.body.innerText } ; } catch (e) { return {}; } });
check(/✓ Budget/.test(d.log) && !/in the mailbox/.test(d.log), "the Chief of Staff sent the budget and Year 2 is under way");
check(!/Goldfields/.test(d.log), "no goldfields in the game");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
