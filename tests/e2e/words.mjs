/* Brevity check: the words a player reads on decision screens over the first two years
   (same seed). Baseline before the brevity pass: 3,574 words on 49 screens (73 a screen).
   Run: npm run build:game, then node tests/e2e/words.mjs   (TOP=10 lists the wordiest screens) */
// Words a player reads on decision screens over two years of play (same seed).
import { open, campaign, takeOffice, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
const g = await open(srv.port, { test: { win: true }, seed: 11 });
await campaign(g); await takeOffice(g);
const seen = new Set(), all = []; let words = 0, screens = 0, turn = 0;
const grab = async () => {
  const t = await g.page.evaluate(() => {
    const sheets = [...document.querySelectorAll("div")].filter(d => { const cs = getComputedStyle(d); return cs.position === "fixed" && d.offsetHeight > innerHeight * .4 && d.innerText.trim().length > 40; });
    const el = sheets[sheets.length - 1] || document.getElementById("sop-task");
    return el ? el.innerText : "";
  });
  turn = await g.page.evaluate(() => { try { return JSON.parse(localStorage.getItem("sop_save") || "{}").turn || 0; } catch (e) { return 0; } });
  const key = t.slice(0, 120);
  if (t && !seen.has(key)) { seen.add(key); screens++; all.push([t.split(/\s+/).filter(Boolean).length, t.replace(/\s+/g, " ").slice(0, 260)]); words += t.split(/\s+/).filter(Boolean).length; }
};
g.page.on("console", () => {});
const orig = g.click; g.click = async (re) => { await grab(); return orig(re); };
const R = await playUntil(g, () => turn >= 3, { max: 400 }); if (process.env.DBG) { console.log(R.clicks.slice(-40, -20).join("\n")); console.log("ERR", g.errors.join(" | ")); console.log((await g.txt()).replace(/\s+/g, " ").slice(0, 700)); }
console.log(JSON.stringify({ turn, screens, words, perScreen: Math.round(words / Math.max(1, screens)) }));
if (process.env.TOP) all.sort((a, b) => b[0] - a[0]).slice(0, +process.env.TOP).forEach(x => console.log(x[0] + " | " + x[1]));
await g.browser.close(); srv.close();
