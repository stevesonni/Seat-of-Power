/* Rules for a company a player registers (the ₦1,500 company_registration
   product). Shared by the server, which decides, and the game, which checks
   as the player types. Every player sees these names, so they must be
   invented: no real firms, banks, brands or politicians, and nothing rude. */

// Words that may not appear anywhere in a name (lower case, compared on letters only).
const BLOCKED = [
  // real firms and brands players would reach for
  "dangote", "julius berger", "juliusberger", "berger", "bua", "mtn", "glo", "airtel", "etisalat", "9mobile", "shell", "chevron", "exxon", "mobil", "totalenergies", "nnpc", "agip", "oando", "seplat",
  "ccecc", "cccc", "setraco", "hitech", "reynolds", "lafarge", "flour mills", "flourmills", "nestle", "guinness", "unilever", "honeywell", "innoson", "globacom", "zenith", "gtbank", "gtco", "first bank", "firstbank",
  "access bank", "accessbank", "uba", "fidelity", "sterling", "wema", "union bank", "unionbank", "ecobank", "stanbic", "opay", "palmpay", "moniepoint", "kuda", "flutterwave", "paystack", "interswitch", "jumia", "konga",
  "arik", "air peace", "airpeace", "peace mass", "dufil", "indomie", "chicken republic", "tantalizers", "mr bigg", "google", "apple", "microsoft", "amazon", "facebook", "meta", "tesla", "samsung", "huawei", "toyota", "coca",
  // real politicians
  "tinubu", "buhari", "atiku", "obasanjo", "jonathan", "yaradua", "abacha", "babangida", "shettima", "osinbajo", "wike", "sanwo", "elrufai", "el rufai", "kwankwaso", "fayemi", "ambode", "fashola", "okowa", "soludo", "obi peter", "peter obi",
  // rude or hateful
  "dick", "slut", "rape", "sex", "ashawo", "mumu", "ode", "olodo", "werey", "boko", "isis", "terror", "nazi", "hitler",
];
// Matched inside any word ("Fuckers", "Bullshit").
const STRONG = ["fuck", "shit", "bitch", "cunt", "pussy", "nigga", "nigger", "whore", "porn", "wank", "bastard"];
export const COMPANY_SUFFIX = /(?:^|\s)(ltd|limited|plc|nig\.?|nigeria|co\.?|company|& sons|enterprises|ventures|group|holdings|construction|builders|engineering|works|services)\b\.?$/i;

/* Clean and check a name. Returns { ok, name } or { ok: false, why }. */
export function checkCompanyName(raw) {
  let name = String(raw == null ? "" : raw).replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/g, "").replace(/\s+/g, " ").trim();
  if (name.length < 3) return { ok: false, why: "At least 3 letters." };
  if (name.length > 36) return { ok: false, why: "At most 36 characters." };
  if (!/^[A-Za-z0-9 &.,'\-]+$/.test(name)) return { ok: false, why: "Letters, numbers, spaces and & . , ' - only." };
  if (!/[A-Za-z]{2}/.test(name)) return { ok: false, why: "Use a real word or two." };
  if (/(.)\1{3,}/.test(name)) return { ok: false, why: "Too many repeated characters." };
  const flat = " " + name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ") + " ", tight = flat.replace(/ /g, "");
  // Short words must stand alone ("uba" blocks "UBA Builders", not "Cuba Works"); long ones are caught anywhere.
  const hit = BLOCKED.find(w => w.length <= 4 ? flat.includes(" " + w + " ") : tight.includes(w.replace(/ /g, "")));
  if (hit || STRONG.some(w => tight.includes(w))) return { ok: false, why: "That name is taken by a real company or person, or is not allowed. Invent your own." };
  if (!COMPANY_SUFFIX.test(name)) name += " Ltd";
  name = name.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  return { ok: true, name };
}

/* The sectors a player company can work in (same keys as game/systems/projects.js SECTORS). */
export const COMPANY_SECTORS = ["roads", "health", "education", "water", "energy", "markets", "security", "waste", "industry", "sports", "tourism"];
// What a hire earns the owner, and the most one new campaign can draw from it.
export const FEE_PER_HIRE_M = 20, PAYOUT_CAP_M = 1000;
