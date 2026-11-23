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
  // One device at a time: this open of the game has its own id; the newest open owns the save (server: activeDev).
  var DEVICE = (function () { var a = "abcdefghijklmnopqrstuvwxyz0123456789", x = ""; for (var i = 0; i < 20; i++) x += a[Math.floor(Math.random() * a.length)]; return x; })();
  var moved = false;
  window.SOP_ENTS = {};

  var local = {
    get: function (k) { try { var v = localStorage.getItem(k); return v == null ? null : { value: v }; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function call(path, body) {
    return window.Vatar.session().then(function (r) {
      var payload = JSON.stringify(Object.assign({ session: r.session, device: DEVICE }, body || {}));
      // keepalive lets a save finish after the app is closed (browsers allow it up to 64 KB).
      return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: payload.length < 60000 });
    }).then(function (x) { return x.json().then(function (j) { if (!x.ok) { var e = new Error(j.error || "http_" + x.status); e.code = j.error; throw e; } return j; }); });
  }
  function setEnts(e) { window.SOP_ENTS = e || {}; try { window.dispatchEvent(new CustomEvent("sop-ents", { detail: window.SOP_ENTS })); } catch (x) {} }

  // A purchase becomes real only after our server checks it with Vatar.
  function claim(p) { return call("/claim", { purchaseId: p.purchaseId }).then(function (r) { setEnts(r.ents); return r; }); }

  // Loading the save is retried: Lagos Life's session check sometimes fails for a moment, and a
  // failed load used to look like a lost career (the title showed no game to continue).
  function retry(fn, waits) { return fn().catch(function (e) { if (!waits.length) throw e; return new Promise(function (ok) { setTimeout(ok, waits[0]); }).then(function () { return retry(fn, waits.slice(1)); }); }); }
  window.SOP_BACKUPS = [];
  var ready = !hasSdk ? Promise.resolve(false) : window.Vatar.init().then(function (r) {
    window.SOP_PLAYER = r.player;
    return retry(function () { return call("/api/load"); }, [800, 2500, 6000]);
  }).then(function (d) {
    cache = d.data || {}; setEnts(d.ents); window.SOP_BACKUPS = d.bak || [];
    // Paid earlier but interrupted (a crash, a reload, a trip to the payment page).
    window.Vatar.purchases().then(function (list) { (list || []).forEach(function (p) { claim(p).catch(function () {}); }); }).catch(function () {});
    window.Vatar.onPurchase(function (p) { claim(p).catch(function () {}); });
    return true;
  }).catch(function (e) { console.warn("[vatar] saving on this device instead:", e && (e.code || e.message));
    // In Lagos Life but the save could not be reached: the title warns before a new game.
    if (hasSdk) window.SOP_CLOUD_DOWN = true;
    return false; });
  // An earlier career kept by the server (replaced by a new game): bring it back.
  window.SOP_restore = function (i) { return ready.then(function (on) { if (!on) throw new Error("offline"); return call("/api/restore", { i: i }).then(function (r) { if (r && r.ok) { cache.sop_save = r.value; local.set("sop_save", r.value); } return r; }); }); };

  var fails = 0, warned = false;
  function flush() {
    var d = dirty; dirty = {};
    if (!Object.keys(d).length) return Promise.resolve();
    // A refused login (Lagos Life's session expired, say after the game was left open for hours) gets one fresh try
    // at once; after that the game stops hammering the server and waits longer each time (5 s, 30 s, 2 min, 5 min),
    // and tells the player once that the progress is safe on this phone.
    if (moved) return Promise.resolve();
    return call("/api/save", { data: d }).then(function (r) { fails = 0; if (r && r.moved) movedHere(); }).catch(function (e) {
      for (var k in d) if (!(k in dirty)) dirty[k] = d[k];
      if (e && e.code === "bad_session" && !fails) { fails = 1; return flush(); }
      fails++;
      if (e && e.code === "bad_session" && !warned) { warned = true; try { window.SOP_toast && window.SOP_toast("Your progress is saved on this phone. Reopen the game from Lagos Life to keep it in your account too.", "warn"); } catch (x) {} }
      timer = setTimeout(flush, [5000, 30000, 120000, 300000][Math.min(3, fails - 1)]);
    });
  }
  // Send waiting saves now (before a reload, say).
  window.SOP_storageFlush = function () { clearTimeout(timer); return ready.then(function (on) { if (on) return flush(); }); };
  function savedAt(v) { try { var j = JSON.parse(v); return j && typeof j === "object" && +j.savedAt || 0; } catch (e) { return 0; } }
  window.storage = {
    // The newer of the cloud copy and this phone's copy: a save that never
    // reached the server (closed too fast, no network) is not lost.
    get: function (k) { return ready.then(function (on) { if (!on) return local.get(k); var c = cache[k] != null && cache[k] !== "" ? cache[k] : null, l = local.get(k); l = l && l.value; if (!c) return l ? { value: l } : null; if (l && l !== c && savedAt(l) > savedAt(c)) { dirty[k] = l; cache[k] = l; clearTimeout(timer); timer = setTimeout(flush, 1200); return { value: l }; } return { value: c }; }); },
    set: function (k, v) { return ready.then(function (on) { if (moved) return; local.set(k, v); if (!on) return; cache[k] = v; dirty[k] = v; clearTimeout(timer); timer = setTimeout(flush, 1200); }); }
  };
  // "You're playing on another device": this phone stops saving, so it never overwrites the newer game.
  // Play here takes the save back (the server's copy replaces this phone's) and reloads; Not now leaves the game
  // visible but asleep, with a bar to bring it back.
  var mv = null;
  function movedHere() {
    if (moved) return; moved = true; dirty = {}; clearTimeout(timer); window.SOP_MOVED = true;
    try {
      mv = document.createElement("div"); mv.setAttribute("data-sop-moved", "");
      mv.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:#eef1f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2433;padding:24px;box-sizing:border-box";
      mv.innerHTML = '<div style="max-width:420px;width:100%;text-align:center">'
        + '<div style="width:104px;height:104px;margin:0 auto 22px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:48px;box-shadow:0 8px 30px rgba(20,30,50,.08)">📱</div>'
        + '<h2 style="margin:0 0 10px;font-size:28px;line-height:1.2;font-weight:800">You\'re playing on another device</h2>'
        + '<p style="margin:0 0 26px;font-size:17px;line-height:1.5;color:#5b6577">Your game moved there just now. Play here to bring it to this phone. Nothing is lost.</p>'
        + '<button data-sop-moved-here style="width:100%;min-height:56px;border:0;border-radius:999px;background:#0f3d2a;color:#fff;font-size:18px;font-weight:700;cursor:pointer">Play here</button>'
        + '<button data-sop-moved-later style="margin-top:14px;background:none;border:0;color:#5b6577;font-size:17px;font-weight:600;cursor:pointer;padding:10px 18px">Not now</button></div>';
      document.body.appendChild(mv);
      mv.querySelector("[data-sop-moved-here]").onclick = playHere;
      mv.querySelector("[data-sop-moved-later]").onclick = function () {
        // The game stays on screen but cannot be played here; a bar brings it back.
        mv.style.background = "rgba(10,20,15,.35)"; mv.style.alignItems = "flex-end"; mv.style.padding = "0";
        mv.innerHTML = '<div style="width:100%;display:flex;gap:12px;align-items:center;justify-content:space-between;background:#0f3d2a;color:#fff;padding:14px 16px calc(14px + env(safe-area-inset-bottom));font-size:15px;box-sizing:border-box"><span>You\'re playing on another device.</span><button data-sop-moved-here style="min-height:42px;padding:0 18px;border:0;border-radius:999px;background:#fff;color:#0f3d2a;font-weight:800;font-size:15px;cursor:pointer">Play here</button></div>';
        mv.querySelector("[data-sop-moved-here]").onclick = playHere;
      };
    } catch (e) {}
  }
  function playHere() {
    var b = mv && mv.querySelector("[data-sop-moved-here]"); if (b) { b.disabled = true; b.textContent = "Bringing your game here…"; }
    call("/api/device/claim").then(function (r) {
      // The other device's save is the newer one: it replaces this phone's copy before the game reloads.
      var d = (r && r.data) || {}; for (var k in d) local.set(k, d[k]);
      location.reload();
    }).catch(function () { if (b) { b.disabled = false; b.textContent = "Play here"; } try { window.SOP_toast && window.SOP_toast("Couldn't reach your save. Check the connection and try again.", "warn"); } catch (x) {} });
  }
  window.SOP_movedTest = movedHere;
  // Coming back to this phone, and every 30 seconds while it is open: is the game still here?
  function checkDevice() { if (moved || document.visibilityState !== "visible") return; ready.then(function (on) { if (on) return call("/api/device").then(function (r) { if (r && r.moved) movedHere(); }); }).catch(function () {}); }
  if (typeof setInterval === "function") setInterval(checkDevice, 30000);
  // Leaving the page: send anything still waiting.
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); else checkDevice(); });
  window.addEventListener("pagehide", function () { flush(); });

  // No sound while Vatar has the game paused (the phone went to the background, or its pay sheet is open).
  if (hasSdk) {
    window.Vatar.onPause(function () { window.SOP_paused = true; flush(); });
    window.Vatar.onResume(function () { window.SOP_paused = false; checkDevice(); });
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
  function uname() { var p = window.SOP_PLAYER || {}, n = p.username || p.displayName || p.name || p.handle || "", x = {}; try { x = JSON.parse(localStorage.getItem("sop_xp") || "{}") || {}; } catch (e) {} return n && (x.owned || []).indexOf("title_chief") >= 0 ? "Chief " + n : n; }
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
  window.SOP_companyTold = function () { ready.then(function (on) { if (on) return call("/api/company/told"); }).catch(function () {}); };
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
  // Leagues (server/leagues.mjs): where the player stands this week, and the last move up or down.
  window.SOP_league = function () { return ready.then(function (on) { if (!on) return null; return call("/api/hall/league"); }); };
  window.SOP_xpWeek = function (w, xp) { return ready.then(function (on) { if (!on) return null; return call("/api/xp/week", { w: w, xp: xp, username: uname() }); }).catch(function () { return null; }); };
  ready.then(function (on) { if (on) window.SOP_league().then(function (r) { if (r) { window.SOP_LEAGUE = r; try { window.dispatchEvent(new CustomEvent("sop-league", { detail: r })); } catch (e) {} } }).catch(function () {}); });
  window.SOP_chBoard = function (week) { return ready.then(function (on) { if (!on) return null; return call("/api/challenge/board", { week: week }); }); };
  window.SOP_useCredit = function (productId) {
    return call("/api/use", { product: productId }).then(function (r) { if (r.ok) setEnts(r.ents); return !!r.ok; });
  };
})();
