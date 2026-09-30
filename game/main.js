/* Entry for the precompiled game bundle (public/sop-app.js).

   Replaces the three CDN scripts the page used to load (React UMD,
   ReactDOM UMD, Babel standalone) and the in-browser JSX compile.

   1. React / ReactDOM 18.2 are bundled and published as window.React and
      window.ReactDOM, exactly like the UMD builds did — sop-realism.js and
      the game itself read them as globals.
   2. The game script runs on DOMContentLoaded, as it did under Babel
      standalone, so the sop-*.js overlays have finished booting (including
      their own DOMContentLoaded hooks) before the game's top-level code and
      first render run. */
import * as React from "react";
import * as ReactDOM from "react-dom";
import startGame from "./seat-of-power.jsx";

window.React = React;
window.ReactDOM = ReactDOM;

if (document.readyState === "complete") startGame();
else document.addEventListener("DOMContentLoaded", startGame, { once: true });
