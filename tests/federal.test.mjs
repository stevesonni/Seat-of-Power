import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../game/systems/federal.js";
import { UNIT, TYPE_SECTOR, CONTRACTORS } from "../game/systems/projects.js";
import { parseProposal } from "../game/systems/proposals.js";
import { ATTRACTS } from "../game/systems/investors.js";

test("the President can appoint an FCT Minister, and every federal ministry is well formed", () => {
  const fct = F.FED_MINISTRIES.find(m => m.id === "fct");
  assert.ok(fct && /FCT/.test(fct.name));
  const ids = new Set();
  F.FED_MINISTRIES.forEach(m => { assert.ok(m.name && m.icon && m.why && m.cost > 0, m.id); assert.ok(!ids.has(m.id), "duplicate " + m.id); ids.add(m.id); m.unlock.forEach(t => assert.ok(UNIT[t], m.id + " unlocks unknown " + t)); });
  Object.values(F.FED_NEED_MINISTRY).concat(Object.values(F.FED_PROJECT_MINISTRY)).forEach(id => assert.ok(ids.has(id), "no ministry " + id));
});

test("federal programmes, bills and orders are their own, and each need's fixes exist", () => {
  const pol = new Set(F.FED_POLICIES.map(p => p.id));
  assert.equal(pol.size, F.FED_POLICIES.length);
  F.FED_POLICIES.forEach(p => { assert.ok(p.id.startsWith("f_") && p.c > 0 && p.t >= 1 && p.fx, p.id); });
  Object.entries(F.FED_NEEDS).forEach(([k, n]) => { n.fix.forEach(id => assert.ok(pol.has(id), k + " fixes unknown " + id)); ["title", "why", "fail", "abandon", "win"].forEach(f => assert.equal(typeof n[f]("Kano"), "string")); });
  F.FED_BILLS.concat(F.FED_ORDERS).forEach(b => assert.ok(b.id.startsWith("f_") && b.nm && b.d && b.fx, b.id));
  F.FED_HOUSE_BILLS.forEach(b => assert.ok(b.clauses.length && b.civic && b.signFx, b.id));
  F.FED_REVENUE.forEach(m => { const a = m.adopt({ s: {} }); assert.ok(a.log && a.wiki, m.id); });
});

test("federal projects: rail, ports, refineries, pipelines and airports for the President only", () => {
  F.FED_TYPES.forEach(t => { assert.ok(UNIT[t], t); assert.ok(TYPE_SECTOR[t], t); assert.ok(CONTRACTORS.some(c => c.sectors.includes(TYPE_SECTOR[t]) && !c.nepotism), "nobody builds " + t); });
  F.FED_ONLY.forEach(t => assert.ok(ATTRACTS[t] > 0, t));
  assert.equal(parseProposal("a 300 km railway to Kano", { federal: true }).proposal.type, "rail");
  assert.equal(parseProposal("a deep seaport with 4 berths", { federal: true }).proposal.qty, 4);
  assert.equal(parseProposal("a 300 km railway to Kano").status, "unsupported");
  assert.equal(parseProposal("50 boreholes in Kano", { federal: true }).status, "unsupported");
  assert.equal(parseProposal("50 boreholes in Kano").proposal.type, "water");
});
