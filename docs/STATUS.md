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
