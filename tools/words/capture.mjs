/* Capture every line of text a player sees, stage by stage. Writes JSON: [{stage, lines:[...]}] */
import fs from "node:fs";
import { open, createPolitician, playUntil, campaign, takeOffice } from "/home/user/Seat-of-Power/tests/e2e/lib.mjs";
import { serve } from "/home/user/Seat-of-Power/tests/e2e/serve.mjs";
const ROUTE = process.argv[2], OUT = process.argv[3];
const srv = await serve();
const seen = new Set(), stages = [];
let cur = null;
const stage = (name) => { if (!cur || cur.stage !== name) { cur = stages.find(s => s.stage === name) || (stages.push({ stage: name, lines: [] }), stages[stages.length - 1]); } };
const grab = async (g, name) => {
  try {
    const info = await g.page.evaluate(() => {
      const S = window.SOP || {}; const dlg = [...document.querySelectorAll("[role=dialog][aria-label]")].filter(d => d.offsetParent).pop();
      const veil = document.querySelector(".veil h2, .veil h3, .lv-council h2");
      return { turn: S.turn, phase: S.phase, dlg: dlg ? dlg.getAttribute("aria-label") : null, veil: veil ? veil.textContent.trim().slice(0, 60) : null, text: document.body.innerText };
    });
    const nm = name || ("Year " + (info.turn || "?") + " · " + (info.phase || "screen") + (info.dlg ? " · " + info.dlg : info.veil ? " · " + info.veil : ""));
    stage(nm);
    info.text.replace(/⁠/g, "").split("\n").map(x => x.trim()).filter(x => x && x.length > 1 && !/^[\d\s.,%₦+−-]+$/.test(x)).forEach(x => { if (!seen.has(x)) { seen.add(x); cur.lines.push(x); } });
  } catch (e) {}
};
const polDone = new Set();
const polStep = async (g) => {
  const ph = await g.page.evaluate(() => (window.SOP || {}).phase + "|" + (window.SOP || {}).turn);
  if (!/^policy\|/.test(ph) || polDone.has(ph)) return grab(g);
  polDone.add(ph); await grab(g);
  for (const t of ["Programmes", "Bills", "Executive orders"]) { await g.page.evaluate((nm) => { const b = [...document.querySelectorAll("button[role=tab]")].find(x => x.textContent.trim() === nm); b && b.click(); }, t); await g.wait(400);
    await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Show all \d+/.test(x.textContent.trim())); b && b.click(); }); await g.wait(400); await grab(g, "Year " + ph.split("|")[1] + " · policy step · " + t); }
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[role=tab]")].find(x => x.textContent.trim() === "Programmes"); b && b.click(); });
};
const tour = async (g, label) => {
  for (const [tab, nm] of [["hub", "Desk"], ["gov", "Govern"], ["prj", "Projects"], ["proc", "Contracts"], ["tre", "Treasury"], ["econ", "Economy"], ["cab", "Cabinet"], ["min", "Ministries"], ["cs", "Civil service"], ["coun", "Traditional council"], ["ppl", "People"], ["stk", "Stakeholders"], ["smap", "State map"], ["con", "Constitution"], ["cast", "Cast"], ["log", "Record"], ["bio", "Biography"]]) {
    await g.page.evaluate((t) => window.postMessage({ type: "sop-nav", payload: t }, "*"), tab); await g.wait(600); await grab(g, label + " · tab: " + nm);
    if (tab === "gov") for (const t of ["Programmes", "Bills", "Executive orders"]) { await g.page.evaluate((nm) => { const b = [...document.querySelectorAll("button[role=tab]")].find(x => x.textContent.trim() === nm); b && b.click(); }, t); await g.wait(400);
      await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Show all \d+/.test(x.textContent.trim())); b && b.click(); }); await g.wait(400); await grab(g, label + " · tab: " + t); }
  }
};
if (ROUTE === "short") {
  const g = await open(srv.port, { exp: { start: 1, screen: 1, stagger: 1, words: 1, drama: 1 }, test: { win: true } });
  await grab(g, "0 · Title screen");
  await g.click(/^New game$/); await g.wait(900); await grab(g, "1 · Create your politician"); await createPolitician(g); await g.wait(900);
  await grab(g, "2 · Short start: which state"); await g.click(/^Run in /); await g.wait(500);
  await grab(g, "3 · Short start: agenda"); await g.page.evaluate(() => document.querySelector("[data-sop-short-agenda=health]").click()); await g.wait(500);
  await grab(g, "4 · Short start: running mate"); await g.page.evaluate(() => document.querySelector("[data-sop-short-deputy=technocrat]").click()); await g.wait(500);
  for (const [re, nm] of [[/^Take half/, "5 · Short start: the godfather's deal"], [/^On to the campaign/, "6 · Short start: the campaign"], [/^The capital's biggest market$/, "7 · Short start: the rally"], [/^Election night/, "8 · Short start: election night"]]) { await grab(g, nm); await g.click(re); await g.wait(700); }
  await g.wait(6500); await grab(g, "8 · Short start: election night"); await g.click(/^Take the oath/); await g.wait(700); await grab(g, "9 · The oath"); await g.click(/^Begin your tenure/); await g.wait(3000);
  await grab(g, "10 · First day in office");
  await playUntil(g, (t) => /Year 2 of 4/.test(t), { max: 500, onStep: () => polStep(g) });
  await tour(g, "Year 2 tour");
  await playUntil(g, (t) => /Year 4 of 4/.test(t) || /Year [5-8]/.test(t), { max: 900, onStep: () => polStep(g) });
  await tour(g, "Later-year tour");
  await g.page.evaluate(() => window.SOP.setGEnd("complete")); await g.wait(3500); await grab(g, "End of term: the story");
  await g.browser.close();
} else if (ROUTE === "long") {
  const g = await open(srv.port, { exp: { start: 0 } });
  await grab(g, "0 · Title screen (full setup)");
  const r = await campaign(g, { adviser: /Prof\. Bola Adekunle/ });
  // campaign() clicks through; capture the result and the transition
  await grab(g, "Full setup: the result (" + r + ")");
  await g.page.evaluate(() => { window.__cap = []; });
  await takeOffice(g); await grab(g, "Full setup: Government House");
  await g.browser.close();
} else if (ROUTE === "longsteps") {
  // The full setup, captured screen by screen.
  const g = await open(srv.port, { exp: { start: 0 } });
  await g.click(/^New game$/); await g.wait(600); if (await g.click(/^Start a new game$/)) await g.wait(600);
  await grab(g, "Full setup 1 · Create your politician"); await createPolitician(g);
  await grab(g, "Full setup 2 · Quick start or full"); await g.click(/Quick start/); await g.wait(900);
  await grab(g, "Full setup 3 · Choose your adviser"); await g.page.evaluate(() => { const t = [...document.querySelectorAll("button")].find(b => /Prof\. Bola Adekunle/.test(b.textContent)); t && t.click(); }); await g.wait(300);
  await g.click(/^Appoint/); await g.wait(400); await grab(g, "Full setup 4 · The ticket"); await g.click(/See the ticket/); await g.wait(500);
  await grab(g, "Full setup 5 · Launch"); await g.click(/Launch the campaign/); await g.wait(800);
  for (let i = 0; i < 220; i++) { const t = await g.txt(); await grab(g, "Full setup 6 · The campaign");
    if (/GOVERNOR-ELECT|DEFEATED/.test(t)) break;
    await g.page.evaluate(() => { const bad = /^‹$|^\?$|Sound|Skip|Help|Start over|Restart|again|Borrow|godfather|Petition|Tribunal|Menu|☰|Run with no money|Home|afresh/i; const els = [...document.querySelectorAll("button")].filter(b => b.offsetParent && !b.disabled && !bad.test(b.textContent.trim())); els.length && els[els.length - 1].click(); });
    await g.wait(300); }
  await grab(g, "Full setup 7 · The result"); await takeOffice(g); await grab(g, "Full setup 8 · Government House");
  await g.browser.close();
} else if (ROUTE === "full") {
  const g = await open(srv.port, { exp: { start: 0 } });
  await g.click(/^New game$/); await g.wait(600); if (await g.click(/^Start a new game$/)) await g.wait(600);
  await grab(g, "Full setup · Create your politician"); await createPolitician(g); await g.wait(600);
  for (let i = 0; i < 40; i++) {
    const t = await g.txt(); if (/Week 1 of 4/.test(t)) break;
    const k = (t.match(/STEP \d OF 7 · [A-Z' ]+/) || [null])[0]; await grab(g, "Full setup · " + (k || "screen").replace(/\s+$/, ""));
    let hit = await g.click(/(→|›)$|^(Continue|Next|Launch the campaign|See the ticket|Run in .*|Appoint.*)$/);
    if (!hit) { await g.page.evaluate(() => { const bad = /Home|^‹$|Quick start|Random|^(Easy|Medium|Hard|Relaxed|Standard|Intense|All Nigeria|South-West|South-South|South-East|North-West|North-East|North-Central)$/; const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && !bad.test(x.textContent.trim())); b && b.click(); }); await g.wait(400); hit = await g.click(/(→|›)$|^(Continue|Next|Launch the campaign|See the ticket|Run in .*|Appoint.*|Use this.*|Choose.*|Pick.*)$/); }
    if (!hit) { await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(b => b.offsetParent && !b.disabled).pop(); b && b.click(); }); }
    await g.wait(700);
  }
  for (let i = 0; i < 220; i++) { const t = await g.txt(); await grab(g, /GOVERNOR-ELECT|DEFEATED/.test(t) ? "Full setup · the result" : "Full setup · the campaign (" + ((t.match(/Week \d of 4/) || ["?"])[0]) + ")");
    if (/GOVERNOR-ELECT|DEFEATED/.test(t)) break;
    await g.page.evaluate(() => { const bad = /^‹$|^\?$|Sound|Skip|Help|Start over|Restart|again|Borrow|godfather|Petition|Tribunal|Menu|☰|Run with no money|Home|afresh/i; const els = [...document.querySelectorAll("button")].filter(b => b.offsetParent && !b.disabled && !bad.test(b.textContent.trim())); els.length && els[els.length - 1].click(); });
    await g.wait(300); }
  await takeOffice(g); await grab(g, "Full setup · Government House");
  await g.browser.close();
} else if (ROUTE === "pres") {
  const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
  const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
    opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: ["a ministry for the North-Central caucus"], step: "sworn", zones: { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 },
    week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false, res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
  const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
  await grab(g, "P0 · Title (presidential run offered)"); await g.click(/Road to Aso Rock/); await g.wait(900); await grab(g, "P1 · The race result");
  await g.click(/Take the oath of office/); await g.wait(1500); await grab(g, "P2 · Inauguration");
  await g.click(/^✋ Take the oath$/); await g.wait(600); await grab(g, "P2 · Inauguration: commitments");
  for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
  await g.click(/^Next: the address$/); await g.wait(500); await grab(g, "P2 · Inauguration: the address"); await g.click(/Deliver the address/); await g.wait(1200);
  await playUntil(g, (t) => /Year 2 of/.test(t), { max: 400, onStep: () => polStep(g) });
  await tour(g, "Presidency tour");
  await playUntil(g, (t) => /Year 4 of/.test(t), { max: 700, onStep: () => polStep(g) });
  await g.browser.close();
}
srv.close();
fs.writeFileSync(OUT, JSON.stringify(stages, null, 1));
console.log(ROUTE, "stages:", stages.length, "lines:", stages.reduce((a, s) => a + s.lines.length, 0));
process.exit(0);
