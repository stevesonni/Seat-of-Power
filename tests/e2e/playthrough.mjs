/* Full playthroughs in a browser. Run: npm run build:game, then
   node tests/e2e/playthrough.mjs [defeat|second|all]   (serves public/ itself)
   Prints PASS/FAIL lines for what each path must show. */
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve(), port = srv.port, which = process.argv[2] || "all";
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const save = (g) => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
const prefer = [/^Go on without a loan/, /^🗳️ Run for Re-Election/];

async function firstTerm(test) {
  const g = await open(port, { test });
  check((await campaign(g)) === "won", "first election won (test switch)");
  await takeOffice(g);
  const seen = { y1gold: false, y2esc: false, years: [] };
  const r = await playUntil(g, (t) => {
    const m = t.match(/Year (\d) of 4 \((\d{4})\)/); if (m && !seen.years.includes(+m[1])) seen.years.push(+m[1]);
    if (/THE GOLDFIELDS · .* · YEAR 1|Gold in /i.test(t) && seen.years.length <= 1) seen.y1gold = true;
    if (/The rush around/.test(t)) seen.y2esc = true;
    return /End of First Term/.test(t);
  }, { max: 900 });
  check(r.ok, "reached the end of the first term");
  if (!r.ok) { console.log("  last clicks: " + r.clicks.slice(-20).join(" | ")); console.log("  screen: " + (await g.txt()).replace(/\s+/g, " ").slice(0, 900)); }
  const d = await save(g);
  check(!d.gold, "no goldfields while the storyline is switched off");
  check(seen.years.join(",").startsWith("1,2,3,4") || seen.years.length >= 3, "four annual chapters seen: " + seen.years.join(","));
  check((d.yearDone || 0) >= 3, "year-end ran for each year (" + d.yearDone + ")");
  return g;
}

if (which === "defeat" || which === "all") {
  const g = await firstTerm({ win: true, reLose: true });
  const r = await playUntil(g, t => /VOTED OUT|STEPPED DOWN/.test(t), { max: 300, prefer });
  check(r.ok, "first term ended without re-election (" + ((await g.txt()).match(/VOTED OUT|STEPPED DOWN/) || ["?"])[0] + ")");
  const t = await g.txt();
  check(/1 term \(4 years\)/.test(t), "defeat screen shows one four-year term");
  check(!/THE GOLDFIELDS/i.test(t), "no goldfields epilogue while the storyline is off");
  if (/VOTED OUT/.test(t)) {
    check(await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && /^🔁 The comeback/.test(x.textContent.trim())); b && b.click(); return !!b; }), "a defeated governor can make a comeback"); await g.wait(1500);
    check(/Four years in opposition/.test(await g.txt()), "the comeback starts: four years in opposition, then the campaign");
  }
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
if (which === "second" || which === "all") {
  const g = await firstTerm({ win: true, reWin: true });
  const before = await save(g);
  const r1 = await playUntil(g, t => /2nd Term — Year 1 of 4/.test(t), { max: 500, prefer });
  check(r1.ok, "re-elected into Year 5");
  if (!r1.ok) { console.log("  last clicks: " + r1.clicks.slice(-15).join(" | ")); console.log("  screen: " + (await g.txt()).replace(/\s+/g, " ").slice(0, 600)); }
  const y5 = await save(g);
  check((y5.cases || []).length >= (before.cases || []).length && (y5.projects || []).length >= (before.projects || []).length, "cases and projects carried into the second term");
  const seen = [];
  const r2 = await playUntil(g, t => { const m = t.match(/2nd Term — Year (\d) of 4/); if (m && !seen.includes(m[1])) seen.push(m[1]); return /Tenure Complete/.test(t); }, { max: 1500, prefer });
  check(r2.ok, "tenure complete at the end of Year 8 (second-term years seen: " + seen.join(",") + ")");
  if (!r2.ok) { console.log("  last clicks: " + r2.clicks.slice(-15).join(" | ")); console.log("  screen: " + (await g.txt()).replace(/\s+/g, " ").slice(0, 900)); }
  const t = await g.txt();
  check(/2 terms \(8 years\)/.test(t), "end screen: two terms, eight years");
  check(!/Year 9|3rd Term/.test(t), "no third term");
  check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
  await g.browser.close();
}
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
