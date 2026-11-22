import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../game/systems/stateprofile.js";
import { estimate, makeProject, siteTrouble } from "../game/systems/projects.js";

const ALL = ["Lagos", "Rivers", "Kano", "Ebonyi", "Kaduna", "Ogun", "Borno", "Enugu", "Delta", "Plateau", "Oyo", "Imo", "Anambra", "Abia", "Akwa_Ibom", "Cross_River", "Bayelsa", "Edo", "Katsina", "Sokoto", "Zamfara", "Kebbi", "Jigawa", "Adamawa", "Bauchi", "Gombe", "Yobe", "Taraba", "Kwara", "Kogi", "Niger", "Nassarawa", "Benue", "Osun", "Ondo", "Ekiti", "FCT"];
const RE = { id: "rural_elec", nm: "Rural Electrification (Solar)", s: "infrastructure", c: 5, t: 2, fx: { infra: .05, app: 7 }, d: "Solar mini-grids for 100 communities." };

test("rural electrification in Abia is not the same as in Lagos", () => {
  const abia = S.localProgramme(RE, "Abia"), lagos = S.localProgramme(RE, "Lagos");
  assert.match(abia.local.why, /Aba/); assert.match(abia.local.why, /Nine of Abia's 17/);
  assert.deepEqual(abia.ask.opts.map(o => o.id), ["ring", "outside", "both"]);
  assert.match(lagos.local.why, /regulates its own electricity market/); assert.match(lagos.local.fact, /Epe/);
  assert.equal(lagos.ask.opts[0].id, "private");
  assert.equal(abia.art, "rural_elec-ring"); assert.equal(lagos.art, "rural_elec-lagoon");
});

test("bandit states ask who guards the sites; the creeks ask about gas; NERC states ask how to license", () => {
  assert.equal(S.localProgramme(RE, "Zamfara").ask.q, "Who guards the sites?");
  assert.equal(S.localProgramme(RE, "Bayelsa").ask.opts[0].id, "gas");
  const kano = S.localProgramme(RE, "Kano");
  assert.match(kano.local.why, /NERC/);
  // Kano passes its own market law: from then on, its own regulator.
  const kano2 = S.localProgramme(RE, "Kano", { ownMarket: true });
  assert.match(kano2.local.why, /the law you passed/); assert.equal(kano2.ask.opts[0].id, "private");
});

test("every state gets a profile, and every programme works in every state", () => {
  const P = [RE, ...["water", "roads", "irrigation", "kpa_irrigation", "classrooms", "free_edu", "phc", "amotekun", "school_feed", "farm_sub", "outreach", "school_voucher", "okada_kit"].map(id => ({ id, nm: id, c: 3, t: 2, fx: { app: 3 }, d: "x" }))];
  ALL.forEach(st => {
    const pr = S.profileOf(st); assert.ok(S.LANDS[pr.land], st);
    S.localProgrammes(P, st).forEach(p => {
      assert.ok(p.nm && p.d, st + " " + p.id);
      if (p.ask) { assert.ok(p.local && p.local.why && p.local.head, st + " " + p.id); assert.ok(p.ask.opts.length >= 2); p.ask.opts.forEach(o => assert.ok(o.l && o.d && o.costF > 0, st + " " + p.id + " " + o.id)); }
    });
  });
  // Dry-season irrigation only where there is a dry season.
  assert.equal(S.localProgramme({ id: "kpa_irrigation", nm: "x", c: 1, t: 1 }, "Imo"), null);
  assert.ok(S.localProgramme({ id: "kpa_irrigation", nm: "x", c: 1, t: 1 }, "Sokoto"));
  // In the rainforest, irrigation becomes processing.
  const ir = S.localProgramme({ id: "irrigation", nm: "Irrigation Network", c: 4, t: 2 }, "Abia");
  assert.match(ir.nm, /Processing/); assert.equal(ir.ptype, "industrial"); assert.equal(ir.art, "irrigation-palm");
  assert.match(S.localProgramme({ id: "free_edu", nm: "Free", c: 3, t: 2 }, "Kano").nm, /Almajiri/);
  assert.equal(S.localProgramme({ id: "amotekun", nm: "⭐ A", c: 6, t: 2 }, "Enugu").nm, "⭐ Fund the Ebube Agu");
  assert.match(S.localProgramme({ id: "school_feed", nm: "S", c: 2, t: 1 }, "Kano").d, /tuwo/);
  // The President is not a state.
  assert.equal(S.localProgramme(RE, "Nigeria"), RE);
});

test("an answer changes the cost and years now, and a seeded result lands next year", () => {
  const p = S.localProgramme(RE, "Zamfara"), none = p.ask.opts.find(o => o.id === "none"), army = p.ask.opts.find(o => o.id === "army");
  const a = S.applyLocalPick(p, army, { state: "Zamfara", turn: 2, capital: true });
  assert.equal(a.p.costF, 1.12); assert.equal(a.p.pick, "army"); assert.equal(a.later.turn, 3); assert.match(a.later.desc, /without one attack/);
  const b1 = S.applyLocalPick(p, none, { state: "Zamfara", turn: 2, capital: true }), b2 = S.applyLocalPick(p, none, { state: "Zamfara", turn: 2, capital: true });
  assert.deepEqual(b1.later, b2.later, "seeded: a reload gives the same result");
  const q = S.localProgramme({ id: "classrooms", nm: "C", c: 4, t: 2, fx: { lit: .05 } }, "Bayelsa"), raised = q.ask.opts[0];
  const c = S.applyLocalPick(q, raised, { state: "Bayelsa", turn: 1, capital: false });
  assert.equal(c.p.c, 4.8);
});

test("bills: a law the state already has becomes the law that enforces it", () => {
  const g = { id: "open_grazing", nm: "Anti-Open Grazing Law", d: "x", fx: {}, sk: {}, cost: .5 };
  assert.match(S.localBill(g, "Benue").d, /2017/); assert.equal(S.localBill(g, "Benue").nm, "Anti-Open Grazing Enforcement Law");
  assert.equal(S.localBill(g, "Sokoto").nm, "Grazing Reserves and Ranching Law");
  assert.equal(S.localBill(g, "Lagos").nm, "Anti-Open Grazing Law");
  const cra = { id: "child_rights", nm: "Child Rights Law", d: "x", sk: {} };
  assert.equal(S.localBill(cra, "Lagos").nm, "Family Courts Law");
  assert.equal(S.localBill(cra, "Kano").nm, "Child Rights Law"); assert.match(S.localBill(cra, "Kano").d, /yet to domesticate/);
  const v = { id: "vapp", nm: "VAPP", d: "x", sk: {} };
  assert.equal(S.localBill(v, "Ogun").nm, "Sexual Assault Referral Centres Law"); assert.match(S.localBill(v, "Kano").d, /Kano/);
  const ids = (st, ctx) => S.stateBills(st, ctx).map(b => b.id);
  assert.ok(ids("Kano").includes("elec_market")); assert.ok(ids("Kano").includes("hisbah_board")); assert.ok(!ids("Lagos").includes("elec_market"));
  assert.ok(ids("Lagos").includes("elec_consumer")); assert.ok(ids("Lagos").includes("waterways"));
  assert.ok(ids("Bayelsa").includes("host_trust")); assert.ok(ids("Anambra").includes("erosion_law")); assert.ok(ids("Zamfara").includes("forest_guards"));
  assert.ok(ids("Kano", { ownMarket: true }).includes("elec_consumer"));
  assert.equal(S.localHouseBill({ id: "hb_almajiri" }, "Lagos"), null);
  assert.match(S.localHouseBill({ id: "hb_grazing", nm: "x" }, "Abia").nm, /Amendment/);
  assert.equal(S.localHouseBill({ id: "hb_state_police", nm: "x" }, "Oyo").nm, "Amotekun Bill");
});

test("project costs follow the state's land", () => {
  const base = estimate("road", 10, { places: ["Somewhere"] }).buildM;
  assert.equal(estimate("road", 10, { places: ["Umuahia North"], state: "Abia" }).buildM, Math.round(base * 1.2));
  assert.equal(estimate("power", 10, { places: ["Kano Municipal"], state: "Kano" }).hard[0].kind, "sun");
  assert.ok(estimate("power", 10, { places: ["Kano Municipal"], state: "Kano" }).buildM < estimate("power", 10, { places: ["Kano Municipal"] }).buildM);
  assert.equal(estimate("road", 10, { places: ["X"], costF: 1.1 }).buildM, Math.round(base * 1.1));
  // A gully opens in the rains; gunmen hit an unguarded site in bandit country.
  const p = makeProject({ id: "a", title: "r", type: "road", qty: 10, lga: "Aba North", ministryId: "w", approvedM: 100, thisYearM: 100, year: 1, state: "Abia" });
  assert.equal(p.state, "Abia");
  let hit = null; for (let i = 0; i < 400 && !hit; i++) { let k = 0; const r = () => [0, .05][k++] ?? .5; hit = siteTrouble(p, 1, r); }
  assert.equal(hit.kind, "gully");
  const z = makeProject({ id: "b", title: "r", type: "road", qty: 10, lga: "Gusau", ministryId: "w", approvedM: 100, thisYearM: 100, year: 1, state: "Zamfara" });
  let k = 0; assert.equal(siteTrouble(z, 1, () => [0, .05][k++] ?? .5).kind, "attack");
  const zg = { ...z, pick: "escort" }; k = 0; assert.notEqual((siteTrouble(zg, 1, () => [0, .05][k++] ?? .5) || {}).kind, "attack");
});

test("every state picture is shipped and every shipped one is used (docs/LOVABLE-STATES.md)", async () => {
  const fs = await import("node:fs");
  const dir = new URL("../public/art/variants/", import.meta.url);
  const have = fs.readdirSync(dir).map(f => f.replace(/\.webp$/, "")).sort();
  assert.deepEqual(have, [...S.VARIANT_ART_ALL].sort());
  // Every picture a programme or bill names is one of them.
  const ALLST = ["Lagos", "Abia", "Kano", "Bayelsa", "Zamfara", "Borno", "Ondo", "Ebonyi", "Benue", "Plateau", "Oyo", "Anambra"];
  const used = new Set();
  ALLST.forEach(st => {
    ["rural_elec", "water", "roads", "irrigation", "classrooms", "free_edu", "phc", "amotekun", "school_feed"].forEach(id => { const p = S.localProgramme({ id, nm: id, c: 1, t: 1 }, st); if (p && p.art) used.add(p.art); });
    S.localBills([{ id: "open_grazing", nm: "x", d: "x" }, { id: "child_rights", nm: "x", d: "x" }, { id: "vapp", nm: "x", d: "x" }], st).forEach(b => b.art && used.add(b.art));
    S.stateBills(st, { ownMarket: true }).forEach(b => b.art && used.add(b.art));
  });
  [...used].forEach(a => assert.ok(have.includes(a), a));
});

test("the presidency: the coastal highway only on the coast; a need elsewhere gets works that fit it", async () => {
  const F = await import("../game/systems/federal.js");
  assert.ok(S.fedFits("f_coastal", "Lagos")); assert.ok(!S.fedFits("f_coastal", "Jigawa")); assert.ok(S.fedFits("f_coastal", "Akwa Ibom"));
  assert.ok(S.fedFits("f_trunk_roads", "Jigawa"), "trunk roads go anywhere");
  assert.equal(S.fedPlace("f_coastal", "Jigawa", 3), S.COAST[3]); assert.equal(S.fedPlace("f_coastal", "Rivers", 3), "Rivers");
  assert.equal(S.fedPlace("f_mambilla", null, 9), "Taraba");
  assert.ok(F.FED_NEEDS.road.fix.includes("f_trunk_roads")); assert.ok(F.FED_POLICIES.some(p => p.id === "f_sez"));
  assert.match(S.siteProblem("seaport", "Jigawa"), /no coast/); assert.equal(S.siteProblem("seaport", "Rivers"), null);
  assert.match(S.siteProblem("road", "Jigawa", "A coastal road in Jigawa"), /no coast/);
  const P = await import("../game/systems/proposals.js");
  assert.equal(P.parseProposal("A coastal road in Jigawa", { lgas: ["Jigawa", "Lagos"], federal: true }).status, "unsupported");
  assert.equal(P.parseProposal("A coastal road in Lagos", { lgas: ["Jigawa", "Lagos"], federal: true }).status, "ok");
  // The President's megaprojects ask the President's question; the answer can pick the site.
  const c = S.fedProgramme(F.FED_POLICIES.find(p => p.id === "f_coastal"));
  assert.match(c.local.why, /Lagos to Calabar/); assert.equal(c.ask.opts[0].site, "Lagos");
  const a = S.applyLocalPick(c, c.ask.opts[0], { state: "Nigeria", turn: 2, capital: true }); assert.equal(a.p.site, "Lagos");
  assert.ok(S.fedProgramme(F.FED_POLICIES.find(p => p.id === "f_rail")).ask);
  // A federal project's cost follows the state's land.
  assert.equal(estimate("power", 10, { places: ["Sokoto"], federal: true }).hard[0].kind, "sun");
});

test("the President's money comes in monthly: the Federation Account, shared at FAAC", async () => {
  const F = await import("../game/systems/federal.js");
  const M = F.fedMonth({ faac: 480, igr: 60 });
  assert.ok(Math.abs(M.fgB * 12 - 480) < 3, "twelve federal shares make the year (" + M.fgB + ")");
  assert.ok(Math.abs(M.grossB - (M.derivB + M.fgB + M.statesB + M.lgsB)) < .5, "the account is fully shared");
  assert.equal(M.ownB, 5); assert.ok(M.statesB > M.lgsB && M.fgB > M.statesB);
  assert.ok(F.fedMonth({ faac: 480 }, .8).fgB < M.fgB, "a short month is smaller");
  const rows = F.fedMonthRows(M); assert.match(rows[1].l, /13% derivation/); assert.match(rows[4].l, /52\.68%/);
  // Federal bills read as the laws already passed.
  assert.match(F.FED_BILLS.find(b => b.id === "f_electricity").nm, /Amendment/);
  assert.match(F.FED_BILLS.find(b => b.id === "f_lg_autonomy").d, /Supreme Court ruled in 2024/);
});
