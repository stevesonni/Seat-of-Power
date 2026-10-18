/* Restructuring government: merge, split, move a policy area, or set up a
   temporary task force. Every change has a mandate, a set-up cost, a
   recurring cost (or saving), a budget source, a leader and a transition
   period, and it moves the work explicitly: projects, contracts, open
   cases, commitments and staff go to the new home and are listed. Nothing
   is counted twice, and a new body does not fix its problem on day one.
   These are game rules, not a statement of Nigerian administrative law. */
import { fmtM } from "./money.js";

export const AREA_NAME = { infra: "Works and infrastructure", hp: "Health", lit: "Education", agr: "Agriculture", sec: "Security", igr: "Revenue and the economy", app: "Public information" };

export const RESTRUCTURE = {
  merge: { nm: "Merge two ministries", setupM: 300, yearlyM: -250, transition: 1, perfHit: 8, pStab: -2,
    why: "One commissioner, one budget, one permanent secretary: cheaper, but the merged ministry is slower for a year while the two civil services become one, and a commissioner loses their seat." },
  split: { nm: "Split off a new ministry", setupM: 1500, yearlyM: 400, transition: 1, perfHit: 6, pStab: 1,
    why: "A dedicated ministry with its own commissioner and budget line. It takes a year to staff and settle; the old ministry loses the area and the money that went with it." },
  reassign: { nm: "Move a policy area", setupM: 100, yearlyM: 0, transition: 1, perfHit: 4, pStab: 0,
    why: "The area, its projects and its open files move to a ministry you trust more. Little cost, but the receiving ministry needs a year to learn the work." },
  taskforce: { nm: "Set up a temporary task force", setupM: 200, yearlyM: 150, transition: 0, perfHit: 0, pStab: 0, years: 2,
    why: "A small unit reporting to you for two years on one problem. Quick and focused; when it ends, the work returns to the ministry." },
};

// What a change will do, before you confirm it.
export const planRestructure = (kind, { ministries, a, b, area, name, lead }) => {
  const R = RESTRUCTURE[kind]; if (!R) return { ok: false, reason: "Unknown change." };
  const A = ministries.find(m => m.id === a), B = b && ministries.find(m => m.id === b);
  if (!A) return { ok: false, reason: "Pick a ministry." };
  if (kind === "merge" && (!B || B.id === A.id)) return { ok: false, reason: "Pick two different ministries." };
  if ((kind === "split" || kind === "taskforce") && !(name || "").trim()) return { ok: false, reason: "Give it a name." };
  if (kind === "reassign" && (!B || B.id === A.id || !A.key)) return { ok: false, reason: A.key ? "Pick where the area goes." : A.name + " has no policy area to move." };
  const mandate = kind === "merge" ? "Ministry of " + A.name + " and " + B.name + ": everything both did."
    : kind === "split" ? "Ministry of " + name.trim() + ": " + (AREA_NAME[area || A.key] || "a share of " + A.name + "'s work") + ", taken from " + A.name + "."
    : kind === "reassign" ? (AREA_NAME[A.key] || "The policy area") + " moves from " + A.name + " to " + B.name + "."
    : name.trim() + " task force: one problem in " + A.name + "'s area, for two years, reporting to the governor.";
  return { ok: true, kind, nm: R.nm, mandate, setupM: R.setupM, yearlyM: R.yearlyM, transition: R.transition, why: R.why,
    budgetSource: R.yearlyM > 0 ? "The Administration line of the budget (" + fmtM(R.yearlyM) + " a year)" : R.yearlyM < 0 ? "Saves " + fmtM(-R.yearlyM) + " a year on overheads" : "No new budget line",
    lead: kind === "merge" ? (lead === b ? B.minister : A.minister) : kind === "reassign" ? B.minister : lead || null, a: A.id, b: B ? B.id : null, area: area || A.key, name: name ? name.trim() : null };
};

/* Apply it. Returns the new lists and a plain list of what moved. */
export const applyRestructure = (plan, { ministries, projects = [], cases = [], commits = [] }, year, ids = {}) => {
  const A = ministries.find(m => m.id === plan.a), B = plan.b && ministries.find(m => m.id === plan.b);
  const moved = [], R = RESTRUCTURE[plan.kind];
  const repoint = (from, to, toHead, toName) => {
    const pj = projects.map(p => p.ministryId === from ? (moved.push("Project: " + p.title), { ...p, ministryId: to }) : p);
    const cs = cases.map(c => c.ministryId === from && c.stage !== "closed" ? (moved.push("Open file: " + c.what), { ...c, ministryId: to, ministryName: toName }) : c); // the accused stays the accused
    const cm = commits.map(x => x.ministryId === from && x.status === "open" ? (moved.push("Commitment: " + x.action), { ...x, ministryId: to, who: x.personal ? x.who : toHead, notes: [...x.notes, "Year " + year + ": moved to " + toName + "."] }) : x);
    return { pj, cs, cm };
  };
  let ms = ministries, pj = projects, cs = cases, cm = commits;
  if (plan.kind === "merge") {
    const keep = plan.lead === B.minister ? B : A, other = keep === A ? B : A;
    const id = ids.merged || (A.id + "_" + B.id), name = A.name + " & " + B.name;
    const merged = { ...keep, id, name, staff: (A.staff || 0) + (B.staff || 0), budget: (A.budget || 0) + (B.budget || 0), key: A.key || B.key, unlock: [...new Set([...(A.unlock || []), ...(B.unlock || [])])],
      perf: Math.max(15, Math.round(((A.perf || 50) + (B.perf || 50)) / 2) - R.perfHit), transitionUntil: year + R.transition, mandate: plan.mandate, record: [], flag: null };
    ms = [...ministries.filter(m => m.id !== A.id && m.id !== B.id), merged];
    [A, B].forEach(M => { const r = repoint(M.id, id, merged.minister, name); pj = r.pj; cs = r.cs; cm = r.cm; projects = pj; cases = cs; commits = cm; });
    moved.push("Staff: " + ((A.staff || 0) + (B.staff || 0)).toLocaleString() + " civil servants into one ministry", "Hon. " + other.minister + " leaves the cabinet");
  } else if (plan.kind === "split") {
    const id = ids.split || ("m_" + plan.name.toLowerCase().replace(/[^a-z]+/g, "_").slice(0, 20));
    const staffMoved = Math.round((A.staff || 0) * .3);
    const nm = { id, name: plan.name, icon: "🏢", key: plan.area === A.key ? A.key : null, unlock: [], staff: staffMoved, budget: Math.round((A.budget || 0) * .3 * 10) / 10,
      perf: 40, cor: 20, loyalty: 60, minister: plan.lead || "Acting Permanent Secretary", acting: !plan.lead, permSec: A.permSec, transitionUntil: year + R.transition, mandate: plan.mandate, hired: year, record: [] };
    ms = ministries.map(m => m.id === A.id ? { ...m, key: plan.area === A.key ? null : m.key, staff: (m.staff || 0) - staffMoved, budget: Math.round(((m.budget || 0) * .7) * 10) / 10 } : m).concat([nm]);
    if (plan.area === A.key) { const r = repoint(A.id, id, nm.minister, plan.name); pj = r.pj; cs = r.cs; cm = r.cm; }
    moved.push("Staff: " + staffMoved.toLocaleString() + " civil servants", "Budget: 30% of " + A.name + "'s line");
  } else if (plan.kind === "reassign") {
    ms = ministries.map(m => m.id === A.id ? { ...m, key: null } : m.id === B.id ? { ...m, key: A.key, perf: Math.max(15, (m.perf || 50) - R.perfHit), transitionUntil: year + R.transition } : m);
    const r = repoint(A.id, B.id, B.minister, B.name); pj = r.pj; cs = r.cs; cm = r.cm;
  } else if (plan.kind === "taskforce") {
    const id = ids.taskforce || ("tf_" + plan.name.toLowerCase().replace(/[^a-z]+/g, "_").slice(0, 20));
    ms = ministries.concat([{ id, name: plan.name + " Task Force", icon: "🎯", key: null, unlock: [], staff: 25, budget: 0, perf: 60, cor: 15, loyalty: 70, minister: plan.lead || A.minister, taskForce: { parent: A.id, until: year + R.years }, mandate: plan.mandate, hired: year, record: [] }]);
    moved.push("Nothing moves: the ministry keeps its work; the task force reports to you until Year " + (year + R.years));
  }
  return { ministries: ms, projects: pj, cases: cs, commits: cm, moved, setupM: plan.setupM, yearlyM: plan.yearlyM, pStab: R.pStab };
};

// Task forces end on time; their head goes back, the parent keeps the work.
export const expireTaskForces = (ministries, year) => {
  const ended = ministries.filter(m => m.taskForce && m.taskForce.until <= year);
  return { ministries: ministries.filter(m => !(m.taskForce && m.taskForce.until <= year)), ended };
};
