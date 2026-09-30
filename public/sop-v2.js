/* ============================================================================
   SEAT OF POWER — V2 SHELL (First 10 Fixes)
   Single, cohesive layer that unifies UI, ripples consequences, hardens the
   first election, adds a real Tribunal case-builder, rebuilds the Budget
   preview, explains House vetoes, enforces Project lifecycle gates, kills
   duplicate cabinets, gives NPCs memory, and cleans mobile.

   Loaded LAST — it deliberately overrides prior overlays.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__SOP_V2__) return; window.__SOP_V2__ = true;

  const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const mk = (tag, attrs, kids) => {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "style") Object.assign(el.style, attrs[k]);
      else if (k === "html") el.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(k => el.appendChild(typeof k === "string" ? document.createTextNode(k) : k));
    return el;
  };

  const BUS = (window.SOP_BUS = window.SOP_BUS || (() => {
    const listeners = {};
    return {
      on: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
      emit: (ev, data) => (listeners[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.warn("[V2 bus]", ev, e); } }),
    };
  })());

  /* -------------------------------------------------------------------------
     0. Bootstrap — wait for the real game to mount
     ------------------------------------------------------------------------- */
  function whenGame(cb) {
    const t = setInterval(() => {
      if (window.SOP && window.SOP.s && window.SOP.setS) { clearInterval(t); cb(); }
    }, 200);
  }

  /* -------------------------------------------------------------------------
     10. MOBILE CLEANUP — single scroll container, safe-area, kill floaters
     ------------------------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById("sop-v2-style")) return;
    const st = document.createElement("style");
    st.id = "sop-v2-style";
    st.textContent = `
      /* V2 palette */
      :root {
        --v2-ink:#0f2a1e; --v2-bg:#f4efe1; --v2-card:#fffdf5; --v2-bdr:#c9b98b;
        --v2-grn:#0f5132; --v2-red:#8b1a1a; --v2-amb:#a06a00; --v2-blu:#124e6c;
        --v2-shadow:0 6px 22px rgba(15,42,30,.15);
      }
      /* Hide legacy floating rails/widgets so we have ONE surface */
      #sop-deepdive-rail, .sopx-rail, .sopx-widget, .sop-follow-widget,
      .sop-legacy-widget, .sop-legacy-rail, .sop-cohesion-side {
        display:none !important;
      }
      /* Single command bar (desktop + mobile) */
      .v2-bar {
        position:fixed; left: 1; right: 1; bottom: 1; z-index:9500;
        background:linear-gradient(180deg, rgba(15,42,30,.02), var(--v2-card));
        border-top:2px solid var(--v2-ink);
        padding:6px 8px calc(6px + env(safe-area-inset-bottom));
        display:flex; gap: 9px; justify-content:space-between; align-items:center;
        font-family: ui-serif, Georgia, serif;
        box-shadow: 0 -10px 30px rgba(0,0,0,.12);
      }
      .v2-bar button {
        flex:1; min-width: 1; padding: 12px 9px; border-radius: 15px;
        border:1px solid var(--v2-bdr); background:var(--v2-card); color:var(--v2-ink);
        font-size: 34px; font-weight:600; cursor:pointer; line-height: 5;
        display:flex; flex-direction:column; align-items:center; gap: 3px;
      }
      .v2-bar button:hover { background:#fff7d6; }
      .v2-bar .v2-badge {
        display:inline-block; min-width: 24px; padding: 1 6px; border-radius: 12px;
        background:var(--v2-red); color:#fff; font-size: 30px; font-weight:800;
      }
      /* iframe host / body needs bottom padding so bar never eats content */
      body.v2-shell-active { padding-bottom: 68px !important; }
      /* Modal sheet */
      .v2-sheet-bg {
        position:fixed; inset:0; background:rgba(15,42,30,.55); z-index:9700;
        display:flex; align-items:flex-end; justify-content:center;
        animation: v2fade .18s ease-out;
      }
      .v2-sheet {
        width:100%; max-width: 960px; max-height:92vh; overflow-y:auto;
        background:var(--v2-card); border-radius: 27px 27px 0 0;
        border-top:3px solid var(--v2-grn); box-shadow:var(--v2-shadow);
        padding:14px 14px calc(20px + env(safe-area-inset-bottom));
        font-family: ui-serif, Georgia, serif; color:var(--v2-ink);
        animation: v2slide .28s cubic-bezier(.2,.9,.3,1.1);
      }
      @media (min-width: 720px) {
        .v2-sheet-bg { align-items:center; }
        .v2-sheet { max-width: 960px; border-radius: 24px; }
      }
      .v2-sheet h2 { margin: 1 0 9px; font-size: 60px; color:var(--v2-grn); letter-spacing:.02em; }
      .v2-sheet h3 { margin: 18px 0 9px; font-size: 47px; color:var(--v2-ink); text-transform:uppercase; letter-spacing:.08em; opacity:.7; }
      .v2-sheet p { margin: 1 0 12px; font-size: 47px; line-height: 5; }
      .v2-close { position:sticky; top: 1; float:right; background:transparent; border:0; font-size: 34px; cursor:pointer; color:var(--v2-ink); }
      .v2-row { display:flex; gap: 12px; align-items:center; padding: 12px 0; border-bottom:1px dashed var(--v2-bdr); font-size: 40px; }
      .v2-row:last-child { border-bottom: 1; }
      .v2-tag { display:inline-block; padding: 3px 9px; border-radius: 9px; font-size: 34px; font-weight:700; }
      .v2-tag-ok { background:#dff2df; color:var(--v2-grn); }
      .v2-tag-bad { background:#fbe1e1; color:var(--v2-red); }
      .v2-tag-warn { background:#fbecc7; color:var(--v2-amb); }
      .v2-tag-info { background:#dbeaf3; color:var(--v2-blu); }
      .v2-btn { padding: 14px 18px; border-radius: 14px; border:1px solid var(--v2-bdr);
                background:var(--v2-card); color:var(--v2-ink); font-weight:700; font-size: 40px; cursor:pointer; }
      .v2-btn-primary { background:var(--v2-grn); color:#fff; border-color:var(--v2-grn); }
      .v2-btn-danger  { background:var(--v2-red); color:#fff; border-color:var(--v2-red); }
      .v2-btn-warn    { background:var(--v2-amb); color:#fff; border-color:var(--v2-amb); }
      .v2-btn:disabled { opacity:.45; cursor:not-allowed; }
      .v2-grid2 { display:grid; grid-template-columns:1fr 1fr; gap: 12px; }
      @media (max-width:520px){ .v2-grid2 { grid-template-columns:1fr; } }
      .v2-meter { position:relative; height: 12px; border-radius: 6px; background:#e6ddc0; overflow:hidden; }
      .v2-meter > i { display:block; height:100%; background:var(--v2-grn); transition:width .3s; }
      /* Toast */
      .v2-toast-wrap { position:fixed; top: 12px; left: 12px; right: 12px; z-index:9800; display:flex; flex-direction:column; gap: 9px; pointer-events:none; }
      .v2-toast {
        pointer-events:auto; background:var(--v2-ink); color:#fdf7d8;
        padding: 14px 18px; border-radius: 15px; font:600 12px ui-serif,Georgia,serif;
        box-shadow:var(--v2-shadow); animation:v2slide .3s ease-out;
        max-width: 780px; margin: 1 auto; text-align:center;
      }
      .v2-toast.warn { background:var(--v2-amb); }
      .v2-toast.bad  { background:var(--v2-red); }
      .v2-toast.ok   { background:var(--v2-grn); }
      /* Briefing card */
      .v2-brief {
        position:fixed; left: 12px; right: 12px; top: 12px; z-index:9600;
        background:var(--v2-card); border:2px solid var(--v2-grn);
        border-radius: 18px; padding: 18px 21px; box-shadow:var(--v2-shadow);
        max-width: 960px; margin: 1 auto; animation:v2slide .35s ease-out;
      }
      .v2-brief h4 { margin: 1 0 6px; color:var(--v2-grn); font-size: 47px; }
      .v2-brief small { color:var(--v2-ink); opacity:.7; font-size: 34px; letter-spacing:.05em; text-transform:uppercase; }
      .v2-brief ul { margin: 9px 0 0; padding-left: 27px; font-size: 40px; }
      @keyframes v2fade { from{opacity:0} to{opacity:1} }
      @keyframes v2slide { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }
    `;
    document.head.appendChild(st);
    document.body.classList.add("v2-shell-active");
  }

  /* -------------------------------------------------------------------------
     UI PRIMITIVES: toast, modal sheet
     ------------------------------------------------------------------------- */
  const Toast = (() => {
    let wrap;
    return function toast(msg, kind) {
      if (!wrap) { wrap = mk("div", { class: "v2-toast-wrap" }); document.body.appendChild(wrap); }
      const t = mk("div", { class: "v2-toast " + (kind || "") }, [msg]);
      wrap.appendChild(t);
      setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 3400);
    };
  })();

  function openSheet(title, buildBody) {
    // Close any existing
    $$(".v2-sheet-bg").forEach(n => n.remove());
    const bg = mk("div", { class: "v2-sheet-bg" });
    const sheet = mk("div", { class: "v2-sheet" });
    const close = mk("button", { class: "v2-close", onclick: () => bg.remove() }, ["×"]);
    const h2 = mk("h2", null, [title]);
    sheet.appendChild(close); sheet.appendChild(h2);
    const body = mk("div"); sheet.appendChild(body);
    bg.appendChild(sheet);
    on(bg, "click", (e) => { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
    try { buildBody(body, () => bg.remove()); } catch (e) { console.warn("[V2 sheet]", e); body.appendChild(mk("p", null, ["Failed to render — check console."])); }
    return { bg, body, close: () => bg.remove() };
  }
  window.SOP_V2_openSheet = openSheet;
  window.SOP_V2_toast = Toast;

  /* -------------------------------------------------------------------------
     1. UNIFIED SHELL — one bottom command bar
     ------------------------------------------------------------------------- */
  const badges = { agenda: 0, alerts: 0, house: 0, court: 0 };
  function paintBar() {
    const bar = $(".v2-bar"); if (!bar) return;
    $$(".v2-badge", bar).forEach((n, i) => {
      const key = n.dataset.k; const v = badges[key] || 0;
      n.textContent = v; n.style.display = v > 0 ? "inline-block" : "none";
    });
  }
  function buildBar() {
    return; // bottom command bar disabled by user request
    if ($(".v2-bar")) return;

    const bar = mk("div", { class: "v2-bar" });
    const items = [
      { k: "brief",   label: "Briefing",  icon: "📋", act: openBriefing },
      { k: "agenda",  label: "Agenda",    icon: "🗓",  act: openAgenda },
      { k: "budget",  label: "Budget",    icon: "💰", act: openBudget },
      { k: "house",   label: "House",     icon: "🏛",  act: openHouse },
      { k: "court",   label: "Courts",    icon: "⚖️", act: openCourts },
      { k: "cabinet", label: "Cabinet",   icon: "👥", act: openCabinet },
      { k: "proj",    label: "Projects",  icon: "🏗",  act: openProjects },
      { k: "wiki",    label: "Wiki",      icon: "📖", act: openWiki },
    ];
    items.forEach(it => {
      const btn = mk("button", { onclick: it.act, title: it.label },
        [mk("span", { style:{fontSize: "58px", lineHeight:"1"} }, [it.icon]),
         mk("span", null, [it.label])]);
      if (["agenda","house","court"].includes(it.k)) {
        const b = mk("span", { class: "v2-badge", "data-k": it.k, style:{display:"none",position:"absolute",top: "14px",right: "22px"} }, ["0"]);
        btn.style.position = "relative"; btn.appendChild(b);
      }
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
    paintBar();
  }

  /* -------------------------------------------------------------------------
     9. NPC MEMORY — persistent grudge/loyalty tracker
     ------------------------------------------------------------------------- */
  const MEM = window.SOP_MEM = window.SOP_MEM || {
    npc: {},  // { name: { grudge, loyalty, lastAct, notes:[] } }
    remember: function (name, delta, note) {
      const n = this.npc[name] || (this.npc[name] = { grudge:0, loyalty:0, notes:[] });
      if (typeof delta === "number") { n.grudge += (delta<0? -delta:0); n.loyalty += (delta>0? delta:0); }
      if (note) { n.notes.unshift({ t: window.SOP.turn, note }); n.notes = n.notes.slice(0,8); }
      n.lastAct = window.SOP.turn;
    },
    all: function () { return this.npc; },
  };

  /* -------------------------------------------------------------------------
     2. CONSEQUENCE ENGINE — ripples every meaningful action
     ------------------------------------------------------------------------- */
  const CE = {
    // Nudge multiple stats/factions in one shot with narrative log
    apply: function (patch, narrative) {
      window.SOP.setS(p => {
        const n = { ...p };
        for (const k in patch.s || {}) {
          if (k === "app" || k === "pStab") n[k] = cl((n[k]||0) + patch.s[k], 0, 100);
          else if (k === "cor") n.cor = cl((n.cor||0) + patch.s[k], 0, 1);
          else if (["sec","infra","hp","lit"].includes(k)) n[k] = cl((n[k]||0) + patch.s[k], 0, 1);
          else if (k === "igr" || k === "faac" || k === "debt") n[k] = Math.max(0, (n[k]||0) + patch.s[k]);
          else n[k] = (n[k]||0) + patch.s[k];
        }
        return n;
      });
      if (patch.sk && window.SOP.setSkApp) {
        window.SOP.setSkApp(p => {
          const n = { ...p };
          for (const k in patch.sk) n[k] = cl((n[k]||50) + patch.sk[k], 0, 100);
          return n;
        });
      }
      if (narrative) Toast(narrative, patch.kind || "");
      BUS.emit("consequence", { patch, narrative });
    },
  };
  window.SOP_V2_CE = CE;

  // Wire external systems into ripples
  BUS.on("project:awarded", (p) => {
    const nep = p && p.nepotism ? 0.04 : 0;
    CE.apply({ s: { cor: nep }, sk: { business: nep ? -3 : 3 } },
      nep ? `Contract for ${p.name} awarded to a crony (+corruption)` : `Contract for ${p.name} awarded via open bid`);
    if (nep) MEM.remember("Public Procurement Auditor", -3, `Flagged ${p.name} — no competition`);
    // Wiki
    try {
      if (window.SOP.setWikiEvents) window.SOP.setWikiEvents(pw => [...(pw||[]),
        { t: window.SOP.turn, tx: `Contract awarded: ${p.name} — ${p.method||"single-source"}${nep? " (family/friends flag)":""}` }]);
    } catch (e) {}
  });
  BUS.on("project:completed", (p) => {
    CE.apply({ s: { app: 3, infra: 0.02 } }, `${p.name} delivered — public approval up`);
    try {
      if (window.SOP.setWikiEvents) window.SOP.setWikiEvents(pw => [...(pw||[]),
        { t: window.SOP.turn, tx: `Delivered project: ${p.name}` }]);
    } catch(e){}
  });
  BUS.on("project:stalled", (p) => {
    CE.apply({ s: { app: -2 }, sk: { media: -4 } }, `${p.name} stalled — media noticed`, "warn");
  });
  BUS.on("house:blocked", (bill) => {
    const reason = bill && bill.reason
      ? bill.reason
      : bill && bill.reasons && bill.reasons[0]
        ? bill.reasons[0].txt
        : "open the House panel for the defect list";
    Toast(`House blocked ${bill.title}. Reason: ${reason}`, "warn");
  });

  /* -------------------------------------------------------------------------
     5. BUDGET — plain-language sheet with LIVE impact preview
     ------------------------------------------------------------------------- */
  const BUDGET_LINES = [
    { k:"salaries",   label:"Civil Service Salaries", buys:"Wages for 45,000 workers — teachers, nurses, police auxiliaries.", healthy:[25,35], under:"Salary arrears → NLC strike within 2 turns.", over:"Wage bill crowds out capital projects." },
    { k:"health",     label:"Health", buys:"Doctor allowances, drugs, PHC upgrades, vaccine cold-chain.", healthy:[8,15], under:"Drug stockouts, cholera outbreak risk.", over:"World Bank praise, opposition calls it waste." },
    { k:"education",  label:"Education", buys:"Teacher salaries top-up, textbooks, TETFund co-payment.", healthy:[10,18], under:"Exam boycotts, ASUU friction.", over:"Great optics, weak short-term ROI." },
    { k:"security",   label:"Security Vote", buys:"Amotekun/Vigilante grants, patrol vehicles, informant fees.", healthy:[8,14], under:"Bandit escalation, kidnaps rise.", over:"EFCC will ask uncomfortable questions." },
    { k:"infra",      label:"Infrastructure & Roads", buys:"Road rehab, bridges, drainage, street-lights.", healthy:[15,22], under:"Flooding losses, project abandonment.", over:"Contractor cartels rejoice." },
    { k:"agric",      label:"Agriculture", buys:"Fertiliser subsidy, extension officers, seed multiplication.", healthy:[4,8], under:"Food-price inflation drives youth anger.", over:"Ghost farmer scandals." },
    { k:"admin",      label:"Govt House / SA Office", buys:"Governor's office, protocol, media unit, SA salaries.", healthy:[2,5], under:"Machinery breaks, comms weak.", over:"Papers call you Louis XIV." },
  ];
  function openBudget(preset) {
    openSheet("Appropriation Bill — Plain English", (body, close) => {
      const s = window.SOP.s;
      const pot = Math.max(20, Math.round(((s.igr||0)*4 + (s.faac||0)*4) * 10) / 10);
      body.appendChild(mk("p", null, [`Your team estimates ₦${pot}B for the year. Drag each slider to set how much of that pot goes where. Preview shows what changes next quarter.`]));

      const st = (window.SOP._v2Budget = window.SOP._v2Budget || Object.fromEntries(BUDGET_LINES.map(b => [b.k, Math.round(((b.healthy[0]+b.healthy[1])/2))])));
      const wrap = mk("div"); body.appendChild(wrap);

      function renderPreview() {
        let allocated = 0, warnings = [], predicted = { app:0, sec:0, hp:0, lit:0, infra:0, cor:0 };
        BUDGET_LINES.forEach(b => {
          const v = st[b.k]; allocated += v;
          if (v < b.healthy[0]) {
            warnings.push({ t: "bad", txt: `${b.label} UNDERFUNDED (${v}%): ${b.under}` });
            if (b.k === "salaries") predicted.app -= 6;
            if (b.k === "health") predicted.hp -= 0.04;
            if (b.k === "education") predicted.lit -= 0.03;
            if (b.k === "security") predicted.sec -= 0.04;
            if (b.k === "infra") predicted.infra -= 0.03;
          } else if (v > b.healthy[1]) {
            warnings.push({ t: "warn", txt: `${b.label} EXCESSIVE (${v}%): ${b.over}` });
            if (b.k === "security" || b.k === "admin") predicted.cor += 0.02;
          } else {
            if (b.k === "health") predicted.hp += 0.02;
            if (b.k === "education") predicted.lit += 0.02;
            if (b.k === "security") predicted.sec += 0.02;
            if (b.k === "infra") predicted.infra += 0.02;
            if (b.k === "salaries") predicted.app += 2;
          }
        });
        return { allocated, warnings, predicted };
      }

      function draw() {
        wrap.innerHTML = "";
        const hdr = mk("div", { style:{background:"#fffdf5",padding: "36px",borderRadius: "36px",border:"1px solid var(--v2-bdr)",marginBottom: "36px"} });
        wrap.appendChild(hdr);
        BUDGET_LINES.forEach(b => {
          const row = mk("div", { style:{padding: "29px 0", borderBottom:"1px dashed var(--v2-bdr)"} });
          const label = mk("div", { style:{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize: "43px"} },
            [mk("span", null, [b.label]), mk("span", null, [st[b.k] + "%"])]);
          const buys = mk("div", { style:{fontSize: "38px",opacity:.75,margin: "7px 0 14px"} }, ["Buys: " + b.buys]);
          const rng = mk("input", { type:"range", min:"0", max:"50", value:String(st[b.k]),
            style:{width:"100%"}, oninput: (e) => { st[b.k] = +e.target.value; draw(); } });
          const marks = mk("div", { style:{display:"flex",justifyContent:"space-between",fontSize: "34px",opacity:.6} },
            [mk("span", null, [`healthy ${b.healthy[0]}%`]),
             mk("span", null, [`${b.healthy[1]}%`])]);
          row.appendChild(label); row.appendChild(buys); row.appendChild(rng); row.appendChild(marks);
          wrap.appendChild(row);
        });
        const pv = renderPreview();
        hdr.innerHTML = "";
        hdr.appendChild(mk("div", { style:{display:"flex",justifyContent:"space-between",fontSize: "43px",fontWeight:700} },
          [mk("span", null, [`Pot: ₦${pot}B`]),
           mk("span", { style:{color: pv.allocated===100? "var(--v2-grn)" : pv.allocated>100? "var(--v2-red)":"var(--v2-amb)"} },
              [`Allocated ${pv.allocated}% / Remaining ${100-pv.allocated}%`])]));
        hdr.appendChild(mk("div", { style:{marginTop: "22px",fontSize: "38px",opacity:.8} }, ["Next quarter preview:"]));
        const dl = mk("div", { style:{display:"flex",flexWrap:"wrap",gap: "22px",marginTop: "14px"} });
        [["Approval", pv.predicted.app, "pt"],["Health", pv.predicted.hp*100, "pt"],
         ["Education", pv.predicted.lit*100, "pt"],["Security", pv.predicted.sec*100, "pt"],
         ["Infra", pv.predicted.infra*100, "pt"],["Corruption", pv.predicted.cor*100, "pt"]]
        .forEach(([lb, v]) => {
          if (Math.abs(v) < 0.01) return;
          const good = (lb==="Corruption")? v<0 : v>0;
          dl.appendChild(mk("span", { class: "v2-tag " + (good? "v2-tag-ok":"v2-tag-bad") },
            [`${lb} ${v>0?"+":""}${v.toFixed(1)}`]));
        });
        hdr.appendChild(dl);
        pv.warnings.slice(0,5).forEach(w =>
          hdr.appendChild(mk("div", { style:{marginTop: "14px",fontSize: "38px",color: w.t==="bad"?"var(--v2-red)":"var(--v2-amb)"} }, ["⚠ " + w.txt])));

        // Templates
        const tpl = mk("div", { style:{display:"flex",gap: "22px",flexWrap:"wrap",margin: "29px 0"} });
        [["Balanced",  {salaries:30,health:14,education:15,security:10,infra:18,agric:6,admin:3}],
         ["Reformer",  {salaries:28,health:18,education:18,security:8,infra:16,agric:7,admin:2}],
         ["Populist",  {salaries:35,health:10,education:12,security:12,infra:16,agric:5,admin:5}],
         ["Godfather", {salaries:22,health:8,education:9,security:14,infra:25,agric:4,admin:8}]]
        .forEach(([nm, cfg]) => {
          tpl.appendChild(mk("button", { class:"v2-btn", onclick: () => { Object.assign(st, cfg); draw(); } }, [nm]));
        });
        wrap.appendChild(tpl);

        // Submit
        const submit = mk("button", { class:"v2-btn v2-btn-primary", style:{width:"100%",marginTop: "22px"},
          onclick: () => {
            if (pv.allocated > 100) return Toast("You cannot allocate more than 100%.", "bad");
            CE.apply({ s: pv.predicted }, "Appropriation Bill submitted");

            // Build a concrete, human consequence chain
            const p = pv.predicted;
            const chain = [];
            if (Math.abs(p.app) >= 2) chain.push(`Approval ${p.app>0?"+":""}${p.app.toFixed(0)}pt`);
            if (Math.abs(p.hp*100) >= 1) chain.push(`Health ${p.hp>0?"+":""}${(p.hp*100).toFixed(0)}pt`);
            if (Math.abs(p.lit*100) >= 1) chain.push(`Education ${p.lit>0?"+":""}${(p.lit*100).toFixed(0)}pt`);
            if (Math.abs(p.sec*100) >= 1) chain.push(`Security ${p.sec>0?"+":""}${(p.sec*100).toFixed(0)}pt`);
            if (Math.abs(p.infra*100) >= 1) chain.push(`Infra ${p.infra>0?"+":""}${(p.infra*100).toFixed(0)}pt`);
            if (p.cor*100 >= 1) chain.push(`Corruption +${(p.cor*100).toFixed(0)}pt (EFCC watching)`);

            const under = pv.warnings.filter(w=>w.t==="bad").map(w=>w.txt.split(" ")[0]);
            const over  = pv.warnings.filter(w=>w.t==="warn").map(w=>w.txt.split(" ")[0]);
            let character = "balanced";
            if (over.includes("Security") || over.includes("Govt")) character = "patronage-heavy";
            else if (under.includes("Education") || under.includes("Health")) character = "austerity";
            else if (p.lit>0 && p.hp>0 && p.cor<=0) character = "reformist";

            const wikiLine = `Submitted a ${character} Appropriation Bill (Q${window.SOP.turn}). ` +
              (under.length? `Underfunded: ${under.join(", ")}. ` : "") +
              (over.length? `Bloated: ${over.join(", ")}. ` : "") +
              (chain.length? `Forecast: ${chain.slice(0,3).join("; ")}.` : "");
            if (window.SOP.setWikiEvents) window.SOP.setWikiEvents(w => [{
              turn: window.SOP.turn,
              section: (character==="patronage-heavy" || under.length>=2) ? "Controversies" : "Fiscal Policy",
              txt: wikiLine
            }, ...(w||[])]);
            // Ledger: character stamp + one padding entry per bloated line
            try {
              window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"budget_character", gravity: character==="patronage-heavy"?4:character==="reformist"?1:2, evidence:3, corruptionDelta: (p.cor*100)|0, approvalDelta: p.app|0, note:`${character} Appropriation Bill filed`, meta:{ character, under, over }});
              (over||[]).forEach(sector => window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"budget_padding", target: sector, gravity:3, evidence:4, note:`Bloated envelope: ${sector}`, meta:{ sector, character }}));
            } catch(e){}

            const saMsg = chain.length
              ? `SA: Bill filed. Expect ${chain.slice(0,2).join(" and ")}.` +
                (under.length? ` ${under[0]} ministry will complain publicly.` : "") +
                (over.length? ` House will demand line-items on ${over[0]}.` : "")
              : "SA: Bill filed. Nothing dramatic — House likely to pass on first reading.";
            Toast(saMsg, over.length||under.length?"bad":"ok");

            badges.house = Math.max(0, badges.house - 1); paintBar();
            close();
            setTimeout(() => scheduleHouseReview(st, pv), 500);
          } }, ["Submit to House of Assembly"]);
        wrap.appendChild(submit);
      }
      draw();
    });
  }
  window.SOP_V2_openBudget = openBudget;

  /* -------------------------------------------------------------------------
     6. HOUSE / BILLS — reasons + veto + sue
     ------------------------------------------------------------------------- */
  const HOUSE = window.SOP_V2_HOUSE = window.SOP_V2_HOUSE || { pending: [], mood: 50 };
  function scheduleHouseReview(alloc, pv) {
    // Build CONCRETE reasons only. If nothing is objectively wrong, the House will not block.
    // No more frivolous "godfather wants project for his zone" fallback.
    const reasons = [];
    if (alloc.security > 22) reasons.push({ txt: "Security Vote fattened to " + alloc.security + "% — Speaker demands line-item disclosure (S.121(3))", severity: "high", fix: "Cut Security to ≤20% or publish a classified sub-vote schedule." });
    if (alloc.admin > 8) reasons.push({ txt: "Govt House / admin overhead at " + alloc.admin + "% — exceeds fiscal responsibility norms", severity: "med", fix: "Trim admin to ≤7% (SGF circular 2019)." });
    if (alloc.education < 8) reasons.push({ txt: "Education at " + alloc.education + "% — well below UNESCO floor; teachers' union threatens strike", severity: "high", fix: "Raise Education to ≥10%." });
    if (alloc.health < 6) reasons.push({ txt: "Health at " + alloc.health + "% — below Abuja Declaration target; PHCs will run out of drugs", severity: "med", fix: "Raise Health to ≥8%." });
    if (alloc.salaries < 18) reasons.push({ txt: "Salaries at " + alloc.salaries + "% — arrears likely; labour caucus in the House will revolt", severity: "high", fix: "Raise Salaries to ≥22% (approx. wage bill floor)." });
    const pStab = window.SOP.s.pStab || 50;
    const cor = window.SOP.s.cor || 0;
    if (cor > 0.7) reasons.push({ txt: "Rising corruption index (" + Math.round(cor*100) + "%) — House demands an anti-graft rider before assent", severity: "med", fix: "Publish EFCC MoU or accept oversight amendment." });
    if (pStab < 25) reasons.push({ txt: "Party stability at " + pStab + "% — your own caucus is withholding assent as leverage", severity: "med", fix: "Meet the Speaker; concede one appointment slot." });

    // Only HIGH-severity defects block passage. Med-only concerns become advisory toasts.
    const hardBlockers = reasons.filter(r => r.severity === "high");
    if (!hardBlockers.length) {
      if (reasons.length) {
        Toast("House passed the Bill with observations: " + reasons[0].txt.split(" — ")[0], "ok");
      } else {
        Toast("House passed your Appropriation Bill on first reading — no valid objections.", "ok");
      }
      return;
    }
    const bill = { title: "Appropriation Bill " + new Date().getFullYear(), reasons: hardBlockers, alloc, filedTurn: window.SOP.turn };
    HOUSE.pending.push(bill);
    badges.house = HOUSE.pending.length; paintBar();
    BUS.emit("house:blocked", bill);
  }
  function openHouse() {
    openSheet("House of Assembly", (body) => {
      body.appendChild(mk("p", { style:{margin: "0 0 22px",fontSize: "43px",lineHeight:"1.5"} }, ["The 24-member House can amend, delay, or reject your bills (S.100, 1999 Constitution). The Speaker will only block for CONCRETE reasons — every objection below cites a specific defect. Fix it, negotiate, veto with consequences, or sue for constitutional interpretation."]));
      if (!HOUSE.pending.length) {
        body.appendChild(mk("p", { style:{opacity:.7} }, ["No pending disputes. Submit a Budget or wait for a Bill from the House."]));
      }
      HOUSE.pending.forEach((b, i) => {
        const card = mk("div", { style:{border:"1px solid var(--v2-bdr)",borderRadius: "36px",padding: "36px",margin: "29px 0",background:"#fffdf5"} });
        card.appendChild(mk("h3", { style:{margin: "0 0 14px"} }, [b.title]));
        card.appendChild(mk("div", { style:{fontSize: "38px",color:"#666",marginBottom: "22px"} }, ["Filed turn " + (b.filedTurn||"—") + " · " + b.reasons.length + " concrete objection" + (b.reasons.length===1?"":"s")]));
        b.reasons.forEach(r => {
          const row = mk("div", { style:{border:"1px solid #eadfc7",background:"#fff",borderRadius: "22px",padding: "22px 29px",margin: "14px 0"} });
          const sev = r.severity === "high" ? "#c33" : "#c88a1a";
          row.appendChild(mk("div", { style:{fontSize: "43px",fontWeight:700,color:sev} }, ["⚠ " + r.txt]));
          if (r.fix) row.appendChild(mk("div", { style:{fontSize: "38px",color:"#555",marginTop: "7px"} }, ["Fix: " + r.fix]));
          card.appendChild(row);
        });
        const row = mk("div", { style:{display:"flex",gap: "22px",flexWrap:"wrap",marginTop: "29px"} });
        row.appendChild(mk("button", { class:"v2-btn", onclick: () => {
          CE.apply({ s: { pStab: -4, cor: 0.02 }, sk: { party: 5 } }, "Negotiated — padding added, House placated");
          HOUSE.pending.splice(i,1); badges.house = HOUSE.pending.length; paintBar(); openHouse();
        }}, ["🤝 Negotiate (add padding)"]));
        row.appendChild(mk("button", { class:"v2-btn v2-btn-warn", onclick: () => {
          CE.apply({ s: { app: -3 }, sk: { media: 4, party: -6 } }, "You vetoed the House amendments");
          const overrideChance = cl(0.15 + (50 - (window.SOP.s.pStab||50))/100, 0.05, 0.75);
          if (Math.random() < overrideChance) {
            CE.apply({ s: { app: -6, pStab: -8 } }, "House overrode your veto — humiliating");
          } else {
            CE.apply({ sk: { media: 3 } }, "Veto stands — bill dies");
          }
          HOUSE.pending.splice(i,1); badges.house = HOUSE.pending.length; paintBar(); openHouse();
        }}, ["✋ Veto"]));
        // Force-through only if governor has a genuine mandate (approval ≥55 or pStab ≥65)
        const app = window.SOP.s.app || 0, pStab = window.SOP.s.pStab || 0;
        const canForce = app >= 55 || pStab >= 65;
        if (canForce) {
          row.appendChild(mk("button", { class:"v2-btn", style:"background:#8b0000;color:#fff", onclick: () => {
            CE.apply({ s: { app: -2, pStab: -6, cor: 0.03 }, sk: { party: -8, media: -5 } }, "Forced Appropriation Bill through — you invoked S.121 emergency spending");
            HOUSE.pending.splice(i,1); badges.house = HOUSE.pending.length; paintBar(); openHouse();
          }}, ["⚡ Force Through (mandate: " + Math.max(app,pStab) + ")"]));
        } else {
          row.appendChild(mk("span", { style:"font-size: 34px;color:#a55;align-self:center;padding: 1 6px" }, ["Force Through locked — need Approval ≥55 or pStab ≥65"]));
        }
        row.appendChild(mk("button", { class:"v2-btn v2-btn-danger", onclick: () => {
          COURTS.pending.push({ id:"assembly-suit-"+Date.now(), title:"Executive v. House (Assembly Deadlock)", reason:"Disputed passage of "+b.title, statute:"S.121 / S.100", severity:"high" });
          badges.court = COURTS.pending.length; paintBar();
          HOUSE.pending.splice(i,1); badges.house = HOUSE.pending.length; paintBar();
          openHouse();
          Toast("Suit filed at the State High Court", "warn");
        }}, ["⚖️ Sue the House"]));
        card.appendChild(row);
        body.appendChild(card);
      });
    });
  }


  /* -------------------------------------------------------------------------
     4. TRIBUNAL / COURTS — case-builder with EVIDENCE strength
     ------------------------------------------------------------------------- */
  const COURTS = window.SOP_V2_COURTS = window.SOP_V2_COURTS || { pending: [], tribunal: null };
  function evidenceScore() {
    // Build strength from real game state
    const s = window.SOP.s;
    const items = [];
    let score = 20;
    if ((s.app||0) > 55) { score += 15; items.push({ ok:true, txt:"Public approval > 55% — strong mandate optics" }); }
    else items.push({ ok:false, txt:"Low approval undermines a 'stolen mandate' claim" });
    if ((s.cor||0) < 0.25) { score += 15; items.push({ ok:true, txt:"Low corruption index — clean-hands doctrine" }); }
    else items.push({ ok:false, txt:"High corruption index — court skeptical of your motives" });
    const projs = (window.SOP.projects||[]).filter(p => p.stage==="delivered").length;
    if (projs >= 3) { score += 10; items.push({ ok:true, txt:`${projs} delivered projects — visible performance` }); }
    if ((window.SOP.pStab||s.pStab||50) > 55) { score += 8; items.push({ ok:true, txt:"Party unity solid — witnesses will show up" }); }
    else items.push({ ok:false, txt:"Party fractured — key witnesses may sabotage" });
    // Ledger-derived evidence (shim consumer, READ-ONLY — never mutates state).
    try {
      const led = window.SOP_LEDGER && window.SOP_LEDGER.tribunalStrength();
      if (led) { score += led.delta; led.items.forEach(i => items.push(i)); }
    } catch(e){}
    return { score: cl(score, 5, 90), items };
  }
  function openCourts() {
    openSheet("Courts & Tribunal", (body) => {
      body.appendChild(mk("p", null, ["This is one desk: pending rulings, injunctions, and any election tribunal case appear here."]));
      if (!COURTS.pending.length && !COURTS.tribunal) {
        body.appendChild(mk("p", { style:{opacity:.7} }, ["Docket is clear."]));
      }
      COURTS.pending.forEach((c, i) => {
        const card = mk("div", { style:{border:"1px solid var(--v2-bdr)",borderRadius: "36px",padding: "36px",margin: "29px 0",background:"#fffdf5"} });
        card.appendChild(mk("h3", null, [c.title]));
        card.appendChild(mk("p", null, [c.reason]));
        if (c.statute) card.appendChild(mk("p", { style:{fontSize: "38px",opacity:.7} }, ["Statute: " + c.statute]));
        const row = mk("div", { style:{display:"flex",gap: "22px",flexWrap:"wrap"} });
        row.appendChild(mk("button", { class:"v2-btn", onclick: () => { CE.apply({ s:{app:2}, sk:{media:4} }, "Complied with ruling"); COURTS.pending.splice(i,1); badges.court=COURTS.pending.length; paintBar(); openCourts(); } }, ["✅ Comply"]));
        row.appendChild(mk("button", { class:"v2-btn v2-btn-warn", onclick: () => { CE.apply({ s:{cor:0.02, app:-2} }, "Appeal filed — delay bought"); COURTS.pending.splice(i,1); badges.court=COURTS.pending.length; paintBar(); openCourts(); } }, ["⏸ Appeal & delay"]));
        row.appendChild(mk("button", { class:"v2-btn v2-btn-danger", onclick: () => {
          CE.apply({ s:{app:-6}, sk:{media:-8, party:-4} }, "Defiance recorded — contempt registered", "bad");
          if (window.SOPX && window.SOPX.Judiciary) window.SOPX.Judiciary.contemptLevel = ((window.SOPX.Judiciary.contemptLevel)||0) + 1;
          COURTS.pending.splice(i,1); badges.court=COURTS.pending.length; paintBar(); openCourts();
        } }, ["⚔️ Defy"]));
        card.appendChild(row);
        body.appendChild(card);
      });
      // Tribunal case builder — always available if lost or is second-term prep
      body.appendChild(mk("h3", null, ["Election Tribunal — Case Builder"]));
      body.appendChild(mk("p", null, ["Whether you plan to file (or defend) an election petition, the case rests on evidence you build IN OFFICE. Here is what the bench will weigh:"]));
      const ev = evidenceScore();
      const meter = mk("div", { class:"v2-meter" }); const bar = mk("i", { style:{width: ev.score + "%"} }); meter.appendChild(bar); body.appendChild(meter);
      body.appendChild(mk("div", { style:{fontSize: "43px",fontWeight:700,marginTop: "14px"} }, [`Case strength: ${ev.score}%`]));
      ev.items.forEach(it => body.appendChild(mk("div", { style:{padding: "14px 0",fontSize: "43px",color: it.ok? "var(--v2-grn)":"var(--v2-red)"} }, [(it.ok?"✔ ":"✘ ") + it.txt])));
      body.appendChild(mk("p", { style:{fontSize: "38px",opacity:.7,marginTop: "22px"} }, ["Strength above 55% at tribunal → likely win. Above 70% survives to Appeal. Above 80% could reach Supreme Court reinstatement."]));
    });
  }

  /* -------------------------------------------------------------------------
     3. FIRST ELECTION OVERHAUL — bring second-term teeth to term-1 too
     ------------------------------------------------------------------------- */
  // Difficulty toggles the *setup* wizard doesn't currently apply for term 1.
  // We patch the campaign panel when it appears to expose "Drop out / Run anyway / Petition tribunal".
  function firstElectionPatch() {
    // Removed: the in-game campaign screen now owns Drop-out / Run-anyway /
    // Petition-tribunal actions natively. Purge any stale injected panels.
    function purge() {
      $$(".v2-elec-panel").forEach(n => n.remove());
      $$("[data-v2-elec]").forEach(n => { delete n.dataset.v2Elec; });
    }
    purge();
    setInterval(purge, 2000);
  }


  /* -------------------------------------------------------------------------
     7. PROJECT LIFECYCLE — enforce gates + expose in one place
     ------------------------------------------------------------------------- */
  function openProjects() {
    const projects = (window.SOP.projects || []);
    openSheet("Projects & Procurement", (body) => {
      if (!projects.length) return body.appendChild(mk("p", null, ["No projects started yet. Initiate via the Projects tab in-game."]));
      body.appendChild(mk("p", null, ["Every project must pass 4 gates: NEED → EIA → BID → AWARD → BUILD → DELIVER. Skip a gate and it will stall."]));
      projects.forEach(p => {
        const card = mk("div", { style:{border:"1px solid var(--v2-bdr)",borderRadius: "36px",padding: "36px",margin: "29px 0",background:"#fffdf5"} });
        card.appendChild(mk("h3", null, [p.name || p.nm || "Untitled project"]));
        card.appendChild(mk("div", { style:{fontSize: "38px",opacity:.7} }, ["Stage: " + (p.stage||"planning") + " · Sector: " + (p.sector||p.s||"—")]));
        if (p.nepotism) card.appendChild(mk("span", { class:"v2-tag v2-tag-bad" }, ["⚑ Nepotism flag"]));
        body.appendChild(card);
      });
    });
  }
  // Enforce stall on underfunded sector (already emitted by budget)
  BUS.on("consequence", (e) => {
    if (!e || !e.patch || !e.patch.s) return;
    const projs = window.SOP.projects || [];
    projs.forEach(p => {
      const dropped = ["infra","hp","lit","sec"].some(k => (e.patch.s[k]||0) < -0.03);
      if (dropped && p.stage === "construction" && Math.random() < 0.25) {
        p.stage = "stalled";
        BUS.emit("project:stalled", p);
      }
    });
  });

  /* -------------------------------------------------------------------------
     8. CABINET UNIFICATION — one entry point that opens the real Cabinet tab
     ------------------------------------------------------------------------- */
  function openCabinet() {
    // If the in-game cabinet tab exists, jump to it; else render a summary
    const navBtn = $$("[data-sop-nav] button").find(b => /cabinet/i.test(b.textContent||""));
    if (navBtn) { navBtn.click(); Toast("Opened Cabinet tab", "info"); return; }
    openSheet("Cabinet", (body) => {
      const list = window.SOP.ministries || [];
      if (!list.length) return body.appendChild(mk("p", null, ["You haven't convened any ministries yet. Create them in the Cabinet tab."]));
      list.forEach(m => body.appendChild(mk("div", { class:"v2-row" },
        [mk("strong", null, [m.nm || m.name || "Ministry"]),
         mk("span", { style:{marginLeft: "auto",fontSize: "38px",opacity:.7} }, [(m.minister||m.head||"vacant")])])));
    });
  }

  /* -------------------------------------------------------------------------
     Briefing, Agenda, Wiki — small unified sheets
     ------------------------------------------------------------------------- */
  function openBriefing() {
    openSheet("Turn Briefing", (body) => {
      const s = window.SOP.s;
      body.appendChild(mk("p", null, [`Q${window.SOP.turn||1} — ${window.SOP.state||""}`]));
      body.appendChild(mk("h3", null, ["Key numbers"]));
      body.appendChild(mk("div", { class:"v2-row" }, [mk("span",null,["Approval"]), mk("span", { style:{marginLeft: "auto"} }, [(s.app||0).toFixed(0)+"%"])]));
      body.appendChild(mk("div", { class:"v2-row" }, [mk("span",null,["Corruption Index"]), mk("span", { style:{marginLeft: "auto"} }, [Math.round((s.cor||0)*100)+"%"])]));
      body.appendChild(mk("div", { class:"v2-row" }, [mk("span",null,["IGR (₦B/qtr)"]), mk("span", { style:{marginLeft: "auto"} }, [(s.igr||0).toFixed(1)])]));
      body.appendChild(mk("div", { class:"v2-row" }, [mk("span",null,["Party Stability"]), mk("span", { style:{marginLeft: "auto"} }, [(s.pStab||0).toFixed(0)])]));
      body.appendChild(mk("h3", null, ["What's on your desk"]));
      const items = [];
      if (HOUSE.pending.length) items.push(`House: ${HOUSE.pending.length} disputed bill(s)`);
      if (COURTS.pending.length) items.push(`Courts: ${COURTS.pending.length} pending ruling(s)`);
      if (!items.length) items.push("Nothing urgent. Consider a project, a bill, or a tour.");
      items.forEach(t => body.appendChild(mk("div", { style:{fontSize: "43px",padding: "14px 0"} }, ["• " + t])));
    });
  }
  function openAgenda() {
    openSheet("Turn Agenda", (body) => {
      const tasks = [
        { done: HOUSE.pending.length === 0, txt: "Resolve House disputes" },
        { done: COURTS.pending.length === 0, txt: "Handle pending court matters" },
        { done: (window.SOP.projects||[]).some(p => p.stage==="planning"||p.stage==="delivered"), txt: "Move a project through a gate" },
        { done: false, txt: "Meet a stakeholder (Godfather / Speaker / CJ)" },
      ];
      tasks.forEach(t => body.appendChild(mk("div", { class:"v2-row" },
        [mk("span", null, [t.done?"✅ ":"⬜ "]),
         mk("span", null, [t.txt])])));
      body.appendChild(mk("p", { style:{fontSize: "38px",opacity:.7,marginTop: "29px"} }, ["Ending a turn with ⬜ items forfeits soft consequences (approval drift, media snark)."]));
    });
  }
  function openWiki() {
    const nav = $$("[data-sop-nav] button").find(b => /bio|wiki/i.test(b.textContent||""));
    if (nav) { nav.click(); Toast("Opened Wikipedia tab", "info"); return; }
    openSheet("Wikipedia — Governor's Bio", (body) => {
      const events = window.SOP.wikiEvents || [];
      if (!events.length) return body.appendChild(mk("p", null, ["No entries yet."]));
      events.slice().reverse().slice(0,40).forEach(e => body.appendChild(mk("div", { class:"v2-row" },
        [mk("span", { style:{fontSize: "38px",opacity:.6,minWidth: "120px"} }, ["Q"+(e.t||"?")]),
         mk("span", null, [e.tx || e.text || ""])])));
    });
  }

  /* -------------------------------------------------------------------------
     Turn tick — briefing card once per new turn; badge refresh
     ------------------------------------------------------------------------- */
  let lastTurn = -1;
  function briefingCard() {
    $$(".v2-brief").forEach(n => n.remove());
    const s = window.SOP.s;
    const card = mk("div", { class:"v2-brief" });
    card.appendChild(mk("small", null, [`Q${window.SOP.turn} · ${window.SOP.state||""}`]));
    card.appendChild(mk("h4", null, ["Morning Briefing"]));
    const ul = mk("ul");
    const alerts = [];
    if ((s.app||0) < 30) alerts.push("Approval below 30% — impeachment risk rising");
    if ((s.cor||0) > 0.55) alerts.push("Corruption index elevated — EFCC watching");
    if (HOUSE.pending.length) alerts.push(`${HOUSE.pending.length} bill(s) stuck in the House`);
    if (COURTS.pending.length) alerts.push(`${COURTS.pending.length} court matter(s) awaiting your call`);
    // Ledger-derived proactive signals (READ-ONLY consumer).
    try { (window.SOP_LEDGER && window.SOP_LEDGER.saSignals() || []).forEach(sig => alerts.push(sig.txt)); } catch(e){}
    if (!alerts.length) alerts.push("No fires. Push a project or table a bill.");
    alerts.forEach(a => ul.appendChild(mk("li", null, [a])));
    card.appendChild(ul);
    card.appendChild(mk("button", { class:"v2-btn", style:{marginTop: "22px"}, onclick: () => card.remove() }, ["Got it"]));
    document.body.appendChild(card);
    setTimeout(() => card.remove(), 8000);
  }
  function tick() {
    if (!window.SOP || !window.SOP.s) return;
    if (window.SOP.turn !== lastTurn) {
      lastTurn = window.SOP.turn;
      // Morning briefing no longer auto-pops — tap the Briefing tab to open it on demand.
      // (Auto-popup was interrupting play; users asked for it removed.)
      // recompute alerts badge
      badges.alerts = (HOUSE.pending.length ? 1 : 0) + (COURTS.pending.length ? 1 : 0);
      paintBar();
    }
  }


  /* -------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------- */
  whenGame(() => {
    injectStyles();
    buildBar();
    firstElectionPatch();
    window.addEventListener("sop-state", tick);
    setInterval(tick, 2500);
    console.log("[SOP V2] shell installed — 10 fixes online");
  });
})();
