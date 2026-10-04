/* =====================================================================
 * sop-civic.js — Civic Education & Political Realism Engine
 * ---------------------------------------------------------------------
 * Implements the civic-education spec: corruption as a multi-dimensional
 * system (not a single meter), Civic Lens explainers, four-part
 * end-of-turn civic review, and multi-directional accountability.
 *
 * Pure vanilla DOM overlay — no React.  Writes through window.SOP and
 * window.SOP_LEDGER.  Adds no save fields (dimensions are recomputed
 * from ledger entries on hydrate).
 * ===================================================================== */
(function () {
  "use strict";
  if (window.SOP_CIVIC_INSTALLED) return;
  window.SOP_CIVIC_INSTALLED = true;

  /* ────────────────────────────────────────────────────────────
   * 1. CIVIC LENS — plain-language explainer dictionary
   * ──────────────────────────────────────────────────────────── */
  const CIVIC_LENS = {
    appropriation: {
      title: "Appropriation Bill",
      formal: "An appropriation bill authorises public spending. The executive proposes it, but the legislature's role is not merely ceremonial. A governor who spends outside authorised appropriations may gain speed in the short term but create legal, political and audit exposure.",
      reality: "In practice, many governors treat the House as a rubber stamp. But a hostile House can delay, amend, or reject your budget — and opponents will use the record against you.",
      why: "Public money belongs to the public. The budget is the single most powerful tool a governor has — and the most scrutinised."
    },
    executive_power: {
      title: "Executive Power vs. Legislative Approval",
      formal: "The governor is head of the executive branch. But major decisions — budgets, appointments, contracts above thresholds — require legislative confirmation or statutory process.",
      reality: "Governors who bypass the House too often face impeachment motions, budget vetoes, and public investigations. Those who cooperate may have to compromise on patronage.",
      why: "Separation of powers exists so no single person can spend, appoint, and judge alone."
    },
    procurement: {
      title: "Public Procurement Process",
      formal: "The Public Procurement Act requires open competitive bidding for contracts above ₦2.5M (goods) or ₦100M (works). Sole-source is allowed only under defined emergency or specialist conditions.",
      reality: "Emergency waivers are abused routinely. A 'too urgent to bid' contract is a common vehicle for inflated costs. But every waiver creates a paper trail investigators can follow.",
      why: "Competitive bidding saves public money and deters kickbacks. Skipping it is fast — and traceable."
    },
    conflict_of_interest: {
      title: "Conflict of Interest",
      formal: "A public officer must not award contracts to companies in which they or their family have a financial interest. The Constitution (S.172) and Code of Conduct Bureau Act require declaration of assets.",
      reality: "Family-fronted companies are endemic. Many are never caught — until a whistleblower, audit, or political rival surfaces the connection.",
      why: "When the person awarding the contract also profits from it, the public interest loses."
    },
    due_process: {
      title: "Due Process",
      formal: "Due process means following the legally prescribed steps before taking action — notice, hearing, evidence, and the right to respond. Skipping steps can invalidate the action.",
      reality: "Due process can feel slow when people are suffering. But shortcuts create grounds for courts to overturn your decisions and for opponents to challenge your legitimacy.",
      why: "Process protects everyone — including you — from arbitrary power."
    },
    judicial_injunction: {
      title: "Judicial Injunction",
      formal: "A court can issue an injunction halting executive action — stopping a project, freezing funds, or restraining enforcement — until the legal question is resolved.",
      reality: "Injunctions are used both legitimately and politically. A governor who ignores one risks contempt of court, which can escalate to impeachment.",
      why: "Courts can slow or stop the executive — even when the governor believes the cause is just."
    },
    electoral_petition: {
      title: "Electoral Petition & Tribunal",
      formal: "A losing candidate can petition an Election Petition Tribunal within 21 days of the result. Grounds include non-compliance with the Electoral Act, disqualification, and votes not counted. Appeals go to the Court of Appeal and Supreme Court.",
      reality: "Tribunals rarely overturn elections — but they do, especially when evidence of non-compliance is strong. The legal battle can take months and consume a governor's first term.",
      why: "Elections can be challenged. Winning at the polls is not always the final word."
    },
    public_debt: {
      title: "Public Debt",
      formal: "States can borrow through bonds, sukuk, and external loans — but the Debt Management Office and federal limits apply. Debt servicing is deducted from FAAC allocations at source.",
      reality: "Debt feels free during construction and becomes a crisis when revenue falls. Deductions at source mean you can lose control of your own budget.",
      why: "Borrowing builds today with tomorrow's money. If tomorrow never comes, the state still owes."
    },
    faac_dependency: {
      title: "FAAC Dependency",
      formal: "The Federation Account Allocation Committee distributes oil revenue to states monthly. For most states, 60–80% of revenue comes from FAAC, not internally generated revenue (IGR).",
      reality: "When oil prices fall, your allocation drops without warning. A governor who spends as if FAAC is guaranteed will face a cash crisis.",
      why: "Most states are not financially self-sufficient. Federal transfers are volatile and political."
    },
    igr: {
      title: "Internally Generated Revenue",
      formal: "IGR is revenue a state collects itself — taxes, fees, licences. Unlike FAAC, the state controls it directly.",
      reality: "Raising IGR (through property tax, land charges, or fees) is politically painful. But states with strong IGR survive FAAC shocks that bankrupt others.",
      why: "IGR is the only revenue a governor truly controls. It is also the hardest to raise."
    },
    immunity: {
      title: "Immunity & Post-Tenure Accountability",
      formal: "Section 308 of the Constitution grants the governor immunity from civil and criminal prosecution during their tenure. Immunity does not extend to civil suits for acts done in personal capacity, and it expires the day you leave office.",
      reality: "Immunity is not a pardon. The EFCC, police, and courts can build a case file during your tenure and act the day you leave. Many former governors face trial after leaving office.",
      why: "Immunity protects the office, not the person. The clock starts ticking on day one."
    },
    investigative_journalism: {
      title: "Investigative Journalism",
      formal: "Journalists have constitutional protection (S.39) to publish information in the public interest. The Freedom of Information Act (2011) gives citizens and press the right to request government records.",
      reality: "Good investigative journalism can expose corruption the EFCC missed. But journalists face intimidation, and some outlets have political agendas. A story can be accurate, biased, or both.",
      why: "The press can be a watchdog — or a weapon. The difference matters."
    },
    whistleblowing: {
      title: "Whistleblowing",
      formal: "Nigeria's federal Whistleblower Policy (2016) offers whistleblowers up to 5% of recovered funds. It lacks statutory protection — state-level laws can give actual legal cover.",
      reality: "A whistleblower inside your own government can hand investigators the evidence they need. Protecting whistleblowers strengthens accountability; attacking them creates scandal.",
      why: "Insiders know where the bodies are buried. How you treat them determines whether they talk."
    },
    constitutional_limits: {
      title: "Constitutional Limits on State Power",
      formal: "The Constitution divides powers between federal and state. States control local government, land, education, health, and infrastructure. The federal government controls police, currency, defence, and foreign affairs.",
      reality: "States have tried to create their own security outfits (Amotekun, Ebube Agu) — legally fragile but politically popular. Pushing past constitutional limits invites federal pushback.",
      why: "A governor's power has a border. Crossing it invites resistance from above."
    },
    separation_of_powers: {
      title: "Separation of Powers",
      formal: "Power is divided between the executive (governor), legislature (House of Assembly), and judiciary (courts). Each branch checks the others.",
      reality: "In practice, governors dominate state Houses. But a weak House invites weak governance — the governor has no buffer when federal pressure comes. A strong House can block you, but it can also legitimise your decisions.",
      why: "No branch should have unchecked power — including the one you lead."
    },
    federal_state: {
      title: "Federal-State Relations",
      formal: "States depend on the federal government for revenue allocations, security, and major infrastructure funding. The federal government can investigate state finances through the EFCC and ICPC.",
      reality: "A governor aligned with the President gets softer federal treatment. A governor in opposition may face EFCC visits, withheld approvals, and federal muscle supporting rivals.",
      why: "Your relationship with Abuja can make or break your administration."
    },
    public_finance: {
      title: "Public Finance Basics",
      formal: "State revenue comes from FAAC allocations, IGR (taxes and fees), and borrowing. Expenditure goes to salaries (often 50-70%), overheads, capital projects, and debt servicing.",
      reality: "When salaries eat 70% of revenue, there is little left for development. Cutting salaries is political suicide. Borrowing delays the reckoning but deepens it.",
      why: "Every naira spent on one thing is a naira not spent on another. Trade-offs are the heart of governance."
    },
    agency_jurisdiction: {
      title: "Agency Jurisdiction",
      formal: "The EFCC investigates financial crimes (fraud, money laundering, contract inflation). The ICPC handles corruption in public offices. The Police handle general crime. The State Audit Office audits state accounts. Each has a different mandate and threshold.",
      reality: "Agencies can be politically directed — but they also have professional staff who build cases regardless. An investigation is not a charge; a charge is not a conviction.",
      why: "Different agencies catch different crimes. Knowing which one is looking tells you what they can — and cannot — do."
    },
    political_protection: {
      title: "Political Protection",
      formal: "There is no formal 'political protection' — but in practice, party loyalty, federal alignment, and legislative support can shield a governor from investigation or prosecution.",
      reality: "Protection is temporary. When the party loses power, the President changes, or the godfather withdraws, the shield disappears. The evidence remains.",
      why: "Today's protection can become tomorrow's exposure."
    },
    institutional_independence: {
      title: "Institutional Independence",
      formal: "The judiciary, audit office, procurement bureau, and electoral commission are designed to operate independently of the executive. Their independence is a constitutional safeguard.",
      reality: "Governors who weaken institutions gain short-term control but lose the legitimacy that makes decisions stick. Weakened institutions also fail to protect you when you need them.",
      why: "Institutions outlast governors. Weakening them for convenience today weakens your defence tomorrow."
    }
  };

  /* ────────────────────────────────────────────────────────────
   * 2. CORRUPTION SYSTEM — multi-dimensional tracking
   * ──────────────────────────────────────────────────────────── */
  const C = {
    // Each dimension 0-100 unless noted
    legalExposure: 0,       // how much legal trouble is building
    evidenceQuality: 0,     // how strong the evidence against you is
    publicSuspicion: 0,     // how much the public suspects
    institutionalDamage: 0, // how weakened institutions are
    financialLoss: 0,       // ₦B of public money lost to corruption
    politicalProtection: 50, // how shielded you are politically
    beneficiaryLoyalty: 0,  // how loyal your corrupt beneficiaries are
    victimImpact: 0,        // how much citizens have been harmed
    mediaAttention: 0,      // how much media scrutiny
    historicalSeverity: 0, // how bad this will look in history
    concealmentCount: 0,    // concealment actions taken
    remediationCount: 0,    // corrective actions taken
    // Accountability sources and their current pressure (0-100)
    accountability: {
      voters: 0,
      opposition: 0,
      house: 0,
      courts: 0,
      tribunals: 0,
      journalists: 0,
      whistleblowers: 0,
      auditors: 0,
      civilServants: 0,
      civilSociety: 0,
      traditional: 0,
      federalAgencies: 0,
      internalRivals: 0
    },
    // Pending delayed consequences
    pending: []
  };

  // Adjust dimensions. Called by game events via SOP_CIVIC.expose().
  function adjust(deltas) {
    for (const [k, v] of Object.entries(deltas)) {
      if (k === "accountability") {
        for (const [ak, av] of Object.entries(v)) {
          C.accountability[ak] = Math.max(0, Math.min(100, (C.accountability[ak] || 0) + av));
        }
      } else if (k === "pending") {
        C.pending.push(...v);
      } else if (typeof C[k] === "number") {
        C[k] = Math.max(0, Math.min(k === "financialLoss" ? 9999 : 100, C[k] + v));
      }
    }
    // Recompute derived: historical severity grows with evidence + financial loss + institutional damage
    C.historicalSeverity = Math.min(100,
      C.evidenceQuality * 0.3 + Math.min(50, C.financialLoss * 2) * 0.3 +
      C.institutionalDamage * 0.2 + C.concealmentCount * 5 * 0.2
    );
    // Legal exposure grows with evidence quality, reduced by political protection
    C.legalExposure = Math.min(100,
      Math.max(0, C.evidenceQuality * (1 - C.politicalProtection / 200))
    );
    renderBadge();
  }

  /* ────────────────────────────────────────────────────────────
   * 3. EVENT LISTENER — track game events to update dimensions
   * ──────────────────────────────────────────────────────────── */
  window.addEventListener("sop-log", function (e) {
    const tx = (e.detail && e.detail.tx) || "";
    const tp = (e.detail && e.detail.tp) || "info";
    const t = (e.detail && e.detail.t) || 0;

    // Scan log text for corruption-related events
    if (tp === "scandal" || /scandal|fraud|corrupt|kickback|inflat|missing|EFCC|investigation|audit|whistlebl/i.test(tx)) {
      adjust({
        evidenceQuality: 5,
        publicSuspicion: 4,
        mediaAttention: 5,
        accountability: { journalists: 3, civilSociety: 2, federalAgencies: /EFCC/i.test(tx) ? 8 : 0 }
      });
    }
    if (/conceal|bury|discredit|quiet fix|suppress/i.test(tx)) {
      adjust({ concealmentCount: 1, evidenceQuality: 3, publicSuspicion: 2, accountability: { journalists: 4 } });
    }
    if (/cooperat|transparency|reform|audit.*publish|open government/i.test(tx)) {
      adjust({ remediationCount: 1, publicSuspicion: -3, institutionalDamage: -2, accountability: { civilSociety: -2 } });
    }
    if (/EFCC|investigation.*launched/i.test(tx)) {
      adjust({ accountability: { federalAgencies: 10 } });
    }
    if (/court|injunction|tribunal|judgment|ruling/i.test(tx)) {
      adjust({ accountability: { courts: 5, tribunals: /tribunal/i.test(tx) ? 5 : 0 } });
    }
  });

  // Listen for ledger appends for richer tracing
  window.addEventListener("sop-ledger-append", function (e) {
    const entry = e.detail || {};
    if (entry.financial && entry.financial > 0) {
      adjust({ financialLoss: entry.financial, evidenceQuality: 2 });
    }
    if (entry.futureRisk) {
      C.pending.push({ turn: entry.turn || 0, text: entry.futureRisk, source: entry.decision || "prior decision" });
    }
  });

  /* ────────────────────────────────────────────────────────────
   * 4. CIVIC LENS OVERLAY
   * ──────────────────────────────────────────────────────────── */
  let lensOverlay = null;

  function openLens(key) {
    const data = CIVIC_LENS[key];
    if (!data) return;
    closeLens();

    // Read mode for theming
    const mode = (window.SOP_DS && window.SOP_DS.mode) || "public";
    const isPrivate = mode === "private";
    const isDark = isPrivate;

    const bg = isPrivate ? "#1a1a2e" : "#f6f4ef";
    const cardBg = isPrivate ? "#16213e" : "#fffcf5";
    const txt = isPrivate ? "#e0e0e0" : "#1a1a1a";
    const td = isPrivate ? "#a0a0b8" : "#5a5a4a";
    const border = isPrivate ? "#2a2a4e" : "#d4c9a8";
    const accent = isPrivate ? "#7c6ff0" : "#2d5a3d";

    lensOverlay = document.createElement("div");
    lensOverlay.id = "sop-civic-lens";
    lensOverlay.style.cssText = [
      "position:absolute", "top:0", "left:0", "width:100%", "height:100%",
      "background:" + bg + "ee", "z-index:9000", "display:flex",
      "align-items:center", "justify-content:center",
      "padding:3vh 4vw", "box-sizing:border-box",
      "animation:sop-fade-in .2s ease"
    ].join(";");

    lensOverlay.innerHTML = `
      <div style="background:${cardBg};border:1px solid ${border};border-radius:16px;padding:36px 44px;max-width:680px;width:100%;max-height:88vh;overflow-y:auto;font-family:'Plus Jakarta Sans',system-ui,sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
          <div>
            <div style="font-size:18px;letter-spacing:3px;text-transform:uppercase;color:${accent};font-weight:600;font-family:'Fraunces',Georgia,serif">Civic Lens</div>
            <h3 style="font-size:27px;font-weight:700;color:${txt};margin:4px 0 0;font-family:'Fraunces',Georgia,serif">${data.title}</h3>
          </div>
          <button id="sop-civic-close" style="background:none;border:none;font-size:34px;color:${td};cursor:pointer;padding:0 8px;flex-shrink:0">×</button>
        </div>
        <div style="margin-bottom:18px">
          <div style="font-size:18px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:'Fraunces',Georgia,serif">Formal Rule</div>
          <p style="font-size:27px;line-height:1.5;color:${txt};margin:0">${data.formal}</p>
        </div>
        <div style="margin-bottom:18px">
          <div style="font-size:18px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:'Fraunces',Georgia,serif">Political Reality</div>
          <p style="font-size:27px;line-height:1.5;color:${txt};margin:0">${data.reality}</p>
        </div>
        <div style="margin-bottom:18px">
          <div style="font-size:18px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:'Fraunces',Georgia,serif">Why This Matters</div>
          <p style="font-size:27px;line-height:1.5;color:${txt};margin:0">${data.why}</p>
        </div>
        <div style="background:${accent}10;border-radius:8px;padding:12px 16px;margin-top:8px">
          <p style="font-size:18px;line-height:1.4;color:${td};margin:0;font-style:italic">This simulation simplifies legal and institutional processes for gameplay. It is an educational representation, not legal advice or a prediction of any individual case.</p>
        </div>
      </div>
    `;

    // Mount into the scaled stage if available, else body
    const stage = document.getElementById("sop-stage") || document.body;
    stage.appendChild(lensOverlay);

    document.getElementById("sop-civic-close").onclick = closeLens;
    lensOverlay.addEventListener("click", function (ev) {
      if (ev.target === lensOverlay) closeLens();
    });
  }

  function closeLens() {
    if (lensOverlay) { lensOverlay.remove(); lensOverlay = null; }
  }

  /* ────────────────────────────────────────────────────────────
   * 5. CIVIC LENS BUTTON — injectable button for any screen
   * ──────────────────────────────────────────────────────────── */
  function lensButton(key, label) {
    label = label || "Civic Lens";
    const mode = (window.SOP_DS && window.SOP_DS.mode) || "public";
    const accent = mode === "private" ? "#7c6ff0" : "#2d5a3d";
    const bg = mode === "private" ? "#1a1a2e" : "#f6f4ef";
    const txt = mode === "private" ? "#e0e0e0" : "#3a3a2a";
    const btn = document.createElement("button");
    btn.className = "sop-civic-lens-btn";
    btn.style.cssText = [
      "background:" + bg, "border:1px solid " + accent, "color:" + accent,
      "padding:8px 18px", "border-radius:20px", "font-size:21px",
      "font-family:'Fraunces',Georgia,serif", "font-weight:600",
      "cursor:pointer", "letter-spacing:.5px", "transition:all .15s",
      "display:inline-flex", "align-items:center", "gap:6px"
    ].join(";");
    btn.innerHTML = '📖 ' + label;
    btn.onmouseenter = function () { btn.style.background = accent; btn.style.color = "#fff"; };
    btn.onmouseleave = function () { btn.style.background = bg; btn.style.color = accent; };
    btn.onclick = function () { openLens(key); };
    return btn;
  }

  /* ────────────────────────────────────────────────────────────
   * 6. CORRUPTION DIMENSIONS BADGE / PANEL
   * ──────────────────────────────────────────────────────────── */
  let badgeEl = null;
  let panelEl = null;

  function renderBadge() {
    // The badge is hidden per user request (EFCC/ledger icons removed)
    // but dimensions still track internally for the end-of-turn review
  }

  function openCorruptionPanel() {
    closeCorruptionPanel();
    const mode = (window.SOP_DS && window.SOP_DS.mode) || "public";
    const isPrivate = mode === "private";
    const bg = isPrivate ? "#1a1a2e" : "#f6f4ef";
    const cardBg = isPrivate ? "#16213e" : "#fffcf5";
    const txt = isPrivate ? "#e0e0e0" : "#1a1a1a";
    const td = isPrivate ? "#a0a0b8" : "#5a5a4a";
    const border = isPrivate ? "#2a2a4e" : "#d4c9a8";

    const dims = [
      ["Legal Exposure", C.legalExposure, C.legalExposure > 50 ? "#c44" : C.legalExposure > 25 ? "#c84" : "#4a8"],
      ["Evidence Quality", C.evidenceQuality, C.evidenceQuality > 50 ? "#c44" : C.evidenceQuality > 25 ? "#c84" : "#4a8"],
      ["Public Suspicion", C.publicSuspicion, C.publicSuspicion > 50 ? "#c44" : C.publicSuspicion > 25 ? "#c84" : "#4a8"],
      ["Institutional Damage", C.institutionalDamage, C.institutionalDamage > 50 ? "#c44" : C.institutionalDamage > 25 ? "#c84" : "#4a8"],
      ["Media Attention", C.mediaAttention, C.mediaAttention > 50 ? "#c44" : C.mediaAttention > 25 ? "#c84" : "#4a8"],
      ["Political Protection", C.politicalProtection, C.politicalProtection > 50 ? "#4a8" : C.politicalProtection > 25 ? "#c84" : "#c44"],
      ["Beneficiary Loyalty", C.beneficiaryLoyalty, C.beneficiaryLoyalty > 50 ? "#4a8" : "#88a"],
      ["Victim Impact", C.victimImpact, C.victimImpact > 50 ? "#c44" : C.victimImpact > 25 ? "#c84" : "#4a8"],
      ["Historical Severity", C.historicalSeverity, C.historicalSeverity > 50 ? "#c44" : C.historicalSeverity > 25 ? "#c84" : "#4a8"],
    ];

    const accKeys = Object.keys(C.accountability);
    const accActive = accKeys.filter(k => C.accountability[k] > 0);
    const accBars = accActive.length ? accActive.map(k => {
      const v = C.accountability[k];
      const lbl = k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:18px;color:${td};width:120px;text-transform:capitalize">${lbl}</span>
        <div style="flex:1;height:6px;background:${border};border-radius:3px;overflow:hidden">
          <div style="width:${v}%;height:100%;background:${v > 50 ? "#c44" : v > 25 ? "#c84" : "#4a8"}"></div>
        </div>
        <span style="font-size:18px;color:${td};width:30px;text-align:right">${Math.round(v)}</span>
      </div>`;
    }).join("") : '<div style="font-size:18px;color:' + td + ';font-style:italic">No active accountability pressure</div>';

    const pendingHtml = C.pending.length ? C.pending.slice(-5).map(p =>
      `<div style="font-size:18px;color:${td};padding:4px 0;border-bottom:1px solid ${border}40">⏳ ${p.text}</div>`
    ).join("") : '<div style="font-size:18px;color:' + td + ';font-style:italic">No pending consequences</div>';

    panelEl = document.createElement("div");
    panelEl.id = "sop-civic-panel";
    panelEl.style.cssText = [
      "position:absolute", "top:0", "left:0", "width:100%", "height:100%",
      "background:" + bg + "ee", "z-index:9000", "display:flex",
      "align-items:center", "justify-content:center",
      "padding:3vh 4vw", "box-sizing:border-box"
    ].join(";");

    panelEl.innerHTML = `
      <div style="background:${cardBg};border:1px solid ${border};border-radius:16px;padding:32px 40px;max-width:620px;width:100%;max-height:88vh;overflow-y:auto;font-family:'Plus Jakarta Sans',system-ui,sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h3 style="font-size:27px;font-weight:700;color:${txt};margin:0;font-family:'Fraunces',Georgia,serif">Corruption & Accountability</h3>
          <button id="sop-civic-panel-close" style="background:none;border:none;font-size:34px;color:${td};cursor:pointer;padding:0 8px">×</button>
        </div>
        <div style="font-size:18px;color:${td};margin-bottom:16px;font-style:italic">Corruption is a system, not a meter. Shortcuts create evidence, debt, victims, and future exposure. Accountability can arrive from multiple directions — late, but it arrives.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin-bottom:20px">
          ${dims.map(([label, val, color]) => `<div>
            <div style="display:flex;justify-content:space-between;font-size:18px;color:${td};margin-bottom:2px"><span>${label}</span><span style="color:${color};font-weight:600">${Math.round(val)}${label === "Financial Loss" ? "B" : ""}</span></div>
            <div style="height:6px;background:${border};border-radius:3px;overflow:hidden"><div style="width:${Math.min(100, val)}%;height:100%;background:${color}"></div></div>
          </div>`).join("")}
        </div>
        ${C.financialLoss > 0 ? `<div style="font-size:21px;color:${txt};margin-bottom:16px"><strong>Financial Loss:</strong> ₦${C.financialLoss.toFixed(1)}B of public money lost to corruption</div>` : ""}
        <div style="margin-bottom:20px">
          <div style="font-size:21px;font-weight:600;color:${txt};margin-bottom:8px;font-family:'Fraunces',Georgia,serif">Active Accountability Pressure</div>
          ${accBars}
        </div>
        <div>
          <div style="font-size:21px;font-weight:600;color:${txt};margin-bottom:8px;font-family:'Fraunces',Georgia,serif">Pending Consequences</div>
          ${pendingHtml}
        </div>
        <div style="margin-top:16px;padding:12px 16px;background:${border}30;border-radius:8px">
          <div style="font-size:18px;color:${td}">
            <strong>Concealment actions:</strong> ${C.concealmentCount} &nbsp;|&nbsp;
            <strong>Remediation actions:</strong> ${C.remediationCount}
          </div>
          <div style="font-size:18px;color:${td};margin-top:4px;font-style:italic">Remediation does not erase history. It changes how history judges you.</div>
        </div>
      </div>
    `;

    const stage = document.getElementById("sop-stage") || document.body;
    stage.appendChild(panelEl);
    document.getElementById("sop-civic-panel-close").onclick = closeCorruptionPanel;
    panelEl.addEventListener("click", function (ev) { if (ev.target === panelEl) closeCorruptionPanel(); });
  }

  function closeCorruptionPanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; }
  }

  /* ────────────────────────────────────────────────────────────
   * 7. END-OF-TURN CIVIC REVIEW
   * ──────────────────────────────────────────────────────────── */
  let reviewEl = null;
  let lastReviewTurn = -1;

  function buildReview(state) {
    const S = window.SOP;
    if (!S) return;
    const turn = S.turn;
    if (turn === lastReviewTurn) return; // already shown this turn
    lastReviewTurn = turn;

    const logs = (S.logs || []).filter(function (l) { return l.t === turn; });
    const s = S.s || {};
    const mode = (window.SOP_DS && window.SOP_DS.mode) || "public";
    const isPrivate = mode === "private";

    const bg = isPrivate ? "#1a1a2e" : "#f6f4ef";
    const cardBg = isPrivate ? "#16213e" : "#fffcf5";
    const txt = isPrivate ? "#e0e0e0" : "#1a1a1a";
    const td = isPrivate ? "#a0a0b8" : "#5a5a4a";
    const border = isPrivate ? "#2a2a4e" : "#d4c9a8";
    const accent = isPrivate ? "#7c6ff0" : "#2d5a3d";

    // WHAT YOU DID — from logs this turn
    const actions = logs.map(function (l) { return l.tx; });
    const whatYouDid = actions.length ? actions.slice(0, 6).map(function (a) {
      return '<div style="font-size:21px;color:' + txt + ';padding:6px 0;border-bottom:1px solid ' + border + '30;line-height:1.4">' + a + '</div>';
    }).join("") : '<div style="font-size:21px;color:' + td + ';font-style:italic">No major actions recorded this half-year.</div>';

    // WHAT GOVERNMENT DID — derived from state changes
    const gov = [];
    if (s.gdp) gov.push('GDP: ₦' + (s.gdp).toFixed(1) + 'B');
    if (s.totalJobs) gov.push('Jobs: ' + ((s.totalJobs / 1000).toFixed(0)) + 'K');
    gov.push('IGR: ₦' + (s.igr || 0).toFixed(1) + 'B');
    gov.push('FAAC: ₦' + (s.faac || 0).toFixed(1) + 'B');
    gov.push('Approval: ' + Math.round(s.app || 0) + '%');
    gov.push('Corruption: ' + Math.round((s.cor || 0) * 100) + '%');

    // WHO BENEFITED AND WHO PAID — from corruption dimensions
    const beneficiaries = [];
    const payers = [];
    if (C.beneficiaryLoyalty > 20) beneficiaries.push('Contractors and political allies who received patronage');
    if (s.app > 50) beneficiaries.push('Constituents who saw visible projects or salaries paid');
    if ((s.infra || 0) > 0.4) beneficiaries.push('Communities with new infrastructure');
    if (C.financialLoss > 0) payers.push('Treasury: ₦' + C.financialLoss.toFixed(1) + 'B lost to corruption');
    if (s.debt > 0) payers.push('Future budgets: ₦' + (s.debt || 0).toFixed(1) + 'B in debt servicing');
    if (C.victimImpact > 20) payers.push('Citizens harmed by neglected services or inflated contracts');
    if ((s.sec || 0) < 0.35) payers.push('Communities affected by insecurity');
    if (!beneficiaries.length) beneficiaries.push('No clear beneficiaries this period');
    if (!payers.length) payers.push('No major costs identified');

    // WHAT INSTITUTIONS WILL REMEMBER — from accountability sources
    const institutions = [];
    if (C.accountability.journalists > 20) institutions.push('The press is building a file on your administration.');
    if (C.accountability.courts > 20) institutions.push('The judiciary has been asked to rule on your actions.');
    if (C.accountability.federalAgencies > 20) institutions.push('The EFCC has flagged your state for review.');
    if (C.accountability.house > 20) institutions.push('The House of Assembly is scrutinising your spending.');
    if (C.accountability.civilSociety > 20) institutions.push('Civil society groups are mobilising public pressure.');
    if (C.accountability.auditors > 20) institutions.push('The State Audit Office has flagged irregularities.');
    if (C.institutionalDamage > 30) institutions.push('Institutional independence has been weakened — this will outlast your tenure.');
    if (C.concealmentCount > 0) institutions.push('Records show ' + C.concealmentCount + ' concealment attempt(s). These do not disappear.');
    if (!institutions.length) institutions.push('No major institutional concerns this period.');

    // CIVIC LENS learning cards
    const learningCards = [];
    if (C.financialLoss > 0 || C.concealmentCount > 0) {
      learningCards.push({ key: "procurement", label: "The Procurement Lesson" });
    }
    if (C.accountability.courts > 20 || C.accountability.tribunals > 20) {
      learningCards.push({ key: "judicial_injunction", label: "The Accountability Lesson" });
    }
    if (s.debt > 2) {
      learningCards.push({ key: "public_debt", label: "The Debt Lesson" });
    }
    if (C.accountability.federalAgencies > 20) {
      learningCards.push({ key: "agency_jurisdiction", label: "The Investigation Lesson" });
    }
    learningCards.push({ key: "separation_of_powers", label: "The Institutional Lesson" });

    // Ledger entries this turn
    let ledgerEntries = [];
    try {
      if (window.SOP_LEDGER && window.SOP_LEDGER.serialize) {
        const blob = window.SOP_LEDGER.serialize();
        ledgerEntries = (blob.entries || []).filter(function (e) { return e.turn === turn; });
      }
    } catch (e) {}

    const yr = S.setup ? (turn <= 4 ? "1st Term" : "2nd Term") + " — Year " + Math.ceil((turn <= 4 ? turn : turn - 4) / 2) + ", " + ((turn <= 4 ? turn : turn - 4) % 2 === 1 ? "H1" : "H2") : "Turn " + turn;

    // Build the review overlay
    reviewEl = document.createElement("div");
    reviewEl.id = "sop-civic-review";
    reviewEl.style.cssText = [
      "position:absolute", "top:0", "left:0", "width:100%", "height:100%",
      "background:" + bg, "z-index:8500", "display:flex",
      "align-items:flex-start", "justify-content:center",
      "padding:4vh 4vw", "box-sizing:border-box", "overflow-y:auto",
      "animation:sop-fade-in .3s ease"
    ].join(";");

    reviewEl.innerHTML = `
      <div style="background:${cardBg};border:1px solid ${border};border-radius:16px;padding:32px 40px;max-width:760px;width:100%;font-family:'Plus Jakarta Sans',system-ui,sans-serif">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:${accent};font-weight:600;font-family:'Fraunces',Georgia,serif">Civic Review</div>
          <h2 style="font-size:34px;font-weight:700;color:${txt};margin:6px 0 0;font-family:'Fraunces',Georgia,serif">${yr} — Half-Year Review</h2>
        </div>

        <!-- 1. WHAT YOU DID -->
        <div style="margin-bottom:22px">
          <div style="font-size:27px;font-weight:700;color:${accent};margin-bottom:8px;font-family:'Fraunces',Georgia,serif;letter-spacing:.5px">1. What You Did</div>
          ${whatYouDid}
        </div>

        <!-- 2. WHAT GOVERNMENT DID -->
        <div style="margin-bottom:22px">
          <div style="font-size:27px;font-weight:700;color:${accent};margin-bottom:8px;font-family:'Fraunces',Georgia,serif;letter-spacing:.5px">2. What Government Did</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${gov.map(function (g) { return '<span style="background:' + border + '30;padding:6px 14px;border-radius:20px;font-size:21px;color:' + txt + '">' + g + '</span>'; }).join('')}
          </div>
        </div>

        <!-- 3. WHO BENEFITED AND WHO PAID -->
        <div style="margin-bottom:22px">
          <div style="font-size:27px;font-weight:700;color:${accent};margin-bottom:8px;font-family:'Fraunces',Georgia,serif;letter-spacing:.5px">3. Who Benefited & Who Paid</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="background:#4a84;padding:12px 16px;border-radius:10px">
              <div style="font-size:18px;font-weight:600;color:#4a8;margin-bottom:6px">BENEFITED</div>
              ${beneficiaries.map(function (b) { return '<div style="font-size:21px;color:' + txt + ';padding:3px 0;line-height:1.4">✓ ' + b + '</div>'; }).join('')}
            </div>
            <div style="background:#c4415;padding:12px 16px;border-radius:10px">
              <div style="font-size:18px;font-weight:600;color:#c44;margin-bottom:6px">PAID</div>
              ${payers.map(function (p) { return '<div style="font-size:21px;color:' + txt + ';padding:3px 0;line-height:1.4">✗ ' + p + '</div>'; }).join('')}
            </div>
          </div>
        </div>

        <!-- 4. WHAT INSTITUTIONS WILL REMEMBER -->
        <div style="margin-bottom:22px">
          <div style="font-size:27px;font-weight:700;color:${accent};margin-bottom:8px;font-family:'Fraunces',Georgia,serif;letter-spacing:.5px">4. What Institutions Will Remember</div>
          ${institutions.map(function (i) { return '<div style="font-size:21px;color:' + td + ';padding:5px 0;line-height:1.4;border-bottom:1px solid ' + border + '20">🏛️ ' + i + '</div>'; }).join('')}
        </div>

        <!-- CIVIC LENS LEARNING CARDS -->
        <div style="margin-bottom:20px">
          <div style="font-size:21px;font-weight:600;color:${td};margin-bottom:10px;font-family:'Fraunces',Georgia,serif">Optional Learning:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${learningCards.map(function (lc) {
              return '<button class="sop-civic-learn" data-key="' + lc.key + '" style="background:' + bg + ';border:1px solid ' + accent + ';color:' + accent + ';padding:8px 16px;border-radius:20px;font-size:18px;font-family:\'Fraunces\',Georgia,serif;font-weight:600;cursor:pointer">📖 ' + lc.label + '</button>';
            }).join('')}
          </div>
        </div>

        <!-- CORRUPTION SNAPSHOT -->
        ${(C.legalExposure > 10 || C.evidenceQuality > 10 || C.financialLoss > 0) ? `
        <div style="background:${border}20;border-radius:10px;padding:14px 18px;margin-bottom:20px">
          <div style="font-size:18px;font-weight:600;color:${td};margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Corruption Snapshot</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:18px;color:${txt}">
            <div>Legal Exposure: <strong style="color:${C.legalExposure > 40 ? '#c44' : '#4a8'}">${Math.round(C.legalExposure)}</strong></div>
            <div>Evidence: <strong style="color:${C.evidenceQuality > 40 ? '#c44' : '#4a8'}">${Math.round(C.evidenceQuality)}</strong></div>
            <div>Public Suspicion: <strong style="color:${C.publicSuspicion > 40 ? '#c44' : '#4a8'}">${Math.round(C.publicSuspicion)}</strong></div>
            <div>Media: <strong style="color:${C.mediaAttention > 40 ? '#c44' : '#4a8'}">${Math.round(C.mediaAttention)}</strong></div>
            <div>Protection: <strong style="color:${C.politicalProtection > 40 ? '#4a8' : '#c44'}">${Math.round(C.politicalProtection)}</strong></div>
            <div>Severity: <strong style="color:${C.historicalSeverity > 40 ? '#c44' : '#4a8'}">${Math.round(C.historicalSeverity)}</strong></div>
          </div>
          ${C.financialLoss > 0 ? '<div style="font-size:18px;color:#c44;margin-top:6px">Financial loss to corruption: ₦' + C.financialLoss.toFixed(1) + 'B</div>' : ''}
          <button id="sop-civic-full-panel" style="margin-top:8px;background:none;border:1px solid ' + accent + ';color:' + accent + ';padding:4px 12px;border-radius:14px;font-size:18px;cursor:pointer">View Full Corruption File</button>
        </div>
        ` : ''}

        <div style="text-align:center;padding-top:8px">
          <button id="sop-civic-review-close" style="background:${accent};color:#fff;border:none;padding:14px 40px;border-radius:24px;font-size:27px;font-family:'Fraunces',Georgia,serif;font-weight:600;cursor:pointer;letter-spacing:.5px">Continue</button>
        </div>
      </div>
    `;

    // Mount
    const stage = document.getElementById("sop-stage") || document.body;
    stage.appendChild(reviewEl);

    // Wire buttons
    document.getElementById("sop-civic-review-close").onclick = function () { closeReview(); };
    var learnBtns = reviewEl.querySelectorAll(".sop-civic-learn");
    learnBtns.forEach(function (btn) {
      btn.onclick = function () { openLens(btn.getAttribute("data-key")); };
    });
    var fullPanel = document.getElementById("sop-civic-full-panel");
    if (fullPanel) fullPanel.onclick = openCorruptionPanel;

    // Write to ledger
    try {
      if (window.SOP_LEDGER && window.SOP_LEDGER.append) {
        window.SOP_LEDGER.append({
          turn: turn,
          type: "civic_review",
          text: "Civic review for " + yr,
          decision: "end-of-turn review",
          outcome: "Approval " + Math.round(s.app || 0) + "%, Corruption " + Math.round((s.cor || 0) * 100) + "%, Debt ₦" + (s.debt || 0).toFixed(1) + "B",
          financial: C.financialLoss,
          futureRisk: C.pending.length ? C.pending[C.pending.length - 1].text : null,
          location: "Government House"
        });
      }
    } catch (e) {}
  }

  function closeReview() {
    if (reviewEl) { reviewEl.remove(); reviewEl = null; }
  }

  /* ────────────────────────────────────────────────────────────
   * 8. STATE LISTENER — detect end_turn phase
   * ──────────────────────────────────────────────────────────── */
  let civicState = { phase: null, turn: 0 };

  window.addEventListener("sop-state", function (e) {
    const S = window.SOP;
    if (!S) return;
    const phase = S.phase || (S.s && S.s.phase);
    const turn = S.turn || 0;

    // Detect transition INTO end_turn phase
    if (phase === "end_turn" && (civicState.phase !== "end_turn" || civicState.turn !== turn)) {
      civicState = { phase: phase, turn: turn };
      // Small delay to let React render the end_turn screen first
      setTimeout(function () {
        buildReview(S);
      }, 600);
    } else {
      civicState = { phase: phase, turn: turn };
    }
  });


  /* Civic Lens index — a menu of every institution explainer. */
  let indexOverlay = null;
  function closeLensIndex() { if (indexOverlay) { indexOverlay.remove(); indexOverlay = null; } }
  function openLensIndex() {
    closeLensIndex();
    const keys = Object.keys(CIVIC_LENS);
    indexOverlay = document.createElement("div");
    indexOverlay.id = "sop-civic-index";
    indexOverlay.style.cssText = "position:fixed;inset:0;z-index:12000;background:rgba(20,18,14,.72);display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Plus Jakarta Sans',sans-serif;";
    const rows = keys.map(function (k) {
      return '<button data-k="' + k + '" style="text-align:left;background:#fffcf5;border:1px solid #d4c9a8;border-radius:10px;padding:10px 14px;font-size:21px;font-weight:600;color:#1a1a1a;cursor:pointer;font-family:inherit">' + CIVIC_LENS[k].title + '</button>';
    }).join("");
    indexOverlay.innerHTML =
      '<div style="background:#f6f4ef;border:2px solid #d4c9a8;border-radius:14px;max-width:1100px;width:100%;max-height:86%;overflow:auto;padding:20px 22px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:12px">' +
      '<div style="font-size:34px;font-weight:800;color:#2d5a3d">CIVIC LENS</div>' +
      '<button id="sop-civic-index-x" style="background:#2d5a3d;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:21px;font-weight:700;cursor:pointer;font-family:inherit">CLOSE</button></div>' +
      '<div style="font-size:18px;color:#5a5a4a;margin-bottom:12px">How each institution is supposed to work, how it actually behaves, and why it matters.</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' + rows + '</div></div>';
    document.body.appendChild(indexOverlay);
    indexOverlay.addEventListener("click", function (e) {
      if (e.target === indexOverlay || e.target.id === "sop-civic-index-x") { closeLensIndex(); return; }
      const b = e.target.closest("button[data-k]");
      if (b) { closeLensIndex(); openLens(b.getAttribute("data-k")); }
    });
  }

  /* ────────────────────────────────────────────────────────────
   * 9. PUBLIC API
   * ──────────────────────────────────────────────────────────── */
  window.SOP_CIVIC = {
    // Civic Lens
    openLens: openLens,
    closeLens: closeLens,
    lensButton: lensButton,
    CIVIC_LENS: CIVIC_LENS,

    // Corruption system
    adjust: adjust,
    getCorruption: function () { return JSON.parse(JSON.stringify(C)); },

    // Corruption panel
    openPanel: openCorruptionPanel,
    closePanel: closeCorruptionPanel,

    // End-of-turn review
    buildReview: buildReview,
    closeReview: closeReview,
    resetReview: function () { lastReviewTurn = -1; },

    // Accountability helpers
    addAccountability: function (source, amount) {
      C.accountability[source] = Math.max(0, Math.min(100, (C.accountability[source] || 0) + amount));
      renderBadge();
    },
    getAccountability: function () { return JSON.parse(JSON.stringify(C.accountability)); },

    // Pending consequences
    addPending: function (entry) { C.pending.push(entry); },
    getPending: function () { return C.pending.slice(); },
    resolvePending: function (idx) {
      if (idx >= 0 && idx < C.pending.length) { C.pending.splice(idx, 1); }
    },

    // Reset for new game
    reset: function () {
      C.legalExposure = 0; C.evidenceQuality = 0; C.publicSuspicion = 0;
      C.institutionalDamage = 0; C.financialLoss = 0; C.politicalProtection = 50;
      C.beneficiaryLoyalty = 0; C.victimImpact = 0; C.mediaAttention = 0;
      C.historicalSeverity = 0; C.concealmentCount = 0; C.remediationCount = 0;
      C.pending = [];
      for (var k in C.accountability) C.accountability[k] = 0;
      lastReviewTurn = -1;
    },

    // Save / load
    restore: function (data) {
      if (!data || typeof data !== "object") return;
      for (var k in C) {
        if (k === "accountability" || k === "pending") continue;
        if (typeof data[k] === "number") C[k] = data[k];
      }
      if (data.accountability) for (var a in C.accountability) {
        if (typeof data.accountability[a] === "number") C.accountability[a] = data.accountability[a];
      }
      if (Array.isArray(data.pending)) C.pending = data.pending.slice();
      renderBadge();
    },

    // Index of every explainer — opened from the Help screen
    openIndex: openLensIndex,

    // Version
    VERSION: 1
  };

  // Add animation style
  var styleEl = document.createElement("style");
  styleEl.textContent = "@keyframes sop-fade-in{from{opacity:0}to{opacity:1}}";
  document.head.appendChild(styleEl);

  // Reset on new game
  window.addEventListener("sop-new-game", function () {
    window.SOP_CIVIC.reset();
  });

  console.log("[SOP-Civic] Civic Education & Political Realism Engine loaded");
})();
