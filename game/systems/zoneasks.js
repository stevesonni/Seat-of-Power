/* Districts ask before they sulk (player feedback, Chinaza, November 2026: "Instead of
   getting a minus from other zones, they can place demands that are reasonable and you
   can do, and if you don't, then you get the minus").

   When a district (a senatorial district for a governor, a geopolitical zone for a
   President) feels left out, its leaders now come with one reasonable ask. Meet it and the
   district warms to you; say no and it cools a little; promise and fail, and it cools more.
   Left undecided for two years, they give up on you.

   An ask: { id, zone, kind, place, why, turn, cost, status: "open" | "promised" | "met" | "refused" | "lapsed", due } */
import { seeded } from "./rng.js";

export const ASK_KINDS = {
  road: { t: "Tar the road into {place} before the rains", cost: .6, money: true },
  water: { t: "Boreholes in five wards of {place}", cost: .3, money: true },
  hospital: { t: "Fix the generator and restock the general hospital in {place}", cost: .4, money: true },
  school: { t: "New roofs for the {place} schools the storm took", cost: .3, money: true },
  lights: { t: "Solar streetlights in {place} town", cost: .25, money: true },
  project: { t: "Start your next project in {district}", cost: 0, money: false },
  seat: { t: "One of {district}'s own in the cabinet", cost: 0, money: false },
};
export const ASK_MET = 3, ASK_REFUSED = -2, ASK_BROKEN = -3, ASK_LAPSED = -2;
export const ASKS_A_YEAR = 2;
const MONEY_KINDS = Object.keys(ASK_KINDS).filter(k => ASK_KINDS[k].money);

/* A new ask from a district. why: "project" (a big project left it out), "seat" (the
   cabinet), "start" (the running mate's district came first). places: its LGAs. */
export const makeAsk = (seed, { zone, turn, why, places = [], district = "", nat = false }) => {
  const r = seeded(seed, "ask", zone, turn, why);
  const kind = why === "seat" ? "seat" : why === "project" && r() < .35 ? "project" : MONEY_KINDS[Math.floor(r() * MONEY_KINDS.length)];
  const place = places.length ? places[Math.floor(r() * places.length)] : district;
  const cost = Math.round(ASK_KINDS[kind].cost * (nat ? 6 : 1) * 100) / 100; // a zone is bigger than a district
  return { id: "ask_" + zone + "_" + turn + "_" + why, zone, kind, place, district, why, turn, cost, status: "open", due: null };
};
export const askText = (a) => ASK_KINDS[a.kind].t.replace("{place}", a.place || a.district).replace("{district}", a.district);
export const WHY_TEXT = {
  project: "The last big project left {district} out. Its leaders are not angry yet. They have one request.",
  seat: "{district} has fewer commissioners than the other districts. Its elders ask for a seat at the table before they complain in public.",
  start: "Your running mate is from another district, and {district} wants to see you govern for everyone. Its leaders have one request.",
};
export const whyText = (a) => WHY_TEXT[a.why].replace(/\{district\}/g, a.district);

/* Is a promise kept? ctx: { projects, placesOf(zone) → LGAs, balanceZone } */
export const askMet = (a, ctx = {}) => {
  if (a.kind === "project") { const P = (ctx.placesOf && ctx.placesOf(a.zone)) || []; return (ctx.projects || []).some(p => (p.startTurn || p.year || 0) >= a.turn && [p.lga, ...(p.lgas || [])].some(l => P.includes(l))); }
  if (a.kind === "seat") return ctx.balanceZone !== a.zone;
  return false; // money asks are met by paying, when you choose to
};

/* The year turns: promises come due, old asks lapse, self-fulfilling ones are met.
   Returns { asks, moves: [{ zone, dz, text, kind: "success" | "political" }] }. */
export const askYear = (asks = [], turn, ctx = {}) => {
  const moves = [];
  const out = asks.map(a => {
    if (a.status === "met" || a.status === "refused" || a.status === "lapsed" || a.status === "broken") return a;
    if ((a.kind === "project" || a.kind === "seat") && askMet(a, ctx)) { moves.push({ zone: a.zone, dz: ASK_MET, text: a.district + " got what it asked for: " + askText(a).replace(/^./, c => c.toLowerCase()) + ".", kind: "success" }); return { ...a, status: "met", done: turn }; }
    if (a.status === "promised" && a.due != null && turn > a.due) { moves.push({ zone: a.zone, dz: ASK_BROKEN, text: "You promised " + a.district + " " + askText(a).replace(/^./, c => c.toLowerCase()) + ", and it did not happen.", kind: "political" }); return { ...a, status: "broken", done: turn }; }
    if (a.status === "open" && turn - a.turn >= 2) { moves.push({ zone: a.zone, dz: ASK_LAPSED, text: a.district + " asked for " + askText(a).replace(/^./, c => c.toLowerCase()) + " two years ago and never heard back.", kind: "political" }); return { ...a, status: "lapsed", done: turn }; }
    return a;
  });
  return { asks: out, moves };
};
/* The asks to put on the Desk this year: open ones, oldest first, and promised money asks now due. */
export const asksDue = (asks = [], turn) => asks.filter(a => a.status === "open" || (a.status === "promised" && ASK_KINDS[a.kind].money && a.due === turn)).sort((a, b) => a.turn - b.turn).slice(0, ASKS_A_YEAR);
/* One open ask per district at a time. */
export const canAsk = (asks = [], zone) => !asks.some(a => a.zone === zone && (a.status === "open" || a.status === "promised"));
