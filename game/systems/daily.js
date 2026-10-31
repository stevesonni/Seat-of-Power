/* The Daily Decision: one dilemma a day, the same for every player, about a
   minute to play. After choosing you see what happened and how other
   governors chose, and get a spoiler-free card to share. Days count from
   DAILY_EPOCH (UTC); the dilemmas run in a fixed shuffled order and repeat
   after the list. All people and places are fictional or generic. */

export const DAILY_EPOCH = Date.UTC(2026, 9, 24); // Saturday 24 October 2026 is Daily #1
export const dayNo = (now = Date.now()) => Math.max(1, Math.floor((now - DAILY_EPOCH) / 864e5) + 1);
export const dayKey = (n) => "d" + n;

// fx: approval (points), cash (₦B, + is money in), party (points).
const D = [
  { id: "fuel", icon: "⛽", title: "Fuel queues stretch for kilometres", brief: "Petrol has run dry in the state capital. Okada riders are blocking the expressway and prices have tripled overnight.", bg: "busy-market-street", who: "labour-leader",
    options: [
      { label: "Subsidise fuel for buses and okada for a month", fx: { app: 4, cash: -0.8, party: 1 }, out: "The queues shrink and transport fares fall back. The Treasury feels it." },
      { label: "Crack down on hoarding depots", fx: { app: 2, cash: 0, party: -1 }, out: "Three depots are sealed and fuel appears by evening. Their owners fund your opponents." },
      { label: "Wait it out: it is a federal problem", fx: { app: -4, cash: 0, party: 0 }, out: "The queues last a week. People remember who did nothing." } ] },
  { id: "strike", icon: "✊", title: "Nurses walk out of every general hospital", brief: "Four months of unpaid allowances. Wards are empty and a baby died at the teaching hospital last night.", bg: "hospital-ward", who: "labour-leader",
    options: [
      { label: "Pay the arrears today", fx: { app: 5, cash: -1.2, party: 0 }, out: "Nurses are back by the evening shift. Other unions take note." },
      { label: "Pay half and promise the rest", fx: { app: 1, cash: -0.6, party: 0 }, out: "They return, grumbling. The promise has a date on it." },
      { label: "Hire contract nurses instead", fx: { app: -3, cash: -0.3, party: 1 }, out: "Wards reopen with strangers. The union calls a state-wide strike." } ] },
  { id: "flood", icon: "🌊", title: "The river has burst its banks", brief: "Twelve riverside communities are under water. Families are on rooftops and the dam upstream is still releasing.", bg: "flooded-community", who: null,
    options: [
      { label: "Go yourself, in boots, with the boats", fx: { app: 5, cash: -0.4, party: 1 }, out: "The picture of you waist-deep runs on every front page. The rescue works." },
      { label: "Send the emergency agency and money", fx: { app: 2, cash: -0.6, party: 0 }, out: "Camps are up in a day. Nobody saw you there." },
      { label: "Ask Abuja for federal help first", fx: { app: -2, cash: 0.3, party: 0 }, out: "Relief arrives in a week, with federal logos on every bag." } ] },
  { id: "godson", icon: "🎩", title: "The godfather wants his nephew in Works", brief: "Your political father calls at midnight. His nephew, who has never built anything, should be Commissioner for Works.", bg: "veranda-night", who: "godfather",
    options: [
      { label: "Give the nephew the job", fx: { app: -2, cash: 0, party: 4 }, out: "The godfather is pleased. The contractors already know who to call." },
      { label: "Offer him a board seat instead", fx: { app: 0, cash: 0, party: 1 }, out: "He accepts, sulking. The Works ministry stays in capable hands." },
      { label: "Refuse", fx: { app: 2, cash: 0, party: -4 }, out: "He hangs up. By morning, three lawmakers have stopped taking your calls." } ] },
  { id: "market", icon: "🔥", title: "Fire guts the main market overnight", brief: "Four hundred shops are ash. The traders say the fire service came with no water.", bg: "shuttered-market", who: null,
    options: [
      { label: "Grant each trader ₦200,000 to restart", fx: { app: 4, cash: -0.5, party: 1 }, out: "Stalls are back up in weeks. The fire service is still empty." },
      { label: "Rebuild the market properly, with hydrants", fx: { app: 2, cash: -1.0, party: 0 }, out: "A modern market rises in a year. Some traders never come back." },
      { label: "Blame the fire service chief and sack him", fx: { app: 1, cash: 0, party: 0 }, out: "Someone has paid. The traders still have nothing." } ] },
  { id: "levy", icon: "🧾", title: "A new levy on every shop sign", brief: "Your revenue agency wants ₦5,000 a year for every signboard. It could raise ₦0.6B.", bg: "busy-market-street", who: "finance-commissioner",
    options: [
      { label: "Approve it", fx: { app: -3, cash: 0.6, party: 0 }, out: "The money comes in. So do the thugs collecting it on the agency's behalf." },
      { label: "Approve it, for big firms only", fx: { app: 1, cash: 0.3, party: 0 }, out: "Banks and hotels pay. The market women thank you." },
      { label: "Reject it", fx: { app: 2, cash: 0, party: 0 }, out: "Traders cheer. The revenue gap stays." } ] },
  { id: "kidnap", icon: "🚨", title: "Students kidnapped from a boarding school", brief: "Gunmen took 37 students at 2 a.m. The kidnappers want ₦100 million and have given you two days.", bg: "classroom", who: "police-commissioner",
    options: [
      { label: "Pay quietly through a middleman", fx: { app: 2, cash: -0.1, party: 0 }, out: "The children come home. Next month, another school is hit." },
      { label: "Send in the tactical squad", fx: { app: -1, cash: -0.1, party: 1 }, out: "Thirty-one are rescued. Six are still missing." },
      { label: "Negotiate through the local chiefs", fx: { app: 3, cash: 0, party: 0 }, out: "It takes a week. Every child comes home." } ] },
  { id: "contract", icon: "🏗️", title: "Your best contractor wants the road job at double the price", brief: "He finished your last road on time. He also funded your campaign. The other bidder is cheaper and has never built a bridge.", bg: "road-construction-site", who: "contractor",
    options: [
      { label: "Give it to him at his price", fx: { app: -1, cash: -0.8, party: 3 }, out: "The road will be finished. The auditors will have questions." },
      { label: "Make him match the cheaper bid", fx: { app: 1, cash: 0, party: 1 }, out: "He grumbles and agrees. The road goes ahead on budget." },
      { label: "Give it to the cheaper bidder", fx: { app: 1, cash: 0.2, party: -2 }, out: "Money saved. The bridge is late." } ] },
  { id: "video", icon: "📱", title: "A video of your commissioner taking cash goes viral", brief: "Two million views by lunchtime. He says the video was edited.", bg: "tv-studio", who: "reporter",
    options: [
      { label: "Suspend him and order a probe", fx: { app: 4, cash: 0, party: -2 }, out: "The hashtag dies down. His friends in the party do not forget." },
      { label: "Defend him until the facts are in", fx: { app: -4, cash: 0, party: 2 }, out: "The hashtag trends for a week, with your name in it." },
      { label: "Hand the video to the anti-graft agency", fx: { app: 3, cash: 0, party: -1 }, out: "You look clean. He is arrested at the airport." } ] },
  { id: "palace", icon: "👑", title: "Two princes claim the same throne", brief: "The kingmakers chose one; the other has a court order and a crowd. The coronation is on Saturday.", bg: "emirs-palace-courtyard", who: "traditional-ruler-oba-obi",
    options: [
      { label: "Back the kingmakers' choice", fx: { app: 2, cash: 0, party: -1 }, out: "Tradition holds. The other prince's crowd blocks the highway." },
      { label: "Postpone the coronation until the court rules", fx: { app: 1, cash: 0, party: 0 }, out: "Nobody is happy, but nobody is hurt." },
      { label: "Back the prince your party prefers", fx: { app: -3, cash: 0, party: 3 }, out: "He is crowned. Half the town boycotts the ceremony." } ] },
  { id: "salary", icon: "💸", title: "Workers are owed two months' salary", brief: "The federal allocation came in short. You can pay workers or the contractors on the airport road, not both.", bg: "state-secretariat", who: "labour-leader",
    options: [
      { label: "Pay the workers", fx: { app: 4, cash: -1.0, party: 0 }, out: "Salaries land. The airport road stops for three months." },
      { label: "Pay the contractors", fx: { app: -4, cash: -1.0, party: 2 }, out: "The road continues. Civil servants stop coming to work." },
      { label: "Borrow from the bank to pay both", fx: { app: 2, cash: 0.2, party: 0 }, out: "Everyone is paid. The interest bill arrives next year." } ] },
  { id: "herders", icon: "🐄", title: "Herders and farmers clash at dawn", brief: "Cattle trampled a yam farm. By noon, two villages were fighting. Four people are dead.", bg: "northern-farmland", who: "police-commissioner",
    options: [
      { label: "Ban open grazing in the state", fx: { app: 3, cash: 0, party: -1 }, out: "Farmers cheer. Herders' groups go to court." },
      { label: "Set up grazing reserves with water", fx: { app: 1, cash: -0.6, party: 1 }, out: "It takes a year to build. The clashes slow down." },
      { label: "Send soldiers to keep the peace", fx: { app: 0, cash: -0.2, party: 0 }, out: "Quiet returns, for now. Nothing is solved." } ] },
  { id: "doctor", icon: "🩺", title: "Your doctors are leaving for abroad", brief: "Forty doctors resigned this month to work in other countries. Two hospitals have no surgeon at all.", bg: "hospital-ward", who: null,
    options: [
      { label: "Double their allowances", fx: { app: 3, cash: -0.7, party: 0 }, out: "Resignations slow to a trickle. Teachers ask why not them." },
      { label: "Bond new graduates for five years", fx: { app: -1, cash: 0, party: 0 }, out: "Wards fill with young doctors who resent you." },
      { label: "Partner with private hospitals", fx: { app: 1, cash: -0.2, party: 1 }, out: "Patients pay more, but the surgeons stay." } ] },
  { id: "landgrab", icon: "📜", title: "An estate developer wants a community's land", brief: "A big developer offers ₦2B for farmland at the city's edge. Three villages live on it.", bg: "back-room", who: "investor-nigerian",
    options: [
      { label: "Sell, and resettle the villages", fx: { app: -3, cash: 1.0, party: 1 }, out: "Bulldozers arrive. So do the human rights lawyers." },
      { label: "Sell only the empty part", fx: { app: 1, cash: 0.4, party: 0 }, out: "A smaller estate, and the villages keep their farms." },
      { label: "Refuse", fx: { app: 2, cash: 0, party: -1 }, out: "The villages throw a party. The developer builds in the next state." } ] },
  { id: "debate", icon: "🎙️", title: "The opposition dares you to a live debate", brief: "Their candidate is a sharp lawyer. Your aides say you have everything to lose.", bg: "tv-studio", who: "reporter",
    options: [
      { label: "Accept", fx: { app: 3, cash: 0, party: 1 }, out: "You stumble once and land three good blows. The clips favour you." },
      { label: "Send your deputy", fx: { app: -1, cash: 0, party: 0 }, out: "Your deputy holds on. People ask where you were." },
      { label: "Decline", fx: { app: -3, cash: 0, party: 0 }, out: "An empty podium with your name on it trends all evening." } ] },
  { id: "refinery", icon: "🛢️", title: "Illegal refineries are poisoning the creeks", brief: "Black smoke over the creeks every night. Young men earn a living from it; fishermen have lost theirs.", bg: "illegal-refinery-night", who: null,
    options: [
      { label: "Destroy the camps", fx: { app: 1, cash: -0.2, party: 0 }, out: "The smoke clears. The young men are back in a month." },
      { label: "License them as modular refineries", fx: { app: 2, cash: 0.3, party: 0 }, out: "Safer, legal, and taxed. Abuja is unhappy." },
      { label: "Leave it to the federal navy", fx: { app: -2, cash: 0, party: 0 }, out: "Nothing changes. The fish stay dead." } ] },
  { id: "gold", icon: "⛏️", title: "Gold is found in a farming village", brief: "Miners are pouring in. The village chief wants royalties; a foreign firm wants a licence.", bg: "artisanal-gold-pits", who: "lg-chairman",
    options: [
      { label: "License the firm, with royalties to the village", fx: { app: 2, cash: 0.6, party: 0 }, out: "Money flows. So do complaints about dust and water." },
      { label: "Let the villagers mine it themselves", fx: { app: 3, cash: 0, party: 0 }, out: "The village gets rich, quickly and dangerously." },
      { label: "Seal the site until a survey is done", fx: { app: -1, cash: -0.1, party: 0 }, out: "The miners leave, angry. The gold waits." } ] },
  { id: "school", icon: "📚", title: "Pupils sit on the floor in half your schools", brief: "A photo of children writing on the floor of a classroom with no roof is everywhere.", bg: "classroom", who: null,
    options: [
      { label: "Buy desks for every school this term", fx: { app: 4, cash: -0.6, party: 0 }, out: "Desks arrive by the lorry-load. Some of the roofs still leak." },
      { label: "Fix the worst 100 schools properly", fx: { app: 2, cash: -0.8, party: 0 }, out: "A hundred schools you can be proud of. The rest wait." },
      { label: "Ask parents to contribute", fx: { app: -3, cash: 0, party: 0 }, out: "The photo becomes a meme about you." } ] },
  { id: "loan", icon: "🏦", title: "A foreign bank offers a ₦30B loan", brief: "Cheap money for a light rail line, repayable in dollars. The naira has been falling.", bg: "finance-ministry-office", who: "finance-commissioner",
    options: [
      { label: "Take it", fx: { app: 2, cash: 1.0, party: 1 }, out: "The rail line starts. The dollar repayments grow each year." },
      { label: "Take half, in naira", fx: { app: 1, cash: 0.5, party: 0 }, out: "A shorter line, and debts you can sleep with." },
      { label: "Decline", fx: { app: -1, cash: 0, party: 0 }, out: "No new debt, and no new rail." } ] },
  { id: "election", icon: "🗳️", title: "Your party's primary is rigged in your favour", brief: "Your aides have arranged the delegates. The other aspirant says he will go to court.", bg: "party-convention-hall", who: "godfather",
    options: [
      { label: "Let it stand", fx: { app: -2, cash: 0, party: 3 }, out: "You win the ticket. The court case follows you for a year." },
      { label: "Order a fresh, open primary", fx: { app: 3, cash: -0.1, party: -2 }, out: "You win it cleanly, by less. The fixers are furious." },
      { label: "Make peace: give him a deputy slot", fx: { app: 1, cash: 0, party: 2 }, out: "The case is withdrawn. Your deputy has to go." } ] },
  { id: "power", icon: "💡", title: "The capital has had no light for a week", brief: "A transformer blew and the distribution company says it has no money to replace it.", bg: "busy-market-street", who: null,
    options: [
      { label: "Buy the transformer with state money", fx: { app: 4, cash: -0.3, party: 0 }, out: "Light is back in two days. Other towns send their own requests." },
      { label: "Build a solar mini-grid for the market", fx: { app: 2, cash: -0.5, party: 0 }, out: "The market never goes dark again. The rest of the city does." },
      { label: "Pressure the company publicly", fx: { app: 1, cash: 0, party: 0 }, out: "Two weeks of headlines, then a transformer." } ] },
  { id: "protest", icon: "📣", title: "Youths are marching on Government House", brief: "Thousands of young people want jobs, not speeches. The police want permission to disperse them.", bg: "street-protest", who: "police-commissioner",
    options: [
      { label: "Walk out and speak to them", fx: { app: 5, cash: 0, party: 0 }, out: "You are booed, then cheered. Their leaders get a meeting." },
      { label: "Let the police disperse them", fx: { app: -5, cash: 0, party: 1 }, out: "Tear gas, and a video that will follow you for years." },
      { label: "Announce a jobs programme on the spot", fx: { app: 3, cash: -0.5, party: 0 }, out: "The crowd goes home. Now you have to fund it." } ] },
  { id: "budget", icon: "📊", title: "The House inserted ₦4B of projects into your budget", brief: "Lawmakers padded the budget with projects in their own constituencies. Signing it breaks your deficit target.", bg: "assembly-chamber", who: "speaker",
    options: [
      { label: "Sign it", fx: { app: -1, cash: -0.4, party: 3 }, out: "The House is happy. The deficit is not." },
      { label: "Veto it", fx: { app: 2, cash: 0, party: -3 }, out: "The budget goes back. Lawmakers talk about impeachment over drinks." },
      { label: "Negotiate it down to ₦1B", fx: { app: 1, cash: -0.1, party: 1 }, out: "Everyone saves face. It takes three weeks." } ] },
  { id: "burial", icon: "⚱️", title: "A rival's father dies; the burial is Saturday", brief: "Your fiercest critic in the House is burying his father. Every big name in the state will be there.", bg: "burial-ceremony", who: null,
    options: [
      { label: "Attend, and make a donation", fx: { app: 2, cash: -0.05, party: 2 }, out: "He shakes your hand in front of the cameras. Something has thawed." },
      { label: "Send a condolence letter", fx: { app: 0, cash: 0, party: 0 }, out: "Correct, and forgotten." },
      { label: "Hold a rally the same day", fx: { app: -3, cash: 0, party: -1 }, out: "The papers call it petty. They are right." } ] },
  { id: "drain", icon: "🕳️", title: "A gully is swallowing a neighbourhood", brief: "Erosion has taken six houses this rainy season. The next one is a primary school.", bg: "gully-erosion", who: null,
    options: [
      { label: "Fund an emergency fix now", fx: { app: 4, cash: -0.6, party: 0 }, out: "Engineers arrive with sandbags and a plan. The school is safe." },
      { label: "Relocate the families", fx: { app: 0, cash: -0.3, party: 0 }, out: "Everyone is safe and nobody is happy." },
      { label: "Apply for the federal ecological fund", fx: { app: -2, cash: 0.2, party: 0 }, out: "The money comes next year. Two more houses go first." } ] },
  { id: "airport", icon: "✈️", title: "Your aides want a state airport", brief: "An airport would make the state proud. It would also cost ₦40B and serve two flights a day.", bg: "airport-arrivals", who: "permanent-secretary",
    options: [
      { label: "Build it", fx: { app: 2, cash: -1.2, party: 2 }, out: "Ribbons, a jet and a big debt. The runway is beautiful." },
      { label: "Build a cargo airstrip for farm exports", fx: { app: 1, cash: -0.5, party: 0 }, out: "Less glamour. Yams in Europe within a year." },
      { label: "No: fix the roads first", fx: { app: 1, cash: 0, party: -1 }, out: "Sensible, and nobody throws a party for it." } ] },
  { id: "idp", icon: "⛺", title: "Displaced families crowd a school compound", brief: "Two thousand people fled a village attack. They are sleeping in classrooms and the term starts Monday.", bg: "idp-camp", who: null,
    options: [
      { label: "Build a proper camp with clinics", fx: { app: 3, cash: -0.6, party: 0 }, out: "Families get tents, food and a nurse. The school reopens." },
      { label: "Help them go home with security", fx: { app: 2, cash: -0.3, party: 0 }, out: "Most return under guard. Some are too afraid." },
      { label: "Delay the school term", fx: { app: -2, cash: 0, party: 0 }, out: "Parents and the displaced both blame you." } ] },
  { id: "spill", icon: "🛢️", title: "An oil spill blackens the fishing creeks", brief: "A pipeline burst. The company says it was sabotage; the fishermen say it was rust.", bg: "oil-creek-spill", who: null,
    options: [
      { label: "Sue the company", fx: { app: 3, cash: 0, party: 0 }, out: "Years in court, and the communities love you for it." },
      { label: "Negotiate compensation now", fx: { app: 2, cash: 0.2, party: 0 }, out: "The fishermen get paid this year. The creek stays black." },
      { label: "Clean it with state money", fx: { app: 2, cash: -0.5, party: 0 }, out: "The water clears. The company thanks you for your generosity." } ] },
  { id: "rally", icon: "🎉", title: "Your party wants a mega rally", brief: "The national chairman is visiting. Your party wants 100,000 people in the stadium, buses and lunch included.", bg: "rally", who: "godfather",
    options: [
      { label: "Fund the rally", fx: { app: -1, cash: -0.3, party: 4 }, out: "The stadium is full and the chairman is impressed." },
      { label: "Hold a town hall instead", fx: { app: 2, cash: -0.05, party: -1 }, out: "Smaller, and the questions are hard. People like it." },
      { label: "Ask the party to pay", fx: { app: 0, cash: 0, party: -2 }, out: "Half the stadium is empty. The chairman notices." } ] },
  { id: "waterfront", icon: "🏘️", title: "Bulldozers are ready at the waterfront", brief: "Your planners want to clear a waterfront settlement for a new road. Ten thousand people live there.", bg: "waterfront-settlement", who: "lg-chairman",
    options: [
      { label: "Clear it, with compensation", fx: { app: -2, cash: -0.5, party: 1 }, out: "The road goes ahead. The compensation reaches about half of them." },
      { label: "Re-route the road", fx: { app: 2, cash: -0.3, party: 0 }, out: "Longer and dearer, and nobody loses a home." },
      { label: "Upgrade the settlement instead", fx: { app: 3, cash: -0.4, party: 0 }, out: "Water, drains and titles. The planners are sulking." } ] },
];


// More dilemmas (added after the first 30-day cycle). Days 31 onward run
// through these first, then the whole deck, so no day already played changes.
const D2 = [
  { id: "cholera", icon: "🦠", title: "Cholera in the riverside wards", brief: "Forty cases and three deaths in a week. The wells are next to the latrines, and the market is still open.", bg: "rural-health-centre", who: "doctor",
    options: [
      { label: "Close the market and truck in clean water", fx: { app: 2, cash: -0.5, party: -1 }, out: "The cases fall within ten days. The traders lost a week's money and say so." },
      { label: "Open treatment tents, keep the market open", fx: { app: 1, cash: -0.3, party: 0 }, out: "Fewer deaths, more cases. It drags on for a month." },
      { label: "Ask the federal disease centre to take over", fx: { app: -2, cash: 0, party: 0 }, out: "They come in five days. The papers count the funerals in between." } ] },
  { id: "collapse", icon: "🏚️", title: "A five-storey building collapses", brief: "A building under construction fell on its workers at dawn. The developer had no approval; the planning officer who looked away is your appointee.", bg: "project-site-stalled", who: "contractor",
    options: [
      { label: "Lead the rescue, then sack the officer", fx: { app: 4, cash: -0.2, party: -1 }, out: "Eleven pulled out alive. The officer is gone; his godfather is not pleased." },
      { label: "Rescue now, a panel of inquiry later", fx: { app: 1, cash: -0.2, party: 0 }, out: "The rescue works. The panel reports in a year." },
      { label: "Blame the developer alone", fx: { app: -2, cash: 0, party: 1 }, out: "The developer is arrested. Everyone knows how he got away with it." } ] },
  { id: "marketfire", icon: "🔥", title: "The main market is burning", brief: "Fire tore through three thousand stalls overnight. The fire service arrived without water. Traders have lost everything.", bg: "shuttered-market", who: "market-trader",
    options: [
      { label: "A relief fund for every trader, paid this week", fx: { app: 4, cash: -0.8, party: 0 }, out: "Paid by phone, verified by the market union. The traders cheer you on the ashes." },
      { label: "Rebuild the market as a modern one", fx: { app: 1, cash: -0.6, party: 1 }, out: "A grand plan. The stalls will cost more than the traders can pay." },
      { label: "Promise an investigation", fx: { app: -3, cash: 0, party: 0 }, out: "The traders wanted help, not a panel." } ] },
  { id: "okada", icon: "🏍️", title: "Ban okada in the capital?", brief: "Your commissioner wants okada banned for safety: two hundred deaths last year. Forty thousand young men earn a living on them.", bg: "busy-market-street", who: "okada-rider",
    options: [
      { label: "Ban them, with loans to switch to tricycles", fx: { app: 1, cash: -0.4, party: 0 }, out: "Safer roads. Half the riders got loans; the rest are angry." },
      { label: "Ban them only on the highways", fx: { app: 2, cash: 0, party: 0 }, out: "Fewer deaths, few protests. A sensible middle." },
      { label: "No ban: register and license them", fx: { app: 1, cash: 0.1, party: 1 }, out: "Licence fees, helmets, numbers. The deaths fall a little." } ] },
  { id: "cars", icon: "🚙", title: "New SUVs for your commissioners?", brief: "The commissioners' cars are old, and they say it embarrasses the state in Abuja. Forty new SUVs would cost ₦1.2B.", bg: "governor-office", who: "commissioner-male-suit",
    options: [
      { label: "Refuse: they can drive what they have", fx: { app: 3, cash: 0, party: -2 }, out: "The commissioners sulk. The public cheers." },
      { label: "Buy them, quietly", fx: { app: -3, cash: -1.2, party: 2 }, out: "A photo of forty new SUVs leaks within a week." },
      { label: "Buy buses for the civil servants instead", fx: { app: 4, cash: -0.8, party: -1 }, out: "Staff buses on every route. The commissioners grumble in their old cars." } ] },
  { id: "journalist", icon: "📰", title: "A journalist is arrested over a post", brief: "Police arrested a journalist for a post accusing your Chief of Staff of fraud. Press freedom groups are calling.", bg: "tv-studio", who: "reporter",
    options: [
      { label: "Order his release and apologise", fx: { app: 3, cash: 0, party: -1 }, out: "Released within the hour. Your Chief of Staff is furious; the press is not." },
      { label: "Let the court decide", fx: { app: -2, cash: 0, party: 1 }, out: "He spends two weeks in a cell. The story spreads further." },
      { label: "Release him, and investigate the claim", fx: { app: 4, cash: 0, party: -2 }, out: "The claim had something in it. Your Chief of Staff resigns." } ] },
  { id: "tanker", icon: "🛢️", title: "A tanker explodes on the bridge", brief: "A fuel tanker lost its brakes and exploded on the main bridge. Twenty dead. The bridge is cracked and closed.", bg: "rural-road-mud", who: "contractor",
    options: [
      { label: "Pay the families, close the bridge for repairs", fx: { app: 3, cash: -0.7, party: 0 }, out: "Repairs take four months. Traffic chokes, but nobody dies on it." },
      { label: "Ban tankers from the city by day", fx: { app: 2, cash: 0, party: 0 }, out: "Tankers move at night. Fuel gets a little dearer." },
      { label: "Reopen it after a quick inspection", fx: { app: -2, cash: -0.1, party: 1 }, out: "It is open. The engineers who signed it off are nervous." } ] },
  { id: "pension", icon: "👴", title: "Pensioners march on Government House", brief: "Retired teachers and nurses are owed eighteen months of pension. Two collapsed in the sun at the gate.", bg: "street-protest", who: "civil-servant",
    options: [
      { label: "Pay six months now, the rest by a schedule", fx: { app: 3, cash: -0.9, party: 0 }, out: "The march ends. They will be back on the schedule's dates." },
      { label: "Pay all of it", fx: { app: 5, cash: -2.0, party: 0 }, out: "Every pensioner paid. The treasury is thin for the rest of the year." },
      { label: "Check them first: there are ghost pensioners", fx: { app: -2, cash: 0.2, party: 0 }, out: "The audit finds 900 ghosts. It also takes six months." } ] },
  { id: "birthday", icon: "🎂", title: "Your party plans your birthday", brief: "The party wants to fill the stadium for your birthday: billboards, musicians, ₦300M. 'The people love you,' they say.", bg: "rally", who: "party-chairman",
    options: [
      { label: "Cancel it: give the money to the children's hospital", fx: { app: 4, cash: 0, party: -1 }, out: "The hospital gets a new ward. The musicians are disappointed." },
      { label: "A small party at home", fx: { app: 1, cash: 0, party: 0 }, out: "Quiet, cheap, unremarkable. Fine." },
      { label: "Let them throw it", fx: { app: -3, cash: -0.3, party: 3 }, out: "A great party. The billboards are mocked online for a month." } ] },
  { id: "corper", icon: "🎓", title: "A youth corps member is kidnapped", brief: "A corps member posted to a rural school in your state was taken on her way to class. Her parents are on national television.", bg: "classroom", who: "teacher",
    options: [
      { label: "Lead the search, and move corpers out of the riskiest LGAs", fx: { app: 3, cash: -0.3, party: 0 }, out: "Found alive in nine days. Corps members move to safer postings." },
      { label: "Let the police and her family negotiate", fx: { app: -2, cash: 0, party: 0 }, out: "She comes home after a ransom. The country noticed you were absent." },
      { label: "Pay for her release quietly", fx: { app: 1, cash: -0.2, party: 0 }, out: "Home in two days. The kidnappers know the state pays." } ] },
  { id: "toll", icon: "🚧", title: "Protesters block the new toll gate", brief: "A private company built a toll gate on the expressway the state built. Commuters say they are paying twice.", bg: "street-protest", who: "okada-rider",
    options: [
      { label: "Suspend the toll until it is reviewed", fx: { app: 4, cash: -0.2, party: -1 }, out: "The gate opens. The company sues." },
      { label: "Keep it, but free for buses and okada", fx: { app: 2, cash: 0, party: 0 }, out: "The poorest pass free. The protest fades." },
      { label: "Keep it: the contract is signed", fx: { app: -4, cash: 0.2, party: 1 }, out: "The protest grows. A video of police tear gas goes viral." } ] },
  { id: "vaccine", icon: "💉", title: "Rumours turn parents against polio drops", brief: "A preacher says the polio vaccine makes children sterile. Vaccinators were chased out of two villages.", bg: "rural-health-centre", who: "health-worker",
    options: [
      { label: "Vaccinate your own grandchild on television", fx: { app: 3, cash: -0.05, party: 0 }, out: "The clip runs everywhere. The villages open their doors." },
      { label: "Bring the emirs and pastors on side", fx: { app: 2, cash: -0.1, party: 0 }, out: "Slower, but it lasts. The preacher is quiet now." },
      { label: "Arrest the preacher", fx: { app: -1, cash: 0, party: 0 }, out: "He becomes a martyr. The rumour spreads." } ] },
  { id: "club", icon: "⚽", title: "The state football club is broke", brief: "The players have not been paid for five months and threaten to forfeit the league. The fans are angry at you.", bg: "rally", who: "youth-group-cheering",
    options: [
      { label: "Pay them, then privatise the club", fx: { app: 2, cash: -0.4, party: 0 }, out: "Paid, and sold to a businessman who promises a stadium." },
      { label: "Pay them and keep it", fx: { app: 3, cash: -0.5, party: 1 }, out: "The fans cheer. The club will be broke again next year." },
      { label: "Let it fold: there are bigger needs", fx: { app: -3, cash: 0, party: 0 }, out: "The club folds. The fans boo you at the next match you attend." } ] },
  { id: "jailbreak", icon: "🔓", title: "Gunmen free 300 inmates from the prison", brief: "Gunmen attacked the state's medium-security prison at night. Three hundred inmates escaped, some of them kidnappers.", bg: "detention-visiting-room", who: "police-commissioner",
    options: [
      { label: "A manhunt, and rewards for information", fx: { app: 2, cash: -0.3, party: 0 }, out: "A hundred and sixty back in a week. The rest are gone." },
      { label: "Blame the federal prisons service", fx: { app: -1, cash: 0, party: 0 }, out: "True, and nobody cares whose prison it was." },
      { label: "A curfew until they are caught", fx: { app: -2, cash: 0, party: 0 }, out: "Quiet streets, angry traders, half the escapees found." } ] },
  { id: "streettraders", icon: "🛒", title: "Clear the street traders?", brief: "Street traders fill the roads of the capital. Your environment commissioner wants them cleared; they say they have nowhere else to sell.", bg: "busy-market-street", who: "market-women-group-angry",
    options: [
      { label: "Clear them, and open a new market first", fx: { app: 2, cash: -0.4, party: 0 }, out: "A new market by the motor park. Most traders move." },
      { label: "Clear them by force", fx: { app: -4, cash: 0, party: 1 }, out: "Clear roads, burned goods, a viral video." },
      { label: "Leave them", fx: { app: 1, cash: 0, party: 0 }, out: "The traffic stays. So do the votes." } ] },
  { id: "deputy", icon: "🤝", title: "Your deputy is meeting the opposition", brief: "Your deputy was photographed at a dinner with the opposition's chairman. The party wants you to act.", bg: "back-room", who: "deputy-male",
    options: [
      { label: "Call the deputy in and ask", fx: { app: 0, cash: 0, party: 1 }, out: "A family dinner, the deputy says. You are not sure." },
      { label: "Strip the deputy of every assignment", fx: { app: -1, cash: 0, party: 2 }, out: "Your deputy has nothing to do now, except plot." },
      { label: "Ignore it", fx: { app: 0, cash: 0, party: -2 }, out: "The party thinks you are weak. Maybe the deputy does too." } ] },
  { id: "borehole", icon: "🚰", title: "Two hundred boreholes that do not work", brief: "A newspaper visited the boreholes the state paid for last year: two hundred of them are dry holes or never existed.", bg: "village-square", who: "reporter",
    options: [
      { label: "Make the contractors fix them or refund", fx: { app: 3, cash: 0.2, party: -1 }, out: "Seventy fixed, some refunds. Two contractors are in court." },
      { label: "Sack the commissioner", fx: { app: 2, cash: 0, party: -2 }, out: "A head rolls. The dry holes stay dry." },
      { label: "Call the report 'fake news'", fx: { app: -4, cash: 0, party: 1 }, out: "The paper prints photographs of every one." } ] },
  { id: "census", icon: "📋", title: "The census counters were attacked", brief: "Census officials were chased out of three LGAs by youths who say the count will be rigged against them. The federal deadline is in a month.", bg: "lga-secretariat", who: "civil-servant",
    options: [
      { label: "Bring community leaders with the counters", fx: { app: 2, cash: -0.1, party: 0 }, out: "The count resumes, escorted by elders." },
      { label: "Send police with the counters", fx: { app: -1, cash: 0, party: 0 }, out: "Counted, under guard. Some families hid." },
      { label: "Let those LGAs be estimated", fx: { app: -2, cash: 0, party: 0 }, out: "Estimated low. Less federal money for them, for ten years." } ] },
  { id: "gasexplosion", icon: "💥", title: "A gas plant explodes in a neighbourhood", brief: "A cooking-gas refilling plant exploded in a residential street. Nine dead. It had a permit it should never have got.", bg: "flooded-community", who: "police-commissioner",
    options: [
      { label: "Close every gas plant in a residential area", fx: { app: 3, cash: 0, party: -1 }, out: "Sixty plants closed. Gas is dearer for a month." },
      { label: "Inspect them all within a month", fx: { app: 2, cash: -0.1, party: 0 }, out: "Twelve closed, the rest fixed." },
      { label: "Punish this one owner", fx: { app: -1, cash: 0, party: 0 }, out: "One owner jailed. The others wait for the noise to pass." } ] },
  { id: "bursary", icon: "🎒", title: "Students want their bursaries", brief: "The state's university students have not received bursaries for two years. They have blocked the road to Government House.", bg: "street-protest", who: "student-leader",
    options: [
      { label: "Pay this year's, and a schedule for the arrears", fx: { app: 3, cash: -0.5, party: 0 }, out: "The road opens. The schedule is published." },
      { label: "Replace bursaries with loans", fx: { app: -1, cash: 0.1, party: 0 }, out: "Cheaper for the state. The students are not convinced." },
      { label: "Send the police to clear the road", fx: { app: -4, cash: 0, party: 1 }, out: "Tear gas at the university gate. A student is hurt." } ] },
  { id: "examleak", icon: "📄", title: "The exam papers leaked", brief: "The state's common entrance exam papers were on sale the night before. Parents who paid are furious they might have to resit.", bg: "classroom", who: "teacher",
    options: [
      { label: "Cancel and set a new exam", fx: { app: 1, cash: -0.1, party: 0 }, out: "A resit in two weeks. Honest families are relieved." },
      { label: "Let the results stand", fx: { app: -3, cash: 0, party: 0 }, out: "The cheats are in. Everybody knows it." },
      { label: "Find and prosecute the leakers first", fx: { app: 2, cash: -0.05, party: 0 }, out: "A clerk and a printer charged. The resit goes ahead." } ] },
  { id: "chief", icon: "👑", title: "Two princes claim the vacant throne", brief: "The old king died. Two ruling houses each crowned their own man yesterday. Both palaces are guarded by armed youths.", bg: "emirs-palace-courtyard", who: "traditional-ruler-oba-obi",
    options: [
      { label: "Follow the kingmakers' written list", fx: { app: 1, cash: 0, party: 0 }, out: "The list names one prince. The other house goes to court." },
      { label: "Recognise the prince from your party's ward", fx: { app: -2, cash: 0, party: 3 }, out: "Your man sits on the throne. Half the town calls him your puppet." },
      { label: "Leave the throne vacant until the court rules", fx: { app: 0, cash: 0, party: -1 }, out: "No king for a year. The guards stay." } ] },
  { id: "refuse", icon: "🗑️", title: "Rubbish piles up in the capital", brief: "The refuse contractor has not been paid and stopped collecting. Mountains of rubbish block drains before the rains.", bg: "busy-market-street", who: "contractor",
    options: [
      { label: "Pay him and clear it by the weekend", fx: { app: 3, cash: -0.4, party: 0 }, out: "Clean streets by Sunday." },
      { label: "Sack him and hire many small collectors", fx: { app: 2, cash: -0.3, party: 0 }, out: "Slower to start, cheaper to run." },
      { label: "A monthly sanitation day instead", fx: { app: -1, cash: 0, party: 0 }, out: "Residents sweep one Saturday a month. The mountains stay." } ] },
  { id: "investor", icon: "🏭", title: "A factory wants twenty years tax-free", brief: "A fictional company, Delta Steel Works, will build a mill with two thousand jobs, if it pays no state taxes for twenty years.", bg: "governor-office", who: "investor-foreign",
    options: [
      { label: "Ten years, with hiring targets", fx: { app: 2, cash: 0, party: 0 }, out: "They agree after a week. The mill breaks ground." },
      { label: "Twenty years: jobs are jobs", fx: { app: 3, cash: -0.2, party: 1 }, out: "Two thousand jobs. The tax office sighs." },
      { label: "No: everyone pays", fx: { app: -1, cash: 0, party: 0 }, out: "They build in the next state." } ] },
  { id: "bridge", icon: "🌉", title: "The only bridge to three LGAs is cracking", brief: "Engineers say the old bridge could fall in the rains. It is the only road to three LGAs and their markets.", bg: "rural-road-mud", who: "contractor",
    options: [
      { label: "Close it and build a temporary crossing", fx: { app: 1, cash: -0.6, party: 0 }, out: "A steel crossing in six weeks. Nobody dies." },
      { label: "Keep it open, ban heavy trucks", fx: { app: 1, cash: 0, party: 0 }, out: "It holds, for now. The trucks go round." },
      { label: "Wait for the federal ministry", fx: { app: -3, cash: 0, party: 0 }, out: "The ministry is studying it." } ] },
  { id: "demolition_church", icon: "⛪", title: "A church and a mosque on the road's path", brief: "The new ring road runs through a church and a mosque. Both congregations say they will not move.", bg: "village-square", who: "traditional-ruler-emir",
    options: [
      { label: "Re-route the road around both", fx: { app: 3, cash: -0.5, party: 0 }, out: "A longer road. Both congregations thank you." },
      { label: "Build them new ones first, then demolish", fx: { app: 1, cash: -0.4, party: 0 }, out: "New buildings, grudging moves." },
      { label: "Demolish both: the law is the law", fx: { app: -5, cash: 0, party: 0 }, out: "Two congregations united against you." } ] },
  { id: "diaspora", icon: "✈️", title: "A diaspora doctor wants to come home", brief: "A famous surgeon in London will return to run the state hospital, if the state pays a London salary and lets her hire her own team.", bg: "hospital-ward", who: "doctor",
    options: [
      { label: "Agree to everything", fx: { app: 3, cash: -0.3, party: -1 }, out: "She arrives in a month. Local doctors resent her pay." },
      { label: "Pay a top local salary, her own team", fx: { app: 1, cash: -0.1, party: 0 }, out: "She thinks about it, and stays in London." },
      { label: "Make her a visiting consultant", fx: { app: 2, cash: -0.1, party: 0 }, out: "She comes four times a year. It helps." } ] },
  { id: "power_tariff", icon: "💡", title: "The electricity company doubles its tariff", brief: "The power distribution company doubled its tariff overnight. Bills arrive for power nobody got. Residents are tearing down meters.", bg: "street-protest", who: "manufacturers-rep",
    options: [
      { label: "Take them on: no bills without meters", fx: { app: 4, cash: 0, party: 0 }, out: "The regulator backs you. Estimated bills are suspended." },
      { label: "Subsidise the poorest homes' bills", fx: { app: 2, cash: -0.5, party: 0 }, out: "Relief for some. The company pockets it." },
      { label: "It is federal: stay out", fx: { app: -3, cash: 0, party: 0 }, out: "Residents protest at your gate anyway." } ] },
  { id: "lgchair", icon: "🏛️", title: "An LG chairman refuses to hand over", brief: "The chairman of a local government lost the council election but refuses to leave the secretariat. His thugs have the keys.", bg: "lga-secretariat", who: "lg-chairman",
    options: [
      { label: "Send the police to enforce the result", fx: { app: 2, cash: 0, party: -1 }, out: "He leaves under escort. The new chairman takes the keys." },
      { label: "Negotiate a soft landing for him", fx: { app: 0, cash: -0.1, party: 1 }, out: "A board appointment, and he goes quietly." },
      { label: "Let the courts decide", fx: { app: -2, cash: 0, party: 0 }, out: "The council has two chairmen for six months." } ] },
  { id: "hospitaldeath", icon: "🏥", title: "A woman dies at the hospital gate", brief: "A woman in labour died at the gate of the state hospital because her family could not pay the deposit. The video is everywhere.", bg: "hospital-ward", who: "nurse",
    options: [
      { label: "Ban deposits for emergencies, today", fx: { app: 4, cash: -0.3, party: 0 }, out: "No more deposits for emergencies. The hospitals want the money from somewhere." },
      { label: "Suspend the staff on duty", fx: { app: 1, cash: 0, party: 0 }, out: "The nurses say they followed the rules you made." },
      { label: "Send condolences", fx: { app: -4, cash: 0, party: 0 }, out: "Condolences. The video keeps playing." } ] },
];

// A fixed shuffled order, so neighbouring days differ.
const shuffle = (n, x0) => { const a = Array.from({ length: n }, (_, i) => i); let x = x0; for (let i = a.length - 1; i > 0; i--) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ORDER = shuffle(D.length, 2463534242);
const ORDER2 = shuffle(D2.length, 1013904223);
export const DAILY = [...D, ...D2];
// Days 1–30: the first deck, as it was. Then the new dilemmas, then the whole deck in turn.
export const dailyFor = (n) => {
  if (n <= D.length) return D[ORDER[n - 1]];
  const k = n - D.length - 1;
  if (k < D2.length) return D2[ORDER2[k]];
  const all = DAILY.length, i = (k - D2.length) % all;
  return i < D.length ? D[ORDER[i]] : D2[ORDER2[i - D.length]]; // the oldest first, so nothing comes back soon
};

// Spoiler-free share text: three coloured squares for approval, money and party,
// and the link that opens the same day's decision (a share with no link is a dead end).
export const SHARE_URL = "https://seatofpower.online";
export const dailyLink = (n) => SHARE_URL + "/?daily=" + n;
const sq = (v) => (v > 0 ? "🟩" : v < 0 ? "🟥" : "⬜");
export const dailyShare = (n, opt, pct) => {
  const f = opt.fx || {};
  return "🏛️ Seat of Power · Daily #" + n + "\n" + sq(f.app) + sq(f.cash) + sq(f.party) + "  approval · money · party\n"
    + (pct != null ? pct + "% of governors chose like me." : "") + "\nWhat would you do? Play today's decision:\n" + dailyLink(n);
};

// The streak: days in a row with a play. days: sorted unique day numbers played.
// freezes: how many Streak Freezes the player owns. Returns { streak, best,
// alive (played today or yesterday), use (freezes to spend to bridge gaps) }.
export const streakOf = (days, today, freezes = 0) => {
  const set = new Set(days || []), bridged = [];
  let streak = 0, left = freezes, d = set.has(today) ? today : today - 1;
  for (;;) {
    if (set.has(d)) { streak++; d--; continue; }
    if (left > 0 && set.has(d - 1)) { left--; bridged.push(d); streak++; d--; continue; } // a missed day, saved by a freeze
    break;
  }
  return { streak, best: Math.max(bestRun([...(days || []), ...bridged]), streak), alive: streak > 0, use: bridged.length, bridged, playedToday: set.has(today) };
};
const bestRun = (days) => { const s = [...new Set(days || [])].sort((a, b) => a - b); let b = 0, r = 0; for (let i = 0; i < s.length; i++) { r = i && s[i] === s[i - 1] + 1 ? r + 1 : 1; b = Math.max(b, r); } return b; };
