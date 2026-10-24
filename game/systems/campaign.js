/* The Special Adviser's campaign coaching (rules only, no React): every week
   they read the polls, name the zone that decides the race, recommend the
   move that does the most where it matters, and say plainly whether you are
   winning. A player who follows the advice should not be blindsided on
   election night. */

const share = (z) => { const t = (z.support || 0) + (z.opp || 0); return t > 0 ? Math.round(100 * z.support / t) : 50; };
const zname = (z) => String(z.zone || "").replace(" Senatorial", "");

// How much a move lifts your share in one zone (support up, opponent down).
const lift = (m, z) => (m.target === "all" || m.target === z.id) ? (m.your || 0) + Math.max(0, -(m.opp || 0)) * .6 : 0;

/* zones: [{ id, zone, support, opp }]; picks: this week's moves ({ l, target,
   your, opp, pts, cost, answer }); ok(m): affordable. */
export const campaignAdvice = ({ zones = [], week = 1, picks = [], ok = () => true, isOpp = false }) => {
  if (!zones.length) return null;
  const shares = zones.map(share), state = Math.round(shares.reduce((a, v) => a + v, 0) / shares.length);
  const order = zones.map((z, i) => ({ z, s: shares[i] })).sort((a, b) => a.s - b.s);
  const weak = order[0], gap = Math.max(0, 50 - state);
  const usable = picks.filter(m => ok(m) && (m.pts || m.your));
  const score = (m) => lift(m, weak.z) * 1.6 + zones.reduce((a, z) => a + lift(m, z), 0) * .5 + (m.answer ? 4 : 0) + (m.pts || 0) * .3 - (m.cost || 0);
  const best = usable.slice().sort((a, b) => score(b) - score(a))[0] || null;
  const name = best ? best.l.replace(/^\S+\s/, "") : null;
  const where = best && best.target !== "all" && best.target === weak.z.id ? " It goes straight to " + zname(weak.z) + "." : best && best.target === "all" ? " It lifts every zone at once." : "";
  const standing = state >= 53 ? "You lead (" + state + "%)." : state >= 50 ? "You are just ahead (" + state + "%): one bad week and it flips." : "You are behind: " + state + "% to " + (100 - state) + "%.";
  const zoneLine = weak.s < 50 ? " You are losing " + zname(weak.z) + " (" + weak.s + "%); that is where this race is decided." : " Your weakest zone is " + zname(weak.z) + " (" + weak.s + "%).";
  const last = week >= 4 ? (state < 50 ? " This is the last week. Put everything into " + zname(weak.z) + ", or we lose." : " Last week: protect the lead and get our voters out.") : "";
  const ans = best && best.answer ? " They attacked us: answer it, or it sticks." : "";
  return {
    say: (isOpp ? "They have moved. " : "") + standing + zoneLine + last + (best ? " My advice: " + name + "." + where + ans : " We cannot afford a strong move; sit out and save the money."),
    pick: best ? best.l : null, mood: state < 48 ? "worried" : state > 52 ? "pleased" : "neutral", state, weakest: zname(weak.z), behind: gap,
  };
};

/* After the count: why it went the way it did, in one sentence. */
export const electionWhy = (rows = [], won) => {
  const lost = rows.filter(r => !r.won).map(r => ({ z: zname(r), m: Math.round(100 * (r.oppVotes - r.yourVotes) / Math.max(1, r.oppVotes + r.yourVotes)) }));
  if (won) return lost.length ? "You won, but lost " + lost.map(x => x.z).join(" and ") + ": that is where the next election will be fought." : "You carried every zone.";
  const worst = lost.sort((a, b) => b.m - a.m)[0];
  return worst ? "You lost " + worst.z + " by " + worst.m + " points" + (lost.length > 1 ? " and " + (lost.length - 1) + " more zone" + (lost.length > 2 ? "s" : "") : "") + ". The opponent out-organised you there." : "It came down to the last votes.";
};
