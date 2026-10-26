# Lovable art: the councils, trade and exports

**Delivered 26 Oct (all 35) and installed; where each is used is in public/art/README.md.**

The councils now sit around a table (CouncilTable), and the game has trade (the President) and exports (the governor). Everything below already works with existing pictures or a pressed-wax placeholder. When these files arrive, drop them in at the paths given and they replace the stand-ins.

Style: as the rest of the pack (flat-shaded cartoon, bold outlines). Fictional people only, and no real seals, coats of arms or flags. WebP.

## 1. Wax seals, one per council (most important)
Shown beside each council's name and pressed into the centre of the table. Format: transparent, square, 512×512. Make them match the existing seal-*.webp set (a wax disc with a raised emblem and a rim).

| File (public/art/icons/) | Council | Wax colour | Emblem |
|---|---|---|---|
| seal-fec.webp | Federal Executive Council | deep green, gold rim | a domed council building |
| seal-nsc.webp | National Security Council | charcoal, brass rim | a shield with crossed swords |
| seal-eac.webp | Economic Advisory Council | amber, pale-gold rim | a rising line chart over a ship's wheel |
| seal-exco.webp | State Executive Council | royal blue, gold rim | a state house with columns |
| seal-rulers.webp | Traditional Rulers Council | purple, gold rim | a beaded crown and a staff |
| seal-econ.webp | State Economic Council | brown, peach rim | a cocoa pod and a shipping container |

## 2. Council chambers (the room behind the table)
Format: 1280×720 backgrounds, no people, the table itself not needed (the game draws it).

| File (public/art/backgrounds/) | Used for |
|---|---|
| council-table-federal.webp | the FEC and the Economic Advisory Council: a long wood-panelled chamber in Aso Rock, green chairs, a national-green carpet |
| council-table-security.webp | the National Security Council: a dim situation room with wall screens showing a map of fronts |
| council-table-state.webp | the governor's Executive Council and State Economic Council: a Government House council room |
| council-table-palace.webp | the Traditional Rulers Council in the South: a palace hall with carved pillars and beaded thrones (the emir's courtyard already covers the North) |

## 3. New portraits (waist-up, transparent, 700px tall)
Each sits around a table today in a borrowed portrait.

| File (public/art/characters/) | Who | Stand-in now |
|---|---|---|
| trade-minister.webp | Minister of Industry, Trade and Investment (a woman in a tailored suit) | commissioner art |
| customs-comptroller.webp | Comptroller-General of Customs (a man in the green-and-gold Customs uniform and peaked cap) | revenue-officer |
| farmers-association-chair.webp | Chair of the Farmers' Association (a middle-aged farmer in a cap, a sack of grain beside him) | village-head |
| exporter.webp | A state exporter (a young businesswoman with a clipboard at a warehouse) | investor-nigerian |
| chief-economic-adviser.webp | The President's Chief Economic Adviser (glasses, folder of charts) | adviser-southwest-female |
| chief-of-defence-staff.webp | Chief of Defence Staff (a general with a red-banded cap), for the Security Council | not seated yet |
| dss-director-general.webp | Director-General of the State Security Service (plain dark suit, earpiece) | not seated yet |

Moods are welcome for the first three: -pleased and -angry, like the existing manufacturers-rep set.

## 4. Trade and export scenes (1280×720)
Shown on the trade and export storyline results.

| File (public/art/scenes/) | Scene |
|---|---|
| deep-seaport.webp | a new deep seaport with gantry cranes and a container ship (the East's seaport opening) |
| dry-port-kano.webp | an inland container depot in the North, trucks and stacked containers under a harmattan sky |
| cargo-rail.webp | a cargo train of containers crossing the savanna |
| export-containers.webp | farmers loading sacks of cocoa or sesame into a shipping container |
| aflatoxin-lab.webp | a produce-testing lab: a technician with a sample tray of beans |
| border-smuggling.webp | rice sacks moved by motorbikes along a bush path at a land border at dusk |
| bdc-street.webp | money-changers with bundles of notes at a busy roadside |
| factory-closed.webp | a padlocked factory gate with laid-off workers outside |

## 5. Icons (256×256, transparent)
| File (public/art/icons/) | Where |
|---|---|
| icon-trade.webp | the Economic Advisory Council's figures |
| icon-exports.webp | the governor's export earnings |
| icon-reserves.webp | the reserves figure |
| icon-food-prices.webp | the food price figure |

Once any of these are delivered, tell Claude and they will be wired in (the seals go into SEAL_ART in game/seat-of-power.jsx; the art-usage test keeps every shipped picture in use).
