# Seat of Power — Art Library

All game art lives here, served at `/art/...` (e.g. `./art/characters/godfather.webp` from `public/seat-of-power.html`). Shipped as WebP, resized for phones (characters 700px tall, backgrounds 1280px wide); the original PNGs are in Seat_of_Power_Art.zip.
Style: stylised flat-shaded cartoon, bold outlines (iCivics Executive Command look). Fictional people only.

Older art (anchors, av-agbada/babariga/isiagu/female, hero-*, sa-adebayo/halima, title-duo, crest, map-statehouse, anchor-backdrop) is CDN-hosted; pointers in `src/assets/*.asset.json` (use the `url` field).

## characters/ (transparent, waist-up)
- governor-male-agbada / -isiagu / -kaftan / -suit / -babariga; governor-female-agbada / -isiagu / -kaftan / -suit — the candidate picker
- special-adviser — the single SA for the whole game
- Cast: godfather, speaker, reporter, efcc-investigator, rival, labour-leader
- Deputies (picked by region, `deputyArt`): deputy-male (north), deputy-southern-male-isiagu (SE/SS), deputy-male-suit (SW), deputy-female, deputy-northern-female-hijab (north)
- Commissioners (Cabinet cards, `commissionerArt`): commissioner-male-suit / -male-agbada, commissioner-female-suit / -female-kaftan, commissioner-technocrat
- Scene figures (`DILEMMA_ART`, `SHOCK_ART`, `investorArt`): doctor, nurse, teacher, market-trader, young-voter-student, police-commissioner, soldier, judge (every courtroom), traditional-ruler-emir / -oba-obi, investor-nigerian, expatriate-engineer, permanent-secretary, party-chairman (re-election; the godfather-pleased / godfather-angry files show the same green-cap man, so they are the chairman's mood when party stability is high or low)
- anchor-male (Ibrahim Danjuma, navy suit, glasses) and anchor-female (Funmi Okeowo, burgundy suit): the permanent State House Report anchors.
- Mood sets: special-adviser-pleased/-worried/-angry are the press secretary beside media events; governor-pleased is the wedding host and governor-pleased/-worried/-angry the end screen for the isiagu governor; deputy-pleased/-worried/-angry are a south-western deputy by loyalty; godfather-pleased/-worried/-angry are the party chairman by party stability; opposition-candidate-alt is the opposition spokesman in the smear dilemma; doctor-male is the health flagship.

## backgrounds/ (1280px WebP)
- Public: rally, tv-studio, collation-centre, polling-unit (election day), government-house (title + taking office), party-convention-hall (re-election), street-protest, busy-market-street, flooded-community, hospital-ward, classroom, road-construction-site (investors), emirs-palace-courtyard, airport-arrivals (foreign trips)
- Administrative: governor-office, assembly-chamber (bills), courtroom, abuja-federal-office (federal events, Abuja summons, economic shocks)
- Private: veranda-night, back-room (intelligence reports)

## objects/ (transparent)
- memo-folder (intelligence reports), court-summons (NIC rulings, constitutional challenges), ballot-paper (election results), bank-transfer-slip (naira and banking crises), contract-envelope (capital-project intake), bill-document (Bills tab)
- newspaper (newspaper and blog stories), ringing-phone (radio), phone-message-frame (social media, with the story drawn on its screen: PhoneMsg)
- news-front-page-blank (each half-year's headline set on the front page: FrontPage), wiki-share-card-blank (end-of-tenure share card: ShareCard)
- tab-desk / tab-map / tab-people / tab-wiki (main tab bar)

## brand/
state-seal (invented — use instead of the old national "crest"), title-logo, app-icon (browser and home-screen icon)

## Art pack 2: money (26 images, all in use; checked by tests/art-usage.test.mjs)
- **scenes/** (new folder, 1280px wide), each on a result card with its picture:
  - money stories from commissioners (`SYS.ministryWindfall` / `ministryWaste`): money-agric-exports, money-vaccination-grant, money-education-grant, money-road-tolls, money-markets-reopened, money-revenue-drive, money-savings-returned, money-wasted;
  - deals: money-deal-signed-abroad (the Dutch deal), money-federal-intervention (the Abuja fund), money-investor-factory (an approved investor);
  - Year 1: inherited-debt (the debt choice), ghost-workers-purge (the payroll audit's result).
- **objects/:**
  - treasury-chest (each year's money card) and treasury-chest-empty (Year 1, or nothing left);
  - unpaid-invoices ("The state can't pay for this");
  - faac-envelope, igr-receipt-stack and debt-ledger-book (the three sources in the Desk's Money panel);
  - coins-burst behind the chest, and coin-1…4 (one coin turning) rising when money arrives. These are off with reduced motion.
- **backgrounds/finance-ministry-office** with **characters/finance-commissioner:** the top of the Money panel.
- **Not used, on purpose:** compound-base, compound-base-night, the motorcade frames and o-motorcade (retired when the convoy was removed at the player's request; compound-full is the map).

## Art pack 2: stamps (removed)
- **Removed at the player's request:** the nine stamp images and the stamp layer (`SOP_stamp`).
- **Kept:** bill-paper-blank and governor-signature-pen. Signing a bill (`SOP_billSign`) shows the page with the bill's title and clauses, and the pen writes the governor's name.

## Art pack 2: elections and projects (12 images, all in use; checked by tests/art-usage.test.mjs)
- **Project sites** (`siteArt(p)`): project-site-cleared (waiting for money or a contractor, and the contract-signed dossier), project-site-halfway (under construction from 35%, or built), project-site-stalled (stalled, suspended, abandoned), project-ribbon-cutting (open, and the "is open" card). The full picture shows in the single dossier; portfolio cards show a thumbnail.
- **map-pin-project-grey / gold / green / red** (`pinOf(p)`): the stage marker beside each project's status (planned, building, open, stalled).
- **Elections:**
  - scenes/declaration heads a win (first election and re-election), and scenes/second-election when the leader missed the 25% spread (the ballot paper stays on a loss);
  - backgrounds/collation-board-lga and objects/result-sheet-blank head "See the full count".

## Known issues to fix later
- Some images still show the national coat of arms (governor-female-agbada, governor-female-kaftan, deputy-male, deputy-female, speaker mace, collation-centre, governor-office, assembly-chamber, courtroom). Regenerate or edit before shipping.
- labour-leader shirt reads "Nigeria Labour Union"; deputy-male badge says "Kaduna State".
- Not yet made: LGA SVG map (Lagos).

## Art pack 2: adviser, House, campaign and moods (83 pictures)
- **The adviser's full figure** (`adviser-*-full-{neutral,pleased,worried,urgent}`):
  - Stands beside the speech bubble on the Desk.
  - The pose follows the news: urgent for alerts, worried for debts and failures, pleased for good news.
- **The House:**
  - The vote screen shows `assembly-chamber-wide` with the Speaker: plain before the vote, `speaker-worried` when it is blocked, `speaker-pleased` when it passes, `speaker-angry` when it is rejected.
  - The seat tally sits on `vote-tally-board`.
  - Each objection carries a lawmaker's face: `lawmaker-godfather-loyalist`, `lawmaker-opposition-leader`, `lawmaker-majority-leader` or `lawmaker-backbencher`.
  - The three ways to clear the House show `back-room-settlement`, `party-elders-meeting` and `town-hall-appeal`.
  - A deal with the Speaker shows `constituency-project-sign`.
- **The campaign:**
  - Every move card has its `camp-*` scene.
  - Each opponent attack shows its `attack-*` scene.
- **Moods:**
  - **The deputy** wears the region's dress and shows their loyalty (pleased, worried, angry).
  - **Commissioners** look pleased above 65% performance and worried below 40%.
  - **The party chairman** reacts in the party card.
  - **The godfather** reacts to your relationship when he makes a demand.
  - **"The street"** shows market women, youth or workers, cheering or angry.
- **Removed:** the old `deputy-angry`, `deputy-pleased` and `deputy-worried` (the wrong face).

## Councils, trade and exports pack (35 images)
- icons/: seal-fec, seal-nsc, seal-eac, seal-exco, seal-rulers, seal-econ — each council's wax seal, beside its name and at the centre of its table (SEAL_ART); icon-trade, icon-reserves, icon-food-prices, icon-exports — the Economic Advisory Council's figures and the governor's export earnings
- backgrounds/: council-table-federal (FEC, its retreat, the Economic Advisory Council), council-table-security (the National Security Council), council-table-state (the governor's Executive Council and State Economic Council), council-table-palace (the Traditional Rulers Council in the South; the emir's courtyard in the North)
- characters/: trade-minister (±pleased/angry by exports), customs-comptroller (±pleased/angry by smuggling, or Abuja's stance for a governor), farmers-association-chair (±pleased/angry by the farms' safety) — the economic councils and the trade storylines; exporter (State Economic Council, export storylines); chief-economic-adviser (Economic Advisory Council); chief-of-defence-staff and dss-director-general (National Security Council)
- scenes/: deep-seaport, dry-port-kano, cargo-rail (building and opening the trade infrastructure; the dry port also for a governor's container depot), export-containers (export plans and buyers), aflatoxin-lab (rejected shipments), border-smuggling (the smugglers' border), bdc-street (the money-changers), factory-closed (the Agbara closure)
