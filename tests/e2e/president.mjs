/* The Presidency in a browser: a won presidential race → the oath → the
   governorship's engine at national scale (six zones, 37 states, the
   president's words). Run after npm run build:game: node tests/e2e/president.mjs */
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const zones = { NW: 48, NE: 47, NC: 55, SW: 58, SE: 66, SS: 61 };
const won = { v: 1, seed: 99, name: "Ada Okafor", avatar: "agbada", state: "Enugu", zone: "SE", party: "PFP", partyNm: "People's Front Party", from: "senator", bio: null, chest: 3, cor: .3,
  opp: { name: "Musa Bello", party: "UCP", partyNm: "Unity Congress", zone: "NW", state: "Kano" }, rivals: [], del: {}, primaryRound: 3, ious: ["a ministry for the North-Central caucus"], step: "sworn", zones,
  week: 6, log: [], pledges: ["SE"], agents: true, debated: true, lastHit: null, mate: { name: "Ibrahim Danladi", zone: "NC", kind: "partyman" }, scandal: false, k: 1, over: false,
  res: { nat: 53.4, statesWon: 21, s25: 30 }, outcome: "won" };
const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5 });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/pres-" + n + ".png" });

check(!!(await g.click(/Road to Aso Rock/)), "the title offers the presidential run"); await g.wait(900);
check(/President of the Federal Republic/.test(await g.txt()), "the race ends sworn in");
check(!!(await g.click(/Take the oath of office/)), "the winner takes the oath"); await g.wait(1500);
await shot("oath");
const r = await playUntil(g, t => /Year 2 of 4/.test(t), { max: 500 });
const t = await g.txt();
await shot("year2");
check(r.ok, "the presidency plays into its second year");
check(!/\bGovernor\b|House of Assembly|\bLGAs?\b|Commissioner/.test(t), "the screen speaks the president's words");
const left = (t.match(/[^\n]*(Governor|House of Assembly|Commissioner|LGA)[^\n]*/g) || []).slice(0, 6); if (left.length) console.log("  left:", left);
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.slice(0, 3).join(" | ") : ""));
await g.browser.close(); srv.close();
process.exit(fails ? 1 : 0);
