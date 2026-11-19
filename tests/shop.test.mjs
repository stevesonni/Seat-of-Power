// Our own shop (server/shop.mjs, public/sop-web.js): Google sign-in, Paystack checkout, the signed webhook, a
// product granted once and only at our price, and nothing at all inside Lagos Life.
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { makeShop, PRICES } from "../server/shop.mjs";
const PRODUCTS = { career_senator: "oneoff", streak_freeze: "consumable" };
function setup(over = {}) {
  const DATA = fs.mkdtempSync(path.join(os.tmpdir(), "shop-")), store = {}, calls = [];
  const withP = async (id, fn) => fn(store[id] || (store[id] = { data: {}, ents: {} })), writeP = (id, p) => { store[id] = p; };
  const paid = {}; // reference → data Paystack would confirm
  const fetchFn = async (url, o = {}) => {
    calls.push([url, o]);
    if (url.startsWith("https://oauth2.googleapis.com/tokeninfo")) { const good = url.includes("good"); return { status: good ? 200 : 400, json: async () => good ? { aud: "cid.apps", iss: "accounts.google.com", exp: String(Math.floor(Date.now() / 1000) + 600), sub: "12345", email: "p@example.com", email_verified: "true" } : {} }; }
    if (url.endsWith("/transaction/initialize")) { const b = JSON.parse(o.body); paid[b.reference] = { reference: b.reference, amount: b.amount, currency: "NGN", status: "success", metadata: b.metadata }; return { status: 200, json: async () => ({ status: true, data: { authorization_url: "https://checkout.paystack.com/x", reference: b.reference } }) }; }
    if (url.includes("/transaction/verify/")) { const ref = decodeURIComponent(url.split("/").pop()), d = paid[ref]; return { status: d ? 200 : 404, json: async () => d ? { status: true, data: d } : { status: false } }; }
    throw new Error("unexpected " + url);
  };
  const env = { WEB_SHOP: "1", PAYSTACK_SECRET_KEY: "sk_test_abc", PAYSTACK_PUBLIC_KEY: "pk_test_x", GOOGLE_CLIENT_ID: "cid.apps", ...over };
  return { shop: makeShop({ DATA, PRODUCTS, withP, writeP, env, fetchFn }), store, paid, calls };
}
test("shop: off unless switched on with its keys", async () => {
  assert.equal(setup({ WEB_SHOP: "" }).shop.on, false);
  assert.equal(setup({ GOOGLE_CLIENT_ID: "" }).shop.on, false);
  const c = await setup({ WEB_SHOP: "" }).shop.routes.config(); assert.equal(c.on, false); assert.equal(c.publicKey, null);
});
test("shop: sign in, pay at our price, granted once, webhook signed", async () => {
  const { shop, store, paid, calls } = setup();
  assert.equal((await shop.routes.login({ credential: "bad" }))._code, 401, "a token Google does not accept is refused");
  const L = await shop.routes.login({ credential: "good" }); assert.ok(L.token);
  assert.equal((await shop.routes.pay({ token: L.token, product: "nope", test: true }))._code, 400);
  assert.equal((await shop.routes.pay({ token: "forged.token", product: "career_senator", test: true }))._code, 401);
  assert.equal((await shop.routes.pay({ token: L.token, product: "career_senator" }))._code, 403, "test keys: only from the private test link");
  const P = await shop.routes.pay({ token: L.token, product: "career_senator", amount: 1, test: true });
  assert.ok(P.ok); const init = JSON.parse(calls.find(c => c[0].endsWith("/initialize"))[1].body);
  assert.equal(init.amount, PRICES.career_senator * 100, "the price comes from the server, not the browser");
  const acct = init.metadata.acct; assert.match(acct, /^w_/);
  const V = await shop.routes.verify({ token: L.token, reference: P.reference }); assert.ok(V.ok); assert.equal(store[acct].ents.career_senator, 1);
  // The webhook for the same payment: a bad signature is refused; a good one does not grant twice.
  const raw = Buffer.from(JSON.stringify({ event: "charge.success", data: { reference: P.reference } }));
  assert.equal((await shop.webhook(raw, "nope"))._code, 401);
  const sig = crypto.createHmac("sha512", "sk_test_abc").update(raw).digest("hex");
  const W = await shop.webhook(raw, sig); assert.ok(W.ok && W.again, "granted once per reference"); assert.equal(store[acct].paid.length, 1);
  // A consumable adds one each time; a payment of the wrong amount grants nothing.
  const P2 = await shop.routes.pay({ token: L.token, product: "streak_freeze", test: true }); await shop.routes.verify({ token: L.token, reference: P2.reference });
  const P3 = await shop.routes.pay({ token: L.token, product: "streak_freeze", test: true }); paid[P3.reference].amount = 100; // ₦1, not ₦100
  assert.equal((await shop.routes.verify({ token: L.token, reference: P3.reference })).ok, false);
  assert.equal(store[acct].ents.streak_freeze, 1);
  assert.equal((await shop.routes.verify({ token: L.token, reference: "sop_unknownref1" })).ok, false, "an unpaid reference grants nothing");
});
test("sop-web.js does nothing inside Lagos Life (framed)", () => {
  const code = fs.readFileSync(new URL("../public/sop-web.js", import.meta.url), "utf8"); let fetched = false;
  const win = { top: {} }; win.SOP_buy = "vatar";
  vm.runInNewContext(code, { window: win, fetch: () => { fetched = true; return Promise.resolve({ json: async () => ({}) }); }, localStorage: {}, location: { search: "" }, document: {}, URLSearchParams });
  assert.equal(fetched, false, "no call to our shop at all"); assert.equal(win.SOP_buy, "vatar", "Vatar's checkout untouched");
});
