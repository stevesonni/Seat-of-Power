/* The Vatar (Lagos Life) bridge. Loaded only by the Vatar edition's server,
   which also sets window.SOP_VATAR and loads the SDK first.

   - window.storage: saves go to our server, against the player's per-game
     id, because a framed game's own storage is often blocked on phones.
     Opened directly (not framed), or if the server can't be reached, it
     falls back to this device's storage.
   - Pause: no sound while Vatar pauses the game.
   - SOP_vatarScore(n): the career score for the leaderboard.
   - SOP_buy(productId) / SOP_useCredit(productId): purchases, checked by our
     server with Vatar's API before anything is granted.
   - SOP_chStart / SOP_chScore / SOP_chBoard: the weekly challenge. */
(function () {
  if (!window.SOP_VATAR) return;
  // Fullscreen is not granted inside the frame: hide its button.
  try { var st = document.createElement("style"); st.textContent = "#sop-fs{display:none!important}"; document.head.appendChild(st); } catch (e) {}
  var framed = false; try { framed = window.top !== window; } catch (e) { framed = true; }
  var hasSdk = framed && !!window.Vatar;
  var cache = {}, dirty = {}, timer = null;
  window.SOP_ENTS = {};

  var local = {
    get: function (k) { try { var v = localStorage.getItem(k); return v == null ? null : { value: v }; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function call(path, body) {
    return window.Vatar.session().then(function (r) {
      return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ session: r.session }, body || {})) });
    }).then(function (x) { return x.json().then(function (j) { if (!x.ok) { var e = new Error(j.error || "http_" + x.status); e.code = j.error; throw e; } return j; }); });
  }
  function setEnts(e) { window.SOP_ENTS = e || {}; try { window.dispatchEvent(new CustomEvent("sop-ents", { detail: window.SOP_ENTS })); } catch (x) {} }

  // A purchase becomes real only after our server checks it with Vatar.
  function claim(p) { return call("/claim", { purchaseId: p.purchaseId }).then(function (r) { setEnts(r.ents); return r; }); }

  var ready = !hasSdk ? Promise.resolve(false) : window.Vatar.init().then(function (r) {
    window.SOP_PLAYER = r.player;
    return call("/api/load");
  }).then(function (d) {
    cache = d.data || {}; setEnts(d.ents);
    // Paid earlier but interrupted (a crash, a reload, a trip to the payment page).
    window.Vatar.purchases().then(function (list) { (list || []).forEach(function (p) { claim(p).catch(function () {}); }); }).catch(function () {});
    window.Vatar.onPurchase(function (p) { claim(p).catch(function () {}); });
    return true;
  }).catch(function (e) { console.warn("[vatar] saving on this device instead:", e && (e.code || e.message)); return false; });

  function flush() {
    var d = dirty; dirty = {};
    if (!Object.keys(d).length) return;
    call("/api/save", { data: d }).catch(function () { for (var k in d) if (!(k in dirty)) dirty[k] = d[k]; timer = setTimeout(flush, 5000); });
  }
  window.storage = {
    get: function (k) { return ready.then(function (on) { if (on) return cache[k] != null && cache[k] !== "" ? { value: cache[k] } : null; return local.get(k); }); },
    set: function (k, v) { return ready.then(function (on) { local.set(k, v); if (!on) return; cache[k] = v; dirty[k] = v; clearTimeout(timer); timer = setTimeout(flush, 1200); }); }
  };
  // Leaving the page: send anything still waiting.
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });

  // No sound while Vatar has the game paused (the phone went to the background, or its pay sheet is open).
  if (hasSdk) {
    window.Vatar.onPause(function () { window.SOP_paused = true; flush(); });
    window.Vatar.onResume(function () { window.SOP_paused = false; });
  }
  var sound = window.SOP_sound;
  if (sound) window.SOP_sound = function (k) { if (!window.SOP_paused) sound(k); };

  window.SOP_vatarScore = function (n) {
    return ready.then(function (on) { if (on) return window.Vatar.submitScore(Math.max(0, Math.round(n))); }).catch(function () {});
  };
  window.SOP_canBuy = function () { return hasSdk; };
  window.SOP_buy = function (productId) {
    return ready.then(function (on) {
      if (!on) { var e = new Error("offline"); e.code = "offline"; throw e; }
      return window.Vatar.purchase(productId).then(claim);
    });
  };
  // The weekly challenge: attempts and the board live on our server, against the player's id.
  window.SOP_chStart = function () { return ready.then(function (on) { if (!on) return { ok: true, offline: true }; return call("/api/challenge/start").then(function (r) { if (r.ents) setEnts(r.ents); return r; }); }); };
  window.SOP_chScore = function (week, score, name, title) { return ready.then(function (on) { if (on) return call("/api/challenge/score", { week: week, score: score, name: name, title: title }); }).catch(function () {}); };
  window.SOP_chBoard = function (week) { return ready.then(function (on) { if (!on) return null; return call("/api/challenge/board", { week: week }); }); };
  window.SOP_useCredit = function (productId) {
    return call("/api/use", { product: productId }).then(function (r) { if (r.ok) setEnts(r.ents); return !!r.ok; });
  };
})();
