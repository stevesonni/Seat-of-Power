import { test } from "node:test";
import assert from "node:assert/strict";
import { pressHostile, pressGain, spinPaper, spinPost, anchorSneer } from "../game/systems/press.js";
import { pressSpin } from "../game/systems/tori.js";

test("the press turns hostile below 50 and is balanced again only from 52", () => {
  assert.equal(pressHostile(49, false), true); assert.equal(pressHostile(50, false), false);
  assert.equal(pressHostile(51, true), true); assert.equal(pressHostile(52, true), false); assert.equal(pressHostile(55, true), false);
});
test("while hostile, gains are halved and losses untouched", () => {
  assert.equal(pressGain(4, true), 2); assert.equal(pressGain(-4, true), -4); assert.equal(pressGain(4, false), 4);
});
test("good news becomes a hostile headline; the facts move beneath it", () => {
  const P = spinPaper("NIGERIA SECURES THE HAGUE DEAL", "The ICJ backs Nigeria's claim", true, 3);
  assert.equal(P.good, false); assert.notEqual(P.headline, "NIGERIA SECURES THE HAGUE DEAL");
  assert.match(P.headline, /PAPER|GIVES AWAY|BENEFITS|PHOTO-OP/); assert.equal(P.sub, "The ICJ backs Nigeria's claim");
  const R = spinPaper("IKWO ROAD OPENS", "", true, 1); assert.match(R.headline, /LATE|CAMERAS|RIBBON|TOO LITTLE/); assert.equal(R.sub, "IKWO ROAD OPENS");
  const M = spinPaper("₦5B REFUND PAID INTO THE TREASURY", "", true, 2); assert.match(M.headline, /MONEY|REPAY|WINDFALL/);
  for (const h of ["A VERY LONG HEADLINE ABOUT THE NEW ROAD THAT WAS COMMISSIONED IN THE CAPITAL TODAY", "X"]) assert.ok(spinPaper(h, "", true, 0).headline.length <= 84 || h === "X");
});
test("bad news is made worse", () => { const P = spinPaper("FLOODS IN LOKOJA", "", false, 0); assert.equal(P.good, false); assert.match(P.headline, /FLOODS IN LOKOJA/); assert.notEqual(P.headline, "FLOODS IN LOKOJA"); });
test("Tori: press posts are spun when hostile; ordinary people are not; balanced press is untouched", () => {
  const posts = [{ kind: "news", art: "anchor-female", text: "The Governor opened the Ikwo Road.", tone: "good", topic: "praise" }, { kind: "citizen", art: "young-voter-student", text: "Finally a road!", tone: "good" },
    { kind: "citizen", buzz: true, art: "reporter", text: "Nigeria will host the qualifier.", tone: "good" }];
  const H = pressSpin(posts, { hostilePress: true, turn: 2 });
  assert.notEqual(H[0].text, posts[0].text); assert.match(H[0].text, /^The Governor opened the Ikwo Road\. /); assert.equal(H[0].tone, "bad");
  assert.equal(H[1].text, posts[1].text); assert.notEqual(H[2].text, posts[2].text);
  assert.deepEqual(pressSpin(posts, { hostilePress: false }), posts);
  assert.equal(spinPost(H[0].text, 2), H[0].text); assert.ok(anchorSneer("x").length > 10);
});
