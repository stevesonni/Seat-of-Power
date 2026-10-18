# Art pack 2: what to make next

This pack covers what the game needs for the next round of work:
- the House of Assembly as a living place;
- money you can see moving;
- the adviser and the main cast reacting to what you do;
- decisions that feel like game moments;
- endings worth collecting.

Everything here has a named place in the game. Nothing is decorative filler.

## House style (same as pack 1)
- **Look:** stylised flat-shaded cartoon with bold dark outlines, the iCivics "Executive Command" look. The palette is warm cream, deep green `#0b6b42` and gold `#e9b949`, with red `#b3261e` for danger.
- **People:** fictional only. No real politicians and no look-alikes.
- **Things to keep off every image:**
  - the national coat of arms;
  - real party logos;
  - real bank, union or company names;
  - real newspaper mastheads.

  Use the invented state seal (`brand/state-seal`) wherever an emblem is needed.
- **Text inside images:** none, unless listed below. The game draws its own text on top.
- **Formats:**
  - **Characters:** transparent PNG, waist-up, facing slightly left or right, about 1400px tall. The game ships them as WebP at 700px.
  - **Backgrounds:** 2560×1440 PNG, shipped at 1280px. Keep the centre third calm, because cards sit over it.
  - **Objects and icons:** transparent PNG, square, 1024px.
- **Mood sets:** each mood is the same person as the base image, with the same face, outfit, hair and proportions. Only the expression and pose change.

  Pack 1 broke this rule: the "mood" images show different people, so they can't be used for the main cast. Make each mood from the base image as a reference, not from a text prompt alone.

## Tier 1: needed for the next build (House, money, adviser)

### The House of Assembly
| File | Kind | Where it's used | Prompt notes |
|---|---|---|---|
| `backgrounds/assembly-chamber-wide` | background | The new budget and bill vote: the whole chamber, as a stage for the yes/no tally | A Nigerian state House of Assembly chamber seen from the gallery. Semicircle of green-leather seats, the Speaker's raised chair at the centre and a mace on the table. **State seal, not the coat of arms.** About 30 seated members as simple silhouettes, so the game can colour them. |
| `characters/speaker-pleased` | mood | The vote passes, or a deal is struck | Same person as `characters/speaker`: a satisfied half-smile, gavel lowered. |
| `characters/speaker-worried` | mood | The vote is close | Same person: brow furrowed, glancing sideways. |
| `characters/speaker-angry` | mood | Rejected, or you forced the budget through | Same person: gavel raised, jaw set. |
| `characters/lawmaker-majority-leader` | character | Leads your bloc. Lobbying cards | A middle-aged man in a senator-style kaftan and cap, reading glasses, holding a folder. Confident. |
| `characters/lawmaker-opposition-leader` | character | Leads the opposition bloc. Lobbying cards | A woman in her 40s in a sharp wrapper and blouse with a gele. Arms folded, sceptical. |
| `characters/lawmaker-godfather-loyalist` | character | The godfather's members, when they block you | A younger man in agbada with a heavy gold watch and a phone to his ear. Smug. |
| `characters/lawmaker-backbencher` | character | Undecided members you can win over | An older man in a simple buba and cap, an ordinary face, looking unsure. |
| `objects/vote-tally-board` | object | Behind the live yes/no count | An empty wooden board with two blank columns. No text. |
| `objects/constituency-project-sign` | object | The price of a deal with the House | A blank roadside project signboard on two poles. No text. |

### Money you can see
| File | Kind | Where it's used | Prompt notes |
|---|---|---|---|
| `objects/treasury-chest` | object | The money panel: what came in this year | A sturdy green metal strongbox, lid open, neat stacks of naira-coloured notes (no legible text). |
| `objects/faac-envelope` | object | The federal allocation arriving each year | A large official brown envelope with a green band and a blank seal. |
| `objects/igr-receipt-stack` | object | Own revenue: taxes collected | A spike of paper receipts beside a small POS terminal. |
| `objects/debt-ledger-book` | object | Debt and debt service | A thick bound ledger, open, with a red ribbon marker. Columns but no readable numbers. |
| `objects/coins-burst` | effect | The receipt animation. Only plays after money is recorded | A small burst of gold coins and notes, transparent background. Also make 4 single coins as separate files for animation. |
| `backgrounds/finance-ministry-office` | background | Money decisions, loan offers, debt relief | A Ministry of Finance office: filing cabinets, a wall chart with a rising line (no numbers), a window over a busy city. |
| `characters/finance-commissioner` | character | Presents the money panel and loan offers | A woman in her 50s in a tailored suit and glasses on a chain, holding a calculator. Precise, a little stern. |

### The Special Adviser, reacting
Each adviser the player can choose needs a matching mood set, made from that adviser's own portrait:

| File | Kind | Where it's used |
|---|---|---|
| `characters/adviser-southwest-female-pleased` / `-worried` / `-urgent` | mood ×3 | The adviser at your desk: calm, warning, or urgent |
| `characters/adviser-north-female-pleased` / `-worried` / `-urgent` | mood ×3 | the same |
| `characters/adviser-north-male-pleased` / `-worried` / `-urgent` | mood ×3 | the same |
| `characters/adviser-southeast-male-pleased` / `-worried` / `-urgent` | mood ×3 | the same |

What each mood shows:
- **Pleased:** a warm smile.
- **Worried:** a hand at the chin, eyes down at a folder.
- **Urgent:** leaning in, one hand raised to stop you, folder held out.

## Tier 2: decisions as game moments

### Stamps and seals
These are drawn as images, so they look inked rather than typed. They are transparent PNG at 1024px, slightly rotated, with uneven ink. Each one contains text, as noted.

| File | Text in the image | Where it's used |
|---|---|---|
| `objects/stamp-approved` | APPROVED | Project and budget approval |
| `objects/stamp-funded` | FUNDED | A loan offer accepted |
| `objects/stamp-contract-signed` | CONTRACT SIGNED | Contract award |
| `objects/stamp-passed` | PASSED | A bill or budget passed by the House |
| `objects/stamp-rejected` | REJECTED | The House votes it down |
| `objects/stamp-signed-into-law` | SIGNED INTO LAW | The governor signs a bill |
| `objects/stamp-commissioned` | COMMISSIONED | A project opens |
| `objects/governor-signature-pen` | (none) | The pen that signs, animated across the page before the stamp |

### Who's in the room
| File | Kind | Where it's used |
|---|---|---|
| `characters/party-chairman` with `-pleased` and `-angry` moods | mood ×2 | Party reactions on decision cards. Pack 1's chairman moods show a different man, so make these from `party-chairman` itself |
| `characters/godfather` mood set: `-pleased`, `-worried`, `-angry` | mood ×3 | The godfather reacting to your choices. These must keep his face (pack 1's set changed it) |
| `characters/commissioner-*` moods: pleased and worried for each of the five commissioner portraits | mood ×10 | A commissioner reacting to a decision about their ministry |
| `characters/market-women-group` | character group | The street's reaction, previewed on a decision before you sign | Three market women together, arms crossed or cheering. Make two versions: `-cheering` and `-angry` |
| `characters/youth-group` | character group | The same, for young voters online | Three young people with phones. `-cheering` and `-angry` |

### Projects you can see
| File | Kind | Where it's used |
|---|---|---|
| `backgrounds/project-site-cleared` | background | A project at contract signed: the site cleared and pegged |
| `backgrounds/project-site-halfway` | background | Under construction: a half-built structure, a crane, workers |
| `backgrounds/project-site-stalled` | background | Stalled or abandoned: an overgrown, rusted frame, a faded empty sign |
| `backgrounds/project-ribbon-cutting` | background | The opening scene when a project is delivered: a ribbon, a crowd, a canopy and drummers |
| `objects/map-pin-project` | icon | Map markers for each stage. Make 4 colour versions: grey (planned), gold (building), green (open) and red (stalled) |

## Tier 3: endings and collecting

### Ending badges
These go in a gallery of titles you have earned and titles still locked. Each is a round enamel badge, 1024px, with a small scene, and no text (the game prints the title). Also make one generic `badge-locked` silhouette.

| File | Ending or title |
|---|---|
| `objects/badge-the-builder` | The Builder: roads and cranes |
| `objects/badge-promise-keeper` | Promise Keeper: a handshake |
| `objects/badge-mr-autopilot` | Mr Autopilot: an empty chair with a jacket on it |
| `objects/badge-owed-salaries` | The Governor Who Owed Salaries: an empty pay envelope |
| `objects/badge-impeached` | Impeached: a mace and a broken gavel |
| `objects/badge-nullified` | Removed by the Supreme Court: the court's pillars |
| `objects/badge-bankrupt` | State Bankrupt: an empty strongbox |
| `objects/badge-two-terms` | Two Terms: two laurel leaves |
| `objects/badge-president` | President: the presidential villa's dome (fictional design) |
| `objects/badge-successor-betrayed` | Betrayed by the Successor: a knife in a handshake, kept light |

### Ending scenes
| File | Where it's used |
|---|---|
| `backgrounds/handover-ceremony` | Handover to your successor: a stage and two chairs |
| `backgrounds/governor-leaving-motorcade` | Voted out: an empty Government House gate at dusk |
| `backgrounds/efcc-headquarters` | The anti-corruption agency invites you in. A fictional building with no real logo |

## Fixes to pack 1 (regenerate or edit)
These are already flagged in `public/art/README.md`:
- **National coat of arms:** remove it from `governor-female-agbada`, `governor-female-kaftan`, `deputy-male`, `deputy-female`, the `speaker` mace, `collation-centre`, `governor-office`, `assembly-chamber` and `courtroom`. Use the state seal instead.
- **`labour-leader`:** the shirt reads "Nigeria Labour Union"; make it plain.
- **`deputy-male`:** the badge says "Kaduna State"; make it plain.
- **Mood sets that changed face:** `godfather-*`, `deputy-*` and `governor-*` moods. Replace them with sets made from each base image.

## Counts
| Tier | Images |
|---|---|
| 1: House, money, adviser | 29 (plus 4 single coins for the animation) |
| 2: decisions, reactions, projects | 35 (including 4 map-pin colours) |
| 3: endings | 14 |
| Pack 1 fixes | about 19 |
| **Total** | **about 100** |

If that's too many at once, Tier 1 alone unlocks the next build: the House vote, the money panel and the reacting adviser.

## Hand-off
- **Naming:** names match the paths above, so the files drop straight into `public/art/` and convert with the existing WebP script.
- **No commercial step taken:** no image has been generated or bought. Choosing a tool or an artist is your call.
