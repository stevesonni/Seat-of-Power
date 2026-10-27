/* The Cabinet: a government formed with friends, for a Governor (five seats)
   or the President (the Vice-President and seven ministers).
   The Governor's or President's phone runs the game; each friend holds one portfolio,
   advises on the letters that belong to it, bids for the budget, and sees
   the same front pages. The server keeps the shared record (server/cabinet.mjs).

   Rules only, no React. */

// The five seats. kinds: letter kinds that go to this desk (see chief.js letterKind).
export const CAB_SEATS = [
  { id: "deputy", t: "Deputy Governor", short: "Deputy", i: "🤝", img: "deputy-male-suit", kinds: ["party", "house", "godfather", "community", "federal", "travel", "press"], sectors: ["administration"],
    does: "The House, the party, the godfather, the communities and Abuja." },
  { id: "finance", t: "Commissioner for Finance", short: "Finance", i: "💰", img: "finance-commissioner", kinds: ["budget", "econ", "investment"], sectors: ["salaries", "debt"],
    does: "The budget, the economy and the investors. Finance proposes how the money is shared." },
  { id: "works", t: "Commissioner for Works", short: "Works", i: "🏗️", img: "works-commissioner", kinds: ["projects"], sectors: ["infrastructure"],
    does: "Roads, bridges and every stalled site." },
  { id: "justice", t: "Attorney-General & Security", short: "Justice & Security", i: "⚖️", img: "attorney-general", kinds: ["courts", "crisis", "intel"], sectors: ["security"],
    does: "The courts, the police and every crisis." },
  { id: "social", t: "Commissioner for Health & Education", short: "Health & Education", i: "🏥", img: "social-commissioner", kinds: [], sectors: ["health", "education", "agriculture"],
    does: "Hospitals, schools, teachers, nurses and farms." },
];
// The President's cabinet: the Vice-President and seven ministers.
export const PRES_SEATS = [
  { id: "vp", t: "Vice-President", short: "Vice-President", i: "🤝", img: "vice-president-nigeria", kinds: ["party", "house", "godfather", "community", "federal", "press"], sectors: ["administration", "education", "health", "agriculture"],
    does: "The National Assembly, the party, the states and the social programmes." },
  { id: "finance", t: "Minister of Finance", short: "Finance", i: "💰", img: "finance-minister", kinds: ["budget", "econ", "investment"], sectors: ["salaries", "debt"],
    does: "The federal budget, the naira, the debt and the investors. Finance proposes how the money is shared." },
  { id: "works", t: "Minister of Works & Power", short: "Works & Power", i: "🏗️", img: "works-power-minister", kinds: ["projects"], sectors: ["infrastructure"],
    does: "Federal roads, the rail, the grid and every stalled site." },
  { id: "defence", t: "Minister of Defence & NSA", short: "Defence", i: "🛡️", img: "national-security-adviser", kinds: ["crisis", "intel", "bakunda"], sectors: ["security"],
    does: "The security fronts, the armed forces and the war." },
  { id: "justice", t: "Attorney-General of the Federation", short: "Attorney-General", i: "⚖️", img: "attorney-general", kinds: ["courts"], sectors: [],
    does: "The courts, and the President's defence if the Senate moves to impeach." },
  { id: "foreign", t: "Minister of Foreign Affairs", short: "Foreign Affairs", i: "🕊️", img: "foreign-minister-nigeria", kinds: ["diplomacy", "travel"], sectors: [],
    does: "The UN, the invitations abroad and the deals they bring." },
  { id: "labour", t: "Minister of Labour", short: "Labour", i: "👷", img: "labour-minister", kinds: [], sectors: [],
    does: "The NLC, ASUU, the minimum wage and every strike." },
  { id: "petroleum", t: "Minister of State for Petroleum", short: "Petroleum", i: "🛢️", img: "petroleum-minister", kinds: [], sectors: [],
    does: "Oil, fuel, the subsidy, the refineries and the Niger Delta." },
];
export const OFFICES = ["governor", "president"];
export const seatsOf = (office) => office === "president" ? PRES_SEATS : CAB_SEATS;
export const seatById = (id, office) => seatsOf(office).find(s => s.id === id) || (office ? null : PRES_SEATS.find(s => s.id === id)) || null;
export const SEAT_IDS = CAB_SEATS.map(s => s.id);
export const PRES_SEAT_IDS = PRES_SEATS.map(s => s.id);

// A letter about schools, hospitals or farms goes to Health & Education, whatever its seal.
const SOCIAL_RX = /\b(health|hospital|clinic|cholera|nurs|doctor|school|teacher|pupil|student|universit|polytechnic|ASUU|education|literacy|vaccin|malaria|farm|harvest|fertili[sz]er|herders?)\b/i;
/* Which seat advises on a letter: { kind, title, body } → seat id, or null
   (the Governor's own: the agenda, reports and notices). */
const LABOUR_RX = /\b(strikes?|union|NLC|TUC|ASUU|minimum wage|wage bill|workers|down tools|picket)/i;
const OIL_RX = /\b(oil|fuel|subsidy|refiner(y|ies)|petrol|crude|Niger Delta|pipeline|NNPC|marketers?|gas flar)/i;
export const seatFor = ({ kind, title = "", body = "", key = "" } = {}, office = "governor") => {
  if (!kind || kind === "agenda" || kind === "briefing") return null;
  const txt = title + " " + body;
  if (office === "president") {
    const k = String(key);
    if (k.startsWith("sc#impeach_")) return "justice";
    if (k.startsWith("sc#pres_bk") || kind === "bakunda") return "defence";
    if (k.startsWith("sc#dipl_")) return "foreign";
    if (kind !== "courts" && LABOUR_RX.test(txt)) return "labour";
    if (!["courts", "diplomacy"].includes(kind) && OIL_RX.test(txt)) return "petroleum";
    if (!["budget", "courts", "crisis"].includes(kind) && SOCIAL_RX.test(txt)) return "vp";
    const p = PRES_SEATS.find(x => x.kinds.includes(kind));
    return p ? p.id : null;
  }
  if (!["budget", "courts"].includes(kind) && SOCIAL_RX.test(txt)) return "social";
  const s = CAB_SEATS.find(x => x.kinds.includes(kind));
  return s ? s.id : null;
};

// When a letter's own options are not known before it opens, a friend advises with a stance.
export const CAB_STANCES = [
  { id: "bold", label: "Act now, and spend what it takes" },
  { id: "middle", label: "Find a middle way" },
  { id: "hold", label: "Hold firm and spend nothing" },
];

// The budget lines (the Governor's budget screen), and whose they are.
export const BUDGET_LINES = ["education", "health", "infrastructure", "security", "agriculture", "administration", "salaries", "debt"];
export const LINE_NAME = { education: "Education", health: "Health", infrastructure: "Infrastructure", security: "Security", agriculture: "Agriculture", administration: "Administration", salaries: "Salaries", debt: "Debt" };
export const lineOwner = (line, office) => (seatsOf(office).find(s => s.sectors.includes(line)) || {}).id || null;
// Shares that add to exactly 100 (whole numbers, each 0–40), keeping the proportions.
export const balance = (shares = {}) => {
  const L = BUDGET_LINES, raw = L.map(k => Math.max(0, Math.min(40, +shares[k] || 0))), sum = raw.reduce((a, b) => a + b, 0);
  if (!sum) return Object.fromEntries(L.map((k, i) => [k, i < 4 ? 13 : 12]));
  const sc = raw.map(v => v * 100 / sum), out = sc.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  sc.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return Object.fromEntries(L.map((k, i) => [k, out[i]]));
};

/* A minister's standing from their record { advised, followed, overruled,
   absent, loyalty }: a score for the end-of-term card and a word for it. */
export const ministerScore = (r = {}) => Math.max(0, (r.followed || 0) * 3 + (r.overruled || 0) + (r.advised || 0) + (r.bids || 0) * 2 - (r.absent || 0) * 2);
export const ministerWord = (r = {}) => {
  const n = (r.advised || 0) + (r.absent || 0);
  if (!n) return "Yet to be tested";
  if ((r.absent || 0) > (r.advised || 0)) return "Often absent";
  if (r.exposed) return "Exposed by the EFCC";
  if ((r.followed || 0) >= Math.max(2, (r.overruled || 0) * 2)) return "The right hand";
  if ((r.overruled || 0) > (r.followed || 0)) return "Often overruled";
  return "A steady hand";
};
export const loyaltyWord = (n = 70) => n >= 80 ? "Loyal" : n >= 60 ? "Steady" : n >= 40 ? "Restless" : "Bitter";

// The Assembly's screening: one question each, any answer passes (each with its own reply).
export const SCREENING = [
  { q: "Honourable nominee, can you take a bow and go?", a: [["Bow and go, Mr Speaker", "The House is pleased. Confirmed by voice vote."], ["I would like to answer questions", "Members are impressed, and a little tired. Confirmed."], ["My record speaks for me", "Your record is short, but the House likes confidence. Confirmed."]] },
  { q: "What will you do in your first hundred days?", a: [["Visit every local government", "The Majority Leader says he will hold you to it. Confirmed."], ["Fix what is broken before starting anything new", "A rare answer in this chamber. Confirmed."], ["Whatever the Governor asks", "The opposition groans. Confirmed on party lines."]] },
  { q: "Have you ever been invited by the EFCC?", a: [["Never, Mr Speaker", "Members check their phones. Confirmed."], ["Only to give a lecture", "Laughter in the gallery. Confirmed."], ["I prefer not to answer that", "A long silence, then: confirmed, 14 votes to 10."]] },
];
// A President's nominee faces the Senate.
export const SENATE_SCREENING = [
  { q: "Distinguished nominee, take a bow and go?", a: [["Bow and go, Mr Senate President", "The chamber laughs. Confirmed by voice vote."], ["I came prepared for questions", "Three hours of questions later: confirmed."], ["I served in this chamber's gallery as a boy", "The Senate is moved. Confirmed."]] },
  { q: "How will you fix your ministry in four years?", a: [["One problem at a time, starting with the worst", "Senators nod. Confirmed."], ["With the President's full backing", "The Minority Leader sighs. Confirmed on party lines."], ["By publishing every contract online", "Some senators shift in their seats. Confirmed, narrowly."]] },
  { q: "Your state already has a minister. Why you?", a: [["Because I am the best for the job", "Bold. Confirmed."], ["The President knows best", "Confirmed, with a warning about zoning."], ["My zone has waited long enough", "The zone's senators cheer. Confirmed."]] },
];
export const screeningFor = (code = "", seat = "", office = "governor") => { let h = 0; for (const ch of code + seat) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const L = office === "president" ? SENATE_SCREENING : SCREENING; return L[h % L.length]; };

// The invite link for a seat, and its WhatsApp message.
export const inviteUrl = (base, code, seat, invite) => String(base).replace(/[?#].*$/, "") + "?cab=" + encodeURIComponent(code) + "&seat=" + encodeURIComponent(seat) + "&inv=" + encodeURIComponent(invite);
export const inviteText = ({ gov, state, seat, url, office = "governor" }) => office === "president"
  ? "🦅 President " + (gov || "") + " has nominated you " + ((seatById(seat, office) || {}).t || "to the Federal Executive Council") + " in Seat of Power. Tap to accept and face the Senate: " + url
  : "🏛️ " + (gov || "The Governor") + " has nominated you " + ((seatById(seat, office) || {}).t || "to the cabinet") + " of " + (state || "the state") + " in Seat of Power. Tap to accept and be sworn in: " + url;
// Who leads the government, in words.
export const chiefTitle = (office) => office === "president" ? "the President" : "the Governor";

/* The cabinet's primary: candidates who declared, ranked by votes (3 each)
   and their record. → [{ seat, name, votes, score, total }], best first. */
export const primaryStanding = (cab) => {
  const P = (cab && cab.primary) || {}, seats = (cab && cab.seats) || {};
  return (P.running || []).map(seat => { const x = seats[seat] || {}; if (!x.member) return null; const votes = P.count ? P.count[seat] || 0 : Object.values(P.votes || {}).filter(v => v === seat).length, score = ministerScore(x.rec || {});
    return { seat, name: x.member.name, votes, score, total: votes * 3 + score }; }).filter(Boolean).sort((a, b) => b.total - a.total || b.votes - a.votes);
};
// A temptation's effect on the government when it is taken, and when it comes out.
export const TEMPT_FX = { take: { cor: .01 }, exposed: { app: -3 } };
export const OPED_FX = { app: -2 };

/* The end-of-term card: "The X Government, 2027–2035" and one line per minister. */
export const shareCard = (cab) => {
  if (!cab) return null;
  const G = cab.gov || {}, end = G.endYear || (G.startYear ? G.startYear + Math.max(1, cab.year || 1) - 1 : null), pres = G.office === "president";
  const rows = seatsOf(G.office).map(s => { const x = (cab.seats || {})[s.id]; if (!x || !x.member) return null; const r = x.rec || {};
    return { seat: s.id, t: s.t, name: x.member.name, word: ministerWord(r), score: ministerScore(r), best: r.best || null }; }).filter(Boolean).sort((a, b) => b.score - a.score);
  const head = "The " + (G.name || (pres ? "President" : "Governor")) + (pres ? " Administration" : " Government") + (G.startYear ? ", " + G.startYear + (end && end !== G.startYear ? "–" + end : "") : "");
  const succ = cab.successor ? (pres ? "\nThe party's candidate for President: " : "\nThe candidate for Governor: ") + cab.successor.name : "";
  const text = head + "\n" + (pres ? "Federal Republic of Nigeria\n" : G.state ? G.state + " State\n" : "") + rows.map(r => r.t + ": " + r.name + " · " + r.word).join("\n") + (rows[0] ? "\nStar of the cabinet: " + rows[0].name : "") + succ;
  return { head, rows, text, successor: cab.successor || null };
};
