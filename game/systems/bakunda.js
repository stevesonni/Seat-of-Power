/* The Bakunda war (rules only, no React): the presidency's war storyline,
   told the iCivics way.
   1  The news: unrest in Bakunda. The ambassador's cable: a statement or an envoy.
   2  General Voko's coup. Nigerians stranded; refugees hit harder if the
      warning was ignored.
   3  The Axis with Ostrava. The National Assembly sends its resolution
      sanctioning war (S.5(4)(a)): assent and go to war, or veto and rely on
      sanctions and diplomacy.
   4  At war: missions from Defence Headquarters. Each names a threat and
      the ground it is on; deploy the Army, the Navy or the Air Force, or
      stay out. The right force wins the front page; the wrong one stalls.
      Diplomacy letters arrive too: ECOWAS, the Lake Chad neighbours,
      London, Geneva, Washington. Allies end the war sooner.
   5  War weariness each year it goes on.
   6  The junta surrenders: the signing in Geneva, then the peace treaty the
      National Assembly must enact (S.12). The end of the war.
   All people and countries but Nigeria and its real institutions are
   fictional. Every pick is seeded. */
import { seeded } from "./rng.js";
import { keepWord } from "./office.js";

export const BAKUNDA_LEARN = {
  foreign: "Section 19: Nigeria's foreign policy aims to promote African integration and unity, and to respect international law. Day to day, it is the President's, through the Ministry of Foreign Affairs.",
  ecowas: "Under the ECOWAS Protocol on Democracy and Good Governance (2001), member states reject any unconstitutional change of government. Coup leaders face suspension and sanctions.",
  deploy: "Section 5(4)(b): the President may not send the armed forces on combat duty outside Nigeria without the Senate's prior approval. Section 5(5): in an imminent threat, the President may deploy first, but must ask the Senate within seven days.",
  war: "Section 5(4)(a): the President cannot declare a state of war with another country without the approval of the National Assembly in a joint sitting. Section 218: the President is Commander-in-Chief of the armed forces.",
  forces: "Nigeria's armed forces are the Army, the Navy and the Air Force (Section 217). Each fits different ground: the Army takes and holds land, the Navy rules water, the Air Force strikes far and fast but cannot hold ground.",
  summit: "The ECOWAS Authority of Heads of State and Government is the community's highest body. It can impose sanctions and authorise a standby force.",
  ally: "Foreign military assistance comes with conditions: under United States law, units that receive training or equipment must be vetted for human-rights abuses. A partner's help can shorten a war, and bind how it is fought.",
  treaty: "Section 12: a treaty Nigeria signs has the force of law here only when the National Assembly enacts it. A peace accord that is never enacted binds no Nigerian court.",
  refugees: "Nigeria hosts refugees under the National Commission for Refugees, Migrants and Internally Displaced Persons, and the 1969 OAU Refugee Convention it ratified.",
};

// The three services, what each is for (the army chief's advice) and their cost (₦B).
export const BAKUNDA_FORCES = {
  army: { nm: "Army", l: "Deploy the Army", d: "The Army takes and holds ground: borders, roads, villages. Slow and the most costly, but nothing else can keep land.", cost: 40, scene: "army-convoy", icon: "🪖" },
  navy: { nm: "Navy", l: "Deploy the Navy", d: "The Navy and its special boat teams rule the lakes and rivers: patrols, rescues, cutting supplies by water. Of no use far inland.", cost: 25, scene: "navy-patrol", icon: "⚓" },
  air: { nm: "Air Force", l: "Deploy the Air Force", d: "The Air Force strikes fast and far: mountain camps, command posts deep in Bakunda. It cannot hold ground.", cost: 30, scene: "air-strike", icon: "✈️" },
};

/* Missions from Defence Headquarters: the threat, the ground, the force it
   needs, and the front page if it works. */
export const BAKUNDA_MISSIONS = [
  { id: "lake", need: "navy", d: "Bakundan gunboats are massing on Lake Chad and threaten our fishing towns on the shore.", win: ["LAKE CHAD SAFE AGAIN", "Navy patrols drive off the junta's gunboats"] },
  { id: "camps", need: "air", d: "The Axis trains fighters in camps high in the Bakundan mountains. The only way to reach them is by air.", win: ["AXIS TRAINING CAMP DESTROYED", "Air Force strikes enemy camps in the highlands"] },
  { id: "villages", need: "army", d: "Bakundan troops have crossed the border and hold three villages in Yobe. We need a large land force to push them out.", win: ["YOBE VILLAGES FREED", "The Army drives the junta's troops back over the border"] },
  { id: "hostages", need: "navy", d: "Nigerian aid workers are held on a barge on the Komadugu River, heavily guarded.", win: ["AID WORKERS COME HOME", "Navy special boat team frees the hostages"] },
  { id: "airstrip", need: "air", d: "The Axis commanders are meeting at a desert airstrip deep inside Bakunda, far beyond the reach of our roads.", win: ["AXIS ALLIANCE INTERRUPTED", "Air Force strikes the commanders' meeting"] },
  { id: "convoy", need: "army", d: "Ostravan arms convoys are rolling down the Saharan highway into Bakunda. The generals want a land force astride the road.", win: ["ARMS ROUTE CUT", "The Army holds the Saharan highway"] },
  { id: "ally", need: "army", d: "Bakunda has invaded the Republic of Sabelle, our ECOWAS ally to the north-west. It is a land war, and Sabelle asks for our troops.", win: ["NIGERIA STANDS BY ITS ALLY", "Our troops answer Sabelle's call"] },
  { id: "hackers", need: "air", d: "Junta hackers have broken into our military communications. The generals suggest an air strike on their cyber headquarters.", win: ["JUNTA HACKERS SILENCED", "Air Force hits the cyber headquarters"] },
];

/* Diplomacy while the war goes on: each letter (game/systems/trips.js) and
   its front page if the President goes in person. */
export const BAKUNDA_DIPLOMACY = [
  { id: "ecowas", letter: "bk4_abuja", t: "An ECOWAS extraordinary summit in Abuja", scene: "ecowas-summit", win: ["WEST AFRICA UNITES AGAINST THE AXIS", "ECOWAS leaders back Nigeria's lead"] },
  { id: "chad", letter: "bk_chad", t: "The Lake Chad neighbours meet in N'Djamena", scene: "ecowas-summit", win: ["LAKE CHAD NEIGHBOURS UNITE OVER THREAT", "A new joint defence plan for the basin"] },
  { id: "london", letter: "bk_london", t: "An invitation to London", scene: null, win: ["LEADERS MEET IN LONDON", "Bakunda discussed; the UK offers support"] },
  { id: "geneva", letter: "bk4_geneva", t: "The UN calls the world to Geneva", scene: "geneva-conference", win: ["NATIONS UNITE AGAINST THE AXIS", "Pressure mounts with Nigeria's leadership"] },
  { id: "washington", letter: "bk5", t: "An invitation to the White House", scene: "oval-office", win: ["ABUJA AND WASHINGTON UNITE ON BAKUNDA", "The President meets his US counterpart in the Oval Office"] },
];

export const bakundaInit = (seed) => ({ seed: String(seed), stage: 0, warned: false, progress: 0, atWar: 0, resolution: null, sits: [], dipl: [], treaty: null, done: false, washington: null, tipped: false });

// News for the anchors at each beat: [his line, her line].
const NEWS = {
  bk1: ["In world news: trouble is brewing in the Republic of Bakunda after a disputed election.", "Abuja is watching closely. Tough days may lie ahead for the region."],
  bk2: ["Breaking: General Voko has seized power in Bakunda. Nigerians are stranded there.", "Right. War may be inevitable, and Nigeria is preparing for the worst."],
  bk3: ["The junta has signed a pact with Ostrava. The National Assembly is meeting in joint session.", "On the table: a resolution sanctioning war. It now goes to the President."],
  war: ["The nation's worst fears have come true: the National Assembly has sanctioned war on the Axis.", "The President must now lead as Commander-in-Chief."],
  weary: ["The conflict with Bakunda continues.", "At least the President is working hard to keep it under control."],
  peace: ["The war is over! Bakunda has surrendered.", "The peace treaty was signed in Geneva. Now the National Assembly must enact it."],
};

/* The year's cards. A card: id, kind (letter, mission, document or card),
   kicker, t, d, learn, news (anchors), and opts. An option: fx (approval
   app, security sec, corruption cor), cost (₦B), npc, set (the storyline's
   new state), paper, say (the army chief's line), flight. */
export const bakundaCards = (B0, turn, ctx = {}) => {
  if (!B0 || B0.done) return [];
  const B = { sits: [], dipl: [], ...B0 }, out = [], nass = ctx.nass == null ? 50 : ctx.nass;
  if (B.stage === 0 && turn >= 1) out.push({ id: "bk1", kind: "letter", letter: "bk1", kicker: "Bakunda · A cable", t: "Unrest boils over in the Republic of Bakunda", news: NEWS.bk1, learn: "foreign",
    d: "The ambassador's cable: instability after a contested election. A cautious statement, or an envoy now?",
    opts: [{ id: "statement", l: "Issue a statement calling for calm", img: "scenes/national-broadcast", fx: { app: 0 }, set: { stage: 1, warned: false }, paper: ["ABUJA CALLS FOR CALM IN BAKUNDA", "The President urges restraint after the disputed election", true], paperImg: "national-broadcast" },
      { id: "envoy", l: "Send a special envoy now", cost: 4, fx: { app: 1 }, npc: { army: 2 }, set: { stage: 1, warned: true }, paper: ["PRESIDENT SENDS SPECIAL ENVOY TO BAKUNDA", "Abuja moves early as unrest spreads", true], paperImg: "bakunda-coup", say: "The envoy is on the ground. Whatever happens next, we will not be surprised." }] });
  if (B.stage === 1 && turn >= 2) out.push({ id: "bk2", kind: "card", kicker: "🔴 Urgent · Coup in Bakunda", t: "General Voko seizes power in Bakunda", scene: "bakunda-coup", news: NEWS.bk2, learn: "ecowas",
    d: "The President of Bakunda is overthrown, the constitution suspended and the borders sealed. Nigerian traders and students are stranded" + (B.warned ? "; your envoy already has a list of every Nigerian there." : ", and refugees are crossing into our northern states."),
    opts: [{ id: "airlift", l: "Airlift the stranded Nigerians home", cost: 12, fx: { app: B.warned ? 4 : 3 }, img: "scenes/airlift-evacuation", set: { stage: 2 }, paper: ["OPERATION HOMECOMING: NIGERIANS FLOWN OUT OF BAKUNDA", "Air Force jets bring stranded citizens home", true], paperImg: "airlift-evacuation", say: "The jets are wheels up. Every Nigerian who wants to come home will come home.", flight: true },
      { id: "sanctions", l: "Lead ECOWAS to suspend Bakunda and impose sanctions", cost: 2, fx: { app: 1 }, npc: { nass: 3 }, img: "characters/general-voko-angry", set: { stage: 2 }, paper: ["ECOWAS SUSPENDS BAKUNDA AT NIGERIA'S URGING", "Sanctions on General Voko's junta", true], paperImg: "ecowas-summit" },
      { id: "border", l: "Close our northern border", cost: 3, fx: { app: B.warned ? -1 : -3, sec: .01 }, img: "scenes/refugees-border", set: { stage: 2 }, paper: ["NIGERIA SHUTS NORTHERN BORDER", "Families already across fill the camps", false], paperImg: "refugees-border", say: "The border is closed, but the families already across are in our camps now." }],
    spill: B.warned ? 0 : 3 });
  // The National Assembly's resolution: assent, or veto and rely on sanctions and talks.
  if (B.stage === 2 && turn >= 3) out.push({ id: "bk3", kind: "document", kicker: "WAR", t: "Resolution of the National Assembly: a state of war with the Bakunda–Ostrava Axis", news: NEWS.bk3, learn: "war",
    d: "The National Assembly, in joint session, finds that the junta of Bakunda, in pact with Ostrava, threatens the territory of Nigeria and the peace of West Africa. Under Section 5(4)(a) it sanctions a declaration of war, and authorises the President, as Commander-in-Chief, to direct the armed forces to bring the conflict to a successful end.",
    sign: "The President of the Federal Republic of Nigeria", paperImg: "axis-summit",
    opts: [{ id: "assent", l: "Assent: declare war", fx: { app: 2, sec: .01 }, npc: { army: 4 }, set: { stage: 3, atWar: 1, resolution: "passed" }, paper: ["NIGERIA DECLARES WAR ON THE BAKUNDA AXIS", "The National Assembly's resolution signed", false],
        say: "Your Excellency, there have been major developments. Watch your mail for missions from Defence Headquarters, and act as Commander-in-Chief." },
      { id: "veto", l: "Veto: sanctions and talks only", fx: { app: -2 }, npc: { army: -6, nass: -3 }, set: { stage: 3, atWar: 0, resolution: "vetoed" }, paper: ["PRESIDENT VETOES WAR RESOLUTION", "Sanctions and diplomacy against the Bakunda Axis", false], paperImg: "axis-summit", say: "No war, then. Diplomacy alone will be slow, Your Excellency. The Axis will read it as hesitation." }] });
  if (B.stage === 3 && B.progress < 100) {
    const r = seeded("bakunda", B.seed || "b", turn);
    // Missions from Defence Headquarters: two a year while at war.
    if (B.atWar >= 1 && turn >= 4) {
      const left = BAKUNDA_MISSIONS.filter(m => !B.sits.includes(m.id));
      const picks = []; while (picks.length < 2 && left.length) picks.push(left.splice(Math.floor(r() * left.length), 1)[0]);
      picks.forEach((m, i) => out.push({ id: "bkm_" + m.id, kind: "mission", mission: m.id, need: m.need, kicker: "MILITARY", t: m.d, learn: "forces",
        d: m.d, opts: Object.entries(BAKUNDA_FORCES).map(([k, F]) => ({ id: k, l: F.l, note: F.d, cost: F.cost, fx: { app: k === m.need ? 2 : -1, sec: k === m.need ? .01 : 0 }, npc: { army: k === m.need ? 3 : -2 },
          img: "scenes/" + F.scene, push: { sits: m.id }, add: { progress: k === m.need ? 25 : 6, atWar: i === 0 ? 1 : 0 },
          paper: k === m.need ? [m.win[0], m.win[1], true] : ["THE WRONG FORCE FOR THE GROUND", "Our " + F.nm + " could not reach the enemy · the junta holds", false],
          say: k === m.need ? "The right force for that ground, Your Excellency. The Axis did not expect it." : "We are committed, but the " + F.nm + " is wrong for that ground. It stalls us." }))
          .concat([{ id: "stay", l: "Don't get involved", fx: { app: -2 }, npc: { army: -4 }, push: { sits: m.id }, add: { atWar: i === 0 ? 1 : 0 }, paper: ["NIGERIA STANDS ASIDE", "The Axis presses on", false], say: "We stood back, Your Excellency. The Axis will not." }]) }));
    }
    // Diplomacy: one letter a year, in order. Allies end the war sooner.
    const D = BAKUNDA_DIPLOMACY.find(x => !B.dipl.includes(x.id));
    if (D && turn >= 4) {
      const go = B.atWar ? 12 : 22, send = B.atWar ? 5 : 9;
      out.push({ id: "bkd_" + D.id, kind: "letter", letter: D.letter, kicker: "The world stage · Bakunda", t: D.t, learn: D.id === "washington" ? "ally" : "summit",
        opts: [{ id: "go", l: "Attend in person", cost: 6, fx: { app: 2 }, push: { dipl: D.id }, add: { progress: go }, set: D.id === "washington" ? { washington: "went" } : {}, flight: true, dest: D.id, paper: [D.win[0], D.win[1], true], paperImg: D.scene, img: D.scene ? "scenes/" + D.scene : null,
            ally: D.id === "washington" ? "The United States will share what its satellites see, and send equipment. Nigeria leads; we stand with you." : null },
          { id: "send", l: "Send the Foreign Minister", cost: 1, fx: { app: 0 }, push: { dipl: D.id }, add: { progress: send }, set: D.id === "washington" ? { washington: "sent" } : {}, paper: ["FOREIGN MINISTER REPRESENTS NIGERIA: " + D.t.replace(/^(An |A |The )/, "").toUpperCase(), "The President stays home; allies note the absence", false], paperImg: D.scene }] });
    }
    // The army chief's tip, once: allies matter.
    if (B.atWar >= 1 && turn >= 4 && !B.tipped) out.push({ id: "bk_tip", kind: "tip", t: "Keep a sharp eye out for diplomacy letters in your mail, Your Excellency. Working with allies will end this war sooner, and better for us.", set: { tipped: true } });
    // War weariness, from the second year of war.
    if (B.atWar >= 2) out.push({ id: "bk6", kind: "card", kicker: "The war · year " + B.atWar, t: "“The people are tired of it”", scene: "war-weariness", news: NEWS.weary, learn: "war",
      d: "The war rages on. Funerals in the barracks towns, prices up in the north. Your army chief: “The people want to see us win it as soon as possible.”", fatigue: 1 + B.atWar,
      opts: [{ id: "address", l: "Address the nation: why we fight", img: "scenes/national-broadcast", fx: { app: 2 }, set: {}, paper: ["“WE FIGHT FOR PEACE”: PRESIDENT ADDRESSES THE NATION", "War-weary Nigerians hear the case for the war", true], paperImg: "national-broadcast" },
        { id: "push", l: "Order a decisive push", cost: 30, fx: { app: -1 }, npc: { army: 4 }, add: { progress: 10 }, paper: ["PRESIDENT ORDERS DECISIVE PUSH ON THE AXIS", "Troops press on every front", true], paperImg: "army-convoy", say: "We will press them on every front, Your Excellency." }] });
  }
  // The junta surrenders: the signing in Geneva.
  if (B.stage === 3 && B.progress >= 100) out.push({ id: "bk7", kind: "letter", letter: "bk_surrender", kicker: "Peace", t: "Bakunda surrenders", news: NEWS.peace, learn: "treaty",
    opts: [{ id: "go", l: "Attend in person", cost: 5, fx: { app: 4 }, set: { stage: 4 }, flight: true, dest: "signing", paper: ["BAKUNDA SURRENDERS!", "The UN hosts the signing of the peace treaty in Geneva", true], paperImg: "peace-signing", img: "scenes/peace-signing" },
      { id: "send", l: "Send the Foreign Minister", cost: 1, fx: { app: 1 }, set: { stage: 4 }, paper: ["BAKUNDA SURRENDERS!", "Nigeria's Foreign Minister signs the treaty in Geneva", true], paperImg: "peace-signing", img: "scenes/peace-signing" }] });
  // The peace treaty goes to the National Assembly.
  if (B.stage === 4 && !B.treaty) out.push({ id: "bk8", kind: "document", kicker: "PEACE TREATY", t: "The Peace Treaty with Bakunda and Ostrava", learn: "treaty",
    d: "This treaty marks the official end of the state of war between Nigeria and the Bakunda–Ostrava Axis. All further acts of military force, on the ground, in the air or on the water, are prohibited. The junta hands over to a transitional government, and Ostrava withdraws. From this day the parties pledge to keep the peace of West Africa.",
    sign: "For the consent of the National Assembly (S.12)", paperImg: "treaty-vote",
    opts: [{ id: "senate", l: "Send it to the National Assembly", fx: { app: 4 }, npc: { nass: 4 }, set: { treaty: nass >= 35 ? "enacted" : "stalled", done: nass >= 35 },
        paper: nass >= 35 ? ["REGIONAL WAR ENDS: ABUJA'S PEACE IS LAW", "The National Assembly enacts the treaty", true] : ["PEACE TREATY STALLS IN THE SENATE", "Senators bargain while troops wait on the border", false], img: nass >= 35 ? "scenes/treaty-vote" : "objects/peace-accord",
        say: nass >= 35 ? "What a relief! The war is finally over. You really came through, Your Excellency." : "The Senate is sitting on it. They want to be courted." },
      { id: "court", l: "Win the Senate over first, then send it", cost: 20, fx: { app: 3 }, npc: { nass: 10 }, set: { treaty: "enacted", done: true }, img: "scenes/treaty-vote",
        paper: ["REGIONAL WAR ENDS: ABUJA'S PEACE IS LAW", "The National Assembly enacts the treaty", true], say: "What a relief! The war is finally over. You really came through, Your Excellency." }] });
  if (B.stage === 4 && B.treaty === "stalled") out.push({ id: "bk7b", kind: "card", kicker: "Peace · The Senate", t: "The peace treaty is stuck in the Senate", bg: "senate-chamber", obj: "peace-accord", learn: "treaty",
    d: "Senators delay the treaty while they bargain. Until it is law, our troops stay on the border.",
    opts: [{ id: "deal", l: "Give them what they want", cost: 25, fx: { cor: .01 }, npc: { nass: 12 }, set: { treaty: "enacted", done: true }, img: "scenes/treaty-vote", paperImg: "treaty-vote", paper: ["REGIONAL WAR ENDS: ABUJA'S PEACE IS LAW", "The Senate relents", true], say: "What a relief! The war is finally over." },
      { id: "public", l: "Go to the people: name the senators", fx: { app: 3 }, npc: { nass: -6 }, set: { treaty: "enacted", done: true }, img: "scenes/treaty-vote", paperImg: "treaty-vote", paper: ["PUBLIC PRESSURE: SENATE ENACTS PEACE TREATY", "Abuja's war is over", true], say: "The people carried it. The war is finally over." }] });
  return out.map(c => ({ ...c, kicker: keepWord(c.kicker || ""), t: keepWord(c.t), d: c.d ? keepWord(c.d) : c.d }));
};

// The storyline after a choice.
export const bakundaAfter = (B, o) => {
  const n = { sits: [], dipl: [], ...B, ...(o.set || {}) };
  Object.entries(o.add || {}).forEach(([k, v]) => { n[k] = (n[k] || 0) + v; });
  Object.entries(o.push || {}).forEach(([k, v]) => { n[k] = [...(n[k] || []), v]; });
  return n;
};
export const bakundaLegacy = (B) => !B ? null : B.done ? "Led Nigeria through the war against the Bakunda–Ostrava Axis to the peace treaty the National Assembly enacted." : B.stage >= 3 && B.resolution === "passed" ? "Took Nigeria to war against the Bakunda–Ostrava Axis; the conflict was unresolved when the term ended." : B.stage >= 3 ? "Answered the Bakunda–Ostrava Axis with sanctions and diplomacy; the conflict was unresolved when the term ended." : null;
