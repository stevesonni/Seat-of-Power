/* The governor's Wikipedia page, written as a story from the record (rules
   only, no React). The game hands over the facts; this decides what matters,
   in what order, and how to say it: a lead that sums up the term, the
   election, the term year by year (the biggest events of each year, not a
   log), the godfather as an arc, controversies grouped and explained, how it
   ended, and a legacy judged on the record. Every fact that came from a
   decision cites the newspaper story that reported it.

   Output: { lead, sections, refs } where a paragraph is an array of strings
   and { ref: n } markers, sections are { h, paras } or { h, subs }. */

const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const num = (n) => (n >= 0 && n <= 10 ? NUM[n] : String(n));
const cap = (t) => String(t || "").charAt(0).toUpperCase() + String(t || "").slice(1);
const low = (t) => String(t || "").charAt(0).toLowerCase() + String(t || "").slice(1);
// Lower-case a sentence's first word only when it is not a name ("The House…" → "the House…"; "Chief Okafor…" stays).
const lowStart = (t) => /^(He|She|The|A|An|Workers|Residents|Members|Traders|Teachers|Doctors|Nurses|Youths|Parents|Students|Police|Gunmen|Bandits|Floods|Protesters|Critics|Analysts|Opposition)\b/.test(String(t)) ? low(t) : String(t);
const clip = (t, n = 120) => { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; };
const firstSentence = (t) => (String(t || "").match(/^[\s\S]*?[.!?](?=\s|$)/) || [String(t || "")])[0].trim();
const list = (xs) => xs.length <= 1 ? (xs[0] || "") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
const end = (t) => /[.!?…"”]$/.test(t) ? t : t + ".";

// Past-tense verbs the record starts sentences with ("Kept the promise…").
const VERBS = /^(Kept|Went|Gave|Made|Took|Won|Lost|Broke|Sold|Paid|Built|Spent|Sent|Met|Held|Ran|Began|Chose|Fell|Rose|Cut|Set|Put|Let|Led|Left|Told|Sought|Bought|Brought|Fought|Caught|Saw|Drew|Grew|Wrote|Struck|Stood|Hid|Bore|Swore|Withdrew|Overrode|Forgave|Undertook|Oversaw|Inherited|[A-Z][a-z]+ed)$/;
const NAMES = /^(United|Red|Ahmed|Mohammed|Hamed|Saeed|Abdulrasheed|Ahmad)$/;

/* One record entry as a sentence about the governor ("he kept…"), or a
   sentence that already has its own subject ("Workers went on strike…"). */
export const sentenceOf = (txt, he) => {
  let t = String(txt || "").replace(/\s+/g, " ").trim(); if (!t) return "";
  t = end(t);
  const first = t.split(" ")[0];
  if (first === "Was" || first === "Were") return he + " was" + t.slice(first.length);
  if (VERBS.test(first) && !NAMES.test(first)) return he + " " + low(first) + t.slice(first.length);
  return t;
};

// How much an entry matters, to pick the few that tell each year.
const WEIGHT = [
  [/nullif|impeach|tribunal|petition|Supreme Court/i, 9], [/strike|ultimatum|riot|protest|kidnap|died|dead|killed/i, 8],
  [/godfather|betray|opposition/i, 7], [/debt|relief|restructur|loan|bond/i, 6], [/sacked|fired|resign|minister|commissioner/i, 5],
  [/election|council|local government/i, 5], [/promise/i, 5], [/law|bill|executive order|signed/i, 4],
  [/delivered|commissioned|opened|completed/i, 4], [/awarded|approved|contract/i, 2], [/appointed|convened|created the ministry/i, 2],
];
const weightOf = (t) => WEIGHT.reduce((w, [rx, v]) => (rx.test(t) ? Math.max(w, v) : w), 1);

/* f: the facts (see writeBio's destructuring). Returns { lead, sections, refs }. */
export const writeBio = (f) => {
  const fem = !!f.female;
  const He = fem ? "She" : "He", he = fem ? "she" : "he", His = fem ? "Her" : "His", his = fem ? "her" : "his", him = fem ? "her" : "him";
  const yearOf = (t) => 2026 + (t || 1);
  const name = f.name, st = f.stateName, party = f.partyName || f.partyId;
  const refs = [], refKey = {};
  const paper = "The " + st + " Daily Tribune";
  const cite = (head, t, src) => {
    const key = head + "|" + t; if (refKey[key]) return { ref: refKey[key] };
    const n = refs.length + 1; refKey[key] = n; refs.push({ n, head: clip(head.replace(/[.\s]+$/, ""), 110), src: src || paper, when: "November " + yearOf(t) });
    return { ref: n };
  };

  // ── Sort the record ──
  const evs = [], seen = new Set();
  (f.events || []).slice().reverse().forEach(e => { if (!e || !e.txt) return; const k = String(e.txt); if (seen.has(k)) return; seen.add(k); evs.push(e); });
  const warn = [], broken = [], kept = [], honours = [], rest = [];
  evs.forEach(e => {
    const t = String(e.txt).trim();
    const iw = t.match(/^Ignored warnings?: (.*)$/i);
    if (iw) return warn.push({ t: e.turn, what: firstSentence(iw[1]).replace(/\s+(this|last) (month|week|year)|\s+today|\s+yesterday/gi, "") });
    const bp = t.match(/^Broke the campaign promise to [“"](.*)[”"]\.?$/); if (bp) return broken.push({ t: e.turn, what: bp[1] });
    const kp = t.match(/^Kept the campaign promise to [“"](.*)[”"]\.?$/); if (kp) return kept.push({ t: e.turn, what: kp[1] });
    const hn = t.match(/^Earned the honour [“"](.*)[”"]: (.*)$/); if (hn) return honours.push({ t: e.turn, nm: hn[1], why: hn[2].replace(/\byour\b/g, his).replace(/\byou\b/g, he) });
    rest.push({ t: e.turn, txt: t, bad: e.section === "Controversies", w: weightOf(t) });
  });
  const lastT = Math.max(1, f.turn || 1);
  const app = f.appH && f.appH.length ? f.appH : [55, f.app];
  const appStart = Math.round(app[0]), appEnd = Math.round(f.app);
  // The year approval moved most, and what happened that year.
  let swing = null;
  for (let i = 1; i < app.length; i++) { const d = app[i] - app[i - 1]; if (!swing || Math.abs(d) > Math.abs(swing.d)) swing = { t: i, d: Math.round(d) }; }
  const fm = f.flagMilestones || [];
  const fDone = fm.filter(m => m.delivered).length, fCut = fm.filter(m => m.delivered && m.corners).length;

  // ── Lead ──
  const lead = [];
  const served = f.ended ? "served as Governor of " + st + " State from " + f.startYear + " to " + f.endYear : "has been Governor of " + st + " State since May " + f.startYear;
  const p1 = [name + " is a Nigerian politician who " + served + ". A member of the " + party + ", " + he + " won the " + f.startYear + " election" + (f.election ? " by " + f.election.marginPct + "%, defeating " + f.election.opp + " of the " + f.election.oppParty : "") + "."];
  lead.push(p1);
  const p2 = [];
  if (f.flag) p2.push(His + " term was defined by " + f.flag.nm + ", a promise to " + f.flag.goal + (fm.length ? ": " + num(fDone) + " of " + num(fm.length) + " yearly targets were met" + (fCut ? ", " + num(fCut) + " of them by cutting corners" : "") : "") + ". ");
  if (swing && Math.abs(swing.d) >= 5) {
    const why = rest.filter(e => e.t === swing.t && (swing.d < 0 ? e.bad : !e.bad)).sort((a, b) => b.w - a.w)[0];
    p2.push("Approval " + (swing.d < 0 ? "fell" : "rose") + " most sharply in " + yearOf(swing.t) + (why ? ", the year " + lowStart(sentenceOf(why.txt, He).replace(/\.$/, "")) : "") + "; it went from " + appStart + "% at the start to " + appEnd + "%" + (f.ended ? " when " + he + " left office" : "") + ". ");
  } else p2.push("Approval went from " + appStart + "% to " + appEnd + "%" + (f.ended ? " by the end of " + his + " time in office" : "") + ". ");
  lead.push(p2);
  if (f.ended && f.exit) lead.push([f.exit]);

  const sections = [];
  // ── Early career and the election ──
  const early = [[name + " entered politics through the " + party + ". " + He + " won the party's ticket for governor in " + (f.startYear - 1) + ", with " + (f.deputy || "a running mate") + " as running mate" + (f.mateAccepted === false ? ", a choice the party had not wanted" : "") + "."]];
  const camp = [He + " campaigned on the slogan “" + (f.slogan || "") + "”" + (f.flag ? " and promised to " + f.flag.goal : "") + ". "];
  if (f.election) camp.push("On election day " + he + " carried " + (f.election.zonesWon === 3 ? "all three" : num(f.election.zonesWon) + " of the three") + " senatorial districts and beat " + f.election.opp + " by " + f.election.marginPct + "%. ");
  if (f.loan) { camp.push("The campaign was part-paid by a " + f.loan.amount + " loan from " + f.godfather + ", a party financier who would expect something back."); camp.push(cite(f.godfather + " bankrolls " + name + "'s campaign", 1)); }
  early.push(camp);
  sections.push({ h: "Early career and the " + f.startYear + " election", paras: early });

  // ── The term, year by year ──
  const subs = [];
  if (f.cabinet && f.cabinet.length) subs.push({ h: "Cabinet", paras: [[He + " was sworn in on 29 May " + f.startYear + ". " + His + " first cabinet included " + list(f.cabinet.slice(0, 4).map(m => m.minister + " (" + m.name + ")")) + "."]] });
  for (let t = 1; t <= lastT; t++) {
    const ys = rest.filter(e => e.t === t).sort((a, b) => b.w - a.w);
    const good = ys.filter(e => !e.bad).slice(0, 3), bad = ys.filter(e => e.bad).slice(0, 2);
    const fmT = fm.find(m => m.t === t);
    if (!good.length && !bad.length && !fmT) continue;
    const pp = [];
    good.forEach((e, i) => { const s = sentenceOf(e.txt, He); pp.push(i === 0 ? "In " + yearOf(t) + ", " + lowStart(s) + " " : s + " "); if (e.w >= 5) { pp.push(cite(clip(firstSentence(e.txt), 100), t)); pp.push(" "); } });
    if (fmT && f.flag) { pp.push(f.flag.nm + "'s target for the year was " + (fmT.delivered ? (fmT.corners ? "met on paper, with corners cut" : "met in full") : "missed") + ". "); pp.push(cite(f.flag.nm + ": year " + t + " target " + (fmT.delivered ? "met" : "missed"), t)); pp.push(" "); }
    bad.forEach(e => (e.told = true));
    bad.forEach((e, i) => { const s = sentenceOf(e.txt, He); pp.push((i === 0 && (good.length || fmT) ? "But " + lowStart(s) : (i === 0 && !good.length && !fmT ? "In " + yearOf(t) + ", " + lowStart(s) : s)) + " "); pp.push(cite(clip(firstSentence(e.txt), 100), t)); pp.push(" "); });
    if (app[t] != null && app[t - 1] != null && Math.abs(app[t] - app[t - 1]) >= 4) pp.push("By the end of the year approval stood at " + Math.round(app[t]) + "%.");
    subs.push({ h: (t <= 4 ? ["First", "Second", "Third", "Fourth"][t - 1] : ["Fifth", "Sixth", "Seventh", "Eighth"][t - 5]) + " year (" + yearOf(t) + "–" + String(yearOf(t) + 1).slice(2) + ")", paras: [pp] });
  }
  sections.push({ h: "Governorship", subs: subs.length ? subs : [{ h: "Early months", paras: [["The administration had taken no recorded decisions yet."]] }] });

  // ── The godfather ──
  if (f.godfather && (f.loan || (f.gfDeals || []).length || (f.gfRefusals || []).length || f.gfFate)) {
    const pp = [];
    const deals = f.gfDeals || [], refusals = f.gfRefusals || [];
    pp.push(f.godfather + " backed " + name + "'s rise" + (f.loan ? " and lent the campaign " + f.loan.amount : "") + ". ");
    if (deals.length) { pp.push("In office " + he + " gave him what he asked for " + (deals.length === 1 ? "once" : num(deals.length) + " times") + (deals[0].note ? ": " + lowStart(sentenceOf(clip(deals[0].note, 90), he)).replace(/[.…]?$/, "") : "") + ". "); pp.push(cite(f.godfather + " gets his way at Government House", deals[0].t)); pp.push(" "); }
    if (refusals.length) { pp.push(He + " also refused him " + num(refusals.length) + (refusals.length === 1 ? " time" : " times") + ", and " + (f.gfFate === "opposition" ? "the godfather eventually crossed to the opposition." : "the relationship cooled.")); pp.push(cite(name + " says no to " + f.godfather, refusals[0].t)); pp.push(" "); }
    else if (f.gfFate === "opposition") pp.push("The godfather eventually crossed to the opposition. ");
    if (f.gfFate === "dead") pp.push(f.godfather + " died during the administration. ");
    if (f.owed) pp.push(num(f.owed) === "one" ? "One promise to a power broker was still unpaid" + (f.ended ? " when " + he + " left office." : ".") : cap(num(f.owed)) + " promises to power brokers were still unpaid" + (f.ended ? " when " + he + " left office." : "."));
    sections.push({ h: "Relationship with " + f.godfather, paras: [pp] });
  }

  // ── Promises ──
  if (kept.length || broken.length) {
    const pp = [];
    const q = (k) => "\u201c" + k.what + "\u201d";
    if (kept.length) pp.push(He + " kept " + (kept.length === 1 ? "one campaign promise, " : num(kept.length) + " campaign promises, ") + list(kept.map(k => q(k) + " (" + yearOf(k.t) + ")")) + (broken.length ? ", and " : ". "));
    if (broken.length) { pp.push((kept.length ? "broke " : He + " broke ") + num(broken.length) + (broken.length === 1 ? ", " : ": ") + list(broken.map(q)) + "."); pp.push(cite(name + " breaks " + (broken.length === 1 ? "a campaign promise" : num(broken.length) + " campaign promises"), broken[0].t)); }
    sections.push({ h: "Campaign promises", paras: [pp] });
  }

  // ── Controversies, grouped ──
  const cpp = [];
  if (warn.length) {
    cpp.push("Critics said " + his + " government ignored warnings before " + (warn.length === 1 ? "a tragedy" : num(warn.length) + " tragedies") + ": " + list(warn.slice(0, 4).map(w => low(w.what.replace(/\.$/, "")) + " (" + yearOf(w.t) + ")")) + ". ");
    cpp.push(cite("Warnings ignored: " + clip(warn[0].what, 70), warn[0].t)); cpp.push(" ");
  }
  rest.filter(e => e.bad && !e.told).sort((a, b) => b.w - a.w || a.t - b.t).slice(0, 5).sort((a, b) => a.t - b.t).forEach(e => { cpp.push("In " + yearOf(e.t) + ", " + lowStart(sentenceOf(e.txt, He)) + " "); cpp.push(cite(clip(firstSentence(e.txt), 100), e.t)); cpp.push(" "); });
  sections.push({ h: "Controversies", paras: [cpp.length ? cpp : ["No controversy had been reported."]] });

  // ── Public image and honours ──
  if (honours.length || app.length > 2) {
    const pp = [];
    const peak = app.reduce((b, v, i) => (v > b.v ? { v, i } : b), { v: -1, i: 0 }), low0 = app.reduce((b, v, i) => (v < b.v ? { v, i } : b), { v: 999, i: 0 });
    if (app.length > 2) pp.push(His + " approval peaked at " + Math.round(peak.v) + "%" + (peak.i ? " in " + yearOf(peak.i) : " at the start") + " and was lowest at " + Math.round(low0.v) + "%" + (low0.i ? " in " + yearOf(low0.i) : " at the start") + ". ");
    if (honours.length) pp.push(He + " earned " + (honours.length === 1 ? "the honour" : "the honours") + " " + list(honours.map(h => "“" + h.nm + "” (" + h.why.replace(/\.$/, "") + ")")) + ".");
    sections.push({ h: "Public image", paras: [pp] });
  }

  // ── Legacy ──
  if (f.ended) {
    const pp = [];
    const debtWord = f.debtStart != null ? (f.debt < f.debtStart * .8 ? "cut the state's debt from " + f.debtStartTxt + " to " + f.debtTxt : f.debt > f.debtStart * 1.2 ? "left the state owing " + f.debtTxt + ", up from " + f.debtStartTxt : "left the debt roughly where " + he + " found it, at " + f.debtTxt) : "left the state owing " + f.debtTxt;
    pp.push(name + " " + debtWord + ". ");
    pp.push(f.projects.delivered ? num(f.projects.delivered) === "one" ? "One project was finished and opened" : cap(num(f.projects.delivered)) + " projects were finished and opened" : "No project was finished on " + his + " watch");
    pp.push(f.projects.stalled ? ", while " + num(f.projects.stalled) + " stalled or were abandoned. " : ". ");
    if (f.needs.met || f.needs.failed) pp.push(cap(num(f.needs.met)) + " community needs were met and " + num(f.needs.failed) + " were let down. ");
    pp.push(f.cor > .55 ? "After leaving office " + he + " was questioned by the EFCC once " + his + " immunity under Section 308 lapsed." : f.cor < .25 ? He + " left office with no corruption case against " + him + "." : "Questions about " + his + " contracts outlived the administration.");
    sections.push({ h: "Legacy", paras: [pp] });
  }

  // ── Record in numbers ──
  const rec = ["Projects: " + f.projects.delivered + " delivered, " + f.projects.building + " under construction" + (f.projects.stalled ? ", " + f.projects.stalled + " stalled or abandoned" : "") + ". "];
  if (f.needs.met + f.needs.failed + f.needs.open) rec.push("Community needs: " + f.needs.met + " met, " + f.needs.failed + " failed, " + f.needs.open + " outstanding. ");
  rec.push("Debt " + f.debtTxt + "; own revenue " + f.igrTxt + " a year. " + f.ministries + " ministries; " + f.bills + " " + (f.bills === 1 ? "law" : "laws") + " signed. Approval " + appEnd + "%; corruption index " + Math.round((f.cor || 0) * 100) + "%.");
  sections.push({ h: "Record in numbers", paras: [rec] });

  return { lead, sections, refs };
};
