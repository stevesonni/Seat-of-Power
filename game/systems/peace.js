/* Peace Plans: ending a security front for good (player feedback, October 2026).
   The Security Council's yearly choices only push a front down for a year.
   A Peace Plan is a commitment over about four years: Clear, Hold, Build and
   Seal, one step a year, each with the right way, the cheap way and the
   crooked way. Shortcuts can relapse (one step back, not to zero). When the
   last step is done the front closes for good: no more yearly growth, no
   toll, a peace dividend. Two years on, the peace needs funding once more.

   The President's fronts are SYS.FRONTS (ne, nw, se, ss). The Governor's
   plan is one: making the state safe, which ends its security crises.
   Rules only, no React. */

// opt: { l, cost (₦B), sev (the front's change), fx, relapse (chance), cor }
const O = (l, cost, sev, fx = {}, relapse = 0, note = "") => ({ l, cost, sev, fx, relapse, note });
const ways = (a, b, c, cost) => [
  { id: "proper", ...O(a[0], cost, -15, a[1] || {}, 0, a[2]) },
  { id: "cheap", ...O(b[0], Math.round(cost * .5 * 10) / 10, -10, b[1] || {}, .25, b[2]) },
  { id: "crooked", ...O(c[0], Math.round(cost * .7 * 10) / 10, -10, { cor: .02, ...(c[1] || {}) }, .45, c[2]) },
];

export const PEACE_STEP_NAMES = ["Clear", "Hold", "Build", "Seal"];
// Before Hold, Build and Seal, the front must have cooled to this (0–100).
export const PEACE_GATES = [100, 55, 45, 35];

export const PEACE = {
  ne: { nm: "the North-East", war: "the insurgency", zone: "NE", img: "scenes/idp-return",
    end: { headline: "THE WAR IN THE NORTH-EAST IS OVER", sub: "Families go home to Borno, Yobe and Adamawa" },
    dividend: { app: 4, sec: .04, agr: .02, text: "Families leave the camps and go home; farms around Lake Chad are planted again." },
    steps: [
      ways(["A full offensive to retake every town, with the air force", { app: 1 }, "Town by town, the flag goes back up."], ["Air strikes only", {}, "The camps burn; the fighters move on."], ["Let a favoured contractor supply the offensive", {}, "The boots arrive. Half the ammunition does not."], 40),
      ways(["Police, the civilian JTF and the army hold each town together", {}, "The towns stay taken."], ["Leave the vigilantes to hold them", {}, "Cheap. The vigilantes have their own scores to settle."], ["Pay ghost vigilantes", {}, "On paper, every town is held."], 25),
      ways(["Rebuild the towns: schools for the almajiri, jobs and deradicalisation camps", { app: 2 }, "Young men have something to lose."], ["Rebuild the towns, skip the schools", {}, "Houses without classrooms."], ["Award the rebuilding to friends", {}, "The schools are on the brochure."], 35),
      ways(["A joint force with Chad, Niger and Cameroon to close the borders", { app: 2 }, "The last supply routes close."], ["Patrol our side of the border only", {}, "They cross where we are not."], ["Let the border chiefs keep their 'arrangements'", {}, "The smugglers' routes stay open."], 30),
    ] },
  nw: { nm: "the North-West", war: "banditry", zone: "NW", img: "decisions/herder",
    end: { headline: "THE BANDITS LAY DOWN THEIR GUNS", sub: "Farmers go back to the fields across the North-West" },
    dividend: { app: 4, sec: .03, agr: .04, text: "Farmers return to the fields; the markets of Zamfara, Katsina and Sokoto reopen." },
    steps: [
      ways(["Forest operations to clear the bandit camps", { app: 1 }, "The forests are no longer theirs."], ["Air strikes on the camps", {}, "Some camps burn; villages too."], ["Pay the bandit kingpins to move", {}, "They move to the next state."], 35),
      ways(["State police and forest guards hold the cleared forests", {}, "Someone is always on watch."], ["Leave it to the vigilantes", {}, "Vigilantes, and their reprisals."], ["Recruit the guards through the party", {}, "Loyal guards, who cannot shoot."], 25),
      ways(["Ranches, grazing reserves, rural roads and regulated mining", { app: 2, agr: .01 }, "The fights over land and gold have rules now."], ["Ranches only", {}, "The miners keep paying the bandits."], ["Give the mining licences to friends", {}, "The gold still funds the guns."], 35),
      ways(["Disarm and register the fighters, with a peace pact under the emirs", { app: 2 }, "A pact signed in the emir's palace."], ["An amnesty without disarmament", {}, "They keep the guns 'for protection'."], ["A secret payment to the kingpins", {}, "Peace, until the money runs out."], 25),
    ] },
  se: { nm: "the South-East", war: "the separatist sit-at-homes", zone: "SE", img: "scenes/army-convoy",
    end: { headline: "THE SIT-AT-HOME IS CALLED OFF FOR GOOD", sub: "Markets in Onitsha, Aba and Enugu open on Mondays again" },
    dividend: { app: 4, sec: .03, igr: 6, text: "Monday markets reopen; traders in Onitsha and Aba are back at work, and taxes with them." },
    steps: [
      ways(["Target the gunmen who enforce the sit-at-home, not the markets", { app: 1 }, "The enforcers go quiet; traders open their shops."], ["Saturate the towns with checkpoints", { app: -1 }, "Every road is a checkpoint, and every checkpoint wants money."], ["Mass arrests to show strength", { app: -2 }, "The prisons fill with young men; so does the anger."], 25),
      ways(["Dialogue with the elders, the church and Ohanaeze", { app: 2 }, "The elders say this is the first real hearing in years."], ["One summit, for the cameras", {}, "A photograph and a communiqué."], ["Buy the endorsement of a few elders", {}, "The young men call them traitors."], 15),
      ways(["The bridge, the rail line and an industrial park; a fair share of federal posts", { app: 3 }, "The region sees itself in Abuja's plans."], ["The industrial park only", {}, "Factories, but no road to them."], ["Let contractors stall the rail line", {}, "The rail line is announced again."], 40),
      ways(["A political settlement: the courts for the detained leaders, and an end to the order", { app: 3 }, "The order is withdrawn on national television."], ["A quiet deal with the hard core", {}, "The order is suspended. For now."], ["Declare victory and move on", {}, "The order is still on the walls."], 20),
    ] },
  ss: { nm: "the Niger Delta", war: "oil theft and militancy", zone: "SS", img: "scenes/navy-patrol",
    end: { headline: "PEACE IN THE CREEKS: OIL OUTPUT AT A TEN-YEAR HIGH", sub: "The pipelines are guarded by the communities they cross" },
    dividend: { app: 3, sec: .02, faacPct: .08, text: "Oil output climbs back; the Federation Account fills up." },
    steps: [
      ways(["The Navy and drones in the creeks, and the illegal refineries shut", { app: 1 }, "The kpofire camps go dark."], ["Raids on the biggest camps only", {}, "The small ones move deeper into the creeks."], ["Let the 'protectors' keep their cut", {}, "The theft continues under new management."], 30),
      ways(["Renew the amnesty, paid honestly to every name on the list", { app: 1 }, "The ex-militants get what they were promised."], ["Pay the amnesty to the leaders only", {}, "The foot soldiers get nothing."], ["Pad the amnesty list", {}, "Ghost militants are paid on time."], 25),
      ways(["The host-community trust fund, the clean-up and licensed modular refineries", { app: 2 }, "Communities finally see the oil money."], ["The trust fund only", {}, "Money, but the creeks are still black."], ["Give the clean-up contracts to friends", {}, "The clean-up is a signboard."], 35),
      ways(["The communities own the pipeline security contracts", { app: 2 }, "No one taps a pipeline their own cousins guard."], ["Give the contracts to one ex-general", {}, "One man guards everything."], ["Share the contracts among the politicians", {}, "The pipelines are 'secured' on paper."], 20),
    ] },
};

// The Governor's plan: one, for the whole state.
export const STATE_PEACE = { nm: "the state", war: "insecurity", img: "scenes/army-convoy",
  end: { headline: (st) => st.toUpperCase() + " IS SAFE AGAIN", sub: "Roads open at night; villages sleep" },
  dividend: { app: 4, sec: .05, agr: .01, text: "Highways are open after dark; farmers sleep in their villages again." },
  // The state crises this plan ends (STATE_CRISES ids in the game).
  ends: ["bandits_tax", "school_abduction", "insurgent_attack", "farmer_herder", "sit_at_home", "cult_clash", "illegal_refinery"],
  steps: [
    ways(["A state security outfit, trained with the police", { sec: .02 }, "Its own uniforms, its own patrols."], ["Arm the local vigilantes", {}, "Cheap, and they answer to nobody."], ["Hire the outfit through the party", {}, "The outfit is full of thugs."], 3),
    ways(["Community policing with the traditional rulers", { sec: .01, app: 1 }, "Every village has a phone number to call."], ["A hotline, and nothing behind it", {}, "Calls ring out."], ["Pay the rulers for silence", {}, "Quiet, until it isn't."], 1.5),
    ways(["Jobs and skills for young men in the hot spots", { app: 2 }, "Recruiters find fewer takers."], ["A one-off empowerment programme", {}, "Motorcycles and sewing machines, once."], ["Empowerment through party chairmen", {}, "Party boys get the money."], 3),
    ways(["Peace committees, forest guards and a law to keep them", { sec: .02, app: 2 }, "The peace has a budget line and a law."], ["Peace committees, unfunded", {}, "They meet once."], ["A security vote nobody accounts for", {}, "The money vanishes into 'security'."], 2),
  ] };

/* A plan: { front, step (0–4), started, relapses, lastTurn, closed, after }.
   The next step's card, or null if it cannot move this year (and why). */
export const peaceStep = (plan, def) => (def && plan && plan.step < 4 ? def.steps[plan.step] : null);
export const peaceBlock = (plan, sev) => {
  if (!plan || plan.step >= 4) return null;
  const g = PEACE_GATES[plan.step];
  return sev != null && sev > g ? "The front must cool to " + g + " or below before " + PEACE_STEP_NAMES[plan.step] + " (it is at " + Math.round(sev) + ")." : null;
};
// Take a step: the way chosen and a roll. → { plan, sev, fx, relapsed, closed }
export const peaceChoose = (plan, way, r = Math.random, turn = 0) => {
  const relapsed = way.relapse > 0 && r() < way.relapse;
  const step = relapsed ? Math.max(0, plan.step - 1) : plan.step + 1;
  const next = { ...plan, step, lastTurn: turn, relapses: (plan.relapses || 0) + (relapsed ? 1 : 0), ways: [...(plan.ways || []), way.id] };
  const closed = !relapsed && step >= 4;
  if (closed) next.closed = turn;
  return { plan: next, sev: relapsed ? 10 : way.sev, fx: way.fx || {}, relapsed, closed };
};
// At most two plans at a time; a closed front has no plan to start.
export const PEACE_MAX = 2;
export const peaceActive = (plans = {}) => Object.values(plans).filter(p => p && p.step < 4 && !p.closed);
export const peaceCanStart = (plans = {}, front) => !(plans[front]) && peaceActive(plans).length < PEACE_MAX;
// Two years after a front closes, the peace needs funding once more.
export const peaceAftershockDue = (plan, turn) => !!(plan && plan.closed && !plan.after && turn >= plan.closed + 2);
export const PEACE_AFTERSHOCK_COST = { ne: 15, nw: 15, se: 10, ss: 15, state: 1 };
