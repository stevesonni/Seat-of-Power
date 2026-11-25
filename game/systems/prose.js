/* Turning a choice into a sentence (owner, 25 Nov 2026: the biography "reads like a raw event log… sentences assembled
   from event templates with colons… convert choices to outcomes"). A choice's label is an imperative ("Pay the whole
   revitalisation fund: ₦368.3B"); the record and the biography need prose ("…by paying the whole revitalisation fund
   (₦368.3B)", "paid the whole revitalisation fund"). Headlines are written in the present ("Bandits have kidnapped…");
   a history is written in the past. Rules only, no React. */

const IRREG_PAST = { pay: "paid", give: "gave", make: "made", send: "sent", take: "took", leave: "left", cut: "cut", set: "set", put: "put", let: "let", run: "ran", shut: "shut",
  buy: "bought", bring: "brought", hold: "held", keep: "kept", sell: "sold", tell: "told", build: "built", spend: "spent", meet: "met", fight: "fought", win: "won", lose: "lost",
  go: "went", do: "did", have: "had", be: "was", say: "said", sit: "sat", stand: "stood", lead: "led", lend: "lent", break: "broke", choose: "chose", fly: "flew", draw: "drew",
  pull: "pulled", seek: "sought", teach: "taught", swear: "swore", hide: "hid", find: "found", feed: "fed", forgive: "forgave", withdraw: "withdrew", overrule: "overruled", quit: "quit" };
// Words that open a choice as a verb (so a label can be told from a title).
const VERB = /^(accept|add|admit|adopt|agree|allow|announce|appeal|apply|appoint|approve|arm|arrest|ask|attend|audit|award|back|ban|bank|blame|block|borrow|break|bring|build|buy|call|cancel|cap|change|charge|choose|clean|clear|close|commission|concede|condemn|cooperate|cover|create|cut|deal|declare|defend|defy|delay|demand|demolish|deny|deploy|dissolve|do|drill|drop|ease|end|enforce|equip|expand|expel|fight|file|fire|fix|fly|freeze|fund|give|go|grant|guard|halt|hand|have|help|hire|hold|host|hunt|impose|insist|invest|invite|issue|keep|kill|launch|lead|leave|lend|let|lift|limit|link|loan|lobby|make|match|meet|merge|move|name|negotiate|offer|open|order|pardon|pass|pay|plant|pledge|post|postpone|pour|press|print|privatise|probe|promise|protect|pull|push|put|raise|rebuild|recall|recruit|reduce|refer|refuse|reject|release|relocate|repair|replace|rescue|resign|restore|restructure|resume|return|reverse|review|run|sack|save|seal|seek|sell|send|set|settle|share|shut|sign|sit|spend|split|stand|start|stay|step|stop|strike|subsidise|sue|support|suspend|swap|take|talk|tax|tell|train|transfer|treat|trust|try|turn|use|veto|visit|wait|walk|warn|work|write|retrain|publish|digitise|computerise|recover|verify|upgrade|install|renovate|roof|feed|vaccinate|dredge|pave|light|connect|recruit|employ|enrol|register|survey|map)$/i;
const CVC = /^(stop|ban|plan|cut|set|put|run|shut|let|get|sit|hit|drop|ship|tap|swap|step|cap|scrap|split|chop|rob|grab|plot|quit)$/i;

const lowerFirst = (t) => String(t || "").replace(/^./, c => c.toLowerCase());
const clean = (t) => String(t || "").replace(/^[^A-Za-z0-9₦"“(]+/u, "").replace(/\s+/g, " ").trim();
export const isVerb = (w) => VERB.test(String(w || ""));
export const pastVerb = (w) => { const v = String(w).toLowerCase(); if (IRREG_PAST[v]) return IRREG_PAST[v]; if (/e$/.test(v)) return v + "d"; if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ied"; if (CVC.test(v)) return v + v.slice(-1) + "ed"; return v + "ed"; };
export const gerund = (w) => { const v = String(w).toLowerCase(); if (v === "be") return "being"; if (/ie$/.test(v)) return v.slice(0, -2) + "ying"; if (/[^e]e$/.test(v) && v.length > 2) return v.slice(0, -1) + "ing"; if (CVC.test(v)) return v + v.slice(-1) + "ing"; return v + "ing"; };

/* The action in a label, and its money: "Free and fair: let the chips fall" → "let the chips fall";
   "Pay the whole fund: ₦368.3B" → { act: "Pay the whole fund", money: "₦368.3B" }. */
const actionOf = (label) => {
  const parts = clean(label).replace(/\.$/, "").split(/:\s+/);
  const money = parts.find(p => /^₦[\d.,]+[MBT]?\b/.test(p)) || ((clean(label).match(/\((₦[\d.,]+[MBT]?)[^)]*\)/) || [])[1]);
  let act = parts.find(p => isVerb(p.split(" ")[0])) || parts[0];
  act = act.replace(/\s*\(₦[^)]*\)/, "").trim();
  return { act, money };
};
// "Pay the whole fund: ₦368.3B" → "paying the whole fund (₦368.3B)"
export const byDoing = (label) => { const { act, money } = actionOf(label), w = act.split(" ")[0];
  const g = isVerb(w) ? (gerund(w) + act.slice(w.length)).replace(/\b(and|then) ([a-z]+)\b/g, (m, c, v) => isVerb(v) ? c + " " + gerund(v) : m) : /^(a|an|the|no|one|two|three|\d)/i.test(w) ? "choosing " + lowerFirst(act) : "choosing to " + lowerFirst(act);
  return lowerFirst(g) + (money ? " (" + money + ")" : ""); };
// "Pay the whole fund: ₦368.3B" → "paid the whole fund (₦368.3B)"
export const didOf = (label) => { const { act, money } = actionOf(label), w = act.split(" ")[0];
  const d = isVerb(w) ? (pastVerb(w) + act.slice(w.length)).replace(/\b(and|then) ([a-z]+)\b/g, (m, c, v) => isVerb(v) ? c + " " + pastVerb(v) : m) : "chose to " + lowerFirst(act);
  return lowerFirst(d) + (money ? " (" + money + ")" : ""); };

/* A headline or a present-tense line, told as history: "Bandits have kidnapped three engineers" → "Bandits kidnapped
   three engineers"; "The rescue goes wrong: two engineers are killed" → "The rescue went wrong: two engineers were killed". */
const PRESENT = [[/\b(have|has) been\b/g, "were"], [/\b(have|has) (\w+ed|\w+en|taken|seized|kidnapped|stolen|fled|burnt|burned|left|sent|found|lost|built|shut|cut|set|put|struck)\b/g, "$2"],
  [/\bis\b/g, "was"], [/\bare\b/g, "were"], [/\bgoes\b/g, "went"], [/\bcomes\b/g, "came"], [/\bgo in\b/g, "went in"], [/\bbring\b/g, "brought"], [/\bprotests\b/g, "protested"],
  [/\brises\b/g, "rose"], [/\bfalls\b/g, "fell"], [/\bwants\b/g, "wanted"], [/\bsays\b/g, "said"], [/\bstays\b/g, "stayed"], [/\bmoves\b/g, "moved"], [/\breturns?\b/g, "returned"], [/\bopens\b/g, "opened"], [/\bcloses\b/g, "closed"]];
export const toPast = (t) => PRESENT.reduce((s, [rx, to]) => s.replace(rx, to), String(t || ""));

/* The last clean-up of a record line before it is printed: no doubled titles, no "Nigeria, Nigeria", money after a
   colon in brackets, a choice label after a colon turned into "by doing". */
export const proseOf = (t) => {
  let s = clean(t).replace(/\b(Hon|Rt\. Hon|Dr|Chief)\. \1\. /g, "$1. ").replace(/\b(Nigeria), \1\b/g, "$1").replace(/:\s+(₦[\d.,]+[MBT]?)(?=[.;,]|$)/g, " ($1)");
  // "Ended the ASUU strike: pay the whole fund." → "Ended the ASUU strike by paying the whole fund."
  // …unless the head is something that happened to the governor ("Bandits kidnapped three engineers: launch a rescue."):
  // then it is two sentences, and the governor did the second ("{He} launched a rescue.").
  const ACTS = /^(\w+ed|Paid|Made|Gave|Sent|Took|Left|Cut|Set|Put|Let|Ran|Shut|Bought|Brought|Held|Kept|Sold|Told|Built|Spent|Met|Fought|Won|Lost|Went|Did|Chose|Led|Broke|Drew|Sought|Swore)\b/;
  s = s.replace(/^([^:]{6,140}):\s+([a-z][a-z]+)(\b[^.:]*)(\.|$)/, (m, head, w, rest) => !isVerb(w) || /^(the|a|an)$/.test(w) ? m
    : ACTS.test(head) && !/^(Bandits|Gunmen|Kidnappers|Militants|Protesters|Workers|Members|Traders|Floods?|Fire)\b/.test(head) ? head + " by " + gerund(w) + rest + "." : head + ". {He} " + pastVerb(w) + rest + ".");
  // "Left the export plan for later" → "Postponed the export plan".
  s = s.replace(/^(\{He\} |[Hh]e |[Ss]he )?[Ll]eft (the [^.]+?) for later/, (m, who, what) => (who || "") + (who ? "postponed " : "Postponed ") + what);
  return s;
};
