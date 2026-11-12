# Seat of Power: current state audit (motion, clarity, cause and effect, navigation)

Scope: the game as it stands on 12 Nov 2026, read from the repository (/home/user/Seat-of-Power), the audit captures in the session scratchpad, and the player feedback CSV (139 rows, 24 Oct to 5 Nov 2026). Sources are local files; "URLs" below are file paths with line numbers. Abbreviations: JSX = `game/seat-of-power.jsx` (17,889 lines); HTML = `public/seat-of-power.html` (940 lines); STATUS = `docs/STATUS.md`; AUDIT = `/tmp/claude-0/-home-user-Seat-of-Power/6d547f60-c541-5156-9aeb-8af4391cce86/scratchpad/audit/`.

## 1. Screens, tabs, sub-pages and how a player moves between them

### Takeaway
Governing has three bottom tabs (Desk, State/Nation, People), each with 2 to 5 sub-tabs. Over that sit a painted Compound hub map (the default Desk view), full-screen OL sheets for decisions, a queue of SOP_outcome pop-ups, a ☰ menu with about 12 items, a mailbox in the bottom-right corner, and a phone Back handler that finds and clicks a visible Back or Close button. The layers stack deeply, but there is no breadcrumb or "where am I" indicator beyond the active tab or pill. Players report it as "hard to navigate" and say they could not find their mail.

### Cited Findings
- **Tab structure (`SCREENS`)**:
  - Desk = `hub` (Compound) and `gov` (Today). The News tab was retired in October 2026.
  - State (or "Nation" for the President) = `tre` 💰 Treasury, `econ` Economy, `prj` Projects, `proc` Contracts.
  - People = `cast` Cast, `cab` Cabinet, `min` Ministries, `coun` Council(s), `ppl` Public.
  - A hidden `WIKI_SCREEN` holds `bio` Wiki Bio and `con` Constitution, reached only from the menu.
  - Sources: [JSX:12525-12529](game/seat-of-power.jsx). Note: the STATUS overhaul section ([STATUS:157-161](docs/STATUS.md)) still lists the three tabs as "Desk: Compound · Today · News; State: Money · Projects · Contracts". That is out of date against the code.
- **How tabs and sub-tabs work**:
  - `curScreen` is derived from the current `nav` sub-key ([JSX:12544](game/seat-of-power.jsx)).
  - `navMemory` remembers the last sub-tab per tab, so tapping a tab returns to the sub-tab last open there ([JSX:5565, 12725, 12739](game/seat-of-power.jsx)).
  - On phones (`TALL()`) the sub-tabs are a horizontally scrolling row of pills, 48px tall ([JSX:12710-12711](game/seat-of-power.jsx)). On wider screens they are `subBtn` buttons ([JSX:12747](game/seat-of-power.jsx)).
  - In the first two years (`front` pillar) the tabs carry a hint of what is behind them, from `TAB_HINT`: Desk "Letters and decisions", State "Money and projects", People "Cabinet and the public" ([pillars.js:84](game/systems/pillars.js); [JSX:12727, 12741](game/seat-of-power.jsx)).
- **CompoundHub (`CompoundHub`, [JSX:1331](game/seat-of-power.jsx))**:
  - The map is Lovable's painted `public/art/compound/compound-full.webp` (1500×850).
  - `HUB_BUILDINGS_STATE` and `VILLA_BUILDINGS` define the click boxes. Buildings glow when they need you.
  - Overlays sit at fixed points: a protest, the press, a crowd. At night (the `end_turn` phase) the map is dimmed.
  - The "next" building carries `sop-next`, a pulse animation. A "next" button sits above the map.
  - On phones the map becomes a two-column list.
  - The motorcade animation was removed at a player's request.
  - Sources: [STATUS:73-78](docs/STATUS.md); [JSX:1345-1354](game/seat-of-power.jsx).
- **`hubNext()` / `hubArrive(id)` ([JSX:12653, 12660](game/seat-of-power.jsx))** decide the one next task and route the player to it. Labels include "Set up your government", "Pass this year's budget", "Take the budget to the House", "Sign programmes and orders" and "Open your mail…".
- **OL sheets (`OL`, [JSX:2285-2295](game/seat-of-power.jsx))**: on a phone a decision fills the whole screen as a sheet that slides up (`sop-ol`/`sop-sheet`, `sopSheetUp`). On desktop it is a dimmed modal (`sop-fade-in`, `sop-slide-up`).
- **Pop-up queue**:
  - `window.SOP_outcome(o)` pushes onto a queue ([HTML:648](public/seat-of-power.html)).
  - The same channel carries result cards, newspaper front pages, flights, the adviser in person (speech bubble), and News Anchor desks.
  - `SOP_hold` pauses the queue during broadcasts, for up to 90 seconds ([HTML:668](public/seat-of-power.html)).
- **☰ menu (`menuItems`, [JSX:12530-12543](game/seat-of-power.jsx))**: Home screen (saved), Start over, Save game, Help, Govern with your friends (Cabinet, "coming soon"), Install the app, Music, Tell us what to improve, Language (cycles through 5), Sound, Fullscreen, Second Chance (Vatar). Wiki and Constitution are reached via `WIKI_SCREEN`. The STATUS overhaul notes list Wiki, Constitution, Standing, Save, Help, Text size, Sound, Fullscreen, Second Chance ([STATUS:161](docs/STATUS.md)).
- **Mailbox (Pack 31, 11 Nov 2026)**:
  - `MailboxStand` ([JSX:4525](game/seat-of-power.jsx)) is a green letter box fixed bottom-right on the Desk (Compound and Today) only.
  - It shows "N unread" with the seal of the most urgent letter, and a **Next message** button.
  - Letters have "← Close the letter" and "Next letter →".
  - The box steps aside under sheets and pop-ups. During the budget and the House vote it appears smaller, and only when letters wait.
  - The tray must be cleared before the next year.
  - Sources: [STATUS:367-383](docs/STATUS.md); [JSX:12811](game/seat-of-power.jsx); [STATUS:103-111](docs/STATUS.md).
- **Phone Back (`SOP_back`, [HTML:905-940](public/seat-of-power.html))**:
  - The page keeps one history entry of its own. A `popstate` event clicks the top fixed layer's Back control, found by aria-label "back"/"close" or by button text matching `^(←\s*)?(Back|Close|Not now|Later|Hang up|Cancel|✕|×)$`.
  - With nothing to close, it shows a toast: "Your game is saved. To leave, use Home in the ☰ menu."
  - It is a heuristic: it depends on every layer having a button with one of those labels. Tested in `tests/e2e/back.mjs` ([STATUS:354-356](docs/STATUS.md)).
- **Hint button**: when the `front` pillar is on, a fixed 💡 Hint button (`data-sop-hint`) presents `SYS.HINTS[key]` or `NEXT_SAY`, with "Take me there", which calls `hubArrive` ([JSX:12751-12752](game/seat-of-power.jsx); [pillars.js:76-83](game/systems/pillars.js)).
- **Today view with the `screen` pillar**: shows the four meters and the next decision only. Needs, the street, visits, labour, the approval warning, Flagship and "Big moves" sit behind a "More" toggle (`todayMore`) ([JSX:5978, 15483, 12721](game/seat-of-power.jsx); [STATUS:322-324, 338-339](docs/STATUS.md)).
- **Player feedback on navigation**:
  - Chinonyelum: "It's hard to navigate but nice".
  - Chinaza (hub): "Under desk I keep seeing 9 mails but no indication where to read them | A separate box or tab for messages". This came before the mailbox was built.
  - Blackboyade: "When I try to go back, it automatically takes me out of the game". Fixed by `SOP_back`.
  - Seven: "The Old Railway Warehouse just says Locked and doesn't explain how to open it… A small HINT button and map markers for missions".
  - Source: [feedback CSV](/root/.claude/uploads/6d547f60-c541-5156-9aeb-8af4391cce86/07ec93e3-seat-of-power-feedback_4.csv).

### Inferences
- There are about 11 governing sub-pages across three tabs, plus the hub and the hidden Wiki. Many decisions also arrive as overlay sheets and queued pop-ups. A player can be three layers deep (tab → sheet → pop-up queue) with no visible stack or breadcrumb.
- The mailbox lives only on the Desk tab. Mail arriving while the player is on State or People is signalled by the Desk tab's count, not by the box.
- `SOP_back` relies on button-text matching, so any new sheet whose dismiss button is labelled differently (for example "Okay", "Got it" or "Continue") will not be closed by the phone's back button. Result cards use "Okay" or "Got it", which the regex does not match.

### Gaps
- I did not trace every route to the Wiki and Constitution screens or the exact current ☰ contents per office (Senator, Chairman, Ambassador careers have their own screens, for example around [JSX:16489-17137](game/seat-of-power.jsx)).
- No analytics on navigation paths were available here. The "Where players leave" dashboard data (`S.last`) is on the server, not in the repository.

## 2. Motion and visual feedback that already exists

### Takeaway
There is a lot of authored motion already:
- about 40 CSS keyframes;
- a full flight sequence;
- coin rain and a coin burst for money in;
- a pen signing and VETO stamps on bills;
- a newspaper spin-in;
- letters unfolding;
- the mailbox jolt and envelope arc;
- an achievement sunburst;
- meter bump and delta pills;
- pulses on the next task.

Most of it respects `prefers-reduced-motion` and a `sp-still` class. The weak spots are elsewhere:
- meters moved to words and arrows, so the size of a change is invisible;
- the floating change readout was removed;
- delayed effects land silently in the log;
- the hub map is static apart from overlays and pulses.

### Cited Findings
- **Keyframes in HTML**:
  - `sopSheetUp`, `sopFadeIn`, `sopSlideUp`.
  - `sopSign` and `sopPen` (signature).
  - The flight set: `flGlow`, `flPlaneOut`, `flPlaneHome`, `flBob`, parallax clouds `flFar/Drift/Near Out/Home`.
  - `sopPaperIn` (front page rotates in), `sopPresentIn`, `sopStamp`.
  - `sopCoin`, `sopBurst`, `sopBump`, `sopDelta`, `sopRise`, `sopShine`, `sopUnfold` (letter), `sopFlame`, `sopGlow`.
  - `sopStampBig`, `sopJolt`, `sopInk`, `sopPenRun`, `sopStampSmall`, `sopRot`.
  - Sources: [HTML:162-265, 322](public/seat-of-power.html).
- **Keyframes in JSX**:
  - Setup and adviser: `spFadeOut`, `spAdvIn`, `spRing`, `sopPop`, `sopPulse` (`.sop-next`), `sopSlideUp` ([JSX:17810-17828](game/seat-of-power.jsx)).
  - Mailbox: `sopMailJolt`, `sopMailPop` ([JSX:4554](game/seat-of-power.jsx)).
  - Achievements: `achSpin`, `achPop` ([JSX:4684](game/seat-of-power.jsx)).
  - CSS file: `lv-desk-pulse` ([sop-screens.css:344](public/sop-screens.css)).
- **Result card (`SOP_outcome`, default branch, [HTML:548-604](public/seat-of-power.html))**:
  - Lovable's gold-edged `.lv-dec .result` card with a picture on a sunburst (or an emoji icon), a kicker, a title and at most 2 sentences.
  - Under `SOP_PLAIN` the text is trimmed to 25 words.
  - Up to 9 rows with +, − or § markers, an optional action button, sound by tone, and a red button for bad news.
  - It enters with `sopFadeIn` and `sopSlideUp` (.25s).
- **Coins**:
  - `o.coins` triggers `coinRain(veil)`: 9 coins with a 4-frame spin (`coin-1…4.webp`) rising 78vh over about 2.6s ([HTML:670-684](public/seat-of-power.html)).
  - It also adds `coins-burst.webp` behind non-wide art.
  - Used for treasury and FAAC arrivals ([JSX:8835](game/seat-of-power.jsx)), revenue reforms with cash now ([JSX:6453](game/seat-of-power.jsx)) and project cash outcomes ([JSX:5845](game/seat-of-power.jsx)).
  - Skipped under reduced motion.
- **Flights**: `SOP_outcome({flight:{dir:'out'|'home'}})` plays a plane between parallax clouds, tap to skip. The plane can be an airliner, an Air Force jet or a private jet during strikes ([HTML:489-500](public/seat-of-power.html)). Pack 7 "the flight (3D style)" was delivered ([LOVABLE-NEXT.md](docs/LOVABLE-NEXT.md)).
- **Bills**: Sign makes a pen write the governor's name. Veto makes a red VETO stamp land, then the House reacts with the Speaker's face ([STATUS:138-143](docs/STATUS.md)).
- **Front pages and anchors**:
  - Front pages for trips, visits, bills, projects and the flagship ([STATUS:146-151](docs/STATUS.md)).
  - With the `drama` pillar, a front page after every Desk decision, built by `headlineFor` ([drama.js](game/systems/drama.js); [STATUS:333-335](docs/STATUS.md)).
  - `AnchorDesk` is a two-line TV anchor segment that holds the pop-up queue ([JSX:3105-3112](game/seat-of-power.jsx)).
- **Mailbox motion pilot**:
  - The box jolts, the envelope rises from the slot, arcs to the centre, grows and opens.
  - A new letter drops in from the top and the count pops.
  - It corrects for page zoom (phones about 65%). No motion when reduced motion is on.
  - The owner is piloting motion "until players complain".
  - Sources: [STATUS:367-383](docs/STATUS.md); `mailStill()` at [JSX:4515](game/seat-of-power.jsx).
- **Achievements**: 24 cards pop up with the medal on a turning gold sunburst, a big number and a funny line ([STATUS:229-240](docs/STATUS.md)).
- **Meters (`StatPill`, [JSX:3083-3101](game/seat-of-power.jsx))**:
  - When the raw value changes, the number gets `sop-bump` (scale 1.22) and a coloured `sop-delta` chip shows +N, −N or ±₦ for 1.8 seconds.
  - With the `screen` pillar (`words`), the chip shows only ▲ or ▼, and the meters read as words: People "Warm/Restless", Party "United", Treasury "Healthy/Tight/Empty", Godfather "Watching" ([STATUS:322-323, 338-339](docs/STATUS.md); AUDIT round2 titles such as "Warm / People / ▼ / United / Party / ▲ / Healthy / Treasury").
  - The progress bar width animates (`transition: width .6s`).
- **The removed readout**: "The floating change readout was removed at the player's request; result cards carry the changes" ([STATUS:85](docs/STATUS.md)).
- **Hub motion**: the "next" building pulses (`sop-next`, `sopPulse` 1.6s infinite) and "Show me" scrolls to the task and flashes it (`sop-flash`). Both respect reduced motion ([STATUS:101](docs/STATUS.md); [JSX:17822-17825](game/seat-of-power.jsx)).
- **Art available**:
  - 1,057 files under `public/art`: characters 315, scenes 208, decisions 199, objects 100, icons 94, backgrounds 64, badges 40, brand 10, compound 8 (`ls public/art/*`).
  - Lovable briefs: LOVABLE-ACHIEVEMENTS, CABINET, COUNCILS-TRADE, DECISIONS, DIPLOMACY(-2), FINANCE, HEADSCRATCHERS, INTERSTATE, MAILBOX, NEXT (careers packs 1-7), PRESIDENCY, SCREENS (Desk, decision card, council in session, year end), STRIKES-IMPEACH ([docs/](docs)).
  - The interstate trade art is still stand-ins ([STATUS:14](docs/STATUS.md)).
  - Characters have mood variants, for example `presidential-chief-of-staff-pleased/-angry` ([JSX:11862](game/seat-of-power.jsx)).
- **Player asks for more scenes and visuals**:
  - Victor: "more interactive… like actual scenes when we go for campaign maybe a little anima[tion]".
  - Others: "Let us walk and see how much is the state", "Make the voting like simulation so the governor can walk", and ribbon-cutting, Government House, Aso Rock meeting scenes.
  - Source: [feedback CSV](/root/.claude/uploads/6d547f60-c541-5156-9aeb-8af4391cce86/07ec93e3-seat-of-power-feedback_4.csv). The brief's theme count is "more scenes/visuals 5".

### Inferences
- Motion is concentrated in "ceremony" moments: flights, bills, mail, achievements, coins. Feedback on everyday state changes is thinner. With the words-meter pillar the delta chip is only an arrow, so a +1 and a +10 look the same.
- No motion connects a cause on screen to an effect on a meter, such as a chip flying from the card to the meter, or an animation on the hub building that changed (a project site, protest overlays appearing or disappearing after a choice).
- Coins exist only for money coming in. Money going out (spending, leaks on FAAC day under the `money` pillar) has no matching visual.

### Gaps
- I did not view the screenshots (AUDIT/*/shots) to judge how the motion actually looks. I counted keyframes by grep and did not test them at runtime.
- I could not tell which motion is on or off per experiment pillar beyond those noted.

## 3. Understandability, onboarding and reading load

### Takeaway
Onboarding is layered:
- a cold open (`front` pillar);
- a three-moment short start (`start`);
- a gentler year one (`stagger`);
- plain-word substitutions and a 25-word cap (`words`);
- a glossary that underlines terms;
- 💡 Hint and NEXT_SAY adviser lines;
- first-time row explanations on result cards;
- "Next: …" lines;
- a journey bar;
- five "How to play" picture cards.

The audits measured big cuts in words. Even so, "confusing / too much English" is still the top theme in feedback (15). Reading load stays high on adviser letters, the year-end, the treasury and the end-of-term story. Jargon such as "godfather", "FAAC" and "bill" persists on most screens.

### Cited Findings
- **Audit captures** (same seed, Ogun, two years; [AUDIT/before|after|round2/screens.json](/tmp/claude-0/-home-user-Seat-of-Power/6d547f60-c541-5156-9aeb-8af4391cce86/scratchpad/audit/)):
  - **Governing screen first view**: 306 words / 33 numbers before, then 170 / 16 after, then 151 / 13 in round 2. Scroll height went from 2,244 to 1,595 to 1,484 px, on an 844 px viewport.
  - **"firstView" metric**: 18 before, 13 after, 10 in round 2.
  - **Seconds to reach year 1 in the scripted run** (`year1sec`): 55 before, 47 after, 47 in round 2.
  - **Total**: 113, 135, 129. The `total` field's meaning is not documented in the JSON.
  - **Screen count**: 72 before, 65 after, 60 in round 2. `story: False` and `errors: []` in all three.
- **Heaviest screens in round 2**:
  - Adviser "How the last year went" (177 words, 20 numbers), "Your first year" (158/18) and "Year 2's/3's money is in" (152-166 words, 21-23 numbers).
  - "The treasury you inherited" (141/20) and "SPECIAL ADVISER · BY YOUR DESK / The year is done" (209/13).
  - The year end "REVENUE CHAMPION…" (151/13).
  - Before the rebuild, peaks were 685 words (screen 42, IGR/FAAC), 449 (ending cards) and 861 (wiki bio).
  - The round-2 ending is 99 words ("Your story").
- **Words the audit flags** (`jar` field):
  - Round 2 still shows "godfather" on most governing screens, plus "FAAC", "bill", "commissioner", "Speaker", "tribunal", "petition", "INEC" and "EFCC".
  - All-caps runs (`acr`) such as "OGUN, STATE, REF, GH" and "YOUR, DESK" appear on many screens.
  - Source: the round2 screens.json above.
- **The words test**: `tests/e2e/words.mjs` measured decision screens before the overhaul at 3,574 words on 49 screens (73 per screen). After, about 1,850 words on about 50 screens (35 per screen, −52%) ([STATUS:133-135](docs/STATUS.md)).
- **Cold open (`front` pillar)**: a first-time player starts on day one in office:
  - the FAAC credit alert;
  - three decisions (who to pay, Ward 7's borehole, ghost workers);
  - a ribbon cutting;
  - then "Six months earlier…" and the campaign.
  - Shown once (`sop_prologue`) and tracked as `ftue`.
  - Also: the 💡 Hint; tab descriptions in years 1-2; each number on a result card explained the first time (`ROW_HELP`, stored in `sop_rowhelp`); "Next: …" lines on year-one result cards (`SOP_NEXTLINE`); a 15% FAAC cushion.
  - Sources: [STATUS:196-202](docs/STATUS.md); [pillars.js:60-86](game/systems/pillars.js); [JSX:12138, 17624](game/seat-of-power.jsx); [HTML:582, 587](public/seat-of-power.html).
- **Short start (`start`, [express.js](game/systems/express.js))**:
  - The godfather's deal (all ₦1.2B, half, or none), one rally (home, the opponent's heartland, or the market), then election night counted district by district.
  - Win rates run from about 85% to about 45%. Then the oath and straight to Government House.
  - The first Chief of Staff is three cards of about 55 words.
  - Sources: [STATUS:317-321, 341-343](docs/STATUS.md). Round-2 screens 3-10 are 19-50 words each.
- **Gentler year one (`stagger`)**: an interim cabinet; the Head of Service letter waits; the budget is three stances; the Treasury visit is optional ([STATUS:324-326](docs/STATUS.md)).
- **Plain words (`words`, [plainwords.js](game/systems/plainwords.js))**:
  - Regex swaps: Appropriation Bill → budget law, Head of Service → top civil servant, Executive Council → cabinet, senatorial → district, constituency → home area, procurement → contracts, IGR → own revenue.
  - `cut25` caps cards at 2 sentences and 25 words.
  - A separate audit of formal words ("purchase", "initiate", "defer"…) is at [STATUS:164-185](docs/STATUS.md).
- **Glossary ([glossary.js](game/systems/glossary.js), 101 lines)**: underlines abbreviations and slang (FAAC, IGR, NLC, ASUU, INEC, EFCC, LGA, MoU, security vote, ghost workers, japa, omo onile…) using the browser's highlight feature. A tap shows the full name and one line of meaning ([STATUS:21-24](docs/STATUS.md)).
- **Adviser lines**:
  - `NEXT_SAY` holds the adviser's line per hub step ([JSX:12040-12045](game/seat-of-power.jsx)). `HINTS` holds one-sentence hints ([pillars.js:76-83](game/systems/pillars.js)).
  - "New this year…" introduces systems as they unlock: year 1 is the budget, needs and letters; tours and visits come in year 2; ASUU from year 3 ([STATUS:32-37](docs/STATUS.md)).
- **Other aids**:
  - "How to play" is five picture cards, plus "The full guide" ([STATUS:18-20](docs/STATUS.md)).
  - The journey bar (`Journey`, [JSX:5976-5990](game/seat-of-power.jsx)): Elected, years 1-4, Re-election, years 5-8, Legacy.
  - The "End of the first half-year" summary has a "Show me" button ([STATUS:99-101](docs/STATUS.md)).
- **Languages**: Pidgin, Yorùbá, Hausa and Igbo cover the cold open, hints, tabs, the four numbers, common buttons and card headings. Everything else stays in English ([STATUS:225-227](docs/STATUS.md)).
- **Feedback on understanding** ([feedback CSV](/root/.claude/uploads/6d547f60-c541-5156-9aeb-8af4391cce86/07ec93e3-seat-of-power-feedback_4.csv); 107 of 139 rows came from the year-2 prompt `fb_y2`):
  - "pls the english is to much 😮‍💨"
  - "Can't really understand some abbreviations. Also, so many things happening at once" (Funmi O)
  - "No clear instructions.. very confusing"
  - "I don't have the capacity to understand such higher level connection of this game. It is quite complex"
  - "I'm no Nigerian so there's some stuff I dont understand"
  - "I need a guide or help in. to play"
  - "Having to go online to learn the geo political zones… let there be a map for the political zones"
  - "I never win an election, I always go to the tribunal… I don't get how were supposed to do anything with just 5 agenda… I'm just very confused"
  - Theme counts given in the brief: confusing/too much English 15, other offices 14, money 11, more to do 9, repetitive 5, more scenes/visuals 5.

### Inferences
- The rebuild cut words roughly in half on the governing screen, and the first view now shows 10 items. Long reads remain on year-end and money moments (treasury, "money is in", the adviser's annual letter). Those screens carry the most numbers, which is where confused players are most likely to give up.
- The glossary works only by tapping. Players reading a second language, or new to Nigerian politics, may not know that underlined words can be tapped.
- "Godfather" appears as a meter and on nearly every screen, yet it is not in the plain-word swap list.
- The feedback CSV is dated up to 5 Nov, before or right at the round-2 rebuild and before the 11 Nov mailbox. Some complaints (the back button, mail, the dam bug) are already addressed.

### Gaps
- No post-rebuild feedback (after 5 Nov) was available to show whether the confusion theme dropped.
- The A/B pillar results (left under 5 minutes, reached an ending) live on the server dashboard and are not in the repository. STATUS says to trust a difference only once both groups have 100 or more players.
- I did not inspect the "How to play" card art or the cold-open screens visually.

## 4. Showing consequences of decisions (cause and effect, delayed effects, attribution)

### Takeaway
Immediate effects are well covered: `decide(fn)` snapshots the stats and shows a result card listing the real changes, and option chips (`fxChips`) preview the effects before a choice. Delayed effects are many: `delayedFx`, `revSched`, consequence seeds, chains, botched letters returning as fallout, zone asks. When delayed effects land, they mostly appear as one log line, or as a callback card, that does not point back to the original decision on screen. The year-end "What happened this year" lists up to five log lines with ▲/▼, again with no link from cause to effect. The ledger records causes but is used mainly for tribunal evidence and adviser signals, not as a player-facing timeline.

### Cited Findings
- **Immediate results**:
  - `decide(fn)` notes Approval, Treasury, Party, Corruption, Debt and the war chest, runs the decision, then shows the card with the real changes. `announce(o, before)` does the same for async flows.
  - Wired into statecraft cards, flagship choices, the tribunal, judicial reviews, revenue reforms, debt, firing, programmes, bills, orders, ministries, commissioner meetings, financing and project delivery.
  - When nothing moves at once, the card falls back to "effects over the coming half-years".
  - Sources: [STATUS:80-85](docs/STATUS.md).
- **Preview chips**: `fxChips(fx, dz)` builds chips such as "Approval +N", "Zone ±", "Costs ₦xB" plus where the money comes from (`fromChip`), "Party", "Corruption %", "Security" and "IGR +₦" ([JSX:6377-6385](game/seat-of-power.jsx)). The overhaul replaced option notes with chips ([STATUS:136-137](docs/STATUS.md)). Orders show "Answers: <need>" and effect chips ([JSX:15440-15444](game/seat-of-power.jsx)).
- **"What changed" component**: `Consequence` ("What changed because of the last decision") renders "**What changed:** …" in setup flows ([JSX:4883-4884](game/seat-of-power.jsx)).
- **Delayed effects**:
  - `delayedFx` is an array of `{turn, fx, desc}` ([JSX:5552](game/seat-of-power.jsx)), written from council-election fallout, wildcard `o.later`, programme payoffs (education +3 years; health and agriculture +2), NIC arrears and Chief of Staff results ([JSX:7675-7682, 7825, 7939, 9534-9536, 11754, 11786, 13631](game/seat-of-power.jsx)).
  - When due, they are applied silently to the stats, and each `desc` goes into the log via `addL("📈 …"/"⚠️ …")` ([JSX:11872-11878](game/seat-of-power.jsx)). No result card or meter-attributed animation is shown.
  - STATUS notes these "were stored but never applied" until the mailbox work fixed it ([STATUS:117](docs/STATUS.md)).
- **Revenue schedule**: `revSched` holds revenue reform effects scheduled for later turns (`{t, revIGR, id}`), applied at [JSX:7345-7350](game/seat-of-power.jsx) and set at [JSX:6446, 6512, 9933](game/seat-of-power.jsx).
- **Consequence engine** ([consequence.js](game/systems/consequence.js)):
  - `plant(S, key, n, data, delay=[1,3])` plants seeds. `withCallbacks` puts due callbacks at the front of a turn's queue as cards "with a named person".
  - Named NPCs carry relationships, with `relWord` giving "a firm ally" through "your enemy".
  - The player record carries across offices ("It comes back", [STATUS:914](docs/STATUS.md)).
- **Consequence chains** ([chains.js](game/systems/chains.js)): a finished programme leads, a year later, to a letter from the Commissioner about that place, and the year after to an investor offer. Others: armed groups at the halfway mark of big works; the Ease of Doing Business order → a court challenge; the Electoral Act → cleaner elections. Beats crowded out of a busy year come back ([STATUS:42-57](docs/STATUS.md)).
- **Other "it comes back" systems**:
  - A botched serious letter handed to the Chief of Staff returns as fallout next year ([STATUS:112-116](docs/STATUS.md)).
  - Zone asks become −2 or −3 only after a refusal or a broken promise ([STATUS:242-254](docs/STATUS.md)).
  - Godfather personas; budget formula deals that matter the year after ([JSX:7434](game/seat-of-power.jsx), "because you promised…").
  - Card memory across runs ([STATUS:263-266](docs/STATUS.md)).
- **Ledger (`SOP_LEDGER`, [public/sop-ledger.js](public/sop-ledger.js))**:
  - An append-only, frozen record (kind, actor, gravity, evidence, decision, note, approvalDelta, meta), written at about 40 sites. Examples: `project_abandoned`, `need_ignored`, `revenue_reform`, `state_crisis` ([JSX:6117, 6130, 6451, 7029](game/seat-of-power.jsx)).
  - Consumers are `ledgerTribunalStrength()` and `ledgerSaSignals()`, read-only. It is also filtered per cast member ([JSX:5677-5678](game/seat-of-power.jsx)) and saved ([JSX:5724, 5745](game/seat-of-power.jsx)).
  - The shim header says discovery-driven events must wait for a reducer swap.
- **Year and half-year review**:
  - At budget time, "Your first year" / "How the last year went" is a `SOP_outcome` card. Its text is the last 3 success, crisis or scandal log lines from the previous turn (first sentences only, or "A quiet six months."). Its rows are `statRows(prev.snap, snap)` filtered to big moves, plus honours and "Still open: N case files…" ([JSX:5940-5966](game/seat-of-power.jsx)).
  - The year-end screen (`lv-ey`, [JSX:15452-15478](game/seat-of-power.jsx)) has a front page with a headline, the sealed teaser letter for next year (`teaser()`, [JSX:12048-12058](game/seat-of-power.jsx)), and "What happened this year" (up to 5 log lines with ▲/▼ icons). "📋 Full year review" opens `SOP_CIVIC.showReview()`.
- **"Because" text is rare**: about 11 occurrences in the JSX. Examples:
  - "The House voted it down… voted no because …" ([JSX:10017](game/seat-of-power.jsx))
  - "Filed after you …" as a court-case `cause` ([JSX:10052](game/seat-of-power.jsx))
  - "Below 40% approval, the House blocks bills because members fear losing their seats" ([JSX:9401](game/seat-of-power.jsx))
  - The ministry-from-uncle line ([JSX:10950](game/seat-of-power.jsx))
- **Player feedback on consequences and control**:
  - "Explain how to easily reverse projects or stop them" (Funmi O)
  - "we need to know how to undo what was done"
  - "Instead of getting a minus from other zones…" (led to zone asks)
  - "The president is too angry for anything that people does for him"
  - "Not every person who comes after your tenure ends should turn against you"
  - Source: [feedback CSV](/root/.claude/uploads/6d547f60-c541-5156-9aeb-8af4391cce86/07ec93e3-seat-of-power-feedback_4.csv).

### Inferences
- **The attribution gap is mainly in the delayed path.** The `delayedFx` application changes meters at the start of a turn and only adds a log line. The `words` meters then show ▲/▼ with no reason. The year-end lists outcomes without their origins.
- The ledger already stores the decision text and an `approvalDelta` per consequential act. It is the natural data source for a "because you…" link or a timeline. Today it is only used for tribunal evidence and adviser signals.
- "Year-end review" text is the first sentence of up to three log lines. It does not say which of the player's choices caused each meter change in `rows`.
- Complaints about undoing things and feeling punished ("too angry") suggest that players do not see the link from cause to effect, or the chance to recover, before a penalty lands. Zone asks were a fix of this kind and could serve as a template.

### Gaps
- I did not read `SOP_CIVIC.showReview()` ("Full year review"), which may already show more attribution. It is defined outside the files I read; the search found it as a window global.
- I did not check how callback cards from `consequence.js` word their reference to the original choice for the governor (the career tables are in the career systems).

## 5. Known weak spots, collected (for recommendations not to duplicate)

### Takeaway
Much has already been tried and either kept or rolled back by the owner, including the floating readout, the motorcade, letters drawn in the slot, and an in-year checklist. Recommendations should build on the existing hooks: `SOP_outcome`, `StatPill`, `hubNext`, `delayedFx`, `SOP_LEDGER`, `ROW_HELP`, `SOP_NEXTLINE` and the pillar split. They should not reintroduce what was removed.

### Cited Findings
- **Removed or declined at the owner's or players' request**:
  - The floating change readout ([STATUS:85](docs/STATUS.md)).
  - The motorcade on the hub ([STATUS:76](docs/STATUS.md)).
  - The in-year checklist and time estimate ([STATUS:28](docs/STATUS.md)).
  - "How it really works" boxes on result cards ([HTML:588 comment](public/seat-of-power.html)).
  - The News tab ([JSX:12526](game/seat-of-power.jsx)).
  - The inauguration and First 100 Days ([STATUS:297](docs/STATUS.md)).
  - Letters drawn sitting in the slot ([STATUS:368-371](docs/STATUS.md)).
- **Experiment pillars live**: front, wait, money, integrity, plan, region (the first six), plus the rebuild pillars start, screen, stagger, words and drama. Each can be switched with `?exp=` ([STATUS:187-192, 309-311](docs/STATUS.md)). Any new recommendation can be tested the same way.
- **Most common feedback asks beyond clarity**:
  - More decisions per year ("only 6 things a governor can do in a year", "SIX decision for an entire year").
  - Money is too hard or too tight ("make it easier to earn money", "I have to take loans").
  - Other offices: Senate, Reps, president after the governorship.
  - Repetitive restarts.
  - Source: [feedback CSV](/root/.claude/uploads/6d547f60-c541-5156-9aeb-8af4391cce86/07ec93e3-seat-of-power-feedback_4.csv).

### Inferences
- The owner's history leans toward less on-screen noise. Motion that explains a consequence, short and skippable and respecting reduced motion like the mailbox pilot, fits that history better than ambient animation.

### Gaps
- I could not verify at runtime which pillars a typical player gets. Assignment is random per player.
