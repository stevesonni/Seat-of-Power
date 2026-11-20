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
        card.innerHTML = '<div style="font-size:40px">🔐</div><div style="font:800 22px/1.2 Fraunces,Georgia,serif;margin:6px 0">Sign in with Google</div><div style="color:#4b5a51;margin-bottom:12px">' + (why || "Your purchases stay with your Google account, on any phone.") + '</div><div class="gbtn" style="display:flex;justify-content:center;min-height:44px"></div><div class="gmsg" style="min-height:20px;color:#b3261e;font-size:14px;margin-top:8px"></div>';
        card.appendChild(btn("Not now", false, function () { close(); if (!done) { done = true; var e = new Error("cancelled"); e.code = "cancelled"; no(e); } }));
        gis().then(function () {
          window.google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: function (r) {
            post("/api/shop/login", { credential: r.credential }).then(function (j) { setTok(j.token); try { localStorage.setItem("sop_web_name", j.name || ""); } catch (e) {} done = true; close(); ok(j.token); })
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

  // ── Your game on every device: Google sign-in keeps the saves on our server (the same store Lagos Life uses,
  //    under this account's own id). Playing without signing in stays on this device, as before. ──
  // The game's own records (written through window.storage); settings and test switches stay on the device.
  var SYNC = { sop_save: 1, sop_profile: 1, sop_career: 1, sop_preelection: 1, sop_pres: 1, sop_senate: 1, sop_notebook: 1, sop_lga: 1, sop_amb: 1, sop_daily: 1, sop_played: 1, sop_cab_mem: 1, sop_cards: 1, sop_record: 1 };
  function syncKeys() { var o = {}; try { Object.keys(SYNC).forEach(function (k) { var v = localStorage.getItem(k); if (v != null && v !== "") o[k] = v; }); } catch (e) {} return o; }
  function careerOf(v) { try { var j = JSON.parse(v), st = j.setup || {}; return [st.nm || "", st.state || "", (j.stc || {}).pseed || "", st.startYear || ""].join("|"); } catch (e) { return "?"; } }
  function careerName(v) { try { var j = JSON.parse(v), st = j.setup || {}; return (st.nm || "A governor") + " · " + String(st.state || "").replace(/_/g, " ") + " · year " + (j.turn || 1); } catch (e) { return "A saved game"; } }
  function savedAt(v) { try { var j = JSON.parse(v); return j && typeof j === "object" && +j.savedAt || 0; } catch (e) { return 0; } }
  var dirty = {}, upTimer = null, syncing = false;
  function upload() { var d = dirty; dirty = {}; if (!tok() || !Object.keys(d).length) return Promise.resolve();
    return post("/api/web/save", { token: tok(), data: d }).catch(function (e) { if (e && e.code === "sign_in") { setTok(""); return; } for (var k in d) if (!(k in dirty)) dirty[k] = d[k]; clearTimeout(upTimer); upTimer = setTimeout(upload, 15000); }); }
  function queue(k, v) { if (!tok() || !SYNC[k]) return; dirty[k] = v; clearTimeout(upTimer); upTimer = setTimeout(upload, 1500); }
  function hookStorage() {
    var st = window.storage; if (!st || st.__web) return;
    var set = st.set;
    st.set = function (k, v) { var r = set.apply(this, arguments); try { queue(k, v); } catch (e) {} return r; };
    st.__web = true;
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") upload(); });
    window.addEventListener("pagehide", function () { upload(); });
    var flush = window.SOP_storageFlush; window.SOP_storageFlush = function () { var a = flush ? flush() : null; return Promise.resolve(a).then(upload); };
  }
  // Two different careers (this device and the account): the player picks; the other is kept on the server.
  function pickCareer(cloudV, localV) {
    return new Promise(function (ok) {
      sheet(function (card, close) {
        card.innerHTML = '<div style="font-size:40px">☁️</div><div style="font:800 22px/1.2 Fraunces,Georgia,serif;margin:6px 0">Which game do you want to play?</div><div style="color:#4b5a51;margin-bottom:6px">Your account and this device have different games. The one you don\'t pick is kept, and you can bring it back from the title screen.</div>';
        card.appendChild(btn("☁️ " + careerName(cloudV) + " (your account)", true, function () { close(); ok("cloud"); }));
        card.appendChild(btn("📱 " + careerName(localV) + " (this device)", false, function () { close(); ok("local"); }));
      });
    });
  }
  // Bring the account and this device together. Returns true when this device changed (the game reloads once).
  function sync() {
    if (!tok() || syncing) return Promise.resolve(false); syncing = true;
    return post("/api/web/load", { token: tok() }).then(function (j) {
      setEnts(j.ents); window.SOP_BACKUPS = j.bak || [];
      var cloud = j.data || {}, local = syncKeys(), up = {}, down = {}, chain = Promise.resolve();
      Object.keys(local).forEach(function (k) { if (k !== "sop_save" && !(k in cloud)) up[k] = local[k]; });
      Object.keys(cloud).forEach(function (k) { if (k === "sop_save" || !SYNC[k]) return; if (!(k in local)) down[k] = cloud[k]; else if (local[k] !== cloud[k]) { if (savedAt(local[k]) > savedAt(cloud[k])) up[k] = local[k]; else down[k] = cloud[k]; } });
      var cs = cloud.sop_save, ls = local.sop_save;
      if (ls && !cs) up.sop_save = ls;
      else if (cs && !ls) down.sop_save = cs;
      else if (cs && ls && cs !== ls) {
        if (careerOf(cs) === careerOf(ls)) { if (savedAt(ls) > savedAt(cs)) up.sop_save = ls; else down.sop_save = cs; }
        else chain = pickCareer(cs, ls).then(function (w) {
          // Save the loser first so the server keeps it among the earlier careers, then the winner.
          return w === "cloud" ? post("/api/web/save", { token: tok(), data: { sop_save: ls } }).then(function () { return post("/api/web/save", { token: tok(), data: { sop_save: cs } }); }).then(function () { down.sop_save = cs; })
            : post("/api/web/save", { token: tok(), data: { sop_save: ls } });
        });
      }
      return chain.then(function () {
        var changed = false;
        Object.keys(down).forEach(function (k) { try { if (localStorage.getItem(k) !== down[k]) { localStorage.setItem(k, down[k]); changed = true; } } catch (e) {} });
        return (Object.keys(up).length ? post("/api/web/save", { token: tok(), data: up }) : Promise.resolve()).then(function () { return changed; });
      });
    }).catch(function (e) { if (e && e.code === "sign_in") { setTok(""); acct(null); } return false; }).then(function (ch) { syncing = false; return ch; });
  }
  function acct(name) { window.SOP_WEB_ACCOUNT = tok() ? { name: name || (function () { try { return localStorage.getItem("sop_web_name") || ""; } catch (e) { return ""; } })() } : null; try { window.dispatchEvent(new CustomEvent("sop-account", { detail: window.SOP_WEB_ACCOUNT })); } catch (e) {} }
  function reloadOnce() { try { if (sessionStorage.getItem("sop_web_synced")) return; sessionStorage.setItem("sop_web_synced", "1"); } catch (e) {} location.reload(); }

  fetch("/api/shop/config").then(function (r) { return r.json(); }).then(function (c) {
    cfg = c; if (!c || !c.on) return; // shop off: the game stays as it is (everything open outside Lagos Life)
    // Accounts: sign in any time, from the menu; the game then follows the player to any device.
    window.SOP_webSignIn = function () {
      return signIn("Your game is saved to your Google account, so you can carry on from any phone or computer.").then(function () {
        acct(); hookStorage();
        return sync().then(function (changed) { toast(changed ? "Signed in. Your saved game is here." : "Signed in. Your game is now saved to your account.", "ok"); if (changed) setTimeout(function () { location.reload(); }, 900); return true; });
      });
    };
    window.SOP_webSignOut = function () { upload().then(function () { setTok(""); setEnts({}); acct(null); toast("Signed out. Your game stays on this device.", "ok"); }); };
    window.SOP_restore = function (i) { return post("/api/web/restore", { token: tok(), i: i }).then(function (r) { if (r && r.ok) try { localStorage.setItem("sop_save", r.value); } catch (e) {} return r; }); };
    acct();
    if (tok()) { hookStorage(); sync().then(function (changed) { if (changed) reloadOnce(); else loadLeague(); }); }
    // The Hall of Governors, the weekly challenge and the leagues, for website players (ranked apart from Lagos Life).
    // Boards show the politician's name, never the Google name.
    function politician() { try { var p = JSON.parse(localStorage.getItem("sop_profile") || "null"); return p && p.first ? "Hon. " + p.first + " " + (p.last || "") : ""; } catch (e) { return ""; } }
    function wcall(path, body) { if (!tok()) return Promise.resolve({ signin: true });
      return post("/api/web/" + path, Object.assign({ token: tok() }, body || {})).catch(function (e) { if (e && e.code === "sign_in") { setTok(""); acct(null); return { signin: true }; } throw e; }); }
    function signedIn() { return tok() ? Promise.resolve(true) : signIn("Sign in to join the weekly rankings and the leagues. Your game is saved to your account too.").then(function () { acct(); hookStorage(); return sync().then(function () { loadLeague(); return true; }); }); }
    function loadLeague() { if (!tok()) return; wcall("hall/league").then(function (r) { if (r && !r.signin) { window.SOP_LEAGUE = r; try { window.dispatchEvent(new CustomEvent("sop-league", { detail: r })); } catch (e) {} } }).catch(function () {}); }
    window.SOP_USERNAME = politician;
    window.SOP_league = function () { return wcall("hall/league"); };
    window.SOP_hallFinish = function () { return wcall("hall/finish").catch(function () { return null; }); };
    window.SOP_hallEnter = function (c) { return signedIn().then(function () { return wcall("hall/enter", Object.assign({ username: politician() }, c)); }); };
    window.SOP_hallSubmit = function (c) { return wcall("hall/submit", Object.assign({ username: politician() }, c)).catch(function () { return null; }); };
    window.SOP_hallToday = function () { return wcall("hall/today"); };
    window.SOP_hallWeek = function (week) { return wcall("hall/week", week == null ? {} : { week: week }); };
    window.SOP_hallBoard = function () { return wcall("hall/board"); };
    window.SOP_chStart = function () { return tok() ? wcall("challenge/start").then(function (r) { if (r && r.ents) setEnts(r.ents); return r; }) : Promise.resolve({ ok: true, offline: true }); };
    window.SOP_chScore = function (week, score, name, title) { return wcall("challenge/score", { week: week, score: score, username: politician(), title: title }).catch(function () {}); };
    window.SOP_chBoard = function (week) { return wcall("challenge/board", { week: week }); };
    window.SOP_webJoin = signedIn;
    // Buying: with Paystack's test keys the shop opens only on the private test link (…/?shoptest=1), never for players.
    var testLink = /[?&]shoptest=1/.test(location.search) || (function () { try { return sessionStorage.getItem("sop_shoptest") === "1"; } catch (e) { return false; } })();
    if (c.mode !== "live" && !testLink) return;
    if (testLink) try { sessionStorage.setItem("sop_shoptest", "1"); } catch (e) {}
    cfg.test = c.mode !== "live";
    window.SOP_WEB_SHOP = true;
    window.SOP_canBuy = function () { return true; };
    window.SOP_buy = buy;
    returning();
  }).catch(function () {});
})();
