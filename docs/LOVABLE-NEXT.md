# For Lovable: what to make next

Send each group as its own zip, with every file named exactly as listed. Any format is fine; I convert.

**Rules for every picture:**
- **Style:** the same painted style as the game's existing art.
- **People:** all fictional. No real politicians or lookalikes.
- **Symbols:** no real logos, no party logos and no national coat of arms.

---

## 1. Billboards painted into their scenes

Two scenes, 1600×1000. In each, a big roadside campaign billboard is **part of the painting**: steel pole, catwalk and trusses, with crowd, cars and lamp posts in front of the pole as the light falls.

**The billboard face**
- It is completely **blank**, flat white, with no text, faces or shadows on it. The game prints the poster there.
- It faces the viewer straight on (no perspective tilt) and is a clean rectangle with sharp corners.
- It covers exactly **x 10%–90%** and **y 6%–50%** of the picture, so both scenes line up.
- Nothing overlaps the face: no flags, poles, people or banners.

**The scenes**
- `scenes/billboard-street`: a state-capital street in harmattan haze, with rooftops, kiosks, keke and cars. Used for the campaign ticket.
- `scenes/billboard-rally`: the same billboard over a packed re-election rally, with an open-air stage at the side, crowd banners in plain colours, and people cheering. Leave the **bottom-left quarter calm** (crowd backs, no faces), because the party chairman stands there.

**The poster template (optional)**
- `objects/billboard-poster`: 1280×704, the same proportions as the face.
- It is a clean campaign poster layout with nothing written on it:
  - a diagonal colour band on the left (any colour; the game tints it);
  - a white area on the right;
  - room for two standing figures on the right, with a **name plate under each** (not over the faces);
  - a slogan line and a small VOTE box on the left.
