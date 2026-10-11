# State House Compound (landscape hub map)
- compound-base.webp / compound-base-night.webp — 2560×1440 district plate, 12 empty plots (Government House centre).
- buildings/b01–b12 — transparent isometric cut-outs (b01, b02 large ~900×760; others ~640×540): government house, assembly, finance, high court, northern palace, southern palace, party secretariat, state secretariat, electoral commission, anti-graft office, police HQ, market.
- overlays/ — protest, press, motorcade, crowd-cheering, scaffold (~360×260, transparent).
High-res sources: src/assets/art-expansion/compound/. Not yet wired into the game.

## Motorcade supplement (v2 road layout)
- compound-base.webp / compound-base-night.webp now use the v2 straight isometric road grid: one connected network, central roundabout with 4 exits, 12 plots with driveways and parking bays (4 corner lawns unused).
- compound-roads-guide.png — 2560×1440: magenta road centre-lines, green junctions, yellow numbered parking bays 1–12. compound-roads.json — the same points in pixels.
- motorcade/m-convoy-ne|nw|se|sw.webp — 420×300, transparent, one convoy (pilot car, 2 SUVs, van), centred. nw/sw are mirrors of ne/se.
- motorcade/m-convoy-parked.webp — doors open, aide stepping out. m-siren-glow.webp (96×48), m-dust.webp (120×80).

## Now in use: Lovable's painted map
The game uses `compound-full.webp` (1500×850), a single painted map with all 12 buildings in place. Building boxes, roads and parking bays are hard-coded in `game/seat-of-power.jsx` (`HUB_BUILDINGS`, `HUB_NODES`, `HUB_ROADS`), in that image's pixels. The empty plates and the v2 route guide/JSON above are kept only for reference.
