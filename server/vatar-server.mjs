// The Seat of Power: server for the Vatar (Lagos Life) edition.
// node server/vatar-server.mjs · Node 18+, no packages.
//
// - Serves public/ with the header that lets Vatar worlds frame the game, and
//   marks the page as the Vatar edition (window.SOP_VATAR + the SDK + the bridge).
// - Keeps each player's saves on disk, keyed by the per-game player id that
//   Vatar's /session/verify returns. Nothing else about the player is stored.
// - Checks every purchase with Vatar's API before granting it (/claim), and
//   verifies webhook signatures.
//
// Environment: VATAR_SECRET, VATAR_WEBHOOK_SECRET (from the Vatar dashboard),
// DATA_DIR (a mounted volume, e.g. /data), PORT.
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, "..", ".data"));
const API = "https://lagoslife.app/api/games/v1";
const SECRET = process.env.VATAR_SECRET || "";
const WHSEC = process.env.VATAR_WEBHOOK_SECRET || "";
const PORT = +process.env.PORT || 8080;
const FRAMERS = "https://lagoslife.app https://www.lagoslife.app https://naijalife.app https://www.naijalife.app https://lagoslife.eliysites.com";
const SDK = "https://lagoslife.app/sdk/vatar-games-v1.js";
// Products: consumables can be bought again and add a credit each time.
const PRODUCTS = { streak_freeze: "consumable", second_chance: "consumable", presidential_run: "oneoff", scenario_pack: "oneoff", scenario_security: "oneoff", scenario_election: "oneoff", portrait_frames: "oneoff", attire_glam: "oneoff", attire_bigboy: "oneoff", challenge_retry: "consumable" };
// The weekly challenge: weeks start on Monday 00:00 UTC (the game counts them the same way).
const WEEK0 = Date.UTC(2026, 0, 5), weekNow = () => Math.floor((Date.now() - WEEK0) / 604800000);
const boardFile = (w) => path.join(DATA, "boards", "w" + w + ".json");
let boardLock = Promise.resolve();
const readBoard = (w) => { try { return JSON.parse(fs.readFileSync(boardFile(w), "utf8")); } catch (e) { return { entries: {} }; } };
// The Hall of Governors (all time): each player's best finished career.
const HALL = path.join(DATA, "hall.json");
// Player feedback: one JSON line per message. Read it at /feedback?key=FEEDBACK_KEY
// (set FEEDBACK_KEY in Railway Variables; without it the page does not exist).
const FEEDBACK = path.join(DATA, "feedback.jsonl");
const FEEDBACK_KEY = process.env.FEEDBACK_KEY || "";
const fbCount = new Map(); // player → { day, n }: at most 5 messages a day each
// The Daily Decision: how players voted, one file per day. Same epoch as game/systems/daily.js.
const DAILY_EPOCH = Date.UTC(2026, 9, 24);
const dayNow = () => Math.max(1, Math.floor((Date.now() - DAILY_EPOCH) / 864e5) + 1);
const dailyFile = (n) => path.join(DATA, "daily", "d" + n + ".json");
const readDaily = (n) => { try { return JSON.parse(fs.readFileSync(dailyFile(n), "utf8")); } catch (e) { return { counts: [0, 0, 0], voters: {} }; } };
let dailyLock = Promise.resolve();
// Choices players make (state, party, adviser, godfather...): anonymous tallies
// only. Each player counts once per answer; ids are hashed, no names are kept.
const STATS = path.join(DATA, "stats.json");
const readStats = () => { try { return JSON.parse(fs.readFileSync(STATS, "utf8")); } catch (e) { return { ev: {} }; } };
let stats = null, statsDirty = false;
const statsNow = () => (stats = stats || readStats());
setInterval(() => { if (!statsDirty) return; statsDirty = false; try { fs.mkdirSync(DATA, { recursive: true }); const tmp = STATS + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(stats)); fs.renameSync(tmp, STATS); } catch (e) { statsDirty = true; } }, 10000).unref();
const anon = (id) => crypto.createHash("sha256").update("sop:" + id).digest("base64url").slice(0, 12);
const TRACK_OK = /^[a-z_]{2,32}$/;
let hallLock = Promise.resolve();
const readHall = () => { try { return JSON.parse(fs.readFileSync(HALL, "utf8")); } catch (e) { return { entries: {} }; } };
// The name on the boards: the player's Lagos Life username, as Vatar reports it.
const userOf = (b, session) => { const c = seen.get(session); return cleanName((c && c.username) || b.username); };
const cleanName = (t) => String(t || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 40) || "A governor";

fs.mkdirSync(path.join(DATA, "players"), { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".txt": "text/plain; charset=utf-8" };
const baseHeaders = { "Content-Security-Policy": "frame-ancestors " + FRAMERS, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

// The page, marked as the Vatar edition. Read once; restart to pick up a new build.
let page = null;
const loadPage = () => {
  const html = fs.readFileSync(path.join(ROOT, "seat-of-power.html"), "utf8");
  const inject = '<script>window.SOP_VATAR = true;</script>\n  <script src="' + SDK + '"></script>\n  <script src="./sop-vatar.js"></script>\n  ';
  page = html.replace('<script src="./sop-app.js"></script>', inject + '<script src="./sop-app.js"></script>');
  if (page === html) throw new Error("seat-of-power.html: could not find the sop-app.js script tag");
};
loadPage();

const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { ...baseHeaders, "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
};
const readBody = (req, max = 2_000_000) => new Promise((ok, no) => {
  const c = []; let n = 0;
  req.on("data", (x) => { n += x.length; if (n > max) { no(new Error("too_big")); req.destroy(); } else c.push(x); });
  req.on("end", () => ok(Buffer.concat(c))); req.on("error", no);
});

// ── Vatar API ──
const vatar = async (p, body) => {
  const r = await fetch(API + p, { method: body ? "POST" : "GET", body: body && JSON.stringify(body), headers: { Authorization: "Bearer " + SECRET, "Content-Type": "application/json" } });
  let j = {}; try { j = await r.json(); } catch (e) {}
  return { http: r.status, ...j };
};
const seen = new Map(); // session token → { playerId, exp }, so saves don't re-verify every call
const who = async (session) => {
  if (typeof session !== "string" || session.length > 4096) return null;
  const c = seen.get(session);
  if (c && c.exp > Date.now()) return c.playerId;
  const v = await vatar("/session/verify", { session });
  if (v.http !== 200 || !/^[pt]_[A-Za-z0-9_-]{1,80}$/.test(v.playerId || "")) return null;
  seen.set(session, { playerId: v.playerId, username: v.username || v.displayName || v.name || null, exp: Math.min(v.exp || 0, Date.now() + 14 * 60e3) });
  if (seen.size > 5000) for (const [k, x] of seen) if (x.exp < Date.now()) seen.delete(k);
  return v.playerId;
};

// ── Player records: { data: { key: string }, ents: { product: count }, delivered: [purchaseId] } ──
const file = (id) => path.join(DATA, "players", id + ".json");
const readP = (id) => { try { return JSON.parse(fs.readFileSync(file(id), "utf8")); } catch (e) { return { data: {}, ents: {}, delivered: [] }; } };
const writeP = (id, rec) => { const f = file(id), tmp = f + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(rec)); fs.renameSync(tmp, f); };
const locks = new Map(); // one write at a time per player
const withP = (id, fn) => { const prev = locks.get(id) || Promise.resolve(); const next = prev.then(() => fn(readP(id))).finally(() => { if (locks.get(id) === next) locks.delete(id); }); locks.set(id, next.catch(() => {})); return next; };

const KEY_OK = /^[a-z_]{1,32}$/; // sop_save, sop_profile, sop_preelection…
const api = {
  "/api/load": async (b, id) => { const p = readP(id); return { data: p.data || {}, ents: p.ents || {} }; },
  "/api/save": async (b, id) => withP(id, (p) => {
    const d = b.data && typeof b.data === "object" ? b.data : {};
    for (const [k, v] of Object.entries(d)) { if (!KEY_OK.test(k)) continue; if (v == null || v === "") delete p.data[k]; else if (typeof v === "string" && v.length < 900_000) p.data[k] = v; }
    writeP(id, p); return { ok: true };
  }),
  // Spend one credit of a consumable (Second Chance).
  "/api/use": async (b, id) => withP(id, (p) => {
    const k = String(b.product || ""); if (PRODUCTS[k] !== "consumable" || !(p.ents[k] > 0)) return { ok: false };
    p.ents[k] -= 1; writeP(id, p); return { ok: true, ents: p.ents };
  }),
  // Weekly challenge: the first attempt each week is free; another uses one challenge_retry.
  "/api/challenge/start": async (b, id) => withP(id, (p) => {
    const w = weekNow(); p.ch = p.ch || {}; const used = p.ch[w] || 0;
    if (used >= 1) { if (!(p.ents.challenge_retry > 0)) return { ok: false, need: "challenge_retry", week: w, attempts: used }; p.ents.challenge_retry -= 1; }
    p.ch = Object.fromEntries(Object.entries({ ...p.ch, [w]: used + 1 }).filter(([k]) => +k >= w - 3));
    writeP(id, p); return { ok: true, week: w, attempts: used + 1, ents: p.ents };
  }),
  // A finished challenge career: the player's best score this week is kept.
  "/api/challenge/score": async (b, id) => {
    const w = +b.week, n = Math.round(+b.score);
    if (!(w === weekNow() || w === weekNow() - 1) || !Number.isFinite(n) || n < 0 || n > 100000) return { _code: 400, error: "bad_request" };
    const run = boardLock.then(() => { const B = readBoard(w), old = B.entries[id]; if (!old || n > old.score) { B.entries[id] = { name: userOf(b, b.session), title: cleanName(b.title), score: n, at: Date.now() }; fs.mkdirSync(path.dirname(boardFile(w)), { recursive: true }); const f = boardFile(w), tmp = f + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(B)); fs.renameSync(tmp, f); } return { ok: true, best: Math.max(n, old ? old.score : 0) }; });
    boardLock = run.catch(() => {}); return run;
  },
  // The week's top 20 (names are the players' in-game politicians), and where you stand.
  "/api/challenge/board": async (b, id) => {
    const w = Number.isInteger(+b.week) ? +b.week : weekNow(), all = Object.entries(readBoard(w).entries).sort((x, y) => y[1].score - x[1].score);
    const me = all.findIndex(([k]) => k === id);
    return { week: w, top: all.slice(0, 20).map(([k, e], i) => ({ rank: i + 1, name: e.name, title: e.title, score: e.score, me: k === id })), you: me >= 0 ? { rank: me + 1, score: all[me][1].score } : null, players: all.length };
  },
  // A finished career for the all-time Hall: the player's best is kept.
  "/api/hall/submit": async (b, id) => {
    const n = Math.round(+b.score); if (!Number.isFinite(n) || n < 0 || n > 100000) return { _code: 400, error: "bad_request" };
    const run = hallLock.then(() => { const H = readHall(), old = H.entries[id];
      if (!old || n > old.score) { H.entries[id] = { name: userOf(b, b.session), title: cleanName(b.title), state: cleanName(b.state), grade: String(b.grade || "").slice(0, 2), score: n, at: Date.now() }; const tmp = HALL + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(H)); fs.renameSync(tmp, HALL); }
      return { ok: true, best: Math.max(n, old ? old.score : 0) }; });
    hallLock = run.catch(() => {}); return run;
  },
  "/api/hall/board": async (b, id) => {
    const all = Object.entries(readHall().entries).sort((x, y) => y[1].score - x[1].score), me = all.findIndex(([k]) => k === id);
    return { top: all.slice(0, 50).map(([k, e], i) => ({ rank: i + 1, name: e.name, title: e.title, state: e.state, grade: e.grade, score: e.score, me: k === id })), you: me >= 0 ? { rank: me + 1, score: all[me][1].score } : null, players: all.length };
  },
  // The player's right to have their data removed (Developer Agreement §8).
  "/api/delete": async (b, id) => {
    try { fs.unlinkSync(file(id)); } catch (e) {}
    await (hallLock = hallLock.then(() => { const H = readHall(); if (H.entries[id]) { delete H.entries[id]; fs.writeFileSync(HALL, JSON.stringify(H)); } }).catch(() => {}));
    return { ok: true };
  },
  // The Daily Decision: one vote per player per day; the answer is everyone's split.
  "/api/daily/vote": async (b, id) => {
    const n = Math.round(+b.day), c = Math.round(+b.choice), now = dayNow();
    if (!(n >= now - 1 && n <= now) || !(c >= 0 && c <= 2)) return { _code: 400, error: "bad_request" };
    const run = dailyLock.then(() => { const D = readDaily(n); if (D.voters[id] == null) { D.voters[id] = c; D.counts[c] = (D.counts[c] || 0) + 1; fs.mkdirSync(path.dirname(dailyFile(n)), { recursive: true }); const f = dailyFile(n), tmp = f + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(D)); fs.renameSync(tmp, f); } return { ok: true, counts: D.counts, mine: D.voters[id] }; });
    dailyLock = run.catch(() => {}); return run;
  },
  "/api/daily/stats": async (b, id) => { const n = Math.round(+b.day); if (!(n >= 1 && n <= dayNow())) return { _code: 400, error: "bad_request" }; const D = readDaily(n); return { counts: D.counts, mine: D.voters[id] }; },
  // One choice, e.g. { event: "state", value: "Ogun" } or { event: "gf_contract", value: "accept" }.
  "/api/track": async (b, id) => {
    const list = Array.isArray(b.items) ? b.items.slice(0, 20) : [{ event: b.event, value: b.value }];
    const S = statsNow(), who = anon(id);
    list.forEach(it => {
      const e = String(it && it.event || ""), v = String(it && it.value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 60);
      if (!TRACK_OK.test(e) || !v) return;
      const E = S.ev[e] = S.ev[e] || { players: {}, values: {} };
      if (Object.keys(E.values).length > 300 && !E.values[v]) return; // no unbounded growth
      const V = E.values[v] = E.values[v] || { n: 0, p: {} };
      V.n++; if (!V.p[who]) { V.p[who] = 1; } E.players[who] = 1; statsDirty = true;
    });
    return { ok: true };
  },
  // What a player does not like and wants to see better.
  "/api/feedback": async (b, id) => {
    const clip = (t, n) => String(t == null ? "" : t).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n);
    const dislike = clip(b.dislike, 1500), want = clip(b.want, 1500), rating = Math.max(0, Math.min(5, Math.round(+b.rating || 0)));
    if (!dislike && !want && !rating) return { _code: 400, error: "empty" };
    const day = new Date().toISOString().slice(0, 10), c = fbCount.get(id);
    const n = c && c.day === day ? c.n : 0; if (n >= 5) return { _code: 429, error: "enough_today" };
    fbCount.set(id, { day, n: n + 1 });
    const rec = { at: new Date().toISOString(), player: id, name: userOf(b, b.session), rating, dislike, want, where: clip(b.where, 40), year: clip(b.year, 20), state: clip(b.state, 40) };
    fs.mkdirSync(DATA, { recursive: true }); fs.appendFileSync(FEEDBACK, JSON.stringify(rec) + "\n");
    return { ok: true };
  },
  // A purchase counts only when Vatar's server says it is paid and it is this player's.
  "/claim": async (b, id) => {
    const pid = String(b.purchaseId || ""); if (!/^[A-Za-z0-9_-]{1,80}$/.test(pid)) return { _code: 400, error: "bad_request" };
    const pu = await vatar("/purchases/" + encodeURIComponent(pid));
    if (pu.http !== 200 || pu.playerId !== id) return { _code: 403, error: "not_yours" };
    if (pu.status === "refunded") return { _code: 409, error: "refunded" };
    const kind = PRODUCTS[pu.productId]; if (!kind) return { _code: 400, error: "unknown_product" };
    const ents = await withP(id, (p) => {
      if (!p.delivered.includes(pid)) { // grant once per purchase id
        p.ents[pu.productId] = kind === "consumable" ? (p.ents[pu.productId] || 0) + 1 : 1;
        p.delivered = [...p.delivered, pid].slice(-500);
        writeP(id, p);
      }
      return p.ents;
    });
    await vatar("/purchases/" + encodeURIComponent(pid) + "/deliver", {});
    return { ok: true, productId: pu.productId, ents };
  },
};

// X-Vatar-Signature: "sha256=" + hex HMAC-SHA256 of the raw body.
const signed = (raw, header) => {
  if (!WHSEC) return false;
  const want = Buffer.from("sha256=" + crypto.createHmac("sha256", WHSEC).update(raw).digest("hex"));
  const got = Buffer.from(String(header ?? ""));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
};

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/vatar-webhook") {
      const raw = await readBody(req, 64_000);
      if (!signed(raw, req.headers["x-vatar-signature"])) return send(res, 401, { error: "bad_signature" });
      // A nudge only: the game claims purchases itself, and /claim checks them with the API.
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && api[url.pathname]) {
      if (!SECRET) return send(res, 503, { error: "not_configured" });
      let b; try { b = JSON.parse(await readBody(req)); } catch (e) { return send(res, 400, { error: "bad_request" }); }
      const id = await who(b.session);
      if (!id) return send(res, 401, { error: "bad_session" });
      const out = await api[url.pathname](b, id);
      return send(res, out._code || 200, out);
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "method" });
    if (url.pathname === "/health") return send(res, 200, { ok: true, configured: !!SECRET });
    if (url.pathname === "/feedback") {
      const k = Buffer.from(String(url.searchParams.get("key") || "")), want = Buffer.from(FEEDBACK_KEY);
      if (!FEEDBACK_KEY || k.length !== want.length || !crypto.timingSafeEqual(k, want)) return send(res, 404, "Not found", TYPES[".txt"]);
      let rows = []; try { rows = fs.readFileSync(FEEDBACK, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean).reverse(); } catch (e) {}
      if (url.searchParams.get("format") === "csv") {
        const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
        const csv = "when,player,stars,does not like,wants better,screen,year,state\n" + rows.map(r => [r.at, r.name || r.player, r.rating, r.dislike, r.want, r.where, r.year, r.state].map(q).join(",")).join("\n");
        res.writeHead(200, { ...baseHeaders, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=seat-of-power-feedback.csv", "Cache-Control": "no-store" }); return res.end(csv);
      }
      const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
      const S = statsNow(), evs = Object.entries(S.ev).sort((a, b) => Object.keys(b[1].players).length - Object.keys(a[1].players).length);
      if (url.searchParams.get("format") === "stats") {
        const out = {}; evs.forEach(([e, E]) => { const np = Object.keys(E.players).length; out[e] = { players: np, values: Object.fromEntries(Object.entries(E.values).map(([v, V]) => [v, { players: Object.keys(V.p).length, times: V.n, pct: np ? Math.round(Object.keys(V.p).length / np * 100) : 0 }])) }; });
        return send(res, 200, out);
      }
      const statsHtml = evs.length ? evs.map(([e, E]) => { const np = Object.keys(E.players).length, vs = Object.entries(E.values).map(([v, V]) => [v, Object.keys(V.p).length, V.n]).sort((a, b) => b[1] - a[1]);
        return '<div class="c"><b>' + esc(e.replace(/_/g, " ")) + '</b> <span class="m">· ' + np + ' players</span>' + vs.slice(0, 40).map(([v, n, t]) => { const pc = np ? Math.round(n / np * 100) : 0; return '<div style="display:grid;grid-template-columns:minmax(120px,1fr) 3fr 64px;gap:8px;align-items:center;margin-top:6px"><span>' + esc(v) + '</span><span style="height:10px;border-radius:5px;background:#e6dfd2;overflow:hidden"><span style="display:block;height:100%;width:' + pc + '%;background:#0b6b42"></span></span><span class="m" style="text-align:right">' + pc + '% · ' + n + '</span></div>'; }).join("") + '</div>'; }).join("") : "<p>No choices recorded yet.</p>";
      const rated = rows.filter(r => r.rating), avg = rated.length ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1) : "–";
      const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Players: feedback and choices</title>'
        + '<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f6f2ea;color:#13261c}main{max-width:860px;margin:0 auto;padding:20px 16px}h1{margin:0 0 4px}.k{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 18px}.k b{display:block;font-size:26px}.k div{background:#fff;border:1px solid #e6dfd2;border-radius:14px;padding:10px 16px}.c{background:#fff;border:1px solid #e6dfd2;border-radius:16px;padding:14px 16px;margin:0 0 10px}.m{color:#6b7a70;font-size:14px}.l{font-weight:700;color:#a3271c}.w{font-weight:700;color:#0b6b42}a{color:#0b6b42}</style>'
        + '<main><h1>Player feedback</h1><div class="m">Seat of Power · newest first · <a href="?key=' + encodeURIComponent(FEEDBACK_KEY) + '&format=csv">download CSV</a></div>'
        + '<div class="k"><div><b>' + rows.length + '</b>messages</div><div><b>' + avg + ' ★</b>average of ' + rated.length + '</div><div><b>' + new Set(rows.map(r => r.player)).size + '</b>players</div></div>'
        + '<h2 style="margin:22px 0 8px">What players choose</h2><div class="m" style="margin-bottom:8px">Anonymous: each player counts once per answer. <a href="?key=' + encodeURIComponent(FEEDBACK_KEY) + '&format=stats">as JSON</a></div>' + statsHtml
        + '<h2 style="margin:22px 0 8px">Messages</h2>'
        + (rows.length ? rows.slice(0, 1000).map(r => '<div class="c"><div class="m">' + esc(r.at.replace("T", " ").slice(0, 16)) + ' · ' + esc(r.name || "a player") + (r.rating ? ' · ' + "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "") + (r.where ? ' · on ' + esc(r.where) : "") + (r.year ? ' · ' + esc(r.year) : "") + (r.state ? ' · ' + esc(r.state) : "") + '</div>'
          + (r.dislike ? '<div><span class="l">Does not like:</span> ' + esc(r.dislike) + '</div>' : "") + (r.want ? '<div><span class="w">Wants better:</span> ' + esc(r.want) + '</div>' : "") + '</div>').join("") : '<p>No feedback yet.</p>')
        + '</main>';
      res.writeHead(200, { ...baseHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); return res.end(html);
    }
    if (url.pathname === "/" || url.pathname === "/seat-of-power.html") return send(res, 200, page, TYPES[".html"]);
    // Static files from public/, never outside it.
    const f = path.resolve(ROOT, "." + decodeURIComponent(url.pathname));
    if (!f.startsWith(ROOT + path.sep)) return send(res, 404, "Not found", TYPES[".txt"]);
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) return send(res, 404, "Not found", TYPES[".txt"]);
      const ext = path.extname(f).toLowerCase();
      res.writeHead(200, { ...baseHeaders, "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Length": st.size, "Cache-Control": ext === ".webp" || ext === ".png" || ext === ".jpg" ? "public, max-age=86400" : "no-cache" });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(f).pipe(res);
    });
  } catch (e) {
    console.error("[server]", e);
    if (!res.headersSent) send(res, 500, { error: "error" });
  }
}).listen(PORT, () => console.log("Seat of Power (Vatar edition) on :" + PORT + " · data in " + DATA + (SECRET ? "" : " · VATAR_SECRET not set: saves fall back to the device")));
