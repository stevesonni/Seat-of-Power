/* Public complaints (rules only, no React). The street's voices, made
   answerable: each complaint comes from something real in the game (unpaid
   salaries, a failed need, an abandoned site, corruption, a crisis still
   running), names a place, and can be answered three ways:
     talk   answer on the radio or visit: free, once per complaint, a little
            goodwill; if the cause is still there next year, they say you lied;
     send   send the commissioner or minister in charge: free, and it works if
            they are good at the job;
     fix    go to the real fix (pay the arrears, restart the site, start the
            project): the complaint ends when its cause does.
   A complaint left unanswered at the year's end costs approval and its zone's
   mood. All people are fictional. */

const PEOPLE = ["Mama Ngozi, trader", "Aliyu, okada rider", "Mrs Adebayo, teacher", "Emeka, mechanic", "Hajiya Binta, food seller", "Tunde, graduate", "Pastor Okon", "Malam Sani, farmer", "Blessing, nurse", "Chidi, keke driver"];
const pick = (arr, k) => arr[Math.abs(k) % arr.length];
const h = (s) => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };

/* ctx: { nat, place (state or nation), arrears, needs: [{ id, lga, status, k, zone }],
   stalled: [{ id, title, lga, zone }], cor, house: { loyal, seats }, balance (zone name),
   stories: [{ id, nm, lga, zone }], strikes: [{ id, nm }], app, crisis: { nm, heat },
   fronts: [{ id, nm, zone, sev }], minister: (kind) => { name, perf } | null, memo: stored
   answers { [id]: { how, t } }, turn } */
export const complaintsFor = (ctx) => {
  const out = [], m = ctx.memo || {}, nat = !!ctx.nat, gov = nat ? "the President" : "the governor";
  const add = (c) => { const prev = m[c.id]; const lied = prev && prev.how === "talk" && prev.t < ctx.turn; out.push({ ...c, prev, lied, t: lied ? c.lie : c.t, who: c.who || pick(PEOPLE, h(c.id)) }); };
  if (ctx.arrears > 0) add({ id: "arrears", icon: "💸", kind: "workers", who: pick(["Mrs Adebayo, civil servant", "Blessing, nurse"], ctx.turn),
    t: "Na " + ctx.arrears + " month" + (ctx.arrears === 1 ? "" : "s") + " now dem never pay us. My landlord don give me quit notice.",
    lie: "Last year " + gov + " promised on radio say salary go come. We still dey wait.", want: "Pay the salaries owed", fix: "tre", minister: "finance", sev: 1 + Math.min(3, ctx.arrears) });
  (ctx.needs || []).filter(n => n.status === "failed" || n.status === "open").slice(0, 2).forEach(n => add({ id: "need:" + n.id, icon: "🏘️", kind: "community", place: n.lga, zone: n.zone,
    t: n.status === "failed" ? "Dem come " + n.lga + " campaign, dance, share rice. Since then? Nothing. People die here." : "For " + n.lga + ", we don write letter, we don march. " + (n.title ? n.title + "." : "Nobody hear us."),
    lie: "Dem visit " + n.lga + " last year, snap picture, go. Nothing change.", want: n.ask ? n.ask.replace(/\.$/, "") + " in " + n.lga : "Deliver what " + n.lga + " needs", fix: "prj", minister: n.ministry || null, sev: n.status === "failed" ? 2 : 1 }));
  (ctx.stalled || []).slice(0, 1).forEach(p => add({ id: "stall:" + p.id, icon: "🚧", kind: "community", place: p.lga, zone: p.zone, who: "Emeka, mechanic",
    t: "The contractor don pack him caterpillar commot from " + (p.lga || "here") + ". E say government never pay am.",
    lie: "Last year dem talk say the site go restart. The grass don cover the caterpillar.", want: "Restart " + (p.title || "the abandoned site"), fix: "prj", minister: "works", sev: 2 }));
  if (ctx.cor > .5) add({ id: "cor", icon: "🧾", kind: "youth", who: "Tunde, graduate", t: "Their children dey school abroad, our own dey sit for floor. Where the money dey go?",
    lie: "Dem talk say dem go probe. Na the same people still dey there.", want: "Prosecute someone, and publish the contracts", fix: "cab", minister: null, sev: 2 });
  if (ctx.house && ctx.house.loyal < ctx.house.seats / 2) add({ id: "house", icon: "🏛️", kind: "youth", who: "Aliyu, okada rider", t: (nat ? "Senators" : "Assembly members") + " dey cross carpet like say na bus stop. Wahala dey come.",
    lie: "Na still the same wahala for " + (nat ? "the Senate" : "the Assembly") + ".", want: "Win back the " + (nat ? "National Assembly" : "House"), fix: "gov", minister: null, sev: 1 });
  if (ctx.balance) add({ id: "balance:" + ctx.balance, icon: "⚖️", kind: "elders", who: "An elder from " + ctx.balance, zoneName: ctx.balance, t: "All the " + (nat ? "ministers" : "commissioners") + " from one side? Are we not part of this " + (nat ? "country" : "state") + "?",
    lie: "You came to talk to us last year. The " + (nat ? "cabinet" : "cabinet") + " is still the same.", want: "Appoint someone from " + ctx.balance, fix: "cab", minister: null, sev: 1 });
  (ctx.stories || []).slice(0, 1).forEach(st => add({ id: "story:" + st.id, icon: "🚨", kind: "community", place: st.lga, zone: st.zone, t: "Since " + st.nm.replace(/^The /, "the ") + " start for " + st.lga + ", our life don scatter. Who go help us?",
    lie: "You talk say help dey come for " + st.lga + ". We never see am.", want: "Deal with " + st.nm.replace(/^The /, "the "), fix: "gov", minister: null, sev: 2 }));
  (ctx.strikes || []).slice(0, 1).forEach(s => add({ id: "strike:" + s.id, icon: "✊", kind: "workers", who: s.id === "asuu" ? "Tunde, graduate" : "Mrs Adebayo, teacher", t: s.id === "asuu" ? "My younger brother don stay house one year. School no dey. Wetin una dey do?" : "Everything don close. No hospital, no school. Settle with the unions!",
    lie: "Una talk say una go settle the strike. E still dey.", want: "End the " + s.nm + " strike", fix: "gov", minister: "labour", sev: 2 }));
  if (nat && ctx.crisis && ctx.crisis.heat >= 50) add({ id: "crisis", icon: "🔥", kind: "youth", t: /fuel/i.test(ctx.crisis.nm) ? "Fuel don cost pass my salary. How we go take reach work?" : /naira/i.test(ctx.crisis.nm) ? "Bag of rice don pass minimum wage. Na so we go dey live?" : "Our village don empty. Who go protect us?",
    lie: "Last year " + gov + " talk say e don end. E never end.", want: "Get " + ctx.crisis.nm.replace(/^The /, "the ") + " under control", fix: "gov", minister: null, sev: 2 });
  if (nat) (ctx.fronts || []).filter(f => f.sev >= 65).slice(0, 1).forEach(f => add({ id: "front:" + f.id, icon: "🛡️", kind: "community", zoneName: f.zone, who: "A farmer from the " + f.zone, t: "For the " + f.zone + ", we no fit go farm again. Bandits everywhere.",
    lie: "Soldiers come last year, take picture, go. The bandits come back.", want: "Put the army where the " + f.zone + " needs it", fix: "gov", minister: "defence", sev: 2 }));
  if (!out.length && ctx.app < 45) add({ id: "mood", icon: "😤", kind: "youth", t: "This government don tire us. Na election we dey wait.", lie: "Talk talk. Na election we dey wait.", want: "Show them something", fix: "gov", minister: null, sev: 1 });
  return out.slice(0, 5);
};

/* The ways to answer a complaint. talked: it already had its free answer.
   minister: { name, perf } for whoever is in charge, if anyone. */
export const complaintAnswers = (c, { minister = null, nat = false } = {}) => {
  const a = [];
  if (!c.prev) {
    a.push(c.place || c.zoneName ? { id: "visit", how: "talk", l: "Go to " + (c.place || "the " + c.zoneName) + " yourself", note: "Free. They see you came. If nothing changes, they will remember the visit.", fx: { app: 1 }, dz: 2 }
      : { id: "radio", how: "talk", l: "Answer them on " + (nat ? "national television" : "the radio"), note: "Free, once. Words now; they will hold you to them.", fx: { app: 1 }, dz: 1 });
    if (minister) a.push({ id: "send", how: "send", l: "Send " + minister.name + " to sort it out", note: (minister.perf || 50) >= 60 ? "Free. They are good at this." : "Free. They have not been good at this.", ok: (minister.perf || 50) >= 60, fx: (minister.perf || 50) >= 60 ? { app: 1 } : { app: -1 }, dz: (minister.perf || 50) >= 60 ? 2 : -1 });
  }
  a.push({ id: "fix", how: "fix", l: "Fix it: " + c.want.charAt(0).toLowerCase() + c.want.slice(1), note: "Opens the real fix. The complaint ends when its cause does.", go: c.fix });
  return a;
};

/* The year's end: an unanswered complaint costs approval and its zone's
   mood; one answered only with talk whose cause is still there costs more
   next year (it comes back as "you lied"). Returns { app, zones: { key: delta }, lines }. */
export const complaintsYear = (list, memo = {}, year) => {
  let app = 0; const zones = {}, lines = [];
  list.forEach(c => {
    const ans = memo[c.id], unanswered = !ans || (year != null && ans.t < year);
    if (!unanswered) return;
    app -= (ans ? 1.5 : 1) * ((c.sev || 1) > 1 ? 1 : .5); // talk that changed nothing costs more than silence
    const z = c.zone != null ? c.zone : c.zoneName; if (z != null) zones[z] = (zones[z] || 0) - 1;
    lines.push((ans ? "They say you lied: " : "Unanswered: ") + c.want.charAt(0).toLowerCase() + c.want.slice(1) + " (" + c.who + ").");
  });
  return { app: Math.max(-4, Math.round(app)), zones, lines };
};
