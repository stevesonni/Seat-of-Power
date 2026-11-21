# Lovable art: ultramodern classroom blocks

The governor can now build ultramodern classroom blocks (the programme "Build Ultramodern Classroom Blocks"). It is the fix for the need "Pupils in … sit on the floor". Until the pictures arrive, the game borrows `decisions/edu_compulsory`.

## Rules
The same rules as docs/LOVABLE-DECISIONS.md:
- Painted, warm, semi-realistic style; not 3D.
- 1600×900 (16:9), WebP or PNG, no transparency. Keep the subject in the middle 60%.
- Nigeria. No real people, no readable words, logos, party symbols or crest.

## The pictures
1. `decisions/classrooms.webp`: the decision card and its result.
   - Prompt: *A newly built single-storey classroom block in a Nigerian public primary school: cream walls, a green roof, louvred windows, a covered walkway and a small solar panel on the roof. Through an open door, rows of new wooden desks; pupils in school uniforms carry their bags in, smiling. A teacher stands by the door. Bright morning light, red-earth schoolyard, a flag in the background.*
2. `scenes/classroom-floor-before.webp` (optional): the "sit on the floor" need.
   - Prompt: *Inside an old, dim Nigerian public classroom with a damaged roof letting light through, pupils in uniforms sitting on the bare concrete floor writing in exercise books on their laps; a cracked chalkboard; a teacher crouching to help one pupil. Sympathetic, not miserable.*
3. `scenes/classroom-commissioning.webp` (optional): the ribbon-cutting when the blocks are finished.
   - Prompt: *A school compound decorated with green and white ribbons; a governor (generic, seen from the side or behind, in agbada or a suit) cuts a ribbon at the door of a new classroom block while pupils in uniform clap and parents watch.*

## When they arrive
- Put `classrooms.webp` in `public/art/decisions/` and add `"classrooms"` to `DEC_ART`.
- Remove the `classrooms: "edu_compulsory"` alias in game/seat-of-power.jsx.
- The two optional scenes need a short code change to show (the need's picture and the completion card).
