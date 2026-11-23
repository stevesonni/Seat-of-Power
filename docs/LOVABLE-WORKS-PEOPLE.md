# Lovable art: small works, and more faces

Two sets. The game already uses both: until a picture arrives it shows a stand-in, and when you drop a file in, the game picks it up by itself. Nothing else needs changing.

## Rules (as docs/LOVABLE-DECISIONS.md)
- **Style:** painted, warm and semi-realistic, the same as the other cards. Not 3D, not photographic.
- **Setting:** Nigeria as it really looks: a local government town, a market, a village, a state capital.
- **What must not appear:**
  - real people or real politicians;
  - readable words, logos or party symbols;
  - coats of arms, seals, or flags with a crest. A plain green-white-green flag is fine.
  - Uniforms and work clothes must be invented: plain colours, no company names, badges or insignia.
- **Mood:** honest work in progress. Nobody hurt, nothing gory.

---

## Set 1: small works (14 pictures)

These are the small jobs a governor now gives to a contractor: the neighbourhood jobs, the quick wins, and the building choices in a state's crisis stories. One picture each shows the job being done.

- **Format:** 1600×900 (16:9), WebP (or PNG), no transparency.
- **Framing:** keep the work in the middle 60%, because phones crop the edges.
- **Folder:** put every file in `public/art/works/`, named exactly as below.

1. `road-patching.webp`: *a work crew in plain orange vests patching a broken town road with fresh asphalt; a small roller, okadas waiting, a roadside kiosk.*
2. `pothole-repairs.webp`: *workers filling deep potholes on a busy road, with cones, a tipper truck of gravel, and buses squeezing past.*
3. `borehole-drilling.webp`: *a drilling rig on a lorry in a village square; children and women with jerrycans watch; a tank stand is half built.*
4. `hand-pump-repair.webp`: *two technicians repairing an old village hand pump; a woman tests it and water gushes; buckets in a line.*
5. `drain-clearing.webp`: *workers shovelling silt and rubbish out of a concrete roadside drain before the rains; heaps of black silt and a wheelbarrow.*
6. `school-roof-repair.webp`: *carpenters putting new zinc sheets on a primary school roof; pupils in uniform watch from the yard; old rusty sheets stacked.*
7. `market-lights.webp`: *an evening market being cleaned and lit: workers fixing lamps on poles above the stalls, traders still selling, swept walkways.*
8. `streetlights.webp`: *a bucket truck and electricians installing solar streetlights along a town road at dusk; a few lights already glowing.*
9. `clinic-renovation.webp`: *a small health clinic being repainted and restocked: painters on a ladder, boxes of medicine carried in, a nurse at the door.*
10. `erosion-control.webp`: *a deep red gully in the South-East with workers building concrete drainage channels and terraces; houses near the edge.*
11. `flood-drainage.webp`: *a crew digging a wide drainage channel and raising house floors in a flood-hit town; mud lines still on the walls.*
12. `community-rebuild.webp`: *a town being rebuilt after an attack: new block houses going up, a small police post and a clinic under construction; families returning with bundles.*
13. `market-rebuild.webp`: *a burned market being rebuilt with new concrete stalls and a small fire station beside it; traders watch from the side.*
14. `grazing-reserve.webp`: *a grazing reserve being built away from farmland: water troughs and a borehole, fencing, herders and cattle arriving.*

---

## Set 2: more faces (66 portraits)

Commissioners, the President's ministers and neighbouring governors currently share only a handful of faces, so the same face shows up as different people. These portraits give each of them their own face.

- **Format:** 1024×1280 (portrait, 4:5), WebP (or PNG). Transparent background preferred, as the existing character art.
- **Framing:** head to waist, facing the viewer, the face in the top third.
- **Folder:** put every file in `public/art/people/`, named exactly as below.
- **Moods:** each person comes three times, the same person in the same clothes: neutral (no suffix), pleased (`-pleased`), and worried (`-worried`; for governors, `-angry`).
- **Mix:** a real Nigerian spread: Yoruba, Igbo, Hausa-Fulani, South-South, Middle Belt; ages 35 to 70; dress from suits to agbada, babariga, isiagu, kaftan, buba and wrapper, gele and hijab.

**Commissioners and ministers: 16 people × 3 moods = 48 files**
- Men: `official-m-01.webp` to `official-m-08.webp`, each with `official-m-01-pleased.webp` and `official-m-01-worried.webp`, and so on.
- Women: `official-f-01.webp` to `official-f-08.webp`, each with `-pleased` and `-worried`.

**Governors: 6 people × 3 moods = 18 files**
- Men: `governor-m-01.webp` to `governor-m-03.webp`, each with `-pleased` and `-angry`.
- Women: `governor-f-01.webp` to `governor-f-03.webp`, each with `-pleased` and `-angry`.
- They should look like governors: more formal, more senior, with an aide or a plain flag behind them at most.

The game switches to the new faces once `official-m-01.webp` is there, so send the whole of Set 2 together.
