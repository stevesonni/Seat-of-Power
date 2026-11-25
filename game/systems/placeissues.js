/* What a place really raises when you visit (owner, 25 Nov 2026: "As a governor when I tour a local government it
   should be variations of problems unique to that particular LGA in real-life Nigeria… Aba South has 2–3 problems and
   we rotate, but they aren't the same as Chibok's… whether I am meeting the council chairman or the people via town
   hall. Same for the President: whichever place he goes, a unique issue, and it depends on whether he meets the kings,
   the town hall, etc.").

   Each of the 774 local governments has two or three issues (places/a–f.js), each state its President's issues by
   audience (places/states.js). An issue: { k (the need it becomes), t (title), d (what they say) }. */
import A from "./places/a.js";
import B from "./places/b.js";
import C from "./places/c.js";
import D from "./places/d.js";
import E from "./places/e.js";
import F from "./places/f.js";
import S from "./places/states.js";

import { produceOf } from "./trade.js";

export const LGA_ISSUES = { ...A, ...B, ...C, ...D, ...E, ...F };
export const STATE_ISSUES = S;
const parse = (x) => { const [k, t, d] = String(x).split("|"); return { k, t, d }; };

/* A short line used by more than one place ("Farmers want inputs.") is told locally instead: the place's name, the
   state's own crops, and a problem from the pool for that kind of trouble, chosen by the place, so two councils never
   say the same thing (owner: "I can't come to Chibok and they're saying fertiliser and it's the same in Aba"). */
const ZONE = { NW: "Jigawa Kaduna Kano Katsina Kebbi Sokoto Zamfara", NE: "Adamawa Bauchi Borno Gombe Taraba Yobe", NC: "Benue FCT Kogi Kwara Nassarawa Niger Plateau",
  SW: "Ekiti Lagos Ogun Ondo Osun Oyo", SE: "Abia Anambra Ebonyi Enugu Imo", SS: "Akwa_Ibom Bayelsa Cross_River Delta Edo Rivers" };
const zoneOf = (st) => Object.keys(ZONE).find(z => ZONE[z].split(" ").includes(st)) || "NC";
const hash = (x) => { let h = 2166136261; for (const ch of String(x)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
const NORTH = { NW: 1, NE: 1 };
const POOL = {
  farmN: ["{L}'s {c} farmers say the fertiliser came after the planting, and half of it was sold on before it reached them.", "The rains came late and stopped early in {L}; the {c} harvest failed, and families have no seed for next season.",
    "{L}'s farmers sell their {c} at harvest for almost nothing, then pay twice as much for it in the lean months: there is no storage.", "There is no tractor to hire in {L}; families hoe their {c} and {c2} by hand and plant half what they could.",
    "Dry-season farmers in {L} want small pumps and boreholes so they can grow {c2} when the rains stop.", "Pests ate {L}'s {c} this year, and nobody came from the ministry to spray."],
  farmS: ["{L}'s {c} farmers sell to middlemen who set the price at the farm gate; they want a buying centre.", "There is no {c} processing near {L}; the harvest leaves raw and cheap, and much of it rots.",
    "Farm roads in {L} wash away every rainy season, and the {c} rots waiting for trucks.", "Young people in {L} have left the {c} farms for the city; the farmers are old and want machines.",
    "{L}'s farmers lost their {c2} to a disease nobody from the ministry came to see.", "Land for farming in {L} is being sold off for houses; farmers want their plots protected."],
  farmFear: ["Farmers in {L} will not go to farms more than a short walk from town; whole fields of {c} are left unplanted.", "{L}'s farmers were attacked at their farms last season; this year many have not planted their {c}.",
    "In {L}, farmers pay armed men before they can harvest their {c}.", "The {c} farms around {L} have gone wild; their owners fled to the town."],
  road: ["The road from {L} to the state capital is so broken that the journey takes three times as long as it should.", "In {L}, the bridge washed away last rainy season, and the villages beyond it are cut off.",
    "{L}'s market road floods every time it rains; traders cannot reach the market for days.", "Trucks avoid {L} because of its road; prices there are higher than anywhere nearby.",
    "The road to {L}'s general hospital is so bad that the sick die on the way.", "Contractors started {L}'s road years ago, took the money and left the trenches open."],
  water: ["{L}'s boreholes broke down and nobody came to repair them; women queue at the one that works from dawn.", "Taps in {L} have been dry for years; families buy jerrycans from carts.",
    "In {L}, children miss school to fetch water from a stream shared with cattle.", "Cholera came to {L} last rainy season from the shallow wells beside the latrines.",
    "{L}'s water scheme needs a new pump and power; the pipes are already laid.", "The solar borehole in {L} stopped when thieves took its panels."],
  kidnap: ["Kidnappers have taken travellers on the roads out of {L}; drivers will not travel after four in the afternoon.", "Families in {L} have sold land to pay ransoms; some paid and never saw their people again.",
    "Kidnappers in {L} now take farmers from their farms, not only travellers from the road.", "Teachers posted to {L} are leaving because of the kidnappings."],
  bandit: ["Bandits on motorcycles ride into {L}'s villages at night, take cattle and people, and are gone before help comes.", "Villages in {L} pay bandits a levy to be left alone; those that refuse are burned.",
    "{L}'s vigilantes have dane guns; the bandits have rifles.", "Markets in {L} have closed because bandits attack on market days."],
  herders: ["Cattle trample {L}'s farms at night; when farmers complain, they are attacked.", "Herders and farmers in {L} clash every dry season over water and land.",
    "{L}'s farmers want the grazing routes marked so the cattle keep off their crops.", "Young men in {L} have formed their own guards against the herders; the police fear it will end in a massacre."],
  insurg: ["Insurgents attack {L}'s villages and the roads between them; families sleep in the bush.", "The trenches around {L} keep the town safe, but nobody can farm beyond them.",
    "Insurgents stop vehicles on {L}'s roads and kill those they suspect.", "Families who fled {L} want to go home, but nobody can promise them it is safe."],
  clash: ["Two communities in {L} are fighting over a boundary; houses have been burned on both sides.", "{L} has had communal killings; the villages now live in fear of revenge.",
    "Young men in {L} have taken up arms over land; the elders cannot stop them.", "A peace committee in {L} has stopped meeting; both sides say the other broke the agreement."],
  gunmen: ["Gunmen in {L} enforce the sit-at-home and attack anyone who opens a shop.", "Police stations in {L} have been burned; the police have withdrawn.",
    "Gunmen in {L} kill and burn houses at night, and nobody knows who they are.", "Traders in {L} lose every Monday to the sit-at-home."],
  cult: ["Cult groups in {L} fight over territory; young men are killed at night.", "In {L}, cultists recruit schoolboys.", "Cult clashes in {L} close the markets for days."],
  pirate: ["Pirates attack the passenger boats out of {L}; fishermen stay ashore.", "Boats from {L} are robbed on the creeks; women traders lose their goods."],
  smuggle: ["Smugglers use bush paths near {L}; customs raids turn violent.", "Young men in {L} carry smuggled rice and fuel across the border on motorcycles."],
  gully: ["A gully in {L} grows every rainy season and has swallowed houses and a road.", "Families in {L} have moved out as the erosion reached their walls.", "The gully in {L} has cut the town in two."],
  flood: ["The river floods {L} every rainy season; families sleep in schools until it falls.", "Floods in {L} washed away the farms and the market this year.", "{L}'s homes stand in water for weeks after every flood."],
  camp: ["Families from {L} have lived in camps for years and want to go home.", "The camp near {L} has too little food and water."],
  spill: ["Oil spills have poisoned {L}'s creeks; fish float dead.", "The water in {L} tastes of crude; children have rashes."],
  school: ["{L}'s schools have one teacher for several classes.", "Pupils in {L} sit on the floor; the roofs leak.", "Teachers in {L} have not been paid on time and stay away."],
  clinic: ["{L}'s health centre has no drugs and no night staff.", "Mothers in {L} give birth at home; the clinic has no midwife."],
  traffic: ["{L} jams morning and evening; buses take hours.", "Trucks park on {L}'s roads and block them."],
  housing: ["Homes in {L} flood when the drains choke.", "{L}'s new estates have no roads or drains."],
  jobs: ["Factories in {L} run on diesel; many have closed.", "{L}'s young people have no work."],
  any: ["{L} says Government House has forgotten it.", "{L} wants to see the governor's projects reach it."],
};
const poolOf = (k, d) => {
  const x = String(d).toLowerCase();
  if (k === "farm") return /fear|fled|cannot reach|safety/.test(x) ? "farmFear" : null;
  if (k === "security") return /bandit/.test(x) ? "bandit" : /insurg/.test(x) ? "insurg" : /herd|cattle/.test(x) ? "herders" : /cult/.test(x) ? "cult" : /pirat|boat/.test(x) ? "pirate" : /smuggl/.test(x) ? "smuggle" : /gunmen/.test(x) ? "gunmen" : /kidnap/.test(x) ? "kidnap" : "clash";
  if (k === "housing") return /gull|erosion/.test(x) ? "gully" : /camp|displac|home safely|fled/.test(x) ? "camp" : /flood|niger|river/.test(x) ? "flood" : "housing";
  if (k === "water") return /spill|creek|oil|pollut/.test(x) ? "spill" : "water";
  return POOL[k] ? k : "any";
};
const SEEN = {}; for (const st in LGA_ISSUES) for (const l in LGA_ISSUES[st]) for (const x of LGA_ISSUES[st][l]) { const d = String(x).split("|")[2]; SEEN[d] = (SEEN[d] || 0) + 1; }
const localise = (st, lga, it) => {
  if ((SEEN[it.d] || 0) < 2) return it;
  const pk = poolOf(it.k, it.d) || (NORTH[zoneOf(st)] ? "farmN" : "farmS"), P = POOL[pk] || POOL.any, h = hash(st + "|" + lga + "|" + it.k);
  const [c, c2] = produceOf(st); const d = P[h % P.length].replace(/\{L\}/g, lga).replace(/\{c\}/g, c).replace(/\{c2\}/g, c2 || c);
  return { ...it, d: d.charAt(0).toUpperCase() + d.slice(1) };
};

// Who you meet changes what comes first: the chairman leads with the council's own worries, the town hall with the
// street's, the palace with the land and the peace. Each visit to the same place moves on to the next issue.
const LEAD = { chairman: ["road", "school", "clinic", "water", "housing", "jobs", "land"], townhall: ["security", "water", "clinic", "youth", "traffic", "poverty", "power"], palace: ["security", "land", "farm", "housing", "jobs"] };

export const lgaIssues = (state, lga) => ((LGA_ISSUES[state] || {})[lga] || []).map(parse).map(it => localise(state, lga, it));

/* The issue raised on this visit. audience: "chairman" | "townhall" | "palace"; visits: how many times you have toured
   this LGA before. Returns { k, t, d } or null when the place has no entry. */
export const lgaIssue = (state, lga, audience = "townhall", visits = 0) => {
  const L = lgaIssues(state, lga); if (!L.length) return null;
  const pref = LEAD[audience] || [], order = L.map((x, i) => ({ x, i, p: pref.indexOf(x.k) })).sort((a, b) => (a.p < 0 ? 99 : a.p) - (b.p < 0 ? 99 : b.p) || a.i - b.i).map(o => o.x);
  return order[visits % order.length];
};

/* The President's visit: town (the people), rulers (the royal fathers), security (the troops and the displaced). */
const AUD = { town: "t", rulers: "r", security: "s" };
export const stateIssue = (state, purpose = "town", visits = 0) => {
  const X = STATE_ISSUES[state]; if (!X) return null;
  const L = (X[AUD[purpose]] || X.t || []).map(parse); if (!L.length) return null;
  return L[visits % L.length];
};
