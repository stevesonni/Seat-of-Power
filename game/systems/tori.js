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
  const post = (name, handle, art, text, extra) => out.push({ id: "i" + hash(handle + text), kind: "institution", name, sub: "", handle, art, text, ago: ago(r, out.length), ...counts(r, 2 + st), verified: true, pinned: true, ...(extra || {}) });
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
  if (st >= 4) post("State House, Abuja", "@StateHouseNG", "the-president", st >= 5 ? "Mr. President has summoned the Governor of " + N + " State to Abuja over the deteriorating situation in the state." : "The Presidency is monitoring developments in " + N + " State.");
  if (st >= 5) post("#" + S + "GovMustGo coalition", "@" + S + "Coalition", "workers-group-angry", "NLC, NUT, NMA, the market women and civil society: one demand. The Governor must resign. #" + S + "GovMustGo");
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
