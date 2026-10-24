/* The game's rules that do not depend on the screen: plain functions over
   plain data, so they can be tested in Node (tests/) and shared by every
   screen. The game reads them as window.SOP_SYS (set in main.js). */
export * from "./money.js";
export * from "./advisers.js";
export * from "./agenda.js";
export * from "./rng.js";
export * from "./cases.js";
export * from "./deputy.js";
export * from "./projects.js";
export * from "./senate.js";
export * from "../../server/company-name.mjs";
export * from "./loans.js";
export * from "./proposals.js";
export * from "./ministries.js";
export * from "./deposits.js";
export * from "./voice.js";
export * from "./treasury.js";
export * from "./chief.js";
export * from "./results.js";
export * from "./rulers.js";
export * from "./daily.js";
export * from "./career.js";
