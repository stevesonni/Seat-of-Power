# Art pack 2: every new image the game needs

*22 October 2026. For Lovable. Every image has a file name, where it appears in the game, and a prompt.*

## How to use this list
1. **Paste the house style block (below) at the top of every prompt**, then the image's own prompt.
2. **For a mood or a pose of an existing person,** attach that person's current image from `public/art/characters/` as the reference, and say "same person, same face, same outfit". Never make a mood from text alone. Pack 1's moods changed the person's face, so the game can't use them.
3. **Name each file exactly as listed.** It then drops into `public/art/` and goes through the existing WebP conversion.
4. **Deliver in tiers.** Tier 1 unlocks the next build.

## House style (paste into every prompt)
> Stylised flat-shaded cartoon with bold dark outlines, in the style of an educational civics game (iCivics "Executive Command"). Warm cream background tones, deep green #0b6b42, gold #e9b949, red #b3261e for danger. Set in a fictional Nigerian state. All people are fictional, with no resemblance to real politicians. No national coat of arms, no real party logos, no real bank, union, company, foundation or newspaper names, no readable text unless asked for. Where an emblem is needed, use a simple invented green-and-gold state seal.

## Formats
| Kind | Format | Size | Notes |
|---|---|---|---|
| Character (waist-up) | transparent PNG | about 1400px tall | Facing slightly left or right |
| Character (full body) | transparent PNG | about 2000px tall | Standing, whole figure, feet visible |
| Group | transparent PNG | 2000px wide | 3 people side by side |
| Background | PNG | 2560×1440 | Keep the centre third calm, because cards sit over it |
| Scene (small) | PNG | 1600×900 | For cards: one clear subject |
| Object or icon | transparent PNG | 1024×1024 | One object, centred |
| Badge | transparent PNG | 1024×1024 | Round enamel badge |
| Stamp | transparent PNG | 1024×1024 | Inked look, slightly rotated, uneven ink |

---

## TIER 1: needed for the next build

### 1. The Special Adviser, full body (the desk character)
This is like the adviser in Executive Command: a full figure standing beside the speech bubble, not a small round photo. Make the same four people the player can choose, from their current portraits (`characters/adviser-*`), in four poses each.

| File | Pose |
|---|---|
| `characters/adviser-southwest-female-full-neutral` | Standing, holding a red folder to her chest, a calm half-smile |
| `characters/adviser-southwest-female-full-pleased` | Warm smile, one hand open as if presenting good news |
| `characters/adviser-southwest-female-full-worried` | Hand at chin, looking down at an open folder |
| `characters/adviser-southwest-female-full-urgent` | Leaning in, one hand raised to stop you, folder held out |
| `characters/adviser-north-female-full-` `neutral` / `pleased` / `worried` / `urgent` | The same four poses |
| `characters/adviser-north-male-full-` `neutral` / `pleased` / `worried` / `urgent` | The same four poses |
| `characters/adviser-southeast-male-full-` `neutral` / `pleased` / `worried` / `urgent` | The same four poses |

**16 images.**

### 2. The House of Assembly
| File | Kind | Where it's used | Prompt |
|---|---|---|---|
| `backgrounds/assembly-chamber-wide` | background | The budget and bill vote: the whole chamber, with the yes/no count | A state House of Assembly chamber seen from the public gallery. A semicircle of green-leather seats, the Speaker's raised chair at the centre, a mace on the table, the state seal on the wall. About 30 seated members as plain silhouettes. |
| `characters/speaker-pleased` | mood | The vote passes, or a deal is struck | Same person as `characters/speaker`: a satisfied half-smile, gavel lowered |
| `characters/speaker-worried` | mood | The vote is close | Same person: brow furrowed, glancing sideways |
| `characters/speaker-angry` | mood | Rejected, or you forced the budget through | Same person: gavel raised, jaw set |
| `characters/lawmaker-majority-leader` | character | Leads your bloc | A middle-aged man in a kaftan and cap, reading glasses, holding a folder; confident |
| `characters/lawmaker-opposition-leader` | character | Leads the opposition bloc | A woman in her 40s in wrapper, blouse and gele; arms folded, sceptical |
| `characters/lawmaker-godfather-loyalist` | character | The godfather's members when they block you | A younger man in agbada with a heavy gold watch, phone to his ear; smug |
| `characters/lawmaker-backbencher` | character | Undecided members you can win over | An older man in a simple buba and cap, ordinary face, unsure |
| `scenes/party-elders-meeting` | scene | "Make peace through the party elders" | Five elderly men and women in traditional dress around a low table in a sitting room, tea cups, one elder raising a hand to calm the room |
| `scenes/town-hall-appeal` | scene | "Go over their heads to the voters" | The governor (generic, seen from behind) on a town-hall stage with a microphone, a packed hall of ordinary people, some cheering |
| `scenes/back-room-settlement` | scene | "Pay the godfather what you owe" | A dim back room, two men's hands shaking over a table with a closed envelope, a whisky glass, curtains drawn |
| `objects/vote-tally-board` | object | Behind the live yes/no count | An empty wooden board with two blank columns |
| `objects/constituency-project-sign` | object | The price of a deal with the House | A blank roadside project signboard on two poles |

**13 images.**

### 3. Money: where it comes from and where it goes
**The bank and the year's money**

| File | Kind | Where it's used | Prompt |
|---|---|---|---|
| `objects/treasury-chest` | object | "In the bank": the year's money card | A sturdy green metal strongbox, lid open, neat stacks of green-and-gold notes (no readable text) |
| `objects/treasury-chest-empty` | object | Year 1: "the last government left the bank empty" | The same strongbox, open and empty, a single moth flying out |
| `objects/faac-envelope` | object | FAAC from Abuja | A large official brown envelope with a green band and a blank wax seal |
| `objects/igr-receipt-stack` | object | Taxes and fees | A spike of paper receipts beside a small card terminal |
| `objects/debt-ledger-book` | object | Debt and repayments | A thick bound ledger, open, with a red ribbon marker; columns, no readable numbers |
| `objects/unpaid-invoices` | object | "Bills left unpaid" | A tall untidy pile of invoices and contractor certificates tied with string, some red-stamped (no readable text) |
| `objects/coins-burst` | effect | The money-received animation | A burst of gold coins and notes. Also make 4 single coins as separate files: `coin-1` to `coin-4` |
| `backgrounds/finance-ministry-office` | background | Money decisions, loan offers, debt relief | A Ministry of Finance office: filing cabinets, a wall chart with a rising line (no numbers), a window over a busy city |
| `characters/finance-commissioner` | character | Presents the money card and the debt choice | A woman in her 50s in a tailored suit, glasses on a chain, holding a calculator; precise, a little stern |
| `scenes/inherited-debt` | scene | The Year 1 debt choice: "the state owes ₦X" | A long desk piled with old loan files, a dusty portrait frame of an unnamed former governor turned to the wall, a ledger open in front |
| `scenes/ghost-workers-purge` | scene | "Purge ghost workers" | A civil-service hall with a queue of workers having fingerprints scanned; on a big screen behind, a payroll list where some photos are blank grey silhouettes |

**Commissioners who deliver bring money in** (each card shows one)

| File | Kind | Where it's used | Prompt |
|---|---|---|---|
| `scenes/money-agric-exports` | scene | 🌾 Agric exports | Sacks of sesame, cashew and ginger being loaded into a shipping container at a dry port; farmers and a forklift |
| `scenes/money-vaccination-grant` | scene | 💉 Health foundation grant for polio and measles | A health worker giving oral polio drops to a child held by her mother at a village clinic, cool boxes, a queue of mothers. The foundation is fictional: no logo |
| `scenes/money-education-grant` | scene | 📚 Education partnership grant | A bright primary classroom, children with new textbooks and uniforms, a teacher at a new blackboard |
| `scenes/money-road-tolls` | scene | 🛣️ Tolls and levies on finished roads | A clean new toll plaza on a dual carriageway, cars queuing, a booth attendant |
| `scenes/money-markets-reopened` | scene | 🛡️ Markets reopened under the security plan | A busy night market lit by lanterns and bulbs, traders and buyers, two calm police officers at the edge |
| `scenes/money-revenue-drive` | scene | 🧾 Revenue drive | A modern revenue office, people paying at counters with cards and phones, a short orderly queue |
| `scenes/money-savings-returned` | scene | 💼 A ministry returned unspent money | A commissioner handing a sealed envelope across a desk to a smiling finance officer |
| `scenes/money-wasted` | scene | 🕳️ A commissioner missed every target; money wasted | A half-dug drain abandoned in the rain, rusting equipment, a faded project sign, a frustrated resident looking on |

**Deals and outside money**

| File | Kind | Where it's used | Prompt |
|---|---|---|---|
| `scenes/money-deal-signed-abroad` | scene | The Dutch (or any foreign) deal signed | A signing table in a modern European conference room, two delegations, a fictional state seal on a folder, pens and handshakes |
| `scenes/money-federal-intervention` | scene | The President's intervention fund after the Abuja visit | A grand federal office, an official handing the governor (seen from behind) a large envelope |
| `scenes/money-investor-factory` | scene | An approved investor: jobs and taxes | A new factory gate on opening day, workers in hi-vis vests streaming in, a ribbon on the gate |

**30 images,** including the 4 single coins.

---

## TIER 2: decisions that feel like game moments

### 4. Stamps, the pen and the bill as a document
| File | Text in the image | Where it's used |
|---|---|---|
| `objects/stamp-approved` | APPROVED | Project and budget approval |
| `objects/stamp-funded` | FUNDED | A loan accepted |
| `objects/stamp-contract-signed` | CONTRACT SIGNED | Contract award |
| `objects/stamp-passed` | PASSED | A bill or budget passed by the House |
| `objects/stamp-rejected` | REJECTED | The House votes it down |
| `objects/stamp-signed-into-law` | SIGNED INTO LAW | The governor signs a bill |
| `objects/stamp-commissioned` | COMMISSIONED | A project opens |
| `objects/stamp-paid` | PAID | A debt or bill paid off |
| `objects/stamp-broke` | NO FUNDS | "The state can't pay for this" |
| `objects/governor-signature-pen` | none | The fountain pen that signs before the stamp, drawn at an angle as if writing |
| `objects/bill-paper-blank` | none | Bills as documents: a tall cream parchment page with a gold star border at the top, a blank space for the title, ruled lines for clauses, and a signature line at the bottom |

**11 images.**

### 5. Who's in the room (reactions on decision cards)
Make every mood from the person's own base image.

| File | Kind | Where it's used |
|---|---|---|
| `characters/party-chairman-pleased`, `-angry` | mood ×2 | Party reactions |
| `characters/godfather-pleased`, `-worried`, `-angry` | mood ×3 | The godfather reacting (must keep his face) |
| `characters/deputy-*-pleased`, `-worried`, `-angry` for each of the 5 deputies | mood ×15 | The deputy by loyalty (the old set changed faces) |
| `characters/commissioner-male-suit-pleased`, `-worried` | mood ×2 | A commissioner reacting to a decision about their ministry |
| `characters/commissioner-male-agbada-pleased`, `-worried` | mood ×2 | the same |
| `characters/commissioner-female-suit-pleased`, `-worried` | mood ×2 | the same |
| `characters/commissioner-female-kaftan-pleased`, `-worried` | mood ×2 | the same |
| `characters/commissioner-technocrat-pleased`, `-worried` | mood ×2 | the same |
| `characters/market-women-group-cheering`, `-angry` | group ×2 | The street's reaction, previewed before you sign |
| `characters/youth-group-cheering`, `-angry` | group ×2 | Young voters online, with phones |
| `characters/workers-group-cheering`, `-angry` | group ×2 | Civil servants and unions (salaries, arrears, the payroll purge) |

**36 images.**

### 6. The campaign: one picture per move
Each campaign week shows three move cards. Small scenes at 1600×900.

| File | The move |
|---|---|
| `scenes/camp-rally-tour` | A three-zone rally: an open truck with speakers, a crowd waving green flags |
| `scenes/camp-debate` | A TV debate: two podiums, studio lights, a moderator |
| `scenes/camp-manifesto-drop` | Volunteers handing out leaflets at a ward meeting under a tree |
| `scenes/camp-door-to-door` | Canvassers knocking on doors in a residential street, clipboards |
| `scenes/camp-lga-chairs` | Local government chairmen around a table, handshakes, tea |
| `scenes/camp-radio` | A community radio studio, presenter at the microphone, a caller on speaker |
| `scenes/camp-youth-town-hall` | A campus hall, students at microphones asking hard questions |
| `scenes/camp-opposition-research` | A dim office, a staffer pinning papers and photos to a board |
| `scenes/camp-market-walk` | The candidate (from behind) shaking hands with traders in a market and at a motor park |
| `scenes/camp-mega-rally` | A stadium at dusk, a huge crowd, lights and confetti |
| `scenes/camp-gotv` | Election eve: agents with lists and phones, buses lined up |
| `scenes/camp-polling-agents` | Party agents with tags at a polling unit table at dawn |
| `scenes/camp-answer-receipts` | A press table with documents spread out: "the receipts" (no readable text) |
| `scenes/camp-answer-press` | A press conference: microphones, cameras, the candidate's podium |

**The opponent's attacks** (the red line at the top of the week)

| File | The attack |
|---|---|
| `scenes/attack-credentials` | Newspapers and phones showing a photo of a certificate with a red question mark |
| `scenes/attack-rally` | The opponent's rally, bigger than yours: a huge crowd in the rival's colours |
| `scenes/attack-smear` | Anonymous flyers blowing along a street at night |
| `scenes/attack-endorsement` | A traditional ruler on a throne raising the opponent's hand |

**18 images.**

### 7. Election day: counting the votes
| File | Kind | Where it's used |
|---|---|---|
| `backgrounds/collation-board-lga` | background | The count by local government: a large board with rows of blank result slots, officials and party agents watching |
| `objects/result-sheet-blank` | object | The result form for one local government (blank, no INEC logo) |
| `scenes/declaration` | scene | The Returning Officer at a podium declaring the result, flashbulbs |
| `scenes/second-election` | scene | A second election: a quieter polling unit, the same queue a week later |

**4 images.**

### 8. Projects you can see
| File | Kind | Where it's used |
|---|---|---|
| `backgrounds/project-site-cleared` | background | Contract signed: the site cleared and pegged |
| `backgrounds/project-site-halfway` | background | Under construction: a half-built structure, a crane, workers |
| `backgrounds/project-site-stalled` | background | Stalled: an overgrown, rusted frame, a faded empty sign |
| `backgrounds/project-ribbon-cutting` | background | The opening scene: a ribbon, a crowd, a canopy, drummers |
| `objects/map-pin-project-grey`, `-gold`, `-green`, `-red` | icon ×4 | Map markers: planned, building, open, stalled |

**8 images.**

---

## TIER 3: endings and collecting

### 9. Ending badges
These go in the gallery of titles earned and locked. Round enamel badges with no text; the game prints the title. One badge for each title the game awards today, plus three career badges.

| File | Title | Picture |
|---|---|---|
| `objects/badge-the-builder` | The Builder | A finished road and a crane |
| `objects/badge-promise-keeper` | Promise Keeper | A firm handshake |
| `objects/badge-peoples-governor` | The People's Governor | A cheering crowd under a green-and-gold sun |
| `objects/badge-survivor` | The Survivor | A small tree standing in a storm |
| `objects/badge-unloved` | The Unloved | An empty rally ground with one chair |
| `objects/badge-mr-autopilot` | Mr Autopilot | An empty office chair with a jacket on it |
| `objects/badge-owed-salaries` | The Governor Who Owed Salaries | An empty pay envelope |
| `objects/badge-contractors-governor` | The Contractors' Governor | A hard hat sitting on a pile of cash |
| `objects/badge-impeached` | Impeached | A mace and a broken gavel |
| `objects/badge-nullified` | Removed by the Supreme Court | Court pillars with a crack |
| `objects/badge-two-terms` | Two Terms (career) | Two laurel leaves |
| `objects/badge-president` | President (career) | A grand domed building (fictional) |
| `objects/badge-successor-betrayed` | Betrayed by the Successor (career) | A handshake with a crossed-fingers hand behind the back |
| `objects/badge-locked` | Not yet earned | A grey silhouette badge with a small padlock |

**14 images.**

### 10. Ending scenes
| File | Where it's used |
|---|---|
| `backgrounds/handover-ceremony` | Handing over to your successor: a stage, two chairs, a crowd |
| `backgrounds/government-house-gate-dusk` | Voted out: the empty Government House gate at dusk |
| `backgrounds/efcc-headquarters` | The anti-corruption agency invites you in: a fictional office building, no real logo |
| `backgrounds/state-bankrupt` | The state goes broke: locked offices, a notice board, workers waiting outside the treasury |

**4 images.**

---

## Fixes to pack 1 (edit or regenerate)
- **Remove the national coat of arms** from `governor-female-agbada`, `governor-female-kaftan`, `deputy-male`, `deputy-female`, the `speaker`'s mace, `collation-centre`, `governor-office`, `assembly-chamber` and `courtroom`. Use the invented state seal instead.
- **`labour-leader`:** the shirt reads "Nigeria Labour Union"; make it plain.
- **`deputy-male`:** the badge says "Kaduna State"; make it plain.
- **Mood sets that changed face:** `godfather-*`, `deputy-*` and `governor-*` moods. They are replaced by the sets in Tier 2, made from each base image.

**About 12 edits.**

## Counts
| Section | Images |
|---|---|
| 1. Adviser, full body | 16 |
| 2. House of Assembly | 13 |
| 3. Money | 30 |
| **Tier 1 total** | **59** |
| 4. Stamps, pen and bill paper | 11 |
| 5. Who's in the room | 36 |
| 6. Campaign moves and attacks | 18 |
| 7. Election day | 4 |
| 8. Projects | 8 |
| **Tier 2 total** | **77** |
| 9. Ending badges | 14 |
| 10. Ending scenes | 4 |
| **Tier 3 total** | **18** |
| Fixes to pack 1 | about 12 |
| **Everything** | **about 166** |

## Hand-off
- Send each image back with exactly the file name above. I'll convert, place and wire them in.
- **Tier 1 first.** It unlocks the full-body adviser at the desk, the House vote and the money stories.
- **Cost:** nothing has been generated or bought from this side. Lovable's credits, and who generates what, are your call.
