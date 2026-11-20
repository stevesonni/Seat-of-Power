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
export const toriHandle = (st) => /^nigeria$/i.test(String(st)) ? "@NGRPresident" : "@" + tagSt(st) + "Gov";
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
  const P = pidgin(t.text), who = t.kind === "institution" || t.kind === "opposition" ? t.name : callName(t.name), me = c.nat ? "the Federal Government" : "Government House";
  const topic = t.topic || toriTopic(t.text), out = [], opp = t.kind === "opposition", inst = t.kind === "institution";
  const S = stNm(c.st), f = (c.fled || []).find(x => !x.back) || null, st = (c.strikes || [])[0] || null, n = (c.needs || [])[0] || null, done = (c.done || [])[0] || null;
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
  } else if (topic === "approval" || opp) {
    const fair = (c.arrears > 0 && /salar/i.test(t.text)) || (st && /strike/i.test(t.text)) || (c.app < 50 && /%|approval|deserves|must go/i.test(t.text)) || (f && /contractor|money/i.test(t.text)) || (c.cor > .4 && /contract|debt|loot/i.test(t.text));
    out.push({ id: "record", text: done ? "We finished " + done + ". What did you build in 8 years?" : "Judge us by the record at the end of the term, not by tweets.", truth: !!done, fx: done ? { app: 1 } : {}, callout: done ? null : "What record? Name one finished project." });
    out.push({ id: "rebut", text: "That is false, and " + (opp ? "you know it" : "the facts will show it") + ".", truth: !fair, fx: fair ? { app: -1 } : { app: 1 }, callout: fair ? "False? Everybody can see it." : null });
    out.push({ id: "listen", text: "Fair criticism. We're listening, and we'll do better.", truth: true, fx: fair ? { app: 1 } : {} });
  } else {
    out.push({ id: "hear", text: P ? "We dey hear you, " + who + ". " + me + " no dey sleep on this." : "Heard, " + who + ". " + me + " is on it.", truth: true, promise: "general" });
    out.push({ id: "dm", text: "Send us the details in DM and the right commissioner will call you today.", truth: true, fx: {} });
  }
  return out.slice(0, 4);
}
// How people answer the governor's reply: specific to what was claimed.
export function toriReplyReact(opt, t, seed) {
  const r = rngOf("rr" + seed), p = pick(r, PEOPLE);
  if (opt.truth === false) return { replies: [{ name: (t.name || p.who).split(" ")[0], text: opt.callout || "That's not true and you know it." }, { name: p.who, text: pick(r, ["Screenshot. This one will age badly.", "Ratio.", "Community note needed here 👇🏾"]) }], line: "Called out" };
  if (opt.action) return { replies: [{ name: p.who, text: "Let's see it then. 👀" }], line: "Watching" };
  if (opt.promise) return { replies: [{ name: (t.name || p.who).split(" ")[0], text: opt.callout ? opt.callout : pick(r, ["We are holding you to this.", "Screenshotted. Next year we will check.", "Okay. Na your word be this."]) }], line: "Noted" };
  return { replies: [{ name: (t.name || p.who).split(" ")[0], text: pick(r, ["The governor replied me 😭🙌🏾", "Respect for answering.", "This is the kind of reply we want. Thank you."]) }], line: "Liked" };
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
