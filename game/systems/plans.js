/* A recovery plan you can implement (owner, 22 Nov 2026: "if they're asked to go and come back with a plan, they should
   actually bring up a plan which I can implement, not just click and click, but an actual plan that if implemented
   will be reflected. Both commissioners and ministers").
   When a minister is told "no money: bring a recovery plan", they come back the next year with one: concrete steps,
   each with its cost and what it changes, built from their sector and the stalled projects their ministry runs. You
   approve all of it, only the first step, or send it back. What you approve happens: the money is spent, the stalled
   projects restart, and the sector moves the following year. A crooked minister's plan is padded, and part of the
   money does not arrive. */
import { seeded } from "./rng.js";

export const planSector = (id = "", name = "") => { const t = (id + " " + name).toLowerCase();
  return /works|transport|power|water|housing|fct|infra|lands/.test(t) ? "infrastructure" : /health/.test(t) ? "health" : /educ/.test(t) ? "education"
    : /agric|food/.test(t) ? "agriculture" : /just|attorney|judic/.test(t) ? "justice" : /sec|police|defence|interior/.test(t) ? "security" : "administration"; };

// Each sector's steps. c: ₦B for a governor (the President's are ten times larger, scale 10). fx: what it changes.
export const PLAN_STEPS = {
  infrastructure: [
    { id: "retender", l: "Re-tender the failing contracts to firms with a record", c: .3, fx: { infra: .02 }, does: "Contractors who abandoned sites lose them; the new ones are paid by progress." },
    { id: "engineers", l: "Put a site engineer on every project, with weekly photos", c: .2, fx: { infra: .01, app: 1 }, does: "No more payments for work nobody checked." },
    { id: "arrears", l: "Pay the certified arrears so the crews come back", c: .4, fx: { infra: .02 }, does: "Work resumes on sites that stopped for want of money." },
  ],
  health: [
    { id: "nurses", l: "Recruit 300 nurses and midwives for the empty clinics", c: .35, fx: { hp: .02, app: 1 }, does: "Clinics that had buildings but no staff open their doors." },
    { id: "drugs", l: "A drug revolving fund for every general hospital", c: .25, fx: { hp: .02 }, does: "Pharmacies stop running out by mid-month." },
    { id: "power", l: "Solar for the theatres and the vaccine fridges", c: .3, fx: { hp: .01, infra: .01 }, does: "No more surgery by torchlight; the vaccines stay cold." },
  ],
  education: [
    { id: "teachers", l: "Recruit 500 teachers for the rural schools", c: .35, fx: { lit: .02, app: 1 }, does: "Classes with no teacher get one." },
    { id: "repairs", l: "Fix the roofs and toilets in the worst 60 schools", c: .3, fx: { lit: .01, infra: .01 }, does: "Pupils stop being sent home when it rains." },
    { id: "books", l: "Textbooks for every pupil in the core subjects", c: .2, fx: { lit: .02 }, does: "One book per pupil, not one per class." },
  ],
  agriculture: [
    { id: "inputs", l: "Seeds and fertiliser on time, before the rains", c: .3, fx: { agr: .03 }, does: "Farmers plant on time for once." },
    { id: "extension", l: "200 extension workers in the farming LGAs", c: .2, fx: { agr: .02, app: 1 }, does: "Farmers get advice in the field, not at the ministry." },
    { id: "storage", l: "Storage and dryers so harvests do not rot", c: .35, fx: { agr: .02 }, does: "Less of the harvest is lost after it is grown." },
  ],
  security: [
    { id: "vehicles", l: "Fuel, repair and radios for the patrol vehicles we have", c: .25, fx: { sec: .02 }, does: "Patrols that were parked go back on the road." },
    { id: "guards", l: "Pay the community guards on time", c: .2, fx: { sec: .02, app: 1 }, does: "Unpaid guards stop deserting." },
    { id: "hotspots", l: "A joint task force on the three worst highways", c: .35, fx: { sec: .03 }, does: "The kidnapping corridors get round-the-clock patrols." },
  ],
  justice: [
    { id: "backlog", l: "Clear the court backlog: night sittings and more magistrates", c: .25, fx: { cor: -.01, app: 1 }, does: "Cases that waited years are heard." },
    { id: "legalaid", l: "Free lawyers for people held without trial", c: .15, fx: { app: 1 }, does: "Detainees who were forgotten get their day in court." },
    { id: "registry", l: "Put the court registries online", c: .2, fx: { cor: -.02 }, does: "Files stop going missing for a fee." },
  ],
  administration: [
    { id: "digitise", l: "Put the ministry's payments and files online", c: .25, fx: { cor: -.02 }, does: "Every payment leaves a trail." },
    { id: "audit", l: "An audit of last year's spending, published", c: .15, fx: { cor: -.02, app: 1 }, does: "Waste is found and named." },
    { id: "staff", l: "Retrain the staff and retire the ghost names", c: .2, fx: { cor: -.01 }, does: "Fewer people paid for nothing." },
  ],
};

/* The plan a minister brings. m: { id, name, minister, perf, cor }. ctx: { stalled: [{ id, title, shortM }], nat, turn }. */
export const recoveryPlan = (m, ctx = {}) => {
  const sector = planSector(m.id, m.name), scale = ctx.nat ? 10 : 1, r = seeded("plan", m.id, ctx.turn || 0);
  const pad = Math.max(0, ((m.cor || 0) - 40) / 100); // a crooked minister pads the plan
  const steps = PLAN_STEPS[sector].map(s => ({ ...s, c: Math.round(s.c * scale * (1 + pad) * 100) / 100 }));
  (ctx.stalled || []).slice(0, 2).forEach(p => steps.unshift({ id: "restart_" + p.id, pid: p.id, l: "Restart " + p.title + ": pay the " + fmtB(p.shortM / 1000) + " it still needs", c: Math.round(p.shortM / 1000 * (1 + pad) * 100) / 100, fx: { infra: .01, app: 1 }, does: "The site reopens and the contractor goes back to work.", restart: true, shortM: p.shortM }));
  const total = Math.round(steps.reduce((a, s) => a + s.c, 0) * 100) / 100;
  const padB = pad > 0 ? Math.round((total - total / (1 + pad)) * 100) / 100 : 0;
  // Whether it works: a capable, honest minister delivers it; a weak or crooked one delivers part of it.
  const delivery = Math.max(.35, Math.min(1, ((m.perf || 50) + 30) / 100 - (m.cor || 0) / 250 + (r() - .5) * .2));
  return { mid: m.id, minister: m.minister, ministry: m.name, sector, steps, total, padB, delivery: Math.round(delivery * 100) / 100 };
};
const fmtB = (b) => b < .1 ? "₦" + Math.round(b * 1000) + "M" : "₦" + (Math.round(b * 10) / 10).toFixed(1) + "B";
/* What approving does: the steps chosen, scaled by how well it is delivered. */
export const planEffect = (P, stepIds) => {
  const chosen = P.steps.filter(s => stepIds.includes(s.id)), fx = {};
  chosen.forEach(s => Object.entries(s.fx || {}).forEach(([k, v]) => { fx[k] = Math.round(((fx[k] || 0) + v * P.delivery) * 1000) / 1000; }));
  if (fx.app) fx.app = Math.round(fx.app);
  return { chosen, fx, cost: Math.round(chosen.reduce((a, s) => a + s.c, 0) * 100) / 100, restarts: chosen.filter(s => s.restart).map(s => ({ pid: s.pid, shortM: s.shortM })) };
};
