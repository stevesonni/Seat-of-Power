/* The player's guide (owner, 23 Nov 2026: "see how they did their how to play… build all"). One source for the
   in-game guide (How to play → the full guide) and the public pages at /wiki on our own site. Plain words, short
   sections, where to tap written as "Desk → Mailbox". Rules only, no React: server/wiki.mjs renders the same data.
   When the game changes, change this file and GUIDE_UPDATED. */
import { GLOSSARY } from "./glossary.js";

export const GUIDE_UPDATED = "23 Nov 2026";
export const GUIDE_VERSION = 1;

// How to play in 5 minutes.
export const QUICK = [
  { icon: "🗳️", t: "Win the election", d: "Title screen → New game → Quick start. Pick a state, campaign for six weeks, and win on election night." },
  { icon: "💰", t: "Pass the budget", d: "Split the year's money between the sectors. The House of Assembly must vote it through before anything is spent." },
  { icon: "📜", t: "Govern", d: "Start programmes, send bills, sign executive orders, and build projects with contractors." },
  { icon: "📬", t: "Answer the mailbox", d: "Desk → Mailbox. Each letter is a decision: a crisis, a lawsuit, an investor, your godfather. Handle it yourself or hand it to your Chief of Staff." },
  { icon: "📈", t: "Watch your four meters", d: "People, Party, Treasury and Godfather. Keep them healthy, win re-election, and one day run for President." },
];

// The topics. Each section: h (heading) and p (a paragraph) or l (a list).
export const TOPICS = [
  { id: "start-here", icon: "🌅", t: "Start here", d: "Quick start or full setup, election night, and your first year.", s: [
    { h: "Your politician", p: "On the title screen you create a politician: a name, a portrait, the state you come from and the party you lean to. Every career you play is kept under that politician." },
    { h: "Quick start or full setup", l: ["Quick start picks sensible choices for you and gets you to the campaign in a few taps. The best way to begin.", "Full setup lets you choose everything: the state, the party, your flagship promise and slogan, your running mate and your Special Adviser."] },
    { h: "The campaign", p: "About six weeks. Each week you pick moves across the state's three districts: rallies, endorsements, the media, the party machine. The opponent hits back every week. A godfather may offer money, and that money comes with favours." },
    { h: "Election night", p: "The votes are counted district by district. If it is close, the loser can go to the election tribunal, then the Court of Appeal and the Supreme Court. You can lose office in court." },
    { h: "Your first year", l: ["Desk → Today shows the year's checklist and your Special Adviser.", "Form your government first: the Executive Council (your commissioners) and the traditional rulers' council. The House will not take a budget from a governor with no cabinet.", "Then the budget, the House vote, programmes, bills and orders, projects, and the mailbox.", "End the year when the mailbox is clear. You see what your choices did."] },
    { h: "Difficulty", p: "Easy, Medium and Hard change how fast approval drains, how often the opposition attacks, and how hard the godfather and Abuja push. Every state also has its own difficulty: Lagos is gentler than Borno." },
  ] },
  { id: "a-year", icon: "🗓️", t: "A year in office", d: "The order of each year, the big moves, and ending the year.", s: [
    { h: "The order of a year", l: ["The budget.", "The House votes on it.", "Programmes, bills and executive orders.", "Projects.", "The mailbox: letters, crises and events.", "The end of the year: work moves on, money is paid, and the year's review appears."] },
    { h: "Big moves", p: "You get a limited number of big moves each year: starting a programme or a project, signing an order, sponsoring a bill, a revenue reform, creating a ministry, opening an investigation. The counter shows how many are left. Meetings, inspections and answering letters are free." },
    { h: "What the state needs", p: "The state has real problems in named local governments: a collapsed road, a hospital with no drugs, schools without roofs. Answer one with a matching programme or project. A need left waiting costs approval every year; ignored past its deadline, it comes back worse, and the papers remember." },
    { h: "Doing nothing has a price", p: "A year with no new work is punished as \"government on autopilot\"." },
    { h: "\"Because you…\"", p: "Many choices pay off, or blow up, a year later. When they land, a card tells you which choice caused it." },
  ] },
  { id: "meters", icon: "📈", t: "Your four meters", d: "People, Party, Treasury and Godfather: what moves them.", s: [
    { h: "People", p: "Your approval: do the people like you? Delivered work, paid salaries and answered complaints raise it. Strikes, scandals, inflation and ignored needs drain it. It decides re-election." },
    { h: "Party", p: "Will your party stand with you? Low party support makes the House hostile, and the House can impeach you." },
    { h: "Treasury", p: "The money the state has now, in naira (₦4.2B means 4.2 billion naira). If it runs out, salaries go unpaid and work stops." },
    { h: "Godfather", p: "How your political sponsor feels about you: Close, Watching, Cold or Hostile. Feed him and he stays close; cross him and he can turn the House against you. Break free, and the meter says so." },
    { h: "Points, not percent", p: "Meter changes show as points: \"Approval +3\" means three points up." },
  ] },
  { id: "money", icon: "💰", t: "Money", d: "FAAC, your own revenue, the budget, debt and inflation.", s: [
    { h: "Where the money comes from", l: ["FAAC: the monthly share of the country's oil and tax money from Abuja. Most of a state's income.", "Your own revenue (IGR): the taxes, levies and fees your state collects itself.", "Loans: banks, bonds and development lenders. Only an accepted offer creates debt."] },
    { h: "The budget", p: "Split the money between sectors; it must add up to 100%. You can start from a draft: the Budget Office's, balanced, populist, reformer, or the godfather's. The House must pass it. Salaries come first: owe workers and the unions strike." },
    { h: "Raising money without borrowing", p: "Revenue reforms such as a digital revenue service, a payroll audit to remove ghost workers, the Treasury Single Account or a land registry. Each one has a trade-off and takes time to pay off." },
    { h: "Debt", p: "Debt has to be repaid with interest. You can ask Abuja for relief, push repayments to the next government, or issue notes at a discount: each has a price." },
    { h: "Inflation (as President)", p: "Printing money (Ways and Means from the Central Bank) pays the bills today and raises inflation tomorrow. While inflation is high, everything costs more, approval drains every year, the dollar debt grows, and past 25% the unions strike. The Central Bank can raise interest rates to fight it." },
    { h: "Where to look", p: "State → Treasury shows the money in and out, month by month." },
  ] },
  { id: "projects", icon: "🏗️", t: "Projects", d: "From an idea to a working road, school or hospital.", s: [
    { h: "The steps", l: ["Propose: say what, where and how big, in your own words. State → Projects → New project.", "Budget: see the cost and what the budget line can pay. Paying over several years is normal; a funding gap means work stops when the money does.", "Find the money, if needed: lenders say yes or no, with reasons.", "Choose the contractor: open tender, selective tender or a direct award. Each bidder shows its reliability, quality, speed and honesty. Some are fronts for your relatives or the godfather.", "Construction: progress each year depends on the money released and the contractor.", "Built is not working: hospitals and schools must be equipped and staffed, and running them costs money every year."] },
    { h: "Places that make sense", p: "Projects must fit the place: no coastal road in Jigawa, no ferry in the desert. The game warns you." },
    { h: "When a project stalls", l: ["No money left: add money, or cut the scope to what is paid for.", "The bank could not pay this year: restart it, and the year's share is paid at the year's end.", "The contractor fled with the fee: only a new contractor restarts it.", "Or ask the ministry for a recovery plan (see Your government)."] },
    { h: "Each state is different", p: "Rural electrification in Lagos is not the same as in Zamfara. Programmes ask a question that fits your state (who builds the mini-grids, how the panels reach the creeks), and each answer has its own cost and risk." },
  ] },
  { id: "government", icon: "🏛️", t: "Your government", d: "Commissioners or ministers, the Head of Service and the Chief of Staff.", s: [
    { h: "Commissioners (ministers for the President)", p: "Each runs one ministry. Their skill, honesty and loyalty are hidden at first and show through their record. Meet them, audit them, back them with money, or sack them. People → Cabinet." },
    { h: "Ministries", p: "Create new ones, merge or split them. Some projects need the right ministry first: a stadium needs a Commissioner for Sports. People → Ministries." },
    { h: "Recovery plans", p: "When a failing commissioner asks for money, you can say \"No money: bring a recovery plan\". The next year they come back with a letter of costed steps: restart their stalled projects first, then steps for their sector. Approve the whole plan, the first two steps, or send it back. What you approve is paid, the stalled sites reopen, and the results land the year after. A crooked minister pads the plan; your adviser flags it." },
    { h: "The Head of Service", p: "The top civil servant. Commissioners' requests go through them, and they bring you a brief with a recommendation." },
    { h: "The Chief of Staff", p: "Picked when you arrive at Government House. They can handle letters for you, and warn first: safe, risky, or needs you. Some are better with the House, some with budgets or projects. A greedy one may slip a friend into a deal." },
    { h: "Your Special Adviser", p: "Sits by your desk, tells you the next step, and explains why. Tap \"Why?\" for the reasoning." },
    { h: "On Tori", p: "Your commissioners and ministers have their own accounts and post what they are doing: site visits, openings, excuses, and sometimes shade." },
  ] },
  { id: "politics", icon: "🗳️", t: "Politics", d: "The House, the godfather, the party, impeachment and re-election.", s: [
    { h: "The House of Assembly", p: "Passes your budget and your bills. Members' loyalty moves with your party support, your approval, unpaid salaries and corruption. The Speaker decides what comes to the floor." },
    { h: "The Speaker", p: "The House elects a Speaker at the start of each term. If the Speaker is not your man, he blocks your bills until you meet his price, and he moves to impeach you the moment your approval slips. The House remembers how you treated it in your first term when it picks the Speaker for your second. Once a term, members may try to remove a friendly Speaker: save him, let him fall, or end up with two Speakers until a court decides." },
    { h: "The godfather", p: "He paid for your campaign and expects returns: contracts, appointments, his candidate. He can rise to a federal post, fall out with you, defect with House members, or die and leave his network behind. You can break free, at a price." },
    { h: "Impeachment", p: "Two-thirds of the House must vote for it, after a panel investigates. It becomes a danger when the people and the party turn on you at the same time." },
    { h: "Promises", p: "Your flagship promise and your promises to each district are judged at re-election. Broken promises make the opponent's attacks hit harder." },
    { h: "Re-election and the second term", p: "At the end of year 4 you campaign again, on your record. Win, and you govern years 5 to 8, then pick a successor and fight for them. A successor can betray you." },
    { h: "Local governments", p: "Council elections can be free and fair, rigged, or skipped for caretaker committees. Since the Supreme Court's 2024 judgment, council money is meant to go straight to the councils." },
  ] },
  { id: "courts", icon: "⚖️", t: "Courts & the law", d: "Lawsuits, the Industrial Court, appeals up to the Supreme Court, and the EFCC.", s: [
    { h: "Why you get sued", l: ["You approved an investor's land or mining deal: the community or environmental groups sue.", "You forced the budget through without the House: the opposition sues.", "Corruption got high: civil society goes to court for an audit.", "One of your policies hurts people: they ask for an injunction."] },
    { h: "Fight or comply", p: "Every case starts at the State High Court. Fight it, and if you lose you can appeal to the Court of Appeal, then the Supreme Court. Or comply and reverse what you did, and get part of the money back. A lawsuit always reaches you; one left unopened is adjourned to next year, not dropped." },
    { h: "Defying the Supreme Court", p: "Section 287 says every authority must obey. Defying it brings a constitutional crisis: approval and party support collapse, and impeachment becomes likely." },
    { h: "The National Industrial Court", p: "Sack workers or lecturers and the unions take you to the Industrial Court. You can reinstate them and pay the arrears, comply in part, or appeal." },
    { h: "Beyond your powers", p: "Some orders are not a governor's to sign: a state army, a state currency, closing the borders. They are listed under \"Beyond your powers\" with the section of the Constitution that says why." },
    { h: "The EFCC", p: "The anti-corruption agency. While you are in office you are protected; after you leave, your record is evidence." },
  ] },
  { id: "tori", icon: "📱", t: "Tori & the people", d: "Your feed, complaints, the press and the street.", s: [
    { h: "What Tori is", p: "The game's own social network. Citizens, the press, the opposition, other governors and your own commissioners post about how the state is run. Open it from the Tori row on the Desk." },
    { h: "Trending and heat", p: "Bad news spreads. The more heat, the further it travels; at its worst, a hashtag calls for you to go." },
    { h: "Complaints", p: "Citizens complain on Tori. Reply, and keep your word: a reply you break comes back as \"You lied\"." },
    { h: "The press", p: "Front pages and news anchors report what you actually did, good and bad." },
  ] },
  { id: "careers", icon: "🇳🇬", t: "Other careers", d: "Senator, LGA Chairman, Ambassador and the road to Aso Rock.", s: [
    { h: "The careers", l: ["LGA Chairman: run a local government.", "Senator: four years in the Senate, your own laws, and re-election.", "Ambassador: a posting abroad, and Abuja's verdict at the end.", "President: the Road to Aso Rock, after a governorship."] },
    { h: "The presidency", p: "Win your party's primary across the six zones, pick a running mate, campaign for six weeks, and win under the Constitution's rule: the most votes, plus 25% in 24 of the 36 states, or a runoff. As President you deal with the Federation Account, the National Assembly, ministers, the Central Bank and the world." },
    { h: "Open careers", p: "Menu (☰) → Careers. The Senator, LGA Chairman and Ambassador careers start with a free first year." },
  ] },
  { id: "help", icon: "🛟", t: "Help & FAQ", d: "Saves, devices, purchases, languages and how to reach us.", s: [
    { h: "Saving", p: "The game saves by itself after every decision. In Lagos Life your save is kept with your account; on our own site, sign in with Google to keep it on every device (Menu → Keep your game on every device)." },
    { h: "One device at a time", p: "If you open the game on a second phone, your game moves there. The first phone shows \"You're playing on another device\"; tap Play here to bring it back. Nothing is lost." },
    { h: "A lost career", p: "Starting a new game never wipes out the old one: the last careers are kept, and the title screen offers to bring them back." },
    { h: "Purchases", p: "Everything you buy is play, never a better result: careers, scenario packs, outfits, a second chance. Game money can't be cashed out." },
    { h: "Languages", p: "English, Pidgin, Yoruba, Hausa and Igbo." },
    { h: "Tell us", p: "Menu (☰) → Tell us what to improve. We read every message." },
  ] },
];

// How to… quick answers. topic: where the full answer lives.
export const HOWTO = [
  { q: "How do I start a new game?", a: "Title screen → New game. Quick start is the fastest way in.", topic: "start-here" },
  { q: "How do I win the election?", a: "Spend your campaign days where you are weakest, answer the opponent's attacks, and pick moves that match your slogan.", topic: "start-here" },
  { q: "How do I pass the budget?", a: "Form your cabinet first, keep salaries paid, and keep your party support up. The House votes with its loyalty.", topic: "money" },
  { q: "Why did the House reject my budget?", a: "Low party support, unpaid salaries, high corruption or low approval turn members against you. Fix one and try again, or win members over one by one.", topic: "politics" },
  { q: "How do I get more money?", a: "Revenue reforms (State → Treasury), cutting waste, a payroll audit, or loans. Investors bring jobs and tax.", topic: "money" },
  { q: "What is FAAC?", a: "The monthly share of the country's oil and tax money that Abuja sends each state. Most of your income.", topic: "money" },
  { q: "What is IGR?", a: "Your state's own revenue: the taxes, levies and fees it collects itself.", topic: "money" },
  { q: "How do I pay salaries when money is short?", a: "Borrow, pay salaries and hold the contractors, or owe workers. Owing workers leads to an ultimatum, then a strike.", topic: "money" },
  { q: "How do I start a project?", a: "State → Projects → New project. Say what, where and how big. Approving uses one big move.", topic: "projects" },
  { q: "How do I choose a good contractor?", a: "Look at reliability, quality, speed and honesty. Open tender is cheaper and safer than a direct award.", topic: "projects" },
  { q: "How do I restart a stalled project?", a: "Open it in State → Projects. Add money, cut the scope, restart it, or find a new contractor if the old one fled.", topic: "projects" },
  { q: "Why is my finished hospital not helping anyone?", a: "Built is not working: equip it and staff it. Running it costs money every year.", topic: "projects" },
  { q: "What are big moves?", a: "Your limited major actions each year: programmes, projects, orders, bills, reforms, new ministries and investigations.", topic: "a-year" },
  { q: "How do I end the year?", a: "Clear the mailbox. Then the year ends and you see what your choices did.", topic: "a-year" },
  { q: "What does the Chief of Staff do?", a: "Handles letters for you, with a warning first: safe, risky or needs you.", topic: "government" },
  { q: "How do I sack a commissioner?", a: "People → Cabinet → open the commissioner. A new one takes over their files.", topic: "government" },
  { q: "How does a recovery plan work?", a: "Tell a failing commissioner \"No money: bring a recovery plan\". Next year they send costed steps; approve what you want done.", topic: "government" },
  { q: "How do I create a ministry?", a: "People → Ministries. Some projects ask you to create the right ministry and carry on from there.", topic: "government" },
  { q: "How do I deal with my godfather?", a: "Give him what he asks and he stays quiet; refuse and he pushes back. You can break free later, at a price.", topic: "politics" },
  { q: "Why is the Speaker trying to impeach me?", a: "A hostile Speaker moves to impeach as soon as your approval drops below last year's. Meet his price that year, win the House back (the President's backing at the party can do it), or keep your approval rising.", topic: "politics" },
  { q: "How do I get a friendly Speaker in my second term?", a: "Keep your promises to the House, pay the Assembly on time and meet the Speaker's price when it comes. Break promises and go over the members' heads, and the new House elects someone who wants you gone.", topic: "politics" },
  { q: "How do I avoid impeachment?", a: "Don't lose the people and the party at the same time. Pay salaries, keep corruption down, and keep House members on side.", topic: "politics" },
  { q: "How do I win re-election?", a: "Keep your promises, deliver the projects people can see, and keep approval up in every district.", topic: "politics" },
  { q: "Why am I being sued?", a: "Your own actions trigger suits: land and mining deals, a forced budget, high corruption, a harmful policy.", topic: "courts" },
  { q: "Should I fight a lawsuit or comply?", a: "Fighting can win, and you can appeal if you lose. Complying reverses your action and gets part of the money back.", topic: "courts" },
  { q: "What happens if I defy the Supreme Court?", a: "A constitutional crisis: approval and party support collapse and impeachment becomes likely.", topic: "courts" },
  { q: "Why can't I sign some orders?", a: "They are beyond a governor's powers under the Constitution. The card says which section.", topic: "courts" },
  { q: "How do I open Tori?", a: "Tap the Tori row on the Desk.", topic: "tori" },
  { q: "How do I answer a complaint?", a: "On Tori, tap Reply on the complaint. Keep your word, or it comes back as \"You lied\".", topic: "tori" },
  { q: "How do I run for President?", a: "Finish a governorship, then Menu (☰) → Careers → Road to Aso Rock.", topic: "careers" },
  { q: "How does the President win?", a: "The most votes, plus 25% in 24 of the 36 states. If no one does, there is a runoff.", topic: "careers" },
  { q: "What is Ways and Means?", a: "An overdraft from the Central Bank: printed money. It pays the bills now and raises inflation next year.", topic: "money" },
  { q: "How do I bring inflation down?", a: "Back the Central Bank when it wants to raise interest rates, and stop printing money.", topic: "money" },
  { q: "Where is my biography?", a: "Profile → Your biography: your record as an encyclopedia page.", topic: "start-here" },
  { q: "Where is my career map?", a: "Menu (☰) → Your career map: the states you have governed and your badges.", topic: "careers" },
  { q: "Did I lose my game?", a: "No. The game saves itself, and older careers are kept. The title screen offers to bring them back.", topic: "help" },
  { q: "Why does it say I'm playing on another device?", a: "You opened the game somewhere else. Tap Play here to bring it back to this phone.", topic: "help" },
  { q: "How do I keep my game on every device?", a: "On our site: Menu (☰) → Keep your game on every device, and sign in with Google. In Lagos Life it follows your account.", topic: "help" },
  { q: "How do I change the language?", a: "Tap Language on the title screen: English, Pidgin, Yoruba, Hausa or Igbo.", topic: "help" },
  { q: "How do I send feedback?", a: "Menu (☰) → Tell us what to improve.", topic: "help" },
  { q: "What does a word mean?", a: "Tap any underlined word in the game, or open the Glossary here.", topic: "glossary" },
];

// The glossary, once per meaning (the game keeps aliases such as "budget law" for "Appropriation Bill").
export const glossaryList = () => {
  const seen = new Set(), out = [];
  Object.entries(GLOSSARY).sort((a, b) => a[0].localeCompare(b[0], "en", { sensitivity: "base" })).forEach(([w, [full, mean]]) => {
    const k = mean; if (seen.has(k)) return; seen.add(k); out.push({ w, full, mean });
  });
  return out;
};

const norm = (t) => String(t || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9₦ ]+/g, " ");
const sectionText = (x) => (x.p || "") + " " + (x.l || []).join(" ");
/* Search the whole guide: topics (per section), quick answers and the glossary. Every word must match. */
export const searchGuide = (q) => {
  // Stems, so "stalled" finds "stalls" and "projects" finds "project".
  const words = norm(q).split(/\s+/).filter(w => w.length > 1).map(w => w.length > 5 ? w.slice(0, w.length - 2) : w); if (!words.length) return [];
  const hit = (t) => { const n = norm(t); return words.every(w => n.includes(w)); }, score = (title, t) => words.reduce((a, w) => a + (norm(title).includes(w) ? 3 : 0) + (norm(t).includes(w) ? 1 : 0), 0);
  const out = [];
  HOWTO.forEach((x, i) => { if (hit(x.q + " " + x.a)) out.push({ kind: "howto", i, title: x.q, text: x.a, topic: x.topic, score: score(x.q, x.a) + 1 }); });
  TOPICS.forEach(T => T.s.forEach((x, j) => { const t = sectionText(x); if (hit(T.t + " " + x.h + " " + t)) out.push({ kind: "topic", topic: T.id, j, title: T.icon + " " + T.t + " · " + x.h, text: t, score: score(x.h, t) }); }));
  glossaryList().forEach(g => { if (hit(g.w + " " + g.full + " " + g.mean)) out.push({ kind: "glossary", title: g.w, text: g.full + ": " + g.mean, topic: "glossary", score: score(g.w, g.full + " " + g.mean) + 1 }); });
  return out.sort((a, b) => b.score - a.score).slice(0, 20);
};
export const topicById = (id) => TOPICS.find(t => t.id === id) || null;
