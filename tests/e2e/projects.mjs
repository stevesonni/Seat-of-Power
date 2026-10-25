/* The project journey in a browser: approve → the adviser names the next
   step → its button opens that step → do it → the project and the adviser
   both move on → save, reload, resume. Also: two projects at once, a save
   from before the fix (stuck in procurement), and a funding blocker.
   Run: npm run build:game, then node tests/e2e/projects.mjs  (serves public/ itself) */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
import { makeProject } from "../../game/systems/projects.js";
import { LENDERS } from "../../game/systems/loans.js";

const srv = await serve(), port = srv.port;
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const withSave = (edit) => { const d = JSON.parse(YEAR1.sop_save); edit(d); return { ...YEAR1, sop_save: JSON.stringify(d) }; };
const bubbles = (g) => g.page.evaluate(() => [...document.querySelectorAll(".sp-bubble")].filter(b => b.offsetParent).map(b => b.textContent));
const saved = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const proj = async (g, title) => ((await saved(g)).projects || []).find(p => p.title === title);
// Into the policy step of Year 1, with nothing in front of the programmes.
const toPolicies = async (g) => {
  await g.click(/^Continue/); await g.wait(1800);
  await playUntil(g, t => /Done: end the year/.test(t), { max: 40, prefer: [/^Tell the communities first/] });
  await g.click(/^Decide later this year$/); await g.wait(300);
  for (let i = 0; i < 3 && await g.click(/^(Continue|Got it|Okay)$/); i++) await g.wait(400); // the adviser's announcements
  await g.wait(400); await g.click(/^Spread it over 4 years/); await g.wait(600); // the last government's debt (new games)
  for (let i = 0; i < 3 && await g.click(/^(Got it|Okay)$/); i++) await g.wait(300); // the year's money card
};
const lendUntilOffer = async (g) => {
  for (let i = 0; i < 4; i++) {
    if (await g.click(/^Accept and receive/)) return true;
    if (!(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button.sp-opt")].find(x => !x.disabled && x.offsetParent); if (b) b.click(); return !!b; }))) return false;
    await g.wait(450);
  }
  return !!(await g.click(/^Accept and receive/));
};
const ROAD = "500km Road Network";
// Close any outcome card on top, as a player would, before the next click.
const clear = async (g) => { for (let i = 0; i < 6 && await g.click(/^(Got it|Okay|Understood|Continue|On to the next.*|Not now)$/); i++) await g.wait(350); };
const toTab = async (g, tab) => { await g.page.evaluate((t) => window.postMessage({ type: "sop-nav", payload: t }, "*"), tab); await g.wait(600); };

// ── Money: with money in the bank, a project is paid from it and nothing is borrowed ──
{
  const g = await open(port, { save: YEAR1 });
  await toPolicies(g);
  const d0 = await saved(g);
  check(d0.s && d0.s.cash > 5, "money: this year's money arrived in the bank (" + (d0.s && d0.s.cash) + "B)");
  await g.click(/^Show all \d+ programmes$/); await g.wait(300); // the list shows two at a time
  await g.page.getByText(ROAD, { exact: true }).first().click(); await g.wait(600);
  await g.click(/^Next: the budget/); await g.wait(300);
  check(!/Seek financing/.test(await g.txt()), "money: the bank can pay this year's share, so no loan is offered");
  await g.click(/^Approve the project$/); await g.wait(2200);
  check((await bubbles(g)).some(x => /money is in place.*review its procurement/.test(x)), "money: the adviser goes straight to procurement");
  await g.click(/^Review road procurement$/); await g.wait(400); await g.click(/^Award contract$/); await g.wait(1500);
  const d1 = await saved(g);
  check((d1.s.debt || 0) === (d0.s.debt || 0), "money: nothing was borrowed (debt " + d1.s.debt + ")");
  check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
  await g.browser.close();
}
// ── Money: an empty bank and no lenders: the state is broke and nothing happens ──
{
  const g = await open(port, { save: withSave(d => { d.s.cash = 0; d.cashSeed = 1; d.s.cashYear = 1; d.s.debt = 40; }) });
  await toPolicies(g);
  await g.click(/^Show all \d+ programmes$/); await g.wait(300); // the list shows two at a time
  await g.page.getByText(ROAD, { exact: true }).first().click(); await g.wait(600);
  await g.click(/^Next: the budget/); await g.wait(300);
  await g.click(/^Seek financing/); await g.click(/^Approve the project$/); await g.wait(1500);
  await g.click(/^Later$/); await g.wait(300);
  const before = await saved(g);
  const prog = await g.page.evaluate(() => { const c = [...document.querySelectorAll("div")].find(d => getComputedStyle(d).cursor === "pointer" && /Farm Input Subsidies|Irrigation Network/.test(d.textContent) && d.textContent.length < 400); if (c) c.click(); return !!c; });
  await g.wait(500);
  const t = await g.txt();
  check(prog && /The state can't pay for this/.test(t), "money: when broke, a programme is refused with the reason");
  await g.click(/^Understood$/); await g.wait(500);
  const after = await saved(g);
  check((after.pol || []).length === (before.pol || []).length && after.s.debt === before.s.debt, "money: nothing started and nothing was borrowed");
  check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
  await g.browser.close();
}

// ── 1–6: one new project, start to finish, then reload (an empty bank, so it needs a loan) ──
{
  const g = await open(port, { save: withSave(d => { d.s.cash = 0.5; d.s.cashYear = 1; }) });
  await toPolicies(g);
  await g.click(/^Show all \d+ programmes$/); await g.wait(300); // the list shows two at a time
  await g.page.getByText(ROAD, { exact: true }).first().click(); await g.wait(600);
  await g.click(/^Next: the budget/); await g.wait(300);
  await g.click(/^Seek financing/);
  check(!!(await g.click(/^Approve the project$/)), "1. approve the road programme");
  await g.wait(250);
  await g.wait(900);
  let p = await proj(g, ROAD);
  check(p && p.status === "pending_finance" && !p.contractorId && p.spentM === 0, "1. approval is not a contract: no contractor, nothing spent (" + (p && p.status) + ")");
  await g.wait(800);
  let b = await bubbles(g);
  check(b.some(x => /^Governor, 500km Road Network is approved.*next step is to find the money/.test(x)), "2. the adviser names the next step: " + b[b.length - 1]);
  check(!!(await g.click(/^Find the money$/)), "2. follow the adviser's button");
  await g.wait(400);
  check(/FIND THE MONEY/i.test(await g.txt()) && /500km Road Network/.test(await g.txt()), "3. it opens this project's finance step");
  check(await lendUntilOffer(g), "4. a lender's offer is accepted");
  await g.wait(250);
  await g.wait(900);
  p = await proj(g, ROAD);
  check(p.status === "pending_procurement" && p.loanLeftM > 0, "5. money recorded (" + p.loanLeftM + "M in hand)");
  await g.wait(800);
  b = await bubbles(g);
  check(b.some(x => /next step is to review its procurement/.test(x)), "5. the adviser moves on to procurement");
  await clear(g);
  check(!!(await g.click(/^Review road procurement$/)), "2. 'Review road procurement' opens procurement");
  await g.wait(400);
  check(/Award the contract/.test(await g.txt()), "3. bidders shown for this project");
  await g.click(/^Award contract$/); await g.wait(250);
  await g.wait(900);
  p = await proj(g, ROAD);
  check(p.status === "in_progress" && !!p.contractorId, "4. contract awarded and recorded (" + p.contractorId + ")");
  await g.wait(800);
  b = await bubbles(g);
  check(b.some(x => /under construction.*Nothing is due until year end/.test(x)), "5. the adviser says nothing is due until year end");
  await g.click(/^Back to the desk$/); await g.wait(300); await g.click(/^(Govern|Today)$/); await g.wait(400);
  const con = await g.page.evaluate(() => [...document.querySelectorAll(".sp-con")].map(x => x.textContent).join(" "));
  check(/contract signed with/.test(con), "5. the desk shows what changed: " + con.slice(0, 90));
  b = await bubbles(g);
  check(!b.some(x => /500km Road Network/.test(x) && /next step/.test(x)), "5. the desk adviser no longer asks for a done step");
  await g.page.reload(); await g.wait(1500);
  await g.click(/^Continue/); await g.wait(1800);
  p = await proj(g, ROAD);
  check(p && p.status === "in_progress" && p.contractorId, "6. after reload the project is still under construction");
  await toTab(g, "prj");
  const t = await g.txt();
  check(/500km Road Network/.test(t) && /UNDER CONSTRUCTION/i.test(t) && /Nothing due yet/.test(t), "6. the Projects tab resumes it: under construction, nothing due yet");

  // ── 7: a second project while the first is running ──
  await g.click(/New project/); await g.wait(400);
  await g.page.fill("textarea", "A 100-bed hospital in Abeokuta South"); await g.click(/^Read it$/); await g.wait(300);
  await g.click(/^Next: the budget/); await g.wait(300);
  await g.click(/^Seek financing|^Approve the full cost/);
  const ok2 = await g.click(/^Approve the project$/); await g.wait(1500);
  const ps = ((await saved(g)).projects || []).filter(x => x.estimateM != null);
  const hosp = ps.find(x => x.type === "hospital");
  check(ok2 && hosp && ps.length === 2, "7. a second project approved (" + ps.map(x => x.title + ":" + x.status).join(", ") + ")");
  b = await bubbles(g);
  check(hosp && b.some(x => x.includes(hosp.title) && /next step/.test(x)), "7. the adviser speaks for the project that is due, not the running one");
  await g.click(/^Later$/); await g.wait(300);
  const order = await g.page.evaluate(() => [...document.querySelectorAll(".sp-card")].map(c => c.textContent).filter(x => /hospital|Road Network/i.test(x)).map(x => /Road Network/.test(x) ? "road" : "hospital"));
  check(order[0] === "hospital", "7. the portfolio lists the due project first (" + order.join(",") + ")");
  check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
  await g.browser.close();
}

// ── 8: a save made before the fix, stuck in procurement ──
{
  const old = withSave(d => { d.sv = 3; d.projects = [{ id: "old_road", title: ROAD, nm: ROAD, type: "road", cost: 8.1, status: "pending_procurement", fin: { kind: "prefinance" }, progress: 0, startTurn: 1, decisions: [] }]; d.pendingProc = { title: ROAD, id: "old_road" }; });
  const g = await open(port, { save: old });
  await g.click(/^Continue/); await g.wait(1800);
  let p = await proj(g, ROAD);
  check(p && p.migrated && p.estimateM === 8100 && p.status === "pending_procurement", "8. the old stuck project is repaired on load (" + (p && p.status) + ")");
  const r8 = await playUntil(g, t => /Review road procurement/.test(t), { max: 40, prefer: [/^Tell the communities first/, /^Decide later this year$/] });
  if (!r8.ok) console.log("  clicks 8:", r8.clicks.slice(-20).join(" / "));
  await clear(g);
  { const ok8 = !!(await g.click(/^Review road procurement$/)); if (!ok8) console.log("  cover 8:", await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Review road procurement/.test(x.textContent)); if (!b) return "no button"; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return JSON.stringify([b.textContent, r.top, r.height, el && el.tagName, el && el.className, el && (el.textContent || "").slice(0, 80), el && el.closest("[style]") && el.closest("[style]").getAttribute("style").slice(0, 160)]); })); check(ok8, "8. the adviser offers 'Review road procurement' for the old project"); }
  await g.wait(400);
  check(/Award the contract/.test(await g.txt()), "8. it opens procurement with bidders, not an empty list");
  await g.click(/^Award contract$/); await g.wait(1200);
  p = await proj(g, ROAD);
  check(p.status === "in_progress" && !!p.contractorId, "8. the old project can now be awarded");
  check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
  await g.browser.close();
}

// ── 9: every lender said no: a clear blocker, and a way through ──
{
  const big = { ...makeProject({ id: "p_block", title: "Ring Road", type: "road", qty: 20, lga: "Abeokuta South", ministryId: null, approvedM: 0, thisYearM: 0, year: 1 }), status: "pending_finance", triedLenders: Object.keys(LENDERS) };
  big.approvedM = big.estimateM;
  const g = await open(port, { save: withSave(d => { d.sv = 4; d.projects = [big]; }) });
  await g.click(/^Continue/); await g.wait(1800);
  await playUntil(g, t => /every lender has turned down/i.test(t), { max: 40, prefer: [/^Tell the communities first/, /^Decide later this year$/] });
  const b = await bubbles(g);
  check(b.some(x => /every lender has turned down Ring Road/.test(x)), "9. the adviser explains the blocker: " + (b.find(x => /lender/.test(x)) || b[0]));
  await clear(g);
  check(!!(await g.click(/^Revise the scope$/)), "9. its button opens the project");
  await g.wait(400);
  const t = await g.txt();
  check(/Blocked/.test(t) && /Fit the scope to the budget/.test(t) && /Defer indefinitely/.test(t), "9. the dossier says Blocked and offers the two real ways out");
  await g.click(/^Fit the scope to the budget$/); await g.wait(1200);
  if (await g.click(/^Spread it over 4 years/)) { await g.wait(600); await g.click(/^Got it$/); await g.wait(400); await g.click(/^Revise the scope$/); await g.wait(400); await g.click(/^Fit the scope to the budget$/); await g.wait(1200); } // the debt choice came up first
  let t2 = await g.txt();
  for (let i = 0; i < 4 && !/It still does not fit/.test(t2) && await g.click(/^(On to the next.*|Okay|Got it|Understood)$/); i++) { await g.wait(500); t2 = await g.txt(); } // cards queued ahead of the result
  const p = await proj(g, "Ring Road");
  check((p.status === "pending_procurement" && p.estimateM < big.estimateM) || /It still does not fit/.test(t2), "9. fitting the scope either moves it to procurement or says why not (" + p.status + ", " + p.estimateM + "M)");
  check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
  await g.browser.close();
}

srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED");
process.exit(fails ? 1 : 0);
