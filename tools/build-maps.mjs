#!/usr/bin/env node
/* Build the state maps (public/art/maps/<State>.json) from geoBoundaries (CC BY 4.0, www.geoboundaries.org):
   node tools/build-maps.mjs <adm1.geojson> <adm2.geojson>
   Each local government is put in its state (its middle point inside the state's outline), matched to the game's
   own name for it (STATE_LGAS in the game), projected, simplified and written as SVG path data in a 1000-wide box. */
import fs from "node:fs";
const [a1, a2] = process.argv.slice(2); if (!a1 || !a2) { console.error("Usage: node tools/build-maps.mjs adm1.geojson adm2.geojson"); process.exit(1); }
const src = fs.readFileSync(new URL("../game/seat-of-power.jsx", import.meta.url), "utf8"), i = src.indexOf("const STATE_LGAS = {"), j = src.indexOf("\n};", i);
const GAME = eval("(" + src.slice(i + 19, j + 2) + ")");
const ADM1 = JSON.parse(fs.readFileSync(a1)).features, ADM2 = JSON.parse(fs.readFileSync(a2)).features;
const polys = (g) => g.type === "Polygon" ? [g.coordinates] : g.coordinates;
const inRing = (p, r) => { let c = false; for (let k = 0, l = r.length - 1; k < r.length; l = k++) { const [xi, yi] = r[k], [xj, yj] = r[l]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
const inGeom = (p, g) => polys(g).some(P => inRing(p, P[0]) && !P.slice(1).some(h => inRing(p, h)));
// The middle of a shape: the area-weighted centre of its largest ring (falls back to the ring's mean).
const centre = (g) => { const R = polys(g).map(P => P[0]).sort((x, y) => y.length - x.length)[0]; let A = 0, cx = 0, cy = 0;
  for (let k = 0, l = R.length - 1; k < R.length; l = k++) { const f = R[l][0] * R[k][1] - R[k][0] * R[l][1]; A += f; cx += (R[l][0] + R[k][0]) * f; cy += (R[l][1] + R[k][1]) * f; }
  if (Math.abs(A) < 1e-12) return R.reduce((s, q) => [s[0] + q[0] / R.length, s[1] + q[1] / R.length], [0, 0]); return [cx / (3 * A), cy / (3 * A)]; };
const STATE = (n) => n === "Abuja Federal Capital Territory" ? "FCT" : n === "Nasarawa" ? "Nassarawa" : n.replace(/ /g, "_"); // the game spells it Nassarawa
const norm = (s) => String(s).toLowerCase().replace(/local government|lga/g, "").replace(/[^a-z]/g, "");
// geoBoundaries spellings → the game's spellings.
const ALIAS = { shagamu: "sagamu", wamakko: "wamako", ifakoijaye: "ifakoijaiye", emuoha: "emohua", omumma: "omuma", oturkpo: "otukpo", iguegben: "igueben", garunmalam: "garunmallam", nassarawa: "nasarawa", bagudu: "bagudo", mbatoli: "mbaitoli", shomgom: "shongom", obinwga: "obingwa", ayedade: "aiyedaade", ayedire: "aiyedire", ileshaeast: "ilesaeast", ileshawest: "ilesawest", dambam: "damban", munya: "moya", yenegoa: "yenagoa" };
const simplify = (pts, eps) => { if (pts.length < 4) return pts; const d = (p, a, b) => { const [x, y] = p, [x1, y1] = a, [x2, y2] = b, L = Math.hypot(x2 - x1, y2 - y1); if (!L) return Math.hypot(x - x1, y - y1); return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / L; };
  let mx = 0, ix = 0; for (let k = 1; k < pts.length - 1; k++) { const v = d(pts[k], pts[0], pts[pts.length - 1]); if (v > mx) { mx = v; ix = k; } }
  return mx > eps ? simplify(pts.slice(0, ix + 1), eps).slice(0, -1).concat(simplify(pts.slice(ix), eps)) : [pts[0], pts[pts.length - 1]]; };
const out = new URL("../public/art/maps/", import.meta.url).pathname; fs.mkdirSync(out, { recursive: true });
const report = [];
for (const S of ADM1) {
  const st = STATE(S.properties.shapeName), game = GAME[st] || GAME[st.replace(/_/g, " ")] || [];
  const mine = ADM2.filter(L => inGeom(centre(L.geometry), S.geometry));
  // Project: longitude squeezed by the cosine of the latitude, then fitted to a box 1000 wide.
  const all = mine.flatMap(L => polys(L.geometry).flatMap(P => P[0])), lat0 = all.reduce((s, p) => s + p[1], 0) / all.length * Math.PI / 180;
  const X = (p) => p[0] * Math.cos(lat0), xs = all.map(X), ys = all.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), k = 1000 / (maxX - minX);
  const P = (p) => [Math.round((X(p) - minX) * k * 10) / 10, Math.round((maxY - p[1]) * k * 10) / 10];
  const gameN = new Map(game.map(n => [norm(n), n])), used = new Set();
  const lgas = mine.map(L => {
    const raw = L.properties.shapeName, key = ALIAS[norm(raw)] || norm(raw);
    let name = gameN.get(key) || [...gameN.entries()].find(([g]) => g.startsWith(key) || key.startsWith(g))?.[1] || raw; used.add(name);
    const d = polys(L.geometry).map(Pp => simplify(Pp[0].map(P), 1.6)).filter(r => r.length > 2).map(r => "M" + r.map(q => q.join(",")).join("L") + "Z").join("");
    return { n: name, d, c: P(centre(L.geometry)) };
  }).sort((x, y) => x.n.localeCompare(y.n));
  const missing = game.filter(n => !used.has(n)), extra = lgas.filter(l => !game.includes(l.n)).map(l => l.n);
  fs.writeFileSync(out + st + ".json", JSON.stringify({ w: 1000, h: Math.ceil((maxY - minY) * k), lgas }));
  report.push(st + ": " + lgas.length + " LGAs" + (missing.length ? " · game names not on the map: " + missing.join(", ") : "") + (extra.length ? " · map names not in the game: " + extra.join(", ") : ""));
}
console.log(report.join("\n"));
