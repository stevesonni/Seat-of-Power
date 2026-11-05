/* The phone's back button stays in the game: it steps back (closes the sheet on top, or the screen's
   own Back), and with nothing to step back to it says the game is saved. It never leaves the page. */
import { open, createPolitician, campaign, takeOffice } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const g = await open(srv.port, { test: { win: true } });
// A page behind the game (as the Lagos Life app has), so "back" could really leave.
{ const u = g.page.url(); await g.page.goto("about:blank"); await g.page.goto(u); await g.wait(2500); }
const url0 = g.page.url(), back = async () => { await g.page.goBack({ timeout: 3000 }).catch(() => {}); await g.wait(700); };
// The title screen: back stays here and says the game is saved.
await back(); check(g.page.url() === url0 && /New game|Continue/.test(await g.txt()), "back on the title screen stays in the game");
// Making a politician: back steps back a screen, it does not leave.
await g.click(/^New game$/); await g.wait(900);
const t1 = await g.txt(); await back();
check(g.page.url() === url0, "back during setup stays on the page");
// Governing: open the menu sheet, back closes it; back again stays.
check(await campaign(g) === "won", "campaign won"); await takeOffice(g);
await back(); await back();
check(g.page.url() === url0 && /Desk|State|People/.test(await g.txt()), "back while governing keeps the game");
const saved = await g.page.evaluate(() => !!localStorage.getItem("sop_save"));
check(saved, "the game is saved");
const errs = g.errors.filter(e => !/Access is denied for this document/.test(e)); // the test's own setup on about:blank
check(!errs.length, "no page errors (" + errs.join(" | ") + ")");
await g.browser.close(); srv.close && srv.close(); process.exit(fails ? 1 : 0);
