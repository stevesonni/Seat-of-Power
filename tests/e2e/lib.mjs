/* Shared helpers for the browser playthroughs. Needs the built game served
   from public/ (npm run build:game) and Chromium (PLAYWRIGHT_BROWSERS_PATH).
   window.SOP_TEST switches only these tests' election outcomes. */
import { createRequire } from "node:module";
// playwright-core if the project has it, else a global playwright install.
const req = createRequire(import.meta.url);
const pw = (() => { for (const m of ["playwright-core", "playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return req(m); } catch (e) {} } throw new Error("Install playwright-core to run the browser playthroughs"); })();
const { chromium } = pw;
import fs from "node:fs";
export const CHROME = process.env.CHROME || ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(p => fs.existsSync(p));
export async function open(port, { test = {}, seed = 7, phone = true, save } = {}) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width: 1366, height: 768 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|lagoslife/, r => r.abort());
  await ctx.addInitScript(({ test, seed, save }) => {
    window.SOP_TEST = test;
    let s = seed; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647;
    if (save && !sessionStorage.getItem("sop_e2e_loaded")) { for (const [k, v] of Object.entries(save)) localStorage.setItem(k, v); sessionStorage.setItem("sop_e2e_loaded", "1"); }
  }, { test, seed, save });
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(`http://localhost:${port}/seat-of-power.html`); await page.waitForTimeout(1500);
  const txt = () => page.evaluate(() => document.body.innerText);
  // Clicks only a button a player could reach: not one hidden behind an open sheet.
  const click = (re) => page.evaluate((src) => {
    const rx = new RegExp(src);
    for (const b of [...document.querySelectorAll("button")].filter(x => rx.test(x.textContent.trim()) && !x.disabled && x.offsetParent)) {
      b.scrollIntoView({ block: "center" });
      const r = b.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (el && !b.contains(el) && !el.contains(b)) continue;
      b.click(); return b.textContent.trim().slice(0, 60);
    }
    return false;
  }, re.source);
  const buttons = () => page.evaluate(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent && !b.disabled).map(b => b.textContent.trim().replace(/\s+/g, " ").slice(0, 60)));
  const wait = (ms = 350) => page.waitForTimeout(ms);
  return { browser, page, errors, txt, click, buttons, wait };
}
// Title → Quick start → adviser → ticket → campaign → result.
// New game with no politician yet: create one first (portrait, name, state, district).
export async function createPolitician(g, state = "Ogun") {
  if (!/First, create your politician|Create your politician/.test(await g.txt())) return false;
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-pressed]")].find(x => x.querySelector("img")); b && b.click(); });
  const ins = await g.page.$$("input"); if (ins[0]) await ins[0].fill("Wale"); if (ins[1]) await ins[1].fill("Adegoke");
  await g.page.selectOption("select", state); await g.wait(200);
  await g.click(/^Central/); await g.wait(200);
  await g.click(/^Create my politician$/); await g.wait(800);
  return true;
}
export async function campaign(g, { adviser = /Prof\. Bola Adekunle/ } = {}) {
  await g.click(/^New game$/); await g.wait(600); if (await g.click(/^Start a new game$/)) await g.wait(600);
  await createPolitician(g);
  await g.click(/Quick start/); await g.wait(900);
  await g.page.evaluate((src) => { const rx = new RegExp(src); const t = [...document.querySelectorAll("button")].find(b => rx.test(b.textContent)); t && t.click(); }, adviser.source); await g.wait(300);
  await g.click(/^Appoint/); await g.wait(400); await g.click(/See the ticket/); await g.wait(500);
  await g.click(/Launch the campaign/); await g.wait(800);
  return runCampaign(g);
}
// From the launched campaign to the result.
export async function runCampaign(g) {
  for (let i = 0; i < 220; i++) {
    const t = await g.txt();
    if (/GOVERNOR-ELECT|DEFEATED/.test(t)) return /GOVERNOR-ELECT/.test(t) ? "won" : "lost";
    await g.page.evaluate(() => { const bad = /^‹$|^\?$|Sound|Skip|Help|Start over|Restart|again|Borrow|godfather|Petition|Tribunal|Menu|☰|Run with no money|Home|afresh/i; const els = [...document.querySelectorAll("button, [role=button], div, li")].filter(e => e.offsetParent && getComputedStyle(e).cursor === "pointer" && !e.disabled && !bad.test(e.textContent.trim()) && e.textContent.trim().length < 300); const pref = els.find(b => /^(Do it|Continue|Next|See|Count|Okay|Results|Proceed|Close|Got it|Done|Confirm|Go)/i.test(b.textContent.trim())); const b = pref || els[els.length - 1]; b && b.click(); });
    await g.wait(250);
  }
  return "stuck";
}
// Result → Government House → first governing screen.
export async function takeOffice(g) {
  await g.click(/PROCEED TO GOVERNMENT HOUSE/);
  for (let j = 0; j < 15 && !/Welcome to Government House/.test(await g.txt()); j++) { await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(x => x.offsetParent).pop(); b && b.click(); }); await g.wait(450); }
  await g.click(/Begin your tenure/i); await g.wait(2200);
  for (let j = 0; j < 6; j++) { if (!(await g.click(/^(Okay|Got it|Continue|Close|On to the next.*)$/))) break; await g.wait(300); }
}

/* Play the governing screen forward, one sensible click at a time, until
   `until(text)` is true. Clicks, in order: confirmations, setup, budget,
   House vote, policies, end of year, continue; otherwise the first offered
   choice (a button, or a clickable choice card). Returns the click log. */
const SKIP = /^(🏠|🗑️|🔀 Restructure|☰|Compound|Govern|Today|News|Desk|Map|State|People|Wiki|Cast|Cabinet|Ministries|Civil Service|Trad\. Council|Council|Personas|Public|Stakeholders|Money|💰 Treasury|Treasury|Economy|Contracts|Projects|Policies|Budget|Overview|Skip guide|Show me ↓|Your promises|💰 Money|All \d|What.s in the pot|Fine-tune|\d+%Approval|🔊|🔇|💾|Standing|Help|🔁 Second Chance|See it$|↺ Replay$|⏭ Skip$|🔈 Voice off$|🔊 Voice on$|More ▾$|🤵 Ask your SA$|Ask your SA$|Hide$|Less$|▼$|▲$|Open the council$|Choose them yourself$|📋 Full year review$)|· \w+ zone|years? left|No action yet|Not started|In progress|\d+ open ▼/;
const PRIO = [/^(Okay|Got it|Understood|On to the next.*|Back to the compound|Open the Treasury|Watch them decide|Not now)$/, /^Do it: /, /^✍️ Handle it personally$/, /^.{6,}(›|❗)$/, /^(Leave the Secretariat|Back to where you were|Not now|Later|Close|Cancel|Back)$/, /^Convene the ministries$/, /^Create and swear in/, /^Convene the council$/, /^Submit to the House of Assembly/, /^🗳️ Call the vote/, /^Proceed to policies/, /^📬 \d+$/, /^Done: end the year/, /^Continue$/, /^The tray is clear/, /^(✍️ )?Sign$/];
export async function playUntil(g, until, { max = 400, prefer = [], log = false, onStep = null } = {}) {
  const clicks = [];
  for (let i = 0; i < max; i++) {
    if (onStep) await onStep(); // e.g. a screenshot of each new screen (audits)
    const t = await g.txt();
    if (until(t)) return { ok: true, clicks };
    let hit = null;
    // A shortcut that keeps coming back (say "Not now" on the same visitor) is a loop: decide instead.
    const recent = clicks.slice(-24), looping = (re) => recent.filter(c => re.test(c)).length >= 3;
    // Swearing in a commissioner: press it directly (the bot's cover check can miss it inside the sheet).
    if (!hit) hit = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && /^Create and swear in/.test(x.textContent.trim())); if (b) { b.click(); return "btn Create and swear in"; } return null; });
    if (!hit) for (const re of [...prefer, ...PRIO]) { if (looping(re) && !/Leave the Secretariat/.test(re.source)) continue; hit = await g.click(re); if (hit) break; }
    // Buttons pressed 3+ times in the last 24 clicks are a loop: try something else, or leave.
    const stuck = [...new Set(recent.filter(c => recent.filter(x => x === c).length >= 3).map(c => c.replace(/^(btn|card) /, "")))];
    if (!hit) hit = await g.page.evaluate(([skipSrc, stuck]) => {
      const skip = new RegExp(skipSrc);
      const vis = (e) => e.offsetParent !== null && !e.disabled;
      // Where the decision is: the topmost full-screen sheet if one is open, else this year's task.
      const sheets = [...document.querySelectorAll("div")].filter(d => { const cs = getComputedStyle(d); return cs.position === "fixed" && d.offsetHeight > innerHeight * .5 && d.querySelector("button, div"); });
      const scope = sheets[sheets.length - 1] || document.getElementById("sop-task") || null;
      if (!scope) return null;
      const okText = (e) => { const t = e.textContent.trim().replace(/\s+/g, " "); return t.length > 1 && !skip.test(t) && !stuck.some(x => t.startsWith(x)); };
      const bs = [...scope.querySelectorAll("button")].filter(b => vis(b) && okText(b));
      if (bs.length) { bs[0].click(); return "btn " + bs[0].textContent.trim().slice(0, 50); }
      const cards = [...scope.querySelectorAll("div, li, [role=button]")].filter(e => vis(e) && getComputedStyle(e).cursor === "pointer" && okText(e) && e.textContent.length < 400 && ![...e.querySelectorAll("div,li")].some(c => getComputedStyle(c).cursor === "pointer"));
      if (cards.length) { cards[0].click(); return "card " + cards[0].textContent.trim().slice(0, 50); }
      return null;
    }, [SKIP.source, stuck]);
    if (!hit) { if (!(await g.click(/^(Govern|Today)$/))) { await g.click(/^Desk\s*\d*$/); await g.wait(200); await g.click(/^(Govern|Today)$/); } await g.wait(250); hit = "→ Govern"; }
    clicks.push(hit); if (log) console.log(i, hit);
    await g.wait(300);
  }
  return { ok: false, clicks };
}
export const yearOf = (t) => { const m = t.match(/Year (\d) of 4[^\n]*?(\d{4})/); return m ? { y: +m[1], abs: +m[2] } : null; };
