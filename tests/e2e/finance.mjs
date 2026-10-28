/* Project loans in tranches, in a browser. A road financed by a bank loan:
   the year's end brings the bank's payment order for tranche 2; signing draws
   it (debt rises by exactly that, the money reaches the site); not signing
   charges the penalty and leaves the site idle that year; insecurity around the
   site (a warned lender) suspends the tranche, and the state can pay its share
   from the bank instead. Run: npm run build:game, then node tests/e2e/finance.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
import * as SYS from "../../game/systems/index.js";

const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const okay = async (g) => { for (let i = 0; i < 4 && await g.click(/^(Got it|Okay|Continue|Later)( →)?$/); i++) await g.wait(300); };
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button, .opt")].find(x => x.offsetParent && new RegExp(src).test(x.textContent.trim())); if (!b) return false; b.click(); return true; }, re.source);
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const toTray = async (g) => {
  await g.click(/^Continue/); await g.wait(1800);
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde Okafor-Ilesanmi/.test(x.textContent)); if (b) b.click(); }); await g.wait(500); await okay(g);
  const { playUntil } = await import("./lib.mjs");
  const r = await playUntil(g, tx => /Done: end the year/.test(tx), { max: 80 });
  await g.wait(400); await okay(g); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g);
  await g.click(/^Done: end the year/); await g.wait(1500); await okay(g);
  if (await g.click(/^Open the Treasury$/)) { await g.wait(800); await g.click(/^Spread it over 4 years/); await g.wait(400); await okay(g); await g.click(/^Desk\d*$/); await g.wait(400); await g.click(/^Today$/); await g.wait(400); await g.click(/^Done: end the year/); await g.wait(1500); await okay(g); }
  await g.click(/^(CONTINUE|Continue)$/); await g.wait(3500); await okay(g);
  return r.ok;
};
const openLetter = async (g, re) => { for (let i = 0; i < 6; i++) { const ok = await g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && new RegExp(src).test(x.textContent)); if (!b) return false; b.click(); return true; }, re.source); if (ok) return true; await okay(g); await g.wait(700); } return false; };
// The pictures on screen now (Pack 28: each lender's seal, the enclosed paper, the scene).
const pics = (g) => g.page.evaluate(() => [...document.querySelectorAll("img")].filter(x => x.offsetParent).map(x => x.getAttribute("src")).join(" "));
const SHOT = process.env.SHOTS;
const save = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));

// A road under way in year 2, financed by a 3-tranche bank loan (tranche 1 drawn and spent).
const withLoan = (mut = {}) => { const sv = JSON.parse(Y1.sop_save);
  const P = { ...SYS.makeProject({ id: "p_road", title: "Abeokuta Ring Road", type: "road", qty: 20, lga: "Abeokuta North", ministryId: "works", approvedM: 18000, thisYearM: 9000, year: 1 }),
    status: "in_progress", contractorId: "kestrel", contractor: "Kestrel Construction", startTurn: 1, loanKey: "loan:p_road:bank", loanLeftM: 0 };
  const L = SYS.scheduleLoan({ key: "loan:p_road:bank", lenderId: "bank", lender: "A syndicate of three commercial banks", nm: "Commercial bank loan", principalM: 9000, rate: .22, years: 4, serviceM: 2700, repayM: 10800 }, "p_road", 1);
  sv.turn = 2; sv.projTicked = 2; sv.projects = [P]; sv.loans = [{ ...L, ...(mut.loan || {}) }]; sv.stc = { ...sv.stc, lastTurn: 1 };
  if (mut.sec != null) sv.s = { ...sv.s, sec: mut.sec };
  return { ...Y1, sop_save: JSON.stringify(sv) }; };

// ── 1. Sign tranche 2 ──
{ const g = await open(srv.port, { save: withLoan() });
  check(await toTray(g), "the Governor reaches the end of year 2");
  const before = await save(g);
  check(await openLetter(g, /Tranche 2 of 3: Abeokuta Ring Road/), "the bank's letter: tranche 2 of 3");
  await g.wait(600); { const p = await pics(g); check(/seal-bank\.webp/.test(p) && /objects\/payment-order\.webp/.test(p), "the letter carries the bank's wax seal and the enclosed payment order"); if (SHOT) await g.page.screenshot({ path: SHOT + "/fin-letter.png" }); }
  await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(900);
  { const p = await pics(g); check(/scenes\/tranche-signing\.webp/.test(p) && /characters\/bank-relationship-manager\.webp/.test(p), "the decision shows the signing scene and the bank's relationship manager"); if (SHOT) await g.page.screenshot({ path: SHOT + "/fin-card.png" }); }
  const t = await g.txt();
  check(/payment order/.test(t) && /Sign the payment order: ₦3(\.0)?B/.test(t) && /Don't sign this year/.test(t), "sign it, or don't (with the penalty shown)");
  await tap(g, /^Sign the payment order/); await g.wait(1500); await okay(g);
  const sv = await save(g), L = sv.loans[0], P = sv.projects.find(p => p.id === "p_road");
  check(L.drawn === 2 && L.drawnM === 6000 && L.outstandingM === 6000, "the loan shows two tranches drawn (₦6B owed)");
  check(Math.abs((sv.s.debt - before.s.debt) - 3) < .05, "debt rose by exactly the tranche (" + (sv.s.debt - before.s.debt).toFixed(2) + "B)");
  check(P.loanLeftM === 3000, "the money reached the site");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 2. Don't sign: the penalty, and an idle site ──
{ const g = await open(srv.port, { save: withLoan() });
  check(await toTray(g), "the Governor reaches the end of year 2 again");
  const before = await save(g);
  await openLetter(g, /Tranche 2 of 3: Abeokuta Ring Road/); await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(900);
  await tap(g, /^Don't sign this year/); await g.wait(1500); await okay(g);
  let sv = await save(g); const P = sv.projects.find(p => p.id === "p_road");
  check(sv.loans[0].drawn === 1 && sv.loans[0].penaltiesM > 0, "nothing drawn; the penalty is recorded (" + sv.loans[0].penaltiesM + "M)");
  check(P.holdYear === 2, "the site is held for the year");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 2b. The next year opens: the unsigned site built nothing, and says why ──
{ const sv0 = JSON.parse(withLoan().sop_save); sv0.turn = 3; sv0.stc = { ...sv0.stc, lastTurn: 2 }; sv0.projects = sv0.projects.map(p => ({ ...p, holdYear: 2, loanLeftM: 3000 }));
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv0) } });
  await g.click(/^Continue/); await g.wait(2500);
  const sv = await save(g), P = sv.projects.find(p => p.id === "p_road");
  check((P.events || []).some(e => /did not sign the lender's tranche/.test(e)) && (P.builtM || 0) === 0 && P.loanLeftM === 3000 && P.status === "in_progress", "the next year: nothing was built, the money is untouched, and the project says why");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 3. Insecurity: a warned lender suspends; the state pays its share itself ──
{ const g = await open(srv.port, { save: withLoan({ loan: { warned: 1 }, sec: .2 }) });
  check(await toTray(g), "the Governor reaches the end of year 2 with insecurity around the site");
  const before = await save(g);
  check(await openLetter(g, /Tranche 2 suspended: Abeokuta Ring Road/), "the bank suspends tranche 2");
  await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(900);
  check(/insecurity around the site/.test(await g.txt()), "it says why: insecurity around the site");
  check(/scenes\/lender-suspends\.webp/.test(await pics(g)), "the suspension shows the boardroom scene");
  await tap(g, /^Pay this year's share from the bank instead/); await g.wait(1500); await okay(g);
  const sv = await save(g), P = sv.projects.find(p => p.id === "p_road");
  check(sv.loans[0].suspended && sv.loans[0].drawn === 1, "the loan stays suspended, nothing drawn from it");
  check(P.loanLeftM === 3000, "the state's own ₦3B reached the site");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }
// ── 4. Contractor pre-financing: the bill at handover; refusing ends in a court order to pay ──
{ const sv0 = JSON.parse(withLoan().sop_save);
  const L = SYS.scheduleLoan({ key: "loan:p_road:pre", lenderId: "pre", lender: "The contractor", nm: "Contractor pre-financing", principalM: 9000, rate: .3, years: 3, serviceM: 1, repayM: 1 }, "p_road", 1);
  sv0.loans = [L]; sv0.projects = sv0.projects.map(p => ({ ...p, loanKey: L.key, status: "delivered", builtM: p.estimateM, progress: 100 }));
  const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv0) } });
  check(await toTray(g), "the Governor reaches the end of year 2 with the road handed over");
  check(await openLetter(g, /The bill for Abeokuta Ring Road/), "the contractor's bill arrives at handover");
  await g.wait(600); { const p = await pics(g); check(/seal-contractor\.webp/.test(p) && /objects\/contractor-bill\.webp/.test(p), "the bill carries the contractor's seal and the invoice"); }
  await g.wait(400); await tap(g, /^✍️ Handle it personally$/); await g.wait(900);
  const before = await save(g), owe = Math.round(L.billM * 1.05) / 1000;
  await tap(g, /^Refuse to pay/); await g.wait(1800);
  { const p = await pics(g); check(/objects\/court-payment-order\.webp/.test(p), "the court's payment order is shown"); if (SHOT) await g.page.screenshot({ path: SHOT + "/fin-court.png" }); }
  await okay(g);
  const sv = await save(g), paid = ((before.s.debt || 0) - (before.s.cash || 0)) - ((sv.s.debt || 0) - (sv.s.cash || 0));
  check(sv.loans[0].billed === "court", "the court case is recorded");
  check(Math.abs(-paid - owe) < .2, "the court's order was paid: ₦" + (-paid).toFixed(1) + "B (bill and costs ₦" + owe.toFixed(1) + "B)");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }
srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
