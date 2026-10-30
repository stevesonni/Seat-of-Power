import { test } from "node:test";
import assert from "node:assert/strict";
import { eligible, estimate, assessFunding, makeProject, tickProject, benefitFactor, addFunding, reduceScope, replaceContractor, equip, staff, abandon, committedM, remainingM, repairCostM, repair } from "../game/systems/projects.js";
import * as SYS from "../game/systems/projects.js";
import { assessLoan, acceptOffer, serviceLoans } from "../game/systems/loans.js";
import { parseProposal } from "../game/systems/proposals.js";
import { planRestructure, applyRestructure, expireTaskForces } from "../game/systems/ministries.js";

const run = (p, from, n, ctx = {}) => { for (let y = from; y < from + n; y++) p = tickProject(p, y, ctx).p; return p; };
const proj = (o = {}) => ({ ...makeProject({ id: "p1", title: "General Hospital", type: "hospital", qty: 100, ministryId: "health", approvedM: 2500, thisYearM: 1250, year: 2, ...o }), status: "in_progress", contractorId: o.contractorId || "medibuild" });

test("a hospital surfaces hospital builders, not road gangs", () => {
  const e = eligible("hospital"); assert.ok(e.some(c => c.id === "medibuild")); assert.ok(!e.some(c => c.id === "greatwall" || c.id === "riverside"));
  assert.ok(eligible("road").some(c => c.id === "greatwall"));
});
test("contractors at capacity are shown as full", () => {
  const busy = [1, 2].map(i => ({ contractorId: "medibuild", status: "in_progress" }));
  assert.ok(eligible("hospital", busy).find(c => c.id === "medibuild").full);
});
test("phasing differs from a shortfall", () => {
  const e = estimate("hospital", 100);
  assert.equal(assessFunding({ needM: 15000, approvedM: 15000, thisYearM: 3000, years: 3 }).kind, "phased");
  const s = assessFunding({ needM: 15000, approvedM: 3000, thisYearM: 3000, years: 3 }); assert.equal(s.kind, "short"); assert.equal(s.shortM, 12000);
  assert.ok(s.options.includes("proceed") && s.options.includes("reduce"));
  assert.equal(e.buildM, 2500); assert.ok(e.equipM > 0 && e.opsPerYearM > 0);
});
test("ignoring a serious shortfall stalls the work with money spent", () => {
  let p = proj({ approvedM: 800, thisYearM: 800 });
  p = run(p, 2, 4);
  assert.equal(p.status, "stalled"); assert.ok(p.spentM > 0 && p.spentM <= 800); assert.ok(remainingM(p) > 0);
});
test("full funding usually finishes; a facility is 'built' until equipped and staffed", () => {
  let p = proj({ approvedM: 3500, thisYearM: 1800 });
  p = run(p, 2, 5);
  assert.ok(["built", "delivered", "stalled"].includes(p.status));
  if (p.status === "built") { assert.ok(benefitFactor(p) < .4); p = staff(equip(p, 7), 7); assert.equal(p.status, "delivered"); assert.ok(benefitFactor(p) > .5); }
});
test("more money does not guarantee quality: the contractor matters", () => {
  const good = run(proj({ approvedM: 6000, thisYearM: 3000 }), 2, 4), bad = run(proj({ approvedM: 6000, thisYearM: 3000, contractorId: "rainbow" }), 2, 4);
  assert.ok((good.quality || 0) > (bad.quality || 0));
  assert.ok(bad.spentM / Math.max(1, bad.builtM) > good.spentM / Math.max(1, good.builtM)); // money that bought nothing
});
test("delivery is seeded: the same year ticks the same way, and only once", () => {
  const a = tickProject(proj(), 2).p, b = tickProject(proj(), 2).p; assert.deepEqual(a, b);
  assert.deepEqual(tickProject(a, 2).p, a);
});
test("accounting holds after revisions: spent + committed = approved; nothing charged twice", () => {
  let p = run(proj({ approvedM: 1200, thisYearM: 600 }), 2, 2);
  const spent = p.spentM;
  p = addFunding(p, 2000, 4); assert.equal(p.spentM, spent); assert.equal(p.spentM + committedM(p), p.approvedM);
  p = reduceScope(p, .6, 4); assert.ok(p.estimateM >= p.builtM);
  p = replaceContractor(p, "kestrel", 4); assert.equal(p.spentM, spent);
  p = run(p, 4, 3); assert.equal(p.spentM + committedM(p), p.approvedM); assert.ok(p.spentM <= p.approvedM);
  const ab = abandon({ ...p, status: "in_progress" }, 8); assert.equal(ab.spentM, p.spentM); assert.match(ab.decisions.at(-1).text, /sunk/);
});
test("repair costs only the defect, not the original project", () => {
  const p = { ...run(proj({ approvedM: 6000, thisYearM: 3000, contractorId: "bastion" }), 2, 4) };
  const c = repairCostM(p); assert.ok(c < p.builtM * .4);
  assert.equal(repair(p, 6).spentM, p.spentM + c);
});
test("loans: applying creates no debt; an offer shows repayments; accepting records it once", () => {
  const ctx = { debtM: 5000, revenueM: 20000, cor: .3, fgRelation: 60, eia: true, revenueIgrM: 8000 };
  const a = assessLoan("dfi", { projectId: "p1", amountM: 2000, year: 2 }, ctx);
  assert.deepEqual(assessLoan("dfi", { projectId: "p1", amountM: 2000, year: 2 }, ctx), a); // same answer after a reload
  let loans = [];
  if (a.ok) {
    assert.ok(a.offer.serviceM > 0 && a.offer.repayM > a.offer.principalM);
    loans = acceptOffer(loans, a.offer, 2); loans = acceptOffer(loans, a.offer, 2); assert.equal(loans.length, 1);
    const s = serviceLoans(loans, 3); assert.ok(s.paidM > 0); assert.ok(s.loans[0].outstandingM < 2000);
    assert.equal(serviceLoans(s.loans, 3).paidM, 0); // serviced once a year
  }
  assert.equal(assessLoan("bond", { projectId: "p1", amountM: 2000, year: 2 }, { ...ctx, revenueIgrM: 1000 }).ok, false);
});
test("custom projects: structured proposals, clarification, and limits", () => {
  const r = parseProposal("Build a 120 bed maternity hospital in Oredo", { lgas: ["Oredo", "Egor"] });
  assert.equal(r.status, "ok"); assert.equal(r.proposal.type, "hospital"); assert.equal(r.proposal.qty, 120); assert.equal(r.proposal.lga, "Oredo");
  assert.ok(r.proposal.estimateM > 0 && r.proposal.opsPerYearM > 0 && r.proposal.benefit.length > 10);
  assert.equal(parseProposal("make things better").status, "clarify");
  assert.equal(parseProposal("a navy base for the state").status, "unsupported");
  const road = parseProposal("dualise 12km of the Benin–Auchi road"); assert.equal(road.proposal.type, "road"); assert.equal(road.proposal.qty, 12);
  assert.ok(parseProposal("build a school").proposal.assumptions.length >= 1);
});
test("restructuring moves work explicitly and does not double budgets", () => {
  const ministries = [{ id: "works", name: "Works", key: "infra", minister: "A", staff: 400, budget: 2, perf: 60 }, { id: "lg", name: "LG", key: null, minister: "B", staff: 200, budget: 1, perf: 50 }];
  const projects = [{ id: "p", title: "Road", ministryId: "works" }], cases = [{ id: "c", what: "x", ministryId: "lg", stage: "meeting", officer: "B" }], commits = [{ id: "k", ministryId: "lg", who: "B", action: "do it", status: "open", notes: [] }];
  const plan = planRestructure("merge", { ministries, a: "works", b: "lg" }); assert.ok(plan.ok);
  const r = applyRestructure(plan, { ministries, projects, cases, commits }, 3, { merged: "wl" });
  assert.equal(r.ministries.length, 1); assert.equal(r.ministries[0].budget, 3); assert.equal(r.ministries[0].staff, 600);
  assert.equal(r.projects[0].ministryId, "wl"); assert.equal(r.cases[0].ministryId, "wl"); assert.equal(r.cases[0].officer, "B");
  assert.equal(r.commits[0].who, "A"); assert.ok(r.moved.length >= 3); assert.ok(r.ministries[0].perf < 60);
  const tf = applyRestructure(planRestructure("taskforce", { ministries, a: "works", name: "Flood" }), { ministries }, 3, { taskforce: "tf" });
  assert.equal(expireTaskForces(tf.ministries, 5).ended.length, 1);
  assert.equal(planRestructure("reassign", { ministries, a: "lg", b: "works" }).ok, false); // LG has no area to move
});

import { nextStep, milestoneOf, migrateOldProject, MILESTONES, fitScope } from "../game/systems/projects.js";
import { LENDERS } from "../game/systems/loans.js";
test("every state has a next step: an action, a named blocker, or 'nothing due yet' with when", () => {
  const base = { ...makeProject({ id: "n1", title: "Benin road", type: "road", qty: 10, ministryId: "works", approvedM: 9000, thisYearM: 4500, year: 2 }) };
  for (const st of ["pending_finance", "pending_procurement", "in_progress", "stalled", "built", "delivered", "suspended", "abandoned"]) {
    const n = nextStep({ ...base, status: st, facility: st === "built", equipped: false });
    assert.ok(n.say && n.say.length > 10, st); if (n.due) assert.ok(n.button, st + " has a button");
    if (!n.due && st === "in_progress") assert.ok(n.when);
  }
  assert.match(nextStep({ ...base, status: "pending_procurement" }).button, /^Review road procurement$/);
  assert.match(nextStep({ ...base, status: "pending_procurement" }).say, /approved.*procurement/);
});
test("blocked steps say what blocks them", () => {
  const base = { ...makeProject({ id: "n2", title: "Clinic", type: "hospital", qty: 50, ministryId: "health", approvedM: 1000, thisYearM: 500, year: 2 }) };
  const busy = ["medibuild", "medibuild", "kestrel", "kestrel", "kestrel", "cranfield", "cranfield", "cranfield", ...Array(5).fill("bastion"), ...Array(9).fill("rainbow"), ...Array(9).fill("muhammad")].map(id => ({ contractorId: id, status: "in_progress" }));
  const b = nextStep({ ...base, status: "pending_procurement" }, { projects: busy }); assert.ok(b.blocked); assert.match(b.say, /busy/);
  const f = nextStep({ ...base, status: "pending_finance" }, { tried: ["bank", "bond", "dfi", "pre"], lenders: { bank: 1, bond: 1, dfi: 1, pre: 1 } }); assert.ok(f.blocked);
});
test("milestones never run ahead of the simulation", () => {
  assert.equal(MILESTONES[milestoneOf({ status: "pending_procurement" })][0], "financed");
  assert.equal(MILESTONES[milestoneOf({ status: "pending_finance" })][0], "approved");
  assert.equal(MILESTONES[milestoneOf({ status: "in_progress" })][0], "building");
});
test("projects stuck in old saves are converted to an actionable step, with nothing charged again", () => {
  const stuck = { id: "old1", title: "500km Road Network", type: "road", baseCost: 8, status: "pending_procurement", progress: 0, fin: { id: "cash" } };
  const m = migrateOldProject(stuck, 3);
  assert.equal(m.status, "pending_procurement"); assert.equal(m.estimateM, 8000); assert.equal(m.spentM, 0); assert.equal(nextStep(m).id, "contractor");
  const noFin = migrateOldProject({ ...stuck, fin: undefined }, 3); assert.equal(nextStep(noFin).id, "finance");
  const running = migrateOldProject({ id: "o2", title: "Bridge", type: "bridge", cost: 4, status: "in_progress", progress: 40, contractor: "Kestrel Construction Nig. PLC" }, 3);
  assert.equal(running.builtM, 1600); assert.equal(running.contractorId, "kestrel"); assert.equal(migrateOldProject(running, 4), running);
});

test("when every lender says no, fitting the scope leads to procurement, never back to the blocker", () => {
  const p = { ...makeProject({ id: "fz", title: "Big road", type: "road", qty: 100, lga: "X", approvedM: 0, thisYearM: 0, year: 1 }), status: "pending_finance" };
  const all = Object.keys(LENDERS);
  assert.equal(nextStep(p, { tried: all, lenders: LENDERS }).id, "blocked_finance");
  const r = fitScope({ ...p, approvedM: p.estimateM }, p.estimateM / p.years / 2, 1);
  assert.ok(r.ok); assert.equal(r.p.status, "pending_procurement"); assert.ok(r.p.estimateM < p.estimateM);
  assert.equal(nextStep(r.p, { tried: all, lenders: LENDERS, projects: [] }).id, "contractor");
  const no = fitScope(p, 1, 1); assert.equal(no.ok, false); assert.match(no.why, /Defer it/);
});
// Projects that need their own commissioner: esports and tourist sites read from plain words.
import { parseProposal as parseP2 } from "../game/systems/proposals.js";
import { TYPE_SECTOR as TS2, UNIT as U2 } from "../game/systems/projects.js";
test("an esports arena and a tourist attraction are projects the state can build", () => {
  assert.equal(parseP2("an esports arena in Ikeja", { lgas: ["Ikeja"] }).proposal.type, "esports");
  assert.equal(parseP2("a beach resort", {}).proposal.type, "tourist");
  assert.equal(parseP2("a 20,000 seat stadium", {}).proposal.type, "stadium");
  ["esports", "tourist"].forEach(k => { assert.ok(U2[k]); assert.ok(TS2[k]); });
});

// A player with ₦3B in the bank could not restart a stalled project: "Fix the funding"
// offered no fix when the money was approved but the bank had been empty, and
// cutting the scope never restarted anything. Every stall now names its cause and its fix.
test("a stalled project says why, and its fix restarts it", () => {
  const mk = SYS.makeProject({ id: "p1", title: "Ring Road", type: "road", qty: 20, lga: "Ikeja", ministryId: "works", approvedM: 10000, thisYearM: 5000, year: 1 });
  const base = { ...mk, approvedM: Math.ceil(mk.estimateM * 1.2), status: "in_progress", contractorId: "kestrel", startTurn: 1, startYear: 1, years: 2 }; // fully funded: the money is approved
  // The bank had nothing at the year's end: the money is approved, nothing was paid.
  const T = SYS.tickProject(base, 1, { cashM: 0 }); const P = T.p;
  assert.equal(P.status, "stalled"); assert.match(T.events.join(" "), /the bank could not pay this year's share/);
  assert.equal(SYS.stallCause(P), "cash");
  const N = SYS.nextStep(P); assert.equal(N.id, "restart"); assert.match(N.say, /money is approved, but the bank could not pay/); assert.doesNotMatch(N.say, /approved money is spent/);
  // Restart: the share is released, and with ₦3B in the bank the work goes on next year.
  const R = SYS.restartWork(P, 2); assert.equal(R.p.status, "in_progress"); assert.ok(R.shareM > 0);
  const T2 = SYS.tickProject(R.p, 2, { cashM: 3000 }); assert.ok(T2.p.builtM > P.builtM, "work is done once the bank pays"); assert.notEqual(T2.p.status, "stalled");
  // The approved money ran out: add it, or cut the scope to fit, and either restarts it.
  const spent = { ...P, approvedM: 3000, spentM: 3000, builtM: 3000, alloc: {} };
  assert.equal(SYS.stallCause(spent), "money"); assert.equal(SYS.nextStep(spent).id, "stall_fund");
  assert.equal(SYS.addFunding(spent, SYS.toFinishM(spent), 2).status, "in_progress", "adding the money restarts it");
  const leaky = { ...P, approvedM: Math.round(P.estimateM * .6), spentM: Math.round(P.estimateM * .55), builtM: Math.round(P.estimateM * .45), alloc: {} }; // money lost along the way
  assert.equal(SYS.stallCause(leaky), "money");
  assert.equal(SYS.reduceScope(leaky, leaky.approvedM / leaky.estimateM, 2).status, "stalled", "cutting to the approved total is not enough when money was lost");
  const fit = SYS.reduceScope(leaky, SYS.scopeThatFits(leaky), 2);
  assert.equal(fit.status, "in_progress", "cutting the scope to what the unspent money can finish restarts it"); assert.equal(SYS.toFinishM(fit), 0);
  // The contractor fled: only a new contractor restarts it, and money alone does not.
  const fled = { ...P, fled: true };
  assert.equal(SYS.stallCause(fled), "fled"); assert.equal(SYS.nextStep(fled).id, "replace");
  assert.equal(SYS.addFunding(fled, 500, 2).status, "stalled"); assert.equal(SYS.reduceScope(fled, .5, 2).status, "stalled");
  assert.equal(SYS.replaceContractor(fled, "kestrel", 2).status, "in_progress");
  // An older save: the record says the contractor fled.
  const old = { ...P, fled: undefined, decisions: [...P.decisions, { year: 1, text: "The contractor took the mobilisation fee (₦1.5B) and fled to Dubai." }] };
  assert.equal(SYS.stallCause(old), "fled");
  assert.equal(SYS.stallCause({ ...old, decisions: [...old.decisions, { year: 2, text: "Replaced the contractor; handover adds ₦0.2B." }] }), "cash");
});
