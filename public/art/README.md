# Seat of Power — Art Library

All game art lives here, served at `/art/...` (e.g. `./art/characters/godfather.webp` from `public/seat-of-power.html`). Shipped as WebP, resized for phones (characters 700px tall, backgrounds 1280px wide); the original PNGs are in Seat_of_Power_Art.zip.
Style: stylised flat-shaded cartoon, bold outlines (iCivics Executive Command look). Fictional people only.

Older art (anchors, av-agbada/babariga/isiagu/female, hero-*, sa-adebayo/halima, title-duo, crest, map-statehouse, anchor-backdrop) is CDN-hosted; pointers in `src/assets/*.asset.json` (use the `url` field).

## characters/ (transparent PNG, waist-up, neutral expression)
- governor-male-agbada / -isiagu / -kaftan / -suit / -babariga
- governor-female-agbada (aso-oke + gele) / -isiagu / -kaftan / -suit
- special-adviser — the single SA for the whole game
- godfather, deputy-male, deputy-female, speaker, reporter, efcc-investigator, rival, labour-leader
- News anchors: reuse existing CDN anchor-male / anchor-female

## backgrounds/ (1920x1088 JPG, landscape)
- Public: rally, tv-studio, collation-centre, government-house (title + inauguration)
- Administrative: governor-office, assembly-chamber, courtroom
- Private: veranda-night, back-room

## objects/ (transparent PNG)
memo-folder, bill-document, ringing-phone, newspaper, contract-envelope, court-summons

## brand/
state-seal (invented — use instead of the old national "crest"), title-logo, app-icon

## Known issues to fix later
- Some images still show the national coat of arms (governor-female-agbada, governor-female-kaftan, deputy-male, deputy-female, speaker mace, collation-centre, governor-office, assembly-chamber, courtroom). Regenerate or edit before shipping.
- labour-leader shirt reads "Nigeria Labour Union"; deputy-male badge says "Kaduna State".
- Not yet made: pleased/angry expression variants, LGA SVG map (Lagos), Wikipedia share card template.
