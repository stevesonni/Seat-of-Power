import { planSector } from "./plans.js";
/* Tori: the state's own Twitter-style feed (owner's design, 20 Nov 2026). Citizens, the press, the party and the
   opposition post about how the state is run; the governor has an account (@EbonyiGov…) and can post and reply.
   Everything is written by the game from the state of play, in English and Pidgin: no live AI, nothing per player.
   Pure functions: the screen (game/seat-of-power.jsx, ToriScreen) passes a context and draws what comes back. */

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let x = hash(seed) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const fmtM = (m) => { m = Math.round(+m || 0); return m >= 1000 ? "₦" + String(Math.round(m / 10) / 100).replace(/\.0+$/, "") + "B" : "₦" + m + "M"; };
const stNm = (st) => String(st || "").replace(/_/g, " ");
const tagSt = (st) => stNm(st).replace(/[^A-Za-z]/g, "");
export const toriHandle = (st) => /^nigeria$/i.test(String(st)) ? "@NGRPresident" : /^fct$/i.test(String(st)) ? "@FCTMinister" : "@" + tagSt(st) + "Gov";
export const fmtCount = (n) => n >= 1e6 ? (Math.round(n / 1e5) / 10) + "M" : n >= 1e3 ? (Math.round(n / 100) / 10) + "K" : String(Math.round(n));

// The people who post. art: a picture in public/art/characters.
const PEOPLE = [
  { who: "Tunde", what: "graduate", h: "tunde_no_work", art: "young-voter-student" },
  { who: "Mama Ngozi", what: "trader", h: "mamangozi_market", art: "market-trader" },
  { who: "Nurse Blessing", what: "nurse", h: "blessing_rn", art: "nurse" },
  { who: "Emeka", what: "mechanic", h: "emeka_fix_am", art: "okada-rider" },
  { who: "Aisha", what: "student", h: "aisha_unilife", art: "student-leader" },
  { who: "Mr Adeyemi", what: "teacher", h: "teacher_adeyemi", art: "teacher" },
  { who: "Dr Ifeoma", what: "doctor", h: "dr_ifeoma", art: "doctor" },
  { who: "Baba Sule", what: "farmer", h: "baba_sule_farms", art: "farmers-association-chair" },
];
const person = (r, k) => PEOPLE[(Math.floor(r() * PEOPLE.length) + (k || 0)) % PEOPLE.length];
const ago = (r, i) => (i < 3 ? (2 + Math.floor(r() * 50)) + "m" : (1 + Math.floor(r() * 20)) + "h");
const counts = (r, heat) => { const base = 40 + heat * 60; return { likes: Math.round(base * (1 + r() * 9)), rts: Math.round(base * (0.2 + r() * 2)), replies: Math.round(base * (0.1 + r())) }; };

/* ctx: { st, turn, year, app, cor, arrears, salariesLate, house: { loyal, seats }, strikes: [{ id, short, years }],
   done: [titles finished lately], fled: [{ proj, firm, to, lossM, back }], needs: [{ title }], govName, govParty,
   oppName, oppParty, reporter, speaker, tag (the street's trending tag), complaints: [{ id, who, place, t, icon, answered, lied }] } */

export function toriTrends(c) {
  const r = rngOf("trend" + c.st + c.turn), S = tagSt(c.st), out = [];
  const add = (tag, n, about) => out.push({ tag, n, count: fmtCount(n), about });
  (c.strikes || []).forEach(s => { add("#" + s.short.replace(/\W/g, "") + "Strike", 18000 + r() * 40000, s.short + " strike, year " + s.years); if (/ASUU/i.test(s.short)) add("#" + S + "StudentsAtHome", 6000 + r() * 9000, "Universities shut"); });
  if (c.arrears > 0) add("#PayOurSalaries" + S, 12000 + c.arrears * 6000 + r() * 5000, c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " owed");
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => add("#WhereIsOurMoney", 9000 + r() * 12000, f.firm + " ran to " + f.to));
  (c.done || []).slice(0, 2).forEach(t => add("#" + String(t).split(/\s+/).slice(0, 2).join("").replace(/\W/g, "") + "IsOpen", 3000 + r() * 6000, t + " finished"));
  if (c.tag) add(c.tag.startsWith("#") ? c.tag : "#" + c.tag, 4000 + r() * 8000, "Trending in " + stNm(c.st));
  if (c.app < 40) add("#" + S + "DeservesBetter", 8000 + r() * 9000, "Opposition supporters");
  else if (c.app >= 65) add("#" + S + "IsWorking", 5000 + r() * 7000, "Your supporters");
  if (c.cor > .5) add("#" + S + "Looted", 7000 + r() * 8000, "Corruption talk");
  add("#" + S + "Decides" + (c.year || ""), 1500 + r() * 3000, "Politics");
  const seen = new Set(); return out.filter(t => !seen.has(t.tag) && seen.add(t.tag)).sort((a, b) => b.n - a.n).slice(0, 8).map((t, i) => ({ ...t, rank: i + 1 }));
}

/* ── The feed, rebuilt (owner, 20 Nov 2026: "too stiff, zero context on replies, too repetitive. Haba!") ──
   - The people change: a cast drawn from the state's own zone (Hausa, Yoruba, Igbo, South-South, Middle Belt
     names), three regulars who stay all term, the rest new each year.
   - Every topic has many lines, filled with the record: the months owed, the union and its year, the place, the
     project, the contractor and the amount. A line used last year is not used again (seeded by year).
   - Posts have life: replies under them where people argue, joke and pile on, small everyday posts, quote-tweets
     of the news.
   - Continuity: people the governor replied to come back the next year to say whether the promise was kept.
   ctx extra: zone ("NW" "NE" "NC" "SW" "SE" "SS" or "NAT"), places (LGA names), back (last years' promises:
   { turn, kind, text, who, handle, art, topic, need, strike, proj }). */
const NAMES = {
  NW: { f: ["Aisha", "Hauwa", "Zainab", "Fatima", "Maryam", "Hadiza", "Rukayya", "Bilkisu"], m: ["Musa", "Abdullahi", "Sani", "Usman", "Bashir", "Kabiru", "Nura", "Auwal", "Ibrahim", "Yusuf"], l: ["Bello", "Danjuma", "Lawal", "Garba", "Umar", "Sule", "Shehu", "Yakubu"], ex: ["Wallahi", "Haba", "Kai"] },
  NE: { f: ["Fatima", "Amina", "Hafsat", "Falmata", "Zara", "Yagana"], m: ["Modu", "Bukar", "Ali", "Kyari", "Babagana", "Mustapha", "Adamu", "Goni"], l: ["Kachalla", "Mohammed", "Zanna", "Monguno", "Abba", "Tijani"], ex: ["Wallahi", "Haba", "Kai"] },
  NC: { f: ["Grace", "Ladi", "Esther", "Ene", "Mercy", "Hannatu"], m: ["Terver", "Ojonugwa", "Dauda", "Peter", "Isah", "Samuel", "Emmanuel", "Ndagi"], l: ["Iorliam", "Adah", "Gyang", "Abu", "Ochoche", "Kolo", "Pam"], ex: ["Ah ah", "Haba", "Chai"] },
  SW: { f: ["Bisi", "Funke", "Yetunde", "Kemi", "Bukola", "Iya Sade", "Tolani", "Morenike"], m: ["Tunde", "Segun", "Kunle", "Wale", "Femi", "Bayo", "Dapo", "Lekan", "Baba Lati"], l: ["Adeyemi", "Ogunleye", "Balogun", "Akinola", "Adebayo", "Ojo", "Lawal"], ex: ["Ehn", "Ah", "Olorun mi o"] },
  SE: { f: ["Ngozi", "Chioma", "Adaeze", "Uju", "Nneka", "Ifeoma", "Mama Ngozi", "Obiageli"], m: ["Emeka", "Chidi", "Obinna", "Ikenna", "Nnamdi", "Uche", "Kelechi", "Ebuka"], l: ["Okafor", "Eze", "Nwosu", "Okeke", "Nwachukwu", "Obi", "Udeh"], ex: ["Chai", "Haba", "Ewo"] },
  SS: { f: ["Ebi", "Ese", "Ekaette", "Tari", "Osaro", "Ibiere"], m: ["Tonye", "Ebiye", "Ovie", "Efosa", "Ekong", "Preye", "Akpan", "Tamuno"], l: ["Briggs", "Okpara", "Etim", "Omoregie", "Ikiriko", "Edet", "Ogbe"], ex: ["Abeg", "Haba", "Chai"] },
};
NAMES.NAT = { f: [].concat(NAMES.NW.f.slice(0, 3), NAMES.SW.f.slice(0, 3), NAMES.SE.f.slice(0, 3), NAMES.SS.f.slice(0, 2)), m: [].concat(NAMES.NW.m.slice(0, 3), NAMES.SW.m.slice(0, 3), NAMES.SE.m.slice(0, 3), NAMES.NC.m.slice(0, 2)), l: [].concat(NAMES.NW.l.slice(0, 2), NAMES.SW.l.slice(0, 2), NAMES.SE.l.slice(0, 2), NAMES.SS.l.slice(0, 2)), ex: ["Haba", "Chai", "Ehn"] };
const ROLES = [
  { what: "trader", art: "market-trader", g: "f" }, { what: "okada rider", art: "okada-rider", g: "m" }, { what: "nurse", art: "nurse", g: "f" },
  { what: "final-year student", art: "student-leader", g: "f" }, { what: "graduate, no job yet", art: "young-voter-student", g: "m" }, { what: "teacher", art: "teacher", g: "m" },
  { what: "doctor", art: "doctor", g: "f" }, { what: "mechanic", art: "mechanic", g: "m" }, { what: "farmer", art: "farmers-association-chair", g: "m" },
  { what: "civil servant", art: "civil-servant", g: "m" }, { what: "health worker", art: "health-worker", g: "f" }, { what: "truck driver", art: "truckers-union-leader", g: "m" },
  { what: "village head", art: "village-head", g: "m" }, { what: "vigilante", art: "vigilante-guard", g: "m" }, { what: "small contractor", art: "contractor", g: "m" }, { what: "pensioner", art: "grieving-mother", g: "f" },
];
const HSUF = ["", "_", "01", "_ng", "x", "jnr", "247", "official", "_the1st", "dey_ask"];
function castFor(c, seed, n, used0) {
  const z = NAMES[c.zone] || (c.nat ? NAMES.NAT : NAMES.SE), r = rngOf(seed), used = used0 || new Set(), out = [];
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const role = ROLES[Math.floor(r() * ROLES.length)], first = pick(r, z[role.g]), last = pick(r, z.l);
    if (used.has(first)) continue; used.add(first);
    const nick = /^(Mama|Iya|Baba)/.test(first) ? first : r() < .5 ? first : first + " " + last;
    out.push({ who: nick, what: role.what, art: role.art, h: (first.replace(/\W/g, "") + (r() < .5 ? "_" + last : "")).toLowerCase() + pick(r, HSUF), ex: pick(r, z.ex) });
  }
  return out;
}
const firstNm = (n) => String(n || "").replace(/^(Mama|Iya|Baba|Nurse|Dr|Mr|Mrs) /, "").split(" ")[0];

/* The year's events as a newsroom would write them: third person, no notes addressed to the player ("Your adviser
   has flagged…" is the game talking to you, not news), and a mood: good, bad or neutral. */
export function toriNews(c) {
  const boss = c.nat ? "the President" : "the Governor", Boss = c.nat ? "The President" : "The Governor";
  return (c.events || []).filter(e => !/^(Your adviser|Tip|Hint|Note:|You can|Remember)/i.test(e.text) && !/\bon Tori\b|\bTori:/.test(e.text)).map(e => {
    let t = String(e.text).replace(/^You\b/, Boss).replace(/\byou\b/g, boss).replace(/^Your\b/, Boss + "'s").replace(/\byour\b/g, boss + "'s").replace(/\bYou\b/g, Boss);
    const mood = e.tp ? (["policy", "success"].includes(e.tp) ? "good" : ["crisis", "scandal"].includes(e.tp) ? "bad" : "neutral") : (e.good ? "good" : "bad");
    return { text: t, mood };
  });
}

// Was a promise made on Tori kept? true / false, or null when the record can't tell.
export const promiseKept = (b, c) => b.kind === "arrears" ? !(c.arrears > 0) : b.kind === "talks" ? !(c.strikes || []).some(s => s.id === b.strike && !s.talks) : b.kind === "need" ? !(c.needs || []).some(n => n.title === b.need && !n.inWork) : b.kind === "japa" ? !(c.fled || []).some(f => f.proj === b.proj && !f.asked) : b.kind === "openbook" ? c.cor < .4 : null;
export function toriFeed(c) {
  const r = rngOf("feed" + c.st + c.turn), S = tagSt(c.st), N = stNm(c.st), me = toriHandle(c.st), boss = c.nat ? "the President" : "the Governor", HQ = c.nat ? "Aso Rock" : "Government House";
  const names = new Set(), regulars = castFor(c, "regular" + c.st, 3, names), cast = [...regulars, ...castFor(c, "cast" + c.st + c.turn, 12, names)];
  let ci = 0; const nextP = () => cast[ci++ % cast.length], other = (p) => cast[(cast.indexOf(p) + 1 + Math.floor(r() * (cast.length - 1))) % cast.length];
  const places = (c.places && c.places.length ? c.places : [N]), place = () => pick(r, places);
  const tags = toriTrends(c), T = (i) => (tags[i] || tags[0] || { tag: "#" + S }).tag, out = [];
  // Lines are picked per year: a pool's line used last year is skipped this year.
  const said = new Set(), say = (key, pool) => { const k0 = Math.floor(rngOf(key + c.st + (c.turn - 1))() * pool.length); let k = Math.floor(rngOf(key + c.st + c.turn)() * pool.length); if (k === k0 && pool.length > 1) k = (k + 1) % pool.length; for (let i = 0; i < pool.length && said.has(pool[k]); i++) k = (k + 1) % pool.length; said.add(pool[k]); return pool[k]; };
  const post = (p, text, heat, extra) => { const x = { id: "t" + hash(text + p.who), kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text, ago: ago(r, out.length), ...counts(r, heat), ...(extra || {}) }; out.push(x); return x; };
  const thread = (x, lines) => { x.thread = lines.filter(Boolean).slice(0, 3).map(([p, t]) => ({ name: p.who, handle: "@" + p.h, art: p.art, text: t })); return x; };
  // The complaints: the people waiting for an answer, first.
  (c.complaints || []).forEach((q, i) => out.push({ id: "q" + q.id + "_" + c.turn, kind: "complaint", complaint: q.id, name: q.who.split(",")[0], sub: q.place || "", handle: "@" + String(q.who.split(",")[0]).toLowerCase().replace(/[^a-z]/g, "_") + "_" + S.toLowerCase().slice(0, 4), art: null, who: q.who, text: (q.icon ? q.icon + " " : "") + q.t + " " + me, ago: ago(r, i), ...counts(r, 2), answered: q.answered, lied: q.lied }));
  // Promises from last year: the same people come back.
  (c.back || []).slice(-4).forEach(b => {
    const kept = promiseKept(b, c);
    if (kept === null) return;
    const p = { who: b.who || "A citizen", what: "replied to by " + boss, h: String(b.handle || "@citizen").replace(/^@/, ""), art: b.art || "young-voter-student" }, quote = "“" + briefT(b.text, 80) + "”";
    const x = post(p, kept ? pick(r, ["Last year " + me + " replied me: " + quote + " I came back to say: e happen. Thank you. 🙏🏾", "I screenshotted this last year: " + quote + " Credit where it's due, they did it.", "Receipts, but the good kind: " + quote + " Done. I'm not used to this 😅"]) : pick(r, ["A year ago " + me + " told me " + quote + " It's " + (c.year || "a new year") + ". Nothing. 📸", "Remember this? " + quote + " I do. I'm still waiting, " + me + ".", "Bringing this back: " + quote + " — " + boss + ", one year later. Still nothing. #" + S + "Remembers"]), kept ? 2 : 4, { tone: kept ? "good" : "bad", topic: kept ? "praise" : b.topic || "general", followUp: true, kept });
    const o = other(p); thread(x, [[o, kept ? pick(r, ["Wow. Respect where it's due.", "First time I'm seeing a politician keep a tweet promise.", "Okay this one na correct government."]) : pick(r, ["They don forget you. Dem no dey read their own replies.", "Same thing with my street. Promise and vanish.", "Ratio + retweet. Let them see it."])]]);
  });
  // Strikes.
  (c.strikes || []).forEach(s => {
    const p = nextP(), asuu = /ASUU/i.test(s.short), x = post(p, say("strike" + s.id, asuu ? [
      "Year " + s.years + " of this ASUU strike. My mates in Lagos don graduate, I'm still in 300 level. " + T(0),
      "I've watched every season of every Korean drama because of this ASUU strike. Year " + s.years + ". " + me + " are you happy?",
      "My mum asked when I'm going back to school. I said ask " + me + ". She said she did. Nobody answered. #ASUUStrike",
      "Lecturers no dey paid, we no dey school, " + boss + " dey travel. Year " + s.years + " of this nonsense.",
      p.ex + "! " + s.years + " years. I don learn barbing, I don learn tailoring. School is the only thing I haven't learnt. #ASUUStrike",
    ] : [
      "The " + s.short + " strike is in year " + s.years + ". Took my dad to the general hospital in " + place() + ". Locked. 🔒",
      "No staff, no service, no light. " + s.short + " strike, year " + s.years + ". " + me + " do something!",
      "Somebody tell " + me + " that " + s.short + " strike year " + s.years + " is not a vibe.",
      p.ex + ", this " + s.short + " strike. Every office I enter: 'come back when the strike is called off'.",
    ]), 3, { topic: "strike" });
    const o = other(p), o2 = other(o);
    thread(x, [[o, say("strikeR1" + s.id, ["Same here. My younger sister is now a full-time TikToker. 😭", "Who did the strike help? Nobody. Not the lecturers, not us.", "Year " + s.years + " and they're still 'at the table'. Which table? Dining table?"])], s.talks ? [o2, "Actually they met " + s.short + " this year. Small progress."] : [o2, "Nobody has met them. Not once. I asked the union rep myself."]]);
  });
  // Salaries.
  if (c.arrears > 0) { const p = nextP(), x = post(p, say("arrears", [
    "Na " + c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " now dem never pay us. Landlord don give me quit notice. #PayOurSalaries" + S,
    c.arrears + " months unpaid. My children's school sent them home for fees. And " + me + " posted about 'progress' this morning.",
    "Civil servants in " + N + " are trekking to work. " + c.arrears + " months. You can't eat promises. " + me,
    p.ex + "! " + c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " of no alert. I don dey borrow from my own children.",
    "Dear " + me + ", I am writing from the office where I have worked " + c.arrears + " months for free. Thank you for the experience. 🙂",
  ]), 4, { topic: "salaries" }); const o = other(p); thread(x, [[o, say("arrearsR", ["My own is " + c.arrears + " months too. Na the same story everywhere.", "And the commissioners just got new SUVs. I saw them at " + place() + ".", "Don't worry, they will pay one month before election 😂"])]]); }
  else { const p = nextP(); post(p, say("paid", ["Alert don land on the 25th again. I go talk true: salaries are steady under this government. #SalaryPaid", "Say what you like, " + N + " pays its workers on time now. That's not small.", "25th, alert. 26th, I paid my landlord. 27th, I'm happy. Simple things. 🙏🏾"]), 1, { tone: "good", topic: "salaries" }); }
  // Finished projects.
  (c.done || []).slice(0, 2).forEach((t, i) => { const p = nextP(), x = post(p, say("done" + i, [t + " is finally open! Took my mum there today 🙏🏾 " + me + " well done.", "I didn't believe it until I saw it. " + t + " is real. #" + String(t).split(/\s+/).slice(0, 2).join("").replace(/\W/g, "") + "IsOpen", "Drove past " + t + " today. Proper work. Not the usual 'flag-off and disappear'.", "Small thing but it matters: " + t + " is done. Credit to " + me + "."]), 2, { tone: "good", topic: "praise" });
    const o = other(p); thread(x, [[o, say("doneR" + i, ["Okay but how much did it cost? 👀", "Let's see if it lasts one rainy season.", "Credit where it's due. Now do my area."])]]); });
  // The money that fled.
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => { const p = nextP(), x = post(p, say("japa", ["So " + f.firm + " collected " + fmtM(f.lossM) + " for " + f.proj + " and is now posting pictures in " + f.to + "? And nobody is in jail? #WhereIsOurMoney", f.proj + ": " + fmtM(f.lossM) + " paid. Contractor in " + f.to + ". Site in " + place() + " is bush. Make it make sense.", "Breaking: " + f.firm + " has relocated to " + f.to + ". With our money. That's the tweet."]), 4, { topic: "japa" });
    const o = other(p); thread(x, [[o, f.asked ? "They say the Attorney-General has written to " + f.to + ". Let's see." : "Has anybody even reported them? I'm asking seriously."], [other(o), "Who signed the payment? That's the only question."]]); });
  // What people need.
  (c.needs || []).slice(0, 2).forEach((n, i) => { const p = nextP(), x = post(p, say("need" + i, [n.title + ". We don cry tire. " + me, n.title + ". Is anybody in " + HQ + " reading this?", "Daily update: " + n.title.replace(/[.!]$/, "") + ". Still. Tomorrow's update: probably the same.", p.ex + ". " + n.title + ". We are not asking for gold, just the basics. " + me]), n.late ? 4 : 2, { topic: "need" });
    const o = other(p); thread(x, [[o, n.inWork ? say("needW" + i, ["I saw workers there last week, to be fair.", "Work started o. Slowly, but it started.", "Trucks dey site now. Let's see if they finish."]) : say("needN" + i, ["Nobody has come. Not one surveyor.", "They came, took pictures, left. That was March.", "My uncle said they promised this one in the campaign too.", "Na only during election dem dey remember us."])]]); });
  if (c.cor > .45) { const p = nextP(), x = post(p, say("cor", ["Contracts to friends, roads to nowhere. " + N + " deserves better. #" + S + "Looted", "Ask yourself where the FAAC money goes every month. Just ask.", "My cousin's company bid for a contract. He lost to a company registered 3 weeks ago. 3 weeks. 🤡"]), 3, { topic: "corruption" }); thread(x, [[other(p), "Name the company. I dare you. 👀"]]); }
  if (c.app >= 60) { const p = nextP(); post(p, say("goodgov", ["Honestly " + boss + " is trying. Not perfect, but trying. #" + S + "IsWorking", "First time in years I see government people in my village in " + place() + ".", "I was a critic. I'm still a critic. But I'll admit the last year was better."]), 1, { tone: "good", topic: "praise" }); }
  // Everyday life: small posts that make the feed feel alive.
  const life = [
    "Light don go again for " + place() + ". Who else? 🕯️",
    "Who else saw " + boss + "'s convoy today? I counted 23 cars. Twenty. Three.",
    "The pothole on my street has a name now. We call it '" + (c.govName ? String(c.govName).split(" ").pop() : "Government") + " Pool'. 🏊🏾",
    "Small chops at the commissioning, no water at the hospital. Balance. ⚖️",
    "Rain fell for 20 minutes and " + place() + " became Venice. 🛶",
    "Just saw a commissioner jogging in " + place() + ". With 6 police escorts. For jogging. 🏃🏾",
    "Market price check, " + place() + ": tomato, pepper, onions, all up again. 😩",
  ];
  [0, 1].forEach(i => { const p = nextP(), x = post(p, say("life" + i, life.slice(i * 3).concat(life.slice(0, i * 3))), 1, { topic: "general" }); if (r() < .6) thread(x, [[other(p), pick(r, ["😂😂😂 I'm weak", "Na so we see am.", "E no go better? E go better. One day."])]]); });
  // What really happened this year: the news account posts it, a citizen quote-tweets it.
  const NEWS = { name: N + " News Now", sub: "News", handle: "@" + S + "NewsNow", art: "anchor-female", verified: true };
  const PRAISE = ["Finally! 👏🏾", "Credit where it's due.", "This one sweet me. Well done " + me + ".", "Good. Now keep the same energy.", "We see you 🙌🏾", "I'll believe it when I see it, but okay. 👀"];
  const DOUBT = ["Na so dem dey talk every year.", "Talk is cheap. We will see on the ground.", "And who will this one benefit? Their friends?", "Who did this help in " + place() + "?"];
  const ANGER = ["This is unacceptable. " + me + " explain yourself.", "Every day a new wahala. " + N + " deserves better.", "We are tired of this government.", "E don do! 😤", "I'm not even surprised anymore. That's the scary part."];
  const NEUTRAL = ["Let's see how this one goes.", "Okay. Will it change anything in " + place() + "?", "Noted. We are watching.", "Another day, another announcement. 🤷🏾"];
  toriNews(c).slice(0, 5).forEach((e, i) => {
    const id = "n" + hash(e.text + c.turn), hot = e.mood === "good" ? 1 : e.mood === "bad" ? 2 : 1;
    out.push({ id, kind: "news", ...NEWS, text: e.text, ago: ago(r, i + 1), ...counts(r, hot), tone: e.mood, topic: e.mood === "good" ? "praise" : "general" });
    if (e.mood === "neutral" && r() < .5) return;
    const p = nextP(), mood = e.mood === "good" ? (c.app >= 45 ? PRAISE : DOUBT) : e.mood === "bad" ? ANGER : NEUTRAL;
    out.push({ id: id + "r", kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text: pick(r, mood), quote: { name: NEWS.name, text: e.text }, ago: ago(r, i + 2), ...counts(r, hot), tone: e.mood, topic: e.mood === "good" ? "praise" : "general" });
  });
  // The press and the House.
  if (c.reporter) out.push({ id: "press" + c.turn, kind: "press", name: c.reporter, sub: "Investigative reporter", handle: "@" + c.reporter.split(" ")[0].toLowerCase() + "_reports", art: "reporter", text: c.cor > .4 ? "Working on a story about how contracts are awarded in " + N + ". DMs open for documents." : say("press", ["Approval for " + me + " is at " + Math.round(c.app) + "% in our latest street poll. Thread 🧵", "Spent the week in " + place() + " asking one question: is life better than last year? Answers in the thread 🧵", "We filed an FOI request for the " + (c.year || "") + " budget breakdown. Day 14. No reply."]), ago: ago(r, 5), ...counts(r, 2), verified: true, topic: c.cor > .4 ? "corruption" : "approval" });
  if (c.house) out.push({ id: "speaker" + c.turn, kind: "party", name: c.speaker || "The Speaker", sub: "Speaker, House of Assembly", handle: "@" + S + "Assembly", art: "lawmaker-opposition-leader", text: c.house.loyal * 2 >= c.house.seats ? "The House stands with the people of " + N + ". Bills that serve them will pass." : "The House will not be a rubber stamp. " + (c.house.seats - c.house.loyal) + " members have questions for the executive.", ago: ago(r, 6), ...counts(r, 1), verified: true, topic: "general" });
  // Order: complaints, then follow-ups, then mixed by heat with the news woven in.
  const q = out.filter(x => x.kind === "complaint"), fu = out.filter(x => x.followUp), news = out.filter(x => x.kind === "news" || x.quote), rest = out.filter(x => x.kind !== "complaint" && !x.followUp && x.kind !== "news" && !x.quote).sort((a, b) => b.likes - a.likes);
  const mixed = []; let ni = 0; rest.forEach((x, i) => { if (i % 2 === 0 && ni < news.length) { mixed.push(news[ni++]); if (news[ni] && news[ni].quote) mixed.push(news[ni++]); } mixed.push(x); });
  while (ni < news.length) mixed.push(news[ni++]);
  return [...q, ...fu, ...mixed];
}

// Everyday-life posts: what they are about.
export const toriLife = (t) => { const x = String((t && t.text) || "").toLowerCase();
  return /light don go|\blight\b|nepa|transformer|generator|darkness/.test(x) ? "light" : /convoy/.test(x) ? "convoy" : /pothole|venice|flood|rain fell/.test(x) ? "pothole" : /price|tomato|pepper|garri|onions/.test(x) ? "prices" : /escort|jogging/.test(x) ? "escort" : null; };

/* What the governor knows when replying: the post's subject and the fact from the record, shown above the options. */
export function toriReplyContext(t, c) {
  const topic = t.topic || toriTopic(t.text), st = (c.strikes || [])[0], f = (c.fled || []).find(x => !x.back), n = (c.needs || [])[0];
  const app = Math.round(c.app), prev = c.appPrev == null ? null : Math.round(c.appPrev);
  if (t.kind === "foreign") return { about: t.topic === "war" ? "The war with " + ((c.war || {}).nm || "the junta") : "Foreign relations", fact: c.war && t.topic === "war" ? (c.war.atWar ? "Nigeria is at war. Progress: " + (c.war.progress || 0) + " of 100." : "No war declared: sanctions and diplomacy only.") : "Corruption " + Math.round(c.cor * 100) + "% · approval " + app + "%." };
  switch (topic) {
    case "salaries": return { about: "Unpaid salaries", fact: c.arrears > 0 ? "You owe " + c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " of salaries. Paying one month comes from the Treasury." : "Salaries are up to date." };
    case "strike": return st ? { about: "The " + st.short + " strike", fact: "Year " + st.years + ". " + (st.talks ? "You met them this year." : "Nobody has met them this year.") } : { about: "Strikes", fact: "No strike is on right now." };
    case "japa": return f ? { about: f.firm + " and the " + f.proj + " money", fact: fmtM(f.lossM) + " gone to " + f.to + ". " + (f.asked ? "You have reported it." : "You have not reported it yet.") } : { about: "Missing money", fact: "No contractor has fled." };
    case "corruption": return { about: "Corruption", fact: "Corruption is at " + Math.round(c.cor * 100) + "%." + (c.cor < .4 ? " That is low." : " People can see it.") };
    case "need": return n ? { about: n.title, fact: n.inWork ? "Work has started on it." : "Nothing has started yet." + (n.late ? " It is overdue." : "") } : { about: "What people need", fact: "" };
    case "praise": return { about: t.followUp ? "A promise you kept" : "Good news", fact: (c.done || [])[0] ? (c.done[0] + " is finished.") : "" };
    case "approval": return { about: "How people rate you", fact: "Approval " + app + "%" + (prev != null ? " (last year " + prev + "%)" : "") + "." };
    default: { const L = toriLife(t);
      if (L) return { about: { light: "Power cuts", convoy: "Your convoy", pothole: "Roads and floods", prices: "Food prices", escort: "Officials' police escorts" }[L], fact: { light: "Electricity is run by the DisCos, but people blame you anyway.", convoy: "People notice how many cars you travel with.", pothole: (c.needs || []).length ? "There are " + (c.needs || []).length + " open needs on your list." : "Nothing on your list for that street yet.", prices: "Approval " + app + "%. Prices hurt every family.", escort: "Police escorts for officials are a sore point." }[L] };
      if (t.quote) return { about: "The news: " + briefT(t.quote.text, 60), fact: t.tone === "bad" ? "Bad news for you. People are angry." : t.tone === "good" ? "Good news, if people believe it." : "People are waiting to see what it means." };
      return { about: t.followUp ? "A promise from last year" : "What they said", fact: "Approval " + app + "%." }; }
  }
}

/* The opposition (owner, 20 Nov 2026: "monitor everything including complaints like a hawk and be scathing, even
   approval dips"). Every weak spot in the record becomes a post that tags the governor: approval falling, complaints
   ignored or lied to, salaries, strikes, the money that fled, corruption, abandoned projects, broken promises, the
   governor's own Tori moves (ratioed posts, lies called out, paid influencers, arrests, silence, apologies). Sorted
   by how much it hurts; the sharpest also land in the main feed and the governor's notifications.
   Extra ctx: appPrev (approval when last year closed), lies (Tori replies called out this year), tools (this year's
   Respond moves), debtB, heatStage, heatTag. */
export function toriOpposition(c) {
  const r = rngOf("opp" + c.st + c.turn), S = tagSt(c.st), N = stNm(c.st), nm = c.oppName || "The opposition candidate", party = c.oppParty || "the opposition", out = [];
  const me = toriHandle(c.st), boss = c.nat ? "the President" : "the Governor", house = c.nat ? "Aso Rock" : "Government House";
  const post = (text, w, topic) => out.push({ id: "o" + hash(text), kind: "opposition", name: nm, sub: (c.oppDeputy ? (c.nat ? "Vice-President" : "Deputy Governor") + " · " : "") + party + " candidate", handle: "@" + String(nm).replace(/^(Hon\.|Chief|Dr\.|Alhaji|Senator)\s*/, "").split(" ")[0].toLowerCase() + "4" + S.toLowerCase(), art: "opposition-candidate-alt", text, topic: topic || "approval", w, ago: "", ...counts(r, Math.min(6, 1 + w / 2)), verified: true, fair: w >= 1 });
  const app = Math.round(c.app), prev = c.appPrev == null ? null : Math.round(c.appPrev), T = c.tools || {};
  // Approval: every dip is news.
  if (prev != null && app <= prev - 2) post("Approval down from " + prev + "% to " + app + "% in one year. " + me + ", that is not a dip. That is " + N + " walking away from you. #" + S + "DeservesBetter", 6 + (prev - app) / 2);
  if (app < 40) post(app + "%. Even " + boss + "'s own party is not picking his calls. Fix it or step aside, " + me + ".", 6, "approval");
  else if (app < 50 && !(prev != null && app <= prev - 2)) post("Approval at " + app + "%. The people have spoken. " + N + " deserves a government that works. #" + S + "DeservesBetter", 4);
  else if (prev != null && app > prev + 2) post("Up to " + app + "% and " + house + " is celebrating. That still leaves " + (100 - app) + "% of " + N + " who think you are failing, " + me + ".", 1.5);
  // Complaints: ignored, or answered with a lie.
  (c.complaints || []).filter(k => k.lied).slice(0, 2).forEach(k => post(me + " told " + String(k.who).split(",")[0] + (k.place ? " in " + k.place : "") + " it was handled. It was not. Lying to the people who tag you for help. #" + S + "GovLies", 7));
  (c.complaints || []).filter(k => !k.answered && !k.lied).slice(0, 2).forEach(k => post(String(k.who).split(",")[0] + (k.place ? " from " + k.place : "") + " tagged " + me + ": “" + briefT(k.t, 70) + "” No reply. Time for photo-ops, no time for his own people.", 4.5));
  // The record.
  if (c.arrears > 0) post(c.arrears + " months of unpaid salaries. Workers are borrowing to feed their children while " + me + " rides in a convoy. When we come in, salaries land on the 25th. Write it down.", 5 + c.arrears, "salaries");
  (c.strikes || []).forEach(s => post("Year " + s.years + " of the " + s.short + " strike. A generation is losing years at home while " + me + " is posting photos. Shameful.", 3 + s.years, "strike"));
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => post(f.firm + " ran to " + f.to + " with " + fmtM(f.lossM) + " meant for " + f.proj + ". Who signed the payment, " + me + "? Who is protecting who? #WhereIsOurMoney", 6, "japa"));
  if (c.cor > .4) post("Corruption at " + Math.round(c.cor * 100) + "%. Every contract in " + N + " goes to the same three names. We have the list. Watch this space.", 3 + (c.cor - .4) * 20, "corruption");
  if ((c.stalled || 0) > 0) post(c.stalled + " abandoned project" + (c.stalled === 1 ? "" : "s") + ". Bushes where the roads were promised. Come and see them with me, " + me + ". I'll send the location.", 3 + c.stalled, "need");
  const late = (c.needs || []).filter(n => n.late)[0];
  if (late) post(late.title + ". He was told. He did nothing. That is the whole story of this government.", 4, "need");
  if ((c.broken || 0) > 0) post(c.broken + " promise" + (c.broken === 1 ? "" : "s") + " broken, and counting. Screenshot everything " + me + " says. #" + S + "Remembers", 3 + c.broken);
  if ((c.debtB || 0) >= (c.nat ? 800 : 120)) post("₦" + Math.round(c.debtB) + "B of debt. Our grandchildren will be paying for this government's convoys.", 3, "corruption");
  toriNews(c).filter(e => e.mood === "bad").slice(0, 1).forEach(e => post("“" + briefT(e.text, 90) + "” And " + me + " calls this progress?", 3.5));
  // His own moves on Tori.
  if ((c.ratios || 0) > 0) post("Ratioed by his own people " + (c.ratios === 1 ? "again" : c.ratios + " times this year") + ". Read the replies, " + me + ". That is " + N + " talking.", 4);
  if ((c.lies || 0) > 0) post((c.lies === 1 ? "Another" : c.lies) + " claim" + (c.lies === 1 ? "" : "s") + " from " + me + " called out in the replies within minutes. You can't lie to people who live here.", 4 + c.lies);
  if (T.bots) post("Paid influencers pushing copy-paste praise for " + me + ". Even the propaganda is lazy.", 5);
  if (T.crackdown) post("Arresting critics now? You can lock up people, " + me + ", not the truth. #FreeThe" + S + "Critics", 6);
  if (T.apology) post("Another apology from " + me + ". Sorry does not pay salaries.", 3);
  if (T.sack) post("A commissioner sacked to save his own skin. The rot starts at the top, " + me + ".", 3);
  if (T.silent && (c.heatStage || 0) >= 3) post("Where is " + me + "? " + N + " is burning and he has gone quiet. Is he in London?", 5);
  if ((c.heatStage || 0) >= 4 && c.heatTag) post(c.heatTag + " is trending across Nigeria. This is what failure looks like, " + me + ".", 5);
  // A year without a single post: they make it about the silence.
  toriSilence(c).opp.forEach(o => post(o.text, o.w, "approval"));
  // Even good news gets a jab.
  (c.done || []).slice(0, 1).forEach(d => post(d + " is open. Good. Now publish what it cost, " + me + ". We'll be checking the invoice.", 1.2, "approval"));
  post(pick(r, ["We are going ward to ward. " + N + " is ready for change. #" + S + "Decides" + (c.year || ""), "Join us this Saturday at the town hall. Bring your questions; we will bring answers."]), 0.5, "general");
  return out.sort((a, b) => b.w - a.w).slice(0, 9).map((p, i) => ({ ...p, ago: ago(r, i) }));
}
const briefT = (t, n) => { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; };

/* What the governor can post: built from what is really happening. truth: false means the claim is not backed by the
   record (the replies will say so). */
export function toriOptions(c) {
  const out = [], S = tagSt(c.st), N = stNm(c.st), app = Math.round(c.app || 0), prev = c.appPrev == null ? null : Math.round(c.appPrev), Y = c.turn || 0;
  const opp = c.oppName ? String(c.oppName).replace(/^(Hon\.|Chief|Dr\.|Alhaji|Senator)\s*/, "") : null, oppFirst = opp ? opp.split(" ").pop() : null;
  const ev = (c.events || []).filter(e => e && e.text && !/\bon Tori\b|\bTori:/.test(e.text));
  // This year's real events come first: the best one to celebrate, the worst one to own (or spin).
  const good = ev.find(e => e.good), bad = ev.find(e => !e.good && /crisis|scandal/.test(e.tp || ""));
  if (good) out.push({ id: "ev_" + hash(good.text), text: briefT(good.text, 150) + " That is what we promised " + N + ", and we are not done.", truth: true, about: "praise", fresh: true });
  if (bad) {
    out.push({ id: "own_" + hash(bad.text), text: "I have seen the reports: “" + briefT(bad.text, 110) + "” It happened on my watch. I am on it, and I will give an update by Friday.", truth: true, about: "general", soft: true, fresh: true });
    out.push({ id: "spin_" + hash(bad.text), text: "What you are reading about “" + briefT(bad.text, 70) + "” is the opposition's exaggeration. Everything is under control. #" + S + "Rising", truth: false, about: "general", fresh: true });
  }
  // How people rate you, against last year.
  if (prev != null && app <= prev - 3) out.push({ id: "app_down_" + Y, text: "Approval went from " + prev + "% to " + app + "% this year. I hear you, " + N + ". I will spend the next year fixing what you have told me is broken.", truth: true, about: "approval", soft: true, fresh: true });
  else if (prev != null && app >= prev + 3) out.push({ id: "app_up_" + Y, text: "Up from " + prev + "% to " + app + "%. Thank you, " + N + ". We keep our heads down and keep delivering.", truth: true, about: "approval", fresh: true });
  // Complaints: say you will come, or claim you already did.
  const k = (c.complaints || []).find(x => !x.answered);
  if (k) out.push({ id: "cmp_" + k.id, text: "To everyone in " + (k.place || N) + " who tagged me about this: I have read every one. My team is coming to " + (k.place || "you") + " this week.", truth: false, about: "need", fresh: true });
  const ka = (c.complaints || []).find(x => x.answered && !x.lied);
  if (ka) out.push({ id: "cmpd_" + ka.id, text: (ka.place || N) + ", you asked and we came. That is how this government works: tag me, and we answer.", truth: true, about: "need", fresh: true });
  // The record.
  if (!c.arrears) out.push({ id: "salaries", text: "Salaries paid on the 25th again. Every worker, every month. That is our promise. #SalaryPaid", truth: true, about: "salaries" });
  else out.push({ id: "salaries_" + c.arrears, text: c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " of salaries are owed. I will not pretend otherwise. The first payment goes out before the next allocation.", truth: true, about: "salaries", soft: true },
    { id: "salaries_claim", text: "Salaries are being paid. Don't listen to the opposition. #SalaryPaid", truth: false, about: "salaries" });
  (c.done || []).slice(0, 2).forEach(t => out.push({ id: "done_" + t, text: t + " is open. Built by " + N + ", for " + N + ". More is coming. #" + String(t).split(/\s+/).slice(0, 2).join("").replace(/\W/g, "") + "IsOpen", truth: true, about: "praise" }));
  (c.strikes || []).forEach(st => out.push({ id: "strike_" + st.id, text: "We are at the table with " + st.short + ". Our children will be back in class. We are not sleeping on this. #" + st.short.replace(/\W/g, "") + "Strike", truth: !!st.talks, about: "strike" }));
  (c.needs || []).slice(0, 1).forEach(n => out.push({ id: "need", text: n.title + ": we have heard you. Work starts this year.", truth: !!n.inWork, about: "need" }));
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => out.push({ id: "japa", text: f.firm + " will not enjoy our money in " + f.to + ". We are going after every naira. #WhereIsOurMoney", truth: !!f.asked, about: "japa" }));
  // The opposition, by name.
  if (opp) out.push({ id: "opp_" + Y, text: oppFirst + " had " + (c.nat ? "years in power" : "every chance") + " and built nothing. While " + oppFirst + " tweets, we work. " + N + " can see the difference.", truth: true, about: "attack", attack: true });
  else if (c.app < 50) out.push({ id: "attack", text: "The opposition had 8 years and built nothing. We will not take lectures from them.", truth: true, about: "attack", attack: true });
  if (c.tag) out.push({ id: "tag_" + hash(c.tag), text: "I have seen " + c.tag + " trending. I am listening. Come to the town hall on Saturday and tell me to my face.", truth: true, about: "general", soft: true });
  out.push({ id: "thanks", text: "Thank you, " + N + ". Every day in this office is for you. 🇳🇬", truth: true, about: "thanks", soft: true });
  // Fresh ones first; no two with the same text.
  const seen = new Set();
  return out.filter(o => !seen.has(o.text) && seen.add(o.text)).sort((a, b) => (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0)).slice(0, 7);
}

/* How a post lands. Returns { likes, rts, replies: [{ name, handle, art, text }], ratio, fx: { app }, line }. */
export function toriReact(opt, c, seed) {
  const r = rngOf("react" + seed), S = tagSt(c.st), fans = c.app / 100, reach = 1 + Math.max(0, c.app - 30) / 20;
  let likes = Math.round((200 + r() * 800) * reach * (opt.truth ? 1.4 : .6)), rts = Math.round(likes * (0.1 + r() * 0.3)), app = 0, ratio = false;
  const reply = (p, text) => ({ name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text });
  const replies = [];
  // The aide's draft says how people answer it (server/tori-ai.mjs makeToriCompose).
  if (opt.reaction) replies.push(reply(person(r, 7), opt.truth === false && opt.callout ? opt.callout : opt.reaction));
  if (!opt.truth) {
    ratio = true; app = -2; likes = Math.round(likes * .5);
    replies.push(reply(person(r, 0), pick(r, ["Which one be this? " + (opt.about === "salaries" ? "We never see salary since " + c.arrears + " months." : opt.about === "strike" ? "Nobody don meet ASUU. Stop lying." : opt.about === "japa" ? "Going after who? Nothing has happened." : "Nothing is happening on the ground. Nothing."), "Ratio. This is not true and you know it."])));
    replies.push(reply(person(r, 3), "Screenshot this tweet. We will remember in the election."));
    replies.push({ name: c.oppName || "The opposition", sub: "Opposition candidate", handle: "@opposition", art: "opposition-candidate-alt", text: "Even their tweets are lies. " + S + " deserves better.", verified: true });
  } else if (opt.attack) {
    app = c.app < 40 ? 0 : 1; replies.push(reply(person(r, 1), "Abeg focus on governance, leave politics for now.")); replies.push(reply(person(r, 6), "True talk. They had their chance."));
  } else {
    app = opt.soft ? 0 : 1 + (fans > .6 ? 1 : 0);
    replies.push(reply(person(r, 2), pick(r, ["Well done sir 👏🏾", "This is what we want to see. More of this.", "God bless you. Keep going."])));
    replies.push(reply(person(r, 4), pick(r, ["Okay but what about my area? 👀", "Good. Now do the same for the market road.", "We are watching. Deliver."])));
    if (c.app < 45) replies.push(reply(person(r, 5), "Na now una remember us? Election don near."));
  }
  const line = ratio ? "The replies say it isn't true. Approval " + app + "." : app > 0 ? "It landed. " + fmtCount(likes) + " likes. Approval +" + app + "." : "Seen and shared. " + fmtCount(likes) + " likes.";
  return { likes, rts, replies, ratio, fx: app ? { app } : {}, line };
}

export const TORI_POSTS_PER_YEAR = 3;
export const TORI_COMMENTS_PER_YEAR = 6;

/* What the governor can reply under a tweet. fx: what it does to approval; truth: false when the record says otherwise
   (the reply gets called out). */
export function toriComments(t, c) {
  const S = stNm(c.st), out = [];
  if (t.kind === "opposition") {
    const fair = (c.arrears > 0 && /salar/i.test(t.text)) || ((c.strikes || []).length && /strike/i.test(t.text)) || (c.app < 50 && /%/.test(t.text)) || ((c.fled || []).some(f => !f.asked) && /contractor|money/i.test(t.text));
    out.push({ id: "rebut", text: "That is not true. Check the record: " + S + " is moving forward.", truth: !fair, fx: { app: fair ? -1 : 1 } });
    out.push({ id: "work", text: "We are busy working. Results will speak.", truth: true, fx: {} });
  } else if (t.tone === "good") {
    out.push({ id: "thanks", text: "Thank you! This is just the beginning 🙏🏾", truth: true, fx: { app: 1 } });
    out.push({ id: "credit", text: "Credit to the team that made it happen.", truth: true, fx: {} });
  } else {
    out.push({ id: "onit", text: "We hear you. We are on it.", truth: true, fx: {}, promise: true });
    out.push({ id: "sorry", text: "You are right to be angry. We will do better.", truth: true, fx: { app: 1 } });
    out.push({ id: "deny", text: "This is not true. Don't believe everything you read.", truth: false, fx: { app: -1 } });
  }
  return out;
}
/* The people's answer to the governor's reply. */
export function toriCommentReact(opt, c, seed) {
  const r = rngOf("cr" + seed);
  if (opt.truth === false) return { replies: [{ name: pick(r, PEOPLE).who, text: pick(r, ["Ehn? Not true? We are living it.", "Screenshot. This one will age badly.", "Ratio + you know what you did."]) }], line: "Called out" };
  if (opt.promise) return { replies: [{ name: pick(r, PEOPLE).who, text: pick(r, ["We are holding you to this.", "We dey wait. Na your word be this.", "Okay. Next year we will check."]) }], line: "Noted" };
  return { replies: [{ name: pick(r, PEOPLE).who, text: pick(r, ["❤️", "Respect for replying!", "This is the kind of governor we want.", "The governor replied me 😭🙌🏾"]) }], line: "Liked" };
}

/* ── Heat: Tori as the fourth estate (owner, 20 Nov 2026; ideas from Gemini, Perplexity, Grok and Google) ──
   No meter on screen: heat is read in the feed itself (who is posting, what is trending, how far it has spread) and
   in a "why this is trending" card with the causes. Heat is a story with receipts, never random:
   - stories: each grievance from the record (unpaid salaries, a strike, money gone abroad, corruption, ignored
     needs, stalled projects, broken promises, ratioed posts), with its hashtag, who is angry, their demand and the fix;
   - it carries over from year to year: below 40 it fades, from 40 it holds, from 60 it snowballs;
   - stages: 0 quiet · 1 grumbling (25) · 2 trending in the state (40) · 3 trending in Nigeria (60) · 4 on the streets (75)
     · 5 "<State>GovMustGo" (90): resign or fight. */
export const HEAT_STAGES = [
  { min: 0, id: "quiet", nm: "Quiet" }, { min: 25, id: "grumbling", nm: "Grumbling" }, { min: 40, id: "state", nm: "Trending in the state" },
  { min: 60, id: "national", nm: "Trending in Nigeria" }, { min: 75, id: "streets", nm: "On the streets" }, { min: 90, id: "mustgo", nm: "Must go" },
];
export const heatStage = (h) => { let i = 0; HEAT_STAGES.forEach((s, k) => { if (h >= s.min) i = k; }); return i; };

export function toriStories(c) {
  const S = tagSt(c.st), out = [];
  const add = (o) => out.push(o);
  if (c.arrears > 0) add({ id: "salaries", tag: "#PayOurSalaries" + S, heat: 12 + c.arrears * 6, who: "NLC, civil servants", cause: c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " of salaries unpaid", demand: "Pay the arrears", fix: "treasury" });
  (c.strikes || []).forEach(x => add({ id: "strike_" + x.id, tag: "#" + x.short.replace(/\W/g, "") + "Strike", heat: 10 + x.years * 6, who: x.short, cause: "The " + x.short + " strike is in year " + x.years, demand: "Settle with " + x.short, fix: "roundtable" }));
  (c.fled || []).filter(f => !f.back && !f.asked).forEach(f => add({ id: "japa_" + f.proj, tag: "#WhereIsOurMoney", heat: Math.min(16, 8 + (f.lossM || 0) / 600), who: "Budget watchdogs", cause: f.firm + " ran to " + f.to + " with the money for " + f.proj, demand: "Recover the money", fix: "visit" }));
  if (c.cor > .45) add({ id: "corruption", tag: "#" + S + "Looted", heat: Math.round((c.cor - .45) * 60), who: "Watchdogs, the opposition", cause: "Corruption is at " + Math.round(c.cor * 100) + "%", demand: "Publish the contracts; sack the crooked", fix: "people" });
  const late = (c.needs || []).filter(n => n.late).length; if (late) add({ id: "needs", tag: "#" + S + "Deserves" + "Better", heat: late * 6, who: "Market women, traditional rulers", cause: late + " need" + (late === 1 ? "" : "s") + " left until the last year", demand: "Fix what you were told about", fix: "needs" });
  if ((c.stalled || 0) > 0) add({ id: "stalled", tag: "#AbandonedProjects" + S, heat: c.stalled * 4, who: "Budget watchdogs", cause: c.stalled + " project" + (c.stalled === 1 ? "" : "s") + " stalled", demand: "Finish what you started", fix: "projects" });
  if ((c.broken || 0) > 0) add({ id: "promises", tag: "#" + S + "Remembers", heat: c.broken * 5, who: "The opposition", cause: c.broken + " promise" + (c.broken === 1 ? "" : "s") + " broken", demand: "Keep your word", fix: null });
  if ((c.ratios || 0) > 0) add({ id: "ratios", tag: "#" + S + "Gov" + "Lies", heat: c.ratios * 6, who: "Everyone with a phone", cause: "Your posts were ratioed " + c.ratios + " time" + (c.ratios === 1 ? "" : "s"), demand: "Stop the lies", fix: null });
  if (c.app < 50) add({ id: "approval", tag: "#" + S + "DeservesBetter", heat: Math.round((50 - c.app) * .4), who: "Ordinary people", cause: "Approval is " + Math.round(c.app) + "%", demand: "Govern better", fix: null });
  return out.sort((a, b) => b.heat - a.heat);
}
// Things that cool the feed this year.
export const toriCooling = (c) => Math.min(20, (c.delivered || 0) * 3 + Math.max(0, c.app - 60) * .3);

/* Heat now: what carried over from earlier years, today's stories, minus cooling, plus the governor's own moves
   this year (adj: press conferences, apologies, bots, crackdowns). */
export function toriHeat(c, mem) {
  const m = mem || {}, prev = m.heat || 0, carry = prev < 40 ? .4 : prev < 60 ? .7 : .9;
  const stories = toriStories(c), raw = stories.reduce((a, s) => a + s.heat, 0);
  const h = Math.max(0, Math.min(100, Math.round(prev * carry + raw * .8 - toriCooling(c) + (m.adj || 0))));
  return { heat: h, stage: heatStage(h), stages: HEAT_STAGES, stories };
}

/* What a year at each stage costs (applied when the year closes). */
export function heatFx(stage) {
  return [{}, { app: -1 }, { app: -3 }, { app: -4, pStab: -4, igrPct: -5 }, { app: -6, pStab: -6, igrPct: -15, house: -2 }, { app: -8, pStab: -8, igrPct: -20, house: -3 }][stage] || {};
}

/* The institutions: they post only when their people are affected, or when the heat is high enough to matter. */
export function toriInstitutions(c, H) {
  const r = rngOf("inst" + c.st + c.turn + H.stage), S = tagSt(c.st), N = stNm(c.st), out = [], st = H.stage, top = H.stories[0];
  const NAT = !!c.nat || /^nigeria$/i.test(String(c.st));
  const post = (name, handle, art, text, extra) => { if (NAT) { name = name.replace(/ Nigeria (Council|Zone|Wing|Branch)$/, " National").replace(/ Nigeria Chapter$/, " National Secretariat").replace(/^Nigeria Market Women Association$/, "Nigerian Market Women Association").replace(/^Nigeria Traditional Council$/, "Council of Traditional Rulers").replace(/^Nigeria Chamber of Commerce$/, "Nigerian Chamber of Commerce"); handle = handle.replace(/_Nigeria$/, "National"); text = text.replace(/Government House/g, "Aso Rock").replace(/the Governor's children/g, "the President's children").replace(/His Excellency/g, "Mr. President"); }
    out.push({ id: "i" + hash(handle + text), kind: "institution", name, sub: "", handle, art, text, ago: ago(r, out.length), ...counts(r, 2 + st), verified: true, pinned: true, ...(extra || {}) }); };
  const has = (id) => H.stories.some(x => x.id === id || x.id.startsWith(id));
  if (has("salaries") || (c.strikes || []).some(x => x.id === "nlc")) post("NLC " + N + " Council", "@NLC_" + S, "workers-group-angry", c.arrears > 0 ? c.arrears + " months without salaries. Workers are trekking to work while Government House rides in convoys. If nothing changes, we shut down the Secretariat. #PayOurSalaries" + S : "Labour has given this government enough time. Our members will not accept another promise without a date.");
  (c.strikes || []).filter(x => x.id === "asuu").forEach(x => post("ASUU " + N + " Zone", "@ASUU_" + S, "student-leader-angry", "Year " + x.years + " of this strike. The agreement this government signed is gathering dust. Our students are at home; the Governor's children are abroad. #ASUUStrike"));
  if (has("salaries") && st >= 2) post("NUT " + N + " Wing", "@NUT_" + S, "teacher", "Our members cannot teach hungry children in leaking classrooms. Teachers deserve their pay.");
  if ((has("salaries") || (c.strikes || []).length) && st >= 2) post("NMA " + N + " Branch", "@NMA_" + S, "doctor", "Patients are waiting in corridors with no drugs and no staff. We will not watch our people die quietly.");
  if (has("japa") || has("stalled") || has("corruption")) post("BudgetWatch NG", "@BudgetWatchNG", "reporter", "THREAD 🧵 " + (has("japa") ? "The money for " + ((c.fled || [])[0] || {}).proj + " went abroad with the contractor. Who signed the payment? " : has("stalled") ? "We visited the project sites " + toriHandle(c.st) + " boasts about. Here is what we found: bushes. " : "Contracts in " + N + " keep going to the same names. ") + "#FollowTheMoney");
  if (has("needs") || st >= 3) post(N + " Market Women Association", "@" + S + "MarketWomen", "market-women-group-angry", pick(r, ["Our goods are spoiling because the road is bad. We are tired of talking.", "Price of everything don triple. Government dey where? We are closing the markets on Monday if nobody listens."]));
  if (st >= 3) post(N + " Traditional Council", "@" + S + "RoyalFathers", "traditional-ruler-oba-obi", "The palace appeals to our youth to remain calm. We urge His Excellency to listen to the cries of his children before the drumbeat changes.");
  if (st >= 3) post(N + " Chamber of Commerce", "@" + S + "Chamber", "investor-foreign", st >= 4 ? "No factory can survive street blockades and broken promises. Our members are relocating to neighbouring states." : "Our members are reviewing new investments in " + N + " until the situation is clarified.");
  if (st >= 3 && c.party) post(c.party + " " + N + " Chapter", "@" + c.party.replace(/\W/g, "") + "_" + S, "party-chairman-angry", st >= 4 ? "The party will not go down with one man. We are consulting our members on the way forward." : "The party expects discipline, unity and results from those we put in office.");
  if (st >= 4) post("Kelechi Afro", "@KelechiAfro", "young-voter-student", "Watching from London and it hurts. Leave the protesters alone. " + N + " deserves better 🇳🇬 #" + S + (st >= 5 ? "GovMustGo" : "DeservesBetter"), { sub: "Musician" });
  if (st >= 4 && !NAT) post("State House, Abuja", "@StateHouseNG", "the-president", st >= 5 ? "Mr. President has summoned the Governor of " + N + " State to Abuja over the deteriorating situation in the state." : "The Presidency is monitoring developments in " + N + " State.");
  if (st >= 3 && NAT) post("Nigeria Governors' Forum", "@NGFSecretariat", "governor", "Governors are concerned about the state of the federation and the delays in statutory allocations. We will meet the President.");
  if (st >= 4 && NAT) post("Office of the Senate President", "@NGRSenatePresident", "lawmaker-opposition-leader", "The Senate will not stand by while the country burns. We are reviewing the executive's conduct.");
  if (st >= 5 && !NAT) post("#" + S + "GovMustGo coalition", "@" + S + "Coalition", "workers-group-angry", "NLC, NUT, NMA, the market women and civil society: one demand. The Governor must resign. #" + S + "GovMustGo");
  return out;
}

/* ── The world is watching (owner, 20 Nov 2026: "for the President, foreign powers too, even the wartime country
   leaders") ──
   Only on the President's Tori (c.nat). Foreign governments and the war's leaders post from the record: the debt,
   corruption, the heat at home, the war's progress. All countries but Nigeria and its neighbours are fictional.
   c.war (when the Bakunda storyline has started): { nm, adj, cap, gen, art, stage, atWar, progress, done, treaty }.
   c.crackdown: critics were arrested this year. Each post carries topic "war" or "foreign" and sub, which pick the
   President's reply options in worldReplies. */
const camel = (s) => String(s || "").replace(/[^A-Za-z]/g, "");
export function toriWorld(c, H) {
  const NAT = !!c.nat || /^nigeria$/i.test(String(c.st));
  if (!NAT) return [];
  const r = rngOf("world" + c.turn + (H ? H.stage : 0)), out = [], st = H ? H.stage : 0, W = c.war || null, debt = c.debtB || 0;
  const post = (o) => out.push({ kind: "foreign", verified: true, pinned: true, ago: ago(r, out.length), ...counts(r, 3 + st), id: "w" + hash(o.handle + o.text), ...o });
  const war = W && W.stage >= 2 && !W.done;
  if (war) {
    const G = "General " + W.gen, gh = "@Gen" + camel(W.gen), lab = "⚔️ The " + W.nm + " war", atWar = !!W.atWar, p = W.progress || 0;
    const mood = W.stage >= 4 ? "-pleased" : atWar && p < 40 ? "-angry" : "";
    const say = W.stage >= 4 ? "The Military Council has signed in Geneva. We ask our Nigerian brothers for a peace that does not humiliate " + W.nm + "."
      : W.stage === 2 ? "The army has taken power to save " + W.nm + " from thieves in suits. Abuja should mind its own business. We have friends now. #" + camel(W.adj) + "Revolution"
      : !atWar ? "Sanctions will not starve " + W.nm + ". Ostrava feeds us while Abuja makes speeches. #" + camel(W.nm) + "Stands"
      : p >= 80 ? "The Military Council proposes a ceasefire and talks in Geneva. Enough blood has been spilled on both sides."
      : p >= 40 ? "We are ready to talk, but not with a gun to our head. Withdraw from our border and we will sit down."
      : (c.arrears > 0 ? "Nigerian soldiers are dying for a President who cannot even pay his own workers. Go home, boys. " : "Our brave soldiers have pushed the invaders back from " + W.cap + ". ") + "#" + camel(W.nm) + "WillNotKneel";
    post({ name: G, handle: gh, art: (W.art || "general-voko") + mood, text: say, topic: "war", sub: W.stage >= 4 ? "peace" : W.stage === 2 ? "coup" : !atWar ? "sanctions" : p >= 80 ? "ceasefire" : p >= 40 ? "talks" : "taunt", pinLabel: lab, side: "enemy" });
    if (W.stage >= 3 && W.stage < 4) post({ name: "King Aurel of Ostrava", handle: "@KingOfOstrava", art: "foreign-head-of-state-angry", pinLabel: lab, topic: "war", sub: "axis", side: "enemy",
      text: atWar ? "Ostrava stands with the people of " + W.nm + " against Nigerian aggression. We will not abandon our friends." : "Ostrava's trade with " + W.nm + " is legal and peaceful. Nigeria's sanctions break every rule of the free market." });
    if (W.stage === 3 && atWar && r() < .7) post({ name: "President Ousmane Daraka", handle: "@DarakaTessara", art: "foreign-head-of-state", pinLabel: lab, topic: "war", sub: "neighbour", side: "neutral",
      text: "Tessara is a sovereign country. Our roads are open to trade, and we take orders from nobody in Abuja." });
    post({ name: "ECOWAS Commission", handle: "@ECOWAS_Commission", art: "ecowas-envoy" + (p >= 60 || W.stage >= 4 ? "-pleased" : ""), pinLabel: lab, topic: "war", sub: "ecowas", side: "friend",
      text: W.stage >= 4 ? "ECOWAS welcomes the signing in Geneva and stands ready to support the transition in " + W.nm + "." : "ECOWAS condemns the unconstitutional seizure of power in " + W.nm + " and calls for the immediate release of all detained Nigerians." });
    if (atWar && (p < 50 || st >= 3)) post({ name: "UN Humanitarian Office", handle: "@UNHumanitarian", art: "foreign-head-of-government", pinLabel: lab, topic: "war", sub: "corridor", side: "neutral",
      text: "Families are fleeing the fighting around " + W.cap + ". We call on all parties to open a humanitarian corridor now." });
  } else if (W && W.done) {
    post({ name: W.nm + " Transitional Council", handle: "@" + camel(W.nm) + "Transition", art: "foreign-head-of-government", pinLabel: "🕊️ After the war", topic: "foreign", sub: "peace", side: "friend",
      text: "The people of " + W.nm + " thank Nigeria for standing with us. The treaty is our new beginning. 🤝🏾 #" + camel(W.nm) + "Peace" });
  }
  // The powers that trade and lend: what they say follows the record.
  const lab = "🌍 Foreign affairs";
  if (c.cor > .45) post({ name: "Meridia Foreign Ministry", handle: "@MeridiaMFA", art: "foreign-head-of-government", pinLabel: lab, topic: "foreign", sub: "invest", side: "neutral", text: "Meridian companies will not invest where contracts are not open. Our $2 billion package for Nigeria is on hold until the audit is published." });
  else if ((c.delivered || 0) > 0 || c.app >= 60) post({ name: "President Celine Arvane", handle: "@MeridiaPresident", art: "foreign-head-of-state-pleased", pinLabel: lab, topic: "foreign", sub: "praise", side: "friend", text: "Meridian investors are ready to commit $2 billion to Nigerian power and rail. The reforms in Abuja are real. 🇳🇬" });
  if (st >= 4 || c.crackdown) post({ name: "Valdoria Foreign Ministry", handle: "@ValdoriaMFA", art: "foreign-head-of-government", pinLabel: lab, topic: "foreign", sub: c.crackdown ? "rights" : "advisory", side: "neutral",
    text: c.crackdown ? "Valdoria is concerned by the arrest of peaceful critics in Nigeria. Free speech is not a crime." : "Valdoria advises its citizens against all but essential travel to Nigeria while the protests continue." });
  else if (debt >= 300) post({ name: "Valdoria Export Bank", handle: "@ValdoriaExim", art: "investor-foreign", pinLabel: lab, topic: "foreign", sub: "debt", side: "neutral", text: "Nigeria owes ₦" + Math.round(debt) + "B and wants more. Before the next loan, we would like to see the repayment schedule." });
  if (!war && !(W && W.done) && r() < .5) post({ name: "King Aurel of Ostrava", handle: "@KingOfOstrava", art: "foreign-head-of-state", pinLabel: lab, topic: "foreign", sub: "ceremony", side: "neutral",
    text: "We look forward to welcoming the President of Nigeria to Kessenburg. Ostrava and Nigeria have a great deal to trade." });
  if (st >= 4 || c.crackdown) post({ name: "UN Human Rights Office", handle: "@UNRightsOffice", art: "foreign-head-of-government", pinLabel: lab, topic: "foreign", sub: "rights", side: "neutral", text: "We urge the Nigerian authorities to respect the right to peaceful protest and to release anyone detained for speaking out." });
  return out;
}
// Trending when the world is involved.
export function toriWorldTrends(c) {
  const W = c.war; if (!c.nat || !W || W.stage < 2) return [];
  const N = camel(W.nm), p = W.progress || 0;
  if (W.done) return [{ tag: "#" + N + "Peace", count: "41K", about: "The treaty is law" }];
  const out = [{ tag: W.atWar ? "#" + N + "War" : "#Sanction" + N, count: W.atWar ? "184K" : "62K", about: W.atWar ? "Nigeria at war" : "Sanctions, not war" }];
  if (W.atWar && p >= 80) out.push({ tag: "#Ceasefire", count: "96K", about: "General " + W.gen + " offers talks" });
  if (W.atWar && p < 40 && c.app < 50) out.push({ tag: "#BringOurSoldiersHome", count: "73K", about: "War weariness" });
  if (W.stage === 2) out.push({ tag: "#FreeNigeriansIn" + N, count: "58K", about: "Nigerians stranded after the coup" });
  return out;
}
// The President's answers to the world: firm, diplomatic, a threat or an appeal; each checked against the record.
function worldReplies(t, c) {
  const W = c.war || {}, atWar = !!W.atWar, p = W.progress || 0, out = [], sub = t.sub;
  if (t.topic === "war") {
    if (sub === "axis") {
      out.push({ id: "sanction", text: "Every Ostravan gun in " + W.nm + " has killed a Nigerian. Stop selling them, or Ostrava's companies leave Nigeria.", truth: true, fx: { app: 1 }, retort: "Ostrava does not take threats from a country that borrows from us." });
      out.push({ id: "un", text: "We have taken Ostrava's arms shipments to the UN Security Council.", truth: true, promise: "un" });
      out.push({ id: "soft", text: "Nigeria values its friendship with Ostrava. We hope to talk soon.", truth: true, fx: { app: -1 }, callout: "Friendship? Their guns are killing our soldiers. 😡" });
    } else if (sub === "neighbour") {
      out.push({ id: "close", text: "Then Nigeria's border with Tessara is closed to every truck that carries the junta's guns.", truth: true, fx: { app: 1 }, retort: "We will see who runs out of fuel first." });
      out.push({ id: "talk", text: "President Daraka, we are neighbours for ever. Let us talk this week, before more people die.", truth: true, promise: "tessara" });
    } else if (sub === "ecowas" || sub === "corridor") {
      out.push({ id: "with", text: sub === "corridor" ? "Nigeria will open a corridor from the border and our Air Force will guard it." : "Thank you. Nigeria will stand with ECOWAS until every Nigerian is home.", truth: true, promise: sub === "corridor" ? "corridor" : null, fx: sub === "corridor" ? {} : { app: 1 } });
      if (sub === "corridor") out.push({ id: "blame", text: "Tell General " + W.gen + ". He started this.", truth: true, fx: {} });
    } else {
      out.push({ id: "firm", text: W.stage >= 4 ? "Peace that holds is a peace that is kept. Release every Nigerian and the treaty does the rest." : "Nigeria did not start this. Release our citizens and lay down your arms, General.", truth: true, fx: { app: 1 }, retort: W.stage >= 4 ? null : "Come and take them." });
      out.push({ id: "talks", text: "Nigeria will meet in Geneva the day your guns go quiet.", truth: true, promise: "ceasefire", fx: p >= 80 ? { app: 1 } : {} });
      out.push({ id: "threat", text: "Your days are numbered. Our jets are on their way to " + W.cap + ".", truth: atWar, fx: atWar ? { app: 1 } : { app: -1 }, callout: atWar ? null : "What jets? The Senate never sent you to war. 😂", retort: atWar ? "Let them come." : null });
      if (c.arrears > 0 && sub === "taunt") out.push({ id: "pay", text: "Every soldier is paid this month. Mind your own payroll, General.", truth: false, fx: { app: -1 }, callout: "He is not wrong though. " + c.arrears + " months owed at home." });
    }
  } else {
    if (sub === "invest") {
      out.push({ id: "open", text: "The contracts go online this month. Meridia's package will not wait long.", truth: c.cor < .5, promise: "openbook", callout: "Online where? Our own watchdogs can't find them." });
      out.push({ id: "proud", text: "Nigeria does not need lectures. Our money is our business.", truth: true, fx: { app: -1 }, callout: "Then why do you keep borrowing theirs?" });
    } else if (sub === "praise") {
      out.push({ id: "welcome", text: "Thank you, President Arvane. The paperwork is done in 30 days, and every naira is published.", truth: c.cor < .4, promise: "invest", callout: c.cor < .4 ? null : "30 days? It took my company 2 years to get a permit." });
      out.push({ id: "jobs", text: "This is about jobs: 40,000 Nigerians will build those lines.", truth: true, fx: { app: 1 } });
    } else if (sub === "advisory" || sub === "rights") {
      out.push({ id: "listen", text: sub === "rights" ? "Everyone held for speaking out is released today. That was wrong." : "We understand. We are meeting the protesters' leaders this week.", truth: true, promise: sub === "rights" ? "release" : "protesters", fx: { app: 1 } });
      out.push({ id: "deny", text: sub === "rights" ? "Nobody in Nigeria is detained for what they say." : "Nigeria is safe and open for business. The advisory is unfair.", truth: sub === "rights" ? !c.crackdown : c.app >= 50, fx: { app: -1 }, callout: sub === "rights" ? "We have the names of the arrested. #FreeTheCritics" : "Safe? Have you looked outside Aso Rock?" });
      out.push({ id: "sov", text: "Nigeria is a sovereign country. We will not be lectured.", truth: true, fx: {}, retort: "Sovereign countries also keep their promises." });
    } else if (sub === "debt") {
      out.push({ id: "plan", text: "The schedule goes out this week. Nigeria pays its debts.", truth: true, promise: "debt" });
      out.push({ id: "renegotiate", text: "We will pay, at a rate that does not starve our people. Let's talk.", truth: true, fx: {} });
    } else if (sub === "peace") {
      out.push({ id: "partner", text: "Our brothers in " + W.nm + ": Nigeria will help you rebuild. Trade, power, schools.", truth: true, fx: { app: 1 } });
    } else {
      out.push({ id: "accept", text: "I accept, Your Majesty. Nigeria comes to trade, not to beg.", truth: true, promise: "visit" });
      out.push({ id: "later", text: "Nigeria's work is at home this year. Thank you, Your Majesty.", truth: true, fx: { app: 1 } });
    }
  }
  return out.slice(0, 4);
}

/* The governor's answers to the heat. Each can be used once a year; effects go into adj (this year's heat), later
   (next year's) and fx (meters). */
export function toriTools(c, H, used) {
  const u = used || {}, out = [];
  if (H.stories.some(s => s.fix)) out.push({ id: "fix", l: "Fix what they are angry about", d: H.stories.find(s => s.fix).demand + ". The only thing that cools it for good.", fix: H.stories.find(s => s.fix).fix });
  out.push({ id: "presser", l: "Hold a press conference", d: c.cor < .35 && (c.delivered || 0) > 0 ? "You have a record to point to. It should help." : "Risky: with no record to show, the clips will be memes." });
  out.push({ id: "apology", l: "Apologise, with a plan", d: (u.apologies || 0) ? "Again? People are counting your apologies." : "Helps a little, if you then act." });
  if (c.weakest) out.push({ id: "sack", l: "Sack " + c.weakest, d: "Cools it fast. The party and their godfather will not forget." });
  out.push({ id: "bots", l: "Pay influencers to push your side (₦0.5B)", d: "Works for now. If anyone notices the copy-paste, it explodes." });
  out.push({ id: "crackdown", l: "Arrest the loudest critics", d: "Quiet tonight. Next year the whole country knows their names." });
  out.push({ id: "silent", l: "Say nothing", d: H.stage >= 3 ? "Dangerous now: “Where is our Governor? Is he in London?”" : "Small fires burn out on their own." });
  return out.filter(t => !u[t.id] || t.id === "fix");
}
// What a tool does. rnd: a number 0..1 for the exposure risk of paid influencers.
export function toolResult(t, c, H, rnd, used) {
  const S = tagSt(c.st), N = stNm(c.st);
  switch (t.id) {
    case "presser": return c.cor < .35 && (c.delivered || 0) > 0 ? { adj: -10, line: "The press conference landed. The receipts were real.", tweet: null }
      : { adj: 15, fx: { app: -1 }, line: "The clips went viral for the wrong reasons.", tweet: { name: "Tunde", handle: "@tunde_no_work", text: "Oga rest 😭 We dey see the road with our two eyes. Ratio + pay our pensioners. #" + S + "GovLies" } };
    case "apology": return (used && used.apologies) ? { adj: -2, line: "Another apology. Fewer people believed this one.", count: true } : { adj: -6, line: "The apology helped a little. Now they want the plan.", count: true };
    case "sack": return { adj: -12, fx: { pStab: -5 }, sack: true, line: "The sacking cooled it. Their people in the party are angry." };
    case "bots": return rnd < .35 ? { adj: 25, fx: { app: -3, cash: -.5 }, exposed: true, line: "Exposed: the paid posts were copy-pasted.", tweet: { name: "Ada Influencer", handle: "@ada_vibes_ng", text: "Our Governor is working wonders in health and education. (Please remove this bracket before posting. Payment via OPay.) #" + S + "IsWorking" } }
      : { adj: -10, fx: { cash: -.5 }, line: "The paid posts drowned the hashtag, for now." };
    case "crackdown": return { adj: -15, later: 30, fx: { app: -2 }, line: "The streets are quiet tonight. The names of the arrested are already trending.", tweet: { name: "Amnesty Watch NG", handle: "@RightsWatchNG", text: "We condemn the arrest of peaceful critics in " + N + ". #FreeThe" + S + "Critics" } };
    case "silent": return H.stage >= 3 ? { adj: 10, line: "“Where is our Governor?” is now trending.", tweet: { name: "Mama Ngozi", handle: "@mamangozi_market", text: "Where is our Governor? Is he in London? 🤔 #Where" + "Is" + S + "Gov" } } : { adj: -3, line: "It burnt out a little on its own." };
    default: return { adj: 0, line: "" };
  }
}

/* ── Replies that fit the post (owner, 20 Nov 2026: "not generic slop") ──
   Every post carries a topic; the governor's reply options are built from that topic and the real record: the
   months owed, the union, the contractor and the amount, the project, the place. Each option is checked against
   the record: an honest answer, a dated commitment (remembered), a denial or a deflection (called out when the
   record says otherwise), and where there is one, the real fix (an action that takes the player there). */
export const toriTopic = (t) => {
  const x = String(t || "").toLowerCase();
  if (/salar|arrears|owed|pay our|unpaid|alert don land|25th|never pay|pay us|\bpaid\b/.test(x)) return "salaries";
  if (/strike|asuu|lecturer|union|nlc|nma|doctors|teachers|labour/.test(x)) return "strike";
  if (/japa|ran to|fled|canada|abroad|whereisourmoney|travelled to/.test(x)) return "japa";
  if (/loot|corrupt|contracts? (to|in|keep)|efcc|same three|followthemoney|debt they|piling/.test(x)) return "corruption";
  if (/is open|is finally open|isopen|finished|commission|well done|credit|working|trying/.test(x)) return "praise";
  if (/road|bridge|hospital|school|classroom|water|floor|collapsed|kidnap|highway|clinic|market/.test(x)) return "need";
  if (/approval|poll|deserves better|must go|resign/.test(x)) return "approval";
  return "general";
};
const pidgin = (t) => /\b(dey|una|wetin|don|abeg|sef|oga|we no|na so|e don|dem|wahala|abi|sabi)\b|^na\b/i.test(String(t || ""));

export function toriReplies(t, c) {
  if (c.role && c.role !== "gov") return roleReplies(t, c);
  if (t.kind === "foreign") return worldReplies(t, c);
  const P = pidgin(t.text), who = t.kind === "institution" || t.kind === "opposition" ? t.name : callName(t.name), me = c.nat ? "the Federal Government" : "Government House";
  const topic = t.topic || toriTopic(t.text), out = [], opp = t.kind === "opposition", inst = t.kind === "institution";
  const tx = String(t.text || "").toLowerCase(), named = (arr, key) => (arr || []).find(x => x && x[key] && tx.includes(String(x[key]).toLowerCase().slice(0, 18)));
  const S = stNm(c.st), f = named(c.fled, "proj") || named(c.fled, "firm") || (c.fled || []).find(x => !x.back) || null, st = named(c.strikes, "short") || (c.strikes || [])[0] || null, n = named(c.needs, "title") || (c.needs || [])[0] || null, done = named(c.done ? c.done.map(d => ({ d })) : [], "d") ? named(c.done.map(d => ({ d })), "d").d : (c.done || [])[0] || null;
  if (t.follow === "aproko") {
    out.push({ id: "deny", text: "Fake news. Nothing like that happened in this government.", truth: !(c.leaks || []).length, fx: (c.leaks || []).length ? { app: -1 } : {}, callout: (c.leaks || []).length ? "Fake news? Na your own commissioner's name dey the document. 👀" : null });
    out.push({ id: "probe", text: "If this is true, there will be consequences. I've asked for a full report by Friday.", truth: true, promise: "general" });
    out.push({ id: "ignore", text: "😂 Aproko, you no dey rest?", truth: true, fx: {}, callout: "Laughing it off. So it's true? 👀" });
    return out;
  }
  if (t.follow === "praise") {
    if (t.exposed) { out.push({ id: "distance", text: "Nobody is paid to praise this government. Please delete that post.", truth: false, fx: { app: -1 }, callout: "The payment note is in the post 😂" }); out.push({ id: "own", text: "That post should never have gone out. I've told my team: no paid praise.", truth: true, fx: { app: 1 } }); return out; }
    out.push({ id: "thanks", text: P ? "Iyaloje, thank you o! Na una prayer dey carry us. 🙏🏾" : "Thank you, Iyaloje. Your support keeps us going. 🙏🏾", truth: true, fx: c.app >= 50 ? { app: 1 } : {}, callout: c.app >= 50 ? null : "Even the praise singer is the only one clapping." });
    if (c.arrears > 0) out.push({ id: "salary", text: "Kind words, but the workers come first: " + c.arrears + " months owed is my shame, not my record.", truth: true, fx: { app: 1 } });
    return out;
  }
  if (t.follow === "memes") {
    out.push({ id: "laugh", text: "😂 Okay this one got me. But I'm still fixing it.", truth: true, fx: c.app >= 45 ? { app: 1 } : {}, callout: c.app >= 45 ? null : "Laughing while we suffer? Na wa." });
    out.push({ id: "own", text: "Fair. The meme is funny because it's true. Here's what we're doing about it this month.", truth: true, promise: "general", fx: {} });
    out.push({ id: "report", text: "This page is spreading lies about the government.", truth: false, fx: { app: -1 }, callout: "Lies? It's a meme of your own face 😭" });
    return out;
  }
  if (t.follow === "student") {
    const a = (c.strikes || []).find(x => /ASUU/i.test(x.short));
    if (t.arc === "graduated") { out.push({ id: "congrats", text: "Congratulations! 🎓 Four years became more than four, and you held on. " + S + " is proud of you.", truth: true, fx: { app: 1 } }); out.push({ id: "job", text: "Send me your CV. Our graduate scheme opens next month.", truth: true, promise: "general" }); return out; }
    if (t.arc === "left") { out.push({ id: "sorry", text: "I'm sorry we lost you. When things are better at home, come back and build with us.", truth: true, fx: {} }); out.push({ id: "blame", text: "The strike is a federal matter. Safe travels.", truth: true, fx: { app: -1 }, callout: "Federal matter. That's exactly why people leave." }); return out; }
    if (a) { out.push({ id: "table", text: "Year " + a.years + " of this strike is too long. I'm sitting with ASUU myself this week.", truth: !!a.talks, promise: a.talks ? null : "talks", callout: a.talks ? null : "You said that last year." }); out.push({ id: "go", text: "Convening the roundtable with ASUU now.", truth: true, action: "roundtable" }); out.push({ id: "biz", text: "Proud of you for starting that business. Our youth grant can help: apply this month.", truth: true, fx: {} }); return out; }
  }
  if (t.follow === "trader" && /water|rain|flood|swim/i.test(t.text)) {
    out.push({ id: "drain", text: "I've seen your shop. The drainage for that market goes into this year's budget, and I'll come and see it done.", truth: true, promise: "need" });
    out.push({ id: "fix", text: "Sending the commissioner and the money now.", truth: true, action: "needs" });
    out.push({ id: "god", text: "Floods are an act of God. We'll pray together.", truth: true, fx: { app: -1 }, callout: "Act of God? The gutter has been blocked for 5 years." });
    return out;
  }
  if (topic === "salaries") {
    if (c.arrears > 0) {
      out.push({ id: "own", text: P ? "You dey right, " + who + ". " + c.arrears + " months no be small thing. We go clear am, starting this month." : "You're right. " + c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " unpaid is unacceptable. We start clearing the arrears this month.", truth: true, promise: "arrears", fx: { app: 1 } });
      out.push({ id: "pay", text: "Paying a month of arrears from the Treasury today.", truth: true, action: "treasury" });
      out.push({ id: "deny", text: "Salaries are being paid. Don't let the opposition use you.", truth: false, fx: { app: -1 }, callout: P ? "Which salary? Na " + c.arrears + " months we never see alert." : "Paid? It has been " + c.arrears + " months. Show us the alert." });
      out.push({ id: "blame", text: "We inherited a broke treasury and ₦" + (c.debtB || "billions in") + (c.debtB ? "B" : "") + " of debt. We're paying what the last government left.", truth: true, fx: {}, callout: "Every government says that. Pay us." });
    } else {
      out.push({ id: "thanks", text: P ? "Na una right, " + who + ". Salary go dey land every 25th. 🙏🏾" : "Every worker, every month, on the 25th. That's the promise, and we're keeping it.", truth: true, fx: { app: 1 } });
      out.push({ id: "pens", text: "Next: clearing the pension backlog. Watch this space.", truth: true, promise: "pensions" });
    }
  } else if (topic === "strike" && st) {
    out.push({ id: "table", text: (st.talks ? "We met " + st.short + " this year and we're back at the table." : "I'm calling " + st.short + " to the table this week, and I'll sit in myself.") + " Year " + st.years + " of this strike ends with us.", truth: st.talks, promise: st.talks ? null : "talks", fx: st.talks ? { app: 1 } : {}, callout: st.talks ? null : "You said that last year. Nobody has met " + st.short + "." });
    out.push({ id: "go", text: "Convening the roundtable with " + st.short + " now.", truth: true, action: "roundtable" });
    out.push({ id: "abuja", text: st.id === "asuu" ? "The ASUU agreement was signed by Abuja. We're pushing the Federal Government to honour it." : "The " + st.short + " demands need Abuja's help. We're on it.", truth: st.id === "asuu", fx: {}, callout: st.id === "asuu" ? "Fair, but what is the state doing in the meantime?" : "Stop passing the buck. You are the employer." });
    out.push({ id: "deny", text: "There is no strike. Our institutions are open.", truth: false, fx: { app: -1 }, callout: "Open? My children have been home for " + st.years + " year" + (st.years === 1 ? "" : "s") + "." });
  } else if (topic === "japa" && f) {
    out.push({ id: "chase", text: f.asked ? "We've reported " + f.firm + " to the Attorney-General and asked " + f.to + " to freeze the accounts. Every naira of the " + fmtM(f.lossM) + " is coming home." : "We will chase " + f.firm + " to " + f.to + ". Every naira of the " + fmtM(f.lossM) + " for " + f.proj + ".", truth: !!f.asked, promise: f.asked ? null : "japa", callout: f.asked ? null : "Chase how? You haven't even reported them." });
    out.push({ id: "visit", text: c.nat ? "The Attorney-General writes to " + f.to + " this week." : "Flying to Abuja to ask the President to get it back.", truth: true, action: "visit" });
    out.push({ id: "deny", text: "No money was lost on " + f.proj + ".", truth: false, fx: { app: -2 }, callout: fmtM(f.lossM) + " is not “no money”. We have the payment voucher." });
  } else if (topic === "corruption") {
    out.push({ id: "open", text: "Every contract we've signed goes online this month, with the names behind the companies.", truth: c.cor < .4, promise: c.cor < .4 ? null : "openbook", fx: c.cor < .4 ? { app: 1 } : {}, callout: c.cor < .4 ? null : "Go on then. We'll wait for the link." });
    out.push({ id: "efcc", text: "If anyone has evidence against my officials, take it to the EFCC. I'll sign the referral myself.", truth: true, fx: {} });
    out.push({ id: "deny", text: "There is no corruption in this government.", truth: c.cor < .3, fx: c.cor < .3 ? {} : { app: -1 }, callout: "Corruption at " + Math.round(c.cor * 100) + "% and you say none? 😂" });
  } else if (topic === "need" && n) {
    out.push({ id: "work", text: n.title + ": " + (n.inWork ? "the work has started. Photos next week." : "work starts this year. You'll see the trucks."), truth: !!n.inWork, promise: n.inWork ? null : "need", callout: n.inWork ? null : "Trucks? Where? Same thing you said before." });
    out.push({ id: "fix", text: "Sending the commissioner and the money now.", truth: true, action: "needs" });
    out.push({ id: "visit", text: P ? "I dey come see am myself this week." : "I'm coming to see it myself this week.", truth: true, fx: {}, promise: "visit" });
  } else if (topic === "praise") {
    out.push({ id: "thanks", text: (done ? done + " is yours. " : "") + (P ? "Thank you, " + who + "! Na una vote do am. More dey come. 🙏🏾" : "Thank you, " + who + ". You did this with your vote. More is coming."), truth: true, fx: { app: 1 } });
    out.push({ id: "team", text: "Credit to the engineers and the workers who finished it on time.", truth: true, fx: {} });
    if (n) out.push({ id: "next", text: "Next on the list: " + n.title.charAt(0).toLowerCase() + n.title.slice(1) + ".", truth: true, promise: "need" });
  } else if (topic === "life") {
    const x = String(t.text).toLowerCase(), hard = c.arrears > 0 || (c.strikes || []).length > 0;
    const jest = /eagles|derby|match/.test(x) ? "Up Eagles! 🦅 I'll be watching too, after my briefings. ⚽" : /jollof/.test(x) ? "Nigerian jollof. This is not up for debate. 🍛🇳🇬" : /hustle naija|evict/.test(x) ? "I can't comment on evictions. I have a House of Assembly for that 😅" : /data/.test(x) ? "Same here. Even my data finished in a meeting 😂" : /traffic|road/.test(x) ? "Noted. I'm asking the traffic people why. 🚦" : /song|film|cinema/.test(x) ? "Added to my playlist for the long drives. 🎶" : "😂 This one got me. Have a good day, " + who + ".";
    out.push({ id: "banter", text: jest, truth: true, fx: hard ? {} : { app: 1 }, callout: hard ? "Banter while " + (c.arrears > 0 ? "salaries are " + c.arrears + " months late" : "students are at home") + "? Focus, sir." : null });
    out.push({ id: "like", text: "❤️ (just a like)", truth: true, fx: {} });
  } else if (topic === "approval" || opp) {
    const fair = t.fair != null ? t.fair : ((c.arrears > 0 && /salar/i.test(t.text)) || (st && /strike/i.test(t.text)) || (c.app < 50 && /%|approval|deserves|must go/i.test(t.text)) || (f && /contractor|money/i.test(t.text)) || (c.cor > .4 && /contract|debt|loot/i.test(t.text)));
    out.push({ id: "record", text: done ? "We finished " + done + ". What did you build in 8 years?" : "Judge us by the record at the end of the term, not by tweets.", truth: !!done, fx: done ? { app: 1 } : {}, callout: done ? null : "What record? Name one finished project." });
    out.push({ id: "rebut", text: "That is false, and " + (opp ? "you know it" : "the facts will show it") + ".", truth: !fair, fx: fair ? { app: -1 } : { app: 1 }, callout: fair ? "False? Everybody can see it." : null });
    out.push({ id: "listen", text: "Fair criticism. We're listening, and we'll do better.", truth: true, fx: fair ? { app: 1 } : {} });
  } else {
    const life = toriLife(t), pl = (String(t.text).match(/\b(?:for|in|at) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/) || [])[1] || S;
    const boss = c.nat ? "the Federal Government" : "the state";
    if (life === "light") {
      out.push({ id: "trafo", text: P ? "I don hear you, " + who + ". " + pl + " transformer dey our list. I go call the power company today." : "Sorry, " + who + ". " + pl + "'s transformer is on our list. I'm calling the power company today.", truth: true, promise: "light" });
      out.push({ id: "disco", text: "Power distribution is run by the DisCos, not " + boss + ". Take it up with them.", truth: true, fx: { app: -1 }, callout: "Always somebody else's fault. 🙄" });
      out.push({ id: "joke", text: "Even my own generator is complaining. We're on it. 😅", truth: true, fx: c.app >= 50 ? { app: 1 } : {}, callout: c.app >= 50 ? null : "Generator jokes while we sit in darkness? Haba." });
    } else if (life === "convoy") {
      out.push({ id: "cut", text: "Point taken, " + who + ". From tomorrow the convoy is cut to six cars.", truth: true, promise: "convoy", fx: { app: 1 } });
      out.push({ id: "sec", text: "The convoy size is set by security, not by me.", truth: false, fx: { app: -1 }, callout: "Security? You are the Chief Security Officer. 😂" });
    } else if (life === "pothole") {
      out.push({ id: "works", text: "The Works team will be on that street this week, " + who + ". Send the exact spot.", truth: true, promise: "pothole" });
      out.push({ id: "fix", text: "Sending the commissioner and the money now.", truth: true, action: "needs" });
      out.push({ id: "lol", text: "😂 The name is creative. The fix is coming.", truth: true, fx: {}, callout: "Laugh now. The pothole is not laughing." });
    } else if (life === "prices") {
      out.push({ id: "own", text: "Prices are hurting every family, " + who + ". I won't pretend otherwise.", truth: true, fx: { app: 1 } });
      out.push({ id: "markets", text: "We're opening cheaper food markets in " + pl + " this month.", truth: true, promise: "prices" });
      out.push({ id: "blame", text: "Inflation is national. There's only so much " + boss + " can do.", truth: true, fx: {}, callout: "Then what are you doing with the money you do have?" });
    } else if (life === "escort") {
      out.push({ id: "list", text: "No commissioner needs six police officers to jog. I've asked for the list. 👀", truth: true, promise: "escort", fx: { app: 1 } });
      out.push({ id: "safety", text: "Our officials face real threats. Their security is not a joke.", truth: true, fx: { app: -1 }, callout: "And our security? Who's guarding the market women?" });
    } else if (t.quote) {
      const nw = briefT(t.quote.text, 70);
      out.push({ id: "explain", text: (t.tone === "bad" ? "You're right to be angry about this. Here's what we're doing about it: " : "Here's what it means for you: ") + "full details on our page tonight.", truth: true, promise: "explain" });
      out.push({ id: "own", text: t.tone === "bad" ? "That one is on us. No excuses." : "This is just the start. More is coming to " + pl + ".", truth: true, fx: t.tone === "bad" ? { app: 1 } : {} });
      out.push({ id: "spin", text: t.tone === "bad" ? "The story is being twisted by our opponents." : "This is the best government " + S + " has ever had.", truth: false, fx: { app: -1 }, callout: t.tone === "bad" ? "Twisted how? It's the news: “" + nw + "”" : "Best ever? Calm down. 😂" });
    } else {
      out.push({ id: "hear", text: P ? "We dey hear you, " + who + ". Tell me the street and I go send person." : "Heard, " + who + ". Tell me the street and I'll send someone.", truth: true, promise: "general" });
      out.push({ id: "dm", text: "Send us the details in DM and the right commissioner will call you today.", truth: true, fx: {} });
    }
  }
  return out.slice(0, 4);
}
// How people answer the governor's reply: specific to what was claimed.
export function toriReplyReact(opt, t, seed) {
  const r = rngOf("rr" + seed), p = pick(r, PEOPLE);
  if (t.kind === "foreign") { // Nigerians answer, and the foreign account may answer back
    const back = opt.retort ? [{ name: t.name, text: opt.retort }] : [];
    if (opt.truth === false) return { replies: [{ name: p.who, text: opt.callout || "That's not true and you know it." }, ...back], line: "Called out" };
    return { replies: [...back, { name: p.who, text: opt.callout || pick(r, t.side === "enemy" ? ["Tell him! 🇳🇬💪🏾", "This is the President we need.", "Say it louder for Ostrava."] : ["Good. The world is watching.", "Finally, a clear answer.", "Screenshotted. Do what you said."]) }], line: opt.promise ? "Noted" : "Liked" };
  }
  // The poster answers first, by name, quoting what the governor said; then someone else piles in.
  const op = t.kind === "complaint" || t.kind === "citizen" || t.kind === "opposition" ? (t.name || p.who) : p.who, me = "you";
  const q = "“" + briefT(opt.text, 60) + "”", topic = t.topic || toriTopic(t.text), p2 = pick(r, PEOPLE.filter(x => x.who !== p.who));
  const opp = t.kind === "opposition";
  // A drafted reply (server/tori-ai.mjs) carries the poster's own answer to exactly what was said.
  if (opt.reaction) return { replies: [{ name: op, text: opt.reaction }, ...(opt.truth === false || opt.callout ? [{ name: p2.who, text: opt.callout || pick(r, ["Screenshot. " + q, "Ratio."]) }] : [])], line: opt.truth === false ? "Called out" : opt.kind === "promise" ? "Noted" : "Answered" };
  if (opt.truth === false) return { replies: [{ name: op, text: opt.callout || (q + "? " + pick(r, ["That's not true and you know it.", "Who wrote this for you?", "We live here. We can see."])) }, { name: p2.who, text: pick(r, ["Screenshot. " + q + " This one will age badly.", "Ratio. And community note: " + q + " is false.", "Saving this for election season. 📸"]) }], line: "Called out" };
  if (opt.action) return { replies: [{ name: op, text: pick(r, {
      salaries: ["If the alert lands this week, I'll come back and say thank you myself.", "I'm refreshing my bank app every hour now. Don't disappoint me. 📱"],
      strike: ["If you're really sitting with them, post a picture from the table.", "Roundtable today, then? We're waiting for the communiqué."],
      japa: ["Bring them back. In handcuffs. 🤝🏾", "Write the letter, then show us the letter."],
      need: ["The commissioner should come with the money, not a camera crew.", "Tell them the road is just after the second junction. They'll need it. 😅"],
    }[topic] || ["Let's see it then. 👀", "Action. Finally. Don't stop."]) }, { name: p2.who, text: pick(r, ["Doing is better than tweeting. Keep it up.", "Results, not replies. We'll check.", "First time I see them act on a tweet."]) }], line: "Watching" };
  if (opt.promise) return { replies: [{ name: op, text: opt.callout ? opt.callout : pick(r, [q + " Screenshotted. See you next year. 📸", "Okay. Na your word be this: " + q + " I'll be back to check.", "I'm bookmarking " + q + " — don't make me quote it back to you."]) }, ...(opp ? [] : [{ name: p2.who, text: pick(r, ["Make sure. We are all watching this one.", "They promised my street too. Still waiting.", "If this happens I'll vote for them myself."]) }])], line: "Noted" };
  if (opp) return { replies: [{ name: op, text: pick(r, ["Nice speech. Now answer the question.", "We'll see at the polls.", "Talk is cheap. The record is not."]) }, { name: p2.who, text: pick(r, ["Both of them should face us 😂", "The opposition got bodied 😭", "Honestly, fair answer."]) }], line: "Answered" };
  if (opt.callout) return { replies: [{ name: op, text: opt.callout }, { name: p2.who, text: pick(r, ["Exactly. Priorities.", "Na wa o 😂", "He's trying to be relatable 💀"]) }], line: "Mixed" };
  if (topic === "life") return { replies: [{ name: op, text: pick(r, ["The Governor replied me!! 😭😂 This app is wild", "Haha okay, you're funny sir 😂", "Screenshot! My friends won't believe this 😂"]) }], line: "Liked" };
  return { replies: [{ name: op, text: pick(r, topic === "praise" ? ["Ahh, the " + (t.kind === "complaint" ? "Governor" : "Gov") + " replied me 😭🙌🏾 Thank you!", "I'm framing this reply. Thank you sir.", "Okay this one sweet me. Keep it up."] : ["Thank you for admitting it. Now fix it.", "Respect for answering. Not many of them do.", "I didn't expect a reply. Okay, I'm listening."]) }], line: "Liked" };
}

/* ── Tori for every role (owner, 20 Nov 2026) ──
   The Senate (@Sen<Name>), the LGA chairman (@<Lga>LGA) and the Ambassador (@NigeriaIn<Country>) each get a feed of
   their own world, written from their record. c.role: "senate" | "lga" | "amb"; c.app is the role's own standing with
   its people (home district, the LGA's people, the diaspora); c.story: what happened (short past-tense phrases). */
const ROLE_CAST = {
  senate: [{ who: "Chidi", what: "voter in your district", h: "chidi_votes", art: "young-voter-student" }, { who: "Mama Bisi", what: "trader", h: "mamabisi_trader", art: "market-trader" }, { who: "Engr. Musa", what: "contractor", h: "engr_musa_builds", art: "okada-rider" }, { who: "Halima", what: "student", h: "halima_writes", art: "student-leader" }],
  lga: [{ who: "Iya Sade", what: "market leader", h: "iyasade_market", art: "market-trader" }, { who: "Kunle", what: "okada rider", h: "kunle_okada", art: "okada-rider" }, { who: "Nurse Grace", what: "PHC nurse", h: "grace_phc", art: "nurse" }, { who: "Baba Lati", what: "farmer", h: "babalati_farm", art: "farmers-association-chair" }],
  amb: [{ who: "Ifeanyi", what: "student abroad", h: "ifeanyi_abroad", art: "citizen-student-abroad" }, { who: "Mrs Okon", what: "trader abroad", h: "mrsokon_trades", art: "citizen-trader-abroad" }, { who: "Tobi", what: "nurse abroad", h: "tobi_rn_abroad", art: "nurse" }, { who: "Dr Bello", what: "community leader", h: "drbello_naija", art: "doctor" }],
};
const lastNm = (n) => String(n || "").split(" ").pop();
export function toriRole(c) {
  const r = rngOf("role" + c.role + c.name + c.n), cast = ROLE_CAST[c.role], out = [], opp = [];
  let i = 0; const P = () => cast[(i++) % cast.length];
  const post = (p, text, topic, heat, extra) => out.push({ id: "r" + hash(text + c.n), kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text, topic, ago: ago(r, out.length), ...counts(r, heat || 1), ...(extra || {}) });
  const inst = (name, handle, art, text, topic) => out.push({ id: "i" + hash(handle + text + c.n), kind: "institution", name, handle, art, text, topic, ago: ago(r, out.length), ...counts(r, 2), verified: true, pinned: true });
  const news = (who, handle, art, text, topic, good) => out.push({ id: "n" + hash(text + c.n), kind: "news", name: who, handle, art, text, topic, ago: ago(r, out.length + 1), ...counts(r, good ? 1 : 2), verified: true, tone: good ? "good" : "bad" });
  const oppPost = (name, handle, art, text, topic) => opp.push({ id: "o" + hash(text + c.n), kind: "opposition", name, handle, art, text, topic, ago: ago(r, opp.length), ...counts(r, 2), verified: true });
  const story = (c.story || []).slice(-4);
  let me, where, oppLabel, tags = [], options = [];
  if (c.role === "senate") {
    const H = "@Sen" + lastNm(c.name), S = stNm(c.st);
    me = { short: "Sen. " + lastNm(c.name), full: "Senator " + c.name, handle: H, bio: "Senator representing " + (c.district || S) + " in the Senate of the Federal Republic of Nigeria." };
    where = S; oppLabel = "Challengers";
    (c.bills || []).slice(-3).forEach(b => news(S + " News Now", "@" + tagSt(c.st) + "NewsNow", "anchor-female", "Senate " + (b.passed ? "passes" : "rejects") + " the " + b.t + ". " + me.short + " voted " + (b.v === "no" ? "against" : b.v === "yes" ? "for" : b.v) + ".", "bill", b.passed));
    story.forEach(x => news(S + " News Now", "@" + tagSt(c.st) + "NewsNow", "anchor-female", me.short + " " + x + ".", "story", true));
    if (c.app < 45) post(P(), pick(r, ["Since we voted " + H + " in, we never see am for " + S + ". Abuja don sweet am.", "Our senator only remembers us at election time. Where is the constituency project?"]), "absent", 3);
    else post(P(), "Credit to " + H + ": the borehole in our ward finally works. 🙏🏾", "praise", 1, { tone: "good" });
    if (c.cor > .4) post(P(), "₦" + (13 + Math.round(r() * 8)) + "M a month in “running costs” for each senator, while we buy water. Ask " + H + " what they run. #NASSRunningCosts", "corruption", 3);
    post(P(), pick(r, ["How did " + H + " vote on the last bill? Asking for " + S + ".", "Senate don resume. Make " + H + " no sleep for chamber this time."]), "bill", 1);
    inst("BudgetWatch NG", "@BudgetWatchNG", "reporter", "THREAD 🧵 Constituency projects in " + S + ": we visited the sites listed in the budget. " + (c.app < 50 ? "Most are not there." : "Some are real."), "projects");
    oppPost("Hon. " + pick(r, ["Ada Nwosu", "Tunde Bakare", "Musa Garba"]), "@" + tagSt(c.st) + "Challenger", "opposition-candidate-alt", c.app < 50 ? "Four years in Abuja and " + S + " has nothing to show. The ticket is open. #" + tagSt(c.st) + "DeservesBetter" : "Our senator is busy in Abuja. I will be busy in " + S + ".", "absent");
    tags = ["#NASS", "#" + tagSt(c.st) + "Senator", c.cor > .4 ? "#NASSRunningCosts" : "#ConstituencyProjects"];
    options = [{ id: "bills", text: "Voted on every bill this session. My record is public: ask me anything about it. #" + tagSt(c.st), truth: true }, { id: "projects", text: "Constituency projects are on the ground across " + S + ". Visit them.", truth: c.app >= 50 }, { id: "costs", text: "I don't take a naira of running costs I can't account for.", truth: c.cor < .3 }];
  } else if (c.role === "lga") {
    const L = String(c.lga || "Our LGA"), H = "@" + L.replace(/[^A-Za-z]/g, "") + "LGA";
    me = { short: "Hon. " + lastNm(c.name), full: "Hon. " + c.name + ", Chairman", handle: H, bio: "Executive Chairman, " + L + " Local Government, " + stNm(c.st) + " State." };
    where = L; oppLabel = "Opposition";
    story.forEach(x => news(L + " Gist", "@" + L.replace(/[^A-Za-z]/g, "") + "Gist", "anchor-male", "Chairman " + lastNm(c.name) + " " + x + ".", "story", !/wash|fail|lost|collapse|walk/.test(x)));
    if (c.road && c.road.held === false) post(P(), "The market road don wash away again. Chairman, una collect money for am? " + H, "need", 3);
    if (c.app < 45) post(P(), pick(r, ["Refuse don block the drainage for two weeks. " + H + " una dey?", "No drugs at the primary health centre. We come back home with only paracetamol."]), "need", 3);
    else post(P(), "Must commend " + H + ": the market toilets are finally working and clean. 👏🏾", "praise", 1, { tone: "good" });
    post(P(), pick(r, ["Where is our share of the JAAC allocation? Every month the state takes it. " + H, "Councillors only show face when it is time to share."]), "allocation", 2);
    if (c.gov < 35) inst(c.govName || "The Governor", "@" + tagSt(c.st) + "Gov", "governor", "Local governments must account for every naira of their allocation. We are watching.", "governor");
    if (c.cor > .4) inst("BudgetWatch NG", "@BudgetWatchNG", "reporter", "Where did " + L + "'s allocation go this year? The council has not published a single contract. #FollowTheMoney", "corruption");
    oppPost(c.rival || "Hon. Councillor", "@" + L.replace(/[^A-Za-z]/g, "") + "Opposition", "opposition-candidate-alt", c.app < 50 ? "The chairman is a stranger to the wards. We know every street. Your vote is coming." : "Fine road, but who got the contract? Ask questions.", "approval");
    tags = ["#" + L.replace(/[^A-Za-z]/g, "") + "Decides", "#JAACAllocation", "#FixOurMarketRoad"];
    options = [{ id: "road", text: "The market road: we've started. Every contractor's name will be on the signboard.", truth: !!(c.road && c.road.held !== false) }, { id: "phc", text: "Drugs reached every primary health centre this month.", truth: c.app >= 55 }, { id: "alloc", text: "Every naira of our allocation is on the noticeboard at the secretariat. Come and see.", truth: c.cor < .35 }];
  } else {
    const C = String(c.country || "abroad").replace(/^the (Republic|Kingdom|Federation) of /, ""), H = "@NigeriaIn" + C.replace(/[^A-Za-z]/g, "");
    me = { short: "Amb. " + lastNm(c.name), full: "Ambassador " + c.name, handle: H, bio: "Official account of the Embassy of the Federal Republic of Nigeria in " + c.country + ", " + (c.city || "") + "." };
    where = C; oppLabel = "Critics";
    story.forEach(x => news("Naija Abroad News", "@NaijaAbroadNews", "anchor-female", "Ambassador " + lastNm(c.name) + " " + x + ".", "story", true));
    if (c.app < 50) post(P(), pick(r, ["Six months for a passport renewal at " + H + ". Six months! #NigerianAbroad", "Students detained at the border and the embassy is silent. " + H + " where are you?"]), "consular", 3);
    else post(P(), "Got my passport in two weeks from " + H + ". Things are changing! 🇳🇬", "praise", 1, { tone: "good" });
    post(P(), pick(r, ["Nigerian traders in " + C + " are being harassed for papers. Who is speaking for us?", "Remittance fees are killing us. Can the embassy talk to the banks?"]), "consular", 2);
    inst(C + " Foreign Ministry", "@" + C.replace(/[^A-Za-z]/g, "") + "_MFA", "foreign-minister-nigeria", c.host < 35 ? "We have summoned the Nigerian ambassador over recent events." : "Productive talks with the Nigerian Embassy on trade and student visas.", "host");
    if (c.abuja < 35) inst("Ministry of Foreign Affairs, Abuja", "@NigeriaMFA", "foreign-minister-nigeria", "The Ministry is reviewing the performance of some of our missions abroad.", "abuja");
    if ((c.trade || 0) > 0) news("Naija Abroad News", "@NaijaAbroadNews", "anchor-female", (c.trade || 0) + " trade deal" + (c.trade === 1 ? "" : "s") + " signed between Nigeria and " + C + " this term.", "trade", true);
    oppPost("Diaspora Voices", "@DiasporaVoicesNG", "citizen-student-abroad", c.app < 50 ? "The embassy treats Nigerians like a nuisance. We deserve better representation. #NigeriansAbroad" : "Good work on passports. Now the detained students.", "consular");
    tags = ["#NigeriansIn" + C.replace(/[^A-Za-z]/g, ""), "#PassportDelays", "#NigeriansAbroad"];
    options = [{ id: "pass", text: "Passport renewals now take two weeks, not six months. Book online.", truth: c.app >= 55 }, { id: "students", text: "Every detained Nigerian student has had a consular visit this month.", truth: (c.helped || 0) > 0 }, { id: "trade", text: "New trade talks with " + C + " this month: jobs back home.", truth: (c.trade || 0) > 0 }];
  }
  const trends = tags.map((tg, k) => ({ tag: tg, count: fmtCount(3000 + r() * 20000), about: k ? "Politics" : "Trending", rank: k + 1 }));
  return { me, where, oppLabel, feed: out, opp, trends, options };
}
// Replies for the other roles: fit to the post's topic and the role's record.
const callName = (n) => { const x = String(n || "").trim(), w = x.split(" "); return /^(Iya|Mama|Baba|Nurse|Dr|Mr|Mrs|Engr|Alhaji|Hajiya|Chief|Prof)$/i.test(w[0]) ? w.slice(0, 2).join(" ") : w[0]; };
// What a post praises: "the borehole in our ward finally works" → "borehole in our ward".
const praised = (t) => { const m = String(t || "").match(/(?:the|our) ([a-z][a-z ]{2,34}?) (?:finally|is|are|works|working|now)/i); return m ? m[1] : null; };
function roleReplies(t, c) {
  const P = pidgin(t.text), who = callName(t.name), tp = t.topic || toriTopic(t.text), out = [];
  const R = c.role, good = c.app >= 50;
  if (tp === "absent" || tp === "need" || tp === "consular") {
    out.push({ id: "own", text: P ? "You dey right, " + who + ". I dey come see am myself." : "You're right, " + who + ". I'm coming to see it myself, and I'll post what I find.", truth: true, promise: "visit", fx: { app: 1 } });
    out.push({ id: "record", text: R === "senate" ? "I've been in the chamber and in " + stNm(c.st) + ". The records are public." : R === "lga" ? "The work is going on. Come to the secretariat and see the plans." : "We have cleared the backlog. Check your email for your appointment.", truth: good, callout: good ? null : "Public where? We never see you.", fx: good ? {} : { app: -1 } });
    out.push({ id: "dm", text: "DM the details. My office will call you today.", truth: true, fx: {} });
  } else if (tp === "corruption" || tp === "allocation") {
    out.push({ id: "open", text: R === "senate" ? "I'll publish what I received and what I spent, line by line." : R === "lga" ? "Every naira of the allocation is on the noticeboard. Come and check." : "The embassy's accounts are audited every year by the Auditor-General.", truth: c.cor < .35, promise: c.cor < .35 ? null : "openbook", callout: c.cor < .35 ? null : "Publish it then. We'll wait." });
    out.push({ id: "deny", text: "These are lies from my opponents.", truth: c.cor < .3, fx: c.cor < .3 ? {} : { app: -1 }, callout: "Lies? Show us the receipts then." });
  } else if (tp === "praise") {
    const it = praised(t.text), next = R === "senate" ? "a health centre for " + stNm(c.st) : R === "lga" ? "the market road before the rains" : "the student visa queue";
    out.push({ id: "thanks", text: P ? "Thank you " + who + "! " + (it ? "Na una fight for the " + it + ". " : "") + "Next na " + next + ". 🙏🏾" : "Thank you, " + who + ". " + (it ? "You fought for the " + it + ". " : "") + "Next: " + next + ".", truth: true, fx: { app: 1 }, promise: "next" });
    out.push({ id: "team", text: R === "senate" ? "Credit to my constituency office: they chased that contractor every week." : R === "lga" ? "Credit to the works department and the councillors who stayed on site." : "Credit to the consular staff who worked weekends to clear it.", truth: true, fx: {} });
  } else if (tp === "host" || tp === "abuja" || tp === "governor") {
    out.push({ id: "calm", text: tp === "governor" ? "We'll account for every naira. Our door is open to the Governor." : "We value the relationship and are in contact at the highest level.", truth: true, fx: {} });
    out.push({ id: "push", text: tp === "governor" ? "Local governments deserve their full allocation, not what's left after the state takes its share." : "We'll defend Nigerians first, even when it's uncomfortable.", truth: true, fx: { app: 1 } });
  } else {
    out.push({ id: "answer", text: R === "senate" ? "I voted with " + stNm(c.st) + " in mind. Ask me about any bill." : R === "lga" ? "Heard, " + who + ". Councillors will be in your ward this week." : "Heard, " + who + ". The consular desk will reach out today.", truth: true, promise: "general" });
    out.push({ id: "dm", text: "Send me the details and I'll follow up personally.", truth: true, fx: {} });
  }
  return out;
}

/* ══ Tori, round three (owner, 21 Nov 2026: "all of them are solid fixes. Do all") ══════════════════════════════
   B instant reactions · C six accounts you follow, with arcs · D one big story at a time · E pictures, memes, polls,
   clips · F mostly life, some politics · H the opposition's long game. G (the aide, pin, delete, block, Spaces) is
   on the screen with helpers here. A (AI-written posts) is in server/tori-ai.mjs; these are the fallback and the frame. */

// C. The six accounts the governor follows all term. fans: { [id]: -3..3 } from how he has treated them.
export const TORI_FOLLOW = ["student", "trader", "aproko", "praise", "reporter", "memes"];
export const fanLabel = (n) => n >= 2 ? "Fan" : n <= -2 ? "Critic" : null;
export function toriFollowing(c) {
  const S = tagSt(c.st), N = stNm(c.st), me = toriHandle(c.st), t = c.turn || 1, fans = c.fans || {}, r = rngOf("follow" + c.st + t);
  const cast = castFor(c, "follow" + c.st, 3), [stu, trd] = cast, out = [], asuu = (c.strikes || []).find(s => /ASUU/i.test(s.short));
  const post = (id, who, handle, art, sub, text, extra) => out.push({ id: "f_" + id + "_" + t, kind: "citizen", follow: id, fan: fanLabel(fans[id] || 0), name: who, sub, handle, art, text, ago: ago(r, out.length), ...counts(r, 3), verified: id === "reporter" || id === "memes", topic: "general", ...(extra || {}) });
  // The student: the strike, then class, then graduation or a visa.
  const left = asuu && asuu.years >= 2 && (fans.student || 0) < 1;
  post("student", stu.who, "@" + stu.h, "student-leader", "Final-year student · you follow",
    t >= 4 ? (left ? "Update: I got the visa. Leaving next week. I wanted to graduate in " + N + ". " + me + " you lost me. ✈️ #Japa" : "I GRADUATE NEXT MONTH 🎓😭 Four years became " + (3 + t) + ", but we move. Thank you to everyone who held on.")
    : asuu ? pick(r, ["Strike year " + asuu.years + ". I've started a small business selling phone accessories. Not by choice. #ASUUStrike", "My classmates don write me off. 'Is your school still on strike?' Yes. Year " + asuu.years + ". 🙃", "Applied for an online course from a school abroad. Free. Because my own school is locked. Think about that, " + me + "."])
    : pick(r, ["Back in class and I'm actually happy. Never thought I'd say that 😂📚", "Exams in two weeks. Pray for me. The library has light today, small miracle 🙏🏾", "Lecturer came, taught, gave assignment. Normal things feel like luxury now."]),
    { topic: asuu ? "strike" : "general", media: asuu ? { type: "photo", img: "scenes/campus-shut", alt: "A locked university gate" } : null, arc: left ? "left" : t >= 4 ? "graduated" : asuu ? "waiting" : "studying" });
  // The trader: floods, prices, the stall rebuilt when the needs are met.
  const late = (c.needs || []).some(n => n.late), fixed = (c.delivered || 0) > 0 && !late;
  post("trader", trd.who, "@" + trd.h, "market-trader", "Trader · you follow",
    fixed ? pick(r, ["They fixed the drainage by my shop. First rainy season in 5 years my goods didn't swim. 🙌🏾", "New market stalls are up. Mine is number 47. Come and buy, my customers 😄"])
    : late ? pick(r, ["Water entered my shop AGAIN. Third time this year. Everything gone. " + me + " you promised drainage. 😭", "Rain fell, my stall became a swimming pool. I'm tired of starting afresh."])
    : pick(r, ["Prices up again. Customers are buying in small small. We are managing.", "Market is slow this week. Everybody is holding their money tight."]),
    { topic: late ? "need" : fixed ? "praise" : "general", media: late ? { type: "photo", img: "backgrounds/flooded-community", alt: "A flooded street of shops" } : fixed ? { type: "photo", img: "scenes/market-road-finished", alt: "A finished market road" } : { type: "photo", img: "scenes/market-inflation", alt: "Price tags in a market" } });
  // Aproko Desk: leaks from what really happened in your government.
  const leak = (c.leaks || [])[0];
  post("aproko", "Aproko Desk", "@AprokoDesk", "journalist-guest", "Gist & gossip · you follow",
    leak ? "🚨 GIST: " + leak + " Sources inside " + (c.nat ? "the Villa" : "Government House") + " confirm. More loading… 👀"
    : pick(r, ["🚨 Which commissioner was seen leaving a hotel in Abuja at 3am with a 'consultant'? Answers in my DM 👀", "🚨 Small gist: there's a cabinet reshuffle coming. Somebody's chair is shaking. 🪑", "🚨 Who is the 'nephew' that keeps winning contracts? I'm just asking questions 👀"]),
    { topic: leak ? "corruption" : "general", gossip: true });
  // The praise singer: on your side, until the money stops.
  const paid = !!(c.tools || {}).bots, turned = c.arrears >= 2 || (fans.praise || 0) <= -2;
  post("praise", "Iyaloje of Government", "@IyalojeGovt", "market-women-group-cheering", "Praise singer · you follow",
    turned ? "Even me, I don tire. " + (c.arrears ? c.arrears + " months salary? " : "") + "I sang your praise till my voice cracked. Today I am rejoining the masses. ✊🏾"
    : paid ? "OUR GOVERNOR IS WORKING!!! 🙌🏾🙌🏾 Roads, schools, hospitals, everything! (copy and paste this, ₦2,000 each, send account number)"
    : pick(r, ["Who is like our " + (c.nat ? "President" : "Governor") + "? Nobody! " + me + " na correct person! 👑🔥", "They can say anything, we know the truth. " + me + " is working day and night 🙏🏾💪🏾", "God bless " + me + " and his family. Haters will see shame 🙌🏾"]),
    { topic: turned ? "salaries" : "praise", exposed: paid });
  // The journalist.
  if (c.reporter) post("reporter", c.reporter, "@" + String(c.reporter).split(" ")[0].toLowerCase() + "_reports", "reporter", "Investigative reporter · you follow",
    c.cor > .4 ? "Three months on this story. The contracts, the names, the bank transfers. Publishing Monday. 🧵" : "We tracked every project " + me + " announced this year. Here's what we found on the ground 🧵", { topic: c.cor > .4 ? "corruption" : "approval" });
  // The meme page: whatever the top story is, with your face.
  const mood = c.app >= 60 ? "pleased" : c.app < 40 ? "angry" : "worried", top = (c.topStory || {});
  post("memes", "Naija Meme HQ", "@NaijaMemeHQ", "youth-group-cheering", "Memes · you follow", pick(r, ["Caption this 😂", "No context needed 💀", "Me watching the news this week:"]),
    { topic: "general", media: { type: "meme", img: "characters/governor-" + mood, top: top.memeTop || (c.arrears ? "WORKERS: WHERE IS OUR SALARY" : asuu ? "STUDENTS: WHEN IS SCHOOL RESUMING" : "THE GOVERNOR"), bottom: top.memeBottom || (c.app >= 60 ? "ME: CHECK THE ROADS 😎" : "ME: WE ARE WORKING ON IT 🙂") } });
  return out;
}

// D. The one big story this visit: the hottest thing, with quote-tweets and the ratio.
export function toriMainStory(c, H) {
  const s = (H && H.stories || [])[0], ev = toriNews(c).find(e => e.mood === "bad"), good = (c.done || [])[0], r = rngOf("main" + c.st + c.turn), me = toriHandle(c.st);
  const cast = castFor(c, "main" + c.st + c.turn, 4);
  if (s) return { tag: s.tag, title: s.cause, why: s.who + " want: " + s.demand.toLowerCase() + ".", posts: fmtCount(20000 * (H.stage + 1) + r() * 9000), tone: "bad", img: { salaries: "scenes/labour-strike", needs: "scenes/market-road-washout", corruption: "scenes/billboard-street", stalled: "scenes/market-road-washout", japa: "scenes/billboard-street", approval: "scenes/fuel-queue" }[String(s.id).replace(/_.*/, "")] || (String(s.id).startsWith("strike") ? "scenes/campus-shut" : "scenes/fuel-queue"),
    quotes: [[cast[0], pick(r, ["This is the only story that matters today. " + me + " answer!", "Everybody is talking about this except " + me + ". Interesting 🤔", "If you're not angry about this you're not paying attention."])], [cast[1], pick(r, ["😂😂 they will still post 'progress' tomorrow", "Na today? This one don tey.", "My village group chat is on fire over this."])], [cast[2], pick(r, ["Make una calm down, government is working on it 🙄 (sarcasm)", "Bookmarking this for 2031.", "The memes are better than the government's explanation."])]].map(([p, tx]) => ({ name: p.who, handle: "@" + p.h, art: p.art, text: tx })) };
  if (ev) return { tag: "#" + tagSt(c.st) + "News", title: ev.text, why: "Everyone has an opinion.", posts: fmtCount(8000 + r() * 9000), tone: "bad", img: "scenes/fuel-queue", quotes: [[cast[0], "Who signed off on this?"], [cast[1], "E no go better? 😩"]].map(([p, tx]) => ({ name: p.who, handle: "@" + p.h, art: p.art, text: tx })) };
  if (good) return { tag: "#" + String(good).split(/\s+/).slice(0, 2).join("").replace(/\W/g, "") + "IsOpen", title: good + " is finished", why: "For once, good news is trending.", posts: fmtCount(6000 + r() * 6000), tone: "good", img: "scenes/ribbon-market", quotes: [[cast[0], "I drove on it today. It's real. 🙌🏾"], [cast[1], "Okay but let's see the next rainy season 👀"]].map(([p, tx]) => ({ name: p.who, handle: "@" + p.h, art: p.art, text: tx })) };
  return null;
}

// E. Pictures for ordinary posts, a before/after for finished work, a poll on the year, a clip after a press conference.
export function toriMedia(x, c) {
  if (x.media) return x.media;
  const t = String(x.text || "").toLowerCase(), topic = x.topic || "";
  if (x.kind === "citizen" && topic === "praise" && /open|finished|done/.test(t)) return { type: "beforeafter", before: "scenes/market-road-washout", after: "scenes/market-road-finished", alt: "The road before and after" };
  if (/convoy/.test(t)) return { type: "photo", img: "scenes/army-convoy", alt: "A long convoy of black cars" };
  if (/light don go|nepa|light\b/.test(t)) return { type: "photo", img: "scenes/national-grid-dark", alt: "A dark street at night" };
  if (/venice|flood|rain fell/.test(t)) return { type: "photo", img: "backgrounds/flooded-community", alt: "A flooded street" };
  if (/price|tomato|pepper/.test(t)) return { type: "photo", img: "scenes/market-inflation", alt: "Market prices" };
  if (/fuel|queue/.test(t)) return { type: "photo", img: "scenes/fuel-queue", alt: "A fuel queue" };
  return null;
}
export function toriPoll(c, H) {
  const app = Math.max(5, Math.min(90, Math.round(c.app))), st = (H || {}).stage || 0, r = rngOf("poll" + c.st + c.turn);
  const w = [app * .45, app * .55, Math.max(5, 100 - app - st * 6), Math.max(2, st * 8 + (100 - app) * .15)], sum = w.reduce((a, b) => a + b, 0), pc = w.map(x => Math.round(x * 100 / sum)); pc[2] += 100 - pc.reduce((a, b) => a + b, 0);
  const [great, okay, bad, resign] = pc;
  return { id: "poll_" + c.turn, kind: "citizen", name: stNm(c.st) + " Polls", sub: "Polls", handle: "@" + tagSt(c.st) + "Polls", art: "anchor-male", verified: true, ago: "3h", ...counts(r, 3), topic: "approval",
    text: "How would you rate " + toriHandle(c.st) + "'s year so far? 🗳️", media: { type: "poll", votes: fmtCount(4000 + r() * 20000), options: [{ l: "Great, keep going", pct: great }, { l: "Okay, could be better", pct: okay }, { l: "Bad", pct: bad }, { l: "Resign", pct: resign }] } };
}
export const toriClip = (c) => (c.tools || {}).presser ? { id: "clip_" + c.turn, kind: "news", name: stNm(c.st) + " News Now", sub: "News", handle: "@" + tagSt(c.st) + "NewsNow", art: "anchor-female", verified: true, ago: "5h", likes: 2400, rts: 900, replies: 610, topic: "general",
  text: "WATCH: " + (c.nat ? "The President" : "The Governor") + " at today's press conference. 🎥", media: { type: "clip", img: "scenes/ag-on-television", dur: "1:" + String(10 + (c.turn * 7) % 49).padStart(2, "0") } } : null;

// F. Ordinary life: football, a reality show, weddings, data, jollof. The politics stands out because of it.
export function toriLife2(c, n) {
  const r = rngOf("life2" + c.st + c.turn), cast = castFor(c, "life2" + c.st + c.turn, n + 4), N = stNm(c.st), out = [];
  const pool = [
    "The Eagles better not disappoint me this weekend. I've already told my landlord I'll pay after the match. ⚽",
    "Big Hustle Naija eviction tonight. If they evict Tobi I'm deleting this app 😤📺",
    "Zeeno Vibez dropped a new song and it's already my ringtone, alarm and personality 🎶🔥",
    "Went for an owambe, the jollof finished before I arrived. Worst day of my life. 🍛",
    "Who else's data finishes faster than their salary? Asking for myself 📱💸",
    "Ghana jollof supporters, it's not too late to repent. 🇳🇬🍛",
    "My mum just discovered voice notes. 14 voice notes this morning. Send help 😂",
    "Traffic from " + N + " to work today: 3 hours. My boss: 'why are you late?' Sir, have you seen the road?",
    "Tolu Starling's new Nollywood film had me crying in the cinema. Grown man. No shame. 🎬😭",
    "Wedding season: 4 weddings, 3 aso-ebi, 0 money. 💃🏾",
    "That feeling when NEPA brings light exactly when you've just fallen asleep 🙃",
    "Pastor said the offering basket should 'sound like heaven'. Wetin be that sound? 😂",
    "Who is watching the derby? My neighbour's generator is louder than the commentary.",
  ];
  const REP = ["😂😂 I'm weak", "This is too real", "Na so 😂", "E no go better? E go better.", "Facts.", "Lmaooo", "Who send you? 😂", "I felt this in my soul"];
  const idx = pool.map((x, i) => [rngOf("lp" + c.st + c.turn + i)(), i]).sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
  idx.forEach((i, k) => { const p = cast[k], o = cast[k + 3]; out.push({ id: "life_" + c.turn + "_" + i, kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text: pool[i], ago: ago(r, k + 2), ...counts(r, 1 + r() * 2), topic: "life", life: true, thread: r() < .7 ? [{ name: o.who, handle: "@" + o.h, art: o.art, text: pick(r, REP) }] : [] }); });
  return out;
}

// H. The opposition's long game: a named campaign, receipts in election year, and fast replies to your posts.
export const toriCampaignTag = (c) => "#" + String(c.oppName || "Change").replace(/^(Hon\.|Chief|Dr\.|Alhaji|Senator)\s*/, "").split(" ").pop().replace(/\W/g, "") + (c.year ? (c.year + (4 - ((c.turn - 1) % 4)) - 1 + 1) : "");
export function toriReceipts(c) {
  const R = [...(c.allPromises || []).filter(b => b.turn < c.turn).map(b => { const k = promiseKept(b, c); return { turn: b.turn, text: b.text, status: k === true ? "kept" : "broken" }; }), ...(c.lieList || []).map(l => ({ turn: l.turn, text: l.text, status: "lie" }))].sort((a, b) => a.turn - b.turn).slice(-5); if (!R.length) return null;
  const election = (c.turn % 4) === 0 || (c.turn % 4) === 3;
  if (!election) return null;
  const nm = c.oppName || "The opposition", S = tagSt(c.st);
  return { id: "receipts_" + c.turn, kind: "opposition", name: nm, sub: "Opposition candidate", handle: "@" + String(nm).replace(/^(Hon\.|Chief|Dr\.|Alhaji|Senator)\s*/, "").split(" ")[0].toLowerCase() + "4" + S.toLowerCase(), art: "opposition-candidate-alt", verified: true, ago: "1h", likes: 18000, rts: 7400, replies: 2100, topic: "approval", fair: true, w: 9,
    text: "🧵 RECEIPTS. Everything " + toriHandle(c.st) + " promised you on Tori, and what happened. Election is coming. Read it all. " + toriCampaignTag(c),
    thread: R.map(x => ({ name: nm, handle: "", art: "opposition-candidate-alt", text: "Y" + x.turn + ": “" + briefT(x.text, 70) + "” → " + (x.status === "kept" ? "done, credit to them" : x.status === "lie" ? "called out as false the same day" : "never happened") })) };
}
export const toriOppReply = (opt, c, seed) => { const r = rngOf("or" + seed), S = tagSt(c.st); return { name: c.oppName || "The opposition", handle: "@opposition", art: "opposition-candidate-alt", verified: true, text: opt.truth === false ? pick(r, ["Another lie. Screenshot taken. 📸 " + toriCampaignTag(c), "Fact check: false. We'll remind you in the election."]) : pick(r, ["Nice tweet. Now do your job. " + toriCampaignTag(c), "Words. We need results. " + S + " deserves better.", "We'll judge you by the record, not the caption."]) }; };

// B. What you just did, on Tori within minutes: news of each new event, and the first reactions.
export function toriInstant(c) {
  const out = [], r = rngOf("inst" + c.st + c.turn + (c.fresh || []).length), cast = castFor(c, "inst" + c.st + c.turn, 8), me = toriHandle(c.st);
  (c.fresh || []).slice(0, 3).forEach((e, i) => {
    const t = toriNews({ ...c, events: [e] })[0]; if (!t) return;
    const p = cast[i * 2], q = cast[i * 2 + 1];
    out.push({ id: "now" + hash(t.text), kind: "citizen", instant: true, name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, ago: "now", ...counts(r, 2), topic: t.mood === "good" ? "praise" : "general", tone: t.mood,
      text: (t.mood === "good" ? pick(r, ["Just in: ", "Wait, ", "Okay o, "]) : t.mood === "bad" ? pick(r, ["Just now: ", "Breaking: ", "Haba! "]) : pick(r, ["Just in: ", "FYI: "])) + briefT(t.text, 110) + " " + (t.mood === "good" ? pick(r, ["👏🏾", "Finally.", "We see you " + me + "."]) : t.mood === "bad" ? pick(r, ["😤", "Explain this " + me + ".", "Who approved this?"]) : pick(r, ["🤔", "Let's see.", "Hmm."])),
      thread: [{ name: q.who, handle: "@" + q.h, art: q.art, text: t.mood === "good" ? pick(r, ["Took them long enough.", "Credit where it's due.", "Wait for the catch 👀"]) : pick(r, ["Every week a new wahala.", "I'm not even surprised.", "They don start again."]) }] });
  });
  return out;
}

// G. Your voice: the New Media aide rewrites a post in a tone; tones change how it lands.
export const TORI_TONES = [{ id: "formal", l: "Formal" }, { id: "pidgin", l: "Pidgin" }, { id: "witty", l: "Witty" }, { id: "combative", l: "Combative" }];
export function toriTone(text, tone) {
  const t = String(text || "");
  if (tone === "pidgin") return t.replace(/^We are /, "We dey ").replace(/We have heard you/, "We don hear una").replace(/Work starts this year/, "Work go start this year").replace(/Thank you, /, "Thank una, ").replace(/More is coming\./, "More dey come o.") + " 🙏🏾";
  if (tone === "witty") return t.replace(/\.$/, "") + ". (Yes, we read the memes too 😅)";
  if (tone === "combative") return t.replace(/\.$/, "") + ". Critics can keep talking; we'll keep working. 💪🏾";
  return t;
}
export const toneEffect = (tone, opt, c) => tone === "witty" ? (opt.truth ? { likes: 1.6, app: c.app >= 45 ? 1 : 0, line: "The joke landed." } : { likes: .7, app: -1, line: "Jokes about a lie? It made it worse." })
  : tone === "combative" ? { likes: 1.3, app: c.app >= 55 ? 0 : -1, heat: 4, line: "Your base loved it. Everyone else noticed the tone." }
  : tone === "pidgin" ? { likes: 1.4, app: opt.truth ? 1 : 0, line: "It sounded like one of us." } : { likes: 1, app: 0, line: "" };
// What the aide whispers before you reply.
export function toriAide(t, c, H) {
  if (t.kind === "opposition" && (H || {}).stage >= 3) return "Oga, don't reply that one. Anything you say now makes it trend more.";
  if (t.kind === "complaint" && t.lied) return "Sir, you told them it was handled. If you reply again, make it the truth.";
  if (t.gossip) return "Aproko accounts feed on replies. Silence is safest, unless it's false and you can prove it.";
  if (t.follow === "praise" && t.exposed) return "Sir, the payment note is showing. Please don't like or repost this one.";
  if (t.life) return "A light reply here can make you look human. Keep it short.";
  return null;
}
// G. Delete and block have a price; Spaces is a live town hall: three quick questions from the record.
export const deleteBacklash = (p, c) => ({ heat: 5, tweet: { name: "Receipts NG", handle: "@ReceiptsNG", art: "reporter", text: "Deleted? We have screenshots 📸 " + toriHandle(c.st) + " posted: “" + briefT(p.text, 80) + "”" } });
export const blockBacklash = (x, c) => ({ heat: 3, tweet: { name: x.name, handle: x.handle, art: x.art, text: toriHandle(c.st) + " blocked me 😂 Na so truth dey pain. Screenshot before they block you too." } });
export function toriSpace(c) {
  const qs = [], st = (c.strikes || [])[0], f = (c.fled || []).find(x => !x.back), n = (c.needs || [])[0];
  if (c.arrears > 0) qs.push({ who: "A civil servant", q: "Sir, " + c.arrears + " months. When will we be paid?", a: [{ l: "By the end of this month. I'm putting it on record.", ok: true, fx: { app: 1 }, promise: "arrears" }, { l: "Salaries are being paid.", ok: false, fx: { app: -2 } }] });
  if (st) qs.push({ who: "A student", q: "When does the " + st.short + " strike end?", a: [{ l: st.talks ? "We're at the table. I'll sit in myself this month." : "I'll call " + st.short + " to the table this week.", ok: true, fx: {} , promise: "talks" }, { l: "Ask Abuja.", ok: false, fx: { app: -1 } }] });
  if (f) qs.push({ who: "A journalist", q: "Where is the " + fmtM(f.lossM) + " for " + f.proj + "?", a: [{ l: "We are going after " + f.firm + ". Every naira.", ok: !!f.asked, fx: f.asked ? { app: 1 } : {} }, { l: "That matter is in court; no comment.", ok: true, fx: { app: -1 } }] });
  if (n) qs.push({ who: "A trader", q: n.title + ". What are you doing about it?", a: [{ l: n.inWork ? "Work has started. Come and see it." : "Work starts this year.", ok: !!n.inWork, fx: n.inWork ? { app: 1 } : {}, promise: n.inWork ? null : "need" }, { l: "Next question, please.", ok: false, fx: { app: -1 } }] });
  qs.push({ who: "A young voter", q: "Will you run again?", a: [{ l: "Let my record speak first.", ok: true, fx: { app: 1 } }, { l: "Of course. Nobody can stop us.", ok: true, fx: { app: c.app >= 55 ? 1 : -1 } }] });
  qs.push({ who: "A pensioner", q: "What has this government done for old people?", a: [{ l: (c.done || [])[0] ? (c.done[0] + " is finished, and pensions are next.") : "Pensions are next on my list. I won't pretend we've done enough.", ok: true, fx: { app: 1 } }, { l: "More than any government before us.", ok: c.app >= 60, fx: c.app >= 60 ? {} : { app: -1 } }] });
  return qs.slice(0, 3);
}

/* The neighbouring governors on Tori (owner, 21 Nov 2026: "give the governors of the respective states their own Tori
   account where they too can tweet about what they're doing"). c.nbrs: [{ st, name, art, party: "same"|"opp", rel,
   deals: [deal names in force] }]. Each year a few of them post: their own work, the deal with you (warm or cold), a
   jab across the border when you are struggling, and a salute when you have signed with every neighbour. */
export function toriNeighbours(c) {
  const nb = (c.nbrs || []).filter(x => x && x.st); if (!nb.length || c.nat) return [];
  const r = rngOf("nbrs" + c.st + c.turn), me = toriHandle(c.st), Y = stNm(c.st), out = [];
  const WORK = [
    (N, P) => "Flagged off the " + P + " processing plant in " + N + " today. Jobs for our young people, value for our farmers. #" + tagSt(N) + "Works",
    (N) => "Salaries paid on the 20th again. In " + N + ", workers come first. 💪🏾",
    (N) => "Inspected the new wing at the " + N + " State Specialist Hospital. Doctors resume next month.",
    (N) => "Hosted the zonal security summit. Kidnappers do not respect state lines, so neither will our patrols.",
    (N, P) => "Our " + P + " farmers got tractors and improved seedlings this morning. " + N + " will feed the zone.",
    (N) => "6km of the township road in " + N + " is done. 14 to go. We publish progress every Friday. #" + tagSt(N) + "Roads",
    (N) => "Met the NUT today. Promotions arrears will be cleared this quarter. A promise from " + N + " Government House.",
  ];
  const order = nb.slice().sort(() => r() - .5);
  order.slice(0, 3).forEach((g, i) => {
    const N = stNm(g.st), H = toriHandle(g.st), P = (g.produce || "cassava");
    const say = (text0, sub) => { const text = g.st === "FCT" ? text0.replace(/ State Specialist Hospital/g, " Specialist Hospital").replace(/Government House/g, "the FCT Administration").replace(/my colleague/g, "my good friend") : text0; out.push({ kind: "neighbour", verified: true, name: g.name, handle: H, art: g.art || "neighbour-governor-male", sub: (g.st === "FCT" ? "Minister of the Federal Capital Territory" : "Governor of " + N + " State") + (sub ? " · " + (g.st === "FCT" && /party|opposition/.test(sub) ? "appointed by the President" : sub) : ""), text, ago: ago(r, out.length), ...counts(r, 2), id: "nb" + hash(H + text + c.turn), topic: "general" }); };
    const deal = (g.deals || [])[0];
    if (deal && g.rel >= 55 && r() < .7) say("Productive session with my colleague " + me + " on our " + deal.toLowerCase() + ". " + N + " and " + Y + " rise together. 🤝🏾", "your partner");
    else if (deal && g.rel < 40) say("We signed a " + deal.toLowerCase() + " with " + Y + " in good faith. " + N + " is still waiting to see " + me + " keep their side.", "your partner");
    else if (!deal && g.party === "opp" && c.app < 45 && r() < .6) say("Watching what is happening next door in " + Y + (c.arrears ? ": " + c.arrears + " months of salaries owed" : "") + ". In " + N + " we pay our workers and finish our roads. Just saying. 👀", "opposition");
    else say(WORK[Math.floor(r() * WORK.length)](N, P), g.party === "same" ? "your party" : null);
  });
  if (c.tradeAll) { const g = order[0]; out.push({ kind: "neighbour", verified: true, name: g.name, handle: toriHandle(g.st), art: g.art, sub: g.st === "FCT" ? "Minister of the Federal Capital Territory" : "Governor of " + stNm(g.st) + " State", ago: ago(r, out.length), ...counts(r, 4), id: "nball" + c.turn,
    text: "Credit where it is due: " + me + " is the first governor in the zone with a trade deal across every border. The region is one market now. 👏🏾", topic: "praise" }); }
  return out;
}

/* A year of silence on Tori (owner, 22 Nov 2026: "if I go a year without tweeting, both the people and the opposition
   attack me for not communicating: #… must go, feels too big, why can't they answer questions, why hiding behind
   proxies, we elected you, tell us what is going on"). c.silent: how many years in a row with no post (1, 2…);
   c.govName for the hashtag. Returns posts for the feed (citizens) and for the opposition. */
export function toriSilence(c) {
  if (!c.silent) return { people: [], opp: [] };
  const r = rngOf("silent" + c.st + c.turn), me = toriHandle(c.st), N = stNm(c.st), sur = String(c.govName || "Governor").split(" ").pop(), tag = "#" + camel(sur) + "MustGo";
  const boss = c.nat ? "the President" : "the Governor", yrs = c.silent > 1 ? c.silent + " years" : "a whole year";
  const say = [
    tag + ". " + yrs.charAt(0).toUpperCase() + yrs.slice(1) + " and not one word from " + me + ". We are not your subjects.",
    "Since when did " + me + " become too big to talk to us? Power don enter head. 🙄",
    "Simple question: why can't " + me + " answer questions? We have been tagging for months. Nothing.",
    "Every statement now comes from aides and 'sources close to " + boss + "'. Why are you hiding behind proxies, " + me + "?",
    "We elected you. Tell us what is going on in " + N + "! " + me,
    "Is " + me + " even in " + N + "? Somebody check on our " + (c.nat ? "President" : "Governor") + ". 😂 " + tag,
  ];
  const people = say.slice().sort(() => r() - .5).slice(0, 4).map((text, i) => { const p = person(r, i + 3); return { kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text, ago: ago(r, i), ...counts(r, 3), id: "sil" + hash(text + c.turn), topic: "approval", tone: "bad", silent: true }; });
  const opp = [{ text: yrs.charAt(0).toUpperCase() + yrs.slice(1) + " of silence from " + me + ". A leader who will not face the people does not deserve their votes. " + tag, w: 7 },
    { text: "We answer questions every week. " + me + " has not answered one in " + yrs + ". Spokesmen and press releases are not leadership.", w: 5 }];
  return { people, opp, tag };
}

/* Ministers and commissioners on Tori (owner, 22 Nov 2026: "ministers and commissioners should have their own Tori
   accounts where they tweet what they're doing"). c.cab: [{ id, name, minister, art, perf, cor, loyalty, sub, projects:
   [{ title, status, progress }], programmes: [names], plan (their recovery plan this year), record (their last report) }].
   Each year up to four of them post what they are doing: a site visit, a commissioning, a programme's reach, their
   recovery plan; the weak make excuses, and a disloyal one throws shade. */
export function toriCabinet(c) {
  const cab = (c.cab || []).filter(x => x && x.minister); if (!cab.length) return [];
  const r = rngOf("cab" + c.st + c.turn), out = [], me = toriHandle(c.st);
  const handleOf = (m) => "@Hon" + String(m.minister).replace(/^(Hon\.|Dr\.|Prof\.|Engr\.|Barr\.|Alh\.|Mrs\.|Mr\.)\s*/g, "").split(" ").pop().replace(/[^A-Za-z]/g, "") + "_" + String(m.id).replace(/[^a-z]/gi, "").slice(0, 6);
  const tag = (m) => "#" + (String(m.name).replace(/^Ministry of /, "").match(/[A-Za-z]+/) || ["Ministry"])[0] + "Delivers";
  const lc = (x) => String(x).charAt(0).toLowerCase() + String(x).slice(1);
  const DAY = { infrastructure: ["Inspected the drainage works before the rains. Contractors who are not on site by Monday lose their contracts.", "Met the road contractors today: every site now reports progress with photos, every month."],
    health: ["Visited two general hospitals unannounced today. The drug stores were stocked; the staff rota was not. Fixing it.", "Our immunisation teams reached more LGAs this month. Bring your children: it is free."],
    education: ["Unannounced visit to three public schools this morning. Teachers present, pupils in class. Keep it up.", "The exam results are in. Better than last year, not yet good enough. Our next step is the rural schools."],
    agriculture: ["Met the farmers' cooperatives today on inputs for the next season. Fertiliser goes out before the rains, not after.", "Visited the farm settlement. The new storage sheds are full. Less of the harvest is being lost."],
    security: ["Joint patrol on the highway last night. The corridors are safer; we are not done.", "Met the community guards and the traditional rulers today. Report anything strange: the lines are open day and night."],
    justice: ["Visited the custodial centre today. Forty people held for years without trial will have their cases heard this month.", "The new court registry is online. No more paying to find your own file."],
    administration: ["Every payment from this ministry is now online. Ask us anything.", "Met the stakeholders today. Their concerns are noted, and we are acting on them."] };
  const order = cab.slice().sort((a, b) => ((b.projects || []).length + (b.programmes || []).length + (b.plan ? 2 : 0)) - ((a.projects || []).length + (a.programmes || []).length + (a.plan ? 2 : 0)) || r() - .5);
  order.slice(0, 4).forEach(m => {
    const say = (text) => out.push({ kind: "cabinet", verified: true, name: /^(Hon\.|Dr\.|Prof\.|Engr\.|Barr\.|Alh\.)/.test(m.minister) ? m.minister : "Hon. " + m.minister, handle: handleOf(m), art: m.art || "commissioner-technocrat", sub: m.sub, text, ago: ago(r, out.length), ...counts(r, 1), id: "cb" + hash(m.id + text + c.turn), topic: "general" });
    const P = m.projects || [], live = P.find(p => p.status === "in_progress"), done = P.find(p => p.status === "delivered"), stuck = P.find(p => p.status === "stalled");
    if (m.plan) say("Our recovery plan starts today. First step: " + lc(m.plan).replace(/:.*$/, "") + ". Thank you " + me + " for approving it. Judge us by the results next year. " + tag(m));
    else if (done && r() < .7) say(done.title + " is complete and open to the public. Promise made, promise kept. " + tag(m) + " 🎉");
    else if (live && Math.round(live.progress || 0) < 5) say("Work starts at " + live.title + " this week. The contractor is on site; we will publish progress every month. " + tag(m));
    else if (live) say("On site at " + live.title + " this morning: " + Math.round(live.progress || 0) + "% done. We publish progress every month. " + tag(m));
    else if (stuck && (m.cor || 0) > 45) say("The delays at " + stuck.title + " are due to funding issues that are being resolved. We urge stakeholders to remain calm.");
    else if (stuck) say("I will not hide it: " + stuck.title + " has stalled. I have asked for a recovery plan and will publish it here.");
    else if ((m.programmes || []).length) say("The " + m.programmes[0] + " reached more communities this month. Keep the feedback coming. " + tag(m));
    else if ((m.perf || 50) > 70) say("Targets met early this year. My team at the ministry deserves the credit. " + tag(m));
    else if ((m.perf || 50) < 40) say("We inherited decay at the ministry. Rome was not built in a day; give us time and judge us by results.");
    else if ((m.loyalty || 50) < 35) say("Some of us came into government to serve, not to clap. Posterity will judge. 🤐");
    else { const L = DAY[planSector(m.id, m.name)] || DAY.administration; say(L[Math.floor(r() * L.length)] + " " + tag(m)); }
  });
  return out;
}

/* The first post (owner, 23 Nov 2026: "my first post on Tori should be announcing that I am happy to have been
   elected, or we have reclaimed our mandate via the tribunal, and we look forward to getting on with our agenda").
   { nat, st (state name), court (won at the tribunal), agenda (the flagship's name), slogan, tag (the handle) }. */
export function toriFirstPost({ nat, st, court, agenda, slogan, second } = {}) {
  const place = nat ? "Nigeria" : st || "our state", office = nat ? "President" : "Governor";
  const work = agenda ? "Now we get on with the work: " + agenda + "." : "Now we get on with the work we promised.";
  const hash = "#" + String(slogan || (nat ? "ANewNigeria" : "ANewDawn")).replace(/[^A-Za-z0-9]/g, "");
  // The second term: thanks for re-electing us, or the tribunal gave the mandate back; we continue.
  if (second) return { tone: "warm", about: "election", topic: "general", text: court
    ? "We have reclaimed our mandate to continue. The tribunal has restored what you gave us at the polls. Thank you, " + place + ", for standing with us. Four more years to finish what we started: " + (agenda || "the work we promised") + ". " + hash + " #FourMoreYears"
    : "Thank you, " + place + ", for re-electing us! Your trust is humbling. Four more years to finish what we started: " + (agenda || "the work we promised") + ". " + hash + " #FourMoreYears" };
  const text = court
    ? "Justice has prevailed. The tribunal has restored the mandate you gave us at the polls. Thank you, " + place + ", for standing with us through it all. " + work + " " + hash
    : "Thank you, " + place + "! I am humbled and happy to have been elected your " + office + ". To those who voted for us and those who did not: I will serve you all. " + work + " " + hash;
  return { text, tone: "warm", about: "election", topic: "general" };
}
