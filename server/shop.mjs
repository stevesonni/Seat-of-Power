/* Our own shop, for seatofpower.online only (never inside Lagos Life: the Vatar Developer Agreement, sections
   4(g) and 5.1, allows only Vatar's checkout there; the game turns this off whenever it is framed).

   - Accounts: Google sign-in. The browser gets a Google ID token; we check it with Google, then give our own
     signed session (30 days). The account id is a hash of Google's id; the email is kept only inside the signed
     session, for Paystack's receipt, and never written to disk.
   - Checkout: Paystack. The price always comes from PRICES here, never from the browser. A product is granted only
     after Paystack confirms the payment (the signed webhook, or our own check of the reference when the player
     returns), and each payment reference is granted once.

   Environment (Railway Variables): PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, GOOGLE_CLIENT_ID, and WEB_SHOP=1 to
   switch it on. SHOP_SECRET signs sessions (made and kept in DATA if not set). */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// The same products and naira prices as the Vatar listing (docs/VATAR.md).
export const PRICES = {
  streak_freeze: 100, challenge_retry: 100, portrait_frames: 100,
  attire_glam: 300, attire_bigboy: 300,
  career_chairman: 500, second_chance: 500,
  career_ambassador: 1000, career_senator: 1000, scenario_pack: 1000, scenario_security: 1000, scenario_election: 1000,
  company_registration: 1500, presidential_run: 1500,
};
export const NAMES = {
  streak_freeze: "Streak Freeze", challenge_retry: "Extra Challenge Attempt", portrait_frames: "Official Portrait Frames",
  attire_glam: "Glam Pack", attire_bigboy: "Big Boy Pack", career_chairman: "The LGA Chairman", second_chance: "Second Chance",
  career_ambassador: "The Ambassador", career_senator: "The Senator", scenario_pack: "Crisis Scenarios",
  scenario_security: "Security Pack", scenario_election: "Election Pack", company_registration: "Register your company",
  presidential_run: "Road to Aso Rock",
};
const b64 = (b) => Buffer.from(b).toString("base64url");

export function makeShop({ DATA, PRODUCTS, withP, writeP, env = process.env, fetchFn = globalThis.fetch, now = () => Date.now() }) {
  const PSK = String(env.PAYSTACK_SECRET_KEY || "").trim(), PPK = String(env.PAYSTACK_PUBLIC_KEY || "").trim();
  const GCID = String(env.GOOGLE_CLIENT_ID || "").trim(), BASE = String(env.SHOP_BASE_URL || "https://seatofpower.online").replace(/\/$/, "");
  const on = env.WEB_SHOP === "1" && !!PSK && !!GCID;
  const mode = PSK.startsWith("sk_live_") ? "live" : PSK.startsWith("sk_test_") ? "test" : PSK ? "unknown" : "none";
  // Which mode the shop runs in (never the keys themselves). A live secret key with a test public key, or the other
  // way round, is a mix-up worth flagging.
  if (env.WEB_SHOP === "1") console.log("[shop] " + (on ? "on" : "off (keys missing)") + " · " + mode + " mode" + (PPK && PSK && PPK.startsWith("pk_live_") !== PSK.startsWith("sk_live_") ? " · WARNING: public and secret keys are from different modes" : ""));
  // The key that signs our sessions: from the environment, else made once and kept with the data.
  let SS = String(env.SHOP_SECRET || "").trim();
  if (!SS) { const f = path.join(DATA, "shop-secret"); try { SS = fs.readFileSync(f, "utf8").trim(); } catch (e) { SS = crypto.randomBytes(32).toString("hex"); try { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(f, SS, { mode: 0o600 }); } catch (x) {} } }
  const sign = (s) => crypto.createHmac("sha256", SS).update(s).digest("base64url");
  const token = (acct, email) => { const body = b64(JSON.stringify({ a: acct, e: email, x: now() + 30 * 864e5 })); return body + "." + sign(body); };
  const readToken = (t) => {
    if (typeof t !== "string" || t.length > 2000) return null; const [body, sig] = t.split(".");
    if (!body || !sig) return null; const want = Buffer.from(sign(body)), got = Buffer.from(sig);
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
    try { const j = JSON.parse(Buffer.from(body, "base64url").toString()); return j.x > now() && /^w_[A-Za-z0-9_-]{8,64}$/.test(j.a) ? j : null; } catch (e) { return null; }
  };
  const acctOf = (sub) => "w_" + crypto.createHash("sha256").update("sop-web:" + sub).digest("base64url").slice(0, 24);
  const paystack = async (p, body) => {
    const r = await fetchFn("https://api.paystack.co" + p, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + PSK, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    let j = {}; try { j = await r.json(); } catch (e) {} return { http: r.status, ...j };
  };
  // Grant a paid product once per Paystack reference. ref: { reference, amount (kobo), currency, status, metadata }.
  const grant = (d) => {
    const md = d && d.metadata || {}, acct = md.acct, product = md.product;
    if (!d || d.status !== "success" || d.currency !== "NGN" || !/^w_/.test(acct || "") || !PRICES[product] || !PRODUCTS[product]) return Promise.resolve({ ok: false, why: "not_ours" });
    if (+d.amount !== PRICES[product] * 100) return Promise.resolve({ ok: false, why: "amount" });
    return withP(acct, (p) => {
      p.paid = p.paid || []; p.ents = p.ents || {};
      if (p.paid.includes(d.reference)) return { ok: true, again: true, ents: p.ents, product };
      p.paid = [...p.paid, d.reference].slice(-500);
      p.ents[product] = PRODUCTS[product] === "consumable" ? (p.ents[product] || 0) + 1 : 1;
      writeP(acct, p); console.log("[shop] granted " + product + " (" + mode + ")"); return { ok: true, ents: p.ents, product };
    });
  };
  const verifyRef = async (reference) => {
    if (!/^sop_[A-Za-z0-9_]{6,80}$/.test(String(reference || ""))) return { ok: false, why: "bad_reference" };
    const v = await paystack("/transaction/verify/" + encodeURIComponent(reference)).catch(() => ({ http: 0 }));
    if (v.http !== 200 || !v.status || !v.data) return { ok: false, why: "not_confirmed" };
    return grant(v.data);
  };
  const routes = {
    // What the page needs to know, public.
    "config": async () => ({ on, mode, googleClientId: on ? GCID : null, publicKey: on ? PPK : null, prices: on ? PRICES : null, names: on ? NAMES : null }),
    // Google sign-in: check the ID token with Google, then our own session.
    "login": async (b) => {
      if (!on) return { _code: 503, error: "shop_off" };
      const cred = String(b.credential || ""); if (!cred || cred.length > 4096) return { _code: 400, error: "bad_request" };
      const r = await fetchFn("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(cred)).catch(() => null);
      let g = {}; try { g = r ? await r.json() : {}; } catch (e) {}
      if (!r || r.status !== 200 || g.aud !== GCID || !/^(https:\/\/)?accounts\.google\.com$/.test(g.iss || "") || !(+g.exp * 1000 > now()) || !g.sub) return { _code: 401, error: "bad_google" };
      const acct = acctOf(g.sub), email = g.email_verified === true || g.email_verified === "true" ? String(g.email || "") : "";
      return { ok: true, token: token(acct, email), name: String(g.given_name || g.name || "").slice(0, 40) };
    },
    // Start a payment: Paystack's page for this product at our price.
    "pay": async (b) => {
      if (!on) return { _code: 503, error: "shop_off" };
      const t = readToken(b.token); if (!t) return { _code: 401, error: "sign_in" };
      const product = String(b.product || ""); if (!PRICES[product] || !PRODUCTS[product]) return { _code: 400, error: "unknown_product" };
      // Test keys: Paystack's test cards "pay" without money, so test mode only works from the private test link.
      if (mode !== "live" && b.test !== true) return { _code: 403, error: "test_mode" };
      if (!t.e) return { _code: 400, error: "no_email" };
      const reference = "sop_" + crypto.randomBytes(12).toString("hex");
      const r = await paystack("/transaction/initialize", { email: t.e, amount: PRICES[product] * 100, currency: "NGN", reference, callback_url: BASE + "/play?paid=" + reference, metadata: { acct: t.a, product, custom_fields: [{ display_name: "Item", variable_name: "item", value: NAMES[product] || product }] } }).catch(() => ({ http: 0 }));
      if (r.http !== 200 || !r.status || !r.data || !r.data.authorization_url) return { _code: 502, error: "paystack_down" };
      return { ok: true, url: r.data.authorization_url, reference };
    },
    // Back from Paystack: check the reference ourselves (the webhook may come a moment later; granting is once).
    "verify": async (b) => { const t = readToken(b.token); if (!t) return { _code: 401, error: "sign_in" }; const g = await verifyRef(b.reference); return g.ok ? { ok: true, product: g.product, ents: g.ents } : { ok: false, why: g.why }; },
  };
  // Paystack's webhook: signed with our secret key (HMAC-SHA512 of the raw body).
  const webhook = async (raw, sig) => {
    if (!PSK) return { _code: 503 };
    const want = crypto.createHmac("sha512", PSK).update(raw).digest("hex"), got = String(sig || "");
    if (want.length !== got.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(got))) return { _code: 401, error: "bad_signature" };
    let ev = {}; try { ev = JSON.parse(raw.toString()); } catch (e) { return { _code: 400 }; }
    if (ev.event !== "charge.success") return { ok: true, ignored: ev.event };
    // Trust nothing in the body but the reference: ask Paystack again before granting.
    return verifyRef(ev.data && ev.data.reference);
  };
  return { on, mode, routes, webhook, readToken };
}
