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
const PACK2 = ["backgrounds/finance-ministry-office", "characters/finance-commissioner", "scenes/"];
test("every money-pack image is used by the game", () => {
  const files = walk(path.join(root, "public/art")).filter(f => f.endsWith(".webp")).map(f => path.relative(path.join(root, "public/art"), f).replace(/\.webp$/, ""));
  const pack2 = files.filter(f => PACK2.some(p => f.startsWith(p)) || /^objects\/(coin|coins-burst|debt-ledger|faac-envelope|igr-receipt|treasury-chest|unpaid-invoices)/.test(f));
  assert.equal(pack2.length, 26, "the money pack has 26 images");
  const unused = pack2.filter(f => !src.includes(path.basename(f)));
  assert.deepEqual(unused, []);
});
