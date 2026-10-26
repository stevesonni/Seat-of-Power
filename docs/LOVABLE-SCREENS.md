# Lovable brief: screen designs for Seat of Power

We need **screen designs** this time, not single pictures: what four key screens should look like, on a phone and on a computer. Claude will build them into the game, so the design must use only the content listed for each screen (no new features, no "How it works" boxes) and keep every button it lists.

## What to send back
For each screen:
1. A **phone mock-up**, 390 × 844, with the screen scrolled to the top and, if it is longer, a second image of the rest.
2. A **computer mock-up**, 1366 × 768.
3. Optional and welcome: the same screen as a single **HTML/CSS (or React) file**, with no outside libraries, so measurements, colours and spacing can be copied exactly.
4. Any **new picture or icon** the design needs, as WebP (backgrounds 1280 × 720; icons 256 × 256 transparent; portraits 700 px tall, transparent), named as below.

Name files like `screen-desk-phone.png`, `screen-desk-desktop.png`, `screen-desk.html`.

## The look (keep to it)
- **Fonts:** Fraunces (headings, numbers that matter) and Plus Jakarta Sans (everything else). Both are on Google Fonts.
- **Colours:** cream page `#f6f2ea`, card `#fffdf8`, ink `#13261c`, muted text `#5b665f`, line `#e6dfd2`, national green `#0b7a4b`, deep green `#12301f`, gold `#e9c46a`, warning orange `#c2410c`, red `#b3261e`. People / Growth / Running costs are blue `#2563eb`, green `#0b7a4b`, purple `#7c3aed`.
- **Mood:** flat-shaded cartoon art with bold outlines (as in all your packs). Warm, official, a little playful, never corporate.
- **Already approved (match them):** the new "Set up your government" card (a stepper, one big card for the step to do now with the chamber picture and wax seal, small tiles for the other steps) and the new budget card (dark green with gold, the amount as the headline, the options as a list with "All in range" or "4 out of range").
- **Rules:** all people and parties are fictional; no real coat of arms, seals, flags or party logos. Text short: one idea per line. Buttons in sentence case ("Close the session", not "CLOSE THE SESSION"). Everything readable at phone size without zooming; tap targets at least 44 px.
- **Navigation stays:** the bottom bar on a phone (Desk · State · People, with a red badge for unread letters) and the ☰ menu (Wiki, Help, Sound). Under Desk sit three tabs: Compound · Today · News.

## Screen 1 · The Desk (Compound tab)
Where every year starts. It must show:
- The **compound picture** (Government House for a governor, the Villa for the President), with the player's office building as the heart of it. You have already drawn these compounds; use them.
- **Your mail:** the letter tray with the number of letters (e.g. "4 letters"). Each letter is a row with its wax seal, a short title, and a red "!" when it is urgent. Tapping opens the letter.
- **The adviser's card** (only when a step is due): their portrait, one sentence, one button (e.g. "Open the Treasury").
- **The year:** "Year 2 of 4 · 2028" and the term ("1st Term").
- **Four numbers at a glance:** approval, money in the bank, party stability, corruption. Make these feel like a dashboard, not a table.
- **"Big moves 5/8":** how many big decisions are left this year.
- **One main button** when the tray is empty: "The tray is clear: on to 2029 →".

## Screen 2 · The yearly decision card
The card behind every decision: a crisis, a storyline, a letter that needs an answer. It opens over the Desk, full-screen on a phone. It must show:
- **The scene:** a background picture with the person bringing the matter in front of it (we have hundreds of these; design for any background plus a waist-up portrait).
- **A kicker:** a small label for where it comes from ("The fuel crisis · year 2", "Trade · Apapa", "Ogun · Lagos East").
- **The title:** one line ("Twenty kilometres of trucks at Apapa").
- **The brief:** 2 to 4 sentences, with "More" to expand.
- **Sometimes a "Last year you…" line** recalling the player's previous choice.
- **2 to 4 options.** Each option has:
  - a label (one sentence);
  - a small type tag: Programme (green), Bill (blue), Executive order (gold), or none;
  - up to three effect chips ("Approval +2", "₦40B", "Corruption +2%");
  - sometimes a warning line ("A gamble: it can go either way").
- **After choosing,** a result pop-up appears: an icon or picture, a title, one or two sentences, and a few result rows ("Approval +2", "The order: in force; it can be challenged in court"), then "Okay". Please design this result pop-up too.

## Screen 3 · A council in session
Opens when a council meets (the Federal Executive Council, the National Security Council, the Economic Advisory Council; for a governor, the Executive Council, the Traditional Rulers Council, the State Economic Council). You already made the six seals and four chambers. It must show:
- **The chamber picture,** full-screen, nothing drawn over it except the pieces below. No members around a table, no speech bubbles: the owner wants it clean.
- **The council's wax seal and name,** with one sub-line ("First sitting · the Council Chamber, Aso Rock").
- **One declaration,** read by one official: their round portrait, name and role, then one or two sentences in quotes.
- **Then either:**
  - one button, "Close the session"; or
  - a decision: a title ("Set the trade policy"), one sentence, and 2 to 4 options in the same style as Screen 2. Sometimes a second official (portrait, name, role) introduces the decision.

## Screen 4 · The end of the year
Shown when the player ends the year. It must show:
- **"1st Term · Year 2 of 4 (2028) · Complete"**, plus a reassurance line: "Saved. A good place to take a break."
- **The front page** of the state's newspaper (or the national paper for the President): masthead, one headline about the player, an image. This is the moment's centrepiece.
- **The sealed letter** for next year ("Sealed until 2029 · From: Protocol, Government House", one line in italics), with its wax seal: a cliffhanger.
- **What happened this year:** 3 to 6 short lines, each with an icon, good in green and bad in red (e.g. "Food prices are up 31%", "Exports earned the state ₦3.2B").
- **Two buttons:** "📋 Full year review" (secondary) and "Continue" (main).

## Also welcome (lower priority)
- **The State tab:** the state map with its three senatorial districts and LGAs, the Treasury, and the projects.
- **The People tab:** cabinet cards for ministers or commissioners (portrait, name, ministry, performance), the party, the House or Senate.
