/* The Senator career in a browser: Careers menu → free play → the race →
   the Senate President election → eight sessions → re-election. Run after
   npm run build:game: node tests/e2e/senate.mjs  (serves public/ itself) */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP", lga: "Nsukka" });
const g = await open(srv.port, { save: { sop_profile: profile }, seed: 12 });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/chairman-" + n + ".png" });

await g.page.mouse.click(28, 26); await g.wait(500);
check(!!(await g.click(/^Careers/)), "the menu has Careers"); await g.wait(500);
check(/LGA Chairman/.test(await g.txt()), "Careers lists the LGA Chairman");
await g.page.evaluate(() => { const row = [...document.querySelectorAll("[role=dialog] div")].find(d => /^LGA Chairman/.test(d.textContent.trim()) && d.querySelector("button")); row.querySelector("button").click(); });
await g.wait(900);
check(/How did you get the ticket/.test(await g.txt()) && /Nsukka/.test(await g.txt()), "the chairmanship starts in the player's home LGA");
await g.click(/^✊The people's favourite/); await g.wait(600);
check(/Make one promise/i.test(await g.txt()), "swearing-in day: make one promise"); await g.click(/^🤝/); await g.wait(600);
check(/Chairman of Nsukka/.test(await g.txt()), "sworn in as chairman"); await shot("start");

// Close result cards, then press the first option on the screen, until the career ends.
const cards = [];
const closeCard = () => g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Next|Take office|To my desk|Understood|Okay|Good)$/.test(x.textContent.trim()) && x.offsetParent); if (b) { const t = (b.parentElement && b.parentElement.innerText) || ""; b.click(); return t.slice(0, 200) || "card"; } return false; }).then(t => { if (t) cards.push(t); return t; });
const seen = new Set(); let learnSeen = false;
for (let i = 0; i < 160; i++) {
  if (await g.page.evaluate(() => /How it really works ·/.test(document.body.innerText))) learnSeen = true;
  if (await closeCard()) { await g.wait(250); continue; }
  const t = await g.txt();
  for (const k of ["The money has come down", "the council chamber", "Government House", "The council election", "It comes back", "your in-tray", "Make one promise", "The rains have come", "Handled by your staff"]) if (new RegExp(k, "i").test(t)) seen.add(k);
  if (/Re-elected|Voted out|Denied the ticket|Dissolved|Impeached/.test(t) && /chairman's notebook/.test(t)) break;
  const hit = await g.page.evaluate(() => {
    if (/your in-tray/i.test(document.body.innerText)) { const boxes = [...document.querySelectorAll("button")].filter(b => /^⬜/.test(b.textContent.trim())); if (boxes.length && [...document.querySelectorAll("button")].filter(b => /^☑️/.test(b.textContent.trim())).length < 2) { boxes[boxes.length - 1].click(); return "tray pick"; } }
    const pref = [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && /^(Handle these two|🤝|Go and see the road|🏦Accept|Next half-year|To the council election|🗳️|See how it ends|💵|•)/.test(b.textContent.trim()));
    const any = pref || [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && !/^(☰|‹|Back|✕|📘)/.test(b.textContent.trim()) && b.textContent.trim().length > 3);
    if (any) { any.click(); return any.textContent.trim().slice(0, 40); }
    return null;
  });
  if (!hit) { console.log("STUCK: " + (await g.txt()).replace(/\s+/g, " ").slice(0, 400)); break; }
  await g.wait(250);
}
const t = await g.txt();
check(/Re-elected|Voted out|Denied the ticket|Dissolved|Impeached/.test(t), "the career reaches an ending (" + ((t.match(/Re-elected|Voted out|Denied the ticket|Dissolved|Impeached/) || ["none"])[0]) + ")");
await shot("end");
check(seen.has("The money has come down") || cards.some(c => /treasurer accepted the allocation/.test(c)), "the allocation comes down through the state");
const early = /Dissolved|Impeached/.test(t); // a legitimate early end can come before every kind of card
check(early || seen.has("the council chamber") || seen.has("Government House"), "the council or the governor makes demands");
check(early || seen.has("It comes back"), "an earlier choice comes back as a callback");

check(seen.has("your in-tray") && cards.some(c => /Handled by your staff/.test(c)), "the in-tray: two matters handled, the rest delegated");
check(early || seen.has("The rains have come"), "the rainy season tests the market road");
check(/Delivery/.test(t) && /Integrity/.test(t) && /Survival/.test(t) && /Your promise/.test(t), "the verdict has four parts");
check(/Your term:/.test(t), "the ending tells the story of your actual decisions");
const rec = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_record") || "null"));
check(rec && rec.offices.some(o => o.office === "chairman") && rec.people.length >= 3, "the player record keeps the office and the people met");
check(learnSeen, "result cards teach how it really works");
const notes = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_notebook") || "[]").filter(k => k.startsWith("lga:")).length);
check(notes >= 5, "the chairman's notebook fills (" + notes + " notes)");
const career = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_career") || "[]"));
check(/Dissolved|Impeached/.test(t) || career.some(c => c.office === "chairman"), "the term is recorded in the career");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
