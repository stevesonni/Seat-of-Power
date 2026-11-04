/* Plain words (pillar "words"): everyday words on screen for the jargon a new player meets,
   and cards cut to two sentences and 25 words. The real terms stay in the glossary (glossary.js),
   where "budget law" and "top civil servant" explain what they stand for. Rules only, no React. */
export const PLAIN = [
  [/\bAPPROPRIATION BILL\b/g, "BUDGET LAW"], [/\bAppropriation Bill\b/g, "budget law"], [/\bappropriation bill\b/g, "budget law"], [/\bthe Appropriation\b/g, "the budget law"], [/\bAppropriation\b/g, "Budget law"],
  [/\bHEAD OF SERVICE\b/g, "TOP CIVIL SERVANT"], [/\bHead of Service\b/g, "top civil servant"],
  [/\bEXECUTIVE COUNCIL\b/g, "CABINET"], [/\bState Executive Council\b/g, "State cabinet"], [/\bExecutive Council\b/g, "cabinet"],
  [/ Senatorial District\b/g, " district"], [/ Senatorial\b/g, ""], [/\bsenatorial districts?\b/g, "districts"], [/\bsenatorial zones?\b/g, "districts"],
  [/\bconstituency projects\b/g, "projects in members' home areas"], [/\bconstituencies\b/g, "home areas"], [/\bconstituency\b/g, "home area"],
  [/\bProcurement\b/g, "Contracts"], [/\bprocurement\b/g, "contracts"],
];
export const plainText = (t) => { let x = String(t == null ? "" : t); PLAIN.forEach(([rx, to]) => { x = x.replace(rx, to); }); return x; };
/* At most two sentences and 25 words; if two sentences run over, one; if one still runs over, its first 25 words. */
export const cut25 = (t, maxS = 2, maxW = 25) => {
  const s = String(t == null ? "" : t).trim(); if (!s) return s;
  const sn = s.match(/[^.!?]+[.!?]+["”’)]*|[^.!?]+$/g) || [s], wc = (x) => (x.trim().match(/\S+/g) || []).length;
  let out = sn.slice(0, maxS).join(" ").replace(/\s+/g, " ").trim();
  if (wc(out) > maxW) out = sn[0].trim();
  if (wc(out) > maxW) out = out.split(/\s+/).slice(0, maxW).join(" ").replace(/[,;:]$/, "") + "…";
  return out;
};
