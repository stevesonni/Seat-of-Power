# Our own shop: seatofpower.online (Google sign-in + Paystack)

**Never inside Lagos Life.** The Vatar Developer Agreement (sections 4(g) and 5.1) allows only Vatar's checkout in
the game there, and no mention of paying anywhere else. `public/sop-web.js` does nothing at all when the game is
framed (tested in `tests/shop.test.mjs`). Players are never linked between Lagos Life and our site (section 8.2(b)).

## How it works
- **Accounts:** Google sign-in. The server checks Google's ID token (audience = our client ID), then gives its own
  signed 30-day session. The account id is `w_` + a hash of Google's id; saves and purchases are kept under it, as for
  a Lagos Life player. The email is used only for Paystack's receipt and is never written to disk.
- **Checkout:** `POST /api/shop/pay` starts a Paystack payment at the price in `server/shop.mjs` (`PRICES`, the
  same as the Vatar listing) and sends the player to Paystack's page (card, bank transfer, USSD). The player comes
  back to `/?paid=<reference>`; the server checks the reference with Paystack and grants the product.
- **Webhook:** `POST /api/paystack/webhook`, signed by Paystack (HMAC-SHA512 with our secret key). The server asks
  Paystack about the reference again before granting. Each reference is granted once, and only at the right amount
  in naira.
- **Test mode:** with `sk_test_` keys, Paystack's test cards "pay" without money, so the shop only opens on the
  private link `https://seatofpower.online/?shoptest=1`, and the server refuses test payments from anywhere else.
  Ordinary players see nothing until the live keys are in.
- With the shop on, paid extras are locked on our site until bought (as in Lagos Life); with it off, everything
  stays open outside Lagos Life, as before.

## Railway Variables
| Name | What | Secret? |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys (`sk_test_…`, later `sk_live_…`) | **yes**: never paste it in chat |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_…` / `pk_live_…` | no |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth client ID (Web), ends `.apps.googleusercontent.com` | no |
| `WEB_SHOP` | `1` to switch the shop on | no |
| `SHOP_SECRET` | optional; signs our sessions (otherwise made once and kept on the data volume) | yes |

In Paystack: Settings → API Keys & Webhooks → Webhook URL `https://seatofpower.online/api/paystack/webhook`.
In Google Cloud: the OAuth client's "Authorised JavaScript origins" must include `https://seatofpower.online`.
`/health` shows `shop` and `shopMode` (test or live).
