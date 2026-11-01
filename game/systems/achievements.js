/* Achievement cards (Pack 30). Each pops up the moment a player earns it,
   with a line worth sharing and the number that earned it. Earned once per
   player (sop_cards); the number on the card is the player's own.

   ctx (any career; missing fields simply do not count):
     office "governor" | "president" | "chairman" | "senator" | "ambassador"
     trips, termDone, delivered, quickWins, plugYears, leakPct, turn, arrearsMax,
     impSurv, petitionWon, whistleTrue, rivalUs, rivalThem, nb, state, combos,
     gEnd, debt, oldDebt, peace, cor, twEnd, presTrips, roadHeld, ambitionMet,
     ambition, lawsBacked, evacDone, streak, app, ladder */
export const CARDS_KEY = "sop_cards";
const pct = (x) => Math.round((x || 0) * 100);
const B = (x) => "₦" + (Math.round((x || 0) * 10) / 10) + "B";
export const ACHIEVEMENTS = [
  { id: "junketer", art: "badge-junketer", t: "Junketer-in-chief", test: (c) => c.trips >= 4 && c.trips, big: (n) => n + " trips abroad", line: () => "Your passport needs its own budget line." },
  { id: "stay_home", art: "badge-stay-at-home", t: "Stay-at-home Governor", test: (c) => c.office === "governor" && c.termDone && c.trips === 0 && 4, line: () => "Four years and not one trip abroad. Your people always knew where to find you." },
  { id: "ribbon", art: "badge-builder", t: "Ribbon Cutter", test: (c) => c.delivered >= 8 && c.delivered, big: (n) => n + " ribbons cut", line: () => "Projects opened and in use. The scissors are tired." },
  { id: "quick_fix", art: "badge-quick-fix", t: "Quick Fix", test: (c) => c.quickWins >= 5 && c.quickWins, big: (n) => n + " quick jobs", line: () => "Every one finished inside the year. People saw it happen." },
  { id: "ghostbuster", art: "badge-ghostbuster", t: "Ghostbuster", test: (c) => c.plugYears >= 3 && c.plugYears, big: (n) => n + " years ghost-free", line: () => "Ghost workers struck off the payroll, and kept off." },
  { id: "leak_plumber", art: "badge-leak-plumber", t: "Leak Plumber", test: (c) => c.turn >= 3 && c.leakPct != null && c.leakPct <= 3 && Math.max(1, c.leakPct), big: (n) => "Only " + n + "% leaked", line: () => "The money from Abuja arrives where it is sent." },
  { id: "salary_day", art: "badge-salary-day", t: "Salary on the 25th", test: (c) => c.termDone && (c.arrearsMax || 0) === 0 && 4, line: () => "Four years, and every salary paid on the 25th. Nothing for the unions to strike about." },
  { id: "survivor", art: "badge-survivor", t: "Survivor", test: (c) => !!c.impSurv && 1, line: () => "They counted the votes to impeach you. You are still here." },
  { id: "supreme_court", art: "badge-supreme-court", t: "Supreme Court Proof", test: (c) => !!c.petitionWon && 1, line: () => "The election petition went all the way up. The Supreme Court says you won." },
  { id: "whistle", art: "badge-whistle", t: "Whistle Heard", test: (c) => c.whistleTrue >= 1 && c.whistleTrue, line: (n) => (n === 1 ? "A clerk blew the whistle" : n + " whistleblowers spoke up") + ". You listened, and the money came back." },
  { id: "border", art: "badge-border-champion", t: "Border Champion", test: (c) => c.rivalUs >= 3 && !c.rivalThem && c.rivalUs, big: (n, c) => (c.state || "Us") + " " + n + " – 0 " + (c.nb || "Them"), line: () => "The governor next door has gone very quiet." },
  { id: "combo", art: "badge-combo", t: "Combo King or Queen", test: (c) => c.combos >= 3 && c.combos, big: (n) => n + " combos", line: () => "Programmes working together, each one making the next stronger." },
  { id: "debt_slayer", art: "badge-debt-slayer", t: "Debt Slayer", test: (c) => !!c.gEnd && c.oldDebt > 0 && c.debt < c.oldDebt && Math.round(c.oldDebt * 10) / 10, big: (n, c) => B(n) + " → " + B(c.debt), line: () => "The debt you inherited, and the debt you left. Your successor gets a cleaner account." },
  { id: "peacemaker", art: "badge-peacemaker", t: "Peacemaker", test: (c) => !!c.peace && 1, line: () => "The guns are quiet. A war ended, for good, on your watch." },
  { id: "clean_hands", art: "badge-clean-hands", t: "Clean Hands", test: (c) => c.termDone && c.cor < .15 && Math.max(1, pct(c.cor)), big: (n) => n + "% corruption", line: () => "A full term, and nobody is calling the EFCC about you." },
  { id: "trade_war", art: "badge-trade-war", t: "Trade War Won", test: (c) => c.twEnd === "good" && 1, line: () => "Lokassa backed down. The border is open and the trucks are rolling again." },
  { id: "diplomat", art: "badge-diplomat", t: "Aso Rock Diplomat", test: (c) => c.presTrips >= 4 && c.presTrips, big: (n) => n + " state visits", line: () => "Abroad as President. The world knows your name." },
  { id: "road_held", art: "badge-road-held", t: "Road That Held", test: (c) => !!c.roadHeld && 1, line: () => "The rains came, and the market road held. Built properly, and it shows." },
  { id: "promise_kept", art: "badge-promise-kept", t: "Promise Keeper", test: (c) => !!c.ambitionMet && 1, line: (n, c) => "“" + (c.ambition || "One promise") + "”: said on swearing-in day, done by the end of the term." },
  { id: "lawmaker", art: "badge-lawmaker", t: "Lawmaker", test: (c) => c.lawsBacked >= 3 && c.lawsBacked, big: (n) => n + " laws", line: () => "Bills you backed in the Senate, now the law of the land." },
  { id: "every_family", art: "badge-every-family", t: "Every Family Home", test: (c) => !!c.evacDone && 1, line: () => "The war came. Every family on the embassy's list came home." },
  { id: "streak", art: "badge-streak", t: "7-Day Streak", test: (c) => c.streak >= 7 && c.streak, big: (n) => n + " days in a row", line: () => "On the Daily decision, every single day." },
  { id: "favourite", art: "badge-peoples-favourite", t: "The People's Favourite", test: (c) => c.app >= 75 && Math.round(c.app), big: (n) => n + "% approval", line: () => "The people are with you." },
  { id: "ward_to_aso", art: "badge-ward-to-aso-rock", t: "From Ward to Aso Rock", test: (c) => !!c.ladder && 3, line: () => "Council chairman, then governor, then President. The whole climb, one politician." },
];
export const ACH_IDS = ACHIEVEMENTS.map(a => a.id);
/* The cards this ctx earns that the player does not have yet: [{ id, t, art, n, line }]. */
export const cardsEarned = (ctx = {}, have = {}) => ACHIEVEMENTS.filter(a => !have[a.id]).map(a => { let n = false; try { n = a.test(ctx); } catch (e) {} return n ? { id: a.id, t: a.t, art: a.art, n, big: a.big ? a.big(n, ctx) : null, line: a.line(n, ctx) } : null; }).filter(Boolean);
export const CARD_ART = ["card-backdrop", "card-sunburst", "card-plaque", "card-confetti"];
