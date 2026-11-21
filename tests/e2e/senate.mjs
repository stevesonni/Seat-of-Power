/* The Senator career in a browser: Careers menu → free play → the race →
   the Senate President election → eight sessions → re-election. Run after
   npm run build:game: node tests/e2e/senate.mjs  (serves public/ itself) */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" });
const g = await open(srv.port, { save: { sop_profile: profile }, seed: 11 });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/senate-" + n + ".png" });

await g.page.mouse.click(28, 26); await g.wait(500);
check(!!(await g.click(/^Careers/)), "the menu has Careers"); await g.wait(500);
check(/Senator/.test(await g.txt()), "Careers lists the Senator");
await g.page.evaluate(() => { const row = [...document.querySelectorAll("[role=dialog] div")].find(d => /^Senator/.test(d.textContent.trim()) && d.querySelector("button")); row.querySelector("button").click(); });
await g.wait(900);
check(/Who are you when you walk in/.test(await g.txt()), "free play offers backgrounds");
await g.click(/^🏛️Former governor/); await g.wait(600);
check(/The Senate race/i.test(await g.txt()), "the race begins"); await shot("race");

// Close result cards, then press the first option on the screen, until the career ends.
const closeCard = () => g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Next|Take my seat|To Abuja|Understood|Okay|Fix it|Good)$/.test(x.textContent.trim()) && x.offsetParent); if (b) { b.click(); return true; } return false; });
const seen = new Set(); let learnSeen = false;
for (let i = 0; i < 260; i++) {
  if (await g.page.evaluate(() => /How it really works ·/.test(document.body.innerText))) learnSeen = true;
  if (await closeCard()) { await g.wait(250); continue; }
  const t = await g.txt();
  // The enriched Senate: open the aide's notes once, and go home once (from session 2).
  if (!seen.has("aide") && await g.page.$("[data-sop-sen-aide]")) { await g.page.evaluate(() => document.querySelector("[data-sop-sen-aide]").click()); await g.wait(300); if (await g.page.$("[data-sop-sen-note]")) seen.add("aide"); await g.page.keyboard.press("Escape"); await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^(✕|Close|Done)$/.test(x.textContent.trim())); b && b.click(); }); await g.wait(300); continue; }
  if (!seen.has("home") && await g.page.evaluate(() => { const b = document.querySelector("[data-sop-sen-home]"); return !!(b && !b.disabled); })) { await g.page.evaluate(() => document.querySelector("[data-sop-sen-home]").click()); await g.wait(400); const ok = await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /Hold a town hall/.test(x.textContent)); b && b.click(); return !!b; }); if (ok) seen.add("home"); await g.wait(300); continue; }
  for (const k of ["The third-term amendment", "Screening:", "Run for Senate President", "Elect the Senate President", "A bill from the President", "in the witness chair", "for your district", "Sponsor a bill", "Your district decides", "has vetoed it"]) if (t.includes(k)) seen.add(k);
  if (/Re-elected|Voted out|Denied the ticket|Recalled|Defeated|Senate President|Seat declared vacant/.test(t) && /Senate notebook/.test(t)) break;
  const hit = await g.page.evaluate(() => {
    const fund = [...document.querySelectorAll("button")].filter(b => /^⬜/.test(b.textContent.trim()) && !b.disabled);
    if (fund.length && ![...document.querySelectorAll("button")].some(b => /^☑️/.test(b.textContent.trim()))) { fund[0].click(); return "fund pick"; }
    const pref = [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && /^(📣|🗳️|Approve the projects|Next session|Go home and face|🟩|⚖️Lead the override|🎤|•|📜|Count the votes|See how it ends)/.test(b.textContent.trim()));
    const out = (b) => b.closest("[data-testid=tori],[data-sop-role-tori]");
    const any = pref && !out(pref) ? pref : [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && !out(b) && !b.hasAttribute("data-sop-sen-home") && !b.hasAttribute("data-sop-sen-aide") && !/^(🏠|☰|‹|Back|✕|📘|📨)/.test(b.textContent.trim()) && b.textContent.trim().length > 3);
    if (any) { any.click(); return any.textContent.trim().slice(0, 40); }
    return null;
  });
  if (!hit) break;
  await g.wait(250);
}
const t = await g.txt();
console.log("  last screen: " + t.slice(0, 400).replace(/\n/g, " / "));
check(/Re-elected|Voted out|Denied the ticket|Recalled|Defeated|Seat declared vacant|elected you its President/.test(t), "the career reaches an ending (" + ((t.match(/Re-elected|Voted out|Denied the ticket|Recalled|Defeated|Seat declared vacant|elected you its President/) || ["none"])[0]) + ")");
await shot("end");
check(seen.has("Elect the Senate President") || /Defeated/.test(t), "the Senate President election is played");
check(seen.has("A bill from the President") || /Defeated/.test(t), "bills are voted on");
check(seen.has("aide"), "your legislative aide keeps your mail and notifications");
check(seen.has("home") || /Defeated/.test(t), "you can go home to the district and hold a town hall");
check(seen.has("Screening:") || /Defeated/.test(t), "the President's nominees come for screening");
check(seen.has("The third-term amendment") || /Defeated|Recalled/.test(t), "the third-term amendment storyline plays");
check(!learnSeen, "no \"How it really works\" boxes");
const notes = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_notebook") || "[]").length);
check(notes >= 3 || /Defeated/.test(t), "the Senate notebook fills (" + notes + " notes)");
const career = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_career") || "[]"));
check(/Defeated/.test(t) || career.some(c => c.office === "senator"), "the term is recorded in the career");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
