/* The six pillars in a browser, each switched on through the experiment
   (tests/e2e/lib.mjs open({ exp })). Run: npm run build:game, then
   node tests/e2e/pillars.mjs [front|gov|chair|end|all]   (serves public/ itself) */
import fs from "node:fs";
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve(), port = srv.port, which = process.argv[2] || "all";
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const ALL = { front: 1, wait: 1, money: 1, integrity: 1, plan: 1, region: 1 };

if (which === "front" || which === "all") {
  // 1. The cold open: a first-time player in the "front" group.
  const g = await open(port, { exp: { front: 1 } });
  const t0 = Date.now();
  check(/Your phone buzzes/.test(await g.txt()) && /FAAC/.test(await g.txt()), "a first-timer starts on day one: the FAAC alert");
  for (const [pick, out] of [[/^Pay the teachers first$/, /Teachers are paid/], [/^Repair it this week/, /fix the pump/], [/^Order a payroll audit$/, /ghosts are struck off/]]) {
    check(!!(await g.click(pick)), "decision: " + pick.source); await g.wait(400);
    const t = await g.txt(); check(out.test(t) && /Next: /.test(t), "the result says what happened and what happens next");
    await g.click(/^Next →$/); await g.wait(400);
  }
  check(!!(await g.click(/Cut the ribbon$/)), "a ribbon to cut"); await g.wait(400);
  check(/jerrycan/.test(await g.txt()), "the ribbon's picture moment"); await g.click(/^Next →$/); await g.wait(400);
  check(/Six months earlier/.test(await g.txt()), "then back six months, to the campaign");
  await g.click(/^Begin your campaign$/); await g.wait(900);
  check(/create your politician/i.test(await g.txt()), "straight into making a politician");
  check(Date.now() - t0 < 5 * 60000, "the cold open fits inside five minutes");
  check(await g.page.evaluate(() => !!localStorage.getItem("sop_prologue")), "seen once, remembered");
  await g.page.reload(); await g.wait(1500); check(!/Your phone buzzes/.test(await g.txt()), "not shown again");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();

  // Off for the other group, and never for a player with a save.
  const off = await open(port, { exp: "none" }); check(!/Your phone buzzes/.test(await off.txt()), "pillar off: the usual title screen"); await off.browser.close();
  const old = await open(port, { exp: { front: 1 }, save: Y1 }); check(!/Your phone buzzes/.test(await old.txt()), "a returning player with a save goes to the title"); await old.browser.close();

  // Languages: the picker, and the cold open in Yoruba.
  const y = await open(port, { exp: { front: 1 } });
  await y.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Skip$/.test(x.textContent.trim())); b && b.click(); }); await y.wait(500);
  check(/Language/.test(await y.txt()) && /Yorùbá/.test(await y.txt()) && /Pidgin/.test(await y.txt()), "the title screen has a language picker");
  await y.page.evaluate(() => { localStorage.removeItem("sop_prologue"); }); await y.click(/^Yorùbá$/); await y.wait(2500);
  check(/Fóònù rẹ ń dún/.test(await y.txt()), "the cold open in Yoruba");
  await y.page.evaluate(() => { localStorage.setItem("sop_lang", "pcm"); }); await y.page.reload(); await y.wait(1800);
  check(/Your phone dey vibrate/.test(await y.txt()), "and in Pidgin");
  check(/Skip am/.test(await y.txt()), "buttons are translated too");
  check(!y.errors.length, "no page errors (" + y.errors.join(" | ") + ")"); await y.browser.close();
}

if (which === "gov" || which === "all") {
  // 2–6 in a governor's year: quick wins, leaks, vetting, the neighbour race, the hint, the tab hints.
  const g = await open(port, { exp: ALL, save: Y1 });
  await g.click(/^Continue/); await g.wait(2000);
  const seen = new Set(), titles = { qw: /Three jobs you can finish this year/, leak: /leaked before it reached anyone/, vet: /Vet your commissioners/, rival: / v\. .* · \d|choosing between you and|cut the market levy|hosting the regional festival|claim the same farmland/i, site: /On site ·/, whistle: /A clerk says/, combo: /Combo/ };
  let hint = false, tabs = false;
  const r = await playUntil(g, (t) => { Object.entries(titles).forEach(([k, re]) => { if (re.test(t)) seen.add(k); }); if (/Money and projects/.test(t)) tabs = true; return /Year 3 of 4/.test(t); }, { max: 500,
    onStep: async () => { if (!hint && await g.page.evaluate(() => !!document.querySelector("[data-sop-hint]"))) hint = true; } });
  check(r.ok, "played on to year 3"); if (!r.ok) console.log("  last: " + r.clicks.slice(-15).join(" | "));
  check(hint, "the Hint button is on screen");
  check(tabs, "the tabs say what is behind them");
  check(seen.has("qw"), "quick wins are offered");
  check(seen.has("leak"), "FAAC day shows what leaked");
  check(seen.has("vet") || seen.has("whistle"), "the commissioners' integrity comes up");
  const sv0 = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}")), RV = (sv0.stc || {}).rivalry || {};
  check(seen.has("rival") || (RV.us || 0) + (RV.them || 0) > 0, "the race with the neighbouring state (" + (RV.seen || []).join(",") + ", score " + RV.us + "–" + RV.them + ")");
  console.log("  seen: " + [...seen].join(", "));
  const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
  check(sv.stc && sv.stc.pseed && (sv.stc.leakHist || []).length >= 1, "the leaks are on record (" + JSON.stringify((sv.stc || {}).leakHist) + ")");
  check(sv.stc && sv.stc.rivalry && sv.stc.rivalry.nb, "a neighbour was chosen (" + (sv.stc && sv.stc.rivalry && sv.stc.rivalry.nb) + ")");
  // The hint button speaks.
  for (let i = 0; i < 6 && await g.click(/^(Okay|Got it|Not now|Continue|Later|Next)$/); i++) await g.wait(400);
  const hb = await g.page.evaluate(() => { const b = document.querySelector("[data-sop-hint]"); b && b.click(); return !!b; }); await g.wait(800);
  if (!hb) console.log("  no hint button: " + (await g.txt()).replace(/\s+/g, " ").slice(0, 300));
  check(/special adviser/i.test(await g.txt()), "the hint comes from the adviser");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();

  // All pillars off: none of it.
  const o = await open(port, { exp: "none", save: Y1 }); await o.click(/^Continue/); await o.wait(2000);
  const seenOff = new Set();
  const r2 = await playUntil(o, (t) => { Object.entries(titles).forEach(([k, re]) => { if (re.test(t)) seenOff.add(k); }); return /Year 3 of 4/.test(t); }, { max: 500 });
  check(r2.ok && !seenOff.size && !(await o.page.evaluate(() => !!document.querySelector("[data-sop-hint]"))), "pillars off: no pillar cards and no Hint button (" + [...seenOff].join(",") + ")");
  check(!o.errors.length, "no page errors (" + o.errors.join(" | ") + ")"); await o.browser.close();
}

if (which === "chair" || which === "all") {
  // 5. The chairman's ambition and rival.
  const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP", lga: "Nsukka" });
  const g = await open(port, { save: { sop_profile: profile }, seed: 12, exp: { plan: 1 } });
  await g.page.mouse.click(28, 26); await g.wait(500); await g.click(/^Careers/); await g.wait(500);
  await g.page.evaluate(() => { const row = [...document.querySelectorAll("[role=dialog] div")].find(d => /^LGA Chairman/.test(d.textContent.trim()) && d.querySelector("button")); row.querySelector("button").click(); }); await g.wait(900);
  await g.click(/^✊The people's favourite/); await g.wait(600); await g.click(/^🤝/); await g.wait(600);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Next|Okay)$/.test(x.textContent.trim()) && x.offsetParent); b && b.click(); }); await g.wait(400);
  check(/What will this term be remembered for/.test(await g.txt()), "the chairman picks an ambition");
  check(!!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Not one naira missing/.test(x.textContent)); b && b.click(); return !!b; })), "ambition chosen: not one naira missing"); await g.wait(500);
  let rival = false;
  for (let i = 0; i < 160; i++) {
    const t = await g.txt(); if (/Your rival moves/.test(t)) rival = true;
    if (/chairman's notebook/.test(t) && /Re-elected|Voted out|Denied the ticket|Dissolved|Impeached/.test(t)) break;
    const hit = await g.page.evaluate(() => {
      const card = [...document.querySelectorAll("button")].find(x => /^(Continue|Next|Take office|To my desk|Understood|Okay|Good)$/.test(x.textContent.trim()) && x.offsetParent); if (card) { card.click(); return "card"; }
      if (/your in-tray/i.test(document.body.innerText)) { const boxes = [...document.querySelectorAll("button")].filter(b => /^⬜/.test(b.textContent.trim())); if (boxes.length && [...document.querySelectorAll("button")].filter(b => /^☑️/.test(b.textContent.trim())).length < 2) { boxes[0].click(); return "box"; } }
      const pref = [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && /^(Handle these two|Go and see the road|🏦Accept|Next half-year|To the council election|🗳️|See how it ends)/.test(b.textContent.trim()));
      const any = pref || [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && !/^(🏠|☰|‹|Back|✕|📘)/.test(b.textContent.trim()) && b.textContent.trim().length > 3);
      if (any) { any.click(); return any.textContent.trim().slice(0, 40); } return null; });
    if (!hit) break; await g.wait(250);
  }
  const t = await g.txt();
  check(rival || /Dissolved|Impeached/.test(t), "the rival makes a move");
  check(/Your ambition: Not one naira missing\. (Achieved|Not achieved)\./.test(t), "the ending judges the ambition");
  if (!/Your ambition: Not one naira missing/.test(t)) console.log("  screen: " + t.replace(/\s+/g, " ").slice(0, 600));
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
}

if (which === "end" || which === "all") {
  // The six end-of-term cards (always on), and a friend's challenge link.
  // A governorship that has just ended (voted out after four years).
  const g = await open(port, { exp: "none", save: Y1 });
  await g.click(/^Continue/); await g.wait(2500);
  await g.page.evaluate(() => window.SOP.setGEnd("defeated")); await g.wait(1500);
  for (let i = 0; i < 6 && await g.click(/^(Okay|Got it|Not now|Continue|Later)$/); i++) await g.wait(400);
  check(/VOTED OUT/.test(await g.txt()), "the term has ended");
  const t = await g.txt();
  check(/Your term in six cards/.test(t), "six cards to share");
  for (const k of ["Biography", "Report card", "Front page", "My cabinet", "Election result", "Beat my score"]) check(t.toLowerCase().includes(k.toLowerCase()), "card: " + k);
  check(/A1|B2|B3|C4|C5|C6|D7|E8|F9/.test(t), "the report card uses WAEC grades");
  await g.page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; navigator.canShare = () => false; HTMLAnchorElement.prototype.click = function () { window.__opened.push(this.download || this.href); }; });
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-testid=term-cards] button")].pop(); b && b.click(); }); await g.wait(1500);
  const opened = await g.page.evaluate(() => window.__opened);
  check(opened.some(u => /seat-of-power-challenge\.png/.test(u)) && opened.some(u => /wa\.me\/\?text=.*%3Fch%3D/.test(u)), "the challenge card saves a picture and opens WhatsApp with the link");
  const link = decodeURIComponent((opened.find(u => /wa\.me/.test(u)) || "").split("text=")[1] || "").match(/\?ch=\S+/);
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")"); await g.browser.close();
  if (link) { const f = await open(port, { exp: "none" }); await f.page.goto(`http://localhost:${port}/seat-of-power.html` + link[0]); await f.wait(2500);
    check(/create your politician|Choose your state|Your running mate|Quick start|campaign/i.test(await f.txt()), "the friend's link starts a game in the same state"); await f.browser.close(); }
}

srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
