import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

const CAREERS = { lga: { people: 50, gov: 50, council: 50, cor: .1, purse: 100, road: { builder: "small" } }, senate: { home: 50, clout: 50, loyalty: 50, cor: .1, chest: 1 }, amb: { abuja: 50, host: 50, diaspora: 50, trade: 0, cor: .1 } };
const STATS = { lga: ["people", "gov", "council", "cor"], senate: ["home", "clout", "loyalty", "cor", "chest"], amb: ["abuja", "host", "diaspora", "trade", "cor"] };
// The worlds an arc can meet: every hidden truth, high and low standing, every flag an option sets.
const worlds = (career) => [true, false].flatMap(truth => [20, 80].map(lvl => ({ truth, S: { ...CAREERS[career], ...Object.fromEntries(STATS[career].filter(k => k !== "cor").map(k => [k, lvl])) } })));
const rolls = [() => .1, () => .9];

test("22 headscratchers: 8 for the chairman, 8 for the senator, 6 for the ambassador", () => {
  assert.equal(Object.keys(SYS.ARCS.lga).length, 8); assert.equal(Object.keys(SYS.ARCS.senate).length, 8); assert.equal(Object.keys(SYS.ARCS.amb).length, 6);
  for (const [career, defs] of Object.entries(SYS.ARCS)) for (const [id, def] of Object.entries(defs)) {
    assert.ok(def.nm && def.where && def.learn && def.left, career + "/" + id + ": name, where it happened, the lesson, what is left");
    assert.ok(def.stages.open, id + " has an opening");
    assert.ok(!/^nigeria/i.test(def.where), id + ": inspired by somewhere else, not presented as Nigerian history");
  }
});

test("every option leads somewhere real, and every stage can reach an ending, in every world", () => {
  for (const [career, defs] of Object.entries(SYS.ARCS)) for (const [id, def] of Object.entries(defs)) for (const w of worlds(career)) for (const flags of [{}, { denied: true }, { market: true }]) {
    const ends = new Set(), seen = new Set(), queue = ["open"];
    while (queue.length) { const k = queue.shift(); if (seen.has(k)) continue; seen.add(k);
      const st = def.stages[k]; assert.ok(st, career + "/" + id + ": stage " + k + " exists");
      const c = { A: { flags, truth: w.truth }, S: w.S, truth: w.truth, f: flags };
      const opts = typeof st.opts === "function" ? st.opts(c) : st.opts;
      assert.ok(opts.length >= 1, id + "/" + k + " has options");
      const d = typeof st.d === "function" ? st.d(c) : st.d; assert.ok(d && d.length > 20, id + "/" + k + " has text");
      const ign = typeof st.ignore === "function" ? st.ignore(c) : st.ignore; assert.ok(!ign || opts.some(o => o.id === ign), id + "/" + k + ": the ignore option " + ign + " exists");
      for (const o of opts) {
        assert.ok(o.id && o.l, id + "/" + k + ": option has an id and a label");
        assert.ok(o.l.split(/\s+/).length <= 12, id + "/" + k + "/" + o.id + ": short label");
        Object.keys(o.fx || {}).forEach(f => assert.ok(STATS[career].includes(f), id + "/" + o.id + ": " + f + " is a " + career + " number"));
        const nexts = typeof o.next === "function" ? [...new Set(rolls.map(r => o.next({ ...c, r })))] : [o.next];
        nexts.forEach(nx => { if (nx) { assert.ok(def.stages[nx], id + "/" + k + "/" + o.id + " → " + nx); queue.push(nx); } else ends.add(o.end || "mixed"); });
      }
    }
    assert.ok(ends.size >= 1, career + "/" + id + " can end");
  }
});

test("a run's plan: three arcs, the right career, openings inside the term, inherited ones first", () => {
  for (const career of ["lga", "senate", "amb"]) for (let seed = 1; seed <= 40; seed++) {
    const P = SYS.arcPlan(seed, career), ids = Object.keys(P);
    assert.equal(ids.length, 3, career + " plans three");
    ids.forEach(id => assert.ok(SYS.ARCS[career][id], id + " belongs to " + career));
    const inh = ids.filter(id => SYS.ARCS[career][id].inherited); assert.ok(inh.length <= 1);
    if (inh.length) assert.equal(P[inh[0]].due, 1, "an inherited problem is there on day one");
  }
  // Across replays every arc shows up.
  for (const career of ["lga", "senate", "amb"]) { const all = new Set(); for (let seed = 1; seed <= 200; seed++) Object.keys(SYS.arcPlan(seed, career)).forEach(id => all.add(id)); assert.equal(all.size, Object.keys(SYS.ARCS[career]).length, career + ": every arc can appear"); }
  // A save from before the arcs plans from where it is.
  const late = SYS.arcPlan(5, "lga", { from: 4 }); Object.values(late).forEach(A => assert.ok(A.due >= 4 && A.due <= 5));
});

test("playing arcs through: choices change the arc, endings leave a tag, nothing is left dangling", () => {
  for (const career of ["lga", "senate", "amb"]) for (let seed = 1; seed <= 30; seed++) {
    let S = { ...CAREERS[career], arcs: SYS.arcPlan(seed, career) }; const last = { lga: 6, senate: 8, amb: 6 }[career];
    for (let n = 1; n <= last; n++) {
      let items = SYS.arcItems(S, n, career), guard = 0;
      assert.ok(items.length <= SYS.ARC_MAX_PER_TURN);
      while (items.length && guard++ < 10) {
        const it = items.shift(), v = SYS.arcView(S, it.id, career); assert.ok(v, it.id + " has a view");
        const pick = v.opts.filter(o => o.available)[(seed + n) % v.opts.filter(o => o.available).length];
        const res = SYS.arcChoose(S, it.id, pick.id, n, SYS.seeded(seed, it.id, n), career);
        S = { ...S, arcs: { ...S.arcs, [it.id]: res.A } };
        if (res.now) items.unshift({ k: "arc", id: it.id });
        if (res.end) { assert.ok(res.A.done && res.learnKey === "arc_" + it.id); }
      }
    }
    SYS.arcTags(S).forEach(t => assert.ok(SYS.arcTagList(career).includes(t), t + " is a known tag"));
    SYS.arcOpen(S, career).forEach(x => assert.ok(x.left && x.nm));
  }
});

test("leaving it to staff takes the arc's ignore option, and the fuse burns", () => {
  const S = { ...CAREERS.lga, arcs: { fuel: { stage: "open", due: 1, truth: null, flags: {}, hist: [] } } };
  const a = SYS.arcIgnore(S, "fuel", 1, () => .9, "lga"); assert.equal(a.o.id, "leave"); assert.equal(a.A.stage, "smell");
  const S2 = { ...S, arcs: { fuel: a.A } }, b = SYS.arcIgnore(S2, "fuel", 2, () => .9, "lga"); assert.equal(b.A.stage, "fire", "the drums catch fire if nobody acts");
  const c = SYS.arcChoose({ ...S, arcs: { fuel: b.A } }, "fuel", "help", 3, () => .5, "lga"); assert.equal(c.tag, "fuel_fire"); assert.equal(c.end, "bad");
});

test("hidden truths: what the lab or the engineer finds depends on the roll, and preparation changes the outcome", () => {
  const lab = (truth) => SYS.arcView({ arcs: { water: { stage: "lab", truth, flags: {}, hist: ["open:switch", "brown:test"] } } }, "water", "lga");
  assert.match(lab(true).d, /lead/); assert.match(lab(false).d, /no lead/);
  assert.notDeepEqual(lab(true).opts.map(o => o.id), lab(false).opts.map(o => o.id));
  // The ambassador's evacuation: a trusting host clears families; a cold one shuts the window.
  const ev = (host) => SYS.arcChoose({ host, diaspora: 50, abuja: 50, arcs: { list: { stage: "open", due: 1, flags: {}, hist: [] } } }, "list", "families", 1, () => .5, "amb");
  assert.equal(ev(70).A.stage, "cleared"); assert.equal(ev(30).A.stage, "window"); assert.ok(ev(70).now, "the next step follows straight away");
  // The second plane: a community you looked after finds every family.
  const second = (diaspora) => SYS.arcView({ diaspora, arcs: { list: { stage: "second", flags: {}, hist: ["open:cleared"] } } }, "list", "amb");
  assert.match(second(70).d, /every family/); assert.match(second(30).d, /phones are dead/);
});

test("the arcs teach: a notebook page each, in the right career's notebook", () => {
  Object.keys(SYS.ARCS.lga).forEach(id => assert.match(SYS.LGA_LEARN["arc_" + id], /Where it happened/));
  Object.keys(SYS.ARCS.senate).forEach(id => assert.match(SYS.LEARN["arc_" + id], /Where it happened/));
  Object.keys(SYS.ARCS.amb).forEach(id => assert.match(SYS.AMB_LEARN["arc_" + id], /Where it happened/));
});

test("the arcs reach the career agendas, and replace what they duplicate", () => {
  const S = { seed: 3, n: 1, seen: [], road: {}, seeds: [], arcs: { fuel: { stage: "open", due: 1, flags: {}, hist: [] } } };
  assert.ok(SYS.lgaTurn(3, 1, S).some(x => x.k === "arc" && x.id === "fuel"), "the chairman's half-year includes the arc");
  const A = { seed: 3, seen: [], arcs: { list: { stage: "open", due: 1, flags: {}, hist: [] } } };
  assert.ok(SYS.ambAgenda(3, 1, A).some(x => x.k === "arc" && x.id === "list"), "the ambassador's half-year includes the arc");
  assert.deepEqual(SYS.arcExcludes("amb", A.arcs), ["evacuate"]); assert.deepEqual(SYS.arcExcludes("lga", { okada: {} }), ["okada"]);
});

test("echoes: a later governor hears about the arcs, in the right state", () => {
  const rec = { offices: [{ office: "chairman", state: "Enugu", tags: ["fuel_fire"] }, { office: "senator", state: "Kano", tags: ["horizon_exposed"] }, { office: "ambassador", tags: ["evac_done"] }] };
  const E = SYS.arcEchoes(rec, "Enugu").map(l => l.tag);
  assert.ok(E.includes("fuel_fire") && E.includes("evac_done") && !E.includes("horizon_exposed"));
  SYS.ARC_ECHO_TAGS.forEach(t => assert.ok(["lga", "senate", "amb"].some(c => SYS.arcTagList(c).includes(t)), t + " can actually happen"));
});

test("in sync: the drums' market fire replaces the agenda's own market fire; nothing assumes the player's gender", () => {
  const S = { purse: 200, people: 50, gov: 50, council: 50, cor: .1, arcs: { fuel: { stage: "fire", due: 3, flags: { market: true }, hist: ["open:move", "nowhere:market", "smell:leave"] } } };
  assert.deepEqual(SYS.arcChoose(S, "fuel", "blame", 3, () => .5, "lga").seen, ["fire"], "no second market fire afterwards");
  const S2 = { ...S, arcs: { fuel: { ...S.arcs.fuel, flags: {} } } };
  assert.deepEqual(SYS.arcChoose(S2, "fuel", "blame", 3, () => .5, "lga").seen, [], "a fire at the school leaves the market's own story alone");
  const text = JSON.stringify(SYS.ARCS.senate) + JSON.stringify(SYS.ARCS.lga);
  assert.ok(!/son-in-law|your wife|your husband/.test(text), "the player's family is described without a gender");
});
