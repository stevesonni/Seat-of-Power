# Seat of Power — status (4 Oct)

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
