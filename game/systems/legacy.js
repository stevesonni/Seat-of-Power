/* What happens to your work after you leave (player feedback, October 2026):
   not every successor tears it down. Who follows you decides what is
   finished, and you can see it coming: each unfinished project has odds of
   surviving you, raised by progress, a proper handover, a public pledge and
   clean work. "Five years later" tells what became of it all.
   Rules only, no React. */

export const SUCC_KINDS = {
  heir: { nm: "Your loyal heir", line: "Finishes what you started and cuts the ribbons in your name.", bonus: .25, peace: .75 },
  technocrat: { nm: "A technocrat", line: "Keeps what works; scraps what is padded or failing.", bonus: 0, peace: .6 },
  rival: { nm: "A party rival", line: "Has their own agenda: finishes only what is protected, popular or nearly done.", bonus: -.1, peace: .35 },
  opposition: { nm: "The opposition", line: "Reviews everything you did, cancels what it can, and reads your files.", bonus: -.25, peace: .2 },
};
/* The successor's kind from the succession: { kind, loyal, won, betrayed }
   (the game's successionOutcome). Before anyone is anointed, a party rival. */
export const successorKind = (so) => {
  if (!so) return "rival";
  if (so.kind === "opposition" || so.won === false) return "opposition";
  if (so.betrayed) return "rival";
  if (so.kind === "technocrat") return "technocrat";
  if (so.kind === "deputy" || so.kind === "cabinet" || (so.loyal || 0) >= .6) return "heir";
  return "rival";
};
// How much of a project is built (0–1).
export const builtShare = (p) => { if (!p) return 0; if (p.status === "delivered") return 1; if (p.progress != null) return Math.max(0, Math.min(1, p.progress / 100)); const est = p.estimateM || 0; if (!est) return 0; return Math.max(0, Math.min(1, (p.builtM || 0) / est)); };
/* The odds an unfinished project is finished after you (0.05–0.98).
   ctx: { kind, handover: "full" | "brief" | "none" | undefined, pledged (project id), app } */
export const surviveOdds = (p, ctx = {}) => {
  if (!p) return 0;
  if (p.status === "delivered") return 1;
  if (p.status === "abandoned" || p.status === "cancelled") return 0;
  const f = builtShare(p), K = SUCC_KINDS[ctx.kind] || SUCC_KINDS.rival;
  let o = f >= .75 ? .85 : .3 + .6 * f;
  o += K.bonus;
  if (ctx.kind === "technocrat") o += (p.quality == null ? 0 : p.quality >= .7 ? .15 : p.quality < .5 ? -.2 : 0);
  if (p.protected) o += .15;
  if (ctx.handover === "full") o += .1; else if (ctx.handover === "none") o -= .1;
  if (ctx.pledged && ctx.pledged === p.id) o += ctx.kind === "heir" ? .5 : ctx.kind === "opposition" ? 0 : .25;
  if (ctx.app != null) o += (ctx.app - 50) / 250;
  return Math.max(.05, Math.min(.98, Math.round(o * 100) / 100));
};
// A project started now finishes after the term when its last year is past the term's last.
export const finishesAfterTerm = (startTurn, years, lastTurn = 8) => startTurn + Math.max(1, years) - 1 > lastTurn;

/* Five years later: what became of each unfinished project and each Peace
   Plan, decided once with a seeded roll. projects: the game's projects;
   peace: stc.peace; ctx as surviveOdds plus { name } (the successor's name).
   → { kind, rows: [{ title, finished, text }], peace: [{ where, held, text }], kept, lost, pledgeBroken } */
export const legacyAfter = (projects = [], peace = {}, ctx = {}, r = Math.random) => {
  const kind = ctx.kind || "rival", K = SUCC_KINDS[kind], who = ctx.name || "your successor";
  const open = projects.filter(p => p && p.status !== "delivered" && p.status !== "abandoned" && p.status !== "cancelled" && p.status !== "proposed");
  const rows = open.map(p => { const o = surviveOdds(p, { ...ctx, kind }), done = r() < o;
    const broke = !done && ctx.pledged === p.id;
    return { id: p.id, title: p.title, finished: done, odds: o, broke,
      text: done ? (kind === "heir" ? who + " finished it and cut the ribbon in your name." : kind === "technocrat" ? who + " finished it: the numbers made sense." : who + " finished it, and took the credit.")
        : broke ? who + " promised to finish it, then let it rot." : kind === "opposition" ? who + "'s review cancelled it." : "Abandoned: weeds grow over the site." }; });
  const pz = Object.entries(peace || {}).filter(([, P]) => P).map(([k, P]) => {
    if (P.closed) { const held = P.after !== "lapsed" || r() < .5; return { front: k, held, text: held ? "The peace you made still holds." : "The peace frayed after the money stopped." }; }
    const held = r() < K.peace * (1 - (P.relapses || 0) * .1) * (.6 + .1 * (P.step || 0));
    return { front: k, held, text: held ? who + " finished the Peace Plan you started (step " + ((P.step || 0) + 1) + " of 4 when you left)." : who + " let the Peace Plan you started lapse." };
  });
  return { kind, nm: K.nm, rows, peace: pz, kept: rows.filter(x => x.finished).length, lost: rows.filter(x => !x.finished).length, pledgeBroken: rows.some(x => x.broke) };
};
