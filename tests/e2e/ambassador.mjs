/* The Senator career in a browser: Careers menu → free play → the race →
   the Senate President election → eight sessions → re-election. Run after
   npm run build:game: node tests/e2e/senate.mjs  (serves public/ itself) */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP", lga: "Nsukka" });
const g = await open(srv.port, { save: { sop_profile: profile }, seed: 12 });
const shot = (n) => g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/ambassador-" + n + ".png" });

await g.page.mouse.click(28, 26); await g.wait(500);
check(!!(await g.click(/^Careers/)), "the menu has Careers"); await g.wait(500);
check(/Ambassador/.test(await g.txt()) && !/Coming soon/.test(await g.txt()), "Careers lists the Ambassador, and nothing is 'coming soon'");
await g.page.evaluate(() => { const row = [...document.querySelectorAll("[role=dialog] div")].find(d => /^Ambassador/.test(d.textContent.trim()) && d.querySelector("button")); row.querySelector("button").click(); });
await g.wait(900);
check(/Where are you posted/.test(await g.txt()), "the player picks a posting");
await g.click(/^🌍Kingdom of Ostrava/); await g.wait(300); await g.click(/^🎓Career diplomat/); await g.wait(600);
check(/Present your credentials/.test(await g.txt()), "the posting opens with the credentials"); await shot("start");

// Close result cards, then press the first option on the screen, until the career ends.
const closeCard = () => g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Continue|Next|To the embassy|Understood|Okay|Good)$/.test(x.textContent.trim()) && x.offsetParent); if (b) { b.click(); return true; } return false; });
const seen = new Set(); let learnSeen = false;
for (let i = 0; i < 160; i++) {
  if (await g.page.evaluate(() => /How it really works ·/.test(document.body.innerText))) learnSeen = true;
  if (await closeCard()) { await g.wait(250); continue; }
  const t = await g.txt();
  for (const k of ["from Abuja", "the consular section", "Present your credentials"]) if (new RegExp(k, "i").test(t)) seen.add(k);
  if (/Promoted|Posting complete|Recalled|Expelled/.test(t) && /ambassador's notebook/.test(t)) break;
  const hit = await g.page.evaluate(() => {
    const pref = [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && /^(Present the letter|Next half-year|Read Abuja|•)/.test(b.textContent.trim()));
    const any = pref || [...document.querySelectorAll("button")].find(b => b.offsetParent && !b.disabled && !/^(🏠|☰|‹|Back|✕|📘)/.test(b.textContent.trim()) && b.textContent.trim().length > 3);
    if (any) { any.click(); return any.textContent.trim().slice(0, 40); }
    return null;
  });
  if (!hit) break;
  await g.wait(250);
}
const t = await g.txt();
check(/Promoted|Posting complete|Recalled|Expelled/.test(t), "the posting reaches an ending (" + ((t.match(/Promoted|Posting complete|Recalled|Expelled/) || ["none"])[0]) + ")");
await shot("end");
check(seen.has("from Abuja"), "cables arrive from Abuja");
check(seen.has("the consular section"), "Nigerians in trouble come to the embassy");
check(learnSeen, "result cards teach how it really works");
const notes = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_notebook") || "[]").filter(k => k.startsWith("amb:")).length);
check(notes >= 5, "the ambassador's notebook fills (" + notes + " notes)");
const career = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_career") || "[]"));
check(/Recalled|Expelled/.test(t) || career.some(c => c.office === "ambassador"), "the posting is recorded in the career");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
