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

test("the President's debt relief comes from creditors (Paris Club, IMF, the US), not from Abuja", () => {
  assert.deepEqual(F.FED_CREDITORS.map(c => c.id), ["paris", "imf", "usa"]);
  F.FED_CREDITORS.forEach(c => { assert.ok(!/Abuja/.test(c.nm + c.note), c.id); assert.ok(c.share > 0 && c.cut > 0 && c.cut <= 1); });
  const usa = F.FED_CREDITORS.find(c => c.id === "usa"), paris = F.FED_CREDITORS[0];
  assert.ok(usa.odds({ cor: .3, washington: "went" }) > usa.odds({ cor: .3, washington: null }), "going to Washington helps");
  assert.ok(paris.odds({ cor: .2, reforms: 3, app: 60 }) > paris.odds({ cor: .6, reforms: 0, app: 40 }), "clean books and reforms help");
  assert.ok(paris.why({ cor: .6, reforms: 0 }).length === 2);
});

test("where a national project goes is a North–South fight", () => {
  const S = F.siteReaction("refinery", "SS"), N = F.siteReaction("rail", "NW"), M = F.siteReaction("dam", "NC");
  assert.ok(S.nass < 0 && S.zones.NW < 0 && S.zones.SS > 0, "the South: northern senators slow the budget");
  assert.ok(N.faacPct < 0 && N.zones.SS < 0 && N.zones.NE > 0, "the North: pipelines cut");
  assert.ok(F.siteReaction("rail", "NW", { delta: true }).faacPct > N.faacPct, "a Niger Delta ministry softens it");
  assert.equal(M.region, "the Middle Belt");
  assert.equal(F.siteReaction("school", "SS"), null, "a school is not a national fight");
});

test("security fronts: four regional wars, the council's choice, and the toll of neglect", () => {
  let S = F.frontsInit(); assert.deepEqual(Object.keys(S).sort(), ["ne", "nw", "se", "ss"]);
  const c = F.frontsCard(S); assert.equal(c.opts.length, 4); assert.ok(c.worst.includes("nw"));
  const pick = c.opts.find(o => o.front === "nw" && o.how === "military");
  const y = F.frontsYear(S, pick); assert.ok(y.S.nw < S.nw && y.S.se > S.se);
  let T = { ne: 69, nw: 10, se: 10, ss: 69 }; const z = F.frontsYear(T, { front: "nw", sev: -10 });
  assert.deepEqual(z.tolls.map(t => t.front).sort(), ["ne", "ss"]);
  c.opts.forEach(o => assert.ok(o.note && o.cost > 0, o.id));
});
test("the national cake: insert, half, or refuse", () => {
  const k = F.nassCake(600); assert.equal(k.ask, 30);
  const [ins, half, ref] = k.opts; assert.ok(ins.nass > 0 && ref.nass < 0 && half.cost === 15 && ref.cost === 0);
});
test("the army's jets and drones go to procurement under the Ministry of Defence", async () => {
  const P = await import("../game/systems/presidency.js");
  const card = P.PRES_CARDS ? P.PRES_CARDS.find(c => c.id === "jets") : null;
  if (card) card.opts.filter(o => o.id !== "no").forEach(o => { assert.equal(o.procure, "defence", o.id); assert.ok(!(o.fx || {}).security, "security comes on delivery, not on approval"); });
  assert.ok(F.FED_MINISTRIES.some(m => m.id === "sec" && /Defence/.test(m.name)), "a President without one can create the Ministry of Defence");
  const seq = (v) => () => v;
  const honestTender = F.defenceDelivery({ mode: "tender" }, 90, seq(.6)), crookedTender = F.defenceDelivery({ mode: "tender" }, 10, seq(.6));
  assert.ok(honestTender.ok && !crookedTender.ok, "the minister's honesty decides the open tender");
  assert.ok(honestTender.sec > crookedTender.sec && crookedTender.cor > 0);
  const direct = F.defenceDelivery({ mode: "buy" }, 50, seq(.9)); assert.ok(!direct.ok && direct.cor > 0, "a direct award invites refurbished jets");
});
