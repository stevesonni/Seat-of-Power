/* The Head of the Civil Service (rules only, no React). The governor appoints
   one on the Special Adviser's recommendation. From then on, commissioners'
   requests go to the Head of Service, who decides each one in character and
   reports them all together; the governor reverses any decision before
   signing the brief off. */
import { seeded } from "./rng.js";

// How a Head of Service handles a commissioner's request.
export const HOS_STYLES = {
  careful: { nm: "Careful", d: "Checks every naira. Asks for a plan before releasing money, and sets targets.", fund: "plan", report: "more" },
  generous: { nm: "Generous", d: "Backs the ministries. Releases money when it is asked for, and praises good work.", fund: "fund", report: "praise" },
  strict: { nm: "Strict", d: "Hard on weak ministries. Turns down requests that are not earned, and raises the bar.", fund: "no", report: "more" },
};
const PORTRAITS = [{ img: "civil-servant", female: true }, { img: "permanent-secretary", female: false }, { img: "lga-treasurer", female: false }];
const RECORDS = {
  careful: "Twenty-six years in the service; ran the state's budget office through two recessions.",
  generous: "Rose from the ministry of health; known as the ministries' friend in the Secretariat.",
  strict: "Led the last payroll audit and removed four thousand ghost workers.",
};

/* Three candidates, one of each style, with a portrait each (the names are
   given by the game, which knows the state's naming). */
export const hosCandidates = (seed, names = []) => {
  const r = seeded(seed, "hos");
  const styles = ["careful", "generous", "strict"].sort(() => r() - .5);
  const pics = PORTRAITS.slice().sort(() => r() - .5);
  return styles.map((style, i) => ({ id: "hos" + i, name: names[i] || "Candidate " + (i + 1), style, img: pics[i].img, female: pics[i].female, record: RECORDS[style] }));
};
/* The Special Adviser's pick: careful when money is tight or corruption is
   high, strict when the ministries are failing, generous when they deliver. */
export const hosRecommend = (cands, ctx = {}) => {
  const want = (ctx.cor || 0) > .4 || (ctx.cash || 0) < 1 ? "careful" : (ctx.perf || 50) < 45 ? "strict" : (ctx.perf || 50) > 65 ? "generous" : "careful";
  const c = cands.find(x => x.style === want) || cands[0];
  const why = { careful: "the treasury is tight and every request needs a plan behind it", strict: "too many ministries are failing and need a firm hand", generous: "the ministries are delivering and deserve backing" }[c.style];
  return { id: c.id, why };
};

/* What the Head of Service decides on one request (an audience with options). */
export const hosDecide = (hos, a, cash = 0) => {
  const S = HOS_STYLES[hos.style] || HOS_STYLES.careful, has = (id) => a.options.find(o => o.id === id);
  if (has("fund")) {
    const want = S.fund === "fund" && cash < .5 ? "plan" : S.fund;
    return has(want) || has("plan") || a.options[0];
  }
  return has(S.report) || a.options[0];
};

/* One line of the brief, in the Head of Service's voice. */
const DID = { fund: "I released the ₦500M, with results due next year.", plan: "I gave a recovery plan instead.", no: "I declined.", praise: "I praised them in public on your behalf.", more: "I set a harder target for next year." };
export const hosLine = (m, a, o) => {
  const asked = a.options.some(x => x.id === "fund") ? "asked for ₦500M to get stalled work moving" : "came to report that the ministry hit its targets";
  return "Hon. " + m.minister + ", Commissioner for " + m.name + ", " + asked + ". " + (DID[o.id] || "I chose: " + o.label.toLowerCase() + ".");
};
