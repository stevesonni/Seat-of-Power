/* The Chief of Staff and the Governor's mailbox.
   Every file that reaches the governor arrives as a letter. The governor
   handles it personally (the full decision card) or hands it to the Chief of
   Staff, who may do it well, badly or crookedly, depending on who they are and
   what the letter is. All people are fictional. */

// The four people you can appoint. comp: competence; loyalty: how hard they
// fight for you; greed: how likely a deal in your name goes to a friend.
// good/bad: the kinds of letter they are better or worse at.
export const COS_ROSTER = [
  { id: "fixer", name: "Chief Ebenezer Adeyinka-Cole", tag: "The Fixer", img: "chief-of-staff-fixer", comp: 52, loyalty: 92, greed: 45,
    good: ["party", "house", "godfather"], bad: ["budget", "courts"],
    file: "Ran your campaign. Knows every ward chairman by name, and every one of them owes him." },
  { id: "matriarch", name: "Hajiya Zainab Bello-Musa", tag: "The Party Matriarch", img: "chief-of-staff-matriarch", comp: 58, loyalty: 80, greed: 28,
    good: ["party", "house", "community"], bad: ["projects", "budget"],
    file: "Thirty years in the party. Women leaders and traditional rulers take her calls." },
  { id: "technocrat", name: "Dr. Tunde Okafor-Ilesanmi", tag: "The Technocrat", img: "chief-of-staff-technocrat", comp: 82, loyalty: 50, greed: 8,
    good: ["budget", "crisis", "federal", "projects", "gold"], bad: ["party", "godfather"],
    file: "A development-bank economist. Brilliant with numbers; the party thinks he looks down on them." },
  { id: "veteran", name: "Mrs. Ngozi Adebanjo-Eze", tag: "The Civil Service Veteran", img: "chief-of-staff-veteran", comp: 72, loyalty: 62, greed: 14,
    good: ["projects", "budget", "courts", "agenda"], bad: ["press"],
    file: "A former Head of Service. Knows where every file in the Secretariat is buried." },
];
export const cosById = (id) => COS_ROSTER.find(c => c.id === id) || null;

// The seal on each kind of letter.
export const SEALS = {
  agenda: { c: "#1f7a46", rim: "#e9b949", i: "⭐", nm: "Agenda" },
  budget: { c: "#1f4f8f", rim: "#c9d6ea", i: "📊", nm: "Budget" },
  gold: { c: "#b8860b", rim: "#ffe08a", i: "⛏️", nm: "Goldfields" },
  crisis: { c: "#b3261e", rim: "#ffb4a9", i: "🚨", nm: "Crisis" },
  godfather: { c: "#5b2a86", rim: "#d9b8ff", i: "🎩", nm: "Godfather" },
  party: { c: "#5b2a86", rim: "#d9b8ff", i: "🏳️", nm: "Party" },
  house: { c: "#7a1f2b", rim: "#f2b8c0", i: "🏛️", nm: "House" },
  courts: { c: "#222", rim: "#bbb", i: "⚖️", nm: "Courts" },
  federal: { c: "#0b6b42", rim: "#fff", i: "🇳🇬", nm: "Abuja" },
  community: { c: "#7a4a1f", rim: "#f0d2a8", i: "🏘️", nm: "Community" },
  press: { c: "#555", rim: "#ddd", i: "📰", nm: "Press" },
  travel: { c: "#1b6f7a", rim: "#bfe9ee", i: "✈️", nm: "Invitation" },
  investment: { c: "#1b6f7a", rim: "#bfe9ee", i: "💼", nm: "Investor" },
  projects: { c: "#b35c00", rim: "#ffd3a1", i: "🏗️", nm: "Projects" },
  intel: { c: "#263238", rim: "#90a4ae", i: "🕵️", nm: "Intelligence" },
  briefing: { c: "#4e5d4f", rim: "#cfd8cf", i: "🗂️", nm: "Briefing" },
  bakunda: { c: "#8e0c0c", rim: "#e0453a", i: "🚨", nm: "URGENT: the war" },
  // The councils' seals, pressed beside each council in session.
  fec: { c: "#0b5d3b", rim: "#e9c46a", i: "🏛️", nm: "Federal Executive Council" },
  nsc: { c: "#263238", rim: "#c9a227", i: "🛡️", nm: "National Security Council" },
  eac: { c: "#7a5a00", rim: "#ffe08a", i: "📈", nm: "Economic Advisory Council" },
  exco: { c: "#1f4f8f", rim: "#e9c46a", i: "🏛️", nm: "State Executive Council" },
  rulers: { c: "#5b2a86", rim: "#e9c46a", i: "👑", nm: "Traditional Rulers Council" },
  econ: { c: "#7a4a1f", rim: "#ffd3a1", i: "🚢", nm: "State Economic Council" }, // the red wax seal on the war's letters
};

// What kind of letter each year event is, and how much it needs the governor (1–3).
export const letterKind = (key) => {
  const k = String(key || "");
  if (k.startsWith("sc#pres_bk")) return ["bakunda", 3];
  if (k === "flagship") return ["agenda", 3];
  if (k === "budget") return ["budget", 3];
  if (k === "gold") return ["gold", 2];
  if (k === "shock" || k.startsWith("sc#crisis")) return ["crisis", 3];
  if (k === "judiciary" || k === "nic_ruling" || k === "sc#petition") return ["courts", 3];
  if (k === "sc#house" || k === "sc#succession") return ["house", 3];
  if (k === "house_bill") return ["house", 2];
  if (k === "godfather" || k.startsWith("sc#gf")) return ["godfather", 2];
  if (k === "federal") return ["federal", 2];
  if (k === "sc#faac") return ["budget", 2];
  if (k === "dilemma" || k.startsWith("sc#lg") || k.startsWith("sc#ruler")) return ["community", 2];
  if (k.startsWith("stall:")) return ["projects", 2];
  if (k.startsWith("sc#export_")) return ["econ", 2];
  if (k === "media") return ["press", 1];
  if (k === "investor") return ["investment", 1];
  if (k === "hidden_threat") return ["intel", 1];
  if (["abuja", "netherlands", "wedding", "intl_invite"].includes(k)) return ["travel", 1];
  if (k.startsWith("sc#")) return ["party", 2];
  return ["briefing", 1];
};

// The chance the Chief of Staff handles a letter well.
export const cosOdds = (cos, kind, stakes) => {
  if (!cos) return 0;
  const fit = (cos.good || []).includes(kind) ? .2 : (cos.bad || []).includes(kind) ? -.18 : 0;
  const xp = Math.min(.1, (cos.handled || 0) * .02); // they get better with practice
  return Math.max(.05, Math.min(.95, cos.comp / 100 + fit + xp - (stakes - 1) * .22 + .1));
};
// What they tell you before you decide.
export const cosHint = (cos, kind, stakes) => {
  if (!cos) return "There is no Chief of Staff to hand this to.";
  const p = cosOdds(cos, kind, stakes);
  return p >= .75 ? "I can handle this." : p >= .5 ? "I can try." : "This one needs you.";
};
export const cosRisk = (cos, kind, stakes) => { const p = cosOdds(cos, kind, stakes); return p >= .75 ? "safe" : p >= .5 ? "risky" : "needs you"; };

// Which option on a decision card the Chief of Staff takes, from the
// option labels. Each of the four leans their own way: the Fixer pays people
// off and keeps the party sweet, the Matriarch talks and negotiates, the
// Technocrat goes by the rules and the numbers, the Veteran plays it safe. A
// greedy one likes a deal. When they get it wrong (ok false) they take their
// second choice. Returns the index.
const LEAN = {
  fixer: [/give|accept|pay|deal|tent|appease|reward|meet|negotiat|party|loyal/i, /refuse|defy|reject|sack|probe|investigat/i],
  matriarch: [/negotiat|meet|dialogue|talk|elders|compromise|tent|send|deputy|accept/i, /defy|force|sack|crack|police|army/i],
  technocrat: [/comply|investigat|reform|audit|publish|approve|data|tender|fight the case|sign/i, /give|appease|pay off|ignore|defy|sweep/i],
  veteran: [/comply|decline|stay|send|deputy|negotiat|consult|sign|safe/i, /defy|gamble|sweep|borrow|force/i],
};
export const cosPick = (cos, labels, ok = true) => {
  if (!labels || !labels.length) return -1;
  const [like, dislike] = LEAN[cos && cos.id] || [/negotiat|comply/i, /defy/i];
  const greedy = cos && cos.greed >= 40;
  const score = labels.map((l, i) => {
    const t = String(l || "");
    let v = 0;
    if (like.test(t)) v += 3;
    if (dislike.test(t)) v -= 3;
    if (greedy && /give|accept|approve|deal|contract|incentive/i.test(t)) v += 1;
    if (/₦\s?\d/.test(t)) v -= 0.5; // money is tight; cheaper is better
    return { i, v: v - i * 0.01 };
  }).sort((a, b) => b.v - a.v);
  return (ok || score.length < 2 ? score[0] : score[1]).i;
};

// The Chief of Staff handles a letter. r: a random function. Returns the
// outcome now and, when it went badly on something serious, a fallout next year.
export const delegate = (cos, kind, stakes, title, r = Math.random) => {
  const p = cosOdds(cos, kind, stakes);
  const ok = r() < p;
  const crooked = r() < (cos.greed / 100) * .5;
  const fx = { app: 0, pStab: 0, cor: 0 };
  let text;
  if (ok) {
    if (stakes === 1) fx.app = 1;
    text = cos.name + " handled " + title + ". It went as well as it could without you.";
  } else {
    fx.app = -2 * stakes; fx.pStab = -stakes;
    text = cos.name + " handled " + title + " badly. " + (stakes >= 3 ? "People wanted the Governor, and the Governor did not come." : "It needed more authority than a Chief of Staff has.");
  }
  if ((cos.good || []).includes(kind) && (kind === "party" || kind === "house" || kind === "godfather")) fx.pStab += 2; // a fixer keeps the party sweet
  if (crooked) { fx.cor = Math.round(.012 * stakes * 1000) / 1000; text += " A contract in the deal went to a friend of " + cos.name.split(" ").slice(-1)[0] + "."; }
  const later = !ok && stakes >= 2 ? { fx: { app: -2 }, desc: "Fallout from last year: " + title + " was left to " + cos.name + ", and it is still causing trouble." } : null;
  return { ok, crooked, fx, text, later };
};

// A stubborn (stalled) project handed to the Chief of Staff. Success finishes
// it at a premium (they chase the contractor and pay what it takes) and a
// little lower quality; failure spends half and leaves it stalled.
export const cosFinishProject = (cos, p, year, r = Math.random) => {
  const left = Math.max(0, (p.estimateM || 0) - (p.builtM || 0));
  const ok = r() < cosOdds(cos, "projects", 2) + .1;
  const crooked = r() < (cos.greed / 100) * .5;
  const priceM = Math.round(left * (crooked ? 1.35 : 1.15));
  if (!ok) {
    const half = Math.round(priceM / 2);
    return { ok, crooked, costM: half, p: { ...p, spentM: (p.spentM || 0) + half, decisions: [...(p.decisions || []), { year, text: "The Chief of Staff tried to restart it; " + half + "M spent and still stalled." }] } };
  }
  const status = p.facility && !(p.equipped && p.staffed) ? "built" : "delivered";
  const q = Math.max(.2, (p.quality == null ? .7 : p.quality) - .08);
  return { ok, crooked, costM: priceM, p: { ...p, builtM: p.estimateM, progress: 100, spentM: (p.spentM || 0) + priceM, approvedM: Math.max(p.approvedM || 0, (p.spentM || 0) + priceM), quality: Math.round(q * 100) / 100, status,
    decisions: [...(p.decisions || []), { year, text: "The Chief of Staff pushed it to the finish for " + priceM + "M." }] } };
};
