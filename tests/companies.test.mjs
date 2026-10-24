import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCompanyName, COMPANY_SECTORS, registerCompanies, eligible, contractorById, SECTORS } from "../game/systems/index.js";

test("a fair invented name passes and gets a company suffix", () => {
  assert.deepEqual(checkCompanyName("sunny construction"), { ok: true, name: "Sunny Construction" });
  assert.deepEqual(checkCompanyName("Adaeze & Sons"), { ok: true, name: "Adaeze & Sons" });
  assert.equal(checkCompanyName("Okeke Medical").name, "Okeke Medical Ltd");
  assert.equal(checkCompanyName("Cuba Works").ok, true, "short blocked words only match whole words");
});
test("real firms, politicians, rude words and junk are refused", () => {
  for (const n of ["Dangote Builders", "Julius Berger Nig", "UBA Construction", "MTN Works", "Tinubu Holdings", "Peter Obi Ltd", "Fuckers Ltd", "ab", "!!!!", "Zzzzzz Ltd", "x".repeat(40), "Ashawo Ventures"])
    assert.equal(checkCompanyName(n).ok, false, n);
});
test("company sectors are the game's sectors", () => { COMPANY_SECTORS.forEach(k => assert.ok(SECTORS[k], k)); });
test("player companies bid in their sector, most hired first, own company always shown", () => {
  registerCompanies([
    { id: "pc_aaaa1", name: "Alpha Health Ltd", sector: "health", hires: 2 },
    { id: "pc_aaaa2", name: "Beta Health Ltd", sector: "health", hires: 9 },
    { id: "pc_aaaa3", name: "Gamma Health Ltd", sector: "health", hires: 5 },
    { id: "pc_aaaa4", name: "Delta Health Ltd", sector: "health", hires: 1 },
    { id: "pc_mine01", name: "My Clinic Builders", sector: "health", hires: 0 },
    { id: "pc_roads1", name: "Road Kings Ltd", sector: "roads", hires: 50 },
    { id: "bad id", name: "Nope", sector: "health" },
  ], "pc_mine01");
  const list = eligible("hospital", []), pc = list.filter(c => c.player);
  assert.deepEqual(pc.map(c => c.id), ["pc_mine01", "pc_aaaa2", "pc_aaaa3", "pc_aaaa1"]);
  assert.ok(list.some(c => c.id === "medibuild"), "the regular roster still bids");
  assert.ok(!list.some(c => c.id === "pc_roads1"), "a roads company does not bid for a hospital");
  assert.equal(contractorById("pc_mine01").mine, true);
  // Refreshing updates in place; a hidden company stops bidding but saves still find it.
  registerCompanies([{ id: "pc_aaaa2", name: "Beta Health Ltd", sector: "health", hires: 9, hidden: true }]);
  assert.ok(!eligible("hospital", []).some(c => c.id === "pc_aaaa2"));
  assert.equal(contractorById("pc_aaaa2").name, "Beta Health Ltd");
});
