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
| productId | Kind | Price | Status |
|---|---|---|---|
| `second_chance` | consumable | ₦500 | built: reruns a lost re-election once per game |
| `presidential_run` | one-off | ₦1,500 | built: Road to Aso Rock (primary, running mate, six-week campaign, election night) |
| `scenario_pack` | one-off | ₦1,000 | **not built yet** — don't list until it is |

## Inside the frame
- Hidden: fullscreen, the share card, copy buttons, and X / WhatsApp links.
- No sound while Vatar pauses the game.
- The final career score (grade × 10, + 50 per honour, + 200 for a second term) goes to the leaderboard.
- Parties are fictional (NRA, YDM, UCP, PFP, WPN). Old saves are converted on load.
