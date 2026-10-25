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

/* Encyclopedia style, modelled on a long Wikipedia biography of a head of
   government: a lead that sums up the whole career, the election in its own
   section, the time in office told by subject (not as a diary), dated
   sentences, opinions attributed to someone ("Critics argued…"), approval
   credited to a pollster, and a historical evaluation. Every name of an
   institution that rates the governor is fictional. */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ORD = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
export const ordN = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const hash = (t) => { let h = 7; for (const c of String(t || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
// Which governor of the state since 1999 the player is: the same everywhere it is shown.
export const governorOrdinal = (stateName) => 4 + hash(stateName) % 4;
// A birth date for the infobox, fixed by the name so it never changes between reads.
export const birthOf = (name, startYear) => { const h = hash(name); return (1 + h % 28) + " " + MONTHS[(h >> 5) % 12] + " " + ((startYear || 2027) - 45 - (h >> 9) % 13); };
// The subjects a governorship is told by, in this order. The first that matches an entry takes it.
const THEMES = [
  ["Fiscal policy and the budget", /budget|appropriation|debt|loan|bond|revenue|tax|levy|FAAC|IGR|treasury|salar|arrears|ghost worker|payroll|borrow|bank/i],
  ["Labour relations", /strike|NLC|ASUU|union|ultimatum|roundtable|MoU|NUT|JOHESU|workers/i],
  ["Security", /secur|bandit|kidnap|police|army|troops|insurgen|militan|vigilante|gunmen|herder|curfew|sit-at-home/i],
  ["Infrastructure and public works", /road|bridge|rail|project|contract|contractor|construction|commission|ribbon|power|electric|water|housing|dam|airport|seaport|highway/i],
  ["Education", /school|universit|teacher|pupil|student|literacy|education|polytechnic|college/i],
  ["Health", /health|hospital|clinic|doctor|nurse|cholera|outbreak|maternal|childbirth|drug/i],
  ["Agriculture, trade and investment", /farm|harvest|agric|investor|investment|factory|jobs|trade|business|company|market|plant/i],
  ["Legislation and executive orders", /\blaw\b|bill|signed|executive order|veto|House of Assembly|National Assembly|legislat/i],
  ["Local government and the traditional institutions", /council|local government|LGA|chairm|traditional|emir|oba|palace|royal/i],
  ["Relations with the federal government", /federal|Abuja|President|Aso Rock|minister of/i],
];
const themeOf = (t) => (THEMES.find(([, rx]) => rx.test(t)) || ["Other matters"])[0];

/* f: the facts (see buildWiki). Returns { lead, sections, refs }. */
export const writeBio = (f) => {
  const fem = !!f.female;
  const He = fem ? "She" : "He", he = fem ? "she" : "he", His = fem ? "Her" : "His", his = fem ? "her" : "his", him = fem ? "her" : "him";
  const base = f.startYear || 2027, yearOf = (t) => base - 1 + (t || 1);
  const name = f.name, st = f.stateName, party = f.partyName || f.partyId;
  const surname = String(name || "").trim().split(/\s+/).slice(-1)[0] || name;
  const office = f.office || ("Governor of " + st + " State");
  const ordinal = f.ordinal || governorOrdinal(st);
  const refs = [], refKey = {};
  const paper = "The " + st + " Daily Tribune";
  // A date inside the year an entry happened, the same every time the page is written.
  const dateOf = (t, txt) => { const m = (hash(txt) % 12), d = 1 + (hash(txt + "d") % 28); return { m, d, txt: d + " " + MONTHS[m] + " " + (m < 4 ? yearOf(t) + 1 : yearOf(t)) }; };
  const cite = (head, t, src) => {
    const key = head + "|" + t; if (refKey[key]) return { ref: refKey[key] };
    const n = refs.length + 1; refKey[key] = n; refs.push({ n, head: clip(head.replace(/[.\s]+$/, ""), 110), src: src || paper, when: dateOf(t, head).txt });
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
  const fm = f.flagMilestones || [];
  const fDone = fm.filter(m => m.delivered).length, fCut = fm.filter(m => m.delivered && m.corners).length;
  const twoTerms = lastT > 4;
  const laws = (f.laws || []).filter(Boolean), progs = (f.programmes || []).filter(Boolean);
  // How the record judges the administration, 0–100: approval, honesty, debt and delivery.
  const debtTrend = f.debtStart ? (f.debt <= f.debtStart * .8 ? 1 : f.debt >= f.debtStart * 1.2 ? -1 : 0) : 0;
  const score = Math.max(0, Math.min(100, Math.round(appEnd * .45 + (1 - (f.cor || 0)) * 30 + debtTrend * 8 + Math.min(10, (f.projects.delivered || 0) * 2.5) + Math.min(8, (f.needs.met || 0) * 2) - (f.needs.failed || 0) * 2)));
  const verdict = score >= 70 ? "one of the most effective in the state's history" : score >= 55 ? "above average" : score >= 40 ? "unremarkable" : score >= 28 ? "below average" : "one of the least effective in the state's history";

  // A sentence from the record, opened with its date.
  const dated = (e, first) => { const D = dateOf(e.t, e.txt), s = sentenceOf(e.txt, He); return (first ? "On " + D.txt + ", " : "In " + MONTHS[D.m] + " " + (D.m < 4 ? yearOf(e.t) + 1 : yearOf(e.t)) + ", ") + lowStart(s); };

  // ── Lead ──
  const lead = [];
  const served = f.ended ? "served as the " + ORD[ordinal] + " " + office + " from " + base + " to " + f.endYear : "has served as the " + ORD[ordinal] + " " + office + " since " + base;
  const born = f.born ? " (born " + f.born + ")" : "";
  const p1 = [name + born + " is a Nigerian politician who " + served + ". A member of the " + party + ", " + he + " " + (f.prior ? "previously " + f.prior + "." : "rose through the party's ranks in " + st + " before seeking the governorship.") + " "];
  lead.push(p1);
  const p2 = [];
  if (f.election) p2.push(surname + " was elected governor in " + base + ", defeating " + f.election.opp + (f.election.oppParty ? " of the " + f.election.oppParty : "") + " by " + f.election.marginPct + " percentage points" + (f.election.zonesWon === 3 ? " and carrying all three senatorial districts" : "") + ". ");
  if (twoTerms) p2.push(He + " was re-elected in " + (base + 4) + ". ");
  if (f.flag) p2.push(His + " administration was defined by " + f.flag.nm + ", a pledge to " + f.flag.goal + (fm.length ? "; " + num(fDone) + " of its " + num(fm.length) + " yearly targets " + (fDone === 1 ? "was" : "were") + " met" + (fCut ? ", " + num(fCut) + " of them by cutting corners" : "") : "") + ". ");
  if (p2.length) lead.push(p2);
  const p3 = [];
  const did = [];
  if (laws.length) did.push("signed " + num(laws.length) + (laws.length === 1 ? " bill" : " bills") + " into law, including the " + laws[0]);
  if (progs.length) did.push("launched " + (progs.length === 1 ? "the " + progs[0] : num(progs.length) + " programmes, among them the " + progs[0]));
  if (f.projects.delivered) did.push("completed " + num(f.projects.delivered) + (f.projects.delivered === 1 ? " capital project" : " capital projects"));
  if (did.length) p3.push("As governor, " + surname + " " + list(did) + ". ");
  if (f.debtStart != null && f.ended) p3.push(debtTrend > 0 ? He + " reduced the state's debt from " + f.debtStartTxt + " to " + f.debtTxt + ". " : debtTrend < 0 ? "The state's debt rose from " + f.debtStartTxt + " to " + f.debtTxt + " during " + his + " tenure. " : "");
  const hard = [];
  if (f.strikes && f.strikes.length) hard.push(f.strikes.length === 1 ? "a strike by " + f.strikes[0] : "strikes by " + list(f.strikes));
  if (warn.length) hard.push("criticism that " + his + " government ignored warnings before preventable deaths");
  if (f.godfather && (f.gfDeals || []).length) hard.push("questions about " + his + " ties to the political financier " + f.godfather);
  if (hard.length) p3.push(His + " tenure was also marked by " + list(hard) + ". ");
  if (p3.length) lead.push(p3);
  const p4 = [];
  if (f.ended && f.exit) p4.push(f.exit + " ");
  p4.push(f.ended ? He + " left office with an approval rating of " + appEnd + "%, " + (appEnd >= appStart ? "up from " : "down from ") + appStart + "% at " + his + " inauguration. Political analysts have described " + his + " tenure as " + verdict + "." : His + " approval rating stands at " + appEnd + "%, against " + appStart + "% at " + his + " inauguration.");
  lead.push(p4);

  const sections = [];
  // ── Early life and career ──
  const early = [];
  early.push((f.born ? surname + " was born in " + f.bornPlace + ". " : "") + He + " entered politics through the " + party + " in " + st + ". ");
  if (f.prior) early.push("Before seeking the governorship, " + he + " " + f.prior + ". ");
  sections.push({ h: "Early life and career", paras: [early] });

  // ── The election ──
  const camp = [];
  camp.push(surname + " won the " + party + " ticket for governor in " + (base - 1) + ", choosing " + (f.deputy || "a running mate") + " as " + his + " running mate" + (f.mateAccepted === false ? ", a choice the party's leadership had opposed" : "") + ". ");
  camp.push(He + " campaigned on the slogan “" + (f.slogan || "") + "”" + (f.flag ? ", promising to " + f.flag.goal : "") + ". ");
  if (f.loan) { camp.push("The campaign was partly financed by a " + f.loan.amount + " loan from " + f.godfather + ", a party financier; critics argued that the debt gave him leverage over the incoming administration."); camp.push(cite(f.godfather + " bankrolls " + name + "'s campaign", 1)); camp.push(" "); }
  if (f.election) camp.push("In the general election, " + he + " defeated " + f.election.opp + (f.election.oppParty ? " of the " + f.election.oppParty : "") + " by a margin of " + f.election.marginPct + " percentage points, carrying " + (f.election.zonesWon === 3 ? "all three" : num(f.election.zonesWon) + " of the three") + " senatorial districts.");
  sections.push({ h: base + " gubernatorial election", paras: [camp] });

  // ── Governorship, by subject ──
  const subs = [];
  const first = [He + " was sworn in on 29 May " + base + " in " + (f.capital || st) + ". "];
  if (f.cabinet && f.cabinet.length) first.push("Within weeks " + he + " had named " + his + " executive council, which included " + list(f.cabinet.slice(0, 4).map(m => m.minister + " (" + m.name + ")")) + ". ");
  const y1 = rest.filter(e => e.t === 1 && !e.bad).sort((a, b) => b.w - a.w).slice(0, 2);
  y1.forEach((e, i) => { first.push(dated(e, i === 0) + " "); e.used = true; });
  subs.push({ h: "Inauguration and first hundred days", paras: [first] });
  const groups = {};
  rest.filter(e => !e.used && !(f.debtStart != null && /^Inherited .*debt/i.test(e.txt))).forEach(e => { const th = e.bad ? null : themeOf(e.txt); if (th) (groups[th] = groups[th] || []).push(e); });
  [...THEMES.map(x => x[0]), "Other matters"].forEach(th => {
    let es = (groups[th] || []).sort((a, b) => b.w - a.w).slice(0, 4).sort((a, b) => a.t - b.t || dateOf(a.t, a.txt).m - dateOf(b.t, b.txt).m);
    const pp = [];
    if (th === "Legislation and executive orders" && laws.length) { pp.push("During " + his + " tenure the House of Assembly passed, and " + he + " signed into law, the " + list(laws.slice(0, 5)) + ". "); }
    if (th === "Infrastructure and public works" && f.flag && fm.length) { pp.push("The centrepiece of " + his + " programme, " + f.flag.nm + ", met " + num(fDone) + " of its " + num(fm.length) + " yearly targets" + (fCut ? "; auditors later found corners had been cut on " + num(fCut) : "") + ". "); pp.push(cite(f.flag.nm + ": " + num(fDone) + " of " + num(fm.length) + " targets met", lastT)); pp.push(" "); }
    if (th === "Fiscal policy and the budget" && f.debtStart != null) pp.push(He + " inherited a debt of " + f.debtStartTxt + " from the previous administration" + (f.ended || lastT > 1 ? "; by " + yearOf(lastT) + " it stood at " + f.debtTxt + ", and the state collected " + f.igrTxt + " a year in internally generated revenue" : "") + ". ");
    es.forEach((e, i) => { pp.push(dated(e, i === 0 && !pp.length) + " "); if (e.w >= 4) { pp.push(cite(clip(firstSentence(e.txt), 100), e.t)); pp.push(" "); } });
    if (pp.length) subs.push({ h: th, paras: [pp] });
  });
  sections.push({ h: "Governorship (" + base + "–" + (f.ended ? f.endYear : "present") + ")", subs });

  // ── Re-election ──
  if (twoTerms) sections.push({ h: (base + 4) + " re-election", paras: [[surname + " sought a second term in " + (base + 4) + " and was re-elected. " + His + " second term began on 29 May " + (base + 4) + "."]] });

  // ── The godfather ──
  if (f.godfather && (f.loan || (f.gfDeals || []).length || (f.gfRefusals || []).length || f.gfFate)) {
    const pp = [];
    const deals = f.gfDeals || [], refusals = f.gfRefusals || [];
    pp.push(f.godfather + ", a party financier, was widely seen as the power behind " + surname + "'s rise" + (f.loan ? "; he lent the campaign " + f.loan.amount : "") + ". ");
    if (deals.length) { pp.push("In office " + he + " granted his requests " + (deals.length === 1 ? "once" : num(deals.length) + " times") + (deals[0].note ? "; the first time, " + sentenceOf(clip(deals[0].note, 90), he).replace(/[.…]?$/, "").replace(/^([A-Z])/, c => c.toLowerCase()) : "") + ". "); pp.push(cite(f.godfather + "'s influence over Government House", deals[0].t)); pp.push(" "); }
    if (refusals.length) { pp.push(He + " refused him " + num(refusals.length) + (refusals.length === 1 ? " time" : " times") + ", and " + (f.gfFate === "opposition" ? "the financier eventually crossed to the opposition." : "relations between the two cooled.")); pp.push(cite("Rift between " + name + " and " + f.godfather, refusals[0].t)); pp.push(" "); }
    else if (f.gfFate === "opposition") pp.push("The financier eventually crossed to the opposition. ");
    if (f.gfFate === "dead") pp.push(f.godfather + " died during the administration. ");
    if (f.owed) pp.push(num(f.owed) === "one" ? "One promise to a power broker remained unpaid" + (f.ended ? " when " + he + " left office." : ".") : cap(num(f.owed)) + " promises to power brokers remained unpaid" + (f.ended ? " when " + he + " left office." : "."));
    sections.push({ h: "Relationship with " + f.godfather, paras: [pp] });
  }

  // ── Promises ──
  if (kept.length || broken.length) {
    const pp = [];
    const q = (k) => "“" + k.what + "”";
    if (kept.length) pp.push(He + " kept " + (kept.length === 1 ? "one campaign promise, " : num(kept.length) + " campaign promises, ") + list(kept.map(k => q(k) + " (" + yearOf(k.t) + ")")) + (broken.length ? ", and " : ". "));
    if (broken.length) { pp.push((kept.length ? "broke " : He + " broke ") + num(broken.length) + (broken.length === 1 ? ", " : ": ") + list(broken.map(q)) + ". Opponents cited the broken " + (broken.length === 1 ? "pledge" : "pledges") + " as evidence that " + he + " had overpromised."); pp.push(cite(name + " breaks " + (broken.length === 1 ? "a campaign promise" : num(broken.length) + " campaign promises"), broken[0].t)); }
    sections.push({ h: "Campaign promises", paras: [pp] });
  }

  // ── Controversies ──
  const cpp = [];
  if (warn.length) {
    cpp.push("Critics argued that " + his + " government ignored warnings before " + (warn.length === 1 ? "a preventable tragedy" : num(warn.length) + " preventable tragedies") + ": " + list(warn.slice(0, 4).map(w => low(w.what.replace(/\.$/, "")) + " (" + yearOf(w.t) + ")")) + ". ");
    cpp.push(cite("Warnings ignored: " + clip(warn[0].what, 70), warn[0].t)); cpp.push(" ");
  }
  rest.filter(e => e.bad).sort((a, b) => b.w - a.w || a.t - b.t).slice(0, 5).sort((a, b) => a.t - b.t).forEach((e, i) => { cpp.push(dated(e, i === 0 && !warn.length) + " "); cpp.push(cite(clip(firstSentence(e.txt), 100), e.t)); cpp.push(" "); });
  if (cpp.length) cpp.push(He + " " + (f.ended ? "denied wrongdoing in each case." : "has denied wrongdoing."));
  sections.push({ h: "Controversies", paras: [cpp.length ? cpp : ["No significant controversy had been reported."]] });

  // ── Public image ──
  const img = [];
  if (app.length > 2) {
    const peak = app.reduce((b, v, i) => (v > b.v ? { v, i } : b), { v: -1, i: 0 }), low0 = app.reduce((b, v, i) => (v < b.v ? { v, i } : b), { v: 999, i: 0 });
    img.push("According to surveys by the " + st + " Centre for Public Opinion Research, " + surname + "'s approval rating peaked at " + Math.round(peak.v) + "%" + (peak.i ? " in " + yearOf(peak.i) : " shortly after " + his + " inauguration") + " and fell to a low of " + Math.round(low0.v) + "%" + (low0.i ? " in " + yearOf(low0.i) : " early in " + his + " term") + ". ");
    img.push(cite("Polls track " + name + "'s approval", lastT, "Centre for Public Opinion Research"));
    img.push(" ");
  }
  img.push((f.cor || 0) > .5 ? "Perceptions of corruption weighed on " + his + " standing; transparency groups rated the administration poorly. " : (f.cor || 0) < .25 ? "Anti-corruption groups credited " + him + " with running one of the cleaner administrations in the region. " : "");
  if (honours.length) img.push(He + " received " + (honours.length === 1 ? "the honour" : "the honours") + " " + list(honours.map(h => "“" + h.nm + "”")) + ".");
  sections.push({ h: "Public image", paras: [img] });

  // ── Legacy ──
  if (f.ended) {
    const pp = [];
    const n = 7 + (hash(st) % 3), rank = Math.max(1, Math.min(n, Math.round(n - (score / 100) * (n - 1))));
    pp.push("In a " + (f.endYear + 1) + " survey of journalists and political scientists by the Centre for Governance Studies, " + surname + " was ranked " + ordN(rank) + " of the " + n + " governors " + st + " State has had since the return of civilian rule in 1999. ");
    pp.push(cite("Survey ranks " + st + "'s governors since 1999", lastT, "Centre for Governance Studies"));
    pp.push(" ");
    pp.push(f.projects.delivered ? "Supporters pointed to " + num(f.projects.delivered) + " completed " + (f.projects.delivered === 1 ? "project" : "projects") + (f.needs.met ? " and " + num(f.needs.met) + " community " + (f.needs.met === 1 ? "need" : "needs") + " met" : "") + " as " + his + " lasting achievements" : "No capital project was completed on " + his + " watch, which critics regarded as " + his + " chief failing");
    pp.push(f.projects.stalled ? ", while critics noted that " + num(f.projects.stalled) + (f.projects.stalled === 1 ? " project" : " projects") + " stalled or " + (f.projects.stalled === 1 ? "was" : "were") + " abandoned. " : ". ");
    pp.push((f.cor || 0) > .55 ? "After " + he + " left office, the Economic and Financial Crimes Commission questioned " + him + " once " + his + " immunity under Section 308 of the Constitution lapsed." : (f.cor || 0) < .25 ? He + " left office with no corruption case against " + him + "." : "Questions about contracts awarded during " + his + " tenure remained unresolved after " + he + " left office.");
    sections.push({ h: "Legacy", subs: [{ h: "Historical evaluations", paras: [pp] }] });
  }

  // ── The record, in figures ──
  const rec = ["Projects: " + f.projects.delivered + " completed, " + f.projects.building + " under construction" + (f.projects.stalled ? ", " + f.projects.stalled + " stalled or abandoned" : "") + ". "];
  if (f.needs.met + f.needs.failed + f.needs.open) rec.push("Community needs: " + f.needs.met + " met, " + f.needs.failed + " unmet, " + f.needs.open + " outstanding. ");
  rec.push("Debt: " + f.debtTxt + "; internally generated revenue: " + f.igrTxt + " a year. Ministries: " + f.ministries + "; laws signed: " + f.bills + ". Final approval rating: " + appEnd + "%; corruption index: " + Math.round((f.cor || 0) * 100) + "%.");
  sections.push({ h: "The administration in figures", paras: [rec] });

  return { lead, sections, refs };
};
