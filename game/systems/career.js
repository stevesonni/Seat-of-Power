/* Your career across games: every governorship you finish is recorded, the
   map of Nigeria fills in, and endings earn badges. */

// A tile map of the 36 states and the FCT, laid out roughly as on the map. [col, row]
export const STATE_TILES = {
  Sokoto: [1, 0], Zamfara: [2, 0], Katsina: [3, 0], Kano: [4, 0], Jigawa: [5, 0], Yobe: [6, 0], Borno: [7, 0],
  Kebbi: [1, 1], Niger: [2, 1], Kaduna: [3, 1], Bauchi: [4, 1], Gombe: [5, 1], Adamawa: [6, 1],
  Oyo: [0, 2], Kwara: [1, 2], FCT: [2, 2], Nassarawa: [3, 2], Plateau: [4, 2], Taraba: [5, 2],
  Ogun: [0, 3], Osun: [1, 3], Ekiti: [2, 3], Kogi: [3, 3], Benue: [4, 3],
  Lagos: [0, 4], Ondo: [1, 4], Edo: [2, 4], Anambra: [3, 4], Enugu: [4, 4], Ebonyi: [5, 4], Cross_River: [6, 4],
  Delta: [2, 5], Imo: [3, 5], Abia: [4, 5], Akwa_Ibom: [5, 5],
  Bayelsa: [2, 6], Rivers: [3, 6],
};
export const STATE_ABBR = (k) => ({ Akwa_Ibom: "AKW", Cross_River: "CRS", FCT: "FCT", Nassarawa: "NAS" })[k] || k.slice(0, 3).toUpperCase();

export const ENDING_NAME = { complete: "Served two terms", stepped_down: "Stepped down", defeated: "Voted out", impeached: "Impeached", nullified: "Removed by the court", bankrupt: "Left the state broke", pres_bid: "Ran for President" };
const GRADE_RANK = { A: 5, B: 4, C: 3, D: 2, F: 1 };

// The best result in each state: { state: { grade, ending, times } }.
// Records from other offices (office: "senator"…) sit in the same list; the map is governorships.
export const governorships = (list) => (list || []).filter(c => !c.office || c.office === "governor");
export const careerMap = (list) => {
  const m = {};
  governorships(list).forEach(c => { const o = m[c.state]; if (!o || (GRADE_RANK[c.grade] || 0) > (GRADE_RANK[o.grade] || 0)) m[c.state] = { grade: c.grade, ending: c.ending, times: (o ? o.times : 0) + 1 }; else o.times++; });
  return m;
};

// Badges: { id, icon, name, how, got }. stats: lifetime counts kept outside the list (trips).
export const JUNKET_TRIPS = 10;
export const careerBadges = (list, zoneOf = () => null, stats = {}) => {
  const P = (list || []).filter(c => c.office === "president");
  const L = governorships(list), states = new Set(L.map(c => c.state)), zones = new Set(L.map(c => zoneOf(c.state)).filter(Boolean));
  const B = [
    ["first", "🏛️", "Sworn in", "Finish your first governorship", L.length >= 1],
    ["two", "🎖️", "Two-termer", "Serve two full terms", L.some(c => c.ending === "complete")],
    ["gradeA", "🅰️", "Grade A", "Finish a governorship with grade A", L.some(c => c.grade === "A")],
    ["clean", "🧼", "Clean hands", "Leave office with corruption under 20%", L.some(c => c.cor < .2)],
    ["builder", "🏗️", "Builder", "Meet every yearly target of your flagship", L.some(c => c.flagAll)],
    ["survivor", "🛡️", "Survivor", "Survive an impeachment vote", L.some(c => c.impSurv)],
    ["aso", "🇳🇬", "Road to Aso Rock", "Resign to run for President", L.some(c => c.ending === "pres_bid")],
    ["zones", "🧭", "Six zones", "Govern a state in every geopolitical zone", zones.size >= 6],
    ["ten", "🗺️", "Ten states", "Govern ten different states", states.size >= 10],
    ["all", "👑", "The whole federation", "Govern all 36 states and the FCT", states.size >= 37],
    ["statesman", "🦅", "Statesman", "Serve a full term as President of Nigeria", P.some(c => c.ending === "complete" || c.terms >= 1 && c.ending !== "impeached" && c.ending !== "nullified")],
    ["commander", "🎖️", "Commander-in-Chief", "As President, face down tanks near the Villa", P.some(c => c.coup)],
    ["unifier", "🤝", "Unifier", "Leave the presidency with all six zones behind you", P.some(c => c.allZones && c.ending !== "impeached")],
    ["crisis", "⛓️", "Crisis ended", "As President, end the national crisis", P.some(c => c.crisisOver)],
    ["peacemaker", "🕊️", "Peacemaker", "As President, end the regional war with a peace treaty", P.some(c => c.peace)],
    ["unga", "🌐", "At the UN every year", "As President, go to every UN General Assembly of your time in office", P.some(c => c.ungaAll)],
    ["fallen", "⚠️", "Fallen", "Be impeached or removed (it happens)", L.some(c => c.ending === "impeached" || c.ending === "nullified")],
    ["junketer", "✈️", "The Junketer", "Take " + JUNKET_TRIPS + " official trips: abroad, to Aso Rock and to the summits", (stats.trips || 0) >= JUNKET_TRIPS],
  ];
  return B.map(([id, icon, name, how, got]) => ({ id, icon, name, how, got: !!got }));
};

// What a badge is worth: one honour, chosen at the start of a campaign, gives
// a head start. fx: app, pStab (points), cor (share), cashB, house (seats),
// fg (federal relations), zones (every zone's mood).
export const BADGE_PERKS = {
  first: { text: "Known face: party +3", fx: { pStab: 3 } },
  two: { text: "Two-term record: approval +3", fx: { app: 3 } },
  gradeA: { text: "Reputation: approval +4", fx: { app: 4 } },
  unga: { text: "Friends at the UN: approval +2", fx: { app: 2 } },
  clean: { text: "Clean hands: corruption −4%", fx: { cor: -.04 } },
  builder: { text: "Builder: ₦0.5B in the bank", fx: { cashB: .5 } },
  survivor: { text: "Survivor: two more loyal lawmakers", fx: { house: 2 } },
  aso: { text: "National profile: federal relations +10", fx: { fg: 10 } },
  commander: { text: "Commander-in-Chief: security +3%", fx: { sec: .03 } },
  unifier: { text: "Unifier: every zone +3", fx: { zones: 3 } },
  crisis: { text: "Crisis-tested: party +4", fx: { pStab: 4 } },
  peacemaker: { text: "Peacemaker: approval +3, security +2%", fx: { app: 3, sec: .02 } },
  statesman: { text: "Former President: party +6, approval +2", fx: { pStab: 6, app: 2 } },
  zones: { text: "Pan-Nigerian: every zone +2", fx: { zones: 2 } },
  ten: { text: "Seasoned: ₦1B in the bank", fx: { cashB: 1 } },
  all: { text: "Elder statesman: approval +5, party +5", fx: { app: 5, pStab: 5 } },
  fallen: { text: "Comeback story: approval +3", fx: { app: 3 } },
  junketer: { text: "Frequent flyer: federal relations +5", fx: { fg: 5 } },
};
