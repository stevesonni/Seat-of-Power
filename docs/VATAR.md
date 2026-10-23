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

Never commit the secrets or paste them into chat.

## Products (create them in the Vatar dashboard)
Each product sells more play, never a better result, so titles, honours and the boards keep their value. The `productId` must be typed exactly as below.

| productId | Kind | Price | Name to show | What the player gets |
|---|---|---|---|---|
| `challenge_retry` | consumable | ₦100 | Extra Challenge Attempt | One more run at this week's challenge (the first each week is free). The best score of the week counts. |
| `second_chance` | consumable | ₦500 | Second Chance | Rerun a lost re-election, once per game. The career is marked in the Hall, earns no second-term points or "Second term" honour, and it can't be used in a challenge run. |
| `scenario_pack` | one-off | ₦1,000 | Crisis Scenarios | Four starts: The Oil Crash, The Cholera Year, The Flood Year, The Broke State. |
| `scenario_security` | one-off | ₦1,000 | Security Pack | Three starts: The Bandit Corridor, The School Abduction, The Sit-at-Home. |
| `scenario_election` | one-off | ₦1,000 | Election Pack | Three starts: The Narrow Win (tribunal petition), The Hostile House, The Godfather's Candidate. |
| `portrait_frames` | one-off | ₦100 | Official Portrait Frames | Four frames for the player's portrait (Gold Big Man, Pink Glam, Owambe, Green & White). Shown on the title, the arrival, the end screen and the wiki. |
| `presidential_run` | one-off | ₦1,500 | Road to Aso Rock | The presidential run after a governorship. |

**Create later, once the art is in** (see `docs/ART-ATTIRE.md`): each look shows up in the pickers only when its picture exists.

| productId | Kind | Price | Name to show | What the player gets |
|---|---|---|---|---|
| `attire_glam` | one-off | ₦300 | Glam Pack | Pink Power, Pink Agbada, Owambe Queen, Owambe King. |
| `attire_bigboy` | one-off | ₦300 | Big Boy Pack | Big Boy, Odogwu, Big Girl, Lagos Baddie. |

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
