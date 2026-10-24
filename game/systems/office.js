/* The presidency runs on the governorship's engine. These rules turn the
   governor's words into the president's (rules only, no React). The game
   applies them to every line on screen while the player is president.

   A word that must stay a governor's word in presidential content (the
   Governors' Forum, "36 governors") is written with keepWord(), which puts an
   invisible word joiner inside it so no rule matches. */

const WJ = "⁠";
export const keepWord = (s) => String(s).replace(/(Gov|gov|Com|com|LG|Sta|sta|Sec|S\.)/g, "$1" + WJ);

// The Constitution's sections for a governor, and the president's twin.
export const SECTIONS = {
  176: 130,   // the office exists
  177: 131,   // qualifications
  178: 132,   // the election
  179: 134,   // the win rule: most votes and 25% in two-thirds
  180: 135,   // the tenure
  182: 137,   // disqualification, the two-term limit
  185: 140,   // the oath
  187: 142,   // the running mate
  188: 143,   // impeachment
  190: 145,   // acting while away
  191: 146,   // the deputy succeeds
  192: 147,   // appointing commissioners / ministers
  193: 148,   // the executive council
  208: 171,   // appointments the office makes
  121: 81,    // the appropriation bill
  122: 82,    // spending before the budget
  162: 162,   // the Federation Account itself
  285: 285,   // the election tribunal
  239: 239,   // the Court of Appeal hears the presidential petition first
};
const ZONE = "(North-West|North-East|North-Central|South-West|South-East|South-South)";

/* Ordered: the longer phrases go first, so "State House of Assembly" becomes
   "National Assembly" before "State" is touched. */
const RULES = [
  [/\bGovernorship Election Tribunal\b/g, "Court of Appeal"],
  // The President is Abuja: the federal government's own share of oil and VAT.
  [/\bFAAC from Abuja\b/g, "Federal share of oil and VAT"],
  [/\bState House Report\b/g, "Nigeria Tonight"],
  [/\bState House of Assembly\b/g, "National Assembly"],
  [/\bHouse of Assembly\b/g, "National Assembly"],
  [/\bState Executive Council\b/g, "Federal Executive Council"],
  [/\bState Government\b/g, "Federal Government"],
  [/\bstate government\b/g, "federal government"],
  [/\bDeputy Governor\b/g, "Vice-President"],
  [/\bdeputy governor\b/g, "vice-president"],
  [/\bGovernorship\b/g, "Presidency"],
  [/\bgovernorship\b/g, "presidency"],
  [/\bGovernment House\b/g, "Aso Rock Villa"],
  [/\bGovernor's\b/g, "President's"],
  [/\bGovernors\b/g, "Presidents"],
  [/\bGovernor\b/g, "President"],
  [/\bgovernor's\b/g, "president's"],
  [/\bgovernor\b/g, "president"],
  [/\bGov\. /g, "President "],
  [/\bCommissioner of Police\b/g, "Inspector-General of Police"],
  [/\bCommissioner for\b/g, "Minister of"],
  [/\bCommissioners\b/g, "Ministers"],
  [/\bCommissioner\b/g, "Minister"],
  [/\bcommissioners\b/g, "ministers"],
  [/\bcommissioner\b/g, "minister"],
  [/\bthe Chief Judge\b/g, "the Chief Justice"],
  [/\bFAAC\b/g, "the Federation Account"],
  [/\bthe the Federation Account\b/g, "the Federation Account"],
  [/\bNigeria State\b/g, "Nigeria"],
  [new RegExp(ZONE + " (Senatorial District|Senatorial|district)", "g"), "$1 zone"],
  [/\bstatewide\b/g, "nationwide"],
  [/\bthe state's\b/g, "the nation's"],
  [/\bThe state's\b/g, "The nation's"],
  [/\byour state\b/g, "the country"],
  [/\bthe state\b/g, "the country"],
  [/\bThe state\b/g, "The country"],
  [/\bstate budget\b/g, "federal budget"],
  // Only after "state" is done: the president's "LGAs" are the states.
  [/\blocal government areas\b/g, "states"],
  [/\bLGAs\b/g, "states"],
  [/\bLGA\b/g, "state"],
  [/\b(Section|S\.|s\.) ?(\d{3})\b/g, (m, w, n) => w + (w === "Section" ? " " : "") + (SECTIONS[n] || n)],
];

export const presidentWords = (text) => {
  if (!text || typeof text !== "string") return text;
  let t = text;
  for (const [re, to] of RULES) t = t.replace(re, to);
  return t;
};

// The governorship's pictures and the Villa's.
export const VILLA_ART = {
  "government-house": "villa-office",
  "governor-office": "villa-office",
  "state-secretariat": "abuja-federal-office",
  "assembly-chamber": "senate-chamber",
  "assembly-chamber-wide": "senate-chamber",
};

/* The governor's people and the President's: the deputy governor's portrait
   becomes the Vice-President's (keeping the mood), the judge the Chief Justice. */
export const villaCharacter = (name) => {
  const m = /^(deputy-(?:northern-)?female(?:-hijab)?|deputy-(?:male|southern-male)(?:-suit|-isiagu)?|judge)(?:-(pleased|angry|worried))?$/.exec(name || "");
  if (!m) return null;
  const base = m[1] === "judge" ? "chief-justice" : /female/.test(m[1]) ? "vice-president-female" : "vice-president";
  return m[2] && m[2] !== "worried" ? base + "-" + m[2] : base;
};
