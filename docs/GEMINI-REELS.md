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
| dam.mp4 | Dam | A new concrete dam holding a broad reservoir, with water flowing down the spillway and green farmland below. A slow aerial sweep. |
| power.mp4 | Power plant | A new solar farm and small power station at the edge of a town. Streetlights in the town flick on as dusk falls. The camera rises over the panels. |
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

- Puts the files in `public/art/reels/` and lists each project type in `REELS` (`game/systems/projects.js`).
- Shows the film on the card after the ribbon is cut: it plays once, muted, and stays on its last frame.
- If a type has no film yet, or the player has reduced motion turned on, the card shows the ribbon picture instead,
  so a card is never empty.
