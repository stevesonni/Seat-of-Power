import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// The player asked for the "How it really works" boxes to go, in every office.
test("no 'How it really works' box anywhere: governor, President or the careers", () => {
  const html = fs.readFileSync(new URL("../public/seat-of-power.html", import.meta.url), "utf8");
  assert.ok(!/How it really works ·/.test(html), "the result card has no lesson box");
  const jsx = fs.readFileSync(new URL("../game/seat-of-power.jsx", import.meta.url), "utf8");
  assert.ok(!/["'`]📘 How it really works/.test(jsx));
});
