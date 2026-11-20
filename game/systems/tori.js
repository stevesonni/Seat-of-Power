/* Tori: the state's own Twitter-style feed (owner's design, 20 Nov 2026). Citizens, the press, the party and the
   opposition post about how the state is run; the governor has an account (@EbonyiGov…) and can post and reply.
   Everything is written by the game from the state of play, in English and Pidgin: no live AI, nothing per player.
   Pure functions: the screen (game/seat-of-power.jsx, ToriScreen) passes a context and draws what comes back. */

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let x = hash(seed) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const stNm = (st) => String(st || "").replace(/_/g, " ");
const tagSt = (st) => stNm(st).replace(/[^A-Za-z]/g, "");
export const toriHandle = (st) => "@" + tagSt(st) + "Gov";
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

export function toriFeed(c) {
  const r = rngOf("feed" + c.st + c.turn), S = tagSt(c.st), tags = toriTrends(c), T = (i) => (tags[i] || tags[0] || { tag: "#" + S }).tag, out = [];
  // Each citizen posts once before anyone posts again.
  const order = PEOPLE.map(p => [r(), p]).sort((a, b) => a[0] - b[0]).map(x => x[1]); let oi = 0; const nextP = () => order[oi++ % order.length];
  const post = (p, text, heat, extra) => out.push({ id: "t" + hash(text), kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text, ago: ago(r, out.length), ...counts(r, heat), ...(extra || {}) });
  // The complaints: the people waiting for an answer, first.
  (c.complaints || []).forEach((q, i) => out.push({ id: "q" + q.id + "_" + c.turn, kind: "complaint", complaint: q.id, name: q.who.split(",")[0], sub: q.place || "", handle: "@" + String(q.who.split(",")[0]).toLowerCase().replace(/[^a-z]/g, "_") + "_" + tagSt(c.st).toLowerCase().slice(0, 4), art: null, who: q.who, text: (q.icon ? q.icon + " " : "") + q.t + " " + toriHandle(c.st), ago: ago(r, i), ...counts(r, 2), answered: q.answered, lied: q.lied }));
  (c.strikes || []).forEach(s => {
    if (/ASUU/i.test(s.short)) { post(nextP(), pick(r, ["Year " + s.years + " of this ASUU strike. My mates in other states don graduate. " + T(0), "Una say una go settle ASUU. We still dey house. " + toriHandle(c.st) + " wetin dey happen?", "Lecturers no dey paid, we no dey school. Who this one help? " + T(0)]), 3); }
    else post(nextP(), pick(r, ["The " + s.short + " strike is in year " + s.years + ". Hospitals empty, offices locked. " + T(0), "No light, no water, no work. " + s.short + " strike still dey. " + toriHandle(c.st) + " do something!"]), 3);
  });
  if (c.arrears > 0) post(nextP(), pick(r, ["Na " + c.arrears + " month" + (c.arrears === 1 ? "" : "s") + " now dem never pay us. Landlord don give me quit notice. #PayOurSalaries" + S, "Civil servants in " + stNm(c.st) + " are borrowing to eat. " + c.arrears + " months unpaid. " + toriHandle(c.st)]), 3);
  else post(nextP(), pick(r, ["Alert don land on the 25th again. I go talk true: salaries are steady under this government. #SalaryPaid", "Say what you like, " + stNm(c.st) + " pays its workers on time now."]), 1, { tone: "good" });
  (c.done || []).slice(0, 2).forEach(t => post(nextP(), pick(r, [t + " is finally open! Took my mum there today 🙏🏾 " + toriHandle(c.st) + " well done.", "I didn't believe it until I saw it. " + t + " is real. #" + String(t).split(/\s+/).slice(0, 2).join("").replace(/\W/g, "") + "IsOpen"]), 2, { tone: "good" }));
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => post(nextP(), "So " + f.firm + " collected the money for " + f.proj + " and travelled to " + f.to + "? And nobody is in jail? #WhereIsOurMoney", 3));
  (c.needs || []).slice(0, 2).forEach(n => post(nextP(), pick(r, [n.title + ". We don cry tire. " + toriHandle(c.st), n.title + ". Is anybody in Government House reading this?"]), 2));
  if (c.cor > .45) post(nextP(), pick(r, ["Contracts to friends, roads to nowhere. " + stNm(c.st) + " deserves better. #" + S + "Looted", "Ask yourself where the FAAC money goes every month. Just ask."]), 2);
  if (c.app >= 60) post(nextP(), pick(r, ["Honestly this governor is trying. Not perfect, but trying. #" + S + "IsWorking", "First time in years I see government people in my village."]), 1, { tone: "good" });
  // What really happened this year: the local news account posts it, a citizen reacts to it.
  const NEWS = { name: stNm(c.st) + " News Now", sub: "News", handle: "@" + S + "NewsNow", art: "anchor-female", verified: true };
  const PRAISE = ["Finally! 👏🏾", "Credit where it's due.", "This one sweet me. Well done " + toriHandle(c.st) + ".", "Good. Now keep the same energy.", "We see you 🙌🏾"];
  const DOUBT = ["Na so dem dey talk every year.", "Talk is cheap. We will see on the ground.", "And who will this one benefit? Their friends?", "Who did this help in my area?"];
  const ANGER = ["This is unacceptable. " + toriHandle(c.st) + " explain yourself.", "Every day a new wahala. " + stNm(c.st) + " deserves better.", "We are tired of this government.", "E don do! 😤"];
  (c.events || []).slice(0, 6).forEach((e, i) => {
    const id = "n" + hash(e.text + c.turn), hot = e.good ? 1 : 2;
    out.push({ id, kind: "news", ...NEWS, text: e.text, ago: ago(r, i + 1), ...counts(r, hot), tone: e.good ? "good" : "bad" });
    const p = nextP(), mood = e.good ? (c.app >= 45 ? PRAISE : DOUBT) : ANGER;
    out.push({ id: id + "r", kind: "citizen", name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text: pick(r, mood), quote: { name: NEWS.name, text: e.text }, ago: ago(r, i + 2), ...counts(r, hot), tone: e.good ? "good" : "bad" });
  });
  // The press and the party.
  if (c.reporter) out.push({ id: "press" + c.turn, kind: "press", name: c.reporter, sub: "Investigative reporter", handle: "@" + c.reporter.split(" ")[0].toLowerCase() + "_reports", art: "reporter", text: c.cor > .4 ? "Working on a story about how contracts are awarded in " + stNm(c.st) + ". DMs open for documents." : "Approval for " + toriHandle(c.st) + " is at " + Math.round(c.app) + "% in our latest street poll. Thread 🧵", ago: ago(r, 5), ...counts(r, 2), verified: true });
  if (c.house) out.push({ id: "speaker" + c.turn, kind: "party", name: c.speaker || "The Speaker", sub: "Speaker, House of Assembly", handle: "@" + tagSt(c.st) + "Assembly", art: "lawmaker-opposition-leader", text: c.house.loyal * 2 >= c.house.seats ? "The House stands with the people of " + stNm(c.st) + ". Bills that serve them will pass." : "The House will not be a rubber stamp. " + (c.house.seats - c.house.loyal) + " members have questions for the executive.", ago: ago(r, 6), ...counts(r, 1), verified: true });
  // Order: mix by heat, complaints first.
  const q = out.filter(x => x.kind === "complaint"), news = out.filter(x => x.kind === "news" || x.quote), rest = out.filter(x => x.kind !== "complaint" && x.kind !== "news" && !x.quote).sort((a, b) => b.likes - a.likes);
  const mixed = []; let ni = 0; rest.forEach((x, i) => { if (i % 2 === 0 && ni < news.length) { mixed.push(news[ni++]); if (news[ni] && news[ni].quote) mixed.push(news[ni++]); } mixed.push(x); });
  while (ni < news.length) mixed.push(news[ni++]);
  return [...q, ...mixed];
}

export function toriOpposition(c) {
  const r = rngOf("opp" + c.st + c.turn), S = tagSt(c.st), nm = c.oppName || "The opposition candidate", party = c.oppParty || "the opposition", out = [];
  const post = (text, heat) => out.push({ id: "o" + hash(text), kind: "opposition", name: nm, sub: party + " candidate", handle: "@" + String(nm).replace(/^(Hon\.|Chief|Dr\.)\s*/, "").split(" ")[0].toLowerCase() + "4" + S.toLowerCase(), art: "opposition-candidate-alt", text, ago: ago(r, out.length), ...counts(r, heat), verified: true });
  if (c.app < 50) post("Approval at " + Math.round(c.app) + "%. The people have spoken. " + S + " deserves a government that works. #" + S + "DeservesBetter", 3);
  else post("They will show you ribbons and photos. Ask them about the debt they are piling on your children.", 2);
  (c.strikes || []).forEach(s => post("Day after day of the " + s.short + " strike and " + toriHandle(c.st) + " is posting photos. Our children are at home. Shameful.", 3));
  if (c.arrears > 0) post(c.arrears + " months of unpaid salaries. When we come in, workers will be paid first. That is a promise.", 3);
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => post("A contractor ran to " + f.to + " with our money and this government did nothing. Who is protecting who? #WhereIsOurMoney", 3));
  if (c.cor > .4) post("Every contract in this state goes to the same three people. We have the list. Watch this space.", 2);
  post(pick(r, ["We are going ward to ward. " + stNm(c.st) + " is ready for change. #" + S + "Decides" + (c.year || ""), "Join us this Saturday at the town hall. Bring your questions; we will bring answers."]), 1);
  return out;
}

/* What the governor can post: built from what is really happening. truth: false means the claim is not backed by the
   record (the replies will say so). */
export function toriOptions(c) {
  const out = [], S = tagSt(c.st);
  if (!c.arrears) out.push({ id: "salaries", text: "Salaries paid on the 25th again. Every worker, every month. That is our promise. #SalaryPaid", truth: true, about: "salaries" });
  else out.push({ id: "salaries_claim", text: "Salaries are being paid. Don't listen to the opposition. #SalaryPaid", truth: false, about: "salaries" });
  (c.done || []).slice(0, 2).forEach(t => out.push({ id: "done_" + t, text: t + " is open. Built by " + stNm(c.st) + ", for " + stNm(c.st) + ". More is coming. #" + String(t).split(/\s+/).slice(0, 2).join("").replace(/\W/g, "") + "IsOpen", truth: true, about: "project" }));
  (c.strikes || []).forEach(s => out.push({ id: "strike_" + s.id, text: "We are at the table with " + s.short + ". Our children will be back in class. We are not sleeping on this. #" + s.short.replace(/\W/g, "") + "Strike", truth: !!s.talks, about: "strike" }));
  (c.needs || []).slice(0, 1).forEach(n => out.push({ id: "need", text: n.title + ": we have heard you. Work starts this year.", truth: !!n.inWork, about: "need" }));
  (c.fled || []).filter(f => !f.back).slice(0, 1).forEach(f => out.push({ id: "japa", text: f.firm + " will not enjoy our money in " + f.to + ". We are going after every naira. #WhereIsOurMoney", truth: !!f.asked, about: "japa" }));
  out.push({ id: "thanks", text: "Thank you, " + stNm(c.st) + ". Every day in this office is for you. 🇳🇬", truth: true, about: "thanks", soft: true });
  if (c.app < 50) out.push({ id: "attack", text: "The opposition had 8 years and built nothing. We will not take lectures from them.", truth: true, about: "attack", attack: true });
  return out.slice(0, 6);
}

/* How a post lands. Returns { likes, rts, replies: [{ name, handle, art, text }], ratio, fx: { app }, line }. */
export function toriReact(opt, c, seed) {
  const r = rngOf("react" + seed), S = tagSt(c.st), fans = c.app / 100, reach = 1 + Math.max(0, c.app - 30) / 20;
  let likes = Math.round((200 + r() * 800) * reach * (opt.truth ? 1.4 : .6)), rts = Math.round(likes * (0.1 + r() * 0.3)), app = 0, ratio = false;
  const reply = (p, text) => ({ name: p.who, sub: p.what, handle: "@" + p.h, art: p.art, text });
  const replies = [];
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
