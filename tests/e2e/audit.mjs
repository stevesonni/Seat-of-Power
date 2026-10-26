/* Button audit: plays to year 2, then on every tab clicks each visible button
   (skipping destructive and share buttons) and reports any that throw or do
   nothing. Exit 1 on a page error. Run: node tests/e2e/audit.mjs */
import fs from "node:fs";
import { open, playUntil, yearOf } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const DANGER = /share|copy|whatsapp|𝕏|fire|depose|dissolve|start over|restart|delete|second chance|buy|sack|resign|quit|accept removal|☰|fullscreen|save game|sound|voice|text size/i;
const out = [];
const g = await open(srv.port, { save: YEAR1, phone: true });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Dr\. Tunde/.test(x.textContent)); b && b.click(); }); await g.wait(500);
const r0 = await playUntil(g, t => ((yearOf(t) || {}).y || 0) >= 2 && !/Your mail/.test(t), { max: 300 });
console.log("reached year 2:", r0.ok); if (!r0.ok) { console.log((await g.txt()).slice(0, 600)); console.log(r0.clicks.slice(-40).join("\n")); process.exit(0); }
const clear = async () => { for (let i = 0; i < 6; i++) { const hit = await g.click(/^(Got it|Okay|Continue|Close|Not now|✕|← Back to the mail|Back|Cancel)$/); if (!hit) break; await g.wait(250); } await g.page.keyboard.press("Escape").catch(() => {}); };
const sig = () => g.page.evaluate(() => document.body.innerText.length + ":" + document.querySelectorAll("*").length + ":" + (document.body.innerText.slice(0, 4000)));
for (const tab of ["hub", "gov", "tre", "econ", "prj", "proc", "cast", "cab", "min", "coun", "ppl"]) {
  await clear();
  await g.page.evaluate((t) => window.postMessage({ type: "sop-nav", payload: t }, "*"), tab); await g.wait(700);
  const labels = await g.page.evaluate(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent && !b.disabled).map(b => b.innerText.trim().replace(/\s+/g, " ").slice(0, 60)).filter(Boolean));
  const uniq = [...new Set(labels)].filter(l => !/^(Desk|State|People|Compound|Today|News|💰 Treasury|Economy|Projects|Contracts|Cast|Cabinet|Ministries|Council|Public)$/.test(l)).slice(0, 25);
  for (const l of uniq) {
    if (DANGER.test(l)) continue;
    await g.page.evaluate((t) => window.postMessage({ type: "sop-nav", payload: t }, "*"), tab); await g.wait(250);
    await clear();
    const busy = await g.page.evaluate(() => document.querySelectorAll(".sop-ol").length);
    const before = await sig(), errs = g.errors.length;
    const ok = await g.page.evaluate((lab) => { const b = [...document.querySelectorAll("button")].find(x => x.offsetParent && !x.disabled && x.innerText.trim().replace(/\s+/g, " ").slice(0, 60) === lab); if (!b) return false; b.click(); return true; }, l);
    if (!ok) continue;
    await g.wait(500);
    const after = await sig();
    const res = g.errors.length > errs ? "ERROR " + g.errors.slice(errs).join(" | ").slice(0, 200) : before === after ? "NO CHANGE" + (busy ? " (overlay was open)" : "") : "ok";
    out.push([tab, l, res]);
    await clear();
  }
}
const bad = out.filter(x => x[2] !== "ok");
console.log("clicked " + out.length + " buttons; problems " + bad.length);
bad.forEach(x => console.log(x.join(" | ")));
await g.browser.close(); srv.close();
process.exit(bad.some(x => /^ERROR/.test(x[2])) ? 1 : 0);
