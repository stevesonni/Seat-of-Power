# Seat of Power — status (4 Oct)





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
