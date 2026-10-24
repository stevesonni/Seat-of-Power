/* Investors follow good governance: a nearly finished industrial park is
   completed at the year's end, and two foreign firms write about what it
   brought them; what they commit shows on the result card and in the mail.
   Run: npm run build:game, then node tests/e2e/investors.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
import { makeProject, CONTRACTORS } from "../../game/systems/projects.js";
const srv = await serve();
const YEAR1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const honest = CONTRACTORS.slice().sort((a, b) => b.integrity - a.integrity)[0];
const p = makeProject({ id: "p_park", title: "Ota Industrial Park", type: "industrial", qty: 1, lga: "Ado-Odo/Ota", ministryId: null, approvedM: 0, thisYearM: 0, year: 1 });
Object.assign(p, { status: "in_progress", contractorId: honest.id, contractor: honest.name, approvedM: Math.round(p.estimateM * 1.1), spentM: Math.round(p.estimateM * .95), builtM: Math.round(p.estimateM * .97), progress: 97, quality: .95 });
const d = JSON.parse(YEAR1.sop_save); d.sv = 4; d.projects = [p]; d.s.cor = .2; d.s.app = 62;
const g = await open(srv.port, { save: { ...YEAR1, sop_save: JSON.stringify(d) } });
await g.click(/^Continue/); await g.wait(1800);
const r = await playUntil(g, t => /Investors are coming|investor is coming|Investors came/.test(t), { max: 300, prefer: [/^Tell the communities first/, /^Decide later this year$/] });
const t = await g.txt();
await g.page.screenshot({ path: (process.env.SHOTS || "/tmp") + "/investors.png" });
check(r.ok, "finishing the industrial park brings investors");
check(/jobs/.test(t) && /(China|United States|Sweden|Germany|Japan|🇨🇳|🇺🇸|🇸🇪|🇩🇪|🇯🇵)/u.test(t), "the card names the firms and the jobs");
await g.wait(4000); for (let i = 0; i < 4 && await g.click(/^(Okay|Got it)$/); i++) await g.wait(500);
const sv = await g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
console.log("  saved turn", sv.turn, "invJobs", (sv.s || {}).invJobs, "invIGR", (sv.s || {}).invIGR, "savedAt", sv.savedAt, Date.now());
check(((sv.s || {}).invJobs || 0) > 0 || /Holding back/.test(t), "the jobs count in the state's record");
check(!g.errors.length, "no page errors: " + g.errors.join(" | "));
await g.browser.close(); srv.close(); process.exit(fails ? 1 : 0);
