/* The Cabinet's shared record: a government formed with friends.

   No Lagos Life session is needed: a friend may open the invite on any phone.
   Each person holds a secret key instead (the Governor's from creating the
   government, a minister's from accepting the invite); only its hash is kept.

   POST /api/cab/<op>, JSON in and out:
     create   { hostName, govName, state, startYear }        → { code, hostKey, invites }
     invite   { code, seat, invite }                          → the nomination (no key needed)
     join     { code, seat, invite, name }                    → { key }
     view     { code, key }                                   → the government, as that person sees it
     publish  { code, key*, year, snap, letters, paper }      → the Governor's phone shares the year
     decide   { code, key*, letterId, pick }                  → the Governor signed a letter
     advise   { code, key, letterId, pick, note }             → a minister's advice
     bid      { code, key, ask, note } | { split }            → the budget council
     usesplit { code, key* }                                  → the Governor took Finance's budget
     sack     { code, key*, seat }                            → a new invite for the seat
     reinvite { code, key*, seat }                            → a new invite for an empty seat
     end      { code, key*, endYear }                         → the term is over
   (* the Governor's key) */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const SEATS = ["deputy", "finance", "works", "justice", "social"];
const LINES = ["education", "health", "infrastructure", "security", "agriculture", "administration", "salaries", "debt"];
const YEAR_MS = 24 * 3600e3; // a year stays open for a day

const clip = (t, n) => String(t == null ? "" : t).replace(/[\u0000-\u0008\u000b-\u001f<>]/g, "").trim().slice(0, n);
const hash = (k) => crypto.createHash("sha256").update("cab:" + String(k || "")).digest("base64url");
const newKey = () => crypto.randomBytes(18).toString("base64url");
const CODE_CH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.randomBytes(6), b => CODE_CH[b % CODE_CH.length]).join("");
const same = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const rec0 = () => ({ advised: 0, followed: 0, overruled: 0, absent: 0, bids: 0, loyalty: 70, best: null });

export const makeCabinets = (DATA) => {
  const dir = path.join(DATA, "cabinets");
  fs.mkdirSync(dir, { recursive: true });
  const file = (code) => path.join(dir, code + ".json");
  const read = (code) => { if (!/^[A-Z2-9]{6}$/.test(String(code || ""))) return null; try { return JSON.parse(fs.readFileSync(file(code), "utf8")); } catch (e) { return null; } };
  const write = (c) => { c.at = Date.now(); const f = file(c.code), tmp = f + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(c)); fs.renameSync(tmp, f); };
  const locks = new Map();
  const withCab = (code, fn) => { const prev = locks.get(code) || Promise.resolve(); const next = prev.then(() => fn(read(code))).finally(() => { if (locks.get(code) === next) locks.delete(code); }); locks.set(code, next.catch(() => {})); return next; };
  const made = new Map(); // address → { day, n }: at most 10 governments a day each

  const roleOf = (c, key) => {
    if (!c || !key) return null;
    const h = hash(key);
    if (same(c.host.keyHash, h)) return { role: "host" };
    for (const s of SEATS) { const m = c.seats[s] && c.seats[s].member; if (m && same(m.keyHash, h)) return { role: "minister", seat: s }; }
    return null;
  };
  // What everyone may see (never a key or a hash).
  const publicOf = (c, me) => ({
    code: c.code, gov: c.gov, year: c.year, opened: c.opened, closesAt: c.opened ? c.opened + YEAR_MS : null, ended: c.ended || null,
    snap: c.snap || null, papers: c.papers || [], log: (c.log || []).slice(-30),
    seats: Object.fromEntries(SEATS.map(s => { const x = c.seats[s]; return [s, { open: !!x.open, member: x.member ? { name: x.member.name, joined: x.member.joined } : null, former: (x.former || []).map(f => ({ name: f.name, until: f.until })), rec: x.rec }]; })),
    letters: (c.letters || []).map(l => ({ ...l, opts: l.opts, advice: l.advice ? { ...l.advice, by: l.advice.by } : null })),
    bids: c.bids || {}, split: c.split || null, me,
  });
  const say = (c, t) => { c.log = [...(c.log || []), { at: Date.now(), year: c.year, t: clip(t, 200) }].slice(-60); };
  const R = (c, s) => (c.seats[s].rec = c.seats[s].rec || rec0());

  const ops = {
    create: async (b, ip) => {
      const day = new Date().toISOString().slice(0, 10), m = made.get(ip);
      const n = m && m.day === day ? m.n : 0; if (n >= 10) return { _code: 429, error: "enough_today" };
      made.set(ip, { day, n: n + 1 });
      let code = newCode(); for (let i = 0; i < 5 && read(code); i++) code = newCode();
      const hostKey = newKey(), invites = {};
      const c = { code, created: Date.now(), host: { name: clip(b.hostName, 40) || "The Governor", keyHash: hash(hostKey) },
        gov: { name: clip(b.govName || b.hostName, 40) || "The Governor", state: clip(b.state, 30), startYear: Math.round(+b.startYear) || null, office: "governor" },
        year: 0, opened: null, seats: {}, letters: [], bids: {}, split: null, papers: [], log: [] };
      for (const s of SEATS) { const inv = newKey(); invites[s] = inv; c.seats[s] = { open: true, inviteHash: hash(inv), member: null, former: [], rec: rec0() }; }
      say(c, c.gov.name + " formed a government."); write(c);
      return { ok: true, code, hostKey, invites };
    },
    invite: async (b) => {
      const c = read(b.code), s = String(b.seat || ""); if (!c || !SEATS.includes(s)) return { _code: 404, error: "no_cabinet" };
      const x = c.seats[s];
      if (!x.inviteHash || !same(x.inviteHash, hash(b.invite))) return { _code: 403, error: x.member ? "taken" : "bad_invite" };
      return { ok: true, gov: c.gov, seat: s, host: c.host.name, members: SEATS.filter(k => c.seats[k].member).map(k => ({ seat: k, name: c.seats[k].member.name })), ended: !!c.ended };
    },
    join: async (b) => withCab(b.code, (c) => {
      const s = String(b.seat || ""); if (!c || !SEATS.includes(s)) return { _code: 404, error: "no_cabinet" };
      const x = c.seats[s], name = clip(b.name, 30);
      if (!name) return { _code: 400, error: "no_name" };
      if (c.ended) return { _code: 409, error: "ended" };
      if (!x.inviteHash || !same(x.inviteHash, hash(b.invite))) return { _code: 403, error: x.member ? "taken" : "bad_invite" };
      const key = newKey();
      x.member = { name, keyHash: hash(key), joined: Date.now() }; x.inviteHash = null; x.open = false; x.rec = rec0();
      say(c, name + " was sworn in."); write(c);
      return { ok: true, key, seat: s, gov: c.gov };
    }),
    view: async (b) => { const c = read(b.code), me = roleOf(c, b.key); if (!me) return { _code: c ? 403 : 404, error: c ? "not_member" : "no_cabinet" }; return { ok: true, cab: publicOf(c, me) }; },
    publish: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const year = Math.max(1, Math.min(20, Math.round(+b.year) || 1));
      if (year > c.year) {
        // The old year closes: a letter its minister never answered counts as absent.
        for (const l of c.letters || []) { if (!l.seat || !c.seats[l.seat].member || l.advice) continue; R(c, l.seat).absent++; }
        c.letters = []; c.year = year; c.opened = Date.now();
        // Bids and Finance's split are for one year's budget.
        c.bids = {}; c.split = null;
      }
      if (b.snap && typeof b.snap === "object") { const sn = JSON.stringify(b.snap); if (sn.length < 12000) c.snap = b.snap; }
      if (Array.isArray(b.letters)) {
        const old = new Map((c.letters || []).map(l => [l.id, l]));
        const fresh = b.letters.slice(0, 30).map(l => { const id = clip(l.id, 120); if (!id) return null; const o = old.get(id);
          return { id, seat: SEATS.includes(l.seat) ? l.seat : null, kind: clip(l.kind, 20), title: clip(l.title, 140), from: clip(l.from, 90), body: clip(l.body, 400),
            opts: (Array.isArray(l.opts) ? l.opts : []).slice(0, 5).map(o2 => ({ id: clip(o2.id, 60), label: clip(o2.label, 120) })), stance: !!l.stance,
            advice: o ? o.advice : null, decided: o ? o.decided : null }; }).filter(Boolean);
        // Letters already decided stay on the record for the year.
        const keep = (c.letters || []).filter(l => l.decided && !fresh.some(f => f.id === l.id));
        c.letters = [...keep, ...fresh];
      }
      if (b.paper && b.paper.headline) c.papers = [{ year: c.year, headline: clip(b.paper.headline, 120), sub: clip(b.paper.sub, 160), good: !!b.paper.good, img: /^\.\/art\/[a-z0-9/_-]+\.webp$/.test(b.paper.img || "") ? b.paper.img : null }, ...(c.papers || [])].slice(0, 12);
      write(c); return { ok: true, year: c.year };
    }),
    decide: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const l = (c.letters || []).find(x => x.id === b.letterId); if (!l || l.decided) return { ok: true };
      const pick = b.pick == null ? null : clip(b.pick, 120);
      const followed = l.advice && pick != null && !l.stance ? l.advice.pick === pick : null;
      l.decided = { pick, followed, at: Date.now() };
      if (l.seat && c.seats[l.seat].member && l.advice && followed != null) {
        const r = R(c, l.seat);
        if (followed) { r.followed++; r.loyalty = Math.min(100, r.loyalty + 3); if (!r.best) r.best = l.title; say(c, c.gov.name + " took " + l.advice.by + "'s advice: " + l.title + "."); }
        else { r.overruled++; r.loyalty = Math.max(0, r.loyalty - 6); say(c, c.gov.name + " overruled " + l.advice.by + " on " + l.title + "."); }
      }
      write(c); return { ok: true, followed };
    }),
    advise: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "minister") return { _code: 403, error: "not_member" };
      const l = (c.letters || []).find(x => x.id === b.letterId);
      if (!l || l.seat !== me.seat) return { _code: 404, error: "not_your_letter" };
      if (l.decided) return { _code: 409, error: "decided" };
      const pick = clip(b.pick, 120); if (!l.opts.some(o => o.label === pick)) return { _code: 400, error: "bad_pick" };
      if (!l.advice) R(c, me.seat).advised++;
      l.advice = { pick, note: clip(b.note, 200), by: c.seats[me.seat].member.name, at: Date.now() };
      write(c); return { ok: true };
    }),
    bid: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "minister") return { _code: 403, error: "not_member" };
      const by = c.seats[me.seat].member.name;
      if (b.split && me.seat === "finance") {
        const sh = Object.fromEntries(LINES.map(k => [k, Math.max(0, Math.min(40, Math.round(+b.split[k] || 0)))]));
        if (LINES.reduce((a, k) => a + sh[k], 0) !== 100) return { _code: 400, error: "not_100" };
        c.split = { year: c.year, by, shares: sh, note: clip(b.note, 200), at: Date.now() };
        write(c); return { ok: true };
      }
      const ask = Object.fromEntries(Object.entries(b.ask || {}).filter(([k]) => LINES.includes(k)).map(([k, v]) => [k, Math.max(0, Math.min(40, Math.round(+v || 0)))]));
      if (!Object.keys(ask).length) return { _code: 400, error: "empty" };
      if (!c.bids[me.seat]) R(c, me.seat).bids++;
      c.bids[me.seat] = { year: c.year, by, ask, note: clip(b.note, 200), at: Date.now() };
      write(c); return { ok: true };
    }),
    usesplit: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      if (!c.split || c.split.used) return { ok: true };
      c.split.used = true; const r = R(c, "finance"); r.followed++; r.loyalty = Math.min(100, r.loyalty + 3); if (!r.best) r.best = "The " + (c.gov.startYear ? c.gov.startYear + c.year - 1 + " " : "") + "budget";
      say(c, c.gov.name + " sent " + c.split.by + "'s budget to the House."); write(c); return { ok: true };
    }),
    sack: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const s = String(b.seat || ""); if (!SEATS.includes(s)) return { _code: 400, error: "bad_seat" };
      const x = c.seats[s], inv = newKey();
      if (x.member) { x.former = [...(x.former || []), { name: x.member.name, until: c.year, rec: x.rec }].slice(-5); say(c, c.gov.name + " sacked " + x.member.name + "."); }
      x.member = null; x.open = true; x.inviteHash = hash(inv); x.rec = rec0();
      for (const l of c.letters || []) if (l.seat === s && !l.decided) l.advice = null;
      delete c.bids[s];
      write(c); return { ok: true, invite: inv };
    }),
    reinvite: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const s = String(b.seat || ""); if (!SEATS.includes(s) || c.seats[s].member) return { _code: 409, error: "taken" };
      const inv = newKey(); c.seats[s].inviteHash = hash(inv); c.seats[s].open = true;
      write(c); return { ok: true, invite: inv };
    }),
    end: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      if (!c.ended) { c.ended = { at: Date.now(), why: clip(b.why, 80) }; if (+b.endYear) c.gov.endYear = Math.round(+b.endYear); say(c, "The government's term is over."); write(c); }
      return { ok: true };
    }),
  };
  return async (op, b, ip) => {
    const f = ops[op]; if (!f) return { _code: 404, error: "no_op" };
    const out = await f(b || {}, ip);
    return out == null ? { _code: 404, error: "no_cabinet" } : out;
  };
};
