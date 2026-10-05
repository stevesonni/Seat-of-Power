/* =====================================================================
 * SOP-POLITICS — rivals, factions and institutions
 * ---------------------------------------------------------------------
 * Three engines that run every turn behind the governing screens:
 *   RIVALS       — named people with ambition who move against you
 *   FACTIONS     — blocs whose standing shifts with your choices
 *   INSTITUTIONS — House, courts, EFCC, audit, press, civil service,
 *                  each with its own independence and pressure
 * Once per turn the engines produce one pressure decision, rendered
 * through the nine-question DecisionCard contract.
 * ===================================================================== */
(function () {
  if (window.SOP_POLITICS_INSTALLED) return;
  window.SOP_POLITICS_INSTALLED = true;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ── names ─────────────────────────────────────────────────────── */
  function nameFor() {
    try {
      if (window.SOP_NAME && window.SOP_NAME.person) return window.SOP_NAME.person();
      if (window.SNAMES_PATCHED && window.SNAMES_PATCHED.person) return window.SNAMES_PATCHED.person();
    } catch (e) {}
    const f = ["Chidi", "Halima", "Emeka", "Bilkisu", "Tunde", "Ngozi", "Sanusi", "Adaeze", "Ibrahim", "Funmilayo", "Terhemba", "Ekaette", "Yakubu", "Chiamaka"];
    const l = ["Okonkwo", "Bello", "Adeyemi", "Danladi", "Nwachukwu", "Osagie", "Ajayi", "Musa", "Etim", "Gambo", "Iorbee", "Effiong"];
    return pick(f) + " " + pick(l);
  }

  /* ── state ─────────────────────────────────────────────────────── */
  const P = {
    turnSeen: -1,
    rivals: [],
    factions: {},
    institutions: {},
    history: [],
  };

  const FACTION_DEFS = [
    { id: "party_old", name: "Party Old Guard", want: "appointments and contracts" },
    { id: "youth", name: "Youth Movement", want: "jobs and clean government" },
    { id: "labour", name: "Organised Labour", want: "wages paid on time" },
    { id: "business", name: "Business Community", want: "predictable policy" },
    { id: "traditional", name: "Traditional Council", want: "respect and consultation" },
    { id: "religious", name: "Religious Leaders", want: "moral seriousness" },
    { id: "senatorial_north", name: "Northern Senatorial Bloc", want: "their share of projects" },
    { id: "senatorial_south", name: "Southern Senatorial Bloc", want: "their share of projects" },
  ];

  const INSTITUTION_DEFS = [
    { id: "house", name: "State House of Assembly", lens: "executive_power" },
    { id: "judiciary", name: "State Judiciary", lens: "judicial_injunction" },
    { id: "efcc", name: "EFCC / Anti-graft Agencies", lens: "agency_jurisdiction" },
    { id: "audit", name: "Office of the Auditor-General", lens: "accountability" },
    { id: "press", name: "Press & Broadcasters", lens: "investigative_journalism" },
    { id: "service", name: "State Civil Service", lens: "institutional_independence" },
  ];

  const RIVAL_ROLES = [
    { role: "Deputy Governor", base: 30, note: "constitutionally next in line" },
    { role: "Speaker of the House", base: 35, note: "controls the floor" },
    { role: "State Party Chairman", base: 28, note: "controls the ticket" },
    { role: "Former Governor's Camp", base: 40, note: "wants the state back" },
    { role: "Federal Minister from the State", base: 25, note: "has Abuja's ear" },
  ];

  function seed() {
    P.rivals = RIVAL_ROLES.map(function (r) {
      return { id: r.role.toLowerCase().replace(/[^a-z]+/g, "_"), name: nameFor(), role: r.role, note: r.note, ambition: r.base + Math.floor(Math.random() * 12), loyalty: 45 + Math.floor(Math.random() * 25), moves: 0 };
    });
    P.factions = {};
    FACTION_DEFS.forEach(function (f) { P.factions[f.id] = { standing: 50, name: f.name, want: f.want }; });
    P.institutions = {};
    INSTITUTION_DEFS.forEach(function (i) { P.institutions[i.id] = { independence: 55, pressure: 0, name: i.name, lens: i.lens }; });
    P.history = [];
    P.turnSeen = -1;
  }
  seed();

  /* ── per-turn simulation ───────────────────────────────────────── */
  function advance(S) {
    syncCast();
    const st = (S && S.s) || {};
    const app = st.app != null ? st.app : 55;
    const cor = Math.round((st.cor || 0) * 100);
    const stab = st.pStab != null ? st.pStab : 60;

    // Rivals: weakness invites ambition, strength suppresses it.
    P.rivals.forEach(function (r) {
      let d = 0;
      if (app < 40) d += 4; else if (app > 65) d -= 3;
      if (stab < 45) d += 4; else if (stab > 70) d -= 2;
      if (cor > 50) d += 2;
      r.ambition = clamp(r.ambition + d + (Math.random() < .3 ? 2 : -1), 0, 100);
      r.loyalty = clamp(r.loyalty + (app > 60 ? 2 : -2), 0, 100);
    });

    // Factions drift toward or away from you.
    Object.keys(P.factions).forEach(function (k) {
      const f = P.factions[k];
      let d = app > 60 ? 2 : app < 40 ? -3 : 0;
      if (k === "youth" && cor > 45) d -= 3;
      if (k === "party_old" && cor > 45) d += 2;
      if (k === "labour" && (st.debt || 0) > 15) d -= 3;
      if (k === "business" && (st.infra || 0) > 55) d += 2;
      f.standing = clamp(f.standing + d, 0, 100);
    });

    // Institutions: corruption pressure raises scrutiny; capture lowers independence.
    let civic = null;
    try { civic = window.SOP_CIVIC && window.SOP_CIVIC.getCorruption(); } catch (e) {}
    Object.keys(P.institutions).forEach(function (k) {
      const i = P.institutions[k];
      const exposure = civic ? (civic.legalExposure + civic.evidenceQuality) / 2 : cor;
      i.pressure = clamp(Math.round(exposure * .6 + (100 - app) * .2), 0, 100);
      if (civic && civic.institutionalDamage > 40) i.independence = clamp(i.independence - 2, 5, 100);
      else i.independence = clamp(i.independence + 1, 5, 100);
    });
  }

  // The Deputy Governor and the Speaker are cast members: use their names
  // rather than inventing new people for the same seats.
  const CAST_SEATS = { deputy_governor: "deputy", speaker_of_the_house: "speaker" };
  function syncCast() {
    const C = window.SOP_CAST; if (!C) return;
    P.rivals.forEach(function (r) {
      const c = CAST_SEATS[r.id] && C.get(CAST_SEATS[r.id]);
      if (c) r.name = c.name;
    });
  }

  /* ── decision generation ───────────────────────────────────────── */
  function buildPressure(S) {
    const st = (S && S.s) || {};
    const app = st.app != null ? st.app : 55;
    const top = P.rivals.slice().sort(function (a, b) { return b.ambition - a.ambition; })[0];
    const weakest = Object.keys(P.factions).map(function (k) { return Object.assign({ id: k }, P.factions[k]); })
      .sort(function (a, b) { return a.standing - b.standing; })[0];
    const inst = P.institutions.house;

    // Three pressure archetypes; pick the one that fits the current state.
    if (top && top.ambition > 62) {
      return {
        kind: "rival",
        title: top.role.toUpperCase() + " MOVES",
        who: top.name + " — " + top.role,
        happening: top.name + " has been holding meetings in Abuja without telling you. Your people say he is counting votes in the House and testing whether the party would survive without you.",
        want: "He wants a guarantee: the next ticket, or a bloc of contracts, or he begins collecting signatures.",
        lens: "executive_power",
        options: [
          {
            label: "Buy him off with contracts",
            cost: "₦900M in state contracts steered to his people",
            benefits: "You, this quarter — the signatures stop",
            pays: "The treasury, and every contractor who bid honestly",
            risk: "Procurement file becomes evidence",
            debt: top.name + " now owns a claim on you",
            record: "Contracts awarded outside competition to a political rival's associates",
            apply: function () {
              mutate({ cor: +0.04, pStab: +8, debt: +0.9 });
              civicAdjust({ legalExposure: 8, evidenceQuality: 6, financialLoss: 0.9, beneficiaryLoyalty: 10, historicalSeverity: 6, concealmentCount: 1 });
              top.ambition = clamp(top.ambition - 30, 0, 100); top.loyalty = clamp(top.loyalty + 15, 0, 100);
              return "The meetings stop. The file does not.";
            },
          },
          {
            label: "Isolate him politically",
            cost: "Two weeks of your own time and political capital",
            benefits: "Your authority, if it works",
            pays: "His constituency, who lose access",
            risk: "If he survives it, he becomes a martyr in the party",
            debt: "The party old guard will remember the humiliation",
            record: "Governor moved against internal opposition",
            apply: function () {
              const ok = Math.random() < (app > 55 ? .65 : .4);
              if (ok) { top.ambition = clamp(top.ambition - 25, 0, 100); mutate({ pStab: +4 }); return "The bloc dissolves. For now."; }
              mutate({ pStab: -9, app: -3 });
              P.factions.party_old.standing = clamp(P.factions.party_old.standing - 12, 0, 100);
              return "It failed. He is stronger than before.";
            },
          },
          {
            label: "Meet him and negotiate openly",
            cost: "You concede two commissioner slots",
            benefits: "Both of you — the party holds",
            pays: "Your independence in cabinet",
            risk: "His people inside your government",
            debt: "Two ministries answer to him first",
            record: "Power-sharing arrangement within the ruling party",
            apply: function () {
              top.ambition = clamp(top.ambition - 18, 0, 100); top.loyalty = clamp(top.loyalty + 20, 0, 100);
              mutate({ pStab: +6 });
              P.factions.party_old.standing = clamp(P.factions.party_old.standing + 10, 0, 100);
              civicAdjust({ politicalProtection: 8 });
              return "A deal. Ordinary politics — with a price.";
            },
          },
        ],
      };
    }

    if (weakest && weakest.standing < 35) {
      return {
        kind: "faction",
        title: weakest.name.toUpperCase() + " TURNS",
        who: weakest.name,
        happening: weakest.name + " has withdrawn from your consultations. They want " + weakest.want + ", and they are being courted by the opposition.",
        want: "A visible concession before the end of the quarter.",
        lens: "accountability",
        options: [
          {
            label: "Give them what they asked for",
            cost: "₦600M reallocated mid-year",
            benefits: weakest.name,
            pays: "Whatever sector the money came from",
            risk: "Every other bloc now knows pressure works",
            debt: "A precedent",
            record: "Mid-year reallocation under organised pressure",
            apply: function () {
              P.factions[weakest.id].standing = clamp(weakest.standing + 25, 0, 100);
              mutate({ app: +3, debt: +0.6 });
              return weakest.name + " stands down.";
            },
          },
          {
            label: "Hold the line, explain publicly",
            cost: "Nothing financial",
            benefits: "The treasury and the budget's integrity",
            pays: weakest.name + ", who get nothing this quarter",
            risk: "Protests, or a working relationship lost",
            debt: "None you can be billed for",
            record: "Governor declined mid-year reallocation and defended the appropriation",
            apply: function () {
              const ok = Math.random() < .5;
              if (ok) { mutate({ app: +2 }); civicAdjust({ remediationCount: 1 }); return "The explanation landed. Barely."; }
              P.factions[weakest.id].standing = clamp(weakest.standing - 10, 0, 100);
              mutate({ app: -4 });
              return "They went to the press instead.";
            },
          },
          {
            label: "Split them — deal with the leadership only",
            cost: "₦150M in 'logistics'",
            benefits: "You, quietly",
            pays: "The members, who were never consulted",
            risk: "If it leaks, the bloc collapses against you",
            debt: "Named individuals now hold receipts",
            record: "Allegations of inducement to bloc leadership",
            apply: function () {
              civicAdjust({ legalExposure: 6, evidenceQuality: 4, publicSuspicion: 5, concealmentCount: 1, historicalSeverity: 4 });
              P.factions[weakest.id].standing = clamp(weakest.standing + 12, 0, 100);
              mutate({ cor: +0.02 });
              return "The leadership went quiet. The members did not.";
            },
          },
        ],
      };
    }

    // The House is now its own system (defections and impeachment in the
    // main game), so the old summons card is retired.
    return null;
    return {
      kind: "institution",
      title: "THE HOUSE ASKS QUESTIONS",
      who: inst.name,
      happening: "A committee of the House has summoned your Commissioner for Finance over last quarter's releases. The chairman is not hostile — yet — but the summons is public.",
      want: "Documents, and a commissioner who shows up.",
      lens: "executive_power",
      options: [
        {
          label: "Send the commissioner with full records",
          cost: "Three days of the ministry's time",
          benefits: "The oversight process, and your credibility",
          pays: "Nobody, unless the records are bad",
          risk: "Anything irregular becomes public",
          debt: "None",
          record: "Executive cooperated with legislative oversight",
          apply: function () {
            P.institutions.house.independence = clamp(inst.independence + 6, 0, 100);
            civicAdjust({ remediationCount: 1, publicSuspicion: -4 });
            mutate({ app: +2, pStab: +2 });
            return "The committee thanked him. The record is clean this time.";
          },
        },
        {
          label: "Call the Speaker and have it withdrawn",
          cost: "A favour owed",
          benefits: "You — the questions stop",
          pays: "The House's own authority",
          risk: "Members resent being overruled",
          debt: "The Speaker will call in the favour",
          record: "Oversight summons withdrawn after executive intervention",
          apply: function () {
            P.institutions.house.independence = clamp(inst.independence - 12, 0, 100);
            civicAdjust({ institutionalDamage: 10, politicalProtection: 6, historicalSeverity: 5 });
            const sp = P.rivals.find(function (r) { return /speaker/i.test(r.role); });
            if (sp) sp.loyalty = clamp(sp.loyalty + 10, 0, 100);
            return "It disappeared from the order paper.";
          },
        },
        {
          label: "Ignore the summons",
          cost: "Nothing now",
          benefits: "Nobody",
          pays: "You, later",
          risk: "Contempt proceedings and a hostile budget season",
          debt: "The House remembers everything at appropriation time",
          record: "Executive ignored a lawful legislative summons",
          apply: function () {
            P.institutions.house.independence = clamp(inst.independence - 4, 0, 100);
            P.institutions.house.pressure = clamp(inst.pressure + 20, 0, 100);
            civicAdjust({ institutionalDamage: 8, publicSuspicion: 8, mediaAttention: 10 });
            mutate({ pStab: -6 });
            return "The chairman gave a press conference instead.";
          },
        },
      ],
    };
  }

  /* ── effects helpers ───────────────────────────────────────────── */
  function mutate(d) {
    const S = window.SOP; if (!S || !S.setS) return;
    S.setS(function (p) {
      const n = Object.assign({}, p);
      if (d.app) n.app = clamp((n.app || 0) + d.app, 0, 100);
      if (d.cor) n.cor = clamp((n.cor || 0) + d.cor, 0, 1);
      if (d.pStab) n.pStab = clamp((n.pStab || 0) + d.pStab, 0, 100);
      if (d.debt) n.debt = Math.max(0, (n.debt || 0) + d.debt);
      return n;
    });
  }
  function civicAdjust(d) { try { window.SOP_CIVIC && window.SOP_CIVIC.adjust(d); } catch (e) {} }
  function ledger(entry) { try { window.SOP_LEDGER && window.SOP_LEDGER.append(entry); } catch (e) {} }

  /* ── the nine-question DecisionCard ────────────────────────────── */
  let cardEl = null;
  function closeCard() { if (cardEl) { cardEl.remove(); cardEl = null; } }

  function renderCard(d, done) {
    closeCard();
    const S = window.SOP;
    cardEl = document.createElement("div");
    cardEl.id = "sop-politics-card";
    cardEl.style.cssText = "position:fixed;inset:0;z-index:11500;background:rgba(18,16,12,.78);display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;";

    const opts = d.options.map(function (o, i) {
      return '' +
        '<button data-i="' + i + '" style="text-align:left;background:#fffcf5;border:1px solid #d4c9a8;border-left:4px solid #2d5a3d;border-radius:10px;padding:10px 14px;cursor:pointer;font-family:inherit;display:block;width:100%">' +
        '<div style="font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:4px">' + o.label + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px 12px;font-size:18px;color:#5a5a4a;line-height:1.35">' +
        '<div><b>Costs</b> ' + o.cost + '</div>' +
        '<div><b>Benefits</b> ' + o.benefits + '</div>' +
        '<div><b>Pays</b> ' + o.pays + '</div>' +
        '<div><b>Risk</b> ' + o.risk + '</div>' +
        '<div><b>Debt</b> ' + o.debt + '</div>' +
        '<div><b>Record</b> ' + o.record + '</div>' +
        '</div></button>';
    }).join("");

    cardEl.innerHTML =
      '<div style="background:#f6f4ef;border:2px solid #d4c9a8;border-radius:14px;max-width:1300px;width:100%;max-height:92%;overflow:auto;padding:16px 20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">' +
      '<div style="font-size:28px;font-weight:800;color:#2d5a3d;letter-spacing:.5px">' + d.title + '</div>' +
      '<div style="font-size:18px;color:#5a5a4a">' + d.who + '</div></div>' +
      '<div style="font-size:24px;color:#1a1a1a;line-height:1.4;margin:8px 0">' + d.happening + '</div>' +
      '<div style="font-size:21px;color:#7a5a20;margin-bottom:10px"><b>What they want:</b> ' + d.want + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' + opts + '</div>' +
      '<div style="margin-top:10px"><button id="sop-pol-lens" style="background:transparent;border:1px solid #2d5a3d;color:#2d5a3d;border-radius:8px;padding:6px 14px;font-size:18px;font-weight:700;cursor:pointer;font-family:inherit">🔎 CIVIC LENS</button></div>' +
      '</div>';

    document.body.appendChild(cardEl);
    cardEl.addEventListener("click", function (e) {
      if (e.target.id === "sop-pol-lens") { try { window.SOP_CIVIC.openLens(d.lens); } catch (er) {} return; }
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      const o = d.options[+b.getAttribute("data-i")];
      let outcome = "";
      try { outcome = o.apply() || ""; } catch (er) { outcome = ""; }
      P.history.push({ turn: (S && S.turn) || 0, title: d.title, who: d.who, choice: o.label, outcome: outcome });
      try { S && S.addL && S.addL(d.title + " — " + o.label + ". " + outcome, "info"); } catch (er) {}
      ledger({
        turn: (S && S.turn) || 0,
        location: "Government House",
        decision: d.title + ": " + o.label,
        outcome: outcome,
        beneficiaries: [o.benefits],
        losers: [o.pays],
        futureRisk: o.risk,
        debtOwed: o.debt,
        relatedEntity: d.who,
        note: o.record,
      });
      showOutcome(d.title, o, outcome, done);
    });
  }

  function showOutcome(title, o, outcome, done) {
    closeCard();
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:11500;background:rgba(18,16,12,.78);display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Plus Jakarta Sans',sans-serif;";
    el.innerHTML =
      '<div style="background:#f6f4ef;border:2px solid #d4c9a8;border-radius:14px;max-width:900px;width:100%;padding:18px 22px">' +
      '<div style="font-size:18px;letter-spacing:2px;color:#5a5a4a">' + title + '</div>' +
      '<div style="font-size:28px;font-weight:800;color:#2d5a3d;margin:4px 0 8px">' + o.label + '</div>' +
      '<div style="font-size:24px;color:#1a1a1a;line-height:1.4">' + (outcome || "It is done.") + '</div>' +
      '<div style="font-size:21px;color:#7a5a20;margin-top:10px"><b>The record will say:</b> ' + o.record + '</div>' +
      '<div style="text-align:right;margin-top:12px"><button id="sop-pol-ok" style="background:#2d5a3d;color:#fff;border:none;border-radius:8px;padding:10px 26px;font-size:21px;font-weight:700;cursor:pointer;font-family:inherit">CONTINUE</button></div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target.id === "sop-pol-ok" || e.target === el) { el.remove(); if (done) done(); }
    });
  }

  /* ── standing panel ────────────────────────────────────────────── */
  function openPanel() {
    syncCast();
    const bar = function (v) { return '<div style="height:6px;background:#e4ddc8;border-radius:4px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:#2d5a3d"></div></div>'; };
    const fac = Object.keys(P.factions).map(function (k) {
      const f = P.factions[k];
      return '<div><div style="font-size:18px;color:#5a5a4a;display:flex;justify-content:space-between"><span>' + f.name + '</span><span>' + Math.round(f.standing) + '</span></div>' + bar(f.standing) + '</div>';
    }).join("");
    const riv = P.rivals.slice().sort(function (a, b) { return b.ambition - a.ambition; }).map(function (r) {
      return '<div style="font-size:18px;color:#1a1a1a">' + r.name + ' — <span style="color:#5a5a4a">' + r.role + '</span> · ambition ' + Math.round(r.ambition) + ' · loyalty ' + Math.round(r.loyalty) + '</div>';
    }).join("");
    const ins = Object.keys(P.institutions).map(function (k) {
      const i = P.institutions[k];
      return '<div style="font-size:18px;color:#1a1a1a">' + i.name + ' — independence ' + Math.round(i.independence) + ' · scrutiny ' + Math.round(i.pressure) + '</div>';
    }).join("");
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:11400;background:rgba(18,16,12,.7);display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;";
    el.innerHTML =
      '<div style="background:#f6f4ef;border:2px solid #d4c9a8;border-radius:14px;max-width:1200px;width:100%;max-height:90%;overflow:auto;padding:16px 20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:28px;font-weight:800;color:#2d5a3d">POLITICAL STANDING</div>' +
      '<button id="sop-pol-x" style="background:#2d5a3d;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:21px;font-weight:700;cursor:pointer;font-family:inherit">CLOSE</button></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px">' +
      '<div><div style="font-size:21px;font-weight:700;margin-bottom:6px">Factions</div><div style="display:grid;gap:6px">' + fac + '</div></div>' +
      '<div><div style="font-size:21px;font-weight:700;margin-bottom:6px">Rivals</div><div style="display:grid;gap:4px">' + riv + '</div>' +
      '<div style="font-size:21px;font-weight:700;margin:12px 0 6px">Institutions</div><div style="display:grid;gap:4px">' + ins + '</div></div>' +
      '</div></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target.id === "sop-pol-x" || e.target === el) el.remove(); });
  }

  /* ── turn hook ─────────────────────────────────────────────────── */
  window.addEventListener("sop-state", function () {
    const S = window.SOP; if (!S) return;
    const turn = S.turn || 0;
    const phase = S.phase;
    if (turn === P.turnSeen) return;
    if (phase !== "budget" && phase !== "policy" && phase !== "main" && phase !== "gov") return;
    P.turnSeen = turn;
    if (turn < 1) return;
    advance(S);
    if (turn % 2 === 0 || Math.random() < .55) {
      const d = buildPressure(S);
      if (!d) return;
      // The same pressure, from the same person, is never put to you twice.
      if (P.history.some(function (h) { return h.title === d.title && h.who === d.who; })) return;
      // Hand the card to the Desk, which shows it with the half-year's other
      // decisions and drops it if a core event already covers the topic.
      if (S.desk && S.desk.offer) {
        S.desk.offer({
          key: "politics:" + d.kind + ":" + turn,
          topic: d.kind === "rival" ? "rivals" : d.kind === "faction" ? "factions" : "house",
          source: "politics",
          title: d.title,
          open: function (done) { renderCard(d, done); },
        });
      } else {
        setTimeout(function () {
          if (document.getElementById("sop-politics-card")) return;
          renderCard(d);
        }, 900);
      }
    }
  });

  window.addEventListener("sop-new-game", seed);

  window.SOP_POLITICS = {
    advance: advance,
    openPanel: openPanel,
    force: function () { const d = buildPressure(window.SOP); if (d) renderCard(d); },
    rivals: function () { return P.rivals.slice(); },
    factions: function () { return JSON.parse(JSON.stringify(P.factions)); },
    institutions: function () { return JSON.parse(JSON.stringify(P.institutions)); },
    serialize: function () { return JSON.parse(JSON.stringify(P)); },
    hydrate: function (d) {
      if (!d) return;
      if (Array.isArray(d.rivals)) P.rivals = d.rivals;
      if (d.factions) P.factions = d.factions;
      if (d.institutions) P.institutions = d.institutions;
      if (Array.isArray(d.history)) P.history = d.history;
      P.turnSeen = typeof d.turnSeen === "number" ? d.turnSeen : -1;
    },
    VERSION: 1,
  };

  console.log("[SOP-Politics] rivals / factions / institutions engine loaded");
})();
