import { test } from "node:test";
import assert from "node:assert/strict";
import * as SYS from "../game/systems/index.js";
import { seeded } from "../game/systems/rng.js";

test("every cable, case and host item teaches something that exists", () => {
  [...SYS.CABLES, ...SYS.CASES, ...SYS.HOST_ITEMS].forEach(x => assert.ok(SYS.AMB_LEARN[x.learn], x.id + " → " + x.learn));
  ["appoint", "credence", "vienna", "consular"].forEach(k => assert.ok(SYS.AMB_LEARN[k], k));
});
test("the postings are invented countries", () => {
  const real = /nigeria|ghana|south africa|china|america|united|britain|england|france|germany|india|dubai|saudi|canada|japan|sudan|ukraine/i;
  Object.values(SYS.POSTINGS).forEach(p => assert.ok(!real.test(p.nm + " " + p.city), p.nm));
});
test("each half-year has a cable, a citizen's case and a host or community item, without repeats", () => {
  let S = { seen: [] };
  for (let n = 1; n <= SYS.AMB_HALVES; n++) { const a = SYS.ambAgenda("s", n, S); assert.deepEqual(a.map(x => x.k), ["cable", "case", "host"], "half " + n); a.forEach(x => assert.ok(!S.seen.includes(x.id))); S = { seen: [...S.seen, ...a.map(x => x.id)] }; }
});
test("a risky choice can blow up with Abuja and the host", () => {
  const o = SYS.CABLES[0].opts[1]; let bad = 0; for (let i = 0; i < 200; i++) if (SYS.ambChoice(o, seeded(i)).bad) bad++;
  assert.ok(bad > 10 && bad < 80);
});
test("only a strong posting with Abuja behind you leads to promotion", () => {
  assert.equal(SYS.ambEnding({ diaspora: 90, abuja: 80, host: 80, trade: 6, cor: 0 }), "promoted");
  assert.equal(SYS.ambEnding({ diaspora: 90, abuja: 30, host: 80, trade: 6, cor: 0 }), "completed");
});
