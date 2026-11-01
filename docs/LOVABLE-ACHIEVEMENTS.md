# Lovable art: the achievement cards (Pack 30)

**Installed (Pack 30).** All 23 pictures are in the game. The 19 medals are on their cards (`game/systems/achievements.js`). The backdrop, sunburst, plaque and confetti make up the popup and the shared 1080×1350 picture. `tests/art-usage.test.mjs` checks every file is used; `tests/e2e/achievements.mjs` checks a card is earned in play, pops up, shares and appears in the album.

These are 24 cards that pop up when a player earns something, for example "6 foreign trips in one term. Junketer-in-chief!". Each card can be shared on WhatsApp in one tap, so it has to look good enough that people want to post it. Every card is built from:
- a medal (the badge);
- a card background;
- a gold sunburst behind the medal;
- a name plaque.

Claude draws the text: the title, the funny line, the number, the player's name and state, and the link.

Five medals already exist and are reused: Junketer, Survivor, Peacemaker, Clean Hands, Builder. This pack is the other 19, plus 4 pieces for the card itself: 23 files.

**Style:** the same as the existing badges (see `public/art/badges/badge-junketer.webp`). Each medal is:
- a round, painted gold medallion;
- a deep Nigerian-green field inside the ring;
- a raised gold-and-green emblem in the middle;
- a soft painted texture, like an oil painting on metal;
- a small gold luggage tag hanging off the lower right of the ring on a short cord, as on the Junketer badge. Every medal has one, so they read as one set.

Other rules:
- No readable text anywhere: no words, numbers or letters on the medals, tags or plaques. Claude writes the text on top.
- No real logos, seals, coats of arms or party symbols. Nigeria's green-white is fine.
- No real people, and no faces on the medals: objects and symbols only, so a medal fits any player.
- Nothing gory or violent.
- WebP files.

**Sizes:**
- Medals: 512 × 512, transparent background, the ring filling about 90% of the square.
- Card pieces: the sizes given in section 2.

## 1. Medals (19) · public/art/badges/
| File | The emblem in the middle | The card it is for (when it pops up) |
|---|---|---|
| badge-stay-at-home.webp | A front door with a green-white doormat and a pair of slippers in front of it, a passport lying closed in a drawer beside it | **Stay-at-home Governor:** a whole term with no trip abroad |
| badge-quick-fix.webp | A spanner and a paintbrush crossed over a small lightning bolt | **Quick Fix:** 5 quick jobs finished within the year |
| badge-ghostbuster.webp | A payroll ledger with three faint, see-through ghost shapes floating off the page and fading away, a magnifying glass over it | **Ghostbuster:** ghost workers struck off and kept off for 3 years |
| badge-leak-plumber.webp | A gold water pipe with a shiny clamp over a joint; one last drop falling, coins visible inside the pipe through a little window | **Leak Plumber:** under 3% of FAAC leaking away |
| badge-salary-day.webp | A wall calendar page with one day circled and a stack of pay envelopes in front of it | **Salary on the 25th:** 4 years with no salary arrears |
| badge-supreme-court.webp | A judge's gavel resting on a closed law book, a laurel wreath around them | **Supreme Court Proof:** an election petition won at the Supreme Court |
| badge-whistle.webp | A referee's whistle with a folded document tucked under it and three small sound lines | **Whistle Heard:** a true whistleblower tip acted on |
| badge-border-champion.webp | A football trophy cup on a small map shape split into two neighbouring states, one side bright green, the other paler | **Border Champion:** beat the neighbouring governor 3–0 |
| badge-combo.webp | Three interlocking gold rings, with a wheat ear, a school book and a red-cross cup inside them | **Combo King or Queen:** 3 programme combos running at once |
| badge-debt-slayer.webp | A gold sword cutting a long paper chain of IOU slips in two | **Debt Slayer:** left office owing less than you inherited |
| badge-trade-war.webp | Two cargo trucks facing each other at an open boom barrier that is lifting, a handshake above them | **Trade War Won:** the trade war with Lokassa ends in our favour (President) |
| badge-diplomat.webp | A fountain pen over a signed treaty scroll, with small plain flag pennants (no real flags) | **Aso Rock Diplomat:** 5 state visits (President) |
| badge-road-held.webp | A short stretch of tarred road with clear drains on both sides, rain clouds above and the road dry | **Road That Held:** the market road survives the rains (Chairman) |
| badge-promise-kept.webp | Two hands in a firm handshake over a small rising sun | **Promise Keeper:** the chairman's ambition achieved |
| badge-lawmaker.webp | A rolled bill with a ribbon seal and a quill pen crossed behind it | **Lawmaker:** 3 bills passed in the Senate |
| badge-every-family.webp | A small passenger plane flying over a cluster of house roofs, a little heart above the roofs | **Every Family Home:** the ambassador's evacuation finished with every family brought home |
| badge-streak.webp | A flame made of seven small stacked flames, the top one brightest | **7-Day Streak:** the Daily decision played 7 days running |
| badge-peoples-favourite.webp | A crowd of raised hands (simple shapes, no faces) holding up a gold star | **The People's Favourite:** approval above 75% |
| badge-ward-to-aso-rock.webp | A winding road climbing a hill from a small council building at the bottom to a domed building with a green-white flag at the top | **From Ward to Aso Rock:** chairman, then governor, then President with the same politician |

Already in the game and reused (no new art):
- `badge-junketer` → **Junketer-in-chief**
- `badge-survivor` → **Survivor**
- `badge-peacemaker` → **Peacemaker**
- `badge-clean-hands` → **Clean Hands**
- `badge-builder` → **Ribbon Cutter**

## 2. The card itself (4) · public/art/brand/
| File | Size | The picture | Used for |
|---|---|---|---|
| card-backdrop.webp | 1080 × 1350 | Deep Nigerian green with a soft painted texture and a faint pattern of thin gold lines radiating from the upper middle, like light. A thin gold border inset 24 px from the edge. The lower third is calm and darker, so white text reads well on it. | The background of every shared card, and of the popup |
| card-sunburst.webp | 900 × 900, transparent | Gold rays fanning out in a full circle with sparkles at their tips, brightest in the centre and fading out | Behind the medal, slowly turning in the popup; fixed on the shared picture |
| card-plaque.webp | 900 × 220, transparent | An empty gold name plaque with rounded ends and two small rivets, slightly raised | Under the medal, where Claude writes the card's title |
| card-confetti.webp | 1080 × 600, transparent | Falling green, white and gold paper confetti and a few gold coins, thinning towards the bottom | The burst at the top of the popup when the card is earned |

## How Claude uses them
- **The popup:** the backdrop, then the sunburst turning slowly, the medal scaling in with a small bounce, confetti falling once, and a sound. Below that sit the title on the plaque, the funny line and the number in large type ("6 trips"), then two buttons: **Share on WhatsApp** and **Keep playing**.
- **The shared picture (1080 × 1350, made on the phone):**
  - the backdrop, then the sunburst and the medal in the top half;
  - the title on the plaque;
  - the funny line and the number;
  - "Earned by 4% of players", inside Vatar only;
  - at the bottom: the player's name, state and year in office, and "Play free: seatofpower.online".
- **"My cards":** an album on the profile with every card earned. Cards not yet earned show as greyed-out medals.

Until these arrive, the five existing medals and the game's emoji stand in. When the pack lands, Claude puts each file where this brief says. `tests/art-usage.test.mjs` checks every file is used.
