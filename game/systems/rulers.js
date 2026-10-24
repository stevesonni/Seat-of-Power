/* Traditional rulers. Each year one of the council's rulers brings a matter to
   the governor: a request for his domain, a dispute between communities, a
   vacant stool, public criticism, or (in an election year) whose side he will
   be on. Every answer moves his relationship with you, and through him the
   mood of his zone. All people are fictional. */

// Which zone (0 north, 1 central, 2 south) a ruler's domain belongs to.
export const rulerZone = (ruler, i) => (i == null ? Number(String(ruler.id).replace(/\D/g, "")) || 0 : i) % 3;

// The ruler who writes this year: the most aggrieved first, else in turn.
export const rulerPick = (council, turn) => {
  const rs = (council && !council.dissolved && council.rulers) || [];
  if (!rs.length) return null;
  const cold = rs.filter(r => r.rel < 40).sort((a, b) => a.rel - b.rel)[0];
  return cold || rs[(turn * 7) % rs.length];
};

// The matter for this year. ctx: { turn, electionYear, community, lga }.
// Each option: label, fx (state effects), debt (₦B cost), dz (zone mood), rel
// (change in this ruler's relationship), log, and the result card.
export const rulerMatter = (ruler, ctx, r = Math.random) => {
  const n = ruler.name, lga = ctx.lga || "his domain", comm = ctx.community || ["Oke-Ado", "Igbo-Ora"];
  if (ruler.rel < 40) return {
    kind: "criticism", title: n + " has denounced you in public",
    brief: "At the royal festival, before thousands, " + n + " said Government House has forgotten " + lga + ". The clip is everywhere.",
    options: [
      { label: "Visit the palace and make peace", debt: .1, rel: 25, dz: 2, fx: { app: 1 }, log: "visited the palace and made peace", res: ["Peace at the palace", n + " received you with drummers. He will speak well of you now.", "good"] },
      { label: "Ignore it", rel: -5, dz: -3, fx: { app: -1 }, log: "ignored the criticism", res: ["The criticism stands", "His people hear only his side. The zone cools on you.", "bad"] },
      { label: "Withdraw his staff of office", rel: -40, dz: -6, fx: { app: -4, pStab: 1 }, log: "withdrew his staff of office", res: ["You took his staff", "Your loyalists cheer. His people march, and the courts will hear of it.", "bad"] },
    ] };
  if (ctx.electionYear) {
    if (ruler.rel >= 50) return {
      kind: "endorse", title: n + " offers you his blessing",
      brief: "Elections are near. " + n + " will host you at the festival and bless your candidacy before his people.",
      options: [
        { label: "Attend the festival yourself", debt: .2, rel: 10, dz: 5, fx: { app: 2 }, log: "attended the festival and received his blessing", res: ["Blessed before the people", "The crowd saw their ruler raise your hand. That is worth votes.", "good"] },
        { label: "Send your deputy", rel: -3, dz: 1, fx: {}, log: "sent the deputy to the festival", res: ["A polite blessing", "Your deputy was received; the people noticed you were not there.", "neutral"] },
      ] };
    return {
      kind: "endorse_opp", title: n + " is hosting the opposition candidate",
      brief: "Relations are cold, and the opposition noticed. Their candidate will be at " + n + "'s festival next week.",
      options: [
        { label: "Win him back with a visit and gifts", debt: .3, rel: 20, dz: 2, fx: { cor: .01 }, log: "won him back with a visit and gifts", res: ["He hedges his bets", "He receives both of you now. Better than receiving only them.", "neutral"] },
        { label: "Let it go", rel: -5, dz: -4, fx: { app: -1 }, log: "let the opposition have his festival", res: ["The opposition's day", "He raised their candidate's hand before his people.", "bad"] },
      ] };
  }
  const kinds = ["request", "dispute", "coronation"];
  const kind = kinds[(ctx.turn + Math.floor(r() * 3)) % 3];
  if (kind === "request") {
    const what = ["a borehole and a health post", "the road to the palace market", "a secondary school for girls", "street lights on the market road"][Math.floor(r() * 4)];
    return {
      kind, title: n + " asks for " + what,
      brief: "A royal delegation brought the request to Government House: " + what + " for " + lga + ". His chiefs are waiting for an answer.",
      options: [
        { label: "Approve it", debt: .3, rel: 20, dz: 3, fx: { app: 1 }, log: "approved " + what + " for " + lga, res: ["Work starts in " + lga, what.charAt(0).toUpperCase() + what.slice(1) + " for " + lga + ". The palace sends its thanks.", "good"] },
        { label: "Promise it for next year", rel: -5, dz: 0, fx: {}, log: "promised it for next year", res: ["A promise, for now", "His chiefs leave politely. They will remember the date.", "neutral"] },
        { label: "Decline", rel: -15, dz: -2, fx: {}, log: "declined the request", res: ["Request declined", "The delegation leaves without a word. " + lga + " takes it as a slight.", "bad"] },
      ] };
  }
  if (kind === "dispute") return {
    kind, title: "Two communities are fighting over farmland near " + lga,
    brief: comm[0] + " and " + comm[1] + " both claim the same farmland. " + n + " has ruled for " + comm[0] + "; " + comm[1] + " refuses, and there have been clashes.",
    options: [
      { label: "Back the ruler's judgment", rel: 10, dz: 1, fx: { app: -1, sec: -.01 }, log: "backed the ruler's judgment", res: ["You backed the palace", comm[0] + " keeps the land. " + comm[1] + " says the state took sides.", "neutral"] },
      { label: "Set up a boundary commission", debt: .15, rel: -5, dz: 2, fx: { app: 2, sec: .01 }, log: "set up a boundary commission", res: ["Surveyors on the land", "Both sides wait for the survey. The fighting stops.", "good"] },
      { label: "Send in the police", rel: -10, dz: -2, fx: { app: -2, sec: .02 }, log: "sent in the police", res: ["Police hold the farmland", "Quiet, but nobody is farming it. The palace feels bypassed.", "bad"] },
    ] };
  return {
    kind: "coronation", title: "A stool is vacant in " + lga,
    brief: "A chief under " + n + " has died. The kingmakers chose a prince; your party's local leaders want another man. The appointment is yours to approve.",
    options: [
      { label: "Approve the kingmakers' choice", rel: 15, dz: 2, fx: { pStab: -2 }, log: "approved the kingmakers' choice", res: ["Tradition respected", "The palace is pleased. Your local party men are not.", "good"] },
      { label: "Approve the party's man", rel: -25, dz: -3, fx: { pStab: 3, app: -2 }, later: { app: -2, desc: "The ruling house is in court over the chieftaincy you handed to a party man." }, log: "installed the party's candidate", res: ["The party's man is crowned", "The ruling house goes to court. The party is delighted.", "bad"] },
      { label: "Let the courts decide", rel: -5, dz: 0, fx: { app: 1 }, log: "left it to the courts", res: ["Left to the courts", "No one is crowned this year. Nobody blames you much.", "neutral"] },
    ] };
};

// The year's drift: warm rulers lift their zone, cold ones pull it down.
export const councilDrift = (council) => {
  const dz = {};
  ((council && !council.dissolved && council.rulers) || []).forEach((r, i) => {
    const z = rulerZone(r, i), d = r.rel >= 65 ? 1 : r.rel < 40 ? -2 : 0;
    if (d) dz[z] = (dz[z] || 0) + d;
  });
  return dz;
};
