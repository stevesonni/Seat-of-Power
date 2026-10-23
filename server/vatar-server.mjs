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
const PRODUCTS = { second_chance: "consumable", presidential_run: "oneoff", scenario_pack: "oneoff", scenario_security: "oneoff", scenario_election: "oneoff", portrait_frames: "oneoff", attire_glam: "oneoff", attire_bigboy: "oneoff", challenge_retry: "consumable" };
// The weekly challenge: weeks start on Monday 00:00 UTC (the game counts them the same way).
const WEEK0 = Date.UTC(2026, 0, 5), weekNow = () => Math.floor((Date.now() - WEEK0) / 604800000);
const boardFile = (w) => path.join(DATA, "boards", "w" + w + ".json");
let boardLock = Promise.resolve();
const readBoard = (w) => { try { return JSON.parse(fs.readFileSync(boardFile(w), "utf8")); } catch (e) { return { entries: {} }; } };
// The Hall of Governors (all time): each player's best finished career.
const HALL = path.join(DATA, "hall.json");
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
