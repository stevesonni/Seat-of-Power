import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
const base = { st: "Ebonyi", turn: 3, year: 2029, app: 48, cor: .3, arrears: 0, house: { loyal: 16, seats: 24 }, strikes: [{ id: "asuu", short: "ASUU", years: 3 }], done: ["Abakaliki Ring Road"], fled: [{ proj: "Afikpo Water", firm: "Kestrel Construction", to: "Canada", lossM: 900, back: false }], needs: [{ title: "Pupils sit on the floor in Ezza" }], oppName: "Chief Obinna Nwafor", reporter: "Amaka Obi", speaker: "Rt. Hon. Ike Nweze", tag: "#EbonyiDecides", complaints: [{ id: "c1", who: "Tunde, graduate", t: "Una talk say una go settle the strike.", icon: "✊" }] };

test("the governor's handle follows the state", () => { assert.equal(SYS.toriHandle("Ebonyi"), "@EbonyiGov"); assert.equal(SYS.toriHandle("Akwa_Ibom"), "@AkwaIbomGov"); });
test("trends come from what is happening", () => {
  const t = SYS.toriTrends(base).map(x => x.tag);
  assert.ok(t.includes("#ASUUStrike")); assert.ok(t.includes("#EbonyiStudentsAtHome")); assert.ok(t.includes("#WhereIsOurMoney")); assert.ok(t.some(x => /IsOpen$/.test(x)));
  assert.ok(SYS.toriTrends({ ...base, arrears: 2, strikes: [] }).some(x => x.tag === "#PayOurSalariesEbonyi"));
});
test("the feed puts complaints first, mentions the governor, and is stable within a year", () => {
  const f = SYS.toriFeed(base);
  assert.equal(f[0].kind, "complaint"); assert.match(f[0].text, /@EbonyiGov/);
  assert.ok(f.some(x => /ASUU/.test(x.text))); assert.ok(f.some(x => x.kind === "press"));
  assert.deepEqual(SYS.toriFeed(base).map(x => x.text), f.map(x => x.text));
});
test("the opposition attacks on the strike, the money and low approval", () => {
  const o = SYS.toriOpposition({ ...base, app: 38 });
  assert.ok(o.some(x => /38%/.test(x.text))); assert.ok(o.some(x => /strike/.test(x.text))); assert.ok(o.some(x => /Canada/.test(x.text)));
});
test("a true post lands; a false claim is ratioed and costs approval", () => {
  const opts = SYS.toriOptions(base), sal = opts.find(o => o.id === "salaries"), strike = opts.find(o => o.id === "strike_asuu");
  assert.ok(sal && sal.truth); assert.ok(strike && !strike.truth, "no talks held: the strike claim is not true");
  const good = SYS.toriReact(sal, base, "a"), bad = SYS.toriReact(strike, base, "b");
  assert.ok(good.fx.app > 0 && !good.ratio); assert.ok(bad.ratio && bad.fx.app < 0 && bad.replies.length >= 2);
  assert.ok(SYS.toriOptions({ ...base, arrears: 2 }).some(o => o.id === "salaries_claim" && !o.truth), "with salaries owed, claiming they are paid is false");
});
