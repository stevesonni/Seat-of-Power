import { test } from "node:test";
import assert from "node:assert/strict";
import { writeBio, sentenceOf } from "../game/systems/wiki.js";

test("record entries become proper sentences about the governor", () => {
  assert.equal(sentenceOf("Kept the campaign promise to fix roads.", "He"), "He kept the campaign promise to fix roads.");
  assert.equal(sentenceOf("Went a year without a project", "She"), "She went a year without a project.");
  assert.equal(sentenceOf("Was accused of marginalising the South.", "He"), "He was accused of marginalising the South.");
  assert.equal(sentenceOf("Workers went on a general strike.", "He"), "Workers went on a general strike.");
});

const facts = {
  name: "Wale Adegoke", stateName: "Ogun", partyName: "New Republic Alliance", slogan: "Building Ogun Together", startYear: 2027, endYear: 2031, turn: 4, ended: true, exit: "He lost the 2031 election.",
  election: { marginPct: 6, zonesWon: 3, opp: "Adebayo Oyediran", oppParty: "YDM" }, deputy: "Adebayo Oladipo", flag: { nm: "Build, Build, Build", goal: "complete one trunk road in each zone" },
  flagMilestones: [{ t: 1, delivered: true }, { t: 2, delivered: false }], loan: { amount: "₦2B" }, godfather: "Chief Segun Ogunbiyi", gfDeals: [{ t: 2, note: "Promised him the next big contract, no bidding." }], gfRefusals: [], owed: 1,
  cabinet: [{ minister: "Yemisi Bamidele", name: "Health" }],
  events: [
    { turn: 3, section: "Controversies", txt: "Ignored warnings: Three women died in childbirth this month. Nurses march." },
    { turn: 3, section: "Controversies", txt: "Broke the campaign promise to “tar the roads of North zone”." },
    { turn: 2, section: "Governorship", txt: "Kept the campaign promise to “no child out of school in South zone”." },
    { turn: 2, section: "Governorship", txt: "Earned the honour “Fiscal hawk”: debt cut to half of what you inherited." },
    { turn: 1, section: "Governorship", txt: "Inherited ₦19.6B of debt from the previous administration." },
  ],
  appH: [55, 60, 41, 30, 28], app: 28, cor: .3, debtStart: 19.6, debt: 4, debtTxt: "₦4B", debtStartTxt: "₦19.6B", igrTxt: "₦11B",
  projects: { delivered: 1, building: 0, stalled: 0 }, needs: { met: 1, failed: 2, open: 0 }, ministries: 8, bills: 2,
};
const text = (b) => [...b.lead, ...b.sections.flatMap(s => s.paras || s.subs.flatMap(x => x.paras))].map(p => p.filter(x => typeof x === "string").join("")).join("\n");
test("the biography tells the term as a story, in good English", () => {
  const b = writeBio(facts), t = text(b);
  assert.match(t, /served as Governor of Ogun State from 2027 to 2031/);
  assert.match(t, /all three senatorial districts/);
  assert.match(t, /Second year \(2028–29\)|First year \(2027–28\)/.test(b.sections.find(s => s.h === "Governorship").subs.map(x => x.h).join(" ")) ? /./ : /never/);
  assert.match(t, /kept one campaign promise, “no child out of school in South zone” \(2028\)/);
  assert.match(t, /ignored warnings before a tragedy: three women died in childbirth \(2029\)/);
  assert.doesNotMatch(t, /\byou\b|\byour\b/i, "no second person");
  assert.doesNotMatch(t, /In \d{4}, [A-Z][a-z]+ed\b/, "no 'In 2030, Kept…'");
  assert.doesNotMatch(t, /this month/);
  assert.ok(b.refs.length >= 3, "facts cite their stories");
});
