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
   Pacing: every year until it is resolved, two decisions and one trip.
   Each beat starts with the Chief of Army Staff in person ("alarm"), then an
   URGENT: BAKUNDA letter with its own seal; each decision carries his advice.
   All people and countries but Nigeria and its real institutions are
   fictional. Every pick is seeded. */
import { seeded } from "./rng.js";
import { keepWord } from "./office.js";

export const BAKUNDA_LEARN = {
  foreign: "Section 19: Nigeria's foreign policy aims to promote African integration and unity, and to respect international law. Day to day, it is the President's, through the Ministry of Foreign Affairs.",
  ecowas: "Under the ECOWAS Protocol on Democracy and Good Governance (2001), member states reject any unconstitutional change of government. Coup leaders face suspension and sanctions.",
  deploy: "Section 5(4)(b): the President may not send the armed forces on combat duty outside Nigeria without the Senate's prior approval. Section 5(5): in an imminent threat, the President may deploy first, but must ask the Senate within seven days.",
  war: "Section 5(4)(a): the President cannot declare a state of war with another country without the approval of the National Assembly in a joint sitting. Section 218: the President is Commander-in-Chief of the armed forces.",
  forces: "Nigeria's armed forces are the Army, the Navy and the Air Force (Section 217). Each fits different ground: the Army takes and holds land, the Navy rules water, the Air Force strikes far and fast but cannot hold ground. The Navy's Special Boat Service is its commando arm, for raids and rescues from the water.",
  summit: "The ECOWAS Authority of Heads of State and Government is the community's highest body. It can impose sanctions and authorise a standby force.",
  ally: "Foreign military assistance comes with conditions: under United States law, units that receive training or equipment must be vetted for human-rights abuses. A partner's help can shorten a war, and bind how it is fought.",
  treaty: "Section 12: a treaty Nigeria signs has the force of law here only when the National Assembly enacts it. A peace accord that is never enacted binds no Nigerian court.",
  refugees: "Nigeria hosts refugees under the National Commission for Refugees, Migrants and Internally Displaced Persons, and the 1969 OAU Refugee Convention it ratified.",
};

// The three services, what each is for (the army chief's advice) and their cost (₦B).
export const BAKUNDA_FORCES = {
  army: { nm: "Army", l: "Deploy the Army", d: "The Army takes and holds ground: borders, roads, villages. Slow and the most costly, but nothing else can keep land.", cost: 40, scene: "army-convoy", icon: "🪖" },
  navy: { nm: "Navy", l: "Deploy the Navy", d: "The Navy rules the lakes and rivers: patrols, blockades, cutting supplies by water. Of no use far inland.", cost: 25, scene: "navy-patrol", icon: "⚓" },
  air: { nm: "Air Force", l: "Deploy the Air Force", d: "The Air Force strikes fast and far: mountain camps, command posts deep in Bakunda. It cannot hold ground.", cost: 30, scene: "air-strike", icon: "✈️" },
  // The Navy's Special Boat Service: commandos from the water.
  sbs: { nm: "SBS", full: "Special Boat Service", l: "Send in the Special Boat Service", d: "The SBS are the Navy's commandos: small teams that strike from the water by night. Rescues, raids on boats and islands. Too few to hold ground or fight a battle.", cost: 15, scene: "sbs-raid", icon: "🔱" },
};

/* Missions from Defence Headquarters: the threat, the ground, the force it
   needs, and the front page if it works. */
export const BAKUNDA_MISSIONS = [
  { id: "lake", need: "navy", d: "Bakundan gunboats are massing on Lake Chad and threaten our fishing towns on the shore.", win: ["LAKE CHAD SAFE AGAIN", "Navy patrols drive off the junta's gunboats"] },
  { id: "camps", need: "air", d: "The Axis trains fighters in camps high in the Bakundan mountains. The only way to reach them is by air.", win: ["AXIS TRAINING CAMP DESTROYED", "Air Force strikes enemy camps in the highlands"] },
  { id: "villages", need: "army", d: "Bakundan troops have crossed the border and hold three villages in Yobe. We need a large land force to push them out.", win: ["YOBE VILLAGES FREED", "The Army drives the junta's troops back over the border"] },
  { id: "hostages", need: "sbs", d: "Nigerian aid workers are held on a barge on the Komadugu River, heavily guarded.", win: ["AID WORKERS COME HOME", "SBS commandos free the hostages by night"] },
  { id: "islands", need: "sbs", d: "Junta raiders use the reed islands of Lake Chad as a hidden base for attacks on our shore towns.", win: ["LAKE CHAD RAIDERS' BASE DESTROYED", "SBS commandos clear the reed islands"] },
  { id: "port", need: "sbs", d: "Ostravan arms are being unloaded at night at a small river jetty inside Bakunda. A big force would be seen coming.", win: ["AXIS ARMS JETTY BLOWN UP", "A silent SBS raid stops the shipments"] },
  { id: "airstrip", need: "air", d: "The Axis commanders are meeting at a desert airstrip deep inside Bakunda, far beyond the reach of our roads.", win: ["AXIS ALLIANCE INTERRUPTED", "Air Force strikes the commanders' meeting"] },
  { id: "convoy", need: "army", d: "Ostravan arms convoys are rolling down the Saharan highway into Bakunda. The generals want a land force astride the road.", win: ["ARMS ROUTE CUT", "The Army holds the Saharan highway"] },
  { id: "ally", need: "army", d: "Bakunda has invaded the Republic of Sabelle, our ECOWAS ally to the north-west. It is a land war, and Sabelle asks for our troops.", win: ["NIGERIA STANDS BY ITS ALLY", "Our troops answer Sabelle's call"] },
  { id: "hackers", need: "air", d: "Junta hackers have broken into our military communications. The generals suggest an air strike on their cyber headquarters.", win: ["JUNTA HACKERS SILENCED", "Air Force hits the cyber headquarters"] },
  { id: "island", need: "sbs", d: "Axis saboteurs who blew up a gas pipeline near the border are hiding on a river island, waiting for a boat out.", win: ["PIPELINE SABOTEURS CAPTURED", "SBS commandos take the river island at dawn"] },
  { id: "radar", need: "air", d: "An Axis radar station on a mountain top inside Bakunda guides their drones onto our troops.", win: ["AXIS RADAR KNOCKED OUT", "Air Force strike blinds the junta's drones"] },
  { id: "pontoon", need: "air", d: "Junta engineers are building a pontoon bridge across the border river at night, to move tanks into Borno.", win: ["JUNTA'S BRIDGE DESTROYED", "The Air Force sinks the pontoon before the tanks cross"] },
  { id: "camp", need: "army", d: "Junta raiders are attacking a refugee camp inside Nigeria to drag back the families who fled them.", win: ["REFUGEE CAMP DEFENDED", "The Army drives off the junta's raiders"] },
  { id: "mines", need: "navy", d: "The Axis has laid mines in the Lake Chad shipping lanes. Two fishing boats have already been blown up.", win: ["LAKE CHAD CLEARED OF MINES", "Navy minesweepers reopen the shipping lanes"] },
  { id: "pows", need: "sbs", d: "Twelve captured Nigerian soldiers are held in an old river fort inside Bakunda. The junta plans to parade them on television.", win: ["OUR SOLDIERS COME HOME", "SBS commandos free the prisoners from the river fort"] },
  { id: "depot", need: "air", d: "A fuel depot at a desert oasis keeps the junta's tanks moving. It is three hundred kilometres from our nearest base.", win: ["JUNTA FUEL DEPOT ABLAZE", "The Air Force cuts the tanks' fuel at the oasis"] },
  { id: "market", need: "army", d: "Junta troops have dug in around the market of a border town, using the traders as cover.", win: ["BORDER TOWN LIBERATED", "The Army clears the market house by house"] },
];

/* Diplomacy while the war goes on: each letter (game/systems/trips.js) and
   its front page if the President goes in person. */
export const BAKUNDA_DIPLOMACY = [
  { id: "ecowas", letter: "bk4_accra", t: "An ECOWAS extraordinary summit in Accra", scene: "ecowas-summit", win: ["WEST AFRICA SPEAKS WITH ONE VOICE ON BAKUNDA", "ECOWAS leaders back Nigeria's lead"] },
  { id: "chad", letter: "bk_chad", t: "The Lake Chad neighbours meet in N'Djamena", scene: "ecowas-summit", win: ["LAKE CHAD NEIGHBOURS UNITE OVER THREAT", "A new joint defence plan for the basin"] },
  { id: "london", letter: "bk_london", t: "An invitation to London", scene: "london-westminster", win: ["LEADERS MEET IN LONDON", "Bakunda discussed; the UK offers support"] },
  { id: "washington", letter: "bk5", from: 3, t: "An invitation to the White House", scene: "oval-office", win: ["PRESSURE GROWS: US ADDS IMPETUS", "In the Oval Office, Washington pledges ₦30B and US Marines to Nigeria's fight"] },
  { id: "geneva", letter: "bk4_geneva", t: "The UN calls the world to Geneva", scene: "geneva-conference", win: ["NATIONS UNITE AGAINST THE AXIS", "Pressure mounts with Nigeria's leadership"] },
];

/* Without a war (the resolution vetoed): two of these a year, pressure
   short of war. Each keeps the front page. */
export const BAKUNDA_PRESSURE = [
  { id: "assets", t: "The junta's money in Nigerian banks", d: "General Voko and his officers keep millions in Nigerian banks.", advice: "Freeze it. Nothing hurts a junta faster than unpaid soldiers.",
    opts: [{ id: "freeze", l: "Freeze the junta's accounts", add: { progress: 12 }, fx: { app: 1 }, paper: ["JUNTA'S MILLIONS FROZEN IN NIGERIA", "The President hits General Voko's wallet", true] },
      { id: "leave", l: "Leave the accounts alone", fx: { cor: .01 }, paper: ["JUNTA BANKS IN NIGERIA UNTOUCHED", "Critics ask whose money is protected", false] }] },
  { id: "power", t: "Our electricity powers their capital", d: "Nigeria sells electricity to Bakunda over the northern line. Kassara City runs on it.", advice: "Cut it and the junta sits in the dark. Our border towns on the same line will suffer a little.",
    opts: [{ id: "cut", l: "Cut the power line", add: { progress: 14 }, fx: { app: -1 }, paper: ["LIGHTS OUT IN KASSARA CITY", "Nigeria cuts the junta's power", true] },
      { id: "keep", l: "Keep selling: we need the money", cost: -2, fx: { app: -1 }, paper: ["NIGERIA STILL POWERS THE JUNTA", "Business as usual on the northern line", false] }] },
  { id: "smuggle", t: "Fuel smugglers on Lake Chad", d: "Junta smugglers move our fuel across Lake Chad by night to keep the Axis running.", advice: "This is work for the Special Boat Service. Customs alone will not stop them.",
    opts: [{ id: "sbs", l: "Send the SBS to stop them", cost: 8, add: { progress: 15 }, fx: { app: 2, sec: .01 }, img: "scenes/sbs-raid", paper: ["SBS SEIZES JUNTA FUEL BOATS", "Night raids on Lake Chad cut the Axis supply", true], paperImg: "sbs-raid" },
      { id: "customs", l: "Leave it to Customs", cost: 1, add: { progress: 3 }, paper: ["SMUGGLING GOES ON ACROSS LAKE CHAD", "Customs patrols overwhelmed", false] }] },
  { id: "radio", t: "Bakunda's democrats ask for a voice", d: "Bakunda's exiled democrats want a radio station on our side of the border to reach their people.", advice: "A free voice is cheaper than a battalion. The junta will be furious.",
    opts: [{ id: "fund", l: "Fund the radio station", cost: 2, add: { progress: 10 }, fx: { app: 1 }, paper: ["RADIO FREE BAKUNDA ON AIR FROM NIGERIA", "The junta's people hear the other side", true] },
      { id: "refuse", l: "Refuse: it is their fight", paper: ["NIGERIA TURNS AWAY BAKUNDA'S DEMOCRATS", "The exiles look elsewhere", false] }] },
  { id: "embargo", t: "An arms embargo at the United Nations", d: "Nigeria can draft a UN arms embargo on the Axis, if we are willing to lead it.", advice: "If we lead it, others follow. If we don't, nobody will.",
    opts: [{ id: "lead", l: "Draft and lead the embargo", cost: 1, add: { progress: 12 }, fx: { app: 1 }, paper: ["UN ARMS EMBARGO ON THE AXIS, LED BY NIGERIA", "Ostrava's weapons cut off", true] },
      { id: "abstain", l: "Let others lead", add: { progress: 2 }, paper: ["NIGERIA SITS OUT UN EMBARGO VOTE", "Allies ask where Abuja stands", false] }] },
  { id: "talks", t: "General Voko offers secret talks", d: "Through Chad, General Voko offers secret talks: he wants to keep his rank if he steps aside.", advice: "Talk, but promise nothing. A general who asks for terms is a general who is losing.",
    opts: [{ id: "talk", l: "Open secret talks through Chad", img: "characters/general-voko", add: { progress: 15 }, fx: { app: -1 }, paper: ["SECRET TALKS WITH THE JUNTA, SOURCES SAY", "Abuja tests General Voko's offer", true] },
      { id: "refuse", l: "Refuse to talk to a coup leader", add: { progress: 4 }, fx: { app: 1 }, paper: ["“NO TALKS WITH COUP PLOTTERS”", "The President rejects Voko's offer", false] }] },
];

/* The junta's moves: fresh trouble that can come in any year after the coup,
   in any order, war or no war, until the peace is law. General Voko or one of
   his backers acts, or is caught planning to; the job is always the same:
   hit him and whoever stands behind him hard. Each move has two openings
   (caught planning, or already done), its own advice, and options whose
   results are rolled when the letter is written (seeded): a strike can find
   an empty site, a summit can split. Going soft emboldens the junta: the
   next move comes sooner and costs more. Supporters are fictional: Ostrava,
   the Republic of Tessara, the Iron Dune mercenaries, a tycoon at home. */
export const BAKUNDA_GAMBITS = [
  { id: "missiles", scene: "air-strike", learn: "deploy", kicker: "🔴 Missiles",
    open: [{ t: "The junta moves missiles to our border", d: "Satellite pictures show Ostravan-made missile launchers moving into position 40 kilometres from Yobe. Our border towns are in range." },
      { t: "A Bakundan missile hits a Nigerian border town", d: "A missile fired from Bakunda has hit the market in a border town in Yobe. Eleven dead. The launchers are still there, and General Voko calls it a warning." }],
    advice: "Hit the launchers before they fire again, and make Ostrava pay for selling them. A warning answered with silence is an invitation.",
    opts: [{ id: "strike", l: "Order a missile strike on the launchers", cost: 20, odds: .8, sfx: "missile", img: "scenes/air-strike", hit: 18, miss: 5, fx: { app: 3, sec: .02 }, npc: { army: 4 },
        win: ["JUNTA'S LAUNCHERS DESTROYED", "Nigerian missiles hit the batteries before they could fire again", "Every launcher on the satellite pictures is gone, Your Excellency. They will think twice."],
        lose: ["STRIKE HITS EMPTY LAUNCH SITE", "The junta moved its missiles hours before", "They moved them in the night, Your Excellency. Someone warned them. We will find out who."] },
      { id: "both", l: "Strike the launchers and sanction Ostrava's arms makers", cost: 24, odds: .75, sfx: "missile", img: "scenes/air-strike", hit: 24, miss: 9, fx: { app: 3, sec: .02 }, npc: { army: 4 },
        win: ["MISSILES DESTROYED, OSTRAVA SANCTIONED", "Abuja hits the junta and the factory that armed it", "The launchers are gone and Ostrava's factories cannot sell to them again. That is how you end a war."],
        lose: ["SANCTIONS BITE, BUT THE MISSILES ESCAPE", "Ostrava's arms makers blacklisted; the launchers moved in time", "The sanctions hold. The launchers got away this time."] },
      { id: "shield", l: "Move air defences to the border and wait", cost: 10, soft: true, hit: 2, fx: { app: -2 }, npc: { army: -3 },
        win: ["NIGERIA DIGS IN AS JUNTA AIMS ITS MISSILES", "Air defences moved north; the launchers stay", "We are shielded, not safe. They know they can aim at us for free."] }] },
  { id: "cell", scene: "defence-headquarters", learn: "war", kicker: "🔴 A plot at home",
    open: [{ t: "A junta cell plans a bombing in Kano", d: "The DSS has intercepted calls: a cell run from Kassara City plans to bomb a fuel depot in Kano next week. The handler is a Bakundan colonel." },
      { t: "Bomb at a fuel depot in Maiduguri: a junta cell claims it", d: "A bomb has wrecked a fuel depot in Maiduguri. Three dead. A cell run by a Bakundan colonel claims it and promises more." }],
    advice: "Take the cell, then take the man who runs it. If we only arrest the foot soldiers, the colonel hires new ones.",
    opts: [{ id: "raid", l: "DSS raid at dawn, then freeze the colonel's money", cost: 3, odds: .85, img: "scenes/defence-headquarters", hit: 14, miss: 5, fx: { app: 2, sec: .02 },
        win: ["DSS SMASHES JUNTA CELL", "Arrests at dawn; the colonel's accounts frozen", "The cell is in custody and the money behind it is frozen. Clean work."],
        lose: ["TWO SUSPECTS ESCAPE DSS RAID", "The cell is broken, but its leaders slip across the border", "We got most of them. The leaders ran for the border."] },
      { id: "reach", l: "Raid the cell and strike the colonel's base in Bakunda", cost: 18, odds: .7, sfx: "missile", img: "scenes/air-strike", hit: 22, miss: 6, fx: { app: 3, sec: .02 }, npc: { army: 3 },
        win: ["CELL CRUSHED, ITS MASTER HIT IN BAKUNDA", "Nigeria strikes the colonel who sent the bombers", "The cell is gone, and so is the base that sent it. No one in Kassara City is out of reach now."],
        lose: ["STRIKE ON JUNTA BASE KILLS CIVILIANS, JUNTA SAYS", "The colonel escapes; Bakunda parades the rubble for the cameras", "The colonel was not there. Their cameras were. It hurts us abroad."], loseFx: { app: -2 } },
      { id: "checkpoints", l: "More checkpoints and a curfew in the north", cost: 4, soft: true, hit: 1, fx: { app: -2 },
        win: ["CURFEW IN THE NORTH AS JUNTA CELL ROAMS", "Checkpoints go up; the planners go free", "The roads are slower and the cell is still out there."] }] },
  { id: "mercs", scene: "army-convoy", learn: "ally", kicker: "🔴 Mercenaries",
    open: [{ t: "Ostrava's mercenaries are flying in", d: "The Iron Dune Group, an Ostravan private army, is flying 800 fighters into Kassara City this week. The flights cross Tessara's airspace." },
      { t: "Mercenaries lead a raid on our border post", d: "Fighters of the Iron Dune Group, Ostrava's private army, led a raid on a Nigerian border post last night. Four soldiers dead." }],
    advice: "Mercenaries fight for pay. Stop the planes and stop the pay, and the army goes home.",
    opts: [{ id: "intercept", l: "Close the sky: the Air Force turns their flights back", cost: 12, odds: .75, img: "scenes/air-strike", hit: 16, miss: 6, fx: { app: 2, sec: .01 }, npc: { army: 3 },
        win: ["MERCENARY FLIGHTS TURNED BACK", "Nigerian jets force the Iron Dune planes home", "Four planes turned back over Tessara. The rest will not try."],
        lose: ["MERCENARIES LAND BY ANOTHER ROUTE", "Iron Dune flies around our patrols", "They went the long way round, Your Excellency. Some got in."] },
      { id: "pay", l: "Sanction Iron Dune and every bank that pays it", cost: 2, odds: .9, img: "scenes/axis-summit", hit: 12, miss: 4, fx: { app: 1 },
        win: ["IRON DUNE'S MONEY CUT OFF", "Banks drop the mercenaries; unpaid fighters start leaving", "No pay, no fighters. Half of them are already asking for flights home."],
        lose: ["OSTRAVA SHIELDS ITS MERCENARIES' BANKS", "The sanctions leak through Ostrava", "Ostrava is paying them in cash now. It slows them, no more."] },
      { id: "protest", l: "Protest at the United Nations", cost: 1, soft: true, hit: 1, fx: { app: -1 },
        win: ["NIGERIA PROTESTS; MERCENARIES ARRIVE ANYWAY", "A strong letter to New York", "A letter will not stop a mercenary, Your Excellency."] }] },
  { id: "tycoon", scene: "news-court-steps", learn: "war", kicker: "🔴 The enemy at home",
    open: [{ t: "A Nigerian tycoon is buying the junta's guns", d: "The financial intelligence unit traces ₦9 billion from Chief Dauda Kurmi, a Lagos oil trader and a big donor to your party, through gold sales in Dubai to an Ostravan arms dealer." },
      { t: "Chief Dauda Kurmi plans to fly gold out for the junta", d: "Customs have a tip: a private jet at Kano tonight, loaded with gold bars owned by Chief Dauda Kurmi, a party donor. The buyer is the junta's arms dealer." }],
    advice: "A traitor with a party card is still a traitor. If we let him go, every friend of the junta in Nigeria learns he is safe.",
    opts: [{ id: "efcc", l: "Arrest him, seize the gold and prosecute", cost: 1, odds: .8, img: "scenes/news-court-steps", hit: 14, miss: 6, fx: { app: 3, cor: -.01 }, npc: { nass: -3 },
        win: ["TYCOON ARRESTED FOR FUNDING THE JUNTA", "Gold seized; Chief Kurmi charged with treasonable felony", "His gold is in the Central Bank and he is in court. The junta just lost its best customer."],
        lose: ["KURMI GRANTED BAIL, FLEES TO DUBAI", "The gold is seized; the man is gone", "We have the gold. A judge gave him bail and he flew. He will not come back."] },
      { id: "expose", l: "Seize the gold and name him on television", cost: 0, odds: .9, img: "scenes/national-broadcast", hit: 10, miss: 4, fx: { app: 2 }, npc: { nass: -2 },
        win: ["“TRAITOR”: PRESIDENT NAMES JUNTA'S NIGERIAN FINANCIER", "Chief Kurmi's gold seized at Kano airport", "His name is mud. Nobody in Lagos will trade with the junta now."],
        lose: ["KURMI SUES FOR DEFAMATION", "The gold is seized; the tycoon fights back in court", "He is fighting it in court. The gold stays with us."] },
      { id: "warn", l: "He funds the party: warn him quietly", cost: 0, soft: true, hit: 0, fx: { app: -1, cor: .02 }, npc: { nass: 2 },
        win: ["JUNTA'S NIGERIAN MONEY MAN WALKS FREE", "Critics ask why the President's donor is untouched", "He thanks you, Your Excellency. The junta thanks him."] }] },
  { id: "tessara", scene: "refugees-border", learn: "ecowas", kicker: "🔴 The junta's friend",
    open: [{ t: "Tessara lets the junta's arms through", d: "President Ousmane Daraka of Tessara, our neighbour, lets Ostravan arms trucks cross his country into Bakunda, and his banks hold the junta's money." },
      { t: "Tessara plans to recognise the junta", d: "Tessara's President Ousmane Daraka will recognise General Voko's junta at a ceremony next week, the first country in Africa to do so. Others are waiting to follow." }],
    advice: "Daraka needs our fuel, our power and our markets more than he needs Voko. Make him choose.",
    opts: [{ id: "squeeze", l: "Close the Tessara border and cut its fuel and power", cost: 3, odds: .85, img: "scenes/refugees-border", hit: 15, miss: 5, fx: { app: 1 },
        win: ["TESSARA BACKS DOWN UNDER NIGERIAN PRESSURE", "The arms route closes as fuel and power stop", "Daraka called within three days. The trucks have stopped."],
        lose: ["TESSARA DIGS IN, OSTRAVA SENDS FUEL", "Daraka holds out with Ostrava's help", "Ostrava is shipping him fuel. It costs them, and him. We keep squeezing."], loseFx: { app: -1 } },
      { id: "ecowas", l: "Push ECOWAS to suspend Tessara too", cost: 2, odds: .65, img: "scenes/ecowas-summit", hit: 14, miss: 3, fx: { app: 1 },
        win: ["ECOWAS SUSPENDS TESSARA", "West Africa isolates the junta's last friend", "Suspended, sanctioned and alone. Voko has no friend left in the region."],
        lose: ["ECOWAS SPLITS OVER TESSARA", "Three states block the suspension", "The summit split, Your Excellency. Daraka has friends of his own."] },
      { id: "private", l: "Send him a private warning", cost: 0, soft: true, hit: 1, fx: { app: -1 },
        win: ["TESSARA IGNORES ABUJA'S QUIET WARNING", "The arms keep rolling", "He read the letter and kept the trucks moving."] }] },
  { id: "crude", scene: "creeks-gunboat", learn: "forces", kicker: "🔴 Stolen oil",
    open: [{ t: "The junta pays for its war with our oil", d: "Tankers flying Ostravan flags load stolen Nigerian crude at night off the Delta. The money buys the junta's guns." },
      { t: "Junta tankers set to load stolen crude tonight", d: "The Navy has a tip: three tankers will load stolen Nigerian crude off the Delta tonight, for the junta's arms dealer." }],
    advice: "Take the ships. Then make the buyers famous. Oil the world cannot buy is oil nobody steals.",
    opts: [{ id: "seize", l: "The Navy seizes the tankers; prosecute the buyers", cost: 10, odds: .85, img: "scenes/creeks-gunboat", hit: 16, miss: 5, fx: { app: 2, sec: .01 }, npc: { army: 2 },
        win: ["NAVY SEIZES JUNTA'S OIL TANKERS", "Crews arrested; the buyers named and charged", "Three tankers at anchor in Lagos now, under our flag. The junta's war chest is lighter."],
        lose: ["TWO TANKERS ESCAPE NAVY NET", "One ship seized off the Delta; two slip away", "We caught one. The others ran without lights."] },
      { id: "sbs", l: "SBS boarding by night, then sanction the refinery that buys it", cost: 14, odds: .8, img: "scenes/sbs-raid", hit: 20, miss: 7, fx: { app: 2, sec: .01 }, npc: { army: 3 },
        win: ["SBS BOARDS JUNTA TANKERS; OSTRAVAN REFINERY BLACKLISTED", "The oil, the ships and the buyer: all hit in one night", "Ships taken without a shot, and the refinery cut off from every bank. That is the whole chain."],
        lose: ["REFINERY BLACKLISTED, TANKERS SLIP AWAY", "The sanctions land; the boarding comes too late", "The refinery is cut off. The ships left an hour before we got there."] },
      { id: "companies", l: "Leave it to the oil companies' guards", cost: 0, soft: true, hit: 0, fx: { app: -1, cor: .01 },
        win: ["STOLEN CRUDE STILL FUNDS THE JUNTA", "Nightly loadings go on off the Delta", "The guards are outgunned, Your Excellency, and some are paid to look away."] }] },
  { id: "hack", scene: "grid-control-room-dark", learn: "war", kicker: "🔴 Cyber attack",
    open: [{ t: "Ostravan hackers take down the national grid", d: "Hackers working for Ostrava and the junta have shut down the national grid control room. Most of the country is in the dark." },
      { t: "The junta plans to hack the banks on payday", d: "Our cyber command has found Ostravan malware hidden in two Nigerian banks, set to wipe accounts on payday. The junta's cyber unit planted it." }],
    advice: "Clean it up, then hit back where it came from. If they pay no price, they will be back next month.",
    opts: [{ id: "counter", l: "Clean it up and take down their servers", cost: 6, odds: .7, img: "scenes/grid-control-room-dark", hit: 12, miss: 4, fx: { app: 2 },
        win: ["NIGERIA HITS BACK AT JUNTA HACKERS", "The grid is back; Ostrava's servers go dark", "Our engineers are better than theirs, Your Excellency. Their unit is offline."],
        lose: ["SYSTEMS RESTORED, HACKERS STILL AT LARGE", "Abuja cleans up; the attackers move servers", "We fixed it. They moved before we could hit them."] },
      { id: "strike", l: "Missile strike on the cyber headquarters in Kassara City", cost: 18, odds: .8, sfx: "missile", img: "scenes/air-strike", hit: 18, miss: 6, fx: { app: 2, sec: .01 }, npc: { army: 3 },
        win: ["JUNTA'S CYBER HEADQUARTERS DESTROYED", "Nigerian missiles hit the hackers' base", "The building is gone, and the Ostravan engineers with it. No more blackouts from Kassara City."],
        lose: ["MISSILES HIT CYBER HQ; HACKERS HAD MOVED", "An empty building in Kassara City", "We hit the building. They worked from somewhere else."] },
      { id: "patch", l: "Restore systems and say nothing", cost: 3, soft: true, hit: 0, fx: { app: -2 },
        win: ["BLACKOUT ENDS, SILENCE FROM ABUJA", "Nigerians ask who attacked them", "The lights are back. The people want to know why we did nothing."] }] },
  { id: "plot", scene: "defence-headquarters", learn: "refugees", kicker: "🔴 A murder plot",
    open: [{ t: "Junta agents plan to kill an exile in Abuja", d: "The DSS has found a junta hit team in Abuja. Their target: Madam Rosine Ilunga, Bakunda's exiled democratic leader, who lives here under our protection." },
      { t: "Junta agents try to kill an exile in Abuja", d: "Gunmen fired on Madam Rosine Ilunga's car in Abuja last night. Bakunda's exiled democratic leader survived. The DSS says the gunmen work for General Voko." }],
    advice: "She is under our flag. Take the team, and let the man who sent them feel it.",
    opts: [{ id: "sting", l: "Arrest the hit team on camera; expel every junta agent", cost: 2, odds: .85, img: "scenes/defence-headquarters", hit: 14, miss: 5, fx: { app: 3, sec: .01 },
        win: ["JUNTA HIT TEAM CAUGHT IN ABUJA", "Twelve agents expelled; Madam Ilunga safe", "Caught on camera with the guns. The world has seen what Voko is."],
        lose: ["ONE GUNMAN ESCAPES DSS DRAGNET", "The team is broken; their leader gets away", "Most are in custody. One got out by road."] },
      { id: "strike", l: "Arrest them, then strike the intelligence HQ that sent them", cost: 20, odds: .75, sfx: "missile", img: "scenes/air-strike", hit: 22, miss: 8, fx: { app: 3, sec: .01 }, npc: { army: 3 },
        win: ["NIGERIA STRIKES JUNTA SPY HQ AFTER ABUJA PLOT", "The team arrested; the men who sent them hit", "The team is in our cells and their headquarters is rubble. Voko will not try this again."],
        lose: ["SPY HQ STRUCK; JUNTA CLAIMS A HOSPITAL WAS HIT", "Abuja denies; the world asks questions", "We hit the right building, Your Excellency. They are lying, but the lie travels."], loseFx: { app: -2 } },
      { id: "move", l: "Move her quietly to London", cost: 1, soft: true, hit: 0, fx: { app: -2 },
        win: ["NIGERIA SENDS BAKUNDA'S DEMOCRAT AWAY", "The hit team is still at large in Abuja", "She is safe in London. The men who came for her are still here."] }] },
];

/* One of the junta's moves for this year, or none. From the year after the
   coup until the peace is law; any year, any order. The more often Abuja went
   soft (bold), the likelier the next move and the harder it lands. */
export const bakundaGambit = (B, turn) => {
  if (!B || B.done || B.stage < 2 || (B.stage === 3 && B.progress >= 100) || turn < 3) return null;
  const used = B.gam || [], left = BAKUNDA_GAMBITS.filter(g => !used.includes(g.id));
  if (!left.length || (B.gamT || 0) >= turn) return null;
  const bold = Math.max(0, B.bold || 0), r = seeded("bakunda-gambit", B.seed || "b", turn);
  if (r() > Math.min(.9, .55 + .15 * bold)) return null;
  const g = left[Math.floor(r() * left.length)], o = g.open[Math.floor(r() * g.open.length)], acted = g.open.indexOf(o) === 1;
  const sting = bold >= 2 ? 1 : 0; // an emboldened junta hits harder
  return { id: "bkg_" + g.id, kind: "card", gambit: g.id, kicker: g.kicker, t: o.t, d: o.d + (bold >= 2 ? " Abuja's silence last time told them they could." : ""), scene: g.scene, learn: g.learn, advice: g.advice, war: true,
    alarm: "there has been a grave development: " + (acted ? "the junta has struck at us again" : "we have caught the junta planning a new move against us"),
    opts: g.opts.map(x => {
      const won = x.soft ? true : r() < x.odds, P = won ? x.win : x.lose, fx = { ...(won ? x.fx : { ...x.fx, ...(x.loseFx || {}) }) };
      if (x.soft) fx.app = (fx.app || 0) - sting - (acted ? 1 : 0);
      return { id: x.id, l: x.l, cost: x.cost || 0, fx, npc: x.npc, img: x.img, sfx: x.sfx, soft: !!x.soft, hit: won,
        add: { progress: won ? x.hit : x.miss, bold: x.soft ? 1 : -1 }, push: { gam: g.id }, set: { gamT: turn },
        paper: [P[0], P[1], !x.soft && won], say: P[2], result: x.soft ? "The junta takes note: its next move will come sooner." : won ? "A hard blow to General Voko and his backers." : "Only part of the blow landed." };
    }) };
};

/* The country changes from game to game: the story is the same, the name,
   people and capital differ. The text is written with "Bakunda"; bkName
   swaps it for this game's country. All four are fictional. */
export const BAKUNDA_COUNTRIES = {
  // gen: the junta's general; art: his portrait (with -pleased and -angry).
  bakunda: { nm: "Bakunda", adj: "Bakundan", cap: "Kassara City", gen: "Voko", art: "general-voko" },
  kasongo: { nm: "Kasongo", adj: "Kasongan", cap: "Port Lukeni", gen: "Kalembe", art: "general-kalembe" },
  angova: { nm: "Angova", adj: "Angovan", cap: "Novara", gen: "Dravo", art: "general-dravo" },
  saharia: { nm: "Saharia", adj: "Saharian", cap: "Tamzar", gen: "Tazrit", art: "general-tazrit" },
};
const hash = (x) => { let h = 7; for (const ch of String(x)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
export const bkCountry = (B) => BAKUNDA_COUNTRIES[(B && B.country) || "bakunda"] || BAKUNDA_COUNTRIES.bakunda;
// "a Bakundan" becomes "an Angovan": the article follows the new name.
const fixArticles = (t) => t.replace(/\b([Aa]) (?=(\u2060?)[AEIOU])/g, (m, a) => a + "n ");
export const bkName = (text, B) => {
  if (typeof text !== "string" || !text) return text;
  const C = bkCountry(B); if (C.nm === "Bakunda") return text;
  if (/^characters\/general-voko/.test(text)) return C.art ? text.replace("general-voko", C.art) : "scenes/bakunda-coup";
  return fixArticles(text.replace(/Kassara City/g, C.cap).replace(/VOKO/g, C.gen.toUpperCase()).replace(/Voko/g, C.gen).replace(/BAKUNDAN/g, C.adj.toUpperCase()).replace(/BAKUNDA/g, C.nm.toUpperCase()).replace(/Bakundan/g, C.adj).replace(/Bakunda/g, C.nm));
};
// Every string in a card, a letter or an option, renamed (ids, keys and picture names are lower-case and untouched).
export const bkNames = (x, B) => typeof x === "string" ? bkName(x, B) : Array.isArray(x) ? x.map(v => bkNames(v, B)) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, bkNames(v, B)])) : x;

/* How the trouble begins differs from game to game: a disputed election, a
   president who dies in secret, or a third term that sets the streets alight.
   It always ends in General Voko's junta; the road there is not the same. */
export const BK_OPEN = [
  { bk1: ["Unrest boils over in the Republic of Bakunda", "The ambassador's cable: instability after a contested election. A cautious statement, or an envoy now?", "there has been a grave development: the election in Bakunda has turned violent, and our ambassador has sent an urgent cable"],
    bk2: ["General Voko seizes power in Bakunda", "The President of Bakunda is overthrown, the constitution suspended and the borders sealed."],
    news1: ["In world news: trouble is brewing in the Republic of Bakunda after a disputed election.", "Abuja is watching closely. Tough days may lie ahead for the region."], body: null },
  { bk1: ["Bakunda's President has not been seen for six weeks", "The ambassador's cable: President Ansa Lowe has vanished from public view; the palace says he is 'resting'. The generals meet at night, and the capital is full of rumours. A cautious statement, or an envoy now?", "there has been a grave development: Bakunda's President has not been seen for weeks, and the generals are meeting at night"],
    bk2: ["General Voko announces the President's death, and takes his place", "General Voko has announced that the President died weeks ago, and has suspended the constitution 'for the transition'. The borders are sealed."],
    news1: ["In world news: where is the President of Bakunda? Six weeks without a public appearance.", "Abuja says it is following events. Diplomats say the generals are restless."],
    body: ["The President has not been seen in public for six weeks. The palace says he is resting; the doctors I trust say otherwise.", "The generals meet at night. I recommend a cautious statement, and that we watch closely. If you want eyes on the ground, send an envoy now."] },
  { bk1: ["Bakunda's President seeks a third term; the streets explode", "The ambassador's cable: the President has changed the constitution to stay for a third term, and protesters fill Kassara City every night. Eleven dead so far. A cautious statement, or an envoy now?", "there has been a grave development: Bakunda's President is forcing a third term, and his police are firing on protesters"],
    bk2: ["General Voko seizes power 'to restore order'", "After three months of protests, General Voko's soldiers took the palace and arrested the President 'to restore order'. The constitution is suspended and the borders sealed."],
    news1: ["In world news: protests rage in Bakunda's capital over a third term for its President.", "Abuja calls for restraint. The region is nervous."],
    body: ["The President has rewritten the constitution to stay a third term. The protests grow every night, and his police shoot to kill.", "The army is watching the streets and the palace. I recommend a cautious statement; if you want eyes on the ground, send an envoy now."] },
];
/* The middle of the war varies too: each game draws a version of the
   readiness question, the junta's first insult, the Axis build-up, the war
   weariness and the junta's end. Same choices and stakes; a different story. */
export const BK_VARY = {
  bk1b: [
    { t: "Raise readiness on the northern border?", d: "If Bakunda falls apart, our northern states are first in line: refugees, raiders, worse. The army chief asks to move troops north now." },
    { t: "Bakundan troops seen near our border", d: "Villagers in Yobe report Bakundan army trucks a few kilometres from the border, and a drone over a market. The army chief asks to move troops north now." },
    { t: "The first refugees are already crossing", d: "Families from Bakunda are crossing into Yobe with whatever they can carry, ahead of whatever is coming. The army chief asks to move troops north now, and the camps want money." } ],
  bk2b: [
    { t: "The junta expels our ambassador", d: "General Voko has given Nigeria's ambassador 48 hours to leave, and his soldiers have taken the embassy's cars." },
    { t: "The junta seizes Nigerian businesses", d: "General Voko has 'nationalised' three Nigerian banks and a cement factory in Bakunda, and arrested their managers as 'economic saboteurs'." },
    { t: "Junta soldiers fire on Nigerian trucks", d: "Bakundan soldiers fired on a convoy of Nigerian traders' trucks at the border, killing two drivers. The junta says they were smuggling weapons." } ],
  bk3b: [
    { t: "Ostravan warships on Lake Chad", d: "Two Ostravan gunboats have docked at Bakunda's lake port. The Chief of the Naval Staff wants the Special Boat Service to shadow them." },
    { t: "Ostravan gunboats patrol the lake at night", d: "Ostravan gunboats are patrolling Lake Chad without lights, close to our fishing towns. The Chief of the Naval Staff wants the Special Boat Service to shadow them." },
    { t: "An Ostravan arms ship heads up the river", d: "An Ostravan cargo ship is moving up the river towards Bakunda's lake port, low in the water. The Chief of the Naval Staff wants the Special Boat Service to shadow it." } ],
  bk6: [
    { t: "“The people are tired of it”", d: "The war rages on. Funerals in the barracks towns, prices up in the north. Your army chief: “The people want to see us win it as soon as possible.”" },
    { t: "A soldier's mother writes to you", d: "A letter from a mother in Kaduna whose son died at the front is read on every radio station: 'Tell me what he died for.' Your army chief: “The country needs to hear you.”" },
    { t: "Food prices double in the north", d: "The war has closed the northern trade routes; food prices in Kano and Maiduguri have doubled. Your army chief: “Win it soon, or the home front breaks before the enemy does.”" } ],
  bk7: [
    { t: "Bakunda surrenders", alarm: "grave news, and good: the junta has suffered defeat after defeat, and General Voko has offered to surrender", body: null },
    { t: "General Voko flees into exile", alarm: "grave news, and good: General Voko has fled Bakunda by night, and his officers have asked for terms",
      body: ["General Voko has fled Bakunda by night, with what is left of the treasury. His officers have asked for terms.", "They will sign a peace treaty and withdraw their troops, and Ostrava will go home.", "The United Nations offers to host the signing in Geneva. Please make sure Nigeria is represented."] },
    { t: "Voko's own officers turn on him", alarm: "grave news, and good: General Voko's own officers have arrested him, and they want peace",
      body: ["General Voko has been arrested by his own officers, who blame him for the defeats.", "The new military council will sign a peace treaty, withdraw its troops and hand over to civilians. Ostrava is going home.", "The United Nations offers to host the signing in Geneva. Please make sure Nigeria is represented."] } ],
};
// This game's version of a beat; shift turns it each year (war weariness changes every year it lasts).
const vary = (B, k, shift = 0) => { const L = BK_VARY[k], d = Number(String((B && B.vary) || "00000").charAt(Object.keys(BK_VARY).indexOf(k))) || 0; return L[(d + shift) % L.length]; };
export const bakundaInit = (seed, r = Math.random) => ({ seed: String(seed), vary: Object.keys(BK_VARY).map(() => Math.floor(r() * 3) % 3).join(""), country: Object.keys(BAKUNDA_COUNTRIES)[Math.floor(r() * 4) % 4], open: Math.floor(r() * BK_OPEN.length) % BK_OPEN.length, stage: 0, warned: false, progress: 0, atWar: 0, resolution: null, sits: [], dipl: [], treaty: null, done: false, washington: null, tipped: false });

// News for the anchors at each beat: [his line, her line].
const NEWS = {
  bk1: ["In world news: trouble is brewing in the Republic of Bakunda after a disputed election.", "Abuja is watching closely. Tough days may lie ahead for the region."],
  bk2: ["Breaking: General Voko has seized power in Bakunda. Nigerians are stranded there.", "Right. War may be inevitable, and Nigeria is preparing for the worst."],
  bk3: ["The junta has signed a pact with Ostrava. The National Assembly is meeting in joint session.", "On the table: a resolution sanctioning war. It now goes to the President."],
  war: ["The nation's worst fears have come true: the National Assembly has sanctioned war on the Axis.", "The President must now lead as Commander-in-Chief."],
  weary: ["The conflict with Bakunda continues.", "At least the President is working hard to keep it under control."],
  override: ["Breaking news: the National Assembly has overridden the President's veto. The resolution for war against the Axis stands.", "Two-thirds of both Houses voted. All eyes are now on the Villa."],
  peace: ["The war is over! Bakunda has surrendered.", "The peace treaty was signed in Geneva. Now the National Assembly must enact it."],
};

/* The year's cards: two decisions and one trip, every year until the war is
   resolved. A card: id, kind (letter, mission, document or card), kicker, t,
   d, learn, news (anchors, at the big moments only), alarm (what the army
   chief says first), advice (his counsel on the decision), and opts. An
   option: fx (approval app, security sec, corruption cor), cost (₦B), npc,
   set / add / push (the storyline's new state), paper, say, flight. */
export const bakundaCards = (B0, turn, ctx = {}) => {
  if (!B0 || B0.done) return [];
  const B = { sits: [], dipl: [], press: [], gam: [], ...B0 }, out = [], nass = ctx.nass == null ? 50 : ctx.nass;
  const decide = (c) => out.push(c);
  if (B.stage === 0 && turn >= 1) {
    const O1 = BK_OPEN[B.open || 0] || BK_OPEN[0];
    decide({ id: "bk1", kind: "letter", letter: "bk1", letterBody: O1.body || undefined, kicker: "Bakunda · A cable", t: O1.bk1[0], learn: "foreign", alarm: O1.bk1[2], news: B.open ? O1.news1 : undefined, advice: "Send the envoy. If this turns into a coup, I want to know who is where before it does.",
    d: O1.bk1[1],
    opts: [{ id: "statement", l: "Issue a statement calling for calm", img: "scenes/national-broadcast", fx: { app: 0 }, set: { stage: 1, warned: false }, paper: ["ABUJA CALLS FOR CALM IN BAKUNDA", "The President urges restraint after the disputed election", true], paperImg: "national-broadcast" },
      { id: "envoy", l: "Send a special envoy now", cost: 4, fx: { app: 1 }, npc: { army: 2 }, set: { stage: 1, warned: true }, paper: ["PRESIDENT SENDS SPECIAL ENVOY TO BAKUNDA", "Abuja moves early as unrest spreads", true], paperImg: "bakunda-coup", say: "The envoy is on the ground. Whatever happens next, we will not be surprised." }] });
    decide({ id: "bk1b", kind: "card", kicker: "Bakunda · Readiness", t: vary(B, "bk1b").t, scene: "army-convoy", learn: "deploy",
      d: vary(B, "bk1b").d,
      advice: "Moving early costs money. Moving late costs lives. I would move now, Your Excellency.",
      opts: [{ id: "ready", l: "Raise readiness: move troops north", cost: 6, fx: { app: 1, sec: .01 }, npc: { army: 3 }, set: { ready: true }, paper: ["TROOPS MOVE NORTH AS BAKUNDA BOILS", "The President orders the border on alert", true], paperImg: "army-convoy", say: "The troops are moving. If it comes, we will be ready." },
        { id: "calm", l: "Keep things normal: no alarm", fx: { app: 0 }, npc: { army: -2 }, set: { ready: false }, paper: ["“NO CAUSE FOR ALARM”, SAYS ABUJA", "The President keeps troops in barracks", false], say: "As you wish. I hope we are not caught out." }] });
  }
  if (B.stage === 1 && turn >= 2) {
    const O2 = BK_OPEN[B.open || 0] || BK_OPEN[0];
    decide({ id: "bk2", kind: "card", kicker: "🔴 Urgent · Coup in Bakunda", t: O2.bk2[0], scene: "bakunda-coup", news: NEWS.bk2, learn: "ecowas", alarm: "there has been a grave development: General Voko has seized power in Bakunda, and Nigerians are trapped there", advice: "Get our people out first. Everything else can wait a week; they cannot.",
    d: O2.bk2[1] + " Nigerian traders and students are stranded" + (B.warned ? "; your envoy already has a list of every Nigerian there." : ", and refugees are crossing into our northern states."),
    opts: [{ id: "airlift", l: "Airlift the stranded Nigerians home", cost: 12, fx: { app: B.warned ? 4 : 3 }, img: "scenes/airlift-evacuation", set: { stage: 2 }, paper: ["OPERATION HOMECOMING: NIGERIANS FLOWN OUT OF BAKUNDA", "Air Force jets bring stranded citizens home", true], paperImg: "airlift-evacuation", say: "The jets are wheels up. Every Nigerian who wants to come home will come home.", flight: true },
      { id: "sanctions", l: "Lead ECOWAS to suspend Bakunda and impose sanctions", cost: 2, fx: { app: 1 }, npc: { nass: 3 }, img: "characters/general-voko-angry", set: { stage: 2 }, paper: ["ECOWAS SUSPENDS BAKUNDA AT NIGERIA'S URGING", "Sanctions on General Voko's junta", true], paperImg: "ecowas-summit" },
      { id: "border", l: "Close our northern border", cost: 3, fx: { app: B.warned ? -1 : -3, sec: .01 }, img: "scenes/refugees-border", set: { stage: 2 }, paper: ["NIGERIA SHUTS NORTHERN BORDER", "Families already across fill the camps", false], paperImg: "refugees-border", say: "The border is closed, but the families already across are in our camps now." }],
    spill: B.warned ? 0 : B.ready ? 1 : 3 });
    decide({ id: "bk2b", kind: "card", kicker: "Bakunda · The junta strikes first", t: vary(B, "bk2b").t, scene: "bakunda-coup", learn: "foreign",
      d: vary(B, "bk2b").d,
      advice: "Answer in kind, and hit their money. A junta respects only strength.",
      opts: [{ id: "expel", l: "Expel their envoy and freeze the junta's accounts", fx: { app: 2 }, npc: { army: 2 }, add: { progress: 3 }, img: "characters/general-voko-angry", paper: ["NIGERIA EXPELS BAKUNDA'S ENVOY", "The junta's accounts frozen in retaliation", true], paperImg: "bakunda-coup", say: "Good. Now they know we are not afraid of them." },
        { id: "channel", l: "Keep a quiet channel open through Chad", fx: { app: -1 }, npc: { army: -2 }, add: { progress: 1 }, img: "characters/general-voko-pleased", paper: ["ABUJA STAYS QUIET AS AMBASSADOR IS EXPELLED", "The President keeps a back channel open", false], paperImg: "bakunda-coup", say: "A channel may help later. Today it looks like weakness." }] });
  }
  if (B.stage === 2 && turn >= 3) {
    decide({ id: "bk3", kind: "document", kicker: "WAR", t: "Resolution of the National Assembly: a state of war with the Bakunda–Ostrava Axis", news: NEWS.bk3, learn: "war", alarm: "there has been a grave development: the junta has signed a pact with Ostrava, and the National Assembly has passed a resolution for war. It is on its way to you", advice: B.ready ? "The troops are already north and ready. If you sign, we move within the week." : "If you sign, we go to war. The men are willing. Make sure the country is.",
    d: "The National Assembly, in joint session, finds that the junta of Bakunda, in pact with Ostrava, threatens the territory of Nigeria and the peace of West Africa. Under Section 5(4)(a) it sanctions a declaration of war, and authorises the President, as Commander-in-Chief, to direct the armed forces to bring the conflict to a successful end.",
    sign: "The President of the Federal Republic of Nigeria", paperImg: "axis-summit",
    opts: [{ id: "assent", l: "Assent: declare war", fx: { app: 2, sec: .01 }, npc: { army: 4 }, set: { stage: 3, atWar: 1, resolution: "passed" }, img: "scenes/bakunda-war-room", paperImg: "bakunda-war-room", paper: ["NIGERIA DECLARES WAR ON THE BAKUNDA AXIS", "The National Assembly's resolution signed", false],
        say: "Your Excellency, there have been major developments. Watch your mail for missions from Defence Headquarters, and act as Commander-in-Chief." },
      { id: "veto", l: "Veto: sanctions and talks only", fx: { app: -2 }, npc: { army: -6, nass: -3 }, set: { stage: 3, atWar: 0, resolution: "vetoed", override: "pending" }, paper: ["PRESIDENT VETOES WAR RESOLUTION", "Senators vow to override", false], paperImg: "axis-summit", say: "No war, then, for now. But the Assembly will not take this lying down, Your Excellency. They have the votes to override you." }] });
    decide({ id: "bk3b", kind: "card", kicker: "Bakunda · Lake Chad", t: vary(B, "bk3b").t, scene: "navy-patrol", learn: "forces",
      d: vary(B, "bk3b").d,
      advice: "Let the SBS watch them. If they move on our shore, we will know first.",
      opts: [{ id: "sbs", l: "Send the SBS to shadow them", cost: 5, fx: { app: 1, sec: .01 }, npc: { army: 2 }, add: { progress: 8 }, img: "scenes/sbs-raid", paper: ["SBS COMMANDOS SHADOW OSTRAVAN GUNBOATS", "The Navy watches the Axis on Lake Chad", true], paperImg: "sbs-raid", say: "The SBS are in the water. Nothing moves on that lake now without us knowing." },
        { id: "air", l: "Watch from the air only", cost: 2, fx: { app: 0 }, add: { progress: 3 }, paper: ["AIR FORCE WATCHES LAKE CHAD FROM ABOVE", "Ostrava's gunboats stay in port", true], paperImg: "air-strike", say: "We will see them from above. We will not hear them." }] });
  }
  // A vetoed war resolution comes back stamped OVERRIDDEN: two-thirds of both Houses.
  if (B.stage === 3 && B.override === "pending") decide({ id: "bk3o", kind: "document", stamp: "OVERRIDDEN", kicker: "WAR · VETO OVERRIDDEN", t: "The National Assembly overrides the President's veto", news: NEWS.override, learn: "war",
    alarm: "there has been a grave development: the National Assembly has overridden your veto. The resolution for war stands, and it is on its way to you",
    advice: "The Assembly has spoken, Your Excellency. The troops are ready. Lead them, and the country will follow you.",
    d: "The National Assembly, in joint session, by a two-thirds majority of the Senate and of the House of Representatives, overrides the President's veto of its resolution sanctioning war with the Bakunda–Ostrava Axis. The resolution stands. The President, as Commander-in-Chief, is directed to employ the armed forces to bring the conflict to a successful end.",
    sign: "The Senate President and the Speaker, for the National Assembly", paperImg: "axis-summit",
    opts: [{ id: "comply", l: "Comply: lead the war as Commander-in-Chief", fx: { app: 1, sec: .01 }, npc: { army: 4, nass: 4 }, set: { atWar: 1, resolution: "overridden", override: "done" }, img: "scenes/bakunda-war-room", paper: ["ASSEMBLY OVERRIDES PRESIDENT: NIGERIA AT WAR", "Two-thirds of both Houses vote; the President takes command", false], paperImg: "bakunda-war-room",
        say: "Then we fight, Your Excellency. Watch your mail for missions from Defence Headquarters." },
      { id: "defy", l: "Refuse to deploy the troops", fx: { app: -4 }, npc: { army: -6, nass: -12 }, set: { override: "defied" }, paper: ["PRESIDENT DEFIES THE NATIONAL ASSEMBLY", "Impeachment talk in both Houses as the troops stay home", false], paperImg: "axis-summit",
        say: "The troops stay in barracks. The Assembly is talking about impeachment, Your Excellency." }] });
  if (B.stage === 3 && B.progress < 100) {
    const r = seeded("bakunda", B.seed || "b", turn);
    const left = BAKUNDA_MISSIONS.filter(m => !B.sits.includes(m.id));
    if (B.atWar >= 1 && turn >= 4) {
      // At war: two missions the first year; then one mission and the war at home.
      const n = B.atWar >= 2 ? 1 : 2, picks = [];
      while (picks.length < n && left.length) picks.push(left.splice(Math.floor(r() * left.length), 1)[0]);
      picks.forEach((m, i) => decide({ id: "bkm_" + m.id, kind: "mission", mission: m.id, need: m.need, kicker: "MILITARY", t: m.d, learn: "forces",
        alarm: "there has been a grave development on the front. Defence Headquarters needs your orders",
        d: m.d, opts: Object.entries(BAKUNDA_FORCES).map(([k, F]) => ({ id: k, l: F.l, note: F.d, cost: F.cost, fx: { app: k === m.need ? 2 : -1, sec: k === m.need ? .01 : 0 }, npc: { army: k === m.need ? 3 : -2 },
          img: F.scene ? "scenes/" + F.scene : null, sfx: k === "air" ? "missile" : undefined, push: { sits: m.id }, add: { progress: (k === m.need ? 20 : 5) + (B.marines && k === m.need ? 5 : 0), atWar: i === 0 ? 1 : 0 },
          paper: k === m.need ? [m.win[0], m.win[1], true] : ["THE WRONG FORCE FOR THE GROUND", "Our " + (F.full || F.nm) + " could not reach the enemy · the junta holds", false],
          say: k === m.need ? "The right force for that ground, Your Excellency" + (B.marines ? ", and the US Marines were beside us" : "") + ". The Axis did not expect it." : "We are committed, but the " + (F.full || F.nm) + " is wrong for that ground. It stalls us." }))
          .concat([{ id: "stay", l: "Don't get involved", fx: { app: -2 }, npc: { army: -4 }, push: { sits: m.id }, add: { atWar: i === 0 ? 1 : 0 }, paper: ["NIGERIA STANDS ASIDE", "The Axis presses on", false], say: "We stood back, Your Excellency. The Axis will not." }]) }));
      if (B.atWar >= 2) decide({ id: "bk6", kind: "card", kicker: "The war · year " + B.atWar, t: vary(B, "bk6", B.atWar).t, scene: "war-weariness", learn: "war", advice: "A clear word from you steadies the country. A push costs money and lives, but shortens the war.",
      d: vary(B, "bk6", B.atWar).d, fatigue: 1 + B.atWar,
      opts: [{ id: "address", l: "Address the nation: why we fight", img: "scenes/national-broadcast", fx: { app: 2 }, set: {}, paper: ["“WE FIGHT FOR PEACE”: PRESIDENT ADDRESSES THE NATION", "War-weary Nigerians hear the case for the war", true], paperImg: "national-broadcast" },
        { id: "push", l: "Order a decisive push", cost: 30, fx: { app: -1 }, npc: { army: 4 }, add: { progress: 10 }, img: "scenes/bakunda-war-room", paper: ["PRESIDENT ORDERS DECISIVE PUSH ON THE AXIS", "Troops press on every front", true], paperImg: "bakunda-war-room", say: "We will press them on every front, Your Excellency." }]  });
    } else if (turn >= 4) {
      // No war: two kinds of pressure short of it.
      const deck = BAKUNDA_PRESSURE.filter(x => !B.press.includes(x.id)), picks = [];
      while (picks.length < (B.override === "pending" ? 1 : 2) && deck.length) picks.push(deck.splice(Math.floor(r() * deck.length), 1)[0]);
      picks.forEach(x => decide({ id: "bkp_" + x.id, kind: "card", kicker: "Bakunda · Pressure", t: x.t, d: x.d, scene: x.id === "smuggle" ? "navy-patrol" : "axis-summit", learn: "ecowas", advice: x.advice,
        alarm: "there has been a grave development: the Axis is testing us, and we must answer short of war",
        opts: x.opts.map(o => ({ ...o, push: { press: x.id } })) }));
    }
    // The army chief's tip, once: allies matter.
    if (B.atWar >= 1 && turn >= 4 && !B.tipped) out.push({ id: "bk_tip", kind: "tip", t: "Keep a sharp eye out for diplomacy letters in your mail, Your Excellency. Working with allies will end this war sooner, and better for us.", set: { tipped: true } });
  }
  // The junta surrenders: the signing in Geneva is the year's trip.
  if (B.stage === 3 && B.progress >= 100) out.push({ id: "bk7", kind: "letter", letter: "bk_surrender", letterBody: vary(B, "bk7").body || undefined, kicker: "Peace", t: vary(B, "bk7").t, news: NEWS.peace, learn: "treaty", alarm: vary(B, "bk7").alarm,
    opts: [{ id: "go", l: "Attend in person", cost: 5, fx: { app: 4 }, set: { stage: 4 }, flight: true, dest: "signing", paper: ["BAKUNDA SURRENDERS!", "The UN hosts the signing of the peace treaty in Geneva", true], paperImg: "peace-signing", img: "scenes/peace-signing" },
      { id: "send", l: "Send the Foreign Minister", cost: 1, fx: { app: 1 }, set: { stage: 4 }, paper: ["BAKUNDA SURRENDERS!", "Nigeria's Foreign Minister signs the treaty in Geneva", true], paperImg: "peace-signing", img: "characters/general-voko" }] });
  // The peace treaty goes to the National Assembly.
  if (B.stage === 4 && !B.treaty) decide({ id: "bk8", kind: "document", kicker: "PEACE TREATY", t: "The Peace Treaty with Bakunda and Ostrava", learn: "treaty", alarm: "the peace treaty is signed. It now needs the National Assembly before it is law", advice: nass >= 35 ? "The Senate is with us. Send it." : "The Senate is cool on you. Court them first, or it will stall.",
    d: "This treaty marks the official end of the state of war between Nigeria and the Bakunda–Ostrava Axis. All further acts of military force, on the ground, in the air or on the water, are prohibited. The junta hands over to a transitional government, and Ostrava withdraws. From this day the parties pledge to keep the peace of West Africa.",
    sign: "For the consent of the National Assembly (S.12)", paperImg: "treaty-vote",
    opts: [{ id: "senate", l: "Send it to the National Assembly", fx: { app: 4 }, npc: { nass: 4 }, set: { treaty: nass >= 35 ? "enacted" : "stalled", done: nass >= 35 },
        paper: nass >= 35 ? ["REGIONAL WAR ENDS: ABUJA'S PEACE IS LAW", "The National Assembly enacts the treaty", true] : ["PEACE TREATY STALLS IN THE SENATE", "Senators bargain while troops wait on the border", false], img: nass >= 35 ? "scenes/treaty-vote" : "objects/peace-accord",
        say: nass >= 35 ? "What a relief! The war is finally over. You really came through, Your Excellency." : "The Senate is sitting on it. They want to be courted." },
      { id: "court", l: "Win the Senate over first, then send it", cost: 20, fx: { app: 3 }, npc: { nass: 10 }, set: { treaty: "enacted", done: true }, img: "scenes/treaty-vote",
        paper: ["REGIONAL WAR ENDS: ABUJA'S PEACE IS LAW", "The National Assembly enacts the treaty", true], say: "What a relief! The war is finally over. You really came through, Your Excellency." }] });
  if (B.stage === 4 && B.treaty === "stalled") decide({ id: "bk7b", kind: "card", kicker: "Peace · The Senate", t: "The peace treaty is stuck in the Senate", bg: "senate-chamber", obj: "peace-accord", learn: "treaty", alarm: "the Senate is holding the peace treaty hostage, and our troops are still on the border", advice: "Either pay their price or shame them in public. Waiting costs us every month.",
    d: "Senators delay the treaty while they bargain. Until it is law, our troops stay on the border.",
    opts: [{ id: "deal", l: "Give them what they want", cost: 25, fx: { cor: .01 }, npc: { nass: 12 }, set: { treaty: "enacted", done: true }, img: "scenes/treaty-vote", paperImg: "treaty-vote", paper: ["REGIONAL WAR ENDS: ABUJA'S PEACE IS LAW", "The Senate relents", true], say: "What a relief! The war is finally over." },
      { id: "public", l: "Go to the people: name the senators", fx: { app: 3 }, npc: { nass: -6 }, set: { treaty: "enacted", done: true }, img: "scenes/treaty-vote", paperImg: "treaty-vote", paper: ["PUBLIC PRESSURE: SENATE ENACTS PEACE TREATY", "Abuja's war is over", true], say: "The people carried it. The war is finally over." }] });
  // The junta's move this year, if it makes one (any year after the coup).
  // It takes the place of the year's lesser decision, so the weight stays at two.
  const G = bakundaGambit(B, turn);
  if (G) { let i = -1; out.forEach((c, k) => { if (/^(bk1b|bk2b|bk3b|bk6|bkm_|bkp_)/.test(c.id)) i = k; }); if (i >= 0 && out.filter(c => c.kind !== "tip").length >= 2) out.splice(i, 1); decide(G); }
  // One trip a year, in order, until the surrender: the region, the neighbours, then the world.
  const D = B.stage <= 3 && !(B.stage === 3 && B.progress >= 100) ? BAKUNDA_DIPLOMACY.find(x => !B.dipl.includes(x.id) && (x.from || 0) <= B.stage) : null;
  if (D) {
    const go = B.stage < 3 ? 4 : B.atWar ? 12 : 14, send = B.stage < 3 ? 1 : B.atWar ? 5 : 6;
    out.push({ id: "bkd_" + D.id, kind: "letter", letter: D.letter, kicker: "The world stage · Bakunda", t: D.t, learn: D.id === "washington" ? "ally" : "summit",
      alarm: "an invitation has come about Bakunda. Our allies want you there in person",
      opts: [{ id: "go", l: "Attend in person", cost: 6, fx: { app: 2 }, push: { dipl: D.id }, add: { progress: go }, set: D.id === "washington" ? { washington: "went" } : {}, flight: true, dest: D.id, paper: [D.win[0], D.win[1], true], paperImg: D.scene, img: D.scene ? "scenes/" + D.scene : null,
          ally: D.id === "washington" ? "₦30 billion for the fight, and a Marine expeditionary unit standing with your forces. Nigeria leads; we stand with you." : null,
          ...(D.id === "washington" ? { grant: 30, set: { washington: "went", marines: true }, news: ["Pressure grows on the Axis: the United States adds its weight behind Nigeria.", "Thirty billion naira and US Marines. The momentum is with the President."] } : {}) },
        { id: "send", l: "Send the Foreign Minister", cost: 1, fx: { app: 0 }, push: { dipl: D.id }, add: { progress: send }, set: D.id === "washington" ? { washington: "sent" } : {}, paper: ["FOREIGN MINISTER REPRESENTS NIGERIA: " + D.t.replace(/^(An |A |The )/, "").toUpperCase(), "The President stays home; allies note the absence", false], paperImg: D.scene,
          ...(D.id === "washington" ? { grant: 10, paper: ["US PLEDGES MONEY, BUT NOT ITS MARINES", "Washington sends ₦10B; the President stayed home", false] } : {}) }] });
  }
  return out.map(c0 => { const c = bkNames(c0, B); return { ...c, kicker: keepWord(c.kicker || ""), t: keepWord(c.t), d: c.d ? keepWord(c.d) : c.d }; });
};

// The storyline after a choice.
export const bakundaAfter = (B, o) => {
  const n = { sits: [], dipl: [], ...B, ...(o.set || {}) };
  Object.entries(o.add || {}).forEach(([k, v]) => { n[k] = (n[k] || 0) + v; });
  if (n.bold < 0) n.bold = 0;
  Object.entries(o.push || {}).forEach(([k, v]) => { n[k] = [...(n[k] || []), v]; });
  return n;
};
export const bakundaLegacy = (B) => bkName(!B ? null : B.done ? "Led Nigeria through the war against the Bakunda–Ostrava Axis to the peace treaty the National Assembly enacted." : B.stage >= 3 && B.resolution === "overridden" ? "Vetoed the war against the Bakunda–Ostrava Axis, was overridden by the National Assembly, and led Nigeria into it; the conflict was unresolved when the term ended." : B.stage >= 3 && B.resolution === "passed" ? "Took Nigeria to war against the Bakunda–Ostrava Axis; the conflict was unresolved when the term ended." : B.stage >= 3 ? "Answered the Bakunda–Ostrava Axis with sanctions and diplomacy; the conflict was unresolved when the term ended." : null, B);
