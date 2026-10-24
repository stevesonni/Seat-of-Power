/* The comeback after defeat: bring back the old team (running mate, adviser,
   party, agenda, Chief of Staff and commissioners) or choose a new one; either
   way the comeback term is the last four years (S.182). Run after npm run build:game. */
import { open, campaign, takeOffice, playUntil, runCampaign } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const save = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const g = await open(srv.port, { test: { win: true, reLose: true } });
check(await campaign(g) === "won", "first election won");
await takeOffice(g);
const before = { deputy: null, n: 0, sa: null };
const r = await playUntil(g, t => { return /VOTED OUT|STEPPED DOWN/.test(t); }, { max: 1300, prefer: [/^Go on without a loan/, /^🗳️ Run for Re-Election/] });
check(r.ok && /VOTED OUT/.test(await g.txt()), "voted out after one term");
if (!r.ok || !/VOTED OUT/.test(await g.txt())) { console.log("  last clicks: " + r.clicks.slice(-12).join(" | ")); console.log("  screen: " + (await g.txt()).replace(/\s+/g, " ").slice(0, 600)); }
// What the team looked like at the end (the last save before the defeat cleared it is gone; read it from the screen's state through the comeback).
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^🔁 The comeback/.test(x.textContent.trim())); b && b.click(); });
await g.wait(800);
const ask = await g.txt();
check(/Bring back your old team\?/.test(ask) && /four years left/.test(ask), "the comeback asks: the old team or a new one, and says four years are left");
const dep = (ask.match(/Running mate: ([^\n]+)/) || [])[1], nComm = +((ask.match(/(\d+) commissioners?/) || [])[1] || 0);
await g.click(/^Bring back my team$/); await g.wait(1200);
for (let i = 0; i < 3 && await g.click(/^(Got it|Okay|Continue)$/); i++) await g.wait(400);
const t7 = await g.txt();
check(/The old team is back/.test(t7) && /four years left/.test(t7), "straight to the ticket: the old team is back, four years left");
check(!!dep && t7.includes(dep.split(" ").pop()), "the same running mate is on the ticket (" + dep + ")");
await g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/comeback-ticket.png" });
await g.click(/^Launch the campaign$/); await g.wait(800);
check(await runCampaign(g) === "won", "the comeback campaign is won");

await takeOffice(g); await g.wait(1500);
const sv = await save(g);
check(sv.turn === 5, "the comeback term starts as the final term (turn " + sv.turn + ")");
check(((sv.ministries || []).filter(m => m.minister).length) === nComm && nComm > 0, "the commissioners are sworn in again (" + nComm + ")");
check(sv.setup && sv.setup.depGov && sv.setup.depGov.nm === dep, "the same deputy governor");
const tc = await g.txt(); check(sv.setup && sv.setup.startYear + sv.turn - 1 === 2035, "the calendar reads 2035"); if (!/2035/.test(tc)) console.log("  years on screen: " + (tc.match(/20[23]\d/g) || []).slice(0, 8).join(","), "setup.startYear", sv.setup && sv.setup.startYear);
check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
await g.browser.close(); srv.close(); process.exit(fails ? 1 : 0);
