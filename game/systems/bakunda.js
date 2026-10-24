/* The Bakunda crisis (rules only, no React): a war storyline for the
   presidency in seven phases, one or two each year.
   1  News: unrest in Bakunda. The adviser's cable: a statement or an envoy.
   2  General Voko's coup. Nigerians stranded; refugees hit harder if the
      warning was ignored.
   3  The Axis: Bakunda's junta signs a pact with Ostrava.
   4  Commander-in-Chief: the briefing names the terrain; the Army, the Air
      Force or the Navy must match it. The Senate's approval comes first,
      or the emergency power and its approval within days.
   5  Summits: ECOWAS in Abuja, a conference in Geneva. Go, or send the
      Foreign Minister.
   6  War weariness each year the war goes on.
   7  Voko sues for peace: the treaty needs the National Assembly, then the
      front page, the adviser's congratulations and the legacy.
   All people and countries are fictional. Every roll is seeded. */
import { seeded } from "./rng.js";
import { keepWord } from "./office.js";

export const BAKUNDA_LEARN = {
  foreign: "Section 19: Nigeria's foreign policy aims to promote African integration and unity, and to respect international law. Day to day, it is the President's, through the Ministry of Foreign Affairs.",
  ecowas: "Under the ECOWAS Protocol on Democracy and Good Governance (2001), member states reject any unconstitutional change of government. Coup leaders face suspension and sanctions.",
  deploy: "Section 5(4)(b): the President may not send the armed forces on combat duty outside Nigeria without the Senate's prior approval. Section 5(5): in an imminent threat, the President may deploy first, but must ask the Senate within seven days.",
  war: "Section 5(4)(a): the President cannot declare a state of war with another country without the approval of the National Assembly in a joint sitting.",
  summit: "The ECOWAS Authority of Heads of State and Government is the community's highest body. It can impose sanctions and authorise a standby force.",
  ally: "Foreign military assistance comes with conditions: under United States law, units that receive training or equipment must be vetted for human-rights abuses. A partner's help can shorten a war, and bind how it is fought.",
  treaty: "Section 12: a treaty Nigeria signs has the force of law here only when the National Assembly enacts it. A peace accord that is never enacted binds no Nigerian court.",
  refugees: "Nigeria hosts refugees under the National Commission for Refugees, Migrants and Internally Displaced Persons, and the 1969 OAU Refugee Convention it ratified.",
};

const TERRAIN = {
  army: { what: "the land border and the roads into Bakunda", why: "The Axis is massing troops along 300 km of open border." },
  air: { what: "mountain training camps and the junta's command posts", why: "The Axis trains fighters in camps in the Bakundan highlands, out of reach by road." },
  navy: { what: "the lake and river routes that carry the Axis's supplies", why: "Ostravan arms reach Bakunda by boat across the lake every night." },
};
export const BAKUNDA_FORCES = {
  army: { l: "Deploy the Nigerian Army (mechanised infantry)", d: "Best for land borders and holding ground; slow, and the heaviest on the budget.", cost: 70, scene: null, who: "chief-of-army-staff" },
  air: { l: "Deploy the Nigerian Air Force (precision strikes)", d: "Fast, against command posts and camps; little hold on the ground.", cost: 50, scene: null, who: "chief-of-army-staff" },
  navy: { l: "Deploy the Navy and special amphibious forces", d: "For lake and river supply lines; useless far inland.", cost: 55, scene: null, who: "chief-of-army-staff" },
};

export const bakundaInit = (seed) => {
  const r = seeded(seed, "bakunda"), t = ["army", "air", "navy"][Math.floor(r() * 3)];
  return { stage: 0, warned: false, terrain: t, force: null, progress: 0, atWar: 0, summits: 0, senate: null, treaty: null, done: false, washington: null };
};

/* The year's cards. Each option carries fx (approval app, security sec,
   corruption cor), cost (₦B), npc (power-centre relationships), set (the
   storyline's new state), paper (a front page), learn, and say (the
   adviser's line when it lands). */
export const bakundaCards = (B, turn, ctx = {}) => {
  if (!B || B.done) return [];
  const out = [], nass = ctx.nass == null ? 50 : ctx.nass;
  if (B.stage === 0 && turn >= 1) out.push({ id: "bk1", kicker: "Breaking news · Bakunda", t: "Unrest boils over in the Republic of Bakunda", scene: "national-broadcast", who: "foreign-minister-nigeria",
    d: "Your adviser's cable: “Mr. President, intelligence indicates growing instability in Bakunda after a contested election. Recommend a cautious statement calling for calm, and that we monitor.”", learn: "foreign",
    opts: [{ id: "statement", l: "Issue a statement calling for calm", fx: { app: 0 }, set: { stage: 1, warned: false } },
      { id: "envoy", l: "Send a special envoy to Bakunda now", cost: 4, fx: { app: 1 }, npc: { army: 2 }, set: { stage: 1, warned: true }, say: "The envoy is on the ground. Whatever happens next, we will not be surprised." }] });
  if (B.stage === 1 && turn >= 2) out.push({ id: "bk2", kicker: "🔴 Urgent · Coup in Bakunda", t: "General Voko seizes power in Bakunda", scene: "coup-night", who: "foreign-head-of-state",
    d: "The President of Bakunda is overthrown. The constitution is suspended and the borders are sealed. Nigerian traders, students and businesses in the capital are stranded" + (B.warned ? "; your envoy already has a list of every Nigerian there." : ", and refugees are crossing into our northern states.") , learn: "ecowas",
    opts: [{ id: "airlift", l: "Airlift the stranded Nigerians home", cost: 12, fx: { app: B.warned ? 4 : 3 }, set: { stage: 2 }, say: "The jets are wheels up. Every Nigerian who wants to come home will come home.", flight: true },
      { id: "sanctions", l: "Lead ECOWAS to suspend Bakunda and impose sanctions", cost: 2, fx: { app: 1 }, npc: { nass: 3 }, set: { stage: 2 } },
      { id: "border", l: "Close our northern border", cost: 3, fx: { app: B.warned ? -1 : -3, sec: .01 }, set: { stage: 2 }, say: "The border is closed, but the families already across are in our camps now." }],
    spill: B.warned ? 0 : 3 });
  if (B.stage === 2 && turn >= 3) {
    const T = TERRAIN[B.terrain];
    out.push({ id: "bk3", kicker: "Commander-in-Chief · Defence Headquarters", t: "The Axis: Bakunda's junta pacts with Ostrava", bg: "situation-room", who: "chief-of-army-staff",
      d: "Voko has signed a mutual defence pact with Ostrava, and their generals meet in Bakunda's capital to plan regional defiance. The briefing: the threat lies in " + T.what + ". " + T.why, learn: "deploy",
      paper: ["REGIONAL TENSION: BAKUNDA JUNTA FORMS AXIS PACT", "Nigeria under pressure to lead", false],
      opts: Object.entries(BAKUNDA_FORCES).map(([k, F]) => ({ id: k, l: F.l, note: F.d, cost: F.cost, fx: { app: 1, sec: .01 }, npc: { army: 4, nass: nass >= 40 ? 0 : -6 }, set: { stage: 3, force: k, progress: k === B.terrain ? 40 : 15, atWar: 1 },
        say: k === B.terrain ? "The right force for that ground, Mr. President. The Axis did not expect it." : "We are committed, but this force is wrong for that ground. It will be slower." }))
        .concat([{ id: "talk", l: "Not yet: sanctions and talks only", fx: { app: -2 }, npc: { army: -6 }, set: { stage: 3, force: null, progress: 5, atWar: 1 }, say: "The Axis will read this as hesitation." }]) });
  }
  if (B.stage === 3 && B.summits < 2 && turn >= 4 + B.summits) out.push({ id: "bk4", kicker: "The world stage · Summit", t: B.summits ? "A UN conference in Geneva on the Axis" : "An ECOWAS extraordinary summit in Abuja", scene: B.summits ? "un-podium" : "guard-of-honour", who: "ecowas-envoy",
    d: "Heads of state want Nigeria to lead the response to the Axis. Your Foreign Minister can go in your place; in person, your word carries more, but the war at home waits.", learn: "summit",
    opts: [{ id: "attend", l: "Attend in person", cost: 6, fx: { app: 2 }, set: { summits: B.summits + 1, progress: B.progress + 15 }, say: "They listened to you, Mr. President. The sanctions now have teeth.", flight: true },
      { id: "send", l: "Send the Foreign Minister", cost: 1, fx: { app: 0 }, set: { summits: B.summits + 1, progress: B.progress + 6 } }] });
  // The wrong force for the ground, or talk without force, and the war stalls: each push counts for less and the years add up.
  const fits = !!B.force && B.force === B.terrain;
  if (B.stage === 3 && B.atWar >= 1 && B.progress < 70 && turn >= 4) out.push({ id: "bk6", kicker: "The war · year " + (B.atWar + 1), t: fits ? "“The people are tired of it”" : "The war is stalling", scene: "national-broadcast", who: "chief-of-army-staff",
    d: (fits ? "The conflict with Bakunda goes on. Funerals in the barracks towns, prices up in the north." : B.force ? "Our " + ({ army: "infantry", air: "air force", navy: "boats" })[B.force] + " cannot reach the Axis where it is strong: " + TERRAIN[B.terrain].what + ". We are bogged down." : "Sanctions alone have not moved Voko. The Axis is digging in.") + " Your Chief of Army Staff: “Public tolerance is wearing thin, Mr. President.”", learn: "war",
    stall: !fits,
    opts: [{ id: "offensive", l: "Order a decisive offensive", cost: 60, fx: { app: -1 }, npc: { army: 6 }, set: { progress: B.progress + (fits ? 30 : B.force ? 10 : 5), atWar: B.atWar + 1 }, say: fits ? "The offensive is working, Mr. President. They are falling back." : "We pushed, and the ground pushed back. With this force, it will take years." },
      { id: "address", l: "Address the nation: why we fight", fx: { app: 2 }, set: { progress: B.progress + (fits ? 8 : 3), atWar: B.atWar + 1 } },
      { id: "switch", l: "Change the force: " + BAKUNDA_FORCES[B.terrain].l.replace(/^Deploy /, "send ").replace(/ \(.*\)$/, "") + " for " + TERRAIN[B.terrain].what, cost: 45, fx: { app: 0 }, set: { force: B.terrain, progress: B.progress + 20, atWar: B.atWar + 1 }, hide: fits, say: "That is the right force for that ground. Now we can finish this." }].filter(o => !o.hide),
    fatigue: 2 + B.atWar });
  if (B.stage === 3 && !B.washington && B.atWar >= 1 && B.summits >= 1 && turn >= 5) out.push({ id: "bk5", kicker: "The world stage · Washington", t: "An invitation to the White House", scene: "presidential-jet", who: "foreign-minister-nigeria",
    d: "The President of the United States invites you to Washington. Bakunda is first on the agenda: intelligence sharing, equipment, and what the Americans will ask in return.", learn: "ally",
    opts: [{ id: "go", l: "Fly to Washington and meet in the Oval Office", cost: 8, fx: { app: 3 }, set: { washington: "went", progress: B.progress + 15 }, flight: true, paper: ["ABUJA AND WASHINGTON UNITE ON BAKUNDA", "The President meets his US counterpart in the Oval Office", true], say: "The Americans will share what their satellites see. That is worth a brigade." },
      { id: "minister", l: "Send the Foreign Minister", cost: 2, fx: { app: 0 }, set: { washington: "sent", progress: B.progress + 6 } },
      { id: "decline", l: "Decline: Africa will solve Africa's wars", fx: { app: 1 }, set: { washington: "declined" }, say: "Proud words, Mr. President. We fight alone." }] });
  if (B.stage === 3 && B.progress >= 70) out.push({ id: "bk7", kicker: "Peace · The National Assembly", t: "General Voko sues for peace", scene: "nass-joint-session", who: "senate-president",
    d: "The Axis is broken. Voko's envoys bring a peace accord: the junta hands over to a transitional government and Ostrava withdraws. It binds Nigeria only when the National Assembly enacts it." + (nass < 40 ? " The Senate President is cool towards you." : ""), learn: "treaty",
    opts: [{ id: "senate", l: "Send the accord to the National Assembly", fx: { app: 4 }, npc: { nass: 4 }, set: { stage: 4, treaty: nass >= 35 ? "enacted" : "stalled", done: nass >= 35 },
        paper: nass >= 35 ? ["REGIONAL WAR ENDS: ABUJA BROKERS HISTORIC PEACE ACCORD", "The National Assembly enacts the treaty", true] : null,
        say: nass >= 35 ? "Mr. President, you came through. History will remember this accord." : "The Senate is sitting on it. They want to be courted." },
      { id: "court", l: "Win the Senate over first, then send it", cost: 20, fx: { app: 3 }, npc: { nass: 10 }, set: { stage: 4, treaty: "enacted", done: true },
        paper: ["REGIONAL WAR ENDS: ABUJA BROKERS HISTORIC PEACE ACCORD", "The National Assembly enacts the treaty", true], say: "Mr. President, you came through. History will remember this accord." }] });
  if (B.stage === 4 && B.treaty === "stalled") out.push({ id: "bk7b", kicker: "Peace · The Senate", t: "The peace accord is stuck in the Senate", scene: "nass-joint-session", who: "senate-president",
    d: "Senators delay the accord while they bargain. The troops are still in Bakunda.", learn: "treaty",
    opts: [{ id: "deal", l: "Give them what they want", cost: 25, fx: { cor: .01 }, npc: { nass: 12 }, set: { treaty: "enacted", done: true }, paper: ["REGIONAL WAR ENDS: ABUJA BROKERS HISTORIC PEACE ACCORD", "The Senate relents", true], say: "It is done, Mr. President. Peace, and in the law." },
      { id: "public", l: "Go to the people: name the senators", fx: { app: 3 }, npc: { nass: -6 }, set: { treaty: "enacted", done: true }, paper: ["PUBLIC PRESSURE: SENATE ENACTS PEACE ACCORD", "Abuja's war is over", true], say: "The people carried it, Mr. President." }] });
  return out.map(c => ({ ...c, kicker: keepWord(c.kicker), t: keepWord(c.t), d: keepWord(c.d) }));
};

// The storyline after a choice.
export const bakundaAfter = (B, o) => ({ ...B, ...(o.set || {}) });
export const bakundaLegacy = (B) => !B ? null : B.done ? "Led the regional war against the Bakunda–Ostrava Axis and brokered the peace accord the National Assembly enacted." : B.stage >= 3 ? "Took Nigeria to war against the Bakunda–Ostrava Axis; the conflict was unresolved when the term ended." : null;
