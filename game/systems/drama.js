/* Headlines and calls (pillar "drama"): a front page after each big decision, the godfather on
   the phone once a year, and the life story as five lines to share. Rules only, no React. */
/* Headlines (pillar "drama"). A front page is printed only when a choice makes a real headline: a newspaper
   sentence in the third person ("GOV. ADEGOKE PAYS WORKERS"), never the button's words in quotes. Anything that
   would read badly (you, your, him, a colon, a long label, an unknown verb, saying no) gets no front page at all. */
const VERBS = { pay: "pays", fund: "funds", build: "builds", sack: "sacks", fire: "fires", hire: "hires", borrow: "borrows", sign: "signs", approve: "approves", ban: "bans", cut: "cuts", raise: "raises", close: "closes", open: "opens", deploy: "deploys", release: "releases", freeze: "freezes", suspend: "suspends", cancel: "cancels", declare: "declares", launch: "launches", fix: "fixes", repair: "repairs", drill: "drills", reject: "rejects", sell: "sells", buy: "buys", double: "doubles", scrap: "scraps", probe: "probes", investigate: "investigates", impose: "imposes", lift: "lifts", restore: "restores", demolish: "demolishes", relocate: "relocates", subsidise: "subsidises", privatise: "privatises", convene: "convenes", settle: "settles", compensate: "compensates", evacuate: "evacuates", rebuild: "rebuilds", upgrade: "upgrades", equip: "equips", train: "trains", publish: "publishes", audit: "audits", arrest: "arrests", prosecute: "prosecutes", pardon: "pardons", recruit: "recruits", employ: "employs", invest: "invests", expand: "expands", halve: "halves", end: "ends", clear: "clears", commission: "commissions", award: "awards", tender: "tenders", sue: "sues", order: "orders", appoint: "appoints", dissolve: "dissolves", rename: "renames", pave: "paves", electrify: "electrifies", vaccinate: "vaccinates", feed: "feeds", house: "houses", rehabilitate: "rehabilitates", dredge: "dredges", reopen: "reopens", shut: "shuts", seal: "seals", demand: "demands", accept: "accepts", fence: "fences", light: "lights", tar: "tars", nationalise: "nationalises" };
const PRONOUN = /\b(you|your|yours|yourself|him|her|his|hers|them|their|they|it|its|this|that|these|those|i|me|my|we|us|our|he|she|someone|something|anyone|everyone)\b/i;
const SOFT = /^(not this year|not now|say no|no\b|leave it|ignore|stay out|keep\b|let\b|wait|do nothing|go without|refuse|decline|delay|hold off|oppose)/i;
const BAD = /undefined|null|NaN|\{|\}|\[|\]/;
const strip = (t) => String(t || "").replace(/[\u{1F000}-\u{1FFFF}☀-➿️]/gu, "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s*[:–—].*$/, "").replace(/\s*₦[\d.,]+\s*[BMK]?\b/g, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
/* who: "Gov. Adegoke". Returns { head, sub, good } or null when no good headline can be made. */
export const headlineFor = (state, title, label, who) => {
  const L = strip(label);
  // Only one plain action: no second verb ("and", "but", "+", "then"), no secrets the paper could not know, no idioms.
  if (!L || SOFT.test(L) || PRONOUN.test(L) || BAD.test(L) || /[,;+/(₦%]|\b(and|but|or|then|instead|unless|before|after|quietly|secretly|privately|publicly|gratefully|again|both|all|properly|well)\b/i.test(L) || /\b(the price|corners|the sky|the ribbon|force|books)$/i.test(L)
    || /\b(corners|secret|only|who|which|immediately|to bridge|to counter|every book|prior actions|the votes|counter-documentary|at supreme court|polling agents|separately)\b/i.test(L)) return null;
  const words = L.replace(/\s+(now|today|first|at once)$/i, "").split(" "), v = VERBS[words[0].toLowerCase()];
  if (!v || words.length < 3 || words.length > 7) return null;
  const st = String(state || "").replace(/_/g, " ").trim(), subj = (who && String(who).trim()) || (st ? st + " Government" : "");
  if (!subj) return null;
  const head = (subj + " " + v + " " + words.slice(1).join(" ")).toUpperCase();
  const T = strip(title), sub = T && !PRONOUN.test(T) && !BAD.test(T) && T.split(" ").length <= 12 ? T.charAt(0).toUpperCase() + T.slice(1) : "";
  return { head, sub, good: !/(borrow|break|steer|pay it quietly|envelope|take all|deliver his)/i.test(label) };
};
/* Every front page passes through here: no emoji, no stray symbols, no "undefined", no trailing full stops,
   tidy spaces, a sensible length (cut at a word). Returns null when the text is not fit to print. */
export const tidyPaper = (headline, sub) => {
  const fix = (t) => String(t == null ? "" : t).replace(/[\u{1F000}-\u{1FFFF}☀-➿️]/gu, "").replace(/\s+([,.;:!?])/g, "$1").replace(/\b(\w+) \1\b/gi, "$1").replace(/\s+/g, " ").replace(/^[\s·:,-]+|[\s·:,]+$/g, "").trim();
  let h = fix(headline).replace(/([^.]{3})\.$/, "$1"), b = fix(sub).replace(/\.$/, "");
  if (!h || BAD.test(h) || h.length < 8) return null;
  if (BAD.test(b)) b = "";
  // One style for every front page: capitals. Cut long ones at a word, never ending on "in the", "of", "to"…
  if (h.length > 84) { h = h.slice(0, 84).replace(/\s+\S*$/, ""); const k = h.search(/\s(in|on|at|near|from) the\s[^]*$/i); if (k > 30) h = h.slice(0, k); while (/\s(in|the|of|on|to|for|and|a|an|at|with|from|by|–|-)$/i.test(h)) h = h.replace(/\s+\S+$/, ""); }
  h = h.toUpperCase();
  if (b.length > 110) b = b.slice(0, 110).replace(/\s+\S*$/, "") + "…";
  if (b) b = b.charAt(0).toUpperCase() + b.slice(1);
  return { headline: h, sub: b };
};
/* The godfather's call: what he says depends on how things stand between you. */
export const gfCall = (rel = 50, tell = "", turn = 1) => {
  const hour = ["11:48 pm", "1:12 am", "2:14 am", "5:30 am"][turn % 4];
  const line = rel < 30 ? "You think I don't hear what you are doing? Everybody in this state knows who made you. They will soon know who can unmake you."
    : rel > 65 ? "My son, you are doing well. People are talking. Just don't forget the people who stood by you when nobody knew your name."
    : tell + " Come and see me this weekend. Come alone.";
  return { hour, line, mood: rel < 30 ? "angry" : rel > 65 ? "pleased" : "" };
};
/* Five lines that tell the whole story: who, how it went, the best, the worst, the verdict. */
export const storyLines = ({ who, office, years, title, best, worst, end, grade }) => [
  who + ", " + office + ", " + years + ".",
  "Remembered as " + title + ".",
  best ? "Proudest moment: " + best + "." : "Built less than promised.",
  worst ? "Lowest moment: " + worst + "." : "No scandal stuck.",
  end + ". Grade " + grade + ".",
];

/* "Because you…" (pillar "why"): when earlier decisions come due, one card names each decision, the year it
   was made and what it did now. items: [{ from, made, desc, fx }]; made is the turn the decision was taken. */
const FX_WORD = { app: ["People", 1], pStab: ["Party", 1], igr: ["Treasury", 1], revIGR: ["Treasury", 1], cor: ["Corruption", -1], lit: ["Schools", 1], hp: ["Health", 1], agr: ["Farms", 1], infra: ["Roads", 1], debt: ["Debt", -1], taxEff: ["Taxes collected", 1] };
export const fxWords = (fx = {}) => {
  let good = 0; const parts = Object.entries(fx || {}).filter(([k, v]) => FX_WORD[k] && v).map(([k, v]) => { const [nm, sign] = FX_WORD[k]; good += Math.sign(v) * sign; return nm + (v > 0 ? " up" : " down"); });
  return { text: parts.slice(0, 2).join(", "), good: good > 0 ? true : good < 0 ? false : null };
};
export const becauseCard = (items, startYear = 2027) => {
  const L = (items || []).filter(x => x && x.from).slice(0, 4); if (!L.length) return null;
  const rows = L.map(x => { const w = fxWords(x.fx || { revIGR: x.revIGR, debt: x.debt, taxEff: x.taxEff }); return { l: (startYear + (x.made || 1) - 1) + " · You " + x.from, v: w.text || "it came due", good: w.good }; });
  const bad = rows.filter(r => r.good === false).length, good = rows.filter(r => r.good === true).length;
  return { icon: "⏳", kicker: "Because you…", title: L.length === 1 ? String(L[0].desc || "An earlier decision came back").replace(/^[^\w“"]+/, "") : "Earlier decisions came back", text: L.length === 1 ? "This is the result of a choice you made in " + (startYear + (L[0].made || 1) - 1) + "." : "These are the results of choices you made in earlier years.", rows, tone: bad > good ? "bad" : good ? "good" : "neutral" };
};
