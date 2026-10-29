/* The Daily Decision's share link, in a browser. A friend taps the link in a
   WhatsApp share: it opens straight on today's decision; the share text ends
   with the link; closing the Daily clears it from the address. The page carries
   the link-preview tags. Run: npm run build:game, then node tests/e2e/daily-link.mjs */
import { open } from "./lib.mjs";
import { serve } from "./serve.mjs";
import * as SYS from "../../game/systems/index.js";

const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port);
const n = SYS.dayNo();
await g.page.goto(`http://localhost:${srv.port}/seat-of-power.html?daily=${n}`); await g.wait(1800);
check(/Daily Decision #/i.test(await g.txt()), "the shared link opens on today's decision");
const og = await g.page.evaluate(() => ["og:title", "og:image", "og:url"].map(p => (document.querySelector(`meta[property="${p}"]`) || {}).content || ""));
check(og.every(Boolean) && /share-card\.jpg$/.test(og[1]), "the page has the link-preview tags (" + og.join(" | ") + ")");
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button")].find(x => x.offsetParent && !x.disabled && x.getAttribute("aria-label") !== "Close"); b && b.click(); }); await g.wait(1200);
// What the WhatsApp button sends.
await g.page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
await g.click(/Share on WhatsApp/); await g.wait(300);
const sent = decodeURIComponent(((await g.page.evaluate(() => window.__opened[0])) || "").replace(/^https:\/\/wa\.me\/\?text=/, ""));
check(new RegExp("https://seatofpower\\.online/\\?daily=" + n + "$").test(sent), "the WhatsApp share ends with the link to the same decision");
await g.click(/^Done/); await g.wait(500);
check(!/daily=/.test(await g.page.evaluate(() => location.search)), "closing the Daily clears the link from the address, so a reload does not reopen it");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
