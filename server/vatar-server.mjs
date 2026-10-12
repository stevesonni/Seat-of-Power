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
const PRODUCTS = { second_chance: "consumable", presidential_run: "oneoff", scenario_pack: "oneoff" };

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
  seen.set(session, { playerId: v.playerId, exp: Math.min(v.exp || 0, Date.now() + 14 * 60e3) });
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
  // The player's right to have their data removed (Developer Agreement §8).
  "/api/delete": async (b, id) => { try { fs.unlinkSync(file(id)); } catch (e) {} return { ok: true }; },
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
