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
  assert.equal(icons.length, 53, "53 icons (48 + the five office icons)");
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
