/* The cabinet's primary in the Governor's game, and the friends' return:
   a Governor in year 7 with a cabinet that has voted; the succession letter
   offers the cabinet's choice first; anointing them is recorded for
   everyone; a minister returning to the desk sees what happened while
   they were away; the reminder button carries the desk link.
   Run: npm run build:game, then node tests/e2e/cabinet-succession.mjs */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { open, playUntil } from "./lib.mjs";

const port = 19600 + Math.floor(Math.random() * 90), data = fs.mkdtempSync(path.join(os.tmpdir(), "cabs-e2e-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "" }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const cab = (op, body) => fetch("http://127.0.0.1:" + port + "/api/cab/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const okay = async (g) => { for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue)( →)?$/); i++) await g.wait(300); };

// A cabinet in year 6 with the primary open: Chinaza (Finance) and Tunde (Works) declare; Chinaza wins the votes.
const c = await cab("create", { hostName: "Wale Adegoke", govName: "Wale Adegoke", state: "Ogun", startYear: 2027 });
const H = { code: c.code, key: c.hostKey }, k = {};
for (const [s, n] of [["finance", "Chinaza"], ["works", "Tunde"], ["deputy", "Bisi"]]) k[s] = { code: c.code, key: (await cab("join", { code: c.code, seat: s, invite: c.invites[s], name: n })).key };
await cab("publish", { ...H, year: 6, letters: [], primary: true });
await cab("run", k.finance); await cab("run", k.works);
await cab("vote", { ...k.deputy, seat: "finance" }); await cab("vote", { ...k.works, seat: "finance" }); await cab("vote", { ...k.finance, seat: "finance" });
// Chinaza's phone opens the desk once (so a later visit has something to compare with).
const f = await open(port, { save: { sop_cab_mem: JSON.stringify([{ code: c.code, seat: "finance", key: k.finance.key, name: "Chinaza", office: "governor" }]) } });
await f.page.goto("http://localhost:" + port + "/?desk=" + c.code); await f.wait(1800);
check(/Chinaza, Commissioner for Finance/.test(await f.txt()), "the desk link opens the minister's desk");
check(!/While you were away/i.test(await f.txt()), "no away card on the first visit");

// The Governor's game, loaded in year 7 of 8, with this cabinet.
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save);
sv.turn = 7; sv.stc = { ...sv.stc, lastTurn: 6, successor: null, successionAsked: false }; sv.fc = { code: c.code, hostKey: c.hostKey, invites: {} };
const g = await open(port, { save: { ...Y1, sop_save: JSON.stringify(sv), sop_cab_preview: "1" } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); });
await g.wait(500); await okay(g);
// The reminder carries the desk link.
const shared = []; await g.page.exposeFunction("sopShared", (t) => shared.push(t));
await g.page.evaluate(() => { window.open = (u) => { window.sopShared(decodeURIComponent(String(u).split("text=")[1] || u)); }; try { delete navigator.share; Object.defineProperty(navigator, "share", { value: undefined }); } catch (e) {} });
const r = await playUntil(g, tx => /Done: end the year/.test(tx), { max: 80 });
check(r.ok, "the Governor reaches the end of year 7");
await g.wait(400); await okay(g); await g.click(/^Spread it over 4 years/); await g.wait(500); await okay(g);
await g.click(/^Done: end the year/); await g.wait(1500); await okay(g);
// Before the year closes the adviser sends you to the Treasury once.
if (await g.click(/^Open the Treasury$/)) { await g.wait(800); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g); await g.click(/^Desk\d*$/); await g.wait(400); await g.click(/^Today$/); await g.wait(400); await g.click(/^Done: end the year/); await g.wait(1500); await okay(g); }
await g.click(/^(CONTINUE|Continue)$/); await g.wait(3500); await okay(g);
// The succession letter.
let found = false;
for (let i = 0; i < 6 && !found; i++) {
  found = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /Who comes after you\?/.test(x.textContent)); if (!b) return false; b.click(); return true; });
  if (!found) { await okay(g); await g.wait(800); }
}
check(found, "the succession letter arrives");
await g.wait(500); await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /Handle it personally/.test(x.textContent)); b && b.click(); }); await g.wait(1200);
let t = await g.txt();
check(/Anoint Chinaza, the cabinet's choice/.test(t), "the cabinet's choice heads the succession letter");
await g.page.evaluate(() => { const b = [...document.querySelectorAll(".opt, button")].find(x => x.offsetParent && /Anoint Chinaza, the cabinet's choice/.test(x.textContent)); b && b.click(); });
await g.wait(2500); await okay(g);
const v = (await cab("view", H)).cab;
check(v.successor && v.successor.name === "Chinaza" && v.successor.seat === "finance", "anointing Chinaza is recorded for the cabinet");
// Chinaza comes back: the away card, and her own succession.
await f.page.goto("http://localhost:" + port + "/?desk=" + c.code); await f.wait(1800);
t = await f.txt();
check(/While you were away/i.test(t) && /anointed Chinaza/.test(t), "the away card says what happened (" + (t.match(/While you were away[^\n]*\n[^\n]*/i) || [""])[0].replace(/\n/g, " ") + ")");
check(/Run for Governor yourself/.test(t), "the anointed minister is offered her own governorship");
// The Governor reminds Tunde about his waiting letter.
await g.wait(31000);
for (let i = 0; i < 4; i++) { await okay(g); await g.page.keyboard.press("Escape"); await g.wait(200); }
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label=Menu]")].find(x => x.offsetParent); b && b.click(); }); await g.wait(400);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /Your government of friends/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const rb = await g.page.evaluate(() => { const b = document.querySelector("[data-testid=cab-remind]"); b && b.click(); return document.querySelectorAll("[data-testid=cab-remind]").length + " remind buttons, panel " + !!document.querySelector("[data-testid=cab-panel]"); }); await g.wait(400);
console.log("  (" + rb + ")");
const hv = (await cab("view", H)).cab, waiting = hv.letters.filter(l => !l.advice && !l.decided && hv.seats[l.seat] && hv.seats[l.seat].member);
if (waiting.length) check(shared.some(x => /, the Governor needs your advice on “/.test(x) && x.includes("?desk=" + c.code)), "the reminder names the letter and links to the desk (" + (shared[0] || "nothing shared").slice(0, 140) + ")");
else console.log("  (no letter waiting on a friend this year: reminder not checked)");
check(!g.errors.length && !f.errors.length, "no page errors (" + [...g.errors, ...f.errors].join(" | ") + ")");
await g.browser.close(); await f.browser.close(); srv.kill();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
