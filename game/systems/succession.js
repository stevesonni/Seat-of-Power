/* Your opponent, your deputy and who comes after you (owner, 21 Nov 2026: "my opponent on Tori should actually be the
   person I ran against, and the person I face in the re-election… if I fall out with my deputy or vice, they should
   angle to run against me in the second-term election; if the relationship is not so bad, they should try to succeed
   me, with the party's backing. I may then anoint someone else").

   Rules only, no React. The feud itself is game/systems/rivalry.js; this file reads it.
   Every person here is the player's own fictional cast. */
import { seeded } from "./rng.js";

const OFF = {
  governor: { dep: "Deputy Governor", boss: "Governor", seat: "Government House", primary: "the governorship primary", chair: "the state party chairman", where: "the state" },
  president: { dep: "Vice-President", boss: "President", seat: "Aso Rock", primary: "the presidential primary", chair: "the party's national chairman", where: "the country" },
};
export const bareName = (n) => String(n || "").replace(/^(Hon\.|Chief|Dr\.|Alhaji|Senator|Gov\.|Governor|President|Prof\.)\s+/i, "").trim();

/* Fallen out: the feud has started and did not end in a truce. A deputy you fell out with angles to run against you. */
export const deputyFoe = (R) => !!(R && !R.truce && ((R.step || 0) >= 1 || R.over));

/* Who you face at the re-election. The rival you beat comes back, unless your deputy, after the feud, crosses over to
   their party and takes the ticket. */
export function reelectionOpponent({ R, dep, rival, rivalParty, office = "governor" }) {
  const O = OFF[office] || OFF.governor;
  if (dep && deputyFoe(R)) {
    const rv = bareName(rival) || "the old opposition candidate";
    return { name: dep, party: rivalParty, deputy: true, defected: true,
      line: "Your " + O.dep + ", " + dep + ", has crossed to the " + (rivalParty || "opposition") + " and won its ticket to run against you. " + rv + " stepped aside to back " + (dep.split(" ")[0]) + ".",
      learn: "A deputy is elected on the same ticket and cannot be sacked by the " + O.boss + ". Defecting does not vacate the seat (the courts have said so), so a deputy can sit in the government while campaigning against it." };
  }
  return { name: rival, party: rivalParty, deputy: false, defected: false, line: bareName(rival) ? bareName(rival) + " is back, on the " + (rivalParty || "opposition") + " ticket, for a rematch." : "" };
}

/* Who the opposition on Tori is: the person you beat in the first term, the person you faced in the re-election in the
   second. A deputy who has already defected leads the attack in the run-up to the vote. */
export function toriOpponent({ turn, R, dep, rival, rivalParty, reOpp, reOppParty }) {
  if (turn > 4 && reOpp) return { name: reOpp, party: reOppParty || rivalParty };
  if (turn >= 4 && dep && deputyFoe(R) && R.over) return { name: dep, party: rivalParty, deputy: true };
  return { name: rival, party: rivalParty };
}

/* The succession (second term, deputy still on your side). Three beats:
     Year 6: the deputy moves, with the party chairman behind them.
     Year 7: you back the deputy, or anoint someone else.
     Year 8: if you anointed someone else, the primary decides; the deputy may walk out and run anyway. */
export const succStart = () => ({ step: 0, heir: null, heirName: null, over: false, last: 0, flags: [] });

export function succCard(S, turn, { office = "governor", dep, others = [], R = null, pStab = 50, app = 50, cash = 0 } = {}) {
  if (!dep || turn < 6 || deputyFoe(R)) return null;
  S = S || succStart();
  if (S.over || S.last === turn) return null;
  const O = OFF[office] || OFF.governor, first = dep.split(" ")[0];
  if (S.step === 0) return { id: "move", kicker: "Who comes after you", from: O.dep + " " + dep, t: dep + " wants your seat, with the party behind",
    d: O.chair.charAt(0).toUpperCase() + O.chair.slice(1) + " visits " + O.seat + " at night. The party has made up its mind: " + dep + " should succeed you. Ward leaders are already wearing " + first + "'s caps. They want your blessing.",
    learn: "Nigeria has no rule that the deputy succeeds an outgoing " + O.boss + ". The party's primary picks the candidate, and an outgoing " + O.boss + " with the machine behind them often decides it.",
    opts: [
      { id: "bless", l: "Give " + first + " your blessing now", fx: { pStab: 5 }, heir: "deputy", end: true, say: "The party exhales. " + first + " thanks you in front of the cameras. The succession is settled early, and your last two years are calm." },
      { id: "wait", l: "Say it is too early to talk about succession", fx: { pStab: -1 }, say: "The chairman nods and leaves. Nobody believes you. " + first + "'s posters stay up." },
      { id: "cool", l: "Tell " + first + " privately to stand down the campaign", fx: { pStab: -3 }, flag: "cooled", say: first + " says yes, sir. The posters come down by morning and go back up in the villages." },
    ] };
  if (S.step === 1) {
    const opts = [{ id: "deputy", l: "Back " + first + " for the ticket", fx: { pStab: 4 }, heir: "deputy", end: true, say: "The party closes ranks behind " + first + ". The primary is a coronation." }];
    others.slice(0, 2).forEach(o => opts.push({ id: "anoint_" + o.id, l: "Anoint " + o.name + " (" + o.role + ") instead", fx: { pStab: -6 }, heir: o.id, heirName: o.name, say: "You name " + o.name + " at a stakeholders' meeting. The hall goes quiet. " + first + " walks out before the vote of thanks. The primary is a fight now." }));
    return { id: "anoint", kicker: "Who comes after you", from: O.chair.charAt(0).toUpperCase() + O.chair.slice(1), t: "The anointing",
      d: "Your final years are running out. The party wants to know who you are backing for " + O.primary + ". " + first + " has the structures; you have " + O.seat + ", the money and the last word, if you want to use it.",
      learn: "An outgoing " + O.boss + " anointing a successor is a Nigerian tradition, and a risk: a sitting deputy who is passed over can split the party, or cross to another one, before the primary.", opts };
  }
  if (S.step === 2 && S.heir && S.heir !== "deputy") {
    const r = seeded("succ", dep, S.heirName || "", turn), base = (pStab - 50) / 50 + (app - 50) / 60;
    const win = (extra) => base + extra + (r() - .5) * .4 > 0;
    const push = win(.45), deleg = win(.75), soft = win(.05);
    return { id: "primary", kicker: "Who comes after you", from: O.chair.charAt(0).toUpperCase() + O.chair.slice(1), t: "Primary day: " + S.heirName + " against " + first,
      d: "Delegates arrive in buses. " + first + " has the party structures; " + S.heirName + " has you. How hard will you push?",
      learn: "Party primaries choose candidates through delegates (Electoral Act 2022, Section 84). Money for delegates is the open secret of Nigerian primaries, and the courts hear the disputes that follow.",
      opts: [
        { id: "delegates", l: "Pay the delegates' “transport”", cost: 3, fx: { cor: .02, pStab: -1 }, won: deleg, end: true, say: deleg ? S.heirName + " wins the primary. " + first + " calls it a cash-and-carry and walks out of the party." : "The delegates took your money and voted for " + first + " anyway. " + S.heirName + " concedes before midnight." },
        { id: "push", l: "Work the phones and the local government chairmen", fx: { pStab: -2 }, won: push, end: true, say: push ? S.heirName + " wins on the second ballot. " + first + " says the party has been hijacked." : first + " wins. The structures held. " + S.heirName + " is gracious in defeat; your grip on the party is not what it was." },
        { id: "free", l: "Let the delegates vote freely", fx: { pStab: 2 }, won: soft, end: true, say: soft ? "A free vote, and " + S.heirName + " wins it. Even " + first + "'s people call it fair." : "A free vote, and " + first + " wins it. Your candidate lost, but the party respects how." },
      ] };
  }
  return null;
}

/* After a choice: the next state, and who will succeed you. */
export function succAfter(S, o, turn, dep) {
  S = S || succStart();
  const flags = o.flag ? [...S.flags, o.flag] : S.flags;
  const next = { ...S, step: S.step + 1, last: turn, flags };
  if (o.heir) { next.heir = o.heir; next.heirName = o.heir === "deputy" ? dep : o.heirName; }
  if (o.end) next.over = true;
  if (o.won != null) { next.primary = o.won ? "won" : "lost"; if (!o.won) { next.heir = "deputy"; next.heirName = dep; } else next.depWalked = true; }
  return next;
}

export function succLegacy(S, dep, office = "governor") {
  if (!S || !S.heirName) return null;
  const O = OFF[office] || OFF.governor;
  if (S.heir === "deputy" && !S.primary) return "Handed over to " + O.dep + " " + dep + ", who won the party's ticket with the " + O.boss + "'s blessing.";
  if (S.primary === "won") return "Anointed " + S.heirName + " over " + O.dep + " " + dep + " and won the primary for them; " + dep + " left the party.";
  if (S.primary === "lost") return "Anointed " + S.heirName + " over " + O.dep + " " + dep + ", and lost the primary to the deputy.";
  return null;
}
