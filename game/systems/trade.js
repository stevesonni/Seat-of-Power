/* Trade and logistics (rules only, no React). Imports and exports as one
   engine. Nigeria eats, builds and heals with foreign goods and pays for
   them with dollars it earns abroad; the President's stance on trade moves
   food prices, factories, smuggling and the reserves, and every one of
   them reaches the street.

   The state of trade, T:
     stance     protect (bans and high tariffs) | open (low tariffs) |
                targeted (protect only what local farms can supply)
     reserves   US$ billions in the Central Bank
     premium    how far the black-market dollar sits above the official (%)
     food       a food price index (100 = the year you took office)
     factories  the health of local manufacturing (0–100)
     smuggling  the pressure on the borders (0–100)
     exports    US$ billions earned abroad a year
     infra      { seaport, dryport, rail }: the turn each opens (or null)
   Local supply comes from security: bandits in the North-West and the
   insurgency in the North-East empty the farms. All people are fictional. */
import { storyStart } from "./storylines.js";

export const STANCES = {
  protect: { nm: "Protect", l: "Protect local producers: ban rice, poultry and vehicle imports, raise tariffs", tariff: 40, importBill: 6, food: .45, factories: 6, smuggling: 16, farms: 3,
    d: "Saves dollars and helps farmers and factories. If insecurity empties the farms, there is nothing to replace them: food prices explode." },
  open: { nm: "Open", l: "Open the borders: low tariffs, cheap food and raw materials", tariff: 10, importBill: 14, food: -.15, factories: -9, smuggling: -10, farms: -3,
    d: "Food gets cheaper and inflation falls. Local factories and farms cannot compete, the Manufacturers' Association campaigns against you, and the reserves drain." },
  targeted: { nm: "Targeted", l: "Targeted: protect only what our farms can supply, import the rest", tariff: 25, importBill: 9, food: .18, factories: 3, smuggling: 6, farms: 1,
    d: "The hard middle: it works only with an honest Customs Service and good data on what the farms can grow." },
};
export const TRADE_INFRA = {
  seaport: { nm: "A deep seaport for the East and South-South", cost: 140, years: 3, exports: 2, importSave: 1, d: "Takes the pressure off Lagos; cheaper shipping for the East; faster oil, gas and farm exports from the South-South." },
  dryport: { nm: "A dry port in Kano", cost: 60, years: 2, exports: 1.5, importSave: .5, d: "Northern importers clear Customs at home; northern farmers containerise sesame and cotton locally." },
  rail: { nm: "Rehabilitate the cargo rail line, Lagos to Kano", cost: 110, years: 3, exports: 1, importSave: 1, d: "Cheaper raw materials for inland factories, and exports that bypass the bandit-heavy highways." },
};
export const tradeInit = (stance = null) => ({ stance, reserves: 33, premium: 40, food: 100, factories: 50, smuggling: 30, exports: 5, infra: { seaport: null, dryport: null, rail: null }, stories: {}, hist: [] });

// Local supply (0–100): what the farms can grow, given the security fronts (0–100 each).
export const localSupply = (fronts = {}) => Math.round(Math.max(20, 100 - ((fronts.nw || 50) * .45 + (fronts.ne || 50) * .25)));

/* The year's trade. ctx: { fronts, oilShock (bool), turn, corruption (0–1), nairaHeat }.
   Returns { T, fx: { app, cash }, lines, triggers: [story ids to open] }. */
export const tradeYear = (T0, ctx = {}) => {
  const T = { ...T0, infra: { ...T0.infra }, stories: { ...(T0.stories || {}) } }, S = STANCES[T.stance] || STANCES.targeted, lines = [], triggers = [];
  const supply = localSupply(ctx.fronts), open = (k) => T.infra[k] != null && T.infra[k] <= (ctx.turn || 0);
  const exportsBase = 5 + (open("seaport") ? TRADE_INFRA.seaport.exports : 0) + (open("dryport") ? TRADE_INFRA.dryport.exports : 0) + (open("rail") ? TRADE_INFRA.rail.exports : 0) + (T.exportPush || 0);
  T.exports = Math.round((exportsBase * (supply / 80) * (ctx.oilShock ? .6 : 1)) * 10) / 10;
  const importBill = S.importBill - (open("seaport") ? 1 : 0) - (open("rail") ? 1 : 0) - (open("dryport") ? .5 : 0);
  T.reserves = Math.round(Math.max(2, T.reserves + T.exports - importBill - (T.peg ? 4 : 0)) * 10) / 10;
  // Food: protection with empty farms is the trap; open borders keep it cheap.
  const shortfall = Math.max(0, 75 - supply);
  T.food = Math.round(Math.max(70, T.food * (1 + (S.food > 0 ? S.food * shortfall / 100 : S.food * .3)) + (T.peg ? -2 : 0)));
  T.factories = Math.max(5, Math.min(100, T.factories + S.factories + (T.premium > 60 ? -6 : 0) + (open("rail") ? 2 : 0)));
  T.smuggling = Math.max(0, Math.min(100, T.smuggling + S.smuggling + (T.borderClosed ? -20 : 0) - (T.customsClean ? 10 : 0) + ((ctx.corruption || .3) - .3) * 20));
  T.premium = Math.max(0, Math.round(T.premium + (T.reserves < 15 ? 15 : T.reserves > 30 ? -8 : 2) + (T.peg ? 10 : 0) - (T.floated ? 25 : 0)));
  T.floated = false;
  const fx = { app: 0, cash: Math.round(S.tariff * .6 + T.exports * 3) }; // Customs duties and export earnings this year (₦B)
  if (T.food >= 160) { fx.app -= 4; lines.push("Food prices are " + Math.round(T.food - 100) + "% above the year you took office."); }
  else if (T.food >= 130) { fx.app -= 2; lines.push("Food prices are up " + Math.round(T.food - 100) + "%."); }
  else if (T.food <= 95) { fx.app += 1; lines.push("Food is cheaper than when you took office."); }
  if (T.factories < 35) { fx.app -= 1; lines.push("Factories are closing: local manufacturing is at " + T.factories + "/100."); }
  // What opens next year.
  if (T.reserves < 15 && !T.stories.fx) triggers.push("fx");
  if (T.smuggling >= 55 && !T.stories.border) triggers.push("border");
  if (T.premium >= 70 && !T.stories.bdc) triggers.push("bdc");
  if ((ctx.turn || 0) >= 2 && !T.stories.ports) triggers.push("ports");
  if (T.exports >= 6 && !T.stories.exports) triggers.push("exports");
  T.hist = [...(T.hist || []), { t: ctx.turn, reserves: T.reserves, food: T.food, exports: T.exports }];
  return { T, fx, lines, triggers, supply };
};

/* The trade storylines, on the storyline engine (storylines.js): programmes,
   bills to the National Assembly, executive orders a court can strike down.
   tr: changes to the state of trade when chosen. */
const P = (id, l, x) => ({ id, kind: "programme", l, ...x });
const BL = (id, l, nm, pass, fail, x) => ({ id, kind: "bill", l, bill: { nm, pass, fail }, cost: 2, ...x });
const OR = (id, l, nm, next, risk, struck, x) => ({ id, kind: "order", l, next, order: { nm, risk, struck }, cost: 1, ...x });
const A = (id, l, x) => ({ id, kind: "act", l, ...x });
export const TRADE_STORIES = {
  fx: { id: "trade_fx", nm: "The dollar shortage", who: "cbn-governor", bg: "finance-ministry-office", start: "alert", starts: ["alert", "pipeline"], boil: "riots", heat0: 60, drift: 2, scale: 1, learn: "cbn",
    beats: {
      alert: { t: "The Central Bank is out of dollars", startOnly: true, d: "Manufacturers cannot buy raw materials; drug importers have stopped ordering. The Central Bank Governor: 'Your Excellency, we have weeks of import cover, not months.'",
        opts: [A("devalue", "Devalue: let the naira find its real level", { fx: { app: -5, igr: 15 }, tr: { floated: true }, next: "prices", past: "devalued the naira when the dollars ran out", say: "Imported medicine and phones jump 50% overnight. The queues for dollars vanish." }),
          OR("ration", "Executive order: dollars for essential goods only", "the FX Rationing Order", "blackmarket", .3, "prices", { fx: { app: 1 }, past: "rationed dollars to essential goods", say: "Food and medicine first. Everyone else goes to the black market." }),
          P("imf", "Take a high-interest IMF loan to prop up the naira", { cost: -120, fx: { app: -2 }, tr: { reserves: 10 }, hook: "nlc_imf", next: "conditions", past: "took an IMF loan to prop up the naira", say: "Ten billion dollars, and a letter of conditions." })] },
      pipeline: { t: "Militants bomb the export pipeline", startOnly: true, d: "Militants blew up the main export pipeline in the Delta. Oil exports have halved overnight, and with them the dollars the Central Bank sells to importers.",
        opts: [P("repair", "Repair it under guard, and pay the host communities", { cost: 60, fx: { app: 1 }, tr: { exportPush: 1 }, next: "prices", past: "repaired the bombed pipeline under guard", say: "Oil flows in six weeks. The dollars come back slowly." }),
          OR("ration", "Executive order: dollars for essential goods only", "the FX Rationing Order", "blackmarket", .3, "prices", { past: "rationed dollars after the pipeline bombing", say: "Food and medicine first. The rest go to the black market." }),
          A("devalue", "Devalue the naira", { fx: { app: -5, igr: 15 }, tr: { floated: true }, next: "prices", past: "devalued the naira after the pipeline bombing", say: "Prices jump. The dollar queues end." })] },
      prices: { t: "Medicine prices have doubled", who: "doctor", bg: "hospital-ward", d: "After the devaluation, imported insulin and cancer drugs cost twice what they did. Hospitals are rationing; a patients' group is marching on the Ministry of Health.",
        opts: [P("drugs", "Subsidise essential medicines for a year", { cost: 40, fx: { app: 3 }, next: "local", past: "subsidised essential medicines after the devaluation", say: "Prices for 40 essential drugs are back down." }),
          BL("pharma", "A Local Pharmaceutical Manufacturing Bill", "Local Pharmaceutical Manufacturing Bill", "local", "riots", { past: "sent a bill to make medicines in Nigeria", say: "Tax breaks for drug factories, if it passes." }),
          A("wait", "Let prices settle", { weak: true, fx: { app: -3 }, next: "riots", past: "let medicine prices settle on their own", say: "They settle, high." })] },
      blackmarket: { t: "The black market takes over", who: "market-trader", bg: "busy-market-street", d: "With dollars rationed, importers buy on the black market at twice the official rate. The gap is a gold mine for anyone with access to official dollars, including some of your own officials.",
        opts: [A("float", "Unify the rates: one market price", { fx: { app: -3, igr: 10 }, tr: { floated: true }, next: "factory", past: "unified the exchange rates", say: "The black market's margin is gone overnight." }),
          OR("raid", "Executive order: raid the money-changers", "the Bureau de Change Order", "factory", .3, "factory", { fx: { app: -1 }, past: "raided the street money-changers", say: "The money-changers move to WhatsApp." }),
          A("ignore", "Look the other way", { weak: true, fx: { cor: .03 }, next: "factory", past: "looked away from the black market", say: "Someone is getting rich on the gap." })] },
      factory: { t: "A factory in Agbara closes", who: "manufacturers-rep", bg: "finance-ministry-office", d: "A plastics factory in Agbara has shut: it could not import machine parts. Five thousand workers are laid off, and the NLC has written to you.",
        opts: [P("credit", "A dollar window for manufacturers' raw materials", { cost: 30, fx: { app: 2 }, tr: { factories: 8 }, next: "local", past: "opened a dollar window for manufacturers", say: "The factory reopens in a month." }),
          A("float", "Unify the rates so they can buy dollars openly", { fx: { app: -2, igr: 10 }, tr: { floated: true, factories: 4 }, next: "local", past: "unified the rates after the Agbara closure", say: "Dearer, but available. The factory reopens." }),
          A("nothing", "Tell them to source locally", { weak: true, fx: { app: -2 }, hook: "nlc_fuel", next: "riots", past: "told the manufacturers to source locally", say: "There is no local source for machine parts." })] },
      conditions: { t: "The IMF's conditions arrive", who: "foreign-head-of-state", bg: "foreign-ministry-meeting", d: "The IMF's second tranche needs a floating naira, the fuel subsidy gone and VAT raised to 10%. Your party says it will lose the next election.",
        opts: [A("accept", "Accept the conditions", { fx: { app: -5, igr: 20 }, tr: { floated: true }, hook: "nlc_imf", next: "local", past: "accepted the IMF's conditions", say: "The tranche arrives. So does the NLC." }),
          A("refuse", "Refuse the second tranche", { fx: { app: 2 }, tr: { reserves: -3 }, next: "riots", past: "refused the IMF's second tranche", say: "Popular at home. The markets wobble." })] },
      local: { t: "Made in Nigeria, by necessity", who: "manufacturers-rep", bg: "finance-ministry-office", endOnly: true, d: "Dear dollars have done what speeches could not: local factories are making what used to be imported. The reserves are recovering.",
        opts: [P("zones", "Special economic zones for import substitutes", { cost: 40, fx: { app: 3 }, tr: { factories: 10, exportPush: 1 }, close: true, past: "built special economic zones for local manufacturing", say: "Three zones, forty factories." }),
          A("steady", "Hold steady", { close: true, past: "held steady as the dollar shortage eased", say: "The shortage is over." })] },
      riots: { t: "Prices bring people to the streets", who: "labour-leader", scene: "news-protest", d: "Imported goods cost twice what they did a year ago. Crowds blocked the expressway in Lagos, and warehouses were looted in Kano.",
        opts: [P("relief", "Cash relief to ten million homes", { cost: 60, fx: { app: 4 }, next: "local", past: "paid cash relief after the price riots", say: "The crowds go home." }),
          OR("controls", "Executive order: price controls on imported staples", "the Price Controls Order", "local", .4, "local", { fx: { app: 2 }, past: "imposed price controls after the riots", say: "Shelves empty within a week." })] },
    } },
  border: { id: "trade_border", nm: "The smugglers' border", who: "revenue-officer", bg: "situation-room", start: "ring", starts: ["ring", "seizure"], boil: "retaliation", heat0: 55, drift: 2, scale: 1,
    beats: {
      ring: { t: "A smuggling ring through Benin", startOnly: true, d: "The Comptroller-General of Customs: 'Your Excellency, a smuggling ring is moving banned rice through the Seme border. Our own officers take bribes to let the trucks pass.'",
        opts: [OR("close", "Executive order: close the land borders", "the Land Borders Order", "closed", .25, "retaliation", { fx: { app: -1 }, tr: { borderClosed: true }, past: "closed the land borders", say: "The borders are shut. So is every legitimate trader's business." }),
          P("purge", "Purge Customs: lifestyle audits and new officers at the border", { cost: 20, fx: { app: 2, cor: -.02 }, tr: { customsClean: true }, npc: { party: -6 }, next: "godfathers", past: "purged the Customs officers at the border", say: "Forty officers suspended. Some of the trucks belonged to party men." }),
          BL("offences", "A Customs and Excise (Smuggling) Amendment Bill", "Customs and Excise (Amendment) Bill", "godfathers", "retaliation", { past: "sent a tougher smuggling law to the Assembly", say: "Longer sentences, seizure of trucks, if it passes." })] },
      seizure: { t: "Customs seize 40 trucks of foreign rice", startOnly: true, d: "Customs seized forty trucks of smuggled rice at Idiroko. The owners are threatening a strike of all transporters, and one of them says he will 'call Abuja'.",
        opts: [P("auction", "Auction the rice cheaply in the markets", { cost: 2, fx: { app: 3 }, next: "godfathers", past: "auctioned the seized rice in the markets", say: "Cheap rice in the markets for a week. The smugglers count their losses." }),
          A("return", "Return the trucks to the owners", { weak: true, fx: { cor: .03 }, next: "retaliation", past: "returned the seized trucks", say: "Returned. Customs officers are demoralised." }),
          OR("close", "Executive order: close the land borders", "the Land Borders Order", "closed", .25, "retaliation", { tr: { borderClosed: true }, past: "closed the land borders after the seizure", say: "The borders are shut." })] },
      closed: { t: "The border towns are starving", who: "ecowas-envoy", bg: "foreign-ministry-meeting", scene: "refugees-border", d: "With the borders shut, legitimate trade has stopped too. Benin and Niger say Nigeria is breaking ECOWAS law, and are blocking Nigerian exports in return.",
        opts: [P("corridors", "Reopen with scanners and joint patrols", { cost: 30, fx: { app: 2 }, tr: { borderClosed: false }, next: "godfathers", past: "reopened the borders with scanners and joint patrols", say: "Trucks scanned, patrols joint. Trade resumes, smuggling does not." }),
          A("hold", "Keep them shut", { weak: true, fx: { app: -2 }, next: "retaliation", past: "kept the borders shut", say: "The neighbours retaliate." })] },
      godfathers: { t: "The smugglers have friends in the Senate", who: "senate-president", bg: "senate-chamber", d: "The men behind the smuggling are party donors. Senators close to them are now stalling your bills 'until the Customs issue is resolved'.",
        opts: [A("stand", "Stand firm: publish the names", { fx: { app: 3 }, npc: { nass: -10, party: -6 }, next: "clean", past: "published the names of the smugglers' sponsors", say: "Names in every paper. Your bills are stuck." }),
          A("deal", "Quietly protect their routes", { weak: true, fx: { cor: .04 }, npc: { nass: 6 }, next: "retaliation", past: "protected the smugglers' routes to free your bills", say: "Your bills move. So do their trucks." })] },
      retaliation: { t: "The neighbours block our exports", who: "ecowas-envoy", bg: "foreign-ministry-meeting", d: "Benin and Niger have blocked Nigerian goods at their borders. Exporters of cement and manufactured goods are stuck, and ECOWAS has called a summit.",
        opts: [A("summit", "Go to the summit and negotiate", { fx: { app: 1 }, tr: { borderClosed: false }, next: "clean", past: "negotiated a border deal at ECOWAS", say: "A joint border protocol. Trucks move both ways again." }),
          A("escalate", "Escalate: suspend electricity sales to them", { weak: true, fx: { app: -1 }, next: "clean", past: "cut electricity sales to the neighbours", say: "Lights out in Cotonou. Nobody wins." })] },
      clean: { t: "A cleaner border", who: "revenue-officer", bg: "situation-room", endOnly: true, d: "Smuggling is down and Customs revenue up. The border towns are trading again, under scanners.",
        opts: [P("scan", "Scanners at every crossing, for good", { cost: 20, fx: { app: 2, igr: 10 }, tr: { customsClean: true }, close: true, past: "put scanners at every border crossing", say: "The border is clean." })] },
    } },
  bdc: { id: "trade_bdc", nm: "The money-changers", who: "market-trader", bg: "busy-market-street", start: "street", boil: "street", heat0: 50, drift: 2, scale: 1,
    beats: {
      street: { t: "The street rate runs away", d: "The black-market dollar is now far above the official rate. The money-changers of Wuse and Sabon Gari set the real price of everything in Nigeria.",
        opts: [OR("clamp", "Executive order: shut the street money-changers", "the Money-Changers Order", "online", .3, "online", { fx: { app: -1 }, past: "shut down the street money-changers", say: "Cleared from the streets. Back on WhatsApp by evening." }),
          A("license", "License them, and let them sell official dollars", { fx: { app: 1 }, tr: { premium: -15 }, next: "online", past: "licensed the money-changers", say: "Licensed, regulated, and the gap narrows." }),
          A("float", "Unify the rates: let the market set one price", { fx: { app: -3, igr: 10 }, tr: { floated: true }, next: "online", past: "unified the rates", say: "One price. The street rate falls to meet it." })] },
      online: { t: "The black market moves online", who: "reporter", bg: "tv-studio", endOnly: true, d: "Websites now publish the street rate every minute, and the Central Bank's rate means nothing. Your economic team is divided.",
        opts: [A("float", "Accept the market's rate", { fx: { app: -2, igr: 8 }, tr: { floated: true }, close: true, past: "accepted the market rate", say: "The websites lose their point." }),
          OR("block", "Executive order: block the rate websites", "the Rate Websites Order", "online", .6, "online", { fx: { app: -2 }, close: true, past: "blocked the exchange-rate websites", say: "Blocked. VPNs sell out." })] },
    } },
  ports: { id: "trade_ports", nm: "Apapa", who: "revenue-officer", bg: "situation-room", start: "gridlock", boil: "gridlock", heat0: 50, drift: 2, scale: 1,
    beats: {
      gridlock: { t: "Twenty kilometres of trucks at Apapa", scene: "port-congestion", d: "Trucks queue for twenty kilometres to reach the Lagos ports. Importers pay demurrage every day a container waits; some ships are diverting to Lomé and Cotonou.",
        opts: [P("call", "An electronic call-up system for trucks, and tow the broken ones", { cost: 20, fx: { app: 2 }, next: "east", past: "brought in an electronic truck call-up at Apapa", say: "The queue halves in a month." }),
          OR("ban", "Executive order: trucks into the port only at night", "the Port Access Order", "east", .2, "east", { fx: { app: 1 }, past: "allowed trucks into Apapa only at night", say: "The days clear. The nights jam." }),
          BL("ports", "A Ports and Harbours Bill: new ports in the East and the North", "Ports and Harbours (Reform) Bill", "east", "east", { past: "sent a ports reform bill to the Assembly", say: "If it passes, Lagos stops being the only door." })] },
      east: { t: "Where to build the next port?", who: "governors-forum-chair", bg: "government-house", endOnly: true, d: "Every governor in the South wants the next deep seaport, and the northern governors want a dry port. Each ship that goes to Lomé is revenue lost.",
        opts: [P("seaport", "Build a deep seaport for the East and South-South", { cost: 50, fx: { app: 2 }, tr: { build: "seaport" }, close: true, past: "started a deep seaport for the East", say: "Work starts. It opens in three years." }),
          P("dryport", "Build a dry port in Kano", { cost: 25, fx: { app: 2 }, tr: { build: "dryport" }, close: true, past: "started a dry port in Kano", say: "It opens in two years." }),
          P("rail", "Rehabilitate the cargo rail line, Lagos to Kano", { cost: 40, fx: { app: 2 }, tr: { build: "rail" }, close: true, past: "started rehabilitating the cargo rail line", say: "Three years to the first cargo train." })] },
    } },
  exports: { id: "trade_exports", nm: "Selling to the world", who: "investor-foreign", bg: "foreign-ministry-meeting", start: "sesame", starts: ["sesame", "cocoa"], boil: "aflatoxin", heat0: 40, drift: 0, scale: 1,
    beats: {
      sesame: { t: "China wants all our sesame", startOnly: true, d: "A Chinese buyer offers to take every tonne of Nigerian sesame for five years, paid in dollars, if he gets exclusive rights and no export duty.",
        opts: [A("deal", "Sign, with a minimum price for farmers", { fx: { app: 2 }, tr: { exportPush: 1.5 }, next: "aflatoxin", past: "signed the sesame deal with a farmers' floor price", say: "Dollars for five years, and farmers paid a floor price." }),
          P("compete", "Refuse exclusivity: build an export exchange instead", { cost: 20, fx: { app: 1 }, tr: { exportPush: 1 }, next: "processing", past: "built a commodity export exchange", say: "Many buyers, better prices, a slower start." }),
          OR("duty", "Executive order: an export duty on raw sesame", "the Raw Commodities Order", "processing", .2, "processing", { fx: { igr: 8 }, past: "put a duty on raw sesame exports", say: "Process it here, or pay." })] },
      cocoa: { t: "Cocoa at record prices", startOnly: true, d: "World cocoa prices are at a record. Nigerian farmers could earn billions, if the beans reach the ports dry and clean, and are not smuggled to Ghana.",
        opts: [P("extension", "Extension workers and drying yards for cocoa farmers", { cost: 25, fx: { app: 2 }, tr: { exportPush: 1.5 }, next: "aflatoxin", past: "funded drying yards and extension work for cocoa", say: "Better beans, better prices." }),
          BL("board", "A Cocoa Board Bill: grading and a fair price", "Cocoa Development Board Bill", "processing", "aflatoxin", { past: "sent a Cocoa Board Bill to the Assembly", say: "Graded beans and a floor price, if it passes." }),
          A("leave", "Leave it to the market", { weak: true, next: "aflatoxin", past: "left cocoa to the market", say: "The beans go to Ghana." })] },
      aflatoxin: { t: "Europe rejects our shipments", who: "doctor", bg: "foreign-ministry-meeting", d: "The European Union has rejected forty containers of Nigerian beans and sesame for aflatoxin and pesticide residues. Exporters face a ban.",
        opts: [P("labs", "Testing labs at every port, and training for farmers", { cost: 20, fx: { app: 2 }, tr: { exportPush: 1 }, next: "processing", past: "built export testing labs at the ports", say: "The ban is lifted in six months." }),
          OR("ban", "Executive order: no export without a certificate", "the Export Certification Order", "processing", .2, "processing", { past: "required certificates for every export", say: "Fewer containers, cleaner ones." })] },
      processing: { t: "Process it here?", who: "manufacturers-rep", bg: "finance-ministry-office", endOnly: true, d: "Raw beans earn a fifth of what chocolate does. Investors will build processing plants, if the power is reliable and the export rules stay the same.",
        opts: [P("zones", "Export processing zones with their own power", { cost: 40, fx: { app: 3 }, tr: { exportPush: 2, factories: 6 }, close: true, past: "built export processing zones", say: "The first chocolate factory in Ondo opens." }),
          BL("afcfta", "Ratify the African free trade rules into law", "AfCFTA (Implementation) Bill", "processing", "processing", { close: true, tr: { exportPush: 1 }, past: "wrote the African free trade rules into law", say: "Nigerian goods move across Africa duty-free." })] },
    } },
};
// Apply a trade option's changes to the state of trade.
export const tradeApply = (T0, tr = {}, turn = 0) => {
  const T = { ...T0, infra: { ...T0.infra } };
  Object.entries(tr).forEach(([k, v]) => {
    if (k === "build") { if (TRADE_INFRA[v] && T.infra[v] == null) T.infra[v] = turn + TRADE_INFRA[v].years; }
    else if (typeof v === "number" && typeof T[k] === "number") T[k] = Math.max(0, T[k] + v);
    else if (typeof v === "number") T[k] = v;
    else T[k] = v;
  });
  return T;
};
// Open a trade storyline.
export const tradeOpen = (T, id, r = Math.random) => ({ ...T, stories: { ...(T.stories || {}), [id]: storyStart(TRADE_STORIES[id], id, r) } });

/* ── A state's exports (the governor) ──
   Every state grows something the world buys. The governor chooses how the
   state sells it (raw through aggregators, a processing zone, or a logistics
   hub to the port), and earns money every year it reaches the buyers. The
   President's trade stance, which the governor does not control, changes
   what that is worth. */
export const STATE_PRODUCE = {
  Abia: ["palm oil", "Aba leather goods"], Adamawa: ["cotton", "groundnuts"], Akwa_Ibom: ["palm oil", "cassava"], Anambra: ["cassava", "palm oil"], Bauchi: ["sesame", "groundnuts"],
  Bayelsa: ["palm oil", "smoked fish"], Benue: ["sesame", "soybeans"], Borno: ["gum arabic", "dried fish"], Cross_River: ["cocoa", "cashew"], Delta: ["palm oil", "rubber"],
  Ebonyi: ["rice", "cashew"], Edo: ["rubber", "cocoa"], Ekiti: ["cocoa", "cashew"], Enugu: ["cashew", "cassava"], FCT: ["soybeans", "yams"], Gombe: ["cotton", "groundnuts"],
  Imo: ["palm oil", "cassava"], Jigawa: ["sesame", "hibiscus"], Kaduna: ["ginger", "maize"], Kano: ["sesame", "hides and skins"], Katsina: ["groundnuts", "sesame"],
  Kebbi: ["rice", "hibiscus"], Kogi: ["cashew", "cassava"], Kwara: ["cashew", "shea butter"], Lagos: ["manufactured goods", "seafood"], Nassarawa: ["sesame", "soybeans"],
  Niger: ["shea butter", "soybeans"], Ogun: ["cocoa", "cassava"], Ondo: ["cocoa", "cashew"], Osun: ["cocoa", "cashew"], Oyo: ["cashew", "cocoa"], Plateau: ["Irish potatoes", "ginger"],
  Rivers: ["palm oil", "cassava"], Sokoto: ["hides and skins", "sesame"], Taraba: ["Mambilla tea", "soybeans"], Yobe: ["gum arabic", "sesame"], Zamfara: ["sesame", "cotton"],
};
// States with a land border, where the federal border policy is felt first.
export const BORDER_STATES = ["Lagos", "Ogun", "Oyo", "Kwara", "Niger", "Kebbi", "Sokoto", "Zamfara", "Katsina", "Kano", "Jigawa", "Yobe", "Borno", "Adamawa", "Taraba", "Benue", "Cross_River"];
export const produceOf = (state) => STATE_PRODUCE[state] || ["cassava", "palm oil"];

export const EXPORT_PLANS = {
  raw: { nm: "Aggregate and ship raw {c}", cost: 1.5, years: 0, base: 1.2, d: "Cheap and quick: warehouses and buyers for the farmers. You earn from the first year, but raw {c} earns little." },
  zone: { nm: "An export processing zone for {c}", cost: 8, years: 2, base: 4, d: "Process it here and sell it for five times the price. Two years to build; jobs and money after." },
  hub: { nm: "An inland container depot and a farm-to-port road", cost: 5, years: 1, base: 2.5, d: "Containers packed and cleared in the state, and a good road to the port. Every crop leaves cheaper." },
};
export const cropText = (x, c) => typeof x === "string" ? x.replace(/\{c\}/g, c) : Array.isArray(x) ? x.map(v => cropText(v, c)) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, cropText(v, c)])) : x;

// What the President's stance does to a state's exports (the governor sees it as Abuja's policy).
export const FED_STANCE_FX = {
  protect: { raw: 1.15, zone: .85, hub: 1, border: .85, d: "Abuja has banned many imports: local food prices are high, so farmers earn more, but machines for processing are dear, and the border markets are dead." },
  open: { raw: .85, zone: 1.15, hub: 1.05, border: 1.05, d: "Abuja has opened the borders: imported food undercuts the farmers, but machines and packaging are cheap." },
  targeted: { raw: 1, zone: 1, hub: 1, border: 1, d: "Abuja protects only what local farms can supply. Your exports are neither helped nor hurt." },
};
export const exportInit = (state, plan, turn, crop) => ({ crop: crop || produceOf(state)[0], plan, t0: turn, opens: turn + (EXPORT_PLANS[plan] ? EXPORT_PLANS[plan].years : 0), stories: {}, mods: {}, hist: [], earned: 0 });

/* A state's export year. ctx: { turn, sec, agr (0–1), stance, border (bool) }.
   Returns { E, cash (₦B), lines, open: story id to start, or null }. */
export const stateExportYear = (E0, ctx = {}, r = Math.random) => {
  const E = { ...E0, mods: { ...(E0.mods || {}) }, stories: { ...(E0.stories || {}) } }, P = EXPORT_PLANS[E.plan], F = FED_STANCE_FX[ctx.stance] || FED_STANCE_FX.targeted, lines = [];
  if (!P) return { E, cash: 0, lines, open: null };
  if ((ctx.turn || 0) < E.opens) { lines.push(cropText(P.nm, E.crop) + ": " + (E.opens - ctx.turn) + " more year" + (E.opens - ctx.turn === 1 ? "" : "s") + " to build."); return { E, cash: 0, lines, open: null }; }
  const M = E.mods;
  let cash = P.base * (.5 + (ctx.agr == null ? .5 : ctx.agr)) * (ctx.sec != null && ctx.sec < .4 ? .7 : 1) * F[E.plan] * (ctx.border ? F.border : 1)
    * (M.banned ? .3 : 1) * (M.clean ? 1.2 : 1) * (M.buyer ? 1.3 : 1) * (M.coop ? 1.15 : 1) * (M.seized ? .7 : 1) * (M.hub ? 1.15 : 1) * (M.second ? 1.25 : 1) * (M.zoneAt != null && (ctx.turn || 0) >= M.zoneAt ? 1.8 : 1);
  cash = Math.round(cash * 10) / 10;
  E.earned = Math.round(((E.earned || 0) + cash) * 10) / 10;
  E.hist = [...(E.hist || []), { t: ctx.turn, cash }];
  lines.push("🚢 " + E.crop.charAt(0).toUpperCase() + E.crop.slice(1) + " exports earned the state ₦" + cash.toFixed(1) + "B this year" + (M.banned ? " (Europe's ban still bites)" : "") + ".");
  M.seized = false; // a seizure costs one year
  // One storyline at a time; a new one when the last has closed.
  const busy = Object.values(E.stories).some(S => S && !S.closed);
  const pool = Object.keys(STATE_TRADE_STORIES).filter(id => !E.stories[id] && (id !== "customs" || ctx.stance === "protect" || ctx.border || r() < .4));
  const open = !busy && pool.length && (E.hist.length >= 1) ? pool[Math.floor(r() * pool.length)] : null;
  return { E, cash, lines, open };
};

const SP = (id, l, x) => ({ id, kind: "programme", l, ...x });
const SB = (id, l, nm, pass, fail, x) => ({ id, kind: "bill", l, bill: { nm, pass, fail }, cost: .2, ...x });
const SO = (id, l, nm, next, risk, struck, x) => ({ id, kind: "order", l, next, order: { nm, risk, struck }, cost: .1, ...x });
const SA = (id, l, x) => ({ id, kind: "act", l, ...x });
const sstory = (id, nm, beats, boil, extra = {}) => ({ id: "export_" + id, nm, start: "a", starts: beats.a2 ? ["a", "a2"] : undefined, boil, heat0: 40, drift: 0, scale: .05, beats, ...extra });
/* mod: changes to the export's standing (E.mods) when chosen: banned, clean,
   buyer, coop, seized, hub; and from the State Economic Council, second (the
   second crop too) and zoneAt (a processing zone opening that year). Costs in ₦B. */
export const STATE_TRADE_STORIES = {
  aflatoxin: sstory("aflatoxin", "The rejected containers", {
    a: { t: "Europe sends back our {c}", startOnly: true, who: "doctor", bg: "foreign-ministry-meeting", d: "Twelve containers of the state's {c} were rejected at Rotterdam for aflatoxin and pesticide residues. The buyer says one more rejection and the state is blacklisted.",
      opts: [SP("lab", "Build a state testing lab and train the farmers", { cost: 1.2, fx: { app: 1 }, mod: { banned: false, clean: true }, next: "b", past: "built a testing lab after the rejected containers", say: "Every batch tested before it leaves. The next containers pass." }),
        SO("ban", "Executive order: no pesticide sales without a licence", "the Agro-Chemicals Order", "b", .25, "c", { mod: { banned: false }, past: "licensed pesticide sellers", say: "Dealers furious; farmers confused, but the residues fall." }),
        SA("blame", "Blame the buyer and look for another", { weak: true, mod: { banned: true }, next: "c", past: "blamed the European buyer for the rejected containers", say: "No other buyer wants rejected {c}." })] },
    a2: { t: "A shipment poisoned in storage", startOnly: true, who: "health-worker", bg: "rural-health-centre", d: "Damp warehouses turned a season's {c} mouldy. Some of it was sold in local markets anyway, and the hospital in {l} is treating families for food poisoning.",
      opts: [SP("dry", "Drying yards and hermetic bags for every cooperative", { cost: .9, fx: { app: 2, hp: .01 }, mod: { clean: true }, next: "b", past: "gave cooperatives drying yards and hermetic bags", say: "The next harvest is stored dry." }),
        SB("standards", "A Produce Standards Bill: grading at every warehouse", "Produce Standards and Grading Bill", "b", "c", { past: "sent a Produce Standards Bill to the House", say: "Graded produce only, if it passes." }),
        SA("quiet", "Keep it quiet; recall what you can", { weak: true, fx: { cor: .02 }, mod: { banned: true }, next: "c", past: "kept the mouldy {c} quiet", say: "A reporter finds the hospital records." })] },
    b: { t: "Clean {c}, better prices", endOnly: true, who: "investor-foreign", bg: "foreign-ministry-meeting", scene: "money-agric-exports", d: "Buyers now ask for the state's {c} by name. A European importer wants a five-year contract, if the quality holds.",
      opts: [SA("sign", "Sign the five-year contract", { fx: { app: 2 }, mod: { buyer: true }, close: true, past: "signed a five-year export contract", say: "Five years of steady dollars." })] },
    c: { t: "Blacklisted", who: "investor-foreign", bg: "foreign-ministry-meeting", d: "The European Union has blacklisted the state's {c}. Exporters are selling to smugglers at half the price.",
      opts: [SP("lab", "Build the testing lab now, and appeal the blacklist", { cost: 1.5, fx: { app: 1 }, mod: { banned: false, clean: true }, next: "b", past: "built a testing lab to lift the blacklist", say: "The blacklist is lifted after a year of clean tests." }),
        SA("asia", "Sell to Asian buyers at a discount", { mod: { banned: false }, close: true, past: "sold the state's {c} to Asian buyers at a discount", say: "Less money, but money." })] },
  }, "c"),
  middlemen: sstory("middlemen", "The middlemen", {
    a: { t: "Farmers in {l} sell at half price", startOnly: true, who: "village-head", bg: "northern-farmland", d: "Middlemen buy {c} from farmers in {l} at harvest, when prices are lowest, and sell it to exporters for double. The farmers say the state's export money never reaches them.",
      opts: [SP("coop", "Fund farmers' cooperatives with their own warehouses", { cost: .8, fx: { app: 2, agr: .01 }, dz: 2, mod: { coop: true }, next: "b", past: "funded farmers' cooperatives in {l}", say: "The farmers store and sell together, when prices are high." }),
        SO("floor", "Executive order: a minimum farm-gate price", "the Farm-Gate Price Order", "c", .35, "c", { fx: { app: 2 }, dz: 2, past: "set a minimum farm-gate price", say: "Popular in {l}. The middlemen stop buying." }),
        SA("market", "Leave it to the market", { weak: true, dz: -1, next: "c", past: "left the farmers to the middlemen", say: "The farmers sell at half price again." })] },
    a2: { t: "The aggregators' cartel", startOnly: true, who: "godfather", bg: "back-room", d: "Three aggregators control every truck that carries {c} out of the state. They have agreed a price among themselves, and one of them funded your campaign.",
      opts: [SP("exchange", "A state commodity exchange: open bids, many buyers", { cost: 1, fx: { app: 2 }, mod: { coop: true }, next: "b", past: "opened a state commodity exchange", say: "Open bids. The cartel's price breaks." }),
        SA("deal", "Ask your donor to pay the farmers more", { weak: true, fx: { cor: .02 }, next: "c", past: "asked the aggregators to be fair", say: "He promises. Nothing changes." })] },
    b: { t: "The farmers are earning", endOnly: true, who: "village-head", bg: "village-square", d: "Cooperatives now sell the state's {c} straight to exporters. Farm incomes are up, and more young people in {l} are farming.",
      opts: [SA("hold", "Keep it going", { fx: { app: 2 }, dz: 1, close: true, past: "turned the state's farmers into exporters", say: "The cooperatives grow every year." })] },
    c: { t: "The farmers march on Government House", who: "market-women-group-angry", bg: "street-protest", d: "Farmers from {l} blocked the road to Government House with sacks of unsold {c}. 'The export money goes to the middlemen,' their placards say.",
      opts: [SP("buy", "The state buys the crop at a fair price this year", { cost: 1.5, fx: { app: 3 }, dz: 3, next: "b", past: "bought the farmers' unsold {c}", say: "The sacks go to the state warehouse." }),
        SB("coopbill", "A Cooperatives Bill: farmers own the warehouses", "Agricultural Cooperatives Bill", "b", "b", { past: "sent a Cooperatives Bill to the House", say: "If it passes, the farmers own the warehouses." })] },
  }, "c"),
  buyer: sstory("buyer", "The exclusive buyer", {
    a: { t: "A foreign company wants all our {c}", startOnly: true, who: "investor-foreign", bg: "governor-office", scene: "trade-deal-signing", d: "A foreign trading house offers to buy every tonne of the state's {c} for ten years, paid in dollars, if it gets exclusive rights and no state levy.",
      opts: [SA("sign", "Sign, with a floor price for farmers", { fx: { app: 2 }, mod: { buyer: true }, next: "b", past: "signed an exclusive {c} deal with a floor price", say: "Ten years of dollars, and the farmers protected." }),
        SA("refuse", "Refuse exclusivity: many buyers, open bids", { fx: { app: 1 }, mod: { coop: true }, next: "c", past: "refused an exclusive buyer", say: "Slower money, but nobody owns the state's {c}." }),
        SB("levy", "A Produce Levy Bill: a small levy on every tonne exported", "Produce Export Levy Bill", "c", "c", { past: "sent a produce levy bill to the House", say: "A levy for the state, if it passes." })] },
    b: { t: "The buyer cuts the price", who: "investor-foreign", bg: "governor-office", d: "Two years into the deal, the buyer says world prices have fallen and offers farmers 30% less. There is no other buyer: the contract says so.",
      opts: [SA("court", "Take them to arbitration", { cost: .4, odds: .55, win: { fx: { app: 3 }, say: "The arbitrator holds them to the floor price." }, lose: { fx: { app: -2 }, mod: { buyer: false }, say: "You lose. The buyer walks away." }, close: true, past: "took the exclusive buyer to arbitration" }),
        SA("accept", "Accept the cut", { weak: true, fx: { app: -2 }, close: true, past: "accepted the buyer's price cut", say: "The farmers are angry." })] },
    c: { t: "Buyers compete for our {c}", endOnly: true, who: "investor-nigerian", bg: "finance-ministry-office", d: "Without one buyer owning the crop, five trading houses now bid for the state's {c} every season.",
      opts: [SA("hold", "Keep the market open", { fx: { app: 1 }, mod: { buyer: true }, close: true, past: "kept the state's {c} market open", say: "Five buyers, better prices." })] },
  }, "b"),
  customs: sstory("customs", "Containers at the port", {
    a: { t: "Customs hold our {c} at Apapa", startOnly: true, who: "revenue-officer", bg: "situation-room", scene: "port-congestion", d: "Forty containers of the state's {c} have been held at the Lagos port for six weeks. The federal Customs Service says the paperwork is wrong; exporters say someone wants a bribe.",
      opts: [SA("call", "Call the Comptroller-General in Abuja", { fx: { app: 1 }, next: "b", past: "called Abuja about the held containers", say: "Released in a week. The exporters say thank you." }),
        SP("desk", "Open a state export desk to do the paperwork for exporters", { cost: .5, fx: { app: 1 }, mod: { seized: false, hub: true }, next: "b", past: "opened a state export desk", say: "Papers done right the first time." }),
        SA("pay", "Let the exporters 'settle' it", { weak: true, fx: { cor: .02 }, mod: { seized: true }, next: "c", past: "let exporters settle the Customs officers", say: "It works this time. Now it is the price every time." })] },
    b: { t: "A dry port at home?", endOnly: true, who: "revenue-officer", bg: "government-house", d: "Abuja offers the state an inland Customs post: containers sealed and cleared here, never opened again until they reach the ship. The state must provide the land and the road.",
      opts: [SP("icd", "Provide the land and the road", { cost: 1.5, fx: { app: 2 }, mod: { hub: true }, close: true, past: "built an inland Customs post", say: "Containers leave the state sealed." }),
        SA("decline", "Decline: Lagos will do", { close: true, past: "declined an inland Customs post", say: "The containers still go through Apapa." })] },
    c: { t: "The containers rot", who: "revenue-officer", bg: "situation-room", d: "This time the 'settlement' was not enough. Containers of {c} have been held for three months, and the produce inside is spoiling.",
      opts: [SA("press", "Go public: name the port officials", { fx: { app: 2 }, mod: { seized: false }, next: "b", past: "named the port officials holding the state's exports", say: "Released within days. Abuja is embarrassed." }),
        SA("write", "Write them off", { weak: true, fx: { app: -1 }, mod: { seized: true }, close: true, past: "wrote off the spoiled containers", say: "A year's earnings, rotted." })] },
  }, "c"),
};
