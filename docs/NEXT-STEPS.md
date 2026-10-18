# Seat of Power: everything left to do, plus revenue and elections audits

*18 October 2026. Sources: your playtests, Gemini's two reviews, the Executive Command screenshots, and a read through the code.*

---

## 1. What the Executive Command screenshots show

You sent two screens: the adviser on the map, and a bill being signed.

| What they do | What we do now | What to take |
|---|---|---|
| **The adviser is a full-body character** standing in the scene, with one speech bubble and one big **Continue** button. | A small round portrait in a card. | Make the adviser a large figure who enters the scene and speaks. The new adviser art in pack 2 is drawn for this. |
| **Key words in the bubble are coloured** ("Congress", "Capitol", "support"). Each is a glossary link. | Plain text. Our "Civic Lens" glossary exists but is hidden in Help. | Colour the glossary terms in every adviser line (IGR, FAAC, the House, a godfather…). Tapping one opens the plain-language explanation. |
| **A speaker icon on every line** reads that line aloud. | A voice prototype only in the Secretariat meeting. | A speaker icon on each adviser line, using the device's own speech engine (free, already built). |
| **Two big vertical meters** (approval and agenda progress), plus a peace/war light, are always visible. | A slim status strip with four numbers. | Two or three animated meters that fill or drain when something changes, so every result is felt. |
| **The map has icons on buildings** and a numbered badge ("1") where something is waiting. | The compound map glows the building that needs you. | Add the numbered badge per building, and the icon style. |
| **A bill is a document, clause by clause,** with thumbs up/down for each clause. Then you sign it with a pen. | A bill is one card with one button. | Bills as documents: keep or strike each clause (each clause changes cost, support and effect), then sign with the pen and a stamp. This is the strongest single idea in the screenshots. |
| **A "Help" phone-a-friend switch.** | The adviser's "Why?". | Keep "Why?". Optionally a "call your adviser" hint, used a few times per year. |
| **Very little text per screen.** | Often long. | One idea per screen, as in the project sequence already rebuilt. |

---

## 2. The master list

**Status key:** ✅ done · 🟡 started · ⬜ not started.

**Source key:** **You** (your playtests and requests), **G** (Gemini), **C** (found in the code).

### A. Presentation: "a lively game, not a document"
| # | Item | Source | Status |
|---|---|---|---|
| A1 | Project sequence: adviser at the desk, three-layer dossier, stamps, milestone strip, "What changed" | You | ✅ |
| A2 | Large full-body adviser with an entrance, coloured glossary words and a speaker icon per line | You, screenshots | ⬜ |
| A3 | Animated meters (approval, party, treasury) that move when a result lands | You, G, screenshots | ⬜ |
| A4 | Bills as clause-by-clause documents, signed with a pen and stamp | Screenshots | ⬜ |
| A5 | The year's events in the new pattern: who's in the room, the street's reaction previewed before you sign, a "Delegate" button | G | ⬜ |
| A6 | Budget in the new pattern | You, G | ⬜ |
| A7 | Numbered badges on compound buildings | Screenshots | ⬜ |
| A8 | Desktop: overlays render too small on large screens | C | ⬜ |
| A9 | Ending-title gallery (earned and locked) | G | ⬜ |

### B. The House of Assembly
| # | Item | Source | Status |
|---|---|---|---|
| B1 | A grudge (an overdue godfather favour, or having refused him) blocks every bill and the budget, with no way to clear it on the rejection screen | You, C | ⬜ |
| B2 | Clearing a grudge: settle the favour, reconcile through party elders, or appeal to members' constituents | G, C | ⬜ |
| B3 | Lobbying before the vote: blocs (majority, opposition, godfather loyalists, undecided), each with a price | G | ⬜ |
| B4 | The vote shown in the chamber: a live yes/no tally and faces | G | ⬜ |
| B5 | The flat ₦18B debt line that blocks costed bills: scale it to each state's revenue | C | ⬜ |
| B6 | The negotiate → more debt → more blocked bills spiral | C | ⬜ |

### C. Money (detail in section 3)
| # | Item | Source | Status |
|---|---|---|---|
| C1 | One money system: the budget pays for things, and only the shortfall is borrowed | You, C | ⬜ |
| C2 | "Treasury" is a running balance, not this year's income | C | ⬜ |
| C3 | Year-end money panel: in, out, borrowed, debt service | You, G | ⬜ |
| C4 | Revenue reforms show a projected revenue line that visibly rises | G | ⬜ |
| C5 | Reward for a year without new borrowing | G | ⬜ |
| C6 | Old debt and new project loans brought under one model, with interest | C | ⬜ |
| C7 | Scale check: state revenues and project costs against real figures | C | ⬜ |

### D. Elections (detail in section 4)
| # | Item | Source | Status |
|---|---|---|---|
| D1 | The win rule is invented ("most votes and 2 of 3 zones"). Use the constitutional rule | C | ⬜ |
| D2 | Collation by local government (and ward), not by three zones | C | ⬜ |
| D3 | Inconclusive results and supplementary elections | C | ⬜ |
| D4 | A governorship primary (none today; the presidential run has one) | C | ⬜ |
| D5 | Election night: the module exists (BVAS failures, vote buying, IReV mismatches) but is switched off | C | ⬜ |
| D6 | More than two candidates | C | ⬜ |
| D7 | Turnout closer to recent governorship elections | C | ⬜ |

### E. Gameplay and fairness
| # | Item | Source | Status |
|---|---|---|---|
| E1 | Make every anti-corruption investigation (EFCC) name the record entries that caused it | G | 🟡 (one briefing does; the rest don't) |
| E2 | A shorter path from "New game" to Government House | G | ⬜ (measure the taps first) |
| E3 | The goldfields' yearly decision arrives as one of the year's events, not a separate button | G | ⬜ |
| E4 | Move the "Standing" panel (rivals, factions, institutions) out of the main path | G | ⬜ |
| E5 | Historical-crisis scenarios for the planned scenario pack (fictional people) | G | ⬜ |

### F. Content and art
| # | Item | Source | Status |
|---|---|---|---|
| F1 | Art pack 2 brief (about 100 images) | You | ✅ brief written; images not made |
| F2 | Remove the coat of arms and real organisation text from pack 1 | C | ⬜ (needs the images) |
| F3 | The "Zenith–Access–UBA" lender: rename it to a fictional bank | C | ⬜ |
| F4 | Real senatorial districts for every state (only Edo has them) | C | ⬜ |
| F5 | Fix `GAME-OVERVIEW.md`: it describes the election night as live, but it is switched off | C | ✅ corrected in this commit |

---

## 3. Revenue audit: how money actually works now

### What happens in the code
1. **Revenue each year.** Own revenue (IGR) comes from a sector-by-sector economy model. It is calibrated so Year 1 matches the state's starting figure, then moves with the economy, smoothed (70% new, 30% old). Reforms add to it. The federal allocation (FAAC) swings each year with oil, Abuja's mood and shocks.
2. **The "budget" is only a percentage split.** The money available is own revenue + FAAC − 8% of debt. The split across eight sectors decides **how fast each sector's indicator improves**. That's all it does: no naira is ever taken out of a sector line to pay for anything.
3. **Almost everything you buy is borrowed.** These go straight onto debt:
   - programmes, each year they run (the Policies screen says so);
   - running costs for hospitals and schools;
   - equipment and repairs;
   - bills with a cost;
   - House deals and many event choices;
   - goldfields spending.

   The budget never pays them.
4. **Paying debt back.** Each year 8% of the debt is paid off, plus 15% of own revenue above ₦5B, plus 0.5% of GDP for big economies. The old debt carries **no interest**; only the new project loans do.
5. **"Treasury"** in the status strip is this year's income minus debt service. It doesn't fall when you spend, because spending never touches it.
6. **Bankruptcy** triggers when own revenue + FAAC falls below a threshold. Debt itself never ends the game. It strangles you through the House (the ₦18B line) and the shrinking budget.

### Why it feels confusing and hopeless
- **Two money systems that never meet.** The budget feels like spending but isn't, and spending feels free but becomes debt. Nothing you see adds up.
- **There's no balance to watch.** You can't save up, overspend, or see money arrive and leave.
- **Debt grows from everything,** so a player who is active is punished by debt, and a player who is passive is punished by the "autopilot" rule.
- **Revenue growth is real in the model, but invisible.**

### Proposed model (one system)
1. **A real treasury balance** (₦M, like the project records). Each year: opening balance + own revenue + FAAC − spending = closing balance. The status strip shows the balance.
2. **The budget sets naira lines.** "Health ₦2.4B this year" comes from the split × the year's expected revenue. Programmes, running costs and project shares are charged to their line.
3. **Borrowing only when a line runs out,** and the game says so: "₦600M of this year's health programmes was borrowed: the health line ran out." The player can instead cut, delay or move money between lines, at a cost in political support.
4. **One debt model:** every borrowing has a rate and a term. Debt service is a real line in the budget.
5. **A year-end money panel:** money in, money out by line, borrowed, repaid, the closing balance, and own revenue over the years as a rising (or falling) line.
6. **Rewards:** a year with no new borrowing earns better loan terms the next year and an adviser commendation. Reforms show "+₦X a year from Year N" and then actually deliver it on the line.
7. **Thresholds scaled to revenue:** the House debt line becomes a debt-to-revenue ratio, so a poor state isn't blocked before a rich one.

**Balance risk:** this changes the game's economy everywhere. It needs a simulation pass (as was done for the goldfields) and a full playthrough on each difficulty before release.

### Scale check (to verify)
- **Starting figures:** the game's revenue is about ₦18.7B a year in total for Ogun (₦8.5B own revenue, ₦10.2B FAAC), and own revenue starts at ₦52B for Lagos. Project costs are scaled similarly: a 500km road costs ₦8.1B.
- **Reality:** I believe real figures in 2023–24 are around ten times larger, but I haven't checked them in this session.
- **Two options:**
  - say the game uses a scaled economy;
  - or rebase everything to real naira, which also needs real unit costs.

  Either is fine if it's consistent and stated. I'd check against the National Bureau of Statistics' state revenue figures and state budget documents before choosing.

---

## 4. Gameplay and elections audit

### How an election works now
1. **Campaign:** about six weeks. Each week you make a move, the opponent strikes back in a zone, and support moves in each of the three senatorial zones.
2. **Election day:**
   - each zone's support is nudged by your campaign score against the opponent's, plus random noise;
   - registered voters are 48% of the population, split evenly across the three zones;
   - turnout runs from 12% to 68%, and 5% of votes go to minor parties.
3. **The result:** you win with **more total votes AND at least 2 of the 3 zones**.
4. **Then:** a close loss (or a close win by you) can go to the Tribunal, the Court of Appeal and the Supreme Court. The 21-day filing window (S.285(5)) is right.
5. **Election night choices exist in `public/sop-electionnight.js`** (BVAS failures, vote buying at ₦5k a vote, IReV mismatches, each with an integrity cost). The module is **not loaded**: it was cut by request earlier. Its vote effects were never connected anyway.

### What's inaccurate or missing
| Issue | Reality (to state carefully in-game) |
|---|---|
| **The "2 of 3 zones" rule is invented.** You can win the most votes and still lose. | Section 179(2): the most votes **and** at least a quarter of the votes in at least two-thirds of the state's local governments. Senatorial zones play no part. |
| **No inconclusive outcome** | If no one meets that rule, the Constitution provides for a further election (S.179(3)–(5)). In practice, INEC also declares results inconclusive when cancelled votes exceed the winning margin, and holds supplementary elections in those units. Recent governorship elections have turned on this. |
| **Collation by three zones** | The real order is polling unit → ward → local government → state, with BVAS accreditation and results uploaded to IReV under the Electoral Act 2022. |
| **Two candidates** | Usually three or more serious candidates. A third candidate splitting your base or theirs is realistic and interesting. |
| **No governorship primary** | Every party picks its candidate by primary (direct, indirect through delegates, or consensus). This is where godfathers and delegates matter most. The presidential run already has a primary we can reuse. |
| **Turnout of up to 68%** | Recent governorship turnout is usually far lower, often around a quarter to a third. To verify per state. |
| **Every state votes in the same year** | Several states vote off-cycle (Edo, Ondo, Ekiti, Osun, Kogi, Bayelsa, Imo, Anambra). This could be optional flavour. |

### Proposed election rebuild
1. **Primary (new):**
   - pick the delegate route, court the delegates and the godfather;
   - a rival aspirant can win;
   - losing lets you defect to a smaller party (as in the presidential run).
2. **Campaign (keep, tighten):**
   - three zones become the state's real local governments, grouped by zone for display;
   - a third candidate who takes votes from both sides.
3. **Election day:** results arrive local government by local government on a live collation board. Election-night choices return here as one or two decisions, not a list, and this time they really change the count.
4. **Declaration under S.179(2):**
   - the board shows how many local governments reached 25% (you need two-thirds);
   - it shows cancelled votes against the margin;
   - outcomes: **winner declared**, **inconclusive**, or **further election**.
5. **Supplementary election:** a short, tense round in the cancelled units, with its own two or three moves.
6. **Tribunal:** as now, fed by what happened on the night: BVAS, IReV and cancellations become the grounds.

The same engine runs the re-election and the successor's race.

### Other gameplay notes from the code
- The campaign's sway on the result is (your score − the opponent's) × 0.32 per zone, plus a first-campaign bonus. Seeding the random factor from the campaign means the result doesn't change on reload, which is good.
- "Idle year" and "neglected need" penalties both push towards activity. With the money fix, activity costs naira, not just debt, so the trade-off becomes real.

---

## 5. Suggested order
1. **The House** (B1–B6), plus the chamber vote (B4) as the next screen in the new style. Small, and removes the worst dead end.
2. **Money** (C1–C6) in one go, with a simulation pass. The biggest balance change.
3. **Elections** (D1–D7). Start with the constitutional rule, local-government collation and inconclusive results. Then the primary.
4. **Presentation sweep** (A2–A6, A9): large adviser, meters, bills as documents, events, budget.
5. **Art pack 2** arrives alongside 1–4. Tier 1 is needed by step 1.

## 6. Decisions only you can make
1. **Money scale:** keep the game's scaled-down naira (and say so), or rebase to real figures?
2. **Election night:** bring it back inside the new election day? It was cut at your request earlier.
3. **The governorship primary:** add it (longer start), or make it optional through Quick start?
4. **Off-cycle states:** include their real election years, or keep one calendar for every state?
