/* The President's National Assembly, two chambers (owner, 25 Nov 2026: "for the presidency, the same potential crisis,
   except the President deals with the House and the Senate separately… they will elect a Senate President and a House
   of Reps Speaker"). Rules only, no React.

   Each chamber elects its presiding officer at the start of each term (the record of the first term shapes the
   second race, as for a governor: legislature.js houseKind and speakerRace2). A hostile presiding officer blocks the
   budget and new programmes until his price is met that year. Removing the President (Section 143) needs BOTH
   chambers: when both are hostile and the President's approval dips, the Assembly moves to impeach; one hostile
   chamber alone can only shout. Once a term, members may plot to remove a friendly presiding officer, and a failed
   court order can leave a chamber with two. All people are fictional. */

export const CHAMBERS = {
  sen: { nm: "the Senate", Nm: "The Senate", seats: 109, title: "Senate President", art: "senate-president", bg: "senate-chamber", members: "senators" },
  reps: { nm: "the House of Representatives", Nm: "The House of Representatives", seats: 360, title: "Speaker of the House", art: "speaker-of-the-house", bg: "national-assembly-exterior", members: "members" },
};
export const CHAMBER_IDS = ["sen", "reps"];

/* How many in a chamber are with the President: the Assembly's overall lean (ratio, from stc.house), moved by the
   chamber's own bias (a hostile presiding officer takes his chamber below half). */
export const chamberLoyal = (ch, ratio = .55, bias = 0) => { const S = CHAMBERS[ch].seats; return Math.max(0, Math.min(S, Math.round(S * Math.max(.15, Math.min(.9, ratio + bias))))); };
export const chamberMajority = (ch, ratio, bias) => chamberLoyal(ch, ratio, bias) > CHAMBERS[ch].seats / 2;
// The bias that puts a chamber just below half (a hostile presiding officer) or just above it (a deal or a friend).
export const biasFor = (ratio, want) => Math.round(((want === "lost" ? .45 : .55) - ratio) * 1000) / 1000;

/* Which chamber blocks new spending this year: a hostile presiding officer with no deal, or a chamber with two
   presiding officers. N: stc.nass. */
export const nassBlocks = (N, turn) => CHAMBER_IDS.find(ch => { const C = (N || {})[ch]; const L = C && C.leader; return !!(L && (L.split || (L.hostile && turn > (L.at || 0) && (C.deal !== turn)))); }) || null;

/* Section 143: both chambers. The Assembly moves to impeach at the slightest dip in approval when both presiding
   officers are hostile and neither was paid this year. One hostile chamber gives a warning only. */
export const nassHostile = (N, turn) => CHAMBER_IDS.filter(ch => { const C = (N || {})[ch]; return C && C.leader && C.leader.hostile && C.deal !== turn; });
export const nassImpeaches = (N, turn, { app, appMark }) => nassHostile(N, turn).length === 2 && appMark != null && app < appMark && app < 62;
