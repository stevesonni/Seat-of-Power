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
await g.click(/^✊Popular activist/); await g.wait(600);
check(/The Senate race/i.test(await g.txt()), "the race begins"); await shot("race");

// Close result cards, then press the first option on the screen, until the career ends.
const closeCard = () => g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Next|Take my seat|To Abuja|Understood|Okay|Fix it|Good)$/.test(x.textContent.trim()) && x.offsetParent); if (b) { b.click(); return true; } return false; });
const seen = new Set(); let learnSeen = false;
for (let i = 0; i < 160; i++) {
  if (await g.page.evaluate(() => /How it really works ·/.test(document.body.innerText))) learnSeen = true;
  if (await closeCard()) { await g.wait(250); continue; }
  const t = await g.txt();
  for (const k of ["Elect the Senate President", "A bill from the President", "in the witness chair", "for your district", "Sponsor a bill", "Your district decides", "has vetoed it"]) if (t.includes(k)) seen.add(k);
  if (/Re-elected|Voted out|Denied the ticket|Recalled|Defeated/.test(t) && /Senate notebook/.test(t)) break;
  const hit = await g.page.evaluate(() => {
    const fund = [...document.querySelectorAll("button")].filter(b => /^⬜/.test(b.textContent.trim()) && !b.disabled);
    if (fund.length && ![...document.querySelectorAll("button")].some(b => /^☑️/.test(b.textContent.trim()))) { fund[0].click(); return "fund pick"; }
    const pref = [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && /^(🗳️|Approve the projects|Next session|Go home and face|🟩|⚖️Lead the override|🎤|•|📜|Count the votes|See how it ends)/.test(b.textContent.trim()));
    const any = pref || [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && !/^(🏠|☰|‹|Back|✕|📘)/.test(b.textContent.trim()) && b.textContent.trim().length > 3);
    if (any) { any.click(); return any.textContent.trim().slice(0, 40); }
    return null;
  });
  if (!hit) break;
  await g.wait(250);
}
const t = await g.txt();
check(/Re-elected|Voted out|Denied the ticket|Recalled|Defeated/.test(t), "the career reaches an ending (" + ((t.match(/Re-elected|Voted out|Denied the ticket|Recalled|Defeated/) || ["none"])[0]) + ")");
await shot("end");
check(seen.has("Elect the Senate President") || /Defeated/.test(t), "the Senate President election is played");
check(seen.has("A bill from the President") || /Defeated/.test(t), "bills are voted on");
check(learnSeen, "result cards teach how it really works");
const notes = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_notebook") || "[]").length);
check(notes >= 3 || /Defeated/.test(t), "the Senate notebook fills (" + notes + " notes)");
const career = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_career") || "[]"));
check(/Defeated/.test(t) || career.some(c => c.office === "senator"), "the term is recorded in the career");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
