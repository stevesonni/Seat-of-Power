/* The economic letter reads as a whole letter (owner, 25 Nov 2026: "This letter makes no sense": "Your Excellency,"
   twice, then two sentences that never said what the plan was). Run: npm run build:game, then node tests/e2e/econ-letter.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const g = await open(srv.port, { save: Y1, seed: 7 });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(800);
const has = () => g.page.evaluate(() => (window.SOP.lettersTest() || []).some(x => /econ_econ_/.test(x.key)));
if (!(await has())) await playUntil(g, t => /to the world/i.test(t), { max: 400 });
check(await has(), "the economic letter arrives");
check(await g.page.evaluate(() => window.SOP.openLetterTest("econ_econ_")), "it opens"); await g.wait(900);
const t = await g.txt(), m = /Your Excellency,([\s\S]*?)Yours faithfully/.exec(t), body = m ? m[1].replace(/\s+/g, " ").trim() : "";
console.log("  " + body);
check((t.match(/Your Excellency,/g) || []).length === 1, "\"Your Excellency,\" comes once");
check(/can be sold abroad, for dollars, every year\. Buyers overseas want our /.test(body), "it says what the idea is");
check(/If you call the State Economic Council, your commissioners and the state's business people will sit today and draw up a plan to sell it abroad/.test(body), "it says what the Council would do");
check(/Today, taxes and fees bring in only ₦[\d.]+B a year\./.test(body), "the whole letter is there, figures intact");
// The Council (owner, 25 Nov 2026: "If I pick a policy that hurts Abuja shouldn't it affect my standing with the president?"):
// the chip is about what Abuja's trade policy does to your earnings, and says so.
await g.click(/Handle it personally/); await g.wait(1200); await g.click(/^Convene the State Economic Council now/); await g.wait(2500); if (/How do we pay the debt/.test(await g.txt())) { await g.click(/^Spread it over 4 years/); await g.wait(2500); }
for (let i = 0; i < 4 && !/How will .* sell its/.test(await g.txt()); i++) { await g.click(/^(Okay|On to the Council.s business)$/).catch(() => {}); await g.wait(1500); }
if (process.env.SH) await g.page.screenshot({ path: process.env.SH + '/council.png' }); if (process.env.SH) await g.page.screenshot({ path: process.env.SH + '/council.png' });
console.log("  " + (await g.txt()).replace(/\s+/g, " ").slice(0, 400));
const c = await g.txt();
check(/The President's trade policy is not yours to set, but it raises or lowers what each plan earns\./.test(c), "the Council says whose policy it is");
check(!/Abuja's policy (hurts|helps)/.test(c) && !/fishing grounds/.test(c) && !/earn from the first year/.test(c), "no muddled chip, no fishing grounds for cocoa, no first-year promise");
check(!/Abuja's trade policy: −/.test(c) || /The President: annoyed \(-4\)/.test(c), "a plan that goes against Abuja's policy says the President will be annoyed");
check(!/Abuja's trade policy/.test(c) || /Abuja's trade policy: [+−]\d+% earnings/.test(c), "any policy chip gives the effect in %");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
