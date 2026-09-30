/* ============================================================================
   sop-phase4.js — UX & Feel
   ----------------------------------------------------------------------------
   Ships:
     §2 Typographic restraint  — token overrides, chrome/document registers,
                                 dev outline toggle for non-token type.
     §4 Quarter-end Newspaper  — pure ledger consumer; front page with
                                 outlet voice + blind item + Q-callbacks.
     §5 Achievement popup      — document-register certificate on any
                                 `achievement` ledger append.
     §1 Shame line helper      — SOP.select.shameLine(sectors) exposed for
                                 the appropriation screen to render.
   Deferred (need appropriation reducer to avoid duplicating math):
     §1 slider bands calling SOP.select.projectDrift — the API is stubbed
     here; the appropriation UI hook is the caller's responsibility.
     §3 event audit re-prioritisation — engine-side, one-line queue sort;
     helper `SOP.select.rankEvent` provided so the swap is trivial.
   ========================================================================== */
(function () {
  "use strict";
  if (window.SOP_PHASE4_INSTALLED) return;
  window.SOP_PHASE4_INSTALLED = true;

  const S = (window.SOP = window.SOP || {});
  S.select = S.select || {};

  // ── §2 Typographic restraint ───────────────────────────────────────────
  // Global token override, appended last so it wins the cascade. The rule
  // set is deliberately small: five sizes, three weights, one accent, and
  // bold restricted to four contexts by class contract (`.sop-bold-ok`).
  function installTokens() {
    if (document.getElementById("sop-p4-tokens")) return;
    const st = document.createElement("style");
    st.id = "sop-p4-tokens";
    st.textContent = `
      :root {
        /* Type sizes and ink/accent now come from the core design system
           in seat-of-power.html. This module only adds what the system
           does not define: weights and the document-register palette. */
        --w-regular: 400; --w-medium: 550; --w-bold: 700;
        --paper: #f6f4ef; --ink-soft: var(--ink-dim, #555);
        --danger: #a41623; --gold: #8a6d1d;
      }
      /* Chrome register — quiet. Sizes are left to the design system; this
         only strips the shouting (weight, letter-spacing, caps). */
      .panel, .tab, .meter, .meter-label, .stat, .chip {
        font-weight: var(--w-regular);
        letter-spacing: 0;
        text-transform: none;
      }
      .meta, .caption, .timestamp { font-size: var(--t-meta); color: var(--ink-soft); }
      .micro, .numeral { font-size: var(--t-meta); font-family: ui-monospace,SFMono-Regular,Menlo,monospace; }


      /* Bold permitted only in four places — mark them explicitly. */
      .sop-bold-ok, .priority-ribbon, .meter-delta, .result-declaration, .headline {
        font-weight: var(--w-bold);
      }

      /* UPPERCASE reserved for institutional artifacts. */
      .institutional { text-transform: uppercase; letter-spacing: .04em; }

      /* Document register — performs. Opt-in via .sop-doc. */
      .sop-doc {
        background: var(--paper); color: var(--ink);
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        font-size: var(--t-body); line-height: 1.55;
        border: 1px solid #d8d2c4;
        box-shadow: 0 1px 0 #fff inset, 0 8px 20px rgba(0,0,0,.18);
      }
      .sop-doc .rule { border-top: 1px solid #b9b0a0; margin: 12px 0; }
      .sop-doc .masthead { font-family: "Playfair Display", "Iowan Old Style", Georgia, serif; }
      .sop-doc .col { column-count: 1; }
      @media (min-width: 640px) { .sop-doc .col-2 { column-count: 2; column-gap: 27px; } }

      /* Dev outline: paints any element whose computed font-size isn't a token. */
      html.sop-type-audit *[data-sop-off]     { outline: 2px solid #ff2d55 !important; outline-offset: -2px; }
    `;
    document.head.appendChild(st);
  }

  function installTypeAuditToggle() {
    // Alt+T toggles the outline audit. Non-invasive, dev-only.
    document.addEventListener("keydown", (e) => {
      if (!e.altKey || e.key.toLowerCase() !== "t") return;
      const on = !document.documentElement.classList.contains("sop-type-audit");
      document.documentElement.classList.toggle("sop-type-audit", on);
      if (on) markOffTokens();
      console.log("[SOP P4] type-audit", on ? "ON" : "OFF");
    });
  }

  const TOKEN_PX = new Set(["11px","13px","15px","19px","28px"]);
  function markOffTokens() {
    document.querySelectorAll("body *").forEach(el => {
      const fs = getComputedStyle(el).fontSize;
      if (fs && !TOKEN_PX.has(fs)) el.dataset.sopOff = fs;
      else delete el.dataset.sopOff;
    });
  }

  // ── §1 Shame line helper ───────────────────────────────────────────────
  // Pure function. Given `{ health, education, ... }` fractions and the
  // overheads ₦ value, returns the one-line shame comparison or null.
  S.select.shameLine = function shameLine(sectorFractions, overheadsNaira, totalBudgetNaira) {
    if (!sectorFractions || !overheadsNaira || !totalBudgetNaira) return null;
    const floors = { health: 0.10, education: 0.12, security: 0.08, works: 0.06 };
    const inRed = Object.entries(sectorFractions)
      .filter(([k,v]) => floors[k] != null && v < floors[k])
      .sort((a,b) => a[1] - b[1])[0];
    if (!inRed) return null;
    const [sector, frac] = inRed;
    const sectorSpend = frac * totalBudgetNaira;
    const ratio = overheadsNaira / sectorSpend;
    if (!isFinite(ratio) || ratio < 1) return null;
    const nb = (n) => "₦" + (n / 1e9).toFixed(1) + "B";
    return `Government House running costs: ${nb(overheadsNaira)} — ${ratio.toFixed(1)}× your entire ${sector} allocation.`;
  };

  // ── §1 Drift/gate stubs — implementations live in the engine; these
  // exports let the UI import a stable name today so §1 can be wired
  // without touching the caller signature later.
  S.select.projectDrift = S.select.projectDrift || function (sectorKey, fraction) {
    // Placeholder: return zero drift + empty events. The engine should
    // override this with the same math it runs at END_TURN.
    return { driftPerQ: 0, events: [] };
  };
  S.select.rankEvent = S.select.rankEvent || function (evt) {
    // Lower rank = fires first. Ledger-driven wins.
    if (!evt) return 99;
    if (evt.source === "ledger") return 1;
    if (evt.source === "deadline") return 2;
    if (evt.source === "shock") return 3;
    return 4; // scripted
  };

  // ── §5 Achievement popup ───────────────────────────────────────────────
  // Listen for ledger appends; on `achievement` family, render a framed
  // certificate in the document register.
  window.addEventListener("sop-ledger", (e) => {
    const entry = e && e.detail && e.detail.entry;
    if (!entry) return;
    if (entry.kind === "achievement" || entry.family === "achievement") {
      showCertificate(entry);
    }
  });

  function showCertificate(entry) {
    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
      position: "fixed", inset: 0, zIndex: 100000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,.45)",
    });
    wrap.innerHTML = `
      <div class="sop-doc" style="max-width: 630px;width:92vw;padding: 33px 39px;border-radius: 3px;position:relative">
        <div class="institutional" style="font-size:var(--t-micro);color:var(--ink-soft);text-align:center">CERTIFICATE OF RECORD</div>
        <div class="masthead sop-bold-ok" style="font-size:var(--t-hero);text-align:center;margin: 9px 0 6px">${escapeHtml(entry.title || "Achievement")}</div>
        <div class="rule"></div>
        <div style="font-size:var(--t-body);text-align:center;color:var(--ink)">${escapeHtml(entry.note || "")}</div>
        <div style="font-size:var(--t-meta);text-align:center;color:var(--ink-soft);margin-top: 15px">Q${entry.t || "—"} · Office of the Governor</div>
        <button id="sop-cert-close" style="position:absolute;top: 9px;right: 12px;background:transparent;border:0;color:var(--ink-soft);cursor:pointer;font-size: 47px">×</button>
      </div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
    wrap.querySelector("#sop-cert-close").onclick = close;
    setTimeout(close, 4200);
  }

  // ── §4 Quarter-end Newspaper ───────────────────────────────────────────
  const OUTLETS = [
    { id: "punch",         name: "The Punch",     tag: "punchy, accusatory" },
    { id: "premium_times", name: "Premium Times", tag: "investigative" },
    { id: "daily_trust",   name: "Daily Trust",   tag: "measured, northern" },
  ];
  const ADS = ["Golden Penny — the flour of the nation.",
               "MTN. Everywhere you go.",
               "Prophet T.B. Adigun: crusade this Sunday, Ilupeju.",
               "Innoson Motors — proudly Nigerian.",
               "Dangote Cement. Building the giant of Africa."];

  // Same story, three papers.
  const HEADLINES = {
    nepotism_award: {
      punch:         (e) => `GOV'S IN-LAW LANDS ₦${(e.gravity/20).toFixed(1)}B DEAL`,
      premium_times: (e) => `EXCLUSIVE: How ${e.target || "a family firm"} won the contract without a bid`,
      daily_trust:   (e) => `Questions over Works contract as procurement rules bypassed`,
    },
    result_falsification: {
      punch:         () => `INEC IN THE DOCK: RESULTS DOCTORED, WITNESSES SAY`,
      premium_times: () => `How the numbers moved between the LGA and the state collation centre`,
      daily_trust:   () => `Petition filed as results discrepancies emerge in three LGAs`,
    },
    vote_buying: {
      punch:         () => `NAIRA FOR VOTES: FIELD AGENTS CAUGHT ON CAMERA`,
      premium_times: () => `Cash-for-thumbprint: what our reporters saw at ten polling units`,
      daily_trust:   () => `Vote inducement claims trail governorship poll`,
    },
    security_vote_diversion: {
      punch:         () => `SECURITY VOTE MYSTERY: WHERE DID THE MONEY GO?`,
      premium_times: () => `Following the trail of an unaudited quarterly transfer`,
      daily_trust:   () => `Security spending draws scrutiny amid rising insecurity`,
    },
    lg_dissolution: {
      punch:         () => `GOVERNOR SACKS ALL COUNCILS — CARETAKERS IN`,
      premium_times: () => `Constitutional questions as elected chairmen dismissed en masse`,
      daily_trust:   () => `Council dissolution stirs unrest across senatorial zones`,
    },
    worker_arrears: {
      punch:         () => `PENSIONER COLLAPSES AT VERIFICATION QUEUE`,
      premium_times: () => `Data: how many months are owed, and to whom`,
      daily_trust:   () => `NLC issues ultimatum as arrears deepen`,
    },
    court_defiance: {
      punch:         () => `GOVERNOR DEFIES COURT — CONSTITUTIONAL LAWYERS REACT`,
      premium_times: () => `Timeline: the order, the response, and the contempt exposure`,
      daily_trust:   () => `Order ignored: judiciary and executive on collision course`,
    },
    achievement: {
      punch:         (e) => `${(e.title || "Project").toUpperCase()} DELIVERED`,
      premium_times: (e) => `${e.title || "Project"}: what it cost, what it changes`,
      daily_trust:   (e) => `${e.title || "Project"} commissioning draws crowds`,
    },
  };
  const FALLBACK = (e, o) => `${OUTLETS.find(x=>x.id===o).name} reports: ${e.note || e.kind}`;

  const BLIND_TEMPLATES = [
    (e) => `ASK AROUND: Which commissioner's brother suddenly owns three duplexes in Maitama?`,
    (e) => `ASK AROUND: A certain governor's cousin has been shopping in Dubai — with whose contract advance?`,
    (e) => `ASK AROUND: Which "operations" line item is quietly funding a private convoy?`,
    (e) => `ASK AROUND: A ranking aide is bragging about a case that "will never see court". Should we test that?`,
  ];

  S.select.buildFrontPage = function buildFrontPage(opts) {
    opts = opts || {};
    const L = S.ledger || [];
    const t = opts.turn != null ? opts.turn : (S.turn || 0);
    const disc = (id) => (window.SOP_LEDGER && window.SOP_LEDGER.discoveryOf(id)) || { discovered: false };
    const thisQ = L.filter(e => e.t === t);
    const discoveredThisQ = thisQ.filter(e => disc(e.id).discovered);
    const lead = discoveredThisQ.sort((a,b) => (b.gravity||0)-(a.gravity||0))[0];
    const second = discoveredThisQ.filter(e => e !== lead).sort((a,b)=>(b.gravity||0)-(a.gravity||0))[0]
                || thisQ.find(e => e.kind === "achievement");
    const undiscovered = L.filter(e => !disc(e.id).discovered && (e.gravity||0) >= 30)
                          .sort((a,b) => (b.gravity||0)-(a.gravity||0));
    const blindSource = undiscovered[0] || null;

    // Masthead pick — outlet with biggest stance delta or worst stance. If no
    // stances tracked, rotate deterministically.
    const stances = (S.press && S.press.stance) || {};
    const outlet = pickOutlet(stances, lead || second) || OUTLETS[t % OUTLETS.length];

    return {
      outlet,
      turn: t,
      lead: lead ? headlineFor(lead, outlet.id) : null,
      leadEntry: lead || null,
      second: second ? headlineFor(second, outlet.id) : null,
      secondEntry: second || null,
      blind: blindSource ? { line: BLIND_TEMPLATES[t % BLIND_TEMPLATES.length](blindSource), sourceId: blindSource.id } : null,
      ad: ADS[(t + outlet.name.length) % ADS.length],
      quiet: !lead && !second,
    };
  };

  function pickOutlet(stances, seedEntry) {
    if (!stances || !Object.keys(stances).length) return null;
    let worst = null, worstScore = Infinity;
    OUTLETS.forEach(o => {
      const s = stances[o.id];
      if (typeof s === "number" && s < worstScore) { worstScore = s; worst = o; }
    });
    return worst;
  }

  function headlineFor(entry, outletId) {
    const bank = HEADLINES[entry.kind];
    if (bank && bank[outletId]) return bank[outletId](entry);
    return FALLBACK(entry, outletId);
  }

  // Callback: when a previously-blinded entry is later discovered, next
  // paper carries a callback. We stash blinded ids per turn.
  S.__blindedEntries = S.__blindedEntries || new Set();

  function showNewspaper(fp) {
    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
      position: "fixed", inset: 0, zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,.55)", padding: "43px", overflow: "auto",
    });
    const leadHeadline = fp.lead || "APPROVAL STEADIES AS QUARTER ENDS WITHOUT INCIDENT";
    const secondLine   = fp.second || (fp.quiet ? "Roads Ministry reports two completed contracts; no injuries recorded." : "");
    const callback = fp.leadEntry && S.__blindedEntries.has(fp.leadEntry.id)
      ? `<div class="meta" style="font-style:italic;margin-top: 9px">AS WE HINTED IN Q${(fp.turn||1)-1}…</div>` : "";
    if (fp.blind) S.__blindedEntries.add(fp.blind.sourceId);

    wrap.innerHTML = `
      <div class="sop-doc" style="max-width: 840px;width:100%;padding: 30px 33px;border-radius: 3px">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1a1a1a;padding-bottom: 9px">
          <div class="masthead sop-bold-ok" style="font-size:var(--t-hero)">${escapeHtml(fp.outlet.name)}</div>
          <div class="meta institutional">Q${fp.turn} EDITION · ₦300</div>
        </div>
        <div style="margin-top: 15px">
          <div class="headline sop-bold-ok" style="font-size:var(--t-title);line-height:1.2">${escapeHtml(leadHeadline)}</div>
          ${callback}
          ${fp.leadEntry ? `<div class="meta" style="margin-top: 6px">By our Political Desk · ${escapeHtml(fp.outlet.tag)}</div>` : ""}
          ${fp.leadEntry ? `<div class="col col-2" style="margin-top: 9px">${escapeHtml(fp.leadEntry.note || "")}</div>` : ""}
        </div>
        ${secondLine ? `<div class="rule"></div>
          <div style="font-weight:var(--w-medium)">${escapeHtml(secondLine)}</div>` : ""}
        ${fp.blind ? `<div class="rule"></div>
          <div class="institutional meta">GOSSIP COLUMN</div>
          <div style="font-style:italic;margin-top: 3px">${escapeHtml(fp.blind.line)}</div>` : ""}
        <div class="rule"></div>
        <div class="meta" style="text-align:center;font-style:italic">— advertisement —</div>
        <div style="text-align:center;font-family:Georgia,serif">${escapeHtml(fp.ad)}</div>
        <div style="text-align:right;margin-top: 18px">
          <button id="sop-paper-close" style="background:#1a1a1a;color:#f6f4ef;border:0;padding: 9px 21px;border-radius: 3px;cursor:pointer">Read later ›</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); archive(fp); };
    wrap.querySelector("#sop-paper-close").onclick = close;
    wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  }

  // Archive strip — 16 front pages become the term history.
  S.newspaperArchive = S.newspaperArchive || [];
  function archive(fp) { S.newspaperArchive.push({ ...fp, archivedAt: Date.now() }); }

  // Public API
  S.showNewspaper = showNewspaper;
  S.select.buildFrontPage = S.select.buildFrontPage;

  // Auto-fire on END_TURN if the host dispatches one. Host code can also
  // call SOP.showNewspaper(SOP.select.buildFrontPage()) directly.
  window.addEventListener("sop-end-turn", () => {
    try { showNewspaper(S.select.buildFrontPage()); }
    catch (err) { console.warn("[SOP P4] newspaper build failed", err); }
  });

  function escapeHtml(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  installTokens();
  installTypeAuditToggle();
  console.log("[SOP P4] typography · newspaper · certificate · shame-line installed. Alt+T for type audit.");
})();
