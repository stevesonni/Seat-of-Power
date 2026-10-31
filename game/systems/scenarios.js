/* Scenarios that deliver what they promise (owner, October 2026; redone after
   "they all fell flat"). Each scenario is a fight that lasts, not a lower number:
   - Day One: the person at the heart of the crisis walks in. No answer ends it:
     each only opens the fight (progress towards the goal, never all of it).
   - The rival comes back: every year the same people make a new move that
     answers what you did (moves), and while the crisis lasts it changes the
     rules of the game (rules: the Hostile House votes down your bills, your
     budget and your taxes; the strike freezes your sites; the sit-at-home eats
     your revenue…).
   - The deadline, counted down on the front pages: when it comes with the
     goal unmet, the threat lands full-screen (an impeachment motion, a general
     strike, the economy breaking), unless you hold an uno card you earned.
     Playing a card spends it: the rulers' favour, your approval, Abuja's patience.
   - The pace matters: Intense brings the deadline a year closer, two moves a
     year, harder cards and a heavier blow; Relaxed gives a year more.
   Rules only, no React.

   ctx (the game fills it): { turn, app, pStab, cor, rulers, fg, house: { seats, loyal },
     arrears, peace: { step, closed }, sitClosed, flags, prog, base, sec, hp, infra, agr, igr,
     reforms, petition, agPerf, worksPerf, healthPerf, pace, bar } */

// An answer: { id, l, note, prog (towards the goal), fx, costPct (of a year's revenue) | cost (₦B),
//   house (members), arrears (months paid), fg, igrPct, faacPct, debtPct, needFg, needRulers,
//   set (flags), roll: { p, ok, bad }, rollFg, stall (projects stop), say }
const opt = (id, l, note, more = {}) => ({ id, l, note, ...more });
const pct = (c) => Math.round(Math.max(0, Math.min(100, c.prog || 0)));

// Executive orders that provoke: who takes them personally.
export const PROVOKE_ORDERS = {
  revoke_land: "The Speaker's allies hold half of those plots.",
  hiring_freeze: "Every member promised jobs in their ward.",
  street_trading: "The traders are the members' voters.",
  okada: "The riders are the members' campaign boys.",
};
// Revenue reforms that need a law, so the House can stop them.
export const HOUSE_REVENUE = ["irs", "land", "levy", "property", "concession"];

export const SCENARIO_RULES = {
  hostile_house: {
    day1: { who: "speaker-angry", bg: "assembly-chamber", by: "The Speaker of the House", role: "Leader of the opposition majority",
      // The Speaker comes after the Governor has named the commissioners, not before.
      after: "ministries",
      title: "The House will not work with you",
      says: "Your Excellency, the House has rejected every commissioner you just named. Your budget, your bills and your taxes will meet the same fate, until you drop the promise you campaigned on.",
      options: [
        opt("deal", "Cut a deal with the Speaker", "Committee chairs and constituency projects for two of his members.", { costPct: .05, fx: { cor: .03 }, house: 2, say: "Two members are suddenly 'open to working with the Executive'. The Speaker keeps the rest." }),
        opt("carpet", "Bring opposition members across the carpet", "Money, quietly, member by member. If it leaks, it is on every front page.", { costPct: .06, house: 2, roll: { p: .6, ok: { say: "Two members cross to your party at a rally." }, bad: { fx: { app: -5, cor: .03 }, house: -1, say: "One crosses; the other takes the money to the press." } } }),
        opt("people", "Go over their heads to the people", "Town halls in every member's ward. Slow, but it costs no money.", { fx: { app: 3 }, house: 1, set: { people: true }, say: "The wards are listening. One member has already changed his tune." }),
        opt("drop", "Drop your campaign promise", "The House confirms your commissioners. The voters remember.", { fx: { app: -7 }, house: 2, set: { dropped: true }, say: "The House confirms your commissioners the same afternoon. Your supporters feel betrayed." }),
      ] },
    goal: { label: "a majority in the House", met: (c) => c.house && c.house.loyal >= Math.floor(c.house.seats / 2) + 1, progress: (c) => (c.house ? c.house.loyal + " of " + c.house.seats + " members with you · you need " + (Math.floor(c.house.seats / 2) + 1) : "") },
    rule: "The opposition majority votes down your bills, your budget and every tax that needs a law. Provoke them and they move faster.",
    deadline: 3, provokedBy: 1, // each two provocations bring the motion a year closer
    threat: { t: "The House moves to impeach you", text: "The opposition majority has filed an impeachment motion: gross misconduct, they say, for governing without the House.",
      count: (n) => ["SPEAKER: " + (n === 1 ? "ONE YEAR" : n + " YEARS") + " TO BRING THE GOVERNOR TO HEEL", "The opposition is counting votes for an impeachment motion"] },
    warn: { text: "The opposition is counting votes. Without a majority by the end of next year, they will move to impeach you." },
    doom: { kind: "impeach" },
    // Every year without a majority, the Speaker poaches a member (never to two-thirds on his own).
    yearly: (c) => ({ house: -1, note: "🏛️ The Speaker poached another member with a committee chair." }),
    moves: [
      { id: "probe", who: "speaker-angry", bg: "assembly-chamber", by: "The Speaker", title: "The House probes your contracts",
        says: "The Public Accounts Committee has summoned your commissioners. Every contract you signed this year, on the floor, on live television.",
        options: [
          opt("open", "Send every file, and go on television yourself", "If your books are clean, the probe becomes your platform.", { roll: { p: .7, ok: { house: 2, fx: { app: 4 }, say: "Nothing sticks. Two members say on air that they were misled by the Speaker." }, bad: { fx: { app: -5 }, say: "They found a padded contract. It leads the news for a week." } } }),
          opt("court", "Ask the court to stop the probe", "The Attorney-General argues it is a witch-hunt.", { fx: { app: -2 }, say: "The court halts the probe. The members call it contempt of the House." }),
          opt("chairs", "Offer the committee chairmen projects in their wards", "The probe quietly loses its witnesses.", { costPct: .04, fx: { cor: .03 }, house: 2, say: "The probe is adjourned indefinitely. Two chairmen now sit with you." }),
        ] },
      { id: "defectors", who: "party-chairman", bg: "governor-office", by: "Your party chairman", title: "Three members want to cross",
        says: "Three opposition members will cross to us at the next rally. They each want something, and the Speaker knows they are talking to us.",
        options: [
          opt("pay", "Give them what they want", "Contracts for their friends. It works, unless one of them talks.", { costPct: .06, fx: { cor: .03 }, roll: { p: .65, ok: { house: 3, say: "Three members cross at a rally in the capital." }, bad: { house: 1, fx: { app: -4 }, say: "One crosses. Two take the offer to the Speaker, and the press." } } }),
          opt("posts", "Offer appointments, not money", "Boards and special adviser posts for their people.", { fx: { pStab: -4 }, house: 2, say: "Two cross. Your own party grumbles about outsiders getting the jobs." }),
          opt("wait", "Let them come on their own", "No price, no promises.", { house: 0, say: "They wait, and the Speaker gets to them first." }),
        ] },
      { id: "byelection", who: "electoral-commissioner", bg: "governor-office", by: "The Electoral Commission", title: "A by-election in a swing seat",
        says: "An opposition member has died. INEC has fixed a by-election for his seat in six weeks.",
        options: [
          opt("fund", "Fund your candidate properly", "Rallies, agents in every polling unit, transport for voters.", { costPct: .03, roll: { p: .55, ok: { house: 1, fx: { app: 2 }, say: "Your candidate wins. The House is one member closer." }, bad: { fx: { app: -2 }, say: "The opposition holds the seat." } } }),
          opt("local", "Back the local favourite, whatever his party", "He owes you nothing, but he is not the Speaker's.", { fx: { pStab: -3 }, house: 1, say: "He wins and sits with you, for now. Your party is not pleased." }),
          opt("skip", "Stay out of it", "", { say: "The opposition holds the seat easily." }),
        ] },
      { id: "truce", who: "speaker-angry", bg: "assembly-chamber", by: "The Speaker", title: "The Speaker offers a truce",
        says: "Governor, this war is bad for both of us. Give the House thirty percent of the capital budget for constituency projects, and my members will pass your budget.",
        options: [
          opt("accept", "Accept his price", "Thirty percent of the capital budget, through the members' contractors.", { costPct: .08, fx: { cor: .04, app: -2 }, house: 3, say: "The truce holds. Your capital budget now builds the members' projects." }),
          opt("counter", "Counter: projects, but through open tenders", "He gets less, and the projects are real.", { costPct: .04, roll: { p: .5, ok: { house: 2, say: "He accepts, grudgingly. Two members come over." }, bad: { say: "He walks out. 'You will hear from us,' he says." } } }),
          opt("refuse", "Refuse, in public", "You tell the press what he asked for.", { fx: { app: 4 }, set: { exposedSpeaker: true }, say: "The press loves it. The Speaker does not forget." }),
        ] },
    ],
    uno: [
      { id: "app", l: "Approval of 60%+: crowds outside the House", ok: (c) => c.app >= 60 + c.bar, spend: { app: -6 }, say: "Crowds fill the streets around the House. Members up for re-election lose their nerve; the motion fails." },
      { id: "rulers", l: "The traditional rulers at 70%+ behind you", ok: (c) => c.rulers >= 70 + c.bar, spend: { rulers: -20 }, say: "The rulers summon the Speaker to the palace. The motion is withdrawn the next morning." },
      { id: "court", l: "A strong Attorney-General (performance 70+): an injunction", ok: (c) => c.agPerf >= 70 + c.bar, spend: { app: -2 }, say: "The Chief Judge halts the panel: the House skipped the steps the Constitution sets out." },
    ] },

  godfather_candidate: {
    day1: { who: "godfather", bg: "governor-office", by: "Your godfather", role: "He paid for everything",
      title: "A black Mercedes in the courtyard",
      says: "My boy, congratulations. Here is the contract for the state road rehabilitation. My company gets it, and the mobilisation fee is paid this month. I expect it signed before sunset.",
      options: [
        opt("sign", "Sign it", "He is happy. He will be back next month, and the month after.", { costPct: .12, fx: { cor: .05, pStab: 4 }, set: { gf: "signed" }, say: "He leaves smiling. The road is his, and so are you." }),
        opt("bond", "A smaller contract, with a performance bond", "He gets something; the state gets a guarantee. He will not forget the haggling.", { costPct: .06, fx: { cor: .02 }, prog: 15, set: { gf: "bond" }, say: "He takes it, without a smile. 'We will talk again,' he says." }),
        opt("refuse", "Refuse", "Your signature is yours. He will make you pay for it.", { fx: { app: 3, pStab: -6 }, prog: 25, set: { gf: "refused" }, say: "He smiles, says nothing and walks out. That smile is the problem." }),
        opt("expose", "Refuse, and hand his file to the EFCC", "If they move, he is weakened. If they do not, it is war.", { fx: { pStab: -8 }, roll: { p: .4, ok: { prog: 40, fx: { app: 5 }, set: { gf: "refused" }, say: "The EFCC invites him for questioning. His machine is rattled." }, bad: { prog: 15, set: { gf: "refused" }, say: "The EFCC sits on the file. He knows who sent it." } } }),
      ] },
    goal: { label: "free of the godfather", met: (c) => !!c.flags.freed || pct(c) >= 100, progress: (c) => c.flags.freed ? "Free" : "Your independence: " + pct(c) + "%" + (c.flags.gf === "signed" ? " · he owns your signature" : "") },
    rule: "His men sit in every ministry: each year one of your contracts stalls until you are free of him.",
    deadline: (c) => c.flags.gf === "signed" ? 4 : c.flags.gf === "bond" ? 3 : 3,
    threat: { t: "The godfather moves against you", text: "He has turned the House and the party against you: an impeachment motion, and his own man for your ticket.",
      count: (n) => ["GODFATHER'S MEN COUNTING VOTES IN THE HOUSE", (n === 1 ? "One year" : n + " years") + " before he moves, say his allies"] },
    warn: { text: "His men are visiting Assembly members at night. Break free of him, or be loved enough that nobody dares." },
    doom: { kind: "impeach" },
    yearly: (c) => ({ stall: ["infrastructure"], fx: { cor: .01 }, note: "🎩 The godfather's men held up one of your contracts at the Ministry of Works." }),
    moves: [
      { id: "works", who: "godfather", bg: "governor-office", by: "Your godfather", title: "His men at the Ministry of Works",
        says: "My boy, why is my company's certificate not paid? I hear you have a new contractor. I do not like new contractors.",
        options: [
          opt("pay", "Pay his certificate", "Peace for a year.", { costPct: .05, fx: { cor: .03 }, prog: -10, say: "He is paid. He calls you 'my son' at a wedding, in front of everyone." }),
          opt("audit", "Audit every contract his company holds", "The truth is on your side, if the auditors are honest.", { prog: 25, fx: { pStab: -4 }, stall: true, say: "The audit finds padding in three of his contracts. Work on your sites slows while it runs." }),
          opt("split", "Split the work: some for him, some on open tender", "Half free.", { costPct: .02, prog: 10, say: "He takes his half. He wanted all of it." }),
        ] },
      { id: "party", who: "party-chairman", bg: "governor-office", by: "Your party chairman", title: "He is turning the party executive",
        says: "Your Excellency, he is visiting every ward chairman with money. If the executive is his, the ticket is his.",
        options: [
          opt("lga", "Win the LGA chairmen over first", "Projects in their councils, and a seat at your table.", { costPct: .04, prog: 25, say: "Twelve council chairmen declare for you at a rally." }),
          opt("rulers", "Ask the traditional rulers to speak for you", "Only if they are with you.", { needRulers: 60, prog: 30, fx: { pStab: 3 }, say: "The palaces speak. The ward chairmen listen to the palaces." }),
          opt("ignore", "Ignore it", "", { fx: { pStab: -8 }, say: "The party executive is his now." }),
        ] },
      { id: "efcc", who: "efcc-investigator", bg: "governor-office", by: "An EFCC investigator", title: "The EFCC has his file",
        says: "Sir, we have bank records on your godfather's companies. We need the state's contract files to move. Will you give them to us?",
        options: [
          opt("give", "Give them everything", "If they move, he falls.", { roll: { p: .55, ok: { prog: 50, fx: { app: 6 }, say: "The EFCC arraigns him. His machine scatters." }, bad: { prog: 15, fx: { pStab: -6 }, say: "The file goes quiet. He knows what you did." } } }),
          opt("some", "Give them some, and keep the rest", "Pressure, without war.", { prog: 15, say: "The EFCC questions his managers. He is careful for a while." }),
          opt("none", "Refuse", "You may need him one day.", { prog: -5, say: "The investigator leaves. The file stays in a drawer." }),
        ] },
    ],
    uno: [
      { id: "popular", l: "Approval of 60% and the traditional rulers at 70%", ok: (c) => c.app >= 60 + c.bar && c.rulers >= 70 + c.bar, spend: { rulers: -15, app: -4 }, say: "The party will not drop a governor the palaces and the streets love. His men go quiet." },
      { id: "clean", l: "Clean hands (corruption under 25%): the EFCC takes your side", ok: (c) => c.cor < .25 - c.bar / 100, spend: {}, say: "With nothing on you, his file against you is empty. The EFCC turns to his." },
    ],
    actions: [{ id: "payoff", l: "Pay back his campaign money from the treasury", costPct: .15, fx: { cor: .02 }, set: { freed: true }, say: "His money is returned with interest. He has no claim on you now, and everybody knows what it cost." }] },

  broke: {
    day1: { who: "nlc-president-angry", bg: "governor-office", by: "The NLC state chairman", role: "Nigeria Labour Congress",
      title: "The unions walk into your office",
      says: "Governor, welcome. Our workers have not been paid for ninety days. The hospitals, the waterworks and the civil service stop in twenty-four hours, unless you pay one month of arrears today.",
      options: [
        opt("bank", "A loan from a commercial bank, at 30%", "Pays one month today. The interest eats your future budgets.", { arrears: 1, debtPct: .25, debtMul: 1.3, say: "The bank pays the workers by noon. You will pay the bank for years." }),
        opt("faac", "An advance on next year's FAAC from Abuja", "One month today; next year's allocation comes in lighter.", { needFg: 50, arrears: 1, faacPct: -.1, say: "Abuja advances the money. Next year's FAAC will be ten percent short." }),
        opt("audit", "A ghost-worker audit first", "Nothing paid today. The unions back you if the audit is honest.", { fx: { cor: -.02, pStab: -3 }, set: { audit: true }, say: "The audit starts. The unions give you thirty days." }),
        opt("strike", "Let them strike", "The bank is empty. You cannot pay what you do not have.", { fx: { app: -6, hp: -.02 }, stall: true, say: "The hospitals close their gates. Every project stops this year." }),
      ] },
    goal: { label: "the arrears cleared", met: (c) => (c.arrears || 0) === 0, progress: (c) => (c.arrears || 0) + " month" + ((c.arrears || 0) === 1 ? "" : "s") + " of salaries owed" },
    rule: "While two months or more are owed, the strike freezes your building sites and the hospitals run half-staffed.",
    deadline: 3, threat: { t: "A general strike", text: "The NLC has called an indefinite general strike: hospitals, water, schools and every site. The House calls it a failure to govern.",
      count: (n) => ["NLC: " + (n === 1 ? "ONE YEAR" : n + " YEARS") + " TO PAY, OR WE SHUT THE STATE", "Workers owed months of salary"] },
    warn: { text: "The unions have given you until the end of next year. Clear the arrears, or they shut the state." },
    doom: { kind: "fx", fx: { app: -12, pStab: -8, hp: -.03 }, halt: true, then: "impeach" },
    yearly: (c) => (c.arrears || 0) >= 2 ? { stall: null, fx: { app: -2, hp: -.01 }, note: "🪧 The strike goes on: every site is idle and the hospitals run half-staffed." } : null,
    moves: [
      { id: "ultimatum", who: "nlc-president-angry", bg: "governor-office", by: "The NLC chairman", title: "A 21-day ultimatum",
        says: "We gave you a year. Pay another month in twenty-one days, or the hospitals close again.",
        options: [
          opt("pay", "Pay a month, whatever it costs", "From the bank, or borrowed.", { arrears: 1, costPct: .06, say: "One more month paid. The chairman shakes your hand, once." }),
          opt("plan", "Publish a payment plan, signed by you", "Half a month now, the rest on a timetable.", { costPct: .03, prog: 0, set: { plan: true }, say: "The unions take the plan to their members. They will hold you to every date." }),
          opt("arrest", "Have the police pick up the strike leaders", "The strike ends tonight. Or it spreads.", { fx: { app: -8, cor: .01 }, roll: { p: .3, ok: { say: "The strike collapses. The press calls it intimidation." }, bad: { fx: { app: -4 }, stall: true, say: "Every union in the state walks out in solidarity." } } }),
        ] },
      { id: "pensioners", who: "workers-group-angry", bg: "governor-office", scene: "news-protest", by: "A pensioners' delegation", title: "Pensioners at the gate",
        says: "Your Excellency, some of us have not seen a pension in two years. Three of our members died waiting this month.",
        options: [
          opt("pay", "Pay the pension arrears first", "The right thing. The workers wait longer.", { costPct: .04, fx: { app: 4 }, say: "The pensioners are paid. The workers ask when it is their turn." }),
          opt("bond", "Issue them a state bond", "Paid later, with interest.", { debtPct: .05, fx: { app: 1 }, say: "The bond is accepted. Some sell it at half price the next week." }),
          opt("wait", "Ask them to wait", "", { fx: { app: -4 }, say: "They sit at the gate for three days. The cameras stay." }),
        ] },
      { id: "ghosts", who: "permanent-secretary", bg: "governor-office", by: "The Auditor-General", title: "The audit's findings",
        says: "Sir, the audit is done. Three thousand names on the payroll do not exist. Removing them frees money every month; the people who added them will fight.",
        when: (c) => !!c.flags.audit,
        options: [
          opt("purge", "Purge them all, and prosecute", "The savings pay the arrears.", { arrears: 1, fx: { cor: -.03, pStab: -4 }, say: "The ghosts are gone. Their savings pay a month of arrears." }),
          opt("quiet", "Purge them quietly", "Savings, without the fight.", { arrears: 1, say: "The ghosts disappear. So do the files." }),
        ] },
    ],
    uno: [
      { id: "plan", l: "At most one month owed, with a published plan", ok: (c) => (c.arrears || 0) <= 1 && !!c.flags.plan, spend: {}, say: "You paid most of it and published the rest. The unions accept a timetable." },
      { id: "audit", l: "The ghost-worker audit done: the unions are with you", ok: (c) => !!c.flags.audit && (c.arrears || 0) <= 2, spend: { app: -2 }, say: "The unions stand with the Governor who cleared the ghosts. The strike is called off." },
      { id: "app", l: "Approval of 60%+: the public is on your side", ok: (c) => c.app >= 60 + c.bar, spend: { app: -6 }, say: "The public blames the last government. The strike collapses in a week." },
    ] },

  school_abduction: {
    day1: { who: "dss-director-general", bg: "governor-office", scene: "news-protest", by: "The State Director of the DSS", role: "Department of State Services",
      title: "A ransom note",
      says: "Sir, the bandits holding the 150 pupils want ₦500 million. The parents are at the gates of Government House, with television cameras.",
      options: [
        opt("pay", "Pay, quietly", "Some children come home. The bandits are richer, and they ask for more.", { cost: .5, fg: -8, fx: { sec: -.04 }, prog: 45, set: { paid: true }, say: "Sixty children come home on Friday. The bandits say the rest cost more." }),
        opt("talk", "Negotiate through the clerics and the traditional rulers", "Slower. The children come home in groups, if the rulers trust you.", { fx: { app: 1 }, prog: 15, set: { children: "talks" }, say: "The emir and the bishop go into the forest together. It will take months." }),
        opt("raid", "A rescue raid", "All or nothing. Success makes you a hero; a funeral ends careers.", { roll: { p: .45, ok: { prog: 70, fx: { app: 10, sec: .03 }, say: "A hundred are home. The soldiers are carried shoulder-high. Fifty are still in the forest." }, bad: { prog: 30, set: { tragedy: true }, fx: { app: -16, pStab: -6 }, say: "Forty are home. Eleven are not. The funerals are on every channel." } } }),
        opt("abuja", "Ask Abuja for special forces", "Better odds if Abuja likes you.", { rollFg: true, roll: { p: .4, ok: { prog: 60, fx: { app: 6 }, fg: 4, say: "Special forces bring ninety children home. The President takes the credit." }, bad: { prog: 10, set: { children: "talks" }, fx: { app: -4 }, say: "The special forces arrive late; the bandits moved the children. Talks are all that is left." } } }),
      ] },
    goal: { label: "every child home", met: (c) => pct(c) >= 100, progress: (c) => "Children home: " + Math.round(pct(c) * 1.5) + " of 150" },
    rule: "Every year the children are held, the parents march and your approval bleeds.",
    deadline: 3, threat: { t: "A vote of no confidence", text: "A video of the children has been released. The parents march every week, and the House moves against you.",
      count: (n) => ["DAY " + (365 * Math.max(1, 4 - n)) + ": PUPILS STILL IN THE FOREST", "The parents' march reaches the Assembly"] },
    warn: { text: "Every month the children are not home costs you. The House is watching the parents' march." },
    doom: { kind: "impeach" },
    yearly: (c) => ({ fx: { app: -3 }, prog: c.flags.children === "talks" ? (c.rulers >= 60 ? 25 : 12) : 0, note: c.flags.children === "talks" ? "🏫 The talks brought another group of pupils home." : "🏫 The parents marched again. The children are still held." }),
    moves: [
      { id: "video", who: "teacher", bg: "governor-office", scene: "news-protest", by: "The parents' association", title: "A video of the children",
        says: "Your Excellency, have you seen it? My daughter is in that video. What are you doing?",
        options: [
          opt("meet", "Meet every family, with the cameras off", "", { fx: { app: 3 }, prog: 5, say: "You sit with them for four hours. Nobody films it; everybody hears about it." }),
          opt("reward", "Double the reward for information", "Someone in the villages knows where they are.", { costPct: .02, prog: 20, say: "A herder calls the DSS with a location." }),
          opt("blackout", "Ask the stations to stop airing it", "It hurts the families, and you.", { fx: { app: -5 }, say: "The video is everywhere anyway." }),
        ] },
      { id: "middleman", who: "village-head", bg: "governor-office", by: "A village head from the forest's edge", title: "A channel to the bandits",
        says: "I know the men who hold them. They buy food in my village. They will speak to me, and only me. I need money for 'logistics', and your trust.",
        options: [
          opt("trust", "Trust him", "He may be honest. He may be one of them.", { cost: .2, roll: { p: .6, ok: { prog: 35, say: "Thirty children walk out of the forest behind him." }, bad: { fx: { app: -3 }, say: "He disappears with the money." } } }),
          opt("track", "Use him, and have the DSS follow him", "", { prog: 20, fx: { sec: .02 }, say: "The DSS maps the camp. Twenty children are freed in a night operation." }),
          opt("refuse", "Refuse", "", { say: "He goes to the parents instead, and tells them you said no." }),
        ] },
      { id: "demand", who: "dss-director-general", bg: "governor-office", by: "The DSS Director", title: "A new demand",
        says: "They released twenty girls this morning, as a sign. They want ₦300 million and two commanders released for the rest.",
        options: [
          opt("pay", "Pay half, and talk", "", { cost: .3, prog: 35, fx: { sec: -.02 }, say: "Forty more children are home. The bandits buy motorcycles." }),
          opt("storm", "Storm the camp now that we know where it is", "", { roll: { p: .5, ok: { prog: 50, fx: { app: 6 }, say: "The camp is taken. Fifty children run to the soldiers." }, bad: { prog: 15, fx: { app: -10 }, say: "The camp was empty. The bandits moved them in the night." } } }),
          opt("refuse", "Refuse every demand", "", { fx: { app: -3 }, say: "The bandits release a new video." }),
        ] },
    ],
    uno: [
      { id: "app", l: "Approval of 60%+", ok: (c) => c.app >= 60 + c.bar, spend: { app: -6 }, say: "The public still trusts you to bring them home. The motion fails." },
      { id: "rulers", l: "The traditional rulers at 70%+ broker their release", ok: (c) => c.rulers >= 70 + c.bar, spend: { rulers: -20 }, say: "The rulers bring the last children home themselves. The House withdraws." },
    ] },

  sit_at_home: {
    day1: { who: "commerce-commissioner", bg: "governor-office", scene: "news-protest", by: "The Commissioner for Commerce", role: "Monday morning",
      title: "The markets are ghost towns",
      says: "Sir, the markets in the capital are empty. Enforcers burned three shops last night to make sure nobody opens on Monday.",
      options: [
        opt("force", "Order the police to open the markets", "Some shops open. The traders say you are risking their lives.", { fx: { app: -5, sec: .02 }, prog: 10, say: "Shops open under guard. Two traders are beaten that night." }),
        opt("elders", "Work with the elders and the church, and start a plan to end it", "The slow road: a four-year plan to make the state safe.", { fx: { app: 2 }, prog: 10, set: { peace: true }, say: "The elders agree to sit with you. The plan starts this year." }),
        opt("markets", "Pay traders to trade on Mondays", "A Monday market fund. It costs money and brings some revenue back.", { costPct: .04, prog: 15, say: "Some stalls open with the fund. Revenue comes back, a little." }),
        opt("quiet", "Ask Abuja to handle the separatists quietly", "Abuja likes the deference. The traders see nothing change.", { fg: 5, fx: { app: -2 }, say: "Abuja promises 'measures'. Monday is still Monday." }),
      ] },
    goal: { label: "the sit-at-home lifted", met: (c) => !!c.sitClosed || pct(c) >= 100, progress: (c) => "Mondays won back: " + pct(c) + "%" + (c.peace ? " · your plan: step " + Math.min(4, (c.peace.step || 0) + 1) + " of 4" : "") },
    prog: (c) => (c.peace ? (c.peace.step || 0) * 20 : 0), // the Peace Plan counts
    rule: "Every year the Mondays stay dead, your own revenue falls.",
    deadline: 4, threat: { t: "The economy breaks, and the army arrives", text: "Banks and big employers are leaving the state, and Abuja has sent in the army over your head.",
      count: (n) => ["BANKS WEIGH PULLING OUT OF THE STATE", "Another year of dead Mondays; " + (n === 1 ? "one year" : n + " years") + " before they decide"] },
    warn: { text: "Banks are talking about moving out. Lift the sit-at-home by next year, or the state's economy breaks." },
    doom: { kind: "fx", fx: { app: -6 }, igrPct: -.15, fg: -10 },
    yearly: (c) => ({ igrPct: -.04, note: "🚫 Another year of dead Mondays: your own revenue fell 4%." }),
    moves: [
      { id: "bus", who: "police-commissioner", bg: "governor-office", scene: "news-protest", by: "The Commissioner of Police", title: "Enforcers burn a bus",
        says: "A bus that ran on Monday was set on fire with the passengers still inside. Four dead. The enforcers say it is a warning.",
        options: [
          opt("hunt", "Hunt the enforcers, not the town", "Intelligence, targeted arrests, no mass raids.", { costPct: .02, prog: 20, fx: { sec: .02 }, say: "Six enforcers are arrested in a week. Some traders open on Monday." }),
          opt("raid", "Mass raids on the neighbourhoods", "Fast, loud, and the young men will remember.", { prog: 5, fx: { app: -6 }, say: "Hundreds arrested. The next Monday is emptier than ever." }),
          opt("compensate", "Compensate the families and say nothing", "", { cost: .1, fx: { app: 1 }, say: "The families are paid. The enforcers take your silence as permission." }),
        ] },
      { id: "summit", who: "traditional-ruler-oba-obi", bg: "governor-office", by: "The elders", title: "The elders ask for a summit",
        says: "Governor, our sons are angry because nobody listens. Sit with us, the church and the youth, in public.",
        options: [
          opt("summit", "Hold the summit, and act on it", "Jobs, roads and a hearing for the detained.", { costPct: .03, prog: 25, fx: { app: 3 }, say: "The communiqué is read in every church on Sunday. Two markets open on Monday." }),
          opt("photo", "Hold it for the cameras", "", { prog: 5, say: "A photograph and a communiqué. Monday is Monday." }),
          opt("refuse", "Refuse: no talks with sympathisers", "", { fx: { app: -3 }, say: "The elders go home. The young men hear about it." }),
        ] },
      { id: "banks", who: "commerce-commissioner", bg: "governor-office", by: "The Commissioner for Commerce", title: "The banks threaten to leave",
        says: "Three banks say they will move their regional offices out of the state unless Mondays come back this year.",
        options: [
          opt("guard", "Guarantee their branches: police at every branch on Mondays", "", { costPct: .02, prog: 15, say: "The branches open on Monday. Customers come, slowly." }),
          opt("tax", "Offer them a tax holiday to stay", "", { igrPct: -.03, prog: 5, say: "They stay, for now. Your revenue pays for it." }),
          opt("let", "Let them go", "", { fx: { app: -2 }, igrPct: -.03, say: "One bank leaves. The others watch." }),
        ] },
    ],
    uno: [
      { id: "fg", l: "Standing with Abuja of 65+: the army comes in under your command", ok: (c) => c.fg >= 65 + c.bar, spend: { fg: -15 }, say: "The troops report to you, not over your head. The enforcers melt away." },
      { id: "app", l: "Approval of 60%+", ok: (c) => c.app >= 60 + c.bar, spend: { app: -6 }, say: "The people defy the enforcers together. The markets reopen." },
    ] },

  bandit_corridor: {
    day1: { who: "traditional-ruler-emir", bg: "governor-office", by: "The Emir", role: "A letter from the villages",
      title: "A harvest tax from the bandits",
      says: "Your Excellency, the bandits have written to forty villages: pay twenty million naira, or no one harvests. The farmers ask what their Governor will do.",
      options: [
        opt("pay", "Let the villages pay", "The harvest comes in. The bandits are richer every season.", { fx: { cor: .02, sec: -.03, agr: .02 }, prog: -10, say: "The harvest is saved. The bandits buy motorcycles." }),
        opt("vigilantes", "Arm community guards", "Locals know the forest. They also settle their own scores.", { costPct: .02, fx: { sec: .02 }, prog: 15, say: "The guards drive the bandits back from three villages." }),
        opt("troops", "Demand federal troops", "A battalion arrives, late, and leaves early.", { fg: -2, fx: { sec: .01 }, prog: 10, say: "The troops arrive after the harvest." }),
        opt("plan", "Start a plan to end it for good", "A four-year plan: an outfit, community policing, jobs, peace committees.", { costPct: .01, prog: 5, set: { peace: true }, say: "The plan starts this year. The villages will hold you to it." }),
      ] },
    goal: { label: "the highways safe", met: (c) => pct(c) >= 100, progress: (c) => "Highways safe: " + pct(c) + "%" },
    prog: (c) => (c.peace ? (c.peace.step || 0) * 20 : 0) + Math.max(0, Math.round((c.sec - (c.base.sec || c.sec)) * 300)),
    rule: "Every year the bandits hold the roads, farms empty and food prices climb.",
    deadline: 3, threat: { t: "The food runs out", text: "The farms are empty. Food prices have doubled, and they will not come down while the bandits hold the roads.",
      count: (n) => ["FARMERS FLEE AS BANDITS TAX THE HARVEST", (n === 1 ? "One more harvest" : n + " more harvests") + " before the food runs out, say farmers"] },
    warn: { text: "Farmers are leaving. Make the highways safe by next year, or the food runs out." },
    doom: { kind: "fx", fx: { agr: -.06, app: -6 }, repeat: true },
    yearly: (c) => ({ fx: { agr: -.02, app: -2 }, note: "🏜️ The bandits held the highways another year: farms emptied and food prices rose." }),
    moves: [
      { id: "tax", who: "village-head", bg: "governor-office", by: "A village head", title: "The harvest tax again",
        says: "They came back, Your Excellency. Thirty million this time, or they burn the granaries.",
        options: [
          opt("guards", "Send the community guards and the police together", "", { costPct: .02, prog: 20, fx: { sec: .02 }, say: "The granaries are guarded. The bandits move to the next local government." }),
          opt("pay", "Let them pay, once more", "", { prog: -10, fx: { agr: .01, cor: .01 }, say: "The granaries are saved. The bandits ask for more next season." }),
          opt("move", "Move the villages to safer ground", "", { costPct: .03, prog: 5, fx: { agr: -.02, app: -2 }, say: "The villages move. The farms they left grow weeds." }),
        ] },
      { id: "truce", who: "village-head", bg: "governor-office", scene: "news-protest", by: "A village head, with the bandits' message", title: "A bandit leader offers a truce",
        says: "Their leader sent me, Your Excellency. He says: 'We will stop, Governor, if you give us amnesty, cattle and a share of the mining.'",
        options: [
          opt("talk", "Talk, through the emirs, with disarmament first", "", { needRulers: 55, prog: 30, say: "Two hundred men hand in their guns in the emir's palace." }),
          opt("pay", "Pay him to stop", "", { costPct: .03, prog: 15, fx: { cor: .02 }, say: "He stops. His rivals start." }),
          opt("refuse", "Refuse: no deals with killers", "", { fx: { app: 2 }, say: "The village head goes back with your answer. The next week, gunfire." }),
        ] },
      { id: "reprisal", who: "police-commissioner", bg: "governor-office", by: "The Commissioner of Police", title: "Vigilantes kill herders in reprisal",
        says: "The community guards burned a herders' camp last night. Twelve dead. The herders' associations are calling it genocide.",
        options: [
          opt("prosecute", "Arrest the guards responsible, publicly", "", { prog: 10, fx: { app: -2, sec: .01 }, say: "The guards are charged. The herders' leaders agree to meet you." }),
          opt("cover", "Look away", "", { prog: -10, fx: { sec: -.02 }, say: "The herders take their own revenge a week later." }),
          opt("reconcile", "A reconciliation committee with both sides", "", { costPct: .01, prog: 15, say: "Herders and farmers sit at the same table for the first time in years." }),
        ] },
    ],
    uno: [{ id: "rulers", l: "The traditional rulers at 70%+ lead peace talks", ok: (c) => c.rulers >= 70 + c.bar, spend: { rulers: -20 }, say: "The emirs bring the bandit leaders to the table. The highways open.", fx: { sec: .04 } }] },

  flood: {
    day1: { who: "commissioner-male-suit-worried", bg: "governor-office", scene: "flood", by: "The Commissioner for Works", role: "The rivers are still rising",
      title: "Forty thousand people in camps",
      says: "Sir, the embankments failed in three local governments. Forty thousand people are in school buildings and churches. The next rains come in nine months.",
      options: [
        opt("embank", "Rebuild the embankments properly", "Expensive. The work starts; it needs the dry season to finish.", { costPct: .1, fx: { infra: .02 }, prog: 40, set: { embank: true }, say: "The engineers start this week. They need every dry month." }),
        opt("camps", "Proper camps and relocation to higher ground", "Families safe; the river is still there.", { costPct: .05, fx: { app: 3, hp: .01 }, prog: 20, say: "Families move to new camps on high ground." }),
        opt("abuja", "Wait for NEMA and Abuja", "Federal money, if it comes.", { fg: 2, fx: { app: -3 }, prog: 5, say: "NEMA promises relief materials. The families wait." }),
        opt("ngo", "Leave it to the churches and NGOs", "Free. The families notice.", { fx: { app: -5 }, say: "The churches feed them. The families remember who did not." }),
      ] },
    goal: { label: "ready for the next rains", met: (c) => pct(c) >= 100, progress: (c) => "Ready for the rains: " + pct(c) + "%" },
    prog: (c) => Math.max(0, Math.round((c.infra - (c.base.infra || c.infra)) * 400)),
    rule: "Forty thousand people are in camps: every year they stay, health suffers.",
    deadline: 2, threat: { t: "The second flood", text: "The rains came back, and the river with them. The camps are flooded too.",
      count: (n) => ["RAINS DUE IN " + (n === 1 ? "MONTHS" : n + " YEARS") + ": ARE THE EMBANKMENTS READY?", "Forty thousand still in camps"] },
    warn: { text: "The rains return next year. Rebuild the embankments or raise the roads before then." },
    doom: { kind: "fx", fx: { infra: -.06, app: -8, agr: -.03 } },
    yearly: (c) => ({ fx: { hp: -.01 }, note: "🌊 The flood camps are still full; cholera and malaria spread in them." }),
    moves: [
      { id: "variation", who: "contractor", bg: "governor-office", by: "The embankment contractor", title: "The contractor wants more",
        says: "Your Excellency, cement has doubled. Without a variation of forty percent we stop work on Monday.",
        options: [
          opt("pay", "Pay the variation", "The wall gets built.", { costPct: .05, prog: 30, say: "Work goes on through the dry season." }),
          opt("retender", "Cancel and re-tender", "Honest, and slow.", { costPct: .02, prog: 15, fx: { cor: -.01 }, say: "A new contractor is on site in two months." }),
          opt("cheap", "Tell him to use less cement", "It will stand, until it doesn't.", { prog: 30, set: { weakWall: true }, fx: { cor: .02 }, say: "The work goes on. The engineers stop signing the reports." }),
        ] },
      { id: "relief", who: "civil-servant", bg: "governor-office", scene: "flood", by: "The NEMA coordinator", title: "The relief is stuck at the depot",
        says: "Sir, the federal relief materials are in the depot. Your officials want a cut before they release them.",
        options: [
          opt("sack", "Sack the officials and distribute it yourself", "", { prog: 10, fx: { app: 3, cor: -.01 }, say: "The rice and blankets reach the camps by the weekend." }),
          opt("blind", "Look away; it will move eventually", "", { fx: { cor: .02, app: -2 }, say: "Half of it reaches the camps. The rest is sold in the market." }),
        ] },
      { id: "resettle", who: "farmers-association-chair-angry", bg: "governor-office", by: "The displaced farmers", title: "The farmers want their land back",
        says: "The camps are killing us. Give us new land on high ground, or let us go back to the river.",
        options: [
          opt("land", "New land on high ground, with titles", "", { costPct: .03, prog: 20, fx: { agr: .01, app: 2 }, say: "Families move to new plots with papers." }),
          opt("back", "Let them go back to the floodplain", "", { prog: -10, fx: { agr: .02 }, say: "They go back to the river. The river will come back to them." }),
        ] },
    ],
    uno: [{ id: "works", l: "A strong Commissioner for Works (performance 70+)", ok: (c) => c.worksPerf >= 70 + c.bar, spend: {}, say: "Your Works team had sandbags and pumps ready. The damage is half what it was." }] },

  cholera: {
    day1: { who: "health-worker", bg: "governor-office", by: "The Commissioner for Health", role: "The case count",
      title: "Four hundred cases, and rising",
      says: "Sir, four hundred cases this week and thirty deaths. The wells in two local governments are poisoned. Every day we wait, it doubles.",
      options: [
        opt("isolate", "Isolation centres and free treatment", "Costly and right. It slows the spread; the source is still there.", { costPct: .05, fx: { hp: .02, app: 3 }, prog: 35, say: "The centres open in three days. The curve bends." }),
        opt("water", "Clean water first: tankers and new boreholes", "Stops the source; the sick still need beds.", { costPct: .06, fx: { infra: .01, hp: .01 }, prog: 30, say: "Tankers in every ward by the weekend." }),
        opt("ncdc", "Call the NCDC and the WHO", "Federal and international help; the press will know.", { fg: 3, fx: { hp: .01, app: -1 }, prog: 20, say: "The NCDC flies in a team. The story goes national." }),
        opt("quiet", "Keep it quiet", "No panic. Until the numbers come out.", { fx: { app: 2 }, roll: { p: .3, ok: { prog: 20, say: "It slows on its own. You were lucky, this time." }, bad: { fx: { app: -10, hp: -.03 }, say: "A doctor posts the real numbers. The cover-up is the story now." } } }),
      ] },
    goal: { label: "the outbreak contained", met: (c) => pct(c) >= 100, progress: (c) => "Outbreak contained: " + pct(c) + "%" },
    prog: (c) => Math.max(0, Math.round((c.hp - (c.base.hp || c.hp)) * 400)),
    rule: "While it spreads, health falls and people are afraid every year.",
    deadline: 2, threat: { t: "The second wave", text: "The outbreak came back with the rains, worse. The world is watching.",
      count: (n) => ["CHOLERA: CASES STILL RISING", "The rains bring a second wave unless it is contained"] },
    warn: { text: "It will come back with the rains unless it is contained." },
    doom: { kind: "fx", fx: { hp: -.05, app: -8 } },
    yearly: (c) => ({ fx: { hp: -.01, app: -1 }, note: "🦠 Cholera is still spreading through the wards." }),
    moves: [
      { id: "doctors", who: "doctor", bg: "governor-office", by: "The resident doctors", title: "Doctors threaten to walk out",
        says: "We are treating cholera without gloves, without hazard pay. Pay us, or we leave the wards on Friday.",
        options: [
          opt("pay", "Pay hazard allowances now", "", { costPct: .02, prog: 20, say: "The doctors stay. The death rate falls." }),
          opt("army", "Bring in army medics", "", { fg: -2, prog: 10, fx: { app: -2 }, say: "Army medics fill some of the gaps." }),
          opt("refuse", "Refuse: the budget is spent", "", { prog: -15, fx: { app: -4 }, say: "The wards empty on Friday." }),
        ] },
      { id: "vendors", who: "market-trader", bg: "governor-office", by: "The Commissioner for Health", title: "Vendors sell from the poisoned wells",
        says: "Sir, the water vendors are filling their kegs from the wells we sealed. They say people are thirsty and we gave them nothing.",
        options: [
          opt("tankers", "Free tankers in every ward, and seal the wells for good", "", { costPct: .03, prog: 25, say: "The vendors switch to the tankers. The wells stay shut." }),
          opt("arrest", "Arrest the vendors", "", { prog: 5, fx: { app: -3 }, say: "The vendors are arrested; their customers drink from the river instead." }),
        ] },
      { id: "rumour", who: "traditional-ruler-emir", bg: "governor-office", by: "The Emir", title: "A rumour about the vaccine",
        says: "People are saying the cholera vaccine is to make our women barren. My people will not take it.",
        options: [
          opt("clerics", "Vaccinate the emir and the clerics first, on television", "", { prog: 20, fx: { app: 2 }, say: "The emir rolls up his sleeve on air. The queues return." }),
          opt("force", "Make vaccination compulsory", "", { prog: 10, fx: { app: -5 }, say: "Some comply. Many hide." }),
        ] },
    ],
    uno: [{ id: "health", l: "A strong Commissioner for Health (performance 70+)", ok: (c) => c.healthPerf >= 70 + c.bar, spend: {}, say: "Your Health team was ready. The second wave is small." }] },

  oil_crash: {
    day1: { who: "finance-commissioner", bg: "finance-ministry-office", by: "The Commissioner for Finance", role: "The FAAC figures",
      title: "Federal money at sixty percent",
      says: "Sir, FAAC came in at sixty percent of what we budgeted. We cannot pay salaries and build at the same time.",
      options: [
        opt("salaries", "Cut salaries by a fifth", "Projects go on. The unions will not forgive it.", { fx: { app: -6, pStab: -4 }, prog: 15, say: "Payslips are a fifth lighter. The NLC calls a meeting." }),
        opt("capital", "Cut capital projects", "Salaries paid. Nothing new is built this year.", { fx: { app: -2, infra: -.01 }, prog: 10, stall: true, say: "The new road is 'rescheduled'. Salaries go out on the 25th." }),
        opt("revenue", "A revenue drive: taxes the state can collect itself", "Slow, and the traders complain. The only way out for good.", { igrPct: .08, fx: { app: -2 }, prog: 25, say: "The revenue service hires and digitises. The markets grumble." }),
        opt("borrow", "Borrow and wait for oil to recover", "Nothing changes today. The debt grows.", { debtPct: .2, say: "The loan arrives. So will the repayments." }),
      ] },
    goal: { label: "the state off oil money", met: (c) => pct(c) >= 100, progress: (c) => "Off oil money: " + pct(c) + "%" },
    prog: (c) => (c.reforms || 0) * 20 + Math.max(0, Math.round(((c.igr || 0) / Math.max(.1, c.base.igr || c.igr || 1) - 1) * 150)),
    rule: "Every year the state lives on oil money alone, the debt grows.",
    deadline: 3, threat: { t: "Salaries stop", text: "The money ran out. Salaries stopped this month.",
      count: (n) => ["FAAC STILL AT SIXTY PERCENT", "The Treasury warns salaries may stop " + (n === 1 ? "next year" : "within " + n + " years")] },
    warn: { text: "Unless the state raises its own money, salaries stop next year." },
    doom: { kind: "fx", fx: { app: -6 }, arrears: 3 },
    yearly: (c) => ({ debtPct: .04, note: "🛢️ Another year on sixty-percent FAAC: the overdraft grew." }),
    moves: [
      { id: "levy", who: "market-women-group-angry", bg: "governor-office", scene: "news-protest", by: "The market women's leader", title: "The market women reject the new levy",
        says: "Your revenue men are collecting three times in one day. We will close the markets until it stops.",
        options: [
          opt("one", "One levy, one receipt, paid by phone", "", { costPct: .01, prog: 20, igrPct: .03, say: "The markets reopen. The collections go up, honestly." }),
          opt("enforce", "Enforce it: the state needs the money", "", { prog: 10, igrPct: .02, fx: { app: -4 }, say: "The markets close for a week, then pay." }),
          opt("drop", "Drop the levy", "", { prog: -10, fx: { app: 3 }, say: "The women dance in the market. The Treasury does not." }),
        ] },
      { id: "overdraft", who: "investor-nigerian", bg: "finance-ministry-office", by: "A bank's managing director", title: "The bank calls in the overdraft",
        says: "Your Excellency, the state's overdraft is ₦ billions past its limit. We need it reduced this quarter, or we stop paying your cheques.",
        options: [
          opt("sell", "Sell idle state assets to pay it down", "Hotels, vehicles, unused land.", { prog: 15, debtPct: -.05, fx: { app: -1 }, say: "The idle hotel is sold. The overdraft shrinks." }),
          opt("roll", "Roll it over at a higher rate", "", { debtPct: .05, say: "The bank agrees, at a price." }),
        ] },
      { id: "consultant", who: "lobbyist", bg: "finance-ministry-office", by: "A tax consultant", title: "A collection deal",
        says: "Give my firm the right to collect your property tax, and we keep thirty percent. You will double your revenue in a year.",
        options: [
          opt("accept", "Accept, with a public contract", "", { igrPct: .06, prog: 25, fx: { cor: .01 }, say: "Collections jump. So do the complaints about his agents." }),
          opt("own", "Build your own collection service instead", "", { costPct: .02, prog: 15, say: "Slower, and the state keeps all of it." }),
          opt("no", "Refuse", "", { say: "He takes the offer to your neighbour." }),
        ] },
    ],
    uno: [{ id: "fg", l: "Standing with Abuja of 65+: a bridge loan", ok: (c) => c.fg >= 65 + c.bar, spend: { fg: -15 }, say: "Abuja advances a bridge loan. Salaries are paid." }] },

  narrow_win: {
    day1: { who: "senior-advocate", bg: "courtroom", by: "Your lead counsel", role: "Senior Advocate of Nigeria",
      title: "They have filed",
      says: "Your Excellency, your opponent's lawyers filed at the tribunal this morning: forty-two grounds. We should decide today how we fight.",
      options: [
        opt("san", "Hire the best Senior Advocates", "Expensive. The best legal odds.", { costPct: .02, set: { san: true }, say: "Three SANs take the brief. The other side notices." }),
        opt("rally", "Rally your supporters", "Courts read newspapers too.", { fx: { app: 3, pStab: 2 }, say: "Thousands march for 'the people's mandate'." }),
        opt("approach", "Quietly approach the tribunal", "It may work. It may end you.", { fx: { cor: .05 }, roll: { p: .5, ok: { set: { san: true }, say: "Someone on the panel is 'sympathetic'." }, bad: { fx: { app: -6 }, set: { tainted: true }, say: "A journalist has the story. The petition just got stronger." } } }),
      ] },
    // The petition is the "or else": it already runs in the game.
    goal: { label: "the mandate upheld", met: (c) => c.petition === "won", progress: (c) => c.petition === "won" ? "Upheld" : "At the tribunal" },
    rule: "Until the courts rule, your opponent's lawyers are in every newspaper.",
    deadline: 0, uno: [],
    moves: [
      { id: "witness", who: "senior-advocate", bg: "courtroom", by: "Your lead counsel", title: "A witness changes his story",
        says: "Sir, the presiding officer from Ward 7 now says he was paid to falsify the results. In our favour, he says. The other side says it was for them.",
        options: [
          opt("protect", "Protect him and let him testify honestly", "", { costPct: .01, set: { san: true }, say: "He testifies. The panel believes him." }),
          opt("silence", "Make sure he says nothing", "", { fx: { cor: .03 }, roll: { p: .6, ok: { say: "He does not appear." }, bad: { set: { tainted: true }, fx: { app: -5 }, say: "He tells the press you threatened him." } } }),
        ] },
    ] },
};

export const scenarioRules = (id) => SCENARIO_RULES[id] || null;
// The pace: Intense brings the deadline a year closer and the cards are harder to hold; Relaxed gives a year more.
export const paceAdj = (pace) => pace === "intense" ? { dl: -1, bar: 5, moves: 2, mult: 1.5 } : pace === "relaxed" ? { dl: 1, bar: -5, moves: 1, mult: .75 } : { dl: 0, bar: 0, moves: 1, mult: 1 };
export const scenarioDeadline = (R, c) => {
  if (!R) return 0;
  const d = typeof R.deadline === "function" ? R.deadline(c) : R.deadline || 0;
  if (!d) return 0;
  const P = paceAdj(c && c.pace), prov = R.provokedBy && c && c.flags ? Math.floor((c.flags.provoked || 0) / 2) * R.provokedBy : 0;
  return Math.max(2, d + P.dl - prov);
};
// How far the goal has come (0–100): what you did, plus what the numbers say.
export const scenarioProg = (R, c) => Math.max(0, Math.min(100, (c.prog || 0) + (R && R.prog ? R.prog(c) : 0)));
export const scenarioMet = (R, c) => { try { return !!R.goal.met({ ...c, prog: scenarioProg(R, c) }); } catch (e) { return false; } };
// Which uno cards the Governor holds now.
export const unoHeld = (R, c) => ((R && R.uno) || []).filter(u => { try { return !!u.ok({ bar: 0, ...c }); } catch (e) { return false; } });
/* This year's state of the logjam: { broken, fresh } once the goal is met; otherwise
   { warn (the year before the deadline), due (the threat lands now), left (years to go), held }. */
export const scenarioYear = (R, c, S = {}) => {
  if (!R) return {};
  const met = scenarioMet(R, c);
  if (S.broken || met) return { broken: true, fresh: !S.broken && met };
  const dl = scenarioDeadline(R, c);
  if (S.resolved) return {};
  return { warn: !!R.warn && dl > 0 && c.turn === dl - 1 && !S.warned, due: dl > 0 && c.turn >= dl, left: dl ? dl - c.turn : 0, held: unoHeld(R, c) };
};
// This year's moves from the rival: the next ones not yet played, that apply now.
export const scenarioMoves = (R, S = {}, c = {}) => {
  const seen = S.moves || [], n = paceAdj(c.pace).moves;
  return ((R && R.moves) || []).filter(m => !seen.includes(m.id) && (!m.when || m.when(c))).slice(0, n);
};
// An answer's money, as ₦B from the year's revenue.
export const scenarioCostB = (o, revB) => Math.round(((o.cost || 0) + (o.costPct || 0) * Math.max(1, revB || 0)) * 10) / 10;
