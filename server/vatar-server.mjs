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
import { checkCompanyName, COMPANY_SECTORS, FEE_PER_HIRE_M, PAYOUT_CAP_M } from "./company-name.mjs";
import { tierOf, hallDay, weekOf, daysOfWeek, weekOpensAt, rankBoard, weekEntries, playedAgain } from "./hall-rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, "..", ".data"));
const API = process.env.VATAR_API || "https://lagoslife.app/api/games/v1"; // overridable only for tests
const SECRET = process.env.VATAR_SECRET || "";
const WHSEC = process.env.VATAR_WEBHOOK_SECRET || "";
const PORT = +process.env.PORT || 8080;
const FRAMERS = "https://lagoslife.app https://www.lagoslife.app https://naijalife.app https://www.naijalife.app https://lagoslife.eliysites.com";
const SDK = "https://lagoslife.app/sdk/vatar-games-v1.js";
// Products: consumables can be bought again and add a credit each time.
// FREE_CAREERS=1 (Railway Variables): while Vatar has not yet approved the products,
// every extra is free: one-off unlocks (careers, scenarios, frames, outfits) are open,
// pay-per-use items (Second Chance, Streak Freeze, challenge retries) can be used
// without a credit, and each player may register one company. Remove it to bring back
// the prices; nothing a player bought is touched either way.
const FREE_CAREERS = process.env.FREE_CAREERS === "1";
const FREE_USE = ["second_chance", "streak_freeze", "challenge_retry"]; // shown as one credit, never used up
const entsOut = (ents) => FREE_CAREERS ? { ...(ents || {}), ...Object.fromEntries(Object.keys(PRODUCTS).filter(k => PRODUCTS[k] === "oneoff" || FREE_USE.includes(k) || k === "company_registration").map(k => [k, Math.max(1, (ents || {})[k] || 0)])) } : (ents || {});
const PRODUCTS = { career_ambassador: "oneoff", career_chairman: "oneoff", career_senator: "oneoff", company_registration: "consumable", streak_freeze: "consumable", second_chance: "consumable", presidential_run: "oneoff", scenario_pack: "oneoff", scenario_security: "oneoff", scenario_election: "oneoff", portrait_frames: "oneoff", attire_glam: "oneoff", attire_bigboy: "oneoff", challenge_retry: "consumable" };
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
let fbWhy = 0;
const FEEDBACK_KEY = String(process.env.FEEDBACK_KEY || "").trim(); // a stray space or newline pasted with it does not count
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
// Companies players register: every player sees them as contractors. The
// owner's id stays on the server; hires (one per hiring player per company
// per day) earn the owner fees, paid into their next campaign's war chest.
const COMPANIES = path.join(DATA, "companies.json");
const readCos = () => { try { return JSON.parse(fs.readFileSync(COMPANIES, "utf8")); } catch (e) { return {}; } };
let cos = null, cosDirty = false;
const cosNow = () => (cos = cos || readCos());
setInterval(() => { if (!cosDirty) return; cosDirty = false; try { fs.mkdirSync(DATA, { recursive: true }); const tmp = COMPANIES + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(cos)); fs.renameSync(tmp, COMPANIES); } catch (e) { cosDirty = true; } }, 5000).unref();
const myCo = (id) => Object.values(cosNow()).find(c => c.owner === id) || null;
const coPublic = (c) => ({ id: c.id, name: c.name, sector: c.sector, hires: Object.keys(c.hiredBy || {}).length });
// Times other governors used it (one per hiring player per day), and how many of those the owner has been told about.
const coUses = (c) => Object.values(c.hiredBy || {}).reduce((a, n) => a + n, 0);
// Play time for the insights page: totals, average, median, spread, longest players.
const hm = (sec) => { const m = Math.round(sec / 60); return m < 60 ? m + "m" : Math.floor(m / 60) + "h " + (m % 60) + "m"; };
const playSummary = (S) => {
  const ps = Object.entries(S.play || {}).filter(([, P]) => P.s > 0).map(([who, P]) => ({ who, s: P.s, days: P.days.length, first: P.first, last: P.last })).sort((a, b) => b.s - a.s);
  const tot = ps.reduce((a, p) => a + p.s, 0), med = ps.length ? ps[Math.floor(ps.length / 2)].s : 0;
  const BK = [["under 5 min", 300], ["5–15 min", 900], ["15–30 min", 1800], ["30–60 min", 3600], ["1–3 hours", 10800], ["3–10 hours", 36000], ["10+ hours", Infinity]];
  const buckets = BK.map(([l, hi], i) => ({ l, n: ps.filter(p => p.s < hi && p.s >= (i ? BK[i - 1][1] : 0)).length }));
  return { players: ps.length, totalSec: tot, avgSec: ps.length ? Math.round(tot / ps.length) : 0, medianSec: med, buckets, top: ps.slice(0, 50) };
};
let hallLock = Promise.resolve();
const readHall = () => { try { return JSON.parse(fs.readFileSync(HALL, "utf8")); } catch (e) { return { entries: {} }; } };
// The daily boards (one file a day) and how many careers each player has finished.
const dayFile = (d) => path.join(DATA, "hall-days", d + ".json");
const readDay = (d) => { try { return { day: d, ...JSON.parse(fs.readFileSync(dayFile(d), "utf8")) }; } catch (e) { return { day: d, entries: {} }; } };
const writeJson = (f, v) => { const tmp = f + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(v)); fs.renameSync(tmp, f); };
const HSTATS = path.join(DATA, "hall-stats.json");
const readHallStats = () => { try { return JSON.parse(fs.readFileSync(HSTATS, "utf8")); } catch (e) { return { n: {} }; } };
const boardOut = (rows, id) => rows.map(({ id: k, ...e }) => ({ ...e, me: k === id }));
// The name on the boards: the player's Lagos Life username, as Vatar reports it.
const userOf = (b, session) => { const c = seen.get(session); return cleanName((c && c.username) || b.username); };
const cleanName = (t) => String(t || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 40) || "A governor";

fs.mkdirSync(path.join(DATA, "players"), { recursive: true });
fs.mkdirSync(path.join(DATA, "hall-days"), { recursive: true });

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
// Why Vatar refused a session, at most once a minute: the status, Vatar's error and the key's
// mode (test or live). Never the key or the session itself.
const KEY_MODE = SECRET.startsWith("vtr_live_") ? "live" : SECRET.startsWith("vtr_test_") ? "test" : SECRET ? "unknown" : "none";
let vfLast = 0, vfCount = 0;
const verifyFailed = (v) => {
  vfCount++; if (Date.now() - vfLast < 60e3) return;
  vfLast = Date.now();
  console.warn("[vatar] session verify refused ×" + vfCount + ": http " + v.http + " " + String(v.error || v.code || v.message || "").slice(0, 120) + " · key mode " + KEY_MODE + (v.playerId ? " · player id " + String(v.playerId).slice(0, 2) + "…" : ""));
  vfCount = 0;
};
const who = async (session) => {
  if (typeof session !== "string" || session.length > 4096) return null;
  const c = seen.get(session);
  if (c && c.exp > Date.now()) return c.playerId;
  const v = await vatar("/session/verify", { session });
  if (v.http !== 200 || !/^[pt]_[A-Za-z0-9_-]{1,80}$/.test(v.playerId || "")) { verifyFailed(v); return null; }
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
  "/api/load": async (b, id) => { const p = readP(id); return { data: p.data || {}, ents: entsOut(p.ents) }; },
  "/api/save": async (b, id) => withP(id, (p) => {
    const d = b.data && typeof b.data === "object" ? b.data : {};
    for (const [k, v] of Object.entries(d)) { if (!KEY_OK.test(k)) continue; if (v == null || v === "") delete p.data[k]; else if (typeof v === "string" && v.length < 900_000) p.data[k] = v; }
    writeP(id, p); return { ok: true };
  }),
  // Spend one credit of a consumable (Second Chance).
  "/api/use": async (b, id) => withP(id, (p) => {
    const k = String(b.product || "");
    if (FREE_CAREERS && FREE_USE.includes(k) && !(p.ents[k] > 0)) return { ok: true, ents: entsOut(p.ents) };
    if (PRODUCTS[k] !== "consumable" || !(p.ents[k] > 0)) return { ok: false };
    p.ents[k] -= 1; writeP(id, p); return { ok: true, ents: entsOut(p.ents) };
  }),
  // Weekly challenge: the first attempt each week is free; another uses one challenge_retry.
  "/api/challenge/start": async (b, id) => withP(id, (p) => {
    const w = weekNow(); p.ch = p.ch || {}; const used = p.ch[w] || 0;
    if (used >= 1 && !FREE_CAREERS) { if (!(p.ents.challenge_retry > 0)) return { ok: false, need: "challenge_retry", week: w, attempts: used }; p.ents.challenge_retry -= 1; }
    p.ch = Object.fromEntries(Object.entries({ ...p.ch, [w]: used + 1 }).filter(([k]) => +k >= w - 3));
    writeP(id, p); return { ok: true, week: w, attempts: used + 1, ents: entsOut(p.ents) };
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
  // A career has ended (entered in the Hall or not): counted for "N% played again".
  "/api/hall/finish": async (b, id) => {
    const run = hallLock.then(() => { const S = readHallStats(); S.n[id] = (S.n[id] || 0) + 1; writeJson(HSTATS, S); return { ok: true, ...playedAgain(S.n) }; });
    hallLock = run.catch(() => {}); return run;
  },
  // Enter a finished governorship on today's board: once a day. The all-time Hall keeps the best.
  "/api/hall/enter": async (b, id) => {
    const n = Math.round(+b.score); if (!Number.isFinite(n) || n < 0 || n > 100000) return { _code: 400, error: "bad_request" };
    const d = hallDay();
    const run = hallLock.then(() => {
      const D = readDay(d), mine = D.entries[id];
      if (mine) return { ok: false, already: true, day: d, entry: mine };
      const e = { name: userOf(b, b.session), title: cleanName(b.title), state: cleanName(b.state), grade: String(b.grade || "").slice(0, 2), score: n, at: Date.now() };
      D.entries[id] = e; writeJson(dayFile(d), { entries: D.entries });
      const H = readHall(), old = H.entries[id]; if (!old || n > old.score) { H.entries[id] = e; writeJson(HALL, H); }
      const rank = Object.values(D.entries).filter(x => x.score > n).length + 1;
      return { ok: true, day: d, rank, tier: (tierOf(n) || {}).id || null, players: Object.keys(D.entries).length };
    });
    hallLock = run.catch(() => {}); return run;
  },
  "/api/hall/today": async (b, id) => {
    const d = hallDay(), D = readDay(d), rows = rankBoard(D.entries, 20), all = rankBoard(D.entries, 100000), me = all.find(r => r.id === id);
    return { day: d, top: boardOut(rows, id), you: me ? { rank: me.rank, score: me.score, tier: me.tier } : null, players: all.length, entered: !!D.entries[id], ...playedAgain(readHallStats().n) };
  },
  // The weekly board: locked while the week runs, then each governor's best day.
  "/api/hall/week": async (b, id) => {
    const now = weekOf(), w = Number.isInteger(+b.week) ? Math.min(+b.week, now) : now - 1;
    if (w >= now) return { week: w, locked: true, opensAt: weekOpensAt(w) };
    const best = weekEntries(daysOfWeek(w).map(readDay)), rows = rankBoard(best, 20), all = rankBoard(best, 100000), me = all.find(r => r.id === id);
    return { week: w, locked: false, top: boardOut(rows, id), you: me ? { rank: me.rank, score: me.score, tier: me.tier } : null, players: all.length, opensAt: weekOpensAt(now) };
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
  // Time played: real seconds, at most what has passed since the last report.
  "/api/play": async (b, id) => {
    const S = statsNow(), who = anon(id), now = Date.now(), P = (S.play = S.play || {})[who] = S.play[who] || { s: 0, first: now, last: 0, days: [] };
    const sec = Math.max(0, Math.min(Math.round(+b.sec) || 0, 120, P.last ? Math.round((now - P.last) / 1000) + 20 : 120));
    if (sec) { P.s += sec; P.last = now; const d = new Date(now).toISOString().slice(0, 10); if (P.days[P.days.length - 1] !== d) P.days = [...P.days, d].slice(-400); statsDirty = true; }
    return { ok: true, total: P.s };
  },
  // Player companies: the visible list, which one is mine, and fees waiting.
  "/api/company/list": async (b, id) => {
    const C = cosNow(), mine = myCo(id);
    // Every visible company, so every one can come up in other players' tenders.
    const list = Object.values(C).filter(c => !c.hidden).map(coPublic).sort((a, b) => b.hires - a.hires).slice(0, 3000);
    return { list, mine: mine ? { ...coPublic(mine), hidden: !!mine.hidden, owedM: Math.min(PAYOUT_CAP_M, mine.earnM - mine.paidM), uses: coUses(mine), told: mine.told || 0 } : null };
  },
  // Register (one company_registration credit), or rename: free when we hid the old name.
  "/api/company/register": async (b, id) => withP(id, (p) => {
    const chk = checkCompanyName(b.name), sector = String(b.sector || "");
    if (!chk.ok) return { ok: false, error: "bad_name", why: chk.why };
    if (!COMPANY_SECTORS.includes(sector)) return { ok: false, error: "bad_sector" };
    const C = cosNow(), mine = myCo(id), low = chk.name.toLowerCase();
    if (Object.values(C).some(c => c !== mine && c.name.toLowerCase() === low)) return { ok: false, error: "taken", why: "Another player already registered that name." };
    const free = (mine && mine.hidden) || (FREE_CAREERS && !mine); // while extras are free: one company per player
    if (!free) { if (!(p.ents.company_registration > 0)) return { ok: false, need: "company_registration" }; p.ents.company_registration -= 1; writeP(id, p); }
    const co = mine || { id: "pc_" + crypto.randomBytes(6).toString("base64url"), owner: id, at: Date.now(), hiredBy: {}, earnM: 0, paidM: 0 };
    Object.assign(co, { name: chk.name, sector, hidden: false, renamedAt: mine ? Date.now() : undefined });
    C[co.id] = co; cosDirty = true;
    return { ok: true, company: coPublic(co), ents: entsOut(p.ents) };
  }),
  // Another governor hired a company: counts once per hiring player per company per day.
  "/api/company/hire": async (b, id) => {
    const c = cosNow()[String(b.id || "")]; if (!c || c.hidden || c.owner === id) return { ok: true };
    const who2 = anon(id), day = new Date().toISOString().slice(0, 10);
    c.hiredBy = c.hiredBy || {}; c.hireDays = c.hireDays || {};
    if (c.hireDays[who2] === day) return { ok: true };
    c.hireDays[who2] = day; c.hiredBy[who2] = (c.hiredBy[who2] || 0) + 1; c.earnM += FEE_PER_HIRE_M; cosDirty = true;
    return { ok: true };
  },
  // The owner has seen the "your company was used N times" notice.
  "/api/company/told": async (b, id) => {
    const c = myCo(id); if (!c) return { ok: true };
    c.told = coUses(c); cosDirty = true;
    return { ok: true, told: c.told };
  },
  // The owner draws their fees into a new campaign (up to the cap at a time).
  "/api/company/claim": async (b, id) => {
    const c = myCo(id); if (!c) return { amountM: 0 };
    const amountM = Math.max(0, Math.min(PAYOUT_CAP_M, c.earnM - c.paidM)); c.paidM += amountM; if (amountM) cosDirty = true;
    return { amountM, hires: Object.keys(c.hiredBy || {}).length, name: c.name };
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
    return { ok: true, productId: pu.productId, ents: entsOut(ents) };
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
    // Feedback from a player whose Lagos Life session could not be confirmed (or who opened
    // the game directly): kept all the same, marked anonymous, five a day per address.
    if (req.method === "POST" && url.pathname === "/api/feedback-open") {
      let b; try { b = JSON.parse(await readBody(req, 16_000)); } catch (e) { return send(res, 400, { error: "bad_request" }); }
      const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
      const out = await api["/api/feedback"]({ ...b, session: null }, "anon_" + crypto.createHash("sha256").update(ip).digest("hex").slice(0, 10));
      return send(res, out._code || 200, out);
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
    if (url.pathname === "/health") return send(res, 200, { ok: true, configured: !!SECRET, keyMode: KEY_MODE, freeCareers: FREE_CAREERS });
    if (url.pathname === "/feedback") {
      const k = Buffer.from(String(url.searchParams.get("key") || "").trim()), want = Buffer.from(FEEDBACK_KEY);
      if (!FEEDBACK_KEY || k.length !== want.length || !crypto.timingSafeEqual(k, want)) {
        // Why it was refused (never the key): not set at all, or the key given does not match.
        if (Date.now() - fbWhy > 30e3) { fbWhy = Date.now(); console.warn("[feedback page] refused: " + (!FEEDBACK_KEY ? "FEEDBACK_KEY is not set on the server" : "the key in the address does not match (" + k.length + " characters given, " + want.length + " expected)")); }
        return send(res, 404, "Not found", TYPES[".txt"]);
      }
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
        out._playtime = playSummary(S);
        return send(res, 200, out);
      }
      const statsHtml = evs.length ? evs.map(([e, E]) => { const np = Object.keys(E.players).length, vs = Object.entries(E.values).map(([v, V]) => [v, Object.keys(V.p).length, V.n]).sort((a, b) => b[1] - a[1]);
        return '<div class="c"><b>' + esc(e.replace(/_/g, " ")) + '</b> <span class="m">· ' + np + ' players</span>' + vs.slice(0, 40).map(([v, n, t]) => { const pc = np ? Math.round(n / np * 100) : 0; return '<div style="display:grid;grid-template-columns:minmax(120px,1fr) 3fr 64px;gap:8px;align-items:center;margin-top:6px"><span>' + esc(v) + '</span><span style="height:10px;border-radius:5px;background:#e6dfd2;overflow:hidden"><span style="display:block;height:100%;width:' + pc + '%;background:#0b6b42"></span></span><span class="m" style="text-align:right">' + pc + '% · ' + n + '</span></div>'; }).join("") + '</div>'; }).join("") : "<p>No choices recorded yet.</p>";
      const hideId = url.searchParams.get("hide"), showId = url.searchParams.get("show"), C0 = cosNow();
      if (hideId && C0[hideId]) { C0[hideId].hidden = true; cosDirty = true; }
      if (showId && C0[showId]) { C0[showId].hidden = false; cosDirty = true; }
      const kq = '?key=' + encodeURIComponent(FEEDBACK_KEY), coList = Object.values(C0).sort((a, b) => b.at - a.at);
      const coHtml = '<h2 style="margin:22px 0 8px">Player companies</h2><div class="m" style="margin-bottom:8px">Every player sees these names. Hide any that copy a real firm or person, or are rude; the owner then renames for free.</div>'
        + (coList.length ? '<div class="c">' + coList.slice(0, 300).map(c => '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #efe8db"><span' + (c.hidden ? ' style="text-decoration:line-through;color:#9aa39c"' : '') + '><b>' + esc(c.name) + '</b> <span class="m">· ' + esc(c.sector) + ' · hired by ' + Object.keys(c.hiredBy || {}).length + ' · ' + esc(new Date(c.at).toISOString().slice(0, 10)) + '</span></span><a href="' + kq + (c.hidden ? '&show=' : '&hide=') + encodeURIComponent(c.id) + '">' + (c.hidden ? 'Show' : 'Hide') + '</a></div>').join("") + '</div>' : '<p>No companies yet.</p>');
      const PS = playSummary(S), bmax = Math.max(1, ...PS.buckets.map(b => b.n));
      const playHtml = '<h2 style="margin:22px 0 8px">Play time</h2>' + (PS.players ? '<div class="k"><div><b>' + hm(PS.totalSec) + '</b>played in all</div><div><b>' + hm(PS.avgSec) + '</b>average per player</div><div><b>' + hm(PS.medianSec) + '</b>typical player (median)</div><div><b>' + PS.players + '</b>players timed</div></div>'
        + '<div class="c"><b>How long players stay</b>' + PS.buckets.map(b => '<div style="display:grid;grid-template-columns:110px 3fr 64px;gap:8px;align-items:center;margin-top:6px"><span>' + b.l + '</span><span style="height:10px;border-radius:5px;background:#e6dfd2;overflow:hidden"><span style="display:block;height:100%;width:' + Math.round(b.n / bmax * 100) + '%;background:#0b6b42"></span></span><span class="m" style="text-align:right">' + b.n + '</span></div>').join("") + '</div>'
        + '<div class="c"><b>Longest players</b> <span class="m">· anonymous ids</span>' + PS.top.slice(0, 20).map((p, i) => '<div style="display:grid;grid-template-columns:28px 1fr auto;gap:8px;margin-top:6px"><span class="m">' + (i + 1) + '</span><span>Player ' + esc(p.who.slice(0, 6)) + ' <span class="m">· ' + p.days + ' day' + (p.days === 1 ? '' : 's') + ' · last ' + esc(new Date(p.last).toISOString().slice(0, 10)) + '</span></span><b>' + hm(p.s) + '</b></div>').join("") + '</div>' : '<p>No play time recorded yet.</p>');
      const rated = rows.filter(r => r.rating), avg = rated.length ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1) : "–";
      const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Players: feedback and choices</title>'
        + '<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f6f2ea;color:#13261c}main{max-width:860px;margin:0 auto;padding:20px 16px}h1{margin:0 0 4px}.k{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 18px}.k b{display:block;font-size:26px}.k div{background:#fff;border:1px solid #e6dfd2;border-radius:14px;padding:10px 16px}.c{background:#fff;border:1px solid #e6dfd2;border-radius:16px;padding:14px 16px;margin:0 0 10px}.m{color:#6b7a70;font-size:14px}.l{font-weight:700;color:#a3271c}.w{font-weight:700;color:#0b6b42}a{color:#0b6b42}</style>'
        + '<main><h1>Player feedback</h1><div class="m">Seat of Power · newest first · <a href="?key=' + encodeURIComponent(FEEDBACK_KEY) + '&format=csv">download CSV</a></div>'
        + '<div class="k"><div><b>' + rows.length + '</b>messages</div><div><b>' + avg + ' ★</b>average of ' + rated.length + '</div><div><b>' + new Set(rows.map(r => r.player)).size + '</b>players</div></div>'
        + playHtml
        + coHtml
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
      res.writeHead(200, { ...baseHeaders, "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Length": st.size, "Cache-Control": ext === ".webp" || ext === ".png" || ext === ".jpg" || ext === ".mp3" ? "public, max-age=86400" : "no-cache" });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(f).pipe(res);
    });
  } catch (e) {
    console.error("[server]", e);
    if (!res.headersSent) send(res, 500, { error: "error" });
  }
}).listen(PORT, () => console.log((FREE_CAREERS ? "[extras free] " : "") + "Seat of Power (Vatar edition) on :" + PORT + " · data in " + DATA + (SECRET ? "" : " · VATAR_SECRET not set: saves fall back to the device")));
