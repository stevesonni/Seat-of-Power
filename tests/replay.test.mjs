import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("card memory prefers what you have not seen, and never empties the pool", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(SYS.preferUnseen(pool, { a: 1 }).map(x => x.id), ["b", "c"]);
  assert.deepEqual(SYS.preferUnseen(pool, { a: 2, b: 1, c: 3 }).map(x => x.id), ["b"], "all seen: the least seen");
  assert.deepEqual(SYS.preferUnseen([], {}), []);
  assert.deepEqual(SYS.markSeen({ a: 1 }, ["a", "b"]), { a: 2, b: 1 });
  // The LGA agenda: cards from earlier runs come last.
  const S = { seed: 1, n: 1, seen: [], road: {}, seeds: [], arcs: {} }, all = SYS.LGA_PROBLEMS.map(p => p.id);
  const known = Object.fromEntries(all.slice(0, all.length - 1).map(id => [id, 1]));
  const it = SYS.lgaAgenda(1, 1, { ...S, known }).find(x => x.k === "problem");
  assert.equal(it.id, all[all.length - 1], "the one unseen problem comes first");
});

test("personalities are consistent: each kind has a priority, a red line, a reaction and a voice", () => {
  for (const [role, kinds] of Object.entries(SYS.PERSONAS)) for (const [k, P] of Object.entries(kinds)) { assert.ok(P.priority && P.redLine, role + "/" + k); assert.ok(P.tells.length >= 2); P.tells.forEach(t => assert.ok(!/greedy|vindictive|patron|principled|mercenary/i.test(t), "no labels in what they say")); }
  assert.deepEqual(SYS.rollPersonas(9), SYS.rollPersonas(9), "the same run, the same people");
  const seen = new Set(); for (let i = 1; i < 60; i++) seen.add(SYS.rollPersonas(i).gf); assert.equal(seen.size, 4, "every kind of godfather turns up");
  for (let i = 1; i < 40; i++) assert.notEqual(SYS.rollPersonas(i, { veteran: true }).gf, "patron", "veterans never get the easy godfather");
  const pool = [{ id: "gf_money" }, { id: "gf_assembly" }, { id: "gf_land" }];
  assert.deepEqual(SYS.gfPreferred(pool, "power").map(d => d.id), ["gf_assembly"]);
  assert.equal(SYS.gfPreferred(pool, "vindictive").length, 3, "the vindictive one asks for anything; he hits back harder");
  assert.ok(SYS.PERSONAS.gf.vindictive.rejectMul > SYS.PERSONAS.gf.greedy.rejectMul && SYS.PERSONAS.gf.patron.rejectMul < 1);
  Object.values(SYS.CHAIR_ASKS).forEach(A => assert.equal(A.opts.length, 2));
});

test("three starting situations, and the once-a-run surprises", () => {
  assert.deepEqual(Object.keys(SYS.SITUATIONS).sort(), ["arrears", "split", "windfall"]);
  const got = new Set(); for (let i = 1; i < 40; i++) got.add(SYS.situationFor(i)); assert.equal(got.size, 3);
  assert.equal(SYS.wildcardFor(1, 3, { ministries: [] }) === null || SYS.wildcardFor(1, 3, { ministries: [] }).id !== "viral", true, "no viral commissioner without a cabinet");
  const m = [{ minister: "Hon. Ada Obi", name: "Ministry of Works" }];
  const ids = new Set(); for (let t = 2; t < 40; t++) { const w = SYS.wildcardFor(t, t, { gfDead: true, speaker: true, ministries: m }); if (w) { ids.add(w.id); assert.ok(w.opts.length >= 3 && w.t && w.d && !/\{m\}/.test(w.d)); } }
  assert.deepEqual([...ids].sort(), ["heirs", "illness", "speaker", "viral"]);
});

test("the living House: six members with interests, a Speaker race, a promise that comes due", () => {
  const L = { members: SYS.makeMembers(4, ["A One", "B Two", "C Three", "D Four", "E Five", "F Six"]) };
  assert.equal(L.members.length, 6); assert.deepEqual(L.members.map(m => m.bloc), SYS.BLOCS);
  L.members.forEach(m => assert.ok(SYS.INTERESTS.includes(m.interest) && SYS.MEMBER_ASKS[m.interest], m.interest));
  assert.ok(L.members.filter(m => m.interest === "money").length <= 1, "not everyone can be bought");
  assert.equal(SYS.budgetOffer(L).bloc, "opp");
  const [a, b] = SYS.speakerCandidates(L); assert.equal(a.bloc, "ours"); assert.equal(b.bloc, "swing");
  const R = SYS.speakerRace(4, L, a.id, .6); assert.ok([a.id, b.id].includes(R.winner)); assert.equal(R.owes, R.winner === a.id); assert.equal(R.crossed, R.winner !== a.id);
  assert.equal(SYS.speakerRace(4, L, null, .5).owes, false);
  let wins = 0; for (let i = 1; i <= 200; i++) if (SYS.speakerRace(i, L, a.id, .6).winner === a.id) wins++; assert.ok(wins > 110, "backing a candidate helps (" + wins + "/200)");
  assert.equal(SYS.moveMember(L, "m1", 200).members[0].rel, 100);
  const asked = []; for (let t = 2; t < 12; t++) { const x = SYS.memberAskFor(4, t, L, asked); if (!x) break; asked.push(x.m.id); } assert.equal(new Set(asked).size, asked.length, "each member once");
});

test("hearings and cabinet meetings", () => {
  const goods = [1, 2, 3, 4, 5, 6, 7, 8].map(t => SYS.hearing(1, t, "comm", { kind: "tech" }).out), bads = [1, 2, 3, 4, 5, 6, 7, 8].map(t => SYS.hearing(1, t, "comm", { kind: "hustler" }).out);
  assert.ok(goods.filter(x => x === "good").length > bads.filter(x => x === "good").length, "a technocrat does better in the chair than a hustler");
  assert.equal(SYS.hearing(1, 2, "perm").out, "safe"); assert.equal(SYS.hearing(1, 2, "nobody").out, "snub");
  const ms = [{ id: "health", name: "Ministry of Health", minister: "Dr. A" }, { id: "works", name: "Ministry of Works & Infrastructure", minister: "Engr. B" }, { id: "educ", name: "Ministry of Education", minister: "Prof. C" }];
  const D = SYS.debateFor("health", ms); assert.equal(D.a.ministry.id, "health"); assert.equal(D.b.ministry.id, "works"); assert.notEqual(D.a.ministry, D.b.ministry);
  assert.equal(SYS.debateFor("health", ms.slice(0, 1)), null, "two commissioners are needed for an argument");
  Object.keys(SYS.DEBATES).forEach(k => { const x = SYS.debateFor(k, ms); assert.ok(x && x.a.plan && x.b.plan && x.a.cost > 0, k); });
});

test("life after office: the successor has a mind of their own", () => {
  assert.equal(SYS.heirKind(1, "his"), "ambitious", "the godfather's candidate owes the godfather");
  assert.equal(SYS.firstAnswer("independent", "godfather").ok, false); assert.equal(SYS.firstAnswer("grateful", "godfather").ok, true);
  const titles = new Set(); for (const k of SYS.SUCCESSOR_KINDS) for (const r of Object.keys(SYS.ROLES)) for (const o of SYS.IGNORED.opts) { const E = SYS.elderEnding(k, r, SYS.firstAnswer(k, r), o.id); assert.ok(E.title && E.line); titles.add(E.title); }
  assert.ok(titles.size >= 5, "different lives after office (" + [...titles].join(", ") + ")");
});

test("the Senate investigation is a full arc: chair, probe, the ally, the challenge", () => {
  const A = SYS.ARCS.senate.oversight; assert.ok(A && A.stages.open && A.stages.probe && A.stages.ally && A.stages.challenge);
  const take = SYS.arcChoose({ arcs: { oversight: { stage: "open", due: 1, flags: {}, hist: [] } } }, "oversight", "take", 1, () => .5, "senate");
  assert.ok(take.A.flags.ally); const pr = SYS.arcChoose({ arcs: { oversight: take.A } }, "oversight", "summon", 2, () => .5, "senate"); assert.equal(pr.A.stage, "ally", "your ally's family turns up");
  const own = SYS.arcChoose({ arcs: { oversight: { stage: "open", due: 1, flags: {}, hist: [] } } }, "oversight", "own", 1, () => .5, "senate");
  assert.equal(SYS.arcChoose({ arcs: { oversight: own.A } }, "oversight", "summon", 2, () => .5, "senate").A.stage, "challenge", "owing nobody, straight to the fight");
});
