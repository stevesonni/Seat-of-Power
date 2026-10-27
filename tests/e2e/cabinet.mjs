/* The Cabinet of friends in two browsers on the real server: the Governor
   forms a government; a friend opens the WhatsApp link, is screened, sworn in
   and lands on their desk; the year's letters are routed by portfolio; a
   friend's advice shows on the Governor's letter and card; signing it is
   recorded as followed; the friend's desk shows the front page.
   Run: npm run build:game, then node tests/e2e/cabinet.mjs */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { open, playUntil } from "./lib.mjs";

const port = 19900 + Math.floor(Math.random() * 90), data = fs.mkdtempSync(path.join(os.tmpdir(), "cab-e2e-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "" }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const cab = (op, body) => fetch("http://127.0.0.1:" + port + "/api/cab/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const okay = async (g) => { for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue)( →)?$/); i++) await g.wait(300); };

// ── For players it is still "coming soon" ──
const menu = (g) => g.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label=Menu]")].find(x => x.offsetParent); b && b.click(); });
{ const l = await open(port, { save: YEAR1 });
  await l.click(/^Continue/); await l.wait(1800);
  await l.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); });
  await l.wait(500); await okay(l); await menu(l); await l.wait(400);
  check(!!(await l.click(/Govern with your friends · coming soon/)), "the menu says the cabinet is coming soon");
  await l.wait(600);
  check(/Coming soon: govern with your friends/.test(await l.txt()), "tapping it explains it is coming soon");
  await okay(l); await l.click(/^People$/); await l.wait(300); await l.click(/^Cabinet$/); await l.wait(500);
  const t0 = await l.txt();
  check(/Coming soon/i.test(t0) && !/Form the government/.test(t0), "People → Cabinet shows Coming soon, with no way to form one");
  await l.browser.close(); }

// ── The Governor forms the government (unlocked for testing with the preview switch) ──
const g = await open(port, { save: { ...YEAR1, sop_cab_preview: "1" } });
let created = null; g.page.on("response", async r => { if (/\/api\/cab\/create$/.test(r.url())) try { created = await r.json(); } catch (e) {} });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); });
await g.wait(500); await okay(g);
await menu(g); await g.wait(400);
check(!!(await g.click(/^Govern with your friends$/)), "with the preview switch, the menu offers to govern with friends");
await g.wait(600);
check(/Govern with your friends/.test(await g.txt()) && /Form the government/.test(await g.txt()), "the cabinet card explains it");
await g.click(/^Form the government$/); await g.wait(1500); await okay(g);
check(created && created.ok && /^[A-Z2-9]{6}$/.test(created.code), "a government is formed (" + (created && created.code) + ")");
let t = await g.txt();
check(/Your government of friends/.test(t) && /Invite on WhatsApp/.test(t), "each seat has an invite link");

// ── A friend accepts the Finance seat on their own phone ──
const f = await open(port, {});
await f.page.goto("http://localhost:" + port + "/?cab=" + created.code + "&seat=finance&inv=" + encodeURIComponent(created.invites.finance)); await f.wait(1500);
t = await f.txt();
check(/You have been nominated/.test(t) && /Commissioner for Finance/.test(t), "the link opens the nomination");
await f.page.fill("input", "Chinaza"); await f.click(/^Accept the nomination$/); await f.wait(400);
check(/The House screens the nominee/i.test(await f.txt()), "the House screens the nominee");
await f.page.evaluate(() => { const b = document.querySelector("[data-testid=cab-screening] .sp-opt"); b && b.click(); }); await f.wait(200);
await f.click(/^Take the oath of office$/); await f.wait(1200);
check(/Sworn in/.test(await f.txt()), "sworn in");
await f.click(/^Go to your desk$/); await f.wait(1500);
t = await f.txt();
check(/Chinaza, Commissioner for Finance/.test(t) && /The budget council/.test(t), "the minister's desk opens");
check(!/cab=/.test(f.page.url()), "the invite is cleared from the address bar");
// Every other seat is taken through the API, so every letter has an adviser.
const keys = { finance: null };
for (const s of ["deputy", "works", "justice", "social"]) keys[s] = (await cab("join", { code: created.code, seat: s, invite: created.invites[s], name: "Friend " + s })).key;

// ── The Governor's year: the mail is shared with the cabinet ──
await g.click(/^Desk$/); await g.wait(300);
const r = await playUntil(g, tx => /Done: end the year/.test(tx), { max: 60 });
check(r.ok, "the Governor reaches the end of Year 1");
await g.wait(400); await okay(g); await g.click(/^Spread it over 4 years/); await g.wait(500); await okay(g);
await g.click(/^Done: end the year/); await g.wait(1500); await okay(g);
await g.click(/^(CONTINUE|Continue)$/); await g.wait(4000); await okay(g);
const host = (await cab("view", { code: created.code, key: created.hostKey })).cab;
check(host.year >= 1 && host.letters.length > 0, "Year " + host.year + "'s letters reached the cabinet (" + host.letters.length + ": " + host.letters.map(l => l.seat).join(", ") + ")");
const L = host.letters.find(l => !l.stance && l.seat !== "finance") || host.letters.find(l => !l.stance) || host.letters[0];
const pick = L.opts[L.opts.length - 1].label;
const adv = L.seat === "finance" ? null : await cab("advise", { code: created.code, key: keys[L.seat], letterId: L.id, pick, note: "Trust me on this" });
if (L.seat === "finance") { await f.click(/^↻ Refresh$/); await f.wait(1200); await f.page.evaluate((p) => { const b = [...document.querySelectorAll("[data-testid=cab-letter] .sp-opt")].find(x => x.textContent.trim() === p); b && b.click(); }, pick); await f.click(/^Send my advice$/); await f.wait(1200); }
check(L.seat === "finance" || (adv && adv.ok), "the " + L.seat + " minister advises on “" + L.title + "”");
// The Governor sees the advice on the letter.
await g.wait(31000); // the cabinet refreshes every 30 seconds
const opened = await g.page.evaluate((title) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && x.textContent.includes(title.slice(0, 24))); if (!b) return false; b.click(); return true; }, L.title.replace(/^URGENT: .*? · /, ""));
await g.wait(600);
t = await g.txt();
check(opened && /advises:/.test(t) && (L.seat === "finance" || /Trust me on this/.test(t)), "the letter carries the minister's advice");
if (!L.stance) {
  await g.click(/^✍️ Handle it personally$/); await g.wait(800);
  t = await g.txt();
  check(/'s advice/.test(t), "the advised option is marked on the card");
  const done = await g.page.evaluate((p) => { const b = [...document.querySelectorAll(".opt, button")].find(x => x.offsetParent && x.textContent.includes(p.slice(0, 30)) && !x.disabled); if (!b) return false; b.click(); return true; }, pick);
  await g.wait(2500); await okay(g);
  const v = (await cab("view", { code: created.code, key: created.hostKey })).cab;
  check(done && v.seats[L.seat].rec.followed === 1, "signing the advised option is recorded as followed");
}
// The friend sees the year: the numbers and the front pages.
await f.click(/^↻ Refresh$/); await f.wait(1200);
t = await f.txt();
check(/Approval/i.test(t) && /In the bank/i.test(t), "the friend's desk shows the state's numbers");
check(/Friend (deputy|works|justice|social)/.test(t), "the friend sees the rest of the cabinet");
check(!g.errors.length && !f.errors.length, "no page errors (" + [...g.errors, ...f.errors].join(" | ") + ")");
await g.browser.close(); await f.browser.close(); srv.kill();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
