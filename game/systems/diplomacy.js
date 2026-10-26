/* The President's diplomacy (sky-blue letters).
   - The UN General Assembly, every September: go to New York and close one of
     two deals, or send the Vice-President for a smaller one. Each year has its
     own theme, so the letter never repeats in a term.
   - Every other year a head of government invites you to their country's
     festival: go and close one of two deals, send the Foreign Minister for a
     smaller one, or decline.
   A deal acts now (fx, tr, jobs) and lands again next year (later): the
   factory opens, the megawatts reach the grid. Countries and institutions are
   real; every person is fictional and unnamed.

   fx: { app, cor, sec, hp, lit, infra, agr (0–1 deltas), igr (₦B a year),
         gain (₦B now), borrow (₦B now, as debt), debtCut (₦B), cost (₦B) }
   tr: trade figures { reserves, food, factories, exports }
   jobs: new jobs. */

const D = (id, l, fx = {}, extra = {}) => ({ id, l, fx, ...extra });

export const UNGA_THEMES = [
  { id: "climate", t: "Climate finance for Africa",
    deals: [D("fund", "Lead Africa's call for climate money", { gain: 3, app: 2, cost: .8 }, { later: { text: "The climate fund's first ₦3B is building flood defences in the Niger valley.", fx: { agr: .01, app: 1 } }, past: "led Africa's call for climate money at the UN" }),
      D("roadshow", "Sell Nigeria to New York's investors", { igr: .6, cost: 1 }, { jobs: 4000, later: { text: "Two American firms from the New York roadshow have opened plants: 4,000 jobs.", fx: { app: 2 } }, past: "sold Nigeria to investors in New York" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "debt", t: "The debt crisis of poor nations",
    deals: [D("relief", "Lead the debt-relief coalition", { debtCut: 4, app: 2, cost: .8 }, { later: { text: "Lenders rescheduled ₦4B of Nigeria's debt after the UN coalition.", fx: { app: 1 } }, past: "led the debt-relief coalition" }),
      D("bonds", "Meet the bond markets on Wall Street", { borrow: 5, cost: .8 }, { tr: { reserves: 3 }, past: "raised money on Wall Street" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "sahel", t: "Security in the Sahel",
    deals: [D("rally", "Rally the Security Council behind a Sahel force", { sec: .015, app: 1, cost: 1 }, { later: { text: "The UN-backed Sahel force has taken its first towns back from the insurgents.", fx: { sec: .01 } }, past: "rallied the Security Council on the Sahel" }),
      D("arms", "Sign an arms-and-training deal with the Americans", { sec: .02, cost: 2, cor: .01 }, { past: "signed an arms-and-training deal" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "health", t: "The pandemic accord",
    deals: [D("vaccines", "Sign the accord: vaccines made in Nigeria", { hp: .02, cost: 1 }, { tr: { factories: 2 }, later: { text: "The vaccine plant in Ogun has delivered its first ten million doses.", fx: { hp: .01, app: 2 } }, past: "brought vaccine-making to Nigeria" }),
      D("nurses", "A deal to train nurses, not lose them", { hp: .015, lit: .005, cost: .8 }, { past: "signed a nurse-training deal" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "digital", t: "Artificial intelligence and jobs",
    deals: [D("skills", "Digital skills for a million young people", { lit: .01, cost: 1 }, { jobs: 6000, later: { text: "The digital-skills programme has placed its first 6,000 graduates in jobs.", fx: { app: 2 } }, past: "won a digital-skills programme" }),
      D("datacentres", "Data centres in Lagos and Abuja", { igr: .5, infra: .01, cost: .8 }, { jobs: 2000, past: "brought data centres to Nigeria" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "girls", t: "Girls' education",
    deals: [D("fund", "A fund to put two million girls in school", { lit: .02, app: 2, cost: .8 }, { later: { text: "Enrolment of girls in the north is up a fifth since the UN fund.", fx: { lit: .01, app: 1 } }, past: "won a fund for girls' education" }),
      D("almajiri", "Teachers for the almajiri schools", { lit: .015, sec: .005, cost: .8 }, { past: "won teachers for the almajiri schools" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "ocean", t: "The blue economy",
    deals: [D("fisheries", "Fishing rights and a Gulf of Guinea patrol", { sec: .01, cost: .8 }, { tr: { exports: 1 }, past: "secured the Gulf of Guinea" }),
      D("ports", "Port investors for Lekki and Onne", { igr: .4, cost: .8 }, { tr: { exports: 1 }, jobs: 3000, past: "brought investors to the ports" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
  { id: "peace", t: "A ceasefire to broker",
    deals: [D("mediate", "Broker the ceasefire on the floor of the Assembly", { app: 3, cost: .8 }, { later: { text: "The ceasefire Nigeria brokered at the UN has held for a year.", fx: { app: 1 } }, past: "brokered a ceasefire at the UN" }),
      D("troops", "Offer Nigerian peacekeepers", { app: 1, sec: -.005, gain: 1.5 }, { past: "sent Nigerian peacekeepers" })],
    vp: D("vp", "Send the Vice-President", { cost: .3, app: -1 }, { past: "sent the Vice-President to the UN" }) },
];
// This year's theme: a fresh one each year of the term (the order is shuffled once a game).
export const ungaFor = (turn, seed = 0) => { const n = UNGA_THEMES.length, k = ((turn - 1) + (seed % n)) % n; return UNGA_THEMES[k]; };

export const DIPLO_INVITES = [
  { id: "sweden", host: "The Prime Minister of Sweden", from: "Rosenbad, Stockholm", event: "Midsummer in Stockholm", city: "Stockholm",
    deals: [D("wind", "A green-energy partnership: 200 MW of wind and solar", { infra: .015, igr: .3, cost: 1 }, { later: { text: "The Swedish-built wind and solar farms put 200 MW on the grid.", fx: { infra: .01, app: 2 } }, past: "signed a green-energy partnership with Sweden" }),
      D("telecom", "Swedish telecoms firms to bring fast internet to the north", { lit: .005, igr: .3, cost: .8 }, { jobs: 2500, past: "brought Swedish telecoms to the north" })] },
  { id: "korea", host: "The President of the Republic of Korea", from: "The Blue House, Seoul", event: "the Lantern Festival in Seoul", city: "Seoul",
    deals: [D("shipyard", "A shipyard and refinery partnership", { cost: 1 }, { tr: { factories: 3, exports: 1 }, jobs: 5000, later: { text: "The Korean-built shipyard at Onne has launched its first vessel.", fx: { app: 2 } }, past: "signed a shipyard partnership with Korea" }),
      D("electronics", "An electronics assembly plant in Lagos", { igr: .4, cost: .8 }, { jobs: 6000, past: "brought a Korean electronics plant to Lagos" })] },
  { id: "canada", host: "The Prime Minister of Canada", from: "Parliament Hill, Ottawa", event: "Canada Day in Ottawa", city: "Ottawa",
    deals: [D("mining", "Clean mining: lithium and gold, mined by the rules", { igr: .5, cor: -.01, cost: .8 }, { tr: { exports: 1 }, past: "signed a clean-mining deal with Canada" }),
      D("scholar", "Five hundred university scholarships a year", { lit: .015, app: 1, cost: .5 }, { past: "won Canadian university scholarships" })] },
  { id: "japan", host: "The Prime Minister of Japan", from: "The Kantei, Tokyo", event: "the cherry blossom festival in Tokyo", city: "Tokyo",
    deals: [D("rail", "Trains for the coastal railway, on a cheap loan", { infra: .02, borrow: 2, cost: .8 }, { later: { text: "Japanese trains are running on the coastal line.", fx: { app: 2 } }, past: "bought Japanese trains on a cheap loan" }),
      D("cars", "A car assembly plant", { cost: .8 }, { tr: { factories: 4 }, jobs: 4000, past: "brought a Japanese car plant" })] },
  { id: "brazil", host: "The President of Brazil", from: "The Planalto Palace, Brasília", event: "Carnival in Rio de Janeiro", city: "Rio de Janeiro",
    deals: [D("farms", "Tropical farming know-how for the savanna", { agr: .02, cost: .8 }, { tr: { food: -4 }, later: { text: "The savanna farms trained by Brazilian experts brought in a record harvest.", fx: { agr: .01, app: 2 } }, past: "signed a farming partnership with Brazil" }),
      D("ethanol", "Ethanol from cassava and sugarcane", { igr: .3, cost: .8 }, { tr: { exports: 1 }, jobs: 3000, past: "started ethanol production with Brazil" })] },
  { id: "india", host: "The Prime Minister of India", from: "South Block, New Delhi", event: "Diwali in New Delhi", city: "New Delhi",
    deals: [D("medicine", "Cheaper medicines, made in Nigeria", { hp: .02, cost: .8 }, { tr: { factories: 2 }, past: "brought Indian drug-makers to Nigeria" }),
      D("it", "An IT training institute in every zone", { lit: .01, cost: .8 }, { jobs: 5000, past: "opened IT institutes with India" })] },
  { id: "germany", host: "The Chancellor of Germany", from: "The Chancellery, Berlin", event: "Oktoberfest in Munich", city: "Munich",
    deals: [D("turbines", "Gas turbines for the grid", { infra: .02, cost: 1 }, { later: { text: "The German gas turbines are running: the grid gained 600 MW.", fx: { infra: .01, app: 2 } }, past: "bought German gas turbines" }),
      D("trades", "Vocational training: welders, electricians, mechanics", { lit: .01, cost: .6 }, { jobs: 4000, past: "started vocational training with Germany" })] },
  { id: "uae", host: "The President of the United Arab Emirates", from: "Qasr Al Watan, Abu Dhabi", event: "National Day in Abu Dhabi", city: "Abu Dhabi",
    deals: [D("ports", "Investment in the Lekki port and a logistics zone", { igr: .5, cost: .8 }, { tr: { exports: 1, reserves: 2 }, past: "brought Emirati investment to the ports" }),
      D("flights", "Direct flights and a hub for Nigerian traders", { app: 1, igr: .2, cost: .5 }, { past: "opened direct flights to the Gulf" })] },
];
export const inviteFor = (used = [], r = Math.random) => { const L = DIPLO_INVITES.filter(i => !used.includes(i.id)); return L.length ? L[Math.floor(r() * L.length)] : null; };
// Sending someone instead: a smaller version of the first deal.
export const smaller = (d) => ({ ...d, fx: Object.fromEntries(Object.entries(d.fx || {}).filter(([k]) => k !== "cost").map(([k, v]) => [k, Math.round(v * 33) / 100])), tr: d.tr ? Object.fromEntries(Object.entries(d.tr).map(([k, v]) => [k, Math.round(v / 3)])) : undefined, jobs: d.jobs ? Math.round(d.jobs / 3) : undefined, later: undefined });
