// Names that belong to the place (owner, 26 Nov 2026: "names original to the states… if I hear the name I know it's from
// that state or LGA").
import test from "node:test";
import assert from "node:assert/strict";
import { NAME_GROUPS, STATE_NAMES, nameFor, groupOf, FEMALE_GIVEN } from "../game/systems/names.js";
import { LGA_ISSUES } from "../game/systems/placeissues.js";

const r0 = (s) => { let a = s; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };
test("every state has its own names, and each people a full set", () => {
  for (const st of Object.keys(LGA_ISSUES)) assert.ok(STATE_NAMES[st], st + " has names");
  for (const [k, g] of Object.entries(NAME_GROUPS)) { assert.ok(g.m.length >= 5 && g.f.length >= 4 && g.ln.length >= 7, k); g.m.forEach(x => assert.ok(!FEMALE_GIVEN.includes(x), k + ": " + x + " is listed as a man's and a woman's name")); }
});
test("a mixed state's local governments map to real ones in the game", () => {
  const norm = (x) => String(x).toLowerCase().replace(/[^a-z]/g, "");
  for (const [st, D] of Object.entries(STATE_NAMES)) { const L = Object.keys(LGA_ISSUES[st] || {}).map(norm); if (!L.length) continue;
    for (const [g, list] of Object.entries(D.by || {})) list.forEach(l => assert.ok(L.includes(norm(l)), st + ": " + l + " (" + g + ") is not a local government in the game")); }
});
test("the local government decides the people", () => {
  assert.equal(groupOf("Kogi", "Okene"), "ebira"); assert.equal(groupOf("Kogi", "Idah"), "igala"); assert.equal(groupOf("Kogi", "Kabba/Bunu"), "okun");
  assert.equal(groupOf("Rivers", "Khana"), "ogoni"); assert.equal(groupOf("Rivers", "Bonny"), "kalabari"); assert.equal(groupOf("Rivers", "Obio/Akpor"), "ikwerre");
  assert.equal(groupOf("Delta", "Warri South"), "itsekiri"); assert.equal(groupOf("Delta", "Ika South"), "anioma"); assert.equal(groupOf("Ogun", "Ijebu Ode"), "ijebu");
  assert.equal(groupOf("Plateau", "Jos South"), "berom"); assert.equal(groupOf("Borno", "Biu"), "bura"); assert.equal(groupOf("Edo", "Esan West"), "esan");
  const n = nameFor(r0(7), "Kogi", "Okene"), [fn, ln] = n.split(" "); const E = NAME_GROUPS.ebira; assert.ok((E.m.includes(fn) || E.f.includes(fn)) && E.ln.includes(ln), n);
  assert.ok(NAME_GROUPS.berom.f.includes(nameFor(r0(3), "Plateau", "Riyom", null, true).split(" ")[0]));
});
test("no real politician's or famous family's surname", () => {
  const BAN = ["Tinubu", "Obasanjo", "Buhari", "Atiku", "Wike", "Kwankwaso", "Ganduje", "Fayemi", "Makinde", "Sanwo-Olu", "Ambode", "Amosun", "Akeredolu", "Aiyedatiwa", "Adeleke", "Oyetola", "Ortom", "Mutfwang", "Lalong", "El-Rufai", "Zulum", "Shettima", "Fintiri", "Matawalle", "Tambuwal", "Soludo", "Uzodimma", "Otti", "Ikpeazu", "Umahi", "Nwifuru", "Fubara", "Oborevwori", "Okowa", "Obaseki", "Okpebholo", "Ododo", "Radda", "Masari", "Badaru", "Ugwuanyi", "Akpabio", "Ayade", "Sylva", "Amaechi", "Odili", "Okorocha", "Obiano", "Yar'Adua", "Dangote", "Adenuga", "Otedola", "Saraki", "AbdulRazaq", "Oshiomhole", "Igbinedion", "Duke", "Kalu-Orji", "Nnamani", "Nwobodo", "Okotie", "Idahosa", "Ashafa", "Fashola", "Bagudu", "Lamido", "Gaidam", "Shekarau", "Ribadu", "Shagari", "Bafarawa", "Wamakko", "Yari", "Dariye", "Akume", "Mark", "Suswam", "Uduaghan", "Ibori", "Jonathan", "Dickson", "Peterside", "Saro-Wiwa", "Pepple", "Jaja", "Dokubo", "Soyinka", "Kuti", "Achebe", "Anyaoku", "Bayero", "Dantata", "Daura"];
  const all = Object.values(NAME_GROUPS).flatMap(g => g.ln);
  BAN.forEach(b => assert.ok(!all.some(x => x.toLowerCase().split(/[-\s]/).includes(b.toLowerCase())), b + " is in the names"));
});

test("a date of birth always has its month (Perplexity found '27 undefined 1994')", async () => {
  const { birthOf } = await import("../game/systems/wiki.js");
  for (let i = 0; i < 3000; i++) assert.match(birthOf("Person " + i + " Okafor", 2027), /^\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/);
});
test("Tori's people carry the place's names", async () => {
  const T = await import("../game/systems/tori.js");
  const f = T.toriFeed({ st: "Rivers", zone: "SS", turn: 3, year: 2029, app: 50, cor: .3, places: ["Khana"], events: [] });
  const R = ["ikwerre", "ogoni", "kalabari"].flatMap(g => [...NAME_GROUPS[g].m, ...NAME_GROUPS[g].f]);
  const names = f.filter(x => x.kind === "citizen" && x.name).map(x => x.name.replace(/^(Mama|Iya|Baba|Nurse|Dr|Mr|Mrs) /, "").split(" ")[0]);
  assert.ok(names.length >= 3 && names.filter(n => R.includes(n)).length >= names.length * .6, names.join(", "));
});
