/* Life after office (rules only, no React). After two full terms a governor can stay in
   the game for a short epilogue: three moments in the successor's first term. The
   successor has a mind of their own: grateful, independent or ambitious, rolled per run.
   The question is not "now you can demand contracts", it is: "You spent eight years
   resenting interference. What do you do when your successor ignores your advice?" */
import { seeded } from "./rng.js";

export const SUCCESSOR_KINDS = ["grateful", "independent", "ambitious"];
export const heirKind = (seed, gfSucc) => gfSucc === "his" ? "ambitious" : SUCCESSOR_KINDS[Math.floor(seeded(seed, "successor")() * 3)];
export const ROLES = {
  adviser: { l: "Offer advice, ask for nothing", d: "You will be the elder statesman they call when it is hard." },
  godfather: { l: "Ask for your people in three ministries", d: "You made them. You want a say in how they govern." },
  elder: { l: "Back the party, not the person", d: "You become a party elder, above the day-to-day." },
};
/* Step 1: how the successor takes your role. */
export const firstAnswer = (kind, role) => {
  if (role === "godfather") return kind === "grateful" ? { ok: true, line: "“Of course, Your Excellency. Send me the names.” Your people take three ministries." }
    : kind === "independent" ? { ok: false, line: "“With respect, I will choose my own cabinet.” The names you sent come back unopened." }
    : { ok: true, line: "“Two ministries, not three. And I choose which.” A bargain, for now." };
  if (role === "adviser") return kind === "ambitious" ? { ok: false, line: "Your successor thanks you warmly and stops returning your calls within a month." } : { ok: true, line: "They call you every Sunday evening, for the first year at least." };
  return { ok: true, line: "The party makes you chairman of its board of trustees. Both factions court you." };
};
/* Step 2: they ignore your advice on your own flagship. */
export const IGNORED = { t: "Your successor cancels your flagship", d: "“{flag}”, the programme you built your eight years on, is cut from the new budget to fund a new airport. Nobody called you first.",
  opts: [{ id: "quiet", l: "Say nothing", note: "It is their government now." }, { id: "public", l: "Say so in public", note: "Your voice still carries. It also divides the party." }, { id: "house", l: "Call your loyalists in the House", note: "You can stop the budget. You can also start a war." }] };
/* The epilogue's end: what you became, and what survived. */
export const elderEnding = (kind, role, first, choice) => {
  const war = choice === "house", loud = choice === "public";
  const saved = war ? kind !== "independent" : loud ? kind === "grateful" : false;
  const title = war ? (saved ? "The kingmaker" : "The ex-governor at war") : loud ? "The conscience of the party" : role === "godfather" && first.ok ? "The power behind the throne" : role === "elder" ? "The party elder" : "The elder statesman";
  const line = (saved ? "Your flagship survives: the House restores it in the budget. " : "Your flagship is cut. The signboards fade. ") +
    (war ? (saved ? "Your successor learned who still holds the House." : "Your successor's people call you the godfather you swore you would never be.") : loud ? "People quote you on the radio; your successor stops inviting you to state events." : "You watch it from your farm, and say nothing in public.");
  return { title, line, saved };
};
