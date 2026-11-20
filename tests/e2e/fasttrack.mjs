/* The fast-track to Aso Rock: a player who has finished a game can start straight in the presidential race as a
   made-up two-term former governor. A first-time player is sent to the governorship. Run after npm run build:game. */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const shot = (g, n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/fast-" + n + ".png" });
const base = { first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" };
async function toPresident(g) {
  // The careers sheet on the title screen: the President row's Play.
  await g.page.click("button[aria-label=Menu]"); await g.wait(400);
  await g.page.evaluate(() => { const r = [...document.querySelectorAll("button, [role=button], div")].filter(x => /^Careers/.test(x.textContent.trim()) && x.onclick !== undefined).pop(); r && r.click(); }); await g.wait(500);
  await g.page.evaluate(() => { const row = [...document.querySelectorAll("button, div")].filter(x => /President of Nigeria/.test(x.textContent) && x.querySelector && x.querySelector("button")).pop(); const b = row && [...row.querySelectorAll("button")].find(b => /^Play$/.test(b.textContent.trim())); b && b.click(); });
  await g.wait(900);
}
{ // A seasoned player: the fast-track screen, then the primary.
  const g = await open(srv.port, { save: { sop_profile: JSON.stringify({ ...base, games: [{ office: "governor", year: 4 }] }) } });
  await toPresident(g);
  const t = await g.txt(); await shot(g, "offer");
  check(/Straight to Aso Rock/.test(t), "a seasoned player is offered the fast-track");
  check(/two-term Governor of Enugu/.test(t), "the backstory uses the player's home state");
  check(/fast-tracked|Hall of Fame/i.test(t), "it says fast-tracked runs are marked");
  check(!!(await g.click(/Declare for the presidency/)), "off Lagos Life and the shop, it opens for free"); await g.wait(1200);
  const t2 = await g.txt(); await shot(g, "race");
  check(!/Straight to Aso Rock/.test(t2) && /primary|delegate/i.test(t2), "the race starts at the party primary");
  const pres = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_pres") || "null"));
  check(pres && pres.fast === true && pres.bio && pres.bio.terms === 2, "the run is saved as fast-tracked, two terms");
  check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
  await g.browser.close();
}
{ // On the web shop, the fast-track costs ₦2,000.
  const g = await open(srv.port, { save: { sop_profile: JSON.stringify({ ...base, games: [{ office: "governor", year: 4 }] }) } });
  await g.page.evaluate(() => { window.SOP_VATAR = true; });
  await g.page.addInitScript(() => { window.SOP_VATAR = true; window.SOP_canBuy = () => true; window.SOP_buy = (id) => { window.__bought = id; return Promise.resolve(); }; });
  await g.page.reload(); await g.wait(1500);
  await toPresident(g);
  check(!!(await g.click(/Fast-track to the race · ₦2,000/)), "with the shop on, the button is the ₦2,000 purchase"); await g.wait(1200);
  check((await g.page.evaluate(() => window.__bought)) === "fast_track_president", "it buys fast_track_president");
  check(!/Straight to Aso Rock/.test(await g.txt()), "after paying, the race starts");
  await g.browser.close();
}
{ // A first-time player: the governorship first.
  const g = await open(srv.port, { save: { sop_profile: JSON.stringify(base) } });
  await toPresident(g);
  const t = await g.txt();
  check(/first game is a governorship/.test(t) && !/Declare for the presidency/.test(t), "a first-time player is sent to the governorship");
  await g.browser.close();
}
srv.close(); console.log(fails ? fails + " failed" : "all passed"); process.exit(fails ? 1 : 0);
