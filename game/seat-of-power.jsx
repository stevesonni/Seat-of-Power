const React = window.React;
const { useState, useEffect, useMemo } = React;

/* THE SEAT OF POWER V3 */

/* Portrait layout: the shell gives tall screens a narrow (720px) artboard.
   Components that need a different arrangement there ask TALL(). */
const TALL = () => typeof window !== "undefined" && window.innerHeight > window.innerWidth;

const F = { d: "'Cormorant Garamond',serif", b: "'Outfit',sans-serif", m: "'JetBrains Mono',monospace", c: "'Montserrat','Outfit',sans-serif" };
/* CL — the colour handles used by ~700 inline styles. The six structural
   ones are no longer fixed hexes: they read live from the stage's CSS
   custom properties, so switching to admin or private mode re-skins every
   inline-styled surface too, not just the .ds-* ones. Values are cached and
   invalidated on mode change (see setMode) so a render costs one read. */
const CL_STATIC = { red: "#cc3333", blu: "#2563eb", pur: "#6d28d9", org: "#c2410c", teal: "#0d9488", gold: "#1a6d2e" };
const CL_VARS = { bg: "--sf-bg", card: "--sf-card", bdr: "--sf-bdr", grn: "--accent", txt: "--ink", tm: "--ink-mid", td: "--ink-dim" };
const CL_FALLBACK = { bg: "#f8faf5", card: "#fff", bdr: "#d0d8c4", grn: "#008751", txt: "#1a2e05", tm: "#4a5e3a", td: "#7a8b6a" };
let _clCache = {};
window.SOP_clearColorCache = () => { _clCache = {}; };
const CL = {};
Object.keys(CL_STATIC).forEach(k => { CL[k] = CL_STATIC[k]; });
Object.keys(CL_VARS).forEach(k => {
  Object.defineProperty(CL, k, {
    enumerable: true,
    get() {
      if (_clCache[k]) return _clCache[k];
      let v = "";
      try {
        const st = document.getElementById("sop-stage");
        if (st) v = getComputedStyle(st).getPropertyValue(CL_VARS[k]).trim();
      } catch (e) {}
      return (_clCache[k] = v || CL_FALLBACK[k]);
    },
  });
});

/* Save slot. The game reads and writes window.storage.get/set, which
   nothing provided, so Save failed and Continue never appeared. Back it
   with localStorage; every access is guarded (private mode, blocked
   storage), and failures surface as rejected promises the callers catch. */
if (!window.storage) {
  window.storage = {
    get: (k) => new Promise((resolve) => {
      let v = null;
      try { v = window.localStorage.getItem(k); } catch (e) {}
      resolve(v == null ? null : { key: k, value: v });
    }),
    set: (k, v) => new Promise((resolve, reject) => {
      try { window.localStorage.setItem(k, v); resolve({ key: k, value: v }); } catch (e) { reject(e); }
    }),
  };
}

/* ─────────────────────────────────────────────────────────────────
   SAVE FORMAT
   v1 → the original blob: no version marker, no ledger, autosave
        always wrote phase:"budget".
   v2 → carries `sv`, `savedAt` and the serialised Historic Ledger,
        and stores the real phase.
   migrateSave() upgrades an old save in place rather than rejecting
   it, so runs in progress survive this change.
   ───────────────────────────────────────────────────────────────── */
const SAVE_VERSION = 2;
function migrateSave(d) {
  if (!d || typeof d !== "object") return d;
  if (!d.sv) {
    // v1: no ledger was ever stored, and the phase is untrustworthy.
    d.sv = 1;
    d.ledger = null;
    if (d.phase === "budget" && d.nav === "gov") d.phase = "budget"; // best we can do
    d._migratedFrom = 1;
  }
  d.sv = SAVE_VERSION;
  return d;
}
window.SOP_migrateSave = migrateSave;
window.CL_REF = CL; window.F_REF = F;

/* ─────────────────────────────────────────────────────────────────
   DS — the JS half of the design system. Mirrors the CSS custom
   properties so inline-styled components can pull from the same
   ladder instead of inventing numbers. Overlay modules read it off
   window.SOP_DS so their panels match the core screens.
   ───────────────────────────────────────────────────────────────── */
const DS = {
  /* compact landscape-phone ladder — overlay modules read these so their
     panels never drift back to the old oversized scale. */
  t: {}, // filled below: landscape ladder, or three sizes on phones
  s: [0, 6, 10, 16, 24, 36, 52],
  r: { sm: 8, md: 14, lg: 22, pill: 999 },
  ctl: { h: 64, cta: 78, pad: "16px 36px" },
};
// Type sizes. On phones (portrait) every role maps to one of three sizes,
// small / body / headline, matching TS() in the page shell.
const DS_T_WIDE = { micro: 16, meta: 18, label: 21, body: 24, lead: 27, title: 34, screen: 48, hero: 68 };
const DS_T_PHONE = { micro: "small", meta: "small", label: "small", body: "body", lead: "body", title: "headline", screen: "headline", hero: "headline" };
Object.keys(DS_T_WIDE).forEach(k => Object.defineProperty(DS.t, k, {
  enumerable: true,
  get: () => (TALL() && window.SOP_PHONE_TYPE ? window.SOP_PHONE_TYPE[DS_T_PHONE[k]] : DS_T_WIDE[k]),
}));
window.SOP_DS = DS;

/* Visual mode — public (out among the people), admin (behind the desk),
   private (the back room). Switching it re-skins every ds-* surface. */
const MODES = ["public", "admin", "private"];
function setMode(m) {
  const st = document.getElementById("sop-stage");
  if (!st || MODES.indexOf(m) < 0) return;
  MODES.forEach(x => st.classList.remove("mode-" + x));
  st.classList.add("mode-" + m);
  // Inline styles read CL, which caches computed vars — drop the cache so the
  // next render picks up the new mode's ink and surfaces.
  try { window.SOP_clearColorCache && window.SOP_clearColorCache(); } catch (e) {}
}
window.SOP_setMode = setMode;
// Keeps the stage in mode m. Runs after every render (cheap when nothing
// changed) so a mode set elsewhere (First 100 Days) is corrected, and
// re-renders once on a switch: inline colours read CL, which is only
// refreshed after the class changes, so the first paint would otherwise
// mix one mode's ink with another's surfaces.
const useMode = (m) => {
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    const st = document.getElementById("sop-stage");
    if (document.getElementById("sop-f100")) return; // First 100 Days sets its own mode per day
    if (st && !st.classList.contains("mode-" + m)) { setMode(m); bump(x => x + 1); }
  });
};

const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const cl100 = (v) => Math.max(0, Math.min(100, v));
const rng = (s) => { let x = ((Math.abs(s) + 1) % 2147483647) || 1; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
const pick = (a, r) => a[Math.floor(r() * a.length)];
const ri = (a, b, r) => Math.floor(a + r() * (b - a + 1));
const naira = (v) => "₦" + (typeof v === "number" ? v.toFixed(1) : v) + "B";
const ZONES = { SW: "South-West", SS: "South-South", SE: "South-East", NW: "North-West", NE: "North-East", NC: "North-Central" };
const ZC = { SW: "#f59e0b", SS: "#06b6d4", SE: "#22c55e", NW: "#ef4444", NE: "#8b5cf6", NC: "#ec4899" };
const mkS = (p, i, f, l, n, s, h, a, u, pv, z, d, desc, iss) => ({
  pop: p, igr: i, faac: f, lit: l, infra: n, sec: s, hp: h, agr: a, unemp: u, pov: pv, zone: z, diff: d, desc, issues: iss,
  // Economic sectors: output (0-1 scale), jobs (thousands), taxRate
  econ: {
    agriculture: { out: a * .8, jobs: p * 35, tax: .03, exp: a * .4 },
    manufacturing: { out: n * .35, jobs: p * 8, tax: .08, exp: n * .2 },
    services: { out: l * .5, jobs: p * 15, tax: .10, exp: 0 },
    oil: { out: z === "SS" ? .4 : z === "NC" ? .1 : 0, jobs: z === "SS" ? p * 2 : 0, tax: .15, exp: z === "SS" ? .5 : 0 },
    mining: { out: (z === "SE" || z === "NC" || z === "NW") ? .15 : .05, jobs: p * 3, tax: .06, exp: .08 },
    trade: { out: n * .3 + l * .2, jobs: p * 20, tax: .07, exp: n * .15 },
    tourism: { out: s * .15 + n * .1, jobs: p * 4, tax: .05, exp: .05 },
    tech: { out: l * .2, jobs: p * 2, tax: .12, exp: l * .08 },
  }
});

const STATES = {
  Lagos: mkS(15.4, 52, 14.2, .82, .68, .55, .52, .25, .15, .18, "SW", "Medium", "Commercial capital.", ["traffic", "housing", "flooding"]),
  Rivers: mkS(7.3, 28, 18.5, .72, .55, .42, .45, .30, .20, .30, "SS", "Hard", "Oil-rich but volatile.", ["militancy", "oil spills", "cultism"]),
  Kano: mkS(13, 12, 16.8, .48, .45, .50, .38, .62, .25, .55, "NW", "Hard", "Population giant.", ["almajiri", "drugs", "religious tension"]),
  Ebonyi: mkS(2.9, 2.8, 8.2, .64, .32, .58, .40, .70, .22, .48, "SE", "Very Hard", "Underdog state.", ["erosion", "roads", "mining"]),
  Kaduna: mkS(8.3, 10.5, 15, .55, .50, .35, .42, .55, .23, .50, "NW", "Very Hard", "Ethno-religious fault lines.", ["bandits", "ethnic tension", "insecurity"]),
  Ogun: mkS(5.2, 8.5, 10.2, .78, .52, .62, .50, .48, .16, .25, "SW", "Medium", "Industrial gateway.", ["smuggling", "illegal mining", "urbanization"]),
  Borno: mkS(5.9, 1.5, 12.8, .32, .22, .18, .28, .45, .35, .72, "NE", "Extreme", "Insurgency ground zero.", ["Boko Haram", "IDPs", "infrastructure"]),
  Enugu: mkS(4.4, 5.2, 9.5, .75, .48, .60, .48, .52, .19, .35, "SE", "Medium", "Coal City.", ["erosion", "water", "coal mining"]),
  Delta: mkS(5.7, 18, 17.5, .70, .50, .40, .44, .35, .21, .32, "SS", "Hard", "Oil derivation state.", ["oil theft", "flooding", "youth restiveness"]),
  Plateau: mkS(4.2, 3.5, 9.8, .62, .42, .30, .44, .58, .24, .44, "NC", "Hard", "Peace and tourism.", ["farmer-herder", "ethnic crisis", "mining"]),
  Oyo: mkS(7.8, 7.2, 12.5, .72, .50, .52, .46, .50, .18, .32, "SW", "Medium", "Ibadan political hub.", ["urban decay", "political violence", "waste"]),
  Imo: mkS(5.4, 4.8, 9, .78, .42, .35, .42, .48, .22, .38, "SE", "Hard", "Palm belt.", ["IPOB", "sit-at-home", "erosion"]),
  Anambra: mkS(5.5, 8.2, 8.8, .80, .48, .38, .46, .42, .17, .28, "SE", "Hard", "Eastern commerce hub.", ["sit-at-home", "flooding", "urbanization"]),
  Abia: mkS(3.7, 3.5, 8.5, .72, .38, .40, .40, .52, .24, .42, "SE", "Hard", "Aba manufacturing.", ["IPOB", "infrastructure", "roads"]),
  Akwa_Ibom: mkS(5.5, 12, 15.2, .74, .52, .48, .44, .42, .20, .34, "SS", "Medium", "Oil + ambition.", ["oil politics", "flooding", "youth unemployment"]),
  Cross_River: mkS(3.9, 3.2, 8.8, .72, .44, .55, .42, .55, .22, .38, "SS", "Medium", "Tourism potential.", ["deforestation", "boundary", "tourism decline"]),
  Bayelsa: mkS(2.3, 4.5, 12.5, .60, .35, .42, .38, .30, .28, .42, "SS", "Hard", "Smallest + oil.", ["oil spills", "flooding", "pipeline vandalism"]),
  Edo: mkS(4.2, 6.8, 10.5, .72, .48, .48, .44, .45, .20, .35, "SS", "Medium", "Benin kingdom.", ["trafficking", "cultism", "deforestation"]),
  Katsina: mkS(7.8, 3.2, 14.5, .38, .38, .32, .34, .60, .28, .62, "NW", "Very Hard", "Banditry hotspot.", ["bandits", "kidnapping", "poverty"]),
  Sokoto: mkS(5, 2, 11.8, .28, .30, .40, .30, .58, .30, .68, "NW", "Extreme", "Seat of Caliphate.", ["poverty", "education", "healthcare"]),
  Zamfara: mkS(4.5, 1.8, 10.2, .25, .28, .20, .28, .55, .32, .72, "NW", "Extreme", "Gold + bandits.", ["bandits", "illegal mining", "kidnapping"]),
  Kebbi: mkS(4.4, 1.5, 10, .30, .30, .42, .32, .62, .28, .65, "NW", "Very Hard", "Rice revolution.", ["flooding", "poverty", "education"]),
  Jigawa: mkS(5.8, 2.2, 11.5, .32, .32, .48, .30, .65, .26, .60, "NW", "Hard", "Agricultural quiet achiever.", ["flooding", "healthcare", "education"]),
  Adamawa: mkS(4.2, 2.5, 10.8, .45, .35, .35, .36, .55, .25, .52, "NE", "Very Hard", "BH affected, diverse.", ["insurgency", "IDPs", "ethnic tension"]),
  Bauchi: mkS(6.5, 2.8, 12, .38, .35, .42, .34, .58, .27, .58, "NE", "Hard", "Mining + education gap.", ["poverty", "mining", "healthcare"]),
  Gombe: mkS(3.3, 2, 9.5, .40, .35, .45, .36, .52, .24, .50, "NE", "Hard", "Jewel of Savannah.", ["poverty", "infrastructure", "education"]),
  Yobe: mkS(3.3, 1.2, 9.8, .28, .25, .30, .28, .50, .30, .65, "NE", "Extreme", "Insurgency + deficit.", ["Boko Haram", "poverty", "healthcare"]),
  Taraba: mkS(3.1, 1.8, 9.2, .42, .30, .35, .35, .60, .26, .52, "NE", "Hard", "Nature's gift.", ["farmer-herder", "ethnic tension", "infrastructure"]),
  Kwara: mkS(3.2, 4.5, 9, .68, .45, .58, .44, .50, .19, .35, "NC", "Medium", "North-South gateway.", ["political dynasty", "infrastructure", "flooding"]),
  Kogi: mkS(4.5, 3, 9.5, .62, .38, .40, .38, .55, .24, .45, "NC", "Hard", "Confluence state.", ["political violence", "flooding", "poverty"]),
  Niger: mkS(5.6, 2.5, 12, .42, .32, .30, .32, .60, .28, .55, "NC", "Very Hard", "Largest by area.", ["bandits", "kidnapping", "infrastructure"]),
  Nassarawa: mkS(2.5, 2.2, 8.5, .55, .35, .42, .38, .55, .23, .45, "NC", "Medium", "Solid minerals.", ["mining", "farmer-herder", "urbanization"]),
  Benue: mkS(5.7, 3, 10.5, .60, .38, .32, .38, .65, .25, .48, "NC", "Hard", "Food basket.", ["farmer-herder", "flooding", "IDPs"]),
  Osun: mkS(4.7, 4.2, 9, .75, .45, .58, .46, .48, .20, .30, "SW", "Medium", "Cultural capital.", ["funding", "infrastructure", "politics"]),
  Ondo: mkS(4.6, 5, 9.5, .72, .45, .52, .44, .52, .19, .32, "SW", "Medium", "Cocoa + bitumen.", ["oil politics", "cocoa decline", "Amotekun"]),
  Ekiti: mkS(3.3, 2.8, 7.8, .74, .40, .60, .44, .50, .21, .32, "SW", "Medium", "Fountain of knowledge.", ["funding", "infrastructure", "brain drain"]),
  FCT: mkS(4, 15, 10, .80, .70, .48, .55, .20, .18, .22, "NC", "Medium", "Federal Capital.", ["land grabbing", "satellites", "security"]),
};

const PARTIES = [
  // Order: APC, PDP, NDC, ADC, LP. Descriptions describe the parties only.
  { id: "APC", nm: "All Progressives Congress", c: "#1a6d2e", i: "🟢", ticket: 0.5, strength: 1.15, desc: "The governing party at the centre. ₦500M ticket, the most expensive. Strong federal backing and the deepest campaign money." },
  { id: "PDP", nm: "Peoples Democratic Party", c: "#cc3333", i: "🔴", ticket: 0.28, strength: 0.95, desc: "The oldest national opposition party. ₦280M ticket. Weakened by defections, but its structures still hold in the South-South and North-Central." },
  { id: "NDC", nm: "National Democratic Coalition", c: "#f59e0b", i: "🟡", ticket: 0.3, strength: 1.05, desc: "A newer party with strong urban and youth appeal, especially in the South-East, South-South and Lagos. ₦300M ticket." },
  { id: "ADC", nm: "African Democratic Congress", c: "#0d9488", i: "🩵", ticket: 0.35, strength: 1.08, desc: "An established opposition party that has grown quickly. ₦350M ticket. Rising support, with open disputes over who leads it." },
  { id: "LP", nm: "Labour Party", c: "#2563eb", i: "🔵", ticket: 0.15, strength: 0.85, desc: "A labour-aligned party with links to the trade unions. ₦150M ticket. Smaller after defections and a leadership dispute." },
];

const STATE_LGAS = {
  Lagos: ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"],
  Rivers: ["Abua/Odual","Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emohua","Etche","Gokana","Ikwerre","Khana","Obio/Akpor","Ogba/Egbema/Ndoni","Ogu/Bolo","Okrika","Omuma","Opobo/Nkoro","Oyigbo","Port Harcourt","Tai"],
  Kano: ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun Wada","Ungogo","Warawa","Wudil"],
  Ebonyi: ["Abakaliki","Afikpo North","Afikpo South","Ebonyi","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara","Ohaukwu","Onicha"],
  Kaduna: ["Birnin Gwari","Chikun","Giwa","Igabi","Ikara","Jaba","Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria"],
  Ogun: ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafemi Owode","Odeda","Odogbolu","Ogun Waterside","Remo North","Sagamu","Yewa North","Yewa South"],
  Borno: ["Abadam","Askira/Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"],
  Enugu: ["Aninri","Awgu","Enugu East","Enugu North","Enugu South","Ezeagu","Igbo Etiti","Igbo Eze North","Igbo Eze South","Isi Uzo","Nkanu East","Nkanu West","Nsukka","Oji River","Udenu","Udi","Uzo Uwani"],
  Delta: ["Aniocha North","Aniocha South","Bomadi","Burutu","Ethiope East","Ethiope West","Ika North East","Ika South","Isoko North","Isoko South","Ndokwa East","Ndokwa West","Okpe","Oshimili North","Oshimili South","Patani","Sapele","Udu","Ughelli North","Ughelli South","Ukwuani","Uvwie","Warri North","Warri South","Warri South West"],
  Plateau: ["Barkin Ladi","Bassa","Bokkos","Jos East","Jos North","Jos South","Kanam","Kanke","Langtang North","Langtang South","Mangu","Mikang","Pankshin","Qua'an Pan","Riyom","Shendam","Wase"],
  Oyo: ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Iseyin","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona Ara","Orelope","Ori Ire","Oyo East","Oyo West","Saki East","Saki West","Surulere"],
  Imo: ["Aboh Mbaise","Ahiazu Mbaise","Ehime Mbano","Ezinihitte","Ideato North","Ideato South","Ihitte/Uboma","Ikeduru","Isiala Mbano","Isu","Mbaitoli","Ngor Okpala","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji/Egbema","Okigwe","Onuimo","Orlu","Orsu","Oru East","Oru West","Owerri Municipal","Owerri North","Owerri West"],
  Anambra: ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili North","Idemili South","Ihiala","Njikoka","Nnewi North","Nnewi South","Ogbaru","Onitsha North","Onitsha South","Orumba North","Orumba South","Oyi"],
  Abia: ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala Ngwa North","Isiala Ngwa South","Isuikwuato","Obi Ngwa","Ohafia","Osisioma","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umu Nneochi"],
  Akwa_Ibom: ["Abak","Eastern Obolo","Eket","Esit Eket","Essien Udim","Etim Ekpo","Etinan","Ibeno","Ibesikpo Asutan","Ibiono-Ibom","Ika","Ikono","Ikot Abasi","Ikot Ekpene","Ini","Itu","Mbo","Mkpat-Enin","Nsit-Atai","Nsit-Ibom","Nsit-Ubium","Obot Akara","Okobo","Onna","Oron","Oruk Anam","Udung-Uko","Ukanafun","Uruan","Urue-Offong/Oruko","Uyo"],
  Cross_River: ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Biase","Boki","Calabar Municipal","Calabar South","Etung","Ikom","Obanliku","Obubra","Obudu","Odukpani","Ogoja","Yakurr","Yala"],
  Bayelsa: ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern Ijaw","Yenagoa"],
  Edo: ["Akoko-Edo","Egor","Esan Central","Esan North-East","Esan South-East","Esan West","Etsako Central","Etsako East","Etsako West","Igueben","Ikpoba-Okha","Oredo","Orhionmwon","Ovia North-East","Ovia South-West","Owan East","Owan West","Uhunmwonde"],
  Katsina: ["Bakori","Batagarawa","Batsari","Baure","Bindawa","Charanchi","Dan Musa","Dandume","Danja","Daura","Dutsi","Dutsin-Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Kankara","Kankia","Katsina","Kurfi","Kusada","Mai'Adua","Malumfashi","Mani","Mashi","Matazu","Musawa","Rimi","Sabuwa","Safana","Sandamu","Zango"],
  Sokoto: ["Binji","Bodinga","Dange Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Isa","Kebbe","Kware","Rabah","Sabon Birni","Shagari","Silame","Sokoto North","Sokoto South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"],
  Zamfara: ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau","Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Tsafe","Zurmi"],
  Kebbi: ["Aleiro","Arewa Dandi","Argungu","Augie","Bagudo","Birnin Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko/Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"],
  Jigawa: ["Auyo","Babura","Biriniwa","Birnin Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kafin Hausa","Kaugama","Kazaure","Kiri Kasama","Kiyawa","Maigatari","Malam Madori","Miga","Ringim","Roni","Sule Tankarkar","Taura","Yankwashi"],
  Adamawa: ["Demsa","Fufore","Ganye","Girei","Gombi","Guyuk","Hong","Jada","Lamurde","Madagali","Maiha","Mayo-Belwa","Michika","Mubi North","Mubi South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"],
  Bauchi: ["Alkaleri","Bauchi","Bogoro","Damban","Darazo","Dass","Gamawa","Ganjuwa","Giade","Itas/Gadau","Jama'are","Katagum","Kirfi","Misau","Ningi","Shira","Tafawa Balewa","Toro","Warji","Zaki"],
  Gombe: ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"],
  Yobe: ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gujba","Gulani","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yunusari","Yusufari"],
  Taraba: ["Ardo Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim Lamido","Kurmi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"],
  Kwara: ["Asa","Baruten","Edu","Ekiti","Ifelodun","Ilorin East","Ilorin South","Ilorin West","Irepodun","Isin","Kaiama","Moro","Offa","Oke Ero","Oyun","Pategi"],
  Kogi: ["Adavi","Ajaokuta","Ankpa","Bassa","Dekina","Ibaji","Idah","Igalamela-Odolu","Ijumu","Kabba/Bunu","Kogi","Lokoja","Mopa-Muro","Ofu","Ogori/Magongo","Okehi","Okene","Olamaboro","Omala","Yagba East","Yagba West"],
  Niger: ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga","Mashegu","Mokwa","Moya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"],
  Nassarawa: ["Akwanga","Awe","Doma","Karu","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa Egon","Obi","Toto","Wamba"],
  Benue: ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Otukpo","Tarka","Ukum","Ushongo","Vandeikya"],
  Osun: ["Aiyedaade","Aiyedire","Atakunmosa East","Atakunmosa West","Boluwaduro","Boripe","Ede North","Ede South","Egbedore","Ejigbo","Ife Central","Ife East","Ife North","Ife South","Ifedayo","Ifelodun","Ila","Ilesa East","Ilesa West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo Otin","Ola Oluwa","Olorunda","Oriade","Orolu","Osogbo"],
  Ondo: ["Akoko North-East","Akoko North-West","Akoko South-East","Akoko South-West","Akure North","Akure South","Ese Odo","Idanre","Ifedore","Ilaje","Ile Oluji/Okeigbo","Irele","Odigbo","Okitipupa","Ondo East","Ondo West","Ose","Owo"],
  Ekiti: ["Ado Ekiti","Efon","Ekiti East","Ekiti South-West","Ekiti West","Emure","Gbonyin","Ido/Osi","Ijero","Ikere","Ikole","Ilejemeje","Irepodun/Ifelodun","Ise/Orun","Moba","Oye"],
  FCT: ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal Area Council"],
};

const ZONE_LABELS = ["North Senatorial", "Central Senatorial", "South Senatorial"];
const getLGAs = (state) => STATE_LGAS[state] || [];
const lgaCluster = (lgas, idx) => lgas.filter((_, i) => i % 3 === idx);
const buildBattlegrounds = (state, seed, partyId, oppPartyId) => {
  const lgas = getLGAs(state);
  const r = rng(seed + state.length * 101 + (partyId || "").length * 17);
  const zoneInfo = STATES[state]?.zone || "SW";
  // Regional bias: NDC strong SE/SS/Lagos; ADC strong North/NC; APC & PDP national; LP weakened
  const partyBias = (pid) => {
    if (!pid) return 0;
    if (pid === "APC") return 2;
    if (pid === "PDP") return 1;
    if (pid === "ADC") return (zoneInfo === "NW" || zoneInfo === "NE" || zoneInfo === "NC") ? 3 : -2;
    if (pid === "NDC") return (zoneInfo === "SE" || zoneInfo === "SS" || state === "Lagos") ? 4 : -1;
    if (pid === "LP") return (zoneInfo === "SE" || state === "Lagos") ? 1 : -3;
    return 0;
  };
  return ZONE_LABELS.map((zone, idx) => {
    const names = lgaCluster(lgas, idx);
    const base = 43 + Math.round(r() * 14) + partyBias(partyId);
    const opp = 40 + Math.round(r() * 16) + partyBias(oppPartyId);
    return { id: idx, zone, names, key: names.slice(0, 4).join(", "), support: cl100(base), opp: cl100(opp), turnout: cl100(44 + Math.round(r() * 28)), swing: cl100(100 - Math.abs(base - opp) * 2), visits: 0 };
  });
};
// Poll share: you vs the main opponent, always adding to 100
const pollShare = (z) => { const t = (z.support || 0) + (z.opp || 0); return t > 0 ? Math.round(100 * z.support / t) : 50; };
const sgnN = (n) => (n > 0 ? "+" : n < 0 ? "\u2212" : "\u00b1") + Math.abs(n);
const shiftZones = (zones, target, your = 0, opp = 0, turnout = 0) => zones.map(z => {
  const hit = target === "all" || target === z.id;
  return hit ? { ...z, support: cl100(z.support + your), opp: cl100(z.opp + opp), turnout: cl100(z.turnout + turnout), visits: z.visits + (your > 0 || turnout > 0 ? 1 : 0) } : z;
});
// Real INEC-style collation: derive actual vote counts from registered voters, turnout and party support share
const lgaElectionSummary = (zones, partyStrength = 1, oppStrength = 1, state = null) => {
  const popM = (state && STATES[state]?.pop) || 4; // millions
  // ~48% of population is registered (matches INEC 2023 national average)
  const registeredTotal = Math.round(popM * 1_000_000 * 0.48);
  const zoneReg = Math.round(registeredTotal / zones.length);
  const rows = zones.map(z => {
    const turnoutFrac = Math.max(0.12, Math.min(0.68, z.turnout / 100));
    const votesCast = Math.round(zoneReg * turnoutFrac);
    const yourShare = Math.max(1, z.support * partyStrength);
    const oppShare = Math.max(1, z.opp * oppStrength);
    // ~5% goes to minor party candidates so totals feel real
    const validVotes = Math.round(votesCast * 0.95);
    const shareTotal = yourShare + oppShare;
    const yourVotes = Math.round(validVotes * (yourShare / shareTotal));
    const oppVotes = Math.max(0, validVotes - yourVotes);
    return { ...z, votesCast, yourVotes, oppVotes, won: yourVotes >= oppVotes };
  });
  const totalYou = rows.reduce((a, r) => a + r.yourVotes, 0);
  const totalOpp = rows.reduce((a, r) => a + r.oppVotes, 0);
  return { rows, zonesWon: rows.filter(r => r.won).length, totalYou, totalOpp, margin: totalYou - totalOpp, registeredTotal };
};
const fmtVotes = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M" : n >= 1_000 ? (n / 1_000).toFixed(0) + "k" : String(n);
const fmtVotesFull = (n) => Math.round(n).toLocaleString("en-US");

const CROLES = [
  { k: "cos", t: "Chief of Staff", s: "administration" },
  { k: "fin", t: "Finance Comm.", s: "administration" },
  { k: "edu", t: "Education Comm.", s: "education" },
  { k: "hlt", t: "Health Comm.", s: "health" },
  { k: "wrk", t: "Works Comm.", s: "infrastructure" },
  { k: "sec", t: "Security Adviser", s: "security" },
  { k: "agr", t: "Agric Comm.", s: "agriculture" },
  { k: "inf", t: "Information Comm.", s: "administration" },
  { k: "env", t: "Environment Comm.", s: "infrastructure" },
  { k: "wom", t: "Women Affairs Comm.", s: "health" },
];

// ─── CIVIL SERVICE / PERMANENT SECRETARIES ───
const PS_ROLES = [
  { k: "ps_edu", t: "Perm Sec — Education", s: "education", icon: "📚" },
  { k: "ps_hlt", t: "Perm Sec — Health", s: "health", icon: "🏥" },
  { k: "ps_wrk", t: "Perm Sec — Works", s: "infrastructure", icon: "🏗️" },
  { k: "ps_fin", t: "Perm Sec — Finance", s: "administration", icon: "💰" },
  { k: "ps_agr", t: "Perm Sec — Agriculture", s: "agriculture", icon: "🌾" },
  { k: "ps_est", t: "Head of Service", s: "administration", icon: "🏛️" },
];

const PS_TYPES = ["Technocrat", "Old Guard", "Party Plant", "Reformer", "Corrupt Bureaucrat", "Silent Worker"];
const genPS = (seed, zone, stateId) => {
  const r = rng(seed + 7777); // offset from cabinet generator to avoid name collisions
  const ps = {};
  PS_ROLES.forEach(role => {
    const typ = PS_TYPES[Math.floor(r() * PS_TYPES.length)];
    const eff = typ === "Technocrat" ? ri(70, 92, r) : typ === "Reformer" ? ri(65, 85, r) : typ === "Silent Worker" ? ri(50, 70, r) : typ === "Old Guard" ? ri(35, 55, r) : typ === "Party Plant" ? ri(30, 50, r) : ri(20, 40, r);
    const cor = typ === "Corrupt Bureaucrat" ? ri(55, 80, r) : typ === "Party Plant" ? ri(40, 60, r) : typ === "Old Guard" ? ri(25, 45, r) : ri(5, 25, r);
    const resist = typ === "Old Guard" ? ri(60, 85, r) : typ === "Corrupt Bureaucrat" ? ri(50, 75, r) : typ === "Party Plant" ? ri(30, 55, r) : ri(10, 35, r);
    ps[role.k] = { nm: gN(r, zone, stateId), type: typ, eff, cor, resist, role: role.k,
      bio: typ === "Technocrat" ? "PhD holder. Evidence-based. Impatient with politics." : typ === "Old Guard" ? "30 years in service. Knows every trick. Resists change." : typ === "Party Plant" ? "Owes position to godfather. Loyalty is to the party, not the state." : typ === "Reformer" ? "Believes in transparency. Will challenge corrupt practices." : typ === "Corrupt Bureaucrat" ? "Runs a parallel economy within the ministry. Untouchable." : "Does the minimum. Never makes waves. Never gets fired."
    };
  });
  return ps;
};

// Civil service reform options
const CS_REFORMS = [
  { id: "cs_audit", nm: "Civil Service Audit", d: "Full performance review of all permanent secretaries. Identify dead wood.", cost: 0.5, turn: 1, fx: "Reveals true performance. May trigger resistance." },
  { id: "cs_retire", nm: "Compulsory Retirement (Old Guard)", d: "Force retirement of officers above 35 years of service. Clear the blockage.", cost: 0.3, turn: 1, fx: "Removes inefficient staff but creates enemies and unemployment." },
  { id: "cs_training", nm: "Capacity Building Programme", d: "Send permanent secretaries for training. 6-month programme.", cost: 1.5, turn: 2, fx: "Boosts efficiency across the board. Takes time." },
  { id: "cs_digital", nm: "Digitize Civil Service", d: "Biometric attendance. Digital files. Online approvals. End ghost workers.", cost: 2, turn: 2, fx: "Massive corruption reduction. Bureaucracy resists." },
  { id: "cs_replace", nm: "Political Appointments", d: "Replace permanent secretaries with your own people. Fast but risky.", cost: 0, turn: 1, fx: "Immediate control. But destroys institutional memory and morale." },
];

// ─── FEDERAL GOVERNMENT DYNAMICS ───
const FG_EVENTS = [
  { id: "fg_faac_cut", type: "punish", title: "🇳🇬 FAAC Allocation Reduced", desc: "The Federal Government has reduced your state's FAAC allocation by 15%. The Accountant General cites 'revenue shortfall' — but governors who attended the last NEC meeting got their full share.", fx: { faac: -.15 },
    opts: [
      { l: "🤝 Fall in Line", d: "Attend the next NEC meeting. Show loyalty. Your allocation will be restored.", fx: { pStab: 5 }, fgRel: 15, log: "Governor attended NEC. FAAC restored next quarter." },
      { l: "📢 Protest Publicly", d: "Hold a press conference condemning the cut as political victimization.", fx: { app: 5 }, fgRel: -20, sk: { media: 8 }, log: "Governor publicly challenges FG over FAAC cut. Relations worsen." },
      { l: "⚖️ Sue at Supreme Court", d: "File a suit for enforcement of the Revenue Allocation Act.", fx: { app: 3 }, fgRel: -15, log: "Governor sues FG over FAAC. Case pending." },
    ]},
  { id: "fg_efcc", type: "punish", title: "🔍 EFCC Investigation Launched", desc: "The Economic and Financial Crimes Commission has opened a 'routine investigation' into your state's finances. Everyone knows this is political — but EFCC has real teeth.", fx: {},
    opts: [
      { l: "📋 Cooperate Fully", d: "Open all books. Let them audit everything. If you're clean, you'll survive.", fx: { cor: -.02, app: 3 }, fgRel: 10, sk: { media: 8, business: 5 }, log: "Governor cooperates with EFCC. Investigation finds minor issues only." },
      { l: "⚖️ Challenge Jurisdiction", d: "Your lawyers argue EFCC has no jurisdiction over state funds under S.120.", fx: { app: 2 }, fgRel: -10, sk: { media: -3 }, log: "Governor challenges EFCC jurisdiction. Legal battle begins." },
      { l: "🤝 Negotiate Behind Scenes", d: "Send emissaries. Find out what the President really wants.", fx: { cor: .02 }, fgRel: 15, log: "Governor quietly resolves EFCC issue. The price of peace." },
    ]},
  { id: "fg_military", type: "punish", title: "🪖 Military Deployment to Your State", desc: "The President has deployed a military task force to your state citing 'security concerns.' Your state security outfit is sidelined. The military answers to Abuja, not you.", fx: { sec: .03 },
    opts: [
      { l: "🤝 Welcome the Troops", d: "Cooperate. Provide logistics. Show unity of purpose.", fx: { sec: .02, app: -2 }, fgRel: 15, sk: { media: -3 }, log: "Governor welcomes military. Security improves but autonomy reduced." },
      { l: "📢 Demand Withdrawal", d: "Publicly demand the President withdraw troops. 'This is our state.'", fx: { app: 4 }, fgRel: -25, sk: { media: 10, youth: 8 }, log: "Governor demands military withdrawal. Federal-state tensions escalate." },
      { l: "🔇 Say Nothing", d: "Neither welcome nor oppose. Let it play out.", fx: { app: -1 }, fgRel: 0, log: "Governor stays silent on military deployment. Citizens confused." },
    ]},
  { id: "fg_road", type: "reward", title: "🛣️ Federal Road Approval", desc: "The Federal Government has approved a federal highway through your state! ₦25B project. But they want you to provide right-of-way and matching funds.", fx: {},
    opts: [
      { l: "✅ Provide Everything", d: "Allocate land and ₦3B matching funds. The road transforms your state.", fx: { infra: .06, app: 8 }, fgRel: 10, dc: 3, log: "Federal highway approved. Governor provides matching funds. Infrastructure boom." },
      { l: "🤝 Negotiate Terms", d: "Offer land but resist matching funds. 'It's a federal road.'", fx: { infra: .03, app: 4 }, fgRel: -5, dc: 1, log: "Highway negotiations ongoing. Partial funding agreed." },
      { l: "❌ Decline", d: "You can't afford ₦3B. The highway goes to another state.", fx: { app: -4 }, fgRel: -10, sk: { business: -10 }, log: "Governor declines federal highway. Business community furious." },
    ]},
  { id: "fg_loan_block", type: "punish", title: "🏦 Federal Government Blocks Your Loan", desc: "You applied for a ₦5B infrastructure loan from the World Bank. The DMO (Debt Management Office) — controlled by the Federal Government — has rejected your application. 'Debt sustainability concerns.'", fx: {},
    opts: [
      { l: "🤝 Visit the President", d: "Request a meeting at Aso Rock. Make your case personally.", fx: { pStab: 3 }, fgRel: 15, log: "Governor visits Aso Rock. Loan application 'under review.'" },
      { l: "📢 Go Public", d: "Hold a press conference showing your debt-to-revenue ratio is healthy.", fx: { app: 4 }, fgRel: -15, sk: { media: 8, business: 5 }, log: "Governor publicly challenges loan block. DMO embarrassed." },
      { l: "🔄 Find Alternative Funding", d: "Approach private lenders. Higher interest but no federal gatekeeping.", fx: { igr: -0.5 }, fgRel: 0, dc: 2, log: "Governor secures private loan at higher interest. Independence preserved." },
    ]},
  { id: "fg_grant", type: "reward", title: "💰 Federal Special Intervention Fund", desc: "The President has approved a ₦2B special intervention fund for your state — flood relief, agricultural support, and education infrastructure. Your party loyalty is paying off.", fx: { igr: 2 },
    opts: [
      { l: "🙏 Accept Gratefully", d: "Thank the President publicly. Deploy the funds immediately.", fx: { app: 6, hp: .01, agr: .01 }, fgRel: 10, log: "Governor accepts federal intervention fund. Projects launched." },
      { l: "📋 Accept but Demand Transparency", d: "Accept the funds but publish every naira spent. No corruption.", fx: { app: 8, cor: -.02 }, fgRel: 0, sk: { media: 10 }, log: "Governor accepts fund with full transparency. Model governance." },
    ]},
  { id: "fg_party_pressure", type: "punish", title: "🏛️ Aso Rock Demands Party Loyalty", desc: "The President's Chief of Staff calls. 'Your Excellency, Mr. President notices you've been... independent. He expects you to mobilize your state for the party's national campaign. Resources will be provided. Or not.'", fx: {},
    opts: [
      { l: "🤝 Comply", d: "Mobilize your machinery for the President. Use state resources for party events.", fx: { app: -3, cor: .03 }, fgRel: 20, sk: { party: 10 }, log: "Governor mobilizes state for party campaign. Loyalty demonstrated." },
      { l: "🔇 Minimal Compliance", d: "Do the bare minimum. Attend one rally. Send your deputy to the rest.", fx: { app: 0 }, fgRel: -5, sk: { party: -3 }, log: "Governor gives lukewarm support to party campaign." },
      { l: "❌ Refuse", d: "'My state comes first. I won't use public resources for party politics.'", fx: { app: 6 }, fgRel: -25, sk: { party: -15, media: 10, youth: 8 }, log: "Governor refuses presidential directive. Political independence — at a cost." },
    ]},
];

// ─── SHOCK EVENTS — unpredictable national/natural crises ───
const SHOCK_EVENTS = [
  { id: "sh_oil_crash", icon: "🛢️💥", title: "OIL PRICE CRASH", desc: "Global oil prices drop 40% overnight. Brent crude falls to $45/barrel. Nigeria's federal revenue collapses. FAAC allocations to all 36 states will be slashed immediately. Your budget is about to shrink.", autoFx: { faac: -.25 },
    opts: [
      { l: "🔪 Emergency Austerity", d: "Cut all non-essential spending. Freeze hiring. Reduce travel.", fx: { app: -6, cor: -.02 }, sk: { unions: -10, business: 3 }, log: "Austerity measures imposed. Workers suffering." },
      { l: "💰 Boost IGR Aggressively", d: "New taxes. Enforce existing ones. Revenue drives.", fx: { app: -3, igr: 1.5 }, sk: { business: -8, media: 3 }, log: "IGR drive launched. Businesses complain of multiple taxation." },
      { l: "🏦 Borrow to Bridge", d: "Take emergency loans to maintain spending while oil recovers.", fx: { app: 2 }, dc: 4, sk: { business: 5 }, log: "Emergency borrowing covers the gap. Debt rises sharply." },
    ]},
  { id: "sh_naira_crash", icon: "💵📉", title: "NAIRA DEVALUATION — 40% DROP", desc: "The CBN devalues the naira. ₦1,500 to $1. All imported goods — medicine, equipment, vehicles — cost 40% more. Your infrastructure projects using imported materials face massive cost overruns.", autoFx: {},
    opts: [
      { l: "📋 Renegotiate All Contracts", d: "Force contractors to absorb some of the increase.", fx: { app: 2 }, sk: { business: -10 }, log: "Contract renegotiation. Some contractors abandon projects." },
      { l: "🔄 Switch to Local Materials", d: "Where possible, use Nigerian-made alternatives.", fx: { infra: -.02, app: 3 }, sk: { business: 5 }, log: "Local content policy adopted. Quality concerns but patriotic." },
      { l: "💰 Increase Project Budgets", d: "Accept the cost increase. Complete what you started.", fx: { app: 4 }, dc: 3, sk: { media: 5 }, log: "Project budgets adjusted upward. Debt rises but projects continue." },
    ]},
  { id: "sh_pandemic", icon: "🦠", title: "PANDEMIC HITS NIGERIA", desc: "A new respiratory virus sweeps the country. Your state records 500 cases in the first week. Hospitals overwhelmed. Schools shut. Markets empty. The economy freezes.", autoFx: { hp: -.05, app: -5 },
    opts: [
      { l: "🔒 Full Lockdown", d: "Close everything. Deploy security. Enforce stay-at-home.", fx: { sec: .02, hp: .03, app: -8 }, sk: { business: -15, unions: -10, youth: -8, religious: -5 }, log: "Full lockdown imposed. Economy devastated but lives saved." },
      { l: "🏥 Healthcare Surge", d: "All resources to hospitals. Testing centres. PPE. No lockdown.", fx: { hp: .04, app: 3 }, dc: 3, sk: { media: 8, business: 3 }, log: "Healthcare surge. No lockdown. Economy hobbles along." },
      { l: "🤷 Minimal Response", d: "'Nigerians have survived worse. We trust in God and our immune systems.'", fx: { hp: -.03, app: -3 }, sk: { media: -12, youth: -10, religious: 5 }, log: "Minimal pandemic response. Death toll rises." },
    ]},
  { id: "sh_endsars", icon: "✊🏿", title: "NATIONAL YOUTH PROTESTS", desc: "Massive nationwide protests erupt — #EndSARS style. Young people in your state join, blocking highways and occupying government buildings. The whole country is watching how you respond.", autoFx: { app: -3 },
    opts: [
      { l: "🤝 Meet the Protesters", d: "Go to the protest ground personally. Listen. Make commitments.", fx: { app: 10 }, sk: { youth: 20, media: 15 }, log: "Governor meets protesters. Commitments made. Youth celebrate." },
      { l: "🔇 Wait It Out", d: "They'll get tired. Don't escalate. Don't engage.", fx: { app: -5, sec: -.02 }, sk: { youth: -12, media: -8 }, log: "Governor ignores protests. Youth anger deepens." },
      { l: "🚔 Disperse by Force", d: "Call in police. Tear gas. Arrest ringleaders.", fx: { app: -10, sec: .01 }, sk: { youth: -25, media: -20, religious: -8 }, log: "Violent crackdown on protesters. National condemnation." },
    ]},
  { id: "sh_subsidy", icon: "⛽💸", title: "FUEL SUBSIDY REMOVAL", desc: "The Federal Government removes fuel subsidy overnight. Petrol jumps from ₦185 to ₦620. Transport costs triple. Food prices double. Your state's economy is reeling. This is not your fault — but the people blame whoever is in charge.", autoFx: { app: -8 },
    opts: [
      { l: "🚌 Subsidize Transport", d: "Use state funds to subsidize public transport. Shield the poorest.", fx: { app: 6 }, dc: 2, sk: { unions: 8, youth: 6 }, log: "State transport subsidy cushions the blow. Budget under pressure." },
      { l: "📢 Blame the FG", d: "Hold a press conference. 'This is the Federal Government's doing, not ours.'", fx: { app: 3 }, fgRel: -15, sk: { media: 5 }, log: "Governor blames FG for fuel crisis. Popular but FG relations tank." },
      { l: "💰 Cash Transfer to Poor", d: "Direct cash to 100,000 poorest households. ₦10,000 each.", fx: { app: 8 }, dc: 1, sk: { youth: 10, religious: 5 }, log: "Cash transfers reach 100K households. Popular but expensive." },
    ]},
  { id: "sh_flood", icon: "🌊", title: "CATASTROPHIC FLOODING", desc: "Heavy rains and dam release from upstream cause the worst flooding in 30 years. 15 LGAs affected. 50,000 displaced. Farmland destroyed. Roads washed away. Federal help is slow.", autoFx: { agr: -.06, infra: -.04, app: -4 },
    opts: [
      { l: "🚨 Declare State of Emergency", d: "Mobilize everything. Open camps. Deploy all resources. Request federal help.", fx: { app: 8, hp: .01 }, dc: 3, sk: { media: 10, traditional: 8 }, log: "State of emergency declared. Massive relief operation launched." },
      { l: "📞 Wait for Federal Help", d: "NEMA should handle this. It's their job.", fx: { app: -6 }, sk: { media: -10, traditional: -8 }, log: "Governor waits for NEMA. Help comes too late. Lives lost." },
      { l: "🏗️ Immediate Reconstruction", d: "Start rebuilding roads and bridges before the water fully recedes.", fx: { app: 5, infra: .02 }, dc: 4, sk: { business: 5, media: 6 }, log: "Emergency reconstruction begins. Governor seen on site." },
    ]},
  { id: "sh_terror", icon: "💣", title: "TERRORIST ATTACK", desc: "A bomb explodes at a market in your state capital. 30 dead, 100 injured. The nation mourns. Your security apparatus failed. The President is watching your response.", autoFx: { sec: -.05, app: -6 },
    opts: [
      { l: "🛡️ Maximum Security Response", d: "Deploy all security. Curfew. Intelligence sweep. Arrest suspects.", fx: { sec: .06, app: 4 }, dc: 1, sk: { media: 5, religious: -3 }, log: "Massive security response. Several arrests made." },
      { l: "🕊️ Interfaith Healing", d: "Focus on unity. Interfaith prayers. Compensation for victims.", fx: { app: 6, hp: .01 }, sk: { religious: 12, media: 8, traditional: 6 }, log: "Governor leads interfaith response. Unity amid tragedy." },
      { l: "📢 Blame Federal Security", d: "'We warned Abuja. They did nothing. This blood is on their hands.'", fx: { app: 3 }, fgRel: -20, sk: { media: 10, youth: 5 }, log: "Governor blames FG for security failure. Tensions rise." },
    ]},
  { id: "sh_bank_crisis", icon: "🏦💥", title: "BANKING CRISIS — STATE ACCOUNTS FROZEN", desc: "A major bank where your state holds ₦4B in accounts is under CBN intervention. Your accounts are frozen. Salary payments, contractor payments, project funding — all halted.", autoFx: { igr: -2 },
    opts: [
      { l: "🏦 Diversify Immediately", d: "Open accounts in 3 other banks. Never depend on one again.", fx: { app: 2, cor: -.01 }, sk: { business: 5 }, log: "State accounts diversified. Lesson learned." },
      { l: "📢 Demand CBN Release Funds", d: "Put public pressure on CBN. 'Workers must be paid!'", fx: { app: 4 }, fgRel: -10, sk: { media: 8, unions: 6 }, log: "Governor pressures CBN. Partial funds released after 2 weeks." },
      { l: "🏦 Emergency Borrowing", d: "Borrow to pay salaries while accounts are frozen.", fx: { app: 3 }, dc: 2, sk: { unions: 5 }, log: "Emergency borrowing covers salary shortfall." },
    ]},
];

// ─── JUDICIARY CHALLENGES ───
// Courts can challenge your actions — triggered by governance decisions
const JUDICIARY_TRIGGERS = [
  { id: "jud_land", trigger: "investor_approved", title: "⚖️ Community Sues Over Land Allocation", desc: "Displaced residents have filed a suit at the State High Court challenging the land allocation to {company}. They argue the process violated the Land Use Act and proper compensation was not paid.", winChance: .55, statute: "Land Use Act, 1978 — S.28-29" },
  { id: "jud_budget", trigger: "forced_budget", title: "⚖️ Opposition Challenges Forced Budget", desc: "The opposition has filed suit arguing your budget was passed without proper House of Assembly approval, violating Section 121 of the 1999 Constitution.", winChance: .35, statute: "S.121 — Appropriation Bill" },
  { id: "jud_corrupt", trigger: "high_corruption", title: "⚖️ Anti-Corruption Group Files Suit", desc: "A civil society group has obtained a court order demanding an audit of your administration's procurement processes. State corruption index: {corruption}%.", winChance: .45, statute: "Public Procurement Act, 2007" },
  { id: "jud_policy", trigger: "policy_enacted", title: "⚖️ Injunction Against Your Policy", desc: "A group of affected citizens has obtained an injunction from the High Court halting your {policy} policy, arguing it violates their constitutional rights.", winChance: .50, statute: "S.36 — Right to Fair Hearing" },
  { id: "jud_security", trigger: "security_action", title: "⚖️ Human Rights Challenge", desc: "The Nigerian Bar Association has filed suit challenging your security operations, alleging extrajudicial detentions and excessive force.", winChance: .40, statute: "S.35 — Right to Personal Liberty" },
  { id: "jud_mining", trigger: "mining_approved", title: "⚖️ Environmental Groups Sue Over Mining", desc: "Environmental organizations have obtained a court order challenging the mining license you approved. They cite potential mercury contamination and community displacement.", winChance: .50, statute: "Environmental Impact Assessment Act, 1992" },
];

// Deputy Governor candidates (player chooses one during setup)
const genDepGov = (state, seed, zone) => {
  const r = rng(seed + state.length * 71);
  return Array.from({ length: 3 }, () => {
    const co = ri(40, 88, r), lo = ri(30, 92, r), cr = ri(5, 45, r), pu = ri(35, 85, r);
    const bg = co > 70 ? "Technocrat" : lo > 75 ? "Party Loyalist" : pu > 70 ? "Popular Figure" : cr < 15 ? "Clean Image" : "Political Insider";
    const bio = genBio(r);
    return { nm: gN(r, zone, state), co, lo, cr, pu, bg, bio, desc: bg === "Technocrat" ? "Strong on policy. Weak on politics." : bg === "Party Loyalist" ? "Keeps the party happy. May lack vision." : bg === "Popular Figure" ? "Loved by the people. Independent-minded." : bg === "Clean Image" ? "No baggage. Untested." : "Connected. Knows where the bodies are buried." };
  });
};

// ─── TRUST NETWORK — stakeholder cascade system ───
// When one stakeholder drops, it pulls others down. One hit cascades.
const TRUST_CASCADES = {
  media: { youth: .4, business: .15 },      // media drops → youth drops 40% of the hit, business 15%
  youth: { media: .2 },                       // youth drops → slight media sympathy
  business: { media: .1, party: .15 },        // business flees → media reports it, party notices
  unions: { youth: .3, media: .2 },            // strikes → youth solidarity, media covers it
  traditional: { party: .25, religious: .2 },  // chiefs angry → party destabilised, religious leaders concerned
  party: { business: .1 },                     // party revolt → business loses confidence
  religious: { traditional: .15, youth: .1 },  // religious denouncement → chiefs align, some youth follow
};
// Cascade effects: if stakeholder drops below threshold, linked ones drop too
const applyCascade = (skApp, changed, amount) => {
  const cascades = TRUST_CASCADES[changed];
  if (!cascades || amount >= 0) return skApp; // only cascade on drops
  const n = { ...skApp };
  Object.entries(cascades).forEach(([target, factor]) => {
    if (n[target] !== undefined) n[target] = Math.max(0, Math.min(100, n[target] + amount * factor));
  });
  return n;
};

// ─── NARRATIVE ENGINE — tracks dominant public perception ───
const NARRATIVES = [
  { id: "strongman", nm: "The Strong Leader", icon: "💪", trigger: (s) => s.sec > .6 && s.pStab > 60 },
  { id: "technocrat", nm: "The Technocrat", icon: "🧠", trigger: (s) => s.lit > .6 && s.cor < .25 },
  { id: "populist", nm: "The People's Governor", icon: "✊", trigger: (s) => s.app > 65 && s.cor > .3 },
  { id: "corrupt", nm: "The Corrupt Politician", icon: "💀", trigger: (s) => s.cor > .45 },
  { id: "builder", nm: "The Builder", icon: "🏗️", trigger: (s) => s.infra > .6 },
  { id: "reformer", nm: "The Reformer", icon: "✨", trigger: (s) => s.cor < .2 && s.lit > .55 },
  { id: "weak", nm: "The Weak Governor", icon: "😰", trigger: (s) => s.app < 35 && s.pStab < 40 },
  { id: "survivor", nm: "The Survivor", icon: "🛡️", trigger: (s) => s.app > 40 && s.app < 55 && s.pStab < 50 },
];

const BSECTORS = [
  { k: "education", l: "Education", i: "📚" }, { k: "health", l: "Health", i: "🏥" },
  { k: "infrastructure", l: "Infra", i: "🏗️" }, { k: "security", l: "Security", i: "🛡️" },
  { k: "agriculture", l: "Agric", i: "🌾" }, { k: "administration", l: "Admin", i: "🏛️" },
  { k: "salaries", l: "Salaries", i: "💰" }, { k: "debt", l: "Debt", i: "📉" },
];

// ── BUDGET ASSEMBLY: MDA envelope requests (inflated asks from ministries) ──
const MDA_ENVELOPES = [
  { k: "health", nm: "Ministry of Health", i: "🏥", ask: 22, need: 12, pad: "New SUVs for 12 medical directors, ₦2.5B 'sensitization' campaign, ₦1.8B for a fresh Commissioner's guest house.", real: "Primary Health Centres are collapsing. Only 3 of 21 LGAs have functional immunisation cold chains." },
  { k: "education", nm: "Ministry of Education", i: "📚", ask: 20, need: 14, pad: "₦4B 'monitoring & evaluation', ₦1.2B annual retreat in Dubai for SUBEB, procurement of 400 laptops at ₦2.8m each.", real: "70,000 out-of-school children. WAEC pass rate at 38%. Teachers unpaid for 4 months in 6 LGAs." },
  { k: "infrastructure", nm: "Ministry of Works", i: "🏗️", ask: 25, need: 16, pad: "Grading rural roads twice under two contracts, ₦6B for a 400m 'flyover' where a roundabout would do.", real: "Federal roads collapsing in the state. 4 bridges rated structurally unsafe by COREN." },
  { k: "security", nm: "State Security Trust Fund", i: "🛡️", ask: 15, need: 11, pad: "₦3B 'operational logistics' with no receipts, buying 40 armoured vehicles from a company owned by the DSS director's brother.", real: "Banditry displacing 12 rural communities. Amotekun/Ebube Agu need real fuel and radios." },
  { k: "agriculture", nm: "Ministry of Agriculture", i: "🌾", ask: 12, need: 8, pad: "'Fertilizer distribution' to phantom cooperatives run by party faithful, tractor hire at 3× market rate.", real: "Farmer-herder clashes down 40% of arable land. Seeds and irrigation genuinely needed." },
  { k: "administration", nm: "Government House", i: "🏛️", ask: 14, need: 6, pad: "Deputy Governor's convoy upgrade (₦900m), First Lady 'Pet Project' office (₦1.5B), foreign trips (₦2B).", real: "Basic salaries, utilities, secretariat maintenance." },
];

// ── ELECTION TRIBUNAL: grounds a losing candidate can plead ──
const TRIBUNAL_GROUNDS = [
  { id: "overvoting", nm: "Over-voting in 214 polling units", desc: "Number of votes cast exceeded accredited voters in 3 LGAs — clear violation of S.51 Electoral Act 2022. If proven, INEC must cancel and rerun.", baseChance: .55, req: "You need collated Form EC8As from those units + BVAS backend data. INEC will resist." },
  { id: "bvas", nm: "BVAS/IReV upload failure", desc: "Result sheets were not uploaded to IReV portal in real time as required by INEC guidelines. Casts doubt on chain of custody.", baseChance: .45, req: "Requires expert forensic analysis of BVAS machines. Very technical, judges may defer." },
  { id: "qualification", nm: "Opponent's non-qualification (S.177)", desc: "Discrepancies in opponent's affidavit (INEC Form EC9) — sworn age, WAEC certificate authenticity, or citizenship. If proven, opponent is disqualified ab initio.", baseChance: .40, req: "Need certified true copies from WAEC/JAMB/Immigration. Perjury is a serious ground." },
  { id: "violence", nm: "Violence & disruption in strongholds", desc: "Documented ballot snatching, PU-agent intimidation, and arson in wards where you polled 80%+. Election was not free and fair (S.134(1)(b)).", baseChance: .38, req: "Requires eyewitnesses, police reports, and video evidence. Judges want more than social-media clips." },
  { id: "noncompliance", nm: "Substantial non-compliance with Electoral Act", desc: "INEC officials abandoned units, results were written in hotels, Presiding Officers signed under duress. Substantial non-compliance affects the outcome.", baseChance: .35, req: "Broad ground — judges want to see the non-compliance changed the arithmetic outcome, not merely occurred." },
];

// Zone fallback name pools
const ZNAMES = {
  SE: { fn: ["Chukwuemeka","Nkechi","Obinna","Adaeze","Ikenna","Chidinma","Ugochukwu","Ngozi","Chidi","Amaka","Ogechi","Ebuka","Uchenna","Chioma","Kelechi","Ifeoma"], ln: ["Mbam","Ukpai","Nweze","Eze","Okoro","Nwachukwu","Igwe","Ibe","Okafor","Ogbonnaya","Obi","Anya","Nwankwo","Ekuma","Agbo","Iheanacho","Nnamani","Umahi"] },
  SW: { fn: ["Adewale","Funke","Olumide","Yetunde","Segun","Bukola","Tunde","Folake","Bode","Abiodun","Yinka","Omolara","Babatunde","Adunni","Kemi","Damilola","Olamide","Gbenga"], ln: ["Adeyemi","Ogundimu","Olawale","Adeleke","Bakare","Oladipo","Adekunle","Balogun","Owolabi","Akinyemi","Fashola","Ajayi","Sanwo-Olu","Bamidele","Oyetola","Tinubu","Soyinka"] },
  SS: { fn: ["Edet","Iniobong","Oghenetega","Blessing","Edidiong","Oghenero","Mercy","Godwin","Itoro","Ese","Okon","Emem","Tonye","Preye","Boma","Osaze","Iyobosa","Oghenekaro"], ln: ["Etim","Okon","Udo","Bassey","Effiong","Ekpenyong","Omoruyi","Ogiemwonyi","Agbor","Akpan","Inyang","Idiaghe","Sylva","Dickson","Diri","Obaseki","Okowa","Ibori"] },
  NW: { fn: ["Abubakar","Hauwa","Ibrahim","Amina","Musa","Fatima","Bashir","Zainab","Hamza","Halima","Sadiq","Hadiza","Aliyu","Sani","Yusuf","Maryam","Khadija","Binta"], ln: ["Bello","Abdullahi","Yakubu","Lawal","Garba","Yusuf","Danjuma","Mohammed","Suleiman","Aliyu","Usman","Abubakar","Yar'Adua","El-Rufai","Ganduje","Tambuwal","Matawalle","Bagudu"] },
  NE: { fn: ["Abubakar","Hauwa","Musa","Aisha","Bukar","Falmata","Ibrahim","Bintu","Babagana","Yagana","Adamu","Halima","Kashim","Modu","Goni","Lawan","Kachalla","Maryam"], ln: ["Shettima","Modu","Bukar","Maina","Abba","Alkali","Monguno","Goni","Lawan","Kyari","Zulum","Mustapha","Buni","Dankwambo","Ibrahim","Yusuf"] },
  NC: { fn: ["Danladi","Hannatu","Audu","Martha","Sani","Deborah","Yakubu","Grace","Tanko","Blessing","Ishaya","Laraba","Terhemen","Doosuur","Davou","Choji","Ndako","Tsado"], ln: ["Salihu","Idris","Bature","Ocholi","Danasabe","Agabi","Bako","Doma","Aliyu","Audu","Kolo","Zhiya","Ortom","Suswam","Lalong","Mutfwang","Bago","Sani-Bello"] },
};

// State-specific indigenous name pools (dominant ethnic group of each state).
// Falls back to zone pool if a state is not listed.
const SNAMES = {
  // ── YORUBA (South-West + Kwara core) ──
  Lagos:  { fn: ["Adebayo","Yemisi","Tunde","Folashade","Babajide","Adunni","Olumide","Bisola","Ayomide","Damilola","Kunle","Sade"], ln: ["Sanwo-Olu","Tinubu","Adeyemi","Bakare","Fashola","Ogundimu","Adeleke","Akinyemi","Bamidele","Adekunle","Balogun"] },
  Oyo:    { fn: ["Adebayo","Bukola","Olamide","Folake","Gbenga","Adunni","Niyi","Yetunde","Tope","Wale"], ln: ["Ajimobi","Makinde","Adelabu","Olunloyo","Ladoja","Ajayi","Bamidele","Awolowo","Soyinka","Adesina"] },
  Ogun:   { fn: ["Abiodun","Modupe","Tunde","Folake","Wale","Yewande","Segun","Adeola","Yemi","Subomi"], ln: ["Daniel","Amosun","Abiodun","Osoba","Obasanjo","Awolowo","Adetona","Akinkugbe","Adesina"] },
  Osun:   { fn: ["Adeleke","Iyabo","Tope","Yemi","Gbenga","Damilola","Niyi","Bukola","Olamide"], ln: ["Adeleke","Aregbesola","Oyinlola","Akande","Aregbe","Bamidele","Adekunle","Owolabi"] },
  Ondo:   { fn: ["Akeredolu","Aderotimi","Yetunde","Femi","Olu","Mimiko","Tope","Gbenga"], ln: ["Akeredolu","Mimiko","Agagu","Adefarati","Falae","Aiyedatiwa","Owolabi","Adesina"] },
  Ekiti:  { fn: ["Kayode","Bisi","Niyi","Adunni","Tope","Femi","Folake","Bukola"], ln: ["Fayemi","Fayose","Oyebanji","Olukayode","Ajayi","Bamidele","Adekunle","Adebayo"] },
  Kwara:  { fn: ["AbdulRazaq","Saraki","Bukola","Tope","Adunni","Yetunde","Sulaiman","Aminat"], ln: ["AbdulRazaq","Saraki","Lai","Mohammed","Aliyu","Bukola","Ahmed","Oyedepo"] },
  // ── IGBO (South-East) ──
  Anambra: { fn: ["Chukwuemeka","Ngozi","Obinna","Adaeze","Ifeanyi","Chioma","Uchenna","Ifeoma","Kelechi"], ln: ["Soludo","Obiano","Obi","Ngige","Ekwueme","Ezeife","Mbadinuju","Achebe","Ukpabi"] },
  Imo:     { fn: ["Chukwuemeka","Ifeoma","Uche","Chinyere","Ikenna","Nkechi","Ebuka","Adaobi"], ln: ["Uzodinma","Okorocha","Ihedioha","Ohakim","Iwu","Ararume","Nwosu","Madumere"] },
  Abia:    { fn: ["Otti","Chinedu","Ngozi","Onyeka","Ikechukwu","Chioma","Uchenna"], ln: ["Otti","Ikpeazu","Orji","Kalu","Abaribe","Wabara","Nyerere","Ekwueme"] },
  Enugu:   { fn: ["Peter","Ifeanyi","Ngozi","Obinna","Adaeze","Chinwe","Tochi"], ln: ["Mbah","Ugwuanyi","Chime","Nnamani","Nwobodo","Ekweremadu","Anyim","Ohaneze"] },
  Ebonyi:  { fn: ["Francis","Nwifuru","Uchenna","Chioma","Kelechi","Ngozi","Ebuka"], ln: ["Nwifuru","Umahi","Egwu","Elechi","Idah","Nweze","Ogbonnaya","Anyim"] },
  // ── HAUSA-FULANI (North-West) ──
  Kano:    { fn: ["Abubakar","Aisha","Aminu","Hadiza","Sani","Maryam","Bashir","Khadija","Yusuf"], ln: ["Ganduje","Kwankwaso","Shekarau","Bayero","Yusuf","Sanusi","Dantata","Rabiu","Dangote"] },
  Kaduna:  { fn: ["Nasir","Hauwa","Uba","Aishatu","Aliyu","Maryam","Bashir","Hadiza"], ln: ["El-Rufai","Sani","Yakowa","Makarfi","Yero","Balarabe","Hunkuyi","Yari"] },
  Katsina: { fn: ["Aminu","Aisha","Dikko","Hadiza","Umar","Maryam","Bello","Zainab"], ln: ["Masari","Radda","Yar'Adua","Shema","Buhari","Umar","Dikko","Saulawa"] },
  Sokoto:  { fn: ["Aminu","Bello","Ahmadu","Hauwa","Sa'idu","Maryam","Aliyu","Zainab"], ln: ["Tambuwal","Aliyu","Wamakko","Bafarawa","Dingyadi","Maccido","Abubakar"] },
  Zamfara: { fn: ["Bello","Dauda","Aisha","Sani","Maryam","Yusuf","Hadiza"], ln: ["Matawalle","Yari","Sani","Lawali","Anka","Marafa","Kaura"] },
  Kebbi:   { fn: ["Atiku","Nasiru","Hauwa","Aminu","Aishatu","Sa'idu","Halima"], ln: ["Bagudu","Idris","Aliero","Dakingari","Argungu","Sokoto","Marafa"] },
  Jigawa:  { fn: ["Umar","Aisha","Sule","Halima","Aminu","Maryam","Bashir"], ln: ["Namadi","Badaru","Sule","Lamido","Birninkudu","Saminaka","Kazaure"] },
  // ── KANURI (North-East) ──
  Borno:   { fn: ["Babagana","Kashim","Bintu","Falmata","Modu","Yagana","Goni","Hauwa"], ln: ["Zulum","Shettima","Kyari","Monguno","Imam","Sheriff","Lawan","Ali-Modu"] },
  Yobe:    { fn: ["Mai","Bukar","Aisha","Lawan","Yagana","Hassan","Falmata"], ln: ["Buni","Geidam","Lawan","Shettima","Maina","Goni","Bukar","Damaturu"] },
  Adamawa: { fn: ["Ahmadu","Atiku","Bindow","Aisha","Boni","Hauwa","Murtala"], ln: ["Fintiri","Bindow","Nyako","Ribadu","Atiku","Abubakar","Lamido","Murtala"] },
  Bauchi:  { fn: ["Bala","Adamu","Aisha","Yuguda","Hadiza","Sadiq","Maryam"], ln: ["Mohammed","Muazu","Yuguda","Ningi","Tafawa-Balewa","Lawal","Abubakar"] },
  Gombe:   { fn: ["Inuwa","Hauwa","Danjuma","Yakubu","Aisha","Halima","Muhammadu"], ln: ["Yahaya","Dankwambo","Goje","Bayero","Kumo","Akko","Tula"] },
  Taraba:  { fn: ["Darius","Agbu","Hauwa","Jolly","Suntai","Maryam","Ishaku"], ln: ["Kefas","Ishaku","Suntai","Nyame","Agbu","Bwacha","Bogoro"] },
  // ── IBIBIO / ANNANG (Akwa Ibom) ──
  Akwa_Ibom: { fn: ["Umo","Edidiong","Mfon","Itoro","Aniefiok","Eno","Nsikan","Idongesit","Emem"], ln: ["Eno","Emmanuel","Akpabio","Udom","Attah","Akpan","Bassey","Etim","Ekpenyong","Inyang"] },
  // ── EFIK (Cross River) ──
  Cross_River: { fn: ["Bassey","Asuquo","Iquo","Effiong","Nsa","Mbang","Etubom","Aniefiok"], ln: ["Otu","Ayade","Imoke","Duke","Donald","Ekpo","Nyong","Bassey"] },
  // ── IJAW (Bayelsa, Rivers) / Edo / Delta ──
  Bayelsa: { fn: ["Diepreye","Goodluck","Timipre","Doubra","Ebipade","Preye","Boma"], ln: ["Diri","Dickson","Sylva","Jonathan","Alamieyeseigha","Briggs","Asari"] },
  Rivers:  { fn: ["Siminalayi","Nyesom","Tonye","Boma","Preye","Ibim","Magnus","Dakuku"], ln: ["Fubara","Wike","Amaechi","Odili","Abe","Peterside","Briggs","Sekibo"] },
  Delta:   { fn: ["Sheriff","Ifeanyi","Oghenetega","Ovie","Avwerosuo","Ejiroghene","James"], ln: ["Oborevwori","Okowa","Uduaghan","Ibori","Omo-Agege","Ogboru","Otuaro","Onanefe"] },
  Edo:     { fn: ["Monday","Godwin","Osahon","Osaze","Iyobosa","Esosa","Imuetinyan","Adams"], ln: ["Okpebholo","Obaseki","Oshiomhole","Igbinedion","Omoruyi","Ize-Iyamu","Aigboje","Iyamu"] },
  // ── NORTH-CENTRAL / MIDDLE BELT ──
  Benue:   { fn: ["Hyacinth","Terhemen","Doosuur","Aondowase","Mngusoor","Iorwuese","Samuel"], ln: ["Alia","Ortom","Suswam","Akume","Gemade","Iorpuu","Gbillah","Mark"] },
  Plateau: { fn: ["Davou","Caleb","Choji","Mwadkwon","Hanatu","Dachung","Nanmwa","Joshua"], ln: ["Mutfwang","Lalong","Dariye","Jang","Bot","Gyang","Pwajok","Damishi"] },
  Kogi:    { fn: ["Usman","Audu","Ochanya","Onyeche","Idakwo","Aliyu","Yahaya"], ln: ["Ododo","Bello","Wada","Audu","Onoja","Ocholi","Idris","Abubakar"] },
  Niger:   { fn: ["Umaru","Ndako","Tsado","Kolo","Liman","Garba","Yusuf"], ln: ["Bago","Sani-Bello","Aliyu","Yahaya","Ahmed","Etsu","Mohammed","Kuta"] },
  Nassarawa: { fn: ["Abdullahi","Sani","Tanko","Aisha","Ishaya","Hannatu","Yakubu"], ln: ["Sule","Al-Makura","Adamu","Akwe","Doma","Audu","Ochekpe","Agabi"] },
  Kwara: { fn: ["AbdulRahman","Bukola","Saraki","Aminat","Yemi","Tope","Adunni"], ln: ["AbdulRazaq","Saraki","Lai","Ahmed","Aliyu","Bukola","Mohammed","Oyedepo"] },
  FCT:   { fn: ["Nyesom","Aisha","Adamu","Hauwa","Tunde","Adunni","Chinedu"], ln: ["Wike","El-Rufai","Bello","Mohammed","Akinola","Nzeribe","Ojukwu","Mark"] },
};
window.SNAMES_REF = SNAMES;

const BIO_JOBS = ["Former teacher","Ex-banker","Retired civil servant","Businessperson","Former journalist","Community organizer","Legal practitioner","Engineer","Medical doctor","Ex-military officer","Academic professor","NGO director","Former LGA chairman","Trade union leader","Pharmacist","Quantity surveyor","Ex-NYSC director","Returnee from diaspora","Town union president","Former PA to a senator"];
const BIO_LINKS = ["connected to the state farmers association","with links to the market women alliance","known associate of the transport workers union","well-regarded by traditional rulers","active in the traders association","with strong ties to the youth council","connected to religious leaders across the state","known in the construction industry","with deep party connections at ward level","a protege of a former commissioner","linked to the civil service establishment","active in the women's cooperative network","with quiet influence at the Government Lodge","funded by a powerful contractors' cartel","trusted by the okada/keke riders union","raised in a prominent ruling-house compound"];

function gN(r, zone, stateId) {
  if (stateId && SNAMES[stateId]) { const z = SNAMES[stateId]; return pick(z.fn, r) + " " + pick(z.ln, r); }
  const z = ZNAMES[zone] || ZNAMES.SW; return pick(z.fn, r) + " " + pick(z.ln, r);
}
// ─── FLAGSHIP ───
// The agenda picked at setup. Shown in the header, quoted by the anchors and
// the adviser, given its own Desk decision every year ("flagship" phase) and
// judged in the Wikipedia article from the "flagship_milestone" record.
const FLAGSHIP = {
  education: { i: "📚", nm: "Education for All", goal: "rehabilitate 120 primary schools" },
  health: { i: "🏥", nm: "Healthcare Revolution", goal: "reopen 40 primary health centres" },
  infrastructure: { i: "🏗️", nm: "Build, Build, Build", goal: "complete one trunk road in each senatorial zone" },
  security: { i: "🛡️", nm: "Peace & Security", goal: "equip 2,000 community guards" },
  agriculture: { i: "🌾", nm: "Agricultural Transformation", goal: "irrigate 5,000 hectares of farmland" },
  anticorruption: { i: "⚖️", nm: "Clean Governance", goal: "publish every state contract online" },
  youth: { i: "💼", nm: "Youth Empowerment", goal: "train and place 10,000 young people" },
  women: { i: "👩", nm: "Women & Social Welfare", goal: "put 20,000 more girls in school" },
  technology: { i: "💻", nm: "Digital Economy", goal: "connect 200 public schools to broadband" },
  housing: { i: "🏠", nm: "Affordable Housing", goal: "hand over 1,000 low-cost homes" },
};

// ─── STATES IN ONE LINE ───
// What a player feels in this state, from the state's own starting numbers
// (own revenue, security, poverty) and its godfather. Replaces raw percentages.
function stateLine(stateId, d) {
  if (!d) return "";
  const gf = STATE_GODFATHERS[stateId] || {};
  const wealth = d.igr >= 15 ? "Rich state, high expectations" : d.igr >= 6 ? "Earns some of its own money, needs federal money too" : "Poor state, depends on federal money";
  const bits = [wealth];
  bits.push(d.sec < .35 ? "serious security pressure" : d.sec < .5 ? "some security pressure" : "relatively calm");
  if ((gf.power || 0) >= 80) bits.push("a dominant godfather");
  else if ((gf.power || 0) <= 45) bits.push("a weak godfather");
  return bits.join(" · ");
}

// ─── THE CAST ───
// Eight recurring people who carry the consequences. Built once when the
// governor takes office and saved with the game, so every screen and module
// uses the same name for the same person. Their record is the ledger: any
// entry whose target is their name (see SOP_CAST.history).
// The godfather's title and description come from the state's power and
// aggression (STATE_GODFATHERS), not from the real politicians whose names,
// nicknames and biographies that table also holds.
function gfPersona(def) {
  const p = (def && def.power) || 60, a = (def && def.aggression) || 50;
  return {
    title: p >= 80 ? "The Kingmaker" : p >= 60 ? "The Party Financier" : "The Old Guard Boss",
    desc: a > 70 ? "Funds campaigns, owns the party structure, and punishes disloyalty in public."
      : a > 50 ? "Funds campaigns and controls the party machinery. He collects what he is owed."
      : "A quieter power broker. He prefers favours to fights, until he doesn't.",
  };
}
// Portraits (public/art). The deputy's picture follows the deputy's first name.
const CAST_ART = { godfather: "godfather", adviser: "special-adviser", speaker: "speaker", reporter: "reporter", efcc: "efcc-investigator", rival: "rival", labour: "labour-leader" };
const FEMALE_FIRST = ["Adaeze", "Adunni", "Aisha", "Amina", "Ayomide", "Bilkisu", "Binta", "Bisola", "Bukola", "Chiamaka", "Chidinma", "Damilola", "Ekaette", "Fatima", "Folake", "Folashade", "Funmilayo", "Hadiza", "Halima", "Hannatu", "Hauwa", "Kemi", "Khadija", "Maryam", "Ngozi", "Sade", "Titi", "Yemisi", "Zainab", "Adeola", "Aishatu", "Aminat", "Falmata", "Bintu", "Yagana", "Ifeoma", "Chioma", "Nkechi", "Uche"];
const castArt = (c) => {
  if (!c) return null;
  if (c.id === "deputy") return "./art/characters/" + (FEMALE_FIRST.includes(String(c.name).split(" ")[0]) ? "deputy-female" : "deputy-male") + ".webp";
  return CAST_ART[c.id] ? "./art/characters/" + CAST_ART[c.id] + ".webp" : null;
};
const CAST_FEMALE = ["Adaeze", "Funmilayo", "Halima", "Ngozi", "Aisha", "Kemi", "Chiamaka", "Zainab", "Ekaette", "Bisola", "Hauwa", "Yemisi"];
function makeCast(setup, stateId, zone) {
  const r = rng((stateId || "").length * 131 + ((setup && setup.nm) || "").length * 17 + 7);
  // Same seed and call as the first campaign, so this is the opponent the
  // player already met.
  const oppName = gN(rng((stateId ? stateId.length : 5) * 77 + 99), zone, stateId);
  const opp = "Hon. " + oppName;
  // No two people in the cast share a name or a surname.
  const used = new Set([oppName, (setup && setup.nm) || "", (setup && setup.depGov && setup.depGov.nm) || ""].filter(Boolean));
  const usedSur = new Set([...used].map(n => n.split(" ").slice(1).join(" ")));
  const person = () => {
    let n = gN(r, zone, stateId);
    for (let i = 0; i < 12 && (used.has(n) || usedSur.has(n.split(" ").slice(1).join(" "))); i++) n = gN(r, zone, stateId);
    used.add(n); usedSur.add(n.split(" ").slice(1).join(" "));
    return n;
  };
  const surname = () => person().split(" ").slice(1).join(" ");
  const gfDef = STATE_GODFATHERS[stateId] || {};
  const sa = (setup && setup.saName) || (SA_ROSTER[0] && SA_ROSTER[0].name) || "Special Adviser";
  return {
    godfather: { id: "godfather", role: "Godfather", title: gfPersona(gfDef).title, name: "Chief " + person() },
    adviser: { id: "adviser", role: "Special Adviser", title: "Special Adviser", name: sa },
    deputy: { id: "deputy", role: "Deputy Governor", title: "Deputy Governor", name: (setup && setup.depGov && setup.depGov.nm) || person() },
    speaker: { id: "speaker", role: "Speaker", title: "Speaker, State House of Assembly", name: "Rt. Hon. " + person() },
    reporter: { id: "reporter", role: "Reporter", title: "Investigative reporter", name: pick(CAST_FEMALE, r) + " " + surname() },
    efcc: { id: "efcc", role: "EFCC investigator", title: "Head of Operations, EFCC zonal command", name: person() },
    rival: { id: "rival", role: "Rival", title: "Leader of the opposition", name: opp },
    labour: { id: "labour", role: "Labour leader", title: "NLC State Chairman", name: "Comrade " + person() },
  };
}
function genBio(r) { return pick(BIO_JOBS, r) + ", " + pick(BIO_LINKS, r) + ". " + (r() > .5 ? "Known as a hard worker." : r() > .5 ? "Reputation for loyalty." : "Considered ambitious."); }
const genCab = (st, seed, zone) => { const r = rng(seed + st.length * 42); const c = {}; CROLES.forEach(role => { c[role.k] = { nm: gN(r, zone, st), co: ri(35, 92, r), lo: ri(25, 90, r), cr: ri(5, 55, r), pu: ri(25, 85, r), role: role.k, bio: genBio(r) }; }); return c; };

const PERSONAS = [
  { id: "mama", nm: "Mama Nkechi Onuoha", i: "👩‍🍳", d: "Aba market trader. Bad roads, multiple taxes.", ks: ["infrastructure", "agriculture"] },
  { id: "musa", nm: "Mallam Musa Tanko", i: "👨‍🌾", d: "Tomato farmer in Kadawa. Needs irrigation and security.", ks: ["agriculture", "security"] },
  { id: "chidinma", nm: "Chidinma Iheanacho", i: "👩‍🎓", d: "UNN graduate, 2 years job-hunting in Enugu.", ks: ["education", "infrastructure"] },
  { id: "garba", nm: "Alhaji Garba Sa'idu", i: "🧔", d: "Fulani cattle merchant. Wants ranches not violence.", ks: ["security", "agriculture"] },
  { id: "mary", nm: "Sister Mary Etim", i: "👩‍⚕️", d: "Calabar PHC nurse. No drugs, no salary.", ks: ["health"] },
  { id: "emeka", nm: "Emeka Okafor", i: "💻", d: "Aba-born Yaba dev. Power and fibre or he 'japas'.", ks: ["education", "infrastructure"] },
  { id: "amina", nm: "Hajiya Amina Bashir", i: "🧕", d: "Kano girl-child education advocate.", ks: ["education", "health"] },
  { id: "pastor", nm: "Pastor Iyobosa Obaseki", i: "⛪", d: "Benin megachurch pastor. Cult violence in Edo.", ks: ["security", "health"] },
  { id: "baba", nm: "Baba Adisa Ogundimu", i: "🚛", d: "Lagos-Kano trucker. Potholes, NURTW touts, police.", ks: ["infrastructure"] },
  { id: "ngozi", nm: "Ngozi Iwu", i: "🏪", d: "Onitsha Main Market wholesaler.", ks: ["infrastructure", "administration"] },
  { id: "ahmed", nm: "Ahmed AbdulRazaq", i: "📚", d: "Ilorin ASUU strike victim, 7 yrs for a 4-yr degree.", ks: ["education"] },
  { id: "peace", nm: "Mama Peace Diri", i: "👵", d: "Retired Bayelsa teacher. ₦18k pension, paid 3 months late.", ks: ["education", "health", "security"] },
  { id: "tonye", nm: "Tonye Briggs", i: "🛢️", d: "Bonny boat-owner. Oil spills, no compensation.", ks: ["security", "infrastructure"] },
  { id: "terhemen", nm: "Terhemen Suswam", i: "🧑‍🌾", d: "Tiv yam farmer in Guma — herder attacks, no recovery.", ks: ["agriculture", "security"] },
  { id: "kashim", nm: "Kashim Modu", i: "🧕", d: "Maiduguri IDP returnee. Wants school for his kids.", ks: ["education", "security"] },
  { id: "davou", nm: "Davou Mwadkwon", i: "⛪", d: "Berom farmer in Bokkos. Survived 3 night raids.", ks: ["security", "agriculture"] },
];

const STAKEHOLDERS = [
  { id: "media", nm: "Media", i: "📺", b: 50 }, { id: "business", nm: "Business", i: "💼", b: 50 },
  { id: "unions", nm: "Unions", i: "✊", b: 50 }, { id: "traditional", nm: "Trad. Rulers", i: "👑", b: 55 },
  { id: "party", nm: "Party", i: "🗳️", b: 55 }, { id: "youth", nm: "Youth", i: "🎓", b: 45 },
  { id: "religious", nm: "Religious", i: "🕌", b: 55 },
];

const POLICIES = [
  // ─── QUICK POLICIES (1 turn) ───
  { id: "school_feed", nm: "School Feeding Programme", s: "education", c: 2, t: 1, fx: { lit: .02, hp: .01, app: 8 }, d: "Hot meals for 500K pupils daily.", cr: .1, ecoSec: "services", ecoBoost: .02, jobsAdd: 3000, compDesc: "School feeding programme serving 500K pupils" },
  { id: "comm_pol", nm: "Community Policing", s: "security", c: 2, t: 1, fx: { sec: .05, app: 4 }, d: "5,000 volunteer safety corps.", cr: 0, ecoSec: null, ecoBoost: 0, jobsAdd: 5000, compDesc: "Community policing network across all LGAs" },
  { id: "farm_sub", nm: "Farm Input Subsidies", s: "agriculture", c: 2.5, t: 1, fx: { agr: .05, app: 6 }, d: "Seeds, fertilizer, pesticides for 100K farmers.", cr: .1, ecoSec: "agriculture", ecoBoost: .03, jobsAdd: 1000, compDesc: "Farm subsidies reaching 100K farmers" },
  { id: "anti_cor", nm: "Anti-Corruption Unit", s: "administration", c: 1, t: 1, fx: { corM: -.08, app: 5 }, d: "Independent audit and prosecution body.", cr: 0, ecoSec: null, ecoBoost: 0, jobsAdd: 200, compDesc: "Anti-corruption unit operational" },
  // ─── MEDIUM PROJECTS (2 turns) ───
  { id: "free_edu", nm: "Free Education Programme", s: "education", c: 3.5, t: 2, fx: { lit: .04, app: 5 }, d: "Abolish school fees K-12. Teacher recruitment.", cr: 0, ecoSec: "services", ecoBoost: .02, jobsAdd: 8000, compDesc: "Free education for all — fees abolished statewide" },
  { id: "phc", nm: "Primary Healthcare Revival", s: "health", c: 4, t: 2, fx: { hp: .06, app: 6 }, d: "Renovate 200 PHCs. Drugs, nurses, equipment.", cr: .05, ecoSec: "services", ecoBoost: .02, jobsAdd: 4000, compDesc: "200 health centres renovated and equipped" },
  { id: "health_ins", nm: "State Health Insurance", s: "health", c: 3, t: 2, fx: { hp: .04, app: 4 }, d: "Universal coverage scheme. ₦500/month.", cr: 0, ecoSec: "services", ecoBoost: .01, jobsAdd: 1500, compDesc: "Health insurance covering 2M residents" },
  { id: "rural_elec", nm: "Rural Electrification (Solar)", s: "infrastructure", c: 5, t: 2, fx: { infra: .05, agr: .02, app: 7 }, d: "Solar mini-grids for 100 communities.", cr: .05, ecoSec: "manufacturing", ecoBoost: .03, jobsAdd: 2000, compDesc: "100 communities now have 24/7 solar power" },
  { id: "water", nm: "Clean Water Project", s: "infrastructure", c: 3.5, t: 2, fx: { hp: .03, infra: .03, app: 6 }, d: "500 boreholes + treatment plants.", cr: .05, ecoSec: null, ecoBoost: 0, jobsAdd: 1500, compDesc: "Clean water delivered to 1M+ residents" },
  { id: "sec_outfit", nm: "State Security Corps", s: "security", c: 4, t: 2, fx: { sec: .08, app: 3 }, d: "Armed state security outfit. 3,000 trained.", cr: 0, ecoSec: null, ecoBoost: 0, jobsAdd: 3000, compDesc: "State security corps fully operational — 3,000 strong" },
  { id: "digi_gov", nm: "Digital Governance Platform", s: "administration", c: 2, t: 2, fx: { corM: -.05, app: 3 }, d: "Online services. E-payment. Open data.", cr: 0, ecoSec: "tech", ecoBoost: .04, jobsAdd: 500, compDesc: "E-governance platform serving 500K residents online" },
  { id: "irrigation", nm: "Irrigation Network", s: "agriculture", c: 4, t: 2, fx: { agr: .06, infra: .02 }, d: "Year-round farming for 50K hectares.", cr: .05, ecoSec: "agriculture", ecoBoost: .04, jobsAdd: 5000, compDesc: "Irrigation enabling year-round farming on 50K hectares" },
  // ─── MEGAPROJECTS (3-4 turns) ───
  { id: "roads", nm: "⭐ 500km Road Network", s: "infrastructure", c: 8, t: 3, fx: { infra: .10, app: 12 }, d: "Major highway + feeder roads. Game-changer.", cr: .15, ecoSec: "trade", ecoBoost: .06, jobsAdd: 15000, compDesc: "500km road network operational — connecting all LGAs" },
  { id: "mega_airport", nm: "⭐ Cargo Airport", s: "infrastructure", c: 15, t: 4, fx: { infra: .15, app: 14 }, d: "International cargo airport. ₦15B mega project.", cr: .20, ecoSec: "trade", ecoBoost: .08, jobsAdd: 5000, compDesc: "International cargo airport opens for business" },
  { id: "tech_hub", nm: "⭐ Technology Innovation City", s: "education", c: 6, t: 3, fx: { lit: .04, infra: .03, app: 8 }, d: "Tech campus, incubators, coding schools.", cr: .05, ecoSec: "tech", ecoBoost: .08, jobsAdd: 3000, compDesc: "Technology Innovation City launched — 3,000 tech jobs" },
  { id: "housing", nm: "⭐ Mass Housing Estate", s: "infrastructure", c: 10, t: 3, fx: { infra: .08, app: 10 }, d: "5,000 affordable housing units.", cr: .15, ecoSec: "manufacturing", ecoBoost: .04, jobsAdd: 12000, compDesc: "5,000 housing units delivered to residents" },
  { id: "rail", nm: "⭐ Intra-State Rail Line", s: "infrastructure", c: 18, t: 4, fx: { infra: .18, app: 15 }, d: "Light rail connecting 3 major cities. Transformational.", cr: .20, ecoSec: "trade", ecoBoost: .10, jobsAdd: 8000, compDesc: "Light rail system operational — 3 cities connected" },
  { id: "ind_park", nm: "⭐ Industrial Park", s: "infrastructure", c: 12, t: 3, fx: { infra: .10, app: 8 }, d: "200-hectare industrial zone with power & roads.", cr: .12, ecoSec: "manufacturing", ecoBoost: .08, jobsAdd: 20000, compDesc: "Industrial park attracting 20+ manufacturers — 20K jobs" },
  { id: "mega_hospital", nm: "⭐ State Teaching Hospital", s: "health", c: 8, t: 3, fx: { hp: .10, app: 10 }, d: "500-bed specialist hospital. MRI, dialysis, cancer.", cr: .10, ecoSec: "services", ecoBoost: .03, jobsAdd: 2000, compDesc: "500-bed teaching hospital — specialist care available" },
  { id: "uni", nm: "⭐ State University Upgrade", s: "education", c: 7, t: 3, fx: { lit: .06, app: 7 }, d: "New faculties, hostels, labs, library.", cr: .08, ecoSec: "services", ecoBoost: .03, jobsAdd: 3000, compDesc: "State university transformed — 15 new faculties" },
  // ─── NEW: NIGERIAN-SPECIFIC POLICIES (harder tradeoffs) ───
  { id: "amotekun", nm: "⭐ Amotekun-style Security Corps", s: "security", c: 6, t: 2, fx: { sec: .07, app: 8 }, d: "Recruit, train and arm 3,000 community guards. Federal Police HQ will protest.", cr: .08, ecoSec: "services", ecoBoost: .01, jobsAdd: 3000, compDesc: "Community security corps deployed across all LGAs" },
  { id: "free_csec", nm: "Free Caesarean Section Programme", s: "health", c: 1.8, t: 1, fx: { hp: .04, app: 9 }, d: "Free emergency C-sections + neonatal care in all general hospitals. Cuts maternal mortality.", cr: .05, ecoSec: "services", ecoBoost: .01, jobsAdd: 1500, compDesc: "Free C-section programme saving an estimated 4,000 mothers/year" },
  { id: "school_voucher", nm: "Public School Voucher (₦40k/term)", s: "education", c: 4, t: 1, fx: { lit: .04, app: 7 }, d: "Direct fee voucher to indigent parents — undercuts Almajiri street recruitment.", cr: .10, ecoSec: "services", ecoBoost: .02, jobsAdd: 800, compDesc: "Voucher programme enrolling 250K out-of-school children" },
  { id: "land_digitise", nm: "Digitise Certificate of Occupancy (eC-of-O)", s: "administration", c: 2.5, t: 2, fx: { corM: -.05, infra: .02, app: 4 }, d: "Blockchain land registry. Ends double-allocation racket — and the kickbacks it funds.", cr: 0, ecoSec: "services", ecoBoost: .03, jobsAdd: 600, compDesc: "Land registry fully digitised — 180K titles regularised" },
  { id: "okada_kit", nm: "Tricycle (Keke) Conversion Scheme", s: "infrastructure", c: 3, t: 1, fx: { sec: .02, app: 6 }, d: "Phase out okadas in capital city; subsidised tricycles for displaced riders.", cr: .12, ecoSec: "trade", ecoBoost: .03, jobsAdd: 4000, compDesc: "10,000 okadas converted to tricycles in capital" },
  { id: "kpa_irrigation", nm: "Dry-Season Irrigation Scheme", s: "agriculture", c: 5, t: 2, fx: { agr: .08, app: 6 }, d: "Solar pumps + earth dams in 30 villages. Two harvests a year.", cr: .07, ecoSec: "agriculture", ecoBoost: .07, jobsAdd: 6000, compDesc: "Dry-season irrigation in 30 villages — doubled food output" },
  { id: "abandoned_audit", nm: "Audit & Resume Abandoned Federal Projects", s: "infrastructure", c: 4, t: 2, fx: { infra: .05, app: 7 }, d: "Take over and complete 12 abandoned federal projects in your state. Bills FG later — maybe.", cr: .10, ecoSec: "manufacturing", ecoBoost: .03, jobsAdd: 2500, compDesc: "12 abandoned federal projects completed by state" },
];

const UNCONST = [
  { id: "u1", nm: "Deploy State Army", r: "S.217-220: Only President controls Armed Forces.", ruling: "The Supreme Court rules: 'The command and operational control of the Armed Forces of the Federation is vested exclusively in the President as Commander-in-Chief under S.218(1). A state governor has no constitutional authority to raise, maintain, or deploy any military force.'" },
  { id: "u2", nm: "Print State Currency", r: "S.15-16: Currency is exclusive federal matter.", ruling: "The Supreme Court rules: 'The power to issue legal tender and regulate currency is vested exclusively in the Federal Government under Item 15, Part I of the Second Schedule. Any attempt by a state to create alternative currency is void ab initio.'" },
  { id: "u3", nm: "Close State Borders", r: "S.41: Right to free movement.", ruling: "The Supreme Court rules: 'Section 41 guarantees every citizen the right to move freely throughout Nigeria and to reside in any part thereof. A state governor cannot restrict interstate movement — this power does not exist in the Concurrent Legislative List.'" },
];

const DILEMMAS = [
  { id: "herder", nm: "Herder-Farmer Crisis", d: "Fulani herders and farmers clash. 12 dead.", ch: [{ l: "Deploy force", fx: { sec: .04, app: 5 }, sk: { traditional: -10 }, rk: "Ethnic backlash" }, { l: "Peace dialogue", fx: { sec: .01, app: 2 }, sk: { traditional: 8 }, rk: "Seen as weak" }, { l: "Grazing reserves", fx: { agr: .03 }, sk: { business: 5 }, rk: "Land conflicts" }] },
  { id: "strike", nm: "Salary Strike", d: "3 months unpaid. Workers shut down government.", ch: [{ l: "Pay all arrears", fx: { app: 8 }, sk: { unions: 15 }, rk: "₦4B debt increase", dc: 4 }, { l: "Pay 50% + negotiate", fx: { app: 3 }, sk: { unions: -3 }, rk: "Trust deficit — they'll strike again", dc: 2 }, { l: "Sack striking workers", fx: { app: -10, sec: -.02 }, sk: { unions: -25, youth: -12, media: -10 }, rk: "NIC WILL intervene. S.254C gives them jurisdiction. Expect court-ordered reinstatement and compensation.", dc: 0, nicTrigger: true }] },
  { id: "land", nm: "Land Scandal", d: "Commissioner sold gov land.", ch: [{ l: "Fire publicly", fx: { app: 8, corM: -.05 }, sk: { media: 10, party: -10 }, rk: "Party revolt" }, { l: "Bury it", fx: { corM: .05 }, sk: { media: -15 }, rk: "Leak" }, { l: "Refer to EFCC", fx: { app: 5 }, sk: { media: 8 }, rk: "Slow" }] },
  { id: "flood", nm: "Catastrophic Floods", d: "200,000 displaced.", ch: [{ l: "Full emergency", fx: { app: 10 }, sk: { media: 8 }, rk: "Budget blown", dc: 5 }, { l: "Wait for FG", fx: { app: -5 }, sk: { media: -8 }, rk: "Suffering" }, { l: "Targeted relief", fx: { app: 5, infra: .02 }, sk: {}, rk: "Slow", dc: 2 }] },
  { id: "whistle", nm: "Whistleblower", d: "₦8B padding exposed.", ch: [{ l: "Accept + reform", fx: { app: 6, corM: -.06 }, sk: { media: 12, party: -8 }, rk: "Party revolt" }, { l: "Discredit", fx: { corM: .05, app: -5 }, sk: { media: -15 }, rk: "Int'l focus" }, { l: "Quiet fix", fx: { corM: -.02 }, sk: { party: 3 }, rk: "Partial" }] },
  { id: "smear", nm: "Opposition Smear", d: "Fake bribe video.", ch: [{ l: "Sue them", fx: { app: 3 }, sk: { media: 5 }, rk: "Court drags" }, { l: "Ignore it", fx: { app: -5 }, sk: { youth: -8 }, rk: "Believed" }, { l: "Transparency report", fx: { app: 8, corM: -.02 }, sk: { media: 10, youth: 8 }, rk: "None" }] },
];

const CONST_CAN = ["Appoint commissioners (S.192)", "Present appropriation bill (S.121)", "Sign bills into law (S.100)", "Grant pardons (S.212)", "Appoint special advisers (S.196)", "Land allocation (Land Use Act)"];
const CONST_CANT = ["Control military/police (S.215,217)", "Print money (Exclusive List)", "Regulate interstate commerce", "Control mines/minerals", "Close borders (S.41)", "Override federal laws (S.4)"];

// Bills sent by House of Assembly for governor to sign or veto
const HOUSE_BILLS = [
  { id: "hb_pension", nm: "State Pension Reform Bill", d: "House wants to increase state pension by 40%. Popular but expensive.", signFx: { app: 6 }, signCost: 2, vetoFx: { app: -4 }, sk: { unions: 10 }, vetoSk: { unions: -12, party: -5 }, civic: "Under S.100, a bill passed by the House requires the Governor's assent to become law. The Governor may withhold assent (veto).",
    clauses: [
      { t: "Section 3: All state pensioners receive 40% increase effective immediately.", ok: true },
      { t: "Section 7: Pension Fund Administrator to be appointed by the Speaker of the House.", ok: false, flag: "This gives the House control over pension funds — a clear conflict of interest and potential vehicle for embezzlement." },
      { t: "Section 12: Annual pension audit to be published and accessible to the public.", ok: true },
    ] },
  { id: "hb_lga_auto", nm: "LGA Financial Autonomy Bill", d: "Grants local governments direct access to their allocations. Reduces your control.", signFx: { app: 4, corM: -.02 }, signCost: 0, vetoFx: { app: -3 }, sk: { media: 8, youth: 5 }, vetoSk: { media: -8 }, civic: "LGA autonomy has been a major governance debate. The Constitution (S.7) guarantees a local government system, but states often control LGA finances through the State Joint Local Government Account." },
  { id: "hb_min_wage", nm: "State Minimum Wage Bill", d: "Proposes ₦70,000 minimum wage for state workers. Above federal level.", signFx: { app: 8 }, signCost: 3.5, vetoFx: { app: -6 }, sk: { unions: 15, youth: 8 }, vetoSk: { unions: -15, youth: -8 }, civic: "While the National Minimum Wage Act sets a floor, states can legislate higher minimums. The fiscal implications are significant — salaries are often 50-70% of state budgets.",
    clauses: [
      { t: "Section 2: Minimum wage for all state civil servants set at ₦70,000.", ok: true },
      { t: "Section 5: Implementation committee of 15 members to receive ₦5M monthly allowance each.", ok: false, flag: "₦75M/month for a committee? That's ₦900M/year in 'allowances' alone — classic budget padding disguised as implementation costs." },
      { t: "Section 8: Wage review every 3 years indexed to inflation.", ok: true },
    ] },
  { id: "hb_open_gov", nm: "Open Government Bill", d: "Requires all state contracts above ₦50M to be published online.", signFx: { app: 5, corM: -.04 }, signCost: 0.3, vetoFx: { corM: .03, app: -3 }, sk: { media: 12, business: 5, youth: 8 }, vetoSk: { media: -15, youth: -10 }, civic: "Transparency legislation strengthens accountability. Nigeria's Freedom of Information Act (2011) provides a federal framework, but state-level open governance laws can go further." },
  { id: "hb_trad_council", nm: "Traditional Council Enhancement Bill", d: "Gives traditional rulers advisory role in policy and more budget.", signFx: { app: 2 }, signCost: 0.8, vetoFx: { app: -2 }, sk: { traditional: 15, religious: 5 }, vetoSk: { traditional: -12, religious: -3 }, civic: "Traditional institutions vary by region (Emirate councils, Obas, Ezes, etc.). Their constitutional role is limited, but their social influence is enormous.",
    clauses: [
      { t: "Section 1: Establish State Council of Traditional Rulers as advisory body.", ok: true },
      { t: "Section 4: Annual budget allocation of ₦800M for traditional council operations.", ok: true },
      { t: "Section 9: Council procurement exempt from state Public Procurement Law.", ok: false, flag: "Exempting ANY body from procurement law is a blank cheque for corruption. No oversight, no accountability — public funds vanish into 'traditional council operations.'" },
    ] },
  { id: "hb_youth_fund", nm: "Youth Enterprise Fund Bill", d: "Creates a ₦2B revolving loan fund for youth businesses.", signFx: { app: 7 }, signCost: 2, vetoFx: { app: -5 }, sk: { youth: 15, business: 5 }, vetoSk: { youth: -12 }, civic: "Youth unemployment is Nigeria's most urgent challenge. States can create enterprise funds, but managing them without corruption is the real test.",
    clauses: [
      { t: "Section 2: ₦2B revolving fund for youth enterprise loans at 3% interest.", ok: true },
      { t: "Section 6: Fund management board to include 5 nominees of the House.", ok: false, flag: "House members placing their people on the management board gives legislators direct access to loan disbursement — a textbook patronage setup." },
      { t: "Section 10: Quarterly reports on loan repayment rates to be made public.", ok: true },
      { t: "Section 14: ₦200M allocated for 'sensitization tours' across all LGAs.", ok: false, flag: "₦200M for 'sensitization tours'? That's a slush fund. Real sensitization costs a fraction of this. The rest disappears into travel allowances and per diems." },
    ] },
  { id: "hb_anti_cult", nm: "Anti-Cultism Bill", d: "Criminalizes cult membership with up to 15 years imprisonment.", signFx: { sec: .03, app: 4 }, signCost: 0.2, vetoFx: { app: -2 }, sk: { religious: 8, traditional: 5, youth: -6 }, vetoSk: { religious: -5 }, civic: "Campus and community cultism is a major security concern. Several states have enacted anti-cultism laws, though enforcement remains challenging." },
  { id: "hb_grazing", nm: "Anti-Open Grazing Bill", d: "Bans open grazing of cattle. Herders must use ranches. Highly divisive.", signFx: { sec: .02, agr: .02, app: 3 }, signCost: 0.5, vetoFx: { app: -2 }, sk: { traditional: -8, religious: -5, business: 6, youth: 4 }, vetoSk: { traditional: 5, business: -4 }, civic: "The farmer-herder crisis has killed thousands. Several southern and middle belt states have passed anti-open grazing laws, but enforcement and constitutionality remain contested.",
    clauses: [
      { t: "Section 1: Open grazing of cattle prohibited within state boundaries.", ok: true },
      { t: "Section 5: State to establish 3 ranching zones with modern facilities.", ok: true },
      { t: "Section 11: ₦500M compensation fund for 'affected stakeholders' managed by a committee chaired by the House Agriculture Chairman.", ok: false, flag: "A ₦500M fund managed by the same lawmaker who chairs the committee? No independent oversight. 'Affected stakeholders' is vague enough to include anyone the chairman wants to pay." },
    ] },
  { id: "hb_state_police", nm: "State Vigilante / Community Policing Bill", d: "Establishes an armed state security outfit (Amotekun/Ebube Agu style) under your control. Federal Police HQ will object loudly.", signFx: { sec: .05, app: 7 }, signCost: 2.5, vetoFx: { sec: -.02, app: -5 }, sk: { youth: 12, traditional: 10, business: 6 }, vetoSk: { youth: -10, traditional: -8 }, civic: "Section 214 of the Constitution gives policing to the Federation. States have skirted this by creating 'community security outfits' — legally fragile but politically irresistible.",
    clauses: [
      { t: "Section 2: Outfit operates as a state security service under the Governor.", ok: true },
      { t: "Section 4: Personnel armed with pump-action shotguns only, subject to NPF coordination.", ok: true },
      { t: "Section 9: Recruitment quota of 30 personnel per House member's constituency, nominated by the member.", ok: false, flag: "Lawmakers personally nominating armed personnel creates private militias accountable to politicians, not the state. Classic 'political thug' pipeline." },
      { t: "Section 14: Independent Complaints Board chaired by the State Human Rights Commission.", ok: true },
    ] },
  { id: "hb_lga_audit", nm: "Local Government Audit & JAAC Reform Bill", d: "Mandates quarterly forensic audits of all 774-style LGA accounts and breaks open the State Joint Local Government Account (JAAC).", signFx: { corM: -.05, app: 5 }, signCost: 0.5, vetoFx: { corM: .03, app: -4 }, sk: { media: 12, youth: 8, party: -10, traditional: -4 }, vetoSk: { media: -12, youth: -6, party: 5 }, civic: "Sec. 162(6) of the Constitution created the JAAC. In practice it is the single biggest siphon for LGA funds in Nigeria — vetoing reform is what godfathers expect." },
  { id: "hb_sukuk", nm: "₦150B Sukuk Infrastructure Bond Bill", d: "Authorises issuance of a Shari'ah-compliant sukuk for rural roads and bridges. Locks the next 7 years of IGR.", signFx: { infra: .06, app: 4 }, signCost: 1, vetoFx: { app: -2 }, sk: { business: 10, religious: 6, party: -5 }, vetoSk: { business: -8 }, civic: "DMO-approved sukuk has funded over ₦1tn of Nigerian road infrastructure since 2017. The catch is the long-tenor encumbrance on IGR and FAAC deductions at source.",
    clauses: [
      { t: "Section 3: ₦150B sukuk, 7-year tenor, ijara structure.", ok: true },
      { t: "Section 5: Proceeds ring-fenced for 24 named road projects published in the Gazette.", ok: true },
      { t: "Section 11: Issuing Agent fee of 4.5% of principal (₦6.75B) paid up front to a single advisory firm.", ok: false, flag: "Industry standard is 0.5-1.2%. A 4.5% issuing fee on ₦150B is a ₦5B+ kickback dressed as professional services." },
    ] },
  { id: "hb_whistle", nm: "State Whistleblower Protection Bill", d: "Protects civil servants who expose corruption and gives them 5% of recovered funds.", signFx: { corM: -.06, app: 6 }, signCost: 0.4, vetoFx: { app: -4 }, sk: { media: 15, youth: 10, party: -8 }, vetoSk: { media: -15, youth: -8 }, civic: "Nigeria's federal Whistleblower Policy (2016) recovered over ₦500B in its first three years but lacks statutory protection. State-level Acts give whistleblowers actual legal cover." },
  { id: "hb_almajiri", nm: "Almajiri & Out-of-School Children Integration Bill", d: "Bans street-begging by minors, integrates almajirai into the formal Tsangaya-plus-Western curriculum, and prosecutes negligent parents.", signFx: { lit: .04, app: 5 }, signCost: 3, vetoFx: { lit: -.01, app: -3 }, sk: { religious: -10, traditional: -8, youth: 8, media: 10 }, vetoSk: { religious: 6, media: -10 }, civic: "Nigeria has ~20 million out-of-school children, the largest concentration of any country. Reform routinely collides with powerful Mallams and the Tsangaya establishment in the North." },
  { id: "hb_land_use", nm: "Land Use Charge / Property Tax Bill", d: "Imposes a graduated property tax in urban LGAs to triple IGR — and triple your political enemies overnight.", signFx: { igrM: .12, app: -6 }, signCost: 0.2, vetoFx: { app: 2 }, sk: { business: -12, traditional: -6, party: -4, media: -4 }, vetoSk: { business: 5 }, civic: "Lagos State's Land Use Charge Law tripled IGR but triggered Supreme Court litigation, market shutdowns, and the 2018 governor's near-revolt. Every state that tries it pays a political price." },
  { id: "hb_gender", nm: "Violence Against Persons (Prohibition) Domestication Bill", d: "Domesticates the federal VAPP Act, criminalises FGM, rape (with life sentence), and economic abuse.", signFx: { app: 6 }, signCost: 0.3, vetoFx: { app: -5 }, sk: { youth: 12, religious: -6, traditional: -8, media: 15 }, vetoSk: { youth: -12, media: -15, religious: 4 }, civic: "VAPP is federal but only applies in FCT until states domesticate it. As of 2024, several northern states still have not — citing 'cultural sensitivities'." },
];

// ─── GODFATHER ───
const STATE_GODFATHERS = {
  // SOUTH WEST
  Lagos: { nm: "Chief Bola Tinubu", title: "The Jagaban", power: 95, aggression: 70, loyalty_demand: 90, desc: "Controls Lagos like a boardroom. Every governor is his protégé. Cross him and you're finished." },
  Oyo: { nm: "Chief Rasheed Ladoja", title: "The Ibadan Strongman", power: 65, aggression: 55, loyalty_demand: 60, desc: "Heir to the Adedibu machine. Ibadan politics runs through him." },
  Ogun: { nm: "Chief Olusegun Osoba", title: "The Abeokuta Elder", power: 60, aggression: 40, loyalty_demand: 55, desc: "Former governor. Quiet influence. Prefers negotiation over threats." },
  Osun: { nm: "Ogbeni Rauf Aregbesola", title: "The Organiser", power: 55, aggression: 60, loyalty_demand: 65, desc: "Built the grassroots machine. Still controls ward-level structures." },
  Ondo: { nm: "Dr. Olusegun Mimiko", title: "The Iroko", power: 50, aggression: 45, loyalty_demand: 50, desc: "Medical doctor turned political strategist. Knows every village." },
  Ekiti: { nm: "Dr. Kayode Fayemi", title: "The Intellectual", power: 55, aggression: 35, loyalty_demand: 50, desc: "Cerebral. Prefers policy influence over raw power. But don't test him." },
  // SOUTH SOUTH
  Rivers: { nm: "Chief Nyesom Wike", title: "Mr. Projects", power: 90, aggression: 90, loyalty_demand: 95, desc: "The most aggressive godfather in Nigeria. Controls Rivers with iron fist. Demands TOTAL loyalty." },
  Delta: { nm: "Chief James Ibori", title: "The Delta Lord", power: 75, aggression: 65, loyalty_demand: 80, desc: "Even prison couldn't break his grip. Delta politics still runs through Oghara." },
  Akwa_Ibom: { nm: "Sen. Godswill Akpabio", title: "The Uncommon Man", power: 70, aggression: 60, loyalty_demand: 70, desc: "Senate leader. Federal connections. Can make or break careers." },
  Bayelsa: { nm: "Chief Timipre Sylva", title: "The Bayelsa Boss", power: 60, aggression: 55, loyalty_demand: 65, desc: "Oil money and federal connections. Controls the creek politics." },
  Cross_River: { nm: "Chief Donald Duke", title: "The Calabar Gentleman", power: 40, aggression: 25, loyalty_demand: 35, desc: "Fading influence. More celebrity than kingmaker now. Manageable." },
  Edo: { nm: "Comrade Adams Oshiomhole", title: "The Comrade", power: 75, aggression: 80, loyalty_demand: 85, desc: "Labour leader turned godfather. Fights dirty when crossed. Ask Obaseki." },
  // SOUTH EAST
  Anambra: { nm: "Chief Chris Uba", title: "The Original Godfather", power: 50, aggression: 70, loyalty_demand: 80, desc: "Nigeria's most notorious godfather case. Fragmented now but the archetype." },
  Abia: { nm: "Chief Orji Uzor Kalu", title: "OUK", power: 65, aggression: 55, loyalty_demand: 65, desc: "Business mogul and senator. Abia politics flows through Igbere." },
  Imo: { nm: "Chief Rochas Okorocha", title: "Owelle", power: 60, aggression: 65, loyalty_demand: 75, desc: "Free education was his weapon. Still commands a cult following." },
  Enugu: { nm: "Sen. Chimaroke Nnamani", title: "The Enugu Godfather", power: 55, aggression: 50, loyalty_demand: 60, desc: "Medical doctor. Controls Enugu quietly from the Senate." },
  Ebonyi: { nm: "Engr. Dave Umahi", title: "The Ebonyi Builder", power: 70, aggression: 60, loyalty_demand: 70, desc: "Engineering contractor turned governor. Infrastructure is his weapon." },
  // NORTH CENTRAL
  Kwara: { nm: "Dr. Bukola Saraki", title: "The Saraki Dynasty", power: 80, aggression: 65, loyalty_demand: 85, desc: "Textbook political dynasty. Father was Senate Leader. He was Senate President. Kwara IS Saraki." },
  Benue: { nm: "Sen. George Akume", title: "The Benue Patriarch", power: 60, aggression: 50, loyalty_demand: 55, desc: "SGF and former governor. Tiv politics runs through him." },
  Plateau: { nm: "Chief Joshua Dariye", title: "The Plateau Man", power: 45, aggression: 40, loyalty_demand: 50, desc: "Pardoned ex-governor. Diminished but not forgotten." },
  Nasarawa: { nm: "Sen. Abdullahi Adamu", title: "The Chairman", power: 55, aggression: 45, loyalty_demand: 55, desc: "Former APC national chairman. Federal connections still active." },
  Niger: { nm: "Dr. Babangida Aliyu", title: "The Chief Servant", power: 50, aggression: 35, loyalty_demand: 45, desc: "Former governor. Intellectual influence more than raw power." },
  Kogi: { nm: "Alhaji Ibrahim Idris", title: "The Kogi Strongman", power: 50, aggression: 55, loyalty_demand: 60, desc: "Former governor. Ebira politics power broker." },
  // NORTH WEST
  Kano: { nm: "Sen. Rabiu Musa Kwankwaso", title: "Kwankwasiyya", power: 85, aggression: 70, loyalty_demand: 80, desc: "Built the largest grassroots movement in the North. Red cap army. NNPP founder." },
  Kaduna: { nm: "Malam Nasir El-Rufai", title: "El-Rufai", power: 75, aggression: 85, loyalty_demand: 80, desc: "Ruthless reformer. Transformed Kaduna. Makes enemies easily. Very dangerous when crossed." },
  Katsina: { nm: "Gov. Aminu Masari", title: "The Katsina Voice", power: 55, aggression: 40, loyalty_demand: 50, desc: "Former speaker. Moderate influence. Katsina is relatively open." },
  Sokoto: { nm: "Sen. Aliyu Wamakko", title: "The Sokoto Overlord", power: 65, aggression: 55, loyalty_demand: 65, desc: "Former governor. Controls Sokoto APC machinery." },
  Zamfara: { nm: "Abdulaziz Yari", title: "The Zamfara Boss", power: 60, aggression: 60, loyalty_demand: 65, desc: "Former governor. Controls state structures despite banditry crisis." },
  Kebbi: { nm: "Sen. Atiku Bagudu", title: "The Kebbi Man", power: 55, aggression: 40, loyalty_demand: 50, desc: "Former governor and minister. Moderate influence." },
  Jigawa: { nm: "Sen. Sule Lamido", title: "The Jigawa Godfather", power: 65, aggression: 55, loyalty_demand: 70, desc: "Former governor and PDP stalwart. Deep grassroots." },
  // NORTH EAST
  Borno: { nm: "Sen. Ali Modu Sheriff", title: "The Sheriff", power: 70, aggression: 75, loyalty_demand: 80, desc: "The most powerful man in Borno politics. Survived everything including Boko Haram era scrutiny." },
  Adamawa: { nm: "Alhaji Atiku Abubakar", title: "The Waziri", power: 85, aggression: 50, loyalty_demand: 60, desc: "Former VP and perennial presidential candidate. Adamawa is his base. Massive nationwide network." },
  Bauchi: { nm: "Chief Adamu Muazu", title: "The Bauchi Elder", power: 50, aggression: 40, loyalty_demand: 50, desc: "Former governor and PDP chairman. Declining influence." },
  Taraba: { nm: "Rev. Danbaba Suntai", title: "The Taraba Memory", power: 30, aggression: 20, loyalty_demand: 30, desc: "Weakest godfather influence. Taraba is relatively open territory." },
  Gombe: { nm: "Sen. Danjuma Goje", title: "The Gombe Emperor", power: 65, aggression: 60, loyalty_demand: 70, desc: "Former governor. Gombe politics doesn't move without his nod." },
  Yobe: { nm: "Alhaji Bukar Ibrahim", title: "The Yobe Pioneer", power: 50, aggression: 35, loyalty_demand: 45, desc: "Former governor. Declining but still consulted." },
  // FCT
  FCT: { nm: "Political Cabals", title: "The Aso Rock Circle", power: 80, aggression: 60, loyalty_demand: 70, desc: "The FCT has no single godfather — it's controlled by whoever holds federal power." },
};

const GODFATHER_DEMANDS = [
  { id: "gf_contract", d: "I need that ₦3B road contract awarded to my company. No bidding.", acceptFx: { corM: .06, pStab: 8, app: -3 }, acceptLog: "Awarded ₦3B no-bid contract.", rejectFx: { pStab: -10 }, rejectLog: "Refused contract demand. He's furious." },
  { id: "gf_land", d: "There's prime government land in the capital. I want 50 hectares. For free.", acceptFx: { corM: .05, pStab: 6, app: -4 }, acceptLog: "Gave 50 hectares of government land.", rejectFx: { pStab: -8, app: 2 }, rejectLog: "Denied land grab. Public approves." },
  { id: "gf_appointment", d: "My nephew needs to be commissioner. Put him in Works.", acceptFx: { corM: .03, pStab: 10 }, acceptLog: "Appointed godfather's nephew as commissioner.", rejectFx: { pStab: -12 }, rejectLog: "Refused appointment. Party crisis." },
  { id: "gf_money", d: "I funded your campaign. I need ₦2B returned. Call it a security vote.", acceptFx: { corM: .08, pStab: 5 }, acceptLog: "Paid ₦2B 'security vote'. Campaign debt settled.", rejectFx: { pStab: -15 }, rejectLog: "Refused to repay. 'You'll regret this.'" },
  { id: "gf_assembly", d: "I need you to support my candidate for Speaker of the House. He's loyal to ME, not you.", acceptFx: { corM: .02, pStab: 12, app: -2 }, acceptLog: "Installed godfather's candidate as Speaker.", rejectFx: { pStab: -10, app: 3 }, rejectLog: "Fought for independent Speaker. Party furious." },
  { id: "gf_revenue", d: "I want 10% of the state's IGR channeled through my company as 'consultancy fees'.", acceptFx: { corM: .10, pStab: 8, app: -5 }, acceptLog: "10% of IGR now goes to godfather's 'consultancy'.", rejectFx: { pStab: -15, app: 4 }, rejectLog: "Refused to share IGR. He's declared war." },
];

// 6 new dilemmas (adding to existing 6)
const DILEMMAS_EXTRA = [
  { id: "religious2", nm: "Religious Crisis", d: "A blasphemy accusation sparks riots. 3 churches and 2 mosques burned. 8 dead.", ch: [{ l: "Impose curfew + deploy Amotekun/VGN", fx: { sec: .03, app: 3 }, sk: { religious: -5, youth: -6 }, rk: "Civil liberties concerns" }, { l: "Emergency interfaith dialogue", fx: { sec: .01, app: 4 }, sk: { religious: 10, traditional: 8 }, rk: "Slow while people die" }, { l: "Arrest ringleaders on both sides", fx: { sec: .04, app: 2 }, sk: { religious: -8, media: 5 }, rk: "Both sides hate you" }] },
  { id: "kidnap", nm: "Schoolchildren Kidnapped", d: "Armed men abduct 87 students from a secondary school. Parents are at Government House.", ch: [{ l: "Pay ransom secretly", fx: { app: 5, sec: -.03 }, sk: { media: -10, youth: 8 }, rk: "Encourages more kidnapping", dc: 2 }, { l: "Military rescue operation", fx: { sec: .04, app: 3 }, sk: { media: 8, youth: 5 }, rk: "Children could die" }, { l: "Negotiate without paying", fx: { app: -2, sec: .01 }, sk: { media: 3 }, rk: "Takes weeks. Parents suffer." }] },
  { id: "asuu", nm: "ASUU Strike", d: "State university lecturers join nationwide ASUU strike. 45,000 students stuck at home. Parents furious. Youth stakeholders plummeting.", ch: [{ l: "Pay state university lecturers separately", fx: { app: 6, lit: .02 }, sk: { youth: 12, unions: 8 }, rk: "₦1.5B cost. Other states may resent you.", dc: 1.5 }, { l: "Wait for federal resolution", fx: { app: -4 }, sk: { youth: -12, unions: -5 }, rk: "Students lose a year. You look helpless." }, { l: "Sack striking lecturers — hire replacements", fx: { app: -8, lit: -.03 }, sk: { youth: -15, unions: -25, media: -12, religious: -5 }, rk: "NIC WILL order reinstatement. Education quality collapses. National outrage.", nicTrigger: true }, { l: "Convert to state university system", fx: { lit: .03, app: 2 }, sk: { youth: 5, unions: -8 }, rk: "Constitutional grey area. ₦3B cost.", dc: 3 }] },
  { id: "oil_spill", nm: "Oil Spill Disaster", d: "Pipeline explosion contaminates 30km of farmland and water sources. Fishing communities devastated.", ch: [{ l: "Demand federal compensation + clean up", fx: { app: 5, agr: -.02 }, sk: { media: 6, traditional: 5 }, rk: "FG drags feet" }, { l: "State funds emergency cleanup", fx: { app: 8, agr: .01, hp: .01 }, sk: { media: 10, business: 5 }, rk: "₦3B cost", dc: 3 }, { l: "Sue the oil company", fx: { app: 3 }, sk: { media: 8, business: -5 }, rk: "Case takes years" }] },
  { id: "market_fire", nm: "Central Market Fire", d: "The state's largest market burns. 2,000 traders lose everything. ₦15B in goods destroyed.", ch: [{ l: "Emergency relief fund", fx: { app: 10 }, sk: { business: 12, unions: 8, media: 5 }, rk: "₦2B cost", dc: 2 }, { l: "Promise to rebuild (later)", fx: { app: -3 }, sk: { business: -10, media: -8 }, rk: "Traders feel abandoned" }, { l: "Rebuild immediately with modern design", fx: { app: 8, infra: .03 }, sk: { business: 15, youth: 5 }, rk: "₦5B heavy cost", dc: 5 }] },
  { id: "cholera", nm: "Cholera Outbreak", d: "Cholera hits 12 LGAs. 200 dead. Hospitals overwhelmed. WHO issues alert.", ch: [{ l: "Declare health emergency, all resources", fx: { hp: .04, app: 8 }, sk: { media: 8, religious: 5 }, rk: "₦2B cost", dc: 2 }, { l: "Request federal health intervention", fx: { app: -3, hp: .01 }, sk: { media: -5 }, rk: "FG slow. More die." }, { l: "Target worst LGAs only", fx: { hp: .02, app: 3 }, sk: { media: 3 }, rk: "Other LGAs feel ignored", dc: 0.8 }] },
];

// ─── MEDIA ECOSYSTEM ───
const MEDIA_EVENTS = [
  // Negative narratives
  { id: "m_hashtag_fail", type: "social", icon: "📱", title: "#GovernorFailed Trending", desc: "A viral hashtag is trending on X (Twitter). Citizens are sharing photos of bad roads, empty hospitals, and unpaid teachers. Over 50,000 tweets in 6 hours.", severity: "high",
    opts: [
      { l: "🎤 Hold Press Conference", d: "Address it head-on with data. Show what you've actually done.", fx: { app: 4 }, sk: { media: 8, youth: 5 }, risk: "If your record is weak, the press will eat you alive." },
      { l: "📊 Release Governance Data", d: "Publish a detailed scorecard — projects completed, money spent, jobs created.", fx: { app: 3, cor: -.02 }, sk: { media: 10, business: 5 }, risk: "Only works if your numbers are actually good." },
      { l: "🤫 Ignore It", d: "Don't feed the trolls. It'll blow over.", fx: { app: -4 }, sk: { media: -5, youth: -8 }, risk: "Silence looks like guilt." },
      { l: "💰 Pay Influencers to Counter", d: "Hire bloggers and influencers to flood the timeline with positive content.", fx: { app: 1, cor: .03 }, sk: { media: -3, youth: -4 }, risk: "If exposed, it becomes a bigger scandal." },
    ]},
  { id: "m_newspaper_expose", type: "newspaper", icon: "📰", title: "Front Page Exposé", desc: "The state's leading newspaper publishes a 3-page investigation into land allocation irregularities. They have documents. Names. Amounts.", severity: "high",
    opts: [
      { l: "📋 Cooperate with Investigation", d: "Open your books. If you're clean, transparency wins.", fx: { app: 5, cor: -.03 }, sk: { media: 12 }, risk: "If you're NOT clean, this makes it worse." },
      { l: "🏛️ Refer to Anti-Corruption Agency", d: "Announce a formal investigation into the allegations.", fx: { app: 3 }, sk: { media: 6, business: -3 }, risk: "Agency may find something you didn't expect." },
      { l: "⚖️ Threaten Legal Action", d: "Send lawyers after the newspaper. Demand retraction.", fx: { app: -3 }, sk: { media: -15, youth: -6 }, risk: "Looks like you're hiding something. Press freedom groups will rally." },
      { l: "🤫 No Comment", d: "Refuse to engage. Let the news cycle move on.", fx: { app: -5 }, sk: { media: -8 }, risk: "The newspaper runs Part 2 next week." },
    ]},
  { id: "m_radio_angry", type: "radio", icon: "📻", title: "Radio Callers Furious", desc: "The morning radio show is flooded with angry callers. Water supply cut off for 3 weeks in 4 LGAs. The host is openly critical of your administration.", severity: "medium",
    opts: [
      { l: "📞 Call In Live", d: "Phone into the show yourself. Explain the situation. Announce emergency response.", fx: { app: 6 }, sk: { media: 10, youth: 8 }, risk: "Live radio — one wrong word and it clips everywhere." },
      { l: "📤 Send Commissioner", d: "Send your Information Commissioner to respond officially.", fx: { app: 2 }, sk: { media: 4 }, risk: "Commissioner might not handle the pressure well." },
      { l: "🔧 Fix the Water Problem", d: "Ignore the radio, deploy emergency water tankers today.", fx: { app: 4, hp: .01 }, sk: { media: 3 }, risk: "Costs ₦0.2B but shows action.", dc: 0.2 },
    ]},
  { id: "m_tv_documentary", type: "tv", icon: "📺", title: "TV Documentary: 'The Broken Promise'", desc: "A national TV station airs a 45-minute documentary on governance failures in your state. It's well-produced and devastating. Trending #1 on YouTube.", severity: "high",
    opts: [
      { l: "📺 Request Right of Reply", d: "Demand airtime for a response documentary showing your achievements.", fx: { app: 3 }, sk: { media: 5 }, risk: "Your achievements need to be compelling enough." },
      { l: "🗣️ Town Hall Meeting", d: "Hold a public town hall to address concerns raised in the documentary.", fx: { app: 7 }, sk: { media: 8, youth: 10, traditional: 5 }, risk: "Citizens may use the opportunity to vent." },
      { l: "💰 Buy Airtime for Counter-Documentary", d: "Commission your own documentary. 'The Real Story.'", fx: { app: 2, cor: .02 }, sk: { media: -5, business: 3 }, risk: "Seen as propaganda." },
    ]},
  { id: "m_blogger_bribe", type: "blogger", icon: "💻", title: "Blogger Demands Payment", desc: "A popular blogger with 200K followers threatens to publish a negative story unless they receive 'media support' of ₦5M. This is common in Nigerian media.", severity: "medium",
    opts: [
      { l: "💰 Pay Them", d: "It's how the game is played. ₦5M is nothing. The story goes away.", fx: { cor: .02 }, sk: { media: 3 }, risk: "Other bloggers will come for their own cut.", dc: 0.005 },
      { l: "❌ Refuse and Let Them Publish", d: "Call the bluff. If the story is false, it won't stick.", fx: { app: -2 }, sk: { media: -3, youth: -4 }, risk: "The story might actually be damaging." },
      { l: "⚖️ Report to Police", d: "Blackmail is a crime. File a report.", fx: { app: 2 }, sk: { media: -8, youth: 4 }, risk: "Other media see this as an attack on press freedom." },
    ]},
  // Positive narratives
  { id: "m_viral_good", type: "social", icon: "📱", title: "#GovOfTheYear Trending", desc: "A citizen's video of a newly completed road goes viral. 'Look at what the governor did!' 200K views in 3 hours. Your social media team didn't even plan this.", severity: "positive",
    opts: [
      { l: "📊 Amplify with More Data", d: "Share a thread of ALL your completed projects. Ride the wave.", fx: { app: 6 }, sk: { media: 8, youth: 10 }, risk: "None — this is your moment." },
      { l: "🙏 Thank Citizens Humbly", d: "Post a humble response: 'This is just the beginning. We work for you.'", fx: { app: 8 }, sk: { media: 6, youth: 8, religious: 4 }, risk: "None." },
      { l: "🤫 Stay Quiet", d: "Let the people speak for themselves. Don't politicize it.", fx: { app: 3 }, sk: { youth: 4 }, risk: "Missed opportunity to build momentum." },
    ]},
  { id: "m_newspaper_praise", type: "newspaper", icon: "📰", title: "Editorial: 'A Governor Who Delivers'", desc: "The state newspaper publishes a glowing editorial about your fiscal discipline and project delivery. Other newspapers pick it up nationally.", severity: "positive",
    opts: [
      { l: "📢 Share Widely", d: "Repost across all government channels. Make sure everyone sees it.", fx: { app: 5 }, sk: { media: 6, business: 5 }, risk: "Might seem like you're tooting your own horn." },
      { l: "📋 Use as Evidence for Investors", d: "Package the editorial into your investment pitch deck.", fx: { igr: 0.3 }, sk: { business: 10 }, risk: "None." },
      { l: "🙏 Stay Humble", d: "Thank the newspaper but focus on the work ahead.", fx: { app: 4 }, sk: { media: 4, traditional: 5 }, risk: "None." },
    ]},
  { id: "m_fake_news", type: "social", icon: "📱", title: "Fake News: 'Governor Flees Country'", desc: "A fake WhatsApp broadcast claims you've fled Nigeria with state funds. It's completely false but spreading fast. Your phone is ringing off the hook.", severity: "high",
    opts: [
      { l: "📸 Go Live on Social Media", d: "Broadcast live from Government House. 'As you can see, I'm right here.'", fx: { app: 5 }, sk: { media: 8, youth: 10 }, risk: "None — the truth is your weapon." },
      { l: "📋 Issue Official Statement", d: "Release a formal government statement denying the claims.", fx: { app: 2 }, sk: { media: 4 }, risk: "Formal statements don't go viral. The lie travels faster." },
      { l: "⚖️ Trace and Prosecute Source", d: "Use security agencies to identify the source of the fake news.", fx: { app: 1, sec: .01 }, sk: { media: -5, youth: -6 }, risk: "Looks heavy-handed. Civil liberties concerns." },
    ]},
  { id: "m_influencer_visit", type: "social", icon: "🎥", title: "Top Influencer Wants to Visit", desc: "A Nigerian influencer with 2M followers wants to do a '48 Hours in Your State' content series. Free publicity — but they'll show everything, good AND bad.", severity: "medium",
    opts: [
      { l: "✅ Welcome Openly", d: "Let them see everything. Assign a liaison but don't curate.", fx: { app: 4 }, sk: { media: 6, youth: 10 }, risk: "They might find things you'd rather hide." },
      { l: "🎬 Curate the Tour", d: "Show them your best projects. Control the narrative.", fx: { app: 3, cor: .01 }, sk: { media: -2, youth: 5 }, risk: "If they find out it's curated, credibility tanks." },
      { l: "❌ Decline", d: "Too risky. Politely decline.", fx: { app: -1 }, sk: { media: -3, youth: -8 }, risk: "They'll post about being rejected instead." },
    ]},
  { id: "m_radio_praise", type: "radio", icon: "📻", title: "Radio Station Wants Interview", desc: "A popular national radio station wants a 30-minute interview about your governance model. They've heard about your reforms from other governors.", severity: "positive",
    opts: [
      { l: "🎙️ Accept and Prepare Well", d: "This is national exposure. Prepare talking points with your SA.", fx: { app: 5, pStab: 3 }, sk: { media: 8, business: 5, party: 4 }, risk: "None — great opportunity." },
      { l: "📤 Send Deputy Governor", d: "Let your deputy handle it. Share the spotlight.", fx: { app: 2 }, sk: { media: 3 }, risk: "Deputy might not represent you well." },
    ]},
];

// ─── PRIVATE INVESTORS ───
const INVESTORS = [
  { id: "dangote_cement", nm: "Dangote Cement Expansion", co: "Dangote Industries", icon: "🏗️", sector: "manufacturing", desc: "Aliko Dangote wants to build a ₦15B cement factory in your state. 2,000 direct jobs. Needs 500 hectares of land and a 10-year tax holiday.", jobs: 2000, igrBoost: 1.2, envRisk: "High dust pollution. Community displacement.", corRisk: .15, appBoost: 5, appRisk: -3, landCost: "500 hectares" },
  { id: "chinese_steel", nm: "Chinese Steel Factory", co: "Sinosteel Corporation", icon: "🇨🇳", sector: "manufacturing", desc: "A Chinese consortium proposes a ₦22B steel plant. 3,500 jobs but they want to bring 60% Chinese workers. Environmentalists are alarmed.", jobs: 3500, igrBoost: 1.8, envRisk: "Heavy pollution risk. River contamination concerns.", corRisk: .25, appBoost: 3, appRisk: -6, landCost: "800 hectares" },
  { id: "fintech_hub", nm: "Fintech Startup Hub", co: "Flutterwave & Local VCs", icon: "💳", sector: "tech", desc: "A consortium of fintech companies wants to establish a tech campus. 800 tech jobs, mostly for graduates. They need reliable power and broadband.", jobs: 800, igrBoost: 0.6, envRisk: "None. Clean industry.", corRisk: .05, appBoost: 8, appRisk: 0, landCost: "50 hectares" },
  { id: "agro_processing", nm: "Agro-Processing Plant", co: "Olam Nigeria", icon: "🌾", sector: "agriculture", desc: "Olam wants to build a cashew and sesame processing facility. 1,200 jobs. Directly benefits local farmers with guaranteed offtake.", jobs: 1200, igrBoost: 0.8, envRisk: "Minimal. Some water usage.", corRisk: .10, appBoost: 7, appRisk: -1, landCost: "200 hectares" },
  { id: "shopping_mall", nm: "Mega Shopping Mall", co: "Shoprite & Local Developers", icon: "🏬", sector: "trade", desc: "A ₦8B modern shopping complex with Shoprite anchor tenant. 1,500 retail jobs. Small traders fear displacement.", jobs: 1500, igrBoost: 0.7, envRisk: "Traffic congestion. Small trader displacement.", corRisk: .12, appBoost: 4, appRisk: -4, landCost: "100 hectares" },
  { id: "solar_farm", nm: "Solar Energy Farm", co: "Access Power / IFC", icon: "☀️", sector: "services", desc: "International Finance Corporation backs a 50MW solar farm. 300 construction jobs, 50 permanent. Solves part of your power crisis.", jobs: 350, igrBoost: 0.4, envRisk: "Land use change. Otherwise clean.", corRisk: .05, appBoost: 6, appRisk: 0, landCost: "400 hectares" },
  { id: "oil_refinery", nm: "Modular Oil Refinery", co: "Private Nigerian Consortium", icon: "🛢️", sector: "oil", desc: "Local investors want to build a 5,000 bpd modular refinery. Huge revenue potential but regulatory minefield and explosion risk.", jobs: 500, igrBoost: 2.5, envRisk: "Explosion risk. Air pollution. Community concerns.", corRisk: .30, appBoost: 3, appRisk: -5, landCost: "300 hectares" },
  { id: "university", nm: "Private University Campus", co: "Wealthy Philanthropist", icon: "🎓", sector: "services", desc: "A billionaire philanthropist wants to establish a private university. 600 staff jobs. Could transform education in the state.", jobs: 600, igrBoost: 0.3, envRisk: "None.", corRisk: .08, appBoost: 9, appRisk: 0, landCost: "250 hectares" },
  { id: "poultry_farm", nm: "Industrial Poultry Farm", co: "Chi Farms", icon: "🐔", sector: "agriculture", desc: "Chi Farms wants a large-scale poultry operation. 400 jobs. Cheap protein for locals. But smell and waste are issues.", jobs: 400, igrBoost: 0.4, envRisk: "Waste management. Smell complaints from neighbors.", corRisk: .08, appBoost: 5, appRisk: -2, landCost: "150 hectares" },
  { id: "hotel_resort", nm: "International Hotel & Resort", co: "Marriott International", icon: "🏨", sector: "tourism", desc: "Marriott wants to build a 200-room hotel and conference centre. 500 hospitality jobs. Puts your state on the international map.", jobs: 500, igrBoost: 0.5, envRisk: "Minimal. Scenic area affected.", corRisk: .15, appBoost: 5, appRisk: -1, landCost: "80 hectares" },
  { id: "mining_co", nm: "Gold Mining Operation", co: "Thor Explorations", icon: "⛏️", sector: "mining", desc: "A Canadian mining company has found gold deposits. 700 direct jobs. But artisanal miners will be displaced and environmental damage is certain.", jobs: 700, igrBoost: 1.5, envRisk: "Mercury contamination. Artisanal miner displacement. Deforestation.", corRisk: .20, appBoost: 2, appRisk: -6, landCost: "1000 hectares" },
  { id: "garment_factory", nm: "Textile & Garment Factory", co: "Local Manufacturers Association", icon: "👕", sector: "manufacturing", desc: "Local textile manufacturers want support for a garment factory. 2,500 jobs, mostly women. Needs subsidized power.", jobs: 2500, igrBoost: 0.9, envRisk: "Dye waste water treatment needed.", corRisk: .10, appBoost: 8, appRisk: -1, landCost: "120 hectares" },
  { id: "pharma_plant", nm: "Pharmaceutical Plant", co: "Emzor / May & Baker", icon: "💊", sector: "manufacturing", desc: "Nigerian pharma companies want to manufacture drugs locally. 600 jobs. Reduces import dependency. NAFDAC compliant.", jobs: 600, igrBoost: 0.7, envRisk: "Chemical waste management required.", corRisk: .08, appBoost: 7, appRisk: 0, landCost: "100 hectares" },
  { id: "data_centre", nm: "Tier-3 Data Centre", co: "Africa Data Centres / Equinix", icon: "🖥️", sector: "tech", desc: "A major data centre operator wants your state. 200 direct jobs but massive digital infrastructure spillover. Needs guaranteed 24/7 power.", jobs: 200, igrBoost: 0.5, envRisk: "None. High power consumption.", corRisk: .05, appBoost: 4, appRisk: 0, landCost: "30 hectares" },
  { id: "fertilizer", nm: "Fertilizer Blending Plant", co: "Notore / Indorama", icon: "🧪", sector: "agriculture", desc: "A fertilizer company wants to set up a blending plant. 300 jobs. Directly supports farmers statewide. Good politics.", jobs: 300, igrBoost: 0.5, envRisk: "Chemical handling. Requires buffer zone.", corRisk: .10, appBoost: 6, appRisk: -1, landCost: "180 hectares" },
];

// International invitations — pool of 8, each game triggers 1-2 randomly
const ALL_DILEMMAS = [...DILEMMAS, ...DILEMMAS_EXTRA];
const INTL_INVITES = [
  { id: "us_pres", icon: "🇺🇸", from: "The White House, Washington D.C.", who: "The President of the United States", what: "A bilateral meeting on trade, security cooperation, and diaspora investment in your state. The US Embassy has flagged your governance reforms.", goFx: { igr: 2, app: 4, infra: .02 }, goSk: { business: 10, media: 8, youth: 6 }, goCost: 0.5, goLog: "Met the US President at the White House. Trade agreements and diaspora investment pipeline opened.", delFx: { app: 1 }, delSk: { business: 3 }, delLog: "Sent delegation to Washington. Polite but no breakthroughs.", decFx: { app: -2 }, decSk: { media: -5 }, decLog: "Declined White House invitation. International observers puzzled." },
  { id: "harvard", icon: "🎓", from: "Harvard Kennedy School, Boston", who: "The Dean of Harvard Kennedy School", what: "An invitation to deliver a guest lecture on 'Subnational Governance in Africa' and meet the African Leadership Initiative cohort. Your reforms have caught academic attention.", goFx: { lit: .02, app: 5 }, goSk: { media: 10, youth: 12 }, goCost: 0.3, goLog: "Lectured at Harvard Kennedy School. Standing ovation. International profile boosted.", delFx: { app: 0 }, delSk: { youth: 2 }, delLog: "Commissioner represented you at Harvard. Decent but forgettable.", decFx: {}, decSk: {}, decLog: "Declined Harvard invitation. No consequence — but a missed opportunity." },
  { id: "mit", icon: "🔬", from: "MIT Media Lab, Cambridge", who: "MIT's Director of Digital Governance", what: "An invitation to explore smart city technology partnerships. MIT wants to pilot digital governance tools in an African state — yours is on the shortlist.", goFx: { lit: .03, infra: .02, app: 3 }, goSk: { youth: 10, business: 6 }, goCost: 0.4, goLog: "Visited MIT Media Lab. Smart city pilot confirmed for your state. Tech transfer underway.", delFx: { app: 0, lit: .01 }, delSk: { youth: 3 }, delLog: "Sent tech team to MIT. Some connections made.", decFx: { app: -1 }, decSk: { youth: -4 }, decLog: "Declined MIT tech partnership. Youth groups disappointed." },
  { id: "sweden_pm", icon: "🇸🇪", from: "Rosenbad, Stockholm", who: "The Prime Minister of Sweden", what: "Sweden wants to discuss development aid, renewable energy partnerships, and good governance benchmarking. SIDA has earmarked funds for pilot states.", goFx: { igr: 1.5, hp: .02, app: 3 }, goSk: { business: 8, media: 5 }, goCost: 0.3, goLog: "Met Swedish PM. SIDA development partnership signed. ₦1.5B in aid pipeline.", delFx: { app: 0 }, delSk: { business: 2 }, delLog: "Delegation met Swedish officials. Cordial but non-committal.", decFx: { app: -1 }, decSk: { media: -3 }, decLog: "Declined Swedish PM invitation. Development partners took note." },
  { id: "uk_trade", icon: "🇬🇧", from: "10 Downing Street, London", who: "The UK Secretary of State for Business and Trade", what: "Post-Brexit, the UK is looking for direct trade partnerships with Nigerian states. Your state's agricultural exports caught their attention.", goFx: { igr: 2, agr: .03, app: 4 }, goSk: { business: 12, traditional: 4 }, goCost: 0.4, goLog: "Met UK trade officials at Downing Street. Agricultural export deal signed. ₦2B boost.", delFx: { app: 1, agr: .01 }, delSk: { business: 4 }, delLog: "Trade delegation went to London. Minor agreements reached.", decFx: { app: -1 }, decSk: { business: -6 }, decLog: "Declined UK trade invitation. Business community frustrated." },
  { id: "china_infra", icon: "🇨🇳", from: "Beijing, China", who: "China's Minister of Commerce", what: "China is offering infrastructure loans and construction partnerships — roads, bridges, housing. The terms are generous but the politics are complicated.", goFx: { infra: .05, app: 3 }, goSk: { business: 8, media: -5, youth: -3 }, goCost: 0.2, goLog: "Signed infrastructure deal with China. Roads and bridges coming — but critics call it 'debt trap diplomacy.'", delFx: { infra: .02 }, delSk: { business: 3 }, delLog: "Delegation explored China options. Framework agreement signed.", decFx: { app: 1 }, decSk: { media: 5, youth: 3 }, decLog: "Declined Chinese infrastructure loan. Media praised independence from 'debt trap.'" },
  { id: "un_sdg", icon: "🇺🇳", from: "United Nations, New York", who: "The UN Under-Secretary-General", what: "An invitation to speak at the UN General Assembly side event on SDG implementation at subnational level. Your state has been identified as a model.", goFx: { app: 6, hp: .01 }, goSk: { media: 12, youth: 8, religious: 4 }, goCost: 0.4, goLog: "Spoke at the United Nations. International recognition. 'A model governor' — UN press release.", delFx: { app: 1 }, delSk: { media: 3 }, delLog: "Deputy spoke at UN side event. Decent representation.", decFx: { app: -2 }, decSk: { media: -4, youth: -5 }, decLog: "Declined UN invitation. 'Too busy governing' — but the world noticed your absence." },
  { id: "uae_invest", icon: "🇦🇪", from: "Abu Dhabi, UAE", who: "Abu Dhabi Investment Authority", what: "UAE sovereign wealth fund exploring real estate and agro-industrial investment in Nigerian states. They want to meet the governor personally before committing.", goFx: { igr: 3, infra: .03, app: 4 }, goSk: { business: 15 }, goCost: 0.5, goLog: "Met Abu Dhabi investors. Massive real estate and agro-industrial investment secured. ₦3B IGR boost.", delFx: { app: 0 }, delSk: { business: 3 }, delLog: "Sent team to Abu Dhabi. Investors wanted the governor. 'We deal with principals, not agents.'", decFx: { app: -1 }, decSk: { business: -8 }, decLog: "Declined Abu Dhabi meeting. ₦3B investment went to a rival state." },
];

// ─── UI ───
const SB = ({ label, value, max = 1, color = CL.grn, icon, fmt }) => {
  const p = max === 1 ? value * 100 : value / max * 100;
  return React.createElement("div", { style: { marginBottom: 4 } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: TS(16), fontFamily: F.b, color: CL.td, marginBottom: 2 } },
      React.createElement("span", null, icon, " ", label),
      React.createElement("span", { style: { color: CL.tm } }, fmt ? fmt(value) : Math.round(cl(p, 0, 100)) + "%")
    ),
    React.createElement("div", { style: { height: 8, background: "#e8ece0", borderRadius: 4, overflow: "hidden" } },
      React.createElement("div", { style: { width: cl(p, 0, 100) + "%", height: "100%", background: color, borderRadius: 4, transition: "width .4s" } })
    )
  );
};

const Cd = ({ children, style: st, onClick, active }) => {
  const [h, setH] = useState(false);
  return React.createElement("div", {
    className: "ds-card",
    onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
    style: { borderColor: active ? CL.grn : h && onClick ? "#b8c8a8" : undefined, cursor: onClick ? "pointer" : "default", transition: "all .2s", ...st }
  }, children);
};

// Phone: a section that starts closed and shows its title and one summary
// line; tap to open. In landscape it renders its content unchanged.
const Fold = ({ title, summary, children, open: startOpen = false }) => {
  const [open, setOpen] = React.useState(startOpen);
  if (!TALL()) return React.createElement(React.Fragment, null, children);
  return React.createElement("div", { style: { background: CL.card, border: "1px solid " + CL.bdr, borderRadius: 18, marginBottom: 14, overflow: "hidden" } },
    React.createElement("button", { onClick: () => setOpen(o => !o), "aria-expanded": open,
      style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: "transparent", border: 0, cursor: "pointer", textAlign: "left", color: CL.txt, fontFamily: F.b } },
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: TS(25), fontWeight: 700 } }, title),
        summary ? React.createElement("div", { style: { fontSize: TS(20), color: CL.td, marginTop: 2 } }, summary) : null),
      React.createElement("span", { style: { fontSize: TS(20), color: CL.td, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" } }, "▼")),
    open ? React.createElement("div", { style: { padding: "0 14px 14px" } }, children) : null);
};

// A scene banner: a background from public/art with a cast member in front.
// Only cast members get portraits (see CAST_ART); other scenes get the
// background alone.
const SceneArt = ({ bg, who, alt, h = 230 }) => React.createElement("div", {
  style: { height: h, borderRadius: 20, overflow: "hidden", marginBottom: 18, display: "flex", alignItems: "flex-end", justifyContent: "center",
    background: "#1d2a22 url(./art/backgrounds/" + bg + ".webp) center/cover" } },
  who ? React.createElement("img", { src: "./art/characters/" + who + ".webp", alt: alt || "", style: { height: h - 8, width: "auto", objectFit: "contain", objectPosition: "bottom" } }) : null);

const Bg = ({ text, color = CL.grn }) => React.createElement("span", { className: "ds-chip", style: { background: color + "15", color, borderColor: color + "40" } }, text);

const Bt = ({ children, onClick, v = "primary", disabled, style: st }) => {
  const vs = { primary: { background: CL.grn, color: "#fff", fontWeight: 700 }, secondary: { background: "transparent", color: CL.grn, border: "2px solid " + CL.grn }, danger: { background: CL.red, color: "#fff", fontWeight: 700 }, ghost: { background: "transparent", color: CL.tm, border: "2px solid " + CL.bdr } };
  return React.createElement("button", { onClick, disabled, style: { minHeight: DS.ctl.h, padding: DS.ctl.pad, borderRadius: DS.r.sm, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: F.c, fontWeight: 700, fontSize: DS.t.body, transition: "all .2s", opacity: disabled ? .35 : 1, ...vs[v], ...st } }, children);
};

/* ─── DecisionCard ──────────────────────────────────────────────────
   One decision, one screen. Every consequential choice in the game
   renders through this so the player always reads a decision the same
   way: what happened → what's at stake → the options, each with its
   visible price and its visible risk. */
const DecisionCard = ({ kicker, kickerColor = CL.org, title, brief, stakes, aside, options, onPick }) =>
  React.createElement("div", { className: "ds-card ds-stack", style: { borderColor: kickerColor + "66" } },
    aside || null,
    React.createElement("div", { style: { textAlign: "center" } },
      kicker ? React.createElement(Bg, { text: kicker, color: kickerColor }) : null,
      React.createElement("h3", { className: "ds-title", style: { margin: "14px 0" } }, title),
      brief ? React.createElement("p", { className: "ds-body" }, brief) : null,
      stakes ? React.createElement("p", { className: "ds-meta", style: { marginTop: 14, color: kickerColor } }, stakes) : null
    ),
    React.createElement("div", { style: { display: "grid", gap: DS.s[3] } },
      (options || []).map((o, i) => React.createElement("button", {
        key: i, className: "ds-option", onClick: () => onPick(o, i), disabled: o.disabled,
        style: o.disabled ? { opacity: .4, cursor: "not-allowed" } : null
      },
        React.createElement("div", { className: "ds-option-label" }, o.label),
        o.note ? React.createElement("div", { className: "ds-option-note" }, o.note) : null,
        (o.chips && o.chips.length) ? React.createElement("div", { className: "ds-chiprow" },
          o.chips.map((c, j) => React.createElement("span", { key: j, className: "ds-chip", style: { color: c.color || CL.tm, background: (c.color || CL.tm) + "12" } }, c.text))
        ) : null,
        o.risk ? React.createElement("div", { className: "ds-option-note", style: { color: CL.org } }, "⚠️ " + o.risk) : null
      ))
    )
  );


const Spark = ({ data, color = CL.grn, w = 100, h = 20 }) => {
  if (data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rg = mx - mn || 1;
  const pts = data.map((v, i) => (i / (data.length - 1) * w) + "," + (h - ((v - mn) / rg * (h - 4) + 2)));
  return React.createElement("svg", { width: w, height: h, style: { display: "block" } },
    React.createElement("polyline", { points: pts.join(" "), fill: "none", stroke: color, strokeWidth: "1.5" }),
    React.createElement("circle", { cx: w, cy: h - ((data[data.length - 1] - mn) / rg * (h - 4) + 2), r: "2", fill: color })
  );
};

const Flag = () => React.createElement("div", { style: { display: "flex", height: 14, width: "100%" } },
  React.createElement("div", { style: { flex: 1, background: CL.grn } }),
  React.createElement("div", { style: { flex: 1, background: "#fff" } }),
  React.createElement("div", { style: { flex: 1, background: CL.grn } })
);

const OL = ({ children, show }) => {
  if (!show) return null;
  if (TALL()) {
    // Phone: one decision fills the screen as a sheet that slides up.
    return React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 100, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "linear-gradient(180deg," + CL.bg + " 0%," + CL.card + " 100%)", padding: "28px 18px 48px" } },
      React.createElement("div", { className: "sop-sheet", style: { width: "100%" } }, children));
  }
  return React.createElement("div", { className: "sop-fade-in", style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "43px 29px", overflowY: "auto", WebkitOverflowScrolling: "touch" } },
    React.createElement("div", { className: "sop-slide-up", style: { maxWidth: 984, width: "100%", margin: "auto 0" } }, children));
};

// Special Adviser speech bubble — shows for ALL levels
const AdvBubble = ({ text, saName }) => {
  if (!text) return null;
  return React.createElement("div", { className: "sop-slide-up", style: { display: "flex", gap: 1, alignItems: "stretch", marginBottom: DS.s[5], borderRadius: DS.r.lg, overflow: "hidden", border: "2px solid rgba(0,0,0,.18)", boxShadow: "0 6px 14px rgba(0,0,0,.14)", background: "#2a2a33" } },
    React.createElement("div", { style: { width: 185, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "radial-gradient(70% 70% at 50% 40%, #4a4a58, #23232b)", overflow: "hidden" } },
      React.createElement("img", { src: "./art/characters/special-adviser.webp", alt: String(saName || "Special Adviser"), style: { width: "100%", height: 188, objectFit: "contain", objectPosition: "bottom", display: "block" } })),

    React.createElement("div", { style: { flex: 1, background: "linear-gradient(180deg,#ffffff,#f2f4ec)", padding: DS.s[4] + "px " + DS.s[5] + "px", textAlign: "left" } },
      React.createElement("div", { style: { fontSize: DS.t.meta, fontWeight: 700, color: CL.grn, fontFamily: F.m, marginBottom: DS.s[1], letterSpacing: 2 } }, saName ? ("SA " + saName).toUpperCase() : "SPECIAL ADVISER"),
      React.createElement("div", { style: { fontSize: DS.t.body, color: "#22301a", lineHeight: 1.55, fontFamily: F.b } }, text)
    )

  );
};


// ─── CIVIC SKIN (iCivics-style chrome for the opening pages) ───
const SK = {
  bar: "linear-gradient(180deg,#0a9e60 0%,#00794a 55%,#005f39 100%)",
  stage: "linear-gradient(180deg,#0d5e3a 0%,#137a4b 40%,#2f9c68 100%)",
  panel: "linear-gradient(180deg,#ffffff 0%,#f1f4ea 100%)",
  btn: "linear-gradient(180deg,#18b06b 0%,#068a51 100%)",
  btnAlt: "linear-gradient(180deg,#f7c948 0%,#d99b16 100%)",
};

const PillBtn = ({ children, onClick, tone = "green", disabled, style: st }) => {
  const [h, setH] = useState(false);
  const g = tone === "gold" ? SK.btnAlt : tone === "plain" ? "linear-gradient(180deg,#ffffff,#e6ebdd)" : SK.btn;
  const col = tone === "plain" ? CL.txt : "#fff";
  return React.createElement("button", {
    onClick, disabled,
    onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
    style: {
      background: g, color: col, border: "2px solid rgba(0,0,0,.18)",
      borderRadius: DS.r.pill, minHeight: DS.ctl.cta, padding: TALL() ? "16px 28px" : "34px 88px", fontFamily: F.c, fontWeight: 800,
      fontSize: DS.t.lead, letterSpacing: .4, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1, textShadow: tone === "plain" ? "none" : "0 1px 0 rgba(0,0,0,.25)",
      boxShadow: h && !disabled ? "0 6px 0 rgba(0,0,0,.22), 0 10px 18px rgba(0,0,0,.18)" : "0 4px 0 rgba(0,0,0,.22), 0 6px 12px rgba(0,0,0,.14)",
      transform: h && !disabled ? "translateY(-1px)" : "none", transition: "all .15s", ...st
    }
  }, children);
};

const TopBar = ({ title, onBack, onHelp, right }) => React.createElement("div", {
  style: { background: SK.bar, borderBottom: "3px solid rgba(0,0,0,.25)", padding: DS.s[2] + "px " + DS.s[4] + "px", display: "flex", alignItems: "center", gap: DS.s[3], position: "sticky", top: 1, zIndex: 40, boxShadow: "0 4px 14px rgba(0,0,0,.18)" }
},
  onBack ? React.createElement(PillBtn, { tone: "plain", onClick: onBack, style: { padding: "14px 34px", fontSize: DS.t.label, minHeight: 72 } }, "Back") : React.createElement("div", { style: { width: 110 } }),
  React.createElement("div", { style: { flex: 1, textAlign: "center", fontFamily: F.c, color: "#fff", fontSize: DS.t.title, fontWeight: 900, letterSpacing: .5, textTransform: "uppercase", textShadow: "0 2px 3px rgba(0,0,0,.35)" } }, title),
  right || (onHelp ? React.createElement("button", {
    onClick: onHelp,
    style: { width: 72, height: 72, minHeight: 72, borderRadius: DS.r.pill, border: "2px solid rgba(0,0,0,.18)", background: "linear-gradient(180deg,#ffffff,#e6ebdd)", color: CL.txt, fontWeight: 700, cursor: "pointer", fontFamily: F.b, fontSize: DS.t.label, boxShadow: "0 3px 0 rgba(0,0,0,.2)" }
  }, "?") : React.createElement("div", { style: { width: 110 } }))
);

const CivicPanel = ({ children, style: st }) => React.createElement("div", {
  style: { background: "var(--sf-panel)", border: "2px solid var(--sf-bdr)", borderRadius: DS.r.lg, boxShadow: "var(--shadow-card)", padding: DS.s[4], color: "var(--ink)", ...st }
}, children);



// ─── HOW TO PLAY & CIVIC EDUCATION ───
const HowToPlay = ({ show, onClose }) => {
  if (!show) return null;
  const sections = [
    { t: "🎮 How to Play", c: "You are the Executive Governor of a Nigerian state. Before governing, you must fund your campaign, buy a party ticket, choose your deputy, and WIN an election — none of it is automatic.\n\nOnce in Government House, you govern for up to 8 half-year turns (2 terms of 4 years). Each turn brings: budget allocation, policies, projects, dilemmas, media events, federal government dynamics, shock events, court challenges, investor proposals, godfather demands, and hidden threats.\n\nImpeachment requires BOTH low approval (<30%) AND low party stability (<40%). Bankruptcy (revenue < ₦2B) ends your tenure immediately. Defying the Supreme Court is near-certain impeachment." },
    { t: "💰 Campaign Finance & The Godfather", c: "You start with ₦800M in personal funds — your war chest. Party tickets cost money: APC ₦500M (strongest machinery), ADC ₦350M (Atiku/El-Rufai coalition), NDC ₦300M (Peter Obi's new vehicle), PDP ₦280M (legacy structure), LP ₦150M (post-Obi rump). The ticket is deducted from your war chest.\n\nIf you can't afford a ticket, the Godfather offers ₦1B — but you start governance with +5% corruption per billion borrowed. He WILL demand repayment through contracts, land, and positions.\n\nDuring the 8-round campaign, actions cost ₦25M-₦400M. Cheap options (radio, market visits) are weak. Expensive options (mega rally, door-to-door) win elections. If money runs out mid-campaign and the godfather won't help, you can withdraw from the race.\n\nIn office, you earn ₦60M salary per half-year. If approval reaches 85%+, citizens crowdfund ₦100-200M for your re-election. This personal fund becomes your war chest for the second campaign." },
    { t: "🗳️ Elections & Campaigns", c: "Both elections (first and re-election) are 8-decision, 4-week campaigns. Each week: YOUR move → OPPONENT strikes → you respond. A named opponent from another party campaigns against you.\n\nParty strength multiplies your score: APC 1.15x, ADC 0.85x. Underdogs CAN win with perfect campaigns.\n\nOn Hard mode: your points are reduced by 2 per action, opponent gains +2 bonus every round, backfire chance is 60%. You can genuinely LOSE.\n\nFor re-election: if party stability ≥ 50%, you get an automatic ticket. If < 50%, your ticket is contested — you must buy it (godfather funds or self-fund) or switch to a cheaper party (-15 party stability)." },
    { t: "📊 Economic Production Engine", c: "8 economic sectors per state: Agriculture, Manufacturing, Services, Oil & Gas, Mining, Trade, Tourism, Technology. Each produces output, jobs, and tax revenue.\n\nIGR is derived from economic output: IGR = Σ(sector output × population × tax rate). Budget allocation, policies, security, and literacy all drive sector growth. Corruption and insecurity drag ALL sectors down.\n\nThe Economy tab shows State GDP, Total Jobs, IGR, and all 8 sectors with output bars and what drives each one." },
    { t: "🏗️ Infrastructure Projects", c: "20 projects in 3 tiers: Quick (1 turn), Medium (2 turns), Megaprojects (3-4 turns). Each has cost, corruption risk, economic sector linkage, and jobs created.\n\nCorruption causes project delays — if corruption is high, projects stall: 'Permanent secretary's office is the bottleneck.' The sidebar shows progress bars with % complete.\n\nCompleted projects boost economic sectors, create jobs, and appear in your Wikipedia biography." },
    { t: "🏭 Private Investors", c: "15 real companies (Dangote Cement, Chinese Steel, Fintech Hub, etc.) appear every other turn. Three choices: Approve (jobs + IGR + community risk), Approve with Incentives (bigger boost but state bears costs), or Reject (no jobs, business angry).\n\nInvestor approvals can trigger judiciary challenges from displaced communities. 15% of new investment revenue automatically reduces state debt." },
    { t: "📰 Media & Information Warfare", c: "10 media events across 5 types: social media (#GovernorFailed trending), newspapers (front page exposé), radio (angry callers), TV (documentary), bloggers (₦5M bribe demand).\n\nContextual: negative events when approval is low, positive when high. Options include press conferences, releasing data, ignoring, bribing media (corruption risk), or going live. Every response has a result screen showing consequences." },
    { t: "🇳🇬 Federal–State Power Struggle", c: "FG Relations stat (0-100%, starts 50%). The President can: cut FAAC allocation, send EFCC investigations, deploy military, approve federal roads, block loans, or demand party loyalty.\n\nLow FG relations (<30%) = FAAC erodes each turn. High (>70%) = FAAC bonus. The core tradeoff: loyalty to the President (money, roads) vs independence (approval, media love, but shrinking budget)." },
    { t: "⚡ Shock Events", c: "8 unpredictable national crises: oil price crash (FAAC -25%), naira devaluation, pandemic, #EndSARS protests, fuel subsidy removal, flooding, terrorist attack, banking crisis.\n\n30% chance each turn, max 2 per game. Auto-effects hit BEFORE you choose your response. No two playthroughs are the same." },
    { t: "🏛️ Civil Service & Bureaucracy", c: "6 Permanent Secretaries with types: Technocrat (efficient), Old Guard (resists change), Party Plant (godfather's man), Reformer, Corrupt Bureaucrat, Silent Worker. They affect project delivery, sector performance, and corruption.\n\n5 reforms available: Audit, Compulsory Retirement, Capacity Building, Digitize Civil Service, Political Appointments. Mass sacking triggers the National Industrial Court — you'll face a ruling and must choose to comply or defy." },
    { t: "⚖️ Judiciary System", c: "Courts challenge your actions based on what you do: approve investor land → community sues; force budget → opposition sues; high corruption → civil society sues.\n\n3-court appeal chain: State High Court (55% win) → Court of Appeal (43%) → Supreme Court (31%). At each level: fight or comply (get ~60% of spent money back).\n\nDefying the Supreme Court = CONSTITUTIONAL CRISIS: approval capped at 32% then -15%, party -20%, corruption +8%, near-certain impeachment. S.287: all authorities shall comply.\n\nThe National Industrial Court (S.254C) handles labour disputes. Sacking workers triggers NIC. You can comply (reinstate + pay arrears), partially comply (payment plan), or DEFY (criminal contempt, general strike, impeachment)." },
    { t: "🔗 Trust Network & Cascades", c: "Stakeholders are connected. When one crashes, it pulls others down: Media ↓ → Youth drops 40% of the hit. Unions ↓ → Youth and Media drop. Traditional rulers ↓ → Party and Religious drop.\n\nOne bad decision can cascade through your entire support network. You don't lose approval — you lose THE SYSTEM." },
    { t: "📖 Narrative Engine", c: "The game tracks your dominant public narrative: The Strong Leader 💪, The Technocrat 🧠, The People's Governor ✊, The Corrupt Politician 💀, The Builder 🏗️, The Reformer ✨, The Weak Governor 😰, The Survivor 🛡️.\n\nNarrative affects: approval drift each turn, re-election scoring (-8 for 'corrupt', +5 for 'reformer'), and your Wikipedia biography. Even with good stats, a bad narrative loses elections." },
    { t: "🔍 Hidden Threats & Investigations", c: "Not everything is visible. Hidden corruption festers in your ministries — ghost workers, land fraud, expired drugs, inflated contracts. Your SA hints: 'Something feels off in the Works Ministry...'\n\nInvestigate (₦300M) = catch it early, limited damage. Ignore = it EXPLODES in 3 turns with -6 approval and +5% corruption. Strategic patience vs cost management." },
    { t: "⏰ Time Delays", c: "Policies don't give instant results. Education investment = +0 now, +5 approval in 3 turns. Health = payoff in 2 turns. Agriculture = IGR boost in 2 turns.\n\nThis creates tension: invest in education (payoff in 3 turns) when you need approval NOW to survive impeachment?" },
    { t: "💳 Debt Management", c: "Debt reduces through: automatic service (8% per turn), IGR surplus (15% of excess), GDP growth (0.5%), and investment revenue (15% of new IGR). Commissioner achievements also pay down debt.\n\nDebt warning at ₦15B. Crisis at ₦20B. Campaign spending is PERSONAL — not from state funds." },
    { t: "🚔 EFCC & Post-Office", c: "S.308 immunity expires the moment you leave office. If corruption > 55%: ARRESTED within 72 hours. 46-55%: under investigation. 36-45%: on watchlist. ≤35%: clean exit.\n\nThe lesson: immunity is not impunity. Govern cleanly or face consequences." },
    { t: "🏆 Scoring & Endings", c: "Score: Development (30%) + Approval (30%) + Fiscal Health (20%) + Anti-Corruption (20%). Grade A = 75+.\n\nAfter first term: run for re-election, step down, or run for President. After two terms: retire, Senate, or President. All races are performance-based.\n\nYour Wikipedia biography captures everything. Shareable on X and WhatsApp." },
  ];
  return (
    <OL show={true}>
      <div style={{ background: CL.card, borderRadius: 21, maxHeight: 1150, overflow: "auto", border: "1px solid " + CL.bdr }}>
        <div style={{ position: "sticky", top: 1, background: CL.grn, color: "#fff", padding: "36px 58px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "36px 36px 0 0" }}>
          <span style={{ fontFamily: F.d, fontSize: TS(65), fontWeight: 600 }}>📖 How to Play & Civic Education</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: TS(65), cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "43px 58px" }}>
          <div style={{ textAlign: "center", marginBottom: 43, paddingBottom: 36, borderBottom: "1px solid " + CL.bdr }}>
            <div style={{ fontSize: TS(34), letterSpacing: 7, color: CL.grn, fontFamily: F.m, textTransform: "uppercase", marginBottom: 7 }}>Game Credit</div>
            <div style={{ fontFamily: F.d, fontSize: TS(58), fontWeight: 600, color: CL.txt }}>Steve Sunny Emmanuel</div>
            <button onClick={() => { try { window.SOP_CIVIC && window.SOP_CIVIC.openIndex(); } catch (e) {} }}
              style={{ marginTop: 14, background: CL.grn, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: TS(24), fontWeight: 700, fontFamily: F.b, cursor: "pointer" }}>
              🔎 CIVIC LENS — how the institutions actually work
            </button>
          </div>
          {sections.map((s2, i) => (
            <div key={i} style={{ marginBottom: 50 }}>
              <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(53), fontWeight: 600, margin: "0 0 14px" }}>{s2.t}</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), fontFamily: F.b, lineHeight: 1.6, margin: 1, whiteSpace: "pre-line" }}>{s2.c}</p>
            </div>
          ))}
          <div style={{ borderTop: "1px solid " + CL.bdr, paddingTop: 29, marginTop: 29 }}>
            <p style={{ color: CL.td, fontSize: TS(34), fontFamily: F.m, textAlign: "center" }}>Based on the 1999 Constitution of the Federal Republic of Nigeria (as amended)</p>
          </div>
        </div>
      </div>
    </OL>
  );
};

// ─── TITLE ───
const TitleScreen = ({ onStart, onHelp, onLoad }) => {
  useMode("public");
  const [op, setOp] = useState(1);
  const [hasSave, setHasSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  useEffect(() => {
    setTimeout(() => setOp(1), 100);
    (async () => {
      try {
        const r = await window.storage.get("sop_save");
        if (r?.value) {
          const d = JSON.parse(r.value);
          setHasSave(true);
          setSaveName(d.setup?.nm + " · " + (d.setup?.state || "").replace("_", " ") + " · Turn " + d.turn);
        }
      } catch (e) {}
    })();
  }, []);
  const GRASS = "26%";
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#f3efe7 0%,#e6e0d6 55%,#d6cfc3 100%)", opacity: op, transition: "opacity .8s", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* ── Top chrome bar ── */}
      <div style={{ position: "relative", zIndex: 6, background: "linear-gradient(180deg,#0f7f4e 0%,#0a5f3a 100%)", borderBottom: "3px solid rgba(0,0,0,.25)", boxShadow: "0 4px 14px rgba(0,0,0,.18)", padding: "16px 30px", display: "flex", alignItems: "center", gap: 26 }}>
        <button onClick={onHelp} aria-label="Menu" style={{ width: 92, height: 82, borderRadius: 14, border: "2px solid rgba(0,0,0,.18)", background: "linear-gradient(180deg,#ffffff,#e8ede1)", cursor: "pointer", display: "grid", placeItems: "center", gap: 4, padding: 0, boxShadow: "0 3px 0 rgba(0,0,0,.2)" }}>
          <div style={{ display: "grid", gap: 7 }}>
            {[0, 1, 2].map(i => <span key={i} style={{ display: "block", width: 42, height: 7, borderRadius: 6, background: "#0a5f3a" }} />)}
          </div>
        </button>
        <PillBtn tone="plain" onClick={onHelp} style={{ padding: "19px 38px", fontSize: TS(26), letterSpacing: .8 }}>HOW TO PLAY</PillBtn>
      </div>

      {/* ── Backdrop: State House silhouette ── */}
      <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: `calc(${GRASS} - 10px)`, width: 1350, height: 500, opacity: .42, zIndex: 1 }}>
        <g fill="#bdb5a8">
          {/* left wing */}
          <rect x="40" y="150" width="230" height="150" />
          {/* right wing */}
          <rect x="630" y="150" width="230" height="150" />
          {/* central block */}
          <rect x="270" y="118" width="360" height="182" />
          {/* roof balustrades */}
          <rect x="34" y="142" width="242" height="10" />
          <rect x="624" y="142" width="242" height="10" />
          <rect x="264" y="110" width="372" height="10" />
        </g>
        {/* portico pediment */}
        <g fill="#cac2b5">
          <polygon points="450,44 610,112 290,112" />
          <rect x="286" y="112" width="328" height="14" />
        </g>
        {/* portico columns */}
        <g fill="#cac2b5">
          {[318, 372, 426, 480, 534, 588].map(x => (
            <g key={x}>
              <rect x={x} y="126" width="26" height="174" />
              <rect x={x - 4} y="126" width="34" height="8" />
              <rect x={x - 4} y="292" width="34" height="8" />
            </g>
          ))}
        </g>
        {/* wing windows */}
        <g fill="#a79e90">
          {[62, 104, 146, 188, 230, 652, 694, 736, 778, 820].map(x => (
            <g key={x}>
              <rect x={x} y="176" width="24" height="40" rx="2" />
              <rect x={x} y="234" width="24" height="40" rx="2" />
            </g>
          ))}
        </g>
        {/* dome / flag */}
        <g fill="#cac2b5">
          <path d="M450 12 q34 18 34 32 h-68 q0-14 34-32Z" />
          <rect x="447" y="0" width="6" height="16" />
        </g>
        {/* steps */}
        <g fill="#b6ada0">
          <rect x="276" y="286" width="348" height="7" />
          <rect x="262" y="293" width="376" height="7" />
        </g>
      </svg>

      {/* ── Grass band ── */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: GRASS, background: "linear-gradient(180deg,#8fbf5e 0%,#6ea845 45%,#4f8a31 100%)", borderTop: "3px solid rgba(255,255,255,.45)", zIndex: 2 }} />

      {/* ── Characters ── */}
      <img src={HERO_MALE} alt="" style={{ position: "absolute", left: "4%", bottom: `calc(${GRASS} - 18px)`, width: 470, maxWidth: "24%", maxHeight: "52%", objectFit: "contain", objectPosition: "bottom", pointerEvents: "none", zIndex: 3 }} />
      <img src={HERO_FEMALE} alt="" style={{ position: "absolute", right: "4%", bottom: `calc(${GRASS} - 18px)`, width: 470, maxWidth: "24%", maxHeight: "52%", objectFit: "contain", objectPosition: "bottom", pointerEvents: "none", zIndex: 3 }} />

      {/* ── Foreground: crest, logo, buttons ── */}
      <div style={{ position: "relative", zIndex: 5, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "1% 40px", paddingBottom: `calc(${GRASS} - 14%)` }}>
        <img src={CREST} alt="State seal" style={{ width: 120, maxHeight: "10%", objectFit: "contain", display: "block", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.3))" }} />
        <div style={{ background: "linear-gradient(180deg,#0e8b55,#04572f)", border: "3px solid #fff", borderRadius: 14, boxShadow: "0 6px 0 rgba(0,0,0,.2), 0 12px 24px rgba(0,0,0,.25)", padding: "12px 44px", textAlign: "center" }}>
          <h1 style={{ fontSize: TS(64), fontFamily: F.d, color: "#fff", margin: 0, lineHeight: .92, fontWeight: 700, letterSpacing: 2, textShadow: "0 2px 0 rgba(0,0,0,.32)" }}>THE SEAT<br />OF POWER</h1>
        </div>
        <div style={{ fontSize: TS(18), letterSpacing: 6, color: "#5c5346", fontFamily: F.m, textTransform: "uppercase", textAlign: "center" }}>Nigerian Governance Simulator</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 6 }}>
          <PillBtn onClick={onStart} style={{ padding: "12px 32px", fontSize: TS(21), letterSpacing: .6 }}>NEW GAME</PillBtn>
          {hasSave && <PillBtn tone="gold" onClick={onLoad} style={{ padding: "12px 28px", fontSize: TS(21), letterSpacing: .6 }}>CONTINUE</PillBtn>}
          <PillBtn tone="plain" onClick={onHelp} style={{ padding: "12px 28px", fontSize: TS(21), letterSpacing: .6 }}>CREDITS</PillBtn>
        </div>
        {hasSave && <div style={{ position: "absolute", bottom: 68, fontSize: TS(18), color: "#f0f7e8", fontFamily: F.m, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>{saveName}</div>}
      </div>


    </div>
  );

};


// ─── SETUP ───
// SVG Avatars — Nigerian attire
const AVATAR_IMGS = {
  agbada: "./art/characters/governor-male-agbada.webp",
  babariga: "./art/characters/governor-male-babariga.webp",
  isiagu: "./art/characters/governor-male-isiagu.webp",
  female: "./art/characters/governor-female-agbada.webp",
};
const TITLE_DUO = "/__l5e/assets-v1/cb3369c8-37de-4d02-8d08-5b71848e1c21/title-duo.png";
const CREST = "./art/brand/state-seal.webp";
const HERO_MALE = "./art/characters/governor-male-agbada.webp";
const HERO_FEMALE = "./art/characters/governor-female-agbada.webp";
const ANCHOR_MALE = "/__l5e/assets-v1/1a730b9b-2cbf-491c-b28a-b85d156aae72/anchor-male.png";
const ANCHOR_FEMALE = "/__l5e/assets-v1/245edd35-729a-46da-9e16-cb8994f7ca3c/anchor-female.png";
const ANCHOR_BACKDROP = "./art/backgrounds/tv-studio.webp";

// ─── NEWS DESK CUTSCENE (iCivics-style two-anchor broadcast) ───
const AnchorDesk = ({ lines, onDone }) => {
  useMode("public");
  const [i, setI] = useState(0);
  const line = lines[Math.min(i, lines.length - 1)];
  const last = i >= lines.length - 1;
  const active = line.who;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#1a4d62 0%,#246880 40%,#5a7a52 100%)" }}>
      {/* ── Backdrop screen centered behind anchors ── */}
      <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: TALL() ? "84%" : "min(600px,50%)", aspectRatio: "16/9", border: "3px solid rgba(255,255,255,.7)", borderRadius: 6, background: `url(${ANCHOR_BACKDROP}) center/cover`, boxShadow: "0 8px 24px rgba(0,0,0,.35)", opacity: .85 }} />

      {/* ── Anchors flanking the backdrop ── */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 2%", zIndex: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={ANCHOR_MALE} alt="Anchor Tunde" style={{ height: "58%", maxHeight: 560, objectFit: "contain", objectPosition: "bottom", opacity: active === "m" ? 1 : .75, transition: "opacity .3s" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={ANCHOR_FEMALE} alt="Anchor Adaeze" style={{ height: "58%", maxHeight: 560, objectFit: "contain", objectPosition: "bottom", opacity: active === "f" ? 1 : .75, transition: "opacity .3s" }} />
        </div>
      </div>

      {/* ── Desk bar + dialogue bubble + continue (compact, horizontal) ── */}
      <div style={{ position: "relative", background: "linear-gradient(180deg,#b85a1a,#9a4515)", borderTop: "2px solid rgba(255,255,255,.15)", padding: "10px 0 6px", zIndex: 3 }}>
        {/* anchor name tags */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4% 4px", color: "rgba(255,255,255,.8)", fontFamily: F.b, fontSize: TS(18) }}>
          <span style={{ fontWeight: active === "m" ? 700 : 400, opacity: active === "m" ? 1 : .5 }}>TUNDE BAKARE</span>
          <span style={{ fontWeight: active === "f" ? 700 : 400, opacity: active === "f" ? 1 : .5 }}>ADAEZE NWOSU</span>
        </div>
        {/* dialogue bubble */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, padding: TALL() ? "0 4% 12px" : "0 4%", flexDirection: TALL() ? "column" : "row" }}>
          <div style={{ position: "relative", background: "#e8e4dc", borderRadius: 12, padding: "12px 24px 12px 56px", maxWidth: TALL() ? "100%" : "70%", boxShadow: "0 4px 12px rgba(0,0,0,.25)", fontSize: TS(TALL() ? 30 : 24), lineHeight: 1.35, color: "#22201c", fontFamily: F.b }}>
            <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: TS(24), opacity: .5 }}>🔊</span>
            {line.t}
            {/* tail */}
            <div style={{
              position: "absolute", top: -10, [active === "m" ? "left" : "right"]: "12%",
              width: 0, height: 0,
              borderBottom: "12px solid #e8e4dc",
              [active === "m" ? "borderLeft" : "borderRight"]: "16px solid transparent",
            }} />
          </div>
          <button onClick={() => { if (last) onDone(); else setI(i + 1); }}
            style={{ background: "#2f9be0", color: "#fff", border: "none", borderBottom: "3px solid #1d6fa6", borderRadius: 10, padding: "12px 28px", fontWeight: 700, letterSpacing: 1, fontSize: TS(21), cursor: "pointer", fontFamily: F.b, whiteSpace: "nowrap", minHeight: 48 }}>
            {last ? "FINISH ▸" : "NEXT ▸"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SA_PORTRAIT = "./art/characters/special-adviser.webp";
const AVATARS = [
  { id: "agbada", label: "Agbada", desc: "Yoruba formal attire",
    svg: '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sk1" cx="50%" cy="40%"><stop offset="0%" stop-color="#D4A76A"/><stop offset="100%" stop-color="#B8864E"/></radialGradient></defs><ellipse cx="60" cy="38" rx="22" ry="26" fill="url(#sk1)"/><ellipse cx="60" cy="32" rx="20" ry="8" fill="#2C1810" opacity=".9"/><ellipse cx="49" cy="38" rx="2.5" ry="1.8" fill="#1a1a1a"/><ellipse cx="71" cy="38" rx="2.5" ry="1.8" fill="#1a1a1a"/><circle cx="49" cy="37.5" r=".8" fill="#fff"/><circle cx="71" cy="37.5" r=".8" fill="#fff"/><ellipse cx="60" cy="42" rx="4" ry="1.5" fill="#B8864E" stroke="#996B3D" stroke-width=".5"/><path d="M53 48 Q60 52 67 48" stroke="#8B5E3C" fill="none" stroke-width="1.2" stroke-linecap="round"/><path d="M0 72 Q20 58 60 56 Q100 58 120 72 L120 150 L0 150Z" fill="#1B5E20"/><path d="M5 74 Q25 62 60 60 Q95 62 115 74 L115 148 L5 148Z" fill="#2E7D32"/><path d="M48 60 L60 82 L72 60" fill="#1B5E20" opacity=".6"/><rect x="56" y="60" width="8" height="28" rx="2" fill="#C9A227" opacity=".7"/><path d="M56 68 L64 68" stroke="#A68520" stroke-width="1"/><path d="M56 74 L64 74" stroke="#A68520" stroke-width="1"/><path d="M56 80 L64 80" stroke="#A68520" stroke-width="1"/><rect x="28" y="14" width="64" height="16" rx="8" fill="#FAFAFA" opacity=".95"/><rect x="34" y="10" width="52" height="10" rx="5" fill="#C9A227"/><rect x="38" y="12" width="44" height="6" rx="3" fill="#E0C068"/></svg>' },
  { id: "babariga", label: "Babanriga", desc: "Northern flowing robe",
    svg: '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sk2" cx="50%" cy="40%"><stop offset="0%" stop-color="#C4956A"/><stop offset="100%" stop-color="#A67B5B"/></radialGradient></defs><ellipse cx="60" cy="38" rx="22" ry="26" fill="url(#sk2)"/><rect x="42" y="22" width="36" height="4" rx="2" fill="#1a1a1a" opacity=".3"/><ellipse cx="49" cy="38" rx="2.5" ry="1.8" fill="#1a1a1a"/><ellipse cx="71" cy="38" rx="2.5" ry="1.8" fill="#1a1a1a"/><circle cx="49" cy="37.5" r=".8" fill="#fff"/><circle cx="71" cy="37.5" r=".8" fill="#fff"/><ellipse cx="60" cy="42" rx="4" ry="1.5" fill="#A67B5B" stroke="#8B6548" stroke-width=".5"/><path d="M53 48 Q60 52 67 48" stroke="#8B5E3C" fill="none" stroke-width="1.2" stroke-linecap="round"/><path d="M8 68 Q30 56 60 54 Q90 56 112 68 L116 150 L4 150Z" fill="#E8E8E8"/><path d="M12 70 Q34 60 60 58 Q86 60 108 70 L112 148 L8 148Z" fill="#F5F5F5"/><rect x="52" y="58" width="16" height="40" rx="4" fill="#C9A227" opacity=".25"/><path d="M52 66 L68 66" stroke="#C9A227" stroke-width=".8" opacity=".5"/><path d="M52 72 L68 72" stroke="#C9A227" stroke-width=".8" opacity=".5"/><path d="M52 78 L68 78" stroke="#C9A227" stroke-width=".8" opacity=".5"/><path d="M52 84 L68 84" stroke="#C9A227" stroke-width=".8" opacity=".5"/><ellipse cx="60" cy="14" rx="18" ry="12" fill="#FAFAFA"/><ellipse cx="60" cy="14" rx="15" ry="9" fill="#F0F0F0"/><ellipse cx="60" cy="14" rx="10" ry="5" fill="#E8E8E8"/></svg>' },
  { id: "isiagu", label: "Isiagu", desc: "Igbo lion-head shirt",
    svg: '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sk3" cx="50%" cy="40%"><stop offset="0%" stop-color="#D4A76A"/><stop offset="100%" stop-color="#B8864E"/></radialGradient><pattern id="lions" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4" fill="#C9A227" opacity=".5"/><circle cx="9" cy="9" r="2" fill="#A68520" opacity=".4"/></pattern></defs><ellipse cx="60" cy="38" rx="22" ry="26" fill="url(#sk3)"/><ellipse cx="60" cy="30" rx="18" ry="6" fill="#2C1810" opacity=".8"/><ellipse cx="49" cy="38" rx="2.5" ry="1.8" fill="#1a1a1a"/><ellipse cx="71" cy="38" rx="2.5" ry="1.8" fill="#1a1a1a"/><circle cx="49" cy="37.5" r=".8" fill="#fff"/><circle cx="71" cy="37.5" r=".8" fill="#fff"/><ellipse cx="60" cy="42" rx="4" ry="1.5" fill="#B8864E" stroke="#996B3D" stroke-width=".5"/><path d="M53 48 Q60 52 67 48" stroke="#8B5E3C" fill="none" stroke-width="1.2" stroke-linecap="round"/><rect x="18" y="60" width="84" height="82" rx="6" fill="#8B0000"/><rect x="18" y="60" width="84" height="82" rx="6" fill="url(#lions)"/><rect x="18" y="60" width="84" height="82" rx="6" fill="#8B0000" opacity=".3"/><path d="M18 60 L60 60 L60 80 L48 70 L36 80 L24 70Z" fill="#6B0000" opacity=".4"/><path d="M60 60 L102 60 L96 70 L84 80 L72 70 L60 80Z" fill="#6B0000" opacity=".4"/><rect x="42" y="8" width="36" height="20" rx="10" fill="#CC3333"/><rect x="46" y="10" width="28" height="16" rx="8" fill="#E04040"/><path d="M52 18 L60 12 L68 18" fill="#CC3333" opacity=".6"/></svg>' },
  { id: "female", label: "Gele & Wrapper", desc: "Women's formal attire",
    svg: '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sk4" cx="50%" cy="40%"><stop offset="0%" stop-color="#D4A76A"/><stop offset="100%" stop-color="#B8864E"/></radialGradient></defs><ellipse cx="60" cy="42" rx="20" ry="24" fill="url(#sk4)"/><path d="M28 10 Q36 -4 48 6 Q54 -2 60 4 Q66 -2 72 6 Q84 -4 92 10 Q96 22 88 20 Q82 26 74 18 Q68 24 60 16 Q52 24 46 18 Q38 26 32 20 Q24 22 28 10Z" fill="#7C3AED"/><path d="M32 12 Q38 0 48 8 Q54 2 60 6 Q66 2 72 8 Q82 0 88 12 Q86 18 80 16 Q74 22 66 14 Q60 18 54 14 Q46 22 40 16 Q34 18 32 12Z" fill="#8B5CF6"/><path d="M44 8 Q52 2 60 5 Q68 2 76 8" fill="none" stroke="#A78BFA" stroke-width="1.5"/><ellipse cx="49" cy="40" rx="2.2" ry="1.8" fill="#1a1a1a"/><ellipse cx="71" cy="40" rx="2.2" ry="1.8" fill="#1a1a1a"/><circle cx="49" cy="39.5" r=".7" fill="#fff"/><circle cx="71" cy="39.5" r=".7" fill="#fff"/><path d="M55 50 Q60 54 65 50" stroke="#8B5E3C" fill="none" stroke-width="1.2" stroke-linecap="round"/><path d="M48 52 Q52 48 56 52" fill="none" stroke="#C9A227" stroke-width="1.5"/><circle cx="52" cy="49" r="1.5" fill="#C9A227"/><path d="M20 68 Q40 58 60 56 Q80 58 100 68 L104 150 L16 150Z" fill="#7C3AED"/><path d="M24 70 Q42 62 60 60 Q78 62 96 70 L100 148 L20 148Z" fill="#8B5CF6"/><rect x="54" y="60" width="12" height="88" fill="#C9A227" opacity=".3"/><path d="M20 88 L100 88" stroke="#C9A227" stroke-width="1" opacity=".4"/><path d="M20 108 L100 108" stroke="#C9A227" stroke-width="1" opacity=".4"/><path d="M20 128 L100 128" stroke="#C9A227" stroke-width="1" opacity=".4"/></svg>' },
];

const SetupScreen = ({ onDone, level, setLevel }) => {
  useMode("public");
  const [firstNm, setFirstNm] = useState("");
  const [lastNm, setLastNm] = useState("");
  const nm = (firstNm.trim() + " " + lastNm.trim()).trim();
  const setNm = (v) => { const p = String(v || "").trim().split(/\s+/); setFirstNm(p[0] || ""); setLastNm(p.slice(1).join(" ") || ""); };
  const [party, setParty] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [st, setSt] = useState(null);
  const [depGov, setDepGov] = useState(null);
  const [agenda, setAgenda] = useState(null);
  const [slogan, setSlogan] = useState(null);
  const [zf, setZf] = useState(null);
  const [openZone, setOpenZone] = useState(null); // phone: the one region open in the state list
  const [step, setStep] = useState(1);
  const [showFCT, setShowFCT] = useState(false);
  const [sCampRound, setSCampRound] = useState(0);
  const [sCampScore, setSCampScore] = useState(0);
  const [sCampOpp, setSCampOpp] = useState(0);
  const [sCampLog, setSCampLog] = useState([]);
  const [sCampZones, setSCampZones] = useState(null);
  const [sCampDays, setSCampDays] = useState(0); // campaign days spent on this week's main move
  const [warChest, setWarChest] = useState(0.8); // ₦800M starting campaign funds
  const [gfDebt, setGfDebt] = useState(0); // how much you owe the godfather
  const [gfBorrowed, setGfBorrowed] = useState(false);
  const [gfMandates, setGfMandates] = useState([]); // concrete godfather obligations that must handshake with cabinet/projects
  const [preTrib, setPreTrib] = useState(null); // {level, spent, log, oppName, oppPartyId, margin, zonesWon, evidence}
  // Phase 2 §1 — Election Night has to play once before the EC8D card renders.
  // Per-instance flag ("first"/"re") — resetting sCampRound to 0 for a retry
  // clears the flag too (see reset sites below).
  const [enightPlayed, setEnightPlayed] = useState({});
  const [enightSummary, setEnightSummary] = useState(null);
  const [anchorsShown, setAnchorsShown] = useState(false);
  useEffect(() => {
    if (sCampRound >= 8 && !enightPlayed.first && st && window.SOP && window.SOP.playElectionNight) {
      // Derive opponent identity the same way the render path does (line 1312),
      // so ledger `target` and overlay labels stay coherent.
      const oppR = rng((st?.length || 5) * 77 + 99);
      const oNm = "Hon. " + gN(oppR, STATES[st]?.zone, st);
      const oPt = PARTIES.filter(p => p.id !== party)[Math.floor(oppR() * (PARTIES.length - 1))];
      window.SOP.playElectionNight({
        state: st, playerName: nm, partyId: party,
        oppName: oNm, oppPartyId: oPt?.id || "OPP",
        cashRemaining: warChest, year: new Date().getFullYear(),
      }, (summary) => {
        setEnightSummary(summary);
        setEnightPlayed(p => ({ ...p, first: true }));
        try { window.SOP.__lastEnight = summary; } catch(e){}
      });
    }
  }, [sCampRound, enightPlayed.first, st]);
  const fs = useMemo(() => { const e = Object.entries(STATES); return zf ? e.filter(([, d]) => d.zone === zf) : e; }, [zf]);
  const depCands = useMemo(() => st ? genDepGov(st, 999, STATES[st]?.zone).concat([(() => { const r2 = rng(st.length * 88); return { nm: gN(r2, STATES[st]?.zone, st), co: ri(50, 85, r2), lo: ri(40, 80, r2), cr: ri(5, 30, r2), pu: ri(50, 90, r2), bg: "Wildcard", bio: genBio(r2), desc: "Unknown quantity. Could be brilliant or a disaster." }; })()]) : [], [st]);
  const dc = { "Medium": CL.grn, "Hard": CL.org, "Very Hard": CL.red, "Extreme": "#8b0000" };
  const saName = (typeof SA_ROSTER !== "undefined" && SA_ROSTER[0]) ? SA_ROSTER[0].name : "Adviser";

  // AGENDA_EFFECTS drives real gameplay each turn (see endTurn hook). Every option here
  // is a permanent multiplier on that domain plus a stakeholder tilt, so the choice is not cosmetic.
  const AGENDAS = [
    { id: "education", i: "📚", nm: "Education for All", d: "Free basic education, school feeding, teacher training, tech hubs.", bonus: "+50% literacy growth · +2 youth/turn · Edu budget stretches 25% further" },
    { id: "health", i: "🏥", nm: "Healthcare Revolution", d: "Revitalise PHCs, health insurance, clean water for all.", bonus: "+50% health growth · +2 women/turn · Maternal-mortality Wiki entry" },
    { id: "infrastructure", i: "🏗️", nm: "Build, Build, Build", d: "Roads, bridges, airports, housing estates.", bonus: "+50% infra growth · +1 business/turn · +10% project completion speed" },
    { id: "security", i: "🛡️", nm: "Peace & Security", d: "Community policing, intel, state security outfits (Amotekun/Ebubeagu).", bonus: "+50% security growth · -20% bandit/insurgency shock damage" },
    { id: "agriculture", i: "🌾", nm: "Agricultural Transformation", d: "Irrigation, subsidies, value chains, export crops.", bonus: "+50% agriculture growth · +₦0.3B IGR/turn from agro-clusters" },
    { id: "anticorruption", i: "⚖️", nm: "Clean Governance", d: "Transparency portal, digital government, zero tolerance.", bonus: "-40% corruption drift · Judiciary win-chance +10% · +3 media/turn" },
    { id: "youth", i: "💼", nm: "Youth Empowerment", d: "Skills, N-Power-style loans, tech hubs, mandatory youth-employment quotas.", bonus: "+3 youth/turn · +₦0.2B IGR from MSMEs · -1 approval when unfunded" },
    { id: "women", i: "👩", nm: "Women & Social Welfare", d: "Gender equality, maternal care, girl-child education.", bonus: "+25% health & literacy growth · +2 women/turn · protects against gender-based shocks" },
    { id: "technology", i: "💻", nm: "Digital Economy", d: "Broadband, e-governance, startup ecosystem, coding schools.", bonus: "+25% literacy · +₦0.4B IGR/turn from tech sector · +5 business" },
    { id: "housing", i: "🏠", nm: "Affordable Housing", d: "Mass housing, land reform, mortgage schemes for workers.", bonus: "+30% infra growth · +3 approval/turn while treasury > ₦5B" },
  ];

  const SLOGANS = [
    "A New Dawn for " + (st || "").replace("_", " "),
    "Progress, Peace, Prosperity",
    "The People's Governor",
    "Building " + (st || "").replace("_", " ") + " Together",
    "No One Left Behind",
    "Action, Not Words",
    "From Promise to Performance",
    "A Future We Can Trust",
  ];

  // STEP 1: Choose State
  if (step === 1) return (
    <div style={{ height: "100%", background: CL.bg, display: "flex", flexDirection: "column" }}>
      <TopBar title="Choose Your State" />
      <div style={{ maxWidth: 1800, margin: "0 auto", padding: "8px 16px 12px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
            {[{ id: "easy", l: "🟢 Easy", c: CL.grn }, { id: "medium", l: "🟡 Medium", c: CL.org }, { id: "hard", l: "🔴 Hard", c: CL.red }].map(d => (
              <button key={d.id} onClick={() => setLevel(d.id)} style={{ padding: "8px 24px", borderRadius: 18, border: "1px solid " + (level === d.id ? d.c : CL.bdr), background: level === d.id ? d.c + "15" : "transparent", color: level === d.id ? d.c : CL.td, fontSize: TS(18), fontWeight: level === d.id ? 700 : 400, cursor: "pointer", fontFamily: F.b }}>{d.l}</button>
            ))}
          </div>
          <p style={{ color: CL.td, fontSize: TS(18), marginTop: 4 }}>36 states. Each starts differently: how much money it raises itself (its IGR), how safe it is, and how strong its godfather is.</p>
        </div>
        {TALL() ? <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* Phone: states grouped by region, one region open at a time. */}
          {Object.entries(ZONES).map(([zk, zname]) => {
            const list = Object.entries(STATES).filter(([, d]) => d.zone === zk);
            const open = openZone === zk;
            const picked = list.find(([n]) => n === st);
            return <div key={zk} style={{ background: CL.card, border: "1px solid " + (picked ? CL.grn : CL.bdr), borderRadius: 18, marginBottom: 12, overflow: "hidden" }}>
              <button onClick={() => setOpenZone(open ? null : zk)} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: "transparent", border: 0, cursor: "pointer", textAlign: "left", color: CL.txt, minHeight: 64 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: ZC[zk], flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: TS(25), fontWeight: 700 }}>{zname}</span>
                  <span style={{ display: "block", fontSize: TS(20), color: picked ? CL.grn : CL.td }}>{picked ? "Chosen: " + picked[0].replace("_", " ") : list.length + " states · " + list.slice(0, 3).map(([n]) => n.replace("_", " ")).join(", ") + "…"}</span>
                </span>
                <span style={{ fontSize: TS(20), color: CL.td, transform: open ? "rotate(180deg)" : "none" }}>▼</span>
              </button>
              {open && <div style={{ padding: "0 10px 10px" }}>
                {list.map(([n, d]) => {
                  const isFCT = n === "FCT";
                  const on = !isFCT && st === n;
                  return <button key={n} onClick={() => isFCT ? setShowFCT(true) : setSt(n)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 12px", minHeight: 56, marginTop: 6, borderRadius: 14, border: "1px solid " + (on ? CL.grn : CL.bdr), background: on ? CL.grn + "14" : "transparent", cursor: "pointer", textAlign: "left", color: CL.txt, opacity: isFCT ? .6 : 1 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: TS(25), fontWeight: on ? 700 : 500 }}>{on ? "✓ " : ""}{n.replace("_", " ")}</span>
                      <span style={{ display: "block", fontSize: TS(20), color: CL.td }}>{isFCT ? "Not playable · run by a federal minister" : stateLine(n, d)}</span>
                    </span>
                  </button>;
                })}
              </div>}
            </div>;
          })}
        </div> : <>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setZf(null)} style={{ padding: "5px 18px", borderRadius: 14, border: "1px solid " + (zf ? CL.bdr : CL.grn), background: zf ? "transparent" : CL.grn + "15", color: zf ? CL.td : CL.grn, fontSize: TS(16), cursor: "pointer", fontFamily: F.b }}>All</button>
          {Object.entries(ZONES).map(([k, v]) => (
            <button key={k} onClick={() => setZf(k)} style={{ padding: "5px 18px", borderRadius: 14, border: "1px solid " + (zf === k ? ZC[k] : CL.bdr), background: zf === k ? ZC[k] + "15" : "transparent", color: zf === k ? ZC[k] : CL.td, fontSize: TS(16), cursor: "pointer", fontFamily: F.b }}>{v}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8, overflowY: "auto", flex: 1, minHeight: 0, paddingRight: 4 }}>
          {fs.map(([n, d]) => {
            const isFCT = n === "FCT";
            return (
              <Cd key={n} onClick={() => isFCT ? setShowFCT(true) : setSt(n)} active={!isFCT && st === n} style={{ padding: 14, opacity: isFCT ? .55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: F.d, color: isFCT ? CL.td : CL.txt, fontSize: TS(24), fontWeight: 600 }}>{n.replace("_", " ")}</span>
                  {isFCT ? <Bg text="NOT PLAYABLE" color={CL.td} /> : null}
                </div>
                <div style={{ fontSize: TS(16), color: CL.td, fontFamily: F.m, marginBottom: 6 }}>{isFCT ? "Federal Capital Territory · Minister-run" : ZONES[d.zone] + " · " + d.pop + "M"}</div>
                {!isFCT && <div style={{ fontSize: TS(18), color: CL.tm, lineHeight: 1.35 }}>{stateLine(n, d)}</div>}
                {isFCT && <div style={{ fontSize: TS(16), color: CL.td, fontStyle: "italic" }}>Tap to learn why</div>}
              </Cd>
            );
          })}
        </div>
        </>}
        <OL show={showFCT}>
          <Cd style={{ borderColor: CL.gold + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 14 }}><div style={{ fontSize: TS(48), marginBottom: 10 }}>🏛️</div><h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(34), fontWeight: 600, margin: "0 0 10px" }}>Federal Capital Territory</h3><Bg text="Not a State" color={CL.org} /></div>
            <div style={{ fontSize: TS(18), color: CL.tm, lineHeight: 1.5, textAlign: "left" }}>
              <p style={{ marginBottom: 14 }}>The FCT (Abuja) is <strong>not a state</strong>. It is administered by a <strong>Minister</strong> appointed by the President. Under <strong>Section 299</strong>, the President exercises the powers of a governor. No elected governor, no House of Assembly, no deputy governor.</p>
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}><Bt v="ghost" onClick={() => setShowFCT(false)}>← Back</Bt></div>
          </Cd>
        </OL>
        {st && <div style={{ textAlign: "center", marginTop: TALL() ? 12 : 50 }}><PillBtn onClick={() => setStep(2)} style={TALL() ? { width: "100%", padding: "18px 24px" } : undefined}>NEXT{TALL() ? ": " + st.replace("_", " ") : ""}</PillBtn></div>}
      </div>
    </div>
  );

  // STEP 2: Appearance & Name (no adviser here — she gets her own scene)
  if (step === 2) {
    const avIdx = Math.max(0, AVATARS.findIndex(a => a.id === avatar));
    const cur = AVATARS[avIdx];
    const go = (d) => setAvatar(AVATARS[(avIdx + d + AVATARS.length) % AVATARS.length].id);
    return (
    <div style={{ minHeight: "100%", background: CL.bg }}>
      <TopBar title="Create Your Candidate" onBack={() => setStep(1)} />
      {/* Character stage */}
      <div style={{ background: SK.stage, position: "relative", padding: "36px 36px 0", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 55% at 50% 55%, rgba(255,255,255,.30), rgba(255,255,255,0) 70%)" }} />
        <div style={{ position: "relative", maxWidth: 1164, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 29 }}>
          <PillBtn tone="plain" onClick={() => go(-1)} style={{ padding: "36px 58px", fontSize: TS(58) }}>‹</PillBtn>
          <div style={{ textAlign: "center", flex: "0 0 auto" }}>
            <img key={cur.id} src={AVATAR_IMGS[cur.id]} alt={cur.label} className="sop-fade-in" style={{ width: 462, height: "auto", display: "block", filter: avatar ? "drop-shadow(0 14px 18px rgba(0,0,0,.35))" : "grayscale(.5) opacity(.75)" }} />
          </div>
          <PillBtn tone="plain" onClick={() => go(1)} style={{ padding: "36px 58px", fontSize: TS(58) }}>›</PillBtn>
        </div>
        <div style={{ position: "relative", textAlign: "center", paddingBottom: 43 }}>
          <div style={{ display: "flex", gap: 19, justifyContent: "center", marginTop: 29 }}>
            {AVATARS.map((a, i) => <span key={a.id} onClick={() => setAvatar(a.id)} style={{ width: 29, height: 29, borderRadius: 1247, cursor: "pointer", background: i === avIdx && avatar ? "#f7c948" : "rgba(255,255,255,.45)" }} />)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1056, margin: "1px auto 0", padding: "0 43px 102px", position: "relative" }}>
        <CivicPanel>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 50 }}>
            <PillBtn tone="gold" onClick={() => setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)].id)} style={{ padding: "29px 94px", fontSize: TS(43) }}>Random</PillBtn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, marginBottom: 29 }}>
            <input value={firstNm} onChange={e => setFirstNm(e.target.value)} placeholder="First Name" style={{ width: "100%", padding: "43px 50px", borderRadius: 21, border: "2px solid " + CL.bdr, fontSize: TS(53), fontFamily: F.d, background: "#fff", color: CL.txt, outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,.06)" }} />
            <input value={lastNm} onChange={e => setLastNm(e.target.value)} placeholder="Last Name" style={{ width: "100%", padding: "43px 50px", borderRadius: 21, border: "2px solid " + CL.bdr, fontSize: TS(53), fontFamily: F.d, background: "#fff", color: CL.txt, outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,.06)" }} />
          </div>
          <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 43, textAlign: "left", lineHeight: 1.5 }}>Your surname becomes your ticket half — <b>{(lastNm || "SURNAME").toUpperCase()}/DEPUTY</b>. Your full name goes on the ballot paper and into your Wikipedia bio.</div>
          <div style={{ textAlign: "center" }}>
            <PillBtn onClick={() => setStep(25)} disabled={!(firstNm.trim() && lastNm.trim() && avatar)}>CONTINUE</PillBtn>
            {firstNm.trim() && lastNm.trim() && !avatar && <div style={{ fontSize: TS(34), color: CL.org, marginTop: 22 }}>☝️ Use the arrows to choose your look</div>}
            {(!firstNm.trim() || !lastNm.trim()) && <div style={{ fontSize: TS(34), color: CL.td, marginTop: 22 }}>Enter both first and last name to continue.</div>}
          </div>
        </CivicPanel>
      </div>
    </div>
    );
  }

  // STEP 2.5: Meet your Special Adviser — dedicated character scene
  if (step === 25) return (
    <div style={{ minHeight: "100%", background: SK.stage, position: "relative", overflow: "hidden" }}>
      <TopBar title="Your Special Adviser" onBack={() => setStep(2)} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 55% at 50% 45%, rgba(255,255,255,.25), rgba(255,255,255,0) 70%)" }} />
      <div style={{ position: "relative", maxWidth: 1164, margin: "0 auto", padding: "36px 43px 98px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={SA_PORTRAIT} alt={saName} className="sop-fade-in" style={{ width: 588, height: "auto", filter: "drop-shadow(0 16px 20px rgba(0,0,0,.35))" }} />
        <div className="sop-slide-up" style={{ width: "100%", marginTop: -12 }}>
          <CivicPanel style={{ textAlign: "left" }}>
            <div style={{ fontFamily: F.m, fontSize: TS(31), letterSpacing: 3, color: CL.grn, fontWeight: 800, marginBottom: 14 }}>{("SA " + saName).toUpperCase()} · SPECIAL ADVISER</div>
            <div style={{ fontFamily: F.b, fontSize: TS(46), color: CL.txt, lineHeight: 1.65 }}>{ADV.welcome(nm, st, saName)}</div>
            <div style={{ textAlign: "center", marginTop: 50 }}>
              <PillBtn onClick={() => setStep(3)}>CONTINUE</PillBtn>
            </div>
          </CivicPanel>
        </div>
      </div>
    </div>
  );

  // STEP 3: Agenda (10 options)
  if (step === 3) return (
    <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
      <Flag />
      <div style={{ maxWidth: 1056, margin: "72px auto" }}>
        <AdvBubble text={ADV.agenda} saName={saName} />
        <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(72), fontWeight: 600, margin: "0 0 36px", textAlign: "center" }}>Your Flagship Agenda</h2>
        <div style={{ display: "grid", gridTemplateColumns: TALL() ? "1fr" : "repeat(auto-fill,minmax(240px,1fr))", gap: 22 }}>
          {AGENDAS.map(a => (
            <Cd key={a.id} onClick={() => setAgenda(a.id)} active={agenda === a.id} style={{ padding: 29 }}>
              <span style={{ fontSize: TS(65) }}>{a.i}</span>
              <div style={{ fontWeight: 700, fontSize: TS(38), color: CL.txt, marginTop: 7 }}>{a.nm}</div>
              <div style={{ fontSize: TS(31), color: CL.td, lineHeight: 1.3, marginTop: 7 }}>{a.d}</div>
              <Bg text={a.bonus} color={CL.grn} />
            </Cd>
          ))}
        </div>
        {agenda && <div style={{ textAlign: "center", marginTop: 43 }}>
          <AdvBubble text={"Excellent choice! " + AGENDAS.find(a => a.id === agenda)?.nm + " — the people of " + st.replace("_", " ") + " will love this. Now, let's get your party ticket."} saName={saName} />
          <Bt onClick={() => setStep(4)}>PARTY PRIMARIES →</Bt>
          <div style={{ marginTop: 22 }}><Bt v="ghost" onClick={() => setStep(2)} style={{ fontSize: TS(34) }}>← Back</Bt></div>
        </div>}
      </div>
    </div>
  );

  // STEP 4: Party Selection + Primaries (civic education)
  if (step === 4) {
    const selectedParty = PARTIES.find(p => p.id === party);
    const canAffordTicket = selectedParty ? warChest >= selectedParty.ticket : true;
    return (
    <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
      <Flag />
      <div style={{ maxWidth: 984, margin: "72px auto" }}>
        <AdvBubble text={ADV.primaries} saName={saName} />
        <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(72), fontWeight: 600, margin: "0 0 14px", textAlign: "center" }}>Party Primaries</h2>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-block", background: CL.gold + "12", border: "1px solid " + CL.gold + "30", borderRadius: 13, padding: "14px 43px" }}>
            <span style={{ fontSize: TS(34), color: CL.td }}>💰 Your War Chest: </span>
            <span style={{ fontSize: TS(50), fontWeight: 700, color: CL.gold, fontFamily: F.m }}>₦{warChest.toFixed(1)}B</span>
            {gfDebt > 0 && <span style={{ fontSize: TS(34), color: CL.red, marginLeft: 22 }}>🎩 Godfather: ₦{gfDebt}B owed</span>}
          </div>
        </div>
        <div style={{ background: CL.blu + "08", border: "1px solid " + CL.blu + "20", borderRadius: 13, padding: "29px 36px", marginBottom: 36 }}>
          <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.blu, marginBottom: 7 }}>📖 HOW PRIMARIES WORK</div>
          <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.4 }}>Under the Electoral Act 2022, parties conduct primaries to select candidates. Each party charges a nomination fee — the bigger parties charge more but have stronger structures. Your war chest must cover the ticket AND your campaign. Choose wisely.</div>
        </div>
        <div style={{ display: "grid", gap: 22, marginBottom: 36 }}>
          {PARTIES.map(p => {
            const afford = warChest >= p.ticket;
            return <Cd key={p.id} onClick={() => setParty(p.id)} active={party === p.id} style={{ padding: 29, opacity: afford || gfBorrowed ? 1 : .7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: TS(50), marginRight: 14 }}>{p.i}</span>
                  <span style={{ fontWeight: 700, fontSize: TS(48), color: p.c }}>{p.id}</span>
                  <span style={{ fontSize: TS(34), color: CL.td, marginLeft: 14 }}>{p.nm}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: TS(43), fontWeight: 700, color: afford ? CL.gold : CL.red, fontFamily: F.m }}>₦{p.ticket}B</div>
                  <div style={{ fontSize: TS(29), color: CL.td }}>ticket</div>
                </div>
              </div>
              <div style={{ fontSize: TS(31), color: CL.tm, marginTop: 10, lineHeight: 1.3 }}>{p.desc}</div>
              <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
                <Bg text={"Strength: " + (p.strength >= 1 ? "Strong" : p.strength >= 0.8 ? "Moderate" : "Weak")} color={p.strength >= 1 ? CL.grn : p.strength >= 0.8 ? CL.org : CL.red} />
                <Bg text={afford ? "Can afford" : "Can't afford"} color={afford ? CL.grn : CL.red} />
              </div>
            </Cd>;
          })}
        </div>
        {!gfBorrowed && (warChest < 0.5 || (party && !canAffordTicket)) && <Cd onClick={() => { setWarChest(w => w + 1); setGfDebt(d => d + 1); setGfBorrowed(true); }} style={{ padding: 22, borderColor: CL.red + "44", marginBottom: 29, textAlign: "center" }}>
          <div style={{ fontSize: TS(36), fontWeight: 600, color: CL.red }}>🎩 Need more money? Borrow ₦1B from the Godfather</div>
          <div style={{ fontSize: TS(29), color: CL.td }}>He'll fund your ticket AND campaign. But he owns you. +5% starting corruption. He WILL collect. {party && !canAffordTicket ? "You need this to afford the " + party + " ticket." : "This opens ALL parties to you."}</div>
        </Cd>}
        {party && <div style={{ textAlign: "center" }}>
          {canAffordTicket ? <Cd style={{ borderColor: CL.grn + "44", marginBottom: 29, padding: 36 }}>
            <div style={{ fontSize: TS(36), color: CL.grn, fontWeight: 700, marginBottom: 14 }}>🗳️ PRIMARY RESULT</div>
            <div style={{ fontSize: TS(43), color: CL.txt }}>{nm} wins the {party} primary for {st.replace("_", " ")} State!</div>
            <div style={{ fontSize: TS(34), color: CL.td, marginTop: 10 }}>Ticket cost: ₦{selectedParty.ticket}B. Remaining war chest: ₦{(warChest - selectedParty.ticket).toFixed(1)}B for the campaign.</div>
          </Cd> : <Cd style={{ borderColor: CL.red + "44", marginBottom: 29, padding: 36 }}>
            <div style={{ fontSize: TS(36), color: CL.red, fontWeight: 700, marginBottom: 14 }}>❌ CAN'T AFFORD THIS TICKET</div>
            <div style={{ fontSize: TS(34), color: CL.td }}>You need ₦{selectedParty.ticket}B but only have ₦{warChest.toFixed(1)}B. Borrow from the godfather or choose a cheaper party.</div>
          </Cd>}
          {canAffordTicket && <Bt onClick={() => { setWarChest(w => w - selectedParty.ticket); setStep(5); }}>CHOOSE YOUR SLOGAN →</Bt>}
          <div style={{ marginTop: 22 }}><Bt v="ghost" onClick={() => { setParty(null); setStep(3); }} style={{ fontSize: TS(34) }}>← Back</Bt></div>
        </div>}
      </div>
    </div>
  );
  }

  // STEP 5: Campaign Slogan
  if (step === 5) return (
    <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
      <Flag />
      <div style={{ maxWidth: 912, margin: "86px auto" }}>
        <AdvBubble text={ADV.slogan} saName={saName} />
        <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(72), fontWeight: 600, margin: "0 0 36px", textAlign: "center" }}>Your Campaign Slogan</h2>
        <div style={{ display: "grid", gap: 22 }}>
          {SLOGANS.map((sl, i) => (
            <Cd key={i} onClick={() => setSlogan(sl)} active={slogan === sl} style={{ padding: 36, textAlign: "center" }}>
              <div style={{ fontFamily: F.d, fontSize: TS(53), fontWeight: 600, color: CL.txt }}>"{sl}"</div>
            </Cd>
          ))}
        </div>
        {slogan && <div style={{ textAlign: "center", marginTop: 43 }}><Bt onClick={() => setStep(6)}>PARTY CONVENTION →</Bt><div style={{ marginTop: 22 }}><Bt v="ghost" onClick={() => { setSlogan(null); setStep(4); }} style={{ fontSize: TS(34) }}>← Back</Bt></div></div>}
      </div>
    </div>
  );

  // STEP 6: Party Convention (4 deputy options)
  if (step === 6) {
    const partyFav = depCands.reduce((best, c) => c.lo > (best?.lo || 0) ? c : best, depCands[0]);
    const partyFavIdx = depCands.indexOf(partyFav);
    return (
      <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
        <Flag />
        <div style={{ maxWidth: 1164, margin: "72px auto" }}>
          <AdvBubble text={ADV.convention} saName={saName} />
          <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(72), fontWeight: 600, margin: "0 0 36px", textAlign: "center" }}>Deputy Governor Selection</h2>
          <Cd style={{ marginBottom: 36, borderColor: CL.pur + "44", background: CL.pur + "06" }}>
            <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 14 }}>🗳️ PARTY RECOMMENDS:</div>
            <div style={{ fontWeight: 700, fontSize: TS(50), color: CL.txt }}>{partyFav.nm}</div>
            <Bg text={partyFav.bg} color={CL.pur} />
            {partyFav.bio && <div style={{ fontSize: TS(34), color: CL.tm, marginTop: 10, fontStyle: "italic" }}>{partyFav.bio}</div>}
            <div style={{ marginTop: 22 }}><Bt onClick={() => { setDepGov(partyFav); setStep(7); }} style={{ width: "100%" }}>✅ ACCEPT (+10 party stability)</Bt></div>
          </Cd>
          <div style={{ fontSize: TS(36), fontWeight: 700, color: CL.org, marginBottom: 22 }}>OR CHOOSE YOUR OWN:</div>
          <div style={{ display: "grid", gap: 22 }}>
            {depCands.filter((_, i) => i !== partyFavIdx).map((c, i) => (
              <Cd key={i} onClick={() => setDepGov(c)} active={depGov?.nm === c.nm} style={{ padding: 29 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontWeight: 700, fontSize: TS(48), color: CL.txt }}>{c.nm}</div><Bg text={c.bg} color={CL.org} /></div>
                  {depGov?.nm === c.nm && <span style={{ color: CL.grn, fontSize: TS(58) }}>✓</span>}
                </div>
                {c.bio && <div style={{ fontSize: TS(31), color: CL.tm, marginTop: 10, fontStyle: "italic" }}>{c.bio}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <SB label="Competence" value={c.co} max={100} color={CL.blu} />
                  <SB label="Loyalty" value={c.lo} max={100} color={CL.pur} />
                </div>
              </Cd>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 22 }}><Bt v="ghost" onClick={() => { setDepGov(null); setStep(5); }} style={{ fontSize: TS(34) }}>← Back</Bt></div>
          {depGov && depGov.nm !== partyFav.nm && <div style={{ textAlign: "center", marginTop: 36 }}><Bt v="danger" onClick={() => setStep(7)}>INSIST ON {depGov.nm.split(" ").pop().toUpperCase()} →</Bt></div>}
        </div>
      </div>
    );
  }

  // STEP 7: Convention Result
  if (step === 7) {
    const partyFav = depCands.reduce((best, c) => c.lo > (best?.lo || 0) ? c : best, depCands[0]);
    const accepted = depGov?.nm === partyFav.nm;
    const startingStab = accepted ? 75 : 65 - (depGov?.lo < 40 ? 15 : depGov?.lo < 60 ? 12 : 8);
    return (
      <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
        <Flag />
        <div style={{ maxWidth: 948, margin: "102px auto", textAlign: "center" }}>
          <div style={{ fontSize: TS(113), marginBottom: 29 }}>{accepted ? "🤝" : "⚡"}</div>
          <h2 style={{ fontFamily: F.d, color: accepted ? CL.grn : CL.org, fontSize: TS(79), fontWeight: 700, margin: "0 0 22px" }}>{accepted ? "Unity Ticket" : "Convention Split"}</h2>
          <div style={{ display: "inline-block", background: CL.gold + "18", border: "1.5px solid " + CL.gold, borderRadius: 17, padding: "29px 58px", margin: "22px 0 36px", fontFamily: F.d, fontSize: TS(72), fontWeight: 700, color: CL.txt, letterSpacing: 2 }}>
            {(lastNm || "SURNAME").toUpperCase()} / {(depGov?.nm.split(" ").pop() || "DEPUTY").toUpperCase()}
            <div style={{ fontSize: TS(31), letterSpacing: 1, color: CL.td, fontWeight: 500, fontFamily: F.b, marginTop: 7 }}>{PARTIES.find(p => p.id === party)?.nm} · {st.replace("_", " ")} 2027</div>
          </div>
          <AdvBubble text={ADV.conventionResult(accepted)} saName={saName} />
          <div style={{ display: "flex", gap: 22, justifyContent: "center", marginBottom: 43, flexWrap: "wrap" }}>
            <Bg text={"Full name: " + nm} color={CL.blu} />
            <Bg text={"Deputy: " + depGov?.nm} color={CL.grn} />
            <Bg text={"Party Stability: " + startingStab + "%"} color={startingStab > 60 ? CL.grn : CL.org} />
          </div>
          <Bt onClick={() => setStep(8)}>LAUNCH CAMPAIGN →</Bt>
        </div>
      </div>
    );
  }

  // STEP 8: Full Campaign Simulation — real LGA battlegrounds, no fake maps

  if (step === 8) {
    const oppR2 = rng((st?.length || 5) * 77 + 99);
    const oName = "Hon. " + gN(oppR2, STATES[st]?.zone, st);
    const oParty = PARTIES.filter(p => p.id !== party)[Math.floor(oppR2() * (PARTIES.length - 1))];
    const activeZones = sCampZones || buildBattlegrounds(st, 2026, party, oParty?.id);
    const swingZone = activeZones.reduce((a, b) => b.swing > a.swing ? b : a, activeZones[0]);
    const weakZone = activeZones.reduce((a, b) => b.support < a.support ? b : a, activeZones[0]);
    const baseZone = activeZones.reduce((a, b) => b.support > a.support ? b : a, activeZones[0]);
    const week = Math.floor(sCampRound / 2) + 1;
    const isOpp = sCampRound % 2 === 1 && sCampRound < 8;
    const isResult = sCampRound >= 8;

    // Part 1 — where you stand: one poll line per senatorial zone, shares add to 100
    const renderZones = (zones = activeZones) => <Cd style={{ padding: 24, margin: "18px 0", background: "#fbfcf8" }}>
      <div style={{ fontSize: TS(29), fontWeight: 700, color: CL.grn, fontFamily: F.m, letterSpacing: 2, marginBottom: 12 }}>WHERE YOU STAND</div>
      {zones.map(z => { const you = pollShare(z); return <div key={z.id} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: TS(31), color: CL.txt }}><b>{z.zone.replace(" Senatorial", "")}</b><span style={{ fontFamily: F.m }}><b style={{ color: you >= 50 ? CL.grn : CL.txt }}>You {you}%</b> · <span style={{ color: you < 50 ? CL.red : CL.tm }}>{oParty?.id || "Opponent"} {100 - you}%</span></span></div>
        <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", margin: "6px 0 4px", background: CL.red + "55" }}><div style={{ width: you + "%", background: CL.grn }} /></div>
        <div style={{ fontSize: TS(27), color: CL.td }}>{z.key}</div>
      </div>; })}
      <div style={{ fontSize: TS(27), color: CL.td }}>Poll, margin ±4. Turnout and money decide close zones.</div>
    </Cd>;

    const mkActs = () => [[
      { l: "📢 Three-Zone Rally Tour", days: 3, d: "Hit " + activeZones.map(z => z.key.split(", ")[0]).join(", ") + ". Strong statewide signal.", pts: 5, oppPts: 1, cost: 0.25, target: "all", your: 3, turnout: 4, risk: "Broad, costly, visible." },
      { l: "📺 Live Governorship Debate", days: 4, d: "No map gimmick — statewide TV/radio. You can move undecided voters everywhere.", pts: 7, oppPts: -3, cost: 0, target: "all", your: 2, opp: -2, risk: "One bad answer becomes tomorrow's headline." },
      { l: "📋 Ward Manifesto Drop", days: 2, d: "Target " + swingZone.zone + ": " + swingZone.key + ". Cheap policy operation.", pts: 3, oppPts: 0, cost: 0.03, target: swingZone.id, your: 4, turnout: 1, risk: "Good for swing LGAs, weak for momentum." },
    ],[
      { l: "🏘️ Door-to-Door Canvass", days: 2, d: "Deploy ward agents in " + swingZone.key + ". Converts actual voters, not vibes.", pts: 6, oppPts: 0, cost: 0.35, target: swingZone.id, your: 8, turnout: 6, risk: "Expensive ground game." },
      { l: "🤝 LGA Chair Coalition", days: 4, d: "Negotiate structures in your weakest zone: " + weakZone.key + ".", pts: 4, oppPts: -4, cost: 0, target: weakZone.id, your: 7, opp: -3, corAdd: .03, risk: "Patronage promises follow you into office." },
      { l: "📻 Community Radio Blitz", days: 2, d: "Local-language radio across " + baseZone.key + ". Protect your base cheaply.", pts: 3, oppPts: 0, cost: 0.05, target: baseZone.id, your: 4, turnout: 3, risk: "Defensive, not transformative." },
    ],[
      { l: "🎤 Youth Town Hall Circuit", days: 3, d: "Campus, market, creators, unions — focused on " + swingZone.zone + ".", pts: 6, oppPts: -1, cost: 0.15, target: swingZone.id, your: 7, opp: -1, turnout: 4, risk: "Youth ask brutal questions." },
      { l: "⚔️ Opposition Research Drop", days: 4, d: "Expose " + oName + ". Free, dirty, high backfire risk.", pts: 3, oppPts: -6, cost: 0, target: "all", your: 1, opp: -4, appRisk: -3, risk: "Negative politics can poison your mandate." },
      { l: "🤲 Market & Motor-Park Walk", days: 2, d: "Retail politics in " + weakZone.key + ".", pts: 2, oppPts: 0, cost: 0.02, target: weakZone.id, your: 4, turnout: 2, risk: "Warm photos, limited reach." },
    ],[
      { l: "🏟️ Final Mega Rally", days: 3, d: "Close with spectacle; buses from all real LGAs.", pts: 8, oppPts: 1, cost: 0.4, target: "all", your: 4, turnout: 5, risk: "Win-or-lose defining image." },
      { l: "🚪 Swing-LGA GOTV", days: 3, d: "Election-eve agents in " + swingZone.key + ".", pts: 6, oppPts: 0, cost: 0.15, target: swingZone.id, your: 6, turnout: 9, risk: "Neglects your base if turnout collapses elsewhere." },
      { l: "🗳️ Polling Unit Agents", days: 2, d: "Minimal agents across collation centres. Cheap but thin.", pts: 3, oppPts: 0, cost: 0.08, target: "all", your: 1, turnout: 2, corAdd: .01, risk: "Opponent may overpower weak wards." },
    ]];

    const oppEvts = [
      { t: "📰 Opponent Questions Your Credentials", d: oName + " attacks your qualifications in " + weakZone.key + ".", opts: [
        { l: "📊 Publish Receipts", days: 2, dc: .02, d: "Counter with verifiable records and named community endorsers.", pts: 5, oppPts: -2, target: weakZone.id, your: 5, opp: -2 },
        { l: "🤫 Ignore", days: 1, d: "Stay above it. Costs a day of holding your team back.", pts: 0, oppPts: 3, target: weakZone.id, opp: 4 },
        { l: "⚔️ Attack Back", days: 3, d: "Dig up their failures.", pts: 3, oppPts: -3, target: "all", opp: -2, appRisk: -2 },
      ]},
      { t: "🎤 Opponent's Rally Outdraws Yours", d: oName + " fills a venue near " + swingZone.key + ". Momentum shifts.", opts: [
        { l: "🏟️ Organize a Bigger One", days: 2, d: "Outdo them. Costs money.", pts: 5, oppPts: -1, dc: .3, target: swingZone.id, your: 6, turnout: 3 },
        { l: "📱 Local Influencer Counter", days: 2, dc: 0.05, d: "Short videos from traders, students, religious youth.", pts: 4, oppPts: 0, target: swingZone.id, your: 4 },
        { l: "😤 Question Their Crowd", days: 1, d: "Claim they rented supporters.", pts: 2, oppPts: 1, target: "all", opp: 2 },
      ]},
      { t: "💀 Smear Campaign Against You", d: "Anonymous flyers spread across " + baseZone.key + ".", opts: [
        { l: "📢 Immediate Press Conference", days: 2, d: "Deny publicly. Show your real plans.", pts: 6, oppPts: -2, target: "all", your: 2, opp: -2 },
        { l: "📋 Signed Market Pledge", days: 3, dc: 0.05, d: "Ward leaders distribute signed commitments.", pts: 5, oppPts: -1, target: baseZone.id, your: 6, opp: -1 },
        { l: "🤷 Let It Die Down", days: 1, d: "Assume voters won't believe it.", pts: 1, oppPts: 4, target: baseZone.id, opp: 5 },
      ]},
      { t: "🤝 Key Endorsement Goes to Opponent", d: "A major traditional ruler endorses " + oName + ".", opts: [
        { l: "📞 Secure Other Endorsements", days: 3, dc: 0.1, d: "Lock down chiefs and community heads.", pts: 4, oppPts: -2, target: "all", your: 2, opp: -2 },
        { l: "💪 People, Not Chiefs", days: 2, d: "Populist angle in youth-heavy LGAs.", pts: 5, oppPts: 0, target: swingZone.id, your: 5 },
        { l: "💰 Visit with Gifts", days: 2, dc: 0.12, d: "Show respect the old way.", pts: 3, oppPts: -1, target: weakZone.id, your: 4, opp: -1, corAdd: .01 },
      ]},
    ];

    const WEEK_DAYS = 6;
    const daysLeft = isOpp ? WEEK_DAYS - sCampDays : WEEK_DAYS;
    const optCost = (opt) => opt.cost || opt.dc || 0;
    const canTake = (opt) => optCost(opt) <= warChest + 1e-9 && (opt.days || 1) <= daysLeft;
    const zoneLabel = (t) => t === "all" || t === undefined ? "All zones" : (activeZones.find(z => z.id === t)?.zone || "").replace(" Senatorial", "") + " zone";

    const handleSC = (opt) => {
      const cost = optCost(opt);
      if (!canTake(opt)) return;
      setWarChest(w => Math.max(0, w - cost));
      setSCampDays(isOpp ? 0 : (opt.days || 1));
      const hm = level === "hard";
      // TOUGHER CAMPAIGNS: opponent gets a per-round bonus always, harsher on hard mode
      const yourPts = hm ? Math.max(opt.pts - 3, -4) : Math.max(opt.pts - 1, -2);
      const oppGain = hm ? (opt.oppPts || 0) + 3 : (opt.oppPts || 0) + 1;
      setSCampScore(cs => cs + yourPts);
      setSCampOpp(co => co + oppGain);
      // Reduce your zone push, boost opponent zone drift; remember what moved each zone
      const moveName = opt.l.replace(/^[^\s]+ /, "");
      setSCampZones(prev => {
        const before = prev || activeZones;
        const after = shiftZones(before, opt.target ?? "all", Math.max(0, (opt.your || 0) - 1), (opt.opp || 0) - 1, opt.turnout || 0);
        return after.map((z, i) => {
          const d = pollShare(z) - pollShare(before[i]);
          return d !== 0 ? { ...z, moves: [...(before[i].moves || []), { w: week, l: moveName, d }] } : z;
        });
      });
      if (opt.corAdd) setGfDebt(d => d + opt.corAdd * 3);
      if (opt.appRisk && Math.random() < (hm ? .75 : .55)) { setSCampScore(cs => cs - 4); setSCampLog(c => [...c, "⚠️ Backfire: the negative campaign cost you support (\u22124)."]); }
      setSCampLog(c => [...c, (isOpp ? "↩️ " : "▶️ ") + "Week " + week + ": " + moveName + " · " + (cost > 0 ? "₦" + cost.toFixed(2) + "B" : "no money") + " · " + (opt.days || 1) + (opt.days === 1 ? " day" : " days") + " · " + zoneLabel(opt.target)]);
      setSCampRound(r => r + 1);
    };
    // Nothing affordable this week: sit it out (costs the remaining days; the opponent gains ground)
    const sitOut = { l: "🪑 Sit this one out", d: "No money or time for anything better. The opponent gains ground everywhere.", days: Math.max(1, daysLeft), pts: 0, oppPts: 3, target: "all", opp: 3 };

    const makeGfEducationMandate = () => {
      const existing = gfMandates.find(m => m.type === "commissioner" && m.ministryId === "educ");
      if (existing) return existing;
      const r = rng(Date.now() + (st?.length || 1) * 191 + Math.round(gfDebt * 1000));
      return {
        id: "gf_edu_" + Date.now(),
        type: "commissioner",
        ministryId: "educ",
        ministryName: "Education",
        name: gN(r, STATES[st]?.zone, st),
        source: "godfather",
        reason: "first-election emergency campaign bailout",
      };
    };

    const addGfMandate = (mandate) => {
      setGfMandates(prev => prev.some(m => m.type === mandate.type && m.ministryId === mandate.ministryId) ? prev : [...prev, mandate]);
    };

    const restartElectionSetup = () => {
      setParty(null); setDepGov(null); setSlogan(null);
      setSCampRound(0); setSCampScore(0); setSCampOpp(0); setSCampLog([]); setSCampZones(null);
      setWarChest(0.8); setGfDebt(0); setGfBorrowed(false); setGfMandates([]); setPreTrib(null);
      setStep(4);
    };

    const borrowFromGF = () => {
      const amount = 0.8; // ₦800M from godfather
      setWarChest(w => w + amount);
      setGfDebt(d => d + amount);
      setGfBorrowed(true);
      setSCampLog(c => [...c, "🎩 GODFATHER: Borrowed ₦" + amount + "B from political godfather. This money comes with strings."]);
    };

    const borrowFromGFWithMandate = () => {
      const amount = 0.6;
      const mandate = makeGfEducationMandate();
      addGfMandate(mandate);
      setWarChest(w => w + amount);
      setGfDebt(d => d + amount);
      setGfBorrowed(true);
      setSCampLog(c => [...c, "🎩 GODFATHER EMERGENCY BAILOUT: Borrowed ₦" + amount + "B. Condition accepted: " + mandate.name + " must become Commissioner for Education when ministries are convened."]);
    };

    if (isResult) {
      const hardMode = level === "hard";
      const partyStrength = PARTIES.find(p => p.id === party)?.strength || 1;
      const oppStrength = oParty?.strength || 1;
      // Campaign efforts sway zone support before final collation
      // Seeded from the campaign itself, so the result does not change when the screen re-renders
      const eDay = rng((st?.length || 5) * 131 + sCampScore * 7 + sCampOpp * 13 + sCampLog.length * 29);
      const swayedZones = activeZones.map(z => {
        // Tougher collation: bigger noise, opponent gets a natural +3 baseline push (party machine)
        const swing = (sCampScore - sCampOpp) * 0.32;
        const jitter = (eDay() - 0.5) * (hardMode ? 10 : 7);
        return { ...z, support: cl100(z.support + swing + jitter - 2), opp: cl100(z.opp - swing * 0.4 + 3 + (eDay() - 0.5) * (hardMode ? 8 : 5)) };
      });
      const collation = lgaElectionSummary(swayedZones, partyStrength, oppStrength, st);
      const won = collation.totalYou > collation.totalOpp && collation.zonesWon >= 2;
      const marginPct = collation.registeredTotal > 0 ? Math.abs(collation.margin) / (collation.totalYou + collation.totalOpp) * 100 : 0;
      const yourTicket = (lastNm || "SURNAME").toUpperCase() + "/" + (depGov?.nm.split(" ").pop() || "DEP").toUpperCase();
      return (
        <div style={{ minHeight: "100%", background: won ? "#f0fff0" : CL.bg, padding: "72px 43px" }}>
          <Flag />
          <div style={{ maxWidth: 984, margin: "58px auto", textAlign: "center" }}>
            <div style={{ fontSize: TS(86), marginBottom: 7 }}>{won ? "🎉" : "😔"}</div>
            <h2 style={{ fontFamily: F.d, color: won ? CL.grn : CL.red, fontSize: TS(58), fontWeight: 700, margin: "7px 0" }}>{won ? "GOVERNOR-ELECT!" : "DEFEATED"}</h2>
            <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.4, marginBottom: 29 }}>{won ? "INEC Returning Officer declares " + nm + " (" + party + ") duly elected — carrying " + collation.zonesWon + " of 3 senatorial zones with a " + marginPct.toFixed(1) + "% margin." : oName + " (" + (oParty?.id || "OPP") + ") wins. You carried only " + collation.zonesWon + "/3 zones. Margin against you: " + marginPct.toFixed(1) + "%."}</p>
            {!won && <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap", marginBottom: 36, padding: "29px", background: "#fff8f0", border: "1px solid " + CL.gold + "55", borderRadius: 17 }}>
              <Bt onClick={() => { setSCampRound(0); setSCampScore(0); setSCampOpp(0); setSCampLog([]); setSCampZones(null); setEnightPlayed({}); setEnightSummary(null); setWarChest(0.8); setGfDebt(0); setGfBorrowed(false); setGfMandates([]); setStep(8); }} style={{ padding: "29px 50px", fontSize: TS(38) }}>😔 Try Again</Bt>
              <Bt onClick={() => {
                const zonesWon = collation.zonesWon;
                const marginPts = Math.round(marginPct * 10) / 10;
                const evBase = Math.max(15, 65 - Math.round(marginPct * 1.6) + zonesWon * 8 + (sCampLog.some(l => l.includes("Polling Unit")) ? 6 : 0));
                setPreTrib({
                  level: 0, spent: 0, groundId: null,
                  oppName: oName, oppPartyId: oParty?.id || "OPP",
                  margin: marginPts, zonesWon,
                  evidence: Math.min(85, evBase),
                  log: ["Petition filed at the " + st.replace("_", " ") + " Governorship Election Tribunal within the 21-day window (S.285(5)). Case: GET/" + Math.floor(Math.random() * 900 + 100) + "/" + new Date().getFullYear() + ".",
                        "Evidence dossier assembled from campaign records — strength assessed at " + Math.min(85, evBase) + "%."]
                });
                setStep(85);
              }} style={{ padding: "29px 50px", fontSize: TS(38), background: CL.gold, color: "#000" }}>⚖️ Petition Tribunal</Bt>
            </div>}
            <Cd style={{ textAlign: "left", marginBottom: 29 }}>
              <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 14, letterSpacing: 2 }}>HOW THE ZONES MOVED</div>
              {(() => { const start = buildBattlegrounds(st, 2026, party, oParty?.id); return collation.rows.map((rw, i) => {
                const s0 = pollShare(start[i] || rw), s1 = pollShare(activeZones[i] || rw);
                const res = rw.yourVotes + rw.oppVotes > 0 ? Math.round(1000 * rw.yourVotes / (rw.yourVotes + rw.oppVotes)) / 10 : 50;
                const moves = (activeZones[i]?.moves || []).filter(m => m.d !== 0);
                return <div key={rw.id} style={{ padding: "14px 0", borderBottom: "1px solid " + CL.bdr + "66" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(33), color: CL.txt }}><b>{rw.zone.replace(" Senatorial", "")}</b><span style={{ fontFamily: F.m, color: rw.won ? CL.grn : CL.red }}>{rw.won ? "Won" : "Lost"}</span></div>
                  <div style={{ fontSize: TS(30), color: CL.tm, fontFamily: F.m, margin: "4px 0" }}>Start {s0}% → final poll {s1}% ({sgnN(s1 - s0)}) → result {res}%</div>
                  {moves.length ? <div style={{ fontSize: TS(28), color: CL.td, lineHeight: 1.35 }}>{moves.map(m => m.l + " " + sgnN(m.d)).join(" · ")}</div>
                    : <div style={{ fontSize: TS(28), color: CL.td }}>You never campaigned here directly.</div>}
                </div>; }); })()}
            </Cd>
            <SceneArt bg="collation-centre" h={TALL() ? 180 : 240} />
            <Cd style={{ textAlign: "left", marginBottom: 36, background: "#fffef7", borderColor: CL.gold + "55" }}>
              <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.grn, fontFamily: F.m, marginBottom: 22, textAlign: "center", letterSpacing: 2 }}>INEC · FORM EC8D · FINAL COLLATED RESULT</div>
              <div style={{ fontSize: TS(34), color: CL.txt, textAlign: "center", marginBottom: 29, borderBottom: "1px solid " + CL.bdr, paddingBottom: 22 }}><b>Governorship Election — {st.replace("_", " ")} State</b><br/>Registered Voters: <b>{fmtVotesFull(collation.registeredTotal)}</b> · Total Cast: <b>{fmtVotesFull(collation.totalYou + collation.totalOpp)}</b></div>
              {collation.rows.map(rw => <div key={rw.id} style={{ padding: "22px 0", borderBottom: "1px solid " + CL.bdr + "66" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(36), color: CL.txt, marginBottom: 7 }}><b>{rw.zone}</b><span style={{ color: rw.won ? CL.grn : CL.red, fontFamily: F.m }}>{rw.won ? party + " ✓" : (oParty?.id || "OPP") + " ✓"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(34), color: CL.tm, fontFamily: F.m }}>
                  <span>{yourTicket}: <b style={{ color: rw.won ? CL.grn : CL.txt }}>{fmtVotesFull(rw.yourVotes)}</b></span>
                  <span>OPP: <b style={{ color: !rw.won ? CL.red : CL.txt }}>{fmtVotesFull(rw.oppVotes)}</b></span>
                </div>
                <div style={{ fontSize: TS(29), color: CL.td, marginTop: 7 }}>Turnout: {rw.turnout}% · {rw.names.length} LGAs: {rw.names.join(", ")}</div>
              </div>)}
              <div style={{ marginTop: 29, padding: "29px 36px", background: (won ? CL.grn : CL.red) + "12", borderRadius: 13, textAlign: "center" }}>
                <div style={{ fontSize: TS(34), color: CL.td, fontFamily: F.m, marginBottom: 7 }}>STATE TOTAL</div>
                <div style={{ fontSize: TS(48), color: CL.txt, fontFamily: F.m, fontWeight: 700 }}>
                  <span style={{ color: won ? CL.grn : CL.txt }}>{yourTicket}: {fmtVotesFull(collation.totalYou)}</span>
                  <span style={{ margin: "0 29px", color: CL.td }}>vs</span>
                  <span style={{ color: !won ? CL.red : CL.txt }}>OPP: {fmtVotesFull(collation.totalOpp)}</span>
                </div>
                <div style={{ fontSize: TS(31), color: CL.tm, marginTop: 7 }}>Margin: {fmtVotesFull(Math.abs(collation.margin))} votes ({marginPct.toFixed(2)}%)</div>
              </div>
            </Cd>
            {won && gfDebt > 0 && <Cd style={{ borderColor: CL.red + "44", marginBottom: 29, textAlign: "left" }}>
              <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.red, fontFamily: F.m, marginBottom: 10 }}>🎩 GODFATHER DEBT: ₦{gfDebt}B</div>
              <div style={{ fontSize: TS(34), color: CL.tm }}>You borrowed ₦{gfDebt}B from your political godfather to fund this campaign. He WILL come collecting. You start governance with +{Math.round(gfDebt * 5)}% corruption and the godfather expects contracts, land, and positions. Refuse him at your peril.</div>
            </Cd>}
            <Cd style={{ textAlign: "left", marginBottom: 36 }}>
              <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 10 }}>CAMPAIGN LOG</div>
              {sCampLog.map((c2, i) => <div key={i} style={{ fontSize: TS(34), color: c2.includes("BACKFIRE") || c2.includes("GODFATHER") ? CL.red : CL.tm, padding: "5px 0" }}>{c2}</div>)}
            </Cd>
            <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 22 }}>Campaign funds remaining: ₦{warChest.toFixed(1)}B</div>
            {won ? <Bt onClick={() => { setSCampRound(0); setStep(9); }} style={{ padding: "43px 113px" }}>PROCEED TO GOVERNMENT HOUSE →</Bt>
              : <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
                  <Bt onClick={() => { setSCampRound(0); setSCampScore(0); setSCampOpp(0); setSCampLog([]); setSCampZones(null); setEnightPlayed({}); setEnightSummary(null); setWarChest(0.8); setGfDebt(0); setGfBorrowed(false); setGfMandates([]); setStep(8); }} style={{ padding: "43px 86px" }}>😔 Try Again</Bt>
                  <Bt onClick={() => {
                    const zonesWon = collation.zonesWon;
                    const marginPts = Math.round(marginPct * 10) / 10;
                    // Evidence strength derived from real campaign context: closer margin + zones carried = better case
                    const evBase = Math.max(15, 65 - Math.round(marginPct * 1.6) + zonesWon * 8 + (sCampLog.some(l => l.includes("Polling Unit")) ? 6 : 0));
                    setPreTrib({
                      level: 0, spent: 0, groundId: null,
                      oppName: oName, oppPartyId: oParty?.id || "OPP",
                      margin: marginPts, zonesWon,
                      evidence: Math.min(85, evBase),
                      log: ["Petition filed at the " + st.replace("_", " ") + " Governorship Election Tribunal within the 21-day window (S.285(5)). Case: GET/" + Math.floor(Math.random() * 900 + 100) + "/" + new Date().getFullYear() + ".",
                            "Evidence dossier assembled from campaign records — strength assessed at " + Math.min(85, evBase) + "%."]
                    });
                    setStep(85);
                  }} style={{ padding: "43px 86px", background: CL.gold, color: "#000" }}>⚖️ Go to Election Tribunal</Bt>
                </div>}
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
        <Flag />
        <div style={{ maxWidth: 948, margin: "72px auto" }}>
          {isOpp ? <Bg text={"Week " + week + " of 4 — the opponent strikes"} color={CL.red} /> : <Bg text={"Week " + week + " of 4 — your move"} color={CL.grn} />}
          <SceneArt bg="rally" who={isOpp ? "rival" : undefined} alt={isOpp ? oName : undefined} h={TALL() ? 170 : 220} />
          <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(65), fontWeight: 600, margin: "22px 0" }}>{isOpp ? (oppEvts[Math.floor(sCampRound / 2)]?.t || "Opponent Moves") : "Pick this week's main move"}</h3>
          {isOpp && <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.4, marginBottom: 22 }}>{oppEvts[Math.floor(sCampRound / 2)]?.d || ""}</p>}
          {!isOpp && <p style={{ color: CL.td, fontSize: TS(36), marginBottom: 22 }}>Ticket: <b style={{ color: CL.grn, letterSpacing: 1 }}>{(lastNm || "YOU").toUpperCase()}/{(depGov?.nm.split(" ").pop() || "DEP").toUpperCase()}</b> ({party}) vs <strong>{oName}</strong> ({oParty?.id || "OPP"}) · Slogan: "{slogan}"</p>}
          {renderZones()}
          <Cd style={{ padding: 22, marginBottom: 18, display: "flex", justifyContent: "space-around", gap: 14, textAlign: "center" }}>
            <div><div style={{ fontSize: TS(44), fontWeight: 700, color: CL.gold, fontFamily: F.m }}>₦{warChest.toFixed(2)}B</div><div style={{ fontSize: TS(27), color: CL.td }}>money left</div></div>
            <div><div style={{ fontSize: TS(44), fontWeight: 700, color: CL.pur, fontFamily: F.m }}>{daysLeft} of {WEEK_DAYS}</div><div style={{ fontSize: TS(27), color: CL.td }}>campaign days left this week</div></div>
          </Cd>
          {!isOpp && warChest < 0.2 && !gfBorrowed && level !== "easy" && <Cd onClick={borrowFromGF} style={{ padding: 22, borderColor: CL.red + "44", marginBottom: 22, textAlign: "center" }}>
            <div style={{ fontSize: TS(36), fontWeight: 600, color: CL.red }}>🎩 Running low? Borrow ₦0.8B from the Godfather</div>
            <div style={{ fontSize: TS(29), color: CL.td }}>He'll fund your campaign — but the debt follows you into office. He WILL demand repayment.</div>
          </Cd>}
          {!isOpp && warChest < 0.09 && gfBorrowed && level !== "easy" && <Cd style={{ padding: 29, borderColor: CL.red + "55", marginBottom: 22, background: "#fff7f2" }}>
            <div style={{ fontSize: TS(36), fontWeight: 800, color: CL.red, textAlign: "center", marginBottom: 14 }}>💸 CAMPAIGN CASH-OUT — DECIDE NOW</div>
            <div style={{ fontSize: TS(31), color: CL.tm, lineHeight: 1.35, textAlign: "center", marginBottom: 22 }}>Your campaign cannot advance on vibes alone. Borrow again with a cabinet condition, withdraw, run unfunded, or restart the election setup.</div>
            <div style={{ display: "grid", gap: 19 }}>
              <Bt onClick={borrowFromGFWithMandate} style={{ background: CL.gold, color: "#000", fontSize: TS(36) }}>🎩 Borrow ₦0.6B — accept Education Commissioner demand</Bt>
              <Bt v="danger" onClick={() => { setSCampRound(8); setSCampScore(sc => sc - 60); setSCampOpp(op => op + 80); setSCampLog(c => [...c, "🏳️ Withdrew after campaign funds collapsed. Party structures moved to the opponent."]); }} style={{ fontSize: TS(36) }}>🏳️ Drop out of the race</Bt>
              <Bt onClick={() => {
                const win = Math.random() < 0.20;
                if (win) {
                  setSCampScore(sc => sc + 100);
                  setSCampLog(c => [...c, "🙏 Ran broke — a volunteer miracle carried market women, youth organisers and ward canvassers without cash."]);
                } else {
                  setSCampOpp(op => op + 100);
                  setSCampLog(c => [...c, "💸 Ran broke — no mobilisation, no agents, no final rally. Opponent swept the collation centres."]);
                }
                setSCampRound(8);
              }} style={{ background: CL.org, fontSize: TS(36) }}>🎲 Run anyway — no funds (80/20 loss)</Bt>
              <Bt v="ghost" onClick={restartElectionSetup} style={{ fontSize: TS(34) }}>↻ Restart from party primaries</Bt>
            </div>
          </Cd>}
          {gfDebt > 0 && <div style={{ fontSize: TS(29), color: CL.red, textAlign: "center", marginBottom: 14 }}>🎩 Godfather debt: ₦{gfDebt}B</div>}
          <div style={{ display: "grid", gap: 22 }}>
            {(() => { const opts = isOpp ? (oppEvts[Math.floor(sCampRound / 2)]?.opts || []) : (mkActs()[Math.floor(sCampRound / 2)] || []); return opts.some(canTake) ? opts : [...opts, sitOut]; })().map((opt, i) => {
              const ok = opt === sitOut || canTake(opt);
              const cost = optCost(opt);
              const why = optCost(opt) > warChest + 1e-9 ? "Not enough money" : (opt.days || 1) > daysLeft ? "Not enough days left" : "";
              return <Cd key={i} onClick={ok ? () => handleSC(opt) : undefined} style={{ padding: 26, opacity: ok ? 1 : .45 }}>
                <div style={{ fontWeight: 600, fontSize: TS(36), color: ok ? CL.txt : CL.td, marginBottom: 6 }}>{opt.l}</div>
                <div style={{ fontSize: TS(32), color: CL.tm, lineHeight: 1.3 }}>{opt.d}</div>
                <div style={{ fontSize: TS(30), color: CL.txt, fontFamily: F.m, marginTop: 10 }}>{cost > 0 ? "₦" + cost.toFixed(2) + "B" : "No money"} · {opt.days || 1} {(opt.days || 1) === 1 ? "day" : "days"} · {zoneLabel(opt.target)}</div>
                {(opt.risk || opt.corAdd || opt.appRisk) && <div style={{ fontSize: TS(28), color: CL.org, marginTop: 6 }}>⚠️ {[opt.risk, opt.corAdd && "Promises to power brokers follow you into office.", opt.appRisk && !opt.risk && "Can backfire."].filter(Boolean).join(" ")}</div>}
                {!ok && <div style={{ fontSize: TS(28), color: CL.red, marginTop: 6 }}>{why}</div>}
              </Cd>;
            })}
            <div style={{ textAlign: "center", marginTop: 29 }}><Bt v="ghost" onClick={restartElectionSetup} style={{ fontSize: TS(34) }}>↻ Restart election setup</Bt></div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 85: PRE-INAUGURATION ELECTION TRIBUNAL (first-election defeat only)
  if (step === 85 && preTrib) {
    const LVLS = [
      { nm: "Governorship Election Tribunal", tag: "S.285(1)(b) · 180 days to judgment", winBonus: 0, appealCost: 0.6 },
      { nm: "Court of Appeal", tag: "S.246(3) · 60 days for appeal ruling", winBonus: 8, appealCost: 1.2 },
      { nm: "Supreme Court", tag: "S.233 · FINAL — no further appeal", winBonus: 15, appealCost: 0 },
    ];
    const GROUNDS = [
      { id: "over_voting", nm: "Over-voting / non-compliance with Electoral Act", desc: "Votes cast exceeded accredited voters in " + (3 - preTrib.zonesWon) + " zones. Independent National Electoral Commission BVAS records disputed.", base: 0.42, req: "Polling unit result sheets (Form EC8A) + BVAS accreditation printouts." },
      { id: "corrupt", nm: "Corrupt practices by respondent", desc: preTrib.oppName + " allegedly distributed cash and inducements at collation centres, contrary to S.121 of the Electoral Act 2022.", base: 0.36, req: "Sworn affidavits from at least 12 polling agents + video/audio evidence." },
      { id: "qual", nm: "Non-qualification of respondent", desc: "Documentary evidence suggests " + preTrib.oppName + " may not have met the constitutional qualification threshold (S.177).", base: 0.30, req: "Certified true copy of certificates + INEC Form EC9." },
      { id: "return", nm: "Return not by majority of lawful votes", desc: "The declared winner did not secure a majority of lawful votes cast — cancelled units affect the outcome.", base: 0.48, req: "Reconciliation of Form EC8B/EC8C across all senatorial zones." },
    ];
    const lvl = LVLS[preTrib.level];
    const gd = GROUNDS.find(g => g.id === preTrib.groundId);

    const runHearing = (mode) => {
      const cost = mode === "self" ? 0.2 : mode === "sans" ? 1.2 : mode === "wig" ? 3.5 : 5;
      if (warChest < cost && mode !== "self") {
        setPreTrib(t => ({ ...t, log: [...t.log, "❌ War chest too thin (₦" + warChest.toFixed(2) + "B) — cannot brief this team."] }));
        return;
      }
      setWarChest(w => Math.max(0, w - cost));
      const modeBonus = mode === "self" ? -0.10 : mode === "sans" ? 0.10 : mode === "wig" ? 0.22 : 0.35;
      const evAdj = (preTrib.evidence - 50) / 200; // -0.175 to +0.175
      const lvlBonus = lvl.winBonus / 100;
      const chance = Math.min(0.9, Math.max(0.05, gd.base + modeBonus + evAdj + lvlBonus));
      const roll = Math.random();
      const won = roll < chance;
      const logLine = (won ? "✅ " : "❌ ") + lvl.nm + " · " + gd.nm.split(" ")[0] + " ground · " + (mode === "self" ? "self-representation" : mode === "sans" ? "Senior Advocate" : mode === "wig" ? "SAN-led team" : "settled panel") + " · rolled " + Math.round(roll * 100) + " vs " + Math.round(chance * 100) + "% needed.";
      const nextLog = [...preTrib.log, logLine];
      if (won) {
        if (preTrib.level >= 2 || (preTrib.level === 0 && chance > 0.7 && roll < 0.25)) {
          // Reinstated
          setPreTrib(t => ({ ...t, log: [...nextLog, "🏛️ Judgment: petition upheld. Return of " + preTrib.oppName + " NULLIFIED. You are declared winner of the election.", "You will be sworn in as Governor."], reinstated: true, spent: t.spent + cost }));
        } else {
          setPreTrib(t => ({ ...t, level: t.level + 1, groundId: null, log: [...nextLog, "You won this round. Respondent files appeal — case escalates to " + LVLS[t.level + 1].nm + "."], spent: t.spent + cost }));
        }
      } else {
        if (preTrib.level >= 2) {
          setPreTrib(t => ({ ...t, log: [...nextLog, "⚖️ Supreme Court dismisses. Under S.285(7) this is FINAL. " + preTrib.oppName + " confirmed as Governor."], dismissed: true, spent: t.spent + cost }));
        } else {
          setPreTrib(t => ({ ...t, level: t.level + 1, groundId: null, log: [...nextLog, "You lost this round. Filed appeal within 21 days — case escalates to " + LVLS[t.level + 1].nm + "."], spent: t.spent + cost }));
        }
      }
    };

    return (
      <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
        <Flag />
        <div style={{ maxWidth: 1164, margin: "72px auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: TS(109) }}>⚖️</div>
            <Bg text={"STAGE " + (preTrib.level + 1) + "/3 · " + lvl.nm} color={CL.gold} />
            <h2 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0 7px", fontSize: TS(72), fontWeight: 700 }}>Election Petition</h2>
            <div style={{ fontSize: TS(34), color: CL.td, fontFamily: F.m }}>{lvl.tag}</div>
            <div style={{ fontSize: TS(36), color: CL.tm, marginTop: 14 }}>Losing margin: <b>{preTrib.margin}%</b> · Zones carried: <b>{preTrib.zonesWon}/3</b> · Evidence strength: <b style={{ color: preTrib.evidence > 55 ? CL.grn : preTrib.evidence > 35 ? CL.org : CL.red }}>{preTrib.evidence}%</b> · War chest: <b>₦{warChest.toFixed(2)}B</b> · Legal spend: ₦{preTrib.spent.toFixed(1)}B</div>
          </div>

          {preTrib.reinstated && (
            <Cd style={{ borderColor: CL.grn, background: "#f0fff0", textAlign: "center", padding: 58 }}>
              <div style={{ fontSize: TS(120) }}>🏛️</div>
              <h3 style={{ color: CL.grn, fontFamily: F.d, fontSize: TS(79), margin: "22px 0" }}>PETITION UPHELD</h3>
              <p style={{ color: CL.txt, fontSize: TS(38), lineHeight: 1.5 }}>The {lvl.nm} has ruled in your favour. The return of {preTrib.oppName} ({preTrib.oppPartyId}) is NULLIFIED and you are declared duly elected Governor of {st.replace("_", " ")} State. INEC will issue your Certificate of Return within 7 days.</p>
              <Bt onClick={() => { setPreTrib(null); setStep(9); }} style={{ padding: "43px 106px", marginTop: 36 }}>🏛️ PROCEED TO GOVERNMENT HOUSE →</Bt>
            </Cd>
          )}

          {preTrib.dismissed && (
            <Cd style={{ borderColor: CL.red, background: "#fff5f5", textAlign: "center", padding: 58 }}>
              <div style={{ fontSize: TS(120) }}>😔</div>
              <h3 style={{ color: CL.red, fontFamily: F.d, fontSize: TS(79), margin: "22px 0" }}>PETITION DISMISSED</h3>
              <p style={{ color: CL.txt, fontSize: TS(38), lineHeight: 1.5 }}>The Supreme Court has dismissed your petition. You spent ₦{preTrib.spent.toFixed(1)}B on legal fees and walk away with nothing but a legacy of a fight taken to the highest court in the land.</p>
              <Bt onClick={() => { setPreTrib(null); setSCampRound(0); setSCampScore(0); setSCampOpp(0); setSCampLog([]); setSCampZones(null); setEnightPlayed({}); setEnightSummary(null); setWarChest(0.8); setGfDebt(0); setGfBorrowed(false); setGfMandates([]); setStep(8); }} style={{ padding: "43px 106px", marginTop: 36 }}>😔 Try Again</Bt>
            </Cd>
          )}

          {!preTrib.reinstated && !preTrib.dismissed && !preTrib.groundId && (
            <Cd style={{ borderColor: CL.gold + "77" }}>
              <div style={{ fontSize: TS(36), color: CL.tm, marginBottom: 22 }}>Your legal team recommends one ground of petition. Pick carefully — you cannot change it at this level.</div>
              <div style={{ display: "grid", gap: 19 }}>
                {GROUNDS.map(g => <Cd key={g.id} onClick={() => setPreTrib(t => ({ ...t, groundId: g.id }))} style={{ padding: 29, cursor: "pointer" }}>
                  <div style={{ fontWeight: 700, fontSize: TS(38), color: CL.txt }}>{g.nm}</div>
                  <div style={{ fontSize: TS(34), color: CL.td, margin: "10px 0", lineHeight: 1.4 }}>{g.desc}</div>
                  <div style={{ fontSize: TS(34), color: CL.org, lineHeight: 1.4 }}><b>Evidence burden:</b> {g.req}</div>
                  <Bg text={"Base success: " + Math.round(g.base * 100) + "%"} color={g.base > .45 ? CL.grn : g.base > .35 ? CL.org : CL.red} />
                </Cd>)}
              </div>
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <Bt v="ghost" onClick={() => { setPreTrib(null); setSCampRound(0); setSCampScore(0); setSCampOpp(0); setSCampLog([]); setSCampZones(null); setEnightPlayed({}); setEnightSummary(null); setWarChest(0.8); setGfDebt(0); setGfBorrowed(false); setGfMandates([]); setStep(8); }} style={{ fontSize: TS(34) }}>🏳️ Withdraw and try new campaign</Bt>
              </div>
            </Cd>
          )}

          {!preTrib.reinstated && !preTrib.dismissed && preTrib.groundId && (
            <Cd style={{ borderColor: CL.gold + "77" }}>
              <div style={{ background: CL.gold + "12", border: "1px solid " + CL.gold + "44", borderRadius: 8, padding: "22px 29px", marginBottom: 29, fontSize: TS(36), color: CL.tm }}>
                <b>Pleading:</b> {gd.nm}<br/><i style={{ fontSize: TS(34), color: CL.td }}>{gd.desc}</i>
              </div>
              <div style={{ fontSize: TS(36), color: CL.tm, marginBottom: 22 }}>How do you fight this?</div>
              <div style={{ display: "grid", gap: 19 }}>
                <Bt onClick={() => runHearing("self")}>👨🏾‍💼 Argue in person · ₦0.2B · weaker odds (-10%)</Bt>
                <Bt onClick={() => runHearing("sans")} style={{ background: CL.pur }}>📚 Brief a Senior Advocate · ₦1.2B · +10% odds</Bt>
                <Bt onClick={() => runHearing("wig")} style={{ background: CL.grn }}>🎓 SAN-led team of 5 wigs · ₦3.5B · +22% odds</Bt>
                {warChest >= 5 && <Bt onClick={() => runHearing("bribe")} style={{ background: CL.red }}>💼 "Settle" the panel · ₦5B · +35% odds · risky corruption</Bt>}
                {warChest < 1.2 && gfDebt < 5 && <Bt onClick={() => {
                  const amt = 2;
                  const mandate = makeGfEducationMandate();
                  addGfMandate(mandate);
                  setWarChest(w => w + amt);
                  setGfDebt(d => d + amt);
                  setPreTrib(t => ({ ...t, log: [...t.log, "🎩 Godfather wired ₦" + amt + "B for the petition. Debt now ₦" + (gfDebt + amt).toFixed(1) + "B. Condition accepted: " + mandate.name + " must be Commissioner for Education once ministries are convened."] }));
                }} style={{ background: CL.gold, color: "#000" }}>🎩 Borrow ₦2B from Godfather · Education Commissioner condition</Bt>}
                <Bt v="ghost" onClick={() => { setPreTrib(null); setSCampRound(0); setSCampScore(0); setSCampOpp(0); setSCampLog([]); setSCampZones(null); setEnightPlayed({}); setEnightSummary(null); setWarChest(0.8); setGfDebt(0); setGfBorrowed(false); setGfMandates([]); setStep(8); }}>🏳️ Withdraw petition — accept defeat</Bt>
              </div>
            </Cd>
          )}

          <Cd style={{ marginTop: 36, background: "#f9f5ee" }}>
            <div style={{ fontSize: TS(29), fontWeight: 700, color: CL.td, fontFamily: F.m, letterSpacing: 2, marginBottom: 10 }}>CASE LOG</div>
            {preTrib.log.map((l, i) => <div key={i} style={{ fontSize: TS(34), color: l.includes("✅") || l.includes("upheld") ? CL.grn : l.includes("❌") || l.includes("dismiss") ? CL.red : CL.tm, padding: "7px 0" }}>{l}</div>)}
          </Cd>
        </div>
      </div>
    );
  }

  if (step === 9) {
    const partyFav = depCands.reduce((best, c) => c.lo > (best?.lo || 0) ? c : best, depCands[0]);
    const accepted = depGov?.nm === partyFav.nm;
    const startingStab = accepted ? 75 : 65 - (depGov?.lo < 40 ? 15 : depGov?.lo < 60 ? 12 : 8);
    if (!anchorsShown) {
      const stNm = (st || "").replace("_", " ");
      const pt = PARTIES.find(p => p.id === party);
      const anchorLines = [
        { who: "m", t: "Good evening. You're watching the State House Report, live from " + stNm + " State — and it's official: we have a new Governor-elect." },
        { who: "f", t: "That's right, Tunde. INEC has returned " + (nm || "the candidate") + " of the " + (pt?.id || "party") + " as duly elected Governor of " + stNm + " State" + (slogan ? ", after a campaign fought on the slogan ‘" + slogan + "’." : ".") },
        { who: "m", t: (FLAGSHIP[agenda] ? "The Governor-elect has promised to make " + FLAGSHIP[agenda].nm + " the centrepiece: to " + FLAGSHIP[agenda].goal + ". " : "") + "Now the hard part begins. Empty treasury, restless unions, and a godfather who remembers every favour." },
        { who: "f", t: "The swearing-in is done, the convoy is moving. Governor, Government House is waiting for you." },
      ];
      return <AnchorDesk lines={anchorLines} onDone={() => setAnchorsShown(true)} />;
    }
    return (
      <div style={{ minHeight: "100%", background: "linear-gradient(180deg,#f0f5e8,#fafdf7)", padding: "72px 43px" }}>
        <Flag />
        <div style={{ maxWidth: 912, margin: "120px auto", textAlign: "center" }}>
          <SceneArt bg="government-house" h={TALL() ? 220 : 300} />
          <h2 style={{ fontFamily: F.d, color: CL.grn, fontSize: TS(94), fontWeight: 700, margin: "0 0 36px" }}>Welcome to Government House</h2>
          <AdvBubble text={ADV.govHouse(nm, st, saName, FLAGSHIP[agenda])} saName={saName} />
          <div style={{ marginTop: 58 }}>
              <Bt onClick={() => onDone({ nm: nm.trim(), firstNm: firstNm.trim(), lastNm: lastNm.trim(), party, state: st, depGov, avatar, agenda, slogan, saName, partyAccepted: accepted, startingStab, gfDebt, gfMandates, level, warChestRemaining: warChest })} style={{ padding: "50px 127px", fontSize: TS(53) }}>
              BEGIN YOUR TENURE →
            </Bt>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ─── HOUSE OF ASSEMBLY VOTE ───
// ─── BILLS YOU CAN SPONSOR ───
const BILLS = [
  { id: "land_reform", nm: "Land Reform Bill", d: "Streamline Certificate of Occupancy process. Reduces corruption in land allocation.", fx: { corM: -.04, app: 4 }, sk: { business: 8, traditional: -6 }, cost: 0 },
  { id: "edu_compulsory", nm: "Compulsory Education Bill", d: "Make 9 years of education mandatory with penalties for non-compliance.", fx: { lit: .03, app: 3 }, sk: { religious: -4, youth: 8 }, cost: 0.5 },
  { id: "fiscal_resp", nm: "Fiscal Responsibility Bill", d: "Cap state borrowing at 50% of IGR. Forces discipline.", fx: { corM: -.03, app: 2 }, sk: { business: 6, party: -5 }, cost: 0 },
  { id: "market_mod", nm: "Market Modernization Bill", d: "Regulate and upgrade state markets with trader protections.", fx: { app: 5 }, sk: { business: 10, unions: 5 }, cost: 1.5 },
  { id: "env_protect", nm: "Environmental Protection Bill", d: "Create state environmental agency with enforcement powers.", fx: { hp: .02, app: 3 }, sk: { business: -5, youth: 6 }, cost: 0.5 },
  { id: "youth_employ", nm: "Youth Employment Bill", d: "Mandate state agencies to reserve 30% of new positions for under-35s.", fx: { app: 6 }, sk: { youth: 12, unions: -4 }, cost: 1 },
];

// ─── JUDICIARY EVENTS ───
const JUDICIARY_EVENTS = [
  { id: "budget_challenge", nm: "Budget Legality Challenge", d: "Opposition files suit claiming your budget process violated S.121. Court may order a review.", trigger: "forced_budget" },
  { id: "land_suit", nm: "Land Allocation Lawsuit", d: "A group of displaced farmers sues over land given to contractors without proper compensation.", trigger: "high_corruption" },
  { id: "policy_injunction", nm: "Policy Injunction", d: "A court injunction halts one of your active policies pending judicial review.", trigger: "random" },
  { id: "election_petition", nm: "Election Petition", d: "Opposition challenges your re-election in the Election Tribunal.", trigger: "reelection" },
];

const HouseVote = ({ pStab, bud, level, onPass, onAmend, onForce, addL }) => {
  const [voted, setVoted] = useState(false);
  const [result, setResult] = useState(null);
  const [reasons, setReasons] = useState([]);

  const bs = Object.values(bud).reduce((a, b) => a + b, 0);
  const denom = bs || 100;
  const salPct = (bud.salaries || 0) / denom * 100;
  const debtPct = (bud.debt || 0) / denom * 100;
  const eduPct = (bud.education || 0) / denom * 100;
  const secPct = (bud.security || 0) / denom * 100;
  const healthPct = (bud.health || 0) / denom * 100;
  const adminPct = (bud.administration || 0) / denom * 100;

  // Build specific, fixable concerns. The House no longer blocks by random
  // dice-roll: only constitutional/fiscal red flags reject the bill.
  const concerns = [];
  if (bs !== 100) concerns.push({ t: "Appropriation schedule totals " + bs + "% instead of 100% — clerks cannot lay an unbalanced bill.", severity: "high", fix: "Return to Budget and make the total exactly 100%." });
  if (salPct < 14) concerns.push({ t: "Salaries are only " + salPct.toFixed(0) + "% — civil service arrears and NLC strike risk are too obvious for members to defend.", severity: "high", fix: "Raise Salaries to at least 18%." });
  else if (salPct < 18) concerns.push({ t: "Salaries at " + salPct.toFixed(0) + "% will pass, but labour caucus wants a clearer wage buffer.", severity: "medium", fix: "18–22% is politically safer." });
  if (eduPct < 6) concerns.push({ t: "Education is collapsed to " + eduPct.toFixed(0) + "% — teacher unions and parents will punish every member who votes yes.", severity: "high", fix: "Raise Education to at least 12%." });
  else if (eduPct < 10) concerns.push({ t: "Education at " + eduPct.toFixed(0) + "% is thin; House will demand SUBEB line-items.", severity: "medium", fix: "10–18% is defensible." });
  if (healthPct < 5) concerns.push({ t: "Health is only " + healthPct.toFixed(0) + "% — PHCs will run out of drugs before the next quarter.", severity: "high", fix: "Raise Health to at least 10%." });
  else if (healthPct < 8) concerns.push({ t: "Health at " + healthPct.toFixed(0) + "% is below a safe service floor.", severity: "medium", fix: "8–18% is defensible." });
  if (secPct < 5) concerns.push({ t: "Security vote below " + secPct.toFixed(0) + "% leaves the state exposed; even opposition members fear kidnappings.", severity: "high", fix: "Raise Security to at least 8%." });
  else if (secPct > 22) concerns.push({ t: "Security vote at " + secPct.toFixed(0) + "% is too opaque — Speaker demands line-item disclosure before approval.", severity: "high", fix: "Cut Security below 20% or publish a sub-vote schedule." });
  else if (secPct > 16) concerns.push({ t: "Security vote at " + secPct.toFixed(0) + "% will pass with uncomfortable questions about receipts.", severity: "medium", fix: "Keep Security near 8–14% unless insecurity is severe." });
  if (adminPct > 18) concerns.push({ t: "Government House/admin overhead is " + adminPct.toFixed(0) + "% — members see padding, convoys and foreign trips.", severity: "high", fix: "Trim Administration to 10% or less." });
  else if (adminPct > 12) concerns.push({ t: "Administration at " + adminPct.toFixed(0) + "% will pass, but the press will call it wasteful.", severity: "medium", fix: "5–10% is safer." });
  if (debtPct < 3 && debtPct > 0) concerns.push({ t: "Debt service is light; contractors may keep lobbying members over unpaid certificates.", severity: "low", fix: "5–12% keeps creditors quieter." });
  if (pStab < 25) concerns.push({ t: "Party stability is " + Math.round(pStab) + "% — your own caucus can no longer guarantee quorum for an appropriation vote.", severity: "high", fix: "Repair party relations or negotiate with the Speaker." });
  else if (pStab < 40) concerns.push({ t: "Party stability is " + Math.round(pStab) + "% — the bill can pass, but only with observations and political bruising.", severity: "medium", fix: "Meet the caucus before the next bill." });

  const hardBlockers = concerns.filter(c => c.severity === "high");
  const statusLabel = hardBlockers.length ? "BLOCKED: " + hardBlockers.length + " fatal defect" + (hardBlockers.length === 1 ? "" : "s") : concerns.length ? "WILL PASS WITH OBSERVATIONS" : "WILL PASS CLEANLY";
  const statusColor = hardBlockers.length ? CL.red : concerns.length ? CL.org : CL.grn;
  const cleanDraft = { salaries: 18, debt: 8, administration: 7, health: 15, education: 15, security: 11, infrastructure: 16, agriculture: 10 };

  const doVote = () => {
    const passed = hardBlockers.length === 0;
    if (!passed) {
      setReasons(hardBlockers);
      addL && addL("❌ House rejects Appropriation Bill: " + hardBlockers.map(r => r.t.split(" — ")[0]).slice(0, 2).join("; "), "political");
    } else if (concerns.length) {
      addL && addL("✅ Appropriation Bill passed with House observations: " + concerns[0].t, "policy");
    }
    setResult(passed ? "pass" : "reject");
    setVoted(true);
  };

  if (!voted) return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: TS(98), marginBottom: 22 }}>🏛️</div>
      <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(65), fontWeight: 600, margin: "0 0 14px" }}>House of Assembly</h3>
      <p style={{ color: CL.td, fontSize: TS(36), marginBottom: 29 }}>Your Appropriation Bill must be approved by the House (S.121).</p>
      {concerns.length > 0 && (
        <div style={{ textAlign: "left", margin: "0 auto 36px", maxWidth: 732, padding: 29, background: CL.org + "08", borderRadius: 13, border: "1px solid " + CL.org + "25" }}>
          <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.org, marginBottom: 14 }}>⚠️ HOUSE CONCERNS (may cause rejection):</div>
          {concerns.map((c, i) => (
            <div key={i} style={{ fontSize: TS(34), color: c.severity === "high" ? CL.red : c.severity === "medium" ? CL.org : CL.tm, padding: "7px 0" }}>• {c.t}</div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 29, justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
        <Bg text={"Party: " + Math.round(pStab) + "%"} color={pStab > 50 ? CL.grn : CL.red} />
        <Bg text={statusLabel} color={statusColor} />
      </div>
      <Bt onClick={doVote}>🗳️ CALL THE VOTE</Bt>
    </div>
  );

  if (result === "pass") return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: TS(98), marginBottom: 22 }}>✅</div>
      <h3 style={{ fontFamily: F.d, color: CL.grn, fontSize: TS(65), fontWeight: 600, margin: "0 0 14px" }}>APPROPRIATION BILL PASSED</h3>
      <p style={{ color: CL.tm, fontSize: TS(36), marginBottom: 43 }}>The House of Assembly has approved your budget.</p>
      <Bt onClick={onPass}>PROCEED TO POLICIES →</Bt>
    </div>
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: TS(98), marginBottom: 22 }}>❌</div>
      <h3 style={{ fontFamily: F.d, color: CL.red, fontSize: TS(65), fontWeight: 600, margin: "0 0 14px" }}>BILL REJECTED</h3>
      <div style={{ textAlign: "left", margin: "29px auto 43px", maxWidth: 732, padding: 29, background: CL.red + "08", borderRadius: 13, border: "1px solid " + CL.red + "25" }}>
        <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.red, marginBottom: 14 }}>REASONS FOR REJECTION:</div>
        {reasons.map((r2, i) => (
          <div key={i} style={{ fontSize: TS(34), color: CL.red, padding: "7px 0" }}>• {r2.t}</div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 29, maxWidth: 768, margin: "0 auto" }}>
        <Cd onClick={() => onAmend(2, cleanDraft)} style={{ padding: 36 }}>
          <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt, marginBottom: 7 }}>🔄 Adopt Clean Draft & Resubmit</div>
          <div style={{ fontSize: TS(34), color: CL.td }}>Applies a safe 100% appropriation profile that fixes the listed blockers. -2 party stability.</div>
        </Cd>
        <Cd onClick={onForce} style={{ padding: 36, borderColor: CL.red + "44" }}>
          <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.red, marginBottom: 7 }}>⚠️ Force Through (Executive Order)</div>
          <div style={{ fontSize: TS(34), color: CL.td }}>Unconstitutional. -15 party, -5 approval. May trigger judicial challenge.</div>
        </Cd>
      </div>
    </div>
  );
};

// ─── GOVERNANCE ───
const GovScreen = ({ setup: rawSetup, onEnd, onHelp, loadedSave }) => {
  const setup = rawSetup && rawSetup.state && STATES[rawSetup.state] ? rawSetup : null;
  if (!setup) {
    return (
      <div style={{ minHeight: "100%", background: CL.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 58 }}>
        <Cd style={{ maxWidth: 876, textAlign: "center", padding: 65, borderColor: CL.red + "66" }}>
          <div style={{ fontSize: TS(102), marginBottom: 29 }}>⚠️</div>
          <h2 style={{ fontFamily: F.d, color: CL.red, fontSize: TS(72), margin: "0 0 29px" }}>Tenure could not load</h2>
          <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 43 }}>The election handoff produced an incomplete state record. Return to the title screen and start a clean run instead of seeing a blank page.</p>
          <Bt onClick={() => onEnd("restart")} style={{ padding: "38px 79px" }}>RETURN TO TITLE</Bt>
        </Cd>
      </div>
    );
  }
  const { nm: pName, party, state, depGov, partyAccepted, startingStab } = setup;
  const sd = STATES[state];
  const MT = 8;
  const ld = loadedSave; // shorthand
  const [turn, setTurn] = useState(ld?.turn || 1);
  const campaignGfDebt = setup?.gfDebt || 0;
  const [s, setS] = useState(() => ld?.s || ({ lit: sd.lit, hp: sd.hp, infra: sd.infra, sec: sd.sec, agr: sd.agr, igr: sd.igr, faac: sd.faac, cor: .30 + campaignGfDebt * .05, app: 55, debt: campaignGfDebt * .5, pStab: startingStab || 65,
    econ: Object.fromEntries(Object.entries(sd.econ).map(([k, v]) => [k, { out: v.out, jobs: v.jobs }])),
    gdp: Object.values(sd.econ).reduce((sum, v) => sum + v.out * sd.pop * 2, 0),
    totalJobs: Object.values(sd.econ).reduce((sum, v) => sum + v.jobs, 0),
  }));
  const [cab, setCab] = useState(() => ld?.cab || genCab(state, 42, sd.zone));
  const [ps, setPS] = useState(() => ld?.ps || genPS(state.length * 55, sd.zone, state));
  const [csReformsDone, setCSReformsDone] = useState(ld?.csReformsDone || []);
  const [fgRelation, setFgRelation] = useState(ld?.fgRelation || 50);
  const [curFgEvent, setCurFgEvent] = useState(null);
  const [fgEventsSeen, setFgEventsSeen] = useState(ld?.fgEventsSeen || []);
  const [curShock, setCurShock] = useState(null);
  const [shocksSeen, setShocksSeen] = useState(ld?.shocksSeen || []);
  const [eventResult, setEventResult] = useState(null);
  const [curCourt, setCurCourt] = useState(null);
  const [courtStage, setCourtStage] = useState(0); // 0=high court, 1=appeal, 2=supreme
  const [courtsSeen, setCourtsSeen] = useState(ld?.courtsSeen || []);
  const [nicPending, setNicPending] = useState(ld?.nicPending || null);
  const [narrative, setNarrative] = useState(ld?.narrative || "survivor");
  const [delayedFx, setDelayedFx] = useState(ld?.delayedFx || []); // [{turn, fx, desc}]
  const [hiddenThreats, setHiddenThreats] = useState(ld?.hiddenThreats || []); // [{id, ministry, severity, desc, turn}]
  const [hiddenRevealed, setHiddenRevealed] = useState(ld?.hiddenRevealed || []);
  const [bud, setBud] = useState(ld?.bud || { education: 15, health: 12, infrastructure: 18, security: 12, agriculture: 10, administration: 8, salaries: 18, debt: 7 });
  const [pol, setPol] = useState(ld?.pol || []);
  const [logs, setLogs] = useState(ld?.logs || []);
  const [phase, setPhase] = useState(ld ? "budget" : "budget");
  const [nav, setNav] = useState("gov");
  const navMemory = React.useRef({}); // last sub-tab opened on each screen
  const [menuOpen, setMenuOpen] = useState(false); // phone ☰ menu
  const [sosOpen, setSosOpen] = useState(false);   // phone "State of the state" sheet
  const [budOpen, setBudOpen] = useState(null);    // phone: budget sector whose details are open

  /* Visual mode follows where the player is standing:
     - public: media, campaign, the crowd, the anchors
     - admin:  the desk — budget, ministries, projects, the register
     - private: the back room — godfather, adviser, the ledger */
  const MODE_BY_PHASE = { media: "public", anchor: "public", election: "public", campaign: "public", godfather: "private", adviser: "private", ledger: "private", dilemma: "private", scandal: "private" };
  const MODE_BY_NAV = { news: "public", media: "public", budget: "admin", projects: "admin", ministries: "admin", economy: "admin", civil: "admin", gov: "admin", wiki: "admin", godfather: "private", log: "public" };
  useMode(MODE_BY_PHASE[phase] || MODE_BY_NAV[nav] || "admin");

  const [appH, setAppH] = useState(ld?.appH || [55]);
  const [pApp, setPApp] = useState(() => ld?.pApp || Object.fromEntries(PERSONAS.map(p => [p.id, 50])));
  const [skApp, setSkApp] = useState(() => {
    if (ld?.skApp) return ld.skApp;
    const base = Object.fromEntries(STAKEHOLDERS.map(x => [x.id, x.b]));
    if (!partyAccepted) { base.party = 35; }
    else { base.party = 65; }
    return base;
  });
  const [curD, setCurD] = useState(null);
  const [capProj, setCapProj] = useState(null); // capital project procurement/EIA gate
  const [corW, setCorW] = useState(ld?.corW || 0);
  const [nCris, setNCris] = useState(ld?.nCris || 0);
  const [nRef, setNRef] = useState(ld?.nRef || 0);
  const [impSurv, setImpSurv] = useState(ld?.impSurv || false);
  const [flagUsed, setFlagUsed] = useState(ld?.flagUsed || false);
  const [billsPassed, setBillsPassed] = useState(ld?.billsPassed || []);
  const [judEvent, setJudEvent] = useState(null);
  const [forcedBudget, setForcedBudget] = useState(ld?.forcedBudget || false);
  const [abujaVisited, setAbujaVisited] = useState(ld?.abujaVisited || false);
  const [netherlandsVisited, setNetherlandsVisited] = useState(ld?.netherlandsVisited || false);
  const [weddingVisited, setWeddingVisited] = useState(ld?.weddingVisited || false);
  const [intlInvites, setIntlInvites] = useState(ld?.intlInvites || []);
  const [curInvite, setCurInvite] = useState(null);
  const [completedProjects, setCompletedProjects] = useState(ld?.completedProjects || []);
  const stateGF = STATE_GODFATHERS[state] || { power: 60, aggression: 50, loyalty_demand: 60 };
  const [godfatherPower, setGodfatherPower] = useState(ld?.godfatherPower || stateGF.power);
  const [godfatherRel, setGodfatherRel] = useState(ld?.godfatherRel || 50);
  const [godfatherDemand, setGodfatherDemand] = useState(null);
  const [godfatherSeen, setGodfatherSeen] = useState(ld?.godfatherSeen || []);
  const [curInvestor, setCurInvestor] = useState(null);
  const [investorsSeen, setInvestorsSeen] = useState(ld?.investorsSeen || []);
  const [investorsApproved, setInvestorsApproved] = useState(ld?.investorsApproved || []);
  const [curMedia, setCurMedia] = useState(null);
  const [mdaEnv, setMdaEnv] = useState(null); // { list, idx, decisions, speakerAsk }
  const [tribunal, setTribunal] = useState(null); // { level, groundId, cost, spent, log, oppName, oppPartyId, margin }
  const [mediaSeen, setMediaSeen] = useState(ld?.mediaSeen || []);
  const [campRound, setCampRound] = useState(0);
  const [campScore, setCampScore] = useState(0);
  const [campOpp, setCampOpp] = useState(0);
  const [campLog, setCampLog] = useState([]);
  const [campZones, setCampZones] = useState(null);
  const [campDays, setCampDays] = useState(0); // days spent on this week's main move
  const [campWarChest, setCampWarChest] = useState(1.0);
  const [personalFund, setPersonalFund] = useState(ld?.personalFund || (setup?.warChestRemaining || 0)); // carries over from first campaign
  const [campGfDebt, setCampGfDebt] = useState(0);
  const [campGfBorrowed, setCampGfBorrowed] = useState(false);
  const [houseBillsSeen, setHouseBillsSeen] = useState(ld?.houseBillsSeen || []);
  const [pendingHouseBill, setPendingHouseBill] = useState(null);
  const [showWiki, setShowWiki] = useState(false);
  const [headline, setHeadline] = useState(null);
  const [achPopup, setAchPopup] = useState(null);
  const [gEnd, setGEnd] = useState(ld?.gEnd || null);
  // ── REALISM MODULE state (ministries, projects, procurement, council, wiki, SA) ──
  const [ministries, setMinistries] = useState(ld?.ministries || null);
  const [projects, setProjects] = useState(ld?.projects || []);
  const [procLog, setProcLog] = useState(ld?.procLog || []);
  const [council, setCouncil] = useState(ld?.council || null);
  const [wikiEvents, setWikiEvents] = useState(ld?.wikiEvents || []);
  const [nepotismCount, setNepotismCount] = useState(ld?.nepotismCount || 0);
  const [pendingProc, setPendingProc] = useState(null); // procurement decision modal
  const [saMemory, setSaMemory] = useState(ld?.saMemory || []);
  const [saOffice, setSaOffice] = useState(() => ld?.saOffice || { adviser: SA_ROSTER.find(a => a.name === setup?.saName) || SA_ROSTER[0], firedTurn: -99, history: [] });
  const [saPickerOpen, setSaPickerOpen] = useState(false);
  // The cast (see makeCast). Saves from before the cast get one built now.
  const [cast, setCast] = useState(() => {
    const c = ld?.cast || makeCast(setup, state, sd?.zone);
    return { ...c, godfather: { ...c.godfather, title: gfPersona(STATE_GODFATHERS[state]).title } };
  });
  const castRef = React.useRef(cast);
  castRef.current = cast;
  // The Special Adviser seat follows whoever holds the office.
  useEffect(() => {
    const a = saOffice.adviser;
    if (a && a.name !== cast.adviser.name) setCast(c => ({ ...c, adviser: { ...c.adviser, name: a.name, title: a.title || c.adviser.title } }));
  }, [saOffice.adviser]);
  useEffect(() => {
    window.SOP_CAST = {
      get: (id) => castRef.current[id] || null,
      all: () => Object.values(castRef.current),
      // Everything on the record about this person.
      history: (id) => {
        const c = castRef.current[id];
        if (!c || !window.SOP_LEDGER) return [];
        return window.SOP_LEDGER.all().filter(e => e.target === c.name || (e.meta && e.meta.cast === id));
      },
    };
  }, []);
  const [ledgerVersion, setLedgerVersion] = useState(0);

  useEffect(() => { window.SOP = window.SOP || {}; window.SOP._bumpLedgerVersion = () => setLedgerVersion(v => v + 1); }, []);
  // Phase 2 §1 — Re-election night. Same overlay, same ledger consumer, different flag.
  const [reEnightPlayed, setReEnightPlayed] = useState(false);
  useEffect(() => {
    if (phase !== "campaign_election") return;
    if (campRound >= 8 && !reEnightPlayed && state && window.SOP && window.SOP.playElectionNight) {
      const oppR = rng((state?.length || 5) * 91 + 33);
      const oNm = "Hon. " + gN(oppR, STATES[state]?.zone, state);
      const oPt = PARTIES.filter(p => p.id !== party)[Math.floor(oppR() * (PARTIES.length - 1))];
      let done = false;
      const finish = (summary) => { if (done) return; done = true; setReEnightPlayed(true); try { window.SOP.__lastReEnight = summary; } catch(e){} };
      try {
        window.SOP.playElectionNight({
          state, playerName: pName, partyId: party,
          oppName: oNm, oppPartyId: oPt?.id || "OPP",
          cashRemaining: campWarChest, year: new Date().getFullYear(),
        }, finish);
      } catch(e) { console.error("[reEnight] overlay failed", e); finish(null); }
      // Safety timer — never let a broken overlay strand the campaign flow.
      setTimeout(() => finish(null), 45000);
    }
  }, [campRound, reEnightPlayed, state, phase]);

  // Bridge to the sop-*.js modules. Updated in place: modules attach their
  // own fields and functions to this object, and replacing it on every
  // render wiped them.
  useEffect(() => {
    window.SOP = Object.assign(window.SOP || {}, {
      React, useState, useEffect,
      pName, party, state, sd, setup, turn, s, setS,
      cab: (ministries && ministries.length ? Object.fromEntries(ministries.map(m => [m.id, { nm: m.minister, co: m.perf, lo: m.loyalty || 55, cr: m.cor, pu: m.perf, role: m.id, bio: "Commissioner for " + m.name }])) : cab), setCab, ps, setPS,
      bud, setBud, logs, addL,
      skApp, setSkApp, pApp, setPApp,
      ministries, setMinistries, projects, setProjects, procLog, setProcLog,
      council, setCouncil, wikiEvents, setWikiEvents, nepotismCount, setNepotismCount,
      pendingProc, setPendingProc, saMemory, setSaMemory, saOffice, setSaOffice, personalFund, setPersonalFund,
      phase, nav, pol,
      SNAMES: window.SNAMES_PATCHED || null, CL: window.CL_REF || null, F: window.F_REF || null,
      ledger: window.SOP_LEDGER ? window.SOP_LEDGER.all() : [],
      ledgerAppend: (entry) => (window.SOP_LEDGER ? window.SOP_LEDGER.append(entry) : null),
      gEnd, setTurn,
      federalAlignment: fgRelation > 65,
      desk: desk.current,
      memory: window.SOP_MEMORY || null,
      cast: window.SOP_CAST || null,
    });
    window.dispatchEvent(new CustomEvent('sop-state', { detail: { turn, phase, nav } }));
  });


  // ── SAVE / LOAD ──
  // One snapshot builder used by BOTH the manual save and the autosave, so the
  // two can never drift apart again. `phase` is whatever the player is actually
  // on — the old autosave hardcoded "budget", which dumped every reload onto
  // the appropriation screen regardless of where the player left off.
  const buildSnapshot = () => {
    let ledger = null, civic = null, politics = null;
    try { ledger = window.SOP_LEDGER?.serialize ? window.SOP_LEDGER.serialize() : null; } catch (e) {}
    try { civic = window.SOP_CIVIC?.getCorruption ? window.SOP_CIVIC.getCorruption() : null; } catch (e) {}
    try { politics = window.SOP_POLITICS?.serialize ? window.SOP_POLITICS.serialize() : null; } catch (e) {}
    return {
      sv: SAVE_VERSION, savedAt: Date.now(), ledger, civic, politics,
      turn, s, cab, ps, csReformsDone, fgRelation, fgEventsSeen, shocksSeen, courtsSeen, nicPending,
      narrative, delayedFx, hiddenThreats, hiddenRevealed, personalFund, bud, pol, logs, phase, nav,
      appH, pApp, skApp, corW, nCris, nRef, impSurv, flagUsed, billsPassed, forcedBudget,
      abujaVisited, netherlandsVisited, weddingVisited, intlInvites, completedProjects,
      houseBillsSeen, investorsSeen, investorsApproved, godfatherSeen, mediaSeen,
      ministries, projects, procLog, council, wikiEvents, nepotismCount, saMemory, saOffice, gEnd, setup,
      cast,
    };
  };
  const saveGame = async () => {
    try {
      await window.storage.set("sop_save", JSON.stringify(buildSnapshot()));
      addL("💾 Game saved.", "info");
    } catch (e) { console.error("Save failed", e); }
  };

  // Auto-save every turn change
  useEffect(() => { try { window.storage?.set("sop_save", JSON.stringify(buildSnapshot())); } catch(e) {} }, [turn]);

  const tb = Math.max(0, s.igr + s.faac - s.debt * .08);
  const bs = Object.values(bud).reduce((a, b) => a + b, 0);
  const termNum = turn <= 4 ? 1 : 2;
  const termTurn = turn <= 4 ? turn : turn - 4;
  const yr = (termNum === 1 ? "1st Term" : "2nd Term") + " — Year " + Math.ceil(termTurn / 2) + ", " + (termTurn % 2 === 1 ? "H1" : "H2");
  const addL = (tx, tp = "info") => { setLogs(p => [{ t: turn, tx, tp }, ...p].slice(0, 40)); try { window.SOP && (window.SOP._lastLog = { t: turn, tx, tp }); window.dispatchEvent(new CustomEvent('sop-log', { detail: { t: turn, tx, tp } })); } catch(e){} };
  const goTab = (k) => setNav(k);
  const fireAdviser = () => {
    if (!saOffice.adviser) { setSaPickerOpen(true); return; }
    if (!window.confirm("Fire " + saOffice.adviser.name + "? You'll pick a replacement immediately from the reserve list.")) return;
    setSaOffice(o => ({ adviser: null, firedTurn: turn, history: [{ name: o.adviser.name, fired: turn }, ...(o.history || [])] }));
    setSaPickerOpen(true);
    addL("🔥 " + saOffice.adviser.name + " removed as Special Adviser. Pick a replacement from the reserve.", "warn");
  };
  const appointAdviser = (a) => {
    setSaOffice(o => ({ ...o, adviser: a }));
    setSaPickerOpen(false);
    addL("🎓 " + a.name + " sworn in as Special Adviser (" + a.title + ").", "info");
  };


  const getSABrief = () => {
    if (!saOffice.adviser) return { urgent: true, icon: "🪑", title: "SA desk vacant — appoint a replacement", body: "Executive Command needs a Special Adviser. Open the reserve list and swear in a new SA before the next crisis lands.", actionLabel: "Pick SA", action: () => setSaPickerOpen(true) };
    const awaitingContract = (projects || []).find(p => p && (p.status === "awarded_pending" || p.status === "eia_done" || p.status === "bidding") && !p.contractor);
    if (awaitingContract || pendingProc) return { urgent: true, icon: "📝", title: "Award a contractor for " + ((pendingProc?.title) || awaitingContract?.title || "a pending project"), body: "Procurement is stalled at contractor selection. Open the project, review bidders, and award — sole-source is fast but leaks treasury and lands on your Wikipedia.", actionLabel: "Open Projects", action: () => goTab("prj") };

    if (!ministries || ministries.length === 0) return { urgent: true, icon: "🏛️", title: "Convene your ministries first", body: "Executive Command rule: no cabinet, no execution. Create at least Finance, Works, Health and Security before serious governance begins.", actionLabel: "Open Ministries", action: () => goTab("min") };
    if (ministries.length < 4) return { urgent: true, icon: "🏛️", title: "Your cabinet is under-strength", body: "You have " + ministries.length + " ministr" + (ministries.length === 1 ? "y" : "ies") + ". The House, contractors and crises will overpower a thin Exco.", actionLabel: "Add Ministries", action: () => goTab("min") };
    if (!council) return { urgent: true, icon: "👑", title: "Convene the Traditional Rulers Council", body: "Rural turnout, land disputes and security intelligence run through the palaces. Meet them before your next big project or campaign push.", actionLabel: "Open Council", action: () => goTab("coun") };
    if (bs !== 100) return { urgent: true, icon: "💰", title: "Balance the Appropriation Bill", body: "The House will not approve a budget that does not add to 100%. Every unbalanced draft delays salaries, projects and political goodwill.", actionLabel: "Fix Budget", action: () => goTab("gov") };
    if ((projects || []).length === 0) return { urgent: false, icon: "🏗️", title: "Start a visible flagship project", body: "Pick one project and push it through need assessment, EIA where needed, bidding and award. Voters remember delivered sites, not speeches.", actionLabel: "Open Projects", action: () => goTab("prj") };
    const risky = (projects || []).find(p => p.status === "suspended" || p.status === "abandoned" || (p.status === "in_progress" && (p.progress || 0) < 25 && turn - (p.startTurn || turn) > 1));
    if (risky) return { urgent: true, icon: "🚧", title: "Unblock " + (risky.title || risky.name || "a stalled project"), body: "A stalled site becomes an opposition billboard. Visit, terminate, audit or renegotiate before it enters your Wikipedia controversies.", actionLabel: "Open Projects", action: () => goTab("prj") };
    if (s.cor > .45) return { urgent: true, icon: "🧾", title: "Publish an audit before EFCC does", body: "Corruption above 45% compounds through contracts, cabinet loyalty, press attacks and tribunal credibility.", actionLabel: "Open Wiki Bio", action: () => goTab("bio") };
    if (s.app < 40) return { urgent: true, icon: "📉", title: "Approval crisis: deliver something now", body: "Below 40% approval, the House blocks bills because members fear losing their seats with you.", actionLabel: "Open Projects", action: () => goTab("prj") };
    return { urgent: false, icon: "📥", title: "Inbox clear enough to sponsor a bill", body: "Quiet quarters are for agenda-setting: table a reform bill, strengthen procurement, or prepare for the next shock.", actionLabel: "Open Govern", action: () => goTab("gov") };
  };

  const saBrief = getSABrief();
  const saInbox = [
    { label: "Cabinet", done: !!(ministries && ministries.length >= 4), urgent: !(ministries && ministries.length >= 4), detail: ministries && ministries.length ? ministries.length + " ministries convened" : "No ministries convened", action: () => goTab("min") },
    { label: "Traditional Council", done: !!council, urgent: !!(ministries && ministries.length >= 4 && !council), detail: council ? "Palace channel active" : "Rural legitimacy not yet secured", action: () => goTab("coun") },
    { label: "Budget", done: bs === 100, urgent: bs !== 100, detail: bs === 100 ? "Appropriation balances" : "Allocated " + bs + "% — House will query it", action: () => goTab("gov") },
    { label: "Projects", done: (projects || []).some(p => p.status === "delivered" || p.status === "in_progress"), urgent: false, detail: (projects || []).length + " project file" + ((projects || []).length === 1 ? "" : "s"), action: () => goTab("prj") },
  ];
  // Proactive SA push — never miss an update. Toasts whenever the brief title
  // changes AND it's urgent, or on every new turn if urgent. The SA is now
  // the linchpin: they surface the next move to you, you don't hunt for it.
  const lastBriefRef = React.useRef({ title: "", turn: -1 });
  useEffect(() => {
    if (!saBrief || !saOffice.adviser) return;
    const titleChanged = lastBriefRef.current.title !== saBrief.title;
    const turnChanged = lastBriefRef.current.turn !== turn;
    if (saBrief.urgent && (titleChanged || turnChanged)) {
      const msg = "SA " + (saOffice.adviser.name.split(" ").slice(-1)[0]) + ": " + saBrief.icon + " " + saBrief.title;
      try { window.SOP_V2_toast ? window.SOP_V2_toast(msg, "warn") : addL(msg, "warn"); } catch (e) { addL(msg, "warn"); }
    }
    lastBriefRef.current = { title: saBrief.title, turn };
  }, [saBrief.title, turn, saOffice.adviser]);

  // Dashboard bridge: listen for nav commands from the React shell
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "sop-nav" && typeof d.payload === "string") {
        setNav(d.payload);
        try { window.scrollTo({ top: 1, behavior: "smooth" }); } catch(_) {}
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Dashboard bridge: emit state snapshots to the React shell
  useEffect(() => {
    const cleanBrief = saBrief ? { title: saBrief.title, body: saBrief.body, urgent: saBrief.urgent, icon: saBrief.icon } : null;
    const payload = {
      turn,
      phase,
      nav,
      setup: {
        state,
        party: party?.id,
        nm: pName,
        depGov,
        agenda: typeof setup?.agenda === "object" ? setup?.agenda?.id : setup?.agenda,
        avatar: setup?.avatar,
        level: setup?.level,
      },
      s,
      bud,
      cab,
      logs: logs.slice(-20).map(e => `[T${e.t}] ${e.tx}`),
      news: headline
        ? [{ outlet: "State Times", headline, tone: "neutral" }]
        : logs.slice(-5).reverse().map(e => ({ outlet: "State House", headline: e.tx, tone: e.tp })),
      completedProjects,
      godfatherRel,
      godfatherPower,
      gfDebt: setup?.gfDebt ?? 0,
      tribunal,
      curCourt,
      sa: saOffice.adviser ? { name: saOffice.adviser.name, title: saOffice.adviser.title, avatar: saOffice.adviser.avatar, brief: cleanBrief } : null,
    };
    try {
      window.parent.postMessage({ type: "sop-state", payload }, "*");
    } catch (e) {
      // If serialization fails, silently skip this snapshot.
    }
  }, [turn, phase, nav, state, party, pName, depGov, setup, s, bud, cab, logs, headline, completedProjects, godfatherRel, godfatherPower, tribunal, curCourt, saOffice.adviser, saBrief]);
  const enactP = (p) => { if (pol.find(a => a.id === p.id)) return; setPol(pp => [...pp, { ...p, tl: p.t }]); setS(pr => ({ ...pr, debt: pr.debt + p.c })); addL("📋 " + p.nm + " enacted", "policy"); try { setWikiEvents(w => [{ turn, section: "Governorship", txt: "Launched " + p.nm + " (₦" + p.c.toFixed(1) + "B) as part of the flagship agenda — projected " + p.t + "-turn delivery window." }, ...w]); } catch(e){} if (p.id === "anti_cor" || p.id === "digi_gov") setNRef(r => r + 1);
    // TIME DELAY: some policies have delayed payoffs
    if (p.s === "education") setDelayedFx(d => [...d, { turn: turn + 3, fx: { lit: .03, app: 5 }, desc: p.nm + " is showing results — literacy rising, schools improving." }]);
    if (p.s === "health") setDelayedFx(d => [...d, { turn: turn + 2, fx: { hp: .02, app: 3 }, desc: p.nm + " impact: health outcomes improving across the state." }]);
    if (p.s === "agriculture") setDelayedFx(d => [...d, { turn: turn + 2, fx: { agr: .03, igr: 0.5 }, desc: p.nm + " paying off — harvest yields up, farm revenue flowing." }]);
  };
  // ── CAPITAL PROJECT LIFECYCLE ──
  // Routes ALL capital builds through the shared sop-realism flow so the user
  // (a) names the project, (b) picks a ministry, (c) commissions/waives EIA,
  // and then (d) selects a contractor from the real bidder pool. The resulting
  // proj lives in `projects[]` so it appears in the Projects tab, the sop-v2
  // Projects sheet, and gets Wikipedia entries at each stage.
  const CAPITAL_IDS = new Set(["roads","mega_airport","mega_hospital","housing","rail","ind_park","tech_hub","uni","rural_elec","water","irrigation","phc"]);
  const isCapital = (p) => CAPITAL_IDS.has(p.id) || (p.nm||"").startsWith("⭐") || (p.t >= 3);
  const POLICY_TYPE = { roads:"road", mega_airport:"industrial", mega_hospital:"hospital", housing:"housing", rail:"road", ind_park:"industrial", tech_hub:"industrial", uni:"school", rural_elec:"power", water:"water", irrigation:"dam", phc:"hospital" };
  const EIA_TYPES = new Set(["road","bridge","dam","market","housing","hospital","landfill","power","industrial"]);
  const startPolicy = (p) => {
    if (pol.find(a => a.id === p.id)) return;
    if (!isCapital(p)) return enactP(p);
    const type = POLICY_TYPE[p.id] || "road";
    const defaultMin = (ministries && ministries[0]) ? ministries[0].id : null;
    setCapProj({ p, title: p.nm.replace(/^⭐\s*/, ""), type, ministryId: defaultMin, eia: EIA_TYPES.has(type) });
  };
  const confirmCapital = () => {
    if (!capProj) return;
    const { p, title, type, ministryId, eia } = capProj;
    if (!title || !title.trim()) { alert("Give the project a name — e.g. 'Ikeja–Agege 4-lane arterial road'."); return; }
    if (!ministries || !ministries.length) { alert("You haven't convened any ministries yet. Open Cabinet → Convene Ministry first."); return; }
    if (!ministryId) { alert("Assign a supervising ministry."); return; }
    const min = ministries.find(m => m.id === ministryId);
    const proj = {
      id: "p_" + Date.now(),
      title, type, ministryId,
      baseCost: p.c,
      needsEIA: EIA_TYPES.has(type),
      eiaDone: eia,
      status: "pending_procurement",
      progress: 0,
      events: [],
      _srcPolicy: p,
    };
    setProjects(prev => [ ...(prev || []), proj ]);
    // Mirror into enacted policies so the built-in policy list shows it as taken.
    setPol(pp => [...pp, { ...p, pending: true, projectId: proj.id }]);
    addL("🏗️ PROJECT INITIATED: " + title + " under " + (min?.name || "state ministry") + ". Proceed to bidder selection.", "policy");
    try { setWikiEvents(w => [{ turn, section: "Governorship", txt: "Initiated " + title + " under " + (min?.name || "a state ministry") + ", estimated at ₦" + (+p.c).toFixed(1) + "B" + (proj.needsEIA ? (eia ? " after commissioning an EIA." : ", despite requiring an EIA.") : ".") }, ...w]); } catch(e){}
    // Hand off to the shared procurement modal in sop-realism.js — user picks a contractor next.
    setPendingProc(proj);
    setCapProj(null);
  };

  const [constChallenge, setConstChallenge] = useState(null);
  const tryU = (u) => {
    addL("⚠️ EXECUTIVE ORDER: Governor attempts to " + u.nm + "!", "political");
    setConstChallenge(u);
    setPhase("const_challenge");
  };

  const [constRuling, setConstRuling] = useState(null);

  const resolveConst = (dispute) => {
    if (dispute) {
      setS(p => ({ ...p, app: cl100(p.app - 8), pStab: cl100(p.pStab - 10) }));
      setSkApp(p => ({ ...p, media: cl100((p.media || 50) - 10), youth: cl100((p.youth || 50) - 8) }));
      addL("⚖️ SUPREME COURT STRIKES DOWN: " + constChallenge.nm + ". Governor humiliated. " + constChallenge.r, "judicial");
      setConstRuling(constChallenge);
      setConstChallenge(null);
      setPhase("const_ruling");
    } else {
      setS(p => ({ ...p, app: cl100(p.app - 2) }));
      addL("🔄 Governor reverses unconstitutional order: " + constChallenge.nm + ". Rule of law upheld.", "judicial");
      setConstChallenge(null);
      setPhase("policy");
    }
  };
  const fireCom = (k) => { const r = rng(Date.now()); const z = sd.zone; const oldName = cab[k]?.nm; setCab(p => ({ ...p, [k]: { nm: gN(r, z, setup?.state), co: ri(35, 92, r), lo: ri(25, 90, r), cr: ri(5, 55, r), pu: ri(25, 85, r), role: k, bio: genBio(r) } })); setS(p => ({ ...p, app: cl100(p.app - 3) })); addL("🔄 Fired " + (CROLES.find(c => c.k === k)?.t || "") + " (-3)", "political"); try { window.SOPX_onDecision && window.SOPX_onDecision("minister_sacked", { name: oldName || "the commissioner", ministerId: k }); } catch(e){} try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"minister_fired", target: oldName || "commissioner", gravity:2, evidence:2, approvalDelta:-3, note:"Fired "+(CROLES.find(c=>c.k===k)?.t||"commissioner"), meta:{ ministerId:k, godfather:false }}); } catch(e){} };

  // Bill sponsorship — goes through House vote
  const sponsorBill = (bill) => {
    if (billsPassed.find(b => b.id === bill.id)) return;
    const objections = [];
    if (s.pStab < 25) objections.push("party stability is " + Math.round(s.pStab) + "% — your caucus cannot guarantee quorum");
    if ((bill.cost || 0) > 0 && s.debt > 18) objections.push("debt is already " + naira(s.debt) + " — members refuse another unfunded mandate");
    if (bill.id === "fiscal_resp" && s.debt > 20) objections.push("borrowing is already above the fiscal ceiling the bill tries to impose");
    if (objections.length) {
      addL("❌ House REJECTS " + bill.nm + ": " + objections.join("; ") + ".", "political");
      setS(p => ({ ...p, pStab: cl100(p.pStab - 3) }));
      return;
    }
    setBillsPassed(p => [...p, bill]);
    setS(p => ({ ...p, debt: p.debt + (bill.cost || 0) }));
    Object.entries(bill.fx || {}).forEach(([k, v]) => {
      setS(p => { const n = { ...p }; if (k === "app") n.app = cl100(n.app + v); else if (k === "corM") n.cor = cl(n.cor + v); else if (k === "lit") n.lit = cl(n.lit + v); else if (k === "hp") n.hp = cl(n.hp + v); return n; });
    });
    setSkApp(p => { const n = { ...p }; Object.entries(bill.sk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
    const note = s.pStab < 40 ? " after tense caucus horse-trading" : "";
    addL("📜 BILL SIGNED: " + bill.nm + " passed by House" + note + " and signed into law.", "policy");
  };

  // Judiciary — can trigger after certain actions
  const checkJudiciary = () => {
    const r = rng(turn * 333 + Date.now() % 5000);
    if (forcedBudget && r() < .4) {
      setJudEvent({ ...JUDICIARY_EVENTS[0], penalty: { pStab: -8, app: -3 } });
      return true;
    }
    if (s.cor > .4 && r() < .3) {
      setJudEvent({ ...JUDICIARY_EVENTS[1], penalty: { corM: -.02, app: -4 } });
      return true;
    }
    if (pol.length > 2 && r() < .15) {
      const target = pol[Math.floor(r() * pol.length)];
      setJudEvent({ ...JUDICIARY_EVENTS[2], penalty: { app: -2 }, target: target?.nm });
      return true;
    }
    return false;
  };

  const resolveJudiciary = (mode) => {
    // mode: true = comply, false = defy, "fasttrack" = pay lawyers, "appeal" = delay
    const applyPenalty = (mul = 1) => {
      if (judEvent && judEvent.penalty) {
        setS(p => {
          const n = { ...p };
          if (judEvent.penalty.pStab) n.pStab = cl100(n.pStab + judEvent.penalty.pStab * mul);
          if (judEvent.penalty.app) n.app = cl100(n.app + judEvent.penalty.app * mul);
          if (judEvent.penalty.corM) n.cor = cl(n.cor + judEvent.penalty.corM * mul);
          return n;
        });
      }
    };
    if (mode === true) {
      applyPenalty(1);
      if (judEvent.target) setPol(pp => pp.filter(p => p.nm !== judEvent.target));
      setSkApp(p => ({ ...p, media: cl100((p.media || 50) + 5) }));
      addL("⚖️ COURT RULING: Complied swiftly with " + judEvent.nm + ". Media and civil society applaud rule of law.", "judicial");
      try { window.SOPX_onDecision && window.SOPX_onDecision("court_complied", { ruling: judEvent.nm }); } catch(e){}
      try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"court_compliance", target: judEvent.nm, gravity:1, evidence:3, note:"Complied with ruling: "+judEvent.nm }); } catch(e){}
    } else if (mode === "fasttrack") {
      setS(p => ({ ...p, debt: p.debt + 0.5 }));
      const win = Math.random() < 0.6;
      if (win) {
        addL("⚖️ FAST-TRACK WIN: Court of Appeal ruled in your favour on " + judEvent.nm + ". Case dismissed. ₦0.5B in legal fees.", "judicial");
        setSkApp(p => ({ ...p, business: cl100((p.business || 50) + 3) }));
      } else {
        applyPenalty(2);
        addL("⚖️ FAST-TRACK LOSS: Court of Appeal upheld the ruling on " + judEvent.nm + ". Penalty doubled. ₦0.5B wasted.", "judicial");
      }
    } else if (mode === "appeal") {
      setS(p => ({ ...p, app: cl100(p.app - 3) }));
      // re-queue for next turn
      const pending = { ...judEvent, appealed: true };
      setTimeout(() => setJudEvent(pending), 100);
      addL("⏳ APPEAL FILED: Delayed judgment on " + judEvent.nm + ". Civil society mobilising. Case returns next turn.", "judicial");
    } else {
      setS(p => ({ ...p, pStab: cl100(p.pStab - 12), app: cl100(p.app - 5), cor: cl(p.cor + 0.05) }));
      setSkApp(p => ({ ...p, media: cl100((p.media || 50) - 10) }));
      addL("⚠️ CONTEMPT: Defied court ruling on " + judEvent.nm + ". Constitutional crisis unfolding.", "judicial");
      try { window.SOPX_onDecision && window.SOPX_onDecision("court_defied", { ruling: judEvent.nm }); } catch(e){}
      try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"court_defiance", target: judEvent.nm, gravity:5, evidence:5, approvalDelta:-5, corruptionDelta:+5, note:"Defied court ruling: "+judEvent.nm }); } catch(e){}
    }
    setJudEvent(null);
    nextEvent();
  };

  const dChoice = (ch) => {
    setNCris(c => c + 1);
    setS(p => { let n = { ...p }; Object.entries(ch.fx || {}).forEach(([k, v]) => { if (k === "app") n.app = cl100(n.app + v); else if (k === "corM") n.cor = cl(n.cor + v); else if (n[k] !== undefined) n[k] = cl(n[k] + v); }); if (ch.dc) n.debt += ch.dc; return n; });
    setSkApp(p => { const n = { ...p }; Object.entries(ch.sk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
    addL("⚖️ " + curD.nm + " → " + ch.l, "dilemma");
    const effects = [];
    if (ch.fx?.app) effects.push({ icon: ch.fx.app > 0 ? "📈" : "📉", text: "Approval " + (ch.fx.app > 0 ? "rises" : "drops"), value: (ch.fx.app > 0 ? "+" : "") + ch.fx.app + "%", good: ch.fx.app > 0, bad: ch.fx.app < 0 });
    if (ch.fx?.sec) effects.push({ icon: "🛡️", text: "Security " + (ch.fx.sec > 0 ? "improved" : "weakened"), value: (ch.fx.sec > 0 ? "+" : "") + Math.round(ch.fx.sec * 100) + "%", good: ch.fx.sec > 0, bad: ch.fx.sec < 0 });
    if (ch.fx?.hp) effects.push({ icon: "🏥", text: "Health " + (ch.fx.hp > 0 ? "improved" : "worsened"), value: (ch.fx.hp > 0 ? "+" : "") + Math.round(ch.fx.hp * 100) + "%", good: ch.fx.hp > 0, bad: ch.fx.hp < 0 });
    if (ch.fx?.corM) effects.push({ icon: ch.fx.corM < 0 ? "✨" : "💀", text: "Corruption " + (ch.fx.corM < 0 ? "reduced" : "increased"), value: Math.round(Math.abs(ch.fx.corM) * 100) + "%", good: ch.fx.corM < 0, bad: ch.fx.corM > 0 });
    if (ch.dc) effects.push({ icon: "💰", text: "State debt increased", value: "+₦" + ch.dc + "B", bad: true });
    Object.entries(ch.sk || {}).forEach(([k, v]) => { effects.push({ icon: v > 0 ? "👥" : "⚠️", text: k.charAt(0).toUpperCase() + k.slice(1) + " stakeholders " + (v > 0 ? "pleased" : "angry"), value: (v > 0 ? "+" : "") + v, good: v > 0, bad: v < 0 }); });
    // NIC trigger — sacking workers triggers National Industrial Court
    if (ch.nicTrigger) {
      effects.push({ icon: "⚖️", text: "NATIONAL INDUSTRIAL COURT will be triggered", value: "S.254C", bad: true });
      effects.push({ icon: "⚠️", text: "Court ruling next turn — you'll have to choose: comply or defy", bad: true });
      setNicPending({ turn: turn + 1, type: curD.id === "asuu" ? "lecturers" : "workers", desc: curD.id === "asuu" ? "State university lecturers challenged mass sacking at the National Industrial Court. The court has ruled the sackings unlawful under the Trade Disputes Act and ordered reinstatement with full arrears." : "Government workers challenged mass sacking at the National Industrial Court. The court ruled the sackings violated the Labour Act and ordered reinstatement with payment of all arrears." });
      addL("⚠️ SA " + (cast.adviser.name) + ": \"Your Excellency, the " + (curD.id === "asuu" ? "Academic Staff Union" : "labour unions") + " will file at the National Industrial Court immediately. Under S.254C of the Constitution, the NIC has EXCLUSIVE jurisdiction. You CANNOT avoid this court.\"", "crisis");
    }
    const nm = curD.nm; setCurD(null);
    showResult({ icon: "⚖️", title: nm + " — Resolved", narrative: ch.rk || "Your decision has been implemented. The consequences will ripple through your state.", effects, tone: (ch.fx?.app || 0) >= 0 ? "good" : "bad", nextFn: () => nextEvent() });
  };
  const useFlagship = () => { if (flagUsed) return; setFlagUsed(true); setS(p => ({ ...p, app: cl100(p.app + 15) })); addL("🚀 FLAGSHIP! +15 approval", "flagship"); };

  // Show result screen before continuing to next event
  // Accepts: { icon, title, narrative, effects: [{icon, text, value, good, bad}], tone, nextFn }
  const showResult = (cfg) => {
    setEventResult(cfg);
    setPhase("event_result");
  };

  const advance = () => {
    // After turn 4: re-election
    if (turn === 4 && phase !== "reelection") { setPhase("reelection"); return; }
    // After turn 8: tenure complete
    if (turn >= MT) { setGEnd("complete"); return; }
    // Party collapse triggers impeachment only if approval also low (House needs justification)
    if (s.pStab < 20 && s.app < 50) { setPhase("impeach"); addL("⚠️ Party stability collapsed AND approval low! House of Assembly moves to impeach.", "crisis"); return; }
    setTurn(t => t + 1);
    // From turn 2 onward, ministries submit inflated envelopes before you draft the Appropriation Bill
    const envList = MDA_ENVELOPES.map(e => ({ ...e, ask: e.ask + Math.floor((Math.random() - .3) * 4) })).sort(() => Math.random() - .5).slice(0, 4);
    const speakerAsk = Math.round(1 + Math.random() * 2.5 * 10) / 10; // ₦1B–₦3.5B
    setMdaEnv({ list: envList, idx: 0, decisions: [], speakerAsk, speakerHandled: false });
    setPhase("mda");
  };
  const handleImp = (surv) => {
    // Fight chance scales with approval — high approval = almost guaranteed survival
    const fightChance = s.app > 70 ? 0.95 : s.app > 50 ? 0.8 : s.app > 40 ? 0.65 : 0.5;
    const won = Math.random() < fightChance;
    if (surv && won) {
      setImpSurv(true);
      setS(p => ({ ...p, app: cl100(p.app + 5), pStab: cl100(p.pStab + 15) })); // Boost pStab so it doesn't re-trigger
      addL("🛡️ Survived impeachment! Public rallied. Party stability restored.", "political");
      advance();
    } else {
      setGEnd("impeached");
    }
  };

  const endTurn = () => {
    setS(prev => {
      let n = { ...prev }; const bf = tb / 100;
      const sm = { education: "lit", health: "hp", infrastructure: "infra", security: "sec", agriculture: "agr" };
      Object.entries(sm).forEach(([sec, stat]) => { const pa = (bud[sec] || 0) / bs; const m2 = (ministries || []).find(m => m.key === stat || (sec === "administration" && !m.key)); const cb = m2 ? (m2.perf / 100 * .5 + .5) : .65; n[stat] = cl(n[stat] + pa * .025 * bf * cb); });
      // ── FLAGSHIP AGENDA EFFECTS (real, per-turn) ──
      const AG = setup?.agenda;
      const agMap = { education: "lit", health: "hp", infrastructure: "infra", security: "sec", agriculture: "agr" };
      if (agMap[AG]) n[agMap[AG]] = cl(n[agMap[AG]] + 0.012); // +50% relative to base ~0.025 mid
      if (AG === "anticorruption") { n.cor = cl(n.cor - 0.008); }
      if (AG === "women") { n.hp = cl(n.hp + 0.006); n.lit = cl(n.lit + 0.006); }
      if (AG === "technology") { n.lit = cl(n.lit + 0.006); n.igr = (n.igr || 0) + 0.4; }
      if (AG === "housing" && (n.igr - n.debt * 0.08) > 5) { n.app = cl100(n.app + 3); n.infra = cl(n.infra + 0.008); }
      if (AG === "agriculture") { n.igr = (n.igr || 0) + 0.3; }
      if (AG === "youth" && (bud.education || 0) / bs < .12) { n.app = cl100(n.app - 1); }
      if ((bud.salaries || 0) / bs < .12) { n.app = cl100(n.app - 8); addL("⚠️ Salary arrears! Workers unpaid.", "crisis"); }

      // ── ECONOMIC PRODUCTION ENGINE ──
      // Each sector's output is influenced by governance stats and budget allocation
      const econ = n.econ ? { ...n.econ } : {};
      const secDrivers = {
        agriculture: { stat: n.agr, budPct: (bud.agriculture || 0) / bs, secFactor: n.hp * .2 + n.infra * .3 },
        manufacturing: { stat: n.infra, budPct: (bud.infrastructure || 0) / bs, secFactor: n.lit * .3 + n.sec * .2 },
        services: { stat: n.lit, budPct: (bud.education || 0) / bs, secFactor: n.infra * .2 + n.sec * .2 },
        oil: { stat: n.sec, budPct: 0, secFactor: n.infra * .3 },
        mining: { stat: n.infra, budPct: 0, secFactor: n.sec * .3 + n.lit * .1 },
        trade: { stat: n.infra, budPct: 0, secFactor: n.sec * .2 + n.lit * .2 },
        tourism: { stat: n.sec, budPct: 0, secFactor: n.infra * .3 + n.hp * .1 },
        tech: { stat: n.lit, budPct: (bud.education || 0) / bs * .3, secFactor: n.infra * .3 },
      };

      let totalGDP = 0;
      let totalJobs = 0;
      let computedIGR = 0;
      const secTaxRates = sd.econ;

      Object.entries(secDrivers).forEach(([sec, drv]) => {
        if (!econ[sec]) return;
        const oldOut = econ[sec].out || 0;
        // Output grows based on budget allocation + governance stats + security stability
        const growth = (drv.stat * .01 + drv.budPct * .015 + drv.secFactor * .005) * (1 - n.cor * .5);
        // Corruption drags down all sectors. Insecurity kills investment.
        const drag = n.cor * .005 + (1 - n.sec) * .003;
        const newOut = cl(oldOut + growth - drag, 0, 1);
        econ[sec] = { ...econ[sec], out: newOut };

        // GDP contribution
        const sectorGDP = newOut * sd.pop * 2; // ₦B
        totalGDP += sectorGDP;

        // Jobs
        const baseJobs = secTaxRates[sec]?.jobs || 0;
        const sectorJobs = Math.round(baseJobs * newOut);
        econ[sec].jobs = sectorJobs;
        totalJobs += sectorJobs;

        // Tax revenue → IGR
        const taxRate = secTaxRates[sec]?.tax || .05;
        computedIGR += sectorGDP * taxRate;
      });

      n.econ = econ;
      n.gdp = totalGDP;
      n.totalJobs = totalJobs;

      // IGR is now derived from economic output (with a floor of 1.5B so states don't instantly bankrupt)
      const newIGR = Math.max(1.5, computedIGR);
      // Blend: 70% computed from economy, 30% from previous (smoothing)
      n.igr = n.igr * .3 + newIGR * .7;
      const activeMinistries = ministries && ministries.length ? ministries : [];
      const ac = activeMinistries.length ? activeMinistries.reduce((s2, m) => s2 + (m.cor || 0), 0) / activeMinistries.length : 30; n.cor = cl(n.cor + (ac - 30) * .001);
      // ── CIVIL SERVICE EFFECT ──
      // Permanent secretaries affect sector performance and corruption
      const avgPSEff = Object.values(ps).reduce((s2, p) => s2 + p.eff, 0) / Object.values(ps).length;
      const avgPSCor = Object.values(ps).reduce((s2, p) => s2 + p.cor, 0) / Object.values(ps).length;
      // PS efficiency boosts sector gains, PS corruption adds to state corruption
      Object.entries(sm).forEach(([sec, stat]) => {
        const matchPS = Object.values(ps).find(p2 => PS_ROLES.find(r => r.k === p2.role)?.s === sec);
        if (matchPS) n[stat] = cl(n[stat] + (matchPS.eff - 50) * .0003); // efficient PS boosts, inefficient drags
      });
      n.cor = cl(n.cor + (avgPSCor - 30) * .0005); // corrupt civil service adds to state corruption

      const completed = [];
      setPol(pp => pp.map(p => {
        let newTl = p.tl - 1;
        // CORRUPTION DELAY: civil service corruption + state corruption combined
        const delayChance = (n.cor * .3 + avgPSCor / 100 * .2);
        if (delayChance > .25 && p.cr > 0 && Math.random() < delayChance) {
          newTl = p.tl;
          const culprit = avgPSCor > 40 ? " Permanent secretary's office is the bottleneck." : " Contractor issues.";
          addL("🚧 PROJECT DELAYED: " + p.nm + " stalled." + culprit + " (corruption: " + Math.round(n.cor * 100) + "%, PS efficiency: " + Math.round(avgPSEff) + "%)", "crisis");
          try { window.SOPX_onDecision && window.SOPX_onDecision("project_abandoned", { project: p.nm, zone: sd?.zone }); } catch(e){}
        }
        return { ...p, tl: newTl };
      }).filter(p => { if (p.tl <= 0) { completed.push(p); return false; } return true; }));
      completed.forEach(p => {
        Object.entries(p.fx).forEach(([k, v]) => { if (k === "app") n.app = cl100(n.app + v); else if (k === "corM") n.cor = cl(n.cor + v); else if (n[k] !== undefined) n[k] = cl(n[k] + v); });
        const desc = p.compDesc || p.nm + " fully implemented";
        // Economic sector boost on completion
        if (p.ecoSec && n.econ?.[p.ecoSec]) {
          n.econ[p.ecoSec] = { ...n.econ[p.ecoSec], out: cl(n.econ[p.ecoSec].out + (p.ecoBoost || .03)), jobs: (n.econ[p.ecoSec].jobs || 0) + (p.jobsAdd || 0) };
          n.totalJobs = (n.totalJobs || 0) + (p.jobsAdd || 0);
        }
        setCompletedProjects(cp => [...cp, { nm: p.nm, desc, turn: turn, cost: p.c, jobs: p.jobsAdd || 0, sector: p.ecoSec }]);
        addL("✅ PROJECT COMPLETE: " + p.nm + " — " + desc + (p.jobsAdd ? " (+" + p.jobsAdd.toLocaleString() + " jobs)" : ""), "success");
        try { window.SOPX_onDecision && window.SOPX_onDecision("lga_road_delivered", { project: p.nm, zone: sd?.zone }); } catch(e){}
        try { setWikiEvents(w => [{ turn, section: "Governorship", txt: "Commissioned " + p.nm + (p.jobsAdd ? " — created " + p.jobsAdd.toLocaleString() + " jobs" : "") + ". " + desc }, ...w]); } catch(e){}
        if (p.cr > 0 && Math.random() < p.cr) { n.cor = cl(n.cor + .05); setCorW(w => w + p.c * .2); addL("💀 Scandal: Procurement fraud on " + p.nm + " project! ₦" + (p.c * .2).toFixed(1) + "B missing.", "scandal"); }
      });
      n.infra = cl(n.infra - .008);
      // ── APPROVAL REALISM (difficulty-scaled) ──
      const _lv = setup?.level || "medium";
      const _D = _lv === "hard" ? { drift: 3.2, corMul: 1.6, secMul: 1.6, oppP: .55, cap: 88, shockP: .55 }
                : _lv === "easy" ? { drift: 1.0, corMul: .7, secMul: .7, oppP: .18, cap: 94, shockP: .15 }
                : { drift: 2.0, corMul: 1.0, secMul: 1.0, oppP: .35, cap: 92, shockP: .35 };
      // 1. Natural drift — governance is HARD; the press, opposition & social media never sleep.
      n.app = cl100(n.app - _D.drift);
      // 2. Corruption drag
      if (n.cor > .40) n.app = cl100(n.app - 2 * _D.corMul);
      if (n.cor > .55) n.app = cl100(n.app - 3 * _D.corMul);
      if (n.cor > .70) { n.app = cl100(n.app - 3); addL("💀 EFCC chairman names your state in a public briefing on 'concerning patterns'.", "scandal"); }
      // 3. Insecurity drag
      if (n.sec < .35) n.app = cl100(n.app - 2 * _D.secMul);
      if (n.sec < .20) { n.app = cl100(n.app - 3); addL("🪖 Mass casualty incident reported. National media camped at Government House.", "crisis"); }
      // 4. Soft ceiling
      if (n.app > 85) n.app = cl100(n.app - 3);
      else if (n.app > 75) n.app = cl100(n.app - 1.5);
      // 5. Hard ceiling — no Nigerian governor sustains stratospheric approval
      if (n.app > _D.cap) n.app = _D.cap;
      // 6. Opposition pressure scales with visibility
      if (n.app > 60 && Math.random() < _D.oppP) {
        const attacks = [
          "📰 Opposition: \"All PR, no substance\". Trends on X.",
          "📺 Channels TV town-hall: callers slam your project delivery.",
          "🗣️ Former governor calls a press conference attacking your record.",
          "📑 Civil society coalition releases damning scorecard.",
          "⚔️ House minority leader threatens motion of no confidence.",
        ];
        n.app = cl100(n.app - 2);
        addL(attacks[Math.floor(Math.random()*attacks.length)] + " -2 approval.", "political");
      }
      n.pStab = cl100(n.pStab + (n.app > 50 ? 1 : -2));

      // ── NIGERIA REALISM ENGINE — macro shocks based on real political economy ──
      const _zoneSec = STATES[state]?.zone || "SW";
      const _shocks = [];
      // Oil price / FAAC volatility — every turn, FAAC swings ±15-25%
      const _faacSwing = (Math.random() - .5) * (_lv === "hard" ? .50 : _lv === "easy" ? .20 : .35);
      n.faac = Math.max(2.5, n.faac * (1 + _faacSwing));
      if (_faacSwing < -.15) _shocks.push({ t: "📉 OIL PRICE SHOCK: Brent crashed. FAAC down " + Math.round(-_faacSwing*100) + "% to ₦" + n.faac.toFixed(1) + "B.", k: "crisis" });
      else if (_faacSwing > .15) _shocks.push({ t: "📈 OIL RALLY: FAAC up " + Math.round(_faacSwing*100) + "% to ₦" + n.faac.toFixed(1) + "B. Briefly.", k: "success" });
      // Naira devaluation — hits debt (FX-linked) randomly
      if (Math.random() < _D.shockP * .4 && n.debt > 0) {
        const dev = 0.10 + Math.random() * 0.15;
        n.debt = n.debt * (1 + dev * .5);
        _shocks.push({ t: "💱 NAIRA DEVALUED " + Math.round(dev*100) + "%. FX-denominated debt re-priced upward.", k: "crisis" });
      }
      // Fuel subsidy / petrol price hike → transport inflation → approval hit
      if (Math.random() < _D.shockP * .3) {
        n.app = cl100(n.app - 4); n.igr = Math.max(1.5, n.igr * .94);
        _shocks.push({ t: "⛽ FG hikes pump price. Transport fares double overnight. Markets close in protest. -4 approval.", k: "crisis" });
      }
      // Inflation / food prices
      if (Math.random() < _D.shockP * .35) {
        n.app = cl100(n.app - 3);
        _shocks.push({ t: "🍞 NBS: Headline inflation hits new high. Garri, rice, tomato prices spike. -3 approval.", k: "crisis" });
      }
      // Regional security shocks tied to zone
      if (Math.random() < _D.shockP * .4) {
        let evt;
        if (_zoneSec === "NE") evt = "☠️ Boko Haram/ISWAP raid on border LGA. IDPs flooding state capital.";
        else if (_zoneSec === "NW") evt = "🐎 Bandits attack rural community. Mass abduction reported.";
        else if (_zoneSec === "NC") evt = "🪓 Farmer-herder clash. Villages razed. Religious tensions rising.";
        else if (_zoneSec === "SE") evt = "🚫 IPOB sit-at-home shuts down commerce. Markets empty.";
        else if (_zoneSec === "SS") evt = "🛢️ Pipeline vandalism. Oil spill. Host communities demand compensation.";
        else evt = "🔫 'One Million Boys' cult violence in slum corridor. Two killed.";
        n.sec = cl(n.sec - .06); n.app = cl100(n.app - 3);
        _shocks.push({ t: evt + " -6% security, -3 approval.", k: "crisis" });
      }
      // ASUU/NLC/NUT strike threat
      if (Math.random() < _D.shockP * .25) {
        n.app = cl100(n.app - 3); n.pStab = cl100(n.pStab - 4);
        _shocks.push({ t: "✊ NLC declares 3-day warning strike over unpaid salaries & subsidy. Workers down tools.", k: "crisis" });
      }
      // ASUU strike (state university)
      if (Math.random() < _D.shockP * .2 && n.lit < .65) {
        n.lit = cl(n.lit - .02); n.app = cl100(n.app - 2);
        _shocks.push({ t: "🎓 State University ASUU branch joins national strike. Lectures suspended indefinitely.", k: "crisis" });
      }
      // Flooding / climate (June-Oct heuristic — every odd turn)
      if (turn % 2 === 1 && Math.random() < _D.shockP * .45) {
        n.infra = cl(n.infra - .04); n.app = cl100(n.app - 3); n.agr = cl(n.agr - .03);
        _shocks.push({ t: "🌊 NIMET-warned floods overwhelm drainage. Farmlands submerged. NEMA mobilising.", k: "crisis" });
      }
      // Cholera / Lassa / meningitis outbreak when health is weak
      if (n.hp < .45 && Math.random() < _D.shockP * .35) {
        n.hp = cl(n.hp - .04); n.app = cl100(n.app - 3);
        _shocks.push({ t: "🦠 NCDC confirms cholera outbreak. Cases climbing. WHO sends technical team.", k: "crisis" });
      }
      // EFCC/ICPC probe scales with corruption + low FG relations
      if (n.cor > .35 && Math.random() < _D.shockP * (n.cor + (fgRelation < 40 ? .25 : 0))) {
        n.app = cl100(n.app - 4); n.pStab = cl100(n.pStab - 5);
        _shocks.push({ t: "🚨 EFCC operatives raid Government House annex. Documents carted away. Front-page nationwide.", k: "scandal" });
      }
      // Godfather pressure intensifies on hard
      if (_lv === "hard" && godfatherPower > 30 && Math.random() < .25) {
        setGodfatherRel(r => cl100(r - 6));
        _shocks.push({ t: "🎩 Godfather: 'You are forgetting how you got there.' Loyalty -6.", k: "political" });
      }
      // Federal hostility erodes faster on hard
      if (_lv === "hard" && fgRelation > 20 && Math.random() < .2) {
        setFgRelation(v => Math.max(0, v - 4));
      }
      // Defection pressure — if pStab very low, party threatens to revoke ticket
      if (n.pStab < 35 && Math.random() < .3) {
        _shocks.push({ t: "🪧 Party NWC summons you to Abuja. 'Explain yourself or face suspension.'", k: "political" });
      }
      // PVC/INEC realism note (gentle): voter register update reduces hidden support if approval is fake
      if (n.app > 70 && n.cor > .45 && Math.random() < .2) {
        n.app = cl100(n.app - 4);
        _shocks.push({ t: "🗳️ INEC continuous voter registration exposes thin support — independent polls revise downward. -4.", k: "political" });
      }
      _shocks.forEach(sh => addL(sh.t, sh.k));

      // ── PERSONAL FUND — Governor's salary + crowdfunding ──
      // Governor earns ₦60M per half-year (₦10M/month)
      const salary = 0.06;
      setPersonalFund(pf => {
        let newPF = pf + salary;
        // Crowdfunding: if approval >= 85%, citizens donate to your re-election
        if (n.app >= 85) {
          const crowdfund = 0.1 + Math.random() * 0.1; // ₦100M-200M
          newPF += crowdfund;
          addL("🎉 CROWDFUNDING: Citizens with " + Math.round(n.app) + "% approval are donating to your campaign fund! +₦" + (crowdfund * 1000).toFixed(0) + "M", "success");
        }
        return newPF;
      });

      // ── DEBT MANAGEMENT ──
      // 1. Automatic debt service: 8% of debt paid each turn from budget (already deducted in tb calculation)
      // 2. IGR surplus paydown: if IGR exceeds spending needs, excess goes to debt
      const debtService = n.debt * .08;
      if (n.debt > 0) {
        const igrSurplus = Math.max(0, n.igr - 5); // anything above ₦5B baseline goes to debt
        const paydown = debtService + igrSurplus * .15; // 15% of surplus IGR pays down debt
        n.debt = Math.max(0, n.debt - paydown);
        if (paydown > 0.3) addL("💳 DEBT SERVICE: ₦" + paydown.toFixed(1) + "B paid. Remaining debt: ₦" + n.debt.toFixed(1) + "B.", "info");
      }
      // 3. Economic growth reduces debt ratio — strong GDP makes debt more manageable
      if (n.gdp > 20 && n.debt > 0) {
        const gdpReduction = n.gdp * .005; // 0.5% of GDP goes to debt reduction
        n.debt = Math.max(0, n.debt - gdpReduction);
      }
      // 4. Investor approvals reduce debt (jobs = taxes = revenue)
      // Already handled by IGR boost from investors

      // Debt warning thresholds
      if (n.debt > 15 && n.debt <= 20) addL("⚠️ SA: \"Your Excellency, our debt is climbing. ₦" + n.debt.toFixed(1) + "B. We should be cautious.\"", "political");
      if (n.debt > 20) addL("🚨 DEBT CRISIS: State debt at ₦" + n.debt.toFixed(1) + "B! Debt service is consuming the budget. Credit agencies watching.", "crisis");

      // Federal relations affect FAAC — hostile FG slowly cuts your allocation
      if (fgRelation < 30) { n.faac = Math.max(3, n.faac * .95); addL("🇳🇬 FG quietly reduces your FAAC. Relations: " + fgRelation + "%.", "crisis"); }
      if (fgRelation > 70) { n.faac = n.faac * 1.02; }

      // ── TIME DELAY SYSTEM — process delayed effects from previous turns ──
      setDelayedFx(prev => {
        const now = prev.filter(d => d.turn <= turn);
        const later = prev.filter(d => d.turn > turn);
        now.forEach(d => {
          if (d.fx.app) n.app = cl100(n.app + d.fx.app);
          if (d.fx.lit) n.lit = cl(n.lit + d.fx.lit);
          if (d.fx.hp) n.hp = cl(n.hp + d.fx.hp);
          if (d.fx.infra) n.infra = cl(n.infra + d.fx.infra);
          if (d.fx.cor) n.cor = cl(n.cor + d.fx.cor);
          if (d.fx.igr) n.igr += d.fx.igr;
          addL("⏰ DELAYED EFFECT: " + d.desc, d.fx.app > 0 || d.fx.igr > 0 ? "success" : "crisis");
        });
        return later;
      });

      // ── NARRATIVE ENGINE — update dominant narrative ──
      const activeNarrs = NARRATIVES.filter(nr => nr.trigger(n));
      if (activeNarrs.length > 0) {
        const newNarr = activeNarrs[0].id;
        if (newNarr !== narrative) {
          setNarrative(newNarr);
          const narrObj = activeNarrs[0];
          addL("📖 NARRATIVE SHIFT: The public now sees you as \"" + narrObj.nm + "\" " + narrObj.icon, "political");
          // Narrative affects approval drift
          if (newNarr === "corrupt") n.app = cl100(n.app - 3);
          if (newNarr === "weak") n.app = cl100(n.app - 2);
          if (newNarr === "technocrat" || newNarr === "reformer") n.app = cl100(n.app + 2);
        }
      }

      // ── HIDDEN THREATS — generate hidden problems that explode later ──
      if (Math.random() < .25 && n.cor > .3) {
        const threats = [
          { id: "ht_ghost", ministry: "Finance", severity: "high", desc: "Ghost workers discovered on state payroll — ₦800M lost annually." },
          { id: "ht_land", ministry: "Works", severity: "medium", desc: "Works Ministry land allocation fraud — documents forged." },
          { id: "ht_drug", ministry: "Health", severity: "high", desc: "Health Ministry procured expired drugs — patients at risk." },
          { id: "ht_contract", ministry: "Works", severity: "medium", desc: "Road contractor inflated costs by 300% — ministry signed off." },
          { id: "ht_divert", ministry: "Education", severity: "high", desc: "Education funds diverted to personal accounts — ₦500M missing." },
        ];
        const unseen = threats.filter(t => !hiddenThreats.find(h => h.id === t.id) && !hiddenRevealed.includes(t.id));
        if (unseen.length > 0) {
          const threat = unseen[Math.floor(Math.random() * unseen.length)];
          setHiddenThreats(p => [...p, { ...threat, turn: turn }]);
        }
      }
      // Hidden threats EXPLODE if not investigated within 3 turns
      setHiddenThreats(prev => {
        const exploding = prev.filter(h => turn - h.turn >= 3);
        const remaining = prev.filter(h => turn - h.turn < 3);
        exploding.forEach(h => {
          n.cor = cl(n.cor + .05);
          n.app = cl100(n.app - 6);
          addL("💣 SCANDAL ERUPTS: " + h.desc + " -6 approval, +5% corruption. You didn't investigate in time!", "scandal");
          setHiddenRevealed(p => [...p, h.id]);
        });
        return remaining;
      });

      setPApp(pp => { const np = { ...pp }; PERSONAS.forEach(p => { let d = 0; p.ks.forEach(k => { if (k === "education") d += (n.lit - .5) * 10; if (k === "health") d += (n.hp - .4) * 8; if (k === "infrastructure") d += (n.infra - .5) * 10; if (k === "security") d += (n.sec - .4) * 12; if (k === "agriculture") d += (n.agr - .5) * 8; if (k === "administration") d += (1 - n.cor) * 5; }); np[p.id] = cl100((np[p.id] || 50) + d * .15); }); return np; });
      setAppH(h => [...h, Math.round(n.app)]); return n;
    });

    // ── CABINET REPORT — GUARANTEED every turn (your convened ministries only) ──
    const cabEntries = (ministries || []).map(m => [m.id, m]);
    const saN = cast.adviser.name;
    const secToStat = { education: "lit", health: "hp", infrastructure: "infra", security: "sec", agriculture: "agr", administration: null };

    // Pick one convened ministry to spotlight each turn
    if (cabEntries.length) {
      const spotIdx = Math.floor(Math.random() * cabEntries.length);
      const [, spotC] = cabEntries[spotIdx];
      const statToSec = { lit: "education", hp: "health", infra: "infrastructure", sec: "security", agr: "agriculture" };
      const stat = spotC.key;
      const sec = statToSec[stat] || "administration";
      if ((spotC.perf || 0) > 60) {
        const igrAdd = sec === "agriculture" ? 0.4 : 0.2;
        const debtReduce = igrAdd * 0.2; // 20% of new revenue goes to debt
        if (stat) setS(p => ({ ...p, [stat]: cl(p[stat] + .015), igr: p.igr + igrAdd, debt: Math.max(0, p.debt - debtReduce) }));
        else setS(p => ({ ...p, igr: p.igr + igrAdd, debt: Math.max(0, p.debt - debtReduce) }));
        addL("🌟 CABINET: Hon. " + spotC.minister + " (" + spotC.name + ") " + (sec === "education" ? "secured ₦0.3B education support." : sec === "health" ? "launched immunization drive across 15 LGAs." : sec === "infrastructure" ? "fast-tracked road repairs — 50km done." : sec === "security" ? "coordinated a kidnapping-response operation. 12 arrests." : sec === "agriculture" ? "attracted ₦0.4B agro-processing investment." : "cut red tape — saved ₦0.2B in admin costs.") + " +₦" + igrAdd + "B IGR" + (debtReduce > 0.05 ? ", -₦" + debtReduce.toFixed(1) + "B debt" : ""), "success");
      } else if ((spotC.perf || 0) < 40) {
        if (stat) setS(p => ({ ...p, [stat]: cl(p[stat] - .01) }));
        addL("⚠️ SA " + saN + ": \"Your Excellency, Hon. " + spotC.minister + " is dragging " + spotC.name + " down. Ministry performance: " + spotC.perf + "%. Consider replacing them.\"", "crisis");
      } else {
        addL("📋 CABINET: Hon. " + spotC.minister + " (" + spotC.name + ") — performing adequately. Performance: " + spotC.perf + "%.", "info");
      }
      if ((spotC.cor || 0) > 35 && Math.random() < spotC.cor / 150) {
        setS(p => ({ ...p, cor: cl(p.cor + .03), app: cl100(p.app - 2) }));
        setCorW(w => w + 0.3);
        addL("💀 SCANDAL: Hon. " + spotC.minister + " (" + spotC.name + ") linked to ₦300M procurement fraud! -2 approval, corruption rises.", "scandal");
      }
      if ((spotC.loyalty || 55) < 35 && Math.random() < .4) {
        setS(p => ({ ...p, pStab: cl100(p.pStab - 3) }));
        addL("🗞️ LEAK: Hon. " + spotC.minister + " (" + spotC.name + ") seen meeting opposition figures. -3 party stability.", "political");
      }
    }

    // ── CIVIL SERVICE REPORT — every other turn ──
    if (turn % 2 === 0) {
      const psEntries = Object.entries(ps);
      const worstPS = psEntries.reduce((a, b) => (b[1].eff < a[1].eff ? b : a), psEntries[0]);
      const bestPS = psEntries.reduce((a, b) => (b[1].eff > a[1].eff ? b : a), psEntries[0]);
      const corruptPS = psEntries.filter(([, p]) => p.cor > 45);

      if (worstPS[1].eff < 40) {
        const rn2 = PS_ROLES.find(r => r.k === worstPS[0]);
        addL("🏛️ BUREAUCRACY: " + worstPS[1].nm + " (" + (rn2?.t || "Perm Sec") + ") is blocking progress. Type: " + worstPS[1].type + ". Efficiency: " + worstPS[1].eff + "%. " + (worstPS[1].type === "Old Guard" ? "Resists all reform attempts." : worstPS[1].type === "Corrupt Bureaucrat" ? "Running a parallel economy in the ministry." : "Incompetent and unmotivated."), "crisis");
      }
      if (bestPS[1].eff > 65) {
        const rn2 = PS_ROLES.find(r => r.k === bestPS[0]);
        addL("🌟 CIVIL SERVICE: " + bestPS[1].nm + " (" + (rn2?.t || "Perm Sec") + ") is delivering results. Type: " + bestPS[1].type + ". Efficiency: " + bestPS[1].eff + "%.", "success");
      }
      if (corruptPS.length > 2) {
        addL("🧑‍💼 SA " + saN + ": \"Your Excellency, " + corruptPS.length + " of our " + psEntries.length + " permanent secretaries have corruption above 45%. The civil service is eating the state from within. Consider reform.\"", "political");
      }
    }

    // ── STAKEHOLDER FEEDBACK — GUARANTEED every turn ──
    // Pick the most extreme stakeholder (lowest or highest) to spotlight
    const skEntries = Object.entries(skApp);
    const skNames = { media: "Media", business: "Business Community", unions: "Labour Unions", traditional: "Traditional Rulers", party: "Party", youth: "Youth Groups", religious: "Religious Leaders" };
    const lowest = skEntries.reduce((a, b) => (b[1] < a[1] ? b : a), skEntries[0]);
    const highest = skEntries.reduce((a, b) => (b[1] > a[1] ? b : a), skEntries[0]);

    // Always report on the lowest stakeholder
    if (lowest[1] < 40) {
      addL("🧑‍💼 SA " + saN + ": \"Your Excellency, the " + (skNames[lowest[0]] || lowest[0]) + " are unhappy (" + Math.round(lowest[1]) + "%). " + (lowest[0] === "media" ? "Negative press is hurting us." : lowest[0] === "business" ? "Investors are nervous." : lowest[0] === "unions" ? "Workers are restless." : lowest[0] === "youth" ? "Young people feel ignored." : lowest[0] === "religious" ? "Religious leaders are speaking against us." : lowest[0] === "traditional" ? "The traditional rulers have gone quiet." : "Party factions are forming.") + "\"", "political");
    }
    // Crisis triggers for very low stakeholders — WITH TRUST NETWORK CASCADE
    skEntries.forEach(([k, v]) => {
      if (v < 30) {
        if (k === "media") { setS(p => ({ ...p, app: cl100(p.app - 4) })); addL("📰 MEDIA CRISIS: Damning exposé published. -4 approval.", "crisis"); }
        if (k === "business") { setS(p => ({ ...p, igr: p.igr - 0.5 })); addL("📉 BUSINESS PULLOUT: Investors withdraw ₦0.5B from " + state.replace("_", " ") + ".", "crisis"); }
        if (k === "unions") { setS(p => ({ ...p, app: cl100(p.app - 5) })); addL("✊ WORKERS STRIKE: Government services paralyzed. -5 approval.", "crisis"); }
        if (k === "traditional") { setS(p => ({ ...p, pStab: cl100(p.pStab - 6) })); addL("👑 ROYAL SNUB: Traditional rulers boycott government events. -6 party.", "crisis"); }
        if (k === "party") { setS(p => ({ ...p, pStab: cl100(p.pStab - 8) })); addL("🏛️ PARTY REVOLT: Factions threaten to destabilize " + party + ". -8 party.", "crisis"); }
        if (k === "youth") { setS(p => ({ ...p, app: cl100(p.app - 3), sec: cl(p.sec - .01) })); addL("🔥 YOUTH PROTEST: Streets blocked across 5 LGAs. -3 approval.", "crisis"); }
        if (k === "religious") { setS(p => ({ ...p, app: cl100(p.app - 3) })); addL("🕌 RELIGIOUS DENOUNCEMENT: Clerics call governor 'wicked'. -3 approval.", "crisis"); }
        // TRUST CASCADE — one stakeholder crisis pulls others down
        setSkApp(p => {
          const cascaded = applyCascade(p, k, -(30 - v));
          const cascadeTargets = Object.keys(TRUST_CASCADES[k] || {});
          if (cascadeTargets.length > 0) {
            addL("🔗 CASCADE: " + (skNames[k] || k) + " crisis drags " + cascadeTargets.map(t => skNames[t] || t).join(", ") + " down.", "crisis");
          }
          return cascaded;
        });
      }
    });
    // Bonus for highest stakeholder
    if (highest[1] > 65) {
      if (highest[0] === "business") { setS(p => ({ ...p, igr: p.igr + 0.2 })); addL("💰 BUSINESS BOOST: " + (skNames[highest[0]]) + " confidence drives ₦0.2B new investment.", "policy"); }
      else if (highest[0] === "media") { addL("📺 POSITIVE PRESS: " + (skNames[highest[0]]) + " praise governance record. Good coverage.", "policy"); }
      else if (highest[0] === "youth") { addL("💪 YOUTH SUPPORT: Young people rally behind the administration online.", "policy"); }
      else { addL("👍 " + (skNames[highest[0]]) + " express continued support for the administration (" + Math.round(highest[1]) + "%).", "policy"); }
    }

    // ── PERSONA VOICE — GUARANTEED 1 reaction every turn ──
    // Pick a random persona and give them a voice
    const randPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
    const rpVal = pApp[randPersona.id] || 50;
    if (rpVal < 35) {
      addL("😤 " + randPersona.nm + ": \"" + (randPersona.ks[0] === "security" ? "We are not safe! Where are the police?" : randPersona.ks[0] === "education" ? "My children sit at home — no teachers, no books!" : randPersona.ks[0] === "health" ? "People are dying in the hospital corridors!" : randPersona.ks[0] === "infrastructure" ? "These roads will kill us before hunger does!" : randPersona.ks[0] === "agriculture" ? "Farming is dead. We cannot feed ourselves." : "Nothing works in this state!") + "\"", "crisis");
    } else if (rpVal > 60) {
      addL("😊 " + randPersona.nm + ": \"" + (randPersona.ks[0] === "security" ? "I feel safer now. My children walk to school without fear." : randPersona.ks[0] === "education" ? "The new schools are beautiful. My children are learning!" : randPersona.ks[0] === "health" ? "The clinic in my area finally has drugs and nurses." : randPersona.ks[0] === "infrastructure" ? "These new roads! I can get to market in 30 minutes now." : randPersona.ks[0] === "agriculture" ? "The harvest was good this year. Government helped." : "Things are getting better. I can feel it.") + "\"", "policy");
    } else {
      addL("😐 " + randPersona.nm + ": \"We are watching this governor. " + (rpVal > 50 ? "Some things are improving, but we need more." : "Not much has changed for people like us.") + " (" + Math.round(rpVal) + "%)\"", "info");
    }

    // Generate newspaper headline — dynamic, contextual, never boring
    const lastLog = logs[0];
    const hlOpts = [];
    // Turn-specific
    if (turn === 1) hlOpts.push(pName.split(" ").pop().toUpperCase() + " BEGINS: New governor promises " + (setup?.agenda === "education" ? "education revolution" : setup?.agenda === "health" ? "healthcare for all" : setup?.agenda === "infrastructure" ? "massive road projects" : setup?.agenda === "security" ? "peace and security" : setup?.agenda === "agriculture" ? "farming transformation" : "clean governance"));
    if (turn === 1) hlOpts.push("NEW ERA: " + pName + "/" + (depGov?.nm?.split(" ").pop() || "") + " ticket takes over " + state.replace("_", " "));
    // Event-reactive
    if (lastLog?.tp === "scandal") hlOpts.push("BREAKING: Procurement fraud exposed in Government House!");
    if (lastLog?.tp === "success") hlOpts.push("COMMISSIONED! " + (lastLog.tx.includes("—") ? lastLog.tx.split("— ")[1] : "New project delivered"));
    if (lastLog?.tx?.includes("Godfather")) hlOpts.push("POWER PLAY: Shadowy figures circle Government House");
    if (lastLog?.tx?.includes("RE-ELECTED")) hlOpts.push("FOUR MORE YEARS! " + state.replace("_", " ") + " returns " + pName);
    if (lastLog?.tx?.includes("Netherlands")) hlOpts.push("FOREIGN INVESTORS EYE " + state.replace("_", " ").toUpperCase());
    if (lastLog?.tx?.includes("Aso Rock")) hlOpts.push(pName.toUpperCase() + " DINES WITH MR. PRESIDENT");
    if (lastLog?.tx?.includes("SUPREME COURT")) hlOpts.push("JUDICIAL BOMBSHELL: Court strikes down governor's order");
    if (lastLog?.tx?.includes("SIGNED")) hlOpts.push("NEW LAW: " + (lastLog.tx.split("SIGNED: ")[1]?.split(".")[0] || "Bill signed into law"));
    if (lastLog?.tx?.includes("VETOED")) hlOpts.push("VETO! Governor blocks House bill. Tensions rise.");
    // State-reactive
    if (s.app > 70) hlOpts.push("PEOPLE'S GOVERNOR: " + pName + " approval hits " + Math.round(s.app) + "%!");
    if (s.app > 55 && s.app <= 70) hlOpts.push("STEADY HAND: " + state.replace("_", " ") + " governance on track");
    if (s.app < 35 && s.app >= 25) hlOpts.push("TROUBLE BREWING: " + state.replace("_", " ") + " residents grow restless");
    if (s.app < 25) hlOpts.push("ON THE BRINK: Impeachment whispers grow louder");
    if (s.cor > .45) hlOpts.push("WHERE IS THE MONEY? Civil society demands answers from " + state.replace("_", " "));
    if (s.cor < .15) hlOpts.push("CLEAN SHEET: " + pName + " administration sets transparency record");
    if (s.infra > .7) hlOpts.push("TRANSFORMATION: " + state.replace("_", " ") + " roads now among best in region");
    if (s.debt > 15) hlOpts.push("RED ALERT: " + state.replace("_", " ") + " debt spirals to " + naira(s.debt));
    if (s.sec < .25) hlOpts.push("BLOOD ON THE ROADS: Security crisis worsens in " + state.replace("_", " "));
    if (s.sec > .65) hlOpts.push("SAFE STATE: " + state.replace("_", " ") + " sees lowest crime in decade");
    if (s.pStab < 25) hlOpts.push("PARTY WAR: " + party + " factions threaten governor");
    if (completedProjects.length > 0 && turn <= 3) hlOpts.push("QUICK WINS: " + pName + " delivers first project in record time");
    if (completedProjects.length > 4) hlOpts.push("PROJECT MACHINE: " + completedProjects.length + " projects and counting in " + state.replace("_", " "));
    // Stakeholder-reactive headlines
    if (skApp.media < 35) hlOpts.push("PRESS WAR: Media turns hostile against " + pName + " government");
    if (skApp.unions < 35) hlOpts.push("STRIKE LOOMS: Workers threaten to shut down " + state.replace("_", " "));
    if (skApp.business < 35) hlOpts.push("INVESTORS FLEE: Business confidence collapses in " + state.replace("_", " "));
    if (skApp.youth < 35) hlOpts.push("YOUTH UNREST: " + state.replace("_", " ") + " youth demand change");
    if (skApp.religious < 35) hlOpts.push("FAITH LEADERS SPEAK: Religious groups condemn governance failures");
    if (skApp.party > 70) hlOpts.push("UNITED FRONT: " + party + " rallies behind Gov. " + pName);
    // Persona-reactive headlines
    if (rpVal < 35) hlOpts.push("VOICES FROM THE STREET: '" + randPersona.nm + "' joins growing chorus of discontent");
    if (rpVal > 65) hlOpts.push("PRAISE FROM THE GROUND: Citizens hail " + pName + " administration");
    // Economic headlines
    if (s.gdp > 30) hlOpts.push("ECONOMIC BOOM: " + state.replace("_", " ") + " GDP surges past ₦" + Math.round(s.gdp) + "B");
    if (s.totalJobs > s.pop * 50) hlOpts.push("JOBS SURGE: " + state.replace("_", " ") + " employment hits record numbers");
    if (s.igr > 10) hlOpts.push("REVENUE CHAMPION: " + state.replace("_", " ") + " IGR crosses ₦" + Math.round(s.igr) + "B mark");
    if (s.econ?.manufacturing?.out > .4) hlOpts.push("INDUSTRIAL REVOLUTION: " + state.replace("_", " ") + " manufacturing sector booming");
    if (s.econ?.tech?.out > .25) hlOpts.push("TECH HUB: " + state.replace("_", " ") + " emerges as technology destination");
    if (hlOpts.length === 0) hlOpts.push(state.replace("_", " ").toUpperCase() + " WATCH: What is the governor up to?");
    setHeadline(hlOpts[Math.floor(Math.random() * hlOpts.length)]);

    // Achievements: no list of them exists yet. The old check referenced an
    // undefined ACHIEVEMENTS and threw here, skipping the bankruptcy,
    // impeachment and court checks below.

    // Bankruptcy — state revenue collapses (threshold scales with difficulty)
    const _lvE = setup?.level || "medium";
    const _bankT = _lvE === "hard" ? 3.0 : _lvE === "easy" ? 1.5 : 2.2;
    if (s.igr + s.faac < _bankT) { addL("🚨 STATE BANKRUPT: Revenue collapsed. Salaries unpaid for 3 months. The people chase you from Government House!", "crisis"); setGEnd("bankrupt"); return; }
    // Impeachment — easier to trigger on hard (House moves faster when blood is in the water)
    const _impA = _lvE === "hard" ? 38 : _lvE === "easy" ? 25 : 30;
    const _impS = _lvE === "hard" ? 48 : _lvE === "easy" ? 35 : 40;
    if (s.app < _impA && s.pStab < _impS) { setPhase("impeach"); return; }
    // Check judiciary
    // A court ruling goes first on this half-year's Desk instead of
    // replacing it (it used to skip every other event of the turn).
    if (checkJudiciary()) deskCourtFirst.current = true;

    // Stats processed, headline generated — show end_turn screen
    // Events will fire when player clicks CONTINUE
    setPhase("end_turn");
  };

  // Called when player clicks CONTINUE on the end-of-turn screen
  // ── EVENT QUEUE — multiple events per turn ──
  const [eventQueue, setEventQueue] = useState([]);

  // ── THE DESK ──
  // One queue for every decision of the half-year. The core layers below
  // push phase names; the sop-*.js modules offer cards through
  // window.SOP.desk.offer(card) instead of opening their own pop-ups:
  //   { key, topic, source, open(done) }
  // Offers wait until the next queue is built. A card is dropped when its
  // key is already queued or a core event already covers its topic, so the
  // player never gets two House or two godfather decisions in one sitting.
  // A card calls done() when the player has finished with it.
  const DESK_TOPIC = {
    netherlands: "travel", abuja: "travel", wedding: "travel", intl_invite: "travel",
    godfather: "godfather", house_bill: "house", investor: "investment", federal: "federal",
    shock: "shock", judiciary: "courts", media: "press", nic_ruling: "courts",
    hidden_threat: "adviser", dilemma: "crisis", flagship: "flagship",
  };
  // A new run starts with the campaign loan on the record, so the godfather
  // can ask for it back (and only then).
  useEffect(() => {
    const M = window.SOP_MEMORY;
    if (ld || !M || campaignGfDebt <= 0 || M.did("campaign_loan")) return;
    M.owe("godfather", "Campaign loan of ₦" + campaignGfDebt + "B", { kind: "campaign_loan", role: "godfather", amount: campaignGfDebt, gravity: 2, evidence: 2, relatedEntity: "money:campaign_loan" });
  }, []);

  const deskOffers = React.useRef([]);
  const deskCourtFirst = React.useRef(false);
  const deskCards = React.useRef({});
  const [deskActive, setDeskActive] = useState(null);
  // Cards that must open now (not at the end-of-turn sitting) come through
  // desk.present(card). They wait while another card or an end-of-turn
  // sitting holds the screen, and each key opens once per run.
  const deskNow = React.useRef({ busy: false, queue: [], shown: new Set() });
  const phaseRef = React.useRef(null);
  const deskPump = () => {
    const N = deskNow.current;
    if (N.busy || !N.queue.length) return;
    if (phaseRef.current === "desk") { setTimeout(deskPump, 500); return; }
    const card = N.queue.shift();
    N.busy = true; N.shown.add(card.key);
    let finished = false;
    const done = () => { if (finished) return; finished = true; N.busy = false; setTimeout(deskPump, 0); };
    try { card.open(done); } catch (e) { console.error("[Desk] card failed to open", card.key, e); done(); }
  };
  const desk = React.useRef(null);
  if (!desk.current) desk.current = {
    present: (card) => {
      if (!card || typeof card.open !== "function" || !card.key) return false;
      const N = deskNow.current;
      if (N.shown.has(card.key) || N.queue.some(c => c.key === card.key)) return false;
      N.queue.push(card);
      deskPump();
      return true;
    },
    offer: (card) => {
      if (!card || typeof card.open !== "function" || !card.key) return false;
      if (deskOffers.current.some(c => c.key === card.key)) return false;
      deskOffers.current.push(card);
      return true;
    },
    pending: () => deskOffers.current.map(c => ({ key: c.key, topic: c.topic, source: c.source })),
  };
  // ── Godfather demands read the memory (window.SOP_MEMORY, the ledger) ──
  // He only asks for campaign money back while the loan is unpaid, never
  // asks for Works once he holds it, and comes back first for what he is
  // owed. Each demand's outcome goes on the record, and accepting settles
  // the matching debt.
  const GF_LINKS = {
    gf_appointment: { relatedEntity: "ministry:works", settles: (d) => /works/i.test(d.what) },
    gf_money: { relatedEntity: "money:campaign_loan", settles: (d) => d.kind === "campaign_loan" },
    gf_contract: { relatedEntity: "contract:gf_road" },
    gf_land: { relatedEntity: "land:capital" },
    gf_assembly: { relatedEntity: "house:speaker" },
    gf_revenue: { relatedEntity: "revenue:igr" },
  };
  const pickGfDemand = (unseen, r) => {
    const M = window.SOP_MEMORY;
    if (!M) return unseen.length ? pick(unseen, r) : null;
    const owed = M.owed("godfather");
    const holdsWorks = !!M.did("godfather_contract", { relatedEntity: "ministry:works" });
    const holdsRoad = !!M.did(null, e => e.relatedEntity === "project:signature_road" && (e.beneficiaries || []).includes("godfather"));
    const pool = unseen.filter(d => {
      if (d.id === "gf_money") return owed.some(o => o.kind === "campaign_loan");
      if (d.id === "gf_appointment") return !holdsWorks;
      // His road: once the First 100 Days handed him the signature road
      // (emergency certificate), he doesn't ask for a road contract again.
      if (d.id === "gf_contract") return !holdsRoad;
      return true;
    });
    if (!pool.length) return null;
    const works = pool.find(d => d.id === "gf_appointment");
    if (works && owed.some(o => /works/i.test(o.what))) return works;
    const money = pool.find(d => d.id === "gf_money");
    if (money) return money;
    return pick(pool, r);
  };
  const recordGfDemand = (dem, accepted, gfName) => {
    const L = window.SOP_LEDGER, M = window.SOP_MEMORY;
    if (!L || !dem) return;
    const link = GF_LINKS[dem.id] || {};
    try {
      L.append({
        kind: accepted ? "godfather_contract" : "godfather_betrayal", actor: "governor", target: gfName,
        gravity: accepted ? 3 : 2, evidence: 2,
        corruptionDelta: accepted ? Math.round(((dem.acceptFx && dem.acceptFx.corM) || 0) * 100) : 0,
        decision: accepted ? "Gave the godfather what he wanted" : "Refused the godfather",
        note: (accepted ? dem.acceptLog : dem.rejectLog) || dem.d,
        relatedEntity: link.relatedEntity || null,
        beneficiaries: [accepted ? "godfather" : "public"], losers: [accepted ? "public" : "godfather"],
        meta: { demand: dem.id },
      });
      if (accepted && M && link.settles) M.owed("godfather").filter(link.settles).forEach(d => M.settle(d.id, "Godfather demand: " + dem.id));
    } catch (e) { console.warn("[memory] godfather record", e); }
  };

  // Record a decision that involves a cast member, so it shows on their page.
  const recordWithCast = (castId, kind, decision, note) => {
    try {
      const c = cast[castId];
      if (c && window.SOP_LEDGER) window.SOP_LEDGER.append({ kind, actor: "governor", target: c.name, gravity: 2, evidence: 2, decision, note, meta: { cast: castId } });
    } catch (e) {}
  };

  // Move offered cards onto a queue of core phase names, de-duplicating.
  const deskMerge = (q) => {
    const topics = new Set(q.map(k => DESK_TOPIC[k]).filter(Boolean));
    const keys = new Set();
    const offers = deskOffers.current; deskOffers.current = [];
    deskCards.current = {};
    offers.forEach((c, i) => {
      if (keys.has(c.key) || (c.topic && topics.has(c.topic))) {
        addL("🗂️ Desk: set aside \"" + (c.title || c.key) + "\" (already covered this half-year).", "info");
        return;
      }
      keys.add(c.key); if (c.topic) topics.add(c.topic);
      const id = "desk:" + i;
      deskCards.current[id] = c;
      q.push(id);
    });
    return q;
  };
  // Show a queue entry: core entries are phases; desk entries open the card.
  const deskGo = (next) => {
    if (typeof next === "string" && next.startsWith("desk:")) {
      setDeskActive(deskCards.current[next] || null);
      setPhase("desk");
    } else setPhase(next);
  };

  const buildEventQueue = () => {
    setHeadline(null); setAchPopup(null);
    const rE = rng(turn * 777 + state.length * 13 + Date.now() % 10000);
    const q = [];
    const courtFirst = deskCourtFirst.current; deskCourtFirst.current = false;
    if (courtFirst) q.push("judiciary");
    // Once a year the flagship programme comes back to the Desk.
    if (turn % 2 === 0 && FLAGSHIP[setup?.agenda]) q.push("flagship");
    const lv = setup?.level || "hard";

    // LAYER 1: Major trip/visit (1 per turn, scheduled)
    // Primary: only Abuja trip. Secondary+: all trips.
    if (lv !== "easy") {
      if (!netherlandsVisited && (turn === 2 || turn === 3)) q.push("netherlands");
      else if (!abujaVisited && (turn === 3 || turn === 4)) q.push("abuja");
      else if (!weddingVisited && (turn === 5 || turn === 6)) q.push("wedding");
      else if (intlInvites.length < 3 && (turn === 3 || turn === 5 || turn === 7)) {
        const unseen = INTL_INVITES.filter(inv => !intlInvites.includes(inv.id));
        if (unseen.length > 0) { const inv = pick(unseen, rE); setCurInvite(inv); setIntlInvites(p => [...p, inv.id]); q.push("intl_invite"); }
      }
    } else {
      // Primary only gets Abuja
      if (!abujaVisited && (turn === 3 || turn === 4)) q.push("abuja");
    }

    // LAYER 2: Godfather (every even turn) — NOT for Primary
    if (lv !== "easy" && godfatherPower > 20 && turn % 2 === 0) {
      const unseen = GODFATHER_DEMANDS.filter(d2 => !godfatherSeen.includes(d2.id));
      const dem = pickGfDemand(unseen, rE);
      if (dem) { setGodfatherDemand(dem); setGodfatherSeen(p => [...p, dem.id]); q.push("godfather"); }
    }

    // LAYER 3: House bill — Secondary+: most turns. Primary: only turn 3 and 6.
    const unseenBills = HOUSE_BILLS.filter(b => !houseBillsSeen.includes(b.id));
    if (unseenBills.length > 0) {
      const billTurn = lv === "easy" ? (turn === 3 || turn === 6) : (turn % 2 === 1 || turn >= 5);
      if (billTurn) {
        const bill = pick(unseenBills, rE);
        setPendingHouseBill(bill); setHouseBillsSeen(p => [...p, bill.id]); q.push("house_bill");
      }
    }

    // LAYER 4: Private Investor (turns 1, 3, 5, 7)
    if ((turn === 1 || turn === 3 || turn === 5 || turn === 7) && investorsSeen.length < 6) {
      const unseen = INVESTORS.filter(inv => !investorsSeen.includes(inv.id));
      if (unseen.length > 0) {
        const inv = pick(unseen, rE);
        setCurInvestor(inv);
        setInvestorsSeen(p => [...p, inv.id]);
        q.push("investor");
      }
    }

    // LAYER 5: Federal Government Event (turns 2, 4, 6 — federal never sleeps)
    if ((turn === 2 || turn === 4 || turn === 6) && fgEventsSeen.length < 4) {
      const unseenFG = FG_EVENTS.filter(e => !fgEventsSeen.includes(e.id));
      // Pick contextual: punishment if FG relation low, reward if high
      const pool2 = fgRelation < 40 ? unseenFG.filter(e => e.type === "punish") : fgRelation > 65 ? unseenFG.filter(e => e.type === "reward") : unseenFG;
      const fgPool = (pool2.length > 0 ? pool2 : unseenFG);
      if (fgPool.length > 0) {
        const fgEv = pick(fgPool, rE);
        setCurFgEvent(fgEv);
        setFgEventsSeen(p => [...p, fgEv.id]);
        q.push("federal");
      }
    }

    // LAYER 6: SHOCK EVENT — unpredictable, 30% chance, max 2 per game
    if (shocksSeen.length < 2 && rE() < .30) {
      const unseenShocks = SHOCK_EVENTS.filter(e => !shocksSeen.includes(e.id));
      if (unseenShocks.length > 0) {
        const shock = pick(unseenShocks, rE);
        setCurShock(shock);
        setShocksSeen(p => [...p, shock.id]);
        q.push("shock");
      }
    }

    // LAYER 7: JUDICIARY CHALLENGE — triggered by player actions
    if (!courtFirst && courtsSeen.length < 3) {
      let judTrigger = null;
      if (investorsApproved.length > 0 && !courtsSeen.includes("jud_land") && rE() < .4) judTrigger = JUDICIARY_TRIGGERS.find(j => j.id === "jud_land");
      else if (forcedBudget && !courtsSeen.includes("jud_budget")) judTrigger = JUDICIARY_TRIGGERS.find(j => j.id === "jud_budget");
      else if (s.cor > .4 && !courtsSeen.includes("jud_corrupt") && rE() < .35) judTrigger = JUDICIARY_TRIGGERS.find(j => j.id === "jud_corrupt");
      else if (pol.length > 2 && !courtsSeen.includes("jud_policy") && rE() < .25) judTrigger = JUDICIARY_TRIGGERS.find(j => j.id === "jud_policy");
      else if (investorsApproved.includes("mining_co") && !courtsSeen.includes("jud_mining")) judTrigger = JUDICIARY_TRIGGERS.find(j => j.id === "jud_mining");
      if (judTrigger) {
        const jd = { ...judTrigger };
        jd.desc = jd.desc.replace("{company}", investorsApproved.length > 0 ? (INVESTORS.find(inv => inv.id === investorsApproved[investorsApproved.length - 1])?.co || "the investor") : "the company").replace("{corruption}", Math.round(s.cor * 100)).replace("{policy}", pol.length > 0 ? pol[0].nm : "your");
        setCurCourt(jd);
        setCourtStage(0);
        setCourtsSeen(p => [...p, jd.id]);
        q.push("judiciary");
      }
    }

    // LAYER 8: Media Event — every 2 turns and only when there's real signal to react to.
    if (turn % 2 === 0 && (s.app < 55 || s.app > 70 || logs.slice(0,5).some(l => ["crisis","scandal","dilemma"].includes(l.tp)))) {
      const unseenMedia = MEDIA_EVENTS.filter(m => !mediaSeen.includes(m.id));
      if (unseenMedia.length > 0) {
        const contextual = s.app < 40 ? unseenMedia.filter(m => m.severity === "high" || m.severity === "medium") : s.app > 60 ? unseenMedia.filter(m => m.severity === "positive") : unseenMedia;
        const pool = contextual.length > 0 ? contextual : unseenMedia;
        const mev = pick(pool, rE);
        setCurMedia(mev);
        setMediaSeen(p => [...p, mev.id]);
        q.push("media");
      }
    }

    // LAYER 9: NIC RULING — if pending from previous turn sacking
    if (nicPending && turn >= nicPending.turn) {
      q.push("nic_ruling");
    }

    // LAYER 10: HIDDEN THREAT HINT — SA warns if threats exist
    if (hiddenThreats.length > 0 && !q.includes("hidden_threat")) {
      q.push("hidden_threat");
    }

    // LAYER 11: Dilemma — only every other turn AND only if the queue isn't crowded.
    // Contextual: prefer a dilemma matching the current pressure so it feels consequential.
    if (turn % 2 === 1 && q.length < 3) {
      const themePref = s.sec < 0.4 ? ["security","crisis","bandit","kidnap"]
                       : s.cor > 0.45 ? ["corruption","scandal","land","contract"]
                       : s.app < 40 ? ["labour","strike","protest","salary"]
                       : null;
      let pool = ALL_DILEMMAS;
      if (themePref) {
        const filt = ALL_DILEMMAS.filter(d => themePref.some(t => ((d.nm||"") + " " + (d.d||"") + " " + (d.id||"")).toLowerCase().includes(t)));
        if (filt.length) pool = filt;
      }
      setCurD(pick(pool, rE)); q.push("dilemma");
    }

    // Module cards join after the core events, minus duplicates.
    deskMerge(q);

    // Set queue and fire first event
    setEventQueue(q.slice(1));
    if (q.length > 0) deskGo(q[0]);
    else advance();
  };

  // Called after each event is handled — fires next in queue or advances
  const nextEvent = () => {
    if (eventQueue.length === 0) { advance(); return; }
    const next = eventQueue[0];
    setEventQueue(q => q.slice(1));

    // Set up data for the next event if needed
    if (next === "intl_invite" && !curInvite) {
      const rE = rng(turn * 111 + state.length * 53 + Date.now() % 5000);
      const unseen = INTL_INVITES.filter(inv => !intlInvites.includes(inv.id));
      if (unseen.length > 0) { const inv = pick(unseen, rE); setCurInvite(inv); setIntlInvites(p => [...p, inv.id]); }
    }
    if (next === "godfather" && !godfatherDemand) {
      const rE = rng(turn * 888 + state.length * 41);
      const unseen = GODFATHER_DEMANDS.filter(d2 => !godfatherSeen.includes(d2.id));
      const dem = pickGfDemand(unseen, rE);
      if (dem) { setGodfatherDemand(dem); setGodfatherSeen(p => [...p, dem.id]); }
    }
    if (next === "house_bill" && !pendingHouseBill) {
      const rE = rng(turn * 444 + state.length * 23);
      const unseenB = HOUSE_BILLS.filter(b => !houseBillsSeen.includes(b.id));
      if (unseenB.length > 0) { setPendingHouseBill(pick(unseenB, rE)); setHouseBillsSeen(p => [...p, unseenB[0].id]); }
    }
    if (next === "shock" && !curShock) {
      const rE2 = rng(turn * 654 + state.length * 28);
      const unseen = SHOCK_EVENTS.filter(e => !shocksSeen.includes(e.id));
      if (unseen.length > 0) { setCurShock(pick(unseen, rE2)); setShocksSeen(p => [...p, unseen[0].id]); }
    }
    if (next === "federal" && !curFgEvent) {
      const rE2 = rng(turn * 432 + state.length * 19);
      const unseen = FG_EVENTS.filter(e => !fgEventsSeen.includes(e.id));
      if (unseen.length > 0) { setCurFgEvent(pick(unseen, rE2)); setFgEventsSeen(p => [...p, unseen[0].id]); }
    }
    if (next === "investor" && !curInvestor) {
      const rE2 = rng(turn * 321 + state.length * 67);
      const unseen = INVESTORS.filter(inv => !investorsSeen.includes(inv.id));
      if (unseen.length > 0) { setCurInvestor(pick(unseen, rE2)); setInvestorsSeen(p => [...p, unseen[0].id]); }
    }
    if (next === "media" && !curMedia) {
      const rE2 = rng(turn * 543 + state.length * 31);
      const unseen = MEDIA_EVENTS.filter(m => !mediaSeen.includes(m.id));
      if (unseen.length > 0) { setCurMedia(pick(unseen, rE2)); setMediaSeen(p => [...p, unseen[0].id]); }
    }
    if (next === "dilemma" && !curD) {
      const rE = rng(turn * 999 + Date.now() % 3000);
      setCurD(pick(ALL_DILEMMAS, rE));
    }
    deskGo(next);
  };

  // A desk card finishes asynchronously (its own DOM), so it calls the
  // latest nextEvent through a ref rather than a stale closure.
  const nextEventRef = React.useRef(null);
  nextEventRef.current = nextEvent;
  phaseRef.current = phase;
  useEffect(() => {
    if (phase !== "desk") return;
    if (deskNow.current.busy) { const t = setTimeout(() => setDeskActive(a => a ? { ...a } : a), 500); return () => clearTimeout(t); }
    const card = deskActive;
    if (!card) { nextEventRef.current(); return; }
    if (card._opened) return;
    card._opened = true;
    let finished = false;
    const done = () => { if (finished) return; finished = true; setDeskActive(null); nextEventRef.current(); };
    try { card.open(done); } catch (e) { console.error("[Desk] card failed to open", card.key, e); done(); }
  }, [phase, deskActive]);

  if (gEnd) {
    const di = ((s.lit + s.hp + s.infra + s.sec + s.agr) / 5 * 100).toFixed(1);
    const fi = Math.max(0, 100 - s.debt * 4 - s.cor * 40).toFixed(1);
    const ov = (parseFloat(di) * .3 + s.app * .3 + parseFloat(fi) * .2 + (100 - s.cor * 100) * .2).toFixed(1);
    const gr = ov > 75 ? "A" : ov > 60 ? "B" : ov > 45 ? "C" : ov > 30 ? "D" : "F";
    const gc = { A: CL.grn, B: "#84cc16", C: CL.org, D: CL.red, F: "#8b0000" }[gr];
    const canP = ov > 52 && s.app > 42 && (gEnd === "complete" || gEnd === "stepped_down");
    const canFctm = ov > 65 && s.app > 55 && s.cor < 0.25 && (gEnd === "complete" || gEnd === "stepped_down");
    const pa = PARTIES.find(p => p.id === party);
    const termsServed = gEnd === "defeated" || gEnd === "stepped_down" || gEnd === "pres_bid" ? "1 term (4 years)" : gEnd === "impeached" || gEnd === "bankrupt" ? "Partial term" : "2 terms (8 years)";
    const shareT = "🇳🇬 I governed " + state.replace("_", " ") + " in #SeatOfPower!\nGrade: " + gr + " (" + ov + ")\nApproval: " + Math.round(s.app) + "%\n" + (gEnd === "impeached" ? "⚠️ IMPEACHED!" : gEnd === "defeated" ? "❌ Lost re-election!" : gEnd === "complete" ? "✅ Completed 2 terms!" : gEnd === "stepped_down" ? "🏛️ Stepped down after 1 term" : gEnd === "pres_bid" ? "🇳🇬 Resigned to run for PRESIDENT!" : "");

    // ── BUILD DETAILED WIKI BIOGRAPHY FROM ACTUAL GAMEPLAY ──
    const allCompleted = [...completedProjects];
    // Also count bills passed as achievements
    billsPassed.forEach(b => { if (!allCompleted.find(c => c.nm === b.nm)) allCompleted.push({ nm: b.nm, desc: b.d, turn: 0, cost: b.cost || 0 }); });
    // Fallback: also check logs for any completions not in the array
    logs.filter(l => l.tp === "success" && l.tx.includes("PROJECT COMPLETE")).forEach(l => {
      const name = l.tx.replace("✅ PROJECT COMPLETE: ", "").split(" — ")[0];
      if (!allCompleted.find(c => c.nm === name)) allCompleted.push({ nm: name, desc: "Completed", turn: l.t, cost: 0 });
    });
    const completedPolicies = allCompleted.map(p => p.nm);
    const completedDescs = allCompleted.map(p => p.nm + " (" + p.desc + ")");
    const scandals = logs.filter(l => l.tp === "scandal").map(l => l.tx.replace("💀 ", ""));
    const dilemmasFaced = logs.filter(l => l.tp === "dilemma").map(l => l.tx.replace("⚖️ ", ""));
    const constViolations = logs.filter(l => l.tx.includes("SUPREME COURT STRIKES DOWN")).length;
    const constReversals = logs.filter(l => l.tx.includes("reverses unconstitutional")).length;
    const firedCom = logs.filter(l => l.tx.includes("Fired")).length;
    const crisisEvents = logs.filter(l => l.tp === "crisis").map(l => l.tx);
    const reElected = logs.some(l => l.tx.includes("RE-ELECTED"));
    const houseRejections = logs.filter(l => l.tx.includes("REJECTS") || l.tx.includes("FORCED through")).length;
    const housePasses = logs.filter(l => l.tx.includes("Appropriation Bill PASSED")).length;
    const usedFlagship = logs.some(l => l.tp === "flagship");

    // Approval trend narrative
    const appStart = appH[0] || 55;
    const appEnd = appH[appH.length - 1] || Math.round(s.app);
    const appPeak = Math.max(...appH);
    const appLow = Math.min(...appH);
    const appTrend = appEnd > appStart + 10 ? "rose steadily" : appEnd < appStart - 10 ? "declined significantly" : "fluctuated";

    // Personas narrative
    const happyPersonas = PERSONAS.filter(p => (pApp[p.id] || 50) >= 65);
    const angryPersonas = PERSONAS.filter(p => (pApp[p.id] || 50) < 35);

    // Stakeholder narrative
    const happyStk = STAKEHOLDERS.filter(x => (skApp[x.id] || 50) >= 65);
    const angryStk = STAKEHOLDERS.filter(x => (skApp[x.id] || 50) < 35);

    // Build sections
    const wikiIntro = pName + " served as Governor of " + state.replace("_", " ") + " State, Nigeria, on the platform of the " + (pa?.nm || party) + ". " + (depGov ? "The deputy governor was " + depGov.nm + ", a " + depGov.bg.toLowerCase() + " described as \"" + depGov.desc.split(".")[0].toLowerCase() + ".\" " : "") + (gEnd === "impeached" ? "The tenure was cut short by impeachment proceedings initiated by the State House of Assembly under Section 188 of the 1999 Constitution." : gEnd === "defeated" ? "After completing one four-year term, " + pName + " lost the re-election bid, leaving office with an approval rating of " + Math.round(s.app) + "%." : gEnd === "stepped_down" ? "After one term, " + pName + " chose not to seek re-election, announcing a decision to step down voluntarily — a rare move in Nigerian politics that was seen by supporters as principled and by critics as a sign of fatigue." : gEnd === "pres_bid" ? pName + " served one term before resigning the governorship to contest the presidential election, seeking to leverage a strong governance record into national leadership." : "The governor served the full constitutional maximum of two four-year terms (Section 182), departing office with an approval rating of " + Math.round(s.app) + "%.");

    const wikiEarlyTenure = "Upon taking office, " + state.replace("_", " ") + " State had a literacy rate of " + Math.round(STATES[state].lit * 100) + "%, infrastructure index of " + Math.round(STATES[state].infra * 100) + "%, and security rating of " + Math.round(STATES[state].sec * 100) + "%. The state's Internally Generated Revenue stood at " + naira(STATES[state].igr) + " with FAAC allocation of " + naira(STATES[state].faac) + ". Key challenges included " + (STATES[state].issues || []).join(", ") + ".";

    const wikiPolicies = allCompleted.length > 0 ? "The administration successfully delivered " + allCompleted.length + " major " + (allCompleted.length === 1 ? "initiative" : "initiatives") + ": " + completedDescs.slice(0, 6).join("; ") + (allCompleted.length > 6 ? "; among others" : "") + "." + (allCompleted.reduce((s2, p) => s2 + p.cost, 0) > 0 ? " Total investment exceeded " + naira(allCompleted.reduce((s2, p) => s2 + p.cost, 0)) + "." : "") + (nRef > 0 ? " Anti-corruption and digital governance reforms aimed to improve transparency." : "") : "The administration failed to complete any major projects during its tenure — a damning indictment of either ambition or capacity.";
    const awardedProjects = (projects || []).filter(p => p.contractor);
    const activeProjects = (projects || []).filter(p => p.status && p.status !== "delivered");
    const liveProjectSpend = awardedProjects.reduce((sum, p) => sum + (p.cost || p.baseCost || 0), 0);
    const wikiProjects = (projects && projects.length) ? "Beyond broad policies, the administration initiated " + projects.length + " capital project" + (projects.length === 1 ? "" : "s") + ". " + (awardedProjects.length ? "Contracts were awarded for " + awardedProjects.slice(0, 6).map(p => p.title + " to " + (p.contractor || "an unnamed contractor") + (p.method ? " via " + p.method : "") + (p.cost ? " at " + naira(p.cost) : "")).join("; ") + (awardedProjects.length > 6 ? "; among others" : "") + ". " : "Several projects remained at pre-procurement stage, drawing criticism over slow implementation. ") + (liveProjectSpend ? "Total awarded project value stood at approximately " + naira(liveProjectSpend) + ". " : "") + (activeProjects.length ? activeProjects.length + " project" + (activeProjects.length === 1 ? " was" : "s were") + " still active, suspended, abandoned, or awaiting procurement at the close of this record. " : "") + ((projects || []).some(p => p.nepotism) ? "At least one contract carried nepotism or beneficial-ownership concerns, later cited by civil society groups." : "") : "No separately tracked capital projects were initiated through the procurement portfolio.";
    const wikiInvestors = investorsApproved.length > 0 ? "The administration attracted " + investorsApproved.length + " major private investment(s), including " + investorsApproved.map(id => INVESTORS.find(inv => inv.id === id)?.nm || id).slice(0, 4).join(", ") + ". Total jobs created from private investment: " + investorsApproved.reduce((sum, id) => { const inv = INVESTORS.find(x => x.id === id); return sum + (inv?.jobs || 0); }, 0).toLocaleString() + "." : "The administration failed to attract significant private investment — a missed opportunity for job creation and economic diversification.";
    const narrObj = NARRATIVES.find(n => n.id === narrative) || NARRATIVES[7];
    const wikiNarrative = "By the end of the tenure, " + pName + " was widely perceived as \"" + narrObj.nm + "\" " + narrObj.icon + " — " + (narrative === "technocrat" ? "a data-driven administrator who prioritised evidence over politics." : narrative === "corrupt" ? "a governor whose administration was marred by persistent corruption allegations." : narrative === "strongman" ? "a decisive leader who kept order through force of personality and security apparatus." : narrative === "populist" ? "a governor who was loved by the masses despite questions about institutional discipline." : narrative === "builder" ? "a governor remembered for physical infrastructure that transformed the state." : narrative === "reformer" ? "a rare governor who left institutions stronger than they found them." : narrative === "weak" ? "a governor who struggled to maintain control and was seen as ineffective." : "a political survivor who navigated crises without ever fully thriving.");
    const wikiEFCC = s.cor > .55 ? "Following departure from office, " + pName + " was arrested by the Economic and Financial Crimes Commission (EFCC) within 72 hours. With the expiration of gubernatorial immunity under Section 308 of the 1999 Constitution, the former governor faced multiple charges of financial misconduct. Bank accounts were frozen, properties traced, and several former commissioners were also detained for questioning. The case is pending at the Federal High Court." : s.cor > .45 ? "After leaving office, the EFCC opened a formal investigation into the financial dealings of the " + pName + " administration. Several bank accounts linked to the former governor and associates were placed under surveillance. No formal charges have been filed as at the time of writing, but the investigation remains active." : s.cor > .35 ? "The EFCC placed the former governor on a financial watchlist following departure from office, citing an elevated corruption index during the administration. No charges were filed." : "The former governor left office with a clean financial record. No investigations or charges were pursued by anti-corruption agencies.";
    const wikiConst = (constViolations > 0 || constReversals > 0) ? "The administration attempted " + (constViolations + constReversals) + " action(s) that violated the Constitution." + (constViolations > 0 ? " In " + constViolations + " case(s), the governor chose to fight the Federal Government in the Supreme Court and lost — a public humiliation that raised questions about the governor's understanding of federalism and the limits of state power." : "") + (constReversals > 0 ? " In " + constReversals + " case(s), the governor wisely reversed the order before it reached the Supreme Court." : "") : "";

    const wikiInfra = "By the end of the tenure, the state's infrastructure index " + (s.infra > STATES[state].infra + .1 ? "had improved significantly from " + Math.round(STATES[state].infra * 100) + "% to " + Math.round(s.infra * 100) + "%" : s.infra > STATES[state].infra ? "saw modest improvement to " + Math.round(s.infra * 100) + "%" : "remained largely unchanged at " + Math.round(s.infra * 100) + "%" + (s.infra < STATES[state].infra ? ", actually declining from the inherited " + Math.round(STATES[state].infra * 100) + "%" : "")) + ". Literacy " + (s.lit > STATES[state].lit + .05 ? "improved to " + Math.round(s.lit * 100) + "% from " + Math.round(STATES[state].lit * 100) + "%" : "remained at approximately " + Math.round(s.lit * 100) + "%") + ". Healthcare access " + (s.hp > STATES[state].hp + .05 ? "expanded notably" : "showed limited change") + ", while agricultural output " + (s.agr > STATES[state].agr + .05 ? "grew under targeted investment" : "remained relatively stagnant") + ".";

    const wikiSecurity = "Security, a " + (STATES[state].sec < .4 ? "critical challenge inherited by the administration" : "manageable situation at the start of the tenure") + ", " + (s.sec > STATES[state].sec + .1 ? "improved substantially under dedicated investment and community policing initiatives." : s.sec > STATES[state].sec ? "saw some improvement." : s.sec < STATES[state].sec ? "actually deteriorated during the tenure, drawing criticism from civil society organizations." : "remained largely unchanged.");

    const wikiCrises = dilemmasFaced.length > 0 || crisisEvents.length > 0 ? "The administration faced " + (dilemmasFaced.length + crisisEvents.length) + " significant " + (dilemmasFaced.length + crisisEvents.length === 1 ? "crisis" : "crises") + " during its tenure" + (dilemmasFaced.length > 0 ? ", including: " + dilemmasFaced.slice(0, 4).map(d => d.split(" → ")[0]).join("; ") : "") + ". " + (usedFlagship ? "At one point, approval dropped so low that the governor deployed an emergency flagship policy intervention to restore public confidence. " : "") + (impSurv ? "Most dramatically, the governor survived impeachment proceedings — a testament to political resilience but also an indicator of the depth of the governance crisis." : "") : "The tenure was relatively uneventful in terms of major crises.";

    const wikiCorr = scandals.length > 0 ? "The administration was dogged by " + scandals.length + " corruption " + (scandals.length === 1 ? "scandal" : "scandals") + ", with civil society groups estimating that approximately " + naira(corW) + " in public funds were diverted or misappropriated. " + (s.cor > .5 ? "By the end of the tenure, corruption had become a defining feature of the administration, with international watchdogs flagging " + state.replace("_", " ") + " State as a case study in governance failure." : s.cor > .3 ? "While not the worst in the country, the corruption record tarnished an otherwise mixed legacy." : "However, the administration took corrective action and corruption levels remained moderate overall.") : s.cor < .15 ? "The administration was widely praised for its clean governance. Anti-corruption initiatives were implemented early, and the governor maintained a reputation for fiscal transparency throughout the tenure. This stands as a model for other states." : s.cor < .3 ? "The administration maintained a relatively clean record, though not entirely free of controversy." : "Despite no major scandals breaking publicly, corruption indicators suggest systemic issues in procurement and contract management that were not adequately addressed.";

    const cabScandals = logs.filter(l => l.tx.includes("SCANDAL:") && l.tx.includes("Commissioner")).length;
    const cabLeaks = logs.filter(l => l.tx.includes("LEAK:")).length;
    const cabAchievements = logs.filter(l => l.tx.includes("🌟")).length;
    const activeCabinet = ministries && ministries.length ? ministries : [];
    const wikiCabinet = activeCabinet.length ? "The governor's cabinet consisted only of the Executive Council ministries personally convened during the tenure: " + activeCabinet.map(m => m.name + " under Hon. " + m.minister).slice(0, 8).join("; ") + (activeCabinet.length > 8 ? "; among others" : "") + ". " + (firedCom > 0 ? "The council saw " + firedCom + " reshuffle(s), with commissioners fired or replaced directly by the governor. " : "No major commissioner dismissal was recorded. ") + (cabScandals > 0 ? "The administration was marred by " + cabScandals + " ministry-level corruption scandal(s), raising questions about appointment judgment. " : "") + (cabLeaks > 0 ? "Notably, " + cabLeaks + " instance(s) of cabinet disloyalty saw commissioners briefing the opposition, undermining executive cohesion. " : "") + (cabAchievements > 0 ? "On the positive side, competent ministries delivered " + cabAchievements + " notable achievement(s), including programme launches and successful policy implementations that boosted development metrics. " : "") + (houseRejections > 0 ? "Relations with the House of Assembly were contentious — the legislature rejected budget proposals on " + houseRejections + " occasion(s)." : housePasses > 0 ? "Budget relations with the House of Assembly were generally cooperative." : "") : "No Executive Council ministries were formally convened, leaving the administration without an actionable cabinet structure.";

    const wikiPeople = happyPersonas.length > 0 || angryPersonas.length > 0 ? "Public sentiment varied significantly across demographic groups. " + (happyPersonas.length > 0 ? "Groups that benefited most included " + happyPersonas.slice(0, 3).map(p => p.nm).join(", ") + ". " : "") + (angryPersonas.length > 0 ? "However, " + angryPersonas.slice(0, 3).map(p => p.nm).join(", ") + " expressed deep dissatisfaction with the administration's priorities. " : "") + "Approval " + appTrend + " over the tenure, peaking at " + appPeak + "% and hitting a low of " + appLow + "%." : "Public approval " + appTrend + " over the course of the tenure.";

    const stakeStrikes = logs.filter(l => l.tx.includes("STRIKE")).length;
    const stakeProtests = logs.filter(l => l.tx.includes("PROTEST") || l.tx.includes("YOUTH PROTEST")).length;
    const stakePullouts = logs.filter(l => l.tx.includes("PULLOUT") || l.tx.includes("BUSINESS PULLOUT")).length;
    const wikiStk = (angryStk.length > 0 || happyStk.length > 0 || stakeStrikes > 0) ? (happyStk.length > 0 ? "The " + happyStk.map(x => x.nm.toLowerCase()).join(", ") + " maintained strong support for the administration. " : "") + (angryStk.length > 0 ? "However, relations with the " + angryStk.map(x => x.nm.toLowerCase()).join(", ") + " were deeply strained. " : "") + (stakeStrikes > 0 ? "The tenure saw " + stakeStrikes + " worker strike(s) that paralyzed government services. " : "") + (stakeProtests > 0 ? "Youth-led protests erupted " + stakeProtests + " time(s), reflecting widespread frustration among young people. " : "") + (stakePullouts > 0 ? "Business investment contracted as investors pulled out " + stakePullouts + " time(s) due to governance concerns." : "") : "";

    const wikiFiscal = "Fiscally, the state's debt " + (s.debt > 15 ? "ballooned to " + naira(s.debt) + ", raising concerns about the sustainability of the administration's spending patterns and the burden on future administrations." : s.debt > 5 ? "rose to " + naira(s.debt) + ", though within manageable limits." : "was kept under control at " + naira(s.debt) + ", reflecting fiscal discipline.") + " IGR " + (s.igr > STATES[state].igr * 1.2 ? "grew from " + naira(STATES[state].igr) + " to " + naira(s.igr) + ", a sign that economic reforms were bearing fruit." : "did not see significant growth from its initial " + naira(STATES[state].igr) + " baseline.");

    const wikiLegacy = ov > 70 ? "Historians and political analysts widely regard " + pName + "'s tenure as one of the most transformative in " + state.replace("_", " ") + " State's history. The combination of infrastructure development, clean governance, and strong public approval set a standard that successors would be measured against. Young politicians across Nigeria point to this administration as proof that good governance is possible." : ov > 55 ? pName + " left a generally positive legacy, with notable achievements in governance that improved the lives of many residents. While not without flaws, the administration demonstrated that competent leadership can make meaningful progress even within Nigeria's challenging federal system." : ov > 40 ? "The legacy of " + pName + "'s administration remains contested. Supporters point to specific policy achievements, while critics argue that the governor failed to fully capitalize on the state's potential. " + (s.cor > .3 ? "Corruption allegations further complicated the historical assessment." : "The governor's relatively clean record, however, stands as a positive note.") + " For young Nigerians studying governance, this tenure illustrates how even well-intentioned leadership can produce mixed results when structural challenges are not addressed." : "Political commentators largely view " + pName + "'s time in office as a cautionary tale. " + (s.cor > .4 ? "Corruption eroded public trust and diverted resources from critical needs." : "Despite relatively low corruption,") + " the administration's failure to meaningfully improve key development indicators left the state in a position not significantly better than where it started. For students of governance, this tenure demonstrates how quickly a mandate can be squandered" + (gEnd === "impeached" ? " — culminating in the humiliation of impeachment, a stain that follows a political career permanently." : gEnd === "defeated" ? " — as evidenced by the voters' decisive rejection at the polls." : ".");

    if (showWiki) return (
      <div style={{ minHeight: "100%", background: "#f6f6f6", padding: "43px" }}>
        <Flag />
        <div style={{ maxWidth: 1344, margin: "58px auto", background: "#fff", border: "1px solid #a7d7a7", fontFamily: "Georgia,serif" }}>
          <div style={{ padding: "43px 58px", borderBottom: "1px solid #a7d7a7" }}>
            <h1 style={{ fontSize: TS(79), fontWeight: 400, margin: 1, color: "#333" }}>{pName}</h1>
            <div style={{ fontSize: TS(36), color: "#666", marginTop: 7 }}>From Wikipedia, the free encyclopedia</div>
          </div>
          <div style={{ float: "right", width: 426, margin: 36, border: "1px solid #a7d7a7", fontSize: TS(36), background: "#f8fff8" }}>
            <div style={{ background: CL.grn, color: "#fff", padding: 19, textAlign: "center", fontWeight: 700, fontSize: TS(38) }}>{pName}</div>
            {(() => { const av = AVATARS.find(a => a.id === setup?.avatar); return av ? <div style={{ padding: "29px 0", background: "#f0f8f0", textAlign: "center" }}><img src={AVATAR_IMGS[av.id]} alt={av.label} style={{ width: 192, height: "auto", borderRadius: 17 }} /></div> : null; })()}
            <div style={{ padding: 22 }}>
              {[["Office", "Governor of " + state.replace("_", " ")], ["Party", pa?.nm || party], ["Deputy", depGov ? depGov.nm : "N/A"], ["Term", termsServed], ["Policies", completedPolicies.length + " completed"], ["Crises", (dilemmasFaced.length + crisisEvents.length) + " faced"], ["Score", ov + "/100 (" + gr + ")"], ["Peak Approval", appPeak + "%"], ["Final Approval", Math.round(s.app) + "%"], ["Debt", naira(s.debt)], ["Outcome", gEnd === "complete" ? "Full tenure" : gEnd === "defeated" ? "Lost re-election" : gEnd === "impeached" ? "Impeached" : gEnd === "stepped_down" ? "Voluntarily stepped down" : gEnd === "pres_bid" ? "Resigned for presidency" : "N/A"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", padding: "7px 0", borderBottom: "1px solid #e0e0e0" }}>
                  <span style={{ fontWeight: 700, width: 192, color: "#333", fontSize: TS(34) }}>{k}</span>
                  <span style={{ color: "#555", fontSize: TS(34) }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "43px 58px", fontSize: TS(43), lineHeight: 1.75, color: "#333" }}>
            <p>{wikiIntro}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Early Tenure & Inherited Challenges</h3>
            <p>{wikiEarlyTenure}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Policy Achievements</h3>
            <p>{wikiPolicies}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Infrastructure & Development</h3>
            <p>{wikiInfra}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Capital Projects & Procurement</h3>
            <p>{wikiProjects}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Security</h3>
            <p>{wikiSecurity}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Crises & Controversies</h3>
            <p>{wikiCrises}</p>

            {(scandals.length > 0 || s.cor > .25) && <div><h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Corruption & Accountability</h3><p>{wikiCorr}</p></div>}

            {wikiConst && <div><h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Constitutional Violations</h3><p>{wikiConst}</p></div>}

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Cabinet & Legislative Relations</h3>
            <p>{wikiCabinet}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Public Perception</h3>
            <p>{wikiPeople}</p>
            {wikiStk && <p>{wikiStk}</p>}

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Public Perception & Legacy</h3>
            <p>{wikiNarrative}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Private Investment & Economic Development</h3>
            <p>{wikiInvestors}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Post-Office & EFCC</h3>
            <p>{wikiEFCC}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Fiscal Record</h3>
            <p>{wikiFiscal}</p>

            <h3 style={{ fontSize: TS(53), borderBottom: "1px solid #aaa", marginTop: 58, color: "#333" }}>Legacy & Historical Assessment</h3>
            <p>{wikiLegacy}</p>

            <div style={{ clear: "both" }} />
            <div style={{ marginTop: 72, borderTop: "1px solid #ccc", paddingTop: 29, fontSize: TS(34), color: "#888" }}>
              Categories: Nigerian governors | {state.replace("_", " ")} State politicians | {pa?.id || party} members | {gr}-rated administrations{gEnd === "impeached" ? " | Impeached Nigerian governors" : gEnd === "defeated" ? " | One-term governors" : gEnd === "stepped_down" ? " | One-term governors | Voluntarily retired governors" : gEnd === "pres_bid" ? " | Presidential candidates | Former governors" : " | Two-term governors"}{s.cor > .4 ? " | Politicians involved in corruption controversies" : ""}{ov > 70 ? " | Transformative governors" : ""}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 43, display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
          <Bt onClick={() => {
            const bioText = "🇳🇬 WIKIPEDIA: " + pName + "\nGovernor of " + state.replace("_", " ") + " State (" + (pa?.id || party) + ")\n\n📊 Score: " + ov + "/100 (Grade " + gr + ")\n👥 Approval: " + Math.round(s.app) + "% (Peak: " + appPeak + "%)\n🏗️ Projects: " + allCompleted.length + " delivered\n" + (allCompleted.length > 0 ? "   " + allCompleted.slice(0, 3).map(p => "✅ " + p.nm).join("\n   ") + "\n" : "") + "💰 Debt: " + naira(s.debt) + "\n" + (constViolations > 0 ? "⚖️ " + constViolations + " Supreme Court loss(es)\n" : "") + (scandals.length > 0 ? "💀 " + scandals.length + " scandal(s)\n" : "🧼 Clean governance\n") + "\n" + wikiLegacy.split(".")[0] + ".\n\n#SeatOfPower #NigerianGovernance";
            navigator.clipboard?.writeText(bioText);
          }} v="secondary" style={{ fontSize: TS(34) }}>📖 Share Bio</Bt>
          <Bt onClick={() => navigator.clipboard?.writeText(shareT)} v="secondary" style={{ fontSize: TS(34) }}>📋 Copy</Bt>
          <Bt onClick={() => window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareT))} style={{ background: "#000", color: "#fff", fontSize: TS(34) }}>𝕏 Post</Bt>
          <Bt onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(shareT))} style={{ background: "#25D366", color: "#fff", fontSize: TS(34) }}>WhatsApp</Bt>
          <Bt v="ghost" onClick={() => setShowWiki(false)} style={{ fontSize: TS(34) }}>← Back</Bt>
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: "100%", background: CL.bg, padding: "58px 43px" }}>
        <Flag />
        <div style={{ maxWidth: 1272, margin: "58px auto", textAlign: "center" }}>
          {(gEnd === "impeached" || gEnd === "defeated") && <div style={{ fontSize: TS(113), marginBottom: 22 }}>{gEnd === "impeached" ? "😔" : "🗳️"}</div>}
          {gEnd === "stepped_down" && <div style={{ fontSize: TS(113), marginBottom: 22 }}>🏛️</div>}
          {gEnd === "pres_bid" && <div style={{ fontSize: TS(113), marginBottom: 22 }}>🇳🇬</div>}
          <h2 style={{ fontFamily: F.d, color: gEnd === "complete" ? CL.txt : gEnd === "pres_bid" ? CL.gold : gEnd === "stepped_down" ? CL.blu : CL.red, fontSize: TS(94), fontWeight: 700, margin: "0 0 14px" }}>
            {gEnd === "impeached" ? "IMPEACHED" : gEnd === "bankrupt" ? "STATE BANKRUPT" : gEnd === "defeated" ? "VOTED OUT" : gEnd === "stepped_down" ? "STEPPED DOWN" : gEnd === "pres_bid" ? "PRESIDENTIAL BID" : "Tenure Complete"}
          </h2>
          <p style={{ color: CL.tm, fontSize: TS(38), marginBottom: 14 }}>Gov. {pName} · {party} · {state.replace("_", " ")} · {termsServed}</p>
          {gEnd === "defeated" && <p style={{ color: CL.red, fontSize: TS(36), marginBottom: 29 }}>The people rejected your bid for a second term.</p>}
          {gEnd === "complete" && <p style={{ color: CL.grn, fontSize: TS(36), marginBottom: 29 }}>You served the full 8 years — two complete terms.</p>}
          {gEnd === "stepped_down" && <p style={{ color: CL.blu, fontSize: TS(36), marginBottom: 29 }}>You chose not to seek re-election. A principled decision — or was it strategic?</p>}
          {gEnd === "pres_bid" && <p style={{ color: CL.gold, fontSize: TS(36), marginBottom: 29 }}>You resigned the governorship to pursue the presidency of Nigeria.</p>}
          <div style={{ display: "flex", justifyContent: "center", gap: 36, marginBottom: 58, flexWrap: "wrap" }}>
            <Cd style={{ minWidth: 192, textAlign: "center" }}><div style={{ fontSize: TS(102), fontFamily: F.d, color: gc, fontWeight: 700 }}>{gr}</div><div style={{ fontSize: TS(29), color: CL.td }}>GRADE</div></Cd>
            <Cd style={{ minWidth: 192, textAlign: "center" }}><div style={{ fontSize: TS(72), fontFamily: F.m, color: CL.gold }}>{ov}</div><div style={{ fontSize: TS(29), color: CL.td }}>SCORE</div></Cd>
            <Cd style={{ minWidth: 192, textAlign: "center" }}><div style={{ fontSize: TS(72), fontFamily: F.m, color: s.app > 50 ? CL.grn : CL.red }}>{Math.round(s.app)}%</div><div style={{ fontSize: TS(29), color: CL.td }}>APPROVAL</div></Cd>
          </div>
          <Spark data={appH} color={s.app > 50 ? CL.grn : CL.red} w={180} h={32} />
          <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap", margin: "43px 0" }}>
            <Bt onClick={() => setShowWiki(true)}>📖 Wikipedia Bio</Bt>
            <Bt onClick={() => navigator.clipboard?.writeText(shareT)} v="secondary" style={{ fontSize: TS(34) }}>📋 Copy</Bt>
            <Bt onClick={() => window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareT))} style={{ background: "#000", color: "#fff", fontSize: TS(34) }}>𝕏</Bt>
            <Bt onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(shareT))} style={{ background: "#25D366", color: "#fff", fontSize: TS(34) }}>WhatsApp</Bt>
          </div>
          {gEnd === "complete" && (
            <Cd style={{ borderColor: CL.grn + "44" }}>
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 22px", fontSize: TS(50), fontWeight: 600 }}>What Next?</h3>
              <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
                <Bt v="secondary" onClick={() => onEnd("retire", s)}>🏡 Retire</Bt>
                <Bt v="secondary" onClick={() => onEnd("senate", s)}>🏛️ Senate</Bt>
                <Bt onClick={() => onEnd("president", s)} disabled={!canP}>🇳🇬 President</Bt>
              </div>
              {!canP && <div style={{ color: CL.red, fontSize: TS(29), marginTop: 14 }}>Need 52+ score and 42%+ approval for presidency.</div>}
              {canFctm && (
                <div style={{ marginTop: 43, padding: 36, background: "linear-gradient(135deg," + CL.gold + "18," + CL.grn + "12)", border: "2px solid " + CL.gold, borderRadius: 17 }}>
                  <div style={{ fontSize: TS(79), textAlign: "center", marginBottom: 14 }}>📜✨</div>
                  <div style={{ fontSize: TS(34), color: CL.gold, fontFamily: F.m, fontWeight: 700, textAlign: "center", letterSpacing: 2 }}>OFFICIAL LETTER FROM ASO ROCK</div>
                  <div style={{ fontSize: TS(38), color: CL.txt, fontWeight: 600, textAlign: "center", margin: "14px 0" }}>Minister of the Federal Capital Territory</div>
                  <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.4, textAlign: "center", marginBottom: 29, fontStyle: "italic" }}>
                    "In recognition of your exemplary service to {state?.replace("_"," ")} — an approval rating of {Math.round(s.app)}%, a corruption index of just {(s.cor*100).toFixed(0)}%, and a legacy grade of {gr} — Mr. President is pleased to offer you the portfolio of Minister of the FCT. Kindly indicate acceptance."
                  </div>
                  <div style={{ display: "flex", gap: 22, justifyContent: "center" }}>
                    <Bt onClick={() => onEnd("fctm", s)} style={{ background: CL.gold, color: "#111" }}>✅ Accept FCT Portfolio</Bt>
                    <Bt v="secondary" onClick={() => onEnd("retire", s)}>Decline (Retire)</Bt>
                  </div>
                </div>
              )}
            </Cd>
          )}
          {gEnd === "defeated" && (
            <Cd style={{ borderColor: CL.org + "44" }}>
              <p style={{ color: CL.td, fontSize: TS(36), margin: "0 0 29px" }}>You lost re-election. No second term, no Senate, no presidency.</p>
              <Bt v="secondary" onClick={() => onEnd("retire", s)}>🏡 Retire as One-Term Governor</Bt>
            </Cd>
          )}
          {gEnd === "stepped_down" && (
            <Cd style={{ borderColor: CL.blu + "44" }}>
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 22px", fontSize: TS(50), fontWeight: 600 }}>What Next?</h3>
              <p style={{ color: CL.td, fontSize: TS(36), marginBottom: 29 }}>You stepped down voluntarily. Your record speaks for itself.</p>
              <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
                <Bt v="secondary" onClick={() => onEnd("retire", s)}>🏡 Retire</Bt>
                <Bt v="secondary" onClick={() => onEnd("senate", s)}>🏛️ Run for Senate</Bt>
                <Bt onClick={() => onEnd("president", s)} disabled={!canP}>🇳🇬 Run for President</Bt>
              </div>
              {!canP && <div style={{ color: CL.red, fontSize: TS(29), marginTop: 14 }}>Need 52+ score and 42%+ approval for presidency.</div>}
            </Cd>
          )}
          {gEnd === "pres_bid" && (
            <Cd style={{ borderColor: CL.gold + "44" }}>
              <h3 style={{ fontFamily: F.d, color: CL.gold, margin: "0 0 22px", fontSize: TS(50), fontWeight: 600 }}>The Race for Aso Rock</h3>
              <p style={{ color: CL.td, fontSize: TS(36), marginBottom: 29 }}>You've resigned the governorship. The national campaign begins. Your record will be scrutinized like never before.</p>
              <Bt onClick={() => onEnd("president", s)}>🇳🇬 ENTER PRESIDENTIAL RACE →</Bt>
            </Cd>
          )}
          {(gEnd === "impeached" || gEnd === "bankrupt") && <Bt onClick={() => onEnd("restart", s)} style={{ marginTop: 36 }}>PLAY AGAIN</Bt>}

          {/* EFCC ARREST — if leaving office with high corruption, you lose immunity */}
          {(gEnd === "impeached" || gEnd === "defeated" || gEnd === "stepped_down" || gEnd === "bankrupt" || gEnd === "complete") && s.cor > .35 && (
            <Cd style={{ borderColor: CL.red, marginTop: 43, background: "#fff5f5" }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ fontSize: TS(98), marginBottom: 14 }}>🚔⚖️</div>
                <div style={{ background: CL.red, color: "#fff", display: "inline-block", padding: "10px 43px", borderRadius: 8, fontSize: TS(29), fontWeight: 700, letterSpacing: 5, marginBottom: 22 }}>POST-OFFICE CONSEQUENCES</div>
                <h3 style={{ fontFamily: F.d, color: CL.red, fontSize: TS(53), fontWeight: 700, margin: "14px 0" }}>
                  {s.cor > .55 ? "EFCC ARRESTS FORMER GOVERNOR" : s.cor > .45 ? "EFCC OPENS INVESTIGATION" : "EFCC MONITORING YOUR FINANCES"}
                </h3>
              </div>
              <p style={{ fontSize: TS(36), color: CL.tm, lineHeight: 1.5, marginBottom: 22 }}>
                {s.cor > .55
                  ? "Within 72 hours of leaving office, the EFCC moved in. Your immunity under S.308 of the Constitution expired the moment you ceased to be governor. Operatives arrived at your residence with an arrest warrant. Your accounts have been frozen. Properties are being traced. The corruption index of your administration (" + Math.round(s.cor * 100) + "%) made you a priority target. You are now facing trial at the Federal High Court."
                  : s.cor > .45
                  ? "Three months after leaving office, the EFCC opened a formal investigation into your administration's finances. Your corruption index (" + Math.round(s.cor * 100) + "%) raised red flags. Bank accounts are being scrutinised. Former commissioners are being questioned. You have not been arrested — yet — but your lawyers are busy."
                  : "The EFCC has placed you on a watchlist. Your administration's corruption index (" + Math.round(s.cor * 100) + "%) is above the threshold for automatic review. No formal charges yet, but your financial movements are being monitored. This may affect your political future."}
              </p>
              <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 22 }}>
                {s.cor > .55 ? "📖 Under S.308, the President, Vice President, Governors and Deputy Governors enjoy immunity from criminal prosecution WHILE IN OFFICE. The moment you leave office — whether by impeachment, election loss, resignation, or term completion — that immunity expires. The EFCC, established by the EFCC Act 2004, has jurisdiction to investigate and prosecute financial crimes by former public officers." 
                  : "📖 S.308 immunity only applies while in office. Former governors can be investigated and prosecuted for financial crimes committed during their tenure."}
              </div>
              {s.cor > .55 && <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <Bg text="ARRESTED" color={CL.red} />
                <Bg text="Accounts frozen" color={CL.red} />
                <Bg text={"Corruption: " + Math.round(s.cor * 100) + "%"} color={CL.red} />
                <Bg text="S.308 immunity expired" color={CL.td} />
              </div>}
              {s.cor > .45 && s.cor <= .55 && <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <Bg text="Under investigation" color={CL.org} />
                <Bg text={"Corruption: " + Math.round(s.cor * 100) + "%"} color={CL.org} />
              </div>}
              {s.cor <= .45 && <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <Bg text="On watchlist" color={CL.org} />
                <Bg text={"Corruption: " + Math.round(s.cor * 100) + "%"} color={CL.org} />
              </div>}
            </Cd>
          )}
          {(gEnd === "impeached" || gEnd === "defeated" || gEnd === "stepped_down" || gEnd === "bankrupt" || gEnd === "complete") && s.cor <= .35 && (
            <Cd style={{ borderColor: CL.grn + "44", marginTop: 43 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TS(79), marginBottom: 7 }}>✨</div>
                <div style={{ fontSize: TS(36), color: CL.grn, fontWeight: 600 }}>Clean exit. EFCC has no interest in you.</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Corruption: {Math.round(s.cor * 100)}%. Your financial record is clean enough to avoid scrutiny. Your political future remains open.</div>
              </div>
            </Cd>
          )}
        </div>
      </div>
    );
  }

  // Four screens. Each keeps the existing pages (nav keys) as sub-tabs, so
  // anything that opens a page by key still works.
  const SCREENS = [
    { id: "desk", i: "🗂️", l: "Desk", subs: [{ k: "gov", l: "Govern" }, { k: "log", l: "News" }] },
    { id: "map", i: "🗺️", l: "Map", subs: [{ k: "econ", l: "Economy" }, { k: "prj", l: "Projects" }, { k: "proc", l: "Procurement" }] },
    { id: "people", i: "👥", l: "People", subs: [{ k: "cast", l: "Cast" }, { k: "cab", l: "Cabinet" }, { k: "min", l: "Ministries" }, { k: "cs", l: "Civil Service" }, { k: "coun", l: "Trad. Council" }, { k: "ppl", l: "Personas" }, { k: "stk", l: "Stakeholders" }] },
    { id: "wiki", i: "📖", l: "Wiki", subs: [{ k: "bio", l: "Wiki Bio" }, { k: "con", l: "Constitution" }] },
  ];
  const curScreen = SCREENS.find(sc => sc.subs.some(t => t.k === nav)) || SCREENS[0];
  navMemory.current[curScreen.id] = nav;
  const subBtn = (on, color) => ({ padding: "10px 26px", borderRadius: 21, border: "1px solid " + (on ? color : CL.bdr), background: on ? color + "12" : "transparent", color: on ? color : CL.td, fontSize: TS(31), fontFamily: F.b, cursor: "pointer", whiteSpace: "nowrap", flex: "0 0 auto" });

  return (
    <div style={{ minHeight: "100%", background: CL.bg }}>
      <Flag />
      <div style={{ padding: TALL() ? "20px 20px 190px" : 36, maxWidth: 1488, margin: "0 auto" }}>
        {/* Phone: one slim row pinned to the top. Name and turn on the left,
            approval on the right; tap it for the "State of the state" sheet.
            The ☰ menu holds Save, Help, text size and fullscreen. */}
        {TALL() && <div style={{ position: "sticky", top: 0, zIndex: 30, margin: "-20px -20px 16px", background: "#0f3d24", color: "#f3f7ef", boxShadow: "0 6px 18px rgba(0,0,0,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <button onClick={() => { setMenuOpen(o => !o); setSosOpen(false); }} aria-label="Menu" aria-expanded={menuOpen} style={{ width: 56, height: 56, minHeight: 56, borderRadius: 14, border: "1px solid rgba(255,255,255,.25)", background: menuOpen ? "rgba(255,255,255,.15)" : "transparent", color: "#f3f7ef", fontSize: TS(25), cursor: "pointer", flexShrink: 0 }}>☰</button>
            <button onClick={() => { setSosOpen(o => !o); setMenuOpen(false); }} aria-expanded={sosOpen} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "transparent", border: 0, color: "#f3f7ef", cursor: "pointer", padding: 0, minHeight: 56 }}>
              <div style={{ fontFamily: F.c, fontWeight: 800, fontSize: TS(20), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Gov. {pName.split(" ").pop()} · {state.replace("_", " ")}</div>
              <div style={{ fontSize: TS(20), opacity: .8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Turn {turn} of {MT} · {FLAGSHIP[setup?.agenda] ? FLAGSHIP[setup.agenda].i + " " + FLAGSHIP[setup.agenda].nm : "State of the state"} {sosOpen ? "▲" : "▼"}</div>
            </button>
            <div onClick={() => { setSosOpen(o => !o); setMenuOpen(false); }} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 999, background: s.app > 60 ? "#1f7a46" : s.app > 40 ? "#8a6400" : "#8b1a1a", fontFamily: F.m, fontWeight: 700, fontSize: TS(20), cursor: "pointer", whiteSpace: "nowrap" }}>Approval {Math.round(s.app)}%</div>
          </div>
          {sosOpen && <div style={{ padding: "4px 16px 16px", borderTop: "1px solid rgba(255,255,255,.12)" }}>
            {[
              ["Treasury this half-year", naira(tb)],
              ["State debt", naira(s.debt)],
              ["Party support", Math.round(s.pStab) + "%"],
              ["State economy (GDP)", naira(s.gdp || 0)],
              ["Corruption exposure", Math.round((s.cor || 0) * 100) + "%"],
            ].map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: TS(20) }}><span style={{ opacity: .8 }}>{k}</span><b style={{ fontFamily: F.m }}>{v}</b></div>)}
            <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
              {Array.from({ length: MT }).map((_, k) => <div key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < turn - 1 ? "#7ee2a8" : k === turn - 1 ? "#ffd166" : "rgba(255,255,255,.18)" }} />)}
              <span style={{ fontSize: TS(20), opacity: .8, marginLeft: 6, whiteSpace: "nowrap" }}>{yr.replace(/^.*Year/, "Year")}</span>
            </div>
          </div>}
          {menuOpen && <div style={{ padding: "4px 16px 14px", borderTop: "1px solid rgba(255,255,255,.12)", display: "grid", gap: 8 }}>
            {[
              ["💾 Save game", () => { saveGame(); try { window.SOP_toast && window.SOP_toast("Game saved", "ok"); } catch (e) {} }],
              ["📖 Help", () => onHelp()],
              ["Aa Text size", () => { try { const t = window.SOP_textScale(); window.SOP_textScale(t >= 1.3 ? 1 : t >= 1.15 ? 1.3 : 1.15); } catch (e) {} }],
              ["⛶ Fullscreen", () => { try { window.SOP_fullscreen && window.SOP_fullscreen(); } catch (e) {} }],
            ].map(([l, fn]) => <button key={l} onClick={() => { fn(); setMenuOpen(false); }} style={{ textAlign: "left", padding: "14px 16px", minHeight: 56, borderRadius: 14, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", color: "#f3f7ef", fontFamily: F.b, fontWeight: 700, fontSize: TS(20), cursor: "pointer" }}>{l}</button>)}
            <div style={{ fontSize: TS(20), opacity: .7, padding: "2px 4px" }}>The game also saves itself every turn.</div>
          </div>}
        </div>}
        {TALL() && curScreen.subs.length > 1 && <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -20px 16px", padding: "0 20px 2px" }}>
          {curScreen.subs.map(t => <button key={t.k} onClick={() => setNav(t.k)} style={{ flex: "0 0 auto", padding: "8px 18px", minHeight: 48, borderRadius: 999, border: "1px solid " + (nav === t.k ? CL.grn : CL.bdr), background: nav === t.k ? CL.grn : CL.card, color: nav === t.k ? "#fff" : CL.tm, fontFamily: F.c, fontWeight: 700, fontSize: TS(20), cursor: "pointer", whiteSpace: "nowrap" }}>{t.l}</button>)}
          {curScreen.id === "people" && <button onClick={() => { try { window.SOP_POLITICS && window.SOP_POLITICS.openPanel(); } catch (e) {} }} style={{ flex: "0 0 auto", padding: "8px 18px", minHeight: 48, borderRadius: 999, border: "1px solid " + CL.bdr, background: CL.card, color: CL.tm, fontFamily: F.c, fontWeight: 700, fontSize: TS(20), cursor: "pointer" }}>Standing</button>}
        </div>}
        {!TALL() && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: TS(29), letterSpacing: 7, color: CL.grn, fontFamily: F.m, textTransform: "uppercase", paddingRight: TALL() ? 140 : 0 }}>Gov. {pName} · {party} · {state.replace("_", " ")}</div>
            <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(65), margin: 1, fontWeight: 600 }}>{yr}</h2>
            {FLAGSHIP[setup?.agenda] && <div style={{ fontSize: TS(27), color: CL.grn, fontWeight: 700 }}>{FLAGSHIP[setup.agenda].i} Flagship: {FLAGSHIP[setup.agenda].nm}</div>}
          </div>
          <div style={TALL() ? { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px 10px", width: "100%", background: CL.card, border: "1px solid " + CL.bdr, borderRadius: 16, padding: "16px 10px" } : { display: "flex", gap: 29, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: TS(50), fontFamily: F.m, color: s.app > 60 ? CL.grn : s.app > 40 ? CL.org : CL.red }}>{Math.round(s.app)}%</div><div style={{ fontSize: TS(29), color: CL.td }}>APPR</div><Spark data={appH} color={s.app > 50 ? CL.grn : CL.red} w={50} h={14} /></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: TS(50), fontFamily: F.m, color: CL.gold }}>{naira(tb)}</div><div style={{ fontSize: TS(29), color: CL.td }}>BUDGET</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: TS(50), fontFamily: F.m, color: CL.blu }}>{naira(s.gdp || 0)}</div><div style={{ fontSize: TS(29), color: CL.td }}>GDP</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: TS(50), fontFamily: F.m, color: s.debt > 10 ? CL.red : CL.tm }}>{naira(s.debt)}</div><div style={{ fontSize: TS(29), color: CL.td }}>DEBT</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: TS(43), fontFamily: F.m, color: CL.pur }}>{turn}/{MT}</div><div style={{ fontSize: TS(29), color: CL.td }}>TURN</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: TS(38) }}>{(NARRATIVES.find(n => n.id === narrative) || NARRATIVES[7]).icon}</div><div style={{ fontSize: TS(29), color: CL.td }}>{(NARRATIVES.find(n => n.id === narrative) || NARRATIVES[7]).nm.split(" ").pop()}</div></div>
          </div>
        </div>
        <div style={{ height: 10, background: "#e0e5d5", borderRadius: 6, marginBottom: 29, overflow: "hidden" }}><div style={{ width: (turn / MT * 100) + "%", height: "100%", background: CL.grn, transition: "width .5s" }} /></div>
        </>}
        {!flagUsed && s.app < 50 && <div style={{ background: CL.org + "12", border: "1px solid " + CL.org + "30", borderRadius: 11, padding: "14px 36px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: TS(34), color: CL.org }}>⚠️ Approval below 50%</span><Bt v="danger" onClick={useFlagship} style={{ fontSize: TS(29), padding: "10px 36px" }}>🚀 FLAGSHIP</Bt></div>}
        {TALL() ? <div data-sop-nav className="sop-tabbar" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, padding: "10px 12px calc(14px + env(safe-area-inset-bottom, 0px))", background: "rgba(11,40,24,.96)", borderTop: "1px solid rgba(255,255,255,.12)", boxShadow: "0 -10px 28px rgba(0,0,0,.25)" }}>
          {SCREENS.map(sc => {
            const on = sc.id === curScreen.id;
            return <button key={sc.id} onClick={() => setNav(navMemory.current[sc.id] || sc.subs[0].k)} aria-pressed={on}
              style={{ border: 0, borderRadius: 16, padding: "10px 4px", background: on ? "#ffd166" : "transparent", color: on ? "#1a2e05" : "#e6efe2", fontFamily: F.c, fontWeight: 800, fontSize: TS(21), cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "background .2s" }}>
              <span style={{ fontSize: TS(32), lineHeight: 1 }}>{sc.i}</span>{sc.l}
            </button>;
          })}
        </div> : <div data-sop-nav style={{ position: "sticky", top: 0, zIndex: 20, background: CL.bg, margin: TALL() ? "0 -20px 22px" : "0 0 29px", padding: TALL() ? "8px 20px 10px" : "8px 0 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {SCREENS.map(sc => {
              const on = sc.id === curScreen.id;
              return <button key={sc.id} onClick={() => setNav(navMemory.current[sc.id] || sc.subs[0].k)} aria-pressed={on}
                style={{ padding: "14px 6px", borderRadius: 16, border: "2px solid " + (on ? CL.grn : CL.bdr), background: on ? CL.grn : CL.card, color: on ? "#fff" : CL.txt, fontFamily: F.c, fontWeight: 800, fontSize: TS(30), letterSpacing: .5, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: on ? "0 3px 0 rgba(0,0,0,.18)" : "none" }}>
                <span style={{ fontSize: TS(38), lineHeight: 1 }}>{sc.i}</span>{sc.l}
              </button>;
            })}
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: TALL() ? "nowrap" : "wrap", overflowX: TALL() ? "auto" : "visible", marginTop: 12, paddingBottom: 2 }}>
            {curScreen.subs.length > 1 && curScreen.subs.map(t => <button key={t.k} onClick={() => setNav(t.k)} style={subBtn(nav === t.k, CL.grn)}>{t.l}</button>)}
            {curScreen.id === "people" && <button onClick={() => { try { window.SOP_POLITICS && window.SOP_POLITICS.openPanel(); } catch (e) {} }} style={subBtn(false, CL.gold)}>Standing</button>}
            {curScreen.id === "wiki" && <button onClick={onHelp} style={subBtn(false, CL.grn)}>Help</button>}
            <button onClick={saveGame} style={{ ...subBtn(true, CL.teal), marginLeft: "auto" }}>💾 Save</button>
          </div>
        </div>}
        {(!TALL() || curScreen.id === "desk") && <ExecutiveCommandSA adviser={saOffice.adviser} brief={saBrief} inbox={saInbox} vacantTurns={Math.max(0, 3 - (turn - saOffice.firedTurn))} onFire={fireAdviser} />}

        <OL show={phase === "judiciary" && !!curCourt}>
          {curCourt && (() => {
            const stages = ["State High Court", "Court of Appeal", "Supreme Court"];
            const stageIcons = ["🏛️", "⚖️", "🏛️⚖️🏛️"];
            const stage = stages[courtStage] || stages[0];
            const winChance = Math.max(.15, curCourt.winChance - courtStage * .12); // harder to win at higher courts
            const won = Math.random() < winChance;

            return <Cd style={{ borderColor: CL.pur + "44" }}>
              <div style={{ textAlign: "center", marginBottom: 29 }}>
                <SceneArt bg="courtroom" h={TALL() ? 180 : 220} />
                <Bg text={stage} color={CL.pur} />
                <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(58), fontWeight: 600 }}>{curCourt.title}</h3>
                <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, textAlign: "left", marginBottom: 22 }}>{curCourt.desc}</p>
                <div style={{ background: CL.pur + "08", borderRadius: 8, padding: "14px 29px", marginBottom: 29, fontSize: TS(34), color: CL.pur }}>📖 Statute: {curCourt.statute}</div>
              </div>
              <div style={{ display: "grid", gap: 22 }}>
                {/* Fight the case */}
                <Cd onClick={() => {
                  if (won) {
                    addL("⚖️ " + stage + ": CASE DISMISSED! Court ruled in your favour.", "policy");
                    showResult({ icon: "⚖️", title: stage + " — You Win!", narrative: "The court dismissed the case. Your administration's position is upheld. But the legal challenge sent a signal — people are watching.", effects: [
                      { icon: "✅", text: "Case dismissed in your favour", value: "WON", good: true },
                      { icon: "📈", text: "Legal vindication boosts confidence", value: "+3 approval", good: true },
                    ], tone: "good", nextFn: () => { setCurCourt(null); setCourtStage(0); setS(p => ({ ...p, app: cl100(p.app + 3) })); nextEvent(); } });
                  } else {
                    if (courtStage < 2) {
                      addL("⚖️ " + stage + ": RULING AGAINST YOU. " + (courtStage === 0 ? "You can appeal." : "Final appeal available at Supreme Court."), "crisis");
                      showResult({ icon: "⚖️", title: stage + " — You Lose", narrative: "The court ruled against your administration citing " + curCourt.statute + ". You have the right to appeal to the " + stages[courtStage + 1] + ".", effects: [
                        { icon: "❌", text: "Court rules against you", value: "LOST", bad: true },
                        { icon: "📉", text: "Public confidence shaken", value: "-3 approval", bad: true },
                      ], tone: "bad", nextFn: () => { try { window.SOPX_onDecision && window.SOPX_onDecision("court_appealed", { ruling: curCourt.title, stage }); } catch(e){} try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"court_appeal", target: curCourt.title, gravity:2, evidence:2, approvalDelta:-3, note:"Appealed to "+stages[courtStage+1], meta:{ stage }}); } catch(e){} setCourtStage(cs => cs + 1); setS(p => ({ ...p, app: cl100(p.app - 3) })); setPhase("judiciary"); } });
                    } else {
                      // Supreme Court loss — must comply or defy
                      addL("⚖️ SUPREME COURT RULES AGAINST YOU. The highest court in the land has spoken.", "crisis");
                      showResult({ icon: "🏛️⚖️🏛️", title: "SUPREME COURT — Final Ruling Against You", narrative: "The Supreme Court of Nigeria has ruled against your administration. Under Section 287 of the 1999 Constitution, all authorities shall comply with decisions of the Supreme Court. This ruling is FINAL and BINDING.", effects: [
                        { icon: "❌", text: "Supreme Court rules against you", value: "FINAL", bad: true },
                        { icon: "📉", text: "Approval hit from legal defeat", value: "-5 approval", bad: true },
                        { icon: "📜", text: "You must now comply — or defy the Constitution", bad: true },
                      ], tone: "bad", nextFn: () => { setS(p => ({ ...p, app: cl100(p.app - 5) })); setPhase("court_defy"); } });
                    }
                  }
                }} style={{ padding: 36 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.pur, marginBottom: 10 }}>⚖️ Fight the Case at {stage}</div>
                  <div style={{ fontSize: TS(34), color: CL.td }}>Let your lawyers argue. Win chance: {Math.round(winChance * 100)}%. {courtStage < 2 ? "If you lose, you can appeal." : "This is FINAL. No further appeal."}</div>
                  <Bg text={Math.round(winChance * 100) + "% chance"} color={winChance > .45 ? CL.grn : CL.red} />
                </Cd>

                {/* Comply immediately — get partial refund for reversed action */}
                <Cd onClick={() => {
                  // Calculate refund — 60% of related policy/investment cost recovered (40% lost to legal fees + sunk costs)
                  let refund = 0;
                  let refundDesc = "";
                  if (curCourt.trigger === "investor_approved" && investorsApproved.length > 0) {
                    const lastInv = INVESTORS.find(inv => inv.id === investorsApproved[investorsApproved.length - 1]);
                    if (lastInv) { refund = lastInv.igrBoost * 0.4; refundDesc = "Land returned. Partial IGR from " + lastInv.co + " recovered minus legal costs."; }
                  }
                  if (curCourt.trigger === "policy_enacted" && pol.length > 0) {
                    const lastPol = pol[pol.length - 1];
                    refund = lastPol.c * 0.6; refundDesc = lastPol.nm + " reversed. ₦" + refund.toFixed(1) + "B of ₦" + lastPol.c + "B budget recovered. Rest lost to sunk costs.";
                    setPol(pp => pp.filter(p => p.id !== lastPol.id));
                  }
                  if (curCourt.trigger === "forced_budget") { refundDesc = "Budget must be re-submitted with House approval."; }
                  if (curCourt.trigger === "high_corruption") { refundDesc = "Procurement reforms mandated by court. Some recovered funds."; refund = 0.5; }
                  if (curCourt.trigger === "mining_approved") { refundDesc = "Mining license revoked. Land returned to communities."; }
                  setS(p => ({ ...p, app: cl100(p.app - 2), cor: cl(p.cor - .01), debt: Math.max(0, p.debt - refund) }));
                  addL("⚖️ Governor complies with " + stage + " ruling. Rule of law upheld." + (refund > 0 ? " ₦" + refund.toFixed(1) + "B recovered." : ""), "policy");
                  const efx = [
                    { icon: "📉", text: "Approval dips from reversal", value: "-2%", bad: true },
                    { icon: "✨", text: "Corruption reduced — rule of law signal", value: "-1%", good: true },
                    { icon: "📰", text: "Media praises respect for judiciary", good: true },
                  ];
                  if (refund > 0) efx.push({ icon: "💰", text: "Partial budget recovered (60% minus legal costs)", value: "+₦" + refund.toFixed(1) + "B", good: true });
                  if (refundDesc) efx.push({ icon: "📋", text: refundDesc });
                  try { window.SOPX_onDecision && window.SOPX_onDecision("court_complied", { ruling: curCourt.title, stage }); } catch(e){}
                  showResult({ icon: "⚖️", title: "Compliance — Rule of Law", narrative: "You chose to respect the court's authority. " + (refundDesc || "Some supporters are disappointed, but the legal community approves.") + " The state recovers what it can, but sunk costs and legal fees mean you don't get everything back.", effects: efx, tone: "neutral", nextFn: () => { setCurCourt(null); setCourtStage(0); setSkApp(p => ({ ...p, media: cl100((p.media || 50) + 6) })); nextEvent(); } });
                }} style={{ padding: 36 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.grn, marginBottom: 10 }}>✅ Comply with the Ruling</div>
                  <div style={{ fontSize: TS(34), color: CL.td }}>Accept the court's decision. Reverse your action. You'll recover ~60% of the spent budget (rest lost to legal fees and sunk costs). Corruption drops.</div>
                </Cd>
              </div>
            </Cd>;
          })()}
        </OL>

        {/* DEFY SUPREME COURT — catastrophic choice */}
        <OL show={phase === "court_defy"}>
          <Cd style={{ borderColor: CL.red }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(113), marginBottom: 14 }}>🏛️⚖️🏛️</div>
              <div style={{ background: CL.red, color: "#fff", display: "inline-block", padding: "10px 43px", borderRadius: 8, fontSize: TS(34), fontWeight: 700, letterSpacing: 5, marginBottom: 22 }}>CONSTITUTIONAL CRISIS</div>
              <h3 style={{ fontFamily: F.d, color: CL.red, fontSize: TS(65), fontWeight: 700 }}>Will You Obey the Supreme Court?</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, textAlign: "left", marginBottom: 22 }}>Section 287(1): "The decisions of the Supreme Court shall be enforced in any part of the Federation by all authorities and persons." Defying this ruling is a violation of the Constitution and grounds for impeachment under S.188.</p>
            </div>
            <div style={{ display: "grid", gap: 29 }}>
              <Cd onClick={() => {
                // Partial refund on compliance
                let refund = 0;
                if (curCourt?.trigger === "investor_approved" && investorsApproved.length > 0) {
                  const lastInv = INVESTORS.find(inv => inv.id === investorsApproved[investorsApproved.length - 1]);
                  if (lastInv) refund = lastInv.igrBoost * 0.4;
                }
                if (curCourt?.trigger === "policy_enacted" && pol.length > 0) {
                  refund = pol[pol.length - 1].c * 0.6;
                  setPol(pp => pp.slice(0, -1));
                }
                setS(p => ({ ...p, app: cl100(p.app - 3), debt: Math.max(0, p.debt - refund) }));
                setSkApp(p => ({ ...p, media: cl100((p.media || 50) + 8), business: cl100((p.business || 50) + 5) }));
                addL("⚖️ Governor obeys Supreme Court. Constitution upheld." + (refund > 0 ? " ₦" + refund.toFixed(1) + "B recovered." : ""), "policy");
                const efx2 = [
                  { icon: "📉", text: "Approval drops from policy reversal", value: "-3%", bad: true },
                  { icon: "📰", text: "Media and business stakeholders approve", good: true },
                  { icon: "✨", text: "Rule of law strengthened", good: true },
                ];
                if (refund > 0) efx2.push({ icon: "💰", text: "Partial budget recovered", value: "+₦" + refund.toFixed(1) + "B", good: true });
                showResult({ icon: "✅", title: "Rule of Law Prevails", narrative: "You complied with the Supreme Court's ruling. The legal community celebrates." + (refund > 0 ? " ₦" + refund.toFixed(1) + "B of your original investment was recovered — the rest was lost to sunk costs and legal fees." : ""), effects: efx2, tone: "good", nextFn: () => { setCurCourt(null); setCourtStage(0); nextEvent(); } });
              }} style={{ padding: 43, borderColor: CL.grn + "44" }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn }}>✅ Obey the Supreme Court</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Comply with the ruling. Reverse your action. Recover ~60% of budget spent. -3 approval, but rule of law preserved.</div>
              </Cd>

              <Cd onClick={() => {
                // CATASTROPHIC — approval crashes, impeachment territory
                setS(p => ({ ...p, app: cl100(Math.min(p.app, 32) - 15), pStab: cl100(p.pStab - 20), cor: cl(p.cor + .08) }));
                setSkApp(p => ({ ...p, media: cl100((p.media || 50) - 25), business: cl100((p.business || 50) - 20), youth: cl100((p.youth || 50) - 15) }));
                try { window.SOPX_onDecision && window.SOPX_onDecision("court_defied", { ruling: curCourt?.title || "Supreme Court ruling" }); } catch(e){}
                addL("🚨 GOVERNOR DEFIES SUPREME COURT! Constitutional crisis erupts.", "crisis");
                showResult({ icon: "🚨", title: "CONSTITUTIONAL CRISIS", narrative: "You have defied the Supreme Court of Nigeria. This is unprecedented. The National Assembly is discussing emergency intervention. The NBA has called for impeachment. International bodies are issuing statements. Your party leadership is in emergency session. Even your supporters are questioning whether you've crossed a line.", effects: [
                  { icon: "💥", text: "Approval CRASHES — capped at 32% then -15%", value: "-15%+", bad: true },
                  { icon: "🏛️", text: "Party stability collapses", value: "-20%", bad: true },
                  { icon: "💀", text: "Corruption surges from lawless image", value: "+8%", bad: true },
                  { icon: "📰", text: "Media turns hostile", value: "-25", bad: true },
                  { icon: "💼", text: "Business community flees", value: "-20", bad: true },
                  { icon: "⚠️", text: "IMPEACHMENT LIKELY next turn", bad: true },
                ], tone: "bad", nextFn: () => { setCurCourt(null); setCourtStage(0); nextEvent(); } });
              }} style={{ padding: 43, borderColor: CL.red }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.red }}>❌ DEFY the Supreme Court</div>
                <div style={{ fontSize: TS(34), color: CL.red, lineHeight: 1.4 }}>Refuse to comply. Continue your action despite the ruling. This will trigger a constitutional crisis. Your approval will be CAPPED at 32% and then drop a further 15%. Party stability -20. Impeachment almost certain.</div>
              </Cd>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "event_result" && !!eventResult}>
          {eventResult && <Cd style={{ borderColor: eventResult.tone === "good" ? CL.grn + "44" : eventResult.tone === "bad" ? CL.red + "44" : CL.bdr }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(113), marginBottom: 14 }}>{eventResult.icon}</div>
              <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(62), fontWeight: 600 }}>{eventResult.title}</h3>
            </div>
            {eventResult.narrative && <p style={{ fontSize: TS(38), color: CL.tm, lineHeight: 1.5, marginBottom: 29, textAlign: "center", fontStyle: "italic" }}>{eventResult.narrative}</p>}
            {eventResult.effects && eventResult.effects.length > 0 && <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: TS(29), fontFamily: F.m, color: CL.td, marginBottom: 14, letterSpacing: 2 }}>CONSEQUENCES</div>
              {eventResult.effects.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 0", borderBottom: "1px solid " + CL.bdr + "40" }}>
                  <span style={{ fontSize: TS(48), width: 72, textAlign: "center" }}>{e.icon}</span>
                  <span style={{ flex: 1, fontSize: TS(36), color: CL.tm }}>{e.text}</span>
                  <span style={{ fontSize: TS(36), fontFamily: F.m, fontWeight: 600, color: e.good ? CL.grn : e.bad ? CL.red : CL.tm }}>{e.value}</span>
                </div>
              ))}
            </div>}
            <Bt onClick={() => { const fn = eventResult.nextFn; setEventResult(null); if (fn) fn(); else nextEvent(); }}>CONTINUE →</Bt>
          </Cd>}
        </OL>

        <OL show={phase === "flagship" && !!FLAGSHIP[setup?.agenda]}>
          {phase === "flagship" && FLAGSHIP[setup?.agenda] && (() => {
            const FG = FLAGSHIP[setup.agenda];
            const year = Math.ceil(turn / 2);
            const cost = Math.round((1.4 + turn * 0.15) * 10) / 10;
            const done = (window.SOP_MEMORY ? window.SOP_MEMORY.all("flagship_milestone", e => e.meta && e.meta.delivered) : []).length;
            const pick = (opt) => {
              setS(p => ({ ...p, app: cl100(p.app + opt.app), cor: cl(p.cor + (opt.cor || 0)), debt: p.debt + (opt.debt || 0) }));
              addL(FG.i + " Flagship " + FG.nm + ": " + opt.log, opt.delivered ? "policy" : "political");
              try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind: "flagship_milestone", actor: "governor", gravity: opt.cor ? 2 : 1, evidence: 3, decision: opt.label, note: opt.log, approvalDelta: opt.app, corruptionDelta: Math.round((opt.cor || 0) * 100), relatedEntity: "flagship:" + setup.agenda, meta: { year, delivered: opt.delivered, corners: !!opt.cor, agenda: setup.agenda } }); } catch (e) {}
              nextEvent();
            };
            const opts = [
              { label: "Fund it in full", note: "₦" + cost + "B from borrowing. Done properly.", delivered: true, app: 4, debt: cost, log: "year " + year + " target met in full: " + FG.goal + "." },
              { label: "Cut corners to finish on time", note: "Half the money, a favoured contractor. It opens, but the work is thin.", delivered: true, app: 2, debt: Math.round(cost * 5) / 10, cor: .04, log: "year " + year + " target met on paper; the work is thin." },
              { label: "Push it to next year", note: "No new money. The people notice.", delivered: false, app: -3, log: "year " + year + " target missed and pushed back." },
            ];
            return <DecisionCard kicker={"Flagship · Year " + year} kickerColor={CL.grn}
              title={FG.i + " " + FG.nm}
              brief={"You promised to " + FG.goal + ". This year's share of that promise is due. " + (done ? "So far " + done + " of " + (year - 1) + " yearly targets delivered." : year > 1 ? "Last year's target was missed." : "Nothing has been delivered yet.")}
              stakes="This is the programme the Wikipedia article will judge you on."
              aside={<AdvBubble text={"Your Excellency, the people heard you promise to " + FG.goal + ". This is the year they will count."} saName={cast.adviser.name} />}
              options={opts.map(o => ({ label: o.label, note: o.note, raw: o, chips: [{ text: "Approval " + (o.app > 0 ? "+" : "") + o.app, color: o.app > 0 ? CL.grn : CL.red }].concat(o.debt ? [{ text: "Debt +₦" + o.debt + "B", color: CL.red }] : []).concat(o.cor ? [{ text: "Corruption +4%", color: CL.red }] : []) }))}
              onPick={(o) => pick(o.raw)} />;
          })()}
        </OL>

        <OL show={phase === "dilemma" && !!curD}>
          {curD && curD.id === "strike" && <SceneArt bg="rally" who="labour-leader" alt={cast.labour.name} h={TALL() ? 220 : 260} />}
          {curD && <DecisionCard
            kicker="Dilemma"
            kickerColor={CL.org}
            title={curD.nm}
            brief={curD.id === "strike" ? curD.d + " " + cast.labour.name + ", " + cast.labour.title + ", is leading the walkout." : curD.d}
            stakes="Every option below has a price and a risk. Nothing here is free."
            aside={<AdvBubble text={ADV.dilemma} saName={cast.adviser.name} />}
            options={curD.ch.map(ch => ({
              label: ch.l,
              risk: ch.rk,
              raw: ch,
              chips: [
                ...Object.entries(ch.fx || {}).map(([k, v]) => ({ text: k + " " + (v > 0 ? "+" : "") + (Math.abs(v) < 1 ? Math.round(v * 100) + "%" : v), color: v > 0 ? CL.grn : CL.red })),
                ...(ch.dc ? [{ text: "Debt +" + naira(ch.dc), color: CL.red }] : []),
              ],
            }))}
            onPick={(o) => { if (curD.id === "strike") recordWithCast("labour", "labour_settlement", o.raw.l, curD.nm); dChoice(o.raw); }}
          />}

        </OL>

        <OL show={phase === "impeach"}>
          <Cd style={{ borderColor: CL.red, textAlign: "center" }}>
            <div style={{ fontSize: TS(113), marginBottom: 22 }}>⚠️</div>
            <h3 style={{ fontFamily: F.d, color: CL.red, fontSize: TS(72), fontWeight: 700 }}>IMPEACHMENT PROCEEDINGS</h3>
            <p style={{ color: CL.tm, fontSize: TS(38), marginBottom: 22 }}>The House of Assembly has initiated impeachment proceedings under S.188.</p>
            <p style={{ color: CL.td, fontSize: TS(36), marginBottom: 29 }}>Your approval: {Math.round(s.app)}% · Party stability: {Math.round(s.pStab)}%</p>
            <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 43 }}>Fight chance: {s.app > 70 ? "95%" : s.app > 50 ? "80%" : s.app > 40 ? "65%" : "50%"} — {s.app > 50 ? "The people are with you. Hard for the House to remove a popular governor." : "Low approval makes it hard to resist."}</p>
            <div style={{ display: "flex", gap: 29, justifyContent: "center" }}>
              <Bt onClick={() => handleImp(true)}>🛡️ Fight It ({s.app > 70 ? "95%" : s.app > 50 ? "80%" : s.app > 40 ? "65%" : "50%"})</Bt>
              <Bt v="danger" onClick={() => handleImp(false)}>Accept Removal</Bt>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "judiciary" && !!judEvent}>
          {judEvent && <Cd style={{ borderColor: CL.pur + "44", textAlign: "center" }}>
            <SceneArt bg="courtroom" h={TALL() ? 180 : 220} />
            <Bg text="Judicial Review" color={CL.pur} />
            <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(65), fontWeight: 600 }}>{judEvent.nm}</h3>
            <p style={{ color: CL.tm, fontSize: TS(38), marginBottom: 36 }}>{judEvent.d}</p>
            {judEvent.target && <p style={{ color: CL.org, fontSize: TS(36), marginBottom: 29 }}>Affected policy: {judEvent.target}</p>}
            <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 43 }}>Under S.6 of the Constitution, the judiciary has power of review over executive actions. You must decide whether to comply or defy the ruling.</p>
            <div style={{ display: "grid", gap: 29, maxWidth: 804, margin: "0 auto" }}>
              <Cd onClick={() => resolveJudiciary(true)} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.grn, marginBottom: 7 }}>✅ Comply Fully & Swiftly</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Respect rule of law. Accept penalties immediately. Media +5, judiciary trust +8, closes the case in this turn.</div>
              </Cd>
              <Cd onClick={() => { if (s.debt !== undefined && (s.igr || 0) < 0.5) { alert("Treasury too thin for a full legal defence."); return; } resolveJudiciary("fasttrack"); }} style={{ padding: 36, borderColor: CL.blu + "44" }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.blu, marginBottom: 7 }}>⚖️ Fast-Track Judicial Review (₦0.5B legal fees)</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>File an accelerated hearing at the Court of Appeal. ~60% you win (no penalty), 40% you lose (penalty doubles). Debt +₦0.5B either way.</div>
              </Cd>
              <Cd onClick={() => resolveJudiciary("appeal")} style={{ padding: 36, borderColor: CL.org + "44" }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.org, marginBottom: 7 }}>⏳ Appeal & Delay (buy time)</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Kick to the Court of Appeal. Case reopens next turn — but civil society ramps up. -3 approval now, penalty postponed.</div>
              </Cd>
              <Cd onClick={() => resolveJudiciary(false)} style={{ padding: 36, borderColor: CL.red + "44" }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.red, marginBottom: 7 }}>⚠️ Defy the Court (S.287 breach)</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Ignore the ruling. -12 party stability, -5 approval, +5% corruption. Triggers constitutional crisis path.</div>
              </Cd>
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "const_challenge" && !!constChallenge}>
          {constChallenge && <Cd style={{ borderColor: CL.red + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>⚖️🏛️</div>
              <Bg text="Federal Government Challenge" color={CL.red} />
              <h3 style={{ fontFamily: F.d, color: CL.red, margin: "22px 0", fontSize: TS(65), fontWeight: 600 }}>Constitutional Crisis</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 22 }}>
                You issued an executive order to <strong>{constChallenge.nm.toLowerCase()}</strong>. The Federal Government has immediately filed a challenge in the Federal High Court. 
                The Attorney General of the Federation says this violates the Constitution.
              </p>
              <div style={{ background: CL.red + "08", border: "1px solid " + CL.red + "20", borderRadius: 13, padding: "29px 36px", marginBottom: 36, textAlign: "left" }}>
                <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.red, marginBottom: 7 }}>📜 CONSTITUTIONAL PROVISION:</div>
                <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.4 }}>{constChallenge.r}</div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 840, margin: "0 auto" }}>
              <Cd onClick={() => resolveConst(false)} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>🔄 Accept & Reverse the Order</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Withdraw your order before it reaches the Supreme Court. Minor embarrassment but you preserve your dignity and respect the Constitution.</div>
                <Bg text="-2 approval" color={CL.org} />
              </Cd>

              <Cd onClick={() => resolveConst(true)} style={{ padding: 43, borderColor: CL.red + "33" }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.red, marginBottom: 10 }}>⚔️ Dispute — Fight It in Supreme Court</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Challenge the Federal Government. Take it all the way to the Supreme Court. <strong>You will lose.</strong> The Constitution is clear.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Bg text="-8 approval" color={CL.red} />
                  <Bg text="-10 party" color={CL.red} />
                  <Bg text="GUARANTEED LOSS" color={CL.red} />
                </div>
              </Cd>
            </div>
            {/* If they already chose to dispute, show the ruling */}
          </Cd>}
        </OL>

        <OL show={phase === "const_ruling" && !!constRuling}>
          {constRuling && <Cd style={{ borderColor: CL.red, textAlign: "center" }}>
            <div style={{ fontSize: TS(106), marginBottom: 22 }}>⚖️</div>
            <Bg text="Supreme Court of Nigeria" color={CL.red} />
            <h3 style={{ fontFamily: F.d, color: CL.red, margin: "29px 0", fontSize: TS(72), fontWeight: 700 }}>RULING: ORDER STRUCK DOWN</h3>
            <div style={{ background: "#fef2f2", border: "1px solid " + CL.red + "30", borderRadius: 17, padding: "43px 50px", margin: "36px auto", maxWidth: 840, textAlign: "left" }}>
              <div style={{ fontSize: TS(36), fontWeight: 700, color: CL.red, marginBottom: 22 }}>THE SUPREME COURT OF NIGERIA</div>
              <div style={{ fontSize: TS(38), color: "#333", lineHeight: 1.6, fontFamily: "Georgia, serif", fontStyle: "italic" }}>{constRuling.ruling}</div>
            </div>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 29, flexWrap: "wrap" }}>
              <Bg text="-8 approval" color={CL.red} />
              <Bg text="-10 party stability" color={CL.red} />
              <Bg text="-10 media" color={CL.red} />
              <Bg text="-8 youth" color={CL.red} />
            </div>
            <p style={{ color: CL.td, fontSize: TS(34), marginTop: 36, lineHeight: 1.5 }}>The Constitution is supreme. No governor, no matter how powerful, can override it. This ruling will appear in your Wikipedia biography.</p>
            <div style={{ marginTop: 36 }}><Bt onClick={() => { setConstRuling(null); setPhase("policy"); }}>RETURN TO GOVERNANCE</Bt></div>
          </Cd>}
        </OL>

        <OL show={phase === "godfather" && !!godfatherDemand}>
          {godfatherDemand && (() => {
            const gf0 = STATE_GODFATHERS[state] || { nm: "The Godfather", title: "Political Kingmaker", power: 60, aggression: 50, loyalty_demand: 60, desc: "A powerful figure who funded your campaign." };
            const gf = { ...gf0, nm: cast.godfather.name, ...gfPersona(gf0) }; // one godfather: the cast's
            return <Cd style={{ borderColor: CL.org + "44" }}>
            <AdvBubble text={ADV.godfather} saName={cast.adviser.name} />
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ margin: "0 auto 22px", maxWidth: 520, borderRadius: 22, overflow: "hidden", background: "#13161c url(./art/backgrounds/veranda-night.webp) center/cover", display: "flex", justifyContent: "center", alignItems: "flex-end", height: 300 }}>
                <img src="./art/characters/godfather.webp" alt={gf.nm} style={{ height: 290, width: "auto", objectFit: "contain", objectPosition: "bottom" }} />
              </div>
              <Bg text={gf.title} color={CL.org} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(65), fontWeight: 600 }}>{gf.nm}</h3>
              <div style={{ fontSize: TS(34), color: CL.tm, fontStyle: "italic", marginBottom: 22, maxWidth: 768, margin: "0 auto 22px" }}>{gf.desc}</div>
              <div style={{ display: "flex", gap: 22, justifyContent: "center", marginBottom: 22, flexWrap: "wrap" }}>
                <Bg text={"Power: " + godfatherPower} color={godfatherPower > 50 ? CL.red : CL.org} />
                <Bg text={"Relationship: " + godfatherRel} color={godfatherRel > 50 ? CL.grn : CL.red} />
                <Bg text={"Aggression: " + gf.aggression} color={gf.aggression > 60 ? CL.red : CL.org} />
              </div>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 22, textAlign: "left", maxWidth: 804, margin: "0 auto 36px" }}>
                {gf.nm.split(" ").pop()} sits across from you in Government House. He doesn't ask — he tells. "{godfatherDemand.d}"
              </p>
              <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 36 }}>In Nigerian politics, godfathers wield enormous backroom power. They fund campaigns, control party structures, and expect returns. Defying them has consequences — {gf.aggression > 70 ? "and " + gf.nm.split(" ").pop() + " is VERY aggressive when crossed." : gf.aggression > 50 ? "and " + gf.nm.split(" ").pop() + " will push back." : "though " + gf.nm.split(" ").pop() + " may be manageable."}</p>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 804, margin: "0 auto" }}>
              <Cd onClick={() => {
                setS(p => {
                  const n = { ...p };
                  if (godfatherDemand.acceptFx.corM) n.cor = cl(n.cor + godfatherDemand.acceptFx.corM);
                  if (godfatherDemand.acceptFx.pStab) n.pStab = cl100(n.pStab + godfatherDemand.acceptFx.pStab);
                  if (godfatherDemand.acceptFx.app) n.app = cl100(n.app + godfatherDemand.acceptFx.app);
                  return n;
                });
                setGodfatherRel(r2 => Math.min(100, r2 + 15));
                recordGfDemand(godfatherDemand, true, gf.nm);
                addL("🎩 " + gf.nm + ": " + godfatherDemand.acceptLog + " He's satisfied — for now.", "political");
                showResult({ icon: "🎩", title: gf.nm + " — Appeased", narrative: gf.nm.split(" ").pop() + " nods slowly. \"Good. You understand how this works.\" He leaves Government House with what he came for. Your party is stable. But your integrity — and your EFCC file — just got heavier.", effects: [
                  godfatherDemand.acceptFx.corM ? { icon: "💀", text: "Corruption rises", value: "+" + Math.round(godfatherDemand.acceptFx.corM * 100) + "%", bad: true } : null,
                  godfatherDemand.acceptFx.pStab ? { icon: "🏛️", text: "Party stability", value: "+" + godfatherDemand.acceptFx.pStab, good: true } : null,
                  godfatherDemand.acceptFx.app ? { icon: "📉", text: "Approval", value: godfatherDemand.acceptFx.app + "%", bad: true } : null,
                  { icon: "🤝", text: "Godfather relationship", value: "+15", good: true },
                ].filter(Boolean), tone: "neutral", nextFn: () => { setGodfatherDemand(null); nextEvent(); } });
              }} style={{ padding: 43, borderColor: CL.org + "33" }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.org, marginBottom: 10 }}>🤝 Give {gf.nm.split(" ").pop()} What He Wants</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>The easy path. He stays happy. Party stays stable. But corruption rises.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {godfatherDemand.acceptFx.corM && <Bg text={"+" + Math.round(godfatherDemand.acceptFx.corM * 100) + "% corruption"} color={CL.red} />}
                  {godfatherDemand.acceptFx.pStab && <Bg text={"+" + godfatherDemand.acceptFx.pStab + " party"} color={CL.grn} />}
                  {godfatherDemand.acceptFx.app && <Bg text={godfatherDemand.acceptFx.app + " approval"} color={CL.red} />}
                </div>
              </Cd>

              <Cd onClick={() => {
                const aggrMult = gf.aggression > 70 ? 1.5 : gf.aggression > 50 ? 1.2 : 1;
                setS(p => {
                  const n = { ...p };
                  if (godfatherDemand.rejectFx.pStab) n.pStab = cl100(n.pStab + Math.round(godfatherDemand.rejectFx.pStab * aggrMult));
                  if (godfatherDemand.rejectFx.app) n.app = cl100(n.app + (godfatherDemand.rejectFx.app || 0));
                  return n;
                });
                setGodfatherRel(r2 => Math.max(0, r2 - 20));
                setGodfatherPower(p => Math.max(0, p - 10));
                recordGfDemand(godfatherDemand, false, gf.nm);
                const retaliation = gf.aggression > 70 ? " He's making phone calls. Expect House of Assembly trouble." : gf.aggression > 50 ? " He's unhappy but calculating his next move." : " He retreats — for now.";
                addL("🎩 " + gf.nm + ": " + godfatherDemand.rejectLog + retaliation, "political");
                showResult({ icon: "✊", title: "You Defied " + gf.nm, narrative: "\"You think you can govern without me?\" " + gf.nm.split(" ").pop() + " stands. " + (gf.aggression > 70 ? "His eyes are cold. 'I made you, Governor. I can unmake you.' He storms out. Your phone will ring all night — he's already working the Assembly members." : gf.aggression > 50 ? "He's quiet. That's worse than shouting. He leaves without shaking your hand." : "He shrugs. 'We'll see.' He's not happy but he's not at war — yet."), effects: [
                  { icon: "🏛️", text: "Party stability hit" + (aggrMult > 1 ? " (aggression ×" + aggrMult + ")" : ""), value: Math.round(godfatherDemand.rejectFx.pStab * aggrMult), bad: true },
                  godfatherDemand.rejectFx.app > 0 ? { icon: "📈", text: "Public approves your stand", value: "+" + godfatherDemand.rejectFx.app, good: true } : null,
                  { icon: "💔", text: "Godfather relationship", value: "-20", bad: true },
                  { icon: "📉", text: "His power weakened", value: "-10", good: true },
                ].filter(Boolean), tone: gf.aggression > 70 ? "bad" : "neutral", nextFn: () => { setGodfatherDemand(null); nextEvent(); } });
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>✊ Refuse {gf.nm.split(" ").pop()}</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Stand on principle. He'll destabilize your party. {gf.aggression > 70 ? "WARNING: He is VERY aggressive. Party damage will be severe." : "His retaliation will be proportional to his aggression."}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {godfatherDemand.rejectFx.pStab && <Bg text={Math.round(godfatherDemand.rejectFx.pStab * (gf.aggression > 70 ? 1.5 : gf.aggression > 50 ? 1.2 : 1)) + " party"} color={CL.red} />}
                  {godfatherDemand.rejectFx.app > 0 && <Bg text={"+" + godfatherDemand.rejectFx.app + " approval"} color={CL.grn} />}
                  <Bg text="-20 relationship" color={CL.red} />
                </div>
              </Cd>
            </div>
          </Cd>;
          })()}
        </OL>

        <OL show={phase === "nic_ruling" && !!nicPending}>
          {nicPending && <Cd style={{ borderColor: CL.pur }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 14 }}>⚖️👷</div>
              <div style={{ background: CL.pur, color: "#fff", display: "inline-block", padding: "10px 43px", borderRadius: 8, fontSize: TS(34), fontWeight: 700, letterSpacing: 5, marginBottom: 22 }}>NATIONAL INDUSTRIAL COURT</div>
              <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(58), fontWeight: 600, margin: "22px 0" }}>NIC Ruling — Reinstatement Ordered</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, textAlign: "left", marginBottom: 22 }}>{nicPending.desc}</p>
              <div style={{ background: CL.pur + "08", borderRadius: 8, padding: "19px 29px", marginBottom: 29, fontSize: TS(34), color: CL.pur }}>📖 S.254C(1): The National Industrial Court shall have exclusive jurisdiction over labour disputes. Its orders are enforceable as High Court orders. Contempt of NIC is a criminal offence under S.72 of the Sheriffs and Civil Process Act.</div>
            </div>
            <div style={{ display: "grid", gap: 29 }}>
              <Cd onClick={() => {
                const arrearsCost = nicPending.type === "lecturers" ? 2 : 3;
                setS(p => ({ ...p, app: cl100(p.app - 4), debt: p.debt + arrearsCost }));
                setSkApp(p => ({ ...p, unions: cl100((p.unions || 50) + 15), media: cl100((p.media || 50) + 5) }));
                addL("⚖️ Governor complies with NIC ruling. " + (nicPending.type === "lecturers" ? "Lecturers reinstated" : "Workers reinstated") + ". Arrears paid. ₦" + arrearsCost + "B cost.", "policy");
                showResult({ icon: "⚖️", title: "NIC Ruling — Compliance", narrative: "You reinstated the " + nicPending.type + " and paid all outstanding arrears plus court-ordered compensation. The unions are partially satisfied. The rule of law prevails — even if it cost you politically and financially.", effects: [
                  { icon: "📉", text: "Approval drops from u-turn", value: "-4%", bad: true },
                  { icon: "💰", text: "Arrears + compensation paid", value: "+₦" + arrearsCost + "B debt", bad: true },
                  { icon: "🤝", text: "Unions partially restored", value: "+15", good: true },
                  { icon: "📰", text: "Media acknowledges rule of law", value: "+5", good: true },
                  { icon: "👷", text: nicPending.type === "lecturers" ? "Lecturers return to classrooms" : "Workers back on the job", good: true },
                ], tone: "neutral", nextFn: () => { setNicPending(null); nextEvent(); } });
              }} style={{ padding: 36, borderColor: CL.grn + "44" }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.grn }}>✅ Comply — Reinstate & Pay Arrears</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Reinstate the {nicPending.type}. Pay all arrears + compensation (₦{nicPending.type === "lecturers" ? "2" : "3"}B). Swallow your pride. The law is the law.</div>
              </Cd>

              <Cd onClick={() => {
                setS(p => ({ ...p, app: cl100(p.app - 3), debt: p.debt + 1 }));
                setSkApp(p => ({ ...p, unions: cl100((p.unions || 50) + 8) }));
                addL("⚖️ Governor partially complies — reinstates workers but delays full arrears payment.", "political");
                setDelayedFx(d => [...d, { turn: turn + 2, fx: { app: -3 }, desc: "⚖️ NIC issues enforcement order for unpaid arrears. Governor must pay or face contempt." }]);
                showResult({ icon: "⚖️", title: "Partial Compliance", narrative: "You reinstated the " + nicPending.type + " but are negotiating down the arrears. The court accepted a payment plan. This buys time but doesn't resolve the underlying issue.", effects: [
                  { icon: "📉", text: "Approval dips", value: "-3%", bad: true },
                  { icon: "💰", text: "Partial payment", value: "+₦1B debt", bad: true },
                  { icon: "🤝", text: "Unions cautiously accept", value: "+8", good: true },
                  { icon: "⏰", text: "Full payment due in 2 turns or contempt", bad: true },
                ], tone: "neutral", nextFn: () => { setNicPending(null); nextEvent(); } });
              }} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.org }}>🔄 Partial Compliance — Reinstate but Negotiate Arrears</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Bring them back but negotiate the payment down. Court accepts a payment plan. You still owe — enforcement in 2 turns.</div>
              </Cd>

              <Cd onClick={() => {
                setS(p => ({ ...p, app: cl100(Math.min(p.app, 35) - 12), pStab: cl100(p.pStab - 15), cor: cl(p.cor + .05) }));
                setSkApp(p => ({ ...p, unions: cl100((p.unions || 50) - 25), media: cl100((p.media || 50) - 20), youth: cl100((p.youth || 50) - 10), business: cl100((p.business || 50) - 10) }));
                addL("🚨 GOVERNOR DEFIES NATIONAL INDUSTRIAL COURT! Contempt proceedings initiated. Criminal referral possible.", "crisis");
                showResult({ icon: "🚨", title: "CONTEMPT OF COURT", narrative: "You have refused to comply with a binding order of the National Industrial Court. This is not just a political crisis — it is a CRIMINAL matter. The NIC has referred you for contempt proceedings. The NBA is calling for impeachment. Foreign investors are pulling out. Labour unions have declared an indefinite general strike.", effects: [
                  { icon: "💥", text: "Approval CRASHES — capped at 35% then -12%", value: "-12%+", bad: true },
                  { icon: "🏛️", text: "Party stability collapses", value: "-15%", bad: true },
                  { icon: "💀", text: "Corruption surges", value: "+5%", bad: true },
                  { icon: "✊", text: "Unions declare general strike", value: "-25", bad: true },
                  { icon: "📰", text: "Media turns hostile", value: "-20", bad: true },
                  { icon: "💼", text: "Business community flees", value: "-10", bad: true },
                  { icon: "⚖️", text: "CRIMINAL CONTEMPT referral — you could be prosecuted", bad: true },
                  { icon: "⚠️", text: "IMPEACHMENT RISK: extreme", bad: true },
                ], tone: "bad", nextFn: () => { setNicPending(null); nextEvent(); } });
              }} style={{ padding: 36, borderColor: CL.red }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.red }}>❌ DEFY the NIC — Refuse to Reinstate</div>
                <div style={{ fontSize: TS(34), color: CL.red, lineHeight: 1.3 }}>Refuse to comply. The {nicPending.type} stay sacked. This triggers criminal contempt proceedings, general strike, and near-certain impeachment. Approval capped at 35% then -12%. S.254C makes NIC orders enforceable as High Court orders — defiance is a criminal offence.</div>
              </Cd>
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "hidden_threat" && hiddenThreats.length > 0}>
          <Cd style={{ borderColor: CL.org + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 14 }}>🔍</div>
              <Bg text="Intelligence Report" color={CL.org} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(58), fontWeight: 600 }}>Something Isn't Right...</h3>
              <AdvBubble text={"Your Excellency, I'm hearing whispers. Something feels off in the " + (hiddenThreats[0]?.ministry || "government") + " Ministry. I can't confirm anything yet, but... " + (hiddenThreats.length > 1 ? "And there may be " + (hiddenThreats.length - 1) + " other issue(s)." : "")} saName={cast.adviser.name} />
            </div>
            <div style={{ display: "grid", gap: 22 }}>
              <Cd onClick={() => {
                const threat = hiddenThreats[0];
                setHiddenThreats(p => p.filter(h => h.id !== threat.id));
                setHiddenRevealed(p => [...p, threat.id]);
                setS(p => ({ ...p, cor: cl(p.cor + .02), app: cl100(p.app - 2), debt: p.debt + 0.3 }));
                addL("🔍 INVESTIGATION: " + threat.desc + " Caught early. Damage limited.", "political");
                showResult({ icon: "🔍", title: "Investigation — " + threat.ministry + " Ministry", narrative: threat.desc + " Your investigation caught this before it became a full scandal. Some damage to your reputation, but far less than if it had exploded.", effects: [
                  { icon: "🔎", text: "Corruption uncovered and addressed", value: "+2% visible", bad: true },
                  { icon: "📉", text: "Approval hit from public disclosure", value: "-2%", bad: true },
                  { icon: "💰", text: "Investigation costs", value: "-₦0.3B", bad: true },
                  { icon: "✨", text: "Scandal PREVENTED — would have been -6% and +5% corruption", good: true },
                ], tone: "neutral", nextFn: () => nextEvent() });
              }} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.org, marginBottom: 10 }}>🔍 Investigate (₦0.3B)</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Send auditors. Find out what's happening. Costs money and might reveal uncomfortable truths, but prevents a bigger explosion.</div>
                <Bg text="₦0.3B cost" color={CL.org} />
              </Cd>
              <Cd onClick={() => {
                addL("🤷 SA warned about issues in " + (hiddenThreats[0]?.ministry || "a ministry") + ". Governor chose not to investigate.", "political");
                nextEvent();
              }} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.td, marginBottom: 10 }}>🤷 Ignore — It's Probably Nothing</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>You can't investigate every rumour. But if it's real and you didn't act... it will explode in 2-3 turns with MUCH worse consequences.</div>
                <Bg text="Free — but risky" color={CL.td} />
              </Cd>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "shock" && !!curShock}>
          {curShock && <Cd style={{ borderColor: CL.red, background: "#fff8f8" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(116), marginBottom: 14 }}>{curShock.icon}</div>
              <div style={{ background: CL.red, color: "#fff", display: "inline-block", padding: "10px 43px", borderRadius: 8, fontSize: TS(34), fontWeight: 700, fontFamily: F.m, letterSpacing: 5, marginBottom: 22 }}>⚡ SHOCK EVENT</div>
              <h3 style={{ fontFamily: F.d, color: CL.red, margin: "22px 0", fontSize: TS(65), fontWeight: 700 }}>{curShock.title}</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, textAlign: "left", marginBottom: 22 }}>{curShock.desc}</p>
              {curShock.autoFx && Object.keys(curShock.autoFx).length > 0 && <div style={{ background: CL.red + "10", border: "1px solid " + CL.red + "25", borderRadius: 8, padding: "14px 29px", marginBottom: 29, fontSize: TS(34), color: CL.red }}>
                ⚠️ Immediate impact: {Object.entries(curShock.autoFx).map(([k, v]) => k + " " + (v > 0 ? "+" : "") + (Math.abs(v) < 1 ? Math.round(v * 100) + "%" : v)).join(", ")}
              </div>}
            </div>
            <div style={{ display: "grid", gap: 22 }}>
              {curShock.opts.map((opt, i) => (
                <Cd key={i} onClick={() => {
                  setS(p => {
                    const n2 = { ...p };
                    // Apply auto effects from the shock itself
                    if (curShock.autoFx.faac) n2.faac = Math.max(3, n2.faac * (1 + curShock.autoFx.faac));
                    if (curShock.autoFx.hp) n2.hp = cl(n2.hp + curShock.autoFx.hp);
                    if (curShock.autoFx.agr) n2.agr = cl(n2.agr + curShock.autoFx.agr);
                    if (curShock.autoFx.infra) n2.infra = cl(n2.infra + curShock.autoFx.infra);
                    if (curShock.autoFx.sec) n2.sec = cl(n2.sec + curShock.autoFx.sec);
                    if (curShock.autoFx.app) n2.app = cl100(n2.app + curShock.autoFx.app);
                    if (curShock.autoFx.igr) n2.igr = Math.max(1, n2.igr + curShock.autoFx.igr);
                    // Apply player choice effects
                    if (opt.fx.app) n2.app = cl100(n2.app + opt.fx.app);
                    if (opt.fx.cor) n2.cor = cl(n2.cor + opt.fx.cor);
                    if (opt.fx.hp) n2.hp = cl(n2.hp + opt.fx.hp);
                    if (opt.fx.sec) n2.sec = cl(n2.sec + opt.fx.sec);
                    if (opt.fx.infra) n2.infra = cl(n2.infra + opt.fx.infra);
                    if (opt.fx.igr) n2.igr += opt.fx.igr;
                    if (opt.dc) n2.debt += opt.dc;
                    return n2;
                  });
                  if (opt.sk) setSkApp(p => { const n2 = { ...p }; Object.entries(opt.sk).forEach(([k, v]) => { if (n2[k] !== undefined) n2[k] = cl100(n2[k] + v); }); return n2; });
                  if (opt.fgRel) setFgRelation(r => Math.max(0, Math.min(100, r + opt.fgRel)));
                  addL("⚡ SHOCK: " + curShock.title + " → " + opt.log, "crisis");
                  const shk = curShock; setCurShock(null);
                  const efx = [];
                  Object.entries(shk.autoFx || {}).forEach(([k, v]) => efx.push({ icon: "⚡", text: k.toUpperCase() + " hit by shock", value: (v > 0 ? "+" : "") + (Math.abs(v) < 1 ? Math.round(v * 100) + "%" : v), bad: v < 0 }));
                  if (opt.fx.app) efx.push({ icon: opt.fx.app > 0 ? "📈" : "📉", text: "Approval " + (opt.fx.app > 0 ? "rises" : "drops") + " from your response", value: (opt.fx.app > 0 ? "+" : "") + opt.fx.app + "%", good: opt.fx.app > 0, bad: opt.fx.app < 0 });
                  if (opt.dc) efx.push({ icon: "💰", text: "Emergency spending", value: "+₦" + opt.dc + "B debt", bad: true });
                  if (opt.fx.sec) efx.push({ icon: "🛡️", text: "Security " + (opt.fx.sec > 0 ? "improved" : "weakened"), good: opt.fx.sec > 0, bad: opt.fx.sec < 0 });
                  if (opt.fx.hp) efx.push({ icon: "🏥", text: "Health " + (opt.fx.hp > 0 ? "improved" : "worsened"), good: opt.fx.hp > 0, bad: opt.fx.hp < 0 });
                  showResult({ icon: shk.icon, title: shk.title + " — Response", narrative: opt.log + " The effects will ripple through your state for months to come.", effects: efx, tone: (opt.fx.app || 0) >= 0 ? "neutral" : "bad", nextFn: () => nextEvent() });
                }} style={{ padding: 29 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(38), color: CL.txt, marginBottom: 7 }}>{opt.l}</div>
                  <div style={{ fontSize: TS(34), color: CL.td, lineHeight: 1.3 }}>{opt.d}</div>
                  <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
                    {opt.fx.app && <Bg text={(opt.fx.app > 0 ? "+" : "") + opt.fx.app + " approval"} color={opt.fx.app > 0 ? CL.grn : CL.red} />}
                    {opt.dc && <Bg text={"₦" + opt.dc + "B debt"} color={CL.red} />}
                    {opt.fx.cor && <Bg text={(opt.fx.cor > 0 ? "+" : "") + Math.round(opt.fx.cor * 100) + "% corruption"} color={opt.fx.cor > 0 ? CL.red : CL.grn} />}
                    {opt.fgRel && <Bg text={(opt.fgRel > 0 ? "+" : "") + opt.fgRel + " FG"} color={opt.fgRel > 0 ? CL.grn : CL.red} />}
                  </div>
                </Cd>
              ))}
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "federal" && !!curFgEvent}>
          {curFgEvent && <Cd style={{ borderColor: curFgEvent.type === "reward" ? CL.grn + "44" : CL.red + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <SceneArt bg="governor-office" who={curFgEvent.id === "fg_efcc" ? "efcc-investigator" : null} alt={curFgEvent.id === "fg_efcc" ? cast.efcc.name : ""} h={TALL() ? 200 : 240} />
              <Bg text="Federal Government" color={curFgEvent.type === "reward" ? CL.grn : CL.red} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(58), fontWeight: 600 }}>{curFgEvent.title}</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, textAlign: "left", marginBottom: 22 }}>{curFgEvent.desc}</p>
              {curFgEvent.id === "fg_efcc" && <p style={{ color: CL.txt, fontSize: TS(34), lineHeight: 1.45, textAlign: "left", marginBottom: 22 }}>The case officer is <b>{cast.efcc.name}</b>, {cast.efcc.title}. {window.SOP_CAST && window.SOP_CAST.history("efcc").length ? "You have met before." : "Nobody in your government has met this officer yet."}</p>}
              <div style={{ display: "flex", gap: 22, justifyContent: "center", marginBottom: 22 }}>
                <Bg text={"FG Relations: " + fgRelation + "%"} color={fgRelation > 55 ? CL.grn : fgRelation > 35 ? CL.org : CL.red} />
                <Bg text={curFgEvent.type === "reward" ? "Opportunity" : "Pressure"} color={curFgEvent.type === "reward" ? CL.grn : CL.red} />
              </div>
            </div>
            <div style={{ display: "grid", gap: 22 }}>
              {curFgEvent.opts.map((opt, i) => (
                <Cd key={i} onClick={() => {
                  if (curFgEvent.id === "fg_efcc") recordWithCast("efcc", "efcc_response", opt.l, curFgEvent.title);
                  setS(p => {
                    const n2 = { ...p };
                    if (opt.fx.app) n2.app = cl100(n2.app + opt.fx.app);
                    if (opt.fx.cor) n2.cor = cl(n2.cor + opt.fx.cor);
                    if (opt.fx.infra) n2.infra = cl(n2.infra + opt.fx.infra);
                    if (opt.fx.sec) n2.sec = cl(n2.sec + opt.fx.sec);
                    if (opt.fx.hp) n2.hp = cl(n2.hp + opt.fx.hp);
                    if (opt.fx.agr) n2.agr = cl(n2.agr + opt.fx.agr);
                    if (opt.fx.igr) n2.igr += opt.fx.igr;
                    if (opt.fx.pStab) n2.pStab = cl100(n2.pStab + opt.fx.pStab);
                    if (opt.dc) n2.debt += opt.dc;
                    // Apply FAAC changes from the event itself
                    if (curFgEvent.fx.faac) n2.faac = n2.faac * (1 + curFgEvent.fx.faac);
                    if (curFgEvent.fx.sec) n2.sec = cl(n2.sec + curFgEvent.fx.sec);
                    if (curFgEvent.fx.igr) n2.igr += curFgEvent.fx.igr;
                    return n2;
                  });
                  if (opt.sk) setSkApp(p => { const n2 = { ...p }; Object.entries(opt.sk).forEach(([k, v]) => { if (n2[k] !== undefined) n2[k] = cl100(n2[k] + v); }); return n2; });
                  setFgRelation(r => Math.max(0, Math.min(100, r + (opt.fgRel || 0))));
                  addL("🇳🇬 FEDERAL: " + opt.log, opt.fgRel > 0 ? "political" : opt.fgRel < -10 ? "crisis" : "political");
                  const fg = curFgEvent; setCurFgEvent(null);
                  const efx = [];
                  if (opt.fgRel) efx.push({ icon: opt.fgRel > 0 ? "🤝" : "⚔️", text: "Federal Government relations " + (opt.fgRel > 0 ? "improved" : "worsened"), value: (opt.fgRel > 0 ? "+" : "") + opt.fgRel + "%", good: opt.fgRel > 0, bad: opt.fgRel < 0 });
                  if (opt.fx.app) efx.push({ icon: opt.fx.app > 0 ? "📈" : "📉", text: "Public approval " + (opt.fx.app > 0 ? "rises" : "drops"), value: (opt.fx.app > 0 ? "+" : "") + opt.fx.app + "%", good: opt.fx.app > 0, bad: opt.fx.app < 0 });
                  if (fg.fx.faac) efx.push({ icon: "💸", text: "FAAC allocation " + (fg.fx.faac < 0 ? "reduced" : "increased"), value: Math.round(Math.abs(fg.fx.faac) * 100) + "%", bad: fg.fx.faac < 0, good: fg.fx.faac > 0 });
                  if (opt.dc) efx.push({ icon: "💰", text: "State spending", value: "+₦" + opt.dc + "B", bad: true });
                  if (opt.fx.cor) efx.push({ icon: opt.fx.cor > 0 ? "💀" : "✨", text: "Corruption " + (opt.fx.cor > 0 ? "increases" : "decreases"), bad: opt.fx.cor > 0, good: opt.fx.cor < 0 });
                  if (opt.fx.infra) efx.push({ icon: "🏗️", text: "Infrastructure boost", value: "+" + Math.round(opt.fx.infra * 100) + "%", good: true });
                  showResult({ icon: "🇳🇬", title: fg.title + " — Result", narrative: opt.log + (opt.fgRel < -10 ? " The President's office has taken note. Expect consequences." : opt.fgRel > 10 ? " Your loyalty has been noted in Aso Rock. This may pay dividends." : ""), effects: efx, tone: opt.fgRel >= 0 ? "good" : "bad", nextFn: () => nextEvent() });
                }} style={{ padding: 29 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(38), color: CL.txt, marginBottom: 7 }}>{opt.l}</div>
                  <div style={{ fontSize: TS(34), color: CL.td, lineHeight: 1.3 }}>{opt.d}</div>
                  <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
                    {opt.fgRel > 0 && <Bg text={"+" + opt.fgRel + " FG relations"} color={CL.grn} />}
                    {opt.fgRel < 0 && <Bg text={opt.fgRel + " FG relations"} color={CL.red} />}
                    {opt.fx.app > 0 && <Bg text={"+" + opt.fx.app + " approval"} color={CL.grn} />}
                    {opt.fx.app < 0 && <Bg text={opt.fx.app + " approval"} color={CL.red} />}
                    {opt.fx.cor > 0 && <Bg text="Corruption!" color={CL.red} />}
                    {opt.dc && <Bg text={"₦" + opt.dc + "B cost"} color={CL.org} />}
                  </div>
                </Cd>
              ))}
            </div>
            <div style={{ marginTop: 29, fontSize: TS(34), color: CL.td, lineHeight: 1.4, background: CL.blu + "08", padding: "22px 29px", borderRadius: 8 }}>
              📖 <strong>Civic Note:</strong> Under Nigeria's federal system, the President controls FAAC distribution, the military (S.217), the EFCC, and the DMO. Governors depend on federal cooperation for roads, loans, and security. This power imbalance shapes every governor's political calculations.
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "media" && !!curMedia}>
          {curMedia && <Cd style={{ borderColor: curMedia.severity === "positive" ? CL.grn + "44" : CL.org + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <SceneArt bg="tv-studio" who="reporter" alt={cast.reporter.name} h={TALL() ? 220 : 260} />
              <Bg text={curMedia.type === "social" ? "Social Media" : curMedia.type === "newspaper" ? "Newspaper" : curMedia.type === "radio" ? "Radio" : curMedia.type === "tv" ? "Television" : "Blogger"} color={curMedia.severity === "positive" ? CL.grn : CL.org} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(62), fontWeight: 600 }}>{curMedia.title}</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, textAlign: "left", marginBottom: 29 }}>{curMedia.desc}</p>
            </div>
            <div style={{ display: "grid", gap: 22 }}>
              {curMedia.opts.map((opt, i) => (
                <Cd key={i} onClick={() => {
                  setS(p => {
                    const n2 = { ...p };
                    if (opt.fx.app) n2.app = cl100(n2.app + opt.fx.app);
                    if (opt.fx.cor) n2.cor = cl(n2.cor + opt.fx.cor);
                    if (opt.fx.hp) n2.hp = cl(n2.hp + opt.fx.hp);
                    if (opt.fx.sec) n2.sec = cl(n2.sec + opt.fx.sec);
                    if (opt.fx.igr) n2.igr += opt.fx.igr;
                    if (opt.fx.pStab) n2.pStab = cl100(n2.pStab + opt.fx.pStab);
                    if (opt.dc) n2.debt += opt.dc;
                    return n2;
                  });
                  if (opt.sk) setSkApp(p => { const n2 = { ...p }; Object.entries(opt.sk).forEach(([k, v]) => { if (n2[k] !== undefined) n2[k] = cl100(n2[k] + v); }); return n2; });
                  const typeLabel = curMedia.type === "social" ? "📱" : curMedia.type === "newspaper" ? "📰" : curMedia.type === "radio" ? "📻" : curMedia.type === "tv" ? "📺" : "💻";
                  addL(typeLabel + " MEDIA: " + curMedia.title + " → " + opt.l.replace(/^[^\s]+ /, ""), opt.fx.app > 0 ? "policy" : "political");
                  const mTitle = curMedia.title;
                  const mefx = [];
                  if (opt.fx.app) mefx.push({ icon: opt.fx.app > 0 ? "📈" : "📉", text: "Public approval " + (opt.fx.app > 0 ? "rises" : "drops"), value: (opt.fx.app > 0 ? "+" : "") + opt.fx.app + "%", good: opt.fx.app > 0, bad: opt.fx.app < 0 });
                  if (opt.fx.cor) mefx.push({ icon: opt.fx.cor < 0 ? "✨" : "💀", text: "Corruption " + (opt.fx.cor < 0 ? "reduced" : "increased"), value: Math.round(Math.abs(opt.fx.cor) * 100) + "%", good: opt.fx.cor < 0, bad: opt.fx.cor > 0 });
                  Object.entries(opt.sk || {}).forEach(([k2, v]) => mefx.push({ icon: v > 0 ? "👥" : "⚠️", text: k2 + " " + (v > 0 ? "improved" : "worsened"), value: (v > 0 ? "+" : "") + v, good: v > 0, bad: v < 0 }));
                  setCurMedia(null);
                  showResult({ icon: typeLabel, title: mTitle + " — Result", narrative: opt.d, effects: mefx, tone: (opt.fx.app || 0) >= 0 ? "good" : "bad", nextFn: () => nextEvent() });
                }} style={{ padding: 29 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(38), color: CL.txt, marginBottom: 7 }}>{opt.l}</div>
                  <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 10, lineHeight: 1.3 }}>{opt.d}</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {opt.fx.app && <Bg text={(opt.fx.app > 0 ? "+" : "") + opt.fx.app + " approval"} color={opt.fx.app > 0 ? CL.grn : CL.red} />}
                    {opt.fx.cor && <Bg text={(opt.fx.cor > 0 ? "+" : "") + Math.round(opt.fx.cor * 100) + "% corruption"} color={opt.fx.cor > 0 ? CL.red : CL.grn} />}
                    {opt.sk?.media && <Bg text={(opt.sk.media > 0 ? "+" : "") + opt.sk.media + " media"} color={opt.sk.media > 0 ? CL.grn : CL.red} />}
                    {opt.sk?.youth && <Bg text={(opt.sk.youth > 0 ? "+" : "") + opt.sk.youth + " youth"} color={opt.sk.youth > 0 ? CL.grn : CL.red} />}
                  </div>
                  <div style={{ fontSize: TS(29), color: CL.org, marginTop: 7 }}>⚠️ {opt.risk}</div>
                </Cd>
              ))}
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "investor" && !!curInvestor}>
          {curInvestor && <Cd style={{ borderColor: CL.blu + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>{curInvestor.icon}</div>
              <Bg text="Private Investment Proposal" color={CL.blu} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(62), fontWeight: 600 }}>{curInvestor.nm}</h3>
              <div style={{ fontSize: TS(34), color: CL.pur, fontFamily: F.m, marginBottom: 14 }}>{curInvestor.co}</div>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 22, textAlign: "left" }}>{curInvestor.desc}</p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
                <Bg text={curInvestor.jobs.toLocaleString() + " jobs"} color={CL.blu} />
                <Bg text={"+" + naira(curInvestor.igrBoost) + " IGR"} color={CL.grn} />
                <Bg text={curInvestor.landCost + " land"} color={CL.org} />
                <Bg text={"Sector: " + curInvestor.sector} color={CL.pur} />
              </div>
              {curInvestor.envRisk && <div style={{ background: CL.org + "08", border: "1px solid " + CL.org + "20", borderRadius: 8, padding: "14px 29px", marginBottom: 22, fontSize: TS(34), color: CL.org, textAlign: "left" }}>⚠️ Environmental: {curInvestor.envRisk}</div>}
            </div>
            <div style={{ display: "grid", gap: 29 }}>
              <Cd onClick={() => {
                const corHit = Math.random() < curInvestor.corRisk;
                const debtPay = curInvestor.igrBoost * 0.15; // 15% of new revenue pays debt
                setS(p => {
                  const n = { ...p, igr: p.igr + curInvestor.igrBoost, app: cl100(p.app + curInvestor.appBoost + curInvestor.appRisk), debt: Math.max(0, p.debt - debtPay) };
                  if (n.econ?.[curInvestor.sector]) n.econ[curInvestor.sector] = { ...n.econ[curInvestor.sector], out: cl(n.econ[curInvestor.sector].out + .06), jobs: (n.econ[curInvestor.sector].jobs || 0) + curInvestor.jobs };
                  n.totalJobs = (n.totalJobs || 0) + curInvestor.jobs;
                  if (corHit) n.cor = cl(n.cor + .03);
                  return n;
                });
                setSkApp(p => ({ ...p, business: cl100((p.business || 50) + 8), youth: cl100((p.youth || 50) + 4) }));
                setInvestorsApproved(p => [...p, curInvestor.id]);
                addL("🏗️ APPROVED: " + curInvestor.nm + " — " + curInvestor.jobs.toLocaleString() + " jobs created.", "success");
                const inv = curInvestor; setCurInvestor(null);
                const efx = [
                  { icon: "👷", text: inv.jobs.toLocaleString() + " new jobs created in " + inv.sector, value: "+" + inv.jobs.toLocaleString(), good: true },
                  { icon: "💰", text: "State IGR increases from new tax revenue", value: "+" + naira(inv.igrBoost), good: true },
                  { icon: "📊", text: inv.sector.charAt(0).toUpperCase() + inv.sector.slice(1) + " sector output boosted", value: "+6%", good: true },
                  { icon: "🏘️", text: inv.landCost + " of land allocated", value: inv.landCost },
                ];
                if (inv.appBoost + inv.appRisk > 0) efx.push({ icon: "📈", text: "Public approves", value: "+" + (inv.appBoost + inv.appRisk), good: true });
                if (inv.appRisk < -2) efx.push({ icon: "😤", text: "Community displaced — some residents angry", value: inv.appRisk + " approval", bad: true });
                if (corHit) efx.push({ icon: "💀", text: "Land allocation scandal! Kickbacks detected.", value: "+3% corruption", bad: true });
                efx.push({ icon: "🤝", text: "Business stakeholders pleased", value: "+8", good: true });
                showResult({ icon: "🏗️", title: inv.nm + " — APPROVED", narrative: inv.co + " has begun construction. Workers are being hired. " + inv.landCost + " of state land has been allocated. " + (corHit ? "However, reports of irregular payments in the land allocation process are already emerging. EFCC may take notice." : "The project is expected to be operational within 18 months. Revenue will start flowing to the state treasury."), effects: efx, tone: "good", nextFn: () => nextEvent() });
              }} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.grn, marginBottom: 10 }}>✅ Approve — Allocate Land</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 10 }}>Grant them the land and approve the project. Jobs and revenue start flowing. Some community displacement.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Bg text={"+" + curInvestor.jobs + " jobs"} color={CL.grn} /><Bg text={"+" + naira(curInvestor.igrBoost) + " IGR"} color={CL.grn} />{curInvestor.appRisk < -2 && <Bg text={curInvestor.appRisk + " community"} color={CL.red} />}{curInvestor.corRisk > .15 && <Bg text="Corruption risk" color={CL.red} />}</div>
              </Cd>

              <Cd onClick={() => {
                setS(p => {
                  const n = { ...p, igr: p.igr + curInvestor.igrBoost * 0.6, app: cl100(p.app + curInvestor.appBoost + 2), debt: p.debt + curInvestor.igrBoost * 0.3 };
                  if (n.econ?.[curInvestor.sector]) n.econ[curInvestor.sector] = { ...n.econ[curInvestor.sector], out: cl(n.econ[curInvestor.sector].out + .08), jobs: (n.econ[curInvestor.sector].jobs || 0) + curInvestor.jobs };
                  n.totalJobs = (n.totalJobs || 0) + curInvestor.jobs;
                  return n;
                });
                setSkApp(p => ({ ...p, business: cl100((p.business || 50) + 12), youth: cl100((p.youth || 50) + 6) }));
                setInvestorsApproved(p => [...p, curInvestor.id]);
                addL("🎁 INCENTIVIZED: " + curInvestor.nm + " — tax holidays granted.", "success");
                const inv = curInvestor; setCurInvestor(null);
                showResult({ icon: "🎁", title: inv.nm + " — APPROVED WITH INCENTIVES", narrative: "The state has offered " + inv.co + " a generous package: 10-year tax holiday, subsidized land, and free power connection. This costs the state ₦" + (inv.igrBoost * 0.3).toFixed(1) + "B in incentives — but the " + inv.jobs.toLocaleString() + " jobs and sector boost justify it. Business community is very impressed.", effects: [
                  { icon: "👷", text: inv.jobs.toLocaleString() + " jobs created", value: "+" + inv.jobs.toLocaleString(), good: true },
                  { icon: "📊", text: inv.sector + " sector gets major boost", value: "+8%", good: true },
                  { icon: "💰", text: "State bears incentive costs", value: "₦" + (inv.igrBoost * 0.3).toFixed(1) + "B debt", bad: true },
                  { icon: "🤝", text: "Business stakeholders very pleased", value: "+12", good: true },
                ], tone: "good", nextFn: () => nextEvent() });
              }} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.blu, marginBottom: 10 }}>🎁 Approve with Tax Incentives</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 10 }}>Sweeten the deal — tax holidays, subsidized land, free power. More jobs but state bears costs.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Bg text={"+" + curInvestor.jobs + " jobs"} color={CL.grn} /><Bg text="Bigger sector boost" color={CL.grn} /><Bg text={"Costs state " + naira(curInvestor.igrBoost * 0.3)} color={CL.org} /></div>
              </Cd>

              <Cd onClick={() => {
                const envClean = curInvestor.envRisk.includes("None");
                setS(p => ({ ...p, app: cl100(p.app + (envClean ? -3 : 2)) }));
                setSkApp(p => ({ ...p, business: cl100((p.business || 50) - 8), youth: cl100((p.youth || 50) - 4) }));
                addL("❌ REJECTED: " + curInvestor.nm, "political");
                const inv = curInvestor; setCurInvestor(null);
                showResult({ icon: "❌", title: inv.nm + " — REJECTED", narrative: envClean ? inv.co + " leaves your state confused and disappointed. There was no environmental concern to justify the rejection. The business community is asking: why did the governor turn away " + inv.jobs.toLocaleString() + " jobs? The company is already in talks with a neighbouring state." : "You've protected your communities and environment from " + inv.co + "'s project. " + inv.envRisk + " The people in the affected area are relieved. But " + inv.jobs.toLocaleString() + " potential jobs have gone elsewhere, and the business community is concerned about your 'anti-investment' reputation.", effects: [
                  { icon: "🚫", text: "No jobs created — opportunity lost", value: "0 jobs", bad: true },
                  { icon: "📉", text: "Business stakeholders upset", value: "-8", bad: true },
                  envClean ? { icon: "😤", text: "Public confused by rejection", value: "-3 approval", bad: true } : { icon: "🌿", text: "Environment protected — public approves", value: "+2 approval", good: true },
                ], tone: envClean ? "bad" : "neutral", nextFn: () => nextEvent() });
              }} style={{ padding: 36, borderColor: CL.bdr }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.red, marginBottom: 10 }}>❌ Reject the Proposal</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 10 }}>Turn them away. {curInvestor.envRisk.includes("None") ? "No clear reason." : "Protect environment and communities."}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Bg text="-8 business" color={CL.red} />{curInvestor.envRisk.includes("None") ? <Bg text="-3 approval" color={CL.red} /> : <Bg text="+2 approval" color={CL.grn} />}<Bg text="No jobs" color={CL.td} /></div>
              </Cd>
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "abuja"}>
          <Cd style={{ borderColor: CL.gold + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>🏛️✈️</div>
              <Bg text="Federal Invitation" color={CL.gold} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(72), fontWeight: 600 }}>Presidential Summons to Abuja</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 14 }}>
                The Presidency has invited all governors of your party to Aso Rock Villa for a "consultative meeting." 
                In reality, Mr. President wants to discuss the next election cycle and assess loyalty.
              </p>
              <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 43 }}>
                Going shows loyalty to the federal government and party structure — but you'll be away from your state for 3 days while issues pile up. 
                Refusing signals independence — but the President notices who didn't show up.
              </p>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 804, margin: "0 auto" }}>
              <Cd onClick={() => {
                setAbujaVisited(true);
                setS(p => ({ ...p, pStab: cl100(p.pStab + 8), app: cl100(p.app - 3) }));
                setSkApp(p => ({ ...p, party: cl100((p.party || 50) + 10) }));
                addL("✈️ Visited Aso Rock. President received you warmly. Party stability rose. But citizens noticed your absence.", "political");
                // Small chance of getting a federal favour
                const rf = Math.random();
                if (rf < .35) {
                  setS(p2 => ({ ...p2, faac: p2.faac + 1.5 }));
                  addL("💰 Federal favour: President approved additional ₦1.5B intervention fund for your state.", "policy");
                }
                nextEvent();
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>✈️ Go to Abuja</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Show loyalty to the President and party leadership. Network with other governors.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="+8 party stability" color={CL.grn} />
                  <Bg text="-3 approval" color={CL.red} />
                  <Bg text="+10 party execs" color={CL.pur} />
                  <Bg text="35% chance of federal favour" color={CL.teal} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setAbujaVisited(true);
                setS(p => ({ ...p, pStab: cl100(p.pStab - 5), app: cl100(p.app + 4) }));
                setSkApp(p => ({ ...p, party: cl100((p.party || 50) - 8), youth: cl100((p.youth || 50) + 5) }));
                addL("🏠 Declined Abuja summons. Stayed to work. Citizens impressed. Party leaders took note — negatively.", "political");
                nextEvent();
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.org, marginBottom: 10 }}>🏠 Decline — Stay and Govern</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>"I was elected to serve my state, not warm chairs in Abuja." Citizens will love it. The party won't.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="-5 party stability" color={CL.red} />
                  <Bg text="+4 approval" color={CL.grn} />
                  <Bg text="-8 party execs" color={CL.red} />
                  <Bg text="+5 youth" color={CL.grn} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setAbujaVisited(true);
                setS(p => ({ ...p, pStab: cl100(p.pStab + 3) }));
                addL("📞 Sent Deputy Governor to Abuja in your place. Diplomatic middle ground.", "political");
                nextEvent();
              }} style={{ padding: 43, borderColor: CL.bdr }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.blu, marginBottom: 10 }}>🤝 Send Deputy Governor Instead</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>A diplomatic compromise. The President sees a representative. You stay focused. Nobody fully happy, nobody fully offended.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="+3 party stability" color={CL.grn} />
                  <Bg text="No approval change" color={CL.td} />
                </div>
              </Cd>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "netherlands"}>
          <Cd style={{ borderColor: CL.teal + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>🇳🇱🤝</div>
              <Bg text="International Opportunity" color={CL.teal} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(72), fontWeight: 600 }}>Dutch Investor Delegation</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 14 }}>
                A delegation of Dutch investors in agriculture and renewable energy has invited you to The Hague for a 5-day investment forum.
                They are considering {state.replace("_", " ")} State for a major agro-processing and solar farm project worth €40 million.
              </p>
              <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 43 }}>
                This could transform your state's economy — but you'll be abroad for almost a week. Opposition will say you're "junketing" with public funds.
                The trip costs ₦0.3B from your budget.
              </p>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 804, margin: "0 auto" }}>
              <Cd onClick={() => {
                setNetherlandsVisited(true);
                const success = Math.random() < .55;
                const hiddenBoost = 1.5 + Math.random() * 1.5;
                if (success) {
                  setS(p => ({ ...p, igr: p.igr + 3 + hiddenBoost, faac: p.faac + 0.8, agr: cl(p.agr + .04), infra: cl(p.infra + .02), app: cl100(p.app + 6), debt: p.debt + 0.3 }));
                  setSkApp(p => ({ ...p, business: cl100((p.business || 50) + 12), youth: cl100((p.youth || 50) + 5) }));
                  addL("🇳🇱 Netherlands trip SUCCESS! Dutch investors commit €40M.", "policy");
                  showResult({ icon: "🇳🇱🎉", title: "The Hague — DEAL SIGNED!", narrative: "The Dutch investors were impressed by your personal presence. After 3 days of negotiations, they committed €40 million to an agro-processing and solar farm project. Construction begins in 6 months.", effects: [
                    { icon: "💰", text: "IGR boost from investment", value: "+₦" + (3 + hiddenBoost).toFixed(1) + "B", good: true },
                    { icon: "💸", text: "FAAC bonus from bilateral goodwill", value: "+₦0.8B", good: true },
                    { icon: "🌾", text: "Agriculture sector boosted", value: "+4%", good: true },
                    { icon: "📈", text: "Public approves the deal", value: "+6 approval", good: true },
                    { icon: "🤝", text: "Business stakeholders delighted", value: "+12", good: true },
                    { icon: "💰", text: "Trip cost", value: "-₦0.3B", bad: true },
                  ], tone: "good", nextFn: () => nextEvent() });
                } else {
                  setS(p => ({ ...p, igr: p.igr + hiddenBoost, faac: p.faac + 0.5, app: cl100(p.app - 2), debt: p.debt + 0.3 }));
                  setSkApp(p => ({ ...p, business: cl100((p.business || 50) + 3) }));
                  addL("🇳🇱 Netherlands trip: No commitment yet. 'We will be in touch.'", "political");
                  showResult({ icon: "🇳🇱😐", title: "The Hague — No Deal (Yet)", narrative: "The investors were polite but non-committal. 'We will be in touch,' they said. However, your trip wasn't wasted — bilateral connections were made and some quiet financial benefits are flowing.", effects: [
                    { icon: "💰", text: "Quiet bilateral benefits", value: "+₦" + hiddenBoost.toFixed(1) + "B IGR", good: true },
                    { icon: "💸", text: "Slight FAAC boost from goodwill", value: "+₦0.5B", good: true },
                    { icon: "📉", text: "Opposition mocks 'failed junketing'", value: "-2 approval", bad: true },
                    { icon: "💰", text: "Trip cost", value: "-₦0.3B", bad: true },
                  ], tone: "neutral", nextFn: () => nextEvent() });
                }
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.teal, marginBottom: 10 }}>✈️ Go to The Hague</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Meet the investors personally. Your presence shows seriousness. 55% chance they commit.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="₦0.3B cost" color={CL.red} />
                  <Bg text="55% deal success" color={CL.teal} />
                  <Bg text="If success: +₦3B IGR" color={CL.grn} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setNetherlandsVisited(true);
                setSkApp(p => ({ ...p, business: cl100((p.business || 50) - 4) }));
                addL("📞 Declined Netherlands trip. Sent delegation.", "political");
                showResult({ icon: "📞", title: "Delegation Sent — You Stayed", narrative: "Your commissioner attended in your place. The investors were respectful but clearly disappointed. 'We wanted to meet the governor personally,' they said. The deal is unlikely to materialise without your direct involvement.", effects: [
                  { icon: "👔", text: "Business stakeholders note your absence", value: "-4", bad: true },
                  { icon: "💰", text: "No trip cost — budget preserved", value: "₦0", good: true },
                  { icon: "❌", text: "Deal unlikely without governor present", bad: true },
                ], tone: "neutral", nextFn: () => nextEvent() });
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.org, marginBottom: 10 }}>📞 Decline — Send Trade Delegation</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Save the trip cost. Your commissioner goes instead. But investors wanted to meet the decision-maker.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="No cost" color={CL.grn} />
                  <Bg text="-4 business stakeholder" color={CL.red} />
                  <Bg text="Deal unlikely without you" color={CL.org} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setNetherlandsVisited(true);
                setS(p => ({ ...p, debt: p.debt + 0.1 }));
                const dealChance = Math.random() < .25;
                if (dealChance) {
                  setS(p => ({ ...p, igr: p.igr + 1.5, agr: cl(p.agr + .02) }));
                  addL("🇳🇱 Virtual diplomacy worked! Smaller €15M pilot project.", "policy");
                  showResult({ icon: "💻✅", title: "Virtual Meeting — Small Win!", narrative: "The video conference went well. While they didn't commit to the full €40M, they agreed to a €15M pilot agro-processing project. It's smaller but it's something — and you didn't leave the state.", effects: [
                    { icon: "💰", text: "Smaller investment secured", value: "+₦1.5B IGR", good: true },
                    { icon: "🌾", text: "Agriculture sector improved", value: "+2%", good: true },
                    { icon: "👨‍💻", text: "Youth approve modern approach", value: "+4 youth", good: true },
                    { icon: "💰", text: "Minimal cost", value: "-₦0.1B", bad: true },
                  ], tone: "good", nextFn: () => nextEvent() });
                } else {
                  addL("💻 Virtual meeting with Dutch investors. Polite but no commitment.", "political");
                  showResult({ icon: "💻😐", title: "Virtual Meeting — No Deal", narrative: "The video conference was professional but lacked the personal chemistry needed to close a deal. The investors will 'consider other states.' At least you didn't spend much.", effects: [
                    { icon: "❌", text: "No investment secured", bad: true },
                    { icon: "👨‍💻", text: "Youth approve tech-forward approach", value: "+4 youth", good: true },
                    { icon: "💰", text: "Minimal cost", value: "-₦0.1B" },
                  ], tone: "neutral", nextFn: () => nextEvent() });
                }
                setSkApp(p => ({ ...p, youth: cl100((p.youth || 50) + 4) }));
              }} style={{ padding: 43, borderColor: CL.bdr }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.blu, marginBottom: 10 }}>💻 Virtual Meeting Instead</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Host a video conference from Government House. Modern, cheap, but less personal. 25% chance of smaller deal.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="₦0.1B cost" color={CL.org} />
                  <Bg text="25% smaller deal" color={CL.blu} />
                  <Bg text="+4 youth" color={CL.grn} />
                </div>
              </Cd>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "wedding"}>
          <Cd style={{ borderColor: CL.pur + "22" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>💒👰</div>
              <Bg text="Social Obligation" color={CL.pur} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(72), fontWeight: 600 }}>Governor's Daughter's Wedding</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 14 }}>
                The Governor of {sd.zone === "SW" ? "Kano" : sd.zone === "NW" ? "Lagos" : sd.zone === "SE" ? "Rivers" : sd.zone === "SS" ? "Oyo" : sd.zone === "NE" ? "Kaduna" : "Enugu"} State is hosting a lavish wedding for his daughter.
                Every governor in the country is expected. It's the social event of the political calendar.
                Your absence will be noticed — and talked about.
              </p>
              <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 43 }}>
                In Nigerian politics, these events are where deals are made, alliances formed, and grudges noted.
                But your citizens see governors flying around to weddings while roads are broken.
              </p>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 804, margin: "0 auto" }}>
              <Cd onClick={() => {
                setWeddingVisited(true);
                setS(p => ({ ...p, pStab: cl100(p.pStab + 5), app: cl100(p.app - 4), debt: p.debt + 0.2 }));
                setSkApp(p => ({ ...p, party: cl100((p.party || 50) + 8), traditional: cl100((p.traditional || 50) + 5), media: cl100((p.media || 50) - 5) }));
                addL("💒 Attended governor's daughter wedding. Networked with 12 governors. Media called it 'junketing.'", "political");
                // Chance to secure an interstate deal
                if (Math.random() < .3) {
                  setS(p2 => ({ ...p2, infra: cl(p2.infra + .02) }));
                  addL("🤝 Side meeting at wedding: Agreed joint infrastructure project with neighbouring state.", "policy");
                }
                nextEvent();
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.pur, marginBottom: 10 }}>💒 Attend the Wedding</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Fly in with your entourage. Spray naira at the reception. Network with other governors in the VIP tent.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="+5 party" color={CL.grn} />
                  <Bg text="-4 approval" color={CL.red} />
                  <Bg text="+8 party execs" color={CL.pur} />
                  <Bg text="₦0.2B cost" color={CL.red} />
                  <Bg text="30% interstate deal" color={CL.teal} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setWeddingVisited(true);
                setS(p => ({ ...p, pStab: cl100(p.pStab - 3), app: cl100(p.app + 5) }));
                setSkApp(p => ({ ...p, party: cl100((p.party || 50) - 6), youth: cl100((p.youth || 50) + 6), media: cl100((p.media || 50) + 4) }));
                addL("🏠 Skipped the wedding. Spent the weekend inspecting road projects. Citizens loved it. Governors' WhatsApp group went quiet.", "political");
                nextEvent();
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>🏠 Skip It — Stay and Work</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>"I didn't take an oath to attend weddings." Post photos of yourself inspecting projects instead.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="-3 party" color={CL.red} />
                  <Bg text="+5 approval" color={CL.grn} />
                  <Bg text="+6 youth" color={CL.grn} />
                  <Bg text="+4 media" color={CL.grn} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setWeddingVisited(true);
                setS(p => ({ ...p, pStab: cl100(p.pStab + 2), app: cl100(p.app - 1) }));
                addL("🎁 Sent Deputy Governor with a generous gift. Balanced approach. Host governor appreciated the gesture.", "political");
                setSkApp(p => ({ ...p, party: cl100((p.party || 50) + 3), traditional: cl100((p.traditional || 50) + 3) }));
                nextEvent();
              }} style={{ padding: 43, borderColor: CL.bdr }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.blu, marginBottom: 10 }}>🎁 Send Deputy + Gift</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Your deputy represents you. Send a generous gift. You stay, but respect is shown.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="+2 party" color={CL.grn} />
                  <Bg text="-1 approval" color={CL.org} />
                  <Bg text="+3 traditional" color={CL.pur} />
                </div>
              </Cd>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "intl_invite" && !!curInvite}>
          {curInvite && <Cd style={{ borderColor: CL.blu + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(113), marginBottom: 22 }}>{curInvite.icon}✉️</div>
              <Bg text="International Invitation" color={CL.blu} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(65), fontWeight: 600 }}>Letter from {curInvite.who}</h3>
              <div style={{ fontSize: TS(34), color: CL.pur, fontFamily: F.m, marginBottom: 22 }}>{curInvite.from}</div>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 36, textAlign: "left", maxWidth: 804, margin: "0 auto 36px" }}>{curInvite.what}</p>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 840, margin: "0 auto" }}>
              <Cd onClick={() => {
                setS(p => {
                  const n = { ...p, debt: p.debt + (curInvite.goCost || 0) };
                  if (curInvite.goFx.igr) n.igr += curInvite.goFx.igr;
                  if (curInvite.goFx.app) n.app = cl100(n.app + curInvite.goFx.app);
                  if (curInvite.goFx.lit) n.lit = cl(n.lit + curInvite.goFx.lit);
                  if (curInvite.goFx.hp) n.hp = cl(n.hp + curInvite.goFx.hp);
                  if (curInvite.goFx.infra) n.infra = cl(n.infra + curInvite.goFx.infra);
                  if (curInvite.goFx.agr) n.agr = cl(n.agr + curInvite.goFx.agr);
                  if (curInvite.goFx.sec) n.sec = cl(n.sec + curInvite.goFx.sec);
                  return n;
                });
                setSkApp(p => { const n = { ...p }; Object.entries(curInvite.goSk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
                addL("🌍 " + curInvite.goLog, "policy");
                const goEffects = [];
                if (curInvite.goFx.igr) goEffects.push({ icon: "💰", text: "IGR boosted", value: "+₦" + curInvite.goFx.igr + "B", good: true });
                if (curInvite.goFx.app) goEffects.push({ icon: "📈", text: "Approval rises", value: "+" + curInvite.goFx.app + "%", good: true });
                if (curInvite.goFx.infra) goEffects.push({ icon: "🏗️", text: "Infrastructure improved", value: "+" + Math.round(curInvite.goFx.infra * 100) + "%", good: true });
                if (curInvite.goFx.lit) goEffects.push({ icon: "📚", text: "Education improved", good: true });
                if (curInvite.goFx.hp) goEffects.push({ icon: "🏥", text: "Health improved", good: true });
                if (curInvite.goFx.agr) goEffects.push({ icon: "🌾", text: "Agriculture improved", good: true });
                if (curInvite.goCost) goEffects.push({ icon: "💸", text: "Travel costs", value: "₦" + curInvite.goCost + "B", bad: true });
                Object.entries(curInvite.goSk || {}).forEach(([k, v]) => { if (v > 0) goEffects.push({ icon: "👥", text: k + " stakeholders pleased", value: "+" + v, good: true }); });
                const invRef = curInvite;
                setCurInvite(null);
                showResult({ icon: invRef.icon, title: "International Visit — " + invRef.from.split(",")[0], narrative: invRef.goLog + " Your personal presence opened doors that a delegation never could. International media covered your visit, boosting your state's global profile.", effects: goEffects, tone: "good", nextFn: () => nextEvent() });
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>✈️ Go in Person</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Represent your state at the highest level. Personal presence opens doors that delegations cannot.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {curInvite.goCost > 0 && <Bg text={"₦" + curInvite.goCost + "B cost"} color={CL.red} />}
                  {curInvite.goFx.igr && <Bg text={"+" + naira(curInvite.goFx.igr) + " IGR"} color={CL.grn} />}
                  {curInvite.goFx.app && <Bg text={"+" + curInvite.goFx.app + " approval"} color={CL.grn} />}
                </div>
              </Cd>

              <Cd onClick={() => {
                setS(p => {
                  const n = { ...p };
                  if (curInvite.delFx.app) n.app = cl100(n.app + curInvite.delFx.app);
                  if (curInvite.delFx.lit) n.lit = cl(n.lit + curInvite.delFx.lit);
                  if (curInvite.delFx.agr) n.agr = cl(n.agr + curInvite.delFx.agr);
                  if (curInvite.delFx.infra) n.infra = cl(n.infra + curInvite.delFx.infra);
                  return n;
                });
                setSkApp(p => { const n = { ...p }; Object.entries(curInvite.delSk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
                addL("📤 " + curInvite.delLog, "political");
                const delEffects = [{ icon: "📤", text: "Delegation sent — reduced impact", bad: true }];
                if (curInvite.delFx.app) delEffects.push({ icon: curInvite.delFx.app > 0 ? "📈" : "📉", text: "Approval", value: (curInvite.delFx.app > 0 ? "+" : "") + curInvite.delFx.app + "%", good: curInvite.delFx.app > 0 });
                Object.entries(curInvite.delSk || {}).forEach(([k, v]) => { delEffects.push({ icon: "👥", text: k + " stakeholders", value: (v > 0 ? "+" : "") + v, good: v > 0, bad: v < 0 }); });
                const invRef2 = curInvite;
                setCurInvite(null);
                showResult({ icon: "📤", title: "Delegation Sent — " + invRef2.from.split(",")[0], narrative: invRef2.delLog + " Your deputy represented the state adequately, but some doors that would have opened for a sitting governor remained closed.", effects: delEffects, tone: "neutral", nextFn: () => nextEvent() });
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.blu, marginBottom: 10 }}>📤 Send a Delegation</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Your deputy or commissioner attends on your behalf. You stay focused on governance. Some doors stay closed.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Bg text="No travel cost" color={CL.grn} />
                  <Bg text="Reduced impact" color={CL.org} />
                </div>
              </Cd>

              <Cd onClick={() => {
                setS(p => {
                  const n = { ...p };
                  if (curInvite.decFx.app) n.app = cl100(n.app + curInvite.decFx.app);
                  return n;
                });
                setSkApp(p => { const n = { ...p }; Object.entries(curInvite.decSk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
                addL("❌ " + curInvite.decLog, "political");
                const decEffects = [{ icon: "❌", text: "Invitation declined", bad: true }];
                if (curInvite.decFx.app) decEffects.push({ icon: "📉", text: "Approval", value: curInvite.decFx.app + "%", bad: true });
                Object.entries(curInvite.decSk || {}).forEach(([k, v]) => { decEffects.push({ icon: "⚠️", text: k + " stakeholders", value: v, bad: v < 0 }); });
                const invRef3 = curInvite;
                setCurInvite(null);
                showResult({ icon: "❌", title: "Declined — " + invRef3.from.split(",")[0], narrative: invRef3.decLog + " Some see focus. Others see a missed opportunity for your state.", effects: decEffects, tone: "bad", nextFn: () => nextEvent() });
              }} style={{ padding: 43, borderColor: CL.bdr }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.org, marginBottom: 10 }}>❌ Decline</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>"I have a state to run." Some will respect the focus. Others will see a missed opportunity.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {curInvite.decFx.app && <Bg text={curInvite.decFx.app + " approval"} color={CL.red} />}
                  <Bg text="Opportunity cost" color={CL.org} />
                </div>
              </Cd>
            </div>
          </Cd>}
        </OL>

        <OL show={phase === "reelection"}>
          <Cd style={{ borderColor: CL.grn + "44" }}>
            <AdvBubble text={ADV.reelection} saName={cast.adviser.name} />
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>🗳️</div>
              <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(72), fontWeight: 600, margin: "0 0 14px" }}>End of First Term</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), marginBottom: 22 }}>Four years in office. What will you do next?</p>
              <div style={{ display: "flex", gap: 22, justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
                <Bg text={"Approval: " + Math.round(s.app) + "%"} color={s.app >= 40 ? CL.grn : CL.red} />
                <Bg text={"Party: " + Math.round(s.pStab) + "%"} color={s.pStab > 50 ? CL.grn : CL.red} />
                <Bg text={"Corruption: " + Math.round(s.cor * 100) + "%"} color={s.cor < .3 ? CL.grn : CL.red} />
              </div>
            </div>
            <div style={{ display: "grid", gap: 29, maxWidth: 876, margin: "0 auto" }}>
              {/* Automatic ticket if party stable, otherwise must pay or switch */}
              {s.pStab >= 50 ? <Cd onClick={s.app >= 40 ? () => { setCampWarChest(personalFund); setCampGfDebt(0); setCampGfBorrowed(false); setPhase("convention2"); } : undefined} style={{ padding: 43, opacity: s.app >= 40 ? 1 : .4 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: s.app >= 40 ? CL.grn : CL.red, marginBottom: 10 }}>🗳️ Run for Re-Election ({party})</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>
                  {s.app >= 40 ? "Party stability is strong (" + Math.round(s.pStab) + "%). Automatic ticket. Your personal campaign fund: ₦" + (personalFund * 1000).toFixed(0) + "M." : "Need 40%+ approval. You have " + Math.round(s.app) + "%."}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Bg text="Automatic ticket" color={CL.grn} />
                  <Bg text={"₦" + (personalFund * 1000).toFixed(0) + "M war chest"} color={personalFund > 0.5 ? CL.gold : CL.red} />
                  <Bg text={s.app >= 40 ? (s.app > 60 ? "STRONG CHANCE" : "COMPETITIVE") : "NOT VIABLE"} color={s.app >= 60 ? CL.grn : s.app >= 40 ? CL.org : CL.red} />
                </div>
              </Cd> : <Cd style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.org, marginBottom: 10 }}>⚠️ Party Ticket Contested!</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Party stability is low ({Math.round(s.pStab)}%). Your party ticket is NOT automatic. You must buy your way back in or switch parties.</div>
                <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                  {/* Buy ticket in same party */}
                  {s.app >= 40 && <Cd onClick={() => {
                    const ticketCost = PARTIES.find(p => p.id === party)?.ticket || 1;
                    if (godfatherRel > 30) {
                      setCampWarChest(personalFund); setCampGfDebt(ticketCost); setCampGfBorrowed(true);
                      setS(p => ({ ...p, cor: cl(p.cor + .06) }));
                      addL("🎩 Godfather funds contested primary ticket. ₦" + ticketCost + "B. +6% corruption.", "political");
                      setPhase("convention2");
                    } else {
                      setCampWarChest(Math.max(0, 2.5 - ticketCost)); setCampGfDebt(0);
                      setPhase("convention2");
                    }
                  }} style={{ padding: 29 }}>
                    <div style={{ fontSize: TS(38), fontWeight: 600, color: CL.org }}>💰 Fight for {party} Ticket {godfatherRel > 30 ? "(Godfather funds)" : "(Self-funded ₦" + (PARTIES.find(p => p.id === party)?.ticket || 1) + "B)"}</div>
                    <div style={{ fontSize: TS(31), color: CL.td }}>{godfatherRel > 30 ? "Godfather pays but adds +6% corruption." : "Pay from your war chest. Less money for campaign."}</div>
                  </Cd>}
                  {/* Switch to cheaper party */}
                  {s.app >= 40 && <Cd onClick={() => {
                    const cheapParty = PARTIES.filter(p => p.id !== party).sort((a, b) => a.ticket - b.ticket)[0];
                    setup.party = cheapParty.id;
                    setS(p => ({ ...p, pStab: cl100(p.pStab - 15) }));
                    setCampWarChest(personalFund); setCampGfDebt(0); setCampGfBorrowed(false);
                    addL("⚡ PARTY SWITCH: Governor defects to " + cheapParty.id + "! -15 party stability.", "political");
                    setPhase("convention2");
                  }} style={{ padding: 29, borderColor: CL.red + "33" }}>
                    <div style={{ fontSize: TS(38), fontWeight: 600, color: CL.red }}>🔄 Switch Parties (Defect)</div>
                    <div style={{ fontSize: TS(31), color: CL.td }}>Join a cheaper party. Free ticket but -15 party stability. Weaker campaign machinery.</div>
                  </Cd>}
                </div>
              </Cd>}
              {godfatherRel <= 30 && s.pStab < 50 && <div style={{ background: CL.red + "08", border: "1px solid " + CL.red + "20", borderRadius: 8, padding: "19px 29px", fontSize: TS(34), color: CL.red, marginBottom: 14 }}>
                🎩 <strong>Godfather has abandoned you.</strong> Relationship: {godfatherRel}%. He won't fund your ticket or campaign. You're on your own — self-fund or step aside.
              </div>}
              <Cd onClick={() => { addL("🏛️ Governor " + pName + " steps down voluntarily.", "political"); setGEnd("stepped_down"); }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.blu, marginBottom: 10 }}>🏛️ Step Down</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>Exit with dignity. Senate / retirement available.</div>
              </Cd>
              {(() => {
                const di2 = ((s.lit + s.hp + s.infra + s.sec + s.agr) / 5 * 100);
                const fi2 = Math.max(0, 100 - s.debt * 4 - s.cor * 40);
                const ov2 = (di2 * .3 + s.app * .3 + fi2 * .2 + (100 - s.cor * 100) * .2);
                const canPres = ov2 > 55 && s.app > 48 && s.pStab > 45;
                return <Cd onClick={canPres ? () => { addL("🇳🇬 Governor resigns to run for PRESIDENT!", "political"); setGEnd("pres_bid"); } : undefined} style={{ padding: 43, opacity: canPres ? 1 : .35 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(48), color: canPres ? CL.gold : CL.td, marginBottom: 10 }}>🇳🇬 Run for President</div>
                  <div style={{ fontSize: TS(34), color: CL.td }}>{canPres ? "Your record qualifies you for a presidential bid." : "Need 55+ score, 48%+ approval, 45%+ party."}</div>
                </Cd>;
              })()}
            </div>
          </Cd>
        </OL>

        <OL show={phase === "campaign_election"}>
          {(() => {
            const oppSeed = turn * 99 + state.length * 77;
            const oppR = rng(oppSeed);
            gN(oppR, sd.zone, setup?.state); // keeps the party draw below unchanged
            const oppName = cast.rival.name; // the rival from the first election comes back
            const oppParty = PARTIES.filter(p => p.id !== party)[Math.floor(oppR() * (PARTIES.length - 1))];
            const activeReZones = campZones || buildBattlegrounds(state, turn * 2027, party, oppParty?.id);
            const reSwing = activeReZones.reduce((a, b) => b.swing > a.swing ? b : a, activeReZones[0]);
            const reWeak = activeReZones.reduce((a, b) => b.support < a.support ? b : a, activeReZones[0]);
            const reBase = activeReZones.reduce((a, b) => b.support > a.support ? b : a, activeReZones[0]);
            const week = Math.floor(campRound / 2) + 1;
            const isAction = campRound % 2 === 0 && campRound < 8;
            const isOppEvent = campRound % 2 === 1 && campRound < 8;
            const isResult = campRound >= 8;

            const ReZoneBoard = () => <Cd style={{ padding: 24, margin: "18px 0", background: "#fbfcf8", textAlign: "left" }}>
              <div style={{ fontSize: TS(29), fontWeight: 700, color: CL.grn, fontFamily: F.m, letterSpacing: 2, marginBottom: 12 }}>WHERE YOU STAND</div>
              {activeReZones.map(z => { const you = pollShare(z); return <div key={z.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: TS(31), color: CL.txt }}><b>{z.zone.replace(" Senatorial", "")}</b><span style={{ fontFamily: F.m }}><b style={{ color: you >= 50 ? CL.grn : CL.txt }}>You {you}%</b> · <span style={{ color: you < 50 ? CL.red : CL.tm }}>{oppParty?.id || "Opponent"} {100 - you}%</span></span></div>
                <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", margin: "6px 0 4px", background: CL.red + "55" }}><div style={{ width: you + "%", background: CL.grn }} /></div>
                <div style={{ fontSize: TS(27), color: CL.td }}>{z.key}</div>
              </div>; })}
              <div style={{ fontSize: TS(27), color: CL.td }}>Poll, margin ±4. Your record, turnout and money decide close zones.</div>
            </Cd>;

            const acts = [
              [
                { l: "📢 Town Hall Tours", days: 3, d: "Visit all 3 senatorial zones, opening in " + reBase.key + ".", pts: 6, oppPts: 1, cost: 0.25, sk: { traditional: 5, youth: 4 }, target: "all", your: 3, turnout: 4, risk: "Expensive but incumbents must be visible." },
                { l: "📺 TV Debate Challenge", days: 4, d: "Defend your record live across the state.", pts: 8, oppPts: -3, cost: 0, sk: { media: 8, youth: 6 }, target: "all", your: 2, opp: -2, risk: "Your record will be scrutinised." },
                { l: "📋 Policy Manifesto (Cheap)", days: 2, d: "Print a ward-level 2nd term agenda for " + reSwing.key + ".", pts: 3, oppPts: 0, cost: 0.03, sk: { media: 4, business: 4 }, target: reSwing.id, your: 4, risk: "Documents don't win elections." },
              ],[
                { l: "🏘️ LGA Grassroots Rally", days: 2, d: "500 buses through " + reSwing.key + ".", pts: 7, oppPts: 1, cost: 0.35, sk: { youth: 8, traditional: 4 }, target: reSwing.id, your: 8, turnout: 6, risk: "Expensive grassroots push." },
                { l: "🤝 Defector Recruitment", days: 4, d: "Pull ward structures from opposition in " + reWeak.key + ".", pts: 5, oppPts: -4, cost: 0, sk: { party: 8 }, target: reWeak.id, your: 6, opp: -4, corAdd: .02, risk: "Horse-trading." },
                { l: "📻 Radio + Social Blitz (Cheap)", days: 2, d: "Radio ads and WhatsApp in your base: " + reBase.key + ".", pts: 3, oppPts: 0, cost: 0.05, sk: { media: 3, youth: 3 }, target: reBase.id, your: 4, risk: "Opponent is on TV." },
              ],[
                { l: "🛡️ Defend Your Record", days: 2, d: "Release project receipts by LGA.", pts: 6, oppPts: -1, cost: 0.1, sk: { media: 6, business: 5 }, target: "all", your: 2, risk: "Only works if numbers are good." },
                { l: "⚔️ Go Negative", days: 4, d: "Attack opponent. Free but risky.", pts: 3, oppPts: -6, cost: 0, sk: { media: -5, youth: -4 }, target: "all", opp: -4, appRisk: -4, risk: "Could backfire badly." },
                { l: "🙏 Stay Positive (Cheap)", days: 3, d: "Faith and peace message in " + reWeak.key + ".", pts: 2, oppPts: 2, cost: 0, sk: { religious: 6, traditional: 5 }, target: reWeak.id, your: 3, risk: "Noble but weak." },
              ],[
                { l: "🏟️ Mega Rally", days: 3, d: "100K closeout, buses from every listed LGA.", pts: 9, oppPts: 1, cost: 0.4, sk: { youth: 10, party: 5 }, target: "all", your: 4, turnout: 5, risk: "This defines your campaign." },
                { l: "🚪 Door-to-Door (Moderate)", days: 3, d: "Volunteers in swing LGAs: " + reSwing.key + ".", pts: 6, oppPts: 0, cost: 0.15, sk: { traditional: 6 }, target: reSwing.id, your: 6, turnout: 8, risk: "Slow. Opponent at rallies." },
                { l: "🗳️ Election Day Agents", days: 2, d: "Polling-unit agents in all collation areas.", pts: 3, oppPts: 0, cost: 0.08, sk: { party: 3 }, target: "all", your: 1, turnout: 2, corAdd: .01, risk: "Opponent spending 5x more." },
              ],
            ];

            const oppEvs = [
              { t: "📰 Opponent Releases Damning Report", d: oppName + " publishes '4 Years of Failure' and pushes it through " + reWeak.key + ".", opts: [
                { l: "📊 Counter with Data", days: 2, dc: 0.02, d: "Release your LGA scorecard.", pts: 4, oppPts: -2, sk: { media: 5 }, target: reWeak.id, your: 4, opp: -2 },
                { l: "🤫 Ignore", days: 1, d: "Don't dignify it. A day spent holding your team back.", pts: 0, oppPts: 3, sk: { media: -3 }, target: reWeak.id, opp: 4 },
                { l: "⚖️ Threaten Lawsuit", days: 2, dc: 0.05, d: "Send lawyers.", pts: 1, oppPts: -1, sk: { media: -8, youth: -4 }, target: "all", opp: -1 },
              ]},
              { t: "🎤 Opponent Rally Goes Viral", d: oppName + "'s rally near " + reSwing.key + " hits 500K views. Momentum shifting.", opts: [
                { l: "🏟️ Bigger Rally", days: 2, d: "Match their energy with a bigger crowd.", pts: 5, oppPts: -1, sk: { youth: 5 }, dc: .3, target: reSwing.id, your: 6, turnout: 3 },
                { l: "📺 Buy TV Airtime", days: 1, d: "Outspend them statewide.", pts: 3, oppPts: 0, sk: { media: 4 }, dc: .2, target: "all", your: 2 },
                { l: "🚪 Go Grassroots", days: 3, d: "Let them have spectacle; knock doors in " + reSwing.key + ".", pts: 4, oppPts: 1, sk: { traditional: 5 }, target: reSwing.id, your: 5 },
              ]},
              { t: "💀 Corruption Allegations", d: "Newspaper 'evidence' of corruption circulates from ward groups to radio.", opts: [
                { l: "📋 Open Books", days: 2, dc: 0.03, d: "Full transparency.", pts: 6, oppPts: -3, sk: { media: 10, business: 5 }, target: "all", your: 3, opp: -3 },
                { l: "🗣️ 'Fake News!'", days: 1, d: "Deny everything.", pts: 2, oppPts: 2, sk: { media: -6 }, target: "all", opp: 3 },
                { l: "🔄 Pivot to Projects", days: 2, d: "Talk roads, not corruption.", pts: 3, oppPts: 1, sk: { youth: -3 }, target: reBase.id, your: 3 },
              ]},
              { t: "🤝 Major Endorsement for Opponent", d: "A former governor endorses " + oppName + " and claims your base is collapsing.", opts: [
                { l: "📞 Counter-Endorsements", days: 3, dc: 0.1, d: "Call everyone. Secure your own.", pts: 4, oppPts: -2, sk: { party: 5 }, target: "all", your: 2, opp: -2 },
                { l: "💪 People Are My Endorsement", days: 2, d: "Populist message in " + reSwing.key + ".", pts: 5, oppPts: 0, sk: { youth: 8, media: 4 }, target: reSwing.id, your: 5 },
                { l: "💰 Offer Better Deals", days: 2, dc: 0.15, d: "Match their offers.", pts: 3, oppPts: -3, sk: { party: 6 }, target: reWeak.id, your: 4, opp: -3, corAdd: .02 },
              ]},
            ];

            // Part 2 — resources this week: money and campaign days
            const WEEK_DAYS = 6;
            const daysLeft = isOppEvent ? WEEK_DAYS - campDays : WEEK_DAYS;
            const optCost = (opt) => opt.cost || opt.dc || 0;
            const canTake = (opt) => optCost(opt) <= campWarChest + 1e-9 && (opt.days || 1) <= daysLeft;
            const zoneLabel = (t) => t === "all" || t === undefined ? "All zones" : (activeReZones.find(z => z.id === t)?.zone || "").replace(" Senatorial", "") + " zone";
            const ScoreBoard = () => <Cd style={{ padding: 22, marginBottom: 18, display: "flex", justifyContent: "space-around", gap: 14, textAlign: "center" }}>
              <div><div style={{ fontSize: TS(44), fontWeight: 700, color: CL.gold, fontFamily: F.m }}>₦{campWarChest.toFixed(2)}B</div><div style={{ fontSize: TS(27), color: CL.td }}>money left</div></div>
              <div><div style={{ fontSize: TS(44), fontWeight: 700, color: CL.pur, fontFamily: F.m }}>{daysLeft} of {WEEK_DAYS}</div><div style={{ fontSize: TS(27), color: CL.td }}>campaign days left this week</div></div>
            </Cd>;
            const sitOut = { l: "🪑 Sit this one out", d: "No money or time for anything better. The opponent gains ground everywhere.", days: Math.max(1, daysLeft), pts: 0, oppPts: 3, target: "all", opp: 3 };
            // Part 3 — three option cards, same layout every week
            const OptCard = ({ opt }) => {
              const ok = opt === sitOut || canTake(opt);
              const cost = optCost(opt);
              const why = cost > campWarChest + 1e-9 ? "Not enough money" : (opt.days || 1) > daysLeft ? "Not enough days left" : "";
              return <Cd onClick={ok ? () => handleChoice(opt) : undefined} style={{ padding: 26, opacity: ok ? 1 : .45, textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: TS(36), color: ok ? CL.txt : CL.td, marginBottom: 6 }}>{opt.l}</div>
                <div style={{ fontSize: TS(32), color: CL.tm, lineHeight: 1.3 }}>{opt.d}</div>
                <div style={{ fontSize: TS(30), color: CL.txt, fontFamily: F.m, marginTop: 10 }}>{cost > 0 ? "₦" + cost.toFixed(2) + "B" : "No money"} · {opt.days || 1} {(opt.days || 1) === 1 ? "day" : "days"} · {zoneLabel(opt.target)}</div>
                {(opt.risk || opt.corAdd || opt.appRisk) && <div style={{ fontSize: TS(28), color: CL.org, marginTop: 6 }}>⚠️ {[opt.risk, opt.corAdd && "Promises to power brokers follow you into the next term.", opt.appRisk && !opt.risk && "Can backfire."].filter(Boolean).join(" ")}</div>}
                {!ok && <div style={{ fontSize: TS(28), color: CL.red, marginTop: 6 }}>{why}</div>}
              </Cd>;
            };
            const withFallback = (opts) => opts.some(canTake) ? opts : [...opts, sitOut];

            const handleChoice = (opt) => {
              const cost = optCost(opt);
              if (opt !== sitOut && !canTake(opt)) return;
              setCampWarChest(w => Math.max(0, w - cost));
              setCampDays(isOppEvent ? 0 : (opt.days || 1));
              const hm2 = setup?.level === "hard";
              // TOUGHER re-election: incumbency fatigue — opponent always gets a bonus, sharper on hard
              const yourPts = hm2 ? Math.max(opt.pts - 3, -4) : Math.max(opt.pts - 1, -2);
              const oppGain = hm2 ? (opt.oppPts || 0) + 3 : (opt.oppPts || 0) + 1;
              setCampScore(cs => cs + yourPts);
              setCampOpp(co => co + oppGain);
              const moveName = opt.l.replace(/^[^\s]+ /, "");
              setCampZones(prev => {
                const before = prev || activeReZones;
                const after = shiftZones(before, opt.target ?? "all", Math.max(0, (opt.your || 0) - 1), (opt.opp || 0) - 1, opt.turnout || 0);
                return after.map((z, i) => { const d = pollShare(z) - pollShare(before[i]); return d !== 0 ? { ...z, moves: [...(before[i].moves || []), { w: week, l: moveName, d }] } : z; });
              });
              if (opt.sk) setSkApp(p => { const n2 = { ...p }; Object.entries(opt.sk).forEach(([k, v]) => { if (n2[k] !== undefined) n2[k] = cl100(n2[k] + v); }); return n2; });
              if (opt.corAdd) setS(p => ({ ...p, cor: cl(p.cor + opt.corAdd) }));
              if (opt.appRisk && Math.random() < (hm2 ? .75 : .55)) { setS(p => ({ ...p, app: cl100(p.app + opt.appRisk) })); setCampLog(c2 => [...c2, "⚠️ Backfire: approval " + sgnN(opt.appRisk) + "."]); }
              setCampLog(c2 => [...c2, (isOppEvent ? "↩️ " : "▶️ ") + "Week " + week + ": " + moveName + " · " + (cost > 0 ? "₦" + cost.toFixed(2) + "B" : "no money") + " · " + (opt.days || 1) + (opt.days === 1 ? " day" : " days") + " · " + zoneLabel(opt.target)]);
              setCampRound(r => r + 1);
            };

            const borrowGF2 = () => {
              const amt = 0.8;
              setCampWarChest(w => w + amt);
              setCampGfDebt(d => d + amt);
              setCampGfBorrowed(true);
              setS(p => ({ ...p, cor: cl(p.cor + .08) })); // immediate corruption hit
              setCampLog(c2 => [...c2, "🎩 GODFATHER: Borrowed ₦" + amt + "B for re-election. +8% corruption. He'll demand repayment in your 2nd term."]);
            };

            if (isResult) {
              const hm2 = setup?.level === "hard";
              const narrBonus = narrative === "corrupt" ? -8 : narrative === "weak" ? -6 : narrative === "technocrat" || narrative === "reformer" ? 5 : narrative === "builder" ? 4 : narrative === "strongman" ? 3 : 0;
              const rePartyStrength = PARTIES.find(p => p.id === party)?.strength || 1;
              const reOppStrength = oppParty?.strength || 1;
              // Incumbency fatigue: baseline anti-incumbent drag, bigger jitter, opponent boost
              const antiIncumbent = -3 - (turn - 4) * 0.5;
              const recordBoost = (s.app - 50) * 0.22 + (s.pStab - 50) * 0.08 + (0.4 - s.cor) * 22 + narrBonus + (campScore - campOpp) * 0.32 + antiIncumbent;
              const eDay = rng(turn * 977 + (state?.length || 5) * 131 + campScore * 7 + campOpp * 13 + campLog.length * 29);
              const swayedReZones = activeReZones.map(z => ({ ...z, support: cl100(z.support + recordBoost + (eDay() - 0.5) * (hm2 ? 10 : 7)), opp: cl100(z.opp - recordBoost * 0.35 + 3 + (eDay() - 0.5) * (hm2 ? 8 : 5)) }));
              const collation = lgaElectionSummary(swayedReZones, rePartyStrength, reOppStrength, state);
              const won = collation.totalYou > collation.totalOpp && collation.zonesWon >= 2;
              const marginPct = (collation.totalYou + collation.totalOpp) > 0 ? Math.abs(collation.margin) / (collation.totalYou + collation.totalOpp) * 100 : 0;
              const yourLast = (setup?.lastNm || pName.split(" ").pop() || "YOU").toUpperCase();
              const yourTicket = yourLast + "/" + (depGov?.nm.split(" ").pop() || "DEP").toUpperCase();
              return <Cd style={{ textAlign: "center", padding: 36 }}>
                <div style={{ fontSize: TS(79), marginBottom: 7 }}>{won ? "🎉" : "😔"}</div>
                <h3 style={{ fontFamily: F.d, color: won ? CL.grn : CL.red, fontSize: TS(53), fontWeight: 600, margin: "7px 0" }}>{won ? "RE-ELECTED!" : "DEFEATED"}</h3>
                <p style={{ color: CL.tm, fontSize: TS(36), margin: "14px 0 29px", lineHeight: 1.35 }}>{won ? "Four more years! INEC has declared " + pName + " (" + party + ") re-elected, carrying " + collation.zonesWon + "/3 zones by " + marginPct.toFixed(1) + "%." : oppName + " (" + (oppParty?.id || "OPP") + ") defeats you. You carried only " + collation.zonesWon + "/3 zones. Margin against: " + marginPct.toFixed(1) + "%."}</p>
                {!won && <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
                  <Bt onClick={() => { addL("🗳️ DEFEATED by " + oppName + ": " + fmtVotesFull(collation.totalOpp) + " to " + fmtVotesFull(collation.totalYou) + " (lost " + (3 - collation.zonesWon) + "/3 zones)", "political"); setCampRound(0); setCampScore(0); setCampOpp(0); setCampLog([]); setCampZones(null); setGEnd("defeated"); }} style={{ padding: "29px 43px", fontSize: TS(38) }}>😔 Accept</Bt>
                  <Bt onClick={() => { addL("⚖️ Filed election petition at the " + state.replace("_", " ") + " Governorship Election Tribunal.", "political"); setCampRound(0); setCampScore(0); setCampOpp(0); setCampLog([]); setCampZones(null); setTribunal({ level: 0, groundId: null, spent: 0, log: ["Petition filed within the 21-day window (S.285(5)). Case number GET/" + Math.floor(Math.random() * 900 + 100) + "/" + (new Date().getFullYear()) + "."], oppName, oppPartyId: oppParty?.id || "OPP", margin: Math.round(Math.abs(collation.margin)) }); setPhase("tribunal"); }} style={{ padding: "29px 43px", fontSize: TS(38), background: CL.gold, color: "#000" }}>⚖️ Petition Tribunal</Bt>
                </div>}
                <Cd style={{ textAlign: "left", marginBottom: 29, padding: 29 }}>
                  <div style={{ fontSize: TS(29), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 14, letterSpacing: 2 }}>HOW THE ZONES MOVED</div>
                  {(() => { const start = buildBattlegrounds(state, turn * 2027, party, oppParty?.id); return collation.rows.map((rw, i) => {
                    const s0 = pollShare(start[i] || rw), s1 = pollShare(activeReZones[i] || rw);
                    const res = rw.yourVotes + rw.oppVotes > 0 ? Math.round(1000 * rw.yourVotes / (rw.yourVotes + rw.oppVotes)) / 10 : 50;
                    const moves = (activeReZones[i]?.moves || []).filter(m => m.d !== 0);
                    return <div key={rw.id} style={{ padding: "14px 0", borderBottom: "1px solid " + CL.bdr + "66" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(33), color: CL.txt }}><b>{rw.zone.replace(" Senatorial", "")}</b><span style={{ fontFamily: F.m, color: rw.won ? CL.grn : CL.red }}>{rw.won ? "Won" : "Lost"}</span></div>
                      <div style={{ fontSize: TS(30), color: CL.tm, fontFamily: F.m, margin: "4px 0" }}>Start {s0}% → final poll {s1}% ({sgnN(s1 - s0)}) → result {res}%</div>
                      {moves.length ? <div style={{ fontSize: TS(28), color: CL.td, lineHeight: 1.35 }}>{moves.map(m => m.l + " " + sgnN(m.d)).join(" · ")}</div>
                        : <div style={{ fontSize: TS(28), color: CL.td }}>You never campaigned here directly.</div>}
                    </div>; }); })()}
                  <div style={{ fontSize: TS(28), color: CL.td, marginTop: 10 }}>Between the final poll and the result: your record in office ({recordBoost >= 0 ? "helped" : "hurt"}, {sgnN(Math.round(recordBoost))} points) and election-day turnout.</div>
                </Cd>
                <SceneArt bg="collation-centre" h={TALL() ? 180 : 240} />
                <Cd style={{ textAlign: "left", marginBottom: 29, padding: 29, background: "#fffef7", borderColor: CL.gold + "55" }}>
                  <div style={{ fontSize: TS(29), fontWeight: 600, color: CL.grn, fontFamily: F.m, marginBottom: 14, textAlign: "center", letterSpacing: 2 }}>INEC · FORM EC8D · FINAL RESULT</div>
                  <div style={{ fontSize: TS(31), color: CL.txt, textAlign: "center", marginBottom: 22, borderBottom: "1px solid " + CL.bdr, paddingBottom: 14 }}><b>{state.replace("_", " ")} State</b> · Registered: {fmtVotesFull(collation.registeredTotal)} · Cast: {fmtVotesFull(collation.totalYou + collation.totalOpp)}</div>
                  {collation.rows.map(rw => <div key={rw.id} style={{ padding: "14px 0", borderBottom: "1px solid " + CL.bdr + "66" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(34), color: CL.txt, marginBottom: 5 }}><b>{rw.zone}</b><span style={{ color: rw.won ? CL.grn : CL.red, fontFamily: F.m }}>{rw.won ? party + " ✓" : (oppParty?.id || "OPP") + " ✓"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(31), color: CL.tm, fontFamily: F.m }}>
                      <span>{yourTicket}: <b style={{ color: rw.won ? CL.grn : CL.txt }}>{fmtVotesFull(rw.yourVotes)}</b></span>
                      <span>OPP: <b style={{ color: !rw.won ? CL.red : CL.txt }}>{fmtVotesFull(rw.oppVotes)}</b></span>
                    </div>
                    <div style={{ fontSize: TS(29), color: CL.td, marginTop: 5 }}>Turnout: {rw.turnout}% · {rw.names.slice(0, 4).join(", ")}{rw.names.length > 4 ? " +" + (rw.names.length - 4) + " LGAs" : ""}</div>
                  </div>)}
                  <div style={{ marginTop: 22, padding: "22px 29px", background: (won ? CL.grn : CL.red) + "12", borderRadius: 13, textAlign: "center" }}>
                    <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m, marginBottom: 5 }}>STATE TOTAL</div>
                    <div style={{ fontSize: TS(38), color: CL.txt, fontFamily: F.m, fontWeight: 600 }}>
                      <span style={{ color: won ? CL.grn : CL.txt }}>{yourTicket}: {fmtVotesFull(collation.totalYou)}</span>
                      <span style={{ margin: "0 22px", color: CL.td }}>vs</span>
                      <span style={{ color: !won ? CL.red : CL.txt }}>OPP: {fmtVotesFull(collation.totalOpp)}</span>
                    </div>
                    <div style={{ fontSize: TS(29), color: CL.tm, marginTop: 5 }}>Margin: {fmtVotesFull(Math.abs(collation.margin))} ({marginPct.toFixed(2)}%)</div>
                  </div>
                </Cd>
                <Cd style={{ textAlign: "left", marginBottom: 29, padding: 29 }}>
                  <div style={{ fontSize: TS(29), fontWeight: 600, color: CL.pur, fontFamily: F.m, marginBottom: 10 }}>CAMPAIGN LOG</div>
                  {campLog.slice(-6).map((c2, i) => <div key={i} style={{ fontSize: TS(31), color: c2.includes("BACKFIRE") ? CL.red : CL.tm, padding: "5px 0", lineHeight: 1.3 }}>{c2}</div>)}
                </Cd>
                {won && (
                  <Bt onClick={() => { setCampRound(0); setCampScore(0); setCampOpp(0); setCampLog([]); setCampZones(null); addL("🗳️ RE-ELECTED with " + fmtVotesFull(collation.totalYou) + " votes vs " + fmtVotesFull(collation.totalOpp) + " (" + collation.zonesWon + "/3 zones)", "political"); setTurn(5); setPhase("budget"); }} style={{ padding: "36px 86px", fontSize: TS(43) }}>BEGIN 2ND TERM</Bt>
                )}
              </Cd>;
            }

            if (isOppEvent) {
              const ev = oppEvs[Math.floor(campRound / 2)] || oppEvs[0];
              return <Cd>
                <div style={{ textAlign: "center", marginBottom: 22 }}>
                  <Bg text={"Week " + week + " of 4 — the opponent strikes"} color={CL.red} />
                  <SceneArt bg="rally" who="rival" alt={oppName} h={TALL() ? 170 : 220} />
                  <h3 style={{ fontFamily: F.d, color: CL.red, margin: "22px 0", fontSize: TS(58), fontWeight: 600 }}>{ev.t}</h3>
                  <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.4, textAlign: "left" }}>{ev.d}</p>
                  <ReZoneBoard />
                  <ScoreBoard />
                  <div style={{ fontSize: TS(34), color: CL.org, marginBottom: 22 }}>How do you respond?</div>
                </div>
                <div style={{ display: "grid", gap: 22 }}>
                  {withFallback(ev.opts).map((opt, i) => <OptCard key={i} opt={opt} />)}
                </div>
              </Cd>;
            }

            // YOUR ACTION
            const weekActs = acts[Math.floor(campRound / 2)] || acts[0];
            return <Cd>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <Bg text={"Week " + week + " of 4 — your move"} color={CL.grn} />
                <SceneArt bg="rally" h={TALL() ? 170 : 220} />
                <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(58), fontWeight: 600 }}>Pick this week's main move</h3>
                <div style={{ fontSize: TS(34), color: CL.td }}>Opponent: <strong>{oppName}</strong> ({oppParty?.id || "OPP"})</div>
                <ReZoneBoard />
                <ScoreBoard />
                {campWarChest < 0.2 && !campGfBorrowed && setup?.level !== "easy" && (() => {
                  const gfWilling = godfatherRel > 30;
                  return gfWilling ? <Cd onClick={borrowGF2} style={{ padding: 19, borderColor: CL.red + "44", marginBottom: 14, textAlign: "center" }}>
                    <div style={{ fontSize: TS(34), fontWeight: 600, color: CL.red }}>🎩 Running low? Borrow ₦0.8B from the Godfather</div>
                    <div style={{ fontSize: TS(29), color: CL.td }}>Relationship: {godfatherRel}%. He's willing — for now. +8% corruption. He'll collect in your 2nd term.</div>
                  </Cd> : <div>
                    <Cd style={{ padding: 19, borderColor: CL.red, marginBottom: 14, textAlign: "center", background: "#fff5f5" }}>
                      <div style={{ fontSize: TS(34), fontWeight: 600, color: CL.red }}>🎩 GODFATHER REFUSES TO HELP</div>
                      <div style={{ fontSize: TS(29), color: CL.red }}>Relationship: {godfatherRel}%. "You refused me too many times. Fund your own campaign."</div>
                    </Cd>
                    {campWarChest < 0.08 && <Cd onClick={() => {
                      setCampRound(0); setCampScore(0); setCampOpp(0); setCampLog([]);
                      addL("🏳️ Governor " + pName + " withdraws from re-election race. No funds to continue.", "political");
                      setGEnd("stepped_down");
                    }} style={{ padding: 22, borderColor: CL.red + "44", marginBottom: 14, textAlign: "center" }}>
                      <div style={{ fontSize: TS(36), fontWeight: 600, color: CL.red }}>🏳️ Withdraw from the Race</div>
                      <div style={{ fontSize: TS(29), color: CL.td }}>You can't afford to campaign. Step aside. You can still pursue Senate or retire as elder statesman.</div>
                    </Cd>}
                  </div>;
                })()}
                {campGfDebt > 0 && <div style={{ fontSize: TS(29), color: CL.red, marginBottom: 14 }}>🎩 Godfather debt: ₦{campGfDebt}B</div>}
              </div>
              <div style={{ display: "grid", gap: 22 }}>
                {withFallback(weekActs).map((act, i) => <OptCard key={i} opt={act} />)}
              </div>
              {/* Broke — choose to withdraw OR run with no funds (80/20 loss) */}
              {campWarChest < 0.05 && (campGfBorrowed || godfatherRel <= 30) && <div style={{ display: "grid", gap: 22, marginTop: 22 }}>
                <Cd style={{ padding: 22, textAlign: "center", background: "#fff5f5", borderColor: CL.red + "55" }}>
                  <div style={{ fontSize: TS(36), fontWeight: 700, color: CL.red }}>💸 CAMPAIGN FUNDS EXHAUSTED</div>
                  <div style={{ fontSize: TS(29), color: CL.tm }}>No cash, no godfather. Choose your fate.</div>
                </Cd>
                <Cd onClick={() => {
                  setCampRound(0); setCampScore(0); setCampOpp(0); setCampLog([]);
                  addL("🏳️ Governor " + pName + " withdraws from the race. Campaign funds exhausted.", "political");
                  setGEnd("stepped_down");
                }} style={{ padding: 29, borderColor: CL.red + "44", textAlign: "center" }}>
                  <div style={{ fontSize: TS(36), fontWeight: 600, color: CL.red }}>🏳️ Withdraw from the Race</div>
                  <div style={{ fontSize: TS(29), color: CL.td }}>Step aside gracefully. You can still pursue Senate or retire as an elder statesman.</div>
                </Cd>
                <Cd onClick={() => {
                  const win = Math.random() < 0.20;
                  if (win) {
                    setCampScore(sc => sc + 100);
                    setCampLog(c2 => [...c2, "🙏 Ran broke — grassroots miracle. Volunteers, market women, and youth mobilised for free. Somehow, you edged it."]);
                    addL("🙏 Ran broke campaign — beat the odds (20% roll landed). Grassroots carried you.", "success");
                  } else {
                    setCampOpp(op => op + 100);
                    setCampLog(c2 => [...c2, "💸 Ran broke — no posters, no rallies, no mobilisation. " + oppName + " swept every LGA."]);
                    addL("💸 Ran broke campaign — got flattened (80% expected). No funds, no ground game.", "crisis");
                  }
                  setCampRound(8); // jump straight to collation
                }} style={{ padding: 29, borderColor: CL.gold + "66", textAlign: "center", background: "#fffef7" }}>
                  <div style={{ fontSize: TS(36), fontWeight: 600, color: CL.gold }}>🎲 Run Anyway — No Funds</div>
                  <div style={{ fontSize: TS(31), color: CL.td }}>Skip the remaining weeks and go straight to INEC. Grassroots-only, no ads, no rallies. <b style={{ color: CL.red }}>80% chance you lose</b> · <b style={{ color: CL.grn }}>20% miracle</b>.</div>
                </Cd>
              </div>}
            </Cd>;
          })()}
        </OL>

        <OL show={phase === "convention2"}>
          <Cd style={{ borderColor: CL.pur + "44" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <div style={{ fontSize: TS(106), marginBottom: 22 }}>🎪🗳️</div>
              <Bg text="Re-Election Convention" color={CL.pur} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(72), fontWeight: 600 }}>Deputy Governor Decision</h3>
              <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 22 }}>
                Before the campaign begins, the party convention must ratify your ticket. 
                You can retain your current deputy or replace them — but dropping a deputy is a political earthquake. Choose your running mate, then face the electorate.
              </p>
            </div>
            {depGov && <Cd style={{ marginBottom: 36, background: CL.pur + "06" }}>
              <div style={{ fontSize: TS(29), color: CL.pur, fontFamily: F.m, fontWeight: 700, marginBottom: 10 }}>CURRENT DEPUTY GOVERNOR</div>
              <div style={{ fontWeight: 700, fontSize: TS(50), color: CL.txt }}>{depGov.nm}</div>
              <Bg text={depGov.bg} color={CL.pur} />
              {depGov.bio && <div style={{ fontSize: TS(34), color: CL.tm, marginTop: 10, fontStyle: "italic" }}>{depGov.bio}</div>}
              <div style={{ fontSize: TS(31), color: CL.td, marginTop: 14 }}>Loyalty: {depGov.lo} · Competence: {depGov.co} · Public: {depGov.pu}</div>
            </Cd>}
            <div style={{ display: "grid", gap: 29, maxWidth: 840, margin: "0 auto" }}>
              <Cd onClick={() => {
                setS(p => ({ ...p, pStab: cl100(p.pStab + 5) }));
                addL("🤝 Retained " + depGov.nm + " as running mate. Party approves.", "political");
                setPhase("campaign_election");
              }} style={{ padding: 43 }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>🤝 Retain {depGov?.nm?.split(" ")[0]}</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Continuity. The party sees a united ticket heading into the campaign.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="+5 party stability" color={CL.grn} />
                  <Bg text="Then → Campaign" color={CL.pur} />
                </div>
              </Cd>

              <Cd onClick={() => {
                const r2 = rng(Date.now() + 77);
                const newDep = { nm: gN(r2, sd.zone, setup?.state), co: ri(45, 88, r2), lo: ri(50, 90, r2), cr: ri(5, 35, r2), pu: ri(40, 85, r2), bg: "New Loyalist", bio: genBio(r2), desc: "Handpicked by you for the second term." };
                const oldName = depGov?.nm;
                setup.depGov = newDep;
                setS(p => ({ ...p, pStab: cl100(p.pStab - 12) }));
                setSkApp(p => ({ ...p, party: cl100((p.party || 50) - 10), media: cl100((p.media || 50) + 5) }));
                addL("⚡ DROPPED " + oldName + "! Replaced with " + newDep.nm + " as running mate. Party furious.", "political");
                setPhase("campaign_election");
              }} style={{ padding: 43, borderColor: CL.red + "33" }}>
                <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.red, marginBottom: 10 }}>🔄 Drop Deputy — Pick Someone New</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Fresh blood for the campaign. But this will send shockwaves through the party.</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Bg text="-12 party stability" color={CL.red} />
                  <Bg text="-10 party execs" color={CL.red} />
                  <Bg text="Then → Campaign" color={CL.pur} />
                </div>
              </Cd>
            </div>
          </Cd>
        </OL>

        <OL show={saPickerOpen}>
          <Cd style={{ borderColor: CL.gold + "77" }}>
            <div style={{ textAlign: "center", marginBottom: 29 }}>
              <Bg text="RESERVE LIST · SPECIAL ADVISER" color={CL.gold} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0 7px", fontSize: TS(62), fontWeight: 600 }}>Appoint a Special Adviser</h3>
              <div style={{ fontSize: TS(36), color: CL.tm }}>Pick from vetted indigenous candidates across the six zones. Sworn in same day.</div>
            </div>
            <div style={{ display: "grid", gap: 19, maxHeight: 828, overflowY: "auto" }}>
              {SA_ROSTER.filter(a => !((saOffice.history || []).some(h => h.name === a.name)) && a.name !== saOffice.adviser?.name).map(a => (
                <Cd key={a.name} onClick={() => appointAdviser(a)} style={{ padding: 29, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 29, alignItems: "center" }}>
                    <div style={{ fontSize: TS(79) }}>{a.avatar}</div>
                    <div style={{ flex: 1, minWidth: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt }}>{a.name} <span style={{ fontSize: TS(31), color: CL.gold, fontFamily: F.m }}>· {a.zone}</span></div>
                      <div style={{ fontSize: TS(34), color: CL.tm }}>{a.title}</div>
                      <div style={{ fontSize: TS(31), color: CL.td, fontStyle: "italic" }}>{a.file}</div>
                    </div>
                  </div>
                </Cd>
              ))}
              {SA_ROSTER.filter(a => !((saOffice.history || []).some(h => h.name === a.name)) && a.name !== saOffice.adviser?.name).length === 0 && (
                <div style={{ fontSize: TS(36), color: CL.red, textAlign: "center", padding: 36 }}>You've burned through the entire reserve list. The Head of Service is deputising.</div>
              )}
            </div>
            <div style={{ textAlign: "center", marginTop: 29 }}>
              <Bt onClick={() => setSaPickerOpen(false)} style={{ background: "#666", fontSize: TS(36), padding: "22px 50px" }}>Close</Bt>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "tribunal" && !tribunal}>
          <Cd style={{ textAlign: "center" }}>
            <div style={{ fontSize: TS(98), marginBottom: 22 }}>⚖️</div>
            <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(62), fontWeight: 600, margin: "14px 0" }}>Tribunal case not loaded</h3>
            <p style={{ color: CL.tm, fontSize: TS(38), marginBottom: 36 }}>Your petition state didn't persist. This can happen after a hot-reload during an election. Choose how to proceed.</p>
            <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
              <Bt onClick={() => {
                const oppLast = "OPPOSITION";
                setTribunal({ level: 0, groundId: null, spent: 0, log: ["Petition re-filed after state reset."], oppName: "Hon. " + oppLast, oppPartyId: "OPP", margin: 19 });
              }} style={{ background: CL.gold, color: "#000" }}>⚖️ Re-file petition</Bt>
              <Bt onClick={() => { setPhase("budget"); setTurn(t => Math.max(t, 5)); }} style={{ background: "#555" }}>🏳️ Skip & continue</Bt>
              <Bt onClick={() => setGEnd("defeated")} style={{ background: CL.red }}>Accept defeat</Bt>
            </div>
          </Cd>
        </OL>

        <OL show={phase === "tribunal" && !!tribunal}>

          {tribunal && (() => {
            const LEVELS = [
              { nm: "Governorship Election Tribunal", tag: "S.285(1) · 180 days to determine", multiplier: 1.0 },
              { nm: "Court of Appeal", tag: "S.285(7) · 60 days to hear appeal", multiplier: 0.88 },
              { nm: "Supreme Court", tag: "S.233(2)(e)(iv) · final constitutional arbiter", multiplier: 0.72 },
            ];
            const lvl = LEVELS[tribunal.level];
            const gd = tribunal.groundId ? TRIBUNAL_GROUNDS.find(g => g.id === tribunal.groundId) : null;
            const marginFactor = tribunal.margin < 5 ? 1.25 : tribunal.margin < 15 ? 1.0 : tribunal.margin < 30 ? 0.75 : 0.5;
            const narrBonus = narrative === "reformer" || narrative === "technocrat" ? 0.08 : narrative === "corrupt" ? -0.12 : 0;
            const oppP = PARTIES.find(p => p.id === tribunal.oppPartyId);
            const rulingPartyDisadvantage = oppP?.strength >= 1.1 ? -0.08 : 0; // APC/PDP-backed opponents harder to unseat

            const decideGround = (id) => setTribunal(t => ({ ...t, groundId: id, log: [...t.log, "Pleaded ground: " + TRIBUNAL_GROUNDS.find(g => g.id === id).nm] }));

            const runHearing = (mode) => {
              const g = TRIBUNAL_GROUNDS.find(x => x.id === tribunal.groundId);
              let chance = g.baseChance * lvl.multiplier * marginFactor + narrBonus + rulingPartyDisadvantage;
              let cost = 0, corDelta = 0;
              if (mode === "top_sans") { cost = 1.2; chance += 0.10; }
              if (mode === "wig") { cost = 3.5; chance += 0.22; }
              if (mode === "bribe") { cost = 5.0; chance += 0.35; corDelta = 0.15; }
              if (mode === "self") { cost = 0.2; chance -= 0.05; }
              chance = Math.max(0.03, Math.min(0.95, chance));
              const won = Math.random() < chance;
              const newLog = [...tribunal.log, "── " + lvl.nm + " ──", "Mode: " + ({ self: "argued in person", top_sans: "briefed a Senior Advocate", wig: "assembled SAN-led legal team", bribe: "'settled' the panel" })[mode], "Odds calculated: " + Math.round(chance * 100) + "%", won ? "✅ RULED IN YOUR FAVOUR" : "❌ Petition dismissed at this level"];
              setPersonalFund(f => Math.max(0, f - cost));
              if (corDelta) setS(p => ({ ...p, cor: cl(p.cor + corDelta, 0, 1) }));
               if (won) {
                 if (tribunal.level >= 2) {
                   // Supreme Court reinstatement — show a proper result screen before jumping to 2nd term
                   addL("⚖️ SUPREME COURT REINSTATES YOU as Governor — election of " + tribunal.oppName + " nullified on ground of " + g.nm + ".", "success");
                   setS(p => ({ ...p, app: cl100(p.app + 12), pStab: cl100(p.pStab + 20) }));
                   const spendTotal = (tribunal.spent + cost).toFixed(1);
                   showResult({
                     icon: "⚖️🏛️👑",
                     title: "SUPREME COURT — REINSTATED AS GOVERNOR",
                     narrative: "In a landmark ruling, the Supreme Court of Nigeria has UPHELD your petition on the ground of " + g.nm + " and NULLIFIED the return of " + tribunal.oppName + " (" + tribunal.oppPartyId + "). Per Section 285 of the 1999 Constitution, the court has ordered INEC to issue you a fresh Certificate of Return. You will be sworn in for your second term within 14 days. Total legal spend across all three tiers: ₦" + spendTotal + "B. Your party is jubilant; the opposition is in shock. Wikipedia has been updated: 'Reinstated by the Supreme Court of Nigeria after election tribunal victory.'",
                     effects: [
                       { icon: "👑", text: "Sworn in for 2nd term", value: "REINSTATED", bad: false },
                       { icon: "📈", text: "Approval sympathy bump", value: "+12%", bad: false },
                       { icon: "🏛️", text: "Party rallies behind you", value: "+20 pStab", bad: false },
                       { icon: "💸", text: "Total legal spend", value: "₦" + spendTotal + "B", bad: true },
                       { icon: "📚", text: "Constitutional precedent set", value: "S." + (g.section || "285"), bad: false },
                     ],
                     tone: "good",
                     nextFn: () => { setTribunal(null); setTurn(5); setPhase("budget"); }
                   });
                 } else {
                   setTribunal(t => ({ ...t, level: t.level + 1, log: [...newLog, "Opposition appeals — case escalates."], spent: t.spent + cost, groundId: null }));
                 }
               } else {
                 if (tribunal.level >= 2) {
                   addL("⚖️ Supreme Court finally dismissed the petition. " + tribunal.oppName + " is confirmed as Governor.", "crisis");
                   const spendTotal = (tribunal.spent + cost).toFixed(1);
                   showResult({
                     icon: "⚖️❌",
                     title: "SUPREME COURT — Petition Finally Dismissed",
                     narrative: "The Supreme Court has dismissed your petition. Under Section 285(7), this ruling is FINAL. " + tribunal.oppName + " (" + tribunal.oppPartyId + ") is confirmed as Governor. You spent ₦" + spendTotal + "B across three courts and walk away with nothing but a legacy of a fight taken to the highest court in the land.",
                     effects: [
                       { icon: "❌", text: "Petition dismissed", value: "FINAL", bad: true },
                       { icon: "💸", text: "Total legal spend", value: "₦" + spendTotal + "B", bad: true },
                       { icon: "🏛️", text: "Governor confirmed", value: tribunal.oppName.split(" ").pop().toUpperCase(), bad: true },
                     ],
                     tone: "bad",
                     nextFn: () => { setTribunal(null); setGEnd("defeated"); }
                   });
                 } else {
                   setTribunal(t => ({ ...t, level: t.level + 1, log: [...newLog, "You lodged an appeal within 21 days."], spent: t.spent + cost, groundId: null }));
                 }
               }
            };

            return <Cd style={{ borderColor: CL.gold + "77", maxWidth: 1164, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 29 }}>
                <div style={{ fontSize: TS(109), marginBottom: 14 }}>⚖️</div>
                <Bg text={"STAGE " + (tribunal.level + 1) + "/3"} color={CL.gold} />
                <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0 7px", fontSize: TS(65), fontWeight: 700 }}>{lvl.nm}</h3>
                <div style={{ fontSize: TS(34), color: CL.td, fontFamily: F.m }}>{lvl.tag}</div>
                <div style={{ fontSize: TS(34), color: CL.tm, marginTop: 14 }}>Losing margin: <b>{tribunal.margin} points</b> · War chest: <b>₦{personalFund.toFixed(2)}B</b> · Legal spend so far: ₦{tribunal.spent.toFixed(1)}B</div>
              </div>

              {!tribunal.groundId && <div>
                <div style={{ fontSize: TS(36), color: CL.tm, marginBottom: 22 }}>Your legal team recommends one ground of petition. Pick carefully — you cannot change it once filed at this level.</div>
                <div style={{ display: "grid", gap: 19 }}>
                  {TRIBUNAL_GROUNDS.map(g => <Cd key={g.id} onClick={() => decideGround(g.id)} style={{ padding: 29, cursor: "pointer" }}>
                    <div style={{ fontWeight: 700, fontSize: TS(38), color: CL.txt }}>{g.nm}</div>
                    <div style={{ fontSize: TS(34), color: CL.td, margin: "10px 0", lineHeight: 1.4 }}>{g.desc}</div>
                    <div style={{ fontSize: TS(34), color: CL.org, lineHeight: 1.4 }}><b>Evidence burden:</b> {g.req}</div>
                    <Bg text={"Base success: " + Math.round(g.baseChance * 100) + "%"} color={g.baseChance > .5 ? CL.grn : g.baseChance > .4 ? CL.org : CL.red} />
                  </Cd>)}
                </div>
              </div>}

              {tribunal.groundId && <div>
                <div style={{ background: CL.gold + "12", border: "1px solid " + CL.gold + "44", borderRadius: 8, padding: "22px 29px", marginBottom: 29, fontSize: TS(36), color: CL.tm }}>
                  <b>Pleading:</b> {gd.nm}<br /><i style={{ fontSize: TS(34), color: CL.td }}>{gd.desc}</i>
                </div>
                <div style={{ fontSize: TS(36), color: CL.tm, marginBottom: 22 }}>How do you fight this?</div>
                <div style={{ display: "grid", gap: 19 }}>
                  <Bt onClick={() => runHearing("self")}>👨🏾‍💼 Argue in person · ₦0.2B · weakens odds</Bt>
                  <Bt onClick={() => runHearing("top_sans")} style={{ background: CL.pur }}>📚 Brief a Senior Advocate · ₦1.2B · +10% odds</Bt>
                  <Bt onClick={() => runHearing("wig")} style={{ background: CL.grn }}>🎓 Assemble a SAN-led team (5 wigs) · ₦3.5B · +22% odds</Bt>
                  {setup?.level !== "easy" && personalFund >= 5 && <Bt onClick={() => runHearing("bribe")} style={{ background: CL.red }}>💼 "Settle" the panel · ₦5B · +35% odds · +15% corruption (may leak)</Bt>}
                  {personalFund < 2 && godfatherRel > 20 && gfDebt < 6 && <Bt onClick={() => {
                    const amt = 2.5;
                    setPersonalFund(f => f + amt);
                    setGfDebt(d => d + amt);
                    setGodfatherRel(r => Math.min(100, r + 5));
                    setS(p => ({ ...p, cor: cl(p.cor + 0.05, 0, 1) }));
                    setTribunal(t => ({ ...t, log: [...t.log, "🎩 Godfather wired ₦" + amt + "B for legal bills. Debt now ₦" + (gfDebt + amt).toFixed(1) + "B. +5% corruption. He expects a Commissioner slot AND a contract when you're sworn in."] }));
                    addL("🎩 Borrowed ₦" + amt + "B from the Godfather to fund your tribunal case. Total debt: ₦" + (gfDebt + amt).toFixed(1) + "B.", "warn");
                  }} style={{ background: CL.gold, color: "#000" }}>🎩 Borrow ₦2.5B from Godfather · +5% corruption · owes contract & slot</Bt>}
                  {personalFund < 2 && (godfatherRel <= 20 || gfDebt >= 6) && <div style={{ fontSize: TS(31), color: CL.red, textAlign: "center", padding: "10px 0" }}>🎩 Godfather won't lend more — {godfatherRel <= 20 ? "relationship burned" : "debt cap reached"}</div>}
                  <Bt onClick={() => { addL("😔 Withdrew the petition. " + tribunal.oppName + " is Governor.", "political"); setTribunal(null); setGEnd("defeated"); }} style={{ background: "#555" }}>🏳️ Withdraw petition · accept the result</Bt>
                </div>
              </div>}

              <div style={{ marginTop: 36, background: "#f9f5ee", border: "1px solid " + CL.bdr, borderRadius: 8, padding: "22px 29px", maxHeight: 300, overflowY: "auto" }}>
                <div style={{ fontSize: TS(29), fontWeight: 700, color: CL.td, fontFamily: F.m, letterSpacing: 2, marginBottom: 10 }}>CASE LOG</div>
                {tribunal.log.map((l, i) => <div key={i} style={{ fontSize: TS(34), color: l.includes("✅") ? CL.grn : l.includes("❌") ? CL.red : CL.tm, padding: "7px 0" }}>{l}</div>)}
              </div>
            </Cd>;
          })()}
        </OL>



        <OL show={phase === "house_bill" && !!pendingHouseBill}>
          {pendingHouseBill && (() => {
            const hasClauses = pendingHouseBill.clauses && pendingHouseBill.clauses.length > 0;
            const badClauses = hasClauses ? pendingHouseBill.clauses.filter(c => !c.ok) : [];
            const advanceFn = () => { setPendingHouseBill(null); nextEvent(); };
            return <Cd style={{ borderColor: CL.pur + "33" }}>
              <div style={{ textAlign: "center", marginBottom: 29 }}>
                <div style={{ fontSize: TS(98), marginBottom: 22 }}>📜</div>
                <Bg text="Bill from House of Assembly" color={CL.pur} />
                <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(65), fontWeight: 600 }}>{pendingHouseBill.nm}</h3>
                <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 22 }}>{pendingHouseBill.d}</p>
              </div>

              {hasClauses && <div style={{ textAlign: "left", margin: "0 auto 36px", maxWidth: 840 }}>
                <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 14 }}>📄 BILL CLAUSES — READ CAREFULLY:</div>
                {pendingHouseBill.clauses.map((c, i) => (
                  <div key={i} style={{ padding: "19px 29px", marginBottom: 10, borderRadius: 8, background: c.ok ? CL.grn + "06" : CL.red + "06", border: "1px solid " + (c.ok ? CL.grn + "20" : CL.red + "20") }}>
                    <div style={{ fontSize: TS(34), color: CL.txt, lineHeight: 1.4 }}>{c.t}</div>
                    {!c.ok && <div style={{ fontSize: TS(29), color: CL.red, marginTop: 7, fontStyle: "italic", display: "none" }}>⚠️ {c.flag}</div>}
                  </div>
                ))}
                {badClauses.length > 0 && <div style={{ fontSize: TS(29), color: CL.td, marginTop: 14, fontStyle: "italic" }}>💡 Tip: Not every clause in a bill is what it seems. A careful governor reads every line.</div>}
              </div>}

              <div style={{ background: CL.blu + "08", border: "1px solid " + CL.blu + "20", borderRadius: 13, padding: "22px 36px", marginBottom: 36, textAlign: "left", maxWidth: 840, margin: "0 auto 36px" }}>
                <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.blu, marginBottom: 7 }}>📖 CIVIC NOTE:</div>
                <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.4 }}>{pendingHouseBill.civic}</div>
              </div>

              <div style={{ display: "grid", gap: 29, maxWidth: 840, margin: "0 auto" }}>
                {/* Sign */}
                <Cd onClick={() => {
                  const hasBad = badClauses.length > 0;
                  setS(p => {
                    const n = { ...p, debt: p.debt + (pendingHouseBill.signCost || 0) };
                    Object.entries(pendingHouseBill.signFx || {}).forEach(([k, v]) => { if (k === "app") n.app = cl100(n.app + v); else if (k === "corM") n.cor = cl(n.cor + v); else if (k === "sec") n.sec = cl(n.sec + v); else if (k === "agr") n.agr = cl(n.agr + v); });
                    if (hasBad) { n.cor = cl(n.cor + .04); } // signing bad clauses increases corruption
                    return n;
                  });
                  setSkApp(p => { const n = { ...p }; Object.entries(pendingHouseBill.sk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
                  if (hasBad) {
                    addL("✍️ SIGNED: " + pendingHouseBill.nm + " — but you missed suspicious clauses! Corruption increased.", "scandal");
                  } else {
                    addL("✍️ SIGNED: " + pendingHouseBill.nm + " signed into law." + (pendingHouseBill.signCost > 0 ? " Cost: " + naira(pendingHouseBill.signCost) : ""), "policy");
                  }
                  advanceFn();
                }} style={{ padding: 43 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.grn, marginBottom: 10 }}>✍️ Sign Into Law</div>
                  <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Give your assent. The bill becomes law in {state.replace("_", " ")} State.</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {Object.entries(pendingHouseBill.signFx || {}).map(([k, v]) => <Bg key={k} text={k + ":" + (v > 0 ? "+" : "") + (Math.abs(v) < 1 ? Math.round(v * 100) + "%" : v)} color={v > 0 ? CL.grn : CL.red} />)}
                    {pendingHouseBill.signCost > 0 && <Bg text={"Cost: " + naira(pendingHouseBill.signCost)} color={CL.red} />}
                  </div>
                </Cd>

                {/* Flag & Veto — only if bad clauses exist */}
                {badClauses.length > 0 && <Cd onClick={() => {
                  setS(p => ({ ...p, app: cl100(p.app + 5), cor: cl(p.cor - .03) }));
                  setSkApp(p => ({ ...p, media: cl100((p.media || 50) + 10), party: cl100((p.party || 50) - 8), youth: cl100((p.youth || 50) + 6) }));
                  addL("🔍 FLAGGED & VETOED: " + pendingHouseBill.nm + "! Governor identified " + badClauses.length + " suspicious clause(s): " + badClauses.map(c => "\"" + c.t.substring(0, 50) + "...\"").join("; ") + ". Media praised the vigilance.", "policy");
                  advanceFn();
                }} style={{ padding: 43, borderColor: CL.org + "44" }}>
                  <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.org, marginBottom: 10 }}>🔍 Flag Suspicious Clauses & Veto</div>
                  <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>You've spotted something wrong. Send the bill back with a public explanation of the problematic clauses.</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Bg text="+5 approval" color={CL.grn} />
                    <Bg text="-3% corruption" color={CL.grn} />
                    <Bg text="+10 media" color={CL.grn} />
                    <Bg text="-8 party execs" color={CL.red} />
                  </div>
                  <div style={{ marginTop: 22, background: CL.org + "08", borderRadius: 8, padding: "14px 29px" }}>
                    <div style={{ fontSize: TS(29), fontWeight: 700, color: CL.org, marginBottom: 7 }}>FLAGGED CLAUSES:</div>
                    {badClauses.map((c, i) => <div key={i} style={{ fontSize: TS(31), color: CL.red, lineHeight: 1.4, marginBottom: 7 }}>⚠️ {c.t} — <span style={{ fontStyle: "italic" }}>{c.flag}</span></div>)}
                  </div>
                </Cd>}

                {/* Plain Veto */}
                <Cd onClick={() => {
                  setS(p => {
                    const n = { ...p, pStab: cl100(p.pStab - 5) };
                    Object.entries(pendingHouseBill.vetoFx || {}).forEach(([k, v]) => { if (k === "app") n.app = cl100(n.app + v); else if (k === "corM") n.cor = cl(n.cor + v); });
                    return n;
                  });
                  setSkApp(p => { const n = { ...p }; Object.entries(pendingHouseBill.vetoSk || {}).forEach(([k, v]) => { if (n[k] !== undefined) n[k] = cl100(n[k] + v); }); return n; });
                  addL("🚫 VETOED: " + pendingHouseBill.nm + ". House unhappy. (-5 party stability)", "political");
                  advanceFn();
                }} style={{ padding: 43, borderColor: CL.red + "33" }}>
                  <div style={{ fontWeight: 600, fontSize: TS(48), color: CL.red, marginBottom: 10 }}>🚫 Veto (No Reason Given)</div>
                  <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 14 }}>Withhold assent without explanation. The bill dies — House resents you.</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Bg text="-5 party stability" color={CL.red} />
                    {Object.entries(pendingHouseBill.vetoFx || {}).map(([k, v]) => <Bg key={k} text={k + ":" + (v > 0 ? "+" : "") + (Math.abs(v) < 1 ? Math.round(v * 100) + "%" : v)} color={v > 0 ? CL.grn : CL.red} />)}
                  </div>
                </Cd>
              </div>
            </Cd>;
          })()}
        </OL>

        {/* Capital project intake — Step 1 of the shared lifecycle.
            After confirmation this hands off to the sop-realism procurement modal
            (contractor selection from the real bidder pool). */}
        <OL show={!!capProj}>
          {capProj && (() => {
            const p = capProj.p;
            const TYPES = ["road","bridge","hospital","school","market","dam","housing","water","power","vehicles","cctv","landfill","industrial"];
            const eiaRequired = EIA_TYPES.has(capProj.type);
            const noMinistries = !ministries || !ministries.length;
            return <Cd style={{ borderColor: CL.org + "44", maxWidth: 984 }}>
              <div style={{ textAlign: "center", marginBottom: 29 }}>
                <Bg text="STEP 1 · PROJECT INTAKE" color={CL.org} />
                <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(58), fontWeight: 600, margin: "14px 0 7px" }}>Initiate {p.nm}</h3>
                <div style={{ fontSize: TS(36), color: CL.td }}>Base ₦{p.c.toFixed(1)}B · {p.t}T baseline · you pick contractor next</div>
              </div>
              <div style={{ fontSize: TS(36), color: CL.tm, marginBottom: 29, padding: 29, background: CL.org + "0c", borderRadius: 8, lineHeight: 1.5 }}>
                Name the project, assign a ministry, decide on EIA. On <b>Next</b> you'll pick a bidder from the real contractor pool (Julius Berger, CCECC, RCC…) or a nepotism-flagged one. Every choice affects cost, delivery time, corruption index and your Wikipedia bio.
              </div>

              <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.grn, marginBottom: 10 }}>1. Project name</div>
              <input value={capProj.title} onChange={e => setCapProj({ ...capProj, title: e.target.value })} placeholder="e.g. Ikeja–Agege 4-lane arterial road" style={{ width: "100%", padding: 24, fontSize: TS(43), border: "1px solid " + CL.bdr, borderRadius: 8, marginBottom: 29, fontFamily: "inherit" }} />

              <div style={{ display: "flex", gap: 22, marginBottom: 29 }}>
                <div style={{ flex: 1, minWidth: 1 }}>
                  <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.grn, marginBottom: 10 }}>2. Project type</div>
                  <select value={capProj.type} onChange={e => setCapProj({ ...capProj, type: e.target.value, eia: EIA_TYPES.has(e.target.value) })} style={{ width: "100%", padding: 22, fontSize: TS(38), border: "1px solid " + CL.bdr, borderRadius: 8 }}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 1 }}>
                  <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.grn, marginBottom: 10 }}>3. Supervising ministry</div>
                  <select value={capProj.ministryId || ""} onChange={e => setCapProj({ ...capProj, ministryId: e.target.value })} disabled={noMinistries} style={{ width: "100%", padding: 22, fontSize: TS(38), border: "1px solid " + CL.bdr, borderRadius: 8 }}>
                    {noMinistries ? <option value="">— no ministries convened —</option> : ministries.map(m => <option key={m.id} value={m.id}>{m.icon || "🏛️"} {m.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.grn, marginBottom: 10 }}>4. Environmental Impact Assessment {eiaRequired && <span style={{ color: CL.red }}>· REQUIRED under EIA Act Cap E12</span>}</div>
              {[
                { k: true, l: "✅ Commission EIA (+₦0.3B, +1T)", d: eiaRequired ? "Legally required. Immune to NESREA court freeze." : "Optional but strengthens defence against opposition claims.", c: CL.grn },
                { k: false, l: eiaRequired ? "⚠️ Waive EIA — start immediately" : "⏭️ Skip EIA (not required)", d: eiaRequired ? "Faster & cheaper — but NESREA court freeze possible in 2T (-6 app). Wikipedia will log this." : "No penalty for non-mandatory types.", c: eiaRequired ? CL.red : CL.tm },
              ].map(o => <div key={String(o.k)} onClick={() => setCapProj({ ...capProj, eia: o.k })} style={{ padding: 24, border: "1px solid " + (capProj.eia === o.k ? o.c : CL.bdr), borderRadius: 8, marginBottom: 14, cursor: "pointer", background: capProj.eia === o.k ? o.c + "10" : "transparent" }}>
                <div style={{ fontSize: TS(38), fontWeight: 600, color: o.c }}>{o.l}</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>{o.d}</div>
              </div>)}

              {noMinistries && <div style={{ fontSize: TS(36), color: CL.red, marginTop: 22, padding: 22, background: CL.red + "10", borderRadius: 8 }}>⚠️ You haven't convened any ministries. Close this, open <b>Cabinet</b> and convene at least one ministry first.</div>}

              <div style={{ display: "flex", gap: 22, marginTop: 36, justifyContent: "flex-end" }}>
                <Bt v="ghost" onClick={() => setCapProj(null)}>Cancel</Bt>
                <Bt onClick={confirmCapital} disabled={noMinistries || !capProj.title.trim()}>Next: Select Bidder →</Bt>
              </div>
            </Cd>;
          })()}
        </OL>



        {/* Flagship Agenda ribbon — always visible when playing so the choice has weight */}
        {setup?.agenda && nav === "gov" && (() => {
          const AG_MAP = {
            education: { i: "📚", nm: "Education for All", bonus: "+50% literacy growth · +2 youth/turn" },
            health: { i: "🏥", nm: "Healthcare Revolution", bonus: "+50% health growth · +2 women/turn" },
            infrastructure: { i: "🏗️", nm: "Build, Build, Build", bonus: "+50% infra growth · +10% project speed" },
            security: { i: "🛡️", nm: "Peace & Security", bonus: "+50% security · -20% shock damage" },
            agriculture: { i: "🌾", nm: "Agricultural Transformation", bonus: "+50% agr · +₦0.3B IGR/turn" },
            anticorruption: { i: "⚖️", nm: "Clean Governance", bonus: "-40% corruption drift · +3 media/turn" },
            youth: { i: "💼", nm: "Youth Empowerment", bonus: "+3 youth/turn · MSME IGR boost" },
            women: { i: "👩", nm: "Women & Social Welfare", bonus: "+25% health & literacy" },
            technology: { i: "💻", nm: "Digital Economy", bonus: "+₦0.4B IGR/turn · +5 business" },
            housing: { i: "🏠", nm: "Affordable Housing", bonus: "+3 approval/turn if treasury > ₦5B" },
          };
          const AG = AG_MAP[setup.agenda];
          if (!AG) return null;
          if (TALL()) return <Fold title={AG.i + " Flagship: " + AG.nm} summary="Applied every quarter · tap for the effect"><div style={{ fontSize: TS(20), color: CL.tm, padding: "4px 4px 0" }}>{AG.bonus}</div></Fold>;
          return <div style={{ margin: "0 0 22px", padding: "22px 36px", background: CL.grn + "10", border: "1px solid " + CL.grn + "44", borderRadius: 13, display: "flex", alignItems: "center", gap: 29, fontSize: TS(36) }}>
            <span style={{ fontSize: TS(58) }}>{AG.i}</span>
            <div style={{ flex: 1, minWidth: 1 }}>
              <div style={{ fontWeight: 700, color: CL.grn }}>Flagship in effect: {AG.nm}</div>
              <div style={{ color: CL.tm, fontSize: TS(34) }}>{AG.bonus} — applied every quarter</div>
            </div>
          </div>;
        })()}




        {nav === "gov" && <div className="sop-gov-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,200px) 1fr", gap: TALL() ? 0 : 29 }}>
          <div style={{ minWidth: 1, order: TALL() ? 2 : 0 }}>
            <Fold title="State indicators" summary={"Literacy " + Math.round(s.lit * 100) + "% · Health " + Math.round(s.hp * 100) + "% · Security " + Math.round(s.sec * 100) + "% · Corruption " + Math.round(s.cor * 100) + "%"}>
            <Cd style={{ marginBottom: 22 }}><div style={{ fontSize: TS(31), fontWeight: 700, color: CL.grn, fontFamily: F.m, marginBottom: 14 }}>INDICATORS</div><SB label="Literacy" value={s.lit} color={CL.blu} icon="📖" /><SB label="Health" value={s.hp} color={CL.grn} icon="🏥" /><SB label="Infra" value={s.infra} color={CL.org} icon="🏗️" /><SB label="Security" value={s.sec} color={CL.red} icon="🛡️" /><SB label="Agriculture" value={s.agr} color="#16a34a" icon="🌾" /><div style={{ borderTop: "1px solid " + CL.bdr, marginTop: 10, paddingTop: 10 }}><SB label="Corruption" value={s.cor} color={CL.red} icon="⚠️" /></div></Cd>
            </Fold>
            <Fold title={"Programmes in progress (" + pol.length + ")"} summary={pol.length ? pol.map(p => p.nm).slice(0, 2).join(" · ") + (pol.length > 2 ? " …" : "") : "Nothing running yet" + (completedProjects.length ? " · " + completedProjects.length + " completed" : "")}>
            <Cd>
              <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.grn, fontFamily: F.m, marginBottom: 10 }}>🏗️ IN PROGRESS ({pol.length})</div>
              {pol.length === 0 ? <div style={{ color: CL.td, fontSize: TS(31) }}>No active projects</div> : pol.map(p => {
                const orig = POLICIES.find(pp => pp.id === p.id);
                const totalT = orig?.t || p.tl + 1;
                const pctDone = Math.round((1 - p.tl / totalT) * 100);
                return <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid " + CL.bdr }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: CL.txt, fontSize: TS(34), fontWeight: 600 }}>{p.nm}</span>
                    <span style={{ fontSize: TS(29), color: CL.pur, fontFamily: F.m }}>{p.tl}T left</span>
                  </div>
                  <div style={{ height: 14, background: "#e8ece0", borderRadius: 6, overflow: "hidden", marginTop: 7 }}><div style={{ width: pctDone + "%", height: "100%", background: CL.grn, transition: "width .3s" }} /></div>
                  <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                    <span style={{ fontSize: TS(29), color: CL.td }}>{pctDone}% done</span>
                    {p.cr > 0 && <span style={{ fontSize: TS(29), color: CL.red }}>· {Math.round(p.cr * 100)}% risk</span>}
                    <span style={{ fontSize: TS(29), color: CL.gold }}>· {naira(p.c)}</span>
                  </div>
                </div>;
              })}
              {completedProjects.length > 0 && <div style={{ marginTop: 22, borderTop: "1px solid " + CL.bdr, paddingTop: 14 }}>
                <div style={{ fontSize: TS(31), fontWeight: 700, color: CL.teal, fontFamily: F.m, marginBottom: 10 }}>✅ COMPLETED ({completedProjects.length})</div>
                {completedProjects.map((cp, i) => <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid " + CL.bdr }}>
                  <div style={{ fontSize: TS(31), color: CL.grn, fontWeight: 600 }}>{cp.nm}</div>
                  <div style={{ fontSize: TS(29), color: CL.td }}>{cp.desc}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                    <span style={{ fontSize: TS(29), color: CL.gold }}>{naira(cp.cost)}</span>
                    {cp.jobs > 0 && <span style={{ fontSize: TS(29), color: CL.blu }}>+{cp.jobs.toLocaleString()} jobs</span>}
                    {cp.sector && <span style={{ fontSize: TS(29), color: CL.pur }}>{cp.sector}</span>}
                  </div>
                </div>)}
              </div>}
            </Cd>
            </Fold>
          </div>
          <div>
            {phase === "mda" && mdaEnv && (() => {
              const totalPad = mdaEnv.decisions.reduce((a, d) => a + (d.pad || 0), 0);
              const totalSaved = mdaEnv.decisions.reduce((a, d) => a + (d.saved || 0), 0);
              const exposed = mdaEnv.decisions.filter(d => d.exposed).length;
              if (mdaEnv.idx < mdaEnv.list.length) {
                const env = mdaEnv.list[mdaEnv.idx];
                const decide = (label, budDelta, padAdd, savedAdd, fx) => {
                  const dec = { k: env.k, label, pad: padAdd, saved: savedAdd, exposed: fx?.exposed };
                  setMdaEnv(m => ({ ...m, idx: m.idx + 1, decisions: [...m.decisions, dec] }));
                  setBud(p => ({ ...p, [env.k]: Math.max(0, Math.min(100, (p[env.k] || 0) + budDelta)) }));
                  if (fx) {
                    setS(p => ({ ...p, cor: cl(p.cor + (fx.cor || 0), 0, 1), pStab: cl100(p.pStab + (fx.pStab || 0)), app: cl100(p.app + (fx.app || 0)) }));
                    if (fx.log) addL(fx.log, fx.tp || "policy");
                  }
                };
                return <Cd style={{ borderColor: CL.pur + "55" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 14 }}>
                    <Bg text={"BUDGET ASSEMBLY " + (mdaEnv.idx + 1) + "/" + mdaEnv.list.length} color={CL.pur} />
                    <Bg text={"₦ padding exposed: " + totalPad.toFixed(1) + "B"} color={totalPad > 0 ? CL.red : CL.td} />
                    <Bg text={"₦ saved: " + totalSaved.toFixed(1) + "B"} color={CL.grn} />
                  </div>
                  <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 14px", fontSize: TS(53), fontWeight: 600 }}>{env.i} {env.nm}</h3>
                  <div style={{ background: CL.red + "10", border: "1px solid " + CL.red + "30", borderRadius: 8, padding: "22px 29px", marginBottom: 22, fontSize: TS(34), color: CL.red, lineHeight: 1.4 }}>
                    <b>Envelope submitted: {env.ask}% of total budget.</b> The Permanent Secretary walks in with a bulky file and a nervous smile.
                  </div>
                  <div style={{ fontSize: TS(34), color: CL.tm, marginBottom: 14 }}><b>Padding your PA flagged:</b> {env.pad}</div>
                  <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 29, fontStyle: "italic" }}>Actual field reality: {env.real}</div>
                  <div style={{ display: "grid", gap: 19 }}>
                    <Bt onClick={() => decide("Approved as submitted", env.ask - (bud[env.k] || 0), 0, 0, { cor: .015, pStab: 3, log: "🏛️ Approved " + env.nm + " envelope as submitted — PS smiles. Padding untouched.", tp: "political" })} style={{ background: CL.red }}>💰 Approve full ₦ envelope ({env.ask}%) · +party loyalty, +corruption</Bt>
                    <Bt onClick={() => { const cut = Math.round((env.ask - env.need) * .5); decide("Cut 50% of padding", (env.ask - cut) - (bud[env.k] || 0), 0, cut * .3, { pStab: -1, app: 1, log: "✂️ Trimmed " + env.nm + " envelope by " + cut + "%. Saved public funds." }); }}>✂️ Cut half the padding · realistic middle ground</Bt>
                    <Bt onClick={() => decide("Fund only real need", env.need - (bud[env.k] || 0), 0, (env.ask - env.need) * .5, { pStab: -4, app: 3, cor: -.01, log: "📉 Cut " + env.nm + " to real-need envelope (" + env.need + "%). PS is furious." })} style={{ background: CL.grn }}>📉 Fund only the {env.need}% real need · lean & clean</Bt>
                    <Bt onClick={() => { const caught = Math.random() < .55; if (caught) { decide("EFCC referral — padding proved", env.need - (bud[env.k] || 0), env.ask - env.need, (env.ask - env.need) * .8, { pStab: -8, cor: -.03, app: 5, log: "🚔 EFCC probe on " + env.nm + " uncovered ₦" + ((env.ask - env.need) * .8).toFixed(1) + "B in inflated line items. PS suspended.", tp: "success" }); } else { decide("EFCC referral — nothing proven", env.ask - (bud[env.k] || 0), 0, 0, { pStab: -5, cor: .01, app: -2, log: "😑 EFCC found nothing on " + env.nm + ". PS returns emboldened. Ministry stability shaken.", tp: "crisis" }); } }} style={{ background: CL.org }}>🚔 Refer padding to EFCC · risky — may prove nothing</Bt>
                  </div>
                </Cd>;
              }
              // Speaker's constituency-project padding demand
              if (!mdaEnv.speakerHandled) {
                const ask = mdaEnv.speakerAsk;
                const handle = (fx, logTx, tp) => { addL(logTx, tp); setMdaEnv(m => ({ ...m, speakerHandled: true })); setS(p => ({ ...p, pStab: cl100(p.pStab + (fx.pStab || 0)), cor: cl(p.cor + (fx.cor || 0), 0, 1), app: cl100(p.app + (fx.app || 0)), debt: p.debt + (fx.debt || 0) })); };
                return <Cd style={{ borderColor: CL.org + "55" }}>
                  <Bg text="SPEAKER'S CHAMBER" color={CL.org} />
                  <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0 14px", fontSize: TS(53), fontWeight: 600 }}>🎩 The Speaker calls at 11pm</h3>
                  <p style={{ color: CL.tm, fontSize: TS(36), lineHeight: 1.5, marginBottom: 29 }}>"Your Excellency, the House cannot approve the Appropriation Bill without <b>constituency projects</b> for our 24 members. We need <b>₦{ask}B</b> inserted — culverts, boreholes, empowerment items. Anything less, and the bill dies on the floor."</p>
                  <div style={{ display: "grid", gap: 19 }}>
                    <Bt onClick={() => handle({ pStab: 12, cor: .02, debt: ask, app: -2 }, "🤝 Inserted ₦" + ask + "B in constituency projects. House delighted. Debt +₦" + ask + "B.", "political")} style={{ background: CL.grn }}>🤝 Insert the ₦{ask}B · smooth passage guaranteed</Bt>
                    <Bt onClick={() => handle({ pStab: 4, cor: .005, debt: ask * .5, app: 1 }, "📎 Negotiated down to ₦" + (ask * .5).toFixed(1) + "B constituency projects.", "political")}>📎 Negotiate down to ₦{(ask * .5).toFixed(1)}B</Bt>
                    <Bt onClick={() => handle({ pStab: -14, app: 6 }, "🚫 Refused Speaker's demand. He walked out threatening to reject the bill.", "political")} style={{ background: CL.red }}>🚫 Refuse — you'll defend the clean budget</Bt>
                    <Bt onClick={() => { const caught = Math.random() < .5; if (caught) handle({ pStab: -22, app: 10, cor: -.02 }, "🚨 Recorded conversation leaked! Speaker faces EFCC. House swears vengeance.", "success"); else handle({ pStab: -12, app: -1, cor: .01 }, "🕵️ Attempted sting failed — Speaker is now your enemy for life.", "crisis"); }} style={{ background: CL.org }}>🕵️ Record him and leak it · high-risk sting</Bt>
                  </div>
                </Cd>;
              }
              // Summary → proceed to draft budget
              return <Cd>
                <Bg text="BUDGET ASSEMBLY COMPLETE" color={CL.grn} />
                <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "22px 0", fontSize: TS(53), fontWeight: 600 }}>📊 Envelope decisions ready for drafting</h3>
                <div style={{ background: "#f9f5ee", border: "1px solid " + CL.bdr, borderRadius: 8, padding: "29px 36px", marginBottom: 29, fontSize: TS(34), color: CL.tm }}>
                  {mdaEnv.decisions.map((d, i) => <div key={i} style={{ padding: "10px 0", borderBottom: "1px dotted " + CL.bdr }}><b>{MDA_ENVELOPES.find(e => e.k === d.k)?.i} {d.k}:</b> {d.label}{d.saved > 0 ? " — saved ₦" + d.saved.toFixed(1) + "B" : ""}{d.exposed ? " · EFCC" : ""}</div>)}
                  <div style={{ marginTop: 14, fontWeight: 700, color: CL.grn }}>Total public funds preserved: ₦{totalSaved.toFixed(1)}B{exposed ? " · " + exposed + " ministries under EFCC scrutiny" : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Bt onClick={() => { setMdaEnv(null); setPhase("budget"); }}>DRAFT APPROPRIATION BILL →</Bt>
                </div>
              </Cd>;
            })()}

            {phase === "budget" && (() => {
              const SEC_META = {
                salaries:       { grp: "Obligations",         min: 15, max: 22, funds: "Civil servant wages, pensions, LGA subventions, teachers, doctors, police stipend top-ups.", low: "Salary arrears → NLC/ASUU strike, party revolt, approval crash.", high: "Bloated payroll consumes capex — nothing left to build." },
                debt:           { grp: "Obligations",         min: 5,  max: 12, funds: "Repayment of state bonds, contractor arrears, World Bank / AfDB loans, unpaid contractor certificates.", low: "Debt compounds — credit downgrade, contractors down tools.", high: "Overpaying debt starves services this quarter." },
                administration: { grp: "Obligations",         min: 5,  max: 10, funds: "Government House, Deputy Gov office, protocol, official vehicles, foreign trips, utilities, secretariat maintenance.", low: "Basic government machinery grinds to a halt.", high: "Optics disaster — media brands you a spendthrift, corruption index rises." },
                health:         { grp: "Human Development",   min: 12, max: 18, funds: "Doctor & nurse salaries, drug procurement, primary health centres, immunisation cold chain, teaching hospital subsidies.", low: "Drug stockouts, infant mortality, strike by NARD/NMA.", high: "Diminishing returns — money starts padding retreats." },
                education:      { grp: "Human Development",   min: 12, max: 18, funds: "Teacher salaries, SUBEB, WAEC subsidy, school feeding, tertiary subventions, scholarships, classroom construction.", low: "Out-of-school children rise, WAEC pass rate collapses.", high: "Marginal gains — building schools without teachers." },
                security:       { grp: "Human Development",   min: 8,  max: 14, funds: "Security vote (opaque), Amotekun/Ebube Agu, police logistics, DSS collaboration, CCTV, vigilante grants.", low: "Banditry / kidnapping surges; investors flee.", high: "Militarisation — media & youth accuse you of a police state." },
                infrastructure: { grp: "Growth Engines",      min: 12, max: 20, funds: "Roads, bridges, drainage, street lights, water works, housing estates, rural electrification, IPP power.", low: "Potholes viral on Twitter, IGR flatlines, contractors default.", high: "Cash cow for kickbacks if unmatched by monitoring." },
                agriculture:    { grp: "Growth Engines",      min: 6,  max: 12, funds: "Fertiliser subsidy, seedlings, irrigation, farmer settlements, extension officers, mechanisation, off-taker programmes.", low: "Food inflation locally, farmer-herder crisis worsens.", high: "Diminishing returns unless matched by land reform." },
              };
              const grpOrder = ["Human Development", "Growth Engines", "Obligations"];
              const grpColor = { "Human Development": CL.blu, "Growth Engines": CL.grn, "Obligations": CL.pur };
              const applyPreset = (preset) => {
                const presets = {
                  recommended: { salaries: 18, debt: 8,  administration: 7,  health: 15, education: 15, security: 11, infrastructure: 16, agriculture: 10 },
                  populist:    { salaries: 22, debt: 4,  administration: 9,  health: 14, education: 13, security: 10, infrastructure: 18, agriculture: 10 },
                  reformer:    { salaries: 17, debt: 12, administration: 5,  health: 17, education: 17, security: 10, infrastructure: 14, agriculture: 8  },
                  godfather:   { salaries: 18, debt: 5,  administration: 12, health: 10, education: 10, security: 12, infrastructure: 22, agriculture: 11 },
                };
                setBud(presets[preset]);
              };
              const remaining = 100 - bs;
              // What this split means, in plain words, before it goes to the House
              const SAYS = {
                salaries:       ["Salaries will fall into arrears. Expect a strike.", "Teachers and civil servants will be paid on time.", "Wages will eat money meant for building."],
                debt:           ["Debt will pile up and contractors will down tools.", "Creditors will be kept quiet.", "Paying debt early will starve services this half-year."],
                administration: ["Government offices will struggle to run.", "Government House will run without waste.", "The press will call you a spendthrift."],
                health:         ["Clinics will run out of drugs.", "Clinics will stay stocked.", "Extra health money will start to leak."],
                education:      ["More children will drop out of school.", "Schools will stay open and staffed.", "New classrooms will outpace teachers."],
                security:       ["Kidnappings and banditry will rise.", "Security will hold.", "Critics will call it a police state."],
                infrastructure: ["Roads will slow down.", "Roads and drains will keep moving.", "Big contracts invite kickbacks unless you watch them."],
                agriculture:    ["Food prices will climb.", "Farmers will get seed and fertiliser.", "Farm money will show diminishing returns."],
              };
              const budgetSays = () => {
                const bad = [], good = [];
                BSECTORS.forEach(sec => {
                  const m = SEC_META[sec.k], t = SAYS[sec.k]; if (!m || !t) return;
                  const v = bud[sec.k] || 0;
                  if (v < m.min) bad.push(t[0]); else if (v > m.max) bad.push(t[2]); else good.push(t[1]);
                });
                return [...good.slice(0, Math.max(1, 3 - bad.length)), ...bad].slice(0, 4);
              };
              const SaysBox = ({ fs }) => bs !== 100 ? null : <div style={{ background: CL.grn + "0c", border: "1px solid " + CL.grn + "33", borderRadius: 12, padding: "12px 14px", margin: "10px 0" }}>
                <div style={{ fontSize: fs, color: CL.td, fontWeight: 700, marginBottom: 4 }}>If the House passes this</div>
                {budgetSays().map((l, i) => <div key={i} style={{ fontSize: fs, color: CL.txt, lineHeight: 1.4 }}>{l}</div>)}
              </div>;
              if (TALL()) {
                // Phone: the total as one sentence, one row per sector, details on tap.
                const chip = (txt, col) => <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: col + "18", color: col, fontFamily: F.m, fontWeight: 700, fontSize: TS(20) }}>{txt}</span>;
                const step = (k, d) => setBud(p => ({ ...p, [k]: Math.max(0, Math.min(100, (p[k] || 0) + d)) }));
                const stepBtn = { width: 56, height: 56, minHeight: 56, borderRadius: 14, border: "1px solid " + CL.bdr, background: CL.card, color: CL.txt, fontSize: TS(25), fontWeight: 700, cursor: "pointer", flexShrink: 0 };
                return <Cd style={{ padding: "20px 16px" }}>
                  {s.igr + s.faac < 3 && <div style={{ fontSize: TS(20), color: CL.red, fontWeight: 700, marginBottom: 10 }}>🚨 Revenue has collapsed to {naira(s.igr + s.faac)}. The state is close to bankrupt.</div>}
                  <div style={{ fontSize: TS(20), color: CL.td, textTransform: "uppercase", letterSpacing: 1 }}>Appropriation bill · Year {Math.ceil(turn / 2)}, half {((turn - 1) % 2) + 1}</div>
                  <div style={{ fontFamily: F.d, fontSize: TS(32), fontWeight: 700, color: CL.txt, margin: "6px 0 4px", lineHeight: 1.2 }}>{naira(tb)} to spend this half-year</div>
                  <div style={{ fontSize: TS(20), color: CL.tm, lineHeight: 1.4 }}>IGR {naira(s.igr)} (money the state raises itself) + FAAC {naira(s.faac)} (its federal share){s.debt > 0 ? " − " + naira(s.debt * .08) + " debt service" : ""}.</div>
                  <div style={{ margin: "12px 0" }}>{bs === 100 ? chip("✓ Balanced: 100% allocated", CL.grn) : bs > 100 ? chip("Over by " + (bs - 100) + "% (" + naira(tb * (bs - 100) / 100) + ")", CL.red) : chip(bs + "% allocated · " + naira(tb * remaining / 100) + " left", CL.org)}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: TS(20), color: CL.td }}>Start from:</span>
                    {[["recommended", "Balanced", CL.grn], ["populist", "Populist", CL.org], ["reformer", "Reformer", CL.blu], ["godfather", "Godfather", CL.pur]].map(([k, l, c]) =>
                      <button key={k} onClick={() => applyPreset(k)} style={{ padding: "6px 14px", minHeight: 44, borderRadius: 999, border: "1px solid " + c + "60", background: c + "12", color: c, fontSize: TS(20), fontWeight: 700, cursor: "pointer" }}>{l}</button>)}
                  </div>
                  {grpOrder.map(gname => {
                    const items = BSECTORS.filter(sec => (SEC_META[sec.k]?.grp) === gname);
                    const gsum = items.reduce((a, sec) => a + (bud[sec.k] || 0), 0);
                    return <div key={gname} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(20), color: grpColor[gname], fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "6px 2px" }}><span>{gname}</span><span style={{ fontFamily: F.m }}>{gsum}%</span></div>
                      {items.map(sec => {
                        const meta = SEC_META[sec.k] || { min: 5, max: 20, funds: "", low: "", high: "" };
                        const pct2 = bud[sec.k] || 0;
                        const status = pct2 < meta.min ? "low" : pct2 > meta.max ? "high" : "ok";
                        const sc = status === "ok" ? CL.grn : status === "low" ? CL.red : CL.org;
                        const open = budOpen === sec.k;
                        return <div key={sec.k} style={{ borderTop: "1px solid " + CL.bdr, padding: "10px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={() => setBudOpen(open ? null : sec.k)} aria-expanded={open} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: 0, padding: 0, cursor: "pointer", textAlign: "left", color: CL.txt, minHeight: 56 }}>
                              <span style={{ fontSize: TS(25) }}>{sec.i}</span>
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: "block", fontSize: TS(25), fontWeight: 700 }}>{sec.l}</span>
                                <span style={{ display: "block", fontSize: TS(20), color: sc }}>{status === "ok" ? "In range" : status === "low" ? "Underfunded" : "Too much"} · {naira(tb * pct2 / 100)}</span>
                              </span>
                              <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: TS(25), color: sc }}>{pct2}%</span>
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => step(sec.k, -1)} aria-label={"Less " + sec.l} style={stepBtn}>−</button>
                            <input type="range" min={0} max={40} value={pct2} aria-label={sec.l + " share"} onChange={e => { const v = +e.target.value; setBud(p => ({ ...p, [sec.k]: v })); }} style={{ flex: 1, minWidth: 0, accentColor: sc, height: 32 }} />
                            <button onClick={() => step(sec.k, 1)} aria-label={"More " + sec.l} style={stepBtn}>+</button>
                          </div>
                          {open && <div style={{ fontSize: TS(20), color: CL.tm, lineHeight: 1.45, padding: "6px 4px 2px" }}>
                            <div>{meta.funds}</div>
                            <div style={{ color: CL.td, marginTop: 4 }}>Healthy range {meta.min}–{meta.max}%.</div>
                            {status !== "ok" && <div style={{ color: sc, marginTop: 4 }}>{status === "low" ? "If you submit this: " + meta.low : "Waste flag: " + meta.high}</div>}
                          </div>}
                        </div>;
                      })}
                    </div>;
                  })}
                  {s.debt > 0 && <Fold title={"State debt " + naira(s.debt)} summary={naira(s.debt * .08) + " service due this half-year"}><div style={{ fontSize: TS(20), color: CL.tm, lineHeight: 1.45 }}>Service is taken off the pot before you see it. Extra money you put into Debt above reduces the principal.{s.debt > 15 ? " Debt is dangerously high: creditors will call soon." : ""}</div></Fold>}
                  <Fold title="Why the House votes on this" summary="Section 121 of the 1999 Constitution"><div style={{ fontSize: TS(20), color: CL.tm, lineHeight: 1.45 }}>The Governor lays the appropriation bill before the House of Assembly. Members can pass it, amend it, or force you into horse-trading.</div></Fold>
                  <SaysBox fs={TS(20)} />
                  <Bt onClick={() => { if (bs !== 100) return; setPhase("house_vote"); }} style={{ width: "100%", marginTop: 6, opacity: bs === 100 ? 1 : .5, cursor: bs === 100 ? "pointer" : "not-allowed" }}>
                    {bs === 100 ? "SUBMIT TO HOUSE OF ASSEMBLY →" : bs > 100 ? "Reduce: over by " + (bs - 100) + "%" : "Allocate the remaining " + remaining + "%"}
                  </Bt>
                </Cd>;
              }
              return <Cd>
                {s.igr + s.faac < 3 && <div style={{ background: "#fef2f2", border: "1px solid " + CL.red + "30", borderRadius: 13, padding: "22px 36px", marginBottom: 29 }}>
                  <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.red }}>🚨 BANKRUPTCY WARNING</div>
                  <div style={{ fontSize: TS(34), color: CL.red }}>Your state revenue has collapsed to {naira(s.igr + s.faac)}. You cannot sustain governance.</div>
                </div>}

                <div style={{ background: "linear-gradient(135deg, " + CL.grn + "10, " + CL.blu + "08)", border: "1px solid " + CL.grn + "30", borderRadius: 17, padding: "36px 43px", marginBottom: 36 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 36, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: TS(36), color: CL.td, textTransform: "uppercase", letterSpacing: .5, fontWeight: 700 }}>Appropriation Bill · Y{Math.ceil(turn/2)} H{((turn-1)%2)+1}</div>
                      <div style={{ fontFamily: F.d, fontSize: TS(79), fontWeight: 700, color: CL.txt, marginTop: 7 }}>{naira(tb)} <span style={{ fontSize: TS(36), color: CL.td, fontWeight: 400 }}>to spend this half-year</span></div>
                      <div style={{ fontSize: TS(34), color: CL.tm, marginTop: 10 }}>
                        <b style={{ color: CL.grn }}>IGR {naira(s.igr)}</b> (what you earned) + <b style={{ color: CL.blu }}>FAAC {naira(s.faac)}</b> (federal share){s.debt > 0 ? <> − <b style={{ color: CL.red }}>Debt service {naira(s.debt * .08)}</b></> : null}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: TS(36), color: CL.td, fontWeight: 700 }}>ALLOCATED</div>
                      <div style={{ fontFamily: F.m, fontSize: TS(79), fontWeight: 700, color: bs === 100 ? CL.grn : bs > 100 ? CL.red : CL.org }}>{bs}%</div>
                      <div style={{ fontSize: TS(34), color: bs === 100 ? CL.grn : bs > 100 ? CL.red : CL.org, fontFamily: F.m }}>
                        {bs === 100 ? "✓ Balanced" : bs > 100 ? "Over by " + (bs - 100) + "% — " + naira(tb * (bs - 100) / 100) : remaining + "% left = " + naira(tb * remaining / 100)}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 29 }}>
                  <span style={{ fontSize: TS(31), color: CL.td }}>Start from:</span>
                  {[["recommended", "Balanced", CL.grn], ["populist", "Populist", CL.org], ["reformer", "Reformer", CL.blu], ["godfather", "Godfather", CL.pur]].map(([k, l, c]) =>
                    <button key={k} onClick={() => applyPreset(k)} style={{ padding: "6px 22px", borderRadius: 999, border: "1px solid " + c + "60", background: c + "12", color: c, fontSize: TS(31), fontWeight: 700, cursor: "pointer" }}>{l}</button>)}
                </div>

                {grpOrder.map(gname => {
                  const items = BSECTORS.filter(sec => (SEC_META[sec.k]?.grp) === gname);
                  const gsum = items.reduce((a, sec) => a + (bud[sec.k] || 0), 0);
                  return <div key={gname} style={{ marginBottom: 36, border: "1px solid " + CL.bdr, borderRadius: 13, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "19px 29px", background: grpColor[gname] + "12", borderBottom: "1px solid " + CL.bdr }}>
                      <span style={{ fontSize: TS(36), fontWeight: 700, color: grpColor[gname], textTransform: "uppercase", letterSpacing: .5 }}>
                        {gname === "Human Development" ? "🧑‍🎓 " : gname === "Growth Engines" ? "⚙️ " : "📋 "}{gname}
                      </span>
                      <span style={{ fontSize: TS(34), fontFamily: F.m, color: CL.tm }}>{gsum}% · {naira(tb * gsum / 100)}</span>
                    </div>
                    <div style={{ padding: "22px 29px" }}>
                      {items.map(sec => {
                        const meta = SEC_META[sec.k] || { min: 5, max: 20, funds: "", low: "", high: "" };
                        const pct2 = bud[sec.k] || 0;
                        const amt = tb * pct2 / 100;
                        const status = pct2 < meta.min ? "low" : pct2 > meta.max ? "high" : "ok";
                        const statusColor = status === "ok" ? CL.grn : status === "low" ? CL.red : CL.org;
                        const statusLabel = status === "ok" ? "In range" : status === "low" ? "UNDERFUNDED" : "EXCESSIVE";
                        return <div key={sec.k} style={{ padding: "22px 14px", borderBottom: "1px dotted " + CL.bdr }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 10 }}>
                            <span style={{ fontSize: TS(50) }}>{sec.i}</span>
                            <div style={{ flex: 1, minWidth: 1 }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 22, flexWrap: "wrap" }}>
                                <span style={{ fontSize: TS(38), fontWeight: 700, color: CL.txt }}>{sec.l}</span>
                                <span style={{ fontSize: TS(34), fontFamily: F.m, color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
                                <span style={{ fontSize: TS(31), color: CL.td }}>· healthy {meta.min}–{meta.max}%</span>
                              </div>
                              <div style={{ fontSize: TS(31), color: CL.tm, marginTop: 5, lineHeight: 1.3 }}>{meta.funds}</div>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 174 }}>
                              <div style={{ fontFamily: F.m, fontSize: TS(48), fontWeight: 700, color: statusColor }}>{pct2}%</div>
                              <div style={{ fontFamily: F.m, fontSize: TS(34), color: CL.txt, fontWeight: 600 }}>{naira(amt)}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 10 }}>
                            <button onClick={() => setBud(p => ({ ...p, [sec.k]: Math.max(0, (p[sec.k] || 0) - 1) }))} style={{ width: 79, height: 79, borderRadius: 8, border: "1px solid " + CL.bdr, background: "#fff", color: CL.red, cursor: "pointer", fontSize: TS(43), fontWeight: 700 }}>−</button>
                            <input type="range" min={0} max={40} value={pct2} aria-label={sec.l + " share"} onChange={e => { const v = +e.target.value; setBud(p => ({ ...p, [sec.k]: v })); }} style={{ flex: 1, minWidth: 0, accentColor: statusColor, height: 40 }} />
                            <button onClick={() => setBud(p => ({ ...p, [sec.k]: Math.min(100, (p[sec.k] || 0) + 1) }))} style={{ width: 79, height: 79, borderRadius: 8, border: "1px solid " + CL.bdr, background: "#fff", color: CL.grn, cursor: "pointer", fontSize: TS(43), fontWeight: 700 }}>+</button>
                            <button onClick={() => setBud(p => ({ ...p, [sec.k]: Math.max(0, (p[sec.k] || 0) - 5) }))} style={{ padding: "0 22px", height: 79, borderRadius: 8, border: "1px solid " + CL.bdr, background: "transparent", color: CL.td, cursor: "pointer", fontSize: TS(34) }}>−5</button>
                            <button onClick={() => setBud(p => ({ ...p, [sec.k]: Math.min(100, (p[sec.k] || 0) + 5) }))} style={{ padding: "0 22px", height: 79, borderRadius: 8, border: "1px solid " + CL.bdr, background: "transparent", color: CL.td, cursor: "pointer", fontSize: TS(34) }}>+5</button>
                          </div>
                          {status !== "ok" && <div style={{ marginTop: 14, padding: "14px 22px", background: statusColor + "10", borderLeft: "2px solid " + statusColor, borderRadius: 6, fontSize: TS(31), color: statusColor, lineHeight: 1.35 }}>
                            <b>{status === "low" ? "⚠️ If you submit this:" : "🚩 Waste flag:"}</b> {status === "low" ? meta.low : meta.high}
                          </div>}
                        </div>;
                      })}
                    </div>
                  </div>;
                })}

                {s.debt > 0 && <div style={{ background: s.debt > 15 ? CL.red + "08" : CL.org + "08", border: "1px solid " + (s.debt > 15 ? CL.red : CL.org) + "20", borderRadius: 8, padding: "22px 36px", marginBottom: 29, fontSize: TS(31), color: s.debt > 15 ? CL.red : CL.org, lineHeight: 1.4 }}>
                  💳 <strong>State debt: {naira(s.debt)}</strong> · Service due this half-year: <b>{naira(s.debt * .08)}</b> (auto-deducted before you see the pot). Extra you allocate to <b>Debt</b> above reduces principal.
                  {s.debt > 15 ? " ⚠️ Debt is dangerously high — creditors will call soon." : s.debt < 3 ? " ✅ Debt is manageable." : ""}
                </div>}

                <SaysBox fs={TS(34)} />
                <div style={{ borderTop: "1px solid " + CL.bdr, paddingTop: 29, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 29, flexWrap: "wrap" }}>
                  <div style={{ fontSize: TS(31), color: CL.td, flex: "1 1 200px" }}>📜 S.121, 1999 Constitution: Governor shall lay this bill before the House of Assembly. They can reject, amend, or force you into horse-trading.</div>
                  <Bt onClick={() => { if (bs > 100 || bs < 100) return; setPhase("house_vote"); }} style={{ opacity: bs === 100 ? 1 : .5, cursor: bs === 100 ? "pointer" : "not-allowed" }}>
                    {bs === 100 ? "SUBMIT TO HOUSE OF ASSEMBLY →" : bs > 100 ? "REDUCE (over by " + (bs - 100) + "%)" : "ALLOCATE REMAINING " + remaining + "%"}
                  </Bt>
                </div>
              </Cd>;
            })()}

            {phase === "house_vote" && <Cd style={{ borderColor: CL.pur + "44" }}>
              <SceneArt bg="assembly-chamber" who="speaker" alt={cast.speaker.name} h={TALL() ? 200 : 240} />
              <HouseVote pStab={s.pStab} bud={bud} level={setup?.level} onPass={() => { addL("✅ Appropriation Bill PASSED by House of Assembly", "policy"); setPhase("policy"); }}
                onAmend={(penalty, patch) => { if (patch) setBud(patch); setS(p => ({ ...p, pStab: cl100(p.pStab - penalty) })); addL("🔄 Budget amended per House demands (-" + penalty + " party stability)", "political"); setPhase("budget"); }}
                onForce={() => { setForcedBudget(true); setS(p => ({ ...p, pStab: cl100(p.pStab - 15), app: cl100(p.app - 5) })); addL("⚠️ Budget FORCED through without House approval! (-15 party, -5 approval)", "political"); setPhase("policy"); }}
                addL={addL} />
            </Cd>}
            {phase === "policy" && <Cd>
              <AdvBubble text={ADV.policy} saName={cast.adviser.name} />
              <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 14px", fontSize: TS(53), fontWeight: 600 }}>Executive Policies</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 19 }}>{POLICIES.filter(p => !pol.find(a => a.id === p.id)).map(p => <Cd key={p.id} onClick={() => startPolicy(p)} style={{ padding: 24 }}><div style={{ fontWeight: 600, fontSize: TS(36), color: CL.txt, marginBottom: 7 }}>{p.nm}{isCapital(p) && <span style={{ marginLeft: 14, fontSize: TS(29), color: CL.org }}>· BUILD</span>}</div><div style={{ fontSize: TS(29), color: CL.td, marginBottom: 10 }}>{p.d}</div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><Bg text={naira(p.c)} color={CL.gold} /><Bg text={p.t + "T"} color={CL.pur} />{p.cr > 0 && <Bg text={"Risk " + Math.round(p.cr * 100) + "%"} color={CL.red} />}{isCapital(p) && <Bg text="Procurement + EIA" color={CL.org} />}</div></Cd>)}</div>

              <div style={{ marginTop: 29, borderTop: "1px solid " + CL.bdr, paddingTop: 29 }}>
                <h3 style={{ fontFamily: F.d, color: CL.pur, margin: "0 0 14px", fontSize: TS(50), fontWeight: 600 }}>📜 Sponsor a Bill (House Vote Required)</h3>
                <p style={{ color: CL.td, fontSize: TS(34), marginBottom: 22 }}>Bills now pass deterministically unless there is a clear blocker: party stability below 25%, dangerous debt, or a contradictory fiscal clause.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(264px,1fr))", gap: 19 }}>
                  {BILLS.filter(b => !billsPassed.find(bp => bp.id === b.id)).map(b => (
                    <Cd key={b.id} onClick={() => sponsorBill(b)} style={{ padding: 24 }}>
                      <div style={{ fontWeight: 600, fontSize: TS(36), color: CL.pur, marginBottom: 7 }}>{b.nm}</div>
                      <div style={{ fontSize: TS(29), color: CL.td, marginBottom: 10 }}>{b.d}</div>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        {b.cost > 0 && <Bg text={naira(b.cost)} color={CL.gold} />}
                        <Bg text={s.pStab < 25 ? "BLOCKED: caucus" : s.pStab < 40 ? "Will pass: tense" : "Will pass"} color={s.pStab < 25 ? CL.red : s.pStab < 40 ? CL.org : CL.grn} />
                        {Object.entries(b.fx || {}).map(([k, v]) => <Bg key={k} text={k + ":" + (v > 0 ? "+" : "") + (Math.abs(v) < 1 ? Math.round(v * 100) + "%" : v)} color={v > 0 ? CL.grn : CL.red} />)}
                      </div>
                    </Cd>
                  ))}
                  {BILLS.filter(b => !billsPassed.find(bp => bp.id === b.id)).length === 0 && <div style={{ fontSize: TS(34), color: CL.td }}>All bills have been passed.</div>}
                </div>
              </div>

              <div style={{ marginTop: 22, borderTop: "1px solid " + CL.bdr, paddingTop: 22 }}><div style={{ fontSize: TS(34), fontWeight: 700, color: CL.red, marginBottom: 10 }}>⚠️ RISKY EXECUTIVE ORDERS (May be unconstitutional)</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{UNCONST.map(u => <Cd key={u.id} onClick={() => tryU(u)} style={{ padding: 19, borderColor: CL.red + "33" }}><div style={{ fontSize: TS(34), color: CL.red, fontWeight: 600 }}>{u.nm}</div><div style={{ fontSize: TS(29), color: CL.td }}>{u.r}</div></Cd>)}</div></div>
              <div style={{ textAlign: "right", marginTop: 22 }}><Bt onClick={() => { setPhase("end_turn"); endTurn(); }}>END HALF-YEAR →</Bt></div>
            </Cd>}
            {phase === "end_turn" && !curD && <Cd style={{ textAlign: "center", padding: 58 }}>
              <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(53), fontWeight: 600, marginBottom: 22 }}>{yr} Complete</h3>
              {headline && <div style={{ background: "#f9f5ee", border: "1px solid #d4c9a8", borderRadius: 8, padding: "29px 43px", margin: "0 auto 36px", maxWidth: 732 }}>
                <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m, letterSpacing: 5, textTransform: "uppercase", marginBottom: 7 }}>{state.replace("_", " ")} Daily Tribune</div>
                <div style={{ fontSize: TS(43), color: "#1a1a1a", fontFamily: F.d, fontWeight: 700, lineHeight: 1.3 }}>{headline}</div>
              </div>}
              {/* Show this turn's key events so players SEE the cabinet/stakeholder/persona feedback */}
              <div style={{ textAlign: "left", margin: "29px 0", maxWidth: 732, marginLeft: "auto", marginRight: "auto" }}>
                {logs.filter(l => l.t === turn).slice(0, 5).map((e, i) => {
                  const tc = { policy: CL.grn, crisis: CL.red, political: CL.org, success: CL.teal, scandal: CL.red, info: CL.td };
                  return <div key={i} style={{ fontSize: TS(34), color: tc[e.tp] || CL.tm, padding: "10px 0", borderBottom: "1px solid " + CL.bdr + "60", lineHeight: 1.4 }}>{e.tx}</div>;
                })}
              </div>
              <Spark data={appH} color={s.app > 50 ? CL.grn : CL.red} w={130} h={24} />
              {achPopup && <div style={{ background: CL.gold + "15", border: "1px solid " + CL.gold + "40", borderRadius: 17, padding: "29px 43px", margin: "36px auto 0", maxWidth: 552 }}>
                <div style={{ fontSize: TS(79), marginBottom: 7 }}>{achPopup.i}</div>
                <div style={{ fontSize: TS(36), fontWeight: 700, color: CL.gold }}>🏆 ACHIEVEMENT UNLOCKED</div>
                <div style={{ fontSize: TS(43), fontWeight: 600, color: CL.txt }}>{achPopup.nm}</div>
                <div style={{ fontSize: TS(34), color: CL.td }}>{achPopup.d}</div>
              </div>}
              <div style={{ marginTop: 29 }}><Bt onClick={() => { turn >= MT ? advance() : buildEventQueue(); }}>{turn >= MT ? "VIEW RESULTS" : "CONTINUE"}</Bt></div>
            </Cd>}
          </div>
        </div>}

        {nav === "econ" && <div>
          <Cd style={{ marginBottom: 29 }}>
            <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 22px", fontSize: TS(50), fontWeight: 600 }}>📊 State Economy</h3>
            <div style={{ display: "flex", gap: 29, flexWrap: "wrap", marginBottom: 29 }}>
              <div style={{ background: CL.grn + "10", borderRadius: 13, padding: "22px 36px", flex: "1 1 120px" }}>
                <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m }}>STATE GDP</div>
                <div style={{ fontSize: TS(58), fontWeight: 700, color: CL.grn, fontFamily: F.m }}>{naira(s.gdp || 0)}</div>
              </div>
              <div style={{ background: CL.blu + "10", borderRadius: 13, padding: "22px 36px", flex: "1 1 120px" }}>
                <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m }}>TOTAL JOBS</div>
                <div style={{ fontSize: TS(58), fontWeight: 700, color: CL.blu, fontFamily: F.m }}>{((s.totalJobs || 0) / 1000).toFixed(0)}K</div>
              </div>
              <div style={{ background: CL.gold + "10", borderRadius: 13, padding: "22px 36px", flex: "1 1 120px" }}>
                <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m }}>IGR (FROM ECONOMY)</div>
                <div style={{ fontSize: TS(58), fontWeight: 700, color: CL.gold, fontFamily: F.m }}>{naira(s.igr)}</div>
              </div>
            </div>
            <div style={{ fontSize: TS(34), color: CL.td, lineHeight: 1.4, marginBottom: 22 }}>
              💡 IGR is now derived from your economic sectors. Grow sectors through budget allocation, policies, infrastructure, education, and security. Corruption and insecurity drag ALL sectors down.
            </div>
          </Cd>
          <div style={{ display: "grid", gap: 22 }}>
            {[
              { k: "agriculture", i: "🌾", nm: "Agriculture", driver: "Agric budget, health, infrastructure" },
              { k: "manufacturing", i: "🏭", nm: "Manufacturing", driver: "Infrastructure budget, literacy, security" },
              { k: "services", i: "🏢", nm: "Services", driver: "Education budget, infrastructure, security" },
              { k: "trade", i: "🛒", nm: "Trade", driver: "Infrastructure, security, literacy" },
              { k: "tech", i: "💻", nm: "Technology", driver: "Education budget, infrastructure" },
              { k: "oil", i: "🛢️", nm: "Oil & Gas", driver: "Security, infrastructure" },
              { k: "mining", i: "⛏️", nm: "Mining", driver: "Infrastructure, security, literacy" },
              { k: "tourism", i: "🏖️", nm: "Tourism", driver: "Security, infrastructure, health" },
            ].map(sec => {
              const e = s.econ?.[sec.k];
              if (!e) return null;
              const out = (e.out || 0);
              const jobs = e.jobs || 0;
              const taxRate = sd.econ[sec.k]?.tax || .05;
              const revenue = out * sd.pop * 2 * taxRate;
              return <Cd key={sec.k} style={{ padding: 29 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div><span style={{ fontSize: TS(50), marginRight: 14 }}>{sec.i}</span><span style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt }}>{sec.nm}</span></div>
                  <span style={{ fontFamily: F.m, fontSize: TS(43), color: out > .3 ? CL.grn : out > .15 ? CL.org : CL.red }}>{(out * 100).toFixed(0)}%</span>
                </div>
                <SB label="Output" value={out} color={out > .3 ? CL.grn : out > .15 ? CL.org : CL.red} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: TS(31), color: CL.td, marginTop: 7 }}>
                  <span>Jobs: {(jobs / 1000).toFixed(0)}K</span>
                  <span>Tax revenue: {naira(revenue)}</span>
                </div>
                <div style={{ fontSize: TS(29), color: CL.tm, marginTop: 7 }}>Driven by: {sec.driver}</div>
              </Cd>;
            })}
          </div>
        </div>}

        {nav === "ppl" && <div style={{ display: "grid", gridTemplateColumns: TALL() ? "1fr" : "repeat(auto-fill,minmax(264px,1fr))", gap: 22 }}>{PERSONAS.map(p => { const v = pApp[p.id] || 50; return <Cd key={p.id}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span>{p.i} <span style={{ fontWeight: 600, fontSize: TS(38) }}>{p.nm}</span></span><span style={{ fontFamily: F.m, fontSize: TS(48), color: v > 60 ? CL.grn : v > 40 ? CL.org : CL.red }}>{Math.round(v)}%</span></div><SB label="" value={v / 100} color={v > 60 ? CL.grn : v > 40 ? CL.org : CL.red} /><div style={{ fontSize: TS(29), color: CL.td }}>{p.d}</div></Cd>; })}</div>}

        {nav === "stk" && <div style={{ display: "grid", gridTemplateColumns: TALL() ? "1fr" : "repeat(auto-fill,minmax(264px,1fr))", gap: 22 }}>{STAKEHOLDERS.map(x => { const v = skApp[x.id] || 50; return <Cd key={x.id}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span>{x.i} <span style={{ fontWeight: 600, fontSize: TS(38) }}>{x.nm}</span></span><span style={{ fontFamily: F.m, fontSize: TS(48), color: v > 60 ? CL.grn : v > 40 ? CL.org : CL.red }}>{Math.round(v)}%</span></div><SB label="" value={v / 100} color={v > 60 ? CL.grn : v > 40 ? CL.org : CL.red} /></Cd>; })}</div>}

        {nav === "cab" && <div>
          {ministries && ministries.length > 0 && <div style={{ marginBottom: 50 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(50), fontWeight: 600, margin: 1 }}>🏛️ Executive Council — Your Ministries ({ministries.length})</h3>
              <Bt v="ghost" onClick={() => setNav("min")} style={{ fontSize: TS(29), padding: "7px 29px" }}>+ Create / Merge →</Bt>
            </div>
            <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 22 }}>These are the ministries YOU created and appointed. Fire a commissioner or reassign the Permanent Secretary directly from here. Every action lands in your Wikipedia biography.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(312px,1fr))", gap: 22 }}>{ministries.map(m => {
              const gen = () => { const r = rng(Date.now() + m.id.length); return gN(r, sd.zone, setup?.state); };
              return <Cd key={m.id} style={{ borderLeft: "3px solid " + (m.cor > 55 ? CL.red : m.perf > 60 ? CL.grn : CL.org) }}>
                <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m }}>{m.icon} {m.name.toUpperCase()}</div>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt, marginBottom: 7 }}>Hon. {m.minister}</div>
                <div style={{ fontSize: TS(31), color: CL.tm, marginBottom: 14, fontStyle: "italic" }}>PS: {m.permSec} · Staff: {(m.staff || 0).toLocaleString()}</div>
                <SB label="Performance" value={m.perf} max={100} color={CL.blu} />
                <SB label="Corruption" value={m.cor} max={100} color={CL.red} />
                <div style={{ fontSize: TS(31), color: CL.td, marginTop: 10, fontFamily: F.m }}>Budget: ₦{(m.budget || 0).toFixed(1)}B</div>
                <div style={{ display: "flex", gap: 10, marginTop: 19, flexWrap: "wrap" }}>
                  <Bt v="danger" onClick={() => { const old = m.minister; setMinistries(ms => ms.map(x => x.id === m.id ? { ...x, minister: gen(), perf: Math.max(20, x.perf - 8), cor: Math.max(5, x.cor - 10) } : x)); setS(pr => ({ ...pr, app: cl100(pr.app - 3), pStab: cl100(pr.pStab - 4) })); addL("🔄 Fired Hon. " + old + " (" + m.name + "). -3 approval, -4 party.", "political"); setWikiEvents(w => [{ turn, section: "Governorship", txt: "Sacked Hon. " + old + " as " + m.name + " Commissioner in a cabinet reshuffle." }, ...w]); try { window.SOPX_onDecision && window.SOPX_onDecision("minister_sacked", { name: old, ministerId: m.id }); } catch(e){} }} style={{ fontSize: TS(29), padding: "7px 22px" }}>Fire</Bt>
                  <Bt v="ghost" onClick={() => { const old = m.permSec; setMinistries(ms => ms.map(x => x.id === m.id ? { ...x, permSec: gen(), perf: Math.min(100, x.perf + 5) } : x)); addL("🔀 Reassigned PS " + old + " → new PS in " + m.name + ".", "political"); setWikiEvents(w => [{ turn, section: "Governorship", txt: "Reassigned the Permanent Secretary of " + m.name + ", replacing " + old + " during an administrative shake-up." }, ...w]); }} style={{ fontSize: TS(29), padding: "7px 22px" }}>Reassign PS</Bt>
                  <Bt v="ghost" onClick={() => { const raise = 0.5; setMinistries(ms => ms.map(x => x.id === m.id ? { ...x, budget: (x.budget || 0) + raise, perf: Math.min(100, x.perf + 3) } : x)); setS(pr => ({ ...pr, debt: pr.debt + raise })); addL("💰 Boosted " + m.name + " budget by ₦" + raise + "B.", "policy"); setWikiEvents(w => [{ turn, section: "Governorship", txt: "Increased the budget of " + m.name + " by ₦" + raise + "B to accelerate implementation." }, ...w]); }} style={{ fontSize: TS(29), padding: "7px 22px" }}>+₦0.5B</Bt>
                </div>
              </Cd>;
            })}</div>
          </div>}
          {(!ministries || ministries.length === 0) && <div style={{ marginTop: 36, padding: 36, background: CL.card, border: "1px dashed " + CL.bdr, borderRadius: 13, textAlign: "center", fontSize: TS(36), color: CL.td }}>
            💡 Your cabinet is empty because only ministries you convene count. Go to <button onClick={() => setNav("min")} style={{ background: "none", border: 0, color: CL.grn, cursor: "pointer", textDecoration: "underline", fontSize: TS(36), fontFamily: F.b }}>🏛️ Ministries</button> to initialise or create your Executive Council. Those ministers become the only officials you can fire, replace, reassign, and fund here.
          </div>}
        </div>}

        {nav === "cs" && <div>
          <Cd style={{ marginBottom: 29 }}>
            <h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 14px", fontSize: TS(50), fontWeight: 600 }}>🏛️ Civil Service — Permanent Secretaries</h3>
            <div style={{ fontSize: TS(34), color: CL.td, lineHeight: 1.4, marginBottom: 22 }}>These career bureaucrats run your ministries day-to-day. Commissioners set direction — permanent secretaries implement. Their efficiency determines whether your policies actually reach the people. Their corruption determines how much money disappears along the way.</div>
            <div style={{ display: "flex", gap: 22, marginBottom: 29, flexWrap: "wrap" }}>
              <Bg text={"Avg Efficiency: " + Math.round(Object.values(ps).reduce((s2, p) => s2 + p.eff, 0) / Object.values(ps).length) + "%"} color={Object.values(ps).reduce((s2, p) => s2 + p.eff, 0) / Object.values(ps).length > 55 ? CL.grn : CL.red} />
              <Bg text={"Avg Corruption: " + Math.round(Object.values(ps).reduce((s2, p) => s2 + p.cor, 0) / Object.values(ps).length) + "%"} color={Object.values(ps).reduce((s2, p) => s2 + p.cor, 0) / Object.values(ps).length < 30 ? CL.grn : CL.red} />
            </div>
          </Cd>
          <div style={{ display: "grid", gap: 22, marginBottom: 36 }}>
            {Object.entries(ps).map(([k, p]) => {
              const rn2 = PS_ROLES.find(r => r.k === k);
              return <Cd key={k} style={{ padding: 29 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: TS(29), color: CL.td, fontFamily: F.m }}>{rn2?.icon} {rn2?.t || k}</div>
                    <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt }}>{p.nm}</div>
                    <Bg text={p.type} color={p.type === "Technocrat" || p.type === "Reformer" ? CL.grn : p.type === "Corrupt Bureaucrat" || p.type === "Party Plant" ? CL.red : CL.org} />
                  </div>
                  <div style={{ textAlign: "right", fontSize: TS(34), fontFamily: F.m }}>
                    <div style={{ color: p.eff > 60 ? CL.grn : p.eff > 40 ? CL.org : CL.red }}>Eff: {p.eff}%</div>
                    <div style={{ color: p.cor < 25 ? CL.grn : p.cor < 45 ? CL.org : CL.red }}>Cor: {p.cor}%</div>
                    <div style={{ color: CL.td }}>Resist: {p.resist}%</div>
                  </div>
                </div>
                <div style={{ fontSize: TS(31), color: CL.tm, marginTop: 10, fontStyle: "italic" }}>{p.bio}</div>
              </Cd>;
            })}
          </div>
          <Cd>
            <h3 style={{ fontFamily: F.d, color: CL.pur, margin: "0 0 22px", fontSize: TS(48), fontWeight: 600 }}>⚙️ Civil Service Reforms</h3>
            <div style={{ fontSize: TS(34), color: CL.td, marginBottom: 22 }}>Reforming the bureaucracy is one of the hardest things a governor can do. The civil service predates you and will outlast you. Choose wisely.</div>
            <div style={{ display: "grid", gap: 19 }}>
              {CS_REFORMS.map(ref => {
                const done = csReformsDone.includes(ref.id);
                return <Cd key={ref.id} onClick={done ? undefined : () => {
                  setCSReformsDone(p => [...p, ref.id]);
                  setS(p => ({ ...p, debt: p.debt + ref.cost }));
                  // Apply reform effects
                  if (ref.id === "cs_audit") { addL("🔍 CIVIL SERVICE AUDIT: Performance of all permanent secretaries now visible. Some are shaking.", "political"); }
                  if (ref.id === "cs_retire") {
                    setPS(p => {
                      const n2 = { ...p };
                      Object.entries(n2).forEach(([k, v]) => { if (v.type === "Old Guard" || v.eff < 35) { n2[k] = { ...v, eff: ri(55, 80, rng(Date.now())), cor: ri(10, 30, rng(Date.now())), type: "Reformer", nm: gN(rng(Date.now() + k.length), sd.zone, setup?.state), bio: "New appointment. Eager to prove themselves.", resist: ri(10, 30, rng(Date.now())) }; } });
                      return n2;
                    });
                    setS(p => ({ ...p, app: cl100(p.app - 3), pStab: cl100(p.pStab - 5) }));
                    addL("🏛️ COMPULSORY RETIREMENT: Old Guard forced out. -3 approval, -5 party.", "political");
                    setNicPending({ turn: turn + 1, type: "retired officers", desc: "Forcibly retired civil servants filed suit at the National Industrial Court challenging their compulsory retirement. The NIC ruled that the process violated Public Service Rules — officers above Grade Level 14 cannot be retired without due process. The court ordered reinstatement or full severance compensation." });
                    addL("⚠️ SA " + cast.adviser.name + ": \"Your Excellency, the retired officers will challenge this at the NIC. S.254C gives the court exclusive jurisdiction. Expect a ruling next turn.\"", "political");
                  }
                  if (ref.id === "cs_training") {
                    setPS(p => { const n2 = { ...p }; Object.entries(n2).forEach(([k, v]) => { n2[k] = { ...v, eff: Math.min(95, v.eff + 15) }; }); return n2; });
                    addL("📚 CAPACITY BUILDING: All permanent secretaries complete training. Efficiency improved statewide.", "success");
                  }
                  if (ref.id === "cs_digital") {
                    setPS(p => { const n2 = { ...p }; Object.entries(n2).forEach(([k, v]) => { n2[k] = { ...v, cor: Math.max(5, v.cor - 20) }; }); return n2; });
                    setS(p => ({ ...p, cor: cl(p.cor - .05) }));
                    addL("💻 DIGITAL CIVIL SERVICE: Ghost workers eliminated. Procurement digitized. Corruption reduced across the board.", "success");
                  }
                  if (ref.id === "cs_replace") {
                    setPS(p => {
                      const n2 = { ...p };
                      Object.entries(n2).forEach(([k]) => { n2[k] = { nm: gN(rng(Date.now() + k.length * 3), sd.zone, setup?.state), type: "Party Plant", eff: ri(30, 55, rng(Date.now())), cor: ri(30, 55, rng(Date.now())), resist: ri(5, 20, rng(Date.now())), role: k, bio: "Political appointee. Loyal to the governor, not the institution." }; });
                      return n2;
                    });
                    setS(p => ({ ...p, pStab: cl100(p.pStab + 5), app: cl100(p.app - 5) }));
                    setSkApp(p => ({ ...p, unions: cl100((p.unions || 50) - 15) }));
                    addL("🏛️ ALL PERMANENT SECRETARIES REPLACED. +5 party, -5 approval, -15 unions.", "political");
                    setNicPending({ turn: turn + 1, type: "permanent secretaries", desc: "All six removed permanent secretaries jointly filed at the National Industrial Court. The NIC found the mass replacement arbitrary and in violation of the Public Service Rules. The court ordered either reinstatement or payment of full terminal benefits plus damages." });
                    addL("⚠️ SA " + cast.adviser.name + ": \"Your Excellency, replacing ALL permanent secretaries at once WILL trigger the NIC. Under S.254C, you cannot avoid their jurisdiction. The unions are already with their lawyers.\"", "crisis");
                  }
                }} style={{ padding: 24, opacity: done ? .4 : 1 }}>
                  <div style={{ fontWeight: 600, fontSize: TS(36), color: done ? CL.td : CL.txt }}>{done ? "✅ " : ""}{ref.nm}</div>
                  <div style={{ fontSize: TS(31), color: CL.td, lineHeight: 1.3 }}>{ref.d}</div>
                  <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                    {ref.cost > 0 && <Bg text={naira(ref.cost)} color={CL.org} />}
                    <Bg text={ref.turn + "T"} color={CL.pur} />
                  </div>
                  <div style={{ fontSize: TS(29), color: CL.org, marginTop: 7 }}>{ref.fx}</div>
                </Cd>;
              })}
            </div>
          </Cd>
        </div>}

        {nav === "con" && <div className="sop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 29 }}><Cd><h3 style={{ color: CL.grn, fontFamily: F.d, fontSize: TS(50), fontWeight: 600, margin: "0 0 22px" }}>✅ CAN</h3>{CONST_CAN.map((p, i) => <div key={i} style={{ fontSize: TS(34), color: CL.tm, padding: "7px 0", borderBottom: "1px solid " + CL.bdr }}>{p}</div>)}</Cd><Cd><h3 style={{ color: CL.red, fontFamily: F.d, fontSize: TS(50), fontWeight: 600, margin: "0 0 22px" }}>❌ CANNOT</h3>{CONST_CANT.map((p, i) => <div key={i} style={{ fontSize: TS(34), color: CL.tm, padding: "7px 0", borderBottom: "1px solid " + CL.bdr }}>{p}</div>)}</Cd></div>}

        {nav === "min" && <div id="sop-realism-min" data-nav="min"><div style={{ padding: 72, textAlign: "center", color: CL.td, fontSize: TS(38) }}>Loading Ministries module…</div></div>}
        {nav === "prj" && <div id="sop-realism-prj" data-nav="prj"><div style={{ padding: 72, textAlign: "center", color: CL.td, fontSize: TS(38) }}>Loading Projects module…</div></div>}
        {nav === "proc" && <div id="sop-realism-proc" data-nav="proc"><div style={{ padding: 72, textAlign: "center", color: CL.td, fontSize: TS(38) }}>Loading Procurement Log…</div></div>}
        {nav === "coun" && <div id="sop-realism-coun" data-nav="coun"><div style={{ padding: 72, textAlign: "center", color: CL.td, fontSize: TS(38) }}>Loading Traditional Rulers Council…</div></div>}
        {nav === "bio" && <div id="sop-realism-bio" data-nav="bio"><div style={{ padding: 72, textAlign: "center", color: CL.td, fontSize: TS(38) }}>Loading Wikipedia bio…</div></div>}
        {nav === "cast" && <div style={{ display: "grid", gridTemplateColumns: TALL() ? "1fr" : "repeat(auto-fill,minmax(420px,1fr))", gap: 22 }}>
          {Object.values(cast).map(c => {
            const rec = (window.SOP_CAST ? window.SOP_CAST.history(c.id) : []).slice(-3).reverse();
            return <Cd key={c.id} style={{ padding: 29 }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-end", marginBottom: 14 }}>
                {castArt(c) && <img src={castArt(c)} alt={c.name} loading="lazy" style={{ width: 120, height: 140, objectFit: "cover", objectPosition: "top", borderRadius: 16, background: CL.grn + "14", flexShrink: 0 }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: TS(21), letterSpacing: 3, color: CL.grn, textTransform: "uppercase" }}>{c.role}</div>
                  <div style={{ fontFamily: F.d, fontSize: TS(42), fontWeight: 700, color: CL.txt, margin: "6px 0 2px" }}>{c.name}</div>
                  <div style={{ fontSize: TS(24), color: CL.td }}>{c.title}</div>
                </div>
              </div>
              {rec.length ? rec.map(e => <div key={e.id} style={{ fontSize: TS(24), color: CL.tm, lineHeight: 1.45, padding: "8px 0", borderTop: "1px solid " + CL.bdr }}>
                <b style={{ color: CL.txt }}>Turn {e.t}</b> · {e.decision || e.note || e.kind.replace(/_/g, " ")}
              </div>) : <div style={{ fontSize: TS(24), color: CL.td, fontStyle: "italic", borderTop: "1px solid " + CL.bdr, paddingTop: 8 }}>Nothing between you yet.</div>}
            </Cd>;
          })}
        </div>}
        {nav === "log" && <Cd><h3 style={{ fontFamily: F.d, color: CL.txt, margin: "0 0 22px", fontSize: TS(50), fontWeight: 600 }}>📰 News</h3>{logs.length === 0 ? <div style={{ color: CL.td, fontSize: TS(34) }}>No news.</div> : logs.map((e, i) => { const tc = { policy: CL.grn, crisis: CL.red, political: CL.org, dilemma: CL.pur, success: CL.teal, scandal: CL.red, flagship: CL.org, "const": CL.red }; return <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid " + CL.bdr, display: "flex", gap: 19 }}><Bg text={"T" + e.t} color={CL.td} /><span style={{ color: tc[e.tp] || CL.tm, fontSize: TS(34) }}>{e.tx}</span></div>; })}</Cd>}
      </div>
    </div>
  );
};

// ─── END SCREENS ───
// ─── PRESIDENTIAL RACE ───
const PresRace = ({ setup, stats, onResult }) => {
  const [phase, setPhase] = useState("choose");
  const [alliance, setAlliance] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [result, setResult] = useState(null);

  const st = stats || { app: 50, lit: .5, hp: .5, infra: .5, sec: .5, agr: .5, cor: .3, debt: 5, pStab: 50 };
  const di = (st.lit + st.hp + st.infra + st.sec + st.agr) / 5 * 100;
  const fi = Math.max(0, 100 - st.debt * 4 - st.cor * 40);

  const alliances = [
    { id: "north", nm: "Northern Alliance", d: "Coalition with Northern governors and emirs. Broadest voter base but many IOUs.", bonus: 12 },
    { id: "south", nm: "Southern Coalition", d: "Unite the South. Strong identity, passionate base, limited reach up North.", bonus: 8 },
    { id: "cross", nm: "Cross-Regional Pact", d: "Bridge North and South. Hardest to build but most legitimate if you pull it off.", bonus: 18 },
  ];
  const strategies = [
    { id: "populist", nm: "Populist Campaign", d: "Promise everything. Free this, free that. High energy rallies. Could backfire if record is weak.", bonus: st.app > 55 ? 14 : 4 },
    { id: "techno", nm: "Technocratic Appeal", d: "Lead with data and your track record. Credible but boring. Works if your numbers are strong.", bonus: di > 55 ? 16 : 6 },
    { id: "grass", nm: "Grassroots Movement", d: "Youth-led, social media-driven. The new playbook. Cheap but unpredictable.", bonus: 10 + Math.floor(Math.random() * 8) },
  ];

  function runElection() {
    const ab = alliances.find(a => a.id === alliance)?.bonus || 0;
    const sb = strategies.find(s2 => s2.id === strategy)?.bonus || 0;

    // Base score from governance
    const govScore = di * 0.2 + st.app * 0.25 + fi * 0.15;
    // Penalties
    const corPenalty = st.cor * 35;
    const debtPenalty = st.debt > 10 ? (st.debt - 10) * 2 : 0;
    const partyPenalty = st.pStab < 50 ? (50 - st.pStab) * 0.3 : 0;
    // Bonuses
    const allianceBonus = ab;
    const strategyBonus = sb;
    // Randomness — elections are unpredictable
    const luck = (Math.random() - 0.5) * 20;

    const finalScore = govScore + allianceBonus + strategyBonus - corPenalty - debtPenalty - partyPenalty + luck;
    // Threshold is 55 — intentionally hard
    const won = finalScore > 55;

    setResult({ won, score: finalScore.toFixed(1), govScore: govScore.toFixed(1), penalties: (corPenalty + debtPenalty + partyPenalty).toFixed(1), bonuses: (allianceBonus + strategyBonus).toFixed(1) });
    setPhase("result");
  }

  if (phase === "result" && result) return (
    <div style={{ minHeight: "100%", background: result.won ? "#f0fff0" : CL.bg, padding: "72px 43px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Flag />
      <div style={{ textAlign: "center", maxWidth: 948, marginTop: 72 }}>
        <div style={{ fontSize: TS(142), marginBottom: 36 }}>{result.won ? "🇳🇬" : "😔"}</div>
        <h2 style={{ fontFamily: F.d, color: result.won ? CL.grn : CL.red, fontSize: TS(102), fontWeight: 700, margin: "0 0 29px" }}>
          {result.won ? "PRESIDENT-ELECT!" : "DEFEATED"}
        </h2>
        <p style={{ color: CL.tm, fontSize: TS(43), lineHeight: 1.6, marginBottom: 43 }}>
          {result.won
            ? "From " + (setup?.state || "").replace("_", " ") + " to Aso Rock Villa. Nigeria has chosen you. The highest office in the land is yours."
            : "The presidency eluded you. The national stage proved more demanding than state politics. Your " + (setup?.state || "").replace("_", " ") + " legacy endures — but Aso Rock belongs to someone else."}
        </p>
        <Cd style={{ marginBottom: 43, textAlign: "left" }}>
          <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 14 }}>ELECTION BREAKDOWN</div>
          <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.5 }}>
            Governance record: {result.govScore} points{"\n"}
            Alliance + Strategy: +{result.bonuses} points{"\n"}
            Penalties (corruption, debt, party): -{result.penalties} points{"\n"}
            Election volatility: applied{"\n"}
            Final score: {result.score} (needed 55 to win)
          </div>
        </Cd>
        <Bt onClick={() => onResult(result.won)} style={{ padding: "38px 113px", fontSize: TS(48) }}>
          {result.won ? "ACCEPT THE MANDATE" : "RETURN TO PRIVATE LIFE"}
        </Bt>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px" }}>
      <Flag />
      <div style={{ maxWidth: 1056, margin: "72px auto" }}>
        <div style={{ textAlign: "center", marginBottom: 58 }}>
          <div style={{ fontSize: TS(34), letterSpacing: 14, color: CL.gold, fontFamily: F.m, textTransform: "uppercase", marginBottom: 14 }}>Presidential Campaign</div>
          <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(86), fontWeight: 600, margin: "0 0 14px" }}>The Race for Aso Rock</h2>
          <p style={{ color: CL.td, fontSize: TS(38) }}>Your governance record is your platform. Choose your alliance and strategy wisely.</p>
          <div style={{ display: "flex", gap: 22, justifyContent: "center", marginTop: 29, flexWrap: "wrap" }}>
            <Bg text={"Dev Index: " + di.toFixed(0) + "%"} color={di > 55 ? CL.grn : CL.org} />
            <Bg text={"Approval: " + Math.round(st.app) + "%"} color={st.app > 50 ? CL.grn : CL.red} />
            <Bg text={"Corruption: " + Math.round(st.cor * 100) + "%"} color={st.cor < .3 ? CL.grn : CL.red} />
            <Bg text={"Debt: " + naira(st.debt)} color={st.debt < 10 ? CL.grn : CL.red} />
          </div>
        </div>

        <Cd style={{ marginBottom: 36 }}>
          <h3 style={{ color: CL.gold, fontFamily: F.b, fontSize: TS(38), fontWeight: 700, margin: "0 0 14px" }}>CHOOSE YOUR ALLIANCE</h3>
          <div style={{ display: "grid", gap: 22 }}>
            {alliances.map(a => (
              <Cd key={a.id} onClick={() => setAlliance(a.id)} active={alliance === a.id} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt }}>{a.nm}</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginTop: 7 }}>{a.d}</div>
              </Cd>
            ))}
          </div>
        </Cd>

        <Cd style={{ marginBottom: 36 }}>
          <h3 style={{ color: CL.gold, fontFamily: F.b, fontSize: TS(38), fontWeight: 700, margin: "0 0 22px" }}>CHOOSE YOUR STRATEGY</h3>
          <div style={{ display: "grid", gap: 22 }}>
            {strategies.map(st2 => (
              <Cd key={st2.id} onClick={() => setStrategy(st2.id)} active={strategy === st2.id} style={{ padding: 36 }}>
                <div style={{ fontWeight: 600, fontSize: TS(43), color: CL.txt }}>{st2.nm}</div>
                <div style={{ fontSize: TS(34), color: CL.td, marginTop: 7 }}>{st2.d}</div>
              </Cd>
            ))}
          </div>
        </Cd>

        <Cd style={{ background: CL.org + "08", borderColor: CL.org + "30" }}>
          <div style={{ fontSize: TS(34), color: CL.org, fontWeight: 700, marginBottom: 10 }}>⚠️ WARNING</div>
          <div style={{ fontSize: TS(34), color: CL.td, lineHeight: 1.5 }}>Presidential elections are not won on governance alone. Alliance, strategy, corruption record, debt, party unity, and sheer luck all play a role. Even the best governor can lose. This is Nigeria — expect the unexpected.</div>
        </Cd>

        {alliance && strategy && (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Bt onClick={runElection} style={{ padding: "43px 120px", fontSize: TS(50) }}>🗳️ ELECTION DAY</Bt>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SENATE RACE ───
const SenateRace = ({ setup, stats, onResult }) => {
  const [result, setResult] = useState(null);
  const st = stats || { app: 50, cor: .3, debt: 5, pStab: 50 };

  const runElection = () => {
    // Senate is easier than presidency but not guaranteed
    // Base: approval * 0.4 + party stability * 0.3 + anti-corruption bonus
    const base = st.app * 0.4 + st.pStab * 0.3 + (1 - st.cor) * 20;
    const debtPenalty = st.debt > 10 ? (st.debt - 10) * 1.5 : 0;
    const luck = (Math.random() - 0.5) * 15;
    const score = base - debtPenalty + luck;
    // Need 42 to win — achievable but not automatic
    const won = score > 42;
    setResult({ won, score: score.toFixed(1) });
  };

  if (result) return (
    <div style={{ minHeight: "100%", background: result.won ? "#f0fff0" : CL.bg, padding: "72px 43px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Flag />
      <div style={{ textAlign: "center", maxWidth: 840, marginTop: 72 }}>
        <div style={{ fontSize: TS(134), marginBottom: 29 }}>{result.won ? "🏛️" : "😔"}</div>
        <h2 style={{ fontFamily: F.d, color: result.won ? CL.grn : CL.red, fontSize: TS(94), fontWeight: 700, margin: "0 0 29px" }}>
          {result.won ? "SENATOR-ELECT!" : "DEFEATED"}
        </h2>
        <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.6, marginBottom: 43 }}>
          {result.won
            ? "From Government House to the National Assembly. The people trust your experience. Distinguished Senator from " + (setup?.state || "").replace("_", " ") + " State."
            : "The senatorial race proved tougher than expected. Your opponent ran a strong campaign, and the electorate wanted fresh blood. Your governance legacy endures — but the Red Chamber belongs to someone else."}
        </p>
        <Cd style={{ marginBottom: 43, textAlign: "left" }}>
          <div style={{ fontSize: TS(34), fontWeight: 700, color: CL.pur, fontFamily: F.m, marginBottom: 14 }}>ELECTION BREAKDOWN</div>
          <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.5 }}>
            Your governance record and popularity determined the outcome.{"\n"}
            Final score: {result.score} (needed 42 to win){"\n"}
            {result.won ? "Your name recognition, party support, and clean record carried the day." : "Low approval, corruption allegations, or weak party support cost you the seat."}
          </div>
        </Cd>
        <Bt onClick={() => onResult(result.won)} style={{ padding: "38px 113px", fontSize: TS(48) }}>
          {result.won ? "TAKE YOUR SEAT" : "RETURN TO PRIVATE LIFE"}
        </Bt>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100%", background: CL.bg, padding: "72px 43px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Flag />
      <div style={{ textAlign: "center", maxWidth: 840, marginTop: 72 }}>
        <div style={{ fontSize: TS(124), marginBottom: 29 }}>🏛️</div>
        <h2 style={{ fontFamily: F.d, color: CL.txt, fontSize: TS(86), fontWeight: 600, margin: "0 0 22px" }}>Senatorial Election</h2>
        <p style={{ color: CL.tm, fontSize: TS(38), lineHeight: 1.5, marginBottom: 43 }}>
          You've declared for the Senate — {(setup?.state || "").replace("_", " ")} Senatorial District. Your governance record is your campaign platform, but victory is not guaranteed. This is democracy.
        </p>
        <Cd style={{ marginBottom: 43, textAlign: "left" }}>
          <div style={{ fontSize: TS(34), color: CL.tm, lineHeight: 1.5 }}>
            Your chances depend on: approval rating, party stability, corruption record, and debt levels. Even a good governor can lose a senatorial race — the electorate is unpredictable.
          </div>
        </Cd>
        <Bt onClick={runElection} style={{ padding: "43px 120px", fontSize: TS(50) }}>🗳️ ELECTION DAY</Bt>
      </div>
    </div>
  );
};

const EndScr = ({ type, state, onRestart }) => {
  const ms = { retire: { i: "🏡", t: "Elder Statesman", d: "You served " + (state || "").replace("_", " ") + " with dignity. History will remember your tenure." }, senate_w: { i: "🏛️", t: "Distinguished Senator", d: "From Government House to the National Assembly. Your experience serves the nation." }, senate_l: { i: "📖", t: "Defeated", d: "The Senate eluded you. But your governance record in " + (state || "").replace("_", " ") + " endures." }, pres_w: { i: "🇳🇬", t: "Mr. President", d: "From " + (state || "").replace("_", " ") + " to Aso Rock!" }, pres_l: { i: "📖", t: "Chapter Closes", d: "The presidency eluded you." }, fctm: { i: "📜", t: "Honourable Minister of the FCT", d: "Aso Rock has called. You now oversee Abuja — the seat of national power. Roads, planning, satellite towns, the Presidential Villa itself. A rare honour reserved only for governors of proven integrity and results. Your work in " + (state || "").replace("_", " ") + " earned you this portfolio." } };
  const m = ms[type] || ms.retire;
  return (
    <div style={{ minHeight: "100%", background: type === "pres_w" ? "#f0fff0" : CL.bg, padding: "72px 43px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 840 }}>
        <Flag />
        <div style={{ fontSize: TS(134), marginBottom: 29, marginTop: 43 }}>{m.i}</div>
        <h2 style={{ fontFamily: F.d, color: type === "pres_w" ? CL.grn : CL.txt, fontSize: TS(98), fontWeight: 700, margin: "0 0 29px" }}>{m.t}</h2>
        <p style={{ color: CL.tm, fontSize: TS(43), lineHeight: 1.6, marginBottom: 58 }}>{m.d}</p>
        {type === "pres_w" && <div style={{ fontSize: TS(34), color: CL.grn, fontFamily: F.m, marginBottom: 43 }}>🏆 GAME COMPLETE 🏆</div>}
        <Bt onClick={onRestart} style={{ padding: "36px 106px" }}>PLAY AGAIN</Bt>
      </div>
    </div>
  );
};

// ─── APP ───
// ─── SPECIAL ADVISER (Mascot) ───
const SA_NAMES = { SE: "Chidi", SW: "Tunde", SS: "Blessing", NW: "Bashir", NE: "Bukar", NC: "Danladi" };
const ADV = {
  welcome: (name, state, saName) => "There you are, the Governor-in-waiting of " + state.replace("_", " ") + " State! That is, if you listen to my advice. My name is " + saName + ". My job is to help you run a great campaign and govern this state successfully. Together, we are going to persuade voters, manage the party, and do a great job running " + state.replace("_", " ") + ". Let's get to work!",
  name: "Alright, candidate. First things first — who are you? Choose your look and tell us your name. This is how the people will know you.",
  agenda: "Every great administration is defined by ONE flagship agenda. What will yours be? Choose wisely — this is what the people will judge you on, and what history will remember.",
  primaries: "Now comes the party primaries. This is how candidates are selected within the party. Under the Electoral Act, you must win your party's ticket before you can face the general election. It's your first real test.",
  slogan: "Every winning campaign needs a slogan — something the people can chant, something that captures your vision in a few words. Make it memorable!",
  convention: "Welcome to the party convention. The party has their preferred deputy — but remember, you are the candidate. Your choice here sets the political tone for your entire campaign.",
  conventionResult: (accepted) => accepted ? "Excellent choice. The party is united. That's a strong start." : "Bold move. You've made your point — but watch your back. The party elders won't forget this easily.",
  campaign: "Campaign time! Take your message to the people. Your slogan, your agenda, your deputy — everything comes together now. Win the hearts and minds of your state!",
  govHouse: (name, state, saName, flag) => "Congratulations, Your Excellency! Welcome to Government House, " + state.replace("_", " ") + " State. I'm " + saName + ", your Special Adviser, and I'm standing right beside you." + (flag ? " " + flag.nm + " starts on day one: the people heard you promise to " + flag.goal + ", and they will count." : "") + " Let's make history!",
  budget: (amount) => "Your Excellency, it's budget time. You have " + amount + " to allocate across 8 sectors. The House of Assembly will review your Appropriation Bill — make sure it's balanced.",
  house_vote: "The House of Assembly must approve your budget under Section 121. They'll tell you their concerns before voting. If they reject it, you can amend or force it through — though I wouldn't recommend the latter.",
  policy: "Time to choose your policies and projects. Each one has costs, timelines, and some carry corruption risk. You can also sponsor bills through the House.",
  dilemma: "Your Excellency, wahala don land! 😤 This one no easy o. Every choice get consequence — think carefully about the people, the stakeholders, and your political future.",
  godfather: "Chai! The Godfather don show face again. 🎩 This man no dey joke o. You accept, your hands dirty. You refuse, your party shakes. Na you sabi.",
  trip: "An invitation has arrived, Your Excellency. Going in person opens doors that delegations cannot. But remember — every day abroad is a day away from your state.",
  reelection: "Your Excellency, four years have passed. The people will now decide if you deserve four more years. Your record speaks — for better or worse.",
  endgame: (grade) => grade === "A" || grade === "B" ? "Your Excellency, it has been an honour serving you. You've done this state proud. History will remember you well." : grade === "C" ? "Your Excellency, a mixed record. Some wins, some regrets. But you served — and that counts for something." : "Your Excellency... I tried to advise you. History will not be kind. But at least the people learned what NOT to do in governance.",
};

const SA_ROSTER = [
  { name: "Dr. Halima Sanusi",        title: "SA, Policy & Coordination",         zone: "NW", avatar: "🧕🏽",  file: "World Bank alumna · Cabinet Office veteran" },
  { name: "Barr. Chinedu Eze",         title: "SA, Legal & Legislative Affairs",   zone: "SE", avatar: "🧑🏾‍⚖️", file: "Constitutional lawyer · former House counsel" },
  { name: "Mallam Ibrahim Yusuf",      title: "SA, Security & Intergov Affairs",   zone: "NW", avatar: "👳🏾‍♂️", file: "Retired DIG · DSS liaison network" },
  { name: "Ms. Ngozi Okafor",          title: "SA, Delivery & Reform",             zone: "SE", avatar: "👩🏾‍💼", file: "McKinsey partner · procurement reform" },
  { name: "Prof. Bola Adekunle",       title: "SA, Economic Planning",             zone: "SW", avatar: "👨🏾‍🏫", file: "Public finance professor · debt desk" },
  { name: "Alh. Abdullahi Bagudu",     title: "SA, Sub-national Diplomacy",        zone: "NW", avatar: "🧔🏾",   file: "Ex-NGF secretariat · Abuja fixer" },
  { name: "Dr. Ebele Nwosu",           title: "SA, Health & Social Welfare",       zone: "SE", avatar: "👩🏾‍⚕️", file: "Ex-NPHCDA · UCH consultant" },
  { name: "Engr. Tosin Ogundipe",      title: "SA, Works & Infrastructure",        zone: "SW", avatar: "👷🏾‍♂️", file: "COREN engineer · ex-FERMA" },
  { name: "Comrade Preye Dougibo",     title: "SA, Community Relations",           zone: "SS", avatar: "🧑🏾",   file: "Ijaw youth council · former DESOPADEC" },
  { name: "Dr. Terkuma Gbenda",        title: "SA, Agriculture & Food Security",   zone: "NC", avatar: "👨🏾‍🌾", file: "Tiv middle-belt agronomist · IITA alum" },
  { name: "Hajiya Fatima Modu",        title: "SA, Humanitarian & IDP Affairs",    zone: "NE", avatar: "🧕🏾",   file: "UNHCR field officer · Borno-born" },
  { name: "Mrs. Ekaette Akpan",        title: "SA, Diaspora & Investment",         zone: "SS", avatar: "👩🏾‍💼", file: "Ex-NIPC · Akwa Ibom origin" },
  { name: "Otunba Ademola Bakare",     title: "SA, Political Affairs",             zone: "SW", avatar: "🎩",   file: "Party elder · four-time convention veteran" },
  { name: "Amb. Bello Gimba",          title: "SA, Special Duties",                zone: "NC", avatar: "🧑🏾‍💼", file: "Retired diplomat · Nasarawa native" },
  { name: "Dr. Uche Onwuka",           title: "SA, Digital Economy",               zone: "SE", avatar: "👨🏾‍💻", file: "Ex-NITDA · Anambra tech entrepreneur" },
  { name: "Mai Musa Kachalla",         title: "SA, Traditional Institutions",      zone: "NE", avatar: "🧑🏾‍🏫", file: "Palace-trained · Kanuri elder" },
];


const ExecutiveCommandSA = ({ adviser, brief, inbox, vacantTurns, onFire }) => {
  const [open, setOpen] = React.useState(false);
  const tone = brief?.urgent ? CL.red : CL.grn;
  const urgentCount = inbox.filter(i => i.urgent && !i.done).length;
  const doneCount = inbox.filter(i => i.done).length;
  return (
    <div style={{ background: "#fffef5", border: "1px solid " + tone + "77", borderRadius: 17, padding: "22px 29px", marginBottom: 29, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", gap: TALL() ? 18 : 29, alignItems: "center", cursor: "pointer", flexWrap: TALL() ? "wrap" : "nowrap" }}>
        <div style={{ width: 98, height: 98, borderRadius: "50%", background: tone + "22", border: "1.5px solid " + tone, fontSize: TS(58), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{adviser ? adviser.avatar : "🪑"}</div>
        <div style={{ flex: 1, minWidth: 1 }}>
          <div style={{ fontSize: TS(29), letterSpacing: 3, color: tone, fontFamily: F.m, fontWeight: 800, textTransform: "uppercase" }}>SA · Executive Command {urgentCount > 0 && <span style={{ background: CL.red, color: "#fff", padding: "0 14px", borderRadius: 13, marginLeft: 14 }}>{urgentCount}</span>}</div>
          <div style={{ color: CL.txt, fontWeight: 700, fontSize: TS(38), lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{brief?.icon} {brief?.title || (adviser ? adviser.name : "SA seat vacant")}</div>
        </div>
        {brief?.action && <button onClick={(e) => { e.stopPropagation(); brief.action(); }} style={{ ...(TALL() ? { order: 3, flexBasis: "100%" } : {}), border: 0, background: tone, color: "#fff", borderRadius: 11, padding: "19px 34px", fontSize: TS(34), fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>→ {brief.actionLabel}</button>}
        <div style={{ fontSize: TS(29), color: CL.td, marginLeft: 14 }}>{open ? "▲" : "▼"}</div>
      </div>
      {open && <div style={{ marginTop: 29, borderTop: "1px dashed " + CL.bdr, paddingTop: 29 }}>
        {adviser && <div style={{ fontSize: TS(34), color: CL.tm, marginBottom: 22, lineHeight: 1.4 }}><b>{adviser.name}</b> · {adviser.title}<br/><i style={{ fontSize: TS(31), color: CL.td }}>{adviser.file}</i></div>}
        {!adviser && <div style={{ fontSize: TS(34), color: CL.red, marginBottom: 22 }}>Seat vacant · replacement in {vacantTurns} turn{vacantTurns === 1 ? "" : "s"}</div>}
        {brief && <div style={{ background: tone + "0d", border: "1px solid " + tone + "33", borderRadius: 13, padding: "22px 29px", marginBottom: 22, fontSize: TS(36), color: CL.tm, lineHeight: 1.45 }}>{brief.body}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(192px, 1fr))", gap: 14 }}>
          {inbox.map((it, i) => <button key={i} onClick={it.action} disabled={!it.action} style={{ textAlign: "left", border: "1px solid " + (it.done ? CL.grn + "55" : it.urgent ? CL.red + "55" : CL.bdr), background: it.done ? CL.grn + "10" : it.urgent ? CL.red + "10" : "#fff", borderRadius: 11, padding: "14px 22px", cursor: it.action ? "pointer" : "default" }}>
            <div style={{ fontSize: TS(31), fontWeight: 800, color: it.done ? CL.grn : it.urgent ? CL.red : CL.tm }}>{it.done ? "✓ " : it.urgent ? "! " : ""}{it.label}</div>
            <div style={{ fontSize: TS(29), color: CL.td, marginTop: 5, lineHeight: 1.3 }}>{it.detail}</div>
          </button>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: TS(29), color: CL.td }}>
          <span>{doneCount}/{inbox.length} agenda items complete</span>
          {adviser && <button onClick={onFire} style={{ border: 0, background: "transparent", color: CL.red, fontSize: TS(31), fontWeight: 700, cursor: "pointer" }}>🔥 Fire adviser</button>}
        </div>
      </div>}
    </div>
  );
};



function App() {
  // Re-render on rotation so TALL() layouts switch with the screen.
  const [, setShape] = useState(TALL());
  useEffect(() => {
    const on = () => setShape(TALL());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const [scr, setScr] = useState("title");
  const [level, setLevel] = useState("medium");
  const [setup, setSetup] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [loadedSave, setLoadedSave] = useState(null);
  const rst = () => { setScr("title"); setSetup(null); setFinalStats(null); setLoadedSave(null); };

  const loadGame = async () => {
    try {
      const r = await window.storage.get("sop_save");
      if (r?.value) {
        const d = migrateSave(JSON.parse(r.value));
        // Restore the Historic Ledger BEFORE the governing screen mounts, so
        // the tribunal, EFCC case file and adviser all wake with their memory.
        try { if (d.ledger && window.SOP_LEDGER?.hydrate) window.SOP_LEDGER.hydrate(d.ledger); } catch (e) {}
        try { if (d.civic && window.SOP_CIVIC?.restore) window.SOP_CIVIC.restore(d.civic); } catch (e) {}
        try { if (d.politics && window.SOP_POLITICS?.hydrate) window.SOP_POLITICS.hydrate(d.politics); } catch (e) {}
        setSetup(d.setup);
        setLevel(d.setup?.level || "medium");
        setLoadedSave(d);
        setScr("gov");
      }
    } catch (e) { console.error("Load failed", e); }
  };

  return (
    <div style={{ fontFamily: F.b, background: CL.bg, color: CL.txt, minHeight: "100%" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        @media (max-width: 640px) {
          .sop-gov-grid { grid-template-columns: 1fr !important; }
          .sop-2col { grid-template-columns: 1fr !important; }
        }
        /* Portrait: the stage is 720 design px wide, so the media query above
           never fires; stack the two-column pages here instead. */
        #sop-stage.sop-tall .sop-gov-grid, #sop-stage.sop-tall .sop-2col { grid-template-columns: 1fr !important; }
        .sop-fade-in { animation: sopFadeIn .4s ease-out; }
        .sop-slide-up { animation: sopSlideUp .35s ease-out; }
        @keyframes sopFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sopSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <HowToPlay show={showHelp} onClose={() => setShowHelp(false)} />
      {scr === "title" && <TitleScreen onStart={() => { try { window.dispatchEvent(new CustomEvent('sop-new-game')); } catch (e) {} setScr("setup"); }} onHelp={() => setShowHelp(true)} onLoad={loadGame} />}
      {scr === "setup" && <SetupScreen level={level} setLevel={setLevel} onDone={s => { setSetup({ ...s, level }); setLoadedSave(null); setScr("gov"); }} />}
      {scr === "gov" && <GovScreen setup={setup ? { ...setup, level } : null} loadedSave={loadedSave} onEnd={(ch, stats) => { if (stats) setFinalStats(stats); if (ch === "restart") rst(); else if (ch === "president") setScr("pres"); else if (ch === "senate") setScr("senate"); else if (ch === "fctm") setScr("end_fctm"); else setScr("end_ret"); }} onHelp={() => setShowHelp(true)} />}
      {scr === "pres" && <PresRace setup={setup} stats={finalStats} onResult={won => setScr(won ? "end_pres_w" : "end_pres_l")} />}
      {scr === "senate" && <SenateRace setup={setup} stats={finalStats} onResult={won => setScr(won ? "end_sen_w" : "end_sen_l")} />}
      {scr === "end_ret" && <EndScr type="retire" state={setup?.state} onRestart={rst} />}
      {scr === "end_sen_w" && <EndScr type="senate_w" state={setup?.state} onRestart={rst} />}
      {scr === "end_sen_l" && <EndScr type="senate_l" state={setup?.state} onRestart={rst} />}
      {scr === "end_pres_w" && <EndScr type="pres_w" state={setup?.state} onRestart={rst} />}
      {scr === "end_pres_l" && <EndScr type="pres_l" state={setup?.state} onRestart={rst} />}
      {scr === "end_fctm" && <EndScr type="fctm" state={setup?.state} onRestart={rst} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
