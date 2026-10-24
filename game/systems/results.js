/* Concrete results: what was actually built, bought or done, and where.
   A report that says "Peace & Security delivered" tells the player nothing;
   these say which road, how many guards, in which local government. All
   numbers are the game's own planning figures. r is a seeded random (0–1). */

const pick = (a, r) => a[Math.floor(r() * a.length) % a.length];
const fmtN = (n) => Math.round(n).toLocaleString("en-GB");

// This year's share of each flagship promise: { what, where } for one year (1–4 of a term).
// lgas: the state's local governments; districts: [north, central, south] lists of them.
export const flagshipDeliverable = (agenda, year, districts, r = Math.random) => {
  const zi = (year - 1) % 3, ds = districts[zi] && districts[zi].length ? districts[zi] : districts.flat();
  const a = pick(ds, r) || "the state", b = pick(ds.filter(x => x !== a), r) || a;
  const zone = ["North", "Central", "South"][zi];
  const D = {
    infrastructure: () => year <= 3 ? "the " + a + "–" + b + " trunk road in the " + zone + " district (" + (28 + Math.round(r() * 30)) + " km, dualised)" : "street lights and drainage along all three trunk roads",
    education: () => fmtN(30) + " primary schools in " + a + " and " + b + " rebuilt: roofs, desks, toilets and " + (90 + Math.round(r() * 60)) + " new teachers",
    health: () => (8 + Math.round(r() * 4)) + " primary health centres reopened in the " + zone + " district, with nurses, drugs and a cold chain for vaccines",
    security: () => fmtN(500) + " community guards trained and equipped in " + a + ", " + b + " and nearby councils, with " + (12 + Math.round(r() * 8)) + " patrol vans",
    agriculture: () => fmtN(1250) + " hectares irrigated around " + a + ", with a pumping station and " + fmtN(800 + r() * 600) + " farmers on the scheme",
    anticorruption: () => year === 1 ? "every contract above ₦50M published online, with the winning bid and the losers" : (2 + Math.round(r() * 4)) + " officials charged after the published contracts showed padded prices",
    youth: () => fmtN(2500) + " young people trained in " + pick(["solar installation", "coding", "tailoring and fashion", "auto mechanics", "agro-processing"], r) + " and placed with employers in " + a,
    women: () => fmtN(5000) + " more girls enrolled in " + a + " and " + b + ", with free uniforms and a monthly stipend to their mothers",
    technology: () => "50 public schools in the " + zone + " district connected to broadband, with a computer lab in each",
    housing: () => fmtN(250) + " low-cost homes handed over at the " + a + " estate, with water and power connected",
  };
  return (D[agenda] || (() => "this year's share of the programme in " + a))();
};

// What a commissioner did with extra money (₦M), by ministry, when they delivered or did not.
const KIND = (id, key) => ({ health: "hp", educ: "lit", agric: "agr", works: "infra", sec: "sec" })[id] || key || "any";
export const ministryResult = (m, ok, amountM, lga, r = Math.random) => {
  const k = KIND(m.id, m.key), who = "Hon. " + m.minister;
  const W = {
    hp: () => ok ? (3 + Math.round(r() * 4)) + " health centres in " + lga + " restocked with drugs; " + fmtN(6000 + r() * 6000) + " children vaccinated" : "the drugs were bought, but " + lga + "'s clinics still have no nurses to give them",
    lit: () => ok ? (24 + Math.round(r() * 20)) + " classrooms re-roofed in " + lga + " and " + fmtN(1500 + r() * 1500) + " pupils back at their desks" : "the desks arrived in " + lga + "; the classrooms they were meant for are still roofless",
    agr: () => ok ? fmtN(1000 + r() * 1500) + " farmers in " + lga + " got seed, fertiliser and tractor hire; the harvest is up" : "the fertiliser reached " + lga + " two months after planting",
    infra: () => ok ? (12 + Math.round(r() * 14)) + " km of road in " + lga + " resurfaced and the stalled bridge finished" : "the contractor in " + lga + " was paid and left the bridge half-built",
    sec: () => ok ? (6 + Math.round(r() * 6)) + " patrol vans on the " + lga + " highway; kidnappings there fell" : "the patrol vans are parked in " + lga + " without fuel",
    igr: () => ok ? "a new collection system in " + lga + " that brings in more every month" : "consultants were paid; collection in " + lga + " did not change",
    any: () => ok ? "the stalled work in " + lga + " restarted and finished" : "the work in " + lga + " is still stalled",
  };
  return who + " (" + m.name + ") used the ₦" + amountM + "M: " + (W[k] || W.any)() + ".";
};
// A short line for the yearly cabinet report, from performance (0–100).
export const ministryYear = (m, lga, r = Math.random) => {
  const p = m.perf || 50, ok = p >= 55;
  const line = ministryResult(m, ok, 0, lga, r).replace(/ used the ₦0M: /, ": ");
  return { ok, strong: p >= 70, line: p < 40 ? "Hon. " + m.minister + " (" + m.name + ") missed every target this year." : line };
};

// A council election in every local government. lean: [north, central, south]
// mood (positive helps you); home: the governor's own LGA. Returns each council with your share.
export const councilVote = (districts, lean, r = Math.random, home = null) => {
  const out = [];
  districts.forEach((ls, zi) => ls.forEach(lga => {
    const share = Math.max(20, Math.min(80, 50 + (lean[zi] || 0) * 2.2 + (r() * 24 - 12) + (lga === home ? 15 : 0))); // your home LGA leans your way
    out.push({ lga, zone: zi, share: Math.round(share) });
  }));
  const won = out.filter(x => x.share >= 50), lost = out.filter(x => x.share < 50);
  const close = lost.filter(x => x.share >= 43);
  return { all: out, won, lost, close };
};
