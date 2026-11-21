/* Tori, round three: the big story, pictures/memes/polls, the accounts you follow, ordinary life, your aide's tones,
   pin/delete/block with their backlash, and a live Space. Run: npm run build:game, then node tests/e2e/tori-live.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.s = { ...sv.s, app: 42 }; sv.stc = { ...(sv.stc || {}), arrears: 2 };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) }, seed: 4, test: { noStrikes: true } });
await g.click(/^Continue/); await g.wait(1800);
await g.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Tunde Okafor-Ilesanmi/.test(x.textContent)); b && b.click(); }); await g.wait(1000);
let rowOn = false;
await playUntil(g, () => rowOn, { max: 80, onStep: async () => { rowOn = await g.page.evaluate(() => !!document.querySelector("[data-sop-street]")); } });
for (let i = 0; i < 3 && await g.click(/^(Continue|Okay|Got it|Later)$/); i++) await g.wait(400);
await g.page.evaluate(() => { const b = document.querySelector("[data-sop-street]"); b.scrollIntoView(); b.click(); }); await g.wait(900);
const q = (sel) => g.page.evaluate((s) => document.querySelectorAll(s).length, sel);
const T = () => g.page.evaluate(() => document.querySelector("[data-testid=tori]").innerText);
console.log("  hero: " + (await g.page.evaluate(() => (document.querySelector("[data-sop-tori-hero]") || {}).innerText || "none")).slice(0, 160).replace(/\n/g, " / "));
check(await q("[data-sop-tori-hero]") === 1 && /#PayOurSalaries/.test(await g.page.evaluate(() => document.querySelector("[data-sop-tori-hero]").innerText)), "one big story at the top (the unpaid salaries)");
const kinds = await g.page.evaluate(() => [...document.querySelectorAll("[data-sop-tori-media]")].map(e => e.getAttribute("data-sop-tori-media")));
console.log("  media: " + kinds.join(", "));
check(kinds.includes("meme") && kinds.includes("poll") && kinds.includes("photo"), "pictures, a meme with the governor's face, and a poll");
const t = await T();
check(/Aproko Desk/.test(t) && /Iyaloje of Government/.test(t) && /Naija Meme HQ/.test(t) && /Following/.test(t), "the accounts you follow post, marked Following");
check(/Eagles|jollof|owambe|Big Hustle|data|Zeeno|Tolu Starling|wedding|voice notes|Traffic|NEPA|Pastor|derby/i.test(t), "ordinary life is in the feed, not just politics");
// The aide and tones.
await g.page.evaluate(() => document.querySelector("[data-sop-tori-compose]").click()); await g.wait(400);
check(await q("[data-sop-tori-tone]") === 4, "the New Media aide offers four tones");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-tone=pidgin]").click()); await g.wait(200);
const draft = await g.page.evaluate(() => document.querySelector("[data-sop-tori-opt]").innerText);
check(/🙏🏾/.test(draft), "the draft changes with the tone (" + draft.slice(0, 60) + ")");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-opt]").click()); await g.wait(600);
const prof = await T();
check(/@opposition|Opposition|opposition/i.test(prof) && await q("[data-sop-tori-delete]") >= 1, "the opposition replies to your post within minutes; you can pin or delete it");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-pin]").click()); await g.wait(300);
check(/📌 Pinned/.test(await T()), "pinning a post");
await g.page.evaluate(() => document.querySelector("[data-sop-tori-delete]").click()); await g.wait(500);
const logs1 = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | "));
check(/deleted a post/.test(logs1), "deleting is noticed: screenshots go round");
// Block.
await g.page.evaluate(() => { const b = [...document.querySelectorAll("[role=tab]")].find(x => x.getAttribute("aria-label") === "Home"); b && b.click(); }); await g.wait(400);
await g.page.evaluate(() => { const b = document.querySelector("[data-testid=tori] [data-sop-tweet=citizen] [aria-label=More]"); b && b.click(); }); await g.wait(200);
await g.page.evaluate(() => { const b = document.querySelector("[data-sop-tori-block]"); b && b.click(); }); await g.wait(500);
const t2 = await T();
check(/blocked me 😂/.test(t2), "blocking someone: they post the screenshot");
// Space.
await g.page.evaluate(() => document.querySelector("[data-sop-tori-space]").click()); await g.wait(300);
for (let i = 0; i < 3; i++) { await g.page.evaluate(() => document.querySelector("[data-sop-tori-spacea='0']").click()); await g.wait(250); }
await g.page.evaluate(() => document.querySelector("[data-sop-tori-spaceend]").click()); await g.wait(500);
const logs2 = await g.page.evaluate(() => (window.SOP.logs || []).map(l => l.tx).join(" | "));
check(/hosted a live Space/.test(logs2) && !(await q("[data-sop-tori-space]")), "a live Space: three questions, then once a year");
// AI-written posts (server/tori-ai.mjs), when the year has them, take the citizens' place.
await g.page.evaluate(() => window.SOP.stcTest(p => ({ ...p, tori: { ...(p.tori || {}), ai: { [window.SOP.turn]: { posts: [{ name: "Chiamaka", handle: "@chiamaka_writes", sub: "nurse", art: "nurse", text: "AI-TEST: The night shift is me, one torch and 40 patients. @OgunGov", topic: "need", tone: "bad", thread: [{ name: "Emeka", handle: "@emeka01", text: "Respect to nurses fr" }] }, { name: "Kunle", handle: "@kunle_k", sub: "okada rider", art: "okada-rider", text: "AI-TEST two", topic: "life", tone: "neutral", thread: [] }] } } } })));
await g.wait(500);
const t3 = await T();
check(/AI-TEST: The night shift/.test(t3) && /Respect to nurses fr/.test(t3), "AI-written posts and their replies show in the feed");
if (process.env.SHOTS) await g.page.screenshot({ path: process.env.SHOTS + "/tori-live.png" });
check(!g.errors.length, "no page errors" + (g.errors.length ? ": " + g.errors.slice(0, 3).join(" | ") : ""));
await g.browser.close(); srv.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
