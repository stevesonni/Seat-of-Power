import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("where players leave: each player's last screen, counted once they have been away 30 minutes", () => {
  const now = 1e12, S = { last: { a: { v: "gov · budget", t: now - 40 * 60e3 }, b: { v: "gov · budget", t: now - 50 * 60e3 }, c: { v: "setup · step 8", t: now - 31 * 60e3 }, d: { v: "title", t: now - 60e3 } } };
  const D = SYS.dropOff(S, now);
  assert.equal(D.players, 4); assert.equal(D.left, 3); assert.equal(D.here, 1);
  assert.deepEqual(D.screens[0], { screen: "gov · budget", n: 2, pct: 66.7 });
  assert.deepEqual(SYS.dropOff({}, now), { players: 0, left: 0, here: 0, screens: [] });
});

test("the eleven pillars, the five new ones included", () => {
  ["start", "screen", "stagger", "words", "drama"].forEach(id => assert.ok(SYS.PILLAR_IDS.includes(id), id));
});

test("the short start: three moments and a live count that adds up", () => {
  assert.equal(SYS.DEAL.opts.length, 3); assert.equal(SYS.RALLY.opts.length, 3);
  const N = SYS.electionNight(5, { deal: "all", rally: "home", homeDistrict: 1 });
  assert.equal(N.shares.length, 3); N.you.forEach((y, i) => assert.equal(y + N.opp[i], N.voters[i]));
  assert.equal(N.won, N.you.reduce((a, b) => a + b, 0) > N.opp.reduce((a, b) => a + b, 0));
  assert.deepEqual(SYS.electionNight(5, { deal: "all", rally: "home" }), SYS.electionNight(5, { deal: "all", rally: "home" }), "the same night for the same choices");
  for (let i = 1; i < 30; i++) assert.ok(SYS.electionNight(i, { deal: "none", rally: "opp", forceWin: true }).won, "the test switch wins");
  let wins = { all: 0, none: 0 }; for (let i = 1; i <= 200; i++) { if (SYS.electionNight(i, { deal: "all" }).won) wins.all++; if (SYS.electionNight(i, { deal: "none" }).won) wins.none++; }
  assert.ok(wins.all > wins.none, "the godfather's money helps (" + wins.all + " v " + wins.none + ")");
  const words = [SYS.DEAL.t, SYS.DEAL.d, ...SYS.DEAL.opts.flatMap(o => [o.l, o.out]), SYS.RALLY.t, SYS.RALLY.d, ...SYS.RALLY.opts.flatMap(o => [o.l, o.out]), SYS.SWORN].join(" ").split(/\s+/).length;
  assert.ok(words < 220, "the three moments are short (" + words + " words, all options included)");
});

test("plain words: everyday words for the jargon, and cards of two sentences and 25 words", () => {
  assert.equal(SYS.plainText("APPROPRIATION BILL PASSED"), "BUDGET LAW PASSED");
  assert.equal(SYS.plainText("Appoint a Head of Service"), "Appoint a top civil servant");
  assert.equal(SYS.plainText("The Ogun State Executive Council"), "The Ogun State cabinet");
  assert.equal(SYS.plainText("Ogun East Senatorial District"), "Ogun East district");
  assert.equal(SYS.plainText("₦2B in constituency projects"), "₦2B in projects in members' home areas");
  assert.equal(SYS.plainText("Nothing to change here."), "Nothing to change here.");
  const long = "The first sentence is short. The second one goes on and on with many words that nobody needs to read before deciding anything at all today. A third.";
  const c = SYS.cut25(long); assert.ok(c.split(/\s+/).length <= 25, c); assert.equal(c, "The first sentence is short.");
  assert.equal(SYS.cut25("Short. Also short. Not this one."), "Short. Also short.");
  ["budget law", "top civil servant", "Head of Service", "Appropriation Bill", "Executive Council", "commissioner", "Speaker", "constituency", "tribunal", "impeachment", "procurement"].forEach(t => assert.ok(SYS.explain(t), t + " is in the glossary"));
});

test("headlines, the godfather's call and the five-line story", () => {
  const H = SYS.headlineFor("Cross_River", "Three jobs you can finish this year", "Fix the streetlights on the market road (₦0.3B)");
  assert.equal(H.head, "CROSS RIVER GOVERNOR: “FIX THE STREETLIGHTS ON THE MARKET ROAD”"); assert.ok(H.good);
  assert.match(SYS.headlineFor("Ogun", "The envelopes", "Say no").head, /SAYS NO/);
  assert.equal(SYS.headlineFor("Ogun", "x", "Borrow ₦2B and pay salaries in full").good, false);
  assert.equal(SYS.gfCall(20).mood, "angry"); assert.equal(SYS.gfCall(80).mood, "pleased"); assert.match(SYS.gfCall(50, "I hear things.").line, /^I hear things\./);
  const L = SYS.storyLines({ who: "Gov. A", office: "Governor of Ogun State", years: "2 terms", title: "The Builder", best: "opening the ring road", worst: null, end: "Served the full term", grade: "B" });
  assert.equal(L.length, 5); assert.match(L[3], /No scandal stuck/); assert.match(L[4], /Grade B/);
});

test("where players leave, for each half of a pillar", async () => {
  const { dropOffSplit, DROP_PILLARS } = await import("../server/experiment.mjs");
  const now = 1e12, S = { last: { a: { v: "gov · budget", t: now - 40 * 60e3 }, b: { v: "setup", t: now - 40 * 60e3 }, c: { v: "gov", t: now } }, ev: { exp_start: { values: { on: { p: { a: 1 } }, off: { p: { b: 1, c: 1 } } } } } };
  const X = dropOffSplit(S, "start", now);
  assert.deepEqual([X.on.players, X.on.left, X.on.screens[0].screen], [1, 1, "gov · budget"]);
  assert.deepEqual([X.off.players, X.off.left, X.off.here, X.off.screens[0].screen], [2, 1, 1, "setup"]);
  assert.deepEqual(dropOffSplit({}, "words", now).on, { players: 0, left: 0, here: 0, screens: [] });
  assert.deepEqual(DROP_PILLARS, ["start", "screen", "stagger", "words", "drama"]);
});

test("plain words: the state's own revenue, not IGR", () => {
  assert.equal(SYS.plainText("REVENUE CHAMPION: Ogun IGR crosses ₦13B mark"), "REVENUE CHAMPION: Ogun's own revenue crosses ₦13B mark");
  assert.equal(SYS.plainText("+₦1.5B IGR"), "+₦1.5B own revenue");
  assert.equal(SYS.plainText("IGR −₦0.5B this year"), "State's own revenue −₦0.5B this year");
  assert.ok(SYS.explain("own revenue"), "own revenue is in the glossary");
});

test("bug: a kind picked from the list is that kind (a dam stays a dam, with or without a place)", () => {
  for (const federal of [true, false]) {
    const types = federal ? SYS.FED_TYPES : Object.keys(SYS.UNIT).filter(k => !SYS.FED_ONLY.includes(k));
    for (const k of types) for (const place of ["", "Ikeja", "Bridgeport"]) {
      const r = SYS.parseProposal(k + " " + place, { lgas: ["Ikeja", "Bridgeport"], federal, type: k });
      assert.equal(r.status, "ok", k + " " + place); assert.equal(r.proposal.type, k, (federal ? "federal " : "") + k + " " + place);
    }
  }
  assert.equal(SYS.parseProposal("dam ", {}).status, "clarify", "typed text still asks when it is too short");
});
