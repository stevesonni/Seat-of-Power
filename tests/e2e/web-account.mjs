/* Your game on every device (seatofpower.online): a signed-in player's saves go to their account, and a second
   device signed in to the same account gets the game. Different games on the two devices: the player picks one;
   the other is kept. Starts the real server with test keys and a made-up session (no Google call).
   Run: npm run build:game, then node tests/e2e/web-account.mjs */
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { CHROME } from "./lib.mjs";
const req = createRequire(import.meta.url);
const { chromium } = (() => { for (const m of ["playwright-core", "playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return req(m); } catch (e) {} } })();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const port = 18000 + Math.floor(Math.random() * 1000), data = fs.mkdtempSync(path.join(os.tmpdir(), "sop-web-")), SS = "test-shop-secret";
const srv = spawn(process.execPath, ["server/vatar-server.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: data, VATAR_SECRET: "", WEB_SHOP: "1", PAYSTACK_SECRET_KEY: "sk_test_x", PAYSTACK_PUBLIC_KEY: "pk_test_x", GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com", SHOP_SECRET: SS }, stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const b64 = (x) => Buffer.from(x).toString("base64url");
const token = (acct) => { const body = b64(JSON.stringify({ a: acct, e: "player@example.com", x: Date.now() + 864e5 })); return body + "." + crypto.createHmac("sha256", SS).update(body).digest("base64url"); };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const browser = await chromium.launch({ executablePath: CHROME });
async function device(store) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|accounts\.google\.com/, r => r.abort());
  await ctx.addInitScript((st) => { if (!sessionStorage.getItem("seeded")) { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); sessionStorage.setItem("seeded", "1"); } }, store);
  const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://localhost:" + port + "/seat-of-power.html"); await page.waitForTimeout(4000);
  return { ctx, page, errors };
}
const ACCT = "w_testaccount0001", T = token(ACCT);
// Device A: has a game and signs in (the token is there): the game goes up.
const A = await device({ ...Y1, sop_web_token: T });
await A.page.waitForTimeout(1500);
const onServer = () => { try { return JSON.parse(fs.readFileSync(fs.readdirSync(data, { recursive: true }).map(f => path.join(data, f)).find(f => /w_testaccount0001/.test(f)), "utf8")); } catch (e) { return null; } };
const p1 = onServer();
check(p1 && p1.data && p1.data.sop_save && JSON.parse(p1.data.sop_save).turn === JSON.parse(Y1.sop_save).turn, "device A's game is saved to the account");
check(await A.page.evaluate(() => !!window.SOP_webSignIn && !!window.SOP_WEB_ACCOUNT), "the website offers the account, and knows it is signed in");
await A.ctx.close();
// Device B: empty, signed in to the same account: it gets the game and reloads into it.
const B = await device({ sop_web_token: T });
await B.page.waitForTimeout(3000);
const bSave = await B.page.evaluate(() => localStorage.getItem("sop_save"));
check(!!bSave && JSON.parse(bSave).turn === JSON.parse(Y1.sop_save).turn, "device B gets the same game");
check(/Continue/.test(await B.page.evaluate(() => document.body.innerText)), "device B's title screen offers to continue it");
await B.ctx.close();
// Device C: its own, different game: the player is asked which to keep; the other is kept on the server.
const other = JSON.parse(Y1.sop_save); other.setup = { ...other.setup, nm: "Ngozi Eze", state: "Enugu" }; other.savedAt = Date.now();
const C = await device({ ...Y1, sop_save: JSON.stringify(other), sop_web_token: T });
const asked = await C.page.evaluate(() => /Which game do you want to play\?/.test(document.body.innerText));
check(asked, "different games: the player is asked which one to play");
await C.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /\(this device\)/.test(x.textContent)); b && b.click(); }); await C.page.waitForTimeout(2000);
const p3 = onServer();
check(p3 && /Ngozi Eze/.test(p3.data.sop_save) && (p3.bak || []).some(b => !/Ngozi Eze/.test(b.v)), "the device's game becomes the account's; the other is kept as an earlier career");
const errs = [...A.errors, ...B.errors, ...C.errors]; check(!errs.length, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
await browser.close(); srv.kill(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
