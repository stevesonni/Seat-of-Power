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

## Known issues to fix later
- Some images still show the national coat of arms (governor-female-agbada, governor-female-kaftan, deputy-male, deputy-female, speaker mace, collation-centre, governor-office, assembly-chamber, courtroom). Regenerate or edit before shipping.
- labour-leader shirt reads "Nigeria Labour Union"; deputy-male badge says "Kaduna State".
- Not yet made: LGA SVG map (Lagos).
