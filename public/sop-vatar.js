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
      var payload = JSON.stringify(Object.assign({ session: r.session }, body || {}));
      // keepalive lets a save finish after the app is closed (browsers allow it up to 64 KB).
      return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: payload.length < 60000 });
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
    if (!Object.keys(d).length) return Promise.resolve();
    return call("/api/save", { data: d }).catch(function () { for (var k in d) if (!(k in dirty)) dirty[k] = d[k]; timer = setTimeout(flush, 5000); });
  }
  // Send waiting saves now (before a reload, say).
  window.SOP_storageFlush = function () { clearTimeout(timer); return ready.then(function (on) { if (on) return flush(); }); };
  function savedAt(v) { try { var j = JSON.parse(v); return j && typeof j === "object" && +j.savedAt || 0; } catch (e) { return 0; } }
  window.storage = {
    // The newer of the cloud copy and this phone's copy: a save that never
    // reached the server (closed too fast, no network) is not lost.
    get: function (k) { return ready.then(function (on) { if (!on) return local.get(k); var c = cache[k] != null && cache[k] !== "" ? cache[k] : null, l = local.get(k); l = l && l.value; if (!c) return l ? { value: l } : null; if (l && l !== c && savedAt(l) > savedAt(c)) { dirty[k] = l; cache[k] = l; clearTimeout(timer); timer = setTimeout(flush, 1200); return { value: l }; } return { value: c }; }); },
    set: function (k, v) { return ready.then(function (on) { local.set(k, v); if (!on) return; cache[k] = v; dirty[k] = v; clearTimeout(timer); timer = setTimeout(flush, 1200); }); }
  };
  // Leaving the page: send anything still waiting.
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });
  window.addEventListener("pagehide", function () { flush(); });

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
  // A purchase that does not happen always says so (nothing silent): nothing was charged,
  // and the governorship stays free. A player who cancels just closes the sheet.
  window.SOP_buy = function (productId) {
    return ready.then(function (on) {
      if (!on) { var e = new Error("offline"); e.code = "offline"; throw e; }
      return window.Vatar.purchase(productId).then(claim);
    }).catch(function (e) {
      var code = String((e && (e.code || e.message)) || "");
      if (!/cancel/i.test(code)) {
        if (e) e.shown = true;
        try { window.SOP_outcome && window.SOP_outcome({ icon: "🛒", title: "No purchase made", text: code === "offline" ? "Purchases work inside Lagos Life. Nothing was charged, and the governorship stays free to play." : "Payments for this aren't open yet, or the payment didn't go through. Nothing was charged. The governorship stays free to play.", tone: "bad" }); } catch (x) {}
      }
      throw e;
    });
  };
  // The weekly challenge: attempts and the board live on our server, against the player's id.
  window.SOP_chStart = function () { return ready.then(function (on) { if (!on) return { ok: true, offline: true }; return call("/api/challenge/start").then(function (r) { if (r.ents) setEnts(r.ents); return r; }); }); };
  // Boards show the player's Lagos Life username (the server prefers the name Vatar verified).
  function uname() { var p = window.SOP_PLAYER || {}; return p.username || p.displayName || p.name || p.handle || ""; }
  window.SOP_USERNAME = uname;
  window.SOP_chScore = function (week, score, name, title) { return ready.then(function (on) { if (on) return call("/api/challenge/score", { week: week, score: score, username: uname(), title: title }); }).catch(function () {}); };
  window.SOP_hallSubmit = function (c) { return ready.then(function (on) { if (on) return call("/api/hall/submit", Object.assign({ username: uname() }, c)); }).catch(function () {}); };
  // Player feedback goes to the game's server (read at /feedback with FEEDBACK_KEY).
  // Feedback always reaches the makers: with the Lagos Life session when it is confirmed, anonymously when not.
  function openFeedback(f) { return fetch("/api/feedback-open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ username: uname() }, f)) }).then(function (x) { return x.json().then(function (j) { if (!x.ok) { var e = new Error(j.error || "http_" + x.status); e.code = j.error; throw e; } return j; }); }); }
  window.SOP_feedbackOn = function () { return Promise.resolve(true); };
  window.SOP_feedback = function (f) { return ready.then(function (on) { if (!on) return openFeedback(f); return call("/api/feedback", Object.assign({ username: uname() }, f)).catch(function () { return openFeedback(f); }); }); };
  // The Daily Decision's shared vote.
  window.SOP_dailyVote = function (day, choice) { return ready.then(function (on) { if (!on) return null; return call("/api/daily/vote", { day: day, choice: choice }); }).catch(function () { return null; }); };
  window.SOP_dailyStats = function (day) { return ready.then(function (on) { if (!on) return null; return call("/api/daily/stats", { day: day }); }).catch(function () { return null; }); };
  // Time played: the server keeps the total for this player across devices.
  window.SOP_playSend = function (sec) { ready.then(function (on) { if (on) return call("/api/play", { sec: sec }).then(function (r) { if (r && r.total && window.SOP_playTotal) window.SOP_playTotal(r.total); }); }).catch(function () {}); };
  ready.then(function (on) { if (on) window.SOP_playSend(0); });
  // Player companies: the shared list, registering (buys company_registration when
  // there is no credit), hires by other governors, and the owner's fees.
  window.SOP_companies = function () { return ready.then(function (on) { if (!on) return null; return call("/api/company/list"); }).catch(function () { return null; }); };
  window.SOP_companyRegister = function (name, sector) {
    function reg() { return call("/api/company/register", { name: name, sector: sector }).then(function (r) { if (r.ents) setEnts(r.ents); return r; }); }
    return ready.then(function (on) {
      if (!on) { var e = new Error("offline"); e.code = "offline"; throw e; }
      return reg().then(function (r) { return r.need ? window.SOP_buy("company_registration").then(reg) : r; });
    });
  };
  window.SOP_companyHire = function (id) { ready.then(function (on) { if (on) return call("/api/company/hire", { id: id }); }).catch(function () {}); };
  window.SOP_companyClaim = function () { return ready.then(function (on) { if (!on) return null; return call("/api/company/claim"); }).catch(function () { return null; }); };
  // Anonymous choice tallies (what players pick, not who they are). Batched.
  var trackQ = [], trackT = null;
  window.SOP_track = function (event, value) {
    if (!event || value == null) return; trackQ.push({ event: event, value: String(value) });
    clearTimeout(trackT); trackT = setTimeout(function () { var items = trackQ.splice(0, 20); ready.then(function (on) { if (on && items.length) return call("/api/track", { items: items }); }).catch(function () {}); }, 1500);
  };
  // The daily Hall: a career's end is counted; a result is entered once a day; the week opens on Monday.
  window.SOP_hallFinish = function () { return ready.then(function (on) { if (on) return call("/api/hall/finish"); }).catch(function () { return null; }); };
  window.SOP_hallEnter = function (c) { return ready.then(function (on) { if (!on) return null; return call("/api/hall/enter", Object.assign({ username: uname() }, c)); }); };
  window.SOP_hallToday = function () { return ready.then(function (on) { if (!on) return null; return call("/api/hall/today"); }); };
  window.SOP_hallWeek = function (week) { return ready.then(function (on) { if (!on) return null; return call("/api/hall/week", week == null ? {} : { week: week }); }); };
  window.SOP_hallBoard = function () { return ready.then(function (on) { if (!on) return null; return call("/api/hall/board"); }); };
  window.SOP_chBoard = function (week) { return ready.then(function (on) { if (!on) return null; return call("/api/challenge/board", { week: week }); }); };
  window.SOP_useCredit = function (productId) {
    return call("/api/use", { product: productId }).then(function (r) { if (r.ok) setEnts(r.ents); return !!r.ok; });
  };
})();
