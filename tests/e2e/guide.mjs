/* The guide, as Lagos Life's wiki does it (owner, 23 Nov 2026): how to play in 5 minutes, search, topics, quick
   answers, the glossary, and "Was this helpful?". Run: npm run build:game, then node tests/e2e/guide.mjs */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { save: { sop_profile: JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" }) } });
let votes = []; g.page.on("request", r => { if (/\/api\/guide-vote$/.test(r.url())) votes.push(r.postData()); });
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.querySelector("img[src*='icon-menu']") || /menu/i.test(x.getAttribute("aria-label") || "")); b && b.click(); }); await g.wait(500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button, [role=button], div")].filter(x => x.offsetParent && /^How to play/.test(x.textContent.trim())).pop(); b && b.click(); }); await g.wait(700);
let t = await g.txt();
check(/Four things to watch/.test(t) || /The basics · 1 of 5/.test(t), "How to play opens the basics");
await g.click(/^Read the full guide$/); await g.wait(1000);
const steps = await g.page.$$eval("[data-sop-guide-step]", e => e.map(x => x.innerText.replace(/\n/g, " ")));
check(steps.length === 5 && /Win the election/.test(steps[0]) && /Desk → Mailbox/.test(steps[3]), "how to play in 5 minutes, with where to tap (" + steps.length + ")");
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/guide-home.png" });
// Search.
await g.page.fill("[data-sop-guide-search]", "impeach"); await g.wait(400);
t = await g.page.$eval("[data-sop-guide-results]", e => e.innerText).catch(() => "");
check(/result/.test(t) && /How do I avoid impeachment\?/.test(t), "search finds the quick answer about impeachment");
await g.page.fill("[data-sop-guide-search]", ""); await g.wait(300);
// A topic.
await g.page.click("[data-sop-guide-open=courts]"); await g.wait(400);
t = await g.page.$eval("[data-sop-guide-topic=courts]", e => e.innerText).catch(() => "");
check(/Courts & the law/.test(t) && /Court of Appeal/.test(t) && /Supreme Court/.test(t) && /Quick answers/.test(t), "the courts topic, with its quick answers");
// Was this helpful?
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[data-sop-guide-helpful] button")].find(x => /Yes/.test(x.textContent)); b && b.click(); }); await g.wait(500);
check(/Thank you/.test(await g.page.$eval("[data-sop-guide-helpful]", e => e.innerText)) && votes.some(v => /"page":"courts"/.test(v) && /"yes":true/.test(v)), "a vote is sent for the page (" + votes.join(",") + ")");
// Back, quick answers, glossary.
await g.click(/^← The guide$/); await g.wait(300);
await g.click(/^How to… \d+ quick answers$/); await g.wait(400);
await g.click(/^How do I restart a stalled project\?/); await g.wait(300);
t = await g.page.$eval("[data-sop-guide-howto]", e => e.innerText).catch(() => "");
check(/Add money, cut the scope/.test(t) && /More in Projects/.test(t), "a quick answer opens, with a link to its topic");
await g.click(/^← The guide$/); await g.wait(300);
await g.page.click("[data-sop-guide-open=glossary]"); await g.wait(400);
t = await g.page.$eval("[data-sop-guide-glossary]", e => e.innerText).catch(() => "");
check(/FAAC/.test(t) && /Federation Account Allocation Committee/.test(t), "the glossary in plain English");
check(/Last updated \d+ \w+ 20\d\d/.test(await g.txt()), "it says when it was last updated");
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
