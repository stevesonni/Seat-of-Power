/* ============================================================================
   sop-ledger.js — Historic Ledger SHIM (Phase 1, pre-reducer)
   ----------------------------------------------------------------------------
   Purpose: single append-only chronological record of every consequential
   action, living alongside the current ~40 useState hooks so we can prove the
   ledger schema against real gameplay BEFORE the reducer swap (§1.1).

   Invariants (enforced mechanically, not by convention):
     - Entries are Object.frozen at append time. Mutation of past history is
       impossible from callers.
     - Only three fields are mutable, via ledgerDiscover(id, q, by): they live
       in a parallel Map, NEVER on the frozen entry.
     - Every existing setter that (a) moves corruption, or (b) harms a named
       NPC, must call ledgerAppend(...) within a few lines OR carry a nearby
       `// no-ledger: <reason>` comment. See INSTRUMENTED_SITES below.

   Consumers (READ-ONLY during shim):
     - ledgerTribunalStrength()  → derives evidence bullets from ledger
     - ledgerSaSignals()         → proactive advice bullets from ledger
   Consumers MUST NOT trigger side effects (scandal events, press) during the
   shim period; the old event plumbing still owns those paths. Mixing them
   here is how you get double-fired scandals.

   Post-shim (after §1.1 reducer swap):
     - Reducer becomes single write funnel; ledgerAppend moves inside it.
     - Seeded RNG (§6) attaches to the reducer, not the shim.
     - Discovery-driven events can then flow from ledger → reducer safely.
   ========================================================================== */
(function () {
  "use strict";
  if (window.SOP_LEDGER_INSTALLED) return;
  window.SOP_LEDGER_INSTALLED = true;

  const ledger = [];                  // Object.frozen entries, append-only
  const discoveryMap = new Map();     // id → { discovered, discoveredQ, consumedBy }
  let nextId = 1;

  function currentTurn() {
    try { return (window.SOP && window.SOP.turn) || 0; } catch (e) { return 0; }
  }

  // ── Append ─────────────────────────────────────────────────────────────
  // Schema v2 (additive). Every field below is optional at the call site and
  // defaults to a harmless value, so all 13 existing write sites keep working
  // untouched. The new fields are what a "Why is this happening?" trace and a
  // relationship-memory system need: who did it, where, who won, who lost,
  // what it cost, who is now owed, and what could surface later.
  function ledgerAppend(entry) {
    if (!entry || typeof entry !== "object") return null;
    const id = "L" + (nextId++);
    const record = Object.freeze({
      id,
      t: currentTurn(),
      ts: Date.now(),
      kind: entry.kind || "misc",
      // ── v1 fields (unchanged) ──
      actor: entry.actor || null,          // who took the action ("governor", NPC name)
      target: entry.target || null,        // named NPC / project / ministry
      gravity: typeof entry.gravity === "number" ? entry.gravity : 1, // 1..5 severity
      evidence: typeof entry.evidence === "number" ? entry.evidence : 1, // 0..5 how provable
      corruptionDelta: entry.corruptionDelta || 0,
      approvalDelta: entry.approvalDelta || 0,
      note: entry.note || "",
      meta: entry.meta ? Object.freeze({ ...entry.meta }) : null,
      // ── v2 fields (additive) ──
      location: entry.location || null,          // "Government House veranda", "Assembly chamber"
      decision: entry.decision || null,          // the option label the player picked
      outcome: entry.outcome || null,            // what visibly happened immediately
      beneficiaries: Object.freeze((entry.beneficiaries || []).slice()), // faction/NPC ids who gained
      losers: Object.freeze((entry.losers || []).slice()),               // faction/NPC ids who lost
      financial: typeof entry.financial === "number" ? entry.financial : 0, // ₦B, signed
      debtOwed: entry.debtOwed || null,          // { to, what, dueBy } — an obligation created
      futureRisk: entry.futureRisk || null,      // plain-language exposure this created
      relatedEntity: entry.relatedEntity || null,// stable id: project/contract/ministry/court matter
      causedBy: Object.freeze((entry.causedBy || []).slice()), // prior ledger ids that led here
    });
    ledger.push(record);
    discoveryMap.set(id, { discovered: false, discoveredQ: null, consumedBy: null });
    bumpVersion();
    return id;
  }

  // ── Causal trace: "Why is this happening?" ─────────────────────────────
  // Walks backwards from an entry through causedBy links, then widens to any
  // earlier entry sharing its relatedEntity or naming the same person. Returns
  // oldest-first so the UI can read it as a story.
  function ledgerTrace(id, depth) {
    const byId = new Map(ledger.map(e => [e.id, e]));
    const seen = new Set();
    const out = [];
    const max = typeof depth === "number" ? depth : 6;
    (function walk(eid, d) {
      if (d > max || seen.has(eid)) return;
      const e = byId.get(eid);
      if (!e) return;
      seen.add(eid);
      out.push(e);
      (e.causedBy || []).forEach(p => walk(p, d + 1));
      if (e.relatedEntity) {
        ledger.filter(x => x.relatedEntity === e.relatedEntity && x.t <= e.t && !seen.has(x.id))
              .forEach(x => walk(x.id, d + 1));
      }
      if (e.target) {
        ledger.filter(x => x.target === e.target && x.t < e.t && !seen.has(x.id))
              .slice(-2).forEach(x => walk(x.id, d + 1));
      }
    })(id, 0);
    return out.sort((a, b) => (a.t - b.t) || (a.ts - b.ts));
  }

  // ── Memory: questions the rest of the game asks ───────────────────────
  // The ledger is the one record of what the player did. These helpers turn
  // it into plain questions so a later scene doesn't have to know which
  // module wrote what:
  //   did(kind, match)     latest entry of a kind (or kinds), optionally
  //                        matching some fields or a predicate; null if none
  //   all(kind, match)     every such entry, oldest first
  //   promises()           public pledges on the record
  //   owed(who)            open obligations, optionally for one role or name
  //   owe(to, what, opts)  record a new obligation; returns its id
  //   settle(id, how)      close an obligation; returns the settling entry id
  // An obligation is any entry with debtOwed = { to, role?, what, dueBy?,
  // amount? }. It stays open until a "debt_settled" entry names it.
  function matches(e, kind, match) {
    if (kind && (Array.isArray(kind) ? kind.indexOf(e.kind) < 0 : e.kind !== kind)) return false;
    if (!match) return true;
    if (typeof match === "function") return !!match(e);
    return Object.keys(match).every(k => e[k] === match[k]);
  }
  function memAll(kind, match) { return ledger.filter(e => matches(e, kind, match)); }
  function memDid(kind, match) {
    for (let i = ledger.length - 1; i >= 0; i--) if (matches(ledger[i], kind, match)) return ledger[i];
    return null;
  }
  function memPromises() { return memAll("public_pledge"); }
  function roleOf(e) {
    const d = e.debtOwed || {};
    if (d.role) return d.role;
    if (e.kind === "campaign_loan" || e.kind.indexOf("godfather") === 0) return "godfather";
    return null;
  }
  function memOwed(who) {
    const settled = new Set(ledger.filter(e => e.kind === "debt_settled" && e.meta && e.meta.settles).map(e => e.meta.settles));
    return ledger
      .filter(e => e.debtOwed && typeof e.debtOwed === "object" && !settled.has(e.id))
      .map(e => ({ id: e.id, t: e.t, kind: e.kind, to: e.debtOwed.to || null, role: roleOf(e),
                   what: e.debtOwed.what || "", dueBy: e.debtOwed.dueBy || null, amount: e.debtOwed.amount || 0 }))
      .filter(d => !who || d.role === who || d.to === who);
  }
  function memOwe(to, what, opts) {
    const o = opts || {};
    return ledgerAppend({
      kind: o.kind || "debt", actor: "governor", target: to, gravity: o.gravity || 1, evidence: o.evidence || 1,
      note: o.note || ("Owes " + to + ": " + what),
      debtOwed: { to: to, role: o.role || null, what: what, dueBy: o.dueBy || null, amount: o.amount || 0 },
      relatedEntity: o.relatedEntity || null, financial: o.financial || 0,
    });
  }
  function memSettle(id, how) {
    const e = ledger.find(x => x.id === id);
    if (!e || !e.debtOwed) return null;
    return ledgerAppend({
      kind: "debt_settled", actor: "governor", target: e.target || (e.debtOwed && e.debtOwed.to) || null,
      gravity: 0, evidence: 1, note: "Settled: " + (e.debtOwed.what || e.id) + (how ? " — " + how : ""),
      meta: { settles: id, how: how || null }, causedBy: [id],
    });
  }
  const memory = { did: memDid, all: memAll, promises: memPromises, owed: memOwed, owe: memOwe, settle: memSettle };

  // A new run starts with a clean record. (Loading a save hydrates instead.)
  window.addEventListener("sop-new-game", () => {
    ledger.length = 0;
    discoveryMap.clear();
    nextId = 1;
    bumpVersion();
  });

  // ── Persistence ────────────────────────────────────────────────────────
  // The ledger was previously lost on every save/load, taking tribunal
  // evidence, EFCC exposure and adviser memory with it. These two functions
  // are what the save blob uses.
  function ledgerSerialize() {
    return {
      v: 2,
      nextId,
      entries: ledger.map(e => ({ ...e, meta: e.meta ? { ...e.meta } : null })),
      discovery: Array.from(discoveryMap.entries()),
    };
  }
  function ledgerHydrate(blob) {
    if (!blob || !Array.isArray(blob.entries)) return false;
    ledger.length = 0;
    discoveryMap.clear();
    blob.entries.forEach(raw => {
      // Re-run through the same normaliser so v1 saves gain the v2 fields.
      const e = Object.freeze({
        id: raw.id, t: raw.t || 0, ts: raw.ts || Date.now(), kind: raw.kind || "misc",
        actor: raw.actor || null, target: raw.target || null,
        gravity: typeof raw.gravity === "number" ? raw.gravity : 1,
        evidence: typeof raw.evidence === "number" ? raw.evidence : 1,
        corruptionDelta: raw.corruptionDelta || 0, approvalDelta: raw.approvalDelta || 0,
        note: raw.note || "", meta: raw.meta ? Object.freeze({ ...raw.meta }) : null,
        location: raw.location || null, decision: raw.decision || null, outcome: raw.outcome || null,
        beneficiaries: Object.freeze((raw.beneficiaries || []).slice()),
        losers: Object.freeze((raw.losers || []).slice()),
        financial: typeof raw.financial === "number" ? raw.financial : 0,
        debtOwed: raw.debtOwed || null, futureRisk: raw.futureRisk || null,
        relatedEntity: raw.relatedEntity || null,
        causedBy: Object.freeze((raw.causedBy || []).slice()),
      });
      ledger.push(e);
      discoveryMap.set(e.id, { discovered: false, discoveredQ: null, consumedBy: null });
    });
    (blob.discovery || []).forEach(([k, v]) => { if (discoveryMap.has(k)) discoveryMap.set(k, v); });
    nextId = typeof blob.nextId === "number" ? blob.nextId
      : ledger.reduce((m, e) => Math.max(m, parseInt(String(e.id).slice(1), 10) || 0), 0) + 1;
    bumpVersion();
    return true;
  }

  // ── Discovery (only mutable path) ──────────────────────────────────────
  function ledgerDiscover(id, by) {
    const d = discoveryMap.get(id);
    if (!d || d.discovered) return false;
    discoveryMap.set(id, { discovered: true, discoveredQ: currentTurn(), consumedBy: by || null });
    bumpVersion();
    return true;
  }
  function ledgerMarkConsumed(id, by) {
    const d = discoveryMap.get(id);
    if (!d) return false;
    discoveryMap.set(id, { ...d, consumedBy: by || "consumed" });
    bumpVersion();
    return true;
  }

  // ── Reads ──────────────────────────────────────────────────────────────
  function ledgerAll() { return ledger.slice(); }
  function ledgerRecent(n) { return ledger.slice(-n); }
  function ledgerByKind(kind) { return ledger.filter(e => e.kind === kind); }
  function ledgerDiscovered() {
    return ledger.filter(e => (discoveryMap.get(e.id) || {}).discovered);
  }
  function ledgerHidden() {
    return ledger.filter(e => !(discoveryMap.get(e.id) || {}).discovered);
  }
  function ledgerDiscoveryOf(id) { return discoveryMap.get(id) || null; }

  // ── React tick bridge ──────────────────────────────────────────────────
  // Main component keeps a useState `ledgerVersion` and installs
  // window.SOP._bumpLedgerVersion = () => setLedgerVersion(v => v+1)
  // so the dev tab (and any consumer that reads through props/effects)
  // re-renders on append. Without this, the shim is silent on the UI.
  function bumpVersion() {
    try { window.SOP && window.SOP._bumpLedgerVersion && window.SOP._bumpLedgerVersion(); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("sop-ledger", { detail: { size: ledger.length } })); } catch (e) {}
  }

  /* ============================================================
     CONSUMER 1 — Tribunal case strength (READ-ONLY shim)
     Derives evidence bullets from ledger entries. The old
     evidenceScore() in sop-v2.js still uses live stats; this
     function is called by sop-v2 and appended to that list.
     Post-swap, this replaces the standalone tribunal-strength
     variables entirely.
     ============================================================ */
  function ledgerTribunalStrength() {
    const items = [];
    let delta = 0;
    const nepot = ledgerByKind("nepotism_flag").length;
    if (nepot >= 1) { delta -= 6 * Math.min(nepot, 4); items.push({ ok:false, txt:`${nepot} nepotism flag(s) on record — opposing counsel will cite them` }); }
    const padded = ledgerByKind("budget_padding").length;
    if (padded >= 2) { delta -= 5; items.push({ ok:false, txt:`${padded} padded budget lines approved — treasury paper trail` }); }
    else if (padded === 0 && ledgerByKind("budget_character").length) { delta += 4; items.push({ ok:true, txt:"No padded envelopes signed — clean fiscal record" }); }
    const defiance = ledgerByKind("court_defiance").length;
    if (defiance) { delta -= 10 * defiance; items.push({ ok:false, txt:`${defiance} court defiance event(s) — bench remembers` }); }
    const compliance = ledgerByKind("court_compliance").length;
    if (compliance >= 2) { delta += 5; items.push({ ok:true, txt:`${compliance} rulings complied with — respect for judiciary` }); }
    const eia = ledgerByKind("eia_bypass").length;
    if (eia) { delta -= 4 * eia; items.push({ ok:false, txt:`${eia} project(s) started without EIA — environmental case exposure` }); }
    const gfBetray = ledgerByKind("godfather_betrayal").length;
    if (gfBetray) { delta -= 8; items.push({ ok:false, txt:"Godfather feud on record — party witnesses hostile" }); }
    const openBids = ledgerByKind("contract_awarded").filter(e => e.meta && e.meta.method === "open").length;
    if (openBids >= 2) { delta += 6; items.push({ ok:true, txt:`${openBids} contracts via open competitive bidding` }); }
    return { delta, items };
  }

  /* ============================================================
     CONSUMER 2 — SA proactive signals (READ-ONLY shim)
     ============================================================ */
  function ledgerSaSignals() {
    const out = [];
    const recent = ledger.slice(-12);
    const nepot = recent.filter(e => e.kind === "nepotism_flag").length;
    if (nepot >= 2) out.push({ tone:"red", txt:`${nepot} nepotism awards this quarter — the press will notice soon.` });
    const defiance = recent.filter(e => e.kind === "court_defiance").length;
    if (defiance) out.push({ tone:"red", txt:"You defied a court order recently. Judiciary is now hostile." });
    const padding = recent.filter(e => e.kind === "budget_padding").length;
    if (padding >= 2) out.push({ tone:"amber", txt:`${padding} padded lines signed off — House will corner you on this.` });
    const fired = recent.filter(e => e.kind === "minister_fired" && e.meta && e.meta.godfather).length;
    if (fired) out.push({ tone:"red", txt:"You sacked a godfather-imposed commissioner. Expect retaliation." });
    return out;
  }

  /* ============================================================
     Dev tab — floating button; pure read-out of ledger + discovery.
     Removed post-swap; replaced by proper reducer-time devtools.
     ============================================================ */
  function installDevTab() {
    if (document.getElementById("sop-ledger-btn")) return;
    const btn = document.createElement("button");
    btn.id = "sop-ledger-btn";
    btn.textContent = "📒";
    btn.title = "Historic Ledger (dev)";
    Object.assign(btn.style, {
      position:"fixed", right: "36px", bottom: "36px", zIndex:99998,
      width: "116px", height: "116px", borderRadius:"50%", border:"1px solid #333",
      background:"#111", color:"#ffd166", fontSize: "65px", cursor:"pointer",
      boxShadow:"0 2px 8px rgba(0,0,0,.35)"
    });
    btn.onclick = openDevPanel;
    document.body.appendChild(btn);
  }

  function openDevPanel() {
    let panel = document.getElementById("sop-ledger-panel");
    if (panel) { panel.remove(); return; }
    panel = document.createElement("div");
    panel.id = "sop-ledger-panel";
    Object.assign(panel.style, {
      position:"fixed", right: "36px", bottom: "149px", zIndex:99997,
      width:"min(552px, 92vw)", maxHeight:"70vh", overflow:"auto",
      background:"#0f0f10", color:"#f2f2f2", border:"1px solid #333",
      borderRadius: "29px", padding: "36px", fontFamily:"ui-monospace, monospace",
      fontSize: "38px", boxShadow:"0 8px 24px rgba(0,0,0,.5)"
    });
    render();
    document.body.appendChild(panel);
    window.addEventListener("sop-ledger", render);

    function render() {
      if (!panel.isConnected) { window.removeEventListener("sop-ledger", render); return; }
      const rows = ledger.slice().reverse().map(e => {
        const d = discoveryMap.get(e.id) || {};
        const badge = d.discovered ? `<span style="color:#ff6b6b">DISCOVERED Q${d.discoveredQ}</span>` : `<span style="color:#666">hidden</span>`;
        return `<div style="border-top:1px solid #222;padding:6px 0">
          <div><b style="color:#ffd166">${e.kind}</b> <span style="color:#888">${e.id} · Q${e.t} · g${e.gravity}/e${e.evidence}</span></div>
          <div style="opacity:.85">${escapeHtml(e.note || "")}</div>
          <div style="color:#888">target: ${escapeHtml(e.target||"—")} · cor Δ ${e.corruptionDelta} · app Δ ${e.approvalDelta} · ${badge}</div>
        </div>`;
      }).join("");
      const strength = ledgerTribunalStrength();
      const sa = ledgerSaSignals();
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b>📒 Historic Ledger <span style="color:#888">(${ledger.length})</span></b>
          <button id="sop-ledger-close" style="background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:2px 8px;cursor:pointer">×</button>
        </div>
        <div style="background:#1a1a1c;border-radius:6px;padding:6px;margin-bottom:6px">
          <div style="color:#8dd3ff"><b>Tribunal Δ</b>: ${strength.delta}</div>
          ${strength.items.map(i => `<div style="color:${i.ok?'#6fdd8b':'#ff9aa2'}">${i.ok?'✔':'✘'} ${escapeHtml(i.txt)}</div>`).join("") || '<div style="color:#666">no ledger evidence yet</div>'}
        </div>
        <div style="background:#1a1a1c;border-radius:6px;padding:6px;margin-bottom:6px">
          <div style="color:#ffd166"><b>SA signals</b></div>
          ${sa.map(s => `<div style="color:${s.tone==='red'?'#ff9aa2':'#ffd166'}">• ${escapeHtml(s.txt)}</div>`).join("") || '<div style="color:#666">no urgent signals</div>'}
        </div>
        ${rows || '<div style="color:#666;padding:10px">Ledger empty — play a turn.</div>'}
      `;
      panel.querySelector("#sop-ledger-close").onclick = () => panel.remove();
    }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  // ── Public API ─────────────────────────────────────────────────────────
  window.SOP_LEDGER = {
    append: ledgerAppend,
    discover: ledgerDiscover,
    markConsumed: ledgerMarkConsumed,
    all: ledgerAll,
    recent: ledgerRecent,
    byKind: ledgerByKind,
    discovered: ledgerDiscovered,
    hidden: ledgerHidden,
    discoveryOf: ledgerDiscoveryOf,
    tribunalStrength: ledgerTribunalStrength,
    saSignals: ledgerSaSignals,
    trace: ledgerTrace,
    serialize: ledgerSerialize,
    hydrate: ledgerHydrate,
    memory: memory,
    SCHEMA: 2,
  };
  window.SOP_MEMORY = memory;
  // Also mount onto SOP bridge once ready.
  const attach = setInterval(() => {
    if (window.SOP) {
      Object.assign(window.SOP, {
        ledger, ledgerAppend, ledgerDiscover, ledgerByKind: ledgerByKind,
        ledgerTribunalStrength, ledgerSaSignals,
      });
      clearInterval(attach);
    }
  }, 200);

  // Install dev tab when DOM ready
  if (document.readyState !== "loading") installDevTab();
  else document.addEventListener("DOMContentLoaded", installDevTab);

  console.log("[SOP LEDGER] shim installed — append-only, dev tab bottom-right");

  /* ============================================================
     INSTRUMENTED_SITES (audit register — keep in sync with grep)
     Every setter that moves corruption or harms a named NPC:
       ✓ sop-realism.js awardProject       → contract_awarded, nepotism_flag, eia_bypass
       ✓ sop-realism.js fire minister      → minister_fired (godfather flag)
       ✓ sop-v2.js openBudget submit       → budget_padding, budget_character
       ✓ seat-of-power.html fireCom        → minister_fired
       ✓ seat-of-power.html court_defied   → court_defiance
       ✓ seat-of-power.html court_complied → court_compliance
       ✓ seat-of-power.html court_appealed → court_appeal
     Sites intentionally NOT ledgered carry `// no-ledger: <reason>`.
     ============================================================ */
})();
