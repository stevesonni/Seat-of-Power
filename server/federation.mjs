/* Linked governments: a President's game and friends' governorships, each on
   its own phone. The President invites with one link; a friend's
   governorship joins with its state. What passes between them is real:
   the President's grants and federal projects, the governors' requests,
   and the Governors' Forum, which votes each year on the President's
   proposal. Each game applies what reaches it (events), once.

   POST /api/fed/<op>, JSON in and out (* the President's key):
     create  { presName, startYear }                → { code, presKey, invite }
     invite  { code, invite }                       → who invites, who has joined (no key needed)
     join    { code, invite, name, state }          → { key }
     view    { code, key }                          → the federation as that player sees it
     publish { code, key*, year, snap }             → the President's year: closes the forum, opens the next
     gpublish{ code, key, year, snap }              → a governor's numbers
     grant   { code, key*, state, amountB }         → money to a state (once a year each)
     project { code, key*, state, kind }            → a federal road, hospital or university (once a year each)
     ask     { code, key, kind, note }              → a governor asks for a grant or a project
     answer  { code, key*, id, yes }                → the President's answer
     vote    { code, key, pos }                     → the forum: "for" or "against" the President's proposal
     seen    { code, key, ids }                     → this phone applied these events
     remove  { code, key*, state }                  → the President drops a state */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MAX_STATES = 8;
const clip = (t, n) => String(t == null ? "" : t).replace(/[\u0000-\u0008\u000b-\u001f<>]/g, "").trim().slice(0, n);
const hash = (k) => crypto.createHash("sha256").update("fed:" + String(k || "")).digest("base64url");
const newKey = () => crypto.randomBytes(18).toString("base64url");
const CODE_CH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.randomBytes(6), b => CODE_CH[b % CODE_CH.length]).join("");
const same = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const id6 = () => crypto.randomBytes(6).toString("hex");

// The Governors' Forum: one proposal from the President each year.
export const FORUM = [
  { id: "police", q: "The President proposes state police: every state may raise its own force." },
  { id: "vat", q: "The President proposes a new VAT formula: more for the states that collect it." },
  { id: "wage", q: "The President proposes one minimum wage that every state must pay." },
  { id: "grazing", q: "The President proposes grazing reserves in every state." },
  { id: "power", q: "The President proposes that states may build and run their own power grids." },
  { id: "lg", q: "The President proposes paying local governments directly, past the states." },
  { id: "ports", q: "The President proposes that coastal states may run their own ports." },
  { id: "id", q: "The President proposes a national identity number for every resident within a year." },
];
export const PROJECTS = { road: { nm: "a federal road", costB: 3 }, hospital: { nm: "a federal medical centre", costB: 3 }, university: { nm: "a federal university", costB: 4 } };
export const forumFor = (year) => FORUM[(Math.max(1, year) - 1) % FORUM.length];

export const makeFederation = (DATA) => {
  const dir = path.join(DATA, "federations");
  fs.mkdirSync(dir, { recursive: true });
  const file = (code) => path.join(dir, code + ".json");
  const read = (code) => { if (!/^[A-Z2-9]{6}$/.test(String(code || ""))) return null; try { return JSON.parse(fs.readFileSync(file(code), "utf8")); } catch (e) { return null; } };
  const write = (f) => { f.at = Date.now(); const p = file(f.code), tmp = p + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(f)); fs.renameSync(tmp, p); };
  const locks = new Map();
  const withFed = (code, fn) => { const prev = locks.get(code) || Promise.resolve(); const next = prev.then(() => fn(read(code))).finally(() => { if (locks.get(code) === next) locks.delete(code); }); locks.set(code, next.catch(() => {})); return next; };
  const made = new Map();

  const roleOf = (f, key) => {
    if (!f || !key) return null; const h = hash(key);
    if (same(f.pres.keyHash, h)) return { role: "pres" };
    // A state the President dropped can still look (and learn it was dropped), but not act.
    const g = (f.govs || []).find(x => same(x.keyHash, h)); return g ? { role: "gov", state: g.state, left: !!g.left } : null;
  };
  const gov = (f, st) => (f.govs || []).find(x => x.state === st && !x.left);
  // An event for one phone: to "pres" or to a state.
  const event = (f, to, e) => { f.events = [...(f.events || []), { id: id6(), to, year: f.year, at: Date.now(), ...e }].slice(-200); };
  const say = (f, t) => { f.log = [...(f.log || []), { at: Date.now(), year: f.year, t: clip(t, 200) }].slice(-60); };
  const fg = (g, d) => { g.fg = Math.max(0, Math.min(100, (g.fg == null ? 50 : g.fg) + d)); };
  const publicOf = (f, me) => ({
    code: f.code, pres: { name: f.pres.name }, year: f.year, startYear: f.startYear, snap: f.snap || null,
    govs: (f.govs || []).filter(g => !g.left).map(g => ({ state: g.state, name: g.name, snap: g.snap || null, fg: g.fg == null ? 50 : g.fg, joined: g.joined })),
    forum: f.forum ? { ...f.forum, votes: f.forum.votes || {} } : null, lastForum: f.lastForum || null,
    requests: (f.requests || []).filter(r => me.role === "pres" || r.state === me.state).slice(-20),
    log: (f.log || []).slice(-30), me,
    events: (f.events || []).filter(e => !e.seen && (me.role === "pres" ? e.to === "pres" : e.to === me.state)),
  });
  const closeForum = (f) => {
    const F = f.forum; if (!F) return;
    const v = Object.values(F.votes || {}), yes = v.filter(x => x === "for").length, no = v.filter(x => x === "against").length;
    const passed = yes > no, R = { ...F, yes, no, passed, closed: f.year };
    f.lastForum = R;
    event(f, "pres", { kind: "forum", passed, yes, no, q: F.q, voted: v.length });
    for (const g of (f.govs || []).filter(x => !x.left)) { const pos = (F.votes || {})[g.state]; if (!pos) continue;
      fg(g, pos === "for" ? 5 : -5); event(f, g.state, { kind: "forum", pos, passed, q: F.q }); }
    if (v.length) say(f, "The Governors' Forum " + (passed ? "backed" : "rejected") + " the President, " + yes + " to " + no + ": " + F.q.replace(/^The President proposes /, ""));
    f.forum = null;
  };

  const ops = {
    create: async (b, ip) => {
      const day = new Date().toISOString().slice(0, 10), m = made.get(ip), n = m && m.day === day ? m.n : 0;
      if (n >= 10) return { _code: 429, error: "enough_today" }; made.set(ip, { day, n: n + 1 });
      let code = newCode(); for (let i = 0; i < 5 && read(code); i++) code = newCode();
      const presKey = newKey(), invite = newKey();
      const f = { code, created: Date.now(), pres: { name: clip(b.presName, 40) || "The President", keyHash: hash(presKey) }, inviteHash: hash(invite), startYear: Math.round(+b.startYear) || null,
        year: 0, govs: [], requests: [], events: [], log: [], forum: null, lastForum: null, given: {} };
      say(f, f.pres.name + " invited the governors."); write(f);
      return { ok: true, code, presKey, invite };
    },
    invite: async (b) => { const f = read(b.code); if (!f) return { _code: 404, error: "no_federation" }; if (!same(f.inviteHash, hash(b.invite))) return { _code: 403, error: "bad_invite" };
      return { ok: true, pres: f.pres.name, govs: (f.govs || []).filter(g => !g.left).map(g => ({ state: g.state, name: g.name })), full: (f.govs || []).filter(g => !g.left).length >= MAX_STATES }; },
    join: async (b) => withFed(b.code, (f) => {
      if (!f) return { _code: 404, error: "no_federation" }; if (!same(f.inviteHash, hash(b.invite))) return { _code: 403, error: "bad_invite" };
      const state = clip(b.state, 30), name = clip(b.name, 40); if (!state || !name) return { _code: 400, error: "no_state" };
      if (gov(f, state)) return { _code: 409, error: "state_taken" };
      if ((f.govs || []).filter(g => !g.left).length >= MAX_STATES) return { _code: 409, error: "full" };
      const key = newKey(); f.govs = [...(f.govs || []), { state, name, keyHash: hash(key), joined: Date.now(), fg: 50, snap: null }];
      event(f, "pres", { kind: "joined", state, name }); say(f, "Governor " + name + " of " + state + " joined the federation."); write(f);
      return { ok: true, key, pres: f.pres.name };
    }),
    view: async (b) => { const f = read(b.code), me = roleOf(f, b.key); if (!me) return { _code: f ? 403 : 404, error: f ? "not_member" : "no_federation" }; return { ok: true, fed: publicOf(f, me) }; },
    publish: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "pres") return { _code: 403, error: "not_president" };
      const year = Math.max(1, Math.min(20, Math.round(+b.year) || 1));
      if (b.snap && typeof b.snap === "object" && JSON.stringify(b.snap).length < 4000) f.snap = b.snap;
      if (year > f.year) { closeForum(f); f.year = year; const Q = forumFor(year); f.forum = { id: Q.id, q: Q.q, year, votes: {} }; f.given = {}; }
      write(f); return { ok: true, year: f.year };
    }),
    gpublish: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "gov" || me.left) return { _code: 403, error: "not_member" };
      const g = gov(f, me.state); if (b.snap && typeof b.snap === "object" && JSON.stringify(b.snap).length < 2000) g.snap = { ...b.snap, at: Date.now() };
      write(f); return { ok: true };
    }),
    grant: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "pres") return { _code: 403, error: "not_president" };
      const g = gov(f, String(b.state || "")); if (!g) return { _code: 404, error: "no_state" };
      const k = "grant:" + g.state; if (f.given[k]) return { _code: 409, error: "once_a_year" };
      const amountB = Math.max(1, Math.min(5, Math.round(+b.amountB || 2)));
      f.given[k] = true; fg(g, 5); event(f, g.state, { kind: "grant", amountB, from: f.pres.name });
      say(f, f.pres.name + " sent ₦" + amountB + "B to " + g.state + "."); write(f); return { ok: true, amountB };
    }),
    project: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "pres") return { _code: 403, error: "not_president" };
      const g = gov(f, String(b.state || "")); if (!g) return { _code: 404, error: "no_state" };
      const kind = PROJECTS[b.kind] ? b.kind : "road", k = "project:" + g.state; if (f.given[k]) return { _code: 409, error: "once_a_year" };
      f.given[k] = true; fg(g, 8); event(f, g.state, { kind: "project", project: kind, from: f.pres.name });
      say(f, f.pres.name + " sited " + PROJECTS[kind].nm + " in " + g.state + "."); write(f); return { ok: true, costB: PROJECTS[kind].costB };
    }),
    ask: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "gov" || me.left) return { _code: 403, error: "not_member" };
      if ((f.requests || []).some(r => r.state === me.state && !r.answer)) return { _code: 409, error: "already_asking" };
      const kind = ["grant", "road", "hospital", "university"].includes(b.kind) ? b.kind : "grant", g = gov(f, me.state);
      const r = { id: id6(), state: me.state, name: g.name, kind, note: clip(b.note, 200), year: f.year, at: Date.now(), answer: null };
      f.requests = [...(f.requests || []), r].slice(-60); event(f, "pres", { kind: "ask", rid: r.id, state: me.state, name: g.name, ask: kind, note: r.note });
      write(f); return { ok: true, id: r.id };
    }),
    answer: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "pres") return { _code: 403, error: "not_president" };
      const r = (f.requests || []).find(x => x.id === b.id); if (!r || r.answer) return { _code: 409, error: "answered" };
      const g = gov(f, r.state); if (!g) { r.answer = "gone"; write(f); return { ok: true }; }
      r.answer = b.yes ? "yes" : "no";
      let costB = 0;
      if (b.yes) { if (r.kind === "grant") { costB = 2; fg(g, 5); event(f, g.state, { kind: "grant", amountB: 2, from: f.pres.name, asked: true }); }
        else { costB = PROJECTS[r.kind].costB; fg(g, 8); event(f, g.state, { kind: "project", project: r.kind, from: f.pres.name, asked: true }); }
        say(f, f.pres.name + " granted " + g.state + "'s request (" + (r.kind === "grant" ? "₦2B" : PROJECTS[r.kind].nm) + ")."); }
      else { fg(g, -6); event(f, g.state, { kind: "refused", ask: r.kind, from: f.pres.name }); say(f, f.pres.name + " turned down " + g.state + "."); }
      write(f); return { ok: true, costB };
    }),
    vote: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "gov" || me.left) return { _code: 403, error: "not_member" };
      if (!f.forum) return { _code: 409, error: "no_forum" };
      if (!["for", "against"].includes(b.pos)) return { _code: 400, error: "bad_pos" };
      f.forum.votes[me.state] = b.pos; write(f); return { ok: true };
    }),
    seen: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me) return { _code: 403, error: "not_member" };
      const to = me.role === "pres" ? "pres" : me.state, ids = new Set((Array.isArray(b.ids) ? b.ids : []).map(String));
      for (const e of f.events || []) if (e.to === to && ids.has(e.id)) e.seen = true;
      write(f); return { ok: true };
    }),
    remove: async (b) => withFed(b.code, (f) => {
      const me = roleOf(f, b.key); if (!me || me.role !== "pres") return { _code: 403, error: "not_president" };
      const g = gov(f, String(b.state || "")); if (!g) return { ok: true };
      g.left = Date.now(); event(f, g.state, { kind: "removed", from: f.pres.name }); say(f, f.pres.name + " cut " + g.state + " out of the federation.");
      write(f); return { ok: true };
    }),
  };
  return async (op, b, ip) => { const fn = ops[op]; if (!fn) return { _code: 404, error: "no_op" }; const out = await fn(b || {}, ip); return out == null ? { _code: 404, error: "no_federation" } : out; };
};
