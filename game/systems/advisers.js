/* The Special Adviser's outlook. The SA advises across government (the
   commissioners run sectors); what they notice first, and what they miss,
   depends on their background. No outlook is always right.

   perYear: the quiet, steady effect of having them at your side, applied
   once at each year's end (game stats: app/pStab are points, cor is 0–1).
   Kept small: the adviser tilts the game, they do not play it for you. */
export const SA_LENSES = {
  fiscal: {
    nm: "Fiscal caution", strength: "Spots debt traps and bad loans early; lenders trust the numbers they sign off.",
    blind: "Treats every naira saved as a win, even when people need the spending now.",
    perYear: { pStab: -1 }, loanRateCut: .02,
    note: "The party grumbles that the purse is too tight (party −1 a year). Loans you take with her advice cost 2 points less interest.",
  },
  political: {
    nm: "Political negotiation", strength: "Keeps the party and the House talking to you; knows who must be paid in respect.",
    blind: "Sees patronage as normal. Deals get done; some of them should not have been.",
    perYear: { pStab: 2, cor: .005 },
    note: "Party +2 a year; corruption creeps up slightly (+0.5% a year) from the deals.",
  },
  delivery: {
    nm: "Administrative delivery", strength: "Chases contractors and permanent secretaries until things are finished.",
    blind: "Impatient with consultation; communities and party feel steamrolled.",
    perYear: { pStab: -1 }, projectBoost: .1,
    note: "Projects move 10% faster; the party feels left out (−1 a year).",
  },
  comms: {
    nm: "Public communication", strength: "Explains your decisions so people give you time; softens scandals.",
    blind: "A good story is not a finished road. When results are missing, the spin is noticed.",
    perYear: { app: 1 }, scandalDamp: .25,
    note: "Approval +1 a year and scandals cost a quarter less; on its own it delivers nothing.",
  },
  security: {
    nm: "Security and order", strength: "Reads threats early and keeps the security chiefs cooperating.",
    blind: "Leans to force first; young people and the press notice.",
    perYear: { sec: .01, app: -0.5 },
    note: "Security +1% a year; a little approval lost to heavy-handedness.",
  },
};

// Which outlook each reserve candidate has (by their brief).
export const SA_LENS_OF = {
  "Prof. Bola Adekunle": "fiscal", "Mrs. Ekaette Akpan": "fiscal",
  "Otunba Ademola Bakare": "political", "Alh. Abdullahi Bawa": "political", "Barr. Chinedu Eze": "political", "Mai Musa Kachalla": "political",
  "Ms. Ngozi Okafor": "delivery", "Dr. Halima Sanusi": "delivery", "Engr. Tosin Ogundipe": "delivery", "Dr. Uche Onwuka": "delivery", "Dr. Terkuma Gbenda": "delivery", "Dr. Ebele Nwosu": "delivery",
  "Ms. Kemi Ajayi": "comms", "Comrade Preye Dougibo": "comms",
  "Mallam Ibrahim Yusuf": "security", "Hajiya Fatima Modu": "security", "Amb. Bello Gimba": "security",
};
export const lensOf = (name) => SA_LENSES[SA_LENS_OF[name] || "delivery"];
export const lensIdOf = (name) => SA_LENS_OF[name] || "delivery";

// The shortlist offered when the campaign starts: one of each main outlook.
export const SA_SHORTLIST = ["Prof. Bola Adekunle", "Otunba Ademola Bakare", "Ms. Ngozi Okafor", "Ms. Kemi Ajayi"];

// What this adviser would flag first about the current state (one line).
export const lensRead = (lensId, c) => {
  const s = c.s || {};
  if (lensId === "fiscal") return (s.debt || 0) > (s.igr || 1) * 2 ? "Debt is more than twice what we raise ourselves. Every new loan narrows the next budget." : "The books are holding. Keep a reserve; the next shock always comes.";
  if (lensId === "political") return (s.pStab || 0) < 50 ? "The party is restless. Call the chairman before he calls the press." : "The party is with us for now. Spend that goodwill before it fades.";
  if (lensId === "comms") return (s.app || 0) < 45 ? "People can't see what we are doing. Show them one finished thing." : "The story is good. Make sure the work matches it.";
  if (lensId === "security") return (s.sec || 0) < .45 ? "Insecurity is the first thing voters will judge. Fund the guards before the roads." : "It is calm. That is when to fix the intelligence gaps.";
  return (c.stalled || 0) > 0 ? c.stalled + " site" + (c.stalled === 1 ? " is" : "s are") + " stalled. Unfinished work costs more every year it waits." : "Pick one project and finish it. Starting is easy.";
};
