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
     move     { code, key*, seat, to }                        → a reshuffle into an empty seat
     seen     { code, key*, ids }                             → the leader's phone applied these events
     tempt    { code, key, take }                             → a minister takes or refuses a private offer
     oped     { code, key, headline, text }                   → a sacked minister writes (once a year)
     run      { code, key }  /  vote { code, key, seat }      → the cabinet's primary (once opened)
     crown    { code, key*, seat }                            → the leader names the successor
   (* the leader's key: the Governor's or the President's)
   "Hard politics" (create with hard: true): each year a minister may get a
   private offer. Taken, it fattens their own stash and nudges corruption;
   each year after, it may come out (an EFCC invitation on the front page). */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const SEATS = ["deputy", "finance", "works", "justice", "social"];
export const PRES_SEATS = ["vp", "finance", "works", "defence", "justice", "foreign", "labour", "petroleum"];
const seatsOf = (c) => c && c.gov && c.gov.office === "president" ? PRES_SEATS : SEATS;
// The odds (overridable for tests): an offer to a minister each year, and a taken offer coming out each year after.
const P_TEMPT = () => +(process.env.CAB_TEMPT || .4), P_EXPOSE = () => +(process.env.CAB_EXPOSE || .35);
const roll = () => crypto.randomInt(0, 1e6) / 1e6;
const OFFERS = {
  deputy: "A party baron offers ₦{a}M if his nephew gets a seat on the board of the state's bank.",
  vp: "A party baron offers ₦{a}M if his son gets a seat on the board of a federal agency.",
  finance: "A bank chairman offers ₦{a}M in \"consultancy\" if the government's accounts move to his bank.",
  works: "A contractor offers ₦{a}M if the next road contract goes his way.",
  justice: "A suspect's lawyer offers ₦{a}M for a weaker prosecution.",
  social: "A drug supplier offers ₦{a}M to win the hospitals' supply tender.",
  defence: "An arms dealer offers ₦{a}M if the helicopter order goes through at his price.",
  foreign: "A foreign firm offers ₦{a}M to fast-track its deal at the next summit.",
  labour: "A union boss offers ₦{a}M to look away from the strike fund's accounts.",
  petroleum: "A fuel marketer offers ₦{a}M to keep his subsidy claims flowing.",
};
const LINES = ["education", "health", "infrastructure", "security", "agriculture", "administration", "salaries", "debt"];
const YEAR_MS = 24 * 3600e3; // a year stays open for a day

const clip = (t, n) => String(t == null ? "" : t).replace(/[\u0000-\u0008\u000b-\u001f<>]/g, "").trim().slice(0, n);
const hash = (k) => crypto.createHash("sha256").update("cab:" + String(k || "")).digest("base64url");
const newKey = () => crypto.randomBytes(18).toString("base64url");
const CODE_CH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.randomBytes(6), b => CODE_CH[b % CODE_CH.length]).join("");
const same = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const rec0 = () => ({ advised: 0, followed: 0, overruled: 0, absent: 0, bids: 0, loyalty: 70, best: null, took: 0, stash: 0, exposed: 0 });
const PRIVATE = ["took", "stash"]; // a minister's own secrets: nobody else sees them
const recOut = (r, mine) => { const o = { ...(r || {}) }; if (!mine) for (const k of PRIVATE) delete o[k]; return o; };

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
    for (const s of seatsOf(c)) { const m = c.seats[s] && c.seats[s].member; if (m && same(m.keyHash, h)) return { role: "minister", seat: s }; }
    for (const s of seatsOf(c)) { const i = (c.seats[s].former || []).findIndex(f => f.keyHash && same(f.keyHash, h)); if (i >= 0) return { role: "former", seat: s, i, name: c.seats[s].former[i].name }; }
    return null;
  };
  // What everyone may see (never a key or a hash).
  const publicOf = (c, me) => {
    const mine = me.role === "minister" ? me.seat : null, minister = me.role !== "former";
    const out = {
      code: c.code, gov: c.gov, hard: !!c.hard, year: c.year, opened: c.opened, closesAt: c.opened ? c.opened + YEAR_MS : null, ended: c.ended || null,
      snap: c.snap || null, papers: c.papers || [], log: (c.log || []).slice(-30), opeds: (c.opeds || []).slice(-10),
      seats: Object.fromEntries(seatsOf(c).map(s => { const x = c.seats[s]; return [s, { open: !!x.open, member: x.member ? { name: x.member.name, joined: x.member.joined } : null, former: (x.former || []).map(f => ({ name: f.name, until: f.until })), rec: recOut(x.rec, s === mine) }]; })),
      letters: minister ? (c.letters || []) : [], bids: minister ? c.bids || {} : {}, split: minister ? c.split || null : null,
      primary: c.primary ? { open: !!c.primary.open, running: c.primary.running || [], votes: me.role === "host" ? c.primary.votes || {} : {}, myVote: mine ? (c.primary.votes || {})[mine] || null : null, count: Object.fromEntries((c.primary.running || []).map(r => [r, Object.values(c.primary.votes || {}).filter(v => v === r).length])) } : null,
      successor: c.successor || null, me,
    };
    if (mine && c.tempt && c.tempt[mine]) out.tempt = c.tempt[mine];
    if (me.role === "former") { const f = c.seats[me.seat].former[me.i]; out.former = { name: f.name, until: f.until, opedYear: f.opedYear || null, rec: recOut(f.rec, true) }; }
    if (me.role === "host") out.events = (c.events || []).filter(e => !e.seen);
    return out;
  };
  const event = (c, e) => { c.events = [...(c.events || []), { id: crypto.randomBytes(6).toString("hex"), year: c.year, at: Date.now(), ...e }].slice(-80); };
  const say = (c, t) => { c.log = [...(c.log || []), { at: Date.now(), year: c.year, t: clip(t, 200) }].slice(-60); };
  const R = (c, s) => (c.seats[s].rec = c.seats[s].rec || rec0());

  const ops = {
    create: async (b, ip) => {
      const day = new Date().toISOString().slice(0, 10), m = made.get(ip);
      const n = m && m.day === day ? m.n : 0; if (n >= 10) return { _code: 429, error: "enough_today" };
      made.set(ip, { day, n: n + 1 });
      let code = newCode(); for (let i = 0; i < 5 && read(code); i++) code = newCode();
      const hostKey = newKey(), invites = {};
      const office = b.office === "president" ? "president" : "governor", lead = office === "president" ? "The President" : "The Governor";
      const c = { code, created: Date.now(), host: { name: clip(b.hostName, 40) || lead, keyHash: hash(hostKey) },
        gov: { name: clip(b.govName || b.hostName, 40) || lead, state: clip(b.state, 30), startYear: Math.round(+b.startYear) || null, office },
        hard: !!b.hard, year: 0, opened: null, seats: {}, letters: [], bids: {}, split: null, papers: [], log: [], events: [], takes: [], tempt: {}, opeds: [] };
      for (const s of seatsOf(c)) { const inv = newKey(); invites[s] = inv; c.seats[s] = { open: true, inviteHash: hash(inv), member: null, former: [], rec: rec0() }; }
      say(c, c.gov.name + " formed a government" + (c.hard ? ", with hard politics on." : ".")); write(c);
      return { ok: true, code, hostKey, invites };
    },
    invite: async (b) => {
      const c = read(b.code), s = String(b.seat || ""); if (!c || !seatsOf(c).includes(s)) return { _code: 404, error: "no_cabinet" };
      const x = c.seats[s];
      if (!x.inviteHash || !same(x.inviteHash, hash(b.invite))) return { _code: 403, error: x.member ? "taken" : "bad_invite" };
      return { ok: true, gov: c.gov, seat: s, host: c.host.name, hard: !!c.hard, members: seatsOf(c).filter(k => c.seats[k].member).map(k => ({ seat: k, name: c.seats[k].member.name })), ended: !!c.ended };
    },
    join: async (b) => withCab(b.code, (c) => {
      const s = String(b.seat || ""); if (!c || !seatsOf(c).includes(s)) return { _code: 404, error: "no_cabinet" };
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
        for (const l of c.letters || []) { if (!l.seat || !c.seats[l.seat] || !c.seats[l.seat].member || l.advice) continue; R(c, l.seat).absent++; }
        c.letters = []; c.year = year; c.opened = Date.now();
        // Bids and Finance's split are for one year's budget.
        c.bids = {}; c.split = null;
        // Hard politics: offers taken in earlier years may come out; new offers arrive.
        if (c.hard) {
          for (const t of c.takes || []) { if (t.exposed || t.year >= year || roll() >= P_EXPOSE()) continue;
            t.exposed = year; const x = c.seats[t.seat]; if (x && x.member && x.member.name === t.name) R(c, t.seat).exposed++;
            event(c, { kind: "scandal", seat: t.seat, name: t.name, text: t.text, amt: t.amt });
            say(c, "The EFCC has invited " + t.name + " over ₦" + t.amt + "M from a private offer."); }
          c.tempt = {};
          for (const s2 of seatsOf(c)) { if (!c.seats[s2].member || roll() >= P_TEMPT()) continue; const amt = 20 * (1 + crypto.randomInt(0, 10));
            c.tempt[s2] = { id: crypto.randomBytes(5).toString("hex"), year, amt, text: (OFFERS[s2] || OFFERS.works).replace("{a}", amt), choice: null }; }
        }
      }
      if (b.primary && !c.primary) { c.primary = { open: true, running: [], votes: {}, opened: c.year }; say(c, "The primary is open: ministers may declare to succeed " + c.gov.name + "."); }
      if (b.snap && typeof b.snap === "object") { const sn = JSON.stringify(b.snap); if (sn.length < 12000) c.snap = b.snap; }
      if (Array.isArray(b.letters)) {
        const old = new Map((c.letters || []).map(l => [l.id, l]));
        const fresh = b.letters.slice(0, 30).map(l => { const id = clip(l.id, 120); if (!id) return null; const o = old.get(id);
          return { id, seat: seatsOf(c).includes(l.seat) ? l.seat : null, kind: clip(l.kind, 20), title: clip(l.title, 140), from: clip(l.from, 90), body: clip(l.body, 400),
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
      const s = String(b.seat || ""); if (!seatsOf(c).includes(s)) return { _code: 400, error: "bad_seat" };
      const x = c.seats[s], inv = newKey();
      // A sacked minister keeps their key as a former minister: they may write against the government.
      if (x.member) { x.former = [...(x.former || []), { name: x.member.name, until: c.year, rec: x.rec, keyHash: x.member.keyHash }].slice(-5); say(c, c.gov.name + " sacked " + x.member.name + ".");
        if (c.primary) { c.primary.running = (c.primary.running || []).filter(r => r !== s); delete (c.primary.votes || {})[s]; }
        if (c.tempt) delete c.tempt[s]; }
      x.member = null; x.open = true; x.inviteHash = hash(inv); x.rec = rec0();
      for (const l of c.letters || []) if (l.seat === s && !l.decided) l.advice = null;
      delete c.bids[s];
      write(c); return { ok: true, invite: inv };
    }),
    reinvite: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const s = String(b.seat || ""); if (!seatsOf(c).includes(s) || c.seats[s].member) return { _code: 409, error: "taken" };
      const inv = newKey(); c.seats[s].inviteHash = hash(inv); c.seats[s].open = true;
      write(c); return { ok: true, invite: inv };
    }),
    end: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      if (!c.ended) { c.ended = { at: Date.now(), why: clip(b.why, 80) }; if (+b.endYear) c.gov.endYear = Math.round(+b.endYear); say(c, "The government's term is over."); write(c); }
      return { ok: true };
    }),
    move: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const s = String(b.seat || ""), t = String(b.to || ""), S = seatsOf(c);
      if (!S.includes(s) || !S.includes(t) || s === t) return { _code: 400, error: "bad_seat" };
      const a = c.seats[s], z = c.seats[t]; if (!a.member) return { _code: 409, error: "empty" }; if (z.member) return { _code: 409, error: "taken" };
      z.member = a.member; z.rec = a.rec; z.open = false; z.inviteHash = null;
      const inv = newKey(); a.member = null; a.rec = rec0(); a.open = true; a.inviteHash = hash(inv);
      for (const l of c.letters || []) if (l.seat === s && !l.decided) l.advice = null;
      if (c.bids[s]) delete c.bids[s];
      if (c.tempt && c.tempt[s]) delete c.tempt[s];
      if (c.primary) { c.primary.running = (c.primary.running || []).map(r => r === s ? t : r); for (const [k, v] of Object.entries(c.primary.votes || {})) { if (v === s) c.primary.votes[k] = t; if (k === s) { c.primary.votes[t] = c.primary.votes[s]; delete c.primary.votes[s]; } } }
      say(c, c.gov.name + " moved " + z.member.name + " to a new portfolio."); write(c);
      return { ok: true, invite: inv };
    }),
    seen: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      const ids = new Set((Array.isArray(b.ids) ? b.ids : []).map(String)); for (const e of c.events || []) if (ids.has(e.id)) e.seen = true;
      write(c); return { ok: true };
    }),
    tempt: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "minister") return { _code: 403, error: "not_member" };
      const T = c.tempt && c.tempt[me.seat]; if (!T || T.choice) return { _code: 409, error: "no_offer" };
      const name = c.seats[me.seat].member.name; T.choice = b.take ? "took" : "refused";
      if (b.take) { const r = R(c, me.seat); r.took++; r.stash += T.amt; c.takes = [...(c.takes || []), { seat: me.seat, name, year: c.year, amt: T.amt, text: T.text }];
        event(c, { kind: "take", seat: me.seat }); } // the leader's phone feels it as corruption, never as a name
      write(c); return { ok: true, choice: T.choice };
    }),
    oped: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "former") return { _code: 403, error: "not_former" };
      const f = c.seats[me.seat].former[me.i]; if (f.opedYear === c.year) return { _code: 429, error: "once_a_year" };
      const headline = clip(b.headline, 90), text = clip(b.text, 600); if (!headline || !text) return { _code: 400, error: "empty" };
      f.opedYear = c.year;
      const o = { year: c.year, by: f.name, headline, text, at: Date.now() };
      c.opeds = [...(c.opeds || []), o].slice(-20); event(c, { kind: "oped", seat: me.seat, name: f.name, headline, text });
      say(c, f.name + ", sacked in year " + (f.until || 1) + ", wrote against the government: " + headline);
      write(c); return { ok: true };
    }),
    run: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "minister") return { _code: 403, error: "not_member" };
      if (!c.primary || !c.primary.open) return { _code: 409, error: "not_open" };
      if (!c.primary.running.includes(me.seat)) { c.primary.running.push(me.seat); say(c, c.seats[me.seat].member.name + " declared for the succession."); }
      write(c); return { ok: true };
    }),
    vote: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "minister") return { _code: 403, error: "not_member" };
      if (!c.primary || !c.primary.open) return { _code: 409, error: "not_open" };
      const t = String(b.seat || ""); if (!c.primary.running.includes(t)) return { _code: 400, error: "not_running" };
      c.primary.votes[me.seat] = t; write(c); return { ok: true };
    }),
    crown: async (b) => withCab(b.code, (c) => {
      const me = roleOf(c, b.key); if (!me || me.role !== "host") return { _code: 403, error: "not_host" };
      if (c.successor) return { ok: true, successor: c.successor };
      const s = b.seat ? String(b.seat) : null, x = s && c.seats[s];
      if (x && x.member) { c.successor = { seat: s, name: x.member.name, year: c.year }; R(c, s).loyalty = Math.min(100, R(c, s).loyalty + 15); say(c, c.gov.name + " anointed " + x.member.name + " as the government's candidate."); }
      else { c.successor = { seat: null, name: clip(b.name, 40) || "someone outside the cabinet", year: c.year };
        if (c.primary && (c.primary.running || []).length) for (const k of seatsOf(c)) if (c.seats[k].member) R(c, k).loyalty = Math.max(0, R(c, k).loyalty - 5);
        say(c, c.gov.name + " passed over the cabinet and anointed " + c.successor.name + "."); }
      if (c.primary) c.primary.open = false;
      write(c); return { ok: true, successor: c.successor };
    }),
  };
  return async (op, b, ip) => {
    const f = ops[op]; if (!f) return { _code: 404, error: "no_op" };
    const out = await f(b || {}, ip);
    return out == null ? { _code: 404, error: "no_cabinet" } : out;
  };
};
