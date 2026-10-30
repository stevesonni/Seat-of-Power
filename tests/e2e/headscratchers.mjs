/* The headscratchers in a browser, one career at a time. Each test puts a
   chosen arc on the desk (the run's plan is random, so the save is set up
   by hand), then plays it: the badge and the clues show, a choice moves the
   arc to its next stage on the right turn, staff who are left with it take
   its "leave it" option, a chance branch follows straight away, the ending
   tells what is still unresolved, and the record carries the arc's tag to a
   later governor, who hears about it on day one.
   Run: npm run build:game, then node tests/e2e/headscratchers.mjs */
import fs from "node:fs";
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";

const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const SHOT = process.env.SHOTS;
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP", lga: "Nsukka" });
const closeCards = async (g) => { for (let i = 0; i < 6; i++) { const hit = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(Next|Continue|Okay|Take office|To my desk|To the embassy|To Abuja|Good|Understood)$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }); if (!hit) return; await g.wait(350); } };
const tap = (g, re) => g.page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && new RegExp(src).test(x.textContent.trim())); if (b) { b.click(); return b.textContent.trim().slice(0, 60); } return null; }, re.source);
const career = async (g, row) => { await g.page.mouse.click(28, 26); await g.wait(500); await g.click(/^Careers/); await g.wait(500);
  await g.page.evaluate((src) => { const r = [...document.querySelectorAll("[role=dialog] div")].find(d => new RegExp(src).test(d.textContent.trim()) && d.querySelector("button")); r.querySelector("button").click(); }, row.source); await g.wait(900); };
const store = (g, key) => g.page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
const edit = async (g, key, f) => { await g.page.evaluate(([k, src]) => { const d = JSON.parse(localStorage.getItem(k)); const fn = new Function("d", src); fn(d); localStorage.setItem(k, JSON.stringify(d)); }, [key, f]); await g.page.reload(); await g.wait(1500); };
const pics = (g) => g.page.evaluate(() => [...document.querySelectorAll("img")].filter(x => x.offsetParent).map(x => x.getAttribute("src")).join(" "));
const arc = (stage, extra = {}) => ({ stage, due: 1, truth: null, flags: {}, hist: [], done: false, ...extra });

// ── 1. The Chairman: forty drums by the school (inherited), left to burn ──
{ const g = await open(srv.port, { save: { sop_profile: profile }, seed: 21 });
  await career(g, /^LGA Chairman/); await g.click(/^✊The people's favourite/); await g.wait(600); await g.click(/^🤝/); await g.wait(600); await closeCards(g);
  await edit(g, "sop_lga", `d.arcs = { fuel: ${JSON.stringify(arc("open"))} }; d.items = [{ k: "arc", id: "fuel" }]; d.trayDone = d.n; d.purse = 200;`);
  await career(g, /^LGA Chairman/);
  let t = await g.txt();
  check(/Forty drums by the school/.test(t) && /Inherited from your predecessor/.test(t), "the chairman inherits the forty drums, and the card says so");
  check(/scenes\/drums-by-school\.webp/.test(await pics(g)) && /icons\/icon-inherited\.webp/.test(await pics(g)), "Pack 29: the drums by the school, and the inherited badge");
  if (SHOT) await g.page.screenshot({ path: SHOT + "/arc-lga-open.png" });
  check(!!(await tap(g, /^•Leave them/)), "leave them where they are"); await g.wait(500);
  t = await g.txt(); check(/This is not over/.test(t), "the result says the matter is not over"); await closeCards(g);
  let S = await store(g, "sop_lga");
  check(S.arcs.fuel.stage === "smell" && S.arcs.fuel.due === 2, "the arc moves on to the next half-year (smell, due 2)");
  check(!!(await tap(g, /^Next half-year/)), "to the next half-year"); await g.wait(700);
  t = await g.txt();
  check(/your in-tray/i.test(t) && /The storekeeper smells fuel/.test(t) && /Left alone: leave it until the court decides/.test(t), "the in-tray shows the arc, and what your staff will do if you leave it");
  // Leave it to staff: tick two other matters.
  await g.page.evaluate(() => { const boxes = [...document.querySelectorAll("button")].filter(b => /^⬜/.test(b.textContent.trim()) && !/smells fuel/.test(b.textContent)); boxes.slice(0, 2).forEach(b => b.click()); }); await g.wait(300);
  await tap(g, /^Handle these two/); await g.wait(600);
  t = await g.txt(); check(/The storekeeper smells fuel: your staff chose/.test(t), "the staff report what they did with the drums"); await closeCards(g);
  S = await store(g, "sop_lga");
  check(S.arcs.fuel.stage === "fire" && S.arcs.fuel.due === 3, "left to staff, the fuse burns: the store will catch fire next half-year");
  // Play out the half-year, then the fire.
  for (let i = 0; i < 30 && !/Next half-year/.test(await g.txt()); i++) { await closeCards(g); await tap(g, /^(🏦Accept|•|💵|Go and see the road)/); await g.wait(300); }
  await tap(g, /^Next half-year/); await g.wait(700);
  if (/your in-tray/i.test(await g.txt())) { await g.page.evaluate(() => { const boxes = [...document.querySelectorAll("button")].filter(b => /^⬜/.test(b.textContent.trim())); const f = boxes.find(b => /catches fire/.test(b.textContent)); [f, ...boxes.filter(b => b !== f)].slice(0, 2).forEach(b => b && b.click()); }); await g.wait(300); await tap(g, /^Handle these two/); await g.wait(600); await closeCards(g); }
  for (let i = 0; i < 20 && !/The store catches fire/.test(await g.txt()); i++) { await closeCards(g); await tap(g, /^(🏦Accept|•|💵)/); await g.wait(300); }
  t = await g.txt(); check(/The store catches fire/.test(t), "the fire comes, as the storekeeper warned");
  check(/scenes\/store-fire\.webp/.test(await pics(g)), "Pack 29: the store fire at the school");
  check(!!(await tap(g, /^•Blame your predecessor/)), "blame your predecessor"); await g.wait(500); await closeCards(g);
  S = await store(g, "sop_lga");
  check(S.arcs.fuel.done && S.arcs.fuel.tag === "fuel_fire", "the arc ends, tagged fuel_fire");
  const notes = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_notebook") || "[]"));
  check(notes.includes("lga:arc_fuel"), "the chairman's notebook gains the lesson, and where it really happened");
  // End the term: the verdict and the record.
  await edit(g, "sop_lga", `d.n = 6; d.items = []; d.arcs.rats = ${JSON.stringify(arc("boom", { hist: ["open:bounty"] }))};`);
  await career(g, /^LGA Chairman/); await tap(g, /^To the council election/); await g.wait(600); await tap(g, /^(🗳️|See how it ends)/); await g.wait(900); await closeCards(g);
  t = await g.txt();
  check(/Still unresolved:/.test(t) && /rats in the two wards/.test(t), "the ending names what is still unresolved");
  const rec = await store(g, "sop_record");
  check(rec && rec.offices.some(o => o.office === "chairman" && o.state === "Enugu" && (o.tags || []).includes("fuel_fire")), "the record keeps the fire, in Enugu");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 2. The Senator: the wrong button, a re-vote that follows straight away ──
{ const g = await open(srv.port, { save: { sop_profile: profile }, seed: 22 });
  await career(g, /^Senator/); await g.click(/^✊Popular activist/); await g.wait(600);
  await edit(g, "sop_senate", `d.step = "session"; d.n = 1; d.clout = 70; d.arcs = { button: ${JSON.stringify(arc("open"))} }; d.items = [{ k: "arc", id: "button" }];`);
  await career(g, /^Senator/);
  let t = await g.txt();
  check(/You pressed the wrong button/.test(t) && /Telecoms Levy/.test(t), "the senator's wrong button comes up on the order paper");
  check(/objects\/vote-console\.webp/.test(await pics(g)) && /icons\/icon-headscratcher\.webp/.test(await pics(g)), "Pack 29: the voting console on the card, and the headscratcher badge");
  check(!!(await tap(g, /^•Ask the Senate President for a re-vote/)), "ask for a re-vote"); await g.wait(500); await closeCards(g);
  t = await g.txt();
  check(/The re-vote|The record is the record/.test(t), "the Senate President's answer follows straight away (" + ((t.match(/The re-vote|The record is the record/) || ["none"])[0]) + ")");
  if (SHOT) await g.page.screenshot({ path: SHOT + "/arc-senate.png" });
  await tap(g, /^•/); await g.wait(500); await closeCards(g);
  let S = await store(g, "sop_senate");
  check(S.arcs.button.done && /^button_/.test(S.arcs.button.tag), "the arc ends with a tag (" + S.arcs.button.tag + ")");
  // The Mrs Okeke arc: a chest the player cannot spend is refused with a reason.
  await edit(g, "sop_senate", `d.chest = 0.1; d.arcs.fakenews = ${JSON.stringify(arc("arrests", { hist: ["open:sponsor"] }))}; d.items = [{ k: "arc", id: "fakenews" }];`);
  await career(g, /^Senator/);
  t = await g.txt(); check(/Your law, used at home/.test(t) && /Your war chest is too low/.test(t), "an option the war chest cannot pay for is shown, with the reason");
  await tap(g, /^•Move to repeal/); await g.wait(500); await closeCards(g);
  // End the term through re-election: the record carries the tags.
  await edit(g, "sop_senate", `d.step = "reelect"; d.items = [];`);
  await career(g, /^Senator/); await tap(g, /^(🗳️|See how it ends)/); await g.wait(1000); await closeCards(g);
  t = await g.txt(); check(/Your term:/.test(t) || /Senate notebook/.test(t), "the senator's ending shows");
  const rec = await store(g, "sop_record");
  check(rec && rec.offices.some(o => o.office === "senator" && (o.tags || []).some(x => /^button_|^fakenews_/.test(x))), "the record keeps the senator's arcs");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 3. The Ambassador: 180 seats; a trusting host clears families, a community you served finds them ──
{ const g = await open(srv.port, { save: { sop_profile: profile }, seed: 23 });
  await career(g, /^Ambassador/); await g.click(/^🌍Kingdom of Ostrava/); await g.wait(300); await g.click(/^🎓Career diplomat/); await g.wait(600);
  await edit(g, "sop_amb", `d.step = "half"; d.host = 70; d.diaspora = 70; d.arcs = { list: ${JSON.stringify(arc("open"))} }; d.seen = ["evacuate"]; d.items = [{ k: "arc", id: "list" }];`);
  await career(g, /^Ambassador/);
  let t = await g.txt();
  check(/180 seats, 400 names/.test(t) && /Kessenburg/.test(t), "the evacuation card names the posting's city");
  check(/objects\/evacuation-list\.webp/.test(await pics(g)), "Pack 29: the evacuation list on the card");
  if (SHOT) await g.page.screenshot({ path: SHOT + "/arc-amb-list.png" });
  await tap(g, /^•Get the host to clear whole families/); await g.wait(500); await closeCards(g);
  t = await g.txt(); check(/Families cleared in a day/.test(t), "a host that trusts you clears whole families, straight away");
  check(/scenes\/families-boarding\.webp/.test(await pics(g)), "Pack 29: families boarding together");
  await tap(g, /^•Fly them/); await g.wait(500); await closeCards(g);
  let S = await store(g, "sop_amb");
  check(S.arcs.list.stage === "second" && S.helped >= 1, "families fly together; the second plane is next half-year");
  check(!!(await tap(g, /^Next half-year/)), "to the next half-year"); await g.wait(700);
  for (let i = 0; i < 12 && !/The second plane/.test(await g.txt()); i++) { await closeCards(g); await tap(g, /^•/); await g.wait(300); }
  t = await g.txt(); check(/every family on your list/.test(t), "the community you looked after finds every family");
  await tap(g, /^•Fill the plane/); await g.wait(500); await closeCards(g);
  S = await store(g, "sop_amb");
  check(S.arcs.list.tag === "evac_done", "everyone is home: evac_done");
  // The posting ends: the record.
  await edit(g, "sop_amb", `d.n = 6; d.items = [];`);
  await career(g, /^Ambassador/); await tap(g, /^Read Abuja's verdict/); await g.wait(900); await closeCards(g);
  t = await g.txt(); check(/Your posting:/.test(t), "the ambassador's ending tells the story of the posting");
  const rec = await store(g, "sop_record");
  check(rec && rec.offices.some(o => o.office === "ambassador" && (o.tags || []).includes("evac_done")), "the record keeps the evacuation");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

// ── 4. A later governor hears about it on day one ──
{ const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
  const rec = { v: 1, offices: [{ office: "chairman", state: "Ogun", place: "Ijebu Ode", tags: ["fuel_fire"] }, { office: "ambassador", state: null, tags: ["evac_done"] }], tags: [], people: [], lifetimeCor: 0 };
  const g = await open(srv.port, { save: { ...Y1, sop_record: JSON.stringify(rec) } });
  await g.click(/^Continue/); await g.wait(2500);
  const t = await g.txt();
  check(/meets you/.test(t) && /council store fire/.test(t), "the new governor of Ogun hears about the fire from the chairmanship");
  const logs = await g.page.evaluate(() => { const s = JSON.parse(localStorage.getItem("sop_save") || "{}"); return JSON.stringify(s.logs || []); });
  check(/Families you flew home/.test(logs) || /Families you flew home/.test(t), "and about the families flown home as ambassador");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close(); }

srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
