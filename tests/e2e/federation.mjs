/* Linked governments in two browsers on the real server: a President invites
   a friend's governorship; the friend opens the link, links Ogun and carries
   on; the President's grant lands in Ogun's treasury; Ogun asks for a federal
   road and the President approves it; Ogun backs the President in the
   Governors' Forum, and the vote reaches the President's front page.
   Run: npm run build:game, then node tests/e2e/federation.mjs */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { open } from "./lib.mjs";

const port = 19500 + Math.floor(Math.random() * 90), data = fs.mkdtempSync(path.join(os.tmpdir(), "fed-e2e-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "" }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const fed = (op, body) => fetch("http://127.0.0.1:" + port + "/api/fed/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && new RegExp(src).test(x.textContent.trim())); if (!b) return false; b.click(); return true; }, re.source);
const clear = async (g) => { for (let i = 0; i < 8; i++) { if (!(await tap(g, /^(Continue|Okay|Got it|Later)$/))) break; await g.wait(500); } };
const bank = (g) => g.page.evaluate(() => { const m = document.body.innerText.match(/₦([\d.]+)B\s*Bank/); return m ? +m[1] : null; });

// ── The President ──
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false,
  res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
const p = await open(port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won), sop_cab_preview: "1" }, seed: 5 });
let created = null; p.page.on("response", async r => { if (/\/api\/fed\/create$/.test(r.url())) try { created = await r.json(); } catch (e) {} });
await p.click(/Road to Aso Rock/); await p.wait(900);
await p.click(/Take the oath of office/); await p.wait(1500);
await p.click(/^✋ Take the oath$/); await p.wait(600);
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await p.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await p.wait(150); }
await p.click(/^Next: the address$/); await p.wait(500);
await p.click(/Deliver the address/); await p.wait(1500);
for (let i = 0; i < 8; i++) { if (!(await p.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; })) && !(await p.click(/^(Continue|Got it|Okay)$/))) break; await p.wait(500); }
await p.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await p.wait(500); await clear(p);
await p.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label=Menu]")].find(x => x.offsetParent); b && b.click(); }); await p.wait(400);
await tap(p, /^👥 Govern with your friends$/); await p.wait(700);
check(/Link your friends' governorships/.test(await p.txt()), "the President is offered the federation");
await tap(p, /^Invite the governors$/); await p.wait(1500);
check(created && created.ok, "a federation is created (" + (created && created.code) + ")");

// ── A friend's governorship (Ogun, year 1) opens the link ──
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(port, { save: Y1 });
await g.page.goto("http://localhost:" + port + "/?fed=" + created.code + "&inv=" + encodeURIComponent(created.invite)); await g.wait(1800);
let t = await g.txt();
check(/An invitation from the President/.test(t) && /President Ada Okafor invites your governorship/.test(t), "the link shows the President's invitation");
check(await tap(g, /^Link Ogun and continue my governorship$/), "the friend links Ogun and carries on");
await g.wait(2500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(1200);
let joined = false;
for (let i = 0; i < 8 && !joined; i++) { joined = /Ogun joins President Ada Okafor's federation/.test(await g.txt()); if (!joined) { await tap(g, /^(Continue|Okay|Got it)$/); await g.wait(500); } }
check(joined, "Ogun joins the federation, and is told so");
await clear(g);
let pv = (await fed("view", { code: created.code, key: created.presKey })).fed;
check(pv.govs.length === 1 && pv.govs[0].state === "Ogun", "the President's federation has Ogun");

// ── The President sends a grant ──
await p.wait(31000); // the President's phone checks the federation every 30 seconds
await clear(p);
await p.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label=Menu]")].find(x => x.offsetParent); b && b.click(); }); await p.wait(300);
await tap(p, /Your government of friends|Govern with your friends/); await p.wait(700);
{ const pt = await p.page.evaluate(() => (document.querySelector("[data-testid=fed-panel]") || {}).innerText || "no panel"); check(/Ogun · Gov\./.test(pt), "Ogun appears on the President's desk (" + pt.slice(0, 80).replace(/\n/g, " ") + ")"); }
await tap(p, /^💰 Grant ₦2B$/); await p.wait(1200);
const b0 = await bank(g);
await g.wait(31000); // the governor's phone checks too
t = await g.txt();
check(/₦2B from Abuja/.test(t), "the grant lands in Ogun's game");
await clear(g);
const b1 = await bank(g);
check(b0 != null && b1 != null && Math.abs(b1 - b0 - 2) < .11, "Ogun's bank rose by ₦2B (" + b0 + " → " + b1 + ")");

// ── Ogun asks for a federal road, and backs the President in the Forum ──
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label=Menu]")].find(x => x.offsetParent); b && b.click(); }); await g.wait(300);
await tap(g, /President Ada Okafor's federation/); await g.wait(800);
check(/President Ada Okafor's federation/.test(await g.txt()), "Ogun sees the federation under People → Cabinet");
check(await tap(g, /^Ask for a 🛣️ federal road$/), "Ogun asks for a federal road"); await g.wait(1200);
check(await tap(g, /^Back the President$/), "Ogun votes in the Governors' Forum"); await g.wait(1200);
await p.wait(31000);
t = await p.txt();
check(/Ogun asks for a federal road/.test(t), "the request reaches the President");
await tap(p, /^Approve \(₦3B\)$/); await p.wait(1500);
await g.wait(31000);
t = await g.txt();
check(/FEDERAL ROAD FOR OGUN/i.test(t), "the federal road lands on Ogun's front page");
await clear(g);
// The President's year turns: the Forum closes and the vote reaches the President.
await fed("publish", { code: created.code, key: created.presKey, year: 2 });
await p.wait(31000);
t = await p.txt();
let gb = /GOV\u2060?ERNORS BACK THE PRESIDENT/i.test(t);
for (let i = 0; i < 6 && !gb; i++) { await tap(p, /^(Continue|Okay|Got it|Later)$/); await p.wait(700); gb = /GOV\u2060?ERNORS BACK THE PRESIDENT/i.test(await p.txt()); }
if (!gb) console.log("  screen:", (await p.txt()).slice(0, 600).replace(/\n/g, " · "));
check(gb, "the Forum's vote reaches the President's front page");
check(!p.errors.length && !g.errors.length, "no page errors (" + [...p.errors, ...g.errors].join(" | ") + ")");
await p.browser.close(); await g.browser.close(); srv.kill();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
