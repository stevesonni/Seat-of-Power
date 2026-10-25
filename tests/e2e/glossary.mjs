/* The glossary in the browser: the basics cards, then the full guide, where
   abbreviations are underlined; a real tap on one explains it, a tap
   elsewhere closes it, and buttons are never hijacked. node tests/e2e/glossary.mjs */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const OUT = process.env.SHOTS || "/tmp";
const g = await open(srv.port, { save: { sop_profile: JSON.stringify({ first: "Ada", last: "Okafor", avatar: "agbada", origin: "Enugu", district: 1, leaning: "PFP" }) } });
check(/you learn as you play/.test(await g.txt()), "the title promises: no politics needed");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.querySelector("img[src*='icon-menu']") || /menu/i.test(x.getAttribute("aria-label") || "")); b && b.click(); }); await g.wait(500);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button, [role=button], div")].filter(x => x.offsetParent && /^How to play/.test(x.textContent.trim())).pop(); b && b.click(); }); await g.wait(700);
let t = await g.txt();
check(/The basics · 1 of 5/.test(t) && /You are in charge/.test(t), "How to play opens the basics, card 1 of 5");
for (let i = 0; i < 4; i++) { await g.click(/^Next$/); await g.wait(250); }
t = await g.txt();
check(/You don't need to know politics/.test(t) && /Start playing/.test(t), "the last card: you learn as you play");
await g.click(/^Read the full guide$/); await g.wait(800);
t = await g.txt();
check(/The full guide/.test(t) && /How the economy grows/.test(t), "the full guide, with plain headings");
const n = await g.page.evaluate(() => (CSS.highlights && CSS.highlights.get("sop-term")) ? CSS.highlights.get("sop-term").size : -1);
check(n > 5, "abbreviations are underlined on the page (" + n + ")");
// Tap the first underlined EFCC, FAAC or IGR with a real mouse.
const pt = await g.page.evaluate(() => { const H = CSS.highlights.get("sop-term"); for (const r of H) { const w = r.toString(); if (/^(EFCC|FAAC|IGR|INEC|LGA)$/.test(w)) { r.startContainer.parentElement.scrollIntoView({ block: "center" }); const b = r.getBoundingClientRect(); if (b.width) return { x: b.left + b.width / 2, y: b.top + b.height / 2, w }; } } return null; });
check(!!pt, "an abbreviation is on screen" + (pt ? " (" + pt.w + ")" : ""));
if (pt) {
  const p2 = await g.page.evaluate((w) => { const H = CSS.highlights.get("sop-term"); for (const r of H) if (r.toString() === w) { const b = r.getBoundingClientRect(); if (b.width && b.top > 0 && b.top < innerHeight) return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } return null; }, pt.w);
  await g.page.mouse.click(p2.x, p2.y); await g.wait(400);
  const tip = await g.page.evaluate(() => document.querySelector(".sop-gloss")?.textContent || "");
  check(tip.startsWith(pt.w) && tip.length > pt.w.length + 20, "a tap explains it: " + tip.slice(0, 90));
  await g.page.screenshot({ path: OUT + "/glossary-tip.png" });
  await g.page.mouse.click(5, 5); await g.wait(300);
  check(!(await g.page.evaluate(() => !!document.querySelector(".sop-gloss"))), "a tap elsewhere closes it");
}
check(!g.errors.length, "no page errors " + g.errors.join(" | "));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
