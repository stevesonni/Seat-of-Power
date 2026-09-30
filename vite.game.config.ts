/* Builds the running game (public/seat-of-power.html) ahead of time.

   The page used to pull React, ReactDOM and Babel standalone from a CDN and
   compile ~6,400 lines of JSX in the browser on every load. This config
   compiles game/seat-of-power.jsx with esbuild and bundles React 18.2 locally
   into one classic script, public/sop-app.js, which the page loads after the
   sop-*.js overlays.

   Run with: bun run build:game   (also runs as part of dev and build)

   The game stays on React 18.2 (the version the CDN served) through the
   react18 / react-dom18 aliases; the TanStack shell keeps its own React. */
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/* game/seat-of-power.jsx is the script body that used to sit in the page's
   <script type="text/babel"> tag, kept verbatim. Wrap it in an exported
   function so main.js decides when it runs (the bundler would otherwise
   evaluate it immediately). Top-level declarations become function-scoped,
   which is what they already were inside Babel's module script. */
function wrapGameScript(): Plugin {
  return {
    name: "sop-wrap-game-script",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith("/game/seat-of-power.jsx")) return null;
      return { code: `export default function startGame() {\n${code}\n}\n`, map: null };
    },
  };
}

export default defineConfig({
  configFile: false,
  plugins: [wrapGameScript()],
  publicDir: false,
  resolve: {
    alias: [
      { find: /^react$/, replacement: r("./node_modules/react18/index.js") },
      { find: /^react-dom$/, replacement: r("./node_modules/react-dom18/index.js") },
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  esbuild: {
    // Classic runtime, same as Babel's preset-react: JSX becomes
    // React.createElement against the game's own `const React = window.React`.
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    copyPublicDir: false,
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    reportCompressedSize: true,
    lib: {
      entry: r("./game/main.js"),
      formats: ["iife"],
      name: "SOP_APP",
      fileName: () => "sop-app.js",
    },
  },
});
