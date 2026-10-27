/* The President's cabinet of friends in two browsers on the real server: the
   Vice-President and seven ministers, hard politics on; a friend faces the
   Senate and lands on a minister's desk; a private offer reaches them alone.
   Run: npm run build:game, then node tests/e2e/cabinet-president.mjs */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { open } from "./lib.mjs";

const port = 19700 + Math.floor(Math.random() * 90), data = fs.mkdtempSync(path.join(os.tmpdir(), "cabp-e2e-"));
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "", CAB_TEMPT: "1", CAB_EXPOSE: "1" }, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch("http://127.0.0.1:" + port + "/health"); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
const cab = (op, body) => fetch("http://127.0.0.1:" + port + "/api/cab/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false,
  res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
const g = await open(port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won), sop_cab_preview: "1" }, seed: 5 });
let created = null; g.page.on("response", async r => { if (/\/api\/cab\/create$/.test(r.url())) try { created = await r.json(); } catch (e) {} });
await g.click(/Road to Aso Rock/); await g.wait(900);
await g.click(/Take the oath of office/); await g.wait(1500);
await g.click(/^✋ Take the oath$/); await g.wait(600);
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
await g.click(/^Next: the address$/); await g.wait(500);
await g.click(/Deliver the address/); await g.wait(1500);
for (let i = 0; i < 8; i++) { if (!(await g.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; })) && !(await g.click(/^(Continue|Got it|Okay)$/))) break; await g.wait(500); }
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label=Menu]")].find(x => x.offsetParent); b && b.click(); }); await g.wait(400);
check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && x.textContent.trim() === "Govern with your friends"); if (!b) return false; b.click(); return true; }), "the President's menu offers the cabinet of friends");
await g.wait(600);
let t = await g.txt();
check(/Vice-President/.test(t) && /Minister of Defence & NSA/.test(t) && /Minister of State for Petroleum/.test(t), "the form lists the Vice-President and the seven ministers");
await g.page.evaluate(() => { const b = document.querySelector("[data-testid=cab-hard]"); b && b.click(); }); await g.wait(200);
const cover = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && x.textContent.trim() === "Form the government"); if (!b) return "no button"; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const hit = b.contains(el) ? "" : (el && (el.className || el.tagName) + ":" + (el.textContent || "").slice(0, 60)); b.click(); return hit; });
if (cover) console.log("  (covered by " + cover + ")");
await g.wait(1500);
for (let i = 0; i < 4 && await g.click(/^(Okay|Got it|Continue)$/); i++) await g.wait(300);
check(created && Object.keys(created.invites).length === 8, "eight seats, eight invites");
const v = (await cab("view", { code: created.code, key: created.hostKey })).cab;
check(v.gov.office === "president" && v.hard, "a President's government, with hard politics");
// A friend faces the Senate for Foreign Affairs.
const f = await open(port, {});
await f.page.goto("http://localhost:" + port + "/?cab=" + created.code + "&seat=foreign&inv=" + encodeURIComponent(created.invites.foreign)); await f.wait(1500);
t = await f.txt();
check(/President/.test(t) && /Minister of Foreign Affairs of the Federal Republic of Nigeria/.test(t), "the nomination comes from the President");
check(/Hard politics is on/.test(t), "the nominee is warned that offers may come");
await f.page.fill("input", "Kemi"); await f.click(/^Accept the nomination$/); await f.wait(400);
check(/The Senate screens the nominee/i.test(await f.txt()), "the Senate screens the nominee");
await f.page.evaluate(() => { const b = document.querySelector("[data-testid=cab-screening] .sp-opt"); b && b.click(); }); await f.wait(200);
await f.click(/^Take the oath of office$/); await f.wait(1200); await f.click(/^Go to your desk$/); await f.wait(1500);
t = await f.txt();
check(/Kemi, Minister of Foreign Affairs/.test(t) && /President Ada Okafor's administration/i.test(t), "the minister's desk is the President's administration");
// The President's phone opens a year: an offer reaches the minister alone (the odds are 1 in this test).
await cab("publish", { code: created.code, key: created.hostKey, year: 2, letters: [] });
await f.click(/^↻ Refresh$/); await f.wait(1200);
t = await f.txt();
check(/For your eyes only/i.test(t) && /Take the envelope/.test(t), "a private offer reaches the minister");
await f.click(/^Take the envelope$/); await f.wait(1200);
check(/Your private account: ₦\d+M/.test(await f.txt()), "the stash shows only on the minister's phone");
const hv = (await cab("view", { code: created.code, key: created.hostKey })).cab;
check(hv.seats.foreign.rec.stash === undefined, "the President cannot see it");
// The next year the envelope comes out: the President's phone gets the scandal and can sack the minister.
await cab("publish", { code: created.code, key: created.hostKey, year: 3, letters: [] });
const app0 = await g.page.evaluate(() => (document.body.innerText.match(/(\d+)%\s*Approval/) || [])[1]);
await g.wait(31000); // the President's phone checks the cabinet every 30 seconds
t = await g.txt();
check(/Kemi is in trouble/.test(t) || /EFCC INVITES KEMI/i.test(t), "the scandal reaches the President");
let sacked = false;
for (let i = 0; i < 8 && !sacked; i++) { sacked = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^Sack Kemi$/.test(x.textContent.trim())); if (!b) return false; b.click(); return true; });
  if (!sacked) { await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].reverse().find(x => x.offsetParent && /^(Continue|Okay)$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(600); } }
await g.wait(1500);
for (let i = 0; i < 6; i++) { if (!(await g.page.evaluate(() => { const b = document.querySelector(".veil .btn"); if (b) { b.click(); return true; } return false; }))) break; await g.wait(400); }
const hv2 = (await cab("view", { code: created.code, key: created.hostKey })).cab;
check(sacked && !hv2.seats.foreign.member && hv2.seats.foreign.former[0].name === "Kemi", "“Sack Kemi” from the scandal card sacks her");
check(hv2.events.length === 0, "the President's phone applied the events once");
// Sacked, Kemi writes against the President from the same phone.
await f.click(/^↻ Refresh$/); await f.wait(1200);
t = await f.txt();
check(/former Minister of Foreign Affairs/.test(t) && /Sacked in year/i.test(t) && !/Letters for your desk/.test(t), "the sacked minister's desk becomes a former minister's");
await f.page.fill("[data-testid=cab-former] input", "The President sold us out at the UN");
await f.page.fill("[data-testid=cab-former] textarea", "I was in the room. The deals were for friends.");
await f.click(/^Publish my op-ed$/); await f.wait(1200);
check(/Your piece ran this year/.test(await f.txt()), "the op-ed is published, once a year");
await g.wait(31000);
t = await g.txt();
check(/THE PRESIDENT SOLD US OUT AT THE UN/.test(t) || /wrote against you/.test(t), "the op-ed lands on the President's front page");
check(!g.errors.length && !f.errors.length, "no page errors (" + [...g.errors, ...f.errors].join(" | ") + ")");
await g.browser.close(); await f.browser.close(); srv.kill();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
