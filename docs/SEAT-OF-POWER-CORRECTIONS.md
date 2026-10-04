# Seat of Power: corrections from Steve's playtest (1 October 2026)

Source: Steve's handwritten notes (two pages) and a phone screenshot of the budget screen in portrait. Read together with `Seat_of_Power_Wiring_Audit.md`. Do one batch per session, in order. Do not start a batch until the previous one passes its checks.

Rule for every batch: nothing on screen without a purpose. If a number, symbol or choice does not change what the player does or what happens later, remove it or make it matter.

---

## Batch A: Fix the portrait screen (what the screenshot shows)

The budget screen in portrait (Ebonyi, Year 1 H1) is unusable:

- The header takes a third of the screen: name, four stat boxes, turn bar and two tabs. Collapse it to one slim row: governor name and turn on the left, approval as one chip on the right. Treasury, debt and party move into a pull-down "State of the state" sheet.
- "73 PARTY" has no meaning on its own. Label it "Party support 73%" wherever it appears.
- Content is hidden behind both the header and the bottom bar (Desk, Map, People, Wiki, Save). Add top and bottom padding equal to the bars' height so nothing sits under them.
- Type is far too large in places ("ALLOCATED 100%", the template buttons) and the budget sentence breaks mid-line. Use one type scale: headline, body, small. No text larger than the headline size.
- "Save" in the bottom bar takes a main slot. Move it into a menu; autosave each turn.

- **Do not cram.** Not everything has to fit on one screen; trying to fit everything is what makes it look this way. Scrolling is fine. Show the one thing the player needs now, and tuck the rest into collapsible sections that start closed: the list of states (grouped by region, one region open at a time), budget sector details, the full stat breakdown, past decisions, help text. A closed section shows its title and one summary line ("Budget details: 9 sectors, balanced").

Check: at 390 x 844, nothing is covered by a bar, text is readable without zooming, the main decision on each screen is visible near the top, and secondary detail sits in collapsed sections rather than on screen by default.

## Batch B: Remove the meaningless and make choices matter

- **State cards** ("Lagos: IGR 95%, Security 55%"): remove the raw percentages. Replace with one plain line per state: "Rich state, high expectations" or "Poor state, depends on federal money". Explain IGR in words the first time it appears ("money the state raises itself").
- **Difficulty**: Lagos (Medium) and Kano (Hard) must differ in ways the player feels, and the state card must say how in one line (for example "Kano: less own money, stronger traditional rulers, more security pressure"). If difficulty does not change the starting numbers, events and rival strength, remove the label.
- **Flagship agenda**: it must visibly matter. Show it in the header chip, have the adviser and the news anchors refer to it, give it its own Desk decisions (at least one per year), and judge it in the Wikipedia article ("Bello's flagship Build, Build, Build programme delivered 3 of 5 roads"). If that cannot be done, remove the choice.
- **Campaign slogan**: the news anchors must quote it after the election ("Bello, who campaigned on 'A New Dawn for Ebonyi'…"), and it must appear in the Wikipedia article.
- **Fancy styling only for real characters**: decorative boxes, quotes and portraits only for named, recurring characters (the cast). Everything else is plain.
- **Images**: every character image in its right place (adviser in adviser scenes, anchors at the anchor desk, godfather in godfather scenes). List any scene that has no image or the wrong one.

## Batch C: Parties (content correction)

- Order the parties: APC, PDP, NDC, ADC, LP (NDC before ADC).
- Do not describe the ADC as a "coalition vehicle". Use a neutral one-line description.
- Party descriptions describe parties, not named living politicians. Remove names of real politicians from all party text.

## Batch D: Campaign strategy, rebuilt to be clear

Steve: "too bad for people. It needs to be clearer. Proper numbers, structured better."

- One screen per campaign week with three parts, always in the same place:
  1. Where you stand: one poll line per senatorial zone, "You 52% · Opponent 48% (poll, margin ±4)". Shares must add up to 100 (they currently add up to 101 to 104).
  2. Your resources this week: money (₦), and time (number of actions left).
  3. Your options: 3 cards, each with one line of what it does, what it costs, and which zone it affects. Same layout every week.
- Show "+-3" correctly ("−3").
- Free actions must not dominate. Every option costs money or time, so the player has to trade off.
- The result screen after election day shows how each zone moved because of your choices.

## Batch E: First 100 Days — DELETED (4 October, Steve's decision)

~~Fold the six First 100 Days scenes into the Desk.~~ Superseded. The whole inauguration / First 100 Days group ("The oath, and then the microphone", the speech drafts, "Declare war on corruption. Name the missing ₦40bn." and the five scenes after it) is removed from the game and must never appear again in any form. It is not folded into the Desk.

Removed with it: the module (`public/sop-first100.js`) and its script tag, the Desk card that scheduled it, the delayed consequences it set (garnishee order, NLC warning strike, NESREA injunction, the spiked story), the "signature road" project and the godfather rule that read it, its Wikipedia section, and every adviser, news or ledger line that quoted one of its choices. Turn 1 now starts on the Desk with the budget.

**Also removed: the budget padding decisions.** Every "Padding your PA flagged" card (the "Budget Assembly" before each budget: approve the full envelope, cut half the padding, fund only the real need, refer the padding to the EFCC), for every sector, and the Speaker's late-night constituency-project demand that ran in the same step. The budget itself (Batch F) and the House vote with its amend / negotiate / drop choices (Batch G) stay. The ledger no longer scores "padded lines" for the tribunal or the adviser.

Old saves: anything from either group (ledger entries, news lines, adviser memory, the signature road, a save paused in the padding step) is dropped when the save loads; a save paused in the padding step resumes on the budget.

## Batch F: Budget, made navigable

- One budget screen in portrait: total to spend at the top in one sentence ("₦10.5B to spend this half-year"), then a short list of sectors, each one row with name, amount and a simple slider. Tap a row for details.
- Templates (Balanced, Populist, Reformer, Godfather) as one row of small chips, not large buttons.
- Show the consequence of the split in plain words before submitting ("Teachers will be paid on time. Roads will slow down.").

## Batch G: Bills and the House: rejections need reasons

- When the House rejects a bill, show who voted against it and why, in one or two lines, and whether the reason is good or bad ("The Speaker blocked it because you refused his contractor" or "Members say the bill has no funding line"). The reason must come from what the player did earlier (from the ledger), not at random.
- Offer what can be done next: amend, negotiate, or drop.

## Batch H: Policies section

- One list of policies, each with one line on what it does, what it costs per half-year, and who supports or opposes it.
- A policy taken must show up later: in news, in the people who react to it, and in the Wikipedia article.

## Batch I: Wikipedia, like the real thing

- Look and structure of a real Wikipedia biography: title, short lead paragraph, infobox on the right (portrait, office, party, deputy, predecessor, successor, term), then sections: Early life and campaign, Governorship (flagship programme, budget, key decisions), Controversies, Legacy. Citations as footnote numbers that point to the in-game news stories.
- Written from what actually happened in the game (ledger): slogan, flagship, appointments, scandals, court cases, the outcome.
- A share card: an image of the article's top (title, infobox, lead), sized for WhatsApp status and X, with a link back to the game.
- A short "stub" version after the First 100 Days that grows as the game goes on.

## Batch J: Tie it together (the handshakes)

This is the audit's work order steps 2 to 5 (the Desk, the one memory, the cast). After batches A to I, check end to end that:

- the slogan, flagship, party, deputy and key decisions are all read from one place and appear in news, adviser lines, bills, the Wikipedia article and the ending;
- every rejected bill, scandal or demand can name the earlier decision that caused it;
- no decision appears twice in one game.

Check: play one full game as Ebonyi and one as Lagos; list every place where an earlier choice should have been mentioned and was not.

---

## About Lovable for the UI

Steve's note: Lovable could design the UI. Recommendation: yes, but not on the same code at the same time as Claude Code. Use Lovable to design the look (colours, type, cards, the four main screens, the Wikipedia page) as a design reference or a small component set, then have Claude Code apply it to the game. Two tools editing the same 6,400-line file in parallel will overwrite each other.
