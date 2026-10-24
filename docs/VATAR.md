# Vatar (Lagos Life) edition

The game is served by `server/vatar-server.mjs` on Railway (project **seat-of-power**, service **game**):

- **Game address:** https://game-production-4446.up.railway.app/
- **Webhook address:** https://game-production-4446.up.railway.app/vatar-webhook
- **Health check:** https://game-production-4446.up.railway.app/health (`"configured": true` once the secret is set)

## What the server does
- **Serves `public/`** with `Content-Security-Policy: frame-ancestors` for the Vatar worlds. It also injects `window.SOP_VATAR`, the Vatar SDK and `public/sop-vatar.js` into the page.
- **Saves:** each player's saves (`sop_save`, `sop_profile`, `sop_preelection`) are kept at `/data/players/<playerId>.json` on the Railway volume. The player id is the per-game pseudonym from `POST /session/verify`. Nothing else about the player is stored. `POST /api/delete` removes a player's file (Developer Agreement §8).
- **`POST /claim`:** checks a purchase with `GET /purchases/{id}` (paid, and this player's), grants it once per purchase id, then calls `POST /purchases/{id}/deliver`.
- **`POST /vatar-webhook`:** verifies `X-Vatar-Signature` and answers 200. Granting happens in `/claim`.

## Railway variables
| Variable | Value |
|---|---|
| `PORT` | `8080` |
| `DATA_DIR` | `/data` |
| `VATAR_SECRET` | the owner pastes `vtr_test_…` (later `vtr_live_…`) |
| `VATAR_WEBHOOK_SECRET` | the owner pastes `vtr_whsec_…` |
| `FEEDBACK_KEY` | a long password the owner makes up; it opens the feedback page |

Never commit the secrets or paste them into chat.

## Player feedback
Players send "What do you not like?" and "What do you want to see better?" with 1–5 stars, from the ☰ menu (title screen and in game). The adviser also asks once after year 2 and once at the end of a career, unless the player sent feedback in the last week. A player can send at most 5 messages a day.

- Stored on the server in `DATA_DIR/feedback.jsonl`, one line per message, with the Lagos Life username, screen, year and state.
- Read it at `https://<your Railway domain>/feedback?key=<FEEDBACK_KEY>`: newest first, average stars, number of players, and a **download CSV** link.
- Without `FEEDBACK_KEY` set, or with the wrong key, the page answers "Not found".

## What players choose (anonymous)
The same page also shows **What players choose**: for each decision, how many players made it and the share who picked each answer, with bars. Each player counts once per answer; player ids are hashed and no names are stored. Kept in `DATA_DIR/stats.json`; `&format=stats` gives it as JSON.

## Play time
- **Stats page:** a **Play time** section shows:
  - total time played;
  - the average and typical (median) player;
  - how long players stay, in bands from under 5 minutes to 10+ hours;
  - the 20 longest players, by anonymous id, with days played and when they were last seen.
- **JSON:** `&format=stats` includes it as `_playtime`.
- **What counts:** only real play, meaning the game is in view, not paused, and has had a tap in the last two minutes.
- **How it is sent:** the game reports every minute to `/api/play`. The server accepts no more time than has actually passed.
- **Players:** they see their own time on the Career map, next to states governed and governorships.

Recorded: state, party, agenda, adviser, level, deputy (unity or own pick), running at home, Quick start, honour carried, Chief of Staff, each godfather demand (gave in / refused), dilemmas, Desk cards (council elections, succession…), traditional-ruler matters, trips (went / sent / declined), bills (signed / vetoed), letters (personal / Chief of Staff), reforms adopted, ministries created, the nephew's ministry, ending, grade and the state of each ending.

## Products (create them in the Vatar dashboard)
Each product sells more play, never a better result, so titles, honours and the boards keep their value. The `productId` must be typed exactly as below.

| productId | Kind | Price | Name to show | What the player gets |
|---|---|---|---|---|
| `streak_freeze` | consumable | ₦100 | Streak Freeze | Saves the daily streak on a day the player misses; used automatically. |
| `career_ambassador` | one-off | ₦1,000 | The Ambassador | The full posting after the free first year: three years, Abuja's verdict (recall, expulsion or promotion), the whole ambassador's notebook. |
| `career_chairman` | one-off | ₦500 | The LGA Chairman | The full chairmanship after the free first year: three years, the council election, the whole chairman's notebook. |
| `career_senator` | one-off | ₦1,000 | The Senator | The full Senate career after the free first year: four years, re-election, the player's own laws, the whole Senate notebook. |
| `company_registration` | consumable | ₦1,500 | Register your company | Registers the player's own contractor; every player sees it. One credit per registration (a rename after we hide a name is free). |
| `challenge_retry` | consumable | ₦100 | Extra Challenge Attempt | One more run at this week's challenge (the first each week is free). The best score of the week counts. |
| `second_chance` | consumable | ₦500 | Second Chance | Rerun a lost re-election, once per game. The career is marked in the Hall, earns no second-term points or "Second term" honour, and it can't be used in a challenge run. |
| `scenario_pack` | one-off | ₦1,000 | Crisis Scenarios | Four starts: The Oil Crash, The Cholera Year, The Flood Year, The Broke State. |
| `scenario_security` | one-off | ₦1,000 | Security Pack | Three starts: The Bandit Corridor, The School Abduction, The Sit-at-Home. |
| `scenario_election` | one-off | ₦1,000 | Election Pack | Three starts: The Narrow Win (tribunal petition), The Hostile House, The Godfather's Candidate. |
| `portrait_frames` | one-off | ₦100 | Official Portrait Frames | Four frames for the player's portrait (Gold Big Man, Pink Glam, Owambe, Green & White). Shown on the title, the arrival, the end screen and the wiki. |
| `presidential_run` | one-off | ₦1,500 | Road to Aso Rock | The presidential run after a governorship. |

**Attire packs (the art is in, create these now):** the looks show in the pickers, locked until bought.

| productId | Kind | Price | Name to show | What the player gets |
|---|---|---|---|---|
| `attire_glam` | one-off | ₦300 | Glam Pack | Pink Power, Pink Agbada, Owambe Queen, Owambe King. |
| `attire_bigboy` | one-off | ₦300 | Big Boy Pack | Big Boy, Odogwu, Big Girl, Lagos Baddie. |

**Free, to bring players back every day:** the Daily Decision and the streak.
- **Daily Decision:** one dilemma a day (from `game/systems/daily.js`, day 1 is 24 October 2026 UTC), the same for everyone. After choosing, the player sees what happened, the share of governors who chose the same (from `/api/daily/vote`, one vote per player per day, kept in `/data/daily/d<day>.json`), and a spoiler-free share text for WhatsApp.
- **Streak:** a day counts when the player answers the Daily Decision or closes a year of governing. A `streak_freeze` bridges one missed day.
- **Year-end letter:** closing a year shows a sealed letter about next year; the title's Continue says when one is waiting.
- **Career map:** each finished governorship colours its state on a map of the 36 states and the FCT, with eleven badges.

**Free, to bring players back:** the weekly challenge.
- **What it is:** a new state every Monday at 00:00 UTC, the same seeded luck for everyone, on Medium, set up by Quick start.
- **The board:** the week's board (top 20 and your rank) is kept by our server in `/data/boards/w<week>.json`.
- **Scoring:** a challenge's career score is the same as the leaderboard score.

**Server routes** (all checked against the player's Vatar session):
- `/api/challenge/start`: counts attempts and uses a `challenge_retry` after the first.
- `/api/challenge/score`: keeps the player's best for the current or previous week.
- `/api/challenge/board`.
- `/api/hall/submit` and `/api/hall/board`: the all-time Hall of Governors, the best finished career per player (a Second Chance career is not submitted).

**Names on the boards:** both boards show the player's **Lagos Life username**. The server prefers the name Vatar returns from `/session/verify` (`username`, `displayName` or `name`). Otherwise it uses the name the SDK gave the game (`window.SOP_PLAYER`). `/api/delete` also removes the player from the Hall.

## Inside the frame
- Hidden: fullscreen, the share card, copy buttons, and X / WhatsApp links.
- No sound while Vatar pauses the game.
- The final career score (grade × 10, + 50 per honour, + 200 for a second term) goes to the leaderboard.
- Parties are fictional (NRA, YDM, UCP, PFP, WPN). Old saves are converted on load.

## Player companies
A player registers a company with a name and one sector, using one `company_registration` credit (₦1,500). Menu → Your company.

**What other players see**
- The company bids for that sector's projects, marked "★ Player-owned".
- It has top stats: reliable 92, quality 92, speed 88, integrity 90.
- It costs 5% more than average.
- Each sector lists the three most-hired player companies.

**What the owner gets**
- Each governor who hires the company earns the owner ₦20M, counted once per hiring player per company per day.
- The fees are paid into the owner's next campaign war chest, up to ₦1B at a time.

**Self-dealing.** In the owner's own game, the company is "Your company". Giving it a contract:
- pays 15% of the contract into the personal campaign fund that pays for re-election;
- raises corruption by 3% for the first deal and 2% more for each one after (3%, 5%, 7%…);
- from the second deal, opens an EFCC file: approval −3 and federal relations −4;
- from the third, brings an EFCC raid on the company: approval −6, federal relations −8 and party stability −5.

**Names**
- `server/company-name.mjs` checks every name. It refuses real firms, banks, brands and politicians, rude words and junk, and adds "Ltd" when a name has no company ending.
- The **Player companies** list on the feedback page has a Hide link for each name. A hidden company stops bidding everywhere, and its owner can rename it for free.

**Storage:** `DATA_DIR/companies.json`. The owner's id stays on the server, and the game only ever receives names, sectors and hire counts.

## Free careers while products await approval
**The switch:** set `FREE_CAREERS=1` in Railway Variables, and every player gets the Senator, LGA Chairman, Ambassador and Road to Aso Rock unlocked. The Careers list then says "Unlocked."

**To bring the paywall back:** remove the variable (Railway restarts the service). Purchases already made are untouched either way.

**To check it:** `/health` shows `freeCareers: true|false`, and the server log line starts with `[careers free]`.
