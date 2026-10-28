import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Every image shipped in public/art is used somewhere: by name in the game,
// its rules (game/systems) or the page shell. An unused image is a mistake.
const root = new URL("..", import.meta.url).pathname;
const src = [path.join(root, "game/seat-of-power.jsx"), path.join(root, "public/seat-of-power.html"), ...fs.readdirSync(path.join(root, "game/systems")).map(f => path.join(root, "game/systems", f)), ...fs.readdirSync(path.join(root, "public")).filter(f => /^sop-(?!app).*\.js$/.test(f)).map(f => path.join(root, "public", f))]
  .map(f => fs.readFileSync(f, "utf8")).join("\n");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const PACK2 = ["backgrounds/finance-ministry-office", "characters/finance-commissioner", "scenes/money-", "scenes/inherited-debt", "scenes/ghost-workers-purge"];
test("every money-pack image is used by the game", () => {
  const files = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.relative(path.join(root, "public/art"), f).replace(/\.webp$/, ""));
  const pack2 = files.filter(f => PACK2.some(p => f.startsWith(p)) || /^objects\/(coin|coins-burst|debt-ledger|faac-envelope|igr-receipt|treasury-chest|unpaid-invoices)/.test(f));
  assert.equal(pack2.length, 26, "the money pack has 26 images");
  const unused = pack2.filter(f => !src.includes(path.basename(f)));
  assert.deepEqual(unused, []);
});
// Bills: the bill document is used. The signing animation (paper, pen, VETOED and
// ASSENTED stamps) was retired at the owner's request: a bill ends on the front page.
test("the bill document is used", () => {
  assert.ok(src.includes("bill-document"), "bill-document is used");
});
// The October packs: badges, daily icons, the sealed letter, the investor, the billboard.
test("every October image is used", () => {
  const dirs = { badges: "public/art/badges" };
  const files = fs.readdirSync(path.join(root, dirs.badges)).map(f => f.replace(/\.webp$/, ""))
    .concat(["icon-daily", "icon-streak", "icon-streak-freeze", "icon-share", "letter-sealed-large", "wax-seal-red", "investor-foreign", "billboard-street", "billboard-rally"]);
  assert.deepEqual(files.filter(f => !src.includes(f)), []);
});
// Elections and projects pack: site pictures by stage, pins by colour, the count and the declaration.
test("every election and project image is used", () => {
  const files = ["backgrounds/collation-board-lga", "backgrounds/project-ribbon-cutting", "backgrounds/project-site-cleared", "backgrounds/project-site-halfway", "backgrounds/project-site-stalled", "objects/result-sheet-blank", "scenes/declaration", "scenes/second-election"];
  files.forEach(f => assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f + " is shipped"));
  assert.deepEqual(files.filter(f => !src.includes(path.basename(f))), []);
  ["grey", "gold", "green", "red"].forEach(c => {
    assert.ok(fs.existsSync(path.join(root, "public/art/objects/map-pin-project-" + c + ".webp")), c + " pin is shipped");
    assert.ok(src.includes("map-pin-project-") && src.includes('"' + c + '"'), c + " pin is used");
  });
});
// Vanity looks: a look marked ready has its picture; one without a picture stays out of the pickers.
test("every ready attire look has its picture, and every pack is a server product", () => {
  const jsx = fs.readFileSync(path.join(root, "game/seat-of-power.jsx"), "utf8");
  const server = fs.readFileSync(path.join(root, "server/vatar-server.mjs"), "utf8");
  const looks = [...jsx.matchAll(/\{ id: "x_([a-z_]+)", pack: "(attire_[a-z]+)"[^}]*ready: (true|false)/g)];
  assert.equal(looks.length, 8, "eight looks");
  looks.forEach(([, id, pack, ready]) => {
    const file = path.join(root, "public/art/characters/governor-" + id.replace(/_/g, "-") + ".webp");
    if (ready === "true") assert.ok(fs.existsSync(file), id + " is ready but has no picture");
    assert.ok(server.includes(pack + ": \"oneoff\""), pack + " is a product");
  });
  ["portrait_frames", "scenario_security", "scenario_election"].forEach(p => assert.ok(server.includes(p + ": \"oneoff\""), p));
});
// Art pack 2: the adviser's full figure, the House, the campaign and the reaction moods.
test("every adviser pose, House picture, campaign scene and mood is used", () => {
  const files = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.relative(path.join(root, "public/art"), f).replace(/\.webp$/, ""));
  const pack = files.filter(f => /^characters\/(adviser-.*-full-|speaker-(?!of-the-house)|lawmaker-|party-chairman-|godfather-(pleased|worried|angry)$|deputy-.*-(pleased|worried|angry)$|commissioner-.*-(pleased|worried)$|(market-women|youth|workers)-group-)|^scenes\/(camp-|attack-|party-elders-meeting|town-hall-appeal|back-room-settlement)|^backgrounds\/assembly-chamber-wide|^objects\/(vote-tally-board|constituency-project-sign)/.test(f));
  assert.equal(pack.length, 83, "83 pictures in the four packs (" + pack.length + ")");
  assert.deepEqual(pack.filter(f => !src.includes(path.basename(f))), []);
  ["deputy-angry", "deputy-pleased", "deputy-worried"].forEach(f => assert.ok(!fs.existsSync(path.join(root, "public/art/characters", f + ".webp")), f + ": the old set with the wrong face is gone"));
});
// The icon pack, the Chief of Staff, the mailbox, the newspaper photos and the attire looks.
test("every icon, seal, Chief of Staff, mailbox, newspaper and attire picture is used", () => {
  const chief = fs.readFileSync(path.join(root, "game/systems/chief.js"), "utf8");
  const all = src + chief;
  const icons = fs.readdirSync(path.join(root, "public/art/icons")).filter(f => f.endsWith(".webp")).map(f => f.replace(/\.webp$/, ""));
  assert.equal(icons.length, 92, "92 icons (48 + the five office icons + the five trip icons + the Bakunda seal + the Aso Rock visit + the five Pack 24 icons + the six council seals and four trade icons + the five neighbour icons + impeach + the diplomacy seal and icon + the cabinet's three + the six lenders' seals)");
  assert.deepEqual(icons.filter(f => !all.includes('"' + f + '"') && !all.includes("/" + f + ".webp")), [], "every icon is used by name or path");
  ["chief-of-staff-fixer", "chief-of-staff-matriarch", "chief-of-staff-technocrat", "chief-of-staff-veteran"].forEach(f => assert.ok(chief.includes(f) && fs.existsSync(path.join(root, "public/art/characters", f + ".webp")), f));
  ["mailbox-tray", "letter-sealed", "letter-open"].forEach(f => assert.ok(src.includes(f) && fs.existsSync(path.join(root, "public/art/objects", f + ".webp")), f));
  ["news-court-steps", "news-governor-abroad", "news-investor-deal", "news-protest", "news-signing-ceremony", "news-victory-rally"].forEach(f => assert.ok(src.includes(f) && fs.existsSync(path.join(root, "public/art/scenes", f + ".webp")), f));
});

// The career packs: the ladder and the Senator are in the game; the others wait in art-staging/.
test("every Senator and career-ladder picture is used", () => {
  const names = ["constituency-office", "national-assembly-exterior", "senate-chamber", "senate-hearing-room", "senator-office-abuja", "lobbyist", "minister-witness", "minister-witness-worried", "senate-minority-leader",
    "senate-president", "senate-president-pleased", "senate-president-angry", "senate-president-worried", "senator-female", "senator-veteran-male", "senator-young-male", "the-president", "the-president-pleased", "the-president-angry",
    "committee-report", "senate-mace", "vote-card", "constituency-project-commissioning", "defection-press-conference", "oversight-grilling", "senate-president-election", "senate-vote", "career-ladder", "badge-senator"];
  const files = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.basename(f, ".webp"));
  assert.deepEqual(names.filter(n => !files.includes(n)), [], "all shipped");
  assert.deepEqual(names.filter(n => !src.includes('"' + n + '"') && !src.includes("/" + n + ".webp")), [], "all referenced");
});
test("every LGA Chairman picture is used", () => {
  const names = ["chairman-office", "council-chamber", "lga-secretariat", "rural-health-centre", "rural-road-mud", "village-square", "councillor-female", "councillor-male", "health-worker",
    "lga-treasurer", "lga-treasurer-worried", "village-head", "chairman-flag-off", "joint-account-meeting", "market-fire-aftermath", "badge-chairman",
    "councillor-male-pleased", "councillor-male-angry", "in-tray", "market-road-finished", "market-road-washout"];
  const files = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.basename(f, ".webp"));
  const rules = fs.readFileSync(path.join(root, "game/systems/lga.js"), "utf8"), all = src + rules;
  assert.deepEqual(names.filter(n => !files.includes(n)), [], "all shipped");
  assert.deepEqual(names.filter(n => !all.includes('"' + n + '"') && !all.includes("/" + n + ".webp")), [], "all referenced");
});
test("every Ambassador picture is used", () => {
  const names = ["consular-hall", "detention-visiting-room", "embassy-exterior", "embassy-office", "evacuation-airport", "foreign-ministry-meeting", "citizen-student-abroad", "citizen-trader-abroad", "consular-officer",
    "detained-citizen", "foreign-minister-nigeria", "host-minister", "diplomatic-cable", "letter-of-credence", "passport-green", "diaspora-town-hall", "presenting-credentials", "trade-deal-signing", "badge-ambassador"];
  const files = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.basename(f, ".webp"));
  assert.deepEqual(names.filter(n => !files.includes(n)), [], "all shipped");
  assert.deepEqual(names.filter(n => !src.includes('"' + n + '"') && !src.includes("/" + n + ".webp")), [], "all referenced");
});

// Pack 7: the flight (the plane, the signpost, four clouds).
test("every flight-pack picture is used by the game", () => {
  const files = ["airliner-side", "signpost", "cloud-"];
  files.forEach(f => assert.ok(src.includes(f), f + " is used"));
  ["airliner-side", "signpost", "cloud-1", "cloud-2", "cloud-3", "cloud-4"].forEach(f => assert.ok(fs.existsSync(path.join(root, "public/art/objects", f + ".webp")), f + " is in public/art/objects"));
});

// The decision packs (8 onward): every picture in art/decisions is listed in DEC_ART.
test("every decision picture is used by the game", () => {
  const dir = path.join(root, "public/art/decisions"), jsx = fs.readFileSync(path.join(root, "game/seat-of-power.jsx"), "utf8");
  const ids = fs.readdirSync(dir).filter(f => f.endsWith(".webp")).map(f => f.replace(/\.webp$/, ""));
  assert.ok(ids.length >= 26, "Pack 8 is in (" + ids.length + ")");
  const listed = (jsx.match(/const DEC_ART = new Set\(\[([^\]]*)\]\)/) || [])[1] || "";
  assert.deepEqual(ids.filter(id => !listed.includes('"' + id + '"')), []);
});

// Pack 18, the Federal Government: every picture is in the game (moods by their base portrait).
test("every Pack 18 picture is used by the presidency", () => {
  const sys = fs.readdirSync(path.join(root, "game/systems")).map(f => fs.readFileSync(path.join(root, "game/systems", f), "utf8")).join("\n");
  const all = src + sys;
  const fed = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.basename(f, ".webp"))
    .filter(n => /^(f_|nb_)/.test(n) || /^(fct-minister|finance-minister|petroleum-minister|defence-minister|attorney-general|national-security-adviser|presidential-chief-of-staff|speaker-of-the-house|labour-leader|oil-community-leader)(-pleased|-angry)?$/.test(n)
      || ["abuja-skyline", "bill-assent", "campus-shut", "executive-order-signing", "federal-project-commissioning", "labour-strike", "port-congestion", "presidential-media-chat", "veto-override", "assent-pen", "executive-order-folder", "federation-account-ledger", "national-id-card"].includes(n));
  assert.equal(fed.length, 95, "95 pictures in Pack 18 (" + fed.length + ")");
  assert.deepEqual(fed.filter(n => !all.includes(n.replace(/-(pleased|angry)$/, "")) && !all.includes(n)), []);
});
// Pack 19: the round icons on the trip letters' buttons, and Defence Headquarters.
test("every Pack 19 picture is used", () => {
  ["icons/trip-jet", "icons/trip-foreign-minister", "icons/trip-vice-president", "icons/trip-deputy-governor", "icons/trip-envoy", "scenes/defence-headquarters"].forEach(f => {
    assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f);
    assert.ok(src.includes(f), f + " is used");
  });
});
// Pack 20: the red wax seal, the SBS, the war room and the anti-graft chairmen.
test("every Pack 20 picture is used", () => {
  const bk = fs.readFileSync(path.join(root, "game/systems/bakunda.js"), "utf8"), all = src + bk;
  ["icons/seal-bakunda", "scenes/sbs-raid", "scenes/bakunda-war-room"].forEach(f => { assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f); assert.ok(all.includes(path.basename(f)), f + " is used"); });
  ["efcc", "icpc"].forEach(a => ["", "-pleased", "-angry"].forEach(m => assert.ok(fs.existsSync(path.join(root, "public/art/characters", a + "-chairman" + m + ".webp")), a + m)));
  ["-chairman.webp", "-chairman-pleased.webp", "-chairman-angry.webp"].forEach(t => assert.ok(src.includes('c.agency + "' + t) || src.includes('agc.agency + "' + t), t + " is used for both agencies"));
});
// Pack 22: the ribbon-cuttings and the road to Aso Rock.
test("every Pack 22 picture is used", () => {
  ["scenes/ribbon-road", "scenes/ribbon-hospital", "scenes/ribbon-school", "scenes/ribbon-bridge", "scenes/ribbon-water", "scenes/ribbon-market", "scenes/ribbon-cut", "scenes/aso-rock-arrival", "scenes/president-meets-governor", "objects/ceremonial-scissors", "icons/icon-visit-president"].forEach(f => {
    assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f);
    assert.ok(src.includes(path.basename(f)), f + " is used");
  });
});
// Pack 23: the Junketer badge.
test("the Junketer badge has its art, and every career badge has a picture", async () => {
  const C = await import("../game/systems/career.js");
  const m = src.match(/const BADGE_ART = (\{[^}]*\})/); assert.ok(m);
  const art = Function("return " + m[1])();
  C.careerBadges([]).forEach(b => { assert.ok(art[b.id], b.id + " has art"); assert.ok(fs.existsSync(path.join(root, "public/art/badges", art[b.id] + ".webp")), art[b.id]); });
});
// Pack 24: strikes, the roundtable, and building in Nigeria. Every picture, in every mood, is used.
test("every Pack 24 picture is used", () => {
  const scenes = ["labour-roundtable", "nlc-march", "airport-grounded", "grid-control-room-dark", "soldiers-substation", "endasuu-protest", "empty-lecture-hall", "cbn-printing-press", "market-inflation", "kidnap-camp-empty", "sit-at-home-street", "creeks-gunboat", "omo-onile-site", "palace-mat-north", "palace-mat-south", "midnight-visitor", "committee-room", "japa-departure"].map(n => "scenes/" + n);
  const people = ["nlc-president", "asuu-president", "labour-minister", "labour-minister-male", "student-leader", "manufacturers-rep", "ex-militant-general", "omo-onile-leader", "cabal-chief", "contractor-japa"];
  const chars = people.flatMap(n => [n, n + "-pleased", n + "-angry"]).map(n => "characters/" + n);
  const rest = ["mou-document", "red-union-cap", "mobilisation-cheque", "diesel-jerrycan", "printed-naira"].map(n => "objects/" + n).concat(["icon-roundtable", "icon-strike", "icon-lga-tour", "icon-councils", "icon-labour-ministry"].map(n => "icons/" + n));
  const all = [...scenes, ...chars, ...rest];
  assert.equal(all.length, 58);
  all.forEach(f => assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f + " is installed"));
  // A character's moods are built in code (name + "-pleased"/"-angry"), so the base name and each mood's use is checked.
  const used = (f) => { const b = path.basename(f); if (src.includes(b)) return true; const m = b.match(/^(.*)-(pleased|angry)$/); return !!m && src.includes(m[1]) && new RegExp('"-' + m[2] + '"|-' + m[2] + '\\.webp|"' + m[2] + '"').test(src); };
  assert.deepEqual(all.filter(f => !used(f)), []);
});
// The councils and trade pack: seals, chambers, the economic team, trade and export scenes.
test("every councils and trade picture is used", () => {
  const all = ["seal-fec", "seal-nsc", "seal-eac", "seal-exco", "seal-rulers", "seal-econ", "icon-trade", "icon-exports", "icon-reserves", "icon-food-prices"].map(n => "icons/" + n)
    .concat(["council-table-federal", "council-table-security", "council-table-state", "council-table-palace"].map(n => "backgrounds/" + n))
    .concat(["deep-seaport", "dry-port-kano", "cargo-rail", "export-containers", "aflatoxin-lab", "border-smuggling", "bdc-street", "factory-closed"].map(n => "scenes/" + n))
    .concat(["trade-minister", "customs-comptroller", "farmers-association-chair"].flatMap(n => [n, n + "-pleased", n + "-angry"]).concat(["exporter", "chief-economic-adviser", "chief-of-defence-staff", "dss-director-general"]).map(n => "characters/" + n));
  assert.equal(all.length, 35);
  all.forEach(f => assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f + " is installed"));
  const used = (f) => { const b = path.basename(f); if (new RegExp('["/]' + b + '(["\\.]|-pleased|-angry)|"' + b + '"').test(src)) return true; const m = b.match(/^(.*)-(pleased|angry)$/); return !!m && src.includes('"./art/characters/' + m[1] + '" + mood(') && src.includes('"-' + m[2] + '"'); };
  assert.deepEqual(all.filter(f => !used(f)), []);
});
// The trade-with-neighbours pack (docs/LOVABLE-INTERSTATE.md): 21 images, all used.
test("every trade-with-neighbours image is used", () => {
  const names = ["scenes/mou-signing-governors", "scenes/interstate-checkpoint", "scenes/interstate-highway", "scenes/joint-project-site", "scenes/border-market", "scenes/boundary-clash", "backgrounds/neighbour-government-house",
    ...["", "-pleased", "-angry"].flatMap(m => ["characters/neighbour-governor-male" + m, "characters/neighbour-governor-female" + m]), "characters/commerce-commissioner", "characters/truckers-union-leader", "characters/truckers-union-leader-angry",
    "icons/icon-neighbours", "icons/icon-deal-supply", "icons/icon-deal-market", "icons/icon-deal-joint", "icons/icon-deal-security"];
  assert.equal(names.length, 21);
  assert.deepEqual(names.filter(n => !fs.existsSync(path.join(root, "public/art", n + ".webp"))), [], "all 21 are installed");
  assert.deepEqual(names.filter(n => !src.includes(path.basename(n) + '"')), [], "all 21 are used");
});
// The two jets for flights during a strike (docs/LOVABLE-STRIKES-IMPEACH.md §1).
test("the military and private jets are installed and fly", () => {
  ["military-jet-side", "private-jet-side"].forEach(n => { assert.ok(fs.existsSync(path.join(root, "public/art/objects", n + ".webp")), n); assert.ok(src.includes(n), n + " is used"); });
});
// Pack 25: strikes, flights and the impeachment (docs/LOVABLE-STRIKES-IMPEACH.md). Lovable's own jets were not used:
// the jets came in their own pack (above).
test("every pack 25 picture is installed and used", () => {
  const names = ["characters/state-pilot", "characters/union-picket-leader", "icons/icon-impeach", "icons/icon-strike", "objects/ghana-must-go-bag", "objects/impeachment-notice",
    "scenes/ag-on-television", "scenes/airbase-tarmac", "scenes/aso-rock-midnight-deal", "scenes/assembly-sealed", "scenes/emergency-streets", "scenes/ghana-must-go", "scenes/private-terminal",
    "scenes/secretariat-locked", "scenes/senate-investigation-news", "scenes/site-picketed", "scenes/tribunal-chamber"];
  assert.equal(names.length, 17);
  assert.deepEqual(names.filter(n => !fs.existsSync(path.join(root, "public/art", n + ".webp"))), []);
  assert.deepEqual(names.filter(n => !src.includes(path.basename(n))), []);
});
// Pack 26: diplomacy (docs/LOVABLE-DIPLOMACY.md): 16 pictures, all used.
test("every pack 26 picture is installed and used", () => {
  const names = ["characters/foreign-head-of-government", "characters/un-secretary-general", "characters/vice-president-nigeria", "icons/icon-diplomacy", "icons/seal-diplomacy",
    "scenes/deal-signing-abroad", "scenes/un-corridor-deal", "scenes/un-general-assembly", ...["abudhabi-national-day", "delhi-diwali", "munich-oktoberfest", "ottawa-canada-day", "rio-carnival", "seoul-lanterns", "stockholm-midsummer", "tokyo-blossoms"].map(x => "scenes/fest-" + x)];
  assert.equal(names.length, 16);
  assert.deepEqual(names.filter(n => !fs.existsSync(path.join(root, "public/art", n + ".webp"))), []);
  assert.deepEqual(names.filter(n => !src.includes(path.basename(n))), []);
});
// Pack 27: the UN badge and London (docs/LOVABLE-DIPLOMACY-2.md).
test("the UN badge and London's Westminster are installed and used", () => {
  ["badges/badge-un-general-assembly", "scenes/london-westminster"].forEach(n => { assert.ok(fs.existsSync(path.join(root, "public/art", n + ".webp")), n); assert.ok(src.includes(path.basename(n)), n + " is used"); });
});

// The cabinet and federation pack (governing with friends): all 20 pictures are used.
test("every cabinet and federation picture is used", () => {
  const files = ["scenes/cabinet-swearing-in", "scenes/minister-swearing-in", "scenes/assembly-screening", "scenes/senate-screening", "scenes/exco-budget-council", "scenes/cabinet-share-card",
    "scenes/private-offer-envelope", "scenes/minister-op-ed", "scenes/cabinet-primary", "scenes/governors-forum-vote", "scenes/federal-grant-arrives", "scenes/federal-project-site",
    "objects/nomination-letter", "objects/brown-envelope", "icons/icon-cabinet-friends", "icons/icon-federation", "icons/icon-remind",
    "characters/works-commissioner", "characters/social-commissioner", "characters/works-power-minister"];
  files.forEach(f => assert.ok(fs.existsSync(path.join(root, "public/art", f + ".webp")), f + " is shipped"));
  assert.deepEqual(files.filter(f => !src.includes(path.basename(f))), []);
});

// Pack 28: the lenders, the tranches and the IMF.
test("every lender, tranche and IMF picture is used", () => {
  const names = { icons: ["seal-bank", "seal-bond", "seal-dfi", "seal-contractor", "seal-exim", "seal-fund"],
    objects: ["payment-order", "tranche-schedule", "mission-report", "contractor-bill", "court-payment-order", "letter-of-intent", "floating-naira"],
    characters: ["bank-relationship-manager", "bond-trustee", "mission-leader", "imf-mission-chief", "exim-banker"],
    scenes: ["tranche-signing", "site-idle-unsigned", "mission-site-visit", "lender-suspends", "imf-negotiations", "students-march-imf", "petrol-price-jump", "sovereignty-restored", "imf-walkout"] };
  const all = src + fs.readFileSync(path.join(root, "game/systems/finance.js"), "utf8");
  Object.entries(names).forEach(([d, ns]) => ns.forEach(n => {
    assert.ok(fs.existsSync(path.join(root, "public/art", d, n + ".webp")), d + "/" + n + " shipped");
    assert.ok(all.includes('"' + n + '"') || all.includes("/" + n + ".webp"), d + "/" + n + " referenced");
  }));
  assert.equal(Object.values(names).flat().length, 27);
});
