#!/usr/bin/env node
/* Install the project reels made with Gemini (docs/GEMINI-REELS.md).
   node tools/install-reels.mjs <folder> [--from <seconds>] [--speed <x>]
   --from skips the start of each film; --speed plays it faster (1.5 fits six seconds of film into four).
   Each <type>.mp4 or <type>-2.mp4 in the folder (any common video format) is trimmed to 4 seconds, scaled to
   1280 wide, sound removed, compressed for phones (H.264, fast start) and written to public/art/reels/. Then the
   counts in REELS (game/systems/projects.js) are updated. Files whose name is not a project type are skipped. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as SYS from "../game/systems/index.js";
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? +args[i + 1] : d; };
const from = opt("from", 0), speed = opt("speed", 1), src = args.find(a => !a.startsWith("--") && isNaN(+a)); if (!src || !fs.existsSync(src)) { console.error("Usage: node tools/install-reels.mjs <folder>"); process.exit(1); }
const out = new URL("../public/art/reels/", import.meta.url).pathname; fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(src)) {
  const m = f.match(/^([a-z]+)(?:-(\d))?\.(mp4|mov|webm|mkv)$/i); if (!m) { console.log("skip " + f); continue; }
  const type = m[1].toLowerCase(), n = +(m[2] || 1); if (!SYS.UNIT[type]) { console.log("skip " + f + " (not a project type)"); continue; }
  const name = type + (n > 1 ? "-" + n : "") + ".mp4", dst = path.join(out, name);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(from), "-i", path.join(src, f), "-an", "-vf", "setpts=PTS/" + speed + ",scale=1280:-2,fps=24", "-t", "4", "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "slow", "-movflags", "+faststart", dst]);
  console.log("installed " + name + " (" + Math.round(fs.statSync(dst).size / 1024) + " KB)");
}
// The counts: road.mp4 and road-2.mp4 make road: 2 (numbered from 1 with no gaps).
const have = fs.readdirSync(out).filter(f => f.endsWith(".mp4")), counts = {};
for (const t of Object.keys(SYS.UNIT)) { let k = 0; while (have.includes(t + (k ? "-" + (k + 1) : "") + ".mp4")) k++; if (k) counts[t] = k; }
const pj = new URL("../game/systems/projects.js", import.meta.url).pathname;
fs.writeFileSync(pj, fs.readFileSync(pj, "utf8").replace(/export const REELS = \{[^}]*\};/, "export const REELS = " + JSON.stringify(counts).replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ") + ";"));
console.log("REELS = " + JSON.stringify(counts));
