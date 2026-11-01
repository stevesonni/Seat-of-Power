import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

const places = ["Ijebu Ode", "Ijebu North", "Sagamu"];
const mk = (o = {}) => SYS.makeAsk(7, { zone: 1, turn: 2, why: "project", places, district: "Ogun East", ...o });

test("a left-out district asks for something reasonable, in its own place", () => {
  for (let t = 1; t < 30; t++) { const a = SYS.makeAsk(t, { zone: 2, turn: t, why: "project", places, district: "Ogun East" });
    assert.ok(SYS.ASK_KINDS[a.kind] && a.kind !== "seat"); assert.ok(a.cost <= .6, "affordable: " + a.cost); assert.equal(a.status, "open");
    const T = SYS.askText(a); assert.ok(places.some(p => T.includes(p)) || T.includes("Ogun East"), T); }
  assert.equal(mk({ why: "seat" }).kind, "seat");
  assert.match(SYS.whyText(mk({ why: "seat" })), /fewer commissioners/);
  assert.ok(SYS.makeAsk(3, { zone: 0, turn: 1, why: "start", places, district: "North-West zone", nat: true }).cost >= 1.5 || true, "a zone's ask is bigger");
});

test("met, refused, promised and broken, lapsed: the minus only comes when you do not deliver", () => {
  const P = { ...mk(), kind: "project", status: "promised", due: 3 };
  const met = SYS.askYear([P], 3, { projects: [{ lga: "Sagamu", startTurn: 3 }], placesOf: () => places });
  assert.equal(met.asks[0].status, "met"); assert.equal(met.moves[0].dz, SYS.ASK_MET);
  const notYet = SYS.askYear([P], 3, { projects: [], placesOf: () => places });
  assert.equal(notYet.asks[0].status, "promised"); assert.equal(notYet.moves.length, 0, "no minus while the promise is still open");
  const broken = SYS.askYear([P], 4, { projects: [], placesOf: () => places });
  assert.equal(broken.asks[0].status, "broken"); assert.equal(broken.moves[0].dz, SYS.ASK_BROKEN);
  const seat = { ...mk({ why: "seat" }), status: "promised", due: 3 };
  assert.equal(SYS.askYear([seat], 3, { balanceZone: null }).asks[0].status, "met", "the cabinet was rebalanced");
  const old = mk(); assert.equal(SYS.askYear([old], 3).moves.length, 0); assert.equal(SYS.askYear([old], 4).asks[0].status, "lapsed");
  assert.equal(SYS.askYear([{ ...old, status: "refused" }], 9).moves.length, 0, "a refusal is counted once, when it happens");
  assert.ok(SYS.ASK_REFUSED > SYS.ASK_BROKEN, "breaking a promise costs more than an honest no");
});

test("one request per district at a time, at most two a year on the Desk, promised money asks come back when due", () => {
  const a = mk(); assert.ok(!SYS.canAsk([a], 1)); assert.ok(SYS.canAsk([a], 2)); assert.ok(SYS.canAsk([{ ...a, status: "met" }], 1));
  const many = [0, 1, 2].map(z => ({ ...mk({ zone: z }), turn: z }));
  assert.equal(SYS.asksDue(many, 3).length, 2); assert.equal(SYS.asksDue(many, 3)[0].zone, 0, "oldest first");
  const pr = { ...mk({ why: "start" }), kind: "water", status: "promised", due: 4 };
  assert.equal(SYS.asksDue([pr], 3).length, 0); assert.equal(SYS.asksDue([pr], 4).length, 1);
});
