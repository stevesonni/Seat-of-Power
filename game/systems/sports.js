/* Sport and stadiums (owner, 25 Nov 2026: "no one ever has need for a stadium… the President should receive the FIFA
   president or CAF president, rotating per game, saying we will host the first leg of so-and-so in Nigeria, so we need
   a stadium. For the governor, a request from the youth leader of the State Youth Assembly that they have no
   representation, and the commissioner, after he is appointed, says they need two mini-stadia… Tori has to be buzzing
   about the request… if the stadium isn't ready by match day: both [rush it, or CAF moves the match]… a hostile Speaker
   of the House of Assembly, Speaker of the Reps or Senate can scuttle a project").
   Rules only. Real bodies (FIFA, CAF, the Super Eagles, the Super Falcons) are named; their people are not. */

// What Nigeria is asked to host, one per game.
export const FIXTURES = [
  { id: "wcq", body: "FIFA", who: "The President of FIFA", team: "the Super Eagles", what: "the first leg of a World Cup qualifier", tag: "#SuperEagles" },
  { id: "afconq", body: "CAF", who: "The President of CAF", team: "the Super Eagles", what: "the first leg of an Africa Cup of Nations qualifier", tag: "#SuperEagles" },
  { id: "wafcon", body: "CAF", who: "The President of CAF", team: "the Super Falcons", what: "a Women's Africa Cup of Nations semi-final", tag: "#SuperFalcons" },
  { id: "u17", body: "FIFA", who: "The President of FIFA", team: "the Golden Eaglets", what: "the opening matches of the Under-17 World Cup", tag: "#GoldenEaglets" },
  { id: "chan", body: "CAF", who: "The President of CAF", team: "the home-based Super Eagles", what: "the first leg of a CHAN qualifier", tag: "#SuperEagles" },
];
export const fixtureFor = (seed) => { let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return FIXTURES[h % FIXTURES.length]; };

// The President's three ways to get a stadium (and the fourth: play abroad). lga is the place a federal project sits in.
export const STADIUM_PLANS = [
  { id: "abuja", l: "Renovate the National Stadium in Abuja", lga: "FCT", title: "Renovation of the National Stadium, Abuja", qty: 60000, years: 1, costF: .35, note: "One year of work if the contract is signed now. The inspectors know it." },
  { id: "lagos", l: "Rebuild the old National Stadium in Lagos", lga: "Lagos", title: "Rebuilding the National Stadium, Surulere", qty: 45000, years: 2, costF: .8, note: "Lagos gets its stadium back after decades of decay, but two years of work: it will not be ready for this match." },
  { id: "uyo", l: "Upgrade a state stadium with its governor (Uyo)", lga: "Akwa_Ibom", title: "Upgrade of the Uyo stadium to FIFA standard", qty: 30000, years: 1, costF: .25, note: "The cheapest, done with the Akwa Ibom governor; the South-South will remember it." },
];

// A state's two mini-stadia, about 5,000 seats each.
export const MINI = { qty: 5000, years: 1, costF: .6 };

/* What Tori says, by stage. ctx: { st (state or "Nigeria"), fix (a FIXTURES row), plan, place }. Returns posts:
   { who, h (handle), what, art, text }. */
const P = (who, h, what, art, text) => ({ who, h, what, art, text });
export const sportsBuzz = (stage, ctx = {}) => {
  const F = ctx.fix || FIXTURES[0], st = ctx.st || "the state", place = ctx.place || st, tag = F.tag;
  return ({
    caf_ask: [
      P("Kunle Sports Desk", "kunlesports", "Sports journalist", "reporter", "BREAKING: " + F.body + " wants Nigeria to host " + F.what + ". Question is: which stadium? Abuja's has leaking roofs and Lagos's has goats. " + tag),
      P("Chioma 🦅", "chiomafan", "Supporter", "young-voter-student", "If " + F.team + " end up playing a home match abroad again I am deleting this app. Fix the stadium! " + tag),
      P("The Ball Is Round", "ballisround_ng", "Football page", "market-women-group-cheering", "A home leg means 60,000 fans, hotels full, suya sellers smiling. Don't waste it. " + tag),
    ],
    caf_plan: [
      P("Kunle Sports Desk", "kunlesports", "Sports journalist", "reporter", "Confirmed: the government has chosen to " + String(ctx.plan || "fix a stadium").replace(/^(\w)/, c => c.toLowerCase()) + ". The clock is ticking to match day. " + tag),
      P("Uche the Contractor Watcher", "uchewatch", "Citizen", "young-voter-student", "Watch the contract sum for this stadium. Every naira. 👀"),
    ],
    caf_abroad: [
      P("Chioma 🦅", "chiomafan", "Supporter", "young-voter-student", F.team + " will play their HOME match in another country because we have no stadium. Giant of Africa indeed. 😭 " + tag),
      P("Kunle Sports Desk", "kunlesports", "Sports journalist", "reporter", "The government has told " + F.body + " the home leg will be played abroad. Players and fans are furious. " + tag),
    ],
    caf_hosted: [
      P("The Ball Is Round", "ballisround_ng", "Football page", "market-women-group-cheering", "WHAT A NIGHT at " + place + "! A full stadium, the anthem, the noise. This is what we asked for. " + tag + " 🦅🇳🇬"),
      P("Chioma 🦅", "chiomafan", "Supporter", "young-voter-student", "I take back everything I said. The stadium is beautiful. " + tag),
    ],
    caf_rushed: [
      P("Kunle Sports Desk", "kunlesports", "Sports journalist", "reporter", "They finished the stadium the night before the match. Paint still wet on the seats. It held. Just. " + tag),
    ],
    caf_crack: [
      P("Kunle Sports Desk", "kunlesports", "Sports journalist", "reporter", "A stand had to be emptied in the second half after cracks appeared. The rush job shows. " + F.body + " is asking questions. " + tag),
      P("Chioma 🦅", "chiomafan", "Supporter", "young-voter-student", "They rushed the stadium and nearly killed us. Who signed this contract?"),
    ],
    caf_moved: [
      P("Kunle Sports Desk", "kunlesports", "Sports journalist", "reporter", F.body + " has moved the match out of Nigeria: the stadium was not ready. A national embarrassment. " + tag),
      P("Chioma 🦅", "chiomafan", "Supporter", "young-voter-student", "Two years of promises and no stadium. " + tag + " deserved better."),
    ],
    youth_ask: [
      P("Youth Assembly " + st, "youthassembly_" + String(st).toLowerCase().replace(/[^a-z]/g, "").slice(0, 8), "State Youth Assembly", "young-voter-student", "Half of " + st + " is under 30. Zero commissioners for youth. Zero pitches. We have written to the Governor. #" + String(st).replace(/[^A-Za-z]/g, "") + "YouthMatters"),
      P("Ahmed Plays Ball", "ahmedballer", "Footballer", "young-voter-student", "We train on a refuse dump because the only pitch in town became a car park. We just want somewhere to play."),
    ],
    mini_ask: [
      P("Youth Assembly " + st, "youthassembly_" + String(st).toLowerCase().replace(/[^a-z]/g, "").slice(0, 8), "State Youth Assembly", "young-voter-student", "Two mini-stadia for " + st + "'s young people: that is our ask. A place to play is a place away from the gangs. #" + String(st).replace(/[^A-Za-z]/g, "") + "YouthMatters"),
    ],
    mini_yes: [
      P("Ahmed Plays Ball", "ahmedballer", "Footballer", "young-voter-student", "Mini-stadia coming to " + place + "! If they deliver this, they have my vote. ⚽"),
    ],
    mini_no: [
      P("Youth Assembly " + st, "youthassembly_" + String(st).toLowerCase().replace(/[^a-z]/g, "").slice(0, 8), "State Youth Assembly", "young-voter-student", "The Governor has said no to the youth of " + st + ". We will remember at the polls."),
    ],
  })[stage] || [];
};

/* Match day for the President's fixture. ready: the stadium project is delivered; blocked: a hostile chamber is
   holding spending. Rushing costs half again of what is left, and a rush job may crack. */
export const RUSH_X = 1.5, CRACK_P = .35;
export const rushOutcome = (r = Math.random) => r() < CRACK_P ? { crack: true, app: -5, quality: .45 } : { crack: false, app: 3, quality: .6 };
