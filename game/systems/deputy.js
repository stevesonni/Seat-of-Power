/* The running mate: a strategic choice, not a stat line.

   Each candidate is one of four kinds, so no one is best at everything:
     mobiliser  – brings a real network in their district; thinner on
                  delivery; an allegation follows them; wants influence.
     technocrat – competent and clean; weak at mobilising; independent
                  enough to disagree with you in public.
     partyman   – the party's choice: the machine likes them, so the party
                  is happiest; loyal to the party first; wants appointments.
     newcomer   – energetic, untested; little is known, which is the risk.
   Traits belong to the fictional person (seeded from their name), never to
   ethnicity, religion or where they come from.

   What the player sees: known facts and allegations. What they do not:
   `hidden` (how likely a buried problem is to surface), which is rolled
   later from the deputy's own seed, not on a fixed script. */
import { seeded } from "./rng.js";

export const DISTRICTS = ["North Senatorial", "Central Senatorial", "South Senatorial"];

const KINDS = {
  mobiliser: { bg: "Grassroots mobiliser", co: [45, 62], lo: [55, 72], pu: [76, 90], indep: .3,
    networks: ["farmers' cooperatives", "market women's associations", "transport and okada unions"],
    known: (n) => ["Can turn out " + n + " across the district", "Two terms as a local government chairman"],
    allegation: "Accused, but never charged, of diverting fertiliser subsidies as LG chairman",
    demand: { id: "control", text: "a say over the agriculture budget in their district" }, hidden: [.25, .5] },
  technocrat: { bg: "Technocrat", co: [78, 90], lo: [45, 62], pu: [35, 50], indep: .7,
    networks: ["the civil service and professional bodies"],
    known: () => ["Former permanent secretary; ran the state's last audit", "Not a party member until last year"],
    allegation: null, demand: { id: "policy", text: "a free hand to reform the civil service" }, hidden: [.03, .1] },
  partyman: { bg: "The party's choice", co: [50, 64], lo: [48, 58], pu: [52, 66], indep: .2,
    networks: ["the ward and local government party structures"],
    known: () => ["The party chairman's preferred candidate", "Twenty years in the party; knows every ward leader"],
    allegation: null, demand: { id: "appointments", text: "two commissioner slots for party nominees" }, hidden: [.1, .3] },
  newcomer: { bg: "Newcomer", co: [55, 80], lo: [45, 75], pu: [55, 74], indep: .55,
    networks: ["young voters and online communities"],
    known: () => ["Built a tech business; never held office", "Popular with first-time voters"],
    allegation: null, demand: null, hidden: [.05, .45] },
};
const ri = (r, [a, b]) => Math.round(a + r() * (b - a));

/* Four candidates, one of each kind. Districts are spread so that at least
   one candidate shares the governor's district and at least two do not. */
export const genDeputies = ({ stateId, playerDistrict = 0, names }) => {
  const r = seeded("deputies", stateId, playerDistrict);
  const order = ["partyman", "mobiliser", "technocrat", "newcomer"];
  const others = [0, 1, 2].filter(d => d !== playerDistrict);
  // The tempting one (the mobiliser) is from the governor's own district half the time.
  const sameIdx = r() < .5 ? 1 : 3;
  return order.map((kind, i) => {
    const K = KINDS[kind], rr = seeded("deputy", stateId, names[i]);
    const district = i === sameIdx ? playerDistrict : others[i % 2];
    const network = K.networks[Math.floor(rr() * K.networks.length)];
    const co = ri(rr, K.co), lo = ri(rr, K.lo), pu = ri(rr, K.pu);
    return {
      nm: names[i], kind, bg: K.bg, district, network, co, lo, pu, indep: K.indep,
      cr: kind === "mobiliser" ? 35 : kind === "technocrat" ? 8 : 20, // the old corruption field, kept for older code
      known: K.known(network), allegation: K.allegation, demand: K.demand,
      hidden: Math.round((K.hidden[0] + rr() * (K.hidden[1] - K.hidden[0])) * 100) / 100,
      partyFav: kind === "partyman",
      desc: kind === "mobiliser" ? "Wins votes; costs you control." : kind === "technocrat" ? "Delivers; will not carry a crowd." : kind === "partyman" ? "Keeps the party with you; owes the party first." : "Fresh and untested.",
    };
  });
};

// Same district as the governor: a serious balance risk, explained, never forbidden.
export const balanceRisk = (playerDistrict, dep) => dep && dep.district === playerDistrict
  ? { same: true, text: "Both of you come from the " + DISTRICTS[playerDistrict] + " district. The other two districts will say the ticket has nothing for them: expect weaker support there in the campaign and complaints of marginalisation in office. It is allowed, and it can be overcome, but it starts you behind." }
  : { same: false, text: "" };

/* Choosing someone other than the party's candidate. No blanket penalty:
   the party reacts, and the governor chooses how to settle it. */
export const PARTY_REACTION = [
  { id: "concede_post", label: "Give the party a big appointment", note: "The chairman names the Commissioner for Works. The machine stays with you.", pStab: 72, mandate: { type: "commissioner", ministryId: "works", ministryName: "Works & Infrastructure", source: "party", reason: "the price of choosing your own running mate" } },
  { id: "promise_ticket", label: "Promise their man the next Senate ticket", note: "Peace now; a promise the party will hold you to in your second term.", pStab: 70, promise: "Back the party's candidate for the Senate ticket" },
  { id: "refuse", label: "Refuse to bargain", note: "The chairman's faction sits on its hands in the campaign: weaker ward mobilisation in their district, and a cooler party in office.", pStab: 63, coldDistrict: true },
];
export const PARTY_ACCEPTED = { pStab: 76 };

/* What the ticket does to the campaign: the deputy's network lifts their
   district; a same-district ticket costs ground in the other two. */
export const campaignEffects = (playerDistrict, dep, reaction) => {
  const d = [0, 0, 0];
  if (!dep) return d;
  d[dep.district] += dep.kind === "mobiliser" ? 4 : dep.kind === "partyman" ? 2 : dep.kind === "newcomer" ? 1.5 : 0.5;
  if (dep.district === playerDistrict) [0, 1, 2].filter(x => x !== playerDistrict).forEach(x => { d[x] -= 3; });
  if (reaction === "refuse") { const cold = [0, 1, 2].find(x => x !== playerDistrict && x !== dep.district); if (cold != null) d[cold] -= 2; }
  return d.map(x => Math.round(x * 10) / 10);
};

/* In office, once a year from Year 2: does something come of this deputy?
   Seeded by name and year, so it is not the same script for everyone who
   picks a risky candidate, and a reload does not change it. */
export const deputyYear = (dep, year) => {
  if (!dep || !dep.kind || year < 2) return null;
  const r = seeded("depyear", dep.nm, year);
  if (year === 2 && dep.demand) return { type: "demand", demand: dep.demand };
  if (dep.hidden && r() < dep.hidden * .35 && !dep.surfaced) return { type: "scandal", text: dep.kind === "mobiliser" ? "Companies linked to Deputy Governor " + dep.nm + " won local government contracts in their district." : "Deputy Governor " + dep.nm + " failed to declare a business interest that is now in the news." };
  if (r() < dep.indep * .3) return { type: "independent", text: "Deputy Governor " + dep.nm + " publicly disagrees with one of your decisions." };
  return null;
};
