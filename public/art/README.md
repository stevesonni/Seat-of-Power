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
- Not used yet: governor-pleased/-angry/-worried, deputy-pleased/-angry/-worried, godfather-worried, special-adviser-pleased/-angry/-worried, opposition-candidate-alt, doctor-male. The mood sets show different people from the neutral portraits (different face and dress), so they would change who the player is looking at. Use them once matching neutral portraits exist.

## backgrounds/ (1280px WebP)
- Public: rally, tv-studio, collation-centre, polling-unit (election day), government-house (title + taking office), party-convention-hall (re-election), street-protest, busy-market-street, flooded-community, hospital-ward, classroom, road-construction-site (investors), emirs-palace-courtyard, airport-arrivals (foreign trips)
- Administrative: governor-office, assembly-chamber (bills), courtroom, abuja-federal-office (federal events, Abuja summons, economic shocks)
- Private: veranda-night, back-room (intelligence reports)

## objects/ (transparent)
memo-folder, bill-document, ringing-phone, newspaper, contract-envelope, court-summons, ballot-paper, bank-transfer-slip, news-front-page-blank, phone-message-frame, wiki-share-card-blank; tab-desk / tab-map / tab-people / tab-wiki (main tab bar)

## brand/
state-seal (invented — use instead of the old national "crest"), title-logo, app-icon

## Known issues to fix later
- Some images still show the national coat of arms (governor-female-agbada, governor-female-kaftan, deputy-male, deputy-female, speaker mace, collation-centre, governor-office, assembly-chamber, courtroom). Regenerate or edit before shipping.
- labour-leader shirt reads "Nigeria Labour Union"; deputy-male badge says "Kaduna State".
- Not yet made: LGA SVG map (Lagos).
