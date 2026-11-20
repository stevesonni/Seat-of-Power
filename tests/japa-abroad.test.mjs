import test from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";

test("the President's standing abroad rises with summits, approval and clean hands", () => {
  const base = SYS.abroadStanding({ trips: 0, app: 50, cor: .3 });
  assert.ok(base < SYS.JAPA_ABROAD_MIN, "a new President with no trips cannot get a country to act (" + base + ")");
  assert.ok(SYS.abroadStanding({ trips: 3, app: 50, cor: .3 }) >= SYS.JAPA_ABROAD_MIN, "three summits and state visits are enough");
  assert.ok(SYS.abroadStanding({ trips: 2, app: 70, cor: .1 }) >= SYS.JAPA_ABROAD_MIN, "fewer trips with high approval and low corruption also work");
  assert.ok(SYS.abroadStanding({ trips: 2, app: 40, cor: .6 }) < SYS.JAPA_ABROAD_MIN, "corruption and low approval keep countries away");
  assert.equal(SYS.abroadStanding({ trips: 20, app: 100, cor: 0 }), 100);
  assert.equal(SYS.abroadStanding({ trips: 0, app: 0, cor: 1 }), 0);
});
