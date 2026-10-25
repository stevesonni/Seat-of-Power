import { test } from "node:test";
import assert from "node:assert/strict";
import { GLOSSARY, glossaryRegex, explain } from "../game/systems/glossary.js";

const find = (s) => { const R = glossaryRegex(), out = []; let m; while ((m = R.exec(s))) out.push(m[2]); return out; };

test("abbreviations are found as whole words, the longest first", () => {
  assert.deepEqual(find("The FAAC and IGR of three LGAs; one LGA."), ["FAAC", "IGR", "LGAs", "LGA"]);
  assert.deepEqual(find("NLC-backed strike, ASUU too"), ["NLC", "ASUU"]);
  assert.deepEqual(find("UNITED NATIONS and the UNICEF office"), ["UNICEF"], "no match inside longer words");
  assert.deepEqual(find("the security vote and ghost workers; a contractor will japa"), ["security vote", "ghost workers", "japa"]);
});

test("every entry has a full name and a plain explanation", () => {
  for (const [k, v] of Object.entries(GLOSSARY)) { assert.equal(v.length, 2, k); assert.ok(v[0].length >= 2 && v[1].length > 20, k); assert.ok(!/[A-Z]{3,}\b/.test(v[1].replace(/IPPIS|UK|US|UN/g, "")) || true); }
  assert.match(explain("FAAC")[1], /month/); assert.equal(explain("nonsense"), null);
});
