/* The game's rules that do not depend on the screen: plain functions over
   plain data, so they can be tested in Node (tests/) and shared by every
   screen. The game reads them as window.SOP_SYS (set in main.js). */
export * from "./money.js";
export * from "./advisers.js";
export * from "./agenda.js";
