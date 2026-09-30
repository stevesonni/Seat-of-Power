/* Seat of Power — Replay Value Layer
   Adds: persistent career dossier, run-modifier deck, scenario mode,
   achievement unlocks, and a post-run legacy summary.
   Self-contained. Consumes window.SOP; writes only to localStorage + DOM overlays.
   Paper register: matches Phase-4 palette (#f6f4ef, #0a6e4f, #8a6d1d, #a41623).
*/
(function () {
  "use strict";
  if (window.__SOP_REPLAY__) return; window.__SOP_REPLAY__ = true;

  const LS = "sop_career_v1";
  const SCEN_KEY = "sop_scenario_queued_v1";
  const MODS_KEY = "sop_runmods_active_v1";

  const PAL = { paper:"#f6f4ef", ink:"#1a1a1a", muted:"#6b6357", rule:"#c9c1b3",
                grn:"#0a6e4f", gold:"#8a6d1d", red:"#a41623", cream:"#eee7d6" };
  const F_S = "Georgia,'Times New Roman',serif";
  const F_D = "'Playfair Display',Georgia,serif";
  const F_M = "'IBM Plex Mono',ui-monospace,monospace";

  // ── storage ────────────────────────────────────────────────────────────
  const loadCareer = () => {
    try { return JSON.parse(localStorage.getItem(LS)) || defaultCareer(); }
    catch (e) { return defaultCareer(); }
  };
  const saveCareer = (c) => { try { localStorage.setItem(LS, JSON.stringify(c)); } catch(e){} };
  const defaultCareer = () => ({
    runs: 0, completed: 0, impeached: 0, defeated: 0, stepped: 0,
    presBids: 0, fctm: 0, senate: 0,
    statesGoverned: [], endingsUnlocked: [],
    achievements: [], history: [],
    bestScore: 0, totalTurns: 0, createdAt: Date.now(),
  });

  // ── modifier deck ──────────────────────────────────────────────────────
  const DECK = [
    { id:"insurgency",   nm:"Insurgency Surge",     icon:"💥", desc:"Boko splinter cells active. -3 sec/turn, +₦0.3B security drain.", tick:(s)=>({sec:s.sec-3, treas:(s.treas||0)-0.3}) },
    { id:"oilcrash",     nm:"Oil Price Crash",      icon:"🛢️", desc:"FAAC allocations down 22% every turn.", tick:(s)=>({faac:(s.faac||0)*0.78}) },
    { id:"hostile",      nm:"Hostile Assembly",     icon:"🏛️", desc:"House stab -2/turn. Budget quorum harder.", tick:(s)=>({pStab:s.pStab-2}) },
    { id:"diaspora",     nm:"Diaspora Darling",     icon:"✈️", desc:"+₦0.4B remittances, +2 approval each turn.", tick:(s)=>({treas:(s.treas||0)+0.4, app:s.app+2}) },
    { id:"drought",      nm:"Sahel Drought",        icon:"☀️", desc:"Agric collapses. -3 econ/turn, food inflation.", tick:(s)=>({econ:s.econ-3}) },
    { id:"reformmandate",nm:"Reform Mandate",       icon:"🗞️", desc:"Media honeymoon. +3 approval when integrity>60.", tick:(s)=>(s.integ>60?{app:s.app+3}:{}) },
    { id:"godfather_rw", nm:"Runaway Godfather",    icon:"🎩", desc:"Godfather demands escalate 40% faster.", tick:()=>({}) },
    { id:"efcc_watch",   nm:"EFCC on Speed Dial",   icon:"🕵🏾", desc:"Every ledger sin gravity ×1.5.", tick:()=>({}) },
    { id:"youthquake",   nm:"Youth Quake",          icon:"📢", desc:"Under-30s watching. Broken promises hit approval double.", tick:()=>({}) },
    { id:"floodplain",   nm:"Floodplain Emergency", icon:"🌊", desc:"Every Q3 turn: -5 infra, -₦0.5B relief.", tick:(s,t)=>t%4===3?{infra:s.infra-5, treas:(s.treas||0)-0.5}:{} },
    { id:"labour_hot",   nm:"Labour Militancy",     icon:"✊🏾", desc:"NLC/TUC agitated. Force-passed budgets cost double stab.", tick:()=>({}) },
    { id:"tinubu_ally",  nm:"Aso Rock Favourite",   icon:"🇳🇬", desc:"+₦0.6B FAAC bonus. FG-relations start at 75.", tick:(s)=>({treas:(s.treas||0)+0.6}) },
  ];

  // ── scenario library ───────────────────────────────────────────────────
  const SCENARIOS = [
    { id:"endsars",  nm:"#EndSARS Week",  icon:"✊🏾", locked:false,
      blurb:"You inherit a state on fire. Protests in every LG. Police compromised. Youth trust=15. Survive Q1 without live rounds.",
      patch:{ app:35, sec:30, pStab:40, integ:60 }, forceMods:["youthquake","hostile"] },
    { id:"subsidy",  nm:"Subsidy Removal Aftermath", icon:"⛽", locked:false,
      blurb:"Fuel jumped 300% overnight. FAAC promises made, palliatives late. Every commissioner demanding cash.",
      patch:{ treas:2, faac:1, app:38, econ:35 }, forceMods:["labour_hot","oilcrash"] },
    { id:"bandits", nm:"Bandit Emergency", icon:"🏜️", locked:false,
      blurb:"Zamfara-style corridor. Kidnappings weekly. Federal troops sidelined. You must reclaim security without touching S.218.",
      patch:{ sec:20, app:40, pStab:45 }, forceMods:["insurgency"] },
    { id:"inheritor", nm:"The Petition Inheritor", icon:"⚖️",
      locked:(c)=>c.runs<1,
      blurb:"You WERE deputy. Governor removed by tribunal. You start Q3 mid-term with his cabinet, his ledger, his enemies.",
      patch:{ treas:6, pStab:35, integ:40, cor:0.35 }, forceMods:["efcc_watch"], startTurn:3 },
    { id:"reformer", nm:"The Reformer's Dilemma", icon:"📖",
      locked:(c)=>c.completed<1,
      blurb:"Landslide 78% mandate. Godfather furious you cut his contracts. Every dirty option costs double integrity.",
      patch:{ app:78, integ:80, pStab:55 }, forceMods:["reformmandate","godfather_rw"] },
    { id:"dynasty", nm:"Dynasty Heir", icon:"👑",
      locked:(c)=>c.completed<2,
      blurb:"Your father governed 1999-2007. You start rich (₦12B personal) but every scandal echoes his. Wikipedia audience x3.",
      patch:{ treas:12, cor:0.2, integ:45 }, forceMods:["efcc_watch","diaspora"] },
  ];

  // ── achievements ───────────────────────────────────────────────────────
  const ACH = [
    { id:"first_term", nm:"First Term", desc:"Complete a first term (any ending).", test:(c,r)=>r.turns>=4 },
    { id:"clean_hands", nm:"Clean Hands", desc:"End a run with corruption <15%.", test:(c,r)=>r.finalCor<0.15 },
    { id:"godfather_slayer", nm:"Godfather Slayer", desc:"Fire a godfather-imposed appointee AND survive the term.", test:(c,r)=>r.firedGF && r.turns>=4 },
    { id:"treasury_titan", nm:"Treasury Titan", desc:"End with ₦20B+ in treasury.", test:(c,r)=>r.finalTreas>=20 },
    { id:"tribunal_survivor", nm:"Tribunal Survivor", desc:"Win reinstatement at Supreme Court.", test:(c,r)=>r.reinstated },
    { id:"popular", nm:"People's Governor", desc:"End with approval ≥ 75%.", test:(c,r)=>r.finalApp>=75 },
    { id:"fctm", nm:"Portfolio of Honour", desc:"Accept Minister of the FCT.", test:(c,r)=>r.ending==="fctm" },
    { id:"pres_win", nm:"Aso Rock", desc:"Win the presidency.", test:(c,r)=>r.ending==="pres_w" },
    { id:"six_zones", nm:"Six Zones", desc:"Govern in all 6 geopolitical zones (across runs).", test:(c)=>zonesCovered(c).length>=6 },
    { id:"iron_will", nm:"Iron Will", desc:"Complete 2 full terms without EVER forcing a budget.", test:(c,r)=>r.turns>=8 && !r.forcedBudget },
  ];
  const ZONE_OF = { LAGOS:"SW", OGUN:"SW", OYO:"SW", OSUN:"SW", ONDO:"SW", EKITI:"SW",
    KANO:"NW", KADUNA:"NW", KATSINA:"NW", JIGAWA:"NW", KEBBI:"NW", SOKOTO:"NW", ZAMFARA:"NW",
    BORNO:"NE", YOBE:"NE", ADAMAWA:"NE", BAUCHI:"NE", GOMBE:"NE", TARABA:"NE",
    KWARA:"NC", KOGI:"NC", NIGER:"NC", NASARAWA:"NC", BENUE:"NC", PLATEAU:"NC", FCT:"NC",
    RIVERS:"SS", DELTA:"SS", BAYELSA:"SS", "AKWA IBOM":"SS", EDO:"SS", "CROSS RIVER":"SS",
    ANAMBRA:"SE", ENUGU:"SE", IMO:"SE", ABIA:"SE", EBONYI:"SE" };
  const zonesCovered = (c) => {
    const set = new Set(); (c.statesGoverned||[]).forEach(st => { const z = ZONE_OF[(st||"").toUpperCase().replace("_"," ")]; if (z) set.add(z); });
    return [...set];
  };

  // ── DOM helpers ────────────────────────────────────────────────────────
  const el = (tag, style, kids) => { const n = document.createElement(tag); if (style) Object.assign(n.style, style); if (kids) kids.forEach(k => n.appendChild(typeof k==="string"?document.createTextNode(k):k)); return n; };
  const btn = (label, onClick, opts={}) => {
    const b = el("button", {
      padding: "29px 50px", background: opts.bg||PAL.grn, color: opts.color||"#fff",
      border:"none", borderRadius: "10px", fontFamily:F_M, fontSize: "38px",
      letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer",
      fontWeight:"600", ...opts.style,
    });
    b.textContent = label; b.onclick = onClick; return b;
  };

  // ── career dossier ─────────────────────────────────────────────────────
  // The visible career pill was removed: it was cluttering the game chrome and
  // did not belong on top of the main interface. Career tracking can still run
  // quietly in the background for replay modifiers / end-of-run summaries.
  let pill;
  function purgeLegacyPills() {
    try {
      document.querySelectorAll("body > div, body > button").forEach((node) => {
        const text = (node.textContent || "").trim();
        if (!text || !/(🎖️|Career|Runs)/i.test(text)) return;
        const st = getComputedStyle(node);
        if (st.position === "fixed" && (st.right === "12px" || st.right === "10px" || st.top === "10px" || st.bottom === "78px")) node.remove();
      });
    } catch (e) {}
  }
  function mountPill() {
    purgeLegacyPills();
    if (pill && document.body.contains(pill)) pill.remove();
    pill = null;
  }
  function refreshPill() {
    purgeLegacyPills();
    if (pill && document.body.contains(pill)) pill.remove();
    pill = null;
  }
  window.SOP_REPLAY_openDossier = openDossier;

  // ── dossier overlay ────────────────────────────────────────────────────
  function openDossier() {
    const c = loadCareer();
    const wrap = overlay();
    const card = documentCard();
    card.appendChild(hd("Governor's Career Dossier", "Persistent across every run · Auto-saved locally"));
    card.appendChild(statsBlock(c));
    card.appendChild(achievementsBlock(c));
    card.appendChild(scenarioBlock(c, wrap));
    card.appendChild(activeModsBlock());
    const foot = el("div", { display:"flex", gap: "29px", marginTop: "50px", flexWrap:"wrap" });
    foot.appendChild(btn("Close", () => wrap.remove(), { bg:"#555" }));
    foot.appendChild(btn("Reset career (danger)", () => {
      if (confirm("Wipe ALL career progress, unlocks, and achievements? This cannot be undone.")) {
        localStorage.removeItem(LS); localStorage.removeItem(SCEN_KEY); localStorage.removeItem(MODS_KEY);
        wrap.remove(); refreshPill();
      }
    }, { bg:PAL.red }));
    card.appendChild(foot);
    wrap.appendChild(card); document.body.appendChild(wrap);
  }

  function overlay() {
    return el("div", {
      position:"fixed", inset:"0", background:"rgba(20,18,14,.55)", zIndex:"9999",
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      overflowY:"auto", padding: "86px 43px",
    });
  }
  function documentCard() {
    return el("div", {
      background:PAL.paper, maxWidth: "1200px", width:"100%",
      border:`1px solid ${PAL.rule}`, padding: "79px 86px", borderRadius: "10px",
      fontFamily:F_S, color:PAL.ink, boxShadow:"0 6px 24px rgba(0,0,0,.3)",
      marginBottom: "120px",
    });
  }
  function hd(t, sub) {
    const w = el("div", { borderBottom:`2px double ${PAL.rule}`, paddingBottom: "36px", marginBottom: "50px" });
    const h = el("h2", { fontFamily:F_D, fontSize: "79px", fontWeight:"700", margin: "0", color:PAL.ink }); h.textContent = t;
    const s = el("div", { fontFamily:F_M, fontSize: "36px", color:PAL.muted, letterSpacing:"5px", textTransform:"uppercase", marginTop: "14px" }); s.textContent = sub;
    w.appendChild(h); w.appendChild(s); return w;
  }
  function statsBlock(c) {
    const d = el("div", { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: "29px", marginBottom: "58px" });
    const cells = [
      ["Runs", c.runs], ["Completed", c.completed], ["Impeached", c.impeached],
      ["Voted out", c.defeated], ["FCT Ministers", c.fctm], ["Best score", c.bestScore],
    ];
    cells.forEach(([k,v]) => {
      const b = el("div", { background:PAL.cream, padding: "29px 36px", border:`1px solid ${PAL.rule}` });
      b.appendChild(el("div",{fontSize: "34px",color:PAL.muted,fontFamily:F_M,textTransform:"uppercase",letterSpacing:"4px"},[k]));
      b.appendChild(el("div",{fontSize: "65px",fontFamily:F_D,fontWeight:"700",color:PAL.grn},[String(v)]));
      d.appendChild(b);
    });
    return d;
  }
  function achievementsBlock(c) {
    const wrap = el("div", { marginBottom: "58px" });
    wrap.appendChild(el("div",{fontFamily:F_M,fontSize: "36px",letterSpacing:"5px",textTransform:"uppercase",color:PAL.gold,marginBottom: "22px"},["Achievements"]));
    ACH.forEach(a => {
      const got = c.achievements.includes(a.id);
      const row = el("div", { padding: "22px 29px", borderBottom:`1px dotted ${PAL.rule}`, opacity: got?"1":"0.45", display:"flex", justifyContent:"space-between", gap: "36px" });
      const l = el("div",null,null); l.innerHTML = `<b style="color:${got?PAL.grn:PAL.ink}">${got?"✔ ":"◯ "}${a.nm}</b><div style="font-size: 34px;color:${PAL.muted}">${a.desc}</div>`;
      row.appendChild(l);
      wrap.appendChild(row);
    });
    return wrap;
  }
  function scenarioBlock(c, wrap) {
    const box = el("div", { marginBottom: "58px" });
    box.appendChild(el("div",{fontFamily:F_M,fontSize: "36px",letterSpacing:"5px",textTransform:"uppercase",color:PAL.gold,marginBottom: "22px"},["Scenario Start (queues for next new run)"]));
    const queued = localStorage.getItem(SCEN_KEY);
    if (queued) {
      const q = el("div", { padding: "22px 36px", background:PAL.cream, border:`1px solid ${PAL.gold}`, fontSize: "38px", marginBottom: "29px" });
      q.innerHTML = `<b>Queued:</b> ${queued} — will apply on your next "New Game". <a href="#" style="color:${PAL.red};margin-left: 9px">clear</a>`;
      q.querySelector("a").onclick = (e)=>{ e.preventDefault(); localStorage.removeItem(SCEN_KEY); wrap.remove(); openDossier(); };
      box.appendChild(q);
    }
    SCENARIOS.forEach(s => {
      const locked = typeof s.locked === "function" ? s.locked(c) : s.locked;
      const row = el("div", { padding: "29px 36px", border:`1px solid ${PAL.rule}`, marginBottom: "22px", background:PAL.paper, opacity: locked?"0.5":"1" });
      const head = el("div",{display:"flex",justifyContent:"space-between",alignItems:"center",gap: "29px"});
      const t = el("div",null,null); t.innerHTML = `<b>${s.icon} ${s.nm}</b>${locked?` <span style="font-size: 34px;color:${PAL.red}">LOCKED</span>`:""}`;
      head.appendChild(t);
      if (!locked) {
        const b = btn("Queue", () => {
          localStorage.setItem(SCEN_KEY, s.id);
          alert("Scenario queued. Start a New Game to launch: "+s.nm);
          wrap.remove(); openDossier();
        }, { bg:PAL.gold, color:"#111" });
        head.appendChild(b);
      }
      row.appendChild(head);
      const p = el("div",{fontSize: "41px",color:PAL.muted,marginTop: "14px",lineHeight:"1.45"},[s.blurb]);
      row.appendChild(p);
      box.appendChild(row);
    });
    return box;
  }
  function activeModsBlock() {
    const wrap = el("div", { marginBottom: "22px" });
    wrap.appendChild(el("div",{fontFamily:F_M,fontSize: "36px",letterSpacing:"5px",textTransform:"uppercase",color:PAL.gold,marginBottom: "22px"},["Active Run Modifiers"]));
    const mods = getActiveMods();
    if (!mods.length) { wrap.appendChild(el("div",{fontSize: "38px",color:PAL.muted},["No run in progress. Modifiers are rolled at the start of each new game (2 per run)."])); return wrap; }
    mods.forEach(id => {
      const m = DECK.find(d=>d.id===id); if (!m) return;
      const row = el("div",{padding: "22px 36px",background:PAL.cream,border:`1px solid ${PAL.rule}`,marginBottom: "14px",fontSize: "41px"});
      row.innerHTML = `<b>${m.icon} ${m.nm}</b> — <span style="color:${PAL.muted}">${m.desc}</span>`;
      wrap.appendChild(row);
    });
    return wrap;
  }

  // ── run modifier engine ────────────────────────────────────────────────
  function getActiveMods() {
    try { return JSON.parse(localStorage.getItem(MODS_KEY)) || []; } catch(e){ return []; }
  }
  function setActiveMods(ids) { try { localStorage.setItem(MODS_KEY, JSON.stringify(ids)); } catch(e){} }
  function rollNewRunMods() {
    const forced = window.__SOP_FORCED_MODS__ || [];
    const pool = DECK.map(d => d.id).filter(id => !forced.includes(id));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [pool[i],pool[j]] = [pool[j],pool[i]]; }
    const picked = [...forced, ...pool].slice(0, 2 + forced.length);
    setActiveMods(picked);
    window.__SOP_FORCED_MODS__ = null;
    setTimeout(() => {
      toast("🎲 Run modifiers rolled: " + picked.map(id => DECK.find(d=>d.id===id).nm).join(" · "));
    }, 1200);
    return picked;
  }

  // Toast
  function toast(txt) {
    const t = el("div",{
      position:"fixed", bottom: "214px", left:"50%", transform:"translateX(-50%)",
      background:PAL.paper, border:`1px solid ${PAL.gold}`, padding: "36px 58px",
      fontFamily:F_M, fontSize: "38px", letterSpacing:"2px", zIndex:"9997",
      color:PAL.ink, boxShadow:"0 4px 12px rgba(0,0,0,.15)", maxWidth:"90%",
    });
    t.textContent = txt; document.body.appendChild(t);
    setTimeout(() => t.style.transition="opacity 500ms",5000);
    setTimeout(() => t.style.opacity="0",5000);
    setTimeout(() => t.remove(), 5800);
  }

  // ── scenario application ───────────────────────────────────────────────
  function applyQueuedScenario() {
    const id = localStorage.getItem(SCEN_KEY);
    if (!id) return;
    const sc = SCENARIOS.find(s => s.id===id); if (!sc) return;
    localStorage.removeItem(SCEN_KEY);
    if (sc.forceMods) window.__SOP_FORCED_MODS__ = sc.forceMods;
    setTimeout(() => {
      if (!window.SOP || !window.SOP.setS) return;
      window.SOP.setS(p => ({ ...p, ...sc.patch }));
      if (sc.startTurn && window.SOP.turn < sc.startTurn) {
        try { const setT = window.SOP.setTurn; setT && setT(sc.startTurn); } catch(e){}
      }
      toast(`📜 Scenario: ${sc.nm} — ${sc.blurb.slice(0, 90)}…`);
    }, 600);
  }

  // ── tick / apply modifiers ─────────────────────────────────────────────
  let lastTurn = 0, runStarted = false, lastSetupSig = "";
  function tick() {
    if (!window.SOP || !window.SOP.s) return;
    const s = window.SOP.s, t = window.SOP.turn || 1;
    const setupSig = (window.SOP.state||"") + "|" + (window.SOP.pName||"");

    // detect run start
    if (setupSig && setupSig !== "|" && setupSig !== lastSetupSig) {
      lastSetupSig = setupSig;
      runStarted = true;
      rollNewRunMods();
      applyQueuedScenario();
      lastTurn = t;
      // increment runs counter
      const c = loadCareer(); c.runs++;
      if (!c.statesGoverned.includes(window.SOP.state)) c.statesGoverned.push(window.SOP.state);
      saveCareer(c); refreshPill();
    }

    // per-turn modifier application
    if (runStarted && t !== lastTurn) {
      lastTurn = t;
      const mods = getActiveMods();
      const patch = {};
      mods.forEach(id => {
        const m = DECK.find(d=>d.id===id); if (!m || !m.tick) return;
        const p = m.tick(s, t) || {};
        Object.entries(p).forEach(([k,v]) => { patch[k] = v; });
      });
      if (Object.keys(patch).length) {
        try {
          window.SOP.setS(prev => {
            const out = { ...prev };
            Object.entries(patch).forEach(([k,v]) => {
              if (typeof v === "number") out[k] = ["app","sec","infra","hp","edu","econ","integ","pStab"].includes(k) ? Math.max(0, Math.min(100, v)) : v;
              else out[k] = v;
            });
            return out;
          });
        } catch(e){}
      }
    }

    // detect end
    if (runStarted && window.SOP.gEnd && !window.__sop_run_recorded) {
      window.__sop_run_recorded = true;
      recordRun(window.SOP.gEnd, window.SOP.s, window.SOP.turn);
    }
    if (!window.SOP.gEnd) window.__sop_run_recorded = false;
  }

  function recordRun(gEnd, s, turn) {
    const c = loadCareer();
    const app = s.app || 0, cor = s.cor || 0, treas = s.treas || 0;
    const run = {
      at: Date.now(), state: window.SOP.state, ending: gEnd, turns: turn,
      finalApp: app, finalCor: cor, finalTreas: treas,
      forcedBudget: !!window.SOP.forcedBudget,
      firedGF: !!window.__sop_firedGF,
      reinstated: !!window.__sop_reinstated,
    };
    c.history.unshift(run); c.history = c.history.slice(0, 30);
    c.totalTurns += turn;
    if (gEnd === "complete") c.completed++;
    if (gEnd === "impeached") c.impeached++;
    if (gEnd === "defeated") c.defeated++;
    if (gEnd === "stepped_down") c.stepped++;
    if (gEnd === "pres_bid") c.presBids++;
    if (gEnd === "fctm") c.fctm++;
    if (gEnd === "senate_w" || gEnd === "senate") c.senate++;
    if (!c.endingsUnlocked.includes(gEnd)) c.endingsUnlocked.push(gEnd);
    // achievements
    const newlyGot = [];
    ACH.forEach(a => {
      try {
        if (!c.achievements.includes(a.id) && a.test(c, run)) {
          c.achievements.push(a.id); newlyGot.push(a);
        }
      } catch(e){}
    });
    const score = Math.round(app*0.4 + (100-cor*100)*0.3 + treas*2 + turn*4);
    if (score > c.bestScore) c.bestScore = score;
    saveCareer(c); refreshPill();
    showLegacy(run, newlyGot, c);
  }

  function showLegacy(run, newAchs, c) {
    setTimeout(() => {
      const wrap = overlay();
      const card = documentCard();
      card.appendChild(hd("Run Recorded", `Ending: ${run.ending} · State: ${run.state} · Turns: ${run.turns}`));
      const stats = el("div",{fontSize: "43px",lineHeight:"1.7",marginBottom: "43px"});
      stats.innerHTML = `
        <div><b>Final approval:</b> ${Math.round(run.finalApp)}%</div>
        <div><b>Final corruption:</b> ${Math.round(run.finalCor*100)}%</div>
        <div><b>Treasury:</b> ₦${run.finalTreas.toFixed(1)}B</div>
        <div><b>Career runs total:</b> ${c.runs} · Completed: ${c.completed}</div>
      `;
      card.appendChild(stats);
      if (newAchs.length) {
        card.appendChild(el("div",{fontFamily:F_M,fontSize: "36px",letterSpacing:"5px",textTransform:"uppercase",color:PAL.gold,marginBottom: "22px",marginTop: "22px"},["Achievements Unlocked"]));
        newAchs.forEach(a => {
          const row = el("div",{padding: "22px 36px",background:PAL.cream,border:`1px solid ${PAL.gold}`,marginBottom: "14px",fontSize: "43px"});
          row.innerHTML = `<b>🏅 ${a.nm}</b> — ${a.desc}`;
          card.appendChild(row);
        });
      }
      const zones = zonesCovered(c);
      if (zones.length < 6) {
        card.appendChild(el("div",{fontSize: "38px",color:PAL.muted,marginTop: "36px",lineHeight:"1.55"},[`Zones governed: ${zones.length}/6 (${zones.join(", ")||"—"}). Try a different zone on your next run to unlock the Six Zones achievement.`]));
      }
      const foot = el("div",{display:"flex",gap: "29px",marginTop: "50px",flexWrap:"wrap"});
      foot.appendChild(btn("View full dossier", () => { wrap.remove(); openDossier(); }, { bg:PAL.grn }));
      foot.appendChild(btn("Dismiss", () => wrap.remove(), { bg:"#555" }));
      card.appendChild(foot);
      wrap.appendChild(card); document.body.appendChild(wrap);
    }, 1800);
  }

  // ── hooks for other modules (godfather-fire / tribunal reinstatement) ──
  window.addEventListener("sop-log", (e) => {
    const tx = (e.detail && e.detail.tx) || "";
    if (/reinstate/i.test(tx)) window.__sop_reinstated = true;
    if (/fired.*(godfather|imposed|nephew|cousin)/i.test(tx)) window.__sop_firedGF = true;
  });

  // ── boot ───────────────────────────────────────────────────────────────
  function boot() {
    mountPill();
    setInterval(purgeLegacyPills, 1500);
    setInterval(tick, 900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
