import { open, createPolitician } from "./lib.mjs";
import { serve } from "./serve.mjs";
const port = (await serve()).port;
for (const phone of [true, false]) {
const g = await open(port, { phone });
await g.click(/^New game$/); await g.wait(600); await createPolitician(g);
await g.click(/Quick start/); await g.wait(900);
await g.page.evaluate(() => { const t = [...document.querySelectorAll("button")].find(b => /Prof\. Bola Adekunle/.test(b.textContent)); t && t.click(); }); await g.wait(300);
await g.click(/^Appoint/); await g.wait(400); await g.click(/See the ticket/); await g.wait(1500);
await g.page.evaluate(() => { const i = [...document.querySelectorAll("div")].find(d => (d.getAttribute("style")||"").includes("billboard-street")); i && i.scrollIntoView({block:"center"}); }); await g.wait(400);
await g.page.screenshot({ path: "/tmp/claude-0/-home-user-Seat-of-Power/6d547f60-c541-5156-9aeb-8af4391cce86/scratchpad/bb-" + (phone ? "phone" : "desk") + ".png" });
console.log(g.errors); await g.browser.close();
}
process.exit(0);
