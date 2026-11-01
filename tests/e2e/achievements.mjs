/* Achievement cards (Pack 30) in a browser: earned in play, the popup, the
   shared picture, and the album. Run: npm run build:game, then
   node tests/e2e/achievements.mjs   (SHOTS=dir saves screenshots) */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const shots = process.env.SHOTS;

const g = await open(srv.port, { save: Y1 });
await g.click(/^Continue/); await g.wait(2000);
// Earned in play: approval above 75%, checked as the year moves on.
await g.page.evaluate(() => window.SOP.setS(p => ({ ...p, app: 81 })));
let popped = false;
for (let i = 0; i < 300 && !popped; i++) {
  popped = await g.page.evaluate(() => !!document.querySelector("[data-ach=favourite]"));
  if (popped) break;
  await playUntil(g, () => false, { max: 1 });
}
check(popped, "approval above 75% pops up The People's Favourite");
const t = await g.txt();
check(/People's Favourite/i.test(t) && /\d+%/.test(t) && /Share on WhatsApp/.test(t) && /Keep playing/.test(t), "the card shows the title, the number and the two buttons");
check(/Gov\. .* · .* State · \d{4}/.test(t), "the card names the governor, the state and the year");
if (shots) await g.page.screenshot({ path: shots + "/ach-popup.png" });
// Sharing: the picture is made on the phone, then WhatsApp opens.
await g.page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; navigator.canShare = () => false; HTMLAnchorElement.prototype.click = function () { window.__opened.push(this.download || this.href); }; });
await g.page.evaluate(() => document.querySelector("[data-ach] .ach-s").click()); await g.wait(2000);
const opened = await g.page.evaluate(() => window.__opened);
check(opened.some(u => /seat-of-power-favourite\.png/.test(u)) && opened.some(u => /wa\.me\/\?text=.*Favourite/.test(u)), "Share saves the picture and opens WhatsApp");
// The picture itself.
const png = await g.page.evaluate(async () => { const c = { id: "junketer", t: "Junketer-in-chief", art: "badge-junketer", n: 6, big: "6 trips abroad", line: "Your passport needs its own budget line.", who: "Gov. Wale Adegoke · Ogun State · 2030" };
  const b = await window.SOP_achPng(c); const a = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192)); return btoa(s); });
const buf = Buffer.from(png, "base64"); check(buf.length > 200000 && buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1350, "the shared picture is 1080×1350 (" + Math.round(buf.length / 1024) + " KB)");
if (shots) fs.writeFileSync(shots + "/ach-share.png", buf);
await g.page.evaluate(() => document.querySelector("[data-ach] .ach-x").click()); await g.wait(400);
check(!(await g.page.evaluate(() => !!document.querySelector("[data-ach]"))), "Keep playing closes it");
// Once only.
const again = await g.page.evaluate(() => window.SOP_earnCards({ app: 90 }).length); check(again === 0, "a card is earned once");
// Two at once queue one after the other.
await g.page.evaluate(() => window.SOP_earnCards({ trips: 6, quickWins: 5 }, "Gov. Test")); await g.wait(500);
check(await g.page.evaluate(() => document.querySelectorAll("[data-ach]").length === 1 && !!document.querySelector("[data-ach=junketer]")), "two cards come one at a time");
await g.page.evaluate(() => document.querySelector("[data-ach] .ach-x").click()); await g.wait(600);
check(await g.page.evaluate(() => !!document.querySelector("[data-ach=quick_fix]")), "then the next");
await g.page.evaluate(() => document.querySelector("[data-ach] .ach-x").click()); await g.wait(400);
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close();

// The album on the profile: earned cards in colour, the rest greyed out.
const cards = JSON.stringify({ junketer: { n: 6, line: "6 trips abroad in office. Your passport needs its own budget line.", who: "Gov. Test", at: 1 } });
const h = await open(srv.port, { save: { ...Y1, sop_cards: cards, sop_profile: JSON.stringify({ first: "Wale", last: "Adegoke", avatar: "agbada", origin: "Ogun", district: 1, leaning: "PFP" }) } });
await h.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^(Hon\. |👤Your politician)/.test(x.textContent.trim())); b && b.click(); }); await h.wait(700);
const at = await h.txt();
check(/My cards/.test(at) && /1 of 24 earned/.test(at), "the album counts the cards (" + ((at.match(/\d+ of 24 earned/) || ["?"])[0]) + ")");
await h.page.evaluate(() => { const b = [...document.querySelectorAll("[data-testid=card-album] button")].find(x => !x.disabled); b && b.click(); }); await h.wait(700);
check(await h.page.evaluate(() => !!document.querySelector("[data-ach=junketer]")), "tapping an earned card opens it to share again");
if (shots) { await h.page.evaluate(() => document.querySelector("[data-ach] .ach-x").click()); await h.wait(300); await h.page.screenshot({ path: shots + "/ach-album.png" }); }
check(!h.errors.length, "no page errors (" + h.errors.join(" | ") + ")");
await h.browser.close();
srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
