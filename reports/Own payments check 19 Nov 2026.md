# Taking payments ourselves: a check (19 November 2026)

Lagos Life (Vatar) has not approved the game's products yet, so nothing can be sold there today. This note looks at
selling the same products ourselves. It is research only: nothing has been signed up for or bought.

## The short answer

Yes, it can be done, but with two conditions:

1. **Sell on our own site (seatofpower.online), not inside Lagos Life.** Platforms that host games usually require
   their own checkout for anything sold inside the game, as app stores do. Taking our own payments inside the Lagos
   Life frame could break their terms and get the game removed. Check the Vatar developer agreement first. Keep
   Vatar's checkout inside Lagos Life, and use our own checkout on our own site.
2. **Players on our site need an account.** At the moment a player on seatofpower.online has no login. Their game
   lives on the phone. Something they paid for must not vanish when they change phone or clear the browser, so
   purchases need an account to belong to: Google sign-in (which we discussed earlier) or a login by phone number or
   email.

## Which payment company

| | Paystack | Flutterwave | Stripe |
|---|---|---|---|
| Fee on a Nigerian card, bank transfer or USSD | about 1.5% + ₦100; the ₦100 is waived under ₦2,500; capped at ₦2,000 | about 2% (raised in April 2025), capped at ₦2,000 | not available to Nigerian businesses directly |
| Without a registered company (CAC) | yes: a "Starter Business" with a personal account and ID | needs checking | — |
| On a ₦100 Streak Freeze | about ₦1.50 | about ₦2 | — |
| On a ₦1,000 career | about ₦15 | about ₦20 | — |

**Recommendation: Paystack.** It is the cheapest on small purchases (all our prices are under ₦2,500, so the ₦100
fixed fee does not apply), it takes cards, bank transfer and USSD, and you can start as a Starter Business without
a registered company. The fee figures come mostly from third-party 2026 guides: confirm them on Paystack's own
pricing page when you sign up.

## If the game ever goes on the Google Play Store

Google requires its own billing for anything sold inside a Play Store app (about 15% fee) and forbids sending players
to an outside checkout from the app. Selling on the website stays allowed. So: website sales through Paystack,
Play Store sales through Google.

## What building it involves (about two days)

The game's server already keeps each player's purchases ("entitlements") and checks every Vatar purchase before
granting it. Our own checkout reuses that:
1. **Accounts on our site:** Google sign-in (or phone/email login). Saves and purchases follow the player.
2. **Checkout:** a "Buy" button on our site opens Paystack's payment page for the product. The price is set on our
   server, never in the browser.
3. **Granting:** Paystack tells our server when a payment succeeds (a signed webhook). The server checks the
   signature and the amount, then grants the product. It is never granted on the browser's word.
4. **Receipts and refunds:** a small list of purchases on the dashboard you already use.
5. **The same products and prices** as in the Vatar listing (₦100 to ₦1,500), so both shops match.

## What only you can do

- **Read the Lagos Life developer agreement** on outside payments (or ask Vatar directly).
- **Open a Paystack account** (as a Starter Business is fine). Paystack asks you for ID and a bank account for
  payouts; you enter those with Paystack, never in this chat.
- **Put Paystack's two keys into Railway's Variables** (as was done for the Vatar keys). I will never read them back.
- **Choose the login:** Google sign-in only, or Google plus phone number.

Once the keys are in Railway, I can build and test it with Paystack's test mode first (test cards, no real money),
then switch to live.

Sources: Paystack pricing and Starter Business pages (support.paystack.com, paystack.com/blog), 2026 comparisons of
Paystack and Flutterwave fees in Nigeria, and Google Play's payments policy (play.google.com/about/monetization-ads/payments,
developer.chrome.com Trusted Web Activity billing).
