# Lovable brief: redesign all of Seat of Power

Paste everything below the line into Lovable. Attach the "One decision. Four ways to play." board as the reference.

**How this works.** The real game's code is on GitHub (`stevesonni/Seat-of-Power`), not in Lovable, so Lovable cannot
change the game itself. Lovable designs every screen as a **clickable mock-up with made-up data**, in its own
project. Then you connect that Lovable project to GitHub (Lovable: Settings → GitHub → Connect) and give Claude the
repository name. Claude copies the colours, fonts, spacing and components from that code into the real game,
screen by screen, without changing what the game does. Working code is much better to copy than pictures.

---

## The task

Redesign every screen of **Seat of Power**, a Nigerian politics game for phones (live at seatofpower.online). Use
the live site to see each screen's real words, buttons and order. **This is a visual redesign only: same screens,
same buttons, same words, same order, same number of taps. No new features, no new rules.**

Build it as a React + Tailwind project with **one route per screen** (listed below) and a home page that links to
them all, using **made-up sample data**, no backend and no login. Put shared parts in `src/components/` and every
colour, font, radius and shadow in **one tokens file** (`src/styles/tokens.css` as CSS variables) so they can be
copied exactly.

## The look

Follow the reference board:
- **01 Today** is the base for every decision. It has the adviser's painted portrait on the left with one line of
  advice, and the choices on the right as rounded rows with a line icon and a ›. On a phone, the portrait sits on
  top and the choices below.
- **02 Living scene** is for big moments: a crisis, a council, a visit. The painted scene fills the screen and the
  choices sit in a cream panel over it.
- **03 State map** is the State tab. It shows the state map with the meters in dark chips along the top and a
  legend, and when you tap a place, its card shows up beside the map (below it on a phone).
- **04 Walkable world: do not build it.** It changes how the game plays.

Style:
- Painted, warm, realistic illustration, like the board.
- Deep green panels with thin gold rules, cream paper, a Fraunces-style serif for titles and a clean sans for text.
- The phone frame on the board is presentation only. Design for real phones, 390 × 844 first, then a laptop at
  1366 × 768.

## Rules
- All people, parties and companies are **fictional**. Real Nigerian states and towns are fine. Do not use real coats
  of arms, seals, party logos or brand logos. Green-white flags are fine.
- Text stays short, one idea per line. Buttons are in sentence case. Tap targets are at least 44 px. Everything must
  be readable on a phone without zooming.
- Every money figure is in naira with B or M ("₦9.2B").
- Bottom bar on phones: **Desk · State · People**, with a red badge for unread letters. A ☰ menu holds Home, Save,
  Help, Wiki, Sound and Text size.

## The screens (one route each)

**Start**
1. `/title`: the title screen, with New game, Continue and the career picker.
2. `/create`: create your politician. Choose a portrait, enter first and last name, pick a state (dropdown) and a
   district (tiles), then "Create my politician".
3. `/campaign`: the campaign. Choose an adviser (3 cards), see the running-mate ticket, then campaign stops on the
   map, a war chest, and the godfather's loan or the people's fund.
4. `/election-night`: the results coming in, with a winner card.

**Desk** (the year happens here)
5. `/desk/compound`: the Government House compound picture with its buildings as places to tap (Electoral
   Commission, Party Secretariat, House of Assembly, Ministry of Finance, High Court, Police HQ, The Palace, EFCC
   Office, Project Sites, Central Market), each with a status line ("All quiet", "Not convened").
6. `/desk/today`: the year line ("Year 2 of 4 · 2028"), "⚡ Political capital 7/10", the step to do now (one big
   card; the "Set up your government" stepper is the model), the Governor's powers (4–5 tiles: Hire or fire
   commissioners, Inspect your projects, Meet the people, The House, Fly to Abuja), and the year's next step.
7. `/mail`: the mailbox in the bottom-right corner (open with letters, or closed). Next message opens the top letter.
   An open letter has its wax seal, the sender, three short paragraphs, then 2–3 replies and "Let the Chief of
   Staff handle it".
8. `/decision`: a decision in style 01, and the same decision in style 02. It has a kicker ("The state's economy ·
   2027"), a title, two short lines, an optional "Last year you…" reminder, and 2–4 choices. Each choice shows its
   **cost** and its **effects** (People +3, Party −2, Corruption +1%, Own revenue +₦0.4B) as small icon tags,
   green for good and red for bad, plus an optional ⚠ risk line.
9. `/result`: the card after a choice. It has a picture, a title, one sentence, 2–6 result rows (+ or −), an
   optional "Because you… in 2027" line, and Okay.
10. `/council`: a council in session (the Executive Council, Traditional Rulers, the Economic Council). The members sit
    around a table with speech bubbles, and the decision sits below.

**The meters** (on every screen, at the top)
11. Show four meters: **Approval 55%**, **In the bank ₦6.3B**, **Party 75%**, **Corruption 31%**. They must fit in
    one row on a 390 px phone, labels included. Also design how a change looks: small, medium and big, good and bad
    (an arrow badge, a pulse).

**State**
12. `/state/map`: style 03.
13. `/state/treasury`: money in and out (federal allocation, own revenue, salaries, debt), revenue reforms as cards,
    and borrowing.
14. `/state/economy`, `/state/projects` (project cards with % built, contractor and status) and `/state/contracts`
    (bids to award).

**People**
15. `/people/cast` (the people in your story), `/people/cabinet` (commissioners with portrait, ministry, skill and
    loyalty, plus Hire and Fire), `/people/ministries`, `/people/council` and `/people/public` (the street: complaints
    and the mood by zone).

**End and more**
16. `/end`: the end of a term. It shows a five-line story, the grade, and buttons for "Read the full story" and "Run
    for president with <name>".
17. `/wiki`: the politician's Wiki biography page and the Constitution.
18. Career variants: show one screen each for the Senator, the Local Government Chairman, the Ambassador and the
    President. Same parts, different titles and colours.

## What to send back
- The Lovable project connected to GitHub, with the repository name.
- Screenshots of every route on a phone (390 × 844) and a laptop (1366 × 768).
- Any new painted art as WebP:
  - backgrounds 1280 × 720;
  - portraits 700 px tall with transparent backgrounds;
  - icons 256 × 256, transparent;
  - named in lowercase-with-dashes.
