/* ============================================================================
   sop-electionnight.js — Phase 2 §1: Playable Election Night (shim-first)
   ----------------------------------------------------------------------------
   Self-contained vanilla-DOM overlay. Owns local state for the whole sequence,
   writes ledger entries via SOP.ledgerAppend as the player picks options, and
   at the end calls window.SOP.__onEnightDone(summary) so the React shell can
   proceed to its normal EC8D result card.

   Why no reducer here (spec §preamble): every consequential choice becomes a
   ledger entry, and the Phase 1 tribunal-strength consumer picks it up with
   ZERO new tribunal code. That's the whole point of shipping this first.

   Contract with the React shell (seat-of-power.html):
     - shell listens for `sop-play-election-night` and (a) sets a local
       `enightPending` flag and (b) mounts nothing under the result card.
     - shell dispatches with detail = { ctx }.  We attach ourselves.
     - on completion we call window.SOP.__onEnightDone({ integrity, narrative,
       cancelledTotal, marginNudge, cancelledByReason }).
   Vote math is NOT rewritten here — cancellations & nudges are advisory hints
   the shell can fold into its EC8D collation later. The ledger writes are the
   real consequence path (tribunal, SA, wiki all consume ledger).
   ========================================================================== */
(function () {
  "use strict";
  if (window.SOP_ENIGHT_INSTALLED) return;
  window.SOP_ENIGHT_INSTALLED = true;

  // ── Card pool (spec §1.3, all 10) ──────────────────────────────────────
  // Every option either moves votes OR writes ledger OR both. Cards that
  // FAVOUR the player carry the sharpest temptations (2, 6, 9).
  const CARDS = [
    { id:"c1", favour:"opp", title:"BVAS failure in YOUR stronghold",
      body:"14 polling units in your base zone are offline. Voters are queuing under the sun. Every minute costs turnout.",
      options:[
        { label:"Push INEC for extension (lawyers)", cash:0.08, note:"Extension granted — most of the units come back online.", nudge:+2000, ledger:null },
        { label:"Send party technicians (60% recovery)", cash:0.05, note:"Half your units limp back. Some lost.", nudge:+800, ledger:null },
        { label:"Let it slide", note:"You quietly accept the loss — but the disenfranchisement is on record.", nudge:-2500, ledger:{ kind:"bvas_irregularity", gravity:40, evidence:35, note:"BVAS failures in player stronghold left un-remediated" } },
      ]},
    { id:"c2", favour:"you", title:"BVAS failure in OPPONENT stronghold",
      body:"Your opponent's base has 20 units down. Nobody voting. Their team is scrambling.",
      options:[
        { label:"Quietly celebrate", note:"You say nothing. Their votes stay depressed — but their lawyers are already logging it.", nudge:+2200, ledger:{ kind:"bvas_irregularity", gravity:45, evidence:50, note:"Opponent's stronghold BVAS failure — un-remedied while it favoured player", meta:{ againstPlayer:true } } },
        { label:"Publicly demand INEC fix it (statesmanlike)", cash:0.06, note:"Cameras roll as you demand a level playing field. Integrity ticks up.", nudge:-500, integrity:+8, ledger:{ kind:"evidence_gathering", gravity:0, evidence:35, note:"Publicly demanded remediation of opponent-side BVAS failure" } },
      ]},
    { id:"c3", favour:"opp", title:"Opponent vote-buying at ₦5k/vote",
      body:"Reports from three LGAs: opponent agents distributing brown envelopes at polling booths.",
      options:[
        { label:"Match it — ₦5k/vote your side", cash:0.35, note:"You outspend. Votes shift your way. And the paper trail is now mutual.", nudge:+3000, integrity:-15, ledger:{ kind:"vote_buying", gravity:55, evidence:50, note:"Matched opponent inducement at ₦5k/vote across three LGAs", meta:{ againstPlayer:true } } },
        { label:"Report with photos & phone footage", cash:0.05, note:"You lose the margin race in those wards but bank hard evidence for the petition.", nudge:-800, integrity:+10, ledger:{ kind:"evidence_gathering", gravity:0, evidence:70, note:"Documented opponent vote-buying with photo/audio evidence" } },
        { label:"Ignore", note:"You lose those LGAs. No paper trail either way.", nudge:-1400 },
      ]},
    { id:"c4", favour:"opp", title:"Result sheets snatched in a ward",
      body:"Presiding officer says armed men made off with three EC8A sheets. Ward result now in limbo.",
      options:[
        { label:"Send party boys to recover", cash:0.10, note:"Sheets recovered — mostly. Violence reports filed against your party.", nudge:+1200, integrity:-12, ledger:{ kind:"thug_deployment", gravity:70, evidence:55, note:"Deployed party enforcers to snatch back result sheets", meta:{ againstPlayer:true } } },
        { label:"Call the Resident Commissioner", note:"Slow. Half recovered, other half cancelled.", nudge:-600, cancel:1500 },
        { label:"Accept cancellation", note:"You take the loss cleanly.", nudge:-1400, cancel:2600, ledger:{ kind:"violence_incident", gravity:20, evidence:40, note:"Ward result cancelled following thuggery — player accepted rather than escalating" } },
      ]},
    { id:"c5", favour:"opp", title:"Collation officer 'unreachable'",
      body:"The LGA returning officer has vanished with results in hand. His phone rings out. Nobody knows where he is.",
      options:[
        { label:"Wait it out", note:"He surfaces at 3am. 40% of the LGA is cancelled by then.", nudge:-1800, cancel:3200 },
        { label:"Godfather can find him — for a favour", note:"He returns within the hour. But you now owe another mandate.", nudge:+1600, gfPatience:+10, ledger:{ kind:"godfather_contract", gravity:50, evidence:20, note:"Godfather 'located' missing collation officer — new IOU owed", meta:{ againstPlayer:true } } },
        { label:"Alert observers & the press", cash:0.04, note:"Cameras arrive. The RO surfaces sheepishly. Evidence of tampering documented.", integrity:+6, ledger:{ kind:"evidence_gathering", gravity:0, evidence:60, note:"Alerted observers to missing collation officer" } },
      ]},
    { id:"c6", favour:"you", title:"Your LG chairman 'delivered' 98% turnout",
      body:"His LGA is reporting 98% turnout — all breaking your way. The math is comically wrong. National average is 27%.",
      options:[
        { label:"Accept quietly — margin is margin", note:"You take the votes. Everyone can see the numbers. It's a bomb waiting for the petition.", nudge:+4500, integrity:-25, ledger:{ kind:"result_falsification", gravity:80, evidence:65, note:"Accepted 98% turnout figure from LG chairman — over-voting on record", meta:{ againstPlayer:true } } },
        { label:"Repudiate & request cancellation", note:"You publicly denounce the numbers. Votes cancelled. Integrity soars.", nudge:-3200, cancel:4200, integrity:+15, ledger:{ kind:"evidence_gathering", gravity:0, evidence:50, note:"Player-initiated repudiation of inflated LGA result" } },
      ]},
    { id:"c7", favour:"opp", title:"Thugs turning voters away in opponent's zone",
      body:"Voters in opponent-leaning wards being intimidated at gunpoint. Some of the thugs wear your party's colours. Your organisers deny any link.",
      options:[
        { label:"Claim ignorance, say nothing", note:"Turnout drops in those wards. If traced later, this is on you.", nudge:+1500, ledger:{ kind:"thug_deployment", gravity:65, evidence:30, note:"Silent while thugs in party colours suppressed opponent turnout", meta:{ againstPlayer:true, latent:true } } },
        { label:"Publicly condemn + call police", cash:0.03, note:"You get on radio denouncing violence. Media notices.", integrity:+5, ledger:{ kind:"evidence_gathering", gravity:0, evidence:40, note:"Player publicly condemned voter intimidation" } },
      ]},
    { id:"c8", favour:"opp", title:"INEC logistics delay — rural LGAs",
      body:"Election materials arrived at 1pm in six rural LGAs. Some are in traditional ruler enclaves.",
      options:[
        { label:"Demand extension via lawyers", cash:0.08, note:"Rural votes preserved.", nudge:+700 },
        { label:"Accept the delay", note:"Turnout collapses. Rural rulers remember who left them stranded.", nudge:-1600, cancel:2100, ledger:{ kind:"ruler_snub", gravity:20, evidence:20, note:"Player accepted rural INEC delay — ruler enclaves disenfranchised" } },
      ]},
    { id:"c9", favour:"you", title:"IReV portal upload discrepancy",
      body:"IReV portal totals from one LGA don't match the EC8A sheets. The discrepancy favours you by ~1,800 votes.",
      options:[
        { label:"Flag it now", cash:0.02, note:"You surrender the inflated margin but bank the receipts.", nudge:-1800, integrity:+10, ledger:{ kind:"evidence_gathering", gravity:0, evidence:75, note:"Player-flagged IReV discrepancy that favoured them" } },
        { label:"Stay silent — it favours you", note:"You keep the numbers. It's a latent bomb.", nudge:+1800, integrity:-15, ledger:{ kind:"bvas_irregularity", gravity:45, evidence:40, note:"IReV upload discrepancy left unflagged (favoured player)", meta:{ againstPlayer:true, latent:true } } },
      ]},
    { id:"c10", favour:"opp", title:"Observer harassment — footage exists",
      body:"Your hired observers were beaten off a collation centre. One of them kept recording.",
      options:[
        { label:"Publish the footage", cash:0.05, note:"Rolling news cycle. Petition ammunition secured.", integrity:+8, ledger:{ kind:"evidence_gathering", gravity:0, evidence:80, note:"Published footage of observer harassment at collation centre" } },
        { label:"Trade silence for the godfather's peace deal", note:"Godfather intervenes to calm things. Evidence lost. You owe him.", nudge:+1000, gfPatience:+8, integrity:-8, ledger:{ kind:"godfather_contract", gravity:55, evidence:25, note:"Traded observer footage away in exchange for godfather 'peace deal'", meta:{ againstPlayer:true } } },
      ]},
  ];

  // Pick 4–6 cards. Weight toward opponent-favouring (they're the tough ones)
  // but always seed at least one temptation card (favour:'you') because that's
  // where the ledger fireworks happen (§1.3 design rule).
  function chooseCards(rng, count) {
    const yours = CARDS.filter(c => c.favour === "you");
    const opps  = CARDS.filter(c => c.favour === "opp");
    const shuffled = arr => arr.slice().sort(() => rng() - 0.5);
    const picks = [];
    // guarantee 2 temptations
    picks.push(...shuffled(yours).slice(0, 2));
    // fill the rest with opp/mixed
    picks.push(...shuffled(opps).slice(0, count - picks.length));
    return shuffled(picks);
  }

  // ── Overlay UI ─────────────────────────────────────────────────────────
  let mounted = false;
  function mount(ctx, onDone) {
    if (mounted) return;
    mounted = true;

    const rng = Math.random;
    const cards = chooseCards(rng, 5);
    const state = {
      clock: "polls",         // polls → counting → collation → declared
      cash: (ctx.cashRemaining || 0),
      integrity: 60,          // starts neutral-ish
      narrative: [],
      cancelledTotal: 0,
      marginNudge: 0,
      cancelledByReason: {},
      gfPatienceDelta: 0,
      cardsQueue: cards,
      cardsResolved: [],
    };

    const wrap = document.createElement("div");
    wrap.id = "sop-enight";
    Object.assign(wrap.style, {
      position:"fixed", inset:"0", zIndex:100000,
      background:"#ece7db",
      color:"#1a1a1a",
      fontFamily:'"Iowan Old Style","Palatino Linotype",Georgia,serif',
      overflow:"auto", padding: "27px 21px", boxSizing:"border-box",
    });

    document.body.appendChild(wrap);
    render();

    function log(txt, tone) {
      state.narrative.push({ txt, tone: tone||"info" });
    }

    function applyOption(card, opt) {
      if (opt.cash && opt.cash > state.cash) {
        // let it happen but flavour it — real Nigerian politics
        log(`Overdrew war chest by ₦${(opt.cash - state.cash).toFixed(2)}B for "${opt.label}". IOUs now.`, "warn");
        state.cash = 0;
      } else if (opt.cash) {
        state.cash = Math.max(0, state.cash - opt.cash);
      }
      if (opt.nudge)   state.marginNudge += opt.nudge;
      if (opt.cancel)  {
        state.cancelledTotal += opt.cancel;
        const key = (opt.ledger && opt.ledger.kind) || "misc";
        state.cancelledByReason[key] = (state.cancelledByReason[key]||0) + opt.cancel;
      }
      if (typeof opt.integrity === "number") state.integrity = Math.max(0, Math.min(100, state.integrity + opt.integrity));
      if (opt.gfPatience) state.gfPatienceDelta += opt.gfPatience;
      log(`${card.title} → ${opt.label}. ${opt.note}`, opt.ledger && opt.ledger.meta && opt.ledger.meta.againstPlayer ? "bad" : "ok");

      if (opt.ledger) {
        try {
          window.SOP && window.SOP.ledgerAppend && window.SOP.ledgerAppend({
            kind: opt.ledger.kind,
            gravity: opt.ledger.gravity,
            evidence: opt.ledger.evidence,
            note: opt.ledger.note,
            target: "election_" + (ctx.year || new Date().getFullYear()),
            meta: Object.assign({ card:card.id, phase:"election_night" }, opt.ledger.meta || {}),
          });
        } catch(e){ console.warn("[ENIGHT] ledger append failed", e); }
      }
    }

    function nextClock() {
      if (state.clock === "polls") state.clock = "counting";
      else if (state.clock === "counting") state.clock = "collation";
      else if (state.clock === "collation") state.clock = "declared";
      render();
    }

    function finish() {
      mounted = false;
      const summary = {
        integrity: Math.round(state.integrity),
        narrative: state.narrative,
        cancelledTotal: state.cancelledTotal,
        marginNudge: state.marginNudge,
        cancelledByReason: state.cancelledByReason,
        gfPatienceDelta: state.gfPatienceDelta,
        cashRemaining: state.cash,
      };
      try { window.SOP && (window.SOP.lastElectionNight = summary); } catch(e){}
      wrap.remove();
      if (typeof onDone === "function") onDone(summary);
    }

    function render() {
      const c = state.clock;
      wrap.innerHTML = `
        <style>
          #sop-enight .en-card{background:#f6f4ef;border:1px solid #cfc7b4;border-radius: 3px;padding: 21px 24px;margin-bottom: 18px;max-width: 960px;margin-left: auto;margin-right: auto;box-shadow:0 1px 0 #fff inset,0 6px 16px rgba(0,0,0,.12)}
          #sop-enight h1{font-family:"Playfair Display","Iowan Old Style",Georgia,serif;font-size: 34px;letter-spacing:.02em;color:#1a1a1a;margin: 0 0 6px;font-weight:700}
          #sop-enight h2{font-size: 47px;margin: 0 0 9px;color:#1a1a1a;font-weight:550}
          #sop-enight .meta{font-size: 40px;color:#5a5648;margin-bottom: 12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
          #sop-enight .opt{display:block;width:100%;text-align:left;background:#fbf9f2;color:#1a1a1a;border:1px solid #cfc7b4;border-left:3px solid #0a6e4f;border-radius: 3px;padding: 15px 18px;margin: 9px 0;cursor:pointer;font:inherit;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif}
          #sop-enight .opt:hover{background:#f2eee1;border-left-color:#0a6e4f}
          #sop-enight .opt.tempt{border-left-color:#a41623}
          #sop-enight .opt .sub{font-size: 40px;color:#3d3a30;line-height: 2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
          #sop-enight .opt .tags{margin-top: 6px;font-size: 34px;color:#0a6e4f;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}
          #sop-enight .stat{display:inline-block;padding: 3px 12px;border-radius: 3px;background:#efeadb;border:1px solid #d6cfbc;margin: 3px;font-size: 34px;color:#3d3a30;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
          #sop-enight .narr{font-size: 40px;padding: 8px 0;border-top:1px solid #d6cfbc;color:#3d3a30;font-family:"Iowan Old Style",Georgia,serif}
          #sop-enight .narr.bad{color:#a41623}
          #sop-enight .narr.ok{color:#0a6e4f}
          #sop-enight .narr.warn{color:#8a6d1d}
          #sop-enight button.primary{background:#1a1a1a;color:#f6f4ef;border:none;border-radius: 3px;padding: 15px 30px;font-weight:550;cursor:pointer;font-size: 47px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.02em}
          #sop-enight .ec8d{background:#fbf9f2;border:1px solid #cfc7b4;border-radius: 3px;padding: 15px;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#1a1a1a;margin-top: 12px}

          #sop-enight .opt .lbl{font-weight:600;font-size: 40px;margin-bottom: 3px}
          #sop-enight .opt .sub{font-size: 34px;color:#3d3a30;line-height: 2}
          #sop-enight .opt .tags{margin-top: 6px;font-size: 30px;color:#0a6e4f}
          #sop-enight .stat{display:inline-block;padding: 3px 12px;border-radius: 9px;background:#fbf9f2;margin: 3px;font-size: 34px;color:#3d3a30}
          #sop-enight .narr{font-size: 34px;padding: 6px 0;border-top:1px solid #d6cfbc;color:#3d3a30}
          #sop-enight .narr.bad{color:#a41623}
          #sop-enight .narr.ok{color:#0a6e4f}
          #sop-enight .narr.warn{color:#8a6d1d}
          #sop-enight button.primary{background:#8a6d1d;color:#0b0f1a;border:none;border-radius: 12px;padding: 15px 30px;font-weight:700;cursor:pointer;font-size: 40px}
          #sop-enight .ec8d{background:#fbf9f2;border:1px dashed #cfc7b4;border-radius: 12px;padding: 15px;font:11px ui-monospace,monospace;color:#0a6e4f;margin-top: 12px}
        </style>
        <div class="en-card">
          <h1>🗳️ ELECTION NIGHT — ${ctx.state ? ctx.state.replace("_"," ") : "STATE"}</h1>
          <div class="meta">${ctx.playerName || "You"} (${ctx.partyId||"???"}) vs ${ctx.oppName||"Opponent"} (${ctx.oppPartyId||"???"})</div>
          <div>
            <span class="stat">Clock: <b>${c.toUpperCase()}</b></span>
            <span class="stat">War chest: ₦${state.cash.toFixed(2)}B</span>
            <span class="stat">Integrity: ${Math.round(state.integrity)}/100</span>
            <span class="stat">Cancelled votes: ${state.cancelledTotal.toLocaleString()}</span>
            <span class="stat">Margin drift: ${state.marginNudge>=0?"+":""}${state.marginNudge.toLocaleString()}</span>
          </div>
        </div>
        ${renderClockBody()}
        <div class="en-card">
          <div style="font-size: 34px;color:#5a5648;margin-bottom: 6px">NIGHT LOG</div>
          ${state.narrative.length ? state.narrative.map(n=>`<div class="narr ${n.tone}">${escapeHtml(n.txt)}</div>`).join("") : `<div class="narr" style="color:#7a7566">Nothing yet.</div>`}
        </div>
      `;
      wireButtons();
    }

    function renderClockBody() {
      if (state.clock === "polls") {
        return `<div class="en-card">
          <h2>Polls open across the state</h2>
          <p style="font-size: 34px;color:#3d3a30">Weather: ${Math.random()<0.3?"heavy rain in the south — turnout risk":"clear across all senatorial zones"}. Observer teams deployed. Your agents are calling in.</p>
          <button class="primary" data-act="beginCount">▶ Begin counting</button>
        </div>`;
      }
      if (state.clock === "counting") {
        // Next card or advance to collation
        if (state.cardsQueue.length === 0) {
          return `<div class="en-card">
            <h2>All battleground reports in</h2>
            <p style="font-size: 34px;color:#3d3a30">Time to walk into collation.</p>
            <button class="primary" data-act="beginCollation">▶ Proceed to state collation</button>
          </div>`;
        }
        const card = state.cardsQueue[0];
        return `<div class="en-card">
          <div class="meta">Battleground LGA · card ${state.cardsResolved.length+1} of ${state.cardsResolved.length + state.cardsQueue.length}</div>
          <h2>📞 ${card.title}</h2>
          <p style="font-size: 34px;color:#3d3a30;line-height: 2;margin: 6px 0 12px">${card.body}</p>
          ${card.options.map((o,i)=>`
            <button class="opt" data-act="pick" data-opt="${i}">
              <div class="lbl">${escapeHtml(o.label)}</div>
              <div class="sub">${escapeHtml(o.note)}</div>
              <div class="tags">
                ${o.cash?`💰 ₦${o.cash}B  `:""}
                ${o.nudge?`📈 ${o.nudge>=0?"+":""}${o.nudge} votes  `:""}
                ${o.cancel?`❌ ${o.cancel} cancelled  `:""}
                ${o.integrity?`🕊️ integrity ${o.integrity>=0?"+":""}${o.integrity}  `:""}
                ${o.gfPatience?`🎩 gf +${o.gfPatience}  `:""}
                ${o.ledger?`📒 ${o.ledger.kind} (g${o.ledger.gravity}/e${o.ledger.evidence})`:""}
              </div>
            </button>`).join("")}
        </div>`;
      }
      if (state.clock === "collation") {
        return `<div class="en-card">
          <h2>State collation centre</h2>
          <p style="font-size: 34px;color:#3d3a30">The 21 LGAs stream their EC8Bs. Party agents watch the tally board. Your margin drift from the night: <b style="color:${state.marginNudge>=0?"#0a6e4f":"#a41623"}">${state.marginNudge>=0?"+":""}${state.marginNudge.toLocaleString()}</b>. Cancelled votes: <b style="color:#8a6d1d">${state.cancelledTotal.toLocaleString()}</b>.</p>
          <div class="ec8d">
FORM EC8D — provisional
  margin nudge:      ${state.marginNudge>=0?"+":""}${state.marginNudge.toLocaleString()}
  cancelled total:   ${state.cancelledTotal.toLocaleString()}
  night integrity:   ${Math.round(state.integrity)}/100
  ledger writes:     ${state.narrative.filter(n=>n.tone==='bad').length} adverse · ${state.narrative.filter(n=>n.tone==='ok').length} favourable
          </div>
          <button class="primary" data-act="declare" style="margin-top: 12px">▶ Declaration</button>
        </div>`;
      }
      // declared
      return `<div class="en-card">
        <h2>Declaration</h2>
        <p style="font-size: 34px;color:#3d3a30">The returning officer approaches the microphone. Your choices tonight are now permanent record — the tribunal (if it comes) will read every ledger entry above.</p>
        <button class="primary" data-act="finish">▶ Return to result screen</button>
      </div>`;
    }

    function wireButtons() {
      wrap.querySelectorAll("button[data-act]").forEach(b => {
        b.addEventListener("click", () => {
          const act = b.dataset.act;
          if (act === "beginCount")     { state.clock = "counting"; render(); }
          else if (act === "beginCollation") { state.clock = "collation"; render(); }
          else if (act === "declare")   { state.clock = "declared"; render(); }
          else if (act === "finish")    { finish(); }
          else if (act === "pick") {
            const i = parseInt(b.dataset.opt,10);
            const card = state.cardsQueue.shift();
            applyOption(card, card.options[i]);
            state.cardsResolved.push({ id:card.id, chose:i });
            render();
          }
        });
      });
    }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  // ── Public trigger ─────────────────────────────────────────────────────
  // React shell dispatches:
  //   window.dispatchEvent(new CustomEvent("sop-play-election-night",
  //     { detail:{ ctx:{...}, done:(summary)=>void } }))
  window.addEventListener("sop-play-election-night", (ev) => {
    const detail = ev.detail || {};
    mount(detail.ctx || {}, detail.done);
  });

  // Or programmatically:
  window.SOP = window.SOP || {};
  window.SOP.playElectionNight = (ctx, done) => mount(ctx || {}, done);

  console.log("[SOP ENIGHT] election-night overlay ready (Phase 2 §1)");
})();
