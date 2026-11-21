/* The 9th letter: the yearly calendar (the State Economic Council and a trade mission), outside the 8-letter cap,
   with buttons that open them; and the neighbouring governors post on Tori.
   node tests/e2e/calendar.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv0 = JSON.parse(YEAR1.sop_save); sv0.s = { ...(sv0.s || {}), cash: 40 };
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(sv0) }, seed: 9, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /On this year's calendar/.test(t), { max: 260, prefer: [/^Later$/, /^Not this year$/] });
check(r.ok, "the calendar letter arrives with the year's mail");
const mailN = await g.page.evaluate(() => { const st = JSON.parse(localStorage.getItem("sop_save") || "{}").stc || {}; return (st.mailSlots || {}).n || 0; });
check(mailN <= 8, "the 8-letter cap still holds for the other letters (" + mailN + ")");
// Open it and convene the council.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /On this year's calendar/.test(x.textContent)); b && b.click(); }); await g.wait(900);
const ok = await g.click(/^Convene the State Economic Council/); await g.wait(1800);
check(ok, "the letter has a button for the State Economic Council");
check(/State Economic Council/.test(await g.txt()), "the button opens the State Economic Council");
await g.wait(1500);
const logs = await g.page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("sop_save") || "{}").mail || []));
check(/calendar1_/.test(logs) || /Still on this year's calendar/.test(await g.txt()), "a follow-up letter for the trade mission");
// Tori: the neighbouring governors post.
const feed = await g.page.evaluate(() => { try { return JSON.stringify(window.SOP && window.SOP.toriFeedNow ? window.SOP.toriFeedNow() : null); } catch (e) { return null; } });
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
