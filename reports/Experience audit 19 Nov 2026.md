# Seat of Power: experience audit, 19 November 2026

**How it was done.** A bot played two full years as a governor (year 1 to year 3), twice: once with every
experiment feature off and once with them all on (except `look`). Every screen it passed was recorded: what was
on top, the number of words, the buttons, and whether there was a picture. A third run started a new game from
the title screen. The code review's findings are listed at the end.

## The numbers (features off / on)

| | Off | On |
|---|---|---|
| Taps from year 1 to year 3 | 191 | 208 |
| Taps on a real choice | 51 | 51 |
| Taps on Okay / Continue / Close | 69 (36%) | 69 (33%) |
| Taps that only went looking for what to do next | 71 | 88 |
| Result cards with no picture and one button | 13 of 24 | fewer |

Roughly: **one tap in four is a real choice.** The rest is acknowledging, or finding the next thing to do.

## Where the experience leaks, most costly first

1. **Results repeat the button.** After a choice, a text-only card often just says it back: "Pay it in full.
   Done." or "You chose: Pay salaries in full from the bank." It shows nobody reacting and no picture, and it takes
   one more tap. It happens after almost every decision.
   *Fix:* show the result on the decision card itself (the choice turns into the outcome, the meters move, one
   person reacts in a line), and drop the separate card when it only repeats numbers.
2. **The turn of the year is a wall of passive screens.** "The year is done" (162 words), then "How the last year
   went", "Year 3's money is in", the budget, "Send to the House", "Call the vote", "Appropriation bill passed" and
   "On to policies". That is about eight taps in a row where the player decides almost nothing.
   *Fix:* one year-end screen (the front page and three numbers), and a budget that passes in one card when you
   hold the House.
3. **Letters take two taps to answer.** "✍️ Handle it personally" was 11 of the 25 real choices in year 2. Every
   letter needs that tap before the real options appear.
   *Fix:* put the options straight on the letter, with "Let the Chief of Staff handle it" as one of them.
4. **The same admin every year.** The Economic Council, the allocation ("came in at 81%") and the House vote come
   round every year in the same shape. By year 3 they feel like paperwork.
   *Fix:* the second time, shorten them to one line with a choice, or skip them when nothing has changed.
5. **A new player can lose before they ever govern.** In the new-game run, the bot lost its first election by
   1.2% on a normal start. Governing is the heart of the game, and a loser must replay the whole campaign to see it.
   *Fix:* make a player's first ever election winnable on any sensible campaign, for example a slight boost for a
   first-timer.
6. **The fun new parts are off the beaten path.** The map, neighbourhood jobs and the Governor's powers are only
   found by tapping around. The year never sends you there, so the bot (and most players) walk past them.
   *Fix:* point to them at the right moment: "See it on the map" when a project opens or a problem appears there,
   and one neighbourhood job offered on Today.
7. **Jargon and pictureless steps in year one.** Setting up your government is seven screens before the first
   real dilemma, and some say "APPROPRIATION BILL PASSED" without a picture (unless the `words` feature is on).

## Code review (fixed and deployed today)

- Tapping a problem on the map could land on a Today screen with the list hidden (half of players). **Fixed.**
- A neighbourhood job could put off a problem for ever (one borehole a year). **Fixed.**
- A double tap could pay for a neighbourhood job twice. **Fixed.**
- The front-page checker dropped words like "annulled". **Fixed.**
- During a Lagos Life outage, players were told to reopen the game. **Fixed** (the server now says
  `verify_down`).
- The `local` feature only shows when `map` is on, so judge it among map players. **Noted.**

## What would move the needle most

Items 1 to 3 together cut about a third of the taps in a year without removing a single decision, and they make
each choice land with a face and a picture. They are the best next build, ahead of more content.
