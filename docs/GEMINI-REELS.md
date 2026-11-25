# Gemini brief: project reels (3–4 seconds each)

When a player finishes a project, the game plays a short film of the finished work: the new road, the bridge, the
clinic. This replaces the empty "The ribbon is cut!" card. One film per project type. A second version of the same
type is welcome, because the game alternates between them.

**How to use this brief.** In Gemini (Veo video), paste the shared style block, then one prompt from the table. Make
each film, download it, and send the files to Claude with the names below. Claude trims them, checks them and
installs them.

## The shared style (paste before every prompt)

> Cinematic, warm and hopeful. A slow drone or dolly shot of a brand-new public project in a Nigerian town, just
> opened. Late-afternoon golden light. Real, everyday Nigerian life around it: people walking, traders, okadas,
> keke napep and yellow buses where they fit, green vegetation and red earth. Photorealistic with soft colours,
> like a well-made government documentary. One smooth camera move, no cuts. 16:9.
> **No text, no words, no signs with lettering, no logos, no flags with emblems, no watermarks.** No famous or
> recognisable people. Nobody looks into the camera. Nothing violent or sad.

## Wanted: transport films (25 Nov 2026)

Owner: "we need videos for the rail, and a new programme called Bus Terminals… for the presidency it is interstate; for a state it could be intra-state rail or metro." Use the shared style block, then one prompt each. Claude adds each to REELS when the file arrives.

| File | Plays for | Prompt (after the style block) |
|---|---|---|
| rail.mp4 (**delivered 25 Nov 2026**; the letterbox bars of its first seconds cropped away) | The President's railway (the Lagos–Kano standard-gauge line, any federal railway) | A long modern passenger train, green and white with no lettering, glides along a new standard-gauge line across open savannah, then past a town with a new station. Passengers wave from the windows; children by the track wave back. The camera tracks alongside the train, then rises to show the line running to the horizon. |
| metro.mp4 (**delivered 25 Nov 2026**, bars cropped) | A state's Intra-State Rail Line (light rail or metro) | A sleek light-rail train, two carriages, plain colours with no lettering, pulls into a new elevated station in a busy Nigerian city at sunset. Commuters with bags step off; below, the road traffic is jammed with danfo buses while the train moves freely above it. The camera follows the train along its viaduct over the city. |
| busterminal.mp4 (**delivered 25 Nov 2026**) | A state's Modern Bus Terminals | A new bus terminal in a Nigerian town: a big shaded steel roof, clean bays with yellow buses lined up, travellers with luggage queuing at ticket windows, traders selling snacks in neat kiosks, a uniformed attendant waving a bus out. The camera glides in under the roof from the entrance. |
| interstatebus.mp4 | The President's Interstate bus terminals | A large interstate bus terminal at dawn: rows of long-distance coaches (plain liveries, no company names) loading luggage, families saying goodbye, passengers boarding for the journey across the country. The camera rises from the boarding bays to show the coaches pulling out onto the highway. |

## Delivered: irrigation.mp4 (23 Nov 2026)

In the game: it plays when the Irrigation Network or the Dry-Season Irrigation Scheme is finished. The prompt used:

For the Irrigation Network programme (and the Dry-Season Irrigation Scheme). Until it arrives, the game plays the dam film. Use the shared style block, then:

> A wide irrigation scheme in the dry season in northern Nigeria: a long concrete canal carries water from a small earth dam, and gates open so the water runs into green fields of rice, onions and tomatoes, while the land beyond is dry and brown. Farmers in caps and wrappers work the rows, a solar pump hums beside a channel, and white egrets land in the wet fields. The camera follows the water along the canal and rises over the green patchwork. Harmattan haze, late-afternoon golden light.

Claude adds `irrigation: 1` to REELS when the file is in public/art/reels/; `REEL_BY_POLICY` already sends both irrigation programmes to it.

## Delivered 23 Nov 2026 (third batch)

- `housing.mp4` (a new estate of bungalows, families carrying boxes in) and `industrial.mp4` (an industrial park, trucks through the gate). Re-encoded to 960×540 with no sound, as the others.
- Still wanted, in this order: bridge, university (also used for the polytechnic and the college of education), stadium, tourist site.

## Delivered 22 Nov 2026 (second batch)

- `power.mp4` (a town lights up at night, the market first): power plants, solar, gas and mini-grids. **Rural Electrification plays the village film, `dam.mp4`, instead (owner, 25 Nov 2026).**
- `seaport.mp4` and `refinery.mp4`. The refinery film was cut from the second half of a 20-second clip that also held the seaport. A gas pipeline borrows the refinery film.
- **`vehicles.mp4` (the patrol fleet): installed at the owner's request (22 Nov 2026), badges and all.** If a cleaner version is wanted later: The pickups carry real Toyota badges and the building has a crest, and the game uses no real logos. Ask Gemini again with: *"pickups with plain smooth grilles, no manufacturer badge or emblem anywhere; the building has no crest, sign or lettering"*.

## Night films (dam.mp4, power.mp4)

**Delivered 22 Nov 2026:** `dam.mp4` is in the game and also plays for power projects (`REEL_SHARE.power`), so `power.mp4` is optional now.

For these two, replace "Late-afternoon golden light" in the style block with "Night, then the lights come on". Until the films arrive, the game shows a lights-on animation over `scenes/national-grid-dark` (the result card's `o.lights`). When `dam.mp4` or `power.mp4` is installed, add `dam: 1` or `power: 1` to `REELS` in game/systems/projects.js, and the film plays instead.

## The films

| File | Project | Prompt (after the style block) |
|---|---|---|
| road.mp4 | Road | A freshly tarred two-lane road with bright white lines and kerbs, curving through a town into green hills. Cars and okadas drive on it smoothly. The camera glides low along the road, then rises. |
| bridge.mp4 | Bridge | A new concrete bridge across a wide brown river, with cars and a yellow bus crossing. Fishermen in canoes below. The camera flies alongside the bridge from one bank to the other. |
| hospital.mp4 | Hospital | A clean new two-storey general hospital, cream walls with green trim. An ambulance pulls up and nurses in white walk in. The camera moves slowly towards the entrance. |
| school.mp4 | Primary school | A new primary school block with blue doors and a playground. Children in uniforms run out into the yard. The camera rises above the roof. |
| secondary.mp4 | Secondary school | A new secondary school with two classroom blocks and a football field. Students in uniforms walk across the compound with books. A slow push-in. |
| nursing.mp4 | School of nursing | A new school of nursing, with students in white uniforms and caps walking between buildings. A slow sideways dolly. |
| coe.mp4 | College of education | A new college of education campus with lecture halls and trees, and student teachers carrying files. A slow aerial pass. |
| polytechnic.mp4 | Polytechnic | A new polytechnic campus with workshops and lecture halls, and students in overalls at a workshop door. A slow aerial pass. |
| university.mp4 | University | A new university campus with a modern library, wide walkways and students on the lawns. A slow rising aerial shot. |
| water.mp4 | Water scheme | A new borehole and an overhead water tank on a steel stand in a village. Women and children fill buckets at clean taps, laughing. The camera lowers from the tank to the taps. |
| dam.mp4 | Dam (the 3,000 MW hydropower dam, and state dams) | **Night, not golden hour (owner, 21 Nov 2026).** A Nigerian village at night in total darkness: only moonlight, a kerosene lantern in one doorway, the outlines of zinc roofs and palm trees. The camera holds still for a second. Then the power comes on: the first bulb in a house near the camera flickers and glows, then lights spread outward street by street, house by house, to the far edge of the village, and the streetlights along the road come on in a line. People step out of their doorways into the light and children run into the street cheering. A slow push-in. |
| power.mp4 | Power plant (solar, gas, mini-grids, rural electrification) | The same idea as dam.mp4, a different place: a small town at dusk in darkness, then lights spread out from the power station at the edge of town across every street, and a market lights up with traders cheering. One slow aerial move. |
| market.mp4 | Market | A new covered market with rows of clean stalls under a steel roof. Traders arrange tomatoes, peppers and fabric, and buyers walk the aisles. The camera moves down a busy aisle. |
| housing.mp4 | Housing estate | A new estate of neat bungalows with paved streets and young trees. Families carry boxes into their new homes. A slow aerial pass. |
| vehicles.mp4 | Patrol fleet | A row of new patrol pickups in plain dark blue (no lettering) parked in front of a police station. The engines start and the lights come on. A slow dolly along the row. |
| cctv.mp4 | CCTV network | New CCTV cameras on poles above a busy junction at dusk, then a control room with screens showing the streets. A slow push-in. |
| landfill.mp4 | Landfill | A modern, well-managed waste site with fenced cells, a compactor and green buffer trees, and a clean town in the distance. A slow aerial pass. |
| industrial.mp4 | Industrial park | A new industrial park with warehouses and factories, and trucks entering through the gate. A slow aerial sweep. |
| stadium.mp4 | Stadium | A new stadium filled with a cheering crowd, with green grass and floodlights. The camera rises from the stands over the pitch. |
| esports.mp4 | Esports arena | A new esports arena with rows of glowing gaming stations and young players with headsets. A slow dolly down the rows. |
| tourist.mp4 | Tourist attraction | A restored waterfall or hilltop viewpoint with a new walkway and railings, where visitors take photos. A slow aerial reveal. |
| rail.mp4 | Railway | A modern passenger train on a new standard-gauge line, crossing open savannah past a village. The camera follows alongside. |
| pipeline.mp4 | Gas pipeline | A new gas pipeline running across countryside to a clean processing station. A slow aerial pass along the line. |
| refinery.mp4 | Modular refinery | A compact new modular refinery with tanks and towers by a creek, with workers in hard hats. A slow aerial pass. |
| seaport.mp4 | Deep seaport | A new deep seaport with container cranes loading a ship. A slow aerial sweep across the quay. |
| airport.mp4 | Airport terminal | A new airport terminal with glass walls, and a plane taxiing past. A slow aerial pass towards the terminal. |

That is 26 films. For a second version of one, name it with `-2` (`road-2.mp4`), ideally in another part of the
country (for example, a road through northern savannah instead of southern hills).

## The files

- MP4 (H.264), 16:9, at least 1280 × 720, and **3 to 4 seconds** (Claude can trim a longer clip).
- No sound needed. The game plays the film muted.
- Keep each file under 2 MB if Gemini allows. Claude compresses it otherwise.
- Check before sending that there is no text, sign lettering, logos or watermark anywhere in the frame.

## What Claude does with them

- Runs `node tools/install-reels.mjs <folder>`: each file is trimmed to 4 seconds, its sound removed and it is
  compressed for phones into `public/art/reels/`, and the list in `REELS` (`game/systems/projects.js`) updates itself.
- Shows the film on the card after the ribbon is cut: it plays once, muted, and stays on its last frame.
- If a type has no film yet, or the player has reduced motion turned on, the card shows the ribbon picture instead,
  so a card is never empty.
