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
const stamp = (g) => g.page.evaluate(() => document.querySelector(".sp-stamp")?.textContent || null);
// Into the policy step of Year 1, with nothing in front of the programmes.
const toPolicies = async (g) => {
  await g.click(/^Continue/); await g.wait(1800);
  await playUntil(g, t => /Done: end the year/.test(t), { max: 40, prefer: [/^Tell the communities first/] });
  await g.click(/^Decide later this year$/); await g.wait(300);
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
const toTab = async (g, tab) => { await g.page.evaluate((t) => window.postMessage({ type: "sop-nav", payload: t }, "*"), tab); await g.wait(600); };

// ── 1–6: one new project, start to finish, then reload ──
{
  const g = await open(port, { save: YEAR1 });
  await toPolicies(g);
  await g.page.getByText(ROAD, { exact: true }).first().click(); await g.wait(600);
  await g.click(/^Next: the budget/); await g.wait(300);
  await g.click(/^Seek financing/);
  check(!!(await g.click(/^Approve the project$/)), "1. approve the road programme");
  await g.wait(250);
  check(/^Approved/.test(await stamp(g) || ""), "1. the APPROVED stamp lands after the approval is recorded");
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
  const st2 = await stamp(g); await g.wait(900);
  p = await proj(g, ROAD);
  check(p.status === "pending_procurement" && p.loanLeftM > 0 && /^Funded/.test(st2 || ""), "5. money recorded, then the FUNDED stamp (" + p.loanLeftM + "M in hand)");
  await g.wait(800);
  b = await bubbles(g);
  check(b.some(x => /next step is to review its procurement/.test(x)), "5. the adviser moves on to procurement");
  check(!!(await g.click(/^Review road procurement$/)), "2. 'Review road procurement' opens procurement");
  await g.wait(400);
  check(/Award the contract/.test(await g.txt()), "3. bidders shown for this project");
  await g.click(/^Award contract$/); await g.wait(250);
  const st3 = await stamp(g); await g.wait(900);
  p = await proj(g, ROAD);
  check(p.status === "in_progress" && !!p.contractorId && /^Contract signed/.test(st3 || ""), "4. contract awarded and recorded (" + p.contractorId + ")");
  await g.wait(800);
  b = await bubbles(g);
  check(b.some(x => /under construction.*Nothing is due until year end/.test(x)), "5. the adviser says nothing is due until year end");
  await g.click(/^Back to the desk$/); await g.wait(300); await g.click(/^Govern$/); await g.wait(400);
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
  await playUntil(g, t => /Review road procurement/.test(t), { max: 40, prefer: [/^Tell the communities first/, /^Decide later this year$/] });
  check(!!(await g.click(/^Review road procurement$/)), "8. the adviser offers 'Review road procurement' for the old project");
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
  check(!!(await g.click(/^Revise the scope$/)), "9. its button opens the project");
  await g.wait(400);
  const t = await g.txt();
  check(/Blocked/.test(t) && /Fit the scope to the budget/.test(t) && /Defer indefinitely/.test(t), "9. the dossier says Blocked and offers the two real ways out");
  await g.click(/^Fit the scope to the budget$/); await g.wait(1200);
  const p = await proj(g, "Ring Road");
  const t2 = await g.txt();
  check((p.status === "pending_procurement" && p.estimateM < big.estimateM) || /It still does not fit/.test(t2), "9. fitting the scope either moves it to procurement or says why not (" + p.status + ", " + p.estimateM + "M)");
  check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
  await g.browser.close();
}

srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED");
process.exit(fails ? 1 : 0);
