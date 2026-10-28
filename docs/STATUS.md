# Seat of Power — status (4 Oct)




## Trade with the neighbours (26 Oct, latest)
From a player (Olajire Samuel, Ogun): "what about if Governors go on trips to other neighbouring states to do trade exchange with them". game/systems/interstate.js.
- **Real neighbours:** every state's land borders (checked both ways in tests). Each neighbour has a fictional governor, your party or the opposition, and relations that move with how you treat them.
- **The trade mission** (State → Economy, the councils page, the State Economic Council, and a Desk prompt): pick a neighbour, pick the deal, then go yourself (one big move, better odds) or send the Commissioner for Commerce (free). A no comes with their price: a share of the earnings, your vote at the Governors' Forum, or a boundary quarrel settled their way. One mission a year; three deals at most.
- **Four deals:** supply pact (their crop for your markets and factories), market access (your goods into theirs), a joint road and border market (half each, two years to build), a security pact (joint patrols on the shared highway). Each earns, or pays back, every year.
- **Six storylines:** the toll gates (a state on the route charges levies; call its governor, build a way round, or retaliate and start a trade war), the half-built road (the partner stops paying), a new governor tears the deal up, the boundary quarrel, goods leaking across the border, and success (a joint processing plant).
- **The President:** once a term, two governors at war over levies come to the Villa: mediate, back your party's governor, or ban state levies by executive order.
- **Tests:** tests/interstate.test.mjs; tests/e2e/councils.mjs signs a supply pact with Oyo from Ogun in the browser.
- **Art:** stand-ins for now; the request to Lovable is docs/LOVABLE-INTERSTATE.md.

## Councils at the table, trade, and exports (26 Oct)
From player feedback (Chinaza: programmes should depend on money, LGAs should show their district; Ben: earning money should be easier, with exports and imports) and the owner's trade design. Both offices.
- **Real senatorial districts** (game/systems/districts.js): all 36 states and the FCT, each LGA in its real district, named as INEC names them ("Ogun Central"). LGA lists show the district.
- **Programmes** are limited by money and the ministry's capacity, not by slots: two running per sector, three when the minister or commissioner performs at 75+.
- **Councils at the table** (CouncilTable in game/seat-of-power.jsx): every council sits around an oval table, the council's wax seal at its centre, you presiding at the head. Each member speaks in turn (one line, tied to the game: the worst front, the reserves, the factories), then the decision.
  - President: the Federal Executive Council (first sitting; a yearly retreat that publishes or keeps the scorecards), the National Security Council (first sitting; an emergency session where you choose the front), and the new Economic Advisory Council.
  - Governor: the State Executive Council and the Traditional Rulers Council when first formed, and the new State Economic Council.
  - Seals: fec, nsc, eac, exco, rulers, econ (game/systems/chief.js), with Lovable's pictures. Each council has its own chamber; the economic team, Customs, the farmers, the Chief of Defence Staff and the DSS have their own portraits (the first three with moods).
- **Fixed:** the President's game crashed at the end of the first year ("Something went wrong"): the district-label change made zoneLabel call itself.
- **Trade** (game/systems/trade.js), for the President:
  - The Economic Advisory Council's first sitting sets the stance: Protect, Open or Targeted. Later sittings show the figures; changing course costs approval.
  - Each year: reserves, the street dollar's premium, a food price index, factories, smuggling and exports move with the stance and with security (bandits empty the farms: protection plus empty farms is the trap). Customs duties and exports pay into the treasury.
  - Five storylines open from the figures: the dollar shortage, the smugglers' border, the money-changers, Apapa (where you can build a deep seaport for the East, a dry port in Kano, or the cargo rail line, each opening years later), and selling to the world.
- **Exports** (game/systems/trade.js), for the governor:
  - Every state has its two real export crops (Ondo: cocoa and cashew; Kano: sesame, hides and skins; and so on).
  - The State Economic Council chooses how to sell: raw through aggregators, a container depot and farm-to-port road, or a processing zone (two years to build). Later sittings add the second crop, a zone or the depot.
  - The state earns money at every year's end, more with good farms and security, less under a ban.
  - Abuja's trade stance (drawn once per game) helps or hurts: protection helps raw farmers but makes processing machines dear; open borders the reverse; border states feel it first.
  - Four storylines: the rejected containers (aflatoxin), the middlemen, the exclusive buyer, containers held at the port.
- **Tests:** tests/trade.test.mjs; tests/art-usage.test.mjs (all 35 pictures of the pack are used); tests/e2e/councils.mjs (the governor's councils at the table, the export plan, the year's earnings); the president e2e convenes the Economic Advisory Council, sets the stance and checks a year of trade.

## More decisions, and complaints you can answer (26 Oct)
From player feedback ("how can a president make just six decisions a year"; "we should be able to click on the public complaints and solve them"). Both offices.
- **Big moves** (game/systems/agenda.js):
  - 10 on Easy, 8 on Medium, 6 on Hard.
  - Earned extras: +1 for a capable Chief of Staff (competence 70+); +1 for each commissioner or minister performing at 70+ (up to 3); +1 at approval 60+.
  - Bills and executive orders no longer use big moves. The House or National Assembly takes 3 bills a year; more than 3 orders a year brings "rule by decree" (approval −1 each, a wiki line).
  - The Desk chip reads "Big moves 5/8 · bills & orders free"; tapping it shows the breakdown.
- **Complaints** (game/systems/complaints.js):
  - The street panel lists up to five complaints, each tied to a real cause: unpaid salaries, a failed or open need, an abandoned site, corruption, defecting members, a zone left out of the cabinet, a crisis storyline, a strike. For the President, also the national crisis and the worst security front.
  - Tap one to answer it:
    - visit, or answer on the radio: free, once, a little goodwill;
    - send the minister in charge: free; it works if they are good;
    - fix it: opens the real fix (treasury, projects, cabinet).
  - At the year's end an unanswered complaint costs approval and its zone's mood. Words without a fix cost more: next year the complaint says "you lied".
- **Tests:** tests/agenda.test.mjs, tests/complaints.test.mjs, tests/e2e/complaints.mjs (a governor answers a complaint in the browser). The president e2e checks complaints and big moves on screen. The e2e bot leaves complaints alone.

## Storylines that remember: no more "the queues are back" twice (25 Oct)

- **The engine** (game/systems/storylines.js): a recurring matter is a graph of beats, one a year. Every answer is one of four kinds:
  - a **programme**: money, works now;
  - a **bill**: passes or stalls next year on the House's mood; a stalled bill comes back as a fight (bargain, go public or drop it), and a second failure is thrown out;
  - an **executive order**: instant, and a court may strike it down next year (defend it, turn it into a bill, or withdraw it);
  - an **act**: anything else.
- **How the story moves:**
  - A good answer moves the story on to a new problem; a weak one escalates.
  - Three weak answers (a good one takes one back) boil it over.
  - No beat repeats, and a solved story closes.
  - Each card opens with "Last year you…".
  - Three executive orders bring "rule by decree".
- **The President's crises:**
  - Fuel (20 beats): Atlas Petroleum's terms; the price cap in court; the cartel; NUPENG parks the tankers. It hooks into the NLC and NUPENG strikes.
  - Insurgency (19): a splinter group under Ameer Bulama; the highway; the vigilantes turned warlords; the state police amendment; the bomb in Abuja.
  - Naira (14): float, defend, the printing press, the IMF (which hooks the NLC), food riots, exports.
- **The agenda, for all 10 agendas:** eight years, each with its own problem.
  - Term 1: land, people, the test, the ribbon. Term 2: upkeep, every LGA wants one, capture, will it survive you.
  - Corner-cutting comes back next year as the cheap work giving way.
  - A bill builds nothing that year, but passes into law; an order is fast, but can be struck down.
- **Security fronts:** the National Security Council letter brings the worst front's next development (the Lake Chad islands, then a new faction; Kachalla Dan Sule's forest state; "unknown gunmen"; a former militant guarding the pipes), plus the choice to send the forces to the second front instead.
- **The national cake remembers:** padding leads to the tracking report, then the anti-graft agency's letter; refusing leads to the Senate getting even, then an override threat.
- **Traditional rulers remember promises:** "Promise it for next year" comes back next year, then "has run out of patience". A ruler does not bring the same kind of matter twice running.
- **The governor's state crises are storylines too** (game/systems/statestories.js). All 14 (oil spill, illegal refineries, the bandits' tax, the school abduction, insurgents, farmers and herders, flood, sit-at-home, almajiri, the waterfront, the cult wars, erosion, lead poisoning, the land war) run for several years in one LGA.
  - Each year an open crisis brings its next development, decided by last year's answer. Examples: relief camps lead to cholera in the camps; paying a ransom makes your schools a market; naming the refineries' protectors means the protectors strike back.
  - Bills go to the House of Assembly; orders can be struck down by a State High Court.
  - A second crisis can open while one runs, and a closed one never returns.
- **Different openings in each game:** fuel, insurgency and the naira have three openings each.
  - Fuel: the queues; a tanker inferno; the rehabilitated refinery on fire.
  - Insurgency: an overrun base; two hundred schoolgirls taken; armed drones.
  - Naira: the fall through ₦2,000; oil at $40; a junk rating.
  - Every security front and every governor's state crisis has two.
  - A new game draws one at random; the openings not drawn never turn up later.
- **The agenda changes from game to game:** every year of every agenda has a second possible problem (40 for the first terms, 4 for the second), and a new game draws which one comes each year. Build, Build, Build might open with the land along the route, or with a market in the way.
- **The daily decision: 60 dilemmas** (30 new: cholera, a building collapse, a market fire, an okada ban, SUVs for commissioners, a journalist arrested, pensioners at the gate, a jailbreak and more). Days already played keep their dilemma; none comes back within sixty days.
- **The war's middle varies:**
  - Each game draws a version of the readiness question, the junta's first hostile act, the Axis build-up and the ending (surrender, Voko flees, or his officers arrest him); the UN letter follows the ending.
  - War weariness changes every year it lasts.
  - Defence Headquarters has 18 missions, up from 10.
- **The Bakunda war opens three ways:** a disputed election, a president who vanished, or a third term. The country is drawn each game.
- **Tests:** tests/storylines.test.mjs plays 400 random terms per storyline and fails on any repeated card. The president e2e checks the "Last year you…" line on screen; the playthrough e2e checks the flagship story.

## Fresh trouble every game: the war, the strikes, the wiki (25 Oct)

- **The junta's moves** (game/systems/bakunda.js, `BAKUNDA_GAMBITS`): eight scenarios that can come in any year after the coup, in any order, war or no war, until the peace is law.
  - The eight: missiles on the border; a bomb cell at home; Ostrava's mercenaries; a Nigerian tycoon funding the junta; Tessara, the junta's friend; stolen crude; a cyber attack; a murder plot against an exile in Abuja.
  - Each has two openings: caught planning, or already done.
  - Hard answers hit General Voko and his backers. Results are rolled, so a strike can find an empty site.
  - Soft answers embolden the junta: its next move comes sooner and lands harder.
  - A move takes the place of the year's lesser decision, so the year still holds two decisions and one trip.
- **Sound:**
  - Missile strikes (and Air Force missions) play `audio/sfx/missile.mp3`.
  - When war news reaches the President, the music gives way to `audio/war-theme.mp3` once.
- **Arresting the NLC's leaders is an escalation, never a win.** The outcome is rolled:
  - 55%: every union walks out in solidarity;
  - 25%: a court frees them and calls the arrests unlawful;
  - 20%: the strike breaks and goes underground into sabotage.
  - Next year the world condemns the arrests: drop the charges, or charge them with treason.
  - Nobody applauds: no "we have a deal", and no factories-reopening letter.
- **Strike twists** (labour.js, `TWISTS`, `strikeTwist`, `twistAfter`): most years a running strike takes a new turn, from a pool, never repeated.
  - ASUU (8): #EndASUUStrike blockade; CONUA breaks ranks; the industrial court; the brain drain; religious mediators; the revitalisation audit; reopening with part-time staff; school-leavers with nowhere to go.
  - NLC (5, plus the arrest aftermath): the TUC breaks ranks; the court; the market women; a share of the bill; palliatives.
- **The wiki reads like a Wikipedia biography:**
  - the ordinal and dates in the lead;
  - the governorship told by subject, with dated sentences;
  - approval taken from a named pollster;
  - a Legacy section with a ranking;
  - the infobox in Wikipedia's order, with a Personal details block.

## Easier to start, clearer to follow (from a first-time player's review) (25 Oct)
- **The basics:**
  - How to play opens five picture cards: you are in charge; how a year works; three things to watch; how you win and lose; you don't need to know politics.
  - The old text is "The full guide" behind them, with plain headings.
  - The title screen says: "No politics needed: you learn as you play."
- **Glossary** (`game/systems/glossary.js`):
  - Every abbreviation (FAAC, IGR, NLC, ASUU, INEC, EFCC, LGA, MoU and the rest) and every piece of political slang (security vote, ghost workers, japa, omo onile, the national cake, Ways and Means) is underlined where it appears.
  - A tap shows the full name and one line of meaning.
  - It is drawn with the browser's highlight feature, so the page is never rewritten; buttons are left alone.
- **The journey:**
  - A slim strip on the Desk (Elected, years 1–4, Re-election, years 5–8, Legacy) shows where you are.
  - The end of each year says it is saved and a good place to take a break.
  - The owner asked for no in-year checklist and no time estimate, so there are none.
- **Pace** (setup): Relaxed, Standard or Intense. A first game defaults to Relaxed.
  - Relaxed: fewer decisions each year, half the site crises and japa risk, and no random strikes.
  - Intense: one more decision each year and more crises.
- **Systems arrive gradually:**
  - Year 1 is the budget, the needs and the letters.
  - Tours, the Aso Rock visit, state visits and invitations abroad open in year 2.
  - ASUU can strike from year 3.
  - The adviser introduces each one the year it opens ("New this year…").
  - The test switch `early` opens everything at once for the browser tests.
- **The film** (`tools/film/explainer.html`, about 90 seconds):
  - It opens with "Have you ever wondered if you have what it takes to govern?", told through the game's own art with captions.
  - It is not part of the game or the site (the owner's decision): the source lives in tools/film/ and is recorded to MP4 in 16:9 (YouTube) and 9:16 (WhatsApp status, Reels, Shorts).

## Strikes, the roundtable, and building in Nigeria (25 Oct, latest)
- **Labour** (`game/systems/labour.js`). Union names are real; every person is fictional.
  - **The NLC:**
    - Raising VAT (President) or a market levy or Land Use Charge (governor) brings the NLC's 14-day ultimatum, as a banner on the Desk: reverse it, or meet them.
    - Ignore it past the year's end and the strike starts.
    - Each year with no talks another union joins.
      - President: NUATE grounds the airports (no trips abroad, no investor visits), then NUEE pulls the grid (revenue −15%, jobs, a manufacturers' letter), then NUPENG stops the tankers.
      - Governor: the secretariat, then NUT, then JOHESU.
    - Every year the strike runs it costs approval, revenue and stats.
  - **ASUU:**
    - May strike from year 2, likelier when education is underfunded.
    - The universities shut, youth unrest rises, and #EndASUUStrike comes in the second year.
    - University chains freeze while the strike is on.
    - Its demands are impossible: the revitalisation fund, UTAS instead of IPPIS, earned allowances.
    - The first offer is "an insult", and it signs no MoU in the first year.
  - **The roundtable** (two sessions a year): the bank and their demand side by side, the demand being everything in the bank or what is owed if that is more. The options:
    - pay everything (next year: unpaid police and soldiers, an emergency loan);
    - an MoU, 30% now (miss next year's instalment and they are back out);
    - a concession (odds depend on trust, corruption, the Labour minister's skill and time);
    - refuse;
    - force (sabotage afterwards);
    - cancel a running programme or project to pay them;
    - President only: Ways and Means (inflation and a naira crash two years later).
  - A new Labour ministry exists for both offices; without one, the Chief of Staff negotiates and the odds fall.
- **Building in Nigeria** (`chains.js`):
  - **Halfway crises differ by zone:**
    - NW: bandits kidnap foreign engineers (ransom, a rescue that can fail, or local contractors with a 2-year delay).
    - NE: insurgents (the army, or vigilantes paid from the security vote).
    - NC: herders and farmers (the army, or the palace with compensation).
    - SE: the Monday sit-at-home (no Monday work, an army escort, or a community deal).
    - SS: ex-militants (surveillance contracts or the JTF).
    - SW: omo onile and "deve" (pay, the police, or the Oba).
  - **Every ⭐ programme** also brings:
    - the cabal's "national cake" contract ask (refuse it and a media campaign follows);
    - when the legislature is not with you, a 10% "oversight" demand that stalls the work;
    - for northern farm or South-West works without the palace's blessing, blocked land.
    - A state visit to the royal fathers gives that blessing for the zone.
  - **Japa:** a contractor may take the mobilisation fee and flee to London, Toronto, Houston or Dubai (likelier with direct awards and corruption). Report them to the EFCC and Interpol, re-award, or abandon.
- Art brief: Pack 24 in docs/LOVABLE-PRESIDENCY.md.
- Tests: tests/labour.test.mjs, more in chains.test.mjs; e2e labour.mjs.

## Consequences that follow you, and visits that become work (25 Oct, latest)
- **Consequence chains** (`game/systems/chains.js`). Each chain is tied to the place where its programme, bill or order ran, in either office:
  - **A finished programme:**
    - a year later, the Commissioner or Minister writes about what changed in that place (Plateau's farm loans → a bumper tomato harvest);
    - the year after, an investor offers to build there (Lusitana of Portugal → a tomato processing plant).
    - The programme runs again only in another place that needs it.
  - **Big works at the halfway mark:** armed groups may stop the site (the Coastal Highway). Clear them out, pay them (they come back) or leave it stalled.
  - **The Ease of Doing Business order:**
    - the trade letter about new firms;
    - then the court strikes the order down and an investor threatens to leave;
    - the appeal succeeds only if corruption is under 50%.
  - **The Electoral Act / State Electoral Law:**
    - cleaner elections, with smaller swings;
    - fewer petitions;
    - no rigging options in council elections.
  - **A chain beat crowded out of a busy year** comes back the next year; it is never lost.
- **The President's councils.** The President convenes the Federal Executive Council and the National Security Council (`fedCouncils`); the Traditional Rulers Council is the governor's only.
  - The Councils tab offers an FEC retreat on delivery and an emergency Security Council session (₦20B), each once a year.
  - Older saves are treated as already convened.
- **Education:**
  - federal colleges refurbished;
  - a new federal university (programme);
  - the Federal Polytechnic (Conversion to University) bill;
  - a new state university for governors.
  - A university's chain is the first matriculation, then a research investor.
- **Bills can answer needs, like orders:** the polytechnic bill answers schools, the state police amendment security, and the Electricity Act power.
- **Visits become work:**
  - The President's state visits (a town hall, the troops, the royal fathers): the people ask for something in person, and it lands on the Desk as a need for that state.
  - Governors tour LGAs twice a year: meet the chairman or hold a town hall (it can turn rough when approval is low). The request becomes a need for that LGA.
- Tests: tests/chains.test.mjs and visits.test.mjs; e2e chains.mjs, chains-gov.mjs and tours.mjs.

## Strain: the inherited debt, interest and repayments (18 Oct, latest)
- **A new game owes the last government's debt.** It is about a year's revenue (`SYS.inheritedDebtB`; almost ₦20B for Ogun). The adviser's first line names it.
- **Year 1 choice (`oldDebtPlan`), when the first money arrives:**
  - pay as much as possible now (this year is almost empty, then smaller instalments over 4 years);
  - spread it over 4 years;
  - spread it over 8 years (lighter each year, more interest, and the successor pays the tail).
- **All debt costs 8% interest a year** (`DEBT_RATE`). Each year's repayments come off the top, before work money: the interest, the old debt's instalment and 6% of other debt. The budget's Debt line can pay more than is due.
- **Removed:** the old automatic paydown (8% of debt, plus a slice of own revenue and GDP, repaid for free each year).
- **Revenue-scaled thresholds:** debt warnings and headlines, the Fiscal Responsibility bill and the "Fiscal hawk" honour (now: debt cut to half of what you inherited) scale with revenue. Lenders lend up to 2× / 1.6× / 1.3× a year's revenue (Easy / Medium / Hard).
- **The year's money card** now lists debt repayments, any old debt paid off at once, and what is still owed.

## Where the money comes from (18 Oct, latest)
- **Year 1 opens with an empty treasury.**
  - The bank starts at ₦0. The first year's money card says the last government left contractors' bills unpaid (15% of the year's work money).
  - The adviser's first line recommends purging ghost workers. That is the biometric payroll reform; adopting it now also puts that year's saving straight into the bank.
- **The year's money card is a receipt:**
  - FAAC from Abuja;
  - taxes and fees;
  - each named story;
  - salaries, offices and debt;
  - unpaid bills (Year 1 only);
  - what is in the bank.
- **Named money stories** (`noteMoney`, kept in `stc.moneyNews`):
  - **A commissioner who delivers** (performance above 65, corruption below 50) can bring money in through their sector (`SYS.ministryWindfall`): agric exports, a health-foundation vaccination grant (fictional Meridian Health Foundation), an education partnership grant, road tolls, reopened markets, a revenue drive, or savings returned. At most two a year, scaled to revenue.
  - **A commissioner who misses every target** wastes part of their ministry's money (`SYS.ministryWaste`), on top of the existing fallout (work slows, approval −1, the adviser's fire-or-keep).
  - **Deals:** the Abuja intervention fund (₦1.5B into the bank, once; it used to raise FAAC every year by mistake), the Dutch deal and approved investors (their taxes each year) are recorded too.

## Money, the House and elections (18 Oct, later)
- **One bank (`game/systems/treasury.js`, `s.cash` in ₦B).**
  - When the year's budget is settled, the year's revenue arrives. The budget's running lines (salaries, offices, debt) come off the top; the rest goes into the bank. Unspent money stays.
  - Everything the governor buys goes through `spendB`: programmes (each year's share), projects (contractors paid at year end), bills, new ministries, restructuring, commissioner money, House deals, trips, investor incentives, flagship and event choices.
  - Each payment comes from the bank first. Only the shortfall is borrowed, up to a debt limit of about a year's revenue (1.5× Easy, 1.2× Medium, 1× Hard).
  - Past that limit the state is broke: the action is refused with the reason. A running programme pauses for the year.
  - Obligations (court awards, running costs of facilities, wages owed) are still met (`force`).
  - The status strip shows "In the bank". A card says what came in each year.
- **The House.**
  - A blocked vote now offers ways to clear it: pay the godfather what is owed (₦0.5B, corruption +3%), make peace through party elders (₦0.3B), or go over the members' heads to the voters (works at 55% approval or more).
  - The funding objection fires only when the bank can't pay and debt is near a year's revenue.
  - The budget vote shows one dot per seat.
- **Elections.**
  - **One screen a week:** your best answer to their last attack plus the two strongest moves you can afford. Their attack lands right after your move. No "days" resource and no list of things you can't do.
  - **The win rule is Section 179(2):** the most votes and 25% in two-thirds of the local governments, counted by LGA. A second election is held if the leader misses the spread.
  - **The result page:** the verdict and the button first, then "See the full count".
- **Smaller fixes.**
  - The lender is "a syndicate of three commercial banks" (no real names).
  - EFCC investigations open with the record entry that caused them.
  - The adviser's key words can be tapped for one plain line, and the line can be read aloud.
  - The profile shows the ending titles earned and locked.
- **Tests:**
  - `tests/treasury.test.mjs`;
  - `npm run e2e:projects` adds a "bank pays, nothing borrowed" journey and a "broke: refused, nothing borrowed" journey;
  - `npm run e2e` (both full playthroughs) passes.

## Projects: approval → procurement dead end (fixed, 18 Oct)
- **Cause (reproduced in the browser).**
  - Capital programmes from the Policies step still used the old pipeline (`capProj` → `confirmCapital` → `pendingProc`).
  - That pipeline's contractor screen (the old ProcurementModal) only rendered inside the old realism Projects panel, which Stage D unmounted.
  - The adviser read `pendingProc` and said "Award a contractor…" with an "Open Projects" button. The new Projects tab listed the project as an "older file" with no actions.
  - So the adviser and the Projects tab read different state, and the player reached an empty screen.
- **Fix.**
  - One pipeline: programmes now open the same propose → budget → money → contractor flow as custom projects.
  - `SYS.nextStep(project)` (in `game/systems/projects.js`) is the single source for the adviser's message, its button, the project card's action and where the button goes.
  - Each step is one of: due, with a named button ("Review road procurement"); blocked, with the reason and the real ways out; or nothing due, with when.
- **Approval is only a budget.** Approval sets the budget: no contractor, nothing spent. Money arrives only when a loan offer is accepted. Work starts only at contract award.
- **Blocked funding.** When every lender has said no, the project says Blocked and offers "Fit the scope to the budget" (`SYS.fitScope`) or "Defer indefinitely".
- **Old saves (save v4).** `migrateOldProject` converts old-style projects on load. A project stuck in procurement becomes a normal project whose next step is procurement, or finance if it had no money arranged.
- **The polished slice.**
  - The project dossier has three layers: the situation, the decision tiles, and a "Full briefing".
  - A seven-stage milestone strip comes from `SYS.milestoneOf`.
  - Stamps appear only once a decision is in the project's record: Approved, Funded, Contract signed.
  - The Special Adviser appears at the desk: portrait, one message, a primary button for the exact task, Why?, Later, mute, and a reduce-motion switch (the device setting is also respected).
  - The desk shows a "What changed" strip.
- **Tests.**
  - `npm run e2e:projects` (`tests/e2e/projects.mjs`) covers: approve; follow the adviser; the right step opens; complete it; the project and the adviser both update; reload and resume; two projects; an old stuck save; and the funding blocker.
  - Unit tests cover `nextStep`, `migrateOldProject` and `fitScope`.

## Removed: inauguration / First 100 Days and budget padding (Steve's decision)
- `public/sop-first100.js` deleted (every DAY scene, including "The oath, and then the microphone", the three speech drafts and the "Name the missing ₦40bn" line), plus its script tag.
- Budget padding step deleted: all "Padding your PA flagged" envelope cards (every sector) and their four choices, plus the Speaker's late-night constituency-project demand that lived in the same step. The budget itself (Batch F) stays; after a turn, play now goes straight to the budget.
- Readers removed or rewritten: godfather road rule, ledger padding/tribunal lines, SA signals, Wikipedia "First 100 days" section (now "Cabinet"), DAY-location citations, EFCC cause, and adviser and news wording that mentioned padding.
- Old saves: `scrubRemovedContent()` (inside `migrateSave`) moves a save sitting in the old padding phase to the budget and drops the DAY/padding ledger entries (and anything caused by them), logs, wiki events, the signature-road project and its procurement entries.

## Checks
- Codebase search ("padding", "inauguration", "oath", "First 100 Days", "₦40bn", scene titles): the only remaining hits are the scrubber's own patterns and comments, which never show to the player. Neutral "sworn in" mentions (wiki, tribunal) stay.
- Old-build save in the padding phase, with 3 DAY entries, loads on the new build cleanly on the Desk, with none of those entries left.
- Two in-game years (4 turns) each as Edo and as Lagos: 0 console errors, 0 traces of either group in screens, logs or the ledger, and turn 1 lands on the Desk.

## News anchors
- Permanent faces: Ibrahim Danjuma (navy suit, glasses) and Funmi Okeowo (burgundy suit).

## Art pack (Seat_of_Power_Art_Compressed.zip)
- All 92 images are converted to WebP in `public/art/` (4 MB in total). The anchors keep the faces Steve chose; the pack's copies are the same two people.
- Where the art now appears:
  - **Tab bar:** Desk, Map, People and Wiki use the drawn icons instead of emoji.
  - **Desk dilemmas:** every dilemma has a scene, for example a market fire with a trader, cholera with a doctor, a kidnap with a soldier at a classroom, floods, herder clashes at the emir's palace, a traditional-council bill with an emir or oba/obi depending on region, other bills with the Speaker, and the ASUU strike with a teacher.
  - **Economic shocks:** a pandemic shows a hospital ward, protests a street, a flood the flooded community, an attack the market, and an oil, naira or bank crash Abuja.
  - **Investors:** the construction site, with a Nigerian investor or a foreign engineer.
  - **Trips:** Abuja trips use the federal office; the Netherlands and other invitations use the airport.
  - **Intelligence reports:** the back room.
  - **Courts and bills:** every courtroom has the judge, and Assembly bills show the Speaker.
  - **Re-election:** the convention hall and party chairman (pleased or angry with party stability).
  - **Election day:** the polling unit.
  - **Flagship:** each programme has a scene.
- Deputies follow region: northern kaftan or hijab, isiagu in the SE/SS, a suit in the SW.
- Cabinet cards show a commissioner portrait for each minister.
- Kano (landscape) and Edo and Lagos (phone) runs: 0 console errors, no missing images.
- Not used: the governor, deputy, godfather and adviser mood variants. They show different people from the neutral portraits, so the face would change mid-game. Also not used: `opposition-candidate-alt` and `doctor-male`.
- Still open: the national coat of arms and real-organisation text in some images (see `public/art/README.md`).

## Tribunal fixes
- Each setup screen and each court stage now opens at the top. The election tribunal used to open at the scroll position of the long results page, which put it past its own content on a phone.
- The re-election tribunal stored the losing margin as a raw vote count, so it showed "796872 points" and always applied the worst odds. It now uses the percentage margin.

## Calmer Desk (proposal A + budget B1, chosen by Steve)
- **Status strip:** approval, treasury, party support and corruption, each with a coloured dot. It replaces the phone header and the big laptop header; tap it for the State sheet.
- **State sheet:** turn progress, treasury, debt and debt service, party support, GDP, corruption, the flagship's quarterly bonus, indicators, programmes in progress, and the adviser's full agenda (including "Fire adviser"). The flagship ribbon, the left-hand indicator and programme column, and the old dropdown all moved here.
- **Half-year checklist:** Budget, House vote, Policies, Review, Events, with the current step highlighted. "Ministries: to do" shows until a ministry is convened.
- **Adviser:** one line on the Desk when something is urgent, with its action button. The red Executive Command card and the adviser pop-ups are gone.
- **Budget:**
  - Stance cards for the Budget Office draft (or your current split), Balanced, Populist, Reformer and Godfather's budget. Each shows a People/Growth/Running costs bar and its number of warnings.
  - "Fine-tune the eight sectors" shows one-line − / + rows in place of the sliders.
  - "What's in the pot?" holds the IGR/FAAC, debt and Section 121 explanations.
- **Policies:** three tabs (Programmes, Bills, Executive orders), one type scale, and a single "Done: end the half-year" button. Programmes shows five at a time, flagship-serving ones first, with "Show all".
- **Tested:** a full two-term tenure each as Edo on a phone and Lagos on a laptop, with no console errors.

## Round of fixes (Steve's list)
- **Continue after the game ends:** a finished game now clears its save, and the title screen ignores any old save that holds a finished game.
- **Every art-pack image is now in use:**

  | Images | Where they appear |
  |---|---|
  | newspaper, ringing-phone, phone-message-frame | Media events, by medium: newspaper and blog stories show the paper, radio shows the ringing phone, social media shows a phone chat with the story in it |
  | special-adviser moods | The press secretary beside each media event, pleased, worried or angry depending on how the story lands |
  | news-front-page-blank | Each half-year's headline, set on the state paper's front page |
  | court-summons | National Industrial Court rulings and constitutional challenges |
  | memo-folder | Intelligence reports |
  | ballot-paper | Election results |
  | bank-transfer-slip | Naira and banking crises |
  | contract-envelope | Capital-project intake |
  | bill-document | The Bills tab |
  | wiki-share-card-blank | The end-of-tenure share card |
  | app-icon | Browser icon |
  | governor moods | The wedding host (pleased); the end screen for the isiagu governor (pleased, worried or angry) |
  | deputy moods | A south-western deputy, by loyalty (the north-central deputy now wears the suit and cap) |
  | godfather-worried | The party chairman when party stability is in the 40s |
  | doctor-male | The health flagship |
  | opposition-candidate-alt | The opposition smear |
- **Jobs and investment money:**
  - Investor taxes used to be added once and then overwritten by the next half-year's tax calculation, and investor jobs were added in the wrong unit and never read.
  - They are now kept as "jobs you brought in" and "their taxes each half-year".
  - The taxes go into IGR every half-year (60% under a tax holiday). The jobs lift approval by up to 2 points every half-year. Finished projects' jobs count too. Half of what a trip in person wins keeps paying.
  - Both show on the Economy screen ("Investment you brought in") and on the State sheet.
- **NIC appeal:** a new choice to appeal to the Court of Appeal.
  - Section 243 applies: leave is needed unless fundamental rights are at stake, and the court's decision is final.
  - Leave is refused in about 3 cases in 10, the appeal is dismissed in about 4 in 10, and it is won in about 3 in 10.
  - Win: the workers stay sacked, the unions are angry, and you pay ₦0.5B in fees.
  - Lose: you pay arrears, interest and costs.
- **Sound:**
  - Short Web Audio sounds: taps, good and bad results, the news sting, the gavel, end of half-year, and election win and loss.
  - Switch: "Sound" in the ☰ menu on phones and beside Save on laptops. It is remembered on the device.
- **Trips:**
  - Five new invitations: General Electric (Boston), the World Bank, the AfDB, the diaspora convention in Houston, and KOICA (Seoul).
  - Up to six invitations per game, from the second half-year.
  - You can go in person, or send your deputy (ceremonial, +2 party), the commissioner whose ministry fits (wins 40% of the in-person deal) or your Special Adviser (quiet follow-up).
- **Text size:** hero-sized text on laptops now stops at 64 (it used to grow past 100 for icons and titles like "VOTED OUT"), and module headings are smaller.
- **Smoothness:** overlays fade and slide in on laptops (the animation classes existed but were never defined), each Desk step slides up, and buttons and cards give a small press. Animations are off when the device asks for reduced motion.

## Firing, difficulty and the campaign screen
- **Firing was blocked by browser dialogs.**
  - Firing a commissioner, dismantling a ministry, terminating a contract, dissolving the Traditional Council, deposing a ruler and firing the adviser all asked "are you sure?" through the browser.
  - The claude.ai viewer switches those off and answers "no", so nothing happened.
  - They now use an in-game confirmation card (`SOP_confirm`), and alerts show as notices.
- **Fire adviser** is now on the adviser's card in People → Cast, as well as in the State sheet. The deputy's card explains that a deputy can only be removed by the House (Section 188).
- **Difficulty** now has a line under the picker. In the code:
  - **Easy:** approval drains 1 point per half-year; corruption and insecurity cost 30% less; opposition attacks are rare (18%); no godfather demands; only the Abuja trip; House bills only twice; bankruptcy below ₦1.5B; impeachment below 25% approval with party under 35%.
  - **Medium:** drain 2; opposition attacks 35%; bankruptcy below ₦2.2B; impeachment below 30%/40%.
  - **Hard:**
    - drain 3.2; corruption and insecurity cost 60% more; opposition attacks 55%; approval capped at 88%;
    - your campaign moves are weaker and the opponent's stronger, with bigger election-day swings;
    - the godfather and federal government can strike on their own;
    - bankruptcy below ₦3B; impeachment below 38%/48%.
- **Campaign screen (first election and re-election)**, rebuilt around a scoreboard:
  - the week strip;
  - you against the opponent with the statewide poll;
  - three zone tiles showing who leads and the last move's effect;
  - money, days, godfather debt and slogan as chips;
  - one line for the last move;
  - move cards with a one-line description and chips for cost, days, target zone, a strength meter, "Slogan +2" and "Risky".

## Setup gate and needs (Steve, 5 Oct)
- **Gate:** at the start of every half-year, the Desk shows "Set up your government" instead of the budget until both the Executive Council (ministries) and the Traditional Rulers Council are convened.
  - Each has a one-tap button. The ministries button calls the same default-cabinet code as the Ministries tab, now exposed as `SOP_REALISM.initMinistries`. The council button uses `SOP_REALISM.conveneCouncil`.
  - Each also has a link to set it up by hand.
- **Needs (`NEED_TYPES`):** real problems in a named LGA and senatorial zone, weighted towards the state's weakest indicators.
  - The eight types: collapsed road, deaths at the general hospital, schools without roofs, cholera and dry boreholes, highway kidnappings, lost harvests, no power, displaced families.
  - Two needs arrive once the government is set up, and new ones keep two or three open at a time.
- **Answering a need:** starting a matching programme or capital project marks it "Work under way" (the Policies tab tags and sorts these first with "Answers: …"). The security orders (State Army, closing the borders) count as answers until the courts strike them down, after which the need is open again.
- **Each new half-year, every active need is judged:**
  - **Finished** (the programme has run its course or the project is delivered): approval +(severity+2), the zone +5, and a Wikipedia line.
  - **Underfunded or halted:** if the sector is below its healthy budget, or the project is suspended or abandoned, the contractors go unpaid. Work stops, approval −2 and the zone −3. Two half-years like that and the site is abandoned: approval −(3×severity+1), the zone −8, and a ledger entry.
  - **Ignored past its deadline** (this half-year and the next): people die in the news, approval −(2×severity+1), the zone −6, and a ledger entry. The need returns as "Worse:" at a higher severity.
- **Zone mood** (`s.zoneMood`, capped at ±25) is added to each zone's support when the re-election campaign starts.
- **On screen:**
  - "What the state needs" cards on the Desk: tap a card for the cause, what answers it, its budget and what doing nothing will cost.
  - The adviser raises stalled work and needs at their deadline.
  - The budget warns when a split would leave active work unpaid.

## Personnel: reasons and consequences for firing
- **Adviser portraits:** each of the 16 advisers in `SA_ROSTER` now has their own portrait (`pic`). Every adviser image follows whoever holds the post: the speech bubble, the Desk line, the Cast card, the State sheet and the picker. Previously all of them showed the original female adviser.
- **Hidden traits:** every commissioner has a hidden competence and honesty, fixed by their name (`traits`). Each half-year their performance and corruption drift towards those traits, loyalty wanders, and up to two things happen across the cabinet:
  - **Contract fraud** (corruption above 55): approval −2, corruption +2%, and the adviser asks whether to fire or keep.
  - **Missed targets** (performance below 40): approval −1, and active work on a need in that ministry's sector stalls.
  - **Disloyalty** (loyalty below 35): a leaked memo, party −3.
  - **Delivered** (performance above 72): approval +1.
- **Keeping someone:** keeping a commissioner with fraud or disloyalty on record costs again every half-year ("Governor shields corrupt commissioner": approval −3, corruption +2%; or party −3).
- **Firing:** both Fire buttons (Cabinet and Ministries) go through `fireMinister`. The confirmation says why and what happens:
  - **Fraud on record:** approval +3, corruption −3%.
  - **Disloyalty on record:** party +2, but the commissioner's home zone −2.
  - **Weak record:** approval +1.
  - **Clean record:** approval −2, party −5, the home zone −3, and the ministry restarts at a lower performance.
  - **Godfather-imposed commissioners:** these keep the existing godfather retaliation.
- **The adviser** has a record too: an occasional leaked memo (approval −1) or a good call. Firing with a leak on record gives approval +1; firing a clean adviser gives approval −2 and a tell-all column.
- **New commissioners** get a half-year to settle in: a weak record does not count against them until then.
- **Records** show on the Cabinet cards, the Ministries tab and the adviser's Cast card.

## Campaigns: the opponent fights back
- **Their move lands first (`oppStrike`):** each week, straight after your move, the opponent's attack hits the polls in the zone it targets, before you answer. The four attacks in each election (credentials, rally, smear, endorsement; failure report, viral rally, corruption story, endorsement) each have their own target and strength.
- **Scaling:** ×0.7 on easy, ×1.1 on medium, ×1.5 on hard. They hit harder when you lead (+1 above 50%, +3 above 54%).
- **On screen:** a red banner ("…'s rally cost you 5 points in Central. Answer it or it sticks.") and "▼ −5 Their rally" on the zone card. "How the zones moved" lists their moves alongside yours.
- **Your answer** wins back some or all of the ground; ignoring it leaves the damage and adds more.
- **Election day:** the hidden drag on the first election shrank (medium: support −1 and opponent +1, down from −2 and +3) so the final poll is a fair guide. The fight is now in the campaign itself.
- **Test:** a first-option autopilot in Kano on medium won by 0.5%, down from a comfortable win.

## Neglect costs every half-year
- **Waiting needs:** every open, unanswered need costs approval −1 and its zone −2 each half-year ("Still waiting: …"), as well as the bigger cost at the deadline.
- **Wikipedia:** ignored needs and abandoned sites now go under Controversies.
- **Idle half-years:** a half-year with no new programme or project costs approval −3 and −2 in every zone, and adds a Controversies line ("government on autopilot"). The last half-year with new work is tracked by `lastActTurn`.

## Statecraft: the pressures of office
Eight systems, built in `game/seat-of-power.jsx`. The data sits after `OFFENCE` (`STATE_CRISES`, `PROMISE_TEXT`, `streetVoices`, `reportTitle`); the engine sits after the needs review (`stc` state, `statecraftTurn`, `successionOutcome`). It runs once a half-year when the events are built, and its decisions arrive as `sc` cards rendered by `DecisionCard`. `stc` is saved with the game.
- **Salaries and FAAC:** each half-year's allocation lands at 70–108% of budget depending on difficulty. When it is short, choose:
  - borrow the shortfall;
  - pay salaries but hold contractors, which stalls every started need;
  - owe workers 2–3 months.

  An underfunded salary line (below 12%) adds a month on its own. Arrears cost every half-year:
  - 1–2 months: approval −1.
  - 3–4 months: NLC ultimatum, approval −3, Wikipedia.
  - 5 months or more: general strike, approval −5, health and education −2%, health and education work stalls, Wikipedia.

  You can clear the arrears at any time with borrowed money.
- **Promises:** three per term, one per senatorial zone, each tied to a sector. A promise is kept when a need in that sector and zone is met, or when the sector stat rises 6 points: approval +2, zone +3, Wikipedia. Promises are judged at the re-election and at the end. Each broken one costs approval −2, zone −4 and a Controversies entry. At the re-election the opponent's "4 Years of Failure" attack hits 2 points harder per broken promise.
- **Cabinet balance:** a commissioner's home zone comes from their name (`zoneOfName`). A gap of 3 or more costs the short zone 2 points every half-year, and a Wikipedia line the first time. Fired commissioners are replaced from the least-represented zone. The Cabinet tab shows the balance and each commissioner's zone.
- **House of Assembly:** 24, 30 or 40 seats by population. Loyalty drifts with party, approval, arrears and corruption. Losing the majority brings a card: constituency projects, sharing appointments, or appealing to the people. Two-thirds against you (with approval below 60) starts the existing impeachment; surviving it wins members back.
- **State crises:** 14 templates keyed to each state's own issues (oil spills, illegal refineries, bandit "taxes", school abductions, insurgent attacks, farmer–herder violence, floods, sit-at-home, almajiri, waterfront demolitions, cult clashes, gully erosion, lead mining, land wars). After the first half-year, one arrives 70% of the time (45% on easy), none repeating. Several options are gambles.
- **The street:** a Desk panel with a trending hashtag, up to three voices (some in Pidgin) built from arrears, failed and met needs, corruption, House defections and cabinet imbalance, plus chips for salaries, the House, the cabinet and promises.
- **Succession:** in the last year, anoint your deputy, your best commissioner, your political son, or let the party decide. Each has a loyalty and an electability. At the end the successor wins or loses (approval and party), and a winner may betray you (more likely when corruption is high). EFCC exposure moves by −12 points with a loyal successor and +12 after a betrayal (+8 after an opposition win). The Wikipedia "Succeeded by" field follows.
- **Report card:** the end screen shows a title ("The Builder", "Mr Autopilot", "Promise Keeper", "The Governor Who Owed Salaries"…), needs answered and ignored, promises, salary arrears, debt, corruption and the House. The title is added to the share text.

## No overlapping scenarios, less text
- **One story per topic:** crises, needs, background events, dilemmas, bills and shocks carry topics (`CRISIS_TOPIC`, `NEED_TOPIC`, `passiveTopics`). No topic repeats within two half-years.
  - A state crisis waits if an active need, a recent background event or a passed bill already tells its story.
  - Background bandit, pipeline, flood and cult events wait the same way.
  - The cholera background event and dilemma stay away while a water or clinic need is open.
- **Removed duplicates:**
  - Dilemmas replaced by the new systems: Salary Strike, Herder–Farmer, Floods, Schoolchildren Kidnapped and Oil Spill (which could hit Kano).
  - The random NLC strike and the old −8 salary penalty; arrears now drive strikes.
  - The federal "FAAC cut" event. The FAAC card follows the oil-price swing, so it never contradicts an "oil rally" headline.
  - The national flood and terror shocks in states with their own flood or insurgency crises.
  - The almajiri, grazing and anti-cult bills once the matching crisis has happened, and the reverse.
- **House summons retired:** the politics engine's "THE HOUSE ASKS QUESTIONS" card no longer appears. The House is handled by defections and impeachment.
- **Civic review:** no longer pops up over the end-of-half-year screen. It opens from a "Full half-year review" button there.
- **Less text:** a `More` component shows the first sentence of long texts with a "More ▾" toggle. It is used on decision cards, outcome narratives and the court, shock, federal, media, investor and House-bill descriptions.
- **Cabinet zones:** the first cabinet is balanced across the three zones. When you fire someone you choose the replacement: a loyalist from your home zone (loyalty 80, may upset the balance) or someone from the short-changed zone, which restores it. `SOP_confirm` takes an optional third argument for the "no" label.

## Fewer moments, one promise list, LG politics, a living godfather, a guided start, the successor's race
- **Event cap (`capQueue`):** at most 4 decisions a half-year (3 on easy, 5 on hard, 2 in the first half-year), ranked by urgency.
  - Courts, NIC rulings, succession and the House always go through. Then FAAC, the flagship, LG and godfather stories, state crises, shocks, the godfather, dilemmas, federal events, trips, bills, investors, media, module cards and invitations.
  - Whatever doesn't fit is logged as handled by your chief of staff. A dropped state crisis or one-off story goes back into the pool.
  - Statecraft cards are queued as `sc#<key>`.
- **One promise list:** the Desk's "Your promises" shows the flagship (yearly targets met), the slogan promise (last yearly check) and this term's three zone promises, each marked Kept, Behind, Broken or Open.
- **Council elections (half-year 2):**
  - Free and fair: approval +3, and the opposition takes councils in zones that lean against you (party −2 and zone −3 each).
  - Rigged sweep: approval −3, corruption +3%, party +4, Wikipedia Controversies.
  - Caretaker committees: approval −2, party +3, Controversies.
- **LG autonomy (from half-year 3):** Abuja enforces the 2024 Supreme Court judgment.
  - Comply: FAAC −8%, approval +2, corruption −2%. Caretaker committees must give way to elections.
  - Make the chairmen remit the money: corruption +4%. Opposition-run councils go to the press, and it is logged in the ledger.
  - Go to court: a 1 in 4 chance, legal costs.
- **A living godfather (`stc.gf`):**
  - **Rise:** nominated as a federal minister when your relationship is 60 or more. Lobby, stay out, or brief against him, with a 40% chance he finds out and becomes an enemy.
  - **Fall-out:** when the relationship drops to 30 or below. Settle for ₦1B, expose his contracts (approval +3, 3 House members lost), or poach his ward leaders.
  - **Defection:** once he is an enemy. He joins the opposition with 3 members, and his demands stop. At the re-election the opposition's endorsement attack hits harder, with him on their platform.
  - **Death:** 15% a half-year from half-year 5. Inherit his network, back his son as the new godfather, or let it scatter.
- **Guided first half-year:** an adviser checklist on the Desk ticks itself off: set up the government, pass the budget, answer one need, end the half-year. It has a "Skip guide" button. In the first half-year there is no FAAC shortfall and at most 2 decisions.
- **Successor's race (`succession_race`):** after the last half-year, a three-round race against an opposition candidate.
  - The starting poll comes from the successor's electability, your approval and party, broken promises, arrears and a defected godfather.
  - Each round opens with an attack on your record. You then campaign side by side (helps only if you are popular), bankroll the campaign (debt and corruption), deliver the party machine, commission projects (helps only with finished work to show), or stay out (they will owe you less).
  - The result feeds the succession outcome: betrayal odds and EFCC exposure.

## Fixes: firing and tribunal loans
- **Firing did nothing.** In `fireMinister`, a local `const homeZone` (the sacked commissioner's zone) shadowed the governor's `homeZone`, which is used earlier in the function to choose the replacement. That threw a "before initialization" error after the first confirmation. The local is now `firedZone` (the commissioner's own zone). Tested from both the Cabinet and Ministries tabs.
- **Godfather loans for tribunals:**
  - **First-election tribunal:** the loan called `makeGfEducationMandate` and `addGfMandate`, which only exist inside the campaign screen, so clicking it threw. Both are now defined in the tribunal step. The loan shows whenever the war chest is below ₦3.5B, the cost of the top legal team (it was below ₦1.2B), up to ₦6B of debt. A second loan asks for contracts instead of another commissioner.
  - **Re-election tribunal:** the loan read `gfDebt` and `setGfDebt`, which don't exist in the game screen, so it crashed when funds fell below ₦2B. It now uses `campGfDebt`, shows below ₦3.5B, and is refused if the godfather is dead or has joined the opposition. Legal teams you can't afford are blocked with a message instead of being bought on credit.
- **Check:** ESLint `no-undef` over the game and modules finds nothing undefined apart from the globals `TS`, `ReactDOM` and `File`.

## Raising money without borrowing
A collapsible Desk panel, "💰 Raise money without borrowing" (`REVENUE_MEASURES`, `adoptRevenue`), offers nine reforms. You can adopt up to two a half-year, and each one only once. Payoffs follow a schedule (`stc.revSched`, applied in `statecraftTurn`) through three new state fields:
- `s.revIGR`: new revenue or savings each half-year.
- `s.taxEff`: a multiplier on taxes collected from the economy.
- `s.debt`: one-off repayments.

The IGR formula is now `max(1.5, computed × taxEff) + invIGR + revIGR`.

| Reform | Gain | Price |
|---|---|---|
| Autonomous digital revenue service | Taxes collected +10% a half-year for 3 half-years | IGR −0.4 now, party −2 |
| Biometric payroll audit | Saves 3–8% of the wage bill, more where corruption is high | Approval −1, corruption −2%; 30% risk of wrongful removals |
| Treasury Single Account | One-off of 10% of FAAC plus a corruption bonus against debt | Party −2, corruption −3% |
| Digital land registry and C of O drive | +1.5 a half-year within two half-years | −0.5 now; approval +1 |
| One market levy, no touts | +0.6 | Approval +2, party −3; 25% risk of a clash |
| Land Use Charge | +0.5, or +1.2 with the land registry | Approval −2 |
| Federal road refunds and fiscal-transparency grants | ₦2B against debt next half-year | Needs corruption under 45%; approval +1 |
| Cut the security vote and political aides | +0.7 | Party −4, approval +2 |
| Concession dead state assets | ₦1.2B against debt, then +0.3 | Approval −1; 30% risk of an insider deal |

The FAAC card points to the panel when reforms remain.

## Debt renegotiation and petitions against you
- **Debt** (in the Desk's "💰 Money: raise revenue, manage debt" panel): shows the debt, repayments a half-year and their share of income. Three actions, each once per term:
  - **Ask Abuja to write off 80%** (needs debt of ₦6B or more): odds of 15% + (FG relation − 50)/150 + 10% if corruption is under 40% + 15% with 3 or more revenue reforms, capped between 5% and 70%. Success: debt × 0.2, approval +3, FG relation −10 (a debt of loyalty) and a Wikipedia line. Refusal: approval −1, FG relation −5.
  - **Push repayments to the next administration:** 60% of the debt leaves the books (`stc.defDebt`). In the first term it returns at half-year 5 if you are re-elected. In the second term your successor inherits it: a Controversies entry, and the report card counts it as debt left behind.
  - **Promissory notes at a discount:** debt −12%, every started site stalls, party −2.
- **Petitions:** a win under 5% (always under 2%, 70% chance otherwise) is challenged.
  - First election: filed in half-year 1, from `setup.election.marginPct`. Re-election: filed in half-year 5, from `stc.reMargin`, stored when you take the second-term oath.
  - The Tribunal, Court of Appeal and Supreme Court are heard in successive half-years as `sc#petition` cards that always pass the event cap.
  - Risk = 12% + margin (+15% under 2%, +8% under 3.5%) + (corruption − 35%) × 0.9 + 10% above 55% corruption + 3% with godfather campaign debt.
  - Your defence: Senior Advocates (−12%, debt +₦0.8B), the facts (−5% if the margin is 3% or more), or settling the panel (−20%, corruption +8%, 30% chance it leaks).
  - Losing a lower court costs approval −3 and you appeal. Winning at the Tribunal with a 4% margin or more makes the petitioner quit half the time.
  - Losing at the Supreme Court ends the game as `gEnd: "nullified"` ("ELECTION NULLIFIED"). The petitioner is sworn in, EFCC exposure rises, and the Wikipedia article, share text and report-card title ("Removed by the Supreme Court") reflect it.

## Expansion art (33 images)
The files are in `public/art/{characters,backgrounds,objects}`, and every one is used:
- **Advisers:**
  - Terkuma: `adviser-north-male` (was a governor's portrait).
  - Fatima: `adviser-north-female`.
  - Uche: `adviser-southeast-male`.
  - Bola: `adviser-southwest-female`; Prof. Bola Adekunle is now a woman.
- **Opponents:** `oppArt()` gives a woman candidate `opposition-candidate-female` on the campaign board, in their moves, in the successor's race and in the cast (`castArt`).
- **Courts:** both tribunal screens show the courtroom, or the Supreme Court at stage 3. They show `petition-file` until a ground is pleaded, then the `senior-advocate`. Petition cards use the petition file at the Tribunal, the Senior Advocate at Appeal, and `supreme-court-abuja` with the Senior Advocate at the final stage.
- **Statecraft cards:**
  - FAAC day: `state-secretariat` with the `civil-servant`, or `salary-slip` when salaries are owed.
  - Council elections: `polling-unit` with the `electoral-commissioner`.
  - LG autonomy: `supreme-court-abuja` with the `lg-chairman`.
  - Godfather's death: `burial-ceremony` with the `godfather-son`.
- **Crises:**
  - Oil spill: `oil-creek-spill`.
  - Illegal refinery: `illegal-refinery-night`.
  - Bandit "tax": the `vigilante-guard`.
  - Insurgent attack: `idp-camp`.
  - Farmer–herder: `northern-farmland`.
  - Sit-at-home: `shuttered-market`.
  - Demolition: `waterfront-settlement`.
  - Gully erosion: `gully-erosion` with the `contractor`.
  - Lead mining: `artisanal-gold-pits`.
- **The street:** each voice has a face (`voiceArt`): `okada-rider`, `mechanic`, `civil-servant`, nurse, trader, student, elder, reporter.
- **Money panel:** the `revenue-officer` heads it. Three reforms show `pos-terminal`, `fingerprint-scanner` and `certificate-of-occupancy`, and the promissory-notes row shows `promissory-note`. The successor's race result shows the `ballot-box`.

## Politician profile (title screen)
- The original title screen is kept. A small chip at the top left ("Your politician", or "Hon. <Last>" with a portrait) opens:
  - **With no profile:** the profile form (`ProfileForm`), with portrait, first and last name, state of origin and party leaning. It is saved on the device as `sop_profile` (`loadProfile` / `saveProfile`).
  - **With a profile:** a sheet with the politician, an Edit button and the **Hall of Governors**.
- **New game** passes the profile to `SetupScreen`, which pre-fills the name and portrait, the state (if an origin is set) and the party (if the leaning is a main party). Everything can still be changed.
- **Hall of Governors:** when a game ends (`gEnd`), the career is added to the profile's `games` (last 30): name, portrait, state, party, report-card title, grade and ending.
- Accounts (cloud saves, a public Hall) need a server and are not built. The sheet says they are on the way.

## The compound (landscape hub map)
- **Desk → Compound** is the default view (`CompoundHub` in `game/seat-of-power.jsx`).
  - **The map** is Lovable's painted image, `public/art/compound/compound-full.webp` (1500×850), with every building in place. All points in the code are in its pixels. At night (while the half-year is being reviewed) it is dimmed and tinted in CSS.
  - **Buildings:** `HUB_BUILDINGS` holds each building's box. A transparent click area covers it, lights up on hover, and glows when the building needs you. Tapping opens the building at once; the motorcade was removed at the player's request.
  - **Overlays** sit at fixed map points: a protest by the State Secretariat, the press at the High Court or the Assembly, and a cheering crowd at the Party Secretariat.
  - **Phones:** a two-column list sits under the map.

## Results you can see
- **Result cards.** `SOP_outcome` in `public/seat-of-power.html` shows a dark card with an icon, a title, one line, and chips for what changed; cards queue. In `GovScreen`:
  - `decide(fn)` notes Approval, Treasury, Party, Corruption, Debt and the war chest, runs the decision, then shows the card with the real changes.
  - `announce(o, before)` does the same for async flows.
  - Wired into: statecraft cards (a card's `run()` may return its own result, as the election-petition rulings do), flagship choices, tribunal stages 1–3, judicial reviews, revenue reforms, debt relief / deferral / notes, firing, programmes, bills, executive orders, ministries, commissioner meetings, financing and project delivery.
- The floating change readout was removed at the player's request; result cards carry the changes, including security, health, education, infrastructure, agriculture and own revenue, and fall back to "effects over the coming half-years" when nothing moves at once.

## Paying for projects
- After a capital project's intake, or a new project in Map → Projects, a **Financing** sheet (`finOptions` / `pickFinance`) offers seven sources. Each shows its odds and its reasons (✗ blockers first):
  - **Treasury cash:** needs surplus; takes revenue for two half-years.
  - **Bank syndicate:** odds fall with debt service over revenue; +30% interest.
  - **State bond:** needs IGR ₦3B+, a rating and a friendly House; +15%.
  - **AfDB / World Bank:** needs the federal guarantee, low corruption and an EIA; +5%.
  - **Federal fund:** TETFund, BHCPF, Ecological Fund or REA; covers half.
  - **PPP:** no debt, approval −2.
  - **Contractor pre-financing:** always available; +35% and corruption +3%.
- A decline names its reasons and that source is closed for the project. Approval sets `project.fin.share`, which `applyProcurement` (`sop-realism.js`) uses to put the contract on debt.

## Projects you create
- **Map → Projects → New project:** choose the need it answers (or none), name, type, cost, ministry and EIA, then find the money and pick a contractor.
- A project answers its chosen need, or any open need of the same kind (`PROJ_NEED`).
- On delivery (`projDelivered`) it raises its sector (`PROJ_STAT`), scaled by size and by how much money reached the site.
- Fix: the contractor screen was called as a plain function inside the Projects panel (React hook-order crash #310); it is now a component.

## Ministries and commissioners
- **People → Cabinet → New ministry:** `MINISTRY_CATALOGUE` has 11 ministries:
  - Sports & Youth (unlocks stadiums), Commerce, Tourism, Environment, Water, Housing, Transport, Digital, Power, Humanitarian, Lands.
  - Each has a sector key and a setup cost. A hostile House may refuse the money.
- **Choosing the commissioner:** three candidates (a technocrat, a party loyalist, a former permanent secretary). Each shows their reputation for ability, integrity and loyalty: the hidden truth plus noise.
- **Meetings:** once a half-year each commissioner can be met:
  - demand results (performance up, loyalty down);
  - audit their books (catches graft and gives grounds to fire);
  - back them with ₦0.5B.
- **Sector effects:** every half-year each ministry moves its sector by its commissioner's performance, discounted by corruption.

## Wiki
- The article now includes every `wikiEvents` entry the game writes. Before, they were collected but never shown.
  - Entries are told year by year under themed headings: projects, economy, cabinet, security, and courts and elections.
  - Controversies also come from the record.
- A **Record in numbers** section covers projects, needs, debt, revenue, ministries, laws, approval and corruption.

## Programmes, bills and orders
- **Executive orders:** 12 lawful orders (`ORDERS`), once per term each. Some carry a backlash risk; some answer a need (a curfew answers security). The unconstitutional orders remain under "Beyond your powers".
- **Bills:** 7 new ones, including anti-open grazing, VAPP, procurement, FOI, child rights, contributory pension and tenancy.
- **Programmes:** 4 new ones (cash transfers, medical outreach, 5,000 teachers, youth skills). Every programme card shows its effects and jobs.
- **Effect labels:** chips use plain names (`fxChip`).

## Less reading, less scrolling
- On the Govern page:
  - "Your promises" collapses to a one-line tally;
  - the street shows one voice;
  - needs show the most urgent one with "All N ▼".
- Shorter project intake, and filler lines removed from dilemmas and judicial reviews.

## Hard-mode elections
- Before this change Hard was effectively unwinnable. A simplified simulation of the scoring (`scratchpad/elsim.mjs` in the dev session) won about 0.3% of elections even with strong play.
- New Hard settings, in both campaigns:
  - your moves lose 2 points instead of 3;
  - the opponent gains +1 a round instead of +3 (the same as Medium);
  - their strikes hit at ×1.3 instead of ×1.5;
  - negative campaigning backfires 65% of the time instead of 75%;
  - the election-day handicap is smaller.
- Hard stays clearly harder than Medium, but strong campaigns win.

## Half-year report and honours
- When a new half-year's budget opens, a result card shows how the last half-year went:
  - the headline numbers, plus any sector that moved 3% or more;
  - up to three things that happened;
  - any honour earned.
- `HONOURS` lists 12 milestones: first ribbon, master builder, the listener, clean hands, people's governor, fiscal hawk, revenue reformer, lawmaker, survivor, vindicated, second term and unifier.
- Honours are kept in `stc.honours`, written to the wiki (infobox and record), and saved with the career in the Hall of Governors.

## Road to Aso Rock (presidential run, release 1)
- `AsoRock` in `game/seat-of-power.jsx` replaces the old one-screen `PresRace`.
- **Two ways in:**
  - a governor's "Run for President" carries their record in (approval, corruption, party, honours, war chest);
  - the presidency is earned: there is no fresh start from the title screen. The title shows **Continue: Road to Aso Rock** only while a run is saved.
- **Stages:**
  1. The party primary: three moves for delegates across six zones against two named rivals, then the convention, with a second ballot if needed. If you lose, you can take a smaller party's ticket or accept the result.
  2. A running mate: balanced, loyal, or a technocrat; or the rival you promised the slot to.
  3. Six campaign weeks. Each week you make a move (rallies, zonal pledges, the debate, endorsements across the divide, polling agents, "logistics" cash), and the opponent strikes back. Some strikes can be answered.
  4. Election night under the constitutional rule: the most votes **and** 25% in 24 of the 36 states, or a runoff. A narrow loss can be petitioned.
- **Afterwards:** the result goes to the Hall of Governors (title and "President" honour) and the leaderboard.
- **Saving:** the run saves at every step (`sop_pres`), and the title screen offers to continue it.
- **Balance:** modelled with `scratchpad/pressim.mjs` in the dev session. An equal-strength party wins about 46% of runs, a weaker one about 16%, a stronger one about 77%, before record and choices.
- **Vatar edition:** the run is the one-off product `presidential_run`. Elsewhere it is free.

## Onboarding
- **Quick start** (setup step 1): fills in a recommended first campaign and jumps to the ticket. It picks a Medium state (the calmest in the region), a promise that fits the state, the party strongest there, "Building X Together" and the party's deputy. Back changes anything. Each setup step also marks its recommended pick.
- **The party ticket is charged once**, even when the player goes Back and chooses again.
- **First campaign** (no finished careers and no `sop_played`): party veterans add about 2 points on election day (not on Hard). A loss shows one tip: the weakest district and what to change.
- **The arrival:** Government House shows the governor's portrait, the new title and the votes and margin that won it.
- **End of the first half-year:** "Your first half-year" sums up what was done and sets one next goal.
- **The one thing to do next:** the hub's next building pulses, and the first-half-year guide has **Show me**, which scrolls to the task and flashes it. Both respect reduced motion.

## The Governor's mailbox and the Chief of Staff
- **Rules:** `game/systems/chief.js`, tested in `tests/chief.test.mjs`.
- **Browser test:** `tests/e2e/mail.mjs` (`npm run e2e:mail`).
- **The Chief of Staff:** picked on arrival from four fictional candidates; each is better at some kinds of letter and worse at others. They can be fired; the loyal ones cost party stability on the way out.
- **Letters:**
  - The year's matters arrive as letters after the year closes, and the tray must be clear before the next year.
  - The next budget is a letter, from Budget & Economic Planning (a new ministry in the catalogue) or, without one, from Finance with padding.
  - The goldfields beat is a letter, not a pop-up. So are stalled projects and the tourism notice.
  - The Desk tab shows the count; a note pops up when mail lands.
- **Handing a letter over:** the Chief of Staff warns first (safe, risky, needs you), and you can insist anyway.
  - The outcome depends on their competence, their fit for that kind of letter, the stakes and their experience.
  - A botched serious letter returns as fallout next year.
  - Greed can add corruption.
  - A stalled project handed over is finished at a premium, or half the money is lost.
- **Delayed effects fixed:** delayed effects (programme payoffs and fallout) were stored but never applied. They now land at the start of the year they are due.
- **New project types:** an esports arena and a tourist attraction.
  - Stadiums and esports arenas cannot start without a Sports ministry.
  - A finished tourist site earns nothing until a Tourism ministry exists. It earns once that ministry is created.

## The overhaul: home, brevity, bills, letters, front pages, anchors, three tabs
- **Home screen:** the logo, the cast, New game and Continue. A ☰ menu holds:
  - your politician;
  - this week's challenge, with a NEW dot until opened;
  - scenarios;
  - the Hall of Governors (this week and all time, by Lagos Life username);
  - how to play;
  - sound.
- **First-election petition:**
  - Every ruling pops up with the court (tribunal, appeal, Supreme Court).
  - A legal team you cannot afford says so instead of failing silently.
- **Brevity:** `tests/e2e/words.mjs` counts the words on decision screens over two years, same seed.
  - Before: 3,574 words on 49 screens (73 a screen).
  - After: about 1,850 words on about 50 screens (35 a screen, −52%). The total is −48%, because the new letters and front pages add screens.
  - Each card shows one sentence; the rest sits behind "🤵 Ask your SA".
  - Option notes give way to chips. Pop-up results keep two short sentences, or one when they show numbers, and at most four rows.
- **Bills:** a short card with 2–3 clauses.
  - Tap ⚑ to flag a clause, then Sign or Veto.
  - Sign: the pen writes the governor's name across the page.
  - Veto: a red VETO stamp lands on the page, then the House reacts with the Speaker's face.
  - Flagging the hidden clause before vetoing wins the press.
  - "Ask your SA" holds the constitution and what each choice costs.
- **The adviser in person:** urgent mail brings her on screen, full-size and posed, with a speech bubble.
- **Letters:** five lines. A seal, "Dear Governor,", one sentence from the matter itself, and "Sincerely," with the sender's face and name.
- **Front pages with your name:**
  - **Trips:** the governor in person ("Gov. X Shines in Boston"), or the envoy who went ("Commissioner Y Represents Ogun…").
  - **Visits:** Aso Rock, the Netherlands MOU, the society wedding.
  - **Bills:** a bill signed into law.
  - **Projects:** a project opening.
  - **Flagship:** the yearly target delivered or missed.
- **News anchors:** a two-line segment for:
  - re-election;
  - an investor deal;
  - surviving impeachment;
  - every ending (voted out, impeached, nullified, bankrupt, two terms complete).
- **Three tabs:**
  - **Desk:** Compound · Today · News.
  - **State:** Money · Projects · Contracts.
  - **People:** Cast · Cabinet (with the civil service) · Ministries · Council · Public (personas and stakeholders).
  - **The ☰ menu:** Wiki, Constitution, Standing, Save, Help, Text size, Sound, Fullscreen and Second Chance.
- **No real organisations:** the trip invitations no longer name real institutions or companies (Harvard, MIT, General Electric, the World Bank, the African Development Bank, KOICA, the UN, the Abu Dhabi fund). Fictional ones replace them.

## Master brief (living state) — what is built
Rules live in `game/systems/` (no screen code; `window.SOP_SYS` in the game). Unit tests: `npm test`. Browser playthroughs: `npm run build:game && npm run e2e`.

| Area | Where | Notes |
|---|---|---|
| Tagline, title group | `TitleLineup` | Figures placed by measured eye line and face size |
| Godfather loans | `systems/money.js` | Accepted offers only, keyed, ₦M integers; favours separate; save v3 cleans ghost amounts |
| Chosen adviser | `systems/advisers.js` | Four outlooks, each with a blind spot and a small yearly effect |
| Years and agenda | `systems/agenda.js` | Year 1–4, 5–8; 6 major actions a year (7 Easy, 5 Hard); once-only year end |
| Secretariat, cases, commitments | `systems/cases.js`, `SecretariatView` | Hidden truth, seeded evidence, staged decisions, acting officials |
| Deputy | `systems/deputy.js` | Four kinds, districts (real ones for Edo), party negotiation |
| Projects, contractors, loans, proposals | `systems/projects.js`, `loans.js`, `proposals.js`, `ProjectsView` | ₦M records; phasing vs shortfall; capability-based bidders; offer letters |
| Restructuring | `systems/ministries.js` | Merge, split, move an area, task force, with explicit transfers |
| Goldfields crisis | `systems/deposits.js`, `GoldView` | Year 1 discovery, Year 2 escalation, staged outcomes, successor epilogue, Year 8 verdict |
| Voice | `systems/voice.js`, `VoiceBar`, `docs/VOICE.md` | Device speech prototype on the case meeting; YarnGPT unverified, not configured |

**Balancing assumptions:**
- An agenda of 6 major actions a year.
- Unit costs in `UNIT`, which are simulation values, not tender prices.
- Sector capital room = budget share × revenue × 0.35.
- Goldfields: in 2,000 simulated games per approach, a first-term resolution happened 0 times. Excellent play resolved the crisis by Year 8 about 49% of the time, random play 0.05%, and poor play almost always left it entrenched. "One in a million" is a design target set by a seeded outside-conditions roll (`fortune`), not a measured rate.

**Known limits:**
- Older stats (`s.debt`, `s.igr`) are still decimal ₦B. They meet the new ₦M records only through `toM`/`toB`.
- A campaign loan that an old save had already folded into state debt can't be separated out.
- Only Edo has real senatorial districts; other states group their LGAs automatically.
- Projects from old saves keep the old procurement model.

## Careers: the Senator (release 1)
**Where it lives:** rules in `game/systems/senate.js`; the screen is `SenateCareer` in `game/seat-of-power.jsx`.

**Two ways in**
- **Story:** a finished governor's **Run for Senate** carries the record in. Approval becomes support at home, the score becomes standing in Abuja, and corruption and the campaign fund carry over. This replaces the old one-roll `SenateRace`.
- **Free play:** title menu → **Careers** → Senator. The player picks a background: former governor, popular activist, or the godfather's candidate.

**The term**
- **The race:** four weeks of moves in the home senatorial district.
- **The Senate President election:** the player backs a candidate. Backing the winner brings a committee chair.
- **Eight sessions** over four years. Each session has:
  - two bills (the Appropriation Bill every second session). Votes are yes, no, or **yes for a federal project in my district**, which needs standing;
  - a ministerial oversight hearing, or the **₦1B constituency fund** (deliver it, or "manage" what is left);
  - an event (defection offer, lobbyist, bandits at home, budget padding, the lecturers' strike, the godfather, ministerial screening);
  - once a year, the player's own bill.
- **Vetoes:** the President can veto a bill that passes. The player can lead an override, which needs 73 of 109.
- **Fade between sessions:** support at home −7, standing −3.
- **Recall:** a district below 20% support can recall its senator.
- **Re-election:** the party may deny the ticket to a disloyal senator, unless they defected.

**Grade:** home 35%, standing 20%, legacy (things built, federal projects won, laws passed) 25%, clean hands 20%.

**Teaching:** every bill, hearing and event has a **How it really works** note from the Constitution or the law. It shows in the result card (`learn` on `SOP_outcome`) and is kept in the **Senate notebook** (`sop_notebook`, 29 notes).

**Records:** a term is recorded in `sop_career` with `office: "senator"`. The map and badges count governorships only.

**Vatar:** the first year is free. After that comes `career_senator` (one-off, ₦1,000).

**Art:** it uses existing scenes until Lovable's Senator pack arrives (`docs/LOVABLE-NEXT.md`).

**Balance** (2,000 simulated terms per case):
- **Random play:** mostly B and C, with about 9% A.
- **The race:** thoughtful play wins 93–100% depending on the background; random play wins 40–76%.

**Test:** `tests/e2e/senate.mjs`.

## Careers: the LGA Chairman (release 1)
**Where it lives:** rules in `game/systems/lga.js`; the screen is `ChairmanCareer`. It is first on the Careers list, in ladder order.

**Start:** in the player's own home LGA (from their profile). The player picks how they got the ticket: the governor's choice, the people's favourite, or the wealthy returnee.

**Six half-years.** Each one opens with **the allocation** coming down through the state, where the governor's deduction depends on his favour and salaries come off first. The chairman then:
- accepts it;
- protests to the governor in person;
- or goes to court citing the 2024 Supreme Court ruling.

Then come problems with faces:
- a health centre with no nurse;
- a washed-out market road;
- a market fire;
- a land dispute between villages;
- birth registration;
- refuse;
- unpaid teachers.

Alternating with them: **the council chamber** (councillors' "allowances", an okada bye-law, a market levy, impeachment whispers) and **the governor's requests** (a crowd for his rally, council land for a friend, a drainage contract for his man).

**Endings**
- A governor defied too far can **dissolve the council**.
- A council ignored can **impeach** the chairman (two-thirds).
- Otherwise, **the council election**, run by the state's own electoral commission. The governor's favour decides the ticket.

**Grade:** the people 40%, problems fixed 30%, clean hands 20%, the purse 10%.

**Teaching:** 15 notes in the chairman's pages of the notebook, from the First and Fourth Schedules, Sections 7 and 162(6), the 2024 Supreme Court ruling, SIECs, caretaker committees, impeachment by councillors, levies, bye-laws, the Land Use Act and more.

**Ladder:** a re-elected chairman can **Run for Governor**, which opens a new governorship with their profile.

**Records:** saved in `sop_career` with `office: "chairman"`.

**Vatar:** the first year is free, then `career_chairman` (one-off, ₦500).

**Art:** all 15 pictures in Lovable's LGA pack plus `badge-chairman`, enforced by `tests/art-usage.test.mjs`.

**Balance** (2,000 simulated terms per background):
- **Sensible play:** wins 80–100%, mostly A and B.
- **Random play:** mostly loses. Fighting the governor every half-year gets the council dissolved.

**Test:** `tests/e2e/chairman.mjs`.

## Careers: the Ambassador (release 1)
**Where it lives:** rules in `game/systems/ambassador.js`; the screen is `AmbassadorCareer`.

**The countries are invented:** the Republic of Valdoria, the Kingdom of Ostrava, the Federation of Meridia. There are no real flags or nations.

**Start:** the player picks a posting and a background: career diplomat, political appointee, or diaspora champion. The posting opens with presenting the letter of credence.

**Six half-years.** Each one brings:
- **a cable from Abuja:** win their UN vote, sign the trade deal by Friday, deny the visa story, ask for a loan, the President's state visit, a budget cut;
- **a Nigerian in trouble:** held without charge, unpaid scholarship students, traders' goods seized, the passport queue, riots needing an evacuation, a death-row plea;
- **a host or community matter:** the host minister's visa threat, a trade fair, a diaspora town hall, the Independence Day reception, an investor, a Super Eagles match.

**Endings**
- **Recall** if Abuja loses confidence.
- **Expulsion** (persona non grata) if the host does.
- Otherwise Abuja's verdict: **posting complete**, or **promoted to Foreign Minister**.

**Grade:** Nigerians abroad 35%, Abuja 20%, the host 20%, deals 15%, clean hands 10%.

**Teaching:** 14 notes, covering:
- Section 171;
- the letter of credence;
- the two Vienna Conventions;
- passports;
- evacuations;
- NiDCOM;
- remittances;
- cables;
- non-oil exports;
- UN vote trading;
- visa reciprocity;
- death-row cases;
- why the diaspora cannot vote from abroad.

**Vatar:** the first year is free, then `career_ambassador` (one-off, ₦1,000).

**Art:** all 18 pictures in Lovable's Ambassador pack plus `badge-ambassador`, enforced by `tests/art-usage.test.mjs`.

**Balance** (2,100 simulated postings per background): careful play is usually promoted with A or B; random play lands on C or D.

**Test:** `tests/e2e/ambassador.mjs`.

## Career screens: pictures
`CareerHero` shows each painting whole at 16:9, never cropped to a strip. The person appears in a round head-and-shoulders portrait on the picture's corner rather than pasted into the scene.

## Career depth, Phase 1: "It comes back" (see docs/CAREER-DEPTH-PLAN.md)
**The engine:** `game/systems/consequence.js`, shared by all careers.
- **Seeds:** a choice plants a seed (`plant`), and 1–3 turns later the seed comes due (`dueSeeds`). `withCallbacks` puts its callback card at the front of the turn.
- **Named people:** they live in `S.npcs` with a relationship from 0 to 100 (`moveRel`, `mood`, `relWord`).
- **The Player Record** (`sop_record`, `recordCareer`): offices held, the seed tags worth carrying forward, the people met and their final relationship, and lifetime corruption. `formerEnemy` and `formerAlly` let the next office call them back.

**The Chairman, retrofitted**
- **Three named people,** with surnames only, because the portraits are men, and every name is different:
  - **The Governor:** the existing favour meter, with a pleased, worried or angry portrait.
  - **The Party Chairman:** decides the ticket. A party that loves you can override a cold governor; one that hates you can deny a warm one.
  - **A troublesome Councillor:** leads impeachment when the council is restless.
- **14 seeds and their callbacks,** marked **↩ It comes back.** They include:
  - the motor-park eviction after giving land away;
  - drains collapsing under a crony contractor;
  - the governor punishing a snubbed rally;
  - ghost ward projects;
  - the councillor's signatures;
  - state auditors after a lawsuit;
  - ghost workers from party hires;
  - the ₦2,000 certificate exposé;
  - the burnt farm after taking sides.

  Good deeds come back too: the staffed clinic holds during cholera, the graded road doubles market day, the traders' union and the teachers' union endorse you, and the reconciled villages invite you. Callbacks can move election day (`elecMod`).
- **The party's own demand:** forty party members want council jobs.
- **At the end:** the Chairman writes the record (people plus the tags worth carrying) for later offices to call back.

## The Chairman proof (after Perplexity's review)
- **One promise on swearing-in day:** the road will last, no mother dies for want of a nurse, or no new levies. It is judged at the end.
- **The in-tray.** Each half-year the matters arrive together, and you **handle two yourself**.
  - The allocation, the road, the council and the governor are delegated in plain ways (`SYS.delegated`).
  - A neglected problem comes back **worse** a half-year later (`neglect:<id>` callbacks).
  - The allocation always comes first, so money arrives before anything costs money.
- **The market road (`SYS.ROAD`):** commitment (who builds it), then a warning (a named trader's photo, an overrun, or a forgotten route), then an intervention (repair, inspect, or open on schedule).
  - The rains test it in year 2 (`roadTest`), and the result follows from the whole chain.
  - The road's state is always visible.
- **No dead ends:** if nothing on a card is affordable, "Not enough money: put it off" appears.
- **A four-part verdict** (`lgaVerdict`): Delivery, Integrity, Survival, Your promise, plus "Your term:" (your actual decisions) and "Who you leave behind" (your three people).
- **The question at the end:** "Which decision would you change?" goes to the feedback page (where = `chairman_end`).
- **One life:** a former chairman who becomes governor of the **same state** meets their past on day one (`chairmanEchoes`): the market women campaign for them, or the evicted traders don't forget; the road still stands, or is on the posters; the councillor they fought sits in the House of Assembly; their old party chairman works the party for them.

## Projects: how much and where (player feedback, October 2026)
A player asked to choose how big a road or housing project is and which local governments (or states) it goes to.
- **How much:** every project, programmes included, has a slider (from a quarter to ten times the starting size) with Small / Medium / Large presets and an exact number. A programme's name no longer carries a fixed size ("500km Road Network" becomes "Road Network"; the proposal says how big).
- **Where:** tap one or more local governments, grouped by senatorial district, with "All of <district>"; the President taps states, grouped by the six zones. The size is shared between them. Every three more places add a year. `project.lgas` keeps them all; `project.lga` is the first (older code reads it).
- **What it means:** when a project opens, approval rises in each district or zone it reached (+3 if it went to one, +2 each if spread); a big one (twice the usual size) that left a district out costs −1 there.
- **Capacity:** a ministry oversees so much a year (`SYS.capacityOf`: roads 150 km, homes 1,500, …; a good minister a quarter more, federal ministries 2.5×). Beyond that the build takes longer, or a second contractor doubles it for 12% more.
- **The ground:** riverine places (creeks, swamp) cost about 30% more and can flood the works; rocky highlands about 15% more. Elsewhere landowners can block a site until paid (`SYS.siteTrouble`, seeded). Marked 🌊 / ⛰️ on the place chips.
- Tests: tests/places.test.mjs; tests/e2e/projects.mjs.
- **Education kinds (feedback):** the university programmes opened as roads (`POLICY_TYPE` had no entry for `new_uni`, and `uni` was a primary school). Now: primary school, secondary school, school of nursing, college of education, polytechnic and university (sized in student places); for the President, the federal ones (Federal Government College, federal college of nursing, of education, federal polytechnic, federal university). A governor asking for a federal institution is told the state founds its own.
- **Install as an app (feedback):** public/manifest.webmanifest (name, icons 192/512 PNG from art/brand/app-icon.webp, standalone, dark green) and public/sw.js (network first; the last copy of the game's own html/js/css kept for offline; /api never cached). The ☰ menus show "Install the app" when the phone can: Chrome's install prompt, or on an iPhone the Share → Add to Home Screen steps. Never inside the Vatar app or another site's frame.
- **Feedback form:** a first box, "What do you like?", so praise no longer lands in "What do you not like?". Stored as `like`; shown as "Likes" on the feedback page and in the CSV.

## The Special Adviser's economic letter (every year, governor and President)
`game/systems/econbrief.js`. Each year the tray holds one letter from the Special Adviser on the economy (high priority, never crowded out). It asks one real question, chosen from the year's own figures:
- **President** (11): the trade policy (until the Economic Advisory Council has sat: "Convene it now"), the petrol subsidy, food prices (food ≥ +12%), the naira (reserves < $22bn or a wide street-rate gap), factories closing (< 48), an oil windfall, the minimum wage, short revenue (VAT), the Central Bank's rates, oil theft, a rating downgrade (debt > ₦35B).
- **Governor** (10): the export plan (until the State Economic Council has sat), low IGR, a FAAC drop, traders' levies, the minimum wage, food prices, a state bond, a manufacturer's tax holiday, pensions, the last government's contractors.
- The most pressing unasked question comes first; none is asked twice in the eight years.
- Every answer acts now (approval, the bank, debt, revenue a year, corruption, the trade figures) and most come back next year (`later`): the follow-up lands at the year's turn ("📊 The dry-season harvest is in: food prices fell.") and the next letter opens with "Last year you … ." Tests: tests/econbrief.test.mjs.

## Strikes stop the country (owner, October 2026)
`SYS.strikeImpact(stc.labour, nat)` says what a strike stops, by sector: "stop" or "slow", and who walked out.
- **NLC (governor or President):** the civil service, every building site (the construction workers) and the airports stop at once; schools (NUT) stop from stage 2, hospitals (JOHESU) from stage 3, a go-slow before; farms, markets, power (NUEE stops it at stage 2 for the President) and the universities' non-teaching staff go slow. **ASUU:** the universities stop. The police and the army cannot strike: security never stops.
- **Programmes and projects:** a programme or a new project in a sector the strike touches at all does not start ("It cannot start: the building sites are on strike"). Sites under way build nothing and are paid nothing when stopped, half when slowed (`tickProject` ctx.halt). The year's end says what the strike has stopped.
- **Travel:** while the NLC is out the airports are shut, for a governor too. Going anywhere in person (trip letters, Abuja, Kasongo, a state visit) opens the airport: the pilot says there is no ground staff, and you choose. President: the Air Force base with military crews (the strike hardens, approval −1, front page) or the road for a trip at home, or don't go. Governor: a chartered private jet (₦0.3B, approval −2, front page), the road (a one-in-four ambush), or don't go. "Don't go" returns to the letter. Investors cannot fly in.
- **The aircraft:** the flight takes `plane: "military" | "private"` (window.SOP_flightPlane for the trip). Pictures art/objects/military-jet-side.webp and private-jet-side.webp and the sound audio/sfx/military-jet.mp3 are used when they exist; until then the airliner flies.
- Tests: tests/strike-impact.test.mjs.

## The President's impeachment (Section 143)
`game/systems/impeach.js`. The President no longer falls to the governor's generic "impeach" screen; the record starts a Senate case.
- **Triggers** (checked each year, not within three years of the last case): defying the courts or the Assembly (`stc.defied`, the Bakunda override, the "keep him" court seed); grand corruption (corruption ≥ 50%) with a Senate below 35; a paralysed nation (an NLC strike at stage 2 for a year or more, or a security front at 85+); a collapse (approval < 30 and party < 40). Front page: "SENATE LAUNCHES INVESTIGATION INTO THE PRESIDENT".
- **The indictment vote:** a letter from the Senate President with three answers: sack a minister and blame it on them (20%); pay the panel ₦2B from the security vote (0%, corruption +8%, and a 50% chance a whistleblower brings an "exposed" case next year at 70%); stand your ground (50%; cleared: approval +5).
- **The tribunal** (the Senate chamber, the Attorney-General beside you; nothing new starts that year): a late-night deal (acquitted; half of customs and export money goes to the opposition for good); the Attorney-General's defence (90% / 55% / 25% by their performance, 10% without one; removed if it fails); sealing the National Assembly with the Presidential Guard (only if the army's relation is 65+: emergency rule, approval −8, then −2 a year and a 12% coup each year; otherwise the army arrests you: "REMOVED IN A COUP").
- Tests: tests/impeach.test.mjs. Art to come: docs/LOVABLE-STRIKES-IMPEACH.md.

## The President's diplomacy (sky-blue letters)
`game/systems/diplomacy.js`. A new letter kind, **Diplomacy** (sky blue #3a9ad9, a dove seal, the letterhead tinted blue, "Ministry of Foreign Affairs · Protocol Department").
- **The UN General Assembly, every year:** a different theme each year of the term (climate finance, the debt crisis, the Sahel, the pandemic accord, AI and jobs, girls' education, the blue economy, a ceasefire). Go to New York and close one of two deals, or send the Vice-President (heard, nothing signed). The old one-off UNGA world card is retired.
- **Every other year, an invitation** from a head of government to a national festival (Sweden's Midsummer, Seoul's Lantern Festival, Canada Day, Tokyo's cherry blossoms, Rio's Carnival, Diwali in New Delhi, Oktoberfest, the UAE's National Day), never the same country twice: go and close one of two deals, send the Foreign Minister (a third of the first deal), or decline.
- **Deals are real:** revenue a year, jobs, money in the bank, debt relief, loans, health, schools, infrastructure, farms, the trade figures; most land again the next year ("The Swedish-built wind and solar farms put 200 MW on the grid."). Going in person flies (and meets a strike at the airport if there is one).
- The first-year guide panel ("Your first year · Skip guide") is retired for both offices.
- Tests: tests/diplomacy.test.mjs; tests/e2e/president.mjs checks the UN letter.

## The Cabinet of friends (phases 1 and 2) · COMING SOON for players
- Locked: ☰ shows "Govern with your friends · coming soon" (a card explains it) and People → Cabinet shows a Coming soon card with no way to form one. Opening the game once with ?cabinet=preview unlocks it on that phone (localStorage sop_cab_preview), for testing. Invite links still work for anyone they were sent to.
- People → Cabinet (or ☰ → Govern with your friends): the Governor forms a government with five seats: Deputy Governor, Finance, Works, Attorney-General & Security, and Health & Education. Each seat gets its own invite link, to share on WhatsApp or copy.
- A friend opens the link on any phone (no account): the nomination letter, a name, one question from the House's screening (any answer passes, each with its own reply), the oath, then their desk. The home screen keeps a "Your cabinet desk" button on that phone.
- The Governor's phone runs the game. Each time the mail changes it shares the year's open letters, routed by seal (game/systems/cabinet.js `seatFor`; anything about schools, hospitals or farms goes to Health & Education). Statecraft letters carry their real options; other letters a stance (act now / middle way / hold firm).
- The minister advises (an option and a line). The Governor sees "💬 Chinaza · Finance advises" on the letter and the card, and the advised option is marked. Signing it counts as followed (+3 loyalty); another option counts as overruled (−6, and a toast). A letter left unanswered when the year moves on counts as absent. Handing a letter to the Chief of Staff, or handling a stance letter, records no verdict.
- The budget council: each minister asks for their lines; Finance proposes the whole split (it must add to 100). On the budget screen, Finance's budget is one of the shapes to pick, with the bids alongside; picking it counts for Finance.
- Everyone sees the same numbers (approval, bank, debt, corruption), the latest front page, the cabinet and its log. Sack a friend and the seat gets a new link; they become a former minister.
- At the end of the term, the share card ("The Ada Obi Government, 2027–2034", each minister's word, the star of the cabinet) goes to the Governor and every minister, with WhatsApp sharing.
- Server: server/cabinet.mjs, POST /api/cab/* (create, invite, join, view, publish, decide, advise, bid, usesplit, sack, reinvite, end), files in DATA_DIR/cabinets. Keys are held by each phone; only their hashes are stored. 10 new governments a day per address.
- Tests: tests/cabinet.test.mjs (rules), tests/cabinet-server.test.mjs (endpoints), tests/e2e/cabinet.mjs (two browsers on the real server).
- Phase 2, the President: the Vice-President and seven ministers (Finance, Works & Power, Defence & NSA, Attorney-General, Foreign Affairs, Labour, Petroleum). The Senate screens the nominees. Letters route by key and words: the war → Defence, the impeachment → the Attorney-General, the UN and invitations → Foreign Affairs, strikes and wages → Labour, oil, fuel and the subsidy → Petroleum, schools and hospitals → the Vice-President.
- Hard politics (a switch when forming, off by default): each year a minister may get a private offer only they see (a contractor's envelope, a baron's favour). Taken, it fills their private account and adds a point of corruption to the government, unnamed. Each year after, it may come out: "EFCC INVITES <NAME>" on the front page, −3 approval, and a card to sack them or stand by them. The rest of the cabinet never sees the account.
- Reshuffles: Move… puts a minister in an empty seat (their record goes with them). Sacked ministers keep their key as former ministers: once a year they can write an op-ed, which lands on the leader's front page (−2 approval).
- The primary: from year 6 the cabinet's primary opens. Ministers declare and vote; votes (3 each) and record rank them. The winner heads the succession letter as "the cabinet's choice". Passing them over costs every minister 5 loyalty. The anointed friend's desk offers "Run for Governor/President yourself".
- Tests: tests/e2e/cabinet-president.mjs (the President's cabinet, an offer taken, the scandal, the sacking from the scandal card, the op-ed).
- Reminders: beside each minister with letters waiting, "📬 N waiting · Remind" opens WhatsApp with the letter's title and a desk link (?desk=CODE opens that phone's seat directly). The letter's "⏳ Sent to …" strip has the same button.
- While you were away: a minister returning to the desk sees a card with the years that passed, the front page, advice taken or overruled, and the cabinet's news since the last visit.
- The succession letter looks up the cabinet's primary when it opens (tests/e2e/cabinet-succession.mjs).

## Linked governments (phase 3) · COMING SOON with the cabinet
- The President (People → Cabinet, with the preview switch) invites friends' governorships with one link (?fed=CODE&inv=KEY), up to eight states, one governor per state.
- A friend opens the link: "An invitation from the President". With a governorship in progress they tap "Link Ogun and continue"; without one, their state joins when they next take office. Their game says "Ogun joins President X's federation".
- The President's panel lists each state (standing, approval) with: Grant ₦2B, a federal road (₦3B), a federal medical centre (₦3B) or a federal university (₦4B), once a year each; paid from the federal bank (borrowed if it is empty), refunded if the server cannot be reached. Cut off removes a state.
- In the governor's game: a grant lands in the bank (+5 standing with Abuja); a project raises infrastructure, health or education by 2 points, approval by 2 and standing by 8, with a front page ("FEDERAL ROAD FOR OGUN").
- Governors ask (a grant or a project, one open request at a time); the request reaches the President as a card with "Approve (₦xB)". A refusal costs 6 standing.
- The Governors' Forum: each year the President's proposal (state police, a VAT formula, one minimum wage, grazing reserves, state power grids, paying local governments directly, state ports, a national ID). Governors back it (+5 standing) or oppose it (−5 standing, +1 approval at home). It closes when the President's year turns: passed, +3 party and +1 approval for the President; rejected, −3 and −1, on the front page.
- In the President's game the screen's word swap (governor → president) leaves the federation's panels alone ([data-nowords]); pop-ups keep their words with a word joiner (KEEP).
- Server: server/federation.mjs, POST /api/fed/* (create, invite, join, view, publish, gpublish, grant, project, ask, answer, vote, seen, remove), files in DATA_DIR/federations. Tests: tests/federation-server.test.mjs, tests/e2e/federation.mjs (two browsers: a President and Ogun).
- Pictures: stand-ins until the Lovable pack arrives (brief: docs/LOVABLE-CABINET.md, written once the feature was finished).

## Ending a war for good: Peace Plans (player feedback, October 2026)
- The President: in the Security Council, each of the two worst fronts can get "🕊️ End <the war> for good: a Peace Plan" (₦10B, this year's choice). Then one step a year as a letter from the National Security Adviser: Clear, Hold, Build, Seal (game/systems/peace.js), each with three ways: properly (no setback), cheaply (25% chance to slip back a step) or crookedly (45%, and corruption). Hold, Build and Seal wait until the front has cooled to 55, 45 and 35; until then the letter offers to keep up military pressure or wait. At most two plans at a time; a front under a plan grows half as fast.
- Each front's steps are its own: the North-East (offensive, civilian JTF, almajiri schools and deradicalisation, a joint force with Chad, Niger and Cameroon), the North-West (forest operations, state police and forest guards, ranches and regulated mining, disarmament under the emirs), the South-East (target the enforcers, dialogue with elders and the church, bridge, rail and industrial park, a political settlement), the Niger Delta (the Navy, an honest amnesty, the host-community trust fund and clean-up, community pipeline contracts).
- Done: the front closes for good (never grows, never bites, leaves the council), a front page ("THE WAR IN THE NORTH-EAST IS OVER"), and a dividend (approval, security, farms, Monday markets and taxes, oil output and the Federation Account). Two years later: keep the peace funded, or let it lapse (half the time the front comes back at 40).
- The Governor: from year 2, when the state's security is weak or a security crisis has hit, the Commissioner of Police offers a four-year plan to make the state safe (₦1B): a security outfit, community policing with the rulers, jobs for young men, peace committees with a law. Closed, the state's security crises (bandits, abductions, insurgent attacks, farmer–herder clashes, sit-at-homes, cult clashes, illegal refineries) stop for good.
- The Peacemaker badge also counts a closed front or a state made safe. Friends' cabinets: these letters go to Defence (President) or Justice & Security (Governor).
- Tests: tests/peace.test.mjs, tests/e2e/peace.mjs; the President's playthrough checks the council's offer.

## Successors and your projects (player feedback, October 2026)
- Who follows you decides what is finished (game/systems/legacy.js): your loyal heir (finishes everything, in your name), a technocrat (keeps what works, scraps poor work), a party rival (finishes what is protected, popular or nearly done) or the opposition (reviews and cancels). The kind follows from the succession: who you anointed, whether they won, whether they betrayed you.
- Every unfinished project shows "If you left office today: N% chance it gets finished", from how far it is built (75% and up almost always survives), the successor, the handover, a pledge, clean work and your approval.
- Finish within your term: the budget step warns when a project started now finishes after you leave; "Speed it up (+15%)" puts a second shift on a site under construction (it builds about half as fast again).
- The Transition Committee (year 7): a full handover dossier (+10% to every project), a briefing, or nothing (−10%, and files go missing). After you anoint a successor, you can make your support conditional on a public pledge to finish your biggest unfinished project.
- Five years later (the end screen): what became of each unfinished project (finished in your name, finished with the credit taken, cancelled, or a broken pledge) and of each Peace Plan.
- Tests: tests/legacy.test.mjs; tests/e2e/peace.mjs (the handover).

## Scenarios that deliver what they promise (owner, October 2026; redone after "they all fell flat")
Each of the ten scenarios is a fight that lasts (game/systems/scenarios.js, tests/scenarios.test.mjs, tests/e2e/scenarios.mjs).
- **Day One opens the fight; no answer ends it.** The person at the heart of the crisis walks in (in the Hostile House, once the commissioners are named). Each answer moves you towards the goal, never all the way (a unit test checks every answer).
- **The rival comes back.** At each year's end the same people make a new move (the Speaker's contract probe, the defectors, a by-election, a truce; the godfather's men at Works, the party executive, the EFCC file; the NLC's ultimatum, the pensioners, the audit's findings; a video of the pupils, a middleman, a new demand; burnt buses, the elders' summit, the banks; the harvest tax, a bandit truce, reprisals; the contractor's variation, stolen relief, resettlement; striking doctors, poisoned wells, a vaccine rumour; the market women, the overdraft, a collection deal; a recanting witness). Some answers need the rulers or Abuja.
- **While it lasts, it changes the game.**
  - Hostile House: the opposition majority votes down your bills and your budget, and every Treasury reform that needs a law (the revenue service, land registry, levy, property tax, concessions). Ways through: a year's truce bought from the Speaker, going over their heads (55% approval), a per-bill deal at a higher price, or winning the House. The Speaker poaches a member a year (never to two-thirds by himself). Provocative executive orders (revoking the predecessor's land, freezing hiring, banning street trading or okada) cost a member and the Speaker's fury; two provocations bring the motion a year closer. The generic "lost majority" card is replaced by the Speaker's moves.
  - Broke State: while two months or more are owed, the strike freezes your sites. Godfather: a contract stalls every year; revoking the predecessor's land loosens his grip but angers his men. Sit-at-home: own revenue −4% a year. Bandits: farms and approval fall every year. Abduction: approval bleeds while the pupils are held; talks bring groups home each year. Flood and cholera: health falls. Oil crash: the overdraft grows.
- **The countdown:** every year a front page counts the years left; a warning comes the year before.
- **The deadline lands full-screen** (the Speaker in the chamber for an impeachment), not as a letter. Uno cards (approval, the rulers, a strong Attorney-General, Works or Health commissioner, Abuja, clean hands, the audit, a published plan) save you, and **playing one spends it** (rulers −20, approval −6, Abuja −15…). Without one: buy the votes (55%) or face the vote (odds from approval).
- **Pace:** Intense brings the deadline a year closer, two rival moves a year, cards 5 points harder and blows 1.5× heavier; Relaxed gives a year more and easier cards.
- The Hostile House starts one member short of the two-thirds needed to impeach; a majority means more than half the House, as on the vote screen.

## Everything in sync: no contradictions (owner, October 2026)
A hunt for places where the game said one thing and did another.
- **Courts:** a case names one target, and the description, the "why this case" line and the ruling all use it (before, the description named your first programme and the ruling removed your last). Complying (at any court, or after the Supreme Court) carries the ruling out: the programme is struck down and stops, and any community need it was answering is open again (not "met"); a land or mining case cancels the investor's deal, with its jobs and yearly taxes; a forced budget declared void freezes new work for the year. A struck-down business order stops paying its savings. An injunction is "asked for" while the case runs, since the programme runs until the ruling.
- **Strikes:** one NLC strike, not two. Unpaid salaries (5+ months) start the same strike the labour engine runs (the Desk card, the roundtable, the yearly toll), instead of a separate "GENERAL STRIKE" line every year. Paying the arrears calls that strike off; a settlement at the roundtable over salaries pays them (in full, or 30% under an MoU; the MoU's last instalment clears them). "The NLC calls off its action" is only said when it does. A strike twist that does not end the strike says "The strike goes on". The random "ASUU joins national strike" line (with no strike on the Desk) is gone; ASUU strikes are real ones.
- **"Reverse it"** on an NLC ultimatum appears only for the taxes it can undo (levy, property charge, VAT), and the front page names the right one.
- **"Work stops this year"** (a strike answer, capital cuts, a void budget, the Broke State) now pauses the building sites as well as the needs.
- **Peace and scenarios:** random security attacks stop once the state's Peace Plan has made it safe for good; in the Flood and Cholera Years the random flood and outbreak lines are the scenario's own; a scenario's crisis is never told twice by the regular crisis stories. Freeing yourself of the godfather in his scenario ends his demands, his power and the debts the House held against you; if he dies, you are free.
- **The flagship** always reaches the Desk; busy years no longer crowd your own agenda out.
- **Fewer pop-ups:** a council's decision shows its result in the same session screen (one screen per sitting), not as a second pop-up over it.
- The bank-crisis shock says what really happens (payments run late; ₦2B is lost).
