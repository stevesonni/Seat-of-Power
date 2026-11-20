/* Tori for every role: the Senator (@Sen<Name>), the LGA chairman (@<Lga>LGA) and the Ambassador
   (@NigeriaIn<Country>) each open their own Tori from the dashboard, with feeds and replies that fit the role.
   Run: npm run build:game, then node tests/e2e/role-tori.mjs */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP", lga: "Nsukka" });
const startRole = async (row, steps) => {
  const g = await open(srv.port, { save: { sop_profile: profile }, seed: 12 });
  await g.page.mouse.click(28, 26); await g.wait(500); await g.click(/^Careers/); await g.wait(500);
  await g.page.evaluate((src) => { const r = [...document.querySelectorAll("[role=dialog] div")].find(d => new RegExp(src).test(d.textContent.trim()) && d.querySelector("button")); r && r.querySelector("button").click(); }, row.source); await g.wait(900);
  for (const re of steps) { await g.click(re); await g.wait(600); }
  // Press on until the dashboard (with its Tori row) is up.
  for (let i = 0; i < 40 && !(await g.page.$("[data-sop-role-tori]")); i++) {
    await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(x => x.offsetParent && !x.disabled && !/Back|Home|Menu|✕/.test(x.textContent + (x.getAttribute("aria-label") || ""))); const pick = b.find(x => /^(Continue|Next|Take office|To my desk|Understood|Okay|Good|Present|Begin|Go)/.test(x.textContent.trim())) || b.find(x => x.classList.contains("opt") || x.classList.contains("ds-option")) || b[b.length - 1]; pick && pick.click(); }); await g.wait(500); }
  return g;
};
async function check1(g, role, handleRe, feedRe) {
  const has = !!(await g.page.$("[data-sop-role-tori]"));
  check(has, role + ": the dashboard has a Tori row");
  if (!has) { console.log("  screen:", (await g.txt()).slice(0, 300).replace(/\n/g, " · ")); return; }
  await g.page.evaluate(() => { const b = document.querySelector("[data-sop-role-tori]"); b.scrollIntoView(); b.click(); }); await g.wait(800);
  const t = await g.page.evaluate(() => { const e = document.querySelector("[data-testid=tori]"); return e ? e.innerText : ""; });
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-testid=tori] [role=tab]")].find(x => x.getAttribute("aria-label") === "Profile"); b && b.click(); }); await g.wait(300);
  const me = await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText);
  check(handleRe.test(me), role + ": its own account (" + (me.match(handleRe) || [""])[0] + ")");
  check(feedRe.test(t), role + ": a feed about its own world");
  await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-testid=tori] [role=tab]")].find(x => x.getAttribute("aria-label") === "Home"); b && b.click(); }); await g.wait(300);
  await g.page.evaluate(() => { const b = document.querySelector("[data-testid=tori] [data-sop-tweet=citizen] [data-sop-tori-act=reply]"); b && b.click(); }); await g.wait(300);
  const opts = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-tori-comment]")].map(b => b.textContent));
  check(opts.length >= 2 && !opts.some(o => /^Thank you! This is just the beginning/.test(o)), role + ": reply options fit the post (" + opts.slice(0, 2).join(" / ").slice(0, 120) + ")");
  if (opts.length) { await g.page.evaluate(() => document.querySelector("[data-sop-tori-comment]").click()); await g.wait(400); }
  const after = await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText);
  check(/replying to @/.test(after), role + ": the reply shows under the post, and people answer");
  if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/tori-" + role + ".png" });
  check(!g.errors.length, role + ": no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
}
{ const g = await startRole(/^LGA Chairman/, [/^✊The people's favourite/, /^🤝/]); await check1(g, "lga", /@NsukkaLGA/, /Nsukka|market|PHC|allocation|drainage/i); await g.browser.close(); }
{ const g = await startRole(/^Ambassador/, [/^🌍Kingdom of Ostrava/, /^🎓Career diplomat/]); await check1(g, "ambassador", /@NigeriaInOstrava/, /Ostrava|passport|embassy|traders/i); await g.browser.close(); }
{ const g = await startRole(/^Senator/, [/^✊Popular activist/]); await check1(g, "senate", /@SenOkafor/, /Senate|senator|constituency|running costs|bill/i); await g.browser.close(); }
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
