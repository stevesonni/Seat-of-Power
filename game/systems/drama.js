/* Headlines and calls (pillar "drama"): a front page after each big decision, the godfather on
   the phone once a year, and the life story as five lines to share. Rules only, no React. */
const clean = (t) => String(t || "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/^[^A-Za-z0-9₦“"]+/, "").replace(/[.:]+$/, "").replace(/\s+/g, " ").trim();
const SOFT = /^(not this year|say no|leave it|ignore|stay out|keep him close|let it go|no envelopes|oppose it|go without them|refuse)/i;
/* The headline for a decision: { head, sub, good }. */
export const headlineFor = (state, title, label) => {
  const L = clean(label), st = String(state || "").replace(/_/g, " ").toUpperCase(), soft = SOFT.test(L);
  const head = soft ? st + " GOVERNOR SAYS NO: " + clean(title).toUpperCase() : st + " GOVERNOR: “" + L.toUpperCase() + "”";
  return { head: head.length > 90 ? head.slice(0, 88).replace(/\s+\S*$/, "") + "…”" : head, sub: clean(title), good: !/(borrow|break|steer|pay it quietly|envelope|take all|deliver his)/i.test(L) };
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
