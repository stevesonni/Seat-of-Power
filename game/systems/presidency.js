/* The Presidency's national deck (rules only, no React). The presidency runs
   on the governorship's engine; this adds what only a President faces: five
   power centres (each a named person whose relationship moves), one national
   crisis that worsens each year until it is dealt with, three commitments
   made at the inauguration, the world stage, and choices that come back.
   Every roll is seeded, so a reload replays. All people are fictional. */
import { seeded } from "./rng.js";
import { keepWord } from "./office.js";

export const PRES_NPCS = {
  nass: { role: "Senate President", art: "senate-president", short: "the Senate" },
  gov: { role: "Chair, Governors' Forum", art: "governors-forum-chair", short: "the governors" },
  army: { role: "Chief of Army Staff", art: "chief-of-army-staff", short: "the army" },
  cbn: { role: "Governor of the Central Bank", art: "cbn-governor", short: "the Central Bank" },
  party: { role: "National Chairman of the party", art: "party-chairman", short: "the party" },
};

export const PRES_COMMITS = {
  power: { l: "Steady electricity", d: "More megawatts reaching homes, not just new plants." },
  security: { l: "Safe roads and villages", d: "Fewer kidnappings and attacks." },
  jobs: { l: "Jobs for young people", d: "Factories, farms and firms that hire." },
  graft: { l: "End grand corruption", d: "Big cases prosecuted, budgets that are not padded." },
  schools: { l: "Every child in school", d: "Fewer out-of-school children." },
  health: { l: "Care you can afford", d: "Primary health care and insurance that work." },
};
/* The crisis that shapes the term. sev runs 0–100: it rises each year,
   and each year's crisis card is the chance to push it down. */
export const PRES_CRISES = {
  insurgency: { nm: "The insurgency in the North-East", short: "the insurgency", bg: "situation-room", start: 55, drift: 7,
    cards: [
      { t: "An army base is overrun in Borno", d: "Insurgents took a forward base overnight. Forty soldiers are missing. The Chief of Army Staff wants more men and armoured vehicles.", learn: "armed",
        opts: [{ id: "surge", l: "Send reinforcements and new equipment", cost: 220, sev: -14, fx: { security: 5 }, npc: { army: 8 }, adv: "security" },
          { id: "talks", l: "Open back-channel talks through local leaders", cost: 20, sev: -6, fx: { nation: -3 }, npc: { army: -6 }, risk: .3 },
          { id: "statement", l: "A strong statement from the Villa", cost: 0, sev: 2, fx: { nation: -2 } }] },
      { t: "Two hundred schoolgirls are taken", d: "Gunmen stormed a boarding school at night. Their parents are at the gates of the state government house. The world is watching.", learn: "emergency",
        opts: [{ id: "rescue", l: "Order a rescue mission and fly to the state", cost: 120, sev: -10, fx: { nation: 6, security: 4 }, npc: { army: 4 }, risk: .25, adv: "security" },
          { id: "ransom", l: "Let negotiators pay, quietly", cost: 60, sev: 4, fx: { nation: 2, cor: .02 }, seed: "ransom_paid" },
          { id: "emergency", l: "Declare a state of emergency in the state", cost: 80, sev: -8, fx: { nation: -2 }, npc: { gov: -10, nass: -4 } }] },
      { t: "The displaced camps are full", d: "Two million people live in camps. Food is running out and the camps are recruiting grounds.", learn: "nema",
        opts: [{ id: "feed", l: "Feed the camps and rebuild their towns", cost: 180, sev: -9, fx: { nation: 4 }, adv: "health" },
          { id: "return", l: "Send families home under army escort", cost: 40, sev: -2, fx: { nation: -2 }, risk: .35 }] },
    ] },
  fuel: { nm: "The fuel crisis", short: "the fuel crisis", scene: "fuel-queue", start: 55, drift: 7,
    cards: [
      { t: "The queues are back", d: "Petrol stations are dry across the country. Okada fares have doubled and food prices follow.", learn: "subsidy",
        opts: [{ id: "subsidy", l: "Pay the subsidy and flood the market", cost: 300, sev: -12, fx: { nation: 5, economy: -4 }, seed: "subsidy_paid" },
          { id: "deregulate", l: "End the subsidy for good, with cash transfers to the poor", cost: 120, sev: -8, fx: { nation: -8, economy: 6 }, npc: { cbn: 6 }, adv: "jobs" },
          { id: "blame", l: "Blame the marketers and arrest a few", cost: 0, sev: 3, fx: { nation: 1 } }] },
      { t: "The refineries are still broken", d: "The state refineries have cost billions in repairs and refine almost nothing.", learn: "refinery",
        opts: [{ id: "sell", l: "Concession them to private operators", cost: 0, sev: -6, fx: { economy: 4, nation: -2 }, npc: { party: -6 } },
          { id: "fix", l: "Another repair contract", cost: 200, sev: -1, fx: { cor: .04 }, npc: { party: 5 }, seed: "refinery_contract" },
          { id: "modular", l: "Back private modular refineries near the oil fields", cost: 80, sev: -7, fx: { economy: 3 }, adv: "jobs" }] },
      { t: "Tanker drivers go on strike", d: "The tanker drivers' union says it will not move until roads and pay improve. Lagos has two days of fuel.", learn: "subsidy",
        opts: [{ id: "deal", l: "Meet them and fix the worst roads", cost: 90, sev: -6, fx: { nation: 2 } },
          { id: "army", l: "Order the army to drive the tankers", cost: 30, sev: -3, fx: { nation: -3 }, npc: { army: -4 } }] },
    ] },
  naira: { nm: "The naira crisis", short: "the naira crisis", bg: "federal-executive-council", start: 55, drift: 7,
    cards: [
      { t: "The naira falls through ₦2,000 to the dollar", d: "Importers can't get dollars. Drug and food prices are rising every week.", learn: "cbn",
        opts: [{ id: "float", l: "Let the Central Bank unify the rate and let it float", cost: 0, sev: -10, fx: { nation: -6, economy: 6 }, npc: { cbn: 8 }, adv: "jobs" },
          { id: "peg", l: "Order the Central Bank to defend the rate", cost: 260, sev: -4, fx: { economy: -3 }, npc: { cbn: -12 }, seed: "reserves_burned" },
          { id: "ban", l: "Ban imports of forty items", cost: 0, sev: 2, fx: { nation: -2, economy: -2 } }] },
      { t: "Inflation passes 30%", d: "Bread, rice and transport cost a third more than last year. Unions are talking about a general strike.", learn: "cbn",
        opts: [{ id: "rates", l: "Back the Central Bank raising interest rates", cost: 0, sev: -8, fx: { economy: -2, nation: -3 }, npc: { cbn: 8 } },
          { id: "palliative", l: "Food palliatives for the poorest", cost: 140, sev: -3, fx: { nation: 5, cor: .02 }, adv: "health" },
          { id: "print", l: "Borrow from the Central Bank to pay the bills", cost: -200, sev: 8, fx: { economy: -4 }, npc: { cbn: -12 }, seed: "ways_means" }] },
      { t: "Diaspora remittances are drying up", d: "Nigerians abroad send money through black-market channels because the official rate is worse.", learn: "cbn",
        opts: [{ id: "window", l: "Open a market-rate window for remittances", cost: 0, sev: -6, fx: { economy: 3 }, npc: { cbn: 4 } },
          { id: "bond", l: "Launch a diaspora bond", cost: -100, sev: -3, fx: { economy: 2 } }] },
    ] },
};

/* The rest of the in-tray: who wants what from the President. */
export const PRES_CARDS = [
  // The National Assembly
  { id: "budget", who: "nass", t: "The Appropriation Bill", d: "The budget must pass both chambers. Senators want ₦500B of 'constituency projects' added before they vote.", learn: "budget", yearly: true,
    opts: [{ id: "clean", l: "Hold the line: no padding", cost: 0, fx: { nation: 3 }, npc: { nass: -12 }, adv: "graft", seed: "budget_held" },
      { id: "some", l: "Accept a smaller list, all published", cost: 200, fx: {}, npc: { nass: 4 } },
      { id: "pad", l: "Let them pad it", cost: 500, fx: { cor: .05 }, npc: { nass: 14 }, seed: "budget_padded" }] },
  { id: "screening", who: "nass", t: "Ministerial screening", d: "Your list of ministers goes to the Senate. The party wants its people; you want people who can do the job.", learn: "ministers",
    opts: [{ id: "tech", l: "Nominate technocrats", cost: 0, fx: { economy: 4 }, npc: { party: -10, nass: -4 }, adv: "power" },
      { id: "mix", l: "Half technocrats, half party", cost: 0, fx: { economy: 1 }, npc: { party: 4 } },
      { id: "party", l: "Reward the party", cost: 0, fx: { economy: -3, cor: .02 }, npc: { party: 12, nass: 6 } }] },
  { id: "statepolice", who: "nass", t: "The state police amendment", d: "Senators want to change the Constitution so states can have their own police. It needs two-thirds of both chambers and 24 state assemblies.", learn: "amend",
    opts: [{ id: "back", l: "Back it", cost: 0, fx: { security: 3 }, npc: { gov: 12, army: -6, nass: 4 }, adv: "security" },
      { id: "oppose", l: "Oppose it: one police force for one country", cost: 0, fx: {}, npc: { gov: -10, army: 4 } }] },
  // The governors
  { id: "faac", who: "gov", t: "The governors want a bigger share", d: "The Governors' Forum wants the federal government's share of the Federation Account cut and theirs raised.", learn: "faac",
    opts: [{ id: "give", l: "Agree to a new revenue formula", cost: 250, fx: {}, npc: { gov: 14 } },
      { id: "refuse", l: "Refuse", cost: 0, fx: {}, npc: { gov: -12 } },
      { id: "terms", l: "Agree, if they publish what they do with it", cost: 150, fx: { nation: 2 }, npc: { gov: 4 }, adv: "graft" }] },
  { id: "bailout", who: "gov", t: "Twelve states cannot pay salaries", d: "Teachers and nurses in twelve states are owed months of pay. The governors want a bailout.", learn: "faac",
    opts: [{ id: "bail", l: "Bail them out", cost: 300, fx: { nation: 3 }, npc: { gov: 10 } },
      { id: "cond", l: "Bail them out with conditions: verified payrolls", cost: 250, fx: { nation: 4 }, npc: { gov: 2 }, adv: "graft", seed: "payroll_audit" },
      { id: "no", l: "Tell them to fix their own books", cost: 0, fx: { nation: -4 }, npc: { gov: -12 } }] },
  { id: "power", who: "gov", t: "The grid collapses again", d: "The national grid has collapsed for the third time this year. The governors want to build their own power plants under the new Electricity Act.", learn: "power",
    opts: [{ id: "states", l: "Let states build their own markets and plants", cost: 50, fx: { economy: 3 }, npc: { gov: 8 }, adv: "power" },
      { id: "grid", l: "Spend on the transmission network", cost: 280, fx: { economy: 4 }, adv: "power" },
      { id: "promise", l: "Promise a fix in the next budget", cost: 0, fx: { nation: -4 } }] },
  // The military
  { id: "jets", who: "army", t: "The army wants new jets and drones", d: "The Chief of Army Staff wants ₦400B of equipment from a foreign supplier, by direct award.", learn: "procure",
    // Approved, it goes to procurement under the Ministry of Defence; security rises on delivery.
    opts: [{ id: "buy", l: "Approve it, by direct award", cost: 400, fx: { cor: .03 }, npc: { army: 12 }, seed: "jets_direct", procure: "defence" },
      { id: "tender", l: "Approve it, through open procurement", cost: 380, fx: {}, npc: { army: 2 }, adv: "security", procure: "defence" },
      { id: "no", l: "Not this year", cost: 0, fx: {}, npc: { army: -10 } }] },
  { id: "barracks", who: "army", t: "Rumours in the barracks", d: "Junior officers complain about pay and promotions. A newspaper says some are 'talking'. The army chief says it is nothing.", learn: "armed", needsLow: "army",
    opts: [{ id: "pay", l: "Raise soldiers' pay and allowances", cost: 150, fx: {}, npc: { army: 12 } },
      { id: "retire", l: "Retire the officers named", cost: 0, fx: { nation: -2 }, npc: { army: -6 }, risk: .3 },
      { id: "public", l: "Address the nation on the constitution", cost: 0, fx: { nation: 5 }, npc: { army: 2 } }] },
  { id: "internal", who: "army", t: "Soldiers on the streets of 30 states", d: "The army is doing police work in most states. Rights groups document abuses; the army says the police can't cope.", learn: "armed",
    opts: [{ id: "keep", l: "Keep them deployed", cost: 60, fx: { security: 2, nation: -2 }, npc: { army: 4 } },
      { id: "police", l: "Recruit and train 100,000 police to take over", cost: 240, fx: { security: 4, nation: 3 }, npc: { army: -4 }, adv: "security" }] },
  // The Central Bank
  { id: "rates", who: "cbn", t: "The Central Bank wants to raise rates", d: "The CBN governor says rates must rise to tame inflation. Your ministers say it will kill growth before the election.", learn: "cbn",
    opts: [{ id: "respect", l: "Respect the Central Bank's independence", cost: 0, fx: { economy: 2, nation: -2 }, npc: { cbn: 10 } },
      { id: "pressure", l: "Lean on the governor to hold rates", cost: 0, fx: { economy: -3, nation: 2 }, npc: { cbn: -12 }, seed: "cbn_pressured" }] },
  { id: "loan", who: "cbn", t: "A foreign loan for the railway", d: "Meridia offers a cheap loan for the Lagos–Kano railway, secured on oil revenue. The Central Bank warns about the debt.", learn: "debt",
    opts: [{ id: "take", l: "Take it", cost: -400, fx: { economy: 4 }, npc: { cbn: -4 }, adv: "jobs", seed: "rail_loan" },
      { id: "terms", l: "Take it, with the terms published", cost: -380, fx: { economy: 4, nation: 2 }, adv: "jobs" },
      { id: "no", l: "Decline: no more debt", cost: 0, fx: { nation: 1 }, npc: { cbn: 6 } }] },
  // The party
  { id: "defectors", who: "party", t: "Opposition governors want to defect", d: "Four opposition governors will cross to your party, if their corruption cases go quiet.", learn: "defect",
    opts: [{ id: "welcome", l: "Welcome them", cost: 0, fx: { cor: .04, nation: -3 }, npc: { party: 12, nass: 6, gov: 6 }, seed: "defectors" },
      { id: "cases", l: "Welcome them; the cases continue", cost: 0, fx: { nation: 2 }, npc: { party: 2 }, adv: "graft" },
      { id: "no", l: "Turn them away", cost: 0, fx: { nation: 3 }, npc: { party: -6 } }] },
  { id: "efcc", who: "party", t: "The EFCC wants to charge a party baron", d: "The anti-graft agency has a case against the former governor who funded your campaign. The party chairman calls it persecution.", learn: "efcc",
    opts: [{ id: "law", l: "Let the law take its course", cost: 0, fx: { nation: 6, cor: -.04 }, npc: { party: -14 }, adv: "graft", seed: "baron_charged" },
      { id: "slow", l: "Ask the EFCC to 'review the file'", cost: 0, fx: { cor: .05 }, npc: { party: 10 }, seed: "baron_shielded" }] },
  // The courts
  { id: "courtorder", art: ["supreme-court-abuja", "chief-justice"], t: "The Supreme Court orders a detainee released", d: "The court has ordered the security services to free a journalist held for months without trial. The DSS says he is a threat. The Chief Justice is watching what you do.", learn: "courts",
    opts: [{ id: "obey", l: "Obey the court at once", cost: 0, fx: { nation: 4, cor: -.01 }, npc: { nass: 3, army: -2 } },
      { id: "appeal", l: "Obey, and ask the court to review the evidence", cost: 0, fx: { nation: 1 } },
      { id: "defy", l: "Keep him: national security comes first", cost: 0, fx: { nation: -6, cor: .02 }, npc: { army: 4, nass: -6 }, seed: "court_defied" }] },
  // The country
  { id: "strike", t: "A general strike over the minimum wage", d: "The labour unions want the minimum wage tripled. The governors say they cannot pay it.", learn: "wage",
    opts: [{ id: "meet", l: "Agree a new wage, phased in", cost: 160, fx: { nation: 5 }, npc: { gov: -6 } },
      { id: "court", l: "Get a court order against the strike", cost: 0, fx: { nation: -6 } }] },
  { id: "schools", t: "Twenty million children out of school", d: "UNICEF puts Nigeria first in the world for out-of-school children. The education minister has a plan, and a bill for it.", learn: "ubec",
    opts: [{ id: "fund", l: "Fund the plan in full: classrooms, teachers, meals", cost: 260, fx: { nation: 4 }, adv: "schools" },
      { id: "ubec", l: "Release the unspent UBEC funds to states", cost: 60, fx: { nation: 1 }, npc: { gov: 6 }, adv: "schools" },
      { id: "later", l: "Next year", cost: 0, fx: { nation: -2 } }] },
  { id: "health", t: "Mothers are dying in childbirth", d: "Nigeria has one of the highest rates of maternal death in the world. The health minister wants every primary health centre working.", learn: "phc",
    opts: [{ id: "fund", l: "Fund the primary health centres and insurance", cost: 220, fx: { nation: 4 }, adv: "health" },
      { id: "pilot", l: "A pilot in six states", cost: 60, fx: { nation: 1 } }] },
  { id: "flood", t: "The worst floods in a decade", d: "Dams upstream opened and the Niger and Benue burst their banks. A million people are homeless.", learn: "nema",
    opts: [{ id: "relief", l: "Relief, and rebuild with the states", cost: 160, fx: { nation: 5 }, npc: { gov: 6 } },
      { id: "visit", l: "Visit the camps", cost: 10, fx: { nation: 1 } }] },
  { id: "visit", t: "A state visit to Meridia", d: "Meridia's president invites you. Investors are interested; the trip is three days during a crisis at home.", learn: "foreign",
    opts: [{ id: "go", l: "Go, with a trade delegation", cost: 20, fx: { economy: 4, nation: -2 }, adv: "jobs" },
      { id: "vp", l: "Send the Vice President", cost: 5, fx: { economy: 1 } }] },
  { id: "coupnext", t: "A coup in a neighbouring country", d: "Soldiers have seized power next door. ECOWAS looks to Nigeria to lead.", learn: "foreign",
    opts: [{ id: "sanctions", l: "Lead ECOWAS sanctions and talks", cost: 30, fx: { nation: 2 }, npc: { army: 2 } },
      { id: "force", l: "Threaten military action", cost: 120, fx: { nation: -2 }, npc: { army: 6, nass: -6 } },
      { id: "quiet", l: "Stay out of it", cost: 0, fx: {}, npc: { army: -2 } }] },
];

/* "It comes back": each seed's callback, with the person it concerns. */
export const PRES_CALLBACKS = {
  court_defied: { t: "The Bar boycotts the courts", d: "Lawyers across the country stop work over the defied court order. Foreign embassies issue statements. The Chief Justice speaks of 'executive lawlessness'.", learn: "courts",
    opts: [{ id: "release", l: "Release him and apologise", cost: 0, fx: { nation: 3 }, npc: { nass: 4 } }, { id: "dig", l: "Dig in", cost: 0, fx: { nation: -6, cor: .02 }, npc: { nass: -6 } }] },
  budget_padded: { t: "The padded budget is exposed", who: "nass", d: "A newspaper publishes the list: 600 'constituency projects', many in senators' home villages, some already 'completed' on paper.", learn: "budget",
    opts: [{ id: "audit", l: "Order the Auditor-General to check every one", cost: 0, fx: { nation: 4, cor: -.02 }, npc: { nass: -10 }, adv: "graft" }, { id: "defend", l: "Defend them as development", cost: 0, fx: { nation: -6 }, npc: { nass: 4 } }] },
  budget_held: { t: "Senators sit on your next bill", who: "nass", d: "Still angry about the budget, the Senate has delayed your bills for three months.", learn: "budget",
    opts: [{ id: "deal", l: "Make peace with the Senate President", cost: 100, fx: {}, npc: { nass: 10 } }, { id: "public", l: "Name and shame them on television", cost: 0, fx: { nation: 4 }, npc: { nass: -8 } }] },
  jets_direct: { t: "Half the jets can't fly", who: "army", d: "Months after the direct award, the supplier delivered refurbished jets. Half are grounded. Rights groups ask where the money went.", learn: "procure",
    opts: [{ id: "probe", l: "Order a probe of the contract", cost: 0, fx: { nation: 4, cor: -.02 }, npc: { army: -8 }, adv: "graft" }, { id: "cover", l: "Classify it as a security matter", cost: 0, fx: { cor: .03 }, npc: { army: 4 } }] },
  ways_means: { t: "Prices jump after the borrowing", who: "cbn", d: "The money the Central Bank printed for you is in the shops. Inflation jumps four points in a month.", learn: "cbn",
    opts: [{ id: "stop", l: "Stop the borrowing and convert it to bonds", cost: 0, fx: { economy: 3 }, npc: { cbn: 8 } }, { id: "more", l: "Borrow more to cover the gap", cost: -150, fx: { economy: -6, nation: -3 }, npc: { cbn: -8 } }] },
  reserves_burned: { t: "The reserves are running out", who: "cbn", d: "Defending the naira has burned a third of the foreign reserves. The CBN governor says he can't hold the rate much longer.", learn: "cbn",
    opts: [{ id: "float", l: "Let it float now", cost: 0, fx: { nation: -5, economy: 5 }, npc: { cbn: 8 } }, { id: "hold", l: "Hold it whatever it costs", cost: 200, fx: { economy: -4 }, npc: { cbn: -6 } }] },
  subsidy_paid: { t: "The subsidy bill doubles", d: "The marketers' claims for the fuel subsidy have doubled. Auditors say some of the fuel never arrived.", learn: "subsidy",
    opts: [{ id: "audit", l: "Audit every claim before paying", cost: 0, fx: { nation: 2, cor: -.02 }, adv: "graft" }, { id: "pay", l: "Pay to keep the queues away", cost: 250, fx: { cor: .03 } }] },
  ransom_paid: { t: "The kidnappers come back", d: "The gang that was paid has bought more weapons. Another school is attacked.", learn: "emergency",
    opts: [{ id: "hunt", l: "Hunt them down", cost: 100, fx: { security: 4 }, npc: { army: 4 }, adv: "security" }, { id: "pay", l: "Pay again", cost: 60, fx: { cor: .03, security: -4 } }] },
  defectors: { t: "The defectors' files are in the papers", who: "party", d: "Journalists publish the corruption cases that went quiet when four governors joined your party.", learn: "efcc",
    opts: [{ id: "reopen", l: "Reopen the cases", cost: 0, fx: { nation: 4 }, npc: { party: -12 } }, { id: "ignore", l: "Ignore it", cost: 0, fx: { nation: -6 } }] },
  baron_charged: { t: "The baron is convicted", who: "party", d: "The court convicts the former governor. Abroad, ratings agencies take note; at home, the party is furious.", learn: "efcc", good: true,
    opts: [{ id: "credit", l: "Let the institutions take the credit", cost: 0, fx: { nation: 6, economy: 2 } }] },
  baron_shielded: { t: "A whistle-blower publishes the file", who: "party", d: "An EFCC officer leaks the case you asked them to 'review'. It is everywhere.", learn: "efcc",
    opts: [{ id: "release", l: "Let the case go ahead", cost: 0, fx: { nation: 2 }, npc: { party: -10 } }, { id: "sack", l: "Sack the EFCC chairman", cost: 0, fx: { nation: -8, cor: .04 }, npc: { party: 6 } }] },
  payroll_audit: { t: "Salaries arrive on time in twelve states", who: "gov", d: "The verified payrolls removed 40,000 ghost workers, and teachers in the bailed-out states are being paid on time.", learn: "faac", good: true,
    opts: [{ id: "national", l: "Make it national policy", cost: 30, fx: { nation: 5 }, adv: "graft" }] },
  rail_loan: { t: "Meridia wants its collateral", d: "Oil prices fell and a repayment is due. Meridia's ambassador mentions the oil revenue you pledged.", learn: "debt",
    opts: [{ id: "pay", l: "Pay from the reserves", cost: 300, fx: {} }, { id: "renegotiate", l: "Renegotiate the terms", cost: 50, fx: { economy: -2 }, risk: .3 }] },
  refinery_contract: { t: "The refinery still refines nothing", d: "Two years and ₦200B later, the repaired refinery has produced fuel for nine days.", learn: "refinery",
    opts: [{ id: "sell", l: "Concession it now", cost: 0, fx: { economy: 3, nation: 2 }, npc: { party: -6 } }, { id: "more", l: "One more contract", cost: 150, fx: { cor: .03 } }] },
  cbn_pressured: { t: "The CBN governor resigns", who: "cbn", d: "The governor of the Central Bank resigns, saying he could not do his job. Foreign investors pull out.", learn: "cbn",
    opts: [{ id: "pro", l: "Appoint a respected professional", cost: 0, fx: { economy: 3 }, npc: { cbn: 20 } }, { id: "ally", l: "Appoint an ally", cost: 0, fx: { economy: -4 }, npc: { cbn: 10 } }] },
};

/* How it really works, for the President's notebook. */
export const PRES_LEARN = {
  courts: "Section 287: the decisions of the Supreme Court must be enforced in every part of the Federation by every authority and person. Section 35 says no one may be detained for long without trial; a court can order their release.",
  coup: "Section 1(2): Nigeria shall not be governed, nor shall anyone take control of its government, except under the Constitution. The President commands the armed forces (Section 218); the Guards Brigade protects the seat of government.",
  oath: "Section 140: the President takes the Oath of Allegiance and the oath of office in the Seventh Schedule before the Chief Justice of Nigeria, on 29 May, before taking up the office.",
  exec: "Section 5 of the Constitution vests the executive power of the Federation in the President, who serves a four-year term and may be elected twice (Section 137).",
  budget: "Section 81: the President lays the budget before the National Assembly each year. Section 80 says no money may be spent except as the Assembly approves.",
  ministers: "Section 147: every minister must be confirmed by the Senate, and there must be at least one from each of the 36 states.",
  amend: "Section 9: changing the Constitution needs two-thirds of each chamber of the National Assembly and the approval of two-thirds of the state Houses of Assembly (24 of 36).",
  faac: "Section 162: federal revenue goes into the Federation Account and is shared between the federal, state and local governments by a formula the National Assembly approves, on advice from the Revenue Mobilisation Allocation and Fiscal Commission.",
  armed: "Section 218: the President is Commander-in-Chief of the Armed Forces. Section 217 lets the armed forces be used to suppress insurrection and aid the police, under an Act of the National Assembly.",
  emergency: "Section 305: the President may declare a state of emergency, which the National Assembly must approve by two-thirds within two days (if sitting) or ten days.",
  cbn: "The CBN Act 2007 makes the Central Bank independent: it sets interest rates and manages the naira. Section 38 limits its lending to the government ('Ways and Means') to 5% of the previous year's revenue.",
  subsidy: "For decades the government paid the difference between the market price of petrol and the pump price. The Petroleum Industry Act 2021 set the path to deregulation.",
  refinery: "Nigeria's four state refineries have rarely worked at capacity despite repeated repair contracts, so the country imported most of its fuel.",
  procure: "The Public Procurement Act 2007 requires open competitive bidding for public contracts, with limited exceptions for security and emergencies.",
  debt: "The Debt Management Office keeps the public debt record; the Fiscal Responsibility Act 2007 requires borrowing to be for capital projects and within limits.",
  defect: "Section 68 makes a member of the National Assembly lose their seat if they defect while their party is not divided; governors face no such rule.",
  efcc: "The EFCC investigates and prosecutes financial crimes. Section 308 shields a sitting President, Vice President and governors from prosecution, but not their allies.",
  wage: "The National Minimum Wage Act sets the lowest pay for any worker. It is revised by negotiation between government, employers and labour, then passed by the National Assembly.",
  ubec: "The Universal Basic Education Commission funds primary and junior secondary schooling, but states must put up matching funds to draw their share.",
  phc: "Primary health care is shared between the three tiers of government. The National Health Insurance Authority Act 2022 makes health insurance compulsory.",
  nema: "The National Emergency Management Agency coordinates disaster response with the states' own emergency agencies.",
  power: "The Electricity Act 2023 let states make their own electricity markets and license power plants, ending the federal monopoly on regulation.",
  foreign: "Foreign policy is the President's, through the Ministry of Foreign Affairs. ECOWAS lets West African states act together on trade and security.",
};

/* The world stage: state visits, banquets and summits. */
export const PRES_WORLD = [
  { id: "banquet", t: "A state banquet for the King of Ostrava", art: ["state-banquet", "foreign-minister-nigeria"], d: "The King arrives with forty businessmen and a trade offer. Your protocol team wants the full ceremony: guard of honour, banquet, cultural troupe.", learn: "foreign",
    opts: [{ id: "full", l: "The full ceremony, and sign the trade deal", cost: 15, fx: { economy: 4, nation: 1 }, adv: "jobs" },
      { id: "modest", l: "A modest dinner; the money goes to the camps", cost: 2, fx: { nation: 3, economy: 1 } }] },
  { id: "unga", t: "The UN General Assembly in New York", art: ["foreign-ministry-meeting", "foreign-minister-nigeria"], d: "Every head of state speaks for fifteen minutes. Your speechwriters have three drafts.", learn: "foreign", flight: "New York",
    opts: [{ id: "debt", l: "Speak for Africa: debt relief and climate money", cost: 8, fx: { nation: 3, economy: 2 } },
      { id: "invest", l: "Sell Nigeria: a roadshow for investors", cost: 10, fx: { economy: 5 }, adv: "jobs" },
      { id: "vp", l: "Send the Vice-President; stay home", cost: 3, fx: { nation: 1 } }] },
  { id: "au", t: "The African Union wants Nigeria to mediate", art: ["foreign-ministry-meeting", "foreign-minister-nigeria"], d: "A civil war two countries away is spilling refugees across borders. The AU asks you to host the peace talks in Abuja.", learn: "foreign",
    opts: [{ id: "host", l: "Host the talks in Abuja", cost: 25, fx: { nation: 4 }, npc: { army: 2 } },
      { id: "decline", l: "Decline: Nigeria has its own problems", cost: 0, fx: { nation: -1 } }] },
  { id: "addis", t: "The African Union summit in Addis Ababa", art: ["foreign-ministry-meeting", "foreign-minister-nigeria"], d: "Africa's heads of state meet on trade, peace and the Bakunda crisis. Nigeria is expected to lead.", learn: "foreign", flight: "Addis Ababa",
    opts: [{ id: "go", l: "Attend in person and lead the debate", cost: 8, fx: { nation: 2, economy: 1 } },
      { id: "vp", l: "Send the Vice-President", cost: 2, fx: { nation: 0 } }] },
  { id: "beijing", t: "A China–Africa forum in Beijing", art: ["foreign-ministry-meeting", "foreign-minister-nigeria"], d: "Beijing offers loans for railways and power, built by Chinese firms and secured on oil.", learn: "foreign", flight: "Beijing",
    opts: [{ id: "go", l: "Go, and sign the rail and power loans", cost: 4, fx: { economy: 5, nation: -1, cor: .01 }, adv: "jobs" },
      { id: "vp", l: "Send the Vice-President to listen only", cost: 2, fx: { nation: 1 } }] },
  { id: "meridia", t: "A state visit to Meridia", art: ["airport-arrivals", "foreign-minister-nigeria"], d: "Meridia's president invites you, with investors waiting. The trip is three days during a hard week at home.", learn: "foreign", flight: "Solenne",
    opts: [{ id: "go", l: "Go, with a trade delegation", cost: 20, fx: { economy: 4, nation: -2 }, adv: "jobs" },
      { id: "vp", l: "Send the Vice-President", cost: 5, fx: { economy: 1 } }] },
];

/* What a power centre's leader looks like on a card. */
export const NPC_ART = { nass: "senate-president", gov: "governors-forum-chair", army: "chief-of-army-staff", cbn: "cbn-governor", party: "party-chairman" };
const CARD_BG = { nass: "senate-chamber", gov: "federal-executive-council", army: "situation-room", cbn: "finance-ministry-office", party: "party-convention-hall" };
const CRISIS_PICK = ["insurgency", "fuel", "naira"];

/* A new presidency: the crisis it inherits and the five people who matter.
   names: { nass, gov, army, cbn, party } (the game names them). */
export const presInit = (seed, names = {}, ctx = {}) => {
  const r = seeded(seed, "presinit");
  const crisis = ctx.crisis || CRISIS_PICK[Math.floor(r() * CRISIS_PICK.length)];
  const npcs = {}; Object.keys(PRES_NPCS).forEach(k => { npcs[k] = { name: names[k] || PRES_NPCS[k].role, rel: 45 + Math.floor(r() * 16) }; });
  return { crisis, sev: PRES_CRISES[crisis].start, over: false, npcs, commits: [], adv: {}, seen: [], seeds: [] };
};

/* The year's national cards: the crisis, any choice coming back, two from
   the in-tray (one from whoever is angriest), the world stage every other
   year, and the barracks or the Senate when relations break down. */
export const presDeck = (seed, turn, P) => {
  const r = seeded(seed, "presdeck", turn), out = [];
  if (P.crisis && !P.over) { const C = PRES_CRISES[P.crisis]; out.push({ k: "crisis", id: P.crisis, i: (turn - 1) % C.cards.length }); }
  (P.seeds || []).filter(x => x.due <= turn && !x.done).slice(0, 1).forEach(x => out.push({ k: "callback", id: x.key }));
  const seen = P.seen || [], low = Object.entries(P.npcs || {}).sort((a, b) => a[1].rel - b[1].rel)[0];
  const pool = PRES_CARDS.filter(c => c.id !== "budget" && !seen.includes(c.id) && (!c.needsLow || ((P.npcs || {})[c.needsLow] || { rel: 50 }).rel < 40));
  const angry = low && low[1].rel < 45 ? pool.find(c => c.who === low[0]) : null;
  if (angry) out.push({ k: "card", id: angry.id });
  while (out.filter(x => x.k === "card").length < 2) { const left = pool.filter(c => !out.some(x => x.id === c.id)); if (!left.length) break; out.push({ k: "card", id: left[Math.floor(r() * left.length)].id }); }
  if (turn % 2 === 1) { const w = PRES_WORLD.filter(c => !seen.includes(c.id)); if (w.length) out.push({ k: "world", id: w[Math.floor(r() * w.length)].id }); }
  const army = ((P.npcs || {}).army || { rel: 50 }).rel;
  if (army < 25 && (P.sev || 0) >= 60 && !seen.includes("coup")) out.push({ k: "coup", id: "coup" });
  return out;
};
export const PRES_COUP = { id: "coup", t: "Tanks near the Three Arms Zone", who: "army", d: "At 2 a.m. the Chief of Staff wakes you: armoured vehicles have moved without orders, and a radio station is off air. The army chief says it is 'an exercise'.", learn: "coup",
  opts: [{ id: "loyal", l: "Call the loyal commanders and the Guards Brigade", cost: 40, fx: { security: 2, nation: 3 }, npc: { army: 10 } },
    { id: "broadcast", l: "Go on national television at once", cost: 0, fx: { nation: 8 }, npc: { army: -4 } },
    { id: "purge", l: "Retire the whole top brass", cost: 0, fx: { nation: -2 }, npc: { army: -12 }, risk: .35 }] };
export const presCard = (P, it) => it.k === "crisis" ? PRES_CRISES[it.id].cards[it.i] : it.k === "callback" ? PRES_CALLBACKS[it.id] : it.k === "world" ? PRES_WORLD.find(c => c.id === it.id) : it.k === "coup" ? PRES_COUP : PRES_CARDS.find(c => c.id === it.id);
/* Pack 14's pictures for particular cards: [scene, character, object]. */
export const PRES_LOOK = {
  coup: ["coup-night", "chief-of-army-staff"], court_defied: [null, "chief-justice"], barracks: [null, null, "red-phone"], internal: [null, "inspector-general"],
  faac: ["governors-forum", "governors-forum-chair"], bailout: ["governors-forum", "governors-forum-chair"], statepolice: ["nass-joint-session", "inspector-general"],
  screening: ["fec-meeting", null], power: ["national-grid-dark", "governors-forum-chair"], loan: [null, null, "budget-briefcase"],
  unga: ["un-podium", null], meridia: ["presidential-jet", "foreign-head-of-state"], banquet: [null, "foreign-head-of-state"], au: ["guard-of-honour", "ecowas-envoy"], coupnext: [null, "ecowas-envoy"],
  "insurgency:0": [null, "national-security-adviser"], "insurgency:1": [null, "national-security-adviser-angry"], "insurgency:2": ["idp-return", null], "fuel:0": ["fuel-queue", null], "fuel:1": [null, "petroleum-minister"], "fuel:2": [null, "labour-leader"],
};
// [background, character, object, scene] for a card.
export const presArt = (P, it, c) => {
  const L = PRES_LOOK[it.k === "crisis" ? it.id + ":" + it.i : c.id || it.id] || [];
  const bg = c.art ? c.art[0] : it.k === "crisis" ? (PRES_CRISES[it.id].bg || "situation-room") : CARD_BG[c.who] || "villa-office";
  const who = L[1] !== undefined && (L[1] || L[2]) ? L[1] : c.art ? c.art[1] : c.who ? NPC_ART[c.who] : "special-adviser";
  return [bg, who, L[2] || null, L[0] || null];
};

/* A choice in the engine's terms. nation → approval; economy → yearly
   revenue (₦B); security → the security index; cost → paid from the bank
   (negative: borrowed money coming in). A risky choice can go wrong. */
// The cards were priced against a ₦1.8T discretionary year; the engine's federal year is about ₦620B.
export const COST_SCALE = .35;
export const presFx = (o, r = Math.random) => {
  const bad = o.risk ? r() < o.risk : false, f = o.fx || {};
  const fx = { app: (f.nation || 0) - (bad ? 6 : 0), igr: (f.economy || 0) * 6, sec: (f.security || 0) * .006, cor: f.cor || 0 };
  return { fx, costB: Math.round((o.cost || 0) * COST_SCALE), bad, sev: (o.sev || 0) + (bad ? 6 : 0) };
};
/* The presidency after a choice: relationships, the crisis, commitments,
   the cards seen and the choices that will come back next year. */
export const presAfter = (P, it, o, sev, turn) => {
  const npcs = { ...P.npcs }; Object.entries(o.npc || {}).forEach(([k, v]) => { if (npcs[k]) npcs[k] = { ...npcs[k], rel: Math.max(0, Math.min(100, npcs[k].rel + v)) }; });
  const adv = { ...(P.adv || {}) }; if (o.adv) adv[o.adv] = (adv[o.adv] || 0) + 1;
  const seeds = (P.seeds || []).map(x => it.k === "callback" && x.key === it.id ? { ...x, done: true } : x).concat(o.seed ? [{ key: o.seed, due: turn + 1 }] : []);
  const s2 = it.k === "crisis" ? Math.max(0, Math.min(100, (P.sev || 0) + sev)) : P.sev;
  return { ...P, npcs, adv, seeds, sev: s2, over: P.over || s2 <= 10, seen: it.k === "crisis" || it.k === "callback" ? P.seen : [...(P.seen || []), it.id] };
};
/* Between years: an unattended crisis grows; past 80 it costs the country. */
export const presDrift = (P) => {
  if (!P.crisis || P.over) return { P, fx: {} };
  const sev = Math.min(100, P.sev + PRES_CRISES[P.crisis].drift * 2);
  return { P: { ...P, sev }, fx: sev >= 80 ? { app: -4, pStab: -2, sec: -.02 } : {} };
};
export const COMMIT_NEED = 2;
export const commitKept = (P, k) => ((P.adv || {})[k] || 0) >= COMMIT_NEED;

/* The deck speaks of governors, states and the Central Bank's Governor as
   themselves: protect its words from the president's vocabulary (keepWord). */
const KEYS = new Set(["id", "learn", "who", "adv", "seed", "art", "bg", "scene", "flight", "needsLow"]);
const protect = (o) => { if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === "string") o[i] = keepWord(v); else protect(v); }); else if (o && typeof o === "object") Object.keys(o).forEach(k => { if (KEYS.has(k)) return; if (typeof o[k] === "string") o[k] = keepWord(o[k]); else protect(o[k]); }); };
[PRES_NPCS, PRES_COMMITS, PRES_CRISES, PRES_CARDS, PRES_CALLBACKS, PRES_WORLD, PRES_COUP, PRES_LEARN].forEach(protect);
