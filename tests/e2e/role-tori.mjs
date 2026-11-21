/* Tori for every role: the Senator (@Sen<Name>), the LGA chairman (@<Lga>LGA) and the Ambassador
   (@NigeriaIn<Country>) each open their own Tori from the dashboard, with feeds and replies that fit the role.
   Run: npm run build:game, then node tests/e2e/role-tori.mjs */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const profile = JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP", lga: "Nsukka" });
const startRole = async (row, steps) => {
  const g = await open(srv.port, { save: { sop_profile: profile }, seed: 12, test: { aiReplies: true } });
  // The aide's drafts (server/tori-ai.mjs) are stubbed: they echo the office the game says it is, and keep the body.
  g.sent = [];
  await g.page.route("**/api/tori/replies", r => { const b = JSON.parse(r.request().postData() || "{}"); g.sent.push(b); r.fulfill({ contentType: "application/json", body: JSON.stringify({ options: [{ kind: "honest", text: "DRAFTED for " + (b.ctx || {}).office + ": " + String((b.post || {}).text || "").slice(0, 20), truth: true, reaction: "REACTED to the " + (b.ctx || {}).office, callout: "" }, { kind: "spin", text: "DRAFTED spin", truth: false, reaction: "No be so.", callout: "Ratio." }] }) }); });
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
  await g.page.evaluate(() => { const b = document.querySelector("[data-testid=tori] [data-sop-tweet=citizen] [data-sop-tori-act=reply]"); b && b.click(); }); await g.wait(1200);
  const opts = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-tori-comment]")].map(b => b.textContent));
  check(opts.some(o => /^DRAFTED for (federal senator|local government chairman|Nigerian ambassador): /.test(o)), role + ": the aide drafts replies for this post, as this office (" + (opts[0] || "").slice(0, 70) + ")");
  check(g.sent.length > 0 && !JSON.stringify(g.sent).includes("Okafor"), role + ": the aide gets the record, never the player's name");
  if (opts.length) { await g.page.evaluate(() => document.querySelector("[data-sop-tori-comment]").click()); await g.wait(400); }
  const after = await g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText);
  check(/replying to @/.test(after) && /REACTED to the /.test(after), role + ": the reply shows under the post, and the poster answers what you said");
  if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/tori-" + role + ".png" });
  check(!g.errors.length, role + ": no page errors" + (g.errors.length ? ": " + g.errors.join("; ") : ""));
}
{ const g = await startRole(/^LGA Chairman/, [/^✊The people's favourite/, /^🤝/]); await check1(g, "lga", /@NsukkaLGA/, /Nsukka|market|PHC|allocation|drainage/i); await g.browser.close(); }
{ const g = await startRole(/^Ambassador/, [/^🌍Kingdom of Ostrava/, /^🎓Career diplomat/]); await check1(g, "ambassador", /@NigeriaInOstrava/, /Ostrava|passport|embassy|traders/i); await g.browser.close(); }
{ const g = await startRole(/^Senator/, [/^✊Popular activist/]); await check1(g, "senate", /@SenOkafor/, /Senate|senator|constituency|running costs|bill/i); await g.browser.close(); }
srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
