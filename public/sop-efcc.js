/* ============================================================================
   sop-efcc.js — Phase 3 §1: Visible EFCC Case File (pure ledger consumer)
   ----------------------------------------------------------------------------
   NO new state. NO new write sites. Renders a number Phase 1 already computes
   for the Jailed ending, plus two counter-actions that write NEW small entries
   (black_book_payment, scapegoat_sacrifice).

   Formula (spec §1):
     exposure   = Σ gravity (discovered corruption/violence)
                + Σ gravity × ev/100 (undiscovered)
     protection = federalAlignment ? 0.5 : 1.0
     caseFile   = exposure × protection

   Tiers:  <80 Clear · 80–200 Whispers · 200–400 Active File · >400 Prosecution.

   The reveal is asymmetric on purpose: the dossier lists discovered entries by
   name; undiscovered exposure is shown only as an aggregate ("...₦X.XB in
   matters not yet public"). Dread without a checklist.
   ========================================================================== */
(function () {
  "use strict";
  if (window.SOP_EFCC_INSTALLED) return;
  window.SOP_EFCC_INSTALLED = true;

  // Kinds that count as "cash / violence" sins (feed the sweep).
  // Governance abuses (lg_dissolution, siec_sweep) go through here too — the
  // spec's evidence axis (high evidence, mid gravity) already prices them
  // sensibly. worker_arrears is included: pension tragedy is provable.
  const SWEEP_KINDS = new Set([
    "vote_buying", "result_falsification", "bvas_irregularity", "thug_deployment",
    "violence_incident", "godfather_contract", "black_book_payment",
    "nepotism_flag", "eia_bypass", "budget_padding", "kingmaker_bribe",
    "security_vote_diversion", "lg_dissolution", "siec_sweep",
    "worker_arrears", "scapegoat_sacrifice", "court_defiance",
  ]);

  function computeCaseFile() {
    const L = (window.SOP && window.SOP.ledger) || [];
    if (!L.length) return { exposure: 0, discoveredGravity: 0, undiscoveredExposure: 0, caseFile: 0, protection: 1, entries: L };
    // Discovery status is held in the ledger shim's parallel map. Access via
    // SOP_LEDGER.discoveryOf(id).
    const disc = (id) => (window.SOP_LEDGER && window.SOP_LEDGER.discoveryOf(id)) || { discovered: false };
    let discG = 0, undG = 0;
    L.forEach(e => {
      if (!SWEEP_KINDS.has(e.kind)) return;
      const d = disc(e.id);
      if (d.discovered) discG += (e.gravity || 0);
      else undG += (e.gravity || 0) * ((e.evidence || 0) / 100);
    });
    const exposure = discG + undG;
    // federalAlignment isn't wired yet (Phase 2 §6). Default to 1.0 until it is.
    const fa = !!(window.SOP && window.SOP.federalAlignment);
    const protection = fa ? 0.5 : 1.0;
    return { exposure, discoveredGravity: discG, undiscoveredExposure: undG,
             caseFile: Math.round(exposure * protection), protection, entries: L };
  }

  function tierFor(cf) {
    if (cf < 80)  return { name: "Clear",             color: "#6c7280", pulse: false, hint: "No public dossier. Keep it that way." };
    if (cf < 200) return { name: "Whispers",          color: "#c9a227", pulse: false, hint: "Friends in Abuja are asking questions." };
    if (cf < 400) return { name: "Active File",       color: "#d94f4f", pulse: false, hint: "EFCC has invited an aide 'for clarification'." };
    return              { name: "Prosecution Likely", color: "#ff3b30", pulse: true,  hint: "The AGF's desk has your name on it." };
  }

  // ── DOM ────────────────────────────────────────────────────────────────
  function installBadge() {
    if (document.getElementById("sop-efcc-badge")) return;
    const badge = document.createElement("button");
    badge.id = "sop-efcc-badge";
    badge.type = "button";
    badge.title = "EFCC Case File";
    Object.assign(badge.style, {
      position: "fixed", left: "36px", bottom: "36px", zIndex: 99998,
      display: "flex", alignItems: "center", gap: "22px",
      padding: "22px 36px", borderRadius: "1846px",
      background: "#f6f4ef", color: "#1a1a1a",
      border: "1px solid #cfc7b4", cursor: "pointer",
      font: "600 11px system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
      boxShadow: "0 2px 8px rgba(0,0,0,.35)",
    });
    badge.innerHTML = `<span id="sop-efcc-icon">📁</span><span id="sop-efcc-label">EFCC · —</span>`;
    badge.onclick = openDossier;
    document.body.appendChild(badge);
    renderBadge();
    window.addEventListener("sop-ledger", renderBadge);
    // repaint periodically in case discovery flips (Phase 3 §3 stage 1) without a ledger event
    setInterval(renderBadge, 4000);
  }

  function renderBadge() {
    const badge = document.getElementById("sop-efcc-badge");
    if (!badge) return;
    const cf = computeCaseFile();
    const tier = tierFor(cf.caseFile);
    badge.style.borderColor = tier.color;
    badge.style.color = tier.color;
    badge.style.animation = tier.pulse ? "sopEfccPulse 1.2s ease-in-out infinite" : "";
    document.getElementById("sop-efcc-label").textContent = `EFCC · ${tier.name} · ${cf.caseFile}`;
    if (!document.getElementById("sop-efcc-kf")) {
      const st = document.createElement("style");
      st.id = "sop-efcc-kf";
      st.textContent = "@keyframes sopEfccPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,.6)}50%{box-shadow:0 0 0 8px rgba(255,59,48,0)}}";
      document.head.appendChild(st);
    }
  }

  function openDossier() {
    const existing = document.getElementById("sop-efcc-panel");
    if (existing) { existing.remove(); return; }
    const cf = computeCaseFile();
    const tier = tierFor(cf.caseFile);
    const disc = (id) => (window.SOP_LEDGER && window.SOP_LEDGER.discoveryOf(id)) || { discovered: false };
    const discoveredEntries = cf.entries.filter(e => SWEEP_KINDS.has(e.kind) && disc(e.id).discovered);

    const panel = document.createElement("div");
    panel.id = "sop-efcc-panel";
    Object.assign(panel.style, {
      position: "fixed", left: "36px", bottom: "149px", zIndex: 99997,
      width: "min(576px, 92vw)", maxHeight: "72vh", overflow: "auto",
      background: "#f6f4ef", color: "#1a1a1a",
      border: "1px solid " + tier.color, borderRadius: "36px",
      padding: "43px", boxShadow: "0 8px 24px rgba(0,0,0,.5)",
      font: "12px system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    });
    // Jailed-ending odds hover — spec §1.1 for tier 4.
    const jailedOdds = Math.min(95, Math.round(cf.caseFile / 5));
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap: 12px;margin-bottom: 12px">
        <div>
          <div style="font-size: 34px;color:#5a5648;letter-spacing:1px">ECONOMIC & FINANCIAL CRIMES COMMISSION</div>
          <div style="font-size: 47px;font-weight:800;color:${tier.color}">CASE FILE · ${tier.name}</div>
          <div style="font-size: 34px;color:#3d3a30;margin-top: 3px">${tier.hint}</div>
        </div>
        <button id="sop-efcc-close" style="background:transparent;color:#5a5648;border:1px solid #cfc7b4;border-radius: 6px;padding: 3px 12px;cursor:pointer">×</button>
      </div>
      <div style="background:#fbf9f2;border:1px solid #d6cfbc;border-radius: 12px;padding: 15px;margin-bottom: 12px">
        <div style="display:flex;justify-content:space-between;font-family:ui-monospace,monospace;font-size: 34px">
          <span>exposure (raw)</span><b>${Math.round(cf.exposure)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:ui-monospace,monospace;font-size: 34px">
          <span>federal protection ×</span><b>${cf.protection.toFixed(2)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:ui-monospace,monospace;font-size: 40px;color:${tier.color};margin-top: 6px;border-top:1px solid #d6cfbc;padding-top: 6px">
          <b>caseFile</b><b>${cf.caseFile}</b>
        </div>
        ${cf.caseFile >= 400 ? `<div title="Jailed-ending odds at term end" style="font-size: 34px;color:#a41623;margin-top: 6px">Est. Jailed-ending odds: <b>${jailedOdds}%</b></div>` : ""}
      </div>

      <div style="font-size: 34px;color:#5a5648;letter-spacing:1px;margin-bottom: 6px">DISCOVERED — ON THE RECORD</div>
      ${discoveredEntries.length ? discoveredEntries.map(e => `
        <div style="border-top:1px solid #d6cfbc;padding: 9px 0">
          <div style="font-weight:600;color:#8a6d1d">${escapeHtml(e.kind)} <span style="color:#7a7566;font-weight:400">· g${e.gravity}/e${e.evidence} · Q${e.t}</span></div>
          <div style="color:#3d3a30;font-size: 34px">${escapeHtml(e.note || "")}</div>
          ${e.target ? `<div style="color:#7a7566;font-size: 34px">target: ${escapeHtml(e.target)}</div>` : ""}
        </div>`).join("") : `<div style="color:#7a7566;padding: 9px 0">Nothing public — yet.</div>`}

      <div style="margin-top: 15px;font-size: 34px;color:#5a5648;letter-spacing:1px">UNDISCOVERED — ESTIMATED</div>
      <div style="color:#3d3a30;font-size: 34px;padding: 9px 0;border-top:1px solid #d6cfbc">
        …and an estimated <b style="color:#8a6d1d">₦${(cf.undiscoveredExposure/10).toFixed(2)}B</b> in matters not yet public.
        <div style="color:#7a7566;font-size: 34px;margin-top: 3px">You know you're dirty. You don't know exactly what's provable.</div>
      </div>

      <div style="margin-top: 15px;font-size: 34px;color:#5a5648;letter-spacing:1px">COUNTER-ACTIONS</div>
      <button class="sop-efcc-act" data-act="agf" style="display:block;width:100%;text-align:left;background:#fbf9f2;color:#1a1a1a;border:1px solid #cfc7b4;border-left:3px solid #a41623;border-radius: 3px;padding: 12px 15px;margin: 9px 0;cursor:pointer;font:inherit">
        <div style="font-weight:700;font-size: 40px;color:#0a6e4f">🤝 Lobby the AGF — ₦0.25B / quarter</div>
        <div style="font-size: 34px;color:#3d3a30">Protection ×0.7 this quarter. Writes <code>black_book_payment</code> (g55/e20) — the cover-up increases eventual exposure.</div>
      </button>
      <button class="sop-efcc-act" data-act="scapegoat" style="display:block;width:100%;text-align:left;background:#fbf9f2;color:#1a1a1a;border:1px solid #cfc7b4;border-left:3px solid #a41623;border-radius: 3px;padding: 12px 15px;margin: 9px 0;cursor:pointer;font:inherit">
        <div style="font-weight:700;font-size: 40px;color:#a41623">🎯 Sacrifice an aide</div>
        <div style="font-size: 34px;color:#3d3a30">The highest-gravity discovered entry is consumed as their doing. They leave with an 85-grievance chip against you. Writes <code>scapegoat_sacrifice</code> (g40).</div>
      </button>
      <div style="font-size: 34px;color:#7a7566;margin-top: 9px">The honest-governor path: keep gravity low in the first place. The meter exists to make that choice legible.</div>
    `;
    document.body.appendChild(panel);
    panel.querySelector("#sop-efcc-close").onclick = () => panel.remove();
    panel.querySelectorAll(".sop-efcc-act").forEach(b => {
      b.addEventListener("click", () => {
        const act = b.dataset.act;
        if (act === "agf") lobbyAGF();
        else if (act === "scapegoat") scapegoatAide();
        panel.remove(); openDossier();
      });
    });
  }

  // ── Counter-actions (new write sites — small & self-contained) ────────
  function lobbyAGF() {
    // Cash tick — best effort: reduce warChest/treasury if bridged, otherwise
    // it's ledger-only. Shim-safe.
    try {
      const S = window.SOP;
      if (S && S.setS && S.s) S.setS({ ...S.s, cor: Math.min(1, (S.s.cor || 0) + 0.02) });
    } catch(e){}
    window.SOP.ledgerAppend && window.SOP.ledgerAppend({
      kind: "black_book_payment", gravity: 55, evidence: 20,
      note: "Quarterly retainer paid to AGF's chambers for protection",
      target: "AGF", meta: { phase: "efcc_counter" },
    });
    // The "protection ×0.7 while paid" flag lives on window until we swap to
    // the reducer — computeCaseFile reads window.SOP.federalAlignment, so we
    // stash a decayed multiplier here that the tier check can honour later.
    window.SOP.__agfProtectionUntil = (window.SOP.turn || 0) + 1;
  }

  function scapegoatAide() {
    const L = (window.SOP && window.SOP.ledger) || [];
    const disc = (id) => (window.SOP_LEDGER && window.SOP_LEDGER.discoveryOf(id)) || { discovered: false };
    const discovered = L.filter(e => SWEEP_KINDS.has(e.kind) && disc(e.id).discovered)
                        .sort((a,b) => (b.gravity||0) - (a.gravity||0));
    if (!discovered.length) {
      alert("Nothing discovered to scapegoat. Try again after a leak."); return;
    }
    const worst = discovered[0];
    window.SOP_LEDGER.markConsumed && window.SOP_LEDGER.markConsumed(worst.id, "scapegoat");
    // Rival with receipts — spec §1.2. Rivals map lives in Phase-1 realism;
    // if it doesn't exist yet, at least log to the ledger.
    try {
      window.SOP.rivals = window.SOP.rivals || {};
      const key = "aide_" + Math.random().toString(36).slice(2,7);
      window.SOP.rivals[key] = { name: "Former " + (worst.target || "aide"), grievance: 85, source: "scapegoat", refEntry: worst.id };
    } catch(e){}
    window.SOP.ledgerAppend && window.SOP.ledgerAppend({
      kind: "scapegoat_sacrifice", gravity: 40, evidence: 30,
      note: "Aide dismissed and blamed for " + worst.kind + " — leaves as a grievance-85 rival",
      target: worst.target || "aide", meta: { consumed: worst.id },
    });
  }

  // Note: also honour AGF retainer inside computeCaseFile — apply the 0.7 while
  // the retainer window is open. Small monkey-patch: wrap protection.
  const origCompute = computeCaseFile;
  window.SOP = window.SOP || {};
  window.SOP.efccCaseFile = () => {
    const r = origCompute();
    const t = (window.SOP && window.SOP.turn) || 0;
    const until = window.SOP && window.SOP.__agfProtectionUntil;
    if (until && t <= until) {
      r.protection *= 0.7;
      r.caseFile = Math.round(r.exposure * r.protection);
    }
    return r;
  };

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  if (document.readyState !== "loading") installBadge();
  else document.addEventListener("DOMContentLoaded", installBadge);

  console.log("[SOP EFCC] case-file consumer installed (Phase 3 §1)");
})();
