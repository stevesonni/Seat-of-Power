import fs from "node:fs";
const PH = { budget: "Budget", house_vote: "House vote on the budget", policy: "Programmes, bills and orders", end_turn: "End of the year", mail: "Mailbox (letters)", flagship: "Flagship promise", sc: "National event cards", shock: "Shock event", event_result: "Event result", abuja: "Visit to Abuja", judiciary: "The courts", netherlands: "Foreign trip", screen: "Screen" };
const pretty = (s) => s.replace(/^Year (\d) · ([a-z_]+)(?: · (.*))?$/, (m, y, ph, d) => "Year " + y + " · " + (PH[ph] || ph) + (d ? " · on screen: “" + d + "”" : ""));
const section = (title, file, intro) => {
  const S = JSON.parse(fs.readFileSync(file, "utf8")).filter(s => s.lines.length);
  let out = "\n\n# " + title + "\n\n" + intro + "\n";
  S.forEach((s, i) => { out += "\n## " + title.split(" ")[1] + "-" + String(i + 1).padStart(3, "0") + " · " + pretty(s.stage) + "\n\n" + s.lines.map(l => "- " + l.replace(/\s+/g, " ")).join("\n") + "\n"; });
  return { out, n: S.reduce((a, s) => a + s.lines.length, 0), k: S.length };
};
const A0 = section("Route A — Governor, quick start, years 1 to 4", "short.json", "A new player's path: create a politician, the quick start (state map, agenda, running mate, the godfather, a short campaign, election night), then four years as governor of Ogun. Ends with the end-of-term story. The bot picks the first sensible option each time.");
const B = section("Route B — Governor, full setup (the alternative start)", "full.json", "The longer setup some players get instead of the quick start: seven steps (state, adviser, promise, party, slogan, running mate, the ticket) and the first week of the campaign. Only lines not already shown in Route A appear here.");
const C = section("Route C — President, years 1 to 4", "pres.json", "After winning the presidential race: the inauguration, then the presidency. It runs on the same screens as the governorship with federal content; check that nothing reads like a state government.");
const A = process.argv[4] === "BC" ? { out: "", n: 0, k: 0 } : A0;
const brief = fs.readFileSync(process.argv[3] || "brief.md", "utf8").replace("{{COUNTS}}", (A.k ? "Route A: " + A.k + " stages, " + A.n + " lines. " : "") + "Route B: " + B.k + " stages, " + B.n + " lines. Route C: " + C.k + " stages, " + C.n + " lines.");
const gl = fs.readFileSync("glossary.md", "utf8");
fs.writeFileSync(process.argv[2], brief + "\n\n# Appendix 1 — The glossary the game already has\n\nA term with an entry here is underlined in the game; a tap shows the full name and one line on what it means.\n\n" + gl + A.out + B.out + C.out);
console.log(A.n + B.n + C.n, "lines");
