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

const bad = { ...base, app: 32, cor: .58, arrears: 3, stalled: 2, broken: 2, ratios: 1, delivered: 0, party: "PFP", needs: [{ title: "x", late: true }] };
test("heat: a failing state is trending across Nigeria, with receipts", () => {
  const H = SYS.toriHeat(bad, { heat: 50 });
  assert.ok(H.stage >= 4, "stage " + H.stage); assert.equal(H.stories[0].id, "salaries"); assert.match(H.stories[0].cause, /3 months/);
  const I = SYS.toriInstitutions(bad, H).map(x => x.handle);
  for (const h of ["@NLC_Ebonyi", "@ASUU_Ebonyi", "@BudgetWatchNG", "@EbonyiChamber", "@StateHouseNG"]) assert.ok(I.includes(h), h);
});
test("heat: a well-run state stays quiet, and the institutions stay out of it", () => {
  const good = { ...base, app: 72, cor: .15, arrears: 0, strikes: [], fled: [], needs: [], delivered: 2 };
  const H = SYS.toriHeat(good, { heat: 10 });
  assert.equal(H.stage, 0); assert.equal(SYS.toriInstitutions(good, H).length, 0);
});
test("heat carries over: it fades when low, snowballs when high", () => {
  const calm = { ...base, app: 60, cor: .2, arrears: 0, strikes: [], fled: [], needs: [], complaints: [] };
  assert.ok(SYS.toriHeat(calm, { heat: 30 }).heat < 30); assert.ok(SYS.toriHeat(calm, { heat: 80 }).heat >= 70);
});
test("year costs rise with the stage; tools have trade-offs", () => {
  assert.deepEqual(SYS.heatFx(0), {}); assert.ok(SYS.heatFx(4).app < SYS.heatFx(2).app); assert.ok(SYS.heatFx(5).house < 0);
  const H = SYS.toriHeat(bad, { heat: 50 });
  assert.ok(SYS.toolResult({ id: "bots" }, bad, H, .1).exposed, "paid influencers can be exposed"); assert.ok(SYS.toolResult({ id: "bots" }, bad, H, .9).adj < 0);
  assert.ok(SYS.toolResult({ id: "crackdown" }, bad, H, .5).later > 0, "a crackdown costs more next year");
  assert.ok(SYS.toolResult({ id: "presser" }, bad, H, .5).adj > 0, "a press conference with no record backfires");
  assert.equal(SYS.toriTools(bad, H, {})[0].id, "fix");
});
