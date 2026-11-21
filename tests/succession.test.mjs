import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../game/systems/succession.js";
import { rivalryStart, rivalryAfter } from "../game/systems/rivalry.js";

test("the opponent on Tori is the person you beat, then the re-election opponent", () => {
  assert.equal(S.bareName("Hon. Musa Danjuma"), "Musa Danjuma");
  const a = S.toriOpponent({ turn: 2, R: null, dep: "Ngozi Eze", rival: "Hon. Musa Danjuma", rivalParty: "PDC" });
  assert.equal(a.name, "Hon. Musa Danjuma"); assert.equal(a.party, "PDC");
  const b = S.toriOpponent({ turn: 6, R: null, dep: "Ngozi Eze", rival: "Hon. Musa Danjuma", rivalParty: "PDC", reOpp: "Ngozi Eze", reOppParty: "PDC" });
  assert.equal(b.name, "Ngozi Eze");
});

test("a deputy you fell out with runs against you; a truce or no feud keeps the old rival", () => {
  const none = S.reelectionOpponent({ R: null, dep: "Ngozi Eze", rival: "Hon. Musa Danjuma", rivalParty: "PDC" });
  assert.equal(none.deputy, false); assert.equal(none.name, "Hon. Musa Danjuma");
  let R = rivalryStart(1); R = rivalryAfter(R, { id: "confront", heat: 1 }, 2);
  const foe = S.reelectionOpponent({ R, dep: "Ngozi Eze", rival: "Hon. Musa Danjuma", rivalParty: "PDC" });
  assert.equal(foe.deputy, true); assert.equal(foe.name, "Ngozi Eze"); assert.match(foe.line, /crossed to the PDC/);
  const peace = rivalryAfter(rivalryStart(1), { id: "truce", truce: true }, 2);
  assert.equal(S.reelectionOpponent({ R: peace, dep: "Ngozi Eze", rival: "Hon. Musa Danjuma", rivalParty: "PDC" }).deputy, false);
});

test("the succession: the deputy moves in year 6, you anoint in year 7, the primary decides in year 8", () => {
  const others = [{ id: "min", name: "Hon. Tunde Bello", role: "Commissioner for Works" }];
  assert.equal(S.succCard(null, 5, { dep: "Ngozi Eze", others }), null, "not before the final term's second year");
  let St = S.succStart();
  const c1 = S.succCard(St, 6, { dep: "Ngozi Eze", others });
  assert.equal(c1.id, "move"); assert.match(c1.t, /Ngozi Eze wants your seat/);
  St = S.succAfter(St, c1.opts.find(o => o.id === "wait"), 6, "Ngozi Eze");
  const c2 = S.succCard(St, 7, { dep: "Ngozi Eze", others });
  assert.equal(c2.id, "anoint"); assert.ok(c2.opts.some(o => /Anoint Hon\. Tunde Bello/.test(o.l)));
  St = S.succAfter(St, c2.opts.find(o => o.id === "anoint_min"), 7, "Ngozi Eze");
  assert.equal(St.heirName, "Hon. Tunde Bello");
  const c3 = S.succCard(St, 8, { dep: "Ngozi Eze", others, pStab: 70, app: 65 });
  assert.equal(c3.id, "primary");
  const lost = S.succAfter(St, { ...c3.opts[2], won: false }, 8, "Ngozi Eze");
  assert.equal(lost.heirName, "Ngozi Eze"); assert.equal(lost.primary, "lost"); assert.match(S.succLegacy(lost, "Ngozi Eze"), /lost the primary/);
  const won = S.succAfter(St, { ...c3.opts[2], won: true }, 8, "Ngozi Eze");
  assert.equal(won.heirName, "Hon. Tunde Bello"); assert.match(S.succLegacy(won, "Ngozi Eze"), /left the party/);
  // Blessing the deputy ends it early; a deputy at war with you gets no succession card.
  const blessed = S.succAfter(S.succStart(), c1.opts.find(o => o.id === "bless"), 6, "Ngozi Eze");
  assert.equal(blessed.over, true); assert.equal(S.succCard(blessed, 7, { dep: "Ngozi Eze", others }), null);
  const R = rivalryAfter(rivalryStart(1), { id: "confront" }, 2);
  assert.equal(S.succCard(null, 6, { dep: "Ngozi Eze", others, R }), null);
});
