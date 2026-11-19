/* Our own shop on seatofpower.online: Google sign-in and Paystack (server/shop.mjs).
   Never inside Lagos Life: the Vatar Developer Agreement (sections 4(g) and 5.1) allows only Vatar's checkout
   there, and no mention of paying anywhere else. So when the game is framed this file does nothing at all. */
(function () {
  var framed = false; try { framed = window.top !== window; } catch (e) { framed = true; }
  if (framed) return;
  var TK = "sop_web_token", cfg = null;
  function tok() { try { return localStorage.getItem(TK) || ""; } catch (e) { return ""; } }
  function setTok(t) { try { if (t) localStorage.setItem(TK, t); else localStorage.removeItem(TK); } catch (e) {} }
  function post(path, body) {
    return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || "http_" + r.status); e.code = j.error; throw e; } return j; }); });
  }
  function setEnts(e) { window.SOP_ENTS = e || {}; try { window.dispatchEvent(new CustomEvent("sop-ents", { detail: window.SOP_ENTS })); } catch (x) {} }
  function toast(m, k) { try { window.SOP_toast && window.SOP_toast(m, k || "ok"); } catch (e) {} }
  function naira(n) { return "₦" + Number(n).toLocaleString("en-NG"); }

  // A plain sheet over the game (the game's own pop-ups live in its bundle; this file stays separate).
  function sheet(build) {
    var back = document.createElement("div");
    back.style.cssText = "position:fixed;inset:0;z-index:10060;background:rgba(6,14,10,.65);display:flex;align-items:center;justify-content:center;padding:16px";
    var card = document.createElement("div"); card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true");
    card.style.cssText = "background:#fffdf7;color:#13261c;border-radius:22px;max-width:420px;width:100%;padding:22px 20px 18px;box-shadow:0 28px 70px rgba(0,0,0,.45);font:500 16px/1.45 'Plus Jakarta Sans',sans-serif;text-align:center";
    var stg = document.getElementById("sop-stage"), z = stg && (parseFloat(stg.style.zoom) || parseFloat(getComputedStyle(stg).zoom)) || 1; if (z !== 1) back.style.zoom = String(1 / z);
    back.appendChild(card); document.body.appendChild(back);
    function close() { back.remove(); }
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    build(card, close); return close;
  }
  function btn(label, main, onClick) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = label;
    b.style.cssText = "display:block;width:100%;min-height:52px;margin-top:10px;border-radius:14px;font:800 17px 'Plus Jakarta Sans',sans-serif;cursor:pointer;" + (main ? "border:0;background:#0f3d24;color:#fdf8ec" : "border:1.5px solid #d9cfb9;background:transparent;color:#4b5a51");
    b.onclick = onClick; return b;
  }

  // Google sign-in. Resolves with the session token.
  var gisP = null;
  function gis() { return gisP || (gisP = new Promise(function (ok, no) { var s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = ok; s.onerror = function () { gisP = null; no(new Error("google_unreachable")); }; document.head.appendChild(s); })); }
  function signIn(why) {
    return new Promise(function (ok, no) {
      var done = false;
      var close = sheet(function (card, close) {
        card.innerHTML = '<div style="font-size:40px">🔐</div><div style="font:800 22px/1.2 Fraunces,Georgia,serif;margin:6px 0">Sign in to buy</div><div style="color:#4b5a51;margin-bottom:12px">' + (why || "Your purchases stay with your Google account, on any phone.") + '</div><div class="gbtn" style="display:flex;justify-content:center;min-height:44px"></div><div class="gmsg" style="min-height:20px;color:#b3261e;font-size:14px;margin-top:8px"></div>';
        card.appendChild(btn("Not now", false, function () { close(); if (!done) { done = true; var e = new Error("cancelled"); e.code = "cancelled"; no(e); } }));
        gis().then(function () {
          window.google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: function (r) {
            post("/api/shop/login", { credential: r.credential }).then(function (j) { setTok(j.token); done = true; close(); ok(j.token); })
              .catch(function () { card.querySelector(".gmsg").textContent = "Google sign-in did not work. Please try again."; });
          } });
          window.google.accounts.id.renderButton(card.querySelector(".gbtn"), { theme: "filled_black", size: "large", shape: "pill", text: "continue_with" });
        }).catch(function () { card.querySelector(".gmsg").textContent = "Google could not be reached. Check your connection."; });
      });
    });
  }

  // Buying: confirm the price, sign in if needed, then Paystack's page (card, bank transfer or USSD).
  function buy(productId) {
    var price = cfg.prices[productId], name = cfg.names[productId] || productId;
    if (!price) { var e0 = new Error("unknown_product"); e0.code = "unknown_product"; return Promise.reject(e0); }
    return new Promise(function (ok, no) {
      sheet(function (card, close) {
        card.innerHTML = '<div style="font-size:40px">🛒</div><div style="font:800 22px/1.2 Fraunces,Georgia,serif;margin:6px 0">' + name.replace(/[<>&]/g, "") + '</div><div style="font:800 28px Fraunces,Georgia,serif;color:#0f3d24">' + naira(price) + '</div><div style="color:#4b5a51;margin:8px 0 4px">Pay securely with Paystack: card, bank transfer or USSD. Your game is saved; you come straight back to it.</div><div class="pmsg" style="min-height:20px;color:#b3261e;font-size:14px"></div>';
        var go = btn("Pay " + naira(price), true, function () {
          go.disabled = true; go.textContent = "Opening Paystack…";
          (tok() ? Promise.resolve(tok()) : signIn()).then(function (t) {
            return post("/api/shop/pay", { token: t, product: productId, test: cfg.test }).catch(function (e) { if (e.code === "sign_in") { setTok(""); return signIn("Please sign in again.").then(function (t2) { return post("/api/shop/pay", { token: t2, product: productId, test: cfg.test }); }); } throw e; });
          }).then(function (j) {
            try { window.SOP_storageFlush && window.SOP_storageFlush(); sessionStorage.setItem("sop_paying", productId); } catch (e) {}
            window.location.href = j.url;
          }).catch(function (e) {
            go.disabled = false; go.textContent = "Pay " + naira(price);
            if (e && e.code === "cancelled") return;
            card.querySelector(".pmsg").textContent = e && e.code === "no_email" ? "Your Google account has no confirmed email for the receipt." : "Paystack could not be reached. Nothing was charged; please try again.";
          });
        });
        card.appendChild(go);
        card.appendChild(btn("Not now", false, function () { close(); var e = new Error("cancelled"); e.code = "cancelled"; no(e); }));
      });
    });
  }

  // Back from Paystack: confirm the payment with our server (it checks with Paystack), then unlock.
  function returning() {
    var q = new URLSearchParams(location.search), ref = q.get("paid") || q.get("reference");
    if (!ref) return Promise.resolve();
    try { q.delete("paid"); q.delete("reference"); q.delete("trxref"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "")); } catch (e) {}
    return post("/api/shop/verify", { token: tok(), reference: ref }).then(function (j) {
      if (j.ok) { setEnts(j.ents); toast("Thank you! " + (cfg.names[j.product] || "Your purchase") + " is unlocked.", "ok"); }
      else toast("The payment was not completed. Nothing was charged.", "warn");
    }).catch(function () { toast("We could not confirm the payment yet. If you paid, it will unlock shortly.", "warn"); });
  }

  fetch("/api/shop/config").then(function (r) { return r.json(); }).then(function (c) {
    cfg = c; if (!c || !c.on) return; // shop off: the game stays as it is (everything open outside Lagos Life)
    // With Paystack's test keys the shop opens only on the private test link (…/?shoptest=1), never for players.
    var testLink = /[?&]shoptest=1/.test(location.search) || (function () { try { return sessionStorage.getItem("sop_shoptest") === "1"; } catch (e) { return false; } })();
    if (c.mode !== "live" && !testLink) return;
    if (testLink) try { sessionStorage.setItem("sop_shoptest", "1"); } catch (e) {}
    cfg.test = c.mode !== "live";
    window.SOP_WEB_SHOP = true;
    window.SOP_canBuy = function () { return true; };
    window.SOP_buy = buy;
    window.SOP_webSignOut = function () { setTok(""); setEnts({}); };
    // What this account owns.
    if (tok()) post("/api/web/load", { token: tok() }).then(function (j) { setEnts(j.ents); }).catch(function (e) { if (e && e.code === "sign_in") setTok(""); });
    returning();
  }).catch(function () {});
})();
