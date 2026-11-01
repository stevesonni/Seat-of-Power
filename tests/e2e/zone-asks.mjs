/* Districts ask before they sulk (Chinaza's feedback). A district left out by a project
   brings one request to the Desk; doing it warms the district, and nothing is lost first.
   Run: npm run build:game, then node tests/e2e/zone-asks.mjs */
import fs from "node:fs";
import { open, playUntil } from "./lib.mjs";
import { serve } from "./serve.mjs";
const srv = await serve();
let fails = 0; const check = (ok, what) => { console.log((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; };
const Y1 = JSON.parse(fs.readFileSync(new URL("./fixtures/year1-save.json", import.meta.url)));
const sv = JSON.parse(Y1.sop_save); sv.stc = { ...sv.stc, zoneAskQ: [{ zone: 1, why: "project" }] };
const g = await open(srv.port, { save: { ...Y1, sop_save: JSON.stringify(sv) } });
await g.click(/^Continue/); await g.wait(2000);
const save = () => g.page.evaluate(() => JSON.parse(localStorage.getItem("sop_save") || "{}"));
let seen = null;
const r = await playUntil(g, (t) => { const m = t.match(/(\S[^\n]*) · a request/i); if (m && !seen) seen = t.slice(t.search(/a request/i) - 60, t.search(/a request/i) + 400).replace(/\s+/g, " "); return /Year 3 of 4/.test(t); },
  { max: 500, prefer: [/^(Borrow and do it now|Do it now) \(/] });
check(r.ok, "played on through the year");
check(!!seen, "the left-out district's request reached the Desk"); if (seen) console.log("  " + seen.slice(0, 300));
const d = await save(), A = ((d.stc || {}).zoneAsks || []).find(a => a.zone === 1);
check(A && A.status === "met", "doing it settles the request (" + (A && A.kind + " · " + A.status) + ")");
check((d.logs || []).some(l => /^🤝 Done for /.test(l.tx)), "the district got what it asked for, on the record");
check(!(d.logs || []).some(l => /feel(s)? left out \(−1\)/.test(l.tx)), "no automatic minus for being left out");
check(!g.errors.length, "no page errors (" + g.errors.join(" | ") + ")");
await g.browser.close(); srv.close && srv.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
