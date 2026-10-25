/* The feud with your deputy (rules only, no React). It starts only when the
   governor or President refuses the deputy's demand for appointments, and
   runs one beat a year: the cold war, the impeachment whispers, the primary
   threat, clipped wings, the deputy joining your enemies, the anti-graft
   report, the defection and the vacant-seat fight the courts settle. Any of
   the first beats can end in a truce. The pattern follows real Nigerian
   executive rivalries; every person here is the player's own fictional
   deputy, never a real one. */

const OFF = {
  governor: { dep: "Deputy Governor", boss: "Governor", house: "House of Assembly", party: "the state party", bloc: "the local government chairmen and the party's state executive", s: "Section 188", vacant: "Section 191", primary: "the governorship primary" },
  president: { dep: "Vice-President", boss: "President", house: "National Assembly", party: "the party's national executive", bloc: "a powerful bloc of the party's governors", s: "Section 143", vacant: "Section 146", primary: "the presidential primary" },
};

export const RIVALRY_LEARN = {
  impeach: "Only the legislature can remove a governor or President: a notice signed by a third of its members, a two-thirds vote to investigate, a panel, then a two-thirds vote to remove (Sections 143 and 188).",
  deputy: "A deputy governor or Vice-President is elected on the same ticket, not appointed. The governor or President can give or take away duties, staff and budget, but cannot sack them.",
  vacant: "A deputy's seat falls vacant only by death, resignation, permanent incapacity or removal by impeachment (Sections 146 and 191). Defecting to another party is not on the list; the Supreme Court has said so.",
};

// The beats, in order. {D} is the deputy's name; each option has fx (app, pStab, cor), cost (₦B), heat, and a front page.
const BEATS = (O) => [
  { id: "whispers", t: "Whispers of impeachment", learn: "impeach",
    d: "Members of the " + O.house + " are gathering signatures to impeach you over alleged breaches of the constitution. Your allies say the " + O.dep + ", {D}, is quietly backing them.",
    opts: [{ id: "confront", l: "Confront {D} in private", fx: { pStab: -1 }, heat: 1, paper: ["CRACKS IN THE EXECUTIVE", "The " + O.boss + " and the " + O.dep + " meet behind closed doors", false], say: "{D} denied everything. Nobody in the room believed it." },
      { id: "truce", l: "Make peace: give {D} the appointments after all", fx: { pStab: 3, cor: .01 }, truce: true, paper: ["TRUCE IN THE EXECUTIVE", "The " + O.boss + " hands the " + O.dep + "'s men two seats", true], say: "{D} smiles for the cameras. The impeachment papers go quiet." },
      { id: "house", l: "Win the members over yourself", cost: 4, fx: { pStab: 1 }, heat: 1, paper: ["IMPEACHMENT MOVE COLLAPSES", "Members withdraw their signatures", true], say: "The signatures are gone. So is any trust between you and {D}." }] },
  { id: "primary", t: "The " + O.dep + " eyes your ticket", learn: "deputy",
    d: O.bloc.charAt(0).toUpperCase() + O.bloc.slice(1) + " urge {D} to run against you in " + O.primary + ". {D} hesitates, and names a price for standing aside.",
    opts: [{ id: "kneel", l: "Pay the price: concede {D}'s terms", fx: { app: -1, pStab: 4 }, heat: 2, flag: "kneeled", paper: ["THE " + O.boss.toUpperCase() + " BENDS", "A deal with the " + O.dep + " secures the ticket", false], say: "You have the ticket. You also know who gave it to you, and you will not forget it." },
      { id: "bluff", l: "Call the bluff", fx: { pStab: -5 }, heat: 1, paper: ["“LET HIM RUN”", "The " + O.boss + " dares the " + O.dep + " to try", false], say: "{D} did not run. The party saw how close it came." },
      { id: "truce", l: "Share the stage: make {D} campaign director-general", fx: { pStab: 2 }, truce: true, paper: ["ONE TICKET, ONE VOICE", "The " + O.dep + " will lead the campaign", true], say: "{D} takes the job. The bloc stands down." }] },
  { id: "wings", t: "Clip the " + O.dep + "'s wings?", learn: "deputy",
    d: "Your people want {D}'s duties cut: the economic team taken away, aides sacked, the office budget halved.",
    opts: [{ id: "strip", l: "Strip the duties, sack the aides, cut the budget", cost: -2, fx: { pStab: -2 }, heat: 2, flag: "stripped", paper: ["" + O.dep.toUpperCase() + " STRIPPED OF DUTIES", "Aides sacked; the office budget halved", false], say: "{D}'s office is a shell now. {D} is not finished." },
      { id: "watch", l: "Leave the office alone, but watch it", fx: {}, heat: 0, paper: ["AN UNEASY CALM IN THE EXECUTIVE", "The " + O.dep + " keeps the job and the staff", true], say: "Calm, for now." },
      { id: "truce", l: "Reconcile in public", fx: { app: 1, pStab: 2 }, truce: true, paper: ["“WE ARE ONE”", "The " + O.boss + " and the " + O.dep + " embrace", true], say: "The handshake was long and the smiles were wide." }] },
  { id: "coalition", t: "The " + O.dep + " joins your enemies", learn: "deputy",
    d: "{D} is funding the opposition to your flagship bill in the " + O.house + ", with civil society and dissident members.",
    opts: [{ id: "push", l: "Push the bill through anyway", cost: 6, fx: { pStab: -2 }, heat: 1, paper: ["BILL SCRAPES THROUGH", "Despite the " + O.dep + "'s campaign against it", true], say: "It passed. The bill is weaker; so is the party." },
      { id: "drop", l: "Drop the bill", fx: { app: -2 }, heat: 0, flag: "lostBill", paper: ["" + O.dep.toUpperCase() + " DEFEATS THE " + O.boss.toUpperCase() + "'S BILL", "A victory for the dissidents", false], say: "{D} is celebrating in public." }] },
  { id: "report", t: "An anti-graft report on the " + O.dep, learn: "deputy",
    d: "The EFCC has a report: a development fund under {D}'s supervision moved money into private companies. It is on your desk.",
    opts: [{ id: "release", l: "Release it: declare {D} unfit for office", fx: { app: 1, pStab: -2 }, heat: 2, flag: "released", paper: ["EFCC REPORT INDICTS THE " + O.dep.toUpperCase(), "The " + O.boss + " calls the " + O.dep + " unfit", false], say: "The report is out. {D} calls it a political hatchet job." },
      { id: "sit", l: "Sit on it", fx: { cor: .01 }, heat: 0, paper: ["WHAT IS IN THE EFCC REPORT?", "The " + O.boss + " stays silent", false], say: "Silence, for now. Reports like that never stay buried." }] },
  { id: "defect", t: "The " + O.dep + " defects to the opposition", learn: "vacant",
    d: "{D} has joined the opposition to run for your office. Your lawyers say the seat is now vacant; the constitution says otherwise.",
    opts: [{ id: "vacant", l: "Declare the seat vacant; withdraw {D}'s security and staff", fx: { app: -3, pStab: 1 }, flag: "court", end: true, paper: ["SUPREME COURT: " + O.boss.toUpperCase() + " CANNOT SACK THE " + O.dep.toUpperCase(), "The seat was never vacant; the " + O.dep + " stays, and may run", false], say: "We lost in court. {D} stays, and runs against us." },
      { id: "let", l: "Let {D} go: only impeachment removes a " + O.dep, fx: { app: 1 }, end: true, paper: ["“THE CONSTITUTION DECIDES, NOT ME”", "The " + O.boss + " lets the defector keep the seat", true], say: "{D} will run against us. Let the voters decide." }] },
];

export const rivalryStart = (turn) => ({ start: turn, step: 0, heat: 1, over: false, flags: [] });

/* This year's beat, or null. One a year from the year after the refusal;
   it ends at a truce, after the defection, or when the beats run out. */
export const rivalryCard = (R, turn, { office = "governor", dep = "the deputy" } = {}) => {
  if (!R || R.over || turn <= R.start || R.last === turn) return null;
  const O = OFF[office] || OFF.governor, B = BEATS(O)[R.step];
  if (!B) return null;
  const fill = (x) => String(x).replace(/\{D\}/g, dep);
  return { ...B, kicker: "The feud with your " + O.dep, t: fill(B.t), d: fill(B.d), learnText: RIVALRY_LEARN[B.learn],
    opts: B.opts.map(o => ({ ...o, l: fill(o.l), say: fill(o.say) })) };
};
export const rivalryAfter = (R, o, turn) => {
  const step = R.step + 1, flags = o.flag ? [...R.flags, o.flag] : R.flags;
  return { ...R, step, last: turn, heat: R.heat + (o.heat || 0), flags, over: !!(o.truce || o.end) || step >= 6, truce: !!o.truce };
};
export const rivalryLegacy = (R, dep, office = "governor") => {
  if (!R) return null;
  const O = OFF[office] || OFF.governor;
  if (R.truce) return "Fell out with " + O.dep + " " + dep + " over appointments, then made peace.";
  if (R.flags.includes("court")) return "Fell out bitterly with " + O.dep + " " + dep + ": stripped their duties, then tried to declare their seat vacant when they defected, and lost at the Supreme Court.";
  if (R.over) return "Fell out bitterly with " + O.dep + " " + dep + ", who defected to the opposition to run against the administration.";
  return "Fell out with " + O.dep + " " + dep + " over appointments; the feud was unresolved when the term ended.";
};
