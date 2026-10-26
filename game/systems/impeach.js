/* The President's impeachment (Section 143): not a random game over but a fight
   the President's own record starts.

   1. A trigger opens a Senate investigation ("SENATE LAUNCHES INVESTIGATION
      INTO THE PRESIDENT"): grand corruption with a Senate you have crossed;
      the country paralysed (a general strike that has climbed, or a security
      front out of control); defying the courts or the Assembly; or a
      collapse of public and party support.
   2. The indictment vote: 50% to start. Sacrificing a minister brings it to
      20%; bribing the panel to 0%, but a whistleblower may surface next year;
      standing your ground keeps 50%, and clearance makes you stronger.
   3. Indicted: the Senate tribunal sits and nothing new starts. Three ways
      out: a deal with the opposition (acquitted, but they take the ports:
      customs and export revenue halved for good), the Attorney-General's
      defence (as good as the Attorney-General you appointed), or sealing the
      National Assembly with the Presidential Guard (it works only if the
      army is with you; if not, the army removes you).
   Rules only, no React. */

export const IMPEACH_TRIGGERS = {
  graft: { nm: "Grand corruption", charge: "gross misconduct: public money stolen on a grand scale, and favours refused to the Senate's own committees",
    when: (c) => c.cor >= .5 && c.nass < 35 },
  anarchy: { nm: "A paralysed nation", charge: "failure to govern: the country shut by a strike the government would not settle, or overrun by armed gangs while it looked away",
    when: (c) => (c.strikeStage >= 2 && c.strikeYears >= 1) || c.worstFront >= 85 },
  defiance: { nm: "Defying the courts and the Assembly", charge: "violation of the Constitution: orders of the courts and resolutions of the National Assembly defied",
    when: (c) => !!c.defied },
  collapse: { nm: "The party walks away", charge: "gross misconduct, signed by members of the President's own party who no longer defend him",
    when: (c) => c.app < 30 && c.pStab < 40 },
};
const ORDER = ["defiance", "graft", "anarchy", "collapse"];

/* Is there a case this year? I: stc.impeach ({ last, active, whistle }).
   Not while one is running, and not within three years of the last. A
   whistleblower (after a bribe) forces a case with the "exposed" trigger. */
export const impeachCheck = (ctx, I = {}) => {
  if (I.active) return null;
  if (I.whistle != null && I.whistle <= ctx.turn && I.exposed) return "exposed";
  if (I.last != null && ctx.turn - I.last < 3) return null;
  return ORDER.find(k => IMPEACH_TRIGGERS[k].when(ctx)) || null;
};
export const EXPOSED = { nm: "The bribe comes out", charge: "bribery of the Senate's investigating panel, on a whistleblower's evidence" };
export const triggerOf = (id) => IMPEACH_TRIGGERS[id] || (id === "exposed" ? EXPOSED : null);

// The indictment vote, by what you did before it.
export const INDICT_ODDS = { scapegoat: .2, bribe: 0, stand: .5, exposed: .7 };
export const indictRoll = (choice, r = Math.random) => r() < (INDICT_ODDS[choice] ?? .5);

/* The tribunal. ctx: { ag: { perf } | null, army (0–100) }.
   Returns { acquit, how, fx, ports?, emergency?, coup?, hero? }. */
export const tribunalOutcome = (choice, ctx = {}, r = Math.random) => {
  if (choice === "deal") return { acquit: true, how: "deal", ports: true, fx: { app: -3, cor: .05 }, nass: 20 };
  if (choice === "defence") {
    const perf = ctx.ag ? ctx.ag.perf || 50 : 0, p = !ctx.ag ? .1 : perf >= 75 ? .9 : perf >= 55 ? .55 : .25;
    const acquit = r() < p;
    return { acquit, how: "defence", p, hero: acquit, fx: acquit ? { app: 8 } : {}, nass: acquit ? -10 : 0 };
  }
  if (choice === "guard") {
    const loyal = (ctx.army || 0) >= 65;
    return loyal ? { acquit: true, how: "guard", emergency: true, fx: { app: -8, cor: .05 }, nass: -60 } : { acquit: false, how: "guard", coup: true, fx: {} };
  }
  return { acquit: false, how: choice, fx: {} };
};
// The odds the Attorney-General carries into the tribunal (for the option's note).
export const defenceOdds = (ag) => !ag ? .1 : (ag.perf || 50) >= 75 ? .9 : (ag.perf || 50) >= 55 ? .55 : .25;
