/* Headscratchers: slow problems for the LGA Chairman, the Senator and the
   Ambassador (rules only, no React). Each is modelled on something that
   really happened somewhere in the world (never presented as Nigerian
   history), and none needs a villain: a sensible saving, a missing comma or
   a well-meant bounty is enough.

   An ARC is a short story told across turns. It opens on a turn the run's
   plan chose; each stage is a card; each option moves the career's numbers,
   may set flags, and either ends the arc or schedules the next stage a turn
   or two later. Some arcs hide a TRUTH, rolled when the run starts (was it
   the vaccine? is the software wrong?), which only a choice that looks can
   reveal. Leaving a stage to your staff takes its "ignore" option, which is
   usually the fuse burning down. What you prepared earlier (the host's
   trust, the community's goodwill, the council's purse) changes how a crisis
   plays out. An arc that ends leaves a TAG in the player's record, which
   later offices hear about.

   Numbers per career:
     lga:    fx { people, gov, council, cor }, cost (₦M from the purse), npc { party, cllr }, elec
     senate: fx { home, clout, loyalty, cor, chest (₦B) }
     amb:    fx { abuja, host, diaspora, trade, cor }
   Option flags the careers count: fixed (LGA: a problem solved), law
   (Senate: a law with your name), helped (Ambassador: Nigerians helped). */
import { seeded } from "./rng.js";

/* ── The LGA Chairman ── */
const LGA_ARCS = {
  rats: { nm: "The rat bounty", art: { bg: "village-square", who: "health-worker" },
    where: "Hanoi, 1902: the colonial government paid a bounty for every rat tail. People cut the tails off, let the rats go, and some bred rats for the money.",
    learn: "Councils run refuse disposal and sanitation (Fourth Schedule). Lassa fever spreads from rats, so sealed food stores and cleared refuse are the first defence.",
    left: "the rats in the two wards are still there",
    stages: {
      open: { t: "Lassa fever in two wards", d: "Three people have died of Lassa fever this season. The health officer says rats carry it. {cllr} proposes paying ₦200 for every rat tail brought to the secretariat.", ignore: "leave",
        opts: [
          { id: "bounty", l: "Pay ₦200 a tail", cost: 20, fx: { people: 3 }, npc: { cllr: 6 }, next: "boom", story: "paid a bounty for rat tails", out: "Boys with buckets queue at the secretariat by noon. The radio calls it a smart idea." },
          { id: "clean", l: "Fund a ward clean-up and traps", cost: 45, fx: { people: 2 }, next: "slow", wait: [1, 2], story: "paid for traps and a clean-up instead of a bounty", out: "Traps go out and the refuse is cleared. It is not dramatic, and the councillor says so." },
          { id: "leave", l: "Leave it to the state health ministry", cost: 0, fx: { people: -2 }, next: "spread", out: "The ministry promises leaflets." },
        ] },
      boom: { t: "The tails pour in", clue: "Tails paid for: 9,000. Fever cases: unchanged.", art: { scene: "rat-tails-queue" }, ignore: "keep",
        d: "The treasurer has paid for 9,000 tails in three months, but fever cases have not fallen. A ward officer says boys from the next LGA bring tails too, and some come from rats that are still alive.",
        opts: [
          { id: "inspect", l: "Pay per compound inspected and cleared instead", cost: 35, fx: { people: 2 }, fixed: true, end: "good", tag: "rats_fixed", story: "switched from tails to cleared compounds", out: "Slower, and it ties up the health officers, but by the dry season the fever cases fall." },
          { id: "stop", l: "End the bounty today", cost: 0, fx: { people: -2 }, next: "release", story: "ended the rat bounty overnight", out: "The queue at the secretariat vanishes." },
          { id: "keep", l: "Keep paying: the numbers look good", cost: 30, fx: { cor: .02 }, next: "farm", out: "The tail count climbs again. The treasurer stops asking questions." },
        ] },
      farm: { t: "A rat farm behind the abattoir", art: { scene: "rat-farm" }, ignore: "blame",
        d: "A journalist films a compound breeding rats in cages, for their tails. The video ends on your bounty notice.",
        opts: [
          { id: "stop", l: "End it and hand the breeders to the police", cost: 0, fx: { people: -4 }, next: "release", story: "found the town breeding rats for the bounty", out: "The breeders are arrested. Their cages are empty by the time the police arrive." },
          { id: "blame", l: "Blame the councillor who proposed it", cost: 0, fx: { people: -1, council: -8 }, npc: { cllr: -15 }, next: "release", story: "blamed {cllr} for the rat bounty", out: "{cllr} says the chairman signed every payment. He is right." },
        ] },
      release: { t: "The breeders let their rats go", clue: "More rats than before the bounty.", art: { bg: "rural-health-centre", who: "nurse" }, ignore: "covered",
        d: "With the bounty gone, the breeders opened their cages. The wards have more rats than before it began, and a child is in the isolation ward with fever.",
        opts: [
          { id: "clean", l: "Fund the clean-up and traps now", cost: 55, fx: { people: 3 }, end: "mixed", tag: "rats_cobra", story: "cleaned up after the rat bounty went wrong", out: "It costs more than doing it first would have. The cases fall by the end of the year." },
          { id: "covered", l: "Tell people to keep their food covered", cost: 0, fx: { people: -6 }, elec: -3, end: "bad", tag: "rats_cobra", out: "The fever stays. So does the joke about the chairman who bought rats." },
        ] },
      slow: { t: "The clean-up is slow", art: { bg: "village-square", who: "health-worker" }, ignore: "stay",
        d: "Traps and a monthly clean-up in the two wards. The cases fall, slowly. {cllr} tells the radio you 'did nothing dramatic'.",
        opts: [
          { id: "stay", l: "Keep going: it is working", cost: 15, fx: { people: 4 }, fixed: true, end: "good", tag: "rats_fixed", out: "By the dry season there has not been a new case in six weeks." },
          { id: "add", l: "Add the bounty as well, to look busy", cost: 20, fx: { people: 1 }, next: "boom", out: "The radio likes it. The treasurer opens a new ledger for tails." },
        ] },
      spread: { t: "Lassa reaches the market", art: { bg: "busy-market-street", who: "market-women-group-angry" }, ignore: "close",
        d: "The ministry's leaflets arrived. So did the fever: two traders are in the isolation ward, and the market women want to know what their chairman did.",
        opts: [
          { id: "clean", l: "Fund the clean-up and traps now", cost: 55, fx: { people: 1 }, end: "mixed", tag: "rats_late", out: "The cases fall, months later than they could have." },
          { id: "close", l: "Close the market for fumigation", cost: 10, fx: { people: -5 }, npc: { party: -5 }, end: "mixed", tag: "rats_late", out: "A week without trade. The traders count what it cost them." },
        ] },
    } },

  water: { nm: "The cheaper water", truth: .75, art: { bg: "chairman-office", who: "works-commissioner" },
    where: "Flint, Michigan, 2014: the city switched its water to a river to save money and left out corrosion control. Lead from old pipes got into children's water.",
    learn: "Most piped water is run by state water boards; councils handle boreholes, wells and sanitation. Lead in pipes is invisible: only a laboratory test finds it.",
    left: "nobody has tested what came out of the town's taps",
    stages: {
      open: { t: "Save ₦40M a year on water", art: { scene: "river-intake" }, ignore: "stay",
        d: "The council engineer can switch the town's taps from the state water board to the river intake and save ₦40M a year. The treasurer's draft leaves out the treatment chemicals, 'for now'.",
        opts: [
          { id: "switch", l: "Switch, and skip the chemicals for now", cost: -40, fx: {}, next: "brown", story: "switched the taps to the river to save money", out: "₦40M stays in the purse. The water tastes a little different." },
          { id: "treat", l: "Switch, with full treatment", cost: 0, fx: { people: 1 }, set: { treated: true }, next: "ok", wait: [2, 2], story: "switched to river water with full treatment", out: "The savings go on chemicals. The purse is no richer, but the water is the council's own." },
          { id: "stay", l: "Stay with the state water board", cost: 0, fx: { gov: 2 }, end: "mixed", out: "Nothing changes. The bill stays high, and so does the governor's water board." },
        ] },
      brown: { t: "The water comes out brown", clue: "Complaints about the colour: 140.", art: { bg: "rural-health-centre", who: "nurse", obj: "brown-water-bottles" }, ignore: "deny",
        d: "Residents bring bottles of brown water to the secretariat. The engineer says it is 'only iron, harmless'. The nurse at the Ward 4 clinic has seen eleven children with rashes.",
        opts: [
          { id: "test", l: "Send samples to a laboratory", cost: 15, fx: {}, next: "lab", reveal: true, out: "The samples go to the state hospital's laboratory. Results in a few weeks." },
          { id: "treat", l: "Add the treatment chemicals now", cost: 35, fx: { people: 1 }, end: "mixed", tag: "water_late", out: "The colour clears in a month. Nobody can say what the children drank in the meantime." },
          { id: "back", l: "Switch back to the state board quietly", cost: 40, fx: { people: 1, gov: -2 }, end: "mixed", tag: "water_back", out: "The saving is gone. So is the brown water. The question of what happened is not." },
          { id: "deny", l: "Say the water is safe", cost: 0, fx: { people: -3 }, next: "lead", out: "The engineer goes on the radio. People keep buying sachet water." },
        ] },
      lab: { t: "The laboratory results", art: { bg: "hospital-ward", who: "doctor" }, ignore: ({ truth }) => truth ? "hide" : "publish",
        d: ({ truth }) => truth ? "The lab finds lead: the untreated river water is eating the old pipes. Children in three streets have high levels in their blood." : "The lab finds iron and silt, but no lead. The rashes may have another cause. The colour is still a disgrace.",
        opts: ({ truth }) => truth ? [
          { id: "fix", l: "Treat the water and replace the worst pipes", cost: 90, fx: { people: 4 }, end: "mixed", tag: "water_fixed", fixed: true, out: "It costs more than two years of savings. The children in those streets will be tested every year." },
          { id: "back", l: "Switch back and pay for the children's care", cost: 70, fx: { people: 3, gov: -2 }, end: "mixed", tag: "water_back", out: "The state board takes the town back. The council pays for the doctors." },
          { id: "hide", l: "Keep the report quiet", cost: 0, fx: { cor: .06 }, next: "lead", out: "The report goes into a drawer." },
        ] : [
          { id: "treat", l: "Add treatment anyway, and publish the results", cost: 35, fx: { people: 3 }, end: "good", tag: "water_fixed", fixed: true, out: "The water clears, the results are on the notice board, and the rumours die." },
          { id: "publish", l: "Publish the results and keep the savings", cost: 0, fx: { people: -1 }, end: "mixed", out: "Safe, the results say. Brown, say the bottles." },
        ] },
      lead: { t: "Lead in the children's blood", art: { bg: "tv-studio", who: "doctor-male" }, ignore: "blame",
        d: "A state hospital doctor goes on television: children in your town have lead in their blood, and the river switch was a council decision. {gov} is asking who approved it.",
        opts: [
          { id: "own", l: "Own it: switch back, pay for testing and care", cost: 80, fx: { people: -2, gov: -4 }, end: "bad", tag: "water_poisoned", out: "You stand at the Ward 4 clinic and say it was your decision. Some respect you for it; the mothers do not." },
          { id: "blame", l: "Blame the engineer and sack him", cost: 0, fx: { people: -6, council: -4, cor: .03 }, elec: -5, end: "bad", tag: "water_poisoned", out: "The engineer produces the memo you signed." },
        ] },
      ok: { t: "The river water holds", art: { bg: "village-square", who: "works-commissioner" }, ignore: "skip",
        d: "Full treatment from day one. The taps run clear. The engineer asks for a maintenance budget so it stays that way.",
        opts: [
          { id: "fund", l: "Fund the maintenance", cost: 20, fx: { people: 3 }, end: "good", tag: "water_good", fixed: true, out: "Clear water, a council-run plant, and a line in the budget that keeps it so." },
          { id: "skip", l: "Skip it this year", cost: 0, fx: {}, set: { treated: false }, next: "brown", wait: [1, 1], out: "The chemicals run low by the rainy season." },
        ] },
    } },

  okada: { nm: "Odd and even okadas", art: { bg: "council-chamber", who: "councillor-male" }, excludes: ["okada"],
    where: "Mexico City, 1989: cars were banned on one weekday according to their plate number. Many families bought a second, older car, and the air got no cleaner.",
    learn: "Councils make bye-laws on local matters such as motor parks and where okadas may ride (Fourth Schedule). A bye-law is only as good as how people respond to it.",
    left: "the odd-even rule is still on the books",
    stages: {
      open: { t: "The town centre is gridlocked", art: { scene: "okada-gridlock" }, ignore: "none",
        d: "Okadas jam every junction. {cllr} proposes a rule: plates ending in an odd number ride on Monday, Wednesday and Friday; even numbers on the other days.",
        opts: [
          { id: "rule", l: "Pass the odd-even rule", cost: 5, fx: { people: -1, council: 3 }, npc: { cllr: 5 }, next: "second", story: "passed the odd-even okada rule", out: "Half the okadas vanish on the first Monday. The traffic moves." },
          { id: "lanes", l: "Mark okada lanes and parks instead", cost: 30, fx: { people: 3 }, fixed: true, end: "good", tag: "okada_lanes", story: "marked okada lanes and parks", out: "Paint, signs and two parks by the market. Slower than a ban, and nobody loses a living." },
          { id: "none", l: "Leave the traffic alone", cost: 0, fx: { people: -2 }, end: "mixed", out: "The jams stay. So do the riders' votes." },
        ] },
      second: { t: "Twice as many okadas", clue: "Registered okadas: up 60%.", art: { bg: "busy-market-street", who: "okada-rider" }, ignore: "keep",
        d: "Riders bought second, older bikes with the other number. There are more okadas than before, the old ones smoke, and the council collects two registration fees from every rider.",
        opts: [
          { id: "repeal", l: "Repeal the rule", cost: 0, fx: { people: 1, council: -3 }, npc: { cllr: -8 }, end: "mixed", tag: "okada_repealed", out: "Back where you started, with 2,000 extra old bikes on the road." },
          { id: "cap", l: "Cap the number of okada permits", cost: 10, fx: { people: -4 }, next: "riders", out: "The permit office has a queue round the block." },
          { id: "keep", l: "Keep it: the fees are good money", cost: -25, fx: { people: -3, cor: .02 }, end: "bad", tag: "okada_cobra", out: "The purse is fuller. The air is not." },
        ] },
      riders: { t: "The riders block the secretariat", art: { bg: "street-protest", who: "okada-rider" }, ignore: "permits",
        d: "Riders who lost their permits in the cap say the second-hand bike dealers knew about the rule before they did. Some of the dealers are councillors' relatives.",
        opts: [
          { id: "probe", l: "Investigate the dealers", cost: 10, fx: { people: 4, council: -6 }, npc: { cllr: -10 }, end: "mixed", tag: "okada_probe", out: "Two councillors' brothers sold 800 bikes in the month before the rule. The council is furious with you." },
          { id: "permits", l: "Restore everyone registered before the rule", cost: 0, fx: { people: 3 }, end: "mixed", tag: "okada_repealed", out: "The riders go home. The traffic is worse than when you started." },
        ] },
    } },

  buses: { nm: "Twenty buses", art: { scene: "joint-account-meeting" },
    where: "France, 2014: the rail operator ordered about 2,000 new trains, then found they were too wide for some 1,300 station platforms.",
    learn: "Councils look after local roads and motor parks (Fourth Schedule). A donated asset still has to fit the roads, the drivers and the fuel budget.",
    left: "the governor's buses are still parked at the secretariat",
    stages: {
      open: { t: "Twenty buses from the governor", ignore: "launch",
        d: "{gov} has donated twenty new buses for a 'mass transit' launch in your LGA, with television cameras next week. Each bus is 2.6 metres wide.",
        opts: [
          { id: "launch", l: "Hold the launch on the market road", cost: 5, fx: { gov: 6 }, next: "stuck", story: "launched the governor's buses without measuring the routes", out: "Bunting, a band and a tent for the cameras." },
          { id: "survey", l: "Have the engineer measure the routes first", cost: 8, fx: { gov: -2 }, next: "measured", out: "{gov}'s office says the date is fixed." },
        ] },
      stuck: { t: "The first bus sticks fast", art: { scene: "bus-stuck" }, ignore: "park",
        d: ({ S }) => (S.road && S.road.builder === "small" ? "On launch day the first bus scrapes both kerbs of the narrow access road and sticks fast." : "The buses fit the market road, but not one of the side streets where people live.") + " The clip of {gov}'s guests climbing out through a window is everywhere.",
        opts: [
          { id: "shave", l: "Cut back the kerbs and stall fronts", cost: 60, fx: { people: -2, gov: 3 }, end: "mixed", tag: "buses_fit", out: "The buses run. Forty traders lost the front of their stalls." },
          { id: "reroute", l: "Run them only where they fit", cost: 10, fx: { people: -1 }, end: "mixed", out: "Two routes: the market and the expressway. Nobody who needed a bus lives on either." },
          { id: "park", l: "Park them at the secretariat", cost: 0, fx: { gov: -8, people: -2 }, end: "bad", tag: "buses_parked", out: "Twenty new buses, gathering dust in the council yard." },
        ] },
      measured: { t: "The buses fit two routes in nine", art: { bg: "chairman-office", who: "works-commissioner" }, ignore: "two",
        d: "The engineer measured every route: the buses fit only the market road and the expressway. {gov}'s office says the launch is fixed.",
        opts: [
          { id: "tell", l: "Tell the governor, and ask for smaller buses", cost: 0, fx: { gov: -5, people: 2 }, next: "swap", out: "{gov} is not used to hearing 'no' about a gift." },
          { id: "two", l: "Launch on the two routes that fit", cost: 5, fx: { gov: 3, people: 1 }, end: "mixed", tag: "buses_fit", out: "A smaller launch, and buses that actually move." },
        ] },
      swap: { t: "The governor swaps them", art: { bg: "village-square" }, ignore: "accept",
        d: "{gov} sends the big buses to the state capital and gives you ten minibuses instead. Fewer seats, but they reach the villages.",
        opts: [ { id: "accept", l: "Run them to the villages", cost: 15, fx: { people: 5 }, fixed: true, end: "good", tag: "buses_fit", out: "Market women from four villages ride in on market day." } ] },
    } },

  mural: { nm: "The palace mural", art: { bg: "emirs-palace-courtyard", who: "traditional-ruler-oba-obi" },
    where: "Borja, Spain, 2012: an amateur's restoration of a church fresco became a worldwide joke, and then a tourist attraction that earned the town money.",
    learn: "Traditional rulers have no powers under the Constitution, but their palaces are the heart of many towns. Councils may charge fees for amenities they run.",
    left: "the palace mural is still a matter between you and the king",
    stages: {
      open: { t: "The palace mural is fading", art: { scene: "mural-fading" }, ignore: "wait",
        d: "The hundred-year-old mural at the palace gate is fading. Your aide's cousin, an art teacher, offers to restore it for free before the festival.",
        opts: [
          { id: "cousin", l: "Accept the free restoration", cost: 0, fx: {}, next: "ruined", story: "let an aide's cousin restore the palace mural", out: "The cousin starts on Monday with three tins of paint." },
          { id: "expert", l: "Pay a trained restorer from the state museum", cost: 45, fx: { people: 2 }, fixed: true, end: "good", tag: "mural_saved", out: "Six weeks of careful work. The king hosts you at the festival." },
          { id: "wait", l: "Leave it until there is money", cost: 0, fx: {}, end: "mixed", out: "It keeps fading." },
        ] },
      ruined: { t: "The mural is ruined", art: { scene: "mural-ruined" }, ignore: "blame",
        d: "The cousin repainted the royal faces. The king's secretary says they now look 'like boiled yams'. The king is furious, photos are everywhere, and visitors are queueing to laugh.",
        opts: [
          { id: "restorer", l: "Apologise and pay a real restorer", cost: 60, fx: { people: 1 }, end: "mixed", tag: "mural_repaired", out: "The king accepts the apology. The photos never go away." },
          { id: "fee", l: "Charge visitors an entry fee", cost: -30, fx: { people: 2 }, next: "king", out: "₦500 a head, and the queue gets longer." },
          { id: "blame", l: "Blame the cousin publicly", cost: 0, fx: { people: -2, council: -2 }, end: "bad", tag: "mural_ruined", out: "The cousin's students march to the secretariat. Your aide resigns." },
        ] },
      king: { t: "The palace wants its share", art: { bg: "council-table-palace", who: "traditional-ruler-oba-obi" }, ignore: "keep",
        d: "The entry fees paid for a new toilet block at the palace gate. The king has forgiven nothing, but his chiefs want half the fees, and the art teacher wants the credit.",
        opts: [
          { id: "share", l: "Share the fees with the palace", cost: 0, fx: { people: 3 }, fixed: true, end: "good", tag: "mural_tourism", out: "The king laughs about it at the festival. Mostly." },
          { id: "keep", l: "Keep the fees for the council", cost: -20, fx: { people: -3 }, end: "mixed", tag: "mural_tourism", out: "The council is richer. The palace remembers." },
        ] },
    } },

  fuel: { nm: "Forty drums by the school", inherited: true, art: { bg: "illegal-refinery-night" },
    where: "Beirut, 2020: chemicals seized from a ship in 2014 sat in a port warehouse for six years while officials argued about who should move them, until they exploded.",
    learn: "Seized goods are court evidence: they cannot be sold or destroyed without the court's order. A council can ask the court to keep samples and destroy the rest.",
    left: "the forty drums are still in the council store",
    stages: {
      open: { t: "Forty drums by the school", art: { scene: "drums-by-school", who: "lga-treasurer-worried" }, ignore: "leave",
        d: "Your predecessor left you forty drums of fuel seized from an illegal refinery. The court case is still open, so they are evidence and cannot be destroyed. They sit in the council store, twenty metres from a primary school.",
        opts: [
          { id: "court", l: "Ask the court to allow their destruction", cost: 10, fx: {}, next: "court", wait: [2, 2], out: "Your legal officer files the motion. The court is busy." },
          { id: "move", l: "Find somewhere else to keep them", cost: 25, fx: {}, next: "nowhere", out: "The works department goes looking for a store." },
          { id: "leave", l: "Leave them: it is the court's evidence", cost: 0, fx: {}, next: "smell", out: "The drums stay where they are." },
        ] },
      nowhere: { t: "No ward will take them", art: { bg: "village-square", who: "village-head" }, ignore: "market",
        d: "Every ward you ask says no. One village head blocks the road with his youths. The only free store is behind the market.",
        opts: [
          { id: "market", l: "Move them behind the market", cost: 10, fx: { people: -2 }, set: { market: true }, next: "smell", out: "Away from the school, and next to four hundred stalls." },
          { id: "court", l: "Go to the court instead", cost: 10, fx: {}, next: "court", out: "Your legal officer files the motion." },
        ] },
      court: { t: "The court rules", art: { bg: "courtroom", who: "judge" }, ignore: "destroy",
        d: "The judge allows samples to be kept as evidence and the rest destroyed under the fire service's supervision.",
        opts: [ { id: "destroy", l: "Destroy them properly", cost: 30, fx: { people: 4 }, fixed: true, end: "good", tag: "fuel_cleared", story: "got the court's leave to destroy the seized fuel", out: "The fire service burns it off in a quarry. The headmistress sends a thank-you card." } ] },
      smell: { t: "The storekeeper smells fuel", clue: "Leaking drums: two. The dry season: three weeks away.", art: { scene: "drums-by-school", who: "lga-treasurer-worried" }, ignore: "leave",
        d: "The storekeeper says two drums are leaking and the floor is wet. The dry season is coming, and the court has adjourned the case again.",
        opts: [
          { id: "empty", l: "Pump the leaking drums into new ones, and go to court", cost: 20, fx: { people: 1 }, next: "court", out: "New drums, a dry floor, and a motion before the judge." },
          { id: "guard", l: "Post a guard and ban smoking", cost: 5, fx: {}, next: ({ r }) => r() < .5 ? "fire" : "court", out: "A guard with a 'No smoking' sign. He smokes at night." },
          { id: "leave", l: "Leave it until the court decides", cost: 0, fx: {}, next: "fire", out: "The case is adjourned to the new year." },
        ] },
      fire: { t: "The store catches fire", art: ({ A }) => A.flags.market ? { scene: "market-fire-aftermath" } : { scene: "store-fire" }, ignore: "blame",
        d: ({ A }) => A.flags.market ? "Fire jumps from the store to the market. Sixty stalls burn before the fire service arrives." : "The store went up in the afternoon, with the school full. Teachers carried the children out through a back wall; three are in hospital.",
        opts: ({ A }) => [
          { id: "help", l: "Pay for treatment and rebuilding", cost: 80, fx: { people: -4 }, elec: -6, end: "bad", tag: "fuel_fire", seen: A.flags.market ? ["fire"] : [], out: "Everyone knew about the drums. Now everyone knows you did, too." },
          { id: "blame", l: "Blame your predecessor and the court", cost: 0, fx: { people: -9 }, elec: -8, end: "bad", tag: "fuel_fire", seen: A.flags.market ? ["fire"] : [], out: A.flags.market ? "The traders show reporters the petition they sent you about the drums." : "The headmistress shows reporters the letters she sent you." },
        ] },
    } },

  pump: { nm: "The playground pump", art: { bg: "classroom", who: "teacher" },
    where: "Southern Africa, 2000s: water pumps driven by children's roundabouts were installed in many villages. Children lost interest, women ended up pushing them, and many broke without spare parts.",
    learn: "Councils share rural water supply with state agencies. A donated pump needs spare parts, and someone responsible for repairing it.",
    left: "Ward 2's pump is still a question",
    stages: {
      open: { t: "A pump that children power", art: { scene: "playground-pump" }, ignore: "accept",
        d: "An NGO offers a free water pump at Ward 2 primary school, driven by a children's roundabout: the children play, the tank fills. They want a photo with you on Friday.",
        opts: [
          { id: "accept", l: "Accept it, and pose for the photo", cost: 0, fx: { people: 3 }, next: "bored", story: "accepted the playground pump", out: "The children love it. So does the NGO's website." },
          { id: "hand", l: "Ask them for a plain hand pump instead", cost: 0, fx: { people: 1 }, fixed: true, end: "good", tag: "pump_hand", out: "The NGO sulks and sends a hand pump. It is dull, and it works." },
        ] },
      bored: { t: "The roundabout stops", clue: "The tank: a quarter full.", art: { scene: "women-pushing-pump" }, ignore: "pay",
        d: "The children got bored after a month. Now the women of Ward 2 push the roundabout for hours to fill the tank. A part has broken, and the spare must come from abroad.",
        opts: [
          { id: "replace", l: "Replace it with a motorised borehole", cost: 70, fx: { people: 5 }, next: "ngo", out: "A generator, a borehole and a tap that runs." },
          { id: "spare", l: "Import the spare part", cost: 30, fx: { people: 1 }, end: "mixed", tag: "pump_patched", out: "It turns again, for a while. The women still push it." },
          { id: "pay", l: "Pay pupils' parents to push it", cost: 20, fx: { cor: .01 }, end: "mixed", tag: "pump_patched", out: "A council job pushing a playground. The radio has fun with it." },
        ] },
      ngo: { t: "The NGO is offended", art: { scene: "news-protest" }, ignore: "thank",
        d: "The NGO says you 'rejected a gift from children's donors' and has posted it online. The new borehole works.",
        opts: [ { id: "thank", l: "Thank them, and keep the roundabout as a playground", cost: 0, fx: { people: 2 }, fixed: true, end: "good", tag: "pump_fixed", out: "Water from the borehole, and a roundabout that is just a roundabout again." } ] },
    } },

  vaccine: { nm: "The vaccine scare", truth: .15, art: { bg: "rural-health-centre", who: "nurse" },
    where: "The Philippines, 2017–2019: after fears about a dengue vaccine, trust in all vaccines collapsed, and a measles outbreak followed.",
    learn: "Routine immunisation is delivered mostly through council health centres, with the state and the National Primary Health Care Development Agency. One rumour can undo years of work.",
    left: "the vaccination drive is still stopped",
    stages: {
      open: { t: "A child dies after the vaccination drive", ignore: "pause",
        d: "Two days after the council's measles and polio drive, a two-year-old in Ward 5 died. Nobody knows why yet. A video blaming the vaccine has 200,000 views.",
        opts: [
          { id: "autopsy", l: "Ask the state hospital for an autopsy", cost: 15, fx: {}, next: "result", reveal: true, out: "The mother agrees. The results will take weeks." },
          { id: "pause", l: "Pause the drive until we know", cost: 0, fx: { people: 1 }, next: "fear", out: "The drive stops. Parents read the pause as an answer." },
          { id: "press", l: "Keep going, with town halls in every ward", cost: 20, fx: { people: -2 }, next: "halls", out: "Health officers go out with megaphones and posters." },
        ] },
      result: { t: "The autopsy", art: { bg: "hospital-ward", who: "doctor" }, ignore: ({ truth }) => truth ? "hide" : "publish",
        d: ({ truth }) => truth ? "The autopsy finds a severe reaction to one batch of the vaccine. It is very rare, and the batch is being recalled across the country." : "The autopsy finds the child had severe malaria. The vaccine played no part. The video is still spreading.",
        opts: ({ truth }) => truth ? [
          { id: "honest", l: "Publish it, and resume with a new batch", cost: 10, fx: { people: -2 }, end: "mixed", tag: "vaccine_honest", out: "Hard to hear, and believed because you said it first. Most parents come back." },
          { id: "hide", l: "Keep it quiet and resume", cost: 0, fx: { cor: .05 }, next: "measles", out: "The recall is on the national news a week later, without you." },
        ] : [
          { id: "publish", l: "Publish it with the mother's consent, and resume", cost: 20, fx: { people: 3 }, fixed: true, end: "good", tag: "vaccine_trust", out: "The mother speaks at the town hall herself. The queues come back." },
          { id: "quiet", l: "Resume without making a fuss", cost: 10, fx: { people: -1 }, next: "fear", out: "Nobody hears the result. They still hear the video." },
        ] },
      halls: { t: "The town halls are angry", art: { scene: "vaccine-town-hall" }, ignore: "press",
        d: "Parents shout at your health officers. Some vaccinate; many walk out. The video's maker is now a local celebrity.",
        opts: [
          { id: "autopsy", l: "Get the autopsy and publish it", cost: 15, fx: {}, next: "result", reveal: true, out: "You promise the town an answer." },
          { id: "press", l: "Press on without answers", cost: 10, fx: { people: -3 }, next: "measles", out: "Coverage falls ward by ward." },
        ] },
      fear: { t: "Parents stop all vaccines", clue: "Children vaccinated this season: down by half.", art: { bg: "rural-health-centre", who: "health-worker" }, ignore: "wait",
        d: "The pause confirmed the rumour. Parents now refuse every vaccine, not just this one. The health officer warns of measles by the dry season.",
        opts: [
          { id: "faith", l: "Restart with imams, pastors and the child's mother", cost: 30, fx: { people: 3 }, end: "mixed", tag: "vaccine_trust", out: "Slowly, and one mosque and church at a time, the queues come back." },
          { id: "wait", l: "Wait for the fear to pass", cost: 0, fx: {}, next: "measles", out: "It does not pass." },
        ] },
      measles: { t: "Measles in the wards", art: { scene: "measles-ward" }, ignore: "blame",
        d: "Measles has reached four wards, and two children have died. The state says vaccination in your LGA fell further than anywhere else in the state.",
        opts: [
          { id: "drive", l: "An emergency drive, house to house", cost: 50, fx: { people: -2 }, elec: -4, end: "bad", tag: "vaccine_measles", out: "The outbreak is over by the rains. It never needed to start." },
          { id: "blame", l: "Blame the video's maker", cost: 0, fx: { people: -6 }, elec: -6, end: "bad", tag: "vaccine_measles", out: "The video's maker has more followers than you have voters." },
        ] },
    } },
};

/* ── The Senator ── */
const SENATE_ARCS = {
  ash: { nm: "Your Clean Heat Act", art: { bg: "senate-chamber", who: "senator-female" },
    where: "Northern Ireland, 2012–2016: a renewable-heat subsidy paid more than the fuel cost, so some users heated empty buildings to earn money. A late closing date caused a rush, and the scandal brought down the regional government.",
    learn: "A bill that spends money must say how the payments are calculated. Changing a rate before a bill passes is far cheaper than after thousands have signed up.",
    left: "your Clean Heat payments are still running at the old rate",
    stages: {
      open: { t: "Your Clean Heat Bill", clue: "Payment per unit of heat: ₦34. Fuel cost per unit: ₦21.", ignore: "pass",
        d: "Your bill pays farmers to switch from diesel to biomass heat. The ministry has set the payment at ₦34 for every unit of heat. Wood pellets cost ₦21 a unit.",
        opts: [
          { id: "pass", l: "Pass it as written", fx: { home: 4, clout: 3 }, law: true, next: "boom", wait: [2, 2], story: "passed the Clean Heat Act as written", out: "Farmers in your district cheer. The diesel generators start going off." },
          { id: "tier", l: "Cut the rate after each farm's first year", fx: { clout: -3 }, law: true, next: "tiered", wait: [2, 2], story: "passed the Clean Heat Act with a falling rate", out: "The ministry grumbles. The bill passes anyway." },
          { id: "drop", l: "Withdraw it", fx: { home: -2 }, end: "mixed", out: "The diesel generators keep running." },
        ] },
      boom: { t: "Barns heated all year", art: { scene: "heated-empty-barn" }, ignore: "quiet",
        d: "Applications have tripled. A poultry farmer in your district heats an empty barn with the doors open: every unit he burns earns ₦13 profit. The budget office says the scheme will cost five times its estimate.",
        opts: [
          { id: "cap", l: "Cap the rate for new applicants only", fx: { home: -1, clout: 2 }, end: "mixed", tag: "ash_capped", out: "New farmers get less. The early ones keep the old rate for twenty years." },
          { id: "close", l: "Announce the scheme closes in a month", fx: { home: -3 }, next: "rush", out: "The announcement is on every farm radio by noon." },
          { id: "quiet", l: "Say nothing: your farmers love it", fx: { home: 3, cor: .03 }, next: "scandal", out: "The barns stay warm." },
        ] },
      rush: { t: "The rush before the deadline", art: { bg: "finance-ministry-office", who: "finance-minister-angry" }, ignore: "own",
        d: "The closing date started a rush: more farmers signed up in the last month than in the whole year before. Their payments are locked in for twenty years.",
        opts: [ { id: "own", l: "Take the blame and fix the rate in law", fx: { home: -4, clout: 2 }, end: "mixed", tag: "ash_capped", out: "An amending act passes. The early sign-ups keep what they were promised." } ] },
      scandal: { t: "“Cash for ash”", art: { scene: "senate-inquiry" }, ignore: "deny",
        d: "A newspaper reveals that a senator's relatives run three heated empty barns. Your name is on the act. The President's men ask whether you knew.",
        opts: [
          { id: "inquiry", l: "Call for a public inquiry yourself", fx: { home: -2, clout: -4, cor: -.02 }, end: "mixed", tag: "ash_inquiry", out: "The inquiry finds a bad rate, not a crime. Your name is on its cover anyway." },
          { id: "deny", l: "Say the act was sound", fx: { home: -6, clout: -5 }, end: "bad", tag: "ash_scandal", out: "The cartoonists draw you shovelling naira into a furnace." },
        ] },
      tiered: { t: "A falling rate", art: { bg: "northern-farmland", who: "farmers-association-chair" }, ignore: "fund",
        d: "With the rate falling after year one, fewer farmers sign up, but the ones who do are real. The diesel generators are going off, slowly.",
        opts: [ { id: "fund", l: "Push for training money too", fx: { home: 4, clout: 1 }, end: "good", tag: "ash_good", out: "A small act that worked. Nobody writes about those." } ] },
    } },

  installers: { nm: "The solar jobs fund", art: { bg: "senate-chamber", who: "senator-young-male" },
    where: "Australia, 2009–2010: a rushed home-insulation subsidy drew in untrained installers. Houses caught fire, and four young workers died.",
    learn: "A fund set up by law is spent by a ministry, but Senate committees can investigate how it is paid out (Sections 88 and 89).",
    left: "the solar academies are still certifying installers",
    stages: {
      open: { t: "Train 50,000 solar installers", ignore: "fast",
        d: "Your Youth Solar Jobs Fund pays training centres ₦150,000 for every installer they certify. The ministry wants it running before the rainy season.",
        opts: [
          { id: "fast", l: "Launch it now", fx: { home: 5 }, law: true, next: "academies", wait: [1, 2], story: "launched the Youth Solar Jobs Fund fast", out: "Young people in your district queue to sign up." },
          { id: "inspect", l: "Require inspections of every centre first", fx: { home: 1, clout: -2 }, law: true, next: "slow", wait: [2, 2], story: "launched the solar fund with inspections first", out: "The ministry says inspections will take six months." },
        ] },
      academies: { t: "Academies appear overnight", clue: "Training centres: 9 last year, 412 now.", art: { scene: "weekend-academy" }, ignore: "more",
        d: "Hundreds of 'academies' have opened, some in shops. A certificate takes a weekend. Installers are on roofs across your district.",
        opts: [
          { id: "audit", l: "Order an audit of the centres", fx: { clout: 2, home: -2 }, next: ({ r }) => r() < .4 ? "fire" : "audited", out: "The auditors start with the biggest centres." },
          { id: "more", l: "Ask for more money: it is working", fx: { home: 3 }, next: "fire", out: "The ministry doubles the fund." },
        ] },
      audited: { t: "The audit lands", art: { bg: "senate-hearing-room", who: "minister-witness-worried" }, ignore: "close",
        d: "Half the centres never trained anyone. The auditors recommend closing them and re-testing every installer they certified.",
        opts: [ { id: "close", l: "Close them and re-test", fx: { home: -1, clout: 3 }, end: "mixed", tag: "installers_cleaned", out: "Thousands of certificates are withdrawn. Some were real." } ] },
      fire: { t: "A roof fire, then a death", art: { scene: "roof-fire" }, ignore: "defend",
        d: "A badly wired panel set a house in your district on fire. A week later a 19-year-old installer was electrocuted on his first job. His certificate came from a weekend academy. The fund carries your name.",
        opts: [
          { id: "stop", l: "Suspend the fund and pay for safety checks", fx: { home: -3, clout: -2 }, end: "mixed", tag: "installers_halted", out: "Every roof the fund paid for is checked. The boy's mother does not take your call." },
          { id: "defend", l: "Defend the fund and blame the academies", fx: { home: -7, clout: -3 }, end: "bad", tag: "installers_death", out: "The academies were paid by your fund. Everyone points that out." },
        ] },
      slow: { t: "Slow and safe", art: { bg: "constituency-office", who: "young-voter-student" }, ignore: "stay",
        d: "Inspections took six months. Fewer installers were trained, but they are being hired. Young people in your district say the fund was 'all talk'.",
        opts: [
          { id: "stay", l: "Keep the standard", fx: { home: 2 }, end: "good", tag: "installers_good", out: "Slow, safe, and not one fire." },
          { id: "loosen", l: "Loosen it to speed things up", fx: { home: 3 }, next: "academies", out: "The centres multiply." },
        ] },
    } },

  comma: { nm: "The missing comma", art: { bg: "senator-office-abuja", who: "senior-advocate" },
    where: "Maine, USA, 2017: a missing comma in an overtime law decided a court case, and a dairy company paid its drivers $5 million.",
    learn: "Bills are drafted by the National Assembly's legal officers, but the senator who sponsors one answers for its words. Courts read the words as written.",
    left: "the comma question is still in the courts",
    stages: {
      open: { t: "Your Domestic Workers' Wage Bill", art: { bg: "senator-office-abuja", who: "senior-advocate", obj: "missing-comma" }, ignore: "asis",
        d: "Your bill gives cooks, cleaners and drivers a minimum wage and overtime. Overtime does not apply to 'packing for shipment or distribution of goods'. The drafting clerk asks if you want a comma after 'shipment'.",
        opts: [
          { id: "comma", l: "Add the comma", fx: { clout: -1 }, law: true, next: "clean", wait: [2, 2], story: "put the comma into the Domestic Workers' Wage Act", out: "The clerk sighs and reprints sixty pages." },
          { id: "asis", l: "Leave it: the meaning is obvious", fx: { home: 3 }, law: true, next: "court", wait: [2, 3], story: "passed the Domestic Workers' Wage Act without the comma", out: "The act passes. Cooks and drivers in your district celebrate." },
        ] },
      court: { t: "The court reads it differently", art: { bg: "courtroom", who: "judge" }, ignore: "drivers",
        d: "Delivery drivers sued a bottling company. Without the comma, the court rules that distribution is not excluded: the drivers are owed overtime. Firms owe ₦11B in back pay. Employers say you wrote it badly; the drivers say you wrote it well.",
        opts: [
          { id: "drivers", l: "Back the ruling: the drivers earned it", fx: { home: 5, clout: -5 }, end: "mixed", tag: "comma_drivers", out: "The drivers' union names you its patron. The employers' association names you something else." },
          { id: "amend", l: "Amend the act to undo the ruling", fx: { home: -5, clout: 4, loyalty: 3 }, end: "mixed", tag: "comma_amended", out: "The comma goes in. The drivers' banners go up outside your office." },
        ] },
      clean: { t: "The drivers feel left out", art: { bg: "constituency-office", who: "truckers-union-leader" }, ignore: "meet",
        d: "The act passed with the comma. A drivers' union says you excluded them on purpose. You did not; nobody sues.",
        opts: [ { id: "meet", l: "Meet the drivers and promise them a bill", fx: { home: 3 }, end: "good", tag: "comma_clean", out: "A clear law and a promise. They will hold you to it." } ] },
    } },

  robodebt: { nm: "The debt letters", art: { scene: "committee-room" },
    where: "Australia, 2016–2019: an automated scheme averaged people's incomes to find welfare 'debts'. Hundreds of thousands of letters went out, many wrong, and a royal commission later called it unlawful.",
    learn: "The government cannot demand money from a citizen without a lawful basis. The Senate can summon officials to explain how a system makes its decisions.",
    left: "the stipend debt letters are still going out",
    stages: {
      open: { t: "Recover overpaid stipends", art: { bg: "senate-hearing-room", who: "permanent-secretary" }, ignore: "back",
        d: "The ministry asks your committee to back an automatic system: it compares each young person's bank deposits for the year with their stipend, and sends a debt letter if they look too high. It promises to recover ₦40B.",
        opts: [
          { id: "back", l: "Back it", fx: { clout: 4, loyalty: 3 }, next: "letters", wait: [1, 2], story: "backed the automatic stipend-debt letters", out: "The ministry thanks the committee by name." },
          { id: "pilot", l: "Back a small pilot with human checks", fx: { clout: -1 }, next: "pilot", out: "Two thousand cases, checked by hand." },
          { id: "no", l: "Refuse", fx: { clout: -4, loyalty: -3 }, end: "mixed", out: "The ministry finds another committee." },
        ] },
      letters: { t: "200,000 debt letters", art: { scene: "senate-inquiry", obj: "debt-letter" }, ignore: "defend",
        d: "A young woman who only earned money in December is told she owes ₦600,000, because the system averaged her year. Thousands say the same. A young man in your district took his own life; his letter was on the table.",
        opts: [
          { id: "halt", l: "Demand the letters be withdrawn", fx: { home: 3, clout: -4 }, end: "mixed", tag: "robodebt_halted", out: "The letters stop. The ministry calls it a 'pause'." },
          { id: "refund", l: "Push for refunds and an apology", fx: { home: 5, clout: -6, loyalty: -4 }, end: "mixed", tag: "robodebt_refunds", out: "Refunds, and an apology the minister reads without looking up." },
          { id: "defend", l: "Defend the system's accuracy", fx: { home: -8, clout: 2 }, end: "bad", tag: "robodebt_defended", out: "Your words are read aloud at the young man's funeral." },
        ] },
      pilot: { t: "The pilot's results", art: { scene: "committee-room" }, ignore: "fix",
        d: "The pilot checked 2,000 cases by hand. Four in ten of the 'debts' were wrong.",
        opts: [
          { id: "kill", l: "Publish it and stop the full roll-out", fx: { home: 4, clout: -2 }, end: "good", tag: "robodebt_stopped", out: "The ministry's ₦40B was never there to recover." },
          { id: "fix", l: "Let them fix it and roll out anyway", fx: { clout: 2 }, next: "letters", out: "The ministry promises a better formula." },
        ] },
    } },

  horizon: { nm: "The software that cannot be wrong", inherited: true, truth: .8, art: { bg: "senator-office-abuja", who: "civil-servant" },
    where: "United Kingdom, 1999–2015: the Post Office's Horizon software showed cash shortfalls that did not exist. Hundreds of sub-postmasters were prosecuted, in one of Britain's worst miscarriages of justice.",
    learn: "Under Section 84 of the Evidence Act 2011, computer records can be used in court with a certificate that the computer was working properly. Proving that it was not is hard for the accused.",
    left: "the bursars' cases are still before the courts",
    stages: {
      open: { t: "The software that cannot be wrong", art: { bg: "senator-office-abuja", who: "school-bursar" }, ignore: "trust",
        d: "The Treasury software the last Senate approved has flagged 40 school bursars for missing money, and all are being prosecuted. One, Mrs Okeke from your district, swears she never took a kobo, and has emptied her savings to 'repay' it.",
        opts: [
          { id: "audit", l: "Demand the vendor's code be audited", fx: { clout: -3 }, next: "vendor", out: "The letter goes to the Treasury and the vendor." },
          { id: "one", l: "Help Mrs Okeke privately", fx: { home: 2, cor: .01 }, next: "favour", out: "A phone call to the prosecutor." },
          { id: "trust", l: "Trust the courts", fx: {}, next: "more", wait: [1, 2], out: "The cases go on." },
        ] },
      vendor: { t: "The vendor pushes back", art: { bg: "senate-hearing-room", who: "lobbyist" }, ignore: "drop",
        d: "The vendor threatens to sue the Senate: an audit would expose 'trade secrets'. A former engineer of theirs contacts your office anonymously.",
        opts: [
          { id: "meet", l: "Meet the engineer", fx: {}, next: "engineer", reveal: true, out: "A café in Wuse, after dark." },
          { id: "drop", l: "Drop the audit", fx: { clout: 3 }, next: "more", out: "The vendor's lawyers send a polite thank-you." },
        ] },
      engineer: { t: "What the engineer knows", art: { bg: "back-room", who: "whistleblower-engineer" }, ignore: ({ truth }) => truth ? "expose" : "aid",
        d: ({ truth }) => truth ? "The engineer brings proof: the software miscounts when a bank connection drops, and staff could change branch accounts remotely. The 'missing money' never existed." : "The engineer admits he was sacked for drinking. His claims do not hold up, and most of the bursars' cases look real.",
        opts: ({ truth }) => truth ? [
          { id: "expose", l: "Expose it at a public hearing", fx: { home: 8, clout: -3 }, end: "good", tag: "horizon_exposed", out: "The prosecutions are halted. Mrs Okeke gets her savings back, in time." },
        ] : [
          { id: "aid", l: "Let the cases proceed, but fund legal aid", fx: { home: 2 }, end: "mixed", tag: "horizon_real", out: "Some bursars are cleared, most are not. The software was not the problem this time." },
        ] },
      favour: { t: "Why is she special?", art: { scene: "senate-investigation-news", who: "school-bursar" }, ignore: "silent",
        d: "Your call got Mrs Okeke's case dropped. The other 39 bursars ask why she is special, and a newspaper calls it favouritism.",
        opts: [
          { id: "all", l: "Ask for a review of all 40 cases", fx: { clout: -3, home: 3 }, next: "engineer", reveal: true, out: "The review brings a former engineer to your door." },
          { id: "silent", l: "Say nothing", fx: { home: -3, cor: .02 }, end: "bad", tag: "horizon_favour", out: "Thirty-nine families remember your silence." },
        ] },
      more: { t: "More bursars in the dock", art: { bg: "courtroom", who: "judge" }, ignore: "leave",
        d: "Twelve more bursars are prosecuted, and two are in prison. Mrs Okeke's daughter writes to you: 'You were our senator.'",
        opts: [
          { id: "now", l: "Demand the audit now", fx: { home: 2, clout: -3 }, next: "engineer", reveal: true, out: "This time you go to the vendor's engineers directly." },
          { id: "leave", l: "Leave it to the courts", fx: { home: -5 }, end: "bad", tag: "horizon_ignored", out: "The cases run for years." },
        ] },
    } },

  button: { nm: "The wrong button", art: { scene: "senate-vote" },
    where: "Many parliaments have seen members press the wrong button or walk through the wrong lobby. Once a vote is recorded, it usually stands.",
    learn: "The Senate's Standing Orders govern how votes are taken. A recorded vote stands unless the presiding officer allows it to be taken again.",
    left: "your vote on the Telecoms Levy is still on the record",
    stages: {
      open: { t: "You pressed the wrong button", art: { scene: "senate-vote", obj: "vote-console" }, ignore: "explain",
        d: "The electronic vote on the Telecoms Levy Bill has closed. Your light shows green: yes. You campaigned against it. It passed 55 to 54.",
        opts: [
          { id: "revote", l: "Ask the Senate President for a re-vote", story: "asked for a re-vote after pressing the wrong button", fx: { clout: -3 }, next: ({ S, r }) => r() < (S.clout >= 50 ? .6 : .3) ? "revote_ok" : "revote_no", wait: [0, 0], out: "You rise on a point of order." },
          { id: "explain", l: "Explain the mistake in the chamber", story: "owned up to pressing the wrong button", fx: { home: -2 }, end: "mixed", tag: "button_owned", out: "Your statement is in the Votes and Proceedings. So is your yes." },
          { id: "own", l: "Say you changed your mind", fx: { home: -6, clout: 3 }, end: "bad", tag: "button_flip", out: "Your district hears that its senator switched sides overnight." },
        ] },
      revote_ok: { t: "The re-vote", art: { bg: "senate-chamber", who: "senate-president" }, ignore: "accept",
        d: "The Senate President allows a re-vote. The bill fails 54 to 55. The President's men will not forget whose button it was.",
        opts: [ { id: "accept", l: "Thank the chair", fx: { home: 3, loyalty: -5 }, end: "mixed", tag: "button_revote", out: "Your district cheers. The whips write your name down." } ] },
      revote_no: { t: "“The record is the record”", art: { bg: "senate-chamber", who: "senate-president-angry" }, ignore: "statement",
        d: "The Senate President refuses: the vote stands. The clip of you asking for a second go is everywhere.",
        opts: [ { id: "statement", l: "Publish how you meant to vote", fx: { home: -1 }, end: "mixed", tag: "button_owned", out: "Some believe you. The levy is law either way." } ] },
    } },

  funeral: { nm: "The burial and the vote", art: { bg: "burial-ceremony" },
    where: "Lawmakers everywhere miss votes for funerals, births and illness. Some parliaments let absent members 'pair' with an opponent or vote by proxy. Nigeria's Senate does not.",
    learn: "Senators must be in the chamber to vote. Section 54 sets the quorum at one-third of members; a question is decided by a majority of those present and voting.",
    left: "your in-laws are still talking about the burial",
    stages: {
      open: { t: "The burial and the vote", art: { scene: "burial-graveside" }, ignore: "burial",
        d: "Your mother-in-law is buried on Friday in your home town, and the family expects you at the front. The vote on a Federal University for your district has been moved to Friday afternoon. You cannot be at both.",
        opts: [
          { id: "vote", l: "Stay in Abuja for the vote", story: "missed your mother-in-law's burial for the university vote", fx: { clout: 3 }, next: "family", wait: [0, 0], out: "You send a long message and a cow." },
          { id: "burial", l: "Go home for the burial", story: "went home for the burial and missed the university vote", fx: { home: 4 }, next: "lost", wait: [0, 0], out: "You stand with your spouse's family at the graveside." },
          { id: "proxy", l: "Go home, and ask an ally to lead the vote", fx: { clout: -1 }, next: ({ S, r }) => r() < (S.clout >= 55 ? .6 : .35) ? "proxy_won" : "lost", wait: [0, 0], out: "Your ally promises to count the votes." },
        ] },
      family: { t: "The university passes", art: { scene: "senate-vote" }, ignore: "thanks",
        d: "The university bill passes by three votes. At home, your spouse's family says you put Abuja before them, and the town talks about it at every funeral.",
        opts: [ { id: "thanks", l: "Go home for a thanksgiving", fx: { home: 3, chest: -.2 }, end: "mixed", tag: "funeral_vote", out: "A big thanksgiving. Some of the in-laws come." } ] },
      lost: { t: "The university fails", art: { bg: "senate-chamber", who: "senator-veteran-male" }, ignore: "again",
        d: "The bill fails by two votes. A rival senator from your zone says it would have passed if you had been there. Your spouse's family praises you to everyone.",
        opts: [ { id: "again", l: "Bring it back next year", fx: { clout: -2 }, end: "mixed", tag: "funeral_burial", out: "Back to the bottom of the order paper." } ] },
      proxy_won: { t: "Your ally comes through", art: { scene: "senate-vote" }, ignore: "thank",
        d: "Your ally whipped the votes and the university bill passed by one. You were at the graveside. Now you owe your ally a big favour.",
        opts: [ { id: "thank", l: "Promise your ally your vote on their bill", fx: { home: 3, loyalty: -2 }, end: "good", tag: "funeral_both", out: "Both, this time. The favour will come due." } ] },
    } },

  fakenews: { nm: "Your false-information law", art: { bg: "senator-office-abuja", who: "party-chairman" },
    where: "Several countries have passed laws against 'fake news' after real harm, then seen them used against journalists and critics.",
    learn: "Section 39 of the Constitution protects freedom of expression, but allows laws that are 'reasonably justifiable in a democratic society'. Courts decide where that line falls.",
    left: "your false-information amendment is still on the books",
    stages: {
      open: { t: "A fake video caused a stampede", art: { scene: "market-stampede" }, ignore: "sponsor",
        d: "A fake kidnapping video on WhatsApp caused a stampede at a market in your district: two dead. The party wants you to sponsor an amendment making 'false statements that cause public alarm' a crime.",
        opts: [
          { id: "sponsor", l: "Sponsor it as drafted", fx: { home: 4, loyalty: 3 }, law: true, next: "arrests", wait: [2, 2], story: "sponsored the false-information amendment", out: "It passes easily. The market women thank you." },
          { id: "narrow", l: "Sponsor it, only for proven intent to cause panic", fx: { home: 2, clout: -2 }, law: true, next: "narrow", wait: [2, 2], story: "sponsored a narrow false-information amendment", out: "It passes after a fight over two words." },
          { id: "decline", l: "Decline: the existing law is enough", fx: { home: -2, loyalty: -3 }, end: "mixed", out: "The party gives the bill to another senator." },
        ] },
      arrests: { t: "Your law, used at home", art: { scene: "bloggers-arrested" }, ignore: "silent",
        d: "Police in your state have used your amendment to arrest three bloggers from your district. Their post said the governor's new road was unfinished. It was unfinished.",
        opts: [
          { id: "repeal", l: "Move to repeal your own amendment", fx: { home: 4, loyalty: -4, clout: -2 }, end: "mixed", tag: "fakenews_repealed", out: "The repeal fails, but the bloggers are released." },
          { id: "lawyers", l: "Pay for their lawyers", fx: { home: 5, chest: -.3 }, need: ({ S }) => (S.chest || 0) >= .3, why: "Your war chest is too low.", end: "mixed", tag: "fakenews_lawyers", out: "The court frees them. The law stays." },
          { id: "silent", l: "Say the law is the law", fx: { home: -7 }, end: "bad", tag: "fakenews_abused", out: "The bloggers' mothers stand outside your constituency office every Friday." },
        ] },
      narrow: { t: "A law nobody can use", art: { bg: "constituency-office", who: "reporter" }, ignore: "fine",
        d: "The narrow version passed. Prosecutors say intent is impossible to prove, so it has never been used. Bloggers call it useless; the party calls it weak.",
        opts: [ { id: "fine", l: "Better useless than abused", fx: { home: 2 }, end: "good", tag: "fakenews_narrow", out: "No stampedes since. No arrests either." } ] },
    } },
};

/* ── The Ambassador ── */
const AMB_ARCS = {
  spouse: { nm: "The First Secretary's wife", art: { bg: "embassy-office", who: "host-minister" },
    where: "United Kingdom, 2019: a US diplomat's wife drove on the wrong side of the road and killed a teenage motorcyclist, Harry Dunn. She left under diplomatic immunity, and his family campaigned for years.",
    learn: "Under the Vienna Convention a diplomat's family also has immunity. Only the sending state, Nigeria, can waive it; the host can only expel.",
    left: "the cyclist's family is still waiting",
    stages: {
      open: { t: "A teenager is dead", art: { scene: "cyclist-crash" }, ignore: "fly",
        d: "Late last night your First Secretary's wife drove on the wrong side of the road in {city} and hit a teenage cyclist. He died this morning. She has diplomatic immunity. Abuja's cable says: 'Invoke immunity. Fly her home.'",
        opts: [
          { id: "fly", l: "Fly her home tonight", fx: { abuja: 6, host: -10 }, next: "mother", story: "flew the First Secretary's wife home under immunity", out: "She leaves through the private terminal before dawn." },
          { id: "waive", l: "Ask Abuja to waive her immunity", fx: { abuja: -8, host: 6 }, next: ({ S }) => S.abuja >= 50 ? "waived" : "refused", story: "asked Abuja to waive immunity for the First Secretary's wife", out: "Your cable goes to the Foreign Minister personally." },
          { id: "stay", l: "Keep her here while you negotiate", story: "kept the First Secretary's wife in the country while you negotiated", fx: { abuja: -2, host: 2 }, next: "talks", out: "She stays in the residence. The press camp outside." },
        ] },
      mother: { t: "The mother on every channel", art: { bg: "tv-studio", who: "grieving-mother" }, ignore: "silence",
        d: "The boy's mother is on every channel: 'Nigeria let my son's killer escape.' The host parliament wants the families of Nigerian diplomats to lose their immunity.",
        opts: [
          { id: "visit", l: "Visit the family and apologise for Nigeria", fx: { host: 4, abuja: -3 }, end: "mixed", tag: "spouse_fled", out: "She lets you in. She does not shake your hand." },
          { id: "silence", l: "Say nothing: Abuja's line is final", fx: { host: -8, diaspora: -3 }, next: "visas", out: "The embassy's phone lines are jammed with abuse." },
        ] },
      visas: { t: "The visas slow down", art: { bg: "consular-hall", who: "citizen-student-abroad" }, ignore: "accept",
        d: "{country} has slowed every visa for Nigerians. Students and traders are stuck, and they blame the embassy, not the driver.",
        opts: [
          { id: "trial", l: "Propose a trial in Nigeria", fx: { host: 4, abuja: -2 }, end: "mixed", tag: "spouse_fled", out: "The family refuses at first. The visas speed up a little." },
          { id: "accept", l: "Wait it out", fx: { diaspora: -6 }, end: "bad", tag: "spouse_visas", out: "A year of slow visas, paid for by students who never met her." },
        ] },
      waived: { t: "Abuja waives her immunity", art: { bg: "courtroom", who: "judge" }, ignore: "lawyer",
        d: "Abuja agrees, furious. She will stand trial in {city}. Your First Secretary resigns.",
        opts: [ { id: "lawyer", l: "Make sure she has a good lawyer", fx: { host: 5, diaspora: 2 }, end: "good", tag: "spouse_trial", out: "She pleads guilty to careless driving. The boy's mother says justice was done." } ] },
      refused: { t: "Abuja refuses", art: { bg: "embassy-office", who: "foreign-minister-nigeria" }, ignore: "tell",
        d: "Abuja refuses and flies her home anyway. The host knows you asked.",
        opts: [ { id: "tell", l: "Tell the family the truth", fx: { host: 3, abuja: -3 }, end: "mixed", tag: "spouse_fled", out: "The family does not forgive Nigeria. They do not blame you." } ] },
      talks: { t: "The negotiation", art: { bg: "foreign-ministry-meeting", who: "host-minister" }, ignore: "fly",
        d: "She is in the residence. The host's prosecutors want a statement from her; Abuja's patience is thin.",
        opts: [
          { id: "statement", l: "Let her give a voluntary statement", fx: { host: 5, abuja: -4 }, end: "mixed", tag: "spouse_statement", out: "She tells the police what happened. It helps the family more than any court could." },
          { id: "fly", l: "Fly her home now", fx: { abuja: 3, host: -8 }, next: "mother", out: "Abuja is relieved. The host is not." },
        ] },
    } },

  maid: { nm: "Your deputy and her maid", truth: .7, art: { bg: "detention-visiting-room", who: "consular-officer" },
    where: "United States and India, 2013: an Indian diplomat was arrested and strip-searched over her maid's pay. India retaliated by removing security barriers outside the US embassy.",
    learn: "Consular officers, unlike diplomats, have immunity only for official acts (Vienna Convention on Consular Relations, Article 43). Hiring a maid is not an official act.",
    left: "your deputy's case is still open",
    stages: {
      open: { t: "Your deputy is arrested", art: { bg: "detention-visiting-room", who: "deputy-head-of-mission" }, ignore: "retaliate",
        d: "Your deputy was arrested outside her children's school, handcuffed and strip-searched. She is charged with lying about her maid's pay on a visa form. Abuja is outraged and wants retaliation. The maid's story sounds credible.",
        opts: [
          { id: "maid", l: "Meet the maid first", fx: {}, story: "heard the maid's side before backing your deputy", next: "maid", reveal: true, out: "She agrees to meet you at a church hall." },
          { id: "retaliate", l: "Back Abuja: demand an apology", story: "demanded an apology for your deputy's arrest", fx: { abuja: 6, host: -8, diaspora: 2 }, next: "row", out: "Abuja's statement uses the word 'humiliation' four times." },
          { id: "quiet", l: "Negotiate quietly: a UN post for her, full pay for the maid", story: "settled your deputy's case quietly", fx: { abuja: -3, host: 3 }, next: "deal", out: "Two lawyers and a long lunch." },
        ] },
      maid: { t: "The maid's side", art: { bg: "consular-hall", who: "embassy-maid" }, ignore: ({ truth }) => truth ? "defend" : "protest",
        d: ({ truth }) => truth ? "The maid shows you her bank records: a third of what the visa form promised. Your deputy signed the form." : "The maid's records show she was paid in full. The charge looks like the host police overreaching.",
        opts: ({ truth }) => truth ? [
          { id: "pay", l: "Pay her the difference, and move your deputy to the UN", fx: { host: 5, abuja: -3 }, end: "good", tag: "maid_paid", helped: true, out: "The maid is paid. Your deputy is safe in a post with full immunity." },
          { id: "defend", l: "Defend your deputy anyway", fx: { host: -6, abuja: 4 }, end: "bad", tag: "maid_defended", out: "The maid's lawyer reads her bank records to the press." },
        ] : [
          { id: "protest", l: "Protest the strip-search formally", fx: { host: -2, abuja: 6 }, end: "good", tag: "maid_cleared", out: "The charges are dropped. The police apologise, briefly." },
        ] },
      row: { t: "The row escalates", art: { bg: "embassy-exterior" }, ignore: "keep",
        d: "{country} removes the security barriers outside your embassy and audits your local staff's pay. Several of your own local staff are paid below their minimum wage too.",
        opts: [
          { id: "fix", l: "Raise your local staff's pay", fx: { diaspora: 2, host: 3, abuja: -2 }, end: "mixed", tag: "maid_row", out: "Hard to lecture anyone with your own payroll in the papers." },
          { id: "keep", l: "Keep the row going", fx: { host: -6, trade: -1 }, end: "bad", tag: "maid_row", out: "A trade mission is cancelled." },
        ] },
      deal: { t: "A quiet deal", art: { bg: "foreign-ministry-meeting", who: "host-minister" }, ignore: "fine",
        d: "She leaves for a UN post with immunity; the maid is paid in full. Abuja thinks you were soft.",
        opts: [ { id: "fine", l: "Accept it", fx: { abuja: -2 }, end: "mixed", tag: "maid_deal", out: "Nobody won, which is how quiet deals look." } ] },
    } },

  shot: { nm: "A shot from the embassy", art: { bg: "embassy-exterior" },
    where: "London, 1984: a shot fired from the Libyan embassy killed police officer Yvonne Fletcher. After an 11-day siege the staff left under diplomatic immunity, and Britain broke off relations.",
    learn: "Embassy premises are inviolable (Vienna Convention, Article 22): host police cannot enter without the ambassador's consent. Only Nigeria can waive a diplomat's immunity.",
    left: "the shooting outside the embassy is unresolved",
    stages: {
      open: { t: "A shot from a window", art: { scene: "embassy-siege" }, ignore: "hold",
        d: "Exiles protested outside the embassy. Someone fired from a first-floor window, and a host policewoman, Constable Mara Lind, is dead. Armed police surround the building. Inside are 30 staff, including whoever fired.",
        opts: [
          { id: "find", l: "Find the shooter and ask Abuja to waive his immunity", story: "found the embassy shooter and asked Abuja to waive his immunity", fx: { abuja: -6, host: 6 }, next: "found", out: "You question every officer on the first floor." },
          { id: "search", l: "Let the host police search the building", story: "let the host police search the embassy", fx: { abuja: -10, host: 10 }, next: "search", out: "You open the doors yourself." },
          { id: "hold", l: "Keep the building sealed, under the Vienna Convention", story: "kept the embassy sealed after the shooting", fx: { abuja: 4, host: -10 }, next: "siege", out: "The doors stay shut." },
        ] },
      found: { t: "A security attaché confesses", art: { bg: "embassy-office", who: "soldier" }, ignore: "support",
        d: "A security attaché admits firing 'over the crowd'. Abuja waives his immunity, angrily. He will stand trial in {city}.",
        opts: [ { id: "support", l: "Make sure he has consular help like any Nigerian", fx: { host: 4, diaspora: 2 }, end: "good", tag: "shot_trial", out: "He is convicted of manslaughter. Constable Lind's colleagues salute you at the court steps." } ] },
      search: { t: "Abuja calls it a surrender", art: { bg: "embassy-office", who: "foreign-minister-nigeria" }, ignore: "go",
        d: "The host police find the gun. Abuja calls it a breach of Nigerian sovereignty and summons you home for 'consultations'.",
        opts: [ { id: "go", l: "Go home for consultations", fx: { abuja: -2, host: 4 }, end: "mixed", tag: "shot_searched", out: "Two weeks in Abuja. You come back. The host remembers what you did." } ] },
      siege: { t: "Eleven days", art: { bg: "embassy-exterior", obj: "memorial-flowers" }, ignore: "leave",
        d: "Eleven days later the host lets all 30 staff leave under immunity. The gun leaves with them. The constable's colleagues line the street in silence.",
        opts: [
          { id: "leave", l: "Leave with them", fx: { host: -10, diaspora: -4 }, end: "bad", tag: "shot_siege", out: "Relations are frozen. Nigerians in {city} pay for it." },
          { id: "stay", l: "Stay behind and help the investigation", fx: { host: 6, abuja: -4 }, end: "mixed", tag: "shot_stayed", out: "You give the police every name. Abuja asks whose side you are on." },
        ] },
    } },

  guest: { nm: "The guest in Room 4", inherited: true, art: { bg: "embassy-office", who: "reporter" },
    where: "London, 2012–2019: Julian Assange lived in Ecuador's embassy for almost seven years. A new government in Ecuador ended his asylum, and British police carried him out.",
    learn: "Diplomatic asylum is not generally recognised outside Latin America, but host police still cannot enter an embassy (Article 22). A guest can stay for years.",
    left: "the journalist is still living in Room 4",
    stages: {
      open: { t: "The guest in Room 4", art: { bg: "embassy-office", who: "journalist-guest" }, ignore: "keep",
        d: "Your predecessor took in Teodor Vasko, a {country} journalist wanted for publishing leaked military files. He has lived in the embassy's Room 4 for a year, and Abuja has forgotten why it said yes.",
        opts: [
          { id: "passage", l: "Negotiate safe passage to a third country", story: "negotiated for the guest in Room 4", fx: { host: 2 }, next: ({ S }) => S.host >= 50 ? "passage_ok" : "passage_no", wait: [1, 2], out: "You start the slow conversation with the host's foreign ministry." },
          { id: "keep", l: "Keep him: Nigeria gave its word", story: "kept Nigeria's word to the guest in Room 4", fx: { host: -3, diaspora: 1 }, next: "year2", wait: [2, 2], out: "Room 4 stays occupied." },
          { id: "out", l: "End his refuge", fx: { host: 8, abuja: 2 }, story: "ended the refuge of the guest in Room 4", next: "handed", out: "You tell him he has a week." },
        ] },
      year2: { t: "Year two", art: { bg: "embassy-exterior", who: "journalist-guest" }, ignore: "rules",
        d: "He broadcasts from your balcony, quarrels with your staff, and a police van has sat outside the gate day and night for a year.",
        opts: [
          { id: "rules", l: "Set house rules: no broadcasts", fx: { host: 3 }, next: ({ S }) => S.host >= 50 ? "passage_ok" : "passage_no", out: "He sulks. The broadcasts stop." },
          { id: "out", l: "End his refuge", fx: { host: 6 }, next: "handed", out: "You tell him he has a week." },
        ] },
      passage_ok: { t: "Safe passage", art: { bg: "evacuation-airport" }, ignore: "see",
        d: "A third country agrees to take him, and the host agrees not to stop the car. He leaves at dawn.",
        opts: [ { id: "see", l: "See him off at the airport", fx: { host: 3, diaspora: 2 }, end: "good", tag: "guest_free", out: "Nigeria kept its word, and the host kept its face." } ] },
      passage_no: { t: "No safe passage", art: { bg: "foreign-ministry-meeting", who: "host-minister" }, ignore: "keep",
        d: "The host refuses: 'He will be arrested the moment he steps out.'",
        opts: [ { id: "keep", l: "Keep him another year", fx: { host: -3 }, end: "mixed", tag: "guest_stays", out: "Room 4 is your successor's problem now." } ] },
      handed: { t: "Carried out", art: { scene: "carried-out" }, ignore: "accept",
        d: "Host police carry him out of the embassy on camera. Press-freedom groups say Nigeria's word is worthless; the host's foreign minister thanks you warmly.",
        opts: [ { id: "accept", l: "Say Nigeria's hospitality had limits", fx: { trade: 1, host: 3, abuja: -2 }, end: "mixed", tag: "guest_handed", out: "A trade deal moves the following week. The photo of him being carried out never goes away." } ] },
    } },

  cholera: { nm: "Cholera downstream", truth: .65, art: { bg: "idp-camp", who: "soldier" },
    where: "Haiti, 2010: cholera brought by UN peacekeepers spread from their camp's sewage and killed about 10,000 people. The UN apologised in 2016.",
    learn: "Nigeria has sent troops on UN peacekeeping missions since 1960. Peacekeepers' discipline is usually left to their own government under an agreement with the host country.",
    left: "the cholera tests are still being argued over",
    stages: {
      open: { t: "Cholera downstream of the camp", art: { scene: "peacekeeper-camp" }, ignore: "deny",
        d: "Cholera has broken out in villages downstream of the Nigerian peacekeepers' camp in the north of {country}. Sixty are dead. Locals say the camp's latrines drain into the river. Tests will take weeks.",
        opts: [
          { id: "admit", l: "Say it may be the camp, and fund treatment", story: "admitted the cholera might come from the Nigerian camp", fx: { host: 5, abuja: -6 }, next: "test", reveal: true, out: "The army calls your statement 'premature'." },
          { id: "fix", l: "Fix the latrines now; say nothing yet", story: "fixed the camp latrines quietly", fx: { abuja: 1 }, set: { fixed: true }, next: "test", reveal: true, out: "Engineers dig new pits over a weekend." },
          { id: "deny", l: "Deny it: our soldiers were screened", story: "denied the camp caused the cholera", fx: { abuja: 4, host: -3 }, set: { denied: true }, next: "test", reveal: true, out: "Abuja repeats your words at the UN." },
        ] },
      test: { t: "The test results", art: { scene: "village-clinic-tent" }, ignore: ({ truth, A }) => truth ? (A.flags.denied ? "keep" : "pay") : "publish",
        d: ({ truth }) => truth ? "The genetic tests match a cholera strain from the region your soldiers came from. The camp's sewage was the source." : "The tests show a local strain. The camp was not the source, though it had been badly run.",
        opts: ({ truth, A }) => truth ? (A.flags.denied ? [
          { id: "sorry", l: "Apologise and pay compensation", fx: { host: 3, abuja: -6 }, end: "mixed", tag: "cholera_apology", out: "Late, but said. The villages accept the clinics, not the words." },
          { id: "keep", l: "Keep denying", fx: { host: -10, diaspora: -3 }, end: "bad", tag: "cholera_denied", out: "The UN publishes the report without your comment." },
        ] : [
          { id: "pay", l: "Pay compensation and build clean water", fx: { host: 6, abuja: -3 }, end: "good", tag: "cholera_owned", helped: true, out: "Wells in eleven villages. The chief invites the battalion to his daughter's wedding." },
        ]) : [
          { id: "publish", l: "Publish the results", fx: { host: 2, abuja: 3 }, end: "good", tag: "cholera_cleared", out: "Cleared, and the latrines are better than they were." },
        ] },
    } },

  list: { nm: "180 seats", art: { bg: "evacuation-airport" }, excludes: ["evacuate"],
    where: "Kabul, 2021: evacuation flights left with whatever the lists and the gates allowed. Families were split, and people with the right to leave were left behind.",
    learn: "In a crisis abroad the embassy decides who is a Nigerian citizen. Spouses and children without Nigerian papers need the host's exit clearance.",
    left: "people on your evacuation list are still waiting",
    stages: {
      open: { t: "180 seats, 400 names", art: { scene: "airlift-evacuation", obj: "evacuation-list" }, ignore: "gate",
        d: "Riots have closed {city}'s airport to everyone but evacuation flights. Your one chartered plane has 180 seats and your list has 400 names: citizens, foreign spouses, and children with incomplete papers. Families refuse to split.",
        opts: [
          { id: "families", l: "Get the host to clear whole families first", story: "kept families together on the evacuation list", fx: {}, next: ({ S }) => S.host >= 50 ? "cleared" : "window", wait: [0, 0], out: "You call the host's interior ministry at midnight." },
          { id: "cleared", l: "Fly the 180 who are cleared now", story: "flew the cleared passengers first", fx: { abuja: 3, diaspora: -2 }, next: "second", out: "The plane leaves full. Families watch it go." },
          { id: "gate", l: "First come, first served at the gate", story: "left the evacuation to the gate", fx: { diaspora: -4 }, next: "gate", wait: [0, 0], out: "The gates open at dawn." },
        ] },
      cleared: { t: "Families cleared in a day", art: { scene: "families-boarding" }, ignore: "fly",
        d: "Because the host's ministry trusts you, it clears whole families in a day. 180 fly, families together; the rest wait for a second plane.",
        opts: [ { id: "fly", l: "Fly them, and ask Abuja for a second plane", fx: { diaspora: 4 }, helped: true, next: "second", out: "Wheels up at noon, families together." } ] },
      window: { t: "The window closes", art: { bg: "evacuation-airport" }, ignore: "second",
        d: "Clearing families took too long and the airport closed your slot. The plane left with 90 people.",
        opts: [ { id: "second", l: "Beg Abuja for a second plane", fx: { abuja: -2 }, next: "second", out: "The Foreign Minister says he will try." } ] },
      gate: { t: "The crush at the gate", art: { scene: "gate-crush" }, ignore: "second",
        d: "The crowd at the gate crushed two people. The strongest got seats; a pregnant woman with the right papers did not. The video reaches Abuja before the plane does.",
        opts: [ { id: "second", l: "Order a second plane and a proper list", fx: { diaspora: -2 }, next: "second", out: "Your staff start the list again, by hand." } ] },
      second: { t: "The second plane", art: { bg: "evacuation-airport" }, ignore: "fill",
        d: ({ S }) => S.diaspora >= 55 ? "The community union finds every family on your list and brings them to the airport in its own buses. A Nigerian businessman pays for the second plane, and wants the credit." : "Abuja sends a second plane. Nobody knows where half the families on your list are: the phones are dead.",
        opts: ({ S }) => [ { id: "fill", l: "Fill the plane", fx: S.diaspora >= 55 ? { diaspora: 8, abuja: 2 } : { diaspora: 2 }, helped: true, end: S.diaspora >= 55 ? "good" : "mixed", tag: S.diaspora >= 55 ? "evac_done" : "evac_partial", out: S.diaspora >= 55 ? "Every name on the list is accounted for." : "The plane leaves with 140 people. 60 names are still missing." } ] },
    } },
};

/* ── The engine ── */
export const ARCS = { lga: LGA_ARCS, senate: SENATE_ARCS, amb: AMB_ARCS };
const PLAN = { lga: { count: 3, opens: [1, 2, 4], last: 6 }, senate: { count: 3, opens: [1, 3, 5], last: 8 }, amb: { count: 3, opens: [1, 2, 4], last: 6 } };
export const ARC_MAX_PER_TURN = 2;

// Every tag an arc can leave, by career (for the player's record).
export const arcTagList = (career) => { const out = new Set(); const walk = (o) => { if (o && o.tag) out.add(o.tag); };
  Object.values(ARCS[career] || {}).forEach(def => Object.values(def.stages).forEach(st => { const opts = typeof st.opts === "function" ? [true, false].flatMap(truth => [true, false].flatMap(denied => st.opts({ truth, A: { flags: { denied } }, S: { diaspora: denied ? 80 : 20 } }))) : st.opts; opts.forEach(walk); }));
  return [...out]; };

/* The notebook entry for an arc: the lesson, then where it really happened. */
export const arcNote = (def) => def.learn + " Where it happened: " + def.where;
export const arcNotes = (career) => Object.fromEntries(Object.entries(ARCS[career] || {}).map(([id, def]) => ["arc_" + id, arcNote(def)]));

/* The run's plan: which arcs, and when each opens. from: the first turn
   still to come (a save that predates the arcs plans from where it is). */
export const arcPlan = (seed, career, { from = 1 } = {}) => {
  const P = PLAN[career], defs = ARCS[career]; if (!P || !defs) return {};
  const r = seeded(seed, "arcs", career), ids = Object.keys(defs), inh = ids.filter(id => defs[id].inherited), rest = ids.filter(id => !defs[id].inherited);
  const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const picked = [...(inh.length && r() < .6 ? [shuffle(inh)[0]] : []), ...shuffle(rest)].slice(0, P.count);
  const opens = P.opens.map(n => Math.max(n, from)).filter(n => n <= P.last - 1);
  const out = {};
  picked.slice(0, opens.length).forEach((id, i) => { const def = defs[id]; out[id] = { stage: "open", due: opens[i], truth: def.truth != null ? r() < def.truth : null, flags: {}, hist: [], done: false }; });
  return out;
};
// Content an arc replaces while it runs (ids to mark seen in the career's own pools).
export const arcExcludes = (career, arcs) => Object.keys(arcs || {}).flatMap(id => ((ARCS[career] || {})[id] || {}).excludes || []);

// The arcs due this turn, oldest first, at most two.
export const arcItems = (S, n, career) => Object.entries(S.arcs || {}).filter(([id, A]) => A && !A.done && A.stage && A.due <= n && (ARCS[career] || {})[id])
  .sort((a, b) => a[1].due - b[1].due || (a[0] < b[0] ? -1 : 1)).slice(0, ARC_MAX_PER_TURN).map(([id]) => ({ k: "arc", id }));

const ctxOf = (S, id, extra = {}) => { const A = (S.arcs || {})[id] || { flags: {} }; return { A, S, truth: A.truth, f: A.flags || {}, ...extra }; };
const val = (x, c) => typeof x === "function" ? x(c) : x;

/* What the player sees: the stage's title, text, art, clues so far, and the
   options (each with available + why when it cannot be taken). */
export const arcView = (S, id, career) => {
  const def = (ARCS[career] || {})[id], A = (S.arcs || {})[id]; if (!def || !A || !A.stage) return null;
  const st = def.stages[A.stage]; if (!st) return null;
  const c = ctxOf(S, id), opts = (val(st.opts, c) || []).map(o => ({ ...o, available: !o.need || !!o.need(c) }));
  return { id, def, A, key: A.stage, t: st.t, d: val(st.d, c), art: val(st.art, c) || def.art, clues: A.clues || [], clue: st.clue || null, inherited: !!def.inherited && A.stage === "open", opts, ignore: val(st.ignore, c) || (opts[opts.length - 1] || {}).id };
};

/* Take an option. r: a seeded roll for chance branches. Returns the arc's new
   state, the option's effects for the career to apply, and the outcome. now:
   the next stage follows straight away (put it at the front of the queue). */
export const arcChoose = (S, id, optId, n, r, career) => {
  const v = arcView(S, id, career); if (!v) return null;
  const o = v.opts.find(x => x.id === optId) || v.opts.find(x => x.id === v.ignore) || v.opts[v.opts.length - 1];
  const flags = { ...(v.A.flags || {}), ...(o.set || {}) };
  const A1 = { ...v.A, flags, hist: [...(v.A.hist || []), v.key + ":" + o.id], clues: v.clue && !(v.A.clues || []).includes(v.clue) ? [...(v.A.clues || []), v.clue] : (v.A.clues || []) };
  const nx = typeof o.next === "function" ? o.next({ A: A1, S, r, truth: A1.truth }) : o.next;
  const w = o.wait || [1, 1], wait = w[0] + Math.floor(r() * (w[1] - w[0] + 1));
  const A2 = nx ? { ...A1, stage: nx, due: n + wait, revealed: A1.revealed || !!o.reveal } : { ...A1, stage: null, done: true, end: o.end || "mixed", tag: o.tag || null, endedAt: n };
  return { A: A2, o, fx: o.fx || {}, cost: o.cost || 0, npc: o.npc || null, elec: o.elec || 0, story: o.story || null, out: o.out || "Done.", end: nx ? null : (o.end || "mixed"), tag: nx ? null : (o.tag || null), now: !!nx && wait === 0, seen: o.seen || [], fixed: !!o.fixed && !nx, law: !!o.law, helped: !!o.helped, learnKey: nx ? null : "arc_" + id };
};
// What happens when the stage is left to staff, or put off.
export const arcIgnore = (S, id, n, r, career) => { const v = arcView(S, id, career); return v ? arcChoose(S, id, v.ignore, n, r, career) : null; };

// Arcs still open when the term ends, as lines for the verdict.
export const arcOpen = (S, career) => Object.entries(S.arcs || {}).filter(([id, A]) => A && !A.done && A.stage && A.hist && A.hist.length && (ARCS[career] || {})[id]).map(([id]) => ({ id, nm: ARCS[career][id].nm, left: ARCS[career][id].left }));
// Tags from arcs that ended, for the player's record.
export const arcTags = (S) => Object.values(S.arcs || {}).filter(A => A && A.done && A.tag).map(A => A.tag);

/* What earlier offices leave a new governor on day one (arcs only; the
   chairmanship's own callbacks are in chairmanEchoes). Chairman and senator
   tags count in their own state; an ambassador's anywhere. */
const ECHO = {
  water_poisoned: ["The town whose taps ran brown under your chairmanship still tests its children's blood, and your opponents remind everyone.", { app: -2 }],
  fuel_fire: ["The council store fire from your chairmanship is still the first thing people mention about you.", { app: -3 }],
  fuel_cleared: ["The headmistress whose school sat beside those fuel drums campaigns for you.", { app: 1 }],
  vaccine_measles: ["Mothers in the LGA you chaired remember the measles season.", { app: -2 }],
  vaccine_trust: ["Health workers from your old LGA tell the story of how you won back the mothers' trust.", { app: 1 }],
  rats_cobra: ["Your old LGA still calls you the chairman who paid for rats.", { app: -1 }],
  okada_lanes: ["Okada riders from your old LGA ride in convoy at your rallies.", { app: 1 }],
  horizon_exposed: ["The school bursars you cleared in the Senate are campaigning for you in every LGA.", { app: 2 }],
  installers_death: ["The solar fund that killed a young installer still carries your name.", { app: -2 }],
  robodebt_defended: ["Young people remember the debt letters you defended in the Senate.", { app: -2 }],
  fakenews_abused: ["Bloggers arrested under your false-information law are your loudest critics online.", { app: -2 }],
  ash_scandal: ["“Cash for ash” posters follow you from the Senate.", { app: -2 }],
  comma_drivers: ["Drivers who won their overtime under your act line the road at your rallies.", { app: 1 }],
  evac_done: ["Families you flew home from abroad as ambassador are among your volunteers.", { app: 2 }],
  cholera_owned: ["People remember the ambassador who told the truth about the cholera.", { pStab: 2 }],
  spouse_fled: ["The story of the diplomat's wife you flew home still follows you.", { app: -1 }],
  guest_handed: ["Press-freedom groups remember the journalist you handed over.", { app: -1 }],
};
export const arcEchoes = (rec, state) => {
  const offs = (rec && rec.offices) || [], lines = [];
  const last = (office) => offs.filter(o => o.office === office && (office === "ambassador" || o.state === state)).slice(-1)[0];
  ["chairman", "senator", "ambassador"].forEach(office => { const o = last(office); if (!o) return; (o.tags || []).forEach(t => { if (ECHO[t]) lines.push({ text: ECHO[t][0], fx: ECHO[t][1], tag: t }); }); });
  return lines;
};
export const ARC_ECHO_TAGS = Object.keys(ECHO);
