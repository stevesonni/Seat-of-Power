/* The Special Adviser's yearly economic letter (governor and President).
   Each year one real economic question, chosen from the year's own figures,
   never the same one twice in a term. Every answer changes something now
   (approval, money, the trade figures) and most change something next year
   too (later): that follow-up is reported at the year's turn and recalled in
   the next letter, so a choice is a consequence, not a box ticked.

   An option: { id, l (label), tag?, kind?, fx, tr?, act?, later?, past }
     fx: { app, pStab, cor, sec, agr, infra (0–1 deltas as in the game),
           cost (₦B paid now), gain (₦B received now), borrow (₦B: cash now, debt too),
           igr (₦B a year, for good), debtCut (₦B of debt paid off from the bank) }
     tr: trade figures (President): { reserves, food, factories, exports, smuggling, premium }
     act: "convene" opens the Economic Council at once.
     later: { text, fx, tr } arrives at next year's turn.
     past: "you …" for next year's recall. */

const O = (id, l, fx = {}, extra = {}) => ({ id, l, fx, ...extra });

// ctx (President): { T (trade figures), stance, cash, debt, app, cor, turn }
const NAT = [
  { id: "eac", pri: (c) => c.stance ? -1 : 100, when: (c) => !c.stance,
    t: () => "The economy needs your trade policy",
    d: (c) => "Your Excellency, nobody has told the markets what this government wants. Reserves are $" + c.T.reserves + "bn and food prices are " + pc(c.T.food) + ". The Economic Advisory Council can sit today and set the trade policy.",
    opts: [O("convene", "Convene the Economic Advisory Council now", {}, { act: "convene", past: "convened the Economic Advisory Council" }),
      O("wait", "Not yet: let the markets settle first", { app: -1 }, { later: { text: "A year without a trade policy: importers hoarded dollars and the naira slid.", tr: { premium: 8, reserves: -2 } }, past: "left the trade policy unset" })] },
  { id: "subsidy", pri: (c) => c.turn <= 2 ? 80 : 40, when: () => true,
    t: () => "The petrol subsidy is eating the budget",
    d: (c) => "This year it will cost more than the whole health budget, and a third of the cheap petrol is smuggled to the neighbours. The bank holds " + nB(c.cash) + ".",
    opts: [O("remove", "Remove it in one go", { app: -7, igr: 2.5 }, { tr: { food: 6, smuggling: -6 }, later: { text: "Transport fares doubled, then settled. The savings are now in the budget: ₦2.5B a year.", fx: { app: 2 } }, past: "removed the petrol subsidy in one go" }),
      O("phase", "Phase it out over three years, with cash transfers to the poorest", { app: -2, cost: 1.5, igr: 1.2 }, { tr: { food: 2 }, later: { text: "The transfers reached four million households, but some lists were padded with ghost names.", fx: { cor: .02, app: 1 } }, past: "phased out the subsidy with cash transfers" }),
      O("keep", "Keep it: the people cannot take another shock", { app: 2, igr: -1.5 }, { tr: { reserves: -3, smuggling: 6 }, later: { text: "Subsidised petrol kept crossing the borders; the bill grew again.", tr: { reserves: -2 } }, past: "kept the petrol subsidy" })] },
  { id: "food", pri: (c) => c.T.food >= 112 ? 90 : -1, when: (c) => c.T.food >= 112,
    t: (c) => "Food prices are up " + (c.T.food - 100) + "%",
    d: () => "A bag of rice costs a month's minimum wage in some states. The Minister of Agriculture and the Customs Comptroller disagree on what to do.",
    opts: [O("import", "Open a 150-day import window for rice and maize", { app: 3 }, { tr: { food: -9, factories: -2, smuggling: -4 }, later: { text: "Farmers sold at a loss after the import window; fewer planted this year.", tr: { food: 4 } }, past: "opened an import window for food" }),
      O("reserve", "Release the strategic grain reserve", { app: 2, cost: 1 }, { tr: { food: -4 }, later: { text: "The grain reserve is empty: nothing is left for a drought.", fx: {} }, past: "released the strategic grain reserve" }),
      O("dryseason", "Dry-season farming loans for 200,000 farmers", { cost: 2 }, { tr: { food: -1 }, later: { text: "The dry-season harvest is in: food prices fell.", tr: { food: -8 }, fx: { app: 3, agr: .02 } }, past: "funded dry-season farming" })] },
  { id: "naira", pri: (c) => c.T.reserves < 22 || c.T.premium >= 60 ? 88 : -1, when: (c) => c.T.reserves < 22 || c.T.premium >= 60,
    t: (c) => "Reserves are down to $" + c.T.reserves + "bn",
    d: (c) => "The street rate is " + c.T.premium + "% above the official rate. The Central Bank Governor wants your answer before the markets open.",
    opts: [O("float", "Let the naira float", { app: -5 }, { tr: { premium: -25, reserves: 2, food: 6, exports: 1 }, later: { text: "The gap between the official and the street rate closed; investors came back.", tr: { reserves: 4 }, fx: { app: 2 } }, past: "floated the naira" }),
      O("eurobond", "Borrow $3bn with a Eurobond", { borrow: 3 }, { tr: { reserves: 5 }, later: { text: "The first interest bill on the Eurobond arrived.", fx: { cost: .6 } }, past: "borrowed $3bn abroad" }),
      O("ban41", "Ban dollars for 41 import items", { cor: .02 }, { tr: { factories: 4, premium: 15, smuggling: 8 }, later: { text: "Permits for the banned items are being sold for cash at the Central Bank.", fx: { cor: .02, app: -2 } }, past: "banned dollars for 41 import items" })] },
  { id: "factories", pri: (c) => c.T.factories < 48 ? 75 : -1, when: (c) => c.T.factories < 48,
    t: (c) => "Factories are closing: " + c.T.factories + "/100",
    d: () => "The Manufacturers Association says diesel and power now cost more than wages. Three tyre and two textile plants shut this quarter.",
    opts: [O("power", "Gas and power for the industrial clusters first", { cost: 2 }, { later: { text: "Three industrial clusters have steady power now; factories reopened.", tr: { factories: 8 }, fx: { app: 2 } }, past: "put power into the industrial clusters" }),
      O("holiday", "A five-year tax holiday for manufacturers", { igr: -.8 }, { tr: { factories: 5 }, later: { text: "Some firms took the holiday and plan to leave when it ends.", tr: { factories: -2 } }, past: "gave manufacturers a tax holiday" }),
      O("tariff", "Raise tariffs on finished imports", {}, { tr: { factories: 4, food: 3, smuggling: 6 }, later: { text: "Smugglers moved in where the tariffs bit.", tr: { smuggling: 4 } }, past: "raised tariffs on finished imports" })] },
  { id: "windfall", pri: (c) => c.turn >= 2 ? 45 : -1, when: (c) => c.turn >= 2,
    t: () => "Oil is above $90: a windfall",
    d: () => "The Finance Minister expects ₦4B more than the budget this year. Every governor has already written to ask for a share.",
    opts: [O("swf", "Save it in the Sovereign Wealth Fund", {}, { tr: { reserves: 4 }, later: { text: "The saved windfall cushioned this year's oil dip.", tr: { reserves: 2 } }, past: "saved the oil windfall" }),
      O("spend", "Spend it on roads and rail now", { app: 4, cor: .02, infra: .02 }, { later: { text: "Contractors were paid; half the sites are moving.", fx: { app: 1 } }, past: "spent the oil windfall on roads and rail" }),
      O("debt", "Pay down debt with it", { debtCut: 3 }, { later: { text: "The rating agencies upgraded Nigeria: borrowing is cheaper.", fx: { app: 1 } }, past: "paid down debt with the windfall" })] },
  { id: "wage", pri: (c) => c.turn >= 2 ? 55 : -1, when: (c) => c.turn >= 2,
    t: () => "The NLC wants a new minimum wage",
    d: () => "₦70,000 a month, or a general strike in thirty days. Half the governors say their states cannot pay it.",
    opts: [O("full", "Raise it to ₦70,000", { app: 5, igr: -1 }, { tr: { food: 3 }, later: { text: "Half the states could not pay the new wage; their workers walked out.", fx: { app: -2 } }, past: "raised the minimum wage to ₦70,000" }),
      O("review", "A smaller rise, with a review in two years", { app: 1, igr: -.4 }, { past: "gave a smaller wage rise" }),
      O("refuse", "Refuse: the economy cannot carry it", { app: -5, pStab: -2 }, { later: { text: "The NLC staged a two-day general strike.", fx: { app: -2 } }, past: "refused the minimum wage rise" })] },
  { id: "vat", pri: (c) => c.cash < 3 || c.debt > 40 ? 70 : 30, when: () => true,
    t: () => "Revenue is short of the budget",
    d: (c) => "Debt stands at " + nB(c.debt) + " and the Finance Minister wants new money without new loans.",
    opts: [O("vat", "Raise VAT from 7.5% to 10%", { app: -4, igr: 1.8 }, { tr: { food: 2 }, past: "raised VAT" }),
      O("net", "Widen the tax net: register the informal sector", { cost: .5 }, { later: { text: "Two million new taxpayers registered.", fx: { igr: 1.2 } }, past: "began registering the informal sector for tax" }),
      O("merge", "Cut waste instead: merge overlapping agencies", { pStab: -3, igr: .6 }, { later: { text: "Staff of the merged agencies took the government to court.", fx: { app: -1 } }, past: "merged overlapping agencies" })] },
  { id: "rates", pri: (c) => c.T.food >= 106 ? 50 : 20, when: () => true,
    t: () => "The Central Bank wants to raise interest rates",
    d: () => "Inflation will not come down otherwise, says the Governor of the Central Bank. The manufacturers say a hike will finish them.",
    opts: [O("back", "Back the hike", { app: -1 }, { tr: { food: -4, factories: -3 }, past: "backed an interest-rate hike" }),
      O("hold", "Press the Governor to hold", { pStab: 1 }, { tr: { food: 3, premium: 8 }, later: { text: "Markets read it as a Central Bank that takes orders; dollars left.", tr: { reserves: -2 } }, past: "pressed the Central Bank to hold rates" })] },
  { id: "oiltheft", pri: () => 35, when: () => true,
    t: () => "Oil output has fallen to 1.3 million barrels a day",
    d: () => "Thieves tap the pipelines in the creeks. Every barrel lost is a dollar the reserves never see.",
    opts: [O("guards", "Pay ex-militants to guard the pipelines", { cost: 1, cor: .03 }, { later: { text: "Output is back to 1.6 million barrels; the guard contracts are a scandal.", tr: { reserves: 3 }, fx: { app: -1 } }, past: "paid ex-militants to guard pipelines" }),
      O("navy", "Send the Navy and the Joint Task Force", { sec: .01 }, { later: { text: "Arrests made; the theft halved.", tr: { reserves: 2 } }, past: "sent the Navy into the creeks" })] },
  { id: "rating", pri: (c) => c.debt > 35 ? 65 : -1, when: (c) => c.debt > 35,
    t: () => "A rating agency may downgrade Nigeria",
    d: (c) => "Debt of " + nB(c.debt) + " worries the lenders. A downgrade makes every new loan dearer.",
    opts: [O("plan", "Publish a debt plan and borrow less", { app: -1, pStab: -2 }, { later: { text: "The rating held.", tr: { reserves: 1 } }, past: "published a debt plan" }),
      O("ignore", "Ignore them", {}, { later: { text: "Nigeria was downgraded: loans now cost more.", fx: { cost: .8 } }, past: "ignored the rating agency" })] },
];

// ctx (governor): { igr, faac, cash, debt, arrears, app, cor, turn, exportsOn, crop, stName }
const GOV = [
  { id: "econ", pri: (c) => c.exportsOn ? -1 : 100, when: (c) => !c.exportsOn,
    t: (c) => "Sell " + c.stName + "'s " + c.crop + " to the world",
    d: (c) => "Your Excellency, Abuja's allocation will not grow, but what our farms produce can earn every year. The State Economic Council can sit today. Taxes and fees bring in " + nB(c.igr) + " a year.",
    opts: [O("convene", "Convene the State Economic Council now", {}, { act: "convene", past: "convened the State Economic Council" }),
      O("wait", "Not this year", {}, { later: { text: "A year without an export plan: the buyers went to the next state.", fx: { app: -1 } }, past: "left the export plan for later" })] },
  { id: "igr", pri: (c) => c.igr < (c.faac || 1) * .6 ? 85 : 40, when: () => true,
    t: (c) => "Taxes and fees bring in only " + nB(c.igr) + " a year",
    d: (c) => "Most of the money comes from Abuja. Collectors take cash at the counter and much of it never reaches the account.",
    opts: [O("digital", "Digitise collection: no more cash at the counter", { cost: .3, cor: -.02 }, { later: { text: "Collections are up a fifth: the touts lost their cut.", fx: { igr: .8 } }, past: "digitised revenue collection" }),
      O("landuse", "Raise the land use charge", { igr: .7, app: -3 }, { past: "raised the land use charge" }),
      O("consult", "Hire collection consultants on commission", { igr: .5, cor: .02 }, { later: { text: "The consultants take 20%; traders complain of harassment.", fx: { app: -2 } }, past: "hired revenue consultants on commission" })] },
  { id: "faac", pri: (c) => c.cash < 2 ? 80 : 35, when: () => true,
    t: () => "Abuja's allocation is down this year",
    d: (c) => "Oil revenue fell, so FAAC fell. The bank holds " + nB(c.cash) + " and salaries come first.",
    opts: [O("cut", "Cut overheads: fewer convoys, no foreign trips", { pStab: -2, app: 2, gain: .5 }, { past: "cut the government's overheads" }),
      O("bridge", "Borrow from a bank to bridge it", { borrow: 1.5 }, { later: { text: "The bridging loan's interest fell due.", fx: { cost: .3 } }, past: "took a bridging loan" }),
      O("delay", "Delay contractor payments", { gain: 1 }, { later: { text: "Two contractors left their sites; the roads stopped.", fx: { app: -2 } }, stall: true, past: "delayed contractor payments" })] },
  { id: "levies", pri: () => 50, when: () => true,
    t: () => "Traders say they pay ten different levies",
    d: () => "Market women showed the Commissioner a fistful of receipts: state, local government, union and 'area boys'. They threaten to shut the markets.",
    opts: [O("one", "One levy, collected digitally", { igr: -.3, app: 3 }, { later: { text: "Traders pay the single levy, and it brings in more than the ten did.", fx: { igr: .6 } }, past: "replaced the market levies with one" }),
      O("leave", "Leave the local governments' levies alone", { pStab: 2 }, { later: { text: "Traders shut the main market for a day in protest.", fx: { app: -2 } }, past: "left the market levies alone" })] },
  { id: "wage", pri: (c) => c.turn >= 2 ? 60 : -1, when: (c) => c.turn >= 2,
    t: () => "Workers want the new minimum wage",
    d: (c) => "The state NLC wants it from this month. " + (c.arrears ? "Salaries are already " + c.arrears + " months behind." : "Salaries are paid up to date."),
    opts: [O("full", "Pay it in full", { app: 4, igr: -.8 }, { past: "paid the new minimum wage in full" }),
      O("low", "Pay it to the lowest grades only", { app: 1, igr: -.3 }, { past: "paid the new wage to the lowest grades" }),
      O("no", "Say the state cannot afford it", { app: -4 }, { later: { text: "The state NLC called a three-day strike.", fx: { app: -2 } }, past: "refused the new minimum wage" })] },
  { id: "food", pri: () => 45, when: () => true,
    t: () => "Food prices in the markets",
    d: () => "Garri, beans and tomatoes cost twice what they did two years ago. The Commissioner for Agriculture has a plan; so does the Commissioner for Commerce.",
    opts: [O("inputs", "Seed, fertiliser and tractors at half price", { cost: 1 }, { later: { text: "A bigger harvest came in; prices eased in the markets.", fx: { app: 3, agr: .03 } }, past: "subsidised seed and fertiliser" }),
      O("bank", "A state food bank for the poorest", { cost: .6, app: 2 }, { later: { text: "The food bank's stock went missing in two local governments.", fx: { cor: .02 } }, past: "opened a state food bank" }),
      O("market", "Leave it to the market", { app: -2 }, { past: "left food prices to the market" })] },
  { id: "bond", pri: (c) => c.cash < 3 && c.debt < 25 ? 55 : 20, when: (c) => c.debt < 30,
    t: () => "A bank offers to arrange a state bond",
    d: (c) => "₦3B on the stock exchange, repaid over seven years. Debt now stands at " + nB(c.debt) + ".",
    opts: [O("issue", "Issue the bond for roads and schools", { borrow: 3, infra: .01 }, { later: { text: "The bond's first coupon is due.", fx: { cost: .4 } }, past: "issued a state bond" }),
      O("no", "No new debt", { pStab: 1 }, { past: "turned down a state bond" })] },
  { id: "investor", pri: () => 42, when: () => true,
    t: () => "A manufacturer wants a tax holiday",
    d: () => "A packaging company will build a plant with 1,200 jobs if the state waives its taxes for five years.",
    opts: [O("grant", "Grant five years", { igr: -.2 }, { later: { text: "The plant opened: 1,200 jobs.", fx: { app: 3 } }, past: "gave a manufacturer a tax holiday" }),
      O("land", "Offer land and power instead of the holiday", { cost: .8 }, { later: { text: "The plant opened, and it pays its taxes.", fx: { igr: .4, app: 2 } }, past: "offered a manufacturer land and power" }),
      O("refuse", "Refuse", {}, { later: { text: "They built the plant in the next state.", fx: { app: -1 } }, past: "refused a manufacturer's terms" })] },
  { id: "pensions", pri: (c) => c.turn >= 2 ? 48 : -1, when: (c) => c.turn >= 2,
    t: () => "Retirees protest unpaid pensions",
    d: () => "Old teachers and nurses sit at the Government House gate. Some have not been paid for a year.",
    opts: [O("pay", "Pay ₦1B of the arrears now", { cost: 1, app: 3 }, { past: "paid ₦1B of pension arrears" }),
      O("verify", "Verify the list first", { cost: .1 }, { later: { text: "The verification found 900 dead pensioners still being paid.", fx: { igr: .3, cor: -.01 } }, past: "ordered a pension verification" }),
      O("later", "Promise them next year", { app: -2 }, { later: { text: "The retirees occupied the Government House gate for a week.", fx: { app: -2 } }, past: "promised the retirees next year" })] },
  { id: "contractors", pri: (c) => c.turn >= 3 ? 40 : -1, when: (c) => c.turn >= 3,
    t: () => "Contractors are owed money from the last government",
    d: () => "They have taken the state to court and won. The judge wants a payment plan.",
    opts: [O("plan", "Agree a three-year payment plan", { cost: .5 }, { later: { text: "The contractors are back on the state's sites.", fx: { infra: .01 } }, past: "agreed to pay old contractors over three years" }),
      O("audit", "Audit the claims first", { cost: .1, cor: -.01 }, { later: { text: "A third of the claims were for work never done.", fx: { app: 2 } }, past: "audited the old contractors' claims" })] },
];

const pc = (f) => (f >= 100 ? "+" : "") + (f - 100) + "% on two years ago";
const nB = (b) => "₦" + (Math.round((+b || 0) * 10) / 10) + "B";

export const ECON_ISSUES = { nat: NAT, gov: GOV };
export const econInit = () => ({ used: [], pending: [], hist: [] });

// The year's question: the most pressing one not yet asked this term.
export const econPick = (E, ctx, nat, r = Math.random) => {
  const L = nat ? NAT : GOV;
  const open = L.filter(i => !(E.used || []).includes(i.id) && i.when(ctx)).map(i => ({ i, p: i.pri(ctx) + r() * 6 })).filter(x => x.p >= 0).sort((a, b) => b.p - a.p);
  return open.length ? open[0].i.id : null;
};
export const econIssue = (id, nat) => (nat ? NAT : GOV).find(i => i.id === id) || null;

/* A choice: records it (the issue is not asked again; a "convene" or "wait"
   letter may come back while the council has still not sat), and queues what
   it leads to next year. */
export const econChoose = (E, id, optId, turn, nat) => {
  const iss = econIssue(id, nat), o = iss && iss.opts.find(x => x.id === optId);
  if (!o) return { E, o: null };
  const again = optId === "wait" || o.act === "convene"; // the council question returns until the council has sat
  const n = { ...E, used: again ? (E.used || []) : [...(E.used || []), id], hist: [...(E.hist || []), { t: turn, id, opt: optId, past: o.past }], pending: [...(E.pending || [])] };
  if (o.later) n.pending.push({ due: turn + 1, id, ...o.later });
  return { E: n, o };
};
// What last year's choices led to, at this year's turn.
export const econDue = (E, turn) => {
  const due = (E.pending || []).filter(x => x.due <= turn), pending = (E.pending || []).filter(x => x.due > turn);
  return { E: { ...E, pending }, due };
};
// "Last year you …, and …": the previous answer and what came of it.
export const econRecall = (E, turn, landed = []) => {
  const h = (E.hist || []).filter(x => x.t === turn - 1).pop(); if (!h) return null;
  const l = landed.find(x => x.id === h.id);
  return "Last year you " + h.past + "." + (l ? " " + l.text : "");
};
