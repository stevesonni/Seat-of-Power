# Attire packs: art brief

These eight looks are sold in two packs of four (₦300 each). They are for vanity: players want their governor to look loud, rich and glamorous. Go big on the style. Keep the person dignified, not a joke.

## Match the existing governor portraits
- **Use the same framing as `characters/governor-male-agbada.webp`:**
  - a portrait taller than wide;
  - head and body to the knees;
  - facing the viewer and standing;
  - the same lighting and painted style;
  - a plain, soft background.
- **Size:** at least 700 px tall. I convert and crop.
- **People:** all fictional.
- **Brands:** no real brand logos (no designer monograms on bags, belts or shades).
- **Symbols:** no party logos and no national coat of arms.
- **File names:** use `characters/governor-<look>.webp` with the names below. Any image format is fine; I convert.

## Glam Pack (`attire_glam`)
| File | Look |
|---|---|
| `governor-pink-power` | A woman, **all pink**: pink hair (a bob or long waves), a pink power suit or pink iro and buba, pink gele optional, pink heels, a pink clutch, a pearl necklace |
| `governor-pink-agbada` | A man in a flowing **pink agbada** with gold embroidery, a matching pink fila, pink shoes, a confident smile |
| `governor-owambe-queen` | A woman in **gold aso-oke** iro and buba with a towering gele, coral beads and a gold fan, dressed for a party |
| `governor-owambe-king` | A man in a **gold aso-oke agbada** and fila with coral beads and a walking stick, dressed for a party |

## Big Boy Pack (`attire_bigboy`)
| File | Look |
|---|---|
| `governor-big-boy` | A man in a crisp **white agbada**, several **thick gold chains**, dark **sunglasses**, gold rings and a big gold wristwatch |
| `governor-odogwu` | A man in a sharp fitted three-piece suit, one heavy **gold chain**, a **gold watch** and **shades**, with his arms folded |
| `governor-big-girl` | A woman in a bold power suit with **oversized shades**, gold hoops and a gold chain, holding a designer-style bag with no logo |
| `governor-lagos-baddie` | A woman in a bold, elegant gown in a strong colour, **shades** pushed up into her hair and layered **gold chains**, posing like a star |

## When the pictures arrive
1. I convert each picture to 700 px tall and place it in `public/art/characters/`.
2. I set `ready: true` for that look in `ATTIRE` (`game/seat-of-power.jsx`).
3. You create the two products in Vatar (see `docs/VATAR.md`).
