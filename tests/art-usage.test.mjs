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
// Stamps are loaded by name (SOP_stamp("approved") → stamp-approved), so check the names.
test("every stamp, the pen and the bill page are used", () => {
  const files = fs.readdirSync(path.join(root, "public/art/objects")).filter(f => /^(stamp-|governor-signature-pen|bill-paper-blank)/.test(f)).map(f => f.replace(/\.webp$/, ""));
  assert.equal(files.length, 11, "the stamps pack has 11 images");
  const unused = files.filter(f => f.startsWith("stamp-") ? !new RegExp("(SOP_stamp|stamp|StampOnce)\\(?[^\\n]{0,40}[\"']" + f.slice(6) + "[\"']").test(src) && !src.includes('"' + f.slice(6) + '"') : !src.includes(f));
  assert.deepEqual(unused, []);
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
