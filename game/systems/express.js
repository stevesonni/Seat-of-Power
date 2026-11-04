/* The short start (pillar "start"): the campaign as three big moments, then the oath.
   1. The godfather's deal: money now, a debt later.
   2. One rally: where you hold the last big rally of the campaign.
   3. Election night: the count comes in district by district, live.
   Under 400 words from the title screen to the oath. Rules only, no React. */
import { seeded } from "./rng.js";

export const DEAL = { t: "{gf} will pay for your campaign", d: "Posters, buses and agents in every polling unit. He will want it back, with interest, once you win.",
  opts: [
    { id: "all", l: "Take all of it (₦1.2B)", out: "The money arrives in sacks. So does his first list of names.", loanB: 1.2, chest: 2, favours: .06, swing: 3 },
    { id: "half", l: "Take half (₦600M)", out: "Enough to compete. He smiles, and remembers the half you refused.", loanB: .6, chest: 1.4, favours: .03, swing: 2 },
    { id: "none", l: "Refuse: run on your own money", out: "He shrugs. His people stay home on election day.", loanB: 0, chest: .8, favours: 0, swing: 0 },
  ] };
export const RALLY = { t: "Your last big rally", d: "One week to go. You can fill one stadium. Where?",
  opts: [
    { id: "home", l: "Your home district", out: "A homecoming. Your own people come out in thousands.", zone: "home", swing: 2 },
    { id: "opp", l: "Your opponent's heartland", out: "Brave. Half the crowd boos, half of them listen.", zone: "opp", swing: 0, gamble: 5 },
    { id: "market", l: "The capital's biggest market", out: "Traders, okada riders, market women: the swing voters.", zone: "swing", swing: 3 },
  ] };
/* Election night: each district's share for you, and the result. seed: per game. */
export const electionNight = (seed, { deal = "half", rally = "market", homeDistrict = 1, forceWin = false } = {}) => {
  const D = DEAL.opts.find(o => o.id === deal) || DEAL.opts[1], R = RALLY.opts.find(o => o.id === rally) || RALLY.opts[2], r = seeded(seed, "night", deal, rally);
  const gamble = R.gamble ? (r() < .55 ? R.gamble : -R.gamble) : 0;
  const mood = r() * 10 - 5; // the year's national mood, the same in every district
  const shares = [0, 1, 2].map(i => { let v = 46.5 + D.swing + mood + (r() * 6 - 3); if (i === homeDistrict) v += 6 + (R.zone === "home" ? R.swing * 2 : 0); else if (R.zone === "opp" && i === (homeDistrict + 1) % 3) v += gamble * 2; else if (R.zone === "swing") v += R.swing; return Math.round(Math.max(30, Math.min(72, v)) * 10) / 10; });
  const voters = [0, 1, 2].map(i => Math.round(380000 + seeded(seed, "voters", i)() * 260000));
  const count = () => voters.map((n, i) => Math.round(n * shares[i] / 100));
  let you = count();
  for (let k = 0; forceWin && k < 40 && you.reduce((a, b) => a + b, 0) * 2 <= voters.reduce((a, b) => a + b, 0) + 2000; k++) { shares.forEach((v, i) => { shares[i] = Math.round(Math.min(72, v + 1) * 10) / 10; }); you = count(); }
  const opp = voters.map((n, i) => n - you[i]);
  const tot = you.reduce((a, b) => a + b, 0), totO = opp.reduce((a, b) => a + b, 0), marginPct = Math.round((tot - totO) / (tot + totO) * 1000) / 10;
  return { shares, voters, you, opp, won: tot > totO, marginPct, zonesWon: shares.filter(v => v > 50).length, gamble };
};
export const SWORN = "The Chief Judge reads the oath. You repeat it, hand on the book. You are Governor.";
