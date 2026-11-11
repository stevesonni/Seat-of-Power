# Lovable art: the mailbox (Pack 31)

**Installed (Pack 31, 11 November 2026).** In the game: `mailbox-open`, `mailbox-closed`, `mail-edge-cream` and
`mail-edge-brown` (`MailboxStand` in `game/seat-of-power.jsx`). Two files were left out after a look in the game:
the glow looked odd around the box, and the lip layer was not needed: the letters now pop out of the slot toward the player in
perspective, clipped to the opening, with a shadow on the box (like the reference). The old wooden tray (`mailbox-tray.webp`) is
retired. Tests: `tests/e2e/mail.mjs` (the year's letters arrive in the mailbox and are answered through Next
message), `tests/art-usage.test.mjs`.

The letter list on the Desk goes away. In its place is one mailbox, standing in the bottom-right corner of the
screen. The mailbox is where players see their mail:

- **Mail waiting:** the mailbox is open and the letters stick out of its mouth. On the edge of each letter is
  its wax seal, so the player can tell at a glance what it is: purple top hat for the godfather, blue for the
  budget, red for a crisis, and so on.
- **No mail:** the mailbox is closed. Nothing sticks out.
- Beside it, Claude draws the count ("3 unread") and a **Next message** button. Tapping the button, or a letter,
  opens the next letter.

This pack is the mailbox and the letter edges. **The wax seals already exist** (30 of them, in
`public/art/icons/seal-*.webp`, for example `seal-godfather.webp`, the purple seal with the top hat). Do not
draw seals: Claude presses the right one onto each letter edge in code.

## Style

The same painted, realistic look as the mail art already in the game. See:
- `public/art/objects/mailbox-tray.webp`: the polished wooden letter tray with brass trim;
- `public/art/objects/letter-sealed.webp`: the cream envelope with the red wax seal.

Soft light from the top left, a gentle shadow, rich but not glossy.

**The mailbox itself is ours, not the American kind** (no rounded US mailbox on a post, no red flag). It is a
**Nigerian Government House letter box**:
- a sturdy box of cast iron, painted deep Nigerian green (about #0b5d3b), with brass trim and brass rivets;
- a wide brass mail slot (the "mouth") across the upper front, with a hinged brass flap;
- standing on a short, square green pillar with a brass band at the top, like a grand post box at the gate of
  Government House;
- a small green-white rosette or ribbon on the side is fine.

Rules:
- No readable text anywhere: no words, numbers, "NIPOST", "POST" or initials. Claude writes the count.
- No real logos, coats of arms or seals. Nigeria's green-white is fine.
- No people, no hands.
- WebP files with transparent backgrounds.

## Size and framing

All four mailbox files share **one canvas: 1024 × 1024**, with the mailbox in **exactly the same place and
size** in each, so they line up perfectly when stacked:
- the mailbox seen from the front and slightly to the left (three-quarter view, as if the player stands in front
  of it);
- the mailbox filling about 80% of the height, with its base touching the bottom of the canvas;
- the mouth (mail slot) in the upper third, facing the viewer.

On a phone it is shown about 140 pixels wide, so the shape must read clearly when small: a strong silhouette,
the mouth clearly visible.

## The files · public/art/objects/

| File | What it shows |
|---|---|
| mailbox-closed.webp | The mailbox with the brass flap **shut** over the mouth. Empty. This is "no mail". |
| mailbox-open.webp | The same mailbox with the flap **lifted up and open**, the mouth a dark opening. **Nothing inside.** Claude puts the letters in the mouth. |
| mailbox-open-lip.webp | **Only the front lower edge of the open mouth** (the brass rim and the front wall just below it), on the same canvas and in exactly the same place as in mailbox-open.webp. Everything else is transparent. Claude lays it over the letters, so they look tucked inside the box, not pasted on top. |
| mailbox-glow.webp | A soft warm-gold glow shaped around the open mouth, same canvas and position, transparent elsewhere. It pulses gently when a new or urgent letter arrives. |
| mail-edge-cream.webp | **One cream envelope seen end-on**, as if pulled half out of a slot: the top third of an envelope, tilted slightly, with its flap edge facing the viewer. **No seal** (Claude adds it). 512 × 320, transparent. Paper colour as in letter-sealed.webp. |
| mail-edge-brown.webp | The same, as a **brown official envelope** (the colour of `brown-envelope.webp`): for government letters such as the budget, the courts and Abuja. 512 × 320, transparent. |

That is 6 files.

**On the two letter edges:** leave a clear, flat area about 120 × 120 pixels near the middle of the visible
edge, with nothing drawn on it, because that is where the wax seal goes. Claude shows up to three edges at once,
slightly fanned (one straight, one tilted left, one tilted right), each with its own seal.

## What Claude does with them (for reference)

- The mailbox stands in the bottom-right corner of the Desk, above the tab bar, on every year screen.
- Mail waiting: mailbox-open with up to three letter edges in the mouth (the most urgent in front), each with its
  seal, mailbox-open-lip over them, the count and the Next message button beside it. More than three letters:
  three edges and the full count.
- A new letter slides into the mouth from above; an urgent one makes the glow pulse.
- Next message (or tapping a letter) opens the most urgent letter in the existing letter view; when it is
  answered, its edge slides out and the next one moves to the front.
- No mail: mailbox-closed, with no count and no button.
- The old letter list is retired.
