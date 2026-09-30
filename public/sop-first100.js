/* ============================================================================
   sop-first100.js — THE FIRST 100 DAYS
   ----------------------------------------------------------------------------
   A scripted, hand-authored opening sequence that runs ONCE, immediately after
   the Government House welcome and BEFORE the first appropriation screen.

   Why it exists (spec §"vertical slice"): the systems in this game are deep but
   the player used to meet them as a wall of tabs. The First 100 Days walks them
   through one beat at a time — oath, godfather, cabinet, empty vault, first
   contract, the story breaking, the adviser's read — and then shows a report
   that names, in plain language, what they now owe and what is now exposed.

   Design rules this file obeys:
     1. Every option moves at least one number AND writes one ledger entry.
        No option is decoration.
     2. Every option shows its price BEFORE it is picked.
     3. At least one choice creates a DELAYED consequence with a named turn, and
        the report tells the player which turn it lands on.
     4. Everything is written through the existing bridge (window.SOP) and the
        existing ledger (window.SOP_LEDGER) — no new save fields, no new state
        machine, nothing for the monolith to know about.
   ========================================================================== */
(function () {
  "use strict";
  if (window.SOP_F100_INSTALLED) return;
  window.SOP_F100_INSTALLED = true;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const c100 = (v) => Math.max(0, Math.min(100, v));
  const c1 = (v) => Math.max(0, Math.min(1, v));
  const nB = (v) => "₦" + (Math.round(v * 10) / 10) + "B";

  // ── Named people, drawn from the player's own state so the cast is local ──
  function localName(seed) {
    try {
      const S = window.SOP;
      const pool = (window.SNAMES_REF || {})[S.state] || (window.SNAMES_REF || {}).FCT;
      if (!pool) return "Ibrahim Danladi";
      const a = Math.abs(seed) % pool.fn.length, b = Math.abs(seed * 7 + 13) % pool.ln.length;
      return pool.fn[a] + " " + pool.ln[b];
    } catch (e) { return "Ibrahim Danladi"; }
  }

  // The same ten ministries the realism module uses, so the cabinet the player
  // builds here is the cabinet every other screen already understands.
  const DEFAULT_MINISTRIES = [
    { id: "works", name: "Works & Infrastructure", icon: "🏗️", budget: 0, staff: 1240, perf: 55, cor: 35, key: "infra" },
    { id: "health", name: "Health", icon: "🏥", budget: 0, staff: 8900, perf: 55, cor: 30, key: "hp" },
    { id: "educ", name: "Education", icon: "🎓", budget: 0, staff: 14200, perf: 55, cor: 28, key: "lit" },
    { id: "agric", name: "Agriculture & Rural Dev", icon: "🌾", budget: 0, staff: 420, perf: 50, cor: 32, key: "agr" },
    { id: "sec", name: "Security & Home Affairs", icon: "🛡️", budget: 0, staff: 180, perf: 55, cor: 38, key: "sec" },
    { id: "fin", name: "Finance & Economic Planning", icon: "💰", budget: 0, staff: 340, perf: 60, cor: 40, key: null },
    { id: "just", name: "Justice", icon: "⚖️", budget: 0, staff: 210, perf: 55, cor: 25, key: null },
    { id: "info", name: "Information & Strategy", icon: "📡", budget: 0, staff: 150, perf: 50, cor: 30, key: null },
    { id: "lg", name: "Local Government & Chieftaincy", icon: "🏘️", budget: 0, staff: 280, perf: 45, cor: 45, key: null },
    { id: "wom", name: "Women Affairs & Social Welfare", icon: "👩", budget: 0, staff: 190, perf: 50, cor: 25, key: null },
  ];

  // ── Run state ────────────────────────────────────────────────────────────
  let run = null;   // { i, log, owed[], exposed[], pending[], startApp, ledgerIds{} }
  let wrap = null;

  /* ───────────────────────── THE BEATS ─────────────────────────
     Each beat: day, mode (public|admin|private), kicker, title, body,
     adviser line, and 2-4 options. An option declares its visible effects
     in `chips`, applies them in `fx`, and records itself in `ledger`.
     `beat(ctx)` is called with a small context so copy can name real people.
  ─────────────────────────────────────────────────────────────── */
  function beats(ctx) {
    const gfName = ctx.gfName;
    const nominee = ctx.nominee, technocrat = ctx.technocrat, loyalist = ctx.loyalist;
    return [

      // ── DAY 1 ──────────────────────────────────────────────────────────
      {
        day: "DAY 1", mode: "public", kicker: "INAUGURATION",
        title: "The oath, and then the microphone",
        body: `You take the oath on the parade ground in ${ctx.capital}. Forty thousand people, the Chief Judge, six visiting governors, and ${gfName} seated in the front row with his cap tilted back. Then they hand you the microphone. Whatever you say in the next four minutes is the headline for the next four months.`,
        aside: `"Sir, three drafts are in your pocket. Whichever one you read, you cannot un-read."`,
        options: [
          {
            label: "Declare war on corruption. Name the missing ₦40bn.",
            note: "The crowd will roar. The people who stole it are sitting in front of you.",
            chips: [["Approval +9", "good"], ["Party stability −8", "bad"], ["Godfather furious", "bad"]],
            fx: { app: +9, pStab: -8, gf: -18 },
            outcome: "You named the missing money from the podium. The front row did not clap.",
            owed: null,
            exposed: `${gfName} heard you promise a probe he is inside.`,
            ledger: { kind: "public_pledge", gravity: 2, evidence: 5, target: gfName, losers: ["godfather"], beneficiaries: ["public"], futureRisk: "A publicly promised anti-corruption probe you have not started" },
          },
          {
            label: "Thank the party. Promise continuity and calm.",
            note: "Safe, dull, and it buys you the Assembly's first three months.",
            chips: [["Party stability +10", "good"], ["Approval −4", "bad"], ["Godfather pleased", "good"]],
            fx: { app: -4, pStab: +10, gf: +12 },
            outcome: "A party speech. The front row clapped. The market women did not.",
            exposed: null,
            ledger: { kind: "public_pledge", gravity: 1, evidence: 5, beneficiaries: ["party", "godfather"], losers: ["public"], futureRisk: "You are on record as the continuity candidate" },
          },
          {
            label: "Announce salaries will be paid by the 25th, every month.",
            note: "A concrete promise. Workers will hold you to the date.",
            chips: [["Approval +6", "good"], ["Locks ₦ every month", "warn"]],
            fx: { app: +6, pStab: +2 },
            outcome: "You gave a date. Dates are checkable.",
            exposed: "A dated salary promise the whole state can verify.",
            ledger: { kind: "public_pledge", gravity: 2, evidence: 5, beneficiaries: ["workers"], futureRisk: "Salary-by-the-25th pledge — a missed month is a strike" },
          },
        ],
      },

      // ── DAY 4 ──────────────────────────────────────────────────────────
      {
        day: "DAY 4", mode: "admin", kicker: "THE VERANDA",
        title: `${gfName} did not come to congratulate you`,
        body: `He arrives at 6am, before the aides. He does not sit. "I spent ₦2.1 billion on you," he says. "Works. That ministry is mine. My man is outside in the car." Through the window you can see the car.`,
        aside: `"Sir — he is not asking. Works is where the contracts are. That is the whole conversation."`,
        options: [
          {
            label: "Give him Works. Settle the debt now.",
            note: "The ministry with the largest capital envelope, run by his nominee.",
            chips: [["Party stability +12", "good"], ["Corruption +6%", "bad"], ["Debt settled", "warn"]],
            fx: { pStab: +12, cor: +0.06, gf: +20 },
            appoint: { ministryId: "works", minister: nominee, mandate: true },
            outcome: `${nominee} is Commissioner for Works before lunch.`,
            owed: null,
            exposed: `${gfName}'s nominee controls the capital budget.`,
            ledger: { kind: "godfather_contract", gravity: 4, evidence: 3, target: gfName, corruptionDelta: 6, beneficiaries: ["godfather"], losers: ["public"], relatedEntity: "ministry:works", futureRisk: "Every Works contract this term is traceable to a godfather mandate" },
          },
          {
            label: "Offer him Local Government & Chieftaincy instead.",
            note: "Real patronage, no capital budget. He will notice the swap.",
            chips: [["Party stability +4", "good"], ["Corruption +3%", "bad"], ["He is owed", "warn"]],
            fx: { pStab: +4, cor: +0.03, gf: -4 },
            appoint: { ministryId: "lg", minister: nominee, mandate: true },
            outcome: `He takes it, slowly. "For now," he says.`,
            owed: { to: gfName, what: "The Works ministry he was promised", dueBy: 3 },
            exposed: null,
            ledger: { kind: "godfather_contract", gravity: 3, evidence: 2, target: gfName, corruptionDelta: 3, beneficiaries: ["godfather"], relatedEntity: "ministry:lg", debtOwed: true, futureRisk: "A half-paid godfather returns with interest" },
          },
          {
            label: "Refuse. The cabinet is yours.",
            note: "Clean. He funds the Assembly caucus that confirms your budget.",
            chips: [["Approval +5", "good"], ["Party stability −16", "bad"], ["Assembly turns hostile", "bad"]],
            fx: { app: +5, pStab: -16, gf: -35 },
            outcome: `He leaves without shaking your hand. Twelve Assembly members take his call that evening.`,
            owed: null,
            exposed: "An enemy inside your own party with money and members.",
            delayed: { turn: 2, label: `${gfName} moves against your budget in the Assembly`, fx: { pStab: -8 }, log: `🎩 ${gfName}'s caucus is whipping against you. Party stability −8.` },
            ledger: { kind: "godfather_betrayal", gravity: 3, evidence: 2, target: gfName, losers: ["godfather"], beneficiaries: ["public"], futureRisk: "The man who funded you is now funding your opposition" },
          },
        ],
      },

      // ── DAY 21 ─────────────────────────────────────────────────────────
      {
        day: "DAY 21", mode: "admin", kicker: "CABINET",
        title: "Who holds the money?",
        body: "Commissioner for Finance signs every release from the treasury. Three files are on your desk. Only one of these people will tell you the truth about the balance.",
        aside: `"Whoever you pick here decides whether the numbers I bring you are real."`,
        options: [
          {
            label: `${technocrat} — ex-World Bank, no political base`,
            note: "Competent, incorruptible, and cannot deliver a single ward for you.",
            chips: [["Corruption −5%", "good"], ["Party stability −6", "bad"], ["Real numbers", "good"]],
            fx: { cor: -0.05, pStab: -6 },
            appoint: { ministryId: "fin", minister: technocrat, perf: 82, cor: 12 },
            outcome: `${technocrat} takes the oath and immediately asks for the real debt file.`,
            ledger: { kind: "appointment", gravity: 1, evidence: 1, target: technocrat, corruptionDelta: -5, beneficiaries: ["public"], losers: ["party"], relatedEntity: "ministry:fin" },
          },
          {
            label: `${loyalist} — party treasurer, twenty years loyal`,
            note: "He will never leak. He will also never say no to the party.",
            chips: [["Party stability +9", "good"], ["Corruption +5%", "bad"]],
            fx: { pStab: +9, cor: +0.05 },
            appoint: { ministryId: "fin", minister: loyalist, perf: 48, cor: 62 },
            outcome: `${loyalist} moves into the treasury with his own accountant.`,
            exposed: "Party treasurer now controls state releases.",
            ledger: { kind: "appointment", gravity: 3, evidence: 2, target: loyalist, corruptionDelta: 5, beneficiaries: ["party"], losers: ["public"], relatedEntity: "ministry:fin", futureRisk: "A party treasurer signing state cheques is an EFCC template" },
          },
          {
            label: "Hold the portfolio yourself for now",
            note: "No commissioner. Every release crosses your desk — and your name.",
            chips: [["Approval +3", "good"], ["Every naira is yours", "warn"]],
            fx: { app: +3 },
            outcome: "You keep Finance. There is now nobody to blame.",
            exposed: "You personally signed every release in your first quarter.",
            ledger: { kind: "appointment", gravity: 2, evidence: 4, target: "the Governor", relatedEntity: "ministry:fin", futureRisk: "Personal signature on every treasury release" },
          },
        ],
      },

      // ── DAY 40 ─────────────────────────────────────────────────────────
      {
        day: "DAY 40", mode: "admin", kicker: "THE VAULT",
        title: "FAAC came in short",
        body: `The federation account allocation landed ${nB(ctx.shortfall)} below projection — oil at a bad price, and the deductions were taken at source. Salaries are due in eleven days. Contractors from the last administration are owed ${nB(ctx.arrears)} and two of them have gone to court.`,
        aside: `"Sir, we cannot do both. Whatever you skip, somebody outside this building will hold a press conference about it."`,
        options: [
          {
            label: "Pay salaries in full. Let the contractors wait.",
            note: "Workers stay quiet. The court cases proceed.",
            chips: [["Approval +7", "good"], ["Debt +₦" + ctx.arrears + "B", "bad"]],
            fx: { app: +7, debt: +ctx.arrears },
            outcome: "Salaries clear on the 25th. Two contractors file for judgment.",
            exposed: "Unpaid judgment debts accruing interest.",
            delayed: { turn: 3, label: "Contractors obtain garnishee order on state accounts", fx: { debt: +0.6, app: -4 }, log: "⚖️ Garnishee order served on the state account — ₦0.6B frozen, approval −4." },
            ledger: { kind: "fiscal_decision", gravity: 2, evidence: 3, financial: -ctx.arrears, beneficiaries: ["workers"], losers: ["contractors"], futureRisk: "Judgment debts that can freeze the state account" },
          },
          {
            label: "Pay half salaries. Settle the loudest contractor.",
            note: "Nobody riots. Nobody is satisfied.",
            chips: [["Approval −6", "bad"], ["Party stability +3", "good"]],
            fx: { app: -6, pStab: +3 },
            outcome: "Half salaries land. The NLC state chapter calls an emergency meeting.",
            delayed: { turn: 2, label: "NLC warning strike over the half-month", fx: { app: -5 }, log: "✊ NLC three-day warning strike over unpaid balance. Approval −5." },
            ledger: { kind: "fiscal_decision", gravity: 2, evidence: 3, losers: ["workers"], beneficiaries: ["contractors"], futureRisk: "Organised labour is now counting your months" },
          },
          {
            label: `Take a ${nB(ctx.loan)} commercial bridge loan at 27%`,
            note: "Everyone gets paid this month. The state pays for four years.",
            chips: [["Approval +8", "good"], ["Debt +₦" + ctx.loan + "B", "bad"], ["Interest 27%", "bad"]],
            fx: { app: +8, debt: +ctx.loan * 1.27 },
            outcome: "Everyone is paid. The DMO now lists you.",
            exposed: "A 27% bridge loan taken in your first quarter.",
            ledger: { kind: "fiscal_decision", gravity: 3, evidence: 4, financial: -ctx.loan, beneficiaries: ["workers", "contractors"], losers: ["future"], futureRisk: "27% commercial debt compounding across the whole term" },
          },
        ],
      },

      // ── DAY 55 ─────────────────────────────────────────────────────────
      {
        day: "DAY 55", mode: "admin", kicker: "FIRST CONTRACT",
        title: `The ${ctx.roadName}`,
        body: `Eighteen kilometres, ${nB(ctx.roadCost)}, the road every campaign in this state has promised since 1999. It needs a NESREA environmental impact assessment — the alignment crosses farmland and a seasonal stream. The assessment takes one full quarter.`,
        aside: `"Do the EIA and you cut a ribbon in year three. Skip it and you cut it in year one — until a judge stops you."`,
        options: [
          {
            label: "Open competitive tender, EIA completed first",
            note: "Six weeks advertised, sealed bids, assessment done. Slow and unbreakable.",
            chips: [["Corruption −4%", "good"], ["Cheapest bid", "good"], ["Slow", "warn"]],
            fx: { cor: -0.04 },
            project: { method: "open", eiaDone: true, contractor: "Setraco Nigeria Ltd", leakage: 0.08 },
            outcome: `Setraco wins at ${nB(ctx.roadCost * 0.85)}. BudgIT publishes the bid documents approvingly.`,
            ledger: { kind: "contract_awarded", gravity: 1, evidence: 1, target: "Setraco Nigeria Ltd", relatedEntity: "project:signature_road", beneficiaries: ["public"] },
          },
          {
            label: "Selective tender. Pre-qualified firms only, EIA running in parallel",
            note: "Faster. Losing bidders can petition the BPP.",
            chips: [["Faster start", "good"], ["BPP petition risk", "warn"]],
            fx: { cor: +0.01 },
            project: { method: "selective", eiaDone: true, contractor: "Craneburg Construction", leakage: 0.14 },
            outcome: "Craneburg mobilises to site in three weeks.",
            ledger: { kind: "contract_awarded", gravity: 2, evidence: 2, target: "Craneburg Construction", relatedEntity: "project:signature_road" },
          },
          {
            label: `Emergency certificate to ${gfName}'s firm. Break ground next week.`,
            note: "No tender, no EIA. A ribbon before the rains. 35% will not reach the road.",
            chips: [["Approval +6", "good"], ["Corruption +12%", "bad"], ["Court injunction likely", "bad"]],
            fx: { app: +6, cor: +0.12, gf: +15 },
            project: { method: "emergency", eiaDone: false, contractor: `${gfName} & Sons Ltd`, leakage: 0.35, nepotism: true },
            outcome: "Graders are on the alignment within nine days. Farmers are already writing petitions.",
            exposed: "Emergency award, no EIA, godfather-linked contractor. All three on paper.",
            delayed: { turn: 3, label: `NESREA injunction halts the ${ctx.roadName}`, fx: { app: -6 }, log: `⚖️ Federal High Court suspends the ${ctx.roadName} — no EIA on file. Approval −6.` },
            ledger: { kind: "eia_bypass", gravity: 5, evidence: 4, target: `${gfName} & Sons Ltd`, corruptionDelta: 12, relatedEntity: "project:signature_road", beneficiaries: ["godfather"], losers: ["farmers", "public"], futureRisk: "Emergency award with no EIA — the exact fact pattern EFCC prosecutes" },
          },
        ],
      },

      // ── DAY 78 ─────────────────────────────────────────────────────────
      {
        day: "DAY 78", mode: "admin", kicker: "THE PRESS",
        title: `${ctx.reporter} has the file`,
        body: `A reporter from ${ctx.paper} calls your Chief Press Secretary at 9pm. She has documents from your first 78 days and she is running the story on Sunday whether you speak or not. She wants twenty minutes.`,
        aside: `"She already has it, sir. The only question is whose version sits beside hers."`,
        options: [
          {
            label: "Give her the twenty minutes. Answer everything.",
            note: "The story still runs. It runs with your explanation inside it.",
            chips: [["Approval +4", "good"], ["Nothing hidden", "good"]],
            fx: { app: +4 },
            outcome: "The Sunday piece is hard but fair. Two paragraphs are your own words.",
            ledger: { kind: "media_engagement", gravity: 1, evidence: 2, target: ctx.reporter, beneficiaries: ["public"] },
          },
          {
            label: "Issue a denial through the Commissioner for Information",
            note: "A statement nobody believes, filed for the record.",
            chips: [["Approval −3", "bad"], ["Story grows", "bad"]],
            fx: { app: -3 },
            outcome: "The denial becomes the second story.",
            exposed: "A denial on record that the documents contradict.",
            ledger: { kind: "cover_up", gravity: 3, evidence: 3, target: ctx.paper, losers: ["public"], futureRisk: "A written denial that the paper trail contradicts" },
          },
          {
            label: `Have the ${ctx.paper} state advert account withdrawn`,
            note: "The editor understands. Other editors also understand.",
            chips: [["Story spiked", "good"], ["Corruption +5%", "bad"], ["Press turns", "bad"]],
            fx: { cor: +0.05, app: -2 },
            outcome: "The story does not run. Three other newsrooms hear why by Monday.",
            exposed: "Advertising revenue used to spike a story.",
            delayed: { turn: 4, label: "The spiked story resurfaces, now with the spiking in it", fx: { app: -9 }, log: `📰 ${ctx.paper} publishes the story you killed — plus how you killed it. Approval −9.` },
            ledger: { kind: "press_suppression", gravity: 4, evidence: 3, target: ctx.paper, corruptionDelta: 5, losers: ["press", "public"], futureRisk: "Killing a story creates a bigger story with a date on it" },
          },
        ],
      },
    ];
  }

  /* ───────────────────────── APPLICATION ───────────────────────── */

  function applyOption(beat, opt) {
    const S = window.SOP;
    if (!S) return;
    const fx = opt.fx || {};

    // Numbers
    if (S.setS) S.setS(p => ({
      ...p,
      app: c100(p.app + (fx.app || 0)),
      pStab: c100(p.pStab + (fx.pStab || 0)),
      cor: c1(p.cor + (fx.cor || 0)),
      debt: Math.max(0, p.debt + (fx.debt || 0)),
    }));

    // Cabinet appointment — creates the ministries array on first use so the
    // rest of the game (Cabinet tab, procurement, ministry budgets) inherits it.
    if (opt.appoint) {
      const a = opt.appoint;
      const base = (S.ministries && S.ministries.length) ? S.ministries : DEFAULT_MINISTRIES.map(m => ({ ...m }));
      const next = base.map(m => m.id === a.ministryId
        ? { ...m, minister: a.minister, loyalty: a.mandate ? 95 : 60, perf: a.perf != null ? a.perf : m.perf, cor: a.cor != null ? a.cor : m.cor, godfatherMandate: !!a.mandate }
        : m);
      S.setMinistries && S.setMinistries(next);
      pushWiki({ section: "Governorship", txt: `Appointed ${a.minister} as ${(base.find(m => m.id === a.ministryId) || {}).name}${a.mandate ? " — widely reported as a party-financier nomination." : "."}` });
    }

    // Signature project — shaped exactly like a realism-module project so
    // tickProjects() picks it up and runs it to delivery or collapse.
    if (opt.project) {
      const p = opt.project, cost = run.ctx.roadCost * (p.method === "open" ? 0.85 : p.method === "emergency" ? 1.6 : 1.0);
      const proj = {
        id: "signature_road", title: run.ctx.roadName, type: "road", ministryId: "works",
        baseCost: run.ctx.roadCost, cost: +cost.toFixed(2), needsEIA: true, eiaDone: !!p.eiaDone,
        status: "in_progress", progress: 5, startTurn: S.turn || 1,
        contractor: p.contractor, method: p.method, leakage: p.leakage,
        effective: 1 - p.leakage, nepotism: !!p.nepotism,
        eiaBomb: p.eiaDone ? null : (S.turn || 1) + 2,
        events: [],
      };
      S.setProjects && S.setProjects(prev => [...(prev || []).filter(x => x.id !== "signature_road"), proj]);
      S.setProcLog && S.setProcLog(prev => [{ turn: S.turn || 1, txt: `${proj.title} → ${proj.contractor} (${p.method}) @ ${nB(proj.cost)} · leakage ${(p.leakage * 100) | 0}%` }, ...(prev || [])].slice(0, 30));
      if (p.nepotism) S.setNepotismCount && S.setNepotismCount(n => (n || 0) + 1);
      pushWiki({ section: p.nepotism ? "Controversies" : "Governorship", txt: `Awarded the ${proj.title} (${nB(proj.cost)}) to ${proj.contractor}${p.method === "emergency" ? " under an emergency certificate, without an environmental impact assessment." : ` via ${p.method} tender.`}` });
    }

    if (typeof fx.gf === "number") run.gfShift += fx.gf;

    // Ledger — the permanent record. This is what the tribunal, the EFCC file
    // and the adviser read later; nothing here is cosmetic.
    let lid = null;
    if (opt.ledger) {
      try {
        lid = window.SOP_LEDGER && window.SOP_LEDGER.append(Object.assign({
          actor: "governor",
          location: beat.day + " — " + beat.title,
          decision: opt.label,
          outcome: opt.outcome || "",
          approvalDelta: fx.app || 0,
          note: opt.ledger.note || (beat.title + " — " + opt.label),
          causedBy: run.lastLedgerId ? [run.lastLedgerId] : [],
          debtOwed: opt.owed || (opt.ledger.debtOwed ? { to: run.ctx.gfName, what: "an unpaid mandate", dueBy: 3 } : null),
        }, opt.ledger));
      } catch (e) { console.warn("[F100] ledger", e); }
    }
    if (lid) run.lastLedgerId = lid;

    // Book-keeping for the report
    run.log.push({ day: beat.day, title: beat.title, choice: opt.label, outcome: opt.outcome || "" });
    if (opt.owed) run.owed.push(opt.owed);
    if (opt.exposed) run.exposed.push(opt.exposed);
    if (opt.delayed) run.pending.push(opt.delayed);
    if (S.addL) S.addL(`📋 ${beat.day}: ${opt.label}`, "policy");
    S.setSaMemory && S.setSaMemory(m => [...(m || []), { turn: S.turn || 1, txt: `${beat.day}: chose "${opt.label}"` }].slice(-40));
  }

  function pushWiki(ev) {
    const S = window.SOP;
    if (S && S.setWikiEvents) S.setWikiEvents(w => [{ turn: S.turn || 1, ...ev }, ...(w || [])]);
  }

  /* ── Delayed consequences ────────────────────────────────────────────────
     The whole point of the slice: something the player chose on day 4 must
     arrive, named and attributed, on a turn they were told about. We hold the
     schedule here and fire it when the bridge reports that turn.               */
  const scheduled = [];
  function schedulePending() {
    run.pending.forEach(p => scheduled.push(p));
  }
  window.addEventListener("sop-state", () => {
    const S = window.SOP;
    if (!S || !scheduled.length) return;
    for (let i = scheduled.length - 1; i >= 0; i--) {
      const p = scheduled[i];
      if (S.turn >= p.turn) {
        scheduled.splice(i, 1);
        const fx = p.fx || {};
        S.setS && S.setS(x => ({
          ...x,
          app: c100(x.app + (fx.app || 0)),
          pStab: c100(x.pStab + (fx.pStab || 0)),
          cor: c1(x.cor + (fx.cor || 0)),
          debt: Math.max(0, x.debt + (fx.debt || 0)),
        }));
        S.addL && S.addL(p.log, "crisis");
        try { window.SOP_V2_toast && window.SOP_V2_toast(p.label); } catch (e) {}
        try {
          window.SOP_LEDGER && window.SOP_LEDGER.append({
            kind: "delayed_consequence", actor: "consequence", gravity: 3, evidence: 3,
            note: p.label, outcome: p.log, approvalDelta: fx.app || 0,
            causedBy: p.causedBy || [],
          });
        } catch (e) {}
      }
    }
  });

  /* ───────────────────────── RENDER ───────────────────────── */

  function css() {
    return `
      #sop-f100{position:fixed;inset:0;z-index:100001;overflow:auto;
        background:var(--sf-bg,#f8faf5);color:var(--ink,#1a2e05);
        font-family:'Outfit',sans-serif;padding:var(--s-5,52px) var(--s-4,34px);box-sizing:border-box}
      #sop-f100 .f-wrap{max-width:1500px;margin:0 auto}
      #sop-f100 .f-rail{display:flex;align-items:center;gap:var(--s-2,14px);margin-bottom:var(--s-4,34px);flex-wrap:wrap}
      #sop-f100 .f-dot{width:20px;height:20px;border-radius:999px;background:var(--sf-bdr,#d0d8c4)}
      #sop-f100 .f-dot.on{background:var(--accent,#008751)}
      #sop-f100 .f-dot.now{background:var(--accent,#008751);box-shadow:0 0 0 8px rgba(0,135,81,.18)}
      #sop-f100 .f-day{font-family:'JetBrains Mono',monospace;font-size:var(--t-meta,30px);
        letter-spacing:2px;color:var(--ink-dim,#7a8b6a);text-transform:uppercase}
      #sop-f100 .f-card{background:var(--sf-card,#fff);border:2px solid var(--sf-bdr,#d0d8c4);
        border-radius:var(--r-lg,32px);padding:var(--s-5,52px);box-shadow:0 10px 26px rgba(0,0,0,.14)}
      #sop-f100 h2{font-family:'Montserrat',sans-serif;font-weight:900;font-size:var(--t-title,60px);
        line-height:1.1;margin:var(--s-2,14px) 0 var(--s-3,22px)}
      #sop-f100 .f-body{font-size:var(--t-body,40px);line-height:1.55;color:var(--ink-mid,#4a5e3a)}
      #sop-f100 .f-aside{display:flex;gap:var(--s-3,22px);align-items:flex-start;margin:var(--s-4,34px) 0;
        background:rgba(0,135,81,.07);border-left:8px solid var(--accent,#008751);
        border-radius:var(--r-md,20px);padding:var(--s-3,22px) var(--s-4,34px)}
      #sop-f100 .f-aside img{width:110px;height:110px;border-radius:999px;object-fit:cover;flex:0 0 auto}
      #sop-f100 .f-aside .n{font-family:'JetBrains Mono',monospace;font-size:var(--t-meta,30px);
        letter-spacing:2px;color:var(--accent,#008751);text-transform:uppercase}
      #sop-f100 .f-aside .q{font-size:var(--t-lead,47px);line-height:1.4;font-style:italic}
      #sop-f100 .f-opt{display:block;width:100%;text-align:left;cursor:pointer;
        background:var(--sf-card,#fff);border:2px solid var(--sf-bdr,#d0d8c4);border-left:10px solid var(--accent,#008751);
        border-radius:var(--r-md,20px);padding:var(--s-3,22px) var(--s-4,34px);margin-top:var(--s-3,22px);
        font-family:'Outfit',sans-serif;color:var(--ink,#1a2e05);min-height:132px}
      #sop-f100 .f-opt:hover{background:rgba(0,135,81,.06)}
      #sop-f100 .f-opt .l{font-size:var(--t-lead,47px);font-weight:700;line-height:1.3}
      #sop-f100 .f-opt .s{font-size:var(--t-label,34px);color:var(--ink-dim,#7a8b6a);margin-top:var(--s-1,8px)}
      #sop-f100 .f-chips{margin-top:var(--s-2,14px);display:flex;flex-wrap:wrap;gap:var(--s-1,8px)}
      #sop-f100 .f-chip{font-family:'JetBrains Mono',monospace;font-size:var(--t-meta,30px);font-weight:700;
        padding:6px 20px;border-radius:999px;background:#eef2e6;color:var(--ink-mid,#4a5e3a)}
      #sop-f100 .f-chip.good{background:rgba(0,135,81,.15);color:#00693f}
      #sop-f100 .f-chip.bad{background:rgba(204,51,51,.13);color:#a12626}
      #sop-f100 .f-chip.warn{background:rgba(194,65,12,.13);color:#9a3412}
      #sop-f100 .f-cta{background:var(--accent,#008751);color:#fff;border:none;border-radius:999px;
        padding:28px 62px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:var(--t-lead,47px);
        cursor:pointer;margin-top:var(--s-4,34px);min-height:132px}
      #sop-f100 .f-sec{margin-top:var(--s-4,34px)}
      #sop-f100 .f-sec h3{font-family:'Montserrat',sans-serif;font-size:var(--t-title,60px);margin-bottom:var(--s-2,14px)}
      #sop-f100 .f-row{font-size:var(--t-body,40px);line-height:1.5;color:var(--ink-mid,#4a5e3a);
        padding:var(--s-2,14px) 0;border-top:2px solid var(--sf-bdr,#d0d8c4)}
      #sop-f100 .f-row b{color:var(--ink,#1a2e05)}
      #sop-f100 .f-pend{border-left:8px solid #c2410c;padding-left:var(--s-3,22px)}
    `;
  }

  function render() {
    const list = run.beats;
    const b = list[run.i];
    const S = window.SOP || {};
    const rail = list.map((_, i) => `<span class="f-dot ${i < run.i ? "on" : i === run.i ? "now" : ""}"></span>`).join("");

    if (b) {
      try { window.SOP_setMode && window.SOP_setMode(b.mode); } catch (e) {}
      wrap.innerHTML = `<style>${css()}</style>
        <div class="f-wrap">
          <div class="f-rail"><span class="f-day">The First 100 Days · ${esc(b.day)}</span>${rail}</div>
          <div class="f-card">
            <div class="f-day">${esc(b.kicker)}</div>
            <h2>${esc(b.title)}</h2>
            <div class="f-body">${esc(b.body)}</div>
            <div class="f-aside">
              <img src="./sa-halima.png" alt="" onerror="this.style.display='none'"/>
              <div>
                <div class="n">${esc(run.ctx.saName)} · Special Adviser</div>
                <div class="q">${esc(b.aside)}</div>
              </div>
            </div>
            ${b.options.map((o, i) => `
              <button class="f-opt" data-i="${i}">
                <div class="l">${esc(o.label)}</div>
                <div class="s">${esc(o.note)}</div>
                <div class="f-chips">${(o.chips || []).map(c => `<span class="f-chip ${c[1]}">${esc(c[0])}</span>`).join("")}</div>
              </button>`).join("")}
          </div>
        </div>`;
      wrap.querySelectorAll(".f-opt").forEach(btn => btn.addEventListener("click", () => {
        applyOption(b, b.options[parseInt(btn.dataset.i, 10)]);
        run.i++;
        wrap.scrollTop = 0;
        render();
      }));
      return;
    }

    // ── THE REPORT ─────────────────────────────────────────────────────────
    try { window.SOP_setMode && window.SOP_setMode("admin"); } catch (e) {}
    const appNow = Math.round((S.s && S.s.app) || 0);
    const drift = appNow - run.startApp;
    schedulePending();
    wrap.innerHTML = `<style>${css()}</style>
      <div class="f-wrap">
        <div class="f-rail"><span class="f-day">Day 100 · ${esc(run.ctx.stateName)}</span>${rail}</div>
        <div class="f-card">
          <div class="f-day">Situation Report</div>
          <h2>Your first 100 days</h2>
          <div class="f-body">Six decisions. This is what they bought you, and what they cost.</div>

          <div class="f-sec">
            <h3>What you did</h3>
            ${run.log.map(l => `<div class="f-row"><b>${esc(l.day)}</b> — ${esc(l.choice)}<br/><span style="font-size:var(--t-label,34px)">${esc(l.outcome)}</span></div>`).join("")}
          </div>

          <div class="f-sec">
            <h3>Where you stand</h3>
            <div class="f-row">Approval <b>${appNow}%</b> — ${drift >= 0 ? "up" : "down"} ${Math.abs(drift)} points since the oath.</div>
            <div class="f-row">Party stability <b>${Math.round((S.s && S.s.pStab) || 0)}%</b> · Corruption exposure <b>${Math.round(((S.s && S.s.cor) || 0) * 100)}%</b> · Debt <b>${nB((S.s && S.s.debt) || 0)}</b></div>
          </div>

          ${run.owed.length ? `<div class="f-sec"><h3>What you owe</h3>
            ${run.owed.map(o => `<div class="f-row"><b>${esc(o.to)}</b> — ${esc(o.what)}. He expects it by turn ${o.dueBy}.</div>`).join("")}</div>` : ""}

          ${run.exposed.length ? `<div class="f-sec"><h3>What is on paper</h3>
            ${run.exposed.map(x => `<div class="f-row">${esc(x)}</div>`).join("")}</div>` : ""}

          ${run.pending.length ? `<div class="f-sec"><h3>What is coming</h3>
            ${run.pending.map(p => `<div class="f-row f-pend"><b>Turn ${p.turn}</b> — ${esc(p.label)}</div>`).join("")}</div>` : `<div class="f-sec"><h3>What is coming</h3><div class="f-row">Nothing you set in motion is scheduled to explode. Yet.</div></div>`}

          <div class="f-aside">
            <img src="./sa-halima.png" alt="" onerror="this.style.display='none'"/>
            <div>
              <div class="n">${esc(run.ctx.saName)} · Special Adviser</div>
              <div class="q">"${esc(saRead())}"</div>
            </div>
          </div>

          <button class="f-cta" data-act="done">Open the appropriation bill →</button>
        </div>
      </div>`;
    wrap.querySelector("[data-act=done]").addEventListener("click", finish);
  }

  // Halima's read is generated from what actually happened, not from a pool.
  function saRead() {
    const S = window.SOP || {};
    const cor = ((S.s && S.s.cor) || 0) * 100, app = (S.s && S.s.app) || 0;
    if (run.pending.length >= 2) return "Two of your first six decisions have a court date or a strike attached. We should spend the budget cycle buying ourselves cover.";
    if (cor > 45) return "Sir, at this exposure level the EFCC does not need an informant — the file writes itself. Whatever we do next must be visibly clean.";
    if (run.owed.length) return "You have an unpaid promise walking around with a phone. He will call during the budget, not after it.";
    if (app >= 62) return "The street likes you. That is a currency and it depreciates. Spend it on something with concrete in it.";
    return "A quiet hundred days. Quiet is not the same as safe — the Assembly has been watching and has not yet had to vote.";
  }

  function finish() {
    try { window.SOP_setMode && window.SOP_setMode("admin"); } catch (e) {}
    const S = window.SOP;
    if (S && S.addL) S.addL("🏛️ First 100 days concluded. The appropriation bill is now before you.", "info");
    try {
      window.SOP_LEDGER && window.SOP_LEDGER.append({
        kind: "milestone", actor: "governor", gravity: 1, evidence: 1,
        note: "First 100 days concluded",
        outcome: `${run.log.length} decisions taken; ${run.pending.length} consequence(s) pending; ${run.owed.length} debt(s) outstanding.`,
      });
    } catch (e) {}
    wrap.remove();
    wrap = null;
  }

  /* ───────────────────────── MOUNT ───────────────────────── */

  function buildCtx() {
    const S = window.SOP || {};
    const seed = ((S.state || "XX").length * 977) + ((S.pName || "").length * 31) + 7;
    const sd = S.sd || {};
    const cap = (S.SNAMES_REF && S.state) ? null : null;
    return {
      stateName: (S.state || "the state").replace(/_/g, " "),
      capital: sd.capital || ((S.state || "the state").replace(/_/g, " ") + " city"),
      saName: (S.saOffice && S.saOffice.adviser && S.saOffice.adviser.name) || (S.setup && S.setup.saName) || "Halima Bala",
      gfName: localName(seed * 3 + 5),
      nominee: localName(seed * 11 + 2),
      technocrat: localName(seed * 17 + 9),
      loyalist: localName(seed * 23 + 4),
      reporter: localName(seed * 29 + 6),
      paper: ["The Punch", "Premium Times", "Daily Trust", "The Cable", "Vanguard"][Math.abs(seed) % 5],
      roadName: (S.state || "State").replace(/_/g, " ") + " Ring Road (Phase 1)",
      roadCost: 12 + (Math.abs(seed) % 9),
      shortfall: 2 + (Math.abs(seed) % 4),
      arrears: 3 + (Math.abs(seed * 3) % 5),
      loan: 6 + (Math.abs(seed * 5) % 5),
      _cap: cap,
    };
  }

  function mount() {
    const S = window.SOP;
    if (!S || wrap) return;
    const ctx = buildCtx();
    run = { i: 0, log: [], owed: [], exposed: [], pending: [], gfShift: 0, lastLedgerId: null, ctx, startApp: Math.round((S.s && S.s.app) || 55) };
    run.beats = beats(ctx);
    wrap = document.createElement("div");
    wrap.id = "sop-f100";
    document.body.appendChild(wrap);   // redirected into the scaled stage by the shell
    render();
  }

  // Fires once, on the first turn of a genuinely new run. A loaded save already
  // has wiki history or a cabinet, so it is skipped there.
  let done = false;
  window.addEventListener("sop-state", () => {
    if (done) return;
    const S = window.SOP;
    if (!S || S.turn !== 1) return;
    if ((S.wikiEvents && S.wikiEvents.length) || (S.ministries && S.ministries.length)) { done = true; return; }
    if (!S.setS || !S.s) return;
    done = true;
    setTimeout(mount, 400);
  });

  window.SOP_F100_replay = () => { done = true; if (!wrap) mount(); };

  console.log("[SOP F100] First 100 Days slice ready");
})();
