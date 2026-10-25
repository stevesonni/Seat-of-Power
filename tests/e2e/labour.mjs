/* Labour in the browser. The President ignored the NLC's VAT ultimatum: the
   strike is on the Desk; the roundtable asks for everything in the bank; we
   refuse, then pay. A governor faces the NLC and ASUU at once: the first
   offer to ASUU is "an insult", no MoU in year one, no printing press.
   node tests/e2e/labour.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const OUT = process.env.SHOTS || "/tmp";
const optClick = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button.ds-option")].find(x => new RegExp(src).test(x.textContent) && !x.disabled); b && b.click(); return !!b; }, re.source);
let heard = "";
const close = async (g) => { heard += await g.txt(); for (let i = 0; i < 6 && await g.click(/^(Continue|Okay|Got it|Close|Later)$/); i++) { await g.wait(450); heard += await g.txt(); } };
const saved = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));

// ── The President.
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: [], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
let g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { labour: true } });
await g.page.evaluate(() => { window.__pres = []; const iv = setInterval(() => { if (window.SOP_outcome && !window.SOP_outcome.__w) { const o = window.SOP_outcome; window.SOP_outcome = (x) => { if (x && x.present) window.__pres.push(x.present.name + "|" + x.present.text); return o(x); }; window.SOP_outcome.__w = 1; } }, 50); });
await g.click(/Road to Aso Rock/); await g.wait(900); await g.click(/Take the oath of office/); await g.wait(1500);
await g.click(/^✋ Take the oath$/); await g.wait(600);
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
await g.click(/^Next: the address$/); await g.wait(500);
let seenLeader = false;
const r = await playUntil(g, t => { if (/You ignored our ultimatum/.test(t)) seenLeader = true; return /NLC strike · year 1/.test(t) && /Convene the roundtable \(2/.test(t); }, { max: 160, prefer: [/^Later$/] });
check(r.ok, "the NLC strike is on the President's Desk (NUATE: airports shut)");
await g.wait(1500); await close(g); seenLeader = seenLeader || (await g.page.evaluate(() => window.__pres || [])).some(x => /Nigeria Labour Congress\|You ignored our ultimatum/.test(x));
check(seenLeader, "the NLC president comes in person: “You ignored our ultimatum”");
await close(g);
let t = await g.txt();
check(/NUATE has grounded every flight/.test(t), "year one: the airports are shut");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Convene the roundtable/.test(x.textContent)); b && b.click(); }); await g.wait(600);
t = await g.txt();
check(/Their non-negotiable demand/.test(t) && /In the bank/.test(t), "the roundtable shows the bank and their demand side by side");
check(/Order the Central Bank to print it/.test(t), "the President may print the money (Ways and Means)");
check(/Send soldiers into the control rooms/.test(t), "or break it by force");
await g.page.screenshot({ path: OUT + "/labour-table.png" });
check(await optClick(g, /^Tell them the money is not there/), "refuse"); await g.wait(800);
await close(g); check((await g.page.evaluate(() => window.__pres || [])).some(x => /nothing to discuss/.test(x)), "they walk out");
t = await g.txt(); check(/Convene the roundtable \(1 session left/.test(t), "one session left this year");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Convene the roundtable/.test(x.textContent)); b && b.click(); }); await g.wait(600);
check(await optClick(g, /^Give them everything/), "pay everything"); await g.wait(900); await close(g); await g.wait(2600);
let sv = await saved(g);
const nlc = sv.stc && sv.stc.labour && sv.stc.labour.strikes && sv.stc.labour.strikes.nlc;
check(nlc && !nlc.on && nlc.over === "paid", "the strike is called off");
check((sv.stc.chains || []).some(b => b.kind === "labour_broke"), "and next year's empty treasury is scheduled");
check(!/NLC strike · year/.test(await g.txt()), "the strike leaves the Desk");
check(!g.errors.length, "no page errors (President) " + g.errors.join(" | "));
await g.browser.close();

// ── A governor: the NLC and ASUU together.
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
g = await open(srv.port, { save: YEAR1, seed: 7, test: { labour: "asuu", twist: true } });
await g.click(/^Continue/); await g.wait(1800);
const r2 = await playUntil(g, t0 => /ASUU strike · year/.test(t0) && /NLC strike · year 1/.test(t0), { max: 120, prefer: [/^Later$/, /^Tell the communities first/] });
check(r2.ok, "the governor's Desk: the NLC and ASUU both out");
await close(g);
t = await g.txt();
check(/The state secretariat is shut/.test(t), "the NLC shuts the state secretariat");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(x => /Convene the roundtable/.test(x.textContent)); const a = b.find(x => /ASUU/.test(x.closest("div[style*='border-radius: 16px']")?.textContent || "")) || b[b.length - 1]; a && a.click(); }); await g.wait(600);
t = await g.txt();
check(/roundtable: ASUU/.test(t), "the ASUU roundtable");
check(/UTAS, the union's own payroll, instead of IPPIS/.test(t), "the impossible demands are on the table");
check(!/print it/.test(t), "a governor has no printing press");
check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.ds-option")].find(x => /Sign an MoU/.test(x.textContent)); return !!(b && b.disabled); }), "no MoU in the first year");
check(await optClick(g, /^Concede UTAS/), "make an offer"); await g.wait(800);
heard = ""; await close(g); check(/insult/i.test(heard), "ASUU calls the first offer an insult");
// Arresting the NLC's leaders: an escalation, never a win.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(x => /Convene the roundtable/.test(x.textContent)); const a = b.find(x => /NLC/.test(x.closest("div[style*='border-radius: 16px']")?.textContent || "")) || b[0]; a && a.click(); }); await g.wait(600);
check(/A huge escalation/.test(await g.txt()), "the arrest option warns it is an escalation");
check(await optClick(g, /arrest the leaders/), "arrest the NLC leaders"); await g.wait(900);
heard = ""; await close(g); await g.wait(2600);
sv = await saved(g); const nl = sv.stc.labour.strikes.nlc;
check(nl && nl.arrested, "the arrest is on the record");
check(!/We have a deal|The factories are reopening/.test(heard), "nobody applauds the arrest");
check(nl.trust < 10 && (nl.on ? nl.stage >= 1 : nl.underground >= 2), "the arrest escalates: trust collapses, the strike goes on or underground (" + JSON.stringify({ on: nl.on, stage: nl.stage, under: nl.underground, trust: nl.trust }) + ")");
check(!g.errors.length, "no page errors (governor) " + g.errors.join(" | "));
await g.browser.close();

// ── A strike never runs the same way twice: next year it takes a new turn (a twist card).
g = await open(srv.port, { save: YEAR1, seed: 7, test: { labour: "asuu", twist: true } });
await g.click(/^Continue/); await g.wait(1800);
let twisted = false, seenTwist = false;
await playUntil(g, t0 => { if (/strike · a new turn/.test(t0)) seenTwist = true; return twisted; }, { max: 260, prefer: [/^Later$/, /^Tell the communities first/],
  onStep: async () => { const v = await saved(g); twisted = Object.values(((v.stc || {}).labour || {}).strikes || {}).some(x => (x.twists || []).length); } });
{ const v = await saved(g); check(seenTwist && twisted, "a strike takes a new turn the next year, and it is answered" + (twisted ? "" : " " + JSON.stringify({ seenTwist, turn: v.turn, lab: v.stc && v.stc.labour, last: v.stc && v.stc.lastTurn }) + " | " + (await g.txt()).slice(0, 300))); }
check(!g.errors.length, "no page errors (twist) " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
