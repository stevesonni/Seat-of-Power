/* The adviser's "Purge ghost workers" button on the Desk does what it says. */
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { test: { win: true } });
check(await campaign(g) === "won", "campaign won");
await takeOffice(g);
const r = await playUntil(g, t => /Purge ghost workers/.test(t), { max: 200, prefer: [] });
check(r.ok, "the adviser offers the purge");
const hit = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Purge ghost workers$/.test(x.textContent.trim()) && x.offsetParent); if (b) { b.scrollIntoView(); b.click(); return true; } return false; });
check(hit, "the button is there to press");
await g.wait(1500);
for (let i = 0; i < 4; i++) { const t0 = await g.txt(); if (/Ghost workers purged|Adopted: Biometric payroll|Two reforms this year|agenda is full|Already in place/.test(t0)) break; await g.click(/^(Continue|Got it|Okay)$/); await g.wait(700); }
const t = await g.txt();
const log = await g.page.evaluate(() => (JSON.parse(localStorage.getItem("sop_save") || "{}").logs || []).slice(0, 5).map(l => l.t || l.text || JSON.stringify(l)).join(" | "));
console.log("  log:", log.slice(0, 400));
await g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/ghost.png" });
check(/Ghost workers purged|Adopted: Biometric payroll|Two reforms this year|agenda is full|Already in place/.test(t), "pressing it does something visible");
check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
await g.browser.close(); srv.close(); process.exit(fails ? 1 : 0);
