/* The army's jets and drones go to procurement under the Ministry of
   Defence. With no Ministry of Defence, the adviser says so and the button
   opens its creation, with a minister to appoint. node tests/e2e/defence.mjs */
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
const g = await open(srv.port, { save: { sop_profile: profile, sop_pres: JSON.stringify(won) }, seed: 5, test: { card: "jets" } });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/pres-" + n + ".png" });

check(!!(await g.click(/Road to Aso Rock/)), "the title offers the presidential run"); await g.wait(900);
check(/President of the Federal Republic/.test(await g.txt()), "the race ends sworn in");
check(!!(await g.click(/Take the oath of office/)), "the winner takes the oath"); await g.wait(1500);
await shot("oath");
// The inauguration at Eagle Square: the oath, three commitments, the address.
check(/The oath of office/.test(await g.txt()), "the inauguration opens at Eagle Square");
await g.click(/^✋ Take the oath$/); await g.wait(600);
check(/Three commitments/.test(await g.txt()), "sworn in: choose three commitments");
for (const re of [/Steady electricity/, /Jobs for young people/, /End grand corruption/]) { await g.page.evaluate((src) => { const b = [...document.querySelectorAll("[aria-label=Inauguration] button")].find(x => new RegExp(src).test(x.textContent)); b && b.click(); }, re.source); await g.wait(150); }
await g.click(/^Next: the address$/); await g.wait(500);
await shot("address");
check(!!(await g.click(/Deliver the address/)), "the inaugural address is delivered"); await g.wait(1200);
// No Ministry of Defence in this cabinet.
const drop = () => g.page.evaluate(() => { const S = window.SOP; if (S && S.ministries && S.ministries.some(m => m.id === "sec")) S.setMinistries(S.ministries.filter(m => m.id !== "sec")); });
const r = await playUntil(g, t => /Approve it, through open procurement/.test(t), { max: 300, onStep: drop, prefer: [/The army wants new jets and drones/, /^✍️ Handle it personally$/] });
check(r.ok, "the army's request for jets and drones arrives"); if (!r.ok) { console.log("  last clicks:", r.clicks.slice(-12).join(" / ")); console.log("  screen:", (await g.txt()).slice(0, 600).replace(/\n/g, " · ")); }
await drop(); await g.wait(300);
check(!!(await g.click(/through open procurement/)), "approve it through open procurement"); await g.wait(2500);
for (let i = 0; i < 6 && !/we do not have one/.test(await g.txt()); i++) { await g.click(/^(Got it|Okay|Continue|Good)$/); await g.wait(600); }
check(/Ministry of Defence, and we do not have one/.test(await g.txt()), "the adviser: it must go through the Ministry of Defence, and there is none");
await shot("defence-ask");
check(!!(await g.click(/^Create the Ministry of Defence$/)), "the button to create it"); await g.wait(1200);
const t = await g.txt();
check(/Defence/.test(t) && /(Swear in|Create and swear in|Appoint)/i.test(t), "the ministry opens for creation, with a minister to choose");
await shot("defence-create");
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
check(sv.stc && sv.stc.defProc && sv.stc.defProc.status === "waiting", "the order waits for the ministry");
console.log(g.errors.length ? "errors: " + g.errors.join(" | ") : "no page errors"); check(!g.errors.length, "no page errors");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
