import { test } from "node:test";
import assert from "node:assert/strict";
import { presidentWords as W, keepWord, VILLA_ART } from "../game/systems/office.js";

test("the governor's offices become the president's", () => {
  assert.equal(W("The State House of Assembly passed your budget."), "The National Assembly passed your budget.");
  assert.equal(W("Deputy Governor Ada Eze is acting Governor."), "Vice-President Ada Eze is acting President.");
  assert.equal(W("Back to Government House, Gov. Okafor."), "Back to Aso Rock Villa, President Okafor.");
  assert.equal(W("Hon. Ikechukwu Agbo, Commissioner for Information"), "Hon. Ikechukwu Agbo, Minister of Information");
  assert.equal(W("the commissioners met"), "the ministers met");
});
test("LGAs become states without touching 'the state' twice", () => {
  assert.equal(W("Roads in 12 LGAs across the state"), "Roads in 12 states across the country");
  assert.equal(W("Nigeria State"), "Nigeria");
  assert.equal(W("FAAC fell"), "the Federation Account fell");
  assert.equal(W("Oil prices fell and FAAC shrank"), "Oil prices fell and the Federation Account shrank");
});
test("the Constitution's sections follow the office", () => {
  assert.equal(W("removed under Section 188 of the Constitution"), "removed under Section 143 of the Constitution");
  assert.equal(W("S.182(1)(b) allows a second term"), "S.137(1)(b) allows a second term");
  assert.equal(W("S.285(5) gives the tribunal 180 days"), "S.285(5) gives the tribunal 180 days");
});
test("zones read as zones", () => {
  assert.equal(W("in the North-West district"), "in the North-West zone");
});
test("kept words stay a governor's", () => {
  const t = "The " + keepWord("Governors") + "' Forum met.";
  assert.equal(W(t), t);
  assert.equal(t.replace(/⁠/g, ""), "The Governors' Forum met.");
});
test("the Villa's rooms exist for every governor room", () => {
  assert.ok(Object.values(VILLA_ART).every(Boolean));
});
import { villaCharacter } from "../game/systems/office.js";
test("the deputy governor's portrait becomes the Vice-President's, the judge the Chief Justice", () => {
  assert.equal(villaCharacter("deputy-male-suit-pleased"), "vice-president-pleased");
  assert.equal(villaCharacter("deputy-northern-female-hijab-angry"), "vice-president-female-angry");
  assert.equal(villaCharacter("deputy-female-worried"), "vice-president-female");
  assert.equal(villaCharacter("judge"), "chief-justice");
  assert.equal(villaCharacter("speaker"), null);
});
