import { test } from "node:test";
import assert from "node:assert/strict";
import { campaignAdvice, electionWhy } from "../game/systems/campaign.js";

const zones = [{ id: 0, zone: "North Senatorial", support: 45, opp: 55 }, { id: 1, zone: "Central Senatorial", support: 53, opp: 47 }, { id: 2, zone: "South Senatorial", support: 52, opp: 48 }];
const picks = [{ l: "📺 Live Debate", target: "all", your: 2, opp: -1, pts: 7, cost: 0 }, { l: "🏘️ Door-to-Door Canvass", target: 0, your: 6, opp: 0, pts: 6, cost: .35 }, { l: "📋 Manifesto Drop", target: 2, your: 4, opp: 0, pts: 3, cost: .03 }];
test("the adviser names the zone that decides the race and the move that wins it", () => {
  const a = campaignAdvice({ zones, week: 2, picks });
  assert.equal(a.weakest, "North"); assert.equal(a.pick, "🏘️ Door-to-Door Canvass");
  assert.match(a.say, /losing North \(45%\)/); assert.match(a.say, /straight to North/);
});
test("it never recommends what you cannot afford", () => {
  const a = campaignAdvice({ zones, week: 2, picks, ok: (m) => (m.cost || 0) < .3 });
  assert.notEqual(a.pick, "🏘️ Door-to-Door Canvass");
});
test("the last week is plain about being behind", () => {
  const behind = zones.map(z => ({ ...z, support: z.support - 6, opp: z.opp + 6 }));
  const a = campaignAdvice({ zones: behind, week: 4, picks });
  assert.match(a.say, /You are behind/); assert.match(a.say, /last week/); assert.equal(a.mood, "worried");
});
test("answering an attack is advised", () => {
  const a = campaignAdvice({ zones, week: 3, picks: [...picks, { l: "🎤 Press Conference", target: "all", your: 3, opp: -2, pts: 4, cost: 0, answer: true }] });
  assert.equal(a.pick, "🎤 Press Conference"); assert.match(a.say, /answer it/);
});
test("after the count, one sentence on why", () => {
  assert.match(electionWhy([{ zone: "North Senatorial", won: false, yourVotes: 40, oppVotes: 60 }, { zone: "South", won: true, yourVotes: 60, oppVotes: 40 }], false), /You lost North by 20 points/);
});
