/* Scenarios that deliver what they promise (owner, October 2026).
   Each scenario is a logjam, not just a lower number:
   - Day One: the person at the heart of the crisis walks in before the
     budget, and only the Governor can answer.
   - The logjam: a goal on the Desk, with a deadline.
   - Or else: when the deadline passes with the logjam unbroken, the threat
     lands (an impeachment motion, a general strike, the economy's collapse),
     unless the Governor holds an uno card: something earned (approval, the
     traditional rulers, a strong minister, standing with Abuja) that saves them.
   Rules only, no React.

   ctx (the game fills it): { turn, app, pStab, cor, rulers, fg, house: { seats, loyal },
     arrears, peace: { step, closed }, sitClosed, flags (stc.scen.flags), base (stats at the
     start), sec, hp, infra, agr, igr, reforms, petition, agPerf, worksPerf, healthPerf } */

// A Day One option: { id, l, note, fx, costPct (of a year's revenue), house (members),
//   arrears (months paid), fg, igrPct, set (flags), roll: { p, ok, bad }, say }
const opt = (id, l, note, more = {}) => ({ id, l, note, ...more });

export const SCENARIO_RULES = {
  hostile_house: {
    day1: { who: "speaker-angry", bg: "assembly-chamber", by: "The Speaker of the House", role: "Leader of the opposition majority",
      // The Speaker comes after the Governor has named the commissioners, not before.
      after: "ministries",
      title: "The House will not work with you",
      says: "Your Excellency, the House has rejected every commissioner you just named. And the budget does not move until you drop the promise you campaigned on.",
      options: [
        opt("deal", "Cut a deal with the Speaker", "Committee chairs and constituency projects for his members.", { costPct: .05, fx: { cor: .03 }, house: 4, say: "The Speaker smiles. Four of his members are suddenly 'open to working with the Executive'." }),
        opt("carpet", "Bring opposition members across the carpet", "Money, quietly, member by member. If it leaks, it is on every front page.", { costPct: .08, house: 3, roll: { p: .7, ok: { say: "Three members cross to your party at a rally." }, bad: { fx: { app: -5, cor: .03 }, say: "Three members cross, and a bank alert leaks to the press." } } }),
        opt("people", "Go over their heads to the people", "Town halls in every member's ward. Slow, but it costs no money.", { fx: { app: 3 }, house: 1, say: "The wards are listening. One member has already changed his tune." }),
        opt("drop", "Drop your campaign promise", "The House lets your commissioners through. The voters remember.", { fx: { app: -6 }, house: 5, set: { dropped: true }, say: "The House confirms your commissioners the same afternoon. Your supporters feel betrayed." }),
      ] },
    goal: { label: "a majority in the House", met: (c) => c.house && c.house.loyal >= Math.ceil(c.house.seats / 2), progress: (c) => (c.house ? c.house.loyal + " of " + c.house.seats + " members with you · you need " + Math.ceil(c.house.seats / 2) : "") },
    deadline: 2, threat: { t: "The House moves to impeach you", text: "The opposition majority has filed an impeachment motion: gross misconduct, they say, for running the state without the House.", paper: ["HOUSE MOVES TO IMPEACH GOVERNOR", "The opposition majority files a motion of gross misconduct"] },
    warn: { turn: 1, text: "The opposition is counting votes. Without a majority by the middle of next year, they will move to impeach you." },
    doom: { kind: "impeach" },
    uno: [
      { id: "app", l: "Approval of 60% or more: crowds outside the House", ok: (c) => c.app >= 60, say: "Crowds fill the streets around the House. Members up for re-election lose their nerve; the motion fails." },
      { id: "rulers", l: "The traditional rulers at 70% or more behind you", ok: (c) => c.rulers >= 70, say: "The rulers summon the Speaker to the palace. The motion is withdrawn the next morning." },
      { id: "court", l: "A strong Attorney-General (performance 70+): an injunction", ok: (c) => c.agPerf >= 70, say: "The Chief Judge halts the panel: the House skipped the steps the Constitution sets out." },
    ] },

  godfather_candidate: {
    day1: { who: "godfather", bg: "governor-office", by: "Your godfather", role: "He paid for everything",
      title: "A black Mercedes in the courtyard",
      says: "My boy, congratulations. Here is the contract for the state road rehabilitation. My company gets it, and the mobilisation fee is paid this month. I expect it signed before sunset.",
      options: [
        opt("sign", "Sign it", "He is happy. Your Commissioner of Works threatens to resign: his company cannot build.", { costPct: .18, fx: { cor: .06, pStab: 4 }, set: { gf: "signed" }, say: "He leaves smiling. The road will be his, and so will you." }),
        opt("bond", "A smaller contract, with a performance bond", "He gets something; the state gets a guarantee. He will not forget the haggling.", { costPct: .08, fx: { cor: .02 }, set: { gf: "bond" }, say: "He takes it, without a smile. 'We will talk again,' he says." }),
        opt("refuse", "Refuse", "Your signature is yours. He will make you pay for it.", { fx: { app: 3, pStab: -6 }, set: { gf: "refused" }, say: "He smiles, says nothing and walks out. That smile is the problem." }),
        opt("expose", "Refuse, and hand his file to the EFCC", "If they move, he falls. If they do not, it is war.", { fx: { pStab: -8 }, roll: { p: .45, ok: { set: { gf: "freed", freed: true }, fx: { app: 8 }, say: "The EFCC invites him the next week. His machine scatters: you are free." }, bad: { set: { gf: "refused" }, say: "The EFCC sits on the file. He knows who sent it." } } }),
      ] },
    goal: { label: "free of the godfather", met: (c) => !!c.flags.freed, progress: (c) => c.flags.freed ? "Free" : c.flags.gf === "signed" ? "He owns your signature" : c.flags.gf === "bond" ? "He is waiting" : "He is at war with you" },
    deadline: (c) => c.flags.gf === "signed" ? 4 : c.flags.gf === "bond" ? 3 : 2,
    threat: { t: "The godfather moves against you", text: "He has turned the House and the party against you: an impeachment motion in the House, and his own man for your ticket.", paper: ["GODFATHER'S LOYALISTS MOVE AGAINST GOVERNOR", "An impeachment motion, and a rival for the party ticket"] },
    warn: { turn: 1, text: "His men are visiting Assembly members at night. Pay him off, break him, or be loved enough that nobody dares." },
    doom: { kind: "impeach" },
    uno: [
      { id: "popular", l: "Approval of 60% and the traditional rulers at 70%", ok: (c) => c.app >= 60 && c.rulers >= 70, say: "The party will not drop a governor the palaces and the streets love. His men go quiet." },
      { id: "clean", l: "Clean hands (corruption under 25%): the EFCC takes your side", ok: (c) => c.cor < .25, say: "With nothing on you, his file against you is empty. The EFCC turns to his." },
    ],
    actions: [{ id: "payoff", l: "Pay off his campaign money from the treasury", costPct: .15, set: { freed: true }, say: "His money is returned with interest. He has no claim on you now." }] },

  broke: {
    day1: { who: "nlc-president-angry", bg: "governor-office", by: "The NLC state chairman", role: "Nigeria Labour Congress",
      title: "The unions walk into your office",
      says: "Governor, welcome. Our workers have not been paid for ninety days. The hospitals, the waterworks and the civil service stop in twenty-four hours, unless you pay one month of arrears today.",
      options: [
        opt("bank", "A loan from a commercial bank, at 30%", "Pays one month today. The interest eats your future budgets.", { arrears: 1, debtPct: .25, debtMul: 1.3, say: "The bank pays the workers by noon. You will pay the bank for years." }),
        opt("faac", "An advance on next year's FAAC from Abuja", "One month today; next year's allocation comes in lighter.", { needFg: 50, arrears: 1, faacPct: -.1, say: "Abuja advances the money. Next year's FAAC will be ten percent short." }),
        opt("audit", "A ghost-worker audit first", "Pay the real workers: the unions back you against the ghosts.", { arrears: 1, fx: { cor: -.02, pStab: -3 }, set: { audit: true }, say: "Two thousand ghosts fall off the payroll. The money pays the living." }),
        opt("strike", "Let them strike", "The bank is empty. You cannot pay what you do not have.", { fx: { app: -6, hp: -.02 }, set: { strike: true }, say: "The hospitals close their gates. Every project stops this year." }),
      ] },
    goal: { label: "the arrears cleared", met: (c) => (c.arrears || 0) === 0, progress: (c) => (c.arrears || 0) + " month" + ((c.arrears || 0) === 1 ? "" : "s") + " of salaries owed" },
    deadline: 2, threat: { t: "A general strike", text: "The NLC has called an indefinite general strike: hospitals, water, schools and every site. The House calls it a failure to govern.", paper: ["NLC DECLARES INDEFINITE GENERAL STRIKE", "Hospitals, water and schools shut across the state"] },
    warn: { turn: 1, text: "The unions have given you until the end of next year. Clear the arrears, or they shut the state." },
    doom: { kind: "fx", fx: { app: -12, pStab: -8, hp: -.03 }, halt: true, then: "impeach" },
    uno: [
      { id: "plan", l: "At most one month owed, with a published plan", ok: (c) => (c.arrears || 0) <= 1, say: "You paid most of it and published the rest. The unions accept a timetable." },
      { id: "audit", l: "The ghost-worker audit done: the unions are with you", ok: (c) => !!c.flags.audit, say: "The unions stand with the Governor who cleared the ghosts. The strike is called off." },
      { id: "app", l: "Approval of 55% or more: the public is on your side", ok: (c) => c.app >= 55, say: "The public blames the last government. The strike collapses in a week." },
    ] },

  school_abduction: {
    day1: { who: "dss-director-general", bg: "governor-office", scene: "news-protest", by: "The State Director of the DSS", role: "Department of State Services",
      title: "A ransom note",
      says: "Sir, the bandits holding the 150 pupils want ₦500 million. The parents are at the gates of Government House, with television cameras.",
      options: [
        opt("pay", "Pay, quietly", "The children come home. The bandits are richer, and the army stops trusting your state.", { cost: .5, fg: -8, fx: { sec: -.04, app: 4 }, set: { children: "home", paid: true }, say: "The children are home by Friday. Somewhere, the bandits are buying guns." }),
        opt("talk", "Negotiate through the clerics and the traditional rulers", "Slower. The children come home in groups, if the rulers trust you.", { fx: { app: 1 }, set: { children: "talks" }, say: "The emir and the bishop go into the forest together. It will take months." }),
        opt("raid", "A rescue raid", "All or nothing. Success makes you a hero; a funeral ends careers.", { roll: { p: .55, ok: { set: { children: "home" }, fx: { app: 12, sec: .03 }, say: "All 150 are home. The soldiers are carried shoulder-high." }, bad: { set: { children: "home", tragedy: true }, fx: { app: -18, pStab: -6 }, say: "Most of them are home. Eleven are not. The funerals are on every channel." } } }),
        opt("abuja", "Ask Abuja for special forces", "Better odds if Abuja likes you.", { rollFg: true, roll: { p: .45, ok: { set: { children: "home" }, fx: { app: 8 }, fg: 4, say: "Special forces bring every child home. The President takes some of the credit." }, bad: { set: { children: "talks" }, fx: { app: -4 }, say: "The special forces arrive late; the bandits moved the children. Talks are all that is left." } } }),
      ] },
    goal: { label: "the children home", met: (c) => c.flags.children === "home", progress: (c) => c.flags.children === "home" ? "Home" : c.flags.children === "talks" ? "Talks under way" : "Still held" },
    deadline: 2, threat: { t: "A vote of no confidence", text: "A video of the children has been released. The parents march every week, and the House moves against you.", paper: ["HOUSE MOVES AGAINST GOVERNOR OVER ABDUCTED PUPILS", "The parents' march reaches the Assembly"] },
    warn: { turn: 1, text: "Every month the children are not home costs you. The House is watching the parents' march.", fx: { app: -6 } },
    doom: { kind: "impeach" },
    uno: [
      { id: "app", l: "Approval of 60% or more", ok: (c) => c.app >= 60, say: "The public still trusts you to bring them home. The motion fails." },
      { id: "rulers", l: "The traditional rulers at 70% or more broker their release", ok: (c) => c.rulers >= 70, say: "The rulers bring the last children home themselves. The House withdraws." },
    ],
    // Talks bring the children home in time; better with the rulers behind you.
    talks: (c) => c.rulers >= 60 ? .8 : .45 },

  sit_at_home: {
    day1: { who: "commerce-commissioner", bg: "governor-office", scene: "news-protest", by: "The Commissioner for Commerce", role: "Monday morning",
      title: "The markets are ghost towns",
      says: "Sir, the markets in the capital are empty. Enforcers burned three shops last night to make sure nobody opens on Monday.",
      options: [
        opt("force", "Order the police to open the markets", "Some shops open. The traders say you are risking their lives.", { fx: { app: -5, sec: .02 }, igrPct: .05, say: "Shops open under guard. Two traders are beaten that night." }),
        opt("elders", "Work with the elders and the church, and start a plan to end it", "The slow road: a four-year plan to make the state safe.", { fx: { app: 2 }, set: { peace: true }, say: "The elders agree to sit with you. The plan starts next year." }),
        opt("markets", "Pay traders to trade on Mondays", "A Monday market fund. It costs money and brings some of the revenue back.", { costPct: .04, igrPct: .1, say: "Some stalls open with the fund. Revenue comes back, a little." }),
        opt("quiet", "Ask Abuja to handle the separatists quietly", "Abuja likes the deference. The traders see nothing change.", { fg: 5, fx: { app: -2 }, say: "Abuja promises 'measures'. Monday is still Monday." }),
      ] },
    goal: { label: "the sit-at-home lifted", met: (c) => !!c.sitClosed || (c.peace && c.peace.step >= 2), progress: (c) => c.sitClosed ? "Lifted" : c.peace ? "Your plan: step " + Math.min(4, (c.peace.step || 0) + 1) + " of 4" : "Every Monday lost" },
    deadline: 3, threat: { t: "The economy breaks, and the army arrives", text: "Banks and big employers are leaving the state, and Abuja has sent in the army over your head.", paper: ["BANKS PULL OUT AS SIT-AT-HOME GRINDS ON", "Abuja deploys troops; the Governor was not consulted"] },
    warn: { turn: 2, text: "Banks are talking about moving out. Lift the sit-at-home by next year, or the state's economy breaks." },
    doom: { kind: "fx", fx: { app: -6 }, igrPct: -.15, fg: -10 },
    uno: [
      { id: "fg", l: "Standing with Abuja of 65 or more: the army comes in under your command", ok: (c) => c.fg >= 65, say: "The troops report to you, not over your head. The enforcers melt away." },
      { id: "app", l: "Approval of 60% or more", ok: (c) => c.app >= 60, say: "The people defy the enforcers together. The markets reopen." },
    ] },

  bandit_corridor: {
    day1: { who: "traditional-ruler-emir", bg: "governor-office", by: "The Emir", role: "A letter from the villages",
      title: "A harvest tax from the bandits",
      says: "Your Excellency, the bandits have written to forty villages: pay twenty million naira, or no one harvests. The farmers ask what their Governor will do.",
      options: [
        opt("pay", "Let the villages pay", "The harvest comes in. The bandits are richer every season.", { fx: { cor: .02, sec: -.03, agr: .02 }, say: "The harvest is saved. The bandits buy motorcycles." }),
        opt("vigilantes", "Arm community guards", "Locals know the forest. They also settle their own scores.", { costPct: .02, fx: { sec: .02 }, say: "The guards drive the bandits back from three villages." }),
        opt("troops", "Demand federal troops", "A battalion arrives, late, and leaves early.", { fg: -2, fx: { sec: .01 }, say: "The troops arrive after the harvest." }),
        opt("plan", "Start a plan to end it for good", "A four-year plan: an outfit, community policing, jobs, peace committees.", { costPct: .01, set: { peace: true }, say: "The plan starts next year. The villages will hold you to it." }),
      ] },
    goal: { label: "the highways safe", met: (c) => (c.peace && c.peace.step >= 2) || c.sec >= .55, progress: (c) => c.peace ? "Your plan: step " + Math.min(4, (c.peace.step || 0) + 1) + " of 4" : "Security " + Math.round(c.sec * 100) + "% · needs 55%" },
    deadline: 2, threat: { t: "The food runs out", text: "The farms are empty. Food prices have doubled, and they will not come down while the bandits hold the roads.", paper: ["FOOD PRICES DOUBLE AS FARMERS FLEE", "The bandits hold the highways"] },
    warn: { turn: 1, text: "Farmers are leaving. Make the highways safe by next year, or the food runs out." },
    doom: { kind: "fx", fx: { agr: -.06, app: -6 }, repeat: true },
    uno: [{ id: "rulers", l: "The traditional rulers at 70% or more lead peace talks", ok: (c) => c.rulers >= 70, say: "The emirs bring the bandit leaders to the table. The highways open.", fx: { sec: .04 } }] },

  flood: {
    day1: { who: "commissioner-male-suit-worried", bg: "governor-office", scene: "flood", by: "The Commissioner for Works", role: "The rivers are still rising",
      title: "Forty thousand people in camps",
      says: "Sir, the embankments failed in three local governments. Forty thousand people are in school buildings and churches. The next rains come in nine months.",
      options: [
        opt("embank", "Rebuild the embankments properly", "Expensive. The next flood stops at the wall.", { costPct: .1, fx: { infra: .04 }, set: { embank: true }, say: "The engineers start this week. It will be ready before the rains." }),
        opt("camps", "Proper camps and relocation to higher ground", "Families safe; the river is still there.", { costPct: .05, fx: { app: 3, hp: .01 }, say: "Families move to new camps on high ground." }),
        opt("abuja", "Wait for NEMA and Abuja", "Federal money, if it comes.", { fg: 2, fx: { app: -3 }, say: "NEMA promises relief materials. The families wait." }),
        opt("ngo", "Leave it to the churches and NGOs", "Free. The families notice.", { fx: { app: -5 }, say: "The churches feed them. The families remember who did not." }),
      ] },
    goal: { label: "ready for the next rains", met: (c) => !!c.flags.embank || c.infra >= (c.base.infra || 0) + .06, progress: (c) => c.flags.embank ? "Embankments rebuilt" : "Infrastructure " + Math.round(c.infra * 100) + "% · needs " + Math.round(((c.base.infra || 0) + .06) * 100) + "%" },
    deadline: 2, threat: { t: "The second flood", text: "The rains came back, and the river with them. The camps are flooded too.", paper: ["SECOND FLOOD SWEEPS THE STATE", "The embankments were never rebuilt"] },
    warn: { turn: 1, text: "The rains return next year. Rebuild the embankments or raise the roads before then." },
    doom: { kind: "fx", fx: { infra: -.06, app: -8, agr: -.03 } },
    uno: [{ id: "works", l: "A strong Commissioner for Works (performance 70+)", ok: (c) => c.worksPerf >= 70, say: "Your Works team had sandbags and pumps ready. The damage is half what it was." }] },

  cholera: {
    day1: { who: "health-worker", bg: "governor-office", by: "The Commissioner for Health", role: "The case count",
      title: "Four hundred cases, and rising",
      says: "Sir, four hundred cases this week and thirty deaths. The wells in two local governments are poisoned. Every day we wait, it doubles.",
      options: [
        opt("isolate", "Isolation centres and free treatment", "Costly and right.", { costPct: .05, fx: { hp: .03, app: 3 }, set: { contained: true }, say: "The centres open in three days. The curve bends." }),
        opt("water", "Clean water first: tankers and new boreholes", "Stops the source; the sick still need beds.", { costPct: .06, fx: { infra: .02, hp: .02 }, set: { contained: true }, say: "Tankers in every ward by the weekend." }),
        opt("ncdc", "Call the NCDC and the WHO", "Federal and international help; the press will know.", { fg: 3, fx: { hp: .02, app: -1 }, say: "The NCDC flies in a team. The story goes national." }),
        opt("quiet", "Keep it quiet", "No panic. Until the numbers come out.", { fx: { app: 2 }, roll: { p: .3, ok: { say: "It burns out on its own. You were lucky." , set: { contained: true } }, bad: { fx: { app: -10, hp: -.03 }, say: "A doctor posts the real numbers. The cover-up is the story now." } } }),
      ] },
    goal: { label: "the outbreak contained", met: (c) => !!c.flags.contained || c.hp >= (c.base.hp || 0) + .06, progress: (c) => c.flags.contained ? "Contained" : "Health " + Math.round(c.hp * 100) + "% · needs " + Math.round(((c.base.hp || 0) + .06) * 100) + "%" },
    deadline: 2, threat: { t: "The second wave", text: "The outbreak came back with the rains, worse. The world is watching.", paper: ["CHOLERA SECOND WAVE KILLS HUNDREDS", "International agencies criticise the state's response"] },
    warn: { turn: 1, text: "It will come back with the rains unless it is contained." },
    doom: { kind: "fx", fx: { hp: -.05, app: -8 } },
    uno: [{ id: "health", l: "A strong Commissioner for Health (performance 70+)", ok: (c) => c.healthPerf >= 70, say: "Your Health team was ready. The second wave is small." }] },

  oil_crash: {
    day1: { who: "finance-commissioner", bg: "finance-ministry-office", by: "The Commissioner for Finance", role: "The FAAC figures",
      title: "Federal money at sixty percent",
      says: "Sir, FAAC came in at sixty percent of what we budgeted. We cannot pay salaries and build at the same time.",
      options: [
        opt("salaries", "Cut salaries by a fifth", "Projects go on. The unions will not forgive it.", { fx: { app: -6, pStab: -4 }, set: { cut: true }, say: "Payslips are a fifth lighter. The NLC calls a meeting." }),
        opt("capital", "Cut capital projects", "Salaries paid. Nothing new is built this year.", { fx: { app: -2, infra: -.01 }, set: { cut: true }, say: "The new road is 'rescheduled'. Salaries go out on the 25th." }),
        opt("revenue", "A revenue drive: taxes the state can collect itself", "Slow, and the traders complain. The only way out for good.", { igrPct: .1, fx: { app: -2 }, set: { revenue: true }, say: "The revenue service hires and digitises. The markets grumble." }),
        opt("borrow", "Borrow and wait for oil to recover", "Nothing changes today. The debt grows.", { debtPct: .2, say: "The loan arrives. So will the repayments." }),
      ] },
    goal: { label: "the state off oil money", met: (c) => !!c.flags.revenue || (c.reforms || 0) >= 2 || c.igr >= (c.base.igr || 0) * 1.2, progress: (c) => c.flags.revenue ? "Revenue drive under way" : (c.reforms || 0) + " revenue reforms · or raise your own revenue by 20%" },
    deadline: 2, threat: { t: "Salaries stop", text: "The money ran out. Salaries stopped this month.", paper: ["SALARIES STOP AS FAAC DRIES UP", "Workers owed three months"] },
    warn: { turn: 1, text: "Unless the state raises its own money, salaries stop next year." },
    doom: { kind: "fx", fx: { app: -6 }, arrears: 3 },
    uno: [{ id: "fg", l: "Standing with Abuja of 65 or more: a bridge loan", ok: (c) => c.fg >= 65, say: "Abuja advances a bridge loan. Salaries are paid." }] },

  narrow_win: {
    day1: { who: "senior-advocate", bg: "courtroom", by: "Your lead counsel", role: "Senior Advocate of Nigeria",
      title: "They have filed",
      says: "Your Excellency, your opponent's lawyers filed at the tribunal this morning: forty-two grounds. We should decide today how we fight.",
      options: [
        opt("san", "Hire the best Senior Advocates", "Expensive. The best legal odds.", { costPct: .02, set: { san: true }, say: "Three SANs take the brief. The other side notices." }),
        opt("rally", "Rally your supporters", "Courts read newspapers too.", { fx: { app: 3, pStab: 2 }, say: "Thousands march for 'the people's mandate'." }),
        opt("approach", "Quietly approach the tribunal", "It may work. It may end you.", { fx: { cor: .05 }, roll: { p: .5, ok: { set: { san: true }, say: "Someone on the panel is 'sympathetic'." }, bad: { fx: { app: -6 }, say: "A journalist has the story. The petition just got stronger." } } }),
      ] },
    // The petition is the "or else": it already runs in the game (year 1).
    goal: { label: "the mandate upheld", met: (c) => c.petition === "won", progress: (c) => c.petition === "won" ? "Upheld" : "At the tribunal" },
    deadline: 0, uno: [] },

};

export const scenarioRules = (id) => SCENARIO_RULES[id] || null;
export const scenarioDeadline = (R, c) => !R ? 0 : typeof R.deadline === "function" ? R.deadline(c) : R.deadline || 0;
// Which uno cards the Governor holds now.
export const unoHeld = (R, c) => ((R && R.uno) || []).filter(u => { try { return !!u.ok(c); } catch (e) { return false; } });
/* This year's state of the logjam: { broken, warn, due, held } — broken (the goal is met),
   warn (the warning year), due (the deadline has come and the threat lands now). */
export const scenarioYear = (R, c, S = {}) => {
  if (!R) return {};
  const met = (() => { try { return !!R.goal.met(c); } catch (e) { return false; } })();
  const dl = scenarioDeadline(R, c);
  if (S.broken || met) return { broken: true, fresh: !S.broken && met };
  if (S.resolved) return {};
  return { warn: R.warn && c.turn === R.warn.turn && !S.warned, due: dl > 0 && c.turn >= dl, held: unoHeld(R, c) };
};
// A Day One option's money, as ₦B from the year's revenue.
export const scenarioCostB = (o, revB) => Math.round(((o.cost || 0) + (o.costPct || 0) * Math.max(1, revB || 0)) * 10) / 10;
